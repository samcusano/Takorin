import { useState, useEffect, useRef } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const SHIFT = {
  line: 'Line 4', supervisor: 'D. Kowalski', date: 'April 16',
  oee: { start: 71, final: 81, target: 82, baseline: 75 },
  units: { produced: 38420, target: 42000 },
  scrap: { pct: 2.1, target: 3.0 },
  riskScore: { start: 78, final: 34 },
}

const DRIVERS = [
  { id: 'staff',    label: 'Staffing correction',   short: 'Staffing',   delta: +2.1, t: 48, note: 'Martinez → Sauce Dosing',      tone: 'ok' },
  { id: 'allergen', label: 'Allergen changeover',   short: 'Allergen',   delta: +1.5, t: 42, note: 'Changeover log signed',         tone: 'ok' },
  { id: 'check',    label: 'Checklist completion',  short: 'Checklists', delta: +1.4, t: 42, note: '4 overdue items cleared',       tone: 'ok' },
  { id: 'sensor',   label: 'Sensor A-7 flagged',    short: 'Sensor A-7', delta: +0.8, t: 30, note: 'Bearing inspection booked',    tone: 'warn' },
  { id: 'scada',    label: 'SCADA gap — Oven B',     short: 'SCADA gap',  delta: -0.3, t: null, note: 'Sensor stale · confidence penalty', tone: 'danger' },
]

const HISTORY = [
  { label: 'Apr 13 PM', oee: 86, supervisor: 'Santos' },
  { label: 'Apr 14 AM', oee: 71, supervisor: 'Kowalski' },
  { label: 'Apr 14 PM', oee: 84, supervisor: 'Santos' },
  { label: 'Apr 15 AM', oee: 79, supervisor: 'Kowalski' },
  { label: 'Apr 15 PM', oee: 88, supervisor: 'Santos' },
  { label: 'Apr 16 AM', oee: 81, supervisor: 'Kowalski', current: true },
]

const INTERVENTIONS = [
  { t: 30, label: 'Sensor A-7', short: 'S' },
  { t: 42, label: 'Allergen + Checklists', short: '4' },
  { t: 48, label: 'Martinez reassigned', short: 'M' },
]

// ── Animated bar hook ─────────────────────────────────────────────────────────

function useAnimatedValue(target, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setValue(target), delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return value
}

// ── Warm Instrumentation ──────────────────────────────────────────────────────
// Direction A evolved: analytical backbone + B's pacing + C's materiality.
// The narrative emerges from the instrumentation itself — not from paragraphs.

function AttributionRow({ driver, index, absMax = 2.5 }) {
  const pct = Math.abs(driver.delta) / absMax
  const barPct = useAnimatedValue(pct * 100, 80 + index * 60)
  const isPos = driver.delta >= 0

  const toneColor = driver.tone === 'ok'
    ? 'var(--color-ok)'
    : driver.tone === 'warn'
    ? 'var(--color-warn)'
    : 'var(--color-danger)'

  const rowBg = driver.tone === 'danger' ? 'bg-danger/[0.025]' : ''
  const rowBorder = driver.tone === 'danger' ? 'border-l-danger/50' : 'border-l-transparent'

  return (
    <div className={`grid items-center border-b border-rule2/50 border-l-2 ${rowBg} ${rowBorder}`}
      style={{ gridTemplateColumns: '200px 1fr 64px 80px', minHeight: 44 }}>

      {/* Label */}
      <div className="px-5 py-3">
        <div className="font-body text-[12px] font-medium text-ink leading-none mb-0.5">{driver.label}</div>
        {driver.note && <div className="font-body text-[10px] text-ghost leading-none">{driver.note}</div>}
      </div>

      {/* Contribution bar — zero-centered */}
      <div className="px-4 py-3">
        <div className="relative h-[4px] bg-rule2">
          {/* Zero line */}
          <div className="absolute top-1/2 -translate-y-1/2 w-px h-[10px] bg-ink/15" style={{ left: '50%' }} />
          {/* Bar */}
          <div className="absolute inset-y-0 transition-[width] duration-500 ease-in-out"
            style={{
              width: `${barPct / 2}%`,
              left: isPos ? '50%' : `${50 - barPct / 2}%`,
              background: toneColor,
              opacity: driver.tone === 'danger' ? 0.7 : 0.85,
              transitionDelay: `${index * 60}ms`,
            }}
          />
        </div>
      </div>

      {/* Delta */}
      <div className="text-right px-2 py-3">
        <span className="display-num text-[16px] leading-none tabular-nums"
          style={{ color: toneColor }}>
          {isPos ? '+' : ''}{driver.delta.toFixed(1)}
        </span>
        <div className="font-body text-[9px] text-ghost mt-0.5">pp OEE</div>
      </div>

      {/* Time */}
      <div className="text-right px-5 py-3">
        <span className="font-mono text-[10px] text-ghost tabular-nums">
          {driver.t ? `T+${driver.t}` : '—'}
        </span>
      </div>
    </div>
  )
}

