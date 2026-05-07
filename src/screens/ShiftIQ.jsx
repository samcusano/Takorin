import { useState, useEffect, useRef } from 'react'
import { shiftData, line6Data, haccpData, productionRate, crewHoursData } from '../data'
import {
 Urg, StatCell, SecHd, CaseCard, Layout,
 Btn, ConsequenceNotice, PageHead, ActionBanner, MetricCard, ScoreRing,
 PersonAvatar, Modal, WaveformSparkline, Chip
} from '../components/UI'
import { Flag, ChevronRight, ChevronDown, AlertTriangle, Check, X, TrendingDown, RotateCcw } from 'lucide-react'
import { useAppState } from '../context/AppState'

const CHECKLIST_ITEMS = [
 { key: 'topping', label: 'Topping weight verification', operator: 'Reyes', isAllergen: false },
 { key: 'qa1', label: 'Packaging QA pre-check', operator: 'Patel', isAllergen: false },
 { key: 'seal', label: 'Seal inspection', operator: 'Patel', isAllergen: false },
 { key: 'allergen', label: 'Allergen changeover log', operator: 'Okonkwo', isAllergen: true },
 { key: 'emp', label: 'Zone 1 environmental swab — Sauce Dosing', operator: 'Okonkwo', isAllergen: false },
 { key: 'calibration', label: 'Oven B thermocouple calibration check', operator: 'Kowalski', isAllergen: false },
]

const CHECKLIST_TOTAL = 13

const HACCP_BY_STATION = {
 'Supervisor': null,
 'Operator · L3': { station: 'Sauce Dosing', ccp: 'CCP-1', limit: '60°C hold temp' },
 'Operator · L1 — Mismatch ⚠': { station: 'Sauce Dosing', ccp: 'CCP-1', limit: '60°C hold temp — L2 cert required' },
 'Operator · L2': { station: 'Oven Station B', ccp: 'CCP-3', limit: '185°F for GF-Flatbread' },
}

function EmptyLine({ name }) {
 return (
 <div className="flex flex-col items-center justify-center h-full py-12 px-4">
 <div className="font-body text-ghost text-[12px] text-center leading-relaxed">
 No live data for {name}<br />Pilot limited to Line 4
 </div>
 </div>
 )
}

function ScoreBadge({ score }) {
 const color = score >= 75 ? 'text-danger' : score >= 60 ? 'text-warn' : 'text-ok'
 return <span className={`display-num text-3xl ${color}`}>{score}</span>
}

