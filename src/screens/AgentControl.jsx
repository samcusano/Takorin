import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle, Truck, Users, Wrench, Handshake, Bell,
  ClipboardCheck, Shield, Database, ChevronDown, ChevronRight,
  Timer, CheckCircle, XCircle, Check, Flag, InspectionPanel, TrendingUp,
} from 'lucide-react'
import { Btn, SlidePanel, Tabs, StatusPill, Checkbox, AnimatedScore, EmptyState, SectionLabel } from '../components/UI'
import { agentConfigData, dataSourceHealth } from '../data'
import { agentPrompts } from '../data/prompts'
import { useAppState } from '../context/AppState'
import { useNavigate } from 'react-router-dom'

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
    tier: 3,
    expiresLabel: `${pa.overrideWindowMin ?? 15} min window`,
    blastRadius: 'Production line coverage',
    sortKey: 0,
  } : agent.isComplianceCategory ? {
    consequence: 'high',
    tier: 3,
    expiresLabel: 'Act today',
    blastRadius: '1 compliance case + FSMA record',
    sortKey: 1,
  } : {
    consequence: 'medium',
    tier: pa.id === 'pa-dg-1' ? 1 : 2,
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
  medium:   { label: 'Medium',   color: 'text-muted',  bg: '',                  border: 'border-l-rule2',  borderW: 'border-l-2'     },
  low:      { label: 'Low',      color: 'text-muted',  bg: '',                  border: 'border-l-rule2',  borderW: 'border-l-2'     },
}

// ─── Override rationale modal ─────────────────────────────────────────────────

