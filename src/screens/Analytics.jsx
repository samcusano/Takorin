import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { openCases, benchmarks } from '../data/capa.js'
import { goalsData, facility, networkData } from '../data'
import { interventionSummary, interventions } from '../data/interventions'
import { ChevronDown, ChevronUp, Download, Lock, ArrowRight, Check, AlertTriangle } from 'lucide-react'
import { FilterDropdown, MultiFilterDropdown, StatusPill, AnimatedScore, StatGrid } from '../components/UI'

// ── Peer cohort options + top quartile practices ─────────────────────────────

const COHORT_OPTIONS = [
  { id: 'similar', label: 'Similar plants',   desc: '100 plants · 100–500 workers · baked goods · FDA-regulated' },
  { id: 'sector',  label: 'Sector peers',     desc: '340 plants · food & beverage manufacturing · all sizes'     },
  { id: 'all',     label: 'All manufacturers', desc: '2,400 facilities · cross-sector · FDA-regulated'           },
]

const TOP_QUARTILE = [
  { area: 'OEE',          practice: 'Run AI checks before every shift — not just when something goes wrong',          adoption: 82, lift: '+4.2pp avg OEE vs cohort median',   route: '/shift',      module: 'ShiftIQ'       },
  { area: 'CAPA',         practice: 'Package evidence automatically when a CAPA opens — don\'t wait until closure',   adoption: 74, lift: '38% faster closure vs cohort median',route: '/capa',       module: 'CAPA'   },
  { area: 'Downtime',     practice: 'Schedule maintenance from sensor data, not from the calendar',                   adoption: 68, lift: '23% fewer unplanned stops',          route: '/agents',     module: 'Agents' },
  { area: 'Traceability', practice: 'Check lot chain completeness as ingredients arrive — catch gaps at the door',    adoption: 61, lift: '2.1h faster recall response window', route: '/readiness',  module: 'Data Quality'},
]

// ── Workflow adoption ─────────────────────────────────────────────────────────
// Surfaces the rejection scenario: are supervisors and operators actually using
// the platform, and if not, who specifically and what is the consequence?

const ADOPTION_WORKFLOWS = [
  {
    id: 'handoff',
    label: 'Shift handoff',
    role: 'Supervisors',
    target: 90,
    rate: 67,
    trend: -3,
    warning: 'D. Kowalski · J. Torres — 0 of last 3 shifts completed. Incoming supervisors reconstructing context manually.',
    action: 'Review completion in ShiftIQ · brief conversation with both supervisors before next shift',
    route: '/shift',
    module: 'ShiftIQ',
  },
  {
    id: 'checklist',
    label: 'Operator checklists',
    role: 'Operators',
    target: 95,
    rate: 81,
    trend: +5,
    warning: null,
    action: null,
    route: '/operator',
    module: 'My Station',
  },
  {
    id: 'decisions',
    label: 'Agent decision review',
    role: 'Director',
    target: 80,
    rate: 92,
    trend: +2,
    warning: null,
    action: null,
    route: '/agents',
    module: 'Agents',
  },
  {
    id: 'evidence',
    label: 'CAPA evidence submission',
    role: 'Supervisors',
    target: 85,
    rate: 58,
    trend: -6,
    warning: 'CAPA-2604-006 · CAPA-2604-011 blocked — evidence not filed. Closure and FSMA traceability record at risk.',
    action: 'Follow up with supervisor today — both CAPAs cannot close without filed evidence',
    route: '/capa',
    module: 'CAPA',
  },
]

