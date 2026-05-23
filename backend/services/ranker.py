from typing import List
from models import CandidateResult

def _get_grade(score: int) -> str:
    if score >= 85: return "A"
    if score >= 70: return "B"
    if score >= 55: return "C"
    if score >= 40: return "D"
    return "F"

def _get_recommendation(score: int) -> str:
    if score >= 85: return "Strong Hire"
    if score >= 70: return "Hire"
    if score >= 55: return "Consider"
    if score >= 40: return "Borderline"
    return "Do Not Hire"

def rank_candidates(results: List[dict]) -> List[CandidateResult]:
    sorted_results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
    enriched = []
    for r in sorted_results:
        score = max(0, min(100, int(r.get("score", 0))))
        enriched.append(CandidateResult(
            name=r.get("name", "Unknown"),
            score=score,
            grade=_get_grade(score),
            recommendation=_get_recommendation(score),
            confidence=r.get("confidence", "Low"),
            reasoning=r.get("reasoning", ""),
            strengths=r.get("strengths", []),
            gaps=r.get("gaps", [])
        ))
    return enriched