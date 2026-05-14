import { useState } from 'react'
import {
 Building2, Package, Truck, AlertTriangle, Shield,
 Users, MapPin, Clock, Lock, CheckCircle2, Tag,
 Brain, Activity
} from 'lucide-react'
import { networkData } from '../data'
import { useAppState } from '../context/AppState'
import { ActionBanner, PersonAvatar, Btn, ActionCard, StatusIndicator, ExpandableMetadata, StatCell, Layout } from '../components/UI'

const plantMeta = {
 sl: { director: 'J. Crocker', region: 'Salina, KS', initials: 'JC' },
 tx: { director: 'R. Martinez', region: 'Houston, TX', initials: 'RM' },
 ks: { director: 'T. Okonkwo', region: 'Wichita, KS', initials: 'TO' },
}

function PlantCard({ plant, sharedLots }) {
 const meta = plantMeta[plant.id]
 const isAtRisk = plant.status === 'at-risk'
 const scoreColor = plant.score >= 80 ? 'text-ok' : plant.score >= 65 ? 'text-warn' : 'text-danger'

 return (
 <div className={`border border-rule2 border-l-2 ${isAtRisk ? 'border-l-danger bg-danger/[0.03]' : 'border-l-ok bg-stone'}`}>
 {/* Header */}
 <div className="px-3.5 pt-3 pb-2.5 border-b border-rule2">
 <div className="flex items-start justify-between gap-2 mb-1">
 <div className="flex items-center gap-1.5">
 <Building2 size={12} strokeWidth={2} className="text-muted flex-shrink-0 mt-px" />
 <span className="font-body font-medium text-ink text-[13px]">{plant.name}</span>
 </div>
 <div className="flex items-center gap-1 flex-shrink-0">
 <div className={`w-1.5 h-1.5 rounded-full ${isAtRisk ? 'bg-danger beat' : 'bg-ok'}`} />
 <span className={`font-body text-[10px] ${isAtRisk ? 'text-danger' : 'text-ok'}`}>
 {isAtRisk ? 'At risk' : 'Clear'}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 <MapPin size={9} strokeWidth={2} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{meta.region}</span>
 {plant.active && (
 <span className="font-body text-[10px] px-1.5 py-px bg-ochre/20 text-ochre ml-1 rounded-[3px]">This plant</span>
 )}
 </div>
 </div>

 {/* Score */}
 <div className="px-3.5 py-2.5 border-b border-rule2 flex items-center justify-between gap-3">
 <div>
 <div className="font-body text-ghost text-[10px] mb-1">Readiness</div>
 <div className="flex items-baseline gap-2">
 <span className={`display-num text-2xl ${scoreColor}`}>{plant.score}</span>
 <span className="font-body text-ghost text-[10px]">/ 100</span>
 </div>
 </div>
 <div className="text-right">
 <div className="font-body text-ghost text-[10px] mb-1.5">Director</div>
 <div className="flex items-center gap-1.5 justify-end">
 <span className="font-body text-ink text-[11px]">{meta.director}</span>
 <PersonAvatar name={meta.director} size={26} />
 </div>
 </div>
 </div>

 {/* Lots */}
 <div className="px-3.5 py-2.5">
 <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1.5">Active lots</div>
 <div className="flex gap-1 flex-wrap">
 {plant.lots.map(l => {
 const shared = sharedLots.find(s => s.lotId === l)
 return (
 <span key={l} className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-1.5 py-0.5 ${
 shared?.risk === 'danger' ? 'bg-danger/10 text-danger'
 : shared?.risk === 'warn' ? 'bg-warn/10 text-warn'
 : 'bg-stone3 text-muted'
 }`}>
 {shared && <Package size={7} strokeWidth={2} />}
 {l}
 </span>
 )
 })}
 </div>
 </div>
 </div>
 )
}

function ContactCard({ plant }) {
 const meta = plantMeta[plant.id]
 const isAtRisk = plant.status === 'at-risk'
 const scoreColor = plant.score >= 80 ? 'text-ok' : plant.score >= 65 ? 'text-warn' : 'text-danger'
 return (
 <div className={`border border-rule2 border-l-2 ${isAtRisk ? 'border-l-danger bg-danger/[0.02]' : 'border-l-ok bg-stone'}`}>
  <div className="px-3.5 pt-3.5 pb-2 flex items-start gap-3">
  <PersonAvatar name={meta.director} size={40} />
  <div className="flex-1 min-w-0">
   <div className="font-body font-medium text-ink text-[13px]">{meta.director}</div>
   <div className="font-body text-ghost text-[11px]">Plant Director</div>
   <div className="flex items-center gap-1 mt-1">
   <MapPin size={9} strokeWidth={2} className="text-ghost" />
   <span className="font-body text-ghost text-[10px]">{meta.region}</span>
   </div>
  </div>
  <div className="text-right flex-shrink-0">
   <div className={`display-num text-2xl ${scoreColor}`}>{plant.score}</div>
   <div className={`font-body text-[10px] mt-0.5 ${isAtRisk ? 'text-danger' : 'text-ok'}`}>
   {isAtRisk ? 'At risk' : 'Clear'}
   </div>
  </div>
  </div>
  <div className="px-3.5 pb-2.5 flex items-center gap-1.5">
  <span className="font-body text-[10px] px-1.5 py-px bg-stone3 text-muted rounded-[3px]">{plant.code}</span>
  {plant.active && <span className="font-body text-[10px] px-1.5 py-px bg-ochre/20 text-ochre rounded-[3px]">This plant</span>}
  </div>
 </div>
 )
}

function ExposureRow({ exposure }) {
 const isDanger = exposure.risk === 'danger'
 const riskColor = isDanger ? 'text-danger' : 'text-warn'
 const borderTone = isDanger ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn bg-warn/[0.02]'
 return (
 <div className={`border-b border-rule2 last:border-b-0 border-l-2 ${borderTone}`}>
 <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1fr 130px 110px' }}>
 <div>
 <div className="flex items-center gap-1.5 mb-0.5">
 <Package size={11} strokeWidth={2} className={riskColor} />
 <span className={`font-body font-medium text-[13px] ${riskColor}`}>{exposure.ingredient}</span>
 </div>
 <div className="flex items-center gap-1 mb-1">
 <Truck size={9} strokeWidth={2} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{exposure.supplier} · Lot {exposure.lotId}</span>
 </div>
 <div className={`font-body text-[10px] ${riskColor}`}>{exposure.note}</div>
 </div>
 <div className="flex flex-col justify-center">
 <div className="flex items-center gap-1 mb-1.5">
 <Users size={9} strokeWidth={2} className="text-ghost" />
 <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Plants</span>
 </div>
 <div className="flex gap-1 flex-wrap">
 {exposure.affectedPlants.map(p => {
 const plant = networkData.plants.find(pl => pl.id === p)
 return (
 <span key={p} className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
 plant?.active ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
 }`}>
 {plant?.code}
 </span>
 )
 })}
 </div>
 </div>
 <div className="flex flex-col justify-center text-right">
 <div className={`display-num text-xl ${riskColor}`}>{exposure.totalUnits.toLocaleString()}</div>
 <div className="font-body text-ghost text-[10px]">units at risk</div>
 </div>
 </div>
 </div>
 )
}

