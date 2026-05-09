import React from 'react'

const CELL_STYLES = {
 sa: { bar: 'bg-danger', text: 'text-danger' },
 sw: { bar: 'bg-warn', text: 'text-warn' },
 so: { bar: 'bg-ok', text: 'text-ok' },
 sd: { bar: 'bg-danger/30', text: 'text-danger' },
}

export function StatCell({ type = 'so', label, value, sub, pct }) {
 const s = CELL_STYLES[type] || CELL_STYLES.so
 return (
 <div className="bg-stone px-4 py-3 flex flex-col gap-1 min-w-0">
 <div className="text-[10px] font-body text-muted truncate">{label}</div>
 <div className={`font-display text-2xl font-black tracking-tight leading-none ${s.text}`}>
 {value}
 </div>
 {sub && <div className="text-[10px] font-body text-ghost truncate">{sub}</div>}
 {pct !== undefined && (
 <div className="h-0.5 bg-rule mt-1">
 <div className={`h-full ${s.bar} transition-[width] duration-500 ease-enter`} style={{ width: `${pct}%` }} />
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
