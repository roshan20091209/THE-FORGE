import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Target, Layers, User, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { path: '/dashboard', label: 'Home', icon: Home, auth: true },
  { path: '/simulations', label: 'Challenges', icon: Target },
  { path: '/', label: 'The Forge', icon: Layers, exact: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: Users, auth: true },
  { path: '/profile', label: 'Profile', icon: User, auth: true },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()

  const hidePaths = ['/login', '/register', '/auth/', '/attempts/', '/c/']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null
  if (!user && !['/', '/simulations'].includes(location.pathname)) return null

  const isActive = (tab) => {
    if (tab.exact) return location.pathname === tab.path
    return location.pathname.startsWith(tab.path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="glass-strong border-t border-white/[0.06] px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {tabs.map(tab => {
            if (tab.auth && !user) return null
            const active = isActive(tab)
            const Icon = tab.icon
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNav"
                    className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-forge-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-forge-accent' : 'text-forge-text-muted'
                  }`}
                  fill={active ? '#6366F1' : 'none'}
                />
                <span className={`text-[10px] leading-tight ${
                  active ? 'text-forge-accent font-medium' : 'text-forge-text-muted'
                }`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
