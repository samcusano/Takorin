// Batch Intelligence — DA3: Stage brief document
// Process organizes navigation. Signals organize attention.

import { useState } from 'react'
import { batches } from '../data/batches'
import { recipes } from '../data/equipment'
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, Zap } from 'lucide-react'
import { sensoryReadings, expertAnnotations } from '../data/quality'
import { StatusPill, AnimatedScore, DitherMeter } from '../components/UI'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function postureColor(p) {
  return p >= 85 ? 'text-ok' : p >= 70 ? 'text-warn' : 'text-danger'
}

// ─── Confidence trajectory chart ─────────────────────────────────────────────

function ConfidenceChart({ trajectory, forecast }) {
  const all = [...trajectory, ...forecast.map(p => ({ ...p, predicted: true }))]
  if (all.length < 2) return null
  const vals = all.map(p => p.val)
  const minV = Math.min(...vals) - 5, maxV = Math.max(...vals) + 5, range = maxV - minV
  const W = 480, H = 96, pad = 16
  const toX = i => pad + (i / (all.length - 1)) * (W - pad * 2)
  const toY = v => H - pad - ((v - minV) / range) * (H - pad * 2)
  const trajPts = trajectory.map((p, i) => `${toX(i)},${toY(p.val)}`).join(' ')
  const fs = trajectory.length - 1
  const forePts = [trajectory[fs], ...forecast].map((p, i) => `${toX(fs + i)},${toY(p.val)}`).join(' ')
  const cx = toX(trajectory.length - 1), cy = toY(trajectory[trajectory.length - 1].val)
  const fill = [`${toX(0)},${H - pad}`, ...trajectory.map((p, i) => `${toX(i)},${toY(p.val)}`), `${cx},${H - pad}`].join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-label="Confidence trajectory">
      <defs>
        <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ok)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-ok)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[60, 70, 80, 90].map(v => (
        <line key={v} x1={pad} x2={W - pad} y1={toY(v)} y2={toY(v)} stroke="var(--color-rule-2)" strokeWidth={2} />
      ))}
      <polygon points={fill} fill="url(#trajFill)" />
      <polyline points={forePts} fill="none" stroke="var(--color-signal)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      <polyline points={trajPts} fill="none" stroke="var(--color-ok)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="var(--color-ok)" />
      <circle cx={cx} cy={cy} r={7} fill="var(--color-ok)" opacity={0.2} />
      {[60, 80, 100].map(v => (
        <text key={v} x={4} y={toY(v) + 3} fontSize={8} fill="var(--color-muted)" fontFamily="'IBM Plex Sans'">{v}%</text>
      ))}
    </svg>
  )
}

// ─── Batch list ───────────────────────────────────────────────────────────────

