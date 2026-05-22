import { useState } from 'react'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { CheckCircle2, AlertTriangle, Clock, RotateCcw, Zap, Eye, MessageSquare, Shield, ArrowRight } from 'lucide-react'
import { SlidePanel, StatusPill, SceneHeader, SectionHeader, Btn, StatGrid, EmptyState, SectionLabel } from '../components/UI'

const TIER_ICONS = { observe: Eye, recommend: MessageSquare, execute: Zap, govern: Shield }

const OUTCOME_CFG = {
  success:   { label: 'Success',     cls: 'bg-ok/10 text-ok',         dot: 'bg-ok' },
  escalated: { label: 'Escalated',   cls: 'bg-warn/10 text-warn',   dot: 'bg-warn' },
  pending:   { label: 'Pending',     cls: 'bg-signal/10 text-signal', dot: 'bg-signal' },
  rollback:  { label: 'Rolled back', cls: 'bg-stone3 text-muted',      dot: 'bg-muted' },
}

function TierRow({ tier, isActive, isCeiling, isGovern, governCriteriaMet, onClick }) {
  const Icon = TIER_ICONS[tier.id]
  const leftBorder = isCeiling ? 'border-l-signal' : isActive ? 'border-l-transparent' : 'border-l-transparent'
  const bg = isCeiling ? 'bg-stone2' : isGovern && governCriteriaMet ? 'bg-ok/[0.02]' : ''

  const statusBadge = isCeiling
    ? <StatusPill tone="signal" className="ml-auto flex-shrink-0">Active ceiling</StatusPill>
    : isGovern
      ? governCriteriaMet
        ? <StatusPill tone="ok" className="ml-auto flex-shrink-0">Ready to activate</StatusPill>
        : <StatusPill tone="muted" className="ml-auto flex-shrink-0">Not yet active</StatusPill>
      : tier.id === 'observe'
        ? <span className="ml-auto font-body text-muted text-label">Always on</span>
        : null

  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 border-l-4 transition-colors ${leftBorder} ${bg} ${
        isActive && !isCeiling ? 'hover:bg-stone2/50' : ''
      } ${tier.id === 'govern' && !governCriteriaMet ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <Icon size={11} strokeWidth={2} className={tier.color} />
        <span className={`font-body font-medium text-label ${tier.color}`}>{tier.label}</span>
        {statusBadge}
      </div>
      <p className="font-body text-muted text-label leading-snug">{tier.description}</p>
      {tier.actionCount > 0 && (
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-body text-label text-muted">{tier.actionCount} actions</span>
          {tier.approvalRate != null && (
            <span className="font-body text-label text-ok">{Math.round(tier.approvalRate * 100)}% approved</span>
          )}
          {tier.rollbackRate != null && (
            <span className="font-body text-label text-warn">{Math.round(tier.rollbackRate * 100)}% escalated</span>
          )}
        </div>
      )}
    </button>
  )
}

