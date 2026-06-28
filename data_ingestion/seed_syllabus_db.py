import os
import sys
import json
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.models.database import init_db, SessionLocal, Subject, Chapter, MarkingScheme

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
SYLLABUS_PATH = os.path.join(DATA_DIR, "cbse_2026_27_syllabus.json")


def seed_database():
    init_db()
    db = SessionLocal()

    try:
        existing = db.query(Subject).count()
        if existing > 0:
            print(f"Database already has {existing} subjects. Skipping seed.")
            return

        with open(SYLLABUS_PATH, "r") as f:
            syllabus = json.load(f)

        for subj_data in syllabus["subjects"]:
            subject = Subject(
                id=str(uuid.uuid4()),
                name=subj_data["name"],
                code=subj_data["code"],
                total_theory_marks=subj_data["total_theory_marks"],
                total_practical_marks=subj_data["total_practical_marks"],
                exam_duration=subj_data["exam_duration"]
            )
            db.add(subject)
            db.flush()

            for unit in subj_data.get("units", []):
                for ch_data in unit.get("chapters", []):
                    chapter = Chapter(
                        id=str(uuid.uuid4()),
                        subject_id=subject.id,
                        unit_number=unit.get("unit_number", 0),
                        unit_name=unit.get("unit_name", ""),
                        chapter_number=ch_data.get("chapter_number", 0),
                        chapter_name=ch_data["name"],
                        marks_weightage=ch_data.get("marks", 0),
                        ncert_part=ch_data.get("ncert_part"),
                        ncert_page_start=ch_data.get("page_start"),
                        ncert_page_end=ch_data.get("page_end"),
                        is_deleted_in_2026_27=False,
                        is_added_in_2026_27=False
                    )
                    db.add(chapter)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


def seed_marking_schemes():
    db = SessionLocal()
    try:
        existing = db.query(MarkingScheme).count()
        if existing > 0:
            print(f"Database already has {existing} marking schemes. Skipping.")
            return

        marking_dir = os.path.join(DATA_DIR, "marking_schemes")
        for mf in os.listdir(marking_dir):
            if not mf.endswith(".json"):
                continue
            path = os.path.join(marking_dir, mf)
            with open(path, "r") as f:
                schemes = json.load(f)

            for scheme in schemes:
                chapter = db.query(Chapter).filter(
                    Chapter.chapter_name == scheme["chapter"]
                ).first()

                ms = MarkingScheme(
                    id=str(uuid.uuid4()),
                    chapter_id=chapter.id if chapter else None,
                    question_type=scheme.get("question_type", ""),
                    marks=scheme.get("marks", 0),
                    step_breakdown=scheme.get("steps", []),
                    sample_answer=scheme.get("sample_answer", ""),
                    common_mistakes=scheme.get("common_mistakes", [])
                )
                db.add(ms)

        db.commit()
        print("Marking schemes seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding marking schemes: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    seed_marking_schemes()
