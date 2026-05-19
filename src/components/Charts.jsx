// ── Data visualization components ────────────────────────────────────────────
// All hand-rolled SVG — no chart library dependency.

// ── Shared color helpers ──────────────────────────────────────────────────────
const C = {
  ok:     'var(--color-ok)',
  warn:   'var(--color-warn)',
  danger: 'var(--color-danger)',
  ochre:  'var(--color-ochre)',
  muted:  'var(--color-muted)',
  ink:    'var(--color-ink)',
  rule2:  'var(--color-stone-2)',
  dim:    '#4A5D74',
}

// ── 1. SANKEY DIAGRAM ─────────────────────────────────────────────────────────
// Agent → Decision → Outcome flow for ImpactLoop

function buildSankeyLayout(interventions) {
  // Count flows between columns
  const agentFlow = {}, decisionFlow = {}, agentDecision = {}, decisionOutcome = {}
  interventions.forEach(({ agent, decision, outcomeClassification: outcome }) => {
    agentFlow[agent] = (agentFlow[agent] || 0) + 1
    decisionFlow[decision] = (decisionFlow[decision] || 0) + 1
    const adKey = `${agent}||${decision}`
    agentDecision[adKey] = (agentDecision[adKey] || 0) + 1
    const doKey = `${decision}||${outcome}`
    decisionOutcome[doKey] = (decisionOutcome[doKey] || 0) + 1
  })

  const outcomeFlow = {}
  interventions.forEach(({ outcomeClassification: o }) => {
    outcomeFlow[o] = (outcomeFlow[o] || 0) + 1
  })

  const total = interventions.length
  const H = 180, gap = 9, nodeW = 10

  // Lay out nodes in a column given sorted name→count map
  function layoutCol(flowMap, order) {
    const names = order || Object.keys(flowMap).sort((a, b) => flowMap[b] - flowMap[a])
    const n = names.length
    const available = H - gap * (n - 1)
    let y = 0
    const nodes = {}
    names.forEach(name => {
      const h = Math.max(4, (flowMap[name] / total) * available)
      nodes[name] = { y, h, inOff: 0, outOff: 0 }
      y += h + gap
    })
    return nodes
  }

  const agentOrder = ['QualityGuard', 'ScheduleOptimizer', 'SupplierBroker', 'CAPAEngine']
  const decOrder = ['approved', 'auto-executed', 'rejected', 'overridden']
  const outOrder = ['positive', 'unclear', 'negative', 'harmful']

  const col1 = layoutCol(agentFlow, agentOrder.filter(a => agentFlow[a]))
  const col2 = layoutCol(decisionFlow, decOrder.filter(d => decisionFlow[d]))
  const col3 = layoutCol(outcomeFlow, outOrder.filter(o => outcomeFlow[o]))

  // Build link paths (filled bezier areas)
  const x1 = nodeW, x2 = 195, x3 = 200 + nodeW, x4 = 390
  const mx12 = (x2 + x1) / 2, mx34 = (x4 + x3) / 2

  function linkPath(x0, y0, h0, x1, y1, h1) {
    const mx = (x0 + x1) / 2
    return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + h1} C ${mx} ${y1 + h1}, ${mx} ${y0 + h0}, ${x0} ${y0 + h0} Z`
  }

  const links1 = [] // agent → decision
  Object.entries(agentDecision).forEach(([key, count]) => {
    const [agent, decision] = key.split('||')
    if (!col1[agent] || !col2[decision]) return
    const srcH = (count / agentFlow[agent]) * col1[agent].h
    const tgtH = (count / decisionFlow[decision]) * col2[decision].h
    const y0 = col1[agent].y + col1[agent].outOff
    const y1 = col2[decision].y + col2[decision].inOff
    col1[agent].outOff += srcH
    col2[decision].inOff += tgtH
    const outColor = decision === 'approved' ? C.ok : decision === 'auto-executed' ? C.ochre : C.warn
    links1.push({ path: linkPath(x1, y0, srcH, x2, y1, tgtH), color: outColor })
  })

  const links2 = [] // decision → outcome
  Object.entries(decisionOutcome).forEach(([key, count]) => {
    const [decision, outcome] = key.split('||')
    if (!col2[decision] || !col3[outcome]) return
    const srcH = (count / decisionFlow[decision]) * col2[decision].h
    const tgtH = (count / outcomeFlow[outcome]) * col3[outcome].h
    const y0 = col2[decision].y + col2[decision].outOff
    const y1 = col3[outcome].y + col3[outcome].inOff
    col2[decision].outOff += srcH
    col3[outcome].inOff += tgtH
    const outColor = outcome === 'positive' ? C.ok : outcome === 'unclear' ? C.ochre : C.danger
    links2.push({ path: linkPath(x3, y0, srcH, x4, y1, tgtH), color: outColor })
  })

  const AGENT_COLOR = { QualityGuard: C.ochre, ScheduleOptimizer: C.muted, SupplierBroker: C.muted, CAPAEngine: C.muted }
  const DEC_COLOR = { approved: C.ok, 'auto-executed': C.ochre, rejected: C.warn, overridden: C.muted }
  const OUT_COLOR = { positive: C.ok, unclear: C.ochre, negative: C.danger, harmful: C.danger }

  return { col1, col2, col3, links1, links2, nodeW, AGENT_COLOR, DEC_COLOR, OUT_COLOR }
}

export function SankeyDiagram({ interventions }) {
  const { col1, col2, col3, links1, links2, nodeW, AGENT_COLOR, DEC_COLOR, OUT_COLOR } = buildSankeyLayout(interventions)
  const svgH = 196, padT = 8

  function NodeCol({ nodes, x, colorMap, labelX, labelAnchor }) {
    return Object.entries(nodes).map(([name, n]) => {
      const color = colorMap[name] || C.muted
      const display = name.replace('auto-executed', 'Auto-run').replace('QualityGuard', 'QualityGuard').replace('ScheduleOptimizer', 'Scheduler').replace('SupplierBroker', 'Supplier')
      return (
        <g key={name}>
          <rect x={x} y={n.y + padT} width={nodeW} height={Math.max(4, n.h)} fill={color} rx="1" opacity="0.85" />
          <text x={labelX} y={n.y + padT + n.h / 2 + 3.5} fontSize="8.5" fill={color} textAnchor={labelAnchor}
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.02em">
            {display}
          </text>
        </g>
      )
    })
  }

  return (
    <svg width="100%" viewBox={`0 0 400 ${svgH + padT}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Sankey flow: agent → decision → outcome">
      {/* Column headers */}
      {[['Agent', 5], ['Decision', 200], ['Outcome', 395]].map(([label, x]) => (
        <text key={label} x={x} y="6" fontSize="7.5" fill={C.dim} textAnchor={x > 200 ? 'end' : 'start'}
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">{label.toUpperCase()}</text>
      ))}

      {/* Links: agent → decision */}
      {links1.map((l, i) => <path key={`a${i}`} d={l.path} fill={l.color} opacity="0.12" transform={`translate(0,${padT})`} />)}
      {/* Links: decision → outcome */}
      {links2.map((l, i) => <path key={`d${i}`} d={l.path} fill={l.color} opacity="0.18" transform={`translate(0,${padT})`} />)}

      {/* Nodes */}
      <NodeCol nodes={col1} x={0} colorMap={AGENT_COLOR} labelX={12} labelAnchor="start" />
      <NodeCol nodes={col2} x={190} colorMap={DEC_COLOR} labelX={188} labelAnchor="end" />
      <NodeCol nodes={col2} x={200} colorMap={DEC_COLOR} labelX={212} labelAnchor="start" />
      <NodeCol nodes={col3} x={390} colorMap={OUT_COLOR} labelX={388} labelAnchor="end" />
    </svg>
  )
}

