"use client"

import { useState } from "react"
import { CandidateResult, JdSummary } from "@/types"
import {
  getRecommendationStyle,
  getConfidenceStyle,
  getScoreColor,
  getScoreBarColor,
  getGradeBadgeStyle,
} from "@/lib/utils"
import CandidatePanel from "./CandidatePanel"

interface ResultsDashboardProps {
  candidates: CandidateResult[]
  jdSummary: JdSummary | null
  onReset: () => void
}

export default function ResultsDashboard({ candidates, jdSummary, onReset }: ResultsDashboardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const hireCount = candidates.filter(
    (c) => c.recommendation === "Strong Hire" || c.recommendation === "Hire"
  ).length

  const topCandidate = candidates[0]

  const handleRowClick = (index: number) => {
    setSelectedIndex(prev => prev === index ? null : index)
  }

  const selectedCandidate = selectedIndex !== null ? candidates[selectedIndex] : null

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-6 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">
              Smart<span className="text-sky-400">Recruiter</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Analysis complete</p>
          </div>
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

        {/* Summary cards */}
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
                <p className={`text-sm font-semibold ${getScoreColor(topCandidate.score)}`}>
                  Score: {topCandidate.score}
                </p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">—</p>
            )}
          </div>
        </div>

        {/* JD Criteria Panel */}
        {jdSummary && (
          <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 px-5 py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <p className="text-xs text-sky-400 uppercase tracking-widest font-medium">
                Scoring Criteria · {jdSummary.job_title}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
              {/* Required Skills */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {jdSummary.required_skills.length > 0 ? jdSummary.required_skills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/20">
                      {s}
                    </span>
                  )) : <span className="text-xs text-slate-600">None specified</span>}
                </div>
              </div>

              {/* Nice to Have */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Nice to Have</p>
                <div className="flex flex-wrap gap-1.5">
                  {jdSummary.nice_to_have.length > 0 ? jdSummary.nice_to_have.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">
                      {s}
                    </span>
                  )) : <span className="text-xs text-slate-600">None specified</span>}
                </div>
              </div>

              {/* Experience */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Experience</p>
                <span className="text-sm text-slate-300">{jdSummary.experience_years}</span>
              </div>

              {/* Key Responsibilities */}
              {jdSummary.key_responsibilities.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Key Responsibilities</p>
                  <ul className="space-y-1">
                    {jdSummary.key_responsibilities.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-slate-600 mt-0.5">·</span>
                        {r}
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

        {/* Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_6rem_4rem_9rem_6rem] gap-0 px-5 py-3 border-b border-slate-800 bg-slate-900/80">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">#</span>
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
                className={`grid grid-cols-[2.5rem_1fr_6rem_4rem_9rem_6rem] gap-0 px-5 py-4 cursor-pointer transition-all duration-150 group
                  ${selectedIndex === i
                    ? "bg-sky-500/10 border-l-2 border-l-sky-500"
                    : "hover:bg-slate-900/70 border-l-2 border-l-transparent"
                  }`}
              >
                <span className="text-sm font-bold text-slate-500 flex items-center">{i + 1}</span>

                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                    {c.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 pr-4">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(c.score)}`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${getScoreColor(c.score)}`}>
                    {c.score}
                  </span>
                </div>

                <div className="flex items-center pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${getGradeBadgeStyle(c.grade)}`}>
                    {c.grade}
                  </span>
                </div>

                <div className="flex items-center pr-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium truncate ${getRecommendationStyle(c.recommendation)}`}>
                    {c.recommendation}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getConfidenceStyle(c.confidence)}`}>
                    {c.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Click any row to view full candidate details
        </p>
      </div>

      {/* Side panel */}
      <CandidatePanel
        candidate={selectedCandidate}
        rank={selectedIndex !== null ? selectedIndex + 1 : 1}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  )
}
