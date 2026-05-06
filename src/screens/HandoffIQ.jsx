import { useState, useEffect } from 'react'
import { handoffData, sanitationLogs, certExpiry, haccpData, scheduleData, crewHoursData } from '../data'
import { Urg, StatCell, SP, SPRow, SecHd, Btn, ConsequenceNotice, Layout, ActionBanner, PersonAvatar } from '../components/UI'
import { useAppState } from '../context/AppState'

const shiftEvents = [
 { time:'06:12', label:'Shift started', detail:'Score 54 — normal', tone:'ok' },
 { time:'06:42', label:'Risk threshold crossed', detail:'Score 78 · 3 signals compounding', tone:'danger' },
 { time:'06:48', label:'Interventions acted', detail:'Checklists + Martinez reassigned', tone:'ok' },
 { time:'09:30', label:'Sensor A-7 at count 4', detail:'Threshold 5 · Maintenance verbally notified', tone:'warn' },
 { time:'13:45', label:'COA follow-up', detail:'Novotny contacted ConAgra · Response pending','tone':'warn' },
 { time:'14:02', label:'Shift closed', detail:'OEE 81% · Handoff signed', tone:'ok' },
]

function ShiftTimeline({ events }) {
 const dotColor = { ok:'bg-ok', warn:'bg-warn', danger:'bg-danger' }
 const labelColor = { ok:'text-ok', warn:'text-warn', danger:'text-danger' }
 return (
 <div className="px-4 py-4 overflow-x-auto">
 <div className="relative" style={{ minWidth: 520 }}>
 <div className="absolute h-px bg-rule2" style={{ top: 28, left: 0, right: 0 }} />
 <div className="flex">
 {events.map((e, i) => (
 <div key={i} className="flex flex-col items-center flex-1">
 <span className="font-body text-ghost text-[9px] h-6 flex items-end pb-1 leading-none">{e.time}</span>
 <div className={`w-2.5 h-2.5 rounded-full relative z-10 ${dotColor[e.tone]}`} />
 <div className={`font-body font-medium text-[10px] mt-2 text-center leading-tight px-1 ${labelColor[e.tone]}`}>{e.label}</div>
 <div className="font-body text-ghost text-[9px] mt-0.5 text-center leading-tight px-1">{e.detail}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}


function ForecastRow({ row }) {
 const scoreColor = row.score >= 75 ? 'text-danger' : row.score >= 60 ? 'text-warn' : 'text-ok'
 const hasConflict = row.urgent
 const signals = (row.signals || []).map(s => {
  const [label, tone] = s.split(':')
  return { label, tone }
 })
 return (
  <div className={`flex border-b border-rule2 last:border-b-0 min-h-[46px] ${hasConflict ? 'bg-danger/[0.03]' : ''}`}>
  <div className="w-[72px] flex-shrink-0 px-3 py-2.5 border-r border-rule2 font-body text-ghost text-[10px] leading-relaxed whitespace-pre-line">{row.time}</div>
  <div className={`w-10 flex-shrink-0 px-2 pt-2.5 display-num text-lg ${scoreColor}`}>{row.score}</div>
  <div className="flex-1 px-3 py-2.5">
   <div className="font-body font-medium text-ink text-[12px] mb-1">{row.name}</div>
   <div className="flex gap-1.5 flex-wrap mb-1">
   {signals.map((s, i) => {
    const cls = s.tone === 'ok' ? 'text-ok bg-ok/10' : (s.tone === 'bad' || s.tone === 'danger') ? 'text-danger bg-danger/10' : 'text-warn bg-warn/10'
    return <span key={i} className={`font-body text-[10px] px-1.5 py-px ${cls}`}>{s.label}</span>
   })}
   </div>
   {row.action && <p className={`font-body text-[10px] ${hasConflict ? 'text-warn' : 'text-ghost'}`}>{row.action}</p>}
  </div>
  </div>
 )
}

export default function HandoffIQ() {
 const d = handoffData
 const { handoffSigned: signed, setHandoffSigned: setSigned,
 handoffNominated: nominated, setHandoffNominated: setNominated,
 trainingPlans, setTrainingPlans,
 trainingCompletions, setTrainingCompletions,
 sanitationEntries, setSanitationEntries,
 operatorAcknowledgments, setOperatorAcknowledgments,
 logActivity } = useAppState()
 const [handoffAccepted, setHandoffAccepted] = useState(false)
 const [completionForms, setCompletionForms] = useState({})
 const [trainingForms, setTrainingForms] = useState({})
 const [showSanitationForm, setShowSanitationForm] = useState(false)
 const [sanitationForm, setSanitationForm] = useState({ line:'', shift:'', checks:'7', total:'7', notes:'', tech:'T. Osei' })
 const [timeToShift, setTimeToShift] = useState('')

 useEffect(() => {
 const tick = () => {
 const now = new Date()
 const target = new Date()
 target.setHours(14, 0, 0, 0)
 const diff = Math.max(0, target - now)
 const h = Math.floor(diff / 3600000)
 const m = Math.floor((diff % 3600000) / 60000)
 setTimeToShift(h > 0 ? `${h}h ${m}m` : `${m}m`)
 }
 tick()
 const id = setInterval(tick, 30000)
 return () => clearInterval(id)
 }, [])

 const side = (
 <>
 {/* Workforce dev */}
 <SP title="Workforce development" sub="CAPA-driven">
 <div className="px-4 py-2 font-body text-warn text-[11px] border-b border-rule2 flex items-center gap-1.5">
 <svg className="w-3 h-3 stroke-warn flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24">
 <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
 </svg>
 Skill mismatch = 29% of 90-day CAPAs
 </div>
 {d.operators.map((op, i) => {
 const plan = trainingPlans[op.name]
 const form = trainingForms[op.name] || {}
 return (
 <div key={i} className="px-4 py-3 border-b border-rule last:border-b-0">
 <div className="flex items-start gap-2 mb-2">
 <PersonAvatar name={op.name} size={28} />
 <div className="flex-1 min-w-0">
 <div className="font-body text-ink font-medium text-[12px]">{op.name}</div>
 <div className="font-body text-ghost text-[10px]">{op.role}</div>
 </div>
 <button type="button"
 onClick={() => !nominated[op.name] && op.badgeTone === 'warn' && setNominated(p => ({ ...p, [op.name]: true }))}
 className={`font-body font-medium text-[10px] px-2 py-0.5 flex-shrink-0 transition-colors ${
 plan?.submitted ? 'bg-ok/10 text-ok cursor-default'
 : nominated[op.name] ? 'bg-warn/10 text-warn cursor-default'
 : op.badgeTone === 'warn' ? 'bg-warn/10 text-warn cursor-pointer hover:bg-warn/20'
 : op.badgeTone === 'ok' ? 'bg-ok/10 text-ok cursor-default'
 : 'bg-stone3 text-muted cursor-default'
 }`}>
 {plan?.submitted ? 'Plan set ✓' : nominated[op.name] ? 'Nominated ✓' : op.badge}
 </button>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1 bg-rule2"><div className={`h-full ${op.color}`} style={{ width: op.pct + '%' }} /></div>
 <span className="font-body text-ghost text-[9px] whitespace-nowrap">{op.label}</span>
 </div>
 {op.fromCapa && <div className="font-body text-warn/80 text-[10px] mt-1">{op.fromCapa}</div>}
 {nominated[op.name] && !plan?.submitted && (
 <div className="mt-2 slide-in space-y-1.5">
 <div className="font-body text-ghost text-[9px] uppercase tracking-widest">Training plan</div>
 <select
 value={form.level || ''}
 onChange={e => setTrainingForms(p => ({ ...p, [op.name]: { ...p[op.name], level: e.target.value } }))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer"
 >
 <option value="">Target cert level…</option>
 <option>L2 Sauce Dosing</option>
 <option>L2 QA Inspector</option>
 <option>L3 Oven Operator</option>
 <option>L3 Pack Lead</option>
 </select>
 <input
 type="text" placeholder="Start date (e.g. Apr 22)"
 value={form.startDate || ''}
 onChange={e => setTrainingForms(p => ({ ...p, [op.name]: { ...p[op.name], startDate: e.target.value } }))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1"
 />
 <select
 value={form.trainer || ''}
 onChange={e => setTrainingForms(p => ({ ...p, [op.name]: { ...p[op.name], trainer: e.target.value } }))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer"
 >
 <option value="">Assign trainer…</option>
 <option>A. Martinez · L3</option>
 <option>D. Kowalski · Supervisor</option>
 <option>P. Okonkwo · L2</option>
 </select>
 <button type="button"
 disabled={!form.level || !form.startDate || !form.trainer}
 onClick={() => setTrainingPlans(p => ({ ...p, [op.name]: { ...form, submitted: true } }))}
 className="w-full font-body font-medium text-[10px] px-2 py-1.5 bg-ok text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
 >
 Submit training plan
 </button>
 </div>
 )}
 {plan?.submitted && !trainingCompletions[op.name] && (
 <div className="mt-2 space-y-1 slide-in">
 <div className="flex items-center gap-1 font-body text-ok text-[10px]">
 <div className="w-1 h-1 rounded-full bg-ok" />
 {op.name} — {plan.level} with {plan.trainer} · starts {plan.startDate}
 </div>
 {!completionForms[op.name] ? (
 <button type="button" onClick={() => setCompletionForms(p => ({...p, [op.name]: { outcome:'', date:'', hours:'' }}))}
 className="font-body text-int text-[10px] hover:underline">Mark complete →</button>
 ) : (
 <div className="space-y-1.5 slide-in">
 <select value={completionForms[op.name]?.outcome || ''} onChange={e => setCompletionForms(p => ({...p, [op.name]: {...p[op.name], outcome: e.target.value}}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer">
 <option value="">Outcome…</option>
 <option>Passed</option><option>Failed — repeat required</option><option>Needs supervisor review</option>
 </select>
 <div className="flex gap-1.5">
 <input placeholder="Completion date" value={completionForms[op.name]?.date || ''} onChange={e => setCompletionForms(p => ({...p, [op.name]: {...p[op.name], date: e.target.value}}))}
 className="flex-1 font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
 <input placeholder="Hours" type="number" value={completionForms[op.name]?.hours || ''} onChange={e => setCompletionForms(p => ({...p, [op.name]: {...p[op.name], hours: e.target.value}}))}
 className="w-16 font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
 </div>
 <button type="button" disabled={!completionForms[op.name]?.outcome || !completionForms[op.name]?.date}
 onClick={() => {
 setTrainingCompletions(p => ({...p, [op.name]: completionForms[op.name]}))
 setCompletionForms(p => { const n={...p}; delete n[op.name]; return n })
 }}
 className="font-body font-medium text-[10px] px-2.5 py-1 bg-ok text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
 Record completion
 </button>
 </div>
 )}
 </div>
 )}
 {trainingCompletions[op.name] && (
 <div className="flex items-center gap-1 mt-2 font-body text-ok text-[10px] slide-in">
 <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
 {trainingCompletions[op.name].outcome} · {trainingCompletions[op.name].date} · {trainingCompletions[op.name].hours}h
 </div>
 )}
 </div>
 )
 })}
 </SP>

 {/* Cert expiry calendar */}
 <SP title="Cert expirations" sub="30 / 60 / 90 day view">
 {certExpiry.map((c, i) => {
 const color = c.tone === 'danger' ? 'text-danger' : c.tone === 'warn' ? 'text-warn' : 'text-ok'
 const bg = c.tone === 'danger' ? 'bg-danger/[0.03] border-l-danger' : c.tone === 'warn' ? 'border-l-warn' : 'border-l-ok'
 return (
 <div key={i} className={`flex items-start gap-2.5 px-4 py-2.5 border-b border-rule last:border-b-0 border-l-2 ${bg}`}>
 <div className="flex-1 min-w-0">
 <div className={`font-body font-medium text-[12px] ${color}`}>{c.name}</div>
 <div className="font-body text-ghost text-[10px]">{c.cert} · {c.line}</div>
 {c.note && <div className={`font-body text-[10px] mt-0.5 ${color}`}>{c.note}</div>}
 </div>
 <div className="text-right flex-shrink-0">
 <div className={`display-num text-base ${color}`}>{c.expiresIn === 0 ? '0d' : `${c.expiresIn}d`}</div>
 <div className="font-body text-ghost text-[9px]">{c.expiresIn === 0 ? 'tonight' : 'remaining'}</div>
 </div>
 </div>
 )
 })}
 </SP>

 {/* Incoming briefing */}
 <SP title="Incoming supervisor" sub="PM shift · 14:02">
 <div className="px-4 py-3 space-y-1.5">
 <div className="flex items-center gap-2">
 <PersonAvatar name="M. Santos" size={24} />
 <div>
 <div className="font-body text-ink font-medium text-[13px]">M. Santos</div>
 <div className="font-body text-ghost text-[10px]">14:00–22:00 · Line 4</div>
 </div>
 </div>
 <div className="h-px bg-rule2 my-2" />
 <div className="font-body text-ink2 text-[11px] leading-relaxed">
 Review Sensor A-7 watch — count is at 4, threshold is 5. TS-8811 COA gap carries forward — request immediately if not resolved.
 </div>
 </div>
 {timeToShift && (
 <div className="flex items-baseline gap-2 px-4 py-3 border-t border-rule2">
 <span className="display-num text-2xl text-warn">{timeToShift}</span>
 <span className="font-body text-ghost text-[11px]">until PM shift starts</span>
 </div>
 )}
 </SP>

 {/* Last 5 handoffs */}
 <SP title="Recent handoffs" sub="Line 4">
 {d.lastHandoffs.map((h, i) => (
 <div key={i} className="flex justify-between px-4 py-2 border-b border-rule last:border-b-0 font-body text-[11px]">
 <span className=" text-muted">{h.shift}</span>
 <span className={`display-num text-[13px] ${h.tone}`}>{h.oee}</span>
 </div>
 ))}
 </SP>
 </>
 )

 return (
 <div className="flex flex-col h-full overflow-hidden">
 {/* Step 1 — outgoing signs */}
 {!signed && (
 <ActionBanner
 color="#3A8A5A"
 headline="Shift handoff awaiting outgoing signature — Line 4"
 body="D. Kowalski signing off · Incoming: M. Santos · April 16, 14:02"
 >
 <Btn variant="ghost" onClick={() => setSigned(true)}>Sign handoff — Kowalski</Btn>
 </ActionBanner>
 )}

 {/* Step 2 — incoming pending */}
 {signed && !handoffAccepted && (
 <ActionBanner
 color="#3A8A5A"
 headline="D. Kowalski signed off — waiting for M. Santos to accept"
 body="Scroll to bottom to review carry-forward items and confirm the shift"
 />
 )}

 {/* Complete — both parties signed */}
 {signed && handoffAccepted && (
 <div className="flex items-center gap-3 px-5 py-3 bg-ok/10 border-b border-ok/20 flex-shrink-0">
 <svg className="w-3.5 h-3.5 stroke-ok flex-shrink-0" fill="none" strokeWidth={2.5} viewBox="0 0 24 24">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 <span className="font-body text-ok text-[12px]">
 Handoff complete · Signed: D. Kowalski (outgoing) · M. Santos (incoming) · 14:02 · April 16, 2026
 </span>
 </div>
 )}

 {/* Stats */}
 <div className="grid grid-cols-4 border-b border-rule2 bg-stone flex-shrink-0">
 {d.stats.map((s, i) => <StatCell key={i} {...s} />)}
 </div>

 <Layout side={side}>
 {/* Operator context */}
 <div className="border-b border-rule2">
 <SecHd tag="Your shift context" title="Operator-facing — what Takorin flagged today and why"
 badge={<Urg level="info">Visible to named operators</Urg>} />
 {[
 { name: 'C. Reyes', accent: 'brass', safetyNote: 'Before starting Sauce Dosing: allergen changeover log must be signed (Pepperoni → GF-Flatbread). CCP-1 hold temp is 60°C minimum. If you see sauce temp below this, log it immediately.' },
 { name: 'P. Okonkwo', accent: 'ok', safetyNote: 'Oven Station B: today\'s SKU (GF-Flatbread) has a CCP-3 minimum of 185°F — higher than Pepperoni Classic. Log any reading below this as a CCP deviation, not a watch.' },
 ].map((op, i) => (
 <div key={i} className={`flex gap-3 px-4 py-3.5 border-b border-rule2 last:border-b-0 border-l-2 ${i === 0 ? 'border-l-brass bg-brass/[0.03]' : 'border-l-ok bg-ok/[0.02]'}`}>
 <div className="flex-shrink-0 mt-0.5">
 <PersonAvatar name={op.name} size={24} />
 </div>
 <div>
 <div className="font-body font-medium text-ink text-[12px] mb-1">{op.name}</div>
 <div className="font-body text-ink2 text-[11px] leading-relaxed mb-1.5">
 {i === 0
 ? 'Takorin flagged a certification mismatch. Sauce Dosing at today\'s production volume requires L2. Martinez covered the station. This is not a performance note — you\'ve been nominated for the L2 pathway.'
 : 'No flags on your station today. You\'re 91% toward your L3 Sauce Dosing certification. Your supervisor nominated you for the next certification assessment cycle.'}
 </div>
 <div className="font-body text-[10px] leading-relaxed px-2 py-1.5 bg-stone3 border-l-2 border-l-warn text-muted mb-2">
 <span className="text-warn not-italic font-medium">Safety: </span>{op.safetyNote}
 </div>
 {!operatorAcknowledgments[op.name] ? (
 <button type="button"
 onClick={() => {
 const t = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
 setOperatorAcknowledgments(p => ({...p, [op.name]: { time: t, item: 'safety-briefing-apr16' }}))
 logActivity({ actor: op.name, action: 'Acknowledged safety briefing', item: 'Safety context Apr 16', type: 'acknowledgment' })
 }}
 className="font-body font-medium text-[10px] px-3 py-1.5 bg-stone3 text-muted hover:bg-ok/10 hover:text-ok transition-colors w-full text-left"
 >
 I've read and understood this — {op.name}
 </button>
 ) : (
 <div className="flex items-center gap-1 font-body text-ok text-[10px] slide-in">
 <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
 Acknowledged by {op.name} · {operatorAcknowledgments[op.name].time}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Shift record */}
 <div className="border-b border-rule2">
 <SecHd tag="Shift record" title="Line 4 · April 16 · AM shift · D. Kowalski"
 badge={<Urg level="ok">2 acted · 1 carry-forward</Urg>} />
 {d.cases.map((c, i) => (
 <div key={i} className={`border-l-2 border-b border-rule2 last:border-b-0 ${
 c.urgency === 'ok' ? 'border-l-ok' : c.urgency === 'warn' ? 'border-l-warn' : 'border-l-danger'
 }`}>
 <div className="grid grid-cols-[28px_1fr]">
 <div className={`pt-4 pl-3 display-num text-[13px] ${c.urgency === 'ok' ? 'text-ok' : c.urgency === 'warn' ? 'text-warn' : 'text-danger'}`}>
 {c.num}
 </div>
 <div className="p-4 pl-2 space-y-1.5">
 <p className="font-body text-ink font-medium text-[13px]">{c.title}</p>
 <p className="font-body text-ink2 text-[12px] leading-relaxed">{c.desc}</p>
 {c.evidence && <p className="font-body text-ghost text-[11px]">▸ {c.evidence}</p>}
 {c.events && c.events.map((e, j) => (
 <div key={j} className="flex gap-2 font-body text-[11px]">
 <span className=" text-ghost flex-shrink-0">{e.time}</span>
 <span className="text-ink2">{e.val}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Shift timeline */}
 <div>
 <SecHd tag="Shift trajectory" title="Key events — AM shift · 06:12–14:02"
 badge={<Urg level="warn">Sensor A-7 carry-forward</Urg>} />
 <ShiftTimeline events={shiftEvents} />
 </div>


 {/* Upcoming shifts */}
 <div>
  <SecHd tag="Upcoming shifts" title="Next 48 hours — readiness and crew conflicts"
  badge={<Urg level="warn">1 intervention required</Urg>} />
  {scheduleData.days.flatMap(day => day.conflicts.map((issue, j) => ({ date: day.date, issue, key: `${day.date}-${j}` }))).map(c => (
  <div key={c.key} className="flex items-start gap-2 px-4 py-2 border-b border-rule2 bg-danger/[0.03]">
   <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 stroke-danger" fill="none" strokeWidth={2} viewBox="0 0 24 24">
   <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
   </svg>
   <div>
   <span className="font-body font-medium text-[12px] text-danger">{c.date}</span>
   <div className="font-body text-ghost text-[10px] mt-0.5">{c.issue}</div>
   </div>
  </div>
  ))}
  {handoffData.forecast.map((row, i) => (
  <ForecastRow key={i} row={row} />
  ))}
 </div>

 {/* Attestation — outgoing signature */}
 {!signed && (
 <div className="px-5 py-4 bg-stone3/50 border-t border-rule2">
 <div className="font-body text-ink2 text-[12px] mb-3 leading-relaxed">
 D. Kowalski: sign off to confirm all carry-forward items have been documented and the incoming supervisor has been briefed.
 </div>
 <Btn style={{ background:'#3A8A5A', color:'#F5F0E8' }} onClick={() => setSigned(true)}>
 Sign off — D. Kowalski
 </Btn>
 </div>
 )}

 {/* Attestation — incoming acceptance */}
 {signed && !handoffAccepted && (
 <div className="border-t border-rule2">
 <div className="px-5 py-4 bg-stone2">
 <div className="font-body text-[9px] font-medium uppercase tracking-widest text-ghost mb-3">
 Carry-forward items — M. Santos must acknowledge before accepting
 </div>
 {[
 { tone: 'warn', text: 'Sensor A-7 variance at count 4 of 5 threshold. Escalate to director at count 5. No action taken by Kowalski.' },
 { tone: 'danger', text: 'TS-8811 COA gap unresolved — production start remains blocked. Request COA from ConAgra immediately on shift start.' },
 ].map((item, i) => (
 <div key={i} className={`flex items-start gap-2 px-3 py-2 mb-2 border-l-2 ${item.tone === 'danger' ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn bg-warn/[0.02]'}`}>
 <span className={`font-body text-[11px] flex-shrink-0 mt-px ${item.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>▸</span>
 <span className="font-body text-ink2 text-[11px] leading-relaxed">{item.text}</span>
 </div>
 ))}
 <div className="font-body text-ink2 text-[12px] mb-3 leading-relaxed">
 By accepting, M. Santos acknowledges these carry-forwards and takes responsibility for Line 4 from 14:00.
 </div>
 <button type="button"
 onClick={() => {
 setHandoffAccepted(true)
 logActivity({ actor: 'M. Santos', action: 'Accepted shift handoff from D. Kowalski', item: 'Line 4 · Apr 16 PM', type: 'acknowledgment' })
 }}
 className="font-body font-medium text-[11px] px-4 py-2 bg-ok text-white hover:opacity-90 transition-opacity"
 >
 Accept shift — M. Santos
 </button>
 </div>
 </div>
 )}

 {/* Complete */}
 {signed && handoffAccepted && (
 <div className="px-5 py-3 bg-ok/10 border-t border-rule2 flex items-center gap-3">
 <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-ok/20">
 <svg className="w-4 h-4 stroke-ok" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
 </div>
 <div className="font-body text-ok text-[12px]">
 Handoff complete · D. Kowalski signed off · M. Santos accepted · 14:02 · April 16, 2026
 </div>
 </div>
 )}
 </Layout>
 </div>
 )
}
