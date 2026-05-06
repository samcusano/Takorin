import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { commandData, facility, shiftData } from '../data'
import { benchmarks } from '../data/capa'
import { ActionBanner, SP, SPRow, MetricCard } from '../components/UI'
import { useAppState } from '../context/AppState'

const prefersReducedMotion =
 typeof window !== 'undefined' &&
 window.matchMedia('(prefers-reduced-motion: reduce)').matches

const UNDO_WINDOW_MS = 6000

// ── ModulePill ────────────────────────────────────────────────────────────────

function ModulePill({ label, accent }) {
 return (
 <span className="font-body text-[10px] px-2 py-0.5" style={{ color: accent, background: accent + '18' }}>
 {label}
 </span>
 )
}

// ── CommandCell ───────────────────────────────────────────────────────────────

function CommandCell({ item, isPending, onAcknowledge }) {
 const [confirming, setConfirming] = useState(false)

 useEffect(() => {
 if (!confirming) return
 const handler = (e) => { if (e.key === 'Escape') setConfirming(false) }
 window.addEventListener('keydown', handler)
 return () => window.removeEventListener('keydown', handler)
 }, [confirming])

 if (isPending) {
 return (
 <div className="border-b border-rule2 border-l-2 border-l-ok px-3 py-2.5 bg-ok/5 flex items-center gap-2">
 <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2.5} viewBox="0 0 24 24">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 <span className="font-body text-ok text-[10px]">Acknowledged</span>
 </div>
 )
 }

 const borderCls = { danger: 'border-l-danger', warn: 'border-l-warn', watch: 'border-l-rule2' }[item.urgency]
 const actionColorCls = { danger: 'text-danger', warn: 'text-warn', watch: 'text-muted' }[item.urgency]
 const timeLabelCls = { danger: 'text-danger', warn: 'text-warn', watch: 'text-muted' }[item.urgency]
 const isWatch = item.urgency === 'watch'
 const isNow = item.timeWindow === 'now'

 const handleClick = () => {
 if (isNow && !confirming) { setConfirming(true); return }
 setConfirming(false)
 onAcknowledge(item.id, item.title, item.moduleLabel)
 }

 return (
 <div className={`border-b border-rule2 border-l-2 ${borderCls} px-3 py-3 flex flex-col gap-2 ${isWatch ? 'bg-stone2/30' : ''}`}>
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-body text-[10px]" style={{ color: item.moduleAccent }}>{item.moduleLabel}</span>
 <span className={`font-body font-medium text-[10px] uppercase tracking-widest ${timeLabelCls}`}>
 {isNow && (
 <span className={`inline-block w-1 h-1 rounded-full bg-current mr-0.5 align-middle ${prefersReducedMotion ? '' : 'animate-pulse'}`} aria-hidden="true" />
 )}
 {item.timeLabel}
 </span>
 </div>
 <div className="flex items-start justify-between gap-2">
 <p
 className={`font-body font-medium text-[12px] leading-snug flex-1 ${isWatch ? 'text-ink2' : 'text-ink'}`}
 style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
 >
 {item.title}
 </p>
 <span className="display-num text-[11px] text-ghost flex-shrink-0 mt-0.5" aria-hidden="true">
 {String(item.priority).padStart(2, '0')}
 </span>
 </div>
 <p className={`font-body text-[10px] leading-snug truncate ${actionColorCls}`}>
 ▸ {item.action}
 </p>
 {confirming ? (
 <div className="flex items-center gap-2 pt-1.5 border-t border-rule2">
 <p className="font-body text-ink2 text-[10px] flex-1">Acknowledge and remove? You have 6 seconds to undo.</p>
 <button type="button"
 onClick={() => setConfirming(false)}
 className="font-body text-[10px] px-2 py-1 border border-rule2 text-ink2 hover:border-ghost transition-colors"
 aria-label="Cancel (Escape)"
 >
 Cancel
 </button>
 <button type="button"
 onClick={handleClick}
 className="font-body font-medium text-[10px] px-2.5 py-1 bg-danger text-white hover:opacity-90 transition-opacity"
 >
 Confirm
 </button>
 </div>
 ) : (
 <div className="flex items-center justify-between pt-1.5 border-t border-rule2">
 <span className="font-body text-ghost text-[10px]">{item.owner.name}</span>
 <button type="button"
 onClick={handleClick}
 className={`font-body font-medium text-[10px] px-2.5 py-1 min-h-[36px] transition-colors ${
 isWatch ? 'border border-rule2 text-muted hover:border-ghost' : 'bg-ink text-stone hover:bg-ink2'
 }`}
 >
 {isWatch ? 'Noted' : 'Acknowledge'}
 </button>
 </div>
 )}
 </div>
 )
}

// ── MatrixColumn ──────────────────────────────────────────────────────────────

