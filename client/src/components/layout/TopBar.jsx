import { Link, useLocation } from 'react-router-dom'
import { Bell, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TopBar({ title }) {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const hidePaths = ['/login', '/register', '/auth/', '/attempts/', '/c/', '/onboarding']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null
  if (!user && location.pathname !== '/simulations') return null

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-1 -ml-1">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="text-lg font-display font-bold gradient-text">
            The Forge
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link to="/dashboard" className="btn-ghost text-xs hidden sm:flex">Dashboard</Link>
              <Link to="/simulations" className="btn-ghost text-xs hidden sm:flex">Challenges</Link>
              <Link to="/leaderboard" className="btn-ghost text-xs hidden sm:flex">Leaderboard</Link>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn-ghost text-xs">Login</Link>
              <Link to="/register" className="btn-primary text-xs !px-4 !py-1.5">Join Free</Link>
            </>
          )}
          {user && (
            <div className="flex items-center gap-1">
              <button className="relative p-2 hover:bg-white/5 rounded-xl transition">
                <Bell className="w-5 h-5 text-forge-text-secondary" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-forge-danger rounded-full" />
              </button>
              <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-forge-accent to-forge-cyan flex items-center justify-center text-xs font-bold">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
