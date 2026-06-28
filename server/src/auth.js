import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xpsarcxyhvfxbmyvgocv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2FyY3h5aHZmeGJteXZnb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTk0NTksImV4cCI6MjA5ODEzNTQ1OX0.OEBQpEWJAgytJLq_U9iqjCcgLuwMZsocWLo_5OGXdCE';
const JWT_SECRET = process.env.JWT_SECRET || 'forge-og-production-secret-key-2024-min-32-chars';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signLocalToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role || 'participant' }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyLocalToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback` }
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function verifyToken(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const localUser = verifyLocalToken(token);
  if (localUser) {
    req.user = { id: localUser.id, email: localUser.email, role: localUser.role || 'participant' };
    req.token = token;
    return next();
  }

  verifyToken(token).then(user => {
    if (!user) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = { id: user.id, email: user.email, role: user.user_metadata?.role || 'participant' };
    req.token = token;
    next();
  });
}

export function getAuthedSupabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

export async function getSupabaseSession(token) {
  const { data } = await supabase.auth.getSession(token);
  return data?.session || null;
}

export { supabase };
export default supabase;
