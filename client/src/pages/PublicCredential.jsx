import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import RadarChart from '../components/RadarChart'

export default function PublicCredential() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.credentials.get(slug)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!data) return <div className="text-center py-20">Credential not found</div>

  const { credential, user, simulation, scores } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forge-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            {user?.full_name?.[0] || '?'}
          </div>
          <h1 className="text-2xl font-bold">{user?.full_name || 'Anonymous'}</h1>
          <p className="text-gray-400">Completed <span className="text-white">{simulation?.title}</span></p>
          <p className="text-sm text-gray-500">{simulation?.industry} • {simulation?.difficulty}</p>
        </div>

        {scores && (
          <>
            <RadarChart scores={scores} size={280} />
            <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
              {[
                { label: 'Wrong & Recovered', score: scores.wrong_and_recovered, color: 'border-red-500' },
                { label: 'Pressure Comm', score: scores.pressure_communication, color: 'border-blue-500' },
                { label: 'Mid-Process Pivot', score: scores.mid_process_pivot, color: 'border-purple-500' },
                { label: 'Unblocking Agency', score: scores.unblocking_agency, color: 'border-green-500' },
              ].map(d => (
                <div key={d.label} className={`bg-gray-950 border ${d.color} rounded-lg p-3 text-center`}>
                  <div className="text-2xl font-bold">{d.score}</div>
                  <div className="text-xs text-gray-400">{d.label}</div>
                </div>
              ))}
            </div>
            {scores.overall_percentile && (
              <p className="text-center mt-6 text-lg">
                <span className="text-forge-400 font-bold">Top {scores.overall_percentile}%</span>
                <span className="text-gray-500"> of all participants</span>
              </p>
            )}
          </>
        )}

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Verified by The Forge</p>
          <p className="text-xs text-gray-600">This credential was generated through an AI-evaluated, time-pressured simulation.</p>
          <p className="text-xs text-gray-600">{credential?.view_count || 0} views</p>
        </div>
      </div>
    </div>
  )
}
