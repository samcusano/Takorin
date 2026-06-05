// Design Lab: Brand palette exploration
// Route: /__design_lab — delete after brand decision is made
// 5 distinct brand directions for Takorin

import { useState, useRef } from 'react'
import { X, MessageSquare, Send } from 'lucide-react'

// ─── Brand definitions ────────────────────────────────────────────────────────

const BRANDS = [
  {
    id: 'A',
    name: 'Foundry',
    tagline: 'Warm graphite precision instrument',
    reasoning: 'The current direction taken to its logical conclusion. Warm bone ink on dark graphite — the visual language of physical plant gauges, aviation glass cockpits, and Bloomberg terminals. This is the right positioning for an operational intelligence platform: not a consumer app, not a startup dashboard, but an instrument. The warmth separates it from cold enterprise software while maintaining the gravity the domain demands.',
    palette: {
      bg:            '#0B0F18',
      surface:       '#131A26',
      surfaceRaised: '#1B2538',
      border:        '#263042',
      borderStrong:  '#2F3A52',
      text:          '#EDE4CB',
      textMuted:     '#7A8EA8',
      textDim:       '#4A5D74',
      accent:        '#4B9CE4',
      accentDim:     '#0D1E38',
      accentText:    '#FFFFFF',
      ok:            '#28BFB0',
      okDim:         '#08302C',
      warn:          '#D4902A',
      warnDim:       '#2C2008',
      danger:        '#DC5C42',
      dangerDim:     '#2C0E08',
    },
    type: {
      display: "'Bricolage Grotesque', system-ui",
      body:    "'Plus Jakarta Sans', system-ui",
      mono:    "'JetBrains Mono', monospace",
      displayWeight: 700,
      displayTracking: '-0.02em',
      labelCase: 'none',
      labelTracking: '0.02em',
    },
    shape: {
      radius: '0px',
      cardBorder: '1px solid',
      cardShadow: 'none',
      btnRadius: '0px',
      pillRadius: '2px',
    },
  },
  {
    id: 'B',
    name: 'Meridian',
    tagline: 'Warm cream enterprise authority',
    reasoning: 'A light-mode direction built for the boardroom and the buyer. When a plant director presents Takorin to a CFO or COO, the platform needs to feel like trusted enterprise infrastructure — not a dark-mode dev tool. Warm cream surfaces with deep navy authority communicate premium and permanence. The light palette also performs better in bright plant environments. This is the direction that wins procurement reviews.',
    palette: {
      bg:            '#F7F5F0',
      surface:       '#FFFFFF',
      surfaceRaised: '#EEEAE2',
      border:        '#D8D3C8',
      borderStrong:  '#C0BAB0',
      text:          '#1A1814',
      textMuted:     '#6B6558',
      textDim:       '#9E9A90',
      accent:        '#1A4FA0',
      accentDim:     '#EAF0FA',
      accentText:    '#FFFFFF',
      ok:            '#167A6A',
      okDim:         '#E0F4F0',
      warn:          '#A86010',
      warnDim:       '#FDF1E0',
      danger:        '#B82C18',
      dangerDim:     '#FDEAE8',
    },
    type: {
      display: "'Bricolage Grotesque', Georgia, serif",
      body:    "'Plus Jakarta Sans', system-ui",
      mono:    "'JetBrains Mono', monospace",
      displayWeight: 800,
      displayTracking: '-0.03em',
      labelCase: 'none',
      labelTracking: '0',
    },
    shape: {
      radius: '4px',
      cardBorder: '1px solid',
      cardShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      btnRadius: '4px',
      pillRadius: '999px',
    },
  },
  {
    id: 'C',
    name: 'Carbon',
    tagline: 'Cool technical precision',
    reasoning: 'Positions Takorin as the engineering control layer — closer to process control systems and SCADA software than enterprise SaaS. Cool blue-black surfaces, electric blue accent, and monospaced data presentation signal that this is serious technical infrastructure. Appeals to OT engineers, IT security buyers, and the technically-literate food manufacturing director who came up through operations. The GitHub Dark lineage is intentional — it signals "built by engineers, trusted by engineers."',
    palette: {
      bg:            '#0D1117',
      surface:       '#161B22',
      surfaceRaised: '#21262D',
      border:        '#30363D',
      borderStrong:  '#3D444D',
      text:          '#E6EDF3',
      textMuted:     '#8B949E',
      textDim:       '#5A6472',
      accent:        '#58A6FF',
      accentDim:     '#0C1929',
      accentText:    '#0D1117',
      ok:            '#3FB950',
      okDim:         '#0A1F0E',
      warn:          '#D29922',
      warnDim:       '#1F1A08',
      danger:        '#F85149',
      dangerDim:     '#2A0C0B',
    },
    type: {
      display: "'Plus Jakarta Sans', system-ui",
      body:    "'Plus Jakarta Sans', system-ui",
      mono:    "'JetBrains Mono', monospace",
      displayWeight: 700,
      displayTracking: '-0.01em',
      labelCase: 'uppercase',
      labelTracking: '0.06em',
    },
    shape: {
      radius: '6px',
      cardBorder: '1px solid',
      cardShadow: 'none',
      btnRadius: '6px',
      pillRadius: '4px',
    },
  },
  {
    id: 'D',
    name: 'Ember',
    tagline: 'Industrial amber authority',
    reasoning: 'Food manufacturing has a physical heritage — ovens, conveyor belts, amber indicator lights, analog gauges. This palette acknowledges that heritage while maintaining digital precision. The very dark warm brown-black surfaces feel substantial and grounded. Amber gold as the primary accent references industrial control panels and instrument dials. Zero radius and bold borders communicate non-negotiable authority. This is the brand for the director who came up through the plant floor and trusts what feels solid.',
    palette: {
      bg:            '#0F0D09',
      surface:       '#1A1710',
      surfaceRaised: '#252018',
      border:        '#3A3220',
      borderStrong:  '#4A4028',
      text:          '#F0E8D4',
      textMuted:     '#A09068',
      textDim:       '#70624A',
      accent:        '#D4922A',
      accentDim:     '#201808',
      accentText:    '#0F0D09',
      ok:            '#4EA870',
      okDim:         '#0A1A10',
      warn:          '#D4922A',
      warnDim:       '#201808',
      danger:        '#C84030',
      dangerDim:     '#200A08',
    },
    type: {
      display: "'Bricolage Grotesque', system-ui",
      body:    "'Plus Jakarta Sans', system-ui",
      mono:    "'JetBrains Mono', monospace",
      displayWeight: 800,
      displayTracking: '-0.01em',
      labelCase: 'none',
      labelTracking: '0.04em',
    },
    shape: {
      radius: '0px',
      cardBorder: '2px solid',
      cardShadow: 'none',
      btnRadius: '0px',
      pillRadius: '0px',
    },
  },
  {
    id: 'E',
    name: 'Verdant',
    tagline: 'Grounded, trustworthy, sustainable',
    reasoning: 'The food supply chain is where health and sustainability converge. This palette positions Takorin as the platform that brings calm intelligence to a system that feeds people. Very dark green-black surfaces are still serious and precise, but the sage green accent signals ecological awareness without greenwashing. The slightly softer shape language (4px radius) introduces approachability without sacrificing authority. This is the brand for food manufacturers who are also thinking about traceability, sustainability certification, and consumer trust — not just operational efficiency.',
    palette: {
      bg:            '#090E0B',
      surface:       '#101812',
      surfaceRaised: '#172018',
      border:        '#243528',
      borderStrong:  '#2E4434',
      text:          '#E2EDE0',
      textMuted:     '#72987A',
      textDim:       '#4A6850',
      accent:        '#3DA862',
      accentDim:     '#0A1F10',
      accentText:    '#FFFFFF',
      ok:            '#3DA862',
      okDim:         '#0A1F10',
      warn:          '#D09824',
      warnDim:       '#1E1808',
      danger:        '#D45840',
      dangerDim:     '#200E08',
    },
    type: {
      display: "'Bricolage Grotesque', system-ui",
      body:    "'Plus Jakarta Sans', system-ui",
      mono:    "'JetBrains Mono', monospace",
      displayWeight: 700,
      displayTracking: '-0.02em',
      labelCase: 'none',
      labelTracking: '0.02em',
    },
    shape: {
      radius: '4px',
      cardBorder: '1px solid',
      cardShadow: 'none',
      btnRadius: '4px',
      pillRadius: '999px',
    },
  },
]

