// Variant C — "Attribution Waterfall"
// Inspired by Funnel.io's B2B attribution and waterfall visualization approach.
// Answers the question: "How did we get from 75% baseline to 81% actual OEE?"
// Visual grammar: waterfall chart, metric tree, period comparison table, inline sparklines.

import { useState } from 'react'
import { useAppState } from '../context/AppState'
import { openCases } from '../data/capa.js'
import { goalsData } from '../data'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from 'lucide-react'

const WATERFALL_STEPS = [
  { id: 'base',    label: 'Baseline forecast',         value: 75.0, type: 'base',    delta: null,   note: 'Predicted OEE without intervention' },
  { id: 'staff',   label: 'Staffing correction',       value: 77.1, type: 'pos',     delta: +2.1,   note: 'Martinez → Sauce Dosing, cert gap closed' },
  { id: 'check',   label: 'Checklist completions',     value: 78.5, type: 'pos',     delta: +1.4,   note: '4 overdue startup items cleared at T+42' },
  { id: 'sensor',  label: 'Sensor A-7 maintenance',    value: 79.3, type: 'pos',     delta: +0.8,   note: 'Bearing inspection created, variance flagged' },
  { id: 'allergen',label: 'Allergen clearance',        value: 80.8, type: 'pos',     delta: +1.5,   note: 'Changeover log signed, production unblocked' },
  { id: 'scada',   label: 'SCADA gap (Oven B stale)',  value: 80.5, type: 'neg',     delta: -0.3,   note: 'Sensor offline 3d — confidence penalty' },
  { id: 'actual',  label: 'Actual OEE',                value: 81.0, type: 'total',   delta: +6.0,   note: 'Final shift result · 1pt below 82% target' },
]

const COMPARISON = [
  { metric: 'Line 4 OEE', this: '81%', prior: '78%', target: '82%', spark: [78,76,79,81,79,88,81], up: true },
  { metric: 'Line 6 OEE', this: '88%', prior: '86%', target: '82%', spark: [86,91,89,87,92,null], up: true },
  { metric: 'CAPA closed', this: '4', prior: '2', target: '—', spark: [2,1,3,2,1,4], up: true },
  { metric: 'CAPA overdue', this: '2', prior: '4', target: '0', spark: [4,5,4,3,4,2], up: false },
  { metric: 'Data readiness', this: '64', prior: '62', target: '75', spark: [58,59,60,61,62,64], up: true },
  { metric: 'Interventions', this: '9', prior: '6', target: '—', spark: [5,7,6,8,6,9], up: true },
]

function Sparkline({ data, color = '#3A8A5A', w = 60, h = 20 }) {
  const pts = data.filter(Boolean)
  if (pts.length < 2) return <span className="inline-block" style={{ width: w }} />
  const min = Math.min(...pts), max = Math.max(...pts)
  const range = max - min || 1
  const step = w / (pts.length - 1)
  const yOf = (v) => h - ((v - min) / range) * (h - 4) - 2
  const points = pts.map((v, i) => `${i * step},${yOf(v)}`).join(' ')
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(pts.length - 1) * step} cy={yOf(pts[pts.length - 1])} r="2" fill={color} />
    </svg>
  )
}

