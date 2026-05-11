import { useState, useRef } from 'react'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { Check, X, AlertTriangle, Clock, ArrowRight, Wheat, Soup, Milk, Beef, Droplets, History, AlertCircle, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supplierData, supplierAudits, empResultsHistory } from '../data'
import { useAppState } from '../context/AppState'
import { Urg, StatCell, SP, SecHd, Btn, Chip, Layout, ActionBanner, ScoreRing, Spinner, AnimatedCheck, MetadataRow, ExpandableMetadata, ActionCard, StatusIndicator } from '../components/UI'

// ── CoaPanel ──────────────────────────────────────────────────────────────────

function CoaPanel({ lot, onClose }) {
  const panelRef = useRef(null)
  const { exiting, exit } = useExitAnimation(200)
  useFocusTrap(panelRef, !!lot)
  if (!lot) return null
  const handleClose = () => exit(onClose)
  const coaPass = lot.coaTone === 'ok'
  return (
    <>
      <div className="fixed inset-0 bg-ink/20 z-40" onClick={handleClose} />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-label="Certificate of Analysis" className={`fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-stone border-l border-rule2 z-50 flex flex-col ${exiting ? 'slide-right-out' : 'slide-right'}`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
          <div>
            <div className="font-body text-ghost text-[10px] mb-1">Certificate of Analysis</div>
            <div className="font-display font-bold text-ink text-base">{lot.ing}</div>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close COA panel" className="p-1 text-ghost hover:text-ink transition-colors duration-100 ease-standard cursor-pointer">
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Test metadata */}
          <div className="mb-4">
            <div className="font-body font-medium text-ink text-[11px] mb-2 uppercase tracking-wider">Test Results</div>
            {[
              { l: 'Supplier · Lot', v: lot.supplier, tone: 'muted' },
              { l: 'PO date',        v: lot.po, tone: 'muted' },
              { l: 'COA status',     v: lot.coa, tone: coaPass ? 'ok' : 'danger' },
              { l: 'Shelf life',     v: `${lot.shelf} days remaining`, tone: 'muted' },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-rule2 last:border-0">
                <span className="font-body text-ghost text-[10px]">{r.l}</span>
                <span className={`font-body font-medium text-[11px] ${r.tone === 'ok' ? 'text-ok' : r.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{r.v}</span>
              </div>
            ))}
          </div>

          {/* Lab results */}
          <div>
            <div className="font-body font-medium text-ink text-[11px] mb-2 uppercase tracking-wider">Lab Results</div>
            <div className="space-y-2">
              <div className="flex items-start justify-between p-2 bg-stone2 border border-rule2">
                <div>
                  <div className="font-body font-medium text-ink text-[10px]">Test date</div>
                  <div className="font-body text-ghost text-[9px] mt-1">{coaPass ? 'Apr 12, 2026' : 'Pending receipt'}</div>
                </div>
                <StatusIndicator status={coaPass ? 'complete' : 'pending'} tone={coaPass ? 'ok' : 'warn'} />
              </div>
              <div className="flex items-start justify-between p-2 bg-stone2 border border-rule2">
                <div>
                  <div className="font-body font-medium text-ink text-[10px]">Microbial count</div>
                  <div className={`font-body text-[10px] mt-1 ${coaPass ? 'text-ok' : 'text-muted'}`}>{coaPass ? '< 100 CFU/g ✓' : 'Not tested'}</div>
                </div>
                {coaPass && <Check size={11} strokeWidth={2} className="text-ok mt-1" />}
              </div>
              <div className="flex items-start justify-between p-2 bg-stone2 border border-rule2">
                <div>
                  <div className="font-body font-medium text-ink text-[10px]">pH</div>
                  <div className={`font-body text-[10px] mt-1 ${coaPass ? 'text-ok' : 'text-muted'}`}>{coaPass ? '4.2 ✓' : 'Not tested'}</div>
                </div>
                {coaPass && <Check size={11} strokeWidth={2} className="text-ok mt-1" />}
              </div>
              <div className="flex items-start justify-between p-2 bg-stone2 border border-rule2">
                <div>
                  <div className="font-body font-medium text-ink text-[10px]">Moisture %</div>
                  <div className={`font-body text-[10px] mt-1 ${coaPass ? 'text-ok' : 'text-muted'}`}>{coaPass ? '12.4% ✓' : 'Not tested'}</div>
                </div>
                {coaPass && <Check size={11} strokeWidth={2} className="text-ok mt-1" />}
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-rule2 bg-stone2 flex-shrink-0">
          <Btn variant="secondary" onClick={handleClose}>Close</Btn>
        </div>
      </aside>
    </>
  )
}

// ── NetworkBadge ──────────────────────────────────────────────────────────────

const networkIntel = {
  'ConAgra Foods': { percentile: 22, plants: 14, note: '3 non-conformances in last 30d', tone: 'danger' },
  'Sysco':         { percentile: 67, plants: 14, note: null, tone: 'ok' },
  'ADM Foods':     { percentile: 74, plants: 9,  note: null, tone: 'ok' },
  'Cargill':       { percentile: 81, plants: 11, note: null, tone: 'ok' },
  'Prairie Farms': { percentile: 55, plants: 6,  note: null, tone: 'warn' },
}

function NetworkBadge({ intel }) {
  const c = intel.tone === 'danger' ? 'text-danger' : intel.tone === 'warn' ? 'text-warn' : 'text-ghost'
  return (
    <div className={`font-body text-[10px] mt-0.5 ${c}`}>
      {intel.percentile}th pct. across {intel.plants} plants{intel.note ? ` · ${intel.note}` : ''}
    </div>
  )
}

// ── Food icons ────────────────────────────────────────────────────────────────

const FOOD_ICONS = {
  'Wheat flour': Wheat,
  'Tomato sauce': Soup,
  'Mozzarella':  Milk,
  'Pepperoni':   Beef,
  'Canola oil':  Droplets,
}

// ── AlertChip (strip at top of content) ──────────────────────────────────────

function AlertChip({ count, tone, label }) {
  const cls = {
    danger: 'border-danger/30 text-danger bg-danger/5',
    warn:   'border-warn/30 text-warn bg-warn/5',
    muted:  'border-rule2 text-ghost bg-stone2',
  }[tone]
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 border font-body text-[10px] flex-shrink-0 ${cls}`}>
      <span className="font-medium">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ tone, label, sub }) {
  const cls = {
    danger: 'bg-danger/[0.04] border-b-2 border-b-danger/20 text-danger',
    warn:   'bg-warn/[0.04] border-b border-rule2 text-warn',
    muted:  'bg-stone2 border-b border-rule2 text-muted',
  }[tone]
  return (
    <div className={`flex items-baseline gap-2 px-4 py-2 ${cls}`}>
      <span className="font-body font-medium text-[10px] uppercase tracking-widest">{label}</span>
      {sub && <span className="font-body text-[10px] opacity-60">{sub}</span>}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SupplierIQ() {
  const d = supplierData
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent, readinessResolved } = useAppState()
  const [exportState, setExportState] = useState('idle')
  const [coaViewLot, setCoaViewLot] = useState(null)
  const navigate = useNavigate()
  const namingResolved = readinessResolved?.['conflict-0']

  const handleExport = () => {
    setExportState('loading')
    setTimeout(() => setExportState('done'), 1500)
  }

  const blockingLots = d.lots.filter(l => l.urgent)
  const monitoringLots = d.lots.filter(l => !l.urgent && l.shelfTone !== 'ok')
  const auditActionSuppliers = d.suppliers.filter(s => supplierAudits[s.name]?.needsAction)
  const sortedSuppliers = [...d.suppliers].sort((a, b) => a.score - b.score)

  const resolveCount = blockingLots.length + auditActionSuppliers.length

  // ── Right rail (unchanged) ────────────────────────────────────────────────
  const side = (
    <>
      <SP title="FDA inspection" sub="FSMA 204">
        <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
          <span className="display-num text-4xl text-warn">18</span>
          <span className="font-body text-ghost text-[11px]">days · Region 7 · Salina</span>
        </div>
        <div className="mx-4 mb-3 h-1 bg-rule2"><div className="h-full bg-warn" style={{ width: '62%' }} /></div>
        {d.fdaSteps.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-rule2 last:border-b-0">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              s.tone === 'ok' ? 'bg-ok/20' : s.tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
            }`}>
              {s.tone === 'ok'   && <Check size={10} strokeWidth={2} className="text-ok" />}
              {s.tone === 'gap'  && <X size={10} strokeWidth={2} className="text-danger" />}
              {s.tone === 'pend' && <div className="w-1.5 h-1.5 rounded-full bg-ghost" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body font-medium text-ink text-[11px]">{s.label}</div>
              <div className="font-body text-ghost text-[10px]">{s.sub}</div>
            </div>
            <span className={`font-body font-semibold text-[10px] flex-shrink-0 ${s.statusColor}`}>{s.status}</span>
          </div>
        ))}
      </SP>

      <SP title="Open gaps" sub="3 active">
        {d.gaps.map((g, i) => (
          <div key={i} className={`px-4 py-2.5 border-b border-rule2 last:border-b-0 border-l-2 ${
            g.tone === 'block' ? 'border-l-danger bg-danger/[0.02]' : g.tone === 'warn' ? 'border-l-warn' : 'border-l-ok'
          }`}>
            <div className="flex justify-between items-start">
              <div className="font-body font-medium text-ink text-[12px]">{g.title}</div>
              <span className={`font-body font-semibold text-[10px] ml-2 flex-shrink-0 ${g.badgeColor}`}>{g.badge}</span>
            </div>
            <div className="font-body text-ghost text-[10px] mt-0.5">{g.sub}</div>
          </div>
        ))}
      </SP>


    </>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <CoaPanel lot={coaViewLot} onClose={() => setCoaViewLot(null)} />

      <ActionBanner
        tone="warn"
        headline="1 COA missing — production start blocked"
        body="ConAgra Lot TS-8811 · FDA inspection in 18 days · 2 lots expiring in 14 days"
      >
        <Btn variant="secondary" onClick={handleExport} disabled={exportState === 'loading'}>
          {exportState === 'loading' ? <><Spinner label="Preparing export" /> Preparing…</> : exportState === 'done' ? <><AnimatedCheck size={11} color="currentColor" /> Exported</> : 'Export audit package'}
        </Btn>
      </ActionBanner>

      <div className="grid grid-cols-3 md:grid-cols-6 border-b border-rule2 bg-stone flex-shrink-0">
        {d.stats.map((s, i) => <StatCell key={i} {...s} />)}
      </div>

      {/* Alert strip — populated with active alerts */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
        {blockingLots.length > 0 && (
          <AlertChip count={blockingLots.length} tone="danger" label={blockingLots.length === 1 ? 'blocking' : 'blocking'} />
        )}
        {monitoringLots.length > 0 && (
          <AlertChip count={monitoringLots.length} tone="warn" label={monitoringLots.length === 1 ? 'expiring' : 'expiring'} />
        )}
        {namingResolved === false && (
          <AlertChip count={1} tone="danger" label="naming conflict" />
        )}
      </div>

      <Layout side={side}>

        {/* ── Resolve now ── */}
        {resolveCount > 0 && (
          <>
            <SectionLabel
              tone="danger"
              label="Resolve now"
              sub={`${resolveCount} item${resolveCount > 1 ? 's' : ''} blocking production`}
            />

            {blockingLots.map((lot, i) => {
              const Icon = FOOD_ICONS[lot.ing]
              return (
                <ActionCard
                  key={i}
                  tone="danger"
                  title={`${lot.ing} — COA Missing`}
                  subtitle={`Production start held · ${lot.supplier} · Lot ${lot.delivery}`}
                  metadata={[
                    `${lot.shelf}d shelf remaining`,
                    `Received ${lot.deliveryTime}`,
                    lot.supply
                  ]}
                  status={
                    coaRequested ? (
                      <StatusIndicator status="complete" tone="ok" />
                    ) : null
                  }
                  actions={
                    <>
                      {coaRequested ? (
                        <span className="font-body text-ok text-[10px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> COA request sent</span>
                      ) : (
                        <>
                          <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                          <Btn variant="secondary" onClick={() => setCoaViewLot(lot)}>View specs</Btn>
                        </>
                      )}
                    </>
                  }
                >
                  {!namingResolved && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 bg-danger/5 border border-danger/20 rounded-sm">
                      <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-body font-medium text-danger text-[10px]">FSMA 204 blocker</div>
                        <div className="font-body text-danger text-[9px] mt-0.5 opacity-80">Naming conflict at CTE 2 prevents traceability submission</div>
                        <button type="button"
                          onClick={() => navigate('/readiness', { state: { highlight: 'conflict-0' } })}
                          className="font-body text-danger text-[10px] hover:underline mt-1 flex items-center gap-0.5">
                          Fix in Data Readiness <ArrowRight size={9} />
                        </button>
                      </div>
                    </div>
                  )}
                </ActionCard>
              )
            })}

            {coaRequested && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body text-ok text-[11px]">
                <Check size={12} strokeWidth={2} className="flex-shrink-0" />
                COA request sent to ConAgra · Expected response within 2 hours · Hold maintained until received
              </div>
            )}

            {auditActionSuppliers.map(s => (
              <ActionCard
                key={s.name}
                tone="warn"
                title={`${s.name} — Conditional Audit Approval`}
                subtitle="Re-audit required before next purchase order"
                metadata={[
                  `Reason: ${supplierAudits[s.name]?.reason.split(' · ')[0]}`,
                  `Last audit: ${supplierAudits[s.name]?.lastAudit}`
                ]}
                actions={
                  <>
                    <Btn variant="primary">Schedule re-audit</Btn>
                    <Btn variant="secondary" icon={History}><span className="sr-only">View audit history</span></Btn>
                  </>
                }
              />
            ))}
          </>
        )}

        {/* ── Monitoring ── */}
        {monitoringLots.length > 0 && (
          <>
            <SectionLabel
              tone="warn"
              label="Monitoring"
              sub={`${monitoringLots.length} at risk · ${d.stats[5]?.value} alerts`}
            />

            {monitoringLots.map((lot, i) => {
              const Icon = FOOD_ICONS[lot.ing]
              return (
                <ActionCard
                  key={i}
                  tone={lot.shelfTone === 'danger' ? 'danger' : 'warn'}
                  title={`${lot.ing} — ${lot.shelfTone === 'danger' ? 'Expiring soon' : 'Shelf life alert'}`}
                  subtitle={`${lot.supplier} · Lot ${lot.delivery}`}
                  metadata={[
                    `${lot.shelf}d shelf remaining`,
                    `Arrived ${lot.deliveryTime}`,
                    lot.coa
                  ]}
                  status={<StatusIndicator status={lot.coaTone === 'ok' ? 'complete' : 'pending'} tone={lot.coaTone === 'ok' ? 'ok' : 'warn'} />}
                  actions={
                    <>
                      <button type="button" onClick={() => setCoaViewLot(lot)}
                        className="font-body font-medium text-[10px] px-3 py-2 min-h-[36px] flex items-center gap-2 border border-rule2 bg-stone2 text-muted hover:border-ghost hover:bg-stone3 transition-colors">
                        <Eye size={10} /> View COA
                      </button>
                    </>
                  }
                >
                  {lot.useFirst && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-warn/5 border border-warn/20 rounded-sm">
                      <AlertCircle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
                      <span className="font-body text-warn text-[10px]">Use-first priority — prioritize in stock rotation</span>
                    </div>
                  )}
                </ActionCard>
              )
            })}

            {/* Price alerts */}
            <ActionCard
              tone="warn"
              title="Price Alerts"
              subtitle="2 active supplier contracts need renegotiation"
              metadata={[
                'Tomato sauce +14%',
                'ConAgra renewal May 12',
                'Canola oil +8%'
              ]}
              status={rfqSent ? <StatusIndicator status="complete" tone="ok" /> : null}
              actions={
                rfqSent
                  ? <span className="font-body text-ok text-[10px] flex items-center gap-1"><Check size={10} strokeWidth={2} /> RFQ sent</span>
                  : <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request alternatives</Btn>
              }
            />
          </>
        )}

        {/* ── Supplier standings ── */}
        <SectionLabel tone="muted" label="Supplier standings" sub="5 active · sorted by score" />

        {sortedSuppliers.map(s => {
          const audit = supplierAudits[s.name]
          const intel = networkIntel[s.name]
          return (
            <div key={s.name} className={`border-b border-rule2 border-l-2 ${
              audit?.needsAction ? 'border-l-danger bg-danger/[0.02]' : 'border-l-transparent bg-stone'
            }`}>
              <div className="px-4 py-3 flex items-center gap-4">
                <ScoreRing pct={s.score} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
                  {audit?.reason && <div className="font-body text-warn text-[10px] mt-0.5">{audit.reason}</div>}
                  {intel && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="font-body text-ghost text-[9px]">{intel.percentile}th percentile</div>
                      <div className="w-1 h-1 rounded-full bg-rule2" />
                      <div className="font-body text-ghost text-[9px]">{intel.plants} plants</div>
                      {intel.note && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-rule2" />
                          <div className={`font-body text-[9px] ${intel.tone === 'danger' ? 'text-danger' : 'text-ghost'}`}>{intel.note}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <span className={`font-body font-medium text-[10px] px-2 py-1 rounded-sm flex-shrink-0 ${
                  s.tierTone === 'ok' ? 'bg-ok/10 text-ok'
                  : s.tierTone === 'danger' ? 'bg-danger/10 text-danger'
                  : 'bg-int/10 text-int'
                }`}>{s.tier}</span>
                <div className="text-right flex-shrink-0 min-w-fit">
                  <div className="font-body text-muted text-[9px]">{audit?.lastAudit}</div>
                  <div className={`font-body font-medium text-[11px] ${
                    audit?.result === 'Approved' ? 'text-ok'
                    : audit?.result === 'Conditional' ? 'text-warn'
                    : 'text-danger'
                  }`}>{audit?.result}</div>
                </div>
                {audit?.needsAction
                  ? <Btn variant="secondary">Schedule</Btn>
                  : <button type="button" className="font-body text-ghost text-[10px] hover:text-ink transition-colors flex items-center gap-1 px-2 py-2">
                    <History size={11} /><span className="sr-only">Audit history</span>
                  </button>
                }
              </div>
            </div>
          )
        })}

      </Layout>
    </div>
  )
}
