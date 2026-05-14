// Variant D — "The Flywheel"
// Makes the Takorin learning loop the primary visual — not OEE, not CAPA counts.
// Visual grammar: flow diagram of Detect→Act→Learn→Improve, accuracy as hero chart,
// "training data accumulation" as a live counter, moat trajectory projected forward.
// Answers: "Is the platform getting smarter?" rather than "How are we doing today?"

import { useState, useEffect } from 'react'
import { shiftData } from '../data'
import { Check, TrendingUp, Zap, BookOpen, RefreshCw, Target } from 'lucide-react'

// Model accuracy over 28 shifts — showing the learning curve
const ACCURACY_HISTORY = [
  { shift: 1,  acc: 61, events: 0 },
  { shift: 3,  acc: 64, events: 3 },
  { shift: 5,  acc: 63, events: 5 },
  { shift: 7,  acc: 67, events: 7 },
  { shift: 9,  acc: 65, events: 9 },
  { shift: 11, acc: 70, events: 11 },
  { shift: 13, acc: 72, events: 14 },
  { shift: 15, acc: 71, events: 16 },
  { shift: 17, acc: 74, events: 18 },
  { shift: 19, acc: 76, events: 21 },
  { shift: 21, acc: 78, events: 24 },
  { shift: 23, acc: 79, events: 27 },
  { shift: 25, acc: 80, events: 31 },
  { shift: 27, acc: 81, events: 35 },
  { shift: 28, acc: 82, events: 47 },
]

// Projection to 300 shifts — S-curve toward ~91%
const PROJECTION = [
  { shift: 28,  acc: 82 },
  { shift: 50,  acc: 85 },
  { shift: 80,  acc: 87 },
  { shift: 120, acc: 88.5 },
  { shift: 180, acc: 90 },
  { shift: 250, acc: 91 },
  { shift: 300, acc: 91.5 },
]

// Training events: each intervention actioned or dismissed with reason
const TRAINING_EVENTS = [
  { type: 'actioned', count: 47, label: 'Findings actioned', color: '#3A8A5A' },
  { type: 'dismissed', count: 12, label: 'Dismissed with reason', color: '#C4920A' },
  { type: 'near-miss', count: 3, label: 'Near-miss reports', color: '#3A7FD4' },
]

// The four stages of the flywheel
const FLYWHEEL_STAGES = [
  { id: 'detect', label: 'Detect', icon: Zap, desc: 'Risk signals aggregate across sensors, checklists, HR, and supplier data into a real-time score.', metric: '4 signal sources', metricSub: 'per shift' },
  { id: 'act', label: 'Act', icon: Target, desc: 'Supervisor actions or dismisses the finding within the intervention window. Both outcomes are data.', metric: '47 actioned', metricSub: 'this quarter' },
  { id: 'learn', label: 'Learn', icon: BookOpen, desc: 'Every action and outcome becomes a labeled training event for the next model iteration.', metric: '62 labels', metricSub: '28 shifts' },
  { id: 'improve', label: 'Improve', icon: TrendingUp, desc: 'Model accuracy improves with each retrain. The gap between Takorin and a new entrant widens.', metric: '82% accurate', metricSub: '+21pp since shift 1' },
]