// ── Bullet chart for Q2 Goals ─────────────────────────────────────────────────
function BulletChart({ current, target, direction, unit }) {
  const max = unit === '%' ? 100 : Math.ceil(Math.max(current, target) * 1.8)
  const currentPct = Math.min(100, (current / max) * 100)
  const targetPct  = Math.min(100, (target  / max) * 100)
  const onTrack = direction === 'increase' ? current >= target * 0.85 : current <= target * 1.15
  return (
    <div className="mt-3 relative h-[4px] bg-rule2">
      <div
        className={`absolute inset-y-0 left-0 ${onTrack ? 'bg-ok' : 'bg-warn'}`}
        style={{ width: `${currentPct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[8px] bg-ink/30"
        style={{ left: `${targetPct}%` }}
      />
    </div>
  )
}

// ── Attribution data — keyed by plant → grain ─────────────────────────────────

const ATTR = {
  sl: {
    plant: 'Salina', code: 'SL-04', line: 'Line 4', target: 82,
    shift: {
      baseline: 75.0, actual: 81.0,
      narrative: 'recovered from its mid-week dip',
      drivers: [
        { id: 'staff',    label: 'Staffing correction',    short: 'Staffing',    delta: +2.1, note: 'Martinez → Sauce Dosing · cert gap closed',              action: 'Pre-assign via ShiftIQ staffing panel for next shift',          route: '/shift',     module: 'ShiftIQ'        },
        { id: 'allergen', label: 'Allergen changeover',    short: 'Allergen',    delta: +1.5, note: 'Changeover log signed · production unblocked',           action: 'Standardize Line 4 changeover procedure across all shifts',    route: '/shift',     module: 'ShiftIQ'        },
        { id: 'check',    label: 'Checklist completion',   short: 'Checklists',  delta: +1.4, note: '4 overdue startup items cleared at T+42',               action: 'Enable automated startup reminders in ShiftIQ',                route: '/shift',     module: 'ShiftIQ'        },
        { id: 'sensor',   label: 'Sensor A-7 flagged',    short: 'Sensor A-7',  delta: +0.8, note: 'Bearing inspection scheduled · variance caught early',   action: 'Complete sensor calibration before next shift',                route: '/readiness', module: 'Data Quality' },
        { id: 'scada',    label: 'SCADA gap',              short: 'SCADA gap',   delta: -0.3, note: 'Oven B sensor stale · model accuracy reduced',             action: 'Restore Oven B sensor feed to recover full model accuracy',   route: '/readiness', module: 'Data Quality' },
      ],
    },
    day: {
      baseline: 75.5, actual: 79.8,
      narrative: 'AM shift recovered; PM shift catching up — day closes below target',
      drivers: [
        { id: 'staff',    label: 'Staff coverage (both shifts)',   short: 'Staffing',    delta: +2.1, note: 'Martinez coverage held AM and PM · no cert gaps throughout', action: 'Carry pre-assignment forward into tomorrow',                   route: '/shift',     module: 'ShiftIQ'        },
        { id: 'check',    label: 'Checklist adherence rate',       short: 'Checklists',  delta: +1.6, note: 'AM: 9/11 cleared · PM: 8/11 cleared — improving shift-over-shift', action: 'Chase 3 recurring misses with PM supervisor tonight',      route: '/shift',     module: 'ShiftIQ'        },
        { id: 'allergen', label: 'Allergen restart delay (AM)',     short: 'Allergen',    delta: +1.2, note: 'AM resolved cleanly; PM changeover was cleaner than yesterday', action: 'Log AM resolution as procedure template for PM',              route: '/shift',     module: 'ShiftIQ'        },
        { id: 'scada',    label: 'SCADA gap (both shifts)',         short: 'SCADA gap',   delta: -0.6, note: 'Oven B sensor stale across full day — penalty compounding',  action: 'Escalate sensor restore to maintenance before tomorrow AM',   route: '/readiness', module: 'Data Quality' },
      ],
    },
    week: {
      baseline: 74.0, actual: 82.5,
      narrative: 'crossed the 82% target for the first time this quarter',
      drivers: [
        { id: 'cert',     label: 'Cert gap closures',              short: 'Cert gaps',   delta: +4.2, note: '5 operators certified this week · L2 Sauce Dosing now fully staffed', action: 'Accelerate remaining 4 cert backlog cases into Q3 assessment window', route: '/operator',  module: 'My Station'  },
        { id: 'allergen', label: 'Allergen program improvement',    short: 'Allergen',    delta: +2.8, note: 'Standardized checklist cut changeover time 22% week-over-week',     action: 'Extend standardized procedure to Lines 3 and 6 next week',         route: '/shift',     module: 'ShiftIQ'        },
        { id: 'check',    label: 'Checklist adherence up 18%',     short: 'Checklists',  delta: +2.1, note: 'Automated reminders reduced missed startup items from 6 to 1',      action: 'Confirm reminder cadence carries into next week schedule',          route: '/shift',     module: 'ShiftIQ'        },
        { id: 'scada',    label: 'SCADA gap (Oven B, ongoing)',     short: 'SCADA gap',   delta: -1.6, note: 'Sensor stale since Apr 9 · accuracy impact growing each week',      action: 'Restore Oven B — highest-leverage action going into week 3',       route: '/readiness', module: 'Data Quality' },
      ],
    },
  },
  ks: {
    plant: 'Wichita', code: 'KS-09', line: 'Line W1', target: 75,
    shift: {
      baseline: 68.0, actual: 71.0,
      narrative: 'partially recovered — allergen delay cost 1.2 points',
      drivers: [
        { id: 'crew',     label: 'Crew readiness',          short: 'Crew',      delta: +2.8, note: 'Full L2 coverage across all stations',               action: 'Maintain coverage levels — flag any cert gap immediately', route: '/operator',  module: 'My Station'  },
        { id: 'ccp',      label: 'CCP compliance held',     short: 'CCP hold',  delta: +1.4, note: 'All bake temps within window · no corrective logs',  action: 'Continue CCP-3 monitoring cadence each shift',            route: '/operator',  module: 'My Station'  },
        { id: 'allergen', label: 'Allergen changeover lag', short: 'Allergen',  delta: -1.2, note: 'GF-Flatbread transition 18 min over target',         action: 'Add L2 support or extend changeover window in schedule',  route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    day: {
      baseline: 67.5, actual: 71.8,
      narrative: 'both shifts short of target — allergen delays compounding across the day',
      drivers: [
        { id: 'crew',     label: 'Crew coverage maintained',     short: 'Crew',      delta: +2.8, note: 'Full L2 held through AM and PM · no gap incidents',               action: 'Schedule coverage review before tomorrow start',                    route: '/operator',  module: 'My Station'  },
        { id: 'ccp',      label: 'CCP compliance held',          short: 'CCP hold',  delta: +1.5, note: 'All readings within window across both shifts',                   action: 'Continue CCP-3 monitoring cadence',                                route: '/operator',  module: 'My Station'  },
        { id: 'allergen', label: 'Allergen lag (both shifts)',    short: 'Allergen',  delta: -2.0, note: 'Recurring GF-Flatbread delay hit AM and PM — pattern is clear',   action: 'Escalate changeover root cause — this is a recurring daily issue', route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    week: {
      baseline: 66.5, actual: 73.5,
      narrative: 'trending toward target — cert backlog is the remaining constraint',
      drivers: [
        { id: 'crew',     label: 'L2 crew coverage improvement',       short: 'Crew',      delta: +3.8, note: 'Coverage at 94% this week vs 81% prior week',                        action: 'Fill remaining 2 L2 cert gaps before next week',                route: '/operator',  module: 'My Station'  },
        { id: 'ccp',      label: 'CCP protocol compliance',            short: 'CCP',       delta: +2.4, note: 'Zero corrective logs this week · oven temps consistent all 7 days',  action: 'Carry forward CCP logging discipline into next week',           route: '/operator',  module: 'My Station'  },
        { id: 'supplier', label: 'Clean supplier inputs',              short: 'Supplier',  delta: +2.2, note: 'No ConAgra interruptions or lot holds this week',                    action: 'Monitor TS-9840 lot arriving Friday — flag if delayed',         route: '/supplier',   module: 'Suppliers'   },
        { id: 'allergen', label: 'Allergen changeover lag (recurring)',short: 'Allergen',  delta: -1.4, note: 'Consistent 15-18 min over target on 4 of 7 days',                   action: 'Adopt Salina standardized procedure — template available now',  route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
  },
  co: {
    plant: 'Denver', code: 'CO-07', line: 'Line D1', target: 86,
    shift: {
      baseline: 80.0, actual: 84.0,
      narrative: 'reached a shift high — clean supplier inputs and full L2+ crew',
      drivers: [
        { id: 'supplier', label: 'Clean supplier inputs',   short: 'Supplier',  delta: +2.7, note: 'No lot holds or trace gaps this shift',               action: 'Flag ConAgra contingency before next shared lot arrives',  route: '/supplier',   module: 'Suppliers'   },
        { id: 'crew',     label: 'Full L2+ crew coverage',  short: 'Crew',      delta: +1.8, note: 'Nakamura team at full cert level across shift',       action: 'Document coverage pattern — share as Salina benchmark',   route: '/operator',  module: 'My Station'  },
        { id: 'variance', label: 'Oven D1 temp variance',   short: 'Oven D1',   delta: -0.5, note: 'Slight undershoot at shift start · self-corrected',  action: 'Log in maintenance calendar for preventive inspection',    route: '/readiness', module: 'Data Quality' },
      ],
    },
    day: {
      baseline: 80.5, actual: 83.2,
      narrative: 'held above 83% through both shifts — D2 startup slower than D1',
      drivers: [
        { id: 'crew',     label: 'Nakamura team · full coverage',  short: 'Crew',       delta: +1.8, note: 'Full L2+ coverage held AM and PM · no substitutions needed',     action: 'Document crew model as replication template for Salina',    route: '/operator',  module: 'My Station'  },
        { id: 'supplier', label: 'Clean supplier inputs',           short: 'Supplier',   delta: +1.4, note: 'No ConAgra lot holds — second clean day this week',               action: 'Flag incoming TS-9840 lot for trace verification on arrival', route: '/supplier',   module: 'Suppliers'   },
        { id: 'variance', label: 'Line D2 startup delay',           short: 'D2 delay',   delta: -0.5, note: 'D2 came up 9 min late · compressed PM production window',        action: 'Add D2 startup checklist to PM shift briefing',             route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    week: {
      baseline: 80.0, actual: 86.5,
      narrative: 'exceeded the 86% target — highest-performing plant in the network this week',
      drivers: [
        { id: 'crew',     label: 'Crew consistency — Nakamura team',  short: 'Crew',      delta: +3.2, note: 'Full L2+ coverage 6 of 7 days · zero cert substitutions all week', action: 'Export crew model as network benchmark — Salina to adopt',  route: '/operator',  module: 'My Station'  },
        { id: 'supplier', label: 'ConAgra lots — zero interruptions', short: 'Supplier',  delta: +2.5, note: 'No holds, no trace gaps, no delivery delays this week',            action: 'Monitor next lot arrival — maintain contingency flag',       route: '/supplier',   module: 'Suppliers'   },
        { id: 'variance', label: 'Oven D1 variance resolved',         short: 'Oven D1',   delta: +0.8, note: 'Mid-week calibration eliminated the recurring temp undershoot',   action: 'Schedule preventive calibration every 2 weeks going forward', route: '/readiness', module: 'Data Quality' },
      ],
    },
  },
}

const STRIP_BASE = [
  { id: 'sl', name: 'Salina',  code: 'SL-04', target: 82 },
  { id: 'ks', name: 'Wichita', code: 'KS-09', target: 75 },
  { id: 'co', name: 'Denver',  code: 'CO-07', target: 86 },
]

const GRAINS = [
  { id: 'shift', label: 'This Shift' },
  { id: 'day',   label: 'Today'      },
  { id: 'week',  label: 'This Week'  },
]

const PLANTS_META = [
  { id: 'sl', label: 'Salina'  },
  { id: 'ks', label: 'Wichita' },
  { id: 'co', label: 'Denver'  },
]

// ── Waterfall chart ───────────────────────────────────────────────────────────

function buildSteps(attr) {
  const steps = [{ id: 'base', label: 'Baseline', short: 'Baseline', value: attr.baseline, type: 'base', delta: null }]
  let running = attr.baseline
  for (const d of attr.drivers) {
    running = +(running + d.delta).toFixed(1)
    steps.push({ ...d, value: running, type: d.delta >= 0 ? 'pos' : 'neg' })
  }
  steps.push({ id: 'actual', label: 'Actual', short: 'Actual', value: attr.actual, type: 'total', delta: +(attr.actual - attr.baseline).toFixed(1) })
  return steps
}

function WaterfallChart({ attr }) {
  const steps = buildSteps(attr)
  const svgW = 700, svgH = 148
  const padL = 30, padR = 52, padT = 22, padB = 22
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB

  const allVals = steps.map(s => s.value)
  const minV = Math.floor(Math.min(...allVals) - 1.5)
  const maxV = Math.ceil(Math.max(...allVals) + 2.5)

  const barSlot = chartW / steps.length
  const barW = Math.floor(barSlot * 0.64)
  const xOf = (i) => padL + i * barSlot + (barSlot - barW) / 2
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  const range = maxV - minV
  const gridStep = range <= 8 ? 2 : range <= 16 ? 4 : 5
  const gridVals = []
  for (let v = Math.ceil(minV / gridStep) * gridStep; v <= maxV; v += gridStep) gridVals.push(v)

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label={`OEE attribution waterfall — ${attr.plant} ${attr.line}, ${attr.baseline}% baseline to ${attr.actual}% actual`}>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} x2={svgW - padR} y1={yOf(v)} y2={yOf(v)} stroke="var(--color-rule)" strokeWidth="0.5" />
          <text x={padL - 4} y={yOf(v) + 3} fontSize="8" fill="var(--color-muted)" textAnchor="end">{v}</text>
        </g>
      ))}
      <line x1={padL} x2={svgW - padR + 6} y1={yOf(attr.target)} y2={yOf(attr.target)} stroke="var(--color-warn)" strokeWidth="0.75" strokeDasharray="4,3" opacity="0.72" />
      <text x={svgW - padR + 8} y={yOf(attr.target) + 3} fontSize="7.5" fill="var(--color-warn)" opacity="0.8">Target</text>
      {steps.map((step, i) => {
        if (i === 0) return null
        const prev = steps[i - 1]
        return <line key={`c${i}`} x1={xOf(i - 1) + barW} x2={xOf(i)} y1={yOf(prev.value)} y2={yOf(prev.value)} stroke="var(--color-muted)" strokeWidth="0.75" strokeDasharray="2,2" />
      })}
      {steps.map((step, i) => {
        const x    = xOf(i)
        const prev = steps[i - 1]
        const isBase  = step.type === 'base'
        const isTotal = step.type === 'total'
        const isNeg   = step.type === 'neg'
        let barY, barH
        if (isBase || isTotal) { barY = yOf(step.value); barH = yOf(minV) - barY }
        else if (isNeg)        { barY = yOf(prev.value); barH = yOf(step.value) - yOf(prev.value) }
        else                   { barY = yOf(step.value); barH = yOf(prev.value) - yOf(step.value) }
        const color   = isBase ? 'var(--color-muted)' : isTotal ? 'var(--color-ink)' : isNeg ? 'var(--color-danger)' : 'var(--color-ok)'
        const opacity = isBase ? 0.22 : isTotal ? 0.85 : 0.7
        return (
          <g key={step.id}>
            <rect x={x} y={barY} width={barW} height={Math.max(1.5, barH)} fill={color} opacity={opacity} rx="1.5" />
            {step.delta !== null && (
              <text x={x + barW / 2} y={isNeg ? barY + barH + 9 : barY - 3} fontSize="7.5" fill={color} textAnchor="middle" fontWeight="600">
                {step.delta > 0 ? '+' : ''}{step.delta}
              </text>
            )}
            {isTotal && (
              <text x={x + barW / 2} y={barY - 11} fontSize="9.5" fill={color} textAnchor="middle" fontWeight="700">{step.value}%</text>
            )}
            <text x={x + barW / 2} y={svgH - 5} fontSize="7" fill="var(--color-muted)" textAnchor="middle">
              {step.short || step.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Benchmark card — horizontal ───────────────────────────────────────────────

function BenchmarkBlock({ b }) {
  return (
    <div className="border border-rule2 bg-stone flex items-center gap-6 px-5 py-4">
      {/* Metric + score */}
      <div className="w-44 flex-shrink-0">
        <div className="font-body text-muted text-label mb-1">{b.metric}</div>
        <div className="flex items-baseline gap-2">
          <span className="display-num text-metric font-bold text-ink leading-none"><AnimatedScore value={b.score} /></span>
          <span className={`font-body text-label font-medium ${b.deltaDir === 'up' ? 'text-ok' : 'text-danger'}`}>
            {b.deltaDir === 'up' ? '↑' : '↓'} {b.delta}
          </span>
        </div>
      </div>
      {/* Percentile bar */}
      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 bg-rule2 rounded-full overflow-hidden mb-1.5">
          <div className="absolute inset-y-0 left-0 rounded-full bg-ink/15" style={{ width: `${b.percentile}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-signal" style={{ left: `${b.percentile}%` }} />
        </div>
        <div className="font-body text-muted text-label">{b.percentile}th percentile · {b.total} plants</div>
      </div>
      {/* Peers */}
      {b.peers?.length > 0 && (
        <div className="flex-shrink-0 space-y-0.5 w-36">
          {b.peers.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="font-body text-muted text-label truncate">{p.name}</span>
              <span className="font-body font-medium text-ink text-label tabular-nums">{p.value}</span>
            </div>
          ))}
        </div>
      )}
      {/* Insight */}
      {b.insight && (
        <div className="font-body text-ok text-label flex-shrink-0 w-40 leading-snug">{b.insight}</div>
      )}
    </div>
  )
}

