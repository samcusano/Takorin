import { useState } from 'react'
import { handoffData, certExpiry, haccpData, robotFleetData } from '../data'
import { Btn, ActionBanner, PersonAvatar, AcceptanceGate, CarryForwardItem, SlidePanel, SecHd, Chip } from '../components/UI'
import { Check, AlertTriangle, Clock, Brain, Bot, CheckCircle, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'

const FINDING_TO_CASE = { sf1: 'I.', sf2: 'II.', sf3: 'II.' }

function CarryForwardDetailPanel({ item, onClose }) {
 if (!item) return null
 const accentColor = item.urgency === 'danger' ? '#C43820' : '#C4920A'
 return (
  <SlidePanel
   title={item.title}
   subtitle={`Carry-forward · ${item.urgency === 'danger' ? 'Critical' : 'Warning'}`}
   accentColor={accentColor}
   ariaLabel={`Carry-forward context — ${item.title}`}
   onClose={onClose}
   footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}
  >
   <div>
    <div className="font-body text-ghost text-[10px] mb-1">Operational impact</div>
    <div className="font-body text-ink text-[12px] leading-relaxed">{item.operationalImpact}</div>
   </div>
   <div>
    <div className="font-body text-ghost text-[10px] mb-1">Context from outgoing supervisor</div>
    <div className="font-body text-ink2 text-[12px] leading-relaxed">{item.ownerContext}</div>
   </div>
   <div>
    <div className="font-body text-ghost text-[10px] mb-1">Recommended action for incoming shift</div>
    <div className="font-body text-ink text-[12px] leading-relaxed">{item.recommendedAction}</div>
   </div>
   {item.resolvedInShift && (
    <div className="flex items-center gap-2 p-3 bg-ok/10 border border-ok/20">
     <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
     <span className="font-body text-ok text-[11px]">
      Actioned this shift — verify completion and confirm before accepting handoff
     </span>
    </div>
   )}
  </SlidePanel>
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
      return <span key={i} className={`font-body text-[10px] px-1.5 py-px rounded-btn ${cls}`}>{s.label}</span>
     })}
    </div>
    {row.action && <p className={`font-body text-[10px] ${hasConflict ? 'text-warn' : 'text-ghost'}`}>{row.action}</p>}
   </div>
  </div>
 )
}


