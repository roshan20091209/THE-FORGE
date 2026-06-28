import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Send, Clock, ArrowLeft, Sparkles } from 'lucide-react'
import { api } from '../api'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

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
  const [showTutor, setShowTutor] = useState(false)
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
    <div className="min-h-screen bg-forge-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-float">🧠</div>
        <p className="text-forge-accent">Loading your challenge...</p>
      </div>
    </div>
  )

  if (!attempt) return (
    <div className="text-center py-20">
      <p className="text-forge-text-secondary mb-4">Challenge not found</p>
      <Link to="/dashboard" className="text-forge-accent hover:underline">Back to Dashboard</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-forge-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate max-w-[200px]">{sim?.title || 'Challenge'}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-forge-text-muted">{sim?.industry || ''}</span>
                {sim?.difficulty && <Badge variant={sim.difficulty}>{sim.difficulty}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`font-mono text-base font-bold tracking-wider ${
                parseInt(timeLeft.split(':')[0] || '0') < 2 ? 'text-forge-danger' : 'text-forge-accent'
              }`}>
                {timeLeft || '--:--:--'}
              </div>
              <div className="text-[10px] text-forge-text-muted uppercase tracking-wider">Time Left</div>
            </div>
            {attempt.status === 'in_progress' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate(`/attempts/${id}/submit`)}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Problem Brief */}
      {sim && (
        <div className="border-b border-white/[0.06] bg-white/[0.02]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <p className="text-sm text-forge-text-secondary line-clamp-2">{sim.problem_brief}</p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Brain className="w-12 h-12 text-forge-accent mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">🧠 Stuck? Talk to your AI tutor.</p>
              <p className="text-sm text-forge-text-secondary">
                Ask questions, share your ideas, or just think out loud. I'm here to help.
              </p>
            </motion.div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-forge-accent text-white rounded-br-sm'
                  : msg.role === 'tutor'
                    ? 'bg-forge-surface-hover text-forge-text border border-white/[0.06] rounded-bl-sm'
                    : 'bg-forge-danger/10 text-forge-danger border border-forge-danger/20'
              }`}>
                {msg.role !== 'user' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {msg.role === 'tutor' ? (
                      <span className="text-[10px] text-forge-accent font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Tutor
                      </span>
                    ) : (
                      <span className="text-[10px] text-forge-text-muted">System</span>
                    )}
                    <span className="text-[10px] text-forge-text-muted">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="text-[10px] text-white/60 mb-1">
                    You · {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
              </div>
            </motion.div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-forge-surface-hover border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-forge-accent text-sm">🧠 Tutor</span>
                  <span className="text-forge-text-muted text-sm animate-pulse">thinking</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-forge-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-forge-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-forge-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>
      </div>

      {/* Input Area */}
      {attempt.status === 'in_progress' && (
        <div className="border-t border-white/[0.06] p-4 glass">
          <div className="max-w-4xl mx-auto">
            {cooldown > 0 && (
              <p className="text-xs text-forge-warning mb-2">Wait {cooldown}s before asking again</p>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your tutor for hints, guidance, or just talk through your approach..."
                  className="input-field resize-none pr-10"
                  rows={2}
                  disabled={cooldown > 0}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim() || cooldown > 0}
                className="w-10 h-10 rounded-full bg-forge-accent hover:bg-forge-accent/80 disabled:bg-white/[0.06] disabled:text-forge-text-muted flex items-center justify-center transition flex-shrink-0"
              >
                {cooldown > 0 ? (
                  <span className="text-xs font-mono">{cooldown}</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show message when completed */}
      {attempt.status !== 'in_progress' && (
        <div className="border-t border-white/[0.06] p-4 text-center">
          <p className="text-sm text-forge-text-secondary mb-2">
            {attempt.status === 'submitted' ? 'Solution submitted! Awaiting evaluation...' : 'Challenge completed!'}
          </p>
          <div className="flex gap-2 justify-center">
            <Link to={`/attempts/${id}/evaluation`} className="btn-primary text-xs !px-4 !py-1.5">
              View Evaluation
            </Link>
            <Link to="/dashboard" className="btn-ghost text-xs">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
