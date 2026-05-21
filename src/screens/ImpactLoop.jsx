import { useState } from 'react'
import { Link } from 'react-router-dom'
import { interventions } from '../data/interventions'
import { AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { AlluvialDiagram } from '../components/Charts'
import { StatusPill, SceneHeader, Btn } from '../components/UI'

const OUTCOME_CFG = {
  positive: { label: 'Positive', tone: 'ok',     dot: 'bg-ok',     border: 'border-l-ok',     chip: 'bg-ok/10 text-ok'           },
  negative: { label: 'Negative', tone: 'danger', dot: 'bg-danger', border: 'border-l-danger', chip: 'bg-danger/[0.04] text-danger',
              desc: null },
  unclear:  { label: 'Unclear',  tone: 'ochre',  dot: 'bg-ochre',  border: 'border-l-ochre',  chip: 'bg-ochre/10 text-ochre',
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

const OUTCOME_FILTERS = [
  { value: null,       label: 'All',      chip: 'bg-stone3 text-muted',              dot: 'bg-muted'  },
  { value: 'positive', label: 'Positive', chip: 'bg-ok/10 text-ok',                 dot: 'bg-ok'     },
  { value: 'unclear',  label: 'Unclear',  chip: 'bg-ochre/10 text-ochre',           dot: 'bg-ochre'  },
  { value: 'negative', label: 'Negative', chip: 'bg-danger/[0.04] text-danger',     dot: 'bg-danger' },
  { value: 'harmful',  label: 'Harmful',  chip: 'bg-danger/[0.04] text-danger',     dot: 'bg-danger' },
]

const formatKey = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()

function DwellBadge({ ms }) {
  if (ms === 0) return <span className="font-body text-muted text-label">Auto</span>
  const secs = Math.round(ms / 1000)
  const color = secs < 5 ? 'text-danger' : secs < 15 ? 'text-warn' : 'text-ok'
  return <span className={`font-body text-label tabular-nums ${color}`}>{secs}s review</span>
}

function FilterChip({ active, tone, dot, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 font-body font-medium text-label px-2 py-0.5 transition-colors whitespace-nowrap ${
        active ? tone : 'bg-stone3 text-muted hover:text-ink'
      }`}>
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${dot ?? 'bg-current'}`} />
      {children}
    </button>
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

function InterventionCard({ entry, selected, onClick }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 border-l-4 ${oc.border} transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <StatusPill tone={oc.tone} className="mb-1.5">{oc.label}</StatusPill>
          <div className="font-display font-medium text-ink text-base leading-snug mb-0.5">{entry.action}</div>
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

function InterventionDetail({ entry, allInterventions }) {
  if (!entry) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      Select an intervention to see the full event chain
    </div>
  )

  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const fc = FRESHNESS_CFG[entry.freshnessState] ?? FRESHNESS_CFG.unknown
  const isNegativeOutcome = entry.outcomeClassification === 'negative' || entry.outcomeClassification === 'harmful'

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

      {/* Header */}
      <div>
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
          <div className="font-body text-muted text-label mt-2 pl-3 border-l-2 border-ochre/40 leading-snug">
            {oc.desc}
          </div>
        )}
      </div>

      {/* Director action — negative/harmful outcomes can become CAPAs */}
      {isNegativeOutcome && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-danger/[0.025] border-l-4 border-l-danger">
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

      {/* Event chain */}
      <div>
        <div className="font-body text-muted text-label mb-2">Event chain</div>
        <EventChain entry={entry} compact={false} />
      </div>

      {/* AI rationale */}
      <div className="px-4 py-3 bg-stone2 border-l-4 border-l-ochre">
        <div className="font-body text-muted text-label mb-1">AI rationale</div>
        <p className="font-display text-ink text-body leading-relaxed">{entry.rationaleText}</p>
      </div>

      {/* Source signals */}
      <div>
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

      {/* Decision metadata */}
      <div className="grid grid-cols-3 gap-px bg-rule2">
        {[
          { label: 'Decision',        val: dc.label,                                                                                           tone: dc.cls },
          { label: 'Reviewed by',     val: entry.reviewedBy,                                                                                  tone: 'text-ink' },
          { label: 'Dwell time',      val: entry.dwellTimeMs > 0 ? `${(entry.dwellTimeMs / 1000).toFixed(1)}s` : 'Auto',                      tone: entry.dwellTimeMs > 0 && entry.dwellTimeMs < 5000 ? 'text-danger' : entry.dwellTimeMs < 15000 ? 'text-warn' : 'text-ok' },
          { label: 'Decision time',   val: entry.decisionLabel,                                                                                tone: 'text-muted' },
          { label: 'Override reason', val: entry.overrideReason ?? 'None',                                                                    tone: entry.overrideReason ? 'text-ink' : 'text-muted' },
          { label: 'Caution',         val: entry.cautionNote ?? 'None',                                                                       tone: entry.cautionNote ? 'text-warn' : 'text-muted' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-muted text-label mb-0.5">{label}</div>
            <div className={`font-body font-medium text-label leading-snug ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Before → After metrics */}
      {entry.metricsAfter && (
        <div>
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
        <div className={`px-4 py-3 border ${
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
              entry.kpiDelta.direction === 'degradation' ? 'text-warn' :
              'text-ink'
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

      {/* Outcome narrative */}
      <div className="px-4 py-3 bg-stone2">
        <div className="font-body text-muted text-label mb-1">Outcome narrative</div>
        <p className="font-display text-ink text-body leading-relaxed">{entry.outcomeNotes}</p>
      </div>

      {/* Reversal record */}
      {entry.wasReversed && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-stone2">
          <RotateCcw size={10} className="text-muted flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="font-body font-medium text-ink text-label mb-0.5">Intervention reversed — {entry.reversedAt}</div>
            <p className="font-body text-muted text-label leading-snug">{entry.reversalReason}</p>
          </div>
        </div>
      )}

      {/* Intervention flow — embedded */}
      <div>
        <div className="font-body text-muted text-label mb-1">Intervention flow — all decisions this period</div>
        <p className="font-display text-muted text-label leading-relaxed mb-3">
          How all interventions flow from agent recommendation through human decision to operational outcome. Width reflects count.
        </p>
        <AlluvialDiagram interventions={allInterventions} />
        <div className="mt-3 flex flex-wrap gap-3">
          {[['positive', 'Positive', 'text-ok'], ['unclear', 'Unclear', 'text-ochre'], ['negative', 'Negative', 'text-danger']].map(([k, l, cls]) => (
            <span key={k} className={`font-body text-label flex items-center gap-1 ${cls}`}>
              <span className="w-2 h-2 rounded-sm bg-current opacity-75" />{l}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}

export default function ImpactLoop() {
  const [selectedId, setSelectedId] = useState(interventions[0]?.id ?? null)
  const [outcomeFilter, setOutcomeFilter] = useState(null)

  const filtered = outcomeFilter
    ? interventions.filter(e => e.outcomeClassification === outcomeFilter)
    : interventions

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

        {/* ── Left: filter chips + list ─────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-rule2 flex-wrap">
            {OUTCOME_FILTERS.map(f => (
              <FilterChip
                key={f.value ?? 'all'}
                active={outcomeFilter === f.value}
                tone={f.chip}
                dot={f.dot}
                onClick={() => setOutcomeFilter(f.value)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full font-body text-muted text-label">
                No interventions match this filter
              </div>
            ) : filtered.map(e => (
              <InterventionCard key={e.id} entry={e}
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
          <InterventionDetail entry={selectedEntry} allInterventions={interventions} />
        </div>

      </div>
    </div>
  )
}
