import { useState } from 'react'
import { Link } from 'react-router-dom'
import { interventions, kpiTargets } from '../data/interventions'
import { AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, AlertCircle, TrendingUp, TrendingDown, Zap, Clock, Layers } from 'lucide-react'
import { StatusPill, SceneHeader, Btn, AnimatedScore, StatGrid, EmptyState } from '../components/UI'

const OUTCOME_CFG = {
  positive: { label: 'Positive',     tone: 'ok',     border: 'border-l-ok',     accent: 'bg-ok'     },
  negative: { label: 'Negative',     tone: 'danger', border: 'border-l-danger', accent: 'bg-danger' },
  unclear:  { label: 'Inconclusive', tone: 'signal', border: 'border-l-signal', accent: 'bg-signal',
              desc: "Effect couldn't be isolated — multiple concurrent changes affected this outcome simultaneously." },
  harmful:  { label: 'Harmful',      tone: 'danger', border: 'border-l-danger', accent: 'bg-danger' },
}

const DECISION_CFG = {
  approved:        { label: 'Approved',   cls: 'text-ok'     },
  rejected:        { label: 'Rejected',   cls: 'text-warn'   },
  'auto-executed': { label: 'Auto-run',   cls: 'text-signal' },
  overridden:      { label: 'Overridden', cls: 'text-muted'  },
}

const formatKey = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()

function DwellBadge({ ms }) {
  if (ms === 0) return <span className="font-body text-muted text-label">Auto</span>
  const secs = Math.round(ms / 1000)
  const color = secs < 5 ? 'text-danger' : secs < 15 ? 'text-warn' : 'text-ok'
  return <span className={`font-body text-label tabular-nums ${color}`}>{secs}s</span>
}


function InterventionCard({ entry, selected, onClick }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 border-l-4 ${oc.border} transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
        {entry.kpiDelta && (
          <span className={`font-body text-label font-medium tabular-nums flex-shrink-0 ${
            entry.kpiDelta.direction === 'improvement' ? 'text-ok' :
            entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-muted'
          }`}>{entry.kpiDelta.after}</span>
        )}
      </div>
      <div className="font-body font-medium text-ink text-body leading-snug mb-1">{entry.action}</div>
      <div className="flex items-center gap-1.5">
        <span className="font-body text-ink text-label font-medium">{entry.agent}</span>
        <span className="font-body text-muted text-label opacity-40">·</span>
        <span className={`font-body text-label ${dc.cls}`}>{dc.label}</span>
      </div>
      {entry.cautionNote && (
        <div className="flex items-center gap-1 mt-1.5">
          <AlertCircle size={10} className="text-warn flex-shrink-0" />
          <span className="font-body text-warn text-label">{entry.cautionNote}</span>
        </div>
      )}
    </button>
  )
}

