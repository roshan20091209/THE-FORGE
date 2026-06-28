import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, BookOpen, Languages, School } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold">Profile</h1>
        </div>

        <div className="bg-forge-surface border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl font-bold">
              {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user?.full_name || 'Student'}</h2>
              <p className="text-sm text-forge-text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            {user?.school_id && (
              <div className="flex items-center gap-3 text-sm">
                <School className="w-4 h-4 text-forge-text-muted" />
                <span className="text-forge-text-secondary">School ID: {user.school_id}</span>
              </div>
            )}
            {user?.class_grade && (
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-forge-text-muted" />
                <span className="text-forge-text-secondary">Class {user.class_grade}{user?.section ? ` - ${user.section}` : ''}</span>
              </div>
            )}
            {user?.preferred_language && (
              <div className="flex items-center gap-3 text-sm">
                <Languages className="w-4 h-4 text-forge-text-muted" />
                <span className="text-forge-text-secondary capitalize">{user.preferred_language}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  )
}
