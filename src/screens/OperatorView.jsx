import { useState } from 'react'
import { Flag, ShieldCheck, Check, Lock, AlertTriangle, Activity, CheckCircle2, WifiOff, Brain, BookOpen, ChevronDown, ChevronUp, Send, MessageSquare, X, Eye, ListChecks } from 'lucide-react'
import { operatorContextData, fatigueData } from '../data'
import { integrationSummary, connectors } from '../data/integrations'
import { useAppState } from '../context/AppState'
import { SectionHeader, StatusPill, PersonAvatar, Btn, Modal, Tabs, AnimatedScore } from '../components/UI'
import { OBSERVATION_CATEGORIES, OBSERVATION_STATIONS } from '../data/observations'

// ── Static operator data ──────────────────────────────────────────────────────

const OPERATORS = [
 { name: 'C. Reyes',   role: 'L1 · Pack Line · 14 months',  initials: 'CR', station: 'Sauce Dosing (covering)', certPct: 72, certLabel: '72% to L2 Sauce Dosing', certColor: 'bg-warn', certText: 'text-warn' },
 { name: 'P. Okonkwo', role: 'L2 · Topping · 22 months',    initials: 'PO', station: 'Oven Station B',          certPct: 91, certLabel: '91% to L3 Sauce Dosing', certColor: 'bg-ok',   certText: 'text-ok'   },
 { name: 'F. Adeyemi', role: 'L1 · QA · 8 months',          initials: 'FA', station: 'QA Check Station',        certPct: 40, certLabel: '40% to L2 QA Inspector',  certColor: 'bg-muted',certText: 'text-muted' },
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

// ── Station briefing data — carry-forward from prior shift ─────────────────────

const STATION_BRIEFING = {
 'C. Reyes': {
  carryForward: [
   { type: 'danger', label: 'Allergen changeover log', note: 'Unsigned at shift handoff. Must sign before GF-Flatbread run can start — production is blocked until cleared.' },
   { type: 'ok',     label: 'CCP-1 Hold Point',        note: 'Last verified 06:18 at 188°F by Kowalski — within limit. Log next reading before 07:30.' },
  ],
  troubleshooting: {
   trigger: 'cert-mismatch',
   title: 'Covering above cert level — Sauce Dosing',
   hint: 'For any process parameter you are unsure of, ask your supervisor before adjusting. Do not modify CCP settings without L2 sign-off.',
   precedent: 'Same coverage gap occurred Apr 2 — Kowalski supervised CCP-1 directly. Contact Kowalski immediately if anything is unclear.',
  },
 },
 'P. Okonkwo': {
  carryForward: [
   { type: 'warn', label: 'Sensor A-7 micro-variance', note: 'Count 4 of 5 at last reading. Do not rely on SCADA — log oven readings manually until sensor is cleared.' },
   { type: 'warn', label: 'Oven B SCADA stale',        note: 'No reading for 2h 14m. Log temperature manually every 30 minutes until feed restores.' },
  ],
  troubleshooting: {
   trigger: 'sensor-variance',
   title: 'Oven B manual monitoring protocol',
   hint: 'When sensor shows micro-variance: reduce batch input rate by 20% until readings stabilize, or contact Kowalski if count reaches 5 of 5.',
   precedent: 'Apr 2 — same micro-variance signature 3 shifts prior led to bearing inspection. Caught before failure. Kowalski handled escalation.',
  },
 },
 'F. Adeyemi': {
  carryForward: [
   { type: 'ok', label: 'QA checks current', note: 'All pre-shift QA checks signed by Kowalski. Standard inspection protocol in effect.' },
  ],
  troubleshooting: null,
 },
}

const CERT_NEXT_STEPS = {
 'C. Reyes':   ['Complete 3 more supervised shifts at Sauce Dosing', 'Pass L2 Sauce Dosing practical assessment', 'Assessment window: May 22–30'],
 'P. Okonkwo': ['Complete 2 senior operator observations (2 remaining)', 'Submit L3 application via training coordinator', 'Assessment window: Jun 3–10'],
 'F. Adeyemi': ['Complete 5 more QA inspector shifts', 'Attend allergen changeover training (1 session remaining)', 'Assessment window: Jul 8–15'],
}

// ── Directive Card — supervisor-pushed messages, highest priority surface ──────

function DirectiveCard({ directive, onAcknowledge }) {
 const [exiting, setExiting] = useState(false)
 const isWarn = directive.urgency === 'warn'
 const isDanger = directive.urgency === 'danger'
 const accentClass = isDanger ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn bg-warn/[0.03]'
 const accentText  = isDanger ? 'text-danger' : 'text-warn'
 const dotClass    = isDanger ? 'bg-danger beat' : 'bg-warn'

 const handleAck = () => {
  setExiting(true)
  setTimeout(() => onAcknowledge(directive.id), 280)
 }

 return (
  <div className={`flex-shrink-0 border-b-2 border-l-[3px] transition-opacity ${accentClass} ${exiting ? 'opacity-0 transition-opacity duration-300' : ''}`}
    style={{ borderBottomColor: isDanger ? 'var(--color-danger)' : 'var(--color-warn)' }}>
   <div className="flex items-start gap-3 px-5 py-4">
    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${dotClass}`} />
    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 mb-1">
      <MessageSquare size={10} strokeWidth={2} className={accentText} aria-hidden="true" />
      <span className={`font-body text-label font-medium ${accentText}`}>From {directive.from}</span>
      <span className="font-body text-muted text-label">· {directive.role} · sent {directive.sentAt}</span>
     </div>
     <p className="font-display text-ink text-base leading-snug font-medium">{directive.message}</p>
     {directive.deadline && (
      <div className={`font-body text-label mt-1 ${accentText}`}>Prepare by {directive.deadline}</div>
     )}
    </div>
    <button type="button" onClick={handleAck}
     className="flex items-center gap-1.5 font-body text-label text-muted hover:text-ink transition-colors flex-shrink-0 px-2 py-1 border border-rule2 hover:border-muted"
     aria-label="Acknowledge directive">
     <Check size={10} strokeWidth={2.5} />
     <span>Got it</span>
    </button>
   </div>
  </div>
 )
}

// ── Station Briefing — what's different since your last shift ─────────────────

function StationBriefing({ operator }) {
 const briefing = STATION_BRIEFING[operator]
 if (!briefing) return null
 return (
  <div className="border-b border-rule2">
   <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center gap-1.5">
    <span className="font-body text-muted text-label">Since your last shift</span>
   </div>
   {briefing.carryForward.map((item, i) => {
    const dotClass = item.type === 'danger' ? 'bg-danger' : item.type === 'warn' ? 'bg-warn' : 'bg-ok'
    const noteClass = item.type === 'danger' ? 'text-danger' : item.type === 'warn' ? 'text-warn' : 'text-muted'
    return (
     <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-b-0">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dotClass}`} />
      <div className="flex-1 min-w-0">
       <div className="font-body font-medium text-ink text-body leading-snug">{item.label}</div>
       <p className="font-display text-muted text-body leading-relaxed mt-0.5">{item.note}</p>
      </div>
     </div>
    )
   })}
  </div>
 )
}

