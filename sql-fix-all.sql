-- ============================================================
-- THE FORGE - COMPLETE RESET (paste entire file, run once in Supabase SQL Editor)
-- ============================================================

-- 1. Add new columns for gamification & student features
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_navigator INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_simulations_completed INTEGER DEFAULT 0;

ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending';
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS evaluation_result TEXT;
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS evaluated_at TEXT;

ALTER TABLE credentials ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS overall_percentile TEXT;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS report_html TEXT;

-- 2. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Anyone can read simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can insert simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can update simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can delete simulations" ON simulations;
DROP POLICY IF EXISTS "Anyone can read attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can insert attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can update attempts" ON simulation_attempts;
DROP POLICY IF EXISTS "Anyone can read scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON dimension_scores;
DROP POLICY IF EXISTS "Anyone can read credentials" ON credentials;
DROP POLICY IF EXISTS "Anyone can insert credentials" ON credentials;

-- 4. Create permissive policies
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Anyone can read simulations" ON simulations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert simulations" ON simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update simulations" ON simulations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete simulations" ON simulations FOR DELETE USING (true);

CREATE POLICY "Anyone can read attempts" ON simulation_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attempts" ON simulation_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attempts" ON simulation_attempts FOR UPDATE USING (true);

CREATE POLICY "Anyone can read scores" ON dimension_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON dimension_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON dimension_scores FOR UPDATE USING (true);

CREATE POLICY "Anyone can read credentials" ON credentials FOR SELECT USING (true);
CREATE POLICY "Anyone can insert credentials" ON credentials FOR INSERT WITH CHECK (true);

