import { useState } from 'react'
import { Link } from 'react-router-dom'
import { securityPosture, hygieneChecks, modelRegistry, accessAuditLog, shadowAIEvents } from '../data/security'
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  Eye, Database, Clock, Activity, ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react'
import { SceneHeader, StatusPill, Btn, AnimatedScore, SectionHeader } from '../components/UI'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_CFG = {
  pass: { icon: CheckCircle2, color: 'text-ok',     dot: 'bg-ok',     border: 'border-l-ok',     label: 'Pass'    },
  warn: { icon: AlertCircle,  color: 'text-warn',   dot: 'bg-warn',   border: 'border-l-warn',   label: 'Warning' },
  fail: { icon: XCircle,      color: 'text-danger', dot: 'bg-danger', border: 'border-l-danger', label: 'Fail'    },
}

const SEVERITY_CFG = {
  critical: { color: 'text-danger', pill: 'danger', label: 'Critical' },
  high:     { color: 'text-danger', pill: 'danger', label: 'High'     },
  medium:   { color: 'text-warn',   pill: 'warn',   label: 'Medium'   },
  low:      { color: 'text-muted',  pill: 'muted',  label: 'Low'      },
}

const VALIDATION_CFG = {
  current: { label: 'Current',           color: 'text-ok',   dot: 'bg-ok'   },
  stale:   { label: 'Validation overdue', color: 'text-danger', dot: 'bg-danger' },
  unknown: { label: 'Not validated',      color: 'text-warn', dot: 'bg-warn' },
}

// ─── Left rail: posture instrument ───────────────────────────────────────────

