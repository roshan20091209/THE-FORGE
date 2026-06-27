-- ============================================================
-- THE FORGE - COMPREHENSIVE FIX (paste entire file, run once)
-- ============================================================

-- 1. Wipe all data clean (order matters for FK constraints)
DELETE FROM peer_reviews;
DELETE FROM credentials;
DELETE FROM dimension_scores;
DELETE FROM simulation_attempts;
DELETE FROM simulations;
DELETE FROM users;

-- 2. Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies (old names + new names)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Anyone can read public simulations" ON simulations;
DROP POLICY IF EXISTS "Admins can insert simulations" ON simulations;
DROP POLICY IF EXISTS "Admins can update simulations" ON simulations;
DROP POLICY IF EXISTS "Admins can delete simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can read simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can insert simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can update simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can delete simulations" ON simulations;
DROP POLICY IF EXISTS "Users can read own attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can read attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can insert attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can update attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Users can read own scores" ON dimension_scores;
DROP POLICY IF EXISTS "System can insert scores" ON dimension_scores;
DROP POLICY IF EXISTS "System can update scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can read scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON dimension_scores;
DROP POLICY IF EXISTS "Users can read own credentials" ON credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON credentials;
DROP POLICY IF EXISTS "Anyone can read credentials" ON credentials;
DROP POLICY IF EXISTS "Anyone can insert credentials" ON credentials;
DROP POLICY IF EXISTS "Users can read reviews for review queue" ON peer_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON peer_reviews;

-- 4. Recreate policies (permissive for demo — can lock down later)
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Anyone can read public simulations" ON simulations FOR SELECT USING (true);
CREATE POLICY "Admins can insert simulations" ON simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update simulations" ON simulations FOR UPDATE USING (true);
CREATE POLICY "Admins can delete simulations" ON simulations FOR DELETE USING (true);

CREATE POLICY "Anyone can read attempts" ON simulation_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attempts" ON simulation_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attempts" ON simulation_attempts FOR UPDATE USING (true);

CREATE POLICY "Anyone can read scores" ON dimension_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON dimension_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON dimension_scores FOR UPDATE USING (true);

CREATE POLICY "Anyone can read credentials" ON credentials FOR SELECT USING (true);
CREATE POLICY "Anyone can insert credentials" ON credentials FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reviews" ON peer_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON peer_reviews FOR INSERT WITH CHECK (true);

-- 5. Seed users (passwords: admin123, employer123, participant123)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@theforge.io',       '$2a$10$IoO0ohuYknbNc9vq6GDr/usqWRuozQwS/OLyw0SU7ZanLRa/ADtmm', 'Admin User',  'admin'),
  ('00000000-0000-0000-0000-000000000002', 'employer@theforge.dev',   '$2a$10$sVzhDQhMe7vr.5mI430UeOa6VaocijmYqAqUx9uUF6mbWsRSdj8XK', 'TechCorp HR', 'employer'),
  ('00000000-0000-0000-0000-000000000003', 'participant@theforge.dev', '$2a$10$6BfVUrwN5DMFnUJYBqyeAOEwNOv5GHReaKcyn2SuTNVAeK17m73nq', 'Alex Rivera', 'participant')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed simulations
