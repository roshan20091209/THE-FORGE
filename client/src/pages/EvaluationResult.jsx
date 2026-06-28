import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import RadarChart from '../components/RadarChart'

export default function EvaluationResult() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvaluation()
  }, [id])

  const loadEvaluation = async () => {
    setLoading(true)
    try {
      const result = await api.attempts.getEvaluation(id)
      if (result.status === 'completed') setData(result)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (loading) return <div className="text-center py-20">Loading evaluation...</div>
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">Evaluation not yet completed.</p>
      <button onClick={loadEvaluation} className="bg-forge-600 hover:bg-forge-500 px-6 py-2 rounded-lg transition">Refresh</button>
    </div>
  )

  const { scores, evaluation: evalResult } = data
  const overall = evalResult?.overall

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Capability Profile</h1>
            <p className="text-gray-400">Here's how you performed across the 4 dimensions.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleShare} className="border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded text-sm transition">
              Share
            </button>
          </div>
        </div>

        {overall && (
          <div className="bg-gray-950 border-l-4 border-forge-500 rounded-lg p-4 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">{overall.summary}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div>
            <RadarChart scores={scores} size={280} />
          </div>
          <div className="space-y-4">
            {[
              { key: 'wrong_and_recovered', label: 'Wrong & Recovered', color: 'bg-gradient-to-r from-red-500 to-orange-500', icon: '🔄', desc: 'How you handle being wrong' },
              { key: 'pressure_communication', label: 'Pressure Communication', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: '💬', desc: 'How you communicate under pressure' },
              { key: 'mid_process_pivot', label: 'Mid-Process Pivot', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '🎯', desc: 'How you adapt to change' },
              { key: 'unblocking_agency', label: 'Unblocking Agency', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: '🚀', desc: 'How you figure things out' },
            ].map(d => {
              const s = scores?.[d.key]
              const score = typeof s === 'object' ? s.score : (s || 50)
              return (
                <div key={d.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{d.icon} {d.label}</span>
                    <span className="font-bold">{score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {overall?.strengths && overall.strengths.length > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm text-green-400 mb-2">Your Strengths</h3>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              {overall.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {overall?.areas_to_improve && overall.areas_to_improve.length > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm text-yellow-400 mb-2">Areas to Improve</h3>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              {overall.areas_to_improve.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {overall?.next_steps && overall.next_steps.length > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm text-forge-400 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
              {overall.next_steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}

        {evalResult && ['wrong_and_recovered', 'pressure_communication', 'mid_process_pivot', 'unblocking_agency'].map(key => {
          const d = evalResult[key]
          if (!d) return null
          return (
            <div key={key} className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-gray-300">{key.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="text-forge-400 font-bold text-sm ml-auto">{d.score}/100</span>
              </div>
              <p className="text-sm text-gray-400 mb-1">{d.evidence}</p>
              {d.strength && <p className="text-xs text-green-400">✅ {d.strength}</p>}
              {d.growth_area && <p className="text-xs text-yellow-400">📈 {d.growth_area}</p>}
            </div>
          )
        })}

        <div className="flex gap-4 mt-8">
          <Link to="/dashboard" className="border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg text-sm transition">Dashboard</Link>
          <Link to="/simulations" className="text-forge-400 hover:underline text-sm self-center">Try Another Challenge →</Link>
        </div>
      </div>
    </div>
  )
}
