// Shared primitive components — PostHog-influenced density, Takorin palette
import { useRef, useEffect, useMemo, useId, useState, useCallback } from 'react'
import { X, ArrowRight, ChevronRight, ChevronDown, Check } from 'lucide-react'
import BoringAvatar from 'boring-avatars'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { toneStyle } from '../lib/styles'
const AVATAR_PALETTE = ['#0052CC', '#344054', '#027A48', '#B54708', '#667085']

export function PersonAvatar({ name, size = 28 }) {
 return <BoringAvatar size={size} name={name} variant="beam" colors={AVATAR_PALETTE} />
}

// ── Status pill (unified across all modules)
export function StatusPill({ tone, level, variant, status, children, dot = true, icon, className = '' }) {
 const resolvedTone = tone || level || variant || (status === 'complete' ? 'ok' : status === 'error' ? 'danger' : status === 'pending' ? 'warn' : 'info')
 const Icon = icon || (status === 'complete' ? Check : status === 'error' ? X : null)
 const label = children || (status ? status.charAt(0).toUpperCase() + status.slice(1) : null)
 return (
 <span className={`inline-flex items-center gap-1 text-label font-medium px-2 py-0.5 font-body rounded-btn ${toneStyle(resolvedTone, 'pill')} ${className}`}>
 {Icon ? <Icon size={10} strokeWidth={2} className="flex-shrink-0" /> : dot ? <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" /> : null}
 {label}
 </span>
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
    <div className="flex-1 font-body font-semibold text-ink text-base tracking-tight">{title}</div>
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
 const toneBorder = { ok:'border-t-ok', warn:'border-t-warn', danger:'border-t-danger', ochre:'border-t-ochre' }[tone] || 'border-t-ok'
 return (
 <div className={`px-5 py-4 border-r border-rule2 last:border-r-0 border-t-2 ${toneBorder}`}>
 <div className="font-body text-muted text-label tracking-normal mb-2">{label}</div>
 <div className="flex items-center gap-2">
 <div className="font-body font-bold text-metric text-ink tracking-tight">{value}</div>
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
 <div className="bg-stone border border-rule rounded-lg mb-2.5 overflow-hidden shadow-card">
  <div className={`h-[3px] w-full ${topBar}`} />
  <div className="grid grid-cols-[28px_1fr] gap-0">
   <div className={`pt-4 pl-3 font-body font-bold text-sm ${numColor}`}>{num}</div>
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
 <span className="font-body font-bold text-ink text-base">{title}</span>
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
 <div className={`font-body font-bold text-head leading-none tracking-tight ${valueColor}`}>{value}</div>
 </div>
 )
}

// ── Action banner — muted tonal style
export function ActionBanner({ tone = 'warn', headline, body, children, footer }) {
 const s = tone === 'muted'
  ? 'bg-stone3 border-b border-rule2'
  : `${toneStyle(tone, 'bg')} border-b-2 ${toneStyle(tone, 'borderBottom')}`
 return (
 <div className={`flex-shrink-0 ${s}`}>
 <div className="px-5 py-4 flex items-start gap-4">
 <div className="flex-1">
 <div className="font-body font-semibold text-ink text-base leading-tight">{headline}</div>
 {body && <div className="font-body text-muted text-body mt-1 leading-relaxed">{body}</div>}
 </div>
 {children && <div className="flex gap-2 flex-shrink-0 items-start">{children}</div>}
 </div>
 {footer && <div className="px-4 pb-3">{footer}</div>}
 </div>
 )
}

// ── Button variants
export function Btn({ variant = 'primary', icon: Icon, onClick, disabled, children, className = '', style }) {
 const base = 'font-body font-medium text-body px-4 py-2.5 min-h-[40px] inline-flex items-center justify-center gap-2 transition-[background-color,box-shadow,opacity,transform] duration-100 ease-standard active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-btn'
 const IconComp = Icon
 const cls = {
 primary:   'bg-ochre text-stone border-0 hover:bg-ochre-dark hover:shadow-raise',
 secondary: 'border border-rule2 bg-stone text-ink hover:bg-stone2',
 }[variant] ?? 'bg-ink text-stone border-0 hover:bg-ink2'
 return (
 <button type="button" className={`${base} ${cls} ${className}`} onClick={onClick} disabled={disabled} style={style}>
  {IconComp && <IconComp size={12} className="flex-shrink-0" aria-hidden="true" />}
  <span>{children}</span>
 </button>
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
// Default color logic: higher pct = better (supplier quality scores).
// For risk scores (higher = worse), pass an explicit color prop.
export function ScoreRing({ pct = 0, size = 32, color }) {
 const defaultColor = pct >= 75 ? 'var(--color-ok)' : pct >= 60 ? 'var(--color-warn)' : 'var(--color-danger)'
 const c = color || defaultColor
 const barH = size <= 40 ? 3 : 5
 const numSize = size <= 40 ? 11 : Math.round(size * 0.26)
 const w = size <= 40 ? 56 : size * 2
 return (
 <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: w }}>
 <span className="font-display font-extrabold leading-none" style={{ fontSize: numSize, color: c }}>{pct}</span>
 <div style={{ height: barH, background: 'var(--color-rule-2)' }}>
 <div style={{ height: '100%', width: `${pct}%`, background: c, transition: 'width var(--dur-data) var(--ease-enter)' }} />
 </div>
 </div>
)
}

// ── Page header
export function PageHead({ over, title, accent = 'var(--color-ochre)', meta = [], children }) {
 return (
 <div className="px-6 py-6 border-b border-rule2 bg-stone" style={{ borderLeft: `4px solid ${accent}` }}>
 <div className="font-body text-muted text-label tracking-normal mb-2">{over}</div>
 <div className="font-body font-bold text-page text-ink leading-tight tracking-tight">
 {title}
 {children && <span className="font-body font-normal text-ochre"> {children}</span>}
 </div>
 {meta.length > 0 && (
 <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
 {meta.map(({ role, val }, i) => (
 <div key={i} className="flex gap-1.5 items-baseline">
 <span className="font-body text-muted text-label">{role}</span>
 <span className="font-body text-ink text-body font-medium">{val}</span>
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
export function WaveformSparkline({ data, color = 'var(--color-ochre)', height = 44 }) {
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
 <span className="font-body font-medium text-muted text-label leading-snug flex-1 tracking-normal">{title}</span>
 <span className={`font-body font-bold text-metric leading-none tracking-tight flex-shrink-0 ${valueColor}`}>{value}</span>
 </div>
 {waveformData && (
 <div className="mb-2.5">
 <WaveformSparkline data={waveformData} color={waveformColor} height={waveformHeight} />
 </div>
 )}
 {meta && (
 <div className="flex items-baseline gap-1.5 mt-2.5 pt-2 border-t border-rule2">
 <span className="font-body font-medium text-muted text-label tracking-normal flex-shrink-0">{meta.label}</span>
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
   <div className="absolute inset-0 bg-ink/40" onClick={handleClose} />
   <div
    ref={dialogRef}
    className={`relative z-10 bg-stone border border-rule2 w-full max-w-[480px] mx-4 flex flex-col max-h-[90vh] overflow-hidden ${closing ? 'modal-exit' : 'modal-enter'}`}
    style={{ borderTop: '3px solid var(--color-danger)' }}
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
   <div className="absolute inset-0 bg-transparent" onClick={handleClose} />
   <div
    ref={contentRef}
    role="dialog"
    aria-modal="true"
    aria-label={typeof title === 'string' ? title : undefined}
    className={`relative z-10 bg-stone flex flex-col overflow-hidden rounded-t-2xl mx-auto w-full shadow-raise ${exiting ? 'drawer-out' : 'drawer-in'}`}
    style={{ maxHeight, width: `min(100%, ${maxWidth})` }}
   >
    {/* Header — only if title provided */}
    {title && (
     <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule2 flex-shrink-0">
      <div className="flex items-center gap-2">
       <span className="font-body font-medium text-ink text-base">{title}</span>
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
    style={{ transform: `scaleX(${progress / 100})`, transition: holding ? 'none' : 'transform 300ms cubic-bezier(0.19,0.91,0.38,1)' }}
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

// ── AcceptanceGate — Sticky top bar for shift handoff acceptance
// Persistent accountability framing: incoming supervisor name + carry-forward count + acceptance status
export function AcceptanceGate({ incomingSupervisor, shiftTime, carryForwardCount, acknowledgedCount, allAcknowledged, onAccept, disabled = false }) {
 const bannerTone = carryForwardCount > 0 ? (allAcknowledged ? 'ok' : 'warn') : 'ok'
 const statusText = carryForwardCount > 0 ? `${acknowledgedCount} of ${carryForwardCount} acknowledged` : 'All clear'
 const bannerColor = {
  ok: 'bg-ok/[0.05] border-b-ok',
  warn: 'bg-warn/[0.05] border-b-warn',
  danger: 'bg-danger/[0.05] border-b-danger',
 }[bannerTone]

 return (
  <div className={`sticky top-0 z-40 flex items-center justify-between gap-4 px-4 py-3 border-b-2 ${bannerColor} flex-shrink-0`}>
   <div className="flex-1">
    <div className="flex items-baseline gap-2 mb-0.5">
     <span className="font-body font-medium text-ink text-body">{incomingSupervisor}</span>
     <span className="font-body text-muted text-label">{shiftTime}</span>
    </div>
    <div className={`font-body text-label ${carryForwardCount > 0 && !allAcknowledged ? 'text-warn' : 'text-muted'}`}>
     {carryForwardCount > 0 ? `${carryForwardCount} item${carryForwardCount !== 1 ? 's' : ''} require acknowledgment` : 'No carry-forward items'}
    </div>
   </div>
   <Btn
    variant="primary"
    onClick={onAccept}
    disabled={!allAcknowledged || disabled}
   >
    Accept shift
   </Btn>
  </div>
 )
}

// ── CarryForwardItem — Dense row for each carry-forward risk
// Severity border + title + impact + owner + action + acknowledgment control
export function CarryForwardItem({ item, acknowledged, onAcknowledge, onView }) {
 const borderColor = item.resolvedInShift ? 'border-l-ok'
  : { danger: 'border-l-danger', warn: 'border-l-warn', watch: 'border-l-rule2' }[item.urgency] || 'border-l-rule2'

 const actionColor = {
  danger: 'text-danger',
  warn: 'text-warn',
  watch: 'text-muted',
 }[item.urgency] || 'text-muted'

 return (
  <div className={`relative overflow-hidden border-l-2 ${borderColor} border-b border-rule2 px-4 py-3 flex gap-3 ${
   item.resolvedInShift ? 'bg-ok/[0.03]' : acknowledged ? 'bg-ok/[0.03]' : 'bg-stone'
  }`}>
   {acknowledged && !item.resolvedInShift && <span className="flash-success" aria-hidden="true" />}
   <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1 flex-wrap">
     <span className={`font-body font-medium text-body leading-snug ${item.resolvedInShift ? 'text-muted line-through' : 'text-ink'}`}>{item.title}</span>
     {item.resolvedInShift && (
      <span className="font-body text-ok text-label font-medium flex items-center gap-0.5 flex-shrink-0">
       <Check size={10} strokeWidth={2.5} />
       Resolved in ShiftIQ
      </span>
     )}
    </div>
    <div className="font-body text-muted text-label leading-snug mb-1">{item.operationalImpact}</div>
    <div className="font-body text-muted text-label leading-snug mb-2">{item.ownerContext}</div>
    {!item.resolvedInShift && <span className={`font-body font-medium text-label ${actionColor}`}>{item.recommendedAction}</span>}
    {onView && !item.resolvedInShift && (
     <button type="button" onClick={onView} className="font-body text-ochre text-label mt-1.5 flex items-center gap-1 hover:text-ink transition-colors">
      <ArrowRight size={9} />View in ShiftIQ
     </button>
    )}
   </div>
   <div className="flex-shrink-0 flex items-center">
    {item.resolvedInShift ? (
     <div className="flex items-center justify-center w-12 h-12 rounded-full border border-ok/20 bg-ok/5" aria-label="Resolved this shift">
      <Check size={18} strokeWidth={2.5} className="text-ok" />
     </div>
    ) : !acknowledged ? (
     <button
      type="button"
      onClick={() => onAcknowledge(item.id)}
      className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-rule2 bg-stone3 hover:border-muted transition-colors cursor-pointer"
      aria-label={`Acknowledge: ${item.title}`}
     >
      <Check size={18} strokeWidth={2} className="text-ink" />
     </button>
    ) : (
     <div className="flex items-center justify-center w-12 h-12 rounded-full border border-ok/20 bg-ok/5" aria-label={`Acknowledged: ${item.title}`}>
      <Check size={18} strokeWidth={2.5} className="text-ok" />
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
  <div className={`border-l-2 ${toneStyle(tone, 'borderLeft')} bg-stone border border-rule rounded-lg mb-2.5 overflow-hidden shadow-card ${className}`}>
   {children}
  </div>
 )
}

export function ActionCard({ tone = 'danger', title, subtitle, metadata, actions, status, children, icon: CardIcon }) {
 return (
  <SurfaceCard tone={tone}>
   <div className="px-4 py-3 flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
     <div className="font-body font-medium text-ink text-body mb-1">{title}</div>
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
      {CardIcon && <CardIcon size={22} strokeWidth={1.5} className="text-muted opacity-50" aria-hidden="true" />}
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

// ── SlidePanel — shared chrome for all right-side slide-over panels ────────────
// Handles backdrop, animation, focus trap, header, scrollable body, optional footer.
export function SlidePanel({ title, subtitle, icon: Icon, accentColor, ariaLabel, onClose, footer, children, maxWidth = '400px' }) {
 const panelRef = useRef(null)
 const { exiting, exit } = useExitAnimation(200)
 useFocusTrap(panelRef, true)
 const handleClose = () => exit(onClose)
 return (
  <>
   <div className="fixed inset-0 bg-ink/20 z-40" onClick={handleClose} />
   <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={ariaLabel || title}
    className={`fixed top-0 right-0 bottom-0 w-full bg-stone border-l border-rule2 z-50 flex flex-col ${exiting ? 'slide-right-out' : 'slide-right'}`}
    style={{ maxWidth }}>
    <div className="flex items-start justify-between px-5 py-4 border-b border-rule2 bg-stone2 flex-shrink-0"
     style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}>
     <div className="flex items-center gap-3 min-w-0">
      {Icon && <Icon size={26} strokeWidth={1.5} className="text-ochre flex-shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
       {subtitle && <div className="font-body text-muted text-label mb-1">{subtitle}</div>}
       <div className="font-display font-bold text-ink text-base leading-snug">{title}</div>
      </div>
     </div>
     <button type="button" onClick={handleClose} aria-label="Close panel"
      className="p-1 text-muted hover:text-ink transition-colors duration-100 flex-shrink-0 ml-2">
      <X size={14} strokeWidth={2} />
     </button>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
    {footer && (
     <div className="px-5 py-3 border-t border-rule2 bg-stone2 flex-shrink-0">{footer}</div>
    )}
   </aside>
  </>
 )
}
