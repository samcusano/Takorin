import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { VaulDrawer } from '../components/UI'

// Type → visual style mapping
const TYPE = {
  safety:       { label: 'Safety',       chip: 'bg-danger/10 text-danger', bar: 'border-l-danger', row: 'bg-danger/[0.03]' },
  near_miss:    { label: 'Near miss',    chip: 'bg-warn/10 text-warn',    bar: 'border-l-warn',   row: 'bg-warn/[0.02]' },
  override:     { label: 'Override',     chip: 'bg-danger/10 text-danger', bar: 'border-l-danger', row: 'bg-danger/[0.03]' },
  escalation:   { label: 'Escalation',   chip: 'bg-danger/10 text-danger', bar: 'border-l-danger', row: '' },
  compliance:   { label: 'Compliance',   chip: 'bg-warn/10 text-warn',    bar: 'border-l-warn',   row: '' },
  capa:         { label: 'CAPA',         chip: 'bg-warn/10 text-warn',    bar: 'border-l-warn',   row: '' },
  evidence:     { label: 'Evidence',     chip: 'bg-ok/10 text-ok',        bar: 'border-l-ok',     row: '' },
  acknowledged: { label: 'Acknowledged', chip: 'bg-ok/10 text-ok',        bar: 'border-l-ok',     row: '' },
  acknowledgment: { label: 'Acknowledged', chip: 'bg-ok/10 text-ok',      bar: 'border-l-ok',     row: '' },
  handoff:      { label: 'Handoff',      chip: 'bg-ok/10 text-ok',        bar: 'border-l-ok',     row: '' },
  intervention: { label: 'Action',       chip: 'bg-int/10 text-int',      bar: 'border-l-int',    row: '' },
}

const FILTER = {
  All:        () => true,
  Safety:     e => ['safety','near_miss','override','escalation'].includes(e.type),
  Compliance: e => ['compliance','capa','evidence'].includes(e.type),
  People:     e => ['acknowledged','acknowledgment','handoff'].includes(e.type),
}

// Log types that are the director's own actions or system noise — exclude from feed
const EXCLUDE_TYPES = new Set(['intervention', 'system'])

const sampleStanding = [
  {
    id: 'sample-capa-001',
    severity: 'danger',
    title: 'CAPA-2604-001 overdue by 7 days',
    body: 'Sensor A-7 bearing failure evidence still missing from QA package. Assigned to D. Kowalski.',
    link: '/capa',
    linkLabel: 'Review CAPA',
  },
  {
    id: 'sample-fda-18d',
    severity: 'warn',
    title: 'FDA inspection in 18 days — Region 7',
    body: 'Traceability submission 82% complete. Close evidence gaps before the inspection window.',
    link: '/readiness',
    linkLabel: 'Open readiness',
  },
]

const sampleActivity = [
  {
    id: 'sample-supplier',
    type: 'override',
    time: '10:05',
    title: 'Supplier COA request sent — Lot TS-8811',
    body: 'COA request dispatched to ConAgra. Hold remains until validation completes.',
    link: '/supplier',
    linkLabel: 'Open SupplierIQ',
  },
  {
    id: 'sample-ack',
    type: 'acknowledged',
    time: '09:42',
    title: 'C. Reyes acknowledged safety briefing',
    body: 'Operator confirmed Sauce Dosing allergen and CCP requirements before shift start.',
    link: '/handoff',
    linkLabel: 'Open HandoffIQ',
  },
  {
    id: 'sample-near-miss',
    type: 'near_miss',
    time: '08:17',
    title: 'Near-miss reported at Pack Line',
    body: 'Floor spill near condiment station identified and secured by crew.',
    link: '/shift',
    linkLabel: 'Review ShiftIQ',
  },
]

