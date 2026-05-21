import { useState } from 'react'
import { equipment, recipes, spcData, runHistory } from '../data/equipment'
import { AlertTriangle, CheckCircle2, Wrench, Activity, Clock } from 'lucide-react'
import { SceneHeader, SectionHeader, StatusPill, Btn } from '../components/UI'
import { useAppState } from '../context/AppState'

const STATUS_CFG = {
  active:      { label: 'Active',       dot: 'bg-ok',     badge: 'bg-ok/10 text-ok' },
  maintenance: { label: 'Maintenance',  dot: 'bg-warn',   badge: 'bg-warn/10 text-warn' },
  offline:     { label: 'Offline',      dot: 'bg-danger', badge: 'bg-danger/[0.04] text-danger' },
  idle:        { label: 'Idle',         dot: 'bg-muted',  badge: 'bg-stone3 text-muted' },
}

const SPC_CFG = {
  'in-control': { label: 'In control', tone: 'text-ok',   dot: 'bg-ok' },
  'warning':    { label: 'Warning',    tone: 'text-warn',  dot: 'bg-warn' },
  'out-of-control': { label: 'Out of control', tone: 'text-danger', dot: 'bg-danger' },
}

function HealthBar({ score }) {
  const tone = score >= 90 ? 'bg-ok' : score >= 75 ? 'bg-ochre' : 'bg-warn'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-rule2">
        <div className={`h-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-body text-label tabular-nums w-6 text-right ${score >= 90 ? 'text-ok' : score >= 75 ? 'text-ochre' : 'text-warn'}`}>
        {score}
      </span>
    </div>
  )
}

function EquipmentCard({ eq, selected, onClick }) {
  const cfg = STATUS_CFG[eq.status] ?? STATUS_CFG.idle
  const spcCfg = eq.spcStatus ? SPC_CFG[eq.spcStatus] : null
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3 border-b border-rule2 transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-display font-medium text-ink text-base leading-snug">{eq.name}</div>
          <div className="font-body text-muted text-label">{eq.type} · {eq.zone}</div>
        </div>
        <StatusPill tone={eq.status === 'active' ? 'ok' : eq.status === 'maintenance' ? 'warn' : eq.status === 'offline' ? 'danger' : 'muted'} className="flex-shrink-0">{cfg.label}</StatusPill>
      </div>
      {eq.status === 'active' && <HealthBar score={eq.healthScore} />}
      <div className="flex items-center gap-3 mt-1.5">
        {eq.activeLot && (
          <span className="font-body text-muted text-label">{eq.activeLot}</span>
        )}
        {spcCfg && (
          <div className="ml-auto">
            <StatusPill tone={eq.spcStatus === 'in-control' ? 'ok' : eq.spcStatus === 'warning' ? 'warn' : 'danger'}>{spcCfg.label}</StatusPill>
          </div>
        )}
      </div>
    </button>
  )
}

