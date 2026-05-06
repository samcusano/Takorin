import React from 'react'

const DOT_CLASSES = {
 d1: 'bg-danger/20', d2: 'bg-danger/40', d3: 'bg-danger/65', d4: 'bg-danger',
 w1: 'bg-warn/20', w2: 'bg-warn/40', w3: 'bg-warn/65', w4: 'bg-warn',
 ok: 'bg-ok/50', empty: 'bg-rule opacity-30',
}

function PatternDots({ dots }) {
 return (
 <div className="flex gap-0.5 items-center px-3">
 {dots.map((d, i) => (
 <div key={i} className={`w-2 h-2 rounded-[2px] flex-shrink-0 ${DOT_CLASSES[d] || DOT_CLASSES.empty}`} />
 ))}
 </div>
 )
}

const TREND_ICON = { up: '↑', down: '↓', flat: '→' }
const TREND_COLOR = { up: 'text-danger', down: 'text-ok', flat: 'text-ghost' }

export default function PatternMatrix({ rows }) {
 return (
 <div>
 <div className="flex items-center gap-4 px-4 py-2 border-b border-rule bg-stone2 text-[10px] font-body text-ghost">
 <div className="flex items-center gap-1">
 {['d4','d3','d2','d1'].map(d => <div key={d} className={`w-2 h-2 rounded-[2px] ${DOT_CLASSES[d]}`} />)}
 <span className="ml-1">Critical</span>
 </div>
 <div className="flex items-center gap-1">
 {['w4','w3','w2'].map(d => <div key={d} className={`w-2 h-2 rounded-[2px] ${DOT_CLASSES[d]}`} />)}
 <span className="ml-1">Watch</span>
 </div>
 <div className="flex items-center gap-1">
 <div className={`w-2 h-2 rounded-[2px] ${DOT_CLASSES.ok}`} />
 <span className="ml-1">Resolved</span>
 </div>
 <div className="ml-auto flex items-center gap-3">
 <span>↑ increasing</span>
 <span>↓ decreasing</span>
 <span>→ stable</span>
 </div>
 </div>

 {rows.map((row, i) => (
 <div
 key={i}
 className={`grid items-center border-b border-rule last:border-0 transition-colors hover:bg-ochre/[0.02] ${row.critical ? 'bg-danger/[0.02]' : 'bg-stone'}`}
 style={{ gridTemplateColumns: '1fr auto auto auto' }}
 >
 <div className="px-4 py-2.5">
 <div className="font-body text-xs font-medium text-ink">{row.label}</div>
 {row.sub && <div className="font-body text-[10px] text-ghost mt-0.5">{row.sub}</div>}
 </div>
 <PatternDots dots={row.dots} />
 {row.trend ? (
 <div className="px-3 text-center">
 <div className={`font-body text-[13px] font-medium ${TREND_COLOR[row.trend]}`}>{TREND_ICON[row.trend]}</div>
 {row.trendLabel && <div className="font-body text-ghost text-[10px] whitespace-nowrap">{row.trendLabel}</div>}
 </div>
 ) : <div className="px-3" />}
 <div className={`font-display text-base font-bold tracking-tight px-4 text-right ${
 row.critical ? 'text-danger' : row.warn ? 'text-warn' : 'text-ghost'
 }`}>
 {row.count}
 </div>
 </div>
 ))}
 </div>
 )
}
