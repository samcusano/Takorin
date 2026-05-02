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
        muted:    '#78706A',
        ghost:    '#A8A098',
        rule:     '#C8C0B4',
        rule2:    '#D8D2C8',
        ok:       { DEFAULT: '#3A8A5A', dim: '#EBF5EF' },
        warn:     { DEFAULT: '#C4920A', dim: '#FEF6E4' },
        danger:   { DEFAULT: '#D94F2A', dim: '#FDECE7' },
        int:      { DEFAULT: '#3A7FD4', dim: '#EBF2FC' },
        // Sidebar — PostHog-influenced dark surface
        sidebar:  { DEFAULT: '#1A1610', 2: '#221E18', border: '#3A342E' },
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body:    ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '13': '13px',
      },
    },
  },
  plugins: [],
}
