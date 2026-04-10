/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Background layers ──────────────────────────
        'bg-base':      '#1e1e24',   // Deepest background
        'bg-raised':    '#25252d',   // Panels / panes
        'bg-surface':   '#2d2d38',   // Cards / list items
        'bg-hover':     '#32323e',   // Hover state
        'bg-active':    '#3a3a48',   // Pressed / active bg

        // ── Royal Purple accent ───────────────────────
        'accent':       '#7b2ff7',
        'accent-light': '#9d5eff',
        'accent-dark':  '#5a1dc2',
        'accent-glow':  'rgba(123, 47, 247, 0.25)',

        // ── Text ───────────────────────────────────────
        'text-hi':      '#f0f0f5',   // Primary text
        'text-lo':      '#a0a0b0',   // Secondary / muted
        'text-ghost':   '#606075',   // Disabled / placeholder

        // ── Borders ────────────────────────────────────
        'border-dim':   '#35353f',   // Default dividers
        'border-hi':    '#4a4a5a',   // Visible borders
        'border-accent': '#7b2ff7',   // Active / focused border
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'accent':    '0 0 0 1px #7b2ff7, 0 0 12px rgba(123, 47, 247, 0.30)',
        'accent-sm': '0 0 0 1px #7b2ff7, 0 0 6px rgba(123, 47, 247, 0.20)',
        'panel':     '2px 0 8px rgba(0,0,0,0.4)',
        'popup':     '0 8px 32px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'pulse-accent': {
          '0%, 100%': { boxShadow: '0 0 0 1px #7b2ff7, 0 0 8px rgba(123, 47, 247, 0.25)' },
          '50%'      : { boxShadow: '0 0 0 1px #9d5eff, 0 0 18px rgba(123, 47, 247, 0.45)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'pulse-accent':   'pulse-accent 2s ease-in-out infinite',
        'slide-in-left':  'slide-in-left 0.2s ease-out',
        'fade-in':        'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
