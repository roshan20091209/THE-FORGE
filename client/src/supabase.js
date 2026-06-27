import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpsarcxyhvfxbmyvgocv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2FyY3h5aHZmeGJteXZnb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTk0NTksImV4cCI6MjA5ODEzNTQ1OX0.OEBQpEWJAgytJLq_U9iqjCcgLuwMZsocWLo_5OGXdCE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