function PostureInstrument({ posture }) {
  const scoreColor = posture.score >= 80 ? 'text-ok' : posture.score >= 60 ? 'text-warn' : 'text-danger'
  const statusLabel = posture.score >= 80 ? 'Secure' : posture.score >= 60 ? 'Partial' : 'At risk'
  return (
    <div className="px-5 pt-5 pb-4 border-b border-rule2">
      <div className="mb-3">
        <div className={`display-num text-score leading-none ${scoreColor}`}>
          <AnimatedScore value={posture.score} effect="blur" />
        </div>
        <div className={`font-body font-medium text-label mt-1 ${scoreColor}`}>{statusLabel}</div>
      </div>

      {/* Category bars */}
      <div className="space-y-2">
        {posture.categoryScores.map(cat => {
          const total = cat.pass + cat.warn + cat.fail
          const passPct = (cat.pass / total) * 100
          const warnPct = (cat.warn / total) * 100
          const failPct = (cat.fail / total) * 100
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-body text-label text-muted truncate">{cat.label}</span>
                <span className="font-body text-label text-muted ml-2 flex-shrink-0 tabular-nums">
                  {cat.pass}/{total}
                </span>
              </div>
              <div className="h-1 bg-rule2 overflow-hidden flex gap-px">
                {passPct > 0 && <div className="h-full bg-ok"     style={{ width: `${passPct}%` }} />}
                {warnPct > 0 && <div className="h-full bg-warn"   style={{ width: `${warnPct}%` }} />}
                {failPct > 0 && <div className="h-full bg-danger" style={{ width: `${failPct}%` }} />}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-3">
        {[['bg-ok','Pass'],['bg-warn','Warn'],['bg-danger','Fail']].map(([dot,lbl]) => (
          <div key={lbl} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
            <span className="font-body text-label text-muted">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Left rail: section nav ───────────────────────────────────────────────────

const SECTIONS = [
  { id: 'hygiene',  label: 'OT Hygiene',     icon: ShieldCheck },
  { id: 'models',   label: 'Model Registry', icon: Database    },
  { id: 'audit',    label: 'Access Audit',   icon: Eye         },
  { id: 'shadow',   label: 'Shadow AI',      icon: ShieldAlert },
]

function SectionNav({ active, onChange, posture, modelRegistry, shadowAIEvents }) {
  const staleModels = modelRegistry.filter(m => m.validationStatus === 'stale').length
  const activeIncidents = shadowAIEvents.filter(e => e.status === 'investigating').length
  const openFindings = hygieneChecks.filter(c => c.status === 'fail').length

  const badges = {
    hygiene: openFindings > 0 ? String(openFindings) : null,
    models:  staleModels > 0  ? String(staleModels)  : null,
    audit:   null,
    shadow:  activeIncidents > 0 ? String(activeIncidents) : null,
  }

  return (
    <nav className="py-2">
      {SECTIONS.map(s => {
        const Icon = s.icon
        const isActive = active === s.id
        const badge = badges[s.id]
        return (
          <button key={s.id} type="button" onClick={() => onChange(s.id)}
            className={`flex items-center gap-3 w-full px-5 py-2.5 text-left transition-colors border-l-2 ${
              isActive ? 'border-l-signal bg-signal/[0.04] text-white' : 'border-l-transparent text-muted hover:bg-stone2 hover:text-ink'
            }`}>
            <Icon size={13} strokeWidth={2} className="flex-shrink-0" />
            <span className="font-body text-body flex-1">{s.label}</span>
            {badge && (
              <span className={`font-body text-label font-semibold px-1.5 py-px ${
                s.id === 'shadow' ? 'bg-danger/15 text-danger' : 'bg-warn/15 text-warn'
              }`}>{badge}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Workspace: OT Hygiene ────────────────────────────────────────────────────

const HYGIENE_CATEGORIES = ['Network & Identity', 'Assets & Hardening', 'Monitoring & Response', 'People & Process']

function HygieneRow({ check }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CFG[check.status]
  const Icon = cfg.icon
  const sev = check.severity ? SEVERITY_CFG[check.severity] : null
  return (
    <div className={`border-b border-rule2 border-l-2 ${cfg.border} ${open ? 'bg-stone2' : ''}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-stone2 transition-colors">
        <Icon size={12} strokeWidth={2} className={`flex-shrink-0 ${cfg.color}`} />
        <span className={`font-body text-body flex-1 leading-snug text-left ${check.status === 'pass' ? 'text-muted' : 'text-ink'}`}>
          {check.label}
        </span>
        {sev && <StatusPill tone={sev.pill} className="flex-shrink-0">{sev.label}</StatusPill>}
        {open ? <ChevronDown size={10} className="text-muted flex-shrink-0" /> : <ChevronRight size={10} className="text-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-rule2">
          <p className="font-body text-label text-muted leading-relaxed pt-2">{check.detail}</p>
          {check.finding && (
            <div className={`px-3 py-2 border-l-2 ${cfg.border} bg-stone`}>
              <div className="font-body text-label font-medium text-muted mb-0.5">Finding</div>
              <p className="font-body text-label text-muted leading-snug">{check.finding}</p>
            </div>
          )}
          {check.remediation && (
            <div className="flex items-start gap-2">
              <span className={`font-body text-label ${cfg.color} flex-shrink-0`}>→</span>
              <p className="font-body text-label leading-snug" style={{ color: 'var(--color-ink)' }}>{check.remediation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HygieneWorkspace() {
  const passing = hygieneChecks.filter(c => c.status === 'pass').length
  const failing = hygieneChecks.filter(c => c.status === 'fail').length
  const warning = hygieneChecks.filter(c => c.status === 'warn').length
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Summary strip */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-rule2 bg-stone2">
        {[
          [passing, 'text-ok',     'Passing'],
          [warning, 'text-warn',   'Warning'],
          [failing, 'text-danger', 'Failing'],
        ].map(([n, cls, lbl]) => (
          <div key={lbl} className="flex items-center gap-2">
            <span className={`display-num text-sub font-bold tabular-nums ${cls}`}>{n}</span>
            <span className="font-body text-label text-muted">{lbl}</span>
          </div>
        ))}
        <span className="ml-auto font-body text-label text-muted">{hygieneChecks.length} checks total · ISA/IEC 62443</span>
      </div>

      {/* Grouped checklist */}
      {HYGIENE_CATEGORIES.map(category => {
        const items = hygieneChecks.filter(c => c.category === category)
        return (
          <div key={category}>
            <SectionHeader label={category} />
            {items.map(c => <HygieneRow key={c.id} check={c} />)}
          </div>
        )
      })}
    </div>
  )
}

// ─── Workspace: Model Registry ────────────────────────────────────────────────

function ModelCard({ model }) {
  const [open, setOpen] = useState(false)
  const vcfg = VALIDATION_CFG[model.validationStatus] ?? VALIDATION_CFG.unknown
  return (
    <div className={`border-b border-rule2 border-l-2 ${model.validationStatus === 'stale' ? 'border-l-danger' : 'border-l-rule2'}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-4 w-full px-5 py-4 text-left hover:bg-stone2 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-body font-medium text-ink text-body">{model.name}</span>
            {model.writeAccess && (
              <span className="font-body text-label px-1.5 py-px bg-warn/10 text-warn">Write access</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-label text-muted">{model.agent}</span>
            <span className="font-body text-label text-muted opacity-40">·</span>
            <span className="font-body text-label text-muted">v{model.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vcfg.dot}`} />
          <span className={`font-body text-label ${vcfg.color}`}>{vcfg.label}</span>
          {model.staleDays && (
            <span className="font-body text-label text-danger">· {model.staleDays}d overdue</span>
          )}
        </div>
        {open ? <ChevronDown size={10} className="text-muted flex-shrink-0 ml-1" /> : <ChevronRight size={10} className="text-muted flex-shrink-0 ml-1" />}
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-rule2 space-y-3 bg-stone2">
          {model.finding && (
            <div className="flex items-start gap-2 px-3 py-2 bg-danger/[0.04] border-l-2 border-l-danger mt-3">
              <AlertTriangle size={11} strokeWidth={2} className="text-danger flex-shrink-0 mt-px" />
              <p className="font-body text-danger text-label leading-snug">{model.finding}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              ['Provider', model.provider],
              ['Version', `v${model.version}`],
              ['Deployed', model.deployedDate],
              ['Last validated', model.lastValidated],
              ['Training cutoff', model.trainingCutoff],
              ['Prompt version', `v${model.promptVersion}`],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="font-body text-label text-muted mb-0.5">{label}</div>
                <div className="font-body text-label text-ink">{val}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="font-body text-label text-muted mb-1">Data access scope</div>
            <div className="flex flex-wrap gap-1.5">
              {model.dataScope.map(s => (
                <span key={s} className="font-body text-label text-muted bg-stone border border-rule2 px-2 py-px">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="font-body text-label text-muted mb-0.5">Write scope</div>
            <div className="font-body text-label text-ink">{model.accessScope}</div>
            {model.writeDetail && <div className="font-body text-label text-muted mt-0.5">{model.writeDetail}</div>}
          </div>

          <div>
            <div className="font-body text-label text-muted mb-0.5">Confidence method</div>
            <div className="font-body text-label text-muted leading-snug">{model.confidenceMethod}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModelRegistryWorkspace() {
  const stale = modelRegistry.filter(m => m.validationStatus === 'stale').length
  const withWrite = modelRegistry.filter(m => m.writeAccess).length
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-6 px-6 py-3 border-b border-rule2 bg-stone2">
        <div className="flex items-center gap-2">
          <span className="display-num text-sub font-bold tabular-nums text-ok">{modelRegistry.length - stale}</span>
          <span className="font-body text-label text-muted">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="display-num text-sub font-bold tabular-nums text-danger">{stale}</span>
          <span className="font-body text-label text-muted">Stale</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="display-num text-sub font-bold tabular-nums text-warn">{withWrite}</span>
          <span className="font-body text-label text-muted">Write access</span>
        </div>
        <span className="ml-auto font-body text-label text-muted">{modelRegistry.length} models deployed</span>
      </div>
      {modelRegistry.map(m => <ModelCard key={m.id} model={m} />)}
    </div>
  )
}

// ─── Workspace: Access Audit ──────────────────────────────────────────────────

const ACTOR_TYPE_CFG = {
  agent: { color: 'text-signal', dot: 'bg-signal' },
  human: { color: 'text-ink',    dot: 'bg-muted'  },
}

const TIER_LABELS = { 0: 'T0 · Auto', 1: 'T1 · Notified', 2: 'T2 · Approved', 3: 'T3 · Ratified' }

function AuditRow({ entry }) {
  const [open, setOpen] = useState(false)
  const actorCfg = ACTOR_TYPE_CFG[entry.actorType] ?? ACTOR_TYPE_CFG.human
  return (
    <div className="border-b border-rule2">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-stone2 transition-colors">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${actorCfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="font-body font-medium text-ink text-body leading-snug truncate">{entry.action}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-body text-label ${actorCfg.color}`}>{entry.actor}</span>
            {entry.tier !== null && entry.tier !== undefined && (
              <>
                <span className="font-body text-label text-muted opacity-40">·</span>
                <span className="font-body text-label text-muted">{TIER_LABELS[entry.tier]}</span>
              </>
            )}
          </div>
        </div>
        <span className="font-body text-label text-muted flex-shrink-0">{entry.timestamp}</span>
        {open ? <ChevronDown size={10} className="text-muted flex-shrink-0" /> : <ChevronRight size={10} className="text-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-3 border-t border-rule2 bg-stone2 space-y-2">
          <div className="pt-2">
            <div className="font-body text-label text-muted mb-1.5">Data accessed</div>
            <div className="flex flex-wrap gap-1.5">
              {entry.dataAccessed.map(s => (
                <span key={s} className="font-body text-label text-muted bg-stone border border-rule2 px-2 py-px">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Authorization</div>
            <div className={`font-body text-label ${entry.authorized ? 'text-ok' : 'text-danger'}`}>
              {entry.authorized ? 'Authorized' : 'Unauthorized'} · {entry.outcome}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AccessAuditWorkspace() {
  const agentActions = accessAuditLog.filter(e => e.actorType === 'agent').length
  const humanActions = accessAuditLog.filter(e => e.actorType === 'human').length
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-6 px-6 py-3 border-b border-rule2 bg-stone2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-signal flex-shrink-0" />
          <span className="display-num text-sub font-bold tabular-nums text-signal">{agentActions}</span>
          <span className="font-body text-label text-muted">Agent actions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
          <span className="display-num text-sub font-bold tabular-nums text-ink">{humanActions}</span>
          <span className="font-body text-label text-muted">Human actions</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
          <span className="font-body text-label text-muted">All authorized</span>
        </div>
        <span className="ml-auto font-body text-label text-muted">Last 7 days · {accessAuditLog.length} events</span>
      </div>
      {accessAuditLog.map(e => <AuditRow key={e.id} entry={e} />)}
    </div>
  )
}

// ─── Workspace: Shadow AI ─────────────────────────────────────────────────────

const SHADOW_STATUS_CFG = {
  investigating: { label: 'Investigating', tone: 'danger', dot: 'bg-danger animate-pulse' },
  resolved:      { label: 'Resolved',      tone: 'muted',  dot: 'bg-ok'                  },
}

function ShadowEventCard({ event }) {
  const [open, setOpen] = useState(false)
  const scfg = SHADOW_STATUS_CFG[event.status] ?? SHADOW_STATUS_CFG.resolved
  const sevcfg = SEVERITY_CFG[event.severity] ?? SEVERITY_CFG.low
  const isOpen = event.status === 'investigating'
  return (
    <div className={`border-b border-rule2 border-l-2 ${isOpen ? 'border-l-danger' : 'border-l-rule2'}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-start gap-3 w-full px-5 py-4 text-left hover:bg-stone2 transition-colors ${isOpen ? 'bg-danger/[0.02]' : ''}`}>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${scfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <StatusPill tone={scfg.tone}>{scfg.label}</StatusPill>
            <StatusPill tone={sevcfg.pill}>{sevcfg.label}</StatusPill>
            <span className="font-body text-label text-muted ml-auto">{event.timestamp}</span>
          </div>
          <div className="font-body font-medium text-ink text-body leading-snug mt-1">{event.actor}</div>
          <div className="font-body text-muted text-label mt-0.5 leading-snug line-clamp-2">{event.description}</div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {open ? <ChevronDown size={10} className="text-muted" /> : <ChevronRight size={10} className="text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-rule2 bg-stone2 space-y-3">
          <div className="pt-2">
            <div className="font-body text-label text-muted mb-0.5">What happened</div>
            <p className="font-body text-label text-muted leading-relaxed">{event.description}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Data at risk</div>
            <p className={`font-body text-label leading-snug ${isOpen ? 'text-danger' : 'text-muted'}`}>{event.dataAtRisk}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Remediation</div>
            <p className="font-body text-label leading-snug" style={{ color: 'var(--color-ink)' }}>{event.remediation}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-label text-muted">Ticket: {event.ticket}</span>
            <span className={`font-body text-label font-medium ${event.remediationStatus === 'closed' ? 'text-ok' : 'text-warn'}`}>
              {event.remediationStatus === 'closed' ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ShadowAIWorkspace() {
  const active   = shadowAIEvents.filter(e => e.status === 'investigating').length
  const resolved = shadowAIEvents.filter(e => e.status === 'resolved').length
  return (
    <div className="flex-1 overflow-y-auto">
      {/* What is shadow AI — director-level explanation */}
      <div className="px-6 py-4 border-b border-rule2 bg-stone2">
        <div className="font-body text-label font-semibold text-muted mb-1">What is shadow AI?</div>
        <p className="font-body text-label text-muted leading-relaxed">
          Unauthorized use of AI tools — ChatGPT, Midjourney, browser plugins — by employees for plant tasks without IT/OT approval.
          IBM 2025: 20% of data breaches involved shadow AI. Data submitted to external tools may be stored, indexed, or used for model training.
        </p>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-rule2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
          <span className="display-num text-sub font-bold tabular-nums text-danger">{active}</span>
          <span className="font-body text-label text-muted">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
          <span className="display-num text-sub font-bold tabular-nums text-ok">{resolved}</span>
          <span className="font-body text-label text-muted">Resolved</span>
        </div>
      </div>

      {shadowAIEvents.map(e => <ShadowEventCard key={e.id} event={e} />)}

      {/* Policy gap callout */}
      <div className="mx-5 my-4 px-4 py-3 border-l-2 border-l-danger bg-danger/[0.04]">
        <div className="flex items-start gap-2">
          <AlertTriangle size={11} strokeWidth={2} className="text-danger flex-shrink-0 mt-px" />
          <div>
            <div className="font-body text-label font-semibold text-danger mb-1">No AI governance policy in place</div>
            <p className="font-body text-label text-muted leading-snug">
              Employees have no documented guidance on which AI tools are permitted, what data can be submitted, or how to report a shadow AI incident.
              This is the root cause of both detected events. See OT Hygiene check h19 for remediation steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SecurityIQ() {
  const [section, setSection] = useState('hygiene')

  const staleModel = modelRegistry.find(m => m.validationStatus === 'stale')
  const activeIncident = shadowAIEvents.find(e => e.status === 'investigating')

  const narrativeParts = [
    `${securityPosture.openFindings} findings open`,
    activeIncident ? 'Shadow AI investigation active' : null,
    staleModel ? `${staleModel.name} validation overdue ${staleModel.staleDays} days` : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <SceneHeader
        title="Security"
        subtitle={`AI governance and OT access posture · Last assessed ${securityPosture.lastAssessed}`}
        narrative={narrativeParts.join(' · ')}
        tone="danger"
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left rail */}
        <aside className="flex flex-col border-r border-rule w-[264px] flex-shrink-0 overflow-y-auto bg-stone2">
          <PostureInstrument posture={securityPosture} />
          <SectionNav
            active={section}
            onChange={setSection}
            posture={securityPosture}
            modelRegistry={modelRegistry}
            shadowAIEvents={shadowAIEvents}
          />
        </aside>

        {/* Right workspace */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {section === 'hygiene'  && <HygieneWorkspace />}
          {section === 'models'   && <ModelRegistryWorkspace />}
          {section === 'audit'    && <AccessAuditWorkspace />}
          {section === 'shadow'   && <ShadowAIWorkspace />}
        </div>
      </div>
    </div>
  )
}
