import { useState } from 'react'
import { Check, X, AlertTriangle, Clock, ArrowRight, History, AlertCircle, Eye, Wheat, Soup, Milk, Beef, Droplets, Truck, ShieldCheck, ClipboardCheck } from 'lucide-react'
import NetworkView from './NetworkView'


import { useNavigate, Link } from 'react-router-dom'
import { supplierData, supplierAudits, empResultsHistory } from '../data'
import { useAppState } from '../context/AppState'
import { StatusPill, SectionHeader, Btn, Layout, ActionBanner, Spinner, AnimatedCheck, MetadataRow, ExpandableMetadata, ActionCard, SlidePanel, Tabs } from '../components/UI'
import StatBar from '../components/StatBar.jsx'

// ── CoaPanel ──────────────────────────────────────────────────────────────────

const LAB_RESULTS_PASS = [
  { label: 'Microbial count', value: '< 100 CFU/g' },
  { label: 'pH level',        value: '4.2'          },
  { label: 'Moisture',        value: '12.4%'        },
  { label: 'Certification',   value: 'SQF Level 2'  },
]

const LAB_RESULTS_PENDING = [
  'Microbial count',
  'pH level',
  'Moisture %',
  'Test certification',
]

function CoaPanel({ lot, onClose }) {
  if (!lot) return null
  const coaPass   = lot.coaTone === 'ok'
  const shelfPct  = Math.min(100, Math.round((lot.shelf / 45) * 100))
  const shelfColor = lot.shelfTone === 'ok' ? 'bg-ok' : lot.shelfTone === 'warn' ? 'bg-warn' : 'bg-danger'
  const shelfText  = lot.shelfTone === 'ok' ? 'text-ok' : lot.shelfTone === 'warn' ? 'text-warn' : 'text-danger'
  const supplierName = lot.supplier.split(' · ')[0]
  const lotCode      = lot.supplier.split(' · ')[1] || lot.delivery

  return (
    <SlidePanel
      title={lot.ing}
      subtitle={supplierName}
      onClose={onClose}
      footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}
    >
      {/* ── COA status hero ─────────────────────────────────────────── */}
      <div className={`px-5 py-5 ${coaPass ? 'bg-ok/[0.035]' : 'bg-danger/[0.035]'}`}>
        <div className={`font-body text-label mb-2 ${coaPass ? 'text-ok' : 'text-danger'}`}>
          Certificate of Analysis
        </div>
        <div className={`font-display font-bold text-metric leading-none mb-1.5 ${coaPass ? 'text-ok' : 'text-danger'}`}>
          {coaPass ? 'Verified' : 'Pending receipt'}
        </div>
        <div className="font-body text-muted text-label">
          {coaPass
            ? 'Validated Apr 12, 2026 · All parameters within specification'
            : `Not received · Hold active until COA confirmed by ${supplierName}`}
        </div>
      </div>

      {/* ── Lot identity ─────────────────────────────────────────────── */}
      <div>
        <div className="font-body text-muted text-label mb-3">Lot details</div>
        <div className="space-y-3">
          {[
            { label: 'Ingredient',  value: lot.ing               },
            { label: 'Supplier',    value: supplierName           },
            { label: 'Lot',         value: lotCode                },
            { label: 'PO date',     value: lot.po                 },
            { label: 'Received',    value: lot.deliveryTime       },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between border-b border-rule2 pb-2">
              <span className="font-body text-muted text-label">{label}</span>
              <span className="font-body font-medium text-ink text-body">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shelf life bar ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-body text-muted text-label">Shelf life</span>
          <span className={`display-num text-head font-bold leading-none ${shelfText}`}>{lot.shelf}<span className="font-body text-label font-normal text-muted ml-1">days</span></span>
        </div>
        <div className="h-2 bg-rule2 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full ${shelfColor} transition-[width]`} style={{ width: `${shelfPct}%` }} />
        </div>
        <div className="font-body text-muted text-label">{lot.shelf} of 45 days remaining · standard shelf life</div>
      </div>

      {/* ── Lab results ──────────────────────────────────────────────── */}
      <div>
        <div className="font-body text-muted text-label mb-3">
          Lab results{coaPass ? ' · Apr 12, 2026' : ' · Pending'}
        </div>
        {coaPass ? (
          <div className="grid grid-cols-2 gap-px bg-rule2">
            {LAB_RESULTS_PASS.map(r => (
              <div key={r.label} className="bg-stone px-4 py-3.5">
                <div className="font-body text-muted text-label mb-1.5">{r.label}</div>
                <div className="flex items-center justify-between">
                  <span className="font-body font-medium text-ink text-base">{r.value}</span>
                  <Check size={12} strokeWidth={2.5} className="text-ok" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-rule2">
            {LAB_RESULTS_PENDING.map(label => (
              <div key={label} className="bg-stone px-4 py-3.5">
                <div className="font-body text-muted text-label mb-1.5">{label}</div>
                <div className="font-body text-warn text-label font-medium">Not tested</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlidePanel>
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
  const c = intel.tone === 'danger' ? 'text-danger' : intel.tone === 'warn' ? 'text-warn' : 'text-muted'
  return (
    <div className={`font-body text-label mt-0.5 ${c}`}>
      {intel.percentile}th pct. across {intel.plants} plants{intel.note ? ` · ${intel.note}` : ''}
    </div>
  )
}

// ── Ingredient icons — lucide.dev ─────────────────────────────────────────────

const FOOD_ICONS = {
  'Wheat flour':  Wheat,
  'Tomato sauce': Soup,
  'Mozzarella':   Milk,
  'Pepperoni':    Beef,
  'Canola oil':   Droplets,
}

// ── AlertChip (strip at top of content) ──────────────────────────────────────

function AlertChip({ count, tone, label }) {
  const cls = {
    danger: 'border-danger/30 text-danger bg-danger/5',
    warn:   'text-warn bg-warn/5',
    muted:  'border-rule2 text-muted bg-stone2',
  }[tone]
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 border font-body text-label flex-shrink-0 ${cls}`}>
      <span className="font-medium">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SupplierIQ() {
  const d = supplierData
  const { coaRequested, setCoaRequested, rfqSent, setRfqSent, readinessResolved, resolvedConflicts, closedCases } = useAppState()
  const [activeTab, setActiveTab] = useState('suppliers')
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

  // ── Right rail ────────────────────────────────────────────────────────────
  const side = (
    <>
      {/* Open gaps — severity-weighted */}
      <div className="border-b border-rule2">
        <div className="px-5 py-3 border-b border-rule2 flex items-baseline justify-between">
          <span className="font-display font-semibold text-ink text-base">Open gaps</span>
          <span className="font-body text-muted text-label">3 active</span>
        </div>
        {d.gaps.map((g, i) => {
          const isBlock = g.tone === 'block'
          const isWarn  = g.tone === 'warn'
          return (
            <div key={i} className={`border-b border-rule2 last:border-b-0 ${
              isBlock ? 'bg-danger/[0.035]' : ''
            } ${isBlock ? 'px-4 py-4' : 'px-4 py-3'}`}>
              {/* Badge row */}
              <div className="mb-2">
                <span className={`font-body font-semibold text-label inline-flex items-center gap-1.5 px-2 py-0.5 ${
                  isBlock ? 'bg-danger/15 text-danger' : isWarn ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'
                }`}>
                  {isBlock && <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />}
                  {g.badge}
                </span>
              </div>
              {/* Title */}
              <div className={`font-display font-semibold leading-tight ${
                isBlock ? 'text-base text-danger' : 'text-body text-ink'
              }`}>{g.title}</div>
              {/* Sub */}
              <div className="font-body text-muted text-label mt-1">{g.sub}</div>
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <>
    <CoaPanel lot={coaViewLot} onClose={() => setCoaViewLot(null)} />
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      <Tabs
        tabs={[{ id: 'suppliers', label: 'Suppliers' }, { id: 'network', label: 'Network' }]}
        active={activeTab}
        onChange={setActiveTab}
        className="flex-shrink-0 bg-stone2"
      />

      {activeTab === 'network' && <NetworkView />}
      {activeTab === 'suppliers' && <>

      <StatBar cells={d.stats.map(s => ({
        label: s.label, value: s.value, sub: s.sub, pct: s.fill,
        type: s.tone === 'danger' ? 'sa' : s.tone === 'warn' ? 'sw' : 'so',
      }))} />

      {/* Alert strip — populated with active alerts */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">
        {blockingLots.length > 1 && (
          <AlertChip count={blockingLots.length - 1} tone="danger" label={(blockingLots.length - 1) === 1 ? 'blocking' : 'blocking'} />
        )}
        {monitoringLots.length > 1 && (
          <AlertChip count={monitoringLots.length - 1} tone="warn" label={(monitoringLots.length - 1) === 1 ? 'expiring' : 'expiring'} />
        )}
      </div>

      <Layout side={side}>

        {/* ── Resolve now ── */}
        {resolveCount > 0 && (
          <>
            <SectionHeader
              tone="critical"
              label="Resolve now"
              sub={`${resolveCount} item${resolveCount > 1 ? 's' : ''} blocking production`}
            />

            {blockingLots.map((lot, i) => {
              return (
                <ActionCard
                  key={i}
                  tone="danger"
                  icon={FOOD_ICONS[lot.ing]}
                  title={`${lot.ing} — COA Missing`}
                  subtitle={`Production start held · ${lot.supplier} · Lot ${lot.delivery}`}
                  metadata={[
                    `${lot.shelf}d shelf remaining`,
                    `Received ${lot.deliveryTime}`,
                    lot.supply
                  ]}
                  status={
                    coaRequested ? (
                      <StatusPill status="complete" tone="ok" />
                    ) : null
                  }
                  actions={
                    <>
                      {coaRequested ? (
                        <span className="font-body text-ok text-label flex items-center gap-1"><Check size={11} strokeWidth={2} /> COA request sent</span>
                      ) : (
                        <>
                          <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                          <Btn variant="secondary" onClick={() => setCoaViewLot(lot)}>View specs</Btn>
                          <Link to="/network" className="font-body text-ochre text-label flex items-center gap-1 hover:text-ink transition-colors self-center">
                            <ArrowRight size={9} />Network impact
                          </Link>
                        </>
                      )}
                    </>
                  }
                >
                  {!namingResolved && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 bg-danger/5 border border-danger/20">
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
                </ActionCard>
              )
            })}

            {coaRequested && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body text-ok text-label">
                <Check size={12} strokeWidth={2} className="flex-shrink-0" />
                COA request sent to ConAgra · Expected response within 2 hours · Hold maintained until received
              </div>
            )}

            {auditActionSuppliers.map(s => (
              <ActionCard
                key={s.name}
                tone="warn"
                icon={ClipboardCheck}
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
            <SectionHeader
              tone="warn"
              label="Monitoring"
              sub={`${monitoringLots.length} at risk · ${d.stats[5]?.value} alerts`}
            />

            {monitoringLots.map((lot, i) => {
              return (
                <ActionCard
                  key={i}
                  tone={lot.shelfTone === 'danger' ? 'danger' : 'warn'}
                  icon={FOOD_ICONS[lot.ing] || Droplets}
                  title={`${lot.ing} — ${lot.shelfTone === 'danger' ? 'Expiring soon' : 'Shelf life alert'}`}
                  subtitle={`${lot.supplier} · Lot ${lot.delivery}`}
                  metadata={[
                    `${lot.shelf}d shelf remaining`,
                    `Arrived ${lot.deliveryTime}`,
                    lot.coa
                  ]}
                  status={<StatusPill status={lot.coaTone === 'ok' ? 'complete' : 'pending'} tone={lot.coaTone === 'ok' ? 'ok' : 'warn'} />}
                  actions={
                    <>
                      <button type="button" onClick={() => setCoaViewLot(lot)}
                        className="font-body font-medium text-label px-3 py-2 min-h-[36px] flex items-center gap-2 bg-stone2 text-muted hover:border-muted hover:bg-stone3 transition-colors">
                        <Eye size={10} /> View COA
                      </button>
                    </>
                  }
                >
                  {lot.useFirst && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-warn/5 border border-warn/20">
                      <AlertCircle size={11} strokeWidth={2} className="text-warn flex-shrink-0" />
                      <span className="font-body text-warn text-label">Use-first priority — prioritize in stock rotation</span>
                    </div>
                  )}
                </ActionCard>
              )
            })}

            {/* ConAgra reliability — network signal, not lot-tracking data */}
            <ActionCard
              tone="warn"
              icon={AlertTriangle}
              title="ConAgra reliability — 22nd percentile"
              subtitle="Network signal · 3 non-conformances in last 30 days across 14 plants"
              metadata={['High confidence', 'Network intelligence · 14 plants', 'Pattern: delivery delays → scrap spikes']}
              status={null}
              actions={
                <Link to="/network" className="font-body text-ochre text-label flex items-center gap-1 hover:text-ink transition-colors self-center">
                  <ArrowRight size={9} />View in Network
                </Link>
              }
            />

            {/* Price alerts */}
            <ActionCard
              tone="warn"
              icon={Truck}
              title="Price Alerts"
              subtitle="2 active supplier contracts need renegotiation"
              metadata={[
                'Tomato sauce +14%',
                'ConAgra renewal May 12',
                'Canola oil +8%'
              ]}
              status={rfqSent ? <StatusPill status="complete" tone="ok" /> : null}
              actions={
                rfqSent
                  ? <span className="font-body text-ok text-label flex items-center gap-1"><Check size={10} strokeWidth={2} /> RFQ sent</span>
                  : <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request alternatives</Btn>
              }
            />
          </>
        )}

        {/* ── Supplier standings ── */}
        <div className="border-b border-rule2">
          <div className="flex items-center justify-between px-4 py-2.5 bg-stone2 border-b border-rule2">
            <span className="font-body text-label text-muted">SUPPLIER STANDINGS</span>
            <span className="font-body text-label text-muted">5 active · by score</span>
          </div>

          {sortedSuppliers.map((s, i) => {
            const audit = supplierAudits[s.name]
            const intel = networkIntel[s.name]
            const isDanger = s.tierTone === 'danger'
            const isWarn   = s.tierTone === 'int'
            const scoreColor = s.score >= 90 ? 'var(--color-ok)' : s.score >= 80 ? 'var(--color-warn)' : 'var(--color-danger)'
            const scoreTextCls = s.score >= 90 ? 'text-ok' : s.score >= 80 ? 'text-warn' : 'text-danger'

            return (
              <div key={s.name} className={`border-b border-rule2 last:border-b-0 border-l-[3px] ${
                isDanger ? 'border-l-danger bg-danger/[0.025]' : 'border-l-transparent'
              }`}>
                <div className="px-4 pt-3.5 pb-3">
                  {/* Name row */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`font-display font-semibold text-base leading-none ${isDanger ? 'text-danger' : 'text-ink'}`}>{s.name}</span>
                    <span className={`font-body text-label px-1.5 py-0.5 leading-none ${
                      s.tierTone === 'ok'     ? 'bg-ok/10 text-ok'
                      : isDanger             ? 'bg-danger/[0.1] text-danger'
                      : 'bg-warn/10 text-warn'
                    }`}>{s.tier}</span>
                    <div className="flex-1" />
                    {audit?.needsAction
                      ? <Btn variant="secondary">Schedule</Btn>
                      : <button type="button" className="font-body text-muted text-label hover:text-ink transition-colors px-2 py-1 flex items-center gap-1">
                        <History size={11} /><span className="sr-only">History</span>
                      </button>
                    }
                  </div>

                  {/* Score + wide bar row */}
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`font-display font-bold text-subhead leading-none tabular-nums w-9 flex-shrink-0 ${scoreTextCls}`}>{s.score}</span>
                    <div className="flex-1 h-[5px] bg-rule2">
                      <div className="h-full transition-[width] duration-500 ease-enter" style={{ width: `${s.score}%`, background: scoreColor }} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      <span className={`font-body font-medium text-label ${
                        audit?.result === 'Approved'    ? 'text-ok'
                        : audit?.result === 'Conditional' ? 'text-warn'
                        : 'text-danger'
                      }`}>{audit?.result}</span>
                      {audit?.lastAudit && <span className="font-body text-muted text-label">{audit.lastAudit}</span>}
                    </div>
                  </div>

                  {/* Audit reason or network intel */}
                  {(audit?.reason || (intel && intel.note)) && (
                    <div className="font-body text-label mt-1">
                      {audit?.reason
                        ? <span className="text-warn">{audit.reason.split(' · ')[0]}</span>
                        : intel?.note && <span className={intel.tone === 'danger' ? 'text-danger' : 'text-muted'}>{intel.note}</span>
                      }
                      {intel && !audit?.reason && (
                        <span className="text-muted"> · {intel.percentile}th pct. · {intel.plants} plants</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </Layout>
      </>}
    </div>
    </>
  )
}
