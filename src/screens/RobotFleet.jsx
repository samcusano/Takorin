import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Cpu, Gamepad2, Pause, Route, LifeBuoy, ChevronDown, ChevronRight } from 'lucide-react'
import { SlidePanel, Btn, DitherMeter } from '../components/UI'
import { robotFleetData } from '../data'

// ─── Extended per-unit data ────────────────────────────────────────────────────

const EXTENDED = {
  'R-01': {
    autonomyMode: 'full', autonomyConfidence: 94, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',    val: '18.3', unit: '/min', delta: '+0.2', tone: 'ok' },
      { label: 'Weight acc.',   val: '±0.2', unit: 'g',   delta: null,   tone: 'ok' },
      { label: 'Allergen iso.', val: 'Clear',unit: '',    delta: null,   tone: 'ok' },
      { label: 'Sensor conf.',  val: '0.97', unit: '',    delta: null,   tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:12', text: 'Resumed topping run after allergen flush clearance confirmed by R-09.' }],
    resolutionStack: null,
    dependencies: [
      { label: 'R-09 Allergen Bot',  status: 'ok', note: 'Zone 1 & 2 cleared — allergen isolation confirmed' },
      { label: 'Line 4 throughput',  status: 'ok', note: 'Running at 98% — no constraint' },
    ],
  },
  'R-02': {
    autonomyMode: 'full', autonomyConfidence: 97, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',   val: '19.1', unit: '/min', delta: null, tone: 'ok' },
      { label: 'Weight acc.',  val: '±0.3', unit: 'g',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.99', unit: '',    delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: 'Shift start nominal — all calibration checks passed. 2,104 cycles without weight drift.' }],
    resolutionStack: null,
    dependencies: [{ label: 'Line 4 throughput', status: 'ok', note: 'No constraint' }],
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
      { label: 'R-07 Packaging A',  status: 'ok', note: 'Downstream — will be affected if R-03 goes offline' },
      { label: 'Line 4 throughput', status: 'ok', note: 'Seal press not the bottleneck currently' },
    ],
  },
  'R-04': {
    autonomyMode: 'manual', autonomyConfidence: 0, interventionStatus: 'active',
    signals: [],
    decisionTrace: [{ time: '09:00', text: 'Entered scheduled maintenance window — powered down safely. PM started by J. Barker.' }],
    resolutionStack: {
      primary:     { label: 'Wait for PM completion', detail: 'J. Barker on site — ETA 14:30' },
      alternative: null,
      risk: null,
    },
    dependencies: [
      { label: 'J. Barker (tech)',  status: 'ok',   note: 'On site — PM in progress' },
      { label: 'Line 6 sealing',   status: 'warn',  note: 'No fallback seal press — Line 6 capacity reduced' },
    ],
  },
  'R-05': {
    autonomyMode: 'full', autonomyConfidence: 99, interventionStatus: 'none',
    signals: [
      { label: 'Inspect rate',  val: '312',  unit: '/hr', delta: null, tone: 'ok' },
      { label: 'Pass rate',     val: '99.8', unit: '%',   delta: null, tone: 'ok' },
      { label: 'Camera conf.',  val: '0.99', unit: '',    delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: '18,204 cycles without calibration drift — highest confidence unit in fleet.' }],
    resolutionStack: null,
    dependencies: [{ label: 'R-03 Seal Press A', status: 'ok', note: 'Upstream — seal quality within spec' }],
  },
  'R-06': {
    autonomyMode: 'full', autonomyConfidence: 91, interventionStatus: 'none',
    signals: [
      { label: 'Dose acc.',    val: '±0.4', unit: 'g',   delta: null, tone: 'ok' },
      { label: 'Flow rate',    val: '28.1', unit: 'g/s', delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.92', unit: '',    delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: 'Allocated as sauce dosing fallback for Line 4 if primary supply disrupted.' }],
    resolutionStack: null,
    dependencies: [{ label: 'Line 3 supply', status: 'ok', note: 'Tomato sauce lot L-0887 — no hold' }],
  },
  'R-07': {
    autonomyMode: 'full', autonomyConfidence: 88, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',   val: '22.4', unit: '/min', delta: null, tone: 'ok' },
      { label: 'Web tension',  val: '4.8',  unit: 'N',    delta: null, tone: 'ok' },
      { label: 'Date code',    val: 'OK',   unit: '',     delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.91', unit: '',     delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '11:20', text: 'Program update applied remotely — v5.0.1 → v5.0.2. All checks passed, resumed automatically.' }],
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
      { label: 'Coverage rate', val: '100',   unit: '%', delta: null, tone: 'ok' },
      { label: 'Zone status',   val: 'Clear', unit: '',  delta: null, tone: 'ok' },
      { label: 'Sensor conf.',  val: '0.96',  unit: '',  delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:48', text: 'Auto-assigned to allergen flush cover — Lindqvist absent, no human backup available for this task.' }],
    resolutionStack: null,
    dependencies: [{ label: 'R-01 Topping A', status: 'ok', note: 'Downstream — zone must be clear before R-01 resumes' }],
  },
  'R-10': {
    autonomyMode: 'full', autonomyConfidence: 93, interventionStatus: 'none',
    signals: [
      { label: 'Case rate',    val: '18.0', unit: '/min', delta: null, tone: 'ok' },
      { label: 'Glue temp',   val: '162',  unit: '°C',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.94', unit: '',     delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: 'Shift start nominal — 6,441 cycles without case formation error.' }],
    resolutionStack: null,
    dependencies: [{ label: 'Line 2 throughput', status: 'ok', note: 'No constraint' }],
  },
  'R-11': {
    autonomyMode: 'full', autonomyConfidence: 89, interventionStatus: 'none',
    signals: [
      { label: 'Cycle rate',   val: '6.2',  unit: '/min', delta: null, tone: 'ok' },
      { label: 'Load weight',  val: '38.1', unit: 'kg',   delta: null, tone: 'ok' },
      { label: 'Sensor conf.', val: '0.91', unit: '',     delta: null, tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: 'Shift start nominal.' }],
    resolutionStack: null,
    dependencies: [{ label: 'R-07 Packaging A', status: 'ok', note: 'Upstream — supply consistent' }],
  },
  'R-12': {
    autonomyMode: 'full', autonomyConfidence: 98, interventionStatus: 'none',
    signals: [
      { label: 'Speed',          val: '1.2',  unit: 'm/s', delta: null,  tone: 'ok' },
      { label: 'Path deviation', val: '+1',   unit: '%',   delta: null,  tone: 'ok' },
      { label: 'Load weight',    val: '41.2', unit: 'kg',  delta: null,  tone: 'ok' },
      { label: 'Battery',        val: '84',   unit: '%',   delta: '-2',  tone: 'ok' },
      { label: 'Sensor conf.',   val: '0.98', unit: '',    delta: null,  tone: 'ok' },
    ],
    decisionTrace: [{ time: '06:00', text: 'Route optimized — 12,048 transport cycles without navigation error. Operating on shortest-path schedule.' }],
    resolutionStack: null,
    dependencies: [
      { label: 'Cold Storage access', status: 'ok', note: 'Route clear — no corridor obstruction' },
      { label: 'Line 4 docking bay',  status: 'ok', note: 'Bay 2 reserved — no queue' },
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function healthState(unit, ext) {
  if (unit.status === 'fault')       return { key: 'fault',    label: 'Intervention required', color: 'text-danger', bg: 'bg-danger/[0.05]', dot: 'bg-danger', pulse: false }
  if (unit.status === 'maintenance') return { key: 'pm',       label: 'In PM',                 color: 'text-muted',  bg: 'bg-stone2',        dot: 'bg-rule2',  pulse: false }
  const conf = ext?.autonomyConfidence ?? 100
  if (unit.alert?.type === 'warn' || conf < 85) return { key: 'degraded', label: 'Degraded', color: 'text-warn', bg: 'bg-warn/[0.05]', dot: 'bg-warn', pulse: false }
  return { key: 'stable', label: 'Stable', color: 'text-ok', bg: '', dot: 'bg-ok', pulse: true }
}

const AUTONOMY_LABEL = { full: 'Full Auto', assisted: 'Assisted', manual: 'Manual takeover' }
const AUTONOMY_COLOR = { full: 'text-muted', assisted: 'text-warn', manual: 'text-danger' }

const INTERVENTION_LABEL = { none: 'No action required', monitoring: 'Monitoring', recommended: 'Intervention recommended', active: 'Intervention active' }
const INTERVENTION_COLOR = { none: 'text-muted', monitoring: 'text-warn', recommended: 'text-warn', active: 'text-danger' }

function ConfBar({ value }) {
  const clrVar = value >= 85 ? 'var(--color-ok)' : value >= 65 ? 'var(--color-warn)' : 'var(--color-danger)'
  const txt = value >= 85 ? 'text-ok' : value >= 65 ? 'text-warn' : 'text-danger'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="h-[3px] flex-1 bg-stone3 overflow-hidden">
        <DitherMeter value={value} color={clrVar} />
      </div>
      <span className={`display-num text-label w-7 text-right flex-shrink-0 tabular-nums ${txt}`}>{value}%</span>
    </div>
  )
}

// ─── Diagnostic pane (SlidePanel body) ────────────────────────────────────────

function SignalRow({ label, val, unit, delta, tone }) {
  const valColor = tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink'
  const dColor = delta ? (delta.startsWith('+') ? (tone === 'ok' ? 'text-muted' : 'text-warn') : 'text-ok') : 'text-muted'
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-rule2 last:border-0">
      <span className="font-body text-muted text-label w-28 flex-shrink-0">{label}</span>
      <div className="flex items-baseline gap-1.5 flex-1 justify-end">
        <span className={`display-num text-sub tabular-nums ${valColor}`}>{val}</span>
        {unit && <span className="font-body text-muted text-label">{unit}</span>}
        <span className={`font-body text-label w-10 text-right flex-shrink-0 tabular-nums ${dColor}`}>{delta ?? '—'}</span>
      </div>
    </div>
  )
}

function TraceRow({ time, text, isFirst, isLast }) {
  const dot = isFirst ? 'bg-danger' : 'bg-muted'
  const textColor = isFirst ? 'text-ink' : 'text-muted'
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-end flex-shrink-0" style={{ width: 36 }}>
        <span className="font-body text-muted text-label tabular-nums leading-none pt-0.5">{time}</span>
        <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
        {!isLast && <div className="flex-1 w-px bg-rule2 mt-1.5 mb-0" style={{ minHeight: 12 }} />}
      </div>
      <div className="flex-1 pb-3">
        <span className={`font-body text-label leading-snug ${textColor}`}>{text}</span>
      </div>
    </div>
  )
}

function Collapsible({ label, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="-mx-5 border-b border-rule2">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-stone3 transition-colors">
        <span className="font-body text-muted text-label">{label}</span>
        {open
          ? <ChevronDown size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
          : <ChevronRight size={11} strokeWidth={2} className="text-muted flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

function DiagPaneContents({ unit, ext, hs }) {
  const mode               = ext?.autonomyMode ?? 'full'
  const interventionStatus = ext?.interventionStatus ?? 'none'
  const rs                 = ext?.resolutionStack
  const isFault            = hs.key === 'fault'
  const isDegraded         = hs.key === 'degraded'
  const hasFaultAlerts     = unit.alert || isFault || isDegraded

  return (
    <>
      {/* Status strip — compact, one row */}
      <div className={`-mx-5 -mt-5 px-5 py-3 border-b border-rule2 mb-0 flex items-center gap-5 ${hs.bg}`}>
        <div>
          <div className="font-body text-muted text-label">State</div>
          <div className={`font-body font-medium text-label ${hs.color}`}>{hs.label}</div>
        </div>
        <div>
          <div className="font-body text-muted text-label">Autonomy</div>
          <div className={`font-body text-label ${AUTONOMY_COLOR[mode]}`}>{AUTONOMY_LABEL[mode]}</div>
        </div>
        <div>
          <div className="font-body text-muted text-label">Task</div>
          <div className="font-body text-label text-ink">
            {unit.assignedTask ?? (unit.status === 'maintenance' ? 'PM in progress' : 'Offline')}
          </div>
        </div>
      </div>

      {/* ── Fault alert + primary actions — visible immediately ─────────────── */}
      {hasFaultAlerts && (
        <div className={`-mx-5 px-5 py-4 border-b border-rule2 ${isFault ? 'bg-danger/[0.035]' : isDegraded ? 'bg-warn/[0.02]' : ''}`}>
          {unit.alert && (
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle size={13} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${isFault ? 'text-danger' : 'text-warn'}`} />
              <p className={`font-body text-body leading-snug m-0 ${isFault ? 'text-danger' : 'text-warn'}`}>{unit.alert.msg}</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {isFault    && <Btn variant="primary"   icon={Gamepad2}>Take control</Btn>}
            {isFault    && <Btn variant="secondary" icon={LifeBuoy}>Deploy recovery</Btn>}
            {isDegraded && <Btn variant="secondary" icon={LifeBuoy}>Deploy recovery</Btn>}
            {isDegraded && <Btn variant="ghost"     icon={Pause}>Pause task</Btn>}
            {unit.status === 'online' && <Btn variant="ghost" icon={Route}>Reroute</Btn>}
          </div>
        </div>
      )}

      {/* ── Resolution path — visible, not buried ──────────────────────────── */}
      {rs && (
        <div className="-mx-5 px-5 py-4 border-b border-rule2">
          <div className="font-body text-muted text-label mb-3">Resolution path</div>
          <div className="bg-stone2 border border-rule px-3 py-2.5 mb-2">
            <div className="font-body font-medium text-ink text-label">{rs.primary.label}</div>
            <div className="font-body text-muted text-label mt-0.5">{rs.primary.detail}</div>
          </div>
          {rs.alternative && (
            <div className="border border-rule2 px-3 py-2.5 mb-2">
              <div className="font-body text-muted text-label mb-0.5">Alternative</div>
              <div className="font-body text-ink text-label">{rs.alternative.label}</div>
              <div className="font-body text-muted text-label mt-0.5">{rs.alternative.detail}</div>
            </div>
          )}
          {rs.risk && (
            <div className="flex items-start gap-1.5 font-body text-danger text-label">
              <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{rs.risk}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Supporting sections — collapsible ──────────────────────────────── */}
      {ext?.signals?.length > 0 && (
        <Collapsible label={`Live signals · ${ext.signals.length}`}>
          {ext.signals.map((s, i) => <SignalRow key={i} {...s} />)}
        </Collapsible>
      )}

      {ext?.decisionTrace?.length > 0 && (
        <Collapsible label={`Decision trace · ${ext.decisionTrace.length} event${ext.decisionTrace.length !== 1 ? 's' : ''}`} defaultOpen={!hasFaultAlerts}>
          <div className="pt-1">
            {ext.decisionTrace.map((d, i) => (
              <TraceRow key={i} time={d.time} text={d.text}
                isFirst={i === 0} isLast={i === ext.decisionTrace.length - 1} />
            ))}
          </div>
        </Collapsible>
      )}

      {ext?.dependencies?.length > 0 && (
        <Collapsible label={`Dependencies · ${ext.dependencies.length}`}>
          {ext.dependencies.map((d, i) => {
            const dot = d.status === 'ok' ? 'bg-ok' : d.status === 'warn' ? 'bg-warn' : 'bg-danger'
            const txt = d.status === 'ok' ? 'text-muted' : d.status === 'warn' ? 'text-warn' : 'text-danger'
            return (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b border-rule2 last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                <div className="min-w-0">
                  <div className={`font-body text-label font-medium ${txt}`}>{d.label}</div>
                  <div className="font-body text-muted text-label leading-snug">{d.note}</div>
                </div>
              </div>
            )
          })}
        </Collapsible>
      )}

      {!hasFaultAlerts && !rs && (
        <div className="pt-4 font-body text-muted text-label">No action required — monitor only</div>
      )}
    </>
  )
}

// ─── Command card — "needs action" units ──────────────────────────────────────

function CommandCard({ unit, ext, hs, onDiagnose }) {
  const isFault    = hs.key === 'fault'
  const isDegraded = hs.key === 'degraded'
  const isPM       = hs.key === 'pm'
  const conf       = ext?.autonomyConfidence ?? 0
  const rs         = ext?.resolutionStack

  const topBar = isFault ? 'bg-danger' : isDegraded ? 'bg-warn' : 'bg-rule2'

  return (
    <div className={`border border-rule2 overflow-hidden mb-3`}>
      <div className={`h-[3px] w-full ${topBar}`} />
      <div className={`px-5 py-4 ${hs.bg}`}>

        {/* Line · Unit identity */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="font-body text-label text-muted mb-1">
              {unit.line} · {unit.model}
            </div>
            <div className="font-display font-bold text-ink text-body leading-none">
              {unit.id} — {unit.name}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-body font-medium text-label ${hs.color}`}>{hs.label}</div>
            {unit.status === 'online' && <ConfBar value={conf} />}
            {unit.status !== 'online' && (
              <div className="font-body text-label text-muted mt-0.5">
                {unit.maintenanceSchedule?.remainingHours === 0 ? 'Overdue' : `${unit.maintenanceSchedule?.remainingHours}h remaining`}
              </div>
            )}
          </div>
        </div>

        {/* Alert — "What triggered this" pattern */}
        {unit.alert && (
          <div className={`flex items-start gap-2.5 px-4 py-3 mb-3 border ${
            isFault ? 'bg-danger/[0.04] border-danger/20' : 'bg-warn/[0.04] border-warn/20'
          }`}>
            <AlertTriangle size={11} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${isFault ? 'text-danger' : 'text-warn'}`} />
            <p className={`font-body text-body leading-snug ${isFault ? 'text-danger' : 'text-warn'}`}>
              {unit.alert.msg}
            </p>
          </div>
        )}

        {/* Resolution — if available */}
        {rs?.primary && (
          <div className="mb-3">
            <div className="font-body text-muted text-label mb-2">
              {isPM ? 'Resolution in progress' : 'Suggested action'}
            </div>
            <div className="border border-rule2 bg-stone2/60 px-3 py-2.5">
              <div className="font-body font-medium text-ink text-label">{rs.primary.label}</div>
              <div className="font-body text-muted text-label mt-0.5">{rs.primary.detail}</div>
            </div>
            {rs.risk && !isPM && (
              <div className="flex items-start gap-1.5 mt-1.5 font-body text-danger text-label">
                <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>{rs.risk}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isPM && (
          <div className="flex items-center gap-2 flex-wrap">
            {isFault    && <Btn variant="primary"    icon={Gamepad2}>Take control</Btn>}
            {isDegraded && <Btn variant="secondary"  icon={LifeBuoy}>Deploy recovery</Btn>}
            {isDegraded && <Btn variant="ghost"      icon={Pause}>Pause task</Btn>}
            {isFault    && <Btn variant="secondary"  icon={LifeBuoy}>Deploy recovery</Btn>}
            {unit.status === 'online' && <Btn variant="ghost" icon={Route}>Reroute</Btn>}
            <button type="button" onClick={onDiagnose}
              className="ml-auto font-body text-label text-muted hover:text-ink transition-colors">
              Full diagnostics →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nominal table — grouped by line ─────────────────────────────────────────

function NominalTable({ units, open, onToggle, onSelect }) {
  // Group by line
  const byLine = {}
  units.forEach(u => {
    const line = u.line === 'All lines' ? 'Logistics' : u.line
    if (!byLine[line]) byLine[line] = []
    byLine[line].push(u)
  })
  const lineOrder = ['Line 4', 'Line 6', 'Line 3', 'Line 2', 'Logistics']
  const groups = Object.entries(byLine).sort(([a], [b]) => lineOrder.indexOf(a) - lineOrder.indexOf(b))

  return (
    <div>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-stone2 border border-rule2 hover:bg-stone3 transition-colors text-left">
        <CheckCircle2 size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
        <span className="font-body text-label text-muted flex-1">{units.length} units nominal</span>
        <ChevronDown size={11} strokeWidth={2} className={`text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border border-rule2 border-t-0 overflow-hidden">
          {groups.map(([line, lineUnits], gi) => (
            <div key={line} className={gi > 0 ? 'border-t border-rule2' : ''}>
              {/* Line section header */}
              <div className="px-4 py-1.5 bg-stone2/50 border-b border-rule2/60">
                <span className="font-body text-label text-muted">{line}</span>
              </div>
              {lineUnits.map(unit => {
                const ext  = EXTENDED[unit.id]
                const conf = ext?.autonomyConfidence ?? Math.min(99, Math.round(unit.uptime ?? 95))
                return (
                  <button key={unit.id} type="button" onClick={() => onSelect(unit.id)}
                    className="w-full flex items-center gap-4 px-4 py-2.5 border-b border-rule2 last:border-0 hover:bg-stone2/50 transition-colors text-left">
                    {/* Live dot */}
                    <div className="relative flex h-1.5 w-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ok" />
                    </div>
                    <span className="font-body font-medium text-muted text-label w-9 flex-shrink-0">{unit.id}</span>
                    <span className="font-body text-ink text-label flex-1 truncate">{unit.name}</span>
                    <span className="font-body text-muted text-label truncate max-w-[200px]">{unit.assignedTask}</span>
                    <div className="flex items-center gap-2 w-24 flex-shrink-0">
                      <div className="flex-1 h-[3px] bg-stone3 overflow-hidden">
                        <DitherMeter value={conf} colorClass={conf >= 85 ? 'bg-ok' : 'bg-warn'} />
                      </div>
                      <span className="font-body text-label text-ok tabular-nums w-7 text-right">{conf}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function RobotFleet({ hideStats = false }) {
  const { units, summary, faultLog } = robotFleetData
  const [selectedId, setSelectedId]   = useState(null)
  const [nominalOpen, setNominalOpen] = useState(true)

  // Split into "needs action" and "nominal"
  const needsAction = units
    .filter(u => u.status === 'fault' || u.status === 'maintenance' || u.alert)
    .sort((a, b) => {
      const order = { fault: 0, maintenance: 1, online: 2 }
      return (order[a.status] ?? 2) - (order[b.status] ?? 2)
    })

  const nominalUnits = units.filter(u =>
    u.status !== 'fault' && u.status !== 'maintenance' && !u.alert
  )

  const selectedUnit = selectedId ? units.find(u => u.id === selectedId) : null
  const selectedExt  = selectedId ? EXTENDED[selectedId] : null
  const selectedHs   = selectedUnit ? healthState(selectedUnit, selectedExt) : null

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {!hideStats && (
        <div className="flex-shrink-0 flex items-center gap-6 px-6 py-[9px] border-b border-rule2 bg-stone2">
          {[
            { label: `Online · ${summary.online}/${summary.total}`, tone: summary.online < summary.total ? 'warn' : 'ok' },
            { label: `In PM · ${summary.maintenance}`,              tone: summary.maintenance > 0 ? 'warn' : 'ok'        },
            { label: `Fault · ${summary.fault}`,                    tone: summary.fault > 0 ? 'danger' : 'ok'           },
            { label: `Avg uptime · ${summary.avgUptime}%`,          tone: summary.avgUptime < 90 ? 'warn' : 'ok'        },
          ].map((sig, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${
                sig.tone === 'danger' ? 'bg-danger' : sig.tone === 'warn' ? 'bg-warn' : 'bg-ok'
              }`} />
              <span className={`font-body text-label ${
                sig.tone === 'danger' ? 'text-danger' : sig.tone === 'warn' ? 'text-warn' : 'text-muted'
              }`}>{sig.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* ── Needs action ─────────────────────────────────── */}
        {needsAction.length > 0 && (
          <div className="mb-4">
            <div className="font-body text-label text-muted mb-3">
              Needs action · {needsAction.length}
            </div>
            {needsAction.map(unit => {
              const ext = EXTENDED[unit.id]
              const hs  = healthState(unit, ext)
              return (
                <CommandCard
                  key={unit.id}
                  unit={unit}
                  ext={ext}
                  hs={hs}
                  onDiagnose={() => setSelectedId(unit.id)}
                />
              )
            })}
          </div>
        )}

        {/* ── Nominal — collapsible, grouped by line ────────── */}
        <NominalTable
          units={nominalUnits}
          open={nominalOpen}
          onToggle={() => setNominalOpen(o => !o)}
          onSelect={setSelectedId}
        />

        {/* ── Fault log ─────────────────────────────────────── */}
        {faultLog.length > 0 && (
          <div className="mt-4">
            <div className="font-body text-label text-muted mb-2">Shift event log</div>
            <div className="border border-rule2 divide-y divide-rule2">
              {faultLog.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${f.severity === 'danger' ? 'bg-danger' : f.severity === 'warn' ? 'bg-warn' : 'bg-rule2'}`} />
                  <span className="font-body text-muted text-label w-10 flex-shrink-0">{f.timestamp}</span>
                  <span className="font-body text-muted text-label w-9 flex-shrink-0">{f.unit}</span>
                  <span className="font-body text-ink text-label flex-1">{f.fault}</span>
                  <span className={`font-body text-label flex-shrink-0 ${f.resolved ? 'text-ok' : f.techAssigned ? 'text-warn' : 'text-muted'}`}>
                    {f.resolved ? 'Resolved' : f.techAssigned ?? 'Monitoring'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Diagnostic SlidePanel ─────────────────────────── */}
      {selectedUnit && selectedExt && (
        <SlidePanel
          title={`${selectedUnit.id} — ${selectedUnit.name}`}
          subtitle={`${selectedUnit.line} · ${selectedUnit.model}`}
          icon={Cpu}
          accentColor={selectedHs.key === 'fault' ? 'var(--color-danger)' : selectedHs.key === 'degraded' ? 'var(--color-warn)' : 'var(--color-ok)'}
          onClose={() => setSelectedId(null)}
          maxWidth="520px"
        >
          <DiagPaneContents unit={selectedUnit} ext={selectedExt} hs={selectedHs} />
        </SlidePanel>
      )}
    </div>
  )
}
