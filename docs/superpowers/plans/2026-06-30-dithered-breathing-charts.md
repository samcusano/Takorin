# Dithered, Breathing Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit Takorin's existing area/value charts (`WaveformSparkline`, `MiniSparkline`, `SparkBar`) with a density-graded Bayer-dithered fill and an optional "breathing" animation reserved for live data.

**Architecture:** One pure shared engine (`src/lib/dither.js`) generates an ordered-dithered dot grid (graded dense-near-line → sparse-near-baseline) for the SVG charts, and a matching CSS background/mask helper for the `<div>`-based `SparkBar`. Breathing is CSS-only (position-derived `animation-delay`, no JS loop), gated behind a `live` prop and disabled under `prefers-reduced-motion`. A dev-only `/__dither_lab` screen lets the look be tuned before it ships to real screens.

**Tech Stack:** React (no new deps), hand-rolled SVG, CSS custom properties, Vite. Engine unit tests via Node's built-in test runner (`node --test`, zero new deps).

## Global Constraints

- **Tokens only.** No raw hex, `rgb()`, or `rgba()` in any `.jsx`/`.js`/`.css` component file — these are audit **errors** (exit 1). Use `var(--color-X)`, `currentColor`, `transparent`, or `rgb(var(--color-X-rgb) / alpha)`.
- **No raw `cubic-bezier`** — use `var(--ease-*)`. **No raw `\d+ms`** in transitions/animations outside `@keyframes` — use `var(--dur-*)`. (Audit **warnings**; CLAUDE.md requires reviewing them.)
- New tokens go in `src/tokens.css` (Layer 1 primitive + Layer 2 semantic alias with fallback) **before use**, and are documented in `specs/tokens/token-reference.md`.
- SVG geometry attributes (`cx`, `cy`, `r`, `x`, `y`, `width`, `height`) may use raw numbers — this is the established `Charts.jsx` convention and is not audited.
- Breathing must be disabled under `@media (prefers-reduced-motion: reduce)` and must not run unless `live` is true.
- The audit gate is `node scripts/token-audit.js` (must show **0 errors**). The build gate is `npm run build` (must compile clean). There is no app test runner; visual behavior is verified manually in the browser at the routes named per task.
- Existing callers that pass neither `live` nor `dither` must keep working (dither on, breathing off by default; flat fill reachable via `dither={false}`).

---

## File Structure

- `src/lib/dither.js` — **create.** Pure engine: `BAYER_4` matrix, `computeDitherDots(...)` (SVG dot grid), `ditherBarStyle(...)` (CSS background/mask for bars). No React imports.
- `test/dither.test.mjs` — **create.** `node --test` unit tests for the engine.
- `src/tokens.css` — **modify.** Add dither Layer 1 + Layer 2 tokens.
- `specs/tokens/token-reference.md` — **modify.** Document the new tokens.
- `src/index.css` — **modify.** Breathing `@keyframes` + `.dither-breathe` / `.dither-breathe-bar` classes + reduced-motion guard.
- `src/components/UI.jsx` — **modify.** `WaveformSparkline` (dither fill + `live`/`dither` props), `MetricCard` (`live` pass-through).
- `src/screens/PlantOverview.jsx` — **modify.** `MiniSparkline` (add area + dither + `live`).
- `src/components/AgentTimeline.jsx` — **modify.** `SparkBar` (CSS dither fill, active bar breathes).
- `src/screens/__DitherLab.jsx` — **create.** Dev-only tuning/preview screen.
- `src/App.jsx` — **modify.** Lazy import + dev-gated route for `/__dither_lab`.

---

## Task 1: Dither tokens

**Files:**
- Modify: `src/tokens.css` (Layer 1 after line 131; Layer 2 after line 291)
- Modify: `specs/tokens/token-reference.md` (Motion section, ~line 146)

**Interfaces:**
- Produces: CSS custom properties `--dither-cell`, `--dither-fill`, `--dither-fill-min` (Layer 2, consumed by index.css, dither.js consumers, and components). Breathing duration reuses existing `--dur-atmo`; easing reuses `--ease-inout`.

- [ ] **Step 1: Add Layer 1 primitives.** In `src/tokens.css`, after line 131 (`--prim-dur-atmo: 9000ms;`) and the blank line, insert before the `--prim-ease-linear` block:

