-- ============================================================
-- OSM-BRO FORGE V2 — Complete Supabase Schema
-- CBSE Class 12 Study AI Platform
-- ============================================================

-- 0. Clean slate — safe to run repeatedly
-- ============================================================

-- 1. Schools
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  board VARCHAR NOT NULL DEFAULT 'state' CHECK (board IN ('state', 'cbse', 'icse', 'other')),
  location VARCHAR,
  address TEXT,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'pending_verification')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read schools" ON schools;
CREATE POLICY "Anyone can read schools" ON schools FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert schools" ON schools;
CREATE POLICY "Admins can insert schools" ON schools FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update schools" ON schools;
CREATE POLICY "Admins can update schools" ON schools FOR UPDATE USING (true);

-- 2. Textbooks & Chapters
-- ============================================================
CREATE TABLE IF NOT EXISTS textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  subject VARCHAR NOT NULL,
  grade VARCHAR NOT NULL CHECK (grade IN ('11', '12')),
  title VARCHAR NOT NULL,
  author VARCHAR,
  publisher VARCHAR,
  year INT,
  file_path VARCHAR,
  file_size INT,
  page_count INT,
  indexing_status VARCHAR NOT NULL DEFAULT 'pending' CHECK (indexing_status IN ('pending', 'processing', 'completed', 'failed')),
  indexed_at TIMESTAMP,
  total_chunks INT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE textbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own school textbooks" ON textbooks;
CREATE POLICY "Users can read own school textbooks" ON textbooks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert textbooks" ON textbooks;
CREATE POLICY "Users can insert textbooks" ON textbooks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update textbooks" ON textbooks;
CREATE POLICY "Admins can update textbooks" ON textbooks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admins can delete textbooks" ON textbooks;
CREATE POLICY "Admins can delete textbooks" ON textbooks FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
  chapter_number INT,
  chapter_name VARCHAR,
  page_start INT,
  page_end INT,
  topics JSONB DEFAULT '[]',
  importance_weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read chapters" ON chapters;
CREATE POLICY "Anyone can read chapters" ON chapters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert chapters" ON chapters;
CREATE POLICY "Users can insert chapters" ON chapters FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS textbook_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
  chunk_index INT,
  page_number INT,
  chapter_name VARCHAR,
  section_name VARCHAR,
  content_preview TEXT,
  vector_id VARCHAR,
  embedding_model VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE textbook_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read textbook chunks" ON textbook_chunks;
CREATE POLICY "Anyone can read textbook chunks" ON textbook_chunks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert textbook chunks" ON textbook_chunks;
CREATE POLICY "Users can insert textbook chunks" ON textbook_chunks FOR INSERT WITH CHECK (true);

-- 3. Question Papers & Q&A
-- ============================================================
CREATE TABLE IF NOT EXISTS question_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  textbook_id UUID REFERENCES textbooks(id),
  exam_type VARCHAR NOT NULL CHECK (exam_type IN ('unit_test', 'quarterly', 'half_yearly', 'annual', 'osm')),
  year INT,
  month INT,
  file_path VARCHAR,
  extracted_questions JSONB DEFAULT '[]',
  marking_scheme JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read question papers" ON question_papers;
