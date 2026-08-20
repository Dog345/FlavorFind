/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 'primary' is overridden at runtime via --color-primary (hotel.primary_color)
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        ink: {
          DEFAULT: '#2B2119', // espresso — dark header/nav, primary text
          soft: '#8A7A6D',    // muted text
        },
        cream: {
          DEFAULT: '#FBF7F1', // warm content background
          card: '#FFFFFF',
        },
        line: '#EAE2D8',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 2px 10px rgba(43, 33, 25, 0.06)',
        sheet: '0 -8px 30px rgba(43, 33, 25, 0.12)',
        tap: '0 1px 4px rgba(43, 33, 25, 0.10)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
