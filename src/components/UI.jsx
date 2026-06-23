// Shared primitive components — V2 precision + narrative fusion palette
import { useRef, useEffect, useMemo, useId, useState, useCallback } from 'react'
import NumberFlow from '@number-flow/react'
import { X, ArrowRight, ChevronRight, ChevronDown, ChevronUp, Check, Brain, AlertTriangle, InspectionPanel } from 'lucide-react'
import BoringAvatar from 'boring-avatars'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { toneStyle } from '../lib/styles'
const AVATAR_PALETTE = ['#4B9CE4', '#7C86E8', '#5FA877', '#C98E2A', '#C4844E']

export function PersonAvatar({ name, size = 28 }) {
 return <BoringAvatar size={size} name={name} variant="beam" colors={AVATAR_PALETTE} />
}

// ── Tone → atmospheric glow CSS class ─────────────────────────────────────────
const ATMO = { danger: 'atmo-glow-danger', warn: 'atmo-glow-warn', ok: 'atmo-glow-ok', muted: '' }
function atmoClass(tone) { return ATMO[tone] || '' }

// ── Tone → metric color CSS variable ──────────────────────────────────────────
const TONE_COLOR = {
 danger: 'var(--color-danger)',
 warn:   'var(--color-warn)',
 ok:     'var(--color-ok)',
 signal:  'var(--color-signal)',
 muted:  'var(--color-muted)',
}
export function toneColor(tone) { return TONE_COLOR[tone] || 'var(--color-ink)' }

// ── SceneHeader — V2 hero section for every screen ────────────────────────────
// Contains: module label · context · live dot · timestamp · large metric ·
//           narrative statement · optional meta row · optional signal strip
export function SceneHeader({
 module,                 // module identifier e.g. "SHIFT" / "BATCH"
 context,               // location/context string e.g. "Line 4 · AM Shift"
 live = false,          // show animated live indicator
 timestamp,             // time string e.g. "06:42"
 metric,                // primary large value (number or string)
 metricColor,           // CSS color for the metric — defaults to tone
 metricLabel,           // label below the metric e.g. "Risk score"
 statement,             // narrative sentence — the human voice
 meta = [],            // [{label, value, color}] quick stats row
 tone = 'muted',       // 'danger' | 'warn' | 'ok' | 'muted' — drives glow
 sparkline,            // optional: { points: number[], label: string, color: string }
 children,             // signal strip or other footer content
 className = '',
}) {
 const mc = metricColor || toneColor(tone)
 return (
  <header className={`flex-shrink-0 border-b border-rule relative overflow-hidden ${className}`}
   style={{ background: 'linear-gradient(180deg, var(--color-stone-2) 0%, var(--color-stone) 100%)' }}>

   {/* Atmospheric glow — risk-toned, 9s ambient pulse */}
   {tone !== 'muted' && (
    <div className={`absolute inset-0 pointer-events-none ${atmoClass(tone)}`} />
   )}

   {/* Module bar */}
   <div className="flex items-center justify-between px-6 pt-4 pb-0 relative">
    <div className="flex items-center gap-3">
     <span className="font-body text-label text-muted">{module}</span>
     {context && <>
      <div className="w-px h-3 bg-rule flex-shrink-0" />
      <span className="font-body text-label text-muted">{context}</span>
     </>}
    </div>
    {(live || timestamp) && (
     <div className="flex items-center gap-2">
      {live && <div className="live-dot w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-signal)' }} />}
      {timestamp && <span className="font-body text-label text-muted">{timestamp}</span>}
     </div>
    )}
   </div>

   {/* Metric + statement */}
   {(metric != null || statement) && (
    <div className="flex items-center gap-8 px-6 py-5 relative">
     {/* Metric block */}
     {metric != null && (
      <div className="flex-shrink-0">
       <div className="display-num text-score leading-none tabular-nums metric-in"
        style={{ color: mc }}>
        {metric}
       </div>
       {metricLabel && (
        <div className="flex items-center gap-2 mt-2">
         <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: mc }} />
         <span className="font-body text-label" style={{ color: mc }}>{metricLabel}</span>
        </div>
       )}
      </div>
     )}

     {/* Narrative statement */}
     {statement && (
      <div className={`max-w-md flex-1 ${metric != null ? 'border-l border-rule pl-8' : ''}`}>
       <p className="font-display text-ink text-sub leading-relaxed">{statement}</p>
       {meta.length > 0 && (
        <div className="flex items-center gap-5 mt-3">
         {meta.map(({ label, value, color: c, icon: Icon }, i) => (
          <div key={i} className="flex items-center gap-1.5">
           {Icon && <Icon size={11} strokeWidth={2} className="text-muted flex-shrink-0" />}
           {label && <span className="font-body text-label text-muted">{label}</span>}
           <span className="font-body text-label" style={{ color: c || 'var(--color-signal)' }}>{value}</span>
          </div>
         ))}
        </div>
       )}
      </div>
     )}

     {/* Sparkline — optional trend chart */}
     {sparkline && sparkline.points?.length > 1 && (() => {
      const pts = sparkline.points
      const min = Math.min(...pts), max = Math.max(...pts)
      const range = max - min || 1
      const polyPoints = pts.map((v, i) =>
       `${((i / (pts.length - 1)) * 76 + 2).toFixed(1)},${(30 - ((v - min) / range) * 26).toFixed(1)}`
      ).join(' ')
      const lastY = (30 - ((pts[pts.length - 1] - min) / range) * 26).toFixed(1)
      return (
       <div className="ml-auto flex-shrink-0 pl-6" style={{ opacity: 0.6 }}>
        <svg width="80" height="34" viewBox="0 0 80 34" aria-hidden="true">
         <polyline points={polyPoints} fill="none" stroke={sparkline.color}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         <circle cx="78" cy={lastY} r="2.5" fill={sparkline.color} />
        </svg>
        <span className="font-body text-label text-muted block text-center mt-0.5">{sparkline.label}</span>
       </div>
      )
     })()}
    </div>
   )}

   {/* Signal strip — optional footer of the hero */}
   {children && (
    <div className="border-t border-rule2 px-6 py-2.5 relative flex items-center gap-6">
     {children}
    </div>
   )}
  </header>
 )
}