CREATE POLICY "Anyone can read question papers" ON question_papers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert question papers" ON question_papers;
CREATE POLICY "Users can insert question papers" ON question_papers FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_paper_id UUID REFERENCES question_papers(id) ON DELETE CASCADE,
  textbook_id UUID REFERENCES textbooks(id),
  chapter_id UUID REFERENCES chapters(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR NOT NULL DEFAULT 'short' CHECK (question_type IN ('mcq', 'short', 'long', 'essay', 'project', 'practical')),
  marks INT DEFAULT 2,
  difficulty VARCHAR DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_answer_format TEXT,
  model_answer TEXT,
  page_reference VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read questions" ON questions;
CREATE POLICY "Anyone can read questions" ON questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert questions" ON questions;
CREATE POLICY "Users can insert questions" ON questions FOR INSERT WITH CHECK (true);

-- Conversations (QA Log)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR,
  question TEXT,
  answer TEXT,
  answer_source VARCHAR CHECK (answer_source IN ('textbook', 'generated', 'not_in_syllabus')),
  page_references JSONB DEFAULT '[]',
  confidence_score FLOAT,
  marks_requested INT,
  mode VARCHAR DEFAULT 'direct' CHECK (mode IN ('direct', 'explain', 'assignment', 'project')),
  tokens_used INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Modify Users for School
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_grade VARCHAR CHECK (class_grade IN ('11', '12', 'other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS section VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'english' CHECK (preferred_language IN ('tamil', 'english', 'hinglish'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'group', 'b2b'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_question_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_question_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR;

-- 5. Subscriptions & Payments
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  tier VARCHAR NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro_monthly', 'pro_yearly', 'group', 'tuition_center', 'school')),
  price_inr INT DEFAULT 0,
  questions_per_day INT DEFAULT 5,
  textbooks_allowed INT DEFAULT 1,
  features JSONB DEFAULT '{}',
  payment_method VARCHAR CHECK (payment_method IN ('upi', 'card', 'netbanking')),
  upi_transaction_id VARCHAR,
  auto_renew BOOLEAN DEFAULT true,
  razorpay_subscription_id VARCHAR,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert subscriptions" ON subscriptions;
CREATE POLICY "Users can insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount INT NOT NULL,
  payment_gateway VARCHAR CHECK (payment_gateway IN ('razorpay', 'cashfree', 'stripe')),
  upi_id VARCHAR,
  upi_app VARCHAR CHECK (upi_app IN ('gpay', 'phonepe', 'paytm', 'other')),
  transaction_id VARCHAR,
  settlement_status VARCHAR DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'failed', 'refunded')),
  invoice_url VARCHAR,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WhatsApp Sessions
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  phone_number VARCHAR NOT NULL,
  session_status VARCHAR DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'blocked')),
  last_message_at TIMESTAMP,
  total_messages INT DEFAULT 0,
  subscription_linked BOOLEAN DEFAULT false,
  language_preference VARCHAR DEFAULT 'auto' CHECK (language_preference IN ('tamil', 'english', 'auto')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own whatsapp sessions" ON whatsapp_sessions;
CREATE POLICY "Users can read own whatsapp sessions" ON whatsapp_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert whatsapp sessions" ON whatsapp_sessions;
CREATE POLICY "Users can insert whatsapp sessions" ON whatsapp_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Consolidated RLS Policies
-- ============================================================
ALTER TABLE IF EXISTS schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS textbook_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Schools
  DROP POLICY IF EXISTS "Schools public read" ON schools;
  CREATE POLICY "Schools public read" ON schools FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Schools admin insert" ON schools;
  CREATE POLICY "Schools admin insert" ON schools FOR INSERT WITH CHECK (true);

  -- Textbooks
  DROP POLICY IF EXISTS "Textbooks public read" ON textbooks;
  CREATE POLICY "Textbooks public read" ON textbooks FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Textbooks auth insert" ON textbooks;
  CREATE POLICY "Textbooks auth insert" ON textbooks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "Textbooks admin update" ON textbooks;
  CREATE POLICY "Textbooks admin update" ON textbooks FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "Textbooks admin delete" ON textbooks;
  CREATE POLICY "Textbooks admin delete" ON textbooks FOR DELETE USING (auth.role() = 'authenticated');

  -- Conversations
  DROP POLICY IF EXISTS "Conversations own read" ON conversations;
  CREATE POLICY "Conversations own read" ON conversations FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Conversations auth insert" ON conversations;
  CREATE POLICY "Conversations auth insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Subscriptions
  DROP POLICY IF EXISTS "Subscriptions own read" ON subscriptions;
  CREATE POLICY "Subscriptions own read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Subscriptions auth insert" ON subscriptions;
  CREATE POLICY "Subscriptions auth insert" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Payments
  DROP POLICY IF EXISTS "Payments own read" ON payments;
  CREATE POLICY "Payments own read" ON payments FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Payments auth insert" ON payments;
  CREATE POLICY "Payments auth insert" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- WhatsApp Sessions
  DROP POLICY IF EXISTS "WhatsApp own read" ON whatsapp_sessions;
  CREATE POLICY "WhatsApp own read" ON whatsapp_sessions FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "WhatsApp auth insert" ON whatsapp_sessions;
  CREATE POLICY "WhatsApp auth insert" ON whatsapp_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;
