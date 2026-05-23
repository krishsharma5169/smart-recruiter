export interface CandidateResult {
  name: string
  score: number
  grade: string
  recommendation: string
  confidence: string
  reasoning: string
  strengths: string[]
  gaps: string[]
}

export interface JdSummary {
  job_title: string
  required_skills: string[]
  nice_to_have: string[]
  experience_years: string
  key_responsibilities: string[]
}

export interface AnalyzeResponse {
  total_candidates: number
  results: CandidateResult[]
}

export type AppState = "upload" | "streaming" | "results"
