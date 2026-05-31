import { useState, useRef, useEffect } from 'react'
import { handoffData, certExpiry, haccpData, robotFleetData } from '../data'
import { PersonAvatar, CarryForwardItem, SlidePanel, StatusPill, SectionLabel, EmptyState, AccentRow, StatGrid } from '../components/UI'
import { Check, AlertTriangle, Clock, Brain, Bot, CheckCircle, Cpu, Zap, Eye } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { OBSERVATION_CATEGORIES } from '../data/observations'

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

function LiveDocOverlay({ triggerRef, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0 })

  useEffect(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom, left: r.left, right: window.innerWidth - r.right })
    }
  }, [triggerRef])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) onClose()
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
    <div ref={ref} className="fixed z-50 plant-drop-in"
      style={{ top: pos.top, left: pos.left, right: pos.right }}>
      <div className="plant-drop-in-content border border-rule2 shadow-raise overflow-hidden"
        style={{ background: 'var(--color-stone-2)' }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-rule2"
          style={{ background: 'var(--color-stone-3)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-ok live-dot flex-shrink-0" />
          <span className="font-body font-medium text-ok text-body">Shift activity</span>
          <span className="font-body text-muted text-label">{SHIFT_EVENTS.length} events · Last updated 14:02</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {SHIFT_EVENTS.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-b-0">
              <span className="font-body text-muted text-micro tabular-nums w-9 flex-shrink-0 mt-px">{ev.time}</span>
              {ev.type === 'agent'
                ? <Zap size={9} strokeWidth={2} className="flex-shrink-0 mt-1" style={{ color: 'var(--color-deep)' }} />
                : ev.type === 'human'
                  ? <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0 mt-1.5" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0 mt-1.5" />
              }
              <div className="flex-1 min-w-0">
                <span className="font-body text-label font-medium text-ink mr-1.5">{ev.actor}</span>
                <span className="font-body text-label text-muted">{ev.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LiveDocumentStrip() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  return (
    <>
      <div className="flex-shrink-0 border-b-2 border-b-ok/20 bg-ok/[0.03]">
        <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-ok/[0.04] transition-colors">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-ok live-dot flex-shrink-0" />
            <span className="font-body font-medium text-ok text-label">Live · Document building in real time</span>
          </div>
          <span className="font-body text-muted text-label">{SHIFT_EVENTS.length} events captured this shift</span>
          <span className="font-body text-muted text-label ml-auto">Last updated 14:02</span>
        </button>
      </div>
      {open && <LiveDocOverlay triggerRef={triggerRef} onClose={() => setOpen(false)} />}
    </>
  )
}

function CarryForwardDetailPanel({ item, onClose, acknowledged, onAcknowledge }) {
 if (!item) return null
 const accentColor = item.urgency === 'danger' ? 'var(--color-danger)' : 'var(--color-warn)'
 const canAcknowledge = !item.resolvedInShift && !acknowledged

 const footer = (
  <div className="flex items-center justify-between">
   <span className="font-body text-muted text-label">
    {item.resolvedInShift ? 'Actioned this shift' : acknowledged ? 'Acknowledged' : 'Acknowledge to accept handoff'}
   </span>
   {item.resolvedInShift || acknowledged ? (
    <div className="w-8 h-8 rounded-full border border-ok/20 bg-ok/5 flex items-center justify-center" aria-label="Acknowledged">
     <Check size={14} strokeWidth={2.5} className="text-ok" />
    </div>
   ) : (
    <button type="button"
     onClick={() => { onAcknowledge(item.id) }}
     className="w-8 h-8 rounded-full border-2 border-rule2 bg-stone3 hover:border-ok hover:bg-ok/10 transition-colors flex items-center justify-center cursor-pointer"
     aria-label={`Acknowledge: ${item.title}`}>
     <Check size={14} strokeWidth={2} className="text-muted" />
    </button>
   )}
  </div>
 )

 return (
  <SlidePanel
   title={item.title}
   subtitle={`Carry-forward · ${item.urgency === 'danger' ? 'Critical' : 'Warning'}`}
   accentColor={accentColor}
   ariaLabel={`Carry-forward context — ${item.title}`}
   onClose={onClose}
   footer={footer}
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


function FloorObservationsSection() {
 const { fieldObservations } = useAppState()
 const [expanded, setExpanded] = useState(true)
 const obs = fieldObservations.filter(o => o.shiftId === 'am-0522')
 if (obs.length === 0) return null
 return (
  <div className="border-t border-rule2">
   <button type="button" onClick={() => setExpanded(p => !p)}
    className="w-full flex items-center gap-2 px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors text-left">
    <Eye size={10} strokeWidth={2} className="text-muted flex-shrink-0" />
    <span className="font-body text-micro text-muted tracking-wide flex-1">FLOOR OBSERVATIONS · {obs.length}</span>
    <span className="font-body text-micro text-muted">{expanded ? '↑' : '↓'}</span>
   </button>
   {expanded && obs.map(o => {
    const cat = OBSERVATION_CATEGORIES.find(c => c.id === o.category)
    return (
     <div key={o.id} className="px-4 py-3 border-b border-rule2 last:border-b-0">
      <div className="flex items-center gap-2 mb-1.5">
       {cat && <span className={`font-body text-micro px-1.5 py-0.5 ${cat.bgCls} ${cat.textCls}`}>{cat.label}</span>}
       <span className="font-body text-micro text-muted">{o.timeLabel} · {o.operator} · {o.station}</span>
      </div>
      <p className="font-body text-label text-muted leading-snug m-0">{o.note}</p>
     </div>
    )
   })}
  </div>
 )
}

const FRESHNESS_SOURCES = [
 { source: 'Sensor A-7',           age: '8 min',    stale: false },
 { source: 'CAPA-2604-001',         age: '22 min',   stale: false },
 { source: 'Lindqvist cert status', age: '4h 12min', stale: true  },
 { source: 'R-03 telemetry',        age: '4 min',    stale: false },
]

function LayoutGrid({ d, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward }) {
 const [viewingItem, setViewingItem] = useState(null)
 const [handedOff, setHandedOff] = useState(false)
 const [coverageOpen, setCoverageOpen] = useState(false)
 const [notesOpen, setNotesOpen] = useState(false)

 const certGaps    = certExpiry.filter(c => c.tone !== 'ok')
 const criticalCount = carryForwardItems.filter(i => i.urgency === 'danger').length
 const openItems   = carryForwardItems.filter(item => !carryForwardAcknowledged.has(item.id) && !item.resolvedInShift)
 const resolvedItems = carryForwardItems.filter(i => i.resolvedInShift)
 const pendingCount = openItems.length

 const staleCount = FRESHNESS_SOURCES.filter(s => s.stale).length
 const freshnessCfg = staleCount === 0
  ? { bg: 'bg-ok/[0.05] border-ok/20',        dot: 'bg-ok',    text: 'text-ok',    label: 'Data: Fresh' }
  : staleCount < FRESHNESS_SOURCES.length
   ? { bg: 'bg-warn/[0.06] border-warn/20',    dot: 'bg-warn',  text: 'text-warn',  label: `Data: ${staleCount} source${staleCount > 1 ? 's' : ''} stale` }
   : { bg: 'bg-danger/[0.04] border-danger/20', dot: 'bg-danger', text: 'text-danger', label: 'Data: Stale' }

 return (
  <>
   <CarryForwardDetailPanel
    item={viewingItem}
    onClose={() => setViewingItem(null)}
    acknowledged={viewingItem ? carryForwardAcknowledged.has(viewingItem.id) : false}
    onAcknowledge={handleAcknowledgeCarryForward}
   />

   {/* ── Previous shift relay ────────────────────────────────────── */}
   {(() => {
    const resolved = SHIFT_EVENTS.filter(e => e.type === 'human' || e.type === 'agent').length
    const total = resolved + 1
    return (
     <div className="flex-shrink-0 border-b border-rule2">
      <div className="flex items-center gap-3 px-5 py-2 bg-stone2 border-b border-rule2">
       <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
       <span className="font-body text-label font-medium text-ink">Previous shift relay</span>
       <span className="font-body text-muted text-micro">Kowalski · AM shift · handed off 14:03</span>
      </div>
      <div className="flex items-stretch">
       <div className="flex items-center gap-3 px-5 py-2.5 border-r border-rule2 flex-1">
        <Check size={10} strokeWidth={2.5} className="text-ok flex-shrink-0" />
        <span className="font-body text-ok text-label font-medium">{resolved} of {total} items resolved this shift</span>
       </div>
       <div className="flex items-center gap-3 px-5 py-2.5 flex-1 bg-warn/[0.03]">
        <div className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
         <div className="font-body text-warn text-label font-medium">Oven B SCADA stale</div>
         <div className="font-body text-muted text-micro">No action taken · last confirmed 11h ago</div>
        </div>
       </div>
      </div>
     </div>
    )
   })()}

   {/* ── Live document strip ─────────────────────────────────────── */}
   <LiveDocumentStrip />

   {/* ── Scrollable body ─────────────────────────────────────────── */}
   <div className="flex-1 overflow-y-auto">

    {/* ── Santos incoming briefing — HERO ──────────────────────── */}
    <div className="border-b border-rule px-5 pt-4 pb-4">
     <div className="flex items-start gap-3 mb-3">
      <PersonAvatar name="M. Santos" size={40} />
      <div className="flex-1 min-w-0">
       <div className="font-body font-medium text-body text-ink leading-snug">M. Santos receives this shift</div>
       <div className="font-body text-muted text-label mt-px">Night Supervisor · Line 4 · in at 14:00</div>
      </div>
     </div>
     <ul className="space-y-1.5">
      {haccpData.ccps.map((ccp, i) => (
       <li key={i} className="flex items-start gap-3 bg-stone2 border border-rule overflow-hidden">
        <div className={`w-1 self-stretch flex-shrink-0 ${i === 0 ? 'bg-danger' : 'bg-warn'}`} />
        <div className="flex-1 min-w-0 px-3 py-2.5">
         <div className="flex items-baseline gap-2">
          <span className={`font-body text-micro font-bold tabular-nums flex-shrink-0 ${i === 0 ? 'text-danger' : 'text-warn'}`}>{i + 1}</span>
          <span className="font-body font-semibold text-body text-ink">{ccp.station}</span>
          <span className="font-body text-muted text-label">· {ccp.ccp}</span>
         </div>
         <div className="font-body text-micro text-muted mt-0.5">{ccp.limit}</div>
        </div>
       </li>
      ))}
     </ul>
    </div>

    {/* ── Carry-forward — "clear before handoff" ───────────────── */}
    <div className="border-b border-rule">
     <div className="px-4 py-3 bg-stone2 border-b border-rule2">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
       <div className="font-body font-medium text-ink text-body">
        {pendingCount > 0
         ? `Clear before handoff · ${pendingCount} remaining`
         : 'All items acknowledged'}
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
       <Brain size={9} strokeWidth={2} className="text-muted flex-shrink-0" />
       <span className="font-body text-muted text-label">91% synthesis confidence · urgency from shift findings and cert records</span>
      </div>
     </div>

     {/* Data freshness strip */}
     <div className={`flex items-center gap-3 px-4 py-2 border-b ${freshnessCfg.bg}`}>
      <div className="flex items-center gap-1.5 flex-shrink-0">
       <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${freshnessCfg.dot}`} />
       <span className={`font-body font-medium text-label ${freshnessCfg.text}`}>{freshnessCfg.label}</span>
      </div>
      {FRESHNESS_SOURCES.filter(s => s.stale).map(s => (
       <span key={s.source} className="flex items-center gap-1.5 font-body text-label text-warn flex-shrink-0">
        <span className="h-3 w-px bg-rule" />
        <span className="opacity-60">{s.source}</span>
        <span className="font-medium">{s.age}</span>
        <span className="opacity-50">· verify before signing</span>
       </span>
      ))}
      <span className="ml-auto font-body text-label text-muted flex-shrink-0">
       {FRESHNESS_SOURCES.length - staleCount} of {FRESHNESS_SOURCES.length} sources current · synthesized 14:02
      </span>
     </div>

     {openItems.length > 0 ? openItems.map(item => (
      <CarryForwardItem
       key={item.id} item={item} acknowledged={false}
       onAcknowledge={handleAcknowledgeCarryForward}
       onView={() => setViewingItem(item)}
      />
     )) : (
      <EmptyState icon={Check} message="All open items acknowledged" />
     )}
     {resolvedItems.length > 0 && (
      <>
       <SectionLabel label={`Closed this shift · ${resolvedItems.length}`} />
       {resolvedItems.map(item => (
        <CarryForwardItem
         key={item.id} item={item} acknowledged
         onAcknowledge={() => {}} onView={() => setViewingItem(item)}
        />
       ))}
      </>
     )}
     <FloorObservationsSection />
    </div>

    {/* ── Coverage — collapsible ────────────────────────────────── */}
    <div className="border-b border-rule2">
     <button type="button" onClick={() => setCoverageOpen(o => !o)}
      className="w-full flex items-center gap-2 px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors text-left">
      <span className="font-body text-micro text-muted tracking-wide flex-1">
       COVERAGE · STAFFING &amp; CERTS{certGaps.length > 0 ? ` · ${certGaps.length} gap${certGaps.length > 1 ? 's' : ''}` : ''}
      </span>
      {certGaps.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />}
      <span className="font-body text-micro text-muted">{coverageOpen ? '↑' : '↓'}</span>
     </button>
     {coverageOpen && (
      <>
       <SectionLabel label="Staffing" />
       <div className="border-b border-rule2">
        {d.forecast.map((row, i) => <ForecastRow key={i} row={row} />)}
       </div>
       <SectionLabel label="Certifications"
        badge={certGaps.length > 0 ? `${certGaps.length} gap${certGaps.length > 1 ? 's' : ''} — verify before signing off` : undefined}
        badgeTone="warn" />
       {certGaps.length === 0 ? (
        <EmptyState icon={Check} message="All certs current" />
       ) : certGaps.map((c, i) => (
        <AccentRow key={i} tone={c.tone === 'danger' ? 'danger' : 'warn'} bg
         className="flex items-center gap-5 px-4 py-3 last:border-b-0">
         <div className="flex-shrink-0 w-12">
          <div className={`display-num text-head leading-none tabular-nums ${c.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>{c.expiresIn}</div>
          <div className="font-body text-micro text-muted mt-0.5">days</div>
         </div>
         <div className="flex-1 min-w-0">
          <div className={`font-body font-semibold text-body ${c.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{c.name}</div>
          <div className="font-body text-label text-muted">{c.cert}</div>
          {c.note && <div className={`font-body text-micro mt-0.5 ${c.tone === 'danger' ? 'text-danger/70' : 'text-muted'}`}>{c.note}</div>}
         </div>
        </AccentRow>
       ))}
      </>
     )}
    </div>

    {/* ── Shift notes — collapsible ────────────────────────────── */}
    {d.shiftNotes && (
     <div className="border-b border-rule2">
      <button type="button" onClick={() => setNotesOpen(o => !o)}
       className="w-full flex items-center gap-2 px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors text-left">
       <span className="font-body text-micro text-muted tracking-wide flex-1">
        SHIFT NOTES · {d.shiftNotes.author}
       </span>
       <span className="font-body text-micro text-muted">{notesOpen ? '↑' : '↓'}</span>
      </button>
      {notesOpen && (
       <div className="px-4 py-3 border-t border-rule2">
        <div className="font-body text-micro text-muted mb-2">{d.shiftNotes.time}</div>
        <ul className="space-y-2">
         {d.shiftNotes.body.map((note, i) => (
          <li key={i} className="flex items-start gap-2.5">
           <div className="w-1 h-1 rounded-full bg-muted flex-shrink-0 mt-1.5" />
           <span className="font-body text-label text-ink leading-relaxed">{note}</span>
          </li>
         ))}
        </ul>
       </div>
      )}
     </div>
    )}

    {/* ── Stats — subordinate ───────────────────────────────────── */}
    <StatGrid cols={5}>
     <StatGrid.Cell label="Carry-forward" value={carryForwardCount}
      tone={criticalCount > 0 ? 'text-danger' : carryForwardCount > 0 ? 'text-warn' : 'text-ok'}
      sub={criticalCount > 0 ? `${criticalCount} critical` : carryForwardCount > 0 ? 'watch' : 'all clear'} />
     <StatGrid.Cell label="Acknowledged" value={`${acknowledgedCount}/${carryForwardCount}`}
      tone={allAcknowledged ? 'text-ok' : 'text-muted'}
      sub={allAcknowledged ? 'ready' : 'pending'} />
     <StatGrid.Cell label="Synthesis confidence" value="91%" tone="text-ok" sub="4 of 5 sources fresh" />
     <StatGrid.Cell label="Cert coverage" value="1 gap" tone="text-warn" sub="Sauce Dosing L2" />
     <StatGrid.Cell label="Risk at handoff" value={78} tone="text-danger" sub="at risk" />
    </StatGrid>

   </div>

   {/* ── Handoff CTA — sticky bottom rail ─────────────────────────── */}
   <div className="flex-shrink-0 border-t border-rule px-5 py-4">
    {handedOff ? (
     <div className="flex items-center justify-center gap-2 py-2">
      <Check size={14} className="text-ok" strokeWidth={2.5} />
      <span className="font-body font-medium text-body text-ok">Shift handed off to M. Santos · 14:00</span>
     </div>
    ) : (
     <button type="button"
      onClick={() => allAcknowledged && setHandedOff(true)}
      className={`w-full py-2.5 rounded-btn font-body font-medium text-base transition-colors ${
       allAcknowledged
        ? 'bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20 cursor-pointer'
        : 'bg-stone2 text-ink border border-rule hover:border-rule2 cursor-default'
      }`}
     >
      {allAcknowledged
       ? 'Hand off to M. Santos · 14:00'
       : `Hand off · ${pendingCount} item${pendingCount !== 1 ? 's' : ''} to acknowledge`}
     </button>
    )}
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
   <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-rule2 bg-signal/[0.06] border-b-2 border-b-signal/30">
    <Cpu size={13} className="text-signal flex-shrink-0" strokeWidth={2} />
    <div className="flex-1">
     <span className="font-body font-semibold text-ink text-body">Handoff Synthesis Agent — pre-populated from live fleet data</span>
     <div className="font-body text-muted text-label mt-0.5">4 items synthesized · 1 requires director review · Generated 13:15</div>
    </div>
    <span className="font-body text-signal text-label px-2 py-0.5 bg-signal/10">Review &amp; validate</span>
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
          <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${f.severity === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={2} />
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
     : <Cpu size={13} className="text-muted flex-shrink-0" strokeWidth={2} />
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
 const pendingHandoffCount = carryForwardItems.filter(i => !carryForwardAcknowledged.has(i.id) && !i.resolvedInShift).length
 const allAcknowledged = pendingHandoffCount === 0 && carryForwardCount > 0

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
