# Dithered, Breathing Charts — Design

**Date:** 2026-06-30
**Status:** Approved (design), pending spec review
**Reference aesthetic:** "breathing dithered charts" (grimcodes, X/2070625864665149573) — monochrome/instrument-panel charts whose area fills are rendered as ordered dot dithering, with a slow ambient "breathing" animation.

## Goal

Retrofit Takorin's existing area/value charts with a **density-graded dithered fill** and an optional **breathing** animation, without introducing new chart types, new dependencies, or new colors. The dither replaces flat/translucent area fills with an ordered dot texture; breathing is a slow shimmer reserved for live data.

## Scope

**In scope (retrofit only):**
- `WaveformSparkline` (`src/components/UI.jsx`) — flagship; used by `MetricCard` across many screens.
- `MiniSparkline` (`src/screens/PlantOverview.jsx`) — small inline area sparkline.
- `SparkBar` (`src/components/AgentTimeline.jsx`) — vertical risk-trajectory bars (CSS `<div>`, not SVG).

**Out of scope:**
- Non-area charts (Radar, Treemap, Gantt, Calendar, Alluvial) — a dither fill does not apply naturally.
- New generic Line/Bar chart primitives.
- Any chart library.

## Decisions (from brainstorming)

- **Dither style:** Density-graded — dots dense near the line, sparse toward the baseline. Value maps to dot density.
- **Motion policy:** Breathing runs on **live metrics only** (a `live` prop, default `false`). Static/historical charts render the same dithered fill held still. Rationale: in an operator/monitoring tool, motion must *mean* "this data is moving"; always-on motion becomes wallpaper and adds noise on dense screens. Aligns with the project's "warm instrumentation / motion = meaning" design direction.
- **Reduced motion:** `prefers-reduced-motion: reduce` always disables breathing; the static dithered texture remains.
- **Preview/tuning:** A before/after comparison block is added to the dev-only `/__design_lab` route for sign-off and tuning before the look ships to real screens.

## Architecture

### 1. Shared dither engine — `src/lib/dither.js` (pure, no React)

One module so all three charts derive from identical logic and constants.

**Technique — ordered (Bayer) dithering of a vertical gradient, clipped to the area:**

1. The chart computes its area shape as it does today (bezier fill path for waveforms; rects for bars).
2. A grid of dot cells is laid over the area; cell size is a token-driven constant (~3px at full size, auto-coarsening at small viewBoxes so dots stay legible).
3. For each cell, compute `intensity` ∈ [0,1] = closeness to the **top** of the filled region at that x (1.0 at the line → ~0 at the baseline). This produces the density grade (dense near the line).
4. Compare `intensity` against a **Bayer 4×4 threshold matrix** indexed by `(col % 4, row % 4)`. Render the dot only if `intensity > threshold`. Ordered thresholding keeps dots crisp instead of a blurry fade.
5. Dots render in the chart's existing color token at a fixed token opacity. No new colors.

**Breathing:** the gradient midpoint oscillates:
`intensity += amplitude * sin(phase + x * k)`
The `x * k` term makes the shimmer travel horizontally (reads as "alive") rather than pulsing uniformly.

**Breathing is CSS-only:** each dot receives an `animation-delay` derived from its position; no JS `requestAnimationFrame` loop. GPU-friendly, and trivially disabled by `@media (prefers-reduced-motion: reduce)`. Gated behind the `live` prop (no animation emitted when not live).

**Engine exports:**
- An SVG path → dot-grid generator (returns positions + per-dot delay) for the SVG charts.
- A CSS helper that emits `background`/`mask` strings from the **same** cell-size + Bayer constants, for the `SparkBar` `<div>` path — so SVG and CSS renderings read as one family.

### 2. Component changes