function SPCChart({ eqId }) {
  const data = spcData[eqId]
  if (!data || !data.points || data.points.length < 2) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      {!data ? 'No SPC data available' : 'Insufficient data — 2 runs minimum'}
    </div>
  )

  const W = 100, H = 100
  const { points, target, ucl, lcl, param, unit } = data
  const pad = { top: 10, right: 8, bottom: 16, left: 8 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom

  const range = ucl - lcl
  const yPad = range * 0.15
  const minY = lcl - yPad
  const maxY = ucl + yPad
  const yRange = maxY - minY

  const toX = (i) => pad.left + (i / (points.length - 1)) * cW
  const toY = (v) => pad.top + (1 - (v - minY) / yRange) * cH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`).join(' ')

  const uclY = toY(ucl).toFixed(1)
  const lclY = toY(lcl).toFixed(1)
  const tgtY = toY(target).toFixed(1)

  const pointColor = (v) => {
    if (v > ucl || v < lcl) return '#E55'
    if (v > ucl - range * 0.1 || v < lcl + range * 0.1) return '#D4913A'
    return '#3A9E6F'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
        <div>
          <span className="font-body text-muted text-label">SPC · {param}</span>
        </div>
        <div className="flex items-center gap-4 text-label font-body">
          <span className="flex items-center gap-1 text-danger"><span className="w-3 border-t border-dashed border-danger" />UCL {ucl}{unit}</span>
          <span className="flex items-center gap-1 text-ok"><span className="w-3 border-t border-dotted border-ok" />Target {target}{unit}</span>
          <span className="flex items-center gap-1 text-danger"><span className="w-3 border-t border-dashed border-danger" />LCL {lcl}{unit}</span>
        </div>
      </div>
      <div className="flex-1 px-5 py-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          {/* UCL */}
          <line x1={pad.left} y1={uclY} x2={W - pad.right} y2={uclY} stroke="#E55" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* LCL */}
          <line x1={pad.left} y1={lclY} x2={W - pad.right} y2={lclY} stroke="#E55" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* Target */}
          <line x1={pad.left} y1={tgtY} x2={W - pad.right} y2={tgtY} stroke="#3A9E6F" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.6" />
          {/* Band */}
          <rect x={pad.left} y={uclY} width={cW} height={parseFloat(lclY) - parseFloat(uclY)} fill="rgba(58,158,111,0.04)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="#7B6E64" strokeWidth="0.8" />
          {/* Points */}
          {points.map((p, i) => (
            <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.2" fill={pointColor(p.value)} />
          ))}
        </svg>
      </div>
      {/* X axis labels */}
      <div className="flex-shrink-0 px-5 pb-2 flex justify-between">
        <span className="font-body text-muted text-micro">Run 1</span>
        <span className="font-body text-muted text-micro">Run {points.length}</span>
      </div>
    </div>
  )
}

function RecipePanel({ recipeId }) {
  const recipe = recipeId ? recipes[recipeId] : null
  if (!recipe) return null
  return (
    <div className="flex-shrink-0 border-t border-rule2">
      <SectionHeader title={`Active recipe · ${recipe.name} v${recipe.version}`} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule2 bg-stone2">
              {['Parameter', 'LCL', 'Target', 'UCL'].map(h => (
                <th key={h} className="px-4 py-1.5 text-left font-body text-muted text-micro">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recipe.parameters.map(p => (
              <tr key={p.name} className="border-b border-rule2 hover:bg-stone2/40">
                <td className="px-4 py-2 font-body text-ink text-label">{p.name}</td>
                <td className="px-4 py-2 font-body text-warn text-label tabular-nums">{p.lcl}{p.unit}</td>
                <td className="px-4 py-2 font-body font-medium text-ink text-label tabular-nums">{p.target}{p.unit}</td>
                <td className="px-4 py-2 font-body text-warn text-label tabular-nums">{p.ucl}{p.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RunHistory({ eqId }) {
  const runs = runHistory[eqId]
  if (!runs || runs.length === 0) return null
  const OUTCOME_CFG = {
    'in-progress': { cls: 'bg-ochre/10 text-ochre', label: 'In progress' },
    'pending-qp':  { cls: 'bg-warn/10 text-warn',   label: 'Pending QP' },
    'released':    { cls: 'bg-ok/10 text-ok',        label: 'Released' },
    'rejected':    { cls: 'bg-danger/10 text-danger', label: 'Rejected' },
  }
  return (
    <div className="flex-shrink-0 border-t border-rule2">
      <SectionHeader title="Run history" />
      {runs.map(r => {
        const oc = OUTCOME_CFG[r.outcome] ?? OUTCOME_CFG.released
        return (
          <div key={r.run} className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2">
            <span className="font-body text-muted text-label w-8 flex-shrink-0">R{r.run}</span>
            <div className="flex-1 min-w-0">
              <div className="font-body text-ink text-label">{r.lot}</div>
              <div className="font-body text-muted text-label">{r.recipe} · {r.startDate}{r.endDate ? ` → ${r.endDate}` : ' → present'}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <StatusPill tone={r.outcome === 'in-progress' ? 'ochre' : r.outcome === 'pending-qp' ? 'warn' : r.outcome === 'released' ? 'ok' : 'danger'}>{oc.label}</StatusPill>
              {r.spcViolations > 0 && (
                <div className="font-body text-warn text-micro">{r.spcViolations} SPC violation{r.spcViolations > 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EquipmentDetail({ eq }) {
  const { maintenanceTickets, setMaintenanceTickets } = useAppState()
  const [pmRequested, setPmRequested] = useState(false)

  if (!eq) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      Select equipment
    </div>
  )
  const cfg = STATUS_CFG[eq.status] ?? STATUS_CFG.idle
  const spcCfg = eq.spcStatus ? SPC_CFG[eq.spcStatus] : null

  const existingTicket = maintenanceTickets.find(t => t.equipment?.includes(eq.name) && t.status === 'open')

  const handleRequestPM = () => {
    const urgency = eq.healthScore < 75 || spcCfg?.label === 'Out of control' ? 'danger' : 'warn'
    setMaintenanceTickets(p => [...p, {
      id: `MT-${Date.now()}`,
      equipment: `${eq.name} · ${eq.zone}`,
      issue: `PM window requested · Health ${eq.healthScore ?? '—'} · Next scheduled ${eq.nextPM}`,
      urgency,
      status: 'open',
      requestedBy: 'D. Kowalski',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }])
    setPmRequested(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <StatusPill tone={eq.status === 'active' ? 'ok' : eq.status === 'maintenance' ? 'warn' : eq.status === 'offline' ? 'danger' : 'muted'}>{cfg.label}</StatusPill>
            {spcCfg && (
              <StatusPill tone={eq.spcStatus === 'in-control' ? 'ok' : eq.spcStatus === 'warning' ? 'warn' : 'danger'}>SPC {spcCfg.label}</StatusPill>
            )}
          </div>
          {eq.status !== 'maintenance' && (
            existingTicket ? (
              <span className="font-body text-label text-warn flex items-center gap-1 flex-shrink-0">
                <Wrench size={10} strokeWidth={2} />PM requested
              </span>
            ) : pmRequested ? (
              <span className="font-body text-label text-ok flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 size={10} strokeWidth={2} />PM ticket created
              </span>
            ) : (
              <Btn variant="secondary" icon={Wrench} onClick={handleRequestPM}>Request PM</Btn>
            )
          )}
        </div>
        <div className="font-display font-bold text-ink text-subhead leading-none mb-0.5">{eq.name}</div>
        <div className="font-body text-muted text-body">{eq.type} · {eq.zone}</div>
      </div>

      {/* Metrics */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-px bg-rule2 border-b border-rule2">
        {[
          { label: 'Health', val: eq.status === 'active' ? `${eq.healthScore}` : '—', tone: eq.healthScore >= 90 ? 'text-ok' : eq.healthScore >= 75 ? 'text-ochre' : 'text-warn' },
          { label: 'Total runs', val: String(eq.totalRuns), tone: 'text-ink' },
          { label: 'Last PM', val: eq.lastPM, tone: 'text-muted' },
          { label: 'Next PM', val: eq.nextPM, tone: eq.status === 'maintenance' ? 'text-warn' : 'text-muted' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-muted text-label mb-0.5">{label}</div>
            <div className={`display-num text-head ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* SPC chart */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        {eq.status === 'active' && spcData[eq.id] ? (
          <div className="h-[220px] flex-shrink-0">
            <SPCChart eqId={eq.id} />
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center border-b border-rule2">
            <span className="font-body text-muted text-label">
              {eq.status === 'maintenance' ? 'Equipment in maintenance — SPC suspended' : 'No active run — SPC not available'}
            </span>
          </div>
        )}

        <RecipePanel recipeId={eq.activeRecipe} />
        <RunHistory eqId={eq.id} />
      </div>
    </div>
  )
}

