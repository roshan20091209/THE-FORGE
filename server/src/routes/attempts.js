import { Router } from 'express';
import { select, selectOne, insert, update, supabase } from '../db.js';
import { authenticateToken } from '../auth.js';
import { messageRateLimiter } from '../middleware/rateLimiter.js';
import { getTutorResponse, evaluateAttempt } from '../ai.js';

const router = Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { simulation_id } = req.body;
    if (!simulation_id) return res.status(400).json({ error: 'simulation_id required' });
    const sim = await selectOne('simulations', '*', { where: { id: simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    let user = await selectOne('users', 'id', { where: { id: req.user.id } });
    if (!user) {
      await supabase.from('users').upsert({ id: req.user.id, email: req.user.email, role: 'participant', streak: 0, total_points: 0 }, { onConflict: 'id' });
    }

    const attempts = await select('simulation_attempts', 'id', { where: { user_id: req.user.id, simulation_id }, order: { by: 'started_at', direction: 'desc' } });

    const data = await insert('simulation_attempts', {
      user_id: req.user.id, simulation_id,
      time_remaining_seconds: 86400,
      attempt_number: (attempts?.length || 0) + 1
    });
    res.status(201).json({ attempt: data[0] });
  } catch (err) {
    console.error('Create attempt error:', err);
    res.status(500).json({ error: err.message || 'Failed to create attempt' });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message || 'Failed to get attempt' });
  }
});

router.post('/:id/message', authenticateToken, messageRateLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Attempt not in progress' });

    const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    let history = attempt.ai_conversation_history;
    if (typeof history === 'string') history = JSON.parse(history);
    if (!Array.isArray(history)) history = [];
    history.push({ role: 'user', message, timestamp: new Date().toISOString() });

    const simObj = { title: sim.title, description: sim.description, problem_brief: sim.problem_brief, industry: sim.industry };
    const replyText = await getTutorResponse(simObj, message, history) || "That's a great question. Try breaking it down into smaller parts and see what you can figure out first. What do you think the first step should be?";

    history.push({ role: 'tutor', message: replyText, timestamp: new Date().toISOString() });
    await update('simulation_attempts', { ai_conversation_history: history }, { id: attempt.id });

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
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { solution_text } = req.body;
    if (!solution_text) return res.status(400).json({ error: 'Solution text required' });
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });
    await update('simulation_attempts', { status: 'submitted', submitted_at: new Date().toISOString(), solution_text }, { id: attempt.id });
    res.json({ message: 'Solution submitted', status: 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/evaluate', authenticateToken, async (req, res) => {
  try {
    const attempt = await selectOne('simulation_attempts', '*', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status !== 'submitted') return res.status(400).json({ error: 'Attempt must be submitted first' });

    const sim = await selectOne('simulations', '*', { where: { id: attempt.simulation_id } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    await update('simulation_attempts', { evaluation_status: 'evaluating' }, { id: attempt.id }).catch(() => {});

    const simObj = { title: sim.title, description: sim.description, problem_brief: sim.problem_brief, industry: sim.industry, difficulty: sim.difficulty };
    const evalResult = await evaluateAttempt(simObj, attempt);

    if (evalResult) {
      const existing = await selectOne('dimension_scores', 'id', { where: { attempt_id: attempt.id } });
      const scoreData = {
        attempt_id: attempt.id, user_id: attempt.user_id,
        wrong_and_recovered_score: evalResult.wrong_and_recovered?.score || 0,
        pressure_communication_score: evalResult.pressure_communication?.score || 0,
        mid_process_pivot_score: evalResult.mid_process_pivot?.score || 0,
        unblocking_agency_score: evalResult.unblocking_agency?.score || 0,
        ai_evaluation_notes: JSON.stringify(evalResult)
      };
      if (existing) await update('dimension_scores', scoreData, { attempt_id: attempt.id });
      else await insert('dimension_scores', scoreData);

      await update('simulation_attempts', {
        status: 'completed', evaluation_status: 'completed',
        evaluation_result: JSON.stringify(evalResult), evaluated_at: new Date().toISOString()
      }, { id: attempt.id }).catch(() => {});

      try {
        const cur = await selectOne('users', 'total_points, streak', { where: { id: req.user.id } });
        const newPoints = (cur?.total_points || 0) + 10;
        const newStreak = (cur?.streak || 0) + 1;
        await update('users', { total_points: newPoints, streak: newStreak }, { id: req.user.id });
        await update('simulation_attempts', { points_earned: 10 }, { id: attempt.id }).catch(() => {});
      } catch (e) { console.error('Failed to update points:', e.message); }

      res.json({ status: 'completed', evaluation: evalResult });
    } else {
      await update('simulation_attempts', { evaluation_status: 'failed' }, { id: attempt.id }).catch(() => {});
      res.json({ status: 'failed', message: 'AI evaluation failed. Please try again.' });
    }
  } catch (err) {
    console.error('Evaluate endpoint error:', err);
    await update('simulation_attempts', { evaluation_status: 'failed' }, { id: req.params.id }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/evaluation', authenticateToken, async (req, res) => {
  try {
    const attempt = await selectOne('simulation_attempts', 'status, evaluation_status, evaluation_result, evaluated_at', { where: { id: req.params.id } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    if (attempt.evaluation_status === 'evaluating') {
      return res.json({ status: 'evaluating', message: 'Analyzing your solution...' });
    }
    if (attempt.evaluation_status !== 'completed' && attempt.status !== 'completed') {
      return res.json({ status: 'pending', message: 'Not yet evaluated' });
    }

    const scores = await selectOne('dimension_scores', '*', { where: { attempt_id: req.params.id } });
    const evalResult = attempt.evaluation_result ? JSON.parse(attempt.evaluation_result) : null;

    res.json({
      status: 'completed',
      evaluated_at: attempt.evaluated_at,
      scores: scores ? {
        wrong_and_recovered: { score: scores.wrong_and_recovered_score, ...(evalResult?.wrong_and_recovered || {}) },
        pressure_communication: { score: scores.pressure_communication_score, ...(evalResult?.pressure_communication || {}) },
        mid_process_pivot: { score: scores.mid_process_pivot_score, ...(evalResult?.mid_process_pivot || {}) },
        unblocking_agency: { score: scores.unblocking_agency_score, ...(evalResult?.unblocking_agency || {}) },
      } : (evalResult || null),
      evaluation: evalResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