function BatchListCard({ batch: b, selected, onClick }) {
  const conf = b.confidence?.current ?? null
  const confColor = conf >= 85 ? 'text-ok' : conf >= 70 ? 'text-warn' : 'text-danger'
  const pctDone = Math.round((b.daysElapsed / b.totalDays) * 100)
  const isComplete = b.stage === 'complete'
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      {conf != null && conf < 75 && (
        <div className="mb-1.5">
          <StatusPill tone={conf < 60 ? 'danger' : 'warn'}>{conf < 60 ? 'Critical' : 'Watch'}</StatusPill>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <span className="font-body font-medium text-ink text-body leading-snug truncate">{b.name}</span>
        <span className={`display-num text-sub tabular-nums flex-shrink-0 ${confColor}`}>{conf}%</span>
      </div>
      <div className="font-body text-muted text-label mb-2">{b.vessel} · {b.daysElapsed}/{b.totalDays}d</div>
      <div className="h-1 bg-rule2 mb-1.5">
        <DitherMeter value={pctDone} colorClass={isComplete ? 'bg-ok' : 'bg-signal'} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body text-muted text-label">{isComplete ? 'Complete' : b.stage.replace(/-/g, ' ')}</span>
        <span className={`font-body text-label ${b.grade === 'Premium' ? 'text-signal' : 'text-muted'}`}>{b.grade}</span>
      </div>
      {b.hasFinding && <div className="mt-1.5"><StatusPill tone="warn">Finding</StatusPill></div>}
    </button>
  )
}

// ─── Watch signal card ────────────────────────────────────────────────────────

function WatchSignalCard({ signal }) {
  const Arrow = signal.trend === 'declining' ? TrendingDown : signal.trend === 'rising' ? TrendingUp : Minus
  const ac = signal.trend === 'declining' ? 'text-warn' : signal.trend === 'rising' ? 'text-ok' : 'text-muted'
  return (
    <div className="border border-warn/30 bg-warn/[0.03] overflow-hidden">
      <div className="h-[3px] w-full bg-warn" />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} strokeWidth={2} className="text-warn flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-body font-semibold text-ink text-sub">{signal.label}</div>
              <div className="font-body text-label text-muted mt-0.5">
                {signal.influence === 'critical' ? 'Critical influence' : 'High influence'} · flagged for review
              </div>
            </div>
          </div>
          <StatusPill tone="warn">Watch</StatusPill>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="font-body text-label text-muted">Current</div>
            <div className="font-body font-medium text-body text-warn">{signal.val}</div>
          </div>
          <div>
            <div className="font-body text-label text-muted">Baseline</div>
            <div className="font-body font-medium text-body text-ink">{signal.baseline}</div>
          </div>
          <div>
            <div className="font-body text-label text-muted">Trend</div>
            <div className={`flex items-center gap-1 font-body font-medium text-body ${ac}`}>
              <Arrow size={10} strokeWidth={2} />
              {signal.trend}
            </div>
          </div>
        </div>
        {signal.note && (
          <div className="font-body text-label text-warn leading-snug border-t border-warn/20 pt-3">
            {signal.note}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stage health strip ───────────────────────────────────────────────────────

function StageHealthStrip({ batch }) {
  const warnCount  = batch.signals.filter(s => s.tone !== 'ok').length
  const okCount    = batch.signals.filter(s => s.tone === 'ok').length
  const totalSigs  = batch.signals.length
  const qualityTone = warnCount > 0 ? 'text-warn' : 'text-ok'
  const qualityVal  = warnCount > 0 ? 'Watch' : 'Nominal'

  const cells = [
    { label: 'Quality status',    value: qualityVal,                   tone: qualityTone  },
    { label: 'Signals nominal',   value: `${okCount}/${totalSigs}`,    tone: warnCount > 0 ? 'text-warn' : 'text-ok' },
    { label: 'Open deviations',   value: String(warnCount),            tone: warnCount > 0 ? 'text-warn' : 'text-ok' },
    { label: 'Grade projection',  value: batch.qualityPrediction?.grade ?? batch.grade, tone: 'text-signal' },
    { label: 'Confidence',        value: `${batch.confidence?.current ?? '—'}%`, tone: postureColor(batch.confidence?.current ?? 0) },
  ]

  return (
    <div className="flex items-stretch divide-x divide-rule2 border-y border-rule2 bg-stone2/50">
      {cells.map(({ label, value, tone }) => (
        <div key={label} className="flex-1 px-4 py-2.5">
          <div className="font-body text-label text-muted">{label}</div>
          <div className={`font-body text-label font-medium ${tone}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Active stage body ────────────────────────────────────────────────────────

function ActiveStageBody({ batch, stage }) {
  const batchSensory = sensoryReadings.filter(r => r.batch === batch.id)
  const batchAnnotations = expertAnnotations.filter(a => a.batch === batch.id)
  const warnSignals = batch.signals.filter(s => s.tone !== 'ok')
  const okSignals   = batch.signals.filter(s => s.tone === 'ok')

  return (
    <div className="px-6 pb-6 space-y-5">

      {/* ── 2. Active signals — highest priority ─────────────── */}
      {warnSignals.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3 pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse flex-shrink-0" />
            <span className="font-body text-label font-semibold text-warn">
              Active watch · {warnSignals.length} signal{warnSignals.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {warnSignals.map((s, i) => <WatchSignalCard key={i} signal={s} />)}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2">
          <CheckCircle size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
          <span className="font-body text-body text-ok font-medium">All signals nominal — no active watches</span>
        </div>
      )}

      {/* ── 3. Stage health ───────────────────────────────────── */}
      <div>
        <div className="font-body text-label text-muted mb-2">Stage health</div>
        <StageHealthStrip batch={batch} />
      </div>

      {/* ── 4. Evidence & context ─────────────────────────────── */}
      {(batchSensory.length > 0 || batchAnnotations.length > 0) && (
        <div className="space-y-3">
          <div className="font-body text-label text-muted">Evidence & context</div>

          {/* Sensory readings */}
          {batchSensory.map(r => {
            const scoreColor = r.overallScore >= 90 ? 'text-ok' : r.overallScore >= 80 ? 'text-signal' : 'text-warn'
            return (
              <div key={r.id} className="border border-rule2 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-stone2 border-b border-rule2">
                  <div>
                    <div className="font-body font-medium text-ink text-body">{r.source}</div>
                    <div className="font-body text-muted text-label mt-0.5">
                      {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`display-num text-metric leading-none ${scoreColor}`}>
                      <AnimatedScore value={r.overallScore} />
                    </div>
                    <div className="font-body text-muted text-label mt-0.5">{r.gradeProjection} · {r.confidence}% conf</div>
                  </div>
                </div>
                <div className="divide-y divide-rule2">
                  {r.compounds.map((c, i) => {
                    const tc = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
                    const Arrow = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
                    const ac = c.direction === 'up' ? 'text-ok' : c.direction === 'down' ? 'text-warn' : 'text-muted'
                    const isBad = c.tone !== 'ok'
                    return (
                      <div key={i} className={`flex items-center gap-3 px-5 py-2.5 ${isBad ? 'bg-warn/[0.02]' : ''}`}>
                        <Arrow size={9} strokeWidth={2} className={`${ac} flex-shrink-0`} />
                        <span className="font-body text-muted text-label flex-1">{c.name}</span>
                        <span className="font-body text-label text-muted">{c.baseline}</span>
                        <span className={`display-num text-sub tabular-nums font-medium ${tc}`}>
                          {c.val} <span className="font-body text-label text-muted font-normal">{c.unit}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                {r.expertAnnotation && (
                  <div className="p-4 border-t border-rule2">
                    <div className="flex items-start gap-3 border-l-[3px] border-l-signal bg-signal/[0.03] px-3 py-2.5">
                      <Zap size={10} strokeWidth={2} className="text-signal flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-body font-semibold text-signal text-label mb-1">{r.expertAnnotation.author}</div>
                        <p className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Expert annotations */}
          {batchAnnotations.map(a => {
            const typeTone  = { 'quality-watch': 'warn', 'grade-confirmation': 'ok', 'process-note': 'muted', 'outcome-validation': 'signal' }[a.type] ?? 'muted'
            const typeLabel = { 'quality-watch': 'Quality watch', 'grade-confirmation': 'Grade confirmed', 'process-note': 'Process note', 'outcome-validation': 'Outcome validation' }[a.type] ?? a.type
            return (
              <div key={a.id} className="border border-rule2 px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="font-body font-bold text-ink text-body">{a.author}</div>
                    <div className="font-body text-muted text-label">{a.authorTitle}</div>
                  </div>
                  <StatusPill tone={typeTone}>{typeLabel}</StatusPill>
                </div>
                <p className="font-display text-ink text-sub leading-relaxed mb-3">{a.observation}</p>
                {a.modelResponse && (
                  <div className="flex items-start gap-3 px-3 py-2.5 bg-stone2 border-l-[3px] border-l-deep">
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

      {/* ── 5. Trend visualization — explains why the signal exists ─ */}
      {batch.confidence?.trajectory?.length > 0 && (
        <div>
          <div className="font-body text-label text-muted mb-1">Confidence trajectory</div>
          <div className="font-body text-label text-muted mb-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-ok rounded-full" />actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-signal opacity-60" />forecast
            </span>
            {batch.confidence.trend && (
              <span className="flex items-center gap-1 text-ok">
                <TrendingUp size={10} strokeWidth={2} />
                {batch.confidence.trend === 'complete' ? 'Complete' : `Trending ${batch.confidence.trend}`}
              </span>
            )}
          </div>
          <div className="border border-rule2 px-4 py-4">
            <ConfidenceChart
              trajectory={batch.confidence.trajectory}
              forecast={batch.confidence.forecast ?? []}
            />
          </div>
        </div>
      )}

      {/* Quality prediction */}
      {batch.qualityPrediction && (
        <div>
          <div className="font-body text-label text-muted mb-3">Quality prediction</div>
          <div className="border border-rule2 divide-y divide-rule2">
            {[
              { label: 'Aroma',        val: batch.qualityPrediction.aroma },
              { label: 'Color',        val: batch.qualityPrediction.color },
              { label: 'Umami',        val: batch.qualityPrediction.taste.umami },
              { label: 'Salt balance', val: batch.qualityPrediction.taste.salt },
              { label: 'Sweet',        val: batch.qualityPrediction.taste.sweet },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-2.5">
                <span className="font-body text-muted text-label w-24 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-rule2">
                  <DitherMeter value={val} colorClass={val >= 85 ? 'bg-ok' : val >= 70 ? 'bg-signal' : 'bg-warn'} />
                </div>
                <span className="display-num text-sub tabular-nums w-7 text-right text-muted flex-shrink-0">{val}</span>
              </div>
            ))}
          </div>
          {batch.qualityPrediction.riskFactors?.length > 0 && (
            <div className="mt-3 space-y-1">
              {batch.qualityPrediction.riskFactors.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 font-body text-label text-warn">
                  <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="leading-snug">{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active recipe — process specification for this batch */}
      {batch.activeRecipe && recipes[batch.activeRecipe] && (() => {
        const recipe = recipes[batch.activeRecipe]
        return (
          <div>
            <div className="font-body text-label text-muted mb-2">
              Active recipe · {recipe.name} · v{recipe.version}
            </div>
            <div className="border border-rule2 overflow-hidden">
              <div className="grid grid-cols-4 bg-stone2 border-b border-rule2">
                {['Parameter', 'LCL', 'Target', 'UCL'].map(h => (
                  <div key={h} className="px-4 py-2 font-body text-muted text-label">{h}</div>
                ))}
              </div>
              {recipe.parameters.map(p => {
                // Cross-reference with active signals to highlight deviations
                const sig = batch.signals?.find(s =>
                  s.label.toLowerCase().includes(p.name.toLowerCase())
                )
                const isWatch = sig?.tone === 'warn' || sig?.tone === 'danger'
                return (
                  <div key={p.name}
                    className={`grid grid-cols-4 border-b border-rule2 last:border-0 ${isWatch ? 'bg-warn/[0.02]' : ''}`}>
                    <div className="px-4 py-2.5 font-body text-label flex items-center gap-2">
                      <span className={isWatch ? 'text-warn font-medium' : 'text-ink'}>{p.name}</span>
                      {isWatch && <AlertTriangle size={9} strokeWidth={2} className="text-warn flex-shrink-0" />}
                    </div>
                    <div className="px-4 py-2.5 font-body text-muted text-label tabular-nums">{p.lcl}{p.unit}</div>
                    <div className="px-4 py-2.5 font-body font-medium text-ink text-label tabular-nums">{p.target}{p.unit}</div>
                    <div className="px-4 py-2.5 font-body text-muted text-label tabular-nums">{p.ucl}{p.unit}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Nominal signals — tertiary */}
      {okSignals.length > 0 && (
        <div>
          <div className="font-body text-label text-muted mb-2">Nominal signals · {okSignals.length}</div>
          <div className="border border-rule2 divide-y divide-rule2">
            {okSignals.map((s, i) => {
              const Arrow = s.trend === 'rising' ? TrendingUp : s.trend === 'declining' ? TrendingDown : Minus
              const ac = s.trend === 'rising' ? 'text-ok' : s.trend === 'declining' ? 'text-warn' : 'text-muted'
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <CheckCircle size={9} strokeWidth={2} className="text-ok flex-shrink-0" />
                  <span className="font-body text-muted text-label flex-1">{s.label}</span>
                  <span className="font-body text-label text-muted">{s.baseline}</span>
                  <span className="display-num text-sub tabular-nums text-ok">{s.val}</span>
                  <Arrow size={9} strokeWidth={2} className={`flex-shrink-0 ${ac}`} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Environmental influence chain */}
      {batch.influenceChain?.length > 0 && (
        <div>
          <div className="font-body text-label text-muted mb-3">
            Environmental influence chain
            <span className="ml-2 font-normal opacity-60">How early signals predict late outcomes</span>
          </div>
          <div className="border border-rule2 divide-y divide-rule2">
            {batch.influenceChain.map((c, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex-shrink-0 w-10 text-right pt-0.5">
                  <div className="display-num text-head leading-none text-muted tabular-nums">{c.day}</div>
                  <div className="font-body text-label text-muted opacity-50">day</div>
                </div>
                <div className="w-px self-stretch bg-rule2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-ink text-body leading-snug">{c.reading}</div>
                  <div className="flex items-start gap-1.5 mt-1">
                    <span className="font-body text-muted text-label flex-shrink-0">→</span>
                    <span className="font-body text-muted text-label leading-snug">{c.prediction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Complete stage body ──────────────────────────────────────────────────────

function CompleteStageBody({ stage }) {
  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
        <span className="font-body text-label text-muted">
          Stage completed
          {stage.completedOn ? ` · ${fmtDate(stage.completedOn)}` : ''}
          {' '}· no deviations recorded
        </span>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BatchIntelligence() {
  const [selectedId, setSelectedId] = useState(batches[0].id)
  const [expandedStageId, setExpandedStageId] = useState(null) // null = auto-open active stage

  const batch = batches.find(b => b.id === selectedId) ?? batches[0]
  const activeStage = batch.stages.find(s => s.status === 'active')
  const resolvedExpandedId = expandedStageId ?? activeStage?.id

  const warnCount = batch.signals?.filter(s => s.tone !== 'ok').length ?? 0
  const pct = batch.totalDays ? Math.round((batch.daysElapsed / batch.totalDays) * 100) : 0
  const confTone = (batch.confidence?.current ?? 0) >= 85 ? 'ok' : (batch.confidence?.current ?? 0) >= 70 ? 'warn' : 'danger'
  const confColor = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' }[confTone]

  const handleSelectBatch = (id) => {
    setSelectedId(id)
    setExpandedStageId(null) // reset to active stage
  }

  const handleToggleStage = (stageId, status) => {
    if (status === 'pending') return
    setExpandedStageId(prev => {
      // If already expanded, collapse back to active stage default
      if (prev === stageId) return null
      // If same as active stage and null was the state, collapse
      if (prev === null && stageId === activeStage?.id) return '__none__'
      return stageId
    })
  }

  return (
    <div className="flex h-full overflow-hidden content-reveal">
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: batch list ──────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
          <div className="flex-1 overflow-y-auto divide-y divide-rule2">
            {batches.map(b => (
              <BatchListCard key={b.id} batch={b}
                selected={selectedId === b.id}
                onClick={() => handleSelectBatch(b.id)} />
            ))}
          </div>
        </div>

        {/* ── Right: stage document ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Batch identity + stage progress */}
          <div className="flex-shrink-0 border-b border-rule2 bg-stone2">
            <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-3">
              <div>
                <div className="font-body text-label text-muted mb-1">{batch.vessel} · {batch.zone}</div>
                <div className="font-display font-bold text-ink text-head leading-none">{batch.name}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="font-body text-muted text-label">Day {batch.daysElapsed} of {batch.totalDays} · {pct}%</span>
                  <span className="font-body text-muted text-label">{batch.volume}</span>
                  {warnCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse flex-shrink-0" />
                      <span className="font-body text-label text-warn font-medium">
                        {warnCount} watch signal{warnCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`display-num text-score leading-none tabular-nums ${confColor}`}>
                  <AnimatedScore value={batch.confidence?.current ?? 0} />
                </div>
                <div className="font-body text-label text-muted mt-0.5">{batch.grade} projected</div>
                {batch.confidence?.trend && batch.confidence.trend !== 'complete' && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <TrendingUp size={9} strokeWidth={2} className="text-ok" />
                    <span className="font-body text-label text-ok capitalize">Trending {batch.confidence.trend}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage progress bar */}
            <div className="px-6 pb-3">
              <div className="flex gap-px">
                {batch.stages.map(s => (
                  <div key={s.id} className={`flex-1 h-1 ${
                    s.status === 'complete' ? 'bg-ok' : s.status === 'active' ? 'bg-signal' : 'bg-rule2'
                  }`} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Stage sections — process as document ─────────────── */}
          <div className="flex-1 overflow-y-auto">
            {batch.stages.map((stage, i) => {
              const isExpanded = resolvedExpandedId === stage.id && expandedStageId !== '__none__'
              const isActive   = stage.status === 'active'
              const isComplete = stage.status === 'complete'
              const isPending  = stage.status === 'pending'
              const isLast     = i === batch.stages.length - 1

              return (
                <div key={stage.id} className={`border-b border-rule2 ${isActive ? 'bg-stone' : ''}`}>
                  {/* Stage header row */}
                  <button type="button"
                    onClick={() => handleToggleStage(stage.id, stage.status)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors
                      ${isPending ? 'opacity-40 cursor-default' : 'hover:bg-stone2/40 cursor-pointer'}`}>

                    {/* Status indicator */}
                    {isComplete
                      ? <CheckCircle size={14} strokeWidth={2} className="text-ok flex-shrink-0" />
                      : isActive
                        ? <div className="w-3.5 h-3.5 rounded-full bg-signal flex-shrink-0 border-2 border-signal/30" />
                        : <div className="w-3.5 h-3.5 rounded-full bg-rule2 flex-shrink-0" />
                    }

                    {/* Stage name */}
                    <span className={`font-body font-semibold text-body flex-1 ${
                      isActive ? 'text-ink' : isComplete ? 'text-muted' : 'text-muted opacity-40'
                    }`}>
                      {stage.label}
                    </span>

                    {/* Status pills */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive && warnCount > 0 && <StatusPill tone="warn">{warnCount} watch</StatusPill>}
                      {isActive && <StatusPill tone="signal">Active</StatusPill>}
                      {isComplete && <span className="font-body text-label text-ok">Complete</span>}
                      {!isPending && (
                        <ChevronDown size={11} strokeWidth={2} className={`text-muted transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </button>

                  {/* Stage body */}
                  {isExpanded && isActive  && <ActiveStageBody batch={batch} stage={stage} />}
                  {isExpanded && isComplete && <CompleteStageBody stage={stage} />}
                </div>
              )
            })}

            {/* Batch complete footer */}
            {batch.stage === 'complete' && (
              <div className="flex items-center gap-3 px-6 py-6">
                <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
                <div>
                  <div className="font-body font-semibold text-ink text-sub">Batch complete — {batch.grade}</div>
                  <div className="font-body text-muted text-label mt-0.5">
                    Added to process memory · Available as comparable for active batches
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
