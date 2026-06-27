import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function SimulationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sim, setSim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [activeAttempt, setActiveAttempt] = useState(null)

  useEffect(() => {
    api.simulations.get(id)
      .then(data => setSim(data.simulation))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) return
    api.attempts.active()
      .then(data => {
        const found = (data.attempts || []).find(a => a.simulation_id === id)
        setActiveAttempt(found || null)
      })
      .catch(() => {})
  }, [id, user])

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
  if (!sim) return <div className="text-center py-20">Simulation not found</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs px-2 py-0.5 rounded border bg-gray-800 text-gray-300">{sim.difficulty}</span>
          <span className="text-xs text-gray-500">{sim.industry}</span>
          <span className="text-xs text-gray-500">{sim.duration_hours}h</span>
        </div>
        <h1 className="text-3xl font-bold mb-6">{sim.title}</h1>
        <p className="text-gray-300 mb-8 whitespace-pre-wrap">{sim.description}</p>

        <div className="bg-gray-950 rounded-lg p-6 mb-8 border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Problem Brief</h2>
          <p className="text-gray-400 whitespace-pre-wrap text-sm">{sim.problem_brief}</p>
        </div>

        {activeAttempt ? (
          <button
            onClick={() => navigate(`/attempts/${activeAttempt.id}`)}
            className="w-full bg-green-700 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold transition"
          >
            Resume Simulation
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-6 py-3 rounded-lg text-lg font-semibold transition"
          >
            {starting ? 'Starting...' : 'Start This Simulation'}
          </button>
        )}
      </div>
    </div>
  )
}
