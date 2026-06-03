import { useState } from 'react'
import { batches } from '../data/batches'
import { sensoryReadings, expertAnnotations } from '../data/quality'
import {
  CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronRight, Zap, FlaskConical,
} from 'lucide-react'
import { StatusPill, AnimatedScore } from '../components/UI'

// ─── Shared data ──────────────────────────────────────────────────────────────

const BATCH = batches[0] // BTH-2026-047 · active fermentation · benzaldehyde warning
const SENSORY = sensoryReadings.filter(r => r.batch === BATCH.id)
const ANNOTATIONS = expertAnnotations.filter(a => a.batch === BATCH.id)

const pct = Math.round((BATCH.daysElapsed / BATCH.totalDays) * 100)
const warnSignals = BATCH.signals.filter(s => s.tone !== 'ok')
const okSignals   = BATCH.signals.filter(s => s.tone === 'ok')

// ─── Shared micro-components ──────────────────────────────────────────────────

function MiniChart() {
  const traj = BATCH.confidence.trajectory
  const fore = BATCH.confidence.forecast
  const all = [...traj, ...fore.map(p => ({ ...p, predicted: true }))]
  const vals = all.map(p => p.val)
  const minV = Math.min(...vals) - 4, maxV = Math.max(...vals) + 4, range = maxV - minV
  const W = 320, H = 72, pad = 12
  const toX = i => pad + (i / (all.length - 1)) * (W - pad * 2)
  const toY = v => H - pad - ((v - minV) / range) * (H - pad * 2)
  const trajPts = traj.map((p, i) => `${toX(i)},${toY(p.val)}`).join(' ')
  const foreStart = traj.length - 1
  const forePts = [traj[foreStart], ...fore].map((p, i) => `${toX(foreStart + i)},${toY(p.val)}`).join(' ')
  const cx = toX(traj.length - 1), cy = toY(traj[traj.length - 1].val)
  const fill = [`${toX(0)},${H - pad}`, ...traj.map((p, i) => `${toX(i)},${toY(p.val)}`), `${cx},${H - pad}`].join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="dlFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ok)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-ok)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[70, 80, 90].map(v => (
        <line key={v} x1={pad} x2={W - pad} y1={toY(v)} y2={toY(v)} stroke="var(--color-rule-2)" strokeWidth={1.5} />
      ))}
      <polygon points={fill} fill="url(#dlFill)" />
      <polyline points={forePts} fill="none" stroke="var(--color-signal)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      <polyline points={trajPts} fill="none" stroke="var(--color-ok)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--color-ok)" />
      {[70, 82, 91].map(v => (
        <text key={v} x={3} y={toY(v) + 3} fontSize={7} fill="var(--color-muted)" fontFamily="'IBM Plex Sans'">{v}%</text>
      ))}
    </svg>
  )
}