// ── Status pill (unified across all modules)
export function StatusPill({ tone, level, variant, status, children, icon, className = '' }) {
 const resolvedTone = tone || level || variant || (status === 'complete' ? 'ok' : status === 'error' ? 'danger' : status === 'pending' ? 'warn' : 'info')
 const Icon = icon || (status === 'complete' ? Check : status === 'error' ? X : null)
 const label = children || (status ? status.charAt(0).toUpperCase() + status.slice(1) : null)
 return (
 <span className={`inline-flex items-center gap-1.5 text-label font-body px-1.5 py-0.5 ${toneStyle(resolvedTone, 'pill')} ${className}`}>
 {Icon && <Icon size={10} strokeWidth={2} className="flex-shrink-0" />}
 {label}
 </span>
 )
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, size = 'md', className = '', ...props }) {
 const sz = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' }[size] ?? 'w-3.5 h-3.5'
 return (
  <input type="checkbox" checked={checked} onChange={onChange}
   className={`cursor-pointer accent-signal flex-shrink-0 ${sz} ${className}`}
   {...props} />
 )
}

export function SectionHeader({ tone = 'muted', label, sub, title, icon: Icon, accent, badge, className = '' }) {
 if (title) {
  return (
   <div className={`flex items-center gap-3 px-5 py-3 border-b border-rule2 ${className}`}>
    <div className="flex items-center gap-1.5 flex-shrink-0">
     {label && <StatusPill tone={tone}>{label}</StatusPill>}
     {Icon && <Icon size={12} strokeWidth={2} style={accent ? { color: accent } : undefined} />}
    </div>
    <div className="flex-1 font-display font-semibold text-ink text-sub">{title}</div>
    {badge}
   </div>
  )
 }
 return (
  <div className={`flex items-center gap-2 border-b border-rule2 bg-stone2 px-4 py-2 ${className}`}>
   {label && <StatusPill tone={tone}>{label}</StatusPill>}
   {sub && <span className="font-body text-muted text-label">{sub}</span>}
   {badge && <div className="ml-auto">{badge}</div>}
  </div>
 )
}

// ── Stat bar cell
export function StatCell({ label, value, sub, fill, tone = 'ok', badge }) {
 const toneColor = toneStyle(tone, 'dot')
 const toneBorder = { ok:'border-t-ok', warn:'border-t-warn', danger:'border-t-danger', signal:'border-t-signal' }[tone] || 'border-t-ok'
 return (
 <div className={`px-5 py-4 border-r border-rule2 last:border-r-0 border-t-2 ${toneBorder}`}>
 <div className="font-body text-label text-muted mb-2">{label}</div>
 <div className="flex items-center gap-2">
 <div className="font-body font-bold text-metric text-ink tabular-nums">{value}</div>
 {badge && <StatusPill tone="muted" dot={false}>{badge}</StatusPill>}
 </div>
 {sub && <div className="font-body text-muted text-label mt-1">{sub}</div>}
 {fill !== undefined && (
 <div className="h-[2px] bg-rule mt-3">
 <div className={`h-full ${toneColor} transition-[width] duration-500 ease-enter`} style={{ width: `${fill}%` }} />
 </div>
 )}
 </div>
 )
}


// ── Case/finding card
export function CaseCard({ urgency = 'warn', num, children }) {
 const topBar = { danger:'bg-danger', warn:'bg-warn', ok:'bg-ok', muted:'bg-rule2' }[urgency]
 const numColor = { danger:'text-danger', warn:'text-warn', ok:'text-ok', muted:'text-muted' }[urgency]
 return (
 <div className="bg-stone border border-rule mb-2.5 overflow-hidden">
  <div className={`h-[3px] w-full ${topBar}`} />
  <div className="grid grid-cols-[28px_1fr] gap-0">
   <div className={`pt-4 pl-3 font-body font-bold text-sub ${numColor}`}>{num}</div>
   <div className="p-4 pl-2">{children}</div>
  </div>
 </div>
 )
}

// ── Side panel section
export function SP({ title, sub, children }) {
 return (
 <div className="border-b border-rule2 last:border-b-0">
 <div className="px-5 py-3 border-b border-rule2 flex items-baseline justify-between">
 <span className="font-display font-semibold text-ink text-sub">{title}</span>
 {sub && <span className="font-body text-muted text-label">{sub}</span>}
 </div>
 <div>{children}</div>
 </div>
 )
}

// ── SP row (label + value)
export function SPRow({ label, sub, value, valueColor = 'text-ink' }) {
 return (
 <div className="flex items-center justify-between px-5 py-3 border-b border-rule2 last:border-b-0">
 <div>
 <div className="font-body text-ink text-body font-medium">{label}</div>
 {sub && <div className="font-body text-muted text-label mt-0.5">{sub}</div>}
 </div>
 <div className={`font-body font-bold text-head leading-none ${valueColor}`}>{value}</div>
 </div>
 )
}

// ── Action banner — soft tonal fill + labelled status pill (status on badge, not border)
const ACTION_BANNER_LABEL = { danger: 'Critical', warn: 'Warning', ok: 'Clear', signal: 'Active' }
export function ActionBanner({ tone = 'warn', label, headline, body, children, footer }) {
 const s = tone === 'muted'
  ? 'bg-stone3 border-b border-rule2'
  : `${toneStyle(tone, 'bg')} border-b border-rule2`
 const pillLabel = label !== undefined ? label : (tone !== 'muted' ? ACTION_BANNER_LABEL[tone] : null)
 return (
 <div className={`flex-shrink-0 ${s}`}>
 <div className="px-5 py-4 flex items-start gap-4">
 <div className="flex-1">
 {pillLabel && <div className="mb-1.5"><StatusPill tone={tone}>{pillLabel}</StatusPill></div>}
 <div className="font-display font-semibold text-ink text-sub leading-tight">{headline}</div>
 {body && <div className="font-display text-muted text-body mt-1 leading-relaxed">{body}</div>}
 </div>
 {children && <div className="flex gap-2 flex-shrink-0 items-start">{children}</div>}
 </div>
 {footer && <div className="px-4 pb-3">{footer}</div>}
 </div>
 )
}

