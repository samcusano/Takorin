import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { shiftData, line6Data, wichitaData, denverData, facility } from '../data'
import { useAppState } from '../context/AppState'
import { riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import {
  AlertTriangle, CheckCircle, Brain, Clock, Users, Bot, User,
  Activity, CircleDot, ChevronDown, ChevronUp, ArrowRight, ExternalLink, X, Download,
} from 'lucide-react'
import { interventionSummary, interventions } from '../data/interventions'
import { FilterDropdown, SlidePanel, Btn, SegmentedControl, Checkbox, AnimatedScore, Tabs, SceneHeader, StatusPill } from '../components/UI'
import NetworkView from './NetworkView'

// ─── Before-narratives — one sentence per line describing normal baseline ─────
const LINE_BEFORE = {
  l4: 'Avg OEE 82% over 5 prior shifts · Score was 54 at 06:12 — normal early-shift · Allergen log unsigned but changeover not started',
  l6: 'Avg OEE 88% · All clear for 3 consecutive shifts · B. Petrov crew fully certified at shift start',
  l3: 'Sensor variance within historical range for 14 consecutive shifts · No carry-forward findings at handoff',
  l2: 'Lowest-risk line in Hall A · No findings in 5 shifts · J. Park crew stable for 6 weeks',
  w1: 'Allergen changeover delay is a known AM pattern on this line · Prior 3 shifts scored between 62–68',
  w2: 'Best-performing Wichita line this week · Running clean for 8 consecutive shifts',
  w3: 'PM crew — lighter volume than AM · Typically 5–8 pts lower risk than AM baseline',
  d1: 'Denver pilot week 3 · Model confidence growing with each shift · No open findings in 11 shifts',
  d2: 'Best-performing line across all three plants · T. Reeves crew at 94% certified for 6 weeks',
}

// ─── Shift briefing queue — ranked items from this shift's priority feed ──────
const SHIFT_QUEUE = [
  {
    urgency: 'danger',
    category: 'Agent decision',
    action: 'Tier 3 decision awaiting ratification — Line 4 lot hold',
    note: 'Supplier Intelligence Agent recommends holding Lot TS-8811. Production starts in 1h 46m. Director sign-off required.',
    timeWindow: '1h 46m',
    lot: 'TS-8811',
    route: '/agents',
    routeLabel: 'AgentControl',
    lineId: 'l4',
  },
  {
    urgency: 'danger',
    category: 'FSMA 204',
    action: 'COA not received — ConAgra Lot TS-8811',
    note: 'Certificate of Analysis required before Line 4 production can start. COA request sent 05:47 — no response from ConAgra.',
    timeWindow: '05:47',
    lot: 'TS-8811',
    route: '/supplier',
    routeLabel: 'SupplierIQ',
    lineId: 'l4',
  },
  {
    urgency: 'warn',
    category: 'Delivery',
    action: 'Lot L-0891 delivery delayed 6h — Pepperoni',
    note: 'Expected Apr 18 · Delayed 6h. COA requested and pending. Pre-production compliance hold active.',
    timeWindow: 'Today',
    lot: 'L-0891',
    route: '/supplier',
    routeLabel: 'SupplierIQ',
  },
  {
    urgency: 'warn',
    category: 'Network',
    action: 'TX-11 holding same lot — holds not coordinated',
    note: 'TX-11 also holds Lot TS-8811. Uncoordinated holds create partial recall exposure if one plant releases without the other.',
    timeWindow: 'Today',
    lot: 'TS-8811',
    route: '/agents',
    routeLabel: 'AgentControl',
  },
  {
    urgency: 'ok',
    category: 'Supplier reliability',
    action: 'ConAgra: 3rd COA delay — review threshold reached',
    note: 'Supplier standing: 71. Contract review criteria met. Pattern-based escalation logged by Supplier Intelligence Agent.',
    timeWindow: '06:00',
    route: '/supplier',
    routeLabel: 'SupplierIQ',
  },
  {
    urgency: 'ok',
    category: 'Traceability',
    action: 'CO-5502 shelf life — 18 days remaining',
    note: 'Canola Oil approaching rotation threshold. ADM price +8% — possible sourcing pressure. Submittable to FDA.',
    timeWindow: '06:45',
    lot: 'CO-5502',
    route: '/records',
    routeLabel: 'Record Vault',
  },
  {
    urgency: 'ok',
    category: 'FDA prep',
    action: 'FSMA 204 posture at 62% — 2 lots not submittable',
    note: '2 high-risk lots. 2 of 6 submittable. FDA inspection window: 18 days.',
    timeWindow: '06:45',
    route: '/records',
    routeLabel: 'Record Vault',
  },
]

// ─── Actor mode badge — shows who is executing on a line ─────────────────────
const ACTOR_MODE = { human: 'human', robot: 'robot', hybrid: 'hybrid' }

function ActorBadge({ mode }) {
  if (!mode || mode === 'human') return null
  const cfg = {
    robot:  { Icon: Bot,   label: 'Automated', color: 'var(--color-signal)' },
    hybrid: { Icon: Users, label: 'Hybrid',    color: 'var(--color-deep)'  },
  }[mode]
  if (!cfg) return null
  const { Icon, label, color } = cfg
  return (
    <span className="flex items-center gap-0.5 flex-shrink-0" style={{ color }} aria-label={`${label} mode`} title={`${label} worker mode`}>
      <Icon size={9} strokeWidth={2} aria-hidden="true" />
      <span className="font-body text-micro">{label}</span>
    </span>
  )
}

// ─── Domain assignments ───────────────────────────────────────────────────────
const LINE_AREAS = {
  l4: { area: 'Hall B', areaOrder: 2 },
  l6: { area: 'Hall B', areaOrder: 2 },
  l3: { area: 'Hall A', areaOrder: 1 },
  l2: { area: 'Hall A', areaOrder: 1 },
  w1: { area: 'East Wing', areaOrder: 1 },
  w2: { area: 'East Wing', areaOrder: 1 },
  w3: { area: 'West Wing', areaOrder: 2 },
  d1: { area: 'Main Floor', areaOrder: 1 },
  d2: { area: 'Main Floor', areaOrder: 1 },
}

// ─── Line meta ────────────────────────────────────────────────────────────────

const SALINA_LINE_META = {
  l4: {
    supervisor: 'D. Kowalski', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 18,
    findings: shiftData.findings, sparkline: shiftData.sparkline,
    modelConfidence: 87, modelSignal: 'Oven B sensor data stale — accuracy reduced',
  },
  l6: {
    supervisor: 'B. Petrov', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 18,
    findings: line6Data.findings, sparkline: line6Data.sparkline,
    modelConfidence: 92, modelSignal: 'Staffing certifications fully covered',
  },
  l3: {
    supervisor: 'M. Chen', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 16, findings: [],
    sparkline: [58, 62, 61, 60, 61, 61],
    modelConfidence: 79, modelSignal: 'Sensor variance within historical range',
  },
  l2: {
    supervisor: 'J. Park', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 14, findings: [],
    sparkline: [36, 37, 38, 38, 37, 38],
    modelConfidence: 95, modelSignal: 'All signals within normal bounds',
  },
}

const WICHITA_LINE_META = {
  w1: {
    supervisor: 'R. Vasquez', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 18,
    findings: wichitaData.findings, sparkline: [62, 65, 68, 70, 69, 71],
    modelConfidence: 74, modelSignal: 'Allergen changeover incomplete — accuracy reduced',
  },
  w2: {
    supervisor: 'A. Tran', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 16, findings: [],
    sparkline: [84, 86, 87, 88, 88, 88],
    modelConfidence: 93, modelSignal: 'All signals within normal bounds',
  },
  w3: {
    supervisor: 'P. Nwosu', shiftLabel: 'PM · 14:00–22:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 15, findings: [],
    sparkline: [58, 60, 61, 62, 62, 62],
    modelConfidence: 85, modelSignal: 'Belt D-3 variance within spec — monitoring',
  },
}

const DENVER_LINE_META = {
  d1: {
    supervisor: 'K. Nakamura', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 18,
    findings: denverData.findings, sparkline: [82, 83, 84, 84, 83, 84],
    modelConfidence: 91, modelSignal: 'All signals within normal bounds',
  },
  d2: {
    supervisor: 'T. Reeves', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 16, findings: [],
    sparkline: [89, 90, 91, 91, 91, 91],
    modelConfidence: 94, modelSignal: 'All signals within normal bounds',
  },
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtMinutes(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 44, h = 18
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} aria-hidden="true" className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

function pressureCls(score) {
  if (score >= 75) return 'border-l-[5px] border-l-danger bg-danger/[0.025]'
  if (score >= 60) return 'border-l-[3px] border-l-warn'
  return 'border-l-[2px] border-l-ok/50'
}

function pressureClass(score) {
  return score >= 75 ? 'shadow-card-alert' : ''
}

// ─── Digital Maturity Map ─────────────────────────────────────────────────────

const MATURITY_STAGES = ['Manual', 'Connected', 'Monitored', 'Predictive', 'Autonomous']
const MATURITY_DIMS   = ['Data infrastructure', 'Workforce model', 'Process intelligence', 'Compliance posture']

const MATURITY_BY_PLANT = {
  sl: {
    scores: [3, 3, 3, 3],
    notes: [
      'Real-time sensors on 3 of 4 lines · SCADA gap on Oven B blocking Predictive accuracy',
      'Cert tracking active · hybrid mode configured but not yet deployed on floor',
      '8 AI agents running · shift predictions active · expansion gate under review',
      'FSMA 204 monitored · CAPA engine active · FDA inspection simulation enabled',
    ],
    reachedAt: ['Reached Monitored · Feb 2025', 'Reached Monitored · Jan 2025', 'Reached Monitored · Mar 2025', 'Reached Monitored · Apr 2025'],
    laggingReasons: [null, 'Workforce hybrid certification at 38% deployed — floor rollout pending', null, null],
    nextStep: { action: 'Restore Oven B SCADA sensor feed', lift: 'Unblocks Predictive Maintenance at full accuracy (+11pp model confidence)', route: '/readiness', module: 'Data Readiness', linkLabel: 'Restore Oven B feed in Data Readiness' },
  },
  ks: {
    scores: [2, 3, 2, 2],
    notes: [
      'MES connected · ERP integration partial · no AI-ready data pipeline yet',
      'Hybrid workforce deployed at 94% coverage · cert tracking active across shifts',
      'Manual process monitoring · AI agents not yet onboarded for this plant',
      'SQF certified · FSMA compliance tracked · CAPA engine not yet integrated',
    ],
    reachedAt: ['Reached Connected · Sep 2024', 'Reached Monitored · Nov 2024', 'Reached Connected · Aug 2024', 'Reached Connected · Oct 2024'],
    laggingReasons: ['ERP–MES integration incomplete — AI data pipeline blocked', null, 'AI agents not onboarded — awaiting data pipeline', null],
    nextStep: { action: 'Complete ERP–MES data pipeline integration', lift: 'Enables AI agent deployment at Wichita — mirrors Salina architecture', route: '/readiness', module: 'Data Readiness', linkLabel: 'Integrate ERP–MES in Data Readiness' },
  },
  co: {
    scores: [4, 4, 4, 3],
    notes: [
      'Full sensor coverage · SCADA integrated · real-time lot traceability across all lines',
      'Hybrid crew 94% certified · robot workflow protocols defined · transition active',
      'Predictive Maintenance and Pre-Shift AI live · pilot week 3 · model accuracy 91%',
      'FSMA 204 monitored · compliance automation partial · CAPA evidence still manual',
    ],
    reachedAt: ['Reached Predictive · Jan 2025', 'Reached Predictive · Feb 2025', 'Reached Predictive · Mar 2025', 'Reached Monitored · Dec 2024'],
    laggingReasons: [null, null, null, 'CAPA evidence packaging still manual — automation not yet active'],
    nextStep: { action: 'Activate automated CAPA evidence packaging', lift: 'Closes last gap to Predictive stage across all 4 dimensions', route: '/compliance', module: 'Compliance', linkLabel: 'Set up CAPA packaging in Compliance' },
  },
}

function DigitalMaturityMap({ plantId }) {
  const data = MATURITY_BY_PLANT[plantId] || MATURITY_BY_PLANT.sl
  const avg  = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
  const stageIdx = Math.round(avg) - 1
  const stageName = MATURITY_STAGES[Math.max(0, Math.min(4, stageIdx))]
  const minScore = Math.min(...data.scores)

  return (
    <div className="flex-1 overflow-y-auto page-rise">
      <div className="max-w-[820px] mx-auto px-8 py-8">

        <div className="mb-8">
          <div className="font-body text-muted text-label mb-3">
            Digital maturity · {MATURITY_STAGES.join(' → ')}
          </div>
          <div className="font-display font-bold text-head text-ink leading-snug mb-2">
            This plant is at the <span className="text-signal">{stageName}</span> stage — averaging {avg.toFixed(1)} of 5 across dimensions.
          </div>
          <div className="font-body text-muted text-body leading-relaxed">
            Each dimension tracks independently. Advancing the lowest-scoring dimension first delivers the most compounding lift across agents and output.
          </div>
        </div>

        <div className="space-y-px mb-8">
          {MATURITY_DIMS.map((dim, i) => {
            const score         = data.scores[i]
            const note          = data.notes[i]
            const reachedAt     = data.reachedAt?.[i]
            const laggingReason = data.laggingReasons?.[i]
            const isLagging     = score === minScore
            return (
              <div key={dim} className={`border border-rule2 bg-stone px-5 py-4 ${isLagging ? 'border-l-[3px] border-l-warn' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <div>
                    <span className="font-body font-medium text-ink text-body">{dim}</span>
                    {isLagging && laggingReason && (
                      <div className="font-body text-warn text-label mt-0.5">Lagging — {laggingReason}</div>
                    )}
                    {isLagging && !laggingReason && (
                      <span className="font-body text-warn text-label ml-2">· lagging dimension</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-body text-muted text-label">{MATURITY_STAGES[score - 1]} · stage {score} of 5</div>
                    {reachedAt && <div className="font-body text-muted text-micro mt-0.5">{reachedAt}</div>}
                  </div>
                </div>
                <div className="flex gap-1 mb-2.5">
                  {MATURITY_STAGES.map((stage, j) => {
                    const filled = j < score
                    const active = j === score - 1
                    return (
                      <div key={j} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-[4px] ${active ? 'bg-signal' : filled ? 'bg-ok/60' : 'bg-rule2'}`} />
                        <span className={`font-body text-micro leading-none ${active ? 'text-signal font-medium' : filled ? 'text-ok' : 'text-muted/40'}`}>
                          {stage}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="font-body text-muted text-label leading-snug">{note}</div>
              </div>
            )
          })}
        </div>

        <div className="border border-rule2 border-l-[3px] border-l-signal bg-signal/[0.04] px-5 py-4 mb-6">
          <div className="font-body text-signal text-label font-medium mb-1">Next recommended step</div>
          <div className="font-body font-medium text-ink text-body mb-1">{data.nextStep.action}</div>
          <div className="font-body text-muted text-label mb-3 leading-snug">{data.nextStep.lift}</div>
          <Link to={data.nextStep.route}
            className="flex items-center gap-1.5 font-body text-muted text-label hover:text-ink transition-colors">
            {data.nextStep.linkLabel || `Open ${data.nextStep.module}`} <ArrowRight size={9} />
          </Link>
        </div>

        <div className="flex justify-end mb-4">
          <button type="button"
            className="flex items-center gap-1.5 font-body text-label text-muted hover:text-ink px-3 py-1.5 border border-rule2 hover:border-ink/20 transition-colors">
            <Download size={10} />
            Download maturity report
          </button>
        </div>

        <div className="flex items-center gap-6">
          {[
            { label: 'Completed',       color: 'bg-ok/60'  },
            { label: 'Current stage',   color: 'bg-signal' },
            { label: 'Not yet reached', color: 'bg-rule2'  },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 font-body text-muted text-label">
              <span className={`w-6 h-[4px] flex-shrink-0 ${l.color}`} />{l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PlantOverview() {
  const navigate = useNavigate()
  const { shiftActed, setShiftActed, currentPlant, agentActions } = useAppState()
  const workerMode = currentPlant?.workerMode ?? 'human'
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [visitedQueue, setVisitedQueue]       = useState(new Set())
  const [mode, setMode]                       = useState('normal')
  const [whatIfScores, setWhatIfScores]       = useState({})
  const [compareSelected, setCompareSelected] = useState([])
  const [zoneFilter, setZoneFilter]           = useState('all')
  const [areaFilter, setAreaFilter]           = useState('all')
  const [findingsFilter, setFindingsFilter]   = useState('all')
  const [plantView, setPlantView]             = useState('lines')

  const isWichita = currentPlant?.id === 'ks'
  const isDenver  = currentPlant?.id === 'co'
  const rawLines  = isDenver ? denverData.lines : isWichita ? wichitaData.lines : shiftData.lines
  const lineMeta  = isDenver ? DENVER_LINE_META : isWichita ? WICHITA_LINE_META : SALINA_LINE_META
  const plantName = currentPlant?.name ?? facility.name

  const effScore = (line) =>
    mode === 'whatif' && whatIfScores[line.id] !== undefined
      ? whatIfScores[line.id]
      : line.score

  const critCount    = rawLines.filter(l => effScore(l) >= 75).length
  const watchCount   = rawLines.filter(l => effScore(l) >= 60 && effScore(l) < 75).length
  const clearCount   = rawLines.filter(l => effScore(l) < 60).length
  const totalWorkers = rawLines.reduce((s, l) => s + (lineMeta[l.id]?.workerCount ?? 0), 0)

  const availableAreas = useMemo(
    () => [...new Set(rawLines.map(l => LINE_AREAS[l.id]?.area).filter(Boolean))].sort(),
    [rawLines]
  )

  const zoneTransitions = rawLines.map(l => {
    const real = l.score
    const proj = effScore(l)
    if (real === proj) return null
    const zone = s => s >= 75 ? 'at-risk' : s >= 60 ? 'watch' : 'clear'
    if (zone(real) === zone(proj)) return null
    return { line: l, from: zone(real), to: zone(proj), delta: proj - real }
  }).filter(Boolean)

  const domainGroups = useMemo(() => {
    const buckets = {}
    rawLines.forEach(line => {
      const area = LINE_AREAS[line.id]?.area ?? 'Other'
      if (!buckets[area]) buckets[area] = []
      buckets[area].push(line)
    })

    return Object.entries(buckets)
      .map(([area, lines]) => {
        const filtered = lines
          .filter(line => {
            const eff  = mode === 'whatif' && whatIfScores[line.id] !== undefined ? whatIfScores[line.id] : line.score
            const pend = lineMeta[line.id]?.findings.filter(f => !shiftActed[f.id]).length ?? 0
            if (zoneFilter === 'risk'  && eff < 75)                return false
            if (zoneFilter === 'watch' && (eff < 60 || eff >= 75)) return false
            if (zoneFilter === 'clear' && eff >= 60)               return false
            if (findingsFilter === 'has'  && pend === 0)           return false
            if (findingsFilter === 'none' && pend > 0)             return false
            return true
          })
          .sort((a, b) => effScore(b) - effScore(a))
        return { area, lines: filtered }
      })
      .filter(g => {
        if (areaFilter !== 'all' && g.area !== areaFilter) return false
        return g.lines.length > 0
      })
      .sort((a, b) => {
        const worst = lines => Math.max(...lines.map(l => effScore(l)))
        const diff  = worst(b.lines) - worst(a.lines)
        if (diff !== 0) return diff
        const aOrd = LINE_AREAS[a.lines[0]?.id]?.areaOrder ?? 99
        const bOrd = LINE_AREAS[b.lines[0]?.id]?.areaOrder ?? 99
        return aOrd - bOrd
      })
  }, [rawLines, lineMeta, shiftActed, zoneFilter, areaFilter, findingsFilter, mode, whatIfScores]) // eslint-disable-line react-hooks/exhaustive-deps

  const allFindings = rawLines.flatMap(line => {
    const meta = lineMeta[line.id]
    if (!meta) return []
    return meta.findings
      .filter(f => !shiftActed[f.id])
      .map(f => ({ ...f, line, meta }))
  }).sort((a, b) => ({ danger: 0, warn: 1 }[a.urgency] ?? 2) - ({ danger: 0, warn: 1 }[b.urgency] ?? 2))

  const compareLines  = rawLines.filter(l => compareSelected.includes(l.id))
  const anyAdjusted   = Object.keys(whatIfScores).length > 0
  const realAvg       = Math.round(rawLines.reduce((s, l) => s + l.score, 0) / rawLines.length)
  const projAvg       = Math.round(rawLines.reduce((s, l) => s + effScore(l), 0) / rawLines.length)
  const activeFilters = [zoneFilter !== 'all', areaFilter !== 'all', findingsFilter !== 'all'].filter(Boolean).length
  const filteredCount = domainGroups.reduce((s, g) => s + g.lines.length, 0)

  const critShiftCount  = SHIFT_QUEUE.filter(q => q.urgency === 'danger').length
  const allCritVisited  = critShiftCount > 0 && SHIFT_QUEUE.filter(q => q.urgency === 'danger').every(q => visitedQueue.has(q.action))
  const pendingShiftCount = SHIFT_QUEUE.filter(q => !visitedQueue.has(q.action)).length
  const plantTone    = critCount > 0 ? 'danger' : watchCount > 0 ? 'warn' : 'ok'
  const worstLine    = rawLines.length ? rawLines.reduce((a, b) => effScore(a) > effScore(b) ? a : b) : null
  const worstArea    = worstLine ? (LINE_AREAS[worstLine.id]?.area ?? '') : ''
  const worstPend    = worstLine ? (lineMeta[worstLine.id]?.findings.filter(f => !shiftActed[f.id]).length ?? 0) : 0
  const plantStatement = critCount > 0
    ? `${worstArea} is driving this shift — ${worstLine?.name} at ${effScore(worstLine)}${worstPend > 0 ? ` with ${worstPend} open finding${worstPend !== 1 ? 's' : ''}` : ''}.`
    : watchCount > 0
    ? `${worstArea} is the area to watch — ${worstLine?.name} at ${effScore(worstLine)}. No immediate escalation required.`
    : 'All lines running clean this shift. No open findings pending.'

  const switchMode = (m) => {
    setMode(prev => prev === m ? 'normal' : m)
    setWhatIfScores({})
    setCompareSelected([])
  }

  const toggleCompare = (id) => setCompareSelected(prev => {
    if (prev.includes(id)) return prev.filter(x => x !== id)
    if (prev.length >= 2) return [prev[1], id]
    return [...prev, id]
  })

  return (<>
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Scene header ─────────────────────────────────────────────────── */}
      <SceneHeader
        module="OVERVIEW"
        context={`${plantName} · April 16`}
        live
        timestamp="06:42"
        metric={realAvg}
        metricLabel="Plant avg risk"
        tone={plantTone}
        statement={plantStatement}
        meta={[
          ...(critCount > 0 ? [{ label: 'At risk', value: String(critCount), color: 'var(--color-danger)' }] : []),
          ...(watchCount > 0 ? [{ label: 'Watch', value: String(watchCount), color: 'var(--color-warn)' }] : []),
          { label: 'Workers on floor', value: String(totalWorkers) },
          { label: 'Lines', value: String(rawLines.length) },
        ]}
      />

      {/* ── View switcher ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-rule2 px-5">
        <Tabs
          tabs={[{ id: 'lines', label: 'Live view' }, { id: 'maturity', label: 'Maturity map' }, { id: 'network', label: 'Network' }]}
          active={plantView}
          onChange={setPlantView}
        />
      </div>

      {plantView === 'network'
        ? <NetworkView />
        : plantView === 'maturity'
        ? <DigitalMaturityMap plantId={currentPlant?.id || 'sl'} />
        : (
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: floor surface ──────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Pulse strip — at-a-glance plant status */}
            <div className="flex-shrink-0 flex border-b border-rule2">
              {[
                { label: 'At risk',  value: critCount,            tone: critCount > 0 ? 'danger' : 'ok',  sub: critCount === 1 ? 'line' : 'lines',  bg: critCount > 0 ? 'bg-danger/[0.03]' : '' },
                { label: 'Watch',    value: watchCount,           tone: watchCount > 0 ? 'warn'   : 'ok',  sub: watchCount === 1 ? 'line' : 'lines', bg: '' },
                { label: 'Findings', value: allFindings.length,   tone: allFindings.length > 0 ? 'warn' : 'ok', sub: 'pending', bg: '' },
                { label: 'Briefing', value: pendingShiftCount, tone: critShiftCount > 0 && !allCritVisited ? 'danger' : 'warn', sub: `${critShiftCount} critical`, bg: '' },
              ].map((cell, i) => (
                <div key={i} className={`flex-1 px-4 py-3 border-r border-rule2 last:border-r-0 ${cell.bg}`}>
                  <div className="font-body text-micro text-muted mb-1">{cell.label}</div>
                  <div className={`display-num text-head font-bold leading-none tabular-nums ${
                    cell.tone === 'danger' ? 'text-danger' : cell.tone === 'warn' ? 'text-warn' : 'text-ok'
                  }`}>{cell.value}</div>
                  <div className="font-body text-muted text-label mt-0.5">{cell.sub}</div>
                </div>
              ))}
            </div>

            {/* Filter strip */}
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-rule2 bg-stone">
              <FilterDropdown
                label="Zone"
                options={[
                  { value: 'all',   label: 'All zones' },
                  { value: 'risk',  label: 'At risk'   },
                  { value: 'watch', label: 'Watch'      },
                  { value: 'clear', label: 'Clear'      },
                ]}
                value={zoneFilter}
                onChange={setZoneFilter}
              />
              <FilterDropdown
                label="Area"
                options={[{ value: 'all', label: 'All areas' }, ...availableAreas.map(a => ({ value: a, label: a }))]}
                value={areaFilter}
                onChange={setAreaFilter}
              />
              <FilterDropdown
                label="Findings"
                options={[
                  { value: 'all',  label: 'All'          },
                  { value: 'has',  label: 'Has findings'  },
                  { value: 'none', label: 'Clear'         },
                ]}
                value={findingsFilter}
                onChange={setFindingsFilter}
              />
              {activeFilters > 0 && (
                <span className="font-body text-muted text-label">{filteredCount} of {rawLines.length} lines</span>
              )}
            </div>

            {/* Floor bar — mode switcher + findings count */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-1.5 border-b border-rule2 bg-stone2">
              <span className="font-body text-micro text-muted">Floor</span>
              {allFindings.length > 0 && (
                <span className="font-body text-micro text-warn flex items-center gap-1">
                  <AlertTriangle size={8} strokeWidth={2} />{allFindings.length} finding{allFindings.length !== 1 ? 's' : ''} pending
                </span>
              )}
              <div className="ml-auto">
                <SegmentedControl
                  options={[{ value: 'normal', label: 'Live' }, { value: 'whatif', label: 'What if' }, { value: 'compare', label: 'Compare' }]}
                  value={mode}
                  onChange={switchMode}
                />
              </div>
            </div>

            {/* What-if cascade preview */}
            {mode === 'whatif' && (
              <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-stone2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-body text-muted text-label">Projected cascade</span>
                  {anyAdjusted && (
                    <button type="button" onClick={() => setWhatIfScores({})}
                      className="font-body text-label text-danger hover:text-ink transition-colors ml-auto">
                      Reset all
                    </button>
                  )}
                </div>
                {!anyAdjusted ? (
                  <span className="font-body text-muted text-label">Drag sliders on tiles to model downstream impact</span>
                ) : zoneTransitions.length > 0 ? (
                  <div className="space-y-1.5">
                    {zoneTransitions.map((t, i) => {
                      const zc = z => z === 'at-risk' ? 'text-danger' : z === 'watch' ? 'text-warn' : 'text-ok'
                      return (
                        <div key={i} className="flex items-center gap-2 font-body text-label">
                          <span className="font-medium text-ink">{t.line.name}</span>
                          <span className="text-muted">moves</span>
                          <span className={zc(t.from)}>{t.from}</span>
                          <span className="text-muted">→</span>
                          <span className={zc(t.to)}>{t.to}</span>
                          <span className={`tabular-nums ${t.delta < 0 ? 'text-ok' : 'text-danger'}`}>
                            ({t.delta > 0 ? '+' : ''}{t.delta})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-5">
                    <span className="font-body text-muted text-label">No zone changes — within existing classification</span>
                    <span className="font-body text-muted text-label">
                      Plant avg:
                      <span className={`font-medium ml-1 ${projAvg > realAvg ? 'text-danger' : projAvg < realAvg ? 'text-ok' : 'text-ink'}`}>
                        {projAvg}
                      </span>
                      <span className="ml-1">(was {realAvg})</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Compare panel */}
            {mode === 'compare' && (
              <div className="flex-shrink-0 border-b border-rule2">
                <div className="px-5 py-1.5 bg-stone3 border-b border-rule2 flex items-center gap-2">
                  <span className="font-body text-muted text-label">
                    {compareLines.length < 2
                      ? `Select ${2 - compareLines.length} more line${2 - compareLines.length !== 1 ? 's' : ''} to compare`
                      : `${compareLines[0].name} vs ${compareLines[1].name}`}
                  </span>
                  {compareLines.length > 0 && (
                    <button type="button" onClick={() => setCompareSelected([])}
                      className="ml-auto font-body text-label text-danger hover:text-ink transition-colors">
                      Clear
                    </button>
                  )}
                </div>
                {compareLines.length === 2 && (
                  <div className="grid grid-cols-2 divide-x divide-rule2">
                    {compareLines.map((line, i) => {
                      const other     = compareLines[1 - i]
                      const meta      = lineMeta[line.id]
                      const otherMeta = lineMeta[other.id]
                      const delta     = line.score - other.score
                      const pend      = meta?.findings.filter(f => !shiftActed[f.id]).length ?? 0
                      const otherPend = otherMeta?.findings.filter(f => !shiftActed[f.id]).length ?? 0
                      const conf      = meta?.modelConfidence ?? 80
                      return (
                        <div key={line.id} className="px-5 py-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-body text-muted text-label mb-0.5">
                                {LINE_AREAS[line.id]?.area ?? ''} · {line.name}
                              </div>
                              <div className="font-body text-muted text-label">{meta?.supervisor}</div>
                            </div>
                            <MiniSparkline data={meta?.sparkline} color={riskBgColor(line.score)} />
                          </div>
                          <div className={`font-display font-bold text-display leading-none tabular-nums mb-0.5 ${riskColorClass(line.score)}`}>
                            <AnimatedScore value={line.score} effect="glow" hero />
                          </div>
                          <div className={`font-body font-medium text-label mb-3 ${
                            delta > 0 ? 'text-danger' : delta < 0 ? 'text-ok' : 'text-muted'
                          }`}>
                            {delta === 0 ? 'Equal score' : `${delta > 0 ? '+' : ''}${delta} vs ${other.name}`}
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <div className="font-body text-muted text-label mb-0.5">Findings</div>
                              <div className={`font-display font-bold text-subhead leading-none ${
                                pend > otherPend ? 'text-warn' : pend < otherPend ? 'text-ok' : 'text-ink'
                              }`}>{pend}</div>
                            </div>
                            <div>
                              <div className="font-body text-muted text-label mb-0.5">Model</div>
                              <div className={`font-display font-bold text-subhead leading-none ${
                                conf >= 90 ? 'text-ok' : conf >= 80 ? 'text-muted' : 'text-warn'
                              }`}>{conf}%</div>
                            </div>
                            <div>
                              <div className="font-body text-muted text-label mb-0.5">Workers</div>
                              <div className="font-display font-bold text-subhead leading-none text-ink">{meta?.workerCount ?? '—'}</div>
                            </div>
                          </div>
                          <div className="h-[3px] bg-rule2 overflow-hidden">
                            <div className="h-full transition-[width] duration-500"
                              style={{
                                width: `${line.score}%`,
                                background: line.score >= 75 ? 'var(--color-danger)' : line.score >= 60 ? 'var(--color-warn)' : 'var(--color-ok)',
                              }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Scrollable grid + cross-line findings */}
            <div className="flex-1 overflow-y-auto page-rise">

              {domainGroups.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-12">
                  <span className="font-body text-muted text-body">No lines match the active filters</span>
                  <button type="button"
                    onClick={() => { setZoneFilter('all'); setAreaFilter('all'); setFindingsFilter('all') }}
                    className="font-body text-label text-signal hover:text-ink transition-colors">
                    Clear filters
                  </button>
                </div>
              ) : (
                domainGroups.map(group => {
                  const worstScore = Math.max(...group.lines.map(l => effScore(l)))
                  const worstZone  = worstScore >= 75 ? 'risk' : worstScore >= 60 ? 'watch' : 'clear'
                  const atRiskN    = group.lines.filter(l => effScore(l) >= 75).length
                  const watchN     = group.lines.filter(l => effScore(l) >= 60 && effScore(l) < 75).length

                  return (
                    <section key={group.area}>
                      <div className="sticky top-0 z-10 flex items-center gap-2.5 px-5 py-2 bg-stone border-b border-t border-rule2">
                        <span className="font-body font-semibold text-ink text-label">{group.area}</span>
                        <span className={`font-body text-label px-1.5 py-0.5 font-medium ${
                          worstZone === 'risk'  ? 'bg-danger/[0.04] text-danger'
                          : worstZone === 'watch' ? 'bg-warn/[0.08] text-warn'
                          : 'bg-ok/[0.07] text-ok'
                        }`}>
                          {worstZone === 'risk' ? 'At risk' : worstZone === 'watch' ? 'Watch' : 'All clear'}
                        </span>
                        {(atRiskN > 0 || watchN > 0) && (
                          <span className="font-body text-muted text-label">
                            {[atRiskN > 0 && `${atRiskN} at risk`, watchN > 0 && `${watchN} watch`].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        <span className="ml-auto font-body text-muted text-label">
                          {group.lines.length} line{group.lines.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div>
                        {group.lines.map((line, idx) => {
                          const meta      = lineMeta[line.id]
                          if (!meta) return null
                          const eff       = effScore(line)
                          const modified  = mode === 'whatif' && whatIfScores[line.id] !== undefined && whatIfScores[line.id] !== line.score
                          const pend      = meta.findings.filter(f => !shiftActed[f.id]).length
                          const isCompSel = compareSelected.includes(line.id)
                          const sliderVal = whatIfScores[line.id] ?? line.score
                          const delta     = sliderVal - line.score

                          return (
                            <div key={line.id}
                              className={`flex flex-col border-b border-rule2 last:border-b-0 ${pressureCls(eff)} ${pressureClass(eff)}`}>
                              <div className="flex items-center">
                                {mode === 'compare' && (
                                  <Checkbox
                                    checked={isCompSel}
                                    onChange={() => toggleCompare(line.id)}
                                    size="lg"
                                    className="ml-4"
                                    aria-label={`Select ${line.name} for comparison`}
                                  />
                                )}
                                <button
                                  type="button"
                                  className={`flex-1 flex items-center gap-3 ${mode === 'compare' ? 'pl-2 pr-4' : 'px-4'} py-2.5 text-left transition-colors ${
                                    mode === 'compare' && isCompSel ? 'bg-signal/[0.03]' : 'hover:bg-stone2/50'
                                  }`}
                                  onClick={() => mode === 'compare' ? toggleCompare(line.id) : navigate(`/shift?line=${line.id}`)}
                                  aria-label={`${line.name} — score ${eff}${mode === 'compare' ? (isCompSel ? ', selected' : ', click to select') : ', open ShiftIQ'}`}
                                  aria-pressed={mode === 'compare' ? isCompSel : undefined}
                                >
                                  <span className="display-num text-label text-muted tabular-nums w-4 text-right flex-shrink-0">{idx + 1}</span>

                                  <div className="w-28 flex-shrink-0">
                                    <div className="font-display font-semibold text-ink text-body leading-none">{line.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-body text-muted text-label truncate">{meta.supervisor}</span>
                                      <ActorBadge mode={workerMode} />
                                    </div>
                                  </div>

                                  <div className="flex-1 relative h-[6px] overflow-hidden">
                                    <div className="absolute inset-0 flex">
                                      <div className="h-full bg-ok/[0.12]"     style={{ width: '60%' }} />
                                      <div className="h-full bg-warn/[0.12]"   style={{ width: '15%' }} />
                                      <div className="h-full bg-danger/[0.12]" style={{ width: '25%' }} />
                                    </div>
                                    <div
                                      className={`absolute left-0 top-0 h-full transition-[width] duration-500 ease-enter ${riskBgColor(eff)}`}
                                      style={{ width: `${eff}%` }}
                                    />
                                    <div
                                      className="absolute top-0 h-full w-px bg-muted/50"
                                      style={{ left: `${meta.modelConfidence}%` }}
                                    />
                                  </div>

                                  <div className="w-14 flex-shrink-0 text-right">
                                    <span
                                      className={`display-num text-head tabular-nums ${riskColorClass(eff)}`}
                                      style={{ transition: 'color 250ms var(--ease-standard)' }}
                                    >{eff}</span>
                                    {modified && (
                                      <span className={`font-body text-label ml-1 tabular-nums ${delta > 0 ? 'text-danger' : 'text-ok'}`}>
                                        {delta > 0 ? '+' : ''}{delta}
                                      </span>
                                    )}
                                  </div>

                                  <div className="w-16 flex-shrink-0 flex items-center justify-end">
                                    {pend > 0
                                      ? <span className="font-body text-label text-warn flex items-center gap-0.5">
                                          <AlertTriangle size={9} strokeWidth={2} />{pend}
                                        </span>
                                      : <span className="font-body text-label text-ok/40 flex items-center gap-0.5">
                                          <CheckCircle size={9} strokeWidth={2} />
                                        </span>
                                    }
                                  </div>

                                  <div className="flex-shrink-0">
                                    <MiniSparkline data={meta.sparkline} color={riskBgColor(eff)} />
                                  </div>
                                </button>

                                {mode === 'whatif' && (
                                  <div className="flex items-center gap-3 px-4 pb-2.5 pt-1.5 border-t border-rule2/40 bg-stone2/40">
                                    <span className="font-body text-muted text-label flex-shrink-0">Real: <span className="font-medium">{line.score}</span></span>
                                    <input
                                      type="range" min={0} max={100} value={sliderVal}
                                      onChange={e => setWhatIfScores(s => ({ ...s, [line.id]: Number(e.target.value) }))}
                                      className="flex-1 cursor-pointer accent-signal"
                                      style={{ height: 2 }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })
              )}

              {/* Cross-line findings feed */}
              <section className="border-t-2 border-rule2 mt-0">
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2 border-b border-rule2 bg-stone2">
                  <span className="font-body font-semibold text-ink text-label">
                    Pending across all lines
                    {allFindings.length > 0 && (
                      <span className="ml-2 font-body text-warn text-label font-normal">
                        {allFindings.length} finding{allFindings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                  {allFindings.length === 0 && (
                    <span className="font-body text-ok text-label flex items-center gap-1">
                      <CheckCircle size={16} strokeWidth={2} />All lines clear
                    </span>
                  )}
                </div>

                {agentActions?.filter(a => a.status !== 'overridden' && a.status !== 'completed').map((action, i) => (
                  <div key={action.id}
                    className="flex items-start gap-4 px-5 py-3.5 border-b border-rule2 bg-deep/[0.04]">
                    <Brain size={14} className="flex-shrink-0 mt-0.5 text-deep" strokeWidth={2} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-body text-label font-medium text-deep">{action.agentName}</span>
                        <span className="font-body text-micro px-1.5 py-px text-deep bg-deep/[0.12] border border-deep/25">
                          {action.status === 'pending-review' ? 'Awaiting review' : 'Active'}
                        </span>
                        <span className="font-body text-micro text-muted">{action.timestamp}</span>
                      </div>
                      <div className="font-body font-medium text-ink text-body leading-snug">{action.action}</div>
                      <div className="font-body text-muted text-label mt-0.5">{action.target} · {action.rationale}</div>
                    </div>
                  </div>
                ))}

                {allFindings.length > 0
                  ? allFindings.map((f, i) => (
                      <button key={i} type="button"
                        onClick={() => setSelectedFinding(f)}
                        className={`w-full text-left flex items-start gap-4 px-5 py-3.5 border-b border-rule2 transition-colors hover:bg-stone2 ${
                          f.urgency === 'danger' ? 'bg-danger/[0.05] hover:bg-danger/[0.1]' : 'bg-warn/[0.05] hover:bg-warn/[0.1]'
                        }`}>
                        <AlertTriangle size={16}
                          className={`mt-0.5 flex-shrink-0 ${f.urgency === 'danger' ? 'text-danger' : 'text-warn'}`}
                          strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <div className="font-body font-medium text-ink text-body leading-snug">{f.title}</div>
                          <div className="font-body text-muted text-label mt-0.5">
                            {f.line.name} · {f.meta.supervisor}
                            {f.meta.minutesRemaining > 0 && (
                              <span className="ml-2 inline-flex items-center gap-1">
                                <Clock size={9} strokeWidth={2} />{fmtMinutes(f.meta.minutesRemaining)} remaining
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  : (
                      <div className="flex items-center gap-3 px-5 py-10">
                        <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
                        <span className="font-body text-muted text-body">All lines running clean — no pending findings</span>
                      </div>
                    )
                }
              </section>

            </div>
          </div>

          {/* ── Right: shift briefing ────────────────────────────────────── */}
          <div className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden border-l border-rule2 bg-stone">

            {/* Rail header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-rule2 bg-stone2">
              <div className="flex items-center justify-between">
                <div className="font-body font-medium text-ink text-body">Shift briefing</div>
                {allCritVisited
                  ? <span className="font-body text-ok text-label flex items-center gap-1"><CheckCircle size={10} strokeWidth={2} />Critical cleared</span>
                  : <span className="font-body text-danger text-label font-medium tabular-nums">{critShiftCount} critical</span>
                }
              </div>
              <div className="font-body text-muted text-label mt-0.5">
                {pendingShiftCount} pending · Apr 16 · AM shift
              </div>
            </div>

            {/* Scrollable queue items */}
            <div className="flex-1 overflow-y-auto">

              {/* Critical — full cards */}
              <div className="pt-3 px-3 space-y-3">
                {SHIFT_QUEUE.filter(q => q.urgency === 'danger').map((item, i) => {
                  const floorLine  = item.lineId ? rawLines.find(l => l.id === item.lineId) : null
                  const floorMeta  = item.lineId ? lineMeta[item.lineId] : null
                  const floorScore = floorLine ? effScore(floorLine) : null
                  const floorPend  = floorMeta ? floorMeta.findings.filter(f => !shiftActed[f.id]).length : 0
                  const visited    = visitedQueue.has(item.action)
                  return (
                    <article key={`crit-${i}`} className="bg-stone border border-rule overflow-hidden">
                      <div className="h-[3px] w-full bg-danger" />
                      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <StatusPill tone="danger">Critical</StatusPill>
                          {item.lot && (
                            <span className="font-body text-micro px-1.5 bg-stone3 text-muted">{item.lot}</span>
                          )}
                        </div>
                        <span className={`font-body text-label tabular-nums font-medium ${visited ? 'text-danger/40' : 'text-danger'}`}>
                          {item.timeWindow}
                        </span>
                      </div>
                      <div className="px-4 pb-3 space-y-1">
                        <div className="font-body text-micro text-muted uppercase tracking-wider">{item.category}</div>
                        <p className={`font-body font-medium text-label leading-snug ${visited ? 'text-muted' : 'text-ink'}`}>{item.action}</p>
                        <p className="font-body text-muted text-label leading-relaxed">{item.note}</p>
                        {floorLine && (
                          <div className="flex items-center gap-2 font-body text-label text-muted pt-0.5">
                            <span>{floorLine.name}</span>
                            <span className={`display-num text-label font-bold tabular-nums ${riskColorClass(floorScore)}`}>{floorScore}</span>
                            {floorPend > 0 && (
                              <span className="flex items-center gap-0.5 text-warn">
                                <AlertTriangle size={8} strokeWidth={2} />{floorPend}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="px-4 pb-3 pt-2 border-t border-rule2/60">
                        <Link to={item.route}
                          onClick={() => setVisitedQueue(p => new Set([...p, item.action]))}
                          className="inline-flex items-center gap-2 font-body font-medium text-label px-3 py-1.5 border border-rule bg-stone2 text-ink hover:bg-stone3 hover:border-rule2 transition-colors rounded-btn">
                          Open {item.routeLabel} <ArrowRight size={10} />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* High — medium rows */}
              {SHIFT_QUEUE.filter(q => q.urgency === 'warn').length > 0 && (
                <div className="mt-3 border-t border-rule2/50">
                  <div className="px-4 pt-2.5 pb-1">
                    <span className="font-body text-micro text-muted font-semibold tracking-wide">HIGH PRIORITY</span>
                  </div>
                  {SHIFT_QUEUE.filter(q => q.urgency === 'warn').map((item, i) => {
                    const visited = visitedQueue.has(item.action)
                    return (
                      <Link key={`high-${i}`} to={item.route}
                        onClick={() => setVisitedQueue(p => new Set([...p, item.action]))}
                        className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2/50 last:border-0 group hover:bg-stone2/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            {item.lot && (
                              <span className="font-body text-micro px-1 bg-stone3 text-muted flex-shrink-0">{item.lot}</span>
                            )}
                            <span className="font-body text-micro text-warn uppercase tracking-wider">{item.category}</span>
                          </div>
                          <div className={`font-body text-label font-medium leading-snug ${visited ? 'text-muted' : 'text-ink'}`}>{item.action}</div>
                          <div className="font-body text-micro text-muted leading-snug mt-0.5">{item.note}</div>
                        </div>
                        {visited
                          ? <CheckCircle size={9} className="text-muted/40 flex-shrink-0 mt-0.5" />
                          : <ArrowRight size={9} className="text-muted group-hover:text-ink flex-shrink-0 transition-colors mt-0.5" />
                        }
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Watch — compact rows */}
              {SHIFT_QUEUE.filter(q => q.urgency === 'ok').length > 0 && (
                <div className="border-t border-rule2/50">
                  <div className="px-4 pt-2.5 pb-1">
                    <span className="font-body text-micro text-muted font-semibold tracking-wide">WATCH</span>
                  </div>
                  {SHIFT_QUEUE.filter(q => q.urgency === 'ok').map((item, i) => {
                    const visited = visitedQueue.has(item.action)
                    return (
                      <Link key={`watch-${i}`} to={item.route}
                        onClick={() => setVisitedQueue(p => new Set([...p, item.action]))}
                        className="flex items-center gap-3 px-4 py-2 border-b border-rule2/40 last:border-0 group hover:bg-stone2/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {item.lot && (
                              <span className="font-body text-micro px-1 bg-stone3 text-muted flex-shrink-0">{item.lot}</span>
                            )}
                            <div className={`font-body text-label leading-snug truncate ${visited ? 'text-muted' : 'text-ink'}`}>{item.action}</div>
                          </div>
                        </div>
                        <ArrowRight size={9} className="text-muted/40 group-hover:text-muted flex-shrink-0 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              )}

            </div>

            {/* Impact footer */}
            <div className="flex-shrink-0 border-t border-rule2 px-4 py-2.5 bg-stone2">
              <div className="font-body text-label text-muted">
                <span className="text-ok font-medium">{interventionSummary.positive}</span>
                {' of '}{interventionSummary.total} interventions positive this month
                {interventionSummary.lowDwellDecisions > 0 && (
                  <span className="text-danger ml-2 inline-flex items-center gap-1">
                    <AlertTriangle size={8} strokeWidth={2} />{interventionSummary.lowDwellDecisions} low-dwell
                  </span>
                )}
              </div>
              <button type="button" onClick={() => navigate('/outcomes')}
                className="mt-1 font-body text-label text-signal hover:text-ink transition-colors flex items-center gap-1">
                See Outcomes <ArrowRight size={9} />
              </button>
            </div>

          </div>

        </div>
        )
      }
    </div>

    {/* ── Finding action drawer ────────────────────────────────────────── */}
    {selectedFinding && (
      <SlidePanel
        title={selectedFinding.title}
        subtitle={`${selectedFinding.line.name} · ${selectedFinding.meta.supervisor} · ${fmtMinutes(selectedFinding.meta.minutesRemaining)} remaining`}
        accentColor={selectedFinding.urgency === 'danger' ? 'var(--color-danger)' : 'var(--color-warn)'}
        onClose={() => setSelectedFinding(null)}
        footer={
          <div className="flex gap-2">
            {!shiftActed[selectedFinding.id] ? (
              <Btn variant="primary" onClick={() => {
                setShiftActed(prev => ({ ...prev, [selectedFinding.id]: true }))
                setSelectedFinding(null)
              }}>
                <CheckCircle size={11} strokeWidth={2} />Acknowledged
              </Btn>
            ) : (
              <span className="font-body text-ok text-label flex items-center gap-1.5 px-1">
                <CheckCircle size={11} strokeWidth={2} />Acknowledged
              </span>
            )}
            <Btn variant="secondary" onClick={() => { navigate(`/shift?line=${selectedFinding.line.id}`); setSelectedFinding(null) }}>
              <ArrowRight size={11} strokeWidth={2} />
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedFinding.desc && (
            <div>
              <div className="font-body text-micro text-muted mb-1.5">Finding</div>
              <p className="font-display text-body text-ink leading-relaxed">{selectedFinding.desc}</p>
            </div>
          )}
          {selectedFinding.evidence && (
            <div>
              <div className="font-body text-micro text-muted mb-1.5">Evidence</div>
              <div className="font-body text-label text-muted bg-stone2 px-3 py-2.5 border-l-2 border-l-rule">{selectedFinding.evidence}</div>
            </div>
          )}
          <div>
            <div className="font-body text-micro text-muted mb-1.5">Current owner</div>
            <div className="font-body text-ink text-body">{selectedFinding.meta.supervisor}</div>
          </div>
          {selectedFinding.recommendedAction && (
            <div>
              <div className="font-body text-micro text-muted mb-1.5">Recommended action</div>
              <p className="font-display text-body text-ink leading-relaxed">{selectedFinding.recommendedAction}</p>
            </div>
          )}
        </div>
      </SlidePanel>
    )}
  </>)
}
