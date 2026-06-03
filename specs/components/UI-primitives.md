# UI Primitives — Component Spec

**Source:** `src/components/UI.jsx`

---

## SceneHeader

**Category:** Layout · Header  
**Status:** Active

### Overview

**Use when:** Every screen needs a single `SceneHeader` at the top. It contains the module identifier, live status, primary metric, narrative statement, and optional sparkline. It is the most important piece of hierarchy on a screen.

**Don't use when:** You need a section heading inside a screen — use `SectionHeader` instead. Never nest `SceneHeader` inside another `SceneHeader`.

### Anatomy

1. Module bar — module label, context string, live dot, timestamp
2. Metric block — large score number with color and label dot
3. Narrative statement — display-font sentence describing the situation
4. Meta row — up to 5 quick-stat pairs
5. Sparkline — optional trend SVG (right-aligned)
6. Children slot — signal strip, action bar, or tab bar

### Tokens used

- `--color-stone-2`, `--color-stone` — header gradient background
- `--color-signal` — live dot, meta value color, sparkline default
- `--color-rule` — vertical divider between metric and statement
- `--dur-atmo` — atmospheric glow animation duration
- Tone-driven: `atmo-glow-danger/warn/ok` class on the glow overlay

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `module` | string | — | Module name e.g. "SHIFT IQ" |
| `context` | string | — | Location/context e.g. "Line 4 · AM Shift" |
| `live` | boolean | false | Show animated live dot |
| `timestamp` | string | — | Time string e.g. "06:42" |
| `metric` | number\|string | — | Primary large value |
| `metricColor` | CSS color | tone color | Override metric color |
| `metricLabel` | string | — | Label below metric |
| `statement` | string | — | Narrative sentence |
| `meta` | `[{label, value, color, icon}]` | `[]` | Quick-stat row items |
| `tone` | `'danger'\|'warn'\|'ok'\|'muted'` | `'muted'` | Drives glow and default metric color |
| `sparkline` | `{points: number[], label: string, color: string}` | — | Trend sparkline |
| `children` | ReactNode | — | Footer slot (tabs, actions) |

### States

| State | Visual |
|---|---|
| muted | No glow, metric in `--color-ink` |
| ok | Green ambient glow (9s pulse), metric in `--color-ok` |
| warn | Amber ambient glow, metric in `--color-warn` |
| danger | Rust ambient glow, metric in `--color-danger` |

### Code example

```jsx
<SceneHeader
  module="SHIFT IQ"
  context="Line 4 · AM Shift"
  live
  timestamp="06:42"
  metric={78}
  metricLabel="Risk score"
  statement="Three factors elevated above threshold — staffing certification mismatch drives 18 points."
  tone="danger"
  meta={[
    { label: 'Shift', value: 'AM', color: 'var(--color-signal)' },
    { label: 'Crew', value: '14 / 15', color: 'var(--color-ok)' },
  ]}
/>
```

### Cross-references

- `StatusPill` — use in the `children` slot for signal strip items
- `ShiftHero` — legacy header for ShiftIQ screens, older API

---

## StatusPill

**Category:** Display · Status  
**Status:** Active

### Overview

**Use when:** Displaying a status or classification that needs a tone-colored background.

**Don't use when:** The item is interactive — use `Btn` instead.

### Anatomy

1. Optional icon (left)
2. Text label

### Tokens used

- Tone-driven: `text-danger/warn/ok/signal/muted`, `bg-danger/warn/ok/signal/stone3` with opacity
- `--radius-full` — pill shape

### Props

| Prop | Type | Description |
|---|---|---|
| `tone` | `'danger'\|'warn'\|'ok'\|'int'\|'muted'` | Color tone |
| `children` | ReactNode | Label text |
| `icon` | Lucide icon | Optional left icon |

---

## Btn

**Category:** Interactive · Action  
**Status:** Active

### Overview

**Use when:** A user needs to trigger an action.

**Don't use when:** Navigation — use `<Link>` instead. Inline text actions — use a plain `<button>` with Tailwind utility classes.

### Anatomy

