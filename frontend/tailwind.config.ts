import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "green-deep": "#123326",
        "green-deeper": "#0d2820",
        cream: "#f7f1e4",
        "cream-2": "#efe6d3",
        gold: "#c9a24a",
        "gold-light": "#e3c477",
        terracotta: "#d2622c",
        "terracotta-dark": "#b7501f",
        ink: "#1c2420",
        "ink-soft": "#5c6660",
        // ── Dark theme surface tokens ──────────────────────────────
        "dark-bg":       "#0a1510",   // page background
        "dark-surface":  "#0f1e16",   // card / section surface
        "dark-surface-2":"#152a1e",   // slightly lighter surface (hover, raised)
        "dark-border":   "#1e3328",   // subtle divider / border
        "dark-text":     "#e8e2d4",   // primary text on dark
        "dark-muted":    "#8a9e92",   // secondary / muted text on dark
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-jost)", "sans-serif"],
      },
      borderRadius: {
        lg2: "20px",
        md2: "14px",
      },
      boxShadow: {
        card: "0 20px 40px -20px rgba(18,51,38,0.35)",
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
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
      })
    },
  ],
};
export default config;
