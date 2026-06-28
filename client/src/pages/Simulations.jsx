import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const difficultyColors = {
  beginner: 'bg-green-900/50 text-green-300 border-green-700',
  intermediate: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  advanced: 'bg-red-900/50 text-red-300 border-red-700',
}

const difficultyLabels = {
  beginner: 'Easy - 15 min',
  intermediate: 'Medium - 30 min',
  advanced: 'Hard - 1 hour',
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

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Challenge Catalog</h1>
      <p className="text-gray-400 mb-6">Real company problems. Pick your level and start proving yourself.</p>

      <div className="flex gap-2 mb-8">
        {['all', 'beginner', 'intermediate', 'advanced'].map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`px-4 py-1.5 rounded-lg text-sm transition ${
              filter === d
                ? 'bg-forge-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No challenges found at this level.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map(sim => (
            <Link key={sim.id} to={`/simulations/${sim.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition group">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold group-hover:text-forge-400 transition">{sim.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[sim.difficulty] || 'bg-gray-800 text-gray-300'}`}>
                  {difficultyLabels[sim.difficulty] || sim.difficulty}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{sim.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{sim.industry}</span>
                <span>Unlimited retries</span>
                <span>AI tutor available</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-2">Why 3 levels?</p>
        <p className="text-gray-500 text-xs">
          Start at Easy to build confidence. Medium challenges you. Hard proves you are ready for real internships. 
          You can retry any challenge unlimited times — growth matters more than perfection.
        </p>
      </div>
    </div>
  )
}
