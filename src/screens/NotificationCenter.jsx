import { useState, useCallback } from 'react'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, ActionBanner, Btn } from '../components/UI'

const TYPE_COLOR = {
 override: { bg: 'bg-danger/[0.04] border-l-danger', dot: 'bg-danger', label: 'Override' },
 escalation: { bg: 'bg-danger/[0.03] border-l-danger', dot: 'bg-danger', label: 'Escalation' },
 near_miss: { bg: 'bg-warn/[0.03] border-l-warn', dot: 'bg-warn', label: 'Near miss' },
 maintenance: { bg: 'bg-warn/[0.02] border-l-warn', dot: 'bg-warn', label: 'Maintenance' },
 coa: { bg: 'bg-warn/[0.02] border-l-warn', dot: 'bg-warn', label: 'COA' },
 rfq: { bg: 'border-l-int', dot: 'bg-int', label: 'RFQ' },
 evidence: { bg: 'bg-ok/[0.02] border-l-ok', dot: 'bg-ok', label: 'Evidence' },
 acknowledged: { bg: 'border-l-ok', dot: 'bg-ok', label: 'Acknowledged' },
}

function GroupedNotifRow({ group, onAction }) {
 const [expanded, setExpanded] = useState(false)
 const style = TYPE_COLOR[group.type] || { bg: 'border-l-rule', dot: 'bg-ghost', label: '' }
 const undismissed = group.items.filter(n => !n.dismissed)
 const allDismissed = undismissed.length === 0

 return (
 <div className={`border-b border-rule2 border-l-2 transition-opacity duration-200 ${style.bg} ${allDismissed ? 'opacity-40' : ''}`}>
 <button
 type="button"
 onClick={() => setExpanded(e => !e)}
 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone2 transition-colors"
 >
 <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className={`font-body font-medium text-[10px] px-1.5 py-px ${
 group.type === 'override' || group.type === 'escalation' ? 'bg-danger/10 text-danger' :
 group.type === 'near_miss' || group.type === 'maintenance' || group.type === 'coa' ? 'bg-warn/10 text-warn' :
 'bg-ok/10 text-ok'
 }`}>{style.label}</span>
 <span className="font-body text-muted text-[10px] px-1.5 py-px bg-stone3">{group.items.length}</span>
 <span className="font-body text-muted text-[10px]">{group.items[0].time}</span>
 </div>
 <div className="font-body font-medium text-ink text-[12px] leading-snug">
 {group.items.map(n => n.title.replace(/^(Near-miss:|Maintenance:|[^—]+—\s*)/, '').trim()).join(' · ')}
 </div>
 </div>
 <span className="font-body text-ghost text-[10px] flex-shrink-0">{expanded ? '▴' : '▾'}</span>
 </button>
 {expanded && group.items.map(n => (
 <NotifRow key={n.id} notif={n} onAction={onAction} indent />
 ))}
 </div>
 )
}

const SAFETY_CRITICAL = new Set(['override', 'escalation'])

function NotifRow({ notif, onAction, indent }) {
 const [confirmingDismiss, setConfirmingDismiss] = useState(false)
 const style = TYPE_COLOR[notif.type] || { bg: 'border-l-rule', dot: 'bg-ghost', label: '' }
 const isCritical = SAFETY_CRITICAL.has(notif.type)

 function handleDismiss() {
 if (isCritical) { setConfirmingDismiss(true); return }
 onAction(notif.id, 'dismiss')
 }

 return (
 <div className={`border-b border-rule2 border-l-2 transition-opacity duration-200 ${style.bg} ${notif.dismissed ? 'opacity-40' : ''} ${indent ? 'ml-4 border-l-0 border-t border-rule2' : ''}`}>
 <div className="flex items-start gap-3 px-4 py-3">
 <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className={`font-body font-medium text-[10px] px-1.5 py-px ${
 notif.type === 'override' || notif.type === 'escalation' ? 'bg-danger/10 text-danger' :
 notif.type === 'near_miss' || notif.type === 'maintenance' || notif.type === 'coa' ? 'bg-warn/10 text-warn' :
 'bg-ok/10 text-ok'
 }`}>{style.label}</span>
 <span className="font-body text-muted text-[10px]">{notif.time}</span>
 </div>
 <div className="font-body font-medium text-ink text-[12px] leading-snug">{notif.title}</div>
 <div className="font-body text-ghost text-[10px] mt-0.5 leading-relaxed">{notif.body}</div>
 {notif.linkedItem && <div className="font-body text-int text-[10px] mt-1">{notif.linkedItem}</div>}
 {confirmingDismiss && (
 <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rule2 slide-in">
 <span className="font-body text-danger text-[10px] flex-1">Dismissing a safety override is logged. Confirm?</span>
 <Btn variant="secondary" onClick={() => setConfirmingDismiss(false)}>Cancel</Btn>
 <Btn variant="primary" onClick={() => { setConfirmingDismiss(false); onAction(notif.id, 'dismiss') }}>Dismiss anyway</Btn>
 </div>
 )}
 </div>
 {!notif.dismissed && !confirmingDismiss ? (
 <div className="flex flex-col gap-1 flex-shrink-0">
 {notif.actionLabel && (
 <Btn variant="primary" className="whitespace-nowrap" onClick={() => onAction(notif.id, 'act')}>{notif.actionLabel}</Btn>
 )}
 <button type="button" onClick={handleDismiss}
 className="font-body text-[10px] px-2.5 py-1 text-ghost hover:text-muted transition-colors text-center">
 Dismiss
 </button>
 </div>
 ) : !notif.dismissed ? null : <span className="font-body text-ghost text-[10px] flex-shrink-0">Dismissed</span>}
 </div>
 </div>
 )
}

