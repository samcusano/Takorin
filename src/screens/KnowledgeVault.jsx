// Shift 6: Knowledge capture as core primitive
// Industrial cognition infrastructure: tacit expertise, process memory,
// institutional knowledge, version-controlled craft intelligence.

import { useState } from 'react'
import { knowledgeCategories, knowledgeEntries, processMemory } from '../data/knowledge'
import { AlertTriangle, CheckCircle, BookOpen, Clock, Database } from 'lucide-react'

const RISK_CFG = {
  'HIGH':   { label: 'High risk',   cls: 'text-danger bg-danger/10 border border-danger/30' },
  'MEDIUM': { label: 'Medium risk', cls: 'text-warn bg-warn/10 border border-warn/30' },
  'LOW':    { label: 'Low risk',    cls: 'text-ok bg-ok/10 border border-ok/30' },
}

const TYPE_LABELS = {
  'craft-threshold':   'Craft threshold',
  'grade-rule':        'Grade rule',
  'process-constraint': 'Process constraint',
  'evaluation-method': 'Evaluation method',
  'raw-material-variance': 'Raw material variance',
}

function EntryCard({ entry, selected, onClick }) {
  const risk = RISK_CFG[entry.institutionalRisk?.split(' ')[0]] ?? RISK_CFG['LOW']
  const typeLabel = TYPE_LABELS[entry.type] ?? entry.type
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors border-l-4 ${
        selected ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-body font-medium text-ink text-[12px] leading-snug text-left">{entry.title}</span>
        <span className={`font-body text-[8px] uppercase tracking-widest px-1 py-0.5 flex-shrink-0 ${risk.cls}`}>{risk.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-body text-ghost text-[9px]">{typeLabel}</span>
        <span className="font-body text-ghost text-[9px]">·</span>
        <span className="font-body text-ghost text-[9px]">{entry.author.name}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className={`font-display font-bold display-num text-[14px] ${entry.confidence >= 90 ? 'text-ok' : entry.confidence >= 80 ? 'text-ochre' : 'text-warn'}`}>{entry.confidence}%</span>
        {entry.activeBatches.length > 0 && (
          <span className="font-body text-ochre text-[9px]">· Active on {entry.activeBatches.length} batch{entry.activeBatches.length > 1 ? 'es' : ''}</span>
        )}
      </div>
    </button>
  )
}

function ProcessMemoryPanel() {
  const [selectedId, setSelectedId] = useState(processMemory[0].id)
  const mem = processMemory.find(m => m.id === selectedId)
  const gradeColor = mem?.grade === 'Premium' ? 'text-ochre' : 'text-muted'
  const outcomeColor = { exceptional: 'text-ok', excellent: 'text-ok', underperformed: 'text-danger' }[mem?.outcome] ?? 'text-muted'

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 overflow-y-auto">
        {processMemory.map(m => (
          <button key={m.id} type="button" onClick={() => setSelectedId(m.id)}
            className={`w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors border-l-4 ${
              selectedId === m.id ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
            }`}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-body font-medium text-ink text-[12px]">{m.batchId}</span>
              <span className={`font-display font-bold text-[16px] ${m.grade === 'Premium' ? 'text-ochre' : 'text-muted'}`}>{m.grade}</span>
            </div>
            <div className="font-body text-ghost text-[10px]">{m.sku}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-body text-ghost text-[9px]">Aroma {m.finalAromaScore}</span>
              <span className="font-body text-ghost text-[9px]">·</span>
              <span className={`font-body text-[9px] capitalize ${outcomeColor}`}>{m.outcome}</span>
            </div>
          </button>
        ))}
      </div>

      {mem && (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">{mem.sku} · {mem.daysElapsed} days</div>
            <div className="flex items-baseline gap-4 mb-2">
              <span className={`font-display font-bold text-[28px] leading-none ${gradeColor}`}>{mem.grade}</span>
              <div>
                <div className="font-body text-muted text-[12px]">Final grade</div>
                <div className={`font-body text-[10px] capitalize ${outcomeColor}`}>{mem.outcome} outcome</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
            {[
              { label: 'Aroma score',     val: String(mem.finalAromaScore) },
              { label: 'Final EBC',       val: String(mem.finalEBC) },
              { label: 'Amino nitrogen',  val: mem.finalAminoNitrogen },
            ].map(({ label, val }) => (
              <div key={label} className="bg-stone px-3 py-2.5">
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
                <div className="font-body font-medium text-ink text-[13px]">{val}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Key signal events</div>
            <div className="divide-y divide-rule2 border border-rule2">
              {mem.keySignals.map((s, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="font-body text-ghost text-[9px] w-10 flex-shrink-0 pt-0.5">Day {s.day}</span>
                  <div className="flex-1">
                    <div className="font-body font-medium text-ink text-[11px]">{s.signal}</div>
                    <div className="font-body text-muted text-[10px] mt-0.5">→ {s.outcome}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mem.masterBlenderNote && (
            <div className="px-4 py-3 bg-ochre/[0.04] border border-ochre/20 border-l-4 border-l-ochre">
              <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">Master blender note</div>
              <p className="font-body text-ink text-[12px] leading-relaxed">{mem.masterBlenderNote}</p>
            </div>
          )}

          <div>
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1.5">Similarity to active batches</div>
            {Object.entries(mem.similarity).map(([batch, pct]) => (
              <div key={batch} className="flex items-center gap-3 mb-1.5">
                <span className="font-body text-muted text-[11px] w-28">{batch}</span>
                <div className="flex-1 h-0.5 bg-rule2">
                  <div className={`h-full ${pct >= 90 ? 'bg-ok' : pct >= 80 ? 'bg-ochre' : 'bg-warn'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`font-body font-medium text-[11px] tabular-nums w-8 text-right ${pct >= 90 ? 'text-ok' : pct >= 80 ? 'text-ochre' : 'text-warn'}`}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function KnowledgeVault() {
  const [selectedCategory, setSelectedCategory] = useState(knowledgeCategories[0].id)
  const [selectedEntryId, setSelectedEntryId] = useState(knowledgeEntries[0].id)
  const [showMemory, setShowMemory] = useState(false)

  const filteredEntries = knowledgeEntries.filter(e => e.category === selectedCategory)
  const entry = knowledgeEntries.find(e => e.id === selectedEntryId)
  const risk = entry ? (RISK_CFG[entry.institutionalRisk?.split(' ')[0]] ?? RISK_CFG['LOW']) : null

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* ── Left: categories ──────────────────────────────── */}
      <div className="w-[200px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-[16px] leading-none">Knowledge Vault</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {knowledgeCategories.map(cat => (
            <button key={cat.id} type="button"
              onClick={() => { setSelectedCategory(cat.id); setShowMemory(false); setSelectedEntryId(null) }}
              className={`w-full text-left px-4 py-3 transition-colors border-l-4 ${
                selectedCategory === cat.id && !showMemory ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
              }`}>
              <div className="font-body font-medium text-ink text-[11px]">{cat.label}</div>
              <div className="font-body text-ghost text-[9px] mt-0.5">{cat.count} entries</div>
            </button>
          ))}
        </div>

        {/* Process Memory button */}
        <button type="button"
          onClick={() => { setShowMemory(true); setSelectedCategory(null) }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-rule2 transition-colors border-l-4 ${
            showMemory ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
          }`}>
          <Database size={11} className={showMemory ? 'text-ochre' : 'text-ghost'} strokeWidth={2} />
          <div className="text-left">
            <div className={`font-body font-medium text-[11px] ${showMemory ? 'text-ink' : 'text-muted'}`}>Process Memory</div>
            <div className="font-body text-ghost text-[9px]">{processMemory.length} reference batches</div>
          </div>
        </button>
      </div>

      {/* ── Center: entry list ─────────────────────────── */}
      {!showMemory && (
        <div className="w-[300px] flex-shrink-0 border-r border-rule2 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">
              {knowledgeCategories.find(c => c.id === selectedCategory)?.label} · {filteredEntries.length} entries
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-rule2">
            {filteredEntries.map(e => (
              <EntryCard key={e.id} entry={e}
                selected={selectedEntryId === e.id}
                onClick={() => setSelectedEntryId(e.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Right: entry detail or process memory ────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        {showMemory ? (
          <>
            <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
              <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Process Memory · {processMemory.length} reference batches</span>
            </div>
            <ProcessMemoryPanel />
          </>
        ) : entry ? (
          <>
            {/* Entry header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-rule2">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{TYPE_LABELS[entry.type]}</span>
                    {entry.institutionalRisk && risk && (
                      <span className={`font-body text-[8px] uppercase tracking-widest px-1.5 py-0.5 border ${risk.cls}`}>{risk.label}</span>
                    )}
                  </div>
                  <div className="font-display font-bold text-ink text-[18px] leading-snug">{entry.title}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-display font-bold display-num text-[32px] leading-none ${entry.confidence >= 90 ? 'text-ok' : entry.confidence >= 80 ? 'text-ochre' : 'text-warn'}`}>{entry.confidence}%</div>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest">confidence</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-stone3 border border-rule2 flex items-center justify-center">
                    <span className="font-body text-ghost text-[8px]">{entry.author.name.split(' ').map(p => p[0]).join('')}</span>
                  </div>
                  <span className="font-body text-muted text-[11px]">{entry.author.name} · {entry.author.title}</span>
                </div>
                <span className="font-body text-ghost">·</span>
                <span className="font-body text-ghost text-[10px]">v{entry.version} · Updated {entry.updatedAt}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Observation */}
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Expert observation</div>
                <p className="font-body text-ink text-[13px] leading-relaxed">{entry.body}</p>
              </div>

              {/* Coded rule */}
              <div>
                <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Encoded rule</div>
                <pre className="font-body text-muted text-[10px] leading-relaxed bg-stone2 border border-rule2 px-4 py-3 whitespace-pre-wrap">{entry.codedRule}</pre>
              </div>

              {/* Evidence base */}
              <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
                {[
                  { label: 'Evidence batches', val: entry.evidenceBase.batchCount != null ? String(entry.evidenceBase.batchCount) : 'Protocol-based' },
                  { label: 'Year range', val: entry.evidenceBase.yearRange },
                  { label: 'Success rate', val: entry.evidenceBase.successRate ?? 'N/A' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-stone px-3 py-2.5">
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="font-body font-medium text-ink text-[12px]">{val}</div>
                  </div>
                ))}
              </div>

              {/* Active impact */}
              {entry.activeBatches.length > 0 && (
                <div>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Active impact</div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.activeBatches.map(b => (
                      <span key={b} className="font-body text-ochre text-[10px] px-2 py-0.5 border border-ochre/40 bg-ochre/[0.06]">{b}</span>
                    ))}
                  </div>
                  {entry.activePriorId && (
                    <div className="font-body text-muted text-[10px] mt-1.5">Prior {entry.activePriorId} active — model is monitoring</div>
                  )}
                </div>
              )}

              {/* Institutional risk */}
              {entry.institutionalRisk && (
                <div className={`px-4 py-3 border border-l-4 ${
                  entry.institutionalRisk.startsWith('HIGH') ? 'border-danger/30 border-l-danger bg-danger/[0.03]' :
                  entry.institutionalRisk.startsWith('MEDIUM') ? 'border-warn/30 border-l-warn bg-warn/[0.02]' :
                  'border-rule2 border-l-ok'
                }`}>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Institutional risk</div>
                  <p className="font-body text-muted text-[11px] leading-snug">{entry.institutionalRisk}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">Select an entry</div>
        )}
      </div>
    </div>
  )
}