// ── 2. GANTT CHART ────────────────────────────────────────────────────────────
// Shift schedule visualization for ShiftIQ Prepare tab

export function GanttChart({ forecast }) {
  if (!forecast?.length) return null

  // Assign each forecast entry to a time slot and line row
  const TIME_SLOTS = ['Today 14:00', 'Tomorrow 06:00', 'Tomorrow 14:00']
  const LINE_ORDER = ['Line 4', 'Line 6', 'Line 3']

  // Parse line from name like "Line 4 · PM — M. Santos"
  const getLine = (name) => {
    const m = name.match(/Line (\d+)/)
    return m ? `Line ${m[1]}` : 'Other'
  }
  const getSlot = (time) => {
    const t = time.replace('\n', ' ')
    if (t.includes('Today')) return 0
    if (t.includes('Tomorrow') && t.includes('06')) return 1
    return 2
  }
  const getSupervisor = (name) => name.split('—')[1]?.trim() || ''

  const lines = [...new Set(forecast.map(f => getLine(f.name)).filter(l => LINE_ORDER.includes(l)))]
    .sort((a, b) => LINE_ORDER.indexOf(a) - LINE_ORDER.indexOf(b))

  const svgW = 480, labelW = 56, rowH = 30, padT = 24, gap = 2
  const colW = (svgW - labelW) / TIME_SLOTS.length
  const svgH = padT + lines.length * rowH + 4

  const scoreColor = (s) => s >= 75 ? C.danger : s >= 55 ? C.warn : C.ok
  const scoreOpacity = (s) => s >= 75 ? 0.9 : s >= 55 ? 0.8 : 0.75

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Shift schedule Gantt">
      {/* Time headers */}
      {TIME_SLOTS.map((slot, i) => (
        <text key={slot} x={labelW + i * colW + colW / 2} y={14} fontSize="8" fill={C.dim}
          textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
          {slot}
        </text>
      ))}
      {/* Grid lines */}
      {TIME_SLOTS.map((_, i) => (
        <line key={i} x1={labelW + i * colW} x2={labelW + i * colW} y1={padT} y2={svgH}
          stroke="var(--color-rule-2, #1A2335)" strokeWidth="0.5" />
      ))}

      {/* Row labels */}
      {lines.map((line, li) => (
        <text key={line} x={labelW - 6} y={padT + li * rowH + rowH / 2 + 3.5}
          fontSize="8.5" fill={C.muted} textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
          {line}
        </text>
      ))}

      {/* Shift bars */}
      {forecast.map((shift, i) => {
        const line = getLine(shift.name)
        const slot = getSlot(shift.time)
        const li = lines.indexOf(line)
        if (li < 0 || slot < 0) return null
        const x = labelW + slot * colW + gap
        const y = padT + li * rowH + gap
        const w = colW - gap * 2
        const h = rowH - gap * 2
        const color = scoreColor(shift.score)
        const sup = getSupervisor(shift.name)
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill={color} opacity={scoreOpacity(shift.score)} rx="1" />
            {shift.urgent && (
              <rect x={x} y={y} width={3} height={h} fill={C.danger} rx="0" />
            )}
            <text x={x + (shift.urgent ? 7 : 4)} y={y + 10} fontSize="8.5" fill="var(--color-stone, #0B0F18)"
              fontFamily="'IBM Plex Mono', monospace" fontWeight="600">
              {sup}
            </text>
            <text x={x + (shift.urgent ? 7 : 4)} y={y + 20} fontSize="8" fill="var(--color-stone, #0B0F18)"
              fontFamily="'IBM Plex Mono', monospace" opacity="0.75">
              {shift.score} · {shift.signals?.find(s => s.endsWith(':danger'))?.split(':')[0] || 'Score'}
            </text>
          </g>
        )
      })}
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
          fill={C.dim} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{d}</text>
      ))}
      {/* Week labels */}
      {[0, 1, 2, 3].map(w => (
        <text key={w} x={padL - 4} y={padT + w * (cellH + gap) + cellH / 2 + 3.5}
          fontSize="7.5" fill={C.dim} textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
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
  const COLORS = ['var(--color-ok)', 'var(--color-ochre)', 'var(--color-warn)', 'var(--color-muted)']

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
                fontFamily="'IBM Plex Mono', monospace">
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
              fontFamily="'IBM Plex Mono', monospace">{shortName}</text>
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

  const confColor = (c) => c >= 90 ? C.ok : c >= 80 ? C.ochre : C.warn

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
                fontFamily="'IBM Plex Mono', monospace" fontWeight="600">
                {shortLabel}
              </text>
            )}
            {showCount && (
              <text x={r.x + (r.active > 0 ? 6 : 4)} y={r.y + (showLabel ? 24 : 13)} fontSize="8"
                fill={fillColor} fontFamily="'IBM Plex Mono', monospace" opacity="0.75">
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
