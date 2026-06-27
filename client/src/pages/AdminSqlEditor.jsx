import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const PREDEFINED = [
  { label: 'All Users', sql: 'SELECT * FROM users ORDER BY created_at DESC' },
  { label: 'All Simulations', sql: 'SELECT * FROM simulations ORDER BY created_at DESC' },
  { label: 'Recent Attempts', sql: 'SELECT * FROM simulation_attempts ORDER BY started_at DESC' },
  { label: 'Dimension Scores', sql: 'SELECT * FROM dimension_scores ORDER BY created_at DESC' },
  { label: 'Credentials', sql: 'SELECT * FROM credentials ORDER BY created_at DESC' },
  { label: 'Peer Reviews', sql: 'SELECT * FROM peer_reviews ORDER BY created_at DESC' },
]

export default function AdminSqlEditor() {
  const { user } = useAuth()
  const [sql, setSql] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  if (user?.role !== 'admin') {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4">Access denied — admin only</div></div>
  }

  const handleRun = async () => {
    setError('')
    setResult(null)
    if (!sql.trim()) return
    setLoading(true)
    try { setResult(await api.admin.sql(sql)) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun() }
  }

  const copyResults = () => {
    if (!result) return
    const text = result.rows.map(r => result.columns.map(c => r[c]).join('\t')).join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin SQL Editor</h1>
          <p className="text-gray-400 text-sm mt-1">SELECT queries only via Supabase REST API. Use Supabase Dashboard for DDL/DML.</p>
        </div>
        {result && (
          <button onClick={copyResults} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-sm transition">Copy Results</button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={async () => { setSeeding(true); setSeedMsg(''); try { const r = await api.admin.seed(); setSeedMsg(r.message); } catch (e) { setSeedMsg('Error: ' + e.message); } setSeeding(false); }} disabled={seeding} className="bg-green-700 hover:bg-green-600 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-semibold transition">
          {seeding ? 'Seeding...' : 'Seed Demo Data'}
        </button>
        {seedMsg && <span className="text-sm text-green-400">{seedMsg}</span>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PREDEFINED.map(p => (
          <button key={p.label} onClick={() => setSql(p.sql)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-xs font-mono transition">{p.label}</button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-1">
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM users LIMIT 10"
          rows={8}
          className="w-full bg-transparent border-0 font-mono text-sm p-3 focus:outline-none resize-y"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={handleRun} disabled={loading || !sql.trim()} className="bg-forge-600 hover:bg-forge-500 disabled:opacity-50 px-5 py-2 rounded-lg font-semibold transition">
          {loading ? 'Running...' : 'Run (Ctrl+Enter)'}
        </button>
        {result && <span className="text-sm text-gray-400">{result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned</span>}
      </div>

      {error && (
        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap">{error}</div>
      )}

      {result && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800">
                {result.columns.map(col => (
                  <th key={col} className="px-4 py-2 text-left font-semibold text-gray-300 border-b border-gray-700 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
                  {result.columns.map(col => (
                    <td key={col} className="px-4 py-2 border-b border-gray-800 font-mono text-xs whitespace-nowrap">{String(row[col] ?? 'NULL')}</td>
                  ))}
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr><td colSpan={result.columns.length} className="px-4 py-8 text-center text-gray-500">No rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
