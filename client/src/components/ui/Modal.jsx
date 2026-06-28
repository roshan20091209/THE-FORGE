import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ open, onClose, children, className = '' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className={`w-full md:max-w-lg md:rounded-modal rounded-t-2xl bg-forge-surface border border-white/[0.06] shadow-elevated ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ModalHeader({ children, onClose }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
      <div className="font-semibold">{children}</div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
