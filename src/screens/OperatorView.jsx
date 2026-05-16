import { useState } from 'react'
import { Flag, ShieldCheck, Check, Lock, AlertTriangle, Activity, CheckCircle2, WifiOff, Brain } from 'lucide-react'
import { operatorContextData, fatigueData } from '../data'
import { integrationSummary, connectors } from '../data/integrations'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, PersonAvatar, Btn, Modal } from '../components/UI'

// ── Static operator data ──────────────────────────────────────────────────────

const OPERATORS = [
 { name: 'C. Reyes',   role: 'L1 · Pack Line · 14 months',  initials: 'CR', station: 'Sauce Dosing (covering)', certPct: 72, certLabel: '72% to L2 Sauce Dosing', certColor: 'bg-warn', certText: 'text-warn' },
 { name: 'P. Okonkwo', role: 'L2 · Topping · 22 months',    initials: 'PO', station: 'Oven Station B',          certPct: 91, certLabel: '91% to L3 Sauce Dosing', certColor: 'bg-ok',   certText: 'text-ok'   },
 { name: 'F. Adeyemi', role: 'L1 · QA · 8 months',          initials: 'FA', station: 'QA Check Station',        certPct: 40, certLabel: '40% to L2 QA Inspector',  certColor: 'bg-ghost',certText: 'text-muted' },
]

const ROLE_TO_OPERATOR = {
 'operator-reyes':   'C. Reyes',
 'operator-okonkwo': 'P. Okonkwo',
}

// Tasks linked to AI interventions — operator confirmation closes the causal chain
const LINKED_TASKS = {
 'C. Reyes': [
  {
   id: 'lt-cr-01',
   label: 'Post-hold confirmation: log benzaldehyde reading at Vessel F-047',
   interventionId: 'INT-2026-047-01',
   interventionLabel: 'QualityGuard · Micro-hold',
   done: true,
   confirmedAt: '09:22',
  },
 ],
 'P. Okonkwo': [
  {
   id: 'lt-po-01',
   label: 'CAPA-2604-006: assemble and submit evidence package',
   interventionId: 'INT-2026-capa-01',
   interventionLabel: 'CAPAEngine · Escalation',
   done: true,
   confirmedAt: '14:30',
  },
 ],
 'F. Adeyemi': [],
}

// ── Data commitment modal ─────────────────────────────────────────────────────

function DataCommitmentOverlay({ onAcknowledge }) {
 return (
  <Modal title="Before you start — your data rights">
   <div className="overflow-y-auto flex-1 px-5 py-5">
    <div className="flex items-start gap-3 mb-4">
     <ShieldCheck size={20} strokeWidth={1.75} className="text-ok flex-shrink-0 mt-0.5" />
     <div>
      <div className="font-display font-bold text-ink text-[16px] leading-snug mb-1">Before you start — your data rights</div>
      <p className="font-body text-ink2 text-[12px] leading-relaxed">Takorin monitors production signals to help you do your job safely and to support your career. Here's exactly what that means for your data.</p>
     </div>
    </div>
    <div className="space-y-2 mb-5">
     {[
      { icon: Check,       label: 'Your supervisor can see',      items: ['Your task completion status', 'Shift checklist items you signed or flagged', 'Near-miss reports you submitted', 'Your hours worked this week and consecutive shifts', 'Your fatigue status (a scheduling signal, not a performance rating)'] },
      { icon: Lock,        label: 'Not visible to your supervisor', items: ['The reason you dismissed a specific finding', 'Your certification progress score'] },
      { icon: ShieldCheck, label: 'How your data is used',    items: ['Fatigue and hours data is used for scheduling only — it does not affect your performance review', 'You can see your own fatigue and hours data in your dashboard at any time', 'Anonymized production patterns only used for model training — no names attached'] },
     ].map(({ icon: Icon, label, items }) => (
      <div key={label} className="px-3 py-2.5 bg-stone2 border border-rule2">
       <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
        <span className="font-body font-medium text-ink text-[11px]">{label}</span>
       </div>
       <ul className="space-y-0.5">
        {items.map(item => (
         <li key={item} className="font-body text-ink2 text-[11px] flex items-start gap-1.5">
          <span className="text-ghost mt-px">·</span>{item}
         </li>
        ))}
       </ul>
      </div>
     ))}
    </div>
   </div>
   <div className="px-5 py-4 border-t border-rule2 flex-shrink-0">
    <Btn variant="primary" onClick={onAcknowledge}>I understand — show my dashboard</Btn>
   </div>
  </Modal>
 )
}

