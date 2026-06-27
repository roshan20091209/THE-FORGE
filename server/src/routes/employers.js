import { Router } from 'express';
import { select, selectOne, supabase } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/candidates', authenticateToken, async (req, res) => {
  if (!['employer', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Not authorized' });
  const { industry, min_score, sort } = req.query;

  let query = supabase
    .from('dimension_scores')
    .select('*, users!inner(id, email, full_name), simulation_attempts!inner(simulation_id, simulations!inner(title, industry))');

  if (industry) query = query.eq('simulation_attempts.simulations.industry', industry);
  if (min_score) {
    const ms = parseInt(min_score);
    query = query.or(`wrong_and_recovered_score.gte.${ms},pressure_communication_score.gte.${ms},mid_process_pivot_score.gte.${ms},unblocking_agency_score.gte.${ms}`);
  }
  query = query.order(sort || 'overall_percentile', { ascending: false, nullsFirst: false });

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ candidates: (data || []).map(d => ({
    id: d.users?.id, email: d.users?.email, full_name: d.users?.full_name,
    wrong_and_recovered_score: d.wrong_and_recovered_score,
    pressure_communication_score: d.pressure_communication_score,
    mid_process_pivot_score: d.mid_process_pivot_score,
    unblocking_agency_score: d.unblocking_agency_score,
    overall_percentile: d.overall_percentile,
    simulation_title: d.simulation_attempts?.simulations?.title,
    industry: d.simulation_attempts?.simulations?.industry
  })) });
});

router.get('/analytics', authenticateToken, async (req, res) => {
  if (!['employer', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Not authorized' });

  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: totalAttempts } = await supabase.from('simulation_attempts').select('*', { count: 'exact', head: true });
  const { count: completedAttempts } = await supabase.from('simulation_attempts').select('*', { count: 'exact', head: true }).eq('status', 'completed');

  res.json({
    analytics: {
      total_users: totalUsers || 0,
      total_attempts: totalAttempts || 0,
      completed_attempts: completedAttempts || 0,
      avg_scores: [0, 0, 0, 0]
    }
  });
});

export default router;
