// Shift 1: Time-native process intelligence
// The batch lifecycle, not the shift, is the atomic unit.

import { useState } from 'react'
import { batches, batchSummary } from '../data/batches'
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { sensoryReadings, expertAnnotations, craftPriors, seasonalBaselines } from '../data/quality'
import { compliancePolicies } from '../data/compliance'
import { Tabs, SectionHeader, StatusPill, SceneHeader, toneColor } from '../components/UI'

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
  const W = 480
  const H = 96
  const pad = 16

  const toX = (i) => pad + (i / (all.length - 1)) * (W - pad * 2)
  const toY = (v) => H - pad - ((v - minV) / range) * (H - pad * 2)

  const trajPts = trajectory.map((p, i) => `${toX(i)},${toY(p.val)}`).join(' ')
  const forecastStart = trajectory.length - 1
  const forecPts = [trajectory[forecastStart], ...forecast]
    .map((p, i) => `${toX(forecastStart + i)},${toY(p.val)}`).join(' ')

  const lastActual = trajectory[trajectory.length - 1]
  const cx = toX(trajectory.length - 1)
  const cy = toY(lastActual.val)

  // Area fill under actual trajectory
  const fillPts = [
    `${toX(0)},${H - pad}`,
    ...trajectory.map((p, i) => `${toX(i)},${toY(p.val)}`),
    `${cx},${H - pad}`,
  ].join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      aria-label="Confidence trajectory">
      <defs>
        <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ok)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-ok)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[60, 70, 80, 90].map(v => (
        <line key={v} x1={pad} x2={W - pad} y1={toY(v)} y2={toY(v)}
          stroke="var(--color-rule-2)" strokeWidth={0.5} />
      ))}
      {/* Area fill */}
      <polygon points={fillPts} fill="url(#trajFill)" />
      {/* Forecast (dashed) */}
      <polyline points={forecPts} fill="none" stroke="var(--color-ochre)"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      {/* Actual trajectory */}
      <polyline points={trajPts} fill="none" stroke="var(--color-ok)"
        strokeWidth={2} strokeLinecap="round" />
      {/* Current point */}
      <circle cx={cx} cy={cy} r={4} fill="var(--color-ok)" />
      <circle cx={cx} cy={cy} r={7} fill="var(--color-ok)" opacity={0.2} />
      {/* Labels */}
      {[60, 80, 100].map(v => (
        <text key={v} x={4} y={toY(v) + 3} fontSize={8}
          fill="var(--color-dim, #4A5D74)" fontFamily="'IBM Plex Sans'">{v}%</text>
      ))}
    </svg>
  )
}

