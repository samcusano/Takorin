import { useState } from 'react'
import { interventions, interventionSummary, kpiTargets } from '../data/interventions'
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'


const OUTCOME_CFG = {
  positive: { label: 'Positive',  dot: 'bg-ok',     badge: 'bg-ok/10 text-ok border border-ok/30',       border: 'border-l-ok' },
  negative: { label: 'Negative',  dot: 'bg-danger',  badge: 'bg-danger/10 text-danger border border-danger/30', border: 'border-l-danger' },
  unclear:  { label: 'Unclear',   dot: 'bg-ochre',   badge: 'bg-ochre/10 text-ochre border border-ochre/30', border: 'border-l-ochre' },
  harmful:  { label: 'Harmful',   dot: 'bg-danger',  badge: 'bg-danger/10 text-danger border border-danger/30', border: 'border-l-danger' },
}

const DECISION_CFG = {
  approved:      { label: 'Approved',      cls: 'text-ok'    },
  rejected:      { label: 'Rejected',      cls: 'text-warn'  },
  'auto-executed': { label: 'Auto-executed', cls: 'text-ochre' },
  overridden:    { label: 'Overridden',    cls: 'text-muted' },
}

const FRESHNESS_CFG = {
  fresh:    { label: 'Fresh',    cls: 'text-ok' },
  degraded: { label: 'Degraded', cls: 'text-warn' },
  stale:    { label: 'Stale',    cls: 'text-danger' },
  unknown:  { label: 'Unknown',  cls: 'text-muted' },
}

function DwellBadge({ ms }) {
  if (ms === 0) return <span className="font-body text-ghost text-[9px]">Auto</span>
  const secs = Math.round(ms / 1000)
  const color = secs < 5 ? 'text-danger' : secs < 15 ? 'text-warn' : 'text-ok'
  return <span className={`font-body text-[9px] tabular-nums ${color}`}>{secs}s review</span>
}

function EventChain({ entry, compact = false }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const fc = FRESHNESS_CFG[entry.freshnessState] ?? FRESHNESS_CFG.unknown

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[9px] font-body flex-wrap">
        <span className="text-ghost">{entry.agent}</span>
        <ArrowRight size={8} className="text-rule2 flex-shrink-0" />
        <span className={dc.cls}>{dc.label}</span>
        <ArrowRight size={8} className="text-rule2 flex-shrink-0" />
        <span className={oc.dot.replace('bg-', 'text-').replace('ok', 'ok').replace('danger', 'danger').replace('ochre', 'ochre')}>
          {oc.label}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-stretch gap-0">
      {/* Step 1: AI observation */}
      <div className="flex-1 min-w-0 px-3 py-2.5 bg-stone2 border border-rule2">
        <div className="font-body text-ghost text-[8px] uppercase tracking-widest mb-0.5">AI observation</div>
        <div className="font-body text-ink text-[10px] leading-snug truncate">{entry.agent}</div>
        <div className={`font-body text-[9px] ${fc.cls}`}>{fc.label} signals</div>
        <div className="font-body text-ghost text-[9px]">{Math.round(entry.signalCompleteness * 100)}% complete</div>
      </div>
      <div className="flex items-center px-1 text-rule2">
        <ArrowRight size={10} />
      </div>
      {/* Step 2: Human decision */}
      <div className="flex-1 min-w-0 px-3 py-2.5 bg-stone2 border border-rule2">
        <div className="font-body text-ghost text-[8px] uppercase tracking-widest mb-0.5">Human decision</div>
        <div className={`font-body font-medium text-[10px] ${dc.cls}`}>{dc.label}</div>
        <div className="font-body text-ghost text-[9px]">{entry.reviewedBy}</div>
        <DwellBadge ms={entry.dwellTimeMs} />
      </div>
      <div className="flex items-center px-1 text-rule2">
        <ArrowRight size={10} />
      </div>
      {/* Step 3: Operational consequence */}
      <div className={`flex-1 min-w-0 px-3 py-2.5 border ${entry.outcomeClassification === 'positive' ? 'bg-ok/[0.04] border-ok/30' : entry.outcomeClassification === 'unclear' ? 'bg-ochre/[0.04] border-ochre/30' : 'bg-stone2 border-rule2'}`}>
        <div className="font-body text-ghost text-[8px] uppercase tracking-widest mb-0.5">Consequence</div>
        <div className={`font-body font-medium text-[10px]`}>
          <span className={`inline-flex items-center gap-1 ${entry.outcomeClassification === 'positive' ? 'text-ok' : entry.outcomeClassification === 'unclear' ? 'text-ochre' : 'text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${oc.dot}`} />
            {oc.label}
          </span>
        </div>
        {entry.kpiDelta && (
          <div className="font-body text-[9px] text-muted leading-snug">{entry.kpiDelta.metric}</div>
        )}
        <div className="font-body text-ghost text-[9px]">{entry.attributionConfidence != null ? `${Math.round(entry.attributionConfidence * 100)}%` : '—'} attribution</div>
      </div>
    </div>
  )
}

