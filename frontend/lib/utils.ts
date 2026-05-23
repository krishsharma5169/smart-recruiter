import { CandidateResult } from "@/types"

export function getRecommendationStyle(rec: string): string {
  switch (rec) {
    case "Strong Hire":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
    case "Hire":
      return "bg-green-500/20 text-green-300 border border-green-500/30"
    case "Consider":
      return "bg-yellow-500/30 text-yellow-200 border border-yellow-400/60"
    case "Borderline":
      return "bg-orange-500/30 text-orange-200 border border-orange-400/60"
    case "Do Not Hire":
      return "bg-red-500/20 text-red-400 border border-red-500/30"
    default:
      return "bg-slate-500/20 text-slate-300 border border-slate-500/30"
  }
}

export function getConfidenceStyle(conf: string): string {
  switch (conf) {
    case "High":
      return "bg-sky-500/30 text-sky-200 border border-sky-400/60"
    case "Medium":
      return "bg-yellow-500/30 text-yellow-200 border border-yellow-400/60"
    case "Low":
      return "bg-slate-500/30 text-slate-300 border border-slate-400/60"
    default:
      return "bg-slate-500/30 text-slate-300 border border-slate-400/60"
  }
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400"
  if (score >= 70) return "text-green-400"
  if (score >= 55) return "text-yellow-400"
  if (score >= 40) return "text-orange-400"
  return "text-red-400"
}

export function getScoreBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500"
  if (score >= 70) return "bg-green-500"
  if (score >= 55) return "bg-yellow-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-red-500"
}

export function getGradeBadgeStyle(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
    case "B":
      return "bg-green-500/20 text-green-300 border border-green-500/40"
    case "C":
      return "bg-yellow-500/30 text-yellow-200 border border-yellow-400/60"
    case "D":
      return "bg-orange-500/30 text-orange-200 border border-orange-400/60"
    case "F":
      return "bg-red-500/20 text-red-400 border border-red-500/40"
    default:
      return "bg-slate-500/20 text-slate-300 border border-slate-500/40"
  }
}

export function sortCandidates(candidates: CandidateResult[]): CandidateResult[] {
  return [...candidates].sort((a, b) => b.score - a.score)
}

export function validateFile(file: File): string | null {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
  const allowedExtensions = [".pdf", ".docx"]
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    return `"${file.name}" is not a PDF or DOCX file.`
  }
  if (file.size > 5 * 1024 * 1024) {
    return `"${file.name}" exceeds the 5MB limit.`
  }
  return null
}