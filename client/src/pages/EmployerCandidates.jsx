import { useState } from 'react'
import { api } from '../api'
import RadarChart from '../components/RadarChart'

export default function EmployerCandidates() {
  const [candidates, setCandidates] = useState([])
  const [searching, setSearching] = useState(false)
  const [filters, setFilters] = useState({ industry: '', min_score: '' })

  const handleSearch = async () => {
    setSearching(true)
    try {
      const params = {}
      if (filters.industry) params.industry = filters.industry
      if (filters.min_score) params.min_score = filters.min_score
      const data = await api.employers.candidates(params)
      setCandidates(data.candidates)
    } catch (err) {
      console.error(err)
    }
    setSearching(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Candidate Browser</h1>
      <p className="text-gray-400 mb-8">Find top performers by dimension scores, industry, and problem type.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Industry</label>
            <select value={filters.industry} onChange={e => setFilters(prev => ({ ...prev, industry: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-500">
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Data Engineering">Data Engineering</option>
              <option value="Product Management">Product Management</option>
              <option value="AI/ML">AI/ML</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Score</label>
            <input type="number" min={0} max={100} value={filters.min_score} onChange={e => setFilters(prev => ({ ...prev, min_score: e.target.value }))} className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-500" />
          </div>
          <button onClick={handleSearch} disabled={searching} className="bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm transition">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No candidates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {candidates.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-forge-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {c.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{c.full_name || 'Anonymous'}</h3>
                  <p className="text-sm text-gray-400">{c.simulation_title}</p>
                  <p className="text-xs text-gray-500">{c.industry}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="text-xs"><span className="text-red-400 font-bold">{c.wrong_and_recovered_score}</span> WR</div>
                    <div className="text-xs"><span className="text-blue-400 font-bold">{c.pressure_communication_score}</span> PC</div>
                    <div className="text-xs"><span className="text-purple-400 font-bold">{c.mid_process_pivot_score}</span> MP</div>
                    <div className="text-xs"><span className="text-green-400 font-bold">{c.unblocking_agency_score}</span> UA</div>
                  </div>
                  {c.overall_percentile && (
                    <p className="text-xs text-forge-400 mt-2">Top {c.overall_percentile}%</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
