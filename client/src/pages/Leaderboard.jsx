import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Medal, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'

export default function Leaderboard() {
  const { user } = useAuth()
  const [scope, setScope] = useState('global')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = scope === 'school' && user?.school
      ? { school: user.school, limit: 50 }
      : { limit: 50 }
    api.leaderboard.get(params)
      .then(d => setData(d.leaderboard || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [scope, user?.school])

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)
  const yourIndex = data.findIndex(p => p.name === (user?.full_name || user?.email))

  const podiumColors = [
    { bg: 'from-yellow-400 to-yellow-600', shadow: 'shadow-glow-amber', icon: '👑' },
    { bg: 'from-gray-300 to-gray-500', shadow: '', icon: '🥈' },
    { bg: 'from-amber-600 to-amber-800', shadow: '', icon: '🥉' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-forge-text-secondary mt-1">See where you stand</p>
          </div>
          <Trophy className="w-8 h-8 text-forge-warning" />
        </div>

        {/* Scope Switcher */}
        <div className="flex gap-2 mb-6 bg-forge-surface rounded-pill p-1 w-fit border border-white/[0.06]">
          {[
            { key: 'global', label: 'Global' },
            { key: 'school', label: user?.school?.split(' ')[0] || 'School', disabled: !user?.school },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              disabled={s.disabled}
              className={`px-4 py-1.5 rounded-pill text-sm font-medium transition ${
                scope === s.key
                  ? 'bg-forge-accent text-white'
                  : s.disabled
                    ? 'text-forge-text-muted opacity-50 cursor-not-allowed'
                    : 'text-forge-text-secondary hover:text-forge-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="!p-12 text-center">
          <Trophy className="w-12 h-12 text-forge-text-muted mx-auto mb-4" />
          <p className="text-forge-text-secondary font-medium">No participants yet</p>
          <p className="text-sm text-forge-text-muted mt-1">Complete a challenge to get on the board!</p>
        </Card>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && scope === 'global' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-3 mb-8"
            >
              {[1, 0, 2].map(idx => {
                const p = top3[idx]
                if (!p) return null
                const isFirst = idx === 0
                const isSecond = idx === 1
                const height = isFirst ? 'h-32' : isSecond ? 'h-24' : 'h-20'
                const color = podiumColors[idx]
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-lg ${color.shadow}`}>
                      {color.icon}
                    </div>
                    <div className={`card !p-3 text-center w-24 ${isFirst ? 'shadow-elevated' : ''}`}>
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-lg font-bold text-forge-accent">{p.points}</p>
                      {p.streak > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-forge-warning">
                          <Flame className="w-3 h-3" /> {p.streak}
                        </div>
                      )}
                    </div>
                    <div className={`w-16 ${height} rounded-t-lg bg-gradient-to-t ${color.bg} opacity-30`} />
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* Your Rank */}
          {yourIndex >= 0 && scope === 'global' && (
            <Card className="!p-4 mb-4 border-forge-accent/30 bg-forge-accent/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-forge-accent/20 flex items-center justify-center text-sm font-bold text-forge-accent">
                    #{yourIndex + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{user?.full_name || user?.email}</p>
                    <p className="text-[10px] text-forge-text-muted">You</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-forge-accent">{data[yourIndex]?.points || 0}</p>
                  <p className="text-[10px] text-forge-text-muted">points</p>
                </div>
              </div>
            </Card>
          )}

          {/* Rank List */}
          <div className="space-y-2">
            {rest.map((p, i) => {
              const rank = i + 4
              const isYou = p.name === (user?.full_name || user?.email)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`card !p-3 flex items-center justify-between ${
                    isYou ? 'border-forge-accent/30 bg-forge-accent/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      rank <= 10 ? 'bg-forge-accent/20 text-forge-accent' : 'text-forge-text-muted'
                    }`}>
                      {rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-forge-text-muted">
                        {p.school && <span>{p.school}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.streak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-forge-warning">
                        <Flame className="w-3 h-3" />{p.streak}
                      </span>
                    )}
                    <span className="text-sm font-bold text-forge-accent font-mono">{p.points}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
