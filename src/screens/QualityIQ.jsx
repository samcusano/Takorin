import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  lineQuality, inspectionAccuracy, defectEvents,
  novelEvents, autoCAPAConfig, defectTypes,
} from '../data/qualityiq'
import {
  ArrowRight, Brain, Clock, Zap,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import {
  StatusPill, AnimatedScore, ExpandableSection, StatGrid,
  FilterDropdown, Tabs, SectionHeader,
} from '../components/UI'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function rateColor(rate, threshold) {
  const pct = rate / threshold
  if (pct >= 0.8) return 'text-danger'
  if (pct >= 0.5) return 'text-warn'
  return 'text-ok'
}

function rateDot(rate, threshold) {
  const pct = rate / threshold
  if (pct >= 0.8) return 'bg-danger'
  if (pct >= 0.5) return 'bg-warn'
  return 'bg-ok'
}

function TrendIcon({ trend }) {
  if (trend === 'rising')  return <TrendingUp  size={10} strokeWidth={2} className="text-danger flex-shrink-0" />
  if (trend === 'falling') return <TrendingDown size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
  return <Minus size={10} strokeWidth={2} className="text-muted flex-shrink-0" />
}

// Narrative interpretation block — "statement leads, data confirms"
function Narrative({ tone = 'muted', children }) {
  const border = { ok: 'border-l-ok', warn: 'border-l-warn', danger: 'border-l-danger', muted: 'border-l-rule2' }[tone]
  const bg = { ok: 'bg-ok/[0.03]', warn: 'bg-warn/[0.03]', danger: 'bg-danger/[0.02]', muted: '' }[tone]
  return (
    <div className={`px-5 py-3 border-l-[3px] ${border} ${bg}`}>
      <p className="font-display text-ink text-body leading-relaxed">{children}</p>
    </div>
  )
}

const STATUS_ORDER = { alert: 0, watch: 1, ok: 2 }

function aiConfidenceFor(line) {
  return inspectionAccuracy.skuAccuracy.find(s => s.sku === line.sku)?.accuracy ?? null
}

function novelPendingFor(lineId) {
  return novelEvents.filter(e => e.lineId === lineId && e.status === 'pending').length
}

// ─── Left rail — status monitor ────────────────────────────────────────────

function MonitorCard({ line, selected, onClick }) {
  const statusDot = rateDot(line.defectRate, line.threshold)
  const statusText = rateColor(line.defectRate, line.threshold)
  const pct = Math.min(100, (line.defectRate / line.threshold) * 100)
  const aiConf = aiConfidenceFor(line)
  const novelCount = novelPendingFor(line.id)
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 transition-colors ${selected ? 'bg-stone3' : 'hover:bg-stone3/40'}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
          <span className="font-body font-semibold text-ink text-body">{line.name}</span>
        </div>
        <span className={`display-num font-bold tabular-nums text-sub leading-none ${statusText}`}>{line.defectRate.toFixed(2)}%</span>
      </div>
      <div className="font-body text-label text-muted mb-2">{line.sku}</div>
      <div className="flex items-center gap-3 font-body text-label mb-2">
        <span className="text-muted">AI conf <span className="text-ink font-medium tabular-nums">{aiConf}%</span></span>
        {novelCount > 0 && (
          <span className="flex items-center gap-1.5 text-danger font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" /> {novelCount} novel
          </span>
        )}
      </div>
      <div className="h-1 bg-rule2 overflow-hidden">
        <div className={`h-full ${statusDot}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

// Mobile-only compact line picker — horizontal scrollable strip above the tabs
function MobileLinePicker({ lines, selectedId, onSelect }) {
  return (
    <div className="md:hidden flex-shrink-0 overflow-x-auto border-b border-rule2 bg-stone2">
      <div className="flex">
        {lines.map(line => {
          const dot = rateDot(line.defectRate, line.threshold)
          const text = rateColor(line.defectRate, line.threshold)
          const selected = line.id === selectedId
          return (
            <button key={line.id} type="button" onClick={() => onSelect(line.id)}
              className={`flex-shrink-0 px-4 py-2.5 border-r border-rule2 border-b-2 text-left transition-colors ${
                selected ? 'bg-stone3 border-b-signal' : 'border-b-transparent hover:bg-stone3/40'
              }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                <span className="font-body font-semibold text-ink text-label whitespace-nowrap">{line.name}</span>
              </div>
              <div className={`display-num text-sub font-bold tabular-nums leading-none ${text}`}>{line.defectRate.toFixed(2)}%</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonitorRail({ selectedId, onSelect, lines }) {
  const totalNovel = novelEvents.filter(e => e.status === 'pending').length
  return (
    <div className="hidden md:flex w-[260px] flex-shrink-0 border-r border-rule2 flex-col overflow-y-auto bg-stone2">
      {lines.map(line => (
        <MonitorCard key={line.id} line={line} selected={selectedId === line.id} onClick={() => onSelect(line.id)} />
      ))}
      <div className="mt-auto px-4 py-3 border-t border-rule2 font-body text-label text-muted">
        Plant AI accuracy <span className="text-ink font-medium tabular-nums">{inspectionAccuracy.aiAccuracy}%</span>
        {' · '}
        {totalNovel > 0 ? `${totalNovel} novel event${totalNovel > 1 ? 's' : ''} pending` : 'no novel events'}
      </div>
    </div>
  )
}

// ─── Right side — line overview (default) ──────────────────────────────────

function intervention(line) {
  const topType = defectTypes[line.defectBreakdown[0]?.type]?.label?.toLowerCase() ?? 'defects'
  if (line.status === 'alert') {
    return {
      tone: 'danger',
      text: line.equipmentSignal
        ? `${line.name} ${topType} rate is rising — now ${line.defectRate}% vs a ${line.baselineRate}% baseline. ${line.equipmentSignal.note}`
        : `${line.name} defect rate is at ${line.defectRate}%, above its ${line.baselineRate}% baseline. Recommend a floor check this shift.`,
    }
  }
  if (line.status === 'watch') {
    return {
      tone: 'warn',
      text: `${line.name} is trending up — ${line.defectRate}% vs ${line.baselineRate}% baseline, driven by ${topType}. Worth a check before next shift.`,
    }
  }
  return {
    tone: 'ok',
    text: `${line.name} is within normal range — ${line.defectRate}% vs ${line.baselineRate}% baseline. No action needed.`,
  }
}

function NovelEventTriage({ event }) {
  return (
    <div className="border border-danger/30 bg-danger/[0.02] px-4 py-3">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="font-body font-medium text-ink text-body leading-snug">Novel event · {event.sku} · {event.unit}</div>
        <div className="display-num text-sub font-bold tabular-nums text-danger leading-none flex-shrink-0">{event.modelConfidence}% confidence</div>
      </div>
      <p className="font-body text-label text-warn mb-1.5">{event.classificationAttempt}</p>
      <p className="font-body text-label text-muted leading-snug mb-2">{event.visualDescription}</p>
      <div className="flex items-center gap-2">
        <Clock size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
        <span className="font-body text-label text-warn">Escalated to {event.escalatedTo} — awaiting your disposition</span>
      </div>
    </div>
  )
}

function LineOverview({ line }) {
  const statusText = rateColor(line.defectRate, line.threshold)
  const delta = (line.defectRate - line.baselineRate)
  const recent = defectEvents.filter(e => e.lineId === line.id).slice(0, 5)
  const pendingNovel = novelEvents.filter(e => e.lineId === line.id && e.status === 'pending')
  const reviewedNovel = novelEvents.filter(e => e.lineId === line.id && e.status === 'reviewed')
  const note = intervention(line)
  const capaArmed = line.defectRate / line.threshold >= 0.8

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-rule2 flex items-start justify-between gap-4">
        <div>
          <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{line.name}</div>
          <div className="font-body text-muted text-body">{line.sku} · {line.lot} · {line.supervisor}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`display-num text-title font-bold tabular-nums leading-none ${statusText}`}>
            <AnimatedScore value={line.defectRate} decimals={2} suffix="%" effect="blur" />
          </div>
          <div className="font-body text-muted text-label">defect rate</div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <TrendIcon trend={line.trend} />
            <span className="font-body text-label text-muted tabular-nums">
              {delta >= 0 ? '+' : ''}{delta.toFixed(2)} pts vs {line.baselineRate}% baseline
            </span>
          </div>
        </div>
      </div>

      <Narrative tone={note.tone}>{note.text}</Narrative>

      {pendingNovel.length > 0 && (
        <div className="px-5 py-3 space-y-2">
          {pendingNovel.map(e => <NovelEventTriage key={e.id} event={e} />)}
        </div>
      )}

      <StatGrid cols={4}>
        {[
          { label: 'Inspected', val: line.unitsInspected.toLocaleString(), tone: 'text-ink' },
          { label: 'Passed',    val: line.unitsPass.toLocaleString(),      tone: 'text-ok' },
          { label: 'Rejected',  val: line.unitsFail.toLocaleString(),      tone: line.unitsFail > 80 ? 'text-danger' : 'text-warn' },
          { label: 'Baseline',  val: `${line.baselineRate}%`,              tone: 'text-muted' },
        ].map(({ label, val, tone }) => (
          <StatGrid.Cell key={label} label={label} value={val} tone={tone} />
        ))}
      </StatGrid>

      <div className="px-5 py-4 border-b border-rule2">
        <div className="font-body text-label font-semibold text-muted mb-2">Defect breakdown</div>
        {(() => {
          const [top, ...rest] = line.defectBreakdown
          const topDt = defectTypes[top.type]
          const total = line.defectBreakdown.reduce((s, d) => s + d.count, 0)
          return (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className={`display-num text-head font-bold tabular-nums leading-none ${topDt?.color ?? 'text-ink'}`}>
                  {Math.round(top.pct)}%
                </span>
                <span className={`font-body font-medium ${topDt?.color ?? 'text-ink'}`}>{topDt?.label ?? top.type}</span>
              </div>
              <div className="font-body text-label text-muted mt-1">
                {top.count} of {total} rejects this shift
                {rest.length > 0 && (
                  <>
                    {' '}· also{' '}
                    {rest.map((d, i) => {
                      const dt = defectTypes[d.type]
                      return (
                        <span key={d.type}>
                          {i > 0 ? ', ' : ''}
                          <span className={dt?.color ?? 'text-muted'}>{dt?.label ?? d.type}</span> {d.count} ({d.pct.toFixed(0)}%)
                        </span>
                      )
                    })}
                  </>
                )}
              </div>
            </>
          )
        })()}
        {line.equipmentSignal && (
          <div className="mt-3 px-3 py-2 border-l-[3px] border-l-warn bg-warn/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body font-medium text-ink text-label">{line.equipmentSignal.unit}</span>
              <Link to={line.equipmentSignal.route} className="ml-auto flex items-center gap-1 font-body text-label text-signal hover:text-ink transition-colors">
                View <ArrowRight size={9} strokeWidth={2} />
              </Link>
            </div>
            <p className="font-body text-label text-muted leading-snug mb-1">{line.equipmentSignal.signal}</p>
            <span className="font-body text-label text-muted">Detected {line.equipmentSignal.detectedAgo}</span>
          </div>
        )}
        {line.ccpStatus && (
          <div className={`flex items-center gap-2 px-3 py-2 mt-3 border ${line.ccpStatus.status === 'ok' ? 'border-ok/20 bg-ok/[0.03]' : 'border-warn/20 bg-warn/[0.03]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${line.ccpStatus.status === 'ok' ? 'bg-ok' : 'bg-warn'}`} />
            <span className="font-body text-label font-medium text-ink">{line.ccpStatus.ccp}</span>
            <span className={`ml-auto font-body text-label ${line.ccpStatus.status === 'ok' ? 'text-ok' : 'text-warn'}`}>{line.ccpStatus.note}</span>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-b border-rule2">
        <div className="font-body text-label font-semibold text-muted mb-2">Auto-CAPA trigger</div>
        <div className={`flex items-start gap-3 px-4 py-3 border ${capaArmed ? 'border-warn/20 bg-warn/[0.03]' : 'border-rule2'}`}>
          <Zap size={11} strokeWidth={2} className={capaArmed ? 'text-warn mt-px flex-shrink-0' : 'text-muted mt-px flex-shrink-0'} />
          <div className="flex-1">
            <div className="font-body text-label font-medium text-ink mb-0.5">
              Arms at {autoCAPAConfig.threshold}% — sustained {autoCAPAConfig.sustainedMinutes} min
            </div>
            <div className="font-body text-label text-muted leading-snug">
              Applies to: {autoCAPAConfig.defectTypesIncluded.map(t => defectTypes[t]?.label).join(', ')}.
              Cosmetic defects excluded.
            </div>
            {capaArmed && (
              <div className="font-body text-label text-warn mt-1">
                Currently at {((line.defectRate / line.threshold) * 100).toFixed(0)}% of threshold — approaching trigger
              </div>
            )}
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="px-5 py-4">
          <div className="font-body text-label font-semibold text-muted mb-2">Recent events · this shift</div>
          {recent.map(ev => {
            const dt = defectTypes[ev.defectType]
            return (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-rule2 last:border-b-0">
                <span className="font-body text-muted text-label flex-shrink-0 w-10 pt-px tabular-nums">{ev.timestamp}</span>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dt?.dot ?? 'bg-muted'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-body text-body font-medium leading-snug ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? ev.defectType}</div>
                  <div className="font-body text-label text-muted leading-snug">{ev.detail}</div>
                </div>
                <span className="font-body text-label text-muted flex-shrink-0 tabular-nums">{ev.confidence}%</span>
              </div>
            )
          })}
        </div>
      )}

      {reviewedNovel.length > 0 && (
        <div className="px-5 pb-4">
          <ExpandableSection title={`Novel event review history (${reviewedNovel.length})`}>
            {reviewedNovel.map(e => (
              <div key={e.id} className="px-4 py-3 border-b border-rule2 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusPill tone="ok">Reviewed</StatusPill>
                  <span className="font-body text-label text-muted">{e.timestamp}</span>
                </div>
                <div className="font-body font-medium text-ink text-body leading-snug mb-1">{e.sku} · {e.lot}</div>
                <p className="font-body text-label text-muted leading-snug">{e.disposition}</p>
              </div>
            ))}
          </ExpandableSection>
        </div>
      )}
    </div>
  )
}

