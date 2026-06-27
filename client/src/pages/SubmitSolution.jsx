import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function SubmitSolution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [solution, setSolution] = useState('')
  const [solutionUrl, setSolutionUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!solution.trim()) return
    setSubmitting(true)
    try {
      await api.attempts.submit(id, solution, solutionUrl)
      setSubmitted(true)
      await api.attempts.evaluate(id)
      setTimeout(() => navigate(`/attempts/${id}`), 2000)
    } catch (err) {
      alert(err.message)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-4">Solution Submitted!</h1>
        <p className="text-gray-400">AI evaluation has started. Your credential will be ready shortly.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Submit Your Solution</h1>
      <p className="text-gray-400 mb-8">This is your final submission. Make it count.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Your Solution</label>
          <textarea
            value={solution}
            onChange={e => setSolution(e.target.value)}
            rows={15}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-forge-500 font-mono text-sm"
            placeholder="Write your solution here. Include technical analysis, code, architecture decisions, etc."
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Link to Demo/GitHub (optional)</label>
          <input
            type="url"
            value={solutionUrl}
            onChange={e => setSolutionUrl(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-forge-500"
            placeholder="https://github.com/your-repo"
          />
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(`/attempts/${id}`)} className="border border-gray-600 hover:border-gray-400 px-6 py-2 rounded-lg transition">
            Back to Workspace
          </button>
          <button type="submit" disabled={submitting || !solution.trim()} className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 px-6 py-2 rounded-lg font-semibold transition">
            {submitting ? 'Submitting...' : 'Submit Final Solution'}
          </button>
        </div>
      </form>
    </div>
  )
}
