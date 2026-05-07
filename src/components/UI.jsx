// Shared primitive components — PostHog-influenced density, Takorin palette
import BoringAvatar from 'boring-avatars'

const AVATAR_PALETTE = ['#100F0D', '#C17D2A', '#F5F0E8', '#D8D2C8', '#A8A098']

export function PersonAvatar({ name, size = 28 }) {
 return <BoringAvatar size={size} name={name} variant="beam" colors={AVATAR_PALETTE} />
}

// ── Urgency pill (unified across all modules)
export function Urg({ level = 'info', children }) {
 const cls = {
 critical: 'text-danger bg-danger/10',
 warn: 'text-warn bg-warn/10',
 ok: 'text-ok bg-ok/10',
 info: 'text-muted bg-stone3',
 }[level]
 return (
 <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 font-body ${cls}`}>
 <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
 {children}
 </span>
 )
}

// ── Stat bar cell
export function StatCell({ label, value, sub, fill, tone = 'ok' }) {
 const toneColor = { ok:'bg-ok', warn:'bg-warn', danger:'bg-danger', brass:'bg-brass' }[tone]
 return (
 <div className="px-4 py-3 border-r border-rule2 last:border-r-0">
 <div className="font-body text-muted text-[10px] mb-1">{label}</div>
 <div className="display-num text-xl text-ink">{value}</div>
 {sub && <div className="font-body text-ghost text-[10px] mt-0.5">{sub}</div>}
 {fill !== undefined && (
 <div className="h-px bg-rule2 mt-2">
 <div className={`h-full ${toneColor} transition-all`} style={{ width: `${fill}%` }} />
 </div>
 )}
 </div>
 )
}

// ── Section header
export function SecHd({ tag, title, badge, icon: Icon, accent }) {
 return (
 <div className="flex items-baseline gap-3 px-4 py-3 border-b border-rule2">
 <div className="flex items-center gap-1.5 font-body text-muted text-[11px]">
 {Icon && <Icon size={11} strokeWidth={2} style={accent ? { color: accent } : undefined} />}
 {tag}
 </div>
 <div className="flex-1 font-body font-medium text-ink text-[13px]">{title}</div>
 {badge}
 </div>
 )
}

// ── Case/finding card
export function CaseCard({ urgency = 'warn', num, children }) {
 const border = { danger:'border-l-danger', warn:'border-l-warn', ok:'border-l-ok', muted:'border-l-muted' }[urgency]
 return (
 <div className={`border-l-2 ${border} border-b border-rule2 last:border-b-0`}>
 <div className="grid grid-cols-[28px_1fr] gap-0">
 <div className={`pt-4 pl-3 font-display font-bold text-sm ${urgency === 'danger' ? 'text-danger' : urgency === 'warn' ? 'text-warn' : 'text-muted'}`}>
 {num}
 </div>
 <div className="p-4 pl-2">{children}</div>
 </div>
 </div>
 )
}

// ── Side panel section
export function SP({ title, sub, children }) {
 return (
 <div className="border-b border-rule2 last:border-b-0">
 <div className="px-4 py-2.5 border-b border-rule2 flex items-baseline justify-between">
 <span className="font-body font-medium text-ink text-[12px]">{title}</span>
 {sub && <span className="font-body text-ghost text-[10px]">{sub}</span>}
 </div>
 <div>{children}</div>
 </div>
 )
}

// ── SP row (label + value)
export function SPRow({ label, sub, value, valueColor = 'text-ink' }) {
 return (
 <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule last:border-b-0">
 <div>
 <div className="font-body text-ink text-[12px] font-medium">{label}</div>
 {sub && <div className="font-body text-ghost text-[10px] mt-0.5">{sub}</div>}
 </div>
 <div className={`display-num text-base ${valueColor}`}>{value}</div>
 </div>
 )
}

// ── Action banner — muted tonal style
export function ActionBanner({ tone = 'warn', headline, body, children, footer }) {
 const s = {
 danger: 'bg-danger/[0.05] border-b-2 border-b-danger',
 warn:   'bg-warn/[0.05] border-b-2 border-b-warn',
 ok:     'bg-ok/[0.05] border-b-2 border-b-ok',
 muted:  'bg-stone3 border-b border-rule2',
 }[tone] || 'bg-warn/[0.05] border-b-2 border-b-warn'
 return (
 <div className={`flex-shrink-0 ${s}`}>
 <div className="px-5 py-3 flex items-start gap-4">
 <div className="flex-1">
 <div className="font-body font-medium text-ink text-[12px] leading-tight">{headline}</div>
 {body && <div className="font-body text-muted text-[11px] mt-0.5 leading-relaxed">{body}</div>}
 </div>
 {children && <div className="flex gap-2 flex-shrink-0 items-start">{children}</div>}
 </div>
 {footer && <div className="px-5 pb-3">{footer}</div>}
 </div>
 )
}

// ── Button variants
export function Btn({ variant = 'primary', onClick, disabled, children, className = '', style }) {
 const base = 'font-body font-medium text-[11px] px-3 py-1.5 transition-all duration-100 active:scale-[0.97] cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed'
 const cls = {
 primary: 'bg-ink text-stone hover:bg-ink2',
 secondary: 'border border-rule2 text-muted hover:border-ghost',
 }[variant]
 return (
 <button type="button" className={`${base} ${cls} ${className}`} onClick={onClick} disabled={disabled} style={style}>
 {children}
 </button>
 )
}

// ── Chip
export function Chip({ tone = 'ok', children }) {
 const cls = {
 ok: 'text-ok bg-ok/10',
 warn: 'text-warn bg-warn/10',
 danger: 'text-danger bg-danger/10',
 muted: 'text-muted bg-stone3',
 int: 'text-int bg-int/10',
 }[tone]
 return (
 <span className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 ${cls}`}>
 <span className="w-1 h-1 rounded-full bg-current" />
 {children}
 </span>
 )
}

