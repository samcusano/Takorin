import { useState } from 'react'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { CheckCircle2, AlertTriangle, Clock, RotateCcw, Zap, Eye, MessageSquare, Shield, ArrowRight } from 'lucide-react'
import { SlidePanel, StatusPill, SceneHeader, SectionHeader, Btn } from '../components/UI'

const TIER_ICONS = { observe: Eye, recommend: MessageSquare, execute: Zap, govern: Shield }

const OUTCOME_CFG = {
  success:   { label: 'Success',     tone: 'ok',     borderCls: 'border-l-ok' },
  escalated: { label: 'Escalated',   tone: 'warn',   borderCls: 'border-l-warn' },
  pending:   { label: 'Pending',     tone: 'signal', borderCls: 'border-l-signal' },
  rollback:  { label: 'Rolled back', tone: 'muted',  borderCls: 'border-l-muted' },
}

const FILTERS = [
  { id: 'all',      label: 'All',          match: null },
  { id: 'review',   label: 'Needs review', match: e => e.outcome === 'escalated' || e.outcome === 'pending' },
  { id: 'success',  label: 'Success',      match: e => e.outcome === 'success' },
  { id: 'rollback', label: 'Rolled back',  match: e => e.outcome === 'rollback' },
]


function LogRow({ entry, selected, onClick }) {
  const out = OUTCOME_CFG[entry.outcome] ?? OUTCOME_CFG.pending
  const TierIcon = TIER_ICONS[entry.tier]
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 border-l-4 ${out.borderCls} transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <StatusPill tone={out.tone} className="mb-1.5">{out.label}</StatusPill>
      <p className="font-body font-medium text-ink text-body leading-snug mb-1">{entry.action}</p>
      <div className="flex items-center gap-2">
        <span className="font-body text-muted text-label">{entry.agent}</span>
        <span className="font-body text-muted text-label opacity-40">·</span>
        <TierIcon size={9} strokeWidth={2} className="text-muted opacity-60" />
        <span className="font-body text-muted text-label capitalize">{entry.tier}</span>
        <span className="font-body text-muted text-label ml-auto">{entry.timeLabel}</span>
        {entry.monitoringWindow && (
          <span className="font-body text-muted text-label opacity-60">· {entry.monitoringWindow}</span>
        )}
      </div>
    </button>
  )
}

