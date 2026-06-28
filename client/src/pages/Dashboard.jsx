import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Zap, CheckCircle, ArrowRight, TrendingUp, Clock, Users, Target } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import StreakCounter from '../components/ui/StreakCounter'
import Skeleton from '../components/ui/Skeleton'

const greetings = ['Good morning', 'Good afternoon', 'Good evening']
const getGreeting = () => {
  const h = new Date().getHours()
  return h < 12 ? greetings[0] : h < 17 ? greetings[1] : greetings[2]
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      setCredentials(cred.credentials || [])
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

  const yourRank = leaderboard.findIndex(p => p.name === (user?.full_name || user?.email))
  const topPct = leaderboard.length > 0 && yourRank >= 0
    ? Math.max(1, Math.round(((leaderboard.length - yourRank) / leaderboard.length) * 100))
    : null

  const todayChallenge = activeAttempts[0]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Greeting Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-forge-accent/5 via-transparent to-forge-cyan/5" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-forge-text-secondary mt-1">
              {user?.streak > 0 ? (
                <>Day {user.streak} streak. {topPct ? `You're in the top ${topPct}% of your school.` : 'Keep going!'}</>
              ) : (
                'Ready for today\'s challenge?'
              )}
            </p>
          </div>
          <StreakCounter streak={user?.streak || 0} size="lg" />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Flame, label: 'Streak', value: `${user?.streak || 0} days`, color: 'text-forge-warning', bg: 'bg-forge-warning/10' },
          { icon: Zap, label: 'Points', value: user?.total_points || 0, color: 'text-forge-accent', bg: 'bg-forge-accent/10' },
          { icon: CheckCircle, label: 'Done', value: credentials.length, color: 'text-forge-success', bg: 'bg-forge-success/10' },
        ].map(s => (
          <Card key={s.label} hover={false} className="!p-4 text-center">
            <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[10px] text-forge-text-secondary uppercase tracking-wider mt-0.5">{s.label}</div>
          </Card>
        ))}
      </motion.div>

      {/* Today's Challenge */}
      {todayChallenge ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card glow className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-forge-accent/10 to-transparent rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-forge-accent" />
                  <span className="text-sm font-semibold">Today's Challenge</span>
                </div>
                <Badge variant={todayChallenge.difficulty || 'info'}>
                  {todayChallenge.difficulty || 'In Progress'}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold mb-1">{todayChallenge.simulation_title || 'Active Challenge'}</h2>
              <p className="text-sm text-forge-text-secondary line-clamp-2 mb-4">{todayChallenge.industry}</p>
              <button
                onClick={() => navigate(`/attempts/${todayChallenge.id}`)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Resume <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-forge-accent/10 via-forge-cyan/5 to-transparent rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-forge-accent" />
                  <span className="text-sm font-semibold">Pick Today's Challenge</span>
                </div>
              </div>
              <p className="text-sm text-forge-text-secondary mb-4">No active challenges. Start one to keep your streak going!</p>
              <button
                onClick={() => navigate('/simulations')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Browse Challenges <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Capability Profiles */}
      {credentials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-3">Your Capability Profiles</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
            {credentials.slice(0, 5).map((c, i) => (
              <Link key={c.id} to={`/c/${c.credential_slug || c.id}`}>
                <Card hover={false} className="!p-4 w-44 flex-shrink-0">
                  <div className="text-2xl mb-2">
                    {['🔄', '💬', '🎯', '🚀', '📊'][i % 5]}
                  </div>
                  <h3 className="text-sm font-semibold truncate">{c.simulation_title || 'Challenge'}</h3>
                  <p className="text-xs text-forge-text-muted mt-1">{c.industry}</p>
                  <div className="mt-2 text-[10px] text-forge-accent">View Profile →</div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard Peek */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-forge-warning" />
                Global Top
              </h3>
              <Link to="/leaderboard" className="text-xs text-forge-accent hover:underline">See all →</Link>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-forge-text-muted text-center py-4">No participants yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${
                    p.name === (user?.full_name || user?.email) ? 'bg-forge-accent/10 border border-forge-accent/20' : ''
                  }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                      i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                      i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                      'bg-white/5 text-forge-text-muted'
                    }`}>{i + 1}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-forge-accent font-mono text-xs">{p.points} pts</span>
                    {p.streak > 0 && <Flame className="w-3 h-3 text-forge-warning" />}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {schoolBoard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-forge-cyan" />
                  {user?.school?.split(' ')[0] || 'School'}
                </h3>
              </div>
              <div className="space-y-2">
                {schoolBoard.slice(0, 5).map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${
                    p.name === (user?.full_name || user?.email) ? 'bg-forge-cyan/10 border border-forge-cyan/20' : ''
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-forge-text-muted font-bold">{i + 1}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-forge-cyan font-mono text-xs">{p.points} pts</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Community Pulse */}
      {schoolBoard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-forge-success" />
              Your School
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-forge-text-muted">
                {schoolBoard.length} students from your school are on the leaderboard. 
                {user?.streak > 0 ? ` You're on a ${user.streak}-day streak!` : ' Start a challenge to join them!'}
              </p>
              <Link to="/leaderboard" className="text-xs text-forge-accent hover:underline">
                View full leaderboard →
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
