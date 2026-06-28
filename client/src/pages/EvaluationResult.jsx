import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, RefreshCw, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { api } from '../api'
import RadarChart from '../components/RadarChart'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'

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

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-forge-text-secondary mb-4">Evaluation not yet completed.</p>
      <Button variant="primary" onClick={loadEvaluation} icon={<RefreshCw className="w-4 h-4" />}>
        Refresh
      </Button>
    </div>
  )

  const { scores, evaluation: evalResult } = data
  const overall = evalResult?.overall

  const dimensions = [
    { key: 'wrong_and_recovered', label: 'Wrong & Recovered', color: 'bg-gradient-to-r from-red-500 to-orange-500', icon: '🔄', desc: 'How you handle being wrong' },
    { key: 'pressure_communication', label: 'Pressure Communication', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: '💬', desc: 'How you communicate under pressure' },
    { key: 'mid_process_pivot', label: 'Mid-Process Pivot', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '🎯', desc: 'How you adapt to change' },
    { key: 'unblocking_agency', label: 'Unblocking Agency', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: '🚀', desc: 'How you figure things out' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/dashboard" className="btn-ghost text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card !p-6 md:!p-8"
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Your Capability Profile</h1>
            <p className="text-forge-text-secondary text-sm">Here's how you performed across the 4 dimensions.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
            Share
          </Button>
        </div>

        {overall?.summary && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border-l-2 border-forge-accent rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-forge-text-secondary leading-relaxed">{overall.summary}</p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RadarChart scores={scores} size={280} />
          </motion.div>
          <div className="space-y-4">
            {dimensions.map((d, i) => {
              const s = scores?.[d.key]
              const score = typeof s === 'object' ? s.score : (s || 50)
              return (
                <motion.div
                  key={d.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-forge-text-secondary">{d.icon} {d.label}</span>
                    <span className="font-bold font-mono">{score}<span className="text-forge-text-muted text-xs">/100</span></span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${d.color}`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {overall?.strengths && overall.strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-forge-success/5 border border-forge-success/20 rounded-xl p-5 mb-4"
          >
            <h3 className="font-semibold text-sm text-forge-success flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" /> Your Strengths
            </h3>
            <ul className="space-y-2">
              {overall.strengths.map((s, i) => (
                <li key={i} className="text-sm text-forge-text-secondary flex items-start gap-2">
                  <span className="text-forge-success mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {overall?.areas_to_improve && overall.areas_to_improve.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-forge-warning/5 border border-forge-warning/20 rounded-xl p-5 mb-4"
          >
            <h3 className="font-semibold text-sm text-forge-warning flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> Areas to Improve
            </h3>
            <ul className="space-y-2">
              {overall.areas_to_improve.map((s, i) => (
                <li key={i} className="text-sm text-forge-text-secondary flex items-start gap-2">
                  <span className="text-forge-warning mt-0.5">!</span>
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {overall?.next_steps && overall.next_steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-forge-accent/5 border border-forge-accent/20 rounded-xl p-5 mb-6"
          >
            <h3 className="font-semibold text-sm text-forge-accent flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" /> Next Steps
            </h3>
            <ol className="space-y-2">
              {overall.next_steps.map((s, i) => (
                <li key={i} className="text-sm text-forge-text-secondary flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-forge-accent/20 text-forge-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </motion.div>
        )}

        <div className="flex gap-4 mt-8">
          <Link to="/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
          <Link to="/simulations">
            <Button variant="ghost">Try Another Challenge →</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