// ── Layer 1: Operational State Header ────────────────────────────────────────
// The anchor. Tells the operator what mode they are in, not who they are.

function OperationalStateHeader({ ctx }) {
 if (!ctx || ctx.mode === 'STANDARD_OPERATION') {
  return (
   <div className="flex-shrink-0 px-5 py-4 border-b-2 border-b-rule2 bg-stone">
    <div className="flex items-center gap-2 mb-0.5">
     <CheckCircle2 size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
     <div className="font-body text-ok text-[10px] uppercase tracking-widest font-medium">Standard Operation</div>
    </div>
    <div className="font-display font-bold text-ink text-[18px] leading-none mb-1">{ctx?.station} · {ctx?.condition}</div>
    <div className="font-body text-ghost text-[11px]">{ctx?.conditionDetail}</div>
   </div>
  )
 }
 const isDanger = ctx.mode === 'ELEVATED_RISK_COVERAGE'
 const Icon = isDanger ? AlertTriangle : Activity
 const borderClass = isDanger ? 'border-b-danger/30 bg-danger/[0.03]' : 'border-b-warn/20 bg-warn/[0.02]'
 const textClass  = isDanger ? 'text-danger' : 'text-warn'
 return (
  <div className={`flex-shrink-0 px-5 py-4 border-b-2 ${borderClass}`}>
   <div className="flex items-center gap-2 mb-0.5">
    <Icon size={12} strokeWidth={2} className={`flex-shrink-0 ${textClass}`} />
    <div className={`font-body text-[10px] uppercase tracking-widest font-medium ${textClass}`}>{ctx.modeLabel}</div>
   </div>
   <div className="font-display font-bold text-ink text-[18px] leading-none mb-1">
    {ctx.station} · {ctx.condition}
   </div>
   <div className="font-body text-ghost text-[11px]">{ctx.conditionDetail}</div>
  </div>
 )
}

// ── Primary Directive ─────────────────────────────────────────────────────────
// Singular operational directive. First-class object, not an alert.

