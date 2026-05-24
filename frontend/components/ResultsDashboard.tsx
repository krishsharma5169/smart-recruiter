"use client"

import { useState } from "react"
import { CandidateResult, JdSummary } from "@/types"
import { getScoreBarColor } from "@/lib/utils"
import CandidatePanel from "./CandidatePanel"

interface ResultsDashboardProps {
  candidates: CandidateResult[]
  jdSummary: JdSummary | null
  onReset: () => void
}

const gradeStyles: Record<string, React.CSSProperties> = {
  "A": { background: "rgba(16,185,129,0.2)",  color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.4)" },
  "B": { background: "rgba(34,197,94,0.2)",   color: "#86efac", border: "1px solid rgba(34,197,94,0.4)" },
  "C": { background: "rgba(234,179,8,0.25)",  color: "#fde047", border: "1px solid rgba(234,179,8,0.5)" },
  "D": { background: "rgba(249,115,22,0.25)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.5)" },
  "F": { background: "rgba(239,68,68,0.2)",   color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)" },
}

const recommendationStyles: Record<string, React.CSSProperties> = {
  "Strong Hire": { background: "rgba(16,185,129,0.2)",  color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" },
  "Hire":        { background: "rgba(34,197,94,0.2)",   color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" },
  "Consider":    { background: "rgba(234,179,8,0.25)",  color: "#fde047", border: "1px solid rgba(234,179,8,0.5)" },
  "Borderline":  { background: "rgba(249,115,22,0.25)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.5)" },
  "Do Not Hire": { background: "rgba(239,68,68,0.2)",   color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)" },
}

const confidenceStyles: Record<string, React.CSSProperties> = {
  "High":   { background: "rgba(14,165,233,0.25)",  color: "#7dd3fc", border: "1px solid rgba(14,165,233,0.5)" },
  "Medium": { background: "rgba(234,179,8,0.25)",   color: "#fde047", border: "1px solid rgba(234,179,8,0.5)" },
  "Low":    { background: "rgba(100,116,139,0.25)", color: "#cbd5e1", border: "1px solid rgba(100,116,139,0.5)" },
}

function getScoreInlineColor(score: number): string {
  if (score >= 85) return "#34d399"
  if (score >= 70) return "#4ade80"
  if (score >= 55) return "#facc15"
  if (score >= 40) return "#fb923c"
  return "#f87171"
}

function exportToCSV(candidates: CandidateResult[], jdTitle: string) {
  const headers = ["Rank", "Name", "Score", "Grade", "Recommendation", "Confidence", "Reasoning", "Strengths", "Gaps"]
  const rows = candidates.map((c, i) => [
    i + 1,
    c.name,
    c.score,
    c.grade,
    c.recommendation,
    c.confidence,
    `"${c.reasoning.replace(/"/g, '""')}"`,
    `"${c.strengths.join(", ").replace(/"/g, '""')}"`,
    `"${c.gaps.join(", ").replace(/"/g, '""')}"`
  ])
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const filename = `smart-recruiter-${jdTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${new Date().toISOString().slice(0, 10)}.csv`
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface VerdictResult {
  winner: string
  verdict: string
  winner_key_advantages: string[]
  loser_key_gaps: string[]
  confidence: string
}

function CompareModal({ a, b, verdict, loading, onClose }: {
  a: CandidateResult
  b: CandidateResult
  verdict: VerdictResult | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1424] border border-slate-700 shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Candidate Comparison</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Verdict */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">AI is analyzing both candidates and generating a recommendation...</p>
            </div>
          ) : verdict ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <p className="text-xs text-sky-400 uppercase tracking-widest font-medium">AI Recommendation</p>
                <span style={confidenceStyles[verdict.confidence] ?? confidenceStyles["Low"]} className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto">
                  {verdict.confidence} Confidence
                </span>
              </div>
              <p className="text-base font-bold text-white mb-2">
                Hire <span style={{ color: "#34d399" }}>{verdict.winner}</span>
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{verdict.verdict}</p>
              {verdict.winner_key_advantages.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Key Advantages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {verdict.winner_key_advantages.map((adv, i) => (
                      <span key={i} style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }} className="text-xs px-2 py-0.5 rounded">
                        {adv}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Could not generate AI verdict.</p>
          )}
        </div>

        {/* Names and scores */}
        <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
          {[a, b].map((c, i) => (
            <div key={i} className="bg-[#0d1424] px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 mx-auto mb-3">
                {c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <p className="text-base font-bold text-white mb-1">{c.name}</p>
              <p style={{ color: getScoreInlineColor(c.score) }} className="text-3xl font-black mb-2">{c.score}</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span style={gradeStyles[c.grade] ?? gradeStyles["F"]} className="text-xs px-2 py-0.5 rounded font-bold">{c.grade}</span>
                <span style={recommendationStyles[c.recommendation] ?? recommendationStyles["Do Not Hire"]} className="text-xs px-2.5 py-1 rounded-full font-medium">{c.recommendation}</span>
                <span style={confidenceStyles[c.confidence] ?? confidenceStyles["Low"]} className="text-xs px-2.5 py-1 rounded-full font-medium">{c.confidence}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Score bars */}
        <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
          {[a, b].map((c, i) => (
            <div key={i} className="bg-[#0d1424] px-6 py-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getScoreBarColor(c.score)} transition-all duration-700`} style={{ width: `${c.score}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{c.score}/100</p>
            </div>
          ))}
        </div>

        {/* Reasoning */}
        <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
          {[a, b].map((c, i) => (
            <div key={i} className="bg-[#0d1424] px-6 py-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reasoning</p>
              <p className="text-xs text-slate-300 leading-relaxed">{c.reasoning}</p>
            </div>
          ))}
        </div>

        {/* Strengths */}
        <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
          {[a, b].map((c, i) => (
            <div key={i} className="bg-[#0d1424] px-6 py-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {c.strengths.length > 0 ? c.strengths.map((s, j) => (
                  <span key={j} style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }} className="text-xs px-2 py-0.5 rounded">{s}</span>
                )) : <span className="text-xs text-slate-600">None listed</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Gaps */}
        <div className="grid grid-cols-2 gap-px bg-slate-800">
          {[a, b].map((c, i) => (
            <div key={i} className="bg-[#0d1424] px-6 py-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {c.gaps.length > 0 ? c.gaps.map((g, j) => (
                  <span key={j} style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }} className="text-xs px-2 py-0.5 rounded">{g}</span>
                )) : <span className="text-xs text-slate-600">None listed</span>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default function ResultsDashboard({ candidates, jdSummary, onReset }: ResultsDashboardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [compareIndices, setCompareIndices] = useState<number[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [verdict, setVerdict] = useState<VerdictResult | null>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)

  const hireCount = candidates.filter(
    (c) => c.recommendation === "Strong Hire" || c.recommendation === "Hire"
  ).length

  const topCandidate = candidates[0]

  const handleRowClick = (index: number) => {
    if (compareIndices.length > 0) return
    setSelectedIndex(prev => prev === index ? null : index)
  }

  const handleCheckbox = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setCompareIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index)
      if (prev.length >= 2) return prev
      return [...prev, index]
    })
    setSelectedIndex(null)
  }

  const handleCompare = async () => {
    setShowCompare(true)
    setVerdict(null)
    setVerdictLoading(true)
    try {
      const a = candidates[compareIndices[0]]
      const b = candidates[compareIndices[1]]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_a: a,
          candidate_b: b,
          job_title: jdSummary?.job_title ?? "the role"
        })
      })
      const data = await res.json()
      setVerdict(data)
    } catch {
      setVerdict(null)
    } finally {
      setVerdictLoading(false)
    }
  }

  const handleExport = () => {
    exportToCSV(candidates, jdSummary?.job_title ?? "results")
  }

  const selectedCandidate = selectedIndex !== null ? candidates[selectedIndex] : null

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-6 py-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">
              Smart<span className="text-sky-400">Recruiter</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Analysis complete</p>
          </div>
          <div className="flex items-center gap-3">
            {compareIndices.length === 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Selected
              </button>
            )}
            {compareIndices.length > 0 && (
              <button
                onClick={() => setCompareIndices([])}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-all duration-150"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-emerald-500/50 bg-slate-900 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 text-sm transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              New Analysis
            </button>
          </div>
        </div>

        {compareIndices.length === 0 && (
          <p className="text-xs text-slate-600 mb-4">Tip: check any 2 candidates to compare them side by side.</p>
        )}
        {compareIndices.length === 1 && (
          <p className="text-xs text-sky-500/70 mb-4">1 candidate selected. Select one more to compare.</p>
        )}
        {compareIndices.length === 2 && (
          <p className="text-xs text-sky-400 mb-4">2 candidates selected. Click Compare Selected to see the breakdown.</p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Candidates</p>
            <p className="text-3xl font-black text-white">{candidates.length}</p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommended to Hire</p>
            <p className="text-3xl font-black text-emerald-400">{hireCount}</p>
            <p className="text-xs text-slate-600 mt-0.5">Strong Hire + Hire</p>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Candidate</p>
            {topCandidate ? (
              <>
                <p className="text-base font-bold text-white truncate">{topCandidate.name}</p>
                <p style={{ color: getScoreInlineColor(topCandidate.score) }} className="text-sm font-semibold">
                  Score: {topCandidate.score}
                </p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">—</p>
            )}
          </div>
        </div>

        {jdSummary && (
          <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 px-5 py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <p className="text-xs text-sky-400 uppercase tracking-widest font-medium">
                Scoring Criteria · {jdSummary.job_title}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {jdSummary.required_skills.length > 0 ? jdSummary.required_skills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/20">{s}</span>
                  )) : <span className="text-xs text-slate-600">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Nice to Have</p>
                <div className="flex flex-wrap gap-1.5">
                  {jdSummary.nice_to_have.length > 0 ? jdSummary.nice_to_have.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">{s}</span>
                  )) : <span className="text-xs text-slate-600">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Experience</p>
                <span className="text-sm text-slate-300">{jdSummary.experience_years}</span>
              </div>
              {jdSummary.key_responsibilities.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Key Responsibilities</p>
                  <ul className="space-y-1">
                    {jdSummary.key_responsibilities.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-slate-600 mt-0.5">·</span>{r}
                      </li>
                    ))}
                    {jdSummary.key_responsibilities.length > 3 && (
                      <li className="text-xs text-slate-600">+{jdSummary.key_responsibilities.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-[2.5rem_2rem_1fr_6rem_4rem_9rem_6rem] gap-0 px-5 py-3 border-b border-slate-800 bg-slate-900/80">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">#</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider"></span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Candidate</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Score</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Grade</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recommendation</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Confidence</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {candidates.map((c, i) => (
              <div
                key={i}
                onClick={() => handleRowClick(i)}
                className={`grid grid-cols-[2.5rem_2rem_1fr_6rem_4rem_9rem_6rem] gap-0 px-5 py-4 cursor-pointer transition-all duration-150 group
                  ${selectedIndex === i
                    ? "bg-sky-500/10 border-l-2 border-l-sky-500"
                    : compareIndices.includes(i)
                    ? "bg-sky-500/5 border-l-2 border-l-sky-400"
                    : "hover:bg-slate-900/70 border-l-2 border-l-transparent"
                  }`}
              >
                <span className="text-sm font-bold text-slate-500 flex items-center">{i + 1}</span>

                <div className="flex items-center">
                  <div
                    onClick={(e) => handleCheckbox(e, i)}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all
                      ${compareIndices.includes(i)
                        ? "bg-sky-500 border-sky-500"
                        : compareIndices.length >= 2
                        ? "border-slate-700 opacity-30 cursor-not-allowed"
                        : "border-slate-600 hover:border-sky-500"
                      }`}
                  >
                    {compareIndices.includes(i) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{c.name}</span>
                </div>

                <div className="flex items-center gap-2 pr-4">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreBarColor(c.score)}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <span style={{ color: getScoreInlineColor(c.score) }} className="text-sm font-bold flex-shrink-0">{c.score}</span>
                </div>

                <div className="flex items-center pr-4">
                  <span style={gradeStyles[c.grade] ?? gradeStyles["F"]} className="text-xs px-2 py-0.5 rounded font-bold">{c.grade}</span>
                </div>

                <div className="flex items-center pr-4">
                  <span style={recommendationStyles[c.recommendation] ?? recommendationStyles["Do Not Hire"]} className="text-xs px-2.5 py-1 rounded-full font-medium truncate">{c.recommendation}</span>
                </div>

                <div className="flex items-center">
                  <span style={confidenceStyles[c.confidence] ?? confidenceStyles["Low"]} className="text-xs px-2.5 py-1 rounded-full font-medium">{c.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Click any row to view full candidate details
        </p>
      </div>

      <CandidatePanel
        candidate={selectedCandidate}
        rank={selectedIndex !== null ? selectedIndex + 1 : 1}
        onClose={() => setSelectedIndex(null)}
      />

      {showCompare && compareIndices.length === 2 && (
        <CompareModal
          a={candidates[compareIndices[0]]}
          b={candidates[compareIndices[1]]}
          verdict={verdict}
          loading={verdictLoading}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}