function LayoutGrid({ d, signed, setSigned, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward, handleAcceptShift, handoffAccepted }) {
 const navigate = useNavigate()
 const [viewingItem, setViewingItem] = useState(null)
 return (
  <>
  <CarryForwardDetailPanel item={viewingItem} onClose={() => setViewingItem(null)} />
  <div className="flex flex-col flex-1 overflow-hidden">
   <AcceptanceGate
    incomingSupervisor="M. Santos"
    shiftTime="PM 14:00–22:00"
    carryForwardCount={carryForwardCount}
    acknowledgedCount={acknowledgedCount}
    allAcknowledged={allAcknowledged}
    onAccept={handleAcceptShift}
    disabled={!signed}
   />
   {!signed && (() => {
    // Document confidence: stale HR data (Lindqvist cert 4h stale) drops confidence
    const docConfidence = 85 // 4 of 5 items fresh; 1 stale (HR/cert)
    const isLowConfidence = docConfidence < 70
    return (
     <ActionBanner
      tone={isLowConfidence ? 'warn' : 'ok'}
      headline={
       isLowConfidence
        ? `Document confidence ${docConfidence}% — data gaps present. Review carefully before signing.`
        : `Kowalski needs to sign before Santos can accept the shift`
      }
      body={
       isLowConfidence
        ? 'One or more synthesized items are based on stale data. Signing creates a legal record. Verify stale items manually first.'
        : 'D. Kowalski signing off · Incoming: M. Santos · April 16, 14:02'
      }
     >
      {isLowConfidence ? (
       <button
        type="button"
        onClick={() => setSigned(true)}
        className="font-body font-medium text-[12px] px-4 py-2.5 min-h-[40px] inline-flex items-center gap-2 border border-warn/40 bg-warn/10 text-warn hover:bg-warn/20 transition-colors rounded-btn"
       >
        Acknowledge data gaps and sign
       </button>
      ) : (
       <Btn variant="secondary" onClick={() => setSigned(true)}>Sign off — Kowalski</Btn>
      )}
     </ActionBanner>
    )
   })()}
   {handoffAccepted ? (
    <div className="flex items-center gap-3 px-5 py-4 bg-ok/[0.08] border-b-2 border-b-ok flex-shrink-0">
     <Check size={16} strokeWidth={2.5} className="text-ok flex-shrink-0" />
     <div>
      <div className="font-body font-semibold text-ok text-[13px]">Shift accepted by M. Santos</div>
      <div className="font-body text-ok/70 text-[11px] mt-0.5">Handoff complete · Line 4 · April 16, 14:02 · HO-2604161</div>
     </div>
    </div>
   ) : signed && allAcknowledged ? (
    <div className="flex items-center gap-3 px-4 py-3 bg-ok/10 border-b border-ok/20 flex-shrink-0">
     <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
     <span className="font-body text-ok text-[12px]">Ready to accept · All carry-forward items acknowledged</span>
    </div>
   ) : null}
   <div className="flex flex-1 overflow-hidden">

    {/* Left: carry-forward queue */}
    <div className="w-[55%] border-r border-rule2 flex flex-col">
     <div className="px-4 py-2.5 bg-stone2 border-b border-rule2 flex-shrink-0">
      <div className="font-body font-medium text-ink text-[12px]">
       Carry-forward items ({acknowledgedCount}/{carryForwardCount} acknowledged)
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
       <Brain size={9} strokeWidth={1.75} className="text-ghost flex-shrink-0" />
       <span className="font-body text-ghost text-[10px]">
        <span className="text-muted font-medium">91%</span>
        {' '}overall synthesis confidence · urgency from shift findings and cert records
       </span>
      </div>
     </div>
     {/* Stale data warning — per source */}
     <div className="px-4 py-2 bg-warn/[0.05] border-b border-rule2 flex-shrink-0">
      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1.5">Data freshness — verify stale items before signing</div>
      {[
       { source: 'Sensor A-7', age: '8 min', tone: 'ok' },
       { source: 'CAPA-2604-001', age: '22 min', tone: 'ok' },
       { source: 'Lindqvist cert status', age: '4h 12min', tone: 'warn', stale: true },
       { source: 'R-03 telemetry', age: '4 min', tone: 'ok' },
      ].map(s => (
       <div key={s.source} className="flex items-center gap-2 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.tone === 'ok' ? 'bg-ok' : 'bg-warn'}`} />
        <span className="font-body text-muted text-[10px] flex-1">{s.source}</span>
        <span className={`font-body text-[10px] ${s.stale ? 'text-warn font-medium' : 'text-ghost'}`}>
         {s.age}{s.stale ? ' ⚠' : ''}
        </span>
       </div>
      ))}
      <p className="font-body text-warn text-[10px] mt-1">
       Lindqvist cert status is stale — verify manually before signing.
      </p>
     </div>
     <div className="overflow-y-auto flex-1">
      {carryForwardCount > 0 ? carryForwardItems.map(item => (
       <CarryForwardItem
        key={item.id}
        item={item}
        acknowledged={carryForwardAcknowledged.has(item.id)}
        onAcknowledge={handleAcknowledgeCarryForward}
        onView={() => setViewingItem(item)}
       />
      )) : (
       <div className="px-4 py-8 text-center font-body text-ghost text-[11px]">
        No carry-forward items · shift handed off cleanly
       </div>
      )}
     </div>
    </div>

    {/* Right: context cards */}
    <div className="w-[45%] overflow-y-auto flex flex-col">
     {/* Shift notes */}
     <div className="border-b border-rule2">
      <div className="px-4 py-2.5 border-b border-rule2 font-body font-medium text-ink text-[12px]">Shift notes</div>
      <div className="px-4 pt-3 pb-1">
       <div className="flex items-center gap-2 mb-3">
        <PersonAvatar name={d.shiftNotes.author} size={20} />
        <div>
         <span className="font-body font-medium text-ink text-[11px]">{d.shiftNotes.author}</span>
         <span className="font-body text-ghost text-[10px] ml-1.5">{d.shiftNotes.time}</span>
        </div>
       </div>
       <ul className="space-y-2 pb-3">
        {d.shiftNotes.body.map((note, i) => (
         <li key={i} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-ghost flex-shrink-0 mt-1.5" />
          <span className="font-body text-ink2 text-[11px] leading-relaxed">{note}</span>
         </li>
        ))}
       </ul>
      </div>
     </div>
     <div className="border-b border-rule2">
      <div className="px-4 py-2.5 border-b border-rule2 font-body font-medium text-ink text-[12px]">Operator briefing</div>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rule2">
       <PersonAvatar name="M. Santos" size={26} />
       <div>
        <div className="font-body font-medium text-ink text-[12px]">M. Santos — Incoming PM supervisor</div>
        <div className="font-body text-ghost text-[10px]">Line 4 · 14:00–22:00</div>
       </div>
      </div>
      {haccpData.ccps.map((ccp, i) => (
       <div key={i} className="flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0">
        <AlertTriangle size={12} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
        <div>
         <div className="font-body font-medium text-ink text-[12px]">{ccp.station} · {ccp.ccp}</div>
         <div className="font-body text-ghost text-[10px]">{ccp.limit}</div>
        </div>
       </div>
      ))}
     </div>
     <div className="border-b border-rule2">
      <div className="px-4 py-2.5 border-b border-rule2 font-body font-medium text-ink text-[12px]">Cert alerts</div>
      {certExpiry.filter(c => c.tone !== 'ok').map((c, i) => (
       <div key={i} className={`flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0 ${c.tone === 'danger' ? 'bg-danger/[0.03]' : ''}`}>
        <Clock size={12} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${c.tone === 'danger' ? 'text-danger' : 'text-warn'}`} />
        <div>
         <div className={`font-body font-medium text-[12px] ${c.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{c.name} · {c.cert}</div>
         <div className={`font-body text-[10px] ${c.tone === 'danger' ? 'text-danger/80' : 'text-ghost'}`}>{c.note}</div>
        </div>
       </div>
      ))}
     </div>
     <div>
      <div className="px-4 py-2.5 border-b border-rule2 font-body font-medium text-ink text-[12px]">Upcoming staffing</div>
      {d.forecast.map((row, i) => <ForecastRow key={i} row={row} />)}
     </div>
    </div>

   </div>
  </div>
  </>
 )
}


// ── Machine State Handoff (robot mode) ─────────────────────────────────────

function MachineStateHandoff() {
 const { units, faultLog } = robotFleetData
 const [systemValidated, setSystemValidated] = useState(false)
 const faults = faultLog.filter(f => !f.resolved && f.severity !== 'info')

 return (
  <div className="flex flex-col h-full overflow-hidden content-reveal">
   {/* Page header — same pattern as human HandoffIQ */}
   <div className="px-6 py-5 border-b border-rule2 bg-stone" style={{ borderLeft: '6px solid var(--color-ochre)' }}>
    <div className="font-body font-semibold text-ghost text-[10px] uppercase tracking-widest mb-2">
     Machine State Handoff · Robotic workforce · Wichita Plant
    </div>
    <div className="font-display font-bold text-[40px] text-ink leading-none">
     Shift boundary <span className="font-light text-ochre">14:00</span>
    </div>
    <div className="flex gap-6 mt-2">
     {[
      { role: 'Online units', val: `${units.filter(u => u.status === 'online').length} of ${units.length}` },
      { role: 'Active faults', val: String(faults.length) },
      { role: 'Pending maintenance', val: String(units.filter(u => u.maintenanceSchedule.remainingHours <= 24).length) },
     ].map(m => (
      <div key={m.role} className="flex gap-1.5 items-baseline">
       <span className="font-body text-ghost text-[10px]">{m.role}</span>
       <span className="font-body text-ink text-[12px] font-medium">{m.val}</span>
      </div>
     ))}
    </div>
   </div>

   <div className="flex-1 overflow-y-auto bg-stone">

    {/* AI synthesis banner */}
    <div className="flex items-center gap-3 px-5 py-3 border-b border-rule2 bg-ochre/[0.06] border-b-2 border-b-ochre/30">
     <Cpu size={13} className="text-ochre flex-shrink-0" strokeWidth={1.75} />
     <div className="flex-1">
      <span className="font-body font-semibold text-ink text-[12px]">Handoff Synthesis Agent — pre-populated from live fleet data</span>
      <div className="font-body text-muted text-[10px] mt-0.5">4 items synthesized · 1 requires director review · Generated 13:15</div>
     </div>
     <span className="font-body text-ochre text-[10px] px-2 py-0.5 bg-ochre/10 border border-ochre/30">Review &amp; validate</span>
    </div>

    {/* Active faults */}
    {faults.length > 0 && (
     <>
      <SecHd tag="Action required" title="Active faults — must resolve or document before handoff" />
      {faults.map((f, i) => (
       <div key={i} className={`flex items-start gap-4 px-5 py-3 border-b border-rule2 ${f.severity === 'danger' ? 'bg-danger/[0.015]' : 'bg-warn/[0.015]'}`}>
        <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${f.severity === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={1.75} />
        <div className="flex-1">
         <div className="font-body font-medium text-ink text-[12px]">{f.unit} — {f.fault}</div>
         {f.techAssigned && <div className="font-body text-ghost text-[10px] mt-0.5">Tech: {f.techAssigned}{f.eta ? ` · ETA ${f.eta}` : ''}</div>}
        </div>
       </div>
      ))}
     </>
    )}

    {/* Unit calibration */}
    <SecHd tag="Fleet status" title="Unit calibration &amp; program state" />
    {units.filter(u => u.status !== 'fault').map((u, i) => (
     <div key={u.id} className="flex items-center gap-4 px-5 py-3 border-b border-rule2 hover:bg-stone2 transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.status === 'online' ? 'bg-ok beat' : 'bg-warn'}`} />
      <span className="font-body text-muted text-[10px] w-12 flex-shrink-0 tabular-nums">{u.id}</span>
      <span className="font-body font-medium text-ink text-[12px] flex-1">{u.name}</span>
      <span className="font-body text-ghost text-[10px]">{u.programVersion}</span>
      <Chip tone={u.calibrationStatus === 'expired' ? 'danger' : 'ok'}>
       {u.calibrationStatus === 'expired' ? 'Cal expired' : 'Cal valid'}
      </Chip>
      <span className={`font-body text-[10px] tabular-nums ${u.maintenanceSchedule.remainingHours <= 24 ? 'text-warn' : 'text-ghost'}`}>
       {u.maintenanceSchedule.remainingHours}h to PM
      </span>
     </div>
    ))}

    {/* Maintenance backlog */}
    <SecHd tag="Carry-forward" title="Maintenance backlog" />
    {[
     { unit:'R-03', item:'Bearing inspection — vibration anomaly detected', urgency:'warn' },
     { unit:'R-04', item:'PM window — estimated return to service 14:30', urgency:'info' },
     { unit:'R-08', item:'Drive fault F-22 — awaiting technician resolution', urgency:'danger' },
    ].map((item, i) => (
     <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-rule2">
      <Chip tone={item.urgency === 'danger' ? 'danger' : item.urgency === 'warn' ? 'warn' : 'muted'}>
       {item.urgency === 'danger' ? 'Critical' : item.urgency === 'warn' ? 'Attention' : 'Info'}
      </Chip>
      <span className="font-body text-muted text-[10px] w-10 flex-shrink-0">{item.unit}</span>
      <span className="font-body text-ink text-[12px] flex-1">{item.item}</span>
     </div>
    ))}

    {/* System validation gate */}
    <div className={`mx-5 my-5 px-5 py-4 border-l-2 ${systemValidated ? 'border-l-ok bg-ok/[0.06] border border-ok/20' : 'border-l-rule bg-stone2 border border-rule2'}`}>
     <div className="flex items-center justify-between">
      <div>
       <div className="font-body font-semibold text-ink text-[13px]">System validation gate</div>
       <div className="font-body text-muted text-[11px] mt-0.5">
        Automated check: all critical systems in documented state. No supervisor signature required in robotic mode.
       </div>
      </div>
      {systemValidated
       ? <div className="flex items-center gap-2 text-ok flex-shrink-0">
          <Check size={14} strokeWidth={2.5} />
          <span className="font-body font-medium text-[12px]">Validated</span>
         </div>
       : <Btn variant="primary" onClick={() => setSystemValidated(true)}>Run validation</Btn>
      }
     </div>
     {systemValidated && (
      <div className="font-body text-ok text-[11px] mt-2 slide-in">
       All 10 online units in calibrated state · 2 units in documented maintenance hold · Fault log reviewed · Handoff complete
      </div>
     )}
    </div>

   </div>
  </div>
 )
}

// ── Main HandoffIQ ──────────────────────────────────────────────────────────

export default function HandoffIQ() {
 const d = handoffData
 const navigate = useNavigate()
 const { handoffSigned: signed, setHandoffSigned: setSigned,
  carryForwardAcknowledged, setCarryForwardAcknowledged,
  logActivity,
  currentPlant,
  workerMode,
  shiftActed,
  handoffAccepted, setHandoffAccepted } = useAppState()

 const actedFindingIds = Object.keys(shiftActed || {}).filter(id => shiftActed[id])

 const actedCaseNums = new Set(
  actedFindingIds.map(id => FINDING_TO_CASE[id]).filter(Boolean)
 )

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
   recommendedAction: c.recommendedAction || c.events?.[0]?.val || '',
   resolvedInShift: actedCaseNums.has(c.num),
  }))

 const carryForwardCount = carryForwardItems.length
 const acknowledgedCount = carryForwardItems.filter(item => carryForwardAcknowledged.has(item.id)).length
 const allAcknowledged = acknowledgedCount === carryForwardCount && carryForwardCount > 0

 const handleAcknowledgeCarryForward = (id) => {
  setCarryForwardAcknowledged(prev => new Set([...prev, id]))
  logActivity({ actor: 'M. Santos', action: 'Acknowledged carry-forward item', item: id, type: 'acknowledgment' })
 }

 const handleAcceptShift = () => {
  setHandoffAccepted(true)
  logActivity({ actor: 'M. Santos', action: 'Accepted shift handoff', item: `Line 4 · ${new Date().toLocaleDateString()}`, type: 'acknowledgment' })
 }

 const props = {
  d, signed, setSigned, currentPlant,
  carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged,
  carryForwardAcknowledged, handleAcknowledgeCarryForward, handleAcceptShift,
  handoffAccepted,
 }

 if (workerMode === 'robot') {
  return (
   <div className="flex flex-col h-full overflow-hidden">
    <MachineStateHandoff />
   </div>
  )
 }

 return (
  <div className="flex flex-col h-full overflow-hidden">
   <LayoutGrid {...props} />
  </div>
 )
}
