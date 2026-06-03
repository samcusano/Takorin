const P = {
  bg:       'var(--color-stone)',
  surface:  'var(--color-stone-2)',
  border:   'var(--color-rule)',
  border2:  'var(--color-rule-2)',
  bone:     'var(--color-ink)',
  dim:      'var(--color-dim)',
  blue:     'var(--color-signal)',
  cyan:     'var(--color-stream)',
  amber:    'var(--color-warn)',
  sage:     'var(--color-ok)',
  rust:     'var(--color-danger)',
}

const HERO_CSS = `
  @keyframes heroAtmoPulse {
    0%, 100% { opacity: 0.04; }
    50%       { opacity: 0.10; }
  }
  @keyframes heroLiveDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  .hero-atmo { animation: heroAtmoPulse 9s ease-in-out infinite; }
  .hero-live  { animation: heroLiveDot 2.4s ease-in-out infinite; }
`

const sColor = (s) => s >= 75 ? P.rust : s >= 60 ? P.amber : P.sage
const sLabel = (s) => s >= 75 ? 'At risk' : s >= 60 ? 'Watch' : 'Clear'

// Sparkline shapes keyed to trend direction
const SPARK_POINTS = {
  up:   '0,30 15,25 30,21 45,18 60,14 75,10 90,7',
  down: '0,7 15,11 30,15 45,18 60,22 75,26 90,30',
  flat: '0,18 15,17 30,19 45,18 60,18 75,17 90,18',
}

function sparkDirection(trend) {
  if (trend.startsWith('↑')) return 'up'
  if (trend.startsWith('↓')) return 'down'
  return 'flat'
}

function Mono({ children, color, style = {} }) {
  return (
    <span className="font-body text-label" style={{ color: color || P.dim, ...style }}>
      {children}
    </span>
  )
}

export default function ShiftHero({
  score = 78,
  statement = '',
  scanInterval = '4 min',
  trend = '→ stable',
  domainLabel = 'Risk score',
}) {
  const riskC = sColor(score)
  const sparkPoints = SPARK_POINTS[sparkDirection(trend)]
  const sparkEndY = sparkDirection(trend) === 'up' ? 7 : sparkDirection(trend) === 'down' ? 30 : 18

  return (
    <>
      <style>{HERO_CSS}</style>
      <header style={{
        background: 'linear-gradient(180deg, var(--color-stone-2) 0%, var(--color-stone) 100%)',
        borderBottom: '1px solid var(--color-rule)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Atmospheric risk glow */}
        <div className="hero-atmo" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 55% 100% at 8% 60%, color-mix(in srgb, ${riskC} 13%, transparent) 0%, transparent 65%)`,
        }} />

        {/* Score + narrative */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', padding: 'var(--space-5) var(--space-6) var(--space-4)', position: 'relative' }}>
          {/* Score block */}
          <div style={{ flexShrink: 0 }}>
            <div className="display-num text-score leading-none" style={{ color: riskC }}>
              {score}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 'var(--space-2)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: riskC }} />
              <Mono color={riskC}>{sLabel(score)}</Mono>
              <Mono size={10} color={P.dim} style={{ marginLeft: 2 }}>· {domainLabel}</Mono>
            </div>
          </div>

          {/* Vertical rule + statement */}
          <div style={{ borderLeft: '1px solid var(--color-rule)', paddingLeft: 'var(--space-7)', maxWidth: 400, flex: 1 }}>
            <p className="font-display text-sub text-ink leading-relaxed" style={{ margin: 0, marginBottom: 12 }}>
              {statement}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
              <div>
                <Mono size={10} color={P.dim}>Scan interval</Mono>
                <Mono size={10} color={P.cyan} style={{ marginLeft: 5 }}>{scanInterval}</Mono>
              </div>
              <div>
                <Mono size={10} color={P.dim}>Score trend</Mono>
                <Mono size={10} color={trend.startsWith('↑') ? P.rust : trend.startsWith('↓') ? P.sage : P.dim} style={{ marginLeft: 5 }}>{trend}</Mono>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ flexShrink: 0, marginLeft: 'auto', opacity: 0.65 }}>
            <svg width="90" height="36" viewBox="0 0 90 36" aria-hidden="true">
              <polyline
                points={sparkPoints}
                fill="none"
                stroke={riskC}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="90" cy={sparkEndY} r="3" fill={riskC} />
            </svg>
            <Mono size={9} color={P.dim} style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>06:12 → now</Mono>
          </div>
        </div>
      </header>
    </>
  )
}
