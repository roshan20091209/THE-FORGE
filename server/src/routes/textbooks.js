import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../auth.js';
import { uploadTextbook, indexTextbook, getTextbooks, getTextbookById, getTextbookChunks, deleteTextbook } from '../services/textbookService.js';
import { supabase } from '../db.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file required' });

    const { subject, grade, title, author, publisher, year, school_id } = req.body;
    if (!subject || !title) return res.status(400).json({ error: 'Subject and title required' });

    const textbook = await uploadTextbook(req.file, {
      school_id: school_id || null,
      subject, grade: grade || '12', title,
      author, publisher, year: year ? parseInt(year) : null
    }, req.user.id);

    res.status(201).json({ textbook, message: 'Textbook uploaded. Indexing will begin shortly.' });

    indexTextbook(textbook.id).then(result => {
      console.log(`Textbook ${textbook.id} indexed:`, result.message);
    }).catch(err => {
      console.error(`Textbook ${textbook.id} indexing failed:`, err.message);
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { school_id, grade, subject, indexing_status } = req.query;
    const textbooks = await getTextbooks({
      school_id, grade, subject, indexing_status
    });
    res.json({ textbooks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const textbook = await getTextbookById(req.params.id);
    if (!textbook) return res.status(404).json({ error: 'Textbook not found' });
    res.json({ textbook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const result = await deleteTextbook(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/index', authenticateToken, async (req, res) => {
  try {
    const result = await indexTextbook(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabase.from('textbooks')
      .select('indexing_status, indexed_at, total_chunks')
      .eq('id', req.params.id).single();
    if (!data) return res.status(404).json({ error: 'Textbook not found' });
    res.json({ status: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('chapters')
      .select('*').eq('textbook_id', req.params.id).order('chapter_number');
    if (error) throw new Error(error.message);
    res.json({ chapters: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
