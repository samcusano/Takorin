// Variant A — "Newsroom"
// Inspired by Netflix Data Science editorial aesthetic.
// One dominant insight leads. Data serves the story, not the other way around.
// Visual grammar: editorial hierarchy, area chart with gradient fill, story cards.

import { useAppState } from '../context/AppState'
import { openCases } from '../data/capa.js'
import { goalsData, shiftData, facility } from '../data'
import { TrendingUp, TrendingDown } from 'lucide-react'

const WEEK = [
  { day: 'Mon', line4: 79, line6: 88, line3: 82, line2: 91 },
  { day: 'Tue', line4: 81, line6: 86, line3: 80, line2: 89 },
  { day: 'Wed', line4: 76, line6: 91, line3: 83, line2: 90 },
  { day: 'Thu', line4: 84, line6: 89, line3: 85, line2: 88 },
  { day: 'Fri', line4: 79, line6: 87, line3: 81, line2: 91 },
  { day: 'Sat', line4: 88, line6: 92, line3: 84, line2: 93 },
  { day: 'Today', line4: 81, line6: null, line3: null, line2: null },
]

const LINE_COLORS = { line4: '#D94F2A', line6: '#3A8A5A', line3: '#C4920A', line2: '#3A7FD4' }

function AreaChart() {
  const w = 720, h = 140
  const padL = 28, padR = 16, padT = 12, padB = 20
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const minV = 68, maxV = 98
  const xOf = (i) => padL + (i / (WEEK.length - 1)) * chartW
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  // Line 4 area (filled)
  const l4pts = WEEK.filter(d => d.line4 != null)
  const l4line = l4pts.map((d, i) => `${xOf(i)},${yOf(d.line4)}`).join(' ')
  const l4area = `${xOf(0)},${yOf(minV)} ${l4pts.map((d, i) => `${xOf(i)},${yOf(d.line4)}`).join(' ')} ${xOf(l4pts.length - 1)},${yOf(minV)}`

  const lines = ['line6', 'line3', 'line2']

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="l4grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D94F2A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#D94F2A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines — minimal */}
      {[75, 82, 90].map(v => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="#D8D2C8" strokeWidth="0.5" />
          <text x={padL - 4} y={yOf(v) + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}</text>
        </g>
      ))}

      {/* Target line — 82% */}
      <line x1={padL} x2={w - padR} y1={yOf(82)} y2={yOf(82)} stroke="#C4920A" strokeWidth="0.75" strokeDasharray="5,3" opacity="0.7" />

      {/* Supporting lines — muted */}
      {lines.map(line => {
        const pts = WEEK.map((d, i) => d[line] != null ? `${xOf(i)},${yOf(d[line])}` : null).filter(Boolean)
        if (pts.length < 2) return null
        return <polyline key={line} points={pts.join(' ')} fill="none" stroke={LINE_COLORS[line]} strokeWidth="1" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
      })}

      {/* Line 4 area fill */}
      <polygon points={l4area} fill="url(#l4grad)" />

      {/* Line 4 — primary */}
      <polyline points={l4line} fill="none" stroke="#D94F2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Line 4 dots */}
      {l4pts.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.line4)} r="2.5" fill="#D94F2A" />
      ))}

      {/* Wednesday annotation — the dip */}
      <line x1={xOf(2)} x2={xOf(2)} y1={padT} y2={h - padB} stroke="#D8D2C8" strokeWidth="0.5" strokeDasharray="2,3" />
      <text x={xOf(2)} y={padT - 2} fontSize="7.5" fill="#A8A098" textAnchor="middle">dip</text>

      {/* X axis */}
      {WEEK.map((d, i) => (
        <text key={i} x={xOf(i)} y={h - 4} fontSize="8" fill="#A8A098" textAnchor="middle">{d.day}</text>
      ))}

      {/* Line labels at right edge */}
      {[
        { line: 'line4', label: 'L4', color: '#D94F2A', fontWeight: '600' },
        { line: 'line6', label: 'L6', color: '#3A8A5A', fontWeight: '400' },
        { line: 'line3', label: 'L3', color: '#C4920A', fontWeight: '400' },
        { line: 'line2', label: 'L2', color: '#3A7FD4', fontWeight: '400' },
      ].map(({ line, label, color, fontWeight }) => {
        const lastPt = [...WEEK].reverse().find(d => d[line] != null)
        if (!lastPt) return null
        const lastIdx = WEEK.findIndex(d => d === lastPt)
        return (
          <text key={line} x={xOf(lastIdx) + 6} y={yOf(lastPt[line]) + 3}
            fontSize="8" fill={color} fontWeight={fontWeight} opacity={line === 'line4' ? 1 : 0.5}>
            {label}
          </text>
        )
      })}
    </svg>
  )
}

