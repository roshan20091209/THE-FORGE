import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function SubmitSolution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [solution, setSolution] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [credentialId, setCredentialId] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!solution.trim()) return
    setSubmitting(true)
    try {
      await api.attempts.submit(id, solution)
      setSubmitted(true)
      await startEvaluation()
    } catch (err) {
      alert(err.message)
    }
    setSubmitting(false)
  }

  const startEvaluation = async () => {
    setEvaluating(true)
    try {
      const result = await api.attempts.evaluate(id)
      if (result.status === 'completed') {
        try {
          const credData = await api.credentials.create(id)
          setCredentialId(credData.credential.slug)
        } catch {}
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (credentialId) {
      const timer = setTimeout(() => navigate(`/c/${credentialId}`), 1500)
      return () => clearTimeout(timer)
    }
  }, [credentialId, navigate])

  if (evaluating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold mb-4">Analyzing Your Solution...</h2>
          <p className="text-gray-400">Our AI is reading your work and building your capability profile.</p>
          <div className="mt-8 flex justify-center gap-1">
            <span className="w-3 h-3 bg-forge-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-3 h-3 bg-forge-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-3 h-3 bg-forge-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-4">Solution Submitted!</h1>
        <p className="text-gray-400 mb-2">Your capability profile is ready.</p>
        <button onClick={() => navigate(`/dashboard`)} className="text-forge-400 hover:underline text-sm">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Submit Your Solution</h1>
      <p className="text-gray-400 mb-8">Show what you've figured out. Be thorough — the AI reads everything.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Your Solution</label>
          <textarea
            value={solution}
            onChange={e => setSolution(e.target.value)}
            rows={15}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-forge-500 font-mono text-sm"
            placeholder="Write your solution here. Explain your thinking, what you tried, what you learned..."
            required
          />
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(`/attempts/${id}`)} className="border border-gray-600 hover:border-gray-400 px-6 py-2 rounded-lg transition text-sm">
            Back
          </button>
          <button type="submit" disabled={submitting || !solution.trim()} className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 px-6 py-2 rounded-lg font-semibold transition text-sm">
            {submitting ? 'Submitting...' : 'Submit & Get Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
