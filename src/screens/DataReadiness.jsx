import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { readinessData } from '../data'
import { useAppState } from '../context/AppState'
import { HoldButton, Btn, SectionHeader, StatusPill, AnimatedScore, Tabs } from '../components/UI'
import { Check, AlertTriangle, ChevronDown, ChevronUp, Zap, Clock, Link2, Layers, Mail } from 'lucide-react'

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
  baseline: 'ERP field matching operating at 98% · Supplier lot name formats aligned across all 14 active records since the May 9 validated sync · FSMA traceability chain intact',
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
  baseline: 'Oven B SKU profiles complete for all active products · ShiftIQ CCP-3 evaluating within ±1% of expected accuracy · No false positives flagged in the prior 30-day window',
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
  baseline: 'Oven B SCADA feed stable at 99.7% uptime over the prior 90 days · Zone 3 network switch serviced during the March maintenance window',
  riskForecast: [
    { hours: 8,  consequence: 'Accuracy impact grows from −4 to −8 if unresolved' },
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
  baseline: 'All 214 ERP ingredient records linked to supplier database · Full chain-of-custody traceability maintained through April 8 before the ingredient master migration',
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
  baseline: 'All ConAgra and ADM lot intake forms complete with required metadata · FSMA 204 traceability chain validated at last compliance review 6 days before this gap appeared',
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
  baseline: 'All 12 ShiftIQ startup checklist items mapped to corresponding MES workflow steps · Operator sign-off verified against machine-side completion since last ShiftIQ update in February',
  riskForecast: [
    { hours: 24, consequence: 'Operator sign-offs remain unverifiable against MES for these 3 items' },
  ],
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
      <div className="font-body text-muted text-label mb-3">Data Readiness</div>

      {/* Score */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`display-num text-score leading-none ${zoneText}`}><AnimatedScore value={score} effect="blur" /></span>
        <div className="pb-1">
          <div className={`font-body font-semibold text-body ${zoneText}`}>{zone}</div>
        </div>
      </div>

      {/* Projected */}
      {totalGain > 0 ? (
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="font-body text-muted text-label">If all issues are resolved:</span>
          <span className="display-num text-base font-bold text-ok">{projected}</span>
          <span className="font-body text-ok text-label">(+{totalGain})</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mb-4">
          <Check size={10} strokeWidth={2.5} className="text-ok" />
          <span className="font-body text-ok text-label">All scored gaps resolved</span>
        </div>
      )}

      {/* Module confidence */}
      <div className="space-y-1.5 mb-4">
        {moduleRows.map(m => (
          <div key={m.label} className="flex items-baseline justify-between">
            <span className="font-body text-muted text-label">{m.label}</span>
            <span className={`display-num text-base font-bold tabular-nums ${m.danger ? 'text-danger' : m.ok ? 'text-ok' : 'text-warn'}`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Week summary */}
      <div className="flex items-baseline justify-between border-t border-rule2 pt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="display-num text-label font-bold text-ok">+6</span>
          <span className="font-body text-muted text-label">this week</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="display-num text-label font-bold text-danger">−3</span>
          <span className="font-body text-muted text-label">today · ERP mismatch</span>
        </div>
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
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 border-l-[3px] transition-colors ${
        isSelected        ? 'border-l-signal bg-signal/[0.06]'
        : allResolved     ? 'border-l-ok opacity-40'
        : 'border-l-warn bg-warn/[0.02] hover:bg-stone2'
      }`}>
      {/* Cluster badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {allResolved
          ? <StatusPill tone="ok">Resolved</StatusPill>
          : <span className="font-body text-label px-1.5 py-px font-semibold bg-signal/15 text-signal">High impact cluster</span>
        }
      </div>
      <div className={`font-body font-medium text-body leading-snug mb-1 ${allResolved ? 'text-muted line-through' : 'text-ink'}`}>
        {cluster.label}
      </div>
      {!allResolved && (
        <>
          <div className="font-body text-signal text-body font-medium mb-1.5">Resolve together → {cluster.gainLabel}</div>
          <div className="space-y-0.5">
            {cluster.memberLabels.map((m, i) => (
              <div key={m.key} className="flex items-center gap-1.5">
                <span className="font-body text-muted text-label">{i + 1}.</span>
                <span className={`font-body text-label ${resolved[m.key] ? 'text-ok line-through' : 'text-muted'}`}>{m.label}</span>
                {resolved[m.key] && <Check size={10} strokeWidth={2.5} className="text-ok" />}
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
  const borderColor = isSelected   ? 'border-l-signal'
    : isResolved   ? 'border-l-ok'
    : item.severity === 'high' ? 'border-l-danger'
    : item.permanent ? 'border-l-warn'
    : 'border-l-rule2'
  return (
    <button type="button" onClick={() => onSelect(item.id)}
      className={`w-full text-left px-4 py-3 border-b border-rule2 border-l-2 transition-colors ${borderColor} ${
        isSelected ? 'bg-signal/[0.06]' : isResolved ? 'opacity-40' : 'hover:bg-stone2'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-body font-medium text-body leading-snug ${isResolved ? 'text-muted line-through' : 'text-ink'}`}>
            {item.label}
          </div>
          {item.permanent && !isResolved && (
            <div className="font-body text-warn text-label mt-0.5">Needs maintenance</div>
          )}
          {isResolved && <div className="font-body text-ok text-label mt-0.5">Resolved</div>}
        </div>
        {!isResolved && (
          <span className={`display-num text-label font-bold tabular-nums flex-shrink-0 ${
            item.permanent ? 'text-muted/50' : 'text-ok'
          }`}>
            +{item.points}
          </span>
        )}
      </div>
      {item.blockedBy && !isResolved && (
        <div className="font-body text-muted text-label mt-1">Blocked by: {item.blockedBy}</div>
      )}
    </button>
  )
}

function ResolutionQueue({ selected, onSelect, resolved }) {
  const [advisoryOpen, setAdvisoryOpen] = useState(false)
  return (
    <div className="flex-1 overflow-y-auto page-blur-in">
      <SectionHeader tone="signal" label="Start here" sub="Highest impact" />

      {/* Cluster */}
      <QueueClusterRow cluster={CLUSTER_A} resolved={resolved} selected={selected} onSelect={onSelect} />

      {/* Individual issues */}
      <SectionHeader label="Other issues" />
      <QueueIssueRow item={ISSUE_CTX}   resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_TRACE} resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_ERP}   resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_CHECK} resolved={resolved} selected={selected} onSelect={onSelect} />
      <QueueIssueRow item={ISSUE_SCADA} resolved={resolved} selected={selected} onSelect={onSelect} />

      {/* Advisory */}
      <button type="button" onClick={() => setAdvisoryOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 border-b border-rule2 bg-stone2 hover:bg-stone3 transition-colors">
        <span className="font-body text-muted text-label">Advisory · no score impact</span>
        {advisoryOpen ? <ChevronUp size={10} className="text-muted" /> : <ChevronDown size={10} className="text-muted" />}
      </button>
      {advisoryOpen && ADVISORY_ITEMS.map(a => (
        <div key={a.key} className="px-4 py-2.5 border-b border-rule2 border-l-2 border-l-rule2">
          <div className="font-body text-muted text-label">{a.label}</div>
          <div className="font-body text-muted text-label mt-0.5">{a.detail}</div>
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
        <span className="font-body font-semibold text-ok text-base">{feedback.label} — resolved</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Readiness', from: feedback.prevScore, to: feedback.newScore, unit: '', gain: true },
          { label: 'ShiftIQ confidence', from: `${feedback.prevShiftIQ}%`, to: `${feedback.newShiftIQ}%`, gain: feedback.newShiftIQ > feedback.prevShiftIQ },
          { label: 'SupplierIQ confidence', from: `${feedback.prevSupplierIQ}%`, to: `${feedback.newSupplierIQ}%`, gain: feedback.newSupplierIQ > feedback.prevSupplierIQ },
        ].map(r => (
          <div key={r.label}>
            <div className="font-body text-muted text-label mb-1">{r.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="display-num text-body text-muted tabular-nums">{r.from}</span>
              <span className="font-body text-muted text-label">→</span>
              <span className={`display-num text-head font-bold tabular-nums ${r.gain ? 'text-ok' : 'text-ink'}`}>{r.to}</span>
            </div>
          </div>
        ))}
      </div>
      {feedback.downgradedCount > 0 && (
        <div className="font-body text-ok/80 text-label mt-2.5">
          {feedback.downgradedCount} dependent {feedback.downgradedCount === 1 ? 'issue' : 'issues'} downgraded from Critical → Warning
        </div>
      )}
    </div>
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
    : 'text-muted'

  const severityLabel = item.severity === 'critical' ? 'Critical'
    : item.severity === 'high' ? 'High'
    : item.severity === 'moderate' ? 'Moderate'
    : 'Low'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] px-8 py-7">

        {/* 1. Status row */}
        <div className="flex items-center gap-3 mb-5">
          {isCluster
            ? <StatusPill
                tone={item.severity === 'critical' || item.severity === 'high' ? 'danger' : item.severity === 'moderate' ? 'warn' : 'muted'}
                icon={AlertTriangle}
              >
                CLUSTER: {severityLabel.toUpperCase()}
              </StatusPill>
            : <StatusPill
                tone={item.severity === 'critical' || item.severity === 'high' ? 'danger' : item.severity === 'moderate' ? 'warn' : 'muted'}
              >
                {severityLabel.toUpperCase()}
              </StatusPill>
          }
          {item.detectedAgo && (
            <span className="flex items-center gap-1.5 font-body text-muted text-label">
              <Clock size={10} className="text-muted flex-shrink-0" />
              Detected {item.detectedAgo}
            </span>
          )}
          {isResolved && (
            <span className="flex items-center gap-1.5 font-body text-ok text-label">
              <Check size={10} strokeWidth={2.5} />Resolved
            </span>
          )}
        </div>

        {/* 2. Hero: title left, accuracy impact right */}
        <div className="flex items-start justify-between gap-6 mb-4">
          <h2 className="font-display font-bold text-ink text-page leading-tight flex-1">{item.label}</h2>
          {item.confidenceDrop > 0 && (
            <div className="flex-shrink-0 text-right">
              <div className="font-body text-muted text-label mb-1">Accuracy impact</div>
              <div className="display-num text-metric font-bold text-danger leading-none">−{item.confidenceDrop}%</div>
            </div>
          )}
        </div>

        {/* 3. System tag chips */}
        {item.systemsImpacted?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {item.systemsImpacted.map(s => (
              <span key={s} className="font-body text-label text-muted bg-stone2 border border-rule2 px-2 py-0.5">{s}</span>
            ))}
          </div>
        )}

        {/* 4. Unlocks */}
        {item.unlocks?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
              <span className="font-body font-semibold text-ok text-body">Unlocks</span>
            </div>
            <div className="space-y-1.5">
              {item.unlocks.map(u => (
                <div key={u} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-ok flex-shrink-0" />
                  <span className="font-body text-ok text-body">{u}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Blocked by */}
        {item.blockedBy && (
          <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-warn/[0.06] border border-warn/20">
            <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
            <span className="font-body text-warn text-label">Blocked by: {item.blockedBy}</span>
          </div>
        )}

        {/* 5.5 The Before — what was expected */}
        {item.baseline && (
          <div className="border border-rule2 bg-stone px-4 py-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
              <span className="font-body font-semibold text-muted text-body">What was expected</span>
            </div>
            <p className="font-body text-muted text-label leading-relaxed">{item.baseline}</p>
          </div>
        )}

        {/* 6. Two-column insight cards */}
        {(isCluster || item.aiAssessment) && (
          <div className={`grid gap-3 mb-7 ${isCluster && item.aiAssessment ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {isCluster && item.why && (
              <div className="border border-rule2 bg-stone2 px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                  <span className="font-body font-semibold text-ink text-body">Why these are linked</span>
                </div>
                <p className="font-body text-muted text-label leading-relaxed">{item.why}</p>
              </div>
            )}
            {item.aiAssessment && (
              <div className="border border-rule2 bg-stone2 px-4 py-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                    <span className="font-body font-semibold text-ink text-body">Why this happened</span>
                  </div>
                  <span className="font-body text-label font-bold text-signal px-2 py-0.5 bg-signal/10 flex-shrink-0 whitespace-nowrap">
                    {item.aiAssessment.confidence}% confidence
                  </span>
                </div>
                <p className="font-body text-muted text-label leading-relaxed">{item.aiAssessment.text}</p>
              </div>
            )}
          </div>
        )}

        {/* 7. Fix sequencing */}
        {item.fixSequence?.length > 0 && (
          <div className="mb-7">
            <div className="font-body text-micro font-semibold text-muted mb-3 tracking-wider">HOW TO FIX THIS</div>
            <div className="space-y-2">
              {item.fixSequence.map((step, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 bg-stone2 border border-rule2">
                  <span className="display-num text-[11px] font-bold text-stone bg-signal w-5 h-5 flex items-center justify-center flex-shrink-0 tabular-nums">{i + 1}</span>
                  <span className="font-body text-ink text-body flex-1 leading-snug">{step.step}</span>
                  <span className="font-body text-muted text-label flex-shrink-0">{step.duration}</span>
                </div>
              ))}
            </div>
            {item.estimatedMinutes && (
              <div className="flex items-center gap-1.5 mt-3 px-1">
                <Clock size={11} className="text-muted flex-shrink-0" />
                <span className="font-body text-muted text-label">Estimated completion: </span>
                <span className="font-body text-ink text-label font-semibold">{item.estimatedMinutes} minutes</span>
              </div>
            )}
          </div>
        )}

        {/* Auto-remediation */}
        {item.autoEligible && !isResolved && (
          <div className="mb-7">
            <SectionHeader tone="muted" label="AI can fix this" className="mb-2" />
            <div className="border border-rule2 bg-stone px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                <span className="font-body font-semibold text-ink text-body">Can be fixed automatically</span>
              </div>
              <div className="space-y-1 mb-4">
                <div className="font-body text-muted text-label mb-1.5">This fix is safe because:</div>
                {item.autoSafeReason.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Check size={9} strokeWidth={2.5} className="text-ok flex-shrink-0" />
                    <span className="font-body text-muted text-label">{r}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-rule2 pt-3">
                <div className="font-body text-muted text-label mb-2">Requires your sign-off — logged for audit.</div>
                {autoConfirming ? (
                  <div className="flex gap-2">
                    <Btn variant="primary" onClick={() => { setAutoConfirming(false); onResolve(item.key, item.points, item.label) }}>
                      Confirm fix
                    </Btn>
                    <Btn variant="secondary" onClick={() => setAutoConfirming(false)}>Cancel</Btn>
                  </div>
                ) : (
                  <Btn variant="secondary" onClick={() => setAutoConfirming(true)}>
                    Apply automatic fix
                  </Btn>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Risk Forecast */}
        {item.riskForecast?.length > 0 && !isResolved && (
          <div className="mb-7">
            <SectionHeader tone="muted" label="If you delay" className="mb-2" />
            <div className="space-y-2">
              {item.riskForecast.map((r, i, arr) => {
                const isLast = i === arr.length - 1
                const isMid  = i > 0 && !isLast
                const hoursColor = isLast ? 'text-danger' : isMid ? 'text-warn' : 'text-muted'
                const consequenceColor = isLast ? 'text-ink' : 'text-muted'
                return (
                  <div key={r.hours} className={`flex items-start gap-4 px-4 py-3 ${isLast ? 'bg-danger/[0.03]' : 'bg-stone'}`}>
                    <div className="flex-shrink-0 text-right w-14">
                      <div className={`display-num text-body font-bold tabular-nums ${hoursColor}`}>{r.hours}h</div>
                    </div>
                    <div className={`font-body text-label leading-snug ${consequenceColor}`}>{r.consequence}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resolution action */}
        {!isResolved && !item.permanent && (
          <div className="border-t border-rule2 pt-6">
            {isCluster ? (
              <>
                <div className="font-body text-muted text-label mb-3">Resolving both issues together adds +{item.totalPoints} pts readiness.</div>
                {confirming ? (
                  <div className="flex gap-2">
                    <Btn variant="primary" onClick={() => { setConfirming(false); onResolveCluster(item) }}>Confirm resolution</Btn>
                    <Btn variant="secondary" onClick={() => setConfirming(false)}>Cancel</Btn>
                  </div>
                ) : (
                  <HoldButton label={`Hold to resolve both issues — +${item.totalPoints} pts`}
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
            <div className="flex items-center gap-2 px-4 py-3 bg-warn/[0.06] border border-warn/20">
              <AlertTriangle size={12} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body text-warn text-label">Needs maintenance — contact your team to resolve</span>
            </div>
          </div>
        )}

        {/* Resolved state */}
        {isResolved && (
          <div className="flex items-center gap-2 px-4 py-3 bg-ok/[0.06] border border-ok/20">
            <Check size={13} strokeWidth={2} className="text-ok flex-shrink-0" />
            <span className="font-body font-medium text-ok text-body">Resolved — downstream systems updating</span>
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyWorkspace() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="font-display font-bold text-ink text-head mb-2">Select an issue to begin</div>
      <div className="font-body text-muted text-body max-w-[320px] leading-relaxed">
        Select an issue from the queue to see why it happened, how to fix it, and what's at risk if you delay.
      </div>
    </div>
  )
}

// ── Advisory items (compliance readiness) ─────────────────────────────────────

const ADVISORY_ITEMS = [
  { key: 'adv-1', label: 'Operator e-signature policy review',        detail: 'Last reviewed 8 months ago — consider refreshing before next audit window' },
  { key: 'adv-2', label: 'Backup lot traceability export format',     detail: 'Current export format is CSV; FDA may request XML in future cycles' },
  { key: 'adv-3', label: 'Sensor calibration schedule alignment',     detail: 'Annual calibration cycle misaligned with FSMA review period by ~6 weeks' },
]

// ── AI Readiness tab ──────────────────────────────────────────────────────────

const AI_DIMENSIONS = [
  { key: 'completeness', label: 'Are all my signals arriving?',               score: 68, trend: +4, note: '12% of expected signals not arriving — SCADA gap + checklist sync lag' },
  { key: 'freshness',    label: 'Is my data current?',                        score: 71, trend: +2, note: '3 sources updating >10 min behind expected interval' },
  { key: 'consistency',  label: 'Is data structured the same across shifts?', score: 54, trend: -3, note: 'ERP field format mismatch affects 14 ingredient records' },
  { key: 'coverage',     label: 'How many systems are connected?',             score: 62, trend:  0, note: 'MES, ERP, SCADA connected — warehouse + quality lab not yet integrated' },
]
const AI_WEIGHTS = [0.30, 0.25, 0.25, 0.20]
const AI_SCORE = Math.round(AI_DIMENSIONS.reduce((s, d, i) => s + d.score * AI_WEIGHTS[i], 0))

const AI_GAPS = [
  {
    id: 'scada-ai', label: 'SCADA feed degraded — Oven B', dimension: 'Are all my signals arriving?', severity: 'high',
    agents: ['Predictive Maintenance'],
    impact: 'Predictive Maintenance running at 71% confidence — full accuracy requires a stable Oven B signal.',
    fix: 'Resolve maintenance ticket MT-2604-019 to restore feed stability.',
    blockedBy: 'MT-2604-019',
  },
  {
    id: 'erp-schema', label: 'ERP schema inconsistency', dimension: 'Is data structured the same across shifts?', severity: 'high',
    agents: ['Supplier Intelligence', 'Risk Escalation'],
    impact: 'Ingredient-to-supplier linkage broken for 14 records — chain-of-custody gap reduces accuracy in 2 agents.',
    fix: 'Resolve ERP ingredient map in Compliance Readiness queue (~30 min).',
  },
  {
    id: 'lot-meta', label: 'Supplier lot metadata incomplete', dimension: 'Are all my signals arriving?', severity: 'moderate',
    agents: ['Supplier Intelligence'],
    impact: '3 active lots missing COA metadata — reduces recommendation quality and FSMA traceability confidence.',
    fix: 'Contact ConAgra and ADM for missing harvest date + handler certification fields.',
  },
  {
    id: 'warehouse', label: 'Warehouse management not integrated', dimension: 'How many systems are connected?', severity: 'moderate',
    agents: ['Resource Allocation', 'Handoff Synthesis'],
    impact: 'Finished goods movement and inventory signals missing — handoff completeness is reduced.',
    fix: 'Connect WMS API to integration layer — requires IT ticket.',
  },
  {
    id: 'lims', label: 'Quality lab LIMS not connected', dimension: 'How many systems are connected?', severity: 'moderate',
    agents: ['Compliance Monitor', 'CAPA Closure'],
    impact: 'Lab test results entered manually — 4–8h lag between test result and agent awareness.',
    fix: 'LIMS integration in Q3 roadmap — manual entry workaround active in the interim.',
  },
]

const AI_AGENTS = [
  { name: 'Pre-Shift Verification', status: 'full',    note: 'All required data sources connected and fresh' },
  { name: 'Handoff Synthesis',      status: 'full',    note: 'All required signals connected' },
  { name: 'Risk Escalation',        status: 'partial', note: 'ERP schema gap affects some signal paths' },
  { name: 'Compliance Monitor',     status: 'partial', note: 'LIMS lag (4–8h) reduces real-time lab coverage' },
  { name: 'Supplier Intelligence',  status: 'partial', note: 'ERP schema mismatch + 3 lots missing COA metadata' },
  { name: 'Resource Allocation',    status: 'partial', note: 'Warehouse management signals missing' },
  { name: 'Predictive Maintenance', status: 'partial', note: 'SCADA feed degraded — Oven B signal unreliable' },
  { name: 'CAPA Closure',          status: 'partial', note: 'LIMS integration pending — lab data via manual entry' },
]

function AIReadinessInstrument() {
  const zone     = AI_SCORE >= 75 ? 'AI-Ready' : AI_SCORE >= 55 ? 'Approaching Ready' : 'Not Ready'
  const zoneTone = AI_SCORE >= 75 ? 'text-ok'  : AI_SCORE >= 55 ? 'text-warn'         : 'text-danger'
  const zoneBg   = AI_SCORE >= 75 ? 'bg-ok/10 text-ok' : AI_SCORE >= 55 ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'
  const fullCount    = AI_AGENTS.filter(a => a.status === 'full').length
  const partialCount = AI_AGENTS.filter(a => a.status === 'partial').length

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Score */}
      <div className="px-5 pt-5 pb-4 border-b border-rule2 flex-shrink-0">
        <div className="font-body text-muted text-label mb-3">AI Readiness</div>
        {/* Zone interpretation primary, score secondary */}
        <div className={`inline-flex items-center px-2 py-0.5 font-body font-semibold text-label mb-2 ${zoneBg}`}>{zone}</div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`display-num text-score leading-none ${zoneTone}`}>
            <AnimatedScore value={AI_SCORE} effect="blur" />
          </span>
          <span className="font-body text-muted text-label">/ 100</span>
        </div>
        <div className="space-y-3">
          {AI_DIMENSIONS.map((d) => {
            const tone     = d.score >= 75 ? 'bg-ok' : d.score >= 55 ? 'bg-warn' : 'bg-danger'
            const textTone = d.score >= 75 ? 'text-ok' : d.score >= 55 ? 'text-warn' : 'text-danger'
            const trendStr = d.trend > 0 ? `↑ +${d.trend}` : d.trend < 0 ? `↓ ${d.trend}` : null
            const trendColor = d.trend > 0 ? 'text-ok' : d.trend < 0 ? 'text-danger' : 'text-muted'
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-body text-muted text-label leading-snug flex-1">{d.label}</span>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    {trendStr && <span className={`font-body text-micro tabular-nums ${trendColor}`}>{trendStr}</span>}
                    <span className={`display-num text-label font-bold tabular-nums ${textTone}`}>{d.score}</span>
                  </div>
                </div>
                <div className="h-[2px] bg-rule2">
                  <div className={`h-full ${tone} transition-[width]`} style={{ width: `${d.score}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Agent summary */}
      <div className="px-5 py-4 border-b border-rule2 flex-shrink-0">
        <div className="font-body text-muted text-label mb-3">Agent data coverage</div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-body text-muted text-label">Full data access</span>
            <span className="display-num text-body font-bold text-ok tabular-nums">{fullCount} agents</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-body text-muted text-label">Partial access</span>
            <span className="display-num text-body font-bold text-warn tabular-nums">{partialCount} agents</span>
          </div>
        </div>
      </div>
      {/* Gap summary */}
      <div className="px-5 py-4 flex-shrink-0">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-body text-muted text-label">Active gaps</span>
          <span className="display-num text-body font-bold text-warn tabular-nums">{AI_GAPS.length}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-body text-muted text-label">High severity</span>
          <span className="display-num text-body font-bold text-danger tabular-nums">{AI_GAPS.filter(g => g.severity === 'high').length}</span>
        </div>
      </div>
    </div>
  )
}

function AIReadinessPanel() {
  const [rightTab, setRightTab] = useState('gaps')

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-stone">
      <div className="flex-shrink-0 flex border-b border-rule2">
        {[{ id: 'gaps', label: 'Data gaps' }, { id: 'agents', label: 'Agent coverage' }].map(t => (
          <button key={t.id} type="button" onClick={() => setRightTab(t.id)}
            className={`font-body text-label px-4 py-2.5 border-b-2 transition-colors flex-shrink-0 ${
              rightTab === t.id ? 'border-b-signal text-ink' : 'border-b-transparent text-muted hover:text-ink'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {rightTab === 'gaps' && (
          <div className="max-w-[720px] px-8 py-6 space-y-4">
            {/* Send to IT action */}
            <div className="flex items-center justify-between px-4 py-3 border border-rule2 bg-stone2">
              <div>
                <div className="font-body font-medium text-ink text-body">Infrastructure gaps — needs IT</div>
                <div className="font-body text-muted text-label mt-0.5">2 of these gaps require IT tickets, not ops decisions.</div>
              </div>
              <button type="button"
                onClick={() => {
                  const itGaps = AI_GAPS.filter(g => g.id === 'warehouse' || g.id === 'lims')
                  const summary = itGaps.map(g => `• ${g.label}: ${g.fix}`).join('\n')
                  navigator.clipboard?.writeText(`AI Readiness gaps requiring IT:\n\n${summary}`)
                }}
                className="flex items-center gap-1.5 font-body text-label px-3 py-1.5 border border-rule2 text-muted hover:text-ink hover:border-ink/30 transition-colors flex-shrink-0 ml-4">
                <Mail size={10} />
                Copy for IT
              </button>
            </div>
            {AI_GAPS.map(gap => (
              <div key={gap.id} className={`border overflow-hidden ${gap.severity === 'high' ? 'border-danger/30' : 'border-rule2'}`}>
                <div className={`flex items-start justify-between gap-4 px-4 py-3 border-b border-rule2 ${gap.severity === 'high' ? 'bg-danger/[0.02]' : 'bg-stone2'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-body leading-snug">{gap.label}</div>
                    <div className="font-body text-muted text-label mt-0.5">Dimension: {gap.dimension}</div>
                  </div>
                  <StatusPill tone={gap.severity === 'high' ? 'danger' : 'warn'}>{gap.severity === 'high' ? 'High' : 'Moderate'}</StatusPill>
                </div>
                <div className="px-4 py-3 border-b border-rule2">
                  <div className="font-body text-muted text-label mb-1.5">Affected agents</div>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.agents.map(a => (
                      <span key={a} className="font-body text-label text-signal bg-signal/10 px-2 py-0.5">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="font-body text-muted text-label leading-relaxed mb-2">{gap.impact}</p>
                  <div className="flex items-start gap-2">
                    <Zap size={10} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
                    <span className="font-body text-ok text-label leading-snug">{gap.fix}</span>
                  </div>
                  {gap.blockedBy && (
                    <div className="font-body text-muted text-label mt-1">Blocked by: {gap.blockedBy}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {rightTab === 'agents' && (
          <div className="divide-y divide-rule2">
            {AI_AGENTS.map(a => (
              <div key={a.name} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'full' ? 'bg-ok' : 'bg-warn'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-ink text-body">{a.name}</div>
                  <div className="font-body text-muted text-label mt-0.5">{a.note}</div>
                </div>
                <StatusPill tone={a.status === 'full' ? 'ok' : 'warn'}>{a.status === 'full' ? 'Full access' : 'Partial'}</StatusPill>
              </div>
            ))}
          </div>
        )}
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
  const [mode, setMode] = useState('ai')
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
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* Mode tab switcher */}
      <div className="flex-shrink-0 border-b border-rule2">
        <Tabs
          tabs={[
            { id: 'compliance', label: 'Compliance readiness' },
            { id: 'ai',         label: 'AI readiness'        },
          ]}
          active={mode}
          onChange={setMode}
        />
      </div>

      {mode === 'ai' ? (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col overflow-hidden bg-stone">
            <AIReadinessInstrument />
          </div>
          <AIReadinessPanel />
        </div>
      ) : (
      <div className="flex flex-1 min-h-0 overflow-hidden">

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
      )}
    </div>
  )
}
