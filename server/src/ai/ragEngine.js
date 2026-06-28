import crypto from 'crypto';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

const monthlyCalls = { count: 0, limit: 5000, month: new Date().getMonth() };
const cache = new Map();

function resetMonthlyIfNeeded() {
  const now = new Date().getMonth();
  if (now !== monthlyCalls.month) {
    monthlyCalls.count = 0;
    monthlyCalls.month = now;
  }
}

export function getMonthlyUsage() {
  resetMonthlyIfNeeded();
  return { calls: monthlyCalls.count, limit: monthlyCalls.limit, remaining: monthlyCalls.limit - monthlyCalls.count };
}

async function callNvidia(messages, options = {}) {
  resetMonthlyIfNeeded();
  if (monthlyCalls.count >= monthlyCalls.limit) return null;

  const model = options.model || 'meta/llama-3.1-8b-instruct';
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
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 800,
        top_p: 0.7,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    monthlyCalls.count++;
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
}

async function generateEmbedding(text) {
  const cacheKey = 'emb_' + crypto.createHash('md5').update(text).digest('hex');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) return cached.data;

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'NV-Embed-QA',
        input: text,
        input_type: 'query'
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;
    if (embedding) {
      cache.set(cacheKey, { data: embedding, timestamp: Date.now() });
    }
    return embedding || null;
  } catch {
    return null;
  }
}

export function buildSystemPrompt(marks, language, subject) {
  let prompt = `You are a strict syllabus-aligned teaching assistant. You MUST answer ONLY using the provided textbook context. If the answer is not in the context, say 'Not in syllabus' and nothing else. Do NOT use outside knowledge or hallucinate.`;

  if (marks) {
    prompt += `\n\nFormat this as a ${marks}-mark exam answer according to the school's marking scheme.`;
    if (marks <= 2) {
      prompt += `\n- Direct, concise answer (2-3 lines max)`;
      prompt += `\n- Include key term or definition`;
    } else if (marks <= 5) {
      prompt += `\n- Structure: Definition/Key Point → Explanation → Example → Conclusion`;
      prompt += `\n- Use bullet points or short paragraphs`;
    } else if (marks <= 10) {
      prompt += `\n- Structure: Introduction → Main Points (detailed) → Conclusion`;
      prompt += `\n- Use numbered points or headings`;
    } else {
      prompt += `\n- Essay format with clear introduction, body paragraphs, and conclusion`;
      prompt += `\n- Include diagrams or steps where relevant`;
    }
  }

  prompt += `\n- Cite page numbers from the textbook context where possible.`;
  prompt += `\n- Use simple, student-friendly language.`;

  if (language === 'tamil') {
    prompt += `\n- Answer in Tamil language.`;
  } else if (language === 'hinglish') {
    prompt += `\n- Answer in Hinglish (natural mix of Hindi and English, as spoken by Indian students).`;
  }

  if (subject) {
    prompt += `\n- Subject: ${subject}. Use subject-appropriate terminology.`;
  }

  return prompt;
}

export async function answerFromContext(question, contextChunks, marks, language, subject) {
  const context = contextChunks.map(c =>
    `[Page ${c.page_number}, Chapter: ${c.chapter_name || 'Unknown'}]\n${c.text}`
  ).join('\n\n---\n\n');

  const systemPrompt = buildSystemPrompt(marks, language, subject);

  const response = await callNvidia([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Textbook Content:\n${context}\n\nQuestion: ${question}\n\nAnswer based ONLY on the textbook content above.` }
  ], {
    temperature: 0.2,
    max_tokens: 1000,
    timeout: 30000
  });

  return response || null;
}

const SYLLABUS = {
  physics: {
    name: 'Physics (Code 042)',
    theory: '70 marks',
    chapters: 'Electrostatics, Current Electricity, Magnetic Effects, Electromagnetic Induction, Alternating Current, EM Waves, Ray Optics, Wave Optics, Dual Nature, Atoms, Nuclei, Semiconductor Electronics',
  },
  chemistry: {
    name: 'Chemistry (Code 043)',
    theory: '70 marks',
    chapters: 'Solutions, Electrochemistry, Chemical Kinetics, d-and f-Block Elements, Coordination Compounds, Haloalkanes & Haloarenes, Alcohols Phenols Ethers, Aldehydes Ketones Carboxylic Acids, Amines, Biomolecules',
  },
  mathematics: {
    name: 'Mathematics (Code 041)',
    theory: '80 marks',
    chapters: 'Relations & Functions, Inverse Trigonometric Functions, Matrices, Determinants, Continuity & Differentiability, Application of Derivatives, Integrals, Application of Integrals, Differential Equations, Vector Algebra, Three Dimensional Geometry, Linear Programming, Probability',
  },
};

const SYLLABUS_PROMPT = (subject) => {
  const s = SYLLABUS[subject];
  if (!s) return '';
  return `\n\nThe student is studying ${s.name} (${s.theory} theory). CBSE 2026-27 syllabus chapters: ${s.chapters}. Answer STRICTLY from NCERT textbook knowledge for Class 12. If the question is NOT in the CBSE 2026-27 syllabus, say "Not in syllabus" and nothing else.`;
};

export async function answerFromSyllabus(question, subject, mode, marks, language) {
  const systemPrompt = `You are OSM-BRO, a CBSE syllabus-aligned teaching assistant. Answer strictly from the Class 12 NCERT syllabus.${SYLLABUS_PROMPT(subject)}
${mode === 'explain'
  ? '- Explain like you\'re talking to a 16-year-old student. Use simple language, analogies, and examples.'
  : `- Format answer for ${marks || 2} marks following CBSE OSM (On-Screen Marking) step format.`
}
${language === 'tamil' ? 'Answer in Tamil.' : language === 'hinglish' ? 'Answer in Hinglish.' : 'Answer in English.'}
If the topic is not in the CBSE 2026-27 Class 12 syllabus, respond ONLY with "Not in syllabus".`;

  return callNvidia([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Question: ${question}` }
  ], {
    temperature: 0.3,
    max_tokens: 1000,
    timeout: 30000
  });
}

