import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-display font-bold mb-2">Oops, let's try that again</h1>
        <p className="text-forge-text-secondary mb-6">This page doesn't exist yet. Or maybe it never did.</p>
        <Link to="/">
          <Button variant="primary" icon={<Home className="w-4 h-4" />}>
            Go Home
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
