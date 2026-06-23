import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle, Truck, Users, Wrench, Handshake, Bell,
  ClipboardCheck, Shield, Database, ChevronDown, ChevronRight,
  Timer, CheckCircle, XCircle, Check, Flag, InspectionPanel, TrendingUp,
  Activity, Network, Settings, Eye, MessageSquare, Zap, RotateCcw,
  Route, Package,
} from 'lucide-react'
import { Btn, SlidePanel, Tabs, StatusPill, Checkbox, AnimatedScore, EmptyState, SectionLabel, FilterDropdown, MultiFilterDropdown } from '../components/UI'
import { agentConfigData, dataSourceHealth, networkData } from '../data'
import { executionLog, executionSummary, autonomyTiers, rollbackLog } from '../data/execution'
import { agentPrompts } from '../data/prompts'
import { useAppState } from '../context/AppState'
import { useNavigate } from 'react-router-dom'
import PolicyBuilderTab from './PolicyBuilder'

const ICON_MAP = {
  Shield, AlertTriangle, Truck, Users, Wrench,
  Handshake, Bell, ClipboardCheck, Database, Route, Package,
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
  'pa-sc1':        'Reroute Lot CO-5502 via Midwest Freight',
  'pa-ri1':        'Transfer 600kg tomato sauce — Wichita to Salina',
}

// What each pending action affects, shown in the rail's "What it affects" field.
const BLAST_RADIUS_MAP = {
  'pa-sc1': 'Line 6 — Canola Oil sourcing',
  'pa-ri1': 'Cross-plant — Salina ↔ Wichita inventory',
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
  'pa-sc1':        true,
  'pa-ri1':        true,
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
    blastRadius: BLAST_RADIUS_MAP[pa.id] ?? 'Line 4 — 1 unit affected',
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
  critical: { label: 'Critical', color: 'text-danger', bg: 'bg-danger/[0.04]' },
  high:     { label: 'High',     color: 'text-warn',   bg: 'bg-warn/[0.03]'   },
  medium:   { label: 'Medium',   color: 'text-muted',  bg: ''                 },
  low:      { label: 'Low',      color: 'text-muted',  bg: ''                 },
}

// ─── Override rationale modal ─────────────────────────────────────────────────

