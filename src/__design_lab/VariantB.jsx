// Variant B: Score-Led Tabs
// Three tabs: Suppliers (score leaderboard with bars) | Lots (status-first columns) | FSMA (traceability)
// Lots tab reorders columns: COA status → ingredient → shelf life → delivery → action
// FSMA traceability moves to its own tab so lots view stays clean

import { useState } from 'react'
import { Check, X, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { supplierData, supplierAudits } from '../data'
import { Btn, Chip, SecHd, Urg, ScoreRing } from '../components/UI'
import { useAppState } from '../context/AppState'
import { useNavigate } from 'react-router-dom'

function ShelfBar({ days, tone }) {
  const pct = Math.min(100, (days / 45) * 100)
  const barColor = tone === 'ok' ? 'bg-ok' : tone === 'danger' ? 'bg-danger' : 'bg-warn'
  const textColor = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-warn'
  return (
    <div>
      <span className={`font-body font-medium text-[11px] ${textColor}`}>{days}d</span>
      <div className="h-px bg-rule2 mt-1 w-12">
        <div className={`h-full ${barColor}`} style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

function TraceStep({ tone, label, name, detail, gapMsg, onResolve }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-rule2 last:border-b-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        tone === 'ok' ? 'bg-ok/20' : tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
      }`}>
        {tone === 'ok' && <Check size={10} strokeWidth={2} className="text-ok" />}
        {tone === 'gap' && <AlertTriangle size={10} strokeWidth={2} className="text-danger" />}
        {tone === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-ghost" />}
      </div>
      <div className="flex-1">
        <div className="font-body text-ghost text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
        <div className="font-body font-medium text-ink text-[12px]">{name}</div>
        <div className="font-body text-ghost text-[10px]">{detail}</div>
        {gapMsg && (
          <div className="font-body text-danger text-[10px] mt-1 flex items-start gap-1">
            <AlertTriangle size={10} strokeWidth={2} className="flex-shrink-0 mt-0.5" />{gapMsg}
          </div>
        )}
        {onResolve && (
          <button type="button" onClick={onResolve} className="font-body text-int text-[10px] mt-1 hover:underline flex items-center gap-1">
            Resolve in Data Readiness <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  )
}

const TABS = [
  { key: 'suppliers', label: 'Supplier scorecard' },
  { key: 'lots',      label: 'Ingredient lots' },
  { key: 'fsma',      label: 'FSMA traceability' },
]

export default function VariantB() {
  const [active, setActive] = useState('suppliers')
  const { coaRequested, setCoaRequested, readinessResolved } = useAppState()
  const navigate = useNavigate()
  const d = supplierData
  const namingResolved = readinessResolved?.['conflict-0']

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-stone">
      {/* Tabs */}
      <div className="flex border-b border-rule2 bg-stone2 px-4 gap-5 flex-shrink-0">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActive(key)}
            className={`flex items-center gap-1.5 py-2.5 border-b-2 transition-colors ${active === key ? 'border-b-ochre' : 'border-b-transparent'}`}>
            <span className={`font-body text-[11px] ${active === key ? 'text-ink font-medium' : 'text-muted'}`}>{label}</span>
            {key === 'suppliers' && active !== key && supplierAudits['ConAgra']?.needsAction && (
              <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            )}
            {key === 'fsma' && active !== key && !namingResolved && (
              <span className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Suppliers tab ── */}
        {active === 'suppliers' && (
          <>
            <SecHd tag="Supplier scorecard" title="Performance ranking — on-time, compliance, audit status"
              badge={<Urg level="critical">ConAgra — action required</Urg>} />
            {/* Column headers */}
            <div className="grid px-4 py-1.5 border-b border-rule2 bg-stone2" style={{ gridTemplateColumns: '1fr 140px 100px 90px 70px' }}>
              {['Supplier', 'Score', 'Last audit', 'Result', ''].map((h, i) => (
                <span key={i} className="font-body text-ghost text-[10px] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {[...d.suppliers].sort((a, b) => a.score - b.score).map((s) => {
              const audit = supplierAudits[s.name]
              return (
                <div key={s.name} className={`grid items-center px-4 py-3 border-b border-rule2 ${audit?.needsAction ? 'bg-danger/[0.02] border-l-2 border-l-danger' : 'border-l-2 border-l-transparent'}`}
                  style={{ gridTemplateColumns: '1fr 140px 100px 90px 70px' }}>
                  <div>
                    <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
                    {audit?.reason && <div className="font-body text-warn text-[10px] mt-0.5">{audit.reason}</div>}
                    <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 inline-flex mt-1 ${
                      s.tierTone === 'ok' ? 'bg-ok/10 text-ok' : s.tierTone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-int/10 text-int'
                    }`}>{s.tier}</span>
                  </div>
                  <div><ScoreRing pct={s.score} size={36} /></div>
                  <div className="font-body text-muted text-[11px]">{audit?.lastAudit}</div>
                  <div className={`font-body font-medium text-[11px] ${
                    audit?.result === 'Approved' ? 'text-ok' : audit?.result === 'Conditional' ? 'text-warn' : 'text-danger'
                  }`}>{audit?.result}</div>
                  <div>
                    {audit?.needsAction && <Btn variant="secondary">Re-audit</Btn>}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── Lots tab ── */}
        {active === 'lots' && (
          <>
            <SecHd tag="Ingredient lots" title="Current batch — sorted by urgency"
              badge={<Urg level="critical">1 blocking · 2 expiring</Urg>} />
            {/* Column headers — status first */}
            <div className="grid px-4 py-1.5 border-b border-rule2 bg-stone2" style={{ gridTemplateColumns: '90px 1fr 80px 140px 100px' }}>
              {['COA status', 'Ingredient', 'Shelf life', 'Delivery', ''].map((h, i) => (
                <span key={i} className="font-body text-ghost text-[10px] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {[...d.lots].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || a.shelf - b.shelf).map((lot, i) => (
              <div key={i} className={`grid items-center px-4 py-3 border-b border-rule2 border-l-2 ${
                lot.urgent ? 'border-l-danger bg-danger/[0.02]' : lot.shelfTone === 'warn' ? 'border-l-warn' : 'border-l-transparent'
              }`} style={{ gridTemplateColumns: '90px 1fr 80px 140px 100px' }}>
                {/* COA — status first */}
                <Chip tone={lot.coaTone === 'ok' ? 'ok' : lot.coaTone === 'danger' ? 'danger' : 'warn'}>{lot.coa}</Chip>
                {/* Ingredient */}
                <div>
                  <div className={`font-body font-medium text-[12px] ${lot.urgent ? 'text-danger' : 'text-ink'}`}>{lot.ing}</div>
                  <div className="font-body text-ghost text-[10px] mt-0.5">{lot.supplier}</div>
                </div>
                {/* Shelf life */}
                <ShelfBar days={lot.shelf} tone={lot.shelfTone} />
                {/* Delivery */}
                <div>
                  <div className={`font-body font-medium text-[11px] ${
                    lot.deliveryTone === 'ok' ? 'text-ok' : lot.deliveryTone === 'warn' ? 'text-warn' : lot.deliveryTone === 'int' ? 'text-int' : 'text-ink'
                  }`}>{lot.delivery}</div>
                  <div className="font-body text-ghost text-[10px]">{lot.deliveryTime}</div>
                </div>
                {/* Action */}
                <div className="flex justify-end">
                  {lot.urgent && !coaRequested
                    ? <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                    : lot.urgent && coaRequested
                    ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Sent</span>
                    : <button type="button" className="font-body text-muted text-[10px] hover:text-ink">View COA</button>
                  }
                </div>
              </div>
            ))}
            {coaRequested && (
              <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-t border-ok/20 font-body text-ok text-[11px]">
                <Check size={11} strokeWidth={2} /> COA request sent to ConAgra · Expected response within 2 hours
              </div>
            )}
          </>
        )}

        {/* ── FSMA tab ── */}
        {active === 'fsma' && (
          <>
            <SecHd tag="FSMA 204 traceability" title="Lot-level chain of custody — Tomato Sauce · TS-8811"
              badge={<Urg level={namingResolved ? 'ok' : 'warn'}>{namingResolved ? 'Naming resolved' : '1 chain gap'}</Urg>} />
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule2 ${namingResolved ? 'bg-ok/10' : 'bg-danger/[0.04]'}`}>
              <div className="flex gap-1 flex-shrink-0">
                {[{t:'ok',l:'CTE 1'},{t: namingResolved ? 'ok' : 'gap',l:'CTE 2'},{t:'pending',l:'CTE 3'},{t:'pending',l:'CTE 4'}].map((n,i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${n.t==='ok'?'bg-ok/20':n.t==='gap'?'bg-danger/20':'bg-stone3'}`}>
                      {n.t==='ok' && <Check size={8} strokeWidth={2} className="text-ok" />}
                      {n.t==='gap' && <X size={8} strokeWidth={2} className="text-danger" />}
                      {n.t==='pending' && <div className="w-1.5 h-1.5 rounded-full bg-ghost" />}
                    </div>
                    <span className="font-body text-ghost text-[8px]">{n.l}</span>
                  </div>
                ))}
              </div>
              <p className="font-body text-[11px] flex-1">
                {namingResolved
                  ? <span className="text-ok">Naming conflict resolved — chain validates on COA receipt.</span>
                  : <><span className="text-danger font-semibold">1 of 4 links validated</span><span className="text-ink2"> — naming conflict blocks FSMA 204 submission.</span></>
                }
              </p>
            </div>
            <div className="flex items-start gap-2 px-4 py-2.5 bg-ok/10 border-b border-rule2">
              <Clock size={13} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
              <p className="font-body text-ink2 text-[11px]">FSMA 204 chain must be submittable within <span className="text-ok font-semibold">24 hours</span> of an FDA request.</p>
            </div>
            <div className="px-4 py-2 relative">
              <div className="absolute left-[28px] top-4 bottom-4 w-px bg-rule2" />
              <TraceStep label="Supplier · CTE 1" name="ConAgra Foods — Omaha, NE" detail="Lot TS-8811 · Packed Apr 12" tone="ok" />
              <TraceStep label="Receiving · CTE 2" name="Salina Plant — Dock 3" detail="Expected Apr 16, 18:00 · COA not received"
                tone={namingResolved ? 'ok' : 'gap'}
                gapMsg={namingResolved ? null : 'MES "Tomato Sauce" ≠ ERP "Tomato Paste, Concentrate" — chain gap prevents submission.'}
                onResolve={namingResolved ? null : () => navigate('/readiness', { state: { highlight: 'conflict-0' } })} />
              <TraceStep label="Production · CTE 3" name="Line 4 — Pepperoni Classic batch" detail="Scheduled Apr 17, 06:00 · Pending lot receipt" tone="pending" />
              <TraceStep label="Finished Goods · CTE 4" name="FG Lot pending" detail="Auto-populates on production close" tone="pending" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
