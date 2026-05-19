import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { shiftData, line6Data, wichitaData, denverData, facility } from '../data'
import { useAppState } from '../context/AppState'
import { riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import {
  AlertTriangle, CheckCircle, Brain, Clock, Users,
  Activity, CircleDot, ChevronDown, ChevronUp, ExternalLink, X,
} from 'lucide-react'
import { interventionSummary, interventions } from '../data/interventions'
import { FilterDropdown } from '../components/UI'

// ─── Domain assignments ───────────────────────────────────────────────────────
// Maps line.id → { area, areaOrder }
// areaOrder controls how groups sort relative to each other (lower = shown first
// when pressure is equal; overridden by worst-line score within each group).

const LINE_AREAS = {
  // Salina
  l4: { area: 'Hall B', areaOrder: 2 },
  l6: { area: 'Hall B', areaOrder: 2 },
  l3: { area: 'Hall A', areaOrder: 1 },
  l2: { area: 'Hall A', areaOrder: 1 },
  // Wichita
  w1: { area: 'East Wing', areaOrder: 1 },
  w2: { area: 'East Wing', areaOrder: 1 },
  w3: { area: 'West Wing', areaOrder: 2 },
  // Denver
  d1: { area: 'Main Floor', areaOrder: 1 },
  d2: { area: 'Main Floor', areaOrder: 1 },
}

// ─── Line meta ────────────────────────────────────────────────────────────────

const SALINA_LINE_META = {
  l4: {
    supervisor: 'D. Kowalski', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 18,
    findings: shiftData.findings, sparkline: shiftData.sparkline,
    modelConfidence: 87, modelSignal: 'Oven B SCADA stale — confidence penalty active',
  },
  l6: {
    supervisor: 'B. Petrov', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 18,
    findings: line6Data.findings, sparkline: line6Data.sparkline,
    modelConfidence: 92, modelSignal: 'Staffing cert coverage optimal',
  },
  l3: {
    supervisor: 'M. Chen', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 16, findings: [],
    sparkline: [58, 62, 61, 60, 61, 61],
    modelConfidence: 79, modelSignal: 'Sensor variance within historical range',
  },
  l2: {
    supervisor: 'J. Park', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318, workerCount: 14, findings: [],
    sparkline: [36, 37, 38, 38, 37, 38],
    modelConfidence: 95, modelSignal: 'All signals within normal bounds',
  },
}

const WICHITA_LINE_META = {
  w1: {
    supervisor: 'R. Vasquez', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 18,
    findings: wichitaData.findings, sparkline: [62, 65, 68, 70, 69, 71],
    modelConfidence: 74, modelSignal: 'Allergen changeover incomplete — confidence penalty active',
  },
  w2: {
    supervisor: 'A. Tran', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 16, findings: [],
    sparkline: [84, 86, 87, 88, 88, 88],
    modelConfidence: 93, modelSignal: 'All signals within normal bounds',
  },
  w3: {
    supervisor: 'P. Nwosu', shiftLabel: 'PM · 14:00–22:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 15, findings: [],
    sparkline: [58, 60, 61, 62, 62, 62],
    modelConfidence: 85, modelSignal: 'Belt D-3 variance within spec — monitoring',
  },
}

const DENVER_LINE_META = {
  d1: {
    supervisor: 'K. Nakamura', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 18,
    findings: denverData.findings, sparkline: [82, 83, 84, 84, 83, 84],
    modelConfidence: 91, modelSignal: 'All signals within normal bounds',
  },
  d2: {
    supervisor: 'T. Reeves', shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48, workerCount: 16, findings: [],
    sparkline: [89, 90, 91, 91, 91, 91],
    modelConfidence: 94, modelSignal: 'All signals within normal bounds',
  },
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtMinutes(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 44, h = 18
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} aria-hidden="true" className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

// Pressure-weighted border + tint — 3 continuous levels, no arbitrary switches
function pressureCls(score) {
  if (score >= 75) return 'border-l-[5px] border-l-danger bg-danger/[0.025]'
  if (score >= 60) return 'border-l-[3px] border-l-warn'
  return 'border-l-[2px] border-l-ok/50'
}

function pressureClass(score) {
  return score >= 75 ? 'shadow-card-alert' : ''
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PlantOverview() {
  const navigate = useNavigate()
  const { shiftActed, currentPlant } = useAppState()
  const [impactExpanded, setImpactExpanded]     = useState(false)
  const [mode, setMode]                         = useState('normal')
  const [whatIfScores, setWhatIfScores]         = useState({})
  const [compareSelected, setCompareSelected]   = useState([])
  const [zoneFilter, setZoneFilter]             = useState('all')
  const [areaFilter, setAreaFilter]             = useState('all')
  const [findingsFilter, setFindingsFilter]     = useState('all')

  const isWichita = currentPlant?.id === 'ks'
  const isDenver  = currentPlant?.id === 'co'
  const rawLines  = isDenver ? denverData.lines : isWichita ? wichitaData.lines : shiftData.lines
  const lineMeta  = isDenver ? DENVER_LINE_META : isWichita ? WICHITA_LINE_META : SALINA_LINE_META
  const plantName = currentPlant?.name ?? facility.name

  const effScore = (line) =>
    mode === 'whatif' && whatIfScores[line.id] !== undefined
      ? whatIfScores[line.id]
      : line.score

  // Header summary counts — unfiltered, always reflect real/projected state
  const critCount   = rawLines.filter(l => effScore(l) >= 75).length
  const watchCount  = rawLines.filter(l => effScore(l) >= 60 && effScore(l) < 75).length
  const clearCount  = rawLines.filter(l => effScore(l) < 60).length
  const totalWorkers = rawLines.reduce((s, l) => s + (lineMeta[l.id]?.workerCount ?? 0), 0)

  // Available areas for filter pills
  const availableAreas = useMemo(
    () => [...new Set(rawLines.map(l => LINE_AREAS[l.id]?.area).filter(Boolean))].sort(),
    [rawLines]
  )

  // Zone transitions for what-if cascade
  const zoneTransitions = rawLines.map(l => {
    const real = l.score
    const proj = effScore(l)
    if (real === proj) return null
    const zone = s => s >= 75 ? 'at-risk' : s >= 60 ? 'watch' : 'clear'
    if (zone(real) === zone(proj)) return null
    return { line: l, from: zone(real), to: zone(proj), delta: proj - real }
  }).filter(Boolean)

  // Grouped, filtered, sorted domain structure
  const domainGroups = useMemo(() => {
    const buckets = {}
    rawLines.forEach(line => {
      const area = LINE_AREAS[line.id]?.area ?? 'Other'
      if (!buckets[area]) buckets[area] = []
      buckets[area].push(line)
    })

    return Object.entries(buckets)
      .map(([area, lines]) => {
        const filtered = lines
          .filter(line => {
            const eff = mode === 'whatif' && whatIfScores[line.id] !== undefined
              ? whatIfScores[line.id] : line.score
            const pend = lineMeta[line.id]?.findings.filter(f => !shiftActed[f.id]).length ?? 0
            if (zoneFilter === 'risk'  && eff < 75)               return false
            if (zoneFilter === 'watch' && (eff < 60 || eff >= 75)) return false
            if (zoneFilter === 'clear' && eff >= 60)               return false
            if (findingsFilter === 'has'  && pend === 0)           return false
            if (findingsFilter === 'none' && pend > 0)             return false
            return true
          })
          .sort((a, b) => effScore(b) - effScore(a))

        return { area, lines: filtered }
      })
      .filter(g => {
        if (areaFilter !== 'all' && g.area !== areaFilter) return false
        return g.lines.length > 0
      })
      // Sort groups: worst line first, tie-break by areaOrder
      .sort((a, b) => {
        const worst = lines => Math.max(...lines.map(l => effScore(l)))
        const diff  = worst(b.lines) - worst(a.lines)
        if (diff !== 0) return diff
        const aOrd = LINE_AREAS[a.lines[0]?.id]?.areaOrder ?? 99
        const bOrd = LINE_AREAS[b.lines[0]?.id]?.areaOrder ?? 99
        return aOrd - bOrd
      })
  }, [rawLines, lineMeta, shiftActed, zoneFilter, areaFilter, findingsFilter, mode, whatIfScores]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-line findings feed
  const allFindings = rawLines.flatMap(line => {
    const meta = lineMeta[line.id]
    if (!meta) return []
    return meta.findings
      .filter(f => !shiftActed[f.id])
      .map(f => ({ ...f, line, meta }))
  }).sort((a, b) => ({ danger: 0, warn: 1 }[a.urgency] ?? 2) - ({ danger: 0, warn: 1 }[b.urgency] ?? 2))

  const compareLines  = rawLines.filter(l => compareSelected.includes(l.id))
  const anyAdjusted   = Object.keys(whatIfScores).length > 0
  const realAvg       = Math.round(rawLines.reduce((s, l) => s + l.score, 0) / rawLines.length)
  const projAvg       = Math.round(rawLines.reduce((s, l) => s + effScore(l), 0) / rawLines.length)
  const activeFilters = [zoneFilter !== 'all', areaFilter !== 'all', findingsFilter !== 'all'].filter(Boolean).length
  const filteredCount = domainGroups.reduce((s, g) => s + g.lines.length, 0)

  const switchMode = (m) => {
    setMode(prev => prev === m ? 'normal' : m)
    setWhatIfScores({})
    setCompareSelected([])
  }

  const toggleCompare = (id) => setCompareSelected(prev => {
    if (prev.includes(id)) return prev.filter(x => x !== id)
    if (prev.length >= 2) return [prev[1], id]
    return [...prev, id]
  })

  // Grid: auto-fill, at most 4 columns, each ≥ 180px.
  // minmax(max(180px, 25% - 12px), 1fr): when container ≥ 720px each column ≥ 25% → max 4 fit.
  const GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(max(180px, calc(25% - 12px)), 1fr))',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Compact status bar — director scanning glance ───────────────── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 border-b border-rule2 bg-stone">
        <div className="flex items-center gap-2">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
          <span className="font-display font-bold text-ink text-base">{plantName}</span>
          <span className="font-body text-muted text-label">· April 16 · 06:42</span>
        </div>
        <div className="flex items-center gap-4 ml-2">
          {critCount > 0 && (
            <span className="font-body text-danger text-label font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
              {critCount} at risk
            </span>
          )}
          {watchCount > 0 && (
            <span className="font-body text-warn text-label flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
              {watchCount} watch
            </span>
          )}
          <span className="font-body text-ok text-label flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
            {clearCount} clear
          </span>
          <span className="font-body text-muted text-label">{rawLines.length} lines · {totalWorkers} workers</span>
        </div>
        <div className="ml-auto flex items-center gap-px">
          {[['normal', 'Live'], ['whatif', 'What if'], ['compare', 'Compare']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`font-body text-micro px-2.5 py-1.5 transition-colors ${
                mode === m ? 'bg-ink text-stone' : 'text-muted hover:text-ink border border-transparent hover:border-rule'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Impact Loop strip ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-rule2">
        <button type="button" onClick={() => setImpactExpanded(e => !e)}
          className="flex items-center gap-4 px-6 py-2 bg-stone2 hover:bg-stone3 transition-colors text-left w-full">
          <CircleDot size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
          <span className="font-body text-muted text-label">Impact · Last 30 days</span>
          <div className="flex items-center gap-4 ml-2">
            <span className="font-body text-ink text-label">
              <span className="font-medium">{interventionSummary.total}</span>
              <span className="text-muted ml-1">interventions</span>
            </span>
            <span className="w-px h-3 bg-rule2" />
            <span className="font-body text-ok text-label">
              <span className="font-medium">{interventionSummary.positive}</span>
              <span className="text-muted ml-1">positive outcomes</span>
            </span>
            <span className="w-px h-3 bg-rule2" />
            <span className="font-body text-label">
              <span className={`font-medium ${interventionSummary.avgAttributionConfidence >= 0.7 ? 'text-ok' : 'text-warn'}`}>
                {Math.round(interventionSummary.avgAttributionConfidence * 100)}%
              </span>
              <span className="text-muted ml-1">avg attribution</span>
            </span>
            {interventionSummary.lowDwellDecisions > 0 && (
              <>
                <span className="w-px h-3 bg-rule2" />
                <span className="flex items-center gap-1 font-body text-danger text-label">
                  <AlertTriangle size={8} strokeWidth={2} />
                  {interventionSummary.lowDwellDecisions} low-dwell
                </span>
              </>
            )}
          </div>
          {impactExpanded ? <ChevronUp size={10} className="text-muted ml-auto" /> : <ChevronDown size={10} className="text-muted ml-auto" />}
        </button>
        {impactExpanded && (
          <div className="bg-stone px-6 py-3 border-t border-rule2">
            <div className="space-y-0 divide-y divide-rule2 mb-3">
              {(interventions ?? []).slice(0, 4).map(iv => {
                const outcome = iv.consequences?.[0]
                const pos = outcome?.observed?.delta?.startsWith('+') || outcome?.observed?.label?.toLowerCase().includes('resolved')
                return (
                  <div key={iv.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${pos ? 'bg-ok' : 'bg-warn'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-medium text-ink text-label truncate">{iv.agentObservation?.label ?? iv.id}</div>
                      <div className="font-body text-muted text-label truncate">
                        {outcome?.metric ?? ''}{outcome?.observed?.delta ? ` · ${outcome.observed.delta}` : ''}
                      </div>
                    </div>
                    <div className="font-body text-muted text-label flex-shrink-0">
                      {iv.attributionConfidence != null ? `${Math.round(iv.attributionConfidence * 100)}% conf` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={() => navigate('/impact')}
              className="flex items-center gap-1 font-body text-muted text-label hover:text-ink transition-colors">
              <ExternalLink size={9} strokeWidth={2} />Full ImpactLoop view
            </button>
          </div>
        )}
      </div>

      {/* ── Filter strip ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-rule2 bg-stone">
        <FilterDropdown
          label="Zone"
          options={[
            { value: 'all',   label: 'All zones' },
            { value: 'risk',  label: 'At risk'   },
            { value: 'watch', label: 'Watch'      },
            { value: 'clear', label: 'Clear'      },
          ]}
          value={zoneFilter}
          onChange={setZoneFilter}
        />
        <FilterDropdown
          label="Area"
          options={[{ value: 'all', label: 'All areas' }, ...availableAreas.map(a => ({ value: a, label: a }))]}
          value={areaFilter}
          onChange={setAreaFilter}
        />
        <FilterDropdown
          label="Findings"
          options={[
            { value: 'all',  label: 'All'          },
            { value: 'has',  label: 'Has findings'  },
            { value: 'none', label: 'Clear'         },
          ]}
          value={findingsFilter}
          onChange={setFindingsFilter}
        />
        {activeFilters > 0 && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-body text-muted text-label">{filteredCount} of {rawLines.length} lines</span>
            <button type="button"
              onClick={() => { setZoneFilter('all'); setAreaFilter('all'); setFindingsFilter('all') }}
              className="font-body text-label text-muted hover:text-ink transition-colors flex items-center gap-1">
              <X size={10} strokeWidth={2} />Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── What-if cascade preview ──────────────────────────────────────── */}
      {mode === 'whatif' && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-stone2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-body text-muted text-label">Projected cascade</span>
            {anyAdjusted && (
              <button type="button" onClick={() => setWhatIfScores({})}
                className="font-body text-label text-danger hover:text-ink transition-colors ml-auto">
                Reset all
              </button>
            )}
          </div>
          {!anyAdjusted ? (
            <span className="font-body text-muted text-label">Drag sliders on tiles to model downstream impact</span>
          ) : zoneTransitions.length > 0 ? (
            <div className="space-y-1.5">
              {zoneTransitions.map((t, i) => {
                const zc = z => z === 'at-risk' ? 'text-danger' : z === 'watch' ? 'text-warn' : 'text-ok'
                return (
                  <div key={i} className="flex items-center gap-2 font-body text-label">
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.delta < 0 ? 'bg-ok' : 'bg-danger'}`} />
                    <span className="font-medium text-ink">{t.line.name}</span>
                    <span className="text-muted">moves</span>
                    <span className={zc(t.from)}>{t.from}</span>
                    <span className="text-muted">→</span>
                    <span className={zc(t.to)}>{t.to}</span>
                    <span className={`tabular-nums ${t.delta < 0 ? 'text-ok' : 'text-danger'}`}>
                      ({t.delta > 0 ? '+' : ''}{t.delta})
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <span className="font-body text-muted text-label">No zone changes — within existing classification</span>
              <span className="font-body text-muted text-label">
                Plant avg:
                <span className={`font-medium ml-1 ${projAvg > realAvg ? 'text-danger' : projAvg < realAvg ? 'text-ok' : 'text-ink'}`}>
                  {projAvg}
                </span>
                <span className="ml-1">(was {realAvg})</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Compare panel ────────────────────────────────────────────────── */}
      {mode === 'compare' && (
        <div className="flex-shrink-0 border-b border-rule2">
          <div className="px-5 py-1.5 bg-stone3 border-b border-rule2 flex items-center gap-2">
            <span className="font-body text-muted text-label">
              {compareLines.length < 2
                ? `Select ${2 - compareLines.length} more line${2 - compareLines.length !== 1 ? 's' : ''} to compare`
                : `${compareLines[0].name} vs ${compareLines[1].name}`}
            </span>
            {compareLines.length > 0 && (
              <button type="button" onClick={() => setCompareSelected([])}
                className="ml-auto font-body text-label text-danger hover:text-ink transition-colors">
                Clear
              </button>
            )}
          </div>
          {compareLines.length === 2 && (
            <div className="grid grid-cols-2 divide-x divide-rule2">
              {compareLines.map((line, i) => {
                const other     = compareLines[1 - i]
                const meta      = lineMeta[line.id]
                const otherMeta = lineMeta[other.id]
                const delta     = line.score - other.score
                const pend      = meta?.findings.filter(f => !shiftActed[f.id]).length ?? 0
                const otherPend = otherMeta?.findings.filter(f => !shiftActed[f.id]).length ?? 0
                const conf      = meta?.modelConfidence ?? 80
                return (
                  <div key={line.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-body text-muted text-label mb-0.5">
                          {LINE_AREAS[line.id]?.area ?? ''} · {line.name}
                        </div>
                        <div className="font-body text-muted text-label">{meta?.supervisor}</div>
                      </div>
                      <MiniSparkline data={meta?.sparkline} color={riskBgColor(line.score)} />
                    </div>
                    <div className={`font-display font-bold text-display leading-none tabular-nums mb-0.5 ${riskColorClass(line.score)}`}>
                      {line.score}
                    </div>
                    <div className={`font-body font-medium text-label mb-3 ${
                      delta > 0 ? 'text-danger' : delta < 0 ? 'text-ok' : 'text-muted'
                    }`}>
                      {delta === 0 ? 'Equal score' : `${delta > 0 ? '+' : ''}${delta} vs ${other.name}`}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="font-body text-muted text-label mb-0.5">Findings</div>
                        <div className={`font-display font-bold text-subhead leading-none ${
                          pend > otherPend ? 'text-warn' : pend < otherPend ? 'text-ok' : 'text-ink'
                        }`}>{pend}</div>
                      </div>
                      <div>
                        <div className="font-body text-muted text-label mb-0.5">Model</div>
                        <div className={`font-display font-bold text-subhead leading-none ${
                          conf >= 90 ? 'text-ok' : conf >= 80 ? 'text-muted' : 'text-warn'
                        }`}>{conf}%</div>
                      </div>
                      <div>
                        <div className="font-body text-muted text-label mb-0.5">Workers</div>
                        <div className="font-display font-bold text-subhead leading-none text-ink">{meta?.workerCount ?? '—'}</div>
                      </div>
                    </div>
                    <div className="h-[3px] bg-rule2 overflow-hidden">
                      <div className="h-full transition-[width] duration-500"
                        style={{
                          width: `${line.score}%`,
                          background: line.score >= 75 ? 'var(--color-danger)' : line.score >= 60 ? 'var(--color-warn)' : 'var(--color-ok)',
                        }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Scrollable grid + findings ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {domainGroups.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-12">
            <span className="font-body text-muted text-body">
              No lines match the active filters
            </span>
            <button type="button"
              onClick={() => { setZoneFilter('all'); setAreaFilter('all'); setFindingsFilter('all') }}
              className="font-body text-label text-ochre hover:text-ink transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          domainGroups.map(group => {
            const worstScore = Math.max(...group.lines.map(l => effScore(l)))
            const worstZone  = worstScore >= 75 ? 'risk' : worstScore >= 60 ? 'watch' : 'clear'
            const atRiskN    = group.lines.filter(l => effScore(l) >= 75).length
            const watchN     = group.lines.filter(l => effScore(l) >= 60 && effScore(l) < 75).length

            return (
              <section key={group.area}>

                {/* Sticky domain header */}
                <div className="sticky top-0 z-10 flex items-center gap-2.5 px-5 py-2 bg-stone border-b border-t border-rule2">
                  <span className="font-body font-semibold text-ink text-label tracking-tight">{group.area}</span>
                  <span className={`font-body text-label px-1.5 py-0.5 font-medium ${
                    worstZone === 'risk'  ? 'bg-danger/[0.04] text-danger'
                    : worstZone === 'watch' ? 'bg-warn/[0.08] text-warn'
                    : 'bg-ok/[0.07] text-ok'
                  }`}>
                    {worstZone === 'risk' ? 'At risk' : worstZone === 'watch' ? 'Watch' : 'All clear'}
                  </span>
                  {(atRiskN > 0 || watchN > 0) && (
                    <span className="font-body text-muted text-label">
                      {[atRiskN > 0 && `${atRiskN} at risk`, watchN > 0 && `${watchN} watch`].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <span className="ml-auto font-body text-muted text-label">
                    {group.lines.length} line{group.lines.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Pressure grid — hairline gaps via bg-rule2 on container */}
                <div className="bg-rule2" style={{ ...GRID_STYLE, gap: '1px' }}>
                  {group.lines.map(line => {
                    const meta      = lineMeta[line.id]
                    if (!meta) return null
                    const eff       = effScore(line)
                    const modified  = mode === 'whatif' && whatIfScores[line.id] !== undefined && whatIfScores[line.id] !== line.score
                    const pend      = meta.findings.filter(f => !shiftActed[f.id]).length
                    const isCompSel = compareSelected.includes(line.id)
                    const sliderVal = whatIfScores[line.id] ?? line.score
                    const delta     = sliderVal - line.score

                    return (
                      <article
                        key={line.id}
                        className={`relative bg-stone ${pressureCls(eff)} ${pressureClass(eff)}`}
                      >
                        {/* Compare checkbox indicator */}
                        {mode === 'compare' && (
                          <div className={`absolute top-3 right-3 w-4 h-4 border-2 flex items-center justify-center z-10 transition-colors pointer-events-none ${
                            isCompSel ? 'bg-ochre border-ochre' : 'border-rule2 bg-stone'
                          }`} aria-hidden="true">
                            {isCompSel && (
                              <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white"
                                strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        )}

                        {/* Clickable tile body */}
                        <button
                          type="button"
                          className={`w-full px-5 pt-4 pb-3 text-left transition-colors ${
                            mode === 'compare' && isCompSel ? 'bg-ochre/[0.03]' : 'hover:bg-black/[0.012]'
                          }`}
                          onClick={() => mode === 'compare' ? toggleCompare(line.id) : navigate(`/shift?line=${line.id}`)}
                          aria-label={`${line.name} — score ${eff}${mode === 'compare' ? (isCompSel ? ', selected for comparison' : ', click to select') : ', open ShiftIQ'}`}
                          aria-pressed={mode === 'compare' ? isCompSel : undefined}
                        >
                          {/* Name + sparkline */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-display font-bold text-ink text-base leading-none">{line.name}</div>
                              <div className="font-body text-muted text-label mt-0.5">{meta.supervisor}</div>
                            </div>
                            <MiniSparkline data={meta.sparkline} color={riskBgColor(eff)} />
                          </div>

                          {/* Score — pressure-weighted color, smooth transition */}
                          <div
                            className={`display-num text-score leading-none tabular-nums mb-2 ${riskColorClass(eff)}`}
                            style={{ transition: 'color 250ms var(--ease-standard)' }}
                          >
                            {eff}
                            {modified && (
                              <span className="font-body font-normal text-muted text-label ml-2 align-middle">
                                was {line.score}
                              </span>
                            )}
                          </div>

                          {/* Model confidence */}
                          <div className="mb-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <Brain size={8} strokeWidth={1.75} className="text-muted" />
                                <span className="font-body text-muted text-label">Model</span>
                              </div>
                              <span className={`font-body font-medium text-label tabular-nums ${
                                meta.modelConfidence >= 90 ? 'text-ok' : meta.modelConfidence >= 80 ? 'text-muted' : 'text-warn'
                              }`}>{meta.modelConfidence}%</span>
                            </div>
                            <div className="h-0.5 bg-rule2">
                              <div
                                className={`h-full ${meta.modelConfidence >= 90 ? 'bg-ok' : meta.modelConfidence >= 80 ? 'bg-rule' : 'bg-warn'}`}
                                style={{ width: `${meta.modelConfidence}%` }}
                              />
                            </div>
                          </div>

                          {/* Zone label + findings pip */}
                          <div className="flex items-center justify-between">
                            <span className={`font-body text-label ${riskColorClass(eff)}`}>
                              {riskLabel(eff)}
                            </span>
                            {pend > 0
                              ? <span className="font-body text-label text-warn flex items-center gap-0.5">
                                  <AlertTriangle size={9} strokeWidth={2} />{pend} pending
                                </span>
                              : <span className="font-body text-label text-ok flex items-center gap-0.5">
                                  <CheckCircle size={9} strokeWidth={2} />Clear
                                </span>
                            }
                          </div>
                        </button>

                        {/* What-if slider — sibling to button, not nested inside */}
                        {mode === 'whatif' && (
                          <div className="px-5 pb-3 pt-2 border-t border-rule2/40 bg-stone2/40">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-body text-muted text-label">
                                Real: <span className="text-muted font-medium">{line.score}</span>
                              </span>
                              {delta !== 0 && (
                                <span className={`font-body font-bold text-label tabular-nums ${delta > 0 ? 'text-danger' : 'text-ok'}`}>
                                  {delta > 0 ? '+' : ''}{delta}
                                </span>
                              )}
                            </div>
                            <input
                              type="range" min={0} max={100} value={sliderVal}
                              onChange={e => setWhatIfScores(s => ({ ...s, [line.id]: Number(e.target.value) }))}
                              className="w-full cursor-pointer accent-ochre"
                              style={{ height: 2 }}
                            />
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        {/* ── Cross-line findings feed ─────────────────────────────────── */}
        <section className="border-t-2 border-rule2 mt-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2 border-b border-rule2 bg-stone2">
            <span className="font-body font-bold text-ink text-label">
              Pending across all lines
              {allFindings.length > 0 && (
                <span className="ml-2 font-body text-warn text-label font-normal">
                  {allFindings.length} finding{allFindings.length > 1 ? 's' : ''}
                </span>
              )}
            </span>
            {allFindings.length === 0 && (
              <span className="font-body text-ok text-label flex items-center gap-1">
                <CheckCircle size={10} strokeWidth={2} />All lines clear
              </span>
            )}
          </div>

          {allFindings.length > 0
            ? allFindings.map((f, i) => (
                <button key={i} type="button"
                  onClick={() => navigate(`/shift?line=${f.line.id}`)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-3.5 border-b border-rule2 border-l-4 transition-colors hover:bg-stone2 ${
                    f.urgency === 'danger' ? 'border-l-danger bg-danger/[0.02] hover:bg-danger/[0.04]' : 'border-l-warn bg-warn/[0.01] hover:bg-warn/[0.03]'
                  }`}>
                  <AlertTriangle size={12}
                    className={`mt-0.5 flex-shrink-0 ${f.urgency === 'danger' ? 'text-danger' : 'text-warn'}`}
                    strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-body leading-snug">{f.title}</div>
                    <div className="font-body text-muted text-label mt-0.5">
                      {f.line.name} · {f.meta.supervisor}
                      {f.meta.minutesRemaining > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Clock size={9} strokeWidth={2} />{fmtMinutes(f.meta.minutesRemaining)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            : (
                <div className="flex items-center gap-3 px-5 py-10">
                  <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
                  <span className="font-body text-muted text-body">All lines running clean — no pending findings</span>
                </div>
              )
          }
        </section>

      </div>
    </div>
  )
}
