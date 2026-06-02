import { useState, useRef } from 'react'
import { connectors, integrationSummary, semanticConflicts, integrationCategories } from '../data/integrations'
import { AlertTriangle, CheckCircle, Zap, Radio, Search, X, Lock, ChevronDown,
  Cpu, FlaskConical, Truck, Users, Leaf, Database, Brain, Shield, Wrench, Package } from 'lucide-react'

const CATEGORY_ICON = {
  'Production':           Cpu,
  'Quality & Sensory':    FlaskConical,
  'Supply Chain':         Truck,
  'HR & Workforce':       Users,
  'Environment & Energy': Leaf,
  'Laboratory':           FlaskConical,
  'ERP & Finance':        Database,
  'AI & Vision':          Brain,
  'Compliance':           Shield,
  'Maintenance':          Wrench,
}
import { SlidePanel, Tabs, StatusPill, Btn, AnimatedScore, StatGrid, SectionLabel, EmptyState, FilterDropdown, SceneHeader } from '../components/UI'

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
      className={`w-full text-left p-3 transition-colors ${selected ? 'bg-stone2 border-l-2 border-l-signal' : 'hover:bg-stone2/50 border-l-2 border-l-transparent'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative flex h-1.5 w-1.5 flex-shrink-0 mt-0.5">
            {c.status === 'active' && c.streaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
          </div>
          <span className="font-body font-medium text-ink text-body leading-snug truncate">{c.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {c.conflicts > 0 && <AlertTriangle size={9} className="text-warn" strokeWidth={2} />}
          <ChevronDown size={11} strokeWidth={2}
            className={`text-muted transition-transform duration-200 ${selected ? 'rotate-180' : ''}`} />
        </div>
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
        <StatusPill tone={c.status === 'available' ? 'muted' : 'signal'}>
          {c.status === 'soon' ? 'Q3 2026' : cfg.label}
        </StatusPill>
      )}
    </button>
  )
}

// Full-width detail overlay that appears below the row containing the selected card
function ConnectorRowDetail({ c }) {
  return (
    <div className="border-t border-b border-rule2 bg-stone2 px-5 py-4 slide-in space-y-3">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <div className="font-body font-semibold text-ink text-base leading-snug">{c.name}</div>
          <div className="font-body text-muted text-label">{c.vendor}</div>
        </div>
        <StatusPill tone={c.status === 'active' ? 'ok' : c.status === 'available' ? 'muted' : 'signal'}>
          {STATUS_CFG[c.status]?.label ?? c.status}
        </StatusPill>
      </div>

      {c.status === 'active' && (
        <>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3">
            {[
              { label: 'Data quality',   val: c.quality != null ? `${c.quality}%` : '—',           tone: c.quality >= 95 ? 'text-ok' : c.quality >= 85 ? 'text-signal' : 'text-warn' },
              { label: 'Last sync',      val: c.lastSync ?? '—',                                    tone: 'text-muted' },
              { label: 'Active signals', val: c.signals != null ? c.signals.toLocaleString() : '—', tone: 'text-ink' },
              { label: 'Latency',        val: c.latency ?? '—',                                     tone: 'text-muted' },
              { label: 'Streaming',      val: c.streaming ? 'Yes' : 'Polling',                      tone: c.streaming ? 'text-ok' : 'text-muted' },
              { label: 'Conflicts',      val: c.conflicts > 0 ? String(c.conflicts) : 'None',       tone: c.conflicts > 0 ? 'text-warn' : 'text-ok' },
            ].map(({ label, val, tone }) => (
              <div key={label}>
                <div className="font-body text-muted text-label mb-0.5">{label}</div>
                <div className={`display-num text-base tabular-nums ${tone}`}>{val}</div>
              </div>
            ))}
          </div>
          {c.note && (
            <div className="flex items-start gap-2 px-3 py-2 bg-warn/[0.04] border-l-2 border-l-warn">
              <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="font-body text-warn text-label leading-snug m-0">{c.note}</p>
            </div>
          )}
        </>
      )}
      {c.status === 'available' && (
        <div className="font-body text-muted text-label leading-relaxed">
          Available but not connected. Configure via admin panel → Integrations → {c.name}
        </div>
      )}
      {c.status === 'soon' && (
        <div className="font-body text-muted text-label">Expected Q3 2026 · Contact your integration team to request early access.</div>
      )}
    </div>
  )
}

function ConnectorDetailUnused({ c }) {
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
        <div className="font-display font-bold text-ink text-head leading-none mb-1">{c.name}</div>
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
                  <span className="font-body text-muted text-label max-w-[8rem] flex-shrink-0 truncate" title={v.source}>{v.source}</span>
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
              <div className="flex items-center gap-1.5 font-body text-muted text-label">
                <Lock size={9} strokeWidth={2} className="flex-shrink-0" />
                <span>Manual resolution required — ERP admin access needed</span>
              </div>
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

// ── AI Readiness ──────────────────────────────────────────────────────────────

const AI_DIMENSIONS = [
  { key: 'completeness', label: 'Are all my signals arriving?',               score: 68, trend: +4, note: '12% of expected signals not arriving — SCADA gap + checklist sync lag' },
  { key: 'freshness',    label: 'Is my data current?',                        score: 71, trend: +2, note: '3 sources updating >10 min behind expected interval' },
  { key: 'consistency',  label: 'Is data structured the same across shifts?', score: 54, trend: -3, note: 'ERP field format mismatch affects 14 ingredient records' },
  { key: 'coverage',     label: 'How many systems are connected?',             score: 62, trend:  0, note: 'MES, ERP, SCADA connected — warehouse + quality lab not yet integrated' },
]
const AI_WEIGHTS = [0.30, 0.25, 0.25, 0.20]
const AI_SCORE = Math.round(AI_DIMENSIONS.reduce((s, d, i) => s + d.score * AI_WEIGHTS[i], 0))

const AI_GAPS = [
  { id: 'scada-ai',   label: 'SCADA feed degraded — Oven B',       dimension: 'Are all my signals arriving?',               severity: 'high',     agents: ['Predictive Maintenance'],                      impact: 'Predictive Maintenance running at 71% confidence — full accuracy requires a stable Oven B signal.',              fix: 'Resolve maintenance ticket MT-2604-019 to restore feed stability.' },
  { id: 'erp-schema', label: 'ERP schema inconsistency',            dimension: 'Is data structured the same across shifts?', severity: 'high',     agents: ['Supplier Intelligence', 'Risk Escalation'],    impact: 'Ingredient-to-supplier linkage broken for 14 records — chain-of-custody gap reduces accuracy in 2 agents.',      fix: 'Resolve ERP ingredient map in Data Quality queue (~30 min).' },
  { id: 'lot-meta',   label: 'Supplier lot metadata incomplete',    dimension: 'Are all my signals arriving?',               severity: 'moderate', agents: ['Supplier Intelligence'],                       impact: '3 active lots missing COA metadata — reduces recommendation quality and FSMA traceability confidence.',          fix: 'Contact ConAgra and ADM for missing harvest date + handler certification fields.' },
  { id: 'warehouse',  label: 'Warehouse management not integrated', dimension: 'How many systems are connected?',            severity: 'moderate', agents: ['Resource Allocation', 'Handoff Synthesis'],    impact: 'Finished goods movement and inventory signals missing — handoff completeness is reduced.',                        fix: 'Connect WMS API to integration layer — requires IT ticket.' },
  { id: 'lims',       label: 'Quality lab LIMS not connected',      dimension: 'How many systems are connected?',            severity: 'moderate', agents: ['Compliance Monitor', 'CAPA Closure'],          impact: 'Lab test results entered manually — 4–8h lag between test result and agent awareness.',                           fix: 'LIMS integration in Q3 roadmap — manual entry workaround active in the interim.' },
]

const AI_AGENTS = [
  { name: 'Pre-Shift Verification', status: 'full',    note: 'All required data sources connected and fresh' },
  { name: 'Handoff Synthesis',      status: 'full',    note: 'All required signals connected' },
  { name: 'Risk Escalation',        status: 'partial', note: 'ERP schema gap affects some signal paths' },
  { name: 'Compliance Monitor',     status: 'partial', note: 'LIMS lag (4–8h) reduces real-time lab coverage' },
  { name: 'Supplier Intelligence',  status: 'partial', note: 'ERP schema mismatch + 3 lots missing COA metadata' },
  { name: 'Resource Allocation',    status: 'partial', note: 'Warehouse management signals missing' },
  { name: 'Predictive Maintenance', status: 'partial', note: 'SCADA feed degraded — Oven B signal unreliable' },
  { name: 'CAPA Closure',           status: 'partial', note: 'LIMS integration pending — lab data via manual entry' },
]

function AIReadinessTab() {
  return (
    <div className="flex-1 overflow-y-auto page-rise">

      {/* Score + dimensions — sticky so score stays in view while scrolling gaps */}
      <div className="sticky top-0 z-10 px-4 py-4 border-b border-rule2 bg-stone2">
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`display-num text-metric ${AI_SCORE >= 80 ? 'text-ok' : AI_SCORE >= 65 ? 'text-warn' : 'text-danger'}`}>
            <AnimatedScore value={AI_SCORE} effect="glow" />
          </span>
          <span className="font-body text-muted text-label">/ 100 · AI readiness</span>
        </div>
        <div className="space-y-3">
          {AI_DIMENSIONS.map(d => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-ink text-label">{d.label}</span>
                <div className="flex items-center gap-2">
                  {d.trend !== 0 && (
                    <span className={`font-body text-label ${d.trend > 0 ? 'text-ok' : 'text-warn'}`}>{d.trend > 0 ? '↑' : '↓'}{Math.abs(d.trend)}</span>
                  )}
                  <span className={`font-body text-label tabular-nums font-medium ${d.score >= 80 ? 'text-ok' : d.score >= 65 ? 'text-warn' : 'text-danger'}`}>{d.score}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-rule2">
                <div className={`h-full ${d.score >= 80 ? 'bg-ok' : d.score >= 65 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${d.score}%` }} />
              </div>
              <div className="font-body text-muted text-label mt-0.5 leading-snug">{d.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      <div className="px-4 py-2.5 border-y border-rule2 bg-stone3">
        <span className="font-body text-ink text-label font-medium">Gaps to resolve · {AI_GAPS.length}</span>
      </div>
      {AI_GAPS.map(gap => (
        <div key={gap.id} className={`border-b border-rule2 border-l-2 ${gap.severity === 'high' ? 'border-l-danger' : 'border-l-warn'}`}>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-body font-medium text-ink text-base leading-snug mb-0.5">{gap.label}</div>
                <div className="font-body text-muted text-label">{gap.dimension}</div>
              </div>
              <StatusPill tone={gap.severity === 'high' ? 'danger' : 'warn'} className="flex-shrink-0 capitalize">{gap.severity}</StatusPill>
            </div>
            <div className="flex flex-wrap gap-1">
              {gap.agents.map(a => (
                <span key={a} className="font-body text-label px-1.5 py-0.5 bg-stone3 text-muted">{a}</span>
              ))}
            </div>
            <div className={`px-3 py-2 border-l-2 ${gap.severity === 'high' ? 'bg-danger/[0.04] border-l-danger/30' : 'bg-warn/[0.04] border-l-warn/30'}`}>
              <div className="font-body text-muted text-label mb-0.5">Impact</div>
              <div className="font-body text-ink text-label leading-snug">{gap.impact}</div>
            </div>
            <div className="px-3 py-2 bg-stone2">
              <div className="font-body text-muted text-label mb-0.5">Fix</div>
              <div className="font-body text-ink text-label leading-snug">{gap.fix}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Agent coverage */}
      <div className="px-4 py-2.5 border-y border-rule2 bg-stone3">
        <span className="font-body text-ink text-label font-medium">Agent coverage</span>
      </div>
      {AI_AGENTS.map(agent => (
        <div key={agent.name} className="border-b border-rule2 px-4 py-2.5 flex items-start gap-3">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${agent.status === 'full' ? 'bg-ok' : 'bg-warn'}`} />
          <div className="flex-1 min-w-0">
            <div className="font-body text-ink text-label font-medium">{agent.name}</div>
            <div className="font-body text-muted text-label leading-snug">{agent.note}</div>
          </div>
          <StatusPill tone={agent.status === 'full' ? 'ok' : 'warn'} className="flex-shrink-0">
            {agent.status === 'full' ? 'Full' : 'Partial'}
          </StatusPill>
        </div>
      ))}
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

  // Row refs for absolute overlay positioning
  const rowRefs = useRef({})
  const [overlayTop, setOverlayTop] = useState(null)

  const rows = []
  for (let i = 0; i < filtered.length; i += 2) rows.push(filtered.slice(i, i + 2))

  const handleCardClick = (connectorId, rowIdx) => {
    if (connectorId === selectedConnectorId) {
      setSelectedConnectorId(null)
      setOverlayTop(null)
      return
    }
    const rowEl = rowRefs.current[rowIdx]
    if (rowEl) setOverlayTop(rowEl.offsetTop + rowEl.offsetHeight)
    setSelectedConnectorId(connectorId)
  }

  const categoryCounts = integrationCategories.map(cat => ({
    name: cat,
    total: connectors.filter(c => c.category === cat).length,
    active: connectors.filter(c => c.category === cat && c.status === 'active').length,
    conflicts: connectors.filter(c => c.category === cat && c.conflicts > 0).reduce((s, c) => s + c.conflicts, 0),
  }))

  const tone = integrationSummary.active >= integrationSummary.total * 0.8 ? 'ok' : 'warn'
  const statement = unresolvedCount > 0
    ? `${unresolvedCount} semantic conflict${unresolvedCount !== 1 ? 's' : ''} require resolution — field naming mismatches reducing model accuracy across ${unresolvedCount > 1 ? 'multiple agents' : '1 agent'}.`
    : `${integrationSummary.active} of ${integrationSummary.total} sources active and delivering signals. Platform data fresh.`

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <SceneHeader
        module="Integrations"
        context={`${integrationSummary.active} sources · network-wide`}
        metric={integrationSummary.active}
        metricLabel={`of ${integrationSummary.total} active`}
        tone={tone}
        statement={statement}
        meta={[
          { label: 'Signals',   value: integrationSummary.totalSignals.toLocaleString() },
          { label: 'Streaming', value: String(integrationSummary.streamingSources) },
          { label: 'Conflicts', value: String(unresolvedCount), color: unresolvedCount > 0 ? 'var(--color-warn)' : undefined },
        ]}
      />

      {/* ── Tabs + connector grid or conflicts ──────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Tab bar */}
        <Tabs
          tabs={[
            { id: 'sources',   label: `Sources · ${integrationSummary.total}` },
            { id: 'conflicts', label: 'Conflicts', badge: unresolvedCount > 0 ? unresolvedCount : 0, dot: unresolvedCount > 0 },
            { id: 'ai',        label: 'AI readiness' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'sources' ? (
          <>
            {/* Category chips */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-b border-rule2 bg-stone overflow-x-auto">
              <button type="button"
                onClick={() => { setSelectedCategory(null); setSelectedConnectorId(null) }}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 font-body text-label transition-colors ${!selectedCategory ? 'bg-ink text-stone' : 'bg-stone3 text-muted hover:text-ink'}`}>
                All
              </button>
              {integrationCategories.map(cat => {
                const CatIcon = CATEGORY_ICON[cat]
                const active = selectedCategory === cat
                return (
                  <button key={cat} type="button"
                    onClick={() => { setSelectedCategory(active ? null : cat); setSelectedConnectorId(null) }}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 font-body text-label transition-colors ${active ? 'bg-ink text-stone' : 'bg-stone3 text-muted hover:text-ink'}`}>
                    {CatIcon && <CatIcon size={10} strokeWidth={2} />}
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>

            {/* Scope bar — status + search */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-stone flex-shrink-0">
              <FilterDropdown
                label="Status"
                options={STATUS_FILTERS.map(f => ({ value: f.key, label: f.label }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-2 border border-rule2 focus-within:border-signal/50 px-2.5 py-1.5 transition-colors bg-stone2">
                  <Search size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search connectors…"
                    className="font-body text-label text-ink bg-transparent outline-none placeholder:text-muted/60 w-32"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"
                      className="text-muted hover:text-ink transition-colors">
                      <X size={11} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <span className="font-body text-muted text-label tabular-nums">{filtered.length}</span>
              </div>
            </div>

            {/* Connector grid — absolute overlay on card click */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length > 0 ? (
                <div className="relative">
                  {rows.map((rowCards, rowIdx) => (
                    <div key={rowIdx} ref={el => { rowRefs.current[rowIdx] = el }}>
                      <div className="grid grid-cols-2 gap-px bg-rule2">
                        {rowCards.map(c => (
                          <div key={c.id} className="bg-stone">
                            <ConnectorCard c={c}
                              selected={c.id === selectedConnectorId}
                              onClick={() => handleCardClick(c.id, rowIdx)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Floating overlay — appears over cards below the clicked row */}
                  {selectedConnector && overlayTop !== null && (
                    <div
                      className="absolute left-0 right-0 z-10 shadow-raise slide-in"
                      style={{ top: overlayTop }}
                    >
                      <ConnectorRowDetail c={selectedConnector} />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState message={`No connectors match "${searchQuery}"`} />
              )}
            </div>
          </>
        ) : activeTab === 'conflicts' ? (
          <ConflictsPanel resolved={resolvedConflicts} onResolve={resolveConflict} />
        ) : (
          <AIReadinessTab />
        )}
      </div>

    </div>
  )
}
