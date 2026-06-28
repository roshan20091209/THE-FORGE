import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [activeAttempts, setActiveAttempts] = useState([])
  const [credentials, setCredentials] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [schoolBoard, setSchoolBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.attempts.active().catch(() => ({ attempts: [] })),
      api.credentials.list().catch(() => ({ credentials: [] })),
      api.leaderboard.get({ limit: 10 }).catch(() => ({ leaderboard: [] })),
    ]).then(([att, cred, lb]) => {
      setActiveAttempts(att.attempts || [])
      setCredentials(cred.credentials)
      setLeaderboard(lb.leaderboard || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.school) {
      api.leaderboard.get({ school: user.school, limit: 10 })
        .then(d => setSchoolBoard(d.leaderboard || []))
        .catch(() => {})
    }
  }, [user?.school])

  const formatTime = (secs) => {
    if (!secs || secs <= 0) return 'Expired'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h ${m}m`
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-64" />
        <div className="h-4 bg-gray-800 rounded w-96" />
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  const stats = [
    { label: 'Streak', value: `${user?.streak || 0} days`, color: 'text-orange-400', icon: '🔥' },
    { label: 'Points', value: user?.total_points || 0, color: 'text-forge-400', icon: '⚡' },
    { label: 'Challenges Done', value: credentials.length, color: 'text-green-400', icon: '✅' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Hey {user?.full_name || user?.email?.split('@')[0]}!</h1>
          <p className="text-gray-400 mt-1">{user?.school ? `From ${user.school}` : 'Ready for today\'s challenge?'}</p>
        </div>
        <Link to="/simulations" className="bg-forge-600 hover:bg-forge-500 px-5 py-2.5 rounded-lg transition text-sm font-medium">
          + New Challenge
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span>{s.icon}</span>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
            <div className="text-gray-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2">
          {activeAttempts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Active Challenges</h2>
              <div className="space-y-3">
                {activeAttempts.map(a => (
                  <Link
                    key={a.id}
                    to={`/attempts/${a.id}`}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-forge-600 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${a.time_remaining_seconds > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <h3 className="font-semibold group-hover:text-forge-400 transition">{a.simulation_title || 'Challenge'}</h3>
                        <p className="text-sm text-gray-400">{a.industry || ''} · Attempt #{a.attempt_number || 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-green-400">{formatTime(a.time_remaining_seconds)}</span>
                      <span className="bg-forge-600 text-white text-sm px-4 py-1.5 rounded-lg">Resume</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Capability Profiles</h2>
            {credentials.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400 mb-2">No profiles yet</p>
                <p className="text-sm text-gray-500 mb-6">Complete a challenge to get your first capability profile.</p>
                <Link to="/simulations" className="text-forge-400 hover:underline font-medium">Browse Challenges →</Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {credentials.map(c => (
                  <Link key={c.id} to={`/c/${c.credential_slug || c.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{c.simulation_title}</h3>
                        <p className="text-sm text-gray-400">{c.industry}</p>
                      </div>
                      <span className="text-xs text-gray-500">{c.view_count || 0} views</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">🏆 Global Leaderboard</h3>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No participants yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${p.name === (user?.full_name || user?.email) ? 'bg-forge-600/10 border border-forge-600/30' : ''}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-forge-400 font-mono text-xs">{p.points} pts</span>
                    {p.streak > 0 && <span className="text-orange-400 text-xs">🔥{p.streak}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {schoolBoard.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">🏫 Your School</h3>
              <div className="space-y-2">
                {schoolBoard.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${p.name === (user?.full_name || user?.email) ? 'bg-forge-600/10 border border-forge-600/30' : ''}`}>
                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400 font-bold">{i + 1}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-forge-400 font-mono text-xs">{p.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
