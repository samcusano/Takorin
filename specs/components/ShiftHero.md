# ShiftHero — Component Spec

**Source:** `src/components/ShiftHero.jsx`  
**Category:** Layout · Header  
**Status:** Active (legacy API — prefer SceneHeader for new screens)

## Overview

**Use when:** ShiftIQ-specific header showing a large risk score, narrative statement, scan interval, trend sparkline, and atmospheric risk glow. It's the specialized header for the ShiftIQ screen.

**Don't use when:** Any screen other than ShiftIQ — use `SceneHeader` instead. `SceneHeader` has a more composable API and full theme support.

## Anatomy

1. Background gradient (stone-2 → stone)
2. Atmospheric risk glow overlay (9s pulse, animated)
3. Score block — large numeric risk score with status dot and label
4. Vertical rule — divides score from statement
5. Statement — narrative display text
6. Scan metadata — interval and trend with stream-colored value
7. Sparkline — small 90×36 SVG trend line (right-aligned, 65% opacity)

## Tokens used

| Token | Usage |
|---|---|
| `--color-stone`, `--color-stone-2` | Header background gradient |
| `--color-rule` | Vertical divider between score and statement |
| `--color-danger`, `--color-warn`, `--color-ok` | Risk color (score ≥ 75 = danger, ≥ 60 = warn, else ok) |
| `--color-stream` | Scan interval value highlight (cyan) |
| `--color-dim` | Secondary metadata labels |
| `--space-5`, `--space-6`, `--space-8` | Layout spacing |
| `--space-7` | Left padding for statement area |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `score` | number | 78 | Risk score 0–100 |
| `statement` | string | — | Narrative summary sentence |
| `scanInterval` | string | `'4 min'` | Live scan frequency label |
| `trend` | string | `'→ stable'` | Trend direction (↑/↓/→ prefix drives color) |
| `domainLabel` | string | `'Risk score'` | Label next to status dot |

## States

| Score range | Color | Label |
|---|---|---|
| ≥ 75 | `--color-danger` | At risk |
| 60–74 | `--color-warn` | Watch |
| < 60 | `--color-ok` | Clear |

| Trend prefix | Sparkline | Trend color |
|---|---|---|
| `↑` | Rising | `--color-danger` |
| `↓` | Falling | `--color-ok` |
| `→` | Flat | `--color-dim` |

## Code example

```jsx
<ShiftHero
  score={78}
  statement="Three factors elevated — staffing certification mismatch drives 18 points."
  scanInterval="4 min"
  trend="↑ rising"
  domainLabel="Risk score"
/>
```

## Cross-references

- `ShiftIQ` — primary consumer
- `SceneHeader` — modern equivalent with richer API
