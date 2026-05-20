import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ShiftIQV2 from './ShiftIQV2'
import HandoffIQ from './HandoffIQ'
import RobotFleet from './RobotFleet'
import ResourceAllocation from './ResourceAllocation'
import { useFocusTrap, useExitAnimation, riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import { shiftData, line6Data, wichitaData, denverData, haccpData, productionRate, crewHoursData } from '../data'
import {
 StatusPill, Tabs,
 Btn, ConsequenceNotice, PageHead, ActionBanner,
 PersonAvatar, Modal, WaveformSparkline, AnimatedCheck, Spinner,
 VaulDrawer, HoldButton
} from '../components/UI'
import { Flag, ChevronRight, ChevronDown, AlertTriangle, Check, X, TrendingDown, RotateCcw, Wrench, Package, HelpCircle, ListChecks, Brain, Shield, RefreshCw, ChevronUp, BarChart2, ArrowRight, Moon, Activity } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { GanttChart, CalendarHeatmap, RadarChart } from '../components/Charts'

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
 <div className="font-body text-muted text-body text-center leading-relaxed">
 No data for {name}<br />Pilot runs on Line 4 only
 </div>
 </div>
 )
}

function ScoreBadge({ score }) {
 return (
  <span
   className={`display-num text-hero leading-none ${riskColorClass(score)}`}
   aria-label={`Risk score ${score} — ${riskLabel(score)}`}
  >{score}</span>
 )
}

