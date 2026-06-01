// Process Hierarchy — Causal State Resolution Layer
// Users come to answer: "Where is instability forming, and what should I do about it?"
// Primary surface: Operational State Field (Variant A)
// Secondary: Structural Explorer for audit/forensics (Variant B)
// Tertiary: Global Overview snapshot (Variant C)

import { useState, useRef, useEffect } from 'react'
import { processHierarchy } from '../data/hierarchy'
import { AlertTriangle, ChevronRight, ChevronDown, ArrowRight, ArrowDown, Activity, Zap, TrendingDown, Info } from 'lucide-react'
import { SlidePanel, SegmentedControl, SectionHeader, Tabs, AnimatedScore, StatGrid, EmptyState } from '../components/UI'
import ShiftHero from '../components/ShiftHero'

const scoreColor  = (s) => s >= 90 ? 'text-ok'     : s >= 80 ? 'text-signal'   : s >= 70 ? 'text-warn'   : 'text-danger'
const scoreBg     = (s) => s >= 90 ? 'bg-ok'        : s >= 80 ? 'bg-signal'     : s >= 70 ? 'bg-warn'     : 'bg-danger'
const pressureBg  = (s) => s >= 90 ? ''             : s >= 83 ? 'bg-signal/[0.05]' : s >= 75 ? 'bg-warn/[0.10]' : 'bg-danger/[0.18]'
const pressureRing = (s, hasAlert) => {
  if (hasAlert) return 'ring-2 ring-warn ring-offset-1 ring-offset-stone'
  if (s < 75) return 'ring-2 ring-danger/40 ring-offset-1 ring-offset-stone'
  return ''
}

// Zone lineage — which zone feeds which
const ZONE_LINEAGE = {
  'zone-a1': { feedsFrom: ['zone-a3'],  feedsInto: ['zone-a2'] },
  'zone-a2': { feedsFrom: ['zone-a1'],  feedsInto: ['zone-c1'] },
  'zone-a3': { feedsFrom: [],           feedsInto: ['zone-a1'] },
  'zone-b1': { feedsFrom: [],           feedsInto: ['zone-c1'] },
  'zone-c1': { feedsFrom: ['zone-a2', 'zone-b1'], feedsInto: ['zone-c2'] },
  'zone-c2': { feedsFrom: ['zone-c1'],  feedsInto: [] },
  'zone-d1': { feedsFrom: [],           feedsInto: [] },
  'zone-d2': { feedsFrom: [],           feedsInto: [] },
}

const ZONE_NAMES = {
  'zone-a1': 'Zone A1', 'zone-a2': 'Zone A2', 'zone-a3': 'Zone A3',
  'zone-b1': 'Zone B1', 'zone-c1': 'Zone C1', 'zone-c2': 'Zone C2',
  'zone-d1': 'Zone D1', 'zone-d2': 'Zone D2',
}

// Derive vessel-type and stage distribution from zone processes
function getZoneStats(zone) {
  const vessels = (zone.processes ?? []).flatMap(p => p.vessels ?? [])
  const stages = {}
  const types = { tank: 0, chamber: 0, other: 0 }
  vessels.forEach(v => {
    const s = v.stage ?? 'unknown'
    stages[s] = (stages[s] ?? 0) + 1
    if (v.id.startsWith('F-')) types.tank++
    else if (v.id.startsWith('K-')) types.chamber++
    else types.other++
  })
  return { stages, types, total: vessels.length }
}

const STAGE_LABELS = {
  'primary':   'Primary ferm',
  'secondary': 'Secondary ferm',
  'koji':      'Koji',
  'complete':  'Complete',
  'unknown':   'Unknown',
}
const STAGE_COLORS = {
  'primary':   'bg-signal/10 text-signal',
  'secondary': 'bg-ok/10 text-ok',
  'koji':      'bg-stone3 text-muted',
  'complete':  'bg-ok/10 text-ok',
  'unknown':   'bg-stone3 text-muted',
}

