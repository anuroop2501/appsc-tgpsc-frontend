const LoadingDots = ({ message = 'AI is generating...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      {/* ── Dots ── */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2.5 h-2.5 rounded-full"
            style={{
              background: 'var(--color-accent)',
              animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite`,
              boxShadow: '0 0 8px rgba(79, 142, 247, 0.6)',
            }}
          />
        ))}
      </div>

      {/* ── Message ── */}
      <p
        className="text-sm font-medium"
        style={{
          color: 'var(--color-muted)',
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: '0.02em',
        }}
      >
        {message}
      </p>

      {/* ── Progress bar ── */}
      <div
        className="w-48 h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-accent), var(--color-purple))',
            borderRadius: '9999px',
            animation: 'shimmer 2s linear infinite',
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  )
}

export default LoadingDots
