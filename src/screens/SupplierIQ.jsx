import { useState, useRef } from 'react'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { Check, X, AlertTriangle, Clock, ArrowRight, Wheat, Soup, Milk, Beef, Droplets, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supplierData, supplierAudits, empResultsHistory } from '../data'
import { useAppState } from '../context/AppState'
import { Urg, StatCell, SP, SecHd, Btn, Chip, Layout, ActionBanner, ScoreRing, Spinner, AnimatedCheck } from '../components/UI'

// ── CoaPanel ──────────────────────────────────────────────────────────────────

function CoaPanel({ lot, onClose }) {
  const panelRef = useRef(null)
  const { exiting, exit } = useExitAnimation(200)
  useFocusTrap(panelRef, !!lot)
  if (!lot) return null
  const handleClose = () => exit(onClose)
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
          {[
            { l: 'Supplier · Lot', v: lot.supplier },
            { l: 'PO date',        v: lot.po },
            { l: 'COA status',     v: lot.coa },
            { l: 'Shelf life',     v: `${lot.shelf} days remaining` },
            { l: 'Test date',      v: lot.coaTone === 'ok' ? 'Apr 12, 2026' : 'Pending receipt' },
            { l: 'Microbial count',v: lot.coaTone === 'ok' ? 'Pass — < 100 CFU/g' : 'Not tested' },
            { l: 'pH',             v: lot.coaTone === 'ok' ? '4.2 ✓' : 'Not tested' },
            { l: 'Moisture %',     v: lot.coaTone === 'ok' ? '12.4% ✓' : 'Not tested' },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-2.5 border-b border-rule2 last:border-0">
              <span className="font-body text-ghost text-[11px]">{r.l}</span>
              <span className="font-body font-medium text-ink text-[12px]">{r.v}</span>
            </div>
          ))}
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

      {/* Alert strip */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-rule2 bg-stone2 flex-shrink-0">

      </div>

      <Layout side={side}>

        {/* ── Resolve now ── */}
        {resolveCount > 0 && (
          <>
            <SectionLabel
              tone="danger"
              label="Resolve now"
              sub={`${resolveCount} item${resolveCount > 1 ? 's' : ''} blocking or at risk`}
            />

            {blockingLots.map((lot, i) => {
              const Icon = FOOD_ICONS[lot.ing]
              return (
                <div key={i} className="relative p-4 border-b border-rule2 bg-danger/[0.025] overflow-hidden">
                  {coaRequested && <span key="coa-flash" className="flash-success" aria-hidden="true" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Chip tone="danger">COA Missing</Chip>
                        <span className="font-body text-ghost text-[10px]">{lot.supplier}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon size={13} strokeWidth={2} className="text-ink/40 flex-shrink-0" />}
                        <span className="font-body font-medium text-ink text-[15px]">{lot.ing}</span>
                      </div>
                      <div className="font-body text-muted text-[11px] mt-1 leading-relaxed">
                        {lot.delivery} · {lot.deliveryTime} · {lot.shelf} days shelf remaining · Production start held
                      </div>
                      {!namingResolved && (
                        <div className="flex items-center gap-1.5 mt-2 font-body text-danger text-[10px]">
                          <AlertTriangle size={10} strokeWidth={2} className="flex-shrink-0" />
                          FSMA 204 — naming conflict at CTE 2 blocks traceability submission
                          <button type="button"
                            onClick={() => navigate('/readiness', { state: { highlight: 'conflict-0' } })}
                            className="text-int hover:underline ml-0.5 flex items-center gap-0.5">
                            Fix <ArrowRight size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {coaRequested
                        ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Requested</span>
                        : <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
                      }
                    </div>
                  </div>
                </div>
              )
            })}

            {coaRequested && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body text-ok text-[11px]">
                <Check size={12} strokeWidth={2} className="flex-shrink-0" />
                COA request sent to ConAgra · Expected response within 2 hours · Hold maintained until received
              </div>
            )}

            {auditActionSuppliers.map(s => (
              <div key={s.name} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule2 border-l-2 border-l-warn">
                <div>
                  <div className="font-body font-medium text-ink text-[12px]">{s.name} — conditional audit approval</div>
                  <div className="font-body text-ghost text-[10px] mt-0.5">{supplierAudits[s.name]?.reason}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Btn variant="primary">Schedule re-audit</Btn>
                  <Btn variant="secondary" icon={History}><span className="sr-only">History</span></Btn>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Monitoring ── */}
        {monitoringLots.length > 0 && (
          <>
            <SectionLabel
              tone="warn"
              label="Monitoring"
              sub={`${monitoringLots.length} expiring · 2 price alerts`}
            />

            {monitoringLots.map((lot, i) => {
              const Icon = FOOD_ICONS[lot.ing]
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-rule2">
                  <div className={`w-0.5 self-stretch flex-shrink-0 ${lot.shelfTone === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
                  {Icon && <Icon size={12} strokeWidth={2} className="text-ghost flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-[12px]">{lot.ing}</div>
                    <div className="font-body text-ghost text-[10px] mt-0.5">
                      {lot.supplier} · {lot.delivery} · {lot.deliveryTime}
                    </div>
                  </div>
                  <Chip tone={lot.coaTone === 'ok' ? 'ok' : lot.coaTone === 'danger' ? 'danger' : 'warn'}>{lot.coa}</Chip>
                  <Chip tone={lot.shelfTone}>{lot.shelf}d shelf</Chip>
                  {lot.useFirst && <span className="font-body text-warn text-[10px] flex-shrink-0">Use first</span>}
                  <button type="button" onClick={() => setCoaViewLot(lot)}
                    className="font-body text-muted text-[10px] hover:text-ink transition-colors flex items-center gap-1 flex-shrink-0">
                    <ArrowRight size={12} />View COA
                  </button>
                </div>
              )
            })}

            {/* Price alerts row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-rule2">
              <div className="w-0.5 self-stretch flex-shrink-0 bg-warn" />
              <div className="flex-1 min-w-0 ml-3">
                <div className="font-body font-medium text-ink text-[12px]">Price alerts</div>
                <div className="font-body text-ghost text-[10px] mt-0.5">
                  Tomato sauce +14% · ConAgra contract renewal May 12 · Canola oil +8%
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip tone="warn">2 active</Chip>
                {rfqSent
                  ? <span className="font-body text-ok text-[10px] flex items-center gap-1"><Check size={10} strokeWidth={2} /> RFQ sent</span>
                  : <Btn variant="secondary" onClick={() => setRfqSent(true)}>Request alternatives</Btn>
                }
              </div>
            </div>
          </>
        )}

        {/* ── Supplier standings ── */}
        <SectionLabel tone="muted" label="Supplier standings" sub="5 active · sorted by score" />

        {sortedSuppliers.map(s => {
          const audit = supplierAudits[s.name]
          return (
            <div key={s.name} className={`flex items-center gap-4 px-4 py-3 border-b border-rule2 border-l-2 ${
              audit?.needsAction ? 'border-l-danger bg-danger/[0.02]' : 'border-l-transparent'
            }`}>
              <ScoreRing pct={s.score} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
                {audit?.reason && <div className="font-body text-warn text-[10px] mt-0.5">{audit.reason}</div>}
                {networkIntel[s.name] && <NetworkBadge intel={networkIntel[s.name]} />}
              </div>
              <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
                s.tierTone === 'ok' ? 'bg-ok/10 text-ok'
                : s.tierTone === 'danger' ? 'bg-danger/10 text-danger'
                : 'bg-int/10 text-int'
              }`}>{s.tier}</span>
              <div className="text-right flex-shrink-0">
                <div className="font-body text-muted text-[10px]">{audit?.lastAudit}</div>
                <div className={`font-body font-medium text-[11px] ${
                  audit?.result === 'Approved' ? 'text-ok'
                  : audit?.result === 'Conditional' ? 'text-warn'
                  : 'text-danger'
                }`}>{audit?.result}</div>
              </div>
              {audit?.needsAction
                ? <Btn variant="secondary">Schedule re-audit</Btn>
                : <button type="button" className="font-body text-ghost text-[10px] hover:text-ink transition-colors flex items-center gap-1">
                  <History size={12} />History
                </button>
              }
            </div>
          )
        })}

      </Layout>
    </div>
  )
}
