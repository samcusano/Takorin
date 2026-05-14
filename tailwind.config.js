/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Takorin design tokens — high contrast warm palette
        stone:    { DEFAULT: '#FAF8F4', 2: '#F0EBE0', 3: '#E6DED0', 4: '#DAD4C6' },
        ink:      { DEFAULT: '#0A0906', 2: '#1E1A15', 3: '#2E2820' },
        ochre:    { DEFAULT: '#B86E1A', dim: '#F5E8CC', dark: '#7A4E10', light: '#D08A30' },
        brass:    { DEFAULT: '#8A6A3A', dim: '#F0E8D8' },
        // WCAG AA on #FAF8F4: muted 6.4:1, ghost 5.3:1
        muted:    '#5A5448',
        ghost:    '#686058',
        rule:     '#B8B0A4',
        rule2:    '#CAC2B6',
        ok:       { DEFAULT: '#3A8A5A', dim: '#E6F2EC' },
        warn:     { DEFAULT: '#C4920A', dim: '#FEF3E0' },
        danger:   { DEFAULT: '#C43820', dim: '#FAE8E4' },
        int:      { DEFAULT: '#3A7FD4', dim: '#EBF2FC' },
        // Sidebar — dark surface, unchanged
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
