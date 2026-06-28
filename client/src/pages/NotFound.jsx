import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-400 mb-8">This simulation endpoint doesn't exist. Maybe it was archived?</p>
      <div className="flex gap-4 justify-center">
        <Link to="/" className="bg-forge-600 hover:bg-forge-500 px-6 py-2 rounded-lg transition">Home</Link>
        <Link to="/dashboard" className="border border-gray-600 hover:border-gray-400 px-6 py-2 rounded-lg transition">Dashboard</Link>
      </div>
    </div>
  )
}
