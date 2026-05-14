import { useState } from 'react'
import { Flag, ShieldCheck, BookOpen, Clock, ChevronRight, Check, Lock } from 'lucide-react'
import { handoffData } from '../data'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, SP, ActionBanner, PersonAvatar, Btn, Chip, HoldButton } from '../components/UI'

const OPERATORS = [
 { name: 'C. Reyes', role: 'L1 · Pack Line · 14 months', initials: 'CR', station: 'Sauce Dosing (covering)', certPct: 72, certLabel: '72% to L2 Sauce Dosing', certColor: 'bg-warn', certText: 'text-warn' },
 { name: 'P. Okonkwo', role: 'L2 · Topping · 22 months', initials: 'PO', station: 'Oven Station B', certPct: 91, certLabel: '91% to L3 Sauce Dosing', certColor: 'bg-ok', certText: 'text-ok' },
 { name: 'F. Adeyemi', role: 'L1 · QA · 8 months', initials: 'FA', station: 'QA Check Station', certPct: 40, certLabel: '40% to L2 QA Inspector', certColor: 'bg-ghost',certText: 'text-muted' },
]

const TRAINING_PATHWAY = {
 'C. Reyes': {
  currentLevel: 'L1 Pack Line',
  nextLevel: 'L2 Sauce Dosing',
  assessmentWindow: 'May 12–16, 2026',
  modules: [
   { label: 'CCP-1 Hold Temperature — Sauce Dosing', status: 'complete', hours: 2 },
   { label: 'Allergen changeover procedure', status: 'complete', hours: 1.5 },
   { label: 'HACCP documentation', status: 'in-progress', hours: 3 },
   { label: 'Supervised dosing shifts × 5', status: 'in-progress', hours: 10 },
   { label: 'L2 Practical assessment', status: 'locked', hours: 1 },
  ],
 },
 'P. Okonkwo': {
  currentLevel: 'L2 Topping',
  nextLevel: 'L3 Sauce Dosing',
  assessmentWindow: 'Jun 2–6, 2026',
  modules: [
   { label: 'Advanced CCP management', status: 'complete', hours: 4 },
   { label: 'Yield optimization — Sauce Dosing', status: 'complete', hours: 3 },
   { label: 'Line lead responsibilities', status: 'in-progress', hours: 6 },
   { label: 'L3 Practical assessment', status: 'locked', hours: 2 },
  ],
 },
 'F. Adeyemi': {
  currentLevel: 'L1 QA',
  nextLevel: 'L2 QA Inspector',
  assessmentWindow: 'Jul 7–11, 2026',
  modules: [
   { label: 'Microbiological testing basics', status: 'complete', hours: 2 },
   { label: 'FSMA 204 documentation', status: 'in-progress', hours: 3 },
   { label: 'Environmental monitoring program', status: 'locked', hours: 4 },
   { label: 'L2 QA assessment', status: 'locked', hours: 1 },
  ],
 },
}

