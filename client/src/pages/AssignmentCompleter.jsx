import { useState, useEffect } from 'react'
import { api } from '../api'
import { ClipboardList, Send, Loader2, CheckCircle, AlertCircle, Plus, X, Copy, Check, Hash, Languages } from 'lucide-react'

export default function AssignmentCompleter() {
  const [textbooks, setTextbooks] = useState([])
  const [selectedTb, setSelectedTb] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [marks, setMarks] = useState(2)
  const [language, setLanguage] = useState('english')
  const [questions, setQuestions] = useState([''])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.textbooks.list({ indexing_status: 'completed' })
      .then(d => setTextbooks(d.textbooks || []))
      .catch(() => {})
  }, [])

  function addQuestion() { setQuestions([...questions, '']) }
  function removeQuestion(i) {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, idx) => idx !== i))
  }
  function updateQuestion(i, val) { const q = [...questions]; q[i] = val; setQuestions(q) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validQuestions = questions.filter(q => q.trim())
    if (validQuestions.length === 0) {
      setError('Add at least one question')
      return
    }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await api.ask.assignment({
        questions: validQuestions,
        subject: selectedSubject || undefined,
        textbook_id: selectedTb || undefined,
        marks_per_question: marks,
        language
      })
      setResults(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function copyAll() {
    if (!results?.answers) return
    const text = results.answers.map((a, i) =>
      `Q${i + 1}: ${a.question}\n\n${a.answer}\n\n${a.source === 'not_in_syllabus' ? '⚠ Not in syllabus' : a.page_reference ? `📖 ${a.page_reference}` : ''}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold">Assignment Completer</h1>
            <p className="text-xs text-slate-500">Bulk OSM-formatted answers, up to 50 questions</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>
              <option value="physics">Physics (042)</option>
              <option value="chemistry">Chemistry (043)</option>
              <option value="mathematics">Mathematics (041)</option>
            </select>
            {textbooks.length > 0 ? (
              <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                value={selectedTb} onChange={e => setSelectedTb(e.target.value)}>
                <option value="">Textbook (optional)</option>
                {textbooks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500">
                No textbooks indexed
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 appearance-none"
                  value={marks} onChange={e => setMarks(Number(e.target.value))}>
                  <option value={2}>2 Marks each</option>
                  <option value={5}>5 Marks each</option>
                  <option value={8}>8 Marks each</option>
                </select>
              </div>
              <div className="relative flex-1">
                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 appearance-none"
                  value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="english">English</option>
                  <option value="tamil">தமிழ்</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                Questions ({questions.filter(q => q.trim()).length})
              </span>
              <button type="button" onClick={addQuestion}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-slate-500 w-5 text-right">{i + 1}.</span>
                  <input className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                    placeholder={`Question ${i + 1}`} value={q}
                    onChange={e => updateQuestion(i, e.target.value)} />
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(i)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Answering all questions...</>
              : <><Send className="w-4 h-4" /> Complete Assignment</>}
          </button>
        </form>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">{results.answers?.length || 0} answers</span>
                {results.not_in_syllabus?.length > 0 && (
                  <span className="text-amber-400">• {results.not_in_syllabus.length} OOS</span>
                )}
              </div>
              <button onClick={copyAll}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>

            <div className="space-y-3">
              {results.answers?.map((a, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-slate-200">Q{i + 1}: {a.question}</p>
                    {a.subject && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 ml-2 flex-shrink-0">
                        {a.subject}
                      </span>
                    )}
                  </div>
                  {a.source === 'not_in_syllabus' ? (
                    <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Not in CBSE 2026-27 syllabus
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-300 font-mono">{a.answer}</p>
                      {a.page_reference && (
                        <p className="text-xs text-slate-500 mt-2">📖 {a.page_reference}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {results.not_in_syllabus?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-300 mb-2">
                  Out of Syllabus ({results.not_in_syllabus.length})
                </h3>
                <ul className="list-disc list-inside text-sm text-amber-300/70 space-y-1">
                  {results.not_in_syllabus.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
