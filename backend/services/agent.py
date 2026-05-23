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

SYSTEM_PROMPT = """You are an expert technical recruiter.
Analyze the resume against the job description and return ONLY a valid JSON object with no extra text, no markdown, no backticks.
The JSON must follow this exact structure:
{
  "name": "candidate full name or Unknown if not found",
  "score": <integer 0-100>,
  "reasoning": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"]
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
        "reasoning": result.get("reasoning", "No reasoning provided."),
        "strengths": result.get("strengths", []),
        "gaps": result.get("gaps", [])
    }

def _fallback(filename: str, reason: str) -> dict:
    return {
        "name": _name_from_filename(filename),
        "score": 0,
        "reasoning": f"Could not evaluate candidate. Reason: {reason}",
        "strengths": [],
        "gaps": ["Processing failed"]
    }

def _name_from_filename(filename: str) -> str:
    name = filename.replace(".pdf", "").replace(".docx", "").replace("_", " ").replace("-", " ")
    return name.title() if name else "Unknown"