import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFocusTrap, useExitAnimation, riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import { shiftData, line6Data, haccpData, productionRate, crewHoursData } from '../data'
import {
 Urg, StatCell, SecHd, CaseCard, Layout,
 Btn, ConsequenceNotice, PageHead, ActionBanner, MetricCard, ScoreRing,
 PersonAvatar, Modal, WaveformSparkline, Chip, AnimatedCheck, Spinner,
 VaulDrawer, HoldButton
} from '../components/UI'
import { Flag, ChevronRight, ChevronDown, AlertTriangle, Check, X, TrendingDown, RotateCcw, Wrench, Package, HelpCircle, ListChecks, Brain, Shield, RefreshCw, ChevronUp } from 'lucide-react'
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

const FLAG_REASONS = [
 { value: 'Equipment malfunction', label: 'Equipment', Icon: Wrench },
 { value: 'Kit or supplies missing', label: 'Missing kit', Icon: Package },
 { value: 'Unsafe condition', label: 'Unsafe', Icon: AlertTriangle },
 { value: 'Other', label: 'Other', Icon: HelpCircle },
]


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
 return (
  <span
   className={`display-num text-3xl ${riskColorClass(score)}`}
   aria-label={`Risk score ${score} — ${riskLabel(score)}`}
  >{score}</span>
 )
}

