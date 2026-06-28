export function parseWhatsAppMessage(body) {
  const from = body.From || body.from || body.waId || body.contacts?.[0]?.wa_id;
  const to = body.To || body.to;
  const messageBody = body.Body || body.body || body.text?.body || '';
  const mediaUrl = body.MediaUrl0 || body.MediaUrl || body.image?.id || body.audio?.id || null;
  const mediaType = body.MediaContentType0 || body.mediaType || null;
  const messageType = body.MessageType || body.type || 'text';
  const timestamp = body.Timestamp || body.timestamp || Date.now();

  return {
    from: from ? from.replace('whatsapp:', '') : null,
    to: to ? to.replace('whatsapp:', '') : null,
    messageBody: messageBody.trim(),
    mediaUrl,
    mediaType,
    messageType,
    timestamp: parseInt(timestamp) * 1000 || timestamp,
    raw: body
  };
}

export function buildTwimlResponse(message) {
  const safeMsg = (message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safeMsg}</Message>
</Response>`;
}

export function detectCommand(text) {
  const lower = (text || '').toLowerCase().trim();

  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'start') {
    return { type: 'greeting' };
  }
  if (lower === 'plans' || lower === 'pricing' || lower === 'subscribe' || lower === 'price') {
    return { type: 'pricing' };
  }
  if (lower.startsWith('explain ')) {
    return { type: 'explain', text: lower.replace('explain ', '') };
  }
  if (lower === 'help') {
    return { type: 'help' };
  }

  return { type: 'question', text };
}

export default { parseWhatsAppMessage, buildTwimlResponse, detectCommand };
