/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables so light/dark theme switching works automatically.
        // RGB format (space-separated) supports Tailwind opacity modifiers: bg-ok/10, etc.
        stone:   {
          DEFAULT: 'rgb(var(--color-stone-rgb) / <alpha-value>)',
          2: 'rgb(var(--color-stone-2-rgb) / <alpha-value>)',
          3: 'rgb(var(--color-stone-3-rgb) / <alpha-value>)',
          4: 'rgb(var(--color-stone-4-rgb) / <alpha-value>)',
        },
        ink:     {
          DEFAULT: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
          2: 'rgb(var(--color-ink-2-rgb) / <alpha-value>)',
        },
        muted:   'rgb(var(--color-muted-rgb) / <alpha-value>)',
        rule:    'rgb(var(--color-rule-rgb) / <alpha-value>)',
        rule2:   'rgb(var(--color-rule2-rgb) / <alpha-value>)',
        ok:      { DEFAULT: 'rgb(var(--color-ok-rgb) / <alpha-value>)',      dim: 'rgb(var(--color-ok-dim-rgb) / <alpha-value>)' },
        warn:    { DEFAULT: 'rgb(var(--color-warn-rgb) / <alpha-value>)',    dim: 'rgb(var(--color-warn-dim-rgb) / <alpha-value>)' },
        danger:  { DEFAULT: 'rgb(var(--color-danger-rgb) / <alpha-value>)',  dim: 'rgb(var(--color-danger-dim-rgb) / <alpha-value>)' },
        signal:  { DEFAULT: 'rgb(var(--color-signal-rgb) / <alpha-value>)',  dim: 'rgb(var(--color-signal-dim-rgb) / <alpha-value>)', dark: 'rgb(var(--color-signal-dark-rgb) / <alpha-value>)', light: 'rgb(var(--color-signal-light-rgb) / <alpha-value>)' },
        context: { DEFAULT: 'rgb(var(--color-context-rgb) / <alpha-value>)', dim: 'rgb(var(--color-context-dim-rgb) / <alpha-value>)' },
        deep:    { DEFAULT: 'rgb(var(--color-deep-rgb) / <alpha-value>)',    dim: 'rgb(var(--color-deep-dim-rgb) / <alpha-value>)' },
        // Sidebar always stays dark — same values in both themes.
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar-rgb) / <alpha-value>)',
          2: 'rgb(var(--color-sidebar-2-rgb) / <alpha-value>)',
          3: 'rgb(var(--color-sidebar-3-rgb) / <alpha-value>)',
          border: 'rgb(var(--color-sidebar-border-rgb) / <alpha-value>)',
          ghost: 'rgb(var(--color-sidebar-ghost-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        body:    ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        display: ["'Bricolage Grotesque'", "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", "'Menlo'", 'monospace'],
      },
      fontSize: {
        // UI text — 4 steps
        micro:   ['10px', { lineHeight: '1.2' }],   // metadata, timestamps
        label:   ['11px', { lineHeight: '1.2' }],   // inline labels, badges
        body:    ['13px', { lineHeight: '1.45' }],  // primary reading text
        base:    ['15px', { lineHeight: '1.4' }],   // comfortable reading / subheadings
        // Numeric / display — 6 steps
        head:    ['18px', { lineHeight: '1.3' }],   // section titles, KPI labels
        title:   ['22px', { lineHeight: '1.2' }],   // stat values, callout numbers
        metric:  ['28px', { lineHeight: '1' }],     // KPI grid cells
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
        'btn': '2px',
      },
      boxShadow: {
        'raise':      'var(--shadow-raise)',
        'card':       'var(--shadow-card)',
        'card-alert': '0 1px 5px rgba(222,108,78,0.20)',
      },
      zIndex: {
        modal: '60',
        toast: '70',
      },
    },
  },
  plugins: [],
}
