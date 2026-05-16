import { useState } from 'react'
import { riskLabel } from '../lib/utils'
import { Check, ArrowRight, AlertTriangle, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { commandData, facility, shiftData, networkData } from '../data'
import { Btn, HoldButton } from '../components/UI'
import { useAppState } from '../context/AppState'

const MODULE_ROUTES = { shift: '/shift', capa: '/capa', supplier: '/supplier', handoff: '/handoff', readiness: '/readiness', network: '/network' }
const UNDO_WINDOW_MS = 6000

const prefersReducedMotion =
 typeof window !== 'undefined' &&
 window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Layer 1: Command Banner ───────────────────────────────────────────────────
// Context-sensitive brief. Three states: crisis / emerging risk / all clear.

function CommandBanner({ critItems, watchItems, pendingIds, readiness, activeExposures }) {
 const navigate = useNavigate()
 const hasExposure = activeExposures.length > 0
 const topItem = critItems.find(i => !pendingIds.has(i.id))

 if (hasExposure) {
  const totalUnits = activeExposures.reduce((s, e) => s + e.totalUnits, 0)
  const affectedPlants = [...new Set(activeExposures.flatMap(e => e.affectedPlants))].length
  const supplier = activeExposures[0]?.supplier
  return (
   <div className="flex-shrink-0 px-6 py-6 border-b-2 border-b-danger/30 bg-danger/[0.035]" style={{ minHeight: '20vh' }}>
    <div className="flex items-start gap-3 mb-4">
     <div className="w-2 h-2 rounded-full bg-danger flex-shrink-0 mt-2 beat" />
     <div>
      <div className="font-body text-danger text-[10px] uppercase tracking-widest mb-1">Active network exposure</div>
      <div className="font-display font-bold text-ink text-[24px] leading-none mb-1.5">
       {supplier} hold active
      </div>
      <div className="font-body text-ink2 text-[12px] leading-relaxed">
       {totalUnits.toLocaleString()} units · {affectedPlants} plant{affectedPlants > 1 ? 's' : ''} · FSMA 204 window: 24h remaining
      </div>
     </div>
    </div>
    <div className="flex gap-3 pl-5">
     <Btn variant="secondary" onClick={() => navigate('/network')}>Open containment</Btn>
    </div>
   </div>
  )
 }

 if (topItem) {
  const isDanger = topItem.urgency === 'danger'
  const isNow = topItem.timeWindow === 'now'
  return (
   <div className={`flex-shrink-0 px-6 py-6 border-b-2 ${isDanger ? 'border-b-danger/25 bg-danger/[0.02]' : 'border-b-warn/25 bg-warn/[0.02]'}`} style={{ minHeight: '20vh' }}>
    <div className="flex items-start gap-3 mb-4">
     <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${isDanger ? 'bg-danger beat' : 'bg-warn'}`} />
     <div>
      <div className={`font-body text-[10px] uppercase tracking-widest mb-1 ${isDanger ? 'text-danger' : 'text-warn'}`}>
       {isNow ? 'Immediate action required' : 'Emerging risk'}
      </div>
      <div className="font-display font-bold text-ink text-[24px] leading-none mb-1.5">
       {topItem.title}
      </div>
      <div className="font-body text-ink2 text-[12px] leading-relaxed">{topItem.action}</div>
     </div>
    </div>
    <div className="pl-5">
     <Btn variant="secondary" onClick={() => navigate(MODULE_ROUTES[topItem.module] || '/shift')}>
      <ArrowRight size={11} />Review in {topItem.moduleLabel}
     </Btn>
    </div>
   </div>
  )
 }

 return (
  <div className="flex-shrink-0 px-6 py-6 border-b-2 border-b-ok/20 bg-ok/[0.02]" style={{ minHeight: '20vh' }}>
   <div className="flex items-start gap-3">
    <div className="w-2 h-2 rounded-full bg-ok flex-shrink-0 mt-2" />
    <div>
     <div className="font-body text-ok text-[10px] uppercase tracking-widest mb-1">No critical interventions</div>
     <div className="font-display font-bold text-ink text-[24px] leading-none mb-1.5">Plant running clean</div>
     <div className="font-body text-ghost text-[12px]">
      {watchItems.length > 0
       ? `${watchItems.length} item${watchItems.length > 1 ? 's' : ''} watching · `
       : ''}
      Data readiness {readiness} · {riskLabel(readiness).toLowerCase()}
     </div>
    </div>
   </div>
  </div>
 )
}

// ── Layer 2: Triage Queue ─────────────────────────────────────────────────────
// Stacked urgency groups, not columns. Compact rows with temporal labels.

const ESC_STATE_CFG = {
 open:         { label: 'Open',         color: 'text-ghost' },
 assigned:     { label: 'Assigned',     color: 'text-muted' },
 acknowledged: { label: 'Active',       color: 'text-ok'    },
 escalated:    { label: 'Escalated',    color: 'text-danger' },
 resolved:     { label: 'Resolved',     color: 'text-ok'    },
}

function TriageRow({ item, isPending, onAcknowledge, escalation }) {
 const navigate = useNavigate()
 const { updateEscalationState, directorOnFloor, floorBackup } = useAppState()

 if (isPending) {
  return (
   <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 border-l-2 border-l-ok bg-ok/5">
    <Check size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
    <span className="font-body text-ok text-[10px] flex-1 truncate">Acknowledged</span>
   </div>
  )
 }

 const borderCls = { danger: 'border-l-danger', warn: 'border-l-warn', watch: 'border-l-rule2' }[item.urgency]
 const timeCls = { danger: 'text-danger', warn: 'text-warn', watch: 'text-ghost' }[item.urgency]
 const isWatch = item.urgency === 'watch'
 const isNow = item.timeWindow === 'now'
 const holdTone = item.urgency === 'danger' ? 'danger' : 'warn'

 // When escalated to director, show a "delegated" state so they know it bounced
 const escCfg = escalation ? ESC_STATE_CFG[escalation.state] || ESC_STATE_CFG.open : null
 const isEscalatedToDirector = escalation?.state === 'escalated'
 const isDelegated = escalation?.state === 'acknowledged' && escalation?.owner !== 'J. Crocker'

 return (
  <div className={`border-b border-rule2 border-l-2 ${borderCls} ${isWatch ? 'bg-stone2/30' : isEscalatedToDirector ? 'bg-danger/[0.015]' : ''}`}>
   <div className="flex items-center gap-3 px-4 py-3">
    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 mb-0.5 flex-wrap">
      <span className="font-body text-[10px] font-medium" style={{ color: item.moduleAccent }}>{item.moduleLabel}</span>
      <span className={`font-body text-[10px] ${timeCls}`}>
       {isNow && !prefersReducedMotion && (
        <span className="inline-block w-1 h-1 rounded-full bg-current mr-0.5 align-middle animate-pulse" aria-hidden="true" />
       )}
       {item.timeLabel}
      </span>
      {/* Escalation state badge */}
      {escCfg && (
       <span className={`font-body text-[9px] ${escCfg.color}`}>
        {escalation.state === 'acknowledged' && escalation.owner
         ? `${escalation.owner} responding`
         : escalation.state === 'escalated'
           ? `↑ Escalated to you`
           : escCfg.label}
       </span>
      )}
     </div>
     <p className={`font-body text-[12px] leading-snug truncate ${isWatch ? 'text-ink2' : 'text-ink'}`}>{item.title}</p>
     {/* Ownership sub-line — only when not the director's turn */}
     {isDelegated && (
      <p className="font-body text-[10px] text-ghost mt-0.5">
       {escalation.owner} has this · Not your turn
      </p>
     )}
     {isEscalatedToDirector && !directorOnFloor && (
      <p className="font-body text-[10px] text-danger mt-0.5">
       No response · Escalated to you — act now
      </p>
     )}
     {isEscalatedToDirector && directorOnFloor && (
      <p className="font-body text-[10px] text-warn mt-0.5">
       Escalation paused · {floorBackup} notified as backup
      </p>
     )}
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
     {MODULE_ROUTES[item.module] && (
      <button type="button" onClick={() => navigate(MODULE_ROUTES[item.module])}
       className="p-1 text-ghost hover:text-int transition-colors" aria-label={`View in ${item.moduleLabel}`}>
       <ArrowRight size={11} strokeWidth={2} />
      </button>
     )}
     {isWatch ? (
      <Btn variant="secondary" onClick={() => onAcknowledge(item.id, item.title, item.moduleLabel)}>Noted</Btn>
     ) : isDelegated ? (
      <Btn variant="secondary" onClick={() => onAcknowledge(item.id, item.title, item.moduleLabel)}>Dismiss</Btn>
     ) : (
      <HoldButton
       label="Hold"
       holdLabel="Hold…"
       doneLabel="Done"
       duration={isNow ? 1500 : 1000}
       tone={holdTone}
       onConfirm={() => {
        onAcknowledge(item.id, item.title, item.moduleLabel)
        updateEscalationState(item.id, 'resolved', 'J. Crocker')
       }}
      />
     )}
    </div>
   </div>
  </div>
 )
}

function TriageSection({ label, urgency, items, pendingIds, onAcknowledge, escalationStates }) {
 const visibleCount = items.filter(i => !pendingIds.has(i.id)).length
 if (items.length === 0) return null
 const hdrColor = { danger: 'text-danger', warn: 'text-warn', watch: 'text-ghost' }[urgency]
 const hdrBg = { danger: 'bg-danger/[0.04]', warn: 'bg-warn/[0.04]', watch: 'bg-stone2' }[urgency]
 const hdrBorder = { danger: 'border-b-danger/30', warn: 'border-b-warn/30', watch: 'border-b-rule2' }[urgency]
 return (
  <div>
   <div className={`flex items-baseline gap-2.5 px-4 py-2.5 border-b-2 ${hdrBorder} ${hdrBg} flex-shrink-0`}>
    <span className={`display-num text-[22px] font-bold leading-none ${hdrColor}`}>{visibleCount}</span>
    <span className={`font-body font-semibold text-[10px] uppercase tracking-widest ${hdrColor}`}>{label}</span>
   </div>
   {items.map(item => (
    <TriageRow
     key={item.id}
     item={item}
     isPending={pendingIds.has(item.id)}
     onAcknowledge={onAcknowledge}
     escalation={escalationStates?.[item.id]}
    />
   ))}
  </div>
 )
}

function TriageQueue({ critItems, warnItems, watchItems, pendingIds, onAcknowledge, escalationStates }) {
 const allEmpty = critItems.length === 0 && warnItems.length === 0 && watchItems.length === 0
 return (
  <div className="flex-1 overflow-y-auto">
   {allEmpty ? (
    <div className="px-4 py-10 text-center font-body text-ghost text-[11px]">Queue clear</div>
   ) : (
    <>
     <TriageSection label="Critical" urgency="danger" items={critItems} pendingIds={pendingIds} onAcknowledge={onAcknowledge} escalationStates={escalationStates} />
     <TriageSection label="Warning" urgency="warn" items={warnItems} pendingIds={pendingIds} onAcknowledge={onAcknowledge} escalationStates={escalationStates} />
     <TriageSection label="Watching" urgency="watch" items={watchItems} pendingIds={pendingIds} onAcknowledge={onAcknowledge} escalationStates={escalationStates} />
    </>
   )}
  </div>
 )
}

// ── Layer 3: Plant Strip ──────────────────────────────────────────────────────
// Compact right-column table. Score + status indicator. Supports orientation, not analysis.

function PlantStrip() {
 const navigate = useNavigate()
 const { agentActions, directorOnFloor, floorBackup, goToFloor, returnFromFloor, systemConfidence } = useAppState()
 const pendingAgentActions = agentActions?.filter(a => a.status === 'pending-review') || []
 return (
  <div className="w-[172px] flex-shrink-0 border-l border-rule2 bg-stone flex flex-col">
   {/* On-floor status toggle */}
   <div className={`px-3 py-2 border-b border-rule2 flex-shrink-0 ${directorOnFloor ? 'bg-warn/[0.08]' : 'bg-stone2'}`}>
    <button
     type="button"
     onClick={() => directorOnFloor ? returnFromFloor() : goToFloor('D. Kowalski')}
     className="w-full text-left"
    >
     <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Director status</div>
     <div className={`font-body text-[10px] font-medium ${directorOnFloor ? 'text-warn' : 'text-muted'}`}>
      {directorOnFloor ? `On floor · ${floorBackup} backup` : 'At desk'}
     </div>
     {directorOnFloor && (
      <div className="font-body text-ghost text-[9px] mt-0.5">Escalation paused · tap to return</div>
     )}
    </button>
   </div>
   <div className="px-3 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Lines</span>
   </div>
   <div className="flex-1">
    {shiftData.lines.map(line => {
     const code = line.name.replace('Line ', 'L')
     const s = line.score
     const color = s >= 80 ? 'text-ok' : s >= 65 ? 'text-warn' : 'text-danger'
     const isAlert = s < 65
     const indicator = isAlert ? '⚠' : s >= 75 ? '↑' : '→'
     const indColor = isAlert ? 'text-danger' : s >= 75 ? 'text-ok' : 'text-warn'
     return (
      <button key={line.id} type="button"
       onClick={() => navigate(`/shift?line=${line.id}`)}
       className="w-full flex items-center gap-2 px-3 py-3 border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors text-left">
       <span className="font-body text-ghost text-[10px] w-6 flex-shrink-0">{code}</span>
       <span className={`display-num text-[18px] font-bold leading-none ${color}`}>{s}</span>
       <span className={`ml-auto font-body text-[11px] flex-shrink-0 ${indColor}`}>{indicator}</span>
      </button>
     )
    })}
   </div>

   {/* System confidence */}
   <div className="border-t border-rule2 flex-shrink-0 px-3 py-2">
    <div className="flex items-center justify-between mb-1">
     <span className="font-body text-ghost text-[9px] uppercase tracking-widest">System confidence</span>
     <span className={`display-num text-[14px] font-bold ${(systemConfidence||79) >= 85 ? 'text-ok' : (systemConfidence||79) >= 65 ? 'text-warn' : 'text-danger'}`}>
      {systemConfidence ?? 79}%
     </span>
    </div>
    <div className="h-1 bg-rule2">
     <div
      className={`h-full transition-all ${(systemConfidence||79) >= 85 ? 'bg-ok' : (systemConfidence||79) >= 65 ? 'bg-warn' : 'bg-danger'}`}
      style={{ width:`${systemConfidence ?? 79}%` }}
     />
    </div>
    {(systemConfidence||79) < 85 && (
     <button type="button" onClick={() => navigate('/agents')} className="font-body text-ghost text-[9px] mt-1 hover:text-muted transition-colors text-left w-full">
      HR data stale — agents degraded
     </button>
    )}
   </div>

   {/* Agent Activity */}
   <div className="border-t border-rule2 flex-shrink-0">
    <button
     type="button"
     onClick={() => navigate('/agents')}
     className="w-full flex items-center gap-1.5 px-3 py-2 bg-stone2 hover:bg-stone2/80 transition-colors"
    >
     <Cpu size={10} className="text-ochre" strokeWidth={1.75} />
     <span className="font-body text-ghost text-[10px] uppercase tracking-widest flex-1">Agents</span>
     {pendingAgentActions.length > 0 && (
      <span className="font-body text-[9px] bg-warn/20 text-warn px-1 py-0.5">{pendingAgentActions.length}</span>
     )}
    </button>
    <div className="px-3 py-2 space-y-2">
     {(agentActions || []).slice(0, 3).map(a => (
      <div key={a.id} className="text-[10px] font-body">
       <div className={`truncate ${a.status === 'pending-review' ? 'text-warn' : 'text-stone/70'}`}>{a.action}</div>
       <div className="text-ghost text-[9px] truncate">{a.timestamp} · {a.agentName.replace(' Agent','')}</div>
      </div>
     ))}
    </div>
   </div>
  </div>
 )
}

// ── Undo Toast ────────────────────────────────────────────────────────────────

function UndoToast({ entries, onUndo }) {
 if (entries.length === 0) return null
 return (
  <div className="fixed bottom-4 left-[calc(240px+1rem)] z-[70] flex flex-col gap-2">
   {entries.map(({ id, title }) => (
    <div key={id} className="flex flex-col bg-ink border border-ink2 slide-in overflow-hidden">
     <div className="flex items-center gap-4 px-4 py-2.5">
      <span className="font-body text-stone text-[11px] flex-1 min-w-0 truncate">Acknowledged: {title}</span>
      <button type="button" onClick={() => onUndo(id)}
       className="font-body font-medium text-[11px] text-ochre hover:text-ochre-light flex-shrink-0 transition-colors min-h-[44px] px-2">
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CommandSurface() {
 const { commandAcknowledged, acknowledgeCommand, logActivity, currentPlant, readinessScore, plantActions, escalationStates } = useAppState()
 const readiness = readinessScore ?? 64
 const [pendingRemoval, setPendingRemoval] = useState(new Map())

 const activeExposures = (networkData.sharedExposure || []).filter(e => !plantActions?.[e.lotId])

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
 const critItems  = allVisible.filter(i => i.urgency === 'danger')
 const warnItems  = allVisible.filter(i => i.urgency === 'warn')
 const watchItems = allVisible.filter(i => i.urgency === 'watch')

 return (
  <div className="flex flex-col h-full overflow-hidden content-reveal">
   <CommandBanner
    critItems={critItems}
    watchItems={watchItems}
    pendingIds={pendingIds}
    readiness={readiness}
    activeExposures={activeExposures}
   />
   <div className="flex flex-1 min-h-0 overflow-hidden">
    <TriageQueue
     critItems={critItems}
     warnItems={warnItems}
     watchItems={watchItems}
     pendingIds={pendingIds}
     onAcknowledge={handleAcknowledge}
     escalationStates={escalationStates}
    />
    <PlantStrip />
   </div>
   <UndoToast
    entries={[...pendingRemoval.entries()].map(([id, v]) => ({ id, ...v }))}
    onUndo={handleUndo}
   />
  </div>
 )
}
