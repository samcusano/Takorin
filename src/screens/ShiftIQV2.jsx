import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Check, AlertTriangle, X } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { findings, crew, agentEvents } from '../data/shift'

// ── Palette ────────────────────────────────────────────────────────────────────
// Synced with global design tokens (tailwind.config.js + index.css).
// Inline styles used here for precise control in the enhanced redesign component.
const P = {
  bg:       '#0B0F18',   // stone
  surface:  '#131A26',   // stone2
  elevated: '#1B2538',   // stone3
  border:   '#263042',   // rule
  border2:  '#1A2335',   // rule2
  bone:     '#EDE4CB',   // ink
  cream:    '#8A7E62',   // ink2
  dim:      '#4A5D74',   // color-dim (suppressed labels)
  blue:     '#4B9CE4',   // ochre (primary accent)
  cyan:     '#3BBFDA',   // ochre-light (live signal)
  indigo:   '#7C86E8',   // deep (predictive)
  clay:     '#C4844E',   // context (narrative voice)
  amber:    '#C98E2A',   // warn
  sage:     '#5FA877',   // ok
  rust:     '#D45438',   // danger
}

// Score → semantic color
const sColor = (s) => s >= 75 ? P.rust : s >= 60 ? P.amber : P.sage
const sLabel = (s) => s >= 75 ? 'AT RISK' : s >= 60 ? 'WATCH' : 'CLEAR'

// ── Finding type → urgency color ──────────────────────────────────────────────
const findingColor = (type) => type === 'cu' ? P.rust : P.amber

// ── Score factors (mirrors ShiftIQ.jsx SCORE_FACTORS) ─────────────────────────
const SCORE_FACTORS = [
  { label: 'Staffing cert mismatch',  contribution: 18, tone: 'danger', state: 'Reyes (L1) — Sauce Dosing requires L2', confidence: 'HIGH',   source: 'Cert records · direct' },
  { label: 'Allergen changeover log', contribution: 13, tone: 'danger', state: 'Unsigned — production start blocked',   confidence: 'HIGH',   source: 'Checklist system · direct' },
  { label: 'Startup checklists',      contribution:  9, tone: 'warn',   state: '7 of 13 signed · 4 overdue',           confidence: 'HIGH',   source: 'Checklist system · direct' },
  { label: 'Sensor A-7 variance',     contribution:  6, tone: 'warn',   state: 'Micro-variance 4/5 · bearing suspect',  confidence: 'MEDIUM', source: 'SCADA · 3-hr rolling' },
  { label: 'CCP-1 & CCP-3',          contribution:  0, tone: 'ok',     state: 'Both within limits',                   confidence: 'HIGH',   source: 'Sensor verified · direct' },
  { label: 'SCADA · Oven B',          contribution:  0, tone: 'warn',   state: 'Stale — confidence penalty applied',   confidence: 'LOW',    source: 'Last reading 2h 14m ago' },
]

// ── CSS animations (injected as style tag — isolated to this design) ──────────
const V2_CSS = `
  @keyframes v2AtmoPulse {
    0%, 100% { opacity: 0.04; }
    50%       { opacity: 0.10; }
  }
  @keyframes v2LiveDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes v2RowIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .v2-atmo    { animation: v2AtmoPulse 9s ease-in-out infinite; }
  .v2-live    { animation: v2LiveDot 2.4s ease-in-out infinite; }
  .v2-row-in  { animation: v2RowIn 320ms cubic-bezier(0.16,1,0.3,1) both; }
`

// ── Mono label (system voice) ─────────────────────────────────────────────────
function Mono({ children, size = 10, color, style = {}, ...props }) {
  return (
    <span
      style={{
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
        fontSize: size,
        color: color || P.dim,
        letterSpacing: '0.04em',
        ...style,
      }}
      {...props}>
      {children}
    </span>
  )
}

// ── Narrative text (human voice) ──────────────────────────────────────────────
function Narrative({ children, size = 13, color, style = {}, ...props }) {
  return (
    <span
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
        fontSize: size,
        lineHeight: 1.55,
        color: color || P.clay,
        fontStyle: 'italic',
        ...style,
      }}
      {...props}>
      {children}
    </span>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Mono size={10} color={P.dim} style={{ letterSpacing: '0.12em' }}>
        {children}
      </Mono>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ style = {} }) {
  return <div style={{ height: 1, background: P.border, ...style }} />
}

