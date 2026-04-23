/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(60px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'fade-up':        'fade-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
