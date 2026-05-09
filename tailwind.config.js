/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Takorin design tokens — mirrors CSS custom properties
        stone:    { DEFAULT: '#F5F0E8', 2: '#EDE7DC', 3: '#E0D9CC', 4: '#D4CEC4' },
        ink:      { DEFAULT: '#100F0D', 2: '#2A2520', 3: '#3A342E' },
        ochre:    { DEFAULT: '#C17D2A', dim: '#FBF3E6', dark: '#8A5A18', light: '#E8A84A' },
        brass:    { DEFAULT: '#8A6A3A', dim: '#F5EFE4' },
        // Darkened for 4.5:1+ contrast on stone background — WCAG AA
        muted:    '#5E5650',
        ghost:    '#696258',
        rule:     '#C8C0B4',
        rule2:    '#D8D2C8',
        ok:       { DEFAULT: '#3A8A5A', dim: '#EBF5EF' },
        warn:     { DEFAULT: '#C4920A', dim: '#FEF6E4' },
        danger:   { DEFAULT: '#D94F2A', dim: '#FDECE7' },
        int:      { DEFAULT: '#3A7FD4', dim: '#EBF2FC' },
        // Sidebar — PostHog-influenced dark surface
        sidebar:  { DEFAULT: '#1A1610', 2: '#221E18', 3: '#2A2420', border: '#3A342E', ghost: '#A8A098' },
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body:    [['IBM Plex Mono'], 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '13': '13px',
      },
      transitionDuration: {
        '50':  '50ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'enter':  'cubic-bezier(0.19, 0.91, 0.38, 1)',
        'exit':   'cubic-bezier(0.42, 0, 1, 1)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'inout':  'cubic-bezier(0.42, 0, 0.58, 1)',
      },
    },
  },
  plugins: [],
}