// Causal chains derived from zone data — maps zone ids to upstream/downstream context
const CAUSAL_MAP = {
  'zone-a1': {
    upstream: [
      { type: 'sensor',    label: 'Sensor drift — Tank F-047', detail: 'Benzaldehyde 0.026 ppm (threshold 0.028). Maillard phase shift at Day 126.', tone: 'warn' },
      { type: 'batch',     label: 'Batch L-0891 — lot pending COA', detail: 'ConAgra Pepperoni lot waiting supplier confirmation. No release until COA received.', tone: 'warn' },
    ],
    downstream: [
      { label: 'Zone A2 — Secondary Fermentation', detail: 'If benzaldehyde stabilizes below threshold, grade ceiling drops from Premium to Standard.', risk: 'high' },
      { label: 'Bottling — Zone C1', detail: 'Batch BTH-2026-047 projected completion May 28. Color and aroma profiles at risk.', risk: 'medium' },
    ],
    propagation: 'If unbounded, aroma deviation in F-047 will reach F-038 within 14 days.',
    confidence: 71,
    actions: [
      { label: 'Reduce fermentation temp to 26°C', consequence: 'Slows Maillard, preserves benzaldehyde 8–12%' },
      { label: 'Schedule sensor calibration — A-7', consequence: 'Confirm reading accuracy before intervention' },
    ],
  },
  'zone-b1': {
    upstream: [
      { type: 'process', label: 'Zone A1 load transfer', detail: 'Secondary batches entering from primary block — normal schedule.', tone: 'ok' },
    ],
    downstream: [
      { label: 'Zone C1 — Pressing', detail: 'No downstream impact detected.', risk: 'low' },
    ],
    propagation: null,
    confidence: 87,
    actions: [],
  },
}

const DEFAULT_CAUSAL = {
  upstream: [],
  downstream: [],
  propagation: null,
  confidence: null,
  actions: [],
}

// Reasoning layer — why the system believes what it believes for each zone
const REASONING_MAP = {
  'zone-a1': {
    recommendation: 'Reduce fermentation temperature to 26°C and delay bottling for BTH-2026-047 by 4 hours',
    confidence: 71,
    confidenceModel: 'Biological fermentation process',
    primaryContributors: [
      { label: 'Benzaldehyde drift trend — sensor A-7', pct: 34 },
      { label: 'Supplier COA pending — Lot L-0891', pct: 22 },
      { label: 'Temperature instability (Zone A1)', pct: 15 },
    ],
    suppressedContributors: [
      { label: 'Humidity spike — sensor HX-03', reason: 'Sensor confidence 31% — below qualification threshold' },
      { label: 'Aroma deviation (single reading)', reason: 'Single-point measurement — insufficient for signal clustering' },
    ],
    competingHypotheses: [
      { label: 'Fermentation acceleration pattern', confidence: 58, note: '40% historical precedent in Q1 high-humidity batches' },
      { label: 'Contamination precursor signature', confidence: 31, note: 'Insufficient evidence — escalation threshold not met' },
    ],
    forecastIfUnbounded: 'Premium grade failure risk reaches 62% within 14 hours without intervention',
  },
  'zone-b1': {
    recommendation: 'No intervention required — Zone B1 operating within normal parameters',
    confidence: 87,
    confidenceModel: 'Biological fermentation process',
    primaryContributors: [
      { label: 'Fermentation schedule nominal', pct: 52 },
      { label: 'All COAs cleared and received', pct: 28 },
      { label: 'Sensor array fully qualified', pct: 20 },
    ],
    suppressedContributors: [],
    competingHypotheses: [],
    forecastIfUnbounded: null,
  },
  'zone-a2': {
    recommendation: 'Monitor Zone A2 — early-watch status tied to upstream A1 resolution',
    confidence: 84,
    confidenceModel: 'Biological fermentation process',
    primaryContributors: [
      { label: 'Upstream batch quality uncertainty from A1', pct: 41 },
      { label: 'Secondary fermentation schedule nominal', pct: 33 },
      { label: 'Grade ceiling risk from BTH-2026-047', pct: 16 },
    ],
    suppressedContributors: [
      { label: 'Cross-zone temperature correlation', reason: 'Below propagation confidence threshold (28% vs 40% required)' },
    ],
    competingHypotheses: [
      { label: 'Isolated secondary fermentation drift', confidence: 44, note: 'Pattern consistent with seasonal Q1 variance — monitoring only' },
    ],
    forecastIfUnbounded: 'Grade ceiling breach probability reaches 28% within 21 days if A1 instability propagates',
  },
}

const DEFAULT_REASONING = {
  recommendation: null,
  confidence: null,
  confidenceModel: 'Biological fermentation process',
  primaryContributors: [],
  suppressedContributors: [],
  competingHypotheses: [],
  forecastIfUnbounded: null,
}

function ScoreDot({ score }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-signal' : score >= 70 ? 'bg-warn' : 'bg-danger'
  return <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />
}

function ScoreBar({ score, width = 60 }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-signal' : score >= 70 ? 'bg-warn' : 'bg-danger'
  const textColor = scoreColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="h-0.5 bg-rule2 flex-shrink-0" style={{ width }}>
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`display-num text-body tabular-nums ${textColor}`}>{score}</span>
    </div>
  )
}

