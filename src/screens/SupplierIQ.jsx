import { useState } from 'react'
import { Check, X, AlertTriangle, Clock, ArrowRight, Wheat, Soup, Milk, Beef, Droplets } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supplierData, supplierAudits, empResultsHistory } from '../data'
import { useAppState } from '../context/AppState'
import { Urg, StatCell, SP, SecHd, Btn, Chip, Layout, ConsequenceNotice, ActionBanner } from '../components/UI'

function CoaPanel({ lot, onClose }) {
 if (!lot) return null
 return (
 <>
 <div className="fixed inset-0 bg-ink/20 z-40" onClick={onClose} />
 <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-stone border-l border-rule2 z-50 flex flex-col slide-right">
 <div className="flex items-start justify-between px-5 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
 <div>
 <div className="font-body text-ghost text-[10px] mb-1">Certificate of Analysis</div>
 <div className="font-display font-bold text-ink text-base">{lot.ing}</div>
 </div>
 <button type="button" onClick={onClose} aria-label="Close COA panel" className="p-1 text-ghost hover:text-ink transition-colors cursor-pointer">
 <X size={14} strokeWidth={2} aria-hidden="true" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-5">
 {[
 { l:'Supplier · Lot', v: lot.supplier },
 { l:'PO date', v: lot.po },
 { l:'COA status', v: lot.coa },
 { l:'Shelf life', v: `${lot.shelf} days remaining` },
 { l:'Test date', v: lot.coaTone === 'ok' ? 'Apr 12, 2026' : 'Pending receipt' },
 { l:'Microbial count', v: lot.coaTone === 'ok' ? 'Pass — < 100 CFU/g' : 'Not tested' },
 { l:'pH', v: lot.coaTone === 'ok' ? '4.2 ✓' : 'Not tested' },
 { l:'Moisture %', v: lot.coaTone === 'ok' ? '12.4% ✓' : 'Not tested' },
 ].map(r => (
 <div key={r.l} className="flex justify-between py-2.5 border-b border-rule2 last:border-0">
 <span className="font-body text-ghost text-[11px]">{r.l}</span>
 <span className="font-body font-medium text-ink text-[12px]">{r.v}</span>
 </div>
 ))}
 </div>
 <div className="px-5 py-3 border-t border-rule2 bg-stone2 flex-shrink-0">
 <Btn variant="secondary" onClick={onClose}>Close</Btn>
 </div>
 </aside>
 </>
 )
}

function ShelfPill({ days, tone, useFirst }) {
 const cls = tone === 'ok' ? 'text-ok bg-ok/10' : tone === 'danger' ? 'text-danger bg-danger/10' : 'text-warn bg-warn/10'
 const barColor = tone === 'ok' ? 'bg-ok' : tone === 'danger' ? 'bg-danger' : 'bg-warn'
 const pct = Math.min(100, (days / 45) * 100)
 return (
 <div>
 <span className={`inline-flex items-center gap-1 font-body font-medium text-[11px] px-2 py-0.5 ${cls}`}>
 <span className="w-1 h-1 rounded-full bg-current" />{days} days
 </span>
 <div className="h-px bg-rule2 mt-1 w-14"><div className={`h-full ${barColor}`} style={{ width: pct + '%' }} /></div>
 {useFirst && <div className="font-body text-warn text-[10px] mt-0.5">Use first</div>}
 </div>
 )
}

