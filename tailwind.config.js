/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#46A1D3',
          light: '#6BB8DE',
          dark: '#3589B8',
          darker: '#1E5F82',
        },
        accent: {
          DEFAULT: '#c8a951',
          hover: '#d8ba65',
        },
        price: {
          DEFAULT: '#e74c3c',
        },
        dark: {
          DEFAULT: '#333333',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
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
        sans: ['Nunito Sans', 'Arial', 'Helvetica', 'sans-serif'],
        heading: ['Nunito Sans', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(70, 161, 211, 0.15)',
        'glass-hover': '0 12px 40px 0 rgba(70, 161, 211, 0.25)',
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
