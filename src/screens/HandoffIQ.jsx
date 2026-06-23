import { useState, useRef, useEffect } from 'react'
import { handoffData, certExpiry, haccpData, robotFleetData } from '../data'
import { PersonAvatar, SlidePanel, StatusPill, Btn } from '../components/UI'
import { Check, AlertTriangle, Clock, Brain, Bot, CheckCircle, Cpu, Zap, Eye, ArrowRight, TrendingUp, Info } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { OBSERVATION_CATEGORIES } from '../data/observations'

const FINDING_TO_CASE = { sf1: 'I.', sf2: 'II.', sf3: 'II.' }

// ── Shift activity overlay ────────────────────────────────────────────────────

const SHIFT_EVENTS = [
  { time: '13:23', actor: 'Director',               text: 'Approved R-03 bearing inspection · window tonight 22:00–23:30', type: 'agent' },
  { time: '13:12', actor: 'Predictive Maintenance',  text: 'R-03 vibration at 3.4 mm/s — flagged for inspection',          type: 'agent' },
  { time: '11:30', actor: 'T. Osei',                text: 'Uploaded CAPA-2604-003 evidence package — 4 files',             type: 'human' },
  { time: '09:15', actor: 'System',                 text: 'Auto-escalation: CAPA-2604-001 overdue (2nd notice)',            type: 'system' },
  { time: '06:48', actor: 'D. Kowalski',            text: 'Martinez reassigned to Sauce Dosing — staffing 72% → 83%',      type: 'human' },
  { time: '06:42', actor: 'D. Kowalski',            text: 'Completed 4 overdue startup checklists',                        type: 'human' },
  { time: '06:12', actor: 'Shift',               text: 'Shift started — risk score 54, normal early-shift',             type: 'system' },
]

// Top 3 operationally significant events for the brief
const TOP_EVENTS = [
  SHIFT_EVENTS[0], // Director approved R-03 inspection
  SHIFT_EVENTS[2], // CAPA evidence uploaded
  SHIFT_EVENTS[4], // Martinez reassigned — staffing resolved
]

const FRESHNESS_SOURCES = [
  { source: 'Sensor A-7',           age: '8 min',    stale: false },
  { source: 'CAPA-2604-001',         age: '22 min',   stale: false },
  { source: 'Lindqvist cert status', age: '4h 12min', stale: true  },
  { source: 'R-03 telemetry',        age: '4 min',    stale: false },
]

const REQUIRED_ACTIONS = [
  {
    action: 'Respond to CAPA-2604-001 escalation',
    context: 'QA Director contact required · 7 days overdue · visible in FDA audit package',
    owner: 'QA Director',
    urgency: 'danger',
  },
  {
    action: 'Verify R-03 before production start',
    context: 'Vibration at 3.4 mm/s · bearing inspection tonight 22:00–23:30 · confirm crew ready',
    owner: 'Maintenance',
    urgency: 'warn',
  },
  {
    action: 'Schedule Kowalski L4 cert renewal',
    context: 'Expires in 10 days · within FDA inspection window · HR enrollment required',
    owner: 'HR / Supervisor',
    urgency: 'warn',
  },
]

const WATCH_ITEMS = [
  {
    risk: 'R-03 vibration trending toward threshold',
    context: 'Monitor between now and inspection window tonight 22:00 — do not run unmonitored',
    tone: 'warn',
  },
  {
    risk: 'Oven B SCADA stale — 11h unconfirmed',
    context: 'Previous shift took no action · confirm sensor status before Line 4 start',
    tone: 'warn',
  },
  {
    risk: 'FDA inspection in 18 days · risk trending up this shift',
    context: 'Closed at 78 (+24 from start) · CAPA and traceability gaps visible in audit package',
    tone: 'danger',
  },
]

