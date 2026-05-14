import { useState } from 'react'
import { useAppState } from '../context/AppState'
import { openCases, benchmarks } from '../data/capa.js'
import { goalsData, facility } from '../data'
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Download, Globe2, Brain, Lock } from 'lucide-react'

// ── Static data ───────────────────────────────────────────────────────────────

const WEEK = [
  { day: 'Mon', line4: 79, line6: 88, line3: 82, line2: 91 },
  { day: 'Tue', line4: 81, line6: 86, line3: 80, line2: 89 },
  { day: 'Wed', line4: 76, line6: 91, line3: 83, line2: 90 },
  { day: 'Thu', line4: 84, line6: 89, line3: 85, line2: 88 },
  { day: 'Fri', line4: 79, line6: 87, line3: 81, line2: 91 },
  { day: 'Sat', line4: 88, line6: 92, line3: 84, line2: 93 },
  { day: 'Today', line4: 81, line6: null, line3: null, line2: null },
]

const WATERFALL = [
  { id: 'base',     label: 'Baseline',       value: 75.0, type: 'base',  delta: null, note: 'Predicted OEE without any intervention' },
  { id: 'staff',    label: 'Staffing fix',   value: 77.1, type: 'pos',   delta: +2.1, note: 'Martinez → Sauce Dosing, cert gap closed' },
  { id: 'check',    label: 'Checklists',     value: 78.5, type: 'pos',   delta: +1.4, note: '4 overdue startup items cleared at T+42' },
  { id: 'sensor',   label: 'Sensor A-7',     value: 79.3, type: 'pos',   delta: +0.8, note: 'Bearing inspection scheduled, variance flagged' },
  { id: 'allergen', label: 'Allergen clear', value: 80.8, type: 'pos',   delta: +1.5, note: 'Changeover log signed, production unblocked' },
  { id: 'scada',    label: 'SCADA gap',      value: 80.5, type: 'neg',   delta: -0.3, note: 'Oven B sensor stale — confidence penalty applied' },
  { id: 'actual',   label: 'Actual OEE',     value: 81.0, type: 'total', delta: +6.0, note: 'Final result · 1pt below 82% target' },
]

const LINE_COLORS = { line4: '#D94F2A', line6: '#3A8A5A', line3: '#C4920A', line2: '#3A7FD4' }

// ── AreaChart — editorial hero visual ─────────────────────────────────────────
// Line 4 is filled; other lines ghost behind it. The story is Line 4.

function AreaChart() {
  const w = 720, h = 140
  const padL = 28, padR = 20, padT = 12, padB = 20
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const minV = 68, maxV = 98
  const xOf = (i) => padL + (i / (WEEK.length - 1)) * chartW
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  const l4pts = WEEK.filter(d => d.line4 != null)
  const l4line = l4pts.map((d, i) => `${xOf(i)},${yOf(d.line4)}`).join(' ')
  const l4area = [
    `${xOf(0)},${yOf(minV)}`,
    ...l4pts.map((d, i) => `${xOf(i)},${yOf(d.line4)}`),
    `${xOf(l4pts.length - 1)},${yOf(minV)}`,
  ].join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Line 4 OEE area chart, 7-day trailing">
      <defs>
        <linearGradient id="l4grad-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D94F2A" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#D94F2A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Minimal gridlines */}
      {[75, 82, 90].map(v => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="#D8D2C8" strokeWidth="0.5" />
          <text x={padL - 4} y={yOf(v) + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}</text>
        </g>
      ))}

      {/* 82% target */}
      <line x1={padL} x2={w - padR} y1={yOf(82)} y2={yOf(82)} stroke="#C4920A" strokeWidth="0.75" strokeDasharray="5,3" opacity="0.65" />

      {/* Wednesday dip annotation */}
      <line x1={xOf(2)} x2={xOf(2)} y1={padT + 4} y2={h - padB - 2} stroke="#D8D2C8" strokeWidth="0.5" strokeDasharray="2,3" />
      <text x={xOf(2)} y={padT + 1} fontSize="7.5" fill="#A8A098" textAnchor="middle">Wed dip</text>

      {/* Ghost lines — L6, L3, L2 */}
      {['line6', 'line3', 'line2'].map(line => {
        const pts = WEEK.map((d, i) => d[line] != null ? `${xOf(i)},${yOf(d[line])}` : null).filter(Boolean)
        if (pts.length < 2) return null
        return <polyline key={line} points={pts.join(' ')} fill="none" stroke={LINE_COLORS[line]} strokeWidth="1" opacity="0.22" strokeLinecap="round" strokeLinejoin="round" />
      })}

      {/* Line 4 fill + stroke */}
      <polygon points={l4area} fill="url(#l4grad-a)" />
      <polyline points={l4line} fill="none" stroke="#D94F2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {l4pts.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.line4)} r="2.5" fill="#D94F2A" />
      ))}

      {/* Right-edge line labels */}
      {[
        { line: 'line4', label: 'L4', opacity: 1,    weight: '600' },
        { line: 'line6', label: 'L6', opacity: 0.45, weight: '400' },
        { line: 'line3', label: 'L3', opacity: 0.45, weight: '400' },
        { line: 'line2', label: 'L2', opacity: 0.45, weight: '400' },
      ].map(({ line, label, opacity, weight }) => {
        const lastPt = [...WEEK].reverse().find(d => d[line] != null)
        if (!lastPt) return null
        const lastIdx = WEEK.findIndex(d => d === lastPt)
        return (
          <text key={line} x={xOf(lastIdx) + 6} y={yOf(lastPt[line]) + 3}
            fontSize="8" fill={LINE_COLORS[line]} fontWeight={weight} opacity={opacity}>
            {label}
          </text>
        )
      })}

      {/* X axis */}
      {WEEK.map((d, i) => (
        <text key={i} x={xOf(i)} y={h - 4} fontSize="8" fill="#A8A098" textAnchor="middle">{d.day}</text>
      ))}
    </svg>
  )
}

