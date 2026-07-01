import { useState, useRef, useEffect } from 'react'
import { Brain, Check, CheckCircle2, Users, TrendingUp, TrendingDown, Eye, RefreshCw, Cpu, ChevronDown, ChevronRight } from 'lucide-react'
import { Btn, AnimatedScore, SlidePanel, StatusPill, ScoreExplainer, DitherMeter } from '../components/UI'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { crew, agentEvents } from '../data/shift'
import { computeDitherDots } from '../lib/dither'

// Header score-trend sparkline — static ascending shape; dithered area fill
// under the line to match the Overview spark plots.
const TREND_POINTS = [{ x: 0, y: 30 }, { x: 15, y: 25 }, { x: 30, y: 21 }, { x: 45, y: 18 }, { x: 60, y: 14 }, { x: 75, y: 10 }, { x: 90, y: 7 }]
const TREND_AREA = 'M0,30 L15,25 L30,21 L45,18 L60,14 L75,10 L90,7 L90,36 L0,36 Z'
const TREND_DOTS = computeDitherDots({ width: 90, height: 36, points: TREND_POINTS, baselineY: 36, cell: 2.5 })
import { shiftData, robotFleetData } from '../data'
import { driftSignals } from '../data/driftWatch'
import { FINDING_TYPE_MAP, FINDING_PRECEDENTS } from '../data/findingPrecedents'

const sColor = (s) => s >= 75 ? 'var(--color-danger)' : s >= 60 ? 'var(--color-warn)' : 'var(--color-ok)'
const sLabel = (s) => s >= 75 ? 'At risk' : s >= 60 ? 'Watch' : 'Clear'
const atmoGradient = (s) => s >= 75
  ? 'radial-gradient(ellipse 55% 100% at 8% 60%, rgb(var(--color-danger-rgb) / 0.13) 0%, transparent 65%)'
  : s >= 60
  ? 'radial-gradient(ellipse 55% 100% at 8% 60%, rgb(var(--color-warn-rgb) / 0.13) 0%, transparent 65%)'
  : 'radial-gradient(ellipse 55% 100% at 8% 60%, rgb(var(--color-ok-rgb) / 0.13) 0%, transparent 65%)'

// ── Score factors ──────────────────────────────────────────────────────────────
const SCORE_FACTORS = [
  { label: 'Staffing cert mismatch',  contribution: 18, tone: 'danger', state: 'Reyes (L1) — Sauce Dosing requires L2', confidence: 'high',   source: 'Cert records · direct' },
  { label: 'Allergen changeover log', contribution: 13, tone: 'danger', state: 'Unsigned — production start blocked',   confidence: 'high',   source: 'Checklist system · direct' },
  { label: 'Startup checklists',      contribution:  9, tone: 'warn',   state: '7 of 13 signed · 4 overdue',           confidence: 'high',   source: 'Checklist system · direct' },
  { label: 'Sensor A-7 variance',     contribution:  6, tone: 'warn',   state: 'Micro-variance 4/5 · bearing suspect',  confidence: 'medium', source: 'SCADA · 3-hr rolling' },
  { label: 'CCP-1 & CCP-3',          contribution:  0, tone: 'ok',     state: 'Both within limits',                   confidence: 'high',   source: 'Sensor verified · direct' },
  { label: 'SCADA · Oven B',          contribution:  0, tone: 'warn',   state: 'Stale — model accuracy reduced',       confidence: 'low',    source: 'Last reading 2h 14m ago' },
]

// ── Animations ─────────────────────────────────────────────────────────────────
const V2_CSS = `
  @keyframes v2AtmoPulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.10; } }
  @keyframes v2LiveDot   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
  @keyframes v2RowIn     { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .v2-atmo   { animation: v2AtmoPulse 9s ease-in-out infinite; }
  .v2-live   { animation: v2LiveDot 2.4s ease-in-out infinite; }
  .v2-row-in { animation: v2RowIn var(--dur-standard) var(--ease-spring) both; }
`

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-rule" />
}

