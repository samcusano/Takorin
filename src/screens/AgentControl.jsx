import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle, Truck, Users, Wrench, Handshake, Bell,
  ClipboardCheck, Shield, Database, ChevronDown, ChevronRight,
  Timer, CheckCircle, XCircle, Check, Flag, InspectionPanel,
} from 'lucide-react'
import { Btn, SlidePanel } from '../components/UI'
import { agentConfigData, dataSourceHealth } from '../data'
import { agentPrompts } from '../data/prompts'
import { useAppState } from '../context/AppState'

const ICON_MAP = {
  Shield, AlertTriangle, Truck, Users, Wrench,
  Handshake, Bell, ClipboardCheck, Database,
}

// ─── Priority enrichment ──────────────────────────────────────────────────────
// Verb-first action labels for clean scan reading.
const VERB_MAP = {
  'pa3-emergency': 'Auto-assign R-09 to Oven Station B',
  'pa1':           'Open CAPA — R-03 vibration anomaly',
  'pa2':           'Hold Lot L-0891 — ConAgra COA missing',
  'pa3':           'Pre-allocate R-06 as Line 4 sauce fallback',
  'pa4':           'Schedule R-03 bearing inspection tonight',
  'pa5':           'Draft PM handoff for M. Santos',
  'pa-capa-1':     'Send final reminder — Kowalski evidence overdue',
  'pa-dg-1':       'Flag HR data stale — 3 agents affected',
}

// Dependency clustering: decisions sharing a subject get visually grouped.
const GROUP_MAP = {
  'pa1': 'r03',
  'pa4': 'r03',
}

const GROUP_META = {
  r03: {
    label: 'R-03 · 2 linked decisions',
    boost: '+14 confidence',
    note: 'Resolving the CAPA and scheduling the inspection together closes this anomaly fully',
  },
}

// Expiry chip: only shown for time-critical actions (<24h or high urgency).
const SHOW_EXPIRY = {
  'pa3-emergency': true,
  'pa1':           true,
  'pa2':           true,
  'pa3':           false,
  'pa4':           true,
  'pa5':           true,
  'pa-capa-1':     true,
  'pa-dg-1':       false,
}

function enrich(pa, agent) {
  const base = pa.isEmergencyAutoAct ? {
    consequence: 'critical',
    expiresLabel: `${pa.overrideWindowMin ?? 15} min window`,
    blastRadius: 'Production line coverage',
    sortKey: 0,
  } : agent.isComplianceCategory ? {
    consequence: 'high',
    expiresLabel: 'Regulatory window — act today',
    blastRadius: '1 compliance case + FSMA record',
    sortKey: 1,
  } : {
    consequence: 'medium',
    expiresLabel: pa.id === 'pa5' ? 'Shift handoff due' : pa.id === 'pa-capa-1' ? '24h final deadline' : '14h window',
    blastRadius: 'Line 4 — 1 unit affected',
    sortKey: 2,
  }
  return {
    ...base,
    verbFirst: VERB_MAP[pa.id] ?? pa.action,
    groupId:   GROUP_MAP[pa.id] ?? null,
    showExpiry: SHOW_EXPIRY[pa.id] ?? (base.consequence !== 'medium'),
  }
}