// ── Contextual Troubleshooting — surface knowledge when anomaly is active ──────

function TroubleshootingHint({ operator }) {
 const briefing = STATION_BRIEFING[operator]
 const [expanded, setExpanded] = useState(true)
 if (!briefing?.troubleshooting) return null
 const { title, hint, precedent } = briefing.troubleshooting
 return (
  <div className="border-b border-rule2 border-l-2 border-l-signal bg-signal/[0.02]">
   <button type="button" onClick={() => setExpanded(e => !e)}
    className="w-full flex items-center justify-between px-5 py-3 text-left">
    <div className="flex items-center gap-2">
     <BookOpen size={11} strokeWidth={2} className="text-signal flex-shrink-0" />
     <span className="font-body font-medium text-ink text-body">{title}</span>
    </div>
    {expanded ? <ChevronUp size={11} className="text-muted flex-shrink-0" /> : <ChevronDown size={11} className="text-muted flex-shrink-0" />}
   </button>
   {expanded && (
    <div className="px-5 pb-4 slide-in">
     <p className="font-display text-ink text-body leading-relaxed mb-3">{hint}</p>
     <div className="flex items-start gap-2 bg-stone2 px-3 py-2.5">
      <span className="font-body text-muted text-label flex-shrink-0 mt-px">Previous case:</span>
      <p className="font-display text-muted text-body leading-relaxed">{precedent}</p>
     </div>
    </div>
   )}
  </div>
 )
}

// ── My Progress — cert level + what's next ────────────────────────────────────

function MyProgress({ operator, op }) {
 if (!op) return null
 const steps = CERT_NEXT_STEPS[operator] || []
 const certC = op.certPct >= 80 ? 'var(--color-ok)' : op.certPct >= 50 ? 'var(--color-warn)' : 'var(--color-muted)'
 return (
  <div className="border-t border-rule2">
   <div className="px-5 py-2 bg-stone2 border-b border-rule2">
    <span className="font-body text-muted text-label">My progress</span>
   </div>
   <div className="px-5 py-4 border-b border-rule2">
    <div className="flex items-end justify-between mb-2">
     <div className="font-body text-muted text-label">{op.certLabel}</div>
     <span className="display-num text-title leading-none" style={{ color: certC }}>{op.certPct}%</span>
    </div>
    <div className="h-1.5 bg-rule2 mb-1">
     <div className="h-full transition-all duration-500" style={{ width: `${op.certPct}%`, background: certC }} />
    </div>
   </div>
   {steps.length > 0 && (() => {
    const milestones = steps.filter(s => s.startsWith('Assessment window'))
    const tasks = steps.filter(s => !s.startsWith('Assessment window'))
    return (
     <div className="px-5 py-3">
      <div className="font-body text-muted text-label mb-2.5">What's next</div>
      <div className="space-y-2 mb-3">
       {tasks.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
         <div className="w-4 h-4 rounded-full border-2 border-rule2 flex-shrink-0 mt-0.5 flex items-center justify-center">
          <span className="font-body text-muted text-micro leading-none">{i + 1}</span>
         </div>
         <span className="font-body text-ink text-label leading-snug">{step}</span>
        </div>
       ))}
      </div>
      {milestones.map((m, i) => (
       <div key={i} className="flex items-center gap-2 border border-signal/30 bg-signal/[0.04] px-3 py-2">
        <Flag size={10} className="text-signal flex-shrink-0" />
        <span className="font-body text-signal text-label font-medium">{m}</span>
       </div>
      ))}
     </div>
    )
   })()}
  </div>
 )
}

// ── Knowledge Capture — post-action contribution prompt ───────────────────────

function KnowledgeCapturePrompt({ source, operator, onDismiss, onSubmit }) {
 const [body, setBody] = useState('')
 const [submitted, setSubmitted] = useState(false)
 if (submitted) return (
  <div className="mx-5 mb-4 px-4 py-3 bg-ok/[0.04] border-l-2 border-l-ok slide-in">
   <div className="flex items-center gap-1.5">
    <CheckCircle2 size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
    <span className="font-body text-ok text-label">Submitted for supervisor review — thank you.</span>
   </div>
  </div>
 )
 return (
  <div className="mx-5 mb-4 border border-rule2 bg-stone2 slide-in">
   <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule2">
    <div className="flex items-center gap-1.5">
     <BookOpen size={10} strokeWidth={2} className="text-signal flex-shrink-0" />
     <span className="font-body font-medium text-ink text-label">Add to knowledge vault?</span>
    </div>
    <button type="button" onClick={onDismiss} className="font-body text-muted text-label hover:text-ink transition-colors px-1">Skip</button>
   </div>
   <div className="px-4 py-3">
    <div className="font-body text-muted text-label mb-1.5">What you learned or did differently</div>
    <p className="font-display text-muted text-body mb-2 leading-relaxed">Based on: {source}</p>
    <textarea
     rows={3}
     value={body}
     onChange={e => setBody(e.target.value)}
     placeholder="Describe what happened and what worked…"
     className="w-full font-display text-ink text-body bg-stone border border-rule2 px-3 py-2 placeholder:text-muted/60 focus:border-signal focus:outline-none resize-none leading-relaxed"
    />
    <div className="flex items-center justify-between mt-2">
     <span className="font-body text-muted text-label">Submitted by {operator} · pending supervisor review</span>
     <Btn variant="primary" onClick={() => { if (body.trim()) { onSubmit(body); setSubmitted(true) } }}>
      <Send size={10} strokeWidth={2} className="mr-1" />Submit
     </Btn>
    </div>
   </div>
  </div>
 )
}

