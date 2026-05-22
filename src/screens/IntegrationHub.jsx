import { useState } from 'react'
import { connectors, integrationSummary, semanticConflicts, integrationCategories } from '../data/integrations'
import { AlertTriangle, CheckCircle, Zap, Radio, Search, X } from 'lucide-react'
import { SlidePanel, Tabs, StatusPill, Btn, AnimatedScore, StatGrid, SectionLabel, EmptyState } from '../components/UI'

const STATUS_CFG = {
  active:    { label: 'Active',      dot: 'bg-ok',     text: 'text-ok',     badge: 'bg-ok/10 text-ok' },
  available: { label: 'Available',   dot: 'bg-muted',  text: 'text-muted',  badge: 'bg-stone3 text-muted' },
  soon:      { label: 'Coming soon', dot: 'bg-signal',  text: 'text-signal',  badge: 'bg-signal/10 text-signal' },
}

const STATUS_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'available', label: 'Available' },
  { key: 'soon',      label: 'Soon' },
]

function ConnectorCard({ c, selected, onClick }) {
  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.available
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3 border transition-colors ${
        selected ? 'border-signal bg-stone2' : 'border-rule2 bg-stone hover:bg-stone2/70 hover:border-muted'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="relative flex h-1.5 w-1.5 flex-shrink-0 mt-0.5">
            {c.status === 'active' && c.streaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
          </div>
          <span className="font-body font-medium text-ink text-body leading-snug">{c.name}</span>
        </div>
        {c.conflicts > 0 && (
          <AlertTriangle size={9} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
        )}
      </div>
      <div className="font-body text-muted text-label mb-1.5">{c.vendor}</div>
      {c.status === 'active' && (
        <div className="flex items-center gap-2">
          {c.quality != null && (
            <div className="h-1.5 bg-rule2 flex-1">
              <div className={`h-full ${c.quality >= 95 ? 'bg-ok' : c.quality >= 85 ? 'bg-signal' : 'bg-warn'}`}
                style={{ width: `${c.quality}%` }} />
            </div>
          )}
          <span className={`font-body text-label tabular-nums flex-shrink-0 ${c.quality >= 95 ? 'text-ok' : c.quality >= 85 ? 'text-signal' : 'text-warn'}`}>
            {c.quality}%
          </span>
          {c.streaming && <Zap size={10} className="text-ok flex-shrink-0" strokeWidth={2} />}
        </div>
      )}
      {(c.status === 'available' || c.status === 'soon') && (
        <StatusPill tone={c.status === 'available' ? 'muted' : 'signal'}>{cfg.label}</StatusPill>
      )}
    </button>
  )
}

function ConnectorDetail({ c }) {
  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.available
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex h-2 w-2 flex-shrink-0">
            {c.status === 'active' && c.streaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
          </div>
          <StatusPill tone={c.status === 'active' ? 'ok' : c.status === 'available' ? 'muted' : 'signal'}>{cfg.label}</StatusPill>
          {c.streaming && <span className="font-body text-ok text-label flex items-center gap-1"><Radio size={9} strokeWidth={2} />Streaming</span>}
        </div>
        <div className="font-display font-bold text-ink text-subhead leading-none mb-1">{c.name}</div>
        <div className="font-body text-muted text-body">{c.vendor}</div>
      </div>

      {c.status === 'active' && (
        <StatGrid cols={3} noBorder>
          {[
            { label: 'Data quality',   val: c.quality != null ? `${c.quality}%` : '—', tone: c.quality >= 95 ? 'text-ok' : c.quality >= 85 ? 'text-signal' : 'text-warn' },
            { label: 'Last sync',      val: c.lastSync ?? '—',                          tone: 'text-muted' },
            { label: 'Active signals', val: c.signals != null ? c.signals.toLocaleString() : '—', tone: 'text-ink' },
            { label: 'Latency',        val: c.latency ?? '—',                           tone: 'text-muted' },
            { label: 'Streaming',      val: c.streaming ? 'Yes' : 'Polling',            tone: c.streaming ? 'text-ok' : 'text-muted' },
            { label: 'Conflicts',      val: c.conflicts > 0 ? String(c.conflicts) : 'None', tone: c.conflicts > 0 ? 'text-warn' : 'text-ok' },
          ].map(({ label, val, tone }) => (
            <StatGrid.Cell key={label} label={label} value={val} tone={tone} size="sm" />
          ))}
        </StatGrid>
      )}

      {c.note && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-warn/[0.04] border-l-2 border-l-warn">
          <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="font-body text-warn text-label leading-snug">{c.note}</p>
        </div>
      )}

      {c.status === 'available' && (
        <div className="px-4 py-4 border-l-2 border-l-signal bg-stone2">
          <div className="font-body font-semibold text-ink text-base mb-1">Available — not connected</div>
          <div className="font-body text-muted text-label leading-relaxed mb-2">
            This connector is supported by the integration framework. Configuration is managed in the admin panel.
          </div>
          <div className="font-body text-muted/60 text-label">
            Admin panel → Integrations → {c.name}
          </div>
        </div>
      )}

      {c.status === 'soon' && (
        <div className="px-4 py-4 bg-stone2">
          <div className="font-body font-semibold text-ink text-base mb-1">Coming soon</div>
          <div className="font-body text-muted text-label">This connector is in development. Expected availability: Q3 2026.</div>
        </div>
      )}
    </div>
  )
}