function AgentTimeline({ timeline, sparkline, score }) {
 const scoreColor = score >= 75 ? '#D94F2A' : score >= 60 ? '#C4920A' : '#3A8A5A'
 const scoreTextColor = score >= 75 ? 'text-danger' : score >= 60 ? 'text-warn' : 'text-ok'
 const zone = score >= 75 ? 'AT RISK' : score >= 60 ? 'WATCH' : 'CLEAR'
 return (
 <div className="border-b border-rule2">
 <MetricCard
 title={`${zone} — Line 4`}
 value={score}
 valueColor={scoreTextColor}
 waveformData={sparkline}
 waveformColor={scoreColor}
 waveformHeight={40}
 meta={{ label: 'Trend', value: 'Rising · 06:12–06:42' }}
 />
 {/* Timeline rows */}
 {timeline.map((row, i) => (
 <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule last:border-b-0">
 <div className="font-body text-ghost text-[10px] w-11 flex-shrink-0 mt-0.5">{row.time}</div>
 <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
 row.level === 'now' ? 'bg-ochre' : row.level === 'warn' ? 'bg-warn' : row.level === 'ok' ? 'bg-ok' : 'bg-rule'
 }`} />
 <div className="flex-1">
 <p className="font-body text-ink2 text-[11px] leading-relaxed"
 dangerouslySetInnerHTML={{ __html: row.event.replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink font-medium">$1</strong>') }}
 />
 {row.delta && <div className={`display-num text-[11px] mt-0.5 ${row.deltaColor}`}>{row.delta}</div>}
 </div>
 </div>
 ))}
 </div>
 )
}

function SignalCard({ sig }) {
 const c = sig.tone === 'danger' ? '#D94F2A' : sig.tone === 'warn' ? '#C4920A' : '#3A8A5A'
 return (
 <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0">
 <ScoreRing pct={sig.score} size={36} color={c} />
 <div className="flex-1 min-w-0">
 <div className={`font-body text-[12px] font-medium truncate ${sig.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{sig.name}</div>
 <div className="font-body text-ghost text-[10px]">{sig.sub}</div>
 </div>
 <span className={`font-body font-medium text-[10px] px-2 py-0.5 flex-shrink-0 ${
 sig.tone === 'ok' ? 'bg-ok/10 text-ok' : sig.tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
 }`}>{sig.status}</span>
 </div>
 )
}

const OP_META = {
 'D. Kowalski': { initials:'DK', station:'Line 4 — Supervisor', certPct:100, certLabel:'Fully certified · L4 Supervisor' },
 'A. Martinez': { initials:'AM', station:'Sauce Dosing', certPct:85, certLabel:'85% to L4 Sauce Dosing' },
 'C. Reyes': { initials:'CR', station:'Sauce Dosing (covering)', certPct:72, certLabel:'72% to L2 Sauce Dosing' },
 'P. Okonkwo': { initials:'PO', station:'Oven Station B', certPct:91, certLabel:'91% to L3 Sauce Dosing' },
}

const OP_SAFETY = {
 'D. Kowalski': 'Line 4 Supervisor: all startup checklists must be signed by T+60. Allergen changeover log is blocking — must clear before GF-Flatbread run starts.',
 'A. Martinez': 'Sauce Dosing: CCP-1 hold temp 60°C minimum. Reassigned from Topping Line — brief with outgoing operator before starting.',
 'C. Reyes': 'Before starting Sauce Dosing: allergen changeover log must be signed (Pepperoni → GF-Flatbread). CCP-1 hold temp is 60°C minimum.',
 'P. Okonkwo': 'Oven Station B: today\'s SKU (GF-Flatbread) CCP-3 minimum is 185°F. Log any reading below this immediately.',
}

function OperatorPanel({ name, onClose }) {
 const { taskAssignments, trainingPlans, trainingCompletions, flaggedItems } = useAppState()
 const meta = OP_META[name] || { initials: name.split(' ').map(n => n[0]).join(''), station: '—', certPct: 0, certLabel: '—' }
 const safety = OP_SAFETY[name]
 const myTasks = taskAssignments[name] || []
 const plan = trainingPlans[name]
 const completion = trainingCompletions[name]
 const myFlags = Object.entries(flaggedItems).filter(([, f]) => f).map(([key, f]) => ({ key, ...f }))
 const certC = meta.certPct >= 80 ? '#3A8A5A' : '#C4920A'

 useEffect(() => {
 const handler = (e) => { if (e.key === 'Escape') onClose() }
 document.addEventListener('keydown', handler)
 return () => document.removeEventListener('keydown', handler)
 }, [onClose])

 return (
 <>
 <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} />
 <div className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-stone border-l border-rule2 flex flex-col overflow-hidden slide-right">
 <div className="flex items-center gap-3 px-4 py-3 border-b border-rule2 bg-stone2 flex-shrink-0" style={{ borderTop:'3px solid #D94F2A' }}>
 <PersonAvatar name={name} size={32} />
 <div className="flex-1 min-w-0">
 <div className="font-body font-medium text-ink text-[13px]">{name}</div>
 <div className="font-body text-ghost text-[11px]">{meta.station}</div>
 </div>
 <button type="button" onClick={onClose} aria-label="Close operator panel" className="text-ghost hover:text-ink transition-colors p-1 cursor-pointer">
 <X size={14} strokeWidth={2.5} aria-hidden="true" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto">
 {safety && (
 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-[10px]">Safety context · today</div>
 <div className="px-4 py-3 border-l-2 border-l-warn bg-warn/[0.02]">
 <div className="font-body text-ink2 text-[12px] leading-relaxed">{safety}</div>
 </div>
 </div>
 )}

 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 flex items-baseline justify-between">
 <span className="font-body text-muted text-[10px]">Today's tasks</span>
 {myTasks.some(t => !t.done) && (
 <span className="font-body text-warn text-[10px]">{myTasks.filter(t => !t.done).length} pending</span>
 )}
 </div>
 {myTasks.length === 0 ? (
 <div className="px-4 py-3 font-body text-ghost text-[12px]">No tasks assigned — tasks created in ShiftIQ appear here.</div>
 ) : myTasks.map((t, i) => (
 <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
 <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${t.done ? 'bg-ok' : 'border-2 border-rule2'}`}>
 {t.done && <Check size={10} strokeWidth={3} className="text-white" />}
 </div>
 <div className="flex-1">
 <div className={`font-body font-medium text-[12px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
 {t.dueTime && <div className="font-body text-ghost text-[10px]">Due {t.dueTime}</div>}
 </div>
 </div>
 ))}
 </div>

 {myFlags.length > 0 && (
 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-[10px]">Flagged items</div>
 {myFlags.map((f, i) => (
 <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule2 last:border-b-0 bg-warn/[0.02]">
 <Flag size={13} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
 <div>
 <div className="font-body font-medium text-ink text-[12px]">{f.key}</div>
 <div className="font-body text-warn text-[10px]">{f.reason}</div>
 </div>
 </div>
 ))}
 </div>
 )}

 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-[10px]">Certification progress</div>
 <div className="px-4 py-3">
 <div className="font-body text-ghost text-[10px] mb-2">{meta.certLabel}</div>
 <div style={{ height:5, background:'#D8D2C8', marginBottom:8 }}>
 <div style={{ height:'100%', width:`${meta.certPct}%`, background:certC, transition:'width 0.6s ease' }} />
 </div>
 <span style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'', fontSize:20, color:certC }}>{meta.certPct}%</span>
 </div>
 </div>

 <div>
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-[10px]">Training plan</div>
 {!plan?.submitted ? (
 <div className="px-4 py-3 font-body text-ghost text-[12px]">
 No active training plan.
 {name === 'C. Reyes' && ' Nominated by Kowalski — set up plan in HandoffIQ.'}
 </div>
 ) : (
 <div className="px-4 py-3 space-y-2">
 {[['Level', plan.level], ['Trainer', plan.trainer], ['Starts', plan.startDate]].map(([k, v]) => (
 <div key={k} className="flex justify-between items-baseline">
 <span className="font-body text-ghost text-[10px]">{k}</span>
 <span className="font-body font-medium text-ink text-[12px]">{v}</span>
 </div>
 ))}
 {completion ? (
 <div className={`flex items-center gap-1 pt-2 border-t border-rule font-body text-[11px] ${completion.outcome === 'Passed' ? 'text-ok' : 'text-warn'}`}>
 <Check size={12} strokeWidth={2} className="stroke-current flex-shrink-0" />
 {completion.outcome} · {completion.date} · {completion.hours}h
 </div>
 ) : (
 <div className="flex items-center gap-1 pt-2 border-t border-rule font-body text-ghost text-[10px]">
 <div className="w-1.5 h-1.5 rounded-full bg-warn" />
 In progress
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </>
 )
}

function CrewRow({ m, onView }) {
 const hrs = crewHoursData[m.name]
 const fatigue = hrs ? (hrs.hoursThisWeek >= 60 ? 'danger' : hrs.hoursThisWeek >= 48 ? 'warn' : null) : null
 return (
 <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule last:border-b-0 ${fatigue === 'danger' ? 'bg-danger/[0.02]' : ''}`}>
 <div className="flex-1 min-w-0">
 <div className={`font-body text-[12px] font-medium ${m.flag ? 'text-danger' : 'text-ink'}`}>{m.name}</div>
 <div className={`font-body text-[10px] ${m.flag ? 'text-danger' : 'text-ghost'}`}>{m.role}</div>
 </div>
 <div className="flex items-center gap-2">
 {hrs && fatigue && (
 <span className={`font-body text-[10px] px-1 py-px ${fatigue === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>{hrs.hoursThisWeek}h</span>
 )}
 <div className="flex gap-1" title={`Skill level: ${m.dots.filter(Boolean).length} of ${m.dots.length}`} aria-label={`Skill level ${m.dots.filter(Boolean).length} of ${m.dots.length}`}>
 {m.dots.map((d, i) => (
 <div key={i} className={`w-2 h-2 ${d ? 'bg-ochre' : 'bg-rule2'}`} />
 ))}
 </div>

 </div>
 </div>
 )
}

function Finding({ f, onAct }) {
 const [acked, setAcked] = useState(null)
 const [showDismiss, setShowDismiss] = useState(false)
 const [dismissed, setDismissed] = useState(false)
 const [showed, setShowed] = useState(false)

 const handleAct = (action) => {
 onAct(f.id)
 setAcked('actioning')
 setShowed(true)
 }

 const borderColor = f.urgency === 'danger' ? 'border-l-danger' : f.urgency === 'warn' ? 'border-l-warn' : 'border-l-rule'

 return (
 <div className={`border-l-2 ${borderColor} border-b border-rule2 ${dismissed ? 'opacity-50' : ''}`}>
 <div className="grid grid-cols-[28px_1fr]">
 <div className={`pt-4 pl-3 display-num text-[13px] ${
 f.urgency === 'danger' ? 'text-danger' : f.urgency === 'warn' ? 'text-warn' : 'text-muted'
 }`}>{f.num}</div>
 <div className="p-4 pl-2 space-y-2">
 <p className="font-body text-ink font-medium text-[13px] leading-snug">{f.title}</p>
 <p className="font-body text-ink2 text-[12px] leading-relaxed">{f.desc}</p>
 <p className="font-body text-ghost text-[11px] flex items-start gap-1"><ChevronRight size={11} className="flex-shrink-0 mt-px" />{f.evidence}</p>
 {f.source && (
  <div className="flex gap-1.5">
   <Chip tone="muted">{f.source}</Chip>
  </div>
 )}
 <div className="flex gap-2 pt-1">
 {f.actions.map((a, i) => (
 <Btn key={i} variant={i === 0 ? 'accent' : 'ghost'} onClick={() => handleAct(a)}>
 {a}
 </Btn>
 ))}
 <Btn variant="muted" onClick={() => setShowDismiss(!showDismiss)}>Dismiss</Btn>
 </div>
 {showDismiss && !dismissed && (
 <div className="flex gap-2 pt-1 slide-in">
 <select className="font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 flex-1 cursor-pointer">
 <option>Reason for dismissing…</option>
 <option>Already handled by outgoing supervisor</option>
 <option>Not applicable — SKU change in progress</option>
 <option>Assessment is incorrect — false positive</option>
 </select>
 <Btn variant="muted" onClick={() => { setDismissed(true); setShowDismiss(false) }}>Confirm</Btn>
 </div>
 )}
 {acked && (
 <div className="flex items-center gap-1.5 font-body text-ink2 text-[10px]">
 <div className={`w-1.5 h-1.5 rounded-full ${acked === 'actioning' ? 'bg-ok' : 'bg-danger'}`} />
 {acked === 'actioning' ? 'Actioning' : 'Dismissed'}
 </div>
 )}
 </div>
 </div>
 <ConsequenceNotice show={showed && f.consequence}>
 {f.consequence}
 </ConsequenceNotice>
 </div>
 )
}


// ── CrewAvatarStack ────────────────────────────────────────────────────────────

function CrewAvatarStack({ crew, onSelect }) {
 const MAX_SHOWN = 4
 const shown = crew.slice(0, MAX_SHOWN)
 const extra = crew.length - MAX_SHOWN
 return (
  <div className="flex items-center">
   {shown.map((m, i) => (
    <button key={m.name} type="button"
     onClick={() => onSelect(m.name)}
     title={m.name}
     className={`relative hover:z-10 transition-transform hover:scale-110 cursor-pointer ${i > 0 ? '-ml-2' : ''}`}
    >
     <div className="rounded-full border-2 border-stone2">
      <PersonAvatar name={m.name} size={34} />
     </div>
    </button>
   ))}
   {extra > 0 && (
    <div className="-ml-2 w-[34px] h-[34px] rounded-full border-2 border-stone2 bg-stone3 flex items-center justify-center">
     <span className="font-body text-ghost text-[10px] font-medium">+{extra}</span>
    </div>
   )}
  </div>
 )
}

// ── LineDropdown ───────────────────────────────────────────────────────────────

function LineDropdown({ lines, activeLine, onSelect, triggerRef, onClose }) {
 const dropRef = useRef(null)
 const [pos, setPos] = useState({ top: 0, left: 0 })

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   setPos({ top: r.bottom + 4, left: r.left })
  }
 }, [triggerRef])

 useEffect(() => {
  function handleClick(e) {
   if (
    dropRef.current && !dropRef.current.contains(e.target) &&
    triggerRef.current && !triggerRef.current.contains(e.target)
   ) onClose()
  }
  function handleKey(e) { if (e.key === 'Escape') onClose() }
  document.addEventListener('mousedown', handleClick)
  document.addEventListener('keydown', handleKey)
  return () => {
   document.removeEventListener('mousedown', handleClick)
   document.removeEventListener('keydown', handleKey)
  }
 }, [onClose, triggerRef])

 return (
  <div ref={dropRef} className="fixed z-50 plant-drop-in" style={{ top: pos.top, left: pos.left }}>
   <div className="w-[260px] bg-[#1e1a14] border border-[#3A342E] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden">
    <div className="plant-drop-in-content">
     <div className="px-4 py-2.5 border-b border-[#3A342E]">
      <p className="font-body text-ghost/40 text-[9px] uppercase tracking-widest">Select line</p>
     </div>
     {lines.map(line => {
      const sc = line.score >= 75 ? 'text-danger' : line.score >= 60 ? 'text-warn' : 'text-ok'
      const zoneLabel = line.score >= 75 ? 'AT RISK' : line.score >= 60 ? 'WATCH' : 'CLEAR'
      const isActive = line.id === activeLine
      return (
       <button key={line.id} type="button"
        onClick={() => { onSelect(line.id); onClose() }}
        className="flex items-center justify-between w-full px-4 py-3 border-b border-[#3A342E] last:border-b-0 hover:bg-[#2a2420] transition-colors group"
       >
        <div className="text-left">
         <div className={`font-body text-[12px] font-medium transition-colors ${isActive ? 'text-stone' : 'text-ghost group-hover:text-stone/80'}`}>{line.name}</div>
         <div className="font-body text-ghost/50 text-[10px] mt-0.5">{line.supervisor} shift</div>
        </div>
        <div className="flex items-center gap-2">
         <span className={`font-body text-[9px] uppercase tracking-widest ${sc}`}>{zoneLabel}</span>
         <span className={`display-num text-xl ${sc}`}>{line.score}</span>
         {isActive && <div className="w-1.5 h-1.5 rounded-full bg-ochre flex-shrink-0" />}
        </div>
       </button>
      )
     })}
    </div>
   </div>
  </div>
 )
}

export default function ShiftIQ() {
 const d = shiftData
 const [activeLine, setActiveLine] = useState('l4')
 const {
 shiftActed: acted, setShiftActed: setActed,
 readinessResolved, readinessScore,
 briefingAcknowledged, setBriefingAcknowledged,
 checklistSigned, setChecklistSigned,
 allergenOverride, setAllergenOverride,
 nearMisses, setNearMisses,
 taskAssignments, setTaskAssignments,
 maintenanceTickets, setMaintenanceTickets,
 empSessionResults, setEmpSessionResults,
 flaggedItems, setFlaggedItems,
 logActivity,
 } = useAppState()
 const [predActioned, setPredActioned] = useState(false)
 const [overrideMode, setOverrideMode] = useState(false)
 const [overrideReason, setOverrideReason] = useState('')
 const [showNearMiss, setShowNearMiss] = useState(false)
 const [nearMissForm, setNearMissForm] = useState({ station:'', what:'', action:'', atRisk: false })
 const [nearMissSubmitted, setNearMissSubmitted] = useState(false)
 const [empForm, setEmpForm] = useState({})
 const [flagForm, setFlagForm] = useState({})
 const [showTaskForm, setShowTaskForm] = useState(false)
 const [taskForm, setTaskForm] = useState({ assignee:'', label:'', dueTime:'' })
 const [viewingOperator, setViewingOperator] = useState(null)
 const [lineDropOpen, setLineDropOpen] = useState(false)
 const lineTriggerRef = useRef(null)
 const [col1Tab, setCol1Tab] = useState('orders')

 const skuContextReady = readinessResolved?.['ctx-0'] && (readinessScore ?? 64) >= 75
 const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
 const pendingTaskCount = Object.values(taskAssignments).flat().filter(t => !t.done).length
 const signedCount = 7 + Object.keys(checklistSigned).length
 const startupPct = Math.round((signedCount / CHECKLIST_TOTAL) * 100)
 const [countdown, setCountdown] = useState(d.countdown)
 const [escalatedShift, setEscalatedShift] = useState(false)

 useEffect(() => {
 const id = setInterval(() => setCountdown(s => Math.max(0, s - 1)), 1000)
 return () => clearInterval(id)
 }, [])

 const countdownFmt = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`
 const activeLined = d.lines.find(l => l.id === activeLine)
 const hasLiveData = activeLine === 'l4' || activeLine === 'l6'
 const lineD = activeLine === 'l6' ? line6Data : d
 const lineScore = activeLine === 'l6' ? line6Data.score : d.score
 const lineSupervisor = activeLine === 'l6' ? line6Data.supervisor : 'D. Kowalski'
 const scoreColor = lineScore >= 75 ? 'text-danger' : lineScore >= 60 ? 'text-warn' : 'text-ok'

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <ActionBanner
 color="#D94F2A"
 headline={`3 interventions pending · Line 4 · ${countdownFmt} remaining`}
 body={escalatedShift
 ? 'Director notified — escalation logged. Act on findings before the window closes.'
 : 'Risk score 78 — above intervention threshold. Two actionable findings. Act before the window closes.'}
 >
 <Btn variant="ghost" onClick={() => { setCol1Tab('tasks'); setShowNearMiss(true) }}>
 + Near miss
 </Btn>
 <Btn variant="ghost" onClick={() => setEscalatedShift(true)}>
 {escalatedShift ? 'Escalated ✓' : 'Escalate to director'}
 </Btn>
 </ActionBanner>

 {/* Line switcher */}
 {(() => {
  const al = d.lines.find(l => l.id === activeLine)
  const sc = al.score >= 75 ? 'text-danger' : al.score >= 60 ? 'text-warn' : 'text-ok'
  const zone = al.score >= 75 ? 'AT RISK' : al.score >= 60 ? 'WATCH' : 'CLEAR'
  return (
   <>
   <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 bg-stone2 flex-shrink-0">
    <button
     ref={lineTriggerRef}
     type="button"
     onClick={() => setLineDropOpen(o => !o)}
     className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
    >
     <span className="font-body font-medium text-ink text-[13px]">{al.name}</span>
     <span className={`font-body font-medium uppercase tracking-widest text-[10px] ${sc}`}>{zone}</span>
     <span className={`display-num text-xl leading-none ${sc}`}>{al.score}</span>
     {d.confidence < d.rawConfidence && activeLine === 'l4' && (
      <span className="font-body text-warn text-[9px]">adj.</span>
     )}
     <ChevronDown size={12} className={`text-ghost transition-transform duration-200 ${lineDropOpen ? 'rotate-180' : ''}`} />
    </button>
    <span className="font-body text-ghost/50 text-[11px]">·</span>
    <span className="font-body text-ghost text-[11px]">{lineSupervisor} · {al.supervisor} shift</span>
   </div>
   {lineDropOpen && (
    <LineDropdown
     lines={d.lines}
     activeLine={activeLine}
     onSelect={setActiveLine}
     triggerRef={lineTriggerRef}
     onClose={() => setLineDropOpen(false)}
    />
   )}
   </>
  )
 })()}

 {/* Stat bar */}
 <div className="grid grid-cols-4 border-b border-rule2 bg-stone flex-shrink-0">
 {lineD.stats.map((s, i) => <StatCell key={i} {...s} />)}
 </div>

 {/* Risk trend strip */}
 <div className="flex items-center gap-4 px-5 py-2.5 border-b border-rule2 bg-stone flex-shrink-0">
  <div className="flex-1 min-w-[80px]">
  <WaveformSparkline data={lineD.sparkline} color={lineScore >= 75 ? '#D94F2A' : d.score >= 60 ? '#C4920A' : '#3A8A5A'} height={24} />
  </div>
  <div className="flex-shrink-0 text-right">
  <div className="font-body text-ghost text-[10px]">Rising · 06:12–06:42</div>
  {d.confidence < d.rawConfidence && (
   <div className="font-body text-warn text-[10px] mt-0.5">Confidence {d.confidence}% · Oven B SCADA stale 3d</div>
  )}
  </div>
 </div>


 {/* 3-column layout */}
 <div className="flex flex-1 min-h-0 overflow-hidden">

 {/* Pre-shift safety briefing modal */}
 {!briefingAcknowledged && (
 <Modal>
  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-rule2">
  <div className="font-body font-medium text-ink text-[13px]">Pre-shift safety briefing</div>
  <span className="font-body text-ghost text-[10px]">Acknowledge before proceeding</span>
  </div>
  <div className="overflow-y-auto flex-1">
  {[
   { icon: haccpData.allergenChangeover.required ? 'alert' : 'check', color: haccpData.allergenChangeover.required ? 'text-danger' : 'text-ok',
   text: `Allergen changeover required: ${haccpData.allergenChangeover.from} → ${haccpData.allergenChangeover.to}. Full flush before start.` },
   { icon: 'flag', color: 'text-warn', text: 'HACCP CCP-3 active — Oven B minimum 185°F for GF-Flatbread. Log any deviation immediately.' },
   { icon: 'rotate', color: 'text-warn', text: 'Carry-forward: Sensor A-7 variance at count 4. Escalate at 5.' },
   { icon: 'alert', color: 'text-warn', text: 'Cert gap: Reyes (L1) assigned to Sauce Dosing (L2 required). Reassign before production.' },
  ].map((item, i) => (
   <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule2">
   <span className={`${item.color} flex-shrink-0 mt-0.5`}>
   {item.icon === 'alert' && <AlertTriangle size={13} strokeWidth={2} />}
   {item.icon === 'check' && <Check size={13} strokeWidth={2} />}
   {item.icon === 'flag' && <Flag size={13} strokeWidth={2} />}
   {item.icon === 'rotate' && <RotateCcw size={13} strokeWidth={2} />}
   </span>
   <span className="font-body text-ink2 text-[12px] leading-relaxed">{item.text}</span>
   </div>
  ))}
  </div>
  <div className="px-4 py-3 border-t border-rule2 flex-shrink-0">
  <button type="button"
   onClick={() => setBriefingAcknowledged(true)}
   className="w-full font-body font-medium text-[11px] px-3 py-2.5 bg-brass text-stone hover:opacity-90 transition-opacity"
  >
   I've reviewed this shift's safety context — D. Kowalski · {new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
  </button>
  </div>
 </Modal>
 )}

 {/* COL 1: Findings */}
 <div className="flex-1 overflow-y-auto border-r border-rule2">
 <div className="border-b border-rule2 bg-stone2 sticky top-0 z-10">
  <div className="flex">
  {(() => {
   const remainingCount = CHECKLIST_ITEMS.filter(it => !checklistSigned[it.key]).length
   return [
    { id: 'orders', label: 'Orders' },
    { id: 'tasks', label: pendingTaskCount > 0 ? `Tasks \u00b7 ${pendingTaskCount}` : 'Tasks' },
    { id: 'checklist', label: remainingCount > 0 ? `Checklist \u00b7 ${remainingCount}` : 'Checklist' },
   ].map(tab => (
    <button key={tab.id} type="button"
    onClick={() => setCol1Tab(tab.id)}
    className={`px-4 py-2 font-body text-[10px] uppercase tracking-widest font-medium border-b-2 transition-colors cursor-pointer ${
     col1Tab === tab.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-ghost hover:text-muted'
    }`}>
    {tab.label}
    </button>
   ))
  })()}
  </div>
 </div>
 {hasLiveData ? (
 <>
 {col1Tab === 'orders' && (
 <>
 {/* Allergen changeover hard block — Line 4 only */}
 {activeLine === 'l4' && !allergenSigned && (
 <div className="border-b-2 border-b-danger bg-danger/[0.04] px-4 py-3">
 <div className="flex items-start gap-2 mb-3">
 <AlertTriangle size={16} strokeWidth={2} className="text-danger flex-shrink-0 mt-px" />
 <div>
 <div className="font-body font-medium text-danger text-[12px]">Allergen changeover log unsigned — production start blocked</div>
 <div className="font-body text-danger/80 text-[10px] mt-0.5">
 {haccpData.allergenChangeover.from} → {haccpData.allergenChangeover.to} requires a signed allergen changeover log before Line 4 can start. Sign via checklist or log an override reason.
 </div>
 </div>
 </div>
 {!overrideMode ? (
 <div className="flex gap-2">
 <button type="button"
 onClick={() => setChecklistSigned(p => ({ ...p, allergen: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }))}
 className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger text-white hover:opacity-90 transition-opacity"
 >
 Sign log now — Okonkwo
 </button>
 <button type="button"
 onClick={() => setOverrideMode(true)}
 className="font-body text-[11px] px-3 py-1.5 bg-stone2 text-muted hover:bg-stone3 transition-colors"
 >
 Override — log reason
 </button>
 </div>
 ) : (
 <div className="space-y-2 slide-in">
 <input
 type="text" placeholder="Override reason (required)…"
 value={overrideReason}
 onChange={e => setOverrideReason(e.target.value)}
 className="w-full font-body text-ink text-[11px] bg-stone border border-danger/30 px-2 py-1.5"
 autoFocus
 />
 <div className="flex gap-2">
 <button type="button"
 disabled={!overrideReason.trim()}
 onClick={() => { setAllergenOverride(overrideReason); setOverrideMode(false); logActivity({ actor:'D. Kowalski', action:`Allergen override: "${overrideReason}"`, item:'Allergen changeover log', type:'override' }) }}
 className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger/80 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
 >
 Confirm override — auto-CAPA created
 </button>
 <button type="button" onClick={() => setOverrideMode(false)} className="font-body text-[11px] px-2 py-1.5 text-ghost">Cancel</button>
 </div>
 </div>
 )}
 </div>
 )}
 {allergenOverride && (
 <div className="flex items-center gap-2 px-4 py-2 bg-warn/10 border-b border-warn/20 font-body text-warn text-[10px] slide-in">
 <Check size={12} strokeWidth={2} className="text-warn flex-shrink-0" />
 Override logged · CAPA auto-created · Director notified · Reason: "{allergenOverride}"
 </div>
 )}
 {activeLine === 'l4' && checklistSigned['allergen'] && (
 <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-b border-ok/20 font-body text-ok text-[10px] slide-in">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 Allergen changeover log signed — Okonkwo · {checklistSigned['allergen']} · Production start unblocked
 </div>
 )}

 <div className="flex items-baseline gap-3 px-4 py-2 border-b border-rule2">
 <Urg level="critical">3 pending · 27 min</Urg>
 </div>
 {d.findings.map(f => (
 <Finding key={f.id} f={f} onAct={(id) => {
  setActed(p => ({ ...p, [id]: true }))
  if (id === 'sf3') {
   setPredActioned(true)
   setMaintenanceTickets(p => [...p.filter(t => t.id !== 'MT-001'), { id:'MT-001', equipment:'Sensor A-7 · Conveyor Line 4', issue:'Micro-variance count 4/5 — bearing inspection before next shift', urgency:'warn', status:'open', requestedBy:'D. Kowalski', createdAt:'13:40' }])
  }
 }} />
 ))}
 </>
 )}

 {col1Tab === 'tasks' && (
 <>
 {/* Maintenance tickets */}
  {maintenanceTickets.length > 0 && (
  <>
   <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body uppercase tracking-widest text-ghost text-[10px] font-medium">Maintenance tickets</div>
   {maintenanceTickets.map((t, i) => (
   <div key={i} className="flex items-start gap-2 px-4 py-2.5 border-b border-rule2">
    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.urgency === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
    <div className="flex-1 min-w-0">
    <div className="font-body font-medium text-ink text-[11px] truncate">{t.equipment}</div>
    <div className="font-body text-ghost text-[10px]">{t.issue}</div>
    <div className="flex items-center gap-2 mt-1">
     <span className={`font-body font-medium text-[10px] px-1.5 py-px ${t.status === 'open' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>{t.status}</span>
     <span className="font-body text-ghost text-[10px]">{t.createdAt} · {t.requestedBy}</span>
    </div>
    </div>
    {t.status === 'open' && (
    <button type="button" onClick={() => setMaintenanceTickets(p => p.map((x,j) => j===i ? {...x, status:'closed'} : x))}
     className="font-body text-[10px] px-1.5 py-0.5 bg-stone3 text-muted hover:bg-ok/10 hover:text-ok transition-colors flex-shrink-0">Close</button>
    )}
   </div>
   ))}
  </>
  )}

 {/* Task assignment */}
 <div className="border-t border-rule2 px-4 py-3">
 <div className="flex items-center justify-between mb-2">
 <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Assigned tasks</span>
 <button type="button" onClick={() => setShowTaskForm(p => !p)} className="font-body text-ghost text-[10px] hover:text-muted transition-colors">+ Assign</button>
 </div>
 {Object.entries(taskAssignments).flatMap(([op, tasks]) => tasks.map((t,i) => (
 <div key={op+i} className={`flex items-center gap-2 py-1.5 border-b border-rule last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
 <button type="button" onClick={() => setTaskAssignments(p => ({...p, [op]: p[op].map((x,j) => j===i ? {...x, done:true} : x)}))}
 className={`w-3.5 h-3.5 flex-shrink-0 border ${t.done ? 'bg-ok border-ok' : 'border-rule2 hover:border-ok'} transition-colors`} />
 <div className="flex-1 min-w-0">
 <div className={`font-body text-[10px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
 <div className="font-body text-ghost text-[10px]">{op} · {t.dueTime}</div>
 </div>
 </div>
 )))}
 {showTaskForm && (
 <div className="mt-2 space-y-1.5 slide-in">
 <select value={taskForm.assignee} onChange={e => setTaskForm(p => ({...p, assignee: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer">
 <option value="">Assign to…</option>
 {['A. Martinez','C. Reyes','P. Okonkwo','F. Adeyemi','T. Osei'].map(n => <option key={n}>{n}</option>)}
 </select>
 <input placeholder="Task description" value={taskForm.label} onChange={e => setTaskForm(p => ({...p, label: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
 <input placeholder="Due time (e.g. 09:00)" value={taskForm.dueTime} onChange={e => setTaskForm(p => ({...p, dueTime: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
 <div className="flex gap-1.5">
 <button type="button" disabled={!taskForm.assignee || !taskForm.label}
 onClick={() => {
 const { assignee, label, dueTime } = taskForm
 setTaskAssignments(p => ({...p, [assignee]: [...(p[assignee]||[]), { label, dueTime, done: false, id: Date.now() }]}))
 setTaskForm({ assignee:'', label:'', dueTime:'' }); setShowTaskForm(false)
 }}
 className="font-body font-medium text-[10px] px-2.5 py-1 bg-ochre text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
 Assign task
 </button>
 <button type="button" onClick={() => setShowTaskForm(false)} className="font-body text-[10px] text-ghost px-2">Cancel</button>
 </div>
 </div>
 )}
 </div>

 {/* Near-miss reporting */}
 <div className="border-t border-rule2 px-4 py-3">
 {!showNearMiss && !nearMissSubmitted && (
 <button type="button" onClick={() => setShowNearMiss(true)} className="font-body text-ghost text-[11px] hover:text-muted transition-colors">
 + Log a near-miss
 </button>
 )}
 {showNearMiss && !nearMissSubmitted && (
 <div className="slide-in space-y-2">
 <div className="font-body text-ghost text-[10px] uppercase tracking-widest">Near-miss report</div>
 <select value={nearMissForm.station} onChange={e => setNearMissForm(p => ({...p, station: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer">
 <option value="">Station…</option>
 <option>Sauce Dosing</option>
 <option>Oven Station B</option>
 <option>Pack Line</option>
 <option>Topping Line</option>
 </select>
 <textarea placeholder="What happened?" value={nearMissForm.what} onChange={e => setNearMissForm(p => ({...p, what: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1 h-16 resize-none" />
 <input placeholder="Corrective step taken" value={nearMissForm.action} onChange={e => setNearMissForm(p => ({...p, action: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
 <label className="flex items-center gap-2 font-body text-muted text-[11px] cursor-pointer">
 <input type="checkbox" checked={nearMissForm.atRisk} onChange={e => setNearMissForm(p => ({...p, atRisk: e.target.checked}))} />
 Anyone at risk of injury?
 </label>
 <div className="flex gap-2">
 <button type="button"
 disabled={!nearMissForm.station || !nearMissForm.what}
 onClick={() => {
 setNearMisses(p => [...p, { ...nearMissForm, time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
 setNearMissSubmitted(true); setShowNearMiss(false)
 }}
 className="font-body font-medium text-[11px] px-3 py-1.5 bg-warn/10 text-warn disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warn/20 transition-colors"
 >
 Submit — auto-CAPA created
 </button>
 <button type="button" onClick={() => setShowNearMiss(false)} className="font-body text-[11px] px-2 py-1 text-ghost">Cancel</button>
 </div>
 </div>
 )}
 {nearMissSubmitted && (
 <div className="font-body text-ok text-[11px] slide-in">Near-miss logged · CAPA created · Assigned to Kowalski for review</div>
 )}
 </div>
 </>
 )}
 {col1Tab === 'checklist' && (
 <div>

  {CHECKLIST_ITEMS.map(item => {
  const signed = checklistSigned[item.key]
  const flag = flaggedItems[item.key]
  const empResult = empSessionResults[item.key]
  const showEmpForm = item.key === 'emp' && signed && !empResult
  const showFlagForm = flagForm[item.key]
  return (
   <div key={item.key} className={`border-l-2 border-b border-rule2 ${
    signed ? 'border-l-ok bg-stone' : item.isAllergen && !allergenSigned ? 'border-l-danger bg-danger/[0.03]' : flag ? 'border-l-warn bg-warn/[0.02]' : 'border-l-rule2 bg-stone'
   }`}>
   <div className="px-4 py-3">
    <div className="flex items-start justify-between gap-2 mb-1.5">
    <p className={`font-body font-medium text-[13px] leading-snug ${signed ? 'line-through text-ghost' : item.isAllergen && !allergenSigned ? 'text-danger' : 'text-ink'}`}>
     {item.label}
     {item.isAllergen && !allergenSigned && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium"><AlertTriangle size={9} strokeWidth={2.5} /> BLOCKING</span>}
     {flag && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-warn font-medium"><Flag size={9} strokeWidth={2.5} /> flagged</span>}
    </p>
    {signed && !empResult && item.key !== 'emp' && <span className="font-body text-ok text-[10px] flex items-center gap-0.5 flex-shrink-0"><Check size={10} strokeWidth={2.5} /> {signed}</span>}
    {signed && item.key === 'emp' && empResult && <span className="font-body text-ok text-[10px] flex items-center gap-0.5 flex-shrink-0"><Check size={10} strokeWidth={2.5} /> {empResult.result === 'negative' ? 'Neg' : 'Pos'} · {signed}</span>}
    {flag && !signed && <span className="font-body text-warn text-[10px] flex items-center gap-0.5 flex-shrink-0"><Flag size={9} strokeWidth={2.5} /> {flag.reason}</span>}
    </div>
    <p className="font-body text-ghost text-[11px] mb-2">{item.operator}</p>
    {!signed && !flag && (
    <div className="flex gap-2">
     <button type="button"
     onClick={() => setChecklistSigned(p => ({...p, [item.key]: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}))}
     className={`font-body font-medium text-[10px] px-2.5 py-1 ${item.isAllergen ? 'bg-danger text-white hover:opacity-90' : 'bg-ink text-stone hover:bg-ink2'} transition-colors`}
     >Sign</button>
     <button type="button"
     onClick={() => setFlagForm(p => ({...p, [item.key]: { reason:'', note:'' }}))}
     className="font-body text-[10px] px-2 py-1 border border-rule2 text-muted hover:border-ghost transition-colors"
     >Flag</button>
    </div>
    )}
   </div>
   {showEmpForm && (
    <div className="pb-2 px-1 space-y-1.5 slide-in">
    <div className="font-body text-ghost text-[10px] uppercase tracking-widest">Swab result required</div>
    <div className="flex gap-2">
     {['negative','positive'].map(r => (
     <button type="button" key={r} onClick={() => setEmpForm(p => ({...p, [item.key]: {...p[item.key], result: r}}))}
      className={`font-body font-medium text-[10px] px-2 py-1 transition-colors ${empForm[item.key]?.result === r ? (r === 'negative' ? 'bg-ok text-white' : 'bg-danger text-white') : 'bg-stone3 text-muted'}`}>
      {r.charAt(0).toUpperCase() + r.slice(1)}
     </button>
     ))}
     {empForm[item.key]?.result === 'positive' && (
     <input placeholder="CFU count" type="number"
      value={empForm[item.key]?.cfu || ''}
      onChange={e => setEmpForm(p => ({...p, [item.key]: {...p[item.key], cfu: e.target.value}}))}
      className="w-20 font-body text-ink text-[10px] bg-stone border border-rule px-2 py-0.5" />
     )}
    </div>
    {empForm[item.key]?.result && (
     <button type="button"
     onClick={() => {
      const r = empForm[item.key]
      setEmpSessionResults(p => ({...p, [item.key]: { result: r.result, cfu: r.cfu, time: checklistSigned[item.key] }}))
      if (r.result === 'positive') setMaintenanceTickets(p => [...p, { id:`MT-EMP-${Date.now()}`, equipment:'Zone 1 — Sauce Dosing', issue:`Positive EMP swab${r.cfu ? ` · ${r.cfu} CFU` : ''} — deep clean required before next production run`, urgency:'danger', status:'open', requestedBy:'T. Osei', createdAt: checklistSigned[item.key] }])
     }}
     className="font-body font-medium text-[10px] px-2.5 py-1 bg-ok text-white hover:opacity-90 transition-opacity"
     >Log result {empForm[item.key]?.result === 'positive' ? '— auto-CAPA created' : ''}</button>
    )}
    </div>
   )}
   {showFlagForm && !flag && (
    <div className="pb-2 px-1 space-y-1.5 slide-in">
    <select value={flagForm[item.key]?.reason || ''} onChange={e => setFlagForm(p => ({...p, [item.key]: {...p[item.key], reason: e.target.value}}))}
     className="w-full font-body text-ink text-[10px] bg-stone border border-rule px-2 py-1 cursor-pointer">
     <option value="">Reason for flag…</option>
     <option>Equipment malfunction</option>
     <option>Kit or supplies missing</option>
     <option>Unsafe condition</option>
     <option>Other</option>
    </select>
    <div className="flex gap-1.5">
     <button type="button" disabled={!flagForm[item.key]?.reason}
     onClick={() => {
      const f = flagForm[item.key]
      setFlaggedItems(p => ({...p, [item.key]: f}))
      if (f.reason === 'Equipment malfunction') setMaintenanceTickets(p => [...p, { id:`MT-${Date.now()}`, equipment: item.label, issue: f.reason, urgency:'warn', status:'open', requestedBy: item.operator, createdAt: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
      setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })
     }}
     className="font-body font-medium text-[10px] px-2.5 py-1 bg-warn text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
     Flag item
     </button>
     <button type="button" onClick={() => setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })} className="font-body text-[10px] text-ghost px-2">Cancel</button>
    </div>
    </div>
   )}
   </div>
  )
  })}
 </div>
 )}
 </>
 ) : (
 <EmptyLine name={activeLined.name} />
 )}
 </div>

 {/* COL 2: Crew + Startup */}
 <div className="w-[240px] flex-shrink-0 overflow-y-auto border-r border-rule2 bg-stone2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 sticky top-0 z-10 font-body uppercase tracking-widest text-ghost text-[10px] font-medium">
 {activeLined.name} context
 </div>
 {hasLiveData ? (
 <>
 {/* Crew */}
 <div className="border-b border-rule2">
 <div className="px-4 pt-3 pb-2">
  <div className="flex justify-between items-baseline mb-3">
   <span className="font-body font-medium text-ink text-[12px]">Crew</span>
   <span className="font-body text-ghost text-[10px]">18 workers</span>
  </div>
  <CrewAvatarStack crew={lineD.crew} onSelect={setViewingOperator} />
 </div>
 {lineD.crew.map((m, i) => {
 const haccp = HACCP_BY_STATION[m.role]
 return (
 <div key={i}>
 <CrewRow m={m} onView={() => setViewingOperator(m.name)} />
 {haccp && (
 <div className="px-4 pb-2 font-body text-ghost text-[10px] leading-relaxed border-b border-rule last:border-b-0">
 {haccp.station} · {haccp.ccp}: {haccp.limit}
 </div>
 )}
 </div>
 )
 })}
 </div>
 </>
 ) : (
 <EmptyLine name={activeLined.name} />
 )}
 </div>
 </div>

 {viewingOperator && (
  <OperatorPanel name={viewingOperator} onClose={() => setViewingOperator(null)} />
 )}
 )}
 </div>
 )
}
