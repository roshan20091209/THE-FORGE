import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Splash({ onFinish }) {
  const [progress, setProgress] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(() => setShow(false), 300)
          return 100
        }
        return p + Math.random() * 15 + 5
      })
    }, 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => onFinish?.(), 400)
      return () => clearTimeout(t)
    }
  }, [show, onFinish])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] bg-forge-bg flex flex-col items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="mb-6"
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
                <circle cx="32" cy="32" r="28" stroke="url(#g1)" strokeWidth="3" opacity="0.3" />
                <path d="M20 40L32 20L44 40H20Z" fill="url(#g2)" />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="64" y2="64">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#22D3EE" />
                  </linearGradient>
                  <linearGradient id="g2" x1="20" y1="20" x2="44" y2="40">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <h1 className="text-2xl font-display font-bold gradient-text mb-2">The Forge</h1>
            <p className="text-sm text-forge-text-muted mb-8">Building your simulations...</p>

            <div className="w-48 mx-auto h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-forge-accent to-forge-cyan"
                style={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <p className="absolute bottom-8 text-xs text-forge-text-muted">Made by students, for students</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
