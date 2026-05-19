/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Surfaces — dark graphite scale (cool-neutral) ──────────────────
        stone:   { DEFAULT: '#0B0F18', 2: '#131A26', 3: '#1B2538', 4: '#263042' },
        // ── Text — warm bone scale ─────────────────────────────────────────
        ink:     { DEFAULT: '#EDE4CB', 2: '#8A7E62' },
        muted:   '#7A8EA8',   // secondary/muted text — cool blue-gray
        // ── Borders ────────────────────────────────────────────────────────
        rule:    '#263042',   // structural border
        rule2:   '#1A2335',   // subtle border
        // ── Semantic ───────────────────────────────────────────────────────
        ok:      { DEFAULT: '#5FA877', dim: '#0D2518' },  // lighter green for dark bg
        warn:    { DEFAULT: '#C98E2A', dim: '#2A1E08' },  // warm amber
        danger:  { DEFAULT: '#D45438', dim: '#2A100A' },  // warm rust
        // ── Primary accent — steel blue (interactive, structural) ──────────
        ochre:   { DEFAULT: '#4B9CE4', dim: '#0D1E38', dark: '#2A6AAD', light: '#7BBDEE' },
        // ── Narrative accent — clay (context, interpretation, insight) ─────
        context: { DEFAULT: '#C4844E', dim: '#2A1808' },
        // ── Predictive accent — indigo (historical, AI-derived) ───────────
        deep:    { DEFAULT: '#7C86E8', dim: '#141830' },
        // ── Sidebar — blue-black, distinct from content graphite ──────────
        sidebar: { DEFAULT: '#080D16', 2: '#0E1520', 3: '#152030', border: '#1C2A40', ghost: '#4A6080' },
      },
      fontFamily: {
        // System / data voice — monospace for all structured information
        body:    ["'SF Mono'", "'JetBrains Mono'", 'ui-monospace', "'Menlo'", "'Consolas'", 'monospace'],
        // Narrative / context voice — humanist sans for interpretation and description
        display: ["'Inter'", "'Helvetica Neue'", 'system-ui', 'sans-serif'],
        // Explicit alias
        mono:    ["'SF Mono'", "'JetBrains Mono'", 'ui-monospace', "'Menlo'", "'Consolas'", 'monospace'],
      },
      fontSize: {
        // ── UI text scale ──────────────────────────────────────────────────
        micro:   ['8px',  { lineHeight: '1.2' }],
        label:   ['11px', { lineHeight: '1.2' }],
        body:    ['13px', { lineHeight: '1.45' }],
        section: ['14px', { lineHeight: '1.3' }],
        // ── Display / numeric scale ────────────────────────────────────────
        base:    ['15px', { lineHeight: '1.4' }],
        head:    ['18px', { lineHeight: '1.3' }],
        subhead: ['20px', { lineHeight: '1.2' }],
        title:   ['22px', { lineHeight: '1.2' }],
        metric:  ['28px', { lineHeight: '1' }],
        page:    ['32px', { lineHeight: '1.1' }],
        display: ['40px', { lineHeight: '1' }],
        score:   ['48px', { lineHeight: '1' }],
        hero:    ['64px', { lineHeight: '1' }],
      },
      transitionDuration: {
        '50':  '50ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'enter':    'cubic-bezier(0.19, 0.91, 0.38, 1)',
        'exit':     'cubic-bezier(0.42, 0, 1, 1)',
        'spring':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'inout':    'cubic-bezier(0.42, 0, 0.58, 1)',
        'standard': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      borderRadius: {
        'btn': '2px',  // tight — precision system, not consumer app
      },
      boxShadow: {
        'raise':      '0 4px 20px rgba(0,0,0,0.45)',       // floating overlays on dark bg
        'card':       '0 1px 4px rgba(0,0,0,0.30)',        // card lift
        'card-alert': '0 1px 5px rgba(212,84,56,0.20)',    // danger card lift
      },
      zIndex: {
        modal: '60',
        toast: '70',
      },
    },
  },
  plugins: [],
}
