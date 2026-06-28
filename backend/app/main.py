import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .api import ask, assignments, question_bank, subjects, analytics
from .models.database import init_db

app = FastAPI(
    title="OSM-BRO Forge V2 API",
    description="CBSE Class 12 Study AI — Syllabus-locked, OSM-formatted answers",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask.router, prefix="/api", tags=["Q&A"])
app.include_router(assignments.router, prefix="/api", tags=["Assignments"])
app.include_router(question_bank.router, prefix="/api", tags=["Question Bank"])
app.include_router(subjects.router, prefix="/api", tags=["Subjects"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "name": "OSM-BRO Forge V2"}


@app.get("/")
async def root():
    return {
        "message": "OSM-BRO Forge V2 — CBSE Class 12 Study AI",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
