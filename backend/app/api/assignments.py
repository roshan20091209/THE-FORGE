from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..core.rag_engine import ForgeRAG

router = APIRouter()
rag = ForgeRAG()


class AssignmentCreate(BaseModel):
    title: Optional[str] = None
    questions: List[str]
    subject: str
    marks_per_question: int = 2


class AssignmentGenerate(BaseModel):
    assignment_id: str


@router.post("/assignments")
async def create_assignment(req: AssignmentCreate):
    from ..models.database import SessionLocal, Assignment
    import uuid
    from datetime import datetime

    db = SessionLocal()
    try:
        assignment = Assignment(
            id=str(uuid.uuid4()),
            title=req.title or f"Assignment {datetime.now().strftime('%d %b')}",
            subject_id=req.subject,
            questions=req.questions,
            status="pending",
            created_at=datetime.now()
        )
        db.add(assignment)
        db.commit()
        return {"assignment": {"id": assignment.id, "title": assignment.title, "status": assignment.status, "question_count": len(req.questions)}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: str):
    from ..models.database import SessionLocal, Assignment

    db = SessionLocal()
    try:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return {"assignment": {"id": assignment.id, "title": assignment.title, "questions": assignment.questions, "answers": assignment.answers, "status": assignment.status}}
    finally:
        db.close()


@router.post("/assignments/{assignment_id}/generate")
async def generate_assignment(assignment_id: str, subject: str = "Physics", marks_per_question: int = 2):
    from ..models.database import SessionLocal, Assignment

    db = SessionLocal()
    try:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        questions = assignment.questions or []
        results = rag.bulk_answer(questions, subject, marks_per_question)

        assignment.answers = results
        assignment.status = "completed"
        db.commit()

        return {"answers": results, "status": "completed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
