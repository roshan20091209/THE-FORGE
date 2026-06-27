import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function EmployerDashboard() {
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    api.employers.analytics()
      .then(data => setAnalytics(data.analytics))
      .catch(console.error)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Employer Dashboard</h1>
      <p className="text-gray-400 mb-8">Discover top talent. Create custom simulations.</p>

      {analytics && (
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Users', value: analytics.total_users, color: 'text-forge-400' },
            { label: 'Total Attempts', value: analytics.total_attempts, color: 'text-blue-400' },
            { label: 'Completed', value: analytics.completed_attempts, color: 'text-green-400' },
            { label: 'Employers', value: '1', color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {analytics?.avg_scores && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Average Dimension Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Wrong & Recovered', value: Math.round(analytics.avg_scores[0]), color: 'text-red-400' },
              { label: 'Pressure Comm', value: Math.round(analytics.avg_scores[1]), color: 'text-blue-400' },
              { label: 'Mid-Process Pivot', value: Math.round(analytics.avg_scores[2]), color: 'text-purple-400' },
              { label: 'Unblocking Agency', value: Math.round(analytics.avg_scores[3]), color: 'text-green-400' },
            ].map(d => (
              <div key={d.label} className="text-center p-3 bg-gray-950 rounded-lg">
                <div className={`text-2xl font-bold ${d.color}`}>{d.value}</div>
                <div className="text-xs text-gray-400">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/employer/candidates" className="bg-forge-600 hover:bg-forge-500 px-6 py-2 rounded-lg transition">Browse Candidates</Link>
        <Link to="/simulations" className="border border-gray-600 hover:border-gray-400 px-6 py-2 rounded-lg transition">View Simulations</Link>
      </div>
    </div>
  )
}
