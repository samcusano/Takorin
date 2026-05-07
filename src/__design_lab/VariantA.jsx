// Variant A: Urgency-First Stream
// No tabs. Single continuous list grouped by urgency — resolve now, monitor, reference.
// JTBD first: blocking item is the hero. Everything else is subordinate.

import { useState } from 'react'
import { Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { supplierData, supplierAudits } from '../data'
import { Btn, Chip, ScoreRing } from '../components/UI'
import { useAppState } from '../context/AppState'

function SectionLabel({ tone, label, sub }) {
  const colors = {
    danger: 'text-danger bg-danger/[0.04] border-b-2 border-b-danger/20',
    warn:   'text-warn bg-warn/[0.04] border-b border-rule2',
    muted:  'text-muted bg-stone2 border-b border-rule2',
  }
  return (
    <div className={`px-4 py-2 flex items-baseline gap-2 ${colors[tone]}`}>
      <span className="font-body font-medium text-[10px] uppercase tracking-widest">{label}</span>
      {sub && <span className="font-body text-[10px] opacity-60">{sub}</span>}
    </div>
  )
}

export default function VariantA() {
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent } = useAppState()
  const d = supplierData
  const expiring = d.lots.filter(l => !l.urgent && l.shelfTone !== 'ok')

  return (
    <div className="flex-1 overflow-y-auto bg-stone">

      {/* ── Resolve now ─────────────────────────── */}
      <SectionLabel tone="danger" label="Resolve now" sub="1 item blocking production" />

      {/* Hero card: COA missing */}
      <div className="p-4 border-b border-rule2 bg-danger/[0.025]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Chip tone="danger">COA Missing</Chip>
              <span className="font-body text-ghost text-[10px]">ConAgra Foods · Lot TS-8811</span>
            </div>
            <div className="font-body font-medium text-ink text-[15px] leading-snug">Tomato Sauce</div>
            <div className="font-body text-muted text-[11px] mt-1 leading-relaxed">
              Delivery expected 18:00 today · 9 days shelf remaining · Production start held
            </div>
            <div className="flex items-center gap-1.5 mt-2 font-body text-danger text-[10px]">
              <AlertTriangle size={10} strokeWidth={2} className="flex-shrink-0" />
              FSMA 204 — naming conflict at CTE 2 blocks traceability submission
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            {coaRequested
              ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Requested</span>
              : <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
            }
            <button type="button" className="font-body text-int text-[10px] hover:underline flex items-center gap-1">
              Fix FSMA gap <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ConAgra audit action */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule2 border-l-2 border-l-warn">
        <div>
          <div className="font-body font-medium text-ink text-[12px]">ConAgra SQF audit — conditional approval</div>
          <div className="font-body text-ghost text-[10px] mt-0.5">3 documentation findings · 2 COA errors in last 4 deliveries</div>
        </div>
        <Btn variant="secondary">Schedule re-audit</Btn>
      </div>

      {/* ── Monitoring ─────────────────────────── */}
      <SectionLabel tone="warn" label="Monitoring" sub={`${expiring.length} lots expiring · 2 price alerts`} />

      {expiring.map((lot, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-rule2">
          <div className={`w-0.5 self-stretch flex-shrink-0 ${lot.shelfTone === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
          <div className="flex-1 min-w-0">
            <span className="font-body font-medium text-ink text-[12px]">{lot.ing}</span>
            <span className="font-body text-ghost text-[11px] ml-2">{lot.supplier}</span>
          </div>
          <Chip tone={lot.shelfTone}>{lot.shelf} days</Chip>
          {lot.useFirst && <span className="font-body text-warn text-[10px] flex-shrink-0">Use first</span>}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule2">
        <div>
          <div className="font-body font-medium text-ink text-[12px]">Price alerts active</div>
          <div className="font-body text-ghost text-[10px] mt-0.5">
            Tomato sauce +14% · ConAgra contract renewal May 12 · Canola oil +8%
          </div>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          <Chip tone="warn">2 active</Chip>
          {!rfqSent
            ? <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request alternatives</Btn>
            : <span className="font-body text-ok text-[10px]">RFQ sent</span>
          }
        </div>
      </div>

      {/* ── Supplier standings ─────────────────── */}
      <SectionLabel tone="muted" label="Supplier standings" sub="5 suppliers · 1 action required" />

      {[...d.suppliers].sort((a, b) => a.score - b.score).map((s) => {
        const audit = supplierAudits[s.name]
        return (
          <div key={s.name} className={`flex items-center gap-4 px-4 py-2.5 border-b border-rule2 ${audit?.needsAction ? 'bg-danger/[0.02]' : ''}`}>
            <ScoreRing pct={s.score} size={32} />
            <div className="flex-1 min-w-0">
              <div className="font-body font-medium text-ink text-[12px]">{s.name}</div>
              <div className="font-body text-ghost text-[10px]">{audit?.lastAudit} · {audit?.result}</div>
            </div>
            <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
              s.tierTone === 'ok' ? 'bg-ok/10 text-ok'
              : s.tierTone === 'danger' ? 'bg-danger/10 text-danger'
              : 'bg-int/10 text-int'
            }`}>{s.tier}</span>
          </div>
        )
      })}
    </div>
  )
}
