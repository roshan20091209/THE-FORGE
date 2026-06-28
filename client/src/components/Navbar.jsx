import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname.startsWith('/attempts/')) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-forge-400 flex items-center gap-2">
            ⚒️ The Forge
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/simulations" className="text-gray-300 hover:text-white transition text-sm">Challenges</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition text-sm">Dashboard</Link>
                <span className="text-gray-500 text-sm hidden sm:inline">{user.full_name || user.email?.split('@')[0]}</span>
                {user.streak > 0 && (
                  <span className="text-orange-400 text-xs">🔥 {user.streak}</span>
                )}
                <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-sm transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition text-sm">Login</Link>
                <Link to="/register" className="bg-forge-600 hover:bg-forge-500 px-3 py-1.5 rounded text-sm transition">Join Free</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
