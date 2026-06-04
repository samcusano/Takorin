import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  lineQuality, inspectionAccuracy, defectEvents,
  novelEvents, autoCAPAConfig, defectTypes, defectRateTrend,
} from '../data/qualityiq'
import {
  AlertTriangle, CheckCircle2, Eye, ArrowRight,
  ChevronDown, ChevronRight, Zap, Clock, Brain,
  ShieldAlert, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { SceneHeader, StatusPill, Tabs, Btn, AnimatedScore, StatGrid, SectionHeader } from '../components/UI'

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

// Mini sparkline — 30-day defect rate trend
function Sparkline({ data, threshold }) {
  const W = 60, H = 24
  const max = Math.max(...data, threshold * 1.1)
  const min = 0
  const range = max - min || 1
  const toX = (i) => (i / (data.length - 1)) * W
  const toY = (v) => H - ((v - min) / range) * H
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  const threshY = toY(threshold).toFixed(1)
  const lastColor = data[data.length - 1] >= threshold * 0.8
    ? 'var(--color-danger)' : data[data.length - 1] >= threshold * 0.5
    ? 'var(--color-warn)' : 'var(--color-ok)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="flex-shrink-0">
      <line x1={0} y1={threshY} x2={W} y2={threshY}
        stroke="var(--color-danger)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
      <path d={path} fill="none" stroke="var(--color-ink-2)" strokeWidth="0.8" opacity="0.5" />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2" fill={lastColor} />
    </svg>
  )
}

// ─── Tab 1: Live ─────────────────────────────────────────────────────────────

function DefectBar({ breakdown }) {
  const total = breakdown.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null
  const colors = { seal: 'bg-danger', contamination: 'bg-danger', foreign: 'bg-danger', weight: 'bg-warn', label: 'bg-warn', cosmetic: 'bg-muted' }
  return (
    <div className="flex h-1 overflow-hidden gap-px mt-1.5">
      {breakdown.map(d => (
        <div key={d.type} className={`h-full ${colors[d.type] ?? 'bg-muted'}`}
          style={{ width: `${d.pct}%` }} title={`${defectTypes[d.type]?.label} ${d.count}`} />
      ))}
    </div>
  )
}

