# Smart Recruiter

An AI-powered recruitment dashboard that analyzes resumes against a job description and returns a ranked list of candidates with scores, grades, and hire recommendations.

Built for AIC Hackathon 2026.

---

## Problem Statement

Traditional recruitment is slow and inconsistent. Hiring managers spend hours manually screening resumes, often missing strong candidates or advancing weak ones due to fatigue and bias. Smart Recruiter solves this by deploying an AI agent that reads both the job description and each resume, scores every candidate objectively, and presents a clear ranked dashboard - turning hours of screening into seconds.

---

## Solution Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS v3 |
| Backend | Python FastAPI |
| AI Agent | Chutes.ai - DeepSeek V3 (Ollama for local development) |
| File Parsing | PyMuPDF (PDF), python-docx (DOCX) |

---

## Features

- Upload a job description (PDF or DOCX)
- Upload multiple candidate resumes (PDF or DOCX, up to 10)
- AI agent extracts and displays job requirements from the JD
- Each resume scored 0-100 with confidence level
- Results stream in real time as each candidate is scored
- Candidates ranked by score with grade and hire recommendation
- Detailed reasoning, strengths, and gaps per candidate
- AI-powered head-to-head candidate comparison with definitive hire verdict
- CSV export of full ranked results
- One-click launcher via start.vbs - no terminal required

---

## System Requirements

- Python 3.10+
- Node.js 18+
- Ollama (only if not using Chutes.ai)

---

## Choosing Your AI Backend

Smart Recruiter supports two AI backends. Choose one before setup.

### Option A - Chutes.ai (recommended, cloud-based)

- Requires a Chutes.ai API key
- Faster and more accurate - uses DeepSeek V3
- No local model download needed
- Requires internet connection

Set in `backend/.env`:
```
USE_CHUTES=true
CHUTES_API_KEY=your_actual_chutes_api_key
CHUTES_URL=https://llm.chutes.ai/v1/chat/completions
```

### Option B - Ollama (local, offline)

- Free, runs entirely on your machine
- Slower - expect 30-60 seconds per resume depending on hardware
- Requires Ollama installed and running before starting the app

Download Ollama from https://ollama.com/download, install it, then pull the model:

```bash
ollama pull llama3.2
```

Ollama starts automatically on Windows after installation. On Mac/Linux run:

```bash
ollama serve
```

Set in `backend/.env`:
```
USE_CHUTES=false
OLLAMA_URL=http://localhost:11434/api/chat
MODEL_NAME=llama3.2
```

---

## Quick Start (Windows)

The easiest way to run Smart Recruiter is using the included launcher.

### First time setup only

**1. Clone the repo**

```bash
git clone https://github.com/krishsharma5169/smart-recruiter.git
cd smart-recruiter
```

> Important: Clone into a folder path with no special characters. Paths containing symbols like `C++`, `C#`, or spaces in folder names may cause the virtual environment activation to fail on Windows. A safe path is `C:\Users\YourName\Documents\smart-recruiter`.

**2. Create the Python virtual environment**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

**3. Create backend environment file**

Create a `.env` file inside the `backend/` folder:

```
OLLAMA_URL=http://localhost:11434/api/chat
MODEL_NAME=llama3.2
CHUTES_URL=https://llm.chutes.ai/v1/chat/completions
CHUTES_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
USE_CHUTES=false
```

Set `USE_CHUTES=true` and add your `CHUTES_API_KEY` if using Chutes.ai. Set `USE_CHUTES=false` if using Ollama.

**4. Create frontend environment file**

Create a `.env.local` file inside the `frontend/` folder:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**5. Install frontend dependencies**

```bash
cd frontend
npm install
cd ..
```

**6. Start Ollama (if using Ollama)**

Make sure Ollama is running before starting the app. On Windows it starts automatically after installation. If it is not running:

```bash
ollama serve
```

### Every time after setup

Double-click `start.vbs` in the repo root.

Both servers start silently in the background and your browser opens automatically at http://localhost:3000. When you are done, click OK on the popup to stop both servers.

---

## Manual Setup (All Platforms)

### Backend

```bash
cd backend
python -m venv .venv
```

Activate on Windows:
```bash
.venv\Scripts\activate
```

Activate on Mac/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run:
```bash
python -m uvicorn main:app --reload
```

Backend runs on http://localhost:8000

Verify:
```bash
curl http://localhost:8000/health
```

Expected: `{"status": "ok"}`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

> Note: This project uses Tailwind CSS v3. The `package.json` already pins Tailwind to v3. If you see a blank page after `npm run dev`, run the following to fix it:

```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install tailwindcss@3 autoprefixer postcss
```

Then clear the cache and restart:

Windows:
```bash
Remove-Item -Recurse -Force .next
npm run dev
```

Mac/Linux:
```bash
rm -rf .next
npm run dev
```

---