function MatrixColumn({ label, urgency, count, items, pendingIds, onAcknowledge }) {
 const hdrColor = { danger: 'text-danger', warn: 'text-warn', watch: 'text-muted' }[urgency]
 const hdrBorder = { danger: 'border-b-danger', warn: 'border-b-warn', watch: 'border-b-rule2' }[urgency]
 const emptyMsg = { danger: 'Nothing critical', warn: 'Nothing requires attention', watch: 'Nothing to monitor' }[urgency]

 return (
 <div className="flex flex-col min-h-0 overflow-hidden bg-stone">
 <div className={`flex items-baseline gap-3 px-4 py-3 border-b-2 ${hdrBorder} bg-stone2 flex-shrink-0`}>
 <span className={`font-body font-medium uppercase tracking-widest text-[10px] ${hdrColor}`}>{label}</span>
 <span className={`display-num text-2xl ${hdrColor}`}>{count}</span>
 </div>
 <div className="flex-1 overflow-y-auto">
 {items.length === 0 ? (
 <div className="px-4 py-8 text-center font-body text-ghost text-[11px]">{emptyMsg}</div>
 ) : (
 items.map(item => (
 <CommandCell
 key={item.id}
 item={item}
 isPending={pendingIds.has(item.id)}
 onAcknowledge={onAcknowledge}
 />
 ))
 )}
 </div>
 </div>
 )
}

// ── AcknowledgedHistory ───────────────────────────────────────────────────────

function AcknowledgedHistory({ ids }) {
 const [open, setOpen] = useState(false)
 const items = [...ids].map(id => commandData.items.find(i => i.id === id)).filter(Boolean)
 if (items.length === 0) return null
 return (
 <div className="border-t border-rule2">
 <button type="button"
 onClick={() => setOpen(o => !o)}
 className="w-full flex items-center justify-between px-4 py-3 bg-stone2 hover:bg-stone3 transition-colors"
 aria-expanded={open}
 >
 <span className="font-body text-[10px] font-medium uppercase tracking-widest text-muted">
 Acknowledged
 </span>
 <span className="font-body text-[10px] text-muted">
 {items.length} {open ? '▴' : '▾'}
 </span>
 </button>
 {open && items.map(item => (
 <div key={item.id} className="px-4 py-2.5 border-b border-rule2 last:border-b-0 opacity-50">
 <div className="flex items-center gap-2 mb-0.5">
 <ModulePill label={item.moduleLabel} accent={item.moduleAccent} />
 </div>
 <p className="font-body text-ink2 text-[11px] leading-snug">{item.title}</p>
 </div>
 ))}
 </div>
 )
}

// ── UndoToast ─────────────────────────────────────────────────────────────────

