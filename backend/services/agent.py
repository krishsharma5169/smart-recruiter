import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL_NAME = os.getenv("MODEL_NAME")

SYSTEM_PROMPT = """You are an expert technical recruiter. 
Analyze the resume against the job description and return ONLY a JSON object with no extra text.
The JSON must follow this exact structure:
{
  "name": "candidate full name or Unknown if not found",
  "score": <integer 0-100>,
  "reasoning": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"]
}"""

async def score_resume(jd_text: str, resume_text: str) -> dict:
    prompt = f"""Job Description:
{jd_text}

Resume:
{resume_text}

Evaluate this candidate and return the JSON result."""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()

    raw = response.json()["message"]["content"]

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    return json.loads(cleaned)