function InterventionCard({ entry, selected, onClick }) {
  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-4 border-b border-rule2 border-l-4 transition-colors ${
        selected ? `${oc.border} bg-stone2` : `border-l-transparent hover:bg-stone2/50`
      }`}>
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-body text-ink text-[11px] leading-snug mb-0.5">{entry.action}</div>
          <div className="font-body text-ghost text-[9px]">{entry.recommendedLabel}</div>
        </div>
        <span className={`font-body text-[8px] px-1.5 py-0.5 border flex-shrink-0 ${oc.badge}`}>{oc.label}</span>
      </div>
      <EventChain entry={entry} compact />
      {entry.cautionNote && (
        <div className="flex items-center gap-1 mt-1.5">
          <AlertCircle size={8} className="text-warn flex-shrink-0" />
          <span className="font-body text-warn text-[9px]">{entry.cautionNote}</span>
        </div>
      )}
      {entry.kpiDelta && (
        <div className="flex items-center gap-2 mt-1.5">
          {entry.kpiDelta.direction === 'improvement' ? (
            <TrendingUp size={9} className="text-ok" strokeWidth={2} />
          ) : entry.kpiDelta.direction === 'degradation' ? (
            <TrendingDown size={9} className="text-warn" strokeWidth={2} />
          ) : null}
          <span className="font-body text-ghost text-[9px]">{entry.kpiDelta.metric}: {entry.kpiDelta.before} → {entry.kpiDelta.after}</span>
        </div>
      )}
    </button>
  )
}

function InterventionDetail({ entry }) {
  if (!entry) return (
    <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
      Select an intervention to see the full event chain
    </div>
  )

  const oc = OUTCOME_CFG[entry.outcomeClassification] ?? OUTCOME_CFG.unclear
  const dc = DECISION_CFG[entry.decision] ?? DECISION_CFG.approved
  const fc = FRESHNESS_CFG[entry.freshnessState] ?? FRESHNESS_CFG.unknown

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-body text-[9px] px-1.5 py-0.5 border ${oc.badge}`}>{oc.label}</span>
          <span className="font-body text-ghost text-[9px]">{entry.agent} · {entry.agentTier} tier</span>
          {entry.wasReversed && (
            <span className="flex items-center gap-1 font-body text-muted text-[9px] ml-auto">
              <RotateCcw size={8} strokeWidth={2} />Reversed
            </span>
          )}
        </div>
        <div className="font-display font-bold text-ink text-[18px] leading-tight">{entry.action}</div>
        <div className="font-body text-ghost text-[11px] mt-0.5">{entry.recommendedLabel}</div>
      </div>

      {/* Event chain — full width */}
      <div>
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Event chain</div>
        <EventChain entry={entry} compact={false} />
      </div>

      {/* AI rationale */}
      <div className="px-4 py-3 bg-stone2 border border-rule2 border-l-4 border-l-ochre">
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">AI rationale</div>
        <p className="font-body text-ink text-[11px] leading-relaxed">{entry.rationaleText}</p>
      </div>

      {/* Source signals */}
      <div>
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">
          Source signals · <span className={fc.cls}>{fc.label}</span> · {Math.round(entry.signalCompleteness * 100)}% complete
        </div>
        <div className="border border-rule2 divide-y divide-rule2">
          {entry.sourceSignals.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${s.stale ? 'bg-warn/[0.02]' : ''}`}>
              <div className="flex-1">
                <div className="font-body text-ink text-[10px]">{s.name}</div>
                <div className="font-body text-ghost text-[9px]">{s.value} vs baseline {s.baseline}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-body text-[9px] ${s.stale ? 'text-warn' : 'text-ok'}`}>
                  {s.stale ? 'Stale' : 'Fresh'}
                </div>
                <div className="font-body text-ghost text-[8px]">{s.freshnessMin}min ago</div>
              </div>
            </div>
          ))}
        </div>
        {entry.sourceSignals.some(s => s.stale) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle size={9} className="text-warn" strokeWidth={2} />
            <span className="font-body text-warn text-[9px]">Stale signals at decision time — attribution confidence reduced</span>
          </div>
        )}
      </div>

      {/* Human decision */}
      <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
        {[
          { label: 'Decision', val: dc.label, tone: dc.cls },
          { label: 'Reviewed by', val: entry.reviewedBy, tone: 'text-ink' },
          { label: 'Rationale dwell', val: entry.dwellTimeMs > 0 ? `${(entry.dwellTimeMs / 1000).toFixed(1)}s` : 'Auto', tone: entry.dwellTimeMs > 0 && entry.dwellTimeMs < 5000 ? 'text-danger' : entry.dwellTimeMs < 15000 ? 'text-warn' : 'text-ok' },
          { label: 'Decision time', val: entry.decisionLabel, tone: 'text-muted' },
          { label: 'Override reason', val: entry.overrideReason ?? 'None', tone: entry.overrideReason ? 'text-ink' : 'text-ghost' },
          { label: 'Caution', val: entry.cautionNote ?? 'None', tone: entry.cautionNote ? 'text-warn' : 'text-ghost' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
            <div className={`font-body font-medium text-[10px] leading-snug ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Operational metrics before / after */}
      {entry.metricsAfter && (
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Before → After (from telemetry)</div>
          <div className="grid grid-cols-2 gap-px bg-rule2 border border-rule2">
            <div className="bg-stone px-3 py-2">
              <div className="font-body text-ghost text-[9px] mb-1">Before</div>
              {Object.entries(entry.metricsBefore).map(([k, v]) => (
                <div key={k} className="font-body text-muted text-[10px]">{k}: {v}</div>
              ))}
            </div>
            <div className="bg-stone px-3 py-2">
              <div className="font-body text-ghost text-[9px] mb-1">After · {entry.metricsUpdatedLabel}</div>
              {Object.entries(entry.metricsAfter).map(([k, v]) => (
                <div key={k} className="font-body text-ink text-[10px]">{k}: {v}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI impact */}
      {entry.kpiDelta && (
        <div className={`px-4 py-3 border ${entry.kpiDelta.direction === 'improvement' ? 'border-ok/30 bg-ok/[0.04]' : entry.kpiDelta.direction === 'degradation' ? 'border-warn/30 bg-warn/[0.04]' : 'border-rule2 bg-stone2'}`}>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">KPI impact · {entry.kpiDelta.metric}</div>
          <div className="flex items-center gap-3">
            <span className="font-body text-muted text-[12px]">{entry.kpiDelta.before}</span>
            <ArrowRight size={12} className="text-ghost" />
            <span className={`font-body font-bold text-[16px] ${entry.kpiDelta.direction === 'improvement' ? 'text-ok' : entry.kpiDelta.direction === 'degradation' ? 'text-warn' : 'text-ink'}`}>{entry.kpiDelta.after}</span>
            {entry.kpiDelta.pct !== undefined && (
              <span className={`font-body text-[11px] ${entry.kpiDelta.pct > 0 ? 'text-ok' : 'text-warn'}`}>
                {entry.kpiDelta.pct > 0 ? '+' : ''}{entry.kpiDelta.pct}%
              </span>
            )}
          </div>
          <div className="font-body text-ghost text-[9px] mt-1.5">Attribution confidence: {entry.attributionConfidence != null ? `${Math.round(entry.attributionConfidence * 100)}%` : '—'}</div>
        </div>
      )}

      {/* Operator confirmation — closes the causal chain */}
      {entry.operatorConfirmation ? (
        <div className="flex items-start gap-3 px-4 py-3 border border-ok/30 bg-ok/[0.04] border-l-4 border-l-ok">
          <CheckCircle2 size={12} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Operator confirmation</div>
            <div className="font-body font-medium text-ink text-[11px]">{entry.operatorConfirmation.confirmedBy} · {entry.operatorConfirmation.station}</div>
            <div className="font-body text-ok text-[10px]">{entry.operatorConfirmation.note}</div>
            <div className="font-body text-ghost text-[9px] mt-0.5">{entry.operatorConfirmation.confirmedAt}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 border border-rule2 bg-stone2">
          <div className="w-1.5 h-1.5 rounded-full bg-ghost flex-shrink-0" />
          <span className="font-body text-ghost text-[10px]">No operator confirmation — outcome attributed from telemetry only</span>
        </div>
      )}

      {/* Outcome notes */}
      <div className="px-4 py-3 border border-rule2 bg-stone2">
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Outcome narrative</div>
        <p className="font-body text-ink text-[11px] leading-relaxed">{entry.outcomeNotes}</p>
      </div>

      {/* Reversal */}
      {entry.wasReversed && (
        <div className="flex items-start gap-2 px-3 py-2.5 border border-rule2 bg-stone2">
          <RotateCcw size={10} className="text-muted flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="font-body font-medium text-ink text-[10px] mb-0.5">Intervention reversed — {entry.reversedAt}</div>
            <p className="font-body text-ghost text-[9px] leading-snug">{entry.reversalReason}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImpactLoop() {
  const [selectedId, setSelectedId] = useState(null)
  const [filterKpi, setFilterKpi] = useState(null)
  const [filterOutcome, setFilterOutcome] = useState(null)

  const filtered = interventions.filter(e => {
    if (filterKpi && e.kpiTarget !== filterKpi) return false
    if (filterOutcome && e.outcomeClassification !== filterOutcome) return false
    return true
  })

  const selectedEntry = interventions.find(e => e.id === selectedId)

  const positiveCount = interventions.filter(e => e.outcomeClassification === 'positive').length
  const lowDwellCount = interventions.filter(e => e.dwellTimeMs > 0 && e.dwellTimeMs < 5000).length
  const avgAttrib = Math.round((interventions.reduce((s, e) => s + e.attributionConfidence, 0) / interventions.length) * 100)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: summary + filters */}
      <div className="w-[260px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Causality Layer</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Impact Loop</div>
          <div className="font-body text-ghost text-[10px] mt-1">AI observation → decision → consequence</div>
        </div>

        {/* Summary stats */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-px bg-rule2 border-b border-rule2">
          {[
            { label: 'Interventions', val: String(interventionSummary.total), tone: 'text-ink' },
            { label: 'Positive outcomes', val: `${positiveCount}/${interventionSummary.total}`, tone: 'text-ok' },
            { label: 'Avg attribution', val: `${avgAttrib}%`, tone: avgAttrib >= 70 ? 'text-ok' : avgAttrib >= 50 ? 'text-warn' : 'text-danger' },
            { label: 'Low-dwell decisions', val: String(lowDwellCount), tone: lowDwellCount > 0 ? 'text-danger' : 'text-ok' },
          ].map(({ label, val, tone }) => (
            <div key={label} className="bg-stone px-3 py-2.5">
              <div className="font-body text-ghost text-[8px] uppercase tracking-widest mb-0.5">{label}</div>
              <div className={`font-body font-bold text-[16px] display-num ${tone}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* Low dwell warning */}
        {lowDwellCount > 0 && (
          <div className="flex-shrink-0 flex items-start gap-2 px-4 py-2.5 border-b border-rule2 bg-danger/[0.03]">
            <AlertTriangle size={9} className="text-danger flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="font-body text-danger text-[9px] leading-snug">
              {lowDwellCount} decision{lowDwellCount > 1 ? 's' : ''} made with &lt;5s rationale review. Approval legitimacy is unclear.
            </p>
          </div>
        )}

        {/* Outcome filter */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest">Filter by outcome</div>
        </div>
        {[null, 'positive', 'unclear', 'negative', 'harmful'].map(oc => (
          <button key={String(oc)} type="button" onClick={() => { setFilterOutcome(oc); setSelectedId(null) }}
            className={`w-full text-left px-4 py-2 border-b border-rule2 border-l-4 transition-colors text-[10px] font-body ${
              filterOutcome === oc ? 'border-l-ochre bg-stone2 text-ink font-medium' : 'border-l-transparent hover:bg-stone2/50 text-ghost'
            }`}>
            {oc === null ? 'All outcomes' : oc.charAt(0).toUpperCase() + oc.slice(1)}
            <span className="ml-1.5 text-ghost text-[9px]">
              {oc === null ? `(${interventions.length})` : `(${interventions.filter(e => e.outcomeClassification === oc).length})`}
            </span>
          </button>
        ))}

        {/* KPI filter */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-rule2 bg-stone2 mt-2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest">Filter by KPI target</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button type="button" onClick={() => { setFilterKpi(null); setSelectedId(null) }}
            className={`w-full text-left px-4 py-2 border-b border-rule2 border-l-4 transition-colors text-[10px] font-body ${
              !filterKpi ? 'border-l-ochre bg-stone2 text-ink font-medium' : 'border-l-transparent hover:bg-stone2/50 text-ghost'
            }`}>
            All KPIs
          </button>
          {kpiTargets.map(k => (
            <button key={k.id} type="button" onClick={() => { setFilterKpi(k.id); setSelectedId(null) }}
              className={`w-full text-left px-4 py-2.5 border-b border-rule2 border-l-4 transition-colors ${
                filterKpi === k.id ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
              }`}>
              <div className="font-body text-ink text-[10px]">{k.label}</div>
              <div className="font-body text-ghost text-[9px]">Baseline {k.baseline}{k.unit} · Target {k.target}{k.unit}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: intervention log */}
      <div className="w-[380px] flex-shrink-0 border-r border-rule2 flex flex-col">
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">
            Interventions · {filtered.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-body text-ok text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ok" />Positive</span>
            <span className="flex items-center gap-1 font-body text-ochre text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ochre" />Unclear</span>
            <span className="flex items-center gap-1 font-body text-danger text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-danger" />Negative</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
              No interventions match this filter
            </div>
          ) : filtered.map(e => (
            <InterventionCard key={e.id} entry={e}
              selected={selectedId === e.id}
              onClick={() => setSelectedId(e.id)} />
          ))}
        </div>

        {/* Attribution footnote */}
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-rule2 bg-stone2">
          <p className="font-body text-ghost text-[9px] leading-snug">Attribution confidence reflects causal certainty between this intervention and the measured outcome. Values below 60% indicate possible confounding factors.</p>
        </div>
      </div>

      {/* Right: full event chain detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Event chain detail</span>
        </div>
        <InterventionDetail entry={selectedEntry} />
      </div>
    </div>
  )
}
