import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [activeAttempts, setActiveAttempts] = useState([])
  const [credentials, setCredentials] = useState([])

  useEffect(() => {
    Promise.all([
      api.attempts.active().catch(() => ({ attempts: [] })),
      api.credentials.list().catch(() => ({ credentials: [] }))
    ]).then(([att, cred]) => {
      setActiveAttempts(att.attempts || [])
      setCredentials(cred.credentials)
    })
  }, [])

  const formatTime = (secs) => {
    if (!secs || secs <= 0) return 'Expired'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name || user?.email}</h1>
      <p className="text-gray-400 mb-8">Track your simulations and credentials.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Active Attempts', value: activeAttempts.length, color: 'text-forge-400' },
          { label: 'Credentials Earned', value: credentials.length, color: 'text-green-400' },
          { label: 'Peer Reviews', value: '0', color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {activeAttempts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Active Simulations</h2>
          <div className="space-y-3">
            {activeAttempts.map(a => (
              <Link
                key={a.id}
                to={`/attempts/${a.id}`}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-forge-600 transition group"
              >
                <div>
                  <h3 className="font-semibold group-hover:text-forge-400 transition">{a.simulation_title || 'Simulation'}</h3>
                  <p className="text-sm text-gray-400">{a.industry || ''} {a.difficulty ? `· ${a.difficulty}` : ''}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-mono ${parseInt(formatTime(a.time_remaining_seconds)) < 1 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatTime(a.time_remaining_seconds)}
                  </span>
                  <span className="bg-forge-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-forge-500 transition">Resume</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Your Credentials</h2>
        {credentials.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">No credentials yet. Complete a simulation to earn one.</p>
            <Link to="/simulations" className="text-forge-400 hover:underline">Browse Simulations →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {credentials.map(c => (
              <Link key={c.id} to={`/credentials/${c.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{c.simulation_title}</h3>
                    <p className="text-sm text-gray-400">{c.industry}</p>
                  </div>
                  <span className="text-xs text-gray-500">{c.view_count} views</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/simulations" className="bg-forge-600 hover:bg-forge-500 px-4 py-2 rounded-lg transition">Start New Simulation</Link>
        <Link to="/reviews/pending" className="border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition">Peer Reviews</Link>
      </div>
    </div>
  )
}
