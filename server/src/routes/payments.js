import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { createOrder, verifyPayment, getPaymentHistory, verifyUpiPayment } from '../services/paymentService.js';

const router = Router();

router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, tier } = req.body;
    if (!amount || !tier) return res.status(400).json({ error: 'Amount and tier required' });

    const order = await createOrder(amount, req.user.id, tier);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ error: 'order_id, payment_id, and signature required' });
    }

    const result = await verifyPayment(order_id, payment_id, signature, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upi', authenticateToken, async (req, res) => {
  try {
    const { upi_transaction_id, amount } = req.body;
    if (!upi_transaction_id || !amount) {
      return res.status(400).json({ error: 'upi_transaction_id and amount required' });
    }

    const payment = await verifyUpiPayment(upi_transaction_id, req.user.id, amount);
    res.json({ payment, message: 'UPI payment recorded. Manual verification in progress.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await getPaymentHistory(req.user.id);
    res.json({ payments: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