function AgentTimeline({ timeline, sparkline, score }) {
 const scoreColor = riskBgColor(score)
 const scoreTextColor = riskColorClass(score)
 const zone = riskLabel(score)
 const [explainerOpen, setExplainerOpen] = useState(false)
 return (
 <div className="border-b border-rule2">
 {/* EFB-style primary instrument */}
 <div className="px-4 pt-5 pb-4 border-b border-rule2 bg-stone">
  <div className="flex items-start justify-between gap-3">
   <div>
    <div className="font-body text-muted text-label mb-3">Line 4 · AM shift</div>
    <div className={`display-num text-hero leading-none ${scoreTextColor}`}>{score}</div>
    <div className={`font-body font-medium text-label mt-1.5 ${scoreTextColor}`}>{zone}</div>
   </div>
   <div className="pt-5 flex-shrink-0">
    <WaveformSparkline data={sparkline} color={scoreColor} width={64} height={44} />
   </div>
  </div>
  <div className="font-body text-muted text-label mt-3 pt-2.5 border-t border-rule2">
   Rising · 06:12–06:42
  </div>
 </div>
 <ScoreExplainer score={score} open={explainerOpen} onToggle={() => setExplainerOpen(o => !o)} />
 {/* Timeline rows */}
 {timeline.map((row, i) => (
 <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule2 last:border-b-0">
 <div className="font-body text-muted text-label w-11 flex-shrink-0 mt-0.5">{row.time}</div>
 <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
 row.level === 'now' ? 'bg-ochre' : row.level === 'warn' ? 'bg-warn' : row.level === 'ok' ? 'bg-ok' : 'bg-rule'
 }`} />
 <div className="flex-1">
 <p className="font-body text-ink-2 text-label leading-relaxed">
 {row.event.split(/\*\*(.*?)\*\*/g).map((part, i) =>
  i % 2 === 1 ? <strong key={i} className="text-ink font-medium">{part}</strong> : part
 )}
 </p>
 {row.delta && <div className={`display-num text-label mt-0.5 ${row.deltaColor}`}>{row.delta}</div>}
 </div>
 </div>
 ))}
 </div>
 )
}

const SCORE_FACTORS = [
 { label: 'Staffing cert mismatch', contribution: 18, tone: 'danger', state: 'Reyes (L1) assigned Sauce Dosing — L2 cert required', confidence: 'high', source: 'Cert records · direct' },
 { label: 'Allergen changeover log', contribution: 13, tone: 'danger', state: 'Unsigned — production start blocked', confidence: 'high', source: 'Checklist system · direct' },
 { label: 'Startup checklists', contribution: 9, tone: 'warn', state: '7 of 13 signed · 4 overdue at shift start', confidence: 'high', source: 'Checklist system · direct' },
 { label: 'Sensor A-7 variance', contribution: 6, tone: 'warn', state: 'Micro-variance count 4/5 · bearing suspect', confidence: 'medium', source: 'SCADA · 3-hr rolling' },
 { label: 'CCP-1 & CCP-3', contribution: 0, tone: 'ok', state: 'Both within limits · no contribution to score', confidence: 'high', source: 'Sensor verified · direct' },
 { label: 'SCADA — Oven B', contribution: 0, tone: 'warn', state: 'Sensor stale · model accuracy reduced', confidence: 'low', source: 'Last reading 2h 14m ago', tip: 'SCADA (Supervisory Control and Data Acquisition) — the sensor network feeding live oven readings. Stale data reduces model accuracy.' },
]

const CONF_DOT = { high: 'bg-ok', medium: 'bg-warn', low: 'bg-muted' }
const CONF_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }

function ScoreExplainer({ score, open, onToggle }) {
 const baseScore = score - SCORE_FACTORS.reduce((sum, f) => sum + f.contribution, 0)
 const adjustedFrom = SCORE_FACTORS.reduce((sum, f) => sum + f.contribution, 0) + baseScore + 3
 return (
  <div className="border-t border-rule2">
   <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors group"
   >
    <div className="flex items-center gap-2">
     <Brain size={11} strokeWidth={1.75} className="text-muted" />
     <span className="font-body text-muted text-label">Why {score}?</span>
    </div>
    {open
     ? <ChevronUp size={11} className="text-muted" />
     : <ChevronDown size={11} className="text-muted" />}
   </button>

   {open && (
    <div className="slide-in">
     {/* Base + factor rows */}
     <div className="px-4 py-2 border-b border-rule2 bg-stone">
      <div className="flex items-baseline gap-2">
       <span className="display-num text-label text-muted w-8 text-right flex-shrink-0">{baseScore}</span>
       <span className="font-body text-muted text-label flex-1">Base risk · no shift conditions</span>
      </div>
     </div>
     {SCORE_FACTORS.map((f, i) => {
      const toneText = f.tone === 'danger' ? 'text-danger' : f.tone === 'warn' ? 'text-warn' : 'text-ok'
      const toneBg   = f.tone === 'danger' ? 'bg-danger/[0.03]' : f.tone === 'warn' ? 'bg-warn/[0.02]' : ''
      return (
       <div key={i} className={`px-4 py-2.5 border-b border-rule2 last:border-b-0 ${toneBg}`} title={f.tip || undefined}>
        <div className="flex items-start gap-2">
         <span className={`display-num text-body font-bold w-8 text-right flex-shrink-0 leading-none pt-px ${
          f.contribution > 0 ? toneText : 'text-muted'
         }`}>
          {f.contribution > 0 ? `+${f.contribution}` : '—'}
         </span>
         <div className="flex-1 min-w-0">
          <div className={`font-body font-medium text-label leading-snug ${f.contribution > 0 ? (f.tone === 'danger' ? 'text-danger' : 'text-ink') : 'text-muted'}`}>
           {f.label}
          </div>
          <div className="font-body text-muted text-label mt-0.5 leading-snug">{f.state}</div>
          <div className="flex items-center gap-1 mt-1">
           <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CONF_DOT[f.confidence]}`} />
           <span className="font-body text-muted text-label">{CONF_LABEL[f.confidence]} · {f.source}</span>
          </div>
         </div>
        </div>
       </div>
      )
     })}
     {/* Confidence adjustment note */}
     <div className="px-4 py-2.5 bg-warn/[0.04] border-t-2 border-t-warn/20">
      <div className="flex items-start gap-2">
       <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0 mt-px" />
       <div>
        <div className="font-body font-medium text-ink text-label">Score adjusted {adjustedFrom} → {score}</div>
        <div className="font-body text-muted text-label mt-0.5 leading-snug">
         Oven B sensor data stale — model accuracy reduced. Restore sensor feed to recover full signal.
        </div>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}

function SignalCard({ sig }) {
 const stale = sig.tone === 'danger'
 return (
  <div className="flex min-h-[64px] items-center gap-5 border-b border-rule last:border-b-0 bg-stone px-6 py-4">
   <div className={`flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center ${
    stale ? 'bg-danger/[0.055]' : 'bg-ok/[0.09]'
   }`}>
    <Activity size={16} strokeWidth={2.2} className={stale ? 'text-danger' : 'text-ok'} aria-hidden="true" />
   </div>
   <div className="min-w-0 flex-1">
    <div className="truncate font-body text-body font-semibold leading-[1.15] text-ink">{sig.name}</div>
    <div className="mt-1 truncate font-body text-label leading-[1.15] text-muted">{sig.sub}</div>
   </div>
   <span className={`flex-shrink-0 rounded-full border px-4 py-2 font-body text-label font-semibold leading-none ${
    stale
     ? 'border-danger/20 bg-danger/[0.035] text-danger'
     : 'border-ok/20 bg-ok/[0.08] text-ok'
   }`}>
    {sig.status}
   </span>
  </div>
 )
}

