import { motion } from 'framer-motion'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-gradient-to-r from-forge-danger to-rose-600 text-white font-semibold rounded-pill px-6 py-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-forge-danger/20 hover:shadow-xl hover:shadow-forge-danger/30',
  success: 'bg-gradient-to-r from-forge-success to-emerald-500 text-white font-semibold rounded-pill px-6 py-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-forge-success/20 hover:shadow-xl hover:shadow-forge-success/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
  xl: 'px-10 py-4 text-lg',
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, icon, onClick, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
