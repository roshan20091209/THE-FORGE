from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..core.rag_engine import ForgeRAG

router = APIRouter()
rag = ForgeRAG()


class AskRequest(BaseModel):
    question: str
    subject_id: Optional[str] = None
    subject: str
    chapter_id: Optional[str] = None
    chapter: Optional[str] = None
    marks: Optional[int] = 5
    mode: str = "direct"
    include_diagram: bool = False


class AskResponse(BaseModel):
    answer: str
    steps: list
    is_in_syllabus: bool
    page_references: list
    confidence: float
    suggested_questions: list = []


class BulkAskRequest(BaseModel):
    questions: List[str]
    subject: str
    marks_per_question: int = 2


class BulkAskResponse(BaseModel):
    answers: list
    incomplete_count: int
    not_in_syllabus: list


class GenerateQuestionsRequest(BaseModel):
    subject: str
    chapter: Optional[str] = None
    count: int = 10
    difficulty: str = "medium"
    question_types: Optional[List[str]] = None


@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    try:
        result = rag.answer(
            question=req.question,
            subject=req.subject,
            chapter=req.chapter or req.chapter_id,
            marks=req.marks,
            mode=req.mode
        )
        return AskResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask/explain", response_model=AskResponse)
async def explain_question(req: AskRequest):
    req.mode = "explain"
    try:
        result = rag.answer(
            question=req.question,
            subject=req.subject,
            chapter=req.chapter or req.chapter_id,
            marks=None,
            mode="explain"
        )
        return AskResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask/bulk", response_model=BulkAskResponse)
async def bulk_ask(req: BulkAskRequest):
    try:
        results = rag.bulk_answer(
            questions=req.questions,
            subject=req.subject,
            marks_per_question=req.marks_per_question
        )
        not_in_syllabus = [r["question"] for r in results if not r["is_in_syllabus"]]
        return BulkAskResponse(
            answers=results,
            incomplete_count=len(not_in_syllabus),
            not_in_syllabus=not_in_syllabus
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask/generate-questions")
async def generate_questions(req: GenerateQuestionsRequest):
    try:
        questions = rag.generate_question_bank(
            subject=req.subject,
            chapter=req.chapter,
            count=req.count,
            difficulty=req.difficulty,
            question_types=req.question_types
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