// ── Action overlay — floating picker anchored to a trigger element ─────────────
function ActionOverlay({ triggerRef, onClose, title, width = 'w-52', children }) {
  const dropRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const left = Math.min(r.left, window.innerWidth - 220)
      setPos({ top: r.bottom + 4, left: Math.max(8, left) })
    }
  }, [triggerRef])

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)) onClose()
    }
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, triggerRef])

  return (
    <div ref={dropRef} className={`fixed z-50 plant-drop-in ${width}`}
      style={{ top: pos.top, left: pos.left }}>
      <div className="bg-stone border border-rule shadow-raise overflow-hidden">
        <div className="plant-drop-in-content">
          {title && (
            <div className="px-4 pt-3 pb-2 border-b border-rule2">
              <span className="font-body text-label text-muted">{title}</span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Director directive data ───────────────────────────────────────────────────
const DIRECTOR_HOLD = {
  action:    'Hold Lot TS-8811 — quarantine in Cold Storage B, do not release to Line 4',
  director:  'J. Crocker',
  ratifiedAt: '06:22',
  agent:     'Supplier Intelligence Agent · Tier 3',
  rationale: 'COA not received 4h before scheduled production start. FSMA 204 compliance hold.',
}
const BRIEF_CREW = ['C. Reyes', 'P. Okonkwo', 'F. Adeyemi']

// ── Directive card — ratified agent decision requiring floor execution ─────────
function DirectorHoldCard({ executed, onExecute }) {
  const confirmBtnRef = useRef(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState(new Set(BRIEF_CREW))

  const toggle = (name) => setSelected(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n })

  const handleConfirm = () => {
    onExecute(selected)
    setConfirmOpen(false)
  }

  return (
    <div className={`v2-row-in bg-stone2 border border-rule mb-2.5 transition-opacity ${executed ? 'opacity-50' : ''}`}>
      <div className="px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <StatusPill tone={executed ? 'ok' : 'danger'}>{executed ? 'Executed' : 'Hold active'}</StatusPill>
          <span className="font-body text-muted text-label">{DIRECTOR_HOLD.director} · Plant Director · {DIRECTOR_HOLD.ratifiedAt}</span>
          <span className="font-body text-muted text-label opacity-40">·</span>
          <span className="font-body text-muted text-label">{DIRECTOR_HOLD.agent}</span>
        </div>
        <div className="font-display font-semibold text-sub text-ink leading-snug">{DIRECTOR_HOLD.action}</div>
      </div>
      <div className="px-4 py-2 border-y border-rule2">
        <span className="font-body text-label text-muted">{DIRECTOR_HOLD.rationale}</span>
      </div>
      {executed ? (
        <div className="px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={11} className="text-ok" />
          <span className="font-body text-label text-ok">Executed · crew notified</span>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2">
          <span ref={confirmBtnRef} className="inline-flex">
            <Btn variant="primary" onClick={() => setConfirmOpen(p => !p)}>Confirm execution</Btn>
          </span>
          {confirmOpen && (
            <ActionOverlay triggerRef={confirmBtnRef} onClose={() => setConfirmOpen(false)} title="Hold TS-8811" width="w-56">
              <div className="px-4 pt-2 pb-3">
                <div className="font-body text-label text-muted mb-1.5">Notify crew</div>
                {BRIEF_CREW.map(name => (
                  <button key={name} type="button" onClick={() => toggle(name)}
                    className="flex items-center gap-2.5 w-full py-2 transition-colors hover:opacity-70">
                    <div className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${selected.has(name) ? 'bg-signal border-signal' : 'border-rule2'}`}>
                      {selected.has(name) && <Check size={8} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className={`font-body text-label ${selected.has(name) ? 'text-ink' : 'text-muted'}`}>{name}</span>
                  </button>
                ))}
                <div className="mt-2.5 pt-2.5 border-t border-rule2">
                  <Btn variant="primary" onClick={handleConfirm} className="w-full">Confirm execution</Btn>
                </div>
              </div>
            </ActionOverlay>
          )}
        </div>
      )}
    </div>
  )
}

// ── Precedent card — "last 5 times this finding appeared" ─────────────────────
// Shows historical acceptance rate and outcomes before the action buttons.
// Builds trust in specific recommendation categories through track record.

function PrecedentCard({ findingId }) {
  const [open, setOpen] = useState(false)
  const typeKey = FINDING_TYPE_MAP[findingId]
  const p = typeKey ? FINDING_PRECEDENTS[typeKey] : null
  if (!p) return null

  const pct  = Math.round(p.acceptanceRate * 100)
  const color = pct >= 80 ? 'text-ok' : pct >= 60 ? 'text-warn' : 'text-danger'
  const bar   = pct >= 80 ? 'bg-ok'   : pct >= 60 ? 'bg-warn'   : 'bg-danger'

  return (
    <div className="border-t border-rule2 bg-stone">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-stone2 transition-colors text-left">
        {/* Acceptance rate bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-16 h-1 bg-rule2 overflow-hidden">
            <DitherMeter value={pct} colorClass={bar} />
          </div>
          <span className={`font-body text-label font-semibold tabular-nums ${color}`}>{pct}%</span>
        </div>
        <span className="font-body text-label text-muted flex-1">acted on in last 5 shifts</span>
        {/* Mini dot history */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {p.instances.map((inst, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inst.acted ? 'bg-ok' : 'bg-danger'}`} />
          ))}
        </div>
        {open
          ? <ChevronDown  size={10} strokeWidth={2} className="text-muted flex-shrink-0 ml-1" />
          : <ChevronRight size={10} strokeWidth={2} className="text-muted flex-shrink-0 ml-1" />}
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-rule2 bg-stone2 slide-in">
          <div className="space-y-1.5 mt-2.5">
            {p.instances.map((inst, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${inst.acted ? 'bg-ok' : 'bg-danger'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-label text-muted flex-shrink-0">{inst.date}</span>
                    <span className={`font-body text-label font-medium ${inst.acted ? 'text-ok' : 'text-danger'}`}>
                      {inst.acted ? `Acted · ${inst.mins}m` : 'Ignored'}
                    </span>
                    <span className={`font-body text-label tabular-nums ml-auto flex-shrink-0 ${inst.scoreDelta < 0 ? 'text-ok' : 'text-danger'}`}>
                      {inst.scoreDelta > 0 ? '+' : ''}{inst.scoreDelta} pts
                    </span>
                  </div>
                  <div className="font-body text-label text-muted leading-snug">{inst.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2.5 border-t border-rule2">
            <p className="font-body text-label text-muted leading-snug">{p.insight}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Finding card ──────────────────────────────────────────────────────────────
const DISMISS_REASONS = [
  'Already handled by outgoing supervisor',
  'Not applicable — SKU change in progress',
  'Assessment is incorrect — false positive',
]

function FindingCard({ f, index, onAct, onDelegate, onDismiss }) {
  const { logFindingAction } = useAppState()
  const [dismissed, setDismissed] = useState(false)
  const [acted, setActed] = useState(false)
  const [actedAt, setActedAt] = useState(null)
  const [delegatedTo, setDelegatedTo] = useState(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [dismissOpen, setDismissOpen] = useState(false)
  const assignBtnRef = useRef(null)
  const dismissBtnRef = useRef(null)

  // Precision farming: show trust tier based on historical acceptance rates
  const typeKey = FINDING_TYPE_MAP[f.id]
  const precedent = typeKey ? FINDING_PRECEDENTS[typeKey] : null
  const acceptanceRate = precedent?.acceptanceRate ?? 0.5
  const tierLabel = acceptanceRate >= 0.80 ? 'Act Now' : acceptanceRate >= 0.60 ? 'Watch' : 'Background'
  const tierColor = acceptanceRate >= 0.80 ? 'text-danger' : acceptanceRate >= 0.60 ? 'text-warn' : 'text-muted'
  const tierBg = acceptanceRate >= 0.80 ? 'bg-danger/10' : acceptanceRate >= 0.60 ? 'bg-warn/10' : 'bg-stone3'


  if (dismissed) return null

  const handleDismiss = (reason) => {
    logFindingAction(f.id, 'dismissed', reason)
    onDismiss?.(f.id, reason)
    setDismissed(true)
  }

  const handleAct = () => {
    const now = new Date()
    logFindingAction(f.id, 'acted')
    setActed(true)
    setActedAt(now)
    onAct?.(f.id)
  }

  const handleDelegate = (op) => {
    logFindingAction(f.id, 'delegated')
    setDelegatedTo(op)
    setAssignOpen(false)
    onDelegate?.(op, f.title)
  }

  return (
    <div
      className={`v2-row-in bg-stone2 border border-rule mb-2.5`}
      style={{ animationDelay: `${index * 90}ms`, opacity: acted ? 0.45 : 1, transition: `opacity var(--dur-standard) var(--ease-standard)` }}>

      <div className="px-4 pt-3.5 pb-2.5">
        {/* Precision farming tier — show whether supervisors typically act on this finding type */}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-label font-medium mb-2 ${tierBg} ${tierColor}`}>
          <span className="text-xs">{tierLabel}</span>
          {precedent && (
            <span className="text-xs opacity-75">
              {Math.round(acceptanceRate * 100)}% act
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="font-display font-semibold text-sub text-ink leading-snug">{f.title}</div>
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

      {/* Precedent card — shown before action buttons so supervisor sees track record first */}
      <PrecedentCard findingId={f.id} />

      {acted ? (
        <div className="px-4 py-2.5 flex items-center gap-2">
          <Check size={11} className="text-ok" />
          <span className="font-body text-label text-ok">{f.consequence}</span>
          {actedAt && (
            <span className="font-body text-label text-muted ml-auto">
              {actedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      ) : delegatedTo ? (
        <div className="px-4 py-3 flex items-center gap-2">
          <Check size={11} className="text-ok" />
          <span className="font-body text-label text-ok">Assigned to {delegatedTo} — task in their dashboard</span>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2">
          <Btn variant="primary" onClick={handleAct}>{f.actions?.[0]}</Btn>
          {f.actions?.[1] && (
            <span ref={dismissBtnRef} className="inline-flex">
              <Btn variant="secondary" onClick={() => setDismissOpen(p => !p)}>{f.actions[1]}</Btn>
            </span>
          )}
          {dismissOpen && (
            <ActionOverlay triggerRef={dismissBtnRef} onClose={() => setDismissOpen(false)} title="Dismiss reason" width="w-64">
              <div className="px-1 py-1">
                {DISMISS_REASONS.map(reason => (
                  <button key={reason} type="button" onClick={() => { setDismissOpen(false); handleDismiss(reason) }}
                    className="flex items-start gap-2.5 w-full text-left font-body text-label text-ink px-3 py-2.5 hover:bg-stone3 transition-colors">
                    <div className="w-1 h-1 rounded-full bg-muted flex-shrink-0 mt-1.5" />
                    {reason}
                  </button>
                ))}
              </div>
            </ActionOverlay>
          )}
          {(f.delegateTo?.length > 0) && (
            <span ref={assignBtnRef} className="ml-auto inline-flex">
              <Btn variant="ghost" icon={Users} onClick={() => setAssignOpen(p => !p)} className="!px-2 !min-h-0 whitespace-nowrap">
                Assign
              </Btn>
            </span>
          )}
          {assignOpen && (
            <ActionOverlay triggerRef={assignBtnRef} onClose={() => setAssignOpen(false)} title="Assign to">
              <div className="px-4 py-2">
                {(f.delegateTo || []).map(op => (
                  <button key={op} type="button" onClick={() => handleDelegate(op)}
                    className="flex items-center w-full -mx-4 px-4 py-2 font-body text-label text-ink hover:bg-stone2 transition-colors">
                    {op}
                  </button>
                ))}
              </div>
            </ActionOverlay>
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
        <div className="font-body text-label text-muted mt-[3px]">{op.role}</div>
      </div>
      <div className="flex-1 flex items-center gap-2.5">
        <div className="flex-1 h-0.5 bg-rule">
          <DitherMeter value={cert} color={certColor} />
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
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', opacity }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <span className="font-body text-label text-muted" style={{ marginBottom: 6, textAlign: 'right', width: '100%' }}>{ev.time}</span>
        <div className={isNow ? 'v2-live' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        {index < total - 1 && <div style={{ flex: 1, width: 1, background: 'var(--color-rule-2)', marginTop: 5, minHeight: 14 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div
          className={`font-display text-body leading-relaxed ${isNow ? 'text-ink' : 'text-muted'}`}
          dangerouslySetInnerHTML={{ __html: ev.text }}
        />
        {ev.delta && (
          <span className="font-body text-label" style={{ marginTop: 4, display: 'block', color: deltaC }}>{ev.delta}</span>
        )}
      </div>
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
          <span className="font-body text-label text-context">Trend watch · {visible.length} sub-threshold</span>
        </div>
        {visible.map((s, i) => {
          const pct = Math.round((s.consecutiveBatches / s.thresholdBatches) * 100)
          const DirIcon = s.direction === 'up' ? TrendingUp : TrendingDown
          return (
            <div key={s.id} className="v2-row-in bg-stone2 border border-rule border-l-[3px] border-l-context mb-2"
              style={{ animationDelay: `${i * 50}ms`, padding: 'var(--space-3) var(--space-3)' }}>
              <div className="flex items-start gap-2 mb-1.5">
                <DirIcon size={10} strokeWidth={2} className="text-context flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-body text-ink leading-snug">{s.signal}</div>
                  <div className="font-body text-label text-muted mt-0.5">{s.source} · {s.consecutiveBatches} consecutive batches</div>
                </div>
              </div>
              <div className="font-body text-label text-muted mb-2 leading-snug" style={{ paddingLeft: 18 }}>{s.currentReading} · {s.note}</div>
              <div style={{ paddingLeft: 18 }}>
                <div className="h-0.5 bg-rule rounded-sm mb-2 overflow-hidden">
                  <DitherMeter value={pct} color="var(--color-context)" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-label text-muted">{s.thresholdBatches - s.consecutiveBatches} batches from threshold</span>
                  <button type="button" onClick={() => acknowledgeDrift(s.id)}
                    className="font-body text-label text-context hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer p-0">
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
        <div className="font-body text-label text-muted mb-3">Act now · {actNow.length} item{actNow.length !== 1 ? 's' : ''}</div>
        {actNow.map((f, i) => (
          <div key={f.id} className="v2-row-in bg-stone2 border border-rule mb-2 px-4 py-3.5"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-body text-label px-1.5 py-0.5 text-danger bg-danger/[0.078] border border-danger/20">Blocking</span>
              <span className="font-body text-label text-muted">{f.source}</span>
            </div>
            <div className="font-body font-medium text-body text-ink leading-[1.4] mb-2">{f.title}</div>
            <div className="font-body text-label text-muted leading-[1.5] mb-3">{f.desc}</div>
            <div className="flex items-center gap-2">
              <Btn variant="primary" onClick={() => logActivity({ actor: supervisor, action: `Resolved: ${f.title}`, item: f.id, type: 'intervention' })}>Mark resolved</Btn>
              <Btn variant="secondary" onClick={() => logActivity({ actor: supervisor, action: `Escalated: ${f.title}`, item: f.id, type: 'escalation' })}>Escalate</Btn>
            </div>
          </div>
        ))}
        {watchItems.length > 0 && (
          <div className="mt-4">
            <div className="font-body text-label text-muted mb-3">Watch · {watchItems.length} items</div>
            {watchItems.map((f, i) => (
              <div key={f.id} className="v2-row-in flex items-start gap-3 bg-stone2 border border-rule mb-1.5 px-4 py-3"
                style={{ animationDelay: `${(actNow.length + i) * 50}ms` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-[3px]">
                    <StatusPill tone="warn">Watch</StatusPill>
                    <span className="font-body text-label text-muted">{f.source}</span>
                  </div>
                  <div className="font-body font-medium text-label text-ink">{f.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Divider />
      <div className="px-6 pt-[18px] pb-6">
        <div className="font-body text-label text-muted mb-3">Sign-off requested · {signOffRequests.length} pending</div>
        {signOffRequests.length === 0 ? (
          <p className="font-body text-label text-muted">No pending sign-offs — operators are good to go.</p>
        ) : signOffRequests.map((req, i) => (
          <div key={req.id} className="v2-row-in bg-stone2 border border-rule mb-2 px-4 py-3.5"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="mb-1.5"><StatusPill tone="ok">Sign-off ready</StatusPill></div>
            <div className="font-body font-medium text-body text-ink mb-1">{req.operator}</div>
            <div className="font-body text-label text-muted mb-3">{req.finding} · {req.station} · {req.requestedAt}</div>
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
        <div className="font-body text-label text-muted mb-3">My team · {crew.length} operators</div>
        <div className="border border-rule overflow-hidden">
          {crew.map((op, i) => <OperatorRow key={op.name} op={op} index={i} total={crew.length} />)}
        </div>
      </div>
      <Divider />
      <div className="px-5 pt-[18px] pb-4">
        <div className="font-body text-label text-muted mb-3">Task assignments · {allTasks.length}</div>
        {allTasks.length === 0 ? (
          <p className="font-body text-label text-muted">No tasks assigned this shift.</p>
        ) : allTasks.map((t, i) => (
          <div key={t.id} className={`flex items-start gap-2.5 py-[9px] ${i < allTasks.length - 1 ? 'border-b border-rule2' : ''}`}>
            <div className="flex-1">
              <div className={`font-body font-medium text-label ${t.done ? 'text-ok' : 'text-ink'}`}>{t.operator}</div>
              <div className="font-body text-label text-muted">{t.label}</div>
            </div>
            <span className="font-body text-label flex-shrink-0 text-muted">{t.dueTime}</span>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShiftLinePanel({ score = 78, lineLabel = 'Line 4 · AM Shift', supervisor = 'D. Kowalski', plant = 'Salina KS', isSupervisorView = false }) {
  const { checklistSigned, taskAssignments, setTaskAssignments, logActivity,
    signOffRequests, setSignOffRequests, escalatedToDirector, setEscalatedToDirector,
    workerMode } = useAppState()
  const [scoreOverlayOpen, setScoreOverlayOpen] = useState(false)
  const [directiveExecuted, setDirectiveExecuted] = useState(false)

  const signedCount  = 7 + Object.keys(checklistSigned).length
  const riskC        = sColor(score)
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
            <div className="overflow-hidden bg-stone2 border border-rule" style={{ boxShadow: 'var(--shadow-modal)' }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-rule">
                <div className="flex items-center gap-2">
                  <Brain size={12} className="text-muted" />
                  <span className="font-body font-medium text-ink text-body">Why {score}?</span>
                </div>
                <button type="button" onClick={() => setScoreOverlayOpen(false)}
                  className="font-body text-muted text-label hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-1.5 py-0.5">✕</button>
              </div>
              <ScoreExplainer score={score} factors={SCORE_FACTORS} collapsible={false} />
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
                <span className="font-body text-label" style={{ color: riskC }}>{sLabel(score)}</span>
                <button type="button" onClick={() => setScoreOverlayOpen(true)}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity ml-1.5 bg-transparent border-none cursor-pointer p-0">
                  <Brain size={10} className="text-muted" />
                  <span className="font-body text-label text-muted">Why?</span>
                </button>
              </div>
            </div>

            <div className="border-l border-rule pl-7 max-w-[400px] flex-1">
              <p className="font-display text-sub text-ink leading-relaxed m-0 mb-3">{statement}</p>
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
                <clipPath id="shift-trend-dither"><path d={TREND_AREA} /></clipPath>
                <g clipPath="url(#shift-trend-dither)" style={{ fillOpacity: 'var(--dither-fill)' }}>
                  {TREND_DOTS.map(dot => (
                    <circle key={dot.key} cx={dot.cx} cy={dot.cy} r={dot.r} fill={riskC} />
                  ))}
                </g>
                <polyline points="0,30 15,25 30,21 45,18 60,14 75,10 90,7" fill="none" stroke={riskC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="90" cy="7" r="3" fill={riskC} />
              </svg>
              <span className="font-body text-label text-muted block text-center mt-1">54 → {score} · 30 min · 3 signals</span>
            </div>
          </div>

          <div className="flex items-center gap-6 px-6 py-[9px] border-t border-rule2 relative">
            {[
              ...(workerMode !== 'hybrid' ? [{ label: 'SCADA · Oven B', healthy: false }] : []),
              { label: 'MES · Schedule', healthy: true },
              { label: 'HR · Roster',    healthy: true },
              { label: `Checklists · ${signedCount}/13`, healthy: signedCount >= 11 },
            ].map((sig, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${sig.healthy ? 'bg-ok' : 'bg-warn'}`} />
                <span className={`font-body text-label ${sig.healthy ? 'text-muted' : 'text-warn'}`}>{sig.label}</span>
              </div>
            ))}
          </div>

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
              <div className="px-6 pt-5 pb-4">
                {/* Fleet alerts — injected when robot/hybrid mode is active */}
                {(workerMode === 'robot' || workerMode === 'hybrid') && (() => {
                  const faulted = robotFleetData.units.filter(u => u.status === 'fault' || u.status === 'maintenance')
                  if (faulted.length === 0) return null
                  return (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu size={10} strokeWidth={2} className="text-signal flex-shrink-0" />
                        <span className="font-body text-label text-muted">Fleet alerts · {faulted.length}</span>
                      </div>
                      {faulted.map((u, i) => (
                        <div key={u.id} className="v2-row-in bg-stone2 border border-rule mb-2 px-4 py-3"
                          style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`font-body text-label px-1.5 py-0.5 border ${u.status === 'fault' ? 'text-danger bg-danger/[0.08] border-danger/20' : 'text-warn bg-warn/[0.08] border-warn/20'}`}>
                              {u.status === 'fault' ? 'Fault' : 'In PM'} · {u.id}
                            </span>
                            <span className="font-body text-muted text-label">{u.line}</span>
                          </div>
                          <div className="font-body font-medium text-label text-ink">{u.name}</div>
                          {u.alert && <div className="font-body text-label text-muted mt-0.5">{u.alert.msg}</div>}
                        </div>
                      ))}
                      <div className="h-px bg-rule mb-4" />
                    </div>
                  )
                })()}
                <div className="font-body text-label text-muted mb-3">Intelligence · {richFindings.length} findings</div>
                <DirectorHoldCard
                  executed={directiveExecuted}
                  onExecute={(selected) => {
                    setDirectiveExecuted(true)
                    logActivity({ actor: supervisor, action: 'Confirmed execution — Lot TS-8811 quarantined in Cold Storage B', item: 'TS-8811', type: 'intervention' })
                  }}
                />
                {richFindings.map((f, i) => (
                  <FindingCard key={f.id} f={f} index={i}
                    onAct={(id) => logActivity({ actor: supervisor, action: `Acted on finding: ${f.title}`, item: id, type: 'intervention' })}
                    onDelegate={handleDelegate}
                    onDismiss={(id, reason) => logActivity({ actor: supervisor, action: `Dismissed: ${reason}`, item: id, type: 'dismissal' })}
                  />
                ))}
              </div>
            </div>

            <div className="w-[304px] flex-shrink-0 overflow-y-auto bg-stone flex flex-col">
              <div className="px-5 pt-5 pb-4 border-b border-rule2">
                <div className="font-body text-label text-muted mb-3">Crew · {crew.length} operators</div>
                <div className="border border-rule overflow-hidden">
                  {crew.map((op, i) => <OperatorRow key={op.name} op={op} index={i} total={crew.length} />)}
                </div>
              </div>
              <div className="px-5 pt-4 pb-4">
                <div className="font-body text-label text-muted mb-3">Agent timeline · this shift</div>
                {agentEvents.map((ev, i) => (
                  <TimelineEntry key={i} ev={ev} index={i} total={agentEvents.length} />
                ))}
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
