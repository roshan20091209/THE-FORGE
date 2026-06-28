import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { api } from '../api'
import Button from '../components/ui/Button'

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
          setCredentialId(credData.credential?.slug)
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-6 animate-float">📊</div>
          <h2 className="text-2xl font-display font-bold mb-4">Analyzing Your Solution...</h2>
          <p className="text-forge-text-secondary">Our AI is reading your work and building your capability profile.</p>
          <div className="mt-8 flex justify-center gap-1">
            <span className="w-3 h-3 bg-forge-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-3 h-3 bg-forge-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-3 h-3 bg-forge-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-display font-bold mb-4">Solution Submitted!</h1>
          <p className="text-forge-text-secondary mb-6">Your capability profile is ready.</p>
          <Link to="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(`/attempts/${id}`)} className="btn-ghost text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card !p-6 md:!p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-forge-accent" />
          <div>
            <h1 className="text-2xl font-display font-bold">Submit Your Solution</h1>
            <p className="text-forge-text-secondary text-sm mt-1">Show what you've figured out. The AI reads everything.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-forge-text-secondary mb-2">Your Solution</label>
            <textarea
              value={solution}
              onChange={e => setSolution(e.target.value)}
              rows={15}
              className="input-field font-mono text-sm"
              placeholder="Write your solution here. Explain your thinking, what you tried, what you learned..."
              required
            />
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate(`/attempts/${id}`)}>
              Back
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1"
              disabled={submitting || !solution.trim()}
              loading={submitting}
            >
              Submit & Get Profile
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
