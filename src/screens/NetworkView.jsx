import { useState } from 'react'
import {
 Building2, Package, Truck, AlertTriangle, Shield,
 Users, MapPin, Clock, Globe2, Lock, CheckCircle2, Tag
} from 'lucide-react'
import { networkData } from '../data'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, ActionBanner, PersonAvatar } from '../components/UI'

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
 <Building2 size={12} strokeWidth={1.75} className="text-muted flex-shrink-0 mt-px" />
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
 <MapPin size={9} strokeWidth={1.5} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{meta.region}</span>
 {plant.active && (
 <span className="font-body text-[9px] px-1.5 py-px bg-ochre/20 text-ochre ml-1">This plant</span>
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

function ContactRow({ plant }) {
 const meta = plantMeta[plant.id]
 const isAtRisk = plant.status === 'at-risk'
 const scoreColor = plant.score >= 80 ? 'text-ok' : plant.score >= 65 ? 'text-warn' : 'text-danger'
 return (
 <div className="flex items-center gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors">
 <PersonAvatar name={meta.director} size={36} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-body font-medium text-ink text-[13px]">{meta.director}</span>
 <span className="font-body text-ghost text-[10px]">Plant Director</span>
 </div>
 <div className="flex items-center gap-1">
 <MapPin size={9} strokeWidth={1.5} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{meta.region}</span>
 <span className="font-body text-ghost text-[10px] mx-1">·</span>
 <span className="font-body font-medium text-muted text-[10px]">{plant.code}</span>
 </div>
 </div>
 <div className="text-right flex-shrink-0">
 <div className={`display-num text-xl ${scoreColor}`}>{plant.score}</div>
 <div className={`font-body text-[10px] mt-0.5 ${isAtRisk ? 'text-danger' : 'text-ok'}`}>
 {isAtRisk ? 'At risk' : 'Clear'}
 </div>
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
 <Package size={11} strokeWidth={1.75} className={riskColor} />
 <span className={`font-body font-medium text-[13px] ${riskColor}`}>{exposure.ingredient}</span>
 </div>
 <div className="flex items-center gap-1 mb-1">
 <Truck size={9} strokeWidth={1.5} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{exposure.supplier} · Lot {exposure.lotId}</span>
 </div>
 <div className={`font-body text-[10px] ${riskColor}`}>{exposure.note}</div>
 </div>
 <div className="flex flex-col justify-center">
 <div className="flex items-center gap-1 mb-1.5">
 <Users size={9} strokeWidth={1.75} className="text-ghost" />
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
 <button type="button" onClick={() => onAction(exposure.lotId, 'hold')}
 className="inline-flex items-center gap-1 font-body font-medium text-[10px] px-2.5 py-1 bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
 <AlertTriangle size={9} strokeWidth={2} />
 Issue hold — all plants
 </button>
 <button type="button" onClick={() => onAction(exposure.lotId, 'notify')}
 className="font-body text-[10px] px-2.5 py-1 bg-stone2 text-muted hover:bg-stone3 transition-colors">
 Notify TX-11 director
 </button>
 <button type="button" onClick={() => onAction(exposure.lotId, 'capa')}
 className="font-body text-[10px] px-2.5 py-1 bg-stone2 text-muted hover:bg-stone3 transition-colors">
 Share CAPA to TX-11
 </button>
 </>
 )}
 </div>
 )
}

