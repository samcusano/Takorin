import { useState } from 'react'
import { equipment, recipes, spcData, batchTrace, runHistory } from '../data/equipment'
import { AlertTriangle, CheckCircle2, Wrench, Activity, Clock, TrendingDown, CalendarClock, Zap } from 'lucide-react'
import { SceneHeader, SectionHeader, StatusPill, Btn, SlidePanel, AnimatedScore, Tabs, EmptyState, StatGrid, MasterDetail } from '../components/UI'
import { useAppState } from '../context/AppState'

// ─── Remaining Useful Life strip ──────────────────────────────────────────────

function RULStrip({ eq }) {
  if (!eq.rul) return null
  const maxH  = 48
  const pct   = Math.min(100, (eq.rul / maxH) * 100)
  const safe  = pct > 60
  const warn  = pct > 25 && pct <= 60
  const crit  = pct <= 25
  const barColor = crit ? 'var(--color-danger)' : warn ? 'var(--color-warn)' : 'var(--color-ok)'
  const textColor = crit ? 'text-danger' : warn ? 'text-warn' : 'text-ok'
  return (
    <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-stone2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingDown size={10} strokeWidth={2} className={textColor} aria-hidden="true" />
          <span className="font-body text-label font-medium text-muted">Remaining useful life</span>
        </div>
        <span className={`display-num text-base tabular-nums ${textColor}`}>{eq.rul}{eq.rulUnit === 'hours' ? 'h' : eq.rulUnit}</span>
      </div>
      <div className="relative h-2 bg-rule2 overflow-hidden">
        {/* Failure risk zone */}
        <div className="absolute right-0 top-0 h-full bg-danger/20" style={{ width: '25%' }} />
        {/* Warn zone */}
        <div className="absolute top-0 h-full bg-warn/10" style={{ left: '25%', width: '35%' }} />
        {/* Current fill */}
        <div className="absolute left-0 top-0 h-full transition-[width] duration-700" style={{ width: `${pct}%`, background: barColor }} />
        {/* Now marker */}
        <div className="absolute top-0 h-full w-0.5 bg-ink/50" style={{ left: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="font-body text-micro text-muted">Now</span>
        <span className="font-body text-micro text-danger">Failure risk zone → 12h</span>
        <span className="font-body text-micro text-muted">Normal lifecycle → {maxH}h</span>
      </div>
      {eq.rulTrend === 'declining' && (
        <div className="font-body text-micro text-warn mt-1">Trend: declining · was {eq.rul + 8}h at shift start → {eq.rul}h now</div>
      )}
    </div>
  )
}

// ─── Production Impact card ───────────────────────────────────────────────────

function ProductionImpactCard({ eq }) {
  const impact = eq.productionImpact
  if (!impact) return null
  return (
    <div className="flex-shrink-0 mx-5 my-3 border border-warn/30 bg-warn/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-warn/20">
        <AlertTriangle size={10} strokeWidth={2} className="text-warn flex-shrink-0" aria-hidden="true" />
        <span className="font-body font-medium text-warn text-label">If R-03 fails mid-shift</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-warn/10 divide-x divide-warn/10">
        {[
          { label: 'Units at risk', val: impact.unitsAtRisk.toLocaleString(), color: 'text-warn' },
          { label: 'Downtime',      val: `${impact.downtimeMins / 60}h`,       color: 'text-danger' },
          { label: 'Est. loss',     val: `$${(impact.lossEstimate / 1000).toFixed(1)}K`, color: 'text-danger' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-stone px-3 py-2.5 text-center">
            <div className="font-body text-muted text-label mb-0.5">{label}</div>
            <div className={`display-num text-base tabular-nums ${color}`}>{val}</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 font-body text-muted text-label">
        Line 4 PM shift starts 14:00 — resolution before handoff prevents downstream scheduling impact.
      </div>
    </div>
  )
}

// ─── Maintenance Window Optimizer ─────────────────────────────────────────────

function MaintenanceWindowOptimizer({ eq, onSchedule }) {
  const [open, setOpen] = useState(false)
  const [scheduled, setScheduled] = useState(null)
  const windows = eq.maintenanceWindows ?? []
  if (windows.length === 0) return null

  const handleSchedule = (w) => {
    setScheduled(w)
    setOpen(false)
    onSchedule?.(w)
  }

  return (
    <>
      {scheduled ? (
        <div className="flex items-center gap-2 font-body text-ok text-label flex-shrink-0 px-2">
          <CheckCircle2 size={10} strokeWidth={2} />
          Scheduled: {scheduled.label}
        </div>
      ) : (
        <Btn variant="secondary" icon={CalendarClock} onClick={() => setOpen(true)}>
          Find best window
        </Btn>
      )}
      {open && (
        <SlidePanel
          title="Maintenance Window Optimizer"
          subtitle={`R-03 Seal Press A · ${eq.rul}h remaining · 3 candidate windows`}
          accentColor="var(--color-warn)"
          onClose={() => setOpen(false)}
          footer={<Btn variant="secondary" onClick={() => setOpen(false)}>Close</Btn>}
        >
          <div className="space-y-3">
            {windows.map((w, i) => (
              <div key={i} className={`border ${w.recommended ? 'border-ok/40 bg-ok/[0.03]' : 'border-rule2'}`}>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body font-medium text-ink text-body">{w.label}</span>
                      {w.recommended && <StatusPill tone="ok">Recommended</StatusPill>}
                    </div>
                    <div className="font-body text-muted text-label">{w.impact}</div>
                    <div className="font-body text-muted text-label mt-0.5">{w.note}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`display-num text-base tabular-nums ${w.confidence >= 85 ? 'text-ok' : 'text-warn'}`}>{w.confidence}%</div>
                    <div className="font-body text-muted text-label">conf.</div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <Btn variant={w.recommended ? 'primary' : 'secondary'} onClick={() => handleSchedule(w)}>
                    Schedule this window
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </SlidePanel>
      )}
    </>
  )
}

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
  const tone = score >= 90 ? 'bg-ok' : score >= 75 ? 'bg-signal' : 'bg-warn'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-rule2">
        <div className={`h-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-body text-label tabular-nums w-6 text-right ${score >= 90 ? 'text-ok' : score >= 75 ? 'text-signal' : 'text-warn'}`}>
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
          <div className="font-body font-medium text-ink text-body leading-snug">{eq.name}</div>
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

function BatchTempChart({ eqId }) {
  const d = batchTrace[eqId]
  if (!d) return null

  const W = 100, H = 100
  const pad = { top: 10, right: 8, bottom: 18, left: 8 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom

  const range = d.ucl - d.lcl
  const yPad = range * 0.15
  const minY = d.lcl - yPad
  const maxY = d.ucl + yPad
  const yRange = maxY - minY

  const toX = (i) => pad.left + (i / (d.points.length - 1)) * cW
  const toY = (v) => pad.top + (1 - (v - minY) / yRange) * cH

  const linePath = d.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${toX(d.points.length - 1).toFixed(1)} ${pad.top + cH} L ${pad.left} ${pad.top + cH} Z`

  const uclY  = toY(d.ucl).toFixed(1)
  const lclY  = toY(d.lcl).toFixed(1)
  const tgtY  = toY(d.target).toFixed(1)

  const current = d.points[d.points.length - 1]
  const prev    = d.points[d.points.length - 2]
  const trend   = current - prev
  const currentColor = current > d.ucl || current < d.lcl ? '#E55' : current > d.ucl - range * 0.12 || current < d.lcl + range * 0.12 ? '#D4913A' : '#3A9E6F'

  const startDay = d.batchDay - d.points.length + 1

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-body text-muted text-label">Batch temperature · last 30 days</span>
          <span className="font-body text-muted text-label">Day {startDay}–{d.batchDay}</span>
        </div>
        <div className="flex items-center gap-4 text-label font-body">
          <span className="flex items-center gap-1 text-danger"><span className="w-3 border-t border-dashed border-danger" />UCL {d.ucl}{d.unit}</span>
          <span className="flex items-center gap-1 text-ok"><span className="w-3 border-t border-dotted border-ok" />Target {d.target}{d.unit}</span>
          <span className="flex items-center gap-1 text-danger"><span className="w-3 border-t border-dashed border-danger" />LCL {d.lcl}{d.unit}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-3 min-h-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Control band fill */}
          <rect x={pad.left} y={uclY} width={cW} height={parseFloat(lclY) - parseFloat(uclY)} fill="rgba(58,158,111,0.04)" />
          {/* UCL */}
          <line x1={pad.left} y1={uclY} x2={W - pad.right} y2={uclY} stroke="#E55" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* LCL */}
          <line x1={pad.left} y1={lclY} x2={W - pad.right} y2={lclY} stroke="#E55" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* Target */}
          <line x1={pad.left} y1={tgtY} x2={W - pad.right} y2={tgtY} stroke="#3A9E6F" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.6" />
          {/* Area fill */}
          <path d={areaPath} fill="rgba(123,110,100,0.06)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="#7B6E64" strokeWidth="0.9" strokeLinejoin="round" />
          {/* Current point */}
          <circle cx={toX(d.points.length - 1)} cy={toY(current)} r="1.5" fill={currentColor} />
        </svg>
      </div>

      <div className="flex-shrink-0 px-5 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-body text-muted text-label">Now  </span>
            <span className="display-num text-label font-bold" style={{ color: currentColor }}>{current.toFixed(1)}{d.unit}</span>
            <span className="font-body text-muted text-label ml-1">{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)} vs yesterday</span>
          </div>
          <div className="font-body text-muted text-micro">Day {startDay}</div>
        </div>
        <div className="font-body text-muted text-micro">Day {d.batchDay} · today</div>
      </div>

      {d.note && (
        <div className="flex-shrink-0 px-5 py-2 border-t border-rule2 bg-stone2">
          <span className="font-body text-muted text-label">{d.note}</span>
        </div>
      )}
    </div>
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
    'in-progress': { cls: 'bg-signal/10 text-signal', label: 'In progress' },
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
              <StatusPill tone={r.outcome === 'in-progress' ? 'signal' : r.outcome === 'pending-qp' ? 'warn' : r.outcome === 'released' ? 'ok' : 'danger'}>{oc.label}</StatusPill>
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
  const { maintenanceTickets, setMaintenanceTickets, logActivity } = useAppState()
  const [pmRequested, setPmRequested] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')

  const hasImpact = eq?.rul != null && eq.rul < 24 && eq?.productionImpact

  if (!eq) return <EmptyState message="Select equipment" sub="Choose from the list to view details" />
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
            <div className="flex items-center gap-2 flex-shrink-0">
              {existingTicket ? (
                <span className="font-body text-label text-warn flex items-center gap-1 flex-shrink-0">
                  <Wrench size={10} strokeWidth={2} />PM requested
                </span>
              ) : pmRequested ? (
                <span className="font-body text-label text-ok flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 size={10} strokeWidth={2} />PM ticket created
                </span>
              ) : (
                <Btn variant="secondary" icon={Wrench} onClick={handleRequestPM}>Request PM</Btn>
              )}
            </div>
          )}
        </div>
        <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{eq.name}</div>
        <div className="font-body text-muted text-body">{eq.type} · {eq.zone}</div>
      </div>

      {/* Metrics */}
      <StatGrid cols={4}>
        {[
          { label: 'Health', val: eq.status === 'active' ? `${eq.healthScore}` : '—', raw: eq.status === 'active' ? eq.healthScore : null, tone: eq.healthScore >= 90 ? 'text-ok' : eq.healthScore >= 75 ? 'text-signal' : 'text-warn' },
          { label: 'Total runs', val: String(eq.totalRuns), tone: 'text-ink' },
          { label: 'Last PM', val: eq.lastPM, tone: 'text-muted' },
          { label: 'Next PM', val: eq.nextPM, tone: eq.status === 'maintenance' ? 'text-warn' : 'text-muted' },
        ].map(({ label, val, raw, tone }) => (
          <StatGrid.Cell key={label} label={label} value={raw != null ? <AnimatedScore value={raw} effect="glow" /> : val} tone={tone} />
        ))}
      </StatGrid>

      {/* RUL strip — always visible when data exists */}
      {eq.rul != null && <RULStrip eq={eq} />}

      {/* Tab bar — only when there's production impact data worth separating */}
      {hasImpact && (
        <Tabs
          tabs={[{ id: 'overview', label: 'Overview' }, { id: 'impact', label: 'Impact' }]}
          active={detailTab} onChange={setDetailTab}
        />
      )}

      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        {(!hasImpact || detailTab === 'overview') && (
          <>
            {eq.status === 'active' && batchTrace[eq.id] ? (
              <div className="h-[260px] flex-shrink-0 border-b border-rule2">
                <BatchTempChart eqId={eq.id} />
              </div>
            ) : eq.status === 'active' && spcData[eq.id] ? (
              <div className="h-[220px] flex-shrink-0 overflow-hidden border-b border-rule2">
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
          </>
        )}

        {hasImpact && detailTab === 'impact' && (
          <div className="p-4 space-y-4">
            <ProductionImpactCard eq={eq} />
            {eq.maintenanceWindows?.length > 0 && (
              <MaintenanceWindowOptimizer eq={eq} onSchedule={(w) => {
                logActivity?.({ actor: 'D. Kowalski', action: `Scheduled maintenance: ${w.label}`, item: eq.name, type: 'intervention' })
              }} />
            )}
            {eq.before && (
              <div className="flex items-start gap-2 px-4 py-3 border border-rule2 bg-context/[0.04]">
                <span className="font-body text-label font-medium flex-shrink-0 text-context">Before ·</span>
                <p className="font-body text-label text-muted leading-relaxed m-0">{eq.before}</p>
              </div>
            )}
          </div>
        )}
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

        <div className="flex-1 overflow-y-auto page-rise">
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
