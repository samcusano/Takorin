import { useNavigate } from 'react-router-dom'
import { shiftData, line6Data, wichitaData, facility } from '../data'
import { useAppState } from '../context/AppState'
import { riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import { AlertTriangle, CheckCircle, Brain, Clock, Users, ArrowRight, Activity, CircleDot } from 'lucide-react'
import { interventionSummary } from '../data/interventions'

// ─── Salina line meta ─────────────────────────────────────────────────────────

const SALINA_LINE_META = {
  l4: {
    supervisor: 'D. Kowalski',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318,
    workerCount: 18,
    findings: shiftData.findings,
    sparkline: shiftData.sparkline,
    acted: ['sf1', 'sf2'],
    modelConfidence: 87,
    modelSignal: 'Oven B SCADA stale — confidence penalty active',
  },
  l6: {
    supervisor: 'B. Petrov',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318,
    workerCount: 18,
    findings: line6Data.findings,
    sparkline: line6Data.sparkline,
    acted: [],
    modelConfidence: 92,
    modelSignal: 'Staffing cert coverage optimal',
  },
  l3: {
    supervisor: 'M. Chen',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318,
    workerCount: 16,
    findings: [],
    sparkline: [58, 62, 61, 60, 61, 61],
    acted: [],
    modelConfidence: 79,
    modelSignal: 'Sensor variance within historical range',
  },
  l2: {
    supervisor: 'J. Park',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 318,
    workerCount: 14,
    findings: [],
    sparkline: [36, 37, 38, 38, 37, 38],
    acted: [],
    modelConfidence: 95,
    modelSignal: 'All signals within normal bounds',
  },
}

// ─── Wichita line meta ────────────────────────────────────────────────────────

const WICHITA_LINE_META = {
  w1: {
    supervisor: 'R. Vasquez',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48,
    workerCount: 18,
    findings: wichitaData.findings,
    sparkline: [62, 65, 68, 70, 69, 71],
    acted: [],
    modelConfidence: 74,
    modelSignal: 'Allergen changeover incomplete — confidence penalty active',
  },
  w2: {
    supervisor: 'A. Tran',
    shiftLabel: 'AM · 06:00–14:00',
    minutesRemaining: 27 * 60 + 48,
    workerCount: 16,
    findings: [],
    sparkline: [84, 86, 87, 88, 88, 88],
    acted: [],
    modelConfidence: 93,
    modelSignal: 'All signals within normal bounds',
  },
  w3: {
    supervisor: 'P. Nwosu',
    shiftLabel: 'PM · 14:00–22:00',
    minutesRemaining: 27 * 60 + 48,
    workerCount: 15,
    findings: [],
    sparkline: [58, 60, 61, 62, 62, 62],
    acted: [],
    modelConfidence: 85,
    modelSignal: 'Belt D-3 variance within spec — monitoring',
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
  const w = 44
  const h = 18
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PlantOverview() {
  const navigate = useNavigate()
  const { shiftActed, currentPlant } = useAppState()

  const isWichita = currentPlant?.id === 'ks'
  const rawLines  = isWichita ? wichitaData.lines : shiftData.lines
  const lineMeta  = isWichita ? WICHITA_LINE_META : SALINA_LINE_META
  const plantName = currentPlant?.name ?? facility.name

  const sorted      = [...rawLines].sort((a, b) => b.score - a.score)
  const critCount   = rawLines.filter(l => l.score >= 75).length
  const watchCount  = rawLines.filter(l => l.score >= 60 && l.score < 75).length
  const clearCount  = rawLines.filter(l => l.score < 60).length
  const totalWorkers = rawLines.reduce((s, l) => s + (lineMeta[l.id]?.workerCount ?? 0), 0)

  // All pending findings merged across lines, sorted by urgency
  const allFindings = sorted.flatMap(line => {
    const meta = lineMeta[line.id]
    if (!meta) return []
    return meta.findings
      .filter(f => !shiftActed[f.id])
      .map(f => ({ ...f, line, meta }))
  }).sort((a, b) => {
    const ord = { danger: 0, warn: 1 }
    return (ord[a.urgency] ?? 2) - (ord[b.urgency] ?? 2)
  })

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 flex items-center justify-between px-6 py-3 border-b-2 ${
        critCount > 0
          ? 'bg-danger/[0.05] border-b-danger/30'
          : watchCount > 0
          ? 'bg-warn/[0.05] border-b-warn/20'
          : 'bg-stone2 border-b-rule2'
      }`}>
        <div className="flex items-center gap-2">
          <Activity size={13} strokeWidth={1.75}
            className={critCount > 0 ? 'text-danger' : watchCount > 0 ? 'text-warn' : 'text-ok'} />
          <span className="font-display font-bold text-ink text-[16px]">{plantName}</span>
          <span className="font-body text-ghost text-[10px]">· April 16 · AM shift</span>
        </div>
        <div className="flex items-center gap-3">
          {critCount > 0 && (
            <span className="font-body text-danger text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />{critCount} at risk
            </span>
          )}
          {watchCount > 0 && (
            <span className="font-body text-warn text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />{watchCount} watch
            </span>
          )}
          {clearCount > 0 && (
            <span className="font-body text-ok text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />{clearCount} clear
            </span>
          )}
          <span className="font-body text-ghost text-[10px] flex items-center gap-1.5 border-l border-rule2 pl-3">
            <Users size={11} strokeWidth={2} />
            {rawLines.length} lines · {totalWorkers} workers
          </span>
        </div>
      </div>

      {/* ── Impact Loop summary strip ───────────────────────────── */}
      <button type="button" onClick={() => navigate('/impact')}
        className="flex-shrink-0 flex items-center gap-4 px-6 py-2 border-b border-rule2 bg-stone2 hover:bg-stone3 transition-colors group text-left w-full">
        <CircleDot size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
        <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Impact · Last 30 days</span>
        <div className="flex items-center gap-4 ml-2">
          <span className="font-body text-ink text-[10px]">
            <span className="font-medium">{interventionSummary.total}</span>
            <span className="text-ghost ml-1">interventions</span>
          </span>
          <span className="w-px h-3 bg-rule2" />
          <span className="font-body text-ok text-[10px]">
            <span className="font-medium">{interventionSummary.positive}</span>
            <span className="text-ghost ml-1">positive outcomes</span>
          </span>
          <span className="w-px h-3 bg-rule2" />
          <span className="font-body text-[10px]">
            <span className={`font-medium ${interventionSummary.avgAttributionConfidence >= 0.7 ? 'text-ok' : 'text-warn'}`}>
              {Math.round(interventionSummary.avgAttributionConfidence * 100)}%
            </span>
            <span className="text-ghost ml-1">avg attribution</span>
          </span>
          {interventionSummary.lowDwellDecisions > 0 && (
            <>
              <span className="w-px h-3 bg-rule2" />
              <span className="flex items-center gap-1 font-body text-danger text-[10px]">
                <AlertTriangle size={8} strokeWidth={2} />
                {interventionSummary.lowDwellDecisions} low-dwell decision{interventionSummary.lowDwellDecisions > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        <ArrowRight size={10} className="text-ghost ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* ── Score tiles ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex border-b border-rule2 divide-x divide-rule2 bg-stone">
        {sorted.map(line => {
          const meta = lineMeta[line.id]
          if (!meta) return null
          const scoreColor = riskColorClass(line.score)
          const sparkColor = riskBgColor(line.score)
          const isAtRisk   = line.score >= 75
          const isWatch    = line.score >= 60 && line.score < 75
          const pend       = meta.findings.filter(f => !shiftActed[f.id]).length
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => navigate(`/shift?line=${line.id}`)}
              className={`flex-1 px-5 py-4 text-left hover:bg-stone2 transition-colors border-l-4 group ${
                isAtRisk ? 'border-l-danger' : isWatch ? 'border-l-warn' : 'border-l-ok'
              }`}
              aria-label={`${line.name} — score ${line.score} — open ShiftIQ`}
            >
              {/* Name + sparkline */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-display font-bold text-ink text-[15px] leading-none">{line.name}</div>
                  <div className="font-body text-ghost text-[9px] mt-0.5">{meta.supervisor}</div>
                </div>
                <MiniSparkline data={meta.sparkline} color={sparkColor} />
              </div>

              {/* Score */}
              <div className={`font-display font-bold display-num text-[48px] leading-none tabular-nums mb-2 ${scoreColor}`}>
                {line.score}
              </div>

              {/* Model confidence bar */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Brain size={8} strokeWidth={1.75} className="text-ghost" />
                    <span className="font-body text-ghost text-[9px]">Model</span>
                  </div>
                  <span className={`font-body font-medium text-[9px] tabular-nums ${
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

              {/* Zone + findings pip */}
              <div className="flex items-center justify-between">
                <span className={`font-body text-[9px] uppercase tracking-widest ${scoreColor}`}>
                  {riskLabel(line.score)}
                </span>
                {pend > 0
                  ? <span className="font-body text-[9px] text-warn flex items-center gap-0.5">
                      <AlertTriangle size={9} strokeWidth={2} className="text-warn" />{pend} pending
                    </span>
                  : <span className="font-body text-[9px] text-ok flex items-center gap-0.5">
                      <CheckCircle size={9} strokeWidth={2} className="text-ok" />Clear
                    </span>
                }
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Cross-line findings feed ─────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-rule2 bg-stone2">
        <span className="font-body font-bold text-ink text-[11px]">
          Pending across all lines
          {allFindings.length > 0 && (
            <span className="ml-2 font-body text-warn text-[10px] font-normal">
              {allFindings.length} finding{allFindings.length > 1 ? 's' : ''}
            </span>
          )}
        </span>
        {allFindings.length === 0 && (
          <span className="font-body text-ok text-[10px] flex items-center gap-1">
            <CheckCircle size={10} strokeWidth={2} />All lines clear
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {allFindings.length > 0
          ? allFindings.map((f, i) => (
            <div key={i}
              className={`flex items-start gap-4 px-5 py-3.5 border-b border-rule2 border-l-4 ${
                f.urgency === 'danger' ? 'border-l-danger bg-danger/[0.02]' : 'border-l-warn bg-warn/[0.01]'
              }`}>
              <AlertTriangle size={12}
                className={`mt-0.5 flex-shrink-0 ${f.urgency === 'danger' ? 'text-danger' : 'text-warn'}`}
                strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <div className="font-body font-medium text-ink text-[12px] leading-snug">{f.title}</div>
                <div className="font-body text-ghost text-[10px] mt-0.5">
                  {f.line.name} · {f.meta.supervisor}
                  {f.meta.minutesRemaining > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock size={9} strokeWidth={2} />{fmtMinutes(f.meta.minutesRemaining)} remaining
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => navigate(`/shift?line=${f.line.id}`)}
                className="font-body text-[10px] text-ghost hover:text-ink transition-colors flex items-center gap-1 flex-shrink-0">
                Open ShiftIQ <ArrowRight size={10} />
              </button>
            </div>
          ))
          : (
            <div className="flex items-center gap-3 px-5 py-10">
              <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
              <span className="font-body text-ghost text-[12px]">
                All lines running clean — no pending findings
              </span>
            </div>
          )
        }
      </div>

    </div>
  )
}
