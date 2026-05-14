import { useNavigate } from 'react-router-dom'
import { shiftData, line6Data, facility } from '../data'
import { useAppState } from '../context/AppState'
import { riskColorClass, riskLabel, riskBgColor } from '../lib/utils'
import { AlertTriangle, CheckCircle, Clock, Users, ArrowRight, Activity, Brain } from 'lucide-react'
import { PersonAvatar } from '../components/UI'

// Live line data keyed by line ID
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
    modelSignal: 'Staffing cert coverage optimal · no active gaps',
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

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 48
  const h = 20
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

function InterventionPip({ count, acted }) {
  if (count === 0) return (
    <span className="flex items-center gap-1 font-body text-ok text-[10px]">
      <CheckCircle size={10} strokeWidth={2} />
      Clear
    </span>
  )
  const remaining = count - acted
  if (remaining === 0) return (
    <span className="flex items-center gap-1 font-body text-ok text-[10px]">
      <CheckCircle size={10} strokeWidth={2} />
      {count} actioned
    </span>
  )
  return (
    <span className="flex items-center gap-1 font-body text-warn text-[10px]">
      <AlertTriangle size={10} strokeWidth={2} />
      {remaining} pending
    </span>
  )
}

function LineCard({ line, meta, shiftActed, onClick }) {
  const scoreColor = riskColorClass(line.score)
  const zone = riskLabel(line.score)
  const sparkColor = riskBgColor(line.score)
  const pending = meta.findings.filter(f => !shiftActed[f.id]).length
  const totalFindings = meta.findings.length
  const actedin = meta.acted.filter(id => shiftActed[id]).length

  const topFinding = meta.findings.find(f => !shiftActed[f.id])
  const isAtRisk = line.score >= 75
  const isWatch = line.score >= 60 && line.score < 75

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col w-full text-left bg-stone border rounded-sm transition-all duration-150 hover:border-ink/30 hover:shadow-[0_2px_12px_rgba(16,15,13,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre ${
        isAtRisk ? 'border-danger/30' : isWatch ? 'border-warn/20' : 'border-rule2'
      }`}
      aria-label={`${line.name} — risk score ${line.score} — ${zone}`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isAtRisk ? 'bg-danger' : isWatch ? 'bg-warn' : 'bg-ok'}`} />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-bold text-ink text-[20px] leading-none">{line.name}</div>
            <div className="font-body text-ghost text-[11px] mt-1">{meta.shiftLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <MiniSparkline data={meta.sparkline} color={sparkColor} />
            <div className="text-right">
              <div className={`display-num text-[52px] leading-none ${scoreColor}`}>{line.score}</div>
              <div className={`font-body text-[9px] uppercase tracking-widest mt-0.5 ${scoreColor}`}>{zone}</div>
            </div>
          </div>
        </div>

        {/* Top finding */}
        <div className="min-h-[32px]">
          {topFinding ? (
            <p className={`font-body text-[12px] leading-snug ${isAtRisk ? 'text-ink' : 'text-ink2'}`}>
              {topFinding.title}
            </p>
          ) : (
            <p className="font-body text-[12px] text-ghost leading-snug">Running clean — no findings</p>
          )}
        </div>

        {/* Model signal */}
        <div className="flex items-center gap-2 py-2 border-t border-rule2 -mx-6 px-6 bg-stone2/60">
          <Brain size={10} strokeWidth={1.75} className="text-ghost flex-shrink-0" />
          <span className="font-body text-ghost text-[10px] flex-1 truncate">
            <span className={`font-medium tabular-nums ${meta.modelConfidence >= 90 ? 'text-ok' : meta.modelConfidence >= 80 ? 'text-muted' : 'text-warn'}`}>{meta.modelConfidence}%</span>
            {' '}confidence · {meta.modelSignal}
          </span>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-rule2">
          <div className="flex items-center gap-3">
            <PersonAvatar name={meta.supervisor} size={20} />
            <span className="font-body text-ink2 text-[11px]">{meta.supervisor}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-body text-ghost text-[10px]">
              <Clock size={10} strokeWidth={2} />
              {fmtMinutes(meta.minutesRemaining)}
            </span>
            <InterventionPip count={totalFindings} acted={meta.acted.filter(id => shiftActed[id]).length} />
            <ArrowRight size={12} className="text-ghost group-hover:text-ink transition-colors" />
          </div>
        </div>
      </div>
    </button>
  )
}

export default function PlantOverview() {
  const navigate = useNavigate()
  const { shiftActed, currentPlant } = useAppState()
  const lines = shiftData.lines

  const critCount = lines.filter(l => l.score >= 75).length
  const watchCount = lines.filter(l => l.score >= 60 && l.score < 75).length
  const clearCount = lines.filter(l => l.score < 60).length

  const handleLineClick = (lineId) => {
    navigate(`/shift?line=${lineId}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      {/* Header bar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b-2 flex-shrink-0 ${
        critCount > 0 ? 'bg-danger/[0.08] border-b-danger' : watchCount > 0 ? 'bg-warn/[0.08] border-b-warn' : 'bg-stone2 border-b-rule2'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <Activity size={14} strokeWidth={1.75} className={critCount > 0 ? 'text-danger' : watchCount > 0 ? 'text-warn' : 'text-ok'} />
            <span className="font-display font-bold text-ink text-[18px]">{currentPlant?.name || facility.name}</span>
            <span className="font-body text-ghost text-[11px]">· April 16, 2026 · AM shift</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {critCount > 0 && (
              <span className="font-body text-danger text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                {critCount} line{critCount > 1 ? 's' : ''} at risk
              </span>
            )}
            {watchCount > 0 && (
              <span className="font-body text-warn text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warn inline-block" />
                {watchCount} watching
              </span>
            )}
            {clearCount > 0 && (
              <span className="font-body text-ok text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
                {clearCount} clear
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
          <Users size={11} strokeWidth={2} />
          <span>4 active lines · {lines.reduce((a) => a + 18, 0)} workers</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {lines.map(line => (
            <LineCard
              key={line.id}
              line={line}
              meta={LINE_META[line.id] || { supervisor: '—', shiftLabel: '—', minutesRemaining: 0, workerCount: 0, findings: [], sparkline: [], acted: [] }}
              shiftActed={shiftActed}
              onClick={() => handleLineClick(line.id)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-6 pt-4 border-t border-rule2">
          <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Risk scale</span>
          {[
            { label: 'At risk', color: 'bg-danger', range: '75–100' },
            { label: 'Watch', color: 'bg-warn', range: '60–74' },
            { label: 'Clear', color: 'bg-ok', range: '0–59' },
          ].map(({ label, color, range }) => (
            <span key={label} className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
              <span className={`w-2 h-2 rounded-sm ${color}`} />
              {label} · {range}
            </span>
          ))}
          <span className="ml-auto font-body text-ghost text-[10px]">Select a line to open ShiftIQ</span>
        </div>
      </div>
    </div>
  )
}