```css

  /* ── Dither / texture primitives ─────────────────────────────────────────
     Cell = dot grid pitch; fill = base dot opacity; fill-min = breathing trough. */
  --prim-dither-cell:      3px;
  --prim-dither-fill:      0.55;
  --prim-dither-fill-min:  0.30;
```

- [ ] **Step 2: Add Layer 2 semantic aliases.** In `src/tokens.css`, after line 291 (`--dur-atmo: ...;`) and its blank line, before the `--ease-linear` block, insert:

```css
  /* ── Dither texture ──────────────────────────────────────────────────── */
  --dither-cell:     var(--prim-dither-cell,     3px);
  --dither-fill:     var(--prim-dither-fill,     0.55);
  --dither-fill-min: var(--prim-dither-fill-min, 0.30);
```

- [ ] **Step 3: Document in token-reference.** In `specs/tokens/token-reference.md`, add a new section after the "Motion — easing" section:

```markdown
## Dither texture

| Token | Value | Use |
|-------|-------|-----|
| `--dither-cell` | `3px` | Dot grid pitch for chart dither fills (SVG + CSS bar backgrounds) |
| `--dither-fill` | `0.55` | Base dot opacity for dithered chart fills |
| `--dither-fill-min` | `0.30` | Opacity trough of the breathing animation |

Breathing motion reuses `--dur-atmo` (9000ms) and `--ease-inout`. Disabled under `prefers-reduced-motion`.
```

- [ ] **Step 4: Run the token audit.**

Run: `node scripts/token-audit.js`
Expected: `0 error(s)` (warnings unchanged from baseline). Exit code 0.

- [ ] **Step 5: Run the build.**

Run: `npm run build`
Expected: builds with no errors.

- [ ] **Step 6: Commit.**

```bash
git add src/tokens.css specs/tokens/token-reference.md
git commit -m "feat(tokens): add dither texture tokens"
```

---

## Task 2: Dither engine

**Files:**
- Create: `src/lib/dither.js`
- Test: `test/dither.test.mjs`

**Interfaces:**
- Produces:
  - `BAYER_4: number[][]` — 4×4 normalized threshold matrix, every value in `(0,1)`.
  - `computeDitherDots({ width, height, points, baselineY?, cell?, dotR? }): Array<{ cx, cy, r, key, delayFrac }>` — `points` is `[{x, y}]` (line vertices, `y` is the top of the fill at that `x`). Returns dots inside the filled area, denser near the line. `delayFrac` ∈ `[0,1]` (x-position fraction) for breathing stagger. Returns `[]` if `points.length < 2`.
  - `ditherBarStyle(): object` — inline-style object (`backgroundImage`, `backgroundSize`, `WebkitMaskImage`, `maskImage`) rendering a density-graded dot field via `currentColor`, for the `SparkBar` `<div>`.

- [ ] **Step 1: Write the failing test.** Create `test/dither.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BAYER_4, computeDitherDots, ditherBarStyle } from '../src/lib/dither.js'

test('BAYER_4 is a 4x4 matrix of thresholds strictly within (0,1)', () => {
  assert.equal(BAYER_4.length, 4)
  for (const row of BAYER_4) {
    assert.equal(row.length, 4)
    for (const v of row) {
      assert.ok(v > 0 && v < 1, `threshold ${v} out of (0,1)`)
    }
  }
  // 16 distinct ordered values
  const flat = BAYER_4.flat()
  assert.equal(new Set(flat).size, 16)
})

test('computeDitherDots returns [] for fewer than 2 points', () => {
  assert.deepEqual(computeDitherDots({ width: 100, height: 44, points: [] }), [])
  assert.deepEqual(computeDitherDots({ width: 100, height: 44, points: [{ x: 0, y: 0 }] }), [])
})

test('all dots fall inside the filled area and have valid metadata', () => {
  const width = 100, height = 44
  const points = [{ x: 0, y: 10 }, { x: 50, y: 5 }, { x: 100, y: 20 }]
  const dots = computeDitherDots({ width, height, points })
  assert.ok(dots.length > 0)
  for (const d of dots) {
    assert.ok(d.cx >= 0 && d.cx <= width)
    assert.ok(d.cy >= 0 && d.cy <= height)
    assert.ok(d.cy >= 5, 'no dot above the highest line point')
    assert.equal(typeof d.key, 'string')
    assert.ok(d.delayFrac >= 0 && d.delayFrac <= 1)
  }
})

test('density is graded: rows near the line are denser than rows near the baseline', () => {
  // Flat line near the top; baseline at the bottom.
  const width = 100, height = 60
  const points = [{ x: 0, y: 2 }, { x: 100, y: 2 }]
  const dots = computeDitherDots({ width, height, points, cell: 3 })
  const nearLine = dots.filter(d => d.cy < height * 0.25).length
  const nearBase = dots.filter(d => d.cy > height * 0.75).length
  assert.ok(nearLine > nearBase, `expected denser near line (${nearLine}) than base (${nearBase})`)
})

test('ditherBarStyle exposes a masked currentColor dot field with no raw colors', () => {
  const s = ditherBarStyle()
  assert.match(s.backgroundImage, /currentColor/)
  assert.match(s.backgroundSize, /--dither-cell/)
  assert.match(s.maskImage, /currentColor/)
  // never emit raw hex / rgb()
  assert.doesNotMatch(JSON.stringify(s), /#[0-9a-f]{3}|rgb\(/i)
})
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `node --test test/dither.test.mjs`
Expected: FAIL — `Cannot find module '../src/lib/dither.js'`.

- [ ] **Step 3: Write the engine.** Create `src/lib/dither.js`:

```js
// ── Dither engine ─────────────────────────────────────────────────────────────
// Pure, framework-free. Generates ordered (Bayer) dithered dot grids for SVG
// area charts, and a matching CSS dot-field style for <div>-based bars.
// Geometry constants are raw numbers by the Charts.jsx convention; they mirror
// the --dither-* tokens (keep DITHER_CELL in sync with --prim-dither-cell).

