from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from services.parser import extract_text
from services.agent import score_resume
from services.ranker import rank_candidates
from models import AnalyzeResponse

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    jd: UploadFile = File(...),
    resumes: List[UploadFile] = File(...)
):
    try:
        jd_text = await extract_text(jd)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is empty")

    scored = []
    for resume in resumes:
        try:
            resume_text = await extract_text(resume)
            result = await score_resume(jd_text, resume_text)
            scored.append(result)
        except Exception as e:
            scored.append({
                "name": resume.filename,
                "score": 0,
                "reasoning": f"Failed to process: {str(e)}",
                "strengths": [],
                "gaps": ["Could not be parsed"]
            })

    ranked = rank_candidates(scored)
    return AnalyzeResponse(results=ranked, total_candidates=len(ranked))