export default function EquipmentIntelligence() {
  const [selectedId, setSelectedId] = useState(null)
  const selectedEq = equipment.find(e => e.id === selectedId)

  const warnings = equipment.filter(e => e.spcStatus === 'warning' || e.spcStatus === 'out-of-control')
  const maintenance = equipment.filter(e => e.status === 'maintenance')

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <SceneHeader
        module="EQUIPMENT"
        context="Line 4 · Active monitoring"
        metric={71}
        metricLabel="equipment health"
        metricColor="var(--color-warn)"
        statement="Sensor A-7 at count 4 of 5 threshold. Oven B calibration stale 2h 14m. 2 assets nearing maintenance window."
        tone="warn"
        meta={[{ label: 'SPC warnings', value: warnings.length }, { label: 'In maintenance', value: maintenance.length }]}
      />
      <div className="flex flex-1 overflow-hidden">

      {/* Left: equipment list */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

        <div className="flex-1 overflow-y-auto">
          {equipment.map(eq => (
            <EquipmentCard key={eq.id} eq={eq}
              selected={selectedId === eq.id}
              onClick={() => setSelectedId(eq.id)} />
          ))}
        </div>

      </div>

      {/* Right: equipment detail + SPC + recipe + runs */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <EquipmentDetail eq={selectedEq} />
      </div>
      </div>
    </div>
  )
}