function ShiftActivityOverlay({ triggerRef, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0 })

  useEffect(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
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
      style={{ top: pos.top, right: pos.right, minWidth: 420 }}>
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
              <span className="font-body text-muted text-label tabular-nums w-9 flex-shrink-0 mt-px">{ev.time}</span>
              {ev.type === 'agent'
                ? <Zap size={9} strokeWidth={2} className="flex-shrink-0 mt-1 text-deep" />
                : ev.type === 'human'
                  ? <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0 mt-1.5" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0 mt-1.5" />}
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

// ── Carry-forward detail panel ────────────────────────────────────────────────

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
        <div className="w-8 h-8 rounded-full border border-ok/20 bg-ok/5 flex items-center justify-center">
          <Check size={14} strokeWidth={2.5} className="text-ok" />
        </div>
      ) : (
        <Btn variant="secondary" icon={Check} onClick={() => onAcknowledge(item.id)}>
          Acknowledge
        </Btn>
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

// ── Section label ─────────────────────────────────────────────────────────────

function BriefSection({ label, meta, action, children }) {
  return (
    <div className="border-b border-rule2">
      <div className="flex items-center justify-between px-5 py-2 bg-stone2 border-b border-rule2">
        <span className="font-body text-label text-muted tracking-wide">{label}</span>
        {meta && <span className="font-body text-label text-muted">{meta}</span>}
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Main layout: 4-section brief ──────────────────────────────────────────────

function LayoutGrid({ d, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward, workerMode }) {
  const [viewingItem, setViewingItem]   = useState(null)
  const [handedOff, setHandedOff]       = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const activityRef                     = useRef(null)

  const staleCount   = FRESHNESS_SOURCES.filter(s => s.stale).length
  const openItems    = carryForwardItems.filter(i => !carryForwardAcknowledged.has(i.id) && !i.resolvedInShift)
  const pendingCount = openItems.length

  return (
    <>
      <CarryForwardDetailPanel
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        acknowledged={viewingItem ? carryForwardAcknowledged.has(viewingItem.id) : false}
        onAcknowledge={handleAcknowledgeCarryForward}
      />

      {activityOpen && <ShiftActivityOverlay triggerRef={activityRef} onClose={() => setActivityOpen(false)} />}

      {/* ── Byline ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-rule2 bg-stone2 flex items-center gap-5 px-5 py-3">
        <div className="flex items-center gap-3">
          <PersonAvatar name="D. Kowalski" size={22} />
          <span className="font-body text-label text-muted">D. Kowalski · AM shift · handed off 14:03</span>
        </div>
        <ArrowRight size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
        <div className="flex items-center gap-3">
          <PersonAvatar name="M. Santos" size={22} />
          <span className="font-body font-medium text-ink text-label">M. Santos · Night shift · in at 14:00</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <TrendingUp size={10} strokeWidth={2} className="text-danger" />
              <span className="display-num text-head font-bold text-danger tabular-nums leading-none">78</span>
            </div>
            <div className="font-body text-label text-muted">risk · +24 from start</div>
          </div>
        </div>
      </div>

      {/* ── Data freshness — only shown when stale ───────────────────── */}
      {staleCount > 0 && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-rule2 bg-warn/[0.04]">
          <div className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
          <span className="font-body text-warn text-label font-medium">{staleCount} source stale</span>
          {FRESHNESS_SOURCES.filter(s => s.stale).map(s => (
            <span key={s.source} className="font-body text-label text-muted">{s.source} · {s.age} · verify before signing</span>
          ))}
        </div>
      )}

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── WHAT HAPPENED ─────────────────────────────────────────── */}
        <BriefSection
          label="What happened"
          action={
            <button ref={activityRef} type="button" onClick={() => setActivityOpen(o => !o)}
              className="flex items-center gap-1.5 font-body text-label text-muted hover:text-ink transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-ok live-dot" />
              View all {SHIFT_EVENTS.length} events
            </button>
          }
        >
          {TOP_EVENTS.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0">
              <span className="font-body text-label text-muted tabular-nums w-9 flex-shrink-0 mt-px">{ev.time}</span>
              {ev.type === 'agent'
                ? <Zap size={9} strokeWidth={2} className="flex-shrink-0 mt-1 text-signal" />
                : <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0 mt-1.5" />}
              <div className="flex-1 min-w-0">
                <span className="font-body text-label font-medium text-ink mr-1.5">{ev.actor}</span>
                <span className="font-body text-label text-muted">{ev.text}</span>
              </div>
            </div>
          ))}
        </BriefSection>

        {/* ── WHAT YOU'RE INHERITING ────────────────────────────────── */}
        <BriefSection
          label="Current status"
          meta={`${acknowledgedCount}/${carryForwardCount} acknowledged`}
        >
          {carryForwardItems.map(item => {
            const acked  = carryForwardAcknowledged.has(item.id) || item.resolvedInShift
            const isCrit = item.urgency === 'danger'
            return (
              <div key={item.id} role="button" tabIndex={0}
                onClick={() => setViewingItem(item)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingItem(item) }}}
                className={`flex items-start gap-4 px-5 py-3.5 border-b border-rule2 last:border-0 transition-colors cursor-pointer
                  ${acked ? 'opacity-50 hover:opacity-60' : 'hover:bg-stone2/50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {!acked && <StatusPill tone={isCrit ? 'danger' : 'warn'}>{isCrit ? 'Critical' : 'Watch'}</StatusPill>}
                    <span className="font-body font-medium text-body text-ink leading-snug">{item.title}</span>
                    {item.resolvedInShift && <StatusPill tone="ok">Resolved this shift</StatusPill>}
                  </div>
                  <div className="font-body text-label text-muted leading-snug">{item.operationalImpact}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => setViewingItem(item)}
                    className="p-1 text-muted hover:text-ink transition-colors" aria-label="View details">
                    <Info size={14} strokeWidth={1.75} />
                  </button>
                  {acked ? (
                    <StatusPill tone="ok">Acknowledged</StatusPill>
                  ) : (
                    <Btn variant="secondary" icon={Check}
                      onClick={() => handleAcknowledgeCarryForward(item.id)} />
                  )}
                </div>
              </div>
            )
          })}
        </BriefSection>

        {/* ── WHAT REQUIRES ACTION ──────────────────────────────────── */}
        <BriefSection label="To-dos">
          {REQUIRED_ACTIONS.map((a, i) => (
            <div key={i}
              className="flex items-start gap-4 px-5 py-3.5 border-b border-rule2 last:border-0">
              <span className={`display-num text-head font-bold tabular-nums leading-none flex-shrink-0 w-5 mt-0.5
                ${a.urgency === 'danger' ? 'text-danger' : 'text-warn'}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <StatusPill tone={a.urgency === 'danger' ? 'danger' : 'warn'}>{a.urgency === 'danger' ? 'Critical' : 'Watch'}</StatusPill>
                  <span className="font-body font-medium text-body text-ink leading-snug">{a.action}</span>
                </div>
                <div className="font-body text-label text-muted mt-0.5 leading-snug">{a.context}</div>
              </div>
              <span className="font-body text-label text-muted flex-shrink-0">{a.owner}</span>
            </div>
          ))}
        </BriefSection>

        {/* ── WHAT TO WATCH ─────────────────────────────────────────── */}
        <BriefSection label="What to watch for">
          {WATCH_ITEMS.map((w, i) => (
            <div key={i}
              className={`px-5 py-3.5 border-b border-rule2 last:border-0
                ${w.tone === 'danger' ? 'bg-danger/[0.02]' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <StatusPill tone={w.tone === 'danger' ? 'danger' : 'warn'}>{w.tone === 'danger' ? 'Critical' : 'Watch'}</StatusPill>
                <span className={`font-body font-medium text-body leading-snug ${w.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{w.risk}</span>
              </div>
              <div className="font-body text-label text-muted leading-snug">{w.context}</div>
            </div>
          ))}
        </BriefSection>

        {/* ── FLEET STATUS — only in hybrid mode ───────────────────── */}
        {workerMode === 'hybrid' && (() => {
          const { units, faultLog } = robotFleetData
          const activeFaults = faultLog.filter(f => !f.resolved && f.severity !== 'info')
          const pmSoon = units.filter(u => u.maintenanceSchedule?.remainingHours <= 24)
          if (activeFaults.length === 0 && pmSoon.length === 0) return null
          return (
            <BriefSection label="Fleet at handoff" meta={`${units.filter(u => u.status === 'online').length}/${units.length} online`}>
              {activeFaults.map((f, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-body text-label font-medium ${f.severity === 'danger' ? 'text-danger' : 'text-warn'}`}>{f.unit}</span>
                      <span className="font-body text-muted text-label">· {f.fault}</span>
                    </div>
                    {f.techAssigned && (
                      <div className="font-body text-label text-muted">{f.techAssigned}{f.eta ? ` · ETA ${f.eta}` : ''}</div>
                    )}
                  </div>
                  <span className={`font-body text-label flex-shrink-0 px-1.5 py-0.5 ${f.severity === 'danger' ? 'text-danger bg-danger/[0.08]' : 'text-warn bg-warn/[0.08]'}`}>
                    {f.severity === 'danger' ? 'Active fault' : 'Monitoring'}
                  </span>
                </div>
              ))}
              {pmSoon.map((u, i) => (
                <div key={u.id} className="flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0 border-l-[3px] border-l-rule2">
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-label text-ink">{u.id} · {u.name}</div>
                    <div className="font-body text-label text-muted mt-0.5">PM due in {u.maintenanceSchedule.remainingHours}h · {u.line}</div>
                  </div>
                  <span className="font-body text-label text-muted flex-shrink-0 px-1.5 py-0.5 bg-stone3">Scheduled</span>
                </div>
              ))}
            </BriefSection>
          )
        })()}

      </div>

      {/* ── Handoff CTA ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-rule2 px-5 py-4">
        {handedOff ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <Check size={14} strokeWidth={2.5} className="text-ok" />
            <span className="font-body font-medium text-body text-ok">
              Shift accepted; taking over — M. Santos · 14:00
            </span>
          </div>
        ) : (
          <Btn
            variant="primary"
            disabled={!allAcknowledged}
            onClick={() => setHandedOff(true)}
            className="w-full justify-center py-3"
          >
            Shift accepted; taking over — M. Santos
          </Btn>
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

      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-rule2 bg-signal/[0.06] border-b-2 border-b-signal/30">
        <Cpu size={13} className="text-signal flex-shrink-0" strokeWidth={2} />
        <div className="flex-1">
          <span className="font-body font-semibold text-ink text-body">Handoff Synthesis Agent — pre-populated from live fleet data</span>
          <div className="font-body text-muted text-label mt-0.5">4 items synthesized · 1 requires director review · Generated 13:15</div>
        </div>
        <span className="font-body text-signal text-label px-2 py-0.5 bg-signal/10">Review &amp; validate</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[55%] border-r border-rule2 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
            <span className="font-body font-bold text-ink text-body">Action required</span>
            {faultCount > 0 && <span className="ml-2 font-body text-danger text-label">{faultCount} fault{faultCount > 1 ? 's' : ''} blocking handoff</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {faults.length > 0 && (
              <div className="border-b border-rule2">
                {faults.map((f, i) => (
                  <div key={i} className={`flex items-start gap-4 px-5 py-3.5 border-b border-rule2 last:border-0 ${f.severity === 'danger' ? 'bg-danger/[0.03]' : 'bg-warn/[0.02]'}`}>
                    <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${f.severity === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={2} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={f.severity === 'danger' ? 'danger' : 'warn'}>{f.severity === 'danger' ? 'Active fault' : 'Monitoring'}</StatusPill>
                        <span className={`font-body font-medium text-body ${f.severity === 'danger' ? 'text-danger' : 'text-ink'}`}>{f.unit} — {f.fault}</span>
                      </div>
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
              const borderCls = item.urgency === 'danger' ? 'bg-danger/[0.02]' : item.urgency === 'warn' ? 'bg-warn/[0.015]' : ''
              const labelTone = item.urgency === 'danger' ? 'text-danger' : item.urgency === 'warn' ? 'text-ink' : 'text-muted'
              return (
                <div key={i} className={`flex items-center gap-4 px-5 py-3.5 border-b border-rule2 ${borderCls}`}>
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

        <div className="w-[45%] flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
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

      <div className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 border-t border-rule2 border-b-2 ${
        systemValidated ? 'bg-ok/[0.05] border-b-ok/40' : 'bg-stone2 border-b-rule2'
      }`}>
        {systemValidated
          ? <CheckCircle size={13} className="text-ok flex-shrink-0" strokeWidth={2} />
          : <Cpu size={13} className="text-muted flex-shrink-0" strokeWidth={2} />}
        <div className="flex-1">
          <span className={`font-body font-semibold text-body ${systemValidated ? 'text-ok' : 'text-ink'}`}>
            System validation gate{systemValidated ? ' — complete' : ''}
          </span>
          <div className="font-body text-muted text-label mt-0.5">
            {systemValidated
              ? 'All 10 online units calibrated · 2 units in maintenance hold · Fault log reviewed · Handoff ready'
              : 'Automated check: all critical systems in documented state. No supervisor signature required in robotic mode.'}
          </div>
        </div>
        {systemValidated
          ? <span className="font-body text-ok text-label px-2 py-0.5 bg-ok/10 flex-shrink-0">Validated</span>
          : <button type="button" onClick={() => setSystemValidated(true)}
              className="font-body font-medium text-body px-4 py-2.5 min-h-[40px] bg-ink text-stone hover:bg-ink/90 transition-colors flex-shrink-0">
              Run validation
            </button>}
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
    }))

  const carryForwardCount  = carryForwardItems.length
  const acknowledgedCount  = carryForwardItems.filter(i => carryForwardAcknowledged.has(i.id)).length
  const pendingHandoffCount = carryForwardItems.filter(i => !carryForwardAcknowledged.has(i.id) && !i.resolvedInShift).length
  const allAcknowledged    = pendingHandoffCount === 0 && carryForwardCount > 0

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
      <LayoutGrid {...props} workerMode={workerMode} />
    </div>
  )
}
