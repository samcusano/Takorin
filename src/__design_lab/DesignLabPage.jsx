import { useState } from 'react'
import VariantA from './VariantA'
import VariantB from './VariantB'
import VariantC from './VariantC'
import VariantD from './VariantD'
import VariantE from './VariantE'
import FeedbackOverlay from './FeedbackOverlay'

const VARIANTS = [
  {
    id: 'A',
    name: 'Urgency-First Stream',
    why: 'No tabs. One continuous list grouped by Resolve / Monitor / Reference. The blocking action is always at the top — no navigation required.',
    component: VariantA,
  },
  {
    id: 'B',
    name: 'Score-Led Tabs',
    why: 'Keeps tabs but adds a third "FSMA" tab so traceability no longer buries the lots view. Supplier tab shows horizontal score bars for faster ranking scans. Lots tab reorders columns: COA status is the first column.',
    component: VariantB,
  },
  {
    id: 'C',
    name: 'Priority Action Cards',
    why: 'Cards over rows. The blocking item gets a full-width hero card with prominent CTA. Expiring lots render as a 2-column card grid. More visual breathing room per item.',
    component: VariantC,
  },
  {
    id: 'D',
    name: 'Expandable Master List',
    why: 'One combined supplier list, sorted by urgency. Expand any supplier to see their lots + audit details inline. ConAgra is pre-expanded since they\'re the blocker. Eliminates tab-switching entirely.',
    component: VariantD,
  },
  {
    id: 'E',
    name: 'Timeline Feed',
    why: 'Organizes content by when action is needed: Now → Today → This week → Before FDA. Alert counts sit in a strip at top. Mirrors how an operator actually prioritizes — time-first, not category-first.',
    component: VariantE,
  },
]

const STATS = [
  { l: 'COA verified',      v: '4/5' },
  { l: 'Delivery on track', v: '4/5' },
  { l: 'Expiring < 14d',    v: '2'   },
  { l: 'Price alerts',      v: '2'   },
  { l: 'Audit readiness',   v: '91%' },
  { l: 'FDA inspection',    v: '18d' },
]

export default function DesignLabPage() {
  const [active, setActive] = useState('A')
  const current = VARIANTS.find(v => v.id === active)
  const Component = current.component

  const activeIdx = VARIANTS.findIndex(v => v.id === active)
  const prev = VARIANTS[activeIdx - 1]
  const next = VARIANTS[activeIdx + 1]

  return (
    <div className="flex flex-col h-screen bg-stone2 font-body overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 bg-ink border-b border-sidebar-border px-6 py-3 flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-stone text-base">SupplierIQ — Design Lab</div>
          <div className="font-body text-ghost text-[10px] mt-0.5">Main content area · 5 variants</div>
        </div>
        <div className="font-body text-ghost text-[10px] border border-sidebar-border px-3 py-1.5">
          JTBD: Unblock production — arrive, act, done
        </div>
      </div>

      {/* Variant picker */}
      <div className="flex-shrink-0 bg-ink border-b border-sidebar-border px-6 flex items-stretch gap-0">
        {VARIANTS.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors text-left ${
              active === v.id
                ? 'border-b-ochre text-stone'
                : 'border-b-transparent text-ghost hover:text-stone/70'
            }`}
          >
            <span className={`font-display font-bold text-sm flex-shrink-0 ${active === v.id ? 'text-ochre' : 'text-ghost/50'}`}>{v.id}</span>
            <span className="font-body text-[11px] hidden sm:block whitespace-nowrap">{v.name}</span>
          </button>
        ))}
      </div>

      {/* Active variant info + preview — fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Rationale bar */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-2.5 bg-stone border-b border-rule2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-ink flex items-center justify-center font-display font-bold text-stone text-sm flex-shrink-0">{current.id}</div>
            <p className="font-body text-muted text-[11px] leading-snug">{current.why}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => prev && setActive(prev.id)}
              disabled={!prev}
              className="font-body text-[10px] px-3 py-1.5 border border-rule2 text-muted hover:text-ink hover:border-ghost disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => next && setActive(next.id)}
              disabled={!next}
              className="font-body text-[10px] px-3 py-1.5 border border-rule2 text-muted hover:text-ink hover:border-ghost disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Preview frame */}
        <div data-variant={active} className="flex-1 min-h-0 flex flex-col bg-stone border-t-0">
          {/* Simulated stats bar — out of scope, shown for context */}
          <div className="grid grid-cols-6 border-b border-rule2 bg-stone flex-shrink-0 opacity-40 pointer-events-none select-none">
            {STATS.map((s, i) => (
              <div key={i} className="px-3 py-2 border-r border-rule2 last:border-r-0">
                <div className="font-body text-muted text-[9px] mb-0.5">{s.l}</div>
                <div className="font-body font-medium text-ink text-[13px]">{s.v}</div>
              </div>
            ))}
          </div>
          {/* Variant content — scrollable */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Component />
          </div>
        </div>
      </div>

      <FeedbackOverlay targetName="SupplierIQ" />
    </div>
  )
}
