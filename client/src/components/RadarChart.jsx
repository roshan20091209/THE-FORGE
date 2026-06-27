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
    const labels = ['Wrong & Recovered', 'Pressure Comm', 'Mid-Process Pivot', 'Unblocking Agency']
    const values = [
      scores.wrong_and_recovered || 0,
      scores.pressure_communication || 0,
      scores.mid_process_pivot || 0,
      scores.unblocking_agency || 0,
    ]
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

    ctx.clearRect(0, 0, size, size)

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath()
      const level = ring / 4
      for (let i = 0; i < 4; i++) {
        const x = cx + r * level * Math.cos(angles[i] - Math.PI / 2)
        const y = cy + r * level * Math.sin(angles[i] - Math.PI / 2)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const val = values[i] / 100
      const x = cx + r * val * Math.cos(angles[i] - Math.PI / 2)
      const y = cy + r * val * Math.sin(angles[i] - Math.PI / 2)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(12, 142, 231, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#0c8ee7'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    for (let i = 0; i < 4; i++) {
      const x = cx + (r + 25) * Math.cos(angles[i] - Math.PI / 2)
      const y = cy + (r + 25) * Math.sin(angles[i] - Math.PI / 2)
      ctx.fillText(labels[i], x, y)
      const vx = cx + (r + 12) * Math.cos(angles[i] - Math.PI / 2)
      const vy = cy + (r + 12) * Math.sin(angles[i] - Math.PI / 2)
      ctx.fillStyle = '#0c8ee7'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(values[i], vx, vy + 4)
      ctx.fillStyle = '#fff'
      ctx.font = '11px sans-serif'
    }
  }, [scores, size])

  if (!scores) return null
  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}
