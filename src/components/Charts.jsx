// ── Data visualization components ────────────────────────────────────────────
// All hand-rolled SVG — no chart library dependency.

// ── Shared color helpers ──────────────────────────────────────────────────────
const C = {
  ok:     'var(--color-ok)',
  warn:   'var(--color-warn)',
  danger: 'var(--color-danger)',
  signal:  'var(--color-signal)',
  muted:  'var(--color-muted)',
  ink:    'var(--color-ink)',
  rule2:  'var(--color-stone-2)',
  dim:    'var(--color-dim)',
}
const FONT = "'IBM Plex Sans'"

// ── 1. ALLUVIAL DIAGRAM ───────────────────────────────────────────────────────
// Agent → Decision → Outcome categorical flow for ImpactLoop.
// Alluvial (not Sankey): data is categorical partitioning, not resource flow.
// Wide blocks emphasise group size; ribbons show how groups split across stages.

const ALLUVIAL_W = 18   // block width
const XA = 0            // agent block left edge
const XD = 196          // decision block left edge
const XO = 402          // outcome block left edge  (402 + 18 = 420 viewBox width)
const ALLUVIAL_H = 200  // usable block height
const ALLUVIAL_GAP = 10 // gap between blocks in a column

const DISPLAY = {
  QualityGuard: 'QualityGuard', ScheduleOptimizer: 'Scheduler',
  SupplierBroker: 'Supplier', CAPAEngine: 'CAPA',
  approved: 'Approved', 'auto-executed': 'Auto-run',
  rejected: 'Rejected', overridden: 'Overridden',
  positive: 'Positive', unclear: 'Unclear',
  negative: 'Negative', harmful: 'Harmful',
}

