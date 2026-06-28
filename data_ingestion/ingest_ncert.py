import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.pdf_processor import PDFProcessor
from app.core.nim_client import create_embedding
import chromadb

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
SYLLABUS_PATH = os.path.join(DATA_DIR, "cbse_2026_27_syllabus.json")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")


def load_syllabus():
    with open(SYLLABUS_PATH, "r") as f:
        return json.load(f)


def get_ncert_path(subject: str, chapter_name: str) -> str:
    base = os.path.join(DATA_DIR, "ncert_pdfs")
    safe_name = f"{subject}_{chapter_name.replace(' ', '_')}.pdf"
    return os.path.join(base, safe_name)


def ingest_textbook(pdf_path: str, subject: str, chapter_meta: dict):
    if not os.path.exists(pdf_path):
        print(f"  [SKIP] PDF not found: {pdf_path}")
        return []

    processor = PDFProcessor(chunk_size=500, overlap=50)
    chunks = processor.process_ncert_pdf(pdf_path, subject, chapter_meta)

    print(f"  Generated {len(chunks)} chunks")

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection_names = [c.name for c in client.list_collections()]
    if "cbse_2026_27" not in collection_names:
        collection = client.create_collection(name="cbse_2026_27", metadata={"hnsw:space": "cosine"})
    else:
        collection = client.get_collection(name="cbse_2026_27")

    existing_count = collection.count()
    batch_size = 16

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = []
        for t in texts:
            emb = create_embedding(t)
            embeddings.append(emb or [0.0] * 768)

        collection.add(
            documents=texts,
            embeddings=embeddings,
            ids=[f"{subject}_{chapter_meta['name']}_{c['chunk_index']}_{existing_count + i + idx}" for idx, c in enumerate(batch)],
            metadatas=[{
                "subject": subject,
                "chapter": c["chapter"],
                "page": c["page"],
                "chunk_index": c["chunk_index"]
            } for c in batch]
        )

    print(f"  Stored in ChromaDB (total: {collection.count()})")
    return chunks


def main():
    syllabus = load_syllabus()
    ncert_dir = os.path.join(DATA_DIR, "ncert_pdfs")
    os.makedirs(ncert_dir, exist_ok=True)
    os.makedirs(CHROMA_DIR, exist_ok=True)

    for subject_data in syllabus["subjects"]:
        subject = subject_data["name"]
        print(f"\n{'='*50}")
        print(f"Processing {subject}...")
        print(f"{'='*50}")

        for unit in subject_data["units"]:
            for chapter in unit["chapters"]:
                chapter_name = chapter["name"]
                print(f"\n  Chapter: {chapter_name} ({chapter.get('marks', '?')} marks)")

                pdf_path = get_ncert_path(subject, chapter_name)
                manifest_path = pdf_path.replace(".pdf", "_manifest.json")

                if not os.path.exists(pdf_path):
                    print(f"  [SKIP] Place NCERT PDF at: {pdf_path}")
                    print(f"  Download from: https://ncert.nic.in/textbook.php")
                    continue

                meta = {
                    "name": chapter_name,
                    "subject": subject,
                    "unit": unit["unit_name"],
                    "unit_number": unit.get("unit_number", 0),
                    "marks": chapter.get("marks", 0),
                    "page_start": chapter.get("page_start"),
                    "page_end": chapter.get("page_end")
                }

                chunks = ingest_textbook(pdf_path, subject, meta)

                if chunks:
                    manifest = {
                        "chapter": chapter_name,
                        "subject": subject,
                        "chunk_count": len(chunks),
                        "pages": meta
                    }
                    with open(manifest_path, "w") as f:
                        json.dump(manifest, f, indent=2)

    print("\n=== Ingestion Complete ===")


if __name__ == "__main__":
    main()
