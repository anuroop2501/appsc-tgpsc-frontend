/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F1A',
        surface: '#131826',
        card: '#1A2035',
        border: '#2A3450',
        accent: '#4F8EF7',
        purple: '#7B5EF8',
        gold: '#F5A623',
        green: '#3DD68C',
        red: '#F76F6F',
        text: '#E8EDF8',
        muted: '#7A8BAA',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'count-up': 'countUp 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(79, 142, 247, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(79, 142, 247, 0.6)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow-accent': '0 0 20px rgba(79, 142, 247, 0.3)',
        'glow-purple': '0 0 20px rgba(123, 94, 248, 0.3)',
        'glow-gold': '0 0 20px rgba(245, 166, 35, 0.3)',
        'glow-green': '0 0 20px rgba(61, 214, 140, 0.3)',
      },
    },
  },
  plugins: [],
}
