/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0178ff',
          light: '#2585eb',
          dark: '#005deb',
          darker: '#0047b3',
        },
        accent: {
          DEFAULT: '#0295ff',
          hover: '#0164ff',
        },
        price: {
          DEFAULT: '#e74c3c',
        },
        dark: {
          DEFAULT: '#070f30',
        },
        ocean: {
          50: '#f0f6fe',
          100: '#e0effc',
          200: '#cbe4fe',
          300: '#91c7f8',
          400: '#2585eb',
          500: '#0178ff',
          600: '#0164ff',
          700: '#005deb',
          800: '#0047b3',
          900: '#070f30',
          950: '#040a1e',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffaff',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito Sans', 'Arial', 'Helvetica', 'sans-serif'],
        heading: ['Outfit', 'Nunito Sans', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(1, 120, 255, 0.10)',
        'glass-hover': '0 12px 40px 0 rgba(1, 120, 255, 0.18)',
        card: '0 4px 20px -2px rgba(7, 15, 48, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