function EnvChip({ label, val, tone }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 border ${tone === 'ok' ? 'border-ok/20 bg-ok/[0.04]' : 'bg-warn/[0.04]'}`}>
      <span className="font-body text-muted text-label">{label}</span>
      <span className={`font-body font-medium text-label tabular-nums ${tone === 'ok' ? 'text-ok' : 'text-warn'}`}>{val}</span>
    </div>
  )
}

function VesselGrid({ vessels }) {
  return (
    <StatGrid cols={3} noBorder>
      {vessels.map(v => {
        const toneColor = v.tone === 'ok' ? 'text-ok' : v.tone === 'warn' ? 'text-warn' : 'text-muted'
        const isComplete = v.stage === 'complete'
        return (
          <div key={v.id} className={`bg-stone px-3 py-2.5 ${v.alert ? 'bg-warn/[0.03]' : ''}`}>
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <span className="font-body font-medium text-ink text-label">{v.id}</span>
              <span className={`font-body text-label tabular-nums ${toneColor}`}>{v.confidence}%</span>
            </div>
            <div className="font-body text-muted text-label truncate">{v.batch}</div>
            <div className="h-0.5 bg-rule2 mt-1.5 mb-1">
              <div className={`h-full ${isComplete ? 'bg-ok' : 'bg-signal/60'}`}
                style={{ width: `${Math.min(100, (v.daysElapsed / 185) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-muted text-micro">{v.daysElapsed}d</span>
              {v.alert && <AlertTriangle size={10} className="text-warn flex-shrink-0" strokeWidth={2} />}
            </div>
          </div>
        )
      })}
    </StatGrid>
  )
}

