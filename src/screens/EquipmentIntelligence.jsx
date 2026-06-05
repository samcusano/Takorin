import { useState } from 'react'
import { equipment, spcData, batchTrace, runHistory } from '../data/equipment'
import { AlertTriangle, CheckCircle2, Wrench, Activity, Clock, TrendingDown, CalendarClock, Zap, Target, ChevronDown, ChevronRight } from 'lucide-react'
import { SceneHeader, StatusPill, Btn, SlidePanel, AnimatedScore, EmptyState, StatGrid, HoldButton, Tabs } from '../components/UI'
import { useAppState } from '../context/AppState'
import RobotFleet from './RobotFleet'
import ResourceAllocation from './ResourceAllocation'

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
        <span className={`display-num text-sub tabular-nums ${textColor}`}>{eq.rul}{eq.rulUnit === 'hours' ? 'h' : eq.rulUnit}</span>
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
        <span className="font-body text-label text-muted">Now</span>
        <span className="font-body text-label text-danger">Failure risk zone → 12h</span>
        <span className="font-body text-label text-muted">Normal lifecycle → {maxH}h</span>
      </div>
      {eq.rulTrend === 'declining' && (
        <div className="font-body text-label text-warn mt-1">Trend: declining · was {eq.rul + 8}h at shift start → {eq.rul}h now</div>
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
            <div className={`display-num text-sub tabular-nums ${color}`}>{val}</div>
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
                    <div className={`display-num text-sub tabular-nums ${w.confidence >= 85 ? 'text-ok' : 'text-warn'}`}>{w.confidence}%</div>
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
  const currentColor = current > d.ucl || current < d.lcl ? 'var(--color-danger)' : current > d.ucl - range * 0.12 || current < d.lcl + range * 0.12 ? 'var(--color-warn)' : 'var(--color-ok)'

  const startDay = d.batchDay - d.points.length + 1

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2 flex items-center justify-between">
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
          <rect x={pad.left} y={uclY} width={cW} height={parseFloat(lclY) - parseFloat(uclY)} fill="rgb(var(--color-ok-rgb) / 0.04)" />
          {/* UCL */}
          <line x1={pad.left} y1={uclY} x2={W - pad.right} y2={uclY} stroke="var(--color-danger)" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* LCL */}
          <line x1={pad.left} y1={lclY} x2={W - pad.right} y2={lclY} stroke="var(--color-danger)" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* Target */}
          <line x1={pad.left} y1={tgtY} x2={W - pad.right} y2={tgtY} stroke="var(--color-ok)" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.6" />
          {/* Area fill */}
          <path d={areaPath} fill="rgb(var(--color-ink-2-rgb) / 0.06)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="var(--color-ink-2)" strokeWidth="0.9" strokeLinejoin="round" />
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
          <div className="font-body text-muted text-label">Day {startDay}</div>
        </div>
        <div className="font-body text-muted text-label">Day {d.batchDay} · today</div>
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
    if (v > ucl || v < lcl) return 'var(--color-danger)'
    if (v > ucl - range * 0.1 || v < lcl + range * 0.1) return 'var(--color-warn)'
    return 'var(--color-ok)'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2 flex items-center justify-between">
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
          <line x1={pad.left} y1={uclY} x2={W - pad.right} y2={uclY} stroke="var(--color-danger)" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* LCL */}
          <line x1={pad.left} y1={lclY} x2={W - pad.right} y2={lclY} stroke="var(--color-danger)" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* Target */}
          <line x1={pad.left} y1={tgtY} x2={W - pad.right} y2={tgtY} stroke="var(--color-ok)" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.6" />
          {/* Band */}
          <rect x={pad.left} y={uclY} width={cW} height={parseFloat(lclY) - parseFloat(uclY)} fill="rgb(var(--color-ok-rgb) / 0.04)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="var(--color-ink-2)" strokeWidth="0.8" />
          {/* Points */}
          {points.map((p, i) => (
            <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.2" fill={pointColor(p.value)} />
          ))}
        </svg>
      </div>
      {/* X axis labels */}
      <div className="flex-shrink-0 px-5 pb-2 flex justify-between">
        <span className="font-body text-muted text-label">Run 1</span>
        <span className="font-body text-muted text-label">Run {points.length}</span>
      </div>
    </div>
  )
}

