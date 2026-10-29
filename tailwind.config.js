/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080B11',
        card: '#0F1523',
        cardSecondary: '#172136',
        brand: '#F59E0B',
        precinct: {
          950: '#070A0F', // Main background (deep obsidian noir)
          900: '#0C111A', // Secondary canvas
          850: '#111724', // Card & panel surface
          800: '#172033', // Raised element surface
          750: '#1E2A42', // Hover surface
          700: '#283654', // Border soft
          600: '#384B73', // Border high-contrast
          500: '#64748B', // Muted text
          400: '#94A3B8', // Secondary text
          300: '#CBD5E1', // Primary text soft
          200: '#E2E8F0', // Strong label
          100: '#F1F5F9', // Pure white text
        },
        badge: {
          gold: '#F59E0B',
          amber: '#D97706',
          light: '#FDE68A',
        },
        patrol: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          glow: 'rgba(59, 130, 246, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      scale: {
        '108': '1.08',
      },
      boxShadow: {
        'tv-focus': '0 0 25px rgba(245, 158, 11, 0.65)',
        'tv-card': '0 8px 24px -4px rgba(0, 0, 0, 0.7), 0 2px 6px -1px rgba(0, 0, 0, 0.5)',
        'tv-card-focus': '0 0 0 3px #F59E0B, 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 28px rgba(245, 158, 11, 0.45)',
      },
    },
  },
  plugins: [],
}