// ── TriageCard — urgency/resolved action card used in shift briefing and triage queues ───────
// urgency: 'critical' | 'warn'. resolved: shows strikethrough + check state.
export function TriageCard({ urgency, resolved, resolvedLabel, header, children, footer }) {
 if (resolved) {
  return (
   <div className="flex items-center gap-3 px-5 py-3 border-b border-rule2/60 opacity-50">
    <div className="w-4 h-4 rounded-full bg-ok flex items-center justify-center flex-shrink-0">
     <Check size={9} strokeWidth={2.5} className="text-stone" />
    </div>
    <span className="font-body text-muted text-label line-through flex-1">{header}</span>
    {resolvedLabel && <span className="font-body text-ok text-label">{resolvedLabel}</span>}
   </div>
  )
 }
 const accentBar    = urgency === 'critical' ? 'bg-danger' : 'bg-warn'
 const urgencyTone  = urgency === 'critical' ? 'danger'   : 'warn'
 const urgencyLabel = urgency === 'critical' ? 'Critical'  : 'Warning'
 return (
  <div className="px-5 py-3 border-b border-rule2">
   <article className="bg-stone border border-rule overflow-hidden">
    <div className={`h-[3px] w-full ${accentBar}`} />
    <div className="flex items-center px-4 pt-3 pb-1.5">
     <StatusPill tone={urgencyTone}>{urgencyLabel}</StatusPill>
    </div>
    <div className="px-4 pb-3 space-y-1.5">
     <p className="font-body text-ink font-medium text-sub leading-snug">{header}</p>
     {children}
    </div>
    {footer && (
     <div className="flex gap-2 px-4 pb-3 pt-2 border-t border-rule2/60">
      {footer}
     </div>
    )}
   </article>
  </div>
 )
}

// ── Button variants
export function Btn({ variant = 'primary', icon: Icon, onClick, disabled, children, className = '', style }) {
 const base = 'font-body font-medium text-body px-4 py-2 min-h-[36px] inline-flex items-center justify-center gap-2 transition-[background-color,box-shadow,opacity,transform] duration-100 ease-standard active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-btn'
 const cls = {
  primary:   'bg-signal text-white hover:bg-signal-dark hover:shadow-raise',
  secondary: 'border border-rule bg-stone2 text-ink hover:bg-stone3 hover:border-rule2',
  ghost:     'text-muted hover:text-ink',
 }[variant] ?? 'border border-rule bg-stone2 text-ink hover:bg-stone3 hover:border-rule2'
 return (
  <button type="button" className={`${base} ${cls} ${className}`} onClick={onClick} disabled={disabled} style={style}>
   {Icon && <Icon size={12} className="flex-shrink-0" aria-hidden="true" />}
   <span>{children}</span>
  </button>
 )
}

// ── Tabs — underline navigation tabs ─────────────────────────────────────────
// flush=true adds negative margins for use inside padded containers.
// Tab item shape: { id, label, badge?, dot? }
// dot: shows a danger pulse dot when tab is not active (e.g. urgent indicator)
// badge: shows a count chip when > 0 and tab is not active
export function Tabs({ tabs, active, onChange, flush = false, className = '' }) {
 return (
  <div className={`flex border-b border-rule2 ${flush ? '-mx-5 -mt-5 mb-5' : ''} ${className}`}>
   {tabs.map(t => (
    <button key={t.id} type="button" onClick={() => onChange(t.id)}
     className={`font-body text-label px-4 py-2.5 border-b-2 transition-colors flex-shrink-0 flex items-center gap-1.5 ${
      active === t.id ? 'border-b-signal text-ink' : 'border-b-transparent text-muted hover:text-ink'
     }`}>
     {t.label}
     {t.dot && active !== t.id && <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />}
     {t.badge > 0 && active !== t.id && <span className="font-body text-label bg-stone3 text-muted px-1">{t.badge}</span>}
    </button>
   ))}
  </div>
 )
}