function Breadcrumb({ crumbs, onNavigate }) {
  const [open, setOpen] = useState(false)
  const dropRef    = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // ≤ 2 crumbs — flat linear, no dropdown needed
  if (crumbs.length <= 2) {
    return (
      <div className="flex items-center gap-1.5">
        {crumbs.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} className="text-muted flex-shrink-0" />}
            {i < crumbs.length - 1
              ? <button type="button" onClick={() => onNavigate(i)} className="font-body text-muted text-label hover:text-ink transition-colors">{c}</button>
              : <span className="font-body font-medium text-ink text-label">{c}</span>
            }
          </div>
        ))}
      </div>
    )
  }

  // 3+ crumbs — root · [middle dropdown] · current
  const middleCrumbs = crumbs.slice(1, crumbs.length - 1)
  const triggerLabel = middleCrumbs[middleCrumbs.length - 1]

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onNavigate(0)}
        className="font-body text-muted text-label hover:text-ink transition-colors">
        {crumbs[0]}
      </button>
      <ChevronRight size={10} className="text-muted flex-shrink-0" />

      <div className="relative">
        <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 font-body text-muted text-label hover:text-ink transition-colors">
          <span>{triggerLabel}</span>
          <ChevronDown size={9} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div ref={dropRef}
            className="absolute top-full left-0 mt-1 z-50 bg-stone border border-rule2 shadow-raise overflow-hidden"
            style={{ minWidth: 200 }}>
            {middleCrumbs.map((c, i) => (
              <button key={i} type="button"
                onClick={() => { onNavigate(i + 1); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 font-body text-label text-muted hover:text-ink hover:bg-stone2 border-b border-rule2 last:border-0 transition-colors">
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <ChevronRight size={10} className="text-muted flex-shrink-0" />
      <span className="font-body font-medium text-ink text-label">{crumbs[crumbs.length - 1]}</span>
    </div>
  )
}

// ── Variant A: Operational State Field ───────────────────────────────────────

function CausalPanel({ zone, building }) {
  const causal = CAUSAL_MAP[zone.id] ?? DEFAULT_CAUSAL
  const allVessels = (zone.processes ?? []).flatMap(p => p.vessels ?? [])
  const statusLabel = zone.score >= 90 ? 'Clear' : zone.score >= 80 ? 'Watch' : zone.score >= 70 ? 'At risk' : 'Critical'
  const statusColor = zone.score >= 90 ? 'text-ok' : zone.score >= 80 ? 'text-signal' : zone.score >= 70 ? 'text-warn' : 'text-danger'

  return (
    <div className="space-y-4">

      {/* Score + vessels + confidence */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-body text-muted text-label">{zone.vessels} vessels · {zone.activeBatches} active batches</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`display-num text-score leading-none ${scoreColor(zone.score)}`}><AnimatedScore value={zone.score} effect="glow" /></div>
          <div className={`font-body font-bold text-label ${statusColor}`}>{statusLabel}</div>
        </div>
      </div>
      {zone.alert && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-warn/[0.06] border-l-2 border-l-warn">
          <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-body text-warn text-label leading-snug">{zone.alert.msg}</span>
        </div>
      )}
      {causal.confidence != null && (
        <div className="flex items-center gap-2">
          <span className="font-body text-muted text-label">Confidence</span>
          <div className="flex-1 h-0.5 bg-rule2">
            <div className={`h-full ${causal.confidence >= 70 ? 'bg-ok' : causal.confidence >= 50 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${causal.confidence}%` }} />
          </div>
          <span className={`font-body text-label tabular-nums ${causal.confidence >= 70 ? 'text-ok' : causal.confidence >= 50 ? 'text-warn' : 'text-danger'}`}>{causal.confidence}%</span>
        </div>
      )}

        {/* Causal chain — upstream → current → downstream */}
        {(causal.upstream.length > 0 || causal.downstream.length > 0) && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-muted text-label mb-3">Cause chain</div>

            {causal.upstream.length > 0 && (
              <div className="mb-3">
                <div className="font-body text-muted text-label mb-1.5 flex items-center gap-1">
                  <ArrowDown size={10} className="text-muted rotate-180" />Upstream contributors
                </div>
                <div className="space-y-1.5">
                  {causal.upstream.map((u, i) => (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 border border-l-4 ${u.tone === 'warn' ? 'border-l-warn bg-warn/[0.03]' : u.tone === 'danger' ? 'border-danger/30 border-l-danger bg-danger/[0.03]' : 'border-rule2 border-l-ok'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-label leading-snug">{u.label}</div>
                        <div className="font-body text-muted text-label leading-snug mt-0.5">{u.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current zone marker */}
            <div className="flex items-center gap-2 py-2 px-3 bg-stone2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scoreBg(zone.score)}`} />
              <span className="font-body font-medium text-ink text-label">{zone.label}</span>
              <span className={`font-body font-bold text-label ml-auto ${statusColor}`}>{statusLabel} · {zone.score}</span>
            </div>

            {causal.downstream.length > 0 && (
              <div className="mt-3">
                <div className="font-body text-muted text-label mb-1.5 flex items-center gap-1">
                  <ArrowDown size={10} className="text-muted" />Downstream exposure
                </div>
                <div className="space-y-1.5">
                  {causal.downstream.map((d, i) => (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 border border-l-4 ${d.risk === 'high' ? 'border-danger/20 border-l-danger bg-danger/[0.02]' : d.risk === 'medium' ? 'border-warn/20 border-l-warn' : 'border-rule2 border-l-ok/40'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-label leading-snug">{d.label}</div>
                        <div className="font-body text-muted text-label leading-snug mt-0.5">{d.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {causal.propagation && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-danger/[0.04] border border-danger/20">
                <Zap size={10} className="text-danger flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span className="font-body text-danger text-label leading-snug">{causal.propagation}</span>
              </div>
            )}
          </div>
        )}

        {/* Vessels */}
        {allVessels.length > 0 && (
          <div className="border-b border-rule2">
            <SectionHeader label={`${allVessels.length} vessels`} />
            <VesselGrid vessels={allVessels} />
          </div>
        )}

        {/* Environment */}
        {(zone.temperature || zone.humidity) && (
          <div className="px-5 py-3 border-b border-rule2 flex items-center gap-3">
            <span className="font-body text-muted text-label">Environment</span>
            {zone.temperature && <EnvChip label="Temp" val={zone.temperature.val} tone={zone.temperature.tone} />}
            {zone.humidity    && <EnvChip label="RH"   val={zone.humidity.val}    tone={zone.humidity.tone} />}
          </div>
        )}

        {/* Recommended actions */}
        {causal.actions.length > 0 && (
          <div className="px-5 py-4">
            <div className="font-body text-muted text-label mb-2">Recommended actions</div>
            <div className="space-y-2">
              {causal.actions.map((a, i) => (
                <div key={i} className="border border-rule2 px-4 py-3">
                  <div className="font-body font-medium text-ink text-label mb-0.5">{a.label}</div>
                  <div className="font-body text-muted text-label leading-snug">{a.consequence}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allVessels.length === 0 && causal.upstream.length === 0 && causal.downstream.length === 0 && (
          <div className="font-body text-muted text-label">No pressure detected in this zone.</div>
        )}
    </div>
  )
}

// ── Reasoning Surface (Variant C) ───────────────────────────────────────────

function ReasoningPanel({ zone, building }) {
  if (!zone) return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
      <Activity size={20} className="text-muted/40" strokeWidth={1.5} />
      <div>
        <div className="font-body text-muted text-label leading-relaxed">Select a zone to see why the system thinks this</div>
      </div>
    </div>
  )

  const r = REASONING_MAP[zone.id] ?? DEFAULT_REASONING
  const statusLabel = zone.score >= 90 ? 'Clear' : zone.score >= 80 ? 'Watch' : zone.score >= 70 ? 'At risk' : 'Critical'
  const statusColor = zone.score >= 90 ? 'text-ok' : zone.score >= 80 ? 'text-signal' : zone.score >= 70 ? 'text-warn' : 'text-danger'
  const confColor = r.confidence != null ? (r.confidence >= 80 ? 'text-ok' : r.confidence >= 65 ? 'text-warn' : 'text-danger') : 'text-muted'
  const confBg = r.confidence != null ? (r.confidence >= 80 ? 'bg-ok' : r.confidence >= 65 ? 'bg-warn' : 'bg-danger') : 'bg-muted'

  return (
    <div className="space-y-4">

      {/* Score + confidence */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {r.confidence != null && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body text-muted text-label">Confidence</span>
                <span className={`font-body text-label font-medium tabular-nums ${confColor}`}>{r.confidence}%</span>
              </div>
              <div className="h-1 bg-rule2 w-[120px]">
                <div className={`h-full transition-[width] ${confBg}`} style={{ width: `${r.confidence}%` }} />
              </div>
              <div className="font-body text-muted/50 text-label mt-0.5">{r.confidenceModel}</div>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`display-num text-score leading-none ${scoreColor(zone.score)}`}><AnimatedScore value={zone.score} effect="glow" /></div>
          <div className={`font-body font-bold text-label ${statusColor}`}>{statusLabel}</div>
        </div>
      </div>

        {r.recommendation && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-muted text-label mb-2">Recommendation</div>
            <div className="font-body text-ink text-body leading-relaxed">{r.recommendation}</div>
          </div>
        )}

        {r.primaryContributors.length > 0 && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-muted text-label mb-3">What's driving this</div>
            <div className="space-y-2.5">
              {r.primaryContributors.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
                  <div className="flex-1 min-w-0 font-body text-ink text-label leading-snug">{c.label}</div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-[52px] h-0.5 bg-rule2">
                      <div className="h-full bg-ok" style={{ width: `${c.pct * (100 / 52)}%`, maxWidth: '100%' }} />
                    </div>
                    <span className="font-body text-muted text-label tabular-nums w-7 text-right">+{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.suppressedContributors.length > 0 && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-muted text-label mb-3">Not used</div>
            <div className="space-y-2">
              {r.suppressedContributors.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full border border-muted/30 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-muted text-label leading-snug">{s.label}</div>
                    <div className="font-body text-muted/50 text-label leading-snug mt-0.5">{s.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.competingHypotheses.length > 0 && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-muted text-label mb-3">Other explanations</div>
            <div className="space-y-2">
              {r.competingHypotheses.map((h, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-stone2">
                  <span className="font-body font-bold text-muted text-label flex-shrink-0 mt-0.5">{String.fromCharCode(65 + i)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-body font-medium text-ink text-label leading-snug">{h.label}</span>
                      <span className={`font-body text-label tabular-nums flex-shrink-0 ${h.confidence >= 50 ? 'text-warn' : 'text-muted'}`}>{h.confidence}%</span>
                    </div>
                    <div className="font-body text-muted text-label leading-snug">{h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.forecastIfUnbounded && (
          <div className="px-5 py-4">
            <div className="font-body text-muted text-label mb-2">If nothing changes</div>
            <div className="flex items-start gap-2 px-3 py-2.5 border border-danger/20 bg-danger/[0.03]">
              <Zap size={10} className="text-danger flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="font-body text-danger text-label leading-snug">{r.forecastIfUnbounded}</div>
            </div>
          </div>
        )}

        {!r.recommendation && r.primaryContributors.length === 0 && (
          <div className="font-body text-muted text-label">No active reasoning for this zone — system stable.</div>
        )}
    </div>
  )
}

// ── Variant A: Operational State Field ───────────────────────────────────────

function StateFieldView({ site, variant, onVariantChange }) {
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [rightTab, setRightTab] = useState('context')

  // Flatten all zones with their building context for summary stats
  const allZones = site.buildings.flatMap(b => (b.zones ?? []).map(z => ({ ...z, _building: b })))
  const pressureZones = allZones.filter(z => z.score < 80)
  const alertZones    = allZones.filter(z => z.alert)

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <ShiftHero
        score={74}
        domainLabel="Site integrity"
        statement="Zone 3A operating near threshold. Temp excursion logged 06:31. Environmental swab result pending."
        scanInterval="4 min"
        trend="↑ +6 since 06:20"
      />

      {/* System pressure summary + view toggle */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-b border-rule2 bg-stone2 text-label font-body">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
          <span className="text-danger font-medium">{pressureZones.length} zone{pressureZones.length !== 1 ? 's' : ''} at risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={9} strokeWidth={2} className="text-warn flex-shrink-0" />
          <span className="text-warn">{alertZones.length} active alert{alertZones.length !== 1 ? 's' : ''}</span>
        </div>
        <SegmentedControl
          options={[{ value: 'A', label: 'State' }, { value: 'B', label: 'Structure' }]}
          value={variant}
          onChange={onVariantChange}
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* State field */}
        <div className="flex-1 overflow-y-auto p-6 page-rise">
          {/* Pressure legend */}
          <div className="flex items-center gap-4 mb-6">
            <span className="font-body text-muted text-label">Pressure intensity</span>
            {[
              { label: 'Clear',    color: 'bg-ok',     range: '90+' },
              { label: 'Watch',    color: 'bg-signal',  range: '80–89' },
              { label: 'At risk',  color: 'bg-warn',   range: '70–79' },
              { label: 'Critical', color: 'bg-danger', range: '<70' },
            ].map(({ label, color, range }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                <span className="font-body text-muted text-label">{label} <span className="opacity-60">({range})</span></span>
              </div>
            ))}
          </div>

          {/* Building clusters */}
          {site.buildings.map(b => (
            <div key={b.id} className="mb-8">
              {/* Building label */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-px h-4 ${scoreBg(b.score)}`} />
                <span className="font-body text-muted text-label">{b.name}</span>
                <span className="font-body text-muted/50 text-label">— {b.label}</span>
                <span className={`font-body font-medium text-label ml-auto ${scoreColor(b.score)}`}>{b.score}</span>
              </div>

              {/* Zone pressure cells */}
              <div className="flex flex-wrap gap-3">
                {(b.zones ?? []).map(z => {
                  const isSelected = selectedZone?.id === z.id
                  const hasAlert = !!z.alert
                  const pressure = pressureBg(z.score)
                  const ring = pressureRing(z.score, hasAlert)
                  const sc = scoreColor(z.score)
                  const statusLabel = z.score >= 90 ? 'Clear' : z.score >= 80 ? 'Watch' : z.score >= 70 ? 'At risk' : 'Critical'
                  return (
                    <button key={z.id} type="button"
                      onClick={() => { setSelectedZone(z); setSelectedBuilding(b) }}
                      className={`relative text-left px-4 py-3.5 border transition-colors w-[180px] ${pressure} ${ring} ${
                        isSelected ? 'border-ink/30 bg-stone2' : 'border-rule2 hover:border-rule'
                      }`}>
                      {hasAlert && (
                        <span className="absolute top-2 right-2">
                          <AlertTriangle size={9} className="text-warn animate-pulse" strokeWidth={2} />
                        </span>
                      )}
                      <div className="font-body text-muted text-label mb-1">{z.name}</div>
                      <div className="font-body font-medium text-ink text-body leading-snug mb-2">{z.label}</div>
                      <div className={`display-num text-head leading-none ${sc} mb-1`}>{z.score}</div>
                      <div className="flex items-center justify-between">
                        <span className={`font-body text-label font-medium ${sc}`}>{statusLabel}</span>
                        <span className="font-body text-muted text-label">{z.vessels}v</span>
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {selectedZone && (
        <SlidePanel
          title={selectedZone.label}
          subtitle={`${selectedBuilding.name} · ${selectedBuilding.label}`}
          onClose={() => { setSelectedZone(null); setSelectedBuilding(null); setRightTab('context') }}
          maxWidth="480px"
        >
          {/* Tab toggle */}
          <Tabs
            tabs={[{ id: 'context', label: 'Causal context' }, { id: 'reasoning', label: 'Reasoning' }]}
            active={rightTab}
            onChange={setRightTab}
            flush
          />
          {rightTab === 'reasoning'
            ? <ReasoningPanel zone={selectedZone} building={selectedBuilding} />
            : <CausalPanel zone={selectedZone} building={selectedBuilding} />
          }
        </SlidePanel>
      )}
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function ProcessHierarchy() {
  const site = processHierarchy.site
  const [path, setPath] = useState([])
  const [variant, setVariant] = useState('A')
  const [treeExpanded, setTreeExpanded] = useState(new Set(['bld-a']))
  const [treeSelected, setTreeSelected] = useState(null)

  const selectedBuilding = path[0] ? site.buildings.find(b => b.id === path[0]) : null
  const selectedZone     = path[1] && selectedBuilding ? selectedBuilding.zones.find(z => z.id === path[1]) : null
  const selectedProcess  = path[2] && selectedZone ? selectedZone.processes.find(p => p.id === path[2]) : null

  const crumbs = [site.name]
  if (selectedBuilding) crumbs.push(selectedBuilding.name + ' — ' + selectedBuilding.label)
  if (selectedZone)     crumbs.push(selectedZone.name + ' — ' + selectedZone.label)
  if (selectedProcess)  crumbs.push(selectedProcess.name)

  const navigateTo = (level) => setPath(prev => prev.slice(0, level))

  // ── Variant A: Operational State Field ──────────────────────────────────
  if (variant === 'A') {
    return <StateFieldView site={site} variant={variant} onVariantChange={(v) => { setVariant(v); setPath([]) }} />
  }

  // ── Variant B: Structural Explorer (audit / forensics) ────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <ShiftHero
        score={74}
        domainLabel="Site integrity"
        statement="Zone 3A operating near threshold. Temp excursion logged 06:31. Environmental swab result pending."
        scanInterval="4 min"
        trend="↑ +6 since 06:20"
      />
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-b border-rule2 bg-stone2 font-body text-label">
        {selectedBuilding ? (
          <Breadcrumb crumbs={crumbs} onNavigate={navigateTo} />
        ) : (
                <div className="flex-shrink-0 flex items-center gap-2">
        <Info size={11} className="text-muted flex-shrink-0" strokeWidth={2} />
        <span className="font-body text-muted text-label">For audit, compliance, and forensic analysis.</span>
      </div>
        )}
        <SegmentedControl
          options={[{ value: 'A', label: 'State' }, { value: 'B', label: 'Structure' }]}
          value={variant}
          onChange={v => { setVariant(v); setPath([]) }}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {!selectedBuilding && (
          <div>
            <SectionHeader label={`${site.code} · ${site.location}`} sub={`${site.vessels} vessels · ${site.workers.toLocaleString()} workers`} />
            <div className="divide-y divide-rule2">
              {site.buildings.map(b => {
                // Derive stage mix across all zones in this building
                const allVessels = (b.zones ?? []).flatMap(z => (z.processes ?? []).flatMap(p => p.vessels ?? []))
                const stageCounts = {}
                const typeCounts = { tank: 0, chamber: 0 }
                allVessels.forEach(v => {
                  const s = v.stage ?? 'unknown'
                  stageCounts[s] = (stageCounts[s] ?? 0) + 1
                  if (v.id.startsWith('F-')) typeCounts.tank++
                  else if (v.id.startsWith('K-')) typeCounts.chamber++
                })
                return (
                  <button key={b.id} type="button" onClick={() => setPath([b.id])}
                    className="group w-full text-left px-5 py-4 hover:bg-stone2 transition-colors">
                    <div className="flex items-start gap-4">
                      <ScoreDot score={b.score} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-display font-bold text-ink text-base">{b.name}</span>
                          <span className="font-body text-muted text-label">{b.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-label font-body text-muted mb-2">
                          <span>{b.zones?.length ?? 0} zones</span><span>·</span>
                          <span>{b.vessels} vessels</span><span>·</span>
                          <span className="text-muted">{b.activeBatches} active batches</span>
                        </div>
                        {/* Vessel-type distribution */}
                        {(typeCounts.tank > 0 || typeCounts.chamber > 0) && (
                          <div className="flex items-center gap-2 mb-2">
                            {typeCounts.tank > 0 && (
                              <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{typeCounts.tank} F-tanks</span>
                            )}
                            {typeCounts.chamber > 0 && (
                              <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{typeCounts.chamber} K-chambers</span>
                            )}
                          </div>
                        )}
                        {/* Active stage mix chips */}
                        {Object.keys(stageCounts).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stageCounts).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center font-body text-label px-1.5 py-0.5 ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBar score={b.score} />
                        <ChevronRight size={12} className="text-muted group-hover:text-ink flex-shrink-0" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {selectedBuilding && !selectedZone && (
          <div>
            <SectionHeader label={selectedBuilding.name} sub={selectedBuilding.label} badge={<span className="font-body text-muted text-label">{selectedBuilding.zones?.length} zones</span>} />
            <div className="divide-y divide-rule2">
              {(selectedBuilding.zones ?? []).map(z => {
                const stats = getZoneStats(z)
                const lineage = ZONE_LINEAGE[z.id] ?? { feedsFrom: [], feedsInto: [] }
                return (
                  <button key={z.id} type="button" onClick={() => setPath([selectedBuilding.id, z.id])}
                    className="group w-full text-left px-5 py-4 hover:bg-stone2 transition-colors">
                    <div className="flex items-start gap-4">
                      <ScoreDot score={z.score} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-display font-bold text-ink text-body">{z.name}</span>
                          <span className="font-body text-muted text-label">{z.label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-label font-body text-muted mb-1.5">
                          <span>{z.processes?.length ?? 0} processes</span><span>·</span>
                          <span className="text-muted">{z.activeBatches} active batches</span>
                          {z.temperature && <EnvChip label="Temp" val={z.temperature.val} tone={z.temperature.tone} />}
                          {z.humidity    && <EnvChip label="RH"   val={z.humidity.val}    tone={z.humidity.tone} />}
                        </div>
                        {/* Lineage indicators */}
                        {(lineage.feedsFrom.length > 0 || lineage.feedsInto.length > 0) && (
                          <div className="flex items-center gap-3 mb-1.5">
                            {lineage.feedsFrom.length > 0 && (
                              <span className="font-body text-muted text-label flex items-center gap-1">
                                ↑ from <span className="text-muted">{lineage.feedsFrom.map(id => ZONE_NAMES[id]).join(', ')}</span>
                              </span>
                            )}
                            {lineage.feedsInto.length > 0 && (
                              <span className="font-body text-muted text-label flex items-center gap-1">
                                ↓ feeds <span className="text-muted">{lineage.feedsInto.map(id => ZONE_NAMES[id]).join(', ')}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {/* Vessel-type distribution */}
                        {stats.total > 0 && (
                          <div className="flex items-center gap-2 mb-1.5">
                            {stats.types.tank > 0 && <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{stats.types.tank} F-tanks</span>}
                            {stats.types.chamber > 0 && <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{stats.types.chamber} K-chambers</span>}
                          </div>
                        )}
                        {/* Process-stage chips */}
                        {Object.keys(stats.stages).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stats.stages).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center font-body text-label px-1.5 py-0.5 ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {z.alert && <div className="flex items-center gap-1 text-warn text-label mt-1.5"><AlertTriangle size={9} strokeWidth={2} />{z.alert.msg}</div>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBar score={z.score} />
                        <ChevronRight size={12} className="text-muted group-hover:text-ink flex-shrink-0" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {selectedZone && !selectedProcess && (
          <div>
            <div className="px-5 py-3.5 border-b border-rule2 bg-stone2">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-ink text-base">{selectedZone.name}</span>
                  <span className="font-body text-muted text-label">{selectedZone.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedZone.temperature && <EnvChip label="Temp" val={selectedZone.temperature.val} tone={selectedZone.temperature.tone} />}
                  {selectedZone.humidity    && <EnvChip label="RH"   val={selectedZone.humidity.val}    tone={selectedZone.humidity.tone} />}
                </div>
              </div>
              {/* Zone lineage */}
              {(() => {
                const lin = ZONE_LINEAGE[selectedZone.id] ?? { feedsFrom: [], feedsInto: [] }
                if (!lin.feedsFrom.length && !lin.feedsInto.length) return null
                return (
                  <div className="flex items-center gap-4 text-label font-body text-muted">
                    {lin.feedsFrom.length > 0 && (
                      <span className="flex items-center gap-1">↑ receives from <span className="text-muted font-medium">{lin.feedsFrom.map(id => ZONE_NAMES[id]).join(', ')}</span></span>
                    )}
                    {lin.feedsInto.length > 0 && (
                      <span className="flex items-center gap-1">↓ outputs to <span className="text-muted font-medium">{lin.feedsInto.map(id => ZONE_NAMES[id]).join(', ')}</span></span>
                    )}
                  </div>
                )
              })()}
            </div>
            {selectedZone.processes.length === 0
              ? <div className="px-5 py-8 font-body text-muted text-body">No active processes in this zone.</div>
              : selectedZone.processes.map(proc => {
                const vessels = proc.vessels ?? []
                const stageCounts = {}
                const typeCounts = { tank: 0, chamber: 0 }
                vessels.forEach(v => {
                  const s = v.stage ?? 'unknown'; stageCounts[s] = (stageCounts[s] ?? 0) + 1
                  if (v.id.startsWith('F-')) typeCounts.tank++
                  else if (v.id.startsWith('K-')) typeCounts.chamber++
                })
                return (
                  <div key={proc.id} className="border-b border-rule2">
                    <button type="button" onClick={() => setPath([selectedBuilding.id, selectedZone.id, proc.id])}
                      className="group w-full text-left px-5 py-3.5 hover:bg-stone2 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-ink text-body mb-0.5">{proc.name}</div>
                          <div className="flex items-center gap-2 text-label font-body text-muted mb-2">
                            <span>{proc.sku}</span><span>·</span>
                            <span className="text-muted">{proc.activeBatches} batches</span><span>·</span>
                            <span className="text-muted">{vessels.length} vessels</span>
                          </div>
                          {/* Vessel type distribution */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {typeCounts.tank > 0 && <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{typeCounts.tank} F-tanks</span>}
                            {typeCounts.chamber > 0 && <span className="font-body text-muted text-label px-1.5 py-0.5 bg-stone3">{typeCounts.chamber} K-chambers</span>}
                          </div>
                          {/* Stage chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stageCounts).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center font-body text-label px-1.5 py-0.5 ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-muted group-hover:text-ink flex-shrink-0 mt-1" />
                      </div>
                    </button>
                    <div className="border-t border-rule2"><VesselGrid vessels={vessels} /></div>
                  </div>
                )
              })}
          </div>
        )}
        {selectedProcess && (
          <div>
            <SectionHeader label={selectedProcess.name} sub={selectedProcess.sku} />
            <VesselGrid vessels={selectedProcess.vessels ?? []} />
            <div className="px-5 py-6 font-body text-muted text-label">Select a vessel to open its batch intelligence record.</div>
          </div>
        )}
      </div>
    </div>
  )
}
