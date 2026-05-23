from pydantic import BaseModel
from typing import List

class CandidateResult(BaseModel):
    name: str
    score: int
    grade: str
    recommendation: str
    confidence: str
    reasoning: str
    strengths: List[str]
    gaps: List[str]

class AnalyzeResponse(BaseModel):
    results: List[CandidateResult]
    total_candidates: int

class JDSummary(BaseModel):
    job_title: str
    required_skills: List[str]
    nice_to_have: List[str]
    experience_years: str
    key_responsibilities: List[str]

class AnalyzeResponse(BaseModel):
    jd_summary: JDSummary
    results: List[CandidateResult]
    total_candidates: int