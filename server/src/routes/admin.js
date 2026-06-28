import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { supabase, select } from '../db.js';

const router = Router();

router.use(authenticateToken);

async function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, school_id, subscription_tier } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('users').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (school_id) query = query.eq('school_id', school_id);
    if (subscription_tier) query = query.eq('subscription_tier', subscription_tier);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const { data: subData } = await supabase.from('subscriptions')
      .select('user_id, tier, status')
      .in('user_id', (data || []).map(u => u.id));

    const subscriptions = {};
    for (const s of subData || []) {
      subscriptions[s.user_id] = { tier: s.tier, status: s.status };
    }

    res.json({
      users: (data || []).map(u => ({
        ...u, password_hash: undefined,
        current_subscription: subscriptions[u.id] || { tier: 'free', status: 'active' }
      })),
      total: count || 0,
      page: parseInt(page),
      total_pages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/schools', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('schools')
      .select('*, textbooks(count), users!school_id(count)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ schools: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthStart = startOfMonth.toISOString().split('T')[0];

    const [
      { count: totalUsers },
      { count: totalTextbooks },
      { count: todayQuestions },
      { count: monthQuestions },
      { count: activeSubscriptions },
      { data: revenue }
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('textbooks').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id', { count: 'exact', head: true })
        .gte('created_at', today),
      supabase.from('conversations').select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('payments').select('amount').eq('status', 'completed')
    ]);

    const totalRevenue = (revenue || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      overview: {
        total_users: totalUsers || 0,
        total_textbooks: totalTextbooks || 0,
        today_questions: todayQuestions || 0,
        monthly_questions: monthQuestions || 0,
        active_subscriptions: activeSubscriptions || 0,
        total_revenue_inr: totalRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('payments')
      .select('*, users(email, full_name), subscriptions(tier)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    const monthlyRevenue = {};
    for (const p of data || []) {
      const month = p.created_at?.substring(0, 7);
      if (month) {
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
      }
    }

    res.json({
      payments: data || [],
      monthly_revenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/textbooks/approve', requireAdmin, async (req, res) => {
  try {
    const { textbook_id, action } = req.body;
    if (!textbook_id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'textbook_id and action (approve/reject) required' });
    }

    const { error } = await supabase.from('textbooks')
      .update({ indexing_status: action === 'approve' ? 'completed' : 'failed' })
      .eq('id', textbook_id);

    if (error) throw new Error(error.message);
    res.json({ message: `Textbook ${action}d` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
