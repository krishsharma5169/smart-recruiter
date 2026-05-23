"use client"

import { useState, useRef, useCallback } from "react"
import { validateFile } from "@/lib/utils"

interface UploadScreenProps {
  onAnalyze: (jd: File, resumes: File[]) => void
  isLoading?: boolean
}

export default function UploadScreen({ onAnalyze, isLoading }: UploadScreenProps) {
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [jdDragging, setJdDragging] = useState(false)
  const [resumeDragging, setResumeDragging] = useState(false)

  const jdInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const handleJdChange = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const err = validateFile(file)
    if (err) {
      setErrors([err])
      return
    }
    setErrors([])
    setJdFile(file)
  }

  const handleResumeChange = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming = Array.from(files)
    const newErrors: string[] = []

    if (resumeFiles.length + incoming.length > 10) {
      newErrors.push(`You can upload a maximum of 10 resumes. You already have ${resumeFiles.length}.`)
      setErrors(newErrors)
      return
    }

    const valid: File[] = []
    for (const f of incoming) {
      const err = validateFile(f)
      if (err) newErrors.push(err)
      else valid.push(f)
    }

    setErrors(newErrors)
    if (valid.length > 0) {
      setResumeFiles(prev => {
        const names = new Set(prev.map(f => f.name))
        return [...prev, ...valid.filter(f => !names.has(f.name))]
      })
    }
  }

  const removeResume = (index: number) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index))
  }

  const canAnalyze = jdFile !== null && resumeFiles.length > 0

  const handleSubmit = () => {
    if (!canAnalyze) return
    onAnalyze(jdFile!, resumeFiles)
  }

  const onJdDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setJdDragging(false)
    handleJdChange(e.dataTransfer.files)
  }, [])

  const onResumeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setResumeDragging(false)
    handleResumeChange(e.dataTransfer.files)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-medium tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          AI-Powered Recruitment
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
          Smart<span className="text-sky-400">Recruiter</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Upload a job description and candidate resumes. Our AI agent ranks and scores each applicant in seconds.
        </p>
      </div>

      {/* Upload cards */}
      <div className="w-full max-w-2xl space-y-4">

        {/* JD Upload */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
            ${jdDragging ? "border-sky-400 bg-sky-400/10" : jdFile ? "border-sky-500/50 bg-sky-500/5" : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900"}`}
          onClick={() => jdInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setJdDragging(true) }}
          onDragLeave={() => setJdDragging(false)}
          onDrop={onJdDrop}
        >
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => handleJdChange(e.target.files)}
          />
          <div className="p-6 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 
              ${jdFile ? "bg-sky-500/20" : "bg-slate-800"}`}>
              <svg className={`w-5 h-5 ${jdFile ? "text-sky-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">Job Description</p>
              {jdFile ? (
                <p className="text-sm text-slate-200 truncate font-medium">{jdFile.name}</p>
              ) : (
                <p className="text-sm text-slate-400">Click or drag to upload a PDF or DOCX</p>
              )}
            </div>
            {jdFile && (
              <button
                onClick={(e) => { e.stopPropagation(); setJdFile(null) }}
                className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Resumes Upload */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
            ${resumeDragging ? "border-violet-400 bg-violet-400/10" : resumeFiles.length > 0 ? "border-violet-500/50 bg-violet-500/5" : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900"}`}
          onClick={() => resumeInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setResumeDragging(true) }}
          onDragLeave={() => setResumeDragging(false)}
          onDrop={onResumeDrop}
        >
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx"
            multiple
            className="hidden"
            onChange={(e) => handleResumeChange(e.target.files)}
          />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${resumeFiles.length > 0 ? "bg-violet-500/20" : "bg-slate-800"}`}>
                <svg className={`w-5 h-5 ${resumeFiles.length > 0 ? "text-violet-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">
                  Candidate Resumes
                  <span className={`ml-2 text-xs font-normal ${resumeFiles.length >= 10 ? "text-orange-400" : "text-slate-600"}`}>
                    {resumeFiles.length}/10
                  </span>
                </p>
                <p className="text-sm text-slate-400">Click or drag to add PDF or DOCX files</p>
              </div>
            </div>

            {resumeFiles.length > 0 && (
              <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                {resumeFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-violet-500/20 text-violet-400 text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
                    <button
                      onClick={() => removeResume(i)}
                      className="w-5 h-5 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-slate-500 hover:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-400 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleSubmit}
          disabled={!canAnalyze || isLoading}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
            ${canAnalyze && !isLoading
              ? "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-[0.99]"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </span>
          ) : (
            "Analyze Candidates →"
          )}
        </button>

        <p className="text-center text-xs text-slate-600">
          PDF and DOCX only · Max 10 resumes · Max 5MB per file
        </p>
      </div>
    </div>
  )
}
