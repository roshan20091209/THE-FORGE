import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const difficultyInfo = {
  beginner: { label: 'Easy', color: 'bg-green-600', time: '~15 min' },
  intermediate: { label: 'Medium', color: 'bg-yellow-600', time: '~30 min' },
  advanced: { label: 'Hard', color: 'bg-red-600', time: '~1 hour' },
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

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!sim) return <div className="text-center py-20">Challenge not found</div>

  const diff = difficultyInfo[sim.difficulty] || { label: sim.difficulty, color: 'bg-gray-600', time: '' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full text-white ${diff.color}`}>{diff.label}</span>
          <span className="text-xs text-gray-500">{sim.industry}</span>
          <span className="text-xs text-gray-500">{diff.time}</span>
          <span className="text-xs text-green-500">Unlimited retries</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{sim.title}</h1>
        <p className="text-gray-300 mb-8 whitespace-pre-wrap">{sim.description}</p>

        <div className="bg-gray-950 rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Problem Brief</h2>
          <p className="text-gray-400 whitespace-pre-wrap text-sm">{sim.problem_brief}</p>
        </div>

        <div className="bg-gray-950 rounded-lg p-6 mb-8 border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Why This Matters</h2>
          <p className="text-gray-400 text-sm">
            {sim.industry === 'Technology' ? 'Tech companies care about how you debug and communicate under pressure. This challenge tests your ability to find root causes and explain them clearly — exactly what interns do in their first week.' :
             sim.industry === 'Data Engineering' ? 'Companies need people who can design systems. This challenge tests your architectural thinking, which is what separates great engineers from average ones.' :
             sim.industry === 'Healthcare' ? 'Healthcare systems save lives. This challenge tests your ability to design under constraints while keeping user safety first.' :
             sim.industry === 'Cybersecurity' ? 'Security breaches are every company\'s nightmare. This challenge tests how you respond when things go wrong — the most valuable skill in tech.' :
             'Real companies face problems like this every day. Your ability to think through them is what hiring managers actually want to see.'}
          </p>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-6 py-3 rounded-lg text-lg font-semibold transition"
        >
          {starting ? 'Starting...' : user ? 'Start This Challenge' : 'Login to Start'}
        </button>
      </div>
    </div>
  )
}
