// Knowledge Vault — Operational Memory System
// Architecture mirrors how expert operators recall precedent:
// event-driven · condition-driven · anomaly-driven · outcome-driven
// Memory types: variance · intervention · sensory · seasonal · operator judgment · process causality

import { useState } from 'react'
import { knowledgeEntries, processMemory } from '../data/knowledge'
import {
  AlertTriangle, ChevronDown, ChevronRight, Database, Activity,
  Truck, ClipboardCheck, RotateCcw, TrendingDown, Shield, Zap, Waves,
} from 'lucide-react'
import { Chip, SlidePanel } from '../components/UI'

// ── Operational Memory Domains ───────────────────────────────────────────────

const DOMAINS = [
  { id: 'active-deviations',    label: 'Active Deviations',    icon: Zap,           color: 'text-danger', bg: 'bg-danger/[0.06]', border: 'border-l-danger', badge: 'bg-danger/10 text-danger' },
  { id: 'sensory-drift',        label: 'Sensory Drift',        icon: Waves,         color: 'text-ochre',  bg: 'bg-ochre/[0.05]',  border: 'border-l-ochre',  badge: 'bg-ochre/10 text-ochre'  },
  { id: 'supplier-deviation',   label: 'Supplier Deviation',   icon: Truck,         color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'yield-loss',           label: 'Yield Loss',           icon: TrendingDown,  color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'capa-patterns',        label: 'CAPA Patterns',        icon: ClipboardCheck,color: 'text-muted',  bg: '',                  border: 'border-l-rule2',  badge: 'bg-stone3 text-muted'    },
  { id: 'shift-recovery',       label: 'Shift Recovery',       icon: RotateCcw,     color: 'text-muted',  bg: '',                  border: 'border-l-rule2',  badge: 'bg-stone3 text-muted'    },
  { id: 'regulatory-findings',  label: 'Regulatory Findings',  icon: Shield,        color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', badge: 'bg-danger/10 text-danger' },
]

const MEMORY_TYPES = [
  { id: 'variance',     label: 'Variance memory',    dot: 'bg-warn'   },
  { id: 'intervention', label: 'Intervention memory', dot: 'bg-ok'    },
  { id: 'sensory',      label: 'Sensory memory',     dot: 'bg-ochre'  },
  { id: 'seasonal',     label: 'Seasonal memory',    dot: 'bg-muted'  },
  { id: 'judgment',     label: 'Operator judgment',  dot: 'bg-ink'    },
  { id: 'causality',    label: 'Process causality',  dot: 'bg-ghost'  },
]

const RECALL_MODES = [
  { id: null,        label: 'All' },
  { id: 'anomaly',   label: 'Anomaly-driven' },
  { id: 'event',     label: 'Event-driven'   },
  { id: 'condition', label: 'Condition-driven' },
  { id: 'outcome',   label: 'Outcome-driven' },
]

// ── Domain + memory-type + recall-mode derivation ────────────────────────────

function getDomain(e) {
  const t = e.type
  const tags = e.tags ?? []
  const risk = e.institutionalRisk ?? ''

  if (e.activeBatches?.length > 0 && risk.startsWith('HIGH')) return 'active-deviations'
  if (tags.some(t => ['aroma', 'benzaldehyde', 'sensory', 'color', 'umami', 'calibration', 'EBC', 'grade-boundary'].includes(t)) || t === 'evaluation-method') return 'sensory-drift'
  if (e.category === 'raw-materials' || t === 'raw-material-variance' || tags.includes('provenance')) return 'supplier-deviation'
  if (tags.some(t => ['grade', 'amino-nitrogen', 'quality-prediction', 'yield'].includes(t)) || t === 'grade-rule') return 'yield-loss'
  if (e.category === 'compliance' || tags.some(t => ['allergen', 'ccp', 'compliance', 'haccp'].includes(t))) return 'regulatory-findings'
  if (tags.some(t => ['seasonal', 'pH', 'summer', 'winter', 'humidity', 'enzyme-activity', 'koji'].includes(t))) return 'shift-recovery'
  if (t === 'process-constraint') return 'capa-patterns'
  return 'active-deviations'
}

function getMemoryType(e) {
  const map = {
    'craft-threshold':        'judgment',
    'grade-rule':             'causality',
    'process-constraint':     'intervention',
    'evaluation-method':      'sensory',
    'raw-material-variance':  'variance',
  }
  const base = map[e.type] ?? 'variance'
  const tags = e.tags ?? []
  if (tags.some(t => ['seasonal', 'summer', 'winter', 'climate'].includes(t))) return 'seasonal'
  if (tags.some(t => ['aroma', 'umami', 'EBC', 'sensory', 'calibration', 'benzaldehyde'].includes(t))) return 'sensory'
  return base
}

function getRecallMode(e) {
  if (e.activeBatches?.length > 0) return 'anomaly'
  const t = e.type
  if (t === 'craft-threshold' || t === 'evaluation-method') return 'condition'
  if (t === 'grade-rule') return 'outcome'
  if (t === 'process-constraint' || t === 'raw-material-variance') return 'event'
  return 'condition'
}

// Enrich all entries once at module level
const ENRICHED = knowledgeEntries.map(e => ({
  ...e,
  _domain:     getDomain(e),
  _memoryType: getMemoryType(e),
  _recallMode: getRecallMode(e),
}))

const RECALL_COLOR = {
  anomaly:   { chip: 'bg-danger/10 text-danger', dot: 'bg-danger'  },
  event:     { chip: 'bg-warn/10 text-warn',     dot: 'bg-warn'    },
  condition: { chip: 'bg-ochre/10 text-ochre',   dot: 'bg-ochre'   },
  outcome:   { chip: 'bg-ok/10 text-ok',         dot: 'bg-ok'      },
}

const RISK_CFG = {
  'HIGH':   { label: 'High risk',   tone: 'danger' },
  'MEDIUM': { label: 'Medium risk', tone: 'warn'   },
  'LOW':    { label: 'Low risk',    tone: 'ok'     },
}

const TYPE_LABELS = {
  'craft-threshold':       'Craft threshold',
  'grade-rule':            'Grade rule',
  'process-constraint':    'Process constraint',
  'evaluation-method':     'Evaluation method',
  'raw-material-variance': 'Raw material variance',
}

// ── Entry detail (shared across variants) ────────────────────────────────────

function EntryDetail({ entry }) {
  if (!entry) return <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">Select an entry</div>
  const riskKey = entry.institutionalRisk?.split(' ')[0]
  const risk = RISK_CFG[riskKey]
  const confColor = entry.confidence >= 90 ? 'text-ok' : entry.confidence >= 80 ? 'text-ochre' : 'text-warn'
  const memType = MEMORY_TYPES.find(m => m.id === entry._memoryType)
  const recallColor = RECALL_COLOR[entry._recallMode] ?? RECALL_COLOR.condition
  const domain = DOMAINS.find(d => d.id === entry._domain)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-5 border-b border-rule2">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {domain && (
                <span className={`font-body text-[9px] px-2 py-0.5 rounded-btn ${domain.badge}`}>{domain.label}</span>
              )}
              {memType && (
                <span className="inline-flex items-center gap-1 font-body text-[9px] text-ghost">
                  <span className={`w-1.5 h-1.5 rounded-full ${memType.dot}`} />{memType.label}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 font-body font-medium text-[9px] px-2 py-0.5 rounded-btn ${recallColor.chip}`}>
                <span className={`w-1 h-1 rounded-full ${recallColor.dot}`} />
                {entry._recallMode}-driven
              </span>
            </div>
            <div className="font-display font-bold text-ink text-[18px] leading-snug">{entry.title}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-display font-bold display-num text-[32px] leading-none ${confColor}`}>{entry.confidence}%</div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">confidence</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-stone3 border border-rule2 flex items-center justify-center flex-shrink-0">
            <span className="font-body text-ghost text-[8px]">{entry.author.name.split(' ').map(p => p[0]).join('')}</span>
          </div>
          <span className="font-body text-muted text-[11px]">{entry.author.name} · {entry.author.title}</span>
          <span className="font-body text-ghost">·</span>
          <span className="font-body text-ghost text-[10px]">v{entry.version} · {entry.updatedAt}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Expert observation</div>
          <p className="font-body text-ink text-[13px] leading-relaxed">{entry.body}</p>
        </div>
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Encoded rule</div>
          <pre className="font-body text-muted text-[10px] leading-relaxed bg-stone2 border border-rule2 px-4 py-3 whitespace-pre-wrap">{entry.codedRule}</pre>
        </div>
        <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
          {[
            { label: 'Evidence batches', val: entry.evidenceBase.batchCount != null ? String(entry.evidenceBase.batchCount) : 'Protocol-based' },
            { label: 'Year range',       val: entry.evidenceBase.yearRange },
            { label: 'Success rate',     val: entry.evidenceBase.successRate ?? 'N/A' },
          ].map(({ label, val }) => (
            <div key={label} className="bg-stone px-3 py-2.5">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
              <div className="font-body font-medium text-ink text-[12px]">{val}</div>
            </div>
          ))}
        </div>
        {entry.activeBatches?.length > 0 && (
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Active batches</div>
            <div className="flex flex-wrap gap-1.5">
              {entry.activeBatches.map(b => (
                <span key={b} className="font-body text-ochre text-[10px] px-2 py-0.5 border border-ochre/40 bg-ochre/[0.06]">{b}</span>
              ))}
            </div>
          </div>
        )}
        {entry.institutionalRisk && (
          <div className={`px-4 py-3 border border-l-4 ${
            entry.institutionalRisk.startsWith('HIGH')   ? 'border-danger/30 border-l-danger bg-danger/[0.03]' :
            entry.institutionalRisk.startsWith('MEDIUM') ? 'border-warn/30 border-l-warn bg-warn/[0.02]'     :
            'border-rule2 border-l-ok'
          }`}>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Institutional risk</div>
            <p className="font-body text-muted text-[11px] leading-snug">{entry.institutionalRisk}</p>
          </div>
        )}
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map(tag => (
              <span key={tag} className="font-body text-ghost text-[9px] px-2 py-0.5 bg-stone3">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Variant B: Operational Memory Library (the chosen direction) ──────────────

function OperationalMemoryVault() {
  const [activeDomain, setActiveDomain]   = useState('active-deviations')
  const [recallMode, setRecallMode]       = useState(null)
  const [memTypeFilter, setMemTypeFilter] = useState(null)
  const [showMemory, setShowMemory]       = useState(false)
  const [slideEntry, setSlideEntry]       = useState(null)
  const [expandedIds, setExpandedIds]     = useState(new Set())

  const domain = DOMAINS.find(d => d.id === activeDomain)

  // Filter entries
  let entries = ENRICHED.filter(e => e._domain === activeDomain)
  if (recallMode) entries = entries.filter(e => e._recallMode === recallMode)
  if (memTypeFilter) entries = entries.filter(e => e._memoryType === memTypeFilter)

  // Group entries by memory type within domain
  const grouped = MEMORY_TYPES.map(mt => ({
    ...mt,
    entries: entries.filter(e => e._memoryType === mt.id),
  })).filter(g => g.entries.length > 0)

  // Domain counts
  const domainCounts = DOMAINS.map(d => ({
    id: d.id,
    count: ENRICHED.filter(e => e._domain === d.id).length,
    activeCount: ENRICHED.filter(e => e._domain === d.id && e.activeBatches?.length > 0).length,
  }))

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: domain sidebar */}
      <div className="w-[200px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-[15px] leading-none">Knowledge Vault</div>
        </div>

        {/* Memory domains */}
        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {DOMAINS.map(d => {
            const dc = domainCounts.find(x => x.id === d.id)
            const Icon = d.icon
            const isActive = activeDomain === d.id && !showMemory
            return (
              <button key={d.id} type="button"
                onClick={() => { setActiveDomain(d.id); setShowMemory(false); setRecallMode(null); setMemTypeFilter(null) }}
                className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                  isActive ? `bg-stone2 border-l-ochre` : 'border-l-transparent hover:bg-stone2/50'
                }`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={10} className={isActive ? 'text-ink' : 'text-ghost'} strokeWidth={1.75} />
                    <span className={`font-body font-medium text-[11px] leading-snug ${isActive ? 'text-ink' : 'text-muted'}`}>{d.label}</span>
                  </div>
                  <span className="font-body text-ghost text-[10px]">{dc?.count ?? 0}</span>
                </div>
                {dc?.activeCount > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-danger flex-shrink-0" />
                    <span className="font-body text-danger text-[9px]">{dc.activeCount} active</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Process Memory */}
        <button type="button"
          onClick={() => { setShowMemory(true); setRecallMode(null); setMemTypeFilter(null) }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-rule2 transition-colors border-l-2 ${
            showMemory ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
          }`}>
          <Database size={10} className={showMemory ? 'text-ochre' : 'text-ghost'} strokeWidth={1.75} />
          <div className="text-left">
            <div className={`font-body font-medium text-[11px] ${showMemory ? 'text-ink' : 'text-muted'}`}>Process Memory</div>
            <div className="font-body text-ghost text-[9px]">{processMemory.length} reference batches</div>
          </div>
        </button>
      </div>

      {/* Center: entries */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showMemory ? (
          <>
            <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Process Memory · {processMemory.length} reference batches</span>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Batch list */}
              <div className="w-[260px] flex-shrink-0 border-r border-rule2 overflow-y-auto">
                {processMemory.map(m => {
                  const oc = { exceptional: 'text-ok', excellent: 'text-ok', underperformed: 'text-danger' }[m.outcome] ?? 'text-muted'
                  return (
                    <button key={m.id} type="button" onClick={() => setSlideEntry({ _pm: true, ...m })}
                      className="w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors border-l-4 border-l-transparent hover:bg-stone2/50 hover:border-l-ochre">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-body font-medium text-ink text-[12px]">{m.batchId}</span>
                        <span className={`font-display font-bold text-[16px] ${m.grade === 'Premium' ? 'text-ochre' : 'text-muted'}`}>{m.grade}</span>
                      </div>
                      <div className="font-body text-ghost text-[10px]">{m.sku}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-body text-ghost text-[9px]">Aroma {m.finalAromaScore}</span>
                        <span className="font-body text-ghost text-[9px]">·</span>
                        <span className={`font-body text-[9px] capitalize ${oc}`}>{m.outcome}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex-1 flex items-center justify-center font-body text-ghost text-[11px]">
                Select a reference batch to review
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Domain header + filter chips */}
            <div className="flex-shrink-0 border-b border-rule2 bg-stone">
              <div className={`px-5 py-3 border-b border-rule2 ${domain?.bg ?? ''}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  {domain && <domain.icon size={12} className={domain.color} strokeWidth={1.75} />}
                  <span className={`font-display font-bold text-ink text-[16px]`}>{domain?.label}</span>
                  <span className="font-body text-ghost text-[10px] ml-1">{entries.length} entries</span>
                </div>
                <div className="font-body text-ghost text-[9px]">
                  {activeDomain === 'active-deviations'   ? 'Currently active process anomalies with open causal threads' :
                   activeDomain === 'sensory-drift'        ? 'Expert sensory observations, aroma and flavor deviation patterns' :
                   activeDomain === 'supplier-deviation'   ? 'Raw material variance records and supplier quality patterns' :
                   activeDomain === 'yield-loss'           ? 'Grade degradation, yield shortfalls, and quality ceiling events' :
                   activeDomain === 'capa-patterns'        ? 'Corrective action precedents and failure pattern library' :
                   activeDomain === 'shift-recovery'       ? 'Process recovery protocols and seasonal adjustment memory' :
                   'Regulatory audit findings, compliance events, inspection records'}
                </div>
              </div>

              {/* Recall mode chips */}
              <div className="px-5 py-2.5 border-b border-rule2 flex items-center gap-2 flex-wrap">
                <span className="font-body text-ghost text-[9px] uppercase tracking-widest mr-1">Recall</span>
                {RECALL_MODES.map(m => {
                  const color = m.id ? RECALL_COLOR[m.id] : null
                  const isActive = recallMode === m.id
                  return (
                    <button key={String(m.id)} type="button"
                      onClick={() => setRecallMode(m.id)}
                      className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 rounded-btn transition-colors ${
                        isActive
                          ? (color ? color.chip : 'bg-ochre/10 text-ochre')
                          : 'bg-stone3 text-ghost hover:text-muted'
                      }`}>
                      <span className={`w-1 h-1 rounded-full ${isActive && color ? color.dot : 'bg-current'}`} />
                      {m.label}
                    </button>
                  )
                })}
              </div>

              {/* Memory type chips */}
              <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap">
                <span className="font-body text-ghost text-[9px] uppercase tracking-widest mr-1">Memory</span>
                <button type="button" onClick={() => setMemTypeFilter(null)}
                  className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 rounded-btn transition-colors ${!memTypeFilter ? 'bg-ochre/10 text-ochre' : 'bg-stone3 text-ghost hover:text-muted'}`}>
                  <span className="w-1 h-1 rounded-full bg-current" />All
                </button>
                {MEMORY_TYPES.map(mt => {
                  const inDomain = entries.some(e => e._memoryType === mt.id)
                  if (!inDomain && !memTypeFilter) return null
                  const isActive = memTypeFilter === mt.id
                  return (
                    <button key={mt.id} type="button" onClick={() => setMemTypeFilter(isActive ? null : mt.id)}
                      className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 rounded-btn transition-colors ${
                        isActive ? 'bg-ink text-stone' : 'bg-stone3 text-ghost hover:text-muted'
                      }`}>
                      <span className={`w-1 h-1 rounded-full ${mt.dot}`} />
                      {mt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Entry list grouped by memory type */}
            <div className="flex-1 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
                  No entries match this filter combination
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.id}>
                    {/* Memory type section header */}
                    <div className="flex items-center gap-2 px-5 py-2 bg-stone2 border-b border-rule2 sticky top-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${group.dot}`} />
                      <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{group.label}</span>
                      <span className="font-body text-ghost/50 text-[9px] ml-1">{group.entries.length}</span>
                    </div>
                    <div className="divide-y divide-rule2">
                      {group.entries.map(e => {
                        const riskKey = e.institutionalRisk?.split(' ')[0]
                        const risk = RISK_CFG[riskKey]
                        const confColor = e.confidence >= 90 ? 'text-ok' : e.confidence >= 80 ? 'text-ochre' : 'text-warn'
                        const borderLeft = riskKey === 'HIGH' ? 'border-l-danger' : riskKey === 'MEDIUM' ? 'border-l-warn' : 'border-l-ok/40'
                        const recallC = RECALL_COLOR[e._recallMode] ?? RECALL_COLOR.condition
                        return (
                          <button key={e.id} type="button" onClick={() => setSlideEntry(e)}
                            className={`w-full text-left px-5 py-4 hover:bg-stone2/50 transition-colors border-l-4 ${borderLeft}`}>
                            <div className="flex items-start justify-between gap-4 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {risk && (
                                    <Chip tone={riskKey === 'HIGH' ? 'danger' : riskKey === 'MEDIUM' ? 'warn' : 'ok'}>
                                      {risk.label}
                                    </Chip>
                                  )}
                                  <span className={`inline-flex items-center gap-1 font-body text-[9px] px-1.5 py-0.5 rounded-btn ${recallC.chip}`}>
                                    <span className={`w-1 h-1 rounded-full ${recallC.dot}`} />
                                    {e._recallMode}
                                  </span>
                                  {e.activeBatches?.length > 0 && (
                                    <span className="font-body text-danger text-[9px] font-medium">· active</span>
                                  )}
                                </div>
                                <div className="font-body font-medium text-ink text-[12px] leading-snug">{e.title}</div>
                              </div>
                              <div className={`font-display font-bold display-num text-[22px] leading-none flex-shrink-0 ${confColor}`}>{e.confidence}%</div>
                            </div>
                            <div className="font-body text-ghost text-[10px] leading-snug truncate">{e.body?.slice(0, 100)}…</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-body text-ghost text-[9px]">{e.author.name}</span>
                              <span className="font-body text-ghost/50">·</span>
                              <span className="font-body text-ghost text-[9px]">{e.evidenceBase.batchCount ?? '—'} batches evidence</span>
                              {e.tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="font-body text-ghost/60 text-[9px] px-1.5 py-0.5 bg-stone3">{tag}</span>
                              ))}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* SlidePanel for entry detail */}
      {slideEntry && !slideEntry._pm && (
        <SlidePanel title={slideEntry.title} subtitle={TYPE_LABELS[slideEntry.type] ?? slideEntry.type}
          onClose={() => setSlideEntry(null)} maxWidth="520px">
          <EntryDetail entry={slideEntry} />
        </SlidePanel>
      )}
      {slideEntry?._pm && (
        <SlidePanel title={slideEntry.batchId} subtitle={`${slideEntry.sku} · ${slideEntry.grade}`}
          onClose={() => setSlideEntry(null)} maxWidth="480px">
          <div className="space-y-4 px-1 py-2">
            <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
              {[{ label: 'Aroma', val: String(slideEntry.finalAromaScore) }, { label: 'EBC', val: String(slideEntry.finalEBC) }, { label: 'Amino N', val: slideEntry.finalAminoNitrogen }].map(({ label, val }) => (
                <div key={label} className="bg-stone px-3 py-2.5">
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
                  <div className="font-body font-medium text-ink text-[12px]">{val}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Key signal events</div>
              <div className="divide-y divide-rule2 border border-rule2">
                {slideEntry.keySignals?.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="font-body text-ghost text-[9px] w-10 flex-shrink-0 pt-0.5">Day {s.day}</span>
                    <div className="flex-1">
                      <div className="font-body font-medium text-ink text-[11px]">{s.signal}</div>
                      <div className="font-body text-muted text-[10px]">→ {s.outcome}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {slideEntry.masterBlenderNote && (
              <div className="px-4 py-3 bg-ochre/[0.04] border border-ochre/20 border-l-4 border-l-ochre">
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Master blender note</div>
                <p className="font-body text-ink text-[12px] leading-relaxed">{slideEntry.masterBlenderNote}</p>
              </div>
            )}
          </div>
        </SlidePanel>
      )}
    </div>
  )
}

// ── Variant A: Research Mode ──────────────────────────────────────────────────

function ResearchMode({ variant, setVariant }) {
  const [filterCat, setFilterCat]     = useState(null)
  const [showMemory, setShowMemory]   = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())

  const ALL_DOMAINS = [{ id: null, label: 'All', count: ENRICHED.length }, ...DOMAINS.map(d => ({ id: d.id, label: d.label, count: ENRICHED.filter(e => e._domain === d.id).length }))]
  const filtered = filterCat ? ENRICHED.filter(e => e._domain === filterCat) : ENRICHED

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-rule2 bg-stone2">
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Knowledge Vault</div>
        </div>
        <div className="flex items-stretch border border-rule2 overflow-hidden">
          {['A', 'B', 'C'].map(v => (
            <button key={v} type="button" onClick={() => setVariant(v)}
              className={`font-body text-[10px] px-2.5 py-1 transition-colors ${variant === v ? 'bg-ink text-stone' : 'text-ghost hover:text-muted'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      {/* Domain filter chips */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-rule2 flex-wrap">
        {ALL_DOMAINS.map(d => {
          const domDef = DOMAINS.find(x => x.id === d.id)
          const isActive = filterCat === d.id && !showMemory
          return (
            <button key={String(d.id)} type="button"
              onClick={() => { setFilterCat(d.id); setShowMemory(false) }}
              className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 rounded-btn transition-colors ${
                isActive ? (domDef ? domDef.badge : 'bg-ochre/10 text-ochre') : 'bg-stone3 text-ghost hover:text-muted'
              }`}>
              <span className="w-1 h-1 rounded-full bg-current" />{d.label} <span className="opacity-60">{d.count}</span>
            </button>
          )
        })}
        <button type="button" onClick={() => { setShowMemory(true); setFilterCat(null) }}
          className={`inline-flex items-center gap-1 font-body font-medium text-[10px] px-2 py-0.5 rounded-btn transition-colors ${showMemory ? 'bg-ochre/10 text-ochre' : 'bg-stone3 text-ghost hover:text-muted'}`}>
          <span className="w-1 h-1 rounded-full bg-current" />Process Memory {processMemory.length}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-rule2">
        {filtered.map(e => {
          const open = expandedIds.has(e.id)
          const riskKey = e.institutionalRisk?.split(' ')[0]
          const borderLeft = riskKey === 'HIGH' ? 'border-l-danger' : riskKey === 'MEDIUM' ? 'border-l-warn' : 'border-l-ok/40'
          const domain = DOMAINS.find(d => d.id === e._domain)
          const conf = e.confidence >= 90 ? 'text-ok' : e.confidence >= 80 ? 'text-ochre' : 'text-warn'
          return (
            <div key={e.id} className={`border-l-4 ${borderLeft}`}>
              <button type="button"
                onClick={() => setExpandedIds(prev => { const n = new Set(prev); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n })}
                className="w-full text-left px-5 py-4 hover:bg-stone2/50 transition-colors flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {domain && <span className={`font-body text-[9px] px-1.5 py-0.5 rounded-btn ${domain.badge} mb-1 inline-block`}>{domain.label}</span>}
                  <div className="font-body font-medium text-ink text-[13px] leading-snug mb-1">{e.title}</div>
                  <div className="font-body text-ghost text-[10px] line-clamp-2">{e.body?.slice(0, 100)}…</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`font-display font-bold display-num text-[22px] ${conf}`}>{e.confidence}%</div>
                  {open ? <ChevronDown size={12} className="text-ghost" /> : <ChevronRight size={12} className="text-ghost" />}
                </div>
              </button>
              {open && (
                <div className="px-5 pb-4 border-t border-rule2 bg-stone2">
                  <p className="font-body text-ink text-[12px] leading-relaxed pt-3 mb-3">{e.body}</p>
                  <pre className="font-body text-muted text-[10px] leading-relaxed bg-stone border border-rule2 px-4 py-3 whitespace-pre-wrap">{e.codedRule}</pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Variant C: Deep Reference (3-panel) ───────────────────────────────────────

function DeepReference({ variant, setVariant }) {
  const [activeDomain, setActiveDomain] = useState(null)
  const [selectedId, setSelectedId]     = useState(ENRICHED[0]?.id ?? null)
  const [showMemory, setShowMemory]     = useState(false)

  const filtered = activeDomain ? ENRICHED.filter(e => e._domain === activeDomain) : ENRICHED
  const entry    = ENRICHED.find(e => e.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal">
      {/* Left: domain nav */}
      <div className="w-[200px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-rule2 bg-stone2">
          <div className="font-display font-bold text-ink text-[15px] leading-none">Knowledge Vault</div>
          <div className="flex items-stretch border border-rule2 overflow-hidden">
            {['A', 'B', 'C'].map(v => (
              <button key={v} type="button" onClick={() => setVariant(v)}
                className={`font-body text-[9px] px-1.5 py-1 transition-colors ${variant === v ? 'bg-ink text-stone' : 'text-ghost hover:text-muted'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          <button type="button" onClick={() => { setActiveDomain(null); setShowMemory(false) }}
            className={`w-full text-left px-4 py-3 border-l-2 transition-colors flex items-center justify-between ${!activeDomain && !showMemory ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
            <span className="font-body font-medium text-ink text-[12px]">All entries</span>
            <span className="font-body text-ghost text-[10px]">{ENRICHED.length}</span>
          </button>
          {DOMAINS.map(d => {
            const isActive = activeDomain === d.id && !showMemory
            const count = ENRICHED.filter(e => e._domain === d.id).length
            const activeCount = ENRICHED.filter(e => e._domain === d.id && e.activeBatches?.length > 0).length
            return (
              <button key={d.id} type="button" onClick={() => { setActiveDomain(d.id); setShowMemory(false) }}
                className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${isActive ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-body font-medium text-ink text-[12px]">{d.label}</span>
                  <span className="font-body text-ghost text-[10px]">{count}</span>
                </div>
                {activeCount > 0 && <span className="font-body text-danger text-[9px]">· {activeCount} active</span>}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => { setShowMemory(true); setActiveDomain(null) }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-rule2 border-l-2 transition-colors ${showMemory ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'}`}>
          <Database size={10} className={showMemory ? 'text-ochre' : 'text-ghost'} strokeWidth={1.75} />
          <div>
            <div className={`font-body font-medium text-[11px] ${showMemory ? 'text-ink' : 'text-muted'}`}>Process Memory</div>
            <div className="font-body text-ghost text-[9px]">{processMemory.length} batches</div>
          </div>
        </button>
      </div>
      {/* Center: entry list */}
      {!showMemory && (
        <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{filtered.length} entries</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-rule2">
            {filtered.map(e => {
              const riskKey = e.institutionalRisk?.split(' ')[0]
              const conf = e.confidence >= 90 ? 'text-ok' : e.confidence >= 80 ? 'text-ochre' : 'text-warn'
              const domain = DOMAINS.find(d => d.id === e._domain)
              const borderLeft = riskKey === 'HIGH' ? 'border-l-danger' : riskKey === 'MEDIUM' ? 'border-l-warn' : 'border-l-ok/40'
              return (
                <button key={e.id} type="button" onClick={() => setSelectedId(e.id)}
                  className={`w-full text-left px-4 py-3.5 border-l-4 transition-colors ${selectedId === e.id ? 'bg-stone2 border-l-ochre' : `${borderLeft} hover:bg-stone2/50`}`}>
                  {domain && <span className={`font-body text-[8px] px-1.5 py-0.5 rounded-btn ${domain.badge} mb-1 inline-block`}>{domain.label}</span>}
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-body font-medium text-ink text-[12px] leading-snug flex-1">{e.title}</div>
                    <div className={`font-display font-bold display-num text-[20px] leading-none flex-shrink-0 ${conf}`}>{e.confidence}%</div>
                  </div>
                  <div className="font-body text-ghost text-[9px] mt-1 truncate">{e.body?.slice(0, 60)}…</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {/* Right: entry detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        {showMemory
          ? <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">Select a reference batch</div>
          : <EntryDetail entry={entry} />}
      </div>
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function KnowledgeVault() {
  return <OperationalMemoryVault />
}