1. Optional icon (left of label)
2. Label text

### Tokens used

- `--radius-btn` — 2px button radius
- `--color-signal`, `--color-stone-3`, `--color-rule` — variant fills
- `--dur-fast`, `--ease-enter` — hover/active transitions

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary'\|'secondary'\|'ghost'\|'danger'` | `'primary'` | Visual style |
| `icon` | Lucide icon | — | Left icon |
| `onClick` | function | — | Click handler |
| `disabled` | boolean | false | Disabled state |

### States

| State | Visual |
|---|---|
| Default | Filled per variant |
| Hover | Slight fill change, cursor pointer |
| Active | Slight scale down |
| Disabled | Reduced opacity, cursor not-allowed |
| Focus | 2px signal outline, 3px offset |

---

## SectionHeader

**Category:** Layout · Hierarchy  
**Status:** Active

### Overview

A secondary heading inside a screen panel. Not a `SceneHeader`.

### Props

| Prop | Type | Description |
|---|---|---|
| `label` | string | Primary label |
| `sub` | string | Sub-label |
| `tone` | tone string | Color accent |
| `icon` | Lucide icon | Left icon |
| `accent` | CSS color | Accent color for left border |
| `badge` | string | Badge text |

---

## SlidePanel

**Category:** Overlay · Detail  
**Status:** Active

### Overview

**Use when:** Showing detailed information for a selected item without leaving the screen. A right-anchored overlay that fills up to `maxWidth` from the right edge.

**Don't use when:** Requiring confirmation — use `Modal` or `HoldButton` instead.

### Tokens used

- `--shadow-modal` — drop shadow
- `--z-modal` — stacking context (60)
- `--ease-spring` / `--dur-standard` — slide animation
- `--color-stone-2` — panel background

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Panel title |
| `subtitle` | string | — | Panel subtitle |
| `icon` | Lucide icon | — | Title icon |
| `accentColor` | CSS color | signal | Left border and icon color |
| `onClose` | function | — | Close handler |
| `footer` | ReactNode | — | Footer actions |
| `maxWidth` | string | `'400px'` | Panel width cap |

---

## Modal

**Category:** Overlay · Blocking  
**Status:** Active

### Tokens used

- `--shadow-modal`
- `--z-modal` (60)
- `--ease-spring`, `--ease-exit` — `.modal-enter`, `.modal-exit`
- `--radius-md` — modal border radius

---

## HoldButton

**Category:** Interactive · Confirmation  
**Status:** Active

### Overview

**Use when:** A destructive or consequential action needs deliberate intent (hold to confirm pattern). `duration` defaults to 1500ms.

### Tokens used

- `--dur-data` — progress bar fill duration
- `--ease-enter` — progress transition
- Tone-driven fill colors

---

## AnimatedScore

**Category:** Display · Metric  
**Status:** Active

### Overview

Animates a number changing value using `@number-flow/react`. Use for KPI values that update in real-time.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | number | — | Numeric value |
| `suffix` | string | — | Unit suffix |
| `effect` | `'none'\|'glow'\|'blur'` | `'none'` | Entry animation |
| `hero` | boolean | false | Use `text-score` size |

---

## PageEntrance

**Category:** Animation · Layout  
**Status:** Active

### Overview

Wraps content with staggered entrance animations. Apply to screen sections to create a cascade effect on route entry.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `index` | number | 0 | Stagger index (multiplied by `stagger` ms) |
| `type` | `'rise'\|'fade'\|'wipe'\|'blur'` | `'rise'` | Animation type |
| `stagger` | number | 45 | Delay per index in ms |

---

## FilterDropdown / MultiFilterDropdown

**Category:** Interactive · Filter  
**Status:** Active

**Use when:** Filtering a list by a single category (`FilterDropdown`) or multiple categories (`MultiFilterDropdown`).

### Tokens used

- `--color-stone-2`, `--color-stone-3` — background states
- `--shadow-raise` — dropdown shadow
- `--z-dropdown` — stacking (20)
- `--ease-spring`, `--dur-quick` — open/close animation
