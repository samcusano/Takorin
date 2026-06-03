# Token Reference — Master Map

Every CSS custom property in `src/tokens.css`, its resolved value (dark theme), and when to use it.

## Color — RGB channels (Layer 1 / 2)

Use the `-rgb` variant when you need opacity composition.

```css
/* Pattern: opacity alpha composition */
background: rgb(var(--color-danger-rgb) / 0.13);
fill: rgb(var(--color-ok-rgb) / 0.04);
```

| Variable | Dark value (RGB) | Notes |
|---|---|---|
| `--color-stone-rgb` | `11 15 24` | Base canvas |
| `--color-stone-2-rgb` | `19 26 38` | Raised panels |
| `--color-stone-3-rgb` | `27 37 56` | Section tints |
| `--color-stone-4-rgb` | `38 48 66` | Inset areas |
| `--color-ink-rgb` | `237 228 203` | Primary text |
| `--color-ink-2-rgb` | `155 144 112` | Secondary text |
| `--color-muted-rgb` | `122 142 168` | Labels, metadata |
| `--color-rule-rgb` | `38 48 66` | Strong borders |
| `--color-rule2-rgb` | `26 35 53` | Soft borders |
| `--color-ok-rgb` | `95 168 119` | Healthy / pass |
| `--color-warn-rgb` | `201 142 42` | Caution |
| `--color-danger-rgb` | `222 108 78` | Critical / fail |
| `--color-signal-rgb` | `75 156 228` | Interactive |
| `--color-context-rgb` | `196 132 78` | Narrative clay |
| `--color-deep-rgb` | `124 134 232` | AI / predictive |
| `--color-stream-rgb` | `59 191 218` | Live data stream |

## Color — computed (Layer 2)

Use directly in `color:`, `background:`, `stroke:`, `fill:` properties.

| Variable | Dark value | Usage |
|---|---|---|
| `--color-stone` | `#0B0F18` | Page background |
| `--color-stone-2` | `#131A26` | Raised panel background |
| `--color-stone-3` | `#1B2538` | Section tint, hover |
| `--color-stone-4` | `#263042` | Inset / recessed |
| `--color-ink` | `#EDE4CB` | Primary text |
| `--color-ink-2` | `#9B9070` | Secondary text |
| `--color-muted` | `#7A8EA8` | Labels, metadata |
| `--color-rule` | `#263042` | Hard borders |
| `--color-rule-2` | `#1A2335` | Soft borders |
| `--color-ok` | `#5FA877` | OK status |
| `--color-warn` | `#C98E2A` | Warn status |
| `--color-danger` | `#DE6C4E` | Danger status |
| `--color-signal` | `#4B9CE4` | Interactive / link |
| `--color-signal-dark` | `#2A6AAD` | Signal hover/pressed |
| `--color-signal-light` | `#7BBDEE` | Sparklines, data traces |
| `--color-context` | `#C4844E` | Narrative clay |
| `--color-deep` | `#7C86E8` | AI / predictive indigo |
| `--color-stream` | `#3BBFDA` | Live data / scan interval |
| `--color-dim` | `#4A5D74` | Ghost text, suppressed |
| `--color-sidebar` | `#080D16` | Sidebar base (always dark) |
| `--color-sidebar-2` | `#0E1520` | Sidebar surface |
| `--color-sidebar-3` | `#152030` | Sidebar section |
| `--color-sidebar-border` | `#1C2A40` | Sidebar dividers |

## Color — semantic roles

Prefer these over palette tokens for maximum theme-independence.

| Variable | Alias for | Use for |
|---|---|---|
| `--surface` | `--color-stone` | Base canvas |
| `--surface-raised` | `--color-stone-2` | Cards, panels |
| `--surface-tint` | `--color-stone-3` | Section bg, hover |
| `--surface-inset` | `--color-stone-4` | Inset blocks |
| `--on-surface` | `--color-ink` | Primary text |
| `--on-surface-dim` | `--color-ink-2` | Secondary text |
| `--on-surface-subtle` | `--color-muted` | Labels |
| `--border-strong` | `--color-rule` | Hard lines |
| `--border-soft` | `--color-rule-2` | Standard borders |
| `--interactive` | `--color-signal` | Interactive elements |
| `--status-ok` | `--color-ok` | Health indicator |
| `--status-warn` | `--color-warn` | Caution indicator |
| `--status-danger` | `--color-danger` | Risk indicator |

