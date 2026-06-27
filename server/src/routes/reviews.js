import { Router } from 'express';
import { select, selectOne, insert } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/pending', authenticateToken, async (req, res) => {
  const reviewed = await select('peer_reviews', 'attempt_id', { where: { reviewer_id: req.user.id } });
  const reviewedIds = reviewed.map(r => r.attempt_id);

  let query = {
    where: { status: 'completed' },
    not: { user_id: req.user.id },
    limit: 10,
    order: { by: 'submitted_at', direction: 'desc' }
  };
  if (reviewedIds.length > 0) {
    const { getSupabase } = await import('../db.js');
    const sb = getSupabase();
    const { data, error } = await sb
      .from('simulation_attempts')
      .select('id, user_id, simulation_id, submitted_at')
      .eq('status', 'completed')
      .neq('user_id', req.user.id)
      .not('id', 'in', `(${reviewedIds.map(id => `"${id}"`).join(',')})`)
      .limit(10)
      .order('submitted_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const simIds = [...new Set(data.map(a => a.simulation_id))];
    const userIds = [...new Set(data.map(a => a.user_id))];
    const sims = await select('simulations', 'id, title', { where: { id: simIds } });
    const users = await select('users', 'id, full_name', { where: { id: userIds } });
    const simMap = Object.fromEntries(sims.map(s => [s.id, s.title]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));
    return res.json({ pending: data.map(a => ({ attempt_id: a.id, user_id: a.user_id, simulation_title: simMap[a.simulation_id], participant_name: userMap[a.user_id] })) });
  }

  const attempts = await select('simulation_attempts', 'id, user_id, simulation_id, submitted_at', query);
  const simIds = [...new Set(attempts.map(a => a.simulation_id))];
  const userIds = [...new Set(attempts.map(a => a.user_id))];
  const sims = await select('simulations', 'id, title', { where: { id: simIds } });
  const users = await select('users', 'id, full_name', { where: { id: userIds } });
  const simMap = Object.fromEntries(sims.map(s => [s.id, s.title]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));
  res.json({ pending: attempts.map(a => ({ attempt_id: a.id, user_id: a.user_id, simulation_title: simMap[a.simulation_id], participant_name: userMap[a.user_id] })) });
});

router.post('/', authenticateToken, async (req, res) => {
  const { attempt_id, wrong_and_recovered_rating, pressure_communication_rating, mid_process_pivot_rating, unblocking_agency_rating, review_text } = req.body;
  if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });
  const existing = await selectOne('peer_reviews', 'id', { where: { reviewer_id: req.user.id, attempt_id } });
  if (existing) return res.status(400).json({ error: 'Already reviewed' });
  await insert('peer_reviews', {
    reviewer_id: req.user.id, attempt_id,
    wrong_and_recovered_rating: wrong_and_recovered_rating || 3,
    pressure_communication_rating: pressure_communication_rating || 3,
    mid_process_pivot_rating: mid_process_pivot_rating || 3,
    unblocking_agency_rating: unblocking_agency_rating || 3,
    review_text: review_text || ''
  });
  res.status(201).json({ message: 'Review submitted' });
});

router.get('/:attemptId', async (req, res) => {
  const reviews = await select('peer_reviews', '*', { where: { attempt_id: req.params.attemptId } });
  res.json({ reviews });
});

export default router;