function LogRow({ entry, selected, onClick }) {
  const out = OUTCOME_CFG[entry.outcome] ?? OUTCOME_CFG.pending
  const TierIcon = TIER_ICONS[entry.tier]
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <div className="mb-1">
        <StatusPill tone={entry.outcome === 'success' ? 'ok' : entry.outcome === 'escalated' ? 'warn' : entry.outcome === 'pending' ? 'signal' : 'muted'} className="mb-1.5">{out.label}</StatusPill>
        <p className="font-body font-medium text-ink text-body leading-snug mb-0.5">{entry.action}</p>
        <div className="flex items-center gap-2">
          <span className="font-body text-muted text-label">{entry.agent}</span>
          <span className="font-body text-muted text-label opacity-50">·</span>
          <TierIcon size={9} strokeWidth={2} className="text-muted opacity-60" />
          <span className="font-body text-muted text-label capitalize">{entry.tier}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-body text-muted text-label">{entry.timeLabel}</span>
        {entry.monitoringWindow && (
          <span className="font-body text-muted text-label">· {entry.monitoringWindow} window</span>
        )}
        {!entry.reversible && (
          <span className="font-body text-muted text-label">· Irreversible</span>
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
    <div className="space-y-5">
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

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TierIcon size={10} strokeWidth={2} className="text-muted" />
          <span className="font-body text-muted text-label capitalize">{entry.tier} tier</span>
          <StatusPill tone={entry.outcome === 'success' ? 'ok' : entry.outcome === 'escalated' ? 'warn' : entry.outcome === 'pending' ? 'signal' : 'muted'} className="ml-auto">{out.label}</StatusPill>
        </div>
        <div className="font-display font-bold text-ink text-head leading-tight mb-1">{entry.action}</div>
        <div className="font-body text-muted text-label">{entry.agent} · {entry.timeLabel}</div>
      </div>

      {/* Rationale */}
      <div className="px-4 py-3 bg-stone2 border-l-4 border-l-signal">
        <div className="font-body text-muted text-label mb-1">Agent rationale</div>
        <p className="font-display text-ink text-body leading-relaxed">{entry.rationale}</p>
      </div>

      {/* Metrics grid */}
      <StatGrid cols={3} noBorder>
        {[
          { label: 'Outcome', val: out.label, tone: entry.outcome === 'success' ? 'text-ok' : entry.outcome === 'escalated' ? 'text-warn' : 'text-signal' },
          { label: 'Monitoring window', val: entry.monitoringWindow ?? 'N/A', tone: 'text-muted' },
          { label: 'Reversible', val: entry.reversible ? 'Yes' : 'No', tone: entry.reversible ? 'text-ok' : 'text-muted' },
          { label: 'Deviation detected', val: entry.deviation ? 'Yes' : 'No', tone: entry.deviation ? 'text-warn' : 'text-ok' },
          { label: 'Escalated', val: entry.escalated ? 'Yes' : 'No', tone: entry.escalated ? 'text-warn' : 'text-ok' },
          { label: 'Rollback available', val: entry.rollbackAvailable ? 'Yes' : 'No', tone: entry.rollbackAvailable ? 'text-ok' : 'text-muted' },
        ].map(({ label, val, tone }) => (
          <StatGrid.Cell key={label} label={label} value={val} tone={tone} size="sm" />
        ))}
      </StatGrid>

      {/* Impact */}
      {entry.impact && (
        <div className={`flex items-center gap-3 px-4 py-3 border ${entry.impact.positive ? 'bg-ok/[0.04]' : 'bg-warn/[0.04]'}`}>
          <ArrowRight size={12} className={entry.impact.positive ? 'text-ok' : 'text-warn'} strokeWidth={2} />
          <div>
            <div className="font-body text-muted text-label">{entry.impact.metric}</div>
            <div className={`display-num text-base font-bold ${entry.impact.positive ? 'text-ok' : 'text-warn'}`}>{entry.impact.delta}</div>
          </div>
        </div>
      )}

      {/* Escalation note */}
      {entry.escalationNote && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-warn/[0.04] border-l-2 border-l-warn">
          <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="font-body text-warn text-label leading-snug">{entry.escalationNote}</p>
        </div>
      )}

      {/* Rollback record */}
      {rb && (
        <div className="border border-rule2 bg-stone2 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw size={10} className="text-muted" strokeWidth={2} />
            <span className="font-body text-muted text-label">Rollback executed</span>
          </div>
          <p className="font-body text-ink text-label mb-1">{rb.rollbackAction}</p>
          <p className="font-body text-muted text-label leading-snug">{rb.reason}</p>
          <div className="flex items-center gap-2 mt-2">
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
  const [selectedTier, setSelectedTier] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [governActivated, setGovernActivated] = useState(false)

  // Computed trust metrics
  const successPct = Math.round(executionSummary.successRate * 100)
  const headerTone = successPct >= 95 ? 'ok' : successPct >= 85 ? 'warn' : 'danger'

  // Govern tier unlock criteria
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRollbacks = rollbackLog.filter(r => new Date(r.timestamp) > sevenDaysAgo).length
  const governCriteriaMet = executionSummary.successRate >= 0.95 && recentRollbacks === 0
  const governCriteriaItems = [
    { label: `95% success rate over 30d (currently ${successPct}%)`, met: executionSummary.successRate >= 0.95 },
    { label: `0 rollbacks in last 7 days (${recentRollbacks} on record)`, met: recentRollbacks === 0 },
  ]

  const activeCeilingId = [...autonomyTiers].reverse().find(t => t.agentCount > 0)?.id ?? 'execute'

  const filtered = selectedTier
    ? executionLog.filter(e => e.tier === selectedTier)
    : executionLog

  const needsReview = executionLog.filter(e => e.outcome === 'escalated' || e.outcome === 'pending')

  const selectedEntry = executionLog.find(e => e.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal flex-col">

      <SceneHeader
        module="EXECUTION"
        context="Execute tier active"
        metric={successPct}
        metricLabel="% success rate"
        statement={`${executionSummary.totalActions} autonomous actions · Execute tier active · 30 days`}
        tone={headerTone}
        meta={[
          { label: 'escalation rate', value: `${Math.round(executionSummary.escalationRate * 100)}%` },
          { label: 'rollback rate', value: `${Math.round(executionSummary.rollbackRate * 100)}%` },
          { label: 'avg monitoring', value: executionSummary.avgMonitoringWindow },
        ]}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left: authority ladder */}
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

          {/* Tier rows */}
          <div className="flex-1 overflow-y-auto">
            <button type="button" onClick={() => { setSelectedTier(null); setSelectedId(null) }}
              className={`w-full text-left px-4 py-2.5 border-b border-rule2 border-l-4 transition-colors ${!selectedTier ? 'border-l-signal bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
              <span className="font-body font-medium text-ink text-label">All events</span>
              <span className="font-body text-muted text-label ml-2">{executionLog.length}</span>
            </button>
            {autonomyTiers.map(t => (
              <TierRow key={t.id} tier={t}
                isActive={selectedTier === t.id}
                isCeiling={t.id === activeCeilingId && !governActivated}
                isGovern={t.id === 'govern'}
                governCriteriaMet={governCriteriaMet || governActivated}
                onClick={() => { setSelectedTier(t.id); setSelectedId(null) }} />
            ))}
          </div>

          {/* Govern tier CTA */}
          {!governActivated && (
            <div className="flex-shrink-0 border-t border-rule2">
              {governCriteriaMet ? (
                <div className="mx-4 my-3 px-4 py-3 border-l-4 border-l-ok bg-ok/[0.04]">
                  <div className="font-body font-semibold text-ink text-body mb-1">Govern tier criteria met</div>
                  <div className="font-body text-muted text-label leading-relaxed mb-3">
                    {successPct}% success over 30 days, no rollbacks in the last 7 days. Activating puts policy enforcement agents on autonomous authority.
                  </div>
                  <Btn variant="primary" onClick={() => setGovernActivated(true)}>Activate Govern tier</Btn>
                </div>
              ) : (
                <div className="mx-4 my-3 px-4 py-3 border-l-4 border-l-rule2 bg-stone2">
                  <div className="font-body font-semibold text-muted text-label mb-2">To activate Govern tier</div>
                  <div className="space-y-1.5">
                    {governCriteriaItems.map(c => (
                      <div key={c.label} className="flex items-start gap-1.5">
                        {c.met
                          ? <CheckCircle2 size={10} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
                          : <Clock size={10} strokeWidth={2} className="text-muted flex-shrink-0 mt-0.5" />
                        }
                        <span className={`font-body text-label leading-snug ${c.met ? 'text-ok' : 'text-muted'}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: execution timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Needs review section */}
            {needsReview.length > 0 && !selectedTier && (
              <>
                <SectionHeader tone="warn" label="Needs review" sub={`${needsReview.length} unresolved`} />
                {needsReview.map(e => (
                  <div key={e.id} className="border-l-2 border-l-warn">
                    <LogRow entry={e} selected={selectedId === e.id} onClick={() => setSelectedId(e.id)} />
                  </div>
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
