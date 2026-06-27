import { Router } from 'express';
import { select, selectOne, insert, update } from '../db.js';
import { authenticateToken } from '../auth.js';
import { getAiManagerResponse, getCrisisInjection, evaluateAttempt } from '../ai.js';

const router = Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { simulation_id } = req.body;
    if (!simulation_id) return res.status(400).json({ error: 'simulation_id required' });
    const sim = await selectOne('simulations', '*', { where: { id: simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const active = await selectOne('simulation_attempts', 'id', { where: { user_id: req.user.id, simulation_id, status: 'in_progress' } });
    if (active) return res.status(400).json({ error: 'You already have an active attempt' });

    const duration = (sim.duration_hours || 72) * 3600;
    const data = await insert('simulation_attempts', { user_id: req.user.id, simulation_id, time_remaining_seconds: duration });
    res.status(201).json({ attempt: data[0] });
  } catch (err) {
    console.error('Create attempt error:', err);
    res.status(500).json({ error: err.message || 'Failed to create attempt' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    attempt.time_remaining_seconds = Math.max(0, attempt.time_remaining_seconds - elapsed);

    if (attempt.time_remaining_seconds === 0 && attempt.status === 'in_progress') {
      await update('simulation_attempts', { status: 'submitted', submitted_at: new Date().toISOString() }, { id: attempt.id });
      attempt.status = 'submitted';
    }
    res.json({ attempt });
  } catch (err) {
    console.error('Get attempt error:', err);
    res.status(500).json({ error: err.message || 'Failed to get attempt' });
  }
});

router.get('/active', authenticateToken, async (req, res) => {
  try {
    let attempts = await select('simulation_attempts', '*, simulations!left(title, industry, difficulty)', {
      where: { user_id: req.user.id, status: 'in_progress' },
      order: { by: 'started_at', direction: 'desc' }
    });
    attempts = attempts.map(a => {
      const elapsed = Math.floor((Date.now() - new Date(a.started_at).getTime()) / 1000);
      a.time_remaining_seconds = Math.max(0, a.time_remaining_seconds - elapsed);
      return { ...a, simulation_title: a.simulations?.title, industry: a.simulations?.industry, difficulty: a.simulations?.difficulty, simulations: undefined };
    });
    res.json({ attempts });
  } catch (err) {
    console.error('Get active attempts error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Attempt not in progress' });

    const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const history = attempt.ai_conversation_history || [];
    history.push({ role: 'user', message, timestamp: new Date().toISOString() });
    await update('simulation_attempts', { ai_conversation_history: JSON.stringify(history) }, { id: attempt.id });

    const simObj = { title: sim.title, problem_brief: sim.problem_brief, industry: sim.industry, duration_hours: sim.duration_hours };
    const replyText = await getAiManagerResponse(simObj, { ...attempt, ai_conversation_history: history }, message) || 'I am currently unavailable. Please try again later.';
    history.push({ role: 'ai_manager', message: replyText, timestamp: new Date().toISOString() });
    await update('simulation_attempts', { ai_conversation_history: JSON.stringify(history) }, { id: attempt.id });

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const attempt = await selectOne('simulation_attempts', 'ai_conversation_history', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    res.json({ messages: attempt.ai_conversation_history || [] });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { solution_text, solution_url } = req.body;
    if (!solution_text) return res.status(400).json({ error: 'Solution text required' });
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });
    await update('simulation_attempts', { status: 'submitted', submitted_at: new Date().toISOString(), solution_text, solution_url: solution_url || null }, { id: attempt.id });
    res.json({ message: 'Solution submitted', status: 'submitted' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/evaluate', authenticateToken, async (req, res) => {
  const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
  if (attempt.status !== 'submitted') return res.status(400).json({ error: 'Attempt must be submitted first' });

  const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
  if (!sim) return res.status(404).json({ error: 'Simulation not found' });

  res.json({ message: 'Evaluation started' });

  try {
    const simObj = { title: sim.title, problem_brief: sim.problem_brief, industry: sim.industry, duration_hours: sim.duration_hours };
    const evalResult = await evaluateAttempt(simObj, attempt);
    if (evalResult) {
      const existing = await selectOne('dimension_scores', 'id', { where: { attempt_id: attempt.id } });
      const scoreData = {
        attempt_id: attempt.id, user_id: attempt.user_id,
        wrong_and_recovered_score: evalResult.wrong_and_recovered.score,
        pressure_communication_score: evalResult.pressure_communication.score,
        mid_process_pivot_score: evalResult.mid_process_pivot.score,
        unblocking_agency_score: evalResult.unblocking_agency.score,
        ai_evaluation_notes: JSON.stringify(evalResult)
      };
      if (existing) await update('dimension_scores', scoreData, { attempt_id: attempt.id });
      else await insert('dimension_scores', scoreData);
      await update('simulation_attempts', { status: 'completed' }, { id: attempt.id });
    }
  } catch (err) { console.error('Evaluation error:', err); }
});

router.get('/:id/evaluation', authenticateToken, async (req, res) => {
  try {
    const scores = await selectOne('dimension_scores', '*', { where: { attempt_id: req.params.id } });
    if (!scores) return res.status(404).json({ error: 'Evaluation not found' });
    res.json({
      scores: {
        wrong_and_recovered: { score: scores.wrong_and_recovered_score },
        pressure_communication: { score: scores.pressure_communication_score },
        mid_process_pivot: { score: scores.mid_process_pivot_score },
        unblocking_agency: { score: scores.unblocking_agency_score },
        overall_percentile: scores.overall_percentile,
        notes: scores.ai_evaluation_notes
      }
    });
  } catch (err) {
    console.error('Get evaluation error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/crisis/check', authenticateToken, async (req, res) => {
  try {
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const crisis = await getCrisisInjection({ title: sim.title, industry: sim.industry, duration_hours: sim.duration_hours }, attempt);
    if (crisis?.inject) {
      const crises = attempt.crisis_injections_received || [];
      crises.push({ type: crisis.crisis_type, message: crisis.crisis_message, severity: crisis.severity, injected_at: new Date().toISOString() });
      await update('simulation_attempts', { crisis_injections_received: JSON.stringify(crises) }, { id: attempt.id });
      res.json({ crisis: { type: crisis.crisis_type, message: crisis.crisis_message, severity: crisis.severity } });
    } else {
      res.json({ crisis: null });
    }
  } catch (err) {
    console.error('Crisis check error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
