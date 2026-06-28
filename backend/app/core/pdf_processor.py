import os
import fitz
import re
from typing import Optional


class PDFProcessor:
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def extract_text(self, pdf_path: str) -> Optional[str]:
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += f"\n\n[Page {page.number + 1}]\n"
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return None

    def chunk_text(self, text: str, chapter_metadata: dict = None) -> list:
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = ""
        current_page = 1
        current_chapter = chapter_metadata.get("name", "Introduction") if chapter_metadata else "Introduction"
        chunk_index = 0
        page_match_pattern = re.compile(r'\[Page\s*(\d+)\]')

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            page_match = page_match_pattern.search(para)
            if page_match:
                current_page = int(page_match.group(1))

            if len(current_chunk) + len(para) > self.chunk_size and current_chunk:
                chunks.append({
                    "text": current_chunk.strip(),
                    "page": current_page,
                    "chapter": current_chapter,
                    "chunk_index": chunk_index
                })
                chunk_index += 1
                words = current_chunk.split()
                overlap_words = " ".join(words[-max(1, self.overlap // 5):])
                current_chunk = overlap_words + "\n\n" + para if overlap_words else para
            else:
                current_chunk += ("\n\n" + para) if current_chunk else para

        if current_chunk.strip():
            chunks.append({
                "text": current_chunk.strip(),
                "page": current_page,
                "chapter": current_chapter,
                "chunk_index": chunk_index
            })

        return chunks

    def detect_chapters(self, text: str) -> list:
        patterns = [
            r'(?:Chapter|Unit|Module|Lesson)\s*[:\s]*(?:[0-9]+|[IVXLCDM]+)\s*[:\s.-]*([^\n]+)',
            r'^([A-Z][A-Z\s]{2,50})$',
            r'^(\d+\.\d+\s+[A-Z][^\n]{2,100})$'
        ]

        chapters = []
        lines = text.split("\n")

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            for pattern in patterns:
                match = re.search(pattern, line, re.IGNORECASE | re.MULTILINE)
                if match:
                    name = (match.group(1) or match.group(0)).strip()[:200]
                    if len(name) > 3 and name not in [c["name"] for c in chapters]:
                        chapters.append({"name": name, "line_number": i + 1})
                    break

        return chapters

    def process_ncert_pdf(self, pdf_path: str, subject: str, chapter_metadata: dict) -> list:
        text = self.extract_text(pdf_path)
        if not text:
            return []

        chunks = self.chunk_text(text, chapter_metadata)

        for chunk in chunks:
            chunk["subject"] = subject
            chunk["chapter"] = chapter_metadata.get("name", chunk["chapter"])

        return chunks