## Spacing

| Variable | Value | Tailwind equiv |
|---|---|---|
| `--space-px` | 1px | px |
| `--space-1` | 4px | gap-1, p-1 |
| `--space-2` | 8px | gap-2, p-2 |
| `--space-3` | 12px | gap-3, p-3 |
| `--space-4` | 16px | gap-4, p-4 |
| `--space-5` | 20px | gap-5, p-5 |
| `--space-6` | 24px | gap-6, p-6 |
| `--space-7` | 28px | gap-7, p-7 |
| `--space-8` | 32px | gap-8, p-8 |
| `--space-10` | 40px | gap-10, p-10 |
| `--space-12` | 48px | gap-12, p-12 |
| `--space-16` | 64px | gap-16, p-16 |

## Typography

| Variable | Value |
|---|---|
| `--font-family-body` | 'Plus Jakarta Sans', system-ui, sans-serif |
| `--font-family-display` | 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif |
| `--font-family-mono` | 'JetBrains Mono', 'Menlo', monospace |
| `--font-size-nano` | 11px |
| `--font-size-label` | 12px |
| `--font-size-body` | 14px |
| `--font-size-sub` | 16px |
| `--font-size-head` | 20px |
| `--font-size-title` | 24px |
| `--font-size-metric` | 32px |
| `--font-size-score` | 52px |
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |
| `--line-height-none` | 1 |
| `--line-height-tight` | 1.15 |
| `--line-height-snug` | 1.25 |
| `--line-height-normal` | 1.4 |
| `--line-height-relaxed` | 1.5 |

## Border radius

| Variable | Value | Usage |
|---|---|---|
| `--radius-btn` | 2px | Buttons, chips |
| `--radius-sm` | 2px | Small UI elements |
| `--radius-md` | 6px | Cards, panels |
| `--radius-lg` | 10px | Modals, drawers |
| `--radius-full` | 9999px | Pills, avatars, dots |

## Elevation / shadows

| Variable | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 1px 4px rgba(0,0,0,0.30)` | Card lift |
| `--shadow-raise` | `0 4px 20px rgba(0,0,0,0.45)` | Floating |
| `--shadow-overlay` | `0 2px 12px rgba(0,0,0,0.40)` | Detail overlays |
| `--shadow-modal` | `0 16px 48px rgba(0,0,0,0.50)` | Full modals |
| `--shadow-card-alert` | `0 1px 5px rgba(222,108,78,0.20)` | Alert cards |

## Motion — duration

| Variable | Value | Usage |
|---|---|---|
| `--dur-instant` | 50ms | Micro-feedback |
| `--dur-fast` | 100ms | Hover, focus rings |
| `--dur-quick` | 200ms | UI state changes |
| `--dur-standard` | 300ms | Most transitions |
| `--dur-data` | 500ms | Data bar widths |
| `--dur-live` | 6000ms | Countdown bars |
| `--dur-atmo` | 9000ms | Ambient pulses |

## Motion — easing

| Variable | Curve | Usage |
|---|---|---|
| `--ease-linear` | `cubic-bezier(0,0,1,1)` | Progress bars |
| `--ease-standard` | `cubic-bezier(0.25,0.1,0.25,1)` | General |
| `--ease-enter` | `cubic-bezier(0.19,0.91,0.38,1)` | Entering elements |
| `--ease-exit` | `cubic-bezier(0.42,0,1,1)` | Exiting elements |
| `--ease-inout` | `cubic-bezier(0.42,0,0.58,1)` | Symmetric |
| `--ease-spring` | `cubic-bezier(0.16,1,0.3,1)` | Spring/bounce |

## Z-index

| Variable | Value | Usage |
|---|---|---|
| `--z-base` | 0 | Default stacking |
| `--z-sticky` | 10 | Sticky headers |
| `--z-dropdown` | 20 | Dropdowns, tooltips |
| `--z-overlay` | 40 | Overlay backdrops |
| `--z-sidebar` | 50 | Sidebar (z-30 in Tailwind) |
| `--z-modal` | 60 | Modals |
| `--z-toast` | 70 | Toast notifications |
