import { useState } from 'react'
import { Link } from 'react-router-dom'
import { interventions, kpiTargets, platformBaseline } from '../data/interventions'
import { goalsData } from '../data'
import { ACCEPTANCE_RANKING } from '../data/findingPrecedents'
import { useAppState } from '../context/AppState'
import { ATTR, GRAINS, PLANTS_META, buildSteps, WaterfallChart } from './Analytics'
import { AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, AlertCircle, TrendingUp, TrendingDown, Zap, Clock, ChevronDown, ChevronRight, User } from 'lucide-react'
import { StatusPill, SceneHeader, Tabs, Btn, AnimatedScore, StatGrid, EmptyState, FilterDropdown, SlidePanel } from '../components/UI'

const OUTCOME_CFG = {
  positive: { label: 'Positive',     tone: 'ok',     border: 'border-l-ok',     accent: 'bg-ok'     },
  negative: { label: 'Negative',     tone: 'danger', border: 'border-l-danger', accent: 'bg-danger' },
  unclear:  { label: 'Inconclusive', tone: 'signal', border: 'border-l-signal', accent: 'bg-signal',
              desc: "Effect couldn't be isolated — multiple concurrent changes affected this outcome simultaneously." },
  harmful:  { label: 'Harmful',      tone: 'danger', border: 'border-l-danger', accent: 'bg-danger' },
}

const DECISION_CFG = {
  approved:        { label: 'Approved',   cls: 'text-ok',     tone: 'ok'     },
  rejected:        { label: 'Rejected',   cls: 'text-warn',   tone: 'warn'   },
  'auto-executed': { label: 'Auto-run',   cls: 'text-signal', tone: 'signal' },
  overridden:      { label: 'Overridden', cls: 'text-muted',  tone: 'muted'  },
}

const formatKey = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()

function DwellBadge({ ms }) {
  if (ms === 0) return <span className="font-body text-muted text-label">Auto</span>
  const secs = Math.round(ms / 1000)
  const color = secs < 5 ? 'text-danger' : secs < 15 ? 'text-warn' : 'text-ok'
  return <span className={`font-body text-label tabular-nums ${color}`}>{secs}s</span>
}


// Grid card — impact visible inline, no click required to see outcome
function InterventionCard({ entry, onClick }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const confPct    = entry.attributionConfidence != null ? Math.round(entry.attributionConfidence * 100) : null
  const isLowDwell = entry.dwellTimeMs > 0 && entry.dwellTimeMs < 5000
  const isImprovement = entry.kpiDelta?.direction === 'improvement'

  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left bg-stone2 border border-rule overflow-hidden border-l-[3px] ${oc.border} hover:bg-stone3 transition-colors group`}>

      {/* Header: outcome + time */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
        {isLowDwell && (
          <span className="flex items-center gap-0.5 font-body text-warn text-label">
            <Clock size={9} strokeWidth={2} />⚠ {Math.round(entry.dwellTimeMs / 1000)}s
          </span>
        )}
        <span className="ml-auto font-body text-muted text-label">{entry.timeLabel}</span>
      </div>

      {/* Action + agent */}
      <div className="px-4 pb-3">
        <p className="font-body font-medium text-ink text-body leading-snug mb-1">{entry.action}</p>
        <div className="flex items-center gap-1.5">
          <span className="font-body text-ink text-label font-medium">{entry.agent}</span>
          <span className="font-body text-muted text-label opacity-40">·</span>
          <span className={`font-body text-label ${dc.cls}`}>{dc.label}</span>
          {entry.cautionNote && (
            <span className="ml-auto flex items-center gap-0.5 font-body text-warn text-label">
              <AlertCircle size={9} strokeWidth={2} />Caution
            </span>
          )}
        </div>
      </div>

      {/* Impact delta — visible inline, no click required */}
      {entry.kpiDelta && (
        <div className={`flex items-center gap-3 px-4 py-2.5 border-t border-rule2/60 ${
          isImprovement ? 'bg-ok/[0.04]' : entry.kpiDelta.direction === 'degradation' ? 'bg-warn/[0.03]' : ''
        }`}>
          <div className="flex-1 min-w-0">
            <div className="font-body text-muted text-label truncate">{entry.kpiDelta.metric}</div>
            <div className={`display-num text-sub font-bold tabular-nums leading-none mt-0.5 ${
              isImprovement ? 'text-ok' : entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-ink'
            }`}>
              {entry.kpiDelta.before} → {entry.kpiDelta.after}
            </div>
          </div>
          {isImprovement ? <TrendingUp size={14} className="text-ok flex-shrink-0 opacity-50" strokeWidth={2} />
                         : <TrendingDown size={14} className="text-warn flex-shrink-0 opacity-50" strokeWidth={2} />}
        </div>
      )}

      {/* Confidence footer */}
      {confPct != null && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-rule2/60">
          <div className="h-1 flex-1 bg-rule2 overflow-hidden">
            <div className={`h-full ${confPct >= 85 ? 'bg-ok' : confPct >= 65 ? 'bg-warn' : 'bg-danger'}`}
              style={{ width: `${confPct}%` }} />
          </div>
          <span className={`font-body text-label tabular-nums flex-shrink-0 ${
            confPct >= 85 ? 'text-ok' : confPct >= 65 ? 'text-warn' : 'text-danger'
          }`}>{confPct}%</span>
        </div>
      )}
    </button>
  )
}

// Outcome distribution strip — sits between SceneHeader and grid
function ScoreDistribution({ total, positiveCount, negativeCount, unclearCount, filter, setFilter, displayedCount }) {
  const pct = (n) => Math.round((n / total) * 100)
  return (
    <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b border-rule2 bg-stone2">
      {/* Distribution bar */}
      <div className="flex-shrink-0 w-40">
        <div className="flex h-1.5 overflow-hidden mb-1.5 gap-px">
          <div className="bg-ok h-full transition-all"     style={{ width: `${pct(positiveCount)}%` }} />
          <div className="bg-signal h-full transition-all" style={{ width: `${pct(unclearCount)}%` }} />
          <div className="bg-danger h-full flex-1" />
        </div>
        <div className="flex items-center gap-3">
          {[[positiveCount,'ok'],[unclearCount,'signal'],[negativeCount,'danger']].map(([n,t],i) => (
            <span key={i} className={`display-num text-label font-bold text-${t} tabular-nums`}>{n}</span>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-rule flex-shrink-0" />

      {/* Labels */}
      {[
        [positiveCount, 'ok',     'Positive'],
        [unclearCount,  'signal', 'Inconclusive'],
        [negativeCount, 'danger', 'Negative'],
      ].map(([n, t, label]) => (
        <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full bg-${t} flex-shrink-0`} />
          <span className="font-body text-muted text-label">{label}</span>
        </div>
      ))}

      {/* Filter + count */}
      <div className="ml-auto flex items-center gap-3">
        <FilterDropdown
          label="Outcome"
          options={OUTCOME_FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
        <span className="font-body text-muted text-label tabular-nums">{displayedCount}</span>
      </div>
    </div>
  )
}

