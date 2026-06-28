import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, BookOpen, MessageSquare, ClipboardList, GraduationCap } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const hidePaths = ['/login', '/register', '/auth/', '/attempts/', '/c/']
  if (location.pathname === '/' || hidePaths.some(p => location.pathname.startsWith(p))) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/forge.svg" alt="" className="w-6 h-6" />
            <span className="font-bold text-lg">
              <span className="text-indigo-400">OSM-</span>BRO
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/ask" className="btn-ghost text-xs flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />Ask
                </Link>
                <Link to="/textbooks" className="btn-ghost text-xs hidden sm:flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />Books
                </Link>
                <Link to="/assignment" className="btn-ghost text-xs hidden md:flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />HW
                </Link>
                <Link to="/question-bank" className="btn-ghost text-xs hidden lg:flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />QBank
                </Link>
                <span className="text-xs text-forge-text-muted hidden sm:inline">
                  {user.full_name || user.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className="btn-ghost text-xs" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
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
