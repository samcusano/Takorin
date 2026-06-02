import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ShiftIQV2 from './ShiftIQV2'
import HandoffIQ from './HandoffIQ'
import RobotFleet from './RobotFleet'
import ResourceAllocation from './ResourceAllocation'
import { useFocusTrap, useExitAnimation, riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import { shiftData, line6Data, wichitaData, denverData, haccpData, productionRate, crewHoursData } from '../data'
import {
 StatusPill, SectionHeader, Tabs,
 Btn, ConsequenceNotice, PageHead, ActionBanner,
 PersonAvatar, Modal, WaveformSparkline, AnimatedCheck, Spinner,
 VaulDrawer, HoldButton, EmptyState
} from '../components/UI'
import { Flag, ChevronRight, ChevronDown, AlertTriangle, Check, X, TrendingDown, RotateCcw, Wrench, Package, HelpCircle, ListChecks, Brain, Shield, RefreshCw, ChevronUp, BarChart2, ArrowRight, Moon, Activity, CheckCircle2 } from 'lucide-react'
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
 row.level === 'now' ? 'bg-signal' : row.level === 'warn' ? 'bg-warn' : row.level === 'ok' ? 'bg-ok' : 'bg-rule'
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
     <Brain size={11} strokeWidth={2} className="text-muted" />
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
    <Activity size={16} strokeWidth={2} className={stale ? 'text-danger' : 'text-ok'} aria-hidden="true" />
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
 <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />
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
 <SectionHeader label="Safety context · today" />
 <div className="px-4 py-3 border-l-2 border-l-warn bg-warn/[0.02]">
 <div className="font-body text-ink-2 text-body leading-relaxed">{safety}</div>
 </div>
 </div>
 )}

 <div className="border-b border-rule2">
 <SectionHeader label="Today's tasks" badge={myTasks.some(t => !t.done) ? <span className="font-body text-warn text-label">{myTasks.filter(t => !t.done).length} pending</span> : undefined} />
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
 <SectionHeader label="Flagged items" />
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
 <SectionHeader label="Certification progress" />
 <div className="px-4 py-3">
 <div className="font-body text-muted text-label mb-2">{meta.certLabel}</div>
 <div style={{ height:5, background:'var(--color-rule)', marginBottom:8 }}>
 <div style={{ height:'100%', width:`${meta.certPct}%`, background:certC, transition:'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }} />
 </div>
 <span className="display-num text-title" style={{ color: certC }}>{meta.certPct}%</span>
 </div>
 </div>

 <div>
 <SectionHeader label="Training plan" />
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
    <PersonAvatar name={opName} size={20} />
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
 <StatusPill tone={fatigue === 'danger' ? 'danger' : 'warn'}>{hrs.hoursThisWeek}h</StatusPill>
 )}
 <div className="flex gap-1" title={`Skill level: ${m.dots.filter(Boolean).length} of ${m.dots.length}`} aria-label={`Skill level ${m.dots.filter(Boolean).length} of ${m.dots.length}`}>
 {m.dots.map((d, i) => (
 <div key={i} className={`w-2 h-2 ${d ? 'bg-signal' : 'bg-rule2'}`} />
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
         <StatusPill tone={f.urgency === 'danger' ? 'danger' : f.urgency === 'warn' ? 'warn' : 'ok'}>{urgencyLabel}</StatusPill>
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
         <div className="flex items-start justify-between gap-3">
          <p className="font-body text-ink font-medium text-base leading-snug">{f.title}</p>
          {f.recurring && (
           <Link to={`/capa?finding=${f.id}`} className="flex-shrink-0 mt-px" title="Open root cause investigation in CAPA">
            <StatusPill tone="warn"><RefreshCw size={9} strokeWidth={2} className="inline mr-1 -mt-px" />Recurring</StatusPill>
           </Link>
          )}
         </div>
         <p className="font-body text-ink text-body leading-relaxed">{f.desc}</p>
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
              <StatusPill tone="warn" className="ml-1 flex-shrink-0">Cross-line</StatusPill>
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
            className="flex-1 font-body text-ink text-label bg-stone border border-rule2 px-2 py-1 focus:border-signal focus:outline-none">
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
         {isActive && <div className="w-1.5 h-1.5 rounded-full bg-signal flex-shrink-0" />}
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

const PRE_SHIFT_VERIFICATION = {
 certReadiness: { ready: 3, total: 4, note: 'Reyes (L1) assigned L2 station — mismatch', tone: 'warn' },
 sensorHealth:  { nominal: 5, total: 6, staleLabel: 'Oven B', note: 'Last reading 2h 14m ago — model accuracy reduced', tone: 'warn' },
 checklist:     { complete: 9, total: 13, note: '4 items outstanding before shift start', tone: 'warn' },
}

const DEMAND_SIGNAL = {
 scheduledCases: 4200, forecastCases: 3850, unit: 'cases',
 variance: +350, variancePct: 9,
 recommendation: 'Reduce Line 4 to 85% capacity or reallocate 1 operator to Line 3 packaging backlog',
 confidence: 81,
 source: 'Distribution forecast · 3-day rolling avg · updated 05:30',
}

function TriageCard({ urgency, resolved, resolvedLabel, header, children, footer }) {
 if (resolved) {
  return (
   <div className="flex items-center gap-3 px-5 py-3 border-b border-rule2/60 opacity-50">
    <div className="w-4 h-4 rounded-full bg-ok flex items-center justify-center flex-shrink-0">
     <Check size={9} strokeWidth={2.5} className="text-stone" />
    </div>
    <span className="font-body text-muted text-label line-through flex-1">{header}</span>
    {resolvedLabel && <span className="font-body text-ok text-label">{resolvedLabel}</span>}
   </div>
  )
 }
 const accentBar = urgency === 'critical' ? 'bg-danger' : 'bg-warn'
 const urgencyTone = urgency === 'critical' ? 'danger' : 'warn'
 const urgencyLabel = urgency === 'critical' ? 'Critical' : 'Warning'
 return (
  <div className="px-5 py-3 border-b border-rule2">
   <article className="bg-stone border border-rule overflow-hidden">
    <div className={`h-[3px] w-full ${accentBar}`} />
    <div className="flex items-center px-4 pt-3 pb-1.5">
     <StatusPill tone={urgencyTone}>{urgencyLabel}</StatusPill>
    </div>
    <div className="px-4 pb-3 space-y-1.5">
     <p className="font-body text-ink font-medium text-base leading-snug">{header}</p>
     {children}
    </div>
    {footer && (
     <div className="flex gap-2 px-4 pb-3 pt-2 border-t border-rule2/60">
      {footer}
     </div>
    )}
   </article>
  </div>
 )
}

function PrepareView({ forecast = [], onStartShift }) {
 const { logActivity } = useAppState()
 const [demandAck, setDemandAck] = useState(null)
 const [certAck, setCertAck] = useState(false)
 const [sensorAck, setSensorAck] = useState(false)
 const [checklistAck, setChecklistAck] = useState(false)
 const [confirmed, setConfirmed] = useState({})

 const actionRows = forecast.filter(r => r.action)
 const actionsAllDone = actionRows.length === 0 || actionRows.every((_, i) => confirmed[i])
 const resolved = [!!demandAck, certAck, sensorAck, checklistAck, actionsAllDone].filter(Boolean).length
 const total = 4 + (actionRows.length > 0 ? 1 : 0)
 const allDone = resolved === total

 const handleAccept = () => {
  setDemandAck('accept')
  logActivity({ actor: 'D. Kowalski', action: 'Demand adjustment accepted — Line 4 reduced to 85%', item: 'Line 4', type: 'intervention' })
 }
 const handleOverride = () => {
  setDemandAck('override')
  logActivity({ actor: 'D. Kowalski', action: 'Demand adjustment overridden — schedule held at 100%', item: 'Line 4', type: 'override' })
 }

 return (
  <div className="flex flex-col flex-1 overflow-hidden content-reveal">

   {/* Header */}
   <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 bg-stone2 border-b border-rule2">
    <div>
     <div className="font-body text-micro text-muted">T−30 · Line 4 · AM Shift · checked 05:45</div>
    </div>
    <div className="ml-auto">
     <StatusPill tone={allDone ? 'ok' : 'warn'}>
      {resolved} of {total} cleared
     </StatusPill>
    </div>
   </div>

   {/* Triage deck */}
   <div className="flex-1 overflow-y-auto">

    {/* Card 1 — Capacity decision (always first — most consequential) */}
    <TriageCard urgency="critical" resolved={!!demandAck}
     header={`Demand shortfall — schedule ${DEMAND_SIGNAL.variancePct}% over forecast`}
     resolvedLabel={demandAck === 'accept' ? 'Reduced to 85%' : 'Schedule held'}
     footer={<><Btn variant="primary" onClick={handleAccept}>Accept — reduce to 85%</Btn><Btn variant="secondary" onClick={handleOverride}>Override — hold schedule</Btn></>}>
     <div className="flex items-baseline gap-3">
      <span className="display-num text-score font-bold text-warn tabular-nums leading-none">+{DEMAND_SIGNAL.variancePct}%</span>
      <span className="font-body font-medium text-ink text-body">demand shortfall vs. today's schedule</span>
     </div>
     <p className="font-body text-ink text-body leading-relaxed">{DEMAND_SIGNAL.recommendation}.</p>
     <p className="font-body text-muted text-label flex items-start gap-1">
      <ChevronRight size={11} className="flex-shrink-0 mt-px" />Signal confidence {DEMAND_SIGNAL.confidence}% · {DEMAND_SIGNAL.source}
     </p>
    </TriageCard>

    {/* Card 2 — Cert gap */}
    <TriageCard urgency="critical" resolved={certAck}
     header="Cert mismatch — Reyes (L1) assigned L2 station"
     resolvedLabel="Reassigned"
     footer={<Btn variant="secondary" onClick={() => { setCertAck(true); logActivity({ actor: 'D. Kowalski', action: 'Reyes reassigned to L1 station — cert gap resolved', item: 'Reyes', type: 'intervention' }) }}>Reassign Reyes to L1 station</Btn>}>
     <p className="font-body text-ink text-body leading-relaxed">{PRE_SHIFT_VERIFICATION.certReadiness.note}</p>
     <p className="font-body text-muted text-label flex items-start gap-1">
      <ChevronRight size={11} className="flex-shrink-0 mt-px" />L2 station requires allergen certification — brief Reyes or reassign before start
     </p>
    </TriageCard>

    {/* Card 3 — Sensor stale */}
    <TriageCard urgency="warn" resolved={sensorAck}
     header={`${PRE_SHIFT_VERIFICATION.sensorHealth.staleLabel} sensor stale — last reading 2h 14m ago`}
     resolvedLabel="Acknowledged"
     footer={<Btn variant="secondary" onClick={() => { setSensorAck(true); logActivity({ actor: 'D. Kowalski', action: `${PRE_SHIFT_VERIFICATION.sensorHealth.staleLabel} stale sensor acknowledged — proceeding with reduced accuracy`, item: PRE_SHIFT_VERIFICATION.sensorHealth.staleLabel, type: 'intervention' }) }}>Acknowledge — proceed with reduced accuracy</Btn>}>
     <p className="font-body text-ink text-body leading-relaxed">{PRE_SHIFT_VERIFICATION.sensorHealth.note}</p>
     <p className="font-body text-muted text-label flex items-start gap-1">
      <ChevronRight size={11} className="flex-shrink-0 mt-px" />{PRE_SHIFT_VERIFICATION.sensorHealth.nominal} of {PRE_SHIFT_VERIFICATION.sensorHealth.total} signals nominal · {PRE_SHIFT_VERIFICATION.sensorHealth.staleLabel} last confirmed {PRE_SHIFT_VERIFICATION.sensorHealth.staleAge ?? '2h 14m'} ago
     </p>
    </TriageCard>

    {/* Card 4 — Checklist */}
    <TriageCard urgency="warn" resolved={checklistAck}
     header={`${PRE_SHIFT_VERIFICATION.checklist.complete} of ${PRE_SHIFT_VERIFICATION.checklist.total} safety checklist items complete`}
     resolvedLabel="Checklist signed"
     footer={<Btn variant="secondary" onClick={() => { setChecklistAck(true); logActivity({ actor: 'D. Kowalski', action: 'Pre-shift checklist signed — 4 outstanding items acknowledged', item: 'Checklist', type: 'intervention' }) }}>Sign off checklist</Btn>}>
     <p className="font-body text-ink text-body leading-relaxed">{PRE_SHIFT_VERIFICATION.checklist.note}</p>
     <p className="font-body text-muted text-label flex items-start gap-1">
      <ChevronRight size={11} className="flex-shrink-0 mt-px" />{PRE_SHIFT_VERIFICATION.checklist.outstanding} items outstanding before shift start
     </p>
    </TriageCard>

    {/* Card 5 — Forecast action items (dynamic, if any) */}
    {actionRows.length > 0 && (
     <TriageCard urgency="warn" resolved={actionsAllDone}
      header={`${actionRows.filter((_, i) => !confirmed[i]).length} pre-shift action${actionRows.filter((_, i) => !confirmed[i]).length !== 1 ? 's' : ''} outstanding`}
      resolvedLabel="All cleared">
      <div className="-mx-4 -mb-3 mt-1">
       {actionRows.map((row, i) => {
        const done = !!confirmed[i]
        return (
         <div key={i} className={`border-l-2 ${row.urgent ? 'border-l-danger' : 'border-l-rule2'} border-t border-rule2/50 px-4 py-3 flex items-center gap-3 ${done ? 'opacity-50' : ''}`}>
          <div className="flex-1 min-w-0">
           <div className={`font-body font-medium text-body leading-snug ${done ? 'line-through text-muted' : row.urgent ? 'text-danger' : 'text-ink'}`}>
            {row.action}
           </div>
           <p className="font-body text-muted text-label leading-snug mt-0.5 line-clamp-1">
            {row.name} · {row.time.replace('\n', ' ')}
           </p>
          </div>
          {row.urgent && !done && (
           <span className="font-body text-label text-danger bg-danger/[0.08] px-1.5 py-px rounded-btn flex-shrink-0">Critical</span>
          )}
          <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
           {done ? (
            <div className="w-7 h-7 rounded-full border border-ok/20 bg-ok/5 flex items-center justify-center" aria-label="Confirmed">
             <Check size={13} strokeWidth={2.5} className="text-ok" />
            </div>
           ) : (
            <button type="button"
             onClick={() => { setConfirmed(p => ({ ...p, [i]: true })); logActivity({ actor: 'D. Kowalski', action: `Confirmed: ${row.action}`, item: row.name, type: 'intervention' }) }}
             className="w-7 h-7 rounded-full border-2 border-rule2 bg-stone3 hover:border-ok hover:bg-ok/10 transition-colors flex items-center justify-center cursor-pointer"
             aria-label={`Confirm: ${row.action}`}>
             <Check size={13} strokeWidth={2} className="text-muted" />
            </button>
           )}
          </div>
         </div>
        )
       })}
      </div>
     </TriageCard>
    )}

    {/* Completion state */}
    {allDone && (
     <div className="px-5 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-ok mx-auto mb-3 flex items-center justify-center">
       <Check size={20} strokeWidth={2} className="text-stone" />
      </div>
      <div className="font-body text-ok font-medium text-body">Shift ready to start</div>
      <div className="font-body text-muted text-label mt-1">
       Sign-off complete · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {onStartShift && (
       <button type="button" onClick={onStartShift}
        className="mt-4 px-5 py-2.5 rounded-btn font-body font-medium text-base bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20 cursor-pointer transition-colors">
        Start shift →
       </button>
      )}
     </div>
    )}

   </div>
  </div>
 )
}

function SleepPickerDropdown({ triggerRef, onClose, onSelect }) {
 const dropRef = useRef(null)
 const [pos, setPos] = useState({ top: 0, right: 0 })
 useFocusTrap(dropRef)

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
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
  <div ref={dropRef} className="fixed z-50 plant-drop-in"
   style={{ top: pos.top, right: pos.right }}>
   <div className="w-44 bg-stone border border-rule shadow-raise overflow-hidden">
    <div className="plant-drop-in-content">
     <div className="px-4 pt-3 pb-2">
      <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-rule2">
       <Moon size={10} strokeWidth={2} className="text-muted" />
       <span className="font-body text-micro text-muted">Sleep mode</span>
      </div>
      {[
       { label: '15 minutes', value: 15 },
       { label: '30 minutes', value: 30 },
       { label: '1 hour',     value: 60 },
       { label: 'End of shift', value: 'eos' },
      ].map(opt => (
       <button key={opt.value} type="button"
        onClick={() => { onSelect(opt.value); onClose() }}
        className="flex items-center w-full py-2 font-body text-label text-ink hover:text-muted transition-colors">
        {opt.label}
       </button>
      ))}
     </div>
    </div>
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
 const [quietForm, setQuietForm] = useState({ open: false })
 const handleSetSleepMode = (preset) => {
  const base = new Date()
  let endTime
  if (preset === 15) { const t = new Date(base); t.setMinutes(t.getMinutes() + 15); endTime = t.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }
  else if (preset === 30) { const t = new Date(base); t.setMinutes(t.getMinutes() + 30); endTime = t.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }
  else if (preset === 60) { const t = new Date(base); t.setMinutes(t.getMinutes() + 60); endTime = t.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }
  else { endTime = 'end of shift' }
  addQuietPeriod({
   line: 'Line 4',
   startTime: base.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
   endTime,
   reason: 'Sleep mode',
   setBy: 'D. Kowalski',
  })
  setQuietForm({ open: false })
  logActivity({ actor: 'D. Kowalski', action: 'Sleep mode active — Compliance Monitor in log-only mode', item: 'Line 4', type: 'compliance' })
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
 const moonTriggerRef = useRef(null)
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

 {/* ── Shift Arc — time-first navigation ─────────────────────────────── */}
 <div className="flex-shrink-0 border-b border-rule2 bg-stone2">
  {(() => {
   const ARC_SEGMENTS = [
    {
     id: 'prepare', label: 'Prep', time: 'T−30',
     status: `${shiftData.forecast?.filter(r => r.action).length ?? 0} actions · ${PRE_SHIFT_VERIFICATION.certReadiness.ready}/${PRE_SHIFT_VERIFICATION.certReadiness.total} certs pass`,
    },
    {
     id: 'shift', label: 'Running', time: 'Now',
     status: `Line ${activeLine?.toUpperCase() ?? 'L4'} · Risk ${lineScore} · ${Math.max(0, pendingTaskCount)} active`,
     isNow: true,
    },
    {
     id: 'handoff', label: 'Handoff', time: 'T−45',
     status: '4 carry-forward items · draft in progress',
    },
   ]
   const hasSecondary = workerMode === 'robot' || workerMode === 'hybrid' || currentPlant?.id === 'ks'
   return (
    <div className="flex items-stretch">
     {/* Arc segments */}
     <div className="flex flex-1 relative">
      {ARC_SEGMENTS.map((seg, i) => {
       const isActive = activeTab === seg.id
       return (
        <button key={seg.id} type="button"
         onClick={() => setActiveTab(seg.id)}
         className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 relative transition-colors text-center hover:bg-stone3 ${isActive ? 'bg-stone3' : ''}`}>
         {/* node */}
         <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors z-10 relative ${
          seg.isNow
           ? 'bg-ok border-ok shadow-[0_0_6px_var(--color-ok)]'
           : isActive
           ? 'bg-signal border-signal'
           : 'bg-stone3 border-rule'
         }`} />
         <div className={`font-body font-medium text-label leading-none ${isActive ? 'text-ink' : seg.isNow ? 'text-ok' : 'text-muted'}`}>
          {seg.label}
         </div>
         <div className="font-body text-micro text-muted/70 leading-none">{seg.time}</div>
         <div className={`font-body text-micro leading-snug text-center mt-0.5 ${isActive ? 'text-muted' : 'text-muted/50'}`}>
          {seg.status}
         </div>
         {isActive && <div className="absolute bottom-0 left-0 right-0 h-px bg-signal" />}
        </button>
       )
      })}
     </div>
     {/* Secondary buttons */}
     <div className="flex-shrink-0 flex items-center gap-1 px-2 border-l border-rule2">
      {hasSecondary && (
       <button type="button" onClick={() => setActiveTab('fleet')}
        className={`font-body text-micro px-2 py-1.5 transition-colors ${activeTab === 'fleet' ? 'text-ink bg-stone3' : 'text-muted hover:text-ink'}`}>
        Fleet
       </button>
      )}
      {workerMode === 'hybrid' && (
       <button type="button" onClick={() => setActiveTab('allocation')}
        className={`font-body text-micro px-2 py-1.5 transition-colors ${activeTab === 'allocation' ? 'text-ink bg-stone3' : 'text-muted hover:text-ink'}`}>
        Alloc
       </button>
      )}
      <button ref={moonTriggerRef} type="button" onClick={() => !currentQuiet && setQuietForm(p => ({ open: !p.open }))}
       className={`relative p-1.5 transition-colors ${currentQuiet ? 'text-signal cursor-default' : 'text-muted hover:text-ink'}`} aria-label="Sleep mode" title="Sleep mode">
       <Moon size={11} strokeWidth={2} />
       {currentQuiet && <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-signal" />}
      </button>
     </div>
    </div>
   )
  })()}
 </div>

 {activeTab === 'handoff'    ? <HandoffIQ />
  : activeTab === 'fleet'      ? <RobotFleet />
  : activeTab === 'allocation' ? <ResourceAllocation />
  : activeTab === 'prepare'    ? <PrepareView forecast={shiftData.forecast} onStartShift={() => setActiveTab('shift')} />
  : <>
 {/* Quiet period banner — triggered by Moon icon in tab bar */}
 {currentQuiet && (
  <div className="flex items-center gap-3 px-5 py-2.5 bg-stone2 border-b border-rule2 flex-shrink-0">
   <Moon size={11} strokeWidth={2} className="text-signal flex-shrink-0" />
   <div className="flex-1 font-body text-label">
    <span className="font-medium text-ink">Sleep mode — </span>
    <span className="text-muted">Compliance Monitor in log-only mode · Until {currentQuiet.endTime}</span>
   </div>
   <Btn variant="ghost" onClick={() => clearQuietPeriod(currentQuiet.id)} className="flex-shrink-0">End sleep mode</Btn>
  </div>
 )}
 {quietForm.open && (
  <SleepPickerDropdown
   triggerRef={moonTriggerRef}
   onClose={() => setQuietForm({ open: false })}
   onSelect={handleSetSleepMode}
  />
 )}
 <ShiftIQV2 score={lineScore} lineLabel={`${activeLined?.name ?? 'Line 4'} · AM Shift`} supervisor={lineSupervisor} plant={currentPlant?.name ?? 'Salina KS'} isSupervisorView={viewingRole === 'supervisor'} />
 </>}
 </div>
 )
}