function UndoToast({ entries, onUndo }) {
 if (entries.length === 0) return null
 return (
 <div className="fixed bottom-4 left-[248px] z-50 flex flex-col gap-2">
 {entries.map(({ id, title }) => (
 <div key={id} className="flex flex-col bg-ink border border-ink2 slide-in overflow-hidden">
 <div className="flex items-center gap-4 px-4 py-2.5">
 <span className="font-body text-stone text-[11px] flex-1 min-w-0 truncate">
 Acknowledged: {title}
 </span>
 <button type="button"
 onClick={() => onUndo(id)}
 className="font-body font-medium text-[11px] text-ochre hover:text-ochre-light flex-shrink-0 transition-colors min-h-[44px] px-2"
 >
 Undo
 </button>
 </div>
 <div className="h-px bg-ink2">
 <div className="undo-countdown h-full bg-ochre" />
 </div>
 </div>
 ))}
 </div>
 )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CommandSurface() {
 const { commandAcknowledged, acknowledgeCommand, logActivity } = useAppState()
 const [pendingRemoval, setPendingRemoval] = useState(new Map())

 const handleAcknowledge = (id, title, moduleLabel) => {
 const timeoutId = setTimeout(() => {
 acknowledgeCommand(id)
 logActivity({ actor: facility.user.name, action: 'Acknowledged command item', item: id, type: 'intervention' })
 setPendingRemoval(prev => { const m = new Map(prev); m.delete(id); return m })
 }, UNDO_WINDOW_MS)
 setPendingRemoval(prev => new Map([...prev, [id, { timeoutId, title, moduleLabel }]]))
 }

 const handleUndo = (id) => {
 const entry = pendingRemoval.get(id)
 if (!entry) return
 clearTimeout(entry.timeoutId)
 setPendingRemoval(prev => { const m = new Map(prev); m.delete(id); return m })
 }

 const permanentlyGone = commandAcknowledged
 const pendingIds = new Set(pendingRemoval.keys())

 const allVisible = commandData.items.filter(i => !permanentlyGone.has(i.id))
 const critItems = allVisible.filter(i => i.urgency === 'danger')
 const warnItems = allVisible.filter(i => i.urgency === 'warn')
 const watchItems = allVisible.filter(i => i.urgency === 'watch')

 const visibleCritCount = critItems.filter(i => !pendingIds.has(i.id)).length
 const visibleWarnCount = warnItems.filter(i => !pendingIds.has(i.id)).length

 const bannerHeadline = (() => {
 if (visibleCritCount === 0 && visibleWarnCount === 0 && pendingRemoval.size === 0) return 'All clear — no pending actions'
 const parts = []
 if (visibleCritCount > 0) parts.push(`${visibleCritCount} critical`)
 if (visibleWarnCount > 0) parts.push(`${visibleWarnCount} requiring attention`)
 return parts.join(' · ') || 'All clear — no pending actions'
 })()

 const moduleCounts = allVisible
 .filter(i => i.urgency !== 'watch' && !pendingIds.has(i.id))
 .reduce((acc, item) => {
 if (!acc[item.moduleLabel]) acc[item.moduleLabel] = { count: 0, accent: item.moduleAccent, module: item.module }
 acc[item.moduleLabel].count++
 return acc
 }, {})

 const zone = shiftData.score >= 75 ? 'AT RISK' : shiftData.score >= 60 ? 'WATCH' : 'CLEAR'

 const bannerColor = visibleCritCount > 0 ? '#D94F2A' : visibleWarnCount > 0 ? '#C4920A' : '#3A8A5A'

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <ActionBanner
 color={bannerColor}
 headline={bannerHeadline}
 body={`${facility.name} · ${facility.user.name} · ${shiftData.time}`}
 />

 <div className="flex flex-1 min-h-0 overflow-hidden">
 {/* ── 3 urgency columns ── */}
 <div
 className="flex-1 grid min-h-0 overflow-hidden bg-rule2"
 style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1px' }}
 >
 <MatrixColumn label="Critical" urgency="danger" count={critItems.filter(i => !pendingIds.has(i.id)).length} items={critItems} pendingIds={pendingIds} onAcknowledge={handleAcknowledge} />
 <MatrixColumn label="Warning" urgency="warn" count={warnItems.filter(i => !pendingIds.has(i.id)).length} items={warnItems} pendingIds={pendingIds} onAcknowledge={handleAcknowledge} />
 <MatrixColumn label="Watching" urgency="watch" count={watchItems.filter(i => !pendingIds.has(i.id)).length} items={watchItems} pendingIds={pendingIds} onAcknowledge={handleAcknowledge} />
 </div>

 {/* ── Context rail ── */}
 <div className="w-[220px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2 flex flex-col">
 <SP title="Current shift">
 <MetricCard
 title={`${zone} — ${shiftData.line}`}
 value={shiftData.score}
 valueColor="text-danger"
 waveformData={shiftData.sparkline}
 waveformColor="#D94F2A"
 waveformHeight={36}
 meta={{ label: 'Supervisor', value: 'D. Kowalski' }}
 />
 <SPRow label="Into shift" value="42 min" />
 <SPRow label="Remaining" value="5h 18m" valueColor="text-muted" />
 </SP>

 <SP title="By module">
 {Object.entries(moduleCounts).length === 0 ? (
 <div className="px-4 py-3 font-body text-muted text-[11px]">No active items</div>
 ) : (
 Object.entries(moduleCounts).map(([label, { count, accent, module }]) => (
 <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2 last:border-b-0">
 <Link to={`/${module}`} className="font-body text-[12px] hover:underline" style={{ color: accent }}>
 {label}
 </Link>
 <span className="display-num text-sm text-muted">{count}</span>
 </div>
 ))
 )}
 </SP>

 <SP title="Network standing" sub="vs. 68 plants">
 {benchmarks.map((b, i) => {
 const pctColor = b.percentile >= 70 ? 'text-ok' : b.percentile >= 50 ? 'text-warn' : 'text-danger'
 return (
 <div key={i} className="px-4 py-2.5 border-b border-rule2 last:border-b-0">
 <div className="font-body text-ghost text-[10px] mb-1 leading-snug">{b.metric}</div>
 <div className="flex items-baseline gap-1.5">
 <span className={`display-num text-xl ${pctColor}`}>{b.percentile}</span>
 <span className="font-body text-ghost text-[10px]">th pct.</span>
 </div>
 {b.insight && (
 <div className="font-body text-int text-[10px] mt-0.5 leading-tight">{b.insight}</div>
 )}
 </div>
 )
 })}
 <div className="px-4 py-2 font-body text-ghost text-[9px] border-t border-rule2">
 Salina Campus vs. 68 plants · Takorin network
 </div>
 </SP>

 <AcknowledgedHistory ids={permanentlyGone} />
 </div>
 </div>

 <UndoToast
 entries={[...pendingRemoval.entries()].map(([id, v]) => ({ id, ...v }))}
 onUndo={handleUndo}
 />
 </div>
 )
}
