const ipCounts = new Map();
const WINDOW_MS = 60000;
const MAX_REQS = 60;

export function generalRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [k, v] of ipCounts) { if (now - v.ts > WINDOW_MS) ipCounts.delete(k); }
  const data = ipCounts.get(ip) || { count: 0, ts: now };
  if (data.count >= MAX_REQS) return res.status(429).json({ error: 'Too many requests. Try again later.' });
  data.count++;
  data.ts = now;
  ipCounts.set(ip, data);
  next();
}

const authCounts = new Map();
const AUTH_WINDOW_MS = 900000;
const AUTH_MAX = 10;

export function authRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [k, v] of authCounts) { if (now - v.ts > AUTH_WINDOW_MS) authCounts.delete(k); }
  const data = authCounts.get(ip) || { count: 0, ts: now };
  if (data.count >= AUTH_MAX) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  data.count++;
  data.ts = now;
  authCounts.set(ip, data);
  next();
}

const msgCooldowns = new Map();
const MSG_COOLDOWN_MS = 25000;

export function messageRateLimiter(req, res, next) {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const lastMsg = msgCooldowns.get(userId) || 0;
  if (now - lastMsg < MSG_COOLDOWN_MS) {
    const retryAfter = Math.ceil((MSG_COOLDOWN_MS - (now - lastMsg)) / 1000);
    return res.status(429).json({ error: `Please wait ${retryAfter}s before sending another message.` });
  }
  msgCooldowns.set(userId, now);
  next();
}
