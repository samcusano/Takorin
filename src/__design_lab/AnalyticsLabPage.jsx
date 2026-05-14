import { useState } from 'react'
import AnalyticsVariantA from './AnalyticsVariantA'
import AnalyticsVariantC from './AnalyticsVariantC'
import AnalyticsVariantD from './AnalyticsVariantD'

const VARIANTS = [
  {
    id: 'A',
    name: 'Newsroom',
    why: 'One dominant insight leads. Data serves the story. Editorial hierarchy: headline → supporting chart → story cards. Inspired by Netflix Data Science. Optimised for the economic buyer skimming for the ROI sentence — and the plant director relaying it to her VP.',
    component: AnalyticsVariantA,
  },
  {
    id: 'C',
    name: 'Attribution Waterfall',
    why: 'Answers "how did we go from 75% forecast to 81% actual?" — a waterfall chart decomposes OEE by cause. Metric tree + period comparison table + inline sparklines. Inspired by Funnel.io B2B attribution dashboards. Optimised for the operations VP doing a structured review.',
    component: AnalyticsVariantC,
  },
  {
    id: 'D',
    name: 'The Flywheel',
    why: 'Makes the learning loop the hero, not OEE. Model accuracy over 28 shifts + projected to 300. The moat made legible: "a competitor replacing Takorin at shift 300 loses 660 labeled events and 14 months." Optimised for the renewal conversation — answering "is this getting smarter?"',
    component: AnalyticsVariantD,
  },
]

export default function AnalyticsLabPage() {
  const [active, setActive] = useState('A')
  const current = VARIANTS.find(v => v.id === active)
  const Component = current.component

  const activeIdx = VARIANTS.findIndex(v => v.id === active)
  const prev = VARIANTS[activeIdx - 1]
  const next = VARIANTS[activeIdx + 1]

  return (
    <div className="flex flex-col h-screen bg-stone overflow-hidden ml-[240px]">
      {/* Lab header */}
      <div className="flex items-stretch border-b border-rule2 bg-stone2 flex-shrink-0">
        {/* Variant tabs */}
        <div className="flex items-stretch border-r border-rule2">
          {VARIANTS.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors font-body text-[12px] ${
                active === v.id
                  ? 'border-b-ochre bg-stone text-ink font-medium'
                  : 'border-b-transparent text-ghost hover:text-muted hover:bg-stone3'
              }`}
            >
              <span className="font-display font-black text-[11px] opacity-50">{v.id}</span>
              {v.name}
            </button>
          ))}
        </div>

        {/* Context strip */}
        <div className="flex items-center gap-3 px-5 flex-1 min-w-0">
          <span className="font-body text-ghost text-[10px] uppercase tracking-widest flex-shrink-0">Rationale</span>
          <p className="font-body text-muted text-[11px] leading-snug truncate">{current.why}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 px-4 border-l border-rule2 flex-shrink-0">
          <button type="button"
            onClick={() => prev && setActive(prev.id)}
            disabled={!prev}
            className="font-body text-[11px] px-3 py-1.5 text-ghost hover:text-muted transition-colors disabled:opacity-30">
            ← Prev
          </button>
          <button type="button"
            onClick={() => next && setActive(next.id)}
            disabled={!next}
            className="font-body text-[11px] px-3 py-1.5 text-ghost hover:text-muted transition-colors disabled:opacity-30">
            Next →
          </button>
        </div>
      </div>

      {/* Rationale — expanded on second line */}
      <div className="flex-shrink-0 border-b border-rule2 bg-stone px-6 py-2.5">
        <p className="font-body text-ghost text-[11px] leading-relaxed">{current.why}</p>
      </div>

      {/* Variant content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Component />
      </div>
    </div>
  )
}
