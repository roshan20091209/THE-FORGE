import { Router } from 'express';
import { handleIncomingMessage } from '../services/whatsappBotService.js';
import { processRazorpayWebhook } from '../services/paymentService.js';
import { supabase } from '../db.js';

const router = Router();

router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    const from = body.From || body.from || body.waId || body.contacts?.[0]?.wa_id;
    const messageBody = body.Body || body.body || body.text?.body || '';
    const mediaUrl = body.MediaUrl || body.mediaUrl || null;

    if (!from) {
      return res.status(400).json({ error: 'Sender information required' });
    }

    const reply = await handleIncomingMessage(from, messageBody, mediaUrl);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(reply.message)}</Message>
</Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/razorpay', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && webhookSignature) {
      const crypto = await import('crypto');
      const expectedSig = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSig !== webhookSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const result = await processRazorpayWebhook(req.body);
    res.json(result);
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/meta', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages) {
      if (req.body?.hub?.challenge) {
        return res.status(200).send(req.body.hub.challenge);
      }
      return res.status(200).json({ status: 'ok' });
    }

    for (const msg of messages) {
      const from = msg.from;
      const text = msg.text?.body || '';
      const mediaUrl = msg.image?.id || msg.audio?.id || null;

      await handleIncomingMessage(from, text, mediaUrl).catch(e =>
        console.error('Meta webhook message handling error:', e)
      );
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Meta webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).send('Verification failed');
});

function escapeXml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
