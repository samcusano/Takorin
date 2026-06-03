# Color Foundation

## Philosophy

Takorin uses a **warm instrumentation** palette: dark graphite surfaces with warm bone text, paired with high-chroma semantic accents. Two themes (dark default, light opt-in) via data-theme attribute; system preference auto-mode is the fallback.

## Palette

### Surfaces (dark theme)

| Token | CSS Var | Dark value | Light value | Usage |
|---|---|---|---|---|
| Stone | `--color-stone` | `#0B0F18` | `#FCFBF9` | Base canvas, page background |
| Stone 2 | `--color-stone-2` | `#131A26` | `#F5F3EE` | Elevated panels, headers |
| Stone 3 | `--color-stone-3` | `#1B2538` | `#EAE7E0` | Section tints, hover targets |
| Stone 4 | `--color-stone-4` | `#263042` | `#DAD6CD` | Inset / recessed areas |

### Text

| Token | CSS Var | Dark value | Light value | Usage |
|---|---|---|---|---|
| Ink | `--color-ink` | `#EDE4CB` | `#160F08` | Primary body text |
| Ink 2 | `--color-ink-2` | `#9B9070` | `#484032` | Secondary text, captions |
| Muted | `--color-muted` | `#7A8EA8` | `#787062` | Labels, metadata, timestamps |
| Dim | `--color-dim` | `#4A5D74` | `#8C9498` | Ghost / suppressed text |

### Borders

| Token | CSS Var | Dark value | Light value | Usage |
|---|---|---|---|---|
| Rule | `--color-rule` | `#263042` | `#CEC8BC` | Strong borders, dividers |
| Rule 2 | `--color-rule-2` | `#1A2335` | `#E4E1DA` | Soft borders, standard |

### Semantic status

| Token | CSS Var | Dark value | Light value | Meaning |
|---|---|---|---|---|
| OK | `--color-ok` | `#5FA877` | `#1E6438` | Clear, pass, healthy |
| OK dim | `--color-ok` (with opacity) | `#0D2518` | `#DCF0E4` | OK tinted background |
| Warn | `--color-warn` | `#C98E2A` | `#8C5C0A` | Watch, caution, off-target |
| Warn dim | `--color-warn` (with opacity) | `#2A1E08` | `#FCF2DA` | Warn tinted background |
| Danger | `--color-danger` | `#DE6C4E` | `#A82C1C` | At-risk, fail, critical |
| Danger dim | `--color-danger` (with opacity) | `#2A100A` | `#FCE4E0` | Danger tinted background |

### Accents

| Token | CSS Var | Dark value | Usage |
|---|---|---|---|
| Signal | `--color-signal` | `#4B9CE4` | Primary interactive, links, selection |
| Signal dark | `--color-signal-dark` | `#2A6AAD` | Hover/pressed signal state |
| Signal light | `--color-signal-light` | `#7BBDEE` | Sparklines, data traces |
| Context | `--color-context` | `#C4844E` | Narrative clay accent, contextual data |
| Deep | `--color-deep` | `#7C86E8` | AI/predictive features, indigo accent |
| Stream | `--color-stream` | `#3BBFDA` | Live data stream indicators, scan interval |

### Sidebar (always dark, never themed)

| Token | CSS Var | Value |
|---|---|---|
| Sidebar | `--color-sidebar` | `#080D16` |
| Sidebar 2 | `--color-sidebar-2` | `#0E1520` |
| Sidebar 3 | `--color-sidebar-3` | `#152030` |
| Sidebar border | `--color-sidebar-border` | `#1C2A40` |

## RGB Channel Variables

Every color has an `--color-X-rgb` variant containing space-separated RGB channels. Use for:

```css
/* Tailwind opacity modifier */
bg-danger/10

/* CSS opacity composition */
background: rgb(var(--color-danger-rgb) / 0.13);

/* Gradient with themed color */
background: rgb(var(--color-ok-rgb) / 0.04);
```

## Semantic Role Aliases

Prefer semantic roles over palette tokens in new code:

| Alias | Maps to | Use for |
|---|---|---|
| `--surface` | `--color-stone` | Page background |
| `--surface-raised` | `--color-stone-2` | Card/panel backgrounds |
| `--surface-tint` | `--color-stone-3` | Section backgrounds, hovers |
| `--surface-inset` | `--color-stone-4` | Inset areas, indented blocks |
| `--on-surface` | `--color-ink` | Primary text |
| `--on-surface-dim` | `--color-ink-2` | Secondary text |
| `--on-surface-subtle` | `--color-muted` | Labels, metadata |
| `--border-strong` | `--color-rule` | Hard separation |
| `--border-soft` | `--color-rule-2` | Standard borders |
| `--interactive` | `--color-signal` | Primary interactive |

## Rules

- Never use raw hex values in component code — always use CSS custom properties
- When you need opacity variants, use `rgb(var(--color-X-rgb) / alpha)` not `rgba(r,g,b,a)`
- Sidebar stays dark in all themes — use `--color-sidebar-*` tokens exclusively inside the sidebar
- Status colors (ok/warn/danger) drive the `tone` prop on components like `SceneHeader` and `StatusPill`
