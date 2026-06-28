import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export default function StreakCounter({ streak = 0, size = 'md', showLabel = true }) {
  const sizes = {
    sm: { icon: 16, text: 'text-xs', flame: 'w-5 h-5' },
    md: { icon: 20, text: 'text-sm', flame: 'w-7 h-7' },
    lg: { icon: 24, text: 'text-lg font-bold', flame: 'w-9 h-9' },
  }

  const s = sizes[size] || sizes.md
  const isActive = streak > 0

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 ${isActive ? 'text-forge-warning' : 'text-forge-text-muted'}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
    >
      <div className={`${s.flame} relative`}>
        <Flame className={`w-full h-full ${isActive ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`}
          fill={isActive ? 'currentColor' : 'none'} />
      </div>
      <span className={s.text}>{streak}</span>
      {showLabel && <span className="text-xs text-forge-text-muted">day streak</span>}
    </motion.div>
  )
}
