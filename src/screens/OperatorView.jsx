import { useState } from 'react'
import { Flag, ShieldCheck, Clock, Check, Lock, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react'
import { operatorContextData } from '../data'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, PersonAvatar, Btn, Modal } from '../components/UI'

// ── Static operator data ──────────────────────────────────────────────────────

const OPERATORS = [
 { name: 'C. Reyes',   role: 'L1 · Pack Line · 14 months',  initials: 'CR', station: 'Sauce Dosing (covering)', certPct: 72, certLabel: '72% to L2 Sauce Dosing', certColor: 'bg-warn', certText: 'text-warn' },
 { name: 'P. Okonkwo', role: 'L2 · Topping · 22 months',    initials: 'PO', station: 'Oven Station B',          certPct: 91, certLabel: '91% to L3 Sauce Dosing', certColor: 'bg-ok',   certText: 'text-ok'   },
 { name: 'F. Adeyemi', role: 'L1 · QA · 8 months',          initials: 'FA', station: 'QA Check Station',        certPct: 40, certLabel: '40% to L2 QA Inspector',  certColor: 'bg-ghost',certText: 'text-muted' },
]

const TRAINING_PATHWAY = {
 'C. Reyes': {
  currentLevel: 'L1 Pack Line', nextLevel: 'L2 Sauce Dosing', assessmentWindow: 'May 12–16, 2026',
  modules: [
   { label: 'CCP-1 Hold Temperature — Sauce Dosing', status: 'complete',     hours: 2   },
   { label: 'Allergen changeover procedure',          status: 'complete',     hours: 1.5 },
   { label: 'HACCP documentation',                    status: 'in-progress',  hours: 3   },
   { label: 'Supervised dosing shifts × 5',           status: 'in-progress',  hours: 10  },
   { label: 'L2 Practical assessment',                status: 'locked',       hours: 1,  lockedReason: 'Complete supervised dosing shifts first' },
  ],
 },
 'P. Okonkwo': {
  currentLevel: 'L2 Topping', nextLevel: 'L3 Sauce Dosing', assessmentWindow: 'Jun 2–6, 2026',
  modules: [
   { label: 'Advanced CCP management',          status: 'complete',    hours: 4 },
   { label: 'Yield optimization — Sauce Dosing', status: 'complete',    hours: 3 },
   { label: 'Line lead responsibilities',        status: 'in-progress', hours: 6 },
   { label: 'L3 Practical assessment',           status: 'locked',      hours: 2, lockedReason: 'Complete line lead responsibilities first' },
  ],
 },
 'F. Adeyemi': {
  currentLevel: 'L1 QA', nextLevel: 'L2 QA Inspector', assessmentWindow: 'Jul 7–11, 2026',
  modules: [
   { label: 'Microbiological testing basics',    status: 'complete',    hours: 2 },
   { label: 'FSMA 204 documentation',            status: 'in-progress', hours: 3 },
   { label: 'Environmental monitoring program',  status: 'locked',      hours: 4, lockedReason: 'Complete FSMA 204 documentation first' },
   { label: 'L2 QA assessment',                  status: 'locked',      hours: 1, lockedReason: 'Complete environmental monitoring first' },
  ],
 },
}

