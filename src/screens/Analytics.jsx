import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { openCases, benchmarks } from '../data/capa.js'
import { goalsData, facility, agentConfigData } from '../data'
import { interventionSummary, interventions } from '../data/interventions'
import { ChevronDown, ChevronUp, Download, Lock, ArrowRight, Check } from 'lucide-react'

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
        { id: 'sensor',   label: 'Sensor A-7 flagged',    short: 'Sensor A-7',  delta: +0.8, note: 'Bearing inspection scheduled · variance caught early',   action: 'Complete sensor calibration before next shift',                route: '/readiness', module: 'Data Readiness' },
        { id: 'scada',    label: 'SCADA gap',              short: 'SCADA gap',   delta: -0.3, note: 'Oven B sensor stale · confidence penalty applied',      action: 'Restore Oven B sensor feed to unlock full confidence signal',  route: '/readiness', module: 'Data Readiness' },
      ],
    },
    day: {
      baseline: 75.5, actual: 79.8,
      narrative: 'AM shift recovered; PM shift catching up — day closes below target',
      drivers: [
        { id: 'staff',    label: 'Staff coverage (both shifts)',   short: 'Staffing',    delta: +2.1, note: 'Martinez coverage held AM and PM · no cert gaps throughout', action: 'Carry pre-assignment forward into tomorrow',                   route: '/shift',     module: 'ShiftIQ'        },
        { id: 'check',    label: 'Checklist adherence rate',       short: 'Checklists',  delta: +1.6, note: 'AM: 9/11 cleared · PM: 8/11 cleared — improving shift-over-shift', action: 'Chase 3 recurring misses with PM supervisor tonight',      route: '/shift',     module: 'ShiftIQ'        },
        { id: 'allergen', label: 'Allergen restart delay (AM)',     short: 'Allergen',    delta: +1.2, note: 'AM resolved cleanly; PM changeover was cleaner than yesterday', action: 'Log AM resolution as procedure template for PM',              route: '/shift',     module: 'ShiftIQ'        },
        { id: 'scada',    label: 'SCADA gap (both shifts)',         short: 'SCADA gap',   delta: -0.6, note: 'Oven B sensor stale across full day — penalty compounding',  action: 'Escalate sensor restore to maintenance before tomorrow AM',   route: '/readiness', module: 'Data Readiness' },
      ],
    },
    week: {
      baseline: 74.0, actual: 82.5,
      narrative: 'crossed the 82% target for the first time this quarter',
      drivers: [
        { id: 'cert',     label: 'Cert gap closures',              short: 'Cert gaps',   delta: +4.2, note: '5 operators certified this week · L2 Sauce Dosing now fully staffed', action: 'Accelerate remaining 4 cert backlog cases into Q3 assessment window', route: '/operator',  module: 'Operator View'  },
        { id: 'allergen', label: 'Allergen program improvement',    short: 'Allergen',    delta: +2.8, note: 'Standardized checklist cut changeover time 22% week-over-week',     action: 'Extend standardized procedure to Lines 3 and 6 next week',         route: '/shift',     module: 'ShiftIQ'        },
        { id: 'check',    label: 'Checklist adherence up 18%',     short: 'Checklists',  delta: +2.1, note: 'Automated reminders reduced missed startup items from 6 to 1',      action: 'Confirm reminder cadence carries into next week schedule',          route: '/shift',     module: 'ShiftIQ'        },
        { id: 'scada',    label: 'SCADA gap (Oven B, ongoing)',     short: 'SCADA gap',   delta: -1.6, note: 'Sensor stale since Apr 9 · confidence penalty accumulating weekly', action: 'Restore Oven B — highest-leverage action going into week 3',       route: '/readiness', module: 'Data Readiness' },
      ],
    },
  },
  ks: {
    plant: 'Wichita', code: 'KS-09', line: 'Line W1', target: 75,
    shift: {
      baseline: 68.0, actual: 71.0,
      narrative: 'partially recovered — allergen delay cost 1.2 points',
      drivers: [
        { id: 'crew',     label: 'Crew readiness',          short: 'Crew',      delta: +2.8, note: 'Full L2 coverage across all stations',               action: 'Maintain coverage levels — flag any cert gap immediately', route: '/operator',  module: 'Operator View'  },
        { id: 'ccp',      label: 'CCP compliance held',     short: 'CCP hold',  delta: +1.4, note: 'All bake temps within window · no corrective logs',  action: 'Continue CCP-3 monitoring cadence each shift',            route: '/operator',  module: 'Operator View'  },
        { id: 'allergen', label: 'Allergen changeover lag', short: 'Allergen',  delta: -1.2, note: 'GF-Flatbread transition 18 min over target',         action: 'Add L2 support or extend changeover window in schedule',  route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    day: {
      baseline: 67.5, actual: 71.8,
      narrative: 'both shifts short of target — allergen delays compounding across the day',
      drivers: [
        { id: 'crew',     label: 'Crew coverage maintained',     short: 'Crew',      delta: +2.8, note: 'Full L2 held through AM and PM · no gap incidents',               action: 'Schedule coverage review before tomorrow start',                    route: '/operator',  module: 'Operator View'  },
        { id: 'ccp',      label: 'CCP compliance held',          short: 'CCP hold',  delta: +1.5, note: 'All readings within window across both shifts',                   action: 'Continue CCP-3 monitoring cadence',                                route: '/operator',  module: 'Operator View'  },
        { id: 'allergen', label: 'Allergen lag (both shifts)',    short: 'Allergen',  delta: -2.0, note: 'Recurring GF-Flatbread delay hit AM and PM — pattern is clear',   action: 'Escalate changeover root cause — this is a recurring daily issue', route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    week: {
      baseline: 66.5, actual: 73.5,
      narrative: 'trending toward target — cert backlog is the remaining constraint',
      drivers: [
        { id: 'crew',     label: 'L2 crew coverage improvement',       short: 'Crew',      delta: +3.8, note: 'Coverage at 94% this week vs 81% prior week',                        action: 'Fill remaining 2 L2 cert gaps before next week',                route: '/operator',  module: 'Operator View'  },
        { id: 'ccp',      label: 'CCP protocol compliance',            short: 'CCP',       delta: +2.4, note: 'Zero corrective logs this week · oven temps consistent all 7 days',  action: 'Carry forward CCP logging discipline into next week',           route: '/operator',  module: 'Operator View'  },
        { id: 'supplier', label: 'Clean supplier inputs',              short: 'Supplier',  delta: +2.2, note: 'No ConAgra interruptions or lot holds this week',                    action: 'Monitor TS-9840 lot arriving Friday — flag if delayed',         route: '/network',   module: 'Network View'   },
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
        { id: 'supplier', label: 'Clean supplier inputs',   short: 'Supplier',  delta: +2.7, note: 'No lot holds or trace gaps this shift',               action: 'Flag ConAgra contingency before next shared lot arrives',  route: '/network',   module: 'Network View'   },
        { id: 'crew',     label: 'Full L2+ crew coverage',  short: 'Crew',      delta: +1.8, note: 'Nakamura team at full cert level across shift',       action: 'Document coverage pattern — share as Salina benchmark',   route: '/operator',  module: 'Operator View'  },
        { id: 'variance', label: 'Oven D1 temp variance',   short: 'Oven D1',   delta: -0.5, note: 'Slight undershoot at shift start · self-corrected',  action: 'Log in maintenance calendar for preventive inspection',    route: '/readiness', module: 'Data Readiness' },
      ],
    },
    day: {
      baseline: 80.5, actual: 83.2,
      narrative: 'held above 83% through both shifts — D2 startup slower than D1',
      drivers: [
        { id: 'crew',     label: 'Nakamura team · full coverage',  short: 'Crew',       delta: +1.8, note: 'Full L2+ coverage held AM and PM · no substitutions needed',     action: 'Document crew model as replication template for Salina',    route: '/operator',  module: 'Operator View'  },
        { id: 'supplier', label: 'Clean supplier inputs',           short: 'Supplier',   delta: +1.4, note: 'No ConAgra lot holds — second clean day this week',               action: 'Flag incoming TS-9840 lot for trace verification on arrival', route: '/network',   module: 'Network View'   },
        { id: 'variance', label: 'Line D2 startup delay',           short: 'D2 delay',   delta: -0.5, note: 'D2 came up 9 min late · compressed PM production window',        action: 'Add D2 startup checklist to PM shift briefing',             route: '/shift',     module: 'ShiftIQ'        },
      ],
    },
    week: {
      baseline: 80.0, actual: 86.5,
      narrative: 'exceeded the 86% target — highest-performing plant in the network this week',
      drivers: [
        { id: 'crew',     label: 'Crew consistency — Nakamura team',  short: 'Crew',      delta: +3.2, note: 'Full L2+ coverage 6 of 7 days · zero cert substitutions all week', action: 'Export crew model as network benchmark — Salina to adopt',  route: '/operator',  module: 'Operator View'  },
        { id: 'supplier', label: 'ConAgra lots — zero interruptions', short: 'Supplier',  delta: +2.5, note: 'No holds, no trace gaps, no delivery delays this week',            action: 'Monitor next lot arrival — maintain contingency flag',       route: '/network',   module: 'Network View'   },
        { id: 'variance', label: 'Oven D1 variance resolved',         short: 'Oven D1',   delta: +0.8, note: 'Mid-week calibration eliminated the recurring temp undershoot',   action: 'Schedule preventive calibration every 2 weeks going forward', route: '/readiness', module: 'Data Readiness' },
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
          <line x1={padL} x2={svgW - padR} y1={yOf(v)} y2={yOf(v)} stroke="#CAC2B6" strokeWidth="0.5" />
          <text x={padL - 4} y={yOf(v) + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}</text>
        </g>
      ))}
      <line x1={padL} x2={svgW - padR + 6} y1={yOf(attr.target)} y2={yOf(attr.target)} stroke="#C4920A" strokeWidth="0.75" strokeDasharray="4,3" opacity="0.72" />
      <text x={svgW - padR + 8} y={yOf(attr.target) + 3} fontSize="7.5" fill="#C4920A" opacity="0.8">Target</text>
      {steps.map((step, i) => {
        if (i === 0) return null
        const prev = steps[i - 1]
        return <line key={`c${i}`} x1={xOf(i - 1) + barW} x2={xOf(i)} y1={yOf(prev.value)} y2={yOf(prev.value)} stroke="#B8B0A4" strokeWidth="0.75" strokeDasharray="2,2" />
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
        const color   = isBase ? '#686058' : isTotal ? '#0A0906' : isNeg ? '#C43820' : '#3A8A5A'
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
            <text x={x + barW / 2} y={svgH - 5} fontSize="7" fill="#686058" textAnchor="middle">
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
        <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">{b.metric}</div>
        <div className="flex items-baseline gap-2">
          <span className="display-num text-[28px] font-bold text-ink leading-none">{b.score}</span>
          <span className={`font-body text-[11px] font-medium ${b.deltaDir === 'up' ? 'text-ok' : 'text-danger'}`}>
            {b.deltaDir === 'up' ? '↑' : '↓'} {b.delta}
          </span>
        </div>
      </div>
      {/* Percentile bar */}
      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 bg-rule2 rounded-full overflow-hidden mb-1.5">
          <div className="absolute inset-y-0 left-0 rounded-full bg-ink/15" style={{ width: `${b.percentile}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-ochre" style={{ left: `${b.percentile}%` }} />
        </div>
        <div className="font-body text-ghost text-[10px]">{b.percentile}th percentile · {b.total} plants</div>
      </div>
      {/* Peers */}
      {b.peers?.length > 0 && (
        <div className="flex-shrink-0 space-y-0.5 w-36">
          {b.peers.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="font-body text-ghost text-[10px] truncate">{p.name}</span>
              <span className="font-body font-medium text-ink text-[10px] tabular-nums">{p.value}</span>
            </div>
          ))}
        </div>
      )}
      {/* Insight */}
      {b.insight && (
        <div className="font-body text-ok text-[10px] flex-shrink-0 w-40 leading-snug">{b.insight}</div>
      )}
    </div>
  )
}

// ── Accordion module ──────────────────────────────────────────────────────────

function Module({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-rule2 bg-stone">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-stone2 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-body font-medium text-ink text-[12px]">{title}</span>
          {badge && (
            <span className="font-body text-ghost text-[10px] px-2 py-0.5 bg-stone2 border border-rule2 rounded-btn flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={11} className="text-ghost flex-shrink-0 ml-3" />
          : <ChevronDown size={11} className="text-ghost flex-shrink-0 ml-3" />}
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

  const toggleCompare = (id) =>
    setCompare(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleExport = () => {
    setExportState('loading')
    setTimeout(() => setExportState('done'), 1500)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Scope bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-2.5 border-b border-rule2 bg-stone flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-body text-ghost text-[10px]">Plant</span>
          <div className="relative">
            <select value={scopePlant} onChange={e => setScopePlant(e.target.value)}
              className="appearance-none font-body font-medium text-ink text-[12px] bg-stone2 border border-rule2 pl-3 pr-6 py-1 focus:outline-none focus:border-ochre cursor-pointer">
              {PLANTS_META.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-ghost pointer-events-none" />
          </div>
        </div>
        <div className="w-px h-3.5 bg-rule2" />
        <div className="flex items-center gap-2">
          <span className="font-body text-ghost text-[10px]">Grain</span>
          <div className="relative">
            <select value={timeGrain} onChange={e => setTimeGrain(e.target.value)}
              className="appearance-none font-body font-medium text-ink text-[12px] bg-stone2 border border-rule2 pl-3 pr-6 py-1 focus:outline-none focus:border-ochre cursor-pointer">
              {GRAINS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-ghost pointer-events-none" />
          </div>
        </div>
        <div className="w-px h-3.5 bg-rule2" />
        <div className="flex items-center gap-2">
          <span className="font-body text-ghost text-[10px]">Compare</span>
          {STRIP_BASE.filter(p => p.id !== scopePlant).map(p => (
            <button key={p.id} type="button" onClick={() => toggleCompare(p.id)}
              className={`font-body text-[10px] px-2 py-0.5 border rounded-btn transition-colors ${
                compare.includes(p.id) ? 'bg-ink text-stone border-ink' : 'border-rule2 text-ghost hover:text-muted'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-body text-ghost text-[10px]">{facility.name} · Apr 16, 2026</span>
          <button type="button" onClick={handleExport} disabled={exportState === 'loading'}
            className="flex items-center gap-1.5 font-body text-[11px] text-ghost px-3 py-1.5 border border-rule2 hover:border-ink/30 hover:text-muted transition-colors disabled:opacity-50">
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
              className={`flex-1 flex items-center justify-between px-5 py-2.5 border-r border-rule2 last:border-r-0 border-b-2 transition-all text-left ${
                isActive ? 'border-b-ochre bg-stone' : 'border-b-transparent hover:bg-stone3'
              } ${dimmed ? 'opacity-45' : ''}`}>
              <div>
                <div className="font-body text-ghost text-[10px] mb-0.5">{p.code} · {p.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className={`display-num text-[22px] font-bold leading-none ${atTgt ? 'text-ok' : 'text-warn'}`}>{p.oee}%</span>
                  <span className={`font-body text-[10px] font-medium ${p.delta >= 0 ? 'text-ok' : 'text-danger'}`}>
                    {p.delta >= 0 ? '+' : ''}{p.delta}pp
                  </span>
                </div>
              </div>
              <div className={`font-body text-[10px] ${atTgt ? 'text-ok' : 'text-warn'}`}>
                {atTgt ? 'At target' : `${+(p.target - p.oee).toFixed(1)}pp below ${p.target}%`}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-8 py-8">

          {/* ── Attribution hero ─────────────────────────────────────────── */}
          <section className="mb-8">
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-5">
              {attr.line} · OEE Attribution · {GRAINS.find(g => g.id === timeGrain)?.label}
            </div>

            <div className="flex items-start gap-8 mb-5">
              <div>
                <div className="display-num text-[64px] font-bold text-ink leading-none">{attr.actual}%</div>
                <div className="font-body text-ghost text-[11px] mt-1">Actual OEE</div>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className={`display-num text-[24px] font-bold leading-none ${totalDelta >= 0 ? 'text-ok' : 'text-danger'}`}>
                    {totalDelta >= 0 ? '+' : ''}{totalDelta}pp
                  </span>
                  <span className="font-body text-ghost text-[12px]">above {attr.baseline}% baseline</span>
                  <span className={`font-body text-[11px] font-medium px-2.5 py-0.5 rounded-btn flex items-center gap-1.5 ${
                    atTarget ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'
                  }`}>
                    {atTarget
                      ? <><Check size={10} strokeWidth={2.5} />At target</>
                      : `${+(attr.target - attr.actual).toFixed(1)}pp below ${attr.target}% target`}
                  </span>
                </div>
                <div className="font-body text-ink2 text-[13px] leading-snug">
                  {attr.plant} {attr.line} {attr.narrative}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-6">
              <span className="font-body text-ghost text-[10px] mr-1">Biggest drivers:</span>
              {topDrivers.map(d => (
                <span key={d.id} className={`font-body text-[11px] font-medium px-2.5 py-0.5 rounded-btn ${
                  d.delta >= 0 ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'
                }`}>
                  {d.delta >= 0 ? '+' : ''}{d.delta}pp {d.label}
                </span>
              ))}
            </div>

            <div className="border border-rule2 bg-stone px-4 pt-4 pb-2">
              <WaterfallChart attr={attr} />
            </div>
          </section>

          {/* ── Recovery table ───────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Recovery actions</div>
            <div className="border border-rule2 bg-stone divide-y divide-rule2">
              <div className="grid px-5 py-2 bg-stone2" style={{ gridTemplateColumns: '1.1fr 1fr 116px' }}>
                <span className="font-body text-ghost text-[10px]">Driver</span>
                <span className="font-body text-ghost text-[10px] pl-5">Recommended action</span>
                <span className="font-body text-ghost text-[10px] text-right">Module</span>
              </div>
              {attr.drivers.map(d => (
                <div key={d.id}
                  className={`grid items-start px-5 py-3.5 border-l-2 ${d.delta >= 0 ? 'border-l-ok/30' : 'border-l-danger/40'}`}
                  style={{ gridTemplateColumns: '1.1fr 1fr 116px' }}>
                  <div>
                    <div className="font-body font-medium text-ink text-[12px]">{d.label}</div>
                    <div className="font-body text-ghost text-[10px] mt-0.5">{d.note}</div>
                  </div>
                  <div className="font-body text-ink2 text-[11px] pl-5 leading-snug pt-0.5">{d.action}</div>
                  <div className="flex justify-end self-start pt-1">
                    <Link to={d.route}
                      className="flex items-center gap-1 font-body text-muted text-[10px] hover:text-ink transition-colors">
                      {d.module} <ArrowRight size={9} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px bg-rule2 mb-8" />

          {/* ── Supporting intelligence ───────────────────────────────────── */}
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Supporting intelligence</div>
          <div className="space-y-px">

            <Module title="Intervention ROI" badge="$312K protected · 47 interventions · Q2 2026" defaultOpen>
              <div className="bg-ok/[0.02] border-b border-rule2 px-5 py-4 flex items-baseline gap-6">
                <div>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-1">Value protected · Q2 2026</div>
                  <div className="flex items-baseline gap-2">
                    <span className="display-num text-[40px] leading-none text-ok">$312K</span>
                    <span className="font-body text-ok text-[11px]">+$47K vs Q1</span>
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
                        <div className="font-body text-ghost text-[9px] uppercase tracking-[0.08em] mb-1">{m.label}</div>
                        <div className="display-num text-[20px] leading-none mb-0.5" style={{ color: c }}>{m.value}</div>
                        <div className="font-body text-ghost text-[10px] mb-1.5">{m.sub}</div>
                        <div className="h-[3px] bg-rule2">
                          <div className="h-full" style={{ width: `${m.bar * 100}%`, background: c, opacity: 0.7 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Module>

            {/* ── AI Decision Intelligence ─────────────────────────────── */}
            <Module title="AI Decision Intelligence" badge="Agent Control · this shift" defaultOpen>
              {(() => {
                const totalDecisions = agentConfigData.agents.reduce((n, a) => n + (a.pendingActions?.length ?? 0), 0)
                const complianceDecisions = agentConfigData.agents.filter(a => a.isComplianceCategory).reduce((n, a) => n + (a.pendingActions?.length ?? 0), 0)
                const avgDwellSec = Math.round(interventionSummary.avgDwellTimeMs / 1000)
                const lowDwellCount = interventions.filter(e => e.dwellTimeMs > 0 && e.dwellTimeMs < 5000).length
                const decisionBars = [
                  { label: 'Critical',  approved: 1, overridden: 0, deferred: 0, color: 'var(--color-danger)' },
                  { label: 'High',      approved: 2, overridden: 1, deferred: 0, color: 'var(--color-warn)' },
                  { label: 'Medium',    approved: 3, overridden: 1, deferred: 1, color: 'var(--color-ghost)' },
                ]
                return (
                  <div>
                    {/* Stat grid */}
                    <div className="grid grid-cols-4 gap-px bg-rule2 border-b border-rule2">
                      {[
                        { label: 'Decisions this shift', val: String(totalDecisions), tone: 'text-ink' },
                        { label: 'Compliance-category', val: String(complianceDecisions), tone: 'text-warn' },
                        { label: 'Avg dwell — high', val: `${avgDwellSec}s`, tone: avgDwellSec >= 15 ? 'text-ok' : avgDwellSec >= 5 ? 'text-warn' : 'text-danger' },
                        { label: 'Low-dwell exposure', val: String(lowDwellCount), tone: lowDwellCount > 0 ? 'text-danger' : 'text-ok' },
                      ].map(({ label, val, tone }) => (
                        <div key={label} className="bg-stone px-5 py-3.5">
                          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">{label}</div>
                          <div className={`display-num text-[24px] leading-none ${tone}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Decision distribution by consequence */}
                    <div className="px-5 py-4 border-b border-rule2">
                      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Decision distribution by consequence</div>
                      <div className="space-y-2">
                        {decisionBars.map(d => {
                          const total = d.approved + d.overridden + d.deferred
                          return (
                            <div key={d.label} className="flex items-center gap-3">
                              <span className="font-body text-ghost text-[10px] w-14 flex-shrink-0">{d.label}</span>
                              <div className="flex-1 h-3 bg-rule2 flex overflow-hidden">
                                {d.approved > 0 && <div className="h-full bg-ok/60" style={{ width: `${(d.approved/total)*100}%` }} />}
                                {d.overridden > 0 && <div className="h-full bg-ghost/40" style={{ width: `${(d.overridden/total)*100}%` }} />}
                                {d.deferred > 0 && <div className="h-full bg-stone3" style={{ width: `${(d.deferred/total)*100}%` }} />}
                              </div>
                              <span className="font-body text-ghost text-[9px] w-4 text-right">{total}</span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-4 mt-2">
                          {[{ label: 'Approved', color: 'bg-ok/60' }, { label: 'Overridden', color: 'bg-ghost/40' }, { label: 'Deferred', color: 'bg-stone3' }].map(l => (
                            <span key={l.label} className="flex items-center gap-1.5 font-body text-ghost text-[9px]">
                              <span className={`w-2 h-2 ${l.color} flex-shrink-0`} />{l.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="font-body text-ghost text-[10px]">Approval rate 62% · Override rate 25% · Deferred 13%</span>
                      <Link to="/agents" className="flex items-center gap-1 font-body text-ghost text-[10px] hover:text-ink transition-colors">
                        <ArrowRight size={10} />View Agent Control
                      </Link>
                    </div>
                  </div>
                )
              })()}
            </Module>

            {/* ── Impact Attribution ───────────────────────────────────────── */}
            <Module title="Impact Attribution" badge={`${interventionSummary.total} interventions · ${Math.round(interventionSummary.avgAttributionConfidence * 100)}% avg confidence`} defaultOpen>
              {(() => {
                const positiveCount = interventions.filter(e => e.outcomeClassification === 'positive').length
                const unclearCount  = interventions.filter(e => e.outcomeClassification === 'unclear').length
                const negativeCount = interventions.filter(e => e.outcomeClassification === 'negative' || e.outcomeClassification === 'harmful').length
                const confirmRate   = Math.round((interventionSummary.operatorConfirmed / interventionSummary.total) * 100)
                const avgConf       = Math.round(interventionSummary.avgAttributionConfidence * 100)
                return (
                  <div>
                    {/* Stat grid */}
                    <div className="grid grid-cols-3 gap-px bg-rule2 border-b border-rule2">
                      {[
                        { label: 'Positive outcomes', val: `${positiveCount}/${interventionSummary.total}`, tone: 'text-ok' },
                        { label: 'Avg attribution', val: `${avgConf}%`, tone: avgConf >= 70 ? 'text-ok' : avgConf >= 50 ? 'text-warn' : 'text-danger' },
                        { label: 'Operator confirmation', val: `${confirmRate}%`, tone: confirmRate >= 60 ? 'text-ok' : 'text-warn' },
                        { label: 'Auto-executed', val: String(interventionSummary.autoExecuted), tone: 'text-ochre' },
                        { label: 'Reversed', val: String(interventionSummary.reversed), tone: interventionSummary.reversed > 0 ? 'text-warn' : 'text-ghost' },
                        { label: 'Low-dwell risk', val: String(interventionSummary.lowDwellDecisions), tone: interventionSummary.lowDwellDecisions > 0 ? 'text-danger' : 'text-ok' },
                      ].map(({ label, val, tone }) => (
                        <div key={label} className="bg-stone px-5 py-3.5">
                          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">{label}</div>
                          <div className={`display-num text-[24px] leading-none ${tone}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Outcome distribution bar */}
                    <div className="px-5 py-4 border-b border-rule2">
                      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Outcome distribution</div>
                      <div className="h-4 bg-rule2 flex overflow-hidden mb-2">
                        {positiveCount > 0 && <div className="h-full bg-ok/70" style={{ width: `${(positiveCount/interventionSummary.total)*100}%` }} />}
                        {unclearCount > 0  && <div className="h-full bg-ochre/60" style={{ width: `${(unclearCount/interventionSummary.total)*100}%` }} />}
                        {negativeCount > 0 && <div className="h-full bg-danger/60" style={{ width: `${(negativeCount/interventionSummary.total)*100}%` }} />}
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: `Positive (${positiveCount})`, color: 'bg-ok/70'     },
                          { label: `Unclear (${unclearCount})`,   color: 'bg-ochre/60'  },
                          { label: `Negative (${negativeCount})`, color: 'bg-danger/60' },
                        ].map(l => (
                          <span key={l.label} className="flex items-center gap-1.5 font-body text-ghost text-[9px]">
                            <span className={`w-2 h-2 ${l.color} flex-shrink-0`} />{l.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="font-body text-ghost text-[10px]">Attribution confidence reflects causal certainty. Values below 60% indicate confounding factors.</span>
                      <Link to="/impact" className="flex items-center gap-1 font-body text-ghost text-[10px] hover:text-ink transition-colors">
                        <ArrowRight size={10} />View ImpactLoop
                      </Link>
                    </div>
                  </div>
                )
              })()}
            </Module>

            <Module title="CAPA Register" badge={`${closedCount} closed · ${openCount} open · ${overdueCount} overdue`} defaultOpen>
              <div className="divide-y divide-rule2">
                {[
                  { label: 'Closed',        val: closedCount,  bar: closedCount / (closedCount + openCount), tone: 'ok',     sub: 'This quarter',          bg: '' },
                  { label: 'Open',          val: openCount,    bar: openCount / 12,                          tone: openCount > 2 ? 'warn' : 'ok', sub: 'Active queue', bg: '' },
                  { label: 'Overdue',       val: overdueCount, bar: overdueCount / 5,                        tone: overdueCount > 0 ? 'danger' : 'ok', sub: 'Past due date', bg: overdueCount > 0 ? 'bg-danger/[0.025]' : '' },
                  { label: 'Closure rate',  val: '78%',        bar: 0.78,                                    tone: 'warn',   sub: '71st pct. · unlocks at 82%', bg: '' },
                ].map(({ label, val, bar, tone, sub, bg }) => {
                  const c = tone === 'ok' ? 'var(--color-ok)' : tone === 'warn' ? 'var(--color-warn)' : 'var(--color-danger)'
                  const borderL = tone === 'danger' ? 'border-l-danger/50' : tone === 'warn' ? 'border-l-warn/30' : 'border-l-ok/30'
                  return (
                    <div key={label} className={`grid items-center px-5 py-3 border-l-2 ${bg} ${borderL}`}
                      style={{ gridTemplateColumns: '140px 1fr 56px 180px' }}>
                      <div className="font-body text-[11px] font-medium text-ink">{label}</div>
                      <div className="pr-6">
                        <div className="h-[3px] bg-rule2 relative">
                          {label === 'Closure rate' && (
                            <div className="absolute top-1/2 -translate-y-1/2 w-px h-[8px] bg-warn/50" style={{ left: '82%' }} />
                          )}
                          <div className="h-full" style={{ width: `${Math.min(bar, 1) * 100}%`, background: c, opacity: 0.75 }} />
                        </div>
                      </div>
                      <div className="display-num text-[18px] leading-none tabular-nums" style={{ color: c }}>{val}</div>
                      <div className="font-body text-ghost text-[10px] text-right">{sub}</div>
                    </div>
                  )
                })}
              </div>
            </Module>

            <Module title="Q2 Goals" badge={`${onTrackCount} of ${goalsData.length} on track · Jun 30 deadline`} defaultOpen>
              <div className="grid grid-cols-3 divide-x divide-rule2">
                {goalsData.map(g => {
                  const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
                  const toneColor = onTrack ? 'var(--color-ok)' : 'var(--color-warn)'
                  return (
                    <div key={g.id} className={`px-5 py-4 ${!onTrack ? 'bg-warn/[0.02]' : 'bg-stone'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-body text-ghost text-[9px] uppercase tracking-[0.08em]">{g.label}</div>
                        <span className="font-mono text-[9px] text-ghost tabular-nums">T−46d</span>
                      </div>
                      <div className="display-num text-[32px] font-bold leading-none mb-0.5" style={{ color: toneColor }}>
                        {g.current}{g.unit}
                      </div>
                      <div className="font-body text-ghost text-[10px] mb-2">
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

            <Module title="Industry Benchmarks" badge={`${benchmarks.length} metrics · vs 100 comparable plants`}>
              {/* Column headers */}
              <div className="grid px-5 py-2 bg-stone2 border-b border-rule2"
                style={{ gridTemplateColumns: '1fr 1fr 56px 56px 160px' }}>
                {['Metric', 'Percentile position (0–100)', 'Score', 'Rank', 'Delta'].map(h => (
                  <div key={h} className="font-body text-ghost text-[9px] uppercase tracking-[0.08em]">{h}</div>
                ))}
              </div>
              {/* Shared percentile registry — all metrics on the same 0-100 axis */}
              {benchmarks.map((b, i) => {
                const toneColor = b.deltaDir === 'up' ? 'var(--color-ok)' : 'var(--color-warn)'
                const bg = b.deltaDir === 'down' && b.percentile < 50 ? 'bg-warn/[0.02]' : ''
                const borderL = b.deltaDir === 'down' ? 'border-l-warn/40' : 'border-l-ok/30'
                return (
                  <div key={i} className={`grid items-center px-5 py-3 border-b border-rule2/50 border-l-2 ${bg} ${borderL}`}
                    style={{ gridTemplateColumns: '1fr 1fr 56px 56px 160px' }}>
                    <div className="font-body text-ink text-[11px] font-medium pr-4 leading-snug">{b.metric}</div>
                    <div className="pr-6">
                      <div className="relative h-[4px] bg-rule2">
                        {/* Median reference at 50th */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-px h-[10px] bg-ghost/30" style={{ left: '50%' }} />
                        {/* Your position */}
                        <div className="absolute inset-y-0 left-0" style={{ width: `${b.percentile}%`, background: toneColor, opacity: 0.75 }} />
                        {/* Percentile dot */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full border border-stone"
                          style={{ left: `${b.percentile}%`, transform: 'translate(-50%, -50%)', background: toneColor }} />
                      </div>
                    </div>
                    <div className="display-num text-[16px] tabular-nums leading-none" style={{ color: toneColor }}>{b.score}</div>
                    <div className="font-mono text-[11px] text-ghost tabular-nums">{b.percentile}th</div>
                    <div className="font-body text-[10px] text-ghost">{b.delta}</div>
                  </div>
                )
              })}
              <div className="px-5 py-2 bg-stone2 border-t border-rule2 flex items-center gap-2">
                <div className="w-px h-[8px] bg-ghost/30 flex-shrink-0" />
                <span className="font-body text-ghost text-[9px]">Median reference · 50th percentile</span>
              </div>
            </Module>

            <Module title="Network Intelligence" badge="2 of 4 plants connected · 3 needed for signals">
              {/* Column headers */}
              <div className="grid px-5 py-2 bg-stone2 border-b border-rule2"
                style={{ gridTemplateColumns: '1fr 120px 80px 80px' }}>
                {['Signal', 'Plants', 'Confidence', 'Status'].map(h => (
                  <div key={h} className="font-body text-ghost text-[9px] uppercase tracking-[0.08em]">{h}</div>
                ))}
              </div>
              {/* Active signals */}
              {[
                { label: 'Plants in network', note: 'Salina Campus · Wichita Plant active', plants: 'SL-04 · KS-09', conf: 100, status: 'Active', tone: 'ok', locked: false },
                { label: 'Shared supplier exposure', note: 'ConAgra and ADM on overlapping lots', plants: 'Both', conf: 87, status: 'Active', tone: 'warn', locked: false },
                { label: 'Cross-plant supplier scorecards', note: 'ConAgra reliability across all plants — updated weekly', plants: '3 needed', conf: 0, status: 'Locked', tone: 'muted', locked: true },
                { label: 'Network OEE benchmarks (live)', note: 'Real-time percentile vs. plant network', plants: '3 needed', conf: 0, status: 'Locked', tone: 'muted', locked: true },
                { label: 'Predictive delivery risk alerts', note: '"ConAgra delays at KS-02 → Line 4 scrap spikes within 48h"', plants: '3 needed', conf: 0, status: 'Locked', tone: 'muted', locked: true },
              ].map((s, i) => {
                const toneColor = s.tone === 'ok' ? 'var(--color-ok)' : s.tone === 'warn' ? 'var(--color-warn)' : 'var(--color-ghost)'
                return (
                  <div key={i}
                    className={`grid items-center px-5 py-3 border-b border-rule2/50 border-l-2 ${s.locked ? 'opacity-40 border-l-transparent' : s.tone === 'warn' ? 'border-l-warn/40' : 'border-l-ok/30'}`}
                    style={{ gridTemplateColumns: '1fr 120px 80px 80px' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        {s.locked && <Lock size={9} strokeWidth={2} className="text-ghost flex-shrink-0" />}
                        <div className="font-body text-[11px] font-medium text-ink">{s.label}</div>
                      </div>
                      <div className="font-body text-ghost text-[10px]">{s.note}</div>
                    </div>
                    <div className="font-mono text-[10px] text-ghost">{s.plants}</div>
                    <div>
                      {!s.locked && (
                        <div className="h-[3px] bg-rule2">
                          <div className="h-full" style={{ width: `${s.conf}%`, background: toneColor, opacity: 0.75 }} />
                        </div>
                      )}
                      {!s.locked && <div className="font-mono text-[9px] tabular-nums mt-0.5" style={{ color: toneColor }}>{s.conf}%</div>}
                    </div>
                    <div className="font-body text-[10px]" style={{ color: toneColor }}>{s.status}</div>
                  </div>
                )
              })}
              <div className="px-5 py-2 bg-stone2 border-t border-rule2">
                <span className="font-body text-ghost text-[9px]">Locked signals activate at 3 connected plants · Topeka Plant (KS-02) not yet onboarded</span>
              </div>
            </Module>

            <Module title="Model History" badge="82% accuracy · 28 shifts · Line 4">
              <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {[
                    { label: 'Pilot running',    value: '28 shifts · Line 4'                  },
                    { label: 'Current accuracy', value: '82% · trending up', color: 'text-ok' },
                    { label: 'Last retrained',   value: 'Apr 2 · 14 shifts ago'               },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="font-body text-ghost text-[10px] mb-0.5">{label}</div>
                      <div className={`font-body font-medium text-[12px] ${color || 'text-ink'}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <p className="font-body text-ghost text-[10px] leading-relaxed">
                  Every actioned finding and dismissed pattern contributes to the model. At 300 shifts, Line 4 accuracy is expected to reach 88–91%. Cross-plant intelligence activates at 3 connected plants.
                </p>
              </div>
            </Module>

          </div>

          <footer className="mt-10 pt-5 border-t border-rule2 flex items-center justify-between">
            <span className="font-body text-ghost text-[10px]">Takorin Total Intelligence · {facility.name}</span>
            <span className="font-body text-ghost text-[10px]">Data through Apr 16, 2026 · 06:42</span>
          </footer>

        </div>
      </div>
    </div>
  )
}