function PrimaryDirective({ ctx }) {
 if (!ctx) return null
 const isDanger = ctx.mode === 'ELEVATED_RISK_COVERAGE'
 const borderClass = isDanger ? 'border-l-danger' : 'border-l-warn'
 const dotClass    = isDanger ? 'bg-danger beat' : 'bg-warn'
 const badgeClass  = isDanger ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
 return (
  <div className={`flex-shrink-0 px-5 py-3.5 border-b border-rule2 border-l-2 ${borderClass}`}>
   <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-2.5 flex-1 min-w-0">
     <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dotClass}`} />
     <div>
      <div className="font-body font-medium text-ink text-[13px] leading-snug">{ctx.directive}</div>
      {ctx.guidanceLevel === 'high' && (
       <div className="font-body text-ghost text-[10px] mt-0.5">Ask your supervisor if unsure about any step</div>
      )}
     </div>
    </div>
    <div className={`font-body text-[10px] px-2 py-0.5 flex-shrink-0 rounded-btn whitespace-nowrap ${badgeClass}`}>
     Before {ctx.directiveDeadline}
    </div>
   </div>
  </div>
 )
}

// ── Procedural Surface — for ELEVATED_RISK_COVERAGE ──────────────────────────
// Sequential verification. Next step locked until previous is confirmed.

function ProceduralSurface({ ctx, completions, onComplete, onRequestSignOff }) {
 const steps = ctx.procedure || []
 const completedSet = new Set(completions || [])
 const completedCount = steps.filter(s => completedSet.has(s.id)).length
 const allComplete = completedCount === steps.length
 return (
  <div>
   {/* CCP card — always pinned */}
   <div className="px-5 py-3 bg-warn/[0.04] border-b border-warn/20 flex items-center gap-2.5">
    <div className="w-2 h-2 rounded-full bg-warn flex-shrink-0" />
    <span className="font-body font-medium text-warn text-[12px]">{ctx.ccp.label}</span>
    <span className="font-body text-warn/80 text-[11px]"> · {ctx.ccp.requirement}</span>
   </div>

   {/* Mismatch notice */}
   {ctx.mismatch && (
    <div className="px-5 py-3 bg-danger/[0.03] border-b border-danger/15 flex items-start gap-2.5">
     <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0 mt-px" />
     <div>
      <div className="font-body font-medium text-danger text-[11px]">Coverage mismatch detected</div>
      <div className="font-body text-danger/70 text-[10px]">{ctx.mismatchNote}</div>
     </div>
    </div>
   )}

   {/* Steps header */}
   <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Verification sequence</span>
    <span className="font-body text-ghost text-[10px]">{completedCount} of {steps.length}</span>
   </div>

   {/* Steps */}
   {steps.map((step, i) => {
    const done    = completedSet.has(step.id)
    const enabled = !done && (i === 0 || completedSet.has(steps[i - 1].id))
    return (
     <div key={step.id}
      className={`flex items-start gap-3 px-5 py-4 border-b border-rule2 transition-opacity ${
       done ? 'opacity-40' : enabled ? '' : 'opacity-30 pointer-events-none'
      }`}>
      <button
       type="button"
       disabled={!enabled}
       onClick={() => enabled && onComplete(step.id)}
       className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
        done    ? 'bg-ok' :
        enabled ? 'border-2 border-warn hover:border-ok hover:bg-ok/10 cursor-pointer' :
                  'border-2 border-rule2'
       }`}
      >
       {done && <Check size={11} strokeWidth={2.5} className="text-white" />}
      </button>
      <div className="flex-1">
       <div className={`font-body text-[12px] leading-snug ${done ? 'text-ghost line-through' : 'text-ink font-medium'}`}>
        {i + 1}. {step.label}
       </div>
       {ctx.guidanceLevel === 'high' && enabled && i === 0 && (
        <div className="font-body text-ghost text-[10px] mt-1 italic">Confirm each step carefully — you are covering above cert level</div>
       )}
      </div>
     </div>
    )
   })}

   {/* Completion */}
   {allComplete && (
    <div className="px-5 py-4 bg-ok/[0.04] border-b border-ok/20">
     <div className="flex items-center gap-2 mb-1.5">
      <CheckCircle2 size={13} strokeWidth={2} className="text-ok flex-shrink-0" />
      <span className="font-body font-medium text-ok text-[13px]">Verification complete</span>
     </div>
     <div className="font-body text-ok/80 text-[11px] mb-3">All steps verified · Await supervisor sign-off before restarting the line</div>
     <Btn variant="secondary" onClick={onRequestSignOff}>Request supervisor sign-off</Btn>
    </div>
   )}
  </div>
 )
}

// ── Monitoring Surface — for CCP_MONITORING ───────────────────────────────────
// Live CCP state. Fast-log interaction. Low friction.