const CONSEQUENCE_CFG = {
  critical: { label: 'Critical', color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', borderW: 'border-l-[5px]' },
  high:     { label: 'High',     color: 'text-warn',   bg: 'bg-warn/[0.03]',   border: 'border-l-warn',   borderW: 'border-l-4'     },
  medium:   { label: 'Medium',   color: 'text-ghost',  bg: '',                  border: 'border-l-rule2',  borderW: 'border-l-2'     },
  low:      { label: 'Low',      color: 'text-ghost',  bg: '',                  border: 'border-l-rule2',  borderW: 'border-l-2'     },
}

// ─── Override rationale modal ─────────────────────────────────────────────────

function OverrideModal({ agentName, actionLabel, onConfirm, onCancel }) {
  const [rationale, setRationale] = useState('')
  const ref = useRef(null)
  const tooShort = rationale.trim().length < 20
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-6">
      <div className="bg-stone border border-rule2 w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Override — rationale required</div>
          <div className="font-display font-bold text-ink text-[15px]">{agentName}</div>
          <div className="font-body text-muted text-[11px] mt-0.5">{actionLabel}</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="font-body text-muted text-[12px] leading-relaxed">
            This override suppresses a compliance-category agent action. The rationale is logged to the activity feed and becomes part of the audit record.
          </p>
          <div>
            <label className="font-body text-ghost text-[10px] uppercase tracking-widest block mb-1.5">Rationale</label>
            <textarea ref={ref} value={rationale} onChange={e => setRationale(e.target.value)}
              rows={3} placeholder="Why are you overriding? (min 20 characters)"
              className="w-full font-body text-[12px] text-ink bg-stone2 border border-rule2 px-3 py-2 resize-none focus:outline-none focus:border-rule" />
            <div className={`font-body text-[10px] mt-1 ${tooShort ? 'text-danger' : 'text-ok'}`}>
              {tooShort ? `${20 - rationale.trim().length} more characters required` : 'Rationale meets minimum length'}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-3 border-t border-rule2 bg-stone2">
          <Btn variant="primary" disabled={tooShort} onClick={() => onConfirm(rationale.trim())}>Confirm override</Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Disable confirm modal ────────────────────────────────────────────────────

function DisableModal({ agent, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-6">
      <div className="bg-stone border border-rule2 w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Disable agent — confirm</div>
          <div className="font-display font-bold text-ink text-[15px]">{agent.name}</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="font-body text-muted text-[12px] leading-relaxed">
            Disabling this agent changes your compliance posture. These obligations will no longer be covered automatically:
          </p>
          {agent.isComplianceCategory && agent.regulatoryObligations?.length > 0 ? (
            <ul className="space-y-1">
              {agent.regulatoryObligations.map(o => (
                <li key={o} className="flex items-start gap-2 font-body text-[11px] text-danger">
                  <span className="mt-0.5 flex-shrink-0">·</span><span>{o}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-muted text-[11px]">No regulatory obligations attached — safe to disable.</p>
          )}
          {agent.isComplianceCategory && (
            <div className="px-3 py-2 bg-danger/[0.06] border-l-2 border-l-danger">
              <p className="font-body text-danger text-[11px] font-medium">Manual review required until re-enabled.</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 py-3 border-t border-rule2 bg-stone2">
          <Btn variant="primary" onClick={onConfirm}>Disable agent</Btn>
          <Btn variant="secondary" onClick={onCancel}>Keep enabled</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Approve button (compliance-gated 5s delay) ───────────────────────────────

function ApproveBtn({ isCompliance, onApprove }) {
  const [count, setCount] = useState(isCompliance ? 5 : 0)
  const ready = count === 0
  useEffect(() => {
    if (!isCompliance || count <= 0) return
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, isCompliance])
  return (
    <button type="button" onClick={ready ? onApprove : undefined} disabled={!ready}
      aria-label={ready ? 'Approve' : `Approve (${count}s)`}
      title={ready ? 'Approve' : `Approve (${count}s)`}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all ${
        ready ? 'bg-ink text-stone hover:bg-ink/90 cursor-pointer' : 'bg-stone3 text-muted cursor-not-allowed'
      }`}>
      {ready ? <Check size={13} strokeWidth={2} /> : <span className="font-body text-[9px] tabular-nums">{count}</span>}
    </button>
  )
}

// ─── Inline emergency chip (countdown in row) ─────────────────────────────────

function EmergencyChip({ overrideWindowMin }) {
  const [remaining, setRemaining] = useState((overrideWindowMin ?? 15) * 60)
  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return (
    <span className="font-body text-[9px] text-danger bg-danger/[0.08] px-1.5 py-0.5 tabular-nums flex-shrink-0 whitespace-nowrap font-medium">
      ⚡ {remaining > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : 'Auto-confirmed'}
    </span>
  )
}

// ─── Compact ledger row ───────────────────────────────────────────────────────

function LedgerRow({ pa, agent, onInvestigate, onApprove, onOverrideRequest, selected, onToggleSelect, inGroup = false }) {
  const [open, setOpen] = useState(false)
  const meta = pa._meta
  const cfg = CONSEQUENCE_CFG[meta.consequence]
  const isCompliance = agent.isComplianceCategory
  const Icon = ICON_MAP[agent.icon] || Shield

  if (pa._decided) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2 border-b border-rule2 last:border-0 opacity-40 ${inGroup ? '' : `${cfg.borderW} ${cfg.border}`}`}>
        <div className="w-3.5 flex-shrink-0" />
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${pa._decided === 'approved' ? 'bg-ok' : 'bg-ghost'}`} />
        <span className="font-body text-muted text-[11px] flex-1 truncate">{meta.verbFirst}</span>
        <span className={`font-body text-[10px] ${pa._decided === 'approved' ? 'text-ok' : 'text-ghost'}`}>
          {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
        </span>
      </div>
    )
  }

  return (
    <div className={`border-b border-rule2 last:border-0 ${open ? cfg.bg : ''} ${inGroup ? '' : `border-l ${cfg.borderW} ${cfg.border}`}`}>
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone2 transition-colors min-h-[44px]">
        {/* Row checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(pa._key)}
          className="w-3.5 h-3.5 cursor-pointer flex-shrink-0 accent-ochre"
          aria-label={`Select action`}
        />

        {/* Agent icon */}
        <Icon size={10} className="text-ghost flex-shrink-0" />

        {/* Action text (verb-first) + inline reason */}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-[12px] flex-shrink-0 leading-snug">{meta.verbFirst}</span>
          {!open && pa.rationale && (
            <span className="font-body text-ghost text-[10px] truncate min-w-0 leading-snug">
              — {pa.rationale.slice(0, 72)}{pa.rationale.length > 72 ? '…' : ''}
            </span>
          )}
        </button>

        {/* Expiry chip (only when urgent, non-emergency) */}
        {meta.showExpiry && !pa.isEmergencyAutoAct && (
          <span className={`font-body text-[9px] px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap ${
            meta.consequence === 'high' ? 'bg-warn/[0.08] text-warn' : 'bg-stone3 text-ghost'
          }`}>
            {meta.expiresLabel}
          </span>
        )}

        {/* Emergency chip with live countdown */}
        {pa.isEmergencyAutoAct && <EmergencyChip overrideWindowMin={pa.overrideWindowMin} />}

        {/* CTAs */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {pa.isEmergencyAutoAct ? (
            <button type="button" onClick={() => onOverrideRequest(pa, agent)}
              aria-label="Override" title="Override"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-danger/40 text-danger hover:bg-danger/[0.06] transition-colors">
              <Flag size={13} strokeWidth={2} />
            </button>
          ) : (
            <>
              <ApproveBtn isCompliance={isCompliance} onApprove={() => onApprove(pa._key)} />
              <button type="button" onClick={() => onOverrideRequest(pa, agent)}
                aria-label="Override" title="Override"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
                <Flag size={13} strokeWidth={2} />
              </button>
            </>
          )}
          <button type="button" onClick={() => onInvestigate(pa, agent)}
            aria-label="Investigate" title="Investigate"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
            <InspectionPanel size={13} strokeWidth={2} />
          </button>
        </div>

        <button type="button" onClick={() => setOpen(o => !o)} className="flex-shrink-0 ml-0.5">
          {open
            ? <ChevronDown size={11} className="text-ghost" />
            : <ChevronRight size={11} className="text-ghost" />}
        </button>
      </div>

      {/* Expanded detail (inline — lightweight) */}
      {open && (
        <div className="px-4 py-3 border-t border-rule2 bg-stone2">
          <div className="grid grid-cols-2 gap-4">
            {pa.impactPreview?.length > 0 && (
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1.5">Impact preview</div>
                {pa.impactPreview.slice(0, 3).map((l, i) => (
                  <div key={i} className="font-body text-muted text-[10px] leading-snug mb-1">· {l}</div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-20 bg-stone3 flex-shrink-0 relative">
                    <div className={`h-full ${pa.confidence >= 85 ? 'bg-ok' : pa.confidence >= 65 ? 'bg-warn' : 'bg-danger'}`}
                      style={{ width: `${pa.confidence}%` }} />
                    <div className="absolute top-0 bottom-0 w-px bg-ink/30"
                      style={{ left: `${agent.confidenceThreshold ?? 80}%` }} />
                  </div>
                  <span className={`font-body font-medium text-[10px] tabular-nums ${pa.confidence >= (agent.confidenceThreshold ?? 80) ? 'text-ok' : 'text-warn'}`}>
                    {pa.confidence}%
                  </span>
                </div>
              </div>
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Blast radius</div>
                <div className="font-body text-muted text-[10px]">{meta.blastRadius}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dependency group container ───────────────────────────────────────────────

function DependencyGroup({ groupId, rows, commonProps }) {
  const meta = GROUP_META[groupId]
  if (!meta || rows.length < 2) {
    return rows.map(({ pa, agent }) => (
      <LedgerRow key={pa._key} pa={pa} agent={agent} {...commonProps} />
    ))
  }
  return (
    <div className="border border-rule2 overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-stone3 border-b border-rule2">
        <div className="h-1.5 w-1.5 rounded-full bg-ochre flex-shrink-0" />
        <span className="font-body text-muted text-[10px]">{meta.label}</span>
        <span className="ml-auto font-body text-ochre text-[10px]">Resolve together → {meta.boost}</span>
      </div>
      <div className="px-4 py-1 border-b border-rule2 bg-stone2">
        <span className="font-body text-ghost text-[9px] italic">{meta.note}</span>
      </div>
      {rows.map(({ pa, agent }) => (
        <LedgerRow key={pa._key} pa={pa} agent={agent} {...commonProps} inGroup />
      ))}
    </div>
  )
}

// ─── Batch action bar ─────────────────────────────────────────────────────────

function BatchBar({ count, onApproveAll, onDeferAll }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-ink border-t border-sidebar-border">
      <span className="font-body text-stone text-[11px]">{count} selected</span>
      <button type="button" onClick={onApproveAll}
        className="font-body text-[11px] px-3 py-1.5 bg-stone text-ink hover:bg-stone2 transition-colors">
        Approve all low-risk
      </button>
      <button type="button" onClick={onDeferAll}
        className="font-body text-[11px] px-3 py-1.5 border border-stone/30 text-stone hover:bg-stone/10 transition-colors">
        Defer all low confidence
      </button>
    </div>
  )
}

// ─── Investigation panel (inside SlidePanel) ──────────────────────────────────

function InvestigationPanel({ pa, agent, agentActions }) {
  const [tab, setTab] = useState('evidence')
  const prompt = agentPrompts[agent.id]
  const recentActions = (agentActions ?? []).filter(a => a.agentId === agent.id).slice(0, 5)

  const TABS = [
    { id: 'evidence',    label: 'Evidence'    },
    { id: 'impact',      label: 'Impact'      },
    { id: 'action-log',  label: 'Action log'  },
    { id: 'diagnostics', label: 'Diagnostics' },
  ]

  return (
    <div>
      <div className="-mx-5 -mt-5 flex border-b border-rule2 mb-5">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`font-body text-[10px] px-4 py-2.5 border-b-2 transition-colors ${
              tab === t.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-ghost hover:text-muted'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'evidence' && (
          <div className="space-y-5">
            {pa.evidence ? (
              <>
                <div>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Summary</div>
                  <p className="font-body text-ink text-[12px] leading-relaxed">{pa.evidence.summary}</p>
                </div>
                {pa.evidence.causalSignals?.length > 0 && (
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Causal signals</div>
                    <div className="border border-rule2 divide-y divide-rule2">
                      {pa.evidence.causalSignals.map((s, i) => {
                        const c = s.status === 'breach' || s.status === 'stale' ? 'text-danger' : s.status === 'warn' ? 'text-warn' : s.status === 'eligible' ? 'text-ok' : 'text-ok'
                        const l = s.status === 'breach' ? 'Breach' : s.status === 'stale' ? 'Stale' : s.status === 'warn' ? 'Watch' : s.status === 'eligible' ? 'Eligible' : 'OK'
                        return (
                          <div key={i} className="grid grid-cols-[140px_1fr_80px] gap-3 px-3 py-2.5 items-start">
                            <div className="font-body text-ghost text-[10px] pt-px">{s.signal}</div>
                            <div>
                              <div className="font-body text-ink text-[11px] font-medium">{s.reading}</div>
                              {s.threshold && <div className="font-body text-ghost text-[9px] mt-0.5">vs. {s.threshold}</div>}
                              {s.note && <div className="font-body text-muted text-[10px] mt-0.5 leading-snug">{s.note}</div>}
                            </div>
                            <div className={`font-body text-[10px] font-medium text-right ${c}`}>{l}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {pa.evidence.dependencies?.length > 0 && (
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Dependencies</div>
                    <div className="border border-rule2 divide-y divide-rule2">
                      {pa.evidence.dependencies.map((d, i) => {
                        const dot = d.status === 'required' ? 'bg-warn' : d.status === 'blocked' ? 'bg-danger' : d.status === 'eligible' ? 'bg-ok' : 'bg-ghost'
                        const lc = d.status === 'required' ? 'text-warn' : d.status === 'blocked' ? 'text-danger' : d.status === 'eligible' ? 'text-ok' : 'text-ghost'
                        const ll = { required: 'Required', blocked: 'Blocked', eligible: 'Eligible', contingent: 'Contingent', pending: 'Pending', 'not-required': 'Not required' }[d.status] ?? d.status
                        return (
                          <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                            <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-body text-ink text-[11px] font-medium">{d.label}</div>
                              {d.note && <div className="font-body text-ghost text-[10px] mt-0.5 leading-snug">{d.note}</div>}
                            </div>
                            <div className={`font-body text-[9px] uppercase tracking-widest flex-shrink-0 ${lc}`}>{ll}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {pa.evidence.riskForecast && (
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Risk forecast</div>
                    <div className="border border-rule2 bg-stone2 px-4 py-3">
                      <p className="font-body text-ink text-[12px] leading-relaxed">{pa.evidence.riskForecast}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="font-body text-ghost text-[11px]">No structured evidence available.</div>
            )}
          </div>
        )}

        {tab === 'impact' && (
          <div className="space-y-4">
            <div>
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">If approved — downstream effects</div>
              {pa.impactPreview?.length > 0 ? (
                <div className="border border-rule2 divide-y divide-rule2">
                  {pa.impactPreview.map((line, i) => (
                    <div key={i} className={`px-3 py-2.5 font-body text-[11px] leading-snug ${
                      line.toLowerCase().includes('liability') || line.toLowerCase().includes('legal') ? 'text-danger'
                        : line.toLowerCase().includes('stale') || line.toLowerCase().includes('⚠') ? 'text-warn' : 'text-muted'
                    }`}>{line}</div>
                  ))}
                </div>
              ) : (
                <div className="font-body text-ghost text-[11px]">No impact preview available.</div>
              )}
            </div>
            <div>
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Confidence</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-stone3 relative">
                  <div className={`h-full ${pa.confidence >= 85 ? 'bg-ok' : pa.confidence >= 65 ? 'bg-warn' : 'bg-danger'}`}
                    style={{ width: `${pa.confidence}%` }} />
                  <div className="absolute top-0 bottom-0 w-px bg-ink/40" style={{ left: `${agent.confidenceThreshold ?? 80}%` }} />
                </div>
                <span className={`font-body text-[11px] font-medium tabular-nums ${pa.confidence >= (agent.confidenceThreshold ?? 80) ? 'text-ok' : 'text-warn'}`}>
                  {pa.confidence}%
                </span>
              </div>
              {agent.confidenceMethodology && (
                <p className="font-body text-ghost text-[10px] mt-2 leading-relaxed">{agent.confidenceMethodology}</p>
              )}
            </div>
          </div>
        )}

        {tab === 'action-log' && (
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Recent actions — {agent.name}</div>
            {recentActions.length > 0 ? (
              <div className="border border-rule2 divide-y divide-rule2">
                {recentActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="font-body text-ghost text-[9px] flex-shrink-0 w-10 pt-px">{a.timestamp?.slice(11, 16) || '—'}</span>
                    <div className="flex-1">
                      <div className="font-body text-ink text-[11px] leading-snug">{a.action}</div>
                      {a.rationale && <div className="font-body text-ghost text-[10px] mt-0.5">{a.rationale}</div>}
                    </div>
                    <span className={`font-body text-[9px] flex-shrink-0 ${a.status === 'completed' ? 'text-ok' : a.status === 'overridden' ? 'text-ghost' : 'text-warn'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-body text-ghost text-[11px]">No actions logged this session.</div>
            )}
          </div>
        )}

        {tab === 'diagnostics' && (
          <div className="space-y-4">
            <div>
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Model diagnostics</div>
              <div className="border border-rule2 divide-y divide-rule2">
                {[
                  ['Prompt version', `v${prompt?.version ?? agent.promptVersion ?? '—'}`],
                  ['Autonomy level', agent.autonomyLevel ?? '—'],
                  ['Confidence threshold', `${agent.confidenceThreshold ?? '—'}%`],
                  ['Write scope', agent.writeScope ?? 'Not specified'],
                  ...(prompt?.lastUpdated ? [['Last updated', `${prompt.lastUpdated} — ${prompt.changeReason}`]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-4 px-3 py-2.5">
                    <span className="font-body text-ghost text-[10px] w-36 flex-shrink-0">{label}</span>
                    <span className="font-body text-muted text-[11px] leading-snug">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            {prompt?.hardConstraints?.length > 0 && (
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Hard constraints</div>
                <ul className="space-y-1.5">
                  {prompt.hardConstraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 font-body text-[11px] text-muted">
                      <XCircle size={10} className="text-danger flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Activity log (SlidePanel content) ───────────────────────────────────────

function ActivityLog({ agentActions }) {
  const recent = (agentActions ?? []).slice(0, 20)
  if (recent.length === 0) return (
    <div className="font-body text-ghost text-[11px]">No agent activity recorded this session.</div>
  )
  return (
    <div className="-mx-5 -mt-5 border-t border-rule2">
      {recent.map((a, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
          <span className="font-body text-ghost text-[9px] flex-shrink-0 w-10 pt-px">{a.timestamp?.slice(11, 16) || '—'}</span>
          <span className="font-body text-muted text-[10px] flex-shrink-0 w-28 truncate">{a.agentId}</span>
          <span className="font-body text-ink text-[11px] leading-snug flex-1">{a.action}</span>
          <span className={`font-body text-[9px] flex-shrink-0 ${a.status === 'completed' ? 'text-ok' : a.status === 'overridden' ? 'text-ghost' : 'text-warn'}`}>
            {a.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Fleet confidence strip ───────────────────────────────────────────────────

const STALE_AGENTS = new Set(['pre-shift', 'resource', 'handoff'])

function FleetStrip({ agents }) {
  const staleSource = dataSourceHealth?.find(s => s.status === 'stale')
  return (
    <div className="flex items-stretch border-t border-b border-rule2 bg-stone2 flex-shrink-0 overflow-x-auto">
      {agents.map(agent => {
        const Icon = ICON_MAP[agent.icon] || Shield
        const conf = agent.confidenceThreshold ?? 80
        const hasPending = agent.pendingActions?.length > 0
        const isStale = staleSource && STALE_AGENTS.has(agent.id)
        const confVal = agent.pendingActions?.[0]?.confidence ?? conf + 10
        const isAuto = confVal >= conf && agent.enabled
        const color = !agent.enabled ? 'text-ghost' : confVal >= 85 ? 'text-ok' : confVal >= 65 ? 'text-warn' : 'text-danger'
        return (
          <div key={agent.id}
            className={`flex flex-col justify-center px-3 py-2 border-r border-rule2 last:border-r-0 flex-shrink-0 min-w-[88px] ${hasPending ? 'bg-warn/[0.04]' : ''}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`relative flex h-1.5 w-1.5 flex-shrink-0`}>
                {agent.enabled && confVal >= conf && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${!agent.enabled ? 'bg-ghost' : confVal >= 85 ? 'bg-ok' : confVal >= 65 ? 'bg-warn' : 'bg-danger'}`} />
              </span>
              <Icon size={10} className="text-ghost flex-shrink-0" />
              {isStale && <AlertTriangle size={9} className="text-danger flex-shrink-0" />}
              {hasPending && <span className="h-1 w-1 rounded-full bg-warn flex-shrink-0" />}
            </div>
            <div className="font-body text-ghost text-[9px] leading-none mb-0.5 truncate" style={{ maxWidth: 72 }}>
              {agent.name.split(' ')[0]}
            </div>
            <div className={`font-display font-bold display-num text-[11px] leading-none ${color}`}>
              {agent.enabled ? `${confVal}%` : 'Off'}
            </div>
            {isAuto && agent.enabled && <div className="font-body text-[8px] text-ok uppercase tracking-widest mt-0.5">auto</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AgentControl() {
  const { agentActions, systemConfidence, logAgentAction, overrideAgentAction } = useAppState()
  const agents = agentConfigData?.agents ?? []

  const allPending = agents
    .flatMap(agent =>
      (agent.pendingActions ?? []).map((pa, idx) => ({
        ...pa,
        _key: `${agent.id}-${idx}`,
        _agentId: agent.id,
        _meta: enrich(pa, agent),
        _decided: null,
      }))
    )
    .sort((a, b) => a._meta.sortKey - b._meta.sortKey)

  const [pending, setPending]             = useState(allPending)
  const [selected, setSelected]           = useState(new Set())
  const [investigationDrawer, setInvestigationDrawer] = useState(null)
  const selectAllRef = useRef(null)
  const [activityDrawer, setActivityDrawer]           = useState(false)
  const [overrideModal, setOverrideModal] = useState(null)
  const [disableModal, setDisableModal]   = useState(null)

  const handleApprove = (key) => {
    const pa = pending.find(p => p._key === key)
    setPending(prev => prev.map(p => p._key === key ? { ...p, _decided: 'approved' } : p))
    setSelected(prev => { const n = new Set(prev); n.delete(key); return n })
    if (investigationDrawer?.pa._key === key) setInvestigationDrawer(null)
    logAgentAction?.({ agentId: pa?._agentId, action: 'Director approved', status: 'completed', timestamp: new Date().toISOString() })
  }

  const handleOverrideConfirm = (rationale) => {
    const { pa } = overrideModal
    setPending(prev => prev.map(p => p._key === pa._key ? { ...p, _decided: 'overridden' } : p))
    setSelected(prev => { const n = new Set(prev); n.delete(pa._key); return n })
    if (investigationDrawer?.pa._key === pa._key) setInvestigationDrawer(null)
    overrideAgentAction?.({ agentId: pa._agentId, actionId: pa._key, rationale })
    setOverrideModal(null)
  }

  const toggleSelect = (key) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  const handleApproveAll = () => {
    const lowRisk = [...selected].filter(key => {
      const pa = pending.find(p => p._key === key)
      return pa && pa._meta.consequence === 'medium' && !pa.isEmergencyAutoAct && !pa._decided
    })
    lowRisk.forEach(key => handleApprove(key))
    setSelected(new Set())
  }

  const handleDeferAll = () => {
    setSelected(new Set())
  }

  const undecidedPending = pending.filter(p => !p._decided)
  const undecidedCount = undecidedPending.length
  const confColor = (systemConfidence ?? 79) >= 85 ? 'text-ok' : (systemConfidence ?? 79) >= 65 ? 'text-warn' : 'text-danger'

  useEffect(() => {
    if (!selectAllRef.current) return
    const allSelected = undecidedPending.length > 0 && undecidedPending.every(p => selected.has(p._key))
    const someSelected = selected.size > 0 && !allSelected
    selectAllRef.current.indeterminate = someSelected
  }, [selected, undecidedPending])
  const staleSource = dataSourceHealth?.find(s => s.status === 'stale')

  // Build grouped render list — groups appear at position of first member
  const renderItems = []
  const renderedGroups = new Set()
  const groupsMap = {}
  undecidedPending.forEach(pa => {
    if (pa._meta.groupId) {
      if (!groupsMap[pa._meta.groupId]) groupsMap[pa._meta.groupId] = []
      groupsMap[pa._meta.groupId].push(pa)
    }
  })

  // Include decided items inline too (faded)
  const allItems = [...undecidedPending, ...pending.filter(p => p._decided)]

  allItems.forEach(pa => {
    const agent = agents.find(a => a.id === pa._agentId)
    if (!agent) return
    const gid = pa._meta.groupId
    if (gid && !renderedGroups.has(gid)) {
      renderedGroups.add(gid)
      const rows = (groupsMap[gid] ?? [pa]).map(gpa => ({
        pa: gpa, agent: agents.find(a => a.id === gpa._agentId) ?? agent,
      }))
      renderItems.push({ type: 'group', gid, rows })
    } else if (!gid) {
      renderItems.push({ type: 'single', pa, agent })
    }
    // decided items that were in a group just show faded in the group
  })

  const commonRowProps = {
    onInvestigate: (pa, agent) => setInvestigationDrawer({ pa, agent }),
    onApprove: handleApprove,
    onOverrideRequest: (pa, agent) => setOverrideModal({ pa, agent }),
    selected: false,
    onToggleSelect: toggleSelect,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── System confidence header ─────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-stretch border-b border-rule2 bg-stone">
        <div className="px-5 py-3 border-r border-rule2 flex-shrink-0">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Agent Control · Salina</div>
          <div className={`font-display font-extrabold display-num text-2xl leading-none ${confColor}`}>
            {systemConfidence ?? 79}%
            <span className="font-body font-normal text-muted text-[11px] ml-1.5">system confidence</span>
          </div>
        </div>
        <div className="flex items-stretch overflow-x-auto flex-1">
          {dataSourceHealth?.map(s => (
            <div key={s.source} className="px-3 py-2.5 border-r border-rule2 flex-shrink-0 flex flex-col justify-center">
              <div className="font-body text-ghost text-[9px] mb-0.5 whitespace-nowrap">{s.source.split('/')[0].trim()}</div>
              <div className={`font-body font-medium text-[10px] whitespace-nowrap ${s.status === 'stale' ? 'text-danger' : s.status === 'warn' ? 'text-warn' : 'text-ok'}`}>
                {s.ageMin < 60 ? `${s.ageMin}m` : `${Math.floor(s.ageMin / 60)}h ${s.ageMin % 60}m`}
              </div>
            </div>
          ))}
        </div>
        {staleSource && (
          <div className="px-4 flex items-center gap-1.5 flex-shrink-0 border-l border-rule2">
            <AlertTriangle size={10} className="text-danger flex-shrink-0" />
            <span className="font-body text-danger text-[10px] whitespace-nowrap">
              {staleSource.dependents?.length ?? 3} agents degraded
            </span>
          </div>
        )}
      </div>

      {/* ── Fleet strip (trust layer, above decisions) ───────────────── */}
      <FleetStrip agents={agents} />

      {/* ── Priority-weighted ledger ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Queue header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-rule2 bg-stone">
          <div className="flex items-center gap-2.5">
            {undecidedCount > 0 && (
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={undecidedPending.length > 0 && undecidedPending.every(p => selected.has(p._key))}
                onChange={(e) => setSelected(e.target.checked ? new Set(undecidedPending.map(p => p._key)) : new Set())}
                className="w-3.5 h-3.5 cursor-pointer flex-shrink-0 accent-ochre"
                aria-label="Select all pending decisions"
              />
            )}
            <span className="font-body font-medium text-[10px] uppercase tracking-widest text-ink">Pending decisions</span>
            {undecidedCount > 0 && (
              <span className="font-body text-[9px] text-warn bg-warn/[0.1] px-1.5 py-0.5">{undecidedCount} awaiting</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-ghost text-[9px] mr-1">Ranked by consequence × expiry × confidence</span>
            <button type="button" onClick={() => setActivityDrawer(true)}
              className="font-body text-[11px] px-3 py-1.5 border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors">
              Recent activity
            </button>
          </div>
        </div>

        {/* Ledger */}
        <div className="flex-1 overflow-y-auto">
          {undecidedCount === 0 && pending.every(p => p._decided) ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <CheckCircle size={16} className="text-ok flex-shrink-0" />
              <div>
                <div className="font-body font-medium text-ink text-[13px]">All decisions made</div>
                <div className="font-body text-ghost text-[10px] mt-0.5">Agents operating autonomously within configured boundaries.</div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-rule2">
              {renderItems.map((item, idx) => {
                if (item.type === 'group') {
                  return (
                    <div key={`group-${item.gid}`} className="px-4 py-2 bg-stone">
                      <DependencyGroup
                        groupId={item.gid}
                        rows={item.rows}
                        commonProps={{
                          ...commonRowProps,
                          selected: item.rows.some(r => selected.has(r.pa._key)),
                          onToggleSelect: toggleSelect,
                        }}
                      />
                    </div>
                  )
                }
                return (
                  <LedgerRow
                    key={item.pa._key}
                    pa={item.pa}
                    agent={item.agent}
                    {...commonRowProps}
                    selected={selected.has(item.pa._key)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Batch action bar */}
        {selected.size > 0 && (
          <BatchBar
            count={selected.size}
            onApproveAll={handleApproveAll}
            onDeferAll={handleDeferAll}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {overrideModal && (
        <OverrideModal
          agentName={overrideModal.agent.name}
          actionLabel={overrideModal.pa._meta.verbFirst}
          onConfirm={handleOverrideConfirm}
          onCancel={() => setOverrideModal(null)}
        />
      )}
      {disableModal && (
        <DisableModal
          agent={disableModal}
          onConfirm={() => setDisableModal(null)}
          onCancel={() => setDisableModal(null)}
        />
      )}

      {/* ── Investigation drawer ─────────────────────────────────────── */}
      {investigationDrawer && (
        <SlidePanel
          title={investigationDrawer.agent.name}
          subtitle={investigationDrawer.pa._meta.verbFirst}
          icon={ICON_MAP[investigationDrawer.agent.icon] || Shield}
          onClose={() => setInvestigationDrawer(null)}
          maxWidth="480px"
        >
          <InvestigationPanel
            pa={investigationDrawer.pa}
            agent={investigationDrawer.agent}
            agentActions={agentActions}
          />
        </SlidePanel>
      )}

      {/* ── Activity log drawer ──────────────────────────────────────── */}
      {activityDrawer && (
        <SlidePanel
          title="Agent activity"
          subtitle="Autonomous actions logged this session"
          onClose={() => setActivityDrawer(false)}
          maxWidth="480px"
        >
          <ActivityLog agentActions={agentActions} />
        </SlidePanel>
      )}
    </div>
  )
}
