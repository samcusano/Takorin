// Shift 3: Expanded quality ontology
// Quality is not compliance. Sensory signals, expert craft, and probabilistic
// interpretation are first-class primitives.

import { useState } from 'react'
import { sensoryReadings, expertAnnotations, craftPriors, seasonalBaselines } from '../data/quality'
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TABS = [
  { id: 'sensory',     label: 'Sensory Signals' },
  { id: 'annotations', label: 'Expert Annotations' },
  { id: 'priors',      label: 'Craft Priors' },
  { id: 'baselines',   label: 'Seasonal Baselines' },
]

function CompoundRow({ c }) {
  const toneColor = c.tone === 'ok' ? 'text-ok' : c.tone === 'warn' ? 'text-warn' : 'text-danger'
  const ArrowIcon = c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus
  const arrowColor = c.direction === 'up' ? 'text-ok' : c.direction === 'down' ? 'text-warn' : 'text-muted'
  return (
    <div className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="font-body font-medium text-ink text-body">{c.name}</div>
        {c.note && <div className="font-body text-muted text-label mt-0.5 leading-snug">{c.note}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-body text-muted text-label">{c.baseline}</span>
        <span className="font-body text-muted text-label">baseline</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 w-24 justify-end">
        <ArrowIcon size={10} className={arrowColor} strokeWidth={2} />
        <span className={`font-body font-medium text-body tabular-nums ${toneColor}`}>
          {c.val} {c.unit}
        </span>
      </div>
    </div>
  )
}

function SensoryTab() {
  const [selectedId, setSelectedId] = useState(sensoryReadings[0].id)
  const reading = sensoryReadings.find(r => r.id === selectedId) ?? sensoryReadings[0]
  const scoreColor = reading.overallScore >= 90 ? 'text-ok' : reading.overallScore >= 80 ? 'text-ochre' : 'text-warn'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Reading list */}
      <div className="w-[260px] flex-shrink-0 border-r border-rule2 overflow-y-auto">
        {sensoryReadings.map(r => (
          <button key={r.id} type="button" onClick={() => setSelectedId(r.id)}
            className={`w-full text-left px-4 py-3.5 border-b border-rule2 transition-colors border-l-4 ${
              selectedId === r.id ? 'bg-stone2 border-l-ochre' : 'border-l-transparent hover:bg-stone2/50'
            }`}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="font-body font-medium text-ink text-label truncate">{r.batch}</span>
              <span className={`font-display font-bold text-head tabular-nums ${r.overallScore >= 90 ? 'text-ok' : r.overallScore >= 80 ? 'text-ochre' : 'text-warn'}`}>{r.overallScore}</span>
            </div>
            <div className="font-body text-muted text-label">{r.source}</div>
            <div className="font-body text-muted text-label mt-0.5">
              {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </button>
        ))}
      </div>

      {/* Reading detail */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 border-b border-rule2">
          <div className="font-body text-muted text-label mb-1">{reading.source} · {reading.batch}</div>
          <div className="flex items-baseline gap-4 mb-2">
            <span className={`display-num text-display leading-none tabular-nums ${scoreColor}`}>{reading.overallScore}</span>
            <div>
              <div className="font-body text-muted text-body">Overall aroma score</div>
              <div className="font-body text-muted text-label">Projected: {reading.gradeProjection} · {reading.confidence}% confidence</div>
            </div>
          </div>
        </div>

        <div className="border-b border-rule2">
          <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
            <span className="font-body font-bold text-ink text-label">Compound analysis</span>
          </div>
          <div className="divide-y divide-rule2">
            {reading.compounds.map((c, i) => <CompoundRow key={i} c={c} />)}
          </div>
        </div>

        {reading.expertAnnotation && (
          <div className="px-6 py-4 border-b border-rule2 bg-ochre/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ochre" />
              <span className="font-body text-muted text-label">Master blender annotation</span>
              <span className="font-body text-muted text-label">{reading.expertAnnotation.author}</span>
            </div>
            <p className="font-body text-ink text-body leading-relaxed">{reading.expertAnnotation.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AnnotationsTab() {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-rule2">
      {expertAnnotations.map(a => {
        const typeLabel = { 'quality-watch': 'Quality watch', 'grade-confirmation': 'Grade confirmation', 'process-note': 'Process note', 'outcome-validation': 'Outcome validation' }[a.type] ?? a.type
        const typeTone = { 'quality-watch': 'text-warn bg-warn/10 ', 'grade-confirmation': 'text-ok bg-ok/10 ', 'process-note': 'text-muted bg-stone3 border-rule2', 'outcome-validation': 'text-ochre bg-ochre/10 border-ochre/30' }[a.type] ?? 'text-muted bg-stone3 border-rule2'
        return (
          <div key={a.id} className="px-6 py-4 hover:bg-stone2 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-stone3 flex items-center justify-center flex-shrink-0">
                  <span className="font-body text-muted text-label font-medium">{a.author.split(' ').map(p => p[0]).join('')}</span>
                </div>
                <div>
                  <div className="font-body font-medium text-ink text-body">{a.author}</div>
                  <div className="font-body text-muted text-label">{a.authorTitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-body text-label px-1.5 py-0.5 ${typeTone}`}>{typeLabel}</span>
                <span className="font-body text-muted text-label">
                  {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="font-body text-muted text-label mb-1.5">Batch: {a.batch}</div>
            <p className="font-body text-ink text-body leading-relaxed mb-2">{a.observation}</p>
            {a.modelResponse && (
              <div className="flex items-start gap-2 px-3 py-2 bg-stone2">
                <div className="font-body text-muted text-label flex-shrink-0 mt-0.5">Model</div>
                <div className="font-body text-muted text-label leading-snug">{a.modelResponse}</div>
                {a.confidenceImpact && (
                  <span className="font-body text-ok text-label flex-shrink-0 font-medium">{a.confidenceImpact}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PriorsTab() {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-rule2">
      {craftPriors.map(p => (
        <div key={p.id} className={`px-6 py-4 border-l-4 ${p.tone === 'warn' ? 'border-l-warn bg-warn/[0.01]' : 'border-l-ok'} hover:bg-stone2 transition-colors`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="font-body text-muted text-label mb-0.5">{p.domain}</div>
              <div className="font-body font-medium text-ink text-body leading-snug">{p.rule}</div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 gap-1">
              <span className={`display-num text-subhead leading-none ${p.confidence >= 90 ? 'text-ok' : p.confidence >= 80 ? 'text-ochre' : 'text-warn'}`}>{p.confidence}%</span>
              <span className="font-body text-muted text-label">confidence</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-body text-muted text-label">{p.author}</span>
            <span className="font-body text-muted">·</span>
            <span className="font-body text-muted text-label">{p.evidenceBatches} batches</span>
            <span className="font-body text-muted">·</span>
            <span className="font-body text-muted text-label">{p.evidenceYears}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`font-body text-label px-1.5 py-0.5 ${p.tone === 'warn' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'}`}>
              {p.modelStatus.split('—')[0].trim()}
            </div>
            {p.activeBatches.length > 0 && (
              <span className="font-body text-muted text-label">{p.activeBatches.join(', ')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function BaselinesTab() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 divide-x divide-y divide-rule2 border-b border-rule2">
        {seasonalBaselines.map((s, i) => (
          <div key={i} className={`px-6 py-5 ${s.tone === 'warn' ? 'bg-warn/[0.02]' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="font-body font-bold text-ink text-body">{s.season}</div>
                <div className="font-body text-muted text-label mt-0.5">{s.ambientTempRange} ambient</div>
              </div>
              {s.tone === 'warn'
                ? <AlertTriangle size={13} className="text-warn flex-shrink-0" strokeWidth={2} />
                : <CheckCircle size={13} className="text-ok flex-shrink-0" strokeWidth={2} />
              }
            </div>
            <div className="space-y-2">
              {[
                { label: 'Fermentation target', val: s.fermentationTempTarget },
                { label: 'Expected amino N',    val: s.expectedAmino },
                { label: 'Expected aroma',      val: s.expectedAroma },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="font-body text-muted text-label">{label}</div>
                  <div className="font-body text-ink text-label leading-snug mt-0.5">{val}</div>
                </div>
              ))}
              <div className="pt-2 border-t border-rule2">
                <p className="font-display text-muted text-body leading-relaxed">{s.notes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function QualityIntelligence() {
  const [activeTab, setActiveTab] = useState('sensory')

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-rule2 bg-stone">
        <div>
          <div className="font-body text-muted text-label mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-title leading-none">Quality Intelligence</div>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="display-num text-metric text-ochre leading-none">{craftPriors.length}</div>
            <div className="font-body text-muted text-label">craft priors</div>
          </div>
          <div>
            <div className="display-num text-metric text-ok leading-none">{expertAnnotations.length}</div>
            <div className="font-body text-muted text-label">annotations</div>
          </div>
          <div>
            <div className="display-num text-metric text-muted leading-none">{sensoryReadings.length}</div>
            <div className="font-body text-muted text-label">readings</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-rule2 bg-stone">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`font-body text-label px-5 py-2.5 border-b-2 transition-colors ${
              activeTab === t.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-muted hover:text-muted'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'sensory'     && <SensoryTab />}
        {activeTab === 'annotations' && <AnnotationsTab />}
        {activeTab === 'priors'      && <PriorsTab />}
        {activeTab === 'baselines'   && <BaselinesTab />}
      </div>
    </div>
  )
}
