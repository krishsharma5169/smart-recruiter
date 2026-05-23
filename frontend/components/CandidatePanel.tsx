"use client"

import { CandidateResult } from "@/types"
import {
  getRecommendationStyle,
  getConfidenceStyle,
  getScoreColor,
  getScoreBarColor,
  getGradeBadgeStyle,
} from "@/lib/utils"

interface CandidatePanelProps {
  candidate: CandidateResult | null
  rank: number
  onClose: () => void
}

export default function CandidatePanel({ candidate, rank, onClose }: CandidatePanelProps) {
  const isOpen = candidate !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0d1424] border-l border-slate-800 z-50 flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {candidate && (
          <>
            {/* Panel header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-800">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                    Rank #{rank}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white truncate">{candidate.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRecommendationStyle(candidate.recommendation)}`}>
                    {candidate.recommendation}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getConfidenceStyle(candidate.confidence)}`}>
                    {candidate.confidence} Confidence
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Score section */}
            <div className="px-6 py-5 border-b border-slate-800">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overall Score</p>
                  <div className="flex items-end gap-3">
                    <span className={`text-5xl font-black ${getScoreColor(candidate.score)}`}>
                      {candidate.score}
                    </span>
                    <span className="text-slate-500 text-sm mb-1.5">/ 100</span>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-black text-2xl
                  ${getGradeBadgeStyle(candidate.grade)}`}>
                  {candidate.grade}
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getScoreBarColor(candidate.score)}`}
                  style={{ width: `${candidate.score}%` }}
                />
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Reasoning */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2.5">
                  AI Assessment
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {candidate.reasoning}
                </p>
              </div>

              {/* Strengths */}
              {candidate.strengths.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Strengths
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.strengths.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {candidate.gaps.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Gaps
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.gaps.map((g, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