// ── Dot (GitHub-style intensity square)
export function Dot({ level = 'empty' }) {
 const cls = {
 d4: 'bg-danger',
 d3: 'bg-danger/75',
 d2: 'bg-danger/50',
 d1: 'bg-danger/25',
 w4: 'bg-warn',
 w3: 'bg-warn/75',
 w2: 'bg-warn/50',
 w1: 'bg-warn/25',
 ok: 'bg-ok/50',
 empty: 'bg-rule2/40',
 }[level]
 return <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${cls}`} />
}

// ── Score bar — horizontal bar chart replacing ring gauges
export function ScoreRing({ pct = 0, size = 32, color }) {
 const c = color || (pct >= 75 ? '#3A8A5A' : pct >= 50 ? '#C4920A' : '#D94F2A')
 const barH = size <= 40 ? 3 : 5
 const numSize = size <= 40 ? 11 : Math.round(size * 0.26)
 const w = size <= 40 ? 56 : size * 2
 return (
 <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: w }}>
 <span style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'', fontSize:numSize, color:c, lineHeight:1 }}>{pct}</span>
 <div style={{ height:barH, background:'#D8D2C8' }}>
 <div style={{ height:'100%', width:`${pct}%`, background:c, transition:'width 0.6s ease' }} />
 </div>
 </div>
 )
}

// ── Page header
export function PageHead({ over, title, accent = '#C17D2A', meta = [], children }) {
 return (
 <div className="px-5 py-4 border-b border-rule2 bg-stone2" style={{ borderLeft: `3px solid ${accent}` }}>
 <div className="font-body text-muted text-[11px] mb-1">{over}</div>
 <div className="font-display font-bold text-2xl text-ink leading-tight">
 {title}
 {children && <span className="font-light text-ochre"> {children}</span>}
 </div>
 {meta.length > 0 && (
 <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
 {meta.map(({ role, val }, i) => (
 <div key={i} className="flex gap-1.5 items-baseline">
 <span className="font-body text-ghost text-[10px]">{role}</span>
 <span className="font-body text-ink text-[12px] font-medium">{val}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )
}

// ── Layout (main + side)
export function Layout({ children, side }) {
 return (
 <div className="flex flex-1 min-h-0 overflow-hidden">
 <div className="flex-1 overflow-y-auto">{children}</div>
 {side && (
 <div className="w-[260px] flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">
 {side}
 </div>
 )}
 </div>
 )
}

// ── Mini spark plot — smooth bezier curve, Google Finance style
export function WaveformSparkline({ data, color = '#C17D2A', height = 44 }) {
 if (!data || data.length < 2) return null
 const W = 100
 const pad = 3
 const max = Math.max(...data)
 const min = Math.min(...data)
 const range = max - min || 1
 const points = data.map((v, i) => ({
  x: pad + (i / (data.length - 1)) * (W - pad * 2),
  y: height - pad - ((v - min) / range) * (height - pad * 2),
 }))
 // Catmull-Rom → cubic bezier for smooth curve through all points
 const d = points.reduce((acc, p, i) => {
  if (i === 0) return `M${p.x},${p.y}`
  const prev = points[i - 1]
  const cp1x = prev.x + (p.x - (points[i - 2]?.x ?? prev.x)) / 6
  const cp1y = prev.y + (p.y - (points[i - 2]?.y ?? prev.y)) / 6
  const cp2x = p.x - ((points[i + 1]?.x ?? p.x) - prev.x) / 6
  const cp2y = p.y - ((points[i + 1]?.y ?? p.y) - prev.y) / 6
  return `${acc} C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`
 }, '')
 const last = points.at(-1)
 const fillPath = `${d} L${last.x},${height} L${points[0].x},${height} Z`
 return (
  <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
   <path d={fillPath} fill={color} fillOpacity="0.08" stroke="none" />
   <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
 )
}

// ── Metric card — large number + waveform + metadata (inspired by precision instrument displays)
export function MetricCard({ title, value, valueColor = 'text-ink', waveformData, waveformColor, waveformHeight, meta }) {
 return (
 <div className="px-4 pt-4 pb-3 border-b border-rule2">
 <div className="flex items-baseline justify-between gap-2 mb-3">
 <span className="font-body font-medium text-ink text-[12px] leading-snug flex-1">{title}</span>
 <span className={`display-num text-2xl leading-none flex-shrink-0 ${valueColor}`}>{value}</span>
 </div>
 {waveformData && (
 <div className="mb-2.5">
 <WaveformSparkline data={waveformData} color={waveformColor} height={waveformHeight} />
 </div>
 )}
 {meta && (
 <div className="flex items-baseline gap-1.5 mt-2.5 pt-2 border-t border-rule2">
 <span className="font-body font-medium text-ghost text-[9px] uppercase tracking-widest flex-shrink-0">{meta.label}</span>
 <span className="font-body text-muted text-[10px]">{meta.value}</span>
 </div>
 )}
 </div>
 )
}

// ── Modal overlay (critical one-time flows, safety briefings)
export function Modal({ onClose, children }) {
 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
   <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
   <div className="relative z-10 bg-stone border border-rule2 w-full max-w-[480px] mx-4 flex flex-col max-h-[90vh] overflow-hidden" style={{ borderTop: '3px solid #D94F2A' }}>
    {children}
   </div>
  </div>
 )
}

// ── Consequence notice (shows after action, confirms upstream impact)
export function ConsequenceNotice({ show, children }) {
 if (!show) return null
 return (
 <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-t border-ok/20 font-body text-ok text-[11px] slide-in">
 <svg className="w-3 h-3 stroke-current flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 {children}
 </div>
 )
}
