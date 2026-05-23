from pydantic import BaseModel
from typing import List

class CandidateResult(BaseModel):
    name: str
    score: int
    grade: str
    recommendation: str
    reasoning: str
    strengths: List[str]
    gaps: List[str]

class AnalyzeResponse(BaseModel):
    results: List[CandidateResult]
    total_candidates: int