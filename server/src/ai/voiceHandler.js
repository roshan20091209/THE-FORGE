import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const AUDIO_DIR = path.join(process.cwd(), 'server', 'uploads', 'audio');

export function ensureAudioDir() {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  return AUDIO_DIR;
}

export async function downloadMedia(mediaUrl) {
  try {
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error(`Failed to download media: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const filename = `voice_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.ogg`;
    const filepath = path.join(ensureAudioDir(), filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  } catch (err) {
    console.error('Media download error:', err.message);
    return null;
  }
}

export async function transcribeAudio(audioPath, language = 'ta') {
  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-1');
    form.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Whisper API error:', errText);
      return null;
    }

    const data = await response.json();
    return data.text || null;
  } catch (err) {
    console.error('Transcription error:', err.message);
    return null;
  }
}

export function detectLanguageFromText(text) {
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const hindiPattern = /[\u0900-\u097F]/;
  const englishPattern = /^[a-zA-Z0-9\s.,!?;:'"()-]+$/;

  if (tamilPattern.test(text)) return 'tamil';
  if (hindiPattern.test(text)) return 'hinglish';
  if (englishPattern.test(text.trim())) return 'english';
  return 'hinglish';
}

export async function handleVoiceInput(mediaUrl, userId) {
  const audioPath = await downloadMedia(mediaUrl);
  if (!audioPath) return { error: 'Failed to download voice message' };

  const transcript = await transcribeAudio(audioPath, 'ta');
  if (!transcript) return { error: 'Failed to transcribe voice message' };

  const detectedLang = detectLanguageFromText(transcript);

  try {
    fs.unlinkSync(audioPath);
  } catch {}

  return {
    text: transcript,
    language: detectedLang,
    source: 'voice'
  };
}

export default { downloadMedia, transcribeAudio, detectLanguageFromText, handleVoiceInput };
