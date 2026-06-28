import { supabase } from '../db.js';
import { askQuestion } from './qaService.js';
import { getUserSubscription, checkDailyQuestionLimit } from './subscriptionService.js';
import { detectLanguageFromText } from '../ai/voiceHandler.js';

export async function handleIncomingMessage(from, messageBody, mediaUrl) {
  let user = await supabase.from('users')
    .select('*').eq('whatsapp_number', from)
    .single()
    .then(r => r.data)
    .catch(() => null);

  if (!user) {
    const { data: existingSession } = await supabase.from('whatsapp_sessions')
      .select('*').eq('phone_number', from)
      .single()
      .catch(() => ({ data: null }));

    if (!existingSession) {
      await supabase.from('whatsapp_sessions').insert({
        phone_number: from,
        session_status: 'active',
        language_preference: 'auto'
      });

      return {
        type: 'text',
        message: `Welcome to Forge! 🎓 Your AI study assistant.\n\nTo get started, please register on our web app:\n${process.env.CLIENT_URL || 'https://forge.ai'}/register\n\nOr reply with your registered email to link your account.`
      };
    }

    return {
      type: 'text',
      message: 'Please register on our web app first: ' + (process.env.CLIENT_URL || 'https://forge.ai') + '/register'
    };
  }

  let language = user.preferred_language || 'english';
  if (mediaUrl) {
    const { handleVoiceInput } = await import('../ai/voiceHandler.js');
    const voiceResult = await handleVoiceInput(mediaUrl, user.id);
    if (voiceResult.error) {
      return { type: 'text', message: 'Could not process voice message. Please try text.' };
    }
    messageBody = voiceResult.text;
    language = voiceResult.language || language;
  } else {
    const detected = detectLanguageFromText(messageBody || '');
    if (detected !== 'english') language = detected;
  }

  const sub = await getUserSubscription(user.id);
  if (sub.tier === 'free') {
    return {
      type: 'text',
      message: `You're on the Free plan. Upgrade to Pro for WhatsApp access!\n\n👉 Pro Monthly: Rs.29\n👉 Pro Yearly: Rs.249\n\nPay via UPI: ${process.env.MERCHANT_UPI_ID || 'forge@upi'}\nOr visit: ${process.env.CLIENT_URL || 'https://forge.ai'}/subscribe`
    };
  }

  const limitCheck = await checkDailyQuestionLimit(user.id);
  if (!limitCheck.allowed) {
    return {
      type: 'text',
      message: `You've reached your daily question limit (${limitCheck.limit}). Upgrade to Pro for unlimited questions!\nVisit: ${process.env.CLIENT_URL || 'https://forge.ai'}/subscribe`
    };
  }

  if (!messageBody || messageBody.trim().length === 0) {
    return { type: 'text', message: 'Please send a question from your textbook, and I\'ll answer it!' };
  }

  const { data: textbooks } = await supabase.from('textbooks')
    .select('id, title, subject, grade')
    .eq('school_id', user.school_id)
    .eq('indexing_status', 'completed')
    .limit(1);

  if (!textbooks || textbooks.length === 0) {
    return {
      type: 'text',
      message: 'No textbooks found for your school. Please upload a textbook on our web app first.\n' + (process.env.CLIENT_URL || 'https://forge.ai')
    };
  }

  const textbook = textbooks[0];

  const result = await askQuestion({
    question: messageBody,
    textbookId: textbook.id,
    marks: 5,
    mode: 'direct',
    language,
    userId: user.id
  });

  let reply = result.answer || 'Sorry, could not process your question.';
  if (result.source === 'not_in_syllabus') {
    reply = `❌ Not in your syllabus.\n\nThis topic isn't covered in your ${textbook.subject} textbook (Class ${textbook.grade}).`;
  }

  if (result.page_references && result.page_references.length > 0) {
    const pages = [...new Set(result.page_references.map(r => r.page).filter(Boolean))];
    if (pages.length > 0) {
      reply += `\n\n📖 Reference: ${textbook.title}, Page ${pages.join(', ')}`;
    }
  }

  reply += '\n\n💡 Reply with another question or send "explain" before your question for simpler explanation.';

  try {
    await supabase.from('whatsapp_sessions')
      .update({ last_message_at: new Date().toISOString(), total_messages: supabase.raw('total_messages + 1') })
      .eq('phone_number', from);
  } catch {}

  return { type: 'text', message: reply };
}

export async function sendWhatsAppMessage(to, message) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.log('WhatsApp sending skipped (no Twilio config):', to);
      return null;
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: `whatsapp:${to}`,
          Body: message
        })
      }
    );

    const data = await response.json();
    return data.sid || null;
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return null;
  }
}

export async function getOrCreateSession(phoneNumber) {
  const { data: existing } = await supabase.from('whatsapp_sessions')
    .select('*').eq('phone_number', phoneNumber).single()
    .catch(() => ({ data: null }));

  if (existing) return existing;

  const { data, error } = await supabase.from('whatsapp_sessions').insert({
    phone_number: phoneNumber,
    session_status: 'active',
    language_preference: 'auto'
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export default { handleIncomingMessage, sendWhatsAppMessage, getOrCreateSession };
