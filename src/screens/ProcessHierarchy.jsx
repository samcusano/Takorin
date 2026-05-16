// Process Hierarchy — Causal State Resolution Layer
// Users come to answer: "Where is instability forming, and what should I do about it?"
// Primary surface: Operational State Field (Variant A)
// Secondary: Structural Explorer for audit/forensics (Variant B)
// Tertiary: Global Overview snapshot (Variant C)

import { useState } from 'react'
import { processHierarchy } from '../data/hierarchy'
import { AlertTriangle, ChevronRight, ChevronDown, ArrowRight, ArrowDown, Activity, Zap, TrendingDown, Info } from 'lucide-react'

const scoreColor  = (s) => s >= 90 ? 'text-ok'     : s >= 80 ? 'text-ochre'   : s >= 70 ? 'text-warn'   : 'text-danger'
const scoreBg     = (s) => s >= 90 ? 'bg-ok'        : s >= 80 ? 'bg-ochre'     : s >= 70 ? 'bg-warn'     : 'bg-danger'
const pressureBg  = (s) => s >= 90 ? ''             : s >= 83 ? 'bg-ochre/[0.05]' : s >= 75 ? 'bg-warn/[0.10]' : 'bg-danger/[0.18]'
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
  'primary':   'bg-ochre/10 text-ochre border-ochre/30',
  'secondary': 'bg-ok/10 text-ok border-ok/30',
  'koji':      'bg-muted/10 text-muted border-rule2',
  'complete':  'bg-ok/[0.06] text-ok/70 border-ok/20',
  'unknown':   'bg-stone3 text-ghost border-rule2',
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

function ScoreDot({ score }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-ochre' : score >= 70 ? 'bg-warn' : 'bg-danger'
  return <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />
}

function ScoreBar({ score, width = 60 }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-ochre' : score >= 70 ? 'bg-warn' : 'bg-danger'
  const textColor = scoreColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="h-0.5 bg-rule2 flex-shrink-0" style={{ width }}>
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-display font-bold display-num text-[14px] tabular-nums ${textColor}`}>{score}</span>
    </div>
  )
}

function EnvChip({ label, val, tone }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 border ${tone === 'ok' ? 'border-ok/20 bg-ok/[0.04]' : 'border-warn/30 bg-warn/[0.04]'}`}>
      <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{label}</span>
      <span className={`font-body font-medium text-[11px] tabular-nums ${tone === 'ok' ? 'text-ok' : 'text-warn'}`}>{val}</span>
    </div>
  )
}