function ActionDetail({ entry }) {
  const out = OUTCOME_CFG[entry.outcome] ?? OUTCOME_CFG.pending
  const TierIcon = TIER_ICONS[entry.tier]
  const rb = rollbackLog.find(r => r.executionRef === entry.id)

  return (
    <div className="space-y-4">

      {/* Escalation / rollback banner */}
      {(entry.outcome === 'escalated' || entry.outcome === 'rollback') && (
        <div className="flex items-start gap-3 px-4 py-3 bg-warn/[0.06] border-l-4 border-l-warn">
          <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-body font-medium text-ink text-body mb-0.5">
              {entry.outcome === 'escalated' ? 'This action escalated' : 'This action was rolled back'}
            </div>
            <p className="font-body text-warn text-label leading-snug">
              {entry.escalationNote ?? 'See details below.'}
            </p>
          </div>
          <Btn variant="secondary" className="flex-shrink-0">Mark reviewed</Btn>
        </div>
      )}

      {/* Context: who acted, at what tier, with what outcome */}
      <div className="flex items-center gap-2">
        <TierIcon size={10} strokeWidth={2} className="text-muted" />
        <span className="font-body text-muted text-label capitalize">{entry.tier} tier</span>
        <span className="font-body text-muted text-label opacity-40">·</span>
        <span className="font-body text-ink text-body">{entry.agent}</span>
        <span className="font-body text-muted text-label ml-auto">{entry.timeLabel}</span>
        <StatusPill tone={out.tone}>{out.label}</StatusPill>
      </div>

      {/* Rationale — dominant section, the payload */}
      <div className="px-5 py-4 bg-stone2 border-l-4 border-l-signal">
        <div className="font-body font-semibold text-muted text-label mb-2">Agent rationale</div>
        <p className="font-display text-ink text-body leading-relaxed">{entry.rationale}</p>
      </div>

      {/* Impact — key result */}
      {entry.impact && (
        <div className={`flex items-center gap-4 px-4 py-3 border border-rule2 border-l-4 ${
          entry.impact.positive ? 'border-l-ok bg-ok/[0.04]' : 'border-l-warn bg-warn/[0.04]'
        }`}>
          <div className="flex-1 min-w-0">
            <div className="font-body text-muted text-label mb-1">{entry.impact.metric}</div>
            <div className={`font-display font-bold text-title leading-none ${
              entry.impact.positive ? 'text-ok' : 'text-warn'
            }`}>{entry.impact.delta}</div>
          </div>
          <ArrowRight size={14} className={`flex-shrink-0 ${entry.impact.positive ? 'text-ok' : 'text-warn'}`} strokeWidth={2} />
        </div>
      )}

      {/* Audit facts */}
      <div className="divide-y divide-rule2 border-y border-rule2">
        {[
          { label: 'Monitoring window',  val: entry.monitoringWindow ?? 'N/A', tone: 'text-muted' },
          { label: 'Reversible',         val: entry.reversible ? 'Yes' : 'No',        tone: entry.reversible ? 'text-ok' : 'text-muted' },
          { label: 'Rollback available', val: entry.rollbackAvailable ? 'Yes' : 'No', tone: entry.rollbackAvailable ? 'text-ok' : 'text-muted' },
          { label: 'Deviation detected', val: entry.deviation ? 'Yes' : 'No',         tone: entry.deviation ? 'text-warn' : 'text-ok' },
          { label: 'Escalated',          val: entry.escalated ? 'Yes' : 'No',         tone: entry.escalated ? 'text-warn' : 'text-ok' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="flex items-center px-4 py-2.5">
            <span className="font-body text-muted text-label flex-1">{label}</span>
            <span className={`font-body text-label font-medium ${tone}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* Rollback record */}
      {rb && (
        <div className="border border-rule2 border-l-4 border-l-muted bg-stone2 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw size={10} className="text-muted" strokeWidth={2} />
            <span className="font-body font-semibold text-muted text-label">Rollback executed</span>
          </div>
          <p className="font-body text-ink text-body mb-1">{rb.rollbackAction}</p>
          <p className="font-body text-muted text-label leading-snug mb-2">{rb.reason}</p>
          <div className="flex items-center gap-2">
            <span className="font-body text-muted text-label">{rb.timestamp.replace('T', ' ').substring(0, 16)}</span>
            <span className="font-body text-muted text-label opacity-50">·</span>
            <StatusPill tone="ok">Complete</StatusPill>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExecutionAuthority() {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [governActivated, setGovernActivated] = useState(false)

  const successPct = Math.round(executionSummary.successRate * 100)
  const headerTone = successPct >= 95 ? 'ok' : successPct >= 85 ? 'warn' : 'danger'

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRollbacks = rollbackLog.filter(r => new Date(r.timestamp) > sevenDaysAgo).length
  const governCriteriaMet = executionSummary.successRate >= 0.95 && recentRollbacks === 0
  const governCriteriaItems = [
    { label: `95% success rate over 30d (currently ${successPct}%)`, met: executionSummary.successRate >= 0.95 },
    { label: `0 rollbacks in last 7 days (${recentRollbacks} on record)`,  met: recentRollbacks === 0 },
  ]

  const activeCeilingId = [...autonomyTiers].reverse().find(t => t.agentCount > 0)?.id ?? 'execute'
  const activeTier = autonomyTiers.find(t => t.id === activeCeilingId)

  const needsReview = executionLog.filter(e => e.outcome === 'escalated' || e.outcome === 'pending')

  const activeFilter = FILTERS.find(f => f.id === filter)
  const filtered = activeFilter.match ? executionLog.filter(activeFilter.match) : executionLog

  const selectedEntry = executionLog.find(e => e.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal flex-col">

      <SceneHeader
        module="Autonomy"
        context="Execute tier active"
        metric={successPct}
        metricLabel="% success rate"
        statement={<>{executionSummary.totalActions} autonomous actions · Execute tier active · 30 days<span className="block font-body text-muted text-label mt-1 leading-snug">{activeTier?.description}</span></>}
        tone={headerTone}
        meta={[
          { label: 'escalation rate', value: `${Math.round(executionSummary.escalationRate * 100)}%` },
          { label: 'rollback rate',   value: `${Math.round(executionSummary.rollbackRate * 100)}%` },
          { label: 'avg monitoring',  value: executionSummary.avgMonitoringWindow },
        ]}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Full-width: outcome filter + timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Outcome filter tabs + govern action on right */}
          <div className="flex flex-shrink-0 border-b border-rule2">
            {FILTERS.map(f => {
              const count = f.match ? executionLog.filter(f.match).length : executionLog.length
              const isActive = filter === f.id
              return (
                <button key={f.id} type="button"
                  onClick={() => { setFilter(f.id); setSelectedId(null) }}
                  className={`px-4 py-2.5 font-body text-label border-r border-rule2 transition-colors whitespace-nowrap ${
                    isActive ? 'text-ink bg-stone2' : 'text-muted hover:text-ink hover:bg-stone2/50'
                  }`}>
                  {f.label}
                  {count > 0 && (
                    <span className={`ml-1.5 ${
                      f.id === 'review' && !isActive ? 'text-warn' : isActive ? 'text-ink' : 'text-muted'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}

            {!governActivated && (
              <div className={`ml-auto flex items-center gap-3 px-4 border-l border-rule2 flex-shrink-0 ${
                governCriteriaMet ? 'bg-ok/[0.04]' : ''
              }`}>
                {governCriteriaMet ? (
                  <>
                    <span className="font-body text-ok text-label">All criteria met</span>
                    <Btn variant="primary" onClick={() => setGovernActivated(true)}>Activate Govern tier</Btn>
                  </>
                ) : (
                  <span className="font-body text-muted text-label">
                    {governCriteriaItems.filter(c => c.met).length} of {governCriteriaItems.length} criteria met for Govern tier
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto">
            {needsReview.length > 0 && filter === 'all' && (
              <>
                <SectionHeader tone="warn" label="Needs review" sub={`${needsReview.length} unresolved`} />
                {needsReview.map(e => (
                  <LogRow key={e.id} entry={e} selected={selectedId === e.id} onClick={() => setSelectedId(e.id)} />
                ))}
                <SectionHeader tone="muted" label="All events" />
              </>
            )}
            {filtered.map(e => (
              <LogRow key={e.id} entry={e}
                selected={selectedId === e.id}
                onClick={() => setSelectedId(e.id)} />
            ))}
          </div>
        </div>

      </div>

      {selectedEntry && (
        <SlidePanel
          title={selectedEntry.action}
          subtitle={`${selectedEntry.tier} tier · ${selectedEntry.timeLabel}`}
          onClose={() => setSelectedId(null)}
        >
          <ActionDetail entry={selectedEntry} />
        </SlidePanel>
      )}
    </div>
  )
}
