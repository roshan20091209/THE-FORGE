import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const difficultyColors = {
  beginner: 'bg-green-900/50 text-green-300 border-green-700',
  intermediate: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  advanced: 'bg-red-900/50 text-red-300 border-red-700',
}

export default function Simulations() {
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.simulations.list()
      .then(data => setSimulations(data.simulations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Simulation Catalog</h1>
      <p className="text-gray-400 mb-8">Choose a real-world problem. Prove your skills under pressure.</p>
      <div className="grid md:grid-cols-2 gap-6">
        {simulations.map(sim => (
          <Link key={sim.id} to={`/simulations/${sim.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition group">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold group-hover:text-forge-400 transition">{sim.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[sim.difficulty] || 'bg-gray-800 text-gray-300'}`}>
                {sim.difficulty}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{sim.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{sim.industry}</span>
              <span>{sim.duration_hours}h</span>
              {sim.creator_name && <span>by {sim.creator_name}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