function VesselGrid({ vessels }) {
  return (
    <div className="grid grid-cols-3 gap-px bg-rule2">
      {vessels.map(v => {
        const toneColor = v.tone === 'ok' ? 'text-ok' : v.tone === 'warn' ? 'text-warn' : 'text-ghost'
        const isComplete = v.stage === 'complete'
        return (
          <div key={v.id} className={`bg-stone px-3 py-2.5 ${v.alert ? 'bg-warn/[0.03]' : ''}`}>
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <span className="font-body font-medium text-ink text-[11px]">{v.id}</span>
              <span className={`font-body text-[10px] tabular-nums ${toneColor}`}>{v.confidence}%</span>
            </div>
            <div className="font-body text-ghost text-[9px] truncate">{v.batch}</div>
            <div className="h-0.5 bg-rule2 mt-1.5 mb-1">
              <div className={`h-full ${isComplete ? 'bg-ok' : 'bg-ochre/60'}`}
                style={{ width: `${Math.min(100, (v.daysElapsed / 185) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-ghost text-[8px]">{v.daysElapsed}d</span>
              {v.alert && <AlertTriangle size={8} className="text-warn flex-shrink-0" strokeWidth={2} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Breadcrumb({ crumbs, onNavigate }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={10} className="text-ghost flex-shrink-0" />}
          {i < crumbs.length - 1
            ? <button type="button" onClick={() => onNavigate(i)} className="font-body text-muted text-[11px] hover:text-ink transition-colors">{c}</button>
            : <span className="font-display font-bold text-ink text-[13px]">{c}</span>
          }
        </div>
      ))}
    </div>
  )
}

// ── Variant A: Operational State Field ───────────────────────────────────────

function CausalPanel({ zone, building }) {
  if (!zone) return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
      <Activity size={24} className="text-ghost/40" strokeWidth={1.5} />
      <div>
        <div className="font-body text-ghost text-[11px] leading-relaxed">Click a pressure zone to resolve its causal context</div>
        <div className="font-body text-ghost/50 text-[10px] mt-1">Hierarchy is inferred from the state you select</div>
      </div>
    </div>
  )

  const causal = CAUSAL_MAP[zone.id] ?? DEFAULT_CAUSAL
  const allVessels = (zone.processes ?? []).flatMap(p => p.vessels ?? [])
  const pressureZone = zone.score < 80
  const statusLabel = zone.score >= 90 ? 'CLEAR' : zone.score >= 80 ? 'WATCH' : zone.score >= 70 ? 'AT RISK' : 'CRITICAL'
  const statusColor = zone.score >= 90 ? 'text-ok' : zone.score >= 80 ? 'text-ochre' : zone.score >= 70 ? 'text-warn' : 'text-danger'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Zone + building context header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{building.name} · {building.label}</div>
            <div className="font-display font-bold text-ink text-[18px] leading-none mb-1">{zone.label}</div>
            <div className="font-body text-ghost text-[10px]">{zone.name} · {zone.vessels} vessels · {zone.activeBatches} active batches</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-display font-bold display-num text-[32px] leading-none ${scoreColor(zone.score)}`}>{zone.score}</div>
            <div className={`font-body font-bold text-[10px] uppercase tracking-widest ${statusColor}`}>{statusLabel}</div>
          </div>
        </div>
        {zone.alert && (
          <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-warn/[0.06] border border-warn/30 border-l-4 border-l-warn">
            <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-body text-warn text-[10px] leading-snug">{zone.alert.msg}</span>
          </div>
        )}
        {causal.confidence != null && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="font-body text-ghost text-[9px]">Attribution confidence</span>
            <div className="flex-1 h-0.5 bg-rule2">
              <div className={`h-full ${causal.confidence >= 70 ? 'bg-ok' : causal.confidence >= 50 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${causal.confidence}%` }} />
            </div>
            <span className={`font-body text-[9px] tabular-nums ${causal.confidence >= 70 ? 'text-ok' : causal.confidence >= 50 ? 'text-warn' : 'text-danger'}`}>{causal.confidence}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Causal chain — upstream → current → downstream */}
        {(causal.upstream.length > 0 || causal.downstream.length > 0) && (
          <div className="px-5 py-4 border-b border-rule2">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Causal chain</div>

            {causal.upstream.length > 0 && (
              <div className="mb-3">
                <div className="font-body text-ghost text-[9px] mb-1.5 flex items-center gap-1">
                  <ArrowDown size={8} className="text-ghost rotate-180" />Upstream contributors
                </div>
                <div className="space-y-1.5">
                  {causal.upstream.map((u, i) => (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 border border-l-4 ${u.tone === 'warn' ? 'border-warn/30 border-l-warn bg-warn/[0.03]' : u.tone === 'danger' ? 'border-danger/30 border-l-danger bg-danger/[0.03]' : 'border-rule2 border-l-ok'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-[10px] leading-snug">{u.label}</div>
                        <div className="font-body text-muted text-[9px] leading-snug mt-0.5">{u.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current zone marker */}
            <div className="flex items-center gap-2 py-2 px-3 bg-stone2 border border-rule2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scoreBg(zone.score)}`} />
              <span className="font-body font-medium text-ink text-[11px]">{zone.label}</span>
              <span className={`font-body font-bold text-[10px] ml-auto ${statusColor}`}>{statusLabel} · {zone.score}</span>
            </div>

            {causal.downstream.length > 0 && (
              <div className="mt-3">
                <div className="font-body text-ghost text-[9px] mb-1.5 flex items-center gap-1">
                  <ArrowDown size={8} className="text-ghost" />Downstream exposure
                </div>
                <div className="space-y-1.5">
                  {causal.downstream.map((d, i) => (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 border border-l-4 ${d.risk === 'high' ? 'border-danger/20 border-l-danger bg-danger/[0.02]' : d.risk === 'medium' ? 'border-warn/20 border-l-warn' : 'border-rule2 border-l-ok/40'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-[10px] leading-snug">{d.label}</div>
                        <div className="font-body text-muted text-[9px] leading-snug mt-0.5">{d.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {causal.propagation && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-danger/[0.04] border border-danger/20">
                <Zap size={10} className="text-danger flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span className="font-body text-danger text-[9px] leading-snug">{causal.propagation}</span>
              </div>
            )}
          </div>
        )}

        {/* Vessels */}
        {allVessels.length > 0 && (
          <div className="border-b border-rule2">
            <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{allVessels.length} vessels</span>
            </div>
            <VesselGrid vessels={allVessels} />
          </div>
        )}

        {/* Environment */}
        {(zone.temperature || zone.humidity) && (
          <div className="px-5 py-3 border-b border-rule2 flex items-center gap-3">
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Environment</span>
            {zone.temperature && <EnvChip label="Temp" val={zone.temperature.val} tone={zone.temperature.tone} />}
            {zone.humidity    && <EnvChip label="RH"   val={zone.humidity.val}    tone={zone.humidity.tone} />}
          </div>
        )}

        {/* Recommended actions */}
        {causal.actions.length > 0 && (
          <div className="px-5 py-4">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Recommended actions</div>
            <div className="space-y-2">
              {causal.actions.map((a, i) => (
                <div key={i} className="border border-rule2 px-4 py-3">
                  <div className="font-body font-medium text-ink text-[11px] mb-0.5">{a.label}</div>
                  <div className="font-body text-ghost text-[9px] leading-snug">{a.consequence}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allVessels.length === 0 && causal.upstream.length === 0 && causal.downstream.length === 0 && (
          <div className="px-5 py-6 font-body text-ghost text-[11px]">No pressure detected in this zone.</div>
        )}
      </div>
    </div>
  )
}

function StateFieldView({ site, ScreenHeader }) {
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  // Flatten all zones with their building context for summary stats
  const allZones = site.buildings.flatMap(b => (b.zones ?? []).map(z => ({ ...z, _building: b })))
  const pressureZones = allZones.filter(z => z.score < 80)
  const alertZones    = allZones.filter(z => z.alert)

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <ScreenHeader />

      {/* System pressure summary */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-b border-rule2 bg-stone2 text-[10px] font-body">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
          <span className="text-danger font-medium">{pressureZones.length} pressure zone{pressureZones.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={9} strokeWidth={2} className="text-warn flex-shrink-0" />
          <span className="text-warn">{alertZones.length} active alert{alertZones.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-ghost ml-auto">Click a zone to resolve causal context</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* State field */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Pressure legend */}
          <div className="flex items-center gap-4 mb-6">
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Pressure intensity</span>
            {[
              { label: 'Clear',    color: 'bg-ok',     range: '90+' },
              { label: 'Watch',    color: 'bg-ochre',  range: '80–89' },
              { label: 'At risk',  color: 'bg-warn',   range: '70–79' },
              { label: 'Critical', color: 'bg-danger', range: '<70' },
            ].map(({ label, color, range }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                <span className="font-body text-ghost text-[9px]">{label} <span className="opacity-60">({range})</span></span>
              </div>
            ))}
          </div>

          {/* Building clusters */}
          {site.buildings.map(b => (
            <div key={b.id} className="mb-8">
              {/* Building label */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-px h-4 ${scoreBg(b.score)}`} />
                <span className="font-body text-ghost text-[10px] uppercase tracking-widest">{b.name}</span>
                <span className="font-body text-ghost/50 text-[10px]">— {b.label}</span>
                <span className={`font-body font-medium text-[10px] ml-auto ${scoreColor(b.score)}`}>{b.score}</span>
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
                      className={`relative text-left px-4 py-3.5 border transition-all w-[180px] ${pressure} ${ring} ${
                        isSelected ? 'border-ink/30 bg-stone2' : 'border-rule2 hover:border-rule'
                      }`}>
                      {hasAlert && (
                        <span className="absolute top-2 right-2">
                          <AlertTriangle size={9} className="text-warn animate-pulse" strokeWidth={2} />
                        </span>
                      )}
                      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">{z.name}</div>
                      <div className="font-body font-medium text-ink text-[12px] leading-snug mb-2">{z.label}</div>
                      <div className={`font-display font-bold display-num text-[24px] leading-none ${sc} mb-1`}>{z.score}</div>
                      <div className="flex items-center justify-between">
                        <span className={`font-body text-[9px] font-medium uppercase tracking-widest ${sc}`}>{statusLabel}</span>
                        <span className="font-body text-ghost text-[9px]">{z.vessels}v</span>
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

        {/* Causal context panel */}
        <div className="w-[380px] flex-shrink-0 border-l border-rule2 bg-stone overflow-hidden">
          <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Causal context</span>
          </div>
          <div className="h-[calc(100%-36px)]">
            <CausalPanel zone={selectedZone} building={selectedBuilding} />
          </div>
        </div>
      </div>
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

  const ScreenHeader = () => (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-rule2 bg-stone">
      <div className="flex-1 min-w-0">
        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Platform Architecture · Process Hierarchy</div>
        {variant === 'B' ? (
          <Breadcrumb crumbs={crumbs} onNavigate={navigateTo} />
        ) : (
          <div className="font-display font-bold text-ink text-[15px] leading-none">Gaoming Factory · Operational State</div>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <div className={`font-display font-bold display-num text-[28px] leading-none ${scoreColor(site.score)}`}>{site.score}</div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest">site health</div>
        </div>
        <div className="text-right border-l border-rule2 pl-4">
          <div className="font-display font-bold display-num text-[28px] leading-none text-ochre">{site.activeBatches}</div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest">active batches</div>
        </div>
        <div className="flex items-stretch border border-rule2 overflow-hidden ml-2">
          {[
            { v: 'A', label: 'State' },
            { v: 'B', label: 'Structure' },
            { v: 'C', label: 'Forecast' },
          ].map(({ v, label }) => (
            <button key={v} type="button" onClick={() => { setVariant(v); setPath([]) }}
              className={`font-body text-[10px] px-3 py-1 transition-colors ${variant === v ? 'bg-ink text-stone' : 'text-ghost hover:text-muted'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Variant A: Operational State Field ──────────────────────────────────
  if (variant === 'A') {
    return <StateFieldView site={site} ScreenHeader={ScreenHeader} />
  }

  // ── Variant C: Forecast ─────────────────────────────────────────────────
  if (variant === 'C') {
    // Forecast data: what is the system becoming?
    const allZones = site.buildings.flatMap(b => (b.zones ?? []).map(z => ({ ...z, _building: b })))
    const ZONE_FORECASTS = [
      {
        zoneId: 'zone-a1', zoneName: 'Zone A1 — Primary Fermentation', building: 'Building A',
        trend: 'declining', currentScore: 79, delta7d: -5, delta14d: -9,
        stabilityTrajectory: 'degrading',
        driftVelocity: 'accelerating', driftLabel: '-0.7 pts/day',
        confidenceDecay: { current: 71, rate: '-3%/week', cause: 'Benzaldehyde sensor A-7 drift' },
        propagationRisk: { zones: ['zone-a2'], probability: 0.62, timeframe: '14–21 days', label: 'Zone A2 — Secondary Fermentation' },
        bottleneck: { label: 'Premium grade ceiling breach', probability: 0.45, timeframe: '10 days' },
        interventionImpact: [
          { action: 'Temp reduction 26°C', impact: 'Stabilizes benzaldehyde — score floor at 77', confidence: 0.71 },
          { action: 'Sensor A-7 recalibration', impact: 'Restores confidence to 86%', confidence: 0.88 },
        ],
        pressureMigration: { target: 'zone-a2', probability: 0.62 },
      },
      {
        zoneId: 'zone-b1', zoneName: 'Zone B1 — Primary Fermentation', building: 'Building B',
        trend: 'stable', currentScore: 87, delta7d: 0, delta14d: +1,
        stabilityTrajectory: 'holding',
        driftVelocity: 'minimal', driftLabel: '+0.1 pts/day',
        confidenceDecay: { current: 87, rate: 'stable', cause: null },
        propagationRisk: null,
        bottleneck: null,
        interventionImpact: [],
        pressureMigration: null,
      },
      {
        zoneId: 'zone-a2', zoneName: 'Zone A2 — Secondary Fermentation', building: 'Building A',
        trend: 'stable', currentScore: 88, delta7d: -1, delta14d: -3,
        stabilityTrajectory: 'early-watch',
        driftVelocity: 'slow', driftLabel: '-0.2 pts/day',
        confidenceDecay: { current: 84, rate: '-1%/week', cause: 'Upstream batch quality uncertainty from A1' },
        propagationRisk: { zones: ['zone-c1'], probability: 0.28, timeframe: '21–30 days', label: 'Zone C1 — Pressing' },
        bottleneck: { label: 'Batch BTH-2026-047 grade ceiling', probability: 0.28, timeframe: '21 days' },
        interventionImpact: [
          { action: 'Resolve A1 benzaldehyde issue', impact: 'Removes propagation risk entirely', confidence: 0.82 },
        ],
        pressureMigration: null,
      },
    ]

    const trendIcon = (t) => t === 'declining' ? '↓' : t === 'stable' ? '→' : '↑'
    const trendColor = (t) => t === 'declining' ? 'text-danger' : t === 'stable' ? 'text-ghost' : 'text-ok'
    const stabilityColor = (s) => s === 'degrading' ? 'text-danger' : s === 'early-watch' ? 'text-warn' : s === 'holding' ? 'text-ghost' : 'text-ok'
    const stabilityBg = (s) => s === 'degrading' ? 'bg-danger/[0.06] border-l-danger' : s === 'early-watch' ? 'bg-warn/[0.04] border-l-warn' : 'border-l-rule2'

    return (
      <div className="flex flex-col h-full overflow-hidden content-reveal">
        <ScreenHeader />

        {/* System trajectory summary */}
        <div className="flex-shrink-0 flex items-center gap-5 px-5 py-3 border-b border-rule2 bg-stone2 text-[10px] font-body">
          <div className="flex items-center gap-1.5">
            <span className="text-ghost uppercase tracking-widest text-[9px]">System trajectory</span>
            <span className="text-warn font-medium">↓ Mild degradation risk</span>
          </div>
          <div className="w-px h-4 bg-rule2" />
          <div className="flex items-center gap-1.5">
            <span className="text-ghost">Pressure origin</span>
            <span className="text-danger font-medium">Zone A1</span>
          </div>
          <div className="w-px h-4 bg-rule2" />
          <div className="flex items-center gap-1.5">
            <span className="text-ghost">Migration risk</span>
            <span className="text-warn font-medium">Zone A2 · 62% probability · 14–21d</span>
          </div>
          <div className="w-px h-4 bg-rule2" />
          <div className="flex items-center gap-1.5">
            <span className="text-ghost">Critical bottleneck</span>
            <span className="text-warn font-medium">Premium grade ceiling · 10 days</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Predicted pressure migration diagram */}
          <div className="px-6 py-4 border-b border-rule2">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-3">Predicted pressure migration</div>
            <div className="flex items-center gap-0 overflow-x-auto">
              {[
                { id: 'zone-a3', label: 'A3 · Koji',          score: 91, future: 91, status: 'stable'  },
                { id: 'zone-a1', label: 'A1 · Primary ferm',  score: 79, future: 70, status: 'origin'  },
                { id: 'zone-a2', label: 'A2 · Secondary ferm',score: 88, future: 85, status: 'at-risk' },
                { id: 'zone-c1', label: 'C1 · Pressing',      score: 94, future: 91, status: 'watch'   },
              ].map((z, i, arr) => {
                const statusCfg = {
                  origin:   { border: 'border-danger',  bg: 'bg-danger/[0.06]',  label: 'Origin',    lc: 'text-danger' },
                  'at-risk':{ border: 'border-warn',    bg: 'bg-warn/[0.05]',    label: 'At risk',   lc: 'text-warn'   },
                  watch:    { border: 'border-ochre/40',bg: 'bg-ochre/[0.03]',   label: 'Watch',     lc: 'text-ochre'  },
                  stable:   { border: 'border-rule2',   bg: '',                   label: 'Stable',    lc: 'text-ghost'  },
                }[z.status]
                const delta = z.future - z.score
                return (
                  <div key={z.id} className="flex items-center flex-shrink-0">
                    <div className={`border ${statusCfg.border} ${statusCfg.bg} px-3 py-3 w-[130px]`}>
                      <div className="font-body text-ghost text-[9px] truncate mb-1">{z.label}</div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`font-display font-bold display-num text-[20px] leading-none ${scoreColor(z.score)}`}>{z.score}</span>
                        <span className="font-body text-ghost text-[9px]">now</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-display font-bold display-num text-[16px] leading-none ${scoreColor(z.future)}`}>{z.future}</span>
                        <span className={`font-body text-[9px] ${delta < -3 ? 'text-danger' : delta < 0 ? 'text-warn' : 'text-ghost'}`}>14d · {delta > 0 ? '+' : ''}{delta}</span>
                      </div>
                      <div className={`font-body text-[8px] uppercase tracking-widest mt-1 ${statusCfg.lc}`}>{statusCfg.label}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center px-1 flex-shrink-0">
                        <ArrowRight size={12} className="text-ghost" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Zone forecasts */}
          <div className="divide-y divide-rule2">
            {ZONE_FORECASTS.map(f => (
              <div key={f.zoneId} className={`px-6 py-5 border-l-4 ${stabilityBg(f.stabilityTrajectory)}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{f.building}</div>
                    <div className="font-display font-bold text-ink text-[16px] leading-none">{f.zoneName}</div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-display font-bold display-num text-[24px] leading-none ${scoreColor(f.currentScore)}`}>{f.currentScore}</span>
                        <span className={`font-body text-[13px] font-bold ${trendColor(f.trend)}`}>{trendIcon(f.trend)}</span>
                      </div>
                      <div className="font-body text-ghost text-[9px]">{f.driftLabel}</div>
                    </div>
                    <div className="text-right border-l border-rule2 pl-3">
                      <div className="font-body text-ghost text-[9px] mb-0.5">7d</div>
                      <div className={`font-body font-medium text-[12px] ${f.delta7d < 0 ? 'text-warn' : 'text-ghost'}`}>{f.delta7d > 0 ? '+' : ''}{f.delta7d}</div>
                    </div>
                    <div className="text-right border-l border-rule2 pl-3">
                      <div className="font-body text-ghost text-[9px] mb-0.5">14d</div>
                      <div className={`font-body font-medium text-[12px] ${f.delta14d < -3 ? 'text-danger' : f.delta14d < 0 ? 'text-warn' : 'text-ghost'}`}>{f.delta14d > 0 ? '+' : ''}{f.delta14d}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Stability trajectory */}
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Stability trajectory</div>
                    <div className={`font-body font-medium text-[11px] capitalize ${stabilityColor(f.stabilityTrajectory)}`}>{f.stabilityTrajectory.replace('-', ' ')}</div>
                  </div>

                  {/* Confidence decay */}
                  <div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Signal confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-0.5 bg-rule2">
                        <div className={`h-full ${f.confidenceDecay.current >= 80 ? 'bg-ok' : f.confidenceDecay.current >= 65 ? 'bg-warn' : 'bg-danger'}`}
                          style={{ width: `${f.confidenceDecay.current}%` }} />
                      </div>
                      <span className={`font-body text-[10px] tabular-nums ${f.confidenceDecay.current >= 80 ? 'text-ok' : 'text-warn'}`}>{f.confidenceDecay.current}%</span>
                    </div>
                    {f.confidenceDecay.cause && (
                      <div className="font-body text-ghost text-[9px] mt-0.5 leading-snug">{f.confidenceDecay.cause}</div>
                    )}
                  </div>
                </div>

                {/* Propagation risk */}
                {f.propagationRisk && (
                  <div className="mb-3 px-3 py-2.5 border border-warn/30 bg-warn/[0.03]">
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Propagation risk</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <span className="font-body font-medium text-ink text-[11px]">{f.propagationRisk.label}</span>
                        <span className="font-body text-ghost text-[10px] ml-2">· {f.propagationRisk.timeframe}</span>
                      </div>
                      <span className="font-body font-medium text-warn text-[11px] flex-shrink-0">{Math.round(f.propagationRisk.probability * 100)}% probability</span>
                    </div>
                  </div>
                )}

                {/* Bottleneck + intervention impact */}
                {f.bottleneck && (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Future bottleneck</div>
                      <div className="font-body text-ink text-[11px]">{f.bottleneck.label}</div>
                      <div className="font-body text-ghost text-[9px]">{Math.round(f.bottleneck.probability * 100)}% probability · {f.bottleneck.timeframe}</div>
                    </div>
                    {f.interventionImpact.length > 0 && (
                      <div className="flex-1">
                        <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Intervention impact</div>
                        {f.interventionImpact.map((iv, i) => (
                          <div key={i} className="mb-1">
                            <div className="font-body font-medium text-ink text-[10px] leading-snug">{iv.action}</div>
                            <div className="font-body text-ok text-[9px] leading-snug">{iv.impact}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!f.propagationRisk && !f.bottleneck && (
                  <div className="font-body text-ghost text-[10px]">No forecast risk detected — system stable.</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Variant B: Structural Explorer (audit / forensics) ────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <ScreenHeader />
      <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-danger/[0.03] flex items-center gap-2">
        <Info size={9} className="text-muted flex-shrink-0" strokeWidth={2} />
        <span className="font-body text-muted text-[9px]">Structural view — for audit, compliance, and forensic analysis. Not the primary decision-making interface.</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!selectedBuilding && (
          <div>
            <div className="px-5 py-2.5 border-b border-rule2 bg-stone2 flex items-center gap-2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{site.code} · {site.location}</span>
              <span className="font-body text-ghost">·</span>
              <span className="font-body text-muted text-[10px]">{site.vessels} vessels · {site.workers.toLocaleString()} workers</span>
            </div>
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
                          <span className="font-display font-bold text-ink text-[15px]">{b.name}</span>
                          <span className="font-body text-ghost text-[11px]">{b.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-body text-ghost mb-2">
                          <span>{b.zones?.length ?? 0} zones</span><span>·</span>
                          <span>{b.vessels} vessels</span><span>·</span>
                          <span className="text-muted">{b.activeBatches} active batches</span>
                        </div>
                        {/* Vessel-type distribution */}
                        {(typeCounts.tank > 0 || typeCounts.chamber > 0) && (
                          <div className="flex items-center gap-2 mb-2">
                            {typeCounts.tank > 0 && (
                              <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{typeCounts.tank} F-tanks</span>
                            )}
                            {typeCounts.chamber > 0 && (
                              <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{typeCounts.chamber} K-chambers</span>
                            )}
                          </div>
                        )}
                        {/* Active stage mix chips */}
                        {Object.keys(stageCounts).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stageCounts).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center gap-1 font-body text-[8px] px-1.5 py-0.5 border ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBar score={b.score} />
                        <ChevronRight size={12} className="text-ghost group-hover:text-ink flex-shrink-0" />
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
            <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
              <span className="font-display font-bold text-ink text-[14px]">{selectedBuilding.name}</span>
              <span className="font-body text-ghost text-[11px]">{selectedBuilding.label}</span>
              <span className="font-body text-ghost text-[10px] ml-auto">{selectedBuilding.zones?.length} zones</span>
            </div>
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
                          <span className="font-display font-bold text-ink text-[14px]">{z.name}</span>
                          <span className="font-body text-ghost text-[11px]">{z.label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-[10px] font-body text-ghost mb-1.5">
                          <span>{z.processes?.length ?? 0} processes</span><span>·</span>
                          <span className="text-muted">{z.activeBatches} active batches</span>
                          {z.temperature && <EnvChip label="Temp" val={z.temperature.val} tone={z.temperature.tone} />}
                          {z.humidity    && <EnvChip label="RH"   val={z.humidity.val}    tone={z.humidity.tone} />}
                        </div>
                        {/* Lineage indicators */}
                        {(lineage.feedsFrom.length > 0 || lineage.feedsInto.length > 0) && (
                          <div className="flex items-center gap-3 mb-1.5">
                            {lineage.feedsFrom.length > 0 && (
                              <span className="font-body text-ghost text-[9px] flex items-center gap-1">
                                ↑ from <span className="text-muted">{lineage.feedsFrom.map(id => ZONE_NAMES[id]).join(', ')}</span>
                              </span>
                            )}
                            {lineage.feedsInto.length > 0 && (
                              <span className="font-body text-ghost text-[9px] flex items-center gap-1">
                                ↓ feeds <span className="text-muted">{lineage.feedsInto.map(id => ZONE_NAMES[id]).join(', ')}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {/* Vessel-type distribution */}
                        {stats.total > 0 && (
                          <div className="flex items-center gap-2 mb-1.5">
                            {stats.types.tank > 0 && <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{stats.types.tank} F-tanks</span>}
                            {stats.types.chamber > 0 && <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{stats.types.chamber} K-chambers</span>}
                          </div>
                        )}
                        {/* Process-stage chips */}
                        {Object.keys(stats.stages).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stats.stages).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center gap-1 font-body text-[8px] px-1.5 py-0.5 border ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {z.alert && <div className="flex items-center gap-1 text-warn text-[10px] mt-1.5"><AlertTriangle size={9} strokeWidth={2} />{z.alert.msg}</div>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBar score={z.score} />
                        <ChevronRight size={12} className="text-ghost group-hover:text-ink flex-shrink-0" />
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
                  <span className="font-display font-bold text-ink text-[16px]">{selectedZone.name}</span>
                  <span className="font-body text-ghost text-[11px]">{selectedZone.label}</span>
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
                  <div className="flex items-center gap-4 text-[9px] font-body text-ghost">
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
              ? <div className="px-5 py-8 font-body text-ghost text-[12px]">No active processes in this zone.</div>
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
                          <div className="font-display font-bold text-ink text-[14px] mb-0.5">{proc.name}</div>
                          <div className="flex items-center gap-2 text-[10px] font-body text-ghost mb-2">
                            <span>{proc.sku}</span><span>·</span>
                            <span className="text-muted">{proc.activeBatches} batches</span><span>·</span>
                            <span className="text-muted">{vessels.length} vessels</span>
                          </div>
                          {/* Vessel type distribution */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {typeCounts.tank > 0 && <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{typeCounts.tank} F-tanks</span>}
                            {typeCounts.chamber > 0 && <span className="font-body text-ghost text-[9px] px-1.5 py-0.5 bg-stone3">{typeCounts.chamber} K-chambers</span>}
                          </div>
                          {/* Stage chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.entries(stageCounts).map(([stage, count]) => (
                              <span key={stage} className={`inline-flex items-center gap-1 font-body text-[8px] px-1.5 py-0.5 border ${STAGE_COLORS[stage] ?? STAGE_COLORS.unknown}`}>
                                {STAGE_LABELS[stage] ?? stage} <span className="opacity-70">{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-ghost group-hover:text-ink flex-shrink-0 mt-1" />
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
            <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
              <span className="font-display font-bold text-ink text-[14px]">{selectedProcess.name}</span>
              <span className="font-body text-ghost text-[10px]">{selectedProcess.sku}</span>
            </div>
            <VesselGrid vessels={selectedProcess.vessels ?? []} />
            <div className="px-5 py-6 font-body text-ghost text-[11px]">Select a vessel to open its batch intelligence record.</div>
          </div>
        )}
      </div>
    </div>
  )
}