const DITHER_CELL = 3   // mirrors --dither-cell
const DOT_R = 0.9       // dot radius in SVG units

// Normalized 4×4 Bayer ordered-dither thresholds in (0,1).
export const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(row => row.map(v => (v + 0.5) / 16))

// Linear interpolation of the line's y (top of the fill) at a given x.
function topAtFactory(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x)
  const first = sorted[0], last = sorted[sorted.length - 1]
  return (x) => {
    if (x <= first.x) return first.y
    if (x >= last.x) return last.y
    for (let i = 1; i < sorted.length; i++) {
      if (x <= sorted[i].x) {
        const a = sorted[i - 1], b = sorted[i]
        const t = (x - a.x) / ((b.x - a.x) || 1)
        return a.y + t * (b.y - a.y)
      }
    }
    return last.y
  }
}

// Returns dots covering the area between the line and the baseline, dithered so
// density is highest at the line and falls toward the baseline.
export function computeDitherDots({ width, height, points, baselineY = height, cell = DITHER_CELL, dotR = DOT_R }) {
  if (!points || points.length < 2) return []
  const topAt = topAtFactory(points)
  const dots = []
  let col = 0
  for (let cx = cell / 2; cx < width; cx += cell, col++) {
    const top = topAt(cx)
    const span = baselineY - top
    if (span <= 0) continue
    let row = 0
    for (let cy = baselineY - cell / 2; cy > top; cy -= cell, row++) {
      const intensity = (baselineY - cy) / span        // 1 near line, 0 near baseline
      const threshold = BAYER_4[((row % 4) + 4) % 4][((col % 4) + 4) % 4]
      if (intensity > threshold) {
        dots.push({ cx, cy, r: dotR, key: `${col}-${row}`, delayFrac: cx / width })
      }
    }
  }
  return dots
}

