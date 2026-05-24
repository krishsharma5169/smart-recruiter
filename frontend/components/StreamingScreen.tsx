"use client"

import { useState, useEffect, useRef } from "react"
import { CandidateResult, JdSummary } from "@/types"

interface StreamingScreenProps {
  candidates: CandidateResult[]
  total: number
  currentCount: number
  jdSummary: JdSummary | null
}

const gradeStyles: Record<string, React.CSSProperties> = {
  "A": { background: "rgba(16,185,129,0.2)",  color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.4)" },
  "B": { background: "rgba(34,197,94,0.2)",   color: "#86efac", border: "1px solid rgba(34,197,94,0.4)" },
  "C": { background: "rgba(234,179,8,0.25)",  color: "#fde047", border: "1px solid rgba(234,179,8,0.5)" },
  "D": { background: "rgba(249,115,22,0.25)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.5)" },
  "F": { background: "rgba(239,68,68,0.2)",   color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)" },
}

function getScoreInlineColor(score: number): string {
  if (score >= 85) return "#34d399"
  if (score >= 70) return "#4ade80"
  if (score >= 55) return "#facc15"
  if (score >= 40) return "#fb923c"
  return "#f87171"
}

function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 800
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target])

  return (
    <span style={{ color: getScoreInlineColor(target) }} className="text-lg font-bold tabular-nums">
      {display}
    </span>
  )
}

export default function StreamingScreen({ candidates, total, currentCount, jdSummary }: StreamingScreenProps) {
  const progress = total > 0 ? (currentCount / total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            Smart<span className="text-sky-400">Recruiter</span>
          </h1>
          {jdSummary ? (
            <p className="text-slate-300 text-sm font-medium">
              Scoring for <span className="text-sky-400">{jdSummary.job_title}</span>
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
                <AnimatedScore target={c.score} />
                <span style={gradeStyles[c.grade] ?? gradeStyles["F"]} className="text-xs px-2 py-0.5 rounded-full font-medium">
                  {c.grade}
                </span>
              </div>
            ))}

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