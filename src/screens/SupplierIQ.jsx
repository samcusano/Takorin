import { useState } from 'react'
import { Check, AlertTriangle, ArrowRight, History, AlertCircle, Eye } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { supplierData, supplierAudits, empResultsHistory } from '../data'
import { useAppState } from '../context/AppState'
import { StatusPill, SectionHeader, Btn, ActionBanner, Spinner, AnimatedCheck, MetadataRow, ExpandableMetadata, SlidePanel, StatGrid, SectionLabel } from '../components/UI'
import StatBar from '../components/StatBar.jsx'

// ── LotTicketPanel ────────────────────────────────────────────────────────────

function LotTicketPanel({ lot, onClose, coaRequested, setCoaRequested }) {
  if (!lot) return null

  const coaPass      = lot.coaTone === 'ok'
  const shelfPct     = Math.min(100, Math.round((lot.shelf / 45) * 100))
  const shelfTextCls = lot.shelfTone === 'ok' ? 'text-ok' : lot.shelfTone === 'warn' ? 'text-warn' : 'text-danger'
  const supplierName = lot.supplier.split(' · ')[0]
  const lotCode      = lot.supplier.split(' · ')[1] || lot.delivery
  const accentColor  = lot.coaTone === 'ok' ? 'var(--color-ok)' : lot.coaTone === 'danger' ? 'var(--color-danger)' : 'var(--color-warn)'
  const deliveryTextCls = lot.deliveryTone === 'ok' ? 'text-ink' : lot.deliveryTone === 'warn' ? 'text-warn' : 'text-signal'

  const steps = [
    { label: `Confirm COA from ${supplierName}`, done: coaPass },
    { label: 'Receive physical shipment',         done: lot.delivery === 'Delivered' },
    { label: 'Complete microbial test',           done: coaPass },
    { label: 'Complete pH test',                  done: coaPass },
    { label: 'Complete moisture test',            done: coaPass },
    { label: 'Complete test certification',       done: coaPass },
  ]
  const completedCount = steps.filter(s => s.done).length

  const footer = lot.coaTone === 'danger' ? (
    <div className="flex items-center gap-2">
      {coaRequested
        ? <span className="font-body text-ok text-label flex items-center gap-1.5"><Check size={11} strokeWidth={2} />COA request sent</span>
        : <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
      }
      <Btn variant="secondary" onClick={onClose}>Close</Btn>
    </div>
  ) : (
    <Btn variant="secondary" onClick={onClose}>Close</Btn>
  )

  return (
    <SlidePanel
      title={lot.ing}
      subtitle={`${lotCode} · ${supplierName}`}
      accentColor={accentColor}
      onClose={onClose}
      footer={footer}
    >
      {/* All sections go edge-to-edge by negating the panel's p-5 */}
      <div className="-m-5 space-y-0">

        {/* ── Status strip ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-rule2">
          <span className="font-body text-micro text-muted">{coaPass ? 'RECEIVED' : 'PENDING RECEIPT'}</span>
          {!coaPass && <StatusPill tone="danger">Hold Active</StatusPill>}
        </div>

        {/* ── Key metrics ──────────────────────────────────────────── */}
        <StatGrid cols={2}>
          <div className={`px-5 py-4 ${lot.deliveryTone !== 'ok' ? 'bg-warn/[0.02]' : 'bg-stone'}`}>
            <div className="font-body text-micro text-muted mb-1.5">Expected Arrival</div>
            <div className={`font-body font-medium text-body ${deliveryTextCls}`}>{lot.deliveryTime}</div>
          </div>
          <div className={`px-5 py-4 ${lot.shelfTone === 'danger' ? 'bg-danger/[0.025]' : lot.shelfTone === 'warn' ? 'bg-warn/[0.02]' : 'bg-stone'}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {lot.shelfTone !== 'ok' && (
                <AlertTriangle size={10} strokeWidth={2} className={lot.shelfTone === 'danger' ? 'text-danger' : 'text-warn'} />
              )}
              <span className="font-body text-micro text-muted">Shelf Life</span>
            </div>
            <div className={`display-num text-head font-bold leading-none ${shelfTextCls}`}>
              {lot.shelf}
              <span className="font-body text-label font-normal text-muted ml-1.5">of 45 days ({shelfPct}%)</span>
            </div>
          </div>
        </StatGrid>

        {/* ── Release readiness ─────────────────────────────────────── */}
        <div>
          <SectionLabel label="Release Readiness"
            badge={`${completedCount} of ${steps.length} steps complete`}
            badgeTone={completedCount === steps.length ? 'ok' : 'muted'} />
          <div className="divide-y divide-rule2">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3.5 px-5 py-3 ${step.done ? 'bg-ok/[0.02]' : ''}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  step.done ? 'bg-ok border-ok' : 'border-rule'
                }`}>
                  {step.done && <Check size={10} strokeWidth={2.5} className="text-stone" />}
                </div>
                <span className={`font-body text-body leading-snug ${step.done ? 'text-muted' : 'text-ink'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </SlidePanel>
  )
}


// ── Shared palette — matches ShiftIQV2 FindingCard / OperatorRow ─────────────
const SC = {
  bg: '#0B0F18', surface: '#131A26', border: '#263042', border2: '#1A2335',
  context: '#C4844E', rust: '#DE6C4E', amber: '#C98E2A', sage: '#5FA877', bone: '#EDE4CB',
}

// ── SupplierCard — FindingCard grammar for critical/monitoring items ───────────
function SupplierCard({ tone = 'warn', title, desc, evidence, children, actions, delay = 0 }) {
  const accent = tone === 'danger' ? SC.rust : tone === 'warn' ? SC.amber : SC.border
  return (
    <div className="row-in" style={{ background: SC.surface, border: `1px solid ${SC.border}`, borderLeft: `3px solid ${accent}`, marginBottom: 10, animationDelay: `${delay}ms` }}>
      <div style={{ padding: '14px 16px 10px' }}>
        <div className="font-display font-semibold text-base text-ink leading-snug mb-2">{title}</div>
        {desc && <p className="font-display text-body text-ink leading-relaxed m-0">{desc}</p>}
      </div>
      {evidence && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${SC.border2}`, borderBottom: `1px solid ${SC.border2}` }}>
          <span className="font-body text-label text-muted">{evidence}</span>
        </div>
      )}
      {children}
      {actions && (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ── SupplierRow — OperatorRow grammar for supplier standings ──────────────────
function SupplierRow({ s, audit, isDanger, certGap, index, total }) {
  const scoreColor = s.score >= 90 ? SC.sage : s.score >= 80 ? SC.amber : SC.rust
  const hasFlag = isDanger || audit?.result === 'Conditional' || audit?.needsAction
  const flagLabel = audit?.needsAction ? 'Needs action' : isDanger ? 'At risk' : 'Conditional'
  const flagColor = isDanger ? SC.rust : SC.amber
  return (
    <div className="row-in" style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px',
      borderBottom: index < total - 1 ? `1px solid ${SC.border2}` : 'none',
      background: isDanger ? `${SC.rust}09` : 'transparent',
      animationDelay: `${index * 55}ms`,
    }}>
      <div style={{ minWidth: 140 }}>
        <div className="font-body font-medium text-body" style={{ color: isDanger ? SC.rust : SC.bone }}>{s.name}</div>
        <div className="font-body text-micro text-muted" style={{ marginTop: 3 }}>{s.tier}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 2, background: SC.border }}>
          <div className="bar-grow" style={{ height: '100%', width: `${s.score}%`, background: scoreColor }} />
        </div>
        <span className="font-body text-label" style={{ minWidth: 28, textAlign: 'right', color: scoreColor }}>{s.score}</span>
      </div>
      {certGap && <StatusPill tone="warn">{certGap.badge} cert</StatusPill>}
      {hasFlag && (
        <span className="font-body text-micro flex-shrink-0 px-1.5 py-0.5"
          style={{ color: flagColor, background: `${flagColor}18`, border: `1px solid ${flagColor}40` }}>
          {flagLabel}
        </span>
      )}
    </div>
  )
}