function AgentTimeline({ timeline, sparkline, score }) {
 const scoreColor = riskBgColor(score)
 const scoreTextColor = riskColorClass(score)
 const zone = riskLabel(score)
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
 <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule2 last:border-b-0">
 <div className="font-body text-ghost text-[10px] w-11 flex-shrink-0 mt-0.5">{row.time}</div>
 <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
 row.level === 'now' ? 'bg-ochre' : row.level === 'warn' ? 'bg-warn' : row.level === 'ok' ? 'bg-ok' : 'bg-rule'
 }`} />
 <div className="flex-1">
 <p className="font-body text-ink2 text-[11px] leading-relaxed">
 {row.event.split(/\*\*(.*?)\*\*/g).map((part, i) =>
  i % 2 === 1 ? <strong key={i} className="text-ink font-medium">{part}</strong> : part
 )}
 </p>
 {row.delta && <div className={`display-num text-[11px] mt-0.5 ${row.deltaColor}`}>{row.delta}</div>}
 </div>
 </div>
 ))}
 </div>
 )
}

const TONE_HEX = { danger: '#D94F2A', warn: '#C4920A', ok: '#3A8A5A' }
function SignalCard({ sig }) {
 const c = TONE_HEX[sig.tone] ?? '#3A8A5A'
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

function OperatorPanel({ name, onClose, onSelectOperator }) {
 const { taskAssignments, trainingPlans, trainingCompletions, flaggedItems } = useAppState()
 const meta = OP_META[name] || { initials: name.split(' ').map(n => n[0]).join(''), station: '—', certPct: 0, certLabel: '—' }
 const safety = OP_SAFETY[name]
 const myTasks = taskAssignments[name] || []
 const plan = trainingPlans[name]
 const completion = trainingCompletions[name]
 const myFlags = Object.entries(flaggedItems).filter(([, f]) => f).map(([key, f]) => ({ key, ...f }))
 const certC = meta.certPct >= 80 ? '#3A8A5A' : '#C4920A'
 const panelRef = useRef(null)
 const { exiting, exit } = useExitAnimation(200)
 useFocusTrap(panelRef)

 const handleClose = () => exit(onClose)

 useEffect(() => {
 const handler = (e) => { if (e.key === 'Escape') handleClose() }
 document.addEventListener('keydown', handler)
 return () => document.removeEventListener('keydown', handler)
 }, [])

 return (
 <>
 <div className="fixed inset-0 z-40 bg-ink/20" onClick={handleClose} />
 <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`Operator profile — ${name}`} className={`fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-stone border-l border-rule2 flex flex-col overflow-hidden ${exiting ? 'slide-right-out' : 'slide-right'}`}>
 <div className="flex items-center gap-3 px-4 py-3 border-b border-rule2 bg-stone2 flex-shrink-0" style={{ borderTop:'3px solid #D94F2A' }}>
 <PersonAvatar name={name} size={32} />
 <div className="flex-1 min-w-0">
 <div className="font-body font-medium text-ink text-[13px]">{name}</div>
 <div className="font-body text-ghost text-[11px]">{meta.station}</div>
 </div>
 <button type="button" onClick={handleClose} aria-label="Close operator panel" className="text-ghost hover:text-ink transition-colors duration-100 ease-standard p-1 cursor-pointer">
 <X size={14} strokeWidth={2} aria-hidden="true" />
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
 {t.done && <AnimatedCheck size={10} color="white" />}
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
 <div style={{ height:'100%', width:`${meta.certPct}%`, background:certC, transition:'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }} />
 </div>
 <span className="display-num text-xl" style={{ color: certC }}>{meta.certPct}%</span>
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
 <div className={`flex items-center gap-1 pt-2 border-t border-rule2 font-body text-[11px] ${completion.outcome === 'Passed' ? 'text-ok' : 'text-warn'}`}>
 <Check size={12} strokeWidth={2} className="stroke-current flex-shrink-0" />
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
 </div>

 {/* Operator avatar tabs at bottom */}
 <div className="border-t border-rule2 bg-stone2 flex items-center justify-center gap-2 px-3 py-2.5 flex-shrink-0">
  {Object.keys(OP_META).map(opName => (
   <button
    key={opName}
    type="button"
    onClick={() => onSelectOperator?.(opName)}
    className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${name === opName ? 'border-ink bg-ink/10' : 'border-rule2 hover:border-ghost'}`}
    title={opName}
    aria-label={`View ${opName}'s details`}>
    <PersonAvatar name={opName} size={24} />
   </button>
  ))}
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
 <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0 ${fatigue === 'danger' ? 'bg-danger/[0.02]' : ''}`}>
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
 const [dismissReason, setDismissReason] = useState('')
 const [showed, setShowed] = useState(false)

 const handleAct = (action) => {
 onAct(f.id)
 setAcked('actioning')
 setShowed(true)
 }

 const borderColor = f.urgency === 'danger' ? 'border-l-danger' : f.urgency === 'warn' ? 'border-l-warn' : 'border-l-rule'

 return (
 <>
 <div className={`border-l-2 ${borderColor} border-b border-rule2 ${dismissed ? 'opacity-50' : ''}`}>
 <div className="p-4 space-y-2">
 <p className="font-body text-ink font-medium text-[13px] leading-snug">{f.title}</p>
 <p className="font-body text-ink2 text-[12px] leading-relaxed">{f.desc}</p>
 <p className="font-body text-ghost text-[11px] flex items-start gap-1"><ChevronRight size={11} className="flex-shrink-0 mt-px" />{f.evidence}</p>
 {f.source && (
  <div className="flex gap-1.5">
   <Chip tone="muted">{f.source}</Chip>
  </div>
 )}
 <div className="flex gap-2 pt-1 relative">
 {f.actions.map((a, i) => (
 <Btn key={i} variant={i === 0 ? 'primary' : 'secondary'} onClick={() => handleAct(a)}>
 {a}
 </Btn>
 ))}
 <Btn variant="secondary" onClick={() => setShowDismiss(!showDismiss)}>Dismiss</Btn>
 {showDismiss && !dismissed && (
  <div className="absolute top-full left-0 mt-1 bg-stone border border-rule2 rounded-md px-2 py-1 shadow-md z-10">
   <button type="button" onClick={() => setShowDismiss(false)} 
    className="flex items-center justify-center w-6 h-6 rounded hover:bg-stone2 transition-colors mb-1"
    aria-label="Close dismiss selector">
    <X size={14} strokeWidth={2} className="text-ink" />
   </button>
   {[
    'Already handled by outgoing supervisor',
    'Not applicable — SKU change in progress', 
    'Assessment is incorrect — false positive'
   ].map(reason => (
    <button
     key={reason}
     type="button"
     onClick={() => {
      setDismissed(true)
      setShowDismiss(false)
     }}
     className="block w-full text-left font-body text-ink text-[11px] px-2 py-1 hover:bg-stone2 transition-colors rounded"
     aria-label={`Dismiss: ${reason}`}>
     {reason}
    </button>
   ))}
  </div>
 )}
 </div>
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
 </>
 )
}


// ── CrewAvatarStack ────────────────────────────────────────────────────────────

function CrewAvatarStack({ crew, onSelect, size = 34 }) {
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
      <PersonAvatar name={m.name} size={size} />
     </div>
    </button>
   ))}
   {extra > 0 && (
    <div className="-ml-2 rounded-full border-2 border-stone2 bg-stone3 flex items-center justify-center" style={{ width: size, height: size }}>
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
 useFocusTrap(dropRef)

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
  <div ref={dropRef} className="fixed z-[40] plant-drop-in" style={{ top: pos.top, left: pos.left }}>
   <div className="w-[260px] bg-sidebar border border-sidebar-border rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden">
    <div className="plant-drop-in-content">
     <div className="px-4 py-2.5 border-b border-sidebar-border">
      <p className="font-body text-sidebar-ghost/40 text-[10px] uppercase tracking-widest">Select line</p>
     </div>
     {lines.map(line => {
      const sc = riskColorClass(line.score)
      const zoneLabel = riskLabel(line.score)
      const isActive = line.id === activeLine
      return (
       <button key={line.id} type="button"
        aria-pressed={isActive}
        onClick={() => { onSelect(line.id); onClose() }}
        className="flex items-center justify-between w-full px-4 py-3 border-b border-sidebar-border last:border-b-0 hover:bg-sidebar-3 transition-colors group"
       >
        <div className="text-left">
         <div className={`font-body text-[12px] font-medium transition-colors ${isActive ? 'text-stone' : 'text-sidebar-ghost group-hover:text-stone/80'}`}>{line.name}</div>
         <div className="font-body text-sidebar-ghost/50 text-[10px] mt-0.5">{line.supervisor} shift</div>
        </div>
        <div className="flex items-center gap-2">
         <span className={`font-body text-[10px] uppercase tracking-widest ${sc}`}>{zoneLabel}</span>
         <span className={`display-num text-xl ${sc}`} aria-label={`Risk score ${line.score}`}>{line.score}</span>
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
 const [searchParams] = useSearchParams()
 const initialLine = searchParams.get('line') || 'l4'
 const [activeLine, setActiveLine] = useState(initialLine)
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
 currentPlant,
 pilotExpanded, setPilotExpanded,
 } = useAppState()
 const [predActioned, setPredActioned] = useState(false)
 const [overrideMode, setOverrideMode] = useState(false)
 const [overrideReason, setOverrideReason] = useState('')
 const [overrideShake, setOverrideShake] = useState(false)
 const [showNearMiss, setShowNearMiss] = useState(false)
 const [nearMissForm, setNearMissForm] = useState({ station:'', what:'', action:'', atRisk: false })
 const [nearMissSubmitted, setNearMissSubmitted] = useState(false)
 const [empForm, setEmpForm] = useState({})
 const [flagForm, setFlagForm] = useState({})
 const [showTaskForm, setShowTaskForm] = useState(false)
 const [taskForm, setTaskForm] = useState({ assignee:'', label:'', dueTime:'' })
 const [viewingOperator, setViewingOperator] = useState(null)
 const [lineDropOpen, setLineDropOpen] = useState(false)
 const [checklistDrawerOpen, setChecklistDrawerOpen] = useState(false)
 const [showExpansionGate, setShowExpansionGate] = useState(false)
 const [expansionStep, setExpansionStep] = useState(0)
 const [dataOwner, setDataOwner] = useState('')
 const [directorAck, setDirectorAck] = useState(false)
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
 const scoreColor = riskColorClass(lineScore)

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <ActionBanner
 tone="warn"
 headline={`3 interventions pending · ${currentPlant?.name || 'Salina Campus'} · Line 4 · ${countdownFmt} remaining`}
 body={escalatedShift
 ? 'Director notified — escalation logged. Act on findings before the window closes.'
 : 'Risk score 78 — above intervention threshold. Two actionable findings. Act before the window closes.'}
 >
 <Btn variant="secondary" onClick={() => { setCol1Tab('tasks'); setShowNearMiss(true) }}>
 + Near miss
 </Btn>
 <Btn variant="secondary" onClick={() => {
 if (!escalatedShift) {
  setEscalatedShift(true)
  logActivity({ actor:'D. Kowalski', action:'Escalated shift risk to director', item:'Line 4 · Risk score 78 · 3 interventions pending', type:'escalation' })
 }
 }}>
 {escalatedShift ? 'Escalated ✓' : 'Escalate to director'}
 </Btn>
 </ActionBanner>

 {/* Line switcher */}
 {(() => {
  const al = d.lines.find(l => l.id === activeLine)
  const sc = riskColorClass(al.score)
  const zone = riskLabel(al.score)
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
     <span className={`display-num text-xl leading-none ${sc}`} aria-label={`Risk score ${al.score} — ${zone}`}>{al.score}</span>
     {d.confidence < d.rawConfidence && activeLine === 'l4' && (
      <span className="font-body text-warn text-[10px]">adj.</span>
     )}
     <ChevronDown size={12} className={`text-ghost transition-transform duration-200 ${lineDropOpen ? 'rotate-180' : ''}`} />
    </button>
    <span className="font-body text-ghost/50 text-[11px]">·</span>
    <span className="font-body text-ghost text-[11px]">{lineSupervisor} · {al.supervisor} shift</span>
    <div className="ml-auto flex items-center gap-2">
     <CrewAvatarStack crew={lineD.crew} onSelect={setViewingOperator} size={22} />
     <span className="font-body text-ghost text-[10px]">18 workers</span>
    </div>
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
 <div className="grid grid-cols-2 md:grid-cols-4 border-b border-rule2 bg-stone flex-shrink-0">
 {lineD.stats.map((s, i) => <StatCell key={i} {...s} />)}
 </div>

 {/* 3-column layout */}
 <div className="flex flex-1 min-h-0 overflow-hidden">

 {/* Pre-shift safety briefing modal */}
 {!briefingAcknowledged && (
 <Modal title="Pre-shift safety briefing">
  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-rule2">
  <div className="font-body font-medium text-ink text-[13px]" id="modal-title">Pre-shift safety briefing</div>
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
  <div className="border-t border-rule2 flex-shrink-0">
  <HoldButton
   label={`Hold to confirm — I've reviewed this briefing`}
   holdLabel="Keep holding to confirm…"
   doneLabel={`Confirmed — D. Kowalski · ${new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}`}
   duration={2000}
   tone="ok"
   onConfirm={() => setBriefingAcknowledged(true)}
  />
  </div>
 </Modal>
 )}

 {/* COL 1: Findings */}
 <div className="flex-1 overflow-y-auto border-r border-rule2">
 <div className="border-b border-rule2 bg-stone2 sticky top-0 z-10">
  <div className="flex">
  {[
   { id: 'orders', label: 'Orders' },
   { id: 'tasks', label: pendingTaskCount > 0 ? `Tasks \u00b7 ${pendingTaskCount}` : 'Tasks' },
  ].map(tab => (
   <button key={tab.id} type="button"
   onClick={() => setCol1Tab(tab.id)}
   className={`px-4 py-2 font-body text-[10px] uppercase tracking-widest font-medium border-b-2 transition-colors cursor-pointer ${
    col1Tab === tab.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-ghost hover:text-muted'
   }`}>
   {tab.label}
   </button>
  ))}
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
 <Btn variant="primary" onClick={() => setChecklistSigned(p => ({ ...p, allergen: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }))}>Sign log now — Okonkwo</Btn>
 <Btn variant="secondary" onClick={() => setOverrideMode(true)}>Override — log reason</Btn>
 </div>
 ) : (
 <div className="space-y-2 slide-in">
 <input
 type="text" placeholder="Override reason (required)…"
 value={overrideReason}
 onChange={e => { setOverrideReason(e.target.value); setOverrideShake(false) }}
 className={`w-full font-body text-ink text-[11px] bg-stone border border-danger/30 px-2 py-1.5 ${overrideShake ? 'shake-error' : ''}`}
 autoFocus
 />
 <div className="flex gap-2">
 <Btn variant="primary" disabled={!overrideReason.trim()} onClick={() => {
 if (!overrideReason.trim()) { setOverrideShake(true); return }
 setAllergenOverride(overrideReason); setOverrideMode(false); logActivity({ actor:'D. Kowalski', action:`Allergen override: "${overrideReason}"`, item:'Allergen changeover log', type:'override' })
 }}>Confirm override — auto-CAPA created</Btn>
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
 <AnimatedCheck size={12} color="#3A8A5A" className="flex-shrink-0" />
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
 <div key={op+i} className={`flex items-center gap-2 py-1.5 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
 <button type="button" onClick={() => setTaskAssignments(p => ({...p, [op]: p[op].map((x,j) => j===i ? {...x, done:true} : x)}))}
 className={`w-3.5 h-3.5 flex-shrink-0 border ${t.done ? 'bg-ok border-ok' : 'border-rule2 hover:border-ok'} transition-colors`} />
 <div className="flex-1 min-w-0">
 <div className={`font-body text-[10px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
 <div className="font-body text-ghost text-[10px]">{op} · {t.dueTime}</div>
 </div>
 </div>
 )))}
 {showTaskForm && (
  <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
   <div className="bg-stone border border-rule2 rounded-lg shadow-lg max-w-sm w-full">
    <div className="px-4 py-3 border-b border-rule2">
     <div className="font-body font-medium text-ink text-[13px]">Assign task</div>
    </div>
    <div className="p-4 space-y-4">
     <div>
      <div className="font-body text-ghost text-[10px] mb-2">Assign to</div>
      <div className="grid grid-cols-3 gap-2">
       {[
        { name: 'A. Martinez', avatar: 'A. Martinez' },
        { name: 'C. Reyes', avatar: 'C. Reyes' },
        { name: 'P. Okonkwo', avatar: 'P. Okonkwo' },
        { name: 'F. Adeyemi', avatar: 'F. Adeyemi' },
        { name: 'T. Osei', avatar: 'T. Osei' }
       ].map(person => (
        <button
         key={person.name}
         type="button"
         onClick={() => setTaskForm(p => ({...p, assignee: person.name}))}
         className={`flex flex-col items-center gap-1 p-2 rounded border transition-colors ${
          taskForm.assignee === person.name ? 'border-ok bg-ok/5' : 'border-rule2 hover:border-muted'
         }`}>
         <PersonAvatar name={person.avatar} size={32} />
         <span className="font-body text-[10px] text-ink truncate w-full text-center">{person.name.split(' ')[0]}</span>
        </button>
       ))}
      </div>
     </div>
     <div>
      <div className="font-body text-ghost text-[10px] mb-2">Due time</div>
      <div className="grid grid-cols-2 gap-2">
       {[
        'Today',
        'Tomorrow',
        'Monday morning',
        'Pick date/time'
       ].map(time => (
        <button
         key={time}
         type="button"
         onClick={() => setTaskForm(p => ({...p, dueTime: time}))}
         className={`font-body text-[11px] px-3 py-2 rounded border transition-colors ${
          taskForm.dueTime === time ? 'border-ok bg-ok/5 text-ok' : 'border-rule2 bg-stone hover:border-muted text-ink'
         }`}>
         {time}
        </button>
       ))}
      </div>
     </div>
     <input aria-label="Task description" placeholder="Task description" value={taskForm.label} onChange={e => setTaskForm(p => ({...p, label: e.target.value}))}
      className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-3 py-2 rounded" />
     <div className="flex gap-2">
      <Btn variant="primary" disabled={!taskForm.assignee || !taskForm.label || !taskForm.dueTime} onClick={() => {
       const { assignee, label, dueTime } = taskForm
       setTaskAssignments(p => ({...p, [assignee]: [...(p[assignee]||[]), { label, dueTime, done: false, id: Date.now() }]}))
       setTaskForm({ assignee:'', label:'', dueTime:'' }); setShowTaskForm(false)
      }}>Assign task</Btn>
      <button type="button" onClick={() => setShowTaskForm(false)} className="font-body text-[11px] text-ghost px-3 py-2">Cancel</button>
     </div>
    </div>
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
 <select aria-label="Station where near-miss occurred" value={nearMissForm.station} onChange={e => setNearMissForm(p => ({...p, station: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-2 py-1 cursor-pointer">
 <option value="">Station…</option>
 <option>Sauce Dosing</option>
 <option>Oven Station B</option>
 <option>Pack Line</option>
 <option>Topping Line</option>
 </select>
 <textarea aria-label="What happened" placeholder="What happened?" value={nearMissForm.what} onChange={e => setNearMissForm(p => ({...p, what: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-2 py-1 h-16 resize-none" />
 <input aria-label="Corrective step taken" placeholder="Corrective step taken" value={nearMissForm.action} onChange={e => setNearMissForm(p => ({...p, action: e.target.value}))}
 className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-2 py-1" />
 <label className="flex items-center gap-2 font-body text-muted text-[11px] cursor-pointer">
 <input type="checkbox" checked={nearMissForm.atRisk} onChange={e => setNearMissForm(p => ({...p, atRisk: e.target.checked}))} />
 Anyone at risk of injury?
 </label>
 <div className="flex gap-2">
 <Btn variant="primary" disabled={!nearMissForm.station || !nearMissForm.what} onClick={() => {
 const t = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
 setNearMisses(p => [...p, { ...nearMissForm, time: t }])
 logActivity({ actor:'D. Kowalski', action:`Near-miss reported — ${nearMissForm.station}`, item: nearMissForm.what, type:'near_miss' })
 setNearMissSubmitted(true); setShowNearMiss(false)
 }}>Submit — auto-CAPA created</Btn>
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
 {false && /* checklist moved to FAB drawer below */ (
 <div>

  {CHECKLIST_ITEMS.map(item => {
  const signed = checklistSigned[item.key]
  const flag = flaggedItems[item.key]
  const empResult = empSessionResults[item.key]
  const showEmpForm = item.key === 'emp' && signed && !empResult
  const showFlagForm = flagForm[item.key]
  return (
   <div key={item.key} className={`relative border-l-2 border-b border-rule2 overflow-hidden ${
    signed ? 'border-l-ok bg-stone' : item.isAllergen && !allergenSigned ? 'border-l-danger bg-danger/[0.03]' : flag ? 'border-l-warn bg-warn/[0.02]' : 'border-l-rule2 bg-stone'
   }`}>
   {signed && <span key={`flash-${item.key}`} className="flash-success" aria-hidden="true" />}
   <div className="px-4 py-3">
    <div className="flex items-start justify-between gap-2 mb-1.5">
    <p className={`font-body font-medium text-[13px] leading-snug ${signed ? 'line-through text-ghost' : item.isAllergen && !allergenSigned ? 'text-danger' : 'text-ink'}`}>
     {item.label}
     {item.isAllergen && !allergenSigned && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium"><AlertTriangle size={9} strokeWidth={2} /> BLOCKING</span>}
     {flag && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-warn font-medium"><Flag size={9} strokeWidth={2} /> flagged</span>}
    </p>
    {signed && !empResult && item.key !== 'emp' && <span className="font-body text-ok text-[10px] flex items-center gap-0.5 flex-shrink-0"><AnimatedCheck size={10} color="#3A8A5A" /> {signed}</span>}
    {signed && item.key === 'emp' && empResult && <span className="font-body text-ok text-[10px] flex items-center gap-0.5 flex-shrink-0"><AnimatedCheck size={10} color="#3A8A5A" /> {empResult.result === 'negative' ? 'Neg' : 'Pos'} · {signed}</span>}
    {flag && !signed && <span className="font-body text-warn text-[10px] flex items-center gap-0.5 flex-shrink-0"><Flag size={9} strokeWidth={2} /> {flag.reason}</span>}
    </div>
    <p className="font-body text-ghost text-[11px] mb-2">{item.operator}</p>
    {!signed && !flag && (
    <div className="flex gap-2">
     <Btn variant="primary" onClick={() => setChecklistSigned(p => ({...p, [item.key]: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}))}>Sign</Btn>
     <Btn variant="secondary" onClick={() => setFlagForm(p => ({...p, [item.key]: { reason:'', note:'' }}))}>Flag</Btn>
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
      className="w-20 font-body text-ink text-[10px] bg-stone border border-rule2 px-2 py-0.5" />
     )}
    </div>
    {empForm[item.key]?.result && (
     <Btn variant="primary" onClick={() => {
      const r = empForm[item.key]
      setEmpSessionResults(p => ({...p, [item.key]: { result: r.result, cfu: r.cfu, time: checklistSigned[item.key] }}))
      if (r.result === 'positive') setMaintenanceTickets(p => [...p, { id:`MT-EMP-${Date.now()}`, equipment:'Zone 1 — Sauce Dosing', issue:`Positive EMP swab${r.cfu ? ` · ${r.cfu} CFU` : ''} — deep clean required before next production run`, urgency:'danger', status:'open', requestedBy:'T. Osei', createdAt: checklistSigned[item.key] }])
     }}>Log result {empForm[item.key]?.result === 'positive' ? '— auto-CAPA created' : ''}</Btn>
    )}
    </div>
   )}
   {showFlagForm && !flag && (
    <div className="pb-2 px-1 space-y-1.5 slide-in">
    <select aria-label="Reason for flagging this item" value={flagForm[item.key]?.reason || ''} onChange={e => setFlagForm(p => ({...p, [item.key]: {...p[item.key], reason: e.target.value}}))}
     className="w-full font-body text-ink text-[10px] bg-stone border border-rule2 px-2 py-1 cursor-pointer">
     <option value="">Reason for flag…</option>
     <option>Equipment malfunction</option>
     <option>Kit or supplies missing</option>
     <option>Unsafe condition</option>
     <option>Other</option>
    </select>
    <div className="flex gap-1.5">
     <Btn variant="primary" disabled={!flagForm[item.key]?.reason} onClick={() => {
      const f = flagForm[item.key]
      setFlaggedItems(p => ({...p, [item.key]: f}))
      if (f.reason === 'Equipment malfunction') setMaintenanceTickets(p => [...p, { id:`MT-${Date.now()}`, equipment: item.label, issue: f.reason, urgency:'warn', status:'open', requestedBy: item.operator, createdAt: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
      setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })
     }}>Flag item</Btn>
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

 {/* Right rail — flex sibling of COL 1 */}
 <div className="hidden lg:flex flex-col w-[300px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">

  {/* Agent timeline */}
  {hasLiveData && <AgentTimeline timeline={lineD.agentTimeline} sparkline={lineD.sparkline} score={lineScore} />}

  {/* Signal health */}
  {hasLiveData && (
  <div className="border-t border-rule2">
   <div className="px-4 py-2.5 bg-stone2 border-b border-rule2">
   <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Signal health</span>
   </div>
   {lineD.signals.map((sig, i) => <SignalCard key={i} sig={sig} />)}
  </div>
  )}

  {/* Pilot validation */}
  {activeLine === 'l4' && (
  <div className="border-t border-rule2">
   <button type="button" onClick={() => setPilotExpanded(e => !e)}
   className="flex items-center justify-between w-full px-4 py-2.5 bg-stone2 border-b border-rule2 hover:bg-stone3 transition-colors">
    <div className="flex items-center gap-2">
     <Brain size={12} strokeWidth={1.75} className="text-muted" />
     <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Pilot validation</span>
    </div>
    <div className="flex items-center gap-2">
     <span className="display-num text-sm font-bold text-ok">{d.pilotAccuracy}%</span>
     {pilotExpanded ? <ChevronUp size={11} className="text-ghost" /> : <ChevronDown size={11} className="text-ghost" />}
    </div>
   </button>

   {pilotExpanded && (
   <div className="slide-in">
    <div className="px-4 py-3 border-b border-rule2">
     <div className="flex items-baseline gap-2 mb-3">
      <span className="display-num text-3xl font-bold text-ok">{d.pilotAccuracy}%</span>
      <span className="font-body text-ok text-[10px]">accuracy · 28 shifts</span>
     </div>
     <div className="mb-3">
      <div className="font-body text-ghost text-[10px] mb-1">14-day trend</div>
      <svg width="100%" height="28" viewBox="0 0 200 28" preserveAspectRatio="none" aria-label="14-day accuracy trend">
       <polyline points="0,22 15,20 30,18 45,19 60,17 75,14 90,15 105,12 120,10 135,11 150,9 165,8 180,7 200,6"
        fill="none" stroke="#3A8A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
       <circle cx="200" cy="6" r="2.5" fill="#3A8A5A" />
      </svg>
      <div className="flex justify-between font-body text-ghost text-[9px] mt-0.5">
       <span>Apr 2</span><span>Today</span>
      </div>
     </div>
     <div className="font-body text-ghost text-[10px] mb-1.5">Shift outcomes</div>
     <div className="flex gap-0.5 flex-wrap">
      {d.pilotLog.map((r, i) => (
       <div key={i} title={r === 'ok' ? 'Correct' : r === 'miss' ? 'Missed' : 'Partial'}
        className={`w-4 h-4 rounded-sm flex-shrink-0 ${r === 'ok' ? 'bg-ok' : r === 'miss' ? 'bg-danger' : 'bg-warn'}`} />
      ))}
     </div>
     <div className="flex gap-3 mt-1.5">
      {[['ok','Correct','bg-ok'],['part','Partial','bg-warn'],['miss','Missed','bg-danger']].map(([k,l,c]) => (
       <span key={k} className="flex items-center gap-1 font-body text-ghost text-[9px]">
        <span className={`w-2 h-2 rounded-sm ${c}`} />{l}
       </span>
      ))}
     </div>
    </div>
    <div className="px-4 py-3 border-b border-rule2 space-y-1.5">
     {d.pilotStats.map((s, i) => (
      <div key={i} className="flex items-center justify-between">
       <span className="font-body text-ghost text-[10px]">{s.label}</span>
       <span className={`font-body font-medium text-[11px] ${s.color}`}>{s.val}</span>
      </div>
     ))}
    </div>
    <div className="px-4 py-3 border-b border-rule2">
     <div className="font-body text-ghost text-[10px] mb-2">Model freshness</div>
     <div className="flex items-center gap-2 mb-1.5">
      <RefreshCw size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
      <span className="font-body text-ink2 text-[11px]">Last retrained Apr 2 · 14 shifts ago</span>
     </div>
     <div className="flex items-center gap-2">
      <Shield size={10} strokeWidth={2} className="text-ghost flex-shrink-0" />
      <span className="font-body text-ghost text-[10px]">Retraining recommended after 90 shifts</span>
     </div>
    </div>
    <div className="px-4 py-3">
     <div className="font-body text-ghost text-[10px] mb-2">Pilot scope</div>
     <div className="font-body text-ink2 text-[11px] mb-2.5 leading-snug">Line 4 only · 28 shifts validated</div>
     <button
      type="button"
      onClick={() => { if ((readinessScore ?? 64) >= 75 && d.pilotAccuracy >= 75) setShowExpansionGate(true) }}
      disabled={(readinessScore ?? 64) < 75 || d.pilotAccuracy < 75}
      className={`w-full font-body font-medium text-[11px] px-3 py-2 transition-colors ${
       (readinessScore ?? 64) >= 75 && d.pilotAccuracy >= 75
        ? 'bg-ink text-stone hover:bg-ink2'
        : 'bg-stone3 text-ghost cursor-not-allowed'
      }`}
     >
      {(readinessScore ?? 64) < 75 ? 'Data readiness too low to expand' : d.pilotAccuracy < 75 ? 'Accuracy below threshold' : 'Expand to all lines →'}
     </button>
     {((readinessScore ?? 64) < 75 || d.pilotAccuracy < 75) && (
      <div className="font-body text-ghost text-[9px] mt-1.5 leading-snug">
       Requires: readiness ≥ 75 · accuracy ≥ 75% on 30-shift window
      </div>
     )}
    </div>
   </div>
   )}
  </div>
  )}

  {/* Crew — shown when pilot panel is collapsed */}
  {!pilotExpanded && hasLiveData && (
  <div className="border-t border-rule2">
   <div className="px-4 py-2 bg-stone2 border-b border-rule2 font-body text-ghost text-[10px] uppercase tracking-widest">Crew</div>
   {lineD.crew.map((m, i) => <CrewRow key={i} m={m} onView={setViewingOperator} />)}
  </div>
  )}

 </div>

 </div>

 {viewingOperator && (
  <OperatorPanel
   name={viewingOperator}
   onClose={() => setViewingOperator(null)}
   onSelectOperator={setViewingOperator}
  />
 )}

 {/* Expansion gate modal */}
 {showExpansionGate && !pilotExpanded && (
  <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-6">
   <div className="bg-stone border border-rule2 w-full max-w-[480px] shadow-[0_24px_60px_rgba(16,15,13,0.3)]">
    <div className="px-5 py-4 border-b border-rule2 bg-stone2">
     <div className="font-body text-muted text-[10px] mb-1">Pilot expansion</div>
     <div className="font-display font-bold text-ink text-[16px]">Expand to all lines</div>
    </div>
    <div className="p-5 space-y-4">
     {expansionStep === 0 && (
     <div className="space-y-3">
      <p className="font-body text-ink2 text-[12px] leading-relaxed">
       Before expanding, confirm three things. New lines begin at lower confidence and will have a 10-shift calibration period.
      </p>
      <div className="space-y-2.5">
       {[
        { label: 'Line 4 accuracy', value: `${d.pilotAccuracy}%`, ok: d.pilotAccuracy >= 75, req: 'Required: ≥ 75%' },
        { label: 'Data readiness', value: `${readinessScore ?? 64}`, ok: (readinessScore ?? 64) >= 75, req: 'Required: ≥ 75' },
       ].map(({ label, value, ok, req }) => (
        <div key={label} className={`flex items-center gap-3 px-3 py-2.5 border ${ok ? 'border-ok/30 bg-ok/[0.04]' : 'border-danger/30 bg-danger/[0.04]'}`}>
         {ok ? <Check size={13} strokeWidth={2} className="text-ok flex-shrink-0" /> : <X size={13} strokeWidth={2} className="text-danger flex-shrink-0" />}
         <div className="flex-1">
          <div className="font-body text-ink text-[11px] font-medium">{label}</div>
          <div className="font-body text-ghost text-[10px]">{req}</div>
         </div>
         <span className={`display-num text-base font-bold ${ok ? 'text-ok' : 'text-danger'}`}>{value}</span>
        </div>
       ))}
      </div>
      <div className="flex gap-2 pt-1">
       <button type="button" onClick={() => setExpansionStep(1)}
        className="flex-1 font-body font-medium text-[12px] px-4 py-2.5 bg-ink text-stone hover:bg-ink2 transition-colors">
        Continue →
       </button>
       <button type="button" onClick={() => { setShowExpansionGate(false); setExpansionStep(0) }}
        className="font-body text-ghost text-[11px] px-4 py-2.5 hover:text-muted transition-colors">
        Cancel
       </button>
      </div>
     </div>
     )}
     {expansionStep === 1 && (
     <div className="space-y-3">
      <div>
       <label className="font-body text-ghost text-[10px] block mb-1.5">Named data owner for expansion <span className="text-danger">*</span></label>
       <input
        value={dataOwner}
        onChange={e => setDataOwner(e.target.value)}
        placeholder="e.g. T. Osei · Data & Quality Manager"
        className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-3 py-2 focus:border-ink outline-none"
       />
       <div className="font-body text-ghost text-[10px] mt-1">This person is accountable for data quality on new lines during calibration.</div>
      </div>
      <div className="flex items-start gap-2.5 px-3 py-2.5 bg-warn/[0.05] border border-warn/20">
       <AlertTriangle size={13} strokeWidth={2} className="text-warn flex-shrink-0 mt-px" />
       <p className="font-body text-ink2 text-[11px] leading-snug">
        New lines start at lower confidence. The first 10 shifts may surface higher false-positive rates while the model calibrates.
       </p>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
       <input type="checkbox" checked={directorAck} onChange={e => setDirectorAck(e.target.checked)}
        className="mt-0.5 flex-shrink-0" />
       <span className="font-body text-ink2 text-[11px] leading-snug">
        I understand new lines will have a lower confidence period and have reviewed data readiness for each line.
       </span>
      </label>
      <div className="flex gap-2 pt-1">
       <button type="button"
        disabled={!dataOwner.trim() || !directorAck}
        onClick={() => { setPilotExpanded(true); setShowExpansionGate(false); setExpansionStep(0); logActivity({ actor:'J. Crocker', action:'Expanded pilot to all lines', item:`Data owner: ${dataOwner}`, type:'system' }) }}
        className={`flex-1 font-body font-medium text-[12px] px-4 py-2.5 transition-colors ${
         dataOwner.trim() && directorAck ? 'bg-ok text-white hover:bg-ok/90' : 'bg-stone3 text-ghost cursor-not-allowed'
        }`}>
        Confirm expansion
       </button>
       <button type="button" onClick={() => setExpansionStep(0)} className="font-body text-ghost text-[11px] px-4 py-2.5 hover:text-muted transition-colors">← Back</button>
      </div>
     </div>
     )}
    </div>
   </div>
  </div>
 )}

 {/* ── Checklist FAB ──────────────────────────────────────────────────── */}
 {hasLiveData && (() => {
  const remaining = CHECKLIST_ITEMS.filter(it => !checklistSigned[it.key]).length
  return (
   <button
    type="button"
    onClick={() => setChecklistDrawerOpen(true)}
    aria-label={`Open shift checklist — ${remaining > 0 ? `${remaining} items remaining` : 'all signed'}`}
    className="fixed bottom-6 right-6 z-20 flex items-center gap-2 px-3.5 py-2.5 bg-ink text-stone font-body text-[11px] font-medium shadow-[0_4px_20px_rgba(16,15,13,0.25)] hover:bg-ink2 transition-colors duration-100 ease-standard"
   >
    {remaining > 0
     ? <><ListChecks size={14} /><span>Checklist</span><span className="w-4 h-4 flex items-center justify-center bg-warn text-white text-[10px] font-bold rounded-sm flex-shrink-0">{remaining}</span></>
     : <><ListChecks size={14} /><AnimatedCheck size={11} color="#3A8A5A" />Checklist</>
    }
   </button>
  )
 })()}

 {/* ── Checklist VaulDrawer ───────────────────────────────────────────── */}
 <VaulDrawer
  open={checklistDrawerOpen}
  onClose={() => setChecklistDrawerOpen(false)}
  title="Shift checklist"
  badge={(() => {
   const r = CHECKLIST_ITEMS.filter(it => !checklistSigned[it.key]).length
   return r > 0 ? <span className="font-body text-warn text-[10px] font-medium">{r} remaining</span> : <span className="font-body text-ok text-[10px]">All signed</span>
  })()}
  maxHeight="78vh"
  maxWidth="560px"
 >
  {CHECKLIST_ITEMS.map(item => {
   const signed = checklistSigned[item.key]
   const flag = flaggedItems[item.key]
   const empResult = empSessionResults[item.key]
   const showEmpForm = item.key === 'emp' && signed && !empResult
   const showFlagForm = flagForm[item.key]
   return (
    <div key={item.key} className={`relative border-b border-rule2 overflow-hidden transition-colors ${
     signed ? 'bg-stone' : item.isAllergen && !allergenSigned ? 'bg-danger/[0.03]' : flag ? 'bg-warn/[0.02]' : 'bg-stone'
    }`}>
    {signed && <span key={`flash-cl-${item.key}`} className="flash-success" aria-hidden="true" />}
    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
     <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-0.5">
       <p className={`font-body font-medium text-[13px] leading-snug ${signed ? 'line-through text-ghost' : item.isAllergen && !allergenSigned ? 'text-danger' : 'text-ink'}`}>
        {item.label}
        {item.isAllergen && !allergenSigned && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium"><AlertTriangle size={9} strokeWidth={2} /> BLOCKING</span>}
       </p>
      </div>
      <p className="font-body text-ghost text-[11px]">{item.operator}</p>
     </div>
     <div className="flex items-center gap-2 flex-shrink-0">
      {signed && !empResult && item.key !== 'emp' && <span className="font-body text-ok text-[9px] flex items-center gap-0.5"><AnimatedCheck size={10} color="#3A8A5A" />{signed}</span>}
      {signed && item.key === 'emp' && empResult && <span className="font-body text-ok text-[9px] flex items-center gap-0.5"><AnimatedCheck size={10} color="#3A8A5A" />{empResult.result === 'negative' ? 'Neg' : 'Pos'}</span>}
      {flag && !signed && <span className="font-body text-warn text-[9px] flex items-center gap-0.5"><Flag size={9} strokeWidth={2} />{flag.reason}</span>}
      {!signed && !flag && (
       <button type="button" onClick={() => setChecklistSigned(p => ({...p, [item.key]: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}))}
        className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-rule2 bg-stone3 hover:border-ghost transition-colors cursor-pointer flex-shrink-0"
        aria-label={`Mark ${item.label} complete`}>
        <Check size={18} strokeWidth={2} className="text-ink" />
       </button>
      )}
      {signed && (
       <div className="flex items-center justify-center w-12 h-12 rounded-full border border-ok/20 bg-ok/5 text-ok flex-shrink-0"
        aria-label={`Completed ${item.label}`}>
        <Check size={18} strokeWidth={2.5} className="text-ok" />
       </div>
      )}
      {!signed && flag && (
       <button type="button" onClick={() => setFlagForm(p => ({...p, [item.key]: { reason:'', note:'' }}))} 
        className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-warn bg-warn/[0.05] hover:bg-warn/[0.1] transition-colors cursor-pointer flex-shrink-0"
        aria-label={`Flag ${item.label}`}>
        <Flag size={18} strokeWidth={2} className="text-warn" />
       </button>
      )}
      {!signed && !flag && (
       <div className="relative">
        <button type="button" onClick={() => showFlagForm ? setFlagForm(p => { const n = {...p}; delete n[item.key]; return n }) : setFlagForm(p => ({...p, [item.key]: { reason:'', note:'' }}))} 
         className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-rule2 hover:border-ghost transition-colors cursor-pointer flex-shrink-0"
         aria-label={showFlagForm ? 'Close flag selector' : `Flag ${item.label}`}>
         {showFlagForm ? <X size={18} strokeWidth={2} className="text-ink" /> : <Flag size={18} strokeWidth={2} className="text-ghost" />}
        </button>
        {showFlagForm && (
         <div className="absolute top-0 right-0 flex items-center gap-1 bg-stone border border-rule2 rounded-md px-2 py-1 shadow-md z-10">
          <button type="button" onClick={() => setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })} 
           className="flex items-center justify-center w-6 h-6 rounded hover:bg-stone2 transition-colors"
           aria-label="Close flag selector">
           <X size={14} strokeWidth={2} className="text-ink" />
          </button>
          {FLAG_REASONS.map(({ value, label, Icon }) => {
           const active = flagForm[item.key]?.reason === value
           return (
            <button
             key={value}
             type="button"
             onClick={() => {
              setFlagForm(p => ({...p, [item.key]: {...p[item.key], reason: value, active: true}}))
              setTimeout(() => {
               const f = flagForm[item.key]
               if (f) {
                setFlaggedItems(p => ({...p, [item.key]: {reason: value}}))
                if (value === 'Equipment malfunction') setMaintenanceTickets(p => [...p, { id:`MT-${Date.now()}`, equipment: item.label, issue: value, urgency:'warn', status:'open', requestedBy: item.operator, createdAt: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
                setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })
               }
              }, 200)
             }}
             title={label}
             className={`flex items-center justify-center w-8 h-8 rounded transition-transform ${active ? 'scale-110' : 'scale-100 hover:scale-110'} ${active ? 'bg-ok/10' : 'bg-stone2 hover:bg-stone3'}`}
             aria-label={label}>
             <Icon size={16} strokeWidth={2} className={`${active ? 'text-ok' : 'text-ink'}`} aria-hidden="true" />
            </button>
           )
          })}
         </div>
        )}
       </div>
      )}
     </div>
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
      <input aria-label="CFU count" placeholder="CFU count" type="number"
       value={empForm[item.key]?.cfu || ''}
       onChange={e => setEmpForm(p => ({...p, [item.key]: {...p[item.key], cfu: e.target.value}}))}
       className="w-20 font-body text-ink text-[10px] bg-stone border border-rule2 px-2 py-0.5" />
      )}
     </div>
     {empForm[item.key]?.result && (
      <Btn variant="primary" onClick={() => {
       const r = empForm[item.key]
       setEmpSessionResults(p => ({...p, [item.key]: { result: r.result, cfu: r.cfu, time: checklistSigned[item.key] }}))
       if (r.result === 'positive') setMaintenanceTickets(p => [...p, { id:`MT-EMP-${Date.now()}`, equipment:'Zone 1 — Sauce Dosing', issue:`Positive EMP swab${r.cfu ? ` · ${r.cfu} CFU` : ''} — deep clean required before next production run`, urgency:'danger', status:'open', requestedBy:'T. Osei', createdAt: checklistSigned[item.key] }])
      }}>Log result {empForm[item.key]?.result === 'positive' ? '— auto-CAPA created' : ''}</Btn>
     )}
     </div>
    )}

    </div>
   )
  })}
 </VaulDrawer>
 </div>
 )
}
