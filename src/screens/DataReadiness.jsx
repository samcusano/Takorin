import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { readinessData } from '../data'
import { useAppState } from '../context/AppState'
import { HoldButton, Btn } from '../components/UI'
import { Check, AlertTriangle, ChevronDown, ChevronUp, Zap } from 'lucide-react'

// ── Resolution queue data ─────────────────────────────────────────────────────

const CLUSTER_A = {
  type: 'cluster',
  id: 'cluster-a',
  label: 'Supplier data normalization block',
  severity: 'critical',
  combinedGain: 18,
  gainLabel: '+18 readiness · unlocks FSMA export',
  why: 'Both issues trace to a single root cause — ERP sync introduced mismatched field formats across supplier records and CTE events. Resolving together prevents re-occurrence and restores cross-plant traceability.',
  memberKeys: ['conflict-0', 'conflict-1'],
  memberLabels: [
    { key: 'conflict-0', label: 'Supplier lot normalization conflict' },
    { key: 'conflict-1', label: 'CTE traceability format mismatch' },
  ],
  totalPoints: 14,
  detectedAgo: '14h ago',
  systemsImpacted: ['ERP', 'SupplierIQ', 'FSMA 204 export'],
  confidenceDrop: 18,
  unlocks: ['FSMA export certification', 'SupplierIQ high-confidence mode'],
  blockedBy: null,
  aiAssessment: {
    text: 'Root cause originates from ConAgra lot formatting variance introduced after the last ERP sync update. Both naming conflicts trace to the same upstream schema change — resolving one without the other will regenerate the error on the next sync cycle.',
    confidence: 92,
  },
  fixSequence: [
    { step: 'Validate ERP schema mappings against current supplier lot format', duration: '8 min' },
    { step: 'Reconcile supplier lot aliases across MES and ERP ingredient master', duration: '9 min' },
    { step: 'Regenerate CTE lineage references and verify FSMA 204 export', duration: '5 min' },
  ],
  estimatedMinutes: 22,
  autoEligible: false,
  riskForecast: [
    { hours: 12, consequence: 'FSMA export failure likely — traceability chain incomplete' },
    { hours: 24, consequence: 'SupplierIQ confidence may fall below operational threshold' },
    { hours: 48, consequence: 'Cross-plant lot tracing unavailable during FDA audit window' },
  ],
}

const ISSUE_CTX = {
  type: 'issue',
  id: 'ctx-0',
  key: 'ctx-0',
  label: 'Oven B — SKU context gap',
  severity: 'high',
  points: 12,
  gainLabel: '+12 readiness · restores ShiftIQ CCP accuracy',
  detectedAgo: '11 days ago',
  systemsImpacted: ['ShiftIQ CCP-3', 'Model context layer', 'Oven B risk signals'],
  confidenceDrop: 12,
  unlocks: ['ShiftIQ CCP accuracy', 'Oven B risk signal reliability'],
  blockedBy: null,
  action: 'Add SKU profiles',
  aiAssessment: {
    text: 'Oven B has operated without SKU-to-temperature profiles for 11 days. The model is generating false positives at 23% above baseline. GF-Flatbread and Pepperoni are the highest-priority profiles to add — they account for 78% of Oven B runtime.',
    confidence: 89,
  },
  fixSequence: [
    { step: 'List active SKUs running through Oven B from production schedule', duration: '5 min' },
    { step: 'Define target temperature range per SKU from production specs', duration: '12 min' },
    { step: 'Upload profiles to context layer and verify ShiftIQ readings update', duration: '5 min' },
  ],
  estimatedMinutes: 22,
  autoEligible: true,
  autoSafeReason: [
    'Deterministic mapping exists from production specs',
    'No audit conflict detected in current shift',
    'Prior approval pattern matches this SKU class',
  ],
  riskForecast: [
    { hours: 12, consequence: 'ShiftIQ CCP evaluations remain unreliable for Oven B' },
    { hours: 24, consequence: 'Model confidence in Oven B signals may fall below 70%' },
  ],
}

