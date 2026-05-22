/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Surfaces — dark graphite scale (cool-neutral) ──────────────────
        stone:   { DEFAULT: '#0B0F18', 2: '#131A26', 3: '#1B2538', 4: '#263042' },
        // ── Text — warm bone scale ─────────────────────────────────────────
        ink:     { DEFAULT: '#EDE4CB', 2: '#9B9070' },
        muted:   '#7A8EA8',   // secondary/muted text — cool blue-gray
        // ── Borders ────────────────────────────────────────────────────────
        rule:    '#263042',   // structural border
        rule2:   '#1A2335',   // subtle border
        // ── Semantic ───────────────────────────────────────────────────────
        ok:      { DEFAULT: '#5FA877', dim: '#0D2518' },  // lighter green for dark bg
        warn:    { DEFAULT: '#C98E2A', dim: '#2A1E08' },  // warm amber
        danger:  { DEFAULT: '#DE6C4E', dim: '#2A100A' },  // warm rust
        // ── Primary accent — steel blue (interactive, structural) ──────────
        signal:  { DEFAULT: '#4B9CE4', dim: '#0D1E38', dark: '#2A6AAD', light: '#7BBDEE' },
        // ── Narrative accent — clay (context, interpretation, insight) ─────
        context: { DEFAULT: '#C4844E', dim: '#2A1808' },
        // ── Predictive accent — indigo (historical, AI-derived) ───────────
        deep:    { DEFAULT: '#7C86E8', dim: '#141830' },
        // ── Sidebar — blue-black, distinct from content graphite ──────────
        sidebar: { DEFAULT: '#080D16', 2: '#0E1520', 3: '#152030', border: '#1C2A40', ghost: '#6A88A8' },
      },
      fontFamily: {
        body:    ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        display: ["'Bricolage Grotesque'", "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", "'Menlo'", 'monospace'],
      },
      fontSize: {
        // ── UI text — 4 steps ─────────────────────────────────────────────
        micro:   ['10px', { lineHeight: '1.2' }],   // metadata, timestamps
        label:   ['11px', { lineHeight: '1.2' }],   // inline labels, badges
        body:    ['13px', { lineHeight: '1.45' }],  // primary reading text
        base:    ['15px', { lineHeight: '1.4' }],   // comfortable reading / subheadings
        // ── Numeric / display — 6 steps ───────────────────────────────────
        head:    ['18px', { lineHeight: '1.3' }],   // section titles, kpi labels
        subhead: ['18px', { lineHeight: '1.3' }],   // alias → head (collapsed)
        title:   ['22px', { lineHeight: '1.2' }],   // stat values, callout numbers
        metric:  ['28px', { lineHeight: '1' }],     // kpi grid cells
        page:    ['28px', { lineHeight: '1' }],     // alias → metric (collapsed)
        display: ['48px', { lineHeight: '1' }],     // alias → score (collapsed)
        score:   ['48px', { lineHeight: '1' }],     // hero risk / shift scores
        hero:    ['64px', { lineHeight: '1' }],     // primary screen numerals
        jumbo:   ['80px', { lineHeight: '1' }],     // jumbo OEE / plant-level
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
        'card-alert': '0 1px 5px rgba(222,108,78,0.20)',    // danger card lift
      },
      zIndex: {
        modal: '60',
        toast: '70',
      },
    },
  },
  plugins: [],
}
