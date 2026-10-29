/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080B11',
        card: '#0F172A',
        cardSecondary: '#1E293B',
        brand: '#F59E0B',
      },
      boxShadow: {
        'tv-focus': '0 0 25px rgba(245, 158, 11, 0.65)',
      },
    },
  },
  plugins: [],
}
