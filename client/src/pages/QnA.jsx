import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Send, BookOpen, MessageSquare, Loader2, AlertCircle, Lightbulb, History, Hash, Languages } from 'lucide-react'

export default function QnA() {
  const [textbooks, setTextbooks] = useState([])
  const [selectedTb, setSelectedTb] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [marks, setMarks] = useState(5)
  const [mode, setMode] = useState('direct')
  const [language, setLanguage] = useState('english')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    api.textbooks.list({ indexing_status: 'completed' })
      .then(d => setTextbooks(d.textbooks || []))
      .catch(() => {})
  }, [])

  async function handleAsk(e) {
    e.preventDefault()
    if (!question.trim()) {
      setError('Enter a question')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const body = {
        question: question.trim(),
        subject: selectedSubject || undefined,
        textbook_id: selectedTb || undefined,
        marks: mode === 'explain' ? undefined : marks,
        mode,
        language
      }
      const data = mode === 'explain'
        ? await api.ask.explain(body)
        : await api.ask.question(body)
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function loadHistory() {
    try {
      const data = await api.ask.history(20)
      setHistory(data.conversations || [])
      setShowHistory(!showHistory)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-xl font-bold">Ask</h1>
              <p className="text-xs text-slate-500">OSM-formatted answers from your syllabus</p>
            </div>
          </div>
          <button onClick={loadHistory}
            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white transition-colors">
            <History className="w-4 h-4" />
            {showHistory ? 'Close' : 'History'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Quick Subject Select */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setSelectedSubject('')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              !selectedSubject
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}>
            All Subjects
          </button>
          {SUBJECTS.map(s => (
            <button key={s.id} onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                selectedSubject === s.id
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleAsk} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                No textbooks indexed yet
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 appearance-none"
                  value={marks} onChange={e => setMarks(Number(e.target.value))}>
                  <option value={1}>1 Mark</option>
                  <option value={2}>2 Marks</option>
                  <option value={3}>3 Marks</option>
                  <option value={5}>5 Marks</option>
                  <option value={8}>8 Marks</option>
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

          <div className="flex gap-2">
            <button type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${mode === 'direct'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}
              onClick={() => setMode('direct')}>
              Direct Answer
            </button>
            <button type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${mode === 'explain'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}
              onClick={() => setMode('explain')}>
              <Lightbulb className="w-3 h-3 inline mr-1" />
              Explain
            </button>
            <button type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${mode === 'osm'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}
              onClick={() => setMode('osm')}>
              <BookOpen className="w-3 h-3 inline mr-1" />
              OSM Format
            </button>
          </div>

          <div className="flex gap-2">
            <input className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder={`Ask a ${selectedSubject ? SUBJECTS.find(s => s.id === selectedSubject)?.name.split(' ')[0] : 'Physics/Chemistry/Maths'} question...`}
              value={question} onChange={e => setQuestion(e.target.value)} />
            <button type="submit" disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
            <p className="text-sm text-slate-400">Searching syllabus and generating answer...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div ref={resultRef} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-4">
            {result.source === 'not_in_syllabus' ? (
              <div className="flex items-start gap-3 text-amber-300 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Not in CBSE 2026-27 Syllabus</p>
                  <p className="text-sm text-amber-300/70 mt-1">{result.answer}</p>
                </div>
              </div>
            ) : (
              <>
                {/* OSM Answer */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {result.subject && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20`}>
                          {result.subject}
                        </span>
                        {result.marks && (
                          <span className="text-xs text-slate-500">[{result.marks} marks]</span>
                        )}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none text-slate-200 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                      {result.answer}
                    </div>
                  </div>
                </div>

                {/* References */}
                {result.chapter_references?.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs font-medium text-slate-400 mb-1">📖 References</p>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(result.chapter_references)].map((ref, i) => (
                        <span key={i} className="text-xs bg-slate-700/30 text-slate-400 px-2 py-0.5 rounded">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {result.follow_up?.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs font-medium text-slate-400 mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.follow_up.map((q, i) => (
                        <button key={i} onClick={() => setQuestion(q)}
                          className="text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-lg transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                  <span>Confidence: {Math.round((result.confidence || 0) * 100)}%</span>
                  {result.tokens_used && <span>Tokens: {result.tokens_used}</span>}
                  <span className={`${result.source === 'syllabus' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {result.source === 'syllabus' ? '✓ Syllabus Verified' : '★ AI Generated'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* History */}
        {showHistory && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">Recent Questions</span>
            </div>
            {history.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 text-center">No questions yet</p>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {history.map((h, i) => (
                  <div key={h.id || i} className="p-3 hover:bg-slate-700/20 cursor-pointer transition-colors"
                    onClick={() => { setQuestion(h.question); setShowHistory(false) }}>
                    <p className="text-sm font-medium text-slate-200 truncate">{h.question}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.subject || ''} {h.marks_requested ? `• ${h.marks_requested}m` : ''}
                      {h.created_at ? ` • ${new Date(h.created_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
