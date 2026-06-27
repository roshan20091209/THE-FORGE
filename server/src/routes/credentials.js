import { Router } from 'express';
import { select, selectOne, insert, getSupabase } from '../db.js';
import { authenticateToken } from '../auth.js';
import { generateCredentialSummary } from '../ai.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authenticateToken, async (req, res) => {
  const { attempt_id } = req.body;
  if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });
  const attempt = await selectOne('simulation_attempts', '*', { where: { id: attempt_id } });
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  if (attempt.status !== 'completed') return res.status(400).json({ error: 'Attempt must be completed' });

  const scores = await selectOne('dimension_scores', '*', { where: { attempt_id } });
  if (!scores) return res.status(400).json({ error: 'Evaluation not found' });

  const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
  const user = await selectOne('users', '*', { where: { id: req.user.id } });
  const slug = uuidv4().slice(0, 8);

  const summary = await generateCredentialSummary(
    { full_name: user?.full_name, email: user?.email },
    { title: sim?.title, industry: sim?.industry },
    {
      wrong_and_recovered_score: scores.wrong_and_recovered_score,
      pressure_communication_score: scores.pressure_communication_score,
      mid_process_pivot_score: scores.mid_process_pivot_score,
      unblocking_agency_score: scores.unblocking_agency_score
    }
  );

  await insert('credentials', { user_id: req.user.id, attempt_id, credential_slug: slug });
  res.status(201).json({ credential: { slug, summary } });
});

router.get('/', authenticateToken, async (req, res) => {
  const credentials = await select('credentials', '*, simulation_attempts!inner(simulation_id, simulations!inner(title, industry))', {
    where: { user_id: req.user.id },
    order: { by: 'created_at', direction: 'desc' }
  });
  res.json({ credentials: credentials.map(c => ({
    ...c,
    simulation_title: c.simulation_attempts?.simulations?.title,
    industry: c.simulation_attempts?.simulations?.industry,
    simulation_attempts: undefined
  })) });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  let cred = await selectOne('credentials', '*', { where: { credential_slug: id } });
  if (!cred) cred = await selectOne('credentials', '*', { where: { id } });
  if (!cred) return res.status(404).json({ error: 'Credential not found' });

  const sb = getSupabase();
  await sb.from('credentials').update({ view_count: (cred.view_count || 0) + 1 }).eq('id', cred.id);

  const scores = await selectOne('dimension_scores', '*', { where: { attempt_id: cred.attempt_id } });
  const attempt = await selectOne('simulation_attempts', '*', { where: { id: cred.attempt_id } });
  const sim = attempt ? await selectOne('simulations', '*', { where: { id: attempt.simulation_id } }) : null;
  const user = await selectOne('users', 'id, email, full_name', { where: { id: cred.user_id } });

  res.json({
    credential: { id: cred.id, slug: cred.credential_slug, view_count: (cred.view_count || 0) + 1, created_at: cred.created_at, is_public: cred.is_public },
    user: user || null,
    simulation: sim ? { title: sim.title, industry: sim.industry, difficulty: sim.difficulty, description: sim.description } : null,
    scores: scores ? {
      wrong_and_recovered: scores.wrong_and_recovered_score,
      pressure_communication: scores.pressure_communication_score,
      mid_process_pivot: scores.mid_process_pivot_score,
      unblocking_agency: scores.unblocking_agency_score,
      overall_percentile: scores.overall_percentile,
      notes: scores.ai_evaluation_notes
    } : null
  });
});

export default router;
