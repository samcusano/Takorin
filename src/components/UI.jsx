// Shared primitive components — PostHog-influenced density, Takorin palette

// ── Urgency pill (unified across all modules)
export function Urg({ level = 'info', children }) {
  const cls = {
    critical: 'text-danger bg-danger/10',
    warn:     'text-warn bg-warn/10',
    ok:       'text-ok bg-ok/10',
    info:     'text-muted bg-stone3',
  }[level]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 font-body italic ${cls}`}>
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
      <div className="font-body italic text-muted text-[10px] mb-1">{label}</div>
      <div className="display-num text-xl text-ink">{value}</div>
      {sub && <div className="font-body italic text-ghost text-[10px] mt-0.5">{sub}</div>}
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
      <div className="flex items-center gap-1.5 font-body italic text-muted text-[11px]">
        {Icon && <Icon size={11} strokeWidth={2} style={accent ? { color: accent } : undefined} />}
        {tag}
      </div>
      <div className="flex-1 font-body text-ink text-[13px] font-medium">{title}</div>
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
        <div className={`pt-4 pl-3 font-display font-bold italic text-sm ${urgency === 'danger' ? 'text-danger' : urgency === 'warn' ? 'text-warn' : 'text-muted'}`}>
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
        {sub && <span className="font-body italic text-ghost text-[10px]">{sub}</span>}
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
        {sub && <div className="font-body italic text-ghost text-[10px] mt-0.5">{sub}</div>}
      </div>
      <div className={`display-num text-base ${valueColor}`}>{value}</div>
    </div>
  )
}

// ── Action banner
export function ActionBanner({ color = '#C17D2A', headline, body, children, footer }) {
  return (
    <div className="flex-shrink-0" style={{ background: color }}>
      <div className="px-5 py-3.5 flex items-start gap-4">
        <div className="flex-1">
          <div className="font-display font-bold italic text-stone text-base leading-tight">{headline}</div>
          <div className="font-body italic text-stone/80 text-[12px] mt-1 leading-relaxed">{body}</div>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-start mt-0.5">{children}</div>
      </div>
      {footer && <div className="px-5 pb-3">{footer}</div>}
    </div>
  )
}

// ── Button variants
export function Btn({ variant = 'primary', onClick, disabled, children, style }) {
  const base = 'font-body font-medium text-[11px] px-3 py-1.5 transition-all duration-100 active:scale-[0.97] cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed'
  const cls = {
    primary: 'bg-stone text-ink hover:opacity-90',
    ghost:   'bg-stone/20 text-stone hover:bg-stone/30',
    danger:  'bg-danger text-white hover:opacity-90',
    muted:   'bg-stone3 text-muted cursor-not-allowed',
  }[variant]
  return (
    <button className={`${base} ${cls}`} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}

// ── Chip
export function Chip({ tone = 'ok', children }) {
  const cls = {
    ok:      'text-ok bg-ok/10',
    warn:    'text-warn bg-warn/10',
    danger:  'text-danger bg-danger/10',
    muted:   'text-muted bg-stone3',
    int:     'text-int bg-int/10',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 font-body italic font-medium text-[10px] px-2 py-0.5 ${cls}`}>
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

// ── Score ring — circular progress indicator
export function ScoreRing({ pct = 0, size = 32, color }) {
  const r = size * 0.38
  const sw = size * 0.11
  const fs = Math.round(size * 0.28)
  const circ = 2 * Math.PI * r
  const cx = size / 2, cy = size / 2
  const c = color || (pct >= 75 ? '#3A8A5A' : pct >= 50 ? '#C4920A' : '#D94F2A')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D8D2C8" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt" />
      <text x={cx} y={cy + fs * 0.44} textAnchor="middle"
        style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fontSize:fs, fill:c }}>
        {pct}
      </text>
    </svg>
  )
}

// ── Page header
export function PageHead({ over, title, accent = '#C17D2A', meta = [], children }) {
  return (
    <div className="px-5 py-4 border-b border-rule2 bg-stone2" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="font-body italic text-muted text-[11px] mb-1">{over}</div>
      <div className="font-display font-bold italic text-2xl text-ink leading-tight">
        {title}
        {children && <span className="font-light text-ochre"> {children}</span>}
      </div>
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
          {meta.map(({ role, val }, i) => (
            <div key={i} className="flex gap-1.5 items-baseline">
              <span className="font-body italic text-ghost text-[10px]">{role}</span>
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

// ── Waveform sparkline with playhead marker
export function WaveformSparkline({ data, color = '#C17D2A', height = 44 }) {
  const max = Math.max(...data, 1)
  const nowIdx = data.length - 1
  return (
    <div className="flex items-end gap-0.5 waveform-reveal" style={{ height }}>
      {data.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * height))
        const isNow = i === nowIdx
        const isPast = i < nowIdx
        return (
          <div key={i} className="relative flex-1 flex flex-col justify-end" style={{ height }}>
            {isNow && (
              <div
                className="absolute rounded-full"
                style={{ width: 6, height: 6, background: '#100F0D', bottom: barH + 3, left: '50%', transform: 'translateX(-50%)' }}
              />
            )}
            <div style={{ height: barH, background: isNow ? '#100F0D' : isPast ? color : '#DDD8CF', opacity: isPast ? 0.65 : 1 }} />
          </div>
        )
      })}
    </div>
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
          <span className="font-body italic text-muted text-[10px]">{meta.value}</span>
        </div>
      )}
    </div>
  )
}

// ── Consequence notice (shows after action, confirms upstream impact)
export function ConsequenceNotice({ show, children }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-t border-ok/20 font-body italic text-ok text-[11px] slide-in">
      <svg className="w-3 h-3 stroke-current flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {children}
    </div>
  )
}
