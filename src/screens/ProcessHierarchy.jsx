// Shift 4: Multi-scale operational hierarchy
// Site → Building → Zone → Process → Vessel/Tank

import { useState } from 'react'
import { processHierarchy } from '../data/hierarchy'
import { AlertTriangle, CheckCircle, ChevronRight, Thermometer, Droplets } from 'lucide-react'

function ScoreDot({ score }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-ochre' : score >= 70 ? 'bg-warn' : 'bg-danger'
  return <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />
}

function ScoreBar({ score, width = 60 }) {
  const color = score >= 90 ? 'bg-ok' : score >= 80 ? 'bg-ochre' : score >= 70 ? 'bg-warn' : 'bg-danger'
  const textColor = score >= 90 ? 'text-ok' : score >= 80 ? 'text-ochre' : score >= 70 ? 'text-warn' : 'text-danger'
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

// Breadcrumb
function Breadcrumb({ crumbs, onNavigate }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={10} className="text-ghost flex-shrink-0" />}
          {i < crumbs.length - 1
            ? <button type="button" onClick={() => onNavigate(i)}
                className="font-body text-muted text-[11px] hover:text-ink transition-colors">{c}</button>
            : <span className="font-body font-medium text-ink text-[11px]">{c}</span>
          }
        </div>
      ))}
    </div>
  )
}

