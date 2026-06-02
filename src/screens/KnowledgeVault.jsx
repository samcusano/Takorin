// Knowledge Vault — Operational Memory System
// Architecture mirrors how expert operators recall precedent:
// event-driven · condition-driven · anomaly-driven · outcome-driven
// Memory types: variance · intervention · sensory · seasonal · operator judgment · process causality

import { useState } from 'react'
import { knowledgeEntries, processMemory } from '../data/knowledge'
import {
  Database,
  Truck, ClipboardCheck, RotateCcw, TrendingDown, Shield, Zap, Waves, Share2, Check,
} from 'lucide-react'
import { StatusPill, SlidePanel, StatGrid, EmptyState } from '../components/UI'

// ── Operational Memory Domains ───────────────────────────────────────────────

const DOMAINS = [
  { id: 'active-deviations',    label: 'Active Deviations',    icon: Zap,           color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', badge: 'bg-danger/[0.04] text-danger' },
  { id: 'sensory-drift',        label: 'Sensory Drift',        icon: Waves,         color: 'text-signal',  bg: 'bg-signal/[0.05]',  border: 'border-l-signal',  badge: 'bg-signal/10 text-signal'  },
  { id: 'supplier-deviation',   label: 'Supplier Deviation',   icon: Truck,         color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'yield-loss',           label: 'Yield Loss',           icon: TrendingDown,  color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'capa-patterns',        label: 'CAPA Patterns',        icon: ClipboardCheck,color: 'text-muted',  bg: '',                  border: 'border-l-muted',  badge: 'bg-stone3 text-muted'    },
  { id: 'shift-recovery',       label: 'Shift Recovery',       icon: RotateCcw,     color: 'text-muted',  bg: '',                  border: 'border-l-muted',  badge: 'bg-stone3 text-muted'    },
  { id: 'regulatory-findings',  label: 'Regulatory Findings',  icon: Shield,        color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', badge: 'bg-danger/[0.04] text-danger' },
]

const MEMORY_TYPES = [
  { id: 'variance',     label: 'Variance memory',    dot: 'bg-warn',   border: 'border-l-warn'   },
  { id: 'intervention', label: 'Intervention memory', dot: 'bg-ok',    border: 'border-l-ok'     },
  { id: 'sensory',      label: 'Sensory memory',     dot: 'bg-signal',  border: 'border-l-signal'  },
  { id: 'seasonal',     label: 'Seasonal memory',    dot: 'bg-muted',  border: 'border-l-muted'  },
  { id: 'judgment',     label: 'Operator judgment',  dot: 'bg-ink',    border: 'border-l-ink'    },
  { id: 'causality',    label: 'Process causality',  dot: 'bg-muted',  border: 'border-l-muted'  },
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
  anomaly:   { chip: 'bg-danger/[0.04] text-danger', dot: 'bg-danger'  },
  event:     { chip: 'bg-warn/10 text-warn',     dot: 'bg-warn'    },
  condition: { chip: 'bg-signal/10 text-signal',   dot: 'bg-signal'   },
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

function EntryDetail({ entry, isPromoted, onPromote }) {
  if (!entry) return <EmptyState message="Select an entry" />
  const riskKey = entry.institutionalRisk?.split(' ')[0]
  const risk = RISK_CFG[riskKey]
  const confColor = entry.confidence >= 90 ? 'text-ok' : entry.confidence >= 80 ? 'text-signal' : 'text-warn'
  const domain = DOMAINS.find(d => d.id === entry._domain)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-5 border-b border-rule2">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {domain && (
                <span className={`font-body text-label px-2 py-0.5 ${domain.badge}`}>{domain.label}</span>
              )}
            </div>
            <div className="font-display font-bold text-ink text-head leading-snug">{entry.title}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`display-num text-metric leading-none ${confColor}`}>{entry.confidence}%</div>
            <div className="font-body text-muted text-label">confidence</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-stone3 flex items-center justify-center flex-shrink-0">
            <span className="font-body text-muted text-label">{entry.author.name.split(' ').map(p => p[0]).join('')}</span>
          </div>
          <span className="font-body text-muted text-label">{entry.author.name} · {entry.author.title}</span>
          <span className="font-body text-muted">·</span>
          <span className="font-body text-muted text-label">v{entry.version} · {entry.updatedAt}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div>
          <div className="font-body text-muted text-label mb-2">Expert observation</div>
          <p className="font-body text-ink text-sub leading-relaxed">{entry.body}</p>
        </div>
        <div>
          <div className="font-body text-muted text-label mb-2">Encoded rule</div>
          <pre className="font-body text-muted text-label leading-relaxed bg-stone2 px-4 py-3 whitespace-pre-wrap">{entry.codedRule}</pre>
        </div>
        <StatGrid cols={3} noBorder>
          {[
            { label: 'Evidence batches', val: entry.evidenceBase.batchCount != null ? String(entry.evidenceBase.batchCount) : 'Protocol-based' },
            { label: 'Year range',       val: entry.evidenceBase.yearRange },
            { label: 'Success rate',     val: entry.evidenceBase.successRate ?? 'N/A' },
          ].map(({ label, val }) => (
            <StatGrid.Cell key={label} label={label} value={val} size="sm" />
          ))}
        </StatGrid>
        {entry.activeBatches?.length > 0 && (
          <div>
            <div className="font-body text-muted text-label mb-2">Active batches</div>
            <div className="flex flex-wrap gap-1.5">
              {entry.activeBatches.map(b => (
                <span key={b} className="font-body text-signal text-label px-2 py-0.5 bg-signal/[0.06]">{b}</span>
              ))}
            </div>
          </div>
        )}
        {entry.institutionalRisk && (
          <div className={`px-4 py-3 border-l-2 ${
            entry.institutionalRisk.startsWith('HIGH')   ? 'border-l-danger bg-danger/[0.04]' :
            entry.institutionalRisk.startsWith('MEDIUM') ? 'border-l-warn bg-warn/[0.03]'     :
            'border-l-muted bg-stone2'
          }`}>
            <div className="font-body text-muted text-label mb-1">Institutional risk</div>
            <p className={`font-body text-body leading-snug ${entry.institutionalRisk.startsWith('HIGH') ? 'text-danger/80' : entry.institutionalRisk.startsWith('MEDIUM') ? 'text-warn/80' : 'text-muted'}`}>{entry.institutionalRisk}</p>
          </div>
        )}
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map(tag => (
              <span key={tag} className="font-body text-muted text-label px-2 py-0.5 bg-stone3">{tag}</span>
            ))}
          </div>
        )}

        {/* Cross-plant propagation */}
        <div className={`border border-rule2 px-4 py-4 ${isPromoted ? 'bg-ok/[0.04] border-ok/20' : 'bg-stone2'}`}>
          {isPromoted ? (
            <div className="flex items-center gap-2">
              <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
              <div>
                <div className="font-body text-ok text-label font-medium">Promoted to network knowledge base</div>
                <div className="font-body text-muted text-label mt-0.5">
                  Pending review by network ops lead before distribution to KS-02 and TX-11
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="font-body text-ink text-label font-medium mb-1">Promote to network</div>
              <p className="font-body text-muted text-label leading-relaxed mb-3">
                Share this resolution with KS-02 and TX-11. A network ops lead reviews before distribution — your operational context travels with the entry.
              </p>
              <button type="button" onClick={onPromote}
                className="flex items-center gap-2 font-body text-label text-muted hover:text-ink transition-colors px-3 py-1.5 border border-rule2 hover:border-ink/20 bg-stone">
                <Share2 size={11} strokeWidth={2} />
                Promote to other plants
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Variant B: Operational Memory Library (the chosen direction) ──────────────

function OperationalMemoryVault() {
  const [activeDomain, setActiveDomain] = useState('active-deviations')
  const [showMemory, setShowMemory]     = useState(false)
  const [slideEntry, setSlideEntry]     = useState(null)
  const [promotedEntries, setPromotedEntries] = useState(new Set())

  const domain = DOMAINS.find(d => d.id === activeDomain)

  // All entries for this domain — no inline filters
  const entries = ENRICHED.filter(e => e._domain === activeDomain)

  // Domain counts
  const domainCounts = DOMAINS.map(d => ({
    id: d.id,
    count: ENRICHED.filter(e => e._domain === d.id).length,
    activeCount: ENRICHED.filter(e => e._domain === d.id && e.activeBatches?.length > 0).length,
  }))

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: domain sidebar */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone overflow-hidden">
        {/* Memory domains */}
        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {DOMAINS.map(d => {
            const dc = domainCounts.find(x => x.id === d.id)
            const Icon = d.icon
            const isActive = activeDomain === d.id && !showMemory
            return (
              <button key={d.id} type="button"
                onClick={() => { setActiveDomain(d.id); setShowMemory(false) }}
                className={`w-full text-left px-4 py-3.5 border-l-2 transition-colors ${
                  isActive ? `bg-stone2 ${d.border}` : 'border-l-transparent hover:bg-stone2/50'
                }`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={isActive ? d.color : 'text-muted'} strokeWidth={2} />
                    <span className={`font-body font-medium text-body leading-snug ${isActive ? 'text-ink' : 'text-muted'}`}>{d.label}</span>
                  </div>
                  <span className={`display-num text-sub ${isActive ? 'text-muted' : 'text-muted/50'}`}>{dc?.count ?? 0}</span>
                </div>
                {dc?.activeCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                    <span className="font-body text-danger text-label">{dc.activeCount} active now</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Process Memory */}
        <button type="button"
          onClick={() => { setShowMemory(true) }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-rule2 transition-colors border-l-2 ${
            showMemory ? 'bg-stone2 border-l-signal' : 'border-l-transparent hover:bg-stone2/50'
          }`}>
          <Database size={10} className={showMemory ? 'text-signal' : 'text-muted'} strokeWidth={2} />
          <div className="text-left">
            <div className={`font-body font-medium text-label ${showMemory ? 'text-ink' : 'text-muted'}`}>Process Memory</div>
            <div className="font-body text-muted text-label">{processMemory.length} reference batches</div>
          </div>
        </button>
      </div>

      {/* Center: entries */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showMemory ? (
          <>
            <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
              <span className="font-body text-muted text-label">Process Memory · {processMemory.length} reference batches</span>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Batch list */}
              <div className="w-[280px] flex-shrink-0 border-r border-rule2 overflow-y-auto">
                {processMemory.map(m => {
                  const ocColor = { exceptional: 'text-ok', excellent: 'text-ok', underperformed: 'text-danger' }[m.outcome] ?? 'text-muted'
                  const border = m.outcome === 'underperformed' ? 'border-l-danger' : m.grade === 'Premium' ? 'border-l-signal' : 'border-l-muted'
                  return (
                    <button key={m.id} type="button" onClick={() => setSlideEntry({ _pm: true, ...m })}
                      className={`w-full text-left px-4 py-4 border-b border-rule2 transition-colors border-l-4 ${border} hover:bg-stone2/50`}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-body font-bold text-ink text-body">{m.batchId}</span>
                        <span className={`display-num text-sub ${m.grade === 'Premium' ? 'text-signal' : 'text-muted'}`}>{m.grade}</span>
                      </div>
                      <div className="font-body text-muted text-label mb-1.5">{m.sku}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-body text-muted text-label">Aroma <span className="display-num text-sub text-ink">{m.finalAromaScore}</span></span>
                        <span className={`font-body text-label capitalize font-medium ${ocColor}`}>{m.outcome}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex-1 flex items-center justify-center font-body text-muted text-label">
                Select a reference batch to review
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Domain header */}
            <div className={`flex-shrink-0 border-b border-rule2 border-l-4 ${domain?.border ?? 'border-l-rule2'} ${domain?.bg ?? ''}`}>
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3">
                  {domain && <domain.icon size={18} className={`${domain.color} flex-shrink-0 mt-0.5`} strokeWidth={1.5} />}
                  <div>
                    <div className="font-display font-bold text-ink text-head leading-none mb-1">{domain?.label}</div>
                    <div className="font-body text-muted text-body leading-relaxed">
                      {activeDomain === 'active-deviations'   ? 'Currently active process anomalies with open causal threads' :
                       activeDomain === 'sensory-drift'        ? 'Expert sensory observations, aroma and flavor deviation patterns' :
                       activeDomain === 'supplier-deviation'   ? 'Raw material variance records and supplier quality patterns' :
                       activeDomain === 'yield-loss'           ? 'Grade degradation, yield shortfalls, and quality ceiling events' :
                       activeDomain === 'capa-patterns'        ? 'Corrective action precedents and failure pattern library' :
                       activeDomain === 'shift-recovery'       ? 'Process recovery protocols and seasonal adjustment memory' :
                       'Regulatory audit findings, compliance events, inspection records'}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="display-num text-metric leading-none text-muted">{entries.length}</div>
                  <div className="font-body text-label text-muted mt-0.5">entries</div>
                </div>
              </div>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto">
              {entries.length === 0 ? (
                <EmptyState message="No entries in this domain" />
              ) : (
                <div className="px-3 py-3 space-y-2.5">
                  {entries.map(e => {
                        const riskKey  = e.institutionalRisk?.split(' ')[0]
                        const risk     = RISK_CFG[riskKey]
                        const confColor = e.confidence >= 90 ? 'text-ok' : e.confidence >= 80 ? 'text-signal' : 'text-warn'
                        const topBar   = riskKey === 'HIGH' ? 'bg-danger' : riskKey === 'MEDIUM' ? 'bg-warn' : 'bg-ok/50'
                        const recallC  = RECALL_COLOR[e._recallMode] ?? RECALL_COLOR.condition
                        return (
                          <article key={e.id}
                            className="bg-stone border border-rule2 overflow-hidden">
                            {/* Urgency accent bar */}
                            <div className={`h-[5px] w-full ${topBar}`} />
                            <button type="button" onClick={() => setSlideEntry(e)}
                              className="w-full text-left px-4 pt-3 pb-4 hover:bg-stone2/60 transition-colors">
                              {/* Header: chips + confidence (dominant) */}
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {risk && (
                                    <StatusPill tone={riskKey === 'HIGH' ? 'danger' : riskKey === 'MEDIUM' ? 'warn' : 'ok'}>
                                      {risk.label}
                                    </StatusPill>
                                  )}
                                  <span className={`inline-flex items-center gap-1 font-body text-label px-1.5 py-0.5 ${recallC.chip}`}>
                                    <span className={`w-1 h-1 rounded-full ${recallC.dot}`} />
                                    {e._recallMode}
                                  </span>
                                  {e.activeBatches?.length > 0 && (
                                    <span className="inline-flex items-center gap-1 font-body text-danger text-label font-semibold">
                                      <span className="live-dot w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />active
                                    </span>
                                  )}
                                  {promotedEntries.has(e.id) && (
                                    <span className="inline-flex items-center gap-1 font-body text-ok text-label">
                                      <Share2 size={8} strokeWidth={2} />network
                                    </span>
                                  )}
                                </div>
                                <div className={`display-num text-metric leading-none flex-shrink-0 ${confColor}`}>{e.confidence}%</div>
                              </div>
                              {/* Body: title + preview */}
                              <div className="font-body font-medium text-ink text-body leading-snug mb-1.5">{e.title}</div>
                              <div className="font-body text-muted text-label leading-snug line-clamp-2">{e.body?.slice(0, 110)}…</div>
                              {/* Footer: author + evidence + tags */}
                              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-rule2 flex-wrap">
                                <span className="font-body text-muted text-label">{e.author.name}</span>
                                <span className="font-body text-muted/40">·</span>
                                <span className="font-body text-muted text-label">{e.evidenceBase.batchCount ?? '—'} batches</span>
                                {e.tags?.slice(0, 2).map(tag => (
                                  <span key={tag} className="font-body text-muted/60 text-label px-1.5 py-0.5 bg-stone3">{tag}</span>
                                ))}
                              </div>
                            </button>
                          </article>
                        )
                      })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SlidePanel for entry detail */}
      {slideEntry && !slideEntry._pm && (
        <SlidePanel title={slideEntry.title} subtitle={TYPE_LABELS[slideEntry.type] ?? slideEntry.type}
          onClose={() => setSlideEntry(null)} maxWidth="520px">
          <EntryDetail
            entry={slideEntry}
            isPromoted={promotedEntries.has(slideEntry.id)}
            onPromote={() => setPromotedEntries(prev => new Set([...prev, slideEntry.id]))}
          />
        </SlidePanel>
      )}
      {slideEntry?._pm && (
        <SlidePanel title={slideEntry.batchId} subtitle={`${slideEntry.sku} · ${slideEntry.grade}`}
          onClose={() => setSlideEntry(null)} maxWidth="480px">
          <div className="space-y-4 px-1 py-2">
            <StatGrid cols={3} noBorder>
              {[{ label: 'Aroma', val: String(slideEntry.finalAromaScore) }, { label: 'EBC', val: String(slideEntry.finalEBC) }, { label: 'Amino N', val: slideEntry.finalAminoNitrogen }].map(({ label, val }) => (
                <StatGrid.Cell key={label} label={label} value={val} size="sm" />
              ))}
            </StatGrid>
            <div>
              <div className="font-body text-muted text-label mb-2">Key signal events</div>
              <div className="divide-y divide-rule2">
                {slideEntry.keySignals?.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="display-num text-sub text-muted w-10 flex-shrink-0 pt-0.5">Day {s.day}</span>
                    <div className="flex-1">
                      <div className="font-body font-medium text-ink text-label">{s.signal}</div>
                      <div className="font-body text-muted text-label">→ {s.outcome}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {slideEntry.masterBlenderNote && (
              <div className="px-4 py-3 bg-signal/[0.04] border border-signal/20 border-l-4 border-l-signal">
                <div className="font-body text-muted text-label mb-1">Master blender note</div>
                <p className="font-body text-ink text-body leading-relaxed">{slideEntry.masterBlenderNote}</p>
              </div>
            )}
          </div>
        </SlidePanel>
      )}
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function KnowledgeVault() {
  return <OperationalMemoryVault />
}
