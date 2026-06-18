// Knowledge Vault — Operational Memory System
// Architecture mirrors how expert operators recall precedent:
// event-driven · condition-driven · anomaly-driven · outcome-driven
// Memory types: variance · intervention · sensory · seasonal · operator judgment · process causality

import { useState } from 'react'
import { knowledgeEntries, recipeEntries, processMemory } from '../data/knowledge'
import {
  Database, FlaskConical, Forward,
  Truck, ClipboardCheck, RotateCcw, TrendingDown, Shield, Zap, Waves, Share2, Check,
  Search, Brain, Video, Mic, FileText, Plus, ArrowRight,
} from 'lucide-react'
import { StatusPill, SlidePanel, StatGrid, EmptyState, Btn, SegmentedControl } from '../components/UI'

// ── Operational Memory Domains ───────────────────────────────────────────────

const DOMAINS = [
  { id: 'active-deviations',    label: 'Active Deviations',    icon: Zap,           color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', badge: 'bg-danger/[0.04] text-danger' },
  { id: 'sensory-drift',        label: 'Sensory Drift',        icon: Waves,         color: 'text-signal',  bg: 'bg-signal/[0.05]',  border: 'border-l-signal',  badge: 'bg-signal/10 text-signal'  },
  { id: 'supplier-deviation',   label: 'Supplier Deviation',   icon: Truck,         color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'yield-loss',           label: 'Yield Loss',           icon: TrendingDown,  color: 'text-warn',   bg: 'bg-warn/[0.04]',   border: 'border-l-warn',   badge: 'bg-warn/10 text-warn'    },
  { id: 'capa-patterns',        label: 'CAPA Patterns',        icon: ClipboardCheck,color: 'text-muted',  bg: '',                  border: 'border-l-muted',  badge: 'bg-stone3 text-muted'    },
  { id: 'shift-recovery',       label: 'Shift Recovery',       icon: RotateCcw,     color: 'text-muted',  bg: '',                  border: 'border-l-muted',  badge: 'bg-stone3 text-muted'    },
  { id: 'regulatory-findings',  label: 'Regulatory Findings',  icon: Shield,        color: 'text-danger', bg: 'bg-danger/[0.04]', border: 'border-l-danger', badge: 'bg-danger/[0.04] text-danger' },
  { id: 'recipes',              label: 'Recipes',              icon: FlaskConical,  color: 'text-ok',     bg: 'bg-ok/[0.03]',     border: 'border-l-ok',     badge: 'bg-ok/10 text-ok'        },
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

  if (t === 'recipe-specification') return 'recipes'
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
    'recipe-specification':   'intervention',
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

// Enrich all entries once at module level — knowledge + recipes merged
const ENRICHED = [...knowledgeEntries, ...recipeEntries].map(e => ({
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
  'recipe-specification':  'Recipe specification',
}

// ── Parsed rule — readable When/Then instead of raw code ─────────────────────

function ParsedRule({ rule }) {
  if (!rule) return null
  const thenIdx = rule.indexOf(' THEN ')
  if (thenIdx === -1) return (
    <div className="font-body text-ink text-label leading-relaxed bg-stone2 px-4 py-3 border border-rule2">{rule}</div>
  )
  const condition = rule.slice(0, thenIdx).replace(/^IF /, '')
  const action    = rule.slice(thenIdx + 6)
  return (
    <div className="border border-rule2 overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-rule2 bg-stone2">
        <span className="font-body text-label text-muted w-10 flex-shrink-0 pt-px">When</span>
        <span className="font-body text-ink text-label leading-relaxed">{condition}</span>
      </div>
      <div className="flex items-start gap-3 px-4 py-3 bg-stone2/40">
        <span className="font-body text-label text-muted w-10 flex-shrink-0 pt-px">Then</span>
        <span className="font-body font-medium text-ink text-label leading-relaxed">{action}</span>
      </div>
    </div>
  )
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
            {entry._captured ? (
              <>
                <div className="display-num text-head font-bold tabular-nums leading-none text-signal">NEW</div>
                <div className="font-body text-muted text-label">awaiting validation</div>
              </>
            ) : entry.evidenceBase?.batchCount != null ? (
              <>
                <div className={`display-num text-head font-bold tabular-nums leading-none ${confColor}`}>{entry.evidenceBase.batchCount}</div>
                <div className="font-body text-muted text-label">applications</div>
              </>
            ) : (
              <>
                <div className={`display-num text-head font-bold tabular-nums leading-none ${confColor}`}>{entry.confidence}%</div>
                <div className="font-body text-muted text-label">confidence</div>
              </>
            )}
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

        {/* Observation */}
        <div>
          <div className="font-body text-muted text-label mb-2">
            {entry.type === 'recipe-specification' ? 'Description' : 'Observation'}
          </div>
          <p className="font-body text-ink text-sub leading-relaxed">{entry.body}</p>
        </div>

        {/* Recipe parameters */}
        {entry.type === 'recipe-specification' && entry.parameters && (
          <div>
            <div className="font-body text-muted text-label mb-2">Process parameters · {entry.recipeId} v{entry.version}</div>
            <div className="border border-rule2 overflow-hidden">
              <div className="grid grid-cols-4 bg-stone2 border-b border-rule2">
                {['Parameter', 'LCL', 'Target', 'UCL'].map(h => (
                  <div key={h} className="px-4 py-2 font-body text-muted text-label">{h}</div>
                ))}
              </div>
              {entry.parameters.map(p => (
                <div key={p.name} className="grid grid-cols-4 border-b border-rule2 last:border-0 hover:bg-stone2/40 transition-colors">
                  <div className="px-4 py-2.5 font-body text-ink text-label">{p.name}</div>
                  <div className="px-4 py-2.5 font-body text-muted text-label tabular-nums">{p.lcl}{p.unit}</div>
                  <div className="px-4 py-2.5 font-body font-medium text-ink text-label tabular-nums">{p.target}{p.unit}</div>
                  <div className="px-4 py-2.5 font-body text-muted text-label tabular-nums">{p.ucl}{p.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rule — When/Then instead of raw code */}
        {entry.codedRule && (
          <div>
            <div className="font-body text-muted text-label mb-2">Rule</div>
            <ParsedRule rule={entry.codedRule} />
          </div>
        )}

        {/* Evidence — inline, not a grid */}
        {entry.evidenceBase && (
          <div className="flex items-center gap-2 flex-wrap">
            {entry.evidenceBase.batchCount != null && (
              <span className="font-body text-label text-ink font-medium">{entry.evidenceBase.batchCount} applications</span>
            )}
            {entry.evidenceBase.successRate && (
              <>
                <span className="font-body text-label text-muted opacity-40">·</span>
                <span className={`font-body text-label font-medium ${confColor}`}>{entry.evidenceBase.successRate} success</span>
              </>
            )}
            {entry.evidenceBase.yearRange && (
              <>
                <span className="font-body text-label text-muted opacity-40">·</span>
                <span className="font-body text-label text-muted">{entry.evidenceBase.yearRange}</span>
              </>
            )}
          </div>
        )}

        {/* Last applied — from process memory */}
        {(() => {
          const lastApplied = processMemory.filter(m =>
            m.relevantEntries?.includes(entry.id) || entry.processMemoryIds?.includes(m.id)
          ).slice(-1)[0]
          if (!lastApplied) return null
          const ocColor = { exceptional: 'text-ok', excellent: 'text-ok', underperformed: 'text-danger' }[lastApplied.outcome] ?? 'text-muted'
          return (
            <div className="flex items-start gap-3 px-4 py-3 bg-stone2 border border-rule2">
              <div className="flex-1 min-w-0">
                <div className="font-body text-muted text-label mb-0.5">Last applied</div>
                <div className="font-body font-medium text-ink text-label">{lastApplied.batchId} · {lastApplied.sku}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-body text-label font-medium capitalize ${ocColor}`}>{lastApplied.outcome}</div>
                <div className="font-body text-label text-muted">Aroma {lastApplied.finalAromaScore}</div>
              </div>
            </div>
          )
        })()}

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
              <Btn variant="secondary" icon={Forward} onClick={onPromote}>
                Promote to other plants
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ask the vault — retrieval over the existing tagged index, not a chat model ──
// Scores entries by keyword overlap against title/body/tags, returns the closest
// matches with a citation back to the source entry — same "show your source"
// pattern used for agent decisions elsewhere in the app.

function scoreEntry(entry, tokens) {
  const haystack = `${entry.title} ${entry.body} ${(entry.tags ?? []).join(' ')}`.toLowerCase()
  return tokens.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0)
}

function matchStrength(score, tokenCount) {
  const pct = tokenCount > 0 ? score / tokenCount : 0
  if (pct >= 0.6) return { label: 'High match', tone: 'ok' }
  if (pct >= 0.3) return { label: 'Partial match', tone: 'warn' }
  return { label: 'Weak match', tone: 'muted' }
}

function VaultQuery({ entries, onOpenEntry, onLogCapture, onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = not searched yet

  const runSearch = () => {
    const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2)
    if (tokens.length === 0) { setResults([]); return }
    const scored = entries
      .map(e => ({ entry: e, score: scoreEntry(e, tokens), tokenCount: tokens.length }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
    setResults(scored)
  }

  const top = results?.[0]
  const rest = results?.slice(1) ?? []

  return (
    <div className="flex-shrink-0 border-b border-rule2 bg-stone2">
      <div className="px-5 py-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-stone border border-rule2 px-3 py-2 focus-within:border-signal/50 transition-colors">
          <Search size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
            placeholder='Ask any questions – e.g. "Line 3 bagging line throwing a weight-check fault on startup"'
            aria-label="Ask the vault"
            className="flex-1 font-body text-body text-ink bg-transparent outline-none placeholder:text-muted"
          />
          <Btn variant="secondary" onClick={runSearch} disabled={!query.trim()}>Ask</Btn>
        </div>
        <Btn variant="secondary" icon={Plus} onClick={onAdd} className="flex-shrink-0">Add</Btn>
      </div>

      {results !== null && (
        <div className="px-5 pb-4">
          {results.length === 0 ? (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-stone border border-rule2">
              <div>
                <div className="font-body font-medium text-ink text-body">No captured knowledge matches this yet</div>
                <div className="font-body text-muted text-label mt-0.5">This is a gap in what's been captured — log it so the next person who hits it gets an answer.</div>
              </div>
              <Btn variant="secondary" icon={Plus} onClick={() => onLogCapture(query)} className="flex-shrink-0">
                Log as capture
              </Btn>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Synthesized answer from the closest match */}
              {(() => {
                const ms = matchStrength(top.score, top.tokenCount)
                const firstSentences = top.entry.body?.split(/(?<=[.!?])\s/).slice(0, 2).join(' ')
                return (
                  <div className="border border-rule2 border-l-2 border-l-signal bg-stone">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-stone3">
                      <Brain size={11} strokeWidth={2} className="text-signal flex-shrink-0" />
                      <span className="font-body text-muted text-label">Closest match</span>
                      <StatusPill tone={ms.tone}>{ms.label}</StatusPill>
                    </div>
                    <div className="px-4 py-3">
                      <div className="font-body font-medium text-ink text-body mb-1.5">{top.entry.title}</div>
                      <p className="font-body text-muted text-body leading-relaxed mb-2.5">{firstSentences}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-body text-muted text-label">
                          Cited from {top.entry.author?.name ?? 'Unknown'}
                          {top.entry.evidenceBase?.successRate ? ` · ${top.entry.evidenceBase.successRate} success across ${top.entry.evidenceBase.batchCount} applications` : ''}
                        </span>
                        <button type="button" onClick={() => onOpenEntry(top.entry)}
                          className="flex items-center gap-1 font-body text-label text-signal hover:text-ink transition-colors flex-shrink-0">
                          View full entry <ArrowRight size={11} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
              {/* Other matches */}
              {rest.length > 0 && (
                <div className="border border-rule2 divide-y divide-rule2">
                  {rest.map(r => (
                    <button key={r.entry.id} type="button" onClick={() => onOpenEntry(r.entry)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-stone2 transition-colors">
                      <span className="font-body text-ink text-label">{r.entry.title}</span>
                      <span className="font-body text-muted text-label flex-shrink-0">{r.entry.author?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Capture session — multimodal intake for knowledge that would otherwise leave ──
// with a retiring operator: a video/audio narration tagged to equipment + fault +
// memory type, indexed into the same domain/recall-mode taxonomy as everything else.

const CAPTURE_TYPES = [
  { value: 'video', label: 'Video',  icon: Video },
  { value: 'audio', label: 'Audio',  icon: Mic   },
  { value: 'text',  label: 'Text',   icon: FileText },
]

function CaptureSessionForm({ initialFault = '', onSave, onCancel }) {
  const [equipment, setEquipment] = useState('')
  const [fault, setFault] = useState(initialFault)
  const [domainId, setDomainId] = useState(DOMAINS[0].id)
  const [memoryType, setMemoryType] = useState(MEMORY_TYPES[0].id)
  const [captureType, setCaptureType] = useState('video')
  const [notes, setNotes] = useState('')
  const [capturedFrom, setCapturedFrom] = useState('')

  const canSave = fault.trim() && notes.trim()
  const fieldCls = 'w-full font-body text-body text-ink bg-stone2 border border-rule2 px-3 py-2 placeholder:text-muted/60 focus:border-signal focus:outline-none'

  const handleSave = () => {
    const today = new Date().toISOString().slice(0, 10)
    onSave({
      id: `kv-cap-${Date.now()}`,
      title: fault.trim(),
      type: 'operator-capture',
      author: { name: capturedFrom.trim() || 'Floor operator', title: 'Capture session' },
      createdAt: today,
      updatedAt: today,
      version: 1,
      confidence: null,
      activeBatches: [],
      body: notes.trim(),
      codedRule: null,
      evidenceBase: null,
      processMemoryIds: [],
      tags: [equipment.trim(), captureType + '-capture'].filter(Boolean),
      institutionalRisk: 'LOW — newly captured, pending validation',
      _domain: domainId,
      _memoryType: memoryType,
      _recallMode: 'event',
      _captured: true,
    })
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-muted text-body leading-relaxed">
        Tag a narrated walkthrough — what a retiring operator sees, hears, or knows to check — so it's searchable
        the next time someone hits the same fault. The transcript stands in for the recording.
      </p>
      <div>
        <label className="font-body text-muted text-label block mb-1">Capture type</label>
        <SegmentedControl options={CAPTURE_TYPES} value={captureType} onChange={setCaptureType} />
      </div>
      <div>
        <label className="font-body text-muted text-label block mb-1">Equipment / line</label>
        <input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="e.g. Line 3 bagging line" className={fieldCls} />
      </div>
      <div>
        <label className="font-body text-muted text-label block mb-1">Fault / symptom <span className="text-danger">*</span></label>
        <input value={fault} onChange={e => setFault(e.target.value)} placeholder="e.g. Weight-check fault on startup" className={fieldCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-body text-muted text-label block mb-1">Domain</label>
          <select value={domainId} onChange={e => setDomainId(e.target.value)} className={fieldCls}>
            {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-muted text-label block mb-1">Memory type</label>
          <select value={memoryType} onChange={e => setMemoryType(e.target.value)} className={fieldCls}>
            {MEMORY_TYPES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="font-body text-muted text-label block mb-1">Transcript / notes <span className="text-danger">*</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          placeholder="What do you check first? What does it sound or look like when it's about to fail? What did you do about it?"
          className={`${fieldCls} resize-none`} />
      </div>
      <div>
        <label className="font-body text-muted text-label block mb-1">Captured from</label>
        <input value={capturedFrom} onChange={e => setCapturedFrom(e.target.value)} placeholder="e.g. M. Santos" className={fieldCls} />
      </div>
      <div className="flex gap-2">
        <Btn variant="primary" disabled={!canSave} onClick={handleSave}>Save to vault</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ── Knowledge Vault — Variant C: Active-first ────────────────────────────────
// Active entries surface in a persistent band across all domains.
// Domain sidebar navigates the full library below.
// Entry cards use 3px accent bars; confidence as a small number, not a hero.

function OperationalMemoryVault() {
  const [activeDomain, setActiveDomain] = useState('all')
  const [showMemory, setShowMemory]     = useState(false)
  const [slideEntry, setSlideEntry]     = useState(null)
  const [promotedEntries, setPromotedEntries] = useState(new Set())
  const [capturedEntries, setCapturedEntries] = useState([])
  const [capturing, setCapturing]       = useState(null) // null | { initialFault }

  const allEntries = [...ENRICHED, ...capturedEntries]
  const domain = DOMAINS.find(d => d.id === activeDomain)

  const activeEntries = allEntries.filter(e => e.activeBatches?.length > 0)
  const libraryEntries = activeDomain === 'all'
    ? allEntries
    : allEntries.filter(e => e._domain === activeDomain)

  const domainCounts = DOMAINS.map(d => ({
    id: d.id,
    count: allEntries.filter(e => e._domain === d.id).length,
    activeCount: allEntries.filter(e => e._domain === d.id && e.activeBatches?.length > 0).length,
  }))

  const handleSaveCapture = (entry) => {
    setCapturedEntries(p => [entry, ...p])
    setCapturing(null)
    setSlideEntry(entry)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Ask the vault — retrieval over the existing index, source cited ───── */}
      <VaultQuery
        entries={allEntries}
        onOpenEntry={(entry) => setSlideEntry(entry)}
        onLogCapture={(query) => setCapturing({ initialFault: query })}
        onAdd={() => setCapturing({ initialFault: '' })}
      />

      {/* ── Horizontal domain chips ───────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-rule2 bg-stone overflow-x-auto">

        {/* All */}
        <button type="button"
          onClick={() => { setActiveDomain('all'); setShowMemory(false) }}
          className={`flex-shrink-0 flex items-center gap-1.5 font-body text-label px-3 py-1.5 border transition-colors ${
            activeDomain === 'all' && !showMemory
              ? 'border-signal bg-signal/10 text-signal'
              : 'border-rule2 text-muted hover:text-ink hover:border-rule'
          }`}>
          All · {allEntries.length}
        </button>

        {DOMAINS.map(d => {
          const dc = domainCounts.find(x => x.id === d.id)
          const Icon = d.icon
          const isActive = activeDomain === d.id && !showMemory
          return (
            <button key={d.id} type="button"
              onClick={() => { setActiveDomain(d.id); setShowMemory(false) }}
              className={`flex-shrink-0 flex items-center gap-1.5 font-body text-label px-3 py-1.5 border transition-colors ${
                isActive ? `${d.badge} border-transparent` : 'border-rule2 text-muted hover:text-ink hover:border-rule'
              }`}>
              <Icon size={10} strokeWidth={2} />
              {d.label}
              {dc?.activeCount > 0 && (
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
              )}
              <span className="opacity-60">· {dc?.count ?? 0}</span>
            </button>
          )
        })}

        {/* Process Memory chip */}
        <button type="button" onClick={() => setShowMemory(true)}
          className={`flex-shrink-0 flex items-center gap-1.5 font-body text-label px-3 py-1.5 border transition-colors ml-auto ${
            showMemory
              ? 'border-signal bg-signal/10 text-signal'
              : 'border-rule2 text-muted hover:text-ink hover:border-rule'
          }`}>
          <Database size={10} strokeWidth={2} />
          Process Memory
          <span className="opacity-60">· {processMemory.length}</span>
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showMemory ? (
          <>
            <div className="flex-shrink-0 px-5 py-2 border-b border-rule2 bg-stone2">
              <span className="font-body text-muted text-label">Process Memory · {processMemory.length} reference batches</span>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="w-[280px] flex-shrink-0 border-r border-rule2 overflow-y-auto">
                {processMemory.map(m => {
                  const ocColor = { exceptional: 'text-ok', excellent: 'text-ok', underperformed: 'text-danger' }[m.outcome] ?? 'text-muted'
                  const border = m.outcome === 'underperformed' ? 'border-l-danger' : m.grade === 'Premium' ? 'border-l-signal' : 'border-l-muted'
                  return (
                    <button key={m.id} type="button" onClick={() => setSlideEntry({ _pm: true, ...m })}
                      className={`w-full text-left px-4 py-4 border-b border-rule2 border-l-4 ${border} hover:bg-stone2/50 transition-colors`}>
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
            {/* ── Active now band — always visible when entries exist ── */}
            {activeEntries.length > 0 && (
              <div className="flex-shrink-0 border-b-2 border-b-danger/20 bg-danger/[0.025]">
                <div className="flex items-center gap-2 px-5 py-2 border-b border-danger/10">
                  <span className="live-dot w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                  <span className="font-body text-label font-semibold text-danger">Active now · {activeEntries.length}</span>
                  <span className="font-body text-label text-muted">Knowledge linked to live batches</span>
                </div>
                <div className="flex divide-x divide-danger/10 overflow-x-auto">
                  {activeEntries.map(e => {
                    const dom = DOMAINS.find(d => d.id === e._domain)
                    return (
                      <button key={e.id} type="button" onClick={() => setSlideEntry(e)}
                        className="flex-shrink-0 px-5 py-3 text-left hover:bg-danger/[0.04] transition-colors"
                        style={{ maxWidth: 300 }}>
                        {dom && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <dom.icon size={9} strokeWidth={2} className={dom.color} />
                            <span className={`font-body text-label ${dom.badge} px-1 py-0.5`}>{dom.label}</span>
                          </div>
                        )}
                        <div className="font-body font-medium text-ink text-label leading-snug truncate">{e.title}</div>
                        <div className="font-body text-label text-muted mt-0.5">
                          {e.activeBatches?.join(', ')} · {e.author.name}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Domain header — compact ─────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-rule2 bg-stone2">
              {domain ? (
                <>
                  <domain.icon size={12} strokeWidth={2} className={domain.color} />
                  <span className="font-body text-label text-muted">{domain.label}</span>
                </>
              ) : (
                <span className="font-body text-label text-muted">All domains</span>
              )}
              <span className="font-body text-label text-muted">·</span>
              <span className="font-body text-label text-muted">{libraryEntries.length} entries</span>
            </div>

            {/* ── Entry list ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {libraryEntries.length === 0 ? (
                <EmptyState message="No entries in this domain" />
              ) : (
                <div className="px-4 py-3 space-y-2">
                  {libraryEntries.map(e => {
                    const riskKey   = e.institutionalRisk?.split(' ')[0]
                    const succColor = e.evidenceBase?.successRate
                      ? parseInt(e.evidenceBase.successRate) >= 90 ? 'text-ok'
                      : parseInt(e.evidenceBase.successRate) >= 75 ? 'text-signal' : 'text-warn'
                      : 'text-muted'
                    const topBar  = riskKey === 'HIGH' ? 'bg-danger' : riskKey === 'MEDIUM' ? 'bg-warn' : 'bg-ok/40'
                    const recallC = RECALL_COLOR[e._recallMode] ?? RECALL_COLOR.condition
                    const dom     = DOMAINS.find(d => d.id === e._domain)
                    const isActive = e.activeBatches?.length > 0
                    // First sentence of the expert observation
                    const firstSentence = e.body
                      ? e.body.split(/(?<=[.!?])\s/)[0]
                      : null
                    return (
                      <article key={e.id}
                        className={`border border-rule2 overflow-hidden ${isActive ? 'bg-danger/[0.02]' : ''}`}>
                        <div className={`h-[3px] w-full ${topBar}`} />
                        <button type="button" onClick={() => setSlideEntry(e)}
                          className="w-full text-left px-4 py-3.5 hover:bg-stone2/60 transition-colors">

                          {/* Active indicator + domain badge */}
                          {(isActive || (activeDomain === 'all' && dom)) && (
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              {isActive && (
                                <span className="inline-flex items-center gap-1 font-body text-danger text-label font-medium">
                                  <span className="live-dot w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />Active · {e.activeBatches.join(', ')}
                                </span>
                              )}
                              {activeDomain === 'all' && dom && !isActive && (
                                <span className={`font-body text-label px-1.5 py-0.5 ${dom.badge}`}>{dom.label}</span>
                              )}
                              {activeDomain === 'all' && dom && isActive && (
                                <span className={`font-body text-label px-1.5 py-0.5 ${dom.badge} ml-auto`}>{dom.label}</span>
                              )}
                            </div>
                          )}

                          {/* Title — leads */}
                          <div className="font-body font-medium text-ink text-body leading-snug mb-1.5">{e.title}</div>

                          {/* First sentence of observation */}
                          {firstSentence && (
                            <div className="font-body text-muted text-label leading-snug mb-3">{firstSentence}</div>
                          )}

                          {/* Footer: author · applications · success · recall mode */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body text-muted text-label">{e.author.name}</span>
                            {e.evidenceBase?.batchCount != null && (
                              <>
                                <span className="font-body text-muted/40 text-label">·</span>
                                <span className="font-body text-muted text-label">{e.evidenceBase.batchCount} applications</span>
                              </>
                            )}
                            {e.evidenceBase?.successRate && (
                              <>
                                <span className="font-body text-muted/40 text-label">·</span>
                                <span className={`font-body text-label font-medium ${succColor}`}>{e.evidenceBase.successRate} success</span>
                              </>
                            )}
                            {promotedEntries.has(e.id) && (
                              <>
                                <span className="font-body text-muted/40 text-label">·</span>
                                <span className="inline-flex items-center gap-1 font-body text-ok text-label">
                                  <Share2 size={8} strokeWidth={2} />network
                                </span>
                              </>
                            )}
                            <span className={`ml-auto inline-flex items-center gap-1 font-body text-label px-1.5 py-0.5 ${recallC.chip}`}>
                              <span className={`w-1 h-1 rounded-full ${recallC.dot}`} />
                              {e._recallMode}
                            </span>
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
      {capturing && (
        <SlidePanel title="Capture session" subtitle="Multimodal intake" icon={Video}
          onClose={() => setCapturing(null)} maxWidth="480px">
          <CaptureSessionForm
            initialFault={capturing.initialFault}
            onSave={handleSaveCapture}
            onCancel={() => setCapturing(null)}
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
