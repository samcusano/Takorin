import { useState } from 'react'
import { handoffData, certExpiry, haccpData, robotFleetData } from '../data'
import { Btn, PersonAvatar, CarryForwardItem, SlidePanel, StatusPill } from '../components/UI'
import { Check, AlertTriangle, Clock, Brain, Bot, CheckCircle, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'

const FINDING_TO_CASE = { sf1: 'I.', sf2: 'II.', sf3: 'II.' }

function CarryForwardDetailPanel({ item, onClose }) {
 if (!item) return null
 const accentColor = item.urgency === 'danger' ? 'var(--color-danger)' : 'var(--color-warn)'
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
    <div className="font-body text-muted text-label mb-1">Operational impact</div>
    <div className="font-body text-ink text-body leading-relaxed">{item.operationalImpact}</div>
   </div>
   <div>
    <div className="font-body text-muted text-label mb-1">Context from outgoing supervisor</div>
    <div className="font-body text-ink2 text-body leading-relaxed">{item.ownerContext}</div>
   </div>
   <div>
    <div className="font-body text-muted text-label mb-1">Recommended action for incoming shift</div>
    <div className="font-body text-ink text-body leading-relaxed">{item.recommendedAction}</div>
   </div>
   {item.resolvedInShift && (
    <div className="flex items-center gap-2 p-3 bg-ok/10 border border-ok/20">
     <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
     <span className="font-body text-ok text-label">
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
   <div className="w-[72px] flex-shrink-0 px-3 py-2.5 border-r border-rule2 font-body text-muted text-label leading-relaxed whitespace-pre-line">{row.time}</div>
   <div className={`w-10 flex-shrink-0 px-2 pt-2.5 display-num text-head ${scoreColor}`}>{row.score}</div>
   <div className="flex-1 px-3 py-2.5">
    <div className="font-body font-medium text-ink text-body mb-1">{row.name}</div>
    <div className="flex gap-1.5 flex-wrap mb-1">
     {signals.map((s, i) => {
      const cls = s.tone === 'ok' ? 'text-ok bg-ok/10' : (s.tone === 'bad' || s.tone === 'danger') ? 'text-danger bg-danger/[0.04]' : 'text-warn bg-warn/10'
      return <span key={i} className={`font-body text-label px-1.5 py-px ${cls}`}>{s.label}</span>
     })}
    </div>
    {row.action && <p className={`font-body text-label ${hasConflict ? 'text-warn' : 'text-muted'}`}>{row.action}</p>}
   </div>
  </div>
 )
}


function LayoutGrid({ d, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward }) {
 const navigate = useNavigate()
 const [viewingItem, setViewingItem] = useState(null)
 const criticalCount = carryForwardItems.filter(i => i.urgency === 'danger').length
 const pendingItems = carryForwardItems.filter(item => !carryForwardAcknowledged.has(item.id))
 return (
  <>
  <CarryForwardDetailPanel item={viewingItem} onClose={() => setViewingItem(null)} />

   {/* ── Handoff summary stats ────────────────────────────────────── */}
   <div className="flex-shrink-0 flex divide-x divide-rule2 border-b border-rule2 bg-stone">
    <div className="px-5 py-3 min-w-0">
     <div className="font-body text-micro text-muted tracking-widest mb-1">Carry-forward</div>
     <div className="flex items-baseline gap-2">
      <span className={`display-num text-metric leading-none ${criticalCount > 0 ? 'text-danger' : carryForwardCount > 0 ? 'text-warn' : 'text-ok'}`}>{carryForwardCount}</span>
      {criticalCount > 0 && <span className="font-body text-danger text-label">{criticalCount} critical</span>}
      {criticalCount === 0 && carryForwardCount > 0 && <span className="font-body text-warn text-label">watch</span>}
      {carryForwardCount === 0 && <span className="font-body text-ok text-label">all clear</span>}
     </div>
    </div>
    <div className="px-5 py-3 min-w-0">
     <div className="font-body text-micro text-muted tracking-widest mb-1">Acknowledged</div>
     <div className="flex items-baseline gap-2">
      <span className={`display-num text-metric leading-none ${allAcknowledged ? 'text-ok' : 'text-muted'}`}>{acknowledgedCount}<span className="text-muted">/{carryForwardCount}</span></span>
      {allAcknowledged && <span className="font-body text-ok text-label">ready</span>}
     </div>
    </div>
    <div className="px-5 py-3 min-w-0">
     <div className="font-body text-micro text-muted tracking-widest mb-1">Synthesis confidence</div>
     <div className="flex items-baseline gap-2">
      <span className="display-num text-metric leading-none text-ok">91%</span>
      <span className="font-body text-muted text-label">4 of 5 sources fresh</span>
     </div>
    </div>
    <div className="px-5 py-3 min-w-0">
     <div className="font-body text-micro text-muted tracking-widest mb-1">Cert coverage</div>
     <div className="flex items-baseline gap-2">
      <span className="display-num text-metric leading-none text-warn">1 gap</span>
      <span className="font-body text-muted text-label">Sauce Dosing L2</span>
     </div>
    </div>
    <div className="px-5 py-3 min-w-0 flex-1">
     <div className="font-body text-micro text-muted tracking-widest mb-1">Risk at handoff</div>
     <div className="flex items-baseline gap-2">
      <span className="display-num text-metric leading-none text-danger">78</span>
      <span className="font-body text-danger text-label">at risk</span>
     </div>
    </div>
   </div>

   <div className="flex flex-1 overflow-hidden">

    {/* Left: carry-forward queue */}
    <div className="w-[55%] border-r border-rule2 flex flex-col">
     <div className="px-4 py-3 bg-stone2 border-b border-rule2 flex-shrink-0">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
       <div className="font-body font-medium text-ink text-body">
        Carry-forward · {carryForwardCount} item{carryForwardCount !== 1 ? 's' : ''}
       </div>
       <span className="font-body text-muted text-label flex-shrink-0">{acknowledgedCount}/{carryForwardCount} acknowledged</span>
      </div>
      {criticalCount > 0 && (
       <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
        <span className="font-body text-danger text-label">{criticalCount} critical — action required in the first 20 minutes</span>
       </div>
      )}
      <div className="flex items-center gap-1.5">
       <Brain size={9} strokeWidth={1.75} className="text-muted flex-shrink-0" />
       <span className="font-body text-muted text-label">91% synthesis confidence · urgency from shift findings and cert records</span>
      </div>
     </div>
     {/* Stale data warning — per source */}
     <div className="px-4 py-3 bg-stone2 border-b border-rule2 flex-shrink-0">
      <div className="font-body text-muted text-label mb-2">Data freshness</div>
      {[
       { source: 'Sensor A-7', age: '8 min', stale: false },
       { source: 'CAPA-2604-001', age: '22 min', stale: false },
       { source: 'Lindqvist cert status', age: '4h 12min', stale: true },
       { source: 'R-03 telemetry', age: '4 min', stale: false },
      ].map(s => (
       <div key={s.source} className={`flex items-center gap-2 py-1.5 px-2 -mx-2 mb-px last:mb-0 ${s.stale ? 'bg-warn/[0.10] border-l-2 border-l-warn' : ''}`}>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.stale ? 'bg-warn' : 'bg-ok'}`} />
        <span className={`font-body text-label flex-1 ${s.stale ? 'text-ink font-medium' : 'text-muted'}`}>{s.source}</span>
        <span className={`font-body text-label tabular-nums ${s.stale ? 'text-warn font-medium' : 'text-muted'}`}>
         {s.age}{s.stale ? ' · verify before signing' : ''}
        </span>
       </div>
      ))}
     </div>
     <div className="overflow-y-auto flex-1">
      {pendingItems.length > 0 ? pendingItems.map(item => (
       <CarryForwardItem
        key={item.id}
        item={item}
        acknowledged={false}
        onAcknowledge={handleAcknowledgeCarryForward}
        onView={() => setViewingItem(item)}
       />
      )) : (
       <div className="px-4 py-10 text-center">
        <Check size={20} strokeWidth={2} className="text-ok mx-auto mb-3" />
        <div className="font-body text-ok text-body">
         {carryForwardCount > 0 ? 'All items acknowledged' : 'No carry-forward items'}
        </div>
        <div className="font-body text-muted text-label mt-1">Shift handed off cleanly</div>
       </div>
      )}
     </div>
    </div>

    {/* Right: context cards */}
    <div className="w-[45%] overflow-y-auto flex flex-col">
     {/* Shift notes — primary narrative, heavier treatment */}
     <div className="border-b border-rule2">
      <div className="px-4 py-3 border-b border-rule2 bg-stone2">
       <div className="font-display font-semibold text-ink text-base">Shift notes</div>
      </div>
      <div className="px-4 pt-3 pb-1">
       <div className="flex items-center gap-2 mb-3">
        <PersonAvatar name={d.shiftNotes.author} size={20} />
        <div>
         <span className="font-body font-medium text-ink text-label">{d.shiftNotes.author}</span>
         <span className="font-body text-muted text-label ml-1.5">{d.shiftNotes.time}</span>
        </div>
       </div>
       <ul className="space-y-2 pb-3">
        {d.shiftNotes.body.map((note, i) => (
         <li key={i} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-muted flex-shrink-0 mt-1.5" />
          <span className="font-display text-muted text-body leading-relaxed">{note}</span>
         </li>
        ))}
       </ul>
      </div>
     </div>
     <div className="border-b border-rule2">
      <div className="px-4 py-2 border-b border-rule2">
       <span className="font-body text-micro text-muted tracking-widest">Operator briefing</span>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rule2">
       <PersonAvatar name="M. Santos" size={26} />
       <div>
        <div className="font-body font-medium text-ink text-body">M. Santos — Incoming PM supervisor</div>
        <div className="font-body text-muted text-label">Line 4 · 14:00–22:00</div>
       </div>
      </div>
      {haccpData.ccps.map((ccp, i) => (
       <div key={i} className="flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0">
        <AlertTriangle size={12} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
        <div>
         <div className="font-body font-medium text-ink text-body">{ccp.station} · {ccp.ccp}</div>
         <div className="font-body text-muted text-label">{ccp.limit}</div>
        </div>
       </div>
      ))}
     </div>
     <div className="border-b border-rule2">
      <div className="px-4 py-2 border-b border-rule2">
       <span className="font-body text-micro text-muted tracking-widest">Cert alerts</span>
      </div>
      {certExpiry.filter(c => c.tone !== 'ok').map((c, i) => (
       <div key={i} className={`flex gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0 ${c.tone === 'danger' ? 'bg-danger/[0.03]' : ''}`}>
        <Clock size={12} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${c.tone === 'danger' ? 'text-danger' : 'text-warn'}`} />
        <div>
         <div className={`font-body font-medium text-body ${c.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{c.name} · {c.cert}</div>
         <div className={`font-body text-label ${c.tone === 'danger' ? 'text-danger/80' : 'text-muted'}`}>{c.note}</div>
        </div>
       </div>
      ))}
     </div>
     <div>
      <div className="px-4 py-2 border-b border-rule2">
       <span className="font-body text-micro text-muted tracking-widest">Upcoming staffing</span>
      </div>
      {d.forecast.map((row, i) => <ForecastRow key={i} row={row} />)}
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

 const onlineCount = units.filter(u => u.status === 'online').length
 const faultCount  = faults.length
 const pmCount     = units.filter(u => u.maintenanceSchedule.remainingHours <= 24).length

 const BACKLOG = [
  { unit: 'R-03', item: 'Bearing inspection — vibration anomaly detected', urgency: 'warn' },
  { unit: 'R-04', item: 'PM window — estimated return to service 14:30',   urgency: 'info' },
  { unit: 'R-08', item: 'Drive fault F-22 — awaiting technician resolution', urgency: 'danger' },
 ]

 return (
  <div className="flex flex-col h-full overflow-hidden content-reveal">

   {/* ── Header: eyebrow + title ─────────────────────────────────── */}
   <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone" style={{ borderLeft: '6px solid var(--color-ochre)' }}>
    <div className="font-body font-semibold text-muted text-label mb-1.5">
     Machine State Handoff · Robotic workforce · Wichita Plant
    </div>
    <div className="font-display font-bold text-page text-ink leading-none">
     Shift boundary <span className="font-light text-ochre">14:00</span>
    </div>
   </div>

   {/* ── Stats strip — SupplierIQ pattern ───────────────────────── */}
   <div className="flex-shrink-0 flex items-center divide-x divide-rule2 border-b border-rule2 bg-stone">
    <div className="flex items-center gap-2.5 px-5 py-2.5">
     <span className="font-body text-muted text-label">Online units</span>
     <span className="display-num text-metric font-bold leading-none text-ok">{onlineCount}/{units.length}</span>
    </div>
    <div className="flex items-center gap-2.5 px-5 py-2.5">
     <span className="font-body text-muted text-label">Active faults</span>
     <span className={`display-num text-metric font-bold leading-none ${faultCount > 0 ? 'text-danger' : 'text-muted'}`}>{faultCount}</span>
     {faultCount > 0 && <span className="font-body text-danger text-label">blocking handoff</span>}
    </div>
    <div className="flex items-center gap-2.5 px-5 py-2.5">
     <span className="font-body text-muted text-label">Pending maintenance</span>
     <span className={`display-num text-metric font-bold leading-none ${pmCount > 0 ? 'text-warn' : 'text-muted'}`}>{pmCount}</span>
     {pmCount > 0 && <span className="font-body text-warn text-label">≤ 24h window</span>}
    </div>
   </div>

   {/* ── AI synthesis banner ─────────────────────────────────────── */}
   <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-rule2 bg-ochre/[0.06] border-b-2 border-b-ochre/30">
    <Cpu size={13} className="text-ochre flex-shrink-0" strokeWidth={1.75} />
    <div className="flex-1">
     <span className="font-body font-semibold text-ink text-body">Handoff Synthesis Agent — pre-populated from live fleet data</span>
     <div className="font-body text-muted text-label mt-0.5">4 items synthesized · 1 requires director review · Generated 13:15</div>
    </div>
    <span className="font-body text-ochre text-label px-2 py-0.5 bg-ochre/10">Review &amp; validate</span>
   </div>

   {/* ── Two-column body ─────────────────────────────────────────── */}
   <div className="flex-1 flex overflow-hidden">

    {/* Left: action items — faults + maintenance backlog */}
    <div className="w-[55%] border-r border-rule2 flex flex-col overflow-hidden">
     <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
      <span className="font-body font-bold text-ink text-body">Action required</span>
      {faultCount > 0 && <span className="ml-2 font-body text-danger text-label">{faultCount} fault{faultCount > 1 ? 's' : ''} blocking handoff</span>}
     </div>
     <div className="flex-1 overflow-y-auto">
      {faults.length > 0 && (
       <div className="border-b border-rule2">
        {faults.map((f, i) => (
         <div key={i} className={`flex items-start gap-4 px-5 py-3.5 border-b border-rule2 last:border-0 border-l-4 ${f.severity === 'danger' ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn bg-warn/[0.02]'}`}>
          <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${f.severity === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={1.75} />
          <div className="flex-1">
           <div className={`font-body font-medium text-body ${f.severity === 'danger' ? 'text-danger' : 'text-ink'}`}>{f.unit} — {f.fault}</div>
           {f.techAssigned && <div className="font-body text-muted text-label mt-0.5">Tech: {f.techAssigned}{f.eta ? ` · ETA ${f.eta}` : ''}</div>}
          </div>
         </div>
        ))}
       </div>
      )}
      <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
       <span className="font-body text-muted text-label">Maintenance carry-forward</span>
      </div>
      {BACKLOG.map((item, i) => {
       const borderCls  = item.urgency === 'danger' ? 'border-l-danger bg-danger/[0.02]' : item.urgency === 'warn' ? 'border-l-warn bg-warn/[0.015]' : 'border-l-rule2'
       const labelTone  = item.urgency === 'danger' ? 'text-danger' : item.urgency === 'warn' ? 'text-ink' : 'text-muted'
       return (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 border-b border-rule2 border-l-2 ${borderCls}`}>
         <span className="font-body text-label w-10 flex-shrink-0 tabular-nums text-muted">{item.unit}</span>
         <span className={`font-body font-medium text-body flex-1 ${labelTone}`}>{item.item}</span>
         <StatusPill tone={item.urgency === 'danger' ? 'danger' : item.urgency === 'warn' ? 'warn' : 'muted'}>
          {item.urgency === 'danger' ? 'Critical' : item.urgency === 'warn' ? 'Attention' : 'Info'}
         </StatusPill>
        </div>
       )
      })}
     </div>
    </div>

    {/* Right: fleet calibration & program state */}
    <div className="w-[45%] flex flex-col overflow-hidden">
     <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
      <span className="font-body font-bold text-ink text-body">Fleet state</span>
     </div>
     <div className="flex-1 overflow-y-auto">
      {units.filter(u => u.status !== 'fault').map((u) => {
       const pmH   = u.maintenanceSchedule.remainingHours
       const pmTone = pmH <= 8 ? 'text-danger' : pmH <= 24 ? 'text-warn' : 'text-muted'
       return (
        <div key={u.id} className="flex items-center gap-4 px-5 py-3 border-b border-rule2 hover:bg-stone2 transition-colors">
         <div className="relative flex h-1.5 w-1.5 flex-shrink-0">
          {u.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${u.status === 'online' ? 'bg-ok' : 'bg-warn'}`} />
         </div>
         <span className="font-body font-medium text-muted text-label w-10 flex-shrink-0 tabular-nums">{u.id}</span>
         <span className="font-body font-medium text-ink text-body flex-1">{u.name}</span>
         <span className="font-body text-muted text-label">{u.programVersion}</span>
         <StatusPill tone={u.calibrationStatus === 'expired' ? 'danger' : 'ok'}>
          {u.calibrationStatus === 'expired' ? 'Cal expired' : 'Cal valid'}
         </StatusPill>
         <span className={`font-body font-medium text-label tabular-nums ${pmTone}`}>{pmH}h to PM</span>
        </div>
       )
      })}
     </div>
    </div>

   </div>

   {/* ── System validation gate — full width, same chrome as AI banner ── */}
   <div className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 border-t border-rule2 border-b-2 ${
    systemValidated
     ? 'bg-ok/[0.05] border-b-ok/40'
     : 'bg-stone2 border-b-rule2'
   }`}>
    {systemValidated
     ? <CheckCircle size={13} className="text-ok flex-shrink-0" strokeWidth={2} />
     : <Cpu size={13} className="text-muted flex-shrink-0" strokeWidth={1.75} />
    }
    <div className="flex-1">
     <span className={`font-body font-semibold text-body ${systemValidated ? 'text-ok' : 'text-ink'}`}>
      System validation gate{systemValidated ? ' — complete' : ''}
     </span>
     <div className="font-body text-muted text-label mt-0.5">
      {systemValidated
       ? 'All 10 online units calibrated · 2 units in maintenance hold · Fault log reviewed · Handoff ready'
       : 'Automated check: all critical systems in documented state. No supervisor signature required in robotic mode.'
      }
     </div>
    </div>
    {systemValidated
     ? <span className="font-body text-ok text-label px-2 py-0.5 bg-ok/10 flex-shrink-0">Validated</span>
     : <button type="button" onClick={() => setSystemValidated(true)}
        className="font-body font-medium text-body px-4 py-2.5 min-h-[40px] bg-ink text-stone hover:bg-ink/90 transition-colors flex-shrink-0">
        Run validation
       </button>
    }
   </div>

  </div>
 )
}

// ── Main HandoffIQ ──────────────────────────────────────────────────────────

export default function HandoffIQ() {
 const d = handoffData
 const { carryForwardAcknowledged, setCarryForwardAcknowledged,
  logActivity, currentPlant, workerMode, shiftActed } = useAppState()

 const actedCaseNums = new Set(
  Object.keys(shiftActed || {}).filter(id => shiftActed[id]).map(id => FINDING_TO_CASE[id]).filter(Boolean)
 )

 const carryForwardItems = d.cases
  .filter(c => c.urgency === 'warn' || c.urgency === 'danger')
  .sort((a, b) => ({ danger: 0, warn: 1 }[a.urgency] ?? 2) - ({ danger: 0, warn: 1 }[b.urgency] ?? 2))
  .map(c => ({
   id: c.num, urgency: c.urgency, title: c.title,
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

 const props = {
  d, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount,
  allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward,
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
