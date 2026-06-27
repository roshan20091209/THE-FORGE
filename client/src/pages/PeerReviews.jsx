import { useState, useEffect } from 'react'
import { api } from '../api'

export default function PeerReviews() {
  const [pending, setPending] = useState([])
  const [selected, setSelected] = useState(null)
  const [ratings, setRatings] = useState({ wrong_and_recovered: 3, pressure_communication: 3, mid_process_pivot: 3, unblocking_agency: 3 })
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.reviews.pending()
      .then(data => setPending(data.pending))
      .catch(console.error)
  }, [])

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await api.reviews.submit({
        attempt_id: selected.attempt_id,
        ...ratings,
        review_text: reviewText
      })
      setSubmitted(true)
      setPending(prev => prev.filter(p => p.attempt_id !== selected.attempt_id))
      setSelected(null)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      alert(err.message)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-xl font-bold">Review Submitted!</h2>
      <p className="text-gray-400">Thank you for contributing to the community.</p>
    </div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Peer Reviews</h1>
      <p className="text-gray-400 mb-8">Review 2 submissions to unlock your own scores.</p>

      {pending.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No pending reviews. Check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {pending.map(p => (
            <button key={p.attempt_id} onClick={() => setSelected(p)} className={`bg-gray-900 border ${selected?.attempt_id === p.attempt_id ? 'border-forge-500' : 'border-gray-800'} rounded-xl p-4 text-left hover:border-gray-600 transition`}>
              <h3 className="font-semibold">{p.simulation_title}</h3>
              <p className="text-sm text-gray-400">by {p.participant_name}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Review: {selected.simulation_title}</h2>
          <p className="text-sm text-gray-400 mb-6">Participant: {selected.participant_name}</p>

          <div className="space-y-4 mb-6">
            {[
              { key: 'wrong_and_recovered', label: 'Wrong & Recovered', desc: 'How well did they pivot from failure?' },
              { key: 'pressure_communication', label: 'Pressure Communication', desc: 'Clarity under time pressure?' },
              { key: 'mid_process_pivot', label: 'Mid-Process Pivot', desc: 'Response to crisis/change?' },
              { key: 'unblocking_agency', label: 'Unblocking Agency', desc: 'Self-direction?' },
            ].map(d => (
              <div key={d.key}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{d.label}</span>
                  <span className="text-sm text-forge-400">{ratings[d.key]}/5</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{d.desc}</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setRatings(prev => ({ ...prev, [d.key]: v }))} className={`w-8 h-8 rounded text-sm ${ratings[d.key] === v ? 'bg-forge-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} transition`}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Review Comments</label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-forge-500" placeholder="What did they do well? What could they improve?" />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="bg-forge-600 hover:bg-forge-500 disabled:bg-gray-700 px-6 py-2 rounded-lg transition">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  )
}