-- 5. Seed simulations (3 difficulty levels for student-friendly challenges)
INSERT INTO simulations (id, title, description, industry, difficulty, duration_hours, problem_brief, created_by, is_public) VALUES
-- EASY (beginner) challenges
(
  '00000000-0000-0000-0000-000000000101',
  'Find the Bug',
  'A startup''s login page is broken. Users can''t sign up. Find the bug and fix it.',
  'Technology', 'beginner', 24,
  E'FitTrack has 500 daily signups — or it did until yesterday. Now the login page shows "Error 500" for every new user. The team is panicking.\n\nYour task: Figure out what went wrong and how to fix it.\n\nWhat you know:\n- The app was working fine until last night\n- A junior dev deployed a "small change" to the auth module\n- The error logs show: "TypeError: Cannot read property ''id'' of undefined" at auth.js:45\n- The database has 50K+ user records\n\nThis could be a missing null check, a broken database query, or a wrong API endpoint. Where do you start looking?',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000102',
  'Design a School Timetable App',
  'Your school needs a simple app to show the daily timetable. Design the core features and how it would work.',
  'Product Management', 'beginner', 24,
  E'Your school principal saw a cool timetable app at another school and wants one for yours. The current system: paper notices on the board that get lost or torn.\n\nYour task: Design what this app should do and how students would use it.\n\nConsider:\n- Students check it 3-4 times a day\n- Teachers need to update class schedules\n- Some classrooms get changed last minute\n- Not everyone has a smartphone (but most do)\n\nYou don''t need to code it. Just explain what features it needs and why.',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000103',
  'Help a Friend Choose a Career',
  'Your friend is good at 3 things but can''t decide what to study. Help them figure it out systematically.',
  'Consulting', 'beginner', 24,
  E'Your friend Ravi is in 12th grade and confused about what to do after school.\n\nHe is good at:\n1. Explaining things to people (friends always ask him for help)\n2. Maths and statistics (scores 85%+)\n3. Drawing and design (won school-level competitions)\n\nHe has 3 months to decide. His parents want him to do engineering. He is not sure.\n\nYour task: Create a simple framework Ravi can use to make this decision. What questions should he ask himself? How can he test each option without committing? What are the trade-offs?',
  '00000000-0000-0000-0000-000000000001', true
),
-- INTERMEDIATE challenges
(
  '00000000-0000-0000-0000-000000000201',
  'E-Commerce Checkout Disaster',
  'A growing online store has a 70% cart abandonment rate. Diagnose why and fix it.',
  'Technology', 'intermediate', 48,
  E'QuickCart is a small e-commerce platform doing 100 orders/day. But 7 out of 10 people who add items to cart never complete the purchase.\n\nThe founder is losing sleep over this. The industry average is 50% abandonment — QuickCart is at 70%.\n\nWhat you know:\n- Most people drop off at the payment page\n- The checkout has 5 steps\n- Mobile users abandon at 80% rate\n- Desktop users abandon at 55% rate\n- 60% of traffic is from mobile\n\nYour task: Identify the likely causes and propose specific fixes. What data would you want to see? What would you test first?',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000202',
  'School Cricket Team Selection',
  'Your school has 50 students trying out for 11 spots. Build a fair selection system.',
  'Operations', 'intermediate', 48,
  E'Your school cricket team has 50 students trying out for 11 spots. Last year, the selection was a mess — the captain picked his friends, and the team lost every match.\n\nThis year, the sports teacher wants a DATA-DRIVEN selection process. But there''s no data yet.\n\nYour task: Design a tryout process that is fair, objective, and produces the best team.\n\nConstraints:\n- Only 2 days for tryouts\n- Need to test batting, bowling, fielding, fitness\n- Some players are specialists (only batting or only bowling)\n- You need at least 3 bowlers and 1 wicket-keeper\n- Budget: Rs. 5,000 for the entire process\n\nHow would you evaluate 50 players in 2 days? What metrics would you track? How do you handle the politics of selection?',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000203',
  'Plan a College Fest on Zero Budget',
  'Your college fest committee has no budget but needs to organize a 2-day event. Figure it out.',
  'Product Management', 'intermediate', 48,
  E'You are the head of your college fest committee. The good news: everyone is excited. The bad news: the administration gave you ZERO budget this year.\n\nLast year''s fest cost Rs. 2 Lakhs. You need to match it or exceed it with Rs. 0.\n\nYour task: Create a plan to make this happen.\n\nWhat you have:\n- 20 committee members\n- College grounds and classrooms (free)\n- 2,000 students as potential audience\n- Local businesses that might sponsor\n- Social media (college has 5K Instagram followers)\n\nWhat you need:\n- Prize money for events (minimum Rs. 5,000)\n- Sound system, stage, decorations\n- Food and water for 2 days\n- Guest artists (optional but attractive)\n\nHow do you make this work? Be creative and practical.',
  '00000000-0000-0000-0000-000000000001', true
),
-- ADVANCED challenges
(
  '00000000-0000-0000-0000-000000000301',
  'Secure a School Management System',
  'Your school''s online portal was hacked. Student data was leaked. Design a security fix.',
  'Cybersecurity', 'advanced', 72,
  E'Your school launched a new online portal where students can view grades, attendance, and pay fees. Last week, someone broke in and leaked 200 students'' personal data (names, phone numbers, addresses).\n\nThe school is panicking. Parents are angry. The principal wants answers.\n\nYour task: Investigate the breach and design a secure system.\n\nWhat you know:\n- The portal was built by a local company for Rs. 50,000\n- Students log in with their roll number (no password!)\n- The "forgot password" link doesn''t exist\n- All data is stored in a single database without encryption\n- The school''s Wi-Fi network has no password\n\nThe tech team says "just add a password." That won''t fix everything. What else needs to change?',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000302',
  'Build a Study Group Matcher',
  'Design a system that matches students into effective study groups based on their strengths and weaknesses.',
  'Technology', 'advanced', 72,
  E'Your school wants to create a "study group program" where 4-5 students work together on subjects they struggle with. But random groups don''t work — one person ends up doing all the work.\n\nYour task: Design an algorithm and system that creates OPTIMAL study groups.\n\nData available:\n- Each student''s grades in 6 subjects (Math, Physics, Chemistry, English, CS, Biology)\n- Each student''s preferred study time (morning/evening/night)\n- Each student''s personality type (from a quiz)\n- Friend/enemy lists (who they work well with vs. who distracts them)\n\nConstraints:\n- Groups must have 4-5 members\n- Each group needs at least one strong student in every subject\n- No two people who marked each other as "enemy" in same group\n- Groups should be balanced overall (no "super groups" and "bad groups")\n- A student can only be in one group\n\nHow would you solve this? What data matters most? What trade-offs would you make?',
  '00000000-0000-0000-0000-000000000001', true
),
(
  '00000000-0000-0000-0000-000000000303',
  'Revive a Dying Instagram Page',
  'Your friend''s Instagram meme page has 10K followers but gets only 50 likes per post. Turn it around in 30 days.',
  'Marketing', 'advanced', 72,
  E'Your friend runs a "college memes" Instagram page with 10,000 followers. But engagement is terrible — only 50 likes per post when similar pages get 1,000+.\n\nThe page started 6 months ago, grew fast for 2 months, then flatlined. Your friend posts once a day but barely anyone sees it.\n\nYour task: Create a 30-day revival plan.\n\nCurrent reality:\n- 10K followers, 50 likes/post (0.5% engagement rate)\n- Competitors with similar content get 5-10% engagement\n- Most posts are reposted from other pages\n- No unique content or posts about the page''s own followers\n- 70% of followers are from the same city\n- No video content (IG Reels) — only static images\n- The account has been inactive for 3 days (your friend gave up)\n\nWhat would you do differently? Be specific about content strategy, posting schedule, hashtags, and community building. How do you get from 50 to 500 likes in 30 days?',
  '00000000-0000-0000-0000-000000000001', true
)
ON CONFLICT (id) DO NOTHING;

-- 6. Verify
SELECT 'Simulations:' AS label, count(*) FROM simulations
UNION ALL SELECT 'Columns updated:', 1;