function MonitoringSurface({ ctx, entries, onLog }) {
 const [logging, setLogging] = useState(false)
 const [inputVal, setInputVal] = useState('')
 const allEntries = [...(ctx.tempLog || []), ...(entries || [])]
 const lastEntry  = allEntries[allEntries.length - 1]
 const lastValue  = lastEntry?.value
 const minTemp    = 185
 const ccpMet     = lastValue != null && lastValue >= minTemp
 const belowLimit = inputVal && Number(inputVal) < minTemp
 return (
  <div>
   {/* CCP status card */}
   <div className="px-5 py-5 border-b border-rule2">
    <div className="font-body text-ghost text-[10px] mb-2">{ctx.ccp.label} · {ctx.ccp.requirement}</div>
    <div className="flex items-baseline gap-3 mb-1">
     <span className={`display-num text-[52px] font-bold leading-none ${
      lastValue == null ? 'text-ghost' : ccpMet ? 'text-ok' : 'text-danger'
     }`}>
      {lastValue != null ? `${lastValue}°F` : '—'}
     </span>
     {lastValue != null && (
      <span className={`font-body text-[11px] px-2 py-0.5 rounded-btn ${ccpMet ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>
       {ccpMet ? 'Compliant' : 'BELOW LIMIT'}
      </span>
     )}
    </div>
    {lastEntry && (
     <div className="font-body text-ghost text-[10px]">Last logged: {lastEntry.time}</div>
    )}
   </div>

   {/* Log button / input */}
   <div className="px-5 py-4 border-b border-rule2">
    {!logging ? (
     <>
      <Btn variant="primary" onClick={() => setLogging(true)} className="w-full">
       Log temperature reading
      </Btn>
      <div className="font-body text-ghost text-[10px] mt-2 text-center">
       Next reading due: {ctx.directiveDeadline}
      </div>
     </>
    ) : (
     <>
      <div className="font-body text-ghost text-[10px] mb-2">{ctx.ccp.label} — enter °F reading</div>
      <div className="flex gap-2 mb-2">
       <input
        type="number"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        placeholder="185"
        autoFocus
        className="flex-1 font-body text-ink text-[14px] px-3 py-2 border border-rule2 bg-stone2 focus:outline-none focus:border-ochre"
       />
       <Btn variant="primary" onClick={() => {
        if (inputVal) { onLog(Number(inputVal)); setLogging(false); setInputVal('') }
       }}>Log</Btn>
       <Btn variant="secondary" onClick={() => { setLogging(false); setInputVal('') }}>Cancel</Btn>
      </div>
      {belowLimit && (
       <div className="font-body text-danger text-[11px] flex items-center gap-1.5">
        <AlertTriangle size={11} strokeWidth={2} className="flex-shrink-0" />
        Below {minTemp}°F minimum — log and notify supervisor immediately
       </div>
      )}
     </>
    )}
   </div>

   {/* Reading history */}
   <div className="px-5 py-4">
    <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Reading history</div>
    <div className="space-y-px">
     {[...allEntries].reverse().map((r, i) => (
      <div key={i} className="flex items-center gap-3 py-2 border-b border-rule2 last:border-b-0">
       <span className="font-body text-ghost text-[10px] w-10 flex-shrink-0">{r.time}</span>
       <span className={`display-num text-[16px] font-bold ${r.value >= minTemp ? 'text-ok' : 'text-danger'}`}>{r.value}°F</span>
       <div className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.value >= minTemp ? 'bg-ok' : 'bg-danger'}`} />
      </div>
     ))}
    </div>
   </div>
  </div>
 )
}

// ── Task Section — always below dominant surface ───────────────────────────────

