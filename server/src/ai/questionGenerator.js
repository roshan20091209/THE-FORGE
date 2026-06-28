import { callNvidia } from './ragEngine.js';

export async function generateQuestionsFromPaper(extractedText, examType) {
  const systemPrompt = `You are an exam question extractor. Given a question paper, extract ALL questions with their mark weightage.
Return JSON array of: { "question_text": "...", "marks": 2|3|5|8|10|15, "question_type": "short|long|essay|mcq|practical" }
If marks are not explicitly shown, estimate based on typical exam patterns.`;

  try {
    const response = await callNvidia([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract all questions from this ${examType} exam paper:\n\n${extractedText.substring(0, 8000)}` }
    ], { temperature: 0.1, max_tokens: 2000, timeout: 30000 });

    if (!response) return null;
    const cleaned = response.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function generateModelAnswers(questions, contextChunks, subject) {
  const context = contextChunks.map(c =>
    `[Page ${c.page_number}, ${c.chapter_name}]\n${c.text}`
  ).join('\n\n');

  const questionList = questions.map((q, i) =>
    `${i + 1}. [${q.marks} marks] ${q.question_text}`
  ).join('\n');

  const response = await callNvidia([
    { role: 'system', content: `You are an expert ${subject || 'school'} teacher creating model answers.
For each question, provide:
1. A model answer based strictly on textbook content
2. Page reference numbers
3. Key points that would get full marks in an exam
Return JSON array: [{ "question_text": "...", "model_answer": "...", "page_reference": "...", "key_points": ["..."] }]` },
    { role: 'user', content: `Textbook Content:\n${context}\n\nGenerate model answers for:\n${questionList}` }
  ], { temperature: 0.2, max_tokens: 4000, timeout: 60000 });

  if (!response) return null;
  try {
    const cleaned = response.replace(/```json?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export function estimateQuestionType(marks) {
  if (marks <= 1) return 'mcq';
  if (marks <= 3) return 'short';
  if (marks <= 5) return 'long';
  if (marks <= 8) return 'essay';
  return 'project';
}

export default { generateQuestionsFromPaper, generateModelAnswers, estimateQuestionType };
