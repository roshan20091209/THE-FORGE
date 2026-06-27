import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-forge-400">
            ⚒️ The Forge
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/simulations" className="text-gray-300 hover:text-white transition">Simulations</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</Link>
                {user.role === 'employer' && (
                  <Link to="/employer/dashboard" className="text-gray-300 hover:text-white transition">Employer</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/sql" className="text-forge-400 hover:text-forge-300 transition">Admin</Link>
                )}
                <span className="text-gray-500">{user.full_name || user.email}</span>
                <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-sm transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition">Login</Link>
                <Link to="/register" className="bg-forge-600 hover:bg-forge-500 px-3 py-1.5 rounded text-sm transition">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
