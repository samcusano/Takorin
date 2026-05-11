import { useState, useEffect } from 'react'
import { handoffData, sanitationLogs, certExpiry, haccpData, scheduleData, crewHoursData } from '../data'
import { Urg, StatCell, SP, SPRow, SecHd, Btn, ConsequenceNotice, Layout, ActionBanner, PersonAvatar, HoldButton, AcceptanceGate, CarryForwardItem, ExpandableSection } from '../components/UI'
import { ChevronRight, ArrowRight, Check, AlertTriangle } from 'lucide-react'
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
 <div
  className="px-4 py-4 overflow-x-auto"
  role="region"
  aria-label="Shift timeline — scroll horizontally to see all events"
  tabIndex={0}
 >
 <div className="relative" style={{ minWidth: 520 }}>
 <div className="absolute h-px bg-rule2" style={{ top: 28, left: 0, right: 0 }} />
 <div className="flex">
 {events.map((e, i) => (
 <div key={i} className="flex flex-col items-center flex-1">
 <span className="font-body text-ghost text-[10px] h-6 flex items-end pb-1 leading-none">{e.time}</span>
 <div className={`w-2.5 h-2.5 rounded-full relative z-10 ${dotColor[e.tone]}`} />
 <div className={`font-body font-medium text-[10px] mt-2 text-center leading-tight px-1 ${labelColor[e.tone]}`}>{e.label}</div>
 <div className="font-body text-ghost text-[10px] mt-0.5 text-center leading-tight px-1">{e.detail}</div>
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
 carryForwardAcknowledged, setCarryForwardAcknowledged,
 logActivity,
 currentPlant } = useAppState()

 // Filter for critical carry-forward items (warn + danger urgency)
 const carryForwardItems = d.cases.filter(c => c.urgency === 'warn' || c.urgency === 'danger').map(c => ({
  id: c.num,
  urgency: c.urgency,
  title: c.title,
  operationalImpact: c.desc,
  ownerContext: c.evidence || 'Documented in shift record',
  recommendedAction: c.events?.[0]?.val || 'Review shift notes for action steps'
 }))

 const carryForwardCount = carryForwardItems.length
 const acknowledgedCount = carryForwardItems.filter(item => carryForwardAcknowledged.has(item.id)).length
 const allAcknowledged = acknowledgedCount === carryForwardCount && carryForwardCount > 0

 const handleAcknowledgeCarryForward = (id) => {
  setCarryForwardAcknowledged(prev => new Set([...prev, id]))
  logActivity({ actor: 'M. Santos', action: 'Acknowledged carry-forward item', item: id, type: 'acknowledgment' })
 }

 const handleAcceptShift = () => {
  setSigned(true)
  logActivity({ actor: 'M. Santos', action: 'Accepted shift handoff', item: `Line 4 · ${new Date().toLocaleDateString()}`, type: 'acknowledgment' })
 }

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">

 {/* Sticky Acceptance Gate */}
 <AcceptanceGate
  incomingSupervisor="M. Santos"
  shiftTime="PM 14:00–22:00"
  carryForwardCount={carryForwardCount}
  acknowledgedCount={acknowledgedCount}
  allAcknowledged={allAcknowledged}
  onAccept={handleAcceptShift}
  disabled={!signed}
 />

 {/* Outgoing supervisor signature step */}
 {!signed && (
  <ActionBanner
   tone="ok"
   headline={`Shift handoff awaiting outgoing signature — ${currentPlant?.name || 'Salina Campus'} · Line 4`}
   body="D. Kowalski signing off · Incoming: M. Santos · April 16, 14:02"
  >
   <Btn variant="secondary" onClick={() => setSigned(true)}>Sign handoff — Kowalski</Btn>
  </ActionBanner>
 )}

 {/* Complete — both parties signed */}
 {signed && allAcknowledged && (
  <div className="flex items-center gap-3 px-4 py-3 bg-ok/10 border-b border-ok/20 flex-shrink-0">
   <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
   <span className="font-body text-ok text-[12px]">
    Ready to accept · All carry-forward items acknowledged
   </span>
  </div>
 )}

 {/* Simplified Stats */}
 <div className="grid grid-cols-3 border-b border-rule2 bg-stone flex-shrink-0">
  <StatCell label="Line" value="4" sub="Salina Campus" tone="ok" />
  <StatCell label="Incoming" value="M. Santos" sub="14:00 shift start" tone="ok" />
  <StatCell label="Carry-forward" value={String(carryForwardCount)} sub={carryForwardCount > 0 ? 'require acknowledgment' : 'all clear'} tone={carryForwardCount > 0 ? 'warn' : 'ok'} />
 </div>

 {/* Main content — Carry-forward queue first (primary), then collapsed context */}
 <div className="flex-1 overflow-y-auto bg-stone">
  {/* Carry-forward queue — THE PRODUCT */}
  {carryForwardCount > 0 ? (
   <div className="border-b border-rule2">
    <div className="px-4 py-2.5 bg-stone2 font-body font-medium text-ink text-[12px]">
     Carry-forward items ({acknowledgedCount}/{carryForwardCount} acknowledged)
    </div>
    {carryForwardItems.map(item => (
     <CarryForwardItem
      key={item.id}
      item={item}
      acknowledged={carryForwardAcknowledged.has(item.id)}
      onAcknowledge={handleAcknowledgeCarryForward}
     />
    ))}
   </div>
  ) : (
   <div className="px-4 py-8 text-center font-body text-ghost text-[11px]">
    No carry-forward items · shift handed off cleanly
   </div>
  )}

  {/* Expandable context sections */}
  <ExpandableSection title="Operator briefing">
   <div className="border-b border-rule2">
    <div className="px-4 py-3 font-body text-muted text-[11px] italic">
     Operator-specific safety notes and flagged items
    </div>
   </div>
  </ExpandableSection>

  <ExpandableSection title="Shift record details">
   <div className="border-b border-rule2">
    <div className="px-4 py-3 font-body text-muted text-[11px] italic">
     Full shift events, timeline, and interventions taken
    </div>
   </div>
  </ExpandableSection>

  <ExpandableSection title="Upcoming shifts & staffing">
   <div className="border-b border-rule2">
    <div className="px-4 py-3 font-body text-muted text-[11px] italic">
     Next 48 hours readiness and crew availability
    </div>
   </div>
  </ExpandableSection>

 </div>

 </div>
 )
}