function StoryCard({ headline, value, valueSub, delta, deltaGood, body, accent }) {
  const accentCls = { danger: 'border-l-danger', ok: 'border-l-ok', warn: 'border-l-warn' }[accent] || 'border-l-rule2'
  const valueCls = { danger: 'text-danger', ok: 'text-ok', warn: 'text-warn' }[accent] || 'text-ink'
  return (
    <div className={`flex flex-col gap-2 px-5 py-4 border border-rule2 border-l-4 ${accentCls} bg-stone`}>
      <p className="font-body text-ghost text-[10px] uppercase tracking-widest">{headline}</p>
      <div className="flex items-baseline gap-2">
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

export default function AnalyticsVariantA() {
  const { closedCases, readinessScore } = useAppState()
  const openCount = openCases.length - (closedCases?.length || 0)
  const overdueCount = openCases.filter(c => c.badgeColor === 'text-danger' && !closedCases?.includes(c.id)).length

  return (
    <div className="flex-1 overflow-y-auto bg-stone">
      <div className="max-w-[860px] mx-auto px-8 py-10 space-y-10">

        {/* Editorial lead — the story */}
        <header className="border-b border-rule2 pb-8">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">
            {facility.name} · Week ending Apr 16, 2026
          </div>
          <h1 className="font-display font-black text-ink text-[28px] leading-tight tracking-tight mb-3" style={{ maxWidth: 600 }}>
            Line 4 recovered from its mid-week dip — 47 interventions protected $312K this quarter.
          </h1>
          <p className="font-body text-ink2 text-[13px] leading-relaxed" style={{ maxWidth: 540 }}>
            After Wednesday's OEE dropped to 76% — the week's low — a staffing correction and checklist push drove recovery. The shift closed at 81%, one point below the 82% target.
          </p>
        </header>

        {/* Hero chart */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-body text-ghost text-[10px] uppercase tracking-widest">OEE · 7-day · all lines</span>
            <span className="font-body text-warn text-[10px]">— — 82% target</span>
          </div>
          <AreaChart />
        </section>

        {/* Story cards — 3 up */}
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
            body="7 of 9 cases at Sauce Dosing, Lines 4 & 6. Trending up. Closing 4 would move CAPA closure rate to the 71st percentile."
            accent="warn"
          />
          <StoryCard
            headline="Data readiness"
            value={String(readinessScore ?? 64)}
            valueSub="/ 100"
            delta={`+${(readinessScore ?? 64) - 58} since launch`}
            deltaGood
            body="SCADA Oven B is the remaining gap. Restoring the feed is the single highest-leverage action to unlock full confidence signals."
            accent="warn"
          />
        </section>

        {/* Divider */}
        <div className="h-px bg-rule2" />

        {/* Secondary story — CAPA */}
        <section className="grid grid-cols-2 gap-8">
          <div>
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">CAPA register · this week</div>
            <div className="space-y-3">
              {[
                { label: 'Closed', val: String(14 + (closedCases?.length || 0)), tone: 'text-ok' },
                { label: 'Open', val: String(openCount), tone: openCount > 0 ? 'text-warn' : 'text-ok' },
                { label: 'Overdue', val: String(overdueCount), tone: overdueCount > 0 ? 'text-danger' : 'text-ok' },
                { label: 'Closure rate', val: '78%', tone: 'text-warn' },
              ].map(({ label, val, tone }) => (
                <div key={label} className="flex items-baseline justify-between border-b border-rule2 pb-2">
                  <span className="font-body text-muted text-[12px]">{label}</span>
                  <span className={`display-num text-2xl font-bold ${tone}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Q2 goals</div>
            <div className="space-y-3">
              {goalsData.map(g => {
                const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
                const pct = g.direction === 'increase' ? Math.min(100, Math.round((g.current / g.target) * 100)) : Math.min(100, Math.round(((g.target * 2 - g.current) / g.target) * 50))
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-body text-muted text-[11px]">{g.label}</span>
                      <span className={`font-body font-medium text-[11px] ${onTrack ? 'text-ok' : 'text-warn'}`}>{g.current}{g.unit} / {g.target}{g.unit}</span>
                    </div>
                    <div className="h-1 bg-rule2">
                      <div className={`h-full ${onTrack ? 'bg-ok' : 'bg-warn'} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Footer dateline */}
        <footer className="border-t border-rule2 pt-5 flex items-center justify-between">
          <span className="font-body text-ghost text-[10px]">Takorin Total Intelligence · {facility.name} · Model accuracy 82% · 28 shifts</span>
          <span className="font-body text-ghost text-[10px]">Data through Apr 16, 2026 06:42</span>
        </footer>
      </div>
    </div>
  )
}