const ISSUE_SCADA = {
  type: 'issue',
  id: 'scada',
  key: 'scada',
  label: 'SCADA feed degraded — Oven B',
  severity: 'moderate',
  points: 4,
  permanent: true,
  gainLabel: '+4 readiness · requires maintenance',
  detectedAgo: '2h 14m ago',
  systemsImpacted: ['SCADA sensor network', 'Oven B data pipeline', 'Model confidence'],
  confidenceDrop: 4,
  unlocks: [],
  blockedBy: 'Maintenance ticket MT-2604-019',
  aiAssessment: {
    text: 'Intermittent packet loss on the Oven B SCADA pipeline — likely a hardware fault on the Zone 3 network switch. Maintenance ticket MT-2604-019 is tracking this. No automated resolution is possible from this interface.',
    confidence: 78,
  },
  fixSequence: [
    { step: 'Contact maintenance team — reference MT-2604-019', duration: 'External' },
    { step: 'Verify pipeline restoration via SCADA admin panel', duration: '5 min' },
    { step: 'Confirm model confidence recovery after stabilization', duration: '~30 min' },
  ],
  estimatedMinutes: null,
  autoEligible: false,
  riskForecast: [
    { hours: 8,  consequence: 'Oven B confidence penalty increases from −4 to −8' },
    { hours: 24, consequence: 'Extended downtime may trigger compliance flag in audit log' },
  ],
}

const ISSUE_ERP = {
  type: 'issue',
  id: 'erp',
  key: 'erp',
  label: 'ERP ingredient map incomplete',
  severity: 'moderate',
  points: 6,
  gainLabel: '+6 readiness · improves traceability coverage',
  detectedAgo: '3 days ago',
  systemsImpacted: ['ERP ingredient master', 'Supplier lot database', 'FSMA traceability'],
  confidenceDrop: 6,
  unlocks: ['Full ingredient chain-of-custody', 'Supplier linkage for FSMA 204'],
  blockedBy: null,
  action: 'Map ingredient names',
  aiAssessment: {
    text: '14 ingredient records in ERP lack supplier linkage — introduced during the April 9 ingredient master migration. Without these links, chain-of-custody traceability is incomplete for FSMA 204 reporting.',
    confidence: 84,
  },
  fixSequence: [
    { step: 'Run ERP ingredient audit to identify all unlinked records', duration: '10 min' },
    { step: 'Map each ingredient to the correct supplier record using lot intake data', duration: '15 min' },
    { step: 'Verify linkage in the next ingredient import cycle', duration: '5 min' },
  ],
  estimatedMinutes: 30,
  autoEligible: false,
  riskForecast: [
    { hours: 24, consequence: 'Traceability gap persists through next regulatory cycle' },
    { hours: 72, consequence: 'FSMA 204 audit export may flag incomplete ingredient provenance' },
  ],
}

const ISSUE_TRACE = {
  type: 'issue',
  id: 'traceability',
  key: 'traceability',
  label: 'Supplier lot traceability incomplete',
  severity: 'high',
  points: 8,
  gainLabel: '+8 readiness · restores FSMA lot chain',
  detectedAgo: '6 days ago',
  systemsImpacted: ['Supplier lot intake', 'FSMA 204 traceability module', 'SupplierIQ'],
  confidenceDrop: 8,
  unlocks: ['Complete lot chain-of-custody', 'FSMA 204 export readiness'],
  blockedBy: null,
  action: 'Add lot metadata',
  aiAssessment: {
    text: '3 incoming lots from ConAgra and ADM are missing required chain-of-custody metadata — specifically harvest/production date and handler certification number. These fields are mandatory for FSMA 204 compliance.',
    confidence: 91,
  },
  fixSequence: [
    { step: 'Contact ConAgra and ADM to request missing metadata for open lots', duration: 'External' },
    { step: 'Update the lot intake form to require all mandatory fields', duration: '10 min' },
    { step: 'Validate a sample lot trace end-to-end through the traceability module', duration: '15 min' },
  ],
  estimatedMinutes: null,
  autoEligible: false,
  riskForecast: [
    { hours: 12, consequence: 'Affected lots cannot be included in FSMA 204 traceability report' },
    { hours: 48, consequence: 'FDA inspection may flag lot provenance gaps if unresolved' },
  ],
}

