// Variant B — "Small Multiples"
// Inspired by FlowingData / Nathan Yau's work on pattern-first data visualization.
// The same chart repeated across lines reveals comparative patterns that aggregate views hide.
// Visual grammar: small multiples, calendar heatmap, strip plot of shift outcomes, annotation-as-data.

import { useAppState } from '../context/AppState'
import { shiftData } from '../data'

const LINE_META = {
  line4: { label: 'Line 4', color: '#D94F2A', supervisor: 'D. Kowalski', data: [79,81,76,84,79,88,81] },
  line6: { label: 'Line 6', color: '#3A8A5A', supervisor: 'B. Petrov',   data: [88,86,91,89,87,92,null] },
  line3: { label: 'Line 3', color: '#C4920A', supervisor: 'M. Chen',     data: [82,80,83,85,81,84,null] },
  line2: { label: 'Line 2', color: '#3A7FD4', supervisor: 'J. Park',     data: [91,89,90,88,91,93,null] },
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Today']

// 28-shift pilot log per line
const SHIFT_OUTCOMES = {
  line4: ['ok','ok','miss','ok','ok','ok','part','ok','ok','ok','miss','ok','ok','ok','part','ok','ok','miss','ok','ok','ok','ok','ok','miss','ok','ok','ok','part'],
  line6: ['ok','ok','ok','part','ok','ok','ok','ok','miss','ok','ok','ok','ok','ok','part','ok','ok','ok','ok','ok','ok','part','ok','ok','ok','ok','ok','ok'],
  line3: ['ok','part','ok','ok','ok','ok','ok','miss','ok','ok','ok','ok','part','ok','ok','ok','ok','ok','ok','ok','miss','ok','ok','ok','ok','part','ok','ok'],
  line2: ['ok','ok','ok','ok','part','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','part','ok','ok','ok','ok','ok','ok','ok','ok','ok'],
}

// Calendar-style: 28 days × 4 lines, OEE-like score
const CALENDAR_DATA = (() => {
  const lines = Object.keys(LINE_META)
  const days = Array.from({ length: 28 }, (_, i) => {
    const base = { line4: 76 + Math.sin(i * 0.4) * 6 + i * 0.1, line6: 86 + Math.cos(i * 0.3) * 3, line3: 81 + Math.sin(i * 0.5) * 4, line2: 90 + Math.cos(i * 0.2) * 2 }
    return { day: i + 1, ...base }
  })
  return days
})()

function oeeColor(v) {
  if (v === null) return '#EDE7DC'
  if (v >= 85) return '#3A8A5A'
  if (v >= 80) return '#8aba9e'
  if (v >= 75) return '#C4920A'
  if (v >= 70) return '#d4a640'
  return '#D94F2A'
}

function SmallMultipleChart({ lineKey, meta }) {
  const { data, color } = meta
  const w = 180, h = 60
  const padL = 16, padR = 6, padT = 6, padB = 14
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const minV = 68, maxV = 100
  const xOf = (i) => padL + (i / (DAYS.length - 1)) * chartW
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  const validPts = data.map((v, i) => v != null ? `${xOf(i)},${yOf(v)}` : null).filter(Boolean)
  const areaBase = yOf(minV)
  const areaPoints = data.reduce((acc, v, i) => {
    if (v == null) return acc
    if (acc.length === 0) acc.push(`${xOf(i)},${areaBase}`)
    acc.push(`${xOf(i)},${yOf(v)}`)
    return acc
  }, [])
  if (areaPoints.length > 0) {
    const lastValidIdx = data.reduce((last, v, i) => v != null ? i : last, 0)
    areaPoints.push(`${xOf(lastValidIdx)},${areaBase}`)
  }

  const avg = Math.round(data.filter(Boolean).reduce((a, b) => a + b, 0) / data.filter(Boolean).length)

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-body font-medium text-ink text-[12px]" style={{ color }}>{meta.label}</span>
        <span className="display-num text-base font-bold" style={{ color }}>{avg}%</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {/* Target 82% */}
        <line x1={padL} x2={w - padR} y1={yOf(82)} y2={yOf(82)} stroke="#C4920A" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.6" />

        {/* Area fill */}
        {areaPoints.length > 2 && (
          <polygon points={areaPoints.join(' ')} fill={color} opacity="0.1" />
        )}

        {/* Line */}
        <polyline points={validPts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {data.map((v, i) => v != null && (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r="2" fill={color} />
        ))}

        {/* Y axis min/max */}
        <text x={padL - 2} y={padT + 4} fontSize="7" fill="#A8A098" textAnchor="end">100</text>
        <text x={padL - 2} y={h - padB + 2} fontSize="7" fill="#A8A098" textAnchor="end">68</text>

        {/* X labels */}
        {DAYS.map((d, i) => (
          <text key={i} x={xOf(i)} y={h - 2} fontSize="6.5" fill="#A8A098" textAnchor="middle">{d.slice(0, 1)}</text>
        ))}
      </svg>
      <div className="font-body text-ghost text-[9px] mt-0.5">{meta.supervisor}</div>
    </div>
  )
}

function CalendarHeatmap() {
  const lines = Object.keys(LINE_META)
  const cols = 14
  const cellW = 28, cellH = 22, gapX = 2, gapY = 2
  const labelW = 40, topPad = 14
  const svgW = labelW + cols * (cellW + gapX)
  const svgH = topPad + lines.length * (cellH + gapY)

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMinYMin meet" style={{ maxWidth: svgW * 2 }}>
      {/* Column headers (days 1–14 and 15–28) */}
      {Array.from({ length: cols }, (_, i) => (
        <text key={i} x={labelW + i * (cellW + gapX) + cellW / 2} y={topPad - 3}
          fontSize="7" fill="#A8A098" textAnchor="middle">
          {i === 0 ? 'Mar 20' : i === 7 ? 'Apr 2' : i === 13 ? 'Apr 16' : ''}
        </text>
      ))}

      {lines.map((lineKey, li) => {
        const meta = LINE_META[lineKey]
        return (
          <g key={lineKey}>
            {/* Line label */}
            <text x={labelW - 4} y={topPad + li * (cellH + gapY) + cellH / 2 + 3}
              fontSize="8" fill={meta.color} textAnchor="end" fontWeight="500">
              {meta.label}
            </text>

            {/* 14 most recent days (first 14 of 28) */}
            {CALENDAR_DATA.slice(14).map((day, di) => {
              const v = Math.round(day[lineKey])
              const x = labelW + di * (cellW + gapX)
              const y = topPad + li * (cellH + gapY)
              return (
                <g key={di}>
                  <rect x={x} y={y} width={cellW} height={cellH} fill={oeeColor(v)} rx="1.5" />
                  <text x={x + cellW / 2} y={y + cellH / 2 + 3} fontSize="8" fill="white"
                    textAnchor="middle" fontWeight={v >= 82 ? '600' : '400'} opacity={v >= 75 ? 1 : 0.9}>
                    {v}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

function StripPlot({ lineKey, outcomes, color }) {
  const dotR = 5
  const dotGap = 3
  const totalW = outcomes.length * (dotR * 2 + dotGap)

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[10px] w-12 flex-shrink-0" style={{ color }}>{LINE_META[lineKey].label}</span>
      <svg width={totalW} height={dotR * 2 + 4} viewBox={`0 0 ${totalW} ${dotR * 2 + 4}`}>
        {outcomes.map((r, i) => {
          const cx = i * (dotR * 2 + dotGap) + dotR
          const cy = dotR + 2
          const fill = r === 'ok' ? '#3A8A5A' : r === 'miss' ? '#D94F2A' : '#C4920A'
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={dotR} fill={fill} opacity={r === 'ok' ? 0.75 : 1} />
              {r === 'miss' && <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="white" strokeWidth="1.5" />}
              {r === 'miss' && <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} stroke="white" strokeWidth="1.5" />}
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-3 ml-2">
        <span className="font-body text-ghost text-[10px]">
          {outcomes.filter(r => r === 'ok').length} correct
        </span>
        <span className="font-body text-warn text-[10px]">
          {outcomes.filter(r => r === 'part').length} partial
        </span>
        <span className="font-body text-danger text-[10px]">
          {outcomes.filter(r => r === 'miss').length} missed
        </span>
      </div>
    </div>
  )
}

export default function AnalyticsVariantB() {
  return (
    <div className="flex-1 overflow-y-auto bg-stone">
      <div className="px-8 py-8 space-y-10 max-w-[900px] mx-auto">

        {/* Section header */}
        <header>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Pattern view · Salina Campus</div>
          <h1 className="font-display font-bold text-ink text-[20px]">4 lines, 7 days, same scale</h1>
          <p className="font-body text-muted text-[12px] mt-1">Compare patterns across lines without the aggregate obscuring the signal.</p>
        </header>

        {/* Small multiples grid */}
        <section>
          <div className="grid grid-cols-4 gap-6">
            {Object.entries(LINE_META).map(([key, meta]) => (
              <SmallMultipleChart key={key} lineKey={key} meta={meta} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-rule2">
            <span className="font-body text-ghost text-[10px]">Same axes, same scale. Line 2 is consistently highest — staffing model is most mature there.</span>
            <span className="font-body text-warn text-[10px] ml-auto">— — 82% target on each chart</span>
          </div>
        </section>

        <div className="h-px bg-rule2" />

        {/* Calendar heatmap */}
        <section>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">14-day OEE heatmap · Apr 2–16</div>
          <CalendarHeatmap />
          <div className="flex items-center gap-3 mt-3">
            <span className="font-body text-ghost text-[10px]">Color scale:</span>
            {[
              { label: '≥ 85%', color: '#3A8A5A' },
              { label: '80–84', color: '#8aba9e' },
              { label: '75–79', color: '#C4920A' },
              { label: '70–74', color: '#d4a640' },
              { label: '< 70', color: '#D94F2A' },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1 font-body text-ghost text-[10px]">
                <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </section>

        <div className="h-px bg-rule2" />

        {/* Strip plot — shift outcomes */}
        <section>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-4">Shift prediction outcomes · 28-shift pilot window</div>
          <div className="space-y-3">
            {Object.entries(SHIFT_OUTCOMES).map(([lineKey, outcomes]) => (
              <StripPlot
                key={lineKey}
                lineKey={lineKey}
                outcomes={outcomes}
                color={LINE_META[lineKey].color}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-rule2">
            <span className="flex items-center gap-1.5 font-body text-ghost text-[10px]"><span className="w-3 h-3 rounded-full inline-block bg-ok/75" />Correct prediction</span>
            <span className="flex items-center gap-1.5 font-body text-ghost text-[10px]"><span className="w-3 h-3 rounded-full inline-block bg-warn" />Partial (right risk, wrong magnitude)</span>
            <span className="flex items-center gap-1.5 font-body text-ghost text-[10px]"><span className="w-3 h-3 rounded-full inline-block bg-danger" />Missed</span>
            <span className="font-body text-ghost text-[10px] ml-auto">Each dot = 1 shift, left → right = oldest → newest</span>
          </div>
        </section>

        {/* Observation */}
        <section className="border-l-4 border-l-ochre pl-5 py-1">
          <p className="font-body text-ink2 text-[13px] leading-relaxed">
            Line 4 misses cluster in shifts 3, 11, 18, and 24 — all Monday AMs. Late-delivery Sunday arrivals appear in 3 of 4. This is not a model issue; it's a supplier pattern the model hasn't been trained to anticipate yet.
          </p>
        </section>

      </div>
    </div>
  )
}
