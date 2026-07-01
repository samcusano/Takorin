import React from 'react'
import { DitherMeter } from './UI'

const CELL_STYLES = {
 sa: { tone: 'danger', text: 'text-danger' },
 sw: { tone: 'warn', text: 'text-warn' },
 so: { tone: 'ok', text: 'text-ok' },
 sd: { tone: 'danger', text: 'text-danger' },
}

export function StatCell({ type = 'so', label, value, sub, pct }) {
 const s = CELL_STYLES[type] || CELL_STYLES.so
 return (
 <div className="bg-stone px-4 py-3 flex flex-col gap-1 min-w-0">
 <div className="text-label font-body text-muted truncate">{label}</div>
 <div className={`display-num text-metric leading-none ${s.text}`}>
 {value}
 </div>
 {sub && <div className="text-label font-body text-muted truncate">{sub}</div>}
 {pct !== undefined && (
 <div className="h-0.5 bg-rule mt-1">
 <DitherMeter value={pct} tone={s.tone} />
 </div>
 )}
 </div>
 )
}

export default function StatBar({ cells }) {
 return (
 <div
 className="grid gap-px bg-rule2 border-b border-rule2"
 style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
 >
 {cells.map((cell, i) => <StatCell key={i} {...cell} />)}
 </div>
 )
}
