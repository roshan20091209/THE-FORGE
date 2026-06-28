import { supabase } from '../db.js';

export async function createOrder(amount, userId, tier) {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return await createManualOrder(amount, userId, tier);
    }

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        receipt: `forge_${userId.substring(0, 8)}_${Date.now()}`,
        notes: { userId, tier }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Razorpay order creation failed:', err);
      return await createManualOrder(amount, userId, tier);
    }

    const order = await response.json();
    return {
      type: 'razorpay',
      order_id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: razorpayKeyId
    };
  } catch (err) {
    console.error('Payment order error:', err.message);
    return await createManualOrder(amount, userId, tier);
  }
}

async function createManualOrder(amount, userId, tier) {
  return {
    type: 'manual_upi',
    amount,
    upi_id: process.env.MERCHANT_UPI_ID || 'forge@upi',
    upi_apps: ['gpay', 'phonepe', 'paytm'],
    reference: `FORGE${Date.now().toString(36).toUpperCase()}`,
    instructions: 'Send exact amount to UPI ID. Share screenshot for manual verification.'
  };
}

export async function verifyPayment(orderId, paymentId, signature, userId) {
  try {
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      return await manualVerify(orderId, userId);
    }

    const crypto = await import('crypto');
    const expectedSig = crypto.createHmac('sha256', razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSig !== signature) {
      throw new Error('Payment signature verification failed');
    }

    await supabase.from('payments').insert({
      user_id: userId,
      amount: 0,
      payment_gateway: 'razorpay',
      transaction_id: paymentId,
      status: 'completed',
      settlement_status: 'pending'
    });

    return { verified: true, message: 'Payment verified' };
  } catch (err) {
    console.error('Payment verification error:', err.message);
    return { verified: false, message: err.message };
  }
}

async function manualVerify(reference, userId) {
  await supabase.from('payments').insert({
    user_id: userId,
    amount: 0,
    payment_gateway: null,
    transaction_id: reference,
    status: 'pending',
    settlement_status: 'pending'
  });

  return {
    verified: true,
    manual: true,
    message: 'Payment recorded for manual verification. You will be activated within 24 hours.'
  };
}

export async function getPaymentHistory(userId) {
  const { data, error } = await supabase.from('payments')
    .select('*, subscriptions(tier)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function verifyUpiPayment(upiTransactionId, userId, amount) {
  const { data, error } = await supabase.from('payments').insert({
    user_id: userId,
    amount,
    payment_gateway: null,
    upi_id: process.env.MERCHANT_UPI_ID || 'forge@upi',
    transaction_id: upiTransactionId,
    status: 'completed',
    settlement_status: 'pending'
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export async function processRazorpayWebhook(payload) {
  const event = payload.event;
  const payment = payload.payload?.payment?.entity;

  if (event === 'payment.captured' && payment) {
    const notes = payment.notes || {};
    const userId = notes.userId;

    if (userId) {
      await supabase.from('payments').insert({
        user_id: userId,
        amount: Math.round(payment.amount / 100),
        payment_gateway: 'razorpay',
        transaction_id: payment.id,
        status: 'completed',
        settlement_status: 'settled'
      });
    }
  }

  return { received: true };
}

export default { createOrder, verifyPayment, getPaymentHistory, verifyUpiPayment, processRazorpayWebhook };