function NotifItem({ item, read, onRead, onNavigate }) {
 const s = TYPE[item.type] || TYPE.compliance
 const isRead = read.has(item.id)

 return (
  <div className={`border-b border-rule2 border-l-2 ${s.bar} ${s.row} ${isRead ? 'opacity-40' : ''} transition-opacity duration-200`}>
   <div className="px-4 py-3 flex gap-3">
    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 mb-1">
      <span className={`font-body font-medium text-[10px] px-1.5 py-px rounded-[3px] ${s.chip}`}>{s.label}</span>
      <span className="font-body text-ghost text-[10px]">{item.time}</span>
     </div>
     <div className="font-body font-medium text-ink text-[12px] leading-snug mb-0.5">{item.title}</div>
     {item.body && <div className="font-body text-muted text-[11px] leading-relaxed">{item.body}</div>}
     {item.link && (
      <button
       type="button"
       onClick={() => onNavigate(item.link)}
       className="font-body text-int text-[10px] mt-1.5 flex items-center gap-1 transition-colors hover:text-ink"
      ><ArrowRight size={12} />{item.linkLabel || 'Open in module'}
      </button>
     )}
    </div>
    {!isRead && (
     <button
      type="button"
      onClick={() => onRead(item.id)}
      className="font-body text-ghost text-[10px] hover:text-muted transition-colors flex-shrink-0 self-start pt-0.5"
      aria-label="Mark as read"
     >
      Mark read
     </button>
    )}
   </div>
  </div>
 )
}

function StandingItem({ item, onNavigate }) {
 const severityBar  = item.severity === 'danger' ? 'border-l-danger' : 'border-l-warn'
 const severityRow  = item.severity === 'danger' ? 'bg-danger/[0.03]' : ''
 const severityChip = item.severity === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'

 return (
  <div className={`border-b border-rule2 border-l-2 ${severityBar} ${severityRow}`}>
   <div className="px-4 py-3">
    <div className="flex items-center gap-2 mb-1">
     <span className={`font-body font-medium text-[10px] px-1.5 py-px ${severityChip}`}>Active</span>
     <span className="font-body text-ghost text-[10px]">Compliance</span>
    </div>
    <div className="font-body font-medium text-ink text-[12px] leading-snug mb-0.5">{item.title}</div>
    <div className="font-body text-muted text-[11px] leading-relaxed">{item.body}</div>
    {item.link && (
     <button
      type="button"
      onClick={() => onNavigate(item.link)}
      className="font-body text-int text-[10px] mt-1.5 flex items-center gap-1 transition-colors hover:text-ink"
     >
      <ArrowRight size={12} />{item.linkLabel}
     </button>
    )}
   </div>
  </div>
 )
}