function ConflictsPanel({ resolved, onResolve }) {
  const unresolved = semanticConflicts.filter(sc => !resolved.has(sc.id))
  const resolvedList = semanticConflicts.filter(sc => resolved.has(sc.id))

  return (
    <div className="flex-1 overflow-y-auto page-rise">
      {unresolved.map(sc => (
        <div key={sc.id} className="border-b border-rule2 border-l-2 border-l-warn">
          <div className="px-4 py-3 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-body font-medium text-ink text-base leading-snug mb-0.5">{sc.field}</div>
                <div className="font-body text-muted text-label">{sc.sources.join(' · ')}</div>
              </div>
              {sc.autoEligible && (
                <Btn variant="secondary" onClick={() => onResolve(sc.id)} className="flex-shrink-0 !py-1 !min-h-0">Auto-resolve</Btn>
              )}
            </div>

            {/* Values in conflict */}
            <div className="space-y-1">
              {sc.values.map(v => (
                <div key={v.source} className="flex items-baseline gap-2">
                  <span className="font-body text-muted text-label w-32 flex-shrink-0 truncate">{v.source}</span>
                  <span className="font-body text-warn text-label">{v.value}</span>
                </div>
              ))}
            </div>

            {/* Impact */}
            <div className="px-3 py-2 bg-warn/[0.04] border-l-2 border-l-warn/30">
              <div className="font-body text-muted text-label mb-0.5">Impact</div>
              <div className="font-body text-ink text-label leading-snug">{sc.impact}</div>
            </div>

            {/* Resolution */}
            <div className="px-3 py-2 bg-stone2">
              <div className="font-body text-muted text-label mb-0.5">Resolution</div>
              <div className="font-body text-ink text-label leading-snug">{sc.resolution}</div>
            </div>

            {!sc.autoEligible && (
              <div className="font-body text-muted/60 text-label">Manual resolution required — ERP admin access needed</div>
            )}
          </div>
        </div>
      ))}

      {resolvedList.length > 0 && (
        <>
          <div className="px-4 py-2 border-b border-rule2 bg-stone2">
            <span className="font-body text-muted text-label">Resolved this session</span>
          </div>
          {resolvedList.map(sc => (
            <div key={sc.id} className="border-b border-rule2 border-l-2 border-l-ok/40 opacity-50 cursor-default">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-body font-medium text-ink text-label">{sc.field}</div>
                  <div className="font-body text-muted text-label">{sc.sources.join(' · ')}</div>
                </div>
                <span className="font-body text-ok text-label flex items-center gap-1 flex-shrink-0">
                  <CheckCircle size={10} />Resolved
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {unresolved.length === 0 && resolvedList.length === semanticConflicts.length && (
        <div className="flex flex-col items-center justify-center h-32 gap-1.5">
          <CheckCircle size={14} className="text-ok" />
          <div className="font-body text-ok text-label">All conflicts resolved this session</div>
        </div>
      )}
    </div>
  )
}

export default function IntegrationHub() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedConnectorId, setSelectedConnectorId] = useState(null)
  const [activeTab, setActiveTab] = useState('sources')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resolvedConflicts, setResolvedConflicts] = useState(new Set())

  const resolveConflict = (id) => setResolvedConflicts(p => new Set([...p, id]))
  const unresolvedCount = semanticConflicts.filter(sc => !resolvedConflicts.has(sc.id)).length

  const filtered = connectors
    .filter(c => !selectedCategory || c.category === selectedCategory)
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q)
    })

  const selectedConnector = connectors.find(c => c.id === selectedConnectorId)

  const categoryCounts = integrationCategories.map(cat => ({
    name: cat,
    total: connectors.filter(c => c.category === cat).length,
    active: connectors.filter(c => c.category === cat && c.status === 'active').length,
    conflicts: connectors.filter(c => c.category === cat && c.conflicts > 0).reduce((s, c) => s + c.conflicts, 0),
  }))

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* ── Left: categories ─────────────────────────────── */}
      <div className="w-[240px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="flex items-center gap-2">
            <span className={`display-num text-score ${integrationSummary.active >= 30 ? 'text-ok' : 'text-warn'}`}>
              <AnimatedScore value={integrationSummary.active} effect="glow" />
            </span>
            <span className="font-body text-muted text-label">of {integrationSummary.total} active</span>
          </div>
        </div>

        {/* Conflicts callout — clickable, switches to conflicts tab */}
        {unresolvedCount > 0 && (
          <button type="button" onClick={() => setActiveTab('conflicts')}
            className={`flex-shrink-0 w-full text-left px-4 py-2.5 border-b border-rule2 flex items-center gap-2 transition-colors ${
              activeTab === 'conflicts' ? 'bg-warn/[0.06]' : 'bg-warn/[0.03] hover:bg-warn/[0.07]'
            }`}>
            <AlertTriangle size={10} className="text-warn flex-shrink-0" strokeWidth={2} />
            <span className="font-body text-warn text-label font-medium">
              {unresolvedCount} semantic {unresolvedCount === 1 ? 'conflict' : 'conflicts'}
            </span>
            <span className="font-body text-warn/50 text-label ml-auto">→</span>
          </button>
        )}

        {/* Category list */}
        <div className="flex-1 overflow-y-auto">
          <button type="button"
            onClick={() => { setSelectedCategory(null); setSelectedConnectorId(null); setActiveTab('sources') }}
            className={`w-full text-left px-4 py-2.5 border-b border-rule2 flex items-center justify-between transition-colors ${
              !selectedCategory && activeTab === 'sources'
                ? 'bg-stone2 border-l-2 border-l-signal'
                : 'hover:bg-stone2/50 border-l-2 border-l-transparent'
            }`}>
            <span className="font-body font-medium text-ink text-label">All sources</span>
            <span className="font-body text-muted text-label">{integrationSummary.total}</span>
          </button>
          {categoryCounts.map(cat => (
            <button key={cat.name} type="button"
              onClick={() => { setSelectedCategory(cat.name); setSelectedConnectorId(null); setActiveTab('sources') }}
              className={`w-full text-left px-4 py-2.5 border-b border-rule2 flex items-center justify-between transition-colors ${
                selectedCategory === cat.name && activeTab === 'sources'
                  ? 'bg-stone2 border-l-2 border-l-signal'
                  : 'hover:bg-stone2/50 border-l-2 border-l-transparent'
              }`}>
              <div>
                <div className="font-body text-ink text-label">{cat.name}</div>
                <div className="font-body text-muted text-label">{cat.active}/{cat.total} active</div>
              </div>
              <div className="flex items-center gap-1.5">
                {cat.conflicts > 0 && <AlertTriangle size={9} className="text-warn" strokeWidth={2} />}
                <span className="font-body text-muted text-label">{cat.total}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total signals', val: integrationSummary.totalSignals.toLocaleString() },
              { label: 'Streaming',     val: String(integrationSummary.streamingSources) },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="font-body text-muted text-label">{label}</div>
                <div className="display-num text-head text-ink">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: tabs + connector grid or conflicts ───── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Tab bar */}
        <Tabs
          tabs={[
            { id: 'sources', label: `Sources · ${integrationSummary.total}` },
            { id: 'conflicts', label: 'Conflicts', badge: unresolvedCount > 0 ? unresolvedCount : 0, dot: unresolvedCount > 0 },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'sources' ? (
          <>
            {/* Search + status filter */}
            <div className="flex-shrink-0 border-b border-rule2 bg-stone2 px-3 pt-2 pb-2 space-y-2">
              <div className="flex items-center gap-2 bg-stone border border-transparent focus-within:border-signal/50 px-2.5 py-1.5 transition-colors">
                <Search size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search connectors or vendors…"
                  className="flex-1 font-body text-label text-ink bg-transparent outline-none placeholder:text-muted/60"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"
                    className="text-muted hover:text-ink transition-colors">
                    <X size={11} strokeWidth={2} />
                  </button>
                )}
              </div>
              <div className="flex gap-px">
                {STATUS_FILTERS.map(f => (
                  <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                    className={`font-body text-label px-2.5 py-1 transition-colors ${
                      statusFilter === f.key ? 'bg-signal/10 text-signal' : 'text-muted hover:text-ink'
                    }`}>
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto font-body text-muted text-label self-center tabular-nums">{filtered.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length > 0 ? (
                <StatGrid cols={2}>
                  {filtered.map(c => (
                    <ConnectorCard key={c.id} c={c}
                      selected={selectedConnectorId === c.id}
                      onClick={() => setSelectedConnectorId(c.id)} />
                  ))}
                </StatGrid>
              ) : (
                <EmptyState message={`No connectors match "${searchQuery}"`} />
              )}
            </div>
          </>
        ) : (
          <ConflictsPanel resolved={resolvedConflicts} onResolve={resolveConflict} />
        )}
      </div>

      {selectedConnector && (
        <SlidePanel
          title={selectedConnector.name}
          subtitle={`${STATUS_CFG[selectedConnector.status]?.label ?? 'Unknown'} · ${selectedConnector.vendor}`}
          onClose={() => setSelectedConnectorId(null)}
          maxWidth="480px"
        >
          <ConnectorDetail c={selectedConnector} />
        </SlidePanel>
      )}
    </div>
  )
}
