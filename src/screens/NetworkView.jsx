import { useState } from 'react'
import { networkData } from '../data'
import { useAppState } from '../context/AppState'
import { SecHd, Urg, Btn, ActionBanner } from '../components/UI'

function PlantCard({ plant, sharedLots }) {
  const scoreColor = plant.score >= 80 ? 'text-ok' : plant.score >= 65 ? 'text-warn' : 'text-danger'
  const statusBg = plant.status === 'at-risk' ? 'bg-danger/[0.03] border-l-danger' : 'border-l-ok'
  return (
    <div className={`border border-rule2 border-l-2 ${statusBg} bg-stone`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-rule2">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${plant.status === 'at-risk' ? 'bg-danger beat' : 'bg-ok'}`} />
            <span className="font-body font-medium text-ink text-[13px]">{plant.name}</span>
            {plant.active && <span className="font-body italic text-[9px] px-1.5 py-px bg-ochre/10 text-ochre">This plant</span>}
          </div>
          <div className="font-body italic text-ghost text-[10px] mt-0.5">{plant.code}</div>
        </div>
        <div className="text-right">
          <div className={`display-num text-2xl ${scoreColor}`}>{plant.score}</div>
          <div className="font-body italic text-ghost text-[9px]">readiness</div>
        </div>
      </div>
      <div className="px-4 py-2.5">
        <div className="font-body italic text-ghost text-[9px] uppercase tracking-widest mb-1.5">Active lots</div>
        <div className="flex gap-1.5 flex-wrap">
          {plant.lots.map(l => {
            const shared = sharedLots.find(s => s.lotId === l)
            return (
              <span key={l} className={`font-body italic font-medium text-[10px] px-2 py-0.5 ${shared?.risk === 'danger' ? 'bg-danger/10 text-danger' : shared?.risk === 'warn' ? 'bg-warn/10 text-warn' : 'bg-stone3 text-muted'}`}>
                {l}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExposureRow({ exposure }) {
  const riskColor = exposure.risk === 'danger' ? 'text-danger' : 'text-warn'
  const riskBg = exposure.risk === 'danger' ? 'bg-danger/[0.03] border-l-danger' : 'bg-warn/[0.02] border-l-warn'
  return (
    <div className={`border-b border-rule2 last:border-b-0 border-l-2 ${riskBg}`}>
      <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1fr 120px 100px' }}>
        <div>
          <div className={`font-body font-medium text-[13px] ${riskColor}`}>{exposure.ingredient}</div>
          <div className="font-body italic text-ghost text-[10px] mt-0.5">{exposure.supplier} · Lot {exposure.lotId}</div>
          <div className={`font-body italic text-[10px] mt-1 ${riskColor}`}>{exposure.note}</div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="font-body italic text-ghost text-[9px] uppercase tracking-widest mb-1">Affected plants</div>
          <div className="flex gap-1 flex-wrap">
            {exposure.affectedPlants.map(p => {
              const plant = networkData.plants.find(pl => pl.id === p)
              return (
                <span key={p} className={`font-body italic font-medium text-[9px] px-1.5 py-0.5 ${p === 'sl' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>
                  {plant?.code}
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col justify-center text-right">
          <div className={`display-num text-xl ${riskColor}`}>{exposure.totalUnits.toLocaleString()}</div>
          <div className="font-body italic text-ghost text-[9px]">units at risk</div>
        </div>
      </div>
    </div>
  )
}

function ExposureActions({ exposure, actions, onAction }) {
  return (
    <div className="flex gap-2 px-4 pb-3 flex-wrap">
      {actions[exposure.lotId] ? (
        <div className="font-body italic text-ok text-[10px] slide-in">
          {actions[exposure.lotId] === 'hold' && '⚑ Hold issued to all affected plants · Takorin TX-11 notified'}
          {actions[exposure.lotId] === 'notify' && '✓ Plant TX-11 director notified · Response expected within 1 hour'}
          {actions[exposure.lotId] === 'capa' && '✓ CAPA shared to TX-11 · Case mirrored in their register'}
        </div>
      ) : (
        <>
          <button onClick={() => onAction(exposure.lotId, 'hold')}
            className="font-body font-medium text-[10px] px-2.5 py-1 bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
            Issue hold — all plants
          </button>
          <button onClick={() => onAction(exposure.lotId, 'notify')}
            className="font-body italic text-[10px] px-2.5 py-1 bg-stone2 text-muted hover:bg-stone3 transition-colors">
            Notify TX-11 director
          </button>
          <button onClick={() => onAction(exposure.lotId, 'capa')}
            className="font-body italic text-[10px] px-2.5 py-1 bg-stone2 text-muted hover:bg-stone3 transition-colors">
            Share CAPA to TX-11
          </button>
        </>
      )}
    </div>
  )
}

export default function NetworkView() {
  const { readinessScore, plantActions, setPlantActions } = useAppState()
  const [localActions, setLocalActions] = useState({})
  const actions = { ...localActions, ...plantActions }
  const handleAction = (lotId, type) => {
    setPlantActions(p => ({ ...p, [lotId]: type }))
  }
  const score = readinessScore ?? 64
  const isUnlocked = score >= 90

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ActionBanner
        color="#C17D2A"
        headline={isUnlocked ? 'Network view — cross-plant risk correlation active' : 'Network view — locked until Data Readiness ≥ 90'}
        body={isUnlocked
          ? 'Supplier issues and lot exposure visible across all plants in the Takorin network.'
          : `Current readiness: ${score}/100. Resolve naming conflicts and context gaps to unlock cross-plant correlation.`}
      />

      {!isUnlocked && (
        <div className="flex items-center gap-3 px-5 py-4 bg-stone3/60 border-b border-rule2">
          <div className="w-8 h-8 rounded-full bg-stone3 border border-rule2 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 stroke-ghost" fill="none" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-body font-medium text-ink text-[13px]">Cross-plant correlation requires Data Readiness ≥ 90</div>
            <div className="font-body italic text-muted text-[11px] mt-0.5">
              Current score: {score}/100 — {90 - score} points needed. Resolve ingredient naming conflicts and Oven B sensor context gaps.
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-2 w-32 bg-rule2 relative">
              <div className="absolute inset-y-0 left-0 transition-all duration-700"
                style={{ width: `${score}%`, background: score >= 75 ? '#3A8A5A' : '#C4920A' }} />
              <div className="absolute inset-y-0 right-0 w-px bg-ink opacity-30" style={{ right: '10%' }} />
            </div>
            <div className="flex justify-between font-body italic text-ghost text-[9px] mt-0.5">
              <span>{score}</span><span>90</span><span>100</span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${!isUnlocked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {/* Plant status */}
        <SecHd tag="Plant network" title="3 plants · Salina region"
          badge={<Urg level="warn">1 at-risk · 2 clear</Urg>} />
        <div className="grid grid-cols-3 gap-4 p-4">
          {networkData.plants.map(plant => (
            <PlantCard key={plant.id} plant={plant} sharedLots={networkData.sharedExposure} />
          ))}
        </div>

        {/* Shared exposure */}
        <div className="border-t border-rule2">
          <SecHd tag="Shared lot exposure" title="Ingredients shared across plants — recall blast radius"
            badge={<Urg level="danger">1 high-risk lot · 2 plants affected</Urg>} />
          {networkData.sharedExposure.map((e, i) => (
            <div key={i}>
              <ExposureRow exposure={e} />
              <ExposureActions exposure={e} actions={actions} onAction={handleAction} />
            </div>
          ))}
        </div>

        {/* Recall simulation */}
        <div className="border-t border-rule2">
          <SecHd tag="Network recall simulation" title="If TS-8811 is recalled today — cross-plant impact"
            badge={<Urg level="info">Simulation only</Urg>} />
          <div className="grid grid-cols-4 border-b border-rule2">
            {[{v:'2',l:'Plants affected'},{v:'5,840',l:'Units at risk'},{v:'4',l:'Lot numbers'},{v:'24h',l:'Containment est.'}].map((s,i)=>(
              <div key={i} className="px-4 py-3 border-r border-rule2 last:border-r-0">
                <div className="display-num text-2xl text-danger">{s.v}</div>
                <div className="font-body italic text-ghost text-[10px] mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 font-body italic text-muted text-[11px] leading-relaxed">
            Salina (SL-04) and Plant TX-11 share ConAgra Tomato Sauce from the same production batch. A recall would require simultaneous hold and traceability submission from both plants within 24 hours per FSMA 204.
          </div>
        </div>
      </div>
    </div>
  )
}