function OverrideModal({ agentName, actionLabel, onConfirm, onCancel }) {
  const [rationale, setRationale] = useState('')
  const ref = useRef(null)
  const tooShort = rationale.trim().length < 20
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-6">
      <div className="bg-stone w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">Why are you overriding?</div>
          <div className="font-display font-bold text-ink text-base">{agentName}</div>
          <div className="font-body text-muted text-label mt-0.5">{actionLabel}</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="font-body text-muted text-body leading-relaxed">
            Overriding a compliance action. Your reason is logged and becomes part of the audit record.
          </p>
          <div>
            <label className="font-body text-muted text-label block mb-1.5">Rationale</label>
            <textarea ref={ref} value={rationale} onChange={e => setRationale(e.target.value)}
              rows={3} placeholder="Why are you overriding? (min 20 characters)"
              className="w-full font-body text-body text-ink bg-stone2 border border-rule2 px-3 py-2 resize-none placeholder:text-muted/60 focus:border-signal focus:outline-none" />
            <div className={`font-body text-label mt-1 ${tooShort ? 'text-danger' : 'text-ok'}`}>
              {tooShort ? `${20 - rationale.trim().length} more characters needed` : 'Ready to submit'}
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
      <div className="bg-stone w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">Disable agent — confirm</div>
          <div className="font-display font-bold text-ink text-base">{agent.name}</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="font-body text-muted text-body leading-relaxed">
            Disabling this agent changes your compliance posture. These obligations will no longer be covered automatically:
          </p>
          {agent.isComplianceCategory && agent.regulatoryObligations?.length > 0 ? (
            <ul className="space-y-1">
              {agent.regulatoryObligations.map(o => (
                <li key={o} className="flex items-start gap-2 font-body text-label text-danger">
                  <span className="mt-0.5 flex-shrink-0">·</span><span>{o}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-muted text-label">No regulatory obligations attached — safe to disable.</p>
          )}
          {agent.isComplianceCategory && (
            <div className="px-3 py-2 bg-danger/[0.04] border-l-2 border-l-danger">
              <p className="font-body text-danger text-label font-medium">Manual review required until re-enabled.</p>
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

function ApproveBtn({ isCompliance, disabled: externalDisabled, onApprove }) {
  const [count, setCount] = useState(isCompliance ? 5 : 0)
  const timerReady = count === 0
  const ready = timerReady && !externalDisabled
  useEffect(() => {
    if (!isCompliance || count <= 0) return
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, isCompliance])
  return (
    <Btn variant={ready ? 'primary' : 'secondary'} onClick={ready ? onApprove : undefined} disabled={!ready}
      aria-label={!timerReady ? `Approve (${count}s)` : externalDisabled ? 'Read rationale to approve' : 'Approve'}
      title={!timerReady ? `Approve (${count}s)` : externalDisabled ? 'Check "I have read the AI rationale" to approve' : 'Approve'}
      className="!px-3 !min-h-[36px]">
      {!timerReady
        ? <span className="font-body text-label tabular-nums">{count}s</span>
        : externalDisabled
          ? <span className="font-body text-label">—</span>
          : <Check size={13} strokeWidth={2} />
      }
    </Btn>
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
    <span className="inline-flex items-center gap-1.5 font-body font-semibold text-label text-danger bg-danger/15 px-2 py-0.5 tabular-nums flex-shrink-0 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block flex-shrink-0 animate-pulse" />
      {remaining > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : 'Auto-confirmed'}
    </span>
  )
}

// ─── Compact ledger row ───────────────────────────────────────────────────────

function LedgerRow({ pa, agent, onInvestigate, onApprove, onOverrideRequest, selected, onToggleSelect, inGroup = false, navigate }) {
  const [open, setOpen] = useState(false)
  const [rationaleAcked, setRationaleAcked] = useState(false)
  const [dwellSec, setDwellSec] = useState(0)
  const dwellRef = useRef(null)
  const meta = pa._meta
  const requiresAck = meta.consequence === 'critical' || meta.consequence === 'high'

  useEffect(() => {
    if (open) {
      dwellRef.current = setInterval(() => setDwellSec(s => s + 1), 1000)
    } else {
      clearInterval(dwellRef.current)
    }
    return () => clearInterval(dwellRef.current)
  }, [open])
  const cfg = CONSEQUENCE_CFG[meta.consequence]
  const isCompliance = agent.isComplianceCategory
  const Icon = ICON_MAP[agent.icon] || Shield

  if (pa._decided) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-0 ${inGroup ? '' : `${cfg.borderW} ${cfg.border}`}`}>
        <div className="w-3.5 flex-shrink-0" />
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${pa._decided === 'approved' ? 'bg-ok' : 'bg-muted'}`} />
        <span className="font-body text-muted text-label flex-1 truncate opacity-50">{meta.verbFirst}</span>
        <StatusPill tone={pa._decided === 'approved' ? 'ok' : 'muted'} className="opacity-50">
          {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
        </StatusPill>
        {pa._decided === 'approved' && navigate && (
          <button type="button" onClick={() => navigate('/outcomes')}
            className="flex items-center gap-1 font-body text-label text-signal hover:text-ink transition-colors flex-shrink-0"
            title="View outcome in ImpactLoop">
            <TrendingUp size={9} strokeWidth={2} />
            <span>Monitoring</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`border-b border-rule2 last:border-0 ${open ? cfg.bg : ''} ${inGroup ? '' : `border-l ${cfg.borderW} ${cfg.border}`}`}>
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone2 transition-colors">
        {/* Row checkbox */}
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(pa._key)}
          aria-label="Select action"
        />

        {/* Action text (verb-first) + inline reason */}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-body flex-shrink-0 leading-snug">{meta.verbFirst}</span>
          {!open && pa.rationale && (
            <span className="font-body text-muted text-label truncate min-w-0 leading-snug">
              — {pa.rationale.slice(0, 72)}{pa.rationale.length > 72 ? '…' : ''}
            </span>
          )}
        </button>

        {/* Expiry chip (only when urgent, non-emergency) */}
        {meta.showExpiry && !pa.isEmergencyAutoAct && (
          <StatusPill tone={meta.consequence === 'high' ? 'warn' : 'muted'} className="flex-shrink-0 whitespace-nowrap">
            {meta.expiresLabel}
          </StatusPill>
        )}

        {/* Emergency chip with live countdown */}
        {pa.isEmergencyAutoAct && <EmergencyChip overrideWindowMin={pa.overrideWindowMin} />}

        {/* CTAs */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {pa.isEmergencyAutoAct ? (
            <Btn variant="secondary" onClick={() => onOverrideRequest(pa, agent)}
              aria-label="Override" title="Override" className="!px-2.5 !min-h-[36px] text-danger border-danger/40 hover:bg-danger/[0.04]">
              <Flag size={13} strokeWidth={2} />
            </Btn>
          ) : (
            <>
              <ApproveBtn isCompliance={isCompliance}
                disabled={requiresAck && !rationaleAcked && open}
                onApprove={() => onApprove(pa._key)} />
              <Btn variant="ghost" onClick={() => onOverrideRequest(pa, agent)}
                aria-label="Override" title="Override" className="!px-2.5 !min-h-[36px]">
                <Flag size={13} strokeWidth={2} />
              </Btn>
            </>
          )}
          <Btn variant="ghost" onClick={() => onInvestigate(pa, agent)}
            aria-label="Investigate" title="Investigate" className="!px-2.5 !min-h-[36px]">
            <InspectionPanel size={13} strokeWidth={2} />
          </Btn>
        </div>

        <button type="button" onClick={() => setOpen(o => !o)} className="flex-shrink-0 ml-0.5">
          {open
            ? <ChevronDown size={11} className="text-muted" />
            : <ChevronRight size={11} className="text-muted" />}
        </button>
      </div>

      {/* Expanded detail (inline — lightweight) */}
      {open && (
        <div className="px-4 py-3 border-t border-rule2 bg-stone2 space-y-3">
          {/* Rationale — always shown prominently when expanded */}
          {pa.rationale && (
            <div>
              <div className="font-body text-muted text-label mb-1">AI rationale</div>
              <p className="font-display text-ink text-body leading-relaxed">{pa.rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {pa.impactPreview?.length > 0 && (
              <div>
                <div className="font-body text-muted text-label mb-1.5">Impact preview</div>
                {pa.impactPreview.slice(0, 3).map((l, i) => (
                  <div key={i} className="font-body text-muted text-label leading-snug mb-1">· {l}</div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <div>
                <div className="font-body text-muted text-label mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-20 bg-stone3 flex-shrink-0 relative">
                    <div className={`h-full ${pa.confidence >= 85 ? 'bg-ok' : pa.confidence >= 65 ? 'bg-warn' : 'bg-danger'}`}
                      style={{ width: `${pa.confidence}%` }} />
                    <div className="absolute top-0 bottom-0 w-px bg-ink/30"
                      style={{ left: `${agent.confidenceThreshold ?? 80}%` }} />
                  </div>
                  <span className={`font-body font-medium text-label tabular-nums ${pa.confidence >= (agent.confidenceThreshold ?? 80) ? 'text-ok' : 'text-warn'}`}>
                    {pa.confidence}%
                  </span>
                </div>
              </div>
              <div>
                <div className="font-body text-muted text-label mb-0.5">What it affects</div>
                <div className="font-body text-muted text-label">{meta.blastRadius}</div>
              </div>
            </div>
          </div>

          {/* Dwell timer + rationale acknowledgment for high-consequence decisions */}
          {requiresAck && (
            <div className="flex items-center gap-3 pt-1 border-t border-rule2">
              <div className="flex items-center gap-1.5">
                <Timer size={9} strokeWidth={2} className={dwellSec < 5 ? 'text-warn' : 'text-ok'} />
                <span className={`font-body text-label tabular-nums ${dwellSec < 5 ? 'text-warn' : 'text-ok'}`}>
                  {dwellSec}s reviewing
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                <Checkbox checked={rationaleAcked} onChange={e => setRationaleAcked(e.target.checked)} size="sm" />
                <span className="font-body text-muted text-label">I have read the AI rationale</span>
              </label>
            </div>
          )}
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
        <div className="h-1.5 w-1.5 rounded-full bg-signal flex-shrink-0" />
        <span className="font-body text-muted text-label">{meta.label}</span>
        <span className="ml-auto font-body text-signal text-label">Resolve together → {meta.boost}</span>
      </div>
      <div className="px-4 py-1 border-b border-rule2 bg-stone2">
        <span className="font-body text-muted text-label">{meta.note}</span>
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
      <span className="font-body text-stone text-label">{count} selected</span>
      <Btn variant="secondary" onClick={onApproveAll} className="!bg-stone !text-ink hover:!bg-stone2 !border-stone/30">
        Approve all low-risk
      </Btn>
      <Btn variant="secondary" onClick={onDeferAll} className="!border-stone/30 !text-stone hover:!bg-stone/10">
        Defer all low confidence
      </Btn>
    </div>
  )
}

// ─── Decision replay timeline ─────────────────────────────────────────────────

function DecisionReplay({ pa, agent }) {
  const finalConf  = pa.confidence ?? 80
  const threshold  = agent.confidenceThreshold ?? 80
  const signals    = pa.evidence?.causalSignals ?? []
  const qualified  = signals.filter(s => s.stage !== 'suppressed')
  const suppressed = signals.filter(s => s.stage === 'suppressed')

  const STEPS = [
    {
      label: 'Data ingestion',
      detail: `${signals.length + (pa.evidence?.dependencies?.length ?? 0)} streams read`,
      status: dataSourceHealth?.some(s => s.status === 'stale') ? 'warn' : 'ok',
      conf: Math.max(20, Math.round(finalConf * 0.30)),
      items: (dataSourceHealth ?? []).slice(0, 4).map(s => ({
        text: s.source.split('/')[0].trim(),
        note: s.status === 'stale' ? 'stale' : `${s.ageMin}m ago`,
        tone: s.status === 'stale' ? 'danger' : 'ok',
      })),
    },
    {
      label: 'Signal scan',
      detail: `${signals.length} signals evaluated`,
      status: signals.some(s => s.status === 'breach') ? 'warn' : 'ok',
      conf: Math.round(finalConf * 0.52),
      items: signals.slice(0, 4).map(s => ({
        text: s.signal,
        note: s.reading,
        tone: s.status === 'breach' ? 'danger' : s.status === 'warn' ? 'warn' : 'ok',
      })),
    },
    {
      label: 'Signal qualification',
      detail: `${qualified.length} qualified · ${suppressed.length} suppressed`,
      status: 'ok',
      conf: Math.round(finalConf * 0.70),
      items: [
        ...qualified.slice(0, 2).map(s => ({ text: s.signal, note: `qualified — ${s.status}`, tone: 'ok' })),
        ...suppressed.slice(0, 2).map(s => ({ text: s.signal, note: s.suppressReason?.slice(0, 36) ?? 'below threshold', tone: 'muted' })),
      ],
    },
    {
      label: 'Constraint check',
      detail: 'Hard constraints verified',
      status: pa.evidence?.dependencies?.some(d => d.status === 'blocked') ? 'warn' : 'ok',
      conf: Math.round(finalConf * 0.87),
      items: [
        { text: `Prompt v${agent.promptVersion ?? '2.1'}`, note: 'constraints loaded', tone: 'ok' },
        { text: agent.writeScope ?? 'Standard write scope', note: 'within authority', tone: 'ok' },
        ...(pa.evidence?.dependencies?.filter(d => d.status === 'blocked').map(d => ({ text: d.label, note: 'blocked', tone: 'danger' })) ?? []),
      ],
    },
    {
      label: 'Confidence scoring',
      detail: `${finalConf}% — ${finalConf >= threshold ? `+${finalConf - threshold}pts above` : `${finalConf - threshold}pts below`} threshold`,
      status: finalConf >= threshold ? 'ok' : 'warn',
      conf: finalConf,
      items: [
        { text: 'Signal weight', note: `${Math.round(finalConf * 0.68)}%`, tone: 'ok' },
        { text: 'Historical baseline', note: `${Math.round(finalConf * 0.32)}%`, tone: 'ok' },
        { text: `Threshold: ${threshold}%`, note: finalConf >= threshold ? 'passed' : 'below threshold', tone: finalConf >= threshold ? 'ok' : 'warn' },
      ],
    },
    {
      label: 'Decision formed',
      detail: pa._meta?.consequence === 'critical' ? 'Auto-executing within override window' : 'Queued for director approval',
      status: finalConf >= threshold ? 'ok' : 'warn',
      conf: finalConf,
      items: (pa.impactPreview ?? []).slice(0, 3).map(line => ({ text: line, note: '', tone: 'muted' })),
    },
  ]

  const [activeStep, setActiveStep] = useState(STEPS.length - 1)
  const [playing, setPlaying]       = useState(false)
  const playRef = useRef(null)

  useEffect(() => {
    if (!playing) { clearInterval(playRef.current); return }
    playRef.current = setInterval(() => {
      setActiveStep(s => {
        if (s >= STEPS.length - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 800)
    return () => clearInterval(playRef.current)
  }, [playing])

  const step        = STEPS[activeStep]
  const displayConf = step.conf
  const confColor   = displayConf >= 85 ? 'text-ok' : displayConf >= 65 ? 'text-warn' : 'text-danger'
  const barColor    = displayConf >= 85 ? 'bg-ok'   : displayConf >= 65 ? 'bg-warn'   : 'bg-danger'
  const barHex      = displayConf >= 85 ? 'var(--color-ok)' : displayConf >= 65 ? 'var(--color-warn)' : 'var(--color-danger)'

  const handlePlay = () => {
    if (activeStep >= STEPS.length - 1) { setActiveStep(0); setPlaying(true); return }
    setPlaying(p => !p)
  }

  const TONE_DOT = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', muted: 'bg-muted' }
  const stepColor = (c) => c >= 85 ? 'var(--color-ok)' : c >= 65 ? 'var(--color-warn)' : 'var(--color-danger)'

  return (
    <div className="space-y-4">
      {/* Live confidence readout */}
      <div className="px-4 py-3 bg-stone2">
        <div className="flex items-end gap-2 mb-2">
          <span className={`font-display font-bold text-display leading-none tabular-nums ${confColor}`}
            style={{ transition: 'color 250ms var(--ease-standard)' }}>
            {displayConf}
          </span>
          <span className="font-body text-muted text-label pb-2">% · step {activeStep + 1} of {STEPS.length}</span>
        </div>
        <div className="h-[3px] bg-rule2 overflow-hidden">
          <div className={`h-full ${barColor}`}
            style={{ width: `${displayConf}%`, transition: 'width 500ms var(--ease-enter)' }} />
        </div>
        <div className="font-body text-muted text-label mt-1.5">{step.label} — {step.detail}</div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-1.5">
        <button type="button" title="Reset" aria-label="Reset to start"
          onClick={() => { setPlaying(false); setActiveStep(0) }}
          className="font-body text-label text-muted hover:text-ink px-2.5 py-1.5 transition-colors">↩</button>
        <button type="button" aria-label="Previous step"
          onClick={() => { setPlaying(false); setActiveStep(s => Math.max(0, s - 1)) }}
          className="font-body text-label text-muted hover:text-ink px-2.5 py-1.5 transition-colors">←</button>
        <button type="button" onClick={handlePlay}
          className="font-body font-medium text-label text-stone bg-ink px-4 py-1.5 hover:bg-ink/90 transition-colors flex items-center gap-1.5 flex-shrink-0">
          {playing ? '⏸ Pause' : activeStep >= STEPS.length - 1 ? '↩ Replay' : '▶ Play'}
        </button>
        <button type="button" aria-label="Next step"
          onClick={() => { setPlaying(false); setActiveStep(s => Math.min(STEPS.length - 1, s + 1)) }}
          className="font-body text-label text-muted hover:text-ink px-2.5 py-1.5 transition-colors">→</button>
        <span className="font-body text-muted text-label tabular-nums ml-auto">{activeStep + 1} / {STEPS.length}</span>
      </div>

      {/* Vertical timeline */}
      <div className="relative" style={{ paddingLeft: 38 }}>
        {/* Background track */}
        <div className="absolute bg-rule2" style={{ left: 14, top: 14, bottom: 14, width: 1 }} />
        {/* Progress track */}
        <div className={`absolute ${barColor}`}
          style={{
            left: 14, top: 14, width: 1,
            height: activeStep === 0 ? 0 : `calc(${(activeStep / (STEPS.length - 1)) * 100}% - 28px)`,
            transition: 'height 500ms var(--ease-enter)',
          }} />

        <div>
          {STEPS.map((s, i) => {
            const isPast   = i < activeStep
            const isActive = i === activeStep
            const isFuture = i > activeStep
            const dotCls   = isPast   ? 'bg-ok border-ok'
                           : isActive ? 'bg-signal border-signal'
                           :            'bg-stone border-rule2'

            return (
              <div key={i} className="mb-0.5">
                <button type="button"
                  onClick={() => { setPlaying(false); setActiveStep(i) }}
                  className={`relative w-full flex items-start py-2.5 pr-3 text-left transition-colors ${isActive ? '' : 'hover:bg-stone2'}`}>
                  {/* Node */}
                  <div className={`absolute rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-colors ${dotCls}`}
                    style={{ left: -38, width: 28, height: 28 }}>
                    {isPast
                      ? <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <span className={`font-body font-bold text-micro ${isActive ? 'text-stone' : 'text-muted'}`}>{i + 1}</span>
                    }
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-body font-medium text-label leading-snug ${isActive ? 'text-ink' : isPast ? 'text-muted' : 'text-muted'}`}>
                        {s.label}
                      </span>
                      {!isFuture && (
                        <span className="font-display font-bold text-body tabular-nums flex-shrink-0"
                          style={{ color: stepColor(s.conf) }}>
                          {s.conf}%
                        </span>
                      )}
                    </div>
                    <div className={`font-body text-label leading-snug mt-0.5 ${isActive ? 'text-muted' : 'text-muted'}`}>
                      {isFuture ? '—' : s.detail}
                    </div>
                  </div>
                </button>

                {/* Expanded detail for active step */}
                {isActive && s.items?.length > 0 && (
                  <div className="mb-2 px-3 py-3 bg-stone2 slide-in">
                    <div className="space-y-1.5">
                      {s.items.filter(it => it?.text).map((it, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${TONE_DOT[it.tone] ?? 'bg-muted'}`} />
                          <span className="font-body text-ink text-label flex-shrink-0">{it.text}</span>
                          {it.note && <span className="font-body text-muted text-label truncate">{it.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Investigation panel (inside SlidePanel) ──────────────────────────────────

function InvestigationPanel({ pa, agent, agentActions }) {
  const [tab, setTab] = useState('signals')
  const prompt = agentPrompts[agent.id]
  const recentActions = (agentActions ?? []).filter(a => a.agentId === agent.id).slice(0, 5)

  const TABS = [
    { id: 'signals',     label: 'Signals'     },
    { id: 'action-log',  label: 'Action log'  },
    { id: 'diagnostics', label: 'Diagnostics' },
  ]

  return (
    <div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} flush />

      <div>
        {tab === 'signals' && (
          <div className="space-y-5">
            {pa.evidence?.causalSignals?.length > 0 ? (
              <>
                {(() => {
                  const active     = pa.evidence.causalSignals.filter(s => s.stage !== 'suppressed')
                  const suppressed = pa.evidence.causalSignals.filter(s => s.stage === 'suppressed')
                  return (
                    <>
                      {active.length > 0 && (
                        <div>
                          <div className="font-body text-muted text-label mb-2">Signals used</div>
                          <div className="border border-rule2 divide-y divide-rule2">
                            {active.map((s, i) => {
                              const tone  = s.status === 'breach' || s.status === 'stale' ? 'danger' : s.status === 'warn' ? 'warn' : 'ok'
                              const label = s.status === 'breach' ? 'Breach' : s.status === 'stale' ? 'Stale' : s.status === 'warn' ? 'Watch' : 'OK'
                              return (
                                <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-3 px-3 py-2.5 items-start">
                                  <div className="font-body text-muted text-label pt-px">{s.signal}</div>
                                  <div>
                                    <div className="font-body text-ink text-label font-medium">{s.reading}</div>
                                    {s.threshold && <div className="font-body text-muted text-label mt-0.5">vs. {s.threshold}</div>}
                                    {s.note && <div className="font-body text-muted text-label mt-0.5 leading-snug">{s.note}</div>}
                                  </div>
                                  <StatusPill tone={tone}>{label}</StatusPill>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {suppressed.length > 0 && (
                        <div>
                          <div className="font-body text-muted text-label mb-2">Signals ruled out</div>
                          <div className="border border-rule2 divide-y divide-rule2 opacity-60">
                            {suppressed.map((s, i) => (
                              <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                                <div className="flex-1 min-w-0">
                                  <div className="font-body text-muted text-label">{s.signal} — {s.reading}</div>
                                  {s.suppressReason && <div className="font-body text-muted text-label mt-0.5 leading-snug">{s.suppressReason}</div>}
                                </div>
                                <StatusPill tone="muted">Excluded</StatusPill>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </>
            ) : (
              <div className="font-body text-muted text-label">No signal data available.</div>
            )}

            {pa.evidence?.dependencies?.length > 0 && (
              <div>
                <div className="font-body text-muted text-label mb-2">Dependencies</div>
                <div className="border border-rule2 divide-y divide-rule2">
                  {pa.evidence.dependencies.map((d, i) => {
                    const depTone  = d.status === 'blocked' ? 'danger' : d.status === 'required' ? 'warn' : d.status === 'eligible' ? 'ok' : 'muted'
                    const depLabel = { required: 'Required', blocked: 'Blocked', eligible: 'Eligible', contingent: 'Contingent', pending: 'Pending', 'not-required': 'Not required' }[d.status] ?? d.status
                    return (
                      <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="font-body text-ink text-label font-medium">{d.label}</div>
                          {d.note && <div className="font-body text-muted text-label mt-0.5 leading-snug">{d.note}</div>}
                        </div>
                        <StatusPill tone={depTone}>{depLabel}</StatusPill>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'action-log' && (
          <div>
            <div className="font-body text-muted text-label mb-2">Recent actions — {agent.name}</div>
            {recentActions.length > 0 ? (
              <div className="border border-rule2 divide-y divide-rule2">
                {recentActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="font-body text-muted text-label flex-shrink-0 w-10 pt-px">{a.timestamp?.slice(11, 16) || '—'}</span>
                    <div className="flex-1">
                      <div className="font-body text-ink text-label leading-snug">{a.action}</div>
                      {a.rationale && <div className="font-body text-muted text-label mt-0.5">{a.rationale}</div>}
                    </div>
                    <span className={`font-body text-label flex-shrink-0 ${a.status === 'completed' ? 'text-ok' : a.status === 'overridden' ? 'text-muted' : 'text-warn'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-body text-muted text-label">No actions logged this session.</div>
            )}
          </div>
        )}

        {tab === 'diagnostics' && (
          <div className="space-y-4">
            <div>
              <div className="font-body text-muted text-label mb-2">Model diagnostics</div>
              <div className="border border-rule2 divide-y divide-rule2">
                {[
                  ['Prompt version', `v${prompt?.version ?? agent.promptVersion ?? '—'}`],
                  ['Autonomy level', agent.autonomyLevel ?? '—'],
                  ['Confidence threshold', `${agent.confidenceThreshold ?? '—'}%`],
                  ['Write scope', agent.writeScope ?? 'Not specified'],
                  ...(prompt?.lastUpdated ? [['Last updated', `${prompt.lastUpdated} — ${prompt.changeReason}`]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-4 px-3 py-2.5">
                    <span className="font-body text-muted text-label w-36 flex-shrink-0">{label}</span>
                    <span className="font-body text-muted text-label leading-snug">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            {prompt?.hardConstraints?.length > 0 && (
              <div>
                <div className="font-body text-muted text-label mb-2">Hard constraints</div>
                <ul className="space-y-1.5">
                  {prompt.hardConstraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 font-body text-label text-muted">
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
    <div className="font-body text-muted text-label">No agent activity recorded this session.</div>
  )
  return (
    <div className="-mx-5 -mt-5 border-t border-rule2">
      {recent.map((a, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
          <span className="font-body text-muted text-label flex-shrink-0 w-10 pt-px">{a.timestamp?.slice(11, 16) || '—'}</span>
          <span className="font-body text-muted text-label flex-shrink-0 w-28 truncate">{a.agentId}</span>
          <span className="font-body text-ink text-label leading-snug flex-1">{a.action}</span>
          <span className={`font-body text-label flex-shrink-0 ${a.status === 'completed' ? 'text-ok' : a.status === 'overridden' ? 'text-muted' : 'text-warn'}`}>
            {a.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Fleet confidence strip ───────────────────────────────────────────────────

const STALE_AGENTS = new Set(['pre-shift', 'resource', 'handoff'])

const TIER2_BUDGET = 8

// ─── Tier 1 overlay ──────────────────────────────────────────────────────────

function Tier1Overlay({ items, agents, btnRef, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
  }, [btnRef])

  useEffect(() => {
    function handleClick(e) {
      if (
        ref.current && !ref.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) onClose()
    }
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, btnRef])

  return (
    <div ref={ref} className="fixed z-50 bg-stone border border-rule2 shadow-raise overflow-hidden"
      style={{ top: pos.top, left: pos.left, minWidth: 300 }}>
      <div className="px-4 py-2 border-b border-rule2 flex items-center gap-2 bg-stone2">
        <div className="h-1 w-1 rounded-full bg-signal flex-shrink-0" />
        <span className="font-body text-muted text-label">System acted · you're informed</span>
      </div>
      <div className="divide-y divide-rule2">
        {items.map(pa => {
          const agent = agents.find(a => a.id === pa._agentId)
          if (!agent) return null
          const Icon = ICON_MAP[agent.icon] || Shield
          return (
            <div key={pa._key} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="font-body text-muted text-label">{agent.name}</div>
                <div className="font-body text-ink text-label leading-snug">{pa._meta.verbFirst}</div>
              </div>
              <StatusPill tone="muted">Notified</StatusPill>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AgentControl() {
  const { agentActions, systemConfidence, logAgentAction, overrideAgentAction, markAgentDecided, currentPlant } = useAppState()
  const navigate = useNavigate()
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
  const [activityDrawer, setActivityDrawer]           = useState(false)
  const [overrideModal, setOverrideModal] = useState(null)
  const [disableModal, setDisableModal]   = useState(null)
  const [splitFocused, setSplitFocused]   = useState(null)
  const [splitChecked, setSplitChecked]   = useState(new Set())
  const [tier1Open, setTier1Open]         = useState(false)
  const tier1BtnRef                       = useRef(null)
  const [detailTab, setDetailTab]         = useState('why')
  const [freshnessOpen, setFreshnessOpen] = useState(false)

  useEffect(() => { setDetailTab('why') }, [splitFocused])

  const tier1Items = pending.filter(p => p._meta.tier === 1)
  const tier2Items = pending.filter(p => p._meta.tier === 2)
  const tier3Items = pending.filter(p => p._meta.tier === 3)
  const tier0Count = 12 // static: autonomous actions taken this shift, no review needed

  const handleApprove = (key) => {
    const pa = pending.find(p => p._key === key)
    setPending(prev => prev.map(p => p._key === key ? { ...p, _decided: 'approved' } : p))
    setSelected(prev => { const n = new Set(prev); n.delete(key); return n })
    if (investigationDrawer?.pa._key === key) setInvestigationDrawer(null)
    markAgentDecided?.(key)
    logAgentAction?.({ agentId: pa?._agentId, action: 'Director approved', status: 'completed', timestamp: new Date().toISOString() })
  }

  const handleOverrideConfirm = (rationale) => {
    const { pa } = overrideModal
    setPending(prev => prev.map(p => p._key === pa._key ? { ...p, _decided: 'overridden' } : p))
    setSelected(prev => { const n = new Set(prev); n.delete(pa._key); return n })
    if (investigationDrawer?.pa._key === pa._key) setInvestigationDrawer(null)
    markAgentDecided?.(pa._key)
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
  const undecidedCount = undecidedPending.filter(p => p._meta.tier >= 2).length
  const confColor = (systemConfidence ?? 79) >= 85 ? 'text-ok' : (systemConfidence ?? 79) >= 65 ? 'text-warn' : 'text-danger'

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
    navigate,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Merged command strip: confidence + tiers ───────────────────── */}
      {freshnessOpen && (
        <SlidePanel title="Data sources" subtitle="Freshness at time of last decision" onClose={() => setFreshnessOpen(false)} maxWidth="360px">
          <div className="grid grid-cols-2 gap-px bg-rule2 -mx-5 -mt-5">
            {dataSourceHealth?.map(s => {
              const age = s.ageMin < 60 ? `${s.ageMin}m` : `${Math.floor(s.ageMin / 60)}h ${s.ageMin % 60}m`
              const tone = s.status === 'stale' ? 'text-danger' : s.status === 'warn' ? 'text-warn' : 'text-ok'
              const dot  = s.status === 'stale' ? 'bg-danger' : s.status === 'warn' ? 'bg-warn' : 'bg-ok'
              const statusTone = s.status === 'stale' ? 'danger' : s.status === 'warn' ? 'warn' : 'ok'
              const statusLabel = s.status === 'stale' ? 'Stale' : s.status === 'warn' ? 'Degraded' : 'Fresh'
              return (
                <div key={s.source} className="bg-stone px-4 py-4">
                  <div className="font-body text-muted text-label mb-2">{s.source.split('/')[0].trim()}</div>
                  <div className={`display-num text-head font-bold leading-none mb-2 ${tone}`}>{age}</div>
                  <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                </div>
              )
            })}
          </div>
        </SlidePanel>
      )}

      <div className="flex-shrink-0 flex items-stretch border-b border-rule2 bg-stone">
        {/* Confidence — button opens source freshness drawer */}
        <button type="button" onClick={() => setFreshnessOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 border-r border-rule2 flex-shrink-0 hover:bg-stone2 transition-colors text-left">
          <div>
            <div className={`display-num text-head leading-none ${confColor}`}>
              <AnimatedScore value={systemConfidence ?? 79} suffix="%" effect="blur" />
            </div>
            <div className="font-body text-muted text-label">system conf</div>
          </div>
          {staleSource && (
            <span className="flex items-center gap-1 font-body text-warn text-label">
              <AlertTriangle size={10} strokeWidth={2} className="flex-shrink-0" />
              {dataSourceHealth?.filter(s => s.status === 'stale').length} stale
            </span>
          )}
        </button>

        {/* Tier 0 — autonomous */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-r border-rule2 flex-1">
          <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
          <div>
            <div className="font-body text-muted text-label">Tier 0</div>
            <div className="font-body text-ink text-body font-medium">{tier0Count} auto</div>
          </div>
        </div>

        {/* Tier 1 — notify only */}
        <button ref={tier1BtnRef} type="button" onClick={() => setTier1Open(o => !o)}
          className={`flex items-center gap-2.5 px-4 py-2.5 border-r border-rule2 flex-1 hover:bg-stone2 transition-colors text-left ${tier1Open ? 'bg-stone2' : ''}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-signal flex-shrink-0" />
          <div>
            <div className="font-body text-muted text-label">Tier 1</div>
            <div className="font-body text-ink text-body font-medium">{tier1Items.length} informed</div>
          </div>
          <ChevronDown size={9} strokeWidth={2} className={`text-muted flex-shrink-0 ml-auto transition-transform ${tier1Open ? 'rotate-180' : ''}`} />
        </button>

        {/* Tier 2 — budgeted approval */}
        {(() => {
          const undecided = tier2Items.filter(p => !p._decided).length
          const pct = Math.min(100, (undecided / TIER2_BUDGET) * 100)
          const barColor = undecided > TIER2_BUDGET ? 'bg-danger' : undecided >= Math.ceil(TIER2_BUDGET * 0.75) ? 'bg-warn' : 'bg-ok'
          return (
            <div className="flex items-center gap-3 px-4 py-2.5 border-r border-rule2 flex-1">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${undecided > TIER2_BUDGET ? 'bg-danger' : 'bg-warn'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="font-body text-muted text-label">Tier 2</div>
                  <div className={`font-body text-label font-medium tabular-nums ${undecided > TIER2_BUDGET ? 'text-danger' : 'text-muted'}`}>
                    {undecided}/{TIER2_BUDGET}
                  </div>
                </div>
                <div className="h-1 bg-rule2 overflow-hidden">
                  <div className={`h-full transition-[width] ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })()}

        {/* Tier 3 — compliance lock */}
        {(() => {
          const undecided = tier3Items.filter(p => !p._decided).length
          return (
            <div className={`flex items-center gap-2.5 px-4 py-2.5 flex-1 border-l-2 ${undecided > 0 ? 'bg-danger/[0.05] border-l-danger' : 'border-l-transparent'}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${undecided > 0 ? 'bg-danger animate-pulse' : 'bg-muted'}`} />
              <div>
                <div className="font-body text-muted text-label">Tier 3</div>
                <div className={`font-body text-body font-medium ${undecided > 0 ? 'text-danger' : 'text-muted'}`}>
                  {undecided > 0 ? `${undecided} pending` : tier3Items.length > 0 ? `${tier3Items.length} reviewed` : 'None'}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {tier1Open && tier1Items.length > 0 && (
        <Tier1Overlay
          items={tier1Items}
          agents={agents}
          btnRef={tier1BtnRef}
          onClose={() => setTier1Open(false)}
        />
      )}

      {/* ── Priority-weighted ledger ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Queue header */}
        <div className="flex-shrink-0 flex items-center border-b border-rule2 bg-stone">
          <span className="font-body text-label text-ink px-4 py-2.5">Decision queue</span>
          <div className="flex items-center gap-2 ml-auto px-5">
            {undecidedCount > 0 && (
              <span className="font-body text-label text-warn bg-warn/[0.08] px-1.5 py-0.5">{undecidedCount} awaiting</span>
            )}
            <Btn variant="ghost" onClick={() => setActivityDrawer(true)}>Activity</Btn>
          </div>
        </div>

        {/* ── T3 critical banner — shown only when undecided T3 items exist ── */}
        {(() => {
          const undecidedT3 = tier3Items.filter(p => !p._decided)
          if (!undecidedT3.length) return null
          return (
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-danger/[0.06] border-b border-danger/20">
              <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
              <span className="font-body text-danger text-label font-medium flex-1">
                {undecidedT3.length} critical decision{undecidedT3.length !== 1 ? 's' : ''} require your attention
              </span>
              <span className="font-body text-danger/70 text-micro tabular-nums">
                {undecidedT3[0]?._meta?.consequence === 'critical' ? 'FDA lock risk' : 'Action required'}
              </span>
            </div>
          )
        })()}

        {/* ── Split Decision Panel ─────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: compact selection list with checkboxes */}
            <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {undecidedCount === 0 && pending.every(p => p._decided) ? (
                  <div className="flex items-center gap-2 px-4 py-5">
                    <CheckCircle size={14} className="text-ok flex-shrink-0" />
                    <span className="font-body text-ink text-body">All decisions made</span>
                  </div>
                ) : (
                  <div className="divide-y divide-rule2">
                    {[...undecidedPending.filter(p => p._meta.tier >= 2), ...pending.filter(p => p._decided && p._meta.tier >= 2)].map(pa => {
                      const agent = agents.find(a => a.id === pa._agentId)
                      if (!agent) return null
                      const cfg = CONSEQUENCE_CFG[pa._meta.consequence]
                      const isFocused = splitFocused === pa._key
                      const isChecked = splitChecked.has(pa._key)
                      return (
                        <div key={pa._key}
                          className={`flex items-center border-l-[3px] transition-colors ${
                            isFocused
                              ? `${cfg.border} bg-stone2`
                              : pa._meta.consequence === 'critical' && !pa._decided ? 'border-l-danger/40'
                              : pa._meta.consequence === 'high' && !pa._decided ? 'border-l-warn/40'
                              : 'border-l-transparent'
                          } ${pa._decided ? 'opacity-40' : ''}`}>
                          {/* Checkbox */}
                          {!pa._decided && (
                            <div className="pl-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <Checkbox checked={isChecked}
                                onChange={() => setSplitChecked(prev => { const n = new Set(prev); n.has(pa._key) ? n.delete(pa._key) : n.add(pa._key); return n })} />
                            </div>
                          )}
                          <button type="button"
                            onClick={() => setSplitFocused(isFocused ? null : pa._key)}
                            className="flex-1 min-w-0 flex items-center gap-3 px-3 py-4 hover:bg-stone2/50 transition-colors text-left">
                            <div className="flex-1 min-w-0">
                              <div className="font-body text-muted text-label truncate">{agent.name}</div>
                              <div className={`font-body font-medium text-body leading-snug truncate ${pa._decided ? 'text-muted' : 'text-ink'}`}>
                                {pa._meta.verbFirst}
                              </div>
                              {pa._decided ? (
                                <StatusPill tone={pa._decided === 'approved' ? 'ok' : 'muted'} className="mt-0.5">
                                  {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
                                </StatusPill>
                              ) : pa._meta.showExpiry ? (
                                <StatusPill tone={pa._meta.consequence === 'critical' ? 'danger' : 'warn'} className="whitespace-nowrap mt-0.5">
                                  {pa._meta.expiresLabel}
                                </StatusPill>
                              ) : null}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Batch action bar — sticky bottom of left panel */}
              {splitChecked.size > 0 && (
                <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-ink border-t border-sidebar-border">
                  <span className="font-body text-stone text-label">{splitChecked.size} selected</span>
                  <Btn variant="secondary"
                    onClick={() => { [...splitChecked].forEach(k => { const pa = pending.find(p => p._key === k); if (pa && !pa._decided && pa._meta.consequence === 'medium') handleApprove(k) }); setSplitChecked(new Set()) }}
                    className="!bg-stone !text-ink hover:!bg-stone2 !border-stone/30">
                    Approve low-risk
                  </Btn>
                  <Btn variant="ghost" onClick={() => setSplitChecked(new Set())}
                    className="!text-stone/60 hover:!text-stone ml-auto">
                    Clear
                  </Btn>
                </div>
              )}
            </div>

            {/* Right: decision detail panel with sticky header + footer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {(() => {
                const pa = pending.find(p => p._key === splitFocused)
                const agent = pa ? agents.find(a => a.id === pa._agentId) : null
                if (!pa || !agent) return <EmptyState message="Select a decision from the left panel to review evidence and act" />
                const cfg = CONSEQUENCE_CFG[pa._meta.consequence]
                const isCompliance = agent.isComplianceCategory
                const Icon = ICON_MAP[agent.icon] || Shield
                return (
                  <>
                    {/* Sticky header */}
                    <div className={`flex-shrink-0 flex items-start gap-4 px-6 py-4 border-b border-rule2 bg-stone border-l-[3px] ${cfg.border}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-muted text-label mb-0.5">
                          {agent.name} · {cfg.label} consequence
                          {agent.trustScore != null && (
                            <span className={`ml-2 display-num text-label ${agent.trustScore >= 85 ? 'text-ok' : agent.trustScore >= 70 ? 'text-warn' : 'text-danger'}`}>
                              {agent.trustScore} trust
                            </span>
                          )}
                        </div>
                        <div className="font-display font-bold text-ink text-head leading-snug">{pa._meta.verbFirst}</div>
                        {pa.reasoning?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {pa.reasoning.map((link, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <span className="font-body text-muted text-micro leading-snug">{link}</span>
                                {i < pa.reasoning.length - 1 && (
                                  <span className="font-body text-muted/40 text-micro flex-shrink-0">→</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        {pa._decided && (
                          <div className={`font-body text-label mt-0.5 ${pa._decided === 'approved' ? 'text-ok' : 'text-muted'}`}>
                            {pa._decided === 'approved' ? '✓ Approved' : '↩ Overridden'} ·{' '}
                            <button type="button" onClick={() => navigate('/outcomes')} className="text-signal hover:text-ink underline-offset-2">View in ImpactLoop</button>
                          </div>
                        )}
                      </div>
                      {(() => {
                        const green = currentPlant?.confidenceGreen ?? 85
                        const red = currentPlant?.confidenceRed ?? 65
                        const confOk = pa.confidence >= green
                        const confColor = pa.confidence >= green ? 'text-ok' : pa.confidence >= red ? 'text-warn' : 'text-danger'
                        const modelLabel = currentPlant?.confidenceModel === 'biological' ? 'Biological fermentation'
                          : currentPlant?.confidenceModel === 'regulated' ? 'Regulated process (GxP)'
                          : currentPlant?.confidenceModel === 'precision' ? 'Precision manufacturing'
                          : null
                        return (
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <div className={`display-num text-metric tabular-nums leading-none ${confColor}`}
                                style={{ opacity: Math.max(0.45, pa.confidence / 100) }}>{pa.confidence}%</div>
                              <div className="font-body text-muted text-label">conf</div>
                            </div>
                            {modelLabel && (
                              <div className={`font-body text-micro mt-0.5 text-right ${confOk ? 'text-ok/70' : 'text-danger/80'}`}>
                                {modelLabel} · {confOk ? 'within threshold' : `below ${green}% required`}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    <Tabs
                      tabs={[{ id: 'why', label: 'Why' }, { id: 'approved', label: 'If approved' }]}
                      active={detailTab}
                      onChange={setDetailTab}
                      className="flex-shrink-0 bg-stone"
                    />

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto page-blur-in">

                      {/* ── Why tab ── */}
                      {detailTab === 'why' && (
                        <div className="px-6 py-5 space-y-5">

                          {/* Rationale — dominant */}
                          {pa.rationale && (
                            <div className="px-4 py-4 bg-stone2 border-l-4 border-l-signal">
                              <div className="font-body font-semibold text-muted text-label mb-2">Agent rationale</div>
                              <p className="font-body text-ink text-body leading-relaxed">{pa.rationale}</p>
                            </div>
                          )}

                          {/* What triggered this — active signals only */}
                          {(() => {
                            const active = (pa.evidence?.causalSignals ?? []).filter(s => s.stage !== 'suppressed')
                            if (active.length === 0) return null
                            return (
                              <div>
                                <div className="font-body text-muted text-label mb-2">What triggered this</div>
                                <div className="divide-y divide-rule2 border-y border-rule2">
                                  {active.map((s, i) => {
                                    const tone = s.status === 'breach' || s.status === 'stale' ? 'danger' : s.status === 'warn' ? 'warn' : 'ok'
                                    const label = s.status === 'breach' ? 'Breach' : s.status === 'stale' ? 'Stale' : s.status === 'warn' ? 'Watch' : 'OK'
                                    return (
                                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-body text-muted text-label mb-0.5">{s.signal}</div>
                                          <div className="font-body text-ink text-body font-medium">{s.reading}</div>
                                          {s.threshold && <div className="font-body text-muted text-label">vs. {s.threshold}</div>}
                                        </div>
                                        <StatusPill tone={tone}>{label}</StatusPill>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}

                          {/* Confidence — verdict, not breakdown */}
                          {(() => {
                            const threshold = agent.confidenceThreshold ?? 80
                            const delta = pa.confidence - threshold
                            const above = delta >= 0
                            return (
                              <div className="flex items-center gap-4 px-4 py-3 border border-rule2">
                                <div className="flex-1 h-1 bg-stone3 relative">
                                  <div className={`h-full ${pa.confidence >= 85 ? 'bg-ok' : pa.confidence >= 65 ? 'bg-warn' : 'bg-danger'}`}
                                    style={{ width: `${pa.confidence}%` }} />
                                  <div className="absolute top-0 bottom-0 w-px bg-ink/40" style={{ left: `${threshold}%` }} />
                                </div>
                                <span className={`font-body text-label font-medium flex-shrink-0 ${above ? 'text-ok' : 'text-warn'}`}>
                                  {pa.confidence}% — {above ? `+${delta}pts above` : `${delta}pts below`} threshold
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* ── If approved tab ── */}
                      {detailTab === 'approved' && (
                        <div className="px-6 py-5 space-y-5">

                          {/* What happens next */}
                          {pa.impactPreview?.length > 0 && (
                            <div>
                              <div className="font-body text-muted text-label mb-2">What happens next</div>
                              <div className="divide-y divide-rule2 border-y border-rule2">
                                {pa.impactPreview.map((line, i) => {
                                  const isNeg = /delay|liability|legal|loss|risk/i.test(line)
                                  const isWarn = /stale|⚠/.test(line)
                                  return (
                                    <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                                      <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${isNeg || isWarn ? 'bg-warn' : 'bg-ok'}`} />
                                      <span className={`font-body text-label leading-snug ${isNeg ? 'text-warn' : 'text-ink'}`}>{line}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Risk if not approved */}
                          {pa.evidence?.riskForecast && (
                            <div className="px-4 py-4 bg-warn/[0.04] border-l-4 border-l-warn">
                              <div className="font-body font-semibold text-muted text-label mb-2">Risk if not approved</div>
                              <p className="font-display text-ink text-body leading-relaxed">{pa.evidence.riskForecast}</p>
                            </div>
                          )}

                          {/* Agent track record */}
                          {agent.trustScore != null && (
                            <div className="divide-y divide-rule2 border-y border-rule2">
                              <div className="flex items-center px-4 py-2.5">
                                <span className="font-body text-muted text-label flex-1">Agent trust score</span>
                                <span className={`font-body text-label font-medium ${agent.trustScore >= 85 ? 'text-ok' : agent.trustScore >= 70 ? 'text-warn' : 'text-danger'}`}>
                                  {agent.trustScore}%
                                </span>
                              </div>
                              {agent.confidenceMethodology && (
                                <div className="px-4 py-2.5">
                                  <p className="font-body text-muted text-label leading-snug">{agent.confidenceMethodology}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cohort intelligence — shown above action bar when undecided */}
                    {!pa._decided && pa.cohort && (
                      <div className="flex-shrink-0 flex items-center gap-2.5 px-5 py-2 border-t border-rule2 bg-deep/[0.04]">
                        <div className="w-1.5 h-1.5 rounded-full bg-deep flex-shrink-0 flex-shrink-0" />
                        <span className="font-body text-deep text-micro leading-snug">{pa.cohort}</span>
                      </div>
                    )}

                    {/* Sticky action bar */}
                    <div key={pa._decided} className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 border-t border-rule2 ${pa._decided === 'approved' ? 'decision-commit bg-stone2' : pa._decided ? 'bg-stone2' : 'bg-stone'}`}>
                      {pa._decided ? (
                        <span className={`font-body text-label ${pa._decided === 'approved' ? 'text-ok' : 'text-muted'}`}>
                          {pa._decided === 'approved' ? '✓ Decision approved and logged' : '↩ Decision overridden'}
                        </span>
                      ) : (
                        <>
                          <ApproveBtn isCompliance={isCompliance} disabled={false} onApprove={() => handleApprove(pa._key)} />
                          <Btn variant="ghost" onClick={() => setOverrideModal({ pa, agent })}
                            aria-label="Override" title="Override" className="!px-2.5 !min-h-[44px]">
                            <Flag size={13} strokeWidth={2} />
                          </Btn>
                          <Btn variant="ghost" onClick={() => setInvestigationDrawer({ pa, agent })}
                            aria-label="Investigate" title="Investigate" className="!px-2.5 !min-h-[44px]">
                            <InspectionPanel size={13} strokeWidth={2} />
                          </Btn>
                          <span className="font-body text-muted text-label ml-1">{pa._meta.blastRadius}</span>
                        </>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
        </div>

        {false && (
          <div className="hidden">
            {undecidedCount === 0 && pending.every(p => p._decided) ? (
              <div className="flex items-center gap-3 py-4">
                <CheckCircle size={16} className="text-ok flex-shrink-0" />
                <div>
                  <div className="font-body font-medium text-ink text-base">All decisions made</div>
                  <div className="font-body text-muted text-label mt-0.5">Agents operating autonomously within configured boundaries.</div>
                </div>
              </div>
            ) : (
              <>
                {/* Emergency cards — full width */}
                {pending.filter(p => p.isEmergencyAutoAct && !p._decided).map(pa => {
                  const agent = agents.find(a => a.id === pa._agentId)
                  if (!agent) return null
                  const Icon = ICON_MAP[agent.icon] || Shield
                  return (
                    <div key={pa._key} className="border border-danger/30 bg-danger/[0.04] border-l-[5px] border-l-danger p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <Icon size={16} className="text-danger flex-shrink-0" />
                          <div>
                            <div className="font-body text-muted text-label">{agent.name} · Auto-executing</div>
                            <div className="font-display font-bold text-ink text-base leading-snug mt-0.5">{pa._meta.verbFirst}</div>
                          </div>
                        </div>
                        <EmergencyChip overrideWindowMin={pa.overrideWindowMin} />
                      </div>
                      {pa.rationale && <p className="font-display text-muted text-body leading-relaxed mb-3">{pa.rationale}</p>}
                      <Btn variant="secondary" onClick={() => setOverrideModal({ pa, agent })}
                        className="!border-danger/40 !text-danger hover:!bg-danger/[0.04]">
                        <Flag size={11} strokeWidth={2} />Override before window closes
                      </Btn>
                    </div>
                  )
                })}

                {/* Critical + High cards — 2-column grid */}
                {(() => {
                  const highItems = pending.filter(p => !p.isEmergencyAutoAct && (p._meta.consequence === 'critical' || p._meta.consequence === 'high'))
                  if (highItems.length === 0) return null
                  const groups = {}
                  highItems.forEach(pa => { if (pa._meta.groupId) { groups[pa._meta.groupId] = groups[pa._meta.groupId] ?? []; groups[pa._meta.groupId].push(pa) } })
                  const rendered = new Set()
                  return (
                    <div>
                      <div className="font-body text-muted text-label mb-2">High consequence</div>
                      <div className="grid grid-cols-2 gap-3">
                        {highItems.map(pa => {
                          if (pa._meta.groupId && rendered.has(pa._meta.groupId)) return null
                          if (pa._meta.groupId) rendered.add(pa._meta.groupId)
                          const agent = agents.find(a => a.id === pa._agentId)
                          if (!agent) return null
                          const cfg = CONSEQUENCE_CFG[pa._meta.consequence]
                          const Icon = ICON_MAP[agent.icon] || Shield
                          const isCompliance = agent.isComplianceCategory
                          const groupPair = pa._meta.groupId ? groups[pa._meta.groupId] : null
                          return (
                            <div key={pa._key} className={`border ${cfg.borderW} ${cfg.border} p-4 ${pa._decided ? 'opacity-40' : ''}`}>
                              {groupPair?.length > 1 && (
                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-rule2">
                                  <div className="h-1 w-1 rounded-full bg-signal" />
                                  <span className="font-body text-signal text-label">{GROUP_META[pa._meta.groupId]?.label}</span>
                                </div>
                              )}
                              <div className="flex items-start gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-body text-muted text-label">{agent.name}</div>
                                  <div className="font-display font-bold text-ink text-base leading-snug mt-0.5">{pa._meta.verbFirst}</div>
                                </div>
                                <span className={`font-body text-micro px-1.5 py-0.5 flex-shrink-0 ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                              </div>
                              {pa.impactPreview?.slice(0, 2).map((l, i) => (
                                <div key={i} className="font-body text-muted text-label leading-snug mb-0.5">· {l}</div>
                              ))}
                              <div className="mt-2 mb-3">
                                <div className="h-1 bg-stone3 relative">
                                  <div className={`h-full ${pa.confidence >= 85 ? 'bg-ok' : pa.confidence >= 65 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${pa.confidence}%` }} />
                                  <div className="absolute top-0 bottom-0 w-px bg-ink/30" style={{ left: `${agent.confidenceThreshold ?? 80}%` }} />
                                </div>
                                <div className="font-body text-muted text-label mt-0.5">{pa.confidence}% confidence</div>
                              </div>
                              {!pa._decided && (
                                <div className="flex items-center gap-2">
                                  <ApproveBtn isCompliance={isCompliance} disabled={false} onApprove={() => handleApprove(pa._key)} />
                                  <Btn variant="ghost" onClick={() => setOverrideModal({ pa, agent })}
                                    aria-label="Override" title="Override" className="!px-2.5 !min-h-[44px]">
                                    <Flag size={12} strokeWidth={2} />
                                  </Btn>
                                  <Btn variant="ghost" onClick={() => setInvestigationDrawer({ pa, agent })}
                                    aria-label="Investigate" title="Investigate" className="!px-2.5 !min-h-[44px]">
                                    <InspectionPanel size={12} strokeWidth={2} />
                                  </Btn>
                                </div>
                              )}
                              {pa._decided && (
                                <div className={`font-body text-label ${pa._decided === 'approved' ? 'text-ok' : 'text-muted'}`}>
                                  {pa._decided === 'approved' ? '✓ Approved' : '↩ Overridden'}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Medium rows — compact */}
                {(() => {
                  const medItems = pending.filter(p => p._meta.consequence === 'medium' && !p.isEmergencyAutoAct)
                  if (medItems.length === 0) return null
                  return (
                    <div>
                      <div className="font-body text-muted text-label mb-2">Medium consequence</div>
                      <div className="border border-rule2 divide-y divide-rule2">
                        {medItems.map(pa => {
                          const agent = agents.find(a => a.id === pa._agentId)
                          if (!agent) return null
                          return (
                            <div key={pa._key} className={`flex items-center gap-3 px-4 py-3 ${pa._decided ? 'opacity-40' : ''}`}>
                              <div className="h-1.5 w-1.5 rounded-full bg-muted flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-body text-muted text-label">{agent.name}</div>
                                <div className="font-body font-medium text-ink text-label leading-snug truncate">{pa._meta.verbFirst}</div>
                              </div>
                              {!pa._decided && (
                                <div className="flex items-center gap-1.5">
                                  <ApproveBtn isCompliance={false} disabled={false} onApprove={() => handleApprove(pa._key)} />
                                  <Btn variant="ghost" onClick={() => setOverrideModal({ pa, agent })}
                                    aria-label="Override" title="Override" className="!px-2.5 !min-h-[44px]">
                                    <Flag size={12} strokeWidth={2} />
                                  </Btn>
                                </div>
                              )}
                              {pa._decided && (
                                <span className={`font-body text-label ${pa._decided === 'approved' ? 'text-ok' : 'text-muted'}`}>
                                  {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
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
          subtitle="Actions taken this session"
          onClose={() => setActivityDrawer(false)}
          maxWidth="480px"
        >
          <ActivityLog agentActions={agentActions} />
        </SlidePanel>
      )}
    </div>
  )
}
