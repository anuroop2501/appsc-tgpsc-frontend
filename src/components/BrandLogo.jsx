export default function BrandLogo({ size = 36, showText = false, textSize = 20, className = '' }) {
  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img
        src="/logo.png"
        alt="APPSC AI Logo"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
      />

      {showText && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 650,
            fontSize: textSize,
            letterSpacing: 0.2,
            color: 'var(--text-1)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          APPSC{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF5500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  )
}
