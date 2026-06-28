import { supabase } from '../db.js';

const TIER_LIMITS = {
  free: { questions_per_day: 5, textbooks_allowed: 1, price_inr: 0, features: ['web_only'] },
  pro_monthly: { questions_per_day: 999, textbooks_allowed: 10, price_inr: 29, features: ['web', 'whatsapp', 'osm_formatter', 'unlimited_questions'] },
  pro_yearly: { questions_per_day: 999, textbooks_allowed: 10, price_inr: 249, features: ['web', 'whatsapp', 'osm_formatter', 'unlimited_questions'] },
  group: { questions_per_day: 999, textbooks_allowed: 10, price_inr: 99, features: ['web', 'whatsapp', 'osm_formatter', 'group_admin', '5_accounts'] },
  tuition_center: { questions_per_day: 999, textbooks_allowed: 50, price_inr: 2999, features: ['web', 'whatsapp', 'osm_formatter', 'white_label', 'admin_dashboard', 'analytics', '200_students'] },
  school: { questions_per_day: 9999, textbooks_allowed: 999, price_inr: 50000, features: ['web', 'whatsapp', 'osm_formatter', 'white_label', 'admin_dashboard', 'analytics', 'all_subjects', 'teacher_tools'] }
};

export function getPlanDetails(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export async function getPlans() {
  return Object.entries(TIER_LIMITS).map(([tier, details]) => ({
    tier,
    ...details,
    yearly_discount: tier === 'pro_yearly' ? 29 : 0
  }));
}

export async function getUserSubscription(userId) {
  const { data: subscription, error } = await supabase.from('subscriptions')
    .select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1);

  if (error) throw new Error(error.message);

  if (subscription && subscription.length > 0) {
    const sub = subscription[0];
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
      await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);
      return { tier: 'free', ...TIER_LIMITS.free };
    }
    return { tier: sub.tier, ...TIER_LIMITS[sub.tier] || TIER_LIMITS.free, db_record: sub };
  }

  return { tier: 'free', ...TIER_LIMITS.free };
}

export async function checkDailyQuestionLimit(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data: user, error } = await supabase.from('users')
    .select('daily_question_count, daily_question_date, subscription_tier')
    .eq('id', userId).single();

  if (error) return { allowed: true, remaining: 5 };

  const limits = TIER_LIMITS[user?.subscription_tier || 'free'] || TIER_LIMITS.free;

  if (user?.daily_question_date !== today) {
    await supabase.from('users').update({
      daily_question_count: 0,
      daily_question_date: today
    }).eq('id', userId);
    return { allowed: true, remaining: limits.questions_per_day, used: 0, limit: limits.questions_per_day };
  }

  const used = user?.daily_question_count || 0;
  const remaining = Math.max(0, limits.questions_per_day - used);

  return {
    allowed: used < limits.questions_per_day,
    remaining,
    used,
    limit: limits.questions_per_day
  };
}

export async function createSubscription(userId, tier, paymentMethod, paymentDetails = {}) {
  const plan = TIER_LIMITS[tier];
  if (!plan) throw new Error('Invalid tier');

  const { data: existing } = await supabase.from('subscriptions')
    .select('id').eq('user_id', userId).eq('status', 'active').limit(1);

  if (existing && existing.length > 0) {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');
  }

  const durationDays = tier === 'pro_yearly' ? 365 : tier === 'school' ? 365 : tier === 'tuition_center' ? 30 : 30;

  const { data, error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    tier,
    price_inr: plan.price_inr,
    questions_per_day: plan.questions_per_day,
    textbooks_allowed: plan.textbooks_allowed,
    features: plan.features,
    payment_method: paymentMethod || null,
    upi_transaction_id: paymentDetails.upi_transaction_id || null,
    razorpay_subscription_id: paymentDetails.razorpay_subscription_id || null,
    status: 'active',
    expires_at: new Date(Date.now() + durationDays * 86400000).toISOString()
  }).select().single();

  if (error) throw new Error(error.message);

  await supabase.from('users').update({
    subscription_tier: tier,
    subscription_expires_at: data.expires_at
  }).eq('id', userId);

  return data;
}

export async function cancelSubscription(userId) {
  const { data, error } = await supabase.from('subscriptions')
    .update({ status: 'cancelled', auto_renew: false })
    .eq('user_id', userId).eq('status', 'active').select();

  if (error) throw new Error(error.message);

  await supabase.from('users').update({
    subscription_tier: 'free',
    subscription_expires_at: null
  }).eq('id', userId);

  return { message: 'Subscription cancelled' };
}

export async function checkSubscriptionAccess(userId) {
  const sub = await getUserSubscription(userId);
  return {
    access_granted: sub.tier !== 'free' || true,
    tier: sub.tier,
    features: sub.features || [],
    can_use_whatsapp: sub.features?.includes('whatsapp') || sub.features?.includes('web'),
    can_use_osm_formatter: sub.features?.includes('osm_formatter') || sub.features?.includes('web')
  };
}

export default { getPlans, getUserSubscription, checkDailyQuestionLimit, createSubscription, cancelSubscription, checkSubscriptionAccess };