// ── SegmentedControl — raised-card view toggle ───────────────────────────────
// options: [{ value, label, icon? }]
// Active segment sits on a bg-stone2 card elevated from the bg-stone3 tray.
export function SegmentedControl({ options, value, onChange }) {
 return (
  <div className="inline-flex items-stretch bg-stone3 p-[3px] gap-px flex-shrink-0">
   {options.map(o => {
    const Icon = o.icon
    const active = value === o.value
    return (
     <button key={o.value} type="button" onClick={() => onChange(o.value)}
      className={`inline-flex items-center gap-1.5 font-body text-label px-3 py-1.5 transition-colors ${
       active ? 'bg-stone4 text-ink' : 'text-muted hover:text-ink'
      }`}>
      {Icon && <Icon size={12} strokeWidth={2} className="flex-shrink-0" />}
      {o.label}
     </button>
    )
   })}
  </div>
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

// ── Page header
export function PageHead({ over, title, accent = 'var(--color-signal)', meta = [], children }) {
 return (
 <div className="px-6 py-5 border-b border-rule2 bg-stone2 relative overflow-hidden" style={{ borderLeft: `3px solid ${accent}` }}>
 {over && <div className="font-body text-label text-muted mb-2">{over}</div>}
 <div className="font-display font-bold text-metric text-ink leading-tight">
 {title}
 {children && <span className="font-display font-normal" style={{ color: accent }}> {children}</span>}
 </div>
 {meta.length > 0 && (
 <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
 {meta.map(({ role, val }, i) => (
 <div key={i} className="flex gap-1.5 items-baseline">
 <span className="font-body text-label text-muted">{role}</span>
 <span className="font-display text-ink text-body font-medium">{val}</span>
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
 {side && <RightRail>{side}</RightRail>}
 </div>
 )
}

// ── RightRail — standardized 320px side panel used across all screens
export function RightRail({ children }) {
 return (
 <div className="hidden lg:block w-80 flex-shrink-0 border-l border-rule2 overflow-y-auto bg-stone2">
  {children}
 </div>
 )
}

// ── Mini spark plot — smooth bezier curve, Google Finance style
export function WaveformSparkline({ data, color = 'var(--color-signal)', height = 44 }) {
 if (!data || data.length < 2) return null
 const { d, fillPath } = useMemo(() => {
  const W = 100, pad = 3
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => ({
   x: pad + (i / (data.length - 1)) * (W - pad * 2),
   y: height - pad - ((v - min) / range) * (height - pad * 2),
  }))
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
  return { d, fillPath: `${d} L${last.x},${height} L${points[0].x},${height} Z` }
 }, [data, height])
 const W = 100
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
 <span className="font-body font-medium text-muted text-label leading-snug flex-1">{title}</span>
 <span className={`font-body font-bold text-metric leading-none flex-shrink-0 ${valueColor}`}>{value}</span>
 </div>
 {waveformData && (
 <div className="mb-2.5">
 <WaveformSparkline data={waveformData} color={waveformColor} height={waveformHeight} />
 </div>
 )}
 {meta && (
 <div className="flex items-baseline gap-1.5 mt-2.5 pt-2 border-t border-rule2">
 <span className="font-body font-medium text-muted text-label flex-shrink-0">{meta.label}</span>
 <span className="font-body text-muted text-label">{meta.value}</span>
 </div>
 )}
 </div>
 )
}

// ── Modal overlay (critical one-time flows, safety briefings)
// Pass `title` for screen-reader announcement. `onClose` is optional — omit for mandatory flows.
export function Modal({ onClose, title, children }) {
 const dialogRef = useRef(null)
 const titleId = useId()
 const [closing, setClosing] = useState(false)
 useFocusTrap(dialogRef)

 const handleClose = onClose ? () => {
  setClosing(true)
  setTimeout(onClose, 150)
 } : undefined

 useEffect(() => {
  if (!handleClose) return
  const onKey = (e) => { if (e.key === 'Escape') handleClose() }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
 }, [handleClose])

 return (
  <div
   role="dialog"
   aria-modal="true"
   aria-labelledby={title ? titleId : undefined}
   className="fixed inset-0 z-modal flex items-center justify-center"
  >
   <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
   <div
    ref={dialogRef}
    className={`relative z-10 bg-stone3 border border-rule w-full max-w-[480px] mx-4 flex flex-col max-h-[90vh] overflow-hidden shadow-raise ${closing ? 'modal-exit' : 'modal-enter'}`}
    style={{ borderTop: '2px solid var(--color-danger)' }}
   >
    {title && <span id={titleId} className="sr-only">{title}</span>}
    {children}
   </div>
  </div>
 )
}

// ── Consequence notice (shows after action, confirms upstream impact)
export function ConsequenceNotice({ show, children }) {
 if (!show) return null
 return (
 <div role="status" aria-live="polite" className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-t border-ok/20 font-body text-ok text-label slide-in">
 <svg className="w-3 h-3 stroke-current flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 {children}
 </div>
 )
}

// ── Spinner — CSS-animated loading indicator
export function Spinner({ label = 'Loading' }) {
 return <span className="spinner" role="status" aria-label={label} />
}

// ── AnimatedCheck — SVG checkmark with stroke-draw animation
export function AnimatedCheck({ size = 12, color = 'currentColor', className = '' }) {
 return (
  <svg
   width={size} height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke={color}
   strokeWidth={2.5}
   strokeLinecap="round"
   strokeLinejoin="round"
   className={className}
   aria-hidden="true"
  >
   <polyline points="20 6 9 17 4 12" className="check-draw" />
  </svg>
 )
}

// ── VaulDrawer — Vaul-style bottom sheet (vaul.emilkowal.ski)
// Parent controls open state; onClose is called after exit animation completes.
export function VaulDrawer({ open, onClose, title, badge, children, maxHeight = '82vh', maxWidth = '520px' }) {
 const contentRef = useRef(null)
 const { exiting, exit } = useExitAnimation(220)
 useFocusTrap(contentRef, open)

 useEffect(() => {
  if (!open) return
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = prev }
 }, [open])

 useEffect(() => {
  if (!open) return
  const onKey = (e) => { if (e.key === 'Escape') exit(onClose) }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
 }, [open, onClose, exit])

 if (!open) return null
 const handleClose = () => exit(onClose)

 return (
  <div className="fixed inset-0 z-modal flex flex-col justify-end">
   <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
   <div
    ref={contentRef}
    role="dialog"
    aria-modal="true"
    aria-label={typeof title === 'string' ? title : undefined}
    className={`relative z-10 bg-stone3 flex flex-col overflow-hidden rounded-t-xl mx-auto w-full shadow-raise ${exiting ? 'drawer-out' : 'drawer-in'}`}
    style={{ maxHeight, width: `min(100%, ${maxWidth})` }}
   >
    {/* Header — only if title provided */}
    {title && (
     <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule flex-shrink-0">
      <div className="flex items-center gap-2">
       <span className="font-display font-medium text-ink text-sub">{title}</span>
       {badge}
      </div>
      <button type="button" onClick={handleClose} className="text-muted hover:text-ink transition-colors duration-100 ease-standard p-1 -mr-1" aria-label={`Close ${title}`}>
       <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
     </div>
    )}
    <div className="overflow-y-auto flex-1">
     {children}
    </div>
   </div>
  </div>
 )
}

// ── HoldButton — hold-to-confirm interaction (emilkowal.ski/ui/building-a-hold-to-delete-component)
// Requires sustained pointer hold for duration ms before action fires.
// Releases/resets if pointer leaves before completion.
export function HoldButton({ label, holdLabel, doneLabel, duration = 1500, onConfirm, tone = 'ok', className = '', disabled = false }) {
 const [progress, setProgress] = useState(0)
 const [holding, setHolding] = useState(false)
 const [done, setDone] = useState(false)
 const rafRef = useRef(null)
 const startRef = useRef(null)

 const startHold = useCallback((e) => {
  if (done || disabled) return
  e.preventDefault()
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
  setHolding(true)
  startRef.current = Date.now()
  const tick = () => {
   const elapsed = Date.now() - startRef.current
   const pct = Math.min(100, (elapsed / duration) * 100)
   setProgress(pct)
   if (pct < 100) {
    rafRef.current = requestAnimationFrame(tick)
   } else {
    setDone(true)
    setHolding(false)
    onConfirm?.()
   }
  }
  rafRef.current = requestAnimationFrame(tick)
 }, [done, disabled, duration, onConfirm])

 const stopHold = useCallback(() => {
  if (!holding || done) return
  cancelAnimationFrame(rafRef.current)
  setHolding(false)
  setProgress(0)
 }, [holding, done])

 const startHoldKB = useCallback((e) => {
  if ((e.key !== ' ' && e.key !== 'Enter') || done || disabled || holding) return
  e.preventDefault()
  setHolding(true)
  startRef.current = Date.now()
  const tick = () => {
   const elapsed = Date.now() - startRef.current
   const pct = Math.min(100, (elapsed / duration) * 100)
   setProgress(pct)
   if (pct < 100) { rafRef.current = requestAnimationFrame(tick) }
   else { setDone(true); setHolding(false); onConfirm?.() }
  }
  rafRef.current = requestAnimationFrame(tick)
 }, [done, disabled, holding, duration, onConfirm])

 const stopHoldKB = useCallback((e) => {
  if (e.key !== ' ' && e.key !== 'Enter') return
  stopHold()
 }, [stopHold])

 useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

 const TONES = {
  ok:     { fill: 'bg-ok/20',     done: 'border-ok/30 bg-ok/5',     text: 'text-ok' },
  danger: { fill: 'bg-danger/15', done: 'border-danger/30 bg-danger/5', text: 'text-danger' },
  warn:   { fill: 'bg-warn/15',   done: 'border-warn/30 bg-warn/5',  text: 'text-warn' },
 }
 const t = TONES[tone] ?? TONES.ok

 return (
  <button
   type="button"
   onPointerDown={startHold}
   onPointerUp={stopHold}
   onPointerLeave={stopHold}
   onPointerCancel={stopHold}
   onKeyDown={startHoldKB}
   onKeyUp={stopHoldKB}
   disabled={done || disabled}
   style={{ touchAction: 'none', userSelect: 'none' }}
   className={`relative overflow-hidden font-body font-medium text-body px-4 py-3 w-full text-left cursor-pointer border transition-colors ${done ? t.done : 'border-rule2 bg-stone hover:bg-stone2'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
   {/* Fill sweep — no transition while holding (rAF-driven), spring back on release */}
   <div
    className={`absolute inset-0 origin-left ${t.fill}`}
    style={{ transform: `scaleX(${progress / 100})`, transition: holding ? 'none' : `transform var(--dur-standard) var(--ease-enter)` }}
   />
   <span className={`relative flex items-center gap-2 ${done ? t.text : 'text-ink'}`}>
    {done ? (
     <><AnimatedCheck size={13} color="currentColor" />{doneLabel || label}</>
    ) : holding ? (
     holdLabel || 'Keep holding…'
    ) : label}
   </span>
  </button>
 )
}

// ── CarryForwardItem — Scan-first row: title + one-liner, details in drawer
export function CarryForwardItem({ item, acknowledged, onAcknowledge, onView }) {
 const urgencyPill = { danger: { tone: 'danger', label: 'Critical' }, warn: { tone: 'warn', label: 'Watch' }, watch: { tone: 'muted', label: 'Monitor' } }[item.urgency]

 const isClickable = onView && !item.resolvedInShift

 return (
  <div
   role={isClickable ? 'button' : undefined}
   tabIndex={isClickable ? 0 : undefined}
   onClick={isClickable ? onView : undefined}
   onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onView() } : undefined}
   className={`relative overflow-hidden border-b border-rule2 px-4 py-3 flex items-center gap-3 ${
    item.resolvedInShift ? 'bg-ok/[0.03]' : acknowledged ? 'bg-ok/[0.03]' : 'bg-stone'
   } ${isClickable ? 'cursor-pointer hover:bg-stone2 transition-colors' : ''}`}>
   {acknowledged && !item.resolvedInShift && <span className="flash-success" aria-hidden="true" />}

   {/* Title + one-liner */}
   <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-0.5">
     {!item.resolvedInShift && urgencyPill && <StatusPill tone={urgencyPill.tone}>{urgencyPill.label}</StatusPill>}
     <span className={`font-body font-medium text-body leading-snug ${item.resolvedInShift ? 'text-muted line-through' : 'text-ink'}`}>
      {item.title}
     </span>
     {item.agentSourced && !item.resolvedInShift && (
      <Brain size={9} strokeWidth={2} className="text-muted flex-shrink-0" aria-label="AI-synthesized" />
     )}
     {item.resolvedInShift && (
      <span className="font-body text-ok text-label font-medium flex items-center gap-0.5 flex-shrink-0">
       <Check size={10} strokeWidth={2.5} /> Resolved
      </span>
     )}
    </div>
    <p className="font-body text-muted text-label leading-snug m-0 line-clamp-1">{item.operationalImpact}</p>
   </div>

   {/* Acknowledge button — stopPropagation so row click doesn't fire */}
   <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
    {item.resolvedInShift ? (
     <div className="w-7 h-7 rounded-full border border-ok/20 bg-ok/5 flex items-center justify-center" aria-label="Resolved this shift">
      <Check size={13} strokeWidth={2.5} className="text-ok" />
     </div>
    ) : !acknowledged ? (
     <button type="button" onClick={() => onAcknowledge(item.id)}
      className="w-7 h-7 rounded-full border-2 border-rule2 bg-stone3 hover:border-ok hover:bg-ok/10 transition-colors flex items-center justify-center cursor-pointer"
      aria-label={`Acknowledge: ${item.title}`}>
      <Check size={13} strokeWidth={2} className="text-muted" />
     </button>
    ) : (
     <div className="w-7 h-7 rounded-full border border-ok/20 bg-ok/5 flex items-center justify-center" aria-label={`Acknowledged: ${item.title}`}>
      <Check size={13} strokeWidth={2.5} className="text-ok" />
     </div>
    )}
   </div>
  </div>
 )
}

// ── MetadataRow — Structured metadata with icon for visual hierarchy (Approach 1: Visual Hierarchy)
// Breaks dense single-line metadata into scannable rows with icons and color coding
export function MetadataRow({ icon: Icon, label, value, tone = 'muted', sub, details }) {
 const textColorClass = tone === 'ink' ? 'text-ink' : toneStyle(tone, 'text')
 const bgTone = toneStyle(tone, 'bgSubtle')

 return (
  <div className={`flex items-start gap-2.5 px-3 py-2 border-b border-rule2 ${bgTone}`}>
   {Icon && <Icon size={12} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${textColorClass}`} aria-hidden="true" />}
   <div className="flex-1 min-w-0">
    <div className="font-body font-medium text-ink text-label">{label}</div>
    <div className={`font-body text-label ${textColorClass}`}>{value}</div>
    {sub && <div className="font-body text-muted text-label mt-0.5">{sub}</div>}
   </div>
   {details && <div className="font-body text-muted text-label flex-shrink-0 text-right">{details}</div>}
  </div>
 )
}

// ── ExpandableMetadata — Progressive disclosure for detailed specs (Approach 2: Progressive Disclosure)
// Shows essential info upfront, expandable for COA specs, audit history, etc.
export function ExpandableMetadata({ title, defaultOpen = false, children, icon: Icon, tone = 'muted' }) {
 const [open, setOpen] = useState(defaultOpen)
 const bgTone = toneStyle(tone, 'bgSubtle')

 return (
  <div className="border-b border-rule2">
   <button
    type="button"
    onClick={() => setOpen(!open)}
    className={`w-full flex items-center justify-between px-3 py-2 ${bgTone} hover:opacity-75 transition-opacity`}
   >
    <div className="flex items-center gap-2 flex-1">
     {Icon && <Icon size={11} strokeWidth={2} className="text-muted flex-shrink-0" />}
     <span className="font-body font-medium text-ink text-label">{title}</span>
    </div>
    <ChevronRight
     size={14}
     strokeWidth={2}
     className={`text-muted transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`}
    />
   </button>
   {open && <div className="px-3 py-2 bg-stone">{children}</div>}
  </div>
 )
}

// ── ActionCard — Action-oriented layout for supplier issues (Approach 3: Action-Oriented Layout)
// Groups content by urgency with clear actions, status tracking, and prominence
export function SurfaceCard({ tone = 'muted', children, className = '' }) {
 return (
  <div className={`bg-stone border border-rule2 mb-2 overflow-hidden ${className}`}>
   {children}
  </div>
 )
}

const TONE_BADGE = {
 danger: 'bg-danger/[0.10] text-danger',
 warn:   'bg-warn/[0.10] text-warn',
 ok:     'bg-ok/[0.10] text-ok',
 signal:  'bg-signal/[0.10] text-signal',
 muted:  'bg-stone3 text-muted',
}
const TONE_LABEL = { danger: 'Critical', warn: 'Warning', ok: 'Clear', signal: 'Active', muted: '' }

export function ActionCard({ tone = 'danger', title, subtitle, metadata, actions, status, children, icon: CardIcon, badgeLabel }) {
 const badge = badgeLabel !== undefined ? badgeLabel : (tone !== 'muted' ? TONE_LABEL[tone] : null)
 return (
  <SurfaceCard tone={tone}>
   <div className="px-4 py-3 flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
     {badge && (
      <span className={`inline-flex items-center font-body text-label px-1.5 py-0.5 mb-1.5 ${TONE_BADGE[tone] || TONE_BADGE.muted}`}>
       {badge}
      </span>
     )}
     <div className="font-display font-medium text-ink text-sub mb-1">{title}</div>
     {subtitle && <div className="font-body text-muted text-label mb-2">{subtitle}</div>}
     {metadata && (
      <div className="flex items-center gap-2 mb-2 flex-wrap">
       {metadata.map((m, i) => (
        <span key={i} className="font-body text-muted text-label px-2 py-1 bg-stone2 rounded-sm">
         {m}
        </span>
       ))}
      </div>
     )}
     {children}
    </div>
    {(CardIcon || status) && (
     <div className="flex flex-col items-end gap-2 flex-shrink-0">
      {CardIcon && <CardIcon size={20} strokeWidth={1.5} className="text-muted opacity-50" aria-hidden="true" />}
      {status && <div className="text-right">{status}</div>}
     </div>
    )}
   </div>
   {actions && (
   <div className="px-4 pb-3 flex gap-2 flex-wrap">
     {actions}
    </div>
   )}
  </SurfaceCard>
 )
}

// ── FilterDropdown — Etsy-style single-select filter pill with floating dropdown
export function FilterDropdown({ label, options, value, onChange }) {
 const [open, setOpen] = useState(false)
 const ref = useRef(null)
 const current = options.find(o => o.value === value)
 const isActive = value !== options[0]?.value

 useEffect(() => {
  if (!open) return
  const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
  document.addEventListener('mousedown', fn)
  return () => document.removeEventListener('mousedown', fn)
 }, [open])

 return (
  <div ref={ref} className="relative">
   <button type="button" onClick={() => setOpen(o => !o)}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border font-body font-medium text-label transition-colors ${
     isActive ? 'bg-ink text-stone border-ink' : 'bg-stone border-rule2 text-ink hover:border-ink/30'
    }`}>
    {isActive ? `${label}: ${current?.label}` : label}
    <ChevronDown size={10} className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
   </button>
   {open && (
    <div className="absolute top-full left-0 mt-1 bg-stone border border-rule2 shadow-raise z-30 min-w-[160px] py-1 slide-in">
     {options.map(opt => (
      <button key={opt.value} type="button"
       onClick={() => { onChange(opt.value); setOpen(false) }}
       className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 font-body text-label transition-colors ${
        value === opt.value ? 'bg-stone2 text-ink font-medium' : 'text-muted hover:bg-stone2 hover:text-ink'
       }`}>
       <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${value === opt.value ? 'bg-ink' : 'bg-rule2'}`} />
       {opt.label}
      </button>
     ))}
    </div>
   )}
  </div>
 )
}

// ── MultiFilterDropdown — multi-select variant (checkboxes, stays open on selection)
export function MultiFilterDropdown({ label, options, values, onChange }) {
 const [open, setOpen] = useState(false)
 const ref = useRef(null)
 const count = values.length

 useEffect(() => {
  if (!open) return
  const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
  document.addEventListener('mousedown', fn)
  return () => document.removeEventListener('mousedown', fn)
 }, [open])

 const toggle = (val) =>
  onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val])

 return (
  <div ref={ref} className="relative">
   <button type="button" onClick={() => setOpen(o => !o)}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border font-body font-medium text-label transition-colors ${
     count > 0 ? 'bg-ink text-stone border-ink' : 'bg-stone border-rule2 text-ink hover:border-ink/30'
    }`}>
    {count > 0 ? `${label} (${count})` : label}
    <ChevronDown size={10} className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
   </button>
   {open && (
    <div className="absolute top-full left-0 mt-1 bg-stone border border-rule2 shadow-raise z-30 min-w-[180px] py-1 slide-in">
     {options.map(opt => {
      const checked = values.includes(opt.value)
      return (
       <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 font-body text-label transition-colors hover:bg-stone2">
        <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-ink border-ink' : 'border-rule2'}`}>
         {checked && <svg width={8} height={8} viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}><polyline points="2 6 5 9 10 3" /></svg>}
        </span>
        <span className={checked ? 'text-ink font-medium' : 'text-muted'}>{opt.label}</span>
       </button>
      )
     })}
     {count > 0 && (
      <div className="px-4 pt-1.5 pb-2 border-t border-rule2 mt-1">
       <button type="button" onClick={() => onChange([])}
        className="font-body text-label text-muted hover:text-ink transition-colors">
        Clear
       </button>
      </div>
     )}
    </div>
   )}
  </div>
 )
}