const ROLE_TO_OPERATOR = {
 'operator-reyes':   'C. Reyes',
 'operator-okonkwo': 'P. Okonkwo',
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
      { icon: Check,       label: 'Your supervisor can see',      items: ['Your task completion status', 'Shift checklist items you signed or flagged', 'Near-miss reports you submitted'] },
      { icon: Lock,        label: 'Not visible to your supervisor', items: ['The reason you dismissed a specific finding', 'Your certification progress score'] },
      { icon: ShieldCheck, label: 'Takorin\'s model training',    items: ['Uses anonymized production patterns only — no names attached to training data'] },
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

function TaskSection({ selected, tasks, flags, nearMisses }) {
 const pendingCount = tasks.filter(t => !t.done).length
 return (
  <>
   <SecHd tag="Today's tasks" title={`Assigned to ${selected} — April 16`}
    badge={tasks.length > 0 ? <Urg level={pendingCount > 0 ? 'warn' : 'ok'}>{pendingCount} pending</Urg> : null} />
   {tasks.length === 0 ? (
    <div className="px-5 py-4 font-body text-ghost text-[12px]">No tasks yet — tasks assigned by your supervisor in ShiftIQ will appear here.</div>
   ) : tasks.map((t, i) => (
    <div key={i} className={`flex items-center gap-3 px-5 py-4 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
     <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-ok' : 'border-2 border-rule2'}`}>
      {t.done && <Check size={11} strokeWidth={2.5} className="text-white" />}
     </div>
     <div className="flex-1">
      <div className={`font-body font-medium text-[13px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
      {t.dueTime && <div className="font-body text-ghost text-[10px]">Due {t.dueTime}</div>}
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

// ── Training panel (right rail) — stable shell ────────────────────────────────

function TrainingPanel({ selected, op }) {
 const pathway = TRAINING_PATHWAY[selected]
 if (!pathway) return null
 const done  = pathway.modules.filter(m => m.status === 'complete').length
 const total = pathway.modules.length
 return (
  <div className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">
   <div className="px-4 py-4 border-b border-rule2 bg-stone">
    <div className="font-body text-ghost text-[10px] mb-0.5">Your path to</div>
    <div className="font-display font-bold text-ink text-[15px]">{pathway.nextLevel}</div>
    <div className="mt-3">
     <div className="h-2 bg-rule2 mb-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${op?.certColor || 'bg-warn'}`} style={{ width: `${op?.certPct || 0}%` }} />
     </div>
     <div className="flex items-baseline justify-between">
      <span className={`display-num text-2xl font-bold ${op?.certText || 'text-warn'}`}>{op?.certPct}%</span>
      <span className="font-body text-ghost text-[10px]">{done} of {total} modules</span>
     </div>
    </div>
   </div>
   <div className="px-4 py-3 border-b border-rule2 bg-stone flex items-center gap-2">
    <Clock size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
    <div>
     <div className="font-body text-ghost text-[10px]">Next assessment window</div>
     <div className="font-body font-medium text-ink text-[12px]">{pathway.assessmentWindow}</div>
    </div>
   </div>
   <div className="px-4 pt-3 pb-1 font-body text-ghost text-[10px] uppercase tracking-widest border-b border-rule2">What you need to do</div>
   {pathway.modules.map((mod, i) => (
    <div key={i} className={`flex items-start gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 bg-stone ${mod.status === 'locked' ? 'opacity-40' : ''}`}>
     <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
      mod.status === 'complete'    ? 'bg-ok'                    :
      mod.status === 'in-progress' ? 'border-2 border-warn'     :
                                     'border-2 border-rule2'
     }`}>
      {mod.status === 'complete'    && <Check size={11} strokeWidth={2.5} className="text-white" />}
      {mod.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-warn" />}
      {mod.status === 'locked'      && <Lock size={9} strokeWidth={2} className="text-ghost" />}
     </div>
     <div className="flex-1 min-w-0">
      <div className={`font-body text-[12px] leading-snug ${
       mod.status === 'complete' ? 'text-ghost line-through' : mod.status === 'locked' ? 'text-ghost' : 'text-ink font-medium'
      }`}>{mod.label}</div>
      <div className="font-body text-ghost text-[10px] mt-0.5">{mod.hours}h</div>
      {mod.status === 'locked' && mod.lockedReason && (
       <div className="font-body text-ghost text-[10px] mt-0.5 italic">{mod.lockedReason}</div>
      )}
     </div>
    </div>
   ))}
   <div className="px-4 py-3 border-t border-rule2 mt-auto bg-stone">
    <div className="font-body text-ghost text-[10px] mb-0.5">Current certification</div>
    <div className="font-body font-medium text-ink text-[12px]">{pathway.currentLevel}</div>
    {selected === 'F. Adeyemi' && (
     <div className="font-body text-warn text-[10px] mt-1 flex items-center gap-1">
      <Clock size={9} strokeWidth={2} />
      Expires in 35 days — renewal scheduled
     </div>
    )}
   </div>
  </div>
 )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OperatorView({ role }) {
 const isOperatorRole = role === 'operator-reyes' || role === 'operator-okonkwo'
 const [directorSelected, setDirectorSelected] = useState('C. Reyes')
 const [supervisorCalled, setSupervisorCalled] = useState(false)
 // When in operator mode, always derive from role prop (not state) so switching
 // roles via the user dropdown immediately shows the correct operator.
 const selected = isOperatorRole ? (ROLE_TO_OPERATOR[role] ?? 'C. Reyes') : directorSelected
 const [procedureCompletions, setProcedureCompletions] = useState({})
 const [tempLogEntries, setTempLogEntries]     = useState({})

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

 const myCompletions  = procedureCompletions[selected] || []
 const myTempEntries  = tempLogEntries[selected] || []

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

 return (
  <>
  {!dataCommitted && (
   <DataCommitmentOverlay onAcknowledge={() => setOperatorAcknowledgments(p => ({ ...p, dataCommitment: true }))} />
  )}
  <div className="flex flex-col h-full overflow-hidden content-reveal">

   {/* Operator selector — director only / hero bar for operators */}
   {!isOperatorRole ? (
    <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0">
     {OPERATORS.map(o => (
      <button type="button" key={o.name} type="button" aria-pressed={selected === o.name}
       onClick={() => { setDirectorSelected(o.name); setSupervisorCalled(false) }}
       className={`flex items-center gap-2.5 px-4 py-2.5 border-r border-rule2 border-b-2 transition-colors ${
        selected === o.name ? 'border-b-ochre bg-stone' : 'border-b-transparent hover:bg-stone3'
       }`}>
       <PersonAvatar name={o.name} size={28} />
       <div className="text-left">
        <div className="font-body font-medium text-ink text-[13px]">{o.name}</div>
        <div className="font-body text-ghost text-[11px]">{o.role.split('·')[0].trim()}</div>
       </div>
      </button>
     ))}
    </div>
   ) : (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 bg-stone2 flex-shrink-0">
     <PersonAvatar name={selected} size={28} />
     <div>
      <div className="font-body font-medium text-ink text-[13px]">{selected}</div>
      <div className="font-body text-ghost text-[11px]">{op?.station}</div>
     </div>
    </div>
   )}

   {/* Layer 1: Operational State Header */}
   <OperationalStateHeader ctx={ctx} />

   {/* Primary Directive */}
   <PrimaryDirective ctx={ctx} />

   {/* Main content */}
   <div className="flex flex-1 min-h-0 overflow-hidden">
    <div className="flex-1 overflow-y-auto border-r border-rule2">

     {/* Layer 2: Dominant surface */}
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
      <TaskSection selected={selected} tasks={tasks} flags={flags} nearMisses={nms} />
     </div>
    </div>

    {/* Right rail: training pathway — stable shell */}
    <TrainingPanel selected={selected} op={op} />
   </div>

   {/* FAB — stable, always same position and behavior */}
   <button
    type="button"
    onClick={() => {
     if (!supervisorCalled) {
      setSupervisorCalled(true)
      logActivity({ actor: selected, action: 'Requested supervisor assistance', item: op?.station || 'Station', type: 'escalation' })
     }
    }}
    className={`fixed bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 min-h-[40px] font-body text-[12px] font-medium rounded-btn transition-colors duration-100 ${
     supervisorCalled
      ? 'bg-ok text-white shadow-raise'
      : 'bg-danger text-white shadow-raise hover:bg-danger/90'
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
