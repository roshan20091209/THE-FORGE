import { checkDailyQuestionLimit, checkSubscriptionAccess } from '../services/subscriptionService.js';

export function requireSubscription(feature) {
  return async (req, res, next) => {
    try {
      const access = await checkSubscriptionAccess(req.user.id);
      const limitCheck = await checkDailyQuestionLimit(req.user.id);

      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: `Daily question limit reached. Upgrade to Pro for unlimited questions.`,
          limit: limitCheck
        });
      }

      if (feature && !access.features.includes(feature)) {
        return res.status(403).json({
          error: `This feature requires ${feature} access. Upgrade your plan to use it.`,
          required_feature: feature,
          current_tier: access.tier
        });
      }

      req.subscription = access;
      req.questionLimit = limitCheck;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export default { requireSubscription, requireAdmin };
