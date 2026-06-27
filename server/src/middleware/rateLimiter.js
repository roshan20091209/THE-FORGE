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
