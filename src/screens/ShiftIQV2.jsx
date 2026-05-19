import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { crew, agentEvents } from '../data/shift'
import { shiftData } from '../data'

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
const sLabel = (s) => s >= 75 ? 'AT RISK' : s >= 60 ? 'WATCH' : 'CLEAR'

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
        <div className="font-display font-semibold text-ink" style={{ fontSize: 14, lineHeight: 1.35, marginBottom: 8 }}>
          {f.title}
        </div>
        <p className="font-display text-body leading-relaxed" style={{ margin: 0, color: P.clay }}>
          {f.desc}
        </p>
      </div>

      {/* Pattern indicator */}
      {f.recurring && (
        <div style={{ padding: '6px 16px', borderTop: `1px solid ${P.border2}` }}>
          <Link
            to={`/capa?finding=${f.id}`}
            className="font-body text-label text-warn bg-warn/10 px-1.5 py-px hover:bg-warn/20 transition-colors inline-flex items-center gap-1">
            Recurring · {f.recurring.count} of {f.recurring.window} shifts
          </Link>
        </div>
      )}

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
        <div style={{ padding: '10px 16px' }}>
          <div className="font-body text-micro text-muted mb-2">Assign to:</div>
          <div className="flex gap-2 flex-wrap">
            {(f.delegateTo || []).map(op => (
              <button key={op} type="button" onClick={() => handleDelegate(op)}
                className="font-body text-label text-ink border border-rule px-2.5 py-1 hover:border-ochre hover:text-ochre transition-colors">
                {op}
              </button>
            ))}
            <button type="button" onClick={() => setDelegating(false)}
              className="font-body text-label text-muted px-2 py-1 hover:text-ink transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : delegatedTo ? (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={11} color={P.sage} />
          <span className="font-body text-label" style={{ color: P.sage }}>Assigned to {delegatedTo} — task in their dashboard</span>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => { setActed(true); onAct?.(f.id) }}
            className="font-body text-label"
            style={{ fontSize: 11, color: P.bg, background: urgencyColor, border: 'none', padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>
            {f.actions?.[0]}
          </button>
          {f.actions?.[1] && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="font-body text-label"
              style={{ fontSize: 11, color: P.cream, background: 'transparent', border: `1px solid ${P.border}`, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>
              {f.actions[1]}
            </button>
          )}
          {(f.delegateTo?.length > 0) && (
            <button type="button" onClick={() => setDelegating(true)}
              className="font-body text-label text-muted hover:text-ink transition-colors ml-auto flex items-center gap-1">
              <Users size={10} strokeWidth={2} />
              Assign
            </button>
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
        <span className="font-body text-label" style={{ fontSize: 9, color: P.amber, background: `${P.amber}18`, border: `1px solid ${P.amber}40`, padding: '2px 7px', letterSpacing: '0.08em', flexShrink: 0 }}>
          CERT GAP
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
  const [open, setOpen] = useState(false)
  const baseScore = score - SCORE_FACTORS.reduce((s, f) => s + f.contribution, 0)

  return (
    <div style={{ borderTop: `1px solid ${P.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between hover:bg-stone2 transition-colors"
        style={{ padding: '11px 20px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div className="flex items-center gap-2">
          <Brain size={11} color={P.dim} />
          <span className="font-body text-label text-muted">Why {score}?</span>
        </div>
        {open ? <ChevronUp size={11} color={P.dim} /> : <ChevronDown size={11} color={P.dim} />}
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${P.border2}` }}>
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
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShiftIQV2({ score = 78, lineLabel = 'Line 4 · AM Shift', supervisor = 'D. Kowalski', plant = 'Salina KS' }) {
  const { checklistSigned, allergenOverride, taskAssignments, setTaskAssignments, logActivity } = useAppState()

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
              <span className="font-body text-label" style={{ color: P.blue, letterSpacing: '0.06em' }}>{lineLabel}</span>
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
            {/* Score — display-num gives IBM Plex Mono at large size */}
            <div style={{ flexShrink: 0 }}>
              <div className="display-num" style={{ fontSize: 88, fontWeight: 700, lineHeight: 1, color: riskC }}>
                {score}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: riskC }} />
                <span className="font-body text-micro" style={{ color: riskC, letterSpacing: '0.1em' }}>{sLabel(score)}</span>
                <span className="font-body text-micro text-muted" style={{ marginLeft: 2 }}>· Risk score</span>
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
        </header>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Intelligence + Crew + Checklists */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${P.border}` }}>

            {/* Intelligence */}
            <div style={{ padding: '20px 24px 16px' }}>
              <div className="font-body text-micro text-muted tracking-widest mb-3">
                Intelligence · {richFindings.length} findings
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
              <div className="font-body text-micro text-muted tracking-widest mb-3">
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
              <div className="font-body text-micro text-muted tracking-widest mb-3">Startup checklists</div>
              <div className="flex items-center gap-5" style={{ padding: '14px 16px', background: P.surface, border: `1px solid ${P.border}` }}>
                <div style={{ flexShrink: 0 }}>
                  <span className="display-num" style={{ fontSize: 36, color: signedCount < 11 ? P.amber : P.sage }}>{signedCount}</span>
                  <span className="font-body text-body text-muted" style={{ marginLeft: 6 }}>/ 13</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 3, background: P.border, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${checklistPct}%`, background: signedCount < 11 ? P.amber : P.sage, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <span className="font-body text-label text-muted">{checklistPct}% complete · 4 overdue at T+42 min</span>
                </div>
                {!allergenSigned && (
                  <span className="font-body text-label" style={{ fontSize: 10, color: P.rust, background: `${P.rust}14`, border: `1px solid ${P.rust}35`, padding: '4px 10px', letterSpacing: '0.06em', flexShrink: 0 }}>
                    ALLERGEN UNSIGNED
                  </span>
                )}
              </div>
              <p className="font-display text-label leading-relaxed" style={{ marginTop: 10, paddingLeft: 2, color: P.clay }}>
                4 overdue items at T+42 correlates with 18% elevated scrap rate on comparable Line 4 Pepperoni runs.
              </p>
            </div>
          </div>

          {/* RIGHT: Timeline + Score breakdown */}
          <div style={{ width: 304, flexShrink: 0, overflowY: 'auto', background: P.bg }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div className="font-body text-micro text-muted tracking-widest mb-3">Agent · Timeline</div>
              {agentEvents.map((ev, i) => (
                <TimelineEntry key={i} ev={ev} index={i} total={agentEvents.length} />
              ))}
            </div>
            <Divider />
            <ScoreExplainer score={score} />
          </div>
        </div>
      </div>
    </>
  )
}
