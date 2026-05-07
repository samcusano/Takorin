// Variant D: Expandable Master List
// One combined supplier list sorted by urgency composite score.
// Expand any supplier to see their lots + audit details inline.
// ConAgra is pre-expanded since they have the blocking action.
// Eliminates tab-switching; everything in one scrollable list.

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, AlertTriangle, Wheat, Soup, Milk, Beef, Droplets } from 'lucide-react'
import { supplierData, supplierAudits } from '../data'
import { Btn, Chip, Urg, ScoreRing } from '../components/UI'
import { useAppState } from '../context/AppState'

const FOOD_ICONS = {
  'Wheat flour': Wheat,
  'Tomato sauce': Soup,
  'Mozzarella': Milk,
  'Pepperoni': Beef,
  'Canola oil': Droplets,
}

function SupplierRow({ supplier, audit, lots, expanded, onToggle }) {
  const { coaRequested, setCoaRequested } = useAppState()
  const hasAction = audit?.needsAction
  const urgentLots = lots.filter(l => l.urgent)
  const expiringLots = lots.filter(l => !l.urgent && l.shelfTone !== 'ok')

  return (
    <div className={`border-b border-rule2 border-l-2 ${hasAction ? 'border-l-danger' : 'border-l-transparent'}`}>
      {/* Collapsed row */}
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone2/50 transition-colors text-left">
        <div className="flex-shrink-0">
          {expanded ? <ChevronDown size={14} strokeWidth={2} className="text-ghost" /> : <ChevronRight size={14} strokeWidth={2} className="text-ghost" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body font-medium text-ink text-[13px]">{supplier.name}</span>
            {hasAction && <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />}
            {urgentLots.length > 0 && <Chip tone="danger">COA missing</Chip>}
            {!urgentLots.length && expiringLots.length > 0 && <Chip tone="warn">{expiringLots.length} expiring</Chip>}
          </div>
          {audit?.reason && (
            <div className="font-body text-warn text-[10px] mt-0.5">{audit.reason}</div>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <ScoreRing pct={supplier.score} size={28} />
          <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
            supplier.tierTone === 'ok' ? 'bg-ok/10 text-ok'
            : supplier.tierTone === 'danger' ? 'bg-danger/10 text-danger'
            : 'bg-int/10 text-int'
          }`}>{supplier.tier}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-stone2 border-t border-rule2">
          {/* Lots for this supplier */}
          {lots.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <div className="font-body text-ghost text-[10px] uppercase tracking-wider mb-2">Ingredient lots</div>
              {lots.map((lot, i) => {
                const Icon = FOOD_ICONS[lot.ing]
                return (
                  <div key={i} className={`flex items-center gap-3 py-2.5 border-b border-rule2 last:border-b-0 ${lot.urgent ? 'border-l-2 border-l-danger -ml-4 pl-4' : ''}`}>
                    {Icon && <Icon size={12} strokeWidth={2} className="text-ghost flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className="font-body font-medium text-ink text-[12px]">{lot.ing}</span>
                      <span className="font-body text-ghost text-[10px] ml-2">{lot.supplier.split('·')[1]?.trim() || ''}</span>
                    </div>
                    <Chip tone={lot.coaTone === 'ok' ? 'ok' : lot.coaTone === 'danger' ? 'danger' : 'warn'}>{lot.coa}</Chip>
                    <span className={`font-body text-[10px] font-medium ${lot.shelfTone === 'ok' ? 'text-ok' : lot.shelfTone === 'danger' ? 'text-danger' : 'text-warn'}`}>
                      {lot.shelf}d
                    </span>
                    <div className="ml-2">
                      {lot.urgent && !coaRequested
                        ? <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                        : lot.urgent && coaRequested
                        ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Requested</span>
                        : <button type="button" className="font-body text-muted text-[10px] hover:text-ink">View COA</button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Audit detail */}
          <div className="px-4 py-3 border-t border-rule2">
            <div className="font-body text-ghost text-[10px] uppercase tracking-wider mb-2">Audit history</div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-body text-ink text-[12px]">Last audit: <span className="font-medium">{audit?.lastAudit}</span></div>
                <div className={`font-body text-[11px] mt-0.5 ${
                  audit?.result === 'Approved' ? 'text-ok' : audit?.result === 'Conditional' ? 'text-warn' : 'text-danger'
                }`}>{audit?.result} · {audit?.findings} finding{audit?.findings !== 1 ? 's' : ''}</div>
                {audit?.reason && <div className="font-body text-muted text-[10px] mt-1">{audit.reason}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {audit?.needsAction && <Btn variant="primary">Schedule re-audit</Btn>}
                <Btn variant="secondary">Audit history</Btn>
              </div>
            </div>
            <div className="font-body text-ghost text-[10px] mt-2">Next scheduled: {audit?.nextAudit}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VariantD() {
  const d = supplierData

  // Build per-supplier lot map
  const lotsBySupplierName = {}
  d.lots.forEach(lot => {
    const name = Object.keys(supplierAudits).find(n => lot.supplier.startsWith(n))
    if (name) {
      if (!lotsBySupplierName[name]) lotsBySupplierName[name] = []
      lotsBySupplierName[name].push(lot)
    }
  })

  // Sort suppliers: urgent/action first, then by score asc
  const sorted = [...d.suppliers].sort((a, b) => {
    const aAction = supplierAudits[a.name]?.needsAction ? 1 : 0
    const bAction = supplierAudits[b.name]?.needsAction ? 1 : 0
    if (aAction !== bAction) return bAction - aAction
    return a.score - b.score
  })

  // ConAgra pre-expanded (they're the blocker)
  const [expanded, setExpanded] = useState(new Set(['ConAgra']))

  const toggle = (name) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone">
      {/* Header hint */}
      <div className="px-4 py-2 border-b border-rule2 bg-stone2 flex items-center justify-between">
        <span className="font-body text-ghost text-[10px]">5 suppliers · sorted by urgency · click to expand</span>
        <div className="flex gap-2">
          <Urg level="critical">ConAgra — action required</Urg>
        </div>
      </div>

      {sorted.map(s => (
        <SupplierRow
          key={s.name}
          supplier={s}
          audit={supplierAudits[s.name]}
          lots={lotsBySupplierName[s.name] || []}
          expanded={expanded.has(s.name)}
          onToggle={() => toggle(s.name)}
        />
      ))}
    </div>
  )
}
