import { useState } from 'react'
import { AlertTriangle, Cpu, Gamepad2, Pause, Route, LifeBuoy } from 'lucide-react'
import { SlidePanel } from '../components/UI'
import { robotFleetData } from '../data'

// ─── Extended data ────────────────────────────────────────────────────────────
// Supplemental per-unit data for the diagnostic pane.
// Base operational state comes from robotFleetData; this adds
// signals, decision trace, resolution stack, and dependency graph.

const EXTENDED = {
  'R-01': {
    autonomyMode: 'full', autonomyConfidence: 94, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',     val: '18.3',  unit: '/min', delta: '+0.2',  tone: 'ok' },
      { label: 'Weight acc.',    val: '±0.2',  unit: 'g',    delta: null,    tone: 'ok' },
      { label: 'Allergen iso.',  val: 'Clear', unit: '',     delta: null,    tone: 'ok' },
      { label: 'Sensor conf.',   val: '0.97',  unit: '',     delta: null,    tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:12', text: 'Resumed topping run after allergen flush clearance confirmed by R-09.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'R-09 Allergen Bot', status: 'ok',   note: 'Zone 1 & 2 cleared — allergen isolation confirmed' },
      { label: 'Line 4 throughput', status: 'ok',   note: 'Running at 98% — no constraint' },
    ],
  },
  'R-02': {
    autonomyMode: 'full', autonomyConfidence: 97, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',   val: '19.1', unit: '/min', delta: null,   tone: 'ok' },
      { label: 'Weight acc.',  val: '±0.3', unit: 'g',    delta: null,   tone: 'ok' },
      { label: 'Sensor conf.', val: '0.99', unit: '',     delta: null,   tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: 'Shift start nominal — all calibration checks passed. 2,104 cycles without weight drift.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'Line 4 throughput', status: 'ok', note: 'No constraint' },
    ],
  },
  'R-03': {
    autonomyMode: 'assisted', autonomyConfidence: 71, interventionStatus: 'monitoring',
    signals: [
      { label: 'Vibration',    val: '3.4',  unit: 'mm/s', delta: '+0.3',  tone: 'warn' },
      { label: 'Temperature',  val: '62',   unit: '°C',   delta: '+2',    tone: 'warn' },
      { label: 'Cycle rate',   val: '14.1', unit: '/min', delta: '-1.2',  tone: 'warn' },
      { label: 'Sensor conf.', val: '0.71', unit: '',     delta: '-0.04', tone: 'warn' },
    ],
    decisionTrace: [
      { time: '06:05', text: 'Vibration anomaly flagged — pattern matches R-08 bearing failure 72h prior.' },
      { time: '06:30', text: 'Continued sealing run — threshold not reached. Monitoring with reduced confidence.' },
      { time: '13:45', text: 'Confidence dropped to 71% due to sustained vibration trend. Agent switched to Assisted mode.' },
    ],
    resolutionStack: {
      primary:     { label: 'Schedule bearing inspection', detail: 'Tonight 22:00–23:30 maintenance window is available' },
      alternative: { label: 'Reduce sealing cycle speed 10%', detail: 'Slows progression — extends safe operating window ~28h' },
      risk: 'Bearing failure likely within 14 hours if no action taken',
    },
    dependencies: [
      { label: 'R-07 Packaging A', status: 'ok',   note: 'Downstream — will be affected if R-03 goes offline' },
      { label: 'Line 4 throughput', status: 'ok',   note: 'Seal press not the bottleneck currently' },
    ],
  },
  'R-04': {
    autonomyMode: 'manual', autonomyConfidence: 0, interventionStatus: 'active',
    signals: [],
    decisionTrace: [
      { time: '09:00', text: 'Entered scheduled maintenance window — powered down safely. PM started by J. Barker.' },
    ],
    resolutionStack: {
      primary:     { label: 'Wait for PM completion', detail: 'J. Barker on site — ETA 14:30' },
      alternative: null,
      risk: null,
    },
    dependencies: [
      { label: 'J. Barker (tech)',    status: 'ok',   note: 'On site — PM in progress' },
      { label: 'Line 6 sealing',      status: 'warn', note: 'No fallback seal press — Line 6 capacity reduced' },
    ],
  },
  'R-05': {
    autonomyMode: 'full', autonomyConfidence: 99, interventionStatus: 'none',
    signals: [
      { label: 'Inspect rate',  val: '312',  unit: '/hr', delta: null,  tone: 'ok' },
      { label: 'Pass rate',     val: '99.8', unit: '%',   delta: null,  tone: 'ok' },
      { label: 'Camera conf.',  val: '0.99', unit: '',    delta: null,  tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: '18,204 cycles without calibration drift — highest confidence unit in fleet.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'R-03 Seal Press A', status: 'ok', note: 'Upstream — seal quality within spec' },
    ],
  },
  'R-06': {
    autonomyMode: 'full', autonomyConfidence: 91, interventionStatus: 'none',
    signals: [
      { label: 'Dose acc.',    val: '±0.4', unit: 'g',   delta: null,  tone: 'ok' },
      { label: 'Flow rate',    val: '28.1', unit: 'g/s', delta: null,  tone: 'ok' },
      { label: 'Sensor conf.', val: '0.92', unit: '',    delta: null,  tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: 'Allocated as sauce dosing fallback for Line 4 if primary supply disrupted.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'Line 3 supply', status: 'ok', note: 'Tomato sauce lot L-0887 — no hold' },
    ],
  },
  'R-07': {
    autonomyMode: 'full', autonomyConfidence: 88, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',    val: '22.4', unit: '/min', delta: null,  tone: 'ok' },
      { label: 'Web tension',   val: '4.8',  unit: 'N',    delta: null,  tone: 'ok' },
      { label: 'Date code',     val: 'OK',   unit: '',     delta: null,  tone: 'ok' },
      { label: 'Sensor conf.',  val: '0.91', unit: '',     delta: null,  tone: 'ok' },
    ],
    decisionTrace: [
      { time: '11:20', text: 'Program update applied remotely — v5.0.1 → v5.0.2. All checks passed, resumed automatically.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'R-03 Seal Press A', status: 'ok', note: 'Upstream — sealing at capacity' },
      { label: 'R-11 Palletizer A', status: 'ok', note: 'Downstream — no constraint' },
    ],
  },
  'R-08': {
    autonomyMode: 'manual', autonomyConfidence: 0, interventionStatus: 'active',
    signals: [],
    decisionTrace: [
      { time: '13:42', text: 'Drive fault F-22 — motor overload detected. Emergency stop triggered autonomously.' },
      { time: '13:45', text: 'Technician T. Osei notified. Line 6 packaging rerouted to manual staging to prevent throughput collapse.' },
    ],
    resolutionStack: {
      primary:     { label: 'T. Osei diagnosis + repair', detail: 'ETA 14:30 — motor overload assessment in progress' },
      alternative: { label: 'Route Line 6 to R-07 overflow', detail: 'R-07 has ~40% spare capacity — covers partial Line 6 volume' },
      risk: 'If motor replacement needed: 4h minimum downtime — Line 6 at 0% until resolved',
    },
    dependencies: [
      { label: 'T. Osei (tech)',    status: 'warn', note: 'ETA 14:30 — in transit' },
      { label: 'Line 6 throughput', status: 'warn', note: 'Reduced to 0% — manual staging active' },
      { label: 'R-07 Packaging A',  status: 'ok',   note: 'Available for overflow if capacity confirmed' },
    ],
  },
  'R-09': {
    autonomyMode: 'full', autonomyConfidence: 96, interventionStatus: 'none',
    signals: [
      { label: 'Coverage rate', val: '100',  unit: '%',   delta: null, tone: 'ok' },
      { label: 'Zone status',   val: 'Clear', unit: '',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.',  val: '0.96', unit: '',    delta: null, tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:48', text: 'Auto-assigned to allergen flush cover — Lindqvist absent, no human backup available for this task.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'R-01 Topping A', status: 'ok', note: 'Downstream — zone must be clear before R-01 resumes' },
    ],
  },
  'R-10': {
    autonomyMode: 'full', autonomyConfidence: 93, interventionStatus: 'none',
    signals: [
      { label: 'Case rate',    val: '18.0', unit: '/min', delta: null, tone: 'ok' },
      { label: 'Glue temp',   val: '162',  unit: '°C',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.94', unit: '',     delta: null, tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: 'Shift start nominal — 6,441 cycles without case formation error.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'Line 2 throughput', status: 'ok', note: 'No constraint' },
    ],
  },
  'R-11': {
    autonomyMode: 'full', autonomyConfidence: 89, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',   val: '6.2',  unit: '/min', delta: null, tone: 'ok' },
      { label: 'Load weight',  val: '38.1', unit: 'kg',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.91', unit: '',     delta: null, tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: 'Shift start nominal.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'R-07 Packaging A', status: 'ok', note: 'Upstream — supply consistent' },
    ],
  },
  'R-12': {
    autonomyMode: 'full', autonomyConfidence: 98, interventionStatus: 'none',
    signals: [
      { label: 'Speed',         val: '1.2',  unit: 'm/s', delta: null,  tone: 'ok' },
      { label: 'Path deviation', val: '+1',  unit: '%',   delta: null,  tone: 'ok' },
      { label: 'Load weight',   val: '41.2', unit: 'kg',  delta: null,  tone: 'ok' },
      { label: 'Battery',       val: '84',   unit: '%',   delta: '-2',  tone: 'ok' },
      { label: 'Sensor conf.',  val: '0.98', unit: '',    delta: null,  tone: 'ok' },
    ],
    decisionTrace: [
      { time: '06:00', text: 'Route optimized — 12,048 transport cycles without navigation error. Operating on shortest-path schedule.' },
    ],
    resolutionStack: null,
    dependencies: [
      { label: 'Cold Storage access', status: 'ok',   note: 'Route clear — no corridor obstruction' },
      { label: 'Line 4 docking bay',  status: 'ok',   note: 'Bay 2 reserved — no queue' },
    ],
  },
}

// ─── Health state ──────────────────────────────────────────────────────────────

function healthState(unit, ext) {
  if (unit.status === 'fault') return {
    key: 'critical', label: 'Intervention required',
    color: 'text-danger', bg: 'bg-danger/[0.05]', border: 'border-l-danger',
    dot: 'bg-danger', pulse: false,
  }
  if (unit.status === 'maintenance') return {
    key: 'pm', label: 'In PM',
    color: 'text-ghost', bg: 'bg-stone2', border: 'border-l-rule2',
    dot: 'bg-rule2', pulse: false,
  }
  const conf = ext?.autonomyConfidence ?? 100
  if (unit.alert?.type === 'warn' || conf < 85) return {
    key: 'degraded', label: 'Degraded',
    color: 'text-warn', bg: 'bg-warn/[0.05]', border: 'border-l-warn',
    dot: 'bg-warn', pulse: false,
  }
  return {
    key: 'stable', label: 'Stable',
    color: 'text-ok', bg: '', border: 'border-l-ok',
    dot: 'bg-ok', pulse: true,
  }
}

const AUTONOMY_LABEL = { full: 'Full Auto', assisted: 'Assisted', manual: 'Manual takeover' }
const AUTONOMY_COLOR = { full: 'text-muted', assisted: 'text-warn', manual: 'text-danger' }

const INTERVENTION_LABEL = {
  none:        'No action required',
  monitoring:  'Monitoring',
  recommended: 'Intervention recommended',
  active:      'Intervention active',
}
const INTERVENTION_COLOR = {
  none:        'text-ghost',
  monitoring:  'text-warn',
  recommended: 'text-warn',
  active:      'text-danger',
}

// ─── Card components ───────────────────────────────────────────────────────────

function ConfBar({ value }) {
  const clr = value >= 85 ? 'bg-ok' : value >= 65 ? 'bg-warn' : 'bg-danger'
  const txt = value >= 85 ? 'text-ok' : value >= 65 ? 'text-warn' : 'text-danger'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="h-[3px] flex-1 bg-stone3 overflow-hidden">
        <div className={`h-full ${clr} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className={`font-display font-bold display-num text-[10px] w-7 text-right flex-shrink-0 tabular-nums ${txt}`}>
        {value}%
      </span>
    </div>
  )
}

function UnitCard({ unit, selected, onSelect }) {
  const ext = EXTENDED[unit.id]
  const hs = healthState(unit, ext)
  const conf = ext?.autonomyConfidence ?? 100
  const mode = ext?.autonomyMode ?? 'full'
  const exception = unit.alert?.msg ?? null

  return (
    <button
      type="button"
      onClick={() => onSelect(unit.id)}
      className={`w-full text-left border border-rule2 border-l-4 ${hs.border} ${hs.bg} p-4 transition-all ${
        selected
          ? 'ring-1 ring-ink/20 shadow-sm'
          : 'hover:bg-stone2'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="font-display font-bold text-ink text-[13px] leading-none mb-0.5">{unit.id}</div>
          <div className="font-body text-muted text-[11px] leading-snug truncate">{unit.name}</div>
        </div>
        <span className="relative flex h-2 w-2 flex-shrink-0 mt-0.5">
          {hs.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hs.dot} opacity-40`} />}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${hs.dot}`} />
        </span>
      </div>

      {/* Task */}
      <div className="font-body text-[10px] text-ghost mb-3 leading-snug line-clamp-2 min-h-[28px]">
        {unit.assignedTask ?? (unit.status === 'maintenance' ? 'PM in progress' : 'Offline — fault')}
      </div>

      {/* State core */}
      <div className="mb-2">
        <div className={`font-body font-medium text-[10px] uppercase tracking-widest ${hs.color}`}>
          {hs.label}
        </div>
        {unit.status !== 'maintenance' && unit.status !== 'fault' && (
          <ConfBar value={conf} />
        )}
      </div>

      {/* Autonomy mode */}
      <div className={`font-body text-[10px] ${AUTONOMY_COLOR[mode]} mb-2`}>
        {AUTONOMY_LABEL[mode]}
      </div>

      {/* Exception signals — only if relevant */}
      {exception && (
        <div className={`flex items-start gap-1.5 font-body text-[10px] leading-snug ${unit.alert.type === 'danger' ? 'text-danger' : 'text-warn'}`}>
          <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <span className="line-clamp-2">{exception}</span>
        </div>
      )}
    </button>
  )
}

// ─── Diagnostic pane ───────────────────────────────────────────────────────────

function SignalRow({ label, val, unit, delta, tone }) {
  const valColor = tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink'
  const dColor = delta ? (delta.startsWith('+') ? (tone === 'ok' ? 'text-muted' : 'text-warn') : 'text-ok') : 'text-ghost'
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-rule2 last:border-0">
      <span className="font-body text-ghost text-[10px] w-28 flex-shrink-0">{label}</span>
      <div className="flex items-baseline gap-1.5 flex-1 justify-end">
        <span className={`font-display font-bold display-num text-[13px] tabular-nums ${valColor}`}>{val}</span>
        {unit && <span className="font-body text-ghost text-[9px]">{unit}</span>}
        <span className={`font-body text-[9px] w-10 text-right flex-shrink-0 tabular-nums ${dColor}`}>
          {delta ?? '—'}
        </span>
      </div>
    </div>
  )
}