// ── Finding card — precision + narrative fused ────────────────────────────────
function FindingCard({ f, index, onAct }) {
  const [dismissed, setDismissed] = useState(false)
  const [acted, setActed] = useState(false)
  const uc = findingColor(f.type)

  if (dismissed) return null

  return (
    <div
      className="v2-row-in"
      style={{
        background: P.surface,
        border: `1px solid ${P.border}`,
        borderLeft: `3px solid ${uc}`,
        marginBottom: 10,
        animationDelay: `${index * 90}ms`,
        opacity: acted ? 0.45 : 1,
        transition: 'opacity 400ms ease',
      }}>

      {/* Header — system voice */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Ordinal — editorial serif */}
        <span style={{
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: 22,
          fontWeight: 700,
          color: uc,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 1,
          opacity: 0.9,
        }}>
          {f.ordinal}
        </span>

        <div style={{ flex: 1 }}>
          {/* Title — system voice, precise */}
          <div style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: P.bone,
            lineHeight: 1.35,
            marginBottom: 8,
          }}>
            {f.title}
          </div>

          {/* Narrative interpretation — human voice, warm */}
          <Narrative size={12} color={P.clay}>
            {f.description}
          </Narrative>
        </div>
      </div>

      {/* Evidence — monospace, structured */}
      <div style={{ padding: '8px 16px 8px 46px', borderTop: `1px solid ${P.border2}`, borderBottom: `1px solid ${P.border2}` }}>
        <Mono size={10} color={P.dim}>{f.evidence}</Mono>
      </div>

      {/* Actions */}
      {acted ? (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={11} color={P.sage} />
          <Mono size={10} color={P.sage}>{f.consequenceMessage}</Mono>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setActed(true); onAct?.(f.id) }}
            style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.04em',
              color: P.bg,
              background: uc,
              border: 'none',
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}>
            {f.primaryLabel}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.04em',
              color: P.cream,
              background: 'transparent',
              border: `1px solid ${P.border}`,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={e => e.target.style.borderColor = P.cream}
            onMouseLeave={e => e.target.style.borderColor = P.border}>
            {f.secondaryLabel}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Operator row ──────────────────────────────────────────────────────────────
const OP_CERT = {
  'D. Kowalski': 100,
  'A. Martinez': 85,
  'C. Reyes':    72,
  'P. Okonkwo':  91,
}

