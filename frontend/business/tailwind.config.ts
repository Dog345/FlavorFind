import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core palette (from flavorfind-landing_7.html CSS vars) ──────────
        bg:             '#0a1510',
        card:           '#152a1e',
        border:         '#1e3328',
        'text-primary': '#e8e2d4',
        muted:          '#8a9e92',
        gold:           '#e3c477',
        terra:          '#d2622c',
        'terra-hover':  '#e0703a',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        body:    ['var(--font-jost)', 'Jost', 'sans-serif'],
      },
      borderRadius: {
        xl2: '20px',
        lg2: '16px',
        md2: '14px',
      },
      keyframes: {
        heroIn: {
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pillIn: {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        waveFloat: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(5px)' },
        },
        dishFloat: {
          '0%,100%': { transform: 'translateY(0) rotateY(0deg) rotateX(0deg) scale(1)' },
          '50%':     { transform: 'translateY(-14px) rotateY(4deg) rotateX(-2deg) scale(1.015)' },
        },
        steamRise: {
          '0%':   { transform: 'translateY(0)',     opacity: '0.55' },
          '50%':  { transform: 'translateY(-10px)', opacity: '0.12' },
          '100%': { transform: 'translateY(0)',     opacity: '0.55' },
        },
        hangSway: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%':     { transform: 'rotate(2deg)' },
        },
        stripScroll: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        revealUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hero-in':     'heroIn 0.9s cubic-bezier(0.16,0.8,0.24,1) forwards',
        'pill-in':     'pillIn 0.5s cubic-bezier(0.16,0.8,0.24,1) backwards',
        'wave-float':  'waveFloat 6s ease-in-out infinite',
        'dish-float':  'dishFloat 5s ease-in-out infinite',
        'steam-rise':  'steamRise 3.6s ease-in-out infinite',
        'hang-sway':   'hangSway 4.5s ease-in-out infinite',
        'strip-scroll':'stripScroll 26s linear infinite',
        'reveal-up':   'revealUp 0.8s cubic-bezier(0.16,0.8,0.24,1) forwards',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': { display: 'none' },
        '.perspective-1200': { perspective: '1200px' },
        '.transform-3d':     { 'transform-style': 'preserve-3d' },
      })
    },
  ],
}

export default config
