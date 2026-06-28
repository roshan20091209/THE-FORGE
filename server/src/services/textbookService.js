import { supabase } from '../db.js';
import { extractTextFromPDF, detectChapters, chunkText, generateChunkId, saveUploadedFile } from '../ai/pdfProcessor.js';
import { generateEmbedding } from '../ai/ragEngine.js';
import fs from 'fs';

export async function uploadTextbook(file, metadata, userId) {
  const savedFile = await saveUploadedFile(file);

  const { data: textbook, error } = await supabase.from('textbooks').insert({
    school_id: metadata.school_id || null,
    subject: metadata.subject,
    grade: metadata.grade || '12',
    title: metadata.title,
    author: metadata.author || null,
    publisher: metadata.publisher || null,
    year: metadata.year || null,
    file_path: savedFile.filename,
    file_size: savedFile.size,
    indexing_status: 'pending',
    created_by: userId
  }).select().single();

  if (error) throw new Error(`Failed to create textbook: ${error.message}`);
  return textbook;
}

export async function indexTextbook(textbookId) {
  const { data: textbook, error } = await supabase.from('textbooks')
    .select('*').eq('id', textbookId).single();

  if (error || !textbook) throw new Error('Textbook not found');
  if (textbook.indexing_status === 'completed') return { message: 'Already indexed' };

  await supabase.from('textbooks').update({ indexing_status: 'processing' }).eq('id', textbookId);

  try {
    const filePath = `uploads/${textbook.file_path}`;
    if (!fs.existsSync(filePath)) {
      throw new Error('Textbook file not found on server');
    }

    const fullText = await extractTextFromPDF(filePath);
    if (!fullText) throw new Error('Failed to extract text from PDF');

    const chapters = detectChapters(fullText);

    const chunks = chunkText(fullText, 1000, 200, chapters);

    let insertedChapters = [];
    for (const ch of chapters) {
      const { data } = await supabase.from('chapters').insert({
        textbook_id: textbookId,
        chapter_name: ch.name,
        chapter_number: chapters.indexOf(ch) + 1,
        page_start: ch.lineNumber
      }).select().single().catch(() => null);
      if (data) insertedChapters.push(data);
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = generateChunkId(textbookId, i);

      const embedding = await generateEmbedding(chunk.text);

      await supabase.from('textbook_chunks').insert({
        textbook_id: textbookId,
        chunk_index: i,
        page_number: chunk.page || null,
        chapter_name: chunk.chapter || null,
        content_preview: chunk.text.substring(0, 500),
        vector_id: embedding ? chunkId : null,
        embedding_model: embedding ? 'NV-Embed-QA' : null
      });
    }

    await supabase.from('textbooks').update({
      indexing_status: 'completed',
      indexed_at: new Date().toISOString(),
      total_chunks: chunks.length,
      page_count: Math.max(...chunks.map(c => c.page || 0)) || null
    }).eq('id', textbookId);

    return { message: 'Indexing completed', chunks: chunks.length, chapters: insertedChapters.length };
  } catch (err) {
    await supabase.from('textbooks').update({
      indexing_status: 'failed'
    }).eq('id', textbookId);
    throw err;
  }
}

export async function getTextbooks(filters = {}) {
  let query = supabase.from('textbooks').select('*, schools(name)');

  if (filters.school_id) query = query.eq('school_id', filters.school_id);
  if (filters.grade) query = query.eq('grade', filters.grade);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.indexing_status) query = query.eq('indexing_status', filters.indexing_status);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTextbookById(id) {
  const { data, error } = await supabase.from('textbooks')
    .select('*, schools(name), chapters(*)')
    .eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTextbookChunks(textbookId, filters = {}) {
  let query = supabase.from('textbook_chunks').select('*').eq('textbook_id', textbookId).order('chunk_index');

  if (filters.chapter_name) query = query.eq('chapter_name', filters.chapter_name);
  if (filters.page_number) query = query.eq('page_number', filters.page_number);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteTextbook(id) {
  const { data: textbook } = await supabase.from('textbooks').select('file_path').eq('id', id).single();

  if (textbook?.file_path) {
    const filepath = `uploads/${textbook.file_path}`;
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  const { error } = await supabase.from('textbooks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { message: 'Textbook deleted' };
}

export default { uploadTextbook, indexTextbook, getTextbooks, getTextbookById, getTextbookChunks, deleteTextbook };