function StageTracker({ stages }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-px">
        {stages.map(s => {
          const isDone   = s.status === 'complete'
          const isActive = s.status === 'active'
          return (
            <div key={s.id} className={`flex-1 h-1.5 transition-colors ${
              isDone ? 'bg-ok' : isActive ? 'bg-ochre' : 'bg-rule2'
            }`} />
          )
        })}
      </div>
      <div className="flex gap-px">
        {stages.map(s => {
          const isDone   = s.status === 'complete'
          const isActive = s.status === 'active'
          return (
            <div key={s.id} className="flex-1 min-w-0">
              <div className={`font-body text-micro truncate leading-tight ${
                isActive ? 'text-ochre font-medium' : isDone ? 'text-muted' : 'text-muted opacity-40'
              }`}>{s.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignalRow({ s }) {
  const tc = s.tone === 'ok' ? 'text-ok' : s.tone === 'warn' ? 'text-warn' : 'text-danger'
  const arrow = s.trend === 'rising' ? '↑' : s.trend === 'declining' ? '↓' : '→'
  const arrowColor = s.trend === 'rising' ? 'text-ok' : s.trend === 'declining' ? 'text-warn' : 'text-muted'
  const isCritical = s.influence === 'critical'
  return (
    <div className={`flex items-center gap-4 px-5 py-3 border-b border-rule2 last:border-b-0 ${isCritical ? 'border-l-2 border-l-ochre' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-body">{s.label}</span>
          {isCritical && <span className="font-body text-micro text-ochre">critical</span>}
        </div>
        {s.note && <div className="font-body text-muted text-label mt-0.5 leading-snug">{s.note}</div>}
      </div>
      <div className="font-body text-muted text-label flex-shrink-0 w-28 text-right">{s.baseline}</div>
      <div className="flex items-baseline gap-1.5 flex-shrink-0">
        <span className={`display-num text-head tabular-nums ${tc}`}>{s.val}</span>
        <span className={`font-body text-body ${arrowColor}`}>{arrow}</span>
      </div>
    </div>
  )
}

function InfluenceChain({ chain }) {
  return (
    <div className="divide-y divide-rule2">
      {chain.map((c, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-3.5">
          <div className="flex-shrink-0 w-10 text-right pt-0.5">
            <div className="display-num text-head leading-none text-muted tabular-nums">{c.day}</div>
            <div className="font-body text-micro text-muted opacity-50 mt-0.5">day</div>
          </div>
          <div className="w-px self-stretch bg-rule2 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-body font-medium text-ink text-body leading-snug">{c.reading}</div>
            <div className="flex items-start gap-1.5 mt-1.5">
              <span className="font-body text-muted text-label flex-shrink-0">→</span>
              <span className="font-body text-muted text-label leading-snug">{c.prediction}</span>
            </div>
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
      <Tabs tabs={QTABS} active={qTab} onChange={setQTab} />
      <div className="flex-1 overflow-y-auto">
        {qTab === 'sensory' && (
          <div className="divide-y divide-rule2">
            {sensoryReadings.map(r => {
              const scoreColor = r.overallScore >= 90 ? 'text-ok' : r.overallScore >= 80 ? 'text-ochre' : 'text-warn'
              const scoreToneKey = r.overallScore >= 90 ? 'ok' : r.overallScore >= 80 ? 'ochre' : 'warn'
              return (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="font-body font-bold text-ink text-body">{r.batch}</div>
                      <div className="font-body text-muted text-label mt-0.5">{r.source} · {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`display-num text-metric leading-none ${scoreColor}`}>{r.overallScore}</div>
                      <div className="font-body text-muted text-label mt-0.5">{r.gradeProjection} · {r.confidence}% conf</div>
                    </div>
                  </div>
                  <div className="divide-y divide-rule2">
                    {r.compounds.map((c, i) => {
                      const tc = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
                      const Arrow = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
                      const arrowColor = c.direction === 'up' ? 'text-ok' : c.direction === 'down' ? 'text-warn' : 'text-muted'
                      return (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="font-body text-ink text-label flex-1 truncate">{c.name}</span>
                          <span className="font-body text-muted text-micro">{c.baseline}</span>
                          <Arrow size={10} className={arrowColor} strokeWidth={2} />
                          <span className={`display-num text-base tabular-nums ${tc} w-24 text-right`}>{c.val} {c.unit}</span>
                        </div>
                      )
                    })}
                  </div>
                  {r.expertAnnotation && (
                    <div className="mt-3 flex items-start gap-3 px-3 py-2.5 border-l-2 border-l-ochre bg-ochre/[0.03]">
                      <span className="font-body font-semibold text-ochre text-micro flex-shrink-0 mt-px">{r.expertAnnotation.author}</span>
                      <span className="font-body text-ink text-body leading-relaxed">{r.expertAnnotation.note}</span>
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
              const typeTone = { 'quality-watch': 'warn', 'grade-confirmation': 'ok', 'process-note': 'muted', 'outcome-validation': 'ochre' }[a.type] ?? 'muted'
              const typeLabel = { 'quality-watch': 'Quality watch', 'grade-confirmation': 'Grade confirmed', 'process-note': 'Process note', 'outcome-validation': 'Outcome validation' }[a.type] ?? a.type
              return (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="font-body font-bold text-ink text-body">{a.author} <span className="font-normal text-muted">· {a.authorTitle}</span></div>
                      <div className="font-body text-muted text-label mt-0.5">Batch: {a.batch}</div>
                    </div>
                    <StatusPill tone={typeTone} className="flex-shrink-0">{typeLabel}</StatusPill>
                  </div>
                  <p className="font-display text-ink text-base leading-relaxed mb-3">{a.observation}</p>
                  {a.modelResponse && (
                    <div className="flex items-start gap-3 px-3 py-2.5 bg-stone2 border-l-2 border-l-deep">
                      <span className="font-body font-semibold text-deep text-micro flex-shrink-0 mt-px">Model</span>
                      <span className="font-body text-muted text-body leading-relaxed flex-1">{a.modelResponse}</span>
                      {a.confidenceImpact && <span className="font-body font-bold text-ok text-body flex-shrink-0">{a.confidenceImpact}</span>}
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
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="font-body text-muted text-micro mb-1">{p.domain}</div>
                    <div className="font-body font-medium text-ink text-body leading-snug">{p.rule}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`display-num text-title leading-none ${p.confidence >= 90 ? 'text-ok' : p.confidence >= 80 ? 'text-ochre' : 'text-warn'}`}>{p.confidence}%</div>
                    <div className="font-body text-muted text-micro mt-0.5">{p.evidenceBatches} batches</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="font-body text-muted text-label">{p.author}</span>
                  <span className="text-muted">·</span>
                  <span className="font-body text-muted text-label">{p.evidenceYears}</span>
                  <StatusPill tone={p.tone === 'warn' ? 'warn' : 'ok'} className="ml-1">{p.modelStatus.split('—')[0].trim()}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        )}
        {qTab === 'baselines' && (
          <div className="grid grid-cols-2 divide-x divide-y divide-rule2 border-b border-rule2">
            {seasonalBaselines.map((s, i) => (
              <div key={i} className={`px-6 py-5 ${s.tone === 'warn' ? 'bg-warn/[0.02]' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <div className="font-body font-bold text-ink text-base">{s.season}</div>
                    <div className="font-body text-muted text-micro mt-1">{s.ambientTempRange} ambient</div>
                  </div>
                  <StatusPill tone={s.tone === 'warn' ? 'warn' : 'ok'}>
                    {s.tone === 'warn' ? 'Watch' : 'Nominal'}
                  </StatusPill>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Fermentation target', val: s.fermentationTempTarget },
                    { label: 'Expected amino N',    val: s.expectedAmino },
                    { label: 'Expected aroma',      val: s.expectedAroma },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div className="font-body text-muted text-micro">{label}</div>
                      <div className="font-body font-medium text-ink text-body mt-0.5">{val}</div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-rule2">
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
  const scoreTone = confidence == null ? 'muted' : confidence >= 85 ? 'ok' : confidence >= 70 ? 'warn' : 'danger'
  const scoreColor = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger', muted: 'text-muted' }[scoreTone]
  const trendLabel = batch.confidence?.trend === 'complete' ? 'Complete' : batch.confidence?.trend ? `Trending ${batch.confidence.trend}` : '—'
  const warningSignal = batch.signals?.find(s => s.tone !== 'ok')
  const statement = batch.stage === 'complete'
    ? `Completed ${fmtDate(batch.completedDate)} · ${batch.grade} grade · ${batch.volume}`
    : `${batch.stage.replace(/-/g, ' ')} · Day ${batch.daysElapsed} of ${batch.totalDays} · ${warningSignal ? warningSignal.label + ' needs attention' : 'All signals nominal'}`

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left: batch list ────────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {batches.map(b => {
            const isSelected = b.id === selectedId
            const conf = b.confidence?.current ?? null
            const confTone = conf >= 85 ? 'ok' : conf >= 70 ? 'warn' : 'danger'
            const confColor = conf >= 85 ? 'text-ok' : conf >= 70 ? 'text-warn' : 'text-danger'
            const isComplete = b.stage === 'complete'
            const pctDone = Math.round((b.daysElapsed / b.totalDays) * 100)
            return (
              <button key={b.id} type="button" onClick={() => setSelectedId(b.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors ${
                  isSelected ? 'bg-stone2' : 'hover:bg-stone2/50'
                }`}>
                {conf != null && conf < 75 && (
                  <div className="mb-1.5">
                    <StatusPill tone={conf < 60 ? 'danger' : 'warn'}>
                      {conf < 60 ? 'Critical' : 'Watch'}
                    </StatusPill>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="font-body font-medium text-ink text-body leading-snug truncate">{b.name}</span>
                  <span className={`display-num text-base tabular-nums flex-shrink-0 ${confColor}`}>{conf}%</span>
                </div>
                <div className="font-body text-muted text-micro mb-2">{b.vessel} · {b.daysElapsed}/{b.totalDays}d</div>
                <div className="h-1 bg-rule2 mb-1.5">
                  <div className={`h-full ${isComplete ? 'bg-ok' : 'bg-ochre'} transition-[width]`} style={{ width: `${pctDone}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted text-micro">{isComplete ? 'Complete' : b.stage.replace(/-/g, ' ')}</span>
                  <span className={`font-body text-micro ${b.grade === 'Premium' ? 'text-ochre' : 'text-muted'}`}>{b.grade}</span>
                </div>
                {b.hasFinding && (
                  <div className="mt-1.5">
                    <StatusPill tone="warn">Finding</StatusPill>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: batch workspace ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header — SceneHeader with tone-based atmospheric glow */}
        <SceneHeader
          module="BATCH"
          context={`${batch.vessel} · ${batch.zone}`}
          metric={confidence}
          metricLabel={`${batch.grade} grade projected`}
          metricColor={toneColor(scoreTone)}
          statement={statement}
          tone={scoreTone}
          meta={[
            { label: 'Start', value: fmtDate(batch.startDate) },
            { label: batch.stage === 'complete' ? 'Completed' : 'Projected', value: fmtDate(batch.stage === 'complete' ? batch.completedDate : batch.predictedCompletionDate) },
            { label: 'Volume', value: batch.volume },
          ]}
        >
          {activePolicies.map(p => (
            <StatusPill key={p.id} tone={p.status === 'active' ? 'ok' : 'muted'}>{p.name}</StatusPill>
          ))}
        </SceneHeader>

        {/* Lifecycle progress */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-rule2 bg-stone2">
          <SectionHeader
            title="Lifecycle"
            badge={<span className="font-body text-muted text-label">{batch.daysElapsed} of {batch.totalDays} days · {pct}%</span>}
            className="px-0 py-0 border-0 mb-3"
          />
          <StageTracker stages={batch.stages} />
        </div>

        {/* Workspace tab bar */}
        <Tabs
          tabs={[{ id: 'batch', label: 'Batch' }, { id: 'quality', label: 'Quality' }]}
          active={wsTab}
          onChange={setWsTab}
        />

        {wsTab === 'quality' && <QualityTab />}

        {wsTab === 'batch' && <div className="flex-1 overflow-y-auto">
          {/* Confidence trajectory */}
          <div className="border-b border-rule2">
            <SectionHeader
              title="Confidence trajectory"
              badge={
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-body text-muted text-label">
                    <span className="inline-block w-5 h-0.5 bg-ok rounded-full" />actual
                  </span>
                  <span className="flex items-center gap-1.5 font-body text-muted text-label">
                    <span className="inline-block w-5 h-0.5 bg-ochre opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg,var(--color-ochre) 0,var(--color-ochre) 4px,transparent 4px,transparent 7px)' }} />forecast
                  </span>
                  <span className="flex items-center gap-1 font-body text-label" style={{ color: 'var(--color-ok)' }}>
                    <TrendingUp size={10} strokeWidth={2} />{trendLabel}
                  </span>
                </div>
              }
            />
            <div className="px-6 py-4">
              <ConfidenceChart trajectory={batch.confidence?.trajectory ?? []} forecast={batch.confidence?.forecast ?? []} />
            </div>
          </div>

          {/* Two columns: signals + quality prediction */}
          <div className="flex border-b border-rule2">

            {/* Signals */}
            <div className="flex-1 border-r border-rule2">
              <SectionHeader title="Live signals" />
              <div className="divide-y divide-rule2">
                {batch.signals.map((s, i) => <SignalRow key={i} s={s} />)}
              </div>
            </div>

            {/* Quality prediction */}
            <div className="w-[280px] flex-shrink-0">
              <SectionHeader title="Quality prediction" />
              <div className="px-5 py-4 space-y-4">
                <div>
                  <div className="font-body text-muted text-label mb-2.5">Sensory scores</div>
                  {[
                    { label: 'Aroma',  val: batch.qualityPrediction.aroma },
                    { label: 'Color',  val: batch.qualityPrediction.color },
                    { label: 'Umami',  val: batch.qualityPrediction.taste.umami },
                    { label: 'Salt balance', val: batch.qualityPrediction.taste.salt },
                    { label: 'Sweet',  val: batch.qualityPrediction.taste.sweet },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2 mb-2">
                      <span className="font-body text-muted text-label w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 bg-rule2">
                        <div className={`h-full ${val >= 85 ? 'bg-ok' : val >= 70 ? 'bg-ochre' : 'bg-warn'} transition-[width]`} style={{ width: `${val}%` }} />
                      </div>
                      <span className="display-num text-base tabular-nums w-7 text-right flex-shrink-0 text-muted">{val}</span>
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
              <SectionHeader
                title="Environmental influence chain"
                badge={<span className="font-body text-muted text-label">How early signals predict late outcomes</span>}
              />
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
