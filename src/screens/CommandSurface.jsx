import { useState } from 'react'
import { riskLabel } from '../lib/utils'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { commandData, facility, shiftData } from '../data'
import { ActionBanner, StatCell, Btn, Chip, HoldButton } from '../components/UI'
import { useAppState } from '../context/AppState'

const prefersReducedMotion =
 typeof window !== 'undefined' &&
 window.matchMedia('(prefers-reduced-motion: reduce)').matches

const UNDO_WINDOW_MS = 6000

// ── ModulePill ────────────────────────────────────────────────────────────────

function ModulePill({ label }) {
 return <Chip tone="muted">{label}</Chip>
}

// ── CommandCell ───────────────────────────────────────────────────────────────

function CommandCell({ item, isPending, onAcknowledge }) {
 if (isPending) {
 return (
 <div className="border-b border-rule2 border-l-2 border-l-ok px-3 py-2.5 bg-ok/5 flex items-center gap-2">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 <span className="font-body text-ok text-[10px]">Acknowledged</span>
 </div>
 )
 }

 const borderCls = { danger: 'border-l-danger', warn: 'border-l-warn', watch: 'border-l-rule2' }[item.urgency]
 const actionColorCls = { danger: 'text-danger', warn: 'text-warn', watch: 'text-muted' }[item.urgency]
 const timeLabelCls = { danger: 'text-danger', warn: 'text-warn', watch: 'text-muted' }[item.urgency]
 const isWatch = item.urgency === 'watch'
 const isNow = item.timeWindow === 'now'
 const holdTone = item.urgency === 'danger' ? 'danger' : 'warn'

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
 <p
 className={`font-body font-medium text-[12px] leading-snug ${isWatch ? 'text-ink2' : 'text-ink'}`}
 style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
 >
 {item.title}
 </p>
 <p className={`font-body text-[10px] leading-snug truncate ${actionColorCls}`}>
 <span className="text-ghost text-[11px]">—</span> {item.action}
 </p>
 <div className="border-t border-rule2 pt-1.5">
 {isWatch ? (
 <div className="flex items-center justify-between">
  <span className="font-body text-ghost text-[10px]">{item.owner.name}</span>
  <Btn variant="secondary" onClick={() => onAcknowledge(item.id, item.title, item.moduleLabel)}>Noted</Btn>
 </div>
 ) : (
 <HoldButton
  label={`Hold to acknowledge`}
  holdLabel={isNow ? 'Keep holding…' : 'Keep holding…'}
  doneLabel="Acknowledged"
  duration={isNow ? 1500 : 1000}
  tone={holdTone}
  onConfirm={() => onAcknowledge(item.id, item.title, item.moduleLabel)}
 />
 )}
 </div>
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

// ── UndoToast ─────────────────────────────────────────────────────────────────

function UndoToast({ entries, onUndo }) {
 if (entries.length === 0) return null
 return (
 <div className="fixed bottom-4 left-[calc(240px+1rem)] z-[70] flex flex-col gap-2">
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
 const { commandAcknowledged, acknowledgeCommand, logActivity, currentPlant } = useAppState()
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

 const zone = riskLabel(shiftData.score)

 const bannerTone = visibleCritCount > 0 ? 'danger' : visibleWarnCount > 0 ? 'warn' : 'ok'

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">
 <ActionBanner
 tone={bannerTone}
 headline={bannerHeadline}
 body={`${currentPlant?.name || facility.name} · ${facility.user.name} · ${shiftData.time}`}
 />

 {/* Stats bar — shift context */}
 <div className="grid grid-cols-3 border-b border-rule2 bg-stone flex-shrink-0">
 <StatCell
  label="Line 4"
  value={String(shiftData.score)}
  sub={`${zone} · AM shift`}
  type={shiftData.score >= 75 ? 'sa' : shiftData.score >= 60 ? 'sw' : 'so'}
  pct={shiftData.score}
 />
 <StatCell label="Into shift" value="42" sub="minutes elapsed" type="so" />
 <StatCell label="Remaining" value="5h 18m" sub="until handoff" type="so" />
 </div>

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
 </div>

 <UndoToast
 entries={[...pendingRemoval.entries()].map(([id, v]) => ({ id, ...v }))}
 onUndo={handleUndo}
 />
 </div>
 )
}
