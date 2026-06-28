import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Brain, BarChart3, Target } from 'lucide-react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'

const difficultyLabels = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Hard',
}

export default function Simulations() {
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.simulations.list()
      .then(data => setSimulations(data.simulations || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? simulations : simulations.filter(s => s.difficulty === filter)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-72" />
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-display font-bold">Challenge Catalog</h1>
          <Target className="w-6 h-6 text-forge-accent" />
        </div>
        <p className="text-forge-text-secondary text-sm mb-6">
          Real company problems. Pick your level and start proving yourself.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {['all', 'beginner', 'intermediate', 'advanced'].map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`px-4 py-1.5 rounded-pill text-sm font-medium transition ${
              filter === d
                ? 'bg-forge-accent text-white'
                : 'bg-white/[0.04] text-forge-text-secondary hover:bg-white/[0.08] hover:text-forge-text'
            }`}
          >
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Brain className="w-12 h-12 text-forge-text-muted mx-auto mb-4" />
          <p className="text-forge-text-secondary">No challenges found at this level.</p>
          <button onClick={() => setFilter('all')} className="btn-ghost text-sm mt-2">
            Show all levels
          </button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((sim, i) => (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/simulations/${sim.id}`}>
                <Card className="h-full group">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-semibold group-hover:text-forge-accent transition-colors">{sim.title}</h2>
                    <Badge variant={sim.difficulty}>
                      {difficultyLabels[sim.difficulty] || sim.difficulty}
                    </Badge>
                  </div>
                  <p className="text-forge-text-secondary text-sm mb-4 line-clamp-2">{sim.description}</p>
                  <div className="flex items-center gap-4 text-xs text-forge-text-muted">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {sim.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Unlimited retries
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      AI tutor
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 card !p-6 text-center"
      >
        <p className="text-forge-text-secondary text-sm mb-2 font-medium">Why 3 levels?</p>
        <p className="text-forge-text-muted text-xs">
          Easy challenges build confidence. Medium challenges test your skills. Hard challenges prove you're ready for real internships.
          You can retry any challenge unlimited times — growth matters more than perfection.
        </p>
      </motion.div>
    </div>
  )
}
