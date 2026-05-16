import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Brain, Clock, Users, ArrowRight, Activity } from 'lucide-react'
import { shiftData, line6Data, facility, wichitaData } from '../data'
import { useAppState } from '../context/AppState'
import { PersonAvatar } from '../components/UI'
import { riskColorClass, riskLabel, riskBgColor } from '../lib/utils'

// ─── Shared data ──────────────────────────────────────────────────────────────

const LINE_META = {
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

function fmtMinutes(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function MiniSparkline({ data, color, w = 48, h = 20 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} aria-hidden="true" className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

function useLineData() {
  const { shiftActed } = useAppState()
  const lines = shiftData.lines
  const sorted = [...lines].sort((a, b) => b.score - a.score)
  const critCount = lines.filter(l => l.score >= 75).length
  const watchCount = lines.filter(l => l.score >= 60 && l.score < 75).length
  const clearCount = lines.filter(l => l.score < 60).length
  return { lines, sorted, critCount, watchCount, clearCount, shiftActed }
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

const WICHITA_PLANT = { name: 'Wichita Plant', code: 'KS-09' }

// ─── Layout A: Ranked Priority Table ─────────────────────────────────────────
// Lines as a dense ledger sorted by risk descending. No cards — each line is
// one scannable row. Score dominates left, findings run across, supervisor
// and model confidence collapse into a compact right block.
// Good for: directors who want triage speed over visual richness.

function LayoutA() {
  const { sorted, critCount, watchCount, clearCount, shiftActed } = useLineData()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone">

      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-6 py-3 border-b-2 ${
        critCount > 0 ? 'bg-danger/[0.06] border-b-danger/40' : watchCount > 0 ? 'bg-warn/[0.06] border-b-warn/30' : 'bg-stone border-b-rule2'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Activity size={13} strokeWidth={1.75} className={critCount > 0 ? 'text-danger' : watchCount > 0 ? 'text-warn' : 'text-ok'} />
            <span className="font-display font-bold text-ink text-[16px]">{facility.name}</span>
            <span className="font-body text-ghost text-[10px]">· April 16 · AM shift</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {critCount > 0 && <span className="font-body text-danger text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-danger" />{critCount} at risk</span>}
            {watchCount > 0 && <span className="font-body text-warn text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-warn" />{watchCount} watch</span>}
            {clearCount > 0 && <span className="font-body text-ok text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ok" />{clearCount} clear</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
          <Users size={11} strokeWidth={2} />
          <span>4 lines · 66 workers</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2 border-b border-rule2 bg-stone2">
        <div className="w-16 flex-shrink-0" />
        <div className="w-28 flex-shrink-0 font-body text-ghost text-[9px] uppercase tracking-widest">Line</div>
        <div className="flex-1 font-body text-ghost text-[9px] uppercase tracking-widest">Top finding</div>
        <div className="w-24 flex-shrink-0 font-body text-ghost text-[9px] uppercase tracking-widest text-right">Model conf.</div>
        <div className="w-20 flex-shrink-0 font-body text-ghost text-[9px] uppercase tracking-widest text-right">Remaining</div>
        <div className="w-24 flex-shrink-0 font-body text-ghost text-[9px] uppercase tracking-widest text-right">Findings</div>
        <div className="w-8 flex-shrink-0" />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-rule2">
        {sorted.map(line => {
          const meta = LINE_META[line.id]
          const scoreColor = riskColorClass(line.score)
          const sparkColor = riskBgColor(line.score)
          const isAtRisk = line.score >= 75
          const isWatch = line.score >= 60 && line.score < 75
          const topFinding = meta.findings.find(f => !shiftActed[f.id])
          const pending = meta.findings.filter(f => !shiftActed[f.id]).length
          const zone = riskLabel(line.score)
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => navigate(`/shift?line=${line.id}`)}
              className={`group w-full flex items-center gap-4 px-5 py-4 text-left border-l-4 hover:bg-stone2 transition-colors ${
                isAtRisk ? 'border-l-danger bg-danger/[0.01]' : isWatch ? 'border-l-warn' : 'border-l-transparent'
              }`}
            >
              {/* Score */}
              <div className="w-16 flex-shrink-0 flex items-baseline gap-1">
                <span className={`font-display font-bold display-num text-[36px] leading-none tabular-nums ${scoreColor}`}>{line.score}</span>
              </div>

              {/* Name + sparkline */}
              <div className="w-28 flex-shrink-0">
                <div className="font-display font-bold text-ink text-[14px] leading-none">{line.name}</div>
                <div className="font-body text-ghost text-[9px] mt-0.5 uppercase tracking-widest">{zone}</div>
                <MiniSparkline data={meta.sparkline} color={sparkColor} w={56} h={14} />
              </div>

              {/* Top finding */}
              <div className="flex-1 min-w-0">
                {topFinding
                  ? <p className="font-body text-[11px] text-ink leading-snug line-clamp-2">{topFinding.title}</p>
                  : <p className="font-body text-[11px] text-ghost">Running clean — no findings</p>
                }
                <div className="flex items-center gap-1.5 mt-1">
                  <PersonAvatar name={meta.supervisor} size={14} />
                  <span className="font-body text-ghost text-[10px]">{meta.supervisor}</span>
                </div>
              </div>

              {/* Model confidence */}
              <div className="w-24 flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Brain size={9} strokeWidth={1.75} className="text-ghost" />
                  <span className={`font-body font-medium tabular-nums text-[12px] ${meta.modelConfidence >= 90 ? 'text-ok' : meta.modelConfidence >= 80 ? 'text-muted' : 'text-warn'}`}>{meta.modelConfidence}%</span>
                </div>
                <div className="h-0.5 bg-rule2 mt-1.5">
                  <div className={`h-full ${meta.modelConfidence >= 90 ? 'bg-ok' : meta.modelConfidence >= 80 ? 'bg-muted' : 'bg-warn'}`} style={{ width: `${meta.modelConfidence}%` }} />
                </div>
              </div>

              {/* Time remaining */}
              <div className="w-20 flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1 font-body text-ghost text-[11px]">
                  <Clock size={10} strokeWidth={2} />
                  {fmtMinutes(meta.minutesRemaining)}
                </div>
              </div>

              {/* Findings */}
              <div className="w-24 flex-shrink-0 text-right">
                {pending > 0
                  ? <span className="flex items-center justify-end gap-1 font-body text-warn text-[11px]"><AlertTriangle size={10} strokeWidth={2} />{pending} pending</span>
                  : <span className="flex items-center justify-end gap-1 font-body text-ok text-[11px]"><CheckCircle size={10} strokeWidth={2} />Clear</span>
                }
              </div>

              <ArrowRight size={12} className="w-8 flex-shrink-0 text-ghost group-hover:text-ink transition-colors" />
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 flex items-center gap-5 px-6 py-2.5 border-t border-rule2 bg-stone2">
        <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Risk scale</span>
        {[{ label:'At risk', color:'bg-danger', range:'75–100' }, { label:'Watch', color:'bg-warn', range:'60–74' }, { label:'Clear', color:'bg-ok', range:'0–59' }].map(({ label, color, range }) => (
          <span key={label} className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
            <span className={`w-2 h-2 rounded-sm ${color}`} />{label} · {range}
          </span>
        ))}
        <span className="ml-auto font-body text-ghost text-[10px]">Select a line to open ShiftIQ</span>
      </div>
    </div>
  )
}

// ─── Layout B: Score Strip + Expanded Detail ──────────────────────────────────
// Horizontal strip of all 4 lines at top — score + name only, color-coded.
// Clicking a strip expands a full-detail pane below.
// Default: highest-risk line is selected. Focus is on depth, not breadth.
// Good for: directors who work one line at a time, or wall-display contexts.

function LayoutB() {
  const { sorted, critCount, watchCount, clearCount, shiftActed } = useLineData()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(sorted[0]?.id)

  const selected = sorted.find(l => l.id === selectedId)
  const meta = selected ? LINE_META[selected.id] : null
  const topFinding = meta ? meta.findings.find(f => !shiftActed[f.id]) : null
  const pending = meta ? meta.findings.filter(f => !shiftActed[f.id]).length : 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-rule2 bg-stone">
        <div className="flex items-center gap-2">
          <Activity size={13} strokeWidth={1.75} className={critCount > 0 ? 'text-danger' : 'text-ok'} />
          <span className="font-display font-bold text-ink text-[16px]">{facility.name}</span>
          <span className="font-body text-ghost text-[10px]">· April 16 · AM shift</span>
        </div>
        <div className="flex items-center gap-3">
          {critCount > 0 && <span className="font-body text-danger text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-danger" />{critCount} at risk</span>}
          {watchCount > 0 && <span className="font-body text-warn text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-warn" />{watchCount} watch</span>}
          {clearCount > 0 && <span className="font-body text-ok text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ok" />{clearCount} clear</span>}
        </div>
      </div>

      {/* Score strip */}
      <div className="flex-shrink-0 flex border-b border-rule2 divide-x divide-rule2">
        {sorted.map(line => {
          const m = LINE_META[line.id]
          const scoreColor = riskColorClass(line.score)
          const sparkColor = riskBgColor(line.score)
          const isActive = line.id === selectedId
          const isAtRisk = line.score >= 75
          const isWatch = line.score >= 60 && line.score < 75
          const pend = m.findings.filter(f => !shiftActed[f.id]).length
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => setSelectedId(line.id)}
              className={`flex-1 flex flex-col items-start px-5 py-4 text-left transition-colors relative ${
                isActive ? 'bg-stone2' : 'bg-stone hover:bg-stone2/50'
              }`}
            >
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
              <div className="flex items-start justify-between w-full mb-2">
                <div>
                  <div className="font-display font-bold text-ink text-[13px] leading-none">{line.name}</div>
                  <div className="font-body text-ghost text-[9px] mt-0.5">{m.shiftLabel}</div>
                </div>
                <MiniSparkline data={m.sparkline} color={sparkColor} w={40} h={16} />
              </div>
              <div className={`font-display font-bold display-num text-[44px] leading-none tabular-nums ${scoreColor}`}>{line.score}</div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className={`font-body text-[9px] uppercase tracking-widest ${scoreColor}`}>{riskLabel(line.score)}</span>
                {pend > 0
                  ? <span className="font-body text-warn text-[9px] flex items-center gap-0.5"><AlertTriangle size={9} strokeWidth={2} />{pend}</span>
                  : <span className="font-body text-ok text-[9px] flex items-center gap-0.5"><CheckCircle size={9} strokeWidth={2} />Clear</span>
                }
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded detail */}
      {selected && meta && (
        <div className="flex-1 overflow-y-auto">
          {/* Detail header */}
          <div className={`px-6 py-5 border-b border-rule2 border-l-4 ${selected.score >= 75 ? 'border-l-danger bg-danger/[0.02]' : selected.score >= 60 ? 'border-l-warn bg-warn/[0.01]' : 'border-l-ok'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">{selected.name} · {meta.shiftLabel}</div>
                {topFinding
                  ? <p className="font-body font-medium text-ink text-[14px] leading-snug max-w-xl">{topFinding.title}</p>
                  : <p className="font-body text-ghost text-[13px]">Running clean — no findings</p>
                }
              </div>
              <button type="button" onClick={() => navigate(`/shift?line=${selected.id}`)}
                className="flex items-center gap-1.5 font-body text-[11px] px-3 py-2 bg-ink text-stone hover:bg-ink/90 transition-colors flex-shrink-0">
                Open ShiftIQ <ArrowRight size={11} />
              </button>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-3 divide-x divide-rule2 border-b border-rule2">
            <div className="px-6 py-4">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Supervisor</div>
              <div className="flex items-center gap-2">
                <PersonAvatar name={meta.supervisor} size={24} />
                <span className="font-body font-medium text-ink text-[12px]">{meta.supervisor}</span>
              </div>
              <div className="font-body text-ghost text-[10px] mt-1">{fmtMinutes(meta.minutesRemaining)} remaining</div>
            </div>
            <div className="px-6 py-4">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Model confidence</div>
              <div className={`font-display font-bold display-num text-[28px] leading-none ${meta.modelConfidence >= 90 ? 'text-ok' : meta.modelConfidence >= 80 ? 'text-muted' : 'text-warn'}`}>{meta.modelConfidence}%</div>
              <div className="font-body text-ghost text-[10px] mt-1 truncate">{meta.modelSignal}</div>
            </div>
            <div className="px-6 py-4">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Findings</div>
              {pending > 0
                ? <div className="font-display font-bold display-num text-[28px] text-warn leading-none">{pending}</div>
                : <div className="font-display font-bold display-num text-[28px] text-ok leading-none">0</div>
              }
              <div className="font-body text-ghost text-[10px] mt-1">{pending > 0 ? `${meta.findings.length - pending} actioned` : 'all clear'}</div>
            </div>
          </div>

          {/* All findings */}
          {meta.findings.length > 0 && (
            <div>
              {meta.findings.map((f, i) => {
                const actioned = shiftActed[f.id]
                return (
                  <div key={i} className={`flex items-start gap-4 px-6 py-3.5 border-b border-rule2 border-l-2 ${actioned ? 'border-l-ok opacity-50' : f.urgency === 'danger' ? 'border-l-danger' : 'border-l-warn'}`}>
                    <div className="flex-1">
                      <div className={`font-body font-medium text-[12px] ${actioned ? 'text-ghost line-through' : 'text-ink'}`}>{f.title}</div>
                      <div className="font-body text-ghost text-[10px] mt-0.5">{f.sub || f.evidence?.slice(0, 80)}</div>
                    </div>
                    {actioned && <span className="font-body text-ok text-[10px] flex-shrink-0">Actioned</span>}
                  </div>
                )
              })}
            </div>
          )}

          {meta.findings.length === 0 && (
            <div className="flex items-center gap-3 px-6 py-8">
              <CheckCircle size={16} className="text-ok" strokeWidth={2} />
              <span className="font-body text-ghost text-[12px]">No findings — {selected.name} running clean this shift</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Layout C: Score Tiles + Cross-line Feed ──────────────────────────────────
// Four compact score tiles in a horizontal strip — just score, line name,
// model confidence bar, and one pip. Below: a unified feed that merges all
// pending findings from all lines, sorted by urgency. Lines are context;
// the feed is the action surface.
// Good for: directors who manage across lines rather than deep into one.

function LayoutC({ plant = 'salina' }) {
  const isWichita = plant === 'wichita'
  const rawLines = isWichita ? wichitaData.lines : shiftData.lines
  const lineMeta  = isWichita ? WICHITA_LINE_META : LINE_META
  const plantInfo = isWichita ? WICHITA_PLANT : facility
  const { shiftActed } = useAppState()
  const navigate = useNavigate()

  const sorted = [...rawLines].sort((a, b) => b.score - a.score)
  const critCount  = rawLines.filter(l => l.score >= 75).length
  const watchCount = rawLines.filter(l => l.score >= 60 && l.score < 75).length
  const clearCount = rawLines.filter(l => l.score < 60).length
  const totalWorkers = rawLines.reduce((s, l) => s + (lineMeta[l.id]?.workerCount ?? 0), 0)

  // Flatten all pending findings across all lines, sorted by urgency
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
    <div className="flex flex-col h-full overflow-hidden bg-stone">

      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-6 py-3 border-b-2 ${
        critCount > 0 ? 'bg-danger/[0.05] border-b-danger/30' : watchCount > 0 ? 'bg-warn/[0.05] border-b-warn/20' : 'bg-stone2 border-b-rule2'
      }`}>
        <div className="flex items-center gap-2">
          <Activity size={13} strokeWidth={1.75} className={critCount > 0 ? 'text-danger' : watchCount > 0 ? 'text-warn' : 'text-ok'} />
          <span className="font-display font-bold text-ink text-[16px]">{plantInfo.name}</span>
          <span className="font-body text-ghost text-[10px]">· April 16 · AM shift</span>
        </div>
        <div className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
          <Users size={11} strokeWidth={2} /><span>{rawLines.length} lines · {totalWorkers} workers</span>
        </div>
      </div>

      {/* Score tiles */}
      <div className="flex-shrink-0 flex border-b border-rule2 divide-x divide-rule2 bg-stone">
        {sorted.map(line => {
          const meta = lineMeta[line.id]
          const scoreColor = riskColorClass(line.score)
          const sparkColor = riskBgColor(line.score)
          const isAtRisk = line.score >= 75
          const isWatch = line.score >= 60 && line.score < 75
          const pend = meta.findings.filter(f => !shiftActed[f.id]).length
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => navigate(`/shift?line=${line.id}`)}
              className={`flex-1 px-5 py-4 text-left hover:bg-stone2 transition-colors border-l-4 group ${
                isAtRisk ? 'border-l-danger' : isWatch ? 'border-l-warn' : 'border-l-ok'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display font-bold text-ink text-[15px] leading-none">{line.name}</div>
                  <div className="font-body text-ghost text-[9px] mt-0.5">{meta.supervisor}</div>
                </div>
                <MiniSparkline data={meta.sparkline} color={sparkColor} w={44} h={18} />
              </div>

              <div className={`font-display font-bold display-num text-[48px] leading-none tabular-nums mb-2 ${scoreColor}`}>{line.score}</div>

              {/* Model confidence mini bar */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Brain size={8} strokeWidth={1.75} className="text-ghost" />
                    <span className="font-body text-ghost text-[9px]">Model</span>
                  </div>
                  <span className={`font-body font-medium text-[9px] tabular-nums ${meta.modelConfidence >= 90 ? 'text-ok' : meta.modelConfidence >= 80 ? 'text-muted' : 'text-warn'}`}>{meta.modelConfidence}%</span>
                </div>
                <div className="h-0.5 bg-rule2">
                  <div className={`h-full ${meta.modelConfidence >= 90 ? 'bg-ok' : meta.modelConfidence >= 80 ? 'bg-rule' : 'bg-warn'}`} style={{ width: `${meta.modelConfidence}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`font-body text-[9px] uppercase tracking-widest ${scoreColor}`}>{riskLabel(line.score)}</span>
                <span className="font-body text-ghost text-[9px] flex items-center gap-0.5 group-hover:text-ink transition-colors">
                  {pend > 0
                    ? <><AlertTriangle size={9} className="text-warn" strokeWidth={2} /><span className="text-warn">{pend} pending</span></>
                    : <><CheckCircle size={9} className="text-ok" strokeWidth={2} /><span className="text-ok">Clear</span></>
                  }
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Cross-line findings feed */}
      <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2 flex items-center justify-between">
        <span className="font-body font-bold text-ink text-[11px]">
          Pending across all lines
          {allFindings.length > 0 && <span className="ml-2 font-body text-warn text-[10px] font-normal">{allFindings.length} finding{allFindings.length > 1 ? 's' : ''}</span>}
        </span>
        {allFindings.length === 0 && <span className="font-body text-ok text-[10px] flex items-center gap-1"><CheckCircle size={10} strokeWidth={2} />All lines clear</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {allFindings.length > 0
          ? allFindings.map((f, i) => (
            <div key={i} className={`flex items-start gap-4 px-5 py-3.5 border-b border-rule2 border-l-4 ${f.urgency === 'danger' ? 'border-l-danger bg-danger/[0.02]' : 'border-l-warn bg-warn/[0.01]'}`}>
              <AlertTriangle size={12} className={`mt-0.5 flex-shrink-0 ${f.urgency === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <div className="font-body font-medium text-ink text-[12px] leading-snug">{f.title}</div>
                <div className="font-body text-ghost text-[10px] mt-0.5">{f.line.name} · {f.meta.supervisor}</div>
              </div>
              <button type="button" onClick={() => navigate(`/shift?line=${f.line.id}`)}
                className="font-body text-[10px] text-ghost hover:text-ink transition-colors flex items-center gap-1 flex-shrink-0">
                Open <ArrowRight size={10} />
              </button>
            </div>
          ))
          : (
            <div className="flex items-center gap-3 px-5 py-10">
              <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
              <span className="font-body text-ghost text-[12px]">All lines running clean — no pending findings across the plant</span>
            </div>
          )
        }
      </div>
    </div>
  )
}

// ─── Design Lab shell ─────────────────────────────────────────────────────────

const VARIANTS = [
  {
    key: 'A',
    label: 'A — Ranked Priority Table',
    desc: 'Lines as a dense ledger, sorted by risk score descending. Score + finding + supervisor + confidence in one scannable row per line. No cards — maximum information per vertical pixel.',
    Component: LayoutA,
  },
  {
    key: 'B',
    label: 'B — Score Strip + Expanded Detail',
    desc: 'Four score tiles in a horizontal strip; click one to expand full detail below (findings, supervisor, model confidence). Works one line at a time — depth over breadth.',
    Component: LayoutB,
  },
  {
    key: 'C',
    label: 'C — Score Tiles + Cross-line Feed',
    desc: 'Compact score tiles on top (navigate), unified findings feed below that merges all pending issues across all lines sorted by urgency. Lines are context; the feed is the action surface.',
    Component: LayoutC,
  },
]

export default function DesignLab() {
  const [active, setActive] = useState('C')
  const [plant, setPlant] = useState('wichita')
  const current = VARIANTS.find(v => v.key === active)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone2">

      {/* Lab chrome */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 border-b border-rule2 bg-stone">
        <div className="font-body font-bold text-ink text-[13px]">Design Lab</div>
        <div className="font-body text-ghost text-[10px]">Plant Overview · 3 layout explorations</div>
        <div className="ml-auto flex items-center gap-3">
          {/* Plant toggle — only meaningful for C */}
          {active === 'C' && (
            <div className="flex items-center gap-1 border border-rule2">
              {[{ k: 'salina', l: 'Salina' }, { k: 'wichita', l: 'Wichita' }].map(p => (
                <button key={p.k} type="button" onClick={() => setPlant(p.k)}
                  className={`font-body text-[10px] px-2.5 py-1 transition-colors ${plant === p.k ? 'bg-ink text-stone' : 'text-muted hover:text-ink'}`}>
                  {p.l}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {VARIANTS.map(v => (
              <button key={v.key} type="button" onClick={() => setActive(v.key)}
                className={`font-body text-[11px] px-3 py-1.5 border transition-colors ${
                  active === v.key ? 'bg-ink text-stone border-ink' : 'border-rule2 text-muted hover:text-ink hover:border-ghost'
                }`}>
                {v.key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Variant description */}
      <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
        <div className="font-body font-semibold text-ink text-[12px]">{current.label}</div>
        <div className="font-body text-ghost text-[10px] mt-0.5 max-w-2xl">{current.desc}</div>
      </div>

      {/* Full-size preview */}
      <div className="flex-1 overflow-hidden">
        {active === 'C'
          ? <LayoutC plant={plant} />
          : active === 'A' ? <LayoutA /> : <LayoutB />
        }
      </div>

    </div>
  )
}
