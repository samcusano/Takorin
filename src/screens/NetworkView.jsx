import { useState, useRef, useEffect } from 'react'
import {
 AlertTriangle, Lock, CheckCircle2,
 Brain, TrendingDown, ChevronDown
} from 'lucide-react'
import { networkData } from '../data'
import { useAppState } from '../context/AppState'
import { ActionBanner, Btn, HoldButton } from '../components/UI'
import { useFocusTrap } from '../lib/utils'

// ── Intelligence signals ───────────────────────────────────────────────────────

const NETWORK_SIGNALS = [
 {
  id: 'sig1', active: true, confidence: 87, tone: 'danger',
  supplier: 'ConAgra Foods',
  label: 'ConAgra delivery delays → Line 4 scrap spikes',
  detail: 'Pattern confirmed across Salina + Wichita · 3 of 4 occurrences in past 90 days',
  action: 'Pre-order buffer recommended before next ConAgra delivery',
 },
 {
  id: 'sig2', active: true, confidence: 74, tone: 'warn',
  supplier: null,
  label: 'Allergen changeover delays correlated across lines',
  detail: 'Both plants show elevated risk on GF-Flatbread SKU transitions — pattern holds across 6 shifts',
  action: 'Standardize allergen changeover checklist across plants',
 },
 { id: 'sig3', locked: true, label: 'Supplier lead time degradation — predictive alert',  detail: 'Requires 3 connected plants · Topeka Plant (KS-02) not yet onboarded' },
 { id: 'sig4', locked: true, label: 'Cross-plant OEE benchmark variance detection',        detail: 'Requires 3 connected plants · activates at Topeka onboarding' },
]

// ── Supplier master data ───────────────────────────────────────────────────────

const SUPPLIER_NETWORK = [
 { name: 'ConAgra Foods', salina: 22, wichita: 31, trend: 'down', note: '3 non-conformances — both plants affected', tone: 'danger' },
 { name: 'Sysco',         salina: 67, wichita: 71, trend: 'up',   note: null,                                         tone: 'ok'     },
 { name: 'ADM Foods',     salina: 74, wichita: 78, trend: 'up',   note: null,                                         tone: 'ok'     },
 { name: 'Cargill',       salina: 81, wichita: 84, trend: 'up',   note: null,                                         tone: 'ok'     },
 { name: 'Prairie Farms', salina: 55, wichita: 60, trend: 'flat', note: 'Monitor — both below 65th pct.',             tone: 'warn'   },
]

const EXTRA_EXPOSURES = [
 { lotId: 'PF-4420', supplier: 'Prairie Farms', ingredient: 'Mozzarella', affectedPlants: ['ks'], totalUnits: 1840, note: 'Shelf life at 8 days — rotation priority' },
]

const PLANT_CODE = { sl: 'SL-04', ks: 'KS-09', co: 'CO-07' }

// ── Layer 1: Exposure Command Surface ─────────────────────────────────────────
// Temporal. Conditional. Only present when active exposures exist.
// Grouped by exposure object — supplier × plant × lot × FSMA window.

