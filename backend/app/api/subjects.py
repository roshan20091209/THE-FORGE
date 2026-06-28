from fastapi import APIRouter, HTTPException
from ..models.database import SessionLocal, Subject, Chapter

router = APIRouter()


@router.get("/subjects")
async def get_subjects():
    db = SessionLocal()
    try:
        subjects = db.query(Subject).all()
        return {
            "subjects": [
                {
                    "id": s.id,
                    "name": s.name,
                    "code": s.code,
                    "total_theory_marks": s.total_theory_marks,
                    "total_practical_marks": s.total_practical_marks,
                    "exam_duration": s.exam_duration
                }
                for s in subjects
            ]
        }
    finally:
        db.close()


@router.get("/subjects/{subject_id}/chapters")
async def get_subject_chapters(subject_id: str):
    db = SessionLocal()
    try:
        chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.chapter_number).all()
        return {
            "chapters": [
                {
                    "id": c.id,
                    "unit_number": c.unit_number,
                    "unit_name": c.unit_name,
                    "chapter_number": c.chapter_number,
                    "chapter_name": c.chapter_name,
                    "marks_weightage": c.marks_weightage,
                    "is_deleted_in_2026_27": c.is_deleted_in_2026_27,
                    "is_added_in_2026_27": c.is_added_in_2026_27
                }
                for c in chapters
            ]
        }
    finally:
        db.close()
