import { useEffect, useState } from 'react'

const RubricBar = ({ name, weight, score, earned, maxScore, index = 0 }) => {
  const [filled, setFilled] = useState(false)

  const pct = maxScore > 0 ? (earned / maxScore) * 100 : 0

  const color =
    pct >= 70 ? '#3DD68C' : pct >= 50 ? '#F5A623' : '#F76F6F'

  const bgColor =
    pct >= 70
      ? 'rgba(61, 214, 140, 0.12)'
      : pct >= 50
      ? 'rgba(245, 166, 35, 0.12)'
      : 'rgba(247, 111, 111, 0.12)'

  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 200 + index * 150)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="glass-card-sm px-4 py-3 animate-slide-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* ── Label row ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text)', fontFamily: 'DM Sans, sans-serif' }}
          >
            {name}
          </span>
          {weight !== undefined && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(122, 139, 170, 0.15)',
                color: 'var(--color-muted)',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              {weight}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-sm font-bold"
            style={{ color, fontFamily: 'Sora, sans-serif' }}
          >
            {earned}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            / {maxScore}
          </span>
        </div>
      </div>

      {/* ── Bar ── */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: filled ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transitionDuration: '0.9s',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>

      {/* ── Score hint ── */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {score !== undefined ? `Score: ${score}` : ''}
        </span>
        <span
          className="text-xs font-semibold"
          style={{
            color,
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  )
}

export default RubricBar
