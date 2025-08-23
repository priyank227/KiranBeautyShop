/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        }
      }
    },
  },
  plugins: [],
} 