export default function NetworkView() {
 const { readinessScore, plantActions, setPlantActions } = useAppState()
 const [localActions] = useState({})
 const actions = { ...localActions, ...plantActions }
 const handleAction = (lotId, type) => {
 setPlantActions(p => ({ ...p, [lotId]: type }))
 }
 const score = readinessScore ?? 64
 const isUnlocked = score >= 70

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <ActionBanner
 color="#C17D2A"
 headline={isUnlocked
 ? 'Network view — cross-plant risk correlation active'
 : 'Network view — locked until Data Readiness ≥ 70'}
 body={isUnlocked
 ? 'Supplier issues and lot exposure visible across all plants in the Takorin network.'
 : `Current readiness: ${score}/100. Resolve naming conflicts and context gaps to unlock cross-plant correlation.`}
 />

 {!isUnlocked && (
 <div className="flex items-center gap-3 px-5 py-4 bg-stone3/60 border-b border-rule2 flex-shrink-0">
 <div className="w-8 h-8 bg-stone3 border border-rule2 flex items-center justify-center flex-shrink-0">
 <Lock size={14} strokeWidth={1.75} className="text-ghost" />
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
 className={`absolute inset-y-0 left-0 transition-all duration-700 ${score >= 75 ? 'bg-ok' : 'bg-warn'}`}
 style={{ width: `${score}%` }}
 />
 </div>
 <div className="flex justify-between font-body text-ghost text-[10px] mt-0.5">
 <span>{score}</span><span>100</span>
 </div>
 </div>
 </div>
 )}

 <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${!isUnlocked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
 <div className="flex-1 overflow-y-auto">

 {/* Network overview */}
 <div className="grid grid-cols-4 border-b border-rule2">
 {[
 { v: '3', l: 'Plants connected', Icon: Building2, tone: 'text-ink' },
 { v: '1', l: 'Plants at risk', Icon: AlertTriangle, tone: 'text-danger' },
 { v: '5', l: 'Shared lot numbers', Icon: Tag, tone: 'text-warn' },
 { v: '5,840', l: 'Units exposed', Icon: Shield, tone: 'text-danger' },
 ].map(({ v, l, Icon, tone }, i) => (
 <div key={i} className="px-4 py-3 border-r border-rule2 last:border-r-0">
 <div className="flex items-center gap-1 mb-1">
 <Icon size={10} strokeWidth={1.75} className="text-ghost" />
 <span className="font-body text-ghost text-[10px] uppercase tracking-widest">{l}</span>
 </div>
 <div className={`display-num text-2xl ${tone}`}>{v}</div>
 </div>
 ))}
 </div>

 {/* Plant network */}
 <SecHd
 tag="Plant network"
 title="3 plants · Salina region"
 icon={Globe2}
 badge={<Urg level="warn">1 at-risk · 2 clear</Urg>}
 />
 <div className="grid grid-cols-3 gap-3 p-4">
 {networkData.plants.map(plant => (
 <PlantCard key={plant.id} plant={plant} sharedLots={networkData.sharedExposure} />
 ))}
 </div>

 {/* Plant contacts */}
 <div className="border-t border-rule2">
 <SecHd tag="Plant contacts" title="Directors across the network" icon={Users} />
 {networkData.plants.map(plant => (
 <ContactRow key={plant.id} plant={plant} />
 ))}
 </div>

 {/* Shared exposure */}
 <div className="border-t border-rule2">
 <SecHd
 tag="Shared lot exposure"
 title="Ingredients shared across plants — recall blast radius"
 icon={Package}
 badge={<Urg level="danger">1 high-risk lot · 2 plants affected</Urg>}
 />
 {networkData.sharedExposure.map((e, i) => (
 <div key={i}>
 <ExposureRow exposure={e} />
 <ExposureActions exposure={e} actions={actions} onAction={handleAction} />
 </div>
 ))}
 </div>

 {/* Recall simulation */}
 <div className="border-t border-rule2">
 <SecHd
 tag="Network recall simulation"
 title="If TS-8811 is recalled today — cross-plant impact"
 icon={Shield}
 badge={<Urg level="info">Simulation only</Urg>}
 />
 <div className="grid grid-cols-4 border-b border-rule2">
 {[
 { v: '2', l: 'Plants affected', Icon: Building2 },
 { v: '5,840', l: 'Units at risk', Icon: Package },
 { v: '4', l: 'Lot numbers', Icon: Tag },
 { v: '24h', l: 'Containment est.', Icon: Clock },
 ].map(({ v, l, Icon }, i) => (
 <div key={i} className="px-4 py-3 border-r border-rule2 last:border-r-0">
 <div className="flex items-center gap-1 mb-1">
 <Icon size={9} strokeWidth={1.75} className="text-ghost" />
 <span className="font-body text-ghost text-[10px]">{l}</span>
 </div>
 <div className="display-num text-2xl text-danger">{v}</div>
 </div>
 ))}
 </div>
 <div className="px-4 py-3 font-body text-muted text-[11px] leading-relaxed">
 Salina (SL-04) and Plant TX-11 share ConAgra Tomato Sauce from the same production batch. A recall would require simultaneous hold and traceability submission from both plants within 24 hours per FSMA 204.
 </div>
 </div>

 </div>
 </div>
 </div>
 )
}
