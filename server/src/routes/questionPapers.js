import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../auth.js';
import { supabase } from '../db.js';
import { extractTextFromPDF } from '../ai/pdfProcessor.js';
import { generateQuestionsFromPaper } from '../ai/questionGenerator.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { school_id, textbook_id, exam_type, year, month } = req.body;
    if (!exam_type) return res.status(400).json({ error: 'exam_type required' });

    let filePath = null;
    if (req.file) {
      const { saveUploadedFile } = await import('../ai/pdfProcessor.js');
      const saved = await saveUploadedFile(req.file);
      filePath = saved.filename;
    }

    const { data, error } = await supabase.from('question_papers').insert({
      school_id: school_id || null,
      textbook_id: textbook_id || null,
      exam_type,
      year: year ? parseInt(year) : null,
      month: month ? parseInt(month) : null,
      file_path: filePath,
      uploaded_by: req.user.id
    }).select().single();

    if (error) throw new Error(error.message);
    res.status(201).json({ question_paper: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { school_id, textbook_id, exam_type } = req.query;
    let query = supabase.from('question_papers')
      .select('*, schools(name), textbooks(title)')
      .order('year', { ascending: false });

    if (school_id) query = query.eq('school_id', school_id);
    if (textbook_id) query = query.eq('textbook_id', textbook_id);
    if (exam_type) query = query.eq('exam_type', exam_type);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json({ question_papers: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('question_papers')
      .select('*, schools(name), textbooks(title, subject), questions(*)')
      .eq('id', req.params.id).single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Question paper not found' });
    res.json({ question_paper: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/extract', authenticateToken, async (req, res) => {
  try {
    const { data: qp, error } = await supabase.from('question_papers')
      .select('*').eq('id', req.params.id).single();
    if (error || !qp) return res.status(404).json({ error: 'Question paper not found' });

    if (!qp.file_path) return res.status(400).json({ error: 'No file to extract from' });

    const extracted = await extractTextFromPDF(`uploads/${qp.file_path}`);
    if (!extracted) return res.status(500).json({ error: 'Failed to extract text' });

    const questions = await generateQuestionsFromPaper(extracted, qp.exam_type);
    if (!questions) return res.status(500).json({ error: 'Failed to extract questions' });

    await supabase.from('question_papers').update({
      extracted_questions: questions
    }).eq('id', qp.id);

    for (const q of questions) {
      await supabase.from('questions').insert({
        question_paper_id: qp.id,
        textbook_id: qp.textbook_id,
        question_text: q.question_text,
        question_type: q.question_type || 'short',
        marks: q.marks || 2,
        created_by: req.user.id
      }).catch(() => {});
    }

    res.json({ questions, count: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