function TraceRow({ time, text }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-rule2 last:border-0">
      <span className="font-body text-ghost text-[9px] flex-shrink-0 w-9 pt-px">{time}</span>
      <span className="font-body text-ink text-[11px] leading-snug">{text}</span>
    </div>
  )
}

function DiagPaneContents({ unit, ext, hs }) {
  const mode = ext?.autonomyMode ?? 'full'
  const interventionStatus = ext?.interventionStatus ?? 'none'
  const rs = ext?.resolutionStack

  return (
    <>
      {/* §1 — Unit Summary */}
      <div className={`-mx-5 -mt-5 px-5 py-4 border-b border-rule2 mb-4 ${hs.bg}`}>
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Current task</div>
        <div className="font-body text-ink text-[12px] leading-snug mb-3">
          {unit.assignedTask ?? (unit.status === 'maintenance' ? 'PM in progress — unit offline' : 'Offline — fault active')}
        </div>
        <div className="flex items-center gap-5">
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">State</div>
            <div className={`font-body font-medium text-[11px] ${hs.color}`}>{hs.label}</div>
          </div>
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Autonomy</div>
            <div className={`font-body text-[11px] ${AUTONOMY_COLOR[mode]}`}>{AUTONOMY_LABEL[mode]}</div>
          </div>
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Intervention</div>
            <div className={`font-body font-medium text-[11px] ${INTERVENTION_COLOR[interventionStatus]}`}>
              {INTERVENTION_LABEL[interventionStatus]}
            </div>
          </div>
        </div>
      </div>

      {/* §2 — Live Telemetry */}
      {ext?.signals?.length > 0 && (
        <div className="-mx-5 px-5 py-4 border-b border-rule2 mb-4">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Live signals</div>
          {ext.signals.map((s, i) => (
            <SignalRow key={i} {...s} />
          ))}
        </div>
      )}

      {/* §3 — AI Decision Trace */}
      {ext?.decisionTrace?.length > 0 && (
        <div className="-mx-5 px-5 py-4 border-b border-rule2 mb-4">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Decision trace</div>
          {ext.decisionTrace.map((d, i) => (
            <TraceRow key={i} {...d} />
          ))}
        </div>
      )}

      {/* §4 — Fix / Intervention */}
      <div className="-mx-5 px-5 py-4 border-b border-rule2 mb-4">
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Action</div>
        {!rs ? (
          <div className="font-body text-muted text-[11px]">No action required — monitor only</div>
        ) : (
          <>
            <div className="border border-rule2 bg-stone2 px-3 py-2.5 mb-2">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Suggested fix</div>
              <div className="font-body text-ink text-[11px] font-medium">{rs.primary.label}</div>
              <div className="font-body text-muted text-[10px] mt-0.5">{rs.primary.detail}</div>
            </div>
            {rs.alternative && (
              <div className="border border-rule2 bg-stone2 px-3 py-2.5 mb-2">
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Alternative</div>
                <div className="font-body text-ink text-[11px]">{rs.alternative.label}</div>
                <div className="font-body text-muted text-[10px] mt-0.5">{rs.alternative.detail}</div>
              </div>
            )}
            {rs.risk && (
              <div className="flex items-start gap-1.5 font-body text-danger text-[10px] mb-3">
                <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{rs.risk}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* §5 — Dependency Awareness */}
      {ext?.dependencies?.length > 0 && (
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Dependencies</div>
          {ext.dependencies.map((d, i) => {
            const dot = d.status === 'ok' ? 'bg-ok' : d.status === 'warn' ? 'bg-warn' : 'bg-danger'
            const txt = d.status === 'ok' ? 'text-muted' : d.status === 'warn' ? 'text-warn' : 'text-danger'
            return (
              <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-rule2 last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                <div className="min-w-0">
                  <div className={`font-body text-[11px] font-medium ${txt}`}>{d.label}</div>
                  <div className="font-body text-ghost text-[10px] leading-snug">{d.note}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Fleet stat strip ──────────────────────────────────────────────────────────

function StatStrip({ summary, filter, setFilter }) {
  const items = [
    { k: 'all',         l: 'All units',   v: summary.total,       tone: 'text-ink'    },
    { k: 'online',      l: 'Online',      v: summary.online,      tone: 'text-ok'     },
    { k: 'maintenance', l: 'In PM',       v: summary.maintenance, tone: summary.maintenance > 0 ? 'text-warn'   : 'text-muted' },
    { k: 'fault',       l: 'Fault',       v: summary.fault,       tone: summary.fault > 0       ? 'text-danger' : 'text-muted' },
  ]
  return (
    <div className="flex border-b border-rule2 flex-shrink-0">
      {items.map(s => (
        <button
          key={s.k}
          type="button"
          onClick={() => setFilter(s.k)}
          className={`flex-1 px-4 py-3 border-r border-rule2 last:border-r-0 text-left transition-colors ${
            filter === s.k ? 'bg-stone2' : 'bg-stone hover:bg-stone2'
          }`}
        >
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{s.l}</div>
          <div className={`font-display font-extrabold display-num text-xl leading-none tabular-nums ${s.tone}`}>{s.v}</div>
        </button>
      ))}
      <div className="flex items-center px-4 border-l border-rule2 bg-stone flex-shrink-0">
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Avg uptime</div>
          <div className="font-display font-extrabold display-num text-xl text-ink leading-none">{summary.avgUptime}%</div>
        </div>
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function RobotFleet() {
  const { units, summary, faultLog } = robotFleetData
  const [filter, setFilter]   = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = filter === 'all' ? units : units.filter(u => u.status === filter)
  const selectedUnit = selectedId ? units.find(u => u.id === selectedId) : null
  const selectedExt  = selectedId ? EXTENDED[selectedId] : null
  const selectedHs   = selectedUnit ? healthState(selectedUnit, selectedExt) : null

  const handleSelect = (id) => {
    setSelectedId(prev => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Fleet header */}
      <div className="flex-shrink-0 border-b border-rule2 px-6 py-4 bg-stone flex items-center justify-between">
        <div>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-0.5">Robot Fleet · Salina Campus</div>
          <div className="font-display font-extrabold display-num text-3xl text-ink leading-none">
            {summary.online}
            <span className="font-body font-normal text-muted text-base ml-2">of {summary.total} online</span>
          </div>
        </div>
        <div className="font-body text-ghost text-[10px]">{summary.energyToday} kWh today</div>
      </div>

      {/* Stat strip / filter */}
      <StatStrip summary={summary} filter={filter} setFilter={setFilter} />

      {/* Command Grid — always full width */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-stone p-4">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
        >
          {filtered.map(unit => (
            <UnitCard
              key={unit.id}
              unit={unit}
              selected={unit.id === selectedId}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Fault log — below grid */}
        {faultLog.length > 0 && (
          <div className="mt-6 border border-rule2 bg-stone">
            <div className="px-4 py-2 border-b border-rule2 bg-stone2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Shift event log</span>
            </div>
            {faultLog.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${f.severity === 'danger' ? 'bg-danger' : f.severity === 'warn' ? 'bg-warn' : 'bg-rule2'}`} />
                <span className="font-body text-ghost text-[10px] w-10 flex-shrink-0">{f.timestamp}</span>
                <span className="font-body text-muted text-[10px] w-9 flex-shrink-0">{f.unit}</span>
                <span className="font-body text-ink text-[11px] flex-1">{f.fault}</span>
                <span className={`font-body text-[10px] flex-shrink-0 ${f.resolved ? 'text-ok' : f.techAssigned ? 'text-warn' : 'text-ghost'}`}>
                  {f.resolved ? 'Resolved' : f.techAssigned ? f.techAssigned : 'Monitoring'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnostic drawer — SlidePanel overlay, same pattern as View Specs / View COA */}
      {selectedUnit && selectedExt && (() => {
        const interventionStatus = selectedExt?.interventionStatus ?? 'none'
        const rs = selectedExt?.resolutionStack
        const isActive = interventionStatus === 'active'
        const isMonitoring = interventionStatus === 'monitoring' || interventionStatus === 'recommended'
        const footer = (
          <div className="flex items-center gap-2 flex-wrap">
            {isActive && (
              <button type="button" className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 bg-danger text-stone hover:bg-danger/90 transition-colors">
                <Gamepad2 size={13} strokeWidth={2} />
                Take control
              </button>
            )}
            {isMonitoring && (
              <>
                <button type="button" className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 border border-warn text-warn hover:bg-warn/[0.06] transition-colors">
                  <Gamepad2 size={13} strokeWidth={2} />
                  Take control
                </button>
                <button type="button" className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
                  <Pause size={13} strokeWidth={2} />
                  Pause task
                </button>
              </>
            )}
            {selectedUnit.status === 'online' && (
              <button type="button" className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
                <Route size={13} strokeWidth={2} />
                Reroute robot
              </button>
            )}
            {rs && (
              <button type="button" className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
                <LifeBuoy size={13} strokeWidth={2} />
                Deploy recovery
              </button>
            )}
          </div>
        )
        return (
          <SlidePanel
            title={`${selectedUnit.id} — ${selectedUnit.name}`}
            subtitle={`${selectedUnit.line} · ${selectedUnit.model}`}
            icon={Cpu}
            onClose={() => setSelectedId(null)}
            maxWidth="440px"
            footer={footer}
          >
            <DiagPaneContents
              unit={selectedUnit}
              ext={selectedExt}
              hs={selectedHs}
            />
          </SlidePanel>
        )
      })()}

    </div>
  )
}