function AccuracyChart() {
  const w = 640, h = 160
  const padL = 36, padR = 120, padT = 14, padB = 24
  const chartW = w - padL - padR
  const chartH = h - padT - padB

  const maxShift = 300
  const minAcc = 55, maxAcc = 95

  const xOf = (shift) => padL + (shift / maxShift) * chartW
  const yOf = (acc)   => padT + chartH - ((acc - minAcc) / (maxAcc - minAcc)) * chartH

  // Historical path
  const histPts = ACCURACY_HISTORY.map(d => `${xOf(d.shift)},${yOf(d.acc)}`).join(' ')
  // Projection path (starts from last historical point)
  const projPts = PROJECTION.map(d => `${xOf(d.shift)},${yOf(d.acc)}`).join(' ')

  // Peer parity line — 88% (Plant KS-02 equivalent)
  const peerY = yOf(88)
  // Current
  const currentX = xOf(28)
  const currentY = yOf(82)
  // Intersection with peer line (roughly shift ~80)
  const peerIntersectX = xOf(80)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="projGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3A7FD4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3A7FD4" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A8A5A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3A8A5A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[65, 75, 85].map(v => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="#D8D2C8" strokeWidth="0.5" />
          <text x={padL - 4} y={yOf(v) + 3} fontSize="8" fill="#A8A098" textAnchor="end">{v}%</text>
        </g>
      ))}

      {/* Peer parity line */}
      <line x1={padL} x2={w - padR} y1={peerY} y2={peerY} stroke="#696258" strokeWidth="0.75" strokeDasharray="4,3" />
      <text x={w - padR + 3} y={peerY + 3} fontSize="8" fill="#696258">Peer avg</text>
      <text x={w - padR + 3} y={peerY + 12} fontSize="7.5" fill="#A8A098">88%</text>

      {/* Projection area */}
      {(() => {
        const areaBottom = `${xOf(300)},${yOf(minAcc)} ${xOf(28)},${yOf(minAcc)}`
        const areaTop = PROJECTION.map(d => `${xOf(d.shift)},${yOf(d.acc)}`).join(' ')
        return <polygon points={`${xOf(28)},${yOf(minAcc)} ${areaTop} ${xOf(300)},${yOf(minAcc)}`} fill="#3A7FD4" opacity="0.06" />
      })()}

      {/* Historical area */}
      {(() => {
        const area = `${xOf(1)},${yOf(minAcc)} ${histPts} ${xOf(28)},${yOf(minAcc)}`
        return <polygon points={area} fill="url(#histGrad)" />
      })()}

      {/* Projection line (dashed) */}
      <polyline points={projPts} fill="none" stroke="#3A7FD4" strokeWidth="1.5"
        strokeDasharray="5,3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

      {/* Historical line (solid) */}
      <polyline points={histPts} fill="none" stroke="#3A8A5A" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* "You are here" marker */}
      <circle cx={currentX} cy={currentY} r="5" fill="none" stroke="#3A8A5A" strokeWidth="2" />
      <circle cx={currentX} cy={currentY} r="2.5" fill="#3A8A5A" />
      <text x={currentX + 8} y={currentY - 6} fontSize="8.5" fill="#3A8A5A" fontWeight="700">82% · today</text>

      {/* Peer intersection annotation */}
      <line x1={peerIntersectX} x2={peerIntersectX} y1={peerY - 10} y2={peerY + 10} stroke="#696258" strokeWidth="0.5" />
      <text x={peerIntersectX} y={peerY - 13} fontSize="7.5" fill="#696258" textAnchor="middle">~shift 80</text>

      {/* X axis labels */}
      {[1, 50, 100, 150, 200, 250, 300].map(s => (
        <text key={s} x={xOf(s)} y={h - 4} fontSize="8" fill="#A8A098" textAnchor="middle">{s}</text>
      ))}
      <text x={padL + chartW / 2} y={h} fontSize="8" fill="#A8A098" textAnchor="middle">shifts</text>

      {/* Labels for lines */}
      <text x={w - padR + 3} y={yOf(82) - 8} fontSize="8" fill="#3A8A5A" fontWeight="600">Actual</text>
      <text x={w - padR + 3} y={yOf(91.5) + 3} fontSize="8" fill="#3A7FD4" opacity="0.8">Projected</text>
    </svg>
  )
}

