from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./forge.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    clerk_id = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    school = Column(String, default="Chettinad Vidyashram")
    class_grade = Column(String, default="12")
    section = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, nullable=True)
    name = Column(String, nullable=False)
    total_theory_marks = Column(Integer, default=70)
    total_practical_marks = Column(Integer, default=30)
    exam_duration = Column(Integer, default=180)


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    unit_number = Column(Integer, nullable=True)
    unit_name = Column(String, nullable=True)
    chapter_number = Column(Integer, nullable=True)
    chapter_name = Column(String, nullable=False)
    marks_weightage = Column(Integer, default=0)
    ncert_part = Column(String, nullable=True)
    ncert_page_start = Column(Integer, nullable=True)
    ncert_page_end = Column(Integer, nullable=True)
    is_deleted_in_2026_27 = Column(Boolean, default=False)
    is_added_in_2026_27 = Column(Boolean, default=False)


class TextbookChunk(Base):
    __tablename__ = "textbook_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=True)
    chunk_index = Column(Integer, nullable=True)
    content = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)


class MarkingScheme(Base):
    __tablename__ = "marking_schemes"

    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=True)
    question_type = Column(String, nullable=True)
    marks = Column(Integer, nullable=True)
    step_breakdown = Column(JSON, nullable=True)
    sample_answer = Column(Text, nullable=True)
    common_mistakes = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=True)


class PYQ(Base):
    __tablename__ = "pyqs"

    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=True)
    year = Column(Integer, nullable=True)
    exam_type = Column(String, nullable=True)
    question_text = Column(Text, nullable=False)
    marks = Column(Integer, default=0)
    question_type = Column(String, nullable=True)
    answer_key = Column(Text, nullable=True)
    frequency = Column(Integer, default=1)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, nullable=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=True)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=True)
    answer_format = Column(String, nullable=True)
    marks_requested = Column(Integer, nullable=True)
    is_syllabus_locked = Column(Boolean, default=True)
    page_references = Column(JSON, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=True)
    questions = Column(JSON, nullable=True)
    answers = Column(JSON, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)
    return SessionLocal()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