// ─── Palette swatch display ───────────────────────────────────────────────────

function Swatch({ color, label, size = 'md' }) {
  const dim = size === 'sm' ? 32 : 40
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: dim, height: dim, background: color, border: '1px solid rgba(255,255,255,0.08)' }} />
      <div style={{ fontSize: 10, color: 'currentColor', opacity: 0.5, fontFamily: 'monospace', textAlign: 'center' }}>
        {label}
      </div>
    </div>
  )
}

// ─── Typography specimen ──────────────────────────────────────────────────────

function TypeSpecimen({ brand }) {
  const { palette, type } = brand
  return (
    <div style={{ color: palette.text }}>
      {/* Display heading */}
      <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 28, letterSpacing: type.displayTracking, lineHeight: 1.15, marginBottom: 8, color: palette.text }}>
        Precision Operations
      </div>
      {/* Subheading */}
      <div style={{ fontFamily: type.body, fontWeight: 600, fontSize: 16, lineHeight: 1.4, marginBottom: 12, color: palette.text }}>
        Line 4 · AM Shift · Risk assessment active
      </div>
      {/* Body text */}
      <div style={{ fontFamily: type.body, fontWeight: 400, fontSize: 14, lineHeight: 1.5, marginBottom: 12, color: palette.textMuted }}>
        Three signals compounding. Checklist and staffing gaps account for 71% of current risk exposure. Act within the 28-minute intervention window.
      </div>
      {/* Data label */}
      <div style={{ fontFamily: type.body, fontWeight: 500, fontSize: 12, lineHeight: 1.35, letterSpacing: type.labelTracking, textTransform: type.labelCase, color: palette.textMuted, marginBottom: 10 }}>
        Score trend · Scan interval · Signal health
      </div>
      {/* Metric number */}
      <div style={{ fontFamily: type.mono, fontWeight: 700, fontSize: 48, lineHeight: 1, color: palette.danger, letterSpacing: '-0.02em' }}>
        78
      </div>
      <div style={{ fontFamily: type.body, fontWeight: 500, fontSize: 12, color: palette.danger, marginTop: 4, letterSpacing: type.labelTracking, textTransform: type.labelCase }}>
        At risk
      </div>
    </div>
  )
}

// ─── Card specimen ────────────────────────────────────────────────────────────

