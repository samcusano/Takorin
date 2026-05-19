// Shift 1: Time-native process intelligence
// The batch lifecycle, not the shift, is the atomic unit.

import { useState } from 'react'
import { batches, batchSummary } from '../data/batches'
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Activity, TrendingDown, Minus } from 'lucide-react'
import { sensoryReadings, expertAnnotations, craftPriors, seasonalBaselines } from '../data/quality'
import { compliancePolicies } from '../data/compliance'

const activePolicies = compliancePolicies.filter(p => p.status === 'active' || p.status === 'monitoring')

function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ConfidenceChart({ trajectory, forecast }) {
  const all = [...trajectory, ...forecast.map(p => ({ ...p, predicted: true }))]
  if (all.length < 2) return null
  const vals = all.map(p => p.val)
  const minV = Math.min(...vals) - 5
  const maxV = Math.max(...vals) + 5
  const range = maxV - minV
  const W = 360
  const H = 72
  const pad = 12

  const toX = (i) => pad + (i / (all.length - 1)) * (W - pad * 2)
  const toY = (v) => H - pad - ((v - minV) / range) * (H - pad * 2)

  const trajPts = trajectory.map((p, i) => `${toX(i)},${toY(p.val)}`).join(' ')
  const forecastStart = trajectory.length - 1
  const forecPts = [trajectory[forecastStart], ...forecast]
    .map((p, i) => `${toX(forecastStart + i)},${toY(p.val)}`).join(' ')

  const lastActual = trajectory[trajectory.length - 1]
  const cx = toX(trajectory.length - 1)
  const cy = toY(lastActual.val)

  return (
    <svg width={W} height={H} aria-label="Confidence trajectory">
      {/* Grid lines */}
      {[60, 70, 80, 90].map(v => (
        <line key={v} x1={pad} x2={W - pad} y1={toY(v)} y2={toY(v)}
          stroke="var(--color-rule-2)" strokeWidth={0.5} />
      ))}
      {/* Forecast (dashed) */}
      <polyline points={forecPts} fill="none" stroke="var(--color-ochre)"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      {/* Actual trajectory */}
      <polyline points={trajPts} fill="none" stroke="var(--color-ok)"
        strokeWidth={2} strokeLinecap="round" />
      {/* Current point */}
      <circle cx={cx} cy={cy} r={4} fill="var(--color-ok)" />
      {/* Labels */}
      {[60, 80, 100].map(v => (
        <text key={v} x={3} y={toY(v) + 3} fontSize={8}
          fill="var(--color-ghost)" fontFamily="inherit">{v}%</text>
      ))}
    </svg>
  )
}

