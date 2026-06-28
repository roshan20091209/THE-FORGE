import crypto from 'crypto';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

let monthlyCalls = 0;
const MONTHLY_LIMIT = 1000;
const cache = new Map();

export function getMonthlyUsage() {
  return { calls: monthlyCalls, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthlyCalls };
}

async function generateWithNVIDIA(prompt, options = {}) {
  const cacheKey = crypto.createHash('md5').update(prompt + JSON.stringify(options)).digest('hex');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) return cached.data;

  if (monthlyCalls >= MONTHLY_LIMIT) return null;

  const model = options.model || 'meta/llama-3.1-8b-instruct';
  const system = options.system || 'You are a helpful mentor.';
  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 500,
        top_p: 0.7,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    monthlyCalls++;
    const content = data.choices?.[0]?.message?.content || '';
    cache.set(cacheKey, { data: content, timestamp: Date.now() });
    return content;
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
}

export async function getTutorResponse(simulation, userMessage, conversationHistory = []) {
  const historyText = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.message}`
  ).join('\n');

  const prompt = `You are a friendly tutor helping a 12th grade student solve a challenge.

Challenge: ${simulation.title}
Problem: ${simulation.description || simulation.problem_brief}

Previous conversation:
${historyText || 'No prior conversation.'}

Student's latest message: ${userMessage}

Rules:
- Respond in simple, clear English
- NEVER give the answer directly. Ask guiding questions instead
- Be encouraging and patient — like a smart older sibling
- If the student is stuck, help them break the problem into smaller parts
- Celebrate small wins: "Good thinking!", "That's a great start!", "You're on the right track"
- Keep responses to 2-4 sentences
- If the student asks "what should I do?", help them think it through step by step`;

  return generateWithNVIDIA(prompt, {
    system: 'You are a friendly, patient tutor who helps students learn by asking guiding questions. You never give direct answers. You speak in simple English and are always encouraging.',
    temperature: 0.7,
    max_tokens: 300,
    model: 'meta/llama-3.1-8b-instruct'
  });
}

export async function evaluateAttempt(simulation, attempt) {
  const conversationHistory = typeof attempt.ai_conversation_history === 'string'
    ? attempt.ai_conversation_history
    : JSON.stringify(attempt.ai_conversation_history || []);
  const solution = (attempt.solution_text || '').substring(0, 1000);

  const history = JSON.parse(conversationHistory);
  const candidateMsgs = (Array.isArray(history) ? history : [])
    .filter(m => m.role === 'user')
    .map((m, i) => `[${i + 1}]: ${(m.message || '').substring(0, 200)}`)
    .join('\n');

  const systemPrompt = `You are a fair evaluator. You assess students on 4 dimensions, giving a score 0-100 and specific evidence for each.

DIMENSIONS:
1. wrong_and_recovered — Can they admit mistakes and pivot? (If they were right from the start, score 50-70 with evidence "No mistake to recover from")
2. pressure_communication — Do they communicate clearly and ask good questions?
3. mid_process_pivot — Can they adapt when things change?
4. unblocking_agency — Do they figure things out on their own?

SCORING:
- 80-100: Exceptional
- 60-79: Solid
- 40-59: Developing
- 20-39: Below expectations
- 0-19: Only if abusive or completely off-task

Every "evidence" field MUST contain a specific quote from the student's messages.
Return ONLY valid JSON. No markdown.`;

  const userPrompt = `Evaluate this student's performance.

SIMULATION: ${simulation.title} (${simulation.industry || 'Tech'})
CANDIDATE'S MESSAGES:
${candidateMsgs.substring(0, 2000) || 'No messages'}
SOLUTION:
${solution.substring(0, 500) || 'No solution'}

Return JSON:
{
  "wrong_and_recovered":{"score":0,"evidence":"","strength":"","growth_area":""},
  "pressure_communication":{"score":0,"evidence":"","strength":"","growth_area":""},
  "mid_process_pivot":{"score":0,"evidence":"","strength":"","growth_area":""},
  "unblocking_agency":{"score":0,"evidence":"","strength":"","growth_area":""},
  "overall":{"score":0,"summary":"","strengths":[],"areas_to_improve":[],"next_steps":[]}
}`;

  const result = await generateWithNVIDIA(userPrompt, {
    system: systemPrompt,
    temperature: 0.1,
    max_tokens: 800,
    model: 'meta/llama-3.1-8b-instruct',
    timeout: 60000
  });
  if (!result) return null;
  try { return JSON.parse(result); } catch { return null; }
}
