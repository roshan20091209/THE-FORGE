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
  const [crisis, setCrisis] = useState(null)
  const chatEnd = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    loadAttempt()
    const interval = setInterval(loadAttempt, 15000)
    const crisisInterval = setInterval(checkCrisis, 30000)
    timerRef.current = setInterval(updateTimer, 1000)
    return () => { clearInterval(interval); clearInterval(crisisInterval); clearInterval(timerRef.current) }
  }, [id])

  const loadAttempt = async () => {
    try {
      const data = await api.attempts.get(id)
      if (data.attempt.status !== 'in_progress') {
        setAttempt(data.attempt)
        setTimeLeft('00:00:00')
        setLoading(false)
        return
      }
      setAttempt(data.attempt)
      const simData = await api.simulations.get(data.attempt.simulation_id)
      setSim(simData.simulation)
      if (data.attempt.ai_conversation_history) {
        setMessages(JSON.parse(data.attempt.ai_conversation_history))
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
      navigate(`/attempts/${id}/submit`)
      return
    }
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
  }

  const checkCrisis = async () => {
    try {
      const data = await api.attempts.checkCrisis(id)
      if (data.crisis) setCrisis(data.crisis)
    } catch (err) {
      console.error(err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', message: userMsg }])
    try {
      const data = await api.attempts.sendMessage(id, userMsg)
      setMessages(prev => [...prev, { role: 'ai_manager', message: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', message: 'Failed to send message' }])
    }
    setSending(false)
  }

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) return <div className="text-center py-20">Loading workspace...</div>
  if (!attempt) return <div className="text-center py-20">Attempt not found</div>

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{sim?.title || 'Simulation'}</h2>
            <span className="text-xs text-gray-500">Status: {attempt.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`font-mono text-xl ${parseInt(timeLeft.split(':')[0] || '0') < 6 ? 'text-red-400' : 'text-forge-400'}`}>
              {timeLeft || '--:--:--'}
            </div>
            {attempt.status === 'in_progress' && (
              <button onClick={() => navigate(`/attempts/${id}/submit`)} className="bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-sm transition">
                Submit Solution
              </button>
            )}
          </div>
        </div>

        {crisis && (
          <div className="bg-red-900/30 border-b border-red-700 px-6 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-semibold text-red-300">Crisis: {crisis.type?.replace(/_/g, ' ')}</p>
                <p className="text-sm text-red-200">{crisis.message}</p>
                <button onClick={() => setCrisis(null)} className="text-xs text-gray-400 hover:text-white mt-1">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="mb-2">The simulation has started. Your AI manager is waiting.</p>
              <p className="text-sm">Introduce yourself and ask clarifying questions about the problem.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                msg.role === 'user' ? 'bg-forge-700 text-white' :
                msg.role === 'ai_manager' ? 'bg-gray-800 text-gray-200' :
                'bg-red-900/50 text-red-200'
              }`}>
                {msg.role !== 'user' && (
                  <p className="text-xs text-gray-500 mb-1">
                    {msg.role === 'ai_manager' ? 'AI Manager' : 'System'}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
          {sending && <div className="text-center text-gray-500 text-sm">AI Manager is typing...</div>}
          <div ref={chatEnd} />
        </div>

        {attempt.status === 'in_progress' && (
          <div className="border-t border-gray-800 p-4 bg-gray-900">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your AI manager..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-forge-500 resize-none"
                rows={2}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()} className="bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-6 py-2 rounded-lg transition self-end">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
