import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

USE_CHUTES = os.getenv("USE_CHUTES", "false").lower() == "true"

if USE_CHUTES:
    API_URL = os.getenv("CHUTES_URL")
    API_KEY = os.getenv("CHUTES_API_KEY")
    HEADERS = {"Authorization": f"Bearer {API_KEY}"}
    MODEL_NAME = "deepseek-ai/DeepSeek-V3-0324"
else:
    API_URL = os.getenv("OLLAMA_URL")
    HEADERS = {}
    MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2")

SYSTEM_PROMPT = """You are a senior technical recruiter with 10 years of experience.
Evaluate how well a candidate's resume matches a job description.

Scoring rules:
- 85-100: Meets all requirements with additional relevant experience
- 70-84: Meets most requirements with minor gaps
- 55-69: Meets some requirements with notable gaps
- 40-54: Meets few requirements, significant gaps exist
- 0-39: Does not meet core requirements

Confidence rules:
- High: Resume has clear, detailed information to make a strong judgment
- Medium: Resume has enough information but some areas are vague
- Low: Resume lacks detail, making it hard to evaluate accurately

Be consistent and objective. Base score strictly on the job description requirements.

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
{
  "name": "candidate full name, or Unknown if not found",
  "score": <integer 0-100>,
  "confidence": "High" or "Medium" or "Low",
  "reasoning": "2-3 sentences explaining score based on specific matches and gaps",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2"]
}"""

async def score_resume(jd_text: str, resume_text: str, filename: str = "Unknown") -> dict:
    prompt = f"""Job Description:
{jd_text}

Resume:
{resume_text}

Evaluate this candidate and return only the JSON result."""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(API_URL, json=payload, headers=HEADERS)
            response.raise_for_status()

        if USE_CHUTES:
            raw = response.json()["choices"][0]["message"]["content"]
        else:
            raw = response.json()["message"]["content"]

        return _parse_response(raw, filename)

    except httpx.TimeoutException:
        return _fallback(filename, "Request timed out.")
    except httpx.HTTPStatusError as e:
        return _fallback(filename, f"HTTP error: {e.response.status_code}")
    except Exception as e:
        return _fallback(filename, str(e))


def _parse_response(raw: str, filename: str) -> dict:
    cleaned = raw.strip()

    if "```" in cleaned:
        parts = cleaned.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                cleaned = part
                break

    try:
        result = json.loads(cleaned)
        return _validate_result(result, filename)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            try:
                result = json.loads(cleaned[start:end])
                return _validate_result(result, filename)
            except json.JSONDecodeError:
                pass

    return _fallback(filename, "Could not parse LLM response as JSON.")


def _validate_result(result: dict, filename: str) -> dict:
    return {
        "name": result.get("name") or _name_from_filename(filename),
        "score": max(0, min(100, int(result.get("score", 0)))),
        "confidence": result.get("confidence", "Low"),
        "reasoning": result.get("reasoning", "No reasoning provided."),
        "strengths": result.get("strengths", []),
        "gaps": result.get("gaps", [])
    }


def _fallback(filename: str, reason: str) -> dict:
    return {
        "name": _name_from_filename(filename),
        "score": 0,
        "confidence": "Low",
        "reasoning": f"Could not evaluate candidate. Reason: {reason}",
        "strengths": [],
        "gaps": ["Processing failed"]
    }


def _name_from_filename(filename: str) -> str:
    name = filename.replace(".pdf", "").replace(".docx", "").replace("_", " ").replace("-", " ")
    return name.title() if name else "Unknown"


async def extract_jd_requirements(jd_text: str) -> dict:
    prompt = f"""You are an expert recruiter. Extract the key requirements from this job description.

Job Description:
{jd_text}

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
{{
  "job_title": "extracted job title",
  "required_skills": ["skill 1", "skill 2", "skill 3"],
  "nice_to_have": ["skill 1", "skill 2"],
  "experience_years": "e.g. 3+ years or Not specified",
  "key_responsibilities": ["responsibility 1", "responsibility 2"]
}}"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "You are an expert recruiter that extracts structured data from job descriptions. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    fallback = {
        "job_title": "Unknown",
        "required_skills": [],
        "nice_to_have": [],
        "experience_years": "Not specified",
        "key_responsibilities": []
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(API_URL, json=payload, headers=HEADERS)
            response.raise_for_status()

        if USE_CHUTES:
            raw = response.json()["choices"][0]["message"]["content"]
        else:
            raw = response.json()["message"]["content"]

        cleaned = raw.strip()
        if "```" in cleaned:
            parts = cleaned.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    cleaned = part
                    break

        result = json.loads(cleaned)

        return {
            "job_title": result.get("job_title", "Unknown"),
            "required_skills": result.get("required_skills", []),
            "nice_to_have": result.get("nice_to_have", []),
            "experience_years": result.get("experience_years", "Not specified"),
            "key_responsibilities": result.get("key_responsibilities", [])
        }

    except Exception:
        return fallback


async def compare_two_candidates(candidate_a: dict, candidate_b: dict, job_title: str) -> dict:
    prompt = f"""You are a senior technical recruiter making a final hiring decision.

Job Title: {job_title}

Candidate A: {candidate_a['name']}
Score: {candidate_a['score']}
Strengths: {', '.join(candidate_a.get('strengths', []))}
Gaps: {', '.join(candidate_a.get('gaps', []))}
Reasoning: {candidate_a.get('reasoning', '')}

Candidate B: {candidate_b['name']}
Score: {candidate_b['score']}
Strengths: {', '.join(candidate_b.get('strengths', []))}
Gaps: {', '.join(candidate_b.get('gaps', []))}
Reasoning: {candidate_b.get('reasoning', '')}

Compare both candidates and give a definitive hiring recommendation. Be direct and decisive.

Return ONLY a valid JSON object with no extra text, no markdown, no backticks:
{{
  "winner": "exact full name of the recommended candidate",
  "verdict": "2-3 sentence explanation of why this candidate is the better hire",
  "winner_key_advantages": ["advantage 1", "advantage 2", "advantage 3"],
  "loser_key_gaps": ["gap 1", "gap 2"],
  "confidence": "High" or "Medium" or "Low"
}}"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "You are a senior technical recruiter making definitive hiring decisions. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    fallback = {
        "winner": candidate_a['name'] if candidate_a['score'] >= candidate_b['score'] else candidate_b['name'],
        "verdict": "Could not generate comparison. Winner determined by score.",
        "winner_key_advantages": [],
        "loser_key_gaps": [],
        "confidence": "Low"
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(API_URL, json=payload, headers=HEADERS)
            response.raise_for_status()

        if USE_CHUTES:
            raw = response.json()["choices"][0]["message"]["content"]
        else:
            raw = response.json()["message"]["content"]

        cleaned = raw.strip()
        if "```" in cleaned:
            parts = cleaned.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    cleaned = part
                    break

        result = json.loads(cleaned)
        return {
            "winner": result.get("winner", fallback["winner"]),
            "verdict": result.get("verdict", fallback["verdict"]),
            "winner_key_advantages": result.get("winner_key_advantages", []),
            "loser_key_gaps": result.get("loser_key_gaps", []),
            "confidence": result.get("confidence", "Low")
        }

    except Exception:
        return fallback