// ── Accordion module ──────────────────────────────────────────────────────────

function Module({ title, badge, badgeTone, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-rule2 bg-stone">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-stone2 hover:bg-stone3 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-body font-medium text-ink text-body">{title}</span>
          {badge && (
            badgeTone
              ? <StatusPill tone={badgeTone} className="flex-shrink-0">{badge}</StatusPill>
              : <span className="font-body text-muted text-label px-2 py-0.5 bg-stone3 flex-shrink-0">{badge}</span>
          )}
        </div>
        <ChevronDown size={11} className={`text-muted flex-shrink-0 ml-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-rule2">{children}</div>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { closedCases, readinessScore, currentPlant } = useAppState()
  const [scopePlant, setScopePlant] = useState(currentPlant?.id || 'sl')
  const [timeGrain, setTimeGrain]   = useState('shift')
  const [compare, setCompare]       = useState([])
  const [exportState, setExportState] = useState('idle')
  const [cohort, setCohort]         = useState('similar')

  const plantMeta   = ATTR[scopePlant] || ATTR.sl
  const grainData   = plantMeta[timeGrain] || plantMeta.shift
  const attr        = { plant: plantMeta.plant, code: plantMeta.code, line: plantMeta.line, target: plantMeta.target, ...grainData }

  const totalDelta  = +(attr.actual - attr.baseline).toFixed(1)
  const atTarget    = attr.actual >= attr.target
  const topDrivers  = [...attr.drivers].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)

  const networkStripData = STRIP_BASE.map(p => {
    const gd = ATTR[p.id][timeGrain]
    return { ...p, oee: gd.actual, delta: +(gd.actual - gd.baseline).toFixed(1) }
  })

  const closedCount  = 14 + (closedCases?.length || 0)
  const openCount    = openCases.length - (closedCases?.length || 0)
  const overdueCount = openCases.filter(c => c.badgeColor === 'text-danger' && !closedCases?.includes(c.id)).length

  const onTrackCount = goalsData.filter(g =>
    g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
  ).length

  const adoptionAtRisk = ADOPTION_WORKFLOWS.filter(w => w.rate < w.target).length

  const toggleCompare = (id) =>
    setCompare(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleExport = () => {
    setExportState('loading')
    setTimeout(() => setExportState('done'), 1500)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      {/* ── Scope bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-rule2 bg-stone flex-shrink-0">
        <FilterDropdown
          label="Plant"
          options={PLANTS_META.map(p => ({ value: p.id, label: p.label }))}
          value={scopePlant}
          onChange={(id) => { setScopePlant(id); setCompare(prev => prev.filter(p => p !== id)) }}
        />
        <FilterDropdown
          label="Grain"
          options={GRAINS.map(g => ({ value: g.id, label: g.label }))}
          value={timeGrain}
          onChange={setTimeGrain}
        />
        <MultiFilterDropdown
          label="Compare"
          options={STRIP_BASE.filter(p => p.id !== scopePlant).map(p => ({ value: p.id, label: p.name }))}
          values={compare}
          onChange={setCompare}
        />
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={handleExport} disabled={exportState === 'loading'}
            className="flex items-center gap-1.5 font-body text-label text-muted px-3 py-1.5 hover:border-ink/30 hover:text-muted transition-colors disabled:opacity-50">
            {exportState === 'done'
              ? <><Check size={11} strokeWidth={2} className="text-ok" />Exported</>
              : <><Download size={11} strokeWidth={2} />{exportState === 'loading' ? 'Preparing…' : 'Export'}</>}
          </button>
        </div>
      </div>

      {/* ── Network strip ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-rule2 flex-shrink-0 bg-stone2">
        {networkStripData.map(p => {
          const isActive = p.id === scopePlant
          const atTgt    = p.oee >= p.target
          const dimmed   = !isActive && !compare.includes(p.id)
          return (
            <button key={p.id} type="button" onClick={() => setScopePlant(p.id)}
              className={`flex-1 flex items-center justify-between px-5 py-2.5 border-r border-rule2 last:border-r-0 border-b-2 transition-colors text-left ${
                isActive ? 'border-b-signal bg-stone' : 'border-b-transparent hover:bg-stone3'
              } ${dimmed ? 'opacity-45' : ''}`}>
              <div>
                <div className="font-body text-muted text-label mb-0.5">{p.code} · {p.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className={`display-num text-title font-bold leading-none ${atTgt ? 'text-ok' : 'text-warn'}`}>{p.oee}%</span>
                  <span className={`font-body text-label font-medium ${p.delta >= 0 ? 'text-ok' : 'text-danger'}`}>
                    {p.delta >= 0 ? '+' : ''}{p.delta}pp
                  </span>
                </div>
              </div>
              <div className={`font-body text-label ${atTgt ? 'text-ok' : 'text-warn'}`}>
                {atTgt ? 'At target' : `${+(p.target - p.oee).toFixed(1)}pp below ${p.target}%`}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto page-rise">
        <div className="max-w-[900px] mx-auto px-8 py-8">

          {/* ── Attribution hero ─────────────────────────────────────────── */}
          <section className="mb-8">

            {/* Interpretation leads — narrative first, numbers confirm */}
            <div className="font-display font-bold text-head text-ink leading-snug mb-5">
              {attr.plant} {attr.line} {attr.narrative}.
            </div>

            {/* Supporting data strip */}
            <div className="flex items-center gap-5 mb-5 pb-5 border-b border-rule2">
              <div>
                <div className="display-num text-score font-bold text-ink leading-none"><AnimatedScore value={attr.actual} suffix="%" effect="glow" hero /></div>
                <div className="font-body text-muted text-label mt-1">Actual OEE</div>
              </div>
              <div className="h-10 w-px bg-rule2" />
              <div>
                <div className={`display-num text-metric font-bold leading-none ${totalDelta >= 0 ? 'text-ok' : 'text-danger'}`}>
                  {totalDelta >= 0 ? '+' : ''}{totalDelta}pp
                </div>
                <div className="font-body text-muted text-label mt-1">vs {attr.baseline}% baseline</div>
              </div>
              <div className="h-10 w-px bg-rule2" />
              <div>
                <StatusPill tone={atTarget ? 'ok' : 'warn'}>
                  {atTarget
                    ? `At target (${attr.target}%)`
                    : `${+(attr.target - attr.actual).toFixed(1)}pp below ${attr.target}% target`}
                </StatusPill>
              </div>
              <div className="flex items-center gap-2 flex-wrap ml-auto">
                {topDrivers.map(d => (
                  <StatusPill key={d.id} tone={d.delta >= 0 ? 'ok' : 'danger'}>
                    {d.delta >= 0 ? '+' : ''}{d.delta}pp {d.short}
                  </StatusPill>
                ))}
              </div>
            </div>

            <div className="border border-rule2 bg-stone px-4 pt-4 pb-2">
              <WaterfallChart attr={attr} />
            </div>
          </section>

          {/* ── Recovery table ───────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="font-body text-muted text-label mb-3">Recovery actions</div>
            <div className="grid grid-cols-2 gap-4">
              {attr.drivers.map(d => (
                <Link key={d.id} to={d.route}
                  className={`block bg-stone border border-rule2 border-l-[3px] hover:bg-stone2 transition-colors ${d.delta >= 0 ? 'border-l-ok' : 'border-l-danger'}`}>
                  {/* Zone 1 — identity: module + what happened */}
                  <div className="px-4 pt-4 pb-0">
                    <div className="font-body text-label text-muted mb-1.5">{d.module}</div>
                    <div className="font-body font-bold text-body text-ink leading-snug">{d.label}</div>
                    <div className="font-body text-muted text-label mt-1 leading-relaxed">{d.note}</div>
                  </div>
                  {/* Zone 2 — recommended action */}
                  <div className="px-4 pt-4 pb-0">
                    <div className="font-body text-label text-muted mb-1">Recommended action</div>
                    <div className="font-body text-label text-ink2 leading-relaxed">{d.action}</div>
                  </div>
                  {/* Zone 3 — delta */}
                  <div className="px-4 pt-4 pb-4">
                    <div className={`display-num text-head font-bold leading-none tabular-nums ${d.delta >= 0 ? 'text-ok' : 'text-danger'}`}>
                      {d.delta >= 0 ? '+' : ''}{d.delta}pp
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="h-px bg-rule2 mb-8" />

          {/* ── Supporting intelligence ───────────────────────────────────── */}

          {/* Summary strip — at-a-glance status of all modules */}
          {(() => {
            const positiveCount = interventions.filter(e => e.outcomeClassification === 'positive').length
            const networkAtRisk = [64, 89, 94].filter(r => r < 85).length // SL-04 is at risk
            const cells = [
              { label: 'Impact',            val: '$312K protected',                               tone: 'ok'     },
              { label: 'Outcomes',          val: `${Math.round(positiveCount / interventions.length * 100)}% positive`, tone: positiveCount / interventions.length >= 0.7 ? 'ok' : 'warn' },
              { label: 'CAPA',              val: overdueCount > 0 ? `${overdueCount} overdue` : `${openCount} open`, tone: overdueCount > 0 ? 'danger' : openCount > 2 ? 'warn' : 'ok' },
              { label: 'Q2 Goals',          val: `${onTrackCount} of ${goalsData.length} on track`, tone: onTrackCount === goalsData.length ? 'ok' : onTrackCount >= goalsData.length * 0.7 ? 'warn' : 'danger' },
              { label: 'Workflow adoption', val: adoptionAtRisk > 0 ? `${adoptionAtRisk} of ${ADOPTION_WORKFLOWS.length} at risk` : 'All on track', tone: adoptionAtRisk > 0 ? 'warn' : 'ok' },
              { label: 'Network rollup',    val: `${networkAtRisk} of 3 at risk`,                  tone: networkAtRisk > 0 ? 'warn' : 'ok' },
            ]
            return (
              <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2 mb-8">
                {cells.map(({ label, val, tone }) => (
                  <div key={label} className="bg-stone px-5 py-3">
                    <div className="font-body text-muted text-label mb-1">{label}</div>
                    <StatusPill tone={tone}>{val}</StatusPill>
                  </div>
                ))}
              </div>
            )
          })()}

          <div className="space-y-5">

            <Module title="Impact" badge="$312K protected · Q2 2026" badgeTone="ok" defaultOpen>
              <div className="bg-ok/[0.02] border-b border-rule2 px-5 py-4 flex items-baseline gap-6">
                <div>
                  <div className="font-body text-muted text-label mb-1">Value protected · Q2 2026</div>
                  <div className="flex items-baseline gap-2">
                    <span className="display-num text-score leading-none text-ok">$312K</span>
                    <span className="font-body text-ok text-label">+$47K vs Q1</span>
                  </div>
                </div>
                <div className="flex-1 border-l border-rule2 pl-6 grid grid-cols-3 gap-6">
                  {[
                    { label: 'Interventions acted', value: '47', sub: 'this quarter', bar: 47/80, tone: 'ok' },
                    { label: 'Avg. OEE recovery', value: '6.4pp', sub: 'per intervention', bar: 6.4/12, tone: 'ok' },
                    { label: 'Cert mismatch share', value: '61%', sub: 'of protected value', bar: 0.61, tone: 'warn' },
                  ].map(m => {
                    const c = m.tone === 'ok' ? 'var(--color-ok)' : 'var(--color-warn)'
                    return (
                      <div key={m.label}>
                        <div className="font-body text-muted text-label mb-1">{m.label}</div>
                        <div className="display-num text-head leading-none mb-0.5" style={{ color: c }}>{m.value}</div>
                        <div className="font-body text-muted text-label mb-1.5">{m.sub}</div>
                        <div className="h-[3px] bg-rule2">
                          <div className="h-full" style={{ width: `${m.bar * 100}%`, background: c, opacity: 0.7 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Module>

            {/* ── Impact Attribution ───────────────────────────────────────── */}
            <Module title="Outcomes" badge={`${Math.round(interventions.filter(e=>e.outcomeClassification==='positive').length/interventionSummary.total*100)}% positive · ${interventionSummary.total} interventions`} badgeTone={interventions.filter(e=>e.outcomeClassification==='positive').length/interventionSummary.total>=0.7?'ok':'warn'} defaultOpen>
              {(() => {
                const positiveCount = interventions.filter(e => e.outcomeClassification === 'positive').length
                const unclearCount  = interventions.filter(e => e.outcomeClassification === 'unclear').length
                const negativeCount = interventions.filter(e => e.outcomeClassification === 'negative' || e.outcomeClassification === 'harmful').length
                const confirmRate   = Math.round((interventionSummary.operatorConfirmed / interventionSummary.total) * 100)
                const avgConf       = Math.round(interventionSummary.avgAttributionConfidence * 100)
                return (
                  <div>
                    {/* Stat grid */}
                    <StatGrid cols={3}>
                      {[
                        { label: 'Positive outcomes', val: `${positiveCount}/${interventionSummary.total}`, tone: 'text-ok' },
                        { label: 'Avg confidence', val: `${avgConf}%`, tone: avgConf >= 70 ? 'text-ok' : avgConf >= 50 ? 'text-warn' : 'text-danger' },
                        { label: 'Operator confirmed', val: `${confirmRate}%`, tone: confirmRate >= 60 ? 'text-ok' : 'text-warn' },
                        { label: 'Auto-run', val: String(interventionSummary.autoExecuted), tone: 'text-signal' },
                        { label: 'Reversed', val: String(interventionSummary.reversed), tone: interventionSummary.reversed > 0 ? 'text-warn' : 'text-muted' },
                        { label: 'Quick approvals', val: String(interventionSummary.lowDwellDecisions), tone: interventionSummary.lowDwellDecisions > 0 ? 'text-danger' : 'text-ok' },
                      ].map(({ label, val, tone }) => (
                        <StatGrid.Cell key={label} label={label} value={val} tone={tone} />
                      ))}
                    </StatGrid>
                    {/* Outcome distribution bar */}
                    <div className="px-5 py-4 border-b border-rule2">
                      <div className="font-body text-muted text-label mb-3">Outcome distribution</div>
                      <div className="h-4 bg-rule2 flex overflow-hidden mb-2">
                        {positiveCount > 0 && <div className="h-full bg-ok/70" style={{ width: `${(positiveCount/interventionSummary.total)*100}%` }} />}
                        {unclearCount > 0  && <div className="h-full bg-signal/60" style={{ width: `${(unclearCount/interventionSummary.total)*100}%` }} />}
                        {negativeCount > 0 && <div className="h-full bg-danger/60" style={{ width: `${(negativeCount/interventionSummary.total)*100}%` }} />}
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: `Positive (${positiveCount})`, color: 'bg-ok/70'     },
                          { label: `Unclear (${unclearCount})`,   color: 'bg-signal/60'  },
                          { label: `Negative (${negativeCount})`, color: 'bg-danger/60' },
                        ].map(l => (
                          <span key={l.label} className="flex items-center gap-1.5 font-body text-muted text-label">
                            <span className={`w-2 h-2 ${l.color} flex-shrink-0`} />{l.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="font-body text-muted text-label">Confidence reflects how certain we are the action caused the outcome. Below 60% means the cause isn't clear.</span>
                      <Link to="/outcomes" className="flex items-center gap-1 font-body text-muted text-label hover:text-ink transition-colors">
                        <ArrowRight size={10} />View ImpactLoop
                      </Link>
                    </div>
                  </div>
                )
              })()}
            </Module>

            <Module title="CAPA Register" badge={overdueCount > 0 ? `${overdueCount} overdue · ${openCount} open` : `${openCount} open · ${closedCount} closed`} badgeTone={overdueCount > 0 ? 'danger' : openCount > 2 ? 'warn' : 'ok'} defaultOpen>
              <div className="grid grid-cols-4 gap-4 p-5">
                {[
                  { label: 'Closed',       val: closedCount,  bar: closedCount / (closedCount + openCount), tone: 'ok',     sub: 'This quarter'              },
                  { label: 'Open',         val: openCount,    bar: openCount / 12,                          tone: openCount > 2 ? 'warn' : 'ok', sub: 'Active queue' },
                  { label: 'Overdue',      val: overdueCount, bar: overdueCount / 5,                        tone: overdueCount > 0 ? 'danger' : 'ok', sub: 'Past due date' },
                  { label: 'Closure rate', val: '78%',        bar: 0.78,                                    tone: 'warn',   sub: '71st pct. · unlocks at 82%' },
                ].map(({ label, val, bar, tone, sub }) => {
                  const c = tone === 'ok' ? 'var(--color-ok)' : tone === 'warn' ? 'var(--color-warn)' : 'var(--color-danger)'
                  const borderL = tone === 'danger' ? 'border-l-danger' : tone === 'warn' ? 'border-l-warn' : 'border-l-ok'
                  return (
                    <div key={label} className={`bg-stone border border-rule2 border-l-[3px] ${borderL}`}>
                      <div className="px-4 pt-4 pb-0">
                        <div className="font-body font-bold text-body text-ink">{label}</div>
                      </div>
                      <div className="px-4 pt-4 pb-0">
                        <div className="display-num text-metric font-bold leading-none tabular-nums" style={{ color: c }}>{val}</div>
                      </div>
                      <div className="px-4 pt-4 pb-4">
                        <div className="h-[3px] bg-rule2 relative mb-1.5">
                          {label === 'Closure rate' && (
                            <div className="absolute top-1/2 -translate-y-1/2 w-px h-[9px] bg-warn/50" style={{ left: '82%' }} />
                          )}
                          <div className="h-full" style={{ width: `${Math.min(bar, 1) * 100}%`, background: c }} />
                        </div>
                        <div className="font-body text-muted text-label">{sub}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Module>

            <Module title="Q2 Goals" badge={`${onTrackCount} of ${goalsData.length} on track · Jun 30`} badgeTone={onTrackCount === goalsData.length ? 'ok' : onTrackCount >= goalsData.length * 0.7 ? 'warn' : 'danger'} defaultOpen>
              <div className="grid grid-cols-3 divide-x divide-rule2">
                {goalsData.map(g => {
                  const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
                  const toneColor = onTrack ? 'var(--color-ok)' : 'var(--color-warn)'
                  return (
                    <div key={g.id} className={`px-5 py-4 ${!onTrack ? 'bg-warn/[0.02]' : 'bg-stone'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-body text-muted text-label">{g.label}</div>
                        <span className="font-body text-label text-muted tabular-nums">46d left</span>
                      </div>
                      <div className="display-num text-metric font-bold leading-none mb-0.5" style={{ color: toneColor }}>
                        {g.current}{g.unit}
                      </div>
                      <div className="font-body text-muted text-label mb-2">
                        Target {g.target}{g.unit} · {onTrack ? 'On track' : 'Behind'}
                      </div>
                      {/* Bullet chart — 6px, calibrated */}
                      <div className="relative h-[6px] bg-rule2">
                        {(() => {
                          const max = g.unit === '%' ? 100 : Math.ceil(Math.max(g.current, g.target) * 1.8)
                          const currentPct = Math.min(100, (g.current / max) * 100)
                          const targetPct = Math.min(100, (g.target / max) * 100)
                          return (
                            <>
                              <div className="absolute inset-y-0 left-0" style={{ width: `${currentPct}%`, background: toneColor, opacity: 0.75 }} />
                              <div className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[10px] bg-ink/30" style={{ left: `${targetPct}%` }} />
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Module>

            <Module
              title="Workflow adoption"
              badge={adoptionAtRisk > 0 ? `${adoptionAtRisk} of ${ADOPTION_WORKFLOWS.length} at risk` : 'All on track'}
              badgeTone={adoptionAtRisk > 0 ? 'warn' : 'ok'}
              defaultOpen={adoptionAtRisk > 0}
            >
              <div className="grid grid-cols-2 gap-4 p-5">
                {ADOPTION_WORKFLOWS.map(w => {
                  const atRisk = w.rate < w.target
                  const c = atRisk ? (w.rate < w.target * 0.8 ? 'var(--color-danger)' : 'var(--color-warn)') : 'var(--color-ok)'
                  const borderL = atRisk ? (w.rate < w.target * 0.8 ? 'border-l-danger' : 'border-l-warn') : 'border-l-ok'
                  const gap = w.target - w.rate
                  return (
                    <div key={w.id} className={`bg-stone border border-rule2 border-l-[3px] ${borderL}`}>
                      <div className="px-4 pt-4 pb-0">
                        <div className="font-body font-bold text-body text-ink leading-snug">{w.label}</div>
                        <div className="font-body text-muted text-label mt-1">{w.role}</div>
                      </div>
                      <div className="px-4 pt-4 pb-0">
                        <div className="display-num text-metric font-bold leading-none tabular-nums" style={{ color: c }}>{w.rate}%</div>
                        <div className="font-body text-label mt-2">
                          {atRisk
                            ? <span style={{ color: c }}>{gap}pp below target</span>
                            : <span className="text-ok">{-gap}pp above target</span>}
                          <span className="text-muted ml-2">
                            {w.trend > 0 ? '↑' : '↓'}{Math.abs(w.trend)}pp week
                          </span>
                        </div>
                      </div>
                      <div className="px-4 pt-4 pb-4">
                        <div className="relative h-[3px] bg-rule2 mb-1.5">
                          <div className="absolute top-1/2 -translate-y-1/2 w-px h-[9px] bg-ink/20" style={{ left: `${w.target}%` }} />
                          <div className="h-full" style={{ width: `${w.rate}%`, background: c }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-body text-label text-muted">Target {w.target}%</div>
                          <Link to={w.route} className="flex items-center gap-1 font-body text-label font-medium text-signal hover:text-ink transition-colors">
                            {w.module} <ArrowRight size={9} />
                          </Link>
                        </div>
                        {w.warning && (
                          <div className="mt-3 px-3 py-2 bg-warn/[0.04] border-l-2 border-l-warn/40">
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle size={9} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
                              <span className="font-body text-warn text-label leading-snug">{w.warning}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Module>

            <Module
              title="Network rollup"
              badge="1 of 3 at risk"
              badgeTone="warn"
            >
              <div className="grid grid-cols-3 gap-4 p-5">
                {[
                  { id: 'sl', name: 'Salina Campus', code: 'SL-04', readiness: 64, adoption: 67, status: 'at-risk', active: true  },
                  { id: 'tx', name: 'Plant TX-11',   code: 'TX-11', readiness: 89, adoption: 91, status: 'clear',   active: false },
                  { id: 'ks', name: 'Plant KS-02',   code: 'KS-02', readiness: 94, adoption: 95, status: 'clear',   active: false },
                ].map(plant => {
                  const c = plant.readiness >= 85 ? 'var(--color-ok)' : plant.readiness >= 70 ? 'var(--color-warn)' : 'var(--color-danger)'
                  const ac = plant.adoption >= 85 ? 'var(--color-ok)' : plant.adoption >= 70 ? 'var(--color-warn)' : 'var(--color-danger)'
                  const borderL = plant.status === 'at-risk' ? 'border-l-danger' : 'border-l-ok'
                  return (
                    <div key={plant.id} className={`bg-stone border border-rule2 border-l-[3px] ${borderL}`}>
                      <div className="px-4 pt-4 pb-0">
                        <div className={`font-body font-bold text-body leading-snug ${plant.active ? 'text-ink' : 'text-muted'}`}>{plant.name}</div>
                        <div className="font-body text-muted text-label mt-1">{plant.code}{plant.active ? ' · active' : ''}</div>
                      </div>
                      <div className="px-4 pt-4 pb-0 flex items-end gap-6">
                        <div>
                          <div className="font-body text-muted text-label mb-1">Readiness</div>
                          <div className="display-num text-title font-bold leading-none tabular-nums" style={{ color: c }}>{plant.readiness}</div>
                        </div>
                        <div>
                          <div className="font-body text-muted text-label mb-1">Adoption</div>
                          <div className="display-num text-title font-bold leading-none tabular-nums" style={{ color: ac }}>{plant.adoption}%</div>
                        </div>
                      </div>
                      <div className="px-4 pt-4 pb-4">
                        <div className="h-[3px] bg-rule2 mb-1.5">
                          <div className="h-full" style={{ width: `${plant.readiness}%`, background: c }} />
                        </div>
                        <div className="font-body text-label">
                          {plant.status === 'at-risk'
                            ? <span style={{ color: c }}>Below 85% threshold</span>
                            : <span className="text-ok">Above threshold</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Module>

            <Module title="Industry Benchmarks" badge={`${benchmarks.length} metrics · ${COHORT_OPTIONS.find(c => c.id === cohort)?.desc ?? ''}`}>
              {/* Cohort selector */}
              <div className="border-b border-rule2 bg-stone2">
                <div className="flex items-center gap-1 px-5 pt-3 pb-2">
                  <span className="font-body text-muted text-label mr-1">Compare against</span>
                </div>
                <div className="flex px-5 pb-3 gap-2 flex-wrap">
                  {COHORT_OPTIONS.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setCohort(opt.id)}
                      className={`font-body text-label px-3 py-1.5 border transition-colors text-left ${
                        cohort === opt.id
                          ? 'border-ink/30 text-ink bg-stone3'
                          : 'border-rule2 text-muted hover:border-ink/20 hover:text-ink'
                      }`}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="font-body text-label text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5">
                {benchmarks.map((b, i) => {
                  const c = b.deltaDir === 'up' ? 'var(--color-ok)' : 'var(--color-warn)'
                  const borderL = b.deltaDir === 'down' ? 'border-l-warn' : 'border-l-ok'
                  return (
                    <div key={i} className={`bg-stone border border-rule2 border-l-[3px] ${borderL}`}>
                      <div className="px-4 pt-4 pb-0">
                        <div className="font-body font-bold text-body text-ink leading-snug">{b.metric}</div>
                      </div>
                      <div className="px-4 pt-4 pb-0 flex items-end gap-4">
                        <div>
                          <div className="font-body text-muted text-label mb-1">Score</div>
                          <div className="display-num text-title font-bold leading-none tabular-nums" style={{ color: c }}>{b.score}</div>
                        </div>
                        <div className="pb-0.5">
                          <div className="font-body text-label mb-1 text-muted">Percentile</div>
                          <div className="font-body font-bold text-sub text-muted tabular-nums">{b.percentile}th</div>
                        </div>
                      </div>
                      <div className="px-4 pt-4 pb-4">
                        <div className="relative h-[3px] bg-rule2 mb-1.5">
                          <div className="absolute top-1/2 -translate-y-1/2 w-px h-[9px] bg-muted/30" style={{ left: '50%' }} />
                          <div className="h-full" style={{ width: `${b.percentile}%`, background: c }} />
                        </div>
                        <div className="font-body text-label text-muted">{b.delta}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Top quartile practices */}
              <div className="border-t-2 border-rule2">
                <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                  <span className="font-body text-muted text-label font-medium">What the top quartile does differently</span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5">
                  {TOP_QUARTILE.map((p, i) => (
                    <Link key={i} to={p.route}
                      className="block bg-stone border border-rule2 border-l-[3px] border-l-ok hover:bg-stone2 transition-colors">
                      {/* Zone 1 — area + practice */}
                      <div className="px-4 pt-4 pb-0">
                        <div className="font-body text-label text-muted mb-1.5">{p.area}</div>
                        <div className="font-body font-bold text-body text-ink leading-snug">{p.practice}</div>
                      </div>
                      {/* Zone 2 — lift */}
                      <div className="px-4 pt-4 pb-0">
                        <div className="font-body text-label text-muted mb-1">Impact</div>
                        <div className="font-body text-label text-ok leading-relaxed">{p.lift}</div>
                      </div>
                      {/* Zone 3 — adoption */}
                      <div className="px-4 pt-4 pb-4">
                        <div className="h-[3px] bg-rule2 mb-1.5">
                          <div className="h-full bg-ok" style={{ width: `${p.adoption}%` }} />
                        </div>
                        <div className="font-body text-label text-muted">{p.adoption}% of top-quartile plants</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Module>

            <Module title="Cross-plant signals" badge="2 of 4 plants connected · 3 needed for signals">
              <div className="grid grid-cols-3 gap-4 p-5">
              {[
                { label: 'Plants in network',              note: 'Salina Campus · Wichita Plant active',                        plants: 'SL-04 · KS-09', conf: 100, status: 'Active', tone: 'ok',   locked: false },
                { label: 'Shared supplier exposure',       note: 'ConAgra and ADM on overlapping lots',                         plants: 'Both',          conf: 87,  status: 'Active', tone: 'warn', locked: false },
                { label: 'Cross-plant supplier scorecards',note: 'ConAgra reliability across all plants — updated weekly',       plants: '3 needed',      conf: 0,   status: 'Locked', tone: 'muted',locked: true  },
                { label: 'Network OEE benchmarks (live)',  note: 'Real-time percentile vs. plant network',                       plants: '3 needed',      conf: 0,   status: 'Locked', tone: 'muted',locked: true  },
                { label: 'Predictive delivery risk alerts',note: '"ConAgra delays at KS-02 → Line 4 scrap spikes within 48h"',   plants: '3 needed',      conf: 0,   status: 'Locked', tone: 'muted',locked: true  },
              ].map((s, i) => {
                const c = s.tone === 'ok' ? 'var(--color-ok)' : s.tone === 'warn' ? 'var(--color-warn)' : 'var(--color-muted)'
                const borderL = s.locked ? 'border-l-rule2' : s.tone === 'warn' ? 'border-l-warn' : 'border-l-ok'
                return (
                  <div key={i} className={`bg-stone border border-rule2 border-l-[3px] ${borderL} ${s.locked ? 'opacity-40' : ''}`}>
                    <div className="px-4 pt-4 pb-0">
                      <div className="flex items-center gap-1.5">
                        {s.locked && <Lock size={9} strokeWidth={2} className="text-muted flex-shrink-0" />}
                        <div className="font-body font-bold text-body text-ink leading-snug">{s.label}</div>
                      </div>
                      <div className="font-body text-muted text-label mt-1 leading-relaxed">{s.note}</div>
                    </div>
                    <div className="px-4 pt-4 pb-4">
                      {!s.locked ? (
                        <>
                          <div className="h-[3px] bg-rule2 mb-1.5">
                            <div className="h-full" style={{ width: `${s.conf}%`, background: c }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="font-body text-label tabular-nums" style={{ color: c }}>{s.conf}% confidence</div>
                            <div className="font-body text-label font-medium" style={{ color: c }}>{s.status}</div>
                          </div>
                        </>
                      ) : (
                        <div className="font-body text-label text-muted">Connect 1 more plant to unlock</div>
                      )}
                    </div>
                  </div>
                )
              })}
              </div>
            </Module>

            <Module title="AI accuracy" badge="82% · 28 shifts · Line 4">
              <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {[
                    { label: 'Pilot running',    value: '28 shifts · Line 4'                  },
                    { label: 'Current accuracy', value: '82% · trending up', color: 'text-ok' },
                    { label: 'Last retrained',   value: 'Apr 2 · 14 shifts ago'               },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="font-body text-muted text-label mb-0.5">{label}</div>
                      <div className={`font-body font-medium text-body ${color || 'text-ink'}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <p className="font-display text-muted text-body leading-relaxed">
                  Every actioned finding and dismissed pattern contributes to the model. At 300 shifts, Line 4 accuracy is expected to reach 88–91%. Cross-plant intelligence activates at 3 connected plants.
                </p>
              </div>
            </Module>

          </div>

        </div>
      </div>
    </div>
  )
}