export default function ProcessHierarchy() {
  const site = processHierarchy.site
  // Navigation state: [buildingId, zoneId, processId]
  const [path, setPath] = useState([])

  const selectedBuilding = path[0] ? site.buildings.find(b => b.id === path[0]) : null
  const selectedZone     = path[1] && selectedBuilding ? selectedBuilding.zones.find(z => z.id === path[1]) : null
  const selectedProcess  = path[2] && selectedZone ? selectedZone.processes.find(p => p.id === path[2]) : null

  const crumbs = [site.name]
  if (selectedBuilding) crumbs.push(selectedBuilding.name + ' — ' + selectedBuilding.label)
  if (selectedZone)     crumbs.push(selectedZone.name + ' — ' + selectedZone.label)
  if (selectedProcess)  crumbs.push(selectedProcess.name)

  const navigateTo = (level) => {
    setPath(prev => prev.slice(0, level))
  }

  const scoreColor = (s) => s >= 90 ? 'text-ok' : s >= 80 ? 'text-ochre' : s >= 70 ? 'text-warn' : 'text-danger'

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-rule2 bg-stone">
        <div className="flex-1 min-w-0">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Platform Architecture · Process Hierarchy</div>
          <Breadcrumb crumbs={crumbs} onNavigate={navigateTo} />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className={`font-display font-bold display-num text-[28px] leading-none tabular-nums ${scoreColor(site.score)}`}>{site.score}</div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">site health</div>
          </div>
          <div className="text-right border-l border-rule2 pl-4">
            <div className="font-display font-bold display-num text-[28px] leading-none tabular-nums text-ochre">{site.activeBatches}</div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">active batches</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Site level — buildings ──────────────────────────── */}
        {!selectedBuilding && (
          <div>
            <div className="px-5 py-2.5 border-b border-rule2 bg-stone2 flex items-center gap-2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{site.code} · {site.location}</span>
              <span className="font-body text-ghost text-[10px]">·</span>
              <span className="font-body text-muted text-[10px]">{site.vessels} vessels</span>
              <span className="font-body text-ghost text-[10px]">·</span>
              <span className="font-body text-muted text-[10px]">{site.workers.toLocaleString()} workers</span>
            </div>
            <div className="divide-y divide-rule2">
              {site.buildings.map(b => (
                <button key={b.id} type="button"
                  onClick={() => setPath([b.id])}
                  className="group w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-stone2 transition-colors">
                  <ScoreDot score={b.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-display font-bold text-ink text-[15px]">{b.name}</span>
                      <span className="font-body text-ghost text-[11px]">{b.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-body text-ghost text-[10px]">{b.zones?.length ?? 0} zones</span>
                      <span className="font-body text-ghost text-[10px]">·</span>
                      <span className="font-body text-ghost text-[10px]">{b.vessels} vessels</span>
                      <span className="font-body text-ghost text-[10px]">·</span>
                      <span className="font-body text-muted text-[10px]">{b.activeBatches} active batches</span>
                      {b.alert && (
                        <span className="flex items-center gap-1 font-body text-warn text-[10px]">
                          <AlertTriangle size={9} strokeWidth={2} />{b.alert.msg}
                        </span>
                      )}
                    </div>
                  </div>
                  <ScoreBar score={b.score} />
                  <ChevronRight size={12} className="text-ghost group-hover:text-ink transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Building level — zones ──────────────────────────── */}
        {selectedBuilding && !selectedZone && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
              <span className="font-body font-bold text-ink text-[12px]">{selectedBuilding.name} — {selectedBuilding.label}</span>
              <span className="font-body text-ghost text-[10px]">{selectedBuilding.zones?.length} zones · {selectedBuilding.activeBatches} active batches</span>
            </div>
            <div className="divide-y divide-rule2">
              {(selectedBuilding.zones ?? []).map(z => (
                <button key={z.id} type="button"
                  onClick={() => setPath([selectedBuilding.id, z.id])}
                  className="group w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-stone2 transition-colors">
                  <ScoreDot score={z.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display font-bold text-ink text-[14px]">{z.name}</span>
                      <span className="font-body text-ghost text-[11px]">{z.label}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-body text-ghost text-[10px]">{z.processes?.length ?? 0} processes</span>
                      <span className="font-body text-ghost text-[10px]">·</span>
                      <span className="font-body text-muted text-[10px]">{z.activeBatches} active batches</span>
                      {z.temperature && <EnvChip label="Temp" val={z.temperature.val} tone={z.temperature.tone} />}
                      {z.humidity    && <EnvChip label="RH"   val={z.humidity.val}    tone={z.humidity.tone} />}
                    </div>
                    {z.alert && (
                      <div className="flex items-center gap-1 font-body text-warn text-[10px] mt-1">
                        <AlertTriangle size={9} strokeWidth={2} />{z.alert.msg}
                      </div>
                    )}
                  </div>
                  <ScoreBar score={z.score} />
                  <ChevronRight size={12} className="text-ghost group-hover:text-ink transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Zone level — processes ──────────────────────────── */}
        {selectedZone && !selectedProcess && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
              <span className="font-body font-bold text-ink text-[12px]">{selectedZone.name} — {selectedZone.label}</span>
              {selectedZone.temperature && <EnvChip label="Temp" val={selectedZone.temperature.val} tone={selectedZone.temperature.tone} />}
              {selectedZone.humidity    && <EnvChip label="RH"   val={selectedZone.humidity.val}    tone={selectedZone.humidity.tone} />}
            </div>
            {selectedZone.processes.length === 0 && (
              <div className="px-5 py-8 font-body text-ghost text-[12px]">No active processes in this zone.</div>
            )}
            {selectedZone.processes.map(proc => (
              <div key={proc.id} className="border-b border-rule2">
                <button type="button"
                  onClick={() => setPath([selectedBuilding.id, selectedZone.id, proc.id])}
                  className="group w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-stone2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-ink text-[14px] mb-0.5">{proc.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-ghost text-[10px]">{proc.sku}</span>
                      <span className="font-body text-ghost text-[10px]">·</span>
                      <span className="font-body text-muted text-[10px]">{proc.activeBatches} active batches</span>
                      <span className="font-body text-ghost text-[10px]">·</span>
                      <span className="font-body text-muted text-[10px]">{proc.vessels?.length ?? 0} vessels shown</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-ghost group-hover:text-ink transition-colors flex-shrink-0" />
                </button>
                <div className="border-t border-rule2">
                  <VesselGrid vessels={proc.vessels ?? []} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Process level — vessel detail ───────────────────── */}
        {selectedProcess && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2 flex items-center gap-3">
              <span className="font-body font-bold text-ink text-[12px]">{selectedProcess.name}</span>
              <span className="font-body text-ghost text-[10px]">{selectedProcess.sku}</span>
            </div>
            <div className="px-5 py-2.5 border-b border-rule2 bg-stone2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">All vessels</span>
            </div>
            <VesselGrid vessels={selectedProcess.vessels ?? []} />
            <div className="px-5 py-6 font-body text-ghost text-[11px]">
              Select a vessel to open its batch intelligence record.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
