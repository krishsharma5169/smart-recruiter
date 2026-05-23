"use client"

import { useState, useRef } from "react"
import { CandidateResult, JdSummary, AppState } from "@/types"
import { sortCandidates } from "@/lib/utils"
import UploadScreen from "@/components/UploadScreen"
import StreamingScreen from "@/components/StreamingScreen"
import ResultsDashboard from "@/components/ResultsDashboard"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload")
  const [streamingCandidates, setStreamingCandidates] = useState<CandidateResult[]>([])
  const [finalCandidates, setFinalCandidates] = useState<CandidateResult[]>([])
  const [jdSummary, setJdSummary] = useState<JdSummary | null>(null)
  const [totalExpected, setTotalExpected] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleAnalyze = async (jd: File, resumes: File[]) => {
    setError(null)
    setIsConnecting(true)
    setStreamingCandidates([])
    setJdSummary(null)
    setTotalExpected(resumes.length)

    const formData = new FormData()
    formData.append("jd", jd)
    resumes.forEach((r) => formData.append("resumes", r))

    abortRef.current = new AbortController()

    let response: Response
    try {
      response = await fetch(`${API_URL}/analyze/stream`, {
        method: "POST",
        body: formData,
        signal: abortRef.current.signal,
      })
    } catch (err: any) {
      setIsConnecting(false)
      if (err.name === "AbortError") return
      setError(
        "Could not reach the backend server. Make sure it is running on http://localhost:8000 and try again."
      )
      return
    }

    if (!response.ok) {
      setIsConnecting(false)
      setError(`Server returned an error (${response.status}). Please check the backend and try again.`)
      return
    }

    setIsConnecting(false)
    setAppState("streaming")

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      setError("Could not read the response stream.")
      setAppState("upload")
      return
    }

    const collected: CandidateResult[] = []
    let parsedJdSummary: JdSummary | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const raw = line.replace("data: ", "").trim()
          if (raw === "[DONE]") break

          try {
            const event = JSON.parse(raw)

            if (event.type === "jd_summary") {
              parsedJdSummary = event.data as JdSummary
              setJdSummary(parsedJdSummary)
            } else if (event.type === "candidate") {
              const candidate = event.data as CandidateResult
              collected.push(candidate)
              setStreamingCandidates([...collected])
            } else {
              // Legacy format fallback: no type field, treat whole object as candidate
              if (event.name && event.score !== undefined) {
                collected.push(event as CandidateResult)
                setStreamingCandidates([...collected])
              }
            }
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("Stream was interrupted. Showing results collected so far.")
      }
    }

    // Sort and move to results
    const sorted = sortCandidates(collected)
    setFinalCandidates(sorted)
    setAppState("results")
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setAppState("upload")
    setStreamingCandidates([])
    setFinalCandidates([])
    setJdSummary(null)
    setTotalExpected(0)
    setError(null)
  }

  return (
    <>
      {/* Inline error banner */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-500/30 bg-[#0a0f1e]/95 backdrop-blur shadow-2xl shadow-red-500/10">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {appState === "upload" && (
        <UploadScreen onAnalyze={handleAnalyze} isLoading={isConnecting} />
      )}

      {appState === "streaming" && (
        <StreamingScreen
          candidates={streamingCandidates}
          total={totalExpected}
          currentCount={streamingCandidates.length}
          jdSummary={jdSummary}
        />
      )}

      {appState === "results" && (
        <ResultsDashboard
          candidates={finalCandidates}
          jdSummary={jdSummary}
          onReset={handleReset}
        />
      )}
    </>
  )
}
