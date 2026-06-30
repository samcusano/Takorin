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
