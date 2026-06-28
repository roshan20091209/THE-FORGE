import os
import json
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.nim_client import create_embedding
import chromadb

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
PYQ_DIR = os.path.join(DATA_DIR, "pyqs")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")


SAMPLE_PYQS = {
    "Physics": [
        {
            "year": 2025,
            "chapter": "Electric Charges and Fields",
            "question": "State Coulomb's law and derive expression for electric field due to a point charge.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2024,
            "chapter": "Electrostatic Potential and Capacitance",
            "question": "Derive expression for capacitance of a parallel plate capacitor.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 2
        },
        {
            "year": 2025,
            "chapter": "Current Electricity",
            "question": "State Kirchhoff's laws and apply them to find current in a circuit.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 4
        },
        {
            "year": 2024,
            "chapter": "Moving Charges and Magnetism",
            "question": "Derive expression for magnetic field at a point on the axis of a circular current loop.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 2
        },
        {
            "year": 2025,
            "chapter": "Ray Optics and Optical Instruments",
            "question": "Derive mirror formula for a concave mirror.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2024,
            "chapter": "Dual Nature of Radiation and Matter",
            "question": "State Einstein's photoelectric equation and explain photoelectric effect.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        }
    ],
    "Chemistry": [
        {
            "year": 2025,
            "chapter": "Solutions",
            "question": "State Raoult's law for a solution of volatile liquids.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2024,
            "chapter": "Electrochemistry",
            "question": "Derive Nernst equation and calculate EMF of a cell.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2025,
            "chapter": "Coordination Compounds",
            "question": "Explain valence bond theory with example of [Co(NH3)6]3+.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 2
        },
        {
            "year": 2024,
            "chapter": "Aldehydes, Ketones and Carboxylic Acids",
            "question": "Explain Aldol condensation with mechanism.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 4
        }
    ],
    "Mathematics": [
        {
            "year": 2025,
            "chapter": "Matrices",
            "question": "Find the inverse of a 3x3 matrix using elementary row operations.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2024,
            "chapter": "Continuity and Differentiability",
            "question": "If y = sin-1(x), find dy/dx.",
            "marks": 3,
            "question_type": "SA",
            "frequency": 5
        },
        {
            "year": 2025,
            "chapter": "Integrals",
            "question": "Evaluate integral of x^2 sin(x) dx using integration by parts.",
            "marks": 5,
            "question_type": "LA",
            "frequency": 3
        },
        {
            "year": 2024,
            "chapter": "Probability",
            "question": "A bag contains 4 red and 5 black balls. Find probability of drawing 2 red balls.",
            "marks": 3,
            "question_type": "SA",
            "frequency": 4
        }
    ]
}


def ingest_pyqs():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection_names = [c.name for c in client.list_collections()]

    if "pyqs" not in collection_names:
        collection = client.create_collection(
            name="pyqs",
            metadata={"hnsw:space": "cosine"}
        )
    else:
        collection = client.get_collection(name="pyqs")

    existing = collection.count()
    if existing > 0:
        print(f"PYQ collection already has {existing} entries. Skipping.")
        return

    os.makedirs(PYQ_DIR, exist_ok=True)

    all_pyqs = []

    for subject, questions in SAMPLE_PYQS.items():
        for pq in questions:
            all_pyqs.append(pq)

        sub_file = os.path.join(PYQ_DIR, f"{subject.lower()}_pyqs.json")
        with open(sub_file, "w") as f:
            json.dump(questions, f, indent=2)
        print(f"Saved {len(questions)} PYQs for {subject}")

    for i, pq in enumerate(all_pyqs):
        text = pq["question"]
        embedding = create_embedding(text)

        collection.add(
            documents=[text],
            embeddings=[embedding or [0.0] * 768],
            ids=[f"pyq_{i}_{pq['chapter'][:20]}"],
            metadatas=[{
                "subject": pq.get("question", "").split(" - ")[0] if "-" in pq.get("question", "") else "Physics",
                "chapter": pq["chapter"],
                "year": pq["year"],
                "marks": pq["marks"],
                "question_type": pq["question_type"],
                "frequency": pq["frequency"]
            }]
        )

    print(f"Ingested {len(all_pyqs)} PYQs into ChromaDB")


if __name__ == "__main__":
    ingest_pyqs()
