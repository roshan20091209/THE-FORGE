import { useState, useEffect } from 'react'
import { api } from '../api'
import { Lightbulb, Loader2, Copy, Check, BookOpen, BookMarked, GraduationCap } from 'lucide-react'

const SUBJECTS = [
  { id: 'physics', name: 'Physics', icon: '⚛️', color: 'from-blue-500 to-cyan-400', marks: 70 },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'from-emerald-500 to-green-400', marks: 70 },
  { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'from-purple-500 to-pink-400', marks: 80 },
]

export default function QuestionBank() {
  const [textbooks, setTextbooks] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedTb, setSelectedTb] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedCh, setSelectedCh] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [questionTypes, setQuestionTypes] = useState(['short', 'long'])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.textbooks.list({ indexing_status: 'completed' })
      .then(d => setTextbooks(d.textbooks || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedTb) { setChapters([]); return }
    api.textbooks.chapters(selectedTb)
      .then(d => setChapters(d.chapters || []))
      .catch(() => {})
  }, [selectedTb])

  function toggleType(t) {
    setQuestionTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!selectedSubject && !selectedTb) {
      setError('Select a subject or textbook')
      return
    }
    setLoading(true)
    setError('')
    setQuestions([])
    try {
      const data = await api.ask.generateQuestions({
        subject: selectedSubject || undefined,
        textbook_id: selectedTb || undefined,
        chapter_id: selectedCh || undefined,
        count,
        difficulty,
        question_types: questionTypes
      })
      setQuestions(data.questions || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function copyAll() {
    const text = questions.map((q, i) =>
      `Q${i + 1}. [${q.marks}m, ${q.difficulty}] ${q.question}\n\n${q.model_answer || ''}${q.chapter_name ? `\n📚 ${q.chapter_name}` : ''}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold">Question Bank Generator</h1>
            <p className="text-xs text-slate-500">PYQ-patterned questions with OSM model answers</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
          {/* Subject / Book / Chapter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedCh('') }}>
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.marks}m)</option>
              ))}
            </select>
            <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              value={selectedTb} onChange={e => { setSelectedTb(e.target.value); setSelectedCh('') }}>
              <option value="">Textbook (optional)</option>
              {textbooks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <select className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              value={selectedCh} onChange={e => setSelectedCh(e.target.value)}>
              <option value="">All Chapters</option>
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.chapter_number}. {c.chapter_name}</option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Count:</span>
              <input type="number" min={1} max={50} value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-16 text-center" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Difficulty:</span>
              <select className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-200"
                value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Types:</span>
              {['mcq', 'short', 'long', 'numerical', 'derivation', 'reasoning'].map(t => (
                <button key={t} type="button"
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all border ${
                    questionTypes.includes(t)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                  }`}
                  onClick={() => toggleType(t)}>{t}</button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating questions...</>
              : <><BookMarked className="w-4 h-4" /> Generate Question Bank</>}
          </button>
        </form>

        {/* Results */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-sm text-slate-300">{questions.length} questions generated</p>
              <button onClick={copyAll}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">Q{i + 1}. {q.question}</p>
                      {q.chapter_name && (
                        <p className="text-xs text-slate-500 mt-0.5">📚 {q.chapter_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs flex-shrink-0 ml-2">
                      <span className={`px-2 py-0.5 rounded-full border ${
                        q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        q.difficulty === 'hard' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                        q.difficulty === 'mixed' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}>{q.difficulty}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{q.marks}m</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-400 border border-slate-700/50">{q.question_type}</span>
                    </div>
                  </div>
                  {q.model_answer && (
                    <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-medium text-slate-400 mb-1">Model Answer:</p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{q.model_answer}</p>
                    </div>
                  )}
                  {q.page_reference && (
                    <p className="text-xs text-slate-500 mt-2">📖 {q.page_reference}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