function StageBar() {
  return (
    <div>
      <div className="flex gap-px mb-1.5">
        {BATCH.stages.map(s => (
          <div key={s.id} className={`flex-1 h-1 ${
            s.status === 'complete' ? 'bg-ok' : s.status === 'active' ? 'bg-signal' : 'bg-rule2'
          }`} />
        ))}
      </div>
      <div className="flex gap-px">
        {BATCH.stages.map(s => (
          <div key={s.id} className="flex-1 min-w-0">
            <div className={`font-body text-label truncate ${
              s.status === 'active' ? 'text-signal font-medium' : s.status === 'complete' ? 'text-muted' : 'text-muted opacity-30'
            }`}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalPill({ s }) {
  const tc = s.tone === 'ok' ? 'text-ok' : s.tone === 'warn' ? 'text-warn' : 'text-danger'
  const bc = s.tone === 'ok' ? 'border-rule2' : s.tone === 'warn' ? 'border-warn/30' : 'border-danger/30'
  const bg = s.tone === 'ok' ? '' : s.tone === 'warn' ? 'bg-warn/[0.03]' : 'bg-danger/[0.03]'
  const Arrow = s.trend === 'rising' ? TrendingUp : s.trend === 'declining' ? TrendingDown : Minus
  const ac = s.trend === 'declining' ? 'text-warn' : s.trend === 'rising' ? 'text-ok' : 'text-muted'
  return (
    <div className={`border ${bc} ${bg} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <span className="font-body text-label text-muted leading-snug flex-1">{s.label}</span>
        <Arrow size={9} strokeWidth={2} className={`${ac} flex-shrink-0 mt-0.5`} />
      </div>
      <div className={`display-num text-head tabular-nums leading-none ${tc}`}>{s.val}</div>
      <div className="font-body text-label text-muted mt-1">{s.baseline}</div>
    </div>
  )
}

function SignalRow({ s }) {
  const tc = s.tone === 'ok' ? 'text-ok' : s.tone === 'warn' ? 'text-warn' : 'text-danger'
  const isCrit = s.influence === 'critical'
  const Arrow = s.trend === 'rising' ? TrendingUp : s.trend === 'declining' ? TrendingDown : Minus
  const ac = s.trend === 'declining' ? 'text-warn' : s.trend === 'rising' ? 'text-ok' : 'text-muted'
  return (
    <div className={`flex items-center gap-4 px-5 py-3 border-b border-rule2 last:border-0 ${isCrit ? 'border-l-[3px] border-l-signal' : ''} ${s.tone !== 'ok' ? 'bg-warn/[0.02]' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-body">{s.label}</span>
          {isCrit && <span className="font-body text-label text-signal">critical</span>}
        </div>
        {s.note && <div className="font-body text-muted text-label leading-snug mt-0.5">{s.note}</div>}
      </div>
      <span className="font-body text-muted text-label flex-shrink-0">{s.baseline}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`display-num text-head tabular-nums ${tc}`}>{s.val}</span>
        <Arrow size={10} strokeWidth={2} className={ac} />
      </div>
    </div>
  )
}

function CompoundCard({ c }) {
  const tc = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
  const bc = c.tone === 'ok' ? 'border-l-ok' : c.tone === 'warn' ? 'border-l-warn' : 'border-l-danger'
  const Arrow = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
  const ac = c.direction === 'up' ? 'text-ok' : c.direction === 'down' ? 'text-warn' : 'text-muted'
  return (
    <div className={`border border-rule2 border-l-[3px] ${bc} p-3`}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-body text-muted text-label leading-snug flex-1">{c.name}</span>
        <Arrow size={9} strokeWidth={2} className={`${ac} flex-shrink-0`} />
      </div>
      <div className={`display-num text-sub tabular-nums leading-none ${tc}`}>
        {c.val} <span className="font-body text-label text-muted font-normal">{c.unit}</span>
      </div>
      <div className="font-body text-muted text-label mt-1">{c.baseline}</div>
      {c.note && <div className="font-body text-muted text-label mt-1 leading-snug">{c.note}</div>}
    </div>
  )
}

function BatchListPanel({ selected, onSelect }) {
  return (
    <div className="w-[260px] flex-shrink-0 border-r border-rule2 overflow-y-auto bg-stone">
      {batches.map(b => {
        const conf = b.confidence?.current ?? null
        const cc = conf >= 85 ? 'text-ok' : conf >= 70 ? 'text-warn' : 'text-danger'
        const pctD = Math.round((b.daysElapsed / b.totalDays) * 100)
        const isSel = b.id === selected
        return (
          <button key={b.id} type="button" onClick={() => onSelect(b.id)}
            className={`w-full text-left px-4 py-3 border-b border-rule2 transition-colors ${isSel ? 'bg-stone2' : 'hover:bg-stone2/50'}`}>
            {conf != null && conf < 75 && (
              <div className="mb-1.5"><StatusPill tone={conf < 60 ? 'danger' : 'warn'}>{conf < 60 ? 'Critical' : 'Watch'}</StatusPill></div>
            )}
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="font-body font-medium text-ink text-body leading-snug truncate">{b.name}</span>
              <span className={`display-num text-sub tabular-nums flex-shrink-0 ${cc}`}>{conf}%</span>
            </div>
            <div className="font-body text-muted text-label mb-2">{b.vessel} · {b.daysElapsed}/{b.totalDays}d</div>
            <div className="h-0.5 bg-rule2 mb-1.5">
              <div className={`h-full ${b.stage === 'complete' ? 'bg-ok' : 'bg-signal'}`} style={{ width: `${pctD}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-muted text-label">{b.stage === 'complete' ? 'Complete' : b.stage.replace(/-/g, ' ')}</span>
              <span className={`font-body text-label ${b.grade === 'Premium' ? 'text-signal' : 'text-muted'}`}>{b.grade}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}


// ─── VARIANT A — Signal-first: no tabs, signals lead ─────────────────────────
// The most important thing about an active batch is whether signals are nominal.
// Signals lead the page. The chart becomes supporting evidence.
// Quality data (sensory) appears inline below signals — no separate tab.

function VariantA() {
  const [sel, setSel] = useState(BATCH.id)
  const [expertOpen, setExpertOpen] = useState(true)
  return (
    <div className="flex h-full overflow-hidden">
      <BatchListPanel selected={sel} onSelect={setSel} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Compact header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-label text-muted mb-1">{BATCH.vessel} · {BATCH.zone}</div>
              <div className="font-display font-bold text-ink text-head leading-none">{BATCH.name}</div>
              <div className="font-body text-muted text-label mt-1">Day {BATCH.daysElapsed} of {BATCH.totalDays} · {pct}%</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="display-num text-score text-ok leading-none">82%</div>
              <div className="font-body text-label text-muted mt-0.5">Premium projected</div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <TrendingUp size={9} strokeWidth={2} className="text-ok" />
                <span className="font-body text-label text-ok">Rising</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <StageBar />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Warning signals — elevated, prominent */}
          {warnSignals.length > 0 && (
            <div className="border-b border-rule2">
              <div className="flex items-center gap-2 px-5 py-2 bg-warn/[0.04] border-b border-rule2">
                <AlertTriangle size={10} strokeWidth={2} className="text-warn" />
                <span className="font-body text-label font-semibold text-warn">{warnSignals.length} signal{warnSignals.length > 1 ? 's' : ''} need attention</span>
              </div>
              {warnSignals.map((s, i) => <SignalRow key={i} s={s} />)}
            </div>
          )}

          {/* All signals */}
          <div className="border-b border-rule2">
            <div className="px-5 py-2 bg-stone2 border-b border-rule2">
              <span className="font-body text-label text-muted">Live signals · {BATCH.signals.length} tracked</span>
            </div>
            {BATCH.signals.map((s, i) => <SignalRow key={i} s={s} />)}
          </div>

          {/* Confidence chart — secondary, below signals */}
          <div className="border-b border-rule2">
            <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between">
              <span className="font-body text-label text-muted">Confidence trajectory</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-body text-muted text-label">
                  <span className="inline-block w-4 h-0.5 bg-ok rounded-full" />actual
                </span>
                <span className="flex items-center gap-1.5 font-body text-muted text-label">
                  <span className="inline-block w-4 h-0.5 bg-signal opacity-60" />forecast
                </span>
              </div>
            </div>
            <div className="px-5 py-3">
              <MiniChart />
            </div>
          </div>

          {/* Sensory readings inline — no separate tab */}
          <div className="border-b border-rule2">
            <div className="px-5 py-2 bg-stone2 border-b border-rule2">
              <span className="font-body text-label text-muted">Sensory readings · {SENSORY.length} sessions</span>
            </div>
            {SENSORY.slice(0, 1).map(r => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="font-body font-medium text-ink text-body">{r.source}</div>
                    <div className="font-body text-muted text-label">{new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="display-num text-metric text-ok leading-none">{r.overallScore}</div>
                    <div className="font-body text-label text-muted">{r.gradeProjection} · {r.confidence}% conf</div>
                  </div>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {r.compounds.map((c, i) => <CompoundCard key={i} c={c} />)}
                </div>
                {r.expertAnnotation && (
                  <div className="mt-3 flex items-start gap-3 px-3 py-2.5 border-l-[3px] border-l-signal bg-signal/[0.03]">
                    <span className="font-body font-semibold text-signal text-label flex-shrink-0">{r.expertAnnotation.author}</span>
                    <span className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}


// ─── VARIANT B — Two-column workspace ─────────────────────────────────────────
// Batch tab: signals (left) + chart + quality prediction (right) side by side.
// Quality tab: same as today but compound cards made more compact.
// Eliminates the deeply nested sections in the current Batch tab by using
// horizontal space more efficiently.

function VariantB() {
  const [sel, setSel] = useState(BATCH.id)
  const [tab, setTab] = useState('batch')
  return (
    <div className="flex h-full overflow-hidden">
      <BatchListPanel selected={sel} onSelect={setSel} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-rule2">
          <div className="flex items-center gap-3 mb-2">
            <div className="display-num text-score text-ok leading-none">82%</div>
            <div>
              <div className="font-display font-bold text-ink text-body">{BATCH.name}</div>
              <div className="font-body text-muted text-label">{BATCH.vessel} · Day {BATCH.daysElapsed}/{BATCH.totalDays} · Premium projected</div>
            </div>
          </div>
          <StageBar />
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-rule2 bg-stone2">
          {[{ id: 'batch', label: 'Batch' }, { id: 'quality', label: 'Quality' }].map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 font-body text-label transition-colors border-b-2 ${tab === t.id ? 'text-ink border-b-signal' : 'text-muted border-b-transparent hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'batch' && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: signals */}
            <div className="flex-1 overflow-y-auto border-r border-rule2">
              {warnSignals.length > 0 && (
                <div className="flex items-center gap-2 px-5 py-2 bg-warn/[0.03] border-b border-rule2">
                  <AlertTriangle size={9} strokeWidth={2} className="text-warn" />
                  <span className="font-body text-label text-warn font-medium">{warnSignals.length} signal{warnSignals.length > 1 ? 's' : ''} need attention</span>
                </div>
              )}
              <div className="px-4 py-2 bg-stone2 border-b border-rule2">
                <span className="font-body text-label text-muted">Live signals</span>
              </div>
              {BATCH.signals.map((s, i) => <SignalRow key={i} s={s} />)}
            </div>

            {/* Right: chart + quality prediction */}
            <div className="w-[320px] flex-shrink-0 overflow-y-auto">
              <div className="px-4 py-2 bg-stone2 border-b border-rule2">
                <span className="font-body text-label text-muted">Confidence trajectory</span>
              </div>
              <div className="px-4 py-3 border-b border-rule2">
                <MiniChart />
              </div>

              <div className="px-4 py-2 bg-stone2 border-b border-rule2">
                <span className="font-body text-label text-muted">Quality prediction</span>
              </div>
              <div className="px-4 py-4 space-y-3">
                {[
                  { label: 'Aroma', val: BATCH.qualityPrediction.aroma },
                  { label: 'Color', val: BATCH.qualityPrediction.color },
                  { label: 'Umami', val: BATCH.qualityPrediction.taste.umami },
                  { label: 'Salt',  val: BATCH.qualityPrediction.taste.salt },
                  { label: 'Sweet', val: BATCH.qualityPrediction.taste.sweet },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="font-body text-muted text-label w-14 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-rule2">
                      <div className={`h-full ${val >= 85 ? 'bg-ok' : val >= 70 ? 'bg-signal' : 'bg-warn'}`} style={{ width: `${val}%` }} />
                    </div>
                    <span className="display-num text-sub tabular-nums w-6 text-right text-muted flex-shrink-0">{val}</span>
                  </div>
                ))}
                {BATCH.qualityPrediction.riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 font-body text-label text-warn">
                    <AlertTriangle size={9} className="flex-shrink-0 mt-px" strokeWidth={2} />
                    <span className="leading-snug">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'quality' && (
          <div className="flex-1 overflow-y-auto">
            {SENSORY.map(r => (
              <div key={r.id} className="px-5 py-4 border-b border-rule2">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="font-body font-medium text-ink text-body">{r.source}</div>
                    <div className="font-body text-muted text-label">{new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="display-num text-metric text-ok leading-none">{r.overallScore}</div>
                    <div className="font-body text-label text-muted">{r.gradeProjection} · {r.confidence}% conf</div>
                  </div>
                </div>
                {/* Compact compound list — not full cards */}
                <div className="divide-y divide-rule2 border border-rule2">
                  {r.compounds.map((c, i) => {
                    const tc = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
                    const Arrow = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${c.tone !== 'ok' ? 'bg-warn/[0.02]' : ''}`}>
                        <Arrow size={9} strokeWidth={2} className={c.direction === 'down' ? 'text-warn' : c.direction === 'up' ? 'text-ok' : 'text-muted'} />
                        <span className="font-body text-muted text-label flex-1">{c.name}</span>
                        <span className="font-body text-label text-muted">{c.baseline}</span>
                        <span className={`display-num text-sub tabular-nums ${tc}`}>{c.val} <span className="font-body text-label text-muted font-normal">{c.unit}</span></span>
                      </div>
                    )
                  })}
                </div>
                {r.expertAnnotation && (
                  <div className="mt-3 flex items-start gap-3 px-3 py-2.5 border-l-[3px] border-l-signal bg-signal/[0.03]">
                    <span className="font-body font-semibold text-signal text-label flex-shrink-0">{r.expertAnnotation.author}</span>
                    <span className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}


// ─── VARIANT C — Overview cards + clean tabs ──────────────────────────────────
// Replace the SceneHeader with a 4-cell stat briefing grid at the top.
// This frees vertical space and gives a more immediate status read.
// Batch tab: chart and signals cleaned up.
// Quality tab: eliminates sub-tabs — Sensory and Annotations in one scroll.

function VariantC() {
  const [sel, setSel] = useState(BATCH.id)
  const [tab, setTab] = useState('batch')

  const statCells = [
    { label: 'Confidence', value: '82%', sub: 'Rising', tone: 'text-ok' },
    { label: 'Grade projection', value: 'Premium', sub: 'Day 126/185', tone: 'text-signal' },
    { label: 'Signals', value: `${okSignals.length}/${BATCH.signals.length}`, sub: `${warnSignals.length} watch`, tone: warnSignals.length > 0 ? 'text-warn' : 'text-ok' },
    { label: 'Stage', value: 'Primary ferm.', sub: `${pct}% complete`, tone: 'text-muted' },
  ]

  return (
    <div className="flex h-full overflow-hidden">
      <BatchListPanel selected={sel} onSelect={setSel} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Briefing grid — replaces SceneHeader */}
        <div className="flex-shrink-0 border-b border-rule2">
          <div className="px-5 py-3 border-b border-rule2 bg-stone2">
            <div className="font-display font-bold text-ink text-body">{BATCH.name}</div>
            <div className="font-body text-muted text-label">{BATCH.vessel} · {BATCH.zone}</div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-rule2">
            {statCells.map(c => (
              <div key={c.label} className="px-5 py-3">
                <div className="font-body text-label text-muted mb-0.5">{c.label}</div>
                <div className={`display-num text-head font-bold tabular-nums leading-none ${c.tone}`}>{c.value}</div>
                <div className={`font-body text-label mt-0.5 ${warnSignals.length > 0 && c.label === 'Signals' ? 'text-warn' : 'text-muted'}`}>{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-rule2">
            <StageBar />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-rule2 bg-stone2">
          {[{ id: 'batch', label: 'Batch' }, { id: 'quality', label: 'Quality' }].map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 font-body text-label transition-colors border-b-2 ${tab === t.id ? 'text-ink border-b-signal' : 'text-muted border-b-transparent hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'batch' && (
          <div className="flex-1 overflow-y-auto">
            {/* Warning banner if any */}
            {warnSignals.length > 0 && (
              <div className="mx-5 my-4 border border-warn/25 bg-warn/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-body font-semibold text-warn text-body">{warnSignals[0].label} — {warnSignals[0].val} ↓</div>
                    <div className="font-body text-muted text-label mt-0.5">{warnSignals[0].note}</div>
                  </div>
                  <StatusPill tone="warn">Watch</StatusPill>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="px-5 py-3 border-b border-rule2">
              <div className="font-body text-label text-muted mb-2">Confidence trajectory · Day {BATCH.daysElapsed}</div>
              <MiniChart />
            </div>

            {/* Signals as card pills grid */}
            <div className="px-5 py-4 border-b border-rule2">
              <div className="font-body text-label text-muted mb-3">Live signals · {BATCH.signals.length} tracked</div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {BATCH.signals.map((s, i) => <SignalPill key={i} s={s} />)}
              </div>
            </div>

            {/* Quality prediction */}
            <div className="px-5 py-4">
              <div className="font-body text-label text-muted mb-3">Quality prediction</div>
              <div className="space-y-2.5">
                {[
                  { label: 'Aroma', val: BATCH.qualityPrediction.aroma },
                  { label: 'Color', val: BATCH.qualityPrediction.color },
                  { label: 'Umami', val: BATCH.qualityPrediction.taste.umami },
                  { label: 'Salt',  val: BATCH.qualityPrediction.taste.salt },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="font-body text-muted text-label w-14 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-rule2">
                      <div className={`h-full ${val >= 85 ? 'bg-ok' : 'bg-signal'}`} style={{ width: `${val}%` }} />
                    </div>
                    <span className="display-num text-sub text-muted w-6 text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'quality' && (
          <div className="flex-1 overflow-y-auto">
            {/* Sensory + Annotations merged — no sub-tabs */}
            {SENSORY.slice(0, 1).map(r => (
              <div key={r.id} className="px-5 py-4 border-b border-rule2">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="font-body font-medium text-ink text-body">{r.source}</div>
                    <div className="font-body text-muted text-label">{new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="display-num text-metric text-ok leading-none">{r.overallScore}</div>
                    <div className="font-body text-label text-muted">{r.gradeProjection} · {r.confidence}% conf</div>
                  </div>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {r.compounds.map((c, i) => <CompoundCard key={i} c={c} />)}
                </div>
                {r.expertAnnotation && (
                  <div className="mt-3 flex items-start gap-3 px-3 py-2.5 border-l-[3px] border-l-signal bg-signal/[0.03]">
                    <span className="font-body font-semibold text-signal text-label flex-shrink-0">{r.expertAnnotation.author}</span>
                    <span className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</span>
                  </div>
                )}
              </div>
            ))}
            {ANNOTATIONS.map(a => {
              const typeTone = { 'quality-watch': 'warn', 'grade-confirmation': 'ok', 'process-note': 'muted' }[a.type] ?? 'muted'
              const typeLabel = { 'quality-watch': 'Quality watch', 'grade-confirmation': 'Grade confirmed', 'process-note': 'Process note' }[a.type] ?? a.type
              return (
                <div key={a.id} className="px-5 py-4 border-b border-rule2">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="font-body font-bold text-ink text-body">{a.author}</div>
                      <div className="font-body text-muted text-label">{a.authorTitle}</div>
                    </div>
                    <StatusPill tone={typeTone}>{typeLabel}</StatusPill>
                  </div>
                  <p className="font-display text-ink text-sub leading-relaxed">{a.observation}</p>
                  {a.modelResponse && (
                    <div className="mt-3 flex items-start gap-3 px-3 py-2.5 bg-stone2 border-l-[3px] border-l-deep">
                      <span className="font-body font-semibold text-deep text-label flex-shrink-0">Model</span>
                      <span className="font-body text-muted text-body leading-relaxed flex-1">{a.modelResponse}</span>
                      {a.confidenceImpact && <span className="font-body font-bold text-ok text-body flex-shrink-0">{a.confidenceImpact}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}


// ─── VARIANT D — Stage explorer: lifecycle as navigation ──────────────────────
// Eliminate Batch | Quality tabs. Instead, lifecycle stages are clickable.
// Selecting a stage shows: signals relevant to that stage, quality readings
// from that stage, and expert annotations. The data type (signal vs sensory)
// is secondary to the lifecycle position.

function VariantD() {
  const [sel, setSel] = useState(BATCH.id)
  const [activeStage, setActiveStage] = useState('primary')
  const stage = BATCH.stages.find(s => s.id === activeStage) ?? BATCH.stages[2]

  return (
    <div className="flex h-full overflow-hidden">
      <BatchListPanel selected={sel} onSelect={setSel} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-rule2">
          <div className="flex items-center gap-4">
            <div>
              <div className="display-num text-score text-ok leading-none">82%</div>
              <div className="font-body text-label text-muted">Premium projected</div>
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-ink text-body mb-0.5">{BATCH.name}</div>
              <div className="font-body text-muted text-label">{BATCH.vessel} · Day {BATCH.daysElapsed} of {BATCH.totalDays}</div>
            </div>
            {warnSignals.length > 0 && (
              <StatusPill tone="warn">{warnSignals.length} signal{warnSignals.length > 1 ? 's' : ''} watch</StatusPill>
            )}
          </div>
        </div>

        {/* Stage navigator — horizontal, clickable */}
        <div className="flex-shrink-0 border-b border-rule2 bg-stone2 overflow-x-auto">
          <div className="flex items-stretch divide-x divide-rule2">
            {BATCH.stages.map(s => {
              const isActive = activeStage === s.id
              const dotCls = s.status === 'complete' ? 'bg-ok' : s.status === 'active' ? 'bg-signal' : 'bg-rule2'
              return (
                <button key={s.id} type="button" onClick={() => setActiveStage(s.id)}
                  className={`flex flex-col items-start gap-1 px-4 py-2.5 flex-shrink-0 transition-colors text-left border-b-2 ${
                    isActive ? 'bg-stone border-b-signal' : 'hover:bg-stone3/50 border-b-transparent'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
                    <span className={`font-body text-label font-medium ${isActive ? 'text-ink' : s.status === 'pending' ? 'text-muted opacity-40' : 'text-muted'}`}>
                      {s.label}
                    </span>
                  </div>
                  <span className="font-body text-label text-muted opacity-60">{s.days}d</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stage content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              stage.status === 'complete' ? 'bg-ok' : stage.status === 'active' ? 'bg-signal animate-pulse' : 'bg-rule2'
            }`} />
            <span className="font-body font-medium text-ink text-body">{stage.label}</span>
            <StatusPill tone={stage.status === 'complete' ? 'ok' : stage.status === 'active' ? 'signal' : 'muted'}>
              {stage.status === 'complete' ? 'Complete' : stage.status === 'active' ? 'Active' : 'Pending'}
            </StatusPill>
            {stage.status !== 'pending' && (
              <span className="font-body text-label text-muted ml-auto">{stage.days} days</span>
            )}
          </div>

          {stage.status === 'pending' ? (
            <div className="flex items-center justify-center h-32">
              <span className="font-body text-muted text-body">This stage hasn't started yet</span>
            </div>
          ) : (
            <>
              {/* Signals relevant to this stage */}
              <div className="border-b border-rule2">
                <div className="px-5 py-2 bg-stone2 border-b border-rule2">
                  <span className="font-body text-label text-muted">Signals · this stage</span>
                </div>
                {BATCH.signals.map((s, i) => <SignalRow key={i} s={s} />)}
              </div>

              {/* Confidence chart for active stage */}
              {stage.status === 'active' && (
                <div className="px-5 py-4 border-b border-rule2">
                  <div className="font-body text-label text-muted mb-2">Confidence trajectory</div>
                  <MiniChart />
                </div>
              )}

              {/* Sensory for this stage */}
              {SENSORY.slice(0, 1).map(r => (
                <div key={r.id} className="px-5 py-4 border-b border-rule2">
                  <div className="font-body text-label text-muted mb-3">Sensory reading · {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {r.compounds.map((c, i) => <CompoundCard key={i} c={c} />)}
                  </div>
                  {r.expertAnnotation && (
                    <div className="mt-3 flex items-start gap-3 px-3 py-2.5 border-l-[3px] border-l-signal bg-signal/[0.03]">
                      <span className="font-body font-semibold text-signal text-label flex-shrink-0">{r.expertAnnotation.author}</span>
                      <span className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


// ─── Lab shell ────────────────────────────────────────────────────────────────

const VARIANTS = [
  { id: 'A', name: 'Signal-first',   sub: 'No tabs · signals lead · chart + sensory inline below' },
  { id: 'B', name: 'Two-column',     sub: 'Signals left · chart + quality right · compact Quality tab list' },
  { id: 'C', name: 'Overview cards', sub: '4-cell stat grid replaces SceneHeader · no Quality sub-tabs' },
  { id: 'D', name: 'Stage explorer', sub: 'No Batch/Quality tabs · lifecycle stages are the navigation' },
]
const MAP = { A: VariantA, B: VariantB, C: VariantC, D: VariantD }

export default function DesignLabBatches() {
  const [v, setV] = useState('A')
  const V = MAP[v]
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-stretch border-b border-rule2 bg-stone" style={{ height: 44 }}>
        <div className="flex items-center px-5 border-r border-rule2 flex-shrink-0">
          <span className="font-body text-label text-muted">Design Lab · Batches</span>
        </div>
        {VARIANTS.map(variant => (
          <button key={variant.id} type="button" onClick={() => setV(variant.id)}
            className={`flex items-center gap-2 px-5 border-r border-rule2 transition-colors
              ${v === variant.id ? 'bg-stone2 border-b-2 border-b-signal' : 'hover:bg-stone2/50'}`}>
            <span className={`font-body text-label font-bold ${v === variant.id ? 'text-ink' : 'text-muted'}`}>{variant.id}</span>
            <span className={`font-body text-label ${v === variant.id ? 'text-ink' : 'text-muted'}`}>{variant.name}</span>
            <span className="font-body text-label text-muted/50 hidden xl:block">{variant.sub}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center px-5">
          <span className="font-body text-label text-signal">{v} — {VARIANTS.find(x => x.id === v)?.name}</span>
        </div>
      </div>
      <div className="flex-shrink-0 border-b border-rule2 bg-stone2 px-5 py-1.5">
        <span className="font-body text-label text-muted">{VARIANTS.find(x => x.id === v)?.sub}</span>
        <span className="font-body text-label text-muted mx-2">·</span>
        <span className="font-body text-label text-muted">BTH-2026-047 · Day 126/185 · Benzaldehyde watch</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <V key={v} />
      </div>
    </div>
  )
}
