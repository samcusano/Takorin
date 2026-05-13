import { useState } from 'react'
import { handoffData, certExpiry, haccpData, crewHoursData } from '../data'
import { StatCell, Btn, ActionBanner, PersonAvatar, AcceptanceGate, CarryForwardItem, ExpandableSection } from '../components/UI'
import { Check, AlertTriangle, Clock } from 'lucide-react'
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

 // Filter and sort carry-forward items — danger first, then warn
 const carryForwardItems = d.cases
  .filter(c => c.urgency === 'warn' || c.urgency === 'danger')
  .sort((a, b) => {
   const order = { danger: 0, warn: 1 }
   return (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2)
  })
  .map(c => ({
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
  <ExpandableSection title="Operator briefing" defaultOpen={true}>
   {/* Incoming supervisor */}
   <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rule2 bg-stone2">
    <PersonAvatar name="M. Santos" size={28} />
    <div>
     <div className="font-body font-medium text-ink text-[12px]">M. Santos — Incoming PM supervisor</div>
     <div className="font-body text-ghost text-[10px]">Line 4 · 14:00–22:00 · Review all carry-forward items before accepting</div>
    </div>
   </div>
   {/* Active CCPs */}
   <div className="px-4 py-1.5 bg-stone3 border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Active CCPs this shift</span>
   </div>
   {haccpData.ccps.map((ccp, i) => (
    <div key={i} className="flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0">
     <AlertTriangle size={12} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
     <div>
      <div className="font-body font-medium text-ink text-[12px]">{ccp.station} · {ccp.ccp}</div>
      <div className="font-body text-ghost text-[10px]">{ccp.limit} · {ccp.skuNote}</div>
     </div>
    </div>
   ))}
   {/* Cert alerts */}
   <div className="px-4 py-1.5 bg-stone3 border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Cert alerts</span>
   </div>
   {certExpiry.filter(c => c.tone !== 'ok').map((c, i) => (
    <div key={i} className={`flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0 ${c.tone === 'danger' ? 'bg-danger/[0.03]' : ''}`}>
     <Clock size={12} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${c.tone === 'danger' ? 'text-danger' : 'text-warn'}`} />
     <div>
      <div className={`font-body font-medium text-[12px] ${c.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{c.name} · {c.cert}</div>
      <div className={`font-body text-[10px] ${c.tone === 'danger' ? 'text-danger/80' : 'text-ghost'}`}>{c.note}</div>
     </div>
    </div>
   ))}
  </ExpandableSection>

  <ExpandableSection title="Shift record details">
   {/* Key stats */}
   <div className="grid grid-cols-3 border-b border-rule2">
    {d.stats.map((s, i) => (
     <div key={i} className="px-4 py-3 border-r border-rule2 last:border-r-0">
      <div className="font-body text-ghost text-[10px] mb-0.5">{s.label}</div>
      <div className="display-num text-xl text-ink">{s.value}</div>
      <div className="font-body text-ghost text-[10px]">{s.sub}</div>
     </div>
    ))}
   </div>
   {/* Shift timeline */}
   <ShiftTimeline events={shiftEvents} />
   {/* Interventions taken */}
   <div className="px-4 py-1.5 bg-stone3 border-t border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Interventions taken</span>
   </div>
   {d.cases.filter(c => c.urgency === 'ok' && c.events?.length).map((c, i) => (
    <div key={i} className="border-l-2 border-l-ok border-b border-rule2 last:border-b-0 px-4 py-2.5">
     <div className="font-body font-medium text-ink text-[12px] mb-1">{c.title}</div>
     {c.events.map((e, j) => (
      <div key={j} className="flex gap-2 font-body text-[10px] text-ghost">
       <span className="text-muted flex-shrink-0">{e.time}</span>
       <span>{e.val}</span>
      </div>
     ))}
    </div>
   ))}
  </ExpandableSection>

  <ExpandableSection title="Upcoming shifts & staffing">
   {/* 48h forecast */}
   <div className="px-4 py-1.5 bg-stone3 border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Next 48 hours forecast</span>
   </div>
   {d.forecast.map((row, i) => (
    <ForecastRow key={i} row={row} />
   ))}
   {/* Cert watch */}
   <div className="px-4 py-1.5 bg-stone3 border-t border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Cert watch</span>
   </div>
   {certExpiry.map((c, i) => (
    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2 last:border-b-0">
     <div>
      <div className="font-body font-medium text-ink text-[12px]">{c.name}</div>
      <div className="font-body text-ghost text-[10px]">{c.cert} · {c.role}</div>
     </div>
     <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
      c.tone === 'danger' ? 'bg-danger/10 text-danger' :
      c.tone === 'warn' ? 'bg-warn/10 text-warn' :
      'bg-ok/10 text-ok'
     }`}>
      {c.expiresIn === 0 ? 'Expires tonight' : `${c.expiresIn}d`}
     </span>
    </div>
   ))}
   {/* Crew hours */}
   <div className="px-4 py-1.5 bg-stone3 border-t border-b border-rule2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Crew hours this week</span>
   </div>
   {Object.entries(crewHoursData).map(([name, data]) => {
    const overHours = data.hoursThisWeek > 50
    const overConsec = data.consecutive >= 7
    return (
     <div key={name} className="flex items-center justify-between px-4 py-2 border-b border-rule2 last:border-b-0">
      <div className="flex items-center gap-2">
       <PersonAvatar name={name} size={20} />
       <span className="font-body text-ink text-[11px]">{name}</span>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
       <span className={`font-body ${overHours ? 'text-warn font-medium' : 'text-ghost'}`}>{data.hoursThisWeek}h this week</span>
       <span className={`font-body ${overConsec ? 'text-warn font-medium' : 'text-ghost'}`}>{data.consecutive} days consecutive</span>
      </div>
     </div>
    )
   })}
  </ExpandableSection>

 </div>

 </div>
 )
}
