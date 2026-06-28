-- Run this in Supabase Dashboard SQL Editor
-- Add onboarding fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_preference TEXT DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'offer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

-- Add workspace/narrative fields to simulation_attempts
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS desk_location TEXT DEFAULT '3B';
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS narrative_stage TEXT DEFAULT 'welcome';
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS team_chat_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS email_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS ticket_status TEXT DEFAULT 'todo';
ALTER TABLE simulation_attempts ADD COLUMN IF NOT EXISTS narrative_events JSONB DEFAULT '[]'::jsonb;

-- Team messages table
CREATE TABLE IF NOT EXISTS team_messages (
    id SERIAL PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT,
    channel TEXT NOT NULL DEFAULT '#general',
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Narrative events table
CREATE TABLE IF NOT EXISTS narrative_events (
    id SERIAL PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    trigger_hours INTEGER NOT NULL,
    has_triggered INTEGER DEFAULT 0,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badge photos storage
CREATE TABLE IF NOT EXISTS badge_photos (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES simulation_attempts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    event_type TEXT DEFAULT 'meeting',
    description TEXT,
    is_attending INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
