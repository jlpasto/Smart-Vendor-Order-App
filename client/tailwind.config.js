/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f9',
          100: '#e0f2f3',
          200: '#c1e5e6',
          300: '#99d2d4',
          400: '#6ab8bb',
          500: '#377b82',  // Main brand color
          600: '#2d6268',
          700: '#244f53',
          800: '#1b3b3e',
          900: '#035257',  // Darkest brand color
        },
        cream: '#f7f5ef',  // Light cream color for backgrounds
        brand: {
          dark: '#035257',
          main: '#377b82',
          light: '#f7f5ef'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif']
      },
      fontSize: {
        'base': '16px',  // Minimum for senior-friendly design
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px'
      }
    },
  },
  plugins: [],
}