export default function NotificationCenter({ onClose }) {
 const { allergenOverride, nearMisses, maintenanceTickets, rfqSent, blockingEvidenceUploaded, operatorAcknowledgments, logActivity } = useAppState()
 const [dismissed, setDismissed] = useState({})
 const [activeFilter, setActiveFilter] = useState('All')

 const dismiss = (id) => setDismissed(p => ({ ...p, [id]: true }))
 const act = (id, title) => {
 logActivity({ actor:'J. Crocker', action:`Acknowledged: ${title}`, item:id, type:'acknowledgment' })
 dismiss(id)
 }

 const notifications = [
 { id:'capa-001-overdue', type:'escalation', time:'Apr 9', title:'CAPA-2604-001 overdue — 7 days', body:'Sensor A-7 bearing failure. No corrective measure submitted. FDA inspection in 18 days.', linkedItem:'CAPA-2604-001 · D. Kowalski', actionLabel:'View case' },
 { id:'fda-18d', type:'escalation', time:'Today', title:'FDA inspection in 18 days', body:'1 CAPA blocking evidence export. FSMA 204 chain gap unresolved. 62% of audit checklist complete.', linkedItem:'CAPA Engine · Audit pre-flight', actionLabel:'Review package' },
 { id:'coa-missing', type:'coa', time:'Today', title:'COA missing — Line 4 blocked', body:'ConAgra Lot TS-8811 COA not received. Production start on hold until receipt.', linkedItem:'SupplierIQ · Lot TS-8811', actionLabel:'View in SupplierIQ' },
 ...(allergenOverride ? [{ id:'allergen-override', type:'override', time:'Today', title:'Allergen override logged — D. Kowalski', body:`Supervisor bypassed allergen changeover block. Reason: "${allergenOverride}". Auto-CAPA created.`, linkedItem:'Line 4 · Allergen changeover log', actionLabel:'Confirm reviewed' }] : []),
 ...(nearMisses.map((n, i) => ({ id:`near-miss-${i}`, type:'near_miss', time:'Today', title:`Near-miss: ${n.station}`, body:n.what, linkedItem:`Step taken: ${n.action || '—'}`, actionLabel:'Review' }))),
 ...(maintenanceTickets.filter(t => t.status === 'open').map(t => ({ id:t.id, type:'maintenance', time:t.createdAt, title:`Maintenance: ${t.equipment}`, body:t.issue, linkedItem:`Requested by ${t.requestedBy}`, actionLabel:'View ticket' }))),
 ...(rfqSent ? [{ id:'rfq-sent', type:'rfq', time:'Today', title:'RFQ sent — Tomato Sauce alternatives', body:'ADM and Sysco contacted. ConAgra contract expires May 12.', linkedItem:'SupplierIQ · Price alerts', actionLabel:null }] : []),
 ...(blockingEvidenceUploaded ? [{ id:'evidence-ok', type:'evidence', time:'Today', title:'CAPA-2604-006 evidence uploaded', body:'FDA audit package unblocked — export now available.', linkedItem:'CAPA Engine', actionLabel:null }] : []),
 ...(Object.entries(operatorAcknowledgments || {}).map(([name, ack]) => ({ id:`ack-${name}`, type:'acknowledged', time:ack.time, title:`${name} acknowledged safety briefing`, body:'Food safety culture signal — operator confirmed understanding of shift safety context.', linkedItem:'HandoffIQ', actionLabel:null }))),
 ].map(n => ({ ...n, dismissed: !!dismissed[n.id] }))

 const pending = notifications.filter(n => !n.dismissed).length

 const filteredNotifications = notifications.filter(n => {
 if (activeFilter === 'All') return true
 if (activeFilter === 'Critical') return n.type === 'escalation' || n.type === 'override'
 if (activeFilter === 'Safety') return n.type === 'near_miss' || n.type === 'acknowledged'
 if (activeFilter === 'Operations') return n.type === 'maintenance' || n.type === 'coa' || n.type === 'rfq'
 return true
 })

 // Group same-type multi-item events; single items stay as-is
 const GROUPABLE_TYPES = new Set(['near_miss', 'acknowledged', 'maintenance'])
 const groupedItems = (() => {
 const result = []
 const seen = new Map()
 for (const n of filteredNotifications) {
 if (GROUPABLE_TYPES.has(n.type)) {
 if (!seen.has(n.type)) {
 seen.set(n.type, { type: n.type, items: [n], grouped: true })
 result.push(seen.get(n.type))
 } else {
 seen.get(n.type).items.push(n)
 }
 } else {
 result.push(n)
 }
 }
 return result
 })()

 const content = (
 <div className="flex flex-col h-full overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 bg-ink">
 <div className="flex-1">
 <div className="font-display font-bold text-stone text-base leading-tight">{`Notification center — ${pending} pending`}</div>
 <div className="font-body text-stone/80 text-[12px] mt-1">J. Crocker · Plant Director · April 16, 2026</div>
 </div>
 {onClose && (
 <button type="button" onClick={onClose} className="ml-4 p-1.5 text-stone/60 hover:text-stone transition-colors flex-shrink-0" aria-label="Close notifications">
 <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
 </button>
 )}
 </div>

 <div className="flex border-b border-rule2 bg-stone2 px-4 py-2 gap-5 flex-shrink-0 flex-wrap">
 {[
 ['All', notifications.length],
 ['Critical', notifications.filter(n=>n.type==='escalation'||n.type==='override').length],
 ['Safety', notifications.filter(n=>n.type==='near_miss'||n.type==='acknowledged').length],
 ['Operations', notifications.filter(n=>n.type==='maintenance'||n.type==='coa'||n.type==='rfq').length],
 ].map(([label, count]) => (
 <button
 type="button"
 key={label}
 onClick={() => setActiveFilter(label)}
 className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${activeFilter === label ? 'border-b-ochre' : 'border-b-transparent'}`}
 >
 <span className={`font-body text-[11px] transition-colors ${activeFilter === label ? 'text-ink' : 'text-muted'}`}>{label}</span>
 {count > 0 && <span className="font-body text-muted text-[10px] px-1.5 py-px bg-stone3">{count}</span>}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-y-auto">
 <SecHd tag="Director queue" title="Items requiring Plant Director response"
 badge={<Urg level={pending > 2 ? 'critical' : pending > 0 ? 'warn' : 'ok'}>{pending} pending</Urg>} />
 {groupedItems.length === 0 && (
 <div className="px-4 py-8 text-center font-body text-ghost text-[12px]">No notifications{activeFilter !== 'All' ? ` in ${activeFilter}` : ''}.</div>
 )}
 {groupedItems.map((item, i) =>
 item.grouped && item.items.length > 1 ? (
 <GroupedNotifRow
 key={`group-${item.type}`}
 group={item}
 onAction={(id, action) => {
 const n = item.items.find(x => x.id === id)
 action === 'dismiss' ? dismiss(id) : act(id, n?.title || '')
 }}
 />
 ) : (
 <NotifRow
 key={item.grouped ? item.items[0].id : item.id}
 notif={item.grouped ? item.items[0] : item}
 onAction={(id, action) => {
 const n = item.grouped ? item.items[0] : item
 action === 'dismiss' ? dismiss(id) : act(id, n.title)
 }}
 />
 )
 )}
 </div>
 </div>
 )

 if (onClose) {
 return (
 <>
 <div className="fixed inset-0 bg-ink/20 z-40" onClick={onClose} />
 <aside
 className="fixed top-0 right-0 bottom-0 z-50 flex flex-col slide-right bg-stone border-l border-rule2"
 style={{ width: '100%', maxWidth: 480 }}
 role="dialog"
 aria-modal="true"
 aria-label="Notification center"
 >
 {content}
 </aside>
 </>
 )
 }

 return content
}
