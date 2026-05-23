from typing import List
from models import CandidateResult

def rank_candidates(results: List[dict]) -> List[CandidateResult]:
    sorted_results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
    return [CandidateResult(**r) for r in sorted_results]