function LineCard({ line, selected, onClick }) {
  const statusDot = rateDot(line.defectRate, line.threshold)
  const statusText = rateColor(line.defectRate, line.threshold)
  const trend = defectRateTrend[line.id]
  const pctToThreshold = Math.min(100, (line.defectRate / line.threshold) * 100)
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors ${
        selected ? 'bg-stone2' : 'hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-body font-medium text-ink text-body leading-snug">{line.name}</div>
          <div className="font-body text-muted text-label">{line.sku} · {line.lot}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`display-num text-sub font-bold tabular-nums leading-none ${statusText}`}>
            {line.defectRate.toFixed(2)}%
          </div>
          <div className="font-body text-label text-muted">defect rate</div>
        </div>
      </div>

      {/* Threshold bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 bg-rule2 overflow-hidden">
          <div className={`h-full ${statusDot} transition-[width]`} style={{ width: `${pctToThreshold}%` }} />
        </div>
        <span className="font-body text-label text-muted flex-shrink-0 tabular-nums">
          {pctToThreshold.toFixed(0)}% of {line.threshold}% limit
        </span>
      </div>

      <DefectBar breakdown={line.defectBreakdown} />

      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <TrendIcon trend={line.trend} />
          <span className={`font-body text-label ${line.trend === 'rising' ? 'text-danger' : line.trend === 'falling' ? 'text-ok' : 'text-muted'}`}>
            {line.trendDelta} vs. baseline
          </span>
        </div>
        {trend && <Sparkline data={trend} threshold={line.threshold} />}
      </div>

      {line.autoCAPAArmed && !line.autoCAPATriggered && (
        <div className="flex items-center gap-1 mt-1.5">
          <Zap size={9} strokeWidth={2} className={pctToThreshold >= 80 ? 'text-warn' : 'text-muted'} />
          <span className={`font-body text-label ${pctToThreshold >= 80 ? 'text-warn' : 'text-muted'}`}>
            Auto-CAPA {pctToThreshold >= 80 ? 'approaching threshold' : 'armed'}
          </span>
        </div>
      )}
    </button>
  )
}

function LineDetail({ line }) {
  if (!line) return (
    <div className="flex-1 flex items-center justify-center">
      <span className="font-body text-muted text-label">Select a line to view detail</span>
    </div>
  )

  const recent = defectEvents.filter(e => e.lineId === line.id).slice(0, 5)
  const statusText = rateColor(line.defectRate, line.threshold)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-rule2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{line.name}</div>
            <div className="font-body text-muted text-body">{line.sku} · {line.lot} · {line.supervisor}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`display-num text-score font-bold tabular-nums leading-none ${statusText}`}>
              <AnimatedScore value={line.defectRate} decimals={2} suffix="%" effect="blur" />
            </div>
            <div className="font-body text-muted text-label">defect rate</div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <StatGrid cols={4}>
        {[
          { label: 'Inspected',    val: line.unitsInspected.toLocaleString(), tone: 'text-ink'  },
          { label: 'Passed',       val: line.unitsPass.toLocaleString(),      tone: 'text-ok'   },
          { label: 'Rejected',     val: line.unitsFail.toLocaleString(),      tone: line.unitsFail > 80 ? 'text-danger' : 'text-warn' },
          { label: 'Baseline rate', val: `${line.baselineRate}%`,             tone: 'text-muted' },
        ].map(({ label, val, tone }) => (
          <StatGrid.Cell key={label} label={label} value={val} tone={tone} />
        ))}
      </StatGrid>

      {/* Equipment signal — the R-03 connection */}
      {line.equipmentSignal && (
        <div className="mx-5 my-3 px-4 py-3 border-l-2 border-l-warn bg-warn/[0.03] border border-warn/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
            <span className="font-body font-medium text-ink text-body">Equipment signal detected</span>
            <Link to={line.equipmentSignal.route}
              className="ml-auto flex items-center gap-1 font-body text-label text-signal hover:text-ink transition-colors">
              View Equipment <ArrowRight size={9} strokeWidth={2} />
            </Link>
          </div>
          <p className="font-body text-label text-muted leading-snug mb-1">
            <span className="font-medium text-warn">{line.equipmentSignal.unit}</span> — {line.equipmentSignal.signal}
          </p>
          <p className="font-body text-label text-muted leading-snug">{line.equipmentSignal.note}</p>
          <span className="font-body text-label text-muted">Detected {line.equipmentSignal.detectedAgo}</span>
        </div>
      )}

      {/* CCP status */}
      {line.ccpStatus && (
        <div className={`flex items-center gap-2 mx-5 mt-3 px-4 py-2.5 border ${
          line.ccpStatus.status === 'ok' ? 'border-ok/20 bg-ok/[0.03]' : 'border-warn/20 bg-warn/[0.03]'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${line.ccpStatus.status === 'ok' ? 'bg-ok' : 'bg-warn'}`} />
          <span className="font-body text-label font-medium text-ink">{line.ccpStatus.ccp}</span>
          <span className="font-body text-label text-muted">·</span>
          <span className="font-body text-label text-muted">{line.ccpStatus.label}</span>
          <span className={`ml-auto font-body text-label ${line.ccpStatus.status === 'ok' ? 'text-ok' : 'text-warn'}`}>
            {line.ccpStatus.note}
          </span>
        </div>
      )}

      {/* Defect breakdown */}
      <SectionHeader label="Defect breakdown · this shift" />
      <div className="px-5 pb-4 space-y-2">
        {line.defectBreakdown.map(d => {
          const dt = defectTypes[d.type]
          return (
            <div key={d.type} className="flex items-center gap-3">
              <span className={`font-body text-label w-28 flex-shrink-0 ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? d.type}</span>
              <div className="flex-1 h-1.5 bg-rule2 overflow-hidden">
                <div className={`h-full ${dt?.dot ?? 'bg-muted'}`} style={{ width: `${d.pct}%` }} />
              </div>
              <span className="font-body text-label text-muted tabular-nums w-8 text-right">{d.count}</span>
              <span className="font-body text-label text-muted tabular-nums w-10 text-right">{d.pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>

      {/* Auto-CAPA config */}
      <SectionHeader label="Auto-CAPA trigger" />
      <div className="px-5 pb-4">
        <div className={`flex items-start gap-3 px-4 py-3 border ${
          line.defectRate / line.threshold >= 0.8 ? 'border-warn/20 bg-warn/[0.03]' : 'border-rule2'
        }`}>
          <Zap size={11} strokeWidth={2} className={line.defectRate / line.threshold >= 0.8 ? 'text-warn mt-px flex-shrink-0' : 'text-muted mt-px flex-shrink-0'} />
          <div className="flex-1">
            <div className="font-body text-label font-medium text-ink mb-0.5">
              Arms at {autoCAPAConfig.threshold}% — sustained {autoCAPAConfig.sustainedMinutes} min
            </div>
            <div className="font-body text-label text-muted leading-snug">
              Applies to: {autoCAPAConfig.defectTypesIncluded.map(t => defectTypes[t]?.label).join(', ')}.
              Cosmetic defects excluded.
            </div>
            {line.defectRate / line.threshold >= 0.8 && (
              <div className="font-body text-label text-warn mt-1">
                Currently at {((line.defectRate / line.threshold) * 100).toFixed(0)}% of threshold — approaching trigger
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent events on this line */}
      {recent.length > 0 && (
        <>
          <SectionHeader label="Recent events · this shift" />
          {recent.map(ev => {
            const dt = defectTypes[ev.defectType]
            return (
              <div key={ev.id} className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2">
                <span className="font-body text-muted text-label flex-shrink-0 w-10 pt-px tabular-nums">{ev.timestamp}</span>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dt?.dot ?? 'bg-muted'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-body text-body font-medium leading-snug ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? ev.defectType}</div>
                  <div className="font-body text-label text-muted leading-snug">{ev.detail}</div>
                  {ev.equipmentRef && (
                    <div className="font-body text-label text-warn mt-0.5">{ev.equipmentRef}</div>
                  )}
                </div>
                <span className="font-body text-label text-muted flex-shrink-0 tabular-nums">{ev.confidence}%</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function LiveTab() {
  const [selectedId, setSelectedId] = useState('l4')
  const selected = lineQuality.find(l => l.id === selectedId)
  const totalInspected = lineQuality.reduce((s, l) => s + l.unitsInspected, 0)
  const totalFail = lineQuality.reduce((s, l) => s + l.unitsFail, 0)
  const overallRate = ((totalFail / totalInspected) * 100).toFixed(2)
  const alertLines = lineQuality.filter(l => l.status === 'alert').length
  const novelPending = novelEvents.filter(e => e.status === 'pending').length

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left: line list + summary */}
      <div className="w-[300px] flex-shrink-0 border-r border-rule2 flex flex-col">
        {/* Quick stats */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-px bg-rule2 border-b border-rule2">
          {[
            { label: 'Units inspected', val: totalInspected.toLocaleString(), color: 'text-ink' },
            { label: 'Overall defect rate', val: `${overallRate}%`, color: parseFloat(overallRate) > 0.5 ? 'text-warn' : 'text-ok' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-stone px-4 py-3">
              <div className={`display-num text-sub font-bold tabular-nums leading-none ${color}`}>{val}</div>
              <div className="font-body text-label text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
        {/* Line cards */}
        <div className="flex-1 overflow-y-auto">
          {lineQuality.map(line => (
            <LineCard key={line.id} line={line}
              selected={selectedId === line.id}
              onClick={() => setSelectedId(line.id)} />
          ))}
        </div>
        {/* Auto-CAPA status footer */}
        {novelPending > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-t border-rule2 bg-danger/[0.04]">
            <ShieldAlert size={11} strokeWidth={2} className="text-danger flex-shrink-0" />
            <span className="font-body text-label text-danger">{novelPending} novel event pending review</span>
          </div>
        )}
      </div>
      {/* Right: line detail */}
      <div className="flex flex-1 min-w-0 overflow-hidden bg-stone">
        <LineDetail line={selected} />
      </div>
    </div>
  )
}

// ─── Tab 2: Accuracy ──────────────────────────────────────────────────────────

function AccuracyTab() {
  const acc = inspectionAccuracy
  const gap = (acc.aiAccuracy - acc.humanBaseline).toFixed(1)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[800px] px-6 py-6 space-y-8">

        {/* Headline comparison */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-4 tracking-wider">DETECTION ACCURACY · KNOWN DEFECT TYPES</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="px-6 py-5 bg-stone2 border border-rule2">
              <div className="font-body text-label text-muted mb-2">AI inspection (this plant)</div>
              <div className="display-num text-score font-bold tabular-nums text-ok leading-none">
                <AnimatedScore value={acc.aiAccuracy} decimals={1} suffix="%" effect="glow" />
              </div>
              <div className="font-body text-label text-muted mt-2">
                {acc.aiSampleSize.toLocaleString()} units · last 30 days
              </div>
            </div>
            <div className="px-6 py-5 bg-stone2 border border-rule2">
              <div className="font-body text-label text-muted mb-2">Historical human inspection</div>
              <div className="display-num text-score font-bold tabular-nums text-warn leading-none">{acc.humanBaseline}%</div>
              <div className="font-body text-label text-muted mt-2">Industry baseline · {acc.humanSampleSize.toLocaleString()} human QA checks</div>
            </div>
          </div>
          <div className="px-4 py-3 bg-ok/[0.04] border-l-2 border-l-ok">
            <span className="font-body font-medium text-ok">+{gap} percentage point improvement</span>
            <span className="font-body text-muted text-body ml-2">— at {acc.aiSampleSize.toLocaleString()} units per month, each additional percentage point of accuracy represents ~{Math.round(acc.aiSampleSize * 0.01).toLocaleString()} more defects caught before they ship.</span>
          </div>
          <p className="font-body text-label text-muted mt-3 leading-relaxed">{acc.humanBaselineNote}</p>
        </div>

        {/* Per-SKU breakdown */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">ACCURACY BY SKU</div>
          <div className="border border-rule2 divide-y divide-rule2">
            <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 px-4 py-2 bg-stone2">
              <span className="font-body text-label text-muted">SKU</span>
              <span className="font-body text-label text-muted text-right">Accuracy</span>
              <span className="font-body text-label text-muted text-right">Confidence</span>
              <span className="font-body text-label text-muted text-right">Training units</span>
            </div>
            {acc.skuAccuracy.map(s => (
              <div key={s.sku} className="px-4 py-3">
                <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 items-center mb-1">
                  <span className="font-body font-medium text-ink text-body">{s.sku}</span>
                  <span className={`font-body font-bold text-body tabular-nums text-right ${s.accuracy >= 99 ? 'text-ok' : s.accuracy >= 98 ? 'text-signal' : 'text-warn'}`}>{s.accuracy}%</span>
                  <span className="font-body text-muted text-body tabular-nums text-right">{s.confidence}%</span>
                  <span className="font-body text-muted text-label tabular-nums text-right">{s.trainingUnits.toLocaleString()}</span>
                </div>
                <p className="font-body text-label text-muted leading-snug">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Defect type accuracy */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">ACCURACY BY DEFECT TYPE</div>
          <div className="space-y-2">
            {acc.defectTypeAccuracy.map(d => {
              const dt = defectTypes[d.type]
              return (
                <div key={d.type} className="flex items-start gap-4 px-4 py-2.5 bg-stone2 border border-rule2">
                  <div className="w-32 flex-shrink-0">
                    <div className={`font-body text-body font-medium ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? d.type}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24 h-1.5 bg-rule2 overflow-hidden">
                      <div className="h-full bg-ok" style={{ width: `${d.accuracy}%` }} />
                    </div>
                    <span className={`display-num text-label font-bold tabular-nums w-12 ${d.accuracy >= 99 ? 'text-ok' : d.accuracy >= 98 ? 'text-signal' : 'text-warn'}`}>{d.accuracy}%</span>
                  </div>
                  <p className="flex-1 font-body text-label text-muted leading-snug">{d.note}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Where humans still lead */}
        <div>
          <div className="font-body text-label font-semibold text-muted mb-3 tracking-wider">WHERE HUMANS STILL LEAD</div>
          <div className="space-y-2">
            {acc.humanAdvantages.map((h, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border border-rule2">
                <div className="w-1.5 h-1.5 rounded-full bg-context flex-shrink-0 mt-1.5" />
                <div>
                  <div className="font-body font-medium text-ink text-body mb-0.5">{h.area}</div>
                  <p className="font-body text-label text-muted leading-snug">{h.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 3: Log ───────────────────────────────────────────────────────────────

function LogTab() {
  const [filterLine, setFilterLine] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const filtered = defectEvents
    .filter(e => filterLine === 'all' || e.lineId === filterLine)
    .filter(e => filterType === 'all' || e.defectType === filterType)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Filter bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-rule2 bg-stone">
        <select value={filterLine} onChange={e => setFilterLine(e.target.value)}
          className="font-body text-label text-muted bg-stone2 border border-rule2 px-2 py-1.5 focus:outline-none focus:border-signal">
          <option value="all">All lines</option>
          {lineQuality.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="font-body text-label text-muted bg-stone2 border border-rule2 px-2 py-1.5 focus:outline-none focus:border-signal">
          <option value="all">All defect types</option>
          {Object.entries(defectTypes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="ml-auto font-body text-label text-muted">{filtered.length} events · last 12 hours</span>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-[64px_72px_80px_120px_140px_72px_80px] gap-3 px-5 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
          {['Time','Line','SKU','Defect type','Detail','Conf.','Result'].map(h => (
            <span key={h} className="font-body text-label text-muted">{h}</span>
          ))}
        </div>
        {filtered.map(ev => {
          const dt = defectTypes[ev.defectType]
          const isOpen = expanded === ev.id
          return (
            <div key={ev.id} className={`border-b border-rule2 ${isOpen ? 'bg-stone2' : ''}`}>
              <button type="button" onClick={() => setExpanded(isOpen ? null : ev.id)}
                className="grid grid-cols-[64px_72px_80px_120px_140px_72px_80px] gap-3 px-5 py-2.5 w-full text-left hover:bg-stone2/60 transition-colors">
                <span className="font-body text-muted text-label tabular-nums">{ev.timestamp}</span>
                <span className="font-body text-muted text-label">{ev.lineId.toUpperCase()}</span>
                <span className="font-body text-muted text-label truncate">{ev.sku.split(' ')[0]}</span>
                <span className={`font-body text-label font-medium ${dt?.color ?? 'text-muted'}`}>{dt?.label ?? ev.defectType}</span>
                <span className="font-body text-muted text-label truncate">{ev.detail.slice(0, 40)}{ev.detail.length > 40 ? '…' : ''}</span>
                <span className="font-body text-muted text-label tabular-nums">{ev.confidence}%</span>
                <StatusPill tone="danger">Rejected</StatusPill>
              </button>
              {isOpen && (
                <div className="px-5 pb-3 border-t border-rule2 space-y-1.5">
                  <div className="pt-2 font-body text-label text-muted leading-relaxed">{ev.detail}</div>
                  {ev.equipmentRef && (
                    <div className="flex items-center gap-1.5">
                      <Brain size={10} strokeWidth={2} className="text-warn flex-shrink-0" />
                      <span className="font-body text-label text-warn">{ev.equipmentRef}</span>
                    </div>
                  )}
                  <div className="font-body text-label text-muted">
                    Lot {ev.lot} · Unit {ev.unit} · HACCP record auto-filed
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab 4: Novel events ─────────────────────────────────────────────────────

function NovelEventCard({ event }) {
  const isPending = event.status === 'pending'
  return (
    <div className={`border-b border-rule2 border-l-2 ${isPending ? 'border-l-danger' : 'border-l-ok'}`}>
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
            <div className="mt-2 px-4 py-3 bg-ok/[0.04] border-l-2 border-l-ok space-y-1">
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
      {/* What novel events are */}
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

const TABS = [
  { id: 'live',     label: 'Live'          },
  { id: 'accuracy', label: 'Accuracy'      },
  { id: 'log',      label: 'Defect Log'    },
  { id: 'novel',    label: 'Novel Events'  },
]

export default function QualityIQ() {
  const [tab, setTab] = useState('live')

  const totalInspected  = lineQuality.reduce((s, l) => s + l.unitsInspected, 0)
  const totalFail       = lineQuality.reduce((s, l) => s + l.unitsFail, 0)
  const overallRate     = (totalFail / totalInspected * 100).toFixed(2)
  const alertLines      = lineQuality.filter(l => l.status === 'alert').length
  const watchLines      = lineQuality.filter(l => l.status === 'watch').length
  const novelPending    = novelEvents.filter(e => e.status === 'pending').length

  const narrative = [
    alertLines > 0 ? `${alertLines} line above normal — Line 4 seal failures rising with R-03 bearing anomaly` : null,
    watchLines > 0 ? `${watchLines} line on watch` : null,
    novelPending > 0 ? `${novelPending} novel event pending human review` : null,
  ].filter(Boolean).join(' · ') || 'All lines within threshold'

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <SceneHeader
        metric={parseFloat(overallRate)}
        metricLabel="overall defect rate %"
        metricColor={parseFloat(overallRate) > 0.5 ? 'var(--color-warn)' : 'var(--color-ok)'}
        statement={narrative}
        tone={alertLines > 0 ? 'warn' : 'ok'}
        meta={[
          { label: 'Units inspected', value: totalInspected.toLocaleString() },
          { label: 'AI accuracy',     value: `${inspectionAccuracy.aiAccuracy}%` },
          { label: 'Novel events',    value: novelPending > 0 ? `${novelPending} pending` : 'None pending' },
        ]}
      />

      <Tabs tabs={TABS.map(t => ({
        ...t,
        badge: t.id === 'novel' && novelPending > 0 ? novelPending : undefined,
      }))} active={tab} onChange={setTab} />

      {tab === 'live'     && <LiveTab />}
      {tab === 'accuracy' && <AccuracyTab />}
      {tab === 'log'      && <LogTab />}
      {tab === 'novel'    && <NovelTab />}
    </div>
  )
}
