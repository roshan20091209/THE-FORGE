import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xpsarcxyhvfxbmyvgocv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2FyY3h5aHZmeGJteXZnb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTk0NTksImV4cCI6MjA5ODEzNTQ1OX0.OEBQpEWJAgytJLq_U9iqjCcgLuwMZsocWLo_5OGXdCE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getSupabase(token) {
  if (!token) return supabase;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

export async function select(table, columns = '*', options = {}) {
  let query = supabase.from(table).select(columns, { count: 'exact' });
  if (options.where) {
    for (const [col, val] of Object.entries(options.where)) {
      if (val === null) query = query.is(col, null);
      else if (Array.isArray(val)) query = query.in(col, val);
      else query = query.eq(col, val);
    }
  }
  if (options.not) {
    for (const [col, val] of Object.entries(options.not)) query = query.neq(col, val);
  }
  if (options.like) {
    for (const [col, val] of Object.entries(options.like)) query = query.like(col, val);
  }
  if (options.gte) {
    for (const [col, val] of Object.entries(options.gte)) query = query.gte(col, val);
  }
  if (options.lte) {
    for (const [col, val] of Object.entries(options.lte)) query = query.lte(col, val);
  }
  if (options.order) {
    const dir = options.order.direction || 'asc';
    query = query.order(options.order.by, { ascending: dir !== 'desc', nullsFirst: dir === 'desc' });
  }
  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function selectOne(table, columns = '*', options = {}) {
  const data = await select(table, columns, { ...options, limit: 1 });
  return data?.[0] || null;
}

export async function insert(table, values) {
  const { data, error } = await supabase.from(table).insert(values).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function update(table, values, where) {
  let query = supabase.from(table).update(values);
  for (const [col, val] of Object.entries(where)) query = query.eq(col, val);
  const { data, error } = await query.select();
  if (error) throw new Error(error.message);
  return data;
}

export async function remove(table, where) {
  let query = supabase.from(table).delete();
  for (const [col, val] of Object.entries(where)) query = query.eq(col, val);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
