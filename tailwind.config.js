/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:               '#0A0F1C',
        'bg-soft':        '#0D1322',
        surface:          '#131A2B',
        elevated:         '#182036',
        border:           '#232C42',
        'border-soft':    '#1B2338',
        't1':             '#F1F3F9',
        't2':             '#9BA4B8',
        't3':             '#5D6579',
        gold:             '#C9A430',
        'gold-hi':        '#E7C568',
        indigo:           '#6482E8',
        emerald:          '#33A583',
        red:              '#EF4444',
        // Legacy aliases
        card:             '#182036',
        accent:           '#6482E8',
        muted:            '#9BA4B8',
        text:             '#F1F3F9',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'Courier New', 'monospace'],
        // legacy
        sora:    ['Fraunces', 'serif'],
      },
      borderRadius: {
        card: '14px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.3s ease forwards',
        'slide-down': 'slideDown 0.2s ease forwards',
        'spin-slow':  'spin 2s linear infinite',
        'dot-bounce': 'dotBounce 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%':            { transform: 'scale(1)',   opacity: '1' },
        },
      },
      boxShadow: {
        card:   '0 4px 24px rgba(0,0,0,0.4)',
        'glow-indigo':  '0 0 20px rgba(100,130,232,0.25)',
        'glow-gold':    '0 0 20px rgba(201,164,48,0.25)',
        'glow-emerald': '0 0 20px rgba(51,165,131,0.25)',
      },
    },
  },
  plugins: [],
}
