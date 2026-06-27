import { Router } from 'express';
import { supabase } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.post('/sql', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL query required' });

  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH'))
    return res.status(400).json({ error: 'Only SELECT queries via REST API' });

  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (!tableMatch) return res.status(400).json({ error: 'Could not determine table' });
  const table = tableMatch[1];

  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(DESC|ASC)?/i);
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);

  let query = supabase.from(table).select('*');
  if (orderMatch) query = query.order(orderMatch[1], { ascending: (orderMatch[2] || 'ASC').toUpperCase() !== 'DESC' });
  if (limitMatch) query = query.limit(parseInt(limitMatch[1]));
  if (offsetMatch && limitMatch) query = query.range(parseInt(offsetMatch[1]), parseInt(offsetMatch[1]) + parseInt(limitMatch[1]) - 1);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  res.json({ columns, rows: data || [], rowCount: (data || []).length });
});

router.get('/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: simulations } = await supabase.from('simulations').select('*', { count: 'exact', head: true });
  const { count: attempts } = await supabase.from('simulation_attempts').select('*', { count: 'exact', head: true });
  const { count: reviews } = await supabase.from('peer_reviews').select('*', { count: 'exact', head: true });
  const { count: credentials } = await supabase.from('credentials').select('*', { count: 'exact', head: true });
  res.json({ stats: { users: { count: users || 0 }, simulations: { count: simulations || 0 }, attempts: { count: attempts || 0 }, reviews: { count: reviews || 0 }, credentials: { count: credentials || 0 } } });
});

router.post('/seed', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { count: existingSims } = await supabase.from('simulations').select('*', { count: 'exact', head: true });
    if (existingSims > 0) return res.json({ message: 'Data already seeded' });

    const { hashPassword } = await import('../auth.js');
    const hash = hashPassword('employer123');
    await supabase.from('users').upsert({ id: '00000000-0000-0000-0000-000000000002', email: 'employer@theforge.dev', password_hash: hash, full_name: 'TechCorp HR', role: 'employer' }, { onConflict: 'email' });
    await supabase.from('users').upsert({ id: '00000000-0000-0000-0000-000000000003', email: 'participant@theforge.dev', password_hash: hash, full_name: 'Alex Rivera', role: 'participant' }, { onConflict: 'email' });

    const sims = [
      { id: '00000000-0000-0000-0000-000000000101', title: 'Mobile App Performance Crisis', description: 'Your startup mobile app is getting 1-star reviews. Fix the core issues in 72 hours.', industry: 'Technology', difficulty: 'intermediate', duration_hours: 72, problem_brief: 'Our fitness tracking app "FitPulse" launched 3 months ago with 50,000 downloads. Reviews dropped from 4.2 to 2.1 stars. Users complain of crashes during workouts.\n\nDiagnose root cause, propose fix, recover rating.\n- React Native + Node.js\n- PostgreSQL with 500K+ records\n- Image-heavy workout feed\n- WebSocket real-time tracking\n- Google Fit, Apple Health, Stripe APIs', success_criteria: '["Root cause identified","Fix with timeline","Rating recovery strategy","Technical plan"]', crisis_scenarios: '["requirements_change","teammate_conflict","resource_constraint","client_complaint"]', created_by: req.user.id, is_public: true },
      { id: '00000000-0000-0000-0000-000000000102', title: 'Data Pipeline Migration', description: 'Migrate real-time transaction pipeline to cloud-native. Zero downtime.', industry: 'Data Engineering', difficulty: 'advanced', duration_hours: 48, problem_brief: 'FinFlow Inc processes $2M/day in transactions. Pipeline failing under load. Processing time increased from 200ms to 4s.\n\nDesign new architecture for 10x volume with <100ms latency.\n- Monolithic Java -> microservices\n- Oracle on-prem -> cloud-native\n- Custom MQ -> Kafka\n- Manual deploy -> CI/CD', success_criteria: '["Architecture diagram","Migration strategy","Zero-downtime plan","Cost analysis","Team requirements"]', crisis_scenarios: '["resource_constraint","client_complaint","requirements_change"]', created_by: req.user.id, is_public: true },
      { id: '00000000-0000-0000-0000-000000000103', title: 'Hospital Emergency Response System', description: 'Redesign emergency response after critical communication gaps between departments.', industry: 'Healthcate', difficulty: 'intermediate', duration_hours: 72, problem_brief: 'St. Mary\'s Hospital serves 200K+ patients. Code blue response took 8 min vs required 2 min.\n\nDesign integrated system for sub-2-minute response. Budget $500K.\n- Pagers miss messages in basement\n- No unified bed dashboard\n- Lab results take 30+ min to ER\n- Pharmacy and ER use different systems', success_criteria: '["Communication gap analysis","System architecture","Integration plan","Budget breakdown","Timeline"]', crisis_scenarios: '["resource_constraint","teammate_conflict","client_complaint"]', created_by: req.user.id, is_public: true },
      { id: '00000000-0000-0000-0000-000000000104', title: 'E-Commerce Platform Security Breach', description: 'Lead incident response after data breach affecting 100K customers.', industry: 'Cybersecurity', difficulty: 'advanced', duration_hours: 48, problem_brief: 'ShopStream ($10M/month) discovered unauthorized database access.\n\nExposed: names, emails, hashed passwords, partial CC numbers.\n\nTasks: contain breach, design security architecture, plan customer communication, implement improvements.\n\n48 hours for full incident response plan.', success_criteria: '["Incident containment","Security architecture","Customer communication","Security roadmap","Compliance"]', crisis_scenarios: '["client_complaint","resource_constraint","requirements_change"]', created_by: req.user.id, is_public: true }
    ];

    for (const sim of sims) {
      const { error } = await supabase.from('simulations').insert(sim);
      if (error) throw new Error(`Failed to insert ${sim.title}: ${error.message}`);
    }

    res.json({ message: 'Seed data created successfully', simulations: 4, users: 2 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