## Generating Demo Files

A demo dataset is included to test the full flow. Run from the repo root:

```bash
pip install reportlab python-docx
python create_demo_files.py
```

This creates a `demo_files/` folder with a job description PDF and 6 candidate resumes covering a full range of scores from Strong Hire to Do Not Hire.

---

## How It Works

1. User uploads a job description and one or more resumes through the dashboard
2. Backend parses each file and extracts clean text
3. AI agent extracts key requirements from the JD and displays them as a criteria panel
4. AI agent scores each resume concurrently against the JD, returning score, confidence, reasoning, strengths, and gaps
5. Results stream to the dashboard in real time as each candidate finishes scoring
6. Results are sorted by score and enriched with grade and hire recommendation
7. HR manager can click any candidate for full detail, compare two candidates head-to-head with an AI verdict, or export the full ranked list as CSV

---

## Scoring Scale

| Score | Grade | Recommendation |
|-------|-------|----------------|
| 85-100 | A | Strong Hire |
| 70-84 | B | Hire |
| 55-69 | C | Consider |
| 40-54 | D | Borderline |
| 0-39 | F | Do Not Hire |

---

## API Reference

### POST /analyze/stream (primary)

Streams candidate results via Server-Sent Events as each resume finishes scoring.

Request: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| jd | File | Job description (PDF or DOCX, max 5MB) |
| resumes | File[] | Candidate resumes (PDF or DOCX, max 5MB each, max 10) |

Stream events:

```json
{ "type": "jd_summary", "data": { "job_title": "...", "required_skills": [], "nice_to_have": [], "experience_years": "...", "key_responsibilities": [] } }
{ "type": "candidate", "data": { "name": "...", "score": 85, "grade": "A", "recommendation": "Strong Hire", "confidence": "High", "reasoning": "...", "strengths": [], "gaps": [] } }
```

### POST /analyze

Same as above but returns all results at once after all resumes are processed.

Response:

```json
{
  "jd_summary": {
    "job_title": "AI Engineer",
    "required_skills": ["Python", "LLM integration"],
    "nice_to_have": ["MLflow"],
    "experience_years": "3+ years",
    "key_responsibilities": ["Build agentic pipelines"]
  },
  "total_candidates": 2,
  "results": [
    {
      "name": "Krish Sharma",
      "score": 90,
      "grade": "A",
      "recommendation": "Strong Hire",
      "confidence": "High",
      "reasoning": "Meets all requirements with strong project portfolio.",
      "strengths": ["LangGraph", "RAG pipelines", "FastAPI"],
      "gaps": ["MLflow experience"]
    }
  ]
}
```

### POST /compare

Accepts two candidate results and a job title, returns an AI-generated hiring verdict.

Request: `application/json`

```json
{
  "candidate_a": { "...candidate result object..." },
  "candidate_b": { "...candidate result object..." },
  "job_title": "AI Engineer"
}
```

Response:

```json
{
  "winner": "Krish Sharma",
  "verdict": "Krish has stronger hands-on experience with required technologies...",
  "winner_key_advantages": ["LangGraph pipeline development", "RAG pipelines"],
  "loser_key_gaps": ["LangGraph experience", "Research background"],
  "confidence": "High"
}
```

### GET /health

Returns `{ "status": "ok" }` when the backend is running.

---

## Limitations

- LLM scoring is non-deterministic - the same resume may receive a slightly different score on different runs due to the nature of language models
- Scanned PDFs are not supported - only text-based PDFs with extractable content work correctly
- Maximum 10 resumes per request
- Maximum 5MB per file
- Chutes.ai requires an internet connection and a valid API key
- Ollama local inference is slower - expect 30-60 seconds per resume depending on hardware
- Ollama must be running before starting the app - if all scores return as 0, check that Ollama is running
- Candidate name extraction depends on resume formatting - if the name cannot be found, the filename is used as a fallback
- No persistent storage - results are not saved and will be lost on page refresh
- English language resumes produce the most consistent results - other languages may cause lower scoring accuracy
- The comparison verdict is AI-generated and should be used as a decision support tool, not a definitive hiring decision
- Cloning into a folder path with special characters such as `C++` or `C#` may cause virtual environment activation to fail on Windows

---

## Project Structure

```
smart-recruiter/
├── README.md
├── CLAUDE.md
├── .gitignore
├── create_demo_files.py
├── start.vbs
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   ├── .env
│   ├── routes/
│   │   ├── __init__.py
│   │   └── analyze.py
│   └── services/
│       ├── __init__.py
│       ├── parser.py
│       ├── agent.py
│       └── ranker.py
└── frontend/
    ├── app/
    ├── components/
    ├── lib/
    ├── types/
    ├── .env.local
    └── .gitignore
```

---

## Team

- Backend: Krish Sharma TP084234
- Frontend: Manoj Vishnu TP086203