import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import RadarChart from '../components/RadarChart'

export default function Credential() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.credentials.get(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleGenerateCredential = async () => {
    setCreating(true)
    try {
      const result = await api.credentials.create(id)
      setData(prev => ({ ...prev, credential: { ...prev.credential, slug: result.credential.slug }, summary: result.credential.summary }))
    } catch (err) {
      alert(err.message)
    }
    setCreating(false)
  }

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!data) return <div className="text-center py-20">Credential not found</div>

  const { credential, user, simulation, scores, summary } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Credential</h1>
            <p className="text-gray-400">{simulation?.title}</p>
          </div>
          {credential?.slug && (
            <a href={`/c/${credential.slug}`} target="_blank" className="text-forge-400 hover:underline text-sm">
              Public Link →
            </a>
          )}
        </div>

        {scores ? (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <RadarChart scores={scores} />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Wrong & Recovered', score: scores.wrong_and_recovered, color: 'bg-gradient-to-r from-red-500 to-orange-500' },
                  { label: 'Pressure Communication', score: scores.pressure_communication, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
                  { label: 'Mid-Process Pivot', score: scores.mid_process_pivot, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                  { label: 'Unblocking Agency', score: scores.unblocking_agency, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{d.label}</span>
                      <span className="font-bold">{d.score}/100</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                    </div>
                  </div>
                ))}
                {scores.overall_percentile && (
                  <div className="pt-2">
                    <span className="text-lg font-bold text-forge-400">Top {scores.overall_percentile}%</span>
                    <span className="text-gray-500 text-sm ml-2">overall</span>
                  </div>
                )}
              </div>
            </div>

            {summary && (
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Executive Summary</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            {scores.notes && (
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Evaluation Notes</h3>
                <pre className="text-gray-400 text-sm whitespace-pre-wrap">{scores.notes}</pre>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Scores not yet available. Generate your credential to receive an AI evaluation.</p>
            <button onClick={handleGenerateCredential} disabled={creating} className="bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-6 py-2 rounded-lg transition">
              {creating ? 'Generating...' : 'Generate Credential'}
            </button>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Link to="/dashboard" className="border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg text-sm transition">Dashboard</Link>
          <Link to="/simulations" className="text-forge-400 hover:underline text-sm self-center">Try Another Simulation →</Link>
        </div>
      </div>
    </div>
  )
}
