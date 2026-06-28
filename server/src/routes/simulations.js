import { Router } from 'express';
import { select, selectOne, insert, update, remove } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const simulations = await select('simulations', '*, users!left(full_name)', {
    where: { is_public: true },
    order: { by: 'created_at', direction: 'desc' }
  });
  res.json({ simulations: simulations.map(s => ({ ...s, creator_name: s.users?.full_name || null, users: undefined })) });
});

router.get('/:id', async (req, res) => {
  const sim = await selectOne('simulations', '*', { where: { id: req.params.id } });
  if (!sim) return res.status(404).json({ error: 'Simulation not found' });
  res.json({ simulation: sim });
});

router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  const { title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios } = req.body;
  if (!title || !problem_brief) return res.status(400).json({ error: 'Title and problem brief required' });
  const data = await insert('simulations', {
    title, description, industry, difficulty: difficulty || 'intermediate',
    duration_hours: duration_hours || 72, problem_brief,
    success_criteria: success_criteria || '[]', crisis_scenarios: crisis_scenarios || '[]',
    created_by: req.user.id
  });
  res.status(201).json({ message: 'Simulation created', id: data[0]?.id });
});

router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  const { title, description, industry, difficulty, duration_hours, problem_brief, is_public } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (industry !== undefined) updates.industry = industry;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (duration_hours !== undefined) updates.duration_hours = duration_hours;
  if (problem_brief !== undefined) updates.problem_brief = problem_brief;
  if (is_public !== undefined) updates.is_public = is_public;
  await update('simulations', updates, { id: req.params.id });
  res.json({ message: 'Simulation updated' });
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  await remove('simulations', { id: req.params.id });
  res.json({ message: 'Simulation deleted' });
});

export default router;