function ExposureOverlay({ triggerRef, active, actions, onAction, onBulkAction, onClose }) {
 const overlayRef = useRef(null)
 const [pos, setPos] = useState({ top: 60 })
 useFocusTrap(overlayRef)

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   setPos({ top: r.bottom })
  }
 }, [triggerRef])

 useEffect(() => {
  const onMouse = (e) => {
   if (!overlayRef.current?.contains(e.target) &&
       triggerRef.current && !triggerRef.current.contains(e.target))
    onClose()
  }
  const onKey = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('mousedown', onMouse)
  document.addEventListener('keydown', onKey)
  return () => {
   document.removeEventListener('mousedown', onMouse)
   document.removeEventListener('keydown', onKey)
  }
 }, [onClose, triggerRef])

 return (
  <div ref={overlayRef} className="fixed z-50 plant-drop-in"
   style={{ left: 0, right: 0, top: Math.max(8, pos.top) }}>
   <div className="plant-drop-in-content bg-stone border-b-2 border-b-danger/30 shadow-raise">
    {active.map(e => {
     const plantCodes = e.affectedPlants.map(id => PLANT_CODE[id] || id).join(' · ')
     const isCross    = e.affectedPlants.length > 1
     const action     = actions[e.lotId]
     return (
      <div key={e.lotId} className="px-4 py-3 first:pt-4">
       <div className={`border border-rule2 border-l-2 ${
        action ? 'border-l-ok opacity-60' : isCross ? 'border-l-danger' : 'border-l-warn'
       }`}>
        {/* Card header */}
        <div className="flex items-baseline justify-between px-4 pt-3 pb-1.5">
         <span className="font-body font-semibold text-ink text-[13px]">{e.supplier}</span>
         <span className="font-mono text-ghost text-[10px]">Lot {e.lotId}</span>
        </div>
        {/* Ingredient + units */}
        <div className="px-4 pb-2">
         <span className="font-body text-ghost text-[10px]">
          {e.ingredient || e.supplier} · {e.totalUnits.toLocaleString()} units
         </span>
        </div>
        {/* Plant chips + note + FSMA */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
         {e.affectedPlants.map(id => (
          <span key={id} className={`font-body text-[10px] font-medium px-1.5 py-0.5 rounded-btn ${
           isCross ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
          }`}>{PLANT_CODE[id] || id}</span>
         ))}
         {e.note && (
          <span className={`font-body text-[10px] ${isCross ? 'text-danger/70' : 'text-warn/70'}`}>
           · {e.note}
          </span>
         )}
         <span className="font-body text-ghost text-[10px] ml-auto">24h FSMA</span>
        </div>
        {/* Action row */}
        {action ? (
         <div className="flex items-center gap-1.5 px-4 pb-3 border-t border-rule2 pt-2.5">
          <CheckCircle2 size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
          <span className="font-body text-ok text-[10px]">
           {action === 'hold' ? 'Hold issued · MES frozen · ERP locked' : 'Notified'}
          </span>
         </div>
        ) : (
         <div className="flex items-center gap-2 px-4 pb-3 border-t border-rule2 pt-2.5">
          <HoldButton
           label={`Hold — ${plantCodes}`}
           holdLabel="Holding..."
           doneLabel="Hold issued"
           tone="danger"
           duration={1200}
           onConfirm={() => onAction(e.lotId, 'hold')}
          />
          <Btn variant="secondary" onClick={() => onAction(e.lotId, 'notify')}>Notify</Btn>
         </div>
        )}
       </div>
      </div>
     )
    })}
    {active.length > 1 && (
     <div className="px-4 py-4 border-t border-rule2 flex items-center gap-3">
      <HoldButton
       label={`Hold all ${active.length} exposures`}
       holdLabel="Holding all..."
       doneLabel="All held"
       tone="danger"
       duration={1500}
       onConfirm={() => { onBulkAction('hold'); onClose() }}
      />
      <Btn variant="secondary" onClick={() => { onBulkAction('notify'); onClose() }}>
       Notify all directors
      </Btn>
     </div>
    )}
   </div>
  </div>
 )
}

