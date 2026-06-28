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

export default router;
