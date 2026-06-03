# StatBar — Component Spec

**Source:** `src/components/StatBar.jsx`  
**Category:** Display · Metrics  
**Status:** Active

## Overview

**Use when:** Displaying 3–6 key metrics in a horizontal bar across the top of a screen, below the `SceneHeader`. Each cell shows a value, label, optional sub-label, and a tone-colored mini progress bar.

**Don't use when:** Fewer than 2 metrics (use inline `StatCell` from `UI.jsx` instead). Single large hero metrics — use `SceneHeader.metric` instead.

## Anatomy

1. Container bar (full width, bordered bottom)
2. `StatCell` — one per metric, separated by vertical borders
   - Mini progress bar (tone-colored, bottom of cell)
   - Label (secondary, muted)
   - Value (primary, display-num)
   - Optional sub-label (nano, muted)

## Tokens used

| Token | Usage |
|---|---|
| `--color-stone-2` | Cell background |
| `--color-rule-2` | Border between cells |
| `--color-ok` / `--color-warn` / `--color-danger` | Progress bar fill (tone-driven) |
| `--color-muted` | Label and sub-label text |
| `--color-ink` | Value text |
| `--dur-data`, `--ease-enter` | Progress bar width transition |

## Props

### StatBar

| Prop | Type | Description |
|---|---|---|
| `cells` | `StatCell[]` | Array of cell configs |

### StatCell (exported, also usable standalone)

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | string | — | Metric name |
| `value` | string\|number | — | Primary value |
| `sub` | string | — | Sub-label (below value) |
| `pct` | number | — | 0–100, drives progress bar width |
| `type` | `'so'\|'bar'` | `'so'` | Cell layout variant |

## States

Progress bar transitions on initial render via `.bar-grow` animation class.

## Code example

```jsx
<StatBar cells={[
  { label: 'OEE',    value: '78%',    pct: 78,  tone: 'warn' },
  { label: 'Yield',  value: '94.2%',  pct: 94,  tone: 'ok'   },
  { label: 'Alerts', value: '3',      pct: 30,  tone: 'danger' },
]} />
```

## Cross-references

- `SceneHeader` — header that typically sits above the StatBar
- `StatCell` from `UI.jsx` — standalone metric cell without the bar
