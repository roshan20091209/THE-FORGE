import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { askQuestion, solveAssignment, generateQuestionBank, getConversationHistory } from '../services/qaService.js';
import { checkDailyQuestionLimit } from '../services/subscriptionService.js';

const router = Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { question, textbook_id, chapter_id, marks, mode, language } = req.body;
    if (!question || !textbook_id) {
      return res.status(400).json({ error: 'Question and textbook_id required' });
    }

    const limitCheck = await checkDailyQuestionLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: `Daily question limit reached (${limitCheck.limit}). Upgrade to Pro for unlimited questions.`,
        limit: limitCheck
      });
    }

    const result = await askQuestion({
      question,
      textbookId: textbook_id,
      chapterId: chapter_id || null,
      marks: marks || null,
      mode: mode || 'direct',
      language: language || 'english',
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/explain', authenticateToken, async (req, res) => {
  try {
    const { question, textbook_id, chapter_id, language } = req.body;
    if (!question || !textbook_id) {
      return res.status(400).json({ error: 'Question and textbook_id required' });
    }

    const limitCheck = await checkDailyQuestionLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: `Daily question limit reached (${limitCheck.limit}). Upgrade to Pro for unlimited questions.`,
        limit: limitCheck
      });
    }

    const result = await askQuestion({
      question,
      textbookId: textbook_id,
      chapterId: chapter_id || null,
      marks: null,
      mode: 'explain',
      language: language || 'english',
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assignment', authenticateToken, async (req, res) => {
  try {
    const { questions, textbook_id, marks_per_question, language } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0 || !textbook_id) {
      return res.status(400).json({ error: 'Questions array and textbook_id required' });
    }

    if (questions.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 questions per assignment' });
    }

    const result = await solveAssignment({
      questions,
      textbookId: textbook_id,
      marksPerQuestion: marks_per_question || 2,
      language: language || 'english',
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate-questions', authenticateToken, async (req, res) => {
  try {
    const { textbook_id, chapter_id, count, difficulty, question_types } = req.body;
    if (!textbook_id) {
      return res.status(400).json({ error: 'textbook_id required' });
    }

    const result = await generateQuestionBank({
      textbookId: textbook_id,
      chapterId: chapter_id || null,
      count: count || 10,
      difficulty: difficulty || 'medium',
      questionTypes: question_types || ['short', 'long'],
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getConversationHistory(req.user.id, limit);
    res.json({ conversations: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
