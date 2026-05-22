import { useState } from 'react'
import { Link } from 'react-router-dom'
import { interventions, kpiTargets } from '../data/interventions'
import { AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { StatusPill, SceneHeader, Btn } from '../components/UI'

const OUTCOME_CFG = {
  positive: { label: 'Positive', tone: 'ok',     dot: 'bg-ok',     border: 'border-l-ok',     chip: 'bg-ok/10 text-ok'           },
  negative: { label: 'Negative', tone: 'danger', dot: 'bg-danger', border: 'border-l-danger', chip: 'bg-danger/[0.04] text-danger',
              desc: null },
  unclear:  { label: 'Inconclusive', tone: 'ochre', dot: 'bg-ochre', border: 'border-l-ochre', chip: 'bg-ochre/10 text-ochre',
              desc: "Effect couldn't be isolated — multiple concurrent changes affected this outcome simultaneously. Attribution confidence is reduced." },
  harmful:  { label: 'Harmful',  tone: 'danger', dot: 'bg-danger', border: 'border-l-danger', chip: 'bg-danger/[0.04] text-danger',
              desc: null },
}

const DECISION_CFG = {
  approved:        { label: 'Approved',   cls: 'text-ok'    },
  rejected:        { label: 'Rejected',   cls: 'text-warn'  },
  'auto-executed': { label: 'Auto-run',   cls: 'text-ochre' },
  overridden:      { label: 'Overridden', cls: 'text-muted' },
}

const FRESHNESS_CFG = {
  fresh:    { label: 'Fresh',    cls: 'text-ok'     },
  degraded: { label: 'Degraded', cls: 'text-warn'   },
  stale:    { label: 'Stale',    cls: 'text-danger' },
  unknown:  { label: 'Unknown',  cls: 'text-muted'  },
}


const formatKey = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()

function DwellBadge({ ms }) {
  if (ms === 0) return <span className="font-body text-muted text-label">Auto</span>
  const secs = Math.round(ms / 1000)
  const color = secs < 5 ? 'text-danger' : secs < 15 ? 'text-warn' : 'text-ok'
  return <span className={`font-body text-label tabular-nums ${color}`}>{secs}s review</span>
}


function ChapterHeader({label, accent = 'bg-rule2' }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-[3px] h-3.5 flex-shrink-0 rounded-sm ${accent}`} />
      <span className="font-body text-micro font-semibold text-muted tracking-wider">{label}</span>
    </div>
  )
}

function EventChain({ entry, compact = false }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const fc = FRESHNESS_CFG[entry.freshnessState] ?? FRESHNESS_CFG.unknown

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-label font-body flex-wrap">
        <span className="text-muted">{entry.agent}</span>
        <ArrowRight size={8} className="text-rule2 flex-shrink-0" />
        <span className={dc.cls}>{dc.label}</span>
        <ArrowRight size={8} className="text-rule2 flex-shrink-0" />
        <span className={oc.dot.replace('bg-', 'text-')}>{oc.label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-stretch gap-0">
      <div className="flex-1 min-w-0 px-3 py-2.5 bg-stone2">
        <div className="font-body text-muted text-micro mb-0.5">AI observation</div>
        <div className="font-body text-ink text-label leading-snug truncate">{entry.agent}</div>
        <div className={`font-body text-label ${fc.cls}`}>{fc.label} signals</div>
        <div className="font-body text-muted text-label">{Math.round(entry.signalCompleteness * 100)}% complete</div>
      </div>
      <div className="flex items-center px-1 text-rule2">
        <ArrowRight size={10} />
      </div>
      <div className="flex-1 min-w-0 px-3 py-2.5 bg-stone2">
        <div className="font-body text-muted text-micro mb-0.5">Human decision</div>
        <div className={`font-body font-medium text-label ${dc.cls}`}>{dc.label}</div>
        <div className="font-body text-muted text-label">{entry.reviewedBy}</div>
        <DwellBadge ms={entry.dwellTimeMs} />
      </div>
      <div className="flex items-center px-1 text-rule2">
        <ArrowRight size={10} />
      </div>
      <div className={`flex-1 min-w-0 px-3 py-2.5 border ${
        entry.outcomeClassification === 'positive' ? 'bg-ok/[0.04] border-ok/20' :
        entry.outcomeClassification === 'unclear'  ? 'bg-ochre/[0.04] border-ochre/30' :
        'bg-stone2 border-rule2'
      }`}>
        <div className="font-body text-muted text-micro mb-0.5">Consequence</div>
        <div className="font-body font-medium text-label">
          <span className={`inline-flex items-center gap-1 ${
            entry.outcomeClassification === 'positive' ? 'text-ok' :
            entry.outcomeClassification === 'unclear'  ? 'text-ochre' : 'text-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${oc.dot}`} />
            {oc.label}
          </span>
        </div>
        {entry.kpiDelta && (
          <div className="font-body text-label text-muted leading-snug">{entry.kpiDelta.metric}</div>
        )}
        <div className="font-body text-muted text-label">
          {entry.attributionConfidence != null ? `${Math.round(entry.attributionConfidence * 100)}%` : '—'} attribution
        </div>
      </div>
    </div>
  )
}

function InterventionCard({ entry, selected, onClick, index = 0 }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 border-l-4 ${oc.border} transition-colors row-in card-lift ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <StatusPill tone={oc.tone} className="mb-1.5">{oc.label}</StatusPill>
          <div className="font-body font-medium text-ink text-body leading-snug mb-0.5">{entry.action}</div>
          <div className="font-body text-muted text-label">{entry.recommendedLabel}</div>
        </div>
      </div>
      <EventChain entry={entry} compact />
      {entry.cautionNote && (
        <div className="flex items-center gap-1 mt-1.5">
          <AlertCircle size={8} className="text-warn flex-shrink-0" />
          <span className="font-body text-warn text-label">{entry.cautionNote}</span>
        </div>
      )}
      {entry.kpiDelta && (
        <div className="flex items-center gap-2 mt-1.5">
          {entry.kpiDelta.direction === 'improvement'
            ? <TrendingUp size={9} className="text-ok" strokeWidth={2} />
            : entry.kpiDelta.direction === 'degradation'
              ? <TrendingDown size={9} className="text-warn" strokeWidth={2} />
              : null}
          <span className="font-body text-muted text-label">
            {entry.kpiDelta.metric}: {entry.kpiDelta.before} → {entry.kpiDelta.after}
          </span>
        </div>
      )}
    </button>
  )
}