export default function NotificationCenter({ onClose }) {
 const {
  allergenOverride, nearMisses, blockingEvidenceUploaded,
  operatorAcknowledgments, activityLog,
 } = useAppState()
 const navigate = useNavigate()
 const [read, setRead] = useState(new Set())
 const [activeFilter, setActiveFilter] = useState('All')

 const markRead = (id) => setRead(p => new Set([...p, id]))
 const go = (path) => { onClose?.(); navigate(path) }

 // ── Standing compliance items — persist until underlying state resolves ──
 const standing = [
  !blockingEvidenceUploaded && {
   id: 'capa-006-evidence',
   severity: 'danger',
   title: 'CAPA-2604-006 — evidence required before export',
   body: 'Pack Line QA pre-check log must be attached to unblock the FDA audit package. Assigned to T. Osei.',
   link: '/capa',
   linkLabel: 'Open in CAPA Engine',
  },
  {
   id: 'fda-18d',
   severity: 'warn',
   title: 'FDA inspection in 18 days — Region 7, Salina',
   body: '38% of pre-flight checklist complete. CAPA-2604-001 and CAPA-2604-006 evidence gaps remain open. FSMA 204 traceability submission has a naming conflict at CTE 2.',
   link: '/capa',
   linkLabel: 'Open in CAPA Engine',
  },
  {
   id: 'capa-001-overdue',
   severity: 'danger',
   title: 'CAPA-2604-001 overdue by 7 days',
   body: 'Sensor A-7 bearing failure root cause. No corrective measure submitted by assigned owner (D. Kowalski). Second auto-escalation sent at 09:15.',
   link: '/capa',
   linkLabel: 'Open in CAPA Engine',
  },
 ].filter(Boolean)

 // ── Activity events from dynamic state ──────────────────────────────────
 const dynamicEvents = [
  allergenOverride && {
   id: 'allergen-override',
   type: 'override',
   time: 'Today',
   title: 'Allergen override logged — D. Kowalski',
   body: `Pepperoni → GF-Flatbread changeover block bypassed. Reason: "${allergenOverride}". Auto-CAPA created and assigned.`,
  },
  ...nearMisses.map((n, i) => ({
   id: `near-miss-${i}`,
   type: 'near_miss',
   time: n.time || 'Today',
   title: `Near-miss reported — ${n.station}`,
   body: n.what + (n.action ? `. Corrective step: ${n.action}` : ''),
  })),
  ...Object.entries(operatorAcknowledgments || {}).map(([name, ack]) => ({
   id: `ack-${name}`,
   type: 'acknowledged',
   time: ack.time,
   title: `${name} confirmed safety briefing`,
   body: 'Operator acknowledged station safety context before shift start. Logged for food safety culture record.',
  })),
 ].filter(Boolean)

 // ── Activity log events — exclude director's own actions + system noise ─
 const logEvents = activityLog
  .filter(e => !EXCLUDE_TYPES.has(e.type))
  .map((e, i) => ({
   id: `log-${i}`,
   type: e.type,
   time: e.time,
   title: `${e.actor} — ${e.action}`,
   body: e.item,
  }))

 // Deduplicate: skip log entries whose type is already covered by dynamic state
 const dynamicTypes = new Set(dynamicEvents.map(e => e.type))
 const DYNAMIC_COVERS = { override: true, near_miss: true, acknowledged: true, acknowledgment: true }
 const mergedActivity = [
  ...dynamicEvents,
  ...logEvents.filter(e => !(DYNAMIC_COVERS[e.type] && dynamicTypes.has(e.type))),
 ]

 const effectiveStanding = [...sampleStanding, ...standing]
 const effectiveActivity = [...sampleActivity, ...mergedActivity]

 // ── Filter ───────────────────────────────────────────────────────────────
 const showCompliance = activeFilter === 'All' || activeFilter === 'Compliance'
 const filteredActivity = effectiveActivity.filter(FILTER[activeFilter] || FILTER.All)

 const totalUnread = effectiveStanding.length + effectiveActivity.filter(e => !read.has(e.id)).length

 // Filter tab counts
 const counts = {
  All: totalUnread,
  Safety: effectiveActivity.filter(FILTER.Safety).length,
  Compliance: effectiveStanding.length,
  People: effectiveActivity.filter(FILTER.People).length,
 }

 const content = (
  <div className="flex flex-col">
   {/* Header */}
   <div className="px-4 py-3 bg-ink flex-shrink-0">
    <div className="font-display font-bold text-stone text-[15px] leading-tight">Notifications</div>
    <div className="font-body text-stone/70 text-[11px] mt-0.5">
     {totalUnread > 0 ? `${totalUnread} unread · ` : 'All read · '}J. Crocker · April 16, 2026
    </div>
   </div>

   {/* Filter tabs */}
   <div className="flex gap-5 px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
    {Object.keys(FILTER).map(f => (
     <button
      type="button"
      key={f}
      onClick={() => setActiveFilter(f)}
      className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${activeFilter === f ? 'border-b-ochre' : 'border-b-transparent'}`}
     >
      <span className={`font-body text-[11px] ${activeFilter === f ? 'text-ink' : 'text-muted'}`}>{f}</span>
      {counts[f] > 0 && (
       <span className="font-body text-muted text-[10px] px-1.5 py-px bg-stone3 rounded-[3px]">{counts[f]}</span>
      )}
     </button>
    ))}
   </div>

   {/* Standing compliance items */}
   {showCompliance && effectiveStanding.length > 0 && (
    <>
     <div className="px-4 py-2 bg-stone2 border-b border-rule2">
      <span className="font-body text-[10px] uppercase tracking-widest text-muted font-medium">Requires attention</span>
     </div>
     {effectiveStanding.map(item => (
      <StandingItem key={item.id} item={item} onNavigate={go} />
     ))}
    </>
   )}

   {/* Activity feed */}
   {filteredActivity.length > 0 && (
    <>
     <div className="px-4 py-2 bg-stone2 border-b border-rule2">
      <span className="font-body text-[10px] uppercase tracking-widest text-muted font-medium">Activity</span>
     </div>
     {filteredActivity.map(item => (
      <NotifItem key={item.id} item={item} read={read} onRead={markRead} onNavigate={go} />
     ))}
    </>
   )}

   {filteredActivity.length === 0 && !showCompliance && (
    <div className="px-4 py-10 text-center font-body text-ghost text-[12px]">
     No {activeFilter.toLowerCase()} events today.
    </div>
   )}

   {filteredActivity.length === 0 && showCompliance && effectiveStanding.length === 0 && (
    <div className="px-4 py-10 text-center font-body text-ghost text-[12px]">
     No notifications.
    </div>
   )}
  </div>
 )

 if (onClose) {
  return (
   <VaulDrawer open onClose={onClose} maxHeight="90vh">
    {content}
   </VaulDrawer>
  )
 }

 return content
}
