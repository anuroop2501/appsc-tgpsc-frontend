const LoadingDots = ({ message = 'Generating your content…' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 24px' }}>
      {/* Dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'block', width: 8, height: 8, borderRadius: '50%',
              background: 'var(--gold-hi)',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, letterSpacing: '0.02em', fontFamily: 'var(--font-body)' }}>
        {message}
      </p>

      {/* Progress bar */}
      <div style={{ width: 180, height: 2, borderRadius: 99, overflow: 'hidden', background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, var(--indigo), var(--emerald), var(--gold-hi))',
          borderRadius: 99,
          animation: 'shimmer 2s linear infinite',
          backgroundSize: '200% 100%',
        }} />
      </div>
    </div>
  )
}

export default LoadingDots
