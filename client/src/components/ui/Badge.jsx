const colorMap = {
  beginner: 'badge-success',
  easy: 'badge-success',
  intermediate: 'badge-warning',
  medium: 'badge-warning',
  advanced: 'badge-danger',
  hard: 'badge-danger',
  info: 'badge-info',
  cyan: 'badge-cyan',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
}

export default function Badge({ children, variant = 'info', className = '' }) {
  return (
    <span className={`${colorMap[variant] || colorMap.info} ${className}`}>
      {children}
    </span>
  )
}
