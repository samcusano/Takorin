import { useState } from 'react'
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
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
 <button type="button" onClick={onClose} className="font-body text-[11px] px-3 py-1.5 bg-stone3 text-muted">Close</button>
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
 <div className="flex items-start gap-3 py-3 border-b border-rule last:border-b-0">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
 tone === 'ok' ? 'bg-ok/20' : tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
 }`}>
 {tone === 'ok' && <svg className="w-3 h-3 stroke-ok" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
 {tone === 'gap' && <svg className="w-3 h-3 stroke-danger" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}
 {tone === 'pending' && <div className="w-2 h-2 rounded-full bg-ghost" />}
 </div>
 <div className="flex-1">
 <div className="font-body text-ghost text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
 <div className="font-body font-medium text-ink text-[12px]">{name}</div>
 <div className="font-body text-ghost text-[10px]">{detail}</div>
 {gapMsg && (
 <div className="font-body text-danger text-[10px] mt-1 flex items-start gap-1">
 <span>⚠</span><span>{gapMsg}</span>
 </div>
 )}
 {onResolve && <button type="button" onClick={onResolve} className="font-body text-int text-[10px] mt-1 hover:underline">Go to Data Readiness →</button>}
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
 {/* Supplier performance */}
 <SP title="Supplier performance" sub="On-time + compliance · last audit">
 {d.suppliers.map((s, i) => {
 const audit = supplierAudits[s.name]
 return (
 <div key={i} className={`border-b border-rule last:border-b-0 ${audit?.needsAction ? 'bg-danger/[0.02]' : ''}`}>
 <div className="flex items-center gap-2 px-4 py-2 hover:bg-stone3 transition-colors">
 <span className="display-num text-[11px] text-ghost w-4">{s.rank}</span>
 <span className="font-body font-medium text-ink text-[12px] flex-1">{s.name}</span>
 <span className={`font-body font-medium text-[10px] px-1.5 py-0.5 ${
 s.tierTone === 'ok' ? 'bg-ok/10 text-ok' : s.tierTone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-int/10 text-int'
 }`}>{s.tier}</span>
 <span className={`display-num text-base w-7 text-right ${s.scoreColor}`}>{s.score}</span>
 </div>
 {audit && (
 <div className="px-4 pb-2 flex items-center gap-3 flex-wrap">
 <span className="font-body text-ghost text-[10px]">Last audit: {audit.lastAudit}</span>
 <span className={`font-body font-medium text-[10px] px-1 py-px ${audit.result === 'Approved' ? 'text-ok' : audit.result === 'Conditional' ? 'text-warn' : 'text-danger'}`}>{audit.result}</span>
 {audit.findings > 0 && <span className="font-body text-ghost text-[10px]">{audit.findings} finding{audit.findings > 1 ? 's' : ''}</span>}
 <span className="font-body text-ghost text-[10px]">Next: {audit.nextAudit}</span>
 {audit.needsAction && <span className="font-body text-danger text-[10px]">Re-audit due</span>}
 </div>
 )}
 </div>
 )
 })}
 </SP>

 {/* FDA audit */}
 <SP title="FDA inspection" sub="FSMA 204">
 <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
 <span className="display-num text-4xl text-warn">18</span>
 <span className="font-body text-ghost text-[11px]">days · Region 7 · Salina</span>
 </div>
 <div className="mx-4 mb-3 h-1 bg-rule2"><div className="h-full bg-warn" style={{ width:'62%' }} /></div>
 {d.fdaSteps.map((s, i) => (
 <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-rule last:border-b-0">
 <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
 s.tone === 'ok' ? 'bg-ok/20' : s.tone === 'gap' ? 'bg-danger/20' : 'bg-stone3'
 }`}>
 {s.tone === 'ok' && <svg className="w-2.5 h-2.5 stroke-ok" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
 {s.tone === 'gap' && <svg className="w-2.5 h-2.5 stroke-danger" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
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
 <div key={i} className={`px-4 py-2.5 border-b border-rule last:border-b-0 border-l-2 ${
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
 <div key={i} className={`flex items-center gap-2 px-4 py-2 border-b border-rule last:border-b-0 ${r.result === 'positive' ? 'bg-danger/[0.03]' : ''}`}>
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

 {/* Margin impact */}
 <SP title="Margin impact" sub="This batch">
 <div className="px-4 py-3 space-y-2.5">
 {[{l:'Prior batch',v:'$0.42/unit',c:'text-ok'},{l:'This batch',v:'$0.48/unit',c:'text-danger'}].map((r,i)=>(
 <div key={i} className="flex justify-between items-baseline">
 <span className="font-body text-muted text-[12px]">{r.l}</span>
 <span className={`display-num text-base ${r.c}`}>{r.v}</span>
 </div>
 ))}
 <div className="h-px bg-rule2" />
 <div className="flex justify-between items-baseline">
 <span className="font-body font-medium text-ink text-[12px]">Compression</span>
 <span className="display-num text-base text-danger">−14.3%</span>
 </div>
 <div className="font-body text-ghost text-[10px] border-t border-dashed border-rule2 pt-2">Driven by ingredient cost increases</div>
 {[{l:'Tomato sauce +14%',v:'−$0.04',pct:100},{l:'Canola oil +8%',v:'−$0.02',pct:57}].map((r,i)=>(
 <div key={i} className="flex items-center gap-2">
 <span className="font-body text-ghost text-[10px] flex-1">{r.l}</span>
 <div className="w-14 h-1 bg-rule2 flex-shrink-0"><div className="h-full bg-danger" style={{ width:r.pct+'%' }} /></div>
 <span className="display-num text-[11px] text-danger w-10 text-right">{r.v}</span>
 </div>
 ))}
 </div>
 </SP>
 </>
 )

 return (
 <div className="flex flex-col h-full overflow-hidden">
 <CoaPanel lot={coaViewLot} onClose={() => setCoaViewLot(null)} />
 <ActionBanner
 color="#8A6A3A"
 headline="1 COA missing — production start blocked"
 body="ConAgra Lot TS-8811 · FDA inspection in 18 days · 2 lots expiring in 14 days"
 >
 <Btn variant="ghost" onClick={handleExport} disabled={exportState === 'loading'}>
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
 <div className="grid px-4 py-3" style={{ gridTemplateColumns:'28px 1fr 80px 100px 90px 100px' }}>
 <span className="display-num text-[11px] text-ghost pt-0.5">{s.rank}</span>
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
 <button className="font-body font-medium text-[10px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">Schedule re-audit</button>
 <button className="font-body text-[10px] px-3 py-1.5 text-muted hover:text-ink transition-colors">View audit history</button>
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
 <div className="overflow-x-auto">
 <table className="w-full text-[12px]">
 <thead>
 <tr className="border-b border-rule2 bg-stone2">
 {['Ingredient','Supplier · Lot','PO date','Shelf life','Delivery ETA','COA status','Action'].map(h => (
 <th key={h} className="px-4 py-2 text-left font-body text-ghost text-[10px] font-normal">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {d.lots.map((lot, i) => (
 <tr key={i} className={`border-b border-rule2 hover:bg-stone2 transition-colors ${lot.urgent ? 'bg-danger/[0.03]' : ''}`}>
 <td className={`px-4 py-3 font-body font-medium ${lot.urgent ? 'text-danger' : 'text-ink'}`}>{lot.ing}</td>
 <td className="px-4 py-3 font-body text-ghost text-[11px]">{lot.supplier}</td>
 <td className="px-4 py-3 font-body text-ghost text-[11px]">{lot.po}</td>
 <td className="px-4 py-3"><ShelfPill days={lot.shelf} tone={lot.shelfTone} useFirst={lot.useFirst} /></td>
 <td className="px-4 py-3">
 <span className={`font-body font-medium text-[11px] ${
 lot.deliveryTone === 'ok' ? 'text-ok' : lot.deliveryTone === 'warn' ? 'text-warn' : lot.deliveryTone === 'int' ? 'text-int' : 'text-ink'
 }`}>{lot.delivery}</span>
 <div className="font-body text-ghost text-[10px] mt-0.5">{lot.deliveryTime}</div>
 </td>
 <td className="px-4 py-3">
 <Chip tone={lot.coaTone === 'ok' ? 'ok' : lot.coaTone === 'danger' ? 'danger' : 'warn'}>{lot.coa}</Chip>
 </td>
 <td className="px-4 py-3">
 {lot.urgent && !coaRequested
 ? <button type="button" onClick={() => setCoaRequested(true)}
 className="font-body font-medium text-[10px] px-2.5 py-1 bg-danger text-white hover:opacity-90 transition-opacity">
 Request now
 </button>
 : lot.urgent && coaRequested
 ? <span className="font-body text-ok text-[11px]">Requested ✓</span>
 : <button
 onClick={() => setCoaViewLot(lot)}
 className="font-body font-medium text-[10px] px-2.5 py-1 bg-stone3 text-ink hover:bg-stone2 transition-colors"
 >
 View COA
 </button>
 }
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {coaRequested && (
 <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-t border-ok/20 font-body text-ok text-[11px] slide-in">
 <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
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
 {n.t==='ok' && <svg className="w-2 h-2 stroke-ok" fill="none" strokeWidth={3} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
 {n.t==='gap' && <svg className="w-2 h-2 stroke-danger" fill="none" strokeWidth={3} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
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
 <svg className="w-3.5 h-3.5 stroke-ok flex-shrink-0 mt-0.5" fill="none" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
 : <button
 onClick={() => { setRfqSent(true); setRfqOpen(false) }}
 className="mt-2 font-body font-medium text-[10px] px-2.5 py-1 bg-warn/10 text-warn hover:bg-warn/20 transition-colors border border-warn/20"
 >
 Request alternatives — contract expires May 12
 </button>
 )}
 </div>
 ))}
 </div>
 {rfqSent && (
 <div className="flex items-center gap-2 px-4 py-2.5 border-t border-rule2 bg-ok/10 font-body text-ok text-[11px] slide-in">
 <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
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