function SignalHealthPanel({ signals }) {
 return (
  <div className="border-t border-rule2 bg-stone">
   {signals.map((sig, i) => <SignalCard key={`${sig.name}-${i}`} sig={sig} />)}
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
 const certC = meta.certPct >= 80 ? 'var(--color-ok)' : 'var(--color-warn)'
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
 <div className="flex items-center gap-3 px-4 py-3 border-b border-rule2 bg-stone2 flex-shrink-0" style={{ borderTop:'3px solid var(--color-danger)' }}>
 <PersonAvatar name={name} size={32} />
 <div className="flex-1 min-w-0">
 <div className="font-body font-medium text-ink text-base">{name}</div>
 <div className="font-body text-muted text-label">{meta.station}</div>
 </div>
 <button type="button" onClick={handleClose} aria-label="Close operator panel" className="text-muted hover:text-ink transition-colors duration-100 ease-standard p-1 cursor-pointer">
 <X size={14} strokeWidth={2} aria-hidden="true" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto">
 {safety && (
 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-label">Safety context · today</div>
 <div className="px-4 py-3 border-l-2 border-l-warn bg-warn/[0.02]">
 <div className="font-body text-ink-2 text-body leading-relaxed">{safety}</div>
 </div>
 </div>
 )}

 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 flex items-baseline justify-between">
 <span className="font-body text-muted text-label">Today's tasks</span>
 {myTasks.some(t => !t.done) && (
 <span className="font-body text-warn text-label">{myTasks.filter(t => !t.done).length} pending</span>
 )}
 </div>
 {myTasks.length === 0 ? (
 <div className="px-4 py-3 font-body text-muted text-body">No tasks assigned — tasks created in ShiftIQ appear here.</div>
 ) : myTasks.map((t, i) => (
 <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
 <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${t.done ? 'bg-ok' : 'border-2 border-rule2'}`}>
 {t.done && <AnimatedCheck size={10} color="white" />}
 </div>
 <div className="flex-1">
 <div className={`font-body font-medium text-body ${t.done ? 'line-through text-muted' : 'text-ink'}`}>{t.label}</div>
 {t.dueTime && <div className="font-body text-muted text-label">Due {t.dueTime}</div>}
 </div>
 </div>
 ))}
 </div>

 {myFlags.length > 0 && (
 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-label">Flagged items</div>
 {myFlags.map((f, i) => (
 <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule2 last:border-b-0 bg-warn/[0.02]">
 <Flag size={13} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
 <div>
 <div className="font-body font-medium text-ink text-body">{f.key}</div>
 <div className="font-body text-warn text-label">{f.reason}</div>
 </div>
 </div>
 ))}
 </div>
 )}

 <div className="border-b border-rule2">
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-label">Certification progress</div>
 <div className="px-4 py-3">
 <div className="font-body text-muted text-label mb-2">{meta.certLabel}</div>
 <div style={{ height:5, background:'#CAC2B6', marginBottom:8 }}>
 <div style={{ height:'100%', width:`${meta.certPct}%`, background:certC, transition:'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }} />
 </div>
 <span className="display-num text-title" style={{ color: certC }}>{meta.certPct}%</span>
 </div>
 </div>

 <div>
 <div className="px-4 py-2 border-b border-rule2 bg-stone2 font-body text-muted text-label">Training plan</div>
 {!plan?.submitted ? (
 <div className="px-4 py-3 font-body text-muted text-body">
 No active training plan.
 {name === 'C. Reyes' && ' Nominated by Kowalski — set up plan in HandoffIQ.'}
 </div>
 ) : (
 <div className="px-4 py-3 space-y-2">
 {[['Level', plan.level], ['Trainer', plan.trainer], ['Starts', plan.startDate]].map(([k, v]) => (
 <div key={k} className="flex justify-between items-baseline">
 <span className="font-body text-muted text-label">{k}</span>
 <span className="font-body font-medium text-ink text-body">{v}</span>
 </div>
 ))}
 {completion ? (
 <div className={`flex items-center gap-1 pt-2 border-t border-rule2 font-body text-label ${completion.outcome === 'Passed' ? 'text-ok' : 'text-warn'}`}>
 <Check size={12} strokeWidth={2} className="stroke-current flex-shrink-0" />
 {completion.outcome} · {completion.date} · {completion.hours}h
 </div>
 ) : (
 <div className="flex items-center gap-1 pt-2 border-t border-rule2 font-body text-muted text-label">
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
   <button type="button"
    key={opName}
    type="button"
    onClick={() => onSelectOperator?.(opName)}
    className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${name === opName ? 'border-ink bg-ink/10' : 'border-rule2 hover:border-muted'}`}
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
 <div className={`font-body text-body font-medium ${m.flag ? 'text-danger' : 'text-ink'}`}>{m.name}</div>
 <div className={`font-body text-label ${m.flag ? 'text-danger' : 'text-muted'}`}>{m.role}</div>
 </div>
 <div className="flex items-center gap-2">
 {hrs && fatigue && (
 <span className={`font-body text-label px-1 py-px ${fatigue === 'danger' ? 'bg-danger/[0.04] text-danger' : 'bg-warn/10 text-warn'}`}>{hrs.hoursThisWeek}h</span>
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

function PrepareAction({ action, onConfirm }) {
 const [confirmed, setConfirmed] = useState(false)
 return (
  <div className={`flex items-start gap-3 px-4 py-3 border-b border-rule2 transition-opacity ${confirmed ? 'opacity-50' : ''}`}>
   <button type="button"
    onClick={() => { setConfirmed(true); onConfirm({ actor: 'D. Kowalski', action: `Confirmed: ${action.label}`, item: action.key, type: 'intervention' }) }}
    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
     confirmed ? 'bg-ok' : 'border-2 border-rule2 hover:border-ok hover:bg-ok/10 cursor-pointer'
    }`}>
    {confirmed && <Check size={10} strokeWidth={2.5} className="text-stone" />}
   </button>
   <div className="flex-1">
    <div className={`font-body font-medium text-body leading-snug ${confirmed ? 'line-through text-muted' : 'text-ink'}`}>{action.label}</div>
    <div className="font-body text-muted text-label mt-0.5">{action.consequence}</div>
   </div>
  </div>
 )
}

function Finding({ f, onAct, onDismiss, onDelegate, dismissed }) {
 const [acked, setAcked] = useState(false)
 const [removing, setRemoving] = useState(false)
 const [showDismiss, setShowDismiss] = useState(false)
 const [dismissPos, setDismissPos] = useState({ top: 0, left: 0 })
 const [showed, setShowed] = useState(false)
 const [showDelegate, setShowDelegate] = useState(false)
 const [delegateOp, setDelegateOp] = useState('')
 const [delegateDue, setDelegateDue] = useState('End of shift')
 const [delegated, setDelegated] = useState(false)
 const dismissBtnRef = useRef(null)

 const handleDelegate = () => {
  if (!delegateOp) return
  onDelegate(delegateOp, f.title, delegateDue)
  setDelegated(true)
  setShowDelegate(false)
 }

 const handleAct = () => {
  onAct(f.id)
  setAcked(true)
  setShowed(true)
  setTimeout(() => setRemoving(true), 700)
 }

 const openDismiss = () => {
  if (dismissBtnRef.current) {
   const r = dismissBtnRef.current.getBoundingClientRect()
   setDismissPos({ top: r.bottom + 4, left: r.left })
  }
  setShowDismiss(true)
 }

 const accentBar = f.urgency === 'danger' ? 'bg-danger' : f.urgency === 'warn' ? 'bg-warn' : 'bg-rule2'
 const urgencyChipCls = f.urgency === 'danger'
  ? 'bg-danger/[0.04] text-danger'
  : f.urgency === 'warn'
  ? 'bg-warn/10 text-warn'
  : 'bg-ok/10 text-ok'
 const urgencyLabel = f.urgency === 'danger' ? 'Critical' : f.urgency === 'warn' ? 'Warning' : 'Watch'

 return (
  <>
   <div style={{
    display: 'grid',
    gridTemplateRows: removing ? '0fr' : '1fr',
    opacity: removing ? 0 : 1,
    transition: 'grid-template-rows 350ms ease-in-out, opacity 280ms ease-in-out',
   }}>
    <div className="overflow-hidden">
     <article
      className={`bg-stone border border-rule overflow-hidden ${dismissed ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${accentBar}`} />
      {acked ? (
       <div className="flex items-center justify-center py-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-ok/20 bg-ok/5">
         <AnimatedCheck size={18} color="currentColor" />
        </div>
       </div>
      ) : (
       <>
        {/* Header: urgency chip + source */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
         <div className="flex items-center gap-1.5">
          <span className={`font-body font-medium text-label px-1.5 py-px ${urgencyChipCls}`}>{urgencyLabel}</span>
          {f.recurring && (
           <Link to={`/capa?finding=${f.id}`} className="font-body text-warn text-label flex items-center gap-1 hover:text-ink transition-colors" title="Open root cause investigation in CAPA">
            <RefreshCw size={9} strokeWidth={2} />Recurring · {f.recurring.count} of {f.recurring.window} shifts
           </Link>
          )}
         </div>
         <div className="flex items-center gap-1.5">
          {f.source && <StatusPill tone="muted">{f.source}</StatusPill>}
          {f.capaId && (
           <Link to="/capa" className="font-body text-warn text-label flex items-center gap-1 hover:text-ink transition-colors">
            <ArrowRight size={9} />{f.capaId}
           </Link>
          )}
         </div>
        </div>
        {/* Body: title + desc + evidence */}
        <div className="px-4 pb-3 space-y-1.5">
         <p className="font-body text-ink font-medium text-base leading-snug">{f.title}</p>
         <p className="font-body text-ink-2 text-body leading-relaxed">{f.desc}</p>
         {f.evidence && (() => {
          const isPrecedent = f.evidence.toLowerCase().startsWith('precedent:')
          const sourceLine = f.evidence.match(/Line\s\d+/)?.[0] || null
          const isCurrentLine = sourceLine === shiftData.line
          const poolSize = f.precedentPool ?? null
          const smallPool = poolSize !== null && poolSize < 5
          return (
           <div className="space-y-1">
            <p className="font-body text-muted text-label flex items-start gap-1">
             <ChevronRight size={11} className="flex-shrink-0 mt-px" />{f.evidence}
             {isPrecedent && sourceLine && !isCurrentLine && (
              <span className="ml-1 font-body text-label text-warn bg-warn/10 px-1 py-0.5 flex-shrink-0">Cross-line</span>
             )}
            </p>
            {isPrecedent && smallPool && (
             <p className="font-body text-warn text-label pl-4">⚠ Small precedent pool ({poolSize} case{poolSize !== 1 ? 's' : ''}) — treat this match with caution</p>
            )}
            {isPrecedent && sourceLine && !isCurrentLine && (
             <p className="font-body text-warn text-label pl-4">Precedent from {sourceLine}, not {shiftData.line} — equipment characteristics may differ</p>
            )}
           </div>
          )
         })()}
        </div>
        {/* Footer: action buttons */}
        <div className="flex gap-2 px-4 pb-3 pt-2 border-t border-rule2/60 flex-wrap">
         {f.actions.map((a, i) => (
          <Btn key={i} variant={i === 0 ? 'primary' : 'secondary'} onClick={handleAct}>
           {a}
          </Btn>
         ))}
         <div ref={dismissBtnRef}>
          <Btn variant="secondary" onClick={showDismiss ? () => setShowDismiss(false) : openDismiss}>Dismiss</Btn>
         </div>
         {f.delegateTo?.length > 0 && !delegated && (
          <Btn variant="secondary" onClick={() => setShowDelegate(d => !d)}>
           {showDelegate ? 'Cancel' : 'Delegate'}
          </Btn>
         )}
         {delegated && (
          <span className="flex items-center gap-1 font-body text-ok text-label px-2">
           <Check size={10} strokeWidth={2.5} />Delegated to {delegateOp}
          </span>
         )}
        </div>
        {showDelegate && (
         <div className="px-4 pb-3 border-t border-rule2 bg-stone2 slide-in">
          <div className="pt-2.5 pb-1 font-body text-muted text-label mb-2">Assign to operator</div>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
           {f.delegateTo.map(op => (
            <button key={op} type="button" onClick={() => setDelegateOp(op)}
             className={`font-body text-label px-2.5 py-1 transition-colors ${delegateOp === op ? 'bg-ink text-stone' : 'bg-stone3 text-muted hover:text-ink'}`}>
             {op}
            </button>
           ))}
          </div>
          <div className="flex items-center gap-2 mb-2.5">
           <span className="font-body text-muted text-label flex-shrink-0">Due</span>
           <select value={delegateDue} onChange={e => setDelegateDue(e.target.value)}
            className="flex-1 font-body text-ink text-label bg-stone border border-rule2 px-2 py-1 focus:border-ochre focus:outline-none">
            <option>End of shift</option>
            <option>Next 30 min</option>
            <option>Next 2 hours</option>
            <option>Before handoff</option>
           </select>
          </div>
          <Btn variant="primary" onClick={handleDelegate} disabled={!delegateOp}>Assign task</Btn>
         </div>
        )}
       </>
      )}
     </article>
    </div>
   </div>
   {showDismiss && (
    <div
     className="fixed z-50 bg-stone shadow-raise min-w-[260px] plant-drop-in"
     style={{ top: dismissPos.top, left: dismissPos.left }}>
     <div className="plant-drop-in-content">
      <div className="px-3 py-2.5 border-b border-rule2">
       <span className="font-body font-medium text-ink text-label">Flag as dismissed</span>
      </div>
      {[
       'Already handled by outgoing supervisor',
       'Not applicable — SKU change in progress',
       'Assessment is incorrect — false positive',
      ].map(reason => (
       <button type="button"
        key={reason}
        onClick={() => { onDismiss(f.id, f.title, reason); setShowDismiss(false) }}
        className="flex items-center gap-2.5 w-full text-left font-body text-ink text-label px-3 py-2.5 border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors"
        aria-label={`Dismiss: ${reason}`}>
        <Flag size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
        {reason}
       </button>
      ))}
     </div>
    </div>
   )}
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
    <button type="button" key={m.name} type="button"
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
     <span className="font-body text-muted text-label font-medium">+{extra}</span>
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
  <div ref={dropRef} className="fixed z-40 plant-drop-in" style={{ top: pos.top, left: pos.left }}>
   <div className="w-[260px] bg-sidebar border border-sidebar-border rounded-2xl shadow-raise overflow-hidden">
    <div className="plant-drop-in-content">
     <div className="px-4 py-2.5 border-b border-sidebar-border">
      <p className="font-body text-sidebar-ghost/40 text-label">Select line</p>
     </div>
     {lines.map(line => {
      const sc = riskColorClass(line.score)
      const zoneLabel = riskLabel(line.score)
      const isActive = line.id === activeLine
      const hasPilotData = line.id === 'l4' || line.id === 'l6'
      return (
       <button type="button" key={line.id} type="button"
        aria-pressed={isActive}
        disabled={!hasPilotData}
        onClick={() => { if (hasPilotData) { onSelect(line.id); onClose() } }}
        className={`flex items-center justify-between w-full px-4 py-3 border-b border-sidebar-border last:border-b-0 transition-colors group ${hasPilotData ? 'hover:bg-sidebar-3 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
       >
        <div className="text-left">
         <div className={`font-body text-body font-medium transition-colors ${isActive ? 'text-stone' : 'text-sidebar-ghost group-hover:text-stone/80'}`}>{line.name}</div>
         <div className="font-body text-sidebar-ghost/50 text-label mt-0.5">
          {hasPilotData ? `${line.supervisor} shift` : 'Not in pilot'}
         </div>
        </div>
        <div className="flex items-center gap-2">
         {hasPilotData ? (
          <>
           <span className={`font-body text-label ${sc}`}>{zoneLabel}</span>
           <span className={`display-num text-title ${sc}`} aria-label={`Risk score ${line.score}`}>{line.score}</span>
          </>
         ) : (
          <span className="font-body text-sidebar-ghost/40 text-label">No data</span>
         )}
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

// ── PrepareView — pre-shift staffing preparation ─────────────────────────────
function PrepareView({ forecast = [] }) {
 const [confirmed, setConfirmed] = useState({})
 const actionRows = forecast.filter(r => r.action)
 return (
  <div className="flex flex-col flex-1 overflow-hidden content-reveal">
   {/* Gantt — upcoming shift forecast */}
   <div className="flex-shrink-0 px-5 py-4 border-b border-rule2">
    <div className="font-body text-micro text-muted tracking-widest mb-3">Upcoming shift forecast</div>
    <GanttChart forecast={forecast} />
   </div>
   {/* Action items — supervisory prep tasks */}
   <div className="flex-1 overflow-y-auto">
    <div className="px-5 py-3 bg-stone2 border-b border-rule2">
     <div className="font-body font-medium text-ink text-body">Pre-shift actions</div>
     <div className="font-body text-muted text-label mt-0.5">
      {actionRows.filter(r => !confirmed[r.name]).length} items outstanding · confirm each before shift start
     </div>
    </div>
    {actionRows.map((row, i) => {
     const done = !!confirmed[row.name + i]
     return (
      <div key={i} className={`flex items-start gap-3 px-5 py-4 border-b border-rule2 transition-opacity ${done ? 'opacity-50' : ''} ${row.critical ? 'bg-danger/[0.02]' : ''}`}>
       <button type="button"
        disabled={done}
        onClick={() => setConfirmed(p => ({...p, [row.name + i]: true}))}
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
         done ? 'bg-ok' : row.critical ? 'border-2 border-danger hover:border-ok hover:bg-ok/10 cursor-pointer' : 'border-2 border-rule2 hover:border-ochre cursor-pointer'
        }`}>
        {done && <Check size={11} strokeWidth={2.5} className="text-stone" />}
       </button>
       <div className="flex-1">
        <div className={`font-body font-medium text-body leading-snug ${done ? 'line-through text-muted' : row.critical ? 'text-danger' : 'text-ink'}`}>
         {row.action}
        </div>
        <div className="font-body text-muted text-label mt-0.5">{row.name} · {row.time.replace('\n', ' ')}</div>
       </div>
       {row.critical && !done && (
        <span className="font-body text-label text-danger bg-danger/[0.08] px-1.5 py-px flex-shrink-0">Critical</span>
       )}
      </div>
     )
    })}
    {actionRows.length === 0 && (
     <div className="px-5 py-10 text-center font-body text-muted text-body">No pre-shift actions — staffing looks clean.</div>
    )}
   </div>
  </div>
 )
}

export default function ShiftIQ() {
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
 workerMode,
 pilotExpanded, setPilotExpanded,
 viewingRole,
 addQuietPeriod, clearQuietPeriod, activeQuietPeriod,
 } = useAppState()
 const [quietForm, setQuietForm] = useState({ open: false, reason: '', endTime: '' })
 const handleSetQuietPeriod = () => {
  addQuietPeriod({
   line: 'Line 4',
   startTime: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
   endTime: quietForm.endTime || '+60 min',
   reason: quietForm.reason || 'Planned operational event',
   setBy: 'D. Kowalski',
  })
  setQuietForm({ open: false, reason: '', endTime: '' })
  logActivity({ actor: 'D. Kowalski', action: 'Quiet period set — Compliance Monitor in log-only mode', item: 'Line 4', type: 'compliance' })
 }
 const currentQuiet = activeQuietPeriod?.('Line 4')
 const d = currentPlant?.id === 'ks' ? wichitaData : currentPlant?.id === 'co' ? denverData : shiftData
 const [predActioned, setPredActioned] = useState(false)
 const [overrideMode, setOverrideMode] = useState(false)
 const [overrideReason, setOverrideReason] = useState('')
 const [overrideShake, setOverrideShake] = useState(false)
 const [overrideConfirmed, setOverrideConfirmed] = useState(false)
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
 const [pendingDismiss, setPendingDismiss] = useState(new Map())
 const [permanentDismiss, setPermanentDismiss] = useState(new Set())
 const [crewView, setCrewView] = useState('list')

 const handleDismiss = (id, title, reason) => {
  const timeoutId = setTimeout(() => {
   setPermanentDismiss(prev => new Set([...prev, id]))
   setPendingDismiss(prev => { const m = new Map(prev); m.delete(id); return m })
  }, 6000)
  setPendingDismiss(prev => new Map([...prev, [id, { timeoutId, title }]]))
  logActivity({ actor: lineSupervisor, action: `Dismissed finding: ${reason}`, item: id, type: 'intervention' })
 }

 const handleUndoDismiss = (id) => {
  const entry = pendingDismiss.get(id)
  if (!entry) return
  clearTimeout(entry.timeoutId)
  setPendingDismiss(prev => { const m = new Map(prev); m.delete(id); return m })
 }
 const [showExpansionGate, setShowExpansionGate] = useState(false)
 const [expansionStep, setExpansionStep] = useState(0)
 const [dataOwner, setDataOwner] = useState('')
 const [directorAck, setDirectorAck] = useState(false)
 const lineTriggerRef = useRef(null)
 const [col1Tab, setCol1Tab] = useState('orders')

 const skuContextReady = readinessResolved?.['ctx-0'] && (readinessScore ?? 64) >= 75
 const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
 const pendingTaskCount = Object.values(taskAssignments).flat().filter(t => !t.done).length
 const prepareUrgent = d.forecast?.some(f => f.urgent || f.score >= 75 || f.signals?.some(s => s.endsWith(':danger')))
 const signedCount = 7 + Object.keys(checklistSigned).length
 const startupPct = Math.round((signedCount / CHECKLIST_TOTAL) * 100)
 const [activeTab, setActiveTab] = useState('shift')
 const [countdown, setCountdown] = useState(d.countdown)
 const [escalatedShift, setEscalatedShift] = useState(false)

 useEffect(() => {
 const id = setInterval(() => setCountdown(s => Math.max(0, s - 1)), 1000)
 return () => clearInterval(id)
 }, [])

 const countdownFmt = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`
 const activeLined = d.lines.find(l => l.id === activeLine) ?? d.lines[0]
 const isSalina = !currentPlant?.id || currentPlant.id === 'sl'
 const lineD = isSalina && activeLine === 'l6' ? line6Data : d
 const lineScore = lineD.score
 const lineSupervisor = lineD.supervisor || 'D. Kowalski'
 const hasLiveData = true
 const scoreColor = riskColorClass(lineScore)

 return (
 <div className="flex flex-col h-full overflow-hidden">

 {/* Tab bar — Shift | Handoff | Fleet (robot/hybrid) | Allocation (hybrid) */}
 <div className="flex-shrink-0 flex items-center border-b border-rule2 bg-stone2">
  <Tabs
   tabs={[
    { id: 'shift',      label: 'Shift' },
    { id: 'prepare',    label: 'Prepare',     dot: shiftData.forecast?.some(r => r.critical) },
    { id: 'handoff',    label: 'Handoff' },
    ...(workerMode === 'robot' || workerMode === 'hybrid' || currentPlant?.id === 'ks' ? [{ id: 'fleet', label: 'Robot Fleet' }] : []),
    ...(workerMode === 'hybrid' ? [{ id: 'allocation', label: 'Allocation' }] : []),
   ]}
   active={activeTab}
   onChange={setActiveTab}
   className="flex-1 !border-b-0 -mb-px px-1"
  />
  {/* Sleep mode trigger */}
  {activeTab === 'shift' && (
   <Btn variant="ghost" onClick={() => setQuietForm(p => ({...p, open: true}))}
    className="mr-2 !px-2 !min-h-0 !py-2" aria-label="Set quiet period" title="Set quiet period">
    <Moon size={13} strokeWidth={2} />
   </Btn>
  )}
 </div>

 {activeTab === 'handoff'    ? <HandoffIQ />
  : activeTab === 'fleet'      ? <RobotFleet />
  : activeTab === 'allocation' ? <ResourceAllocation />
  : activeTab === 'prepare'    ? <PrepareView forecast={shiftData.forecast} />
  : <>
 {/* Quiet period banner — triggered by Moon icon in tab bar */}
 {currentQuiet ? (
  <div className="flex items-center gap-3 px-5 py-2.5 bg-ok/[0.06] border-b-2 border-b-ok/30 flex-shrink-0">
   <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
   <div className="flex-1 font-body text-label">
    <span className="font-medium text-ok">Quiet period active — </span>
    <span className="text-muted">{currentQuiet.reason} · Compliance Monitor in log-only mode · Until {currentQuiet.endTime}</span>
   </div>
   <button type="button" onClick={() => clearQuietPeriod(currentQuiet.id)}
    className="font-body text-muted text-label hover:text-danger transition-colors flex-shrink-0">
    End quiet period
   </button>
  </div>
 ) : quietForm.open ? (
  <div className="flex items-center gap-2 px-5 py-2 bg-stone2 border-b border-rule2 flex-shrink-0">
   <span className="font-body text-muted text-label flex-shrink-0">Quiet period:</span>
   <input
    type="text"
    value={quietForm.reason}
    onChange={e => setQuietForm(p => ({...p, reason: e.target.value}))}
    placeholder="Reason (e.g. Allergen changeover)"
    className="font-body text-ink text-label bg-stone border border-rule2 px-2 py-1 flex-1 placeholder:text-muted/60 focus:border-ochre focus:outline-none"
   />
   <input
    type="text"
    value={quietForm.endTime}
    onChange={e => setQuietForm(p => ({...p, endTime: e.target.value}))}
    placeholder="Until (e.g. 10:30)"
    className="font-body text-ink text-label bg-stone border border-rule2 px-2 py-1 w-24 placeholder:text-muted/60 focus:border-ochre focus:outline-none"
   />
   <button type="button" onClick={handleSetQuietPeriod}
    className="font-body text-label px-3 py-1 bg-ink text-stone hover:bg-ink2 transition-colors">
    Set
   </button>
   <button type="button" onClick={() => setQuietForm({ open:false, reason:'', endTime:'' })}
    className="font-body text-muted text-label hover:text-ink transition-colors">
    Cancel
   </button>
  </div>
 ) : null}
 <ShiftIQV2 score={lineScore} lineLabel={`${activeLined?.name ?? 'Line 4'} · AM Shift`} supervisor={lineSupervisor} plant={currentPlant?.name ?? 'Salina KS'} />
 </>}
 </div>
 )
}
