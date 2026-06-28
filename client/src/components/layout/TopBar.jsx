import { Link, useLocation } from 'react-router-dom'

export default function TopBar() {
  const location = useLocation()

  const hidePaths = ['/login', '/register', '/auth/', '/onboarding']
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src="/forge.svg" alt="" className="w-6 h-6" />
          <span className="font-bold">
            <span className="text-indigo-400">OSM-</span>BRO
          </span>
        </Link>
      </div>
    </header>
  )
}
