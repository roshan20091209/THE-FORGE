import os
import chromadb
from typing import Optional
from .nim_client import LLMClient, create_embedding
from .osm_formatter import build_osm_system_prompt, parse_osm_answer

CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma_db")
RELEVANCE_THRESHOLD = 0.25


class ForgeRAG:
    def __init__(self):
        os.makedirs(CHROMA_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)

        collection_names = [c.name for c in self.client.list_collections()]
        if "cbse_2026_27" not in collection_names:
            self.collection = self.client.create_collection(
                name="cbse_2026_27",
                metadata={"hnsw:space": "cosine"}
            )
        else:
            self.collection = self.client.get_collection("cbse_2026_27")

        self.llm = None

    def _get_llm(self):
        if self.llm is None:
            self.llm = LLMClient(provider="nvidia")
        return self.llm

    def answer(self, question: str, subject: str, chapter: Optional[str] = None,
               marks: Optional[int] = None, mode: str = "direct") -> dict:
        q_embedding = create_embedding(question)
        if not q_embedding:
            return {
                "answer": "Could not process question. Please try again.",
                "is_in_syllabus": False,
                "steps": [],
                "page_references": [],
                "confidence": 0
            }

        where_filter = {"subject": subject}
        if chapter:
            where_filter["chapter"] = chapter

        try:
            results = self.collection.query(
                query_embeddings=[q_embedding],
                n_results=5,
                where=where_filter if chapter else {"subject": subject}
            )
        except Exception as e:
            print(f"Vector query error: {e}")
            return {
                "answer": "Textbook content not yet indexed. Please upload NCERT PDFs first.",
                "is_in_syllabus": False,
                "steps": [],
                "page_references": [],
                "confidence": 0
            }

        distances = results["distances"][0] if results.get("distances") else [1.0]
        documents = results["documents"][0] if results.get("documents") else []
        metadatas = results["metadatas"][0] if results.get("metadatas") else []

        if not documents or (distances and distances[0] > RELEVANCE_THRESHOLD):
            return {
                "answer": "This topic is not in your CBSE 2026-27 syllabus. Please verify with your textbook and Chettinad Vidyashram's portion list.",
                "is_in_syllabus": False,
                "steps": [],
                "page_references": [],
                "confidence": 0
            }

        context = "\n\n---\n\n".join(documents[:3])

        system_prompt = build_osm_system_prompt(subject, marks or 5)
        if mode == "explain":
            system_prompt += "\nExplain in simple language like a friendly tutor. Use analogies and real-life examples."

        user_prompt = (
            f"NCERT Textbook Context (CBSE 2026-27):\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Remember: Format your answer strictly according to the OSM marking scheme. "
            f"Cite page numbers from the context."
        )

        llm = self._get_llm()
        raw_answer = llm.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=1500
        )

        if not raw_answer:
            return {
                "answer": "Could not generate answer. Please try again.",
                "is_in_syllabus": True,
                "steps": [],
                "page_references": [],
                "confidence": 0.5
            }

        parsed = parse_osm_answer(raw_answer)

        page_refs = []
        for meta in metadatas:
            if meta and meta.get("page"):
                ref = {"chapter": meta.get("chapter", ""), "page": meta.get("page", "")}
                if ref not in page_refs:
                    page_refs.append(ref)

        confidence = 1 - (distances[0] if distances else 0.5)

        suggested = self._get_suggested_questions(documents, subject)

        return {
            "answer": raw_answer,
            "steps": parsed.get("steps", []),
            "is_in_syllabus": True,
            "page_references": page_refs[:3],
            "confidence": round(min(max(confidence, 0), 1), 2),
            "suggested_questions": suggested
        }

    def _get_suggested_questions(self, documents: list, subject: str) -> list:
        if not documents:
            return []
        try:
            llm = self._get_llm()
            context = documents[0][:500]
            response = llm.chat(
                messages=[
                    {"role": "system", "content": "Generate 3 follow-up questions a student might ask about this topic. Return as a JSON array of strings."},
                    {"role": "user", "content": f"Context: {context}\nSubject: {subject}\n\nGenerate 3 follow-up questions:"}
                ],
                temperature=0.3,
                max_tokens=200
            )
            if response:
                import json
                try:
                    questions = json.loads(response)
                    if isinstance(questions, list):
                        return questions[:3]
                except json.JSONDecodeError:
                    lines = [l for l in response.strip().split("\n") if l.strip()]
                    return [l.lstrip("0123456789.- ") for l in lines[:3]]
        except Exception:
            pass
        return []

    def bulk_answer(self, questions: list, subject: str, marks_per_question: int = 2) -> list:
        results = []
        for q in questions:
            result = self.answer(q, subject, marks=marks_per_question, mode="direct")
            results.append({
                "question": q,
                "answer": result["answer"],
                "is_in_syllabus": result["is_in_syllabus"],
                "page_references": result["page_references"]
            })
        return results

    def generate_question_bank(self, subject: str, chapter: Optional[str] = None,
                               count: int = 10, difficulty: str = "medium",
                               question_types: list = None) -> list:
        where_filter = {"subject": subject}
        if chapter:
            where_filter["chapter"] = chapter

        try:
            results = self.collection.get(where=where_filter)
        except Exception:
            return []

        documents = results.get("documents", [])
        if not documents:
            return []

        context = "\n\n".join(documents[:10])

        types_str = ", ".join(question_types or ["short", "long"])
        llm = self._get_llm()
        response = llm.chat(
            messages=[
                {"role": "system", "content": f"You are a CBSE exam question generator. Generate {count} {difficulty} difficulty questions with model answers in OSM format. Question types: {types_str}. Return JSON array: [{{'question': '...', 'marks': 2|3|5, 'difficulty': 'easy|medium|hard', 'question_type': 'short|long|mcq|essay', 'model_answer': '...', 'page_reference': '...', 'chapter_name': '...'}}]"},
                {"role": "user", "content": f"NCERT Context:\n{context}\n\nGenerate {count} exam-style questions for {subject}:"}
            ],
            temperature=0.4,
            max_tokens=4000
        )

        if not response:
            return []

        import json
        import re
        try:
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                return json.loads(json_match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass
        return []

    def close(self):
        if self.llm:
            self.llm.close()
