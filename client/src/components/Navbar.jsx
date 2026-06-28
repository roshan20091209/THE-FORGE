import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flame, LogOut, BookOpen, MessageSquare, ClipboardList, Lightbulb } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const hidePaths = ['/login', '/register', '/auth/', '/attempts/', '/c/', '/leaderboard', '/community', '/profile', '/dashboard', '/textbooks', '/ask', '/assignment', '/question-bank']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          <Link to="/" className="text-lg font-display font-bold gradient-text">
            The Forge
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/ask" className="btn-ghost text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" />Ask</Link>
                <Link to="/textbooks" className="btn-ghost text-xs hidden sm:flex items-center gap-1"><BookOpen className="w-3 h-3" />Textbooks</Link>
                <Link to="/assignment" className="btn-ghost text-xs hidden md:flex items-center gap-1"><ClipboardList className="w-3 h-3" />Assignment</Link>
                <Link to="/question-bank" className="btn-ghost text-xs hidden lg:flex items-center gap-1"><Lightbulb className="w-3 h-3" />QB Bank</Link>
                <Link to="/simulations" className="btn-ghost text-xs hidden sm:flex">Challenges</Link>
                <Link to="/dashboard" className="btn-ghost text-xs hidden sm:flex">Dashboard</Link>
                <span className="text-xs text-forge-text-muted hidden sm:inline">
                  {user.full_name || user.email?.split('@')[0]}
                </span>
                {user.streak > 0 && (
                  <span className="badge-warning text-[10px]">
                    <Flame className="w-3 h-3" /> {user.streak}
                  </span>
                )}
                <button onClick={handleLogout} className="btn-ghost text-xs" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/simulations" className="btn-ghost text-xs">Challenges</Link>
                <Link to="/login" className="btn-ghost text-xs">Login</Link>
                <Link to="/register" className="btn-primary text-xs !px-4 !py-1.5">Join Free</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
