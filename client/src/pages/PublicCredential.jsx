import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Share2, Verified, Eye } from 'lucide-react'
import { api } from '../api'
import RadarChart from '../components/RadarChart'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-forge-text-secondary mb-4">Credential not found</p>
      <Link to="/" className="text-forge-accent hover:underline">Go Home</Link>
    </div>
  )

  const { credential, user, simulation, scores } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card !p-6 md:!p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-forge-accent to-forge-cyan flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-glow"
          >
            {user?.full_name?.[0] || '?'}
          </motion.div>
          <h1 className="text-xl font-display font-bold">{user?.full_name || 'Anonymous'}</h1>
          <p className="text-forge-text-secondary mt-1">
            Completed <span className="text-forge-text font-medium">{simulation?.title}</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {simulation?.industry && <Badge variant="info">{simulation.industry}</Badge>}
            {simulation?.difficulty && <Badge variant={simulation.difficulty}>{simulation.difficulty}</Badge>}
          </div>
        </div>

        {scores && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <RadarChart scores={scores} size={280} />
            </motion.div>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-md mx-auto">
              {[
                { label: 'Wrong & Recovered', score: scores.wrong_and_recovered, color: 'border-red-500/30' },
                { label: 'Pressure Comm.', score: scores.pressure_communication, color: 'border-blue-500/30' },
                { label: 'Mid-Process Pivot', score: scores.mid_process_pivot, color: 'border-purple-500/30' },
                { label: 'Unblocking Agency', score: scores.unblocking_agency, color: 'border-green-500/30' },
              ].map((d, i) => {
                const val = typeof d.score === 'object' ? d.score.score : (d.score || 0)
                return (
                  <motion.div
                    key={d.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`bg-white/[0.03] border ${d.color} rounded-xl p-3 text-center`}
                  >
                    <div className="text-2xl font-bold font-mono">{val}</div>
                    <div className="text-[10px] text-forge-text-muted mt-0.5">{d.label}</div>
                  </motion.div>
                )
              })}
            </div>
            {scores.overall_percentile && (
              <p className="text-center mt-6">
                <span className="text-forge-accent font-bold">Top {scores.overall_percentile}%</span>
                <span className="text-forge-text-muted"> of all participants</span>
              </p>
            )}
          </>
        )}

        <div className="border-t border-white/[0.06] mt-8 pt-6">
          <div className="flex justify-center gap-6 mb-4">
            <button onClick={handleShare} className="btn-secondary text-xs flex items-center gap-1">
              <Share2 className="w-3 h-3" /> Share
            </button>
          </div>
          <div className="text-center">
            <p className="text-xs text-forge-text-muted flex items-center justify-center gap-1 mb-1">
              <Verified className="w-3 h-3 text-forge-accent" />
              Verified by The Forge
            </p>
            <p className="text-[10px] text-forge-text-muted">
              AI-evaluated simulation · Capability profile
            </p>
            <p className="text-[10px] text-forge-text-muted mt-1 flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" /> {credential?.view_count || 0} views
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
