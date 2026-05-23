import { useState } from 'react'
import { Brain, Check, Users, TrendingUp, TrendingDown, Eye, RefreshCw } from 'lucide-react'
import { Btn, AnimatedScore, SlidePanel, StatusPill } from '../components/UI'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { crew, agentEvents } from '../data/shift'
import { shiftData } from '../data'
import { driftSignals } from '../data/driftWatch'

// ── Color palette — design tokens ──────────────────────────────────────────────
const P = {
  bg:       '#0B0F18',
  surface:  '#131A26',
  elevated: '#1B2538',
  border:   '#263042',
  border2:  '#1A2335',
  bone:     '#EDE4CB',
  cream:    '#9B9070',
  dim:      '#4A5D74',
  blue:     '#4B9CE4',
  cyan:     '#3BBFDA',
  clay:     '#C4844E',
  amber:    '#C98E2A',
  sage:     '#5FA877',
  rust:     '#DE6C4E',
}

const sColor = (s) => s >= 75 ? P.rust : s >= 60 ? P.amber : P.sage
const sLabel = (s) => s >= 75 ? 'At risk' : s >= 60 ? 'Watch' : 'Clear'

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
  return <div style={{ height: 1, background: P.border }} />
}

// ── Finding card — precision + narrative + delegation + pattern ───────────────
function FindingCard({ f, index, onAct, onDelegate }) {
  const [dismissed, setDismissed] = useState(false)
  const [acted, setActed] = useState(false)
  const [delegating, setDelegating] = useState(false)
  const [delegatedTo, setDelegatedTo] = useState(null)

  const urgencyColor = f.urgency === 'danger' ? P.rust : P.amber

  if (dismissed) return null

  const handleDelegate = (op) => {
    setDelegating(false)
    setDelegatedTo(op)
    onDelegate?.(op, f.title)
  }

  return (
    <div
      className="v2-row-in"
      style={{
        background: P.surface,
        border: `1px solid ${P.border}`,
        borderLeft: `3px solid ${urgencyColor}`,
        marginBottom: 10,
        animationDelay: `${index * 90}ms`,
        opacity: acted ? 0.45 : 1,
        transition: 'opacity 400ms ease',
      }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="font-display font-semibold text-base text-ink leading-snug">
            {f.title}
          </div>
          {f.recurring && (
            <Link to={`/capa?finding=${f.id}`} className="flex-shrink-0 mt-px" title="Open root cause investigation in CAPA">
              <StatusPill tone="warn"><RefreshCw size={9} strokeWidth={2} className="inline mr-1 -mt-px" />Recurring</StatusPill>
            </Link>
          )}
        </div>
        <p className="font-display text-body text-ink leading-relaxed" style={{ margin: 0 }}>
          {f.desc}
        </p>
      </div>

      {/* Evidence */}
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${P.border2}`, borderBottom: `1px solid ${P.border2}` }}>
        <span className="font-body text-label text-muted">{f.evidence}</span>
      </div>

      {/* Actions row */}
      {acted ? (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={11} color={P.sage} />
          <span className="font-body text-label" style={{ color: P.sage }}>{f.consequence}</span>
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
          <Check size={11} color={P.sage} />
          <span className="font-body text-label" style={{ color: P.sage }}>Assigned to {delegatedTo} — task in their dashboard</span>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2">
          <Btn variant="primary" onClick={() => { setActed(true); onAct?.(f.id) }}>{f.actions?.[0]}</Btn>
          {f.actions?.[1] && (
            <Btn variant="secondary" onClick={() => setDismissed(true)}>{f.actions[1]}</Btn>
          )}
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
  const certC = cert >= 80 ? P.sage : P.amber

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px',
      borderBottom: index < total - 1 ? `1px solid ${P.border2}` : 'none',
      background: op.flag ? `${P.amber}09` : 'transparent',
    }}>
      <div style={{ minWidth: 128 }}>
        <div className="font-body font-medium text-body" style={{ color: op.flag ? P.amber : P.bone }}>{op.name}</div>
        <div className="font-body text-micro text-muted" style={{ marginTop: 3 }}>{op.role}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 2, background: P.border }}>
          <div style={{ height: '100%', width: `${cert}%`, background: certC, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
        <span className="font-body text-label" style={{ minWidth: 26, textAlign: 'right', color: certC }}>{cert}%</span>
      </div>
      {op.flag && (
        <span className="font-body text-micro flex-shrink-0 px-1.5 py-0.5" style={{ color: P.amber, background: `${P.amber}18`, border: `1px solid ${P.amber}40` }}>
          Cert gap
        </span>
      )}
    </div>
  )
}

// ── Timeline entry ────────────────────────────────────────────────────────────
function TimelineEntry({ ev, index, total }) {
  const isNow = ev.dotType === 'now'
  const dotC = ev.dotType === 'now' ? P.cyan : ev.dotType === 'warn' ? P.amber : P.dim
  const opacity = Math.max(1 - index * 0.2, 0.3)
  const deltaC = ev.deltaColor === 'text-danger' ? P.rust : P.amber

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, opacity }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <span className="font-body text-micro text-muted" style={{ marginBottom: 6, textAlign: 'right', width: '100%' }}>{ev.time}</span>
        <div className={isNow ? 'v2-live' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: dotC, flexShrink: 0 }} />
        {index < total - 1 && <div style={{ flex: 1, width: 1, background: P.border2, marginTop: 5, minHeight: 14 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div
          className="font-display text-body leading-relaxed"
          style={{ color: isNow ? P.bone : P.cream }}
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
      <div className="flex items-baseline gap-2.5" style={{ padding: '8px 20px', borderBottom: `1px solid ${P.border2}` }}>
        <span className="font-body text-body text-muted" style={{ minWidth: 28, textAlign: 'right' }}>{baseScore}</span>
        <span className="font-body text-label text-muted">Base · no shift conditions</span>
      </div>
      {SCORE_FACTORS.map((f, i) => {
        const valC = f.tone === 'danger' ? P.rust : f.tone === 'warn' ? P.amber : P.dim
        const confC = f.confidence === 'HIGH' ? P.sage : f.confidence === 'MEDIUM' ? P.amber : P.dim
        return (
          <div key={i} style={{
            padding: '9px 20px', borderBottom: i < SCORE_FACTORS.length - 1 ? `1px solid ${P.border2}` : 'none',
            background: f.tone === 'danger' ? `${P.rust}06` : 'transparent',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span className="font-body font-bold text-body" style={{ color: f.contribution > 0 ? valC : P.dim, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
              {f.contribution > 0 ? `+${f.contribution}` : '—'}
            </span>
            <div style={{ flex: 1 }}>
              <div className="font-body font-medium text-label" style={{ color: f.contribution > 0 ? P.bone : P.dim, marginBottom: 2 }}>{f.label}</div>
              <div className="font-body text-micro text-muted">{f.state}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: confC, flexShrink: 0 }} />
                <span className="font-body text-micro text-muted">{f.confidence} · {f.source}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Trend Watch — sub-threshold drifts, below alert level ────────────────────
function TrendWatch() {
  const { acknowledgedDrifts, acknowledgeDrift } = useAppState()
  const visible = driftSignals.filter(s => !acknowledgedDrifts.has(s.id))
  if (visible.length === 0) return null
  return (
    <>
      <div style={{ padding: '18px 24px 0' }}>
        <div className="flex items-center gap-2 mb-3">
          <Eye size={10} strokeWidth={2} style={{ color: P.clay }} />
          <span className="font-body text-micro" style={{ color: P.clay }}>Trend watch · {visible.length} sub-threshold</span>
        </div>
        {visible.map((s, i) => {
          const pct = Math.round((s.consecutiveBatches / s.thresholdBatches) * 100)
          const DirIcon = s.direction === 'up' ? TrendingUp : TrendingDown
          return (
            <div key={s.id} className="v2-row-in" style={{
              animationDelay: `${i * 50}ms`, padding: '12px 14px', marginBottom: 8,
              background: P.surface, border: `1px solid ${P.border}`,
              borderLeft: `3px solid ${P.clay}`,
            }}>
              <div className="flex items-start gap-2 mb-1.5">
                <DirIcon size={10} strokeWidth={2} style={{ color: P.clay, marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-label leading-snug" style={{ color: P.bone }}>{s.signal}</div>
                  <div className="font-body text-micro text-muted mt-0.5">{s.source} · {s.consecutiveBatches} consecutive batches</div>
                </div>
              </div>
              <div className="font-body text-micro text-muted mb-2 leading-snug" style={{ paddingLeft: 18 }}>{s.currentReading} · {s.note}</div>
              <div style={{ paddingLeft: 18 }}>
                <div style={{ height: 2, background: P.border, borderRadius: 1, marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: P.clay, borderRadius: 1, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-micro text-muted">{s.thresholdBatches - s.consecutiveBatches} batches from threshold</span>
                  <button type="button" onClick={() => acknowledgeDrift(s.id)}
                    className="font-body text-micro hover:opacity-70 transition-opacity" style={{ color: P.clay, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ height: 1, background: P.border, margin: '12px 24px 0' }} />
    </>
  )
}

// ── Supervisor: My queue ──────────────────────────────────────────────────────
function SupervisorQueue({ findings, signOffRequests, setSignOffRequests, logActivity, supervisor }) {
  const actNow  = findings.filter(f => f.urgency === 'danger')
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
    <div className="flex-1 overflow-y-auto page-rise" style={{ borderRight: `1px solid ${P.border}` }}>
      <div style={{ padding: '20px 24px 0' }}>
        <div className="font-body text-micro text-muted mb-3">Act now · {actNow.length} item{actNow.length !== 1 ? 's' : ''}</div>
        {actNow.map((f, i) => (
          <div key={f.id} className="v2-row-in" style={{
            animationDelay: `${i * 50}ms`, padding: '14px 16px', marginBottom: 8,
            background: P.surface, border: `1px solid ${P.border}`, borderLeft: `3px solid ${P.rust}`,
          }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-body text-micro px-1.5 py-0.5" style={{ color: P.rust, background: `${P.rust}14`, border: `1px solid ${P.rust}35` }}>Blocking</span>
              <span className="font-body text-micro text-muted">{f.source}</span>
            </div>
            <div className="font-body font-medium text-body" style={{ color: P.bone, lineHeight: 1.4, marginBottom: 8 }}>{f.title}</div>
            <div className="font-body text-micro text-muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>{f.desc}</div>
            <div className="flex items-center gap-2">
              <Btn variant="primary" onClick={() => logActivity({ actor: supervisor, action: `Resolved: ${f.title}`, item: f.id, type: 'intervention' })}>Mark resolved</Btn>
              <Btn variant="secondary" onClick={() => logActivity({ actor: supervisor, action: `Escalated: ${f.title}`, item: f.id, type: 'escalation' })}>Escalate</Btn>
            </div>
          </div>
        ))}
        {watchItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="font-body text-micro text-muted mb-3">Watch · {watchItems.length} items</div>
            {watchItems.map((f, i) => (
              <div key={f.id} className="v2-row-in" style={{
                animationDelay: `${(actNow.length + i) * 50}ms`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px', marginBottom: 6,
                background: P.surface, border: `1px solid ${P.border}`, borderLeft: `3px solid ${P.amber}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div className="font-body text-micro text-muted" style={{ marginBottom: 3 }}>{f.source}</div>
                  <div className="font-body font-medium text-label" style={{ color: P.bone }}>{f.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Divider />
      <div style={{ padding: '18px 24px 24px' }}>
        <div className="font-body text-micro text-muted mb-3">Sign-off requested · {signOffRequests.length} pending</div>
        {signOffRequests.length === 0 ? (
          <p className="font-body text-label" style={{ color: P.dim }}>No pending sign-offs — operators are good to go.</p>
        ) : signOffRequests.map((req, i) => (
          <div key={req.id} className="v2-row-in" style={{
            animationDelay: `${i * 50}ms`, padding: '14px 16px', marginBottom: 8,
            background: P.surface, border: `1px solid ${P.border}`, borderLeft: `3px solid ${P.sage}`,
          }}>
            <div className="font-body font-medium text-body" style={{ color: P.bone, marginBottom: 4 }}>{req.operator}</div>
            <div className="font-body text-micro text-muted" style={{ marginBottom: 12 }}>{req.finding} · {req.station} · {req.requestedAt}</div>
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
    <div style={{ width: 304, flexShrink: 0, overflowY: 'auto', background: P.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 16px' }}>
        <div className="font-body text-micro text-muted mb-3">My team · {crew.length} operators</div>
        <div style={{ border: `1px solid ${P.border}`, overflow: 'hidden' }}>
          {crew.map((op, i) => <OperatorRow key={op.name} op={op} index={i} total={crew.length} />)}
        </div>
      </div>
      <Divider />
      <div style={{ padding: '18px 20px 16px' }}>
        <div className="font-body text-micro text-muted mb-3">Task assignments · {allTasks.length}</div>
        {allTasks.length === 0 ? (
          <p className="font-body text-label" style={{ color: P.dim }}>No tasks assigned this shift.</p>
        ) : allTasks.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
            borderBottom: i < allTasks.length - 1 ? `1px solid ${P.border2}` : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div className="font-body font-medium text-label" style={{ color: t.done ? P.sage : P.bone }}>{t.operator}</div>
              <div className="font-body text-micro text-muted">{t.label}</div>
            </div>
            <span className="font-body text-micro flex-shrink-0" style={{ color: P.dim }}>{t.dueTime}</span>
          </div>
        ))}
      </div>
      <Divider />
      <div style={{ padding: '18px 20px 20px', margin: '0 0 0 0', borderLeft: `3px solid ${P.clay}`, background: `${P.clay}06` }}>
        <div className="font-body font-semibold text-body" style={{ color: P.bone, marginBottom: 6 }}>Escalate to director</div>
        <div className="font-body text-label text-muted" style={{ marginBottom: 14, lineHeight: 1.5 }}>
          If this situation is beyond your shift authority, escalate to J. Crocker with context.
        </div>
        {escalatedToDirector ? (
          <div className="flex items-center gap-1.5">
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: P.sage, flexShrink: 0 }} />
            <span className="font-body text-label" style={{ color: P.sage }}>Escalated to J. Crocker</span>
          </div>
        ) : (
          <Btn variant="primary" onClick={handleEscalate}>Escalate to J. Crocker</Btn>
        )}
      </div>
    </div>
  )
}

// ── Before strip — what was normal before this shift's conditions ─────────────
const BEFORE_CONTEXT = {
  l4: { oee: '82%', shifts: 28, accuracy: 82, baseScore: 54, normal: 'Allergen log unsigned but changeover not yet started · Sensor A-7 variance count was 1 at shift start' },
  l6: { oee: '88%', shifts: 22, accuracy: 91, baseScore: 42, normal: 'All checklists cleared at T+30 · Staffing 89% certified — no gaps at shift start' },
  default: { oee: '84%', shifts: 20, accuracy: 85, baseScore: 55, normal: 'Conditions within normal range at shift start' },
}

function BeforeStrip({ lineLabel, baseScore }) {
  const lineId  = lineLabel?.toLowerCase().includes('line 4') ? 'l4'
    : lineLabel?.toLowerCase().includes('line 6') ? 'l6'
    : null
  const ctx     = BEFORE_CONTEXT[lineId] ?? BEFORE_CONTEXT.default
  return (
    <div className="flex items-start gap-3 px-6 py-2 border-t" style={{ borderColor: P.border2, background: `${P.clay}08` }}>
      <span className="font-body text-micro flex-shrink-0 mt-px" style={{ color: P.clay }}>Before ·</span>
      <p className="font-body text-micro leading-relaxed flex-1" style={{ color: P.cream, margin: 0 }}>
        Score was {ctx.baseScore} at shift start — within normal range · {ctx.normal}
      </p>
      <span className="font-body text-micro flex-shrink-0 tabular-nums" style={{ color: P.dim }}>
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

  const signedCount = 7 + Object.keys(checklistSigned).length
  const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
  const riskC = sColor(score)
  const checklistPct = Math.round((signedCount / 13) * 100)
  const richFindings = shiftData.findings

  const statement = score >= 75
    ? 'Three signals compounding. Checklist and staffing gaps account for 71% of risk. Act within 28 minutes.'
    : score >= 60
    ? 'Two signals in watch state. Resolve COA gap before handoff. Sensor A-7 at count 3 of 5 threshold.'
    : 'Shift running clean. No blocking conditions. Maintain certification coverage through handoff.'

  const handleDelegate = (operatorName, findingTitle) => {
    const dueTime = 'Before handoff'
    setTaskAssignments(prev => ({
      ...prev,
      [operatorName]: [...(prev[operatorName] || []), { label: findingTitle, dueTime, done: false, id: Date.now() }],
    }))
    logActivity({ actor: supervisor, action: `Delegated task to ${operatorName}: ${findingTitle}`, item: findingTitle, type: 'intervention' })
  }

  return (
    <>
      <style>{V2_CSS}</style>

      {/* ── Score why overlay ───────────────────────────────────────────── */}
      {scoreOverlayOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setScoreOverlayOpen(false)} />
          <div className="fixed z-50 plant-drop-in" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 360 }}>
            <div className="overflow-hidden" style={{ background: P.surface, border: `1px solid ${P.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: `1px solid ${P.border}` }}>
                <div className="flex items-center gap-2">
                  <Brain size={12} color={P.dim} />
                  <span className="font-body font-medium text-ink text-body">Why {score}?</span>
                </div>
                <button type="button" onClick={() => setScoreOverlayOpen(false)}
                  className="font-body text-muted text-label hover:text-ink transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
              </div>
              <ScoreExplainer score={score} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col h-full overflow-hidden" style={{ background: P.bg, color: P.bone }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <header style={{
          background: `linear-gradient(180deg, ${P.surface} 0%, ${P.bg} 100%)`,
          borderBottom: `1px solid ${P.border}`,
          flexShrink: 0, position: 'relative', overflow: 'hidden',
        }}>
          <div className="v2-atmo" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 55% 100% at 8% 60%, ${riskC}22 0%, transparent 65%)` }} />

          {/* Header bar */}
          <div className="flex items-center justify-between" style={{ padding: '14px 24px 0', position: 'relative' }}>
            <div className="flex items-center gap-3">
              <span className="font-body text-label" style={{ color: P.blue }}>{lineLabel}</span>
              <div style={{ width: 1, height: 11, background: P.border }} />
              <span className="font-body text-label text-muted">{plant}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="v2-live" style={{ width: 5, height: 5, borderRadius: '50%', background: P.cyan }} />
              <span className="font-body text-label text-muted">06:42 · live</span>
            </div>
          </div>

          {/* Score + narrative */}
          <div className="flex items-center" style={{ gap: 32, padding: '18px 24px 16px', position: 'relative' }}>
            {/* Score block */}
            <div style={{ flexShrink: 0 }}>
              <div className="display-num text-score leading-none" style={{ color: riskC }}>
                <AnimatedScore value={score} effect="glow" hero />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: riskC }} />
                <span className="font-body text-micro" style={{ color: riskC }}>{sLabel(score)}</span>
                <button type="button" onClick={() => setScoreOverlayOpen(true)}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Brain size={10} color={P.dim} />
                  <span className="font-body text-micro text-muted">Why?</span>
                </button>
              </div>
            </div>

            {/* Narrative statement */}
            <div style={{ borderLeft: `1px solid ${P.border}`, paddingLeft: 28, maxWidth: 400, flex: 1 }}>
              <p className="font-display text-base text-ink leading-relaxed" style={{ margin: 0, marginBottom: 12 }}>
                {statement}
              </p>
              <div className="flex items-center gap-5">
                <div>
                  <span className="font-body text-label text-muted">Scan interval</span>
                  <span className="font-body text-label" style={{ marginLeft: 5, color: P.cyan }}>4 min</span>
                </div>
                <div>
                  <span className="font-body text-label text-muted">Score trend</span>
                  <span className="font-body text-label text-danger" style={{ marginLeft: 5 }}>↑ +4 since 06:30</span>
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div style={{ flexShrink: 0, marginLeft: 'auto', opacity: 0.65 }}>
              <svg width="90" height="36" viewBox="0 0 90 36" aria-hidden="true">
                <polyline points="0,30 15,25 30,21 45,18 60,14 75,10 90,7" fill="none" stroke={riskC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="90" cy="7" r="3" fill={riskC} />
              </svg>
              <span className="font-body text-micro text-muted" style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>06:12 → now</span>
            </div>
          </div>

          {/* Signal health strip */}
          <div className="flex items-center gap-6" style={{ borderTop: `1px solid ${P.border2}`, padding: '9px 24px', position: 'relative' }}>
            {[
              { label: 'SCADA · Oven B', healthy: false },
              { label: 'MES · Schedule', healthy: true },
              { label: 'HR · Roster',    healthy: true },
              { label: 'Checklists',     healthy: true },
            ].map((sig, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: sig.healthy ? P.sage : P.amber, flexShrink: 0 }} />
                <span className="font-body text-label" style={{ color: sig.healthy ? P.dim : P.amber }}>{sig.label}</span>
              </div>
            ))}
          </div>

          {/* Before-context strip — what was normal before this shift's conditions */}
          <BeforeStrip lineLabel={lineLabel} baseScore={54} />
        </header>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {isSupervisorView ? (
            <>
              <SupervisorQueue findings={richFindings} signOffRequests={signOffRequests} setSignOffRequests={setSignOffRequests} logActivity={logActivity} supervisor={supervisor} />
              <SupervisorTeam taskAssignments={taskAssignments} escalatedToDirector={escalatedToDirector} setEscalatedToDirector={setEscalatedToDirector} logActivity={logActivity} supervisor={supervisor} />
            </>
          ) : (
          <>

          {/* LEFT: Intelligence + Crew + Checklists */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${P.border}` }}>

            {/* Shift-start narrative — what changed since shift open */}
            <div style={{ padding: '16px 24px 0', borderBottom: `1px solid ${P.border2}`, marginBottom: 0 }}>
              <div className="flex items-start gap-2.5 pb-4">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: P.clay, flexShrink: 0, marginTop: 5 }} />
                <p className="font-body text-label leading-relaxed" style={{ color: P.cream, margin: 0 }}>
                  Shift opened at 06:12 with score 54 — within normal range.
                  Risk built 54 → 78 over 30 minutes as three signals compounded:
                  checklist lag, a cert mismatch at Sauce Dosing, and Sensor A-7 variance.
                  All three are within supervisor authority to resolve before handoff.
                </p>
              </div>
            </div>

            {/* Intelligence */}
            <div style={{ padding: '20px 24px 16px' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-body text-micro text-muted">
                  Intelligence · {richFindings.length} findings
                </div>
                <button type="button" onClick={() => setTimelineOpen(true)}
                  className="font-body text-micro hover:opacity-70 transition-opacity"
                  style={{ color: P.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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

            <Divider />

            {/* Crew */}
            <div style={{ padding: '18px 24px 16px' }}>
              <div className="font-body text-micro text-muted mb-3">
                Crew · {crew.length} operators
              </div>
              <div style={{ border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                {crew.map((op, i) => (
                  <OperatorRow key={op.name} op={op} index={i} total={crew.length} />
                ))}
              </div>
            </div>

            <Divider />

            {/* Startup checklists */}
            <div style={{ padding: '18px 24px 24px' }}>
              <div className="font-body text-micro text-muted mb-3">Startup checklists</div>
              <div className="flex items-center gap-5" style={{ padding: '14px 16px', background: P.surface, border: `1px solid ${P.border}` }}>
                <div style={{ flexShrink: 0 }}>
                  <span className="display-num text-display" style={{ color: signedCount < 11 ? P.amber : P.sage }}>{signedCount}</span>
                  <span className="font-body text-body text-muted" style={{ marginLeft: 6 }}>/ 13</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 3, background: P.border, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${checklistPct}%`, background: signedCount < 11 ? P.amber : P.sage, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <span className="font-body text-label text-muted">{checklistPct}% complete · 4 overdue at T+42 min</span>
                </div>
                {!allergenSigned && (
                  <span className="font-body text-micro flex-shrink-0 px-2.5 py-1" style={{ color: P.rust, background: `${P.rust}14`, border: `1px solid ${P.rust}35` }}>
                    ALLERGEN UNSIGNED
                  </span>
                )}
              </div>
              <p className="font-display text-label leading-relaxed" style={{ marginTop: 10, paddingLeft: 2, color: P.clay }}>
                4 overdue items at T+42 correlates with 18% elevated scrap rate on comparable Line 4 Pepperoni runs.
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
