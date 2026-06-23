import { useState } from 'react'
import { ArrowRight, Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { VaulDrawer, StatusPill, Tabs } from '../components/UI'
import {
  NOTIFICATION_TYPES as TYPE,
  NOTIFICATION_EXCLUDE_TYPES as EXCLUDE_TYPES,
  notificationActivity as sampleActivity,
} from '../data/notifications'

const INTELLIGENCE_SIGNALS = [
  { confidence: 87, label: 'Line 4 intervention window closing', detail: 'Staffing mismatch + allergen log unresolved · 27 min remaining in window', route: '/shift', routeLabel: 'Shift', tone: 'danger' },
  { confidence: 82, label: 'ConAgra Lot TS-8811 — cross-plant exposure', detail: '2 plants affected · 5,840 units at risk · COA not received', route: '/suppliers', routeLabel: 'Suppliers', tone: 'danger' },
  { confidence: 74, label: 'FDA inspection in 18 days — 3 evidence gaps remain', detail: 'CAPA-2604-001 and -006 blocking audit export · FSMA 204 traceability incomplete', route: '/capa', routeLabel: 'CAPA', tone: 'warn' },
]

const FILTER = {
  All:        () => true,
  Safety:     e => ['safety','near_miss','override','escalation'].includes(e.type),
  Compliance: e => ['compliance','capa','evidence'].includes(e.type),
  People:     e => ['acknowledged','acknowledgment','handoff'].includes(e.type),
}

// Map border-l-* to bg-* for the top accent bar
function barFill(barCls) {
  return barCls.replace('border-l-', 'bg-')
}

function NotifItem({ item, read, onRead, onNavigate }) {
  const s = TYPE[item.type] || TYPE.compliance
  const isRead = read.has(item.id)
  const hasFooter = item.link || !isRead

  return (
    <div
      className={`bg-stone border border-rule overflow-hidden transition-opacity duration-200 ${isRead ? 'opacity-40' : ''}`}
    >
      {/* Urgency accent bar — article: visual hierarchy first */}
      <div className={`h-[3px] w-full ${barFill(s.bar)}`} />
      {/* Header: type chip + timestamp */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <StatusPill tone={s.tone}>{s.label}</StatusPill>
        <span className="font-body text-muted text-label">{item.time}</span>
      </div>
      {/* Body: title + description */}
      <div className="px-4 pb-3">
        <div className="font-body font-medium text-ink text-body leading-snug">{item.title}</div>
        {item.body && <div className="font-body text-muted text-label leading-relaxed mt-1">{item.body}</div>}
      </div>
      {/* Footer: single primary CTA + dismiss — article: one action per card */}
      {hasFooter && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-rule2/60">
          {item.link ? (
            <button type="button" onClick={() => onNavigate(item.link)}
              className="font-body text-signal text-label flex items-center gap-1 hover:text-ink transition-colors">
              <ArrowRight size={10} />{item.linkLabel || 'Open in module'}
            </button>
          ) : <span />}
          {!isRead && (
            <button type="button" onClick={() => onRead(item.id)}
              className="font-body text-muted text-label hover:text-ink transition-colors"
              aria-label="Mark as read">
              Mark read
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotificationCenter({ onClose }) {
 const {
  allergenOverride, nearMisses,
  operatorAcknowledgments, activityLog,
 } = useAppState()
 const navigate = useNavigate()
 const [read, setRead] = useState(new Set())
 const [activeFilter, setActiveFilter] = useState('All')

 const markRead    = (id) => setRead(p => new Set([...p, id]))
 const markAllRead = ()   => setRead(new Set(effectiveActivity.map(e => e.id)))
 const go = (path) => { onClose?.(); navigate(path) }

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

 const effectiveActivity = [...sampleActivity, ...mergedActivity]

 // ── Filter ───────────────────────────────────────────────────────────────
 const filteredActivity = effectiveActivity.filter(FILTER[activeFilter] || FILTER.All)
 const totalUnread = effectiveActivity.filter(e => !read.has(e.id)).length

 // Filter tab counts
 const counts = {
  All: totalUnread,
  Safety: effectiveActivity.filter(FILTER.Safety).length,
  Compliance: effectiveActivity.filter(FILTER.Compliance).length,
  People: effectiveActivity.filter(FILTER.People).length,
 }

 const content = (
  <div className="flex flex-col h-full overflow-hidden">
   {/* Header */}
   <div className="px-4 py-3 bg-stone flex-shrink-0 flex items-start justify-between gap-3">
    <div>
     <div className="font-display font-bold text-ink text-head leading-tight">Notifications</div>
    </div>
    {totalUnread > 0 && (
     <button type="button" onClick={markAllRead}
      className="font-body text-label text-muted hover:text-ink transition-colors flex-shrink-0 mt-0.5">
      Mark all read
     </button>
    )}
   </div>

   {/* Filter tabs */}
   <Tabs
    tabs={Object.keys(FILTER).map(f => ({ id: f, label: f, badge: counts[f] || 0 }))}
    active={activeFilter}
    onChange={setActiveFilter}
    className="bg-stone2 flex-shrink-0 px-0"
   />

   <div className="flex-1 overflow-y-auto">
   {/* Intelligence summary — always shown on All tab */}
   {activeFilter === 'All' && (
    <div className="border-b border-rule2 bg-stone2">
     <div className="px-4 py-2.5 border-b border-rule2 flex items-center gap-2">
      <Brain size={11} strokeWidth={2} className="text-muted" />
      <span className="font-body text-label text-muted font-medium">Intelligence summary</span>
      <span className="font-body text-muted text-label ml-auto">Updated 06:42</span>
     </div>
     <div className="px-3 py-3 space-y-2.5">
      {INTELLIGENCE_SIGNALS.map((sig, i) => (
       <div key={i}
        className="bg-stone border border-rule overflow-hidden">
        {/* Body: confidence + label + detail */}
        <div className="px-4 py-3 flex items-start gap-3">
         <div className={`font-display font-bold text-title leading-none tabular-nums flex-shrink-0 pt-0.5 ${
          sig.confidence >= 85 ? 'text-danger' : sig.confidence >= 75 ? 'text-warn' : 'text-muted'
         }`}>{sig.confidence}%</div>
         <div className="flex-1 min-w-0">
          <div className="mb-1"><StatusPill tone={sig.tone === 'danger' ? 'danger' : 'warn'}>{sig.tone === 'danger' ? 'Critical' : 'Watch'}</StatusPill></div>
          <div className="font-body font-medium text-ink text-body leading-snug">{sig.label}</div>
          <div className="font-body text-muted text-label leading-snug mt-0.5">{sig.detail}</div>
         </div>
        </div>
        {/* Footer: single CTA */}
        <div className="px-4 py-2.5 border-t border-rule2/60">
         <button type="button" onClick={() => go(sig.route)}
          className="font-body text-signal text-label flex items-center gap-1 hover:text-ink transition-colors">
          <ArrowRight size={9} />Open in {sig.routeLabel}
         </button>
        </div>
       </div>
      ))}
     </div>
    </div>
   )}

   {/* Activity feed */}
   {filteredActivity.length > 0 && (
    <>
     <div className="px-4 py-2 bg-stone2 border-b border-rule2">
      <span className="font-body text-label text-muted font-medium">Activity</span>
     </div>
     <div className="px-3 py-3 space-y-2.5">
      {filteredActivity.map(item => (
       <NotifItem key={item.id} item={item} read={read} onRead={markRead} onNavigate={go} />
      ))}
     </div>
    </>
   )}

   {filteredActivity.length === 0 && (
    <div className="px-4 py-10 text-center font-body text-muted text-body">
     {activeFilter === 'All' ? 'No notifications.' : `No ${activeFilter.toLowerCase()} events today.`}
    </div>
   )}
   </div>
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