**`WaveformSparkline` (UI.jsx) — flagship**
- Existing bezier `d` path computation is unchanged. The stroke line on top is unchanged.
- The current flat `fillPath` (`fillOpacity 0.08`) is replaced by the dithered dot grid, clipped to that fill path via `<clipPath>`.
- New props: `live = false` (gates breathing), optional `density` override, and a `dither = true` escape hatch (set `false` to keep the old flat fill for any spot that reads too busy).
- Default behavior for existing callers that pass neither: dithered fill, no breathing (safe, non-breaking — flat fill remains reachable via `dither={false}`).
- `MetricCard` gains a `live` pass-through prop.

**`MiniSparkline` (PlantOverview.jsx)**
- Same engine, smaller viewBox; grid auto-coarsens. Same `live` gating.

**`SparkBar` (AgentTimeline.jsx) — CSS path**
- Remains a `<div>` (bars are thin; a per-bar SVG dot grid would be illegible and heavy).
- Gets a CSS dither background from the engine's CSS helper: a `repeating-radial-gradient` dot field masked by a vertical gradient (dense at top of bar → sparse at base), matching the density-graded rule.
- Breathing = animating the mask position. The `active` bar is the live one and breathes; others hold still.

### 3. Tokens (`src/tokens.css`)

Per CLAUDE.md, add before use as Layer-1 primitives + Layer-2 semantic aliases, then document in `specs/tokens/token-reference.md`:
- dither cell size
- dot radius
- dither fill opacity
- breathing amplitude
- breathing duration (references the existing motion-token scale)

No raw hex/rgb/ms/cubic-bezier/box-shadow in engine or components.

### 4. Design-lab preview (`/__design_lab`, dev only)

A before/after block: flat-vs-dithered side by side, with controls to tune cell size, dot opacity, and breathing amplitude; shows both full and mini sizes and the `live` on/off states. Used to sign off the look before it lands on `/shift` and `/overview`.

## Data flow

No data-model changes. Charts receive the same `data` arrays they do today. The only new input is the `live` boolean, threaded: screen → `MetricCard`/chart → engine (controls whether breathing CSS is emitted). `AgentTimeline` marks its last/active bar as the live one.

## Where it appears

- `/shift` (ShiftIQ): WaveformSparkline fills (via MetricCard) + SparkBar bars — primary preview surface.
- `/overview` (PlantOverview): MiniSparkline fills.
- `/__design_lab` (dev): tuning/comparison block.

## Testing & gates

No test runner exists in this project (scripts: `dev`/`build`/`preview`). Quality gate is the project's existing tooling plus targeted manual verification.

**Automated (must pass, zero errors):**
- `node scripts/token-audit.js` — no raw values; new tokens present and documented.
- `npm run build` — compiles clean (no import/runtime breakage).

**Accessibility:**
- `prefers-reduced-motion: reduce` disables breathing; static dither remains. Verified by toggling OS/browser setting.
- Dither is decorative texture, not new information — existing `role="img"` / `aria-label` unchanged; data still carried by stroke line + values.
- Contrast: dots use existing chart color token at established fill opacity; shipped line-on-fill contrast preserved.

**Manual (in `/__design_lab`, then real screens):**
- Flat-vs-dithered side by side; tune cell size / dot opacity / breathing amplitude.
- Legibility at full and mini sizes.
- `live` gating: live tile breathes, static holds still.
- Spot-check `/shift` and `/overview` after tuning.

**Performance:** CSS-only breathing (position-derived `animation-delay`), no JS rAF loop; low-hundreds dot count per chart; only live charts animate.

## Risks & mitigations

- **Busyness on dense screens** → `live`-only motion + `dither={false}` escape hatch per instance.
- **Small-size legibility** → grid auto-coarsens at small viewBoxes; verified in design lab.
- **SVG vs CSS divergence (SparkBar)** → both derive from one engine's shared constants/Bayer logic.

## Out of scope / YAGNI

- No new chart types, no generic Line/Bar primitives, no chart library.
- No retrofit of non-area charts.
- No JS animation loop, no canvas/WebGL.
