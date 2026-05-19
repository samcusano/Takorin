const P = {
  bg:       '#0B0F18',
  surface:  '#131A26',
  border:   '#263042',
  border2:  '#1A2335',
  bone:     '#EDE4CB',
  dim:      '#4A5D74',
  blue:     '#4B9CE4',
  cyan:     '#3BBFDA',
  amber:    '#C98E2A',
  sage:     '#5FA877',
  rust:     '#DE6C4E',
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
const sLabel = (s) => s >= 75 ? 'AT RISK' : s >= 60 ? 'WATCH' : 'CLEAR'

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

function Mono({ children, size = 10, color, style = {} }) {
  return (
    <span style={{
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
      fontSize: size,
      color: color || P.dim,
      letterSpacing: '0.04em',
      ...style,
    }}>
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
        background: `linear-gradient(180deg, ${P.surface} 0%, ${P.bg} 100%)`,
        borderBottom: `1px solid ${P.border}`,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Atmospheric risk glow */}
        <div className="hero-atmo" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 55% 100% at 8% 60%, ${riskC}22 0%, transparent 65%)`,
        }} />

        {/* Score + narrative */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '20px 24px 16px', position: 'relative' }}>
          {/* Score block */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
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
              <Mono size={10} color={P.dim} style={{ marginLeft: 2 }}>· {domainLabel}</Mono>
            </div>
          </div>

          {/* Vertical rule + statement */}
          <div style={{ borderLeft: `1px solid ${P.border}`, paddingLeft: 28, maxWidth: 400, flex: 1 }}>
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
