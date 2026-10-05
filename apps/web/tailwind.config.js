/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'p-bg': '#FAF7F2',
        'p-dark': '#3A2118',
        'p-chocolate': '#5A3426',
        'p-cocoa': '#76513F',
        'p-beige': '#E9DED2',
        'p-cream': '#FFFDF9',
        'p-terracotta': '#B87352',
        'p-saffron': '#C59A62',
        'p-text': '#2B1B15',
        'p-muted': '#7A665B',
        'p-card': '#FFFDF9',
        'p-border': '#E9DED2',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(58, 33, 24, 0.04)',
        'warm-md': '0 4px 16px rgba(58, 33, 24, 0.08)',
        'warm-lg': '0 8px 24px rgba(58, 33, 24, 0.12)',
        'warm-sheet': '0 -6px 30px rgba(58, 33, 24, 0.15)',
      }
    },
  },
  plugins: [],
}
