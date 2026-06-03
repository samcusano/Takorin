# Charts — Component Spec

**Source:** `src/components/Charts.jsx`  
**Category:** Data visualization  
**Status:** Active

## Overview

Hand-rolled SVG chart components. No chart library dependency. All use CSS custom properties for color — do not pass raw hex values to chart props.

## Components

### AlluvialDiagram

**Use when:** Showing categorical flow across 3 stages (Agent → Decision → Outcome). Not for quantitative flows (use Sankey for that).

**Props:**

| Prop | Type | Description |
|---|---|---|
| `data` | alluvial data structure | See ImpactLoop data format |
| `colorMap` | object | Maps category names to CSS color values |

**Tokens used:**
- `C.ok`, `C.warn`, `C.danger`, `C.signal` (via CSS vars)
- `var(--color-muted)` — label text
- `var(--color-stone-2)` — ribbon highlight on hover

---

### SparkBar / MicroBar

**Use when:** Showing trend direction over a short history (last N readings) in tight spaces.

**Tokens used:**
- `C.ok`, `C.warn`, `C.danger`, `C.signal` — bar fill colors
- `var(--color-dim)` — inactive bars

---

### HeatGrid

**Use when:** Visualizing a matrix of values (e.g., shift × day quality grid).

**Tokens used:**
- `var(--color-stone-3, #1B2538)` — empty cell fill
- `var(--color-stone, #0B0F18)` — X mark stroke in missing cells
- `var(--color-rule-2, #1A2335)` — grid lines
- Color scale from `colorMap` prop (must use CSS vars)

---

### RadarChart

**Use when:** Comparing N dimensions of a single entity (e.g., supplier scorecard).

**Tokens used:**
- `var(--color-rule-2)` — axis lines
- `C.signal` — polygon fill
- `var(--color-muted)` — axis labels

---

## Shared color constants

```js
const C = {
  ok:     'var(--color-ok)',
  warn:   'var(--color-warn)',
  danger: 'var(--color-danger)',
  signal: 'var(--color-signal)',
  muted:  'var(--color-muted)',
  ink:    'var(--color-ink)',
  rule2:  'var(--color-stone-2)',
  dim:    'var(--color-dim)',
}
```

Never add raw hex values to this object. If a new color is needed, add it to `tokens.css` first, then reference it as `var(--color-X)`.

## SVG color rules

SVG presentation attributes support CSS custom properties:
```jsx
/* Valid — CSS var in SVG attribute */
<line stroke="var(--color-danger)" />
<rect fill="rgb(var(--color-ok-rgb) / 0.04)" />

/* Not valid */
<line stroke="#E55" />
<rect fill="rgba(58,158,111,0.04)" />
```

## Cross-references

- `ImpactLoop` — uses AlluvialDiagram
- `EquipmentIntelligence` — uses SPC charts (inline, not from Charts.jsx)
- `Analytics` — uses MicroBar, HeatGrid