// CSS dot field for <div> bars: dense at top, fading to sparse at the baseline
// via a vertical alpha mask. Uses currentColor so the bar's text color drives it.
export function ditherBarStyle() {
  const dotField =
    'radial-gradient(currentColor calc(var(--dither-cell) * 0.28), transparent calc(var(--dither-cell) * 0.34))'
  const grade = 'linear-gradient(to bottom, currentColor, transparent)'
  return {
    backgroundImage: dotField,
    backgroundSize: 'var(--dither-cell) var(--dither-cell)',
    WebkitMaskImage: grade,
    maskImage: grade,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `node --test test/dither.test.mjs`
Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/dither.js test/dither.test.mjs
git commit -m "feat(charts): add pure dither engine with unit tests"
```

---

## Task 3: Breathing CSS

**Files:**
- Modify: `src/index.css` (append at end of file)

**Interfaces:**
- Produces: CSS classes `.dither-breathe` (for SVG dots — animates opacity) and `.dither-breathe-bar` (for `<div>` bars — drifts the dot field). Both honor `prefers-reduced-motion`.

- [ ] **Step 1: Append the breathing CSS.** Add to the end of `src/index.css`:

```css
/* ── Dither breathing ──────────────────────────────────────────────────────
   Slow ambient shimmer for live charts. Per-dot animation-delay (set inline as
   a fraction of --dur-atmo) makes the pulse travel horizontally. */
@keyframes dither-pulse {
  0%, 100% { opacity: var(--dither-fill-min); }
  50%      { opacity: 1; }
}
@keyframes dither-bar-drift {
  0%, 100% { background-position: 0 0; }
  50%      { background-position: var(--dither-cell) var(--dither-cell); }
}
.dither-breathe {
  animation: dither-pulse var(--dur-atmo) var(--ease-inout) infinite;
}
.dither-breathe-bar {
  animation: dither-bar-drift var(--dur-atmo) var(--ease-inout) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .dither-breathe,
  .dither-breathe-bar { animation: none; }
}
```

- [ ] **Step 2: Run the token audit.**

Run: `node scripts/token-audit.js`
Expected: `0 error(s)`. (The `@keyframes` ms exemption and `var(--dur-atmo)`/`var(--ease-inout)` usage produce no new warnings.)

- [ ] **Step 3: Run the build.**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit.**

```bash
git add src/index.css
git commit -m "feat(charts): add dither breathing keyframes and reduced-motion guard"
```

---

## Task 4: WaveformSparkline + MetricCard

**Files:**
- Modify: `src/components/UI.jsx` (`WaveformSparkline` ~433-462; `MetricCard` ~465-485)

**Interfaces:**
- Consumes: `computeDitherDots` from `src/lib/dither.js`; `.dither-breathe` from index.css; `useId` (already imported in UI.jsx).
- Produces: `WaveformSparkline({ data, color, height, live=false, dither=true })`; `MetricCard({ ..., live=false })` passing `live` through.

- [ ] **Step 1: Add the import.** At the top of `src/components/UI.jsx`, add to the existing imports:

```js
import { computeDitherDots } from '../lib/dither'
```

Confirm `useId`, `useMemo` are already imported there (they are — used by `Modal`/`WaveformSparkline`). If `useId` is missing from the React import, add it.

- [ ] **Step 2: Return `points` from the memo and replace the fill.** Replace the body of `WaveformSparkline` (lines 433-462) with:

```jsx
export function WaveformSparkline({ data, color = 'var(--color-signal)', height = 44, live = false, dither = true }) {
 if (!data || data.length < 2) return null
 const clipId = useId()
 const { d, fillPath, points } = useMemo(() => {
  const W = 100, pad = 3
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => ({
   x: pad + (i / (data.length - 1)) * (W - pad * 2),
   y: height - pad - ((v - min) / range) * (height - pad * 2),
  }))
  const d = points.reduce((acc, p, i) => {
   if (i === 0) return `M${p.x},${p.y}`
   const prev = points[i - 1]
   const cp1x = prev.x + (p.x - (points[i - 2]?.x ?? prev.x)) / 6
   const cp1y = prev.y + (p.y - (points[i - 2]?.y ?? prev.y)) / 6
   const cp2x = p.x - ((points[i + 1]?.x ?? p.x) - prev.x) / 6
   const cp2y = p.y - ((points[i + 1]?.y ?? p.y) - prev.y) / 6
   return `${acc} C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`
  }, '')
  const last = points.at(-1)
  return { d, fillPath: `${d} L${last.x},${height} L${points[0].x},${height} Z`, points }
 }, [data, height])
 const W = 100
 const dots = dither ? computeDitherDots({ width: W, height, points, baselineY: height }) : []
 return (
  <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
   {dither ? (
    <>
     <clipPath id={clipId}><path d={fillPath} /></clipPath>
     <g clipPath={`url(#${clipId})`} style={{ fillOpacity: 'var(--dither-fill)' }}>
      {dots.map(dot => (
       <circle
        key={dot.key} cx={dot.cx} cy={dot.cy} r={dot.r} fill={color}
        className={live ? 'dither-breathe' : undefined}
        style={live ? { animationDelay: `calc(var(--dur-atmo) * -${dot.delayFrac.toFixed(3)})` } : undefined}
       />
      ))}
     </g>
    </>
   ) : (
    <path d={fillPath} fill={color} fillOpacity="0.08" stroke="none" />
   )}
   <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
 )
}
```

- [ ] **Step 3: Add `live` pass-through to MetricCard.** In `MetricCard` (line 465), add `live = false` to the destructured props and pass it to the sparkline. Change the signature line to:

```jsx
export function MetricCard({ title, value, valueColor = 'text-ink', waveformData, waveformColor, waveformHeight, live = false, meta }) {
```

and the sparkline call (line 474) to:

```jsx
 <WaveformSparkline data={waveformData} color={waveformColor} height={waveformHeight} live={live} />
```

- [ ] **Step 4: Run the audit and build.**

Run: `node scripts/token-audit.js && npm run build`
Expected: `0 error(s)`; build clean.

- [ ] **Step 5: Verify in the browser.**

Run: `npm run dev`, open `http://localhost:5173/shift`.
Expected: the waveform area fills under the `MetricCard` curves now render as graded dot dither (dense near the line, sparse toward the base); the stroke line is unchanged. No breathing yet (no caller passes `live`). No console errors.

- [ ] **Step 6: Commit.**

```bash
git add src/components/UI.jsx
git commit -m "feat(charts): dither WaveformSparkline fill, thread live prop through MetricCard"
```

---

## Task 5: Dither lab (dev-only tuning screen)

**Files:**
- Create: `src/screens/__DitherLab.jsx`
- Modify: `src/App.jsx` (lazy import ~line 42; route ~line 118)

**Interfaces:**
- Consumes: `WaveformSparkline` from `src/components/UI.jsx`.
- Produces: dev-only route `/__dither_lab`.

- [ ] **Step 1: Create the lab screen.** Create `src/screens/__DitherLab.jsx`:

```jsx
import { useState } from 'react'
import { WaveformSparkline } from '../components/UI'

const SAMPLES = {
  Rising:  [12, 14, 13, 18, 22, 25, 24, 30, 34, 36],
  Volatile:[20, 8, 26, 12, 30, 10, 28, 14, 32, 18],
  Falling: [38, 36, 30, 31, 24, 22, 18, 16, 12, 9],
}

export default function DitherLab() {
  const [cell, setCell] = useState(3)
  const [fill, setFill] = useState(0.55)

  // Tuning overrides the Layer 2 tokens on this subtree only.
  const tuneVars = { '--dither-cell': `${cell}px`, '--dither-fill': fill }

  return (
    <div className="flex-1 overflow-y-auto bg-stone2 p-8" style={tuneVars}>
      <h1 className="font-body font-bold text-ink text-lg mb-1">Dither Lab</h1>
      <p className="font-body text-muted text-label mb-6">
        Dev-only. Tune cell size and dot opacity; compare flat vs dithered and static vs live.
      </p>

      <div className="flex gap-6 mb-8">
        <label className="font-body text-label text-muted">
          Cell {cell}px
          <input type="range" min="2" max="6" step="0.5" value={cell}
            onChange={e => setCell(Number(e.target.value))} className="block w-48" />
        </label>
        <label className="font-body text-label text-muted">
          Fill opacity {fill.toFixed(2)}
          <input type="range" min="0.2" max="1" step="0.05" value={fill}
            onChange={e => setFill(Number(e.target.value))} className="block w-48" />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {Object.entries(SAMPLES).map(([name, data]) => (
          <div key={name} className="space-y-4">
            <div className="font-body text-label text-dim">{name}</div>

            <Cell label="Flat (dither=false)">
              <WaveformSparkline data={data} color="var(--color-signal)" dither={false} />
            </Cell>
            <Cell label="Dithered · static">
              <WaveformSparkline data={data} color="var(--color-signal)" />
            </Cell>
            <Cell label="Dithered · live (breathing)">
              <WaveformSparkline data={data} color="var(--color-signal)" live />
            </Cell>
          </div>
        ))}
      </div>
    </div>
  )
}

function Cell({ label, children }) {
  return (
    <div className="border border-rule2 rounded-md p-3 bg-stone">
      <div className="font-body text-label text-muted mb-2">{label}</div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Wire the dev-only route.** In `src/App.jsx`, add after line 42 (the `OpLab` lazy import):

```js
const DitherLab             = lazy(() => import('./screens/__DitherLab'))
```

and add inside `<Routes>` next to the other `__` dev routes (after line 118, the `/__op_lab` route):

```jsx
  {import.meta.env.DEV && <Route path="/__dither_lab" element={<Suspense fallback={<ScreenLoader />}><DitherLab /></Suspense>} />}
```

- [ ] **Step 3: Run the audit and build.**

Run: `node scripts/token-audit.js && npm run build`
Expected: `0 error(s)`; build clean (the dev-only chunk is excluded from prod via `import.meta.env.DEV`, matching the existing `__design_lab` pattern).

- [ ] **Step 4: Verify in the browser.**

Run: `npm run dev`, open `http://localhost:5173/__dither_lab`.
Expected: three sample columns, each showing flat / dithered-static / dithered-live. The "live" row breathes (slow shimmer traveling horizontally); flat/static rows hold still. Dragging the sliders changes dot pitch and opacity live. Toggle OS "reduce motion" → the live row stops animating but stays dithered.

- [ ] **Step 5: Commit.**

```bash
git add src/screens/__DitherLab.jsx src/App.jsx
git commit -m "feat(charts): add dev-only /__dither_lab tuning screen"
```

---

## Task 6: MiniSparkline

**Files:**
- Modify: `src/screens/PlantOverview.jsx` (`MiniSparkline` 245-262)

**Interfaces:**
- Consumes: `computeDitherDots` from `src/lib/dither.js`; `.dither-breathe`; `useId`.
- Produces: `MiniSparkline({ data, color, live=false })` — now renders a dithered area beneath the existing polyline.

- [ ] **Step 1: Add imports.** At the top of `src/screens/PlantOverview.jsx`, ensure `useId` is imported from React and add the engine import:

```js
import { computeDitherDots } from '../lib/dither'
```

(If the file's React import is `import { ... } from 'react'`, add `useId` to it. If there is no React import yet, add `import { useId } from 'react'`.)

- [ ] **Step 2: Replace MiniSparkline.** Replace lines 245-262 with:

```jsx
function MiniSparkline({ data, color, live = false }) {
  if (!data || data.length < 2) return null
  const clipId = useId()
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 44, h = 18
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }))
  const linePts = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPath = `M${points[0].x},${points[0].y} ` +
    points.slice(1).map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${w},${h} L0,${h} Z`
  const dots = computeDitherDots({ width: w, height: h, points, baselineY: h, cell: 2.5 })
  return (
    <svg width={w} height={h} aria-hidden="true" className="flex-shrink-0">
      <clipPath id={clipId}><path d={areaPath} /></clipPath>
      <g clipPath={`url(#${clipId})`} style={{ fillOpacity: 'var(--dither-fill)' }}>
        {dots.map(dot => (
          <circle
            key={dot.key} cx={dot.cx} cy={dot.cy} r={dot.r} fill={color}
            className={live ? 'dither-breathe' : undefined}
            style={live ? { animationDelay: `calc(var(--dur-atmo) * -${dot.delayFrac.toFixed(3)})` } : undefined}
          />
        ))}
      </g>
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}
```

- [ ] **Step 3: Run the audit and build.**

Run: `node scripts/token-audit.js && npm run build`
Expected: `0 error(s)`; build clean.

- [ ] **Step 4: Verify in the browser.**

Run: `npm run dev`, open `http://localhost:5173/overview`.
Expected: the inline mini sparklines now show a dithered area beneath the line, legible at small size, with the line still drawn on top. No console errors.

- [ ] **Step 5: Commit.**

```bash
git add src/screens/PlantOverview.jsx
git commit -m "feat(charts): dither MiniSparkline area fill"
```

---

## Task 7: SparkBar

**Files:**
- Modify: `src/components/AgentTimeline.jsx` (`SparkBar` 19-27; usage 35-40)

**Interfaces:**
- Consumes: `ditherBarStyle` from `src/lib/dither.js`; `.dither-breathe-bar`.
- Produces: `SparkBar({ height, active, live, title })` — bar filled with the CSS dot field; the active+live bar breathes.

- [ ] **Step 1: Add the import.** At the top of `src/components/AgentTimeline.jsx` (after the React import on line 1):

```js
import { ditherBarStyle } from '../lib/dither'
```

- [ ] **Step 2: Replace SparkBar.** Replace lines 19-27 with:

```jsx
const BAR_STYLE = ditherBarStyle()

function SparkBar({ height, active, live, title }) {
 return (
  <div
   title={title}
   className={`spark-bar ${active && live ? 'dither-breathe-bar' : ''}`}
   style={{
    height,
    color: active ? 'var(--color-signal)' : 'var(--color-rule)',
    ...BAR_STYLE,
   }}
  />
 )
}
```

(`color` drives the `currentColor` dot field; the old `bg-signal`/`bg-rule` classes are dropped because the fill is now the dot field.)

- [ ] **Step 3: Pass `live` to the active bar.** In `AgentTimeline` (lines 35-40), update the `SparkBar` usage so the active bar can breathe. Change the props to:

```jsx
        <SparkBar
         key={i}
         height={d.height}
         active={i === sparkData.length - 1}
         live={i === sparkData.length - 1}
         title={d.label}
        />
```

- [ ] **Step 4: Run the audit and build.**

Run: `node scripts/token-audit.js && npm run build`
Expected: `0 error(s)`; build clean.

- [ ] **Step 5: Verify in the browser.**

Run: `npm run dev`, open `http://localhost:5173/shift` and find the AgentTimeline "Risk score trajectory" bars.
Expected: each bar is filled with a graded dot field (denser at top, fading toward the base); the last/active bar is signal-colored and breathes (the dot field drifts slowly); other bars are rule-colored and static. Toggle "reduce motion" → active bar stops drifting but stays dithered. No console errors.

- [ ] **Step 6: Commit.**

```bash
git add src/components/AgentTimeline.jsx
git commit -m "feat(charts): dither SparkBar fill with breathing on the active bar"
```

---

## Task 8: Final verification gate

**Files:** none (verification + any doc touch-ups only).

- [ ] **Step 1: Engine tests.**

Run: `node --test test/dither.test.mjs`
Expected: all tests PASS.

- [ ] **Step 2: Token audit — zero errors.**

Run: `node scripts/token-audit.js`
Expected: `0 error(s)`. If any new warnings appear in the touched files, review them against the Global Constraints and resolve or annotate with `token-audit: ignore` only if genuinely a geometry exception.

- [ ] **Step 3: Production build.**

Run: `npm run build`
Expected: builds clean; no `__DitherLab`/dev-only code in the prod bundle (gated by `import.meta.env.DEV`).

- [ ] **Step 4: Reduced-motion sweep.**

Enable OS/browser "reduce motion", then load `/shift`, `/overview`, and `/__dither_lab`.
Expected: every chart still shows the static dithered texture; nothing breathes.

- [ ] **Step 5: Live-vs-static sanity.**

With reduce-motion off, confirm on `/shift` that only the active SparkBar breathes and `MetricCard` waveforms breathe only where a caller passes `live` (none do yet by default — confirm they are calm, which is correct). Confirm `/__dither_lab` "live" row breathes.

- [ ] **Step 6: Final commit (only if doc touch-ups were made).**

```bash
git add -A
git commit -m "chore(charts): final verification pass for dithered breathing charts"
```

---

## Self-Review

**Spec coverage:**
- Density-graded Bayer dither → Task 2 (`computeDitherDots`, `BAYER_4`). ✓
- Live-only breathing + reduced-motion override → Task 3 (CSS) + `live` props in Tasks 4/6/7. ✓
- Shared engine for SVG + CSS bar → Task 2 (`computeDitherDots` + `ditherBarStyle`). ✓
- WaveformSparkline + MetricCard `live` pass-through → Task 4. ✓
- MiniSparkline (note: had no fill before; area added) → Task 6. ✓
- SparkBar CSS path → Task 7. ✓
- Tokens added (Layer 1+2) + documented → Task 1. ✓
- Dev tuning surface → Task 5 (`/__dither_lab`; refined from the spec's `/__design_lab` to avoid the brand-audit screen's audit-ignore sandbox — same intent, cleaner home, follows the `__OpLab → /__op_lab` convention). ✓
- Non-breaking default for existing callers (`dither=true`, `live=false`, `dither={false}` escape hatch) → Task 4. ✓
- Gates: token-audit 0 errors + build + manual a11y → every task + Task 8. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states expected output. ✓

**Type consistency:** `computeDitherDots(...)` returns `{ cx, cy, r, key, delayFrac }` in Task 2 and is consumed with exactly those fields in Tasks 4 and 6. `ditherBarStyle()` returns the style object used in Task 7. Class names `.dither-breathe` / `.dither-breathe-bar` defined in Task 3 match their use in Tasks 4/6/7. Token names `--dither-cell` / `--dither-fill` / `--dither-fill-min` defined in Task 1 match all later uses. ✓
