import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'server', 'uploads');

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  return UPLOADS_DIR;
}

export function getFilePath(filename) {
  return path.join(UPLOADS_DIR, filename);
}

export async function extractTextFromPDF(pdfPath) {
  try {
    const { extractText } = await import('unpdf');
    const fileBuffer = fs.readFileSync(pdfPath);
    const pdf = await extractText(fileBuffer);
    return pdf.text || '';
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    return null;
  }
}

export function detectChapters(text) {
  const chapterPatterns = [
    /(?:chapter|unit|module|lesson)\s*[:\s]*(?:[0-9]+|[IVXLCDM]+)\s*[:\s.-]*([^\n]+)/gi,
    /^([A-Z][A-Z\s]{2,50})$/gm,
    /^(\d+\.\d+\s+[A-Z][^\n]{2,100})$/gm
  ];

  const chapters = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const pattern of chapterPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        const name = (match[1] || match[0]).trim().substring(0, 200);
        if (name.length > 3 && !chapters.find(c => c.name === name)) {
          chapters.push({ name, lineNumber: i + 1 });
        }
        break;
      }
    }
  }

  return chapters;
}

export function chunkText(text, chunkSize = 1000, overlap = 200, chapters = []) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  let currentChapter = 'Introduction';
  let currentPage = 1;
  let chunkIndex = 0;

  const pagePattern = /page\s*(\d+)|\[page\s*(\d+)\]|(\d+)\s*\[page\]/gi;

  for (let para of paragraphs) {
    para = para.trim();
    if (!para) continue;

    for (const ch of chapters) {
      if (para.toLowerCase().includes(ch.name.toLowerCase())) {
        currentChapter = ch.name;
      }
    }

    const pageMatch = pagePattern.exec(para);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3]) || currentPage;
    }

    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        index: chunkIndex,
        text: currentChunk.trim(),
        chapter: currentChapter,
        page: currentPage
      });
      chunkIndex++;
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5)).join(' ');
      currentChunk = overlapWords + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.trim(),
      chapter: currentChapter,
      page: currentPage
    });
  }

  return chunks;
}

export function generateChunkId(textbookId, chunkIndex) {
  return `${textbookId}_${chunkIndex}`;
}

export async function saveUploadedFile(file) {
  ensureUploadsDir();
  const ext = path.extname(file.originalname || '.pdf');
  const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  if (file.buffer) {
    fs.writeFileSync(filepath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, filepath);
  }

  return {
    filename,
    filepath,
    extension: ext,
    size: file.size || (file.buffer ? file.buffer.length : 0)
  };
}

export default { extractTextFromPDF, detectChapters, chunkText, generateChunkId, saveUploadedFile, ensureUploadsDir };
