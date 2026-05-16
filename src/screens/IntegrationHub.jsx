// Shift 5: Integration architecture expansion
// Manufacturing OS surface: 50+ sources, event streaming, semantic normalization,
// confidence arbitration, temporal reconciliation.

import { useState } from 'react'
import { connectors, integrationSummary, semanticConflicts, integrationCategories } from '../data/integrations'
import { AlertTriangle, CheckCircle, Zap, Radio } from 'lucide-react'

const STATUS_CFG = {
  active:    { label: 'Active',     dot: 'bg-ok',     text: 'text-ok',     badge: 'bg-ok/10 text-ok border border-ok/30' },
  available: { label: 'Available',  dot: 'bg-rule2',  text: 'text-ghost',  badge: 'bg-stone3 text-ghost border border-rule2' },
  soon:      { label: 'Coming soon',dot: 'bg-ochre',  text: 'text-ochre',  badge: 'bg-ochre/10 text-ochre border border-ochre/30' },
}

function ConnectorCard({ c, selected, onClick }) {
  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.available
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3 border transition-colors ${
        selected ? 'border-ochre bg-stone2' : 'border-rule2 bg-stone hover:bg-stone2/70 hover:border-ghost'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className={`relative flex h-1.5 w-1.5 flex-shrink-0 mt-0.5`}>
            {c.status === 'active' && c.streaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
          </div>
          <span className="font-body font-medium text-ink text-[11px] leading-snug">{c.name}</span>
        </div>
        {c.conflicts > 0 && (
          <AlertTriangle size={9} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
        )}
      </div>
      <div className="font-body text-ghost text-[9px] mb-1.5">{c.vendor}</div>
      {c.status === 'active' && (
        <div className="flex items-center gap-2">
          {c.quality != null && (
            <div className="h-0.5 bg-rule2 flex-1">
              <div className={`h-full ${c.quality >= 95 ? 'bg-ok' : c.quality >= 85 ? 'bg-ochre' : 'bg-warn'}`}
                style={{ width: `${c.quality}%` }} />
            </div>
          )}
          <span className={`font-body text-[9px] tabular-nums flex-shrink-0 ${c.quality >= 95 ? 'text-ok' : c.quality >= 85 ? 'text-ochre' : 'text-warn'}`}>
            {c.quality}%
          </span>
          {c.streaming && <Zap size={8} className="text-ok flex-shrink-0" strokeWidth={2} />}
        </div>
      )}
    </button>
  )
}

function ConnectorDetail({ c }) {
  if (!c) return <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">Select a connector</div>
  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.available
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`relative flex h-2 w-2 flex-shrink-0`}>
            {c.status === 'active' && c.streaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
          </div>
          <span className={`font-body text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${cfg.badge}`}>{cfg.label}</span>
          {c.streaming && <span className="font-body text-ok text-[9px] uppercase tracking-widest flex items-center gap-1"><Radio size={9} strokeWidth={2} />Streaming</span>}
        </div>
        <div className="font-display font-bold text-ink text-[20px] leading-none mb-1">{c.name}</div>
        <div className="font-body text-ghost text-[12px]">{c.vendor}</div>
      </div>

      {c.status === 'active' && (
        <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
          {[
            { label: 'Data quality',  val: c.quality != null ? `${c.quality}%` : '—', tone: c.quality >= 95 ? 'text-ok' : c.quality >= 85 ? 'text-ochre' : 'text-warn' },
            { label: 'Last sync',     val: c.lastSync ?? '—', tone: 'text-muted' },
            { label: 'Active signals',val: c.signals != null ? c.signals.toLocaleString() : '—', tone: 'text-ink' },
            { label: 'Latency',       val: c.latency ?? '—', tone: 'text-muted' },
            { label: 'Streaming',     val: c.streaming ? 'Yes' : 'Polling', tone: c.streaming ? 'text-ok' : 'text-ghost' },
            { label: 'Conflicts',     val: c.conflicts > 0 ? String(c.conflicts) : 'None', tone: c.conflicts > 0 ? 'text-warn' : 'text-ok' },
          ].map(({ label, val, tone }) => (
            <div key={label} className="bg-stone px-3 py-2.5">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
              <div className={`font-body font-medium text-[12px] ${tone}`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {c.note && (
        <div className="flex items-start gap-2 px-3 py-2.5 border border-warn/30 bg-warn/[0.04] border-l-2 border-l-warn">
          <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="font-body text-warn text-[11px] leading-snug">{c.note}</p>
        </div>
      )}

      {c.status === 'available' && (
        <div className="px-4 py-4 border border-rule2 border-l-4 border-l-ochre bg-stone2">
          <div className="font-body font-semibold text-ink text-[13px] mb-1">Available — not connected</div>
          <div className="font-body text-muted text-[11px] leading-relaxed mb-3">
            This connector is supported by the integration framework. Configure credentials and field mappings to activate.
          </div>
          <button type="button" className="font-body font-medium text-[11px] px-3.5 py-2 bg-ink text-stone hover:bg-ink/90 transition-colors">
            Configure connector
          </button>
        </div>
      )}

      {c.status === 'soon' && (
        <div className="px-4 py-4 border border-rule2 bg-stone2">
          <div className="font-body font-semibold text-ink text-[13px] mb-1">Coming soon</div>
          <div className="font-body text-muted text-[11px]">This connector is in development. Expected availability: Q3 2026.</div>
        </div>
      )}
    </div>
  )
}

export default function IntegrationHub() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedConnectorId, setSelectedConnectorId] = useState(null)

  const filtered = selectedCategory
    ? connectors.filter(c => c.category === selectedCategory)
    : connectors

  const selectedConnector = connectors.find(c => c.id === selectedConnectorId)

  const categoryCounts = integrationCategories.map(cat => ({
    name: cat,
    total: connectors.filter(c => c.category === cat).length,
    active: connectors.filter(c => c.category === cat && c.status === 'active').length,
    conflicts: connectors.filter(c => c.category === cat && c.conflicts > 0).reduce((s, c) => s + c.conflicts, 0),
  }))

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* ── Left: categories + conflicts ────────────────────── */}
      <div className="w-[240px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Integration Hub</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`font-display font-bold display-num text-[22px] ${integrationSummary.active >= 30 ? 'text-ok' : 'text-warn'}`}>{integrationSummary.active}</span>
            <span className="font-body text-ghost text-[10px]">of {integrationSummary.total} active</span>
          </div>
        </div>

        {/* Conflicts callout */}
        {integrationSummary.activeConflicts > 0 && (
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-warn/[0.04]">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-warn" strokeWidth={2} />
              <span className="font-body text-warn text-[10px] font-medium">{integrationSummary.activeConflicts} semantic conflicts</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* All category */}
          <button type="button" onClick={() => { setSelectedCategory(null); setSelectedConnectorId(null) }}
            className={`w-full text-left px-4 py-2.5 border-b border-rule2 flex items-center justify-between transition-colors ${!selectedCategory ? 'bg-stone2 border-l-4 border-l-ochre' : 'hover:bg-stone2/50 border-l-4 border-l-transparent'}`}>
            <span className="font-body font-medium text-ink text-[11px]">All sources</span>
            <span className="font-body text-ghost text-[10px]">{integrationSummary.total}</span>
          </button>
          {categoryCounts.map(cat => (
            <button key={cat.name} type="button"
              onClick={() => { setSelectedCategory(cat.name); setSelectedConnectorId(null) }}
              className={`w-full text-left px-4 py-2.5 border-b border-rule2 flex items-center justify-between transition-colors ${selectedCategory === cat.name ? 'bg-stone2 border-l-4 border-l-ochre' : 'hover:bg-stone2/50 border-l-4 border-l-transparent'}`}>
              <div>
                <div className="font-body text-ink text-[11px]">{cat.name}</div>
                <div className="font-body text-ghost text-[9px]">{cat.active}/{cat.total} active</div>
              </div>
              <div className="flex items-center gap-1.5">
                {cat.conflicts > 0 && <AlertTriangle size={9} className="text-warn" strokeWidth={2} />}
                <span className="font-body text-ghost text-[10px]">{cat.total}</span>
              </div>
            </button>
          ))}

          {/* Semantic conflicts */}
          <div className="px-4 py-2.5 border-b border-rule2 bg-stone2 mt-2">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">Semantic conflicts</div>
          </div>
          {semanticConflicts.map(sc => (
            <div key={sc.id} className="px-4 py-2.5 border-b border-rule2 border-l-4 border-l-warn bg-warn/[0.02]">
              <div className="font-body font-medium text-warn text-[10px] mb-0.5">{sc.field}</div>
              <div className="font-body text-ghost text-[9px] leading-snug">{sc.sources.join(' · ')}</div>
              {sc.autoEligible && <div className="font-body text-ok text-[9px] mt-0.5">Auto-resolvable</div>}
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total signals', val: integrationSummary.totalSignals.toLocaleString() },
              { label: 'Streaming', val: String(integrationSummary.streamingSources) },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest">{label}</div>
                <div className="font-display font-bold display-num text-[16px] text-ink">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: connector grid ────────────────────────── */}
      <div className="w-[380px] flex-shrink-0 border-r border-rule2 flex flex-col">
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">
            {selectedCategory ?? 'All sources'} · {filtered.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-body text-ok text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ok" />Active</span>
            <span className="flex items-center gap-1 font-body text-ghost text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-rule2" />Available</span>
            <span className="flex items-center gap-1 font-body text-ochre text-[9px]"><span className="w-1.5 h-1.5 rounded-full bg-ochre" />Soon</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-px bg-rule2 border-b border-rule2">
            {filtered.map(c => (
              <ConnectorCard key={c.id} c={c}
                selected={selectedConnectorId === c.id}
                onClick={() => setSelectedConnectorId(c.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: connector detail ───────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Connector detail</span>
        </div>
        <ConnectorDetail c={selectedConnector} />
      </div>
    </div>
  )
}