const ISSUE_CHECK = {
  type: 'issue',
  id: 'checklists',
  key: 'checklists',
  label: 'Checklist items unsynced with MES',
  severity: 'moderate',
  points: 4,
  gainLabel: '+4 readiness · closes operator-to-MES gap',
  detectedAgo: '9 days ago',
  systemsImpacted: ['ShiftIQ checklist', 'MES workflow engine'],
  confidenceDrop: 4,
  unlocks: ['ShiftIQ-to-MES verification loop', 'Startup check auditability'],
  blockedBy: null,
  action: 'Map checklist steps',
  aiAssessment: {
    text: '3 startup checklist items in ShiftIQ have no corresponding MES workflow mapping — operator sign-off is logged but cannot be verified against machine-side completion. These items were added during the March ShiftIQ update and were never linked to MES.',
    confidence: 96,
  },
  fixSequence: [
    { step: 'Identify the 3 unlinked checklist items in ShiftIQ admin', duration: '5 min' },
    { step: 'Match each item to the corresponding MES workflow step', duration: '10 min' },
    { step: 'Test the sync and confirm items update MES state on completion', duration: '5 min' },
  ],
  estimatedMinutes: 20,
  autoEligible: true,
  autoSafeReason: [
    'Mapping is deterministic — exact MES step identifiers are known',
    'No audit conflict — both systems agree on the checklist items',
    'Zero production impact during sync',
  ],
  riskForecast: [
    { hours: 24, consequence: 'Operator sign-offs remain unverifiable against MES for these 3 items' },
  ],
}

// ── Trend sparkline ───────────────────────────────────────────────────────────

const TREND_DAYS = [
  { day: 'M', delta: +1 },
  { day: 'T', delta: +2 },
  { day: 'W', delta: +3 },
  { day: 'T', delta: +1 },
  { day: 'F', delta: +2 },
  { day: 'S', delta: 0  },
  { day: 'T', delta: -3, current: true },
]