function DirectionWarm() {
  const netDelta = DRIVERS.reduce((s, d) => s + d.delta, 0)
  const totalGain = DRIVERS.filter(d => d.delta > 0).reduce((s, d) => s + d.delta, 0)

  // Animated primary OEE
  const animOEE = useAnimatedValue(81, 200)

  return (
    <div className="font-body text-ink bg-stone min-h-screen">

      {/* ── Primary reading — the number that matters ── */}
      <div className="px-8 pt-8 pb-6 border-b border-rule2">
        <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-4">
          {SHIFT.line} · {SHIFT.date} AM · {SHIFT.supervisor}
        </div>
        <div className="flex items-end gap-10">
          {/* OEE — the primary reading */}
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-1">OEE Final</div>
            <div className="flex items-baseline gap-2">
              <span className="display-num leading-none text-ok" style={{ fontSize: 64 }}>{animOEE}</span>
              <span className="font-body text-muted text-[18px]">%</span>
              <div className="ml-2 flex flex-col gap-0.5">
                <span className="font-body text-ok text-[10px]">+6pp vs baseline</span>
                <span className="font-body text-ghost text-[10px]">target 82% · 1pt short</span>
              </div>
            </div>
          </div>

          {/* Secondary metrics — subordinate to OEE */}
          <div className="flex gap-8 pb-1">
            {[
              { label: 'Units',       value: '38.4K', sub: '91.5% of target', tone: 'ok' },
              { label: 'Scrap',       value: '2.1%',  sub: '−0.9pts vs target', tone: 'ok' },
              { label: 'Risk score',  value: '34',    sub: 'started at 78', tone: 'ok' },
              { label: 'Interventions', value: '4',   sub: 'acted this shift', tone: 'warn' },
            ].map(m => {
              const c = m.tone === 'ok' ? 'text-ok' : m.tone === 'warn' ? 'text-warn' : 'text-danger'
              return (
                <div key={m.label} className="border-l border-rule2 pl-6">
                  <div className="font-body text-ghost text-[9px] uppercase tracking-[0.08em] mb-1">{m.label}</div>
                  <div className={`display-num text-[24px] leading-none ${c}`}>{m.value}</div>
                  <div className="font-body text-ghost text-[10px] mt-0.5">{m.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid divide-x divide-rule2" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* ── Left: Attribution instrumentation ── */}
        <div className="py-6">

          {/* Temporal rail — pacing from B, structure from A */}
          <div className="px-5 mb-5">
            <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-2">Shift timeline</div>
            <div className="relative h-[24px]">
              {/* Rail */}
              <div className="absolute top-[10px] left-0 right-0 h-px bg-rule2" />
              {/* Hour marks */}
              {[0, 25, 50, 75, 100].map(t => (
                <div key={t} className="absolute top-[6px] flex flex-col items-center" style={{ left: `${t}%`, transform: 'translateX(-50%)' }}>
                  <div className="w-px h-[8px] bg-rule2" />
                  <div className="font-mono text-[8px] text-ghost mt-0.5">
                    {['06:00', '08:00', '10:00', '12:00', '14:00'][t / 25]}
                  </div>
                </div>
              ))}
              {/* Intervention marks — C's signal tension, B's temporal placement */}
              {INTERVENTIONS.map(iv => (
                <div key={iv.t} className="absolute top-0 flex flex-col items-center" style={{ left: `${iv.t}%`, transform: 'translateX(-50%)' }}>
                  <div className="w-[18px] h-[18px] rounded-full border border-ochre bg-stone flex items-center justify-center" style={{ marginTop: -1 }}>
                    <span className="font-body text-ochre text-[8px] font-bold leading-none">{iv.short}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attribution matrix */}
          <div className="border-t border-rule2">
            {/* Column headers */}
            <div className="grid px-0 py-2 bg-stone2 border-b border-rule2"
              style={{ gridTemplateColumns: '200px 1fr 64px 80px' }}>
              <div className="px-5 font-body text-ghost text-[9px] uppercase tracking-[0.1em]">Signal</div>
              <div className="px-4 font-body text-ghost text-[9px] uppercase tracking-[0.1em]">Contribution to OEE</div>
              <div className="text-right px-2 font-body text-ghost text-[9px] uppercase tracking-[0.1em]">Delta</div>
              <div className="text-right px-5 font-body text-ghost text-[9px] uppercase tracking-[0.1em]">When</div>
            </div>

            {/* Bar axis label */}
            <div className="relative h-[1px] bg-transparent">
              <div className="absolute font-mono text-[8px] text-ghost/40" style={{ left: 'calc(200px + 1rem)', top: -4 }}>−</div>
              <div className="absolute font-mono text-[8px] text-ghost/40 right-[98px]" style={{ top: -4 }}>+</div>
            </div>

            {DRIVERS.map((d, i) => <AttributionRow key={d.id} driver={d} index={i} />)}

            {/* Net row */}
            <div className="grid items-center border-t border-rule2 bg-stone2"
              style={{ gridTemplateColumns: '200px 1fr 64px 80px', minHeight: 40 }}>
              <div className="px-5 py-2.5">
                <div className="font-body text-ink text-[11px] font-semibold">Net attribution</div>
              </div>
              <div className="px-4 py-2.5 font-body text-ghost text-[10px]">baseline 75% → actual 81%</div>
              <div className="text-right px-2 py-2.5">
                <span className="display-num text-[16px] text-ok tabular-nums">+{netDelta.toFixed(1)}</span>
                <div className="font-body text-[9px] text-ghost">pp OEE</div>
              </div>
              <div className="px-5 py-2.5" />
            </div>
          </div>

          {/* OEE calibration bar — normalized 0→100 */}
          <div className="px-5 pt-5 pb-2">
            <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-3">OEE position · normalized 0–100</div>
            <div className="relative h-[6px] bg-rule2">
              {/* Baseline marker */}
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-[14px] bg-ghost/30"
                style={{ left: `${SHIFT.oee.baseline}%` }} />
              {/* Target marker — warm amber, always visible */}
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-[18px]"
                style={{ left: `${SHIFT.oee.target}%`, background: 'var(--color-warn)', opacity: 0.8 }} />
              {/* Actual fill */}
              <div className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-in-out"
                style={{ width: `${SHIFT.oee.final}%`, background: 'var(--color-ok)', opacity: 0.75, transitionDelay: '600ms' }} />
            </div>
            <div className="flex mt-1.5 relative">
              <span className="font-mono text-[9px] text-ghost">0</span>
              <div className="flex-1 relative">
                <span className="absolute font-mono text-[9px] text-ghost" style={{ left: `${SHIFT.oee.baseline - 6}%` }}>
                  baseline {SHIFT.oee.baseline}
                </span>
                <span className="absolute font-mono text-[9px] text-warn" style={{ left: `${SHIFT.oee.target - 4}%` }}>
                  target {SHIFT.oee.target}
                </span>
                <span className="absolute font-mono text-[9px] text-ok font-semibold" style={{ left: `${SHIFT.oee.final - 3}%` }}>
                  {SHIFT.oee.final}
                </span>
              </div>
              <span className="font-mono text-[9px] text-ghost">100</span>
            </div>
          </div>
        </div>

        {/* ── Right: Shift comparison + signal density ── */}
        <div className="py-6">

          {/* 6-shift comparison — temporal context from B */}
          <div className="px-6 mb-6">
            <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-3">
              6-shift comparison · Line 4
            </div>
            {HISTORY.map((h, i) => {
              const tone = h.oee >= 85 ? 'ok' : h.oee >= 78 ? 'warn' : 'danger'
              const toneColor = tone === 'ok' ? 'var(--color-ok)' : tone === 'warn' ? 'var(--color-warn)' : 'var(--color-danger)'
              const barPct = useAnimatedValue(h.oee, 300 + i * 50)
              return (
                <div key={i} className={`flex items-center gap-3 py-2 border-b border-rule2/40 ${h.current ? 'bg-ok/[0.02] -mx-6 px-6' : ''}`}>
                  <div className="font-body text-[10px] text-ghost w-[76px] flex-shrink-0 leading-tight">
                    {h.label}
                    <div className="text-[9px] text-ghost/50">{h.supervisor}</div>
                  </div>
                  <div className="flex-1 h-[3px] bg-rule2 relative">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-500"
                      style={{
                        width: `${barPct}%`,
                        background: h.current ? toneColor : 'var(--color-ghost)',
                        opacity: h.current ? 0.8 : 0.35,
                        transitionDelay: `${300 + i * 50}ms`,
                      }}
                    />
                  </div>
                  <div className="font-mono text-[11px] tabular-nums w-[30px] text-right flex-shrink-0"
                    style={{ color: h.current ? toneColor : 'var(--color-ghost)' }}>
                    {h.oee}
                  </div>
                  {h.current && (
                    <span className="font-body text-ok text-[9px] uppercase tracking-widest flex-shrink-0 w-[28px]">AM</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Signal density */}
          <div className="px-6 border-t border-rule2 pt-5">
            <div className="font-body text-ghost text-[9px] uppercase tracking-[0.1em] mb-4">Signal density · this shift</div>
            {[
              { label: 'Interventions acted', v: 4, max: 8, tone: 'ok' },
              { label: 'Risk signals detected', v: 5, max: 8, tone: 'warn' },
              { label: 'CCP readings logged', v: 12, max: 24, tone: 'ok' },
              { label: 'Model confidence', v: 91, max: 100, tone: 'ok' },
            ].map((m, i) => {
              const col = m.tone === 'ok' ? 'var(--color-ok)' : m.tone === 'warn' ? 'var(--color-warn)' : 'var(--color-danger)'
              const barW = useAnimatedValue((m.v / m.max) * 100, 400 + i * 60)
              return (
                <div key={m.label} className="mb-3.5">
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-[10px] text-muted">{m.label}</span>
                    <span className="font-mono text-[10px] tabular-nums text-ghost">{m.v}/{m.max}</span>
                  </div>
                  <div className="h-[3px] bg-rule2 relative">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-500"
                      style={{ width: `${barW}%`, background: col, opacity: 0.75, transitionDelay: `${400 + i * 60}ms` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* SCADA gap callout — atmospheric depth from C, structure from A */}
          <div className="mx-4 mt-5 p-3.5 border border-danger/20 bg-danger/[0.025]">
            <div className="flex items-start gap-2.5">
              {/* Thermal indicator dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-danger mt-1 flex-shrink-0 beat" />
              <div>
                <div className="font-body font-medium text-danger text-[11px] mb-0.5">SCADA gap — Oven B</div>
                <div className="font-body text-danger/70 text-[10px] leading-relaxed">
                  Sensor stale since Apr 9 · −0.3pp confidence penalty applied · highest-leverage restoration target
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-danger/15 flex justify-between">
              <span className="font-mono text-[9px] text-danger/50">confidence impact</span>
              <span className="font-mono text-[9px] text-danger tabular-nums">−0.3pp OEE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Direction B: The Shift Arc (preserved as reference) ───────────────────────

function DirectionB() {
  const netDelta = DRIVERS.reduce((s, d) => s + d.delta, 0)
  const W = 800, H = 200
  const padL = 48, padR = 64, padT = 16, padB = 32
  const chartW = W - padL - padR, chartH = H - padT - padB
  const minOEE = 62, maxOEE = 90
  const ARC = [
    {t:0,oee:71},{t:12,oee:69},{t:20,oee:67},{t:30,oee:68},{t:42,oee:73},
    {t:48,oee:76},{t:60,oee:78},{t:75,oee:80},{t:90,oee:80},{t:100,oee:81},
  ]
  const xOf = t => padL + (t/100)*chartW
  const yOf = v => padT + chartH - ((v-minOEE)/(maxOEE-minOEE))*chartH
  const pts = ARC.map(p => ({x:xOf(p.t),y:yOf(p.oee),...p}))
  const pathD = pts.map((p,i) => `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const fillPts = [...pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`),`${xOf(100)},${padT+chartH}`,`${xOf(0)},${padT+chartH}`].join(' ')

  return (
    <div className="bg-stone min-h-screen">
      <div className="max-w-[820px] mx-auto px-8 pt-10 pb-6">
        <div className="font-body text-ghost text-[9px] uppercase tracking-[0.12em] mb-4">Line 4 · April 16 · D. Kowalski · AM Shift</div>
        <h1 className="font-display font-bold text-[44px] leading-[1.05] text-ink mb-3">
          Line 4 crossed the 82% OEE target<br /><span className="text-ok">for the first time this quarter.</span>
        </h1>
        <p className="font-body text-ink2 text-[13px] leading-relaxed mb-0 max-w-[540px]">
          Four decisions in a 6-minute window at T+42 reversed a deteriorating shift. The machine didn't change — the operational context did.
        </p>
      </div>
      <div className="max-w-[820px] mx-auto px-8">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="arcFill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-ok)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--color-ok)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[65,70,75,80,85].map(v=>(
            <g key={v}>
              <line x1={padL} x2={W-padR} y1={yOf(v)} y2={yOf(v)} stroke="#CAC2B6" strokeWidth="0.5" opacity="0.5"/>
              <text x={padL-6} y={yOf(v)+3} fontSize="8" fill="#686058" textAnchor="end">{v}</text>
            </g>
          ))}
          <line x1={padL} x2={W-padR} y1={yOf(82)} y2={yOf(82)} stroke="var(--color-warn)" strokeWidth="0.75" strokeDasharray="5,3" opacity="0.6"/>
          <text x={W-padR+6} y={yOf(82)+3} fontSize="8" fill="var(--color-warn)">Target</text>
          <polygon points={fillPts} fill="url(#arcFill2)"/>
          <path d={pathD} fill="none" stroke="var(--color-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {INTERVENTIONS.map(iv=>(
            <g key={iv.t}>
              <circle cx={xOf(iv.t)} cy={yOf(ARC.find(p=>p.t===iv.t)?.oee||80)} r="4" fill="var(--color-stone)" stroke="var(--color-ochre)" strokeWidth="1.5"/>
            </g>
          ))}
          <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill="var(--color-ok)"/>
          <text x={pts[pts.length-1].x+8} y={pts[pts.length-1].y+4} fontSize="11" fill="var(--color-ok)" fontWeight="700">81%</text>
          {[{t:0,l:'06:00'},{t:50,l:'10:00'},{t:100,l:'14:00'}].map(m=>(
            <text key={m.t} x={xOf(m.t)} y={padT+chartH+20} fontSize="8" fill="#686058" textAnchor="middle">{m.l}</text>
          ))}
        </svg>
      </div>
      <div className="max-w-[820px] mx-auto px-8 pb-8">
        <div className="grid grid-cols-3 gap-6 mt-2">
          {[
            {chapter:'Opening',time:'06:00–06:30',tone:'danger',body:'Shift starts at 71% — below baseline. 4 checklists overdue. Martinez at wrong station. Allergen log unsigned. Risk score: 78.'},
            {chapter:'Turning point',time:'06:42–06:48',tone:'warn',body:'Six minutes. Checklists cleared, Martinez reassigned, allergen log signed, sensor flagged. OEE curve inverts.'},
            {chapter:'Resolution',time:'06:48–14:00',tone:'ok',body:'OEE climbs to 81%. One SCADA gap costs 0.3pp. Final risk score: 34. Handoff clean.'},
          ].map(c=>{
            const col = c.tone==='danger' ? 'var(--color-danger)' : c.tone==='warn' ? 'var(--color-warn)' : 'var(--color-ok)'
            return (
              <div key={c.chapter} className="border-t-2 pt-3" style={{borderColor:col}}>
                <div className="font-display font-bold text-[14px] text-ink mb-0.5">{c.chapter}</div>
                <div className="font-body text-ghost text-[10px] mb-2">{c.time}</div>
                <p className="font-body text-ink2 text-[11px] leading-relaxed">{c.body}</p>
              </div>
            )
          })}
        </div>
        <div className="border-t border-rule2 mt-8 pt-6 space-y-3.5">
          <div className="font-body text-ghost text-[9px] uppercase tracking-[0.12em] mb-4">What moved the number</div>
          {DRIVERS.map(d=>{
            const col = d.tone==='ok' ? 'var(--color-ok)' : d.tone==='warn' ? 'var(--color-warn)' : 'var(--color-danger)'
            return (
              <div key={d.id} className="flex items-baseline gap-5">
                <div className="display-num text-[20px] tabular-nums w-[60px] flex-shrink-0" style={{color:col}}>
                  {d.delta>0?'+':''}{d.delta.toFixed(1)}
                </div>
                <div className="font-body font-medium text-ink text-[12px] flex-1">{d.label} <span className="text-ghost font-normal">· {d.note}</span></div>
              </div>
            )
          })}
          <div className="pt-3 border-t border-rule2 flex items-baseline gap-5">
            <div className="display-num text-[20px] text-ok tabular-nums w-[60px]">+{netDelta.toFixed(1)}</div>
            <div className="font-body font-semibold text-ink text-[12px]">Net OEE gained · 75% baseline → 81% actual</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Direction C: Signal Pressure (preserved as reference) ─────────────────────

function PressureZone({cx,cy,r,color,opacity,label,value,unit,glow}) {
  return (
    <g>
      <defs>
        <radialGradient id={`grad-${label.replace(/\s/g,'')}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity={opacity*0.8}/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {glow && <circle cx={cx} cy={cy} r={r*1.4} fill={`url(#grad-${label.replace(/\s/g,'')})`}/>}
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={opacity*0.2} stroke={color} strokeOpacity={opacity*0.45} strokeWidth="1"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill={color} fontSize="17" fontWeight="800" fontFamily="Georgia,serif" opacity="0.85">{value}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill={color} fontSize="7.5" opacity="0.55" fontFamily="IBM Plex Mono,monospace">{unit}</text>
      <text x={cx} y={cy+23} textAnchor="middle" fill={color} fontSize="7.5" opacity="0.4" fontFamily="IBM Plex Mono,monospace">{label}</text>
    </g>
  )
}

function DirectionC() {
  const zones = [
    {id:'oee',label:'OEE',value:'81',unit:'%',cx:400,cy:230,r:84,color:'#3A8A5A',opacity:0.9,glow:true},
    {id:'risk',label:'RISK',value:'34',unit:'score',cx:195,cy:170,r:54,color:'#3A8A5A',opacity:0.75,glow:false},
    {id:'staff',label:'STAFFING',value:'+2.1',unit:'pp',cx:575,cy:148,r:50,color:'#3A8A5A',opacity:0.7,glow:false},
    {id:'scada',label:'SCADA GAP',value:'−0.3',unit:'pp',cx:162,cy:330,r:36,color:'#C43820',opacity:0.85,glow:true},
    {id:'sensor',label:'SENSOR A-7',value:'+0.8',unit:'pp',cx:604,cy:322,r:40,color:'#C4920A',opacity:0.8,glow:false},
    {id:'units',label:'UNITS',value:'91',unit:'% target',cx:290,cy:360,r:42,color:'#3A8A5A',opacity:0.6,glow:false},
    {id:'scrap',label:'SCRAP',value:'2.1',unit:'%',cx:524,cy:380,r:34,color:'#3A8A5A',opacity:0.6,glow:false},
  ]
  return (
    <div style={{background:'#0A0906',minHeight:'100vh'}}>
      <div style={{padding:'36px 48px 20px'}}>
        <div style={{fontFamily:'IBM Plex Mono,monospace',color:'#686058',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Signal pressure field · Line 4 · April 16</div>
        <div style={{fontFamily:'Georgia,serif',color:'#FAF8F4',fontSize:34,fontWeight:800,lineHeight:1.1}}>Operational<br/>pressure map.</div>
        <div style={{fontFamily:'IBM Plex Mono,monospace',color:'#5A5448',fontSize:10,marginTop:10,maxWidth:380,lineHeight:1.7}}>Each zone = a signal. Size = magnitude. Color = tone. Center = outcome. All forces act on it.</div>
      </div>
      <svg width="100%" viewBox="0 0 800 460" style={{display:'block'}}>
        <rect width="800" height="460" fill="#0A0906"/>
        {[80,160,240].map(r=><circle key={r} cx={400} cy={230} r={r} fill="none" stroke="#1E1A15" strokeWidth="0.75"/>)}
        <line x1={400} y1={0} x2={400} y2={460} stroke="#1E1A15" strokeWidth="0.5"/>
        <line x1={0} y1={230} x2={800} y2={230} stroke="#1E1A15" strokeWidth="0.5"/>
        {zones.filter(z=>z.id!=='oee').map(z=>(
          <line key={z.id} x1={400} y1={230} x2={z.cx} y2={z.cy} stroke={z.color} strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3,4"/>
        ))}
        {[...zones.filter(z=>z.id!=='oee'),zones.find(z=>z.id==='oee')].map(z=><PressureZone key={z.id} {...z}/>)}
        <text x={48} y={445} fill="#2A2420" fontSize="8" fontFamily="IBM Plex Mono,monospace">HEAT = RISK · COOL = RECOVERY · SIZE = MAGNITUDE</text>
      </svg>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'#1A1610',margin:'0 0 0 0'}}>
        {[...DRIVERS,{id:'final',short:'OEE Final',delta:81,note:'above baseline',tone:'ok',t:null}].map(d=>{
          const col = d.tone==='ok'?'#3A8A5A':d.tone==='warn'?'#C4920A':'#C43820'
          const v = d.id==='final' ? '81%' : `${d.delta>0?'+':''}${d.delta.toFixed(1)}pp`
          return (
            <div key={d.id} style={{padding:'14px 18px',background:'#0A0906',borderTop:'1px solid #1A1610'}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:800,color:col,marginBottom:3}}>{v}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:9,color:'#FAF8F4',marginBottom:2}}>{d.short}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:8,color:'#5A5448',lineHeight:1.5}}>{d.note}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Lab Shell ──────────────────────────────────────────────────────────────────

const DIRECTIONS = [
  {
    id: 'W',
    name: 'Warm Instrumentation',
    tag: 'The direction · A evolved',
    why: 'Analytical backbone (A) + B\'s pacing and temporal rhythm + C\'s materiality at low opacity. The narrative emerges from the instrumentation — not paragraphs. The SCADA gap glows faintly. Bars animate in staggered. Intervention moments are marked on a shared time rail. Deterministic, inspectable, defensible — and human.',
    component: DirectionWarm,
  },
  {
    id: 'A',
    name: 'Instrument Panel',
    tag: 'Reference · Analytical / Precision',
    why: 'The original Direction A. Attribution matrix, shared zero-axis bar, normalized 0–100 calibration, 6-shift comparison. Dense but disciplined. Every pixel carries a reading.',
    component: DirectionWarm, // Same component — W is the evolution of A
  },
  {
    id: 'B',
    name: 'The Shift Arc',
    tag: 'Reference · Narrative / Editorial',
    why: 'The shift as a three-act story. OEE arc, editorial chapters, drivers as large display numbers with sentence context. Risks "insight theater" at scale — but its pacing and temporal rhythm are worth borrowing.',
    component: DirectionB,
  },
  {
    id: 'C',
    name: 'Signal Pressure',
    tag: 'Reference · Experimental / Artistic',
    why: 'Thermographic pressure field on a near-black surface. Risks "signal art" as primary architecture — but its materiality, depth, and ambient tension inform the W direction\'s thermal states.',
    component: DirectionC,
  },
]

export default function VizLabPage() {
  const [active, setActive] = useState('W')
  const current = DIRECTIONS.find(v => v.id === active)
  const Component = current.component
  const activeIdx = DIRECTIONS.findIndex(v => v.id === active)
  const prev = DIRECTIONS[activeIdx - 1]
  const next = DIRECTIONS[activeIdx + 1]

  return (
    <div className="flex flex-col h-screen bg-stone overflow-hidden ml-[240px]">
      {/* Lab header */}
      <div className="flex items-stretch border-b border-rule2 bg-stone2 flex-shrink-0">
        <div className="flex items-stretch border-r border-rule2">
          {DIRECTIONS.map(v => (
            <button key={v.id} type="button" onClick={() => setActive(v.id)}
              className={`flex items-center gap-2.5 px-5 py-3 border-b-2 transition-colors font-body text-[12px] ${
                active === v.id
                  ? 'border-b-ochre bg-stone text-ink font-medium'
                  : 'border-b-transparent text-ghost hover:text-muted hover:bg-stone3'
              }`}>
              <span className="font-display font-black text-[11px] opacity-40">{v.id}</span>
              {v.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-5 flex-1 min-w-0">
          <span className="font-body text-ghost text-[10px] uppercase tracking-widest flex-shrink-0 text-ochre">{current.tag}</span>
          <span className="font-body text-ghost text-[10px] opacity-40">·</span>
          <span className="font-body text-ghost text-[11px] truncate leading-snug">{current.why}</span>
        </div>
        <div className="flex items-center gap-0 border-l border-rule2 flex-shrink-0">
          <button type="button" onClick={() => prev && setActive(prev.id)} disabled={!prev}
            className="px-4 py-3 font-body text-[11px] text-ghost hover:text-ink transition-colors disabled:opacity-30 border-r border-rule2">← prev</button>
          <button type="button" onClick={() => next && setActive(next.id)} disabled={!next}
            className="px-4 py-3 font-body text-[11px] text-ghost hover:text-ink transition-colors disabled:opacity-30">next →</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Component key={active} />
      </div>
    </div>
  )
}
