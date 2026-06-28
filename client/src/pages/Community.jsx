import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, MessageSquare, Flame, Trophy, Zap, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'

export default function Community() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.leaderboard.activity()
      .then(d => setAttempts(d.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const activities = [
    ...attempts.map(a => ({
      type: 'challenge_started',
      user: a.user_name || 'Someone',
      time: new Date(a.created_at || Date.now()),
      message: `started working on "${a.simulation_title || 'a challenge'}"`,
    })),
  ].sort((a, b) => b.time - a.time)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-forge-accent" />
          <div>
            <h1 className="text-2xl font-bold">Community</h1>
            <p className="text-sm text-forge-text-secondary">See what others are building</p>
          </div>
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-forge-success" />
            What's Happening
          </h2>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-forge-text-muted mx-auto mb-3" />
              <p className="text-forge-text-secondary font-medium">No activity yet</p>
              <p className="text-sm text-forge-text-muted mt-1">
                Be the first to complete a challenge!
              </p>
              <Link to="/simulations" className="btn-primary inline-flex items-center gap-2 mt-4 text-xs">
                Start a Challenge <Zap className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forge-accent/20 to-forge-cyan/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">
                      {a.user?.[0]?.toUpperCase() || a.user?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{a.user_name || a.user}</span>
                      {' '}{a.message}
                    </p>
                    <p className="text-[10px] text-forge-text-muted mt-0.5">
                      {formatTimeAgo(a.time)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {a.type === 'challenge_started' && <Zap className="w-4 h-4 text-forge-cyan" />}
                    {a.type === 'completed' && <Trophy className="w-4 h-4 text-forge-warning" />}
                    {a.type === 'streak' && <Flame className="w-4 h-4 text-forge-warning" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* School Squad */}
      {user?.school && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-forge-cyan" />
              {user.school} Squad
            </h2>
            <p className="text-sm text-forge-text-secondary mb-4">
              Connect with classmates on The Forge
            </p>
            <div className="flex items-center gap-4 text-sm text-forge-text-muted">
              <span>{attempts.length} active students</span>
              <Link to="/leaderboard" className="text-forge-cyan hover:underline">View School Leaderboard →</Link>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Mentorship */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-forge-warning" />
            Find a Mentor
          </h2>
          <p className="text-sm text-forge-text-secondary mb-4">
            Get guidance from students who are 1-2 years ahead of you.
          </p>
          <button className="btn-secondary text-xs">
            Request Guidance
          </button>
        </Card>
      </motion.div>
    </div>
  )
}

function formatTimeAgo(date) {
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
