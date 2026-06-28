import { Router } from 'express';
import { selectOne, insert, update, supabase } from '../db.js';
import { hashPassword, comparePassword, signUpWithEmail, signInWithEmail, signInWithGoogle, verifyToken, authenticateToken, signLocalToken } from '../auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, async (req, res) => {
  const { email, password, full_name, school, school_id, class_grade, section, roll_number, preferred_language } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const cleanName = (full_name || '').replace(/<[^>]*>/g, '').trim().slice(0, 100);
  const cleanSchool = (school || '').trim().slice(0, 100);

  const existing = await selectOne('users', 'id', { where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  try { await signUpWithEmail(email, password); }
  catch (err) { return res.status(400).json({ error: err.message }); }

  const { data } = await signInWithEmail(email, password);

  const existingUser = await selectOne('users', 'id', { where: { id: data.user.id } });
  const userData = {
    email, password_hash: hashPassword(password),
    full_name: cleanName, school: cleanSchool, role: 'participant',
    streak: 0, total_points: 0,
    school_id: school_id || null,
    class_grade: ['11', '12', 'other'].includes(class_grade) ? class_grade : null,
    section: section || null,
    roll_number: roll_number || null,
    preferred_language: ['tamil', 'english', 'hinglish'].includes(preferred_language) ? preferred_language : 'english',
    subscription_tier: 'free'
  };

  if (existingUser) {
    await update('users', userData, { id: data.user.id });
  } else {
    await supabase.from('users').upsert({ id: data.user.id, ...userData }, { onConflict: 'id' });
  }

  const user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, role, streak, total_points', { where: { email } });
  const token = data.session?.access_token;
  res.status(201).json({ token, user });
});

router.post('/login', authRateLimiter, async (req, res) => {
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
    return res.json({
      token: localToken,
      user: {
        id: localUser.id, email: localUser.email, full_name: localUser.full_name,
        school: localUser.school, school_id: localUser.school_id,
        class_grade: localUser.class_grade, section: localUser.section,
        roll_number: localUser.roll_number, preferred_language: localUser.preferred_language,
        subscription_tier: localUser.subscription_tier,
        role: localUser.role, streak: localUser.streak || 0,
        total_points: localUser.total_points || 0
      }
    });
  }

  const token = supabaseResult.session.access_token;
  let user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, role, streak, total_points', { where: { email } });
  if (!user) {
    try {
      await supabase.from('users').upsert({
        id: supabaseResult.user.id, email, full_name: supabaseResult.user.user_metadata?.full_name || '',
        role: 'participant', streak: 0, total_points: 0,
        preferred_language: 'english', subscription_tier: 'free'
      }, { onConflict: 'id' });
      user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, role, streak, total_points', { where: { id: supabaseResult.user.id } });
    } catch { user = { id: supabaseResult.user.id, email, full_name: '', role: 'participant', streak: 0, total_points: 0, preferred_language: 'english', subscription_tier: 'free' }; }
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
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'No token provided' });
    const supaUser = await verifyToken(access_token);
    if (!supaUser) return res.status(401).json({ error: 'Invalid token' });

    let user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, role, streak, total_points', { where: { email: supaUser.email } });
    if (!user) {
      try {
        await supabase.from('users').upsert({
          id: supaUser.id, email: supaUser.email,
          full_name: supaUser.user_metadata?.full_name || supaUser.email,
          avatar_url: supaUser.user_metadata?.avatar_url || null,
          role: 'participant', streak: 0, total_points: 0,
          preferred_language: 'english', subscription_tier: 'free'
        }, { onConflict: 'id' });
        user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, role, streak, total_points', { where: { id: supaUser.id } });
      } catch { user = { id: supaUser.id, email: supaUser.email, full_name: supaUser.email, role: 'participant', streak: 0, total_points: 0, preferred_language: 'english', subscription_tier: 'free' }; }
    }
    res.json({ token: access_token, user });
  } catch (err) {
    const { access_token } = req.body;
    const supaUser = access_token ? await verifyToken(access_token).catch(() => null) : null;
    res.json({ token: access_token, user: supaUser ? { id: supaUser.id, email: supaUser.email, full_name: supaUser.user_metadata?.full_name || supaUser.email, role: 'participant' } : null });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const user = await selectOne('users', 'id, email, full_name, school, school_id, class_grade, section, roll_number, preferred_language, subscription_tier, subscription_expires_at, daily_question_count, whatsapp_number, role, avatar_url, streak, total_points, created_at', { where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let subscription = null;
  if (user.subscription_tier && user.subscription_tier !== 'free') {
    const sub = await selectOne('subscriptions', 'tier, status, expires_at, features', {
      where: { user_id: req.user.id, status: 'active' }
    });
    if (sub) subscription = sub;
  }

  res.json({ user: { ...user, current_subscription: subscription } });
});

router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, school, school_id, class_grade, section, roll_number, preferred_language, whatsapp_number } = req.body;
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (school !== undefined) updates.school = school;
  if (school_id !== undefined) updates.school_id = school_id;
  if (class_grade !== undefined) updates.class_grade = class_grade;
  if (section !== undefined) updates.section = section;
  if (roll_number !== undefined) updates.roll_number = roll_number;
  if (preferred_language !== undefined) updates.preferred_language = preferred_language;
  if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number;
  await update('users', updates, { id: req.user.id });
  res.json({ message: 'Profile updated' });
});

export default router;
