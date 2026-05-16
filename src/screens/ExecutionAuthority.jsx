import { useState } from 'react'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { CheckCircle2, AlertTriangle, Clock, RotateCcw, Zap, Eye, MessageSquare, Shield, ArrowRight } from 'lucide-react'

const TIER_ICONS = { observe: Eye, recommend: MessageSquare, execute: Zap, govern: Shield }

const OUTCOME_CFG = {
  success:   { label: 'Success',     cls: 'bg-ok/10 text-ok border border-ok/30',         dot: 'bg-ok' },
  escalated: { label: 'Escalated',   cls: 'bg-warn/10 text-warn border border-warn/30',   dot: 'bg-warn' },
  pending:   { label: 'Pending',     cls: 'bg-ochre/10 text-ochre border border-ochre/30', dot: 'bg-ochre' },
  rollback:  { label: 'Rolled back', cls: 'bg-stone3 text-muted border border-rule2',      dot: 'bg-muted' },
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
        <span className={`font-body font-medium text-[11px] ${tier.color}`}>{tier.label}</span>
        {tier.agentCount > 0 && (
          <span className="ml-auto font-body text-ghost text-[9px]">{tier.agentCount} agents</span>
        )}
      </div>
      <p className="font-body text-ghost text-[9px] leading-snug">{tier.description}</p>
      {tier.actionCount > 0 && (
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-body text-[9px] text-muted">{tier.actionCount} actions</span>
          {tier.approvalRate != null && (
            <span className="font-body text-[9px] text-ok">{Math.round(tier.approvalRate * 100)}% approved</span>
          )}
          {tier.rollbackRate != null && (
            <span className="font-body text-[9px] text-warn">{Math.round(tier.rollbackRate * 100)}% escalated</span>
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
        selected ? 'bg-stone2 border-l-4 border-l-ochre' : 'hover:bg-stone2/50 border-l-4 border-l-transparent'
      }`}>
      <div className="flex items-start gap-2 mb-1">
        <div className={`relative flex h-1.5 w-1.5 flex-shrink-0 mt-1`}>
          {entry.outcome === 'success' && !entry.deviation && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-30" />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${out.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-ink text-[10px] leading-snug mb-0.5">{entry.action}</p>
          <div className="flex items-center gap-2">
            <span className="font-body text-ghost text-[9px]">{entry.agent}</span>
            <span className="font-body text-ghost text-[9px] opacity-50">·</span>
            <TierIcon size={9} strokeWidth={2} className="text-ghost opacity-60" />
            <span className="font-body text-ghost text-[9px] capitalize">{entry.tier}</span>
          </div>
        </div>
        <span className={`font-body text-[8px] px-1.5 py-0.5 flex-shrink-0 ${out.cls}`}>{out.label}</span>
      </div>
      <div className="flex items-center gap-3 pl-3.5">
        <span className="font-body text-ghost text-[9px]">{entry.timeLabel}</span>
        {entry.monitoringWindow && (
          <span className="font-body text-ghost text-[9px]">· {entry.monitoringWindow} window</span>
        )}
        {!entry.reversible && (
          <span className="font-body text-muted text-[9px]">· Irreversible</span>
        )}
      </div>
    </button>
  )
}

function ActionDetail({ entry }) {
  if (!entry) return (
    <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
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
          <TierIcon size={10} strokeWidth={2} className="text-ghost" />
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest capitalize">{entry.tier} tier</span>
          <span className={`ml-auto font-body text-[9px] px-1.5 py-0.5 ${out.cls}`}>{out.label}</span>
        </div>
        <div className="font-display font-bold text-ink text-[18px] leading-tight mb-1">{entry.action}</div>
        <div className="font-body text-ghost text-[11px]">{entry.agent} · {entry.timeLabel}</div>
      </div>

      {/* Rationale */}
      <div className="px-4 py-3 bg-stone2 border border-rule2 border-l-4 border-l-ochre">
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Agent rationale</div>
        <p className="font-body text-ink text-[11px] leading-relaxed">{entry.rationale}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
        {[
          { label: 'Outcome', val: out.label, tone: entry.outcome === 'success' ? 'text-ok' : entry.outcome === 'escalated' ? 'text-warn' : 'text-ochre' },
          { label: 'Monitoring window', val: entry.monitoringWindow ?? 'N/A', tone: 'text-muted' },
          { label: 'Reversible', val: entry.reversible ? 'Yes' : 'No', tone: entry.reversible ? 'text-ok' : 'text-ghost' },
          { label: 'Deviation detected', val: entry.deviation ? 'Yes' : 'No', tone: entry.deviation ? 'text-warn' : 'text-ok' },
          { label: 'Escalated', val: entry.escalated ? 'Yes' : 'No', tone: entry.escalated ? 'text-warn' : 'text-ok' },
          { label: 'Rollback available', val: entry.rollbackAvailable ? 'Yes' : 'No', tone: entry.rollbackAvailable ? 'text-ok' : 'text-ghost' },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
            <div className={`font-body font-medium text-[12px] ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Impact */}
      {entry.impact && (
        <div className={`flex items-center gap-3 px-4 py-3 border ${entry.impact.positive ? 'border-ok/30 bg-ok/[0.04]' : 'border-warn/30 bg-warn/[0.04]'}`}>
          <ArrowRight size={12} className={entry.impact.positive ? 'text-ok' : 'text-warn'} strokeWidth={2} />
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">{entry.impact.metric}</div>
            <div className={`font-body font-medium text-[13px] ${entry.impact.positive ? 'text-ok' : 'text-warn'}`}>{entry.impact.delta}</div>
          </div>
        </div>
      )}

      {/* Escalation note */}
      {entry.escalationNote && (
        <div className="flex items-start gap-2 px-3 py-2.5 border border-warn/30 bg-warn/[0.04] border-l-2 border-l-warn">
          <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="font-body text-warn text-[11px] leading-snug">{entry.escalationNote}</p>
        </div>
      )}

      {/* Rollback record */}
      {rb && (
        <div className="border border-rule2 bg-stone2 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw size={10} className="text-muted" strokeWidth={2} />
            <span className="font-body text-muted text-[9px] uppercase tracking-widest">Rollback executed</span>
          </div>
          <p className="font-body text-ink text-[11px] mb-1">{rb.rollbackAction}</p>
          <p className="font-body text-ghost text-[10px] leading-snug">{rb.reason}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-body text-ghost text-[9px]">{rb.timestamp.replace('T', ' ').substring(0, 16)}</span>
            <span className="font-body text-ghost text-[9px] opacity-50">·</span>
            <span className="font-body text-[9px] px-1.5 py-0.5 bg-ok/10 text-ok border border-ok/30">Complete</span>
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
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Frontier Layer</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Execution Authority</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`font-display font-bold display-num text-[22px] text-ok`}>{executionSummary.totalActions}</span>
            <span className="font-body text-ghost text-[10px]">autonomous actions · 30d</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-px bg-rule2 border-b border-rule2">
          {[
            { label: 'Success rate', val: `${Math.round(executionSummary.successRate * 100)}%`, tone: 'text-ok' },
            { label: 'Escalation rate', val: `${Math.round(executionSummary.escalationRate * 100)}%`, tone: 'text-warn' },
            { label: 'Rollback rate', val: `${Math.round(executionSummary.rollbackRate * 100)}%`, tone: 'text-muted' },
            { label: 'Avg monitor', val: executionSummary.avgMonitoringWindow, tone: 'text-ink' },
          ].map(({ label, val, tone }) => (
            <div key={label} className="bg-stone px-3 py-2">
              <div className="font-body text-ghost text-[8px] uppercase tracking-widest mb-0.5">{label}</div>
              <div className={`font-body font-medium text-[12px] ${tone}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tiers */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest">Autonomy tiers</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button type="button" onClick={() => { setSelectedTier(null); setSelectedId(null) }}
            className={`w-full text-left px-4 py-2.5 border-b border-rule2 border-l-4 transition-colors ${!selectedTier ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
            <span className="font-body font-medium text-ink text-[11px]">All events</span>
            <span className="font-body text-ghost text-[10px] ml-2">{executionLog.length}</span>
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
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">
            {selectedTier ? `${selectedTier} tier` : 'All events'} · {filtered.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-body text-ok text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ok" />Success</span>
            <span className="flex items-center gap-1 font-body text-warn text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-warn" />Escalated</span>
            <span className="flex items-center gap-1 font-body text-ochre text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ochre" />Pending</span>
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
              <div className="font-body font-medium text-ink text-[10px] mb-0.5">Current authority ceiling: Execute</div>
              <p className="font-body text-ghost text-[9px] leading-snug">Govern tier not yet active. 5 agents operate autonomously within pre-approved action classes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: action detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Event detail</span>
        </div>
        <ActionDetail entry={selectedEntry} />
      </div>
    </div>
  )
}