function StageTracker({ stages }) {
  const total = stages.length
  return (
    <div className="flex items-center gap-0">
      {stages.map((s, i) => {
        const isDone    = s.status === 'complete'
        const isActive  = s.status === 'active'
        const isPending = s.status === 'pending'
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                isDone   ? 'bg-ok border-ok' :
                isActive ? 'bg-ochre border-ochre' :
                'bg-stone3 border-rule2'
              }`}>
                {isDone && <div className="w-1 h-1 rounded-full bg-stone" />}
                {isActive && <div className="w-1 h-1 rounded-full bg-stone animate-pulse" />}
              </div>
              <div className="font-body text-micro text-muted mt-1 text-center whitespace-nowrap max-w-[64px] truncate leading-tight">
                {s.label}
              </div>
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${isDone ? 'bg-ok' : 'bg-rule2'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SignalRow({ s }) {
  const toneColor = s.tone === 'ok' ? 'text-ok' : s.tone === 'warn' ? 'text-warn' : 'text-danger'
  const arrow = s.trend === 'rising' ? '↑' : s.trend === 'declining' ? '↓' : '→'
  const arrowColor = s.trend === 'rising' ? 'text-ok' : s.trend === 'declining' ? 'text-warn' : 'text-muted'
  return (
    <div className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-body text-muted text-label">{s.label}</span>
          {s.influence === 'critical' && (
            <span className="font-body text-micro text-ochre px-1">critical signal</span>
          )}
        </div>
        {s.note && <div className="font-body text-muted text-label mt-0.5 leading-snug">{s.note}</div>}
      </div>
      <div className="flex items-baseline gap-1.5 flex-shrink-0">
        <span className={`font-body font-medium text-body tabular-nums ${toneColor}`}>{s.val}</span>
        <span className={`font-body text-label ${arrowColor}`}>{arrow}</span>
      </div>
      <div className="flex-shrink-0 w-28">
        <div className="font-body text-muted text-label">{s.baseline}</div>
      </div>
    </div>
  )
}

function InfluenceChain({ chain }) {
  return (
    <div className="space-y-0 divide-y divide-rule2">
      {chain.map((c, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-2.5">
          <div className="flex flex-col items-center flex-shrink-0 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-ochre" />
            {i < chain.length - 1 && <div className="w-px h-6 bg-rule2 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="font-body text-muted text-label mb-0.5">Day {c.day}</div>
            <div className="font-body font-medium text-ink text-label leading-snug">{c.reading}</div>
            <div className="font-body text-muted text-label mt-0.5 leading-snug">→ {c.prediction}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function QualityTab() {
  const [qTab, setQTab] = useState('sensory')
  const QTABS = [
    { id: 'sensory', label: 'Sensory' },
    { id: 'annotations', label: 'Annotations' },
    { id: 'priors', label: 'Craft Priors' },
    { id: 'baselines', label: 'Seasonal Baselines' },
  ]
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-shrink-0 flex border-b border-rule2 bg-stone">
        {QTABS.map(t => (
          <button key={t.id} type="button" onClick={() => setQTab(t.id)}
            className={`font-body text-label px-4 py-2 border-b-2 transition-colors ${
              qTab === t.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-muted hover:text-muted'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {qTab === 'sensory' && (
          <div className="divide-y divide-rule2">
            {sensoryReadings.map(r => {
              const scoreColor = r.overallScore >= 90 ? 'text-ok' : r.overallScore >= 80 ? 'text-ochre' : 'text-warn'
              return (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="font-body font-medium text-ink text-body">{r.batch}</div>
                      <div className="font-body text-muted text-label mt-0.5">{r.source} · {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`display-num text-metric leading-none ${scoreColor}`}>{r.overallScore}</div>
                      <div className="font-body text-muted text-label">{r.gradeProjection} · {r.confidence}% conf</div>
                    </div>
                  </div>
                  <div className="divide-y divide-rule2">
                    {r.compounds.map((c, i) => {
                      const toneColor = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
                      const Arrow = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
                      return (
                        <div key={i} className="flex items-center gap-3 px-4 py-2">
                          <span className="font-body text-muted text-label flex-1 truncate">{c.name}</span>
                          <span className="font-body text-muted text-label">{c.baseline}</span>
                          <Arrow size={9} className={c.direction === 'up' ? 'text-ok' : c.direction === 'down' ? 'text-warn' : 'text-muted'} strokeWidth={2} />
                          <span className={`font-body font-medium text-label tabular-nums ${toneColor} w-20 text-right`}>{c.val} {c.unit}</span>
                        </div>
                      )
                    })}
                  </div>
                  {r.expertAnnotation && (
                    <div className="mt-2 px-3 py-2 bg-ochre/[0.03] border-l-2 border-l-ochre">
                      <span className="font-body text-muted text-label">{r.expertAnnotation.author} · </span>
                      <span className="font-body text-ink text-label leading-snug">{r.expertAnnotation.note}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {qTab === 'annotations' && (
          <div className="divide-y divide-rule2">
            {expertAnnotations.map(a => {
              const typeTone = { 'quality-watch': 'text-warn bg-warn/10 ', 'grade-confirmation': 'text-ok bg-ok/10 ', 'process-note': 'text-muted bg-stone3 border-rule2', 'outcome-validation': 'text-ochre bg-ochre/10 border-ochre/30' }[a.type] ?? 'text-muted bg-stone3 border-rule2'
              const typeLabel = { 'quality-watch': 'Quality watch', 'grade-confirmation': 'Grade confirmation', 'process-note': 'Process note', 'outcome-validation': 'Outcome validation' }[a.type] ?? a.type
              return (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-body font-medium text-ink text-body">{a.author} <span className="text-muted font-normal">· {a.authorTitle}</span></div>
                      <div className="font-body text-muted text-label mt-0.5">Batch: {a.batch}</div>
                    </div>
                    <span className={`font-body text-label px-1.5 py-0.5 flex-shrink-0 ${typeTone}`}>{typeLabel}</span>
                  </div>
                  <p className="font-display text-ink text-body leading-relaxed mb-2">{a.observation}</p>
                  {a.modelResponse && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-stone2">
                      <span className="font-body text-muted text-label flex-shrink-0 mt-0.5">Model</span>
                      <span className="font-body text-muted text-label leading-snug flex-1">{a.modelResponse}</span>
                      {a.confidenceImpact && <span className="font-body text-ok text-label flex-shrink-0 font-medium">{a.confidenceImpact}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {qTab === 'priors' && (
          <div className="divide-y divide-rule2">
            {craftPriors.map(p => (
              <div key={p.id} className={`px-6 py-4 border-l-4 ${p.tone === 'warn' ? 'border-l-warn' : 'border-l-ok'}`}>
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex-1">
                    <div className="font-body text-muted text-label mb-0.5">{p.domain}</div>
                    <div className="font-body font-medium text-ink text-body leading-snug">{p.rule}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`display-num text-title leading-none ${p.confidence >= 90 ? 'text-ok' : p.confidence >= 80 ? 'text-ochre' : 'text-warn'}`}>{p.confidence}%</div>
                    <div className="font-body text-muted text-label">{p.evidenceBatches} batches</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-body text-muted text-label">{p.author}</span>
                  <span className="font-body text-muted">·</span>
                  <span className="font-body text-muted text-label">{p.evidenceYears}</span>
                  <div className={`ml-2 font-body text-label px-1.5 py-0.5 ${p.tone === 'warn' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'}`}>{p.modelStatus.split('—')[0].trim()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {qTab === 'baselines' && (
          <div className="grid grid-cols-2 divide-x divide-y divide-rule2 border-b border-rule2">
            {seasonalBaselines.map((s, i) => (
              <div key={i} className={`px-6 py-5 ${s.tone === 'warn' ? 'bg-warn/[0.02]' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-body font-bold text-ink text-body">{s.season}</div>
                    <div className="font-body text-muted text-label mt-0.5">{s.ambientTempRange} ambient</div>
                  </div>
                  {s.tone === 'warn' ? <AlertTriangle size={13} className="text-warn flex-shrink-0" strokeWidth={2} /> : <CheckCircle size={13} className="text-ok flex-shrink-0" strokeWidth={2} />}
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Fermentation target', val: s.fermentationTempTarget },
                    { label: 'Expected amino N',    val: s.expectedAmino },
                    { label: 'Expected aroma',      val: s.expectedAroma },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div className="font-body text-muted text-label">{label}</div>
                      <div className="font-body text-ink text-label mt-0.5">{val}</div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-rule2">
                    <p className="font-display text-muted text-body leading-relaxed">{s.notes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BatchIntelligence() {
  const [selectedId, setSelectedId] = useState(batches[0].id)
  const [wsTab, setWsTab] = useState('batch')
  const batch = batches.find(b => b.id === selectedId) ?? batches[0]
  const confidence = batch?.confidence?.current ?? null
  const pct = batch?.totalDays ? Math.round((batch.daysElapsed / batch.totalDays) * 100) : 0
  const scoreColor = confidence == null ? 'text-muted' : confidence >= 85 ? 'text-ok' : confidence >= 70 ? 'text-warn' : 'text-danger'
  const gradeColor = batch?.grade === 'Premium' ? 'text-ochre' : 'text-muted'

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left: batch list ────────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-4 py-3 border-b border-rule2 bg-stone2">
          <div className="font-body text-micro text-muted tracking-widest mb-1">Batch queue</div>
          <div className="flex items-center gap-3">
            <span className="font-body text-label text-muted">{batchSummary.active} active</span>
            <span className="font-body text-label text-ok">{batchSummary.complete} complete</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {batches.map(b => {
            const isSelected = b.id === selectedId
            const conf = b.confidence?.current ?? null
            const confColor = conf >= 85 ? 'text-ok' : conf >= 70 ? 'text-warn' : 'text-danger'
            const isComplete = b.stage === 'complete'
            const pctDone = Math.round((b.daysElapsed / b.totalDays) * 100)
            return (
              <button key={b.id} type="button" onClick={() => setSelectedId(b.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors ${
                  isSelected ? 'bg-stone2' : 'hover:bg-stone2/50'
                }`}>
                {conf != null && conf < 75 && (
                  <span className={`inline-flex items-center font-body text-label px-1.5 py-0.5 mb-1.5 ${conf < 60 ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>
                    {conf < 60 ? 'Critical' : 'Watch'}
                  </span>
                )}
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-display font-medium text-ink text-base leading-none truncate">{b.name}</span>
                  <span className={`font-body font-medium text-label tabular-nums flex-shrink-0 ${confColor}`}>{conf}%</span>
                </div>
                <div className="font-body text-muted text-label mb-2">{b.vessel} · {b.daysElapsed}/{b.totalDays}d</div>
                <div className="h-0.5 bg-rule2 mb-1">
                  <div className={`h-full ${isComplete ? 'bg-ok' : 'bg-ochre'} transition-[width]`} style={{ width: `${pctDone}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted text-label">{isComplete ? 'Complete' : b.stage.replace('-', ' ')}</span>
                  <span className={`font-body text-label ${b.grade === 'Premium' ? 'text-ochre' : 'text-muted'}`}>{b.grade}</span>
                </div>
                {b.hasFinding && (
                  <div className="mt-1.5">
                    <span className="font-body text-micro px-1 py-0.5 text-warn bg-warn/[0.04]">Finding</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: batch workspace ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-6 py-4 border-b border-rule2 bg-stone">
          <div>
            <div className="font-body text-muted text-label mb-1">{batch.vessel} · {batch.zone}</div>
            <div className="font-display font-bold text-ink text-title leading-none mb-2">{batch.name}</div>
            <div className="flex items-center gap-3">
              <span className="font-body text-muted text-label">Start: {fmtDate(batch.startDate)}</span>
              <span className="font-body text-muted">·</span>
              {batch.stage === 'complete'
                ? <span className="font-body text-ok text-label">Completed: {fmtDate(batch.completedDate)}</span>
                : <span className="font-body text-muted text-label">Projected: {fmtDate(batch.predictedCompletionDate)}</span>
              }
              <span className="font-body text-muted">·</span>
              <span className="font-body text-muted text-label">{batch.volume}</span>
              <span className="font-body text-muted">·</span>
              {activePolicies.map(p => (
                <span key={p.id} className={`font-body text-label px-1.5 py-0.5 ${p.status === 'active' ? 'text-ok bg-ok/[0.04]' : 'border-rule2 text-muted'}`}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <div className={`display-num text-display leading-none tabular-nums ${scoreColor}`}>{confidence != null ? `${confidence}%` : '—'}</div>
              <div className="font-body text-muted text-label mt-0.5">outcome confidence</div>
            </div>
            <div className="text-right border-l border-rule2 pl-6">
              <div className={`font-display font-bold text-page leading-none ${gradeColor}`}>{batch.grade}</div>
              <div className="font-body text-muted text-label mt-0.5">projected grade</div>
            </div>
          </div>
        </div>

        {/* Lifecycle progress */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-muted text-label">Lifecycle progress</span>
            <span className="font-body text-muted text-label">{batch.daysElapsed} of {batch.totalDays} days · {pct}%</span>
          </div>
          <StageTracker stages={batch.stages} />
        </div>

        {/* Workspace tab bar */}
        <div className="flex-shrink-0 flex border-b border-rule2 bg-stone2">
          {[
            { id: 'batch',   label: 'Batch' },
            { id: 'quality', label: 'Quality' },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setWsTab(t.id)}
              className={`px-5 py-2.5 font-body text-label border-b-2 transition-colors ${
                wsTab === t.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-muted hover:text-muted'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {wsTab === 'quality' && <QualityTab />}

        {wsTab === 'batch' && <div className="flex-1 overflow-y-auto">
          {/* Confidence trajectory */}
          <div className="px-6 py-4 border-b border-rule2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-body text-muted text-label mb-0.5">Confidence trajectory</div>
                <div className="font-body text-muted text-label">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 bg-ok" />actual
                  </span>
                  <span className="ml-3 inline-flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 bg-ochre opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-ochre) 0,var(--color-ochre) 4px,transparent 4px,transparent 7px)' }} />forecast
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-body text-ok text-label">
                <TrendingUp size={11} strokeWidth={2} />
                {batch.confidence?.trend != null ? (batch.confidence.trend !== 'complete' ? `Trending ${batch.confidence.trend}` : 'Complete') : '—'}
              </div>
            </div>
            <ConfidenceChart trajectory={batch.confidence?.trajectory ?? []} forecast={batch.confidence?.forecast ?? []} />
          </div>

          {/* Two columns: signals + quality prediction */}
          <div className="flex border-b border-rule2">

            {/* Signals */}
            <div className="flex-1 border-r border-rule2">
              <div className="px-5 py-2.5 border-b border-rule2 bg-stone2">
                <span className="font-body font-bold text-ink text-label">Live signals</span>
              </div>
              <div className="divide-y divide-rule2">
                {batch.signals.map((s, i) => <SignalRow key={i} s={s} />)}
              </div>
            </div>

            {/* Quality prediction */}
            <div className="w-[280px] flex-shrink-0">
              <div className="px-5 py-2.5 border-b border-rule2 bg-stone2">
                <span className="font-body font-bold text-ink text-label">Quality prediction</span>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <div className="font-body text-muted text-label mb-2">Sensory scores</div>
                  {[
                    { label: 'Aroma',  val: batch.qualityPrediction.aroma },
                    { label: 'Color',  val: batch.qualityPrediction.color },
                    { label: 'Umami',  val: batch.qualityPrediction.taste.umami },
                    { label: 'Salt balance', val: batch.qualityPrediction.taste.salt },
                    { label: 'Sweet',  val: batch.qualityPrediction.taste.sweet },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2 mb-1.5">
                      <span className="font-body text-muted text-label w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-0.5 bg-rule2">
                        <div className={`h-full ${val >= 85 ? 'bg-ok' : val >= 70 ? 'bg-ochre' : 'bg-warn'} transition-[width]`} style={{ width: `${val}%` }} />
                      </div>
                      <span className="font-body text-muted text-label tabular-nums w-7 text-right flex-shrink-0">{val}</span>
                    </div>
                  ))}
                </div>
                {batch.qualityPrediction.riskFactors.length > 0 && (
                  <div>
                    <div className="font-body text-muted text-label mb-2">Risk factors</div>
                    {batch.qualityPrediction.riskFactors.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 font-body text-label text-warn mb-1">
                        <AlertTriangle size={9} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="leading-snug">{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {batch.qualityPrediction.historicalComparables.length > 0 && (
                  <div>
                    <div className="font-body text-muted text-label mb-2">Historical comparables</div>
                    {batch.qualityPrediction.historicalComparables.map((c, i) => (
                      <div key={i} className={`px-3 py-2 mb-1.5 border-l-2 ${c.finalGrade === 'Premium' ? 'border-l-ok' : 'border-l-warn'}`}>
                        <div className="flex items-baseline justify-between">
                          <span className="font-body text-muted text-label">{c.batch}</span>
                          <span className="font-body text-muted text-label">{c.similarity}% match</span>
                        </div>
                        <div className="font-body text-muted text-label mt-0.5">
                          {c.finalGrade} · Aroma {c.aromaScore}
                          {c.divergence && <span className="text-warn ml-1">· {c.divergence}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Environmental influence chain */}
          {batch.influenceChain.length > 0 && (
            <div>
              <div className="px-5 py-2.5 border-b border-rule2 bg-stone2">
                <span className="font-body font-bold text-ink text-label">Environmental influence chain</span>
                <span className="ml-2 font-body text-muted text-label">How early signals predict late outcomes</span>
              </div>
              <InfluenceChain chain={batch.influenceChain} />
            </div>
          )}

          {batch.stage === 'complete' && (
            <div className="flex items-center gap-3 px-6 py-6">
              <CheckCircle size={16} className="text-ok flex-shrink-0" strokeWidth={2} />
              <div>
                <div className="font-body font-semibold text-ink text-base">Batch complete — {batch.grade}</div>
                <div className="font-body text-muted text-label mt-0.5">Added to process memory · Available as comparable for active batches</div>
              </div>
            </div>
          )}
        </div>}
      </div>
      </div>
    </div>
  )
}
