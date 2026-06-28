export default function ProgressBar({ value = 0, max = 100, label, className = '', color = 'from-forge-accent to-forge-cyan', size = 'md', showValue = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-forge-text-secondary">{label}</span>}
          {showValue && <span className="text-xs font-medium">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full ${heights[size]} bg-white/[0.06] rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