function TraceNode({ label, name, detail, tone, gapMsg, onResolve }) {
 return (
 <div className="flex items-start gap-3 py-3 border-b border-rule2 last:border-b-0">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
 tone === 'ok' ? 'bg-ok/20' : tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
 }`}>
 {tone === 'ok' && <Check size={12} strokeWidth={2} className="text-ok" />}
 {tone === 'gap' && <AlertTriangle size={12} strokeWidth={2} className="text-danger" />}
 {tone === 'pending' && <div className="w-2 h-2 rounded-full bg-ghost" />}
 </div>
 <div className="flex-1">
 <div className="font-body text-ghost text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
 <div className="font-body font-medium text-ink text-[12px]">{name}</div>
 <div className="font-body text-ghost text-[10px]">{detail}</div>
 {gapMsg && (
 <div className="font-body text-danger text-[10px] mt-1 flex items-start gap-1">
 <AlertTriangle size={11} strokeWidth={2} className="text-danger flex-shrink-0 mt-0.5" /><span>{gapMsg}</span>
 </div>
 )}
 {onResolve && <button type="button" onClick={onResolve} className="font-body text-int text-[10px] mt-1 hover:underline flex items-center gap-1">Go to Data Readiness <ArrowRight size={10} /></button>}
 </div>
 </div>
 )
}

function NetworkBadge({ intel }) {
 const c = intel.tone === 'danger' ? 'text-danger' : intel.tone === 'warn' ? 'text-warn' : 'text-ghost'
 return (
 <div className={`font-body text-[10px] mt-0.5 ${c}`}>
 {intel.percentile}th pct. across {intel.plants} plants{intel.note ? ` · ${intel.note}` : ''}
 </div>
 )
}

const networkIntel = {
 'ConAgra Foods': { percentile: 22, plants: 14, note: '3 non-conformances in last 30d', tone: 'danger' },
 'Sysco': { percentile: 67, plants: 14, note: null, tone: 'ok' },
 'ADM Foods': { percentile: 74, plants: 9, note: null, tone: 'ok' },
 'Cargill': { percentile: 81, plants: 11, note: null, tone: 'ok' },
 'Prairie Farms': { percentile: 55, plants: 6, note: null, tone: 'warn' },
}


const FOOD_ICONS = {
 'Wheat flour': Wheat,
 'Tomato sauce': Soup,
 'Mozzarella': Milk,
 'Pepperoni': Beef,
 'Canola oil': Droplets,
}

export default function SupplierIQ() {
 const d = supplierData
 const { coaRequested, setCoaRequested, rfqSent, setRfqSent, readinessResolved } = useAppState()
 const [activeView, setActiveView] = useState('suppliers')
 const [exportState, setExportState] = useState('idle')
 const [coaViewLot, setCoaViewLot] = useState(null)
 const [rfqOpen, setRfqOpen] = useState(false)
 const navigate = useNavigate()
 const namingResolved = readinessResolved?.['conflict-0']

 const handleExport = () => {
 setExportState('loading')
 setTimeout(() => setExportState('done'), 1500)
 }

 const side = (
 <>
  {/* FDA audit */}
 <SP title="FDA inspection" sub="FSMA 204">
 <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
 <span className="display-num text-4xl text-warn">18</span>
 <span className="font-body text-ghost text-[11px]">days · Region 7 · Salina</span>
 </div>
 <div className="mx-4 mb-3 h-1 bg-rule2"><div className="h-full bg-warn" style={{ width:'62%' }} /></div>
 {d.fdaSteps.map((s, i) => (
 <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-rule2 last:border-b-0">
 <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
 s.tone === 'ok' ? 'bg-ok/20' : s.tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
 }`}>
 {s.tone === 'ok' && <Check size={10} strokeWidth={2} className="text-ok" />}
 {s.tone === 'gap' && <X size={10} strokeWidth={2} className="text-danger" />}
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

 {/* Open gaps */}
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

 {/* EMP results trending */}
 <SP title="EMP swab results" sub="Zone 1 · 5 swabs trailing">
 <div className="px-4 pt-2 pb-1 flex items-end gap-1" style={{ height: 56 }}>
 {empResultsHistory.slice().reverse().map((r, i) => (
 <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
 <div className={`w-full ${r.result === 'positive' ? 'bg-danger' : 'bg-ok/60'}`}
 style={{ height: r.result === 'positive' ? 32 : 16 }} />
 </div>
 ))}
 </div>
 {empResultsHistory.map((r, i) => (
 <div key={i} className={`flex items-center gap-2 px-4 py-2 border-b border-rule2 last:border-b-0 ${r.result === 'positive' ? 'bg-danger/[0.03]' : ''}`}>
 <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.result === 'positive' ? 'bg-danger' : 'bg-ok'}`} />
 <div className="flex-1">
 <span className="font-body font-medium text-ink text-[11px]">{r.date}</span>
 <span className="font-body text-ghost text-[10px] ml-2">{r.zone} · {r.location}</span>
 </div>
 <span className={`font-body font-medium text-[10px] px-1.5 py-px ${r.result === 'positive' ? 'bg-danger/10 text-danger' : 'bg-ok/10 text-ok'}`}>
 {r.result === 'positive' ? `Pos ${r.cfu} CFU` : 'Neg'}
 </span>
 {r.capaId && <span className="font-body text-ghost text-[10px]">{r.capaId}</span>}
 </div>
 ))}
 </SP>
 </>
 )

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <CoaPanel lot={coaViewLot} onClose={() => setCoaViewLot(null)} />
 <ActionBanner
 tone="warn"
 headline="1 COA missing — production start blocked"
 body="ConAgra Lot TS-8811 · FDA inspection in 18 days · 2 lots expiring in 14 days"
 >
 <Btn variant="secondary" onClick={handleExport} disabled={exportState === 'loading'}>
 {exportState === 'loading' ? 'Preparing…' : exportState === 'done' ? 'Exported ✓' : 'Export audit package'}
 </Btn>
 </ActionBanner>

 <div className="grid grid-cols-6 border-b border-rule2 bg-stone flex-shrink-0">
 {d.stats.map((s, i) => <StatCell key={i} {...s} />)}
 </div>

 {/* View tabs */}
 <div className="flex border-b border-rule2 bg-stone2 px-4 py-2 gap-5 flex-shrink-0">
 {[['suppliers','Supplier scorecard'],['lots','Ingredient lots']].map(([key, label]) => (
 <button key={key} onClick={() => setActiveView(key)}
 className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors ${activeView === key ? 'border-b-ochre' : 'border-b-transparent'}`}>
 <span className={`font-body text-[11px] transition-colors ${activeView === key ? 'text-ink' : 'text-muted'}`}>{label}</span>
 </button>
 ))}
 </div>

 <Layout side={side}>
 {activeView === 'suppliers' && (
 <>
 <SecHd tag="Supplier scorecard" title="Performance ranking — on-time, compliance, audit status" badge={<Urg level="danger">ConAgra — action required</Urg>} />
 {d.suppliers.map((s, i) => {
 const audit = supplierAudits[s.name]
 return (
 <div key={i} className={`border-b border-rule2 ${audit?.needsAction ? 'bg-danger/[0.02] border-l-2 border-l-danger' : 'border-l-2 border-l-transparent'}`}>
 <div className="grid px-4 py-3" style={{ gridTemplateColumns:'1fr 80px 100px 90px 100px' }}>
 <div>
 <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
 {audit?.reason && <div className="font-body text-warn text-[10px] mt-0.5">{audit.reason}</div>}
 {networkIntel[s.name] && (
 <NetworkBadge intel={networkIntel[s.name]} />
 )}
 </div>
 <div className="flex flex-col justify-center">
 <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 self-start ${
 s.tierTone === 'ok' ? 'bg-ok/10 text-ok' : s.tierTone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-int/10 text-int'
 }`}>{s.tier}</span>
 </div>
 <div className="flex flex-col justify-center">
 <div className="font-body text-ghost text-[10px]">Last audit</div>
 <div className="font-body text-muted text-[10px]">{audit?.lastAudit}</div>
 </div>
 <div className="flex flex-col justify-center">
 <div className="font-body text-ghost text-[10px]">Result</div>
 <div className={`font-body font-medium text-[11px] ${audit?.result === 'Approved' ? 'text-ok' : audit?.result === 'Conditional' ? 'text-warn' : 'text-danger'}`}>{audit?.result}</div>
 </div>
 <div className="flex flex-col items-end justify-center">
 <div className={`display-num text-2xl ${s.scoreColor}`}>{s.score}</div>
 <div className="font-body text-ghost text-[10px]">score</div>
 </div>
 </div>
 {audit?.needsAction && (
 <div className="px-4 pb-3 flex gap-2">
 <Btn variant="primary">Schedule re-audit</Btn>
 <Btn variant="secondary">View audit history</Btn>
 </div>
 )}
 </div>
 )
 })}
 </>
 )}
 
     {activeView === 'lots' && (
     <>
     <SecHd tag="Ingredient lots" title="Current batch — COA status, shelf life, delivery" badge={<Urg level="danger">1 blocking · 2 expiring</Urg>} />
     {/* Urgency-first sort: urgent lots first, then by shelf life */}
     {[...d.lots].sort((a,b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || a.shelf - b.shelf).map((lot, i) => {
      const supplierEntry = d.suppliers.find(s => lot.supplier.startsWith(s.name))
      return (
      <div key={i} className={`border-b border-rule2 border-l-2 ${
       lot.urgent ? 'border-l-danger bg-danger/[0.02]' : lot.shelfTone === 'warn' ? 'border-l-warn' : 'border-l-transparent'
      }`}>
       <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1fr 90px 90px 120px 90px' }}>
        {/* Name + supplier */}
        <div>
        <div className={`flex items-center gap-1.5 font-body font-medium text-[13px] ${lot.urgent ? 'text-danger' : 'text-ink'}`}>
         {(() => { const I = FOOD_ICONS[lot.ing]; return I ? <I size={12} strokeWidth={2} className="flex-shrink-0 opacity-50" /> : null })()}
         {lot.ing}
        </div>
        <div className="font-body text-ghost text-[10px] mt-0.5">{lot.supplier}</div>
        </div>
        {/* COA status */}
        <div className="flex flex-col justify-center">
        <Chip tone={lot.coaTone === 'ok' ? 'ok' : lot.coaTone === 'danger' ? 'danger' : 'warn'}>{lot.coa}</Chip>
        </div>
        {/* Shelf life */}
        <div className="flex flex-col justify-center">
        <ShelfPill days={lot.shelf} tone={lot.shelfTone} useFirst={lot.useFirst} />
        </div>
        {/* Delivery */}
        <div className="flex flex-col justify-center">
        <div className={`font-body font-medium text-[11px] ${
         lot.deliveryTone === 'ok' ? 'text-ok' : lot.deliveryTone === 'warn' ? 'text-warn' : lot.deliveryTone === 'int' ? 'text-int' : 'text-ink'
        }`}>{lot.delivery}</div>
        <div className="font-body text-ghost text-[10px] mt-0.5">{lot.deliveryTime}</div>
        </div>
        {/* Action */}
        <div className="flex flex-col justify-center items-end">
        {lot.urgent && !coaRequested
         ? <Btn variant="primary" onClick={() => setCoaRequested(true)}>Request COA</Btn>
         : lot.urgent && coaRequested
         ? <span className="font-body text-ok text-[11px] flex items-center gap-1"><Check size={11} strokeWidth={2} /> Requested</span>
         : <button type="button" onClick={() => setCoaViewLot(lot)}
          className="font-body text-[10px] px-2.5 py-1 text-muted hover:text-ink transition-colors">
          View COA
         </button>
        }
        </div>
       </div>
      </div>
      )
     })}
     {coaRequested && (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-t border-ok/20 font-body text-ok text-[11px] slide-in">
      <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
      COA request sent to ConAgra · Expected response within 2 hours · Production hold maintained until received
      </div>
     )}
 {/* FSMA 204 traceability chain */}
 <div className="border-t border-rule2">
 <SecHd tag="FSMA 204 traceability" title="Lot-level chain of custody — Tomato Sauce · TS-8811"
 badge={<Urg level={namingResolved ? 'ok' : 'warn'}>{namingResolved ? 'Naming resolved — 1 link pending COA' : '1 chain gap · Resolve in Data Readiness'}</Urg>} />
 {/* Validation summary */}
 <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule2 ${namingResolved ? 'bg-ok/10' : 'bg-danger/[0.04]'}`}>
 <div className="flex gap-1 flex-shrink-0">
 {[{t:'ok',l:'CTE 1'},{t: namingResolved ? 'ok' : 'gap',l:'CTE 2'},{t:'pend',l:'CTE 3'},{t:'pend',l:'CTE 4'}].map((n,i) => (
 <div key={i} className="flex flex-col items-center gap-0.5">
 <div className={`w-4 h-4 rounded-full flex items-center justify-center ${n.t==='ok'?'bg-ok/20':n.t==='gap'?'bg-danger/20':'bg-stone3'}`}>
 {n.t==='ok' && <Check size={8} strokeWidth={2} className="text-ok" />}
 {n.t==='gap' && <X size={8} strokeWidth={2} className="text-danger" />}
 {n.t==='pend' && <div className="w-1.5 h-1.5 rounded-full bg-ghost" />}
 </div>
 <span className="font-body text-ghost text-[8px]">{n.l}</span>
 </div>
 ))}
 </div>
 <p className="font-body text-[11px] flex-1">
 {namingResolved
 ? <span className="text-ok">Naming conflict resolved — chain will auto-validate on COA receipt.</span>
 : <><strong className="text-danger not-italic font-semibold">1 of 4 links validated</strong><span className="text-ink2"> — naming conflict at CTE 2 blocks FSMA 204 submission.</span></>}
 </p>
 </div>
 <div className="flex items-start gap-2 px-4 py-2.5 bg-ok/10 border-b border-rule2">
 <Clock size={14} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
 <p className="font-body text-ink2 text-[11px]">FSMA 204 requires this chain to be submittable to FDA within <strong className="text-ok not-italic font-semibold">24 hours</strong> of a request. Auto-assembled from existing records.</p>
 </div>
 <div className="px-4 py-2 relative">
 <div className="absolute left-[28px] top-4 bottom-4 w-px bg-rule2" />
 <TraceNode label="Supplier · CTE 1" name="ConAgra Foods — Omaha, NE" detail="Lot TS-8811 · COA pending · Packed Apr 12" tone="ok" />
 <TraceNode label="Receiving · CTE 2" name="Salina Plant — Dock 3" detail="Expected Apr 16, 18:00 · COA not yet received"
 tone={namingResolved ? 'ok' : 'gap'}
 gapMsg={namingResolved ? null : 'COA missing. MES name "Tomato Sauce" ≠ ERP "Tomato Paste, Concentrate". Chain gap prevents FSMA submission.'}
 onResolve={namingResolved ? null : () => navigate('/readiness', { state: { highlight: 'conflict-0' } })} />
 <TraceNode label="Production · CTE 3" name="Line 4 — Pepperoni Classic batch" detail="Scheduled Apr 17, 06:00 · Pending lot receipt" tone="pending" />
 <TraceNode label="Finished Goods · CTE 4" name="FG Lot pending — Pepperoni Classic 12oz" detail="Auto-populates on production close" tone="pending" />
 </div>
 </div>

 {/* Price alerts */}
 <div className="border-t border-rule2">
 <SecHd tag="Price alerts" title="Ingredient cost movement — current batch vs. prior"
 badge={<Urg level="warn">2 active alerts</Urg>} />
 <div className="grid grid-cols-2 divide-x divide-rule2">
 {[
 { ing:'Tomato sauce', change:'+14%', impact:'−$0.04/unit', tone:'danger', detail:'ConAgra contract up for renewal May 12. 3-month trailing average +11%.', rfq: true },
 { ing:'Canola oil', change:'+8%', impact:'−$0.02/unit', tone:'warn', detail:'ADM market index +8% YTD. Two alternative suppliers within 5% of current rate.', rfq: false },
 ].map((r, i) => (
 <div key={i} className="px-4 py-3">
 <div className="font-body font-medium text-ink text-[12px] mb-0.5">{r.ing}</div>
 <div className={`display-num text-3xl ${r.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>{r.change}</div>
 <div className={`font-body text-[10px] mt-0.5 ${r.tone === 'danger' ? 'text-danger' : 'text-warn'}`}>{r.impact}</div>
 <div className="font-body text-ghost text-[10px] mt-2 leading-relaxed">{r.detail}</div>
 {r.rfq && (
 rfqSent
 ? <div className="font-body text-ok text-[10px] mt-2">RFQ sent to ADM + Sysco · Response expected 48h</div>
 : <Btn variant="primary" className="mt-2" onClick={() => { setRfqSent(true); setRfqOpen(false) }}>Request alternatives — contract expires May 12</Btn>
 )}
 </div>
 ))}
 </div>
 {rfqSent && (
 <div className="flex items-center gap-2 px-4 py-2.5 border-t border-rule2 bg-ok/10 font-body text-ok text-[11px] slide-in">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 RFQ sent to ADM Foods and Sysco for Tomato Sauce · Draft includes current volume, delivery requirements, and price ceiling.
 </div>
 )}
 </div>

 {/* Recall simulator */}
 <div className="border-t border-rule2">
 <SecHd tag="Recall simulation" title="Blast radius — if TS-8811 is recalled today"
 badge={<Urg level="info">Simulation only</Urg>} />
 <div className="grid grid-cols-4 border-b border-rule2">
 {[{v:'2',l:'Lots affected'},{v:'3,840',l:'Units at risk'},{v:'12',l:'Retail locations'},{v:'4h',l:'Estimated containment'}].map((s,i)=>(
 <div key={i} className="px-4 py-3 border-r border-rule2 last:border-r-0">
 <div className="display-num text-2xl text-ink">{s.v}</div>
 <div className="font-body text-ghost text-[10px] mt-0.5">{s.l}</div>
 </div>
 ))}
 </div>
 </div>
 </>
 )}
 </Layout>
 </div>
 )
}