// ── Data commitment modal ─────────────────────────────────────────────────────

function DataCommitmentOverlay({ onAcknowledge }) {
 return (
  <Modal title="What we track">
   <div className="overflow-y-auto flex-1 px-5 py-5">
    <div className="flex items-start gap-3 mb-4">
     <ShieldCheck size={20} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
     <div>
      <div className="font-display font-bold text-ink text-base leading-snug mb-1">What we track</div>
      <p className="font-body text-ink2 text-body leading-relaxed">Takorin tracks production signals to help you work safely. Here's what your supervisor can see, and what they can't.</p>
     </div>
    </div>
    <div className="space-y-2 mb-5">
     {[
      { icon: Check,       label: 'Your supervisor can see',      items: ['Your task completion status', 'Shift checklist items you signed or flagged', 'Near-miss reports you submitted', 'Your hours worked this week and consecutive shifts', 'Your fatigue status — used for scheduling, not evaluation'] },
      { icon: Lock,        label: 'Not visible to your supervisor', items: ['The reason you dismissed a specific finding', 'Your certification progress score'] },
      { icon: ShieldCheck, label: 'How your data is used',    items: ['Fatigue and hours data is for scheduling only — it has no effect on your performance review', 'You can see your own data in your dashboard at any time', 'Production patterns used to improve the model. Your name is not attached.'] },
     ].map(({ icon: Icon, label, items }) => (
      <div key={label} className="px-3 py-2.5 bg-stone2">
       <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
        <span className="font-body font-medium text-ink text-label">{label}</span>
       </div>
       <ul className="space-y-0.5">
        {items.map(item => (
         <li key={item} className="font-body text-ink2 text-label flex items-start gap-1.5">
          <span className="text-muted mt-px">·</span>{item}
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
     <div className="font-body text-ok text-label font-medium">Standard Operation</div>
    </div>
    <div className="font-display font-bold text-ink text-head leading-none mb-1">{ctx?.station} · {ctx?.condition}</div>
    <div className="font-body text-muted text-label">{ctx?.conditionDetail}</div>
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
    <div className={`font-body text-label font-medium ${textClass}`}>{ctx.modeLabel}</div>
   </div>
   <div className="font-display font-bold text-ink text-head leading-none mb-1">
    {ctx.station} · {ctx.condition}
   </div>
   <div className="font-body text-muted text-label">{ctx.conditionDetail}</div>
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
 const badgeClass  = isDanger ? 'bg-danger/[0.08] text-danger' : 'bg-warn/[0.08] text-warn'
 return (
  <div className={`flex-shrink-0 px-5 py-3.5 border-b border-rule2 border-l-2 ${borderClass}`}>
   <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-2.5 flex-1 min-w-0">
     <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dotClass}`} />
     <div>
      <div className="font-body font-medium text-ink text-base leading-snug">{ctx.directive}</div>
      {ctx.guidanceLevel === 'high' && (
       <div className="font-body text-muted text-label mt-0.5">Ask your supervisor if unsure about any step</div>
      )}
     </div>
    </div>
    <span className={`font-body text-label px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap ${badgeClass}`}>Before {ctx.directiveDeadline}</span>
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
    <span className="font-body font-medium text-warn text-body">{ctx.ccp.label}</span>
    <span className="font-body text-warn/80 text-label"> · {ctx.ccp.requirement}</span>
   </div>

   {/* Mismatch notice */}
   {ctx.mismatch && (
    <div className="px-5 py-3 bg-danger/[0.03] border-b border-danger/15 flex items-start gap-2.5">
     <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0 mt-px" />
     <div>
      <div className="font-body font-medium text-danger text-label">Coverage mismatch detected</div>
      <div className="font-body text-danger/70 text-label">{ctx.mismatchNote}</div>
     </div>
    </div>
   )}

   {/* Steps header */}
   <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between">
    <span className="font-body text-muted text-label">Verification sequence</span>
    <span className="font-body text-muted text-label">{completedCount} of {steps.length}</span>
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
       {done && <Check size={11} strokeWidth={2.5} className="text-stone" />}
      </button>
      <div className="flex-1">
       <div className={`font-body text-body leading-snug ${done ? 'text-muted line-through' : 'text-ink font-medium'}`}>
        {i + 1}. {step.label}
       </div>
       {ctx.guidanceLevel === 'high' && enabled && i === 0 && (
        <div className="font-body text-muted text-label mt-1">Confirm each step carefully — you are covering above cert level</div>
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
      <span className="font-body font-medium text-ok text-base">Verification complete</span>
     </div>
     <div className="font-body text-ok/80 text-label mb-3">All steps verified · Await supervisor sign-off before restarting the line</div>
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
    <div className="font-body text-muted text-label mb-2">{ctx.ccp.label} · {ctx.ccp.requirement}</div>
    <div className="flex items-baseline gap-3 mb-1">
     <span className={`display-num text-score font-bold leading-none ${
      lastValue == null ? 'text-muted' : ccpMet ? 'text-ok' : 'text-danger'
     }`}>
      {lastValue != null ? <AnimatedScore value={lastValue} suffix="°F" effect="glow" /> : '—'}
     </span>
     {lastValue != null && (
      <span className={`font-body text-label px-1.5 py-0.5 ${ccpMet ? 'bg-ok/10 text-ok' : 'bg-danger/[0.08] text-danger'}`}>
       {ccpMet ? 'Compliant' : 'Below limit'}
      </span>
     )}
    </div>
    {lastEntry && (
     <div className="font-body text-muted text-label">Last logged: {lastEntry.time}</div>
    )}
   </div>

   {/* Log button / input */}
   <div className="px-5 py-4 border-b border-rule2">
    {!logging ? (
     <>
      <Btn variant="primary" onClick={() => setLogging(true)} className="w-full">
       Log temperature reading
      </Btn>
      <div className="font-body text-muted text-label mt-2 text-center">
       Next reading due: {ctx.directiveDeadline}
      </div>
     </>
    ) : (
     <>
      <div className="font-body text-muted text-label mb-2">{ctx.ccp.label} — enter °F reading</div>
      <div className="flex gap-2 mb-2">
       <input
        type="number"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        placeholder="185"
        autoFocus
        className="flex-1 font-body text-ink text-body bg-stone2 border border-rule2 px-3 py-2 placeholder:text-muted/60 focus:border-signal focus:outline-none"
       />
       <Btn variant="primary" onClick={() => {
        if (inputVal) { onLog(Number(inputVal)); setLogging(false); setInputVal('') }
       }}>Log</Btn>
       <Btn variant="secondary" onClick={() => { setLogging(false); setInputVal('') }}>Cancel</Btn>
      </div>
      {belowLimit && (
       <div className="font-body text-danger text-label flex items-center gap-1.5">
        <AlertTriangle size={11} strokeWidth={2} className="flex-shrink-0" />
        Below {minTemp}°F minimum — log and notify supervisor immediately
       </div>
      )}
     </>
    )}
   </div>

   {/* Reading history */}
   <div className="px-5 py-4 border-b border-rule2">
    <div className="font-body text-muted text-label mb-3">Reading history</div>
    <div className="space-y-px">
     {[...allEntries].reverse().map((r, i) => (
      <div key={i} className="flex items-center gap-3 py-2 border-b border-rule2 last:border-b-0">
       <span className="font-body text-muted text-label w-10 flex-shrink-0">{r.time}</span>
       <span className={`display-num text-base font-bold ${r.value >= minTemp ? 'text-ok' : 'text-danger'}`}>{r.value}°F</span>
       <div className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.value >= minTemp ? 'bg-ok' : 'bg-danger'}`} />
      </div>
     ))}
    </div>
   </div>

   {/* Floor observation log */}
   <ObservationLogger />
  </div>
 )
}

// ── Observation Logger — quick-capture floor observations ──────────────────────
function ObservationLogger() {
 const { logObservation, fieldObservations } = useAppState()
 const [open, setOpen] = useState(false)
 const [station, setStation] = useState(OBSERVATION_STATIONS[0])
 const [category, setCategory] = useState('workflow')
 const [note, setNote] = useState('')
 const [justLogged, setJustLogged] = useState(false)

 const shiftObs = fieldObservations.filter(o => o.shiftId === 'am-0522')

 function handleSubmit() {
  if (!note.trim()) return
  logObservation({ station, category, note: note.trim(), operator: 'C. Reyes' })
  setNote('')
  setOpen(false)
  setJustLogged(true)
  setTimeout(() => setJustLogged(false), 2500)
 }

 return (
  <div className="px-5 py-4">
   <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
     <Eye size={10} strokeWidth={2} className="text-muted" />
     <span className="font-body text-muted text-label">Floor observations · {shiftObs.length} this shift</span>
    </div>
    {!open && <Btn variant="ghost" onClick={() => setOpen(true)}>+ Note</Btn>}
   </div>

   {open && (
    <div className="bg-stone2 border border-rule2 p-3 mb-3 space-y-3">
     {/* Category chips */}
     <div className="flex flex-wrap gap-1.5">
      {OBSERVATION_CATEGORIES.map(cat => (
       <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
        className={`font-body text-label px-2 py-1 border transition-colors ${category === cat.id ? `${cat.bgCls} ${cat.textCls} border-transparent` : 'border-rule2 text-muted hover:text-ink'}`}>
        {cat.label}
       </button>
      ))}
     </div>
     {/* Station */}
     <select value={station} onChange={e => setStation(e.target.value)}
      className="w-full font-body text-label text-ink bg-stone border border-rule2 px-2 py-1.5 focus:border-signal focus:outline-none appearance-none">
      {OBSERVATION_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
     </select>
     {/* Note */}
     <textarea value={note} onChange={e => setNote(e.target.value)}
      rows={3} placeholder="What did you see?"
      autoFocus
      className="w-full font-body text-label text-ink bg-stone border border-rule2 px-3 py-2 resize-none placeholder:text-muted/60 focus:border-signal focus:outline-none" />
     <div className="flex gap-2">
      <Btn variant="primary" onClick={handleSubmit} disabled={!note.trim()}>Log observation</Btn>
      <Btn variant="secondary" onClick={() => { setOpen(false); setNote('') }}>Cancel</Btn>
     </div>
    </div>
   )}

   {justLogged && (
    <div className="flex items-center gap-2 py-2 mb-2">
     <Check size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
     <span className="font-body text-ok text-label">Observation logged</span>
    </div>
   )}

   {shiftObs.slice(0, 3).map(obs => {
    const cat = OBSERVATION_CATEGORIES.find(c => c.id === obs.category)
    return (
     <div key={obs.id} className="py-2.5 border-b border-rule2 last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
       {cat && <span className={`font-body text-micro px-1.5 py-0.5 ${cat.bgCls} ${cat.textCls}`}>{cat.label}</span>}
       <span className="font-body text-micro text-muted">{obs.timeLabel} · {obs.station}</span>
      </div>
      <p className="font-body text-label text-muted leading-snug m-0">{obs.note}</p>
     </div>
    )
   })}
  </div>
 )
}

// ── Task Section — always below dominant surface ───────────────────────────────

function TaskSection({ selected, station, tasks, linkedTasks, flags, nearMisses, onLinkedTaskConfirm }) {
 const allTasks = [...tasks, ...linkedTasks]
 const pendingCount = allTasks.filter(t => !t.done).length
 return (
  <>
   <SectionHeader label="Today's tasks" title={`${station || selected.split(' ')[1] || selected} · April 16`}
    badge={allTasks.length > 0 ? <StatusPill tone={pendingCount > 0 ? 'warn' : 'ok'}>{pendingCount} pending</StatusPill> : null} />
   {allTasks.length === 0 ? (
    <div className="px-5 py-4 font-body text-muted text-body">No tasks yet — tasks assigned by your supervisor appear here.</div>
   ) : allTasks.map((t, i) => (
    <div key={t.id ?? i} className={`flex items-start gap-3 px-5 py-3.5 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-60' : ''}`}>
     <button type="button"
      disabled={t.done || !t.interventionId}
      onClick={() => t.interventionId && !t.done && onLinkedTaskConfirm(t)}
      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
       t.done ? 'bg-ok cursor-default' : t.interventionId ? 'border-2 border-signal hover:bg-signal/10 cursor-pointer' : 'border-2 border-rule2 cursor-default'
      }`}>
      {t.done && <Check size={11} strokeWidth={2.5} className="text-stone" />}
     </button>
     <div className="flex-1 min-w-0">
      <div className={`font-body font-medium text-body leading-snug ${t.done ? 'line-through text-muted' : 'text-ink'}`}>{t.label}</div>
      <div className="flex items-center gap-2 mt-0.5">
       {t.dueTime && <span className="font-body text-muted text-label">Due {t.dueTime}</span>}
       {t.interventionId && (
        <span className="flex items-center gap-0.5 font-body text-label text-signal">
         <Brain size={10} strokeWidth={2} />{t.interventionLabel}
        </span>
       )}
       {t.done && t.confirmedAt && (
        <span className="font-body text-ok text-label">Confirmed {t.confirmedAt}</span>
       )}
      </div>
     </div>
    </div>
   ))}
   <div className="px-5 py-3 border-t border-rule2 font-body text-muted text-label">
    Can't complete a safety check? Use the Flag button and give a reason — your supervisor will be notified.
   </div>

   {flags.length > 0 && (
    <div className="border-t border-rule2">
     <SectionHeader label="Flagged items" title="Items you could not complete" badge={<StatusPill tone="warn">{flags.length} flagged</StatusPill>} />
     {flags.map((f, i) => (
      <div key={i} className="flex items-start gap-2.5 px-5 py-3.5 border-b border-rule2 last:border-b-0 bg-warn/[0.02]">
       <Flag size={12} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
       <div>
        <div className="font-body font-medium text-ink text-body">{f.key}</div>
        <div className="font-body text-warn text-label">{f.reason}</div>
       </div>
      </div>
     ))}
    </div>
   )}

   {nearMisses.length > 0 && (
    <div className="border-t border-rule2">
     <SectionHeader label="Near-miss reports" title="Submitted this shift" badge={<StatusPill tone="ok">{nearMisses.length} logged</StatusPill>} />
     {nearMisses.map((n, i) => (
      <div key={i} className="px-5 py-3.5 border-b border-rule2 last:border-b-0">
       <div className="font-body font-medium text-ink text-body">{n.station}</div>
       <div className="font-body text-ink2 text-label mt-0.5">{n.what}</div>
       {n.action && <div className="font-body text-ok text-label mt-0.5">Corrective step: {n.action}</div>}
      </div>
     ))}
    </div>
   )}
  </>
 )
}

// ── Transition Readiness data + component ────────────────────────────────────

const TRANSITION_DATA = {
 'C. Reyes': {
  hybridCertified: false, robotSafetyZone: false,
  certGap: 'L2 Sauce Dosing (28% to next level)',
  fatigueRisk: 'moderate', onAutomatingLine: true,
  safetyNote: 'Safety zone protocol unsigned — required before robot deployment on Line 4',
  readiness: 24, readinessLabel: 'Not ready',
  trend: null, trendNote: 'Stalled for 2 weeks',
 },
 'P. Okonkwo': {
  hybridCertified: true, robotSafetyZone: true,
  certGap: null,
  fatigueRisk: 'low', onAutomatingLine: true,
  safetyNote: null,
  readiness: 78, readinessLabel: 'Ready',
  trend: +14, trendNote: '↑ +14pp this week',
 },
 'F. Adeyemi': {
  hybridCertified: false, robotSafetyZone: false,
  certGap: 'L2 QA Inspector (40% to next level)',
  fatigueRisk: 'low', onAutomatingLine: false,
  safetyNote: 'Not on automating line — safety zone training scheduled Jul 2026',
  readiness: 38, readinessLabel: 'In progress',
  trend: +6, trendNote: '↑ +6pp this week',
 },
}

function TransitionTab({ selected, isDirector }) {
 const t = TRANSITION_DATA[selected] || {}
 const readinessTone = t.readiness >= 70 ? 'text-ok' : t.readiness >= 40 ? 'text-warn' : 'text-danger'
 const readinessBorder = t.readiness >= 70 ? 'border-l-ok' : t.readiness >= 40 ? 'border-l-warn' : 'border-l-danger'

 if (isDirector) {
  const all = OPERATORS.map(o => ({ ...o, t: TRANSITION_DATA[o.name] || {} }))
  const readyCount  = all.filter(o => (o.t.readiness || 0) >= 70).length
  const safetyCount = all.filter(o => o.t.robotSafetyZone).length
  const autoCount   = all.filter(o => o.t.onAutomatingLine).length
  return (
   <div>
    <div className="flex border-b border-rule2">
     {[
      { label: 'Robot-ready',         value: `${readyCount} of ${all.length}`,  tone: readyCount === all.length  ? 'text-ok' : 'text-warn', trend: '↑ from 0 last week' },
      { label: 'Safety zone signed', value: `${safetyCount} of ${all.length}`, tone: safetyCount === all.length ? 'text-ok' : 'text-warn', trend: null },
      { label: 'On automating lines', value: `${autoCount} of ${all.length}`,  tone: 'text-ink', trend: null },
     ].map((cell, i) => (
      <div key={i} className="flex-1 px-5 py-4 border-r border-rule2 last:border-r-0">
       <div className="font-body text-muted text-label mb-1">{cell.label}</div>
       <div className={`display-num text-metric font-bold leading-none ${cell.tone}`}>{cell.value}</div>
       {cell.trend && <div className="font-body text-ok text-micro mt-0.5">{cell.trend}</div>}
      </div>
     ))}
    </div>
    {all.map(o => {
     const ot  = o.t
     const rt  = ot.readiness >= 70 ? 'text-ok' : ot.readiness >= 40 ? 'text-warn' : 'text-danger'
     const bl  = ot.readiness >= 70 ? 'border-l-ok' : ot.readiness >= 40 ? 'border-l-warn' : 'border-l-danger'
     const isSel = o.name === selected
     return (
      <div key={o.name} className={`border-b border-rule2 border-l-[3px] ${bl} px-5 py-4 ${isSel ? 'bg-stone2' : ''}`}>
       <div className="flex items-start justify-between mb-2">
        <div>
         <span className="font-body font-medium text-ink text-body">{o.name}</span>
         <span className="font-body text-muted text-label ml-2">{o.role}</span>
         {isSel && <span className="font-body text-signal text-label ml-2">· selected</span>}
        </div>
        <div className="text-right">
         <div className={`display-num text-head font-bold leading-none tabular-nums ${rt}`}>{ot.readiness}%</div>
         <div className={`font-body text-label mt-0.5 ${rt}`}>{ot.readinessLabel}</div>
         {ot.trendNote && (
          <div className={`font-body text-micro mt-0.5 ${ot.trend > 0 ? 'text-ok' : 'text-muted'}`}>{ot.trendNote}</div>
         )}
        </div>
       </div>
       <div className="flex items-center gap-2 flex-wrap mb-2">
        {[
         { ok: ot.hybridCertified,   label: ot.hybridCertified   ? 'Robot cert ✓' : 'Robot cert ✗'   },
         { ok: ot.robotSafetyZone,   label: ot.robotSafetyZone   ? 'Safety zone ✓' : 'Safety zone ✗'   },
        ].map(chip => (
         <span key={chip.label} className={`font-body text-label px-2 py-0.5 leading-tight ${chip.ok ? 'bg-ok/[0.08] text-ok' : 'bg-warn/[0.06] text-warn'}`}>
          {chip.label}
         </span>
        ))}
        {ot.onAutomatingLine && (
         <span className="font-body text-label px-2 py-0.5 leading-tight bg-signal/[0.08] text-signal">On automating line</span>
        )}
       </div>
       {ot.certGap && <div className="font-body text-warn text-label">→ {ot.certGap}</div>}
       {ot.safetyNote && !ot.robotSafetyZone && <div className="font-body text-muted text-label mt-0.5">→ {ot.safetyNote}</div>}
       {!ot.hybridCertified && (
        <button type="button" className="mt-2 font-body text-label text-muted px-2 py-0.5 border border-rule2 hover:text-ink hover:border-ink/20 transition-colors">
         Schedule training →
        </button>
       )}
      </div>
     )
    })}
   </div>
  )
 }

 // Individual operator view
 return (
  <div className="px-5 py-5">
   <div className="mb-5">
    <div className="font-body text-muted text-label mb-2">Automation transition readiness</div>
    <div className={`display-num text-score font-bold leading-none tabular-nums mb-1 ${readinessTone}`}>{t.readiness}%</div>
    <div className={`font-body text-label ${readinessTone}`}>{t.readinessLabel}</div>
   </div>
   <div className={`border-l-[3px] ${readinessBorder} pl-4 space-y-3`}>
    {[
     { label: 'Robot readiness cert', value: t.hybridCertified ? 'Complete' : 'Not yet — ' + (t.certGap || 'in progress'), ok: t.hybridCertified },
     { label: 'Safety zone protocol', value: t.robotSafetyZone ? 'Signed' : 'Not signed', ok: t.robotSafetyZone },
     { label: 'Line status', value: t.onAutomatingLine ? 'On automating line' : 'Not on automating line yet', ok: !t.onAutomatingLine },
    ].map(row => (
     <div key={row.label} className="flex items-center justify-between">
      <span className="font-body text-ink text-body">{row.label}</span>
      <span className={`font-body font-medium text-body ${row.ok ? 'text-ok' : 'text-warn'}`}>{row.value}</span>
     </div>
    ))}
    {t.safetyNote && !t.robotSafetyZone && (
     <div className="font-body text-muted text-label leading-snug pt-1">→ {t.safetyNote}</div>
    )}
   </div>
  </div>
 )
}

// ── Compliance hold directive — injected for operators on affected lines ───────

const HOLD_DIRECTIVE = {
 id: 'hold-ts-8811',
 urgency: 'danger',
 from: 'J. Crocker',
 role: 'Plant Director → D. Kowalski',
 sentAt: '06:22',
 message: 'Do not use Tomato Sauce Lot TS-8811 — FSMA 204 compliance hold. Lot quarantined in Cold Storage B. COA not received from ConAgra. Line 4 production start blocked.',
 deadline: '08:00 · Hold remains until COA received',
}

// ── Startup checklist — station-specific, interactive ─────────────────────────

const STARTUP_CHECKLIST = {
 'C. Reyes': [
  { id: 'cl-cr-1', label: 'Allergen changeover log signed',                   preset: true,  note: 'Signed · 05:45' },
  { id: 'cl-cr-2', label: 'CCP-1 Hold Point temperature verified',             preset: true,  note: 'Verified · 06:18 · 188°F · Kowalski' },
  { id: 'cl-cr-3', label: 'Confirm Lot TS-8811 not present at Sauce Dosing',  urgent: true,  note: 'Compliance hold — do not use' },
  { id: 'cl-cr-4', label: 'Sauce Dosing valve positions checked' },
  { id: 'cl-cr-5', label: 'PPE inspection — gloves, hairnet, apron' },
  { id: 'cl-cr-6', label: 'Log CCP-1 reading before 07:30',                   urgent: true },
 ],
 'P. Okonkwo': [
  { id: 'cl-po-1', label: 'Oven B manual monitoring protocol acknowledged',     preset: true, note: 'Acknowledged · 06:05' },
  { id: 'cl-po-2', label: 'Sensor A-7 variance count noted (4 of 5)',           preset: true, note: 'Noted · 06:10' },
  { id: 'cl-po-3', label: 'Log first oven temperature reading manually',         urgent: true },
  { id: 'cl-po-4', label: 'PPE inspection — gloves, hairnet, apron' },
  { id: 'cl-po-5', label: 'Line 4 topping distribution check' },
 ],
 'F. Adeyemi': [
  { id: 'cl-fa-1', label: 'QA pre-shift checks signed by supervisor', preset: true, note: 'Kowalski · 05:55' },
  { id: 'cl-fa-2', label: 'QA station calibration check' },
  { id: 'cl-fa-3', label: 'PPE inspection complete' },
 ],
}

function StartupChecklist({ selected, completions, onComplete }) {
 const items = STARTUP_CHECKLIST[selected] || []
 const doneCount = items.filter(i => i.preset || completions.includes(i.id)).length
 const allDone = doneCount === items.length

 return (
  <div className="border-b border-rule2">
   <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between">
    <div className="flex items-center gap-1.5">
     <ListChecks size={11} strokeWidth={2} className="text-muted" />
     <span className="font-body text-muted text-label">Startup checklist</span>
    </div>
    <div className="flex items-center gap-1.5">
     <span className={`font-body text-label tabular-nums ${allDone ? 'text-ok' : 'text-warn'}`}>
      {doneCount}/{items.length}
     </span>
     {allDone && <CheckCircle2 size={10} strokeWidth={2} className="text-ok" />}
    </div>
   </div>
   {items.map(item => {
    const isDone = item.preset || completions.includes(item.id)
    return (
     <div key={item.id}
      className={`flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-b-0 ${
       isDone ? 'opacity-60' : item.urgent ? 'bg-danger/[0.02]' : ''
      }`}>
      <button type="button"
       disabled={isDone}
       onClick={() => !isDone && onComplete(item.id)}
       className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        isDone
         ? 'bg-ok border-ok cursor-default'
         : item.urgent
         ? 'border-danger hover:bg-danger/10 cursor-pointer'
         : 'border-rule2 hover:border-signal cursor-pointer'
       }`}>
       {isDone && <Check size={11} strokeWidth={2.5} className="text-stone" />}
      </button>
      <div className="flex-1 min-w-0">
       <div className={`font-body text-body leading-snug ${isDone ? 'line-through text-muted' : item.urgent ? 'text-ink font-medium' : 'text-ink'}`}>
        {item.label}
       </div>
       {isDone && item.note && (
        <div className="font-body text-muted text-label mt-0.5">{item.note}</div>
       )}
       {!isDone && item.urgent && (
        <div className="font-body text-danger text-label mt-0.5">Required before production start</div>
       )}
      </div>
     </div>
    )
   })}
  </div>
 )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OperatorView({ role }) {
 const isOperatorRole = role === 'operator-reyes' || role === 'operator-okonkwo'
 const [directorSelected, setDirectorSelected] = useState('C. Reyes')
 const [supervisorCalled, setSupervisorCalled] = useState(false)
 const [linkedTaskState, setLinkedTaskState] = useState({}) // local overrides for linked task completion
 const selected = isOperatorRole ? (ROLE_TO_OPERATOR[role] ?? 'C. Reyes') : directorSelected
 const [procedureCompletions, setProcedureCompletions] = useState({})
 const [tempLogEntries, setTempLogEntries] = useState({})
 const [acknowledgedDirectives, setAcknowledgedDirectives] = useState(new Set())

 const {
  taskAssignments, flaggedItems, nearMisses,
  operatorAcknowledgments, setOperatorAcknowledgments, logActivity,
 } = useAppState()

 const [opTab, setOpTab] = useState('today')
 const [showCapture, setShowCapture] = useState(false)
 const [captureSource, setCaptureSource] = useState('')
 const [checklistCompletions, setChecklistCompletions] = useState({})
 const handleChecklistComplete = (id) => {
  setChecklistCompletions(prev => ({ ...prev, [selected]: [...(prev[selected] || []), id] }))
 }

 const triggerCapture = (source) => {
  if (showCapture) return  // guard: don't stack prompts
  setCaptureSource(source)
  setShowCapture(true)
 }

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
  triggerCapture('Completed allergen flush verification procedure')
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
     <span className="font-body text-muted text-label">Station simulation</span>
     <span className="font-body text-muted text-label">—</span>
     <span className="font-body text-muted text-label">Viewing {selected}'s station as director. Not a live session.</span>
    </div>
    <div className="flex border-b border-rule2 bg-stone flex-shrink-0">
     {OPERATORS.map(o => (
      <button type="button" key={o.name} aria-pressed={selected === o.name}
       onClick={() => { setDirectorSelected(o.name); setSupervisorCalled(false) }}
       className={`flex items-center gap-2 px-4 py-2.5 border-r border-rule2 border-b-2 transition-colors ${
        selected === o.name ? 'border-b-signal bg-stone2' : 'border-b-transparent hover:bg-stone2/50'
       }`}>
       <PersonAvatar name={o.name} size={20} />
       <div className="text-left">
        <div className="font-body font-medium text-ink text-label">{o.name}</div>
        <div className="font-body text-muted text-label">{o.station}</div>
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
      <div className="font-display font-bold text-ink text-base leading-none">{ctx?.station || op?.station}</div>
      <div className="font-body text-muted text-label mt-0.5">Line 4 · AM shift · {selected}</div>
     </div>
     {trustDegraded && (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-warn/[0.04]">
       <WifiOff size={9} strokeWidth={2} className="text-warn" />
       <span className="font-body text-warn text-label">Some signals stale</span>
      </div>
     )}
    </div>
   )}

   {/* ── Supervisor directives — highest priority push surface ── */}
   {selected === 'C. Reyes' && !acknowledgedDirectives.has(HOLD_DIRECTIVE.id) && (
    <DirectiveCard
     directive={HOLD_DIRECTIVE}
     onAcknowledge={(id) => {
      setAcknowledgedDirectives(prev => new Set([...prev, id]))
      logActivity({ actor: selected, action: 'Compliance hold acknowledged: Lot TS-8811', item: 'Hold', type: 'compliance' })
     }}
    />
   )}
   {(ctx?.directives ?? [])
    .filter(d => !acknowledgedDirectives.has(d.id))
    .map(d => (
     <DirectiveCard key={d.id} directive={d} onAcknowledge={(id) => {
      setAcknowledgedDirectives(prev => new Set([...prev, id]))
      logActivity({ actor: selected, action: `Acknowledged supervisor directive: "${d.message.slice(0, 60)}"`, item: 'Directive', type: 'intervention' })
     }} />
    ))
   }

   {/* ── Operational State Header ─────────────────────────────── */}
   <OperationalStateHeader ctx={ctx} />

   {/* ── Primary Directive ────────────────────────────────────── */}
   <PrimaryDirective ctx={ctx} />

   {/* ── Station Briefing — carry-forward from prior shift ────── */}
   <StationBriefing operator={selected} />

   {/* ── Main content ─────────────────────────────────────────── */}
   <div className="flex-1 overflow-y-auto page-rise">

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

    <Tabs
     tabs={[
      { id: 'today',      label: 'Today',      badge: tasks.filter(t => !t.done).length + linkedTasks.filter(t => !t.done).length },
      { id: 'progress',   label: 'Progress',   badge: 0 },
      { id: 'schedule',   label: 'Schedule',   badge: 0 },
      { id: 'transition', label: 'Transition', badge: 0 },
     ]}
     active={opTab}
     onChange={setOpTab}
     className="flex-shrink-0 bg-stone2 sticky top-0 z-10"
    />

    {/* Today — tasks + troubleshooting */}
    {opTab === 'today' && (
     <>
      <StartupChecklist
       selected={selected}
       completions={checklistCompletions[selected] || []}
       onComplete={handleChecklistComplete}
      />
      <TroubleshootingHint operator={selected} />
      <TaskSection
       selected={selected}
       station={ctx?.station || op?.station}
       tasks={tasks}
       linkedTasks={linkedTasks}
       flags={flags}
       nearMisses={nms}
       onLinkedTaskConfirm={(task) => {
        handleLinkedTaskConfirm(task)
        triggerCapture(`Confirmed intervention: ${task.label}`)
       }}
      />
      {showCapture && (
       <div className="px-5 pt-3 pb-4">
        <KnowledgeCapturePrompt
         source={captureSource}
         operator={selected}
         onDismiss={() => setShowCapture(false)}
         onSubmit={(body) => {
          logActivity({ actor: selected, action: `Knowledge submitted: ${captureSource}`, item: 'Knowledge Vault', type: 'knowledge' })
         }}
        />
       </div>
      )}
     </>
    )}

    {/* Progress — cert level + next steps */}
    {opTab === 'progress' && <MyProgress operator={selected} op={op} />}

    {/* Transition — automation readiness */}
    {opTab === 'transition' && <TransitionTab selected={selected} isDirector={!isOperatorRole} />}

    {/* Schedule — fatigue + hours */}
    {opTab === 'schedule' && (() => {
     const myFatigue = fatigueData.operators.find(o =>
      o.name.includes(selected.split('.')[1]?.trim()) || selected.includes(o.name.split('.')[0])
     )
     if (!myFatigue) return (
      <div className="px-5 py-6 font-body text-muted text-body">No scheduling data available.</div>
     )
     return (
      <div className="px-5 py-4">
       <p className="font-body text-muted text-label mb-3">Shift scheduling only — not your performance review.</p>
       <div className="grid grid-cols-3 gap-2 mb-3">
        {[
         { label: 'Hours this week', value: `${myFatigue.hoursThisWeek}h` },
         { label: 'Consecutive shifts', value: String(myFatigue.consecutiveShifts) },
         { label: 'Last rest', value: myFatigue.lastRestPeriod ? `${myFatigue.lastRestPeriod}h ago` : '—' },
        ].map(({ label, value }) => (
         <div key={label} className="bg-stone2 px-3 py-2">
          <div className="display-num text-head text-ink">{value}</div>
          <div className="font-body text-muted text-label mt-0.5">{label}</div>
         </div>
        ))}
       </div>
       {myFatigue.note && <p className="font-body text-warn text-label">{myFatigue.note}</p>}
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
    className={`fixed bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 min-h-[40px] font-body text-body font-medium transition-colors duration-100 shadow-raise ${
     supervisorCalled ? 'bg-ok text-stone' : 'bg-danger text-stone hover:bg-danger/90'
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
