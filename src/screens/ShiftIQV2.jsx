import { useState } from 'react'
import { Brain, Check, Users, TrendingUp, TrendingDown, Eye, RefreshCw } from 'lucide-react'
import { Btn, AnimatedScore, SlidePanel, StatusPill } from '../components/UI'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { crew, agentEvents } from '../data/shift'
import { shiftData } from '../data'
import { driftSignals } from '../data/driftWatch'

const sColor = (s) => s >= 75 ? 'var(--color-danger)' : s >= 60 ? 'var(--color-warn)' : 'var(--color-ok)'
const sLabel = (s) => s >= 75 ? 'At risk' : s >= 60 ? 'Watch' : 'Clear'
const atmoGradient = (s) => s >= 75
  ? 'radial-gradient(ellipse 55% 100% at 8% 60%, rgba(222,108,78,0.13) 0%, transparent 65%)'
  : s >= 60
  ? 'radial-gradient(ellipse 55% 100% at 8% 60%, rgba(201,142,42,0.13) 0%, transparent 65%)'
  : 'radial-gradient(ellipse 55% 100% at 8% 60%, rgba(95,168,119,0.13) 0%, transparent 65%)'

// ── Score factors ──────────────────────────────────────────────────────────────
const SCORE_FACTORS = [
  { label: 'Staffing cert mismatch',  contribution: 18, tone: 'danger', state: 'Reyes (L1) — Sauce Dosing requires L2', confidence: 'HIGH',   source: 'Cert records · direct' },
  { label: 'Allergen changeover log', contribution: 13, tone: 'danger', state: 'Unsigned — production start blocked',   confidence: 'HIGH',   source: 'Checklist system · direct' },
  { label: 'Startup checklists',      contribution:  9, tone: 'warn',   state: '7 of 13 signed · 4 overdue',           confidence: 'HIGH',   source: 'Checklist system · direct' },
  { label: 'Sensor A-7 variance',     contribution:  6, tone: 'warn',   state: 'Micro-variance 4/5 · bearing suspect',  confidence: 'MEDIUM', source: 'SCADA · 3-hr rolling' },
  { label: 'CCP-1 & CCP-3',          contribution:  0, tone: 'ok',     state: 'Both within limits',                   confidence: 'HIGH',   source: 'Sensor verified · direct' },
  { label: 'SCADA · Oven B',          contribution:  0, tone: 'warn',   state: 'Stale — model accuracy reduced',       confidence: 'LOW',    source: 'Last reading 2h 14m ago' },
]

// ── Animations ─────────────────────────────────────────────────────────────────
const V2_CSS = `
  @keyframes v2AtmoPulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.10; } }
  @keyframes v2LiveDot   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
  @keyframes v2RowIn     { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .v2-atmo   { animation: v2AtmoPulse 9s ease-in-out infinite; }
  .v2-live   { animation: v2LiveDot 2.4s ease-in-out infinite; }
  .v2-row-in { animation: v2RowIn 320ms cubic-bezier(0.16,1,0.3,1) both; }
`

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-rule" />
}

