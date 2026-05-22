import { useState } from 'react'
import { handoffData, certExpiry, haccpData, robotFleetData } from '../data'
import { Btn, PersonAvatar, CarryForwardItem, SlidePanel, StatusPill } from '../components/UI'
import { Check, AlertTriangle, Clock, Brain, Bot, CheckCircle, Cpu, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'

const FINDING_TO_CASE = { sf1: 'I.', sf2: 'II.', sf3: 'II.' }

// ── Live document strip — shows document building in real time ────────────────

const SHIFT_EVENTS = [
  { time: '13:23', actor: 'Director', text: 'Approved R-03 bearing inspection · window tonight 22:00–23:30', type: 'agent' },
  { time: '13:12', actor: 'Predictive Maintenance', text: 'R-03 vibration at 3.4 mm/s — flagged for inspection', type: 'agent' },
  { time: '11:30', actor: 'T. Osei', text: 'Uploaded CAPA-2604-003 evidence package — 4 files', type: 'human' },
  { time: '09:15', actor: 'System', text: 'Auto-escalation: CAPA-2604-001 overdue (2nd notice)', type: 'system' },
  { time: '06:48', actor: 'D. Kowalski', text: 'Martinez reassigned to Sauce Dosing — staffing 72% → 83%', type: 'human' },
  { time: '06:42', actor: 'D. Kowalski', text: 'Completed 4 overdue startup checklists', type: 'human' },
  { time: '06:12', actor: 'ShiftIQ', text: 'Shift started — risk score 54, normal early-shift', type: 'system' },
]

function LiveDocumentStrip({ activityLog }) {
  const [expanded, setExpanded] = useState(false)
  const eventCount = SHIFT_EVENTS.length
  return (
    <div className="flex-shrink-0 border-b-2 border-b-ok/20 bg-ok/[0.03]">
      <button type="button" onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-ok/[0.04] transition-colors">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-ok live-dot flex-shrink-0" />
          <span className="font-body font-medium text-ok text-label">Live · Document building in real time</span>
        </div>
        <span className="font-body text-muted text-label">{eventCount} events captured this shift</span>
        <span className="font-body text-muted text-label ml-auto">Last updated 14:02</span>
        <span className="font-body text-muted text-label">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-ok/15 slide-in">
          {SHIFT_EVENTS.slice(0, 5).map((ev, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-2 border-b border-rule2/60 last:border-b-0">
              <span className="font-body text-muted text-micro tabular-nums w-9 flex-shrink-0 mt-px">{ev.time}</span>
              {ev.type === 'agent'
                ? <Zap size={9} strokeWidth={2} className="text-deep flex-shrink-0 mt-px" style={{ color: 'var(--color-deep)' }} />
                : ev.type === 'human'
                  ? <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0 mt-1" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0 mt-1" />
              }
              <div className="flex-1 min-w-0">
                <span className="font-body text-label font-medium text-muted mr-1.5">{ev.actor}</span>
                <span className="font-body text-label text-muted">{ev.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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


// ── Section block — accent bar + bold label header ───────────────────────────
function SectionBlock({ label, accent = 'muted', children }) {
 const bar = { danger: 'bg-danger', warn: 'bg-warn', ok: 'bg-ok', ochre: 'bg-ochre', muted: 'bg-rule2' }[accent] || 'bg-rule2'
 return (
  <div className="border-b border-rule2 last:border-b-0">
   <div className="flex items-center gap-2.5 px-4 py-2 border-b border-rule2">
    <div className={`w-[3px] h-3.5 flex-shrink-0 ${bar}`} />
    <span className="font-body font-semibold text-micro text-muted uppercase">{label}</span>
   </div>
   {children}
  </div>
 )
}

function ForecastRow({ row }) {
 const sc = row.score >= 75 ? 'text-danger' : row.score >= 60 ? 'text-warn' : 'text-ok'
 const bc = row.score >= 75 ? 'border-l-danger' : row.score >= 60 ? 'border-l-warn' : 'border-l-ok'
 const signals = (row.signals || []).map(s => {
  const [label, tone] = s.split(':')
  return { label, tone }
 })
 return (
  <div className={`flex items-center gap-4 px-4 py-3 border-b border-rule2 last:border-b-0 border-l-2 ${bc} ${row.urgent ? 'bg-danger/[0.03]' : ''}`}>
   <div className={`display-num text-head leading-none flex-shrink-0 w-8 tabular-nums ${sc}`}>{row.score}</div>
   <div className="flex-1 min-w-0">
    <div className="font-body font-medium text-ink text-body leading-snug">{row.name}</div>
    <div className="font-body text-muted text-micro mt-0.5">{row.time.replace('\n', ' ')}</div>
    {row.action && <div className={`font-body text-micro mt-1 ${row.urgent ? 'text-warn' : 'text-muted'}`}>{row.action}</div>}
   </div>
   <div className="flex flex-col gap-1 items-end flex-shrink-0">
    {signals.map((s, i) => {
     const cls = s.tone === 'ok' ? 'text-ok bg-ok/10' : (s.tone === 'bad' || s.tone === 'danger') ? 'text-danger bg-danger/[0.06]' : 'text-warn bg-warn/10'
     return <span key={i} className={`font-body text-micro px-1.5 py-px flex-shrink-0 ${cls}`}>{s.label}</span>
    })}
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

   {/* ── Live document strip — shift event capture ──────────────── */}
   <LiveDocumentStrip activityLog={[]} />

   {/* ── Handoff summary stats ────────────────────────────────────── */}
   <div className="flex-shrink-0 flex divide-x divide-rule2 border-b border-rule2 bg-stone">
    <div className="px-5 py-4 min-w-0">
     <div className="font-body text-muted text-label mb-1">Carry-forward</div>
     <div className={`display-num text-title font-bold leading-none ${criticalCount > 0 ? 'text-danger' : carryForwardCount > 0 ? 'text-warn' : 'text-ok'}`}>{carryForwardCount}</div>
     <div className={`font-body text-label mt-0.5 ${criticalCount > 0 ? 'text-danger' : carryForwardCount > 0 ? 'text-warn' : 'text-ok'}`}>
      {criticalCount > 0 ? `${criticalCount} critical` : carryForwardCount > 0 ? 'watch' : 'all clear'}
     </div>
    </div>
    <div className="px-5 py-4 min-w-0">
     <div className="font-body text-muted text-label mb-1">Acknowledged</div>
     <div className={`display-num text-title font-bold leading-none ${allAcknowledged ? 'text-ok' : 'text-muted'}`}>{acknowledgedCount}<span className="opacity-40">/{carryForwardCount}</span></div>
     <div className={`font-body text-label mt-0.5 ${allAcknowledged ? 'text-ok' : 'text-muted'}`}>{allAcknowledged ? 'ready' : 'pending'}</div>
    </div>
    <div className="px-5 py-4 min-w-0">
     <div className="font-body text-muted text-label mb-1">Synthesis confidence</div>
     <div className="display-num text-title font-bold leading-none text-ok">91%</div>
     <div className="font-body text-muted text-label mt-0.5">4 of 5 sources fresh</div>
    </div>
    <div className="px-5 py-4 min-w-0">
     <div className="font-body text-muted text-label mb-1">Cert coverage</div>
     <div className="display-num text-title font-bold leading-none text-warn">1 gap</div>
     <div className="font-body text-muted text-label mt-0.5">Sauce Dosing L2</div>
    </div>
    <div className="px-5 py-4 min-w-0 flex-1">
     <div className="font-body text-muted text-label mb-1">Risk at handoff</div>
     <div className="display-num text-title font-bold leading-none text-danger">78</div>
     <div className="font-body text-danger text-label mt-0.5">at risk</div>
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
     {/* ── Operator briefing ──────────────────────────── */}
     <SectionBlock label="Operator briefing" accent="ochre">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-rule2">
       <PersonAvatar name="M. Santos" size={40} />
       <div className="flex-1 min-w-0">
        <div className="font-body font-bold text-head text-ink leading-tight">M. Santos</div>
        <div className="font-body text-micro text-muted mt-1">Incoming PM supervisor · Line 4 · 14:00–22:00</div>
       </div>
      </div>
      {haccpData.ccps.map((ccp, i) => (
       <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0 border-l-2 border-l-warn">
        <div className="font-body font-bold text-base text-warn flex-shrink-0 w-4 leading-tight tabular-nums mt-px">{i + 1}</div>
        <div className="flex-1 min-w-0">
         <div className="font-body font-semibold text-body text-ink leading-snug">
          {ccp.station} <span className="font-normal text-muted">· {ccp.ccp}</span>
         </div>
         <div className="font-body text-micro text-muted mt-0.5">{ccp.limit}</div>
        </div>
       </div>
      ))}
     </SectionBlock>

     {/* ── Cert alerts ────────────────────────────────── */}
     <SectionBlock label="Cert alerts" accent={certExpiry.filter(c => c.tone !== 'ok').some(c => c.tone === 'danger') ? 'danger' : 'warn'}>
      {certExpiry.filter(c => c.tone !== 'ok').map((c, i) => (
       <div key={i} className={`flex items-center gap-5 px-4 py-3 border-b border-rule2 last:border-b-0 border-l-2 ${c.tone === 'danger' ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn'}`}>
        <div className="flex-shrink-0 w-12">
         <div className={`display-num text-head leading-none tabular-nums ${c.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>{c.expiresIn}</div>
         <div className="font-body text-micro text-muted mt-0.5">days</div>
        </div>
        <div className="flex-1 min-w-0">
         <div className={`font-body font-semibold text-body ${c.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{c.name}</div>
         <div className="font-body text-label text-muted">{c.cert}</div>
         {c.note && <div className={`font-body text-micro mt-0.5 ${c.tone === 'danger' ? 'text-danger/70' : 'text-muted'}`}>{c.note}</div>}
        </div>
       </div>
      ))}
     </SectionBlock>

     {/* ── Upcoming staffing ──────────────────────────── */}
     <SectionBlock label="Upcoming staffing" accent="muted">
      {d.forecast.map((row, i) => <ForecastRow key={i} row={row} />)}
     </SectionBlock>
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
      <span className="font-body font-bold text-ink text-body">Fleet status</span>
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
  .filter(c => c.urgency === 'warn' || c.urgency === 'danger' || c.urgency === 'ok')
  .sort((a, b) => ({ danger: 0, warn: 1, ok: 2 }[a.urgency] ?? 3) - ({ danger: 0, warn: 1, ok: 2 }[b.urgency] ?? 3))
  .map(c => ({
   id: c.num, urgency: c.urgency, title: c.title,
   operationalImpact: c.desc,
   ownerContext: c.evidence || 'Documented in shift record',
   recommendedAction: c.recommendedAction || c.events?.[0]?.val || '',
   resolvedInShift: c.resolvedInShift || actedCaseNums.has(c.num),
   agentSourced: c.agentSourced || false,
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