function TaskSection({ selected, station, tasks, linkedTasks, flags, nearMisses, onLinkedTaskConfirm }) {
 const allTasks = [...tasks, ...linkedTasks]
 const pendingCount = allTasks.filter(t => !t.done).length
 return (
  <>
   <SecHd tag="Today's tasks" title={`${station || selected.split(' ')[1] || selected} · April 16`}
    badge={allTasks.length > 0 ? <Urg level={pendingCount > 0 ? 'warn' : 'ok'}>{pendingCount} pending</Urg> : null} />
   {allTasks.length === 0 ? (
    <div className="px-5 py-4 font-body text-ghost text-[12px]">No tasks yet — tasks assigned by your supervisor appear here.</div>
   ) : allTasks.map((t, i) => (
    <div key={t.id ?? i} className={`flex items-start gap-3 px-5 py-3.5 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-60' : ''}`}>
     <button type="button"
      disabled={t.done || !t.interventionId}
      onClick={() => t.interventionId && !t.done && onLinkedTaskConfirm(t)}
      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
       t.done ? 'bg-ok cursor-default' : t.interventionId ? 'border-2 border-ochre hover:bg-ochre/10 cursor-pointer' : 'border-2 border-rule2 cursor-default'
      }`}>
      {t.done && <Check size={11} strokeWidth={2.5} className="text-white" />}
     </button>
     <div className="flex-1 min-w-0">
      <div className={`font-body font-medium text-[12px] leading-snug ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
      <div className="flex items-center gap-2 mt-0.5">
       {t.dueTime && <span className="font-body text-ghost text-[9px]">Due {t.dueTime}</span>}
       {t.interventionId && (
        <span className="flex items-center gap-0.5 font-body text-[9px] text-ochre">
         <Brain size={8} strokeWidth={2} />{t.interventionLabel}
        </span>
       )}
       {t.done && t.confirmedAt && (
        <span className="font-body text-ok text-[9px]">Confirmed {t.confirmedAt}</span>
       )}
      </div>
     </div>
    </div>
   ))}
   <div className="px-5 py-3 border-t border-rule2 font-body text-ghost text-[10px]">
    If you cannot complete a safety check, use the Flag button in ShiftIQ checklist — do not leave it unsigned without a reason.
   </div>

   {flags.length > 0 && (
    <div className="border-t border-rule2">
     <SecHd tag="Flagged items" title="Items you could not complete" badge={<Urg level="warn">{flags.length} flagged</Urg>} />
     {flags.map((f, i) => (
      <div key={i} className="flex items-start gap-2.5 px-5 py-3.5 border-b border-rule2 last:border-b-0 bg-warn/[0.02]">
       <Flag size={12} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
       <div>
        <div className="font-body font-medium text-ink text-[12px]">{f.key}</div>
        <div className="font-body text-warn text-[11px]">{f.reason}</div>
       </div>
      </div>
     ))}
    </div>
   )}

   {nearMisses.length > 0 && (
    <div className="border-t border-rule2">
     <SecHd tag="Near-miss reports" title="Submitted this shift" badge={<Urg level="ok">{nearMisses.length} logged</Urg>} />
     {nearMisses.map((n, i) => (
      <div key={i} className="px-5 py-3.5 border-b border-rule2 last:border-b-0">
       <div className="font-body font-medium text-ink text-[12px]">{n.station}</div>
       <div className="font-body text-ink2 text-[11px] mt-0.5">{n.what}</div>
       {n.action && <div className="font-body text-ok text-[10px] mt-0.5">Corrective step: {n.action}</div>}
      </div>
     ))}
    </div>
   )}
  </>
 )
}