// ── ExpandableSection — Collapsible context sections (operator briefing, shift stats, etc.)
export function ExpandableSection({ title, children, defaultOpen = false }) {
 const [open, setOpen] = useState(defaultOpen)

 return (
  <div className="border-b border-rule2">
   <button
    type="button"
    onClick={() => setOpen(!open)}
    className="w-full flex items-center justify-between px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors"
   >
    <span className="font-body font-medium text-ink text-body">{title}</span>
    <ChevronRight
     size={14}
     strokeWidth={2}
     className={`text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    />
   </button>
   {open && <div>{children}</div>}
  </div>
 )
}

// ── ScoreExplainer — risk-score factor breakdown, used in shift and line panels ──────────────
// factors: [{ label, contribution, tone, state, confidence?, source?, tip? }] — confidence: 'high'|'medium'|'low'
// collapsible: true shows accordion toggle (pass open+onToggle); false always expands inline.
// adjustment: optional { from, to, note } renders a warning footer when model accuracy is reduced.
const CONF_DOT   = { high: 'bg-ok',   medium: 'bg-warn', low: 'bg-muted' }
const CONF_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }
export function ScoreExplainer({ score, factors = [], collapsible = true, open = false, onToggle, adjustment }) {
 const baseScore = score - factors.reduce((s, f) => s + f.contribution, 0)
 const body = (
  <div>
   <div className="px-4 py-2 border-b border-rule2 bg-stone">
    <div className="flex items-baseline gap-2">
     <span className="display-num text-label text-muted w-8 text-right flex-shrink-0">{baseScore}</span>
     <span className="font-body text-muted text-label flex-1">Base risk · no shift conditions</span>
    </div>
   </div>
   {factors.map((f, i) => {
    const conf      = f.confidence?.toLowerCase()
    const toneText  = f.tone === 'danger' ? 'text-danger' : f.tone === 'warn' ? 'text-warn' : 'text-ok'
    const toneBg    = f.tone === 'danger' ? 'bg-danger/[0.03]' : f.tone === 'warn' ? 'bg-warn/[0.02]' : ''
    return (
     <div key={i} className={`px-4 py-2.5 border-b border-rule2 last:border-b-0 ${toneBg}`} title={f.tip || undefined}>
      <div className="flex items-start gap-2">
       <span className={`display-num text-body font-bold w-8 text-right flex-shrink-0 leading-none pt-px ${f.contribution > 0 ? toneText : 'text-muted'}`}>
        {f.contribution > 0 ? `+${f.contribution}` : '—'}
       </span>
       <div className="flex-1 min-w-0">
        <div className={`font-body font-medium text-label leading-snug ${f.contribution > 0 ? (f.tone === 'danger' ? 'text-danger' : 'text-ink') : 'text-muted'}`}>
         {f.label}
        </div>
        <div className="font-body text-muted text-label mt-0.5 leading-snug">{f.state}</div>
        {conf && (
         <div className="flex items-center gap-1 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CONF_DOT[conf] ?? 'bg-muted'}`} />
          <span className="font-body text-muted text-label">{CONF_LABEL[conf] ?? conf} · {f.source}</span>
         </div>
        )}
       </div>
      </div>
     </div>
    )
   })}
   {adjustment && (
    <div className="px-4 py-2.5 bg-warn/[0.04] border-t-2 border-t-warn/20">
     <div className="flex items-start gap-2">
      <AlertTriangle size={11} strokeWidth={2} className="text-warn flex-shrink-0 mt-px" />
      <div>
       <div className="font-body font-medium text-ink text-label">Score adjusted {adjustment.from} → {adjustment.to}</div>
       <div className="font-body text-muted text-label mt-0.5 leading-snug">{adjustment.note}</div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
 if (!collapsible) return <div className="border-t border-rule2">{body}</div>
 return (
  <div className="border-t border-rule2">
   <button type="button" onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-2.5 bg-stone2 hover:bg-stone3 transition-colors">
    <div className="flex items-center gap-2">
     <Brain size={11} strokeWidth={2} className="text-muted" />
     <span className="font-body text-muted text-label">Why {score}?</span>
    </div>
    {open ? <ChevronUp size={11} className="text-muted" /> : <ChevronDown size={11} className="text-muted" />}
   </button>
   {open && <div className="slide-in">{body}</div>}
  </div>
 )
}

// ── SlidePanel — shared chrome for all right-side slide-over panels ────────────
// Handles backdrop, animation, focus trap, header, scrollable body, optional footer.
export function SlidePanel({ title, subtitle, icon: Icon, accentColor, ariaLabel, onClose, footer, children, maxWidth = '400px' }) {
 const panelRef = useRef(null)
 const { exiting, exit } = useExitAnimation(200)
 useFocusTrap(panelRef, true)
 const handleClose = useCallback(() => exit(onClose), [exit, onClose])
 useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') handleClose() }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
 }, [handleClose])
 return (
  <>
   <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
   <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={ariaLabel || title}
    className={`fixed top-0 right-0 bottom-0 w-full border-l border-rule z-50 flex flex-col shadow-raise ${exiting ? 'slide-right-out' : 'slide-right'}`}
    style={{ maxWidth, background: 'var(--color-stone-2)' }}>
    <div className="flex items-start justify-between px-5 py-4 border-b border-rule flex-shrink-0"
     style={{ background: 'var(--color-stone-3)', ...(accentColor ? { borderTop: `2px solid ${accentColor}` } : {}) }}>
     <div className="flex items-center gap-3 min-w-0">
      {Icon && <Icon size={20} strokeWidth={1.5} className="text-signal flex-shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
       {subtitle && <div className="font-body text-label text-muted mb-1">{subtitle}</div>}
       <div className="font-display font-bold text-ink text-sub leading-snug">{title}</div>
      </div>
     </div>
     <button type="button" onClick={handleClose} aria-label="Close panel"
      className="p-1 text-muted hover:text-ink transition-colors duration-100 flex-shrink-0 ml-2">
      <X size={14} strokeWidth={2} />
     </button>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
    {footer && (
     <div className="px-5 py-3 border-t border-rule flex-shrink-0" style={{ background: 'var(--color-stone-3)' }}>{footer}</div>
    )}
   </aside>
  </>
 )
}


