import { useState } from 'react'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { CheckCircle2, AlertTriangle, Clock, RotateCcw, Zap, Eye, MessageSquare, Shield } from 'lucide-react'
import { SlidePanel, StatusPill, SceneHeader, SectionHeader, Btn, FilterDropdown, MultiFilterDropdown } from '../components/UI'

const TIER_ICONS = { observe: Eye, recommend: MessageSquare, execute: Zap, govern: Shield }

const OUTCOME_CFG = {
  success:   { label: 'Success',     tone: 'ok'     },
  escalated: { label: 'Escalated',   tone: 'warn'   },
  pending:   { label: 'Pending',     tone: 'signal' },
  rollback:  { label: 'Rolled back', tone: 'muted'  },
}

const OUTCOME_OPTIONS = [
  { value: 'success',   label: 'Success'     },
  { value: 'escalated', label: 'Escalated'   },
  { value: 'pending',   label: 'Pending'     },
  { value: 'rollback',  label: 'Rolled back' },
]


function LogRow({ entry, selected, onClick }) {
  const out = OUTCOME_CFG[entry.outcome] ?? OUTCOME_CFG.pending
  const TierIcon = TIER_ICONS[entry.tier]
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 transition-colors ${
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
  const rb  = rollbackLog.find(r => r.executionRef === entry.id)
  const isIssue = entry.outcome === 'escalated' || entry.outcome === 'rollback'

  // Second inset box adapts to outcome
  const consequenceBox = {
    success:   { label: 'Outcome',     Icon: CheckCircle2, cls: 'text-ok',   bg: 'bg-ok/[0.04]'   },
    escalated: { label: 'Consequence', Icon: AlertTriangle, cls: 'text-warn', bg: 'bg-warn/[0.04]' },
    pending:   { label: 'Consequence', Icon: Clock,         cls: 'text-muted', bg: 'bg-stone2'     },
    rollback:  { label: 'Rolled back', Icon: RotateCcw,     cls: 'text-muted', bg: 'bg-stone2'     },
  }[entry.outcome] ?? { label: 'Consequence', Icon: AlertTriangle, cls: 'text-muted', bg: 'bg-stone2' }

  const ConsequenceIcon = consequenceBox.Icon

  return (
    <div className="space-y-4">

      {/* Meta row — outcome + deviation + agent + time */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusPill tone={out.tone}>{out.label}</StatusPill>
        {entry.deviation && <StatusPill tone="warn">Deviation</StatusPill>}
        <span className="font-body text-label text-muted">{entry.agent}</span>
        <span className="font-body text-label text-muted ml-auto">{entry.timeLabel}</span>
      </div>

      {/* Escalation note — between meta and inset boxes */}
      {entry.escalationNote && (
        <div className="flex items-start gap-3 px-4 py-3 bg-warn/[0.04] border border-warn/20">
          <AlertTriangle size={10} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
          <p className="font-body text-warn text-body leading-snug">{entry.escalationNote}</p>
        </div>
      )}

      {/* What triggered this — inset box (matches Outcomes overlay) */}
      <div className="border border-rule2 bg-stone2 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={12} strokeWidth={2} className="text-signal flex-shrink-0" />
          <span className="font-body font-semibold text-ink text-body">What triggered this</span>
        </div>
        <p className="font-body text-muted text-label leading-relaxed">{entry.rationale}</p>
      </div>

      {/* Consequence / Outcome — inset box, adapts per outcome */}
      {entry.impact && (
        <div className={`border border-rule2 px-4 py-4 ${consequenceBox.bg}`}>
          <div className="flex items-center gap-2 mb-3">
            <ConsequenceIcon size={12} strokeWidth={2} className={`${consequenceBox.cls} flex-shrink-0`} />
            <span className="font-body font-semibold text-ink text-body">{consequenceBox.label}</span>
          </div>
          <div className={`display-num text-title font-bold leading-none mb-1 ${consequenceBox.cls}`}>
            {entry.impact.delta}
          </div>
          <div className="font-body text-label text-muted">{entry.impact.metric}</div>
        </div>
      )}

      {/* Audit strip — compact 3 items */}
      <div className="flex items-center gap-5 py-2.5 border-y border-rule2 flex-wrap">
        <div>
          <div className="font-body text-label text-muted">Monitoring</div>
          <div className="font-body text-label font-medium text-ink">{entry.monitoringWindow ?? '—'}</div>
        </div>
        <div>
          <div className="font-body text-label text-muted">Reversible</div>
          <div className={`font-body text-label font-medium ${entry.reversible ? 'text-ok' : 'text-muted'}`}>
            {entry.reversible ? 'Yes' : 'No'}
          </div>
        </div>
        <div>
          <div className="font-body text-label text-muted">Rollback</div>
          <div className={`font-body text-label font-medium ${entry.rollbackAvailable ? 'text-ok' : 'text-muted'}`}>
            {entry.rollbackAvailable ? 'Available' : 'N/A'}
          </div>
        </div>
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
  const [agentFilter, setAgentFilter]   = useState('all')
  const [tierFilter, setTierFilter]     = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState([])
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

  const agentOptions = [
    { value: 'all', label: 'All agents' },
    ...Array.from(new Set(executionLog.map(e => e.agent))).map(a => ({ value: a, label: a })),
  ]

  const tierOptions = [
    { value: 'all',       label: 'All tiers'  },
    { value: 'observe',   label: 'Observe'    },
    { value: 'recommend', label: 'Recommend'  },
    { value: 'execute',   label: 'Execute'    },
    { value: 'govern',    label: 'Govern'     },
  ]

  const filtered = executionLog
    .filter(e => agentFilter === 'all' || e.agent === agentFilter)
    .filter(e => tierFilter === 'all' || e.tier === tierFilter)
    .filter(e => outcomeFilter.length === 0 || outcomeFilter.includes(e.outcome))

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

          {/* Scope bar — Agent / Tier / Outcome filters */}
          <div className="flex items-center gap-2 px-5 py-2 border-b border-rule2 bg-stone flex-shrink-0">
            <FilterDropdown
              label="Agent"
              options={agentOptions}
              value={agentFilter}
              onChange={v => { setAgentFilter(v); setSelectedId(null) }}
            />
            <FilterDropdown
              label="Tier"
              options={tierOptions}
              value={tierFilter}
              onChange={v => { setTierFilter(v); setSelectedId(null) }}
            />
            <MultiFilterDropdown
              label="Outcome"
              options={OUTCOME_OPTIONS}
              values={outcomeFilter}
              onChange={v => { setOutcomeFilter(v); setSelectedId(null) }}
            />
            <div className="font-body text-muted text-label ml-2">
              {filtered.length} events
            </div>

            {!governActivated && (
              <div className={`ml-auto flex items-center gap-3 pl-4 border-l border-rule2 flex-shrink-0 ${
                governCriteriaMet ? 'bg-ok/[0.04]' : ''
              }`}>
                {governCriteriaMet ? (
                  <>
                    <span className="font-body text-ok text-label">All criteria met</span>
                    <Btn variant="primary" onClick={() => setGovernActivated(true)}>Activate Govern tier</Btn>
                  </>
                ) : (
                  <span className="font-body text-muted text-label">
                    {governCriteriaItems.filter(c => c.met).length}/{governCriteriaItems.length} criteria for Govern tier
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto">
            {needsReview.length > 0 && outcomeFilter.length === 0 && agentFilter === 'all' && tierFilter === 'all' && (
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
          footer={
            (selectedEntry.outcome === 'escalated' || selectedEntry.outcome === 'rollback')
              ? <Btn variant="secondary">Mark reviewed</Btn>
              : null
          }
        >
          <ActionDetail entry={selectedEntry} />
        </SlidePanel>
      )}
    </div>
  )
}
