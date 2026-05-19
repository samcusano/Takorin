import { useState } from 'react'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { CheckCircle2, AlertTriangle, Clock, RotateCcw, Zap, Eye, MessageSquare, Shield, ArrowRight } from 'lucide-react'

const TIER_ICONS = { observe: Eye, recommend: MessageSquare, execute: Zap, govern: Shield }

const OUTCOME_CFG = {
  success:   { label: 'Success',     cls: 'bg-ok/10 text-ok',         dot: 'bg-ok' },
  escalated: { label: 'Escalated',   cls: 'bg-warn/10 text-warn',   dot: 'bg-warn' },
  pending:   { label: 'Pending',     cls: 'bg-ochre/10 text-ochre', dot: 'bg-ochre' },
  rollback:  { label: 'Rolled back', cls: 'bg-stone3 text-muted',      dot: 'bg-muted' },
}

function TierRow({ tier, isActive, onClick }) {
  const Icon = TIER_ICONS[tier.id]
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 border-l-4 transition-colors ${
        isActive ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-center gap-2 mb-0.5">
        <Icon size={11} strokeWidth={2} className={tier.color} />
        <span className={`font-body font-medium text-label ${tier.color}`}>{tier.label}</span>
        {tier.agentCount > 0 && (
          <span className="ml-auto font-body text-muted text-label">{tier.agentCount} agents</span>
        )}
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
        <span className={`inline-flex items-center font-body text-label px-1.5 py-0.5 mb-1.5 ${out.cls}`}>{out.label}</span>
        <p className="font-display font-medium text-ink text-section leading-snug mb-0.5">{entry.action}</p>
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
  if (!entry) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      Select an execution event
    </div>
  )
  const out = OUTCOME_CFG[entry.outcome] ?? OUTCOME_CFG.pending
  const TierIcon = TIER_ICONS[entry.tier]
  const rb = rollbackLog.find(r => r.executionRef === entry.id)

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TierIcon size={10} strokeWidth={2} className="text-muted" />
          <span className="font-body text-muted text-label tracking-normal capitalize">{entry.tier} tier</span>
          <span className={`ml-auto font-body text-label px-1.5 py-0.5 ${out.cls}`}>{out.label}</span>
        </div>
        <div className="font-display font-bold text-ink text-head leading-tight mb-1">{entry.action}</div>
        <div className="font-body text-muted text-label">{entry.agent} · {entry.timeLabel}</div>
      </div>

      {/* Rationale */}
      <div className="px-4 py-3 bg-stone2 border-l-4 border-l-ochre">
        <div className="font-body text-muted text-label tracking-normal mb-1">Agent rationale</div>
        <p className="font-body text-ink text-label leading-relaxed">{entry.rationale}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-px bg-rule2">
        {[
          { label: 'Outcome', val: out.label, tone: entry.outcome === 'success' ? 'text-ok' : entry.outcome === 'escalated' ? 'text-warn' : 'text-ochre' },
          { label: 'Monitoring window', val: entry.monitoringWindow ?? 'N/A', tone: 'text-muted' },
          { label: 'Reversible', val: entry.reversible ? 'Yes' : 'No', tone: entry.reversible ? 'text-ok' : 'text-muted' },
          { label: 'Deviation detected', val: entry.deviation ? 'Yes' : 'No', tone: entry.deviation ? 'text-warn' : 'text-ok' },
          { label: 'Escalated', val: entry.escalated ? 'Yes' : 'No', tone: entry.escalated ? 'text-warn' : 'text-ok' },
          { label: 'Rollback available', val: entry.rollbackAvailable ? 'Yes' : 'No', tone: entry.rollbackAvailable ? 'text-ok' : 'text-muted' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-muted text-label tracking-normal mb-0.5">{label}</div>
            <div className={`font-body font-medium text-body ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Impact */}
      {entry.impact && (
        <div className={`flex items-center gap-3 px-4 py-3 border ${entry.impact.positive ? 'bg-ok/[0.04]' : 'bg-warn/[0.04]'}`}>
          <ArrowRight size={12} className={entry.impact.positive ? 'text-ok' : 'text-warn'} strokeWidth={2} />
          <div>
            <div className="font-body text-muted text-label tracking-normal">{entry.impact.metric}</div>
            <div className={`font-body font-medium text-base ${entry.impact.positive ? 'text-ok' : 'text-warn'}`}>{entry.impact.delta}</div>
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
            <span className="font-body text-muted text-label tracking-normal">Rollback executed</span>
          </div>
          <p className="font-body text-ink text-label mb-1">{rb.rollbackAction}</p>
          <p className="font-body text-muted text-label leading-snug">{rb.reason}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-body text-muted text-label">{rb.timestamp.replace('T', ' ').substring(0, 16)}</span>
            <span className="font-body text-muted text-label opacity-50">·</span>
            <span className="font-body text-label px-1.5 py-0.5 bg-ok/10 text-ok">Complete</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExecutionAuthority() {
  const [selectedTier, setSelectedTier] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const filtered = selectedTier
    ? executionLog.filter(e => e.tier === selectedTier)
    : executionLog

  const selectedEntry = executionLog.find(e => e.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: tier panel */}
      <div className="w-[260px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label tracking-normal mb-0.5">Frontier Layer</div>
          <div className="font-display font-bold text-ink text-head leading-none">Execution Authority</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`font-display font-bold display-num text-title text-ok`}>{executionSummary.totalActions}</span>
            <span className="font-body text-muted text-label">autonomous actions · 30d</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-px bg-rule2 border-b border-rule2">
          {[
            { label: 'Success rate', val: executionSummary.successRate != null ? `${Math.round(executionSummary.successRate * 100)}%` : '—', tone: 'text-ok' },
            { label: 'Escalation rate', val: executionSummary.escalationRate != null ? `${Math.round(executionSummary.escalationRate * 100)}%` : '—', tone: 'text-warn' },
            { label: 'Rollback rate', val: executionSummary.rollbackRate != null ? `${Math.round(executionSummary.rollbackRate * 100)}%` : '—', tone: 'text-muted' },
            { label: 'Avg monitor', val: executionSummary.avgMonitoringWindow, tone: 'text-ink' },
          ].map(({ label, val, tone }) => (
            <div key={label} className="bg-stone px-3 py-2">
              <div className="font-body text-muted text-micro tracking-normal mb-0.5">{label}</div>
              <div className={`font-body font-medium text-body ${tone}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tiers */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label tracking-normal">Autonomy tiers</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button type="button" onClick={() => { setSelectedTier(null); setSelectedId(null) }}
            className={`w-full text-left px-4 py-2.5 border-b border-rule2 border-l-4 transition-colors ${!selectedTier ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
            <span className="font-body font-medium text-ink text-label">All events</span>
            <span className="font-body text-muted text-label ml-2">{executionLog.length}</span>
          </button>
          {autonomyTiers.map(t => (
            <TierRow key={t.id} tier={t}
              isActive={selectedTier === t.id}
              onClick={() => { setSelectedTier(t.id); setSelectedId(null) }} />
          ))}
        </div>
      </div>

      {/* Center: execution timeline */}
      <div className="w-[380px] flex-shrink-0 border-r border-rule2 flex flex-col">
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
          <span className="font-body text-muted text-label tracking-normal">
            {selectedTier ? `${selectedTier} tier` : 'All events'} · {filtered.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-body text-ok text-label"><span className="w-1.5 h-1.5 rounded-full bg-ok" />Success</span>
            <span className="flex items-center gap-1 font-body text-warn text-label"><span className="w-1.5 h-1.5 rounded-full bg-warn" />Escalated</span>
            <span className="flex items-center gap-1 font-body text-ochre text-label"><span className="w-1.5 h-1.5 rounded-full bg-ochre" />Pending</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(e => (
            <LogRow key={e.id} entry={e}
              selected={selectedId === e.id}
              onClick={() => setSelectedId(e.id)} />
          ))}
        </div>

        {/* Authority ceiling callout */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-rule2 bg-stone2">
          <div className="flex items-start gap-2">
            <Shield size={10} className="text-ochre flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="font-body font-medium text-ink text-label mb-0.5">Current authority ceiling: Execute</div>
              <p className="font-body text-muted text-label leading-snug">Govern tier not yet active. 5 agents operate autonomously within pre-approved action classes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: action detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-muted text-label tracking-normal">Event detail</span>
        </div>
        <ActionDetail entry={selectedEntry} />
      </div>
    </div>
  )
}
