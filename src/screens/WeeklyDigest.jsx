import { useAppState } from '../context/AppState'
import { openCases } from '../data/capa.js'
import { goalsData, shiftData, readinessData, facility } from '../data'
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, FileText, Download, Printer } from 'lucide-react'

const WEEK_OEE = [
  { day: 'Mon Apr 10', line4: 79, line6: 88, line3: 82, line2: 91 },
  { day: 'Tue Apr 11', line4: 81, line6: 86, line3: 80, line2: 89 },
  { day: 'Wed Apr 12', line4: 76, line6: 91, line3: 83, line2: 90 },
  { day: 'Thu Apr 13', line4: 84, line6: 89, line3: 85, line2: 88 },
  { day: 'Fri Apr 14', line4: 79, line6: 87, line3: 81, line2: 91 },
  { day: 'Sat Apr 15', line4: 88, line6: 92, line3: 84, line2: 93 },
  { day: 'Today Apr 16', line4: 81, line6: null, line3: null, line2: null },
]

const LINE_COLORS = { line4: '#D94F2A', line6: '#3A8A5A', line3: '#C4920A', line2: '#3A7FD4' }
const LINE_LABELS = { line4: 'Line 4', line6: 'Line 6', line3: 'Line 3', line2: 'Line 2' }

function OEESparkline() {
  const lines = ['line4', 'line6', 'line3', 'line2']
  const w = 480
  const h = 80
  const pad = 8
  const chartW = w - pad * 2
  const chartH = h - pad * 2
  const minV = 70
  const maxV = 100

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" aria-label="7-day OEE trend across all lines">
        {/* Gridlines */}
        {[75, 80, 85, 90].map(v => {
          const y = pad + chartH - ((v - minV) / (maxV - minV)) * chartH
          return (
            <g key={v}>
              <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="#D8D2C8" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={pad - 2} y={y + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {/* Lines */}
        {lines.map(line => {
          const pts = WEEK_OEE
            .map((d, i) => {
              if (d[line] == null) return null
              const x = pad + (i / (WEEK_OEE.length - 1)) * chartW
              const y = pad + chartH - ((d[line] - minV) / (maxV - minV)) * chartH
              return `${x},${y}`
            })
            .filter(Boolean)
          if (pts.length < 2) return null
          return (
            <polyline key={line} points={pts.join(' ')} fill="none"
              stroke={LINE_COLORS[line]} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          )
        })}
        {/* Today's points */}
        {lines.map(line => {
          const last = WEEK_OEE[WEEK_OEE.length - 1]
          if (last[line] == null) return null
          const x = pad + chartW
          const y = pad + chartH - ((last[line] - minV) / (maxV - minV)) * chartH
          return <circle key={line} cx={x} cy={y} r="2.5" fill={LINE_COLORS[line]} />
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-4 mt-1">
        {lines.map(line => (
          <span key={line} className="flex items-center gap-1 font-body text-ghost text-[10px]">
            <span className="w-2.5 h-0.5 inline-block rounded" style={{ backgroundColor: LINE_COLORS[line] }} />
            {LINE_LABELS[line]}
          </span>
        ))}
      </div>
    </div>
  )
}

function DeltaBadge({ delta, invert = false }) {
  const up = delta > 0
  const good = invert ? !up : up
  const Icon = up ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const cls = good ? 'text-ok' : delta === 0 ? 'text-ghost' : 'text-danger'
  return (
    <span className={`flex items-center gap-0.5 font-body text-[11px] font-medium ${cls}`}>
      <Icon size={11} strokeWidth={2} />
      {delta > 0 ? '+' : ''}{delta}%
    </span>
  )
}

function MetricBlock({ label, value, unit, sub, delta, invertDelta }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="font-body text-ghost text-[10px] uppercase tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="display-num text-3xl font-bold text-ink">{value}</span>
        {unit && <span className="font-body text-ghost text-[11px]">{unit}</span>}
      </div>
      {sub && <div className="font-body text-muted text-[11px]">{sub}</div>}
      {delta !== undefined && <DeltaBadge delta={delta} invert={invertDelta} />}
    </div>
  )
}

export default function WeeklyDigest() {
  const { closedCases, readinessScore } = useAppState()
  const closedCount = 14 + (closedCases?.length || 0)
  const openCount = openCases.length - (closedCases?.length || 0)
  const overdueCount = openCases.filter(c => c.badgeColor === 'text-danger' && !closedCases?.includes(c.id)).length

  const topIntervention = {
    finding: 'Sauce Dosing cert mismatch — Reyes (L1) → Martinez (L3)',
    line: 'Line 4 · Apr 16',
    impact: '$8,400',
    desc: 'Staffing correction raised qualified staffing 72% → 83%. OEE recovered from projected 71% to 81% final.',
  }

  const readinessDelta = (readinessScore ?? 64) - 58

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
        <div>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-0.5">Weekly Operations Digest</div>
          <div className="font-display font-bold text-ink text-[18px]">{facility.name}</div>
          <div className="font-body text-ghost text-[11px] mt-0.5">Apr 10–16, 2026 · Prepared for J. Crocker, Plant Director</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => window.print()}
            className="flex items-center gap-1.5 font-body text-[11px] text-muted px-3 py-2 border border-rule2 hover:border-ink/30 transition-colors">
            <Printer size={12} strokeWidth={2} />
            Print
          </button>
          <button type="button"
            className="flex items-center gap-1.5 font-body text-[11px] text-stone px-3 py-2 bg-ink hover:bg-ink2 transition-colors">
            <Download size={12} strokeWidth={2} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-6 py-8 space-y-8">

          {/* 1. OEE trend */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-bold text-ink text-[14px]">OEE — 7-day trailing, all lines</h2>
              <span className="font-body text-ghost text-[11px]">Target: ≥ 82%</span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-5">
              {Object.entries(LINE_LABELS).map(([key, label]) => {
                const vals = WEEK_OEE.map(d => d[key]).filter(Boolean)
                const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                const delta = avg - 82
                return (
                  <div key={key} className="bg-stone2 px-3 py-3 border border-rule2">
                    <div className="font-body text-ghost text-[10px] mb-1" style={{ color: LINE_COLORS[key] }}>{label}</div>
                    <div className="display-num text-2xl font-bold text-ink">{avg}%</div>
                    <DeltaBadge delta={delta} />
                  </div>
                )
              })}
            </div>
            <div className="border border-rule2 p-4 bg-stone">
              <OEESparkline />
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* 2. CAPA register */}
          <section>
            <h2 className="font-display font-bold text-ink text-[14px] mb-4">CAPA register status</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="border border-rule2 bg-stone px-4 py-4">
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Closed this week</div>
                <div className="display-num text-3xl font-bold text-ok">{closedCount}</div>
                <div className="font-body text-ok text-[11px] mt-0.5">cases · all evidence-gated</div>
              </div>
              <div className={`border px-4 py-4 ${openCount > 0 ? 'border-warn/30 bg-warn/[0.03]' : 'border-rule2 bg-stone'}`}>
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Open</div>
                <div className={`display-num text-3xl font-bold ${openCount > 0 ? 'text-warn' : 'text-ok'}`}>{openCount}</div>
                <div className="font-body text-muted text-[11px] mt-0.5">cases in progress</div>
              </div>
              <div className={`border px-4 py-4 ${overdueCount > 0 ? 'border-danger/30 bg-danger/[0.04]' : 'border-rule2 bg-stone'}`}>
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Overdue</div>
                <div className={`display-num text-3xl font-bold ${overdueCount > 0 ? 'text-danger' : 'text-ok'}`}>{overdueCount}</div>
                <div className={`font-body text-[11px] mt-0.5 ${overdueCount > 0 ? 'text-danger/80' : 'text-muted'}`}>
                  {overdueCount > 0 ? 'require immediate action' : 'none overdue'}
                </div>
              </div>
            </div>

            {/* Top root cause */}
            <div className="border border-rule2 bg-stone px-4 py-3">
              <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Top root cause · this week</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-body font-medium text-ink text-[13px]">Skill / Cert mismatch</div>
                  <div className="font-body text-muted text-[11px]">9 open cases · 7 at Sauce Dosing · Lines 4 & 6 · trending up +3 vs 90d ago</div>
                </div>
                <div className="w-20 h-1.5 bg-rule2 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-danger rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* 3. Highest-value intervention */}
          <section>
            <h2 className="font-display font-bold text-ink text-[14px] mb-4">Highest-value intervention this week</h2>
            <div className="border border-ok/30 bg-ok/[0.03] px-5 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-body text-ok text-[10px] uppercase tracking-widest mb-1">{topIntervention.line}</div>
                  <div className="font-display font-bold text-ink text-[15px]">{topIntervention.finding}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-body text-ghost text-[10px]">Est. value protected</div>
                  <div className="display-num text-3xl font-bold text-ok">{topIntervention.impact}</div>
                </div>
              </div>
              <p className="font-body text-ink2 text-[12px] leading-relaxed">{topIntervention.desc}</p>
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* 4. Data readiness */}
          <section>
            <h2 className="font-display font-bold text-ink text-[14px] mb-4">Data readiness</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-rule2 bg-stone px-4 py-4">
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Current score</div>
                <div className="flex items-baseline gap-2">
                  <span className={`display-num text-3xl font-bold ${(readinessScore ?? 64) >= 75 ? 'text-ok' : 'text-warn'}`}>
                    {readinessScore ?? 64}
                  </span>
                  <span className="font-body text-ghost text-[11px]">/ 100</span>
                </div>
                <div className="h-1.5 bg-rule2 mt-2 mb-1 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${(readinessScore ?? 64) >= 75 ? 'bg-ok' : 'bg-warn'}`}
                    style={{ width: `${readinessScore ?? 64}%` }} />
                </div>
                {readinessDelta !== 0 && <DeltaBadge delta={readinessDelta} />}
              </div>
              <div className="border border-rule2 bg-stone px-4 py-4">
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Open issues</div>
                {readinessData.sources.filter(s => s.tone !== 'ok').map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-rule2 last:border-b-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.tone === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
                    <span className="font-body text-ink2 text-[11px]">{s.name}</span>
                    <span className={`ml-auto font-body text-[10px] ${s.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="h-px bg-rule2" />

          {/* 5. Goals vs targets */}
          <section>
            <h2 className="font-display font-bold text-ink text-[14px] mb-4">Goals vs targets · Q2 2026</h2>
            <div className="space-y-3">
              {goalsData.map(g => {
                const pct = g.direction === 'increase'
                  ? Math.round((g.current / g.target) * 100)
                  : Math.round(((g.target * 2 - g.current) / (g.target * 2)) * 100)
                const onTrack = g.direction === 'increase' ? g.current >= g.target * 0.85 : g.current <= g.target * 1.15
                return (
                  <div key={g.id} className="border border-rule2 bg-stone px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-medium text-ink text-[12px]">{g.label}</div>
                      <div className="font-body text-ghost text-[10px] mt-0.5">Target: {g.target}{g.unit} · Deadline: {g.deadline}</div>
                    </div>
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className={`display-num text-xl font-bold ${onTrack ? 'text-ok' : 'text-warn'}`}>{g.current}</span>
                      <span className="font-body text-ghost text-[10px]">{g.unit}</span>
                    </div>
                    <div className={`font-body text-[10px] font-medium px-2 py-0.5 flex-shrink-0 rounded-[3px] ${onTrack ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
                      {onTrack ? 'On track' : 'Needs attention'}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-rule2 flex items-center justify-between">
            <div className="font-body text-ghost text-[10px]">
              Generated Apr 16, 2026 · Takorin Total Intelligence · {facility.name}
            </div>
            <div className="font-body text-ghost text-[10px]">
              Next digest: Apr 23, 2026
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
