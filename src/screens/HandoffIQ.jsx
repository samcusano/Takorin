import { handoffData, certExpiry, haccpData } from '../data'
import { Btn, ActionBanner, PersonAvatar, AcceptanceGate, CarryForwardItem } from '../components/UI'
import { Check, AlertTriangle, Clock } from 'lucide-react'
import { useAppState } from '../context/AppState'

const FINDING_TO_CASE = { sf1: 'I.', sf2: 'II.', sf3: 'II.' }


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


function LayoutGrid({ d, signed, setSigned, currentPlant, carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged, carryForwardAcknowledged, handleAcknowledgeCarryForward, handleAcceptShift }) {
 return (
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
   {!signed && (
    <ActionBanner
     tone="ok"
     headline={`Shift handoff awaiting outgoing signature — ${currentPlant?.name || 'Salina Campus'} · Line 4`}
     body="D. Kowalski signing off · Incoming: M. Santos · April 16, 14:02"
    >
     <Btn variant="secondary" onClick={() => setSigned(true)}>Sign handoff — Kowalski</Btn>
    </ActionBanner>
   )}
   {signed && allAcknowledged && (
    <div className="flex items-center gap-3 px-4 py-3 bg-ok/10 border-b border-ok/20 flex-shrink-0">
     <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
     <span className="font-body text-ok text-[12px]">Ready to accept · All carry-forward items acknowledged</span>
    </div>
   )}
   <div className="flex flex-1 overflow-hidden">

    {/* Left: carry-forward queue */}
    <div className="w-[55%] border-r border-rule2 flex flex-col">
     <div className="px-4 py-2.5 bg-stone2 border-b border-rule2 font-body font-medium text-ink text-[12px] flex-shrink-0">
      Carry-forward items ({acknowledgedCount}/{carryForwardCount} acknowledged)
     </div>
     <div className="overflow-y-auto flex-1">
      {carryForwardCount > 0 ? carryForwardItems.map(item => (
       <CarryForwardItem
        key={item.id}
        item={item}
        acknowledged={carryForwardAcknowledged.has(item.id)}
        onAcknowledge={handleAcknowledgeCarryForward}
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
     <div className="border-b border-rule2">
      <div className="px-4 py-2.5 bg-stone2 border-b border-rule2 font-body font-medium text-ink text-[12px]">Operator briefing</div>
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
      <div className="px-4 py-2.5 bg-stone2 border-b border-rule2 font-body font-medium text-ink text-[12px]">Cert alerts</div>
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
      <div className="px-4 py-2.5 bg-stone2 border-b border-rule2 font-body font-medium text-ink text-[12px]">Upcoming staffing</div>
      {d.forecast.map((row, i) => <ForecastRow key={i} row={row} />)}
     </div>
    </div>

   </div>
  </div>
 )
}


// ── Main HandoffIQ ──────────────────────────────────────────────────────────

export default function HandoffIQ() {
 const d = handoffData
 const { handoffSigned: signed, setHandoffSigned: setSigned,
  carryForwardAcknowledged, setCarryForwardAcknowledged,
  logActivity,
  currentPlant,
  shiftActed } = useAppState()

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
   recommendedAction: c.events?.[0]?.val || 'Review shift notes for action steps',
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
  setSigned(true)
  logActivity({ actor: 'M. Santos', action: 'Accepted shift handoff', item: `Line 4 · ${new Date().toLocaleDateString()}`, type: 'acknowledgment' })
 }

 const props = {
  d, signed, setSigned, currentPlant,
  carryForwardItems, acknowledgedCount, carryForwardCount, allAcknowledged,
  carryForwardAcknowledged, handleAcknowledgeCarryForward, handleAcceptShift,
 }

 return (
  <div className="flex flex-col h-full overflow-hidden">
   <LayoutGrid {...props} />
  </div>
 )
}