// ── Animated hero number — counts 0 → value on mount ─────────────────────────
// effect: 'none' | 'glow' (hero scores) | 'blur' (AI-derived values)
// hero: true uses 650ms spring; default is 300ms for KPI grid cells
export function AnimatedScore({ value, suffix, effect = 'none', hero = false }) {
 const dur   = hero ? 650 : 300
 const delay = hero ? 200 : 150
 const [displayed, setDisplayed] = useState(0)
 useEffect(() => {
  const t = setTimeout(() => setDisplayed(value), delay)
  return () => clearTimeout(t)
 }, []) // empty deps — fires once on mount
 const node = (
  <NumberFlow
   value={displayed} suffix={suffix}
   transformTiming={{ duration: dur, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' /* token-audit: ignore — NumberFlow API requires raw string, mirrors --ease-spring */ }}
   opacityTiming={{ duration: Math.max(dur * 0.35, 60), easing: 'ease-out' }}
  />
 )
 if (effect === 'glow') return (
  <span style={{ animation: `numGlowFade ${dur + 800}ms ease-out ${delay}ms` }}>{node}</span>
 )
 if (effect === 'blur') return (
  <span style={{ animation: `numBlurIn ${dur}ms ease-out ${delay}ms both` }}>{node}</span>
 )
 return node
}

// ── Page entrance — wraps content sections with entrance animation ─────────────
// type: 'rise' | 'blur' | 'wipe' | 'fade'
// index × stagger = animationDelay (creates natural cascade)
export function PageEntrance({ children, index = 0, type = 'rise', stagger = 45, className = '', style = {} }) {
 const cls = { rise: 'page-rise', blur: 'page-blur-in', wipe: 'page-wipe', fade: 'page-fade' }[type] || 'page-rise'
 return (
  <div className={`${cls} ${className}`} style={{ animationDelay: `${index * stagger}ms`, ...style }}>
   {children}
  </div>
 )
}

// ── SectionLabel — lightweight divider used inside tab panels and drawers ───────
// Distinct from SectionHeader (screen-level). Used for in-panel section breaks.
// badgeTone: 'ok' | 'warn' | 'danger' | 'muted'
export function SectionLabel({ label, badge, badgeTone = 'muted' }) {
 const badgeCls = {
  ok:     'text-ok',
  warn:   'text-warn',
  danger: 'text-danger',
  muted:  'text-muted',
 }[badgeTone] || 'text-muted'
 return (
  <div className="px-4 py-2 bg-stone2 border-b border-rule2 flex items-center gap-2">
   <span className="font-body text-label text-muted tracking-wide flex-1">{label}</span>
   {badge && <span className={`font-body text-label font-medium ${badgeCls}`}>{badge}</span>}
  </div>
 )
}

// ── EmptyState — ghost skeleton + centered message ───────────────────────────────
// Renders faint placeholder rows so the panel communicates its structure before data loads.
export function EmptyState({ icon: Icon, message, sub, action }) {
 return (
  <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center relative overflow-hidden">
   {/* Ghost row skeleton — faint structural hint */}
   <div className="absolute inset-x-0 top-0 pointer-events-none select-none" aria-hidden="true">
    {[0.07, 0.05, 0.035, 0.025, 0.015].map((op, i) => (
     <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-rule2" style={{ opacity: op }}>
      <div className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
      <div className="h-2 bg-muted rounded-sm flex-1" style={{ maxWidth: `${60 + (i % 3) * 15}%` }} />
      <div className="h-2 bg-muted rounded-sm w-12 flex-shrink-0" />
     </div>
    ))}
   </div>
   {/* Message */}
   <div className="relative z-10">
    {Icon && <Icon size={20} strokeWidth={1.5} className="text-muted mb-3 mx-auto" />}
    <div className="font-body text-muted text-body">{message}</div>
    {sub && <div className="font-body text-muted text-label mt-1 opacity-60">{sub}</div>}
    {action && <div className="mt-4">{action}</div>}
   </div>
  </div>
 )
}

// ── StatGrid — metric strip with gap-px borders ──────────────────────────────────
// cols: number of columns (default 4). Wrap StatGrid.Cell children inside.
// size: 'sm' (15px base), 'md' (22px title, default for kpi grids), 'lg' (28px metric)
function StatGridCell({ label, value, sub, tone = 'text-ink', size = 'md' }) {
 const numCls = size === 'sm' ? 'text-sub' : size === 'lg' ? 'text-metric' : 'text-title'
 return (
  <div className="bg-stone px-4 py-3 min-w-0">
   <div className="font-body text-muted text-label mb-0.5">{label}</div>
   <div className={`display-num ${numCls} font-bold leading-none ${tone}`}>{value}</div>
   {sub && <div className={`font-body text-label mt-0.5 ${tone} opacity-80`}>{sub}</div>}
  </div>
 )
}
export function StatGrid({ cols = 4, children, className = '', noBorder = false }) {
 return (
  <div className={`flex-shrink-0 grid gap-px bg-rule2 ${noBorder ? '' : 'border-b border-rule2'} ${className}`}
   style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
   {children}
  </div>
 )
}
StatGrid.Cell = StatGridCell

// ── MasterDetail — two-panel master list + detail layout ─────────────────────────
// sidebarWidth: px value (240 | 280 | 360). Children: MasterDetail.Sidebar + MasterDetail.Content.
function MasterDetailSidebar({ children, className = '' }) {
 return <div className={`flex-shrink-0 border-r border-rule2 flex flex-col bg-stone overflow-hidden ${className}`}>{children}</div>
}
function MasterDetailContent({ children, className = '' }) {
 return <div className={`flex-1 flex flex-col overflow-hidden ${className}`}>{children}</div>
}
export function MasterDetail({ sidebarWidth = 280, children, className = '' }) {
 const kids = Array.isArray(children) ? children : [children]
 const sidebar = kids.find(c => c?.type === MasterDetailSidebar)
 const content = kids.find(c => c?.type === MasterDetailContent)
 return (
  <div className={`flex flex-1 overflow-hidden ${className}`}>
   <div style={{ width: sidebarWidth }}>{sidebar}</div>
   {content}
  </div>
 )
}
MasterDetail.Sidebar = MasterDetailSidebar
MasterDetail.Content = MasterDetailContent