// ── Finding card ──────────────────────────────────────────────────────────────
function FindingCard({ f, index, onAct, onDelegate }) {
  const [dismissed, setDismissed] = useState(false)
  const [acted, setActed] = useState(false)
  const [delegating, setDelegating] = useState(false)
  const [delegatedTo, setDelegatedTo] = useState(null)

  const leftCls = f.urgency === 'danger' ? 'border-l-danger' : 'border-l-warn'

  if (dismissed) return null

  const handleDelegate = (op) => {
    setDelegating(false)
    setDelegatedTo(op)
    onDelegate?.(op, f.title)
  }

  return (
    <div
      className={`v2-row-in bg-stone2 border border-rule border-l-[3px] ${leftCls} mb-2.5`}
      style={{ animationDelay: `${index * 90}ms`, opacity: acted ? 0.45 : 1, transition: 'opacity 400ms ease' }}>

      <div className="px-4 pt-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="font-display font-semibold text-base text-ink leading-snug">{f.title}</div>
          {f.recurring && (
            <Link to={`/capa?finding=${f.id}`} className="flex-shrink-0 mt-px" title="Open root cause investigation in CAPA">
              <StatusPill tone="warn"><RefreshCw size={9} strokeWidth={2} className="inline mr-1 -mt-px" />Recurring</StatusPill>
            </Link>
          )}
        </div>
        <p className="font-display text-body text-ink leading-relaxed m-0">{f.desc}</p>
      </div>

      <div className="px-4 py-2 border-y border-rule2">
        <span className="font-body text-label text-muted">{f.evidence}</span>
      </div>

      {acted ? (
        <div className="px-4 py-2.5 flex items-center gap-2">
          <Check size={11} className="text-ok" />
          <span className="font-body text-label text-ok">{f.consequence}</span>
        </div>
      ) : delegating ? (
        <div className="px-4 py-3 flex gap-2 flex-wrap items-center">
          <span className="font-body text-micro text-muted">Assign to:</span>
          {(f.delegateTo || []).map(op => (
            <Btn key={op} variant="secondary" onClick={() => handleDelegate(op)} className="!py-1 !px-2.5 !min-h-0">{op}</Btn>
          ))}
          <Btn variant="ghost" onClick={() => setDelegating(false)} className="!py-1 !min-h-0">Cancel</Btn>
        </div>
      ) : delegatedTo ? (
        <div className="px-4 py-3 flex items-center gap-2">
          <Check size={11} className="text-ok" />
          <span className="font-body text-label text-ok">Assigned to {delegatedTo} — task in their dashboard</span>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2">
          <Btn variant="primary" onClick={() => { setActed(true); onAct?.(f.id) }}>{f.actions?.[0]}</Btn>
          {f.actions?.[1] && <Btn variant="secondary" onClick={() => setDismissed(true)}>{f.actions[1]}</Btn>}
          {(f.delegateTo?.length > 0) && (
            <Btn variant="ghost" onClick={() => setDelegating(true)} className="ml-auto !px-2 !min-h-0 flex items-center gap-1 whitespace-nowrap">
              <Users size={10} strokeWidth={2} />Assign
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}

// ── Operator row ──────────────────────────────────────────────────────────────
const OP_CERT = { 'D. Kowalski': 100, 'A. Martinez': 85, 'C. Reyes': 72, 'P. Okonkwo': 91 }

function OperatorRow({ op, index, total }) {
  const cert = OP_CERT[op.name] || 80
  const certColor = cert >= 80 ? 'var(--color-ok)' : 'var(--color-warn)'
  const certCls   = cert >= 80 ? 'text-ok' : 'text-warn'

  return (
    <div className={`flex items-center gap-4 px-4 py-[11px] ${index < total - 1 ? 'border-b border-rule2' : ''} ${op.flag ? 'bg-warn/[0.035]' : ''}`}>
      <div className="min-w-[128px]">
        <div className={`font-body font-medium text-body ${op.flag ? 'text-warn' : 'text-ink'}`}>{op.name}</div>
        <div className="font-body text-micro text-muted mt-[3px]">{op.role}</div>
      </div>
      <div className="flex-1 flex items-center gap-2.5">
        <div className="flex-1 h-0.5 bg-rule">
          <div style={{ height: '100%', width: `${cert}%`, background: certColor, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
        <span className={`font-body text-label min-w-[26px] text-right ${certCls}`}>{cert}%</span>
      </div>
      {op.flag && <StatusPill tone="warn">Cert gap</StatusPill>}
    </div>
  )
}

// ── Timeline entry ────────────────────────────────────────────────────────────
function TimelineEntry({ ev, index, total }) {
  const isNow    = ev.dotType === 'now'
  const dotColor = ev.dotType === 'now' ? 'var(--color-signal)' : ev.dotType === 'warn' ? 'var(--color-warn)' : 'var(--color-muted)'
  const opacity  = Math.max(1 - index * 0.2, 0.3)
  const deltaC   = ev.deltaColor === 'text-danger' ? 'var(--color-danger)' : 'var(--color-warn)'

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, opacity }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <span className="font-body text-micro text-muted" style={{ marginBottom: 6, textAlign: 'right', width: '100%' }}>{ev.time}</span>
        <div className={isNow ? 'v2-live' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        {index < total - 1 && <div style={{ flex: 1, width: 1, background: 'var(--color-rule-2)', marginTop: 5, minHeight: 14 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div
          className={`font-display text-body leading-relaxed ${isNow ? 'text-ink' : 'text-muted'}`}
          dangerouslySetInnerHTML={{ __html: ev.text }}
        />
        {ev.delta && (
          <span className="font-body text-micro" style={{ marginTop: 4, display: 'block', color: deltaC }}>{ev.delta}</span>
        )}
      </div>
    </div>
  )
}

// ── Score explainer ────────────────────────────────────────────────────────────
function ScoreExplainer({ score }) {
  const baseScore = score - SCORE_FACTORS.reduce((s, f) => s + f.contribution, 0)
  return (
    <div>
      <div className="flex items-baseline gap-2.5 px-5 py-2 border-b border-rule2">
        <span className="font-body text-body text-muted min-w-[28px] text-right">{baseScore}</span>
        <span className="font-body text-label text-muted">Base · no shift conditions</span>
      </div>
      {SCORE_FACTORS.map((f, i) => {
        const valColor  = f.tone === 'danger' ? 'var(--color-danger)' : f.tone === 'warn' ? 'var(--color-warn)' : 'var(--color-muted)'
        const confColor = f.confidence === 'HIGH' ? 'var(--color-ok)' : f.confidence === 'MEDIUM' ? 'var(--color-warn)' : 'var(--color-muted)'
        return (
          <div key={i} className={`flex items-start gap-2.5 px-5 py-[9px] ${i < SCORE_FACTORS.length - 1 ? 'border-b border-rule2' : ''} ${f.tone === 'danger' ? 'bg-danger/[0.024]' : ''}`}>
            <span className="font-body font-bold text-body min-w-[28px] text-right flex-shrink-0" style={{ color: f.contribution > 0 ? valColor : 'var(--color-muted)' }}>
              {f.contribution > 0 ? `+${f.contribution}` : '—'}
            </span>
            <div className="flex-1">
              <div className="font-body font-medium text-label mb-0.5" style={{ color: f.contribution > 0 ? 'var(--color-ink)' : 'var(--color-muted)' }}>{f.label}</div>
              <div className="font-body text-micro text-muted">{f.state}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: confColor, flexShrink: 0 }} />
                <span className="font-body text-micro text-muted">{f.confidence} · {f.source}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Trend Watch ───────────────────────────────────────────────────────────────
function TrendWatch() {
  const { acknowledgedDrifts, acknowledgeDrift } = useAppState()
  const visible = driftSignals.filter(s => !acknowledgedDrifts.has(s.id))
  if (visible.length === 0) return null
  return (
    <>
      <div className="px-6 pt-[18px]">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={10} strokeWidth={2} className="text-context" />
          <span className="font-body text-micro text-context">Trend watch · {visible.length} sub-threshold</span>
        </div>
        {visible.map((s, i) => {
          const pct = Math.round((s.consecutiveBatches / s.thresholdBatches) * 100)
          const DirIcon = s.direction === 'up' ? TrendingUp : TrendingDown
          return (
            <div key={s.id} className="v2-row-in bg-stone2 border border-rule border-l-[3px] border-l-context mb-2"
              style={{ animationDelay: `${i * 50}ms`, padding: '12px 14px' }}>
              <div className="flex items-start gap-2 mb-1.5">
                <DirIcon size={10} strokeWidth={2} className="text-context flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-label text-ink leading-snug">{s.signal}</div>
                  <div className="font-body text-micro text-muted mt-0.5">{s.source} · {s.consecutiveBatches} consecutive batches</div>
                </div>
              </div>
              <div className="font-body text-micro text-muted mb-2 leading-snug" style={{ paddingLeft: 18 }}>{s.currentReading} · {s.note}</div>
              <div style={{ paddingLeft: 18 }}>
                <div className="h-0.5 bg-rule rounded-sm mb-2">
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-context)', borderRadius: 1, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-micro text-muted">{s.thresholdBatches - s.consecutiveBatches} batches from threshold</span>
                  <button type="button" onClick={() => acknowledgeDrift(s.id)}
                    className="font-body text-micro text-context hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer p-0">
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="h-px bg-rule mx-6 mt-3" />
    </>
  )
}

// ── Supervisor: My queue ──────────────────────────────────────────────────────
function SupervisorQueue({ findings, signOffRequests, setSignOffRequests, logActivity, supervisor }) {
  const actNow     = findings.filter(f => f.urgency === 'danger')
  const watchItems = findings.filter(f => f.urgency === 'warn')

  const handleApprove = (req) => {
    setSignOffRequests(p => p.filter(r => r.id !== req.id))
    logActivity({ actor: supervisor, action: `Approved sign-off: ${req.finding}`, item: req.operator, type: 'intervention' })
  }
  const handleDecline = (req) => {
    setSignOffRequests(p => p.filter(r => r.id !== req.id))
    logActivity({ actor: supervisor, action: `Declined sign-off: ${req.finding}`, item: req.operator, type: 'intervention' })
  }

  return (
    <div className="flex-1 overflow-y-auto page-rise border-r border-rule">
      <div className="px-6 pt-5">
        <div className="font-body text-micro text-muted mb-3">Act now · {actNow.length} item{actNow.length !== 1 ? 's' : ''}</div>
        {actNow.map((f, i) => (
          <div key={f.id} className="v2-row-in bg-stone2 border border-rule border-l-[3px] border-l-danger mb-2 px-4 py-3.5"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-body text-micro px-1.5 py-0.5 text-danger bg-danger/[0.078] border border-danger/20">Blocking</span>
              <span className="font-body text-micro text-muted">{f.source}</span>
            </div>
            <div className="font-body font-medium text-body text-ink leading-[1.4] mb-2">{f.title}</div>
            <div className="font-body text-micro text-muted leading-[1.5] mb-3">{f.desc}</div>
            <div className="flex items-center gap-2">
              <Btn variant="primary" onClick={() => logActivity({ actor: supervisor, action: `Resolved: ${f.title}`, item: f.id, type: 'intervention' })}>Mark resolved</Btn>
              <Btn variant="secondary" onClick={() => logActivity({ actor: supervisor, action: `Escalated: ${f.title}`, item: f.id, type: 'escalation' })}>Escalate</Btn>
            </div>
          </div>
        ))}
        {watchItems.length > 0 && (
          <div className="mt-4">
            <div className="font-body text-micro text-muted mb-3">Watch · {watchItems.length} items</div>
            {watchItems.map((f, i) => (
              <div key={f.id} className="v2-row-in flex items-start gap-3 bg-stone2 border border-rule border-l-[3px] border-l-warn mb-1.5 px-4 py-3"
                style={{ animationDelay: `${(actNow.length + i) * 50}ms` }}>
                <div className="flex-1">
                  <div className="font-body text-micro text-muted mb-[3px]">{f.source}</div>
                  <div className="font-body font-medium text-label text-ink">{f.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Divider />
      <div className="px-6 pt-[18px] pb-6">
        <div className="font-body text-micro text-muted mb-3">Sign-off requested · {signOffRequests.length} pending</div>
        {signOffRequests.length === 0 ? (
          <p className="font-body text-label text-muted">No pending sign-offs — operators are good to go.</p>
        ) : signOffRequests.map((req, i) => (
          <div key={req.id} className="v2-row-in bg-stone2 border border-rule border-l-[3px] border-l-ok mb-2 px-4 py-3.5"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="font-body font-medium text-body text-ink mb-1">{req.operator}</div>
            <div className="font-body text-micro text-muted mb-3">{req.finding} · {req.station} · {req.requestedAt}</div>
            <div className="flex items-center gap-2">
              <Btn variant="primary" onClick={() => handleApprove(req)}>Approve</Btn>
              <Btn variant="secondary" onClick={() => handleDecline(req)}>Decline</Btn>
            </div>
          </div>
        ))}
      </div>
      <TrendWatch />
    </div>
  )
}

// ── Supervisor: My team ───────────────────────────────────────────────────────
function SupervisorTeam({ taskAssignments, escalatedToDirector, setEscalatedToDirector, logActivity, supervisor }) {
  const handleEscalate = () => {
    setEscalatedToDirector(true)
    logActivity({ actor: supervisor, action: 'Escalated shift situation to director J. Crocker', item: 'Line 4 AM', type: 'escalation' })
  }

  const allTasks = Object.entries(taskAssignments).flatMap(([operator, tasks]) =>
    tasks.map(t => ({ ...t, operator }))
  )

  return (
    <div className="w-[304px] flex-shrink-0 overflow-y-auto bg-stone flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <div className="font-body text-micro text-muted mb-3">My team · {crew.length} operators</div>
        <div className="border border-rule overflow-hidden">
          {crew.map((op, i) => <OperatorRow key={op.name} op={op} index={i} total={crew.length} />)}
        </div>
      </div>
      <Divider />
      <div className="px-5 pt-[18px] pb-4">
        <div className="font-body text-micro text-muted mb-3">Task assignments · {allTasks.length}</div>
        {allTasks.length === 0 ? (
          <p className="font-body text-label text-muted">No tasks assigned this shift.</p>
        ) : allTasks.map((t, i) => (
          <div key={t.id} className={`flex items-start gap-2.5 py-[9px] ${i < allTasks.length - 1 ? 'border-b border-rule2' : ''}`}>
            <div className="flex-1">
              <div className={`font-body font-medium text-label ${t.done ? 'text-ok' : 'text-ink'}`}>{t.operator}</div>
              <div className="font-body text-micro text-muted">{t.label}</div>
            </div>
            <span className="font-body text-micro flex-shrink-0 text-muted">{t.dueTime}</span>
          </div>
        ))}
      </div>
      <Divider />
      <div className="px-5 pt-[18px] pb-5 border-l-[3px] border-l-context bg-context/[0.025]">
        <div className="font-body font-semibold text-body text-ink mb-1.5">Escalate to director</div>
        <div className="font-body text-label text-muted mb-3.5 leading-relaxed">
          If this situation is beyond your shift authority, escalate to J. Crocker with context.
        </div>
        {escalatedToDirector ? (
          <div className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-ok flex-shrink-0" />
            <span className="font-body text-label text-ok">Escalated to J. Crocker</span>
          </div>
        ) : (
          <Btn variant="primary" onClick={handleEscalate}>Escalate to J. Crocker</Btn>
        )}
      </div>
    </div>
  )
}

// ── Before strip ──────────────────────────────────────────────────────────────
const BEFORE_CONTEXT = {
  l4:      { oee: '82%', shifts: 28, accuracy: 82, baseScore: 54, normal: 'Allergen log unsigned but changeover not yet started · Sensor A-7 variance count was 1 at shift start' },
  l6:      { oee: '88%', shifts: 22, accuracy: 91, baseScore: 42, normal: 'All checklists cleared at T+30 · Staffing 89% certified — no gaps at shift start' },
  default: { oee: '84%', shifts: 20, accuracy: 85, baseScore: 55, normal: 'Conditions within normal range at shift start' },
}

function BeforeStrip({ lineLabel }) {
  const lineId = lineLabel?.toLowerCase().includes('line 4') ? 'l4'
    : lineLabel?.toLowerCase().includes('line 6') ? 'l6'
    : null
  const ctx = BEFORE_CONTEXT[lineId] ?? BEFORE_CONTEXT.default
  return (
    <div className="flex items-start gap-3 px-6 py-2 border-t border-rule2 bg-context/[0.03]">
      <span className="font-body text-micro text-context flex-shrink-0 mt-px">Before ·</span>
      <p className="font-body text-micro text-muted leading-relaxed flex-1 m-0">
        Score was {ctx.baseScore} at shift start — within normal range · {ctx.normal}
      </p>
      <span className="font-body text-micro text-muted flex-shrink-0 tabular-nums">
        Avg OEE {ctx.oee} · {ctx.shifts} shifts · {ctx.accuracy}% model accuracy
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShiftIQV2({ score = 78, lineLabel = 'Line 4 · AM Shift', supervisor = 'D. Kowalski', plant = 'Salina KS', isSupervisorView = false }) {
  const { checklistSigned, allergenOverride, taskAssignments, setTaskAssignments, logActivity,
    signOffRequests, setSignOffRequests, escalatedToDirector, setEscalatedToDirector } = useAppState()
  const [scoreOverlayOpen, setScoreOverlayOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)

  const signedCount  = 7 + Object.keys(checklistSigned).length
  const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
  const riskC        = sColor(score)
  const checklistPct = Math.round((signedCount / 13) * 100)
  const richFindings = shiftData.findings

  const statement = score >= 75
    ? 'Three signals compounding. Checklist and staffing gaps account for 71% of risk. Act within 28 minutes.'
    : score >= 60
    ? 'Two signals in watch state. Resolve COA gap before handoff. Sensor A-7 at count 3 of 5 threshold.'
    : 'Shift running clean. No blocking conditions. Maintain certification coverage through handoff.'

  const handleDelegate = (operatorName, findingTitle) => {
    setTaskAssignments(prev => ({
      ...prev,
      [operatorName]: [...(prev[operatorName] || []), { label: findingTitle, dueTime: 'Before handoff', done: false, id: Date.now() }],
    }))
    logActivity({ actor: supervisor, action: `Delegated task to ${operatorName}: ${findingTitle}`, item: findingTitle, type: 'intervention' })
  }

  return (
    <>
      <style>{V2_CSS}</style>

      {scoreOverlayOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setScoreOverlayOpen(false)} />
          <div className="fixed z-50 plant-drop-in" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 360 }}>
            <div className="overflow-hidden bg-stone2 border border-rule" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-rule">
                <div className="flex items-center gap-2">
                  <Brain size={12} className="text-muted" />
                  <span className="font-body font-medium text-ink text-body">Why {score}?</span>
                </div>
                <button type="button" onClick={() => setScoreOverlayOpen(false)}
                  className="font-body text-muted text-label hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-1.5 py-0.5">✕</button>
              </div>
              <ScoreExplainer score={score} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col h-full overflow-hidden bg-stone text-ink">

        <header className="flex-shrink-0 relative overflow-hidden border-b border-rule"
          style={{ background: 'linear-gradient(180deg, var(--color-stone-2) 0%, var(--color-stone) 100%)' }}>
          <div className="v2-atmo absolute inset-0 pointer-events-none" style={{ background: atmoGradient(score) }} />

          <div className="flex items-center justify-between px-6 pt-3.5 relative">
            <div className="flex items-center gap-3">
              <span className="font-body text-label text-signal">{lineLabel}</span>
              <div className="w-px h-[11px] bg-rule" />
              <span className="font-body text-label text-muted">{plant}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="v2-live w-[5px] h-[5px] rounded-full bg-signal" />
              <span className="font-body text-label text-muted">06:42 · live</span>
            </div>
          </div>

          <div className="flex items-center gap-8 px-6 py-[18px] relative">
            <div className="flex-shrink-0">
              <div className="display-num text-score leading-none" style={{ color: riskC }}>
                <AnimatedScore value={score} effect="glow" hero />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: riskC }} />
                <span className="font-body text-micro" style={{ color: riskC }}>{sLabel(score)}</span>
                <button type="button" onClick={() => setScoreOverlayOpen(true)}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity ml-1.5 bg-transparent border-none cursor-pointer p-0">
                  <Brain size={10} className="text-muted" />
                  <span className="font-body text-micro text-muted">Why?</span>
                </button>
              </div>
            </div>

            <div className="border-l border-rule pl-7 max-w-[400px] flex-1">
              <p className="font-display text-base text-ink leading-relaxed m-0 mb-3">{statement}</p>
              <div className="flex items-center gap-5">
                <div>
                  <span className="font-body text-label text-muted">Scan interval</span>
                  <span className="font-body text-label text-signal ml-[5px]">4 min</span>
                </div>
                <div>
                  <span className="font-body text-label text-muted">Score trend</span>
                  <span className="font-body text-label text-danger ml-[5px]">↑ +4 since 06:30</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-auto" style={{ opacity: 0.65 }}>
              <svg width="90" height="36" viewBox="0 0 90 36" aria-hidden="true">
                <polyline points="0,30 15,25 30,21 45,18 60,14 75,10 90,7" fill="none" stroke={riskC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="90" cy="7" r="3" fill={riskC} />
              </svg>
              <span className="font-body text-micro text-muted block text-center mt-1">06:12 → now</span>
            </div>
          </div>

          <div className="flex items-center gap-6 px-6 py-[9px] border-t border-rule2 relative">
            {[
              { label: 'SCADA · Oven B', healthy: false },
              { label: 'MES · Schedule', healthy: true },
              { label: 'HR · Roster',    healthy: true },
              { label: 'Checklists',     healthy: true },
            ].map((sig, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${sig.healthy ? 'bg-ok' : 'bg-warn'}`} />
                <span className={`font-body text-label ${sig.healthy ? 'text-muted' : 'text-warn'}`}>{sig.label}</span>
              </div>
            ))}
          </div>

          <BeforeStrip lineLabel={lineLabel} />
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {isSupervisorView ? (
            <>
              <SupervisorQueue findings={richFindings} signOffRequests={signOffRequests} setSignOffRequests={setSignOffRequests} logActivity={logActivity} supervisor={supervisor} />
              <SupervisorTeam taskAssignments={taskAssignments} escalatedToDirector={escalatedToDirector} setEscalatedToDirector={setEscalatedToDirector} logActivity={logActivity} supervisor={supervisor} />
            </>
          ) : (
            <>
            <div className="flex-1 overflow-y-auto border-r border-rule">
              <div className="px-6 pt-4 border-b border-rule2">
                <div className="flex items-start gap-2.5 pb-4">
                  <div className="w-[5px] h-[5px] rounded-full bg-context flex-shrink-0 mt-[5px]" />
                  <p className="font-body text-label text-muted leading-relaxed m-0">
                    Shift opened at 06:12 with score 54 — within normal range.
                    Risk built 54 → 78 over 30 minutes as three signals compounded:
                    checklist lag, a cert mismatch at Sauce Dosing, and Sensor A-7 variance.
                    All three are within supervisor authority to resolve before handoff.
                  </p>
                </div>
              </div>

              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-body text-micro text-muted">Intelligence · {richFindings.length} findings</div>
                  <button type="button" onClick={() => setTimelineOpen(true)}
                    className="font-body text-micro text-muted hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer p-0">
                    Agent timeline
                  </button>
                </div>
                {richFindings.map((f, i) => (
                  <FindingCard key={f.id} f={f} index={i}
                    onAct={(id) => logActivity({ actor: supervisor, action: `Acted on finding: ${f.title}`, item: id, type: 'intervention' })}
                    onDelegate={handleDelegate}
                  />
                ))}
              </div>
            </div>

            <div className="w-[304px] flex-shrink-0 overflow-y-auto bg-stone flex flex-col">
              <div className="px-5 pt-5 pb-4">
                <div className="font-body text-micro text-muted mb-3">Crew · {crew.length} operators</div>
                <div className="border border-rule overflow-hidden">
                  {crew.map((op, i) => <OperatorRow key={op.name} op={op} index={i} total={crew.length} />)}
                </div>
              </div>

              <Divider />

              <div className="px-5 pt-[18px] pb-6">
                <div className="font-body text-micro text-muted mb-3">Startup checklists</div>
                <div className="flex items-center gap-4 px-3.5 py-3 bg-stone2 border border-rule">
                  <div className="flex-shrink-0">
                    <span className="display-num text-score" style={{ color: signedCount < 11 ? 'var(--color-warn)' : 'var(--color-ok)' }}>{signedCount}</span>
                    <span className="font-body text-body text-muted ml-1.5">/ 13</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-[3px] bg-rule mb-1.5">
                      <div style={{ height: '100%', width: `${checklistPct}%`, background: signedCount < 11 ? 'var(--color-warn)' : 'var(--color-ok)', transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                    <span className="font-body text-label text-muted">{checklistPct}% complete · 4 overdue</span>
                  </div>
                </div>
                {!allergenSigned && (
                  <div className="mt-2 px-2.5 py-1.5 text-danger bg-danger/[0.078] border border-danger/20">
                    <span className="font-body text-micro">ALLERGEN LOG UNSIGNED</span>
                  </div>
                )}
                <p className="font-body text-label text-context leading-relaxed mt-2.5 pl-0.5 m-0">
                  4 overdue items at T+42 correlates with 18% elevated scrap rate on comparable runs.
                </p>
              </div>
            </div>

            {timelineOpen && (
              <SlidePanel
                onClose={() => setTimelineOpen(false)}
                title="Agent timeline"
                subtitle="This shift · Line 4"
                maxWidth="400px"
              >
                {agentEvents.map((ev, i) => (
                  <TimelineEntry key={i} ev={ev} index={i} total={agentEvents.length} />
                ))}
              </SlidePanel>
            )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