export async function answerBulkQuestions(questions, contextChunks, marks, language, subject) {
  let context;
  if (contextChunks.length > 0) {
    context = contextChunks.map(c =>
      `[Page ${c.page_number}, Chapter: ${c.chapter_name || 'Unknown'}]\n${c.text}`
    ).join('\n\n---\n\n');
  } else {
    context = SYLLABUS_PROMPT(subject);
  }

  const questionList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const systemPrompt = `You are a strict syllabus-aligned teaching assistant. Answer ALL questions using ONLY the provided textbook context.
For each question:
- If the answer is in the context, provide a ${marks}-mark formatted answer with page reference
- If NOT in the context, write "Not in syllabus"
- Be concise and accurate

${language === 'tamil' ? 'Answer in Tamil.' : language === 'hinglish' ? 'Answer in Hinglish.' : 'Answer in English.'}

Return JSON array: [{ "question": "original text", "answer": "your answer", "page_reference": "page number or null", "source": "textbook" | "not_in_syllabus" }]`;

  const response = await callNvidia([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Textbook Content:\n${context}\n\nQuestions:\n${questionList}` }
  ], {
    temperature: 0.2,
    max_tokens: 2000,
    timeout: 60000
  });

  if (!response) return null;
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) return parsed;
    const extracted = response.match(/\[[\s\S]*\]/);
    return extracted ? JSON.parse(extracted[0]) : null;
  } catch {
    return null;
  }
}

export async function generateQuestions(chunks, count, difficulty, questionTypes, subject) {
  let context;
  if (chunks.length > 0) {
    context = chunks.map(c =>
      `[Chapter: ${c.chapter_name || 'Unknown'}]\n${c.text}`
    ).join('\n\n---\n\n');
  } else {
    context = subject ? `Syllabus: ${subject}. Generate from NCERT Class 12 CBSE 2026-27 syllabus.${SYLLABUS_PROMPT(subject)}` : 'No context available.';
  }

  const typesStr = (questionTypes || ['short', 'long']).join(', ');

  const response = await callNvidia([
    { role: 'system', content: `You are an exam question generator for CBSE Class 12. Generate ${count} ${difficulty || 'medium'} difficulty questions from the syllabus content.
Question types: ${typesStr}.
Include expected marks (2, 5, or 10) and model answers with references.
Return JSON array: [{ "question": "...", "question_type": "short|long|mcq|essay", "marks": 2|5|10, "difficulty": "easy|medium|hard", "model_answer": "...", "page_reference": "page number or null", "chapter_name": "..." }]` },
    { role: 'user', content: `${context}\n\nGenerate ${count} exam-style questions.` }
  ], {
    temperature: 0.4,
    max_tokens: 3000,
    timeout: 60000
  });

  if (!response) return null;
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) return parsed;
    const extracted = response.match(/\[[\s\S]*\]/);
    return extracted ? JSON.parse(extracted[0]) : null;
  } catch {
    return null;
  }
}

export async function explainConcept(question, contextChunks, language, subject) {
  let context;
  if (contextChunks.length > 0) {
    context = contextChunks.map(c =>
      `[Page ${c.page_number}, Chapter: ${c.chapter_name || 'Unknown'}]\n${c.text}`
    ).join('\n\n---\n\n');
  } else {
    context = SYLLABUS_PROMPT(subject);
  }

  const systemPrompt = `You are a friendly tutor who explains concepts simply, like to a 16-year-old student.
- Use analogies and real-life examples
- Break down complex ideas step by step
- Encourage understanding over memorization
- Suggest how the student can write the answer in their own words
- Keep it conversational and encouraging
${language === 'tamil' ? 'Explain in Tamil.' : language === 'hinglish' ? 'Explain in Hinglish.' : 'Explain in simple English.'}`;

  return callNvidia([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${context}\n\nStudent's question: ${question}\n\nExplain this concept simply, like I'm 16 years old.` }
  ], {
    temperature: 0.5,
    max_tokens: 800,
    timeout: 30000
  });
}

export { generateEmbedding, callNvidia, answerFromSyllabus };