// ─── Alert Calibration Panel ──────────────────────────────────────────────────
// Answers: is this equipment's predictive model well-calibrated or generating noise?
// McKinsey: "false-positive rates were high, extra service calls wiped out the savings entirely."

function CalibrationPanel({ cal }) {
  const [open, setOpen] = useState(false)
  if (!cal) return null

  const fpPct    = Math.round(cal.falsePositiveRate * 100)
  const tpPct    = 100 - fpPct
  const targetPct = Math.round(cal.targetFalsePositiveRate * 100)
  const overTarget = fpPct > targetPct
  const actionPct = Math.round(cal.alertToActionRate * 100)

  const fpColor  = fpPct <= targetPct ? 'text-ok' : fpPct <= 20 ? 'text-warn' : 'text-danger'
  const fpBg     = fpPct <= targetPct ? 'bg-ok'   : fpPct <= 20 ? 'bg-warn'   : 'bg-danger'

  return (
    <div className="border-t border-rule2">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-5 py-3 hover:bg-stone2 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Target size={11} strokeWidth={2} className={overTarget ? 'text-warn' : 'text-ok'} />
          <span className="font-body text-label font-medium text-muted">Signal calibration · {cal.window}</span>
        </div>
        <div className="flex items-center gap-3">
          {overTarget && (
            <span className={`font-body text-label font-semibold ${fpColor}`}>{fpPct}% false positive rate</span>
          )}
          {open ? <ChevronDown size={10} className="text-muted" /> : <ChevronRight size={10} className="text-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-rule2 bg-stone2">

          {/* Metric row */}
          <div className="grid grid-cols-4 gap-px bg-rule2">
            {[
              { label: 'Alerts generated', val: cal.alertsGenerated, color: 'text-ink' },
              { label: 'Confirmed real',   val: cal.truePositives,   color: 'text-ok'  },
              { label: 'False positives',  val: cal.falsePositives,  color: fpPct > targetPct ? fpColor : 'text-muted' },
              { label: 'Alert → action',   val: `${actionPct}%`,     color: actionPct >= 70 ? 'text-ok' : 'text-warn' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-stone2 px-4 py-3 text-center">
                <div className={`display-num text-sub font-bold tabular-nums leading-none ${color}`}>{val}</div>
                <div className="font-body text-label text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Calibration bar */}
          <div className="px-5 py-3 border-t border-rule2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-body text-label text-muted">Signal vs. noise</span>
              <span className="font-body text-label text-muted">Target: ≤{targetPct}% false positives</span>
            </div>
            <div className="h-2 bg-rule2 overflow-hidden flex">
              <div className="h-full bg-ok transition-[width]"     style={{ width: `${tpPct}%` }} />
              <div className={`h-full ${fpBg} transition-[width]`} style={{ width: `${fpPct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-ok flex-shrink-0" />
                <span className="font-body text-label text-muted">{tpPct}% real signal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${fpBg} flex-shrink-0`} />
                <span className={`font-body text-label ${fpColor}`}>{fpPct}% noise</span>
              </div>
            </div>
          </div>

          {/* Threshold */}
          <div className="px-5 py-3 border-t border-rule2">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className="font-body text-label text-muted">Threshold: </span>
                <span className="font-body text-label text-ink font-medium">{cal.threshold.value}</span>
                <span className="font-body text-label text-muted ml-1">{cal.threshold.condition}</span>
              </div>
              <div className="font-body text-label text-muted">
                Calibrated {cal.threshold.calibratedDate} · {cal.threshold.calibratedBy}
              </div>
            </div>
          </div>

          {/* False positive breakdown */}
          {cal.falsePositiveBreakdown?.length > 0 && (
            <div className="px-5 py-3 border-t border-rule2 space-y-1.5">
              <div className="font-body text-label text-muted mb-2">False positive causes</div>
              {cal.falsePositiveBreakdown.map((fp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-body text-label text-muted flex-shrink-0">{fp.count}×</span>
                  <div>
                    <span className="font-body text-label text-ink">{fp.cause}</span>
                    <span className="font-body text-label text-muted ml-2">— {fp.note}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestion */}
          {cal.suggestion && (
            <div className="mx-5 mb-4 mt-1 px-4 py-3 border-l-2 border-l-signal bg-signal/[0.04]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-body text-label font-semibold text-ink">Suggested threshold adjustment</span>
                <span className="font-body text-label font-bold text-signal tabular-nums">{cal.suggestion.confidence}%</span>
              </div>
              <p className="font-body text-label text-muted leading-snug mb-1.5">{cal.suggestion.text}</p>
              <p className="font-body text-label text-ok leading-snug">{cal.suggestion.impact}</p>
            </div>
          )}

          {/* Cost callout — only when false positives have a service cost */}
          {cal.falsePosServiceCost > 0 && (
            <div className="flex items-center gap-2 px-5 pb-4">
              <AlertTriangle size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body text-label text-warn">
                {cal.falsePositives} false positive{cal.falsePositives !== 1 ? 's' : ''} this period
                · ${cal.falsePosServiceCost.toLocaleString()} in unnecessary service calls
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function RecipeLabel({ recipeId }) {
  if (!recipeId) return null
  return (
    <div className="flex-shrink-0 border-t border-rule2 px-5 py-3">
      <span className="font-body text-label text-muted">Active recipe · </span>
      <span className="font-body text-label text-ink">{recipeId}</span>
      <span className="font-body text-label text-muted ml-2">· see Knowledge → Recipes for full specification</span>
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
      <div className="font-body text-label text-muted px-5 pt-4 pb-2">Run history</div>
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
                <div className="font-body text-warn text-label">{r.spcViolations} SPC violation{r.spcViolations > 1 ? 's' : ''}</div>
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
  const [windowsOpen, setWindowsOpen] = useState(false)

  if (!eq) return <EmptyState message="Select equipment" sub="Choose from the list to view details" />

  const cfg    = STATUS_CFG[eq.status] ?? STATUS_CFG.idle
  const spcCfg = eq.spcStatus ? SPC_CFG[eq.spcStatus] : null
  const existingTicket = maintenanceTickets.find(t => t.equipment?.includes(eq.name) && t.status === 'open')

  // Equipment needs action when: alert exists, RUL is low, or SPC is out of bounds
  const needsAction = !!eq.alertMsg || (eq.rul != null && eq.rul < 24) || eq.spcStatus === 'out-of-control' || eq.spcStatus === 'warning'

  // Consequence icon + bg — adapts to severity
  const isCritical = (eq.rul != null && eq.rul < 12) || eq.spcStatus === 'out-of-control'
  const conseqTone = isCritical ? { cls: 'text-danger', bg: 'bg-danger/[0.03]', border: 'border-danger/20', Icon: AlertTriangle }
                                : { cls: 'text-warn',   bg: 'bg-warn/[0.03]',   border: 'border-warn/20',   Icon: AlertTriangle }

  const handleRequestPM = () => {
    const urgency = eq.healthScore < 75 || spcCfg?.label === 'Out of control' ? 'danger' : 'warn'
    setMaintenanceTickets(p => [...p, {
      id: `MT-${Date.now()}`,
      equipment: `${eq.name} · ${eq.zone}`,
      issue: `PM window requested · Health ${eq.healthScore ?? '—'} · Next scheduled ${eq.nextPM}`,
      urgency, status: 'open',
      requestedBy: 'D. Kowalski',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }])
    setPmRequested(true)
  }

  const recommendedWindow = eq.maintenanceWindows?.find(w => w.recommended)
  const otherWindows = eq.maintenanceWindows?.filter(w => !w.recommended) ?? []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone">
        <div className="flex items-center gap-2 mb-2">
          <StatusPill tone={eq.status === 'active' ? 'ok' : eq.status === 'maintenance' ? 'warn' : eq.status === 'offline' ? 'danger' : 'muted'}>
            {cfg.label}
          </StatusPill>
          {spcCfg && (
            <StatusPill tone={eq.spcStatus === 'in-control' ? 'ok' : eq.spcStatus === 'warning' ? 'warn' : 'danger'}>
              SPC {spcCfg.label}
            </StatusPill>
          )}
        </div>
        <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{eq.name}</div>
        <div className="font-body text-muted text-body">{eq.type} · {eq.zone}</div>
      </div>

      {/* ── Metrics strip ──────────────────────────────────────── */}
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

      {/* ── RUL strip ──────────────────────────────────────────── */}
      {eq.rul != null && <RULStrip eq={eq} />}

      {/* ── Scrollable body ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Action section — when issue exists ────────────── */}
        {needsAction && (
          <div className="border-b border-rule2">

            {/* Alert strip */}
            {eq.alertMsg && (
              <div className="flex items-start gap-2.5 px-5 py-3 border-b border-warn/20 bg-warn/[0.04]">
                <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
                <p className="font-body text-warn text-body leading-snug">{eq.alertMsg}</p>
              </div>
            )}

            <div className="px-5 py-5 space-y-3">

              {/* What triggered this — uses rationaleText if available, falls back to alertMsg */}
              {(eq.rationaleText || eq.alertMsg) && (
                <div className="border border-rule2 bg-stone2 px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                    <span className="font-body font-semibold text-ink text-body">What triggered this</span>
                  </div>
                  <p className="font-body text-muted text-label leading-relaxed">
                    {eq.rationaleText ?? eq.alertMsg}
                  </p>
                </div>
              )}

              {/* Consequence — production impact or SPC consequence */}
              {eq.productionImpact ? (
                <div className={`border ${conseqTone.border} ${conseqTone.bg} px-4 py-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <conseqTone.Icon size={12} strokeWidth={2} className={`${conseqTone.cls} flex-shrink-0`} />
                    <span className="font-body font-semibold text-ink text-body">Consequence if unresolved</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div>
                      <div className="font-body text-label text-muted">Units at risk</div>
                      <div className={`font-body font-medium text-body ${conseqTone.cls}`}>
                        {eq.productionImpact.unitsAtRisk.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-body text-label text-muted">Downtime est.</div>
                      <div className="font-body font-medium text-body text-danger">
                        {eq.productionImpact.downtimeMins / 60}h
                      </div>
                    </div>
                    <div>
                      <div className="font-body text-label text-muted">Loss est.</div>
                      <div className="font-body font-medium text-body text-danger">
                        ${(eq.productionImpact.lossEstimate / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>
                </div>
              ) : eq.spcStatus && eq.spcStatus !== 'in-control' ? (
                <div className={`border ${conseqTone.border} ${conseqTone.bg} px-4 py-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <conseqTone.Icon size={12} strokeWidth={2} className={`${conseqTone.cls} flex-shrink-0`} />
                    <span className="font-body font-semibold text-ink text-body">Process control risk</span>
                  </div>
                  <p className="font-body text-muted text-label leading-relaxed">
                    {eq.spcStatus === 'warning'
                      ? 'SPC warning — process trending toward control limit. Grade impact possible if not corrected before the active batch completes.'
                      : 'SPC out of control — process has exceeded control limits. Batch quality at risk. Immediate intervention required.'}
                  </p>
                </div>
              ) : null}

              {/* Recommended maintenance window */}
              {recommendedWindow && (
                <div className="border border-ok/25 bg-ok/[0.03] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <CalendarClock size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
                        <span className="font-body font-medium text-ink text-body">{recommendedWindow.label}</span>
                        <StatusPill tone="ok">Recommended</StatusPill>
                      </div>
                      <div className="font-body text-label text-muted">{recommendedWindow.impact}</div>
                      <div className="font-body text-label text-muted">{recommendedWindow.note}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`display-num text-sub tabular-nums ${recommendedWindow.confidence >= 85 ? 'text-ok' : 'text-warn'}`}>
                        {recommendedWindow.confidence}%
                      </div>
                      <div className="font-body text-label text-muted">conf.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other windows — expandable */}
              {otherWindows.length > 0 && (
                <div>
                  <button type="button" onClick={() => setWindowsOpen(o => !o)}
                    className="flex items-center gap-1.5 font-body text-label text-muted hover:text-ink transition-colors">
                    <Activity size={9} strokeWidth={2} />
                    {windowsOpen ? 'Hide' : 'Show'} {otherWindows.length} other window{otherWindows.length > 1 ? 's' : ''}
                  </button>
                  {windowsOpen && otherWindows.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border border-rule2 mt-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-body leading-snug">{w.label}</div>
                        <div className="font-body text-muted text-label">{w.impact}</div>
                        <div className="font-body text-muted text-label">{w.note}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`display-num text-sub tabular-nums ${w.confidence >= 85 ? 'text-ok' : 'text-warn'}`}>{w.confidence}%</div>
                        <div className="font-body text-muted text-label">conf.</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Process evidence: chart ────────────────────────── */}
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
              {eq.status === 'maintenance' ? 'Equipment in maintenance — SPC suspended' : 'No active run'}
            </span>
          </div>
        )}

        <RecipeLabel recipeId={eq.activeRecipe} />
        <RunHistory eqId={eq.id} />
        <CalibrationPanel cal={eq.calibration} />

      </div>

      {/* ── Request PM — sticky footer ─────────────────────────── */}
      {eq.status !== 'maintenance' && (
        <div className="flex-shrink-0 px-5 py-3.5 border-t border-rule2 bg-stone2">
          {existingTicket ? (
            <div className="flex items-center gap-2 font-body text-label text-warn">
              <Wrench size={12} strokeWidth={2} className="flex-shrink-0" />
              PM ticket open · {existingTicket.id}
            </div>
          ) : pmRequested ? (
            <div className="flex items-center gap-2 font-body text-label text-ok">
              <CheckCircle2 size={12} strokeWidth={2} className="flex-shrink-0" />
              PM ticket created — handoff will carry this forward
            </div>
          ) : (
            <HoldButton
              label="Hold to request PM"
              holdLabel="Keep holding to confirm PM request…"
              doneLabel="PM ticket created"
              duration={1500}
              tone={eq.healthScore != null && eq.healthScore < 75 ? 'warn' : 'ok'}
              onConfirm={handleRequestPM}
            />
          )}
        </div>
      )}
    </div>
  )
}

const EQUIP_TABS = [
  { id: 'equipment',   label: 'Equipment'   },
  { id: 'fleet',       label: 'Fleet'       },
  { id: 'allocation',  label: 'Allocation'  },
]

export default function EquipmentIntelligence() {
  const [selectedId, setSelectedId] = useState(null)
  const [equipTab, setEquipTab] = useState('equipment')
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
      <Tabs tabs={EQUIP_TABS} active={equipTab} onChange={setEquipTab} />

      {equipTab === 'fleet'      && <div className="flex-1 overflow-hidden"><RobotFleet /></div>}
      {equipTab === 'allocation' && <div className="flex-1 overflow-hidden"><ResourceAllocation /></div>}
      {equipTab === 'equipment'  && (
        <>
        {/* ── Concentration band — precision farming: show which assets need immediate action ── */}
        {warnings.length > 0 && (
          <div className="flex-shrink-0 bg-warn/[0.04] border-b border-warn/20 px-5 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
                <span className="font-body font-medium text-warn text-label">
                  {warnings.length} asset{warnings.length !== 1 ? 's' : ''} flagged — maintenance decision needed
                </span>
              </div>
              {warnings.slice(0, 3).map((eq, i) => (
                <button key={i} type="button"
                  onClick={() => setSelectedId(eq.id)}
                  className="flex items-center gap-2 px-3 py-1 border border-warn/30 font-body text-label text-warn hover:bg-warn/[0.06] transition-colors">
                  <span className="font-medium">{eq.id}</span>
                  <span className="text-muted opacity-70">{eq.activeParam || 'Alert'}</span>
                </button>
              ))}
              {warnings.length > 3 && (
                <span className="font-body text-label text-muted">+ {warnings.length - 3} more</span>
              )}
            </div>
          </div>
        )}
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
          {/* Right: equipment detail */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone">
            <EquipmentDetail eq={selectedEq} />
          </div>
        </div>
        </>
      )}
    </div>
  )
}
