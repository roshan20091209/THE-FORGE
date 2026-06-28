import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function AttemptWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [sim, setSim] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const chatEnd = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    loadAttempt()
    timerRef.current = setInterval(updateTimer, 1000)
    return () => clearInterval(timerRef.current)
  }, [id])

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000)
      return () => clearTimeout(t)
    }
  }, [cooldown])

  const loadAttempt = async () => {
    try {
      const data = await api.attempts.get(id)
      setAttempt(data.attempt)
      if (data.attempt.status !== 'in_progress') {
        setTimeLeft('00:00:00')
        setLoading(false)
        return
      }
      const simData = await api.simulations.get(data.attempt.simulation_id)
      setSim(simData.simulation)
      if (data.attempt.ai_conversation_history) {
        const hist = typeof data.attempt.ai_conversation_history === 'string'
          ? JSON.parse(data.attempt.ai_conversation_history)
          : data.attempt.ai_conversation_history
        setMessages(Array.isArray(hist) ? hist : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateTimer = () => {
    if (!attempt) return
    const secs = attempt.time_remaining_seconds
    if (secs <= 0) {
      setTimeLeft('00:00:00')
      return
    }
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
  }

  const sendMessage = async () => {
    if (!input.trim() || sending || cooldown > 0) return
    setSending(true)
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', message: userMsg, timestamp: new Date().toISOString() }])
    try {
      const data = await api.attempts.sendMessage(id, userMsg)
      setMessages(prev => [...prev, { role: 'tutor', message: data.reply, timestamp: new Date().toISOString() }])
      setCooldown(15)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', message: err.message || 'Failed to send message' }])
    }
    setSending(false)
  }

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="text-4xl mb-4">🧠</div>
        <div className="text-forge-400 text-lg">Loading your challenge...</div>
      </div>
    </div>
  )

  if (!attempt) return <div className="text-center py-20">Challenge not found</div>

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <div className="h-4 w-px bg-gray-700" />
          <div>
            <h2 className="font-semibold text-sm">{sim?.title || 'Challenge'}</h2>
            <span className="text-[10px] text-gray-500">{sim?.industry || ''} · {sim?.difficulty || ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className={`font-mono text-lg font-bold tracking-wider ${parseInt(timeLeft.split(':')[0] || '0') < 2 ? 'text-red-400' : 'text-forge-400'}`}>
              {timeLeft || '--:--:--'}
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">Time Left</div>
          </div>
          {attempt.status === 'in_progress' && (
            <button onClick={() => navigate(`/attempts/${id}/submit`)} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-sm font-medium transition">
              Submit Solution
            </button>
          )}
        </div>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-forge-400 font-medium">AI Tutor</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">Ask me anything. I'll help you think through it.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg mb-2">🧠 Stuck? Talk to your AI tutor.</p>
            <p className="text-sm">Ask questions, share your ideas, or just think out loud. I'm here to help.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-forge-700 text-white'
                : msg.role === 'tutor'
                  ? 'bg-gray-800 text-gray-200 border border-gray-700'
                  : 'bg-red-900/50 text-red-200 border border-red-700'
            }`}>
              {msg.role !== 'user' && (
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === 'tutor' ? (
                    <span className="text-xs text-forge-400 font-medium">🧠 Tutor</span>
                  ) : (
                    <span className="text-xs text-gray-500">System</span>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="text-xs text-gray-300 mb-1">
                  You · {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-forge-400 text-sm">🧠 Tutor</span>
                <span className="text-gray-500 text-sm animate-pulse">thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {attempt.status === 'in_progress' && (
        <div className="border-t border-gray-800 p-4 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              {cooldown > 0 && (
                <span className="text-xs text-amber-400">Wait {cooldown}s before asking again</span>
              )}
            </div>
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your tutor for hints, guidance, or just talk through your approach..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-forge-500 resize-none placeholder-gray-500 text-sm"
                rows={2}
                disabled={cooldown > 0}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim() || cooldown > 0} className="bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-2 rounded-lg transition self-end text-white font-medium text-sm">
                {cooldown > 0 ? `${cooldown}s` : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