// Training pathway and Roster Overview have been removed from the operational view.
// Training belongs in a between-shift development surface.
// Roster/absence/fatigue belongs in ShiftIQ supervisor context.

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OperatorView({ role }) {
 const isOperatorRole = role === 'operator-reyes' || role === 'operator-okonkwo'
 const [directorSelected, setDirectorSelected] = useState('C. Reyes')
 const [supervisorCalled, setSupervisorCalled] = useState(false)
 const [linkedTaskState, setLinkedTaskState] = useState({}) // local overrides for linked task completion
 const selected = isOperatorRole ? (ROLE_TO_OPERATOR[role] ?? 'C. Reyes') : directorSelected
 const [procedureCompletions, setProcedureCompletions] = useState({})
 const [tempLogEntries, setTempLogEntries] = useState({})

 const {
  taskAssignments, flaggedItems, nearMisses,
  operatorAcknowledgments, setOperatorAcknowledgments, logActivity,
 } = useAppState()

 const dataCommitted = !!operatorAcknowledgments?.['dataCommitment']
 const op    = OPERATORS.find(o => o.name === selected)
 const ctx   = operatorContextData[selected] || null
 const tasks = taskAssignments[selected] || []
 const flags = Object.entries(flaggedItems).filter(([, f]) => f).map(([key, f]) => ({ key, ...f }))
 const nms   = nearMisses.filter(n => n.station)

 // Apply any local state overrides to linked tasks
 const linkedTasks = (LINKED_TASKS[selected] || []).map(t => ({
  ...t,
  ...(linkedTaskState[t.id] || {}),
 }))

 const myCompletions = procedureCompletions[selected] || []
 const myTempEntries = tempLogEntries[selected] || []

 const staleConnectors = connectors.filter(c => {
  if (c.status !== 'active' || !c.lastSync) return false
  const parts = c.lastSync.match(/(\d+)s|(\d+)m|(\d+)h/)
  if (!parts) return false
  const mins = parts[3] ? parseInt(parts[3]) * 60 : parts[2] ? parseInt(parts[2]) : (parts[1] ? parseInt(parts[1]) / 60 : 0)
  return mins > 60
 }).length
 const trustDegraded = integrationSummary.active < integrationSummary.total * 0.7

 const handleStepComplete = (stepId) => {
  setProcedureCompletions(prev => ({
   ...prev,
   [selected]: [...(prev[selected] || []), stepId],
  }))
 }

 const handleTempLog = (value) => {
  const now  = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  setTempLogEntries(prev => ({
   ...prev,
   [selected]: [...(prev[selected] || []), { time, value }],
  }))
  logActivity({ actor: selected, action: `CCP temperature logged: ${value}°F`, item: ctx?.ccp?.label, type: 'compliance' })
 }

 const handleRequestSignOff = () => {
  logActivity({ actor: selected, action: 'Requested supervisor sign-off', item: 'Allergen flush verification', type: 'escalation' })
  setSupervisorCalled(true)
 }

 const handleLinkedTaskConfirm = (task) => {
  const now  = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  setLinkedTaskState(prev => ({ ...prev, [task.id]: { done: true, confirmedAt: time } }))
  logActivity({
   actor: selected,
   action: `Intervention outcome confirmed: ${task.label}`,
   item: task.interventionId,
   type: 'intervention-confirmation',
  })
 }

 return (
  <>
  {/* DataCommitmentOverlay — only for real operator sessions, not director simulation */}
  {isOperatorRole && !dataCommitted && (
   <DataCommitmentOverlay onAcknowledge={() => setOperatorAcknowledgments(p => ({ ...p, dataCommitment: true }))} />
  )}
  <div className="flex flex-col h-full overflow-hidden content-reveal">

   {/* ── Director: simulation notice + operator selector ──────── */}
   {!isOperatorRole && (
    <>
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-rule2 bg-stone2">
     <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Station simulation</span>
     <span className="font-body text-muted text-[9px]">—</span>
     <span className="font-body text-ghost text-[9px]">Viewing {selected}'s station as director. Not a live session.</span>
    </div>
    <div className="flex border-b border-rule2 bg-stone flex-shrink-0">
     {OPERATORS.map(o => (
      <button type="button" key={o.name} aria-pressed={selected === o.name}
       onClick={() => { setDirectorSelected(o.name); setSupervisorCalled(false) }}
       className={`flex items-center gap-2 px-4 py-2.5 border-r border-rule2 border-b-2 transition-colors ${
        selected === o.name ? 'border-b-ochre bg-stone2' : 'border-b-transparent hover:bg-stone2/50'
       }`}>
       <PersonAvatar name={o.name} size={22} />
       <div className="text-left">
        <div className="font-body font-medium text-ink text-[11px]">{o.name}</div>
        <div className="font-body text-ghost text-[9px]">{o.station}</div>
       </div>
      </button>
     ))}
    </div>
    </>
   )}

   {/* ── Operator: station-first hero bar ────────────────────── */}
   {isOperatorRole && (
    <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-rule2 bg-stone2">
     <div>
      <div className="font-display font-bold text-ink text-[16px] leading-none">{ctx?.station || op?.station}</div>
      <div className="font-body text-ghost text-[10px] mt-0.5">Line 4 · AM shift · {selected}</div>
     </div>
     {trustDegraded && (
      <div className="flex items-center gap-1.5 px-2 py-1 border border-warn/30 bg-warn/[0.04]">
       <WifiOff size={9} strokeWidth={2} className="text-warn" />
       <span className="font-body text-warn text-[9px]">Some signals stale</span>
      </div>
     )}
    </div>
   )}

   {/* ── Operational State Header ─────────────────────────────── */}
   <OperationalStateHeader ctx={ctx} />

   {/* ── Primary Directive ────────────────────────────────────── */}
   <PrimaryDirective ctx={ctx} />

   {/* ── Main content ─────────────────────────────────────────── */}
   <div className="flex-1 overflow-y-auto">

    {/* Dominant surface */}
    {ctx?.dominantSurface === 'procedural' && (
     <ProceduralSurface
      ctx={ctx}
      completions={myCompletions}
      onComplete={handleStepComplete}
      onRequestSignOff={handleRequestSignOff}
     />
    )}
    {ctx?.dominantSurface === 'monitoring' && (
     <MonitoringSurface
      ctx={ctx}
      entries={myTempEntries}
      onLog={handleTempLog}
     />
    )}

    {/* Tasks — always below dominant surface */}
    <div className="border-t border-rule2">
     <TaskSection
      selected={selected}
      station={ctx?.station || op?.station}
      tasks={tasks}
      linkedTasks={linkedTasks}
      flags={flags}
      nearMisses={nms}
      onLinkedTaskConfirm={handleLinkedTaskConfirm}
     />
    </div>

    {/* My scheduling data — operator only, transparent and bounded */}
    {isOperatorRole && (() => {
     const myFatigue = fatigueData.operators.find(o =>
      o.name.includes(selected.split('.')[1]?.trim()) || selected.includes(o.name.split('.')[0])
     )
     if (!myFatigue) return null
     return (
      <div className="border-t border-rule2 px-5 py-3">
       <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">My scheduling data</div>
       <p className="font-body text-ghost text-[9px] mb-2">Shift scheduling only — not your performance review.</p>
       <div className="grid grid-cols-3 gap-2">
        {[
         { label: 'Hours this week', value: `${myFatigue.hoursThisWeek}h` },
         { label: 'Consecutive shifts', value: String(myFatigue.consecutiveShifts) },
         { label: 'Last rest', value: myFatigue.lastRestPeriod ? `${myFatigue.lastRestPeriod}h ago` : '—' },
        ].map(({ label, value }) => (
         <div key={label} className="bg-stone2 px-3 py-2 border border-rule2">
          <div className="display-num text-[18px] text-ink">{value}</div>
          <div className="font-body text-ghost text-[9px] mt-0.5">{label}</div>
         </div>
        ))}
       </div>
       {myFatigue.note && <p className="font-body text-warn text-[9px] mt-2">{myFatigue.note}</p>}
      </div>
     )
    })()}
   </div>

   {/* FAB */}
   <button type="button"
    onClick={() => {
     if (!supervisorCalled) {
      setSupervisorCalled(true)
      logActivity({ actor: selected, action: 'Requested supervisor assistance', item: ctx?.station || 'Station', type: 'escalation' })
     }
    }}
    className={`fixed bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 min-h-[40px] font-body text-[12px] font-medium rounded-btn transition-colors duration-100 shadow-raise ${
     supervisorCalled ? 'bg-ok text-white' : 'bg-danger text-white hover:bg-danger/90'
    }`}
    aria-label="Request supervisor assistance"
   >
    {supervisorCalled
     ? <><Check size={14} />Supervisor notified</>
     : <><AlertTriangle size={14} />I need my supervisor</>
    }
   </button>

  </div>
  </>
 )
}