function WaterfallChart() {
  const svgW = 700, svgH = 160
  const padL = 40, padR = 20, padT = 12, padB = 28
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const minV = 72, maxV = 84

  const barW = Math.floor(chartW / WATERFALL_STEPS.length) - 10
  const xOf = (i) => padL + i * (chartW / WATERFALL_STEPS.length) + 5
  const yOf = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {[74, 76, 78, 80, 82].map(v => (
        <g key={v}>
          <line x1={padL} x2={svgW - padR} y1={yOf(v)} y2={yOf(v)} stroke="#D8D2C8" strokeWidth="0.5" />
          <text x={padL - 3} y={yOf(v) + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}</text>
        </g>
      ))}

      {/* Target line */}
      <line x1={padL} x2={svgW - padR} y1={yOf(82)} y2={yOf(82)} stroke="#C4920A" strokeWidth="0.75" strokeDasharray="4,3" opacity="0.8" />

      {/* Connector lines */}
      {WATERFALL_STEPS.map((step, i) => {
        if (i === 0 || i === WATERFALL_STEPS.length - 1) return null
        const prev = WATERFALL_STEPS[i - 1]
        const x1 = xOf(i - 1) + barW
        const x2 = xOf(i)
        const y = yOf(prev.value)
        return <line key={i} x1={x1} x2={x2} y1={y} y2={y} stroke="#C8C0B4" strokeWidth="0.75" strokeDasharray="2,2" />
      })}

      {/* Bars */}
      {WATERFALL_STEPS.map((step, i) => {
        const x = xOf(i)
        const prev = i === 0 ? minV : WATERFALL_STEPS[i - 1].value
        const isBase = step.type === 'base'
        const isTotal = step.type === 'total'
        const isNeg = step.type === 'neg'

        let barY, barH2
        if (isBase || isTotal) {
          barY = yOf(step.value)
          barH2 = yOf(minV) - barY
        } else if (isNeg) {
          barY = yOf(prev)
          barH2 = yOf(step.value) - yOf(prev)
        } else {
          barY = yOf(step.value)
          barH2 = yOf(prev) - yOf(step.value)
        }

        const color = isBase ? '#696258' : isTotal ? '#100F0D' : isNeg ? '#D94F2A' : '#3A8A5A'

        return (
          <g key={step.id}>
            <rect x={x} y={barY} width={barW} height={Math.max(0, barH2)}
              fill={color} opacity={isBase ? 0.3 : isTotal ? 0.9 : 0.8} rx="1.5" />
            {step.delta !== null && (
              <text x={x + barW / 2} y={isNeg ? barY + barH2 + 9 : barY - 3}
                fontSize="8" fill={color} textAnchor="middle" fontWeight="600">
                {step.delta > 0 ? '+' : ''}{step.delta}
              </text>
            )}
            {isTotal && (
              <text x={x + barW / 2} y={barY - 3} fontSize="9" fill={color} textAnchor="middle" fontWeight="700">
                {step.value}%
              </text>
            )}
          </g>
        )
      })}

      {/* X labels */}
      {WATERFALL_STEPS.map((step, i) => (
        <text key={i} x={xOf(i) + barW / 2} y={svgH - 4}
          fontSize="7.5" fill="#696258" textAnchor="middle">
          {step.label.split(' ')[0]}
        </text>
      ))}
    </svg>
  )
}

