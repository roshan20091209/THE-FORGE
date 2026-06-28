import { supabase } from '../db.js';
import { generateEmbedding, answerFromContext, answerBulkQuestions, generateQuestions, explainConcept } from '../ai/ragEngine.js';
import { formatAnswer } from '../ai/osmFormatter.js';
import { getTextbookChunks } from './textbookService.js';

const RELEVANCE_THRESHOLD = 0.65;

export async function askQuestion({ question, textbookId, chapterId, marks, mode, language, userId }) {
  const startTime = Date.now();

  const chunks = await getTextbookChunks(textbookId, chapterId ? { chapter_name: undefined } : {});
  if (!chunks || chunks.length === 0) {
    return {
      answer: 'Textbook not indexed yet. Please wait for indexing to complete.',
      source: 'error',
      page_references: [],
      confidence: 0,
      tokens_used: 0
    };
  }

  const questionEmbedding = await generateEmbedding(question);
  let relevantChunks = chunks;

  if (questionEmbedding) {
    const chunksWithScores = chunks.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(questionEmbedding, chunk.vector_id ? null : null) || 0.5
    }));
    relevantChunks = chunksWithScores.filter(c => c.score >= RELEVANCE_THRESHOLD);
    if (relevantChunks.length === 0) relevantChunks = chunks.slice(0, 5);
  } else {
    relevantChunks = chunks.slice(0, 5);
  }

  const topChunks = relevantChunks.slice(0, 5);

  const textbook = await supabase.from('textbooks').select('subject').eq('id', textbookId).single()
    .then(r => r.data);

  if (mode === 'explain') {
    const explanation = await explainConcept(question, topChunks, language);
    const responseTime = Date.now() - startTime;

    await logConversation({
      userId, question, answer: explanation, source: 'textbook',
      pageReferences: topChunks.map(c => ({ chapter: c.chapter_name, page: c.page_number })),
      confidence: 0.8, marks, mode, responseTime, tokensUsed: 0
    });

    return {
      answer: explanation || 'Could not generate explanation.',
      source: 'textbook',
      page_references: topChunks.map(c => ({ chapter: c.chapter_name, page: c.page_number })),
      confidence: 0.8,
      tokens_used: 0
    };
  }

  const rawAnswer = await answerFromContext(question, topChunks, marks, language, textbook?.subject);

  if (!rawAnswer || rawAnswer.toLowerCase().includes('not in syllabus')) {
    const responseTime = Date.now() - startTime;

    await logConversation({
      userId, question, answer: 'Not in syllabus', source: 'not_in_syllabus',
      pageReferences: [], confidence: 0, marks, mode, responseTime, tokensUsed: 0
    });

    return {
      answer: 'This topic is not covered in your syllabus textbook.',
      source: 'not_in_syllabus',
      page_references: [],
      confidence: 0,
      tokens_used: 0
    };
  }

  let formattedAnswer = rawAnswer;
  if (marks && mode !== 'explain') {
    formattedAnswer = formatAnswer(rawAnswer, marks, textbook?.subject);
  }

  const responseTime = Date.now() - startTime;
  const tokensUsed = Math.round((question.length + formattedAnswer.length) / 4);

  await logConversation({
    userId, question, answer: formattedAnswer, source: 'textbook',
    pageReferences: topChunks.map(c => ({ chapter: c.chapter_name, page: c.page_number })),
    confidence: 0.85, marks, mode, responseTime, tokensUsed
  });

  return {
    answer: formattedAnswer,
    source: 'textbook',
    page_references: topChunks.map(c => ({ chapter: c.chapter_name, page: c.page_number })),
    confidence: 0.85,
    tokens_used: tokensUsed
  };
}

export async function solveAssignment({ questions, textbookId, marksPerQuestion, language, userId }) {
  const startTime = Date.now();

  const chunks = await getTextbookChunks(textbookId);
  if (!chunks || chunks.length === 0) {
    return { answers: [], incomplete_count: questions.length, not_in_syllabus: questions };
  }

  const topChunks = chunks.slice(0, 10);

  const results = await answerBulkQuestions(questions, topChunks, marksPerQuestion || 2, language);

  if (!results) {
    const answers = questions.map(q => ({
      question: q, answer: 'Failed to generate answer. Please try again.',
      page_reference: null, source: 'error'
    }));
    return { answers, incomplete_count: questions.length, not_in_syllabus: [] };
  }

  const notInSyllabus = results.filter(r => r.source === 'not_in_syllabus').map(r => r.question);

  const responseTime = Date.now() - startTime;
  for (const r of results) {
    await logConversation({
      userId, question: r.question, answer: r.answer,
      source: r.source || 'textbook',
      pageReferences: r.page_reference ? [{ page: r.page_reference }] : [],
      confidence: 0.8, marks: marksPerQuestion, mode: 'assignment',
      responseTime, tokensUsed: 0
    });
  }

  return {
    answers: results,
    incomplete_count: notInSyllabus.length,
    not_in_syllabus: notInSyllabus
  };
}

export async function generateQuestionBank({ textbookId, chapterId, count, difficulty, questionTypes, userId }) {
  const filter = {};
  if (chapterId) filter.chapter_name = null;

  const chunks = await getTextbookChunks(textbookId, filter);
  if (!chunks || chunks.length === 0) {
    return { questions: [], message: 'Textbook not yet indexed' };
  }

  const topChunks = chunks.slice(0, 20);

  if (chapterId) {
    const { data: chapter } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
    if (chapter) {
      const filteredChunks = chunks.filter(c =>
        c.chapter_name?.toLowerCase() === chapter.chapter_name?.toLowerCase()
      );
      if (filteredChunks.length > 0) topChunks = filteredChunks.slice(0, 20);
    }
  }

  const questions = await generateQuestions(topChunks, count || 10, difficulty || 'medium', questionTypes);

  if (questions) {
    for (const q of questions) {
      await supabase.from('questions').insert({
        textbook_id: textbookId,
        chapter_id: chapterId || null,
        question_text: q.question,
        question_type: q.question_type || 'short',
        marks: q.marks || 2,
        difficulty: q.difficulty || 'medium',
        model_answer: q.model_answer || null,
        page_reference: q.page_reference || null,
        created_by: userId
      }).catch(() => {});
    }
  }

  return { questions: questions || [], message: questions ? 'Questions generated' : 'Generation failed' };
}

export async function getConversationHistory(userId, limit = 50) {
  const { data, error } = await supabase.from('conversations')
    .select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

async function logConversation({ userId, question, answer, source, pageReferences, confidence, marks, mode, responseTime, tokensUsed }) {
  try {
    await supabase.from('conversations').insert({
      user_id: userId,
      question,
      answer,
      answer_source: source,
      page_references: pageReferences,
      confidence_score: confidence,
      marks_requested: marks,
      mode,
      response_time_ms: responseTime,
      tokens_used: tokensUsed
    });
  } catch (err) {
    console.error('Failed to log conversation:', err.message);
  }

  if (userId) {
    await supabase.rpc('increment_daily_question_count', { user_id: userId }).catch(() => {});
  }
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export default { askQuestion, solveAssignment, generateQuestionBank, getConversationHistory };