function ExposureActions({ exposure, actions, onAction }) {
 return (
 <div className="flex gap-2 px-4 pb-3 flex-wrap">
 {actions[exposure.lotId] ? (
 <div className="font-body text-ok text-[10px] slide-in flex items-center gap-1">
 <CheckCircle2 size={10} strokeWidth={2} className="flex-shrink-0" />
 {actions[exposure.lotId] === 'hold' && 'Hold issued to all affected plants · Takorin TX-11 notified'}
 {actions[exposure.lotId] === 'notify' && 'Plant TX-11 director notified · Response expected within 1 hour'}
 {actions[exposure.lotId] === 'capa' && 'CAPA shared to TX-11 · Case mirrored in their register'}
 </div>
 ) : (
 <>
 <Btn variant="primary" className="inline-flex items-center gap-1" onClick={() => onAction(exposure.lotId, 'hold')}><AlertTriangle size={9} strokeWidth={2} />Issue hold — all plants</Btn>
 <Btn variant="secondary" onClick={() => onAction(exposure.lotId, 'notify')}>Notify TX-11 director</Btn>
 <Btn variant="secondary" onClick={() => onAction(exposure.lotId, 'capa')}>Share CAPA to TX-11</Btn>
 </>
 )}
 </div>
 )
}

export default function NetworkView() {
 const { readinessScore, plantActions, setPlantActions } = useAppState()
 const score = readinessScore
 const displayPlants = networkData.plants.map(plant => ({ ...plant, status: 'at-risk' }))
 const atRiskCount = displayPlants.filter(p => p.status === 'at-risk').length
 const isUnlocked = score >= 70
 const [localActions] = useState({})
 const [containmentMode, setContainmentMode] = useState(false)
 const [activeLot, setActiveLot] = useState(null)
 const actions = { ...localActions, ...plantActions }
 const handleAction = (lotId, type) => {
  setPlantActions(p => ({ ...p, [lotId]: type }))
  if (type === 'hold') {
   setContainmentMode(true)
   setActiveLot(lotId)
  }
 }

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">
  {/* Top Bar — Trust & Readiness Strip */}
  <div className="border-b border-rule2 bg-stone3/60 px-4 py-4 flex items-center gap-6 flex-shrink-0">
   <div className="flex items-center gap-2">
    <Shield size={16} className="text-muted" />
    <span className="font-body text-ghost text-[10px] uppercase tracking-wider">Network</span>
    <span className="font-body font-medium text-ink text-[11px]">3 plants connected</span>
   </div>
   <div className="flex items-center gap-2">
    <AlertTriangle size={16} className="text-muted" />
    <span className="font-body text-ghost text-[10px] uppercase tracking-wider">Risks</span>
    <span className="font-body font-medium text-ink text-[11px]">{atRiskCount} plants at risk</span>
   </div>
   <div className="flex items-center gap-2">
    <Activity size={16} className="text-muted" />
    <span className="font-body text-ghost text-[10px] uppercase tracking-wider">Mode</span>
    <span className={`font-body font-medium text-[11px] px-2 py-0.5 rounded-[3px] ${containmentMode ? 'bg-danger/10 text-danger' : 'bg-ok/10 text-ok'}`}>
     {containmentMode ? 'Containment' : 'Monitor'}
    </span>
   </div>
  </div>

  <ActionBanner
   tone={containmentMode ? "danger" : "muted"}
   headline={containmentMode
    ? `Containment active — ${activeLot} hold issued across network`
    : isUnlocked
     ? 'Network view — cross-plant risk correlation active'
     : 'Network view — locked until Data Readiness ≥ 70'}
   body={containmentMode
    ? 'All affected plants notified. Monitor CAPA progress and FSMA 204 compliance.'
    : isUnlocked
     ? 'Supplier issues and lot exposure visible across all plants in the Takorin network.'
     : `Current readiness: ${score}/100. Resolve naming conflicts and context gaps to unlock cross-plant correlation.`}
  />

  {!isUnlocked && !containmentMode && (
   <div className="flex items-center gap-3 px-4 py-4 bg-stone3/60 border-b border-rule2 flex-shrink-0">
    <div className="w-8 h-8 bg-stone3 border border-rule2 flex items-center justify-center flex-shrink-0">
     <Lock size={14} strokeWidth={2} className="text-ghost" />
    </div>
    <div className="flex-1">
     <div className="font-body font-medium text-ink text-[13px]">Cross-plant correlation requires Data Readiness ≥ 70</div>
     <div className="font-body text-muted text-[11px] mt-0.5">
      Current score: {score}/100 — {70 - score} points needed. Resolve ingredient naming conflicts and Oven B sensor context gaps.
     </div>
    </div>
    <div className="flex-shrink-0">
     <div className="h-1.5 w-32 bg-rule2 relative">
      <div
       className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-enter ${score >= 75 ? 'bg-ok' : 'bg-warn'}`}
       style={{ width: `${score}%` }}
      />
     </div>
     <div className="flex justify-between font-body text-ghost text-[10px] mt-0.5">
      <span>{score}</span><span>100</span>
     </div>
    </div>
   </div>
  )}

  {/* Main Content Area */}
  <Layout side={
   <div className="p-4">
    <div className="border border-rule2 p-4 mb-4">
     <div className="flex items-start gap-3">
      <Brain size={20} className="text-muted mt-0.5" />
      <div className="flex-1">
       <div className="font-body font-medium text-ink text-[13px] mb-2">Network Risk Analysis</div>
       <div className="font-body text-ink2 text-[12px] leading-relaxed mb-3">
        {containmentMode
         ? 'Hold active on TS-8811. Track CAPA completion and FSMA submission across Salina and Houston before the 24-hour window closes.'
         : 'Cross-plant lot exposure on TS-8811 requires immediate action. Issue a network hold to contain 5,840 units and maintain FSMA 204 compliance.'}
       </div>
       <div className="space-y-1.5 border border-rule2 p-2">
        <div className="flex justify-between text-[10px]">
         <span className="font-body text-ghost">Cross-plant exposure</span>
         <span className="font-body font-medium text-danger">1 critical lot · TS-8811</span>
        </div>
        <div className="flex justify-between text-[10px]">
         <span className="font-body text-ghost">Containment readiness</span>
         <span className="font-body font-medium text-ok">High · freeze within 1h</span>
        </div>
        <div className="flex justify-between text-[10px]">
         <span className="font-body text-ghost">FSMA compliance</span>
         <span className="font-body font-medium text-warn">24h window · simultaneous</span>
        </div>
       </div>
      </div>
     </div>
    </div>

    <div className="border border-rule2 p-4 mb-4">
     <div className="font-body font-medium text-ink text-[13px] mb-3">What you should do next</div>
     <div className="space-y-2">
      {containmentMode ? (
       <>
        <div className="p-2 border border-ok/20">
         <div className="font-body font-medium text-ink text-[11px]">Monitor plant acknowledgments</div>
         <div className="font-body text-ghost text-[10px]">Impact: confirms full network hold</div>
        </div>
        <div className="p-2 border border-ok/20">
         <div className="font-body font-medium text-ink text-[11px]">Complete CAPA documentation</div>
         <div className="font-body text-ghost text-[10px]">Impact: closes FSMA 24h compliance window</div>
        </div>
       </>
      ) : (
       <>
        <div className="p-2 border border-ok/20">
         <div className="font-body font-medium text-ink text-[11px]">Issue hold — all plants</div>
         <div className="font-body text-ghost text-[10px]">Impact: contains 5,840 units across network</div>
        </div>
        <div className="p-2 border border-ok/20">
         <div className="font-body font-medium text-ink text-[11px]">Notify TX-11 director</div>
         <div className="font-body text-ghost text-[10px]">Impact: triggers CAPA coordination</div>
        </div>
       </>
      )}
     </div>
    </div>

    <ExpandableMetadata title="Recall Simulation" tone="muted">
     <div className="space-y-3">
      <div className="p-3 border border-rule2">
       <div className="font-body font-medium text-ink text-[11px] mb-2">If TS-8811 recalled today:</div>
       <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
         <span className="font-body text-ghost">Plants affected:</span>
         <span className="font-body font-medium text-danger">2/3</span>
        </div>
        <div className="flex justify-between">
         <span className="font-body text-ghost">Units contained:</span>
         <span className="font-body font-medium text-ok">5,840</span>
        </div>
        <div className="flex justify-between">
         <span className="font-body text-ghost">Containment time:</span>
         <span className="font-body font-medium text-warn">24h</span>
        </div>
        <div className="flex justify-between">
         <span className="font-body text-ghost">FSMA compliance:</span>
         <span className="font-body font-medium text-ok">Achievable</span>
        </div>
       </div>
      </div>
      <div className="p-3 border border-rule2">
       <div className="font-body font-medium text-ink text-[11px] mb-2">Without network correlation:</div>
       <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
         <span className="font-body text-ghost">Detection delay:</span>
         <span className="font-body font-medium text-danger">48-72h</span>
        </div>
        <div className="flex justify-between">
         <span className="font-body text-ghost">Additional exposure:</span>
         <span className="font-body font-medium text-danger">+2,300 units</span>
        </div>
        <div className="flex justify-between">
         <span className="font-body text-ghost">FSMA violation risk:</span>
         <span className="font-body font-medium text-danger">High</span>
        </div>
       </div>
      </div>
     </div>
    </ExpandableMetadata>
   </div>
  }>
   <div className="p-4 pb-32 space-y-6">
    {/* Network Overview */}
    <div className="grid grid-cols-4 gap-4">
    {[
     { v: '3', l: 'Plants connected', Icon: Building2, tone: 'text-ink' },
     { v: `${atRiskCount}`, l: 'Plants at risk', Icon: AlertTriangle, tone: 'text-danger' },
     { v: '5', l: 'Shared lot numbers', Icon: Tag, tone: 'text-warn' },
     { v: '5,840', l: 'Units exposed', Icon: Shield, tone: 'text-danger' },
    ].map(({ v, l, Icon, tone }, i) => (
     <div key={i} className="p-3 border border-rule2">
      <div className="flex items-center gap-2 mb-2">
       <Icon size={14} strokeWidth={2} className="text-muted" />
       <span className="font-body text-ghost text-[10px] uppercase tracking-wider">{l}</span>
      </div>
      <div className={`display-num text-2xl ${tone}`}>{v}</div>
     </div>
    ))}
   </div>

   {/* Shared Exposure */}
   <div>
    <div className="font-body font-medium text-ink text-[13px] mb-4">Shared Exposure</div>
    <div className="space-y-3">
     {networkData.sharedExposure.map((e, i) => (
      <ActionCard
       key={i}
       tone="danger"
       title={`${e.lotId} — Cross-plant exposure`}
       subtitle={`${e.affectedPlants.length} plants affected · ${e.totalUnits.toLocaleString()} units at risk`}
       metadata={[
        `Supplier: ${e.supplier}`,
        `Delivery: ${e.deliveryDate}`,
        'FSMA 204 traceability gap'
       ]}
       status={actions[e.lotId] ? <StatusIndicator status="complete" tone="ok" /> : null}
       actions={
        actions[e.lotId] ? (
         <div className="font-body text-ok text-[10px] flex items-center gap-1">
          <CheckCircle2 size={10} />
          {actions[e.lotId] === 'hold' && 'Hold issued to all affected plants'}
          {actions[e.lotId] === 'notify' && 'Plant directors notified'}
          {actions[e.lotId] === 'capa' && 'CAPA shared across network'}
         </div>
        ) : (
         <div className="flex gap-2">
          <Btn variant="primary" onClick={() => handleAction(e.lotId, 'hold')}>
           Issue hold — all plants
          </Btn>
          <Btn variant="secondary" onClick={() => handleAction(e.lotId, 'notify')}>
           Notify directors
          </Btn>
         </div>
        )
       }
      >
       <div className="flex gap-1 flex-wrap mt-2">
        {e.affectedPlants.map(p => {
         const plant = networkData.plants.find(pl => pl.id === p)
         return (
          <span key={p} className={`font-body font-medium text-[10px] px-2 py-1 rounded-[3px] ${
           plant?.active ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
          }`}>
           {plant?.code}
          </span>
         )
        })}
       </div>
      </ActionCard>
     ))}
    </div>
   </div>

   {/* Containment Mode UI */}
   {containmentMode && activeLot && (
    <div className="border border-danger bg-danger/[0.03] p-4">
     <div className="flex items-start gap-3">
      <AlertTriangle size={20} className="text-danger mt-0.5" />
      <div className="flex-1">
       <div className="font-body font-medium text-ink text-[13px] mb-2">Containment Active</div>
       <div className="font-body text-ink2 text-[12px] leading-relaxed mb-3">
        Hold issued for {activeLot} across all affected plants. Systems frozen, notifications sent.
       </div>
       <div className="grid grid-cols-3 gap-4 text-[11px]">
        <div className="flex items-center gap-2">
         <CheckCircle2 size={12} className="text-ok" />
         <span className="font-body text-ghost">MES frozen</span>
        </div>
        <div className="flex items-center gap-2">
         <CheckCircle2 size={12} className="text-ok" />
         <span className="font-body text-ghost">ERP locked</span>
        </div>
        <div className="flex items-center gap-2">
         <Clock size={12} className="text-warn" />
         <span className="font-body text-ghost">CAPA pending</span>
        </div>
       </div>
      </div>
     </div>
    </div>
   )}
   </div>
  </Layout>
 </div>
 )
}
