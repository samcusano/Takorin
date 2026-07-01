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
