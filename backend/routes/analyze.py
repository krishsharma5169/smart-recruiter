from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
import asyncio
import json
from services.parser import extract_text
from services.agent import score_resume, extract_jd_requirements
from services.ranker import rank_candidates, _get_grade, _get_recommendation
from models import AnalyzeResponse, JDSummary

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_RESUMES = 10
MIN_JD_LENGTH = 100
MIN_RESUME_LENGTH = 50
MAX_JD_LENGTH = 10000

@router.get("/health")
async def health():
    return {"status": "ok"}

async def process_resume(resume: UploadFile, jd_text: str) -> dict:
    if resume.size and resume.size > MAX_FILE_SIZE:
        return {
            "name": resume.filename,
            "score": 0,
            "confidence": "Low",
            "reasoning": f"{resume.filename} exceeds the 5MB file size limit.",
            "strengths": [],
            "gaps": ["File too large"]
        }
    try:
        resume_text = await extract_text(resume)

        if not resume_text.strip():
            raise ValueError("Resume appears to be empty.")

        if len(resume_text.strip()) < MIN_RESUME_LENGTH:
            return {
                "name": resume.filename,
                "score": 0,
                "confidence": "Low",
                "reasoning": "Resume content is too short to evaluate accurately.",
                "strengths": [],
                "gaps": ["Insufficient resume content"]
            }

        return await score_resume(jd_text, resume_text, resume.filename)

    except ValueError as e:
        return {
            "name": resume.filename,
            "score": 0,
            "confidence": "Low",
            "reasoning": str(e),
            "strengths": [],
            "gaps": ["Could not be parsed"]
        }

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    jd: UploadFile = File(...),
    resumes: List[UploadFile] = File(...)
):
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one resume is required.")

    if len(resumes) > MAX_RESUMES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_RESUMES} resumes allowed per request.")

    if jd.size and jd.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Job description exceeds 5MB limit.")

    filenames = [r.filename for r in resumes]
    if len(filenames) != len(set(filenames)):
        raise HTTPException(status_code=400, detail="Duplicate resume filenames detected. Please upload unique files.")

    try:
        jd_text = await extract_text(jd)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is empty.")

    if len(jd_text.strip()) < MIN_JD_LENGTH:
        raise HTTPException(status_code=400, detail="Job description is too short. Please provide a detailed JD.")

    if len(jd_text) > MAX_JD_LENGTH:
        jd_text = jd_text[:MAX_JD_LENGTH]

    jd_summary, scored = await asyncio.gather(
        extract_jd_requirements(jd_text),
        asyncio.gather(*[process_resume(resume, jd_text) for resume in resumes])
    )

    ranked = rank_candidates(list(scored))

    return AnalyzeResponse(
        jd_summary=JDSummary(**jd_summary),
        results=ranked,
        total_candidates=len(ranked)
    )

@router.post("/analyze/stream")
async def analyze_stream(
    jd: UploadFile = File(...),
    resumes: List[UploadFile] = File(...)
):
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one resume is required.")

    if len(resumes) > MAX_RESUMES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_RESUMES} resumes allowed per request.")

    if jd.size and jd.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Job description exceeds 5MB limit.")

    filenames = [r.filename for r in resumes]
    if len(filenames) != len(set(filenames)):
        raise HTTPException(status_code=400, detail="Duplicate resume filenames detected. Please upload unique files.")

    try:
        jd_text = await extract_text(jd)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is empty.")

    if len(jd_text.strip()) < MIN_JD_LENGTH:
        raise HTTPException(status_code=400, detail="Job description is too short. Please provide a detailed JD.")

    if len(jd_text) > MAX_JD_LENGTH:
        jd_text = jd_text[:MAX_JD_LENGTH]

    async def generate():
        jd_summary = await extract_jd_requirements(jd_text)
        yield f"data: {json.dumps({'type': 'jd_summary', 'data': jd_summary})}\n\n"

        tasks = {
            asyncio.ensure_future(process_resume(resume, jd_text)): resume.filename
            for resume in resumes
        }
        pending = set(tasks.keys())

        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                result = task.result()
                score = max(0, min(100, int(result.get("score", 0))))
                enriched = {
                    "type": "candidate",
                    "data": {
                        **result,
                        "score": score,
                        "grade": _get_grade(score),
                        "recommendation": _get_recommendation(score)
                    }
                }
                yield f"data: {json.dumps(enriched)}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")