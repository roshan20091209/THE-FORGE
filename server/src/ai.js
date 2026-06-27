import crypto from 'crypto';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

let monthlyCalls = 0;
const MONTHLY_LIMIT = 1000;
let rateLimitReset = Date.now() + 60000;
let minuteCount = 0;

const cache = new Map();
const API_TIMEOUT = 15000;

export function getMonthlyUsage() {
  return { calls: monthlyCalls, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthlyCalls };
}

async function generateWithNVIDIA(prompt, options = {}) {
  const cacheKey = crypto.createHash('md5').update(prompt + JSON.stringify(options)).digest('hex');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) return cached.data;

  if (monthlyCalls >= MONTHLY_LIMIT) {
    console.warn('NVIDIA monthly limit reached');
    return null;
  }

  if (Date.now() > rateLimitReset) { minuteCount = 0; rateLimitReset = Date.now() + 60000; }
  if (minuteCount >= 15) return null;
  minuteCount++;

  const model = options.model || 'meta/llama-3.1-8b-instruct';
  const system = options.system || 'You are a helpful assistant.';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

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

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVIDIA API error:', response.status, errText);
      return null;
    }

    const data = await response.json();
    monthlyCalls++;
    const content = data.choices?.[0]?.message?.content || '';
    cache.set(cacheKey, { data: content, timestamp: Date.now() });
    return content;
  } catch (err) {
    clearTimeout(timeout);
    console.error('NVIDIA request failed:', err.message);
    return null;
  }
}

const AI_MANAGER_SYSTEM = `You are a senior engineering manager at a tech company. You are managing a junior employee who has limited time to solve a real problem. Your personality:
- Busy and slightly distracted (takes time to respond)
- Gives vague requirements initially
- Expects clarifying questions
- Gets frustrated if asked obvious questions
- Appreciates initiative and independent problem-solving
- Changes priorities occasionally

Be realistic. Don't solve the problem for them. Keep responses under 150 words.`;

export async function getAiManagerResponse(simulation, attempt, userMessage) {
  const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const remaining = Math.max(0, simulation.duration_hours - h);

  const prompt = `Current simulation: ${simulation.title}
Problem brief: ${simulation.problem_brief}
Participant message: ${userMessage}
Time elapsed: ${h}h ${m}m
Time remaining: ${remaining}h

Respond as the manager.`;

  return generateWithNVIDIA(prompt, {
    system: AI_MANAGER_SYSTEM,
    temperature: 0.7,
    max_tokens: 300,
    model: 'meta/llama-3.1-8b-instruct'
  });
}

export async function getCrisisInjection(simulation, attempt) {
  const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const remaining = Math.max(0, simulation.duration_hours - h);
  const previous = attempt.crisis_injections_received || '[]';

  const prompt = `Determine if a crisis should be injected into this simulation attempt.

Simulation: ${simulation.title}
Industry: ${simulation.industry}
Time elapsed: ${h}h
Time remaining: ${remaining}h
Crises already injected: ${previous}

Rules:
- Inject crisis at ~25% and ~60% of elapsed time
- Crisis must be relevant to the simulation domain
- Don't inject if participant is already struggling

Return ONLY valid JSON:
{"inject": true, "crisis_type": "requirements_change|teammate_conflict|resource_constraint|client_complaint", "crisis_message": "...", "severity": "low|medium|high"}
or
{"inject": false}`;

  const result = await generateWithNVIDIA(prompt, {
    system: 'You are the simulation controller. Return only valid JSON.',
    temperature: 0.3,
    max_tokens: 300,
    model: 'meta/llama-3.1-8b-instruct'
  });
  if (!result) return { inject: false };
  try { return JSON.parse(result); } catch { return { inject: false }; }
}

export async function evaluateAttempt(simulation, attempt) {
  const prompt = `Evaluate this simulation attempt across 4 dimensions. Be objective, specific, and evidence-based.

SIMULATION: ${simulation.title}
PROBLEM BRIEF: ${simulation.problem_brief}
SOLUTION: ${attempt.solution_text}
ITERATION LOG: ${attempt.iteration_log}
AI CONVERSATION: ${attempt.ai_conversation_history}
CRISIS RESPONSES: ${attempt.crisis_injections_received}

Return ONLY valid JSON:
{
  "wrong_and_recovered": {"score": 0-100, "evidence": "..."},
  "pressure_communication": {"score": 0-100, "evidence": "..."},
  "mid_process_pivot": {"score": 0-100, "evidence": "..."},
  "unblocking_agency": {"score": 0-100, "evidence": "..."},
  "overall_percentile": "top X%",
  "summary": "One-paragraph executive summary",
  "strengths": ["..."],
  "growth_areas": ["..."],
  "hire_recommendation": "strong|conditional|not_recommended"
}`;

  const result = await generateWithNVIDIA(prompt, {
    system: 'You are an expert hiring evaluator with 20 years of experience.',
    temperature: 0.2,
    max_tokens: 2000,
    model: 'meta/llama-3.1-70b-instruct'
  });
  if (!result) return null;
  try { return JSON.parse(result); } catch { return null; }
}

export async function generateCredentialSummary(user, simulation, scores) {
  const prompt = `Generate a 1-page executive summary for this candidate's credential profile.

Candidate: ${user.full_name || user.email}
Simulation: ${simulation.title}
Industry: ${simulation.industry}
Scores:
- Wrong & Recovered: ${scores.wrong_and_recovered_score}/100
- Pressure Communication: ${scores.pressure_communication_score}/100
- Mid-Process Pivot: ${scores.mid_process_pivot_score}/100
- Unblocking Agency: ${scores.unblocking_agency_score}/100

Generate:
1. One compelling opening sentence
2. Three bullet points of evidence
3. One sentence on what makes them unique
4. Recommended role types

Keep it under 200 words. Be specific.`;

  return generateWithNVIDIA(prompt, {
    system: 'You are a professional credential writer.',
    temperature: 0.5,
    max_tokens: 400,
    model: 'meta/llama-3.1-8b-instruct'
  });
}