function MetricTreeRow({ metric, expanded, onToggle, children }) {
  return (
    <div>
      <button type="button" onClick={onToggle}
        className="flex items-center gap-2 w-full py-2 border-b border-rule2 hover:bg-stone2 transition-colors px-2">
        {children ? (
          expanded ? <ChevronDown size={11} className="text-ghost flex-shrink-0" /> : <ChevronRight size={11} className="text-ghost flex-shrink-0" />
        ) : <span className="w-[11px]" />}
        <span className="font-body text-ink text-[12px] font-medium flex-1 text-left">{metric.label}</span>
        <span className={`display-num text-base font-bold ${metric.color || 'text-ink'}`}>{metric.value}</span>
        {metric.delta && (
          <span className={`font-body text-[10px] font-medium ml-2 ${metric.up ? 'text-ok' : 'text-danger'}`}>
            {metric.up ? '↑' : '↓'} {metric.delta}
          </span>
        )}
      </button>
      {expanded && children && (
        <div className="pl-5 bg-stone2/50 border-b border-rule2">
          {children}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsVariantC() {
  const { closedCases } = useAppState()
  const [expandedRows, setExpandedRows] = useState(new Set(['oee']))
  const toggle = (id) => setExpandedRows(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const tree = [
    {
      id: 'oee', label: 'OEE · Line 4', value: '81%', color: 'text-warn', delta: '+3%', up: true,
      children: [
        { id: 'avail', label: 'Availability', value: '94%', color: 'text-ok', delta: '+1%', up: true },
        { id: 'perf', label: 'Performance', value: '89%', color: 'text-ok', delta: '+2%', up: true },
        { id: 'qual', label: 'Quality', value: '96%', color: 'text-ok', delta: null },
      ]
    },
    { id: 'capa', label: 'CAPA closure rate', value: '78%', color: 'text-warn', delta: '−12%', up: false },
    { id: 'ready', label: 'Data readiness', value: '64', color: 'text-warn', delta: '+6', up: true },
    {
      id: 'acc', label: 'Model accuracy', value: '82%', color: 'text-ok', delta: '+8%', up: true,
      children: [
        { id: 'hicert', label: 'High-risk shifts called', value: '89%', color: 'text-ok', delta: null },
        { id: 'misses', label: 'Miss rate', value: '18%', color: 'text-warn', delta: null },
      ]
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-stone">
      <div className="px-6 py-6 space-y-8 max-w-[900px] mx-auto">

        {/* Header */}
        <header className="border-b border-rule2 pb-4">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Attribution · Week ending Apr 16</div>
          <h1 className="font-display font-bold text-ink text-[20px]">How did we go from 75% forecast to 81% actual?</h1>
        </header>

        {/* Waterfall chart */}
        <section>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">OEE attribution · Line 4 · this week</div>
          <div className="border border-rule2 bg-stone p-4">
            <WaterfallChart />
          </div>

          {/* Step legend */}
          <div className="mt-3 space-y-1.5">
            {WATERFALL_STEPS.filter(s => s.delta !== null).map(step => (
              <div key={step.id} className="flex items-start gap-3">
                <span className={`font-body font-medium text-[11px] w-14 flex-shrink-0 ${step.type === 'neg' ? 'text-danger' : step.type === 'total' ? 'text-ink' : 'text-ok'}`}>
                  {step.delta > 0 ? '+' : ''}{step.delta}pp
                </span>
                <span className="font-body font-medium text-ink text-[11px] w-36 flex-shrink-0">{step.label}</span>
                <span className="font-body text-ghost text-[10px]">{step.note}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-rule2" />

        {/* Two-column: metric tree + comparison table */}
        <div className="grid grid-cols-[220px_1fr] gap-6">

          {/* Metric tree */}
          <div>
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Metric tree</div>
            <div className="border border-rule2">
              {tree.map(row => (
                <MetricTreeRow key={row.id} metric={row} expanded={expandedRows.has(row.id)} onToggle={() => toggle(row.id)}>
                  {row.children?.map(child => (
                    <div key={child.id} className="flex items-center gap-2 py-1.5 border-b border-rule2 last:border-b-0 px-2">
                      <span className="font-body text-muted text-[11px] flex-1">{child.label}</span>
                      <span className={`font-body font-medium text-[11px] ${child.color || 'text-ink'}`}>{child.value}</span>
                    </div>
                  ))}
                </MetricTreeRow>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div>
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Period comparison</div>
            <div className="border border-rule2">
              {/* Header */}
              <div className="grid bg-stone2 border-b border-rule2" style={{ gridTemplateColumns: '1fr 60px 60px 60px 64px' }}>
                {['Metric', 'This wk', 'Prior wk', 'Target', 'Trend'].map(h => (
                  <div key={h} className="px-3 py-2 font-body text-[9px] text-ghost uppercase tracking-widest">{h}</div>
                ))}
              </div>

              {COMPARISON.map((row, i) => {
                const upColor = row.up ? 'text-ok' : 'text-danger'
                return (
                  <div key={i} className={`grid border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors`}
                    style={{ gridTemplateColumns: '1fr 60px 60px 60px 64px' }}>
                    <div className="px-3 py-2.5 font-body text-ink text-[12px] font-medium">{row.metric}</div>
                    <div className={`px-3 py-2.5 font-body font-bold text-[12px] ${upColor}`}>{row.this}</div>
                    <div className="px-3 py-2.5 font-body text-muted text-[12px]">{row.prior}</div>
                    <div className="px-3 py-2.5 font-body text-ghost text-[12px]">{row.target}</div>
                    <div className="px-3 py-2.5 flex items-center">
                      <Sparkline data={row.spark} color={row.up ? '#3A8A5A' : '#D94F2A'} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
