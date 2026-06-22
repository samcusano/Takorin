// Design Lab: Final design-system recommendation (dev-only, route /__design_lab).
// Distilled to the decision — Foundry, flat by default, branded system colors,
// the recommended radius/border scale, and the three places gradients are allowed.

const F = {
  bg: '#0B0F18', surface: '#131A26', raised: '#1B2538', border: '#263042', borderStrong: '#2F3A52',
  text: '#EDE4CB', muted: '#7A8EA8', dim: '#4A5D74',
  accent: '#4B9CE4', accentHover: '#6FB0EA', accentDim: '#0D1E38', accentText: '#06121F',
  ok: '#4B9CE4', okDim: '#0D1E38',          // branded success = the accent
  warn: '#D4902A', warnDim: '#2C2008',
  danger: '#EA5455', dangerDim: '#2C0E0E',  // clean red, restored
  info: '#7C86E8', infoDim: '#141830',
  warm: '#C4844E',
}
const T = { display: "'Bricolage Grotesque', system-ui", body: "'Plus Jakarta Sans', system-ui", mono: "'JetBrains Mono', monospace" }
const R = { ctrl: 2, card: 6, surface: 10 }   // recommended radius scale

const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` }
const gText = (grad) => ({ background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' })

const label = { fontFamily: T.body, fontSize: 11, fontWeight: 600, color: F.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }
const card = { background: F.surface, border: `1px solid ${F.border}`, borderRadius: R.card }

// ─── The recommended system, applied (FLAT) ──────────────────────────────────
function RecommendedSlice() {
  const series = [42, 48, 45, 60, 55, 71, 66, 78]
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / 84) * 36}`).join(' ')
  const chips = [
    { t: 'Clear', c: F.ok, d: F.okDim },
    { t: 'Watch', c: F.warn, d: F.warnDim },
    { t: 'At risk', c: F.danger, d: F.dangerDim },
    { t: 'Predicted', c: F.info, d: F.infoDim },
  ]
  return (
    <div>
      {/* Header band */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: F.accent }} />
          <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 18, color: F.text, letterSpacing: '-0.01em' }}>Plant Overview</div>
          <div style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11, color: F.dim }}>Salina · 06:42</div>
        </div>
        <div style={{ fontFamily: T.body, fontSize: 12.5, color: F.muted, lineHeight: 1.5 }}>Risk concentrated in 2 areas. Three signals compounding on Line 4.</div>
      </div>

      {/* KPI strip — numbers carry status color, flat */}
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        {[
          { l: 'OEE', v: '81%', tone: F.ok },
          { l: 'Risk score', v: '78', tone: F.danger },
          { l: 'Open findings', v: '4', tone: F.warn },
        ].map((m, i) => (
          <div key={m.l} style={{ padding: '12px 16px', borderRight: i < 2 ? `1px solid ${F.border}` : 'none' }}>
            <div style={{ ...label, marginBottom: 6 }}>{m.l}</div>
            <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 26, color: m.tone, lineHeight: 1 }}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* Finding + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Finding — 3px danger left-rail (the one sanctioned thick colored border) */}
        <div style={{ ...card, borderLeft: `3px solid ${F.danger}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${F.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
              <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 14, color: F.text, lineHeight: 1.3 }}>Complete startup checklists — Oven Station B</div>
              <div style={{ background: F.dangerDim, color: F.danger, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, flexShrink: 0, fontFamily: T.body }}>At risk</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: F.accent, padding: '3px 7px', background: F.accentDim, borderRadius: R.ctrl, display: 'inline-block' }}>Operator A. Martinez · Line 4</div>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
            <button style={{ background: F.accent, color: F.accentText, fontFamily: T.body, fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: R.ctrl, border: 'none', cursor: 'pointer' }}>Assign to Kowalski</button>
            <button style={{ background: 'transparent', color: F.muted, fontFamily: T.body, fontSize: 12.5, fontWeight: 500, padding: '7px 12px', borderRadius: R.ctrl, border: `1px solid ${F.borderStrong}`, cursor: 'pointer' }}>Log only</button>
          </div>
        </div>

        {/* Chart — FLAT solid accent stroke (gradient area-fill is a §2 exception) */}
        <div style={{ ...card, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...label, marginBottom: 4 }}>Risk trend · 8 shifts</div>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: 64, marginTop: 'auto' }}>
            <polyline points={pts} fill="none" stroke={F.accent} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {chips.map(ch => (
          <span key={ch.t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: ch.d, color: ch.c, fontFamily: T.body, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: ch.c }} /> {ch.t}
          </span>
        ))}
      </div>
      {/* Nav pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Shift', 'Suppliers', 'Quality', 'CAPA', 'Agents'].map((t, i) => (
          <span key={t} style={{ background: i === 0 ? F.accent : F.surface, color: i === 0 ? F.accentText : F.muted, fontFamily: T.body, fontSize: 11.5, fontWeight: i === 0 ? 600 : 500, padding: '5px 12px', borderRadius: 999, border: `1px solid ${i === 0 ? F.accent : F.border}` }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// ─── The spec rail — what we recommend, in words ─────────────────────────────
function Swatch({ color, name, hex, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ width: 22, height: 22, borderRadius: R.ctrl, background: color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: T.body, fontSize: 12.5, fontWeight: 600, color: F.text }}>{name} {note && <span style={{ color: F.dim, fontWeight: 500 }}>· {note}</span>}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: F.muted }}>{hex.toUpperCase()}</div>
      </div>
    </div>
  )
}
function SpecGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ ...label, fontSize: 10.5, color: F.dim, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}
function SpecRail() {
  return (
    <div>
      <SpecGroup title="Palette · Foundry">
        <Swatch color={F.bg} name="Canvas" hex={F.bg} />
        <Swatch color={F.surface} name="Surface" hex={F.surface} />
        <Swatch color={F.accent} name="Accent" hex={F.accent} note="steel blue" />
        <Swatch color={F.text} name="Text" hex={F.text} note="bone" />
      </SpecGroup>
      <SpecGroup title="System colors · branded, no traffic-lights">
        <Swatch color={F.ok} name="Success" hex={F.ok} note="= accent" />
        <Swatch color={F.warn} name="Warning" hex={F.warn} note="gold" />
        <Swatch color={F.danger} name="Danger" hex={F.danger} note="clean red" />
        <Swatch color={F.info} name="Info" hex={F.info} note="periwinkle" />
      </SpecGroup>
      <SpecGroup title="Radius">
        <Spec line="2px" v="controls — buttons, chips, inputs" />
        <Spec line="6px" v="cards & panels (the workhorse)" />
        <Spec line="10px" v="large surfaces — modals, overlays" />
        <Spec line="pill" v="avatars, status dots, toggles only" />
      </SpecGroup>
      <SpecGroup title="Borders">
        <Spec line="1px" v="hairline — the primary structure" />
        <Spec line="soft / strong" v="dividers / inputs + emphasis" />
        <Spec line="3px" v="colored left-rail — status only" />
        <Spec line="2px" v="accent focus ring" />
      </SpecGroup>
      <SpecGroup title="Gradients">
        <div style={{ fontFamily: T.body, fontSize: 12, color: F.muted, lineHeight: 1.6 }}>
          <span style={{ color: F.text, fontWeight: 600 }}>Flat by default.</span> Three exceptions only — see below.
        </div>
      </SpecGroup>
    </div>
  )
}
function Spec({ line, v }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: F.accent, width: 72, flexShrink: 0 }}>{line}</span>
      <span style={{ fontFamily: T.body, fontSize: 12, color: F.muted, lineHeight: 1.4 }}>{v}</span>
    </div>
  )
}

// ─── The gradient recommendation — where it's allowed, and where it isn't ─────
function GradientRecommendation() {
  const A = rgbOf(F.accent), I = rgbOf(F.info), W = rgbOf(F.warm)
  const series = [40, 46, 44, 58, 53, 69, 64, 78]
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / 84) * 36}`).join(' ')
  const area = `0,40 ${pts} 100,40`
  const mesh = `radial-gradient(60% 60% at 18% 20%, rgba(${A},0.9), transparent 60%), radial-gradient(55% 55% at 86% 22%, rgba(${I},0.8), transparent 60%), radial-gradient(70% 70% at 55% 100%, rgba(${W},0.7), transparent 62%), ${F.raised}`

  const Tile = ({ title, cap, children }) => (
    <div style={{ ...card }}>
      <div style={{ height: 96, borderTopLeftRadius: R.card, borderTopRightRadius: R.card, overflow: 'hidden', borderBottom: `1px solid ${F.border}` }}>{children}</div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontFamily: T.body, fontSize: 12.5, fontWeight: 600, color: F.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: F.ok }} /> {title}
        </div>
        <div style={{ fontFamily: T.body, fontSize: 11.5, color: F.muted, lineHeight: 1.4, marginTop: 2 }}>{cap}</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
      {/* 1. Chart area-fill */}
      <Tile title="Trend area-fill" cap="A single accent→transparent fill under a line. Conventional, and it aids reading.">
        <div style={{ height: '100%', padding: '12px 14px', background: F.surface }}>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs><linearGradient id="recArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={F.accent} stopOpacity="0.4" /><stop offset="100%" stopColor={F.accent} stopOpacity="0" /></linearGradient></defs>
            <polygon points={area} fill="url(#recArea)" />
            <polyline points={pts} fill="none" stroke={F.accent} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Tile>
      {/* 2. One hero number */}
      <Tile title="One hero number" cap="At most one signature gradient metric per screen — never on ordinary KPIs.">
        <div style={{ height: '100%', background: F.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: T.mono, fontSize: 44, fontWeight: 700, lineHeight: 1, ...gText(`linear-gradient(135deg, ${F.accent}, ${F.info})`) }}>78</span>
        </div>
      </Tile>
      {/* 3. Brand / marketing surfaces */}
      <Tile title="Brand surfaces only" cap="Login, empty states, marketing — let brand breathe with a mesh. Not in the product data.">
        <div style={{ height: '100%', background: mesh }} />
      </Tile>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DesignLabBrand() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: F.bg }}>
      {/* Header — the recommendation in one line */}
      <div style={{ background: F.surface, borderBottom: `1px solid ${F.border}`, padding: '24px 40px' }}>
        <div style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: F.accent, marginBottom: 8 }}>
          Design System · Recommendation
        </div>
        <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 26, color: F.text, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Foundry, flat, with gradients earned
        </div>
        <div style={{ fontFamily: T.body, fontSize: 14, color: F.muted, lineHeight: 1.6, maxWidth: 720 }}>
          Ship <span style={{ color: F.text, fontWeight: 600 }}>Foundry</span> — steel‑blue on warm graphite, mapped 1:1 to <span style={{ fontFamily: T.mono, fontSize: 12.5, color: F.text }}>tokens.css</span>. System colors are branded but keep their meaning: <span style={{ color: F.ok, fontWeight: 600 }}>success = the accent</span>, gold warning, a <span style={{ color: F.danger, fontWeight: 600 }}>clean red danger</span>, periwinkle info. Tight radius, 1px hairline borders. <span style={{ color: F.text, fontWeight: 600 }}>Gradients stay flat by default</span> — used in exactly three places.
        </div>
      </div>

      {/* The system applied + spec rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', background: F.bg }}>
        <div style={{ padding: '28px 32px', borderRight: `1px solid ${F.border}` }}>
          <div style={{ ...label, fontSize: 10.5, color: F.dim, marginBottom: 18 }}>The system, applied — flat</div>
          <RecommendedSlice />
        </div>
        <div style={{ padding: '28px 24px' }}>
          <SpecRail />
        </div>
      </div>

      {/* Gradient recommendation */}
      <div style={{ borderTop: `1px solid ${F.border}`, padding: '28px 32px', background: F.bg }}>
        <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 18, color: F.text, letterSpacing: '-0.01em', marginBottom: 4 }}>Where gradients are allowed</div>
        <div style={{ fontFamily: T.body, fontSize: 13, color: F.muted, lineHeight: 1.6, maxWidth: 680, marginBottom: 20 }}>
          Gradients carry energy, so they go only on what should be looked at first — three places, and nowhere else.
        </div>
        <GradientRecommendation />
        <div style={{ ...card, padding: '14px 18px', borderLeft: `3px solid ${F.warn}` }}>
          <div style={{ ...label, fontSize: 10.5, color: F.warn, marginBottom: 8 }}>Stays flat — everywhere else</div>
          <div style={{ fontFamily: T.body, fontSize: 12.5, color: F.muted, lineHeight: 1.6 }}>
            KPI cells · tables & data rows · status chips · buttons you click constantly · cards & surfaces · gradient text on ordinary metrics · borders. Gradient everywhere flattens the hierarchy it exists to create — the restraint is the craft.
          </div>
        </div>
      </div>
    </div>
  )
}
