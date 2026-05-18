/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Takorin design tokens — Pulse palette
        stone:    { DEFAULT: '#FFFFFF', 2: '#F7F8FA', 3: '#EDEEF1', 4: '#E2E5EA' },
        ink:      { DEFAULT: '#101828', 2: '#344054' },
        ochre:    { DEFAULT: '#0052CC', dim: '#EFF4FF', dark: '#003580', light: '#3572E3' },
        muted:    '#667085',
        rule:     '#E2E5EA',
        rule2:    '#EDEEF1',
        ok:       { DEFAULT: '#027A48', dim: '#ECFDF3' },
        warn:     { DEFAULT: '#B54708', dim: '#FFFAEB' },
        danger:   { DEFAULT: '#D92D20', dim: '#FFF4F3' },
        // Sidebar — stays dark against the white content area
        sidebar:  { DEFAULT: '#000000', 2: '#0D0D0D', 3: '#1A1A1A', border: '#1F1F1F', ghost: '#808080' },
      },
      fontFamily: {
        display: ['Inter', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // ── UI text scale ───────────────────────────────────────────────────
        micro:   ['8px',  { lineHeight: '1.2' }],   // tiny badges, axis labels
        label:   ['12px', { lineHeight: '1.2' }],   // labels, metadata, supporting copy
        body:    ['14px', { lineHeight: '1.45' }],  // default body text
        // ── Display / numeric scale ──────────────────────────────────────────
        base:    ['15px', { lineHeight: '1.4' }],   // section titles, inline numbers, small headings
        head:    ['18px', { lineHeight: '1.3' }],   // panel headings, card titles
        subhead: ['20px', { lineHeight: '1.2' }],   // large card titles
        title:   ['22px', { lineHeight: '1.2' }],   // confidence scores, key stats
        metric:  ['28px', { lineHeight: '1' }],     // stat bar numbers
        page:    ['32px', { lineHeight: '1.1' }],   // page headings
        display: ['40px', { lineHeight: '1' }],     // hero scores (batch, quality)
        score:   ['48px', { lineHeight: '1' }],     // large score displays
        hero:    ['64px', { lineHeight: '1' }],     // primary score (ShiftIQ, DataReadiness)
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
      borderRadius: {
        'btn': '4px',
      },
      boxShadow: {
        'raise':      '0 4px 16px rgba(16,24,40,0.12)',
        'card':       '0 1px 3px rgba(16,24,40,0.06)',
        'card-alert': '0 1px 4px rgba(217,45,32,0.08)',
      },
      zIndex: {
        // ── Layer stack (extends Tailwind defaults 0–50) ──────────────────
        modal: '60',   // modals, vaul drawers
        toast: '70',   // toast notifications (always on top)
      },
    },
  },
  plugins: [],
}
