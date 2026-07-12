import { useEffect, useRef, useState } from 'react'

const ScoreRing = ({ score, maxScore, size = 160, strokeWidth = 12 }) => {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  const pct = maxScore > 0 ? score / maxScore : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - pct * circumference

  const color =
    pct >= 0.7 ? '#3DD68C' : pct >= 0.5 ? '#F5A623' : '#F76F6F'

  const glowColor =
    pct >= 0.7
      ? 'rgba(61,214,140,0.35)'
      : pct >= 0.5
      ? 'rgba(245,166,35,0.35)'
      : 'rgba(247,111,111,0.35)'

  const grade =
    pct >= 0.7 ? 'Excellent' : pct >= 0.5 ? 'Good' : 'Needs Work'

  useEffect(() => {
    // Trigger animation after short delay
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [score, maxScore])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />

        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2A3450"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className="text-3xl font-bold"
            style={{ color, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}
          >
            {score}
          </span>
          <span
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-muted)' }}
          >
            / {maxScore}
          </span>
          <span
            className="text-xs font-semibold mt-1"
            style={{ color, fontFamily: 'Sora, sans-serif' }}
          >
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {/* Grade label */}
      <div
        className="px-4 py-1.5 rounded-full text-xs font-bold"
        style={{
          background: `${color}20`,
          border: `1px solid ${color}60`,
          color,
          fontFamily: 'Sora, sans-serif',
          letterSpacing: '0.05em',
        }}
      >
        {grade}
      </div>
    </div>
  )
}

export default ScoreRing
