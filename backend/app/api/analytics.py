from fastapi import APIRouter
from ..models.database import SessionLocal, Conversation, Assignment
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/analytics/dau")
async def get_dau():
    db = SessionLocal()
    try:
        today = datetime.now().date()
        start = datetime(today.year, today.month, today.day)
        end = start + timedelta(days=1)

        conversations = db.query(Conversation).filter(
            Conversation.created_at >= start,
            Conversation.created_at < end
        ).all()

        unique_users = set(c.user_id for c in conversations if c.user_id)
        return {"dau": len(unique_users), "total_queries": len(conversations)}
    finally:
        db.close()


@router.get("/analytics/popular-questions")
async def get_popular_questions(limit: int = 10):
    db = SessionLocal()
    try:
        questions = db.query(Conversation.question).all()
        from collections import Counter
        counter = Counter(q[0] for q in questions if q[0])
        most_common = counter.most_common(limit)
        return {
            "popular": [
                {"question": q, "count": c, "rank": i + 1}
                for i, (q, c) in enumerate(most_common)
            ]
        }
    finally:
        db.close()


@router.get("/analytics/chapter-usage")
async def get_chapter_usage():
    db = SessionLocal()
    try:
        usage = db.query(Conversation).all()
        chapter_counts = {}
        for c in usage:
            if c.chapter_id:
                chapter_counts[c.chapter_id] = chapter_counts.get(c.chapter_id, 0) + 1

        return {
            "chapter_usage": [
                {"chapter_id": ch, "query_count": count}
                for ch, count in sorted(chapter_counts.items(), key=lambda x: x[1], reverse=True)
            ]
        }
    finally:
        db.close()
