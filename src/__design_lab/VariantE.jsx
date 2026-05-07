// Variant E: Timeline Feed
// Alert strip at top (counts by urgency).
// Content is a chronological feed: Now → Today → This week → Before FDA.
// Each "event" shows what it is, why it's urgent, and one action.
// Mirrors how an operator actually thinks about time — "what do I do NOW vs later?"

import { useState } from 'react'
import { Check, AlertTriangle, Clock, Truck, TrendingUp, ArrowRight } from 'lucide-react'
import { supplierData, supplierAudits } from '../data'
import { Btn, Chip } from '../components/UI'
import { useAppState } from '../context/AppState'

function AlertChip({ count, tone, label }) {
  const cls = {
    danger: 'border-danger/30 text-danger bg-danger/5',
    warn:   'border-warn/30 text-warn bg-warn/5',
    muted:  'border-rule2 text-ghost bg-stone2',
  }[tone]
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 border font-body text-[11px] ${cls}`}>
      <span className="font-medium">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}

function TimeSection({ label, urgent }) {
  const bg = urgent === 'danger' ? 'bg-danger/[0.04]' : urgent === 'warn' ? 'bg-warn/[0.04]' : 'bg-stone2'
  const textColor = urgent === 'danger' ? 'text-danger' : urgent === 'warn' ? 'text-warn' : 'text-muted'
  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-b border-rule2 ${bg}`}>
      <span className={`font-body font-medium text-[10px] uppercase tracking-widest ${textColor}`}>{label}</span>
      <div className="flex-1 h-px bg-current opacity-10" />
    </div>
  )
}

function FeedItem({ icon: Icon, iconColor, title, sub, meta, action, tag, tone }) {
  const borderColor = {
    danger: 'border-l-danger',
    warn:   'border-l-warn',
    ok:     'border-l-ok',
    muted:  'border-l-rule2',
  }[tone] || 'border-l-rule2'

  return (
    <div className={`flex items-start gap-4 px-4 py-3 border-b border-rule2 border-l-2 ${borderColor}`}>
      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {tag && <Chip tone={tone === 'ok' ? 'ok' : tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'muted'}>{tag}</Chip>}
          <span className="font-body font-medium text-ink text-[12px]">{title}</span>
        </div>
        <div className="font-body text-muted text-[11px] leading-snug">{sub}</div>
        {meta && <div className="font-body text-ghost text-[10px] mt-1">{meta}</div>}
      </div>
      {action && <div className="flex-shrink-0 mt-0.5">{action}</div>}
    </div>
  )
}

export default function VariantE() {
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent } = useAppState()

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-stone">

      {/* Alert strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-rule2 bg-stone2 flex-shrink-0 overflow-x-auto">
        <span className="font-body text-ghost text-[10px] flex-shrink-0 mr-1">Active</span>
        <AlertChip count="1" tone="danger" label="blocking production" />
        <AlertChip count="2" tone="warn" label="lots expiring < 14d" />
        <AlertChip count="2" tone="warn" label="price alerts" />
        <AlertChip count="18" tone="muted" label="days to FDA inspection" />
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* NOW ─────────────────────────────────── */}
        <TimeSection label="Now" urgent="danger" />

        <FeedItem
          icon={AlertTriangle}
          iconColor="text-danger"
          tone="danger"
          tag="Blocking"
          title="COA missing — Tomato Sauce"
          sub="ConAgra Foods · Lot TS-8811 · Production start held"
          meta="Delivery expected 18:00 today · FSMA 204 chain gap at CTE 2"
          action={coaRequested
            ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Requested</span>
            : <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
          }
        />

        {coaRequested && (
          <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-b border-ok/20 border-l-2 border-l-ok font-body text-ok text-[11px]">
            <Check size={11} strokeWidth={2} /> COA requested · ConAgra response expected within 2 hours · Hold remains until received
          </div>
        )}

        {/* TODAY ─────────────────────────────────── */}
        <TimeSection label="Today" urgent="warn" />

        <FeedItem
          icon={Truck}
          iconColor="text-int"
          tone="warn"
          tag="In transit"
          title="Canola oil — ETA 16:30"
          sub="ADM · Lot CO-5502 · COA pending receipt"
          meta="Shelf life 12 days · Price alert +8% vs prior"
        />

        {/* THIS WEEK ─────────────────────────────── */}
        <TimeSection label="This week" urgent="warn" />

        <FeedItem
          icon={Clock}
          iconColor="text-warn"
          tone="warn"
          tag="Use first"
          title="Tomato sauce shelf — 9 days"
          sub="ConAgra · Lot TS-8811 · Schedule before Apr 25"
          meta="Prioritize in production schedule once COA received"
        />

        <FeedItem
          icon={Clock}
          iconColor="text-warn"
          tone="warn"
          tag="Use first"
          title="Canola oil shelf — 12 days"
          sub="ADM · Lot CO-5502 · Schedule before Apr 28"
        />

        <FeedItem
          icon={TrendingUp}
          iconColor="text-warn"
          tone="warn"
          tag="Price alert"
          title="Tomato sauce +14% · Canola oil +8%"
          sub="ConAgra contract renewal May 12 · Alternative suppliers available within 5%"
          action={rfqSent
            ? <span className="font-body text-ok text-[10px]">RFQ sent</span>
            : <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request RFQ</Btn>
          }
        />

        {/* BEFORE FDA ─────────────────────────────── */}
        <TimeSection label="Before FDA inspection — Apr 16 (18 days)" urgent="muted" />

        <FeedItem
          icon={AlertTriangle}
          iconColor="text-muted"
          tone="muted"
          tag="FSMA 204"
          title="Traceability chain gap — CTE 2"
          sub="Naming conflict: MES 'Tomato Sauce' ≠ ERP 'Tomato Paste, Concentrate'"
          meta="Resolve in Data Readiness to unblock FSMA submission"
          action={
            <button type="button" className="font-body text-int text-[10px] hover:underline flex items-center gap-1">
              Fix gap <ArrowRight size={10} />
            </button>
          }
        />

        <FeedItem
          icon={Clock}
          iconColor="text-muted"
          tone="muted"
          tag="26 days"
          title="ConAgra SQF renewal — expires May 12"
          sub="Conditional approval · Auto-request sent"
          meta="Schedule re-audit before expiry to avoid probationary status"
          action={<Btn variant="secondary">Schedule</Btn>}
        />

        <FeedItem
          icon={Check}
          iconColor="text-ok"
          tone="ok"
          tag="Done"
          title="CAPA register complete"
          sub="14 cases · all evidence-gated · sanitation records current"
        />

      </div>
    </div>
  )
}