// ─── Right side — defect log (de-emphasized, audit) ─────────────────────────

const LINE_FILTER_OPTIONS = [
  { value: 'all', label: 'All lines' },
  ...lineQuality.map(l => ({ value: l.id, label: l.name })),
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All defect types' },
  ...Object.entries(defectTypes).map(([k, v]) => ({ value: k, label: v.label })),
]

function LogView({ initialLineId }) {
  const [filterLine, setFilterLine] = useState(initialLineId)
  const [filterType, setFilterType] = useState('all')
  const filtered = defectEvents
    .filter(e => filterLine === 'all' || e.lineId === filterLine)
    .filter(e => filterType === 'all' || e.defectType === filterType)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 flex items-center gap-2 flex-wrap">
        <FilterDropdown label="Line" options={LINE_FILTER_OPTIONS} value={filterLine} onChange={setFilterLine} />
        <FilterDropdown label="Defect type" options={TYPE_FILTER_OPTIONS} value={filterType} onChange={setFilterType} />
        <span className="font-body text-label text-muted ml-1">{filtered.length} events · last 12 hours</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {filtered.length === 0 && (
          <div className="font-body text-label text-muted text-center py-8">No events match these filters</div>
        )}
        {filtered.map(ev => {
          const dt = defectTypes[ev.defectType]
          return (
            <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-rule2 last:border-b-0">
              <span className="font-body text-muted text-label flex-shrink-0 w-10 pt-px tabular-nums">{ev.timestamp}</span>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dt?.dot ?? 'bg-muted'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-body text-body font-medium leading-snug ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? ev.defectType}</span>
                  <span className="font-body text-label text-muted">· {ev.lineId.toUpperCase()}</span>
                </div>
                <div className="font-body text-label text-muted leading-snug">{ev.detail}</div>
                {ev.equipmentRef && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Brain size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
                    <span className="font-body text-label text-warn">{ev.equipmentRef}</span>
                  </div>
                )}
              </div>
              <span className="font-body text-label text-muted flex-shrink-0 tabular-nums">{ev.confidence}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Right side — accuracy detail (de-emphasized, defensibility) ────────────

function AccuracyView({ highlightSku }) {
  const acc = inspectionAccuracy
  const gap = (acc.aiAccuracy - acc.humanBaseline).toFixed(1)
  return (
    <div className="flex-1 overflow-y-auto">
      <Narrative tone="ok">
        AI inspection runs {gap} percentage points above the historical human baseline — at {acc.aiSampleSize.toLocaleString()} units/month, each point is roughly {Math.round(acc.aiSampleSize * 0.01).toLocaleString()} more caught defects.
      </Narrative>
      <div className="px-5 py-3 max-w-[700px]">
        <div className="px-6 py-5 bg-stone2 border border-rule2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="font-body text-label text-muted">Detection accuracy vs. industry baseline</span>
            <span className="font-body text-label font-semibold text-ok">+{gap} pts</span>
          </div>
          {(() => {
            const scaleMin = 70, scaleMax = 100
            const toPct = v => Math.max(0, Math.min(100, ((v - scaleMin) / (scaleMax - scaleMin)) * 100))
            const humanPct = toPct(acc.humanBaseline)
            const aiPct = toPct(acc.aiAccuracy)
            return (
              <>
                <div className="relative h-1.5 bg-rule2">
                  <div className="absolute top-0 bottom-0 bg-ok/15" style={{ left: `${humanPct}%`, right: `${100 - aiPct}%` }} />
                  <div className="absolute top-1/2 w-3 h-3 rounded-full bg-warn border-2 border-stone2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${humanPct}%` }} />
                  <div className="absolute top-1/2 w-3 h-3 rounded-full bg-ok border-2 border-stone2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${aiPct}%` }} />
                </div>
                <div className="flex justify-between font-body text-label text-muted mt-1.5 mb-5">
                  <span>{scaleMin}%</span>
                  <span>{scaleMax}%</span>
                </div>
              </>
            )
          })()}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-warn flex-shrink-0" />
                <span className="font-body text-label text-muted">Historical human inspection</span>
              </div>
              <div className="display-num text-score font-bold tabular-nums text-warn leading-none">{acc.humanBaseline}%</div>
              <div className="font-body text-label text-muted mt-2">Industry baseline · {acc.humanSampleSize.toLocaleString()} human QA checks</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ok flex-shrink-0" />
                <span className="font-body text-label text-muted">AI inspection (this plant)</span>
              </div>
              <div className="display-num text-score font-bold tabular-nums text-ok leading-none">
                <AnimatedScore value={acc.aiAccuracy} decimals={1} suffix="%" effect="glow" />
              </div>
              <div className="font-body text-label text-muted mt-2">{acc.aiSampleSize.toLocaleString()} units · last 30 days</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <ExpandableSection title="Accuracy by SKU" defaultOpen>
          <div className="px-4 py-3">
            <div className="font-body text-label text-muted mb-3">Ranked, highest to lowest · bar scale 95–100%</div>
            <div className="space-y-3">
              {[...acc.skuAccuracy].sort((a, b) => b.accuracy - a.accuracy).map(s => {
                const isSelected = s.sku === highlightSku
                const pct = Math.max(0, Math.min(100, ((s.accuracy - 95) / 5) * 100))
                const tone = s.accuracy >= 99 ? 'text-ok' : s.accuracy >= 98 ? 'text-signal' : 'text-warn'
                const barTone = s.accuracy >= 99 ? 'bg-ok' : s.accuracy >= 98 ? 'bg-signal' : 'bg-warn'
                return (
                  <div key={s.sku} className={`px-3 py-2.5 ${isSelected ? 'bg-signal-dim border-l-[3px] border-l-signal' : ''}`}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="font-body font-medium text-ink text-body flex items-center gap-2">
                        {s.sku}
                        {isSelected && <span className="font-body text-label font-medium text-signal">· selected line</span>}
                      </span>
                      <span className="flex items-baseline gap-2 flex-shrink-0">
                        <span className={`display-num font-bold tabular-nums text-body ${tone}`}>{s.accuracy}%</span>
                        <span className="font-body text-label text-muted tabular-nums">{s.confidence}% conf</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-rule2 overflow-hidden">
                      <div className={`h-full ${barTone}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-1.5 font-body text-label text-muted">
                      <span className="leading-snug">{s.note}</span>
                      <span className="tabular-nums flex-shrink-0">{s.trainingUnits.toLocaleString()} units</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ExpandableSection>
        <ExpandableSection title="Accuracy by defect type">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-body text-label text-muted">Ranked weakest to strongest · bar scale 94–100%</span>
              <span className="font-body text-label text-muted flex items-center gap-1.5 flex-shrink-0">
                <span className="inline-block w-2.5 border-t border-ink/40" /> plant avg {acc.aiAccuracy}%
              </span>
            </div>
            <div className="space-y-3">
              {[...acc.defectTypeAccuracy].sort((a, b) => a.accuracy - b.accuracy).map(d => {
                const dt = defectTypes[d.type]
                const scaleMin = 94, scaleMax = 100
                const pct = Math.max(0, Math.min(100, ((d.accuracy - scaleMin) / (scaleMax - scaleMin)) * 100))
                const avgPct = Math.max(0, Math.min(100, ((acc.aiAccuracy - scaleMin) / (scaleMax - scaleMin)) * 100))
                const tone = d.accuracy >= 99 ? 'text-ok' : d.accuracy >= 98 ? 'text-signal' : 'text-warn'
                const barTone = d.accuracy >= 99 ? 'bg-ok' : d.accuracy >= 98 ? 'bg-signal' : 'bg-warn'
                return (
                  <div key={d.type} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="font-body font-medium text-body flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dt?.dot ?? 'bg-muted'}`} />
                        <span className="text-ink">{dt?.label ?? d.type}</span>
                      </span>
                      <span className="flex items-baseline gap-2 flex-shrink-0">
                        <span className={`display-num font-bold tabular-nums text-body ${tone}`}>{d.accuracy}%</span>
                        <span className="font-body text-label text-muted tabular-nums">{d.confidence}% conf</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-rule2 overflow-hidden">
                      <div className={`h-full ${barTone}`} style={{ width: `${pct}%` }} />
                      <div className="absolute top-0 bottom-0 w-px bg-ink/40" style={{ left: `${avgPct}%` }} />
                    </div>
                    <div className="font-body text-label text-muted leading-snug mt-1.5">{d.note}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </ExpandableSection>
        <ExpandableSection title="Where humans still lead">
          <div className="px-4 py-3 space-y-2">
            {acc.humanAdvantages.map((h, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-context flex-shrink-0 mt-1.5" />
                <div>
                  <div className="font-body font-medium text-ink text-body mb-0.5">{h.area}</div>
                  <p className="font-body text-label text-muted leading-snug">{h.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>
      </div>
    </div>
  )
}

// ─── Right side — novel events (plant-wide audit detail) ────────────────────

function NovelEventCard({ event }) {
  const isPending = event.status === 'pending'
  return (
    <div className={`border-b border-rule2 border-l-[3px] ${isPending ? 'border-l-danger' : 'border-l-ok'}`}>
      <div className={`px-5 py-4 ${isPending ? 'bg-danger/[0.02]' : ''}`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <StatusPill tone={isPending ? 'danger' : 'ok'}>{isPending ? 'Pending review' : 'Reviewed'}</StatusPill>
              <span className="font-body text-label text-muted">{event.timestamp}</span>
            </div>
            <div className="font-body font-medium text-ink text-body leading-snug">
              {event.lineId.toUpperCase()} · {event.sku} · {event.lot}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="display-num text-sub font-bold tabular-nums text-danger leading-none">{event.modelConfidence}%</div>
            <div className="font-body text-label text-muted">model confidence</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="font-body text-label text-muted mb-0.5">What the model attempted</div>
            <p className="font-body text-label text-warn">{event.classificationAttempt}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Why it couldn't classify</div>
            <p className="font-body text-label text-muted leading-snug">{event.why}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">What was seen</div>
            <p className="font-body text-label text-muted leading-snug">{event.visualDescription}</p>
          </div>
          <div>
            <div className="font-body text-label text-muted mb-0.5">Risk assessment</div>
            <p className={`font-body text-label leading-snug ${isPending ? 'text-danger' : 'text-muted'}`}>{event.riskAssessment}</p>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 pt-1">
              <Clock size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body text-label text-warn">
                Escalated to {event.escalatedTo} at {event.escalatedAt} — awaiting disposition
              </span>
            </div>
          )}

          {!isPending && (
            <div className="mt-2 px-4 py-3 bg-ok/[0.04] border-l-[3px] border-l-ok space-y-1">
              <div className="font-body text-label font-medium text-ok">Reviewed · {event.reviewedAt}</div>
              <p className="font-body text-label text-muted leading-snug">{event.disposition}</p>
              {event.groundTruthNote && (
                <p className="font-body text-label text-muted leading-snug">
                  <span className="text-signal">Ground truth: </span>{event.groundTruthNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NovelTab() {
  const pending  = novelEvents.filter(e => e.status === 'pending')
  const reviewed = novelEvents.filter(e => e.status === 'reviewed')
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-rule2 bg-stone2">
        <div className="font-body text-label font-semibold text-muted mb-1">What is a novel event?</div>
        <p className="font-body text-label text-muted leading-relaxed">
          A detection where the AI model's confidence falls below 50% because the visual signature doesn't match any labeled class in its training set.
          The model does not silently misclassify — it escalates to a human reviewer.
          Reviewed events with confirmed ground truth are added to the training set to improve future classifications.
        </p>
      </div>

      {pending.length > 0 && (
        <>
          <SectionHeader label={`Pending review · ${pending.length}`} tone="danger" />
          {pending.map(e => <NovelEventCard key={e.id} event={e} />)}
        </>
      )}

      {reviewed.length > 0 && (
        <>
          <SectionHeader label={`Reviewed · ${reviewed.length}`} />
          {reviewed.map(e => <NovelEventCard key={e.id} event={e} />)}
        </>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function QualityIQ() {
  const sortedLines = [...lineQuality].sort((a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (so !== 0) return so
    return b.defectRate - a.defectRate
  })
  const [selectedId, setSelectedId] = useState(sortedLines[0].id)
  const [view, setView] = useState('overview')
  const selectedLine = lineQuality.find(l => l.id === selectedId)
  const novelPending = novelEvents.filter(e => e.status === 'pending').length

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden font-body content-reveal">
      <MonitorRail selectedId={selectedId} lines={sortedLines}
        onSelect={(id) => { setSelectedId(id); setView('overview') }} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileLinePicker lines={sortedLines} selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setView('overview') }} />
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'log', label: 'Defect log' },
            { id: 'accuracy', label: 'Accuracy detail' },
            { id: 'novel', label: 'Novel events', badge: novelPending > 0 ? novelPending : undefined },
          ]}
          active={view}
          onChange={setView}
          className="px-3 md:px-6 bg-stone2/40 flex-shrink-0 overflow-x-auto"
        />

        {view === 'overview' && <LineOverview line={selectedLine} />}
        {view === 'log'      && <LogView initialLineId={selectedId} />}
        {view === 'accuracy' && <AccuracyView highlightSku={selectedLine.sku} />}
        {view === 'novel'    && <NovelTab />}
      </div>
    </div>
  )
}
