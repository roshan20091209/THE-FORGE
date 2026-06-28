import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = true, glow = false, onClick, ...props }) {
  const baseStyle = hover ? 'card-hover' : 'card'
  const glowStyle = glow ? 'shadow-glow' : ''

  const Comp = onClick ? motion.button : motion.div

  return (
    <Comp
      whileTap={onClick ? { scale: 0.98 } : undefined}
      whileHover={onClick || hover ? { y: -2 } : undefined}
      onClick={onClick}
      className={`${baseStyle} ${glowStyle} ${className} p-4 md:p-6`}
      {...props}
    >
      {children}
    </Comp>
  )
}
