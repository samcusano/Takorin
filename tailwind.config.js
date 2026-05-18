/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Takorin design tokens — Pulse palette
        stone:    { DEFAULT: '#FFFFFF', 2: '#F7F8FA', 3: '#EDEEF1', 4: '#E2E5EA' },
        ink:      { DEFAULT: '#101828', 2: '#344054', 3: '#667085' },
        ochre:    { DEFAULT: '#0052CC', dim: '#EFF4FF', dark: '#003580', light: '#3572E3' },
        brass:    { DEFAULT: '#0052CC', dim: '#EFF4FF' },
        muted:    '#667085',
        ghost:    '#6B7280',
        rule:     '#E2E5EA',
        rule2:    '#EDEEF1',
        ok:       { DEFAULT: '#027A48', dim: '#ECFDF3' },
        warn:     { DEFAULT: '#B54708', dim: '#FFFAEB' },
        danger:   { DEFAULT: '#D92D20', dim: '#FFF4F3' },
        int:      { DEFAULT: '#0052CC', dim: '#EFF4FF' },
        // Sidebar — stays dark against the white content area
        sidebar:  { DEFAULT: '#000000', 2: '#0D0D0D', 3: '#1A1A1A', border: '#1F1F1F', ghost: '#808080' },
      },
      fontFamily: {
        display: ['Inter', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '10': '12px',
        '11': '13px',
        '13': '15px',
        label: ['12px', { lineHeight: '1.2' }],
        caption: ['13px', { lineHeight: '1.35' }],
        body: ['14px', { lineHeight: '1.45' }],
        section: ['15px', { lineHeight: '1.3' }],
        metric: ['28px', { lineHeight: '1' }],
        page: ['32px', { lineHeight: '1.1' }],
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
        'raise': '0 4px 16px rgba(16,24,40,0.12)',
      },
    },
  },
  plugins: [],
}
