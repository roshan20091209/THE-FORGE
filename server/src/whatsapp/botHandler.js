import { handleIncomingMessage, sendWhatsAppMessage, getOrCreateSession } from '../services/whatsappBotService.js';

export async function processWebhook(body) {
  const from = body.From || body.from;
  const messageBody = body.Body || body.body || '';
  const mediaUrl = body.MediaUrl || null;

  if (!from) return null;

  const reply = await handleIncomingMessage(from, messageBody, mediaUrl);
  return reply;
}

export async function sendMessage(to, text) {
  return sendWhatsAppMessage(to, text);
}

export { getOrCreateSession };