function OperatorRow({ op, index, total }) {
  const cert = OP_CERT[op.name] || 80
  const certC = cert >= 80 ? P.sage : P.amber
  const hasFlag = op.flag

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '11px 16px',
      borderBottom: index < total - 1 ? `1px solid ${P.border2}` : 'none',
      background: hasFlag ? `${P.amber}09` : 'transparent',
    }}>
      {/* Name + role */}
      <div style={{ minWidth: 128 }}>
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: hasFlag ? P.amber : P.bone,
          lineHeight: 1.2,
        }}>
          {op.name}
        </div>
        <Mono size={10} color={P.dim} style={{ marginTop: 3 }}>{op.role}</Mono>
      </div>

      {/* Cert bar + value */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 2, background: P.border }}>
          <div style={{
            height: '100%',
            width: `${cert}%`,
            background: certC,
            transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <Mono size={10} color={certC} style={{ minWidth: 26, textAlign: 'right' }}>{cert}%</Mono>
      </div>

      {/* Flag badge */}
      {hasFlag && (
        <div style={{
          fontFamily: "'SF Mono', monospace",
          fontSize: 9,
          color: P.amber,
          background: `${P.amber}18`,
          border: `1px solid ${P.amber}40`,
          padding: '2px 7px',
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}>
          CERT GAP
        </div>
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
      {/* Time + dot + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <Mono size={10} color={P.dim} style={{ marginBottom: 6, textAlign: 'right', width: '100%' }}>
          {ev.time}
        </Mono>
        <div
          className={isNow ? 'v2-live' : ''}
          style={{ width: 6, height: 6, borderRadius: '50%', background: dotC, flexShrink: 0 }}
        />
        {index < total - 1 && (
          <div style={{ flex: 1, width: 1, background: P.border2, marginTop: 5, minHeight: 14 }} />
        )}
      </div>

      {/* Event text */}
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            lineHeight: 1.6,
            color: isNow ? P.bone : P.cream,
            fontWeight: isNow ? 400 : 400,
          }}
          // ev.text contains internal static HTML with <strong> tags only
          dangerouslySetInnerHTML={{ __html: ev.text }}
        />
        {ev.delta && (
          <Mono size={10} color={deltaC} style={{ marginTop: 4, display: 'block' }}>
            {ev.delta}
          </Mono>
        )}
      </div>
    </div>
  )
}

// ── Score explainer accordion ─────────────────────────────────────────────────
function ScoreExplainer({ score }) {
  const [open, setOpen] = useState(false)
  const baseScore = score - SCORE_FACTORS.reduce((s, f) => s + f.contribution, 0)

  return (
    <div style={{ borderTop: `1px solid ${P.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${P.surface}`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={11} color={P.dim} />
          <Mono size={11} color={P.dim}>Why {score}?</Mono>
        </div>
        {open ? <ChevronUp size={11} color={P.dim} /> : <ChevronDown size={11} color={P.dim} />}
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${P.border2}` }}>
          {/* Base row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 20px', borderBottom: `1px solid ${P.border2}` }}>
            <Mono size={12} color={P.dim} style={{ minWidth: 28, textAlign: 'right' }}>{baseScore}</Mono>
            <Mono size={10} color={P.dim}>Base · no shift conditions</Mono>
          </div>

          {SCORE_FACTORS.map((f, i) => {
            const valC = f.tone === 'danger' ? P.rust : f.tone === 'warn' ? P.amber : P.dim
            const confC = f.confidence === 'HIGH' ? P.sage : f.confidence === 'MEDIUM' ? P.amber : P.dim

            return (
              <div key={i} style={{
                padding: '9px 20px',
                borderBottom: i < SCORE_FACTORS.length - 1 ? `1px solid ${P.border2}` : 'none',
                background: f.tone === 'danger' ? `${P.rust}06` : 'transparent',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <Mono size={12} color={f.contribution > 0 ? valC : P.dim} style={{ fontWeight: 700, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                  {f.contribution > 0 ? `+${f.contribution}` : '—'}
                </Mono>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: f.contribution > 0 ? P.bone : P.dim,
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}>
                    {f.label}
                  </div>
                  <Mono size={10} color={P.dim} style={{ lineHeight: 1.5 }}>{f.state}</Mono>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: confC, flexShrink: 0 }} />
                    <Mono size={9} color={P.dim}>{f.confidence} · {f.source}</Mono>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ShiftIQV2({ score = 78, lineLabel = 'Line 4 · AM Shift', supervisor = 'D. Kowalski', plant = 'Salina KS' }) {
  const { checklistSigned, allergenOverride } = useAppState()

  const signedCount = 7 + Object.keys(checklistSigned).length
  const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
  const riskC = sColor(score)
  const checklistPct = Math.round((signedCount / 13) * 100)

  // Narrative statement — the single most important sentence on this screen
  const statement = score >= 75
    ? 'Three signals compounding. Checklist and staffing gaps account for 71% of risk. Act within 28 minutes.'
    : score >= 60
    ? 'Two signals in watch state. Resolve COA gap before handoff. Sensor A-7 at count 3 of 5 threshold.'
    : 'Shift running clean. No blocking conditions. Maintain certification coverage through handoff.'

  return (
    <>
      <style>{V2_CSS}</style>

      <div style={{ background: P.bg, color: P.bone, fontFamily: "'Inter', system-ui, sans-serif" }} className="flex flex-col h-full overflow-hidden">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <header
          style={{
            background: `linear-gradient(180deg, ${P.surface} 0%, ${P.bg} 100%)`,
            borderBottom: `1px solid ${P.border}`,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>

          {/* Atmospheric risk glow — slow, ambient, never distracting */}
          <div
            className="v2-atmo"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse 55% 100% at 8% 60%, ${riskC}22 0%, transparent 65%)`,
            }}
          />

          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 0', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mono size={11} color={P.blue} style={{ letterSpacing: '0.06em' }}>{lineLabel}</Mono>
              <div style={{ width: 1, height: 11, background: P.border }} />
              <Mono size={11} color={P.dim}>{plant}</Mono>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="v2-live" style={{ width: 5, height: 5, borderRadius: '50%', background: P.cyan }} />
              <Mono size={11} color={P.dim}>06:42 · live</Mono>
            </div>
          </div>

          {/* Score + narrative statement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '18px 24px 16px', position: 'relative' }}>

            {/* Score block — the instrument */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1,
                color: riskC,
                letterSpacing: '-0.03em',
              }}>
                {score}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: riskC }} />
                <Mono size={10} color={riskC} style={{ letterSpacing: '0.1em' }}>{sLabel(score)}</Mono>
                <Mono size={10} color={P.dim} style={{ marginLeft: 2 }}>· Risk score</Mono>
              </div>
            </div>

            {/* Vertical rule + narrative */}
            <div style={{ borderLeft: `1px solid ${P.border}`, paddingLeft: 28, maxWidth: 400, flex: 1 }}>
              {/* The statement — both voices in one sentence */}
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 15,
                lineHeight: 1.6,
                color: P.bone,
                fontWeight: 400,
                margin: 0,
                marginBottom: 12,
              }}>
                {statement}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div>
                  <Mono size={10} color={P.dim}>Scan interval</Mono>
                  <Mono size={10} color={P.cyan} style={{ marginLeft: 5 }}>4 min</Mono>
                </div>
                <div>
                  <Mono size={10} color={P.dim}>Score trend</Mono>
                  <Mono size={10} color={P.rust} style={{ marginLeft: 5 }}>↑ +4 since 06:30</Mono>
                </div>
              </div>
            </div>

            {/* Sparkline — far right, ambient */}
            <div style={{ flexShrink: 0, marginLeft: 'auto', opacity: 0.65 }}>
              <svg width="90" height="36" viewBox="0 0 90 36" aria-hidden="true">
                <polyline
                  points="0,30 15,25 30,21 45,18 60,14 75,10 90,7"
                  fill="none"
                  stroke={riskC}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="90" cy="7" r="3" fill={riskC} />
              </svg>
              <Mono size={9} color={P.dim} style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>06:12 → now</Mono>
            </div>
          </div>

          {/* Signal health strip — ambient status, never dominant */}
          <div style={{ borderTop: `1px solid ${P.border2}`, padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
            {[
              { label: 'SCADA · Oven B', healthy: false },
              { label: 'MES · Schedule', healthy: true },
              { label: 'HR · Roster',    healthy: true },
              { label: 'Checklists',     healthy: true },
            ].map((sig, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: sig.healthy ? P.sage : P.amber, flexShrink: 0 }} />
                <Mono size={10} color={sig.healthy ? P.dim : P.amber}>{sig.label}</Mono>
              </div>
            ))}
          </div>
        </header>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT: Intelligence + Crew ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${P.border}` }}>

            {/* Intelligence */}
            <div style={{ padding: '20px 24px 16px' }}>
              <SectionLabel>Intelligence · {findings.length} findings</SectionLabel>

              {findings.map((f, i) => (
                <FindingCard key={f.id} f={f} index={i} />
              ))}
            </div>

            <Divider />

            {/* Crew */}
            <div style={{ padding: '18px 24px 16px' }}>
              <SectionLabel>Crew · {crew.length} operators</SectionLabel>

              <div style={{ border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                {crew.map((op, i) => (
                  <OperatorRow key={op.name} op={op} index={i} total={crew.length} />
                ))}
              </div>
            </div>

            <Divider />

            {/* Checklist status */}
            <div style={{ padding: '18px 24px 24px' }}>
              <SectionLabel>Startup checklists</SectionLabel>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 16px', background: P.surface, border: `1px solid ${P.border}` }}>
                {/* Count */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'Georgia, Times New Roman, serif',
                    fontSize: 36,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: signedCount < 11 ? P.amber : P.sage,
                  }}>
                    {signedCount}
                  </span>
                  <Mono size={13} color={P.dim} style={{ marginLeft: 6 }}>/ 13</Mono>
                </div>

                {/* Bar */}
                <div style={{ flex: 1 }}>
                  <div style={{ height: 3, background: P.border, marginBottom: 6 }}>
                    <div style={{
                      height: '100%',
                      width: `${checklistPct}%`,
                      background: signedCount < 11 ? P.amber : P.sage,
                      transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                  <Mono size={10} color={P.dim}>{checklistPct}% complete · 4 overdue at T+42 min</Mono>
                </div>

                {/* Allergen flag */}
                {!allergenSigned && (
                  <div style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 10,
                    color: P.rust,
                    background: `${P.rust}14`,
                    border: `1px solid ${P.rust}35`,
                    padding: '4px 10px',
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}>
                    ALLERGEN UNSIGNED
                  </div>
                )}
              </div>

              {/* Narrative context for checklist state */}
              <div style={{ marginTop: 10, paddingLeft: 2 }}>
                <Narrative size={11} color={P.clay} style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                  4 overdue items at T+42 correlates with 18% elevated scrap rate on comparable Line 4 Pepperoni runs.
                </Narrative>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Timeline + Score breakdown ─────────────────────────── */}
          <div style={{ width: 304, flexShrink: 0, overflowY: 'auto', background: P.bg }}>

            {/* Agent timeline */}
            <div style={{ padding: '20px 20px 16px' }}>
              <SectionLabel>Agent · Timeline</SectionLabel>

              {agentEvents.map((ev, i) => (
                <TimelineEntry key={i} ev={ev} index={i} total={agentEvents.length} />
              ))}
            </div>

            <Divider />

            {/* Score breakdown */}
            <ScoreExplainer score={score} />
          </div>
        </div>
      </div>
    </>
  )
}
