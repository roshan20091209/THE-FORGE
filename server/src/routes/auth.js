import { Router } from 'express';
import { selectOne, insert, supabase } from '../db.js';
import { hashPassword, comparePassword, signUpWithEmail, signInWithEmail, signInWithGoogle, verifyToken, authenticateToken, signLocalToken } from '../auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const cleanName = (full_name || '').replace(/<[^>]*>/g, '').trim().slice(0, 100);

  const existing = await selectOne('users', 'id', { where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  try { await signUpWithEmail(email, password); }
  catch (err) { return res.status(400).json({ error: err.message }); }

  const { data } = await signInWithEmail(email, password);
  const hash = hashPassword(password);
  await supabase.from('users').upsert({ id: data.user.id, email, password_hash: hash, full_name: cleanName }, { onConflict: 'email' });

  const user = await selectOne('users', 'id, email, full_name, role', { where: { email } });
  res.status(201).json({ token, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  let supabaseResult;
  try { supabaseResult = await signInWithEmail(email, password); }
  catch { supabaseResult = null; }

  if (!supabaseResult) {
    const localUser = await selectOne('users', '*', { where: { email } });
    if (!localUser || !comparePassword(password, localUser.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });
    const localToken = signLocalToken(localUser);
    return res.json({ token: localToken, user: { id: localUser.id, email: localUser.email, full_name: localUser.full_name, role: localUser.role } });
  }

  const token = supabaseResult.session.access_token;
  const sb = getSupabase(token);
  let user = await selectOne('users', 'id, email, full_name, role', { where: { email } });
  if (!user) {
    const newUsers = await insert('users', { id: supabaseResult.user.id, email, full_name: supabaseResult.user.user_metadata?.full_name || '' }, token);
    user = newUsers?.[0] || await selectOne('users', 'id, email, full_name, role', { where: { id: supabaseResult.user.id } });
    return res.json({ token, user });
  }
  res.json({ token, user });
});

router.post('/google', async (req, res) => {
  try {
    const data = await signInWithGoogle();
    res.json({ url: data.url });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/callback', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'No token provided' });
  const supaUser = await verifyToken(access_token);
  if (!supaUser) return res.status(401).json({ error: 'Invalid token' });

  const sb = getSupabase(access_token);
  let user = await selectOne('users', 'id, email, full_name, role', { where: { email: supaUser.email } });
  if (!user) {
    const { data, error } = await sb.from('users').insert({
      id: supaUser.id, email: supaUser.email,
      full_name: supaUser.user_metadata?.full_name || supaUser.email,
      avatar_url: supaUser.user_metadata?.avatar_url || null
    }).select();
    if (!error && data?.length) user = data[0];
  }
  res.json({ token: access_token, user });
});

router.get('/me', authenticateToken, async (req, res) => {
  const user = await selectOne('users', 'id, email, full_name, role, avatar_url, created_at', { where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name } = req.body;
  await supabase.from('users').update({ full_name }).eq('id', req.user.id);
  res.json({ message: 'Profile updated' });
});

export default router;
