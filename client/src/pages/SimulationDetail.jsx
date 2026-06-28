import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Brain, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'

const difficultyInfo = {
  beginner: { label: 'Easy', variant: 'beginner', time: '~15 min' },
  intermediate: { label: 'Medium', variant: 'intermediate', time: '~30 min' },
  advanced: { label: 'Hard', variant: 'advanced', time: '~1 hour' },
}

export default function SimulationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sim, setSim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    api.simulations.get(id)
      .then(data => setSim(data.simulation))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleStart = async () => {
    if (!user) return navigate('/login')
    setStarting(true)
    try {
      const data = await api.attempts.create(id)
      navigate(`/attempts/${data.attempt.id}`)
    } catch (err) {
      alert(err.message)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!sim) return (
    <div className="text-center py-20">
      <p className="text-forge-text-secondary mb-4">Challenge not found</p>
      <Link to="/simulations" className="text-forge-accent hover:underline">Browse challenges →</Link>
    </div>
  )

  const diff = difficultyInfo[sim.difficulty] || { label: sim.difficulty, variant: 'info', time: '' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/simulations')} className="btn-ghost text-sm mb-4 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card !p-6 md:!p-8"
      >
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge variant={diff.variant}>{diff.label}</Badge>
          <span className="text-xs text-forge-text-muted">{sim.industry}</span>
          <span className="text-xs text-forge-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" /> {diff.time}
          </span>
          <Badge variant="success">Unlimited retries</Badge>
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold mb-4">{sim.title}</h1>
        <p className="text-forge-text-secondary mb-6 whitespace-pre-wrap">{sim.description}</p>

        <div className="bg-white/[0.03] rounded-xl p-5 mb-4 border border-white/[0.06]">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-forge-accent" />
            Problem Brief
          </h2>
          <p className="text-forge-text-secondary whitespace-pre-wrap text-sm leading-relaxed">{sim.problem_brief}</p>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-5 mb-6 border border-white/[0.06]">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-forge-warning" />
            Why This Matters
          </h2>
          <p className="text-forge-text-secondary text-sm">
            {sim.industry === 'Technology' ? 'Tech companies care about how you debug and communicate under pressure. This challenge tests your ability to find root causes and explain them clearly — exactly what interns do in their first week.' :
             sim.industry === 'Data Engineering' ? 'Companies need people who can design systems. This challenge tests your architectural thinking, which is what separates great engineers from average ones.' :
             sim.industry === 'Healthcare' ? 'Healthcare systems save lives. This challenge tests your ability to design under constraints while keeping user safety first.' :
             sim.industry === 'Cybersecurity' ? 'Security breaches are every company\'s nightmare. This challenge tests how you respond when things go wrong — the most valuable skill in tech.' :
             'Real companies face problems like this every day. Your ability to think through them is what hiring managers actually want to see.'}
          </p>
        </div>

        <Button
          onClick={handleStart}
          variant="primary"
          className="w-full"
          size="lg"
          loading={starting}
          disabled={starting}
        >
          {user ? 'Start This Challenge' : 'Login to Start'}
        </Button>
      </motion.div>
    </div>
  )
}
