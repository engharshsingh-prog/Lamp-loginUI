/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lamp: {
          glow: '#fbbf24',
          warm: '#f59e0b',
          bright: '#facc15',
          gold: '#eab308',
          dark: '#0a0a0c',
          card: 'rgba(23, 23, 27, 0.72)',
          cardBorder: 'rgba(255, 255, 255, 0.08)',
        }
      },
      boxShadow: {
        'lamp-cone': '0 0 120px 40px rgba(250, 204, 21, 0.25)',
        'lamp-button': '0 0 25px rgba(250, 204, 21, 0.45)',
        'card-glow': '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(250, 204, 21, 0.08)',
      },
      animation: {
        'flicker': 'flicker 0.15s ease-in-out',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.92' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
