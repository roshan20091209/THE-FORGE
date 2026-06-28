from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..core.rag_engine import ForgeRAG

router = APIRouter()
rag = ForgeRAG()


class QBankGenerate(BaseModel):
    subject: str
    chapter: Optional[str] = None
    count: int = 10
    difficulty: str = "medium"
    question_types: Optional[List[str]] = None


@router.post("/question-bank/generate")
async def generate_qbank(req: QBankGenerate):
    try:
        questions = rag.generate_question_bank(
            subject=req.subject,
            chapter=req.chapter,
            count=req.count,
            difficulty=req.difficulty,
            question_types=req.question_types
        )
        return {"questions": questions, "count": len(questions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
