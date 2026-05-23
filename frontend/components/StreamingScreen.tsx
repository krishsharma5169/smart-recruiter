"use client"

import { CandidateResult, JdSummary } from "@/types"
import { getRecommendationStyle, getScoreColor } from "@/lib/utils"

interface StreamingScreenProps {
  candidates: CandidateResult[]
  total: number
  currentCount: number
  jdSummary: JdSummary | null
}

export default function StreamingScreen({ candidates, total, currentCount, jdSummary }: StreamingScreenProps) {
  const progress = total > 0 ? (currentCount / total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            Smart<span className="text-sky-400">Recruiter</span>
          </h1>
          {jdSummary ? (
            <p className="text-slate-300 text-sm font-medium">
              Scoring for{" "}
              <span className="text-sky-400">{jdSummary.job_title}</span>
            </p>
          ) : (
            <p className="text-slate-400 text-sm">Starting analysis...</p>
          )}
          <p className="text-slate-500 text-xs mt-1">
            {currentCount === 0
              ? "Waiting for first result..."
              : total > 0
              ? `Analyzed ${currentCount} of ${total} candidates`
              : `Analyzed ${currentCount} candidate${currentCount !== 1 ? "s" : ""} so far...`}
          </p>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Live results */}
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-sky-500/30" />
              <div className="absolute inset-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-500 text-sm">
              {jdSummary ? "Scoring candidates..." : "Parsing files and initializing agent..."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-slate-900/70 border border-slate-800 animate-fadeIn"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.recommendation}</p>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(c.score)}`}>
                  {c.score}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRecommendationStyle(c.recommendation)}`}>
                  {c.grade}
                </span>
              </div>
            ))}

            {/* Scanning indicator */}
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 italic">Scoring next candidate...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
