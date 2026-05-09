import { useState } from 'react'
import { Flag } from 'lucide-react'
import { handoffData } from '../data'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, SP, ActionBanner, PersonAvatar } from '../components/UI'

const OPERATORS = [
 { name: 'C. Reyes', role: 'L1 · Pack Line · 14 months', initials: 'CR', station: 'Sauce Dosing (covering)', certPct: 72, certLabel: '72% to L2 Sauce Dosing', certColor: 'bg-warn', certText: 'text-warn' },
 { name: 'P. Okonkwo', role: 'L2 · Topping · 22 months', initials: 'PO', station: 'Oven Station B', certPct: 91, certLabel: '91% to L3 Sauce Dosing', certColor: 'bg-ok', certText: 'text-ok' },
 { name: 'F. Adeyemi', role: 'L1 · QA · 8 months', initials: 'FA', station: 'QA Check Station', certPct: 40, certLabel: '40% to L2 QA Inspector', certColor: 'bg-ghost',certText: 'text-muted' },
]

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
 const { taskAssignments, trainingPlans, trainingCompletions, flaggedItems, checklistSigned, nearMisses, operatorAcknowledgments } = useAppState()

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

 {/* Right panel: cert + training */}
 <div className="hidden lg:block w-[260px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">
 <SP title="Certification progress" sub={op?.role}>
 <div className="px-4 py-3">
 <div className="font-body text-ghost text-[10px] mb-1.5">{op?.certLabel}</div>
 <div className="h-2 bg-rule2 mb-1.5">
 <div className={`h-full ${op?.certColor} transition-all`} style={{ width: op?.certPct + '%' }} />
 </div>
 <div className={`display-num text-2xl ${op?.certText}`}>{op?.certPct}%</div>
 <div className="font-body text-ghost text-[10px] mt-1">toward next certification level</div>
 </div>
 </SP>

 <SP title="Training plan" sub="Current cycle">
 {!plan?.submitted ? (
 <div className="px-4 py-3 font-body text-ghost text-[11px]">
 No training plan yet.
 {selected === 'C. Reyes' && ' Nominated by Kowalski — supervisor to set up plan in HandoffIQ.'}
 </div>
 ) : (
 <div className="px-4 py-3 space-y-2">
 <div className="flex justify-between items-baseline">
 <span className="font-body text-ghost text-[10px]">Level</span>
 <span className="font-body font-medium text-ink text-[12px]">{plan.level}</span>
 </div>
 <div className="flex justify-between items-baseline">
 <span className="font-body text-ghost text-[10px]">Trainer</span>
 <span className="font-body font-medium text-ink text-[12px]">{plan.trainer}</span>
 </div>
 <div className="flex justify-between items-baseline">
 <span className="font-body text-ghost text-[10px]">Starts</span>
 <span className="font-body font-medium text-ink text-[12px]">{plan.startDate}</span>
 </div>
 {completion ? (
 <div className={`flex items-center gap-1 pt-2 border-t border-rule2 font-body text-[11px] ${completion.outcome === 'Passed' ? 'text-ok' : 'text-warn'}`}>
 <svg className="w-3 h-3 stroke-current flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
 {completion.outcome} · {completion.date} · {completion.hours}h
 </div>
 ) : (
 <div className="flex items-center gap-1 pt-2 border-t border-rule2 font-body text-ghost text-[10px]">
 <div className="w-1.5 h-1.5 rounded-full bg-warn" />
 In progress
 </div>
 )}
 </div>
 )}
 </SP>

 <SP title="Cert expiry" sub="Your certifications">
 <div className="px-4 py-3">
 {selected === 'C. Reyes' && <div className="font-body text-ghost text-[11px]">L1 Pack Line · No expiry scheduled yet</div>}
 {selected === 'P. Okonkwo' && <div className="font-body text-ghost text-[11px]">L2 Topping · Valid through Dec 2026</div>}
 {selected === 'F. Adeyemi' && (
 <div>
 <div className="font-body text-warn text-[11px]">L2 QA Inspector · Expires in 35 days</div>
 <div className="font-body text-ghost text-[10px] mt-1">Renewal scheduled — check with supervisor</div>
 </div>
 )}
 </div>
 </SP>
 </div>
 </div>
 </div>
 )
}