function InterventionDetail({ entry }) {
  const [triggerOpen, setTriggerOpen] = useState(false)
  if (!entry) return <EmptyState message="Select an intervention" sub="Read the full story arc" />

  const oc  = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc  = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const kpi = kpiTargets.find(k => k.id === entry.kpiTarget)
  const isNegative    = entry.outcomeClassification === 'negative' || entry.outcomeClassification === 'harmful'
  const isImprovement = entry.kpiDelta?.direction === 'improvement'
  const confPct       = entry.attributionConfidence != null ? Math.round(entry.attributionConfidence * 100) : null
  const confColor     = confPct >= 80 ? 'text-ok' : confPct >= 60 ? 'text-warn' : 'text-danger'
  const confBar       = confPct >= 80 ? 'bg-ok'   : confPct >= 60 ? 'bg-warn'   : 'bg-danger'
  const staleSignals  = entry.sourceSignals?.filter(s => s.stale) ?? []
  const dwellSecs     = Math.round((entry.dwellTimeMs ?? 0) / 1000)

  const confFactors = [
    { label: 'Signal completeness', value: entry.signalCompleteness != null ? `${Math.round(entry.signalCompleteness * 100)}%` : '—', ok: (entry.signalCompleteness ?? 0) >= 0.9 },
    { label: 'Data freshness',      value: staleSignals.length === 0 ? 'All current' : `${staleSignals.length} stale`, ok: staleSignals.length === 0 },
    { label: 'Operator confirmed',  value: entry.operatorConfirmation ? 'Yes' : 'No', ok: !!entry.operatorConfirmation },
    { label: 'Review dwell time',   value: entry.dwellTimeMs === 0 ? 'Auto-executed' : dwellSecs < 5 ? `${dwellSecs}s — low` : `${dwellSecs}s`, ok: entry.dwellTimeMs === 0 || dwellSecs >= 5 },
  ]

  return (
    <div className="flex-1 overflow-y-auto page-rise">
      <div className="max-w-[720px] px-8 py-6 space-y-7">

        {/* ── 1. OUTCOME ── pill · operational result · meta ────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
            {entry.wasReversed && <StatusPill tone="muted">Reversed</StatusPill>}
            <span className="ml-auto font-body text-muted text-label">{entry.agent} · {entry.agentTier} tier</span>
          </div>

          {entry.outcomeNotes && (
            <p className="font-body text-ink text-body leading-relaxed mb-3">{entry.outcomeNotes}</p>
          )}
          {oc.desc && !entry.outcomeNotes && (
            <div className="font-body text-muted text-label mb-3 pl-3 border-l-2 border-signal/40 leading-snug">{oc.desc}</div>
          )}

          {/* Meta: when · decision · reviewer · review time */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body text-label text-muted">{entry.timeLabel}</span>
            <div className="w-px h-3 bg-rule2 flex-shrink-0" />
            <StatusPill tone={dc.tone}>{dc.label}</StatusPill>
            <div className="flex items-center gap-1.5">
              <User size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
              <span className="font-body text-label text-ink">{entry.reviewedBy}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
              <DwellBadge ms={entry.dwellTimeMs} />
            </div>
          </div>

          {entry.wasReversed && (
            <div className="flex items-start gap-3 border border-rule2 bg-stone2 px-4 py-3 mt-3">
              <RotateCcw size={11} strokeWidth={2} className="text-muted flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-body font-semibold text-ink text-label">Reversed — {entry.reversedAt}</div>
                <p className="font-body text-muted text-label leading-snug mt-0.5">{entry.reversalReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. IMPACT ── KPI delta + before/after rows ────────────────── */}
        {(entry.kpiDelta || entry.metricsAfter) && (
          <div>
            <div className="font-body text-label text-muted mb-3">Impact</div>

            {entry.kpiDelta && (
              <div className={`border border-rule2 px-4 py-4 mb-3 ${
                isImprovement ? 'bg-ok/[0.04]' :
                entry.kpiDelta.direction === 'degradation' ? 'bg-warn/[0.04]' : 'bg-stone2'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {isImprovement
                    ? <TrendingUp size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
                    : <TrendingDown size={12} strokeWidth={2} className="text-warn flex-shrink-0" />}
                  <span className="font-body font-semibold text-ink text-body">{entry.kpiDelta.metric}</span>
                  {entry.kpiDelta.pct !== undefined && (
                    <span className={`font-body text-label font-bold px-2 py-0.5 ml-auto flex-shrink-0 ${
                      entry.kpiDelta.pct > 0 ? 'text-ok bg-ok/10' : 'text-warn bg-warn/10'
                    }`}>
                      {entry.kpiDelta.pct > 0 ? '+' : ''}<AnimatedScore value={entry.kpiDelta.pct} suffix="%" />
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-muted text-body">{entry.kpiDelta.before}</span>
                  <ArrowRight size={12} className="text-muted" />
                  <span className={`display-num text-head ${
                    isImprovement ? 'text-ok' :
                    entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-ink'
                  }`}>{entry.kpiDelta.after}</span>
                </div>
              </div>
            )}

            {entry.metricsAfter && (
              <div className="border border-rule2 divide-y divide-rule2">
                {Object.entries(entry.metricsAfter).map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-3 px-4 py-2.5">
                    <span className="font-body text-label text-muted flex-1">{formatKey(k)}</span>
                    <span className="font-body text-label text-muted tabular-nums">{entry.metricsBefore[k]}</span>
                    <ArrowRight size={10} strokeWidth={2} className="text-muted flex-shrink-0" />
                    <span className="font-body text-label font-medium text-ink tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. CONFIRMATION ── operator floor validation ──────────────── */}
        <div>
          <div className="font-body text-label text-muted mb-3">Confirmation</div>
          {entry.operatorConfirmation ? (
            <div className="flex items-start gap-3 px-4 py-4 bg-ok/[0.04] border border-ok/20">
              <CheckCircle2 size={12} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-ink text-body mb-0.5">Confirmed by operator</div>
                <div className="font-body text-muted text-label">{entry.operatorConfirmation.confirmedBy} · {entry.operatorConfirmation.station}</div>
                <div className="font-body text-ok text-label mt-0.5">{entry.operatorConfirmation.note}</div>
                <div className="font-body text-muted text-label mt-0.5">{entry.operatorConfirmation.confirmedAt}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-stone2 border border-rule2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
              <span className="font-body text-muted text-label">No operator confirmation — outcome estimated from telemetry</span>
            </div>
          )}
        </div>

        {/* ── 4. CONFIDENCE ── score + evidence factors ─────────────────── */}
        {confPct != null && (
          <div>
            <div className="font-body text-label text-muted mb-3">Confidence</div>
            <div className="flex items-center gap-5 mb-3">
              <div>
                <div className={`display-num text-score font-bold tabular-nums leading-none ${confColor}`}>{confPct}%</div>
                <div className="font-body text-label text-muted mt-1">attribution</div>
              </div>
              <div className="flex-1">
                <div className="h-1.5 bg-rule2 overflow-hidden">
                  <div className={`h-full ${confBar}`} style={{ width: `${confPct}%` }} />
                </div>
                <div className="font-body text-label text-muted mt-1.5">
                  {confPct >= 80 ? 'High — treat as a validated pattern'
                    : confPct >= 60 ? 'Moderate — gather more confirmation before operationalizing'
                    : 'Low — outcome may not be attributable to this intervention'}
                </div>
              </div>
            </div>
            <div className="border border-rule2 divide-y divide-rule2">
              {confFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-body text-label text-muted flex-1">{f.label}</span>
                  <span className={`font-body text-label font-medium ${f.ok ? 'text-ok' : 'text-warn'}`}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Override · caution · CAPA ───────────────────────────────────── */}
        {(entry.overrideReason || entry.cautionNote || isNegative) && (
          <div className="space-y-3">
            {entry.overrideReason && (
              <div className="flex items-start gap-2 px-4 py-3 bg-warn/[0.04] border border-warn/20">
                <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="font-body text-warn text-label leading-snug">{entry.overrideReason}</p>
              </div>
            )}
            {entry.cautionNote && (
              <div className="flex items-center gap-1.5">
                <AlertCircle size={9} className="text-warn flex-shrink-0" />
                <span className="font-body text-warn text-label">{entry.cautionNote}</span>
              </div>
            )}
            {isNegative && (
              <div className="flex items-center justify-between gap-4 px-4 py-4 bg-danger/[0.025] border border-danger/20">
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-ink text-body mb-0.5">Corrective action available</div>
                  <div className="font-body text-muted text-label">A CAPA formalizes this as a systemic gap and creates an audit-ready record.</div>
                </div>
                <Link to="/capa" className="flex-shrink-0">
                  <Btn variant="secondary">Open CAPA</Btn>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── 5. WHAT TRIGGERED THIS ── collapsible ─────────────────────── */}
        <div>
          <button type="button" onClick={() => setTriggerOpen(o => !o)}
            className="w-full flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
            <span className="font-body text-label text-muted flex-1">What triggered this</span>
            <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform duration-150 ${triggerOpen ? 'rotate-180' : ''}`} />
          </button>

          {triggerOpen && (
            <div className="mt-3 space-y-3">
              <div className="border border-rule2 bg-stone2 px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                  <span className="font-body text-ink text-body">What the AI detected</span>
                </div>
                <p className="font-body text-muted text-label leading-relaxed">{entry.rationaleText}</p>
              </div>

              {kpi && (
                <div className="border border-rule2 bg-stone px-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
                    <span className="font-body text-muted text-body">Tracking {kpi.label}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-body text-muted text-label">Baseline <span className="text-ink font-medium">{kpi.baseline} {kpi.unit}</span></span>
                    <span className="font-body text-muted text-label">Target <span className="text-ok font-medium">{kpi.target}</span></span>
                  </div>
                </div>
              )}

              <div className="font-body text-muted text-label mb-2">What the AI was tracking</div>
              <div className="border border-rule2 divide-y divide-rule2">
                {entry.sourceSignals.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-body text-muted text-label flex-1">{s.name}</span>
                    <span className="font-body text-ink text-label font-medium">{s.value}</span>
                    <span className="font-body text-muted text-label">vs {s.baseline}</span>
                    {s.stale && <StatusPill tone="warn">Stale</StatusPill>}
                  </div>
                ))}
              </div>
              {staleSignals.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={9} className="text-warn" strokeWidth={2} />
                  <span className="font-body text-warn text-label">Some signals were stale at decision time — confidence reduced</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Benchmarks tab (formerly Analytics) ─────────────────────────────────────

const ADOPTION_WORKFLOWS = [
  { id: 'handoff',   label: 'Shift handoff',           role: 'Supervisors', target: 90, rate: 67, warning: 'D. Kowalski · J. Torres — 0 of last 3 shifts completed. Incoming supervisors reconstructing context manually.' },
  { id: 'checklist', label: 'Operator checklists',     role: 'Operators',   target: 95, rate: 81, warning: null },
  { id: 'decisions', label: 'Agent decision review',   role: 'Director',    target: 80, rate: 92, warning: null },
  { id: 'evidence',  label: 'CAPA evidence submission', role: 'Supervisors', target: 85, rate: 58, warning: 'CAPA-2604-006 · CAPA-2604-011 blocked — evidence not filed.' },
]

const TOP_QUARTILE = [
  { area: 'OEE',          practice: "Run AI checks before every shift — not just when something goes wrong",        lift: '+4.2pp avg OEE vs cohort median' },
  { area: 'CAPA',         practice: "Package evidence automatically when a CAPA opens — don't wait until closure",  lift: '38% faster closure vs cohort median' },
  { area: 'Downtime',     practice: 'Schedule maintenance from sensor data, not from the calendar',                 lift: '23% fewer unplanned stops' },
  { area: 'Traceability', practice: 'Check lot chain completeness as ingredients arrive — catch gaps at the door',  lift: '2.1h faster recall response window' },
]

function BenchmarksTab() {
  const { currentPlant } = useAppState()
  const [scopePlant, setScopePlant] = useState(currentPlant?.id === 'ks' ? 'ks' : currentPlant?.id === 'co' ? 'co' : 'sl')
  const [timeGrain, setTimeGrain]   = useState('shift')

  const plantMeta = ATTR[scopePlant] || ATTR.sl
  const grainData = plantMeta[timeGrain] || plantMeta.shift
  const attr      = { plant: plantMeta.plant, code: plantMeta.code, line: plantMeta.line, target: plantMeta.target, ...grainData }
  const steps     = buildSteps(attr)
  const totalDelta = +(attr.actual - attr.baseline).toFixed(1)
  const atTarget   = attr.actual >= attr.target

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[860px] px-6 py-6 space-y-8">

        {/* OEE attribution waterfall */}
        <div>
          {/* Scope bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="font-body text-label font-semibold text-muted">OEE attribution</div>
            <div className="flex items-center gap-1 ml-auto">
              {PLANTS_META.map(pm => (
                <button key={pm.id} type="button"
                  onClick={() => setScopePlant(pm.id)}
                  className={`px-3 py-1 font-body text-label transition-colors ${scopePlant === pm.id ? 'bg-signal text-stone font-semibold' : 'bg-stone2 text-muted hover:text-ink border border-rule2'}`}>
                  {pm.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {GRAINS.map(g => (
                <button key={g.id} type="button"
                  onClick={() => setTimeGrain(g.id)}
                  className={`px-3 py-1 font-body text-label transition-colors ${timeGrain === g.id ? 'bg-signal text-stone font-semibold' : 'bg-stone2 text-muted hover:text-ink border border-rule2'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className={`display-num text-score font-bold tabular-nums leading-none ${atTarget ? 'text-ok' : 'text-warn'}`}>
              {attr.actual}%
            </span>
            <span className="font-body text-muted text-body">OEE · {attr.line} · {attr.plant}</span>
            <span className={`font-body font-medium text-body ml-auto ${totalDelta >= 0 ? 'text-ok' : 'text-danger'}`}>
              {totalDelta > 0 ? '+' : ''}{totalDelta}pp vs baseline
            </span>
          </div>
          <p className="font-body text-muted text-label mb-4">{attr.narrative}</p>

          {/* Chart */}
          <div className="border border-rule2 bg-stone2 px-4 py-4">
            <WaterfallChart attr={attr} />
          </div>

          {/* Driver breakdown */}
          <div className="mt-3 space-y-1.5">
            {steps.filter(s => s.type !== 'base' && s.type !== 'total').map(s => (
              <div key={s.id} className="flex items-start gap-3 px-4 py-2.5 border border-rule2 bg-stone">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${s.delta >= 0 ? 'bg-ok' : 'bg-danger'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-ink text-body leading-snug">{s.label}</div>
                  <div className="font-body text-label text-muted leading-snug">{s.note}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className={`font-body font-bold text-body tabular-nums ${s.delta >= 0 ? 'text-ok' : 'text-danger'}`}>
                    {s.delta > 0 ? '+' : ''}{s.delta}pp
                  </div>
                  {s.action && (
                    <div className="font-body text-label text-muted leading-snug mt-0.5 max-w-[220px] text-right">{s.action}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q2 Goals */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4">Q2 goals</div>
          <div className="space-y-3">
            {goalsData.map(g => {
              const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
              const pct = g.direction === 'increase'
                ? Math.min(100, (g.current / g.target) * 100)
                : Math.min(100, (1 - (g.current - g.target) / g.target) * 100)
              return (
                <div key={g.id} className="border border-rule2 px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="font-body font-medium text-ink text-body mb-0.5">{g.label}</div>
                      <div className="font-body text-label text-muted">Target: {g.target} {g.unit} by {g.deadline}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`display-num text-head font-bold tabular-nums leading-none ${onTrack ? 'text-ok' : 'text-warn'}`}>{g.current}</div>
                      <div className="font-body text-label text-muted">{g.unit}</div>
                    </div>
                  </div>
                  <div className="relative h-[4px] bg-rule2">
                    <div className={`absolute inset-y-0 left-0 ${onTrack ? 'bg-ok' : 'bg-warn'}`} style={{ width: `${pct}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-ink/30" style={{ left: '85%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Workflow adoption */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4">Workflow adoption</div>
          <div className="border border-rule2 divide-y divide-rule2">
            {ADOPTION_WORKFLOWS.map(w => {
              const atRisk = w.rate < w.target
              const pct = Math.min(100, (w.rate / w.target) * 100)
              return (
                <div key={w.id} className={`px-5 py-4 ${atRisk ? 'bg-warn/[0.02]' : ''}`}>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-body font-medium text-ink text-body">{w.label}</span>
                      <span className="font-body text-label text-muted ml-2">· {w.role}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`display-num text-sub font-bold tabular-nums ${atRisk ? 'text-warn' : 'text-ok'}`}>{w.rate}%</span>
                      <span className="font-body text-label text-muted">/ {w.target}% target</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-rule2 overflow-hidden">
                    <div className={`h-full ${atRisk ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {w.warning && <p className="font-body text-label text-warn mt-1.5 leading-snug">{w.warning}</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Top quartile practices */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4">Top quartile practices · similar plants</div>
          <div className="space-y-2">
            {TOP_QUARTILE.map((t, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 border border-rule2">
                <div className="w-24 flex-shrink-0">
                  <div className="font-body text-label font-semibold text-muted">{t.area}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body text-body text-ink leading-snug mb-1">{t.practice}</div>
                  <div className="font-body text-label text-ok">{t.lift}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Platform ROI tab ─────────────────────────────────────────────────────────

function MetricRow({ metric }) {
  const [open, setOpen] = useState(false)
  const isImprovement = metric.direction === 'improvement'
  const attribPct     = Math.round(metric.attribution * 100)
  const attribColor   = attribPct >= 80 ? 'bg-ok' : attribPct >= 65 ? 'bg-warn' : 'bg-signal'
  const deltaStr      = metric.delta > 0 ? `+${metric.delta}` : `${metric.delta}`
  const valueStr      = `$${(metric.annualValue / 1000).toFixed(0)}K/yr`

  return (
    <div className="border-b border-rule2">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-4 w-full px-5 py-4 text-left hover:bg-stone2 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="font-body font-medium text-ink text-body leading-snug mb-0.5">{metric.label}</div>
          <div className="flex items-center gap-3">
            <span className="font-body text-muted text-label tabular-nums">{metric.before} {metric.unitLabel}</span>
            <ArrowRight size={10} strokeWidth={2} className="text-muted flex-shrink-0" />
            <span className={`font-body font-medium text-label tabular-nums ${isImprovement ? 'text-ok' : 'text-danger'}`}>
              {metric.after} {metric.unitLabel}
            </span>
            <span className={`font-body text-label tabular-nums ${isImprovement ? 'text-ok' : 'text-danger'}`}>
              ({deltaStr} {metric.unit})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Attribution bar */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="font-body text-label text-muted">{attribPct}% conf.</span>
              <div className="w-16 h-1 bg-rule2 overflow-hidden">
                <div className={`h-full ${attribColor}`} style={{ width: `${attribPct}%` }} />
              </div>
            </div>
          </div>
          {/* Annual value */}
          <div className="text-right w-20">
            <div className="font-body font-bold text-body tabular-nums text-ok">{valueStr}</div>
            <div className="font-body text-label text-muted">est.</div>
          </div>
          <Link to={metric.sourceRoute}
            className="font-body text-label text-signal hover:text-ink transition-colors flex-shrink-0"
            onClick={e => e.stopPropagation()}>
            {metric.sourceModule} →
          </Link>
          {open
            ? <ChevronDown  size={10} className="text-muted flex-shrink-0" />
            : <ChevronRight size={10} className="text-muted flex-shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-rule2 bg-stone2 space-y-2.5">
          <div className="pt-3">
            <div className="font-body text-label text-muted mb-0.5">How this was calculated</div>
            <p className="font-body text-label text-muted leading-relaxed">{metric.how}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Caveat</div>
            <p className="font-body text-label text-muted leading-snug">{metric.caveat}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PlatformROI() {
  const b   = platformBaseline
  const s   = b.summary
  const roiColor = s.year1ROI >= 200 ? 'text-ok' : s.year1ROI >= 100 ? 'text-signal' : 'text-warn'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[820px] px-6 py-6 space-y-8">

        {/* Attribution notice */}
        <div className="flex items-start gap-3 px-4 py-3 bg-stone2 border-l-2 border-l-muted">
          <AlertTriangle size={11} strokeWidth={2} className="text-muted flex-shrink-0 mt-px" />
          <p className="font-body text-label text-muted leading-relaxed">{b.attributionNote}</p>
        </div>

        {/* Summary strip */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4 tracking-wider">
            PLATFORM RETURN · {b.evaluationPeriod}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="px-5 py-4 bg-stone2 border border-rule2">
              <div className="font-body text-label text-muted mb-2">Est. annual value</div>
              <div className="display-num text-score font-bold tabular-nums text-ok leading-none">
                ${(s.totalAnnualValue / 1000).toFixed(0)}K
              </div>
              <div className="font-body text-label text-muted mt-1.5">
                across {b.metrics.length} measured metrics
              </div>
            </div>
            <div className="px-5 py-4 bg-stone2 border border-rule2">
              <div className="font-body text-label text-muted mb-2">First-year cost</div>
              <div className="display-num text-score font-bold tabular-nums text-ink leading-none">
                ${(s.year1Cost / 1000).toFixed(0)}K
              </div>
              <div className="font-body text-label text-muted mt-1.5">
                license + implementation + integration
              </div>
            </div>
            <div className="px-5 py-4 bg-stone2 border border-rule2">
              <div className="font-body text-label text-muted mb-2">Year 1 ROI</div>
              <div className={`display-num text-score font-bold tabular-nums ${roiColor} leading-none`}>
                {s.year1ROI}%
              </div>
              <div className="font-body text-label text-muted mt-1.5">
                ${(s.year1Net / 1000).toFixed(0)}K net · {Math.round(s.avgAttribution * 100)}% avg confidence
              </div>
            </div>
          </div>
          <p className="font-body text-label text-muted leading-relaxed">{s.note}</p>
        </div>

        {/* Per-metric breakdown */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">METRIC BREAKDOWN</div>
          <div className="border border-rule2 divide-y divide-rule2 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_80px_80px] gap-4 px-5 py-2 bg-stone3">
              <span className="font-body text-label text-muted">Metric</span>
              <span className="font-body text-label text-muted text-right">Attribution conf.</span>
              <span className="font-body text-label text-muted text-right">Est. value</span>
              <span className="font-body text-label text-muted" />
            </div>
            {b.metrics.map(m => <MetricRow key={m.id} metric={m} />)}
          </div>
        </div>

        {/* Cost breakdown */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">PLATFORM COST</div>
          <div className="border border-rule2 divide-y divide-rule2">
            {[
              ['Annual license',           b.costs.annualLicense,           'recurring'],
              ['Implementation (year 1)',  b.costs.implementationYear1,     'one-time' ],
              ['Integration maintenance',  b.costs.integrationMaintenance,  'recurring'],
            ].map(([label, val, type]) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3">
                <span className="font-body text-body text-ink flex-1">{label}</span>
                <span className="font-body text-label text-muted">{type}</span>
                <span className="font-body font-medium text-body text-ink tabular-nums w-20 text-right">
                  ${(val / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
            <div className="flex items-center gap-4 px-5 py-3 bg-stone2">
              <span className="font-body font-medium text-body text-ink flex-1">Year 1 total</span>
              <span className="font-body text-label text-muted">license + implementation + integration</span>
              <span className="font-body font-bold text-body text-ink tabular-nums w-20 text-right">
                ${(b.costs.totalYear1 / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex items-center gap-4 px-5 py-3 bg-ok/[0.04]">
              <span className="font-body font-medium text-body text-ok flex-1">Year 1 net</span>
              <span className="font-body text-label text-ok">{s.year1ROI}% ROI</span>
              <span className="font-body font-bold text-body text-ok tabular-nums w-20 text-right">
                +${(s.year1Net / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </div>

        {/* Not yet counted */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">NOT YET IN THESE NUMBERS</div>
          <div className="space-y-2">
            {b.notYetCounted.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border border-rule2">
                <div className="w-1.5 h-1.5 rounded-full bg-signal flex-shrink-0 mt-1.5" />
                <div>
                  <div className="font-body font-medium text-ink text-body mb-0.5">{item.area}</div>
                  <p className="font-body text-label text-muted leading-snug">{item.potential}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const OUTCOME_FILTER_OPTIONS = [
  { value: 'all',      label: 'All outcomes'  },
  { value: 'positive', label: 'Positive'      },
  { value: 'negative', label: 'Negative'      },
  { value: 'unclear',  label: 'Inconclusive'  },
]

const OUTCOME_MATCH = {
  positive: e => e.outcomeClassification === 'positive',
  negative: e => e.outcomeClassification === 'negative' || e.outcomeClassification === 'harmful',
  unclear:  e => e.outcomeClassification === 'unclear',
}

// ─── Adoption tab — recommendation acceptance rates by finding type ───────────
// Answers the director question: "Which recommendations do supervisors trust?"
// Built from the finding precedent data. Updated as supervisors act on / dismiss findings.

function AdoptionTab() {
  const { findingActions } = useAppState()

  // Overlay session actions on top of the historical baseline
  const sessionActed    = Object.values(findingActions).filter(a => a.type === 'acted').length
  const sessionDismissed = Object.values(findingActions).filter(a => a.type === 'dismissed').length

  const wedge = ACCEPTANCE_RANKING[0] // Highest-trust category

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[820px] px-6 py-6 space-y-8">

        {/* Key insight — the wedge */}
        <div className="px-5 py-4 bg-ok/[0.04] border-l-2 border-l-ok">
          <div className="font-body font-medium text-ok text-body mb-1">Highest-trust category</div>
          <p className="font-body text-label text-muted leading-relaxed">
            <span className="font-medium text-ink">{wedge.label}</span> — acted on {Math.round(wedge.acceptanceRate * 100)}% of the time,
            median {wedge.medianMins} min to action. This is the wedge: the decision domain where supervisors consistently
            outperform their current process when using Takorin.
          </p>
        </div>

        {/* Session signal */}
        {(sessionActed + sessionDismissed) > 0 && (
          <div className="flex items-center gap-6 px-5 py-3 bg-stone2 border border-rule2">
            <div>
              <div className="display-num text-sub font-bold tabular-nums text-ok leading-none">{sessionActed}</div>
              <div className="font-body text-label text-muted mt-1">Acted on · this session</div>
            </div>
            <div>
              <div className="display-num text-sub font-bold tabular-nums text-muted leading-none">{sessionDismissed}</div>
              <div className="font-body text-label text-muted mt-1">Dismissed · this session</div>
            </div>
            <div className="ml-auto font-body text-label text-muted">
              Live signal — updates as supervisors act on findings in Shift
            </div>
          </div>
        )}

        {/* Acceptance rate by category */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4">Recommendation acceptance by category</div>
          <div className="border border-rule2 divide-y divide-rule2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 px-5 py-2 bg-stone3">
              <span className="font-body text-label text-muted">Finding type</span>
              <span className="font-body text-label text-muted text-right">Acted on</span>
              <span className="font-body text-label text-muted text-right">Median time</span>
              <span className="font-body text-label text-muted text-right">Outcome delta</span>
            </div>
            {ACCEPTANCE_RANKING.map(row => {
              const pct   = Math.round(row.acceptanceRate * 100)
              const color = pct >= 80 ? 'text-ok' : pct >= 60 ? 'text-warn' : 'text-danger'
              const bar   = pct >= 80 ? 'bg-ok'   : pct >= 60 ? 'bg-warn'   : 'bg-danger'
              return (
                <div key={row.key} className="px-5 py-3.5">
                  <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 items-center mb-2">
                    <span className="font-body font-medium text-ink text-body">{row.label}</span>
                    <span className={`font-body font-bold text-body tabular-nums text-right ${color}`}>{pct}%</span>
                    <span className="font-body text-muted text-body tabular-nums text-right">{row.medianMins}m</span>
                    <div className="text-right">
                      <span className="font-body text-label tabular-nums text-ok">{row.actedDelta}pts</span>
                      <span className="font-body text-label text-muted mx-1">vs</span>
                      <span className="font-body text-label tabular-nums text-danger">+{Math.abs(row.ignoredDelta)}pts</span>
                    </div>
                  </div>
                  {/* Acceptance bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-rule2 overflow-hidden">
                      <div className={`h-full ${bar} transition-[width]`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="font-body text-label text-muted leading-snug mt-2">{row.insight}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Interpretation */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4">What this means</div>
          <div className="space-y-3">
            {[
              { label: 'Build trust here first', detail: 'Certification and allergen compliance findings have the highest acceptance rates (88–95%). These are the categories where supervisors already agree with the system. Start outcome measurement here — close the feedback loop on the decisions that are already working.', tone: 'ok' },
              { label: 'Calibration work needed here', detail: 'Predictive maintenance recommendations are acted on only 24% of the time. Two false positives and one missed failure have shaped this pattern. Improving model calibration on maintenance signals is the highest-leverage intervention to close the trust gap.', tone: 'warn' },
              { label: 'Process change needed here', detail: 'Scheduling (tomorrow gap) and equipment monitoring findings have 60-62% acceptance. These aren\'t trust failures — supervisors often defer these to end-of-shift. The intervention is workflow design: surface scheduling findings with a specific time constraint, not just a flag.', tone: 'signal' },
            ].map(({ label, detail, tone }) => (
              <div key={label} className={`px-4 py-3 border-l-2 border-l-${tone} bg-${tone}/[0.03]`}>
                <div className={`font-body text-label font-semibold text-${tone} mb-1`}>{label}</div>
                <p className="font-body text-label text-muted leading-snug">{detail}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const IMPACT_TABS = [
  { id: 'interventions', label: 'Interventions' },
  { id: 'roi',           label: 'Platform ROI'  },
  { id: 'benchmarks',    label: 'Benchmarks'    },
  { id: 'adoption',      label: 'Adoption'      },
]

export default function ImpactLoop() {
  const [tab, setTab]              = useState('interventions')
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter]         = useState('all')

  const selectedEntry  = interventions.find(e => e.id === selectedId)
  const positiveCount  = interventions.filter(e => e.outcomeClassification === 'positive').length
  const negativeCount  = interventions.filter(e => e.outcomeClassification === 'negative' || e.outcomeClassification === 'harmful').length
  const unclearCount   = interventions.filter(e => e.outcomeClassification === 'unclear').length
  const lowDwellCount  = interventions.filter(e => e.dwellTimeMs > 0 && e.dwellTimeMs < 5000).length
  const avgAttrib      = Math.round((interventions.reduce((s, e) => s + e.attributionConfidence, 0) / interventions.length) * 100)
  const autoRunCount   = interventions.filter(e => e.decision === 'auto-executed').length
  const positiveRate   = Math.round(positiveCount / interventions.length * 100)
  const headerTone     = positiveRate >= 70 ? 'ok' : positiveRate >= 50 ? 'warn' : 'danger'

  const displayed = OUTCOME_MATCH[filter] ? interventions.filter(OUTCOME_MATCH[filter]) : interventions

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <SceneHeader
        metric={positiveRate}
        metricLabel="% positive outcome rate"
        tone={headerTone}
        statement={`${positiveCount} of ${interventions.length} AI interventions produced a positive outcome. Avg attribution confidence ${avgAttrib}%.${lowDwellCount > 0 ? ` ${lowDwellCount} decision${lowDwellCount !== 1 ? 's' : ''} under 5s — possible rubber-stamping.` : ''}`}
        meta={[
          { label: 'Avg confidence', value: `${avgAttrib}%` },
          { label: 'Low dwell',      value: String(lowDwellCount), color: lowDwellCount > 0 ? 'var(--color-warn)' : undefined },
          { label: 'Auto-run',       value: String(autoRunCount) },
        ]}
      />

      <Tabs tabs={IMPACT_TABS} active={tab} onChange={t => { setTab(t); setSelectedId(null) }} />

      {tab === 'interventions' && (
        <>
          {/* Outcome distribution strip */}
          <ScoreDistribution
            total={interventions.length}
            positiveCount={positiveCount}
            negativeCount={negativeCount}
            unclearCount={unclearCount}
            filter={filter}
            setFilter={v => { setFilter(v); setSelectedId(null) }}
            displayedCount={displayed.length}
          />

          {/* Two-column intervention grid */}
          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="flex items-center justify-center h-32 font-body text-muted text-body">
                No interventions in this category
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4">
                {displayed.map(e => (
                  <InterventionCard key={e.id} entry={e} onClick={() => setSelectedId(e.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Detail SlidePanel */}
          {selectedEntry && (
            <SlidePanel
              title={selectedEntry.action}
              subtitle={`${selectedEntry.agent} · ${selectedEntry.timeLabel}`}
              accentColor={
                selectedEntry.outcomeClassification === 'positive' ? 'var(--color-ok)'
                : selectedEntry.outcomeClassification === 'unclear' ? 'var(--color-signal)'
                : 'var(--color-danger)'
              }
              onClose={() => setSelectedId(null)}
              maxWidth="520px"
            >
              <InterventionDetail entry={selectedEntry} />
            </SlidePanel>
          )}
        </>
      )}

      {tab === 'roi'        && <PlatformROI />}
      {tab === 'benchmarks' && <BenchmarksTab />}
      {tab === 'adoption'   && <AdoptionTab />}
    </div>
  )
}

