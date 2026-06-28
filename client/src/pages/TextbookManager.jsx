import { useState, useEffect } from 'react'
import { api } from '../api'
import { Upload, Book, CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw, FileText } from 'lucide-react'

export default function TextbookManager() {
  const [textbooks, setTextbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', subject: '', grade: '12', author: '', publisher: '', year: ''
  })
  const [file, setFile] = useState(null)

  useEffect(() => { loadTextbooks() }, [])

  async function loadTextbooks() {
    try {
      const data = await api.textbooks.list()
      setTextbooks(data.textbooks || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !form.title || !form.subject) {
      setError('File, title, and subject are required')
      return
    }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('subject', form.subject)
      fd.append('grade', form.grade)
      if (form.author) fd.append('author', form.author)
      if (form.publisher) fd.append('publisher', form.publisher)
      if (form.year) fd.append('year', form.year)

      await api.textbooks.upload(fd)
      setForm({ title: '', subject: '', grade: '12', author: '', publisher: '', year: '' })
      setFile(null)
      await loadTextbooks()
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  async function handleIndex(id) {
    try {
      await api.textbooks.index(id)
      await loadTextbooks()
    } catch (err) { setError(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this textbook?')) return
    try {
      await api.textbooks.delete(id)
      await loadTextbooks()
    } catch (err) { setError(err.message) }
  }

  const statusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Book className="w-6 h-6 text-forge-accent" />
        <h1 className="text-xl font-bold">Textbook Manager</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleUpload} className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Textbook PDF</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Title *" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Subject * (e.g. Physics)" value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.grade}
            onChange={e => setForm({ ...form, grade: e.target.value })}>
            <option value="12">Class 12</option>
            <option value="11">Class 11</option>
          </select>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Author" value={form.author}
            onChange={e => setForm({ ...form, author: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Publisher" value={form.publisher}
            onChange={e => setForm({ ...form, publisher: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Year" type="number" value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
            className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-forge-accent file:text-white file:text-sm file:cursor-pointer" />
          <button type="submit" disabled={uploading}
            className="bg-forge-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Upload & Index'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">My Textbooks ({textbooks.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : textbooks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p>No textbooks uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {textbooks.map(tb => (
              <div key={tb.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(tb.indexing_status)}
                  <div>
                    <p className="font-medium text-sm">{tb.title}</p>
                    <p className="text-xs text-gray-500">
                      {tb.subject} • Class {tb.grade}
                      {tb.author ? ` • ${tb.author}` : ''}
                      {tb.total_chunks ? ` • ${tb.total_chunks} chunks` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tb.indexing_status === 'completed' ? 'bg-green-100 text-green-700' :
                    tb.indexing_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    tb.indexing_status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{tb.indexing_status}</span>
                  {tb.indexing_status !== 'completed' && (
                    <button onClick={() => handleIndex(tb.id)} className="p-1 hover:bg-gray-100 rounded">
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(tb.id)} className="p-1 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