function InterventionDetail({ entry }) {
  if (!entry) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      Select an intervention to read the full story arc
    </div>
  )

  const oc  = OUTCOME_CFG[entry.outcomeClassification]  ?? OUTCOME_CFG.unclear
  const dc  = DECISION_CFG[entry.decision]               ?? DECISION_CFG.approved
  const fc  = FRESHNESS_CFG[entry.freshnessState]        ?? FRESHNESS_CFG.unknown
  const isNegative = entry.outcomeClassification === 'negative' || entry.outcomeClassification === 'harmful'
  const kpi = kpiTargets.find(k => k.id === entry.kpiTarget)

  const nextQuestion = isNegative
    ? 'This outcome suggests a systemic gap. If it reflects a recurring pattern, a CAPA formalizes the corrective action and creates an audit-ready evidence record.'
    : entry.outcomeClassification === 'unclear'
      ? "Effect couldn't be isolated — consider extending the monitoring window or flagging for manual review before treating this as a validated pattern."
      : entry.wasReversed
        ? 'The intervention achieved its goal and was safely reversed. Review the reversal trigger conditions to optimize the autonomy boundary for this agent.'
        : entry.attributionConfidence >= 0.8
          ? `Attribution is ${Math.round(entry.attributionConfidence * 100)}% — high enough to treat this as a validated pattern. Consider this signal class when expanding agent autonomy.`
          : `Attribution is ${Math.round(entry.attributionConfidence * 100)}% — moderate confidence. Gather more confirmation before treating this as a validated pattern.`

  const consequenceAccent = entry.outcomeClassification === 'positive' ? 'bg-ok'
    : entry.outcomeClassification === 'unclear' ? 'bg-ochre'
    : 'bg-danger'

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-rule2">
        <div className="flex items-center gap-2 mb-2">
          <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
          <span className="font-body text-muted text-label">{entry.agent} · {entry.agentTier} tier</span>
          {entry.wasReversed && (
            <span className="flex items-center gap-1 font-body text-muted text-label ml-auto">
              <RotateCcw size={8} strokeWidth={2} />Reversed
            </span>
          )}
        </div>
        <div className="font-display font-bold text-ink text-subhead leading-tight">{entry.action}</div>
        <div className="font-body text-muted text-label mt-0.5">{entry.recommendedLabel}</div>
        {oc.desc && (
          <div className="font-body text-muted text-label mt-2 pl-3 border-l-2 border-ochre/40 leading-snug">{oc.desc}</div>
        )}
      </div>

      {/* ── Chapter 1: The deviation ───────────────────────────────── */}
      <div className="px-6 py-5 border-b border-rule2">
        <ChapterHeader label="Deviation" accent="bg-ochre" />

        {/* What the AI detected */}
        <div className="px-4 py-3 bg-stone2 border-l-4 border-l-ochre mb-4">
          <div className="font-body text-muted text-label mb-1">What the AI detected</div>
          <p className="font-display text-ink text-body leading-relaxed">{entry.rationaleText}</p>
        </div>

        {/* KPI target context */}
        {kpi && (
          <div className="flex items-center gap-4 px-4 py-2.5 border border-rule2 bg-stone mb-4">
            <div className="flex-1 min-w-0">
              <span className="font-body text-muted text-label">Tracking </span>
              <span className="font-body text-ink text-label font-medium">{kpi.label}</span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="font-body text-muted text-label">Baseline <span className="text-ink font-medium">{kpi.baseline} {kpi.unit}</span></span>
              <span className="font-body text-muted text-label">Target <span className="text-ok font-medium">{kpi.target}</span></span>
            </div>
          </div>
        )}

        {/* Source signals */}
        <div className="font-body text-muted text-label mb-2">
          Source signals · <span className={fc.cls}>{fc.label}</span> · {Math.round(entry.signalCompleteness * 100)}% complete
        </div>
        <div className="border border-rule2 divide-y divide-rule2">
          {entry.sourceSignals.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${s.stale ? 'bg-warn/[0.02]' : ''}`}>
              <div className="flex-1">
                <div className="font-body text-ink text-label">{s.name}</div>
                <div className="font-body text-muted text-label">{s.value} vs baseline {s.baseline}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <StatusPill tone={oc.tone} className="mb-1.5">{oc.label}</StatusPill>
                <div className={`font-body text-label ${s.stale ? 'text-warn' : 'text-ok'}`}>{s.stale ? 'Stale' : 'Fresh'}</div>
                <div className="font-body text-muted text-micro">{s.freshnessMin}min ago</div>
              </div>
            </div>
          ))}
        </div>
        {entry.sourceSignals.some(s => s.stale) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle size={9} className="text-warn" strokeWidth={2} />
            <span className="font-body text-warn text-label">Stale signals at decision time — confidence reduced</span>
          </div>
        )}
      </div>

      {/* ── Chapter 2: The decision ────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-rule2">
        <ChapterHeader label="Decision" accent="bg-muted" />

        <EventChain entry={entry} compact={false} />

        {entry.overrideReason && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-warn/[0.04] border-l-2 border-l-warn">
            <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="font-body text-warn text-label leading-snug">{entry.overrideReason}</p>
          </div>
        )}
        {entry.cautionNote && (
          <div className="flex items-center gap-1.5 mt-3">
            <AlertCircle size={9} className="text-warn flex-shrink-0" />
            <span className="font-body text-warn text-label">{entry.cautionNote}</span>
          </div>
        )}
      </div>

      {/* ── Chapter 3: The consequence ─────────────────────────────── */}
      <div className="px-6 py-5 border-b border-rule2">
        <ChapterHeader label="Consequence" accent={consequenceAccent} />

        {/* Before → After */}
        {entry.metricsAfter && (
          <div className="mb-4">
            <div className="font-body text-muted text-label mb-2">Before → After · {entry.metricsUpdatedLabel}</div>
            <div className="grid grid-cols-2 gap-px bg-rule2">
              <div className="bg-stone px-3 py-2">
                <div className="font-body text-muted text-label mb-2">Before</div>
                {Object.entries(entry.metricsBefore).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-1 border-b border-rule2 last:border-0">
                    <span className="font-body text-muted text-label">{formatKey(k)}</span>
                    <span className="display-num text-base text-muted tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-stone px-3 py-2">
                <div className="font-body text-muted text-label mb-2">After</div>
                {Object.entries(entry.metricsAfter).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-1 border-b border-rule2 last:border-0">
                    <span className="font-body text-muted text-label">{formatKey(k)}</span>
                    <span className="display-num text-base text-ink tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI impact */}
        {entry.kpiDelta && (
          <div className={`px-4 py-3 border mb-4 ${
            entry.kpiDelta.direction === 'improvement' ? 'bg-ok/[0.04] border-ok/20' :
            entry.kpiDelta.direction === 'degradation' ? 'bg-warn/[0.04] border-warn/20' :
            'border-rule2 bg-stone2'
          }`}>
            <div className="font-body text-muted text-label mb-1">KPI impact · {entry.kpiDelta.metric}</div>
            <div className="flex items-center gap-3">
              <span className="font-body text-muted text-body">{entry.kpiDelta.before}</span>
              <ArrowRight size={12} className="text-muted" />
              <span className={`display-num text-head ${
                entry.kpiDelta.direction === 'improvement' ? 'text-ok' :
                entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-ink'
              }`}>{entry.kpiDelta.after}</span>
              {entry.kpiDelta.pct !== undefined && (
                <span className={`font-body text-label ${entry.kpiDelta.pct > 0 ? 'text-ok' : 'text-warn'}`}>
                  {entry.kpiDelta.pct > 0 ? '+' : ''}{entry.kpiDelta.pct}%
                </span>
              )}
            </div>
            <div className="font-body text-muted text-label mt-1.5">
              Attribution confidence: {entry.attributionConfidence != null ? `${Math.round(entry.attributionConfidence * 100)}%` : '—'}
            </div>
          </div>
        )}

        {/* Operator confirmation */}
        {entry.operatorConfirmation ? (
          <div className="flex items-start gap-3 px-4 py-3 bg-ok/[0.04] border-l-4 border-l-ok">
            <CheckCircle2 size={12} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-body text-muted text-label mb-0.5">Confirmed by operator</div>
              <div className="font-body font-medium text-ink text-label">{entry.operatorConfirmation.confirmedBy} · {entry.operatorConfirmation.station}</div>
              <div className="font-body text-ok text-label">{entry.operatorConfirmation.note}</div>
              <div className="font-body text-muted text-label mt-0.5">{entry.operatorConfirmation.confirmedAt}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-stone2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
            <span className="font-body text-muted text-label">No operator confirmation — outcome estimated from telemetry</span>
          </div>
        )}
      </div>

      {/* ── Chapter 4: What this means ─────────────────────────────── */}
      <div className="px-6 py-5">
        <ChapterHeader label="What this means" accent="bg-rule2" />

        {/* Outcome narrative */}
        <div className="px-4 py-3 bg-stone2 mb-4">
          <div className="font-body text-muted text-label mb-1">What happened</div>
          <p className="font-display text-ink text-body leading-relaxed">{entry.outcomeNotes}</p>
        </div>

        {/* Reversal record */}
        {entry.wasReversed && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-stone2 mb-4">
            <RotateCcw size={10} className="text-muted flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="font-body font-medium text-ink text-label mb-0.5">Intervention reversed — {entry.reversedAt}</div>
              <p className="font-body text-muted text-label leading-snug">{entry.reversalReason}</p>
            </div>
          </div>
        )}

        {/* Director action — negative outcomes */}
        {isNegative && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-danger/[0.025] border-l-4 border-l-danger mb-4">
            <div className="flex-1 min-w-0">
              <div className="font-body font-medium text-ink text-body">Negative outcome — corrective action available</div>
              <div className="font-body text-muted text-label mt-0.5">
                If this result reflects a systemic gap, a CAPA formalizes the corrective action and creates an audit-ready evidence record.
              </div>
            </div>
            <Link to="/capa" className="flex-shrink-0">
              <Btn variant="secondary">Open CAPA</Btn>
            </Link>
          </div>
        )}

        {/* The question this raises */}
        <div className="px-4 py-3 border-l-4 border-l-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">The question this raises</div>
          <p className="font-body text-ink text-body leading-relaxed">{nextQuestion}</p>
        </div>
      </div>

    </div>
  )
}

export default function ImpactLoop() {
  const [selectedId, setSelectedId] = useState(interventions[0]?.id ?? null)

  const selectedEntry = interventions.find(e => e.id === selectedId)
  const positiveCount = interventions.filter(e => e.outcomeClassification === 'positive').length
  const lowDwellCount = interventions.filter(e => e.dwellTimeMs > 0 && e.dwellTimeMs < 5000).length
  const avgAttrib = Math.round((interventions.reduce((s, e) => s + e.attributionConfidence, 0) / interventions.length) * 100)
  const autoRunCount = interventions.filter(e => e.decision === 'auto-executed').length
  const positiveRate = Math.round(positiveCount / interventions.length * 100)
  const headerTone = positiveRate >= 70 ? 'ok' : positiveRate >= 50 ? 'warn' : 'danger'

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <SceneHeader
        module="OUTCOMES"
        context="Salina Campus · Last 30 days"
        metric={positiveRate}
        metricLabel="% positive outcome rate"
        tone={headerTone}
        statement={`${positiveCount} of ${interventions.length} AI interventions produced a positive outcome. Avg attribution confidence ${avgAttrib}%.${lowDwellCount > 0 ? ` ${lowDwellCount} decision${lowDwellCount !== 1 ? 's' : ''} under 5s — possible rubber-stamping.` : ''}`}
        meta={[
          { label: 'Avg confidence', value: `${avgAttrib}%` },
          { label: 'Low dwell', value: String(lowDwellCount), color: lowDwellCount > 0 ? 'var(--color-warn)' : undefined },
          { label: 'Auto-run', value: String(autoRunCount) },
        ]}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: list ────────────────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
          <div className="flex-1 overflow-y-auto">
            {interventions.map((e, i) => (
              <InterventionCard key={e.id} entry={e} index={i}
                selected={selectedId === e.id}
                onClick={() => setSelectedId(e.id)} />
            ))}
          </div>
        </div>

        {/* ── Right: detail ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-stone">
          {selectedEntry && (
            <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
              <span className="font-body text-muted text-label truncate block">{selectedEntry.action}</span>
            </div>
          )}
          <InterventionDetail entry={selectedEntry} />
        </div>

      </div>
    </div>
  )
}
