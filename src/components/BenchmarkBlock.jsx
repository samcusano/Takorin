import React from 'react'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export default function BenchmarkBlock({ metric, rank, total, score, delta, deltaDir, percentile, peers, zones, insight }) {
 return (
 <div className="border-b border-rule last:border-0">
 <div className="flex items-center justify-between px-4 pt-3 pb-2">
 <span className="font-body text-xs text-muted">{metric}</span>
 <div className="flex items-center gap-1 px-2 py-0.5 border border-rule text-[10px] font-body text-ghost">
 <BarChart2 className="w-3 h-3" />
 {rank} / {total} plants
 </div>
 </div>

 <div className="flex items-baseline gap-2 px-4 pb-2">
 <span
 className="font-display text-3xl font-bold tracking-tight leading-none"
 style={{ color: percentile >= 60 ? '#3A8A5A' : percentile >= 40 ? '#C4920A' : '#D94F2A' }}
 >
 {score}
 </span>
 {delta && (
 <span className={`font-body text-xs flex items-center gap-0.5 ${deltaDir === 'up' ? 'text-ok' : 'text-danger'}`}>
 {deltaDir === 'up' ? <TrendingUp size={11} className="inline" /> : <TrendingDown size={11} className="inline" />} {delta}
 </span>
 )}
 </div>

 <div className="flex items-center gap-2 px-4 pb-3">
 <div className="flex-1 h-2 relative" style={{
 background: 'linear-gradient(to right, #D94F2A, #C4920A, #8A6A3A, #3A8A5A)'
 }}>
 <div
 className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink border-2 border-stone shadow-sm"
 style={{ left: `${percentile}%` }}
 />
 </div>
 <span className="font-body text-[10px] text-ghost whitespace-nowrap">
 Index <strong className="font-semibold not-italic text-ochre">{Math.round(percentile)}</strong>
 </span>
 </div>

 {peers && peers.length > 0 && (
 <div className="px-4 pb-2 border-t border-rule pt-2">
 <div className="text-[10px] font-body uppercase tracking-wide text-ghost mb-2">Top plants · comparable category</div>
 {peers.map((p, i) => (
 <div key={i} className="flex items-center gap-2 py-1 border-b border-rule last:border-0">
 <span className="display-num text-[11px] text-ghost w-4 flex-shrink-0">{i + 1}</span>
 <span className="flex-1 font-body text-[11px] text-muted">{p.name}</span>
 <span className="font-display text-xs font-bold text-ink">{p.value}</span>
 </div>
 ))}
 </div>
 )}

 {zones && (
 <div className="px-4 py-2.5 border-t border-rule">
 <div className="h-1.5 relative mb-2" style={{
 background: `linear-gradient(to right, #D94F2A 0%, #D94F2A ${zones[0].pct}%, #C4920A ${zones[0].pct}%, #8A6A3A ${zones[1].pct}%, #3A8A5A ${zones[1].pct}%, #3A8A5A 100%)`
 }}>
 {zones.map((z, i) => z.mark && (
 <div key={i} className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-ink" style={{ left: `${z.mark}%` }} />
 ))}
 </div>
 <div className="flex">
 {zones.map((z, i) => (
 <div key={i} className="flex-1 text-center font-body text-[10px] " style={{ color: z.color }}>
 <div>● {z.label}</div>
 <div className="text-ghost">{z.range}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {insight && (
 <div className="px-4 py-2 bg-warn/5 border-t border-rule font-body text-[11px] text-warn">
 {insight}
 </div>
 )}
 </div>
 )
}