// ── Main screen ───────────────────────────────────────────────────────────────

export default function SupplierIQ() {
  const d = supplierData
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent, readinessResolved, resolvedConflicts, closedCases } = useAppState()
  const [exportState, setExportState] = useState('idle')
  const [coaViewLot, setCoaViewLot] = useState(null)
  const navigate = useNavigate()
  const namingResolved = readinessResolved?.['conflict-0'] || resolvedConflicts?.has?.(0)
  const capaTs8811Closed = closedCases?.includes?.('c3')

  const handleExport = () => {
    setExportState('loading')
    setTimeout(() => setExportState('done'), 1500)
  }

  const blockingLots = d.lots.filter(l => l.urgent)
  const monitoringLots = d.lots.filter(l => !l.urgent && l.shelfTone !== 'ok')
  const auditActionSuppliers = d.suppliers.filter(s => supplierAudits[s.name]?.needsAction)
  const sortedSuppliers = [...d.suppliers].sort((a, b) => a.score - b.score)

  const resolveCount = blockingLots.length + auditActionSuppliers.length

  // Map cert-type gaps (warn tone) to their supplier by name match
  const certGapBySupplier = {}
  d.gaps.filter(g => g.tone === 'warn').forEach(g => {
    const match = d.suppliers.find(s => g.title.includes(s.name))
    if (match) certGapBySupplier[match.name] = g
  })

  return (
    <>
    <LotTicketPanel lot={coaViewLot} onClose={() => setCoaViewLot(null)} coaRequested={coaRequested} setCoaRequested={setCoaRequested} />
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* ── Resolve now ── */}
        {resolveCount > 0 && (
          <>
            <div style={{ padding: '20px 24px 16px' }}>
              <div className="font-body text-micro text-muted mb-3">
                Resolve now · {resolveCount} item{resolveCount > 1 ? 's' : ''} blocking production
              </div>

            {blockingLots.map((lot, i) => (
              <SupplierCard
                key={i}
                delay={i * 60}
                tone="danger"
                title={`${lot.ing} — COA Missing`}
                desc={`Production start held · ${lot.supplier} · Lot ${lot.delivery}`}
                evidence={[`${lot.shelf}d shelf remaining`, lot.deliveryTime, lot.supply].filter(Boolean).join(' · ')}
                actions={coaRequested
                  ? <span className="font-body text-ok text-label flex items-center gap-1"><Check size={11} strokeWidth={2} /> COA request sent</span>
                  : <>
                      <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                      <Btn variant="secondary" onClick={() => setCoaViewLot(lot)}>View specs</Btn>
                    </>
                }
              >
                {!namingResolved && (
                  <div style={{ borderTop: `1px solid ${SC.border2}` }}
                    className="flex items-start gap-1.5 px-4 py-2.5 bg-danger/5">
                    <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-body font-medium text-danger text-label">FSMA 204 blocker</div>
                      <div className="font-body text-danger text-label mt-0.5 opacity-80">Naming conflict at CTE 2 prevents traceability submission</div>
                      <button type="button"
                        onClick={() => navigate('/readiness', { state: { highlight: 'conflict-0' } })}
                        className="font-body text-danger text-label hover:underline mt-1 flex items-center gap-0.5">
                        Fix in Data Readiness <ArrowRight size={9} />
                      </button>
                    </div>
                  </div>
                )}
              </SupplierCard>
            ))}

            {auditActionSuppliers.map((s, i) => (
              <SupplierCard
                key={s.name}
                delay={(blockingLots.length + i) * 60}
                tone="warn"
                title={`${s.name} — Conditional Audit Approval`}
                desc="Re-audit required before next purchase order"
                evidence={[`Reason: ${supplierAudits[s.name]?.reason.split(' · ')[0]}`, `Last audit: ${supplierAudits[s.name]?.lastAudit}`].filter(Boolean).join(' · ')}
                actions={<><Btn variant="primary">Schedule re-audit</Btn><Btn variant="secondary"><History size={11} /></Btn></>}
              />
            ))}
            </div>
          </>
        )}

        {resolveCount > 0 && <div style={{ height: 1, background: SC.border }} />}

        {/* ── Lots at risk ── */}
        {monitoringLots.length > 0 && (
          <>
            <div style={{ padding: '20px 24px 16px' }}>
              <div className="font-body text-micro text-muted mb-3">
                Lots at risk · {monitoringLots.length}
              </div>

              {monitoringLots.map((lot, i) => (
                <SupplierCard
                  key={i}
                  delay={i * 60}
                  tone={lot.shelfTone === 'danger' ? 'danger' : 'warn'}
                  title={`${lot.ing} — ${lot.shelfTone === 'danger' ? 'Expiring soon' : 'Shelf life alert'}`}
                  desc={`${lot.supplier} · Lot ${lot.delivery}`}
                  evidence={[`${lot.shelf}d shelf remaining`, lot.deliveryTime, lot.coa].filter(Boolean).join(' · ')}
                  actions={
                    <button type="button" onClick={() => setCoaViewLot(lot)}
                      className="font-body font-medium text-label px-3 py-2 min-h-[36px] flex items-center gap-2 bg-stone2 text-muted hover:bg-stone3 transition-colors">
                      <Eye size={10} /> View COA
                    </button>
                  }
                >
                  {lot.useFirst && (
                    <div style={{ borderTop: `1px solid ${SC.border2}` }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-warn/5">
                      <AlertCircle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
                      <span className="font-body text-warn text-label">Use-first priority — prioritize in stock rotation</span>
                    </div>
                  )}
                </SupplierCard>
              ))}
            </div>
            <div style={{ height: 1, background: SC.border }} />
          </>
        )}

        {/* ── Supplier intelligence ── */}
        <div style={{ padding: '20px 24px 16px' }}>
          <div className="font-body text-micro text-muted mb-3">
            Supplier intelligence
          </div>

          <SupplierCard
            tone="warn"
            title="ConAgra reliability — 22nd percentile"
            desc="Network signal · 3 non-conformances in last 30 days across 14 plants"
            evidence="High confidence · Network intelligence · 14 plants · Pattern: delivery delays → scrap spikes"
            actions={
              <Link to="/overview" className="font-body text-signal text-label flex items-center gap-1 hover:text-ink transition-colors">
                <ArrowRight size={9} />View in Network
              </Link>
            }
          />

          <SupplierCard
            tone="warn"
            title="Price Alerts"
            desc="2 active supplier contracts need renegotiation"
            evidence="Tomato sauce +14% · ConAgra renewal May 12 · Canola oil +8%"
            actions={rfqSent
              ? <span className="font-body text-ok text-label flex items-center gap-1"><Check size={10} strokeWidth={2} /> RFQ sent</span>
              : <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request alternatives</Btn>
            }
          />
        </div>

        <div style={{ height: 1, background: SC.border }} />

        {/* ── Supplier standings ── */}
        <div style={{ padding: '18px 24px 24px' }}>
          <div className="font-body text-micro text-muted mb-3">
            Supplier standings · {sortedSuppliers.length} active
          </div>
          <div style={{ border: `1px solid ${SC.border}`, overflow: 'hidden' }}>
            {sortedSuppliers.map((s, i) => (
              <SupplierRow
                key={s.name}
                s={s}
                audit={supplierAudits[s.name]}
                isDanger={s.tierTone === 'danger'}
                certGap={certGapBySupplier[s.name]}
                index={i}
                total={sortedSuppliers.length}
              />
            ))}
          </div>
        </div>

      </div>

      </div>
    </div>
    </>
  )
}
