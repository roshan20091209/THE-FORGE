import { useEffect, useRef } from 'react'

export default function RadarChart({ scores, size = 250 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !scores) return
    const ctx = canvas.getContext('2d')
    const cx = size / 2
    const cy = size / 2
    const r = size * 0.38

    const dims = [
      { key: 'wrong_and_recovered', label: 'Wrong & Recovered' },
      { key: 'pressure_communication', label: 'Pressure Communication' },
      { key: 'mid_process_pivot', label: 'Mid-Process Pivot' },
      { key: 'unblocking_agency', label: 'Unblocking Agency' },
    ]

    const values = dims.map(d => {
      const s = scores[d.key]
      return typeof s === 'object' ? (s.score || 0) : (s || 0)
    })
    const n = dims.length
    const angleStep = (Math.PI * 2) / n

    ctx.clearRect(0, 0, size, size)

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath()
      const level = ring / 4
      for (let i = 0; i < n; i++) {
        const a = angleStep * i - Math.PI / 2
        const x = cx + r * level * Math.cos(a)
        const y = cy + r * level * Math.sin(a)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (let i = 0; i < n; i++) {
      const a = angleStep * i - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.stroke()
    }

    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const val = values[i] / 100
      const a = angleStep * i - Math.PI / 2
      const x = cx + r * val * Math.cos(a)
      const y = cy + r * val * Math.sin(a)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(12, 142, 231, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#0c8ee7'
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < n; i++) {
      const a = angleStep * i - Math.PI / 2
      const lx = cx + (r + 28) * Math.cos(a)
      const ly = cy + (r + 28) * Math.sin(a)
      ctx.fillStyle = '#fff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(dims[i].label, lx, ly + 3)

      const vx = cx + (r + 14) * Math.cos(a)
      const vy = cy + (r + 14) * Math.sin(a)
      ctx.fillStyle = '#0c8ee7'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(values[i], vx, vy + 4)
    }
  }, [scores, size])

  if (!scores) return null
  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}
