// Variant C: Priority Action Cards
// No tabs. Sections flow from most to least urgent.
// Blocking item = full-width hero card. Expiring lots = 2-col cards. Suppliers = compact bar list.
// More visual space per item, making each action easy to spot and act on.

import { useState } from 'react'
import { Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { supplierData, supplierAudits } from '../data'
import { Btn, Chip, ScoreRing } from '../components/UI'
import { useAppState } from '../context/AppState'

function SectionHead({ label, tone, count }) {
  const colors = {
    danger: 'text-danger',
    warn:   'text-warn',
    muted:  'text-muted',
  }
  return (
    <div className="flex items-baseline gap-2 px-4 pt-5 pb-2">
      <span className={`font-body font-medium text-[10px] uppercase tracking-widest ${colors[tone]}`}>{label}</span>
      {count !== undefined && <span className={`font-body text-[10px] ${colors[tone]} opacity-50`}>{count}</span>}
    </div>
  )
}

export default function VariantC() {
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent } = useAppState()
  const d = supplierData
  const expiring = d.lots.filter(l => !l.urgent && l.shelfTone !== 'ok')

  return (
    <div className="flex-1 overflow-y-auto bg-stone2">

      {/* ── Blocking ─────────────────────────────── */}
      <SectionHead label="Production blocked" tone="danger" />

      <div className="mx-4 mb-2 bg-stone border border-danger/25 p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-danger/[0.08] border-b border-danger/15">
          <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0" />
          <span className="font-body font-medium text-danger text-[11px]">COA missing — production hold active</span>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-ghost text-[10px] mb-1">Tomato Sauce · ConAgra Foods · Lot TS-8811</div>
              <div className="font-body font-medium text-ink text-[14px] leading-snug">COA not received</div>
              <div className="font-body text-muted text-[11px] mt-1.5 leading-relaxed">
                Delivery expected 18:00 today · Shelf life 9 days · FSMA 204 chain gap at CTE 2
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end flex-shrink-0">
              {coaRequested
                ? <div className="font-body text-ok text-[11px] flex items-center gap-1.5"><Check size={12} strokeWidth={2} /> Requested</div>
                : <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
              }
              <button type="button" className="font-body text-int text-[10px] flex items-center gap-1 hover:underline">
                Resolve FSMA gap <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>
        {coaRequested && (
          <div className="px-4 py-2.5 bg-ok/10 border-t border-ok/20 font-body text-ok text-[11px] flex items-center gap-2">
            <Check size={11} strokeWidth={2} /> Sent to ConAgra · Response expected within 2 hours
          </div>
        )}
      </div>

      {/* ConAgra audit card */}
      <div className="mx-4 mb-2 bg-stone border border-warn/25 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-body text-ghost text-[10px] mb-0.5">ConAgra Foods</div>
            <div className="font-body font-medium text-ink text-[13px]">Audit: Conditional approval</div>
            <div className="font-body text-muted text-[11px] mt-0.5">3 documentation findings · 2 COA errors in last 4 deliveries</div>
          </div>
          <Btn variant="secondary">Schedule re-audit</Btn>
        </div>
      </div>

      {/* ── Expiring soon ────────────────────────── */}
      {expiring.length > 0 && (
        <>
          <SectionHead label="Expiring soon" tone="warn" count={`${expiring.length} lots`} />
          <div className="mx-4 mb-2 grid grid-cols-2 gap-2">
            {expiring.map((lot, i) => (
              <div key={i} className="bg-stone border border-rule2 overflow-hidden">
                <div className={`h-0.5 ${lot.shelfTone === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
                <div className="px-3 py-3">
                  <div className="font-body text-ghost text-[10px] mb-0.5">{lot.supplier}</div>
                  <div className="font-body font-medium text-ink text-[13px]">{lot.ing}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Chip tone={lot.shelfTone}>{lot.shelf} days</Chip>
                    {lot.useFirst && <span className="font-body text-warn text-[10px]">Use first</span>}
                  </div>
                  <div className="h-px bg-rule2 mt-2 mb-2">
                    <div className={`h-full ${lot.shelfTone === 'danger' ? 'bg-danger' : 'bg-warn'}`}
                      style={{ width: Math.min(100, (lot.shelf / 45) * 100) + '%' }} />
                  </div>
                  <div className="font-body text-ghost text-[10px]">{lot.delivery} · {lot.deliveryTime}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Price alerts */}
          <div className="mx-4 mb-2 bg-stone border border-warn/20 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-body font-medium text-ink text-[12px]">Price alerts</div>
              <div className="font-body text-ghost text-[10px] mt-0.5">Tomato sauce +14% · ConAgra contract May 12 · Canola oil +8%</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Chip tone="warn">2 active</Chip>
              {!rfqSent
                ? <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request RFQ</Btn>
                : <span className="font-body text-ok text-[10px]">RFQ sent</span>
              }
            </div>
          </div>
        </>
      )}

      {/* ── Supplier standings ───────────────────── */}
      <SectionHead label="Supplier standings" tone="muted" />
      <div className="mx-4 mb-6 bg-stone border border-rule2 divide-y divide-rule2 overflow-hidden">
        {[...d.suppliers].sort((a, b) => a.score - b.score).map((s) => {
          const audit = supplierAudits[s.name]
          return (
            <div key={s.name} className={`flex items-center gap-4 px-4 py-2.5 ${audit?.needsAction ? 'bg-danger/[0.02]' : ''}`}>
              <div className="w-16 flex-shrink-0">
                <ScoreRing pct={s.score} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-body font-medium text-ink text-[12px]">{s.name}</span>
                <span className="font-body text-ghost text-[10px] ml-2">{audit?.lastAudit}</span>
              </div>
              <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
                s.tierTone === 'ok' ? 'bg-ok/10 text-ok' : s.tierTone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-int/10 text-int'
              }`}>{s.tier}</span>
              <span className={`font-body text-[10px] ${
                audit?.result === 'Approved' ? 'text-ok' : audit?.result === 'Conditional' ? 'text-warn' : 'text-danger'
              }`}>{audit?.result}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
