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

        // ── Semantic aliases — same CSS vars as palette, theme-aware by design ──
        // Use these for new code; palette tokens remain for existing code.
        // Both resolve identically — bg-surface === bg-stone, etc.
        surface:         'rgb(var(--color-stone-rgb) / <alpha-value>)',    // base canvas
        'surface-raised':'rgb(var(--color-stone-2-rgb) / <alpha-value>)', // elevated panels, headers
        'surface-tint':  'rgb(var(--color-stone-3-rgb) / <alpha-value>)', // section backgrounds, hover targets
        'surface-inset': 'rgb(var(--color-stone-4-rgb) / <alpha-value>)', // inset / recessed areas
        'on-surface':    'rgb(var(--color-ink-rgb) / <alpha-value>)',      // primary text
        'on-surface-dim':'rgb(var(--color-ink-2-rgb) / <alpha-value>)',    // secondary text
        'on-surface-subtle':'rgb(var(--color-muted-rgb) / <alpha-value>)',  // labels, metadata
        'border-strong': 'rgb(var(--color-rule-rgb) / <alpha-value>)',     // hard separation
        'border-soft':   'rgb(var(--color-rule2-rgb) / <alpha-value>)',    // standard border
        interactive:     'rgb(var(--color-signal-rgb) / <alpha-value>)',   // primary interactive
      },
      fontFamily: {
        body:    ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        display: ["'Bricolage Grotesque'", "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", "'Menlo'", 'monospace'],
      },
      fontSize: {
        // UI text — 5 steps (floor raised to 11px; body up 1px for stress legibility)
        nano:    ['11px', { lineHeight: '1.35' }],  // metadata, timestamps, chip text
        label:   ['12px', { lineHeight: '1.35' }],  // secondary labels, badge text
        body:    ['14px', { lineHeight: '1.5'  }],  // primary reading text
        sub:     ['16px', { lineHeight: '1.4'  }],  // section subheadings, prominent labels
        // Numeric / display — 5 steps (hero + jumbo removed; score suffices at top)
        head:    ['20px', { lineHeight: '1.25' }],  // panel headers, screen section heads
        title:   ['24px', { lineHeight: '1.15' }],  // callout numbers, stat values
        metric:  ['32px', { lineHeight: '1'    }],  // KPI grid cells
        score:   ['52px', { lineHeight: '1'    }],  // hero risk / shift scores — top of scale
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