INSERT INTO simulations (id, title, description, industry, difficulty, duration_hours, problem_brief, success_criteria, crisis_scenarios, created_by, is_public) VALUES
(
  '00000000-0000-0000-0000-000000000101',
  'Mobile App Performance Crisis',
  'Your startup mobile app is getting 1-star reviews due to slow load times. Users are abandoning the app after 3 seconds. You have 72 hours to diagnose and fix the core issues.',
  'Technology', 'intermediate', 72,
  E'Our fitness tracking app "FitPulse" launched 3 months ago and had 50,000 downloads. In the last week, reviews have tanked from 4.2 to 2.1 stars. Users complain the app is "unbearably slow" and "crashes during workouts."\n\nYour task: Diagnose the root cause, propose a fix, and implement a plan to recover our app store rating.\n\nContext:\n- React Native app with Node.js backend\n- PostgreSQL database with 500K+ user records\n- Image-heavy workout feed\n- Real-time workout tracking via WebSocket\n- Third-party APIs: Google Fit, Apple Health, Stripe\n\nThe CEO wants a full technical analysis and recovery plan within 72 hours.',
  '["Root cause identified","Fix proposed with timeline","Rating recovery strategy","Technical implementation plan"]',
  '["requirements_change","teammate_conflict","resource_constraint","client_complaint"]',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000102',
  'Data Pipeline Migration',
  'A fintech company needs to migrate their real-time transaction processing pipeline from legacy infrastructure to a modern cloud-native solution. Zero downtime required.',
  'Data Engineering', 'advanced', 48,
  E'FinFlow Inc. processes $2M in daily transactions. Their current pipeline was built 5 years ago and is failing under load. Transaction processing time has increased from 200ms to 4 seconds.\n\nYour task: Design a new data pipeline architecture that scales to handle 10x current volume with <100ms latency.\n\nCurrent stack:\n- Monolithic Java application\n- Oracle database (on-premise)\n- Custom message queue (built in-house, unreliable)\n- Manual deployment process\n\nTarget stack (your choice):\n- Kafka or similar for streaming\n- Cloud-native (AWS/GCP/Azure)\n- Real-time analytics capability\n- Automated CI/CD\n\nYou have 48 hours to present your migration plan to the CTO.',
  '["Architecture diagram","Migration strategy","Zero-downtime plan","Cost analysis","Team requirements"]',
  '["resource_constraint","client_complaint","requirements_change"]',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000103',
  'Hospital Emergency Response System',
  'A regional hospital needs to redesign their emergency response system after a near-fatal incident revealed critical communication gaps between departments.',
  'Healthcare', 'intermediate', 72,
  E'St. Mary\'s Hospital serves 200,000+ patients annually. During a recent code blue emergency, the response team took 8 minutes to assemble instead of the required 2 minutes. The investigation revealed:\n- Pagers frequently miss messages in basement levels\n- No unified dashboard showing bed availability\n- Lab results take 30+ minutes to reach ER doctors\n- Pharmacy and ER use different communication systems\n\nYour task: Design an integrated emergency response system that ensures sub-2-minute response times.\n\nThe hospital board wants a complete redesign proposal within 72 hours. Budget is constrained at $500K.',
  '["Communication gap analysis","System architecture","Integration plan","Budget breakdown","Implementation timeline"]',
  '["resource_constraint","teammate_conflict","client_complaint"]',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000104',
  'E-Commerce Platform Security Breach',
  'A growing e-commerce platform has suffered a data breach affecting 100K customers. You must lead the incident response and redesign the security architecture.',
  'Cybersecurity', 'advanced', 48,
  E'ShopStream, an e-commerce platform doing $10M/month in revenue, discovered unauthorized access to their customer database. The breach exposed:\n- Customer names, emails, and hashed passwords\n- Partial credit card numbers (last 4 digits)\n- Order history and shipping addresses\n\nThe breach was discovered when customers reported unauthorized login attempts.\n\nYour task:\n1. Contain the breach and secure the infrastructure\n2. Design a new security architecture\n3. Plan customer communication strategy\n4. Implement long-term security improvements\n\nThe CEO needs a full incident response plan within 48 hours. Legal team is standing by.',
  '["Incident containment verified","Security architecture designed","Customer communication plan","Long-term security roadmap","Compliance assessment"]',
  '["client_complaint","resource_constraint","requirements_change"]',
  '00000000-0000-0000-0000-000000000001', true
)
ON CONFLICT (id) DO NOTHING;

-- 7. Verify
SELECT 'Users:' AS label, count(*) FROM users
UNION ALL SELECT 'Simulations:', count(*) FROM simulations;