function OverrideModal({ agentName, actionLabel, onConfirm, onCancel }) {
  const [rationale, setRationale] = useState('')
  const ref = useRef(null)
  const tooShort = rationale.trim().length < 20
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-stone w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">Why are you overriding?</div>
          <div className="font-display font-bold text-ink text-sub">{agentName}</div>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-stone w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">Disable agent — confirm</div>
          <div className="font-display font-bold text-ink text-sub">{agent.name}</div>
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
            <div className="px-3 py-2 bg-danger/[0.04] border-l-[3px] border-l-danger">
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

// ─── Per-plant trust scores — computed from local decision history per (agentId, plantId) ──
// Global trustScore on agent is the network average; per-plant scores reflect local data quality
// and flagged decision history. Displayed in the detail panel so the director sees their
// plant's actual track record, not a number calibrated against another facility.
const PLANT_TRUST_SCORES = {
  'supplier':    { sl: 82, ks: 91, co: 88, se: 94, de: 97 },
  'compliance':  { sl: 78, ks: 85, co: 89, se: 96, de: 99 },
  'maintenance': { sl: 71, ks: 88, co: 84, se: 91, de: 95 },
  'pre-shift':   { sl: 87, ks: 92, co: 90, se: 97, de: 99 },
  'handoff':     { sl: 74, ks: 83, co: 88, se: 93, de: 96 },
  'training':    { sl: 69, ks: 80, co: 85, se: 90, de: 94 },
  'capa':        { sl: 76, ks: 86, co: 87, se: 95, de: 98 },
  'sensor':      { sl: 63, ks: 88, co: 85, se: 93, de: 99 },
  'supply-continuity': { sl: 75, ks: 84, co: 80, se: 89, de: 93 },
  'replenishment':     { sl: 73, ks: 82, co: 79, se: 87, de: 92 },
}

// ─── Flag outcome modal ───────────────────────────────────────────────────────

const FLAG_CATEGORIES = [
  { value: 'wrong-rec',      label: 'Wrong recommendation', desc: 'The action itself was incorrect' },
  { value: 'wrong-rationale', label: 'Wrong rationale',     desc: 'Reasoning was flawed; action may have been right' },
  { value: 'wrong-scope',    label: 'Wrong scope',          desc: 'Right direction, wrong target or lot' },
  { value: 'good-bad',       label: 'Good decision, bad outcome', desc: 'Agent was correct given data; reality diverged' },
]

function FlagOutcomeModal({ agentName, actionLabel, plantContext, onConfirm, onCancel }) {
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const canSubmit = category !== ''
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-stone w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-1">Flag decision for model review</div>
          <div className="font-display font-bold text-ink text-sub">{agentName}</div>
          <div className="font-body text-muted text-label mt-0.5">{actionLabel}</div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="font-body text-muted text-body leading-relaxed">
            Your flag goes to the model team. It does not change the decision record — it calibrates future recommendations.
          </p>
          {plantContext && (
            <div className="flex items-center gap-2 px-3 py-2 bg-stone3 border border-rule2">
              <div className="h-1 w-1 rounded-full bg-signal flex-shrink-0" />
              <span className="font-body text-muted text-label">
                Attached context · {plantContext.name} · {plantContext.confidenceModel} model
              </span>
            </div>
          )}
          <div>
            <label className="font-body text-muted text-label block mb-1.5">What went wrong?</label>
            <div className="space-y-1.5">
              {FLAG_CATEGORIES.map(fc => (
                <label key={fc.value}
                  className={`flex items-start gap-3 px-3 py-2.5 border cursor-pointer transition-colors ${
                    category === fc.value ? 'border-signal bg-signal/[0.04]' : 'border-rule2 hover:bg-stone2'
                  }`}>
                  <input type="radio" name="flag-cat" value={fc.value} checked={category === fc.value}
                    onChange={() => setCategory(fc.value)} className="mt-0.5 flex-shrink-0 accent-signal" />
                  <div>
                    <div className="font-body text-ink text-label font-medium">{fc.label}</div>
                    <div className="font-body text-muted text-label">{fc.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="font-body text-muted text-label block mb-1.5">
              Notes <span className="opacity-50">(optional)</span>
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} placeholder="Any additional context for the model team..."
              className="w-full font-body text-body text-ink bg-stone2 border border-rule2 px-3 py-2 resize-none placeholder:text-muted/60 focus:border-signal focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-3 border-t border-rule2 bg-stone2">
          <Btn variant="primary" disabled={!canSubmit} onClick={() => onConfirm({ category, note: note.trim() })}>
            Flag for review
          </Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
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
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-0">
        <div className="w-3.5 flex-shrink-0" />
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${pa._decided === 'approved' ? 'bg-ok' : 'bg-muted'}`} />
        <span className="font-body text-muted text-label flex-1 truncate opacity-50">{meta.verbFirst}</span>
        <StatusPill tone={pa._decided === 'approved' ? 'ok' : 'muted'} className="opacity-50">
          {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
        </StatusPill>
        {pa._decided === 'approved' && navigate && (
          <button type="button" onClick={() => navigate('/performance')}
            className="flex items-center gap-1 font-body text-label text-signal hover:text-ink transition-colors flex-shrink-0"
            title="View outcome in Performance">
            <TrendingUp size={9} strokeWidth={2} />
            <span>Monitoring</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`border-b border-rule2 last:border-0 ${open ? cfg.bg : ''}`}>
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
            <div className="pt-1 border-t border-rule2 space-y-2">
              <div className="flex items-center gap-3">
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
              <p className="font-body text-muted text-label leading-snug">
                Approving records your ratification and timestamp. Accountability for this decision remains with you as director.
              </p>
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
    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-stone3 border-t border-rule2">
      <span className="font-body text-muted text-label">{count} selected</span>
      <Btn variant="secondary" onClick={onApproveAll}>Approve all low-risk</Btn>
      <Btn variant="secondary" onClick={onDeferAll}>Defer all low confidence</Btn>
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
          <span className={`font-display font-bold text-score leading-none tabular-nums ${confColor}`}
            style={{ transition: 'color var(--dur-quick) var(--ease-standard)' }}>
            {displayConf}
          </span>
          <span className="font-body text-muted text-label pb-2">% · step {activeStep + 1} of {STEPS.length}</span>
        </div>
        <div className="h-[3px] bg-rule2 overflow-hidden">
          <div className={`h-full ${barColor}`}
            style={{ width: `${displayConf}%`, transition: `width var(--dur-data) var(--ease-enter)` }} />
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
            transition: `height var(--dur-data) var(--ease-enter)`,
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
                      : <span className={`font-body font-bold text-label ${isActive ? 'text-stone' : 'text-muted'}`}>{i + 1}</span>
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
                      <div className="font-body text-ink text-body leading-snug">{a.action}</div>
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
          <span className="font-body text-ink text-body leading-snug flex-1">{a.action}</span>
          <span className={`font-body text-label flex-shrink-0 ${a.status === 'completed' ? 'text-ok' : a.status === 'overridden' ? 'text-muted' : 'text-warn'}`}>
            {a.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Tier guide ──────────────────────────────────────────────────────────────

const TIER_ROWS = [
  { tier: 'T3', label: 'Compliance lock', desc: 'Director ratification required before AI acts — FDA / FSMA consequence', color: 'text-danger', dot: 'bg-danger' },
  { tier: 'T2', label: 'Approval',        desc: 'Director approves within shift budget — high-confidence operational decisions', color: 'text-warn',   dot: 'bg-warn'   },
  { tier: 'T1', label: 'Informed',        desc: 'AI acted autonomously — you see what happened and can flag disagreement',   color: 'text-signal', dot: 'bg-signal' },
  { tier: 'T0', label: 'Autonomous',      desc: 'AI acted and self-certified — no director input required',                  color: 'text-ok',     dot: 'bg-ok'     },
]

function TierGuide({ open, onToggle }) {
  return (
    <div className="flex-shrink-0 border-b border-rule2">
      <button type="button" onClick={onToggle}
        className="flex items-center gap-2 w-full px-5 py-2 hover:bg-stone2 transition-colors text-left">
        <span className="font-body text-muted text-label">How tiers work</span>
        <ChevronDown size={9} strokeWidth={2} className={`text-muted flex-shrink-0 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-3 space-y-2 bg-stone2 slide-in">
          {TIER_ROWS.map(r => (
            <div key={r.tier} className="flex items-start gap-3">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${r.dot}`} />
              <div>
                <span className={`font-body text-label font-semibold ${r.color}`}>{r.tier} · {r.label}</span>
                <span className="font-body text-label text-muted"> — {r.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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
                <div className="font-body text-ink text-body leading-snug">{pa._meta.verbFirst}</div>
              </div>
              <StatusPill tone="muted">Notified</StatusPill>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Rail: decision detail ────────────────────────────────────────────────────

function AgentRailDetail({ pa, agent, onClose, onApprove, onOverride, onInvestigate, navigate }) {
  const meta = pa._meta
  const confColor = pa.confidence >= 85 ? 'text-ok' : pa.confidence >= 65 ? 'text-warn' : 'text-danger'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-body text-label text-muted">{agent.name}</span>
          {meta.tier === 3 && <StatusPill tone="danger">T3</StatusPill>}
        </div>
        <button type="button" onClick={onClose}
          className="font-body text-label text-muted hover:text-ink transition-colors p-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-2.5 border-b border-rule2">
          <div className="font-display font-semibold text-body text-ink leading-snug">{meta.verbFirst}</div>
        </div>

        {[
          ['Confidence', `${pa.confidence}%`, confColor],
          ['Window',     meta.expiresLabel,   'text-ink'],
          ['Priority',   meta.consequence === 'critical' ? 'Critical' : meta.consequence === 'high' ? 'High' : 'Medium',
                         meta.consequence === 'critical' ? 'text-danger' : meta.consequence === 'high' ? 'text-warn' : 'text-muted'],
          ...(meta.blastRadius ? [['Blast radius', meta.blastRadius, 'text-muted']] : []),
        ].map(([label, val, cls]) => (
          <div key={label} className="flex items-baseline gap-3 px-4 py-2.5 border-b border-rule2">
            <span className="font-body text-label text-muted w-20 flex-shrink-0">{label}</span>
            <span className={`font-body text-label ${cls}`}>{val}</span>
          </div>
        ))}

        {pa.rationale && (
          <div className="px-4 py-3 border-b border-rule2">
            <div className="font-body text-label text-muted mb-1.5">Why the agent recommended this</div>
            <p className="font-body text-label text-ink leading-relaxed m-0">{pa.rationale}</p>
          </div>
        )}


        <button type="button" onClick={() => onInvestigate(pa, agent)}
          className="flex items-center gap-1.5 w-full px-4 py-3 font-body text-label text-muted hover:text-ink transition-colors">
          <InspectionPanel size={11} strokeWidth={2} />
          Full investigation →
        </button>
      </div>

      <div className="flex gap-2 px-4 py-3 border-t border-rule2 flex-shrink-0">
        <Btn variant="primary" className="flex-1"
          onClick={() => onApprove(pa._key)}>Approve</Btn>
        <Btn variant="secondary" onClick={() => onOverride(pa, agent)}>Override</Btn>
      </div>
    </div>
  )
}

// ─── Rail: network ────────────────────────────────────────────────────────────

function AgentNetworkRail({ currentPlant }) {
  const plantId = currentPlant?.id ?? 'sl'
  const plants  = networkData?.plants ?? []
  const exposures = networkData?.sharedExposure?.filter(e => e.risk === 'danger' && e.affectedPlants.length > 1) ?? []
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {exposures.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-danger/[0.03]">
          <AlertTriangle size={10} strokeWidth={2} className="text-danger flex-shrink-0" />
          <span className="font-body text-label text-danger">Shared lot exposure · {exposures.length} active</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {plants.map(p => {
          const sc = p.riskScore ?? 0
          const tone = sc >= 75 ? 'text-danger' : sc >= 60 ? 'text-warn' : 'text-ok'
          const isHere = p.id === plantId
          return (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b border-rule2 ${isHere ? 'bg-stone2' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-body font-medium text-body text-ink">{p.name}</div>
                  {isHere && <span className="font-body text-label text-muted">· here</span>}
                </div>
                <div className="font-body text-label text-muted">{p.supervisor} · {(p.pendingDecisions ?? 0)} pending</div>
              </div>
              <div className={`display-num text-title font-bold tabular-nums leading-none ${tone}`}>{sc}</div>
            </div>
          )
        })}
        {exposures.map(exp => {
          const others = exp.affectedPlants.filter(pid => pid !== plantId).map(pid => plants.find(p => p.id === pid)).filter(Boolean)
          if (!others.length) return null
          return (
            <div key={exp.lotId} className="px-4 py-3 border-b border-rule2 bg-danger/[0.02]">
              <div className="font-body text-label text-danger font-medium">Lot {exp.lotId}</div>
              <div className="font-body text-label text-muted mt-0.5">{exp.ingredient} · {exp.note}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-body text-label text-muted">Also held at:</span>
                {others.map(p => <span key={p.id} className="font-body text-label text-danger bg-danger/[0.08] px-1.5 py-0.5">{p.code}</span>)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Rail: shift config ───────────────────────────────────────────────────────

function AgentConfigRail({ thresholds, onThresholdChange, currentPlant }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="font-body font-medium text-body text-ink">Autonomous confidence</span>
          <span className="display-num text-label tabular-nums text-ok">{thresholds.green}%</span>
        </div>
        <div className="font-body text-label text-muted mb-2">Act without approval at or above this level</div>
        <input type="range" min={40} max={95} value={thresholds.green}
          onChange={e => onThresholdChange({ ...thresholds, green: Number(e.target.value) })}
          className="w-full accent-signal" />
      </div>
      <div className="h-px bg-rule2" />
      <div>
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="font-body font-medium text-body text-ink">Escalation confidence</span>
          <span className="display-num text-label tabular-nums text-danger">{thresholds.red}%</span>
        </div>
        <div className="font-body text-label text-muted mb-2">Director review required below this level</div>
        <input type="range" min={20} max={70} value={thresholds.red}
          onChange={e => onThresholdChange({ ...thresholds, red: Number(e.target.value) })}
          className="w-full accent-signal" />
      </div>
      <div className="h-px bg-rule2" />
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-body font-medium text-body text-ink">Auto-escalate T3</div>
            <div className="font-body text-label text-muted mt-0.5">Compliance decisions always sent to director</div>
          </div>
          <div className="w-8 h-4 bg-signal rounded-full relative flex-shrink-0 mt-1">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="font-body font-medium text-body text-ink">T2 approval budget</div>
            <div className="font-body text-label text-muted mt-0.5">Max decisions queued per shift</div>
          </div>
          <span className="display-num text-label tabular-nums text-warn flex-shrink-0">3 / 8</span>
        </div>
      </div>
    </div>
  )
}

// ─── Rail: activity log ───────────────────────────────────────────────────────

function AgentActivityRail({ agentActions }) {
  const items = (agentActions ?? []).slice(0, 20)
  if (items.length === 0) return (
    <div className="px-4 py-5 font-body text-muted text-label">No agent activity recorded this session.</div>
  )
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-3">
      {items.map((a, i) => (
        <div key={i} className="flex gap-3" style={{ marginBottom: i < items.length - 1 ? 16 : 0 }}>
          <div className="flex flex-col items-end flex-shrink-0" style={{ width: 36 }}>
            <span className="font-body text-muted text-label tabular-nums leading-none pt-0.5">
              {a.timestamp?.slice(11, 16) || '—'}
            </span>
            <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 mt-1.5 ${a.status === 'completed' ? 'bg-ok' : a.status === 'overridden' ? 'bg-muted' : 'bg-warn'}`} />
            {i < items.length - 1 && <div className="flex-1 w-px bg-rule2 mt-1.5" style={{ minHeight: 12 }} />}
          </div>
          <div className="flex-1 pb-1">
            <div className="font-body text-label text-ink leading-snug">{a.action}</div>
            <div className="font-body text-label text-muted mt-0.5">{a.agentId}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

// ─── History tab (formerly ExecutionAuthority) ───────────────────────────────

const EXEC_TIER_CFG = {
  observe:   { icon: Eye,          label: 'Observe',    color: 'text-muted'  },
  recommend: { icon: MessageSquare,label: 'Recommend',  color: 'text-signal'  },
  execute:   { icon: Zap,          label: 'Execute',    color: 'text-warn'   },
  govern:    { icon: Shield,       label: 'Govern',     color: 'text-ok'     },
}
const EXEC_OUT_CFG = {
  success:   { tone: 'ok',     label: 'Success'     },
  escalated: { tone: 'warn',   label: 'Escalated'   },
  pending:   { tone: 'signal', label: 'Pending'     },
  rollback:  { tone: 'muted',  label: 'Rolled back' },
}

function HistoryTab() {
  const [agentFilter, setAgentFilter] = useState('all')
  const [tierFilter, setTierFilter]   = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState([])

  const successPct = Math.round(executionSummary.successRate * 100)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRollbacks = rollbackLog.filter(r => new Date(r.timestamp) > sevenDaysAgo).length
  const governCriteriaMet = executionSummary.successRate >= 0.95 && recentRollbacks === 0
  const activeCeiling = [...autonomyTiers].reverse().find(t => t.agentCount > 0)

  const agentOptions = [
    { value: 'all', label: 'All agents' },
    ...Array.from(new Set(executionLog.map(e => e.agent))).map(a => ({ value: a, label: a })),
  ]
  const tierOptions = [
    { value: 'all', label: 'All tiers' },
    { value: 'observe', label: 'Observe' }, { value: 'recommend', label: 'Recommend' },
    { value: 'execute', label: 'Execute'  }, { value: 'govern',    label: 'Govern'    },
  ]
  const outcomeOptions = [
    { value: 'success', label: 'Success' }, { value: 'escalated', label: 'Escalated' },
    { value: 'pending', label: 'Pending' }, { value: 'rollback',  label: 'Rolled back' },
  ]

  const filtered = executionLog
    .filter(e => agentFilter === 'all' || e.agent === agentFilter)
    .filter(e => tierFilter === 'all' || e.tier === tierFilter)
    .filter(e => outcomeFilter.length === 0 || outcomeFilter.includes(e.outcome))

  const needsReview = executionLog.filter(e => e.outcome === 'escalated' || e.outcome === 'pending')

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Summary strip */}
      <div className="flex-shrink-0 flex items-stretch border-b border-rule2 bg-stone">
        {[
          { label: 'Success rate',    val: `${successPct}%`,   color: successPct >= 95 ? 'text-ok' : 'text-warn' },
          { label: 'Total actions',   val: executionSummary.totalActions, color: 'text-ink' },
          { label: 'Escalation rate', val: `${Math.round(executionSummary.escalationRate * 100)}%`, color: 'text-muted' },
          { label: 'Rollback rate',   val: `${Math.round(executionSummary.rollbackRate * 100)}%`,   color: recentRollbacks > 0 ? 'text-warn' : 'text-muted' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex-1 px-4 py-2.5 border-r border-rule2 last:border-r-0">
            <div className={`display-num text-sub font-bold tabular-nums leading-none ${color}`}>{val}</div>
            <div className="font-body text-label text-muted mt-1">{label} · 30d</div>
          </div>
        ))}
        {/* Govern tier readiness */}
        <div className={`flex items-center gap-2 px-4 py-2.5 flex-shrink-0 ${governCriteriaMet ? 'bg-ok/[0.04]' : ''}`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${governCriteriaMet ? 'bg-ok' : 'bg-muted'}`} />
          <div>
            <div className={`font-body text-label font-medium ${governCriteriaMet ? 'text-ok' : 'text-muted'}`}>
              {governCriteriaMet ? 'Govern tier eligible' : 'Govern tier locked'}
            </div>
            <div className="font-body text-label text-muted">
              {governCriteriaMet ? 'All criteria met' : `${recentRollbacks > 0 ? 'Rollbacks in 7d · ' : ''}${successPct}% success rate`}
            </div>
          </div>
        </div>
      </div>

      {/* Active tier — current ceiling */}
      {activeCeiling && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-rule2 bg-stone2">
          <Zap size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
          <span className="font-body text-label font-medium text-ink">Active ceiling: {activeCeiling.label}</span>
          <span className="font-body text-label text-muted">·</span>
          <span className="font-body text-label text-muted">{activeCeiling.description}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-rule2 bg-stone">
        <FilterDropdown label="Agent"   options={agentOptions}   value={agentFilter}   onChange={setAgentFilter} />
        <FilterDropdown label="Tier"    options={tierOptions}    value={tierFilter}    onChange={setTierFilter} />
        <MultiFilterDropdown label="Outcome" options={outcomeOptions} values={outcomeFilter} onChange={setOutcomeFilter} />
        <span className="ml-auto font-body text-label text-muted">{filtered.length} events</span>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto">
        {needsReview.length > 0 && outcomeFilter.length === 0 && agentFilter === 'all' && tierFilter === 'all' && (
          <div className="px-5 py-2 border-b border-rule2 bg-warn/[0.03]">
            <span className="font-body text-warn text-label font-medium">{needsReview.length} event{needsReview.length !== 1 ? 's' : ''} need review</span>
          </div>
        )}
        {filtered.map(e => {
          const tc  = EXEC_TIER_CFG[e.tier]  ?? EXEC_TIER_CFG.execute
          const oc  = EXEC_OUT_CFG[e.outcome] ?? EXEC_OUT_CFG.success
          const TierIcon = tc.icon
          return (
            <div key={e.id} className="flex items-start gap-3 px-5 py-3 border-b border-rule2 hover:bg-stone2/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="font-body font-medium text-ink text-body leading-snug mb-0.5">{e.action}</div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-label text-muted">{e.agent}</span>
                  <span className="font-body text-muted text-label opacity-40">·</span>
                  <TierIcon size={9} strokeWidth={2} className={`flex-shrink-0 ${tc.color}`} />
                  <span className={`font-body text-label ${tc.color} capitalize`}>{e.tier}</span>
                  {e.monitoringWindow && <span className="font-body text-label text-muted">· {e.monitoringWindow}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusPill tone={oc.tone}>{oc.label}</StatusPill>
                <span className="font-body text-label text-muted tabular-nums">{e.timeLabel}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// In demo mode, show the decisions that best demonstrate the platform's PMF across the autonomy spectrum:
// pa3-emergency — AI auto-assigning a robot with a 15-min override window (highest urgency drama)
// pa2           — lot hold recommendation with FSMA compliance consequence (Tier 3 ratification)
// pa-sc1        — reversible logistics reroute, Tier 2, no director ratification required
const DEMO_DECISION_IDS = new Set(['pa3-emergency', 'pa2', 'pa-sc1'])

const AGENT_TABS = [
  { id: 'decisions', label: 'Decisions' },
  { id: 'policies',  label: 'Policies' },
  { id: 'history',   label: 'History'   },
]

export default function AgentControl() {
  const { agentActions, systemConfidence, logAgentAction, overrideAgentAction, markAgentDecided, currentPlant, isDemoMode } = useAppState()
  const navigate = useNavigate()
  const [agentTab, setAgentTab] = useState('decisions')
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
    .filter(pa => !isDemoMode || DEMO_DECISION_IDS.has(pa.id))

  const [pending, setPending]             = useState(allPending)
  const [selected, setSelected]           = useState(new Set())
  const [investigationDrawer, setInvestigationDrawer] = useState(null)
  const [overrideModal, setOverrideModal] = useState(null)
  const [disableModal, setDisableModal]   = useState(null)
  const [splitFocused, setSplitFocused]   = useState(null) // selected decision key for rail
  const [agentFilter, setAgentFilter]     = useState('all')
  const [tierFilter, setTierFilter]       = useState('all')
  const [consequenceFilter, setConsequenceFilter] = useState([])
  const [tier1Open, setTier1Open]         = useState(false)
  const tier1BtnRef                       = useRef(null)
  const [freshnessOpen, setFreshnessOpen] = useState(false)
  const [flaggedDecisions, setFlaggedDecisions] = useState({})
  const [flagModal, setFlagModal]         = useState(null)
  const [shiftThresholds, setShiftThresholds] = useState({
    green: currentPlant?.confidenceGreen ?? 70,
    red:   currentPlant?.confidenceRed   ?? 50,
  })
  // Rail state
  const [railMode, setRailMode] = useState('context') // 'context' | 'detail'
  const [railTab, setRailTab]   = useState('network')
  const [tierGuideOpen, setTierGuideOpen] = useState(false)


  const tier1Items = pending.filter(p => p._meta.tier === 1)
  const tier2Items = pending.filter(p => p._meta.tier === 2)
  const tier3Items = pending.filter(p => p._meta.tier === 3)
  const tier0Count = 12 // static: autonomous actions taken this shift, no review needed

  const handleApprove = (key) => {
    const pa = pending.find(p => p._key === key)
    setPending(prev => prev.map(p => p._key === key ? { ...p, _decided: 'approved' } : p))
    setSelected(prev => { const n = new Set(prev); n.delete(key); return n })
    if (investigationDrawer?.pa._key === key) setInvestigationDrawer(null)
    if (splitFocused === key) { setSplitFocused(null); setRailMode('context') }
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

  const handleFlag = ({ category, note }) => {
    const { pa } = flagModal
    setFlaggedDecisions(prev => ({
      ...prev,
      [pa._key]: {
        category,
        note,
        timestamp: new Date().toISOString(),
        plantId: currentPlant?.id ?? 'sl',
        confidenceModel: currentPlant?.confidenceModel ?? 'biological',
        agentId: pa._agentId,
      }
    }))
    setFlagModal(null)
  }

  const undecidedPending = pending.filter(p => !p._decided)
  const undecidedCount = undecidedPending.filter(p => p._meta.tier >= 2).length
  const confColor = (systemConfidence ?? 79) >= 85 ? 'text-ok' : (systemConfidence ?? 79) >= 65 ? 'text-warn' : 'text-danger'

  const staleSource = dataSourceHealth?.find(s => s.status === 'stale')

  // Scope bar filters (Agent / Tier / Priority) — only applied to undecided items;
  // decided items stay visible regardless so the audit trail isn't hidden by scoping.
  const passesScopeFilter = (p) => {
    if (agentFilter !== 'all' && p._agentId !== agentFilter) return false
    if (tierFilter !== 'all' && String(p._meta.tier) !== tierFilter) return false
    if (consequenceFilter.length > 0 && !consequenceFilter.includes(p._meta.consequence)) return false
    return true
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <Tabs tabs={AGENT_TABS} active={agentTab} onChange={setAgentTab} />

      {agentTab === 'history' && <HistoryTab />}

      {agentTab === 'policies' && <PolicyBuilderTab />}

      {agentTab === 'decisions' && <>

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

      {/* ── Scope bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-rule2 bg-stone flex-shrink-0">
        <FilterDropdown
          label="Agent"
          options={[{ value: 'all', label: 'All agents' }, ...agents.map(a => ({ value: a.id, label: a.name }))]}
          value={agentFilter}
          onChange={setAgentFilter}
        />
        <FilterDropdown
          label="Tier"
          options={[
            { value: 'all', label: 'All tiers' },
            { value: '2',   label: 'Tier 2 — approval' },
            { value: '3',   label: 'Tier 3 — compliance' },
          ]}
          value={tierFilter}
          onChange={setTierFilter}
        />
        <MultiFilterDropdown
          label="Priority"
          options={[
            { value: 'critical', label: 'Critical' },
            { value: 'high',     label: 'High' },
            { value: 'medium',   label: 'Medium' },
          ]}
          values={consequenceFilter}
          onChange={setConsequenceFilter}
        />
        <div className="ml-auto font-body text-muted text-label">
          {undecidedPending.filter(passesScopeFilter).length} decisions
        </div>
      </div>

      {/* ── Decision status strip — confidence + tier workload ─────────── */}
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
            <div className={`flex items-center gap-2.5 px-4 py-2.5 flex-1 border-l-[3px] ${undecided > 0 ? 'bg-danger/[0.05] border-l-danger' : 'border-l-transparent'}`}>
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
          {undecidedCount > 0 && (
            <span className="font-body text-label text-warn bg-warn/[0.08] px-1.5 py-0.5 ml-auto mr-5">{undecidedCount} awaiting</span>
          )}
        </div>
        <TierGuide open={tierGuideOpen} onToggle={() => setTierGuideOpen(o => !o)} />

        {/* ── T3 critical banner ── */}
        {(() => {
          const undecidedT3 = tier3Items.filter(p => !p._decided)
          if (!undecidedT3.length) return null
          return (
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-danger/[0.06] border-b border-danger/20">
              <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
              <span className="font-body text-danger text-label font-medium flex-1">
                {undecidedT3.length} critical decision{undecidedT3.length !== 1 ? 's' : ''} require your attention
              </span>
              <span className="font-body text-danger/70 text-label tabular-nums">
                {undecidedT3[0]?._meta?.consequence === 'critical' ? 'FDA lock risk' : 'Action required'}
              </span>
            </div>
          )
        })()}

        {/* ── Cross-plant lot advisory (Break 1) ── */}
        {(() => {
          const plantId = currentPlant?.id ?? 'sl'
          const exposures = networkData?.sharedExposure?.filter(e =>
            e.risk === 'danger' && e.affectedPlants.length > 1
          ) ?? []
          if (!exposures.length) return null
          return exposures.map(exp => {
            const others = exp.affectedPlants
              .filter(pid => pid !== plantId)
              .map(pid => networkData.plants.find(p => p.id === pid))
              .filter(Boolean)
            if (!others.length) return null
            return (
              <div key={exp.lotId} className="flex-shrink-0 flex items-start gap-3 px-5 py-2.5 bg-danger/[0.04] border-b border-danger/20">
                <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-body text-danger text-label font-medium">Lot {exp.lotId} — cross-plant hold required</span>
                  <span className="font-body text-muted text-label ml-2">{exp.ingredient} · {exp.supplier} · {exp.note}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-body text-muted text-label">Also at:</span>
                  {others.map(p => (
                    <span key={p.id} className="font-body text-danger text-label bg-danger/[0.08] px-1.5 py-0.5">{p.code}</span>
                  ))}
                </div>
              </div>
            )
          })
        })()}

        {/* ── Queue + Rail ─────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── Queue (65%) ── */}
            <div className="flex flex-col border-r border-rule flex-shrink-0 overflow-hidden" style={{ flex: '0 0 65%' }}>
              <div className="flex-1 overflow-y-auto">
                {undecidedCount === 0 && pending.every(p => p._decided) ? (
                  <div className="flex items-center gap-2 px-5 py-5">
                    <CheckCircle size={14} className="text-ok flex-shrink-0" />
                    <span className="font-body text-ink text-body">All decisions made this shift</span>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const visibleItems = [...undecidedPending.filter(p => p._meta.tier >= 2 && passesScopeFilter(p)), ...pending.filter(p => p._decided && p._meta.tier >= 2)]
                      if (visibleItems.length === 0) {
                        return (
                          <div className="flex items-center gap-2 px-5 py-5">
                            <span className="font-body text-muted text-body">No decisions match this scope</span>
                          </div>
                        )
                      }
                      return visibleItems.map(pa => {
                      const agent = agents.find(a => a.id === pa._agentId)
                      if (!agent) return null
                      const isFocused = splitFocused === pa._key && railMode === 'detail'
                      const pillTone  = pa._meta.consequence === 'critical' ? 'danger' : pa._meta.consequence === 'high' ? 'warn' : 'muted'
                      const pillLabel = pa._meta.consequence === 'critical' ? 'Critical' : pa._meta.consequence === 'high' ? 'High' : 'Medium'
                      const confColor = pa.confidence >= 85 ? 'text-ok' : pa.confidence >= 65 ? 'text-warn' : 'text-danger'
                      return (
                        <div key={pa._key}
                          onClick={() => {
                            if (pa._decided) return
                            if (isFocused) { setSplitFocused(null); setRailMode('context') }
                            else { setSplitFocused(pa._key); setRailMode('detail') }
                          }}
                          className={`flex items-center gap-4 px-5 py-3 border-b border-rule2 transition-colors ${
                            pa._decided ? 'opacity-40' : isFocused ? 'bg-stone3' : 'cursor-pointer hover:bg-stone2'
                          }`}>
                          <div className="flex-1 min-w-0">
                            <div className={`font-body font-medium text-body leading-snug ${pa._decided ? 'text-muted line-through' : 'text-ink'}`}>
                              {pa._meta.verbFirst}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-body text-label text-muted">{agent.name}</span>
                              <span className="text-rule">·</span>
                              <span className={`display-num text-label tabular-nums ${confColor}`}>{pa.confidence}%</span>
                              {pa._meta.groupId && GROUP_META[pa._meta.groupId] && (
                                <span className="font-body text-label text-context">· {GROUP_META[pa._meta.groupId].label}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {pa.isEmergencyAutoAct && <EmergencyChip overrideWindowMin={pa.overrideWindowMin} />}
                            {pa._decided ? (
                              <StatusPill tone={pa._decided === 'approved' ? 'ok' : 'muted'}>
                                {pa._decided === 'approved' ? 'Approved' : 'Overridden'}
                              </StatusPill>
                            ) : (
                              <StatusPill tone={pillTone}>{pillLabel}</StatusPill>
                            )}
                          </div>
                        </div>
                      )
                    })
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* ── Rail (35%) ── */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Persistent tab strip */}
              <div className="flex border-b border-rule2 flex-shrink-0">
                {[['network', Network, 'Network'], ['config', Settings, 'Config'], ['activity', Activity, 'Activity']].map(([id, Icon, label]) => {
                  const isActive = railMode === 'context' && railTab === id
                  return (
                    <button key={id} type="button"
                      onClick={() => { setRailTab(id); setRailMode('context') }}
                      className={`relative flex items-center gap-1.5 flex-1 px-3 py-2.5 font-body text-label transition-colors ${
                        isActive ? 'text-ink bg-stone2' : 'text-muted hover:text-ink'
                      }`}>
                      <Icon size={10} strokeWidth={2} />
                      {label}
                      {isActive && <div className="absolute bottom-0 left-0 right-0 h-px bg-signal" />}
                    </button>
                  )
                })}
              </div>

              {/* Rail content */}
              {railMode === 'detail' && splitFocused ? (() => {
                const pa    = pending.find(p => p._key === splitFocused)
                const agent = pa ? agents.find(a => a.id === pa._agentId) : null
                if (!pa || !agent) return null
                return (
                  <AgentRailDetail
                    pa={pa}
                    agent={agent}
                    onClose={() => { setSplitFocused(null); setRailMode('context') }}
                    onApprove={handleApprove}
                    onOverride={(pa, agent) => setOverrideModal({ pa, agent })}
                    onInvestigate={(pa, agent) => setInvestigationDrawer({ pa, agent })}
                    navigate={navigate}
                  />
                )
              })() : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {railTab === 'network'  && <AgentNetworkRail currentPlant={currentPlant} />}
                  {railTab === 'config'   && (
                    <AgentConfigRail
                      thresholds={shiftThresholds}
                      onThresholdChange={setShiftThresholds}
                      currentPlant={currentPlant}
                    />
                  )}
                  {railTab === 'activity' && <AgentActivityRail agentActions={agentActions} />}
                </div>
              )}
            </div>
        </div>
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
      {flagModal && (
        <FlagOutcomeModal
          agentName={flagModal.agent.name}
          actionLabel={flagModal.pa._meta.verbFirst}
          plantContext={currentPlant}
          onConfirm={handleFlag}
          onCancel={() => setFlagModal(null)}
        />
      )}

      {/* ── Investigation drawer ─────────────────────────────────────── */}
      {investigationDrawer && (
        <SlidePanel
          title={investigationDrawer.pa._meta.verbFirst}
          subtitle={investigationDrawer.agent.name}
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

      {/* Network + Config + Activity moved to persistent rail — panels removed */}

      {false && networkOpen && (
        <SlidePanel
          title="Network queue"
          subtitle={`${networkData?.plants?.length ?? 0} plants · cross-plant decision view`}
          onClose={() => setNetworkOpen(false)}
          maxWidth="440px"
        >
          <div className="-m-5 space-y-0">
            {/* Cross-plant lot exposure */}
            {networkData?.sharedExposure?.length > 0 && (
              <>
                <div className="px-5 py-3 border-b border-rule2 bg-stone3">
                  <span className="font-body text-muted text-label font-medium">Shared lot exposure</span>
                </div>
                {networkData.sharedExposure.map(exp => (
                  <div key={exp.lotId} className={`flex items-start gap-3 px-5 py-4 border-b border-rule2 ${exp.risk === 'danger' ? 'bg-danger/[0.03]' : 'bg-warn/[0.02]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${exp.risk === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-body text-label font-medium ${exp.risk === 'danger' ? 'text-danger' : 'text-warn'}`}>
                        Lot {exp.lotId} · {exp.ingredient}
                      </div>
                      <div className="font-body text-muted text-label mt-0.5">{exp.supplier} · {exp.note}</div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {exp.affectedPlants.map(pid => {
                          const plant = networkData.plants.find(p => p.id === pid)
                          return (
                            <span key={pid} className={`font-body text-label px-1.5 py-0.5 ${pid === (currentPlant?.id ?? 'sl') ? 'bg-signal/10 text-signal' : 'bg-stone3 text-muted'}`}>
                              {plant?.code ?? pid}{pid === (currentPlant?.id ?? 'sl') ? ' · this plant' : ''}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {/* Per-plant queue summary */}
            <div className="px-5 py-3 border-b border-rule2 bg-stone3">
              <span className="font-body text-muted text-label font-medium">Plant queue summary</span>
            </div>
            {networkData?.plants?.map(plant => (
              <div key={plant.id} className={`flex items-center gap-4 px-5 py-4 border-b border-rule2 last:border-0 ${plant.active ? 'bg-signal/[0.02]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`font-body font-medium text-body ${plant.status === 'at-risk' ? 'text-danger' : 'text-ink'}`}>{plant.name}</div>
                    {plant.active && <span className="font-body text-signal text-label bg-signal/10 px-1.5 py-0.5">this plant</span>}
                  </div>
                  <div className="font-body text-muted text-label mt-0.5">{plant.code} · {plant.lots.length} active lot{plant.lots.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`display-num text-head leading-none ${plant.score >= 85 ? 'text-ok' : plant.score >= 70 ? 'text-warn' : 'text-danger'}`}>
                    {plant.score}
                  </div>
                  <div className="font-body text-muted text-label">readiness</div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plant.status === 'at-risk' ? 'bg-danger' : 'bg-ok'}`} />
              </div>
            ))}
          </div>
        </SlidePanel>
      )}

      {false && shiftConfigOpen && (
        <SlidePanel
          title="Shift autonomy config"
          subtitle={`${currentPlant?.name ?? 'This plant'} · current shift`}
          onClose={() => setShiftConfigOpen(false)}
          maxWidth="380px"
        >
          <div className="-m-5 space-y-0">
            <div className="px-5 py-3 bg-stone2 border-b border-rule2">
              <p className="font-body text-muted text-body leading-relaxed">
                Confidence thresholds control when agents require director review vs. acting autonomously. Adjustments apply to this shift only — bounds are set by the director.
              </p>
            </div>
            <div className="divide-y divide-rule2">
              {[
                { key: 'green', label: 'Autonomous action threshold', desc: 'Above this — agents act without review', color: 'text-ok' },
                { key: 'red',   label: 'Hold for director review',    desc: 'Below this — all actions escalate',    color: 'text-danger' },
              ].map(({ key, label, desc, color }) => (
                <div key={key} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-ink text-label font-medium">{label}</span>
                    <span className={`display-num text-head leading-none ${color}`}>{shiftThresholds[key]}%</span>
                  </div>
                  <div className="font-body text-muted text-label mb-3">{desc}</div>
                  <input type="range" min={key === 'red' ? 30 : 50} max={key === 'red' ? 75 : 99}
                    value={shiftThresholds[key]}
                    onChange={e => setShiftThresholds(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-signal"
                  />
                </div>
              ))}
              <div className="px-5 py-4 bg-stone3">
                <div className="font-body text-muted text-label mb-1">Director-set bounds</div>
                <div className="flex items-center gap-4">
                  <span className="font-body text-muted text-label">Green floor: {currentPlant?.confidenceGreen ?? 70}%</span>
                  <span className="font-body text-muted text-label">Red ceiling: {currentPlant?.confidenceRed ?? 50}%</span>
                </div>
                <div className="font-body text-muted text-label mt-1">Shift config cannot exceed these bounds</div>
              </div>
            </div>
          </div>
        </SlidePanel>
      )}

      </> /* end decisions tab */}
    </div>
  )
}