function InterventionDetail({ entry }) {
  if (!entry) return <EmptyState message="Select an intervention" sub="Read the full story arc" />

  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const kpi = kpiTargets.find(k => k.id === entry.kpiTarget)
  const isNegative = entry.outcomeClassification === 'negative' || entry.outcomeClassification === 'harmful'

  const nextQuestion = isNegative
    ? 'This outcome suggests a systemic gap. If it reflects a recurring pattern, a CAPA formalizes the corrective action and creates an audit-ready evidence record.'
    : entry.outcomeClassification === 'unclear'
      ? "Effect couldn't be isolated — consider extending the monitoring window or flagging for manual review before treating this as a validated pattern."
      : entry.wasReversed
        ? 'The intervention achieved its goal and was safely reversed. Review the reversal trigger conditions to optimize the autonomy boundary for this agent.'
        : entry.attributionConfidence >= 0.8
          ? `Attribution is ${Math.round(entry.attributionConfidence * 100)}% — high enough to treat this as a validated pattern. Consider this signal class when expanding agent autonomy.`
          : `Attribution is ${Math.round(entry.attributionConfidence * 100)}% — moderate confidence. Gather more confirmation before treating this as a validated pattern.`

  return (
    <div className="flex-1 overflow-y-auto page-rise">
      <div className="max-w-[720px] px-8 py-7">

        {/* Status row */}
        <div className="flex items-center gap-3 mb-5">
          <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
          <span className="font-body text-muted text-label">{entry.agent} · {entry.agentTier} tier</span>
          {entry.wasReversed && (
            <span className="flex items-center gap-1.5 font-body text-muted text-label ml-auto">
              <RotateCcw size={10} strokeWidth={2} />Reversed
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display font-bold text-ink text-metric leading-tight mb-2">{entry.action}</h2>
        <div className="font-body text-muted text-label mb-1">{entry.recommendedLabel}</div>
        {oc.desc && (
          <div className="font-body text-muted text-label mb-5 pl-3 border-l-2 border-signal/40 leading-snug">{oc.desc}</div>
        )}

        {/* ── WHAT THIS MEANS ──────────────────────────────────────────── */}
        <div className="font-body text-micro font-semibold text-muted tracking-wider mb-3 mt-6">What this means</div>

        <div className={`grid gap-3 mb-4 ${entry.outcomeNotes ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="border border-rule2 bg-stone2 px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
              <span className="font-body font-semibold text-ink text-body">The question this raises</span>
            </div>
            <p className="font-body text-muted text-label leading-relaxed">{nextQuestion}</p>
          </div>
          {entry.outcomeNotes && (
            <div className="border border-rule2 bg-stone2 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
                <span className="font-body font-semibold text-ink text-body">What happened</span>
              </div>
              <p className="font-body text-muted text-label leading-relaxed">{entry.outcomeNotes}</p>
            </div>
          )}
        </div>

        {entry.wasReversed && (
          <div className="flex items-start gap-3 border border-rule2 bg-stone2 px-4 py-4 mb-4">
            <RotateCcw size={12} strokeWidth={2} className="text-muted flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-body font-semibold text-ink text-body mb-1">Reversed — {entry.reversedAt}</div>
              <p className="font-body text-muted text-label leading-snug">{entry.reversalReason}</p>
            </div>
          </div>
        )}

        {isNegative && (
          <div className="flex items-center justify-between gap-4 px-4 py-4 bg-danger/[0.025] border border-danger/20 mb-7">
            <div className="flex-1 min-w-0">
              <div className="font-body font-semibold text-ink text-body mb-0.5">Corrective action available</div>
              <div className="font-body text-muted text-label">A CAPA formalizes this as a systemic gap and creates an audit-ready record.</div>
            </div>
            <Link to="/capa" className="flex-shrink-0">
              <Btn variant="secondary">Open CAPA</Btn>
            </Link>
          </div>
        )}

        {/* ── CONSEQUENCE ──────────────────────────────────────────────── */}
        <div className="font-body text-micro font-semibold text-muted tracking-wider mb-3 mt-7">Consequence</div>

        {entry.kpiDelta && (
          <div className={`border border-rule2 px-4 py-4 mb-4 ${
            entry.kpiDelta.direction === 'improvement' ? 'bg-ok/[0.04]' :
            entry.kpiDelta.direction === 'degradation' ? 'bg-warn/[0.04]' : 'bg-stone2'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {entry.kpiDelta.direction === 'improvement'
                ? <TrendingUp size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
                : <TrendingDown size={12} strokeWidth={2} className="text-warn flex-shrink-0" />
              }
              <span className="font-body font-semibold text-ink text-body">{entry.kpiDelta.metric}</span>
              {entry.kpiDelta.pct !== undefined && (
                <span className={`font-body text-label font-bold px-2 py-0.5 ml-auto flex-shrink-0 ${
                  entry.kpiDelta.pct > 0 ? 'text-ok bg-ok/10' : 'text-warn bg-warn/10'
                }`}>
                  {entry.kpiDelta.pct > 0 ? '+' : ''}<AnimatedScore value={entry.kpiDelta.pct} suffix="%" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-body text-muted text-body">{entry.kpiDelta.before}</span>
              <ArrowRight size={12} className="text-muted" />
              <span className={`display-num text-head ${
                entry.kpiDelta.direction === 'improvement' ? 'text-ok' :
                entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-ink'
              }`}>{entry.kpiDelta.after}</span>
            </div>
            <div className="font-body text-muted text-label">
              Attribution confidence: {entry.attributionConfidence != null ? `${Math.round(entry.attributionConfidence * 100)}%` : '—'}
            </div>
          </div>
        )}

        {entry.metricsAfter && (
          <div className="mb-4">
            <div className="font-body text-muted text-label mb-2">Before → After · {entry.metricsUpdatedLabel}</div>
            <StatGrid cols={2} noBorder>
              <div className="bg-stone px-3 py-2">
                <div className="font-body text-muted text-label mb-2">Before</div>
                {Object.entries(entry.metricsBefore).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-1 border-b border-rule2 last:border-0">
                    <span className="font-body text-muted text-label">{formatKey(k)}</span>
                    <span className="font-body text-muted text-label tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-stone px-3 py-2">
                <div className="font-body text-muted text-label mb-2">After</div>
                {Object.entries(entry.metricsAfter).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-1 border-b border-rule2 last:border-0">
                    <span className="font-body text-muted text-label">{formatKey(k)}</span>
                    <span className="font-body text-ink text-label font-medium tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </StatGrid>
          </div>
        )}

        {entry.operatorConfirmation ? (
          <div className="flex items-start gap-3 px-4 py-4 bg-ok/[0.04] border border-ok/20 mb-7">
            <CheckCircle2 size={12} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-body font-semibold text-ink text-body mb-0.5">Confirmed by operator</div>
              <div className="font-body text-muted text-label">{entry.operatorConfirmation.confirmedBy} · {entry.operatorConfirmation.station}</div>
              <div className="font-body text-ok text-label mt-0.5">{entry.operatorConfirmation.note}</div>
              <div className="font-body text-muted text-label mt-0.5">{entry.operatorConfirmation.confirmedAt}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-stone2 border border-rule2 mb-7">
            <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
            <span className="font-body text-muted text-label">No operator confirmation — outcome estimated from telemetry</span>
          </div>
        )}

        {/* ── DECISION ─────────────────────────────────────────────────── */}
        <div className="font-body text-micro font-semibold text-muted tracking-wider mb-3 mt-7">Decision</div>

        <div className="border border-rule2 bg-stone2 divide-y divide-rule2 mb-4">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-body text-muted text-label flex-1">Decision</span>
            <span className={`font-body text-label font-medium ${dc.cls}`}>{dc.label}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-body text-muted text-label flex-1">Reviewed by</span>
            <span className="font-body text-ink text-label">{entry.reviewedBy}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-body text-muted text-label flex-1">Review time</span>
            <DwellBadge ms={entry.dwellTimeMs} />
          </div>
        </div>

        {entry.overrideReason && (
          <div className="flex items-start gap-2 px-4 py-3 bg-warn/[0.04] border border-warn/20 mb-4">
            <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="font-body text-warn text-label leading-snug">{entry.overrideReason}</p>
          </div>
        )}
        {entry.cautionNote && (
          <div className="flex items-center gap-1.5 mb-7">
            <AlertCircle size={9} className="text-warn flex-shrink-0" />
            <span className="font-body text-warn text-label">{entry.cautionNote}</span>
          </div>
        )}

        {/* ── WHAT TRIGGERED THIS ──────────────────────────────────────── */}
        <div className="font-body text-micro font-semibold text-muted tracking-wider mb-3 mt-7">What triggered this</div>

        <div className="border border-rule2 bg-stone2 px-4 py-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
            <span className="font-body font-semibold text-ink text-body">What the AI detected</span>
          </div>
          <p className="font-body text-muted text-label leading-relaxed">{entry.rationaleText}</p>
        </div>

        {kpi && (
          <div className="border border-rule2 bg-stone px-4 py-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
              <span className="font-body font-semibold text-muted text-body">Tracking {kpi.label}</span>
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
        {entry.sourceSignals.some(s => s.stale) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle size={9} className="text-warn" strokeWidth={2} />
            <span className="font-body text-warn text-label">Some signals were stale at decision time — confidence reduced</span>
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const OUTCOME_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'positive', label: 'Positive',     match: e => e.outcomeClassification === 'positive' },
  { id: 'negative', label: 'Negative',     match: e => e.outcomeClassification === 'negative' || e.outcomeClassification === 'harmful' },
  { id: 'unclear',  label: 'Inconclusive', match: e => e.outcomeClassification === 'unclear' },
]

export default function ImpactLoop() {
  const [selectedId, setSelectedId] = useState(interventions[0]?.id ?? null)
  const [filter, setFilter]         = useState('all')

  const selectedEntry  = interventions.find(e => e.id === selectedId)
  const positiveCount  = interventions.filter(e => e.outcomeClassification === 'positive').length
  const lowDwellCount  = interventions.filter(e => e.dwellTimeMs > 0 && e.dwellTimeMs < 5000).length
  const avgAttrib      = Math.round((interventions.reduce((s, e) => s + e.attributionConfidence, 0) / interventions.length) * 100)
  const autoRunCount   = interventions.filter(e => e.decision === 'auto-executed').length
  const positiveRate   = Math.round(positiveCount / interventions.length * 100)
  const headerTone     = positiveRate >= 70 ? 'ok' : positiveRate >= 50 ? 'warn' : 'danger'

  const activeFilter = OUTCOME_FILTERS.find(f => f.id === filter)
  const displayed    = activeFilter.match ? interventions.filter(activeFilter.match) : interventions

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <SceneHeader
        module="Outcomes"
        context="Salina Campus · Last 30 days"
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

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: filter + list ───────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

          {/* Outcome filter tabs */}
          <div className="flex flex-shrink-0 border-b border-rule2">
            {OUTCOME_FILTERS.map(f => {
              const count = f.match ? interventions.filter(f.match).length : interventions.length
              const isActive = filter === f.id
              return (
                <button key={f.id} type="button"
                  onClick={() => { setFilter(f.id); setSelectedId(displayed[0]?.id ?? null) }}
                  className={`flex-1 px-2 py-2 font-body text-label border-r border-rule2 last:border-r-0 transition-colors ${
                    isActive ? 'text-ink bg-stone2' : 'text-muted hover:text-ink hover:bg-stone2/50'
                  }`}>
                  <div>{f.label}</div>
                  <div className={`tabular-nums ${
                    f.id === 'negative' && count > 0 && !isActive ? 'text-danger' : isActive ? 'text-ink' : 'text-muted'
                  }`}>{count}</div>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <EmptyState message="No interventions in this category" />
            ) : (
              displayed.map(e => (
                <InterventionCard key={e.id} entry={e}
                  selected={selectedId === e.id}
                  onClick={() => setSelectedId(e.id)} />
              ))
            )}
          </div>
        </div>

        {/* ── Right: detail ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-stone">
          <InterventionDetail entry={selectedEntry} />
        </div>

      </div>
    </div>
  )
}
