import { Router } from 'express';
import { select } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { school, limit = 50 } = req.query;
    let options = {
      order: { by: 'total_points', direction: 'desc' },
      limit: parseInt(limit)
    };
    if (school) {
      options.where = { school };
    }
    const users = await select('users', 'id, full_name, school, streak, total_points', options);
    const ranked = users.map((u, i) => ({
      rank: i + 1,
      name: u.full_name || 'Anonymous',
      school: u.school || '',
      streak: u.streak || 0,
      points: u.total_points || 0
    }));
    res.json({ leaderboard: ranked });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/schools', async (req, res) => {
  try {
    const users = await select('users', 'school', {
      not: { school: '' },
      order: { by: 'school', direction: 'asc' }
    });
    const schools = [...new Set(users.map(u => u.school).filter(Boolean))];
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const atts = await select('simulation_attempts', '*, simulations!left(title)', {
      where: { status: 'in_progress' },
      order: { by: 'started_at', direction: 'desc' },
      limit: 20
    });
    const activities = atts.map(a => ({
      id: a.id,
      user_name: a.user_id,
      simulation_title: a.simulations?.title || 'a challenge',
      type: 'challenge_started',
      created_at: a.started_at
    }));
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
