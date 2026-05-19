import React from 'react'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export default function BenchmarkBlock({ metric, rank, total, score, delta, deltaDir, percentile, peers, zones, insight }) {
 return (
 <div className="border-b border-rule last:border-0">
 <div className="flex items-center justify-between px-4 pt-3 pb-2">
 <span className="font-body text-label text-muted">{metric}</span>
 <div className="flex items-center gap-1 px-2 py-0.5 border border-rule text-label font-body text-muted">
 <BarChart2 className="w-3 h-3" />
 {rank} / {total} plants
 </div>
 </div>

 <div className="flex items-baseline gap-2 px-4 pb-2">
 <span
 className="display-num text-page font-bold leading-none"
 style={{ color: percentile >= 60 ? 'var(--color-ok)' : percentile >= 40 ? 'var(--color-warn)' : 'var(--color-danger)' }}
 >
 {score}
 </span>
 {delta && (
 <span className={`font-body text-label flex items-center gap-0.5 ${deltaDir === 'up' ? 'text-ok' : 'text-danger'}`}>
 {deltaDir === 'up' ? <TrendingUp size={11} className="inline" /> : <TrendingDown size={11} className="inline" />} {delta}
 </span>
 )}
 </div>

 <div className="flex items-center gap-2 px-4 pb-3">
 <div className="flex-1 h-2 relative" style={{
 background: 'linear-gradient(to right, var(--color-danger), var(--color-warn), var(--color-ok))'
 }}>
 <div
 className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink border-2 border-stone shadow-sm"
 style={{ left: `${percentile}%` }}
 />
 </div>
 <span className="font-body text-label text-muted whitespace-nowrap">
 Index <strong className="font-semibold not-italic text-ochre">{Math.round(percentile)}</strong>
 </span>
 </div>

 {peers && peers.length > 0 && (
 <div className="px-4 pb-2 border-t border-rule pt-2">
 <div className="text-label font-body tracking-wide text-muted mb-2">Top plants · comparable category</div>
 {peers.map((p, i) => (
 <div key={i} className="flex items-center gap-2 py-1 border-b border-rule last:border-0">
 <span className="display-num text-label text-muted w-4 flex-shrink-0">{i + 1}</span>
 <span className="flex-1 font-body text-label text-muted">{p.name}</span>
 <span className="font-display text-label font-bold text-ink">{p.value}</span>
 </div>
 ))}
 </div>
 )}

 {zones && (
 <div className="px-4 py-2.5 border-t border-rule">
 <div className="h-1.5 relative mb-2" style={{
 background: `linear-gradient(to right, var(--color-danger) 0%, var(--color-danger) ${zones[0].pct}%, var(--color-warn) ${zones[0].pct}%, var(--color-warn) ${zones[1].pct}%, var(--color-ok) ${zones[1].pct}%, var(--color-ok) 100%)`
 }}>
 {zones.map((z, i) => z.mark && (
 <div key={i} className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-ink" style={{ left: `${z.mark}%` }} />
 ))}
 </div>
 <div className="flex">
 {zones.map((z, i) => (
 <div key={i} className="flex-1 text-center font-body text-label " style={{ color: z.color }}>
 <div>● {z.label}</div>
 <div className="text-muted">{z.range}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {insight && (
 <div className="px-4 py-2 bg-warn/5 border-t border-rule font-body text-label text-warn">
 {insight}
 </div>
 )}
 </div>
 )
}