function TrendChart() {
  const w = 224, h = 52, padT = 6, padB = 16, padL = 4, padR = 4
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const maxAbs  = 4
  const barW    = Math.floor(chartW / TREND_DAYS.length) - 3
  const baseline = padT + chartH / 2
  const xOf = (i) => padL + i * (chartW / TREND_DAYS.length) + (chartW / TREND_DAYS.length - barW) / 2
  const hOf = (d) => Math.max(2, Math.abs(d) / maxAbs * (chartH / 2))

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="7-day readiness trend: +6 net this week, -3 today from ERP mismatch">
      {/* Baseline */}
      <line x1={padL} x2={w - padR} y1={baseline} y2={baseline} stroke="#CAC2B6" strokeWidth="0.5" />
      {TREND_DAYS.map((d, i) => {
        const x    = xOf(i)
        const barH = hOf(d.delta)
        const isPos = d.delta >= 0
        const barY  = isPos ? baseline - barH : baseline
        const color = d.current
          ? (d.delta < 0 ? '#C43820' : '#3A8A5A')
          : (isPos ? '#3A8A5A' : '#C43820')
        const opacity = d.current ? 0.9 : 0.5
        return (
          <g key={i}>
            <rect x={x} y={barY} width={barW} height={barH} fill={color} opacity={opacity} rx="1" />
            <text x={x + barW / 2} y={h - 3} fontSize="7.5" fill={d.current ? '#686058' : '#B8B0A4'}
              textAnchor="middle" fontWeight={d.current ? '600' : '400'}>{d.day}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Left rail: Readiness Instrument ──────────────────────────────────────────

const ALL_SCORED_ISSUES = [
  { key: 'conflict-0', points: 7 },
  { key: 'conflict-1', points: 7 },
  { key: 'ctx-0',      points: 12 },
  { key: 'erp',        points: 6 },
  { key: 'traceability', points: 8 },
  { key: 'checklists', points: 4 },
]

function ReadinessInstrument({ score, resolved }) {
  const zone     = score >= 75 ? 'Clear' : score >= 55 ? 'Moderate risk' : 'Blocked'
  const zoneText = score >= 75 ? 'text-ok' : score >= 55 ? 'text-warn' : 'text-danger'

  const totalGain = ALL_SCORED_ISSUES
    .filter(i => !resolved[i.key])
    .reduce((s, i) => s + i.points, 0)

  const projected     = Math.min(100, score + totalGain)
  const shiftIQConf   = resolved['ctx-0'] ? 84 : 72
  const supplierIQConf= (resolved['conflict-0'] && resolved['conflict-1']) ? 91 : resolved['conflict-0'] ? 71 : 58
  const fsmaBlocked   = !resolved['conflict-0'] || !resolved['conflict-1']

  const moduleRows = [
    { label: 'ShiftIQ confidence',    value: `${shiftIQConf}%`,    ok: shiftIQConf >= 75 },
    { label: 'SupplierIQ confidence', value: `${supplierIQConf}%`, ok: supplierIQConf >= 75 },
    { label: 'FSMA traceability',     value: fsmaBlocked ? 'At risk' : 'Clear', ok: !fsmaBlocked, danger: fsmaBlocked },
  ]

  return (
    <div className="px-5 pt-5 pb-4 border-b border-rule2 flex-shrink-0">
      <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Data Readiness</div>

      {/* Score */}
      <div className="flex items-baseline gap-3 mb-1">
        <span key={score} className={`display-num text-[64px] leading-none score-tick ${zoneText}`}>{score}</span>
        <div className="pb-1">
          <div className={`font-body font-semibold text-[12px] ${zoneText}`}>{zone}</div>
        </div>
      </div>

      {/* Projected */}
      {totalGain > 0 ? (
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="font-body text-ghost text-[10px]">Projected after queued fixes:</span>
          <span className="display-num text-[13px] font-bold text-ok">{projected}</span>
          <span className="font-body text-ok text-[10px]">(+{totalGain})</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mb-4">
          <Check size={10} strokeWidth={2.5} className="text-ok" />
          <span className="font-body text-ok text-[10px]">All scored gaps resolved</span>
        </div>
      )}

      {/* Module confidence */}
      <div className="space-y-1.5 mb-4">
        {moduleRows.map(m => (
          <div key={m.label} className="flex items-baseline justify-between">
            <span className="font-body text-ghost text-[10px]">{m.label}</span>
            <span className={`display-num text-[11px] font-bold tabular-nums ${m.danger ? 'text-danger' : m.ok ? 'text-ok' : 'text-warn'}`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="border-t border-rule2 pt-3">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="display-num text-[11px] font-bold text-ok">+6</span>
            <span className="font-body text-ghost text-[10px]">this week</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="display-num text-[11px] font-bold text-danger">−3</span>
            <span className="font-body text-ghost text-[9px]">ERP mismatch</span>
          </div>
        </div>
        <TrendChart />
      </div>
    </div>
  )
}

// ── Left rail: Resolution Queue ───────────────────────────────────────────────

function QueueClusterRow({ cluster, resolved, selected, onSelect }) {
  const allResolved = cluster.memberKeys.every(k => resolved[k])
  const isSelected  = selected === cluster.id
  return (
    <button type="button" onClick={() => onSelect(cluster.id)}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 border-l-2 transition-colors ${
        isSelected        ? 'border-l-ochre bg-ochre/[0.06]'
        : allResolved     ? 'border-l-ok opacity-40'
        : 'border-l-warn bg-warn/[0.02] hover:bg-stone2'
      }`}>
      {/* Cluster badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`font-body text-[9px] px-1.5 py-px rounded-btn font-semibold uppercase tracking-wider ${
          allResolved ? 'bg-ok/10 text-ok' : 'bg-ochre/15 text-ochre'
        }`}>
          {allResolved ? 'Resolved' : 'High impact cluster'}
        </span>
      </div>
      <div className={`font-body font-medium text-[12px] leading-snug mb-1 ${allResolved ? 'text-ghost line-through' : 'text-ink'}`}>
        {cluster.label}
      </div>
      {!allResolved && (
        <>
          <div className="font-body text-ochre text-[10px] mb-1.5">Resolve together → {cluster.gainLabel}</div>
          <div className="space-y-0.5">
            {cluster.memberLabels.map((m, i) => (
              <div key={m.key} className="flex items-center gap-1.5">
                <span className="font-body text-ghost text-[10px]">{i + 1}.</span>
                <span className={`font-body text-[10px] ${resolved[m.key] ? 'text-ok line-through' : 'text-muted'}`}>{m.label}</span>
                {resolved[m.key] && <Check size={8} strokeWidth={2.5} className="text-ok" />}
              </div>
            ))}
          </div>
        </>
      )}
    </button>
  )
}

function QueueIssueRow({ item, resolved, selected, onSelect }) {
  const isResolved = !item.permanent && resolved[item.key]
  const isSelected = selected === item.id
  const borderColor = isSelected   ? 'border-l-ochre'
    : isResolved   ? 'border-l-ok'
    : item.severity === 'high' ? 'border-l-danger'
    : item.permanent ? 'border-l-warn'
    : 'border-l-rule2'
  return (
    <button type="button" onClick={() => onSelect(item.id)}
      className={`w-full text-left px-4 py-3 border-b border-rule2 border-l-2 transition-colors ${borderColor} ${
        isSelected ? 'bg-ochre/[0.06]' : isResolved ? 'opacity-40' : 'hover:bg-stone2'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-body font-medium text-[11px] leading-snug ${isResolved ? 'text-ghost line-through' : 'text-ink'}`}>
            {item.label}
          </div>
          {item.permanent && !isResolved && (
            <div className="font-body text-warn text-[10px] mt-0.5">Needs maintenance</div>
          )}
          {isResolved && <div className="font-body text-ok text-[10px] mt-0.5">Resolved</div>}
        </div>
        {!isResolved && (
          <span className={`display-num text-[11px] font-bold tabular-nums flex-shrink-0 ${
            item.permanent ? 'text-ghost/50' : 'text-ok'
          }`}>
            +{item.points}
          </span>
        )}
      </div>
      {item.blockedBy && !isResolved && (
        <div className="font-body text-ghost text-[9px] mt-1">Blocked by: {item.blockedBy}</div>
      )}
    </button>
  )
}

function ResolutionQueue({ selected, onSelect, resolved }) {
  const [advisoryOpen, setAdvisoryOpen] = useState(false)
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
        <span className="font-body text-ghost text-[10px] uppercase tracking-widest">AI Resolution Queue</span>
      </div>

      {/* Cluster */}
      <QueueClusterRow cluster={CLUSTER_A} resolved={resolved} selected={selected} onSelect={onSelect} />

      {/* Individual issues */}
      <div className="px-4 py-1.5 border-b border-rule2 bg-stone2 flex-shrink-0">
        <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Individual issues</span>
      </div>
      <QueueIssueRow item={ISSUE_CTX}   resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_TRACE} resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_ERP}   resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_CHECK} resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_SCADA} resolved={resolved} selected={selected} onSelect={onSelect} />

      {/* Advisory */}
      <button type="button" onClick={() => setAdvisoryOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 border-b border-rule2 bg-stone2 hover:bg-stone3 transition-colors">
        <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Advisory · no score impact</span>
        {advisoryOpen ? <ChevronUp size={10} className="text-ghost" /> : <ChevronDown size={10} className="text-ghost" />}
      </button>
      {advisoryOpen && ADVISORY_ITEMS.map(a => (
        <div key={a.key} className="px-4 py-2.5 border-b border-rule2 border-l-2 border-l-rule2">
          <div className="font-body text-muted text-[11px]">{a.label}</div>
          <div className="font-body text-ghost text-[10px] mt-0.5">{a.detail}</div>
        </div>
      ))}
    </div>
  )
}

// ── Right workspace components ─────────────────────────────────────────────────

function ResolutionFeedback({ feedback, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="flex-shrink-0 px-8 py-4 border-b-2 border-b-ok/30 bg-ok/[0.04] slide-in">
      <div className="flex items-center gap-2 mb-3">
        <Check size={14} strokeWidth={2.5} className="text-ok flex-shrink-0" />
        <span className="font-body font-semibold text-ok text-[13px]">{feedback.label} — resolved</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Readiness', from: feedback.prevScore, to: feedback.newScore, unit: '', gain: true },
          { label: 'ShiftIQ confidence', from: `${feedback.prevShiftIQ}%`, to: `${feedback.newShiftIQ}%`, gain: feedback.newShiftIQ > feedback.prevShiftIQ },
          { label: 'SupplierIQ confidence', from: `${feedback.prevSupplierIQ}%`, to: `${feedback.newSupplierIQ}%`, gain: feedback.newSupplierIQ > feedback.prevSupplierIQ },
        ].map(r => (
          <div key={r.label}>
            <div className="font-body text-ghost text-[10px] mb-1">{r.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="display-num text-[14px] text-ghost tabular-nums">{r.from}</span>
              <span className="font-body text-ghost text-[10px]">→</span>
              <span className={`display-num text-[18px] font-bold tabular-nums ${r.gain ? 'text-ok' : 'text-ink'}`}>{r.to}</span>
            </div>
          </div>
        ))}
      </div>
      {feedback.downgradedCount > 0 && (
        <div className="font-body text-ok/80 text-[10px] mt-2.5">
          {feedback.downgradedCount} dependent {feedback.downgradedCount === 1 ? 'issue' : 'issues'} downgraded from Critical → Warning
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">{children}</div>
  )
}

function WorkspacePanel({ item, isCluster, resolved, onResolve, onResolveCluster }) {
  const [confirming, setConfirming] = useState(false)
  const [autoConfirming, setAutoConfirming] = useState(false)

  const isResolved = isCluster
    ? item.memberKeys.every(k => resolved[k])
    : (!item.permanent && resolved[item.key])

  const severityColor = item.severity === 'critical' ? 'text-danger'
    : item.severity === 'high' ? 'text-danger'
    : item.severity === 'moderate' ? 'text-warn'
    : 'text-ghost'

  const severityLabel = item.severity === 'critical' ? 'Critical'
    : item.severity === 'high' ? 'High'
    : item.severity === 'moderate' ? 'Moderate'
    : 'Low'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] px-8 py-6 space-y-7">

        {/* Issue context */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isCluster && <span className="font-body text-[10px] px-1.5 py-px bg-ochre/15 text-ochre rounded-btn font-semibold uppercase tracking-wider">Cluster</span>}
            <span className={`font-body text-[10px] font-medium ${severityColor}`}>{severityLabel}</span>
            {item.detectedAgo && <span className="font-body text-ghost text-[10px]">· Detected {item.detectedAgo}</span>}
            {isResolved && <span className="font-body text-ok text-[10px] flex items-center gap-1"><Check size={10} strokeWidth={2.5} />Resolved</span>}
          </div>
          <h2 className="font-display font-bold text-ink text-[22px] leading-snug mb-3">{item.label}</h2>
          <div className="grid grid-cols-3 gap-4">
            {item.systemsImpacted?.length > 0 && (
              <div>
                <div className="font-body text-ghost text-[10px] mb-1">Systems impacted</div>
                <div className="font-body text-muted text-[11px]">{item.systemsImpacted.join(' · ')}</div>
              </div>
            )}
            {item.confidenceDrop > 0 && (
              <div>
                <div className="font-body text-ghost text-[10px] mb-1">Confidence degradation</div>
                <div className="display-num text-[16px] font-bold text-danger">−{item.confidenceDrop}%</div>
              </div>
            )}
            {item.unlocks?.length > 0 && (
              <div>
                <div className="font-body text-ghost text-[10px] mb-1">Unlocks</div>
                <div className="space-y-0.5">
                  {item.unlocks.map(u => (
                    <div key={u} className="font-body text-ok text-[10px]">· {u}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {item.blockedBy && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-warn/[0.06] border border-warn/20 rounded-btn">
              <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body text-warn text-[11px]">Blocked by: {item.blockedBy}</span>
            </div>
          )}
          {isCluster && (
            <div className="mt-3 px-3 py-2 bg-stone2 border border-rule2 rounded-btn">
              <div className="font-body text-ghost text-[10px] mb-1">Why grouped</div>
              <div className="font-body text-muted text-[11px] leading-relaxed">{item.why}</div>
            </div>
          )}
        </div>

        {/* AI Assessment */}
        {item.aiAssessment && (
          <div>
            <SectionLabel>AI Assessment</SectionLabel>
            <div className="border border-rule2 bg-stone2 px-4 py-3.5 rounded-btn">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-body text-ink text-[12px] leading-relaxed flex-1">{item.aiAssessment.text}</div>
                <span className="font-mono text-[11px] font-bold text-ochre flex-shrink-0 px-2 py-0.5 bg-ochre/10 rounded-btn">
                  {item.aiAssessment.confidence}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fix Sequencing */}
        {item.fixSequence?.length > 0 && (
          <div>
            <SectionLabel>Recommended resolution order</SectionLabel>
            <div className="border border-rule2 bg-stone divide-y divide-rule2 rounded-btn">
              {item.fixSequence.map((step, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <span className="display-num text-[13px] font-bold text-ghost/60 flex-shrink-0 w-4">{i + 1}</span>
                  <span className="font-body text-ink text-[12px] flex-1">{step.step}</span>
                  <span className="font-mono text-ghost text-[10px] flex-shrink-0">{step.duration}</span>
                </div>
              ))}
              {item.estimatedMinutes && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-stone2">
                  <span className="font-body text-ghost text-[10px]">Estimated completion</span>
                  <span className="font-body text-muted text-[11px] font-medium">{item.estimatedMinutes} minutes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-remediation */}
        {item.autoEligible && !isResolved && (
          <div>
            <SectionLabel>Automatic remediation</SectionLabel>
            <div className="border border-rule2 bg-stone px-4 py-4 rounded-btn">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={12} strokeWidth={2} className="text-ochre flex-shrink-0" />
                <span className="font-body font-semibold text-ink text-[12px]">Eligible for automatic remediation</span>
              </div>
              <div className="space-y-1 mb-4">
                <div className="font-body text-ghost text-[10px] mb-1.5">Safe to auto-resolve because:</div>
                {item.autoSafeReason.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Check size={9} strokeWidth={2.5} className="text-ok flex-shrink-0" />
                    <span className="font-body text-muted text-[10px]">{r}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-rule2 pt-3">
                <div className="font-body text-ghost text-[10px] mb-2">Human confirmation required — action will be logged for audit.</div>
                {autoConfirming ? (
                  <div className="flex gap-2">
                    <Btn variant="primary" onClick={() => { setAutoConfirming(false); onResolve(item.key, item.points, item.label) }}>
                      Confirm automatic reconciliation
                    </Btn>
                    <Btn variant="secondary" onClick={() => setAutoConfirming(false)}>Cancel</Btn>
                  </div>
                ) : (
                  <Btn variant="secondary" onClick={() => setAutoConfirming(true)}>
                    Run automatic reconciliation
                  </Btn>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Risk Forecast */}
        {item.riskForecast?.length > 0 && !isResolved && (
          <div>
            <SectionLabel>Projected risk if unresolved</SectionLabel>
            <div className="space-y-2">
              {item.riskForecast.map(r => (
                <div key={r.hours} className="flex items-start gap-4 px-4 py-3 border border-rule2 bg-stone rounded-btn">
                  <div className="flex-shrink-0 text-right w-14">
                    <div className="display-num text-[14px] font-bold text-muted tabular-nums">{r.hours}h</div>
                  </div>
                  <div className="font-body text-muted text-[11px] leading-snug">{r.consequence}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution action */}
        {!isResolved && !item.permanent && (
          <div className="border-t border-rule2 pt-6">
            {isCluster ? (
              <>
                <div className="font-body text-ghost text-[10px] mb-3">Resolving this cluster closes {item.memberKeys.length} issues and adds +{item.totalPoints} pts readiness.</div>
                {confirming ? (
                  <div className="flex gap-2">
                    <Btn variant="primary" onClick={() => { setConfirming(false); onResolveCluster(item) }}>Confirm resolution</Btn>
                    <Btn variant="secondary" onClick={() => setConfirming(false)}>Cancel</Btn>
                  </div>
                ) : (
                  <HoldButton label={`Hold to resolve cluster — +${item.totalPoints} pts readiness`}
                    holdLabel="Keep holding to confirm cluster resolution…"
                    doneLabel="Cluster resolved"
                    duration={2000} tone="ok"
                    onConfirm={() => onResolveCluster(item)} />
                )}
              </>
            ) : (
              <HoldButton label={`Hold to resolve — ${item.gainLabel}`}
                holdLabel="Keep holding to confirm…"
                doneLabel="Resolved"
                duration={1500} tone="ok"
                onConfirm={() => onResolve(item.key, item.points, item.label)} />
            )}
          </div>
        )}

        {/* Permanent item info */}
        {item.permanent && (
          <div className="border-t border-rule2 pt-6">
            <div className="flex items-center gap-2 px-4 py-3 bg-warn/[0.06] border border-warn/20 rounded-btn">
              <AlertTriangle size={12} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body text-warn text-[11px]">Resolution requires external action — cannot be completed from this interface</span>
            </div>
          </div>
        )}

        {/* Resolved state */}
        {isResolved && (
          <div className="flex items-center gap-2 px-4 py-3 bg-ok/[0.06] border border-ok/20 rounded-btn">
            <Check size={13} strokeWidth={2} className="text-ok flex-shrink-0" />
            <span className="font-body font-medium text-ok text-[12px]">Resolved — downstream systems updating</span>
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyWorkspace() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="font-display font-bold text-ink text-[17px] mb-2">Select an issue to begin</div>
      <div className="font-body text-ghost text-[12px] max-w-[320px] leading-relaxed">
        Choose a cluster or individual issue from the queue. The workspace will show full context, AI assessment, and resolution steps.
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DataReadiness() {
  const { readinessScore: score, setReadinessScore: setScore,
    readinessResolved: resolved, setReadinessResolved: setResolved,
    resolvedConflicts, setResolvedConflicts } = useAppState()

  const [selectedId, setSelectedId] = useState(CLUSTER_A.id)
  const [resolvedFeedback, setResolvedFeedback] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const key = location.state?.highlight
    if (key) {
      if (['conflict-0', 'conflict-1'].includes(key)) setSelectedId(CLUSTER_A.id)
      else if (key === 'ctx-0') setSelectedId(ISSUE_CTX.id)
      else if (key === 'scada') setSelectedId(ISSUE_SCADA.id)
    }
  }, [location.state])

  const captureState = () => ({
    score,
    shiftIQ:    resolved['ctx-0'] ? 84 : 72,
    supplierIQ: (resolved['conflict-0'] && resolved['conflict-1']) ? 91 : resolved['conflict-0'] ? 71 : 58,
  })

  const resolveItem = (key, points, label) => {
    if (resolved[key]) return
    const before = captureState()
    setResolved(p => ({ ...p, [key]: true }))
    setScore(s => Math.min(100, s + points))
    if (key.startsWith('conflict-')) {
      const idx = parseInt(key.split('-')[1], 10)
      setResolvedConflicts(prev => new Set([...prev, idx]))
    }
    const after = {
      shiftIQ:    key === 'ctx-0' ? 84 : before.shiftIQ,
      supplierIQ: (key === 'conflict-0' || key === 'conflict-1') ? 91 : before.supplierIQ,
    }
    setResolvedFeedback({ label, prevScore: before.score, newScore: Math.min(100, before.score + points), prevShiftIQ: before.shiftIQ, newShiftIQ: after.shiftIQ, prevSupplierIQ: before.supplierIQ, newSupplierIQ: after.supplierIQ, downgradedCount: 0 })
  }

  const resolveCluster = (cluster) => {
    const before = captureState()
    let totalPoints = 0
    const newResolved = { ...resolved }
    const pointMap = Object.fromEntries(ALL_SCORED_ISSUES.map(i => [i.key, i.points]))
    cluster.memberKeys.forEach(key => {
      if (!resolved[key]) {
        newResolved[key] = true
        totalPoints += (pointMap[key] || 0)
        if (key.startsWith('conflict-')) {
          const idx = parseInt(key.split('-')[1], 10)
          setResolvedConflicts(prev => new Set([...prev, idx]))
        }
      }
    })
    setResolved(newResolved)
    setScore(s => Math.min(100, s + totalPoints))
    const newSupplierIQ = (newResolved['conflict-0'] && newResolved['conflict-1']) ? 91 : before.supplierIQ
    setResolvedFeedback({ label: cluster.label, prevScore: before.score, newScore: Math.min(100, before.score + totalPoints), prevShiftIQ: before.shiftIQ, newShiftIQ: before.shiftIQ, prevSupplierIQ: before.supplierIQ, newSupplierIQ, downgradedCount: 2 })
  }

  const allItems = [CLUSTER_A, ISSUE_CTX, ISSUE_SCADA, ISSUE_ERP, ISSUE_TRACE, ISSUE_CHECK]
  const selectedItem = allItems.find(i => i.id === selectedId)
  const isCluster = selectedItem?.type === 'cluster'

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left rail */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col overflow-hidden bg-stone">
        <ReadinessInstrument score={score} resolved={resolved} />
        <ResolutionQueue selected={selectedId} onSelect={setSelectedId} resolved={resolved} />
      </div>

      {/* Right workspace */}
      <div className="flex-1 overflow-hidden flex flex-col bg-stone">
        {resolvedFeedback && (
          <ResolutionFeedback feedback={resolvedFeedback} onDismiss={() => setResolvedFeedback(null)} />
        )}
        {selectedItem ? (
          <WorkspacePanel
            item={selectedItem}
            isCluster={isCluster}
            resolved={resolved}
            onResolve={resolveItem}
            onResolveCluster={resolveCluster}
          />
        ) : (
          <EmptyWorkspace />
        )}
      </div>

    </div>
  )
}
