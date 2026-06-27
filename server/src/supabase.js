import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xpsarcxyhvfxbmyvgocv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2FyY3h5aHZmeGJteXZnb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTk0NTksImV4cCI6MjA5ODEzNTQ1OX0.OEBQpEWJAgytJLq_U9iqjCcgLuwMZsocWLo_5OGXdCE';

export function getSupabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
