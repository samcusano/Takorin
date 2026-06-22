// Notification feed — shared by the NotificationCenter screen and the sidebar
// bell badge, so the badge count + severity reflect the real feed (not a
// placeholder). Tone per item is derived from its type via NOTIFICATION_TYPES.

import { worstTone } from '../lib/utils'

// Type → visual style mapping (tone drives badge severity).
export const NOTIFICATION_TYPES = {
  safety:         { label: 'Safety',       tone: 'danger', bar: 'border-l-danger', row: 'bg-danger/[0.03]' },
  near_miss:      { label: 'Near miss',    tone: 'warn',   bar: 'border-l-warn',   row: 'bg-warn/[0.02]' },
  override:       { label: 'Override',     tone: 'danger', bar: 'border-l-danger', row: 'bg-danger/[0.03]' },
  escalation:     { label: 'Escalation',  tone: 'danger', bar: 'border-l-danger', row: '' },
  compliance:     { label: 'Compliance',  tone: 'warn',   bar: 'border-l-warn',   row: '' },
  capa:           { label: 'CAPA',        tone: 'warn',   bar: 'border-l-warn',   row: '' },
  evidence:       { label: 'Evidence',    tone: 'ok',     bar: 'border-l-ok',     row: '' },
  acknowledged:   { label: 'Acknowledged', tone: 'ok',    bar: 'border-l-ok',     row: '' },
  acknowledgment: { label: 'Acknowledged', tone: 'ok',    bar: 'border-l-ok',     row: '' },
  handoff:        { label: 'Handoff',     tone: 'ok',     bar: 'border-l-ok',     row: '' },
  intervention:   { label: 'Action',      tone: 'signal', bar: 'border-l-signal', row: '' },
}

// Log types that are the director's own actions or system noise — excluded from
// the notification feed (and the bell count).
export const NOTIFICATION_EXCLUDE_TYPES = new Set(['intervention', 'system'])

export const notificationActivity = [
  {
    id: 'notif-agent-hold',
    type: 'escalation',
    time: '06:22',
    title: 'Agent decision — Tier 3 ratification required · Lot TS-8811',
    body: 'Supplier Intelligence Agent recommends holding Lot TS-8811. COA not received 4h before production start. Director sign-off required before 08:00.',
    link: '/agents',
    linkLabel: 'Open Agents',
  },
  {
    id: 'notif-network',
    type: 'compliance',
    time: '06:02',
    title: 'Network advisory — TX-11 also holding Lot TS-8811',
    body: 'Cross-plant exposure: SL-04 and TX-11 both hold TS-8811. Holds not yet coordinated. Uncoordinated release creates partial recall exposure.',
    link: '/agents',
    linkLabel: 'Open Agents',
  },
  {
    id: 'notif-coa-request',
    type: 'intervention',
    time: '05:47',
    title: 'COA request sent to ConAgra — Lot TS-8811',
    body: 'Automated COA request dispatched. Production scheduled for 08:00 today. Hold remains active until COA is received and verified.',
    link: '/suppliers',
    linkLabel: 'Open Suppliers',
  },
  {
    id: 'notif-l0891-delay',
    type: 'escalation',
    time: '05:33',
    title: 'Delivery delay — Lot L-0891 · Pepperoni · +6h',
    body: 'Expected arrival delayed 6 hours. COA not yet received. Pre-production hold active per FSMA 204. Supplier Intelligence Agent has escalated.',
    link: '/suppliers',
    linkLabel: 'Open Suppliers',
  },
  {
    id: 'notif-fsma-posture',
    type: 'compliance',
    time: '06:45',
    title: 'FSMA 204 posture assessed — 62% · 2 lots not submittable',
    body: 'Daily traceability assessment complete. TS-8811 and L-0891 are not submittable. CO-5502 and WF-2203 are FDA-submittable.',
    link: '/records',
    linkLabel: 'Open Record Vault',
  },
  {
    id: 'notif-wf-transform',
    type: 'evidence',
    time: '04:15',
    title: 'Transformation CTE complete — Lot WF-2203 · Wheat Flour',
    body: 'Output lots PROD-L4-2604-009 and PROD-L3-2604-003 created. 1,400 kg remaining in inventory. FSMA 204 chain intact.',
    link: '/records',
    linkLabel: 'Open Record Vault',
  },
  {
    id: 'notif-handoff',
    type: 'handoff',
    time: '03:52',
    title: 'Shift handoff complete — D. Kowalski to AM crew',
    body: 'Handoff report signed. Open items: TS-8811 hold, Sensor A-7 variance pattern, staffing gap on Line 4 AM. All items documented.',
    link: '/shift',
    linkLabel: 'Open Shift',
  },
  {
    id: 'sample-ack',
    type: 'acknowledged',
    time: '06:10',
    title: 'C. Reyes acknowledged safety briefing',
    body: 'Operator confirmed Sauce Dosing allergen and CCP requirements before shift start.',
    link: '/shift',
    linkLabel: 'Open Shift',
  },
  {
    id: 'sample-near-miss',
    type: 'near_miss',
    time: '05:51',
    title: 'Near-miss reported at Pack Line',
    body: 'Floor spill near condiment station identified and secured by crew. Corrective action logged.',
    link: '/shift',
    linkLabel: 'Review Shift',
  },
]

// Bell badge summary — count of feed items (excluding the director's own
// actions / system noise) and the worst severity among them.
const activeNotifications = notificationActivity.filter(n => !NOTIFICATION_EXCLUDE_TYPES.has(n.type))
export const notificationSummary = {
  count: activeNotifications.length,
  tone: worstTone(activeNotifications.map(n => NOTIFICATION_TYPES[n.type]?.tone)),
}