function buildAlluvialLayout(interventions) {
  const agentFlow = {}, decisionFlow = {}, outcomeFlow = {}
  const agentDecision = {}, decisionOutcome = {}

  interventions.forEach(({ agent, decision, outcomeClassification: outcome }) => {
    agentFlow[agent]     = (agentFlow[agent]     || 0) + 1
    decisionFlow[decision] = (decisionFlow[decision] || 0) + 1
    outcomeFlow[outcome] = (outcomeFlow[outcome]  || 0) + 1
    agentDecision[`${agent}||${decision}`]     = (agentDecision[`${agent}||${decision}`]     || 0) + 1
    decisionOutcome[`${decision}||${outcome}`] = (decisionOutcome[`${decision}||${outcome}`] || 0) + 1
  })

  const total = interventions.length

  function layoutCol(flowMap, order) {
    const names = order.filter(n => flowMap[n])
    const available = ALLUVIAL_H - ALLUVIAL_GAP * (names.length - 1)
    let y = 0
    const nodes = {}
    names.forEach(name => {
      const h = Math.max(6, (flowMap[name] / total) * available)
      nodes[name] = { y, h, count: flowMap[name], inOff: 0, outOff: 0 }
      y += h + ALLUVIAL_GAP
    })
    return nodes
  }

  const col1 = layoutCol(agentFlow,    ['QualityGuard', 'ScheduleOptimizer', 'SupplierBroker', 'CAPAEngine'])
  const col2 = layoutCol(decisionFlow, ['approved', 'auto-executed', 'rejected', 'overridden'])
  const col3 = layoutCol(outcomeFlow,  ['positive', 'unclear', 'negative', 'harmful'])

  function ribbon(x0, y0, h0, x1, y1, h1) {
    const mx = (x0 + x1) / 2
    return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1} L ${x1} ${y1+h1} C ${mx} ${y1+h1}, ${mx} ${y0+h0}, ${x0} ${y0+h0} Z`
  }

  const links1 = []
  Object.entries(agentDecision).forEach(([key, count]) => {
    const [agent, decision] = key.split('||')
    if (!col1[agent] || !col2[decision]) return
    const srcH = (count / agentFlow[agent])     * col1[agent].h
    const tgtH = (count / decisionFlow[decision]) * col2[decision].h
    const y0 = col1[agent].y    + col1[agent].outOff
    const y1 = col2[decision].y + col2[decision].inOff
    col1[agent].outOff    += srcH
    col2[decision].inOff  += tgtH
    const color = decision === 'approved' ? C.ok : decision === 'auto-executed' ? C.signal : C.warn
    links1.push({ path: ribbon(XA + ALLUVIAL_W, y0, srcH, XD, y1, tgtH), color })
  })

  const links2 = []
  Object.entries(decisionOutcome).forEach(([key, count]) => {
    const [decision, outcome] = key.split('||')
    if (!col2[decision] || !col3[outcome]) return
    const srcH = (count / decisionFlow[decision]) * col2[decision].h
    const tgtH = (count / outcomeFlow[outcome])   * col3[outcome].h
    const y0 = col2[decision].y + col2[decision].outOff
    const y1 = col3[outcome].y  + col3[outcome].inOff
    col2[decision].outOff += srcH
    col3[outcome].inOff   += tgtH
    const color = outcome === 'positive' ? C.ok : outcome === 'unclear' ? C.signal : C.danger
    links2.push({ path: ribbon(XD + ALLUVIAL_W, y0, srcH, XO, y1, tgtH), color })
  })

  const AGENT_COLOR = { QualityGuard: C.signal, ScheduleOptimizer: C.muted, SupplierBroker: C.muted, CAPAEngine: C.muted }
  const DEC_COLOR   = { approved: C.ok, 'auto-executed': C.signal, rejected: C.warn, overridden: C.muted }
  const OUT_COLOR   = { positive: C.ok, unclear: C.signal, negative: C.danger, harmful: C.danger }

  return { col1, col2, col3, links1, links2, AGENT_COLOR, DEC_COLOR, OUT_COLOR, total }
}

export function AlluvialDiagram({ interventions }) {
  const { col1, col2, col3, links1, links2, AGENT_COLOR, DEC_COLOR, OUT_COLOR, total } = buildAlluvialLayout(interventions)
  const PAD_T = 18
  const VH = ALLUVIAL_H + PAD_T + 4

  return (
    <svg width="100%" viewBox={`0 0 420 ${VH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Alluvial diagram: agent classification → decision → outcome">

      {/* Column headers */}
      {[['Agent', XA, 'start'], ['Decision', XD, 'start'], ['Outcome', XO + ALLUVIAL_W, 'end']].map(([label, x, anchor]) => (
        <text key={label} x={x} y="10" fontSize="7" fill={C.dim} textAnchor={anchor}
          fontFamily={FONT}>{label}</text>
      ))}

      <g transform={`translate(0,${PAD_T})`}>
        {/* Ribbons drawn first, blocks on top */}
        {links1.map((l, i) => <path key={`r1-${i}`} d={l.path} fill={l.color} opacity="0.16" />)}
        {links2.map((l, i) => <path key={`r2-${i}`} d={l.path} fill={l.color} opacity="0.22" />)}

        {/* Agent blocks */}
        {Object.entries(col1).map(([name, n]) => {
          const color = AGENT_COLOR[name] || C.muted
          const pct = Math.round((n.count / total) * 100)
          const cy = n.y + n.h / 2
          return (
            <g key={name}>
              <rect x={XA} y={n.y} width={ALLUVIAL_W} height={Math.max(6, n.h)} fill={color} rx="1" opacity="0.88" />
              <text x={XA + ALLUVIAL_W + 5} y={cy + 3} fontSize="8.5" fill={color} textAnchor="start" fontFamily={FONT}>
                {DISPLAY[name] ?? name}
              </text>
              <text x={XA + ALLUVIAL_W + 5} y={cy + 13} fontSize="7" fill={C.dim} textAnchor="start" fontFamily={FONT}>
                {pct}%
              </text>
            </g>
          )
        })}

        {/* Decision blocks */}
        {Object.entries(col2).map(([name, n]) => {
          const color = DEC_COLOR[name] || C.muted
          const pct = Math.round((n.count / total) * 100)
          const cy = n.y + n.h / 2
          return (
            <g key={name}>
              <rect x={XD} y={n.y} width={ALLUVIAL_W} height={Math.max(6, n.h)} fill={color} rx="1" opacity="0.88" />
              <text x={XD - 5} y={cy + 3} fontSize="8.5" fill={color} textAnchor="end" fontFamily={FONT}>
                {DISPLAY[name] ?? name}
              </text>
              <text x={XD + ALLUVIAL_W + 5} y={cy + 3} fontSize="7" fill={C.dim} textAnchor="start" fontFamily={FONT}>
                {pct}%
              </text>
            </g>
          )
        })}

        {/* Outcome blocks */}
        {Object.entries(col3).map(([name, n]) => {
          const color = OUT_COLOR[name] || C.muted
          const pct = Math.round((n.count / total) * 100)
          const cy = n.y + n.h / 2
          return (
            <g key={name}>
              <rect x={XO} y={n.y} width={ALLUVIAL_W} height={Math.max(6, n.h)} fill={color} rx="1" opacity="0.88" />
              <text x={XO - 5} y={cy + 3} fontSize="8.5" fill={color} textAnchor="end" fontFamily={FONT}>
                {DISPLAY[name] ?? name}
              </text>
              <text x={XO - 5} y={cy + 13} fontSize="7" fill={C.dim} textAnchor="end" fontFamily={FONT}>
                {pct}%
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

// ── 2. SHIFT TIMELINE CHART ───────────────────────────────────────────────────
// Horizontal bar timeline for ShiftIQ Prepare tab.
// Each shift = thin bar with endpoint dots, staggered rows, vertical "now" line.

export function GanttChart({ forecast }) {
  if (!forecast?.length) return null

  // Hours offset from "Today 14:00" (T=0). Each shift is 8 h.
  const slotH  = (t) => {
    const s = t.replace('\n', ' ')
    if (s.includes('Today')) return 0
    if (s.includes('06'))    return 16
    return 24
  }
  const SHIFT_H   = 8
  const TOTAL_H   = 34   // axis span: T+0 → T+34
  const NOW_H     = 1.5  // "now" = 1.5 h into current shift
  const scoreC    = (s) => s >= 75 ? C.danger : s >= 55 ? C.warn : C.ok
  const supName   = (n) => n.split('—')[1]?.trim() || ''
  const lineName  = (n) => { const m = n.match(/Line (\d+)/); return m ? `Line ${m[1]}` : '' }

  const W = 500, padL = 58, padR = 10, padT = 26, padB = 30
  const cW = W - padL - padR
  const ROW_H = 22
  const H = padT + forecast.length * ROW_H + padB

  const toX = (h) => padL + (h / TOTAL_H) * cW
  const NOW_X = toX(NOW_H)

  const TICKS = [
    { h: 0,  label: '14:00', sub: 'Today' },
    { h: 8,  label: '22:00', sub: '' },
    { h: 16, label: '06:00', sub: 'Tomorrow' },
    { h: 24, label: '14:00', sub: '' },
    { h: 32, label: '22:00', sub: '' },
  ]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Shift forecast timeline">

      {/* Background grid lines */}
      {TICKS.map(({ h }) => (
        <line key={h} x1={toX(h)} x2={toX(h)} y1={padT - 10} y2={H - padB}
          stroke="var(--color-rule-2)" strokeWidth="0.5" />
      ))}

      {/* "Now" marker */}
      <line x1={NOW_X} x2={NOW_X} y1={padT - 14} y2={H - padB}
        stroke={C.signal} strokeWidth="1" opacity="0.55" />
      <circle cx={NOW_X} cy={padT - 14} r="2.5" fill={C.signal} opacity="0.7" />

      {/* Shift bars */}
      {forecast.map((shift, i) => {
        const cy   = padT + i * ROW_H + ROW_H / 2
        const x1   = toX(slotH(shift.time))
        const x2   = toX(slotH(shift.time) + SHIFT_H)
        const col  = scoreC(shift.score)
        const line = lineName(shift.name)
        const sup  = supName(shift.name)

        return (
          <g key={i}>
            {/* Row label */}
            <text x={padL - 6} y={cy + 3.5} fontSize="8" fill={C.muted}
              textAnchor="end" fontFamily={FONT}>{line}</text>

            {/* Bar */}
            <line x1={x1} x2={x2} y1={cy} y2={cy}
              stroke={col} strokeWidth="1.5" opacity="0.8" />

            {/* Endpoint dots */}
            <circle cx={x1} cy={cy} r="3.5" fill={col} opacity="0.9" />
            <circle cx={x2} cy={cy} r="3.5" fill={col} opacity="0.9" />

            {/* Score near start */}
            <text x={x1 + 7} y={cy - 5} fontSize="7" fill={col}
              fontFamily={FONT} opacity="0.9">{shift.score}</text>

            {/* Supervisor near end */}
            <text x={x2 + 7} y={cy + 3.5} fontSize="7.5" fill={C.muted}
              fontFamily={FONT}>{sup}</text>

            {/* Urgent mid-dot */}
            {shift.urgent && (
              <circle cx={(x1 + x2) / 2} cy={cy} r="3"
                fill={C.danger} opacity="0.95" />
            )}
          </g>
        )
      })}

      {/* Time axis */}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB}
        stroke="var(--color-rule-2)" strokeWidth="0.5" />
      {TICKS.map(({ h, label, sub }) => {
        const x = toX(h)
        return (
          <g key={h}>
            <line x1={x} x2={x} y1={H - padB} y2={H - padB + 4}
              stroke={C.dim} strokeWidth="0.5" />
            <text x={x} y={H - padB + 12} fontSize="7.5" fill={C.dim}
              textAnchor="middle" fontFamily={FONT}>{label}</text>
            {sub && (
              <text x={x} y={H - padB + 21} fontSize="6.5" fill={C.dim}
                textAnchor="middle" fontFamily={FONT} opacity="0.6">{sub}</text>
            )}
          </g>
        )
      })}

      {/* Legend */}
      {[[C.danger, 'High risk'], [C.warn, 'Watch'], [C.ok, 'Clear'], [C.signal, 'Now']].map(([col, lbl], i) => (
        <g key={lbl} transform={`translate(${padL + i * 72}, ${H - 4})`}>
          <circle cx="3.5" cy="0" r="3" fill={col} opacity="0.85" />
          <text x="9" y="3.5" fontSize="7" fill={C.dim} fontFamily={FONT}>{lbl}</text>
        </g>
      ))}
    </svg>
  )
}

// ── 3. CALENDAR HEATMAP ───────────────────────────────────────────────────────
// 4-week shift outcome calendar for ShiftIQ pilot log

export function CalendarHeatmap({ log }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const WEEKS = 4, COLS = 7
  const cellW = 20, cellH = 20, gap = 3, padL = 26, padT = 18

  const colorOf = (r) => r === 'ok' ? C.ok : r === 'miss' ? C.danger : C.warn
  const labelOf = (r) => r === 'ok' ? 'Correct' : r === 'miss' ? 'Missed' : 'Partial'

  const paddedLog = [...log]
  while (paddedLog.length < WEEKS * COLS) paddedLog.push(null)

  const svgW = padL + COLS * (cellW + gap), svgH = padT + WEEKS * (cellH + gap)

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="28-shift outcome calendar">
      {/* Day labels */}
      {days.map((d, i) => (
        <text key={i} x={padL + i * (cellW + gap) + cellW / 2} y={12} fontSize="8"
          fill={C.dim} textAnchor="middle" fontFamily="'IBM Plex Sans'">{d}</text>
      ))}
      {/* Week labels */}
      {[0, 1, 2, 3].map(w => (
        <text key={w} x={padL - 4} y={padT + w * (cellH + gap) + cellH / 2 + 3.5}
          fontSize="7.5" fill={C.dim} textAnchor="end" fontFamily="'IBM Plex Sans'">
          W{w + 1}
        </text>
      ))}
      {/* Cells */}
      {paddedLog.slice(0, WEEKS * COLS).map((result, i) => {
        const col = i % COLS, row = Math.floor(i / COLS)
        const x = padL + col * (cellW + gap)
        const y = padT + row * (cellH + gap)
        if (!result) return <rect key={i} x={x} y={y} width={cellW} height={cellH} fill="var(--color-stone-3, #1B2538)" rx="1" />
        return (
          <g key={i}>
            <rect x={x} y={y} width={cellW} height={cellH} fill={colorOf(result)} opacity="0.75" rx="1">
              <title>{`Shift ${i + 1}: ${labelOf(result)}`}</title>
            </rect>
            {result === 'miss' && (
              <line x1={x + 4} y1={y + 4} x2={x + cellW - 4} y2={y + cellH - 4} stroke="var(--color-stone, #0B0F18)" strokeWidth="1.2" opacity="0.4" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── 4. RADAR CHART ────────────────────────────────────────────────────────────
// Crew station certification coverage

const STATION_LABELS = ['Pack Line', 'Sauce\nDosing', 'Oven Stn B', 'Topping\nLine', 'Allergen']

export function RadarChart({ crew }) {
  const N = 5
  const CX = 110, CY = 105, R = 80, svgW = 220, svgH = 215

  // Compute polygon points for a crew member
  function pts(angles, values, radius) {
    return angles.map((a, i) => {
      const v = values[i] * radius
      return [CX + v * Math.sin(a), CY - v * Math.cos(a)]
    })
  }

  const angles = Array.from({ length: N }, (_, i) => (i * 2 * Math.PI) / N)

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]
  const COLORS = ['var(--color-ok)', 'var(--color-signal)', 'var(--color-warn)', 'var(--color-muted)']

  const crewToShow = (crew || []).filter(m => m.dots)

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Crew station certification radar">
      {/* Grid rings */}
      {rings.map(r => {
        const ringPts = pts(angles, Array(N).fill(r), R)
        return <polygon key={r} points={ringPts.map(p => p.join(',')).join(' ')}
          fill="none" stroke="var(--color-rule-2, #1A2335)" strokeWidth="0.75" />
      })}
      {/* Axis lines */}
      {angles.map((a, i) => (
        <line key={i} x1={CX} y1={CY}
          x2={CX + R * Math.sin(a)} y2={CY - R * Math.cos(a)}
          stroke="var(--color-rule-2, #1A2335)" strokeWidth="0.75" />
      ))}
      {/* Axis labels */}
      {angles.map((a, i) => {
        const dist = R + 13
        const lx = CX + dist * Math.sin(a)
        const ly = CY - dist * Math.cos(a)
        const anchor = Math.abs(a) < 0.3 || Math.abs(a - Math.PI) < 0.3 ? 'middle' : a < Math.PI ? 'start' : 'end'
        const lines = STATION_LABELS[i].split('\n')
        return (
          <g key={i}>
            {lines.map((ln, li) => (
              <text key={li} x={lx} y={ly + li * 9 - (lines.length - 1) * 4.5}
                fontSize="7.5" fill={C.muted} textAnchor={anchor} dominantBaseline="middle"
                fontFamily="'IBM Plex Sans'">
                {ln}
              </text>
            ))}
          </g>
        )
      })}
      {/* Crew polygons */}
      {crewToShow.map((member, mi) => {
        const certScale = (member.certPct ?? 50) / 100
        const values = member.dots.map(d => d ? certScale : certScale * 0.2)
        const polyPts = pts(angles, values, R)
        const color = COLORS[mi % COLORS.length]
        return (
          <g key={member.name}>
            <polygon points={polyPts.map(p => p.join(',')).join(' ')}
              fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />
            {polyPts.map(([px, py], i) => member.dots[i] ? (
              <circle key={i} cx={px} cy={py} r="2.5" fill={color} opacity="0.9" />
            ) : null)}
          </g>
        )
      })}
      {/* Legend */}
      {crewToShow.slice(0, 4).map((member, mi) => {
        const color = COLORS[mi % COLORS.length]
        const shortName = member.name.split('.')[1]?.trim() || member.name
        return (
          <g key={member.name} transform={`translate(4, ${svgH - 30 + mi * 8})`}>
            <line x1="0" y1="3" x2="10" y2="3" stroke={color} strokeWidth="1.5" />
            <text x="13" y="6" fontSize="7.5" fill={color}
              fontFamily="'IBM Plex Sans'">{shortName}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 5. KNOWLEDGE TREEMAP ──────────────────────────────────────────────────────
// Domain distribution visualization for Knowledge Vault

function binaryTreemap(items, x, y, w, h, depth = 0) {
  if (!items.length) return []
  if (items.length === 1) return [{ ...items[0], x, y, w, h }]

  const total = items.reduce((s, i) => s + i.value, 0)
  let runSum = 0
  let splitIdx = 0
  for (let i = 0; i < items.length - 1; i++) {
    runSum += items[i].value
    splitIdx = i + 1
    if (runSum >= total / 2) break
  }

  const first = items.slice(0, splitIdx)
  const second = items.slice(splitIdx)
  const firstSum = first.reduce((s, i) => s + i.value, 0)
  const ratio = firstSum / total

  if (w >= h) {
    const sw = w * ratio
    return [
      ...binaryTreemap(first, x, y, sw - 1, h, depth + 1),
      ...binaryTreemap(second, x + sw, y, w - sw, h, depth + 1),
    ]
  } else {
    const sh = h * ratio
    return [
      ...binaryTreemap(first, x, y, w, sh - 1, depth + 1),
      ...binaryTreemap(second, x, y + sh, w, h - sh, depth + 1),
    ]
  }
}

export function KnowledgeTreemap({ domains, enriched }) {
  const svgW = 380, svgH = 180, pad = 1

  const items = domains
    .map(d => ({
      id: d.id,
      label: d.label,
      value: enriched.filter(e => e._domain === d.id).length,
      avgConf: (() => {
        const ents = enriched.filter(e => e._domain === d.id)
        return ents.length ? Math.round(ents.reduce((s, e) => s + (e.confidence || 0), 0) / ents.length) : 0
      })(),
      active: enriched.filter(e => e._domain === d.id && e.activeBatches?.length > 0).length,
      color: d.border?.replace('border-l-', '') || 'rule2',
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const rects = binaryTreemap(items, pad, pad, svgW - pad * 2, svgH - pad * 2)

  const confColor = (c) => c >= 90 ? C.ok : c >= 80 ? C.signal : C.warn

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Knowledge vault domain treemap">
      {rects.map(r => {
        const fillColor = confColor(r.avgConf)
        const shortLabel = r.label.replace('Active Deviations', 'Deviations').replace('Sensory Drift', 'Sensory').replace('Supplier Deviation', 'Supplier').replace('Regulatory Findings', 'Regulatory').replace('Yield Loss', 'Yield').replace('Shift Recovery', 'Recovery').replace('CAPA Patterns', 'CAPA')
        const showLabel = r.w > 40 && r.h > 22
        const showCount = r.w > 30 && r.h > 14
        return (
          <g key={r.id}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h}
              fill={fillColor} fillOpacity="0.12" stroke={fillColor} strokeOpacity="0.25" strokeWidth="0.75" />
            {r.active > 0 && (
              <rect x={r.x} y={r.y} width={Math.min(r.w, 3)} height={r.h} fill={C.danger} opacity="0.6" />
            )}
            {showLabel && (
              <text x={r.x + (r.active > 0 ? 6 : 4)} y={r.y + 13} fontSize="8.5" fill={fillColor}
                fontFamily="'IBM Plex Sans'" fontWeight="600">
                {shortLabel}
              </text>
            )}
            {showCount && (
              <text x={r.x + (r.active > 0 ? 6 : 4)} y={r.y + (showLabel ? 24 : 13)} fontSize="8"
                fill={fillColor} fontFamily="'IBM Plex Sans'" opacity="0.75">
                {r.value} · {r.avgConf}%
              </text>
            )}
            <title>{`${r.label}: ${r.value} entries · avg confidence ${r.avgConf}%${r.active ? ` · ${r.active} active` : ''}`}</title>
          </g>
        )
      })}
    </svg>
  )
}