function FlywheelDiagram() {
  const [active, setActive] = useState('detect')
  const activeStage = FLYWHEEL_STAGES.find(s => s.id === active)

  return (
    <div className="grid grid-cols-[1fr_280px] gap-6">
      {/* Stage buttons — horizontal flow */}
      <div>
        <div className="flex items-stretch gap-0 border border-rule2 mb-4">
          {FLYWHEEL_STAGES.map((stage, i) => {
            const Icon = stage.icon
            const isActive = active === stage.id
            return (
              <button key={stage.id} type="button" onClick={() => setActive(stage.id)}
                className={`flex-1 flex flex-col items-center gap-2 px-4 py-3.5 border-r border-rule2 last:border-r-0 transition-colors relative ${
                  isActive ? 'bg-ink text-stone' : 'bg-stone hover:bg-stone2 text-ink'
                }`}>
                <Icon size={16} strokeWidth={1.75} className={isActive ? 'text-ochre' : 'text-muted'} />
                <span className={`font-body text-[11px] font-medium ${isActive ? 'text-stone' : 'text-ink'}`}>{stage.label}</span>
                {/* Arrow connector */}
                {i < FLYWHEEL_STAGES.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-stone border border-rule2 rotate-45 z-10" />
                )}
              </button>
            )
          })}
        </div>

        {/* Active stage detail */}
        {activeStage && (
          <div className="border border-rule2 bg-stone2 p-4 slide-in">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display font-bold text-ink text-[18px]">{activeStage.metric}</span>
              <span className="font-body text-ghost text-[11px]">{activeStage.metricSub}</span>
            </div>
            <p className="font-body text-ink2 text-[12px] leading-relaxed">{activeStage.desc}</p>
          </div>
        )}
      </div>

      {/* Training events breakdown */}
      <div className="border border-rule2 bg-stone p-4">
        <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">Training events · 28 shifts</div>
        {TRAINING_EVENTS.map(ev => (
          <div key={ev.type} className="flex items-center gap-3 py-2 border-b border-rule2 last:border-b-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
            <span className="font-body text-ink2 text-[11px] flex-1">{ev.label}</span>
            <span className="display-num text-xl font-bold" style={{ color: ev.color }}>{ev.count}</span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-rule2">
          <div className="flex items-baseline justify-between">
            <span className="font-body text-ghost text-[10px]">Total labeled events</span>
            <span className="display-num text-2xl font-bold text-ink">62</span>
          </div>
          <div className="font-body text-ghost text-[10px] mt-1">At 300 shifts: ~660 events. Sufficient to retrain monthly.</div>
        </div>
      </div>
    </div>
  )
}

function MoatCalculation() {
  const milestones = [
    { shift: 28,  acc: 82, label: 'Today', note: 'Pilot · Line 4', done: true },
    { shift: 80,  acc: 88, label: 'Shift ~80', note: 'Peer parity · Plant KS-02 level', done: false },
    { shift: 150, acc: 90, label: 'Shift ~150', note: 'Cross-plant network activates', done: false },
    { shift: 300, acc: 91, label: 'Shift ~300', note: 'Moat threshold — competitor catch-up ~12mo', done: false },
  ]

  return (
    <div className="border border-rule2 bg-stone">
      <div className="px-4 py-3 border-b border-rule2 bg-stone2">
        <div className="font-body text-ghost text-[10px] uppercase tracking-widest">Moat trajectory · Line 4</div>
      </div>
      <div className="divide-y divide-rule2">
        {milestones.map((m, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3 ${m.done ? 'bg-ok/[0.03]' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.done ? 'bg-ok' : 'border-2 border-rule2 bg-stone'
            }`}>
              {m.done ? <Check size={12} strokeWidth={2.5} className="text-white" /> : (
                <span className="font-body text-ghost text-[9px] font-bold">{i + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-body font-medium text-[12px] ${m.done ? 'text-ok' : 'text-ink'}`}>{m.label}</div>
              <div className="font-body text-ghost text-[10px]">{m.note}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="display-num text-xl font-bold text-ink">{m.acc}%</div>
              <div className="font-body text-ghost text-[9px]">accuracy</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsVariantD() {
  return (
    <div className="flex-1 overflow-y-auto bg-stone">
      <div className="max-w-[860px] mx-auto px-7 py-8 space-y-9">

        {/* Header */}
        <header className="border-b border-rule2 pb-6">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">Intelligence layer · Salina Campus</div>
          <h1 className="font-display font-bold text-ink text-[22px] mb-2">Is Takorin getting smarter?</h1>
          <p className="font-body text-ink2 text-[12px] leading-relaxed" style={{ maxWidth: 520 }}>
            Every shift that runs through Takorin adds a labeled training event. The platform's accuracy compounds over time. A competitor starting a pilot today would need 6–12 months to reach parity.
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <div className="font-body text-ghost text-[10px]">Current accuracy</div>
              <div className="display-num text-3xl font-bold text-ok">82%</div>
            </div>
            <div>
              <div className="font-body text-ghost text-[10px]">Since shift 1</div>
              <div className="font-body font-medium text-ok text-[14px] flex items-center gap-1"><TrendingUp size={13} strokeWidth={2} /> +21pp</div>
            </div>
            <div>
              <div className="font-body text-ghost text-[10px]">Pilot runs for</div>
              <div className="font-body font-medium text-ink text-[14px]">28 shifts · Line 4</div>
            </div>
            <div>
              <div className="font-body text-ghost text-[10px]">Training events</div>
              <div className="font-body font-medium text-ink text-[14px]">62 labeled</div>
            </div>
          </div>
        </header>

        {/* Accuracy chart — the hero visual */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Model accuracy · historical + projected</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
                <span className="inline-block w-4 rounded" style={{ height: 2, backgroundColor: '#3A8A5A' }} />
                Historical
              </span>
              <span className="flex items-center gap-1.5 font-body text-ghost text-[10px]">
                <span className="inline-block w-4 border-t border-dashed border-[#3A7FD4]/70" />
                Projected
              </span>
            </div>
          </div>
          <div className="border border-rule2 p-4 bg-stone">
            <AccuracyChart />
          </div>
          <p className="font-body text-ghost text-[11px] mt-2">
            Peer parity (~88%) is projected at shift 80 — approximately 8 more weeks at current cadence. Each miss pattern identified narrows the gap faster.
          </p>
        </section>

        <div className="h-px bg-rule2" />

        {/* Flywheel diagram */}
        <section>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-4">How the loop works</div>
          <FlywheelDiagram />
        </section>

        <div className="h-px bg-rule2" />

        {/* Moat trajectory */}
        <section>
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-4">Moat milestones</div>
          <div className="grid grid-cols-2 gap-6">
            <MoatCalculation />
            <div className="space-y-4">
              <div className="border border-rule2 bg-stone2 px-4 py-4">
                <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-2">What accumulates over time</div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Labeled shift outcomes', value: '62', sub: 'grows linearly with pilot', color: 'text-ok' },
                    { label: 'CAPA evidence chain', value: '18', sub: 'legal documents, FDA-grade', color: 'text-ink' },
                    { label: 'Cert & training records', value: '14', sub: 'operators in system', color: 'text-ink' },
                    { label: 'Supplier non-conformances', value: '7', sub: 'cross-plant visible at 3 plants', color: 'text-warn' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-body text-ink2 text-[11px] font-medium">{label}</div>
                        <div className="font-body text-ghost text-[10px]">{sub}</div>
                      </div>
                      <span className={`display-num text-xl font-bold ${color} flex-shrink-0`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-ok/30 bg-ok/[0.03] px-4 py-3">
                <div className="font-body text-ghost text-[10px] mb-1">At 300 shifts, a competitor replacing Takorin would need to:</div>
                {['Re-collect 660+ labeled training events', 'Reconstruct CAPA evidence chain for FDA', 'Re-onboard all operator cert records', 'Rebuild supplier non-conformance history'].map(item => (
                  <div key={item} className="flex items-start gap-2 py-0.5">
                    <span className="text-ok mt-px">·</span>
                    <span className="font-body text-ink2 text-[11px]">{item}</span>
                  </div>
                ))}
                <div className="font-body text-ok text-[10px] font-medium mt-2">Estimated switch cost: 8–14 months of lost data advantage.</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
