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
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | Python FastAPI |
| AI Agent | Chutes.ai LLM (Ollama for local development) |
| File Parsing | PyMuPDF (PDF), python-docx (DOCX) |

---

## Features

- Upload a job description (PDF or DOCX)
- Upload multiple candidate resumes (PDF or DOCX)
- AI agent scores each candidate from 0 to 100
- Concurrent resume processing for fast results
- Candidates ranked by score with grade and hire recommendation
- Detailed reasoning, strengths, and gaps per candidate
- Clean dashboard UI built for real recruiter workflows

---

## System Requirements

- Python 3.10+
- Node.js 18+
- Ollama (for local development)

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/krishsharma5169/smart-recruiter.git
cd smart-recruiter
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

Windows:
```bash
.venv\Scripts\activate
```

Mac/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```
OLLAMA_URL=http://localhost:11434/api/chat
MODEL_NAME=llama3.2
CHUTES_URL=https://llm.chutes.ai/v1/chat/completions
CHUTES_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
USE_CHUTES=false
```

### 3. Install and start Ollama

Download Ollama from https://ollama.com/download and install it.

Then pull the model:

```bash
ollama pull llama3.2
```

Ollama starts automatically on Windows after installation. On Mac/Linux run:

```bash
ollama serve
```

### 4. Run the backend

```bash
cd backend
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

Verify it is running:
```bash
curl http://localhost:8000/health
```

Expected response: `{"status": "ok"}`

### 5. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend/` folder:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6. Run the frontend

```bash
npm run dev
```

Frontend runs on http://localhost:3000

---

## Switching to Chutes.ai

When Chutes.ai API access is provided, update `backend/.env`:

```
USE_CHUTES=true
CHUTES_API_KEY=your_actual_chutes_api_key
```

No other code changes are needed. The backend handles the swap automatically.

---

## How It Works

1. User uploads a job description and one or more resumes through the dashboard
2. Backend parses each file and extracts clean text
3. AI agent compares each resume against the job description and returns a score, reasoning, strengths, and gaps
4. All resumes are processed concurrently for speed
5. Results are ranked by score and enriched with a grade and hire recommendation
6. Dashboard displays the ranked list with full candidate detail on click

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

### POST /analyze

Accepts a job description and one or more resumes, returns ranked candidates.

Request: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| jd | File | Job description (PDF or DOCX, max 5MB) |
| resumes | File[] | Candidate resumes (PDF or DOCX, max 5MB each) |

Response:

```json
{
  "total_candidates": 2,
  "results": [
    {
      "name": "John Doe",
      "score": 80,
      "grade": "B",
      "recommendation": "Hire",
      "reasoning": "Strong Python background with relevant FastAPI and PostgreSQL experience. Minor gap in REST API design documentation.",
      "strengths": ["FastAPI", "PostgreSQL", "Docker"],
      "gaps": ["REST API Design"]
    },
    {
      "name": "Jane Smith",
      "score": 40,
      "grade": "D",
      "recommendation": "Borderline",
      "reasoning": "Candidate has a JavaScript background with minimal Python experience. Does not meet the core requirement of 3+ years Python.",
      "strengths": ["JavaScript", "React"],
      "gaps": ["Python experience", "FastAPI or Django", "REST API design"]
    }
  ]
}
```

### GET /health

Returns `{ "status": "ok" }` when the backend is running.

---

## Project Structure

```
smart-recruiter/
├── README.md
├── CLAUDE.md
├── .gitignore
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
    ├── types/
    └── .env.local
```

---

## Team

- Backend: Krish Sharma TP084234
- Frontend: Manoj Vishnu TP086203