function CardSpecimen({ brand }) {
  const { palette, type, shape } = brand
  const isLight = palette.bg.startsWith('#F') || palette.bg.startsWith('#E')

  const cardStyle = {
    background: palette.surface,
    border: `${shape.cardBorder} ${palette.border}`,
    borderRadius: shape.radius,
    boxShadow: shape.cardShadow,
    overflow: 'hidden',
    marginBottom: 12,
  }

  const labelStyle = {
    fontFamily: type.body,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: type.labelTracking,
    textTransform: type.labelCase,
    color: palette.textMuted,
  }

  return (
    <div>
      {/* KPI strip */}
      <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'OEE', val: '81%', tone: palette.ok },
          { label: 'Risk score', val: '78', tone: palette.danger },
          { label: 'Open findings', val: '4', tone: palette.warn },
        ].map((m, i) => (
          <div key={m.label} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${palette.border}` : 'none' }}>
            <div style={{ ...labelStyle, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontFamily: type.mono, fontWeight: 700, fontSize: 24, color: m.tone, lineHeight: 1 }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Finding card */}
      <div style={{ ...cardStyle, borderLeft: `3px solid ${palette.danger}` }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15, color: palette.text, lineHeight: 1.3 }}>
              Complete startup checklists — Oven Station B + Topping Line
            </div>
            <div style={{ background: palette.dangerDim, color: palette.danger, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: shape.pillRadius, flexShrink: 0, fontFamily: type.body, letterSpacing: '0.02em' }}>
              Danger
            </div>
          </div>
          <div style={{ ...labelStyle }}>Checklists · Live · 4 of 11 cleared at T+42</div>
        </div>
        <div style={{ padding: '12px 16px', background: palette.surfaceRaised, borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ fontFamily: type.body, fontSize: 13, color: palette.textMuted, lineHeight: 1.5 }}>
            Incomplete checklists at 60 minutes correlate with 18% elevated scrap rate across 340 comparable shifts.
          </div>
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ background: palette.accent, color: palette.accentText, fontFamily: type.body, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: shape.btnRadius, border: 'none', cursor: 'pointer', letterSpacing: '0.01em' }}>
            Assign to Kowalski
          </button>
          <button style={{ background: 'transparent', color: palette.textMuted, fontFamily: type.body, fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: shape.btnRadius, border: `1px solid ${palette.border}`, cursor: 'pointer' }}>
            Log only
          </button>
        </div>
      </div>

      {/* Navigation pill row */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Shift', 'Suppliers', 'Quality', 'CAPA', 'Agents'].map((label, i) => (
          <div key={label} style={{
            background: i === 0 ? palette.accent : palette.surface,
            color: i === 0 ? palette.accentText : palette.textMuted,
            fontFamily: type.body,
            fontSize: 12,
            fontWeight: i === 0 ? 600 : 500,
            padding: '5px 12px',
            borderRadius: shape.pillRadius,
            border: `1px solid ${i === 0 ? palette.accent : palette.border}`,
            letterSpacing: type.labelTracking,
            textTransform: type.labelCase,
          }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Brand variant section ────────────────────────────────────────────────────

function BrandSection({ brand }) {
  const { palette, type } = brand
  return (
    <div data-variant={brand.id} style={{ background: palette.bg }}>
      {/* Section header */}
      <div style={{ background: palette.surface, borderBottom: `1px solid ${palette.border}`, padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontFamily: type.body, fontWeight: 700, fontSize: 12, color: palette.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Variant {brand.id}
          </div>
          <div style={{ width: 1, height: 16, background: palette.border }} />
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 22, color: palette.text, letterSpacing: type.displayTracking }}>
            {brand.name}
          </div>
          <div style={{ fontFamily: type.body, fontSize: 14, color: palette.textMuted, marginLeft: 4 }}>
            — {brand.tagline}
          </div>
        </div>
        <div style={{ fontFamily: type.body, fontSize: 14, lineHeight: 1.65, color: palette.textMuted, maxWidth: 720 }}>
          {brand.reasoning}
        </div>
      </div>

      {/* Three-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 0 }}>

        {/* Palette swatches */}
        <div style={{ padding: '28px 24px', borderRight: `1px solid ${palette.border}` }}>
          <div style={{ fontFamily: type.body, fontWeight: 600, fontSize: 11, color: palette.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Palette
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Surfaces */}
            <div style={{ fontFamily: type.body, fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Surfaces</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[['bg', palette.bg], ['surface', palette.surface], ['raised', palette.surfaceRaised]].map(([l, c]) => (
                <Swatch key={l} color={c} label={l} size="sm" />
              ))}
            </div>
            <div style={{ fontFamily: type.body, fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Text</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[['primary', palette.text], ['muted', palette.textMuted], ['dim', palette.textDim]].map(([l, c]) => (
                <Swatch key={l} color={c} label={l} size="sm" />
              ))}
            </div>
            <div style={{ fontFamily: type.body, fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Accent</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[['accent', palette.accent], ['dim', palette.accentDim]].map(([l, c]) => (
                <Swatch key={l} color={c} label={l} size="sm" />
              ))}
            </div>
            <div style={{ fontFamily: type.body, fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Semantic</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['ok', palette.ok], ['warn', palette.warn], ['danger', palette.danger]].map(([l, c]) => (
                <Swatch key={l} color={c} label={l} size="sm" />
              ))}
            </div>
          </div>

          {/* Shape tokens */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: type.body, fontWeight: 600, fontSize: 11, color: palette.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Shape
            </div>
            {[
              ['Radius', brand.shape.radius === '0px' ? 'Square' : brand.shape.radius],
              ['Border', brand.shape.cardBorder],
              ['Pill', brand.shape.pillRadius],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: type.body, fontSize: 12, color: palette.textDim }}>{k}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: palette.textMuted }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography specimen */}
        <div style={{ padding: '28px 28px', borderRight: `1px solid ${palette.border}` }}>
          <div style={{ fontFamily: type.body, fontWeight: 600, fontSize: 11, color: palette.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Typography
          </div>
          <TypeSpecimen brand={brand} />
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: type.body, fontSize: 11, color: palette.textDim, marginBottom: 8 }}>Fonts</div>
            {[
              ['Display', type.display.split(',')[0].replace(/'/g, '')],
              ['Body', type.body.split(',')[0].replace(/'/g, '')],
              ['Mono', type.mono.split(',')[0].replace(/'/g, '')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: type.body, fontSize: 12, color: palette.textDim }}>{k}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: palette.textMuted }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card specimens */}
        <div style={{ padding: '28px 28px' }}>
          <div style={{ fontFamily: type.body, fontWeight: 600, fontSize: 11, color: palette.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Components
          </div>
          <CardSpecimen brand={brand} />
        </div>
      </div>
    </div>
  )
}

// ─── Feedback Overlay ─────────────────────────────────────────────────────────

function FeedbackOverlay({ targetName }) {
  const [mode, setMode] = useState('idle')
  const [comments, setComments] = useState([])
  const [pending, setPending] = useState(null)
  const [inputText, setInputText] = useState('')
  const [overallDir, setOverallDir] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const handleClick = (e) => {
    if (mode !== 'active') return
    if (e.target.closest('[data-feedback-ui]')) return
    e.preventDefault(); e.stopPropagation()
    const variantEl = e.target.closest('[data-variant]')
    const variant = variantEl?.dataset.variant ?? '?'
    const rect = e.target.getBoundingClientRect()
    setPending({ variant, x: rect.left + rect.width / 2, y: rect.top, tag: e.target.tagName.toLowerCase(), text: (e.target.textContent ?? '').trim().slice(0, 40) })
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useState(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  })

  const saveComment = () => {
    if (!pending || !inputText.trim()) return
    setComments(c => [...c, { ...pending, text: inputText.trim(), id: Date.now() }])
    setPending(null); setInputText('')
  }

  const submit = () => {
    const byVariant = {}
    comments.forEach(c => { if (!byVariant[c.variant]) byVariant[c.variant] = []; byVariant[c.variant].push(c) })
    const lines = [`## Brand Palette Feedback\n\n**Target:** ${targetName}\n**Comments:** ${comments.length}\n`]
    Object.entries(byVariant).sort().forEach(([v, cs]) => {
      const name = BRANDS.find(b => b.id === v)?.name ?? v
      lines.push(`\n### Variant ${v} — ${name}`)
      cs.forEach((c, i) => lines.push(`${i + 1}. "${c.text}"\n   ${c.text}`))
    })
    lines.push(`\n### Overall Direction\n${overallDir || '(not provided)'}`)
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2" data-feedback-ui>
        {mode === 'idle' && (
          <button type="button" onClick={() => setMode('active')}
            className="flex items-center gap-2 px-4 py-2.5 text-stone font-body font-semibold text-label shadow-raise hover:opacity-90 transition-opacity"
            style={{ background: '#4B9CE4' }}>
            <MessageSquare size={12} strokeWidth={2} />Add feedback
          </button>
        )}
        {mode === 'active' && (
          <div className="flex items-center gap-2">
            <span className="font-body text-label px-3 py-1.5" style={{ color: '#4B9CE4', background: '#0B0F18', border: '1px solid #263042' }}>Click any element</span>
            <button type="button" onClick={() => { setMode('review'); setPending(null) }}
              className="px-3 py-2 font-body font-semibold text-label text-stone hover:opacity-90" style={{ background: '#28BFB0' }}>Done ({comments.length})</button>
            <button type="button" onClick={() => setMode('idle')} className="px-3 py-2 font-body text-label" style={{ background: '#131A26', border: '1px solid #263042', color: '#7A8EA8' }}>
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )}
        {mode === 'review' && (
          <div style={{ width: 380, background: '#131A26', border: '1px solid #263042', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #263042', background: '#1B2538' }}>
              <span className="font-body font-medium text-body" style={{ color: '#EDE4CB' }}>{comments.length} comments</span>
              <button type="button" onClick={() => setMode('idle')} style={{ color: '#7A8EA8' }}><X size={12} strokeWidth={2} /></button>
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {comments.length === 0 && <div className="px-4 py-3 font-body text-label" style={{ color: '#7A8EA8' }}>No comments yet.</div>}
              {comments.map(c => {
                const name = BRANDS.find(b => b.id === c.variant)?.name
                return (
                  <div key={c.id} className="flex items-start gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #263042' }}>
                    <span className="font-body text-label flex-shrink-0" style={{ color: '#4B9CE4' }}>{c.variant} · {name}</span>
                    <p className="font-body text-label flex-1 leading-snug" style={{ color: '#7A8EA8' }}>{c.text}</p>
                    <button type="button" onClick={() => setComments(cs => cs.filter(x => x.id !== c.id))} style={{ color: '#7A8EA8' }}><X size={10} strokeWidth={2} /></button>
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-3" style={{ borderTop: '1px solid #263042' }}>
              <div className="font-body text-label mb-1.5" style={{ color: '#7A8EA8' }}>Which direction? What should change? <span style={{ color: '#DC5C42' }}>*</span></div>
              <textarea value={overallDir} onChange={e => setOverallDir(e.target.value)} rows={2} placeholder="e.g. B resonates most. Keep the navy, try a slightly warmer background..."
                className="w-full font-body text-label resize-none focus:outline-none text-body"
                style={{ background: '#1B2538', border: '1px solid #263042', color: '#EDE4CB', padding: '8px 12px' }} />
            </div>
            <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid #263042', background: '#1B2538' }}>
              <button type="button" onClick={submit} disabled={!overallDir.trim()}
                className="flex items-center gap-1.5 px-3 py-2 font-body font-semibold text-label text-stone disabled:opacity-40 hover:opacity-90"
                style={{ background: '#4B9CE4' }}>
                <Send size={11} strokeWidth={2} />{copied ? 'Copied!' : 'Copy feedback'}
              </button>
              <button type="button" onClick={() => setMode('active')} className="px-3 py-2 font-body text-label" style={{ background: '#263042', color: '#7A8EA8' }}>Add more</button>
            </div>
          </div>
        )}
      </div>
      {pending && (
        <div data-feedback-ui className="fixed z-[9999]"
          style={{ top: Math.max(8, pending.y - 110), left: Math.min(window.innerWidth - 296, pending.x - 140), background: '#131A26', border: '1px solid #263042', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', width: 280 }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #263042', background: '#1B2538' }}>
            <span className="font-body text-label" style={{ color: '#7A8EA8' }}>Variant {pending.variant}</span>
            <button type="button" onClick={() => setPending(null)} style={{ color: '#7A8EA8' }}><X size={10} strokeWidth={2} /></button>
          </div>
          <div className="p-3">
            <textarea ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveComment() } }}
              rows={3} placeholder="Your feedback... (Enter to save)"
              className="w-full font-body text-label resize-none focus:outline-none text-body"
              style={{ background: '#1B2538', border: '1px solid #263042', color: '#EDE4CB', padding: '8px 10px' }} />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={saveComment} disabled={!inputText.trim()}
                className="px-3 py-1.5 font-body font-semibold text-label text-stone disabled:opacity-40"
                style={{ background: '#4B9CE4' }}>Save</button>
              <button type="button" onClick={() => setPending(null)}
                className="px-3 py-1.5 font-body text-label"
                style={{ background: '#263042', color: '#7A8EA8' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {mode === 'active' && (
        <style>{`* { cursor: crosshair !important; } [data-feedback-ui], [data-feedback-ui] * { cursor: default !important; }`}</style>
      )}
    </>
  )
}

// ─── Precision Farming Applied ───────────────────────────────────────────────
// Shows PlantOverview redesigned through precision farming principles.
// Uses Foundry palette (A) as the brand baseline.
//
// Precision farming applied means:
//   1. Lead with WHERE risk is concentrated — not what the average score is
//   2. Surface the smallest actionable unit — specific lot, operator, sensor
//   3. Show causality — what signal created this, what happens if ignored
//   4. Allocate attention explicitly — Act Now / Watch / Background

const PF = BRANDS[0] // Foundry palette

const PF_DECISIONS = [
  {
    urgency: 'now',
    id: 'D1',
    title: 'Reassign Martinez (L3) to Sauce Dosing — Reyes (L1) is a mismatch',
    smallestUnit: 'Operator: A. Martinez · Station: Sauce Dosing · Line 4',
    signal: 'Sauce Dosing requires Level 3 at today\'s production volume. Reyes (L1) is currently covering. Skill mismatch at Sauce Dosing appears in 3 of last 8 substandard shifts on Line 4.',
    consequence: 'Qualified staffing rises 72% → 83%. Risk score updates in 4 min.',
    window: '28 min',
    concentration: 27,
    action: 'Confirm reassignment',
  },
  {
    urgency: 'now',
    id: 'D2',
    title: 'Hold or release Lot TS-8811 — COA not received, production starts in 1h 46m',
    smallestUnit: 'Lot: TS-8811 · Supplier: ConAgra · Ingredient: Tomato Sauce',
    signal: 'Certificate of Analysis required before Line 4 production can start. COA request sent 05:47 — no response from ConAgra. TX-11 holds the same lot — uncoordinated holds create partial recall exposure.',
    consequence: 'If hold confirmed: Line 4 AM delayed until COA received. Fallback lot L-0889 available (COA valid). If released without COA: FSMA 204 violation.',
    window: '1h 46m',
    concentration: 18,
    action: 'Go to Agents',
  },
]

const PF_WATCH = [
  { title: 'Sensor A-7 variance count 4 of 5 threshold', detail: 'Pattern matches Apr 2 bearing failure 3 shifts prior. Bearing inspection recommended tonight 22:00.', route: 'Equipment' },
  { title: 'Lindqvist L3 cert expires tonight — Line 4 AM understaffed tomorrow', detail: 'Tomorrow AM will have 12 of 18 qualified operators. Act before end of current shift.', route: 'Shift' },
]

const PF_BACKGROUND = [
  { line: 'Line 4', score: 78, status: 'At risk',  note: '2 active decisions' },
  { line: 'Line 6', score: 42, status: 'Running',  note: '1 watch item' },
  { line: 'Line 3', score: 61, status: 'Watch',    note: 'Monitoring' },
  { line: 'Line 2', score: 38, status: 'Clear',    note: 'No findings' },
]

function Annotation({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
        background: PF.palette.accentDim, border: `1px solid ${PF.palette.accent}`,
        color: PF.palette.accent, fontFamily: PF.type.body, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: PF.type.body, fontSize: 13, color: PF.palette.textMuted, lineHeight: 1.55, paddingTop: 4 }}>
        {children}
      </div>
    </div>
  )
}

function PrecisionFarmingExample() {
  const p = PF.palette
  const t = PF.type
  const s = PF.shape

  const label = (text) => ({
    fontFamily: t.body, fontWeight: 600, fontSize: 11,
    color: p.textDim, letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 10,
  })

  return (
    <div data-variant="PF" style={{ background: p.bg, borderTop: `8px solid #0B0F18` }}>

      {/* Section header */}
      <div style={{ background: p.surface, borderBottom: `1px solid ${p.border}`, padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 11, color: p.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Concept
          </div>
          <div style={{ width: 1, height: 16, background: p.border }} />
          <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 22, color: p.text, letterSpacing: t.displayTracking }}>
            Precision farming applied to PlantOverview
          </div>
        </div>
        <div style={{ fontFamily: t.body, fontSize: 14, lineHeight: 1.65, color: p.textMuted, maxWidth: 760 }}>
          The current PlantOverview leads with a risk score (78) — a managed average. This concept replaces the headline with a concentration statement and surfaces the two decisions that actually matter right now. The score is still present, but as context, not content. Every item has a named smallest actionable unit, an evidence signal, and a consequence.
        </div>
      </div>

      {/* Two-column: concept mockup + annotations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 600 }}>

        {/* Left: the concept page */}
        <div style={{ borderRight: `1px solid ${p.border}`, padding: '28px 32px' }}>

          {/* ── CONCENTRATION STATEMENT (replaces the score headline) ── */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${p.border}` }}>
            <div style={{ fontFamily: t.body, fontSize: 11, fontWeight: 600, color: p.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              Salina Campus · 06:42 AM · 4 lines active
            </div>
            <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 28, color: p.text, letterSpacing: t.displayTracking, lineHeight: 1.2, marginBottom: 8 }}>
              Risk concentrated in 2 areas
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Line 4 staffing mismatch', pct: 27, color: p.danger },
                { label: 'Lot TS-8811 COA hold', pct: 18, color: p.warn },
                { label: 'Oven B calibration', pct: 12, color: p.warn },
                { label: 'All other', pct: 43, color: p.textDim },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ fontFamily: t.body, fontSize: 12, color: p.textMuted }}>
                    <span style={{ color, fontWeight: 700 }}>{pct}%</span> {label}
                  </div>
                </div>
              ))}
            </div>
            {/* Concentration bar */}
            <div style={{ display: 'flex', height: 4, marginTop: 12, gap: 2 }}>
              {[{pct:27,color:p.danger},{pct:18,color:p.warn},{pct:12,color:p.warn},{pct:43,color:p.border}].map(({pct,color},i)=>(
                <div key={i} style={{ width: `${pct}%`, background: color, height: '100%' }} />
              ))}
            </div>
          </div>

          {/* ── ACT NOW ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={label()}>Act now · 2 decisions · {'>'}28 min window</div>
            {PF_DECISIONS.map((d) => (
              <div key={d.id} style={{ background: p.surface, border: `1px solid ${p.border}`, borderLeft: `3px solid ${p.danger}`, marginBottom: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 15, color: p.text, lineHeight: 1.3 }}>{d.title}</div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: t.body, fontSize: 11, color: p.danger, fontWeight: 700 }}>{d.window}</div>
                    <div style={{ fontFamily: t.body, fontSize: 11, color: p.textDim }}>window</div>
                  </div>
                </div>
                {/* Smallest actionable unit */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.accent, marginBottom: 8, padding: '4px 8px', background: p.accentDim }}>
                  {d.smallestUnit}
                </div>
                {/* Signal */}
                <div style={{ fontFamily: t.body, fontSize: 12, color: p.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, color: p.textMuted }}>Signal: </span>{d.signal}
                </div>
                {/* Consequence */}
                <div style={{ fontFamily: t.body, fontSize: 12, color: p.ok, marginBottom: 12 }}>
                  <span style={{ fontWeight: 600 }}>If acted: </span>{d.consequence}
                </div>
                {/* Action */}
                <button style={{ background: p.accent, color: p.accentText, fontFamily: t.body, fontSize: 13, fontWeight: 600, padding: '7px 16px', border: 'none', cursor: 'pointer', borderRadius: s.btnRadius }}>
                  {d.action}
                </button>
              </div>
            ))}
          </div>

          {/* ── WATCH ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={label()}>Watch · 2 signals trending toward risk</div>
            {PF_WATCH.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: p.surface, border: `1px solid ${p.border}`, borderLeft: `3px solid ${p.warn}`, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.body, fontWeight: 600, fontSize: 13, color: p.text, marginBottom: 3 }}>{w.title}</div>
                  <div style={{ fontFamily: t.body, fontSize: 12, color: p.textMuted }}>{w.detail}</div>
                </div>
                <div style={{ fontFamily: t.body, fontSize: 11, color: p.accent, flexShrink: 0, paddingTop: 2 }}>{w.route} →</div>
              </div>
            ))}
          </div>

          {/* ── BACKGROUND ── */}
          <div>
            <div style={label()}>Background · line status · no immediate action</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PF_BACKGROUND.map(l => {
                const scoreColor = l.score >= 75 ? p.danger : l.score >= 55 ? p.warn : p.ok
                return (
                  <div key={l.line} style={{ flex: 1, background: p.surface, border: `1px solid ${p.border}`, padding: '10px 12px' }}>
                    <div style={{ fontFamily: t.body, fontSize: 11, color: p.textDim, marginBottom: 4 }}>{l.line}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{l.score}</div>
                    <div style={{ fontFamily: t.body, fontSize: 11, color: p.textDim, marginTop: 4 }}>{l.note}</div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Right: annotation panel */}
        <div style={{ padding: '28px 24px', background: p.surfaceRaised }}>
          <div style={{ fontFamily: t.body, fontWeight: 600, fontSize: 11, color: p.textDim, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Precision farming principles
          </div>

          <Annotation label="1">
            <span style={{ color: p.text, fontWeight: 600 }}>Concentration not average.</span> The headline says "Risk concentrated in 2 areas" — not "Risk score = 78." The score is gone from the top. It appears inline per line in the Background section. The first thing a director reads is WHERE risk is, not how bad on average.
          </Annotation>

          <Annotation label="2">
            <span style={{ color: p.text, fontWeight: 600 }}>Smallest actionable unit.</span> Each Act Now card names the specific thing: operator A. Martinez, station Sauce Dosing, lot TS-8811, supplier ConAgra. Not "staffing issue" or "supplier problem." The monospaced line is the decision address — you know exactly what to touch.
          </Annotation>

          <Annotation label="3">
            <span style={{ color: p.text, fontWeight: 600 }}>Causality made visible.</span> Signal → Consequence. The signal explains why the system flagged this. The consequence shows what changes if you act. Not just "do this" — but "here is the chain of cause and effect you are intervening in."
          </Annotation>

          <Annotation label="4">
            <span style={{ color: p.text, fontWeight: 600 }}>Explicit attention tiers.</span> Three labeled zones: Act Now (decision required within window), Watch (trending toward risk, monitor), Background (status only, no action needed). The director knows immediately which tier to read. Background items are visible but visually subordinate.
          </Annotation>

          <Annotation label="5">
            <span style={{ color: p.text, fontWeight: 600 }}>Changes what you do next.</span> Every Act Now card has one clear action. The 28-minute window and 1h 46m window create urgency tied to real production constraints — not arbitrary timers. The watch items each show where to go to investigate. Background gives no actions because none are needed.
          </Annotation>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${p.border}` }}>
            <div style={{ fontFamily: t.body, fontSize: 12, color: p.textDim, lineHeight: 1.6 }}>
              The risk score (78) still exists — it is visible per line in the Background section. It has been demoted from headline to context. A director who needs the number can find it. But the first question answered is not "how bad is it?" — it is "where is it, and what do I do about it right now?"
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bold Visual Direction 1: Glassmorphism ──────────────────────────────────
// Layered depth via translucent surfaces, soft shadows, gradient accents

function BoldDirection1() {
  const dark = '#0A0E17'
  const lightGlass = 'rgba(255, 255, 255, 0.08)'
  const medGlass = 'rgba(255, 255, 255, 0.12)'
  const accentGlow = 'rgba(76, 156, 228, 0.15)'

  return (
    <div style={{ background: dark, borderTop: '8px solid #2A4A6E' }}>
      <div style={{ background: medGlass, borderBottom: `1px solid ${lightGlass}`, padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#4C9CE4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Direction
          </div>
          <div style={{ width: 1, height: 16, background: lightGlass }} />
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22, color: '#F5F5F5', letterSpacing: '-0.01em' }}>
            Glassmorphism — Layered depth
          </div>
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.6, color: '#B8B8B8', maxWidth: 760 }}>
          Translucent overlays create a sense of depth and sophistication. Soft glows and blurred boundaries feel premium and modern, with careful color hierarchy through transparency rather than contrast.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 400, gap: 2 }}>
        {/* Left: component examples */}
        <div style={{ padding: '32px', background: dark, borderRight: `1px solid ${lightGlass}` }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#999', marginBottom: 20, letterSpacing: '0.06em' }}>COMPONENTS</div>

          {/* Glass card */}
          <div style={{ background: medGlass, border: `1px solid ${lightGlass}`, borderRadius: 12, padding: 16, marginBottom: 16, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>Risk Assessment</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Line 4 · AM shift</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4C9CE4', marginBottom: 8 }}>78</div>
            <div style={{ width: '100%', height: 4, background: accentGlow, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: '#4C9CE4' }} />
            </div>
          </div>

          {/* Interactive element */}
          <button style={{ width: '100%', padding: '10px 16px', background: medGlass, border: `1px solid ${lightGlass}`, borderRadius: 8, color: '#4C9CE4', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', boxShadow: `0 8px 32px ${accentGlow}` }}>
            Assign to Kowalski
          </button>
        </div>

        {/* Right: motion & hierarchy showcase */}
        <div style={{ padding: '32px', background: dark, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#999', letterSpacing: '0.06em' }}>DEPTH THROUGH OPACITY</div>

          {[1, 0.8, 0.6, 0.4].map((op, i) => (
            <div key={i} style={{ background: `rgba(76, 156, 228, ${op * 0.2})`, border: `1px solid rgba(76, 156, 228, ${op * 0.3})`, borderRadius: 8, padding: 12, backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 12, color: `rgba(245, 245, 245, ${op})`, fontFamily: 'monospace', fontWeight: 500 }}>
                Layer {i + 1} — opacity {Math.round(op * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Bold Visual Direction 2: Neo-Brutalism ────────────────────────────────────
// Raw edges, bold geometry, unapologetic typography, visual weight

function BoldDirection2() {
  const bg = '#1A1A1A'
  const text = '#EFEFEF'
  const accent = '#FF6B35'
  const secondary = '#004E89'

  return (
    <div style={{ background: bg, borderTop: '8px solid #1A1A1A' }}>
      <div style={{ background: bg, border: `3px solid ${accent}`, borderBottom: `4px solid ${accent}`, padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: accent, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            DIRECTION
          </div>
          <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 32, color: text, letterSpacing: '-0.02em', lineHeight: 1 }}>
            NEO-BRUTALISM
          </div>
        </div>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 14, lineHeight: 1.7, color: '#BBB', maxWidth: 760, fontWeight: 500 }}>
          No apologies. Raw geometry, bold strokes, maximum weight. Every element has presence. Minimal ornamentation—the work speaks for itself.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 400, gap: 3, background: bg, padding: 3 }}>
        {/* Left: heavy typography and structure */}
        <div style={{ padding: '32px', background: bg, borderRight: `3px solid ${secondary}` }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: secondary, fontWeight: 900, marginBottom: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Status</div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 48, fontWeight: 900, color: accent, lineHeight: 1, marginBottom: 8 }}>78</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 14, color: text, fontWeight: 700, marginBottom: 16 }}>RISK SCORE</div>
            <div style={{ height: 12, background: bg, border: `3px solid ${accent}`, overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: accent }} />
            </div>
          </div>

          {/* Action block */}
          <button style={{ width: '100%', padding: '16px 20px', background: accent, border: '3px solid ' + accent, color: bg, fontFamily: 'Courier New, monospace', fontSize: 13, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Act Now
          </button>
        </div>

        {/* Right: grid breakdown */}
        <div style={{ padding: '32px', background: bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['Decision', 'Window', 'Impact', 'Owner'].map((label, i) => (
            <div key={i} style={{ border: `2px solid ${accent}`, padding: 16, background: bg }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: secondary, fontWeight: 900, marginBottom: 8, textTransform: 'uppercase' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 16, fontWeight: 900, color: text }}>
                {i === 0 ? 'Martinez → Dosing' : i === 1 ? '28 min' : i === 2 ? '+13 pts' : 'Kowalski'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Bold Visual Direction 3: Kinetic / Motion-Driven ──────────────────────────
// Animated data, interactive micro-interactions, motion as primary communication

function BoldDirection3() {
  const dark = '#0D1117'
  const surface = '#161B22'
  const accent = '#58A6FF'
  const ok = '#3FB950'
  const warn = '#D29922'

  return (
    <div style={{ background: dark, borderTop: '8px solid #1F6FEB' }}>
      <div style={{ background: surface, borderBottom: `1px solid #30363D`, padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Direction
          </div>
          <div style={{ width: 1, height: 16, background: '#30363D' }} />
          <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 22, color: '#E6EDF3', letterSpacing: '-0.01em' }}>
            Kinetic — Motion as interface
          </div>
        </div>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, lineHeight: 1.6, color: '#8B949E', maxWidth: 760 }}>
          Data comes alive. Animated transitions tell a story. Micro-interactions provide feedback. The interface responds—it doesn't just sit there.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 400, gap: 1, background: '#0D1117' }}>
        {/* Left: animated metrics */}
        <div style={{ padding: '32px', background: dark, borderRight: `1px solid #30363D` }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6E7681', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Animated Metrics</div>

          {/* Animated counter */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 8, fontFamily: 'monospace', fontWeight: 600 }}>Decisions pending</div>
            <div style={{ fontSize: 56, fontWeight: 700, color: warn, fontFamily: 'monospace', lineHeight: 1, marginBottom: 8, animation: 'pulse 2s ease-in-out infinite' }}>
              3
            </div>
            <div style={{ height: 2, background: warn, width: '60%', opacity: 0.3 }} />
          </div>

          {/* Pulse indicators */}
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6E7681', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status Pulse</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[ok, warn, accent].map((color, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'monospace' }}>{i === 0 ? 'Live' : i === 1 ? 'Alert' : 'Ready'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: interactive states */}
        <div style={{ padding: '32px', background: dark, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6E7681', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Interactive States</div>

          {[
            { label: 'Default', bg: surface, border: '1px solid #30363D' },
            { label: 'Hover', bg: '#0D1117', border: '1px solid ' + accent },
            { label: 'Active', bg: accent + '20', border: '2px solid ' + accent },
          ].map((state, i) => (
            <button key={i} style={{
              padding: '12px 16px',
              background: state.bg,
              border: state.border,
              borderRadius: 6,
              color: accent,
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              textAlign: 'left'
            }}>
              {state.label} — click to see transition
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ─── Lab page ─────────────────────────────────────────────────────────────────

export default function DesignLabBrand() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: '#0B0F18' }}>
      {/* Lab header */}
      <div style={{ background: '#131A26', borderBottom: '1px solid #263042', padding: '24px 40px' }}>
        <div className="flex items-start justify-between gap-8">
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B9CE4', marginBottom: 8 }}>
              Design Lab · Brand Exploration
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque', system-ui", fontWeight: 800, fontSize: 26, color: '#EDE4CB', letterSpacing: '-0.02em', marginBottom: 10 }}>
              5 brand palette directions for Takorin
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: 14, color: '#7A8EA8', lineHeight: 1.6, maxWidth: 640 }}>
              Each variant shows: a complete color palette, typography specimen with real operational content, and a card component using actual Takorin UI patterns. Scroll to compare. Use "Add feedback" to annotate specific elements.
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: 11, color: '#7A8EA8', marginBottom: 8 }}>How to compare</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: 12, color: '#4A5D74', lineHeight: 1.7 }}>
              Scroll through all 5<br />
              Click "Add feedback" → tap any element<br />
              Fill "Overall direction" → copy → paste here
            </div>
          </div>
        </div>
        {/* Quick-jump nav */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {BRANDS.map(b => (
            <a key={b.id} href={`#variant-${b.id}`}
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: 12, fontWeight: 600, color: '#7A8EA8', background: '#1B2538', border: '1px solid #263042', padding: '4px 12px', borderRadius: 0, textDecoration: 'none' }}>
              {b.id} · {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* Variants — stacked and scrollable, full dividers between */}
      {BRANDS.map((brand, i) => (
        <div key={brand.id} id={`variant-${brand.id}`} style={{ borderBottom: i < BRANDS.length - 1 ? '8px solid #0B0F18' : 'none' }}>
          <BrandSection brand={brand} />
        </div>
      ))}

      {/* ── Bold Visual Directions ── */}
      <div style={{ borderBottom: '8px solid #0B0F18' }}><BoldDirection1 /></div>
      <div style={{ borderBottom: '8px solid #0B0F18' }}><BoldDirection2 /></div>
      <div style={{ borderBottom: '8px solid #0B0F18' }}><BoldDirection3 /></div>

      {/* ── Precision Farming Applied ── */}
      <PrecisionFarmingExample />

      <FeedbackOverlay targetName="Brand palette" />
    </div>
  )
}