function DataCommitmentBanner({ onAcknowledge }) {
 return (
  <div className="border-b border-rule2 bg-stone2 slide-in">
   <div className="px-5 py-5">
    <div className="flex items-start gap-3 mb-4">
     <ShieldCheck size={20} strokeWidth={1.75} className="text-ok flex-shrink-0 mt-0.5" />
     <div>
      <div className="font-display font-bold text-ink text-[14px] mb-1">Before you start — your data rights</div>
      <p className="font-body text-ink2 text-[12px] leading-relaxed">Takorin monitors production signals to help you do your job safely and to support your career. Here's exactly what that means for your data.</p>
     </div>
    </div>
    <div className="space-y-2 mb-4">
     {[
      { icon: Check, label: 'Your supervisor can see', items: ['Your task completion status', 'Shift checklist items you signed or flagged', 'Near-miss reports you submitted'] },
      { icon: Lock, label: 'Not visible to your supervisor', items: ['The reason you dismissed a specific finding', 'Your certification progress score'] },
      { icon: ShieldCheck, label: 'Takorin\'s model training', items: ['Uses anonymized production patterns only — no names attached to training data'] },
     ].map(({ icon: Icon, label, items }) => (
      <div key={label} className="px-3 py-2.5 bg-stone border border-rule2">
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
    <Btn variant="primary" onClick={onAcknowledge}>I understand — show my dashboard</Btn>
   </div>
  </div>
 )
}

const SAFETY_CONTEXT = {
 'C. Reyes': 'Before starting Sauce Dosing: allergen changeover log must be signed (Pepperoni → GF-Flatbread). CCP-1 hold temp is 60°C minimum.',
 'P. Okonkwo': 'Oven Station B: today\'s SKU (GF-Flatbread) CCP-3 minimum is 185°F. Log any reading below this immediately.',
 'F. Adeyemi': 'Zone 1 environmental swab due today — Sauce Dosing area. Log result before end of shift.',
}

const ROLE_TO_OPERATOR = {
 'operator-reyes': 'C. Reyes',
 'operator-okonkwo': 'P. Okonkwo',
}

export default function OperatorView({ role }) {
 const defaultOp = (role && ROLE_TO_OPERATOR[role]) || 'C. Reyes'
 const [selected, setSelected] = useState(defaultOp)
 const { taskAssignments, trainingPlans, trainingCompletions, flaggedItems, checklistSigned, nearMisses, operatorAcknowledgments, setOperatorAcknowledgments } = useAppState()
 const dataCommitted = !!operatorAcknowledgments?.['dataCommitment']

 const op = OPERATORS.find(o => o.name === selected)
 const myTasks = taskAssignments[selected] || []
 const plan = trainingPlans[selected]
 const completion = trainingCompletions[selected]
 const myFlags = Object.entries(flaggedItems).filter(([, f]) => f).map(([key, f]) => ({ key, ...f }))
 const myNearMisses = nearMisses.filter(n => n.station)

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">
 <ActionBanner
 tone="muted"
 headline={`Operator view — ${selected}`}
 body={`${op?.role} · Line 4 · April 16, 2026`}
 />

 {/* Operator selector */}
 <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0">
 {OPERATORS.map(o => (
 <button key={o.name}
 type="button"
 aria-pressed={selected === o.name}
 onClick={() => setSelected(o.name)}
 className={`flex items-center gap-2.5 px-4 py-2.5 border-r border-rule2 border-b-2 transition-colors ${selected === o.name ? 'border-b-ochre bg-stone' : 'border-b-transparent hover:bg-stone3'}`}>
 <PersonAvatar name={o.name} size={28} />
 <div className="text-left">
 <div className="font-body font-medium text-ink text-[13px]">{o.name}</div>
 <div className="font-body text-ghost text-[11px]">{o.role.split('·')[0].trim()}</div>
 </div>
 </button>
 ))}
 </div>

 {!dataCommitted && (
  <DataCommitmentBanner onAcknowledge={() => setOperatorAcknowledgments(p => ({ ...p, dataCommitment: true }))} />
 )}

 <div className="flex flex-1 min-h-0 overflow-hidden">
 <div className="flex-1 overflow-y-auto">

 {/* Today's tasks */}
 <SecHd tag="Today's tasks" title={`Assigned to ${selected} — April 16`}
 badge={myTasks.length > 0 ? <Urg level={myTasks.some(t => !t.done) ? 'warn' : 'ok'}>{myTasks.filter(t => !t.done).length} pending</Urg> : null} />
 {myTasks.length === 0 ? (
 <div className="px-4 py-4 font-body text-ghost text-[12px]">No tasks yet — tasks assigned by your supervisor in ShiftIQ will appear here.</div>
 ) : myTasks.map((t, i) => (
 <div key={i} className={`flex items-center gap-3 px-4 py-4 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
 <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-ok' : 'border-2 border-rule2'}`}>
 {t.done && <svg className="w-3 h-3 stroke-white" fill="none" strokeWidth={3} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 <div className="flex-1">
 <div className={`font-body font-medium text-[14px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
 {t.dueTime && <div className="font-body text-ghost text-[11px]">Due {t.dueTime}</div>}
 </div>
 </div>
 ))}

 {/* Safety context for today */}
 <div className="border-t border-rule2">
 <SecHd tag="Safety context" title={`${op?.station} — today's requirements`} badge={<Urg level="warn">Review before starting</Urg>} />
 <div className="px-4 py-4 border-b border-rule2 border-l-2 border-l-warn bg-warn/[0.02]">
 <div className="font-body text-ink2 text-[14px] leading-relaxed">
 {SAFETY_CONTEXT[selected]}
 </div>
 </div>
 <div className="px-4 py-3 font-body text-ghost text-[11px]">
 If you cannot complete a safety check, use the Flag button in ShiftIQ checklist — do not leave it unsigned without a reason.
 </div>
 </div>

 {/* Flagged items */}
 {myFlags.length > 0 && (
 <div className="border-t border-rule2">
 <SecHd tag="Flagged items" title="Items you could not complete this shift" badge={<Urg level="warn">{myFlags.length} flagged</Urg>} />
 {myFlags.map((f, i) => (
 <div key={i} className="flex items-start gap-2.5 px-4 py-3.5 border-b border-rule2 last:border-b-0 bg-warn/[0.02]">
 <Flag size={13} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
 <div>
 <div className="font-body font-medium text-ink text-[14px]">{f.key}</div>
 <div className="font-body text-warn text-[11px]">{f.reason}</div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Near-misses this shift */}
 {myNearMisses.length > 0 && (
 <div className="border-t border-rule2">
 <SecHd tag="Near-miss reports" title="Submitted this shift" badge={<Urg level="ok">{myNearMisses.length} logged</Urg>} />
 {myNearMisses.map((n, i) => (
 <div key={i} className="px-4 py-3.5 border-b border-rule2 last:border-b-0">
 <div className="font-body font-medium text-ink text-[14px]">{n.station}</div>
 <div className="font-body text-ink2 text-[12px] mt-0.5">{n.what}</div>
 {n.action && <div className="font-body text-ok text-[11px] mt-0.5">Corrective step: {n.action}</div>}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Right panel: training pathway */}
 {(() => {
  const pathway = TRAINING_PATHWAY[selected]
  if (!pathway) return null
  const done = pathway.modules.filter(m => m.status === 'complete').length
  const total = pathway.modules.length
  return (
  <div className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">
   {/* Header */}
   <div className="px-4 py-4 border-b border-rule2 bg-stone">
    <div className="font-body text-ghost text-[10px] mb-0.5">Your path to</div>
    <div className="font-display font-bold text-ink text-[15px]">{pathway.nextLevel}</div>
    <div className="mt-3">
     <div className="h-2 bg-rule2 mb-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${op?.certColor || 'bg-warn'}`} style={{ width: `${op?.certPct || 0}%` }} />
     </div>
     <div className="flex items-baseline justify-between">
      <span className={`display-num text-2xl font-bold ${op?.certText || 'text-warn'}`}>{op?.certPct}%</span>
      <span className="font-body text-ghost text-[10px]">{done} of {total} modules complete</span>
     </div>
    </div>
   </div>

   {/* Assessment window */}
   <div className="px-4 py-3 border-b border-rule2 bg-stone flex items-center gap-2">
    <Clock size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
    <div>
     <div className="font-body text-ghost text-[10px]">Next assessment window</div>
     <div className="font-body font-medium text-ink text-[12px]">{pathway.assessmentWindow}</div>
    </div>
   </div>

   {/* Training modules */}
   <div className="px-4 pt-3 pb-1 font-body text-ghost text-[10px] uppercase tracking-widest border-b border-rule2">What you need to do</div>
   {pathway.modules.map((mod, i) => (
    <div key={i} className={`flex items-start gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 bg-stone ${
     mod.status === 'locked' ? 'opacity-40' : ''
    }`}>
     <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
      mod.status === 'complete' ? 'bg-ok' : mod.status === 'in-progress' ? 'border-2 border-warn' : 'border-2 border-rule2'
     }`}>
      {mod.status === 'complete' && <Check size={11} strokeWidth={2.5} className="text-white" />}
      {mod.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-warn" />}
      {mod.status === 'locked' && <Lock size={9} strokeWidth={2} className="text-ghost" />}
     </div>
     <div className="flex-1 min-w-0">
      <div className={`font-body text-[12px] leading-snug ${
       mod.status === 'complete' ? 'text-ghost line-through' : mod.status === 'locked' ? 'text-ghost' : 'text-ink font-medium'
      }`}>{mod.label}</div>
      <div className="font-body text-ghost text-[10px] mt-0.5">{mod.hours}h</div>
     </div>
    </div>
   ))}

   {/* Current cert */}
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
 })()}
 </div>
 </div>
 )
}
