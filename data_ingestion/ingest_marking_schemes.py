import os
import json
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.nim_client import create_embedding
import chromadb

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data")
MARKING_DIR = os.path.join(DATA_DIR, "marking_schemes")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")


def ingest_marking_schemes():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection_names = [c.name for c in client.list_collections()]

    if "osm_marking" not in collection_names:
        collection = client.create_collection(
            name="osm_marking",
            metadata={"hnsw:space": "cosine"}
        )
    else:
        collection = client.get_collection(name="osm_marking")

    existing = collection.count()
    if existing > 0:
        print(f"OSM marking collection already has {existing} entries. Skipping ingestion.")
        return

    marking_files = [f for f in os.listdir(MARKING_DIR) if f.endswith(".json")]
    if not marking_files:
        print(f"No marking scheme files found in {MARKING_DIR}")
        print("Creating sample marking schemes from inline data...")
        create_sample_schemes()

    all_schemes = []
    for mf in marking_files:
        path = os.path.join(MARKING_DIR, mf)
        with open(path, "r") as f:
            schemes = json.load(f)
            all_schemes.extend(schemes)

    if not all_schemes:
        print("No marking schemes to ingest.")
        return

    for i, scheme in enumerate(all_schemes):
        text = json.dumps(scheme, indent=2)
        embedding = create_embedding(text)

        collection.add(
            documents=[text],
            embeddings=[embedding or [0.0] * 768],
            ids=[f"osm_{i}_{scheme.get('chapter', 'unknown')}"],
            metadatas=[{
                "subject": scheme.get("subject", ""),
                "chapter": scheme.get("chapter", ""),
                "marks": scheme.get("marks", 0),
                "question_type": scheme.get("question_type", "")
            }]
        )

    print(f"Ingested {len(all_schemes)} OSM marking schemes into ChromaDB")


def create_sample_schemes():
    sample = [
        {
            "subject": "Physics",
            "chapter": "Electric Charges and Fields",
            "marks": 5,
            "steps": [
                {"step": 1, "desc": "State Coulomb's law", "marks": 1},
                {"step": 2, "desc": "Formula F=kq1q2/r^2", "marks": 1},
                {"step": 3, "desc": "Vector form", "marks": 1},
                {"step": 4, "desc": "Nature of force", "marks": 1},
                {"step": 5, "desc": "SI units", "marks": 1}
            ]
        }
    ]
    path = os.path.join(MARKING_DIR, "sample_physics.json")
    with open(path, "w") as f:
        json.dump(sample, f, indent=2)
    print(f"Created sample: {path}")


if __name__ == "__main__":
    ingest_marking_schemes()
