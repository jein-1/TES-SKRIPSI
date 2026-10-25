/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nerv: {
          bg: '#07090E',
          card: '#0E121B',
          cardAlert: '#1F1116',
          border: '#1E293B',
          borderActive: '#334155',
          orange: '#FF5722',
          cyan: '#00E5FF',
          green: '#10B981',
          red: '#FF1744',
          yellow: '#EAB308',
          muted: '#64748B',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
