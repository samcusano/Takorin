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