// ── WaterfallChart — attribution drill-down ───────────────────────────────────

function WaterfallChart() {
  const svgW = 580, svgH = 120
  const padL = 36, padR = 16, padT = 10, padB = 20
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const minV = 72, maxV = 84
  const barW = Math.floor(chartW / WATERFALL.length) - 8
  const xOf = (i) => padL + i * (chartW / WATERFALL.length) + 4
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="OEE attribution waterfall chart">
      {[74, 76, 78, 80, 82].map(v => (
        <g key={v}>
          <line x1={padL} x2={svgW - padR} y1={yOf(v)} y2={yOf(v)} stroke="#D8D2C8" strokeWidth="0.5" />
          <text x={padL - 3} y={yOf(v) + 3} fontSize="7.5" fill="#A8A098" textAnchor="end">{v}</text>
        </g>
      ))}
      <line x1={padL} x2={svgW - padR} y1={yOf(82)} y2={yOf(82)} stroke="#C4920A" strokeWidth="0.75" strokeDasharray="4,3" opacity="0.75" />

      {/* Connector dashes */}
      {WATERFALL.map((step, i) => {
        if (i === 0 || i === WATERFALL.length - 1) return null
        const prev = WATERFALL[i - 1]
        return <line key={i} x1={xOf(i - 1) + barW} x2={xOf(i)} y1={yOf(prev.value)} y2={yOf(prev.value)} stroke="#C8C0B4" strokeWidth="0.75" strokeDasharray="2,2" />
      })}

      {WATERFALL.map((step, i) => {
        const x = xOf(i)
        const prev = i === 0 ? minV : WATERFALL[i - 1].value
        const isBase = step.type === 'base', isTotal = step.type === 'total', isNeg = step.type === 'neg'
        let barY, barH2
        if (isBase || isTotal) { barY = yOf(step.value); barH2 = yOf(minV) - barY }
        else if (isNeg) { barY = yOf(prev); barH2 = yOf(step.value) - yOf(prev) }
        else { barY = yOf(step.value); barH2 = yOf(prev) - yOf(step.value) }
        const color = isBase ? '#696258' : isTotal ? '#100F0D' : isNeg ? '#D94F2A' : '#3A8A5A'
        return (
          <g key={step.id}>
            <rect x={x} y={barY} width={barW} height={Math.max(0, barH2)} fill={color}
              opacity={isBase ? 0.28 : isTotal ? 0.88 : 0.75} rx="1.5" />
            {step.delta !== null && (
              <text x={x + barW / 2} y={isNeg ? barY + barH2 + 9 : barY - 3}
                fontSize="7.5" fill={color} textAnchor="middle" fontWeight="600">
                {step.delta > 0 ? '+' : ''}{step.delta}
              </text>
            )}
            {isTotal && (
              <text x={x + barW / 2} y={barY - 9} fontSize="9" fill={color} textAnchor="middle" fontWeight="700">81%</text>
            )}
            <text x={x + barW / 2} y={svgH - 3} fontSize="7" fill="#696258" textAnchor="middle">{step.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── StoryCard ─────────────────────────────────────────────────────────────────

function StoryCard({ headline, value, valueSub, delta, deltaGood, body, accent }) {
  const accentCls = { danger: 'border-l-danger', ok: 'border-l-ok', warn: 'border-l-warn' }[accent] || 'border-l-rule2'
  const valueCls  = { danger: 'text-danger',     ok: 'text-ok',     warn: 'text-warn'  }[accent] || 'text-ink'
  return (
    <div className={`flex flex-col gap-2.5 px-5 py-4 border border-rule2 border-l-4 ${accentCls} bg-stone`}>
      <p className="font-body text-ghost text-[10px] uppercase tracking-widest">{headline}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`display-num text-3xl font-bold ${valueCls}`}>{value}</span>
        {valueSub && <span className="font-body text-ghost text-[11px]">{valueSub}</span>}
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 font-body text-[11px] font-medium ml-auto ${deltaGood ? 'text-ok' : 'text-danger'}`}>
            {deltaGood ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
            {delta}
          </span>
        )}
      </div>
      <p className="font-body text-muted text-[11px] leading-relaxed">{body}</p>
    </div>
  )
}

// ── BenchmarkBlock ────────────────────────────────────────────────────────────

function BenchmarkBlock({ b }) {
  return (
    <div className="border border-rule2 bg-stone p-5">
      <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">{b.metric}</div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="display-num text-3xl font-bold text-ink">{b.score}</span>
        <span className={`font-body text-[11px] font-medium ${b.deltaDir === 'up' ? 'text-ok' : 'text-danger'}`}>
          {b.deltaDir === 'up' ? '↑' : '↓'} {b.delta}
        </span>
        <span className="ml-auto font-body text-ghost text-[10px]">{b.percentile}th pct. of {b.total} plants</span>
      </div>
      <div className="relative h-2 bg-rule2 mb-3 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-ink/15" style={{ width: `${b.percentile}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-ochre" style={{ left: `${b.percentile}%` }} />
      </div>
      {b.zones?.length > 0 && (
        <div className="flex gap-4 mb-3">
          {b.zones.map((z, i) => <span key={i} className={`font-body text-[9px] ${z.color || 'text-ghost'}`}>{z.label} {z.range}</span>)}
        </div>
      )}
      {b.peers?.length > 0 && (
        <div className="space-y-1 border-t border-rule2 pt-2">
          {b.peers.map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-body text-ghost text-[10px]">{p.name}</span>
              <span className="font-body font-medium text-ink text-[11px]">{p.value}</span>
            </div>
          ))}
        </div>
      )}
      {b.insight && <div className="font-body text-ok text-[10px] mt-2.5 border-t border-rule2 pt-2">{b.insight}</div>}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Analytics() {
  const { closedCases, readinessScore } = useAppState()
  const [showAttribution, setShowAttribution] = useState(false)

  const closedCount  = 14 + (closedCases?.length || 0)
  const openCount    = openCases.length - (closedCases?.length || 0)
  const overdueCount = openCases.filter(c => c.badgeColor === 'text-danger' && !closedCases?.includes(c.id)).length
  const readiness    = readinessScore ?? 64

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      {/* Minimal header — no tabs */}
      <div className="flex items-center justify-between px-8 py-3.5 border-b border-rule2 bg-stone flex-shrink-0">
        <div className="font-body text-ghost text-[10px] uppercase tracking-widest">
          {facility.name} · Week ending Apr 16, 2026
        </div>
        <button type="button"
          className="flex items-center gap-1.5 font-body text-[11px] text-ghost px-3 py-1.5 border border-rule2 hover:border-ink/30 hover:text-muted transition-colors">
          <Download size={11} strokeWidth={2} />
          Export report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-8 py-10 space-y-10">

          {/* ── Editorial lead ─────────────────────────────────────────── */}
          <header className="border-b border-rule2 pb-8">
            <h1 className="font-display font-black text-ink text-[28px] leading-tight tracking-tight mb-3" style={{ maxWidth: 620 }}>
              Line 4 recovered from its mid-week dip — 47 interventions protected $312K this quarter.
            </h1>
            <p className="font-body text-ink2 text-[13px] leading-relaxed" style={{ maxWidth: 540 }}>
              After Wednesday's OEE dropped to 76% — the week's low — a staffing correction and checklist push drove recovery. The shift closed at 81%, one point below the 82% target.
            </p>
          </header>

          {/* ── Hero chart + attribution ────────────────────────────────── */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest">OEE · 7-day · all lines</span>
              <span className="font-body text-warn/80 text-[10px]">— — 82% target</span>
            </div>

            <AreaChart />

            {/* Attribution reveal */}
            <button type="button"
              onClick={() => setShowAttribution(v => !v)}
              className="flex items-center gap-2 w-full mt-3 px-4 py-2.5 border border-rule2 bg-stone2 hover:bg-stone3 transition-colors text-left group">
              <span className="font-body text-[11px] text-muted flex-1 group-hover:text-ink transition-colors">
                How did Line 4 go from a 75% baseline forecast to 81% actual?
              </span>
              {showAttribution
                ? <ChevronUp size={13} className="text-ghost flex-shrink-0" />
                : <ChevronDown size={13} className="text-ghost flex-shrink-0" />}
            </button>

            {showAttribution && (
              <div className="border border-rule2 border-t-0 bg-stone px-5 pt-4 pb-5 slide-in">
                <p className="font-body text-muted text-[11px] mb-4">
                  Six interventions moved OEE 6 points above baseline. One data gap — the stale Oven B sensor — took 0.3 points back.
                </p>
                <WaterfallChart />
                <div className="mt-4 space-y-2">
                  {WATERFALL.filter(s => s.delta !== null).map(step => (
                    <div key={step.id} className="flex items-start gap-3">
                      <span className={`font-body font-semibold text-[11px] w-14 flex-shrink-0 tabular-nums ${
                        step.type === 'neg' ? 'text-danger' : step.type === 'total' ? 'text-ink' : 'text-ok'
                      }`}>
                        {step.delta > 0 ? '+' : ''}{step.delta}pp
                      </span>
                      <span className="font-body font-medium text-ink text-[11px] w-32 flex-shrink-0">{step.label}</span>
                      <span className="font-body text-ghost text-[10px] leading-snug">{step.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Story cards ────────────────────────────────────────────── */}
          <section className="grid grid-cols-3 gap-4">
            <StoryCard
              headline="Intervention ROI · Q2 2026"
              value="$312K"
              valueSub="estimated value protected"
              delta="+$47K vs Q1"
              deltaGood
              body="47 actioned findings, avg. 6.4pp OEE recovery each. Cert mismatch corrections account for 61% of the total."
              accent="ok"
            />
            <StoryCard
              headline="Top root cause · open cases"
              value="9"
              valueSub="cert / skill mismatch"
              delta="+3 vs 90d"
              deltaGood={false}
              body="7 of 9 cases at Sauce Dosing, Lines 4 & 6. Closing 4 would move CAPA closure rate to the 71st percentile."
              accent="warn"
            />
            <StoryCard
              headline="Data readiness"
              value={String(readiness)}
              valueSub="/ 100"
              delta={`+${readiness - 58} since launch`}
              deltaGood
              body="SCADA Oven B is the remaining gap. Restoring the feed is the single highest-leverage action to unlock full confidence signals."
              accent="warn"
            />
          </section>

          <div className="h-px bg-rule2" />

          {/* ── CAPA + Q2 goals ─────────────────────────────────────────── */}
          <section className="grid grid-cols-2 gap-10">
            <div>
              <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-4">CAPA register · this week</div>
              <div className="space-y-3">
                {[
                  { label: 'Closed',       val: String(closedCount), tone: 'text-ok' },
                  { label: 'Open',         val: String(openCount),    tone: openCount > 0 ? 'text-warn' : 'text-ok' },
                  { label: 'Overdue',      val: String(overdueCount), tone: overdueCount > 0 ? 'text-danger' : 'text-ok' },
                  { label: 'Closure rate', val: '78%',                tone: 'text-warn' },
                ].map(({ label, val, tone }) => (
                  <div key={label} className="flex items-baseline justify-between border-b border-rule2 pb-2.5">
                    <span className="font-body text-muted text-[12px]">{label}</span>
                    <span className={`display-num text-2xl font-bold ${tone}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-4">Q2 goals</div>
              <div className="space-y-4">
                {goalsData.map(g => {
                  const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
                  const pct = g.direction === 'increase'
                    ? Math.min(100, Math.round((g.current / g.target) * 100))
                    : Math.min(100, Math.round(((g.target * 2 - g.current) / g.target) * 50))
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-body text-muted text-[11px]">{g.label}</span>
                        <span className={`font-body font-medium text-[11px] ${onTrack ? 'text-ok' : 'text-warn'}`}>
                          {g.current}{g.unit} / {g.target}{g.unit}
                        </span>
                      </div>
                      <div className="h-1 bg-rule2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${onTrack ? 'bg-ok' : 'bg-warn'} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* ── Benchmarks ─────────────────────────────────────────────── */}
          <section>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-display font-bold text-ink text-[15px]">How do we compare?</h2>
              <span className="font-body text-ghost text-[11px]">vs. 100 comparable plants</span>
            </div>
            <p className="font-body text-muted text-[12px] mb-5">
              OEE is improving but still short of the top quartile. CAPA closure rate is the fastest lever — two overdue cases are dragging the percentile.
            </p>
            <div className="space-y-4">
              {benchmarks.map((b, i) => <BenchmarkBlock key={i} b={b} />)}
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* ── Network intelligence ────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Globe2 size={13} strokeWidth={1.75} className="text-muted" />
              <h2 className="font-display font-bold text-ink text-[15px]">Network intelligence</h2>
            </div>
            <p className="font-body text-muted text-[12px] mb-5">
              Cross-plant supplier signals activate at 3 connected plants. Topeka Plant is the unlock.
            </p>
            <div className="border border-rule2 bg-stone p-5 mb-3">
              <div className="space-y-1.5">
                {[
                  { label: 'Plants in network',       value: '2 of 4 licensed', note: 'Salina Campus · Wichita Plant active' },
                  { label: 'Shared supplier exposure', value: 'ConAgra · ADM',   note: 'Both plants on overlapping lots' },
                  { label: 'Network signal activation',value: '3 plants needed', note: 'Topeka Plant (KS-02) not yet onboarded' },
                ].map(({ label, value, note }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-rule2 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-body text-ink2 text-[11px] font-medium">{label}</div>
                      <div className="font-body text-ghost text-[10px]">{note}</div>
                    </div>
                    <span className="font-body text-muted text-[11px] font-medium flex-shrink-0">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { title: 'Cross-plant supplier scorecards',   desc: 'ConAgra reliability score across all plants on TS-8811 lots — updated weekly.' },
                { title: 'Network OEE benchmarks (live)',      desc: 'Real-time percentile vs. the Takorin plant network, not static industry data.' },
                { title: 'Predictive delivery risk alerts',    desc: '"ConAgra delays at Plant KS-02 correlate with Line 4 scrap spikes within 48h."' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-3 px-4 py-3 border border-rule2 bg-stone2 opacity-55">
                  <Lock size={12} strokeWidth={2} className="text-ghost flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-[12px]">{title}</div>
                    <div className="font-body text-ghost text-[10px] mt-0.5">{desc}</div>
                  </div>
                  <span className="font-body text-ghost text-[10px] flex-shrink-0 px-2 py-0.5 border border-rule2 ml-auto">3 plants required</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer dateline + model history ─────────────────────────── */}
          <footer className="border-t border-rule2 pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={11} strokeWidth={1.75} className="text-ghost" />
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Model history</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Pilot running',      value: '28 shifts · Line 4' },
                { label: 'Current accuracy',   value: '82% · trending up', color: 'text-ok' },
                { label: 'Last retrained',     value: 'Apr 2 · 14 shifts ago' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="font-body text-ghost text-[10px] mb-0.5">{label}</div>
                  <div className={`font-body font-medium text-[12px] ${color || 'text-ink'}`}>{value}</div>
                </div>
              ))}
            </div>
            <p className="font-body text-ghost text-[10px] leading-relaxed" style={{ maxWidth: 560 }}>
              Every actioned finding and dismissed pattern contributes to the model. At 300 shifts, Line 4 accuracy is expected to reach 88–91%. Cross-plant intelligence activates at 3 connected plants.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-rule2">
              <span className="font-body text-ghost text-[10px]">Takorin Total Intelligence · {facility.name}</span>
              <span className="font-body text-ghost text-[10px]">Data through Apr 16, 2026 · 06:42</span>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
