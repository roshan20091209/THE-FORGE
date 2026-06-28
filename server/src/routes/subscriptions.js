import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { getPlans, getUserSubscription, createSubscription, cancelSubscription, checkSubscriptionAccess } from '../services/subscriptionService.js';

const router = Router();

router.get('/plans', async (req, res) => {
  try {
    const plans = await getPlans();
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await getUserSubscription(req.user.id);
    const access = await checkSubscriptionAccess(req.user.id);
    res.json({ subscription, access });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tier, payment_method, upi_transaction_id, razorpay_subscription_id } = req.body;
    if (!tier) return res.status(400).json({ error: 'Tier required' });

    const subscription = await createSubscription(req.user.id, tier, payment_method || null, {
      upi_transaction_id,
      razorpay_subscription_id
    });

    res.status(201).json({ subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await cancelSubscription(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check', authenticateToken, async (req, res) => {
  try {
    const access = await checkSubscriptionAccess(req.user.id);
    res.json(access);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