function ExposureCommandSurface({ exposures, actions, containmentMode, onAction, onBulkAction }) {
 const active = exposures.filter(e => !actions[e.lotId])
 const [open, setOpen] = useState(false)
 const triggerRef = useRef(null)

 if (active.length === 0) return null

 const totalUnits    = active.reduce((s, e) => s + e.totalUnits, 0)
 const allPlantCodes = [...new Set(active.flatMap(e => e.affectedPlants))].map(id => PLANT_CODE[id] || id)

 return (
  <>
   <button type="button"
    ref={triggerRef}
    onClick={() => setOpen(o => !o)}
    className="w-full flex items-center gap-3 px-6 py-3.5 border-b-2 border-b-danger/30 bg-danger/[0.025] flex-shrink-0 text-left"
   >
    <div className="w-2 h-2 rounded-full bg-danger flex-shrink-0 beat" />
    <span className="font-body font-semibold text-ink text-[13px] flex-1">
     {active.length} active exposure{active.length > 1 ? 's' : ''}
    </span>
    <span className="font-body text-ghost text-[10px]">
     {totalUnits.toLocaleString()} units · {allPlantCodes.join(' · ')} · 24h FSMA
    </span>
    <ChevronDown
     size={13}
     strokeWidth={2}
     className={`text-ghost flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    />
   </button>
   {open && (
    <ExposureOverlay
     triggerRef={triggerRef}
     active={active}
     actions={actions}
     onAction={onAction}
     onBulkAction={onBulkAction}
     onClose={() => setOpen(false)}
    />
   )}
  </>
 )
}

// ── Layer 2: Supplier Risk Registry ───────────────────────────────────────────
// Persistent. Analytical. System of record.
// Rows scale to N suppliers. Affected plants always inline — never hidden.

const COL = '1fr 72px 96px 160px 90px 76px'

function SupplierRegistry({ rows }) {
 const lockedSignals = NETWORK_SIGNALS.filter(s => s.locked)
 return (
  <div className="flex-1 overflow-y-auto flex flex-col">
   {/* Column headers */}
   <div className="grid px-6 py-2 bg-stone2 border-b border-rule2 flex-shrink-0"
    style={{ gridTemplateColumns: COL }}>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Supplier</span>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-right">Net. Risk</span>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-center">Exposures</span>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Affected Plants</span>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-right">Trend</span>
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-right">Confidence</span>
   </div>

   {/* Supplier rows */}
   <div className="flex-1">
    {rows.map(s => {
     const riskColor  = s.networkRisk < 40 ? 'text-danger' : s.networkRisk < 65 ? 'text-warn' : 'text-ok'
     const hasExposure = s.activeExposureCount > 0
     return (
      <div key={s.name}
       className={`grid items-center px-6 py-3.5 border-b border-rule2 border-l-2 ${
        hasExposure ? 'border-l-danger bg-danger/[0.02]' : 'border-l-transparent'
       }`}
       style={{ gridTemplateColumns: COL }}>

       {/* Supplier */}
       <div className="flex items-center gap-2 min-w-0 pr-3">
        {hasExposure && <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0 beat" />}
        <div className="min-w-0">
         <div className={`font-body font-medium text-[12px] truncate ${hasExposure ? 'text-danger' : 'text-ink'}`}>
          {s.name}
         </div>
         {s.note && (
          <div className={`font-body text-[10px] mt-0.5 truncate ${hasExposure ? 'text-danger/70' : 'text-ghost'}`}>
           {s.note}
          </div>
         )}
        </div>
       </div>

       {/* Network Risk — worst score across connected plants */}
       <div className={`display-num text-[18px] font-bold text-right ${riskColor}`}>
        {s.networkRisk}
       </div>

       {/* Exposure Count */}
       <div className="flex justify-center">
        {s.activeExposureCount > 0 ? (
         <span className="font-body text-danger text-[10px] font-medium px-2 py-0.5 bg-danger/10 rounded-btn whitespace-nowrap">
          {s.activeExposureCount} active
         </span>
        ) : (
         <span className="font-body text-ghost text-[10px]">—</span>
        )}
       </div>

       {/* Affected Plants — always inline, never hidden */}
       <div className="font-body text-[11px] min-w-0">
        {s.affectedPlantCodes.length > 0 ? (
         <span className={hasExposure ? 'text-danger' : 'text-ink'}>
          {s.affectedPlantCodes.join(' · ')}
         </span>
        ) : (
         <span className="text-ghost">—</span>
        )}
       </div>

       {/* Trend */}
       <div className="flex items-center justify-end gap-1">
        {s.trend === 'down' && <TrendingDown size={10} strokeWidth={2} className="text-danger flex-shrink-0" />}
        <span className={`font-body text-[10px] ${
         hasExposure || s.tone === 'danger' ? 'text-danger' :
         s.tone === 'warn' ? 'text-warn' : 'text-ghost'
        }`}>
         {s.trend === 'down' ? 'Declining' : s.trend === 'up' ? 'Improving' : 'Stable'}
        </span>
       </div>

       {/* Confidence — from intelligence signal if applicable */}
       <div className="text-right">
        {s.confidence != null ? (
         <span className={`display-num text-[14px] font-bold ${
          s.confidence >= 85 ? 'text-danger' : s.confidence >= 70 ? 'text-warn' : 'text-ghost'
         }`}>{s.confidence}%</span>
        ) : (
         <span className="font-body text-ghost text-[10px]">—</span>
        )}
       </div>
      </div>
     )
    })}
   </div>

   {/* Locked intelligence signals — growth indicators */}
   {lockedSignals.length > 0 && (
    <div className="border-t border-rule2 flex-shrink-0">
     <div className="px-6 py-2 bg-stone2 border-b border-rule2 flex items-center gap-2">
      <Brain size={10} strokeWidth={1.75} className="text-ghost" />
      <span className="font-body text-ghost text-[10px] uppercase tracking-widest">
       {lockedSignals.length} intelligence signals locked — activate at 3 connected plants
      </span>
     </div>
     {lockedSignals.map(sig => (
      <div key={sig.id} className="flex items-start gap-3 px-6 py-3 border-b border-rule2 last:border-b-0 opacity-40">
       <Lock size={10} strokeWidth={2} className="text-ghost flex-shrink-0 mt-0.5" />
       <div className="flex-1 min-w-0">
        <div className="font-body text-ghost text-[11px] leading-snug">{sig.label}</div>
        <div className="font-body text-ghost text-[10px] mt-0.5">{sig.detail}</div>
       </div>
      </div>
     ))}
    </div>
   )}

   {/* Registry footer */}
   <div className="px-6 py-2 border-t border-rule2 bg-stone2 flex-shrink-0">
    <span className="font-body text-ghost text-[10px]">
     Net. Risk = lowest percentile rank across connected plants · Updated weekly · Confidence = AI signal strength
    </span>
   </div>
  </div>
 )
}

// ── Network summary bar — always-visible header ───────────────────────────────
// Replaces the generic ActionBanner. Shows plant risk + intelligence signals.

const PLANTS_NET = [
 { code: 'SL-04', name: 'Salina',  id: 'sl', risk: 22 },
 { code: 'KS-09', name: 'Wichita', id: 'ks', risk: 31 },
 { code: 'CO-07', name: 'Denver',  id: 'co', risk: 67 },
]

function NetworkSummaryBar({ activeExposures, containmentMode }) {
 const activeSignals = NETWORK_SIGNALS.filter(s => s.active)
 const exposedPlants = new Set(activeExposures.flatMap(e => e.affectedPlants))
 const hasAny        = activeExposures.length > 0

 return (
  <div className={`flex border-b-2 flex-shrink-0 ${
   containmentMode ? 'border-b-ok/30 bg-ok/[0.02]'
   : hasAny        ? 'border-b-danger/30 bg-danger/[0.02]'
   :                  'border-b-rule2 bg-stone'
  }`}>

   {/* Plant risk tiles */}
   <div className="flex border-r border-rule2">
    {PLANTS_NET.map(p => {
     const hasExposure = exposedPlants.has(p.id)
     const riskColor   = p.risk < 40 ? 'text-danger' : p.risk < 65 ? 'text-warn' : 'text-ok'
     return (
      <div key={p.code} className={`px-5 py-4 border-r border-rule2 last:border-r-0 ${hasExposure ? 'bg-danger/[0.025]' : ''}`}>
       <div className="flex items-center gap-1.5 mb-1">
        {hasExposure && <div className="w-1.5 h-1.5 rounded-full bg-danger beat flex-shrink-0" />}
        <span className="font-body text-ghost text-[10px]">{p.code} · {p.name}</span>
       </div>
       <div className={`display-num text-[22px] font-bold leading-none ${riskColor}`}>
        {p.risk}
        <span className="font-body text-ghost text-[10px] font-normal ml-1">pct.</span>
       </div>
       <div className="font-body text-ghost text-[9px] mt-0.5">network risk</div>
      </div>
     )
    })}
   </div>

   {/* Active intelligence signals */}
   <div className="flex-1 px-6 py-4 flex flex-col justify-center gap-2.5">
    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Active signals</div>
    {activeSignals.map(sig => (
     <div key={sig.id} className="flex items-start gap-3">
      <span className={`display-num text-[14px] font-bold flex-shrink-0 tabular-nums leading-none mt-px ${
       sig.confidence >= 85 ? 'text-danger' : 'text-warn'
      }`}>{sig.confidence}%</span>
      <span className="font-body text-muted text-[11px] leading-snug">{sig.label}</span>
     </div>
    ))}
   </div>

   {/* Containment indicator */}
   {containmentMode && (
    <div className="flex items-center gap-2 px-6 border-l border-rule2">
     <CheckCircle2 size={14} strokeWidth={2} className="text-ok" />
     <div>
      <div className="font-body font-medium text-ok text-[12px]">Containment active</div>
      <div className="font-body text-ghost text-[10px]">All lots held · FSMA 204 documentation in progress</div>
     </div>
    </div>
   )}
  </div>
 )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NetworkView() {
 const { plantActions, setPlantActions } = useAppState()

 const exposures       = [...(networkData.sharedExposure || []), ...EXTRA_EXPOSURES]
 const activeExposures = exposures.filter(e => !plantActions[e.lotId])
 const containmentMode = exposures.length > 0 && exposures.every(e => plantActions[e.lotId] === 'hold')
 const hasExposure     = activeExposures.length > 0

 const handleAction = (lotId, type) => {
  setPlantActions(p => ({ ...p, [lotId]: type }))
 }

 const handleBulkAction = (type) => {
  const updates = {}
  activeExposures.forEach(e => { updates[e.lotId] = type })
  setPlantActions(p => ({ ...p, ...updates }))
 }

 // Compute registry rows — network risk = worst score, confidence from signals, plants always inline
 const registryRows = SUPPLIER_NETWORK.map(s => {
  const networkRisk = Math.min(s.salina, s.wichita)
  const supplierActive = activeExposures.filter(e => e.supplier === s.name)
  const affectedPlantCodes = [...new Set(supplierActive.flatMap(e =>
   e.affectedPlants.map(id => PLANT_CODE[id] || id)
  ))]
  const signal = NETWORK_SIGNALS.find(sig => sig.active && sig.supplier === s.name)
  return { ...s, networkRisk, activeExposureCount: supplierActive.length, affectedPlantCodes, confidence: signal?.confidence ?? null }
 }).sort((a, b) => {
  if (a.activeExposureCount !== b.activeExposureCount) return b.activeExposureCount - a.activeExposureCount
  return a.networkRisk - b.networkRisk
 })

 return (
  <div className="flex flex-col h-full overflow-hidden content-reveal">
   <NetworkSummaryBar activeExposures={activeExposures} containmentMode={containmentMode} />
   <ExposureCommandSurface
    exposures={exposures}
    actions={plantActions}
    containmentMode={containmentMode}
    onAction={handleAction}
    onBulkAction={handleBulkAction}
   />
   <SupplierRegistry rows={registryRows} />
  </div>
 )
}
