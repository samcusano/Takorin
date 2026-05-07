import React, { useState, useRef, useEffect } from 'react'
import { FileText, BarChart2 } from 'lucide-react'
import StatBar from '../components/StatBar.jsx'
import { Check, X, AlertTriangle, ArrowRight, TrendingUp, ChevronRight } from 'lucide-react'
import { Urg, SecHd, SP, ActionBanner, Btn } from '../components/UI'
import { openCases, patternRows, benchmarks } from '../data/capa.js'
import { haccpData, goalsData } from '../data'
import { useAppState } from '../context/AppState'

const CASE_BORDERS = { cu: 'border-l-danger', cw: 'border-l-warn', co: 'border-l-ok', ca: 'border-l-warn' }
const BADGE_BG = { 'text-danger': 'bg-danger/10', 'text-warn': 'bg-warn/10', 'text-ok': 'bg-ok/10' }

// ── Case detail slide-over panel ─────────────────────────────────────────────

function CaseDetailPanel({ caseData, onClose }) {
 const [localFiles, setLocalFiles] = useState([])
 const [actionTaken, setActionTaken] = useState(null)
 const { setClosedCases, logActivity } = useAppState()
 const fileInputRef = useRef(null)

 useEffect(() => {
 if (actionTaken) {
 const id = setTimeout(onClose, 1500)
 return () => clearTimeout(id)
 }
 }, [actionTaken])

 if (!caseData) return null
 const allFiles = [...caseData.evidenceFiles, ...localFiles]

 return (
 <>
 <div className="fixed inset-0 bg-ink/30 z-40" onClick={onClose} />
 <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-stone border-l border-rule z-50 flex flex-col slide-right">
 <div className="flex items-start justify-between px-5 py-4 border-b border-rule bg-stone2 flex-shrink-0">
 <div>
 <div className="font-body text-[10px] text-ghost mb-1">{caseData.capaId}</div>
 <div className="font-display text-base font-black text-ink">{caseData.title}</div>
 </div>
 <button type="button" onClick={onClose} aria-label="Close case detail" className="p-1 text-ghost hover:text-ink transition-colors flex-shrink-0">
 <X size={14} strokeWidth={2.5} aria-hidden="true" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto">
 <div className="grid grid-cols-2 gap-px bg-rule border-b border-rule">
 {[{l:'Status',v:caseData.badge,vc:caseData.badgeColor},{l:'Assigned',v:caseData.assigned},{l:'Due date',v:caseData.due,vc:caseData.dueColor},{l:'Source',v:caseData.source}].map(m=>(
 <div key={m.l} className="bg-stone2 px-4 py-3">
 <div className="font-body text-[10px] text-ghost mb-1">{m.l}</div>
 <div className={`font-body text-xs font-medium ${m.vc||'text-ink'}`}>{m.v}</div>
 </div>
 ))}
 </div>
 <div className="px-5 py-3 border-b border-rule">
 <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-2">Root cause</div>
 <div className="flex gap-1.5 flex-wrap">
 {caseData.rootCauseTags.map(t=><span key={t} className="font-body text-[10px] px-2 py-0.5 bg-warn/10 text-warn">{t}</span>)}
 </div>
 </div>
 <div className="px-5 py-3 border-b border-rule">
 <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-2">Regulatory mapping</div>
 <div className="flex gap-1.5 flex-wrap">
 {caseData.regulatory.map(r=><span key={r} className="font-body text-[10px] px-2 py-0.5 bg-int/10 text-int">{r}</span>)}
 </div>
 </div>
 <div className="px-5 py-3 border-b border-rule">
 <div className="flex items-center justify-between mb-2">
 <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost">Evidence files</div>
 <Urg level={allFiles.length > 0 ? 'ok' : 'critical'}>{allFiles.length > 0 ? `${allFiles.length} attached` : '0 of 1 required'}</Urg>
 </div>
 <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f=e.target.files[0]; if(f) setLocalFiles(p=>[...p,f.name]); e.target.value='' }} />
 {allFiles.length > 0 ? (
 <div className="space-y-1">
 {allFiles.map(f=>(
 <div key={f} className="flex items-center gap-2 py-1.5 border-b border-rule last:border-0">
 <FileText size={12} className="text-muted flex-shrink-0" />
 <span className="font-body text-[11px] text-muted">{f}</span>
 </div>
 ))}
 <button type="button" className="font-body font-medium text-[11px] px-3 py-1.5 mt-2 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={()=>fileInputRef.current?.click()}>Add another file</button>
 </div>
 ) : (
 <div className="flex flex-col items-center py-4 text-center gap-3">
 <FileText size={20} className="text-ghost" />
 <p className="font-body text-[11px] text-ghost">No evidence attached. Upload at least one file to close this case.</p>
 <button type="button" className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity" onClick={()=>fileInputRef.current?.click()}>Upload evidence</button>
 </div>
 )}
 </div>
 <div className="px-5 py-3">
 <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-3">Activity log</div>
 {caseData.activity.map((a,i)=>(
 <div key={i} className="py-2 border-b border-rule last:border-0">
 <div className="font-body text-[10px] text-ghost mb-0.5">{a.time}</div>
 <div className="font-body text-xs text-muted leading-relaxed">{a.text}</div>
 </div>
 ))}
 </div>
 </div>
 {actionTaken ? (
 <div className="px-5 py-3 border-t border-rule bg-ok/10 font-body text-ok text-xs slide-in flex-shrink-0">
 {actionTaken==='escalate' ? 'Escalated to director.' : 'Reassignment request sent.'}
 </div>
 ) : (
 <div className="flex gap-2 px-5 py-3 border-t border-rule bg-stone2 flex-shrink-0">
 <button type="button" className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity" onClick={()=>setActionTaken('escalate')}>Escalate to director</button>
 <button type="button" className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={()=>setActionTaken('reassign')}>Reassign</button>
 </div>
 )}
 </aside>
 </>
 )
}


// ── Layout 4: Priority Queue + Inline Case ───────────────────────────────────
// Mental model: "What do I do right now, and why is it first?"
// Left: system-ranked queue with priority reason per item.
// Right: inline case panel — recommended action + impact at the top, details collapsible below.
// Acting removes/reorders immediately. Under 5 seconds to first meaningful action on load.

const BLOCKING_ITEM = {
 id: 'c-blocking', type: 'cu', capaId: 'CAPA-2604-006',
 badge: 'Evidence required', badgeColor: 'text-danger',
 title: 'Pack Line QA pre-check — evidence missing',
 assigned: 'T. Osei', rootCause: 'Process — Documentation gap',
 due: 'Apr 16 — today', dueColor: 'text-danger',
 source: 'Manual — QA audit',
 description: 'Pack Line QA pre-check log missing for this shift. FDA audit export blocked until at least one file is attached.',
 primaryLabel: 'Upload evidence',
 evidenceFiles: [],
 activity: [{ time: 'Apr 16 · 09:00', text: 'Case created. Pack Line QA pre-check log missing for this shift.' }],
 regulatory: ['GMP 21 CFR 110', 'FSMA 204'],
 rootCauseTags: ['Documentation', 'QA process'],
 priorityScore: 95,
 priorityReason: 'Blocking FDA audit export. 18 days to inspection. One action resolves it.',
 recommendedAction: 'Upload Pack Line QA pre-check log',
 expectedImpact: 'FDA audit package unblocked. All 14 closed CAPAs ready for FSMA 204 export.',
 riskIfIgnored: 'FSMA 204 evidence gap remains open through the FDA Region 7 inspection window.',
}

function CollapsibleSection({ label, isOpen, onToggle, children }) {
 return (
 <div className="border-b border-rule2 last:border-b-0">
 <button type="button" onClick={onToggle}
 className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-stone2 transition-colors">
 <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{label}</span>
 <span className={`text-ghost text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
 </button>
 {isOpen && <div className="border-t border-rule2 bg-stone">{children}</div>}
 </div>
 )
}

function PriorityQueueRow({ c, priority, isSelected, onSelect, isEscalated, isResolved }) {
 const score = c.priorityScore || 0
 const numColor = isResolved || isEscalated ? 'text-ghost'
 : score >= 80 ? 'text-danger' : score >= 55 ? 'text-warn' : 'text-ghost'
 const borderColor = isSelected ? 'border-l-ochre'
 : score >= 80 ? 'border-l-danger' : score >= 55 ? 'border-l-warn' : 'border-l-rule2'
 const rowBg = isSelected ? 'bg-ochre/[0.04]'
 : score >= 80 && !isResolved && !isEscalated ? 'bg-danger/[0.015]' : ''

 return (
 <button type="button" onClick={onSelect}
 className={`w-full text-left border-b border-rule2 border-l-2 transition-colors ${borderColor} ${rowBg} ${isResolved || isEscalated ? 'opacity-50' : 'hover:bg-stone3'}`}>
 <div className="flex gap-3 px-4 py-3">
 <span className={`display-num text-xl leading-none flex-shrink-0 w-7 text-right mt-0.5 ${numColor}`}>
 {String(priority).padStart(2, '0')}
 </span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
 <span className={`font-body font-medium text-[9px] px-1.5 py-px ${c.badgeColor} ${BADGE_BG[c.badgeColor] || 'bg-warn/10'}`}>
 {isEscalated ? 'Delegated' : isResolved ? 'Resolved' : c.badge}
 </span>
 <span className="font-body text-ghost text-[9px]">{c.capaId}</span>
 </div>
 <div className={`font-body font-medium text-[11px] leading-snug truncate ${isResolved || isEscalated ? 'text-muted' : 'text-ink'}`}>
 {c.title}
 </div>
 {c.priorityReason && !isResolved && !isEscalated && (
 <div className={`font-body text-[10px] mt-0.5 leading-snug ${score >= 80 ? 'text-danger/70' : 'text-muted'}`}>
 {c.priorityReason}
 </div>
 )}
 {isEscalated && (
 <div className="font-body text-[9px] mt-0.5 text-ghost">Delegated — moved to bottom</div>
 )}
 </div>
 </div>
 </button>
 )
}

function PriorityInlinePanel({ c, blockingEvidenceUploaded, setBlockingEvidenceUploaded, closedCases, setClosedCases, logActivity, onAdvance }) {
 const [openSection, setOpenSection] = useState(null)
 const [confirming, setConfirming] = useState(false)
 const [actionTaken, setActionTaken] = useState(null)
 const [localFiles, setLocalFiles] = useState([])
 const [detailTab, setDetailTab] = useState('details')
 const fileInputRef = useRef(null)

 const isBlocking = c.id === 'c-blocking'
 const isClosed = closedCases.includes(c.id)
 const allFiles = [...(c.evidenceFiles || []), ...localFiles]

 const toggleSection = (key) => setOpenSection(s => s === key ? null : key)

 const handleApprove = () => {
 setClosedCases(p => [...p, c.id])
 logActivity({ actor:'J. Crocker', action:`Approved and closed ${c.capaId}`, item:c.capaId, type:'capa' })
 setActionTaken('closed')
 setTimeout(onAdvance, 800)
 }

 const handleEscalate = () => {
 logActivity({ actor:'J. Crocker', action:`Escalated ${c.capaId}`, item:c.capaId, type:'escalation' })
 setActionTaken('escalated')
 setTimeout(onAdvance, 800)
 }

 const handleUpload = () => {
 setBlockingEvidenceUploaded(true)
 logActivity({ actor:'J. Crocker', action:'Uploaded evidence for CAPA-2604-006', item:'CAPA-2604-006', type:'evidence' })
 setActionTaken('uploaded')
 setTimeout(onAdvance, 800)
 }

 const score = c.priorityScore || 0
 const actionBtnCls = isBlocking ? 'bg-danger text-white'
 : c.type === 'ca' ? 'bg-ok text-white'
 : 'bg-ink text-stone'

 return (
 <div className="flex flex-col h-full overflow-hidden">
 {/* Case header */}
 <div className="px-6 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-body text-ghost text-[10px]">{c.capaId}</span>
 <span className={`font-body font-medium text-[9px] px-1.5 py-px ${c.badgeColor} ${BADGE_BG[c.badgeColor] || 'bg-warn/10'}`}>{c.badge}</span>
 </div>
 <div className="font-display text-lg font-black text-ink leading-tight">{c.title}</div>
 <div className="font-body text-ghost text-[11px] mt-0.5">
 {c.assigned} · <span className={c.dueColor}>{c.due}</span>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 {/* ── Recommended action (the operative section) ── */}
 {!isClosed && !actionTaken && (
 <div className="px-6 py-5 border-b border-rule2 bg-stone3">
 <div className="font-body font-medium text-ghost text-[9px] uppercase tracking-widest mb-3">
 Recommended action
 </div>

 {isBlocking ? (
 <>
 <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
 <button type="button" onClick={() => fileInputRef.current?.click()}
 className={`w-full font-body font-medium text-[12px] px-4 py-3 hover:opacity-90 transition-opacity text-left flex items-center justify-between mb-4 ${actionBtnCls}`}>
 <span>{c.recommendedAction}</span>
 <TrendingUp size={13} strokeWidth={2} className="opacity-60" />
 </button>
 </>
 ) : c.type === 'ca' ? (
 confirming ? (
 <div className="flex items-center gap-3 mb-4 p-3 bg-ok/5 border border-ok/20">
 <span className="font-body text-ink2 text-[11px] flex-1">Close {c.capaId}? Logged as a regulatory action.</span>
 <button type="button" onClick={() => setConfirming(false)} className="font-body text-[10px] px-2.5 py-1 border border-rule2 text-muted flex-shrink-0">Cancel</button>
 <button type="button" onClick={handleApprove} className="font-body font-medium text-[10px] px-3 py-1.5 bg-ok text-white hover:opacity-90 transition-opacity flex-shrink-0">Confirm close</button>
 </div>
 ) : (
 <button type="button" onClick={() => setConfirming(true)}
 className={`w-full font-body font-medium text-[12px] px-4 py-3 hover:opacity-90 transition-opacity text-left flex items-center justify-between mb-4 ${actionBtnCls}`}>
 <span>{c.recommendedAction || 'Approve & close case'}</span>
 <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
 </button>
 )
 ) : (
 <button type="button" onClick={handleEscalate}
 className={`w-full font-body font-medium text-[12px] px-4 py-3 hover:opacity-90 transition-opacity text-left flex items-center justify-between mb-4 ${actionBtnCls}`}>
 <span>{c.recommendedAction || c.primaryLabel}</span>
 <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
 </button>
 )}

 {/* Impact lines */}
 <div className="space-y-2">
 {c.expectedImpact && (
 <div className="flex items-start gap-2.5">
 <Check size={13} strokeWidth={2.5} className="text-ok flex-shrink-0 mt-0.5" />
 <div className="min-w-0">
 <span className="font-body font-medium text-ghost text-[9px] uppercase tracking-widest mr-2">If you act</span>
 <span className="font-body text-ink2 text-[11px]">{c.expectedImpact}</span>
 </div>
 </div>
 )}
 {c.riskIfIgnored && (
 <div className="flex items-start gap-2.5">
 <TrendingUp size={13} strokeWidth={2.5} className="text-warn flex-shrink-0 mt-0.5" />
 <div className="min-w-0">
 <span className="font-body font-medium text-ghost text-[9px] uppercase tracking-widest mr-2">If you delay</span>
 <span className="font-body text-warn text-[11px]">{c.riskIfIgnored}</span>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Success confirmation */}
 {actionTaken && (
 <div className="px-6 py-5 bg-ok/10 border-b border-ok/20 slide-in">
 <div className="flex items-center gap-2 mb-1">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 <span className="font-body font-medium text-ok text-[13px]">
 {actionTaken === 'closed' ? 'Case closed.' : actionTaken === 'uploaded' ? 'Evidence uploaded.' : 'Action delegated.'}
 </span>
 </div>
 <div className="font-body text-ok/70 text-[11px]">
 {actionTaken === 'closed' ? `${c.capaId} removed from open docket. Queue updated.`
 : actionTaken === 'uploaded' ? 'FDA audit package unblocked. Queue updated.'
 : `${c.capaId} delegated. Moving to next item.`}
 </div>
 </div>
 )}

 {/* Tab bar */}
 <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0">
 {[
  { id: 'details', label: 'Details' },
  { id: 'activity', label: `Activity · ${c.activity?.length || 0}` },
 ].map(tab => (
  <button key={tab.id} type="button"
  onClick={() => setDetailTab(tab.id)}
  className={`px-5 py-2 font-body text-[10px] uppercase tracking-widest font-medium border-b-2 transition-colors cursor-pointer ${
   detailTab === tab.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-ghost hover:text-muted'
  }`}>
  {tab.label}
  </button>
 ))}
 </div>

 {/* Details tab */}
 {detailTab === 'details' && (
 <div className="px-6 py-4 space-y-4 border-b border-rule2">
  {[{l:'Root cause',v:c.rootCause},{l:'Assigned',v:c.assigned},{l:'Due',v:c.due,vc:c.dueColor},{l:'Source',v:c.source}].map(m => (
  <div key={m.l} className="flex items-start gap-3">
   <span className="font-body text-ghost text-[10px] w-24 flex-shrink-0 mt-0.5">{m.l}</span>
   <span className={`font-body text-[12px] ${m.vc || 'text-ink'}`}>{m.v}</span>
  </div>
  ))}
  <div>
  <div className="font-body text-ghost text-[10px] mb-1.5">Regulatory</div>
  <div className="flex gap-1.5 flex-wrap">
   {(c.regulatory||[]).map(r => <span key={r} className="font-body text-[10px] px-2 py-0.5 bg-int/10 text-int">{r}</span>)}
  </div>
  </div>
  <div>
  <div className="font-body text-ghost text-[10px] mb-1.5">Root cause tags</div>
  <div className="flex gap-1.5 flex-wrap">
   {(c.rootCauseTags||[]).map(t => <span key={t} className="font-body text-[10px] px-2 py-0.5 bg-warn/10 text-warn">{t}</span>)}
  </div>
  </div>
  {c.description && (
  <div>
   <div className="font-body text-ghost text-[10px] mb-0.5">Description</div>
   <p className="font-body text-muted text-[11px] leading-relaxed">{c.description}</p>
  </div>
  )}
  {/* Evidence files */}
  <div>
  <div className="flex items-center justify-between mb-2">
   <div className="font-body text-ghost text-[10px]">Evidence files</div>
   <Urg level={allFiles.length > 0 ? 'ok' : c.type === 'ca' ? 'warn' : 'info'}>
   {allFiles.length > 0 ? `${allFiles.length} filed` : 'None attached'}
   </Urg>
  </div>
  <input ref={fileInputRef} type="file" className="hidden" onChange={e=>{const f=e.target.files[0];if(f)setLocalFiles(p=>[...p,f.name]);e.target.value=''}} />
  {allFiles.length > 0 ? allFiles.map(f => (
   <div key={f} className="flex items-center gap-2 py-1.5 border-b border-rule last:border-0">
   <FileText size={11} className="text-muted flex-shrink-0" />
   <span className="font-body text-[11px] text-muted">{f}</span>
   </div>
  )) : (
   <div className="font-body text-ghost text-[11px] mb-2">No files attached.</div>
  )}
  <button type="button" className="font-body font-medium text-[10px] px-2.5 py-1 mt-2 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={() => fileInputRef.current?.click()}>
   {allFiles.length > 0 ? 'Add file' : 'Upload evidence'}
  </button>
  </div>
 </div>
 )}

 {/* Activity tab */}
 {detailTab === 'activity' && (
 <div className="px-6 py-2">
  {(c.activity||[]).map((a, i) => (
  <div key={i} className="py-2.5 border-b border-rule last:border-0">
   <div className="font-body text-[10px] text-ghost mb-0.5">{a.time}</div>
   <div className="font-body text-[11px] text-ink2 leading-relaxed">{a.text}</div>
  </div>
  ))}
 </div>
 )}

 </div>
 </div>
 )
}

function LayoutQueue({ visibleCases, blockingEvidenceUploaded, setBlockingEvidenceUploaded, onShowBlockingCase }) {
 const { closedCases, setClosedCases, logActivity } = useAppState()
 const [escalatedIds, setEscalatedIds] = useState(new Set())

 // Build sorted queue: blocking case first (score 95), then cases by priorityScore, escalated to bottom
 const baseItems = [
 ...(!blockingEvidenceUploaded ? [BLOCKING_ITEM] : []),
 ...visibleCases,
 ]
 const nonEscalated = baseItems
 .filter(c => !escalatedIds.has(c.id))
 .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
 const escalatedItems = [...escalatedIds]
 .map(id => baseItems.find(c => c.id === id))
 .filter(Boolean)
 const sortedQueue = [...nonEscalated, ...escalatedItems]

 const [selectedId, setSelectedId] = useState(sortedQueue[0]?.id || null)

 // Auto-select first item
 useEffect(() => {
 if (!selectedId && sortedQueue.length > 0) setSelectedId(sortedQueue[0].id)
 }, [])

 // Auto-advance when selected case is resolved/removed
 useEffect(() => {
 const stillActive = sortedQueue.find(c =>
 c.id === selectedId &&
 !closedCases.includes(c.id) &&
 !(c.id === 'c-blocking' && blockingEvidenceUploaded)
 )
 if (!stillActive) {
 const next = sortedQueue.find(c =>
 !closedCases.includes(c.id) &&
 !(c.id === 'c-blocking' && blockingEvidenceUploaded)
 )
 setSelectedId(next?.id || sortedQueue[0]?.id || null)
 }
 }, [closedCases, blockingEvidenceUploaded, sortedQueue])

 const handleEscalate = (id) => {
 setEscalatedIds(prev => new Set([...prev, id]))
 const currentIdx = sortedQueue.findIndex(c => c.id === id)
 const next = sortedQueue.find((c, i) => i > currentIdx && !escalatedIds.has(c.id) && !closedCases.includes(c.id))
 if (next) setSelectedId(next.id)
 }

 const selectedCase = sortedQueue.find(c => c.id === selectedId)
 const actionableCount = sortedQueue.filter(c =>
 !closedCases.includes(c.id) &&
 !escalatedIds.has(c.id) &&
 !(c.id === 'c-blocking' && blockingEvidenceUploaded)
 ).length

 return (
 <div className="flex flex-1 min-h-0 overflow-hidden">

 {/* Left: priority queue */}
 <div className="w-[300px] flex-shrink-0 border-r border-rule2 overflow-y-auto flex flex-col bg-stone">

 {/* Queue summary header */}
 <div className="px-5 py-3.5 border-b border-rule2 bg-stone2 flex-shrink-0">
 <div className="flex items-baseline gap-2">
 <span className={`display-num text-3xl leading-none ${actionableCount > 0 ? 'text-danger' : 'text-ok'}`}>
 {actionableCount}
 </span>
 <span className="font-body text-muted text-[11px]">
 {actionableCount === 0 ? 'All clear' : `action${actionableCount > 1 ? 's' : ''} required`}
 </span>
 </div>
 <div className="font-body text-ghost text-[9px] mt-0.5">
 System-ranked by risk · time · regulatory exposure
 </div>
 </div>

 {/* Ranked items */}
 {sortedQueue.map((c, idx) => (
 <PriorityQueueRow
 key={c.id}
 c={c}
 priority={idx + 1}
 isSelected={selectedId === c.id}
 onSelect={() => setSelectedId(c.id)}
 isEscalated={escalatedIds.has(c.id)}
 isResolved={closedCases.includes(c.id) || (c.id === 'c-blocking' && blockingEvidenceUploaded)}
 />
 ))}

 {sortedQueue.length === 0 && (
 <div className="flex-1 flex items-center justify-center px-6 text-center">
 <div>
 <div className="font-display font-bold text-ok text-2xl mb-1">All clear</div>
 <div className="font-body text-ghost text-[11px]">No open cases.</div>
 </div>
 </div>
 )}
 </div>

 {/* Right: inline case panel */}
 <div className="flex-1 overflow-hidden bg-stone flex flex-col">
 {selectedCase ? (
 <PriorityInlinePanel
 key={selectedCase.id}
 c={selectedCase}
 blockingEvidenceUploaded={blockingEvidenceUploaded}
 setBlockingEvidenceUploaded={setBlockingEvidenceUploaded}
 closedCases={closedCases}
 setClosedCases={setClosedCases}
 logActivity={logActivity}
 onAdvance={() => {
 if (selectedCase.type === 'cu') handleEscalate(selectedCase.id)
 }}
 />
 ) : (
 <div className="flex-1 flex items-center justify-center text-center px-8">
 <div>
 <div className="font-display font-bold text-ok text-2xl mb-2">All clear</div>
 <div className="font-body text-ghost text-[12px]">No open cases require attention.</div>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}

function QueueItem({ item, priority, onSelectCase, onShowBlockingCase, blockingEvidenceUploaded, setBlockingEvidenceUploaded }) {
 const { closedCases, setClosedCases, logActivity } = useAppState()
 const [escalated, setEscalated] = useState(false)
 const [confirming, setConfirming] = useState(false)
 const blockingFileRef = useRef(null)

 const isOverdue = item.badge === 'Overdue'
 const isAwaiting = item.type === 'ca'
 const isBlocking = item.id === 'blocking'
 const isActionable = isOverdue || isAwaiting || isBlocking

 const numColor = isOverdue||isBlocking ? 'text-danger' : isAwaiting ? 'text-warn' : 'text-ghost'
 const leftBorder = isOverdue||isBlocking ? 'border-l-danger' : isAwaiting ? 'border-l-warn' : 'border-l-rule2'
 const rowBg = isOverdue||isBlocking ? 'bg-danger/[0.015]' : isAwaiting ? 'bg-warn/[0.015]' : ''

 if (!isBlocking && closedCases.includes(item.id)) return null

 return (
 <div className={`flex gap-5 px-6 py-5 border-b border-rule2 border-l-2 ${leftBorder} ${rowBg}`}>
 <div className={`display-num text-2xl flex-shrink-0 w-8 text-right leading-none pt-0.5 ${numColor}`}>
 {String(priority).padStart(2,'0')}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1.5 flex-wrap">
 <span className={`font-body font-medium text-[9px] px-1.5 py-px ${item.badgeColor} ${BADGE_BG[item.badgeColor]||'bg-warn/10'}`}>{item.badge}</span>
 <span className="font-body text-ghost text-[10px]">{item.capaId}</span>
 {item.rootCause && <span className="font-body text-ghost text-[10px]">· {item.rootCause.split(' — ')[0]}</span>}
 </div>
 <div
 className={`font-body font-medium text-[13px] leading-snug mb-1 ${isActionable?'text-ink':'text-ink2'} ${!isBlocking?'cursor-pointer hover:text-ochre transition-colors':''}`}
 onClick={() => !isBlocking && onSelectCase(item)}
 >
 {item.title}
 </div>
 <div className="font-body text-muted text-[11px] mb-3">
 {item.assigned && <span>{item.assigned} · </span>}
 <span className={item.dueColor||'text-muted'}>{item.due}</span>
 {item.description && <span className="text-ghost"> · {item.description.split('.')[0]}.</span>}
 </div>
 <div className="flex gap-2 flex-wrap items-center">
 {isBlocking ? (
 <>
 <input ref={blockingFileRef} type="file" className="hidden"
 onChange={() => { setBlockingEvidenceUploaded(true); logActivity({actor:'J. Crocker',action:'Uploaded evidence for CAPA-2604-006',item:'CAPA-2604-006',type:'evidence'}) }} />
 <button type="button" onClick={() => blockingFileRef.current?.click()} className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger text-white hover:opacity-90 transition-opacity">Upload evidence</button>
 <button type="button" onClick={onShowBlockingCase} className="font-body text-[11px] px-3 py-1.5 text-muted hover:text-ink transition-colors" className="flex items-center gap-1">View case <ArrowRight size={10} /></button>
 </>
 ) : isAwaiting ? (
 confirming ? (
 <>
 <span className="font-body text-ink2 text-[10px]">Close {item.capaId}?</span>
 <button type="button" onClick={()=>setConfirming(false)} className="font-body text-[10px] px-2.5 py-1 border border-rule2 text-muted">Cancel</button>
 <button type="button" onClick={()=>{setClosedCases(p=>[...p,item.id]);logActivity({actor:'J. Crocker',action:`Approved and closed ${item.capaId}`,item:item.capaId,type:'capa'});setConfirming(false)}} className="font-body font-medium text-[10px] px-2.5 py-1 bg-ok text-white hover:opacity-90 transition-opacity">Confirm close</button>
 </>
 ) : (
 <>
 <button type="button" onClick={()=>setConfirming(true)} className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">Approve & close</button>
 <button type="button" className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors">Return</button>
 <button type="button" onClick={()=>onSelectCase(item)} className="font-body text-[11px] px-2 py-1 text-muted hover:text-ink transition-colors">View {item.evidenceFiles.length} files</button>
 </>
 )
 ) : (
 <>
 {escalated
 ? <span className="font-body text-ok text-[11px]">Escalated to director ✓</span>
 : <button type="button" onClick={()=>setEscalated(true)} className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">{item.primaryLabel}</button>
 }
 <button type="button" onClick={()=>onSelectCase(item)} className="font-body text-[11px] px-3 py-1.5 text-muted hover:text-ink transition-colors" className="flex items-center gap-1">Open case file <ArrowRight size={10} /></button>
 </>
 )}
 </div>
 </div>
 </div>
 )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CapaEngine() {
 const { closedCases, setClosedCases, blockingEvidenceUploaded, setBlockingEvidenceUploaded, activityLog, logActivity } = useAppState()
 const blockingFileRef = useRef(null)
 const [selectedCase, setSelectedCase] = useState(null)
 const [exportClicked, setExportClicked] = useState(false)
 const [escalated, setEscalated] = useState(false)
 const [showReassign, setShowReassign] = useState(false)
 const [reassignTarget, setReassignTarget] = useState('')
 const [reassignDone, setReassignDone] = useState(false)
 const [showBlockingCase, setShowBlockingCase] = useState(false)
 const visibleCases = openCases.filter(c => !closedCases.includes(c.id))
 const openCount = visibleCases.length
 const awaitingCount = visibleCases.filter(c => c.type === 'ca').length
 const closedCount = 14 + closedCases.length
 const overdueCount = visibleCases.filter(c => c.badge === 'Overdue').length

 const statCells = [
 { type: overdueCount > 0 ? 'sa' : 'so', label:'Open cases',
 value: String(openCount), sub: `${overdueCount} overdue`, pct: Math.round(openCount / 7 * 100) },
 { type: awaitingCount > 0 ? 'sw' : 'so', label:'Awaiting closure',
 value: String(awaitingCount), sub: awaitingCount > 0 ? 'Evidence submitted' : 'None pending', pct: awaitingCount > 0 ? 20 : 0 },
 { type:'so', label:'Closed this quarter', value: String(closedCount), sub:'All evidence-gated', pct:100 },
 { type:'sw', label:'CAPA closure rate', value:'78%', sub:'44th percentile', pct:44 },
 ]

 const sharedProps = {
 visibleCases,
 blockingEvidenceUploaded,
 setBlockingEvidenceUploaded,
 onSelectCase: setSelectedCase,
 onShowBlockingCase: () => setShowBlockingCase(true),
 }

 return (
 <div className="flex flex-col h-full overflow-hidden">
 {/* Shared slide-over panels */}
 <CaseDetailPanel caseData={selectedCase} onClose={() => setSelectedCase(null)} />
 {showBlockingCase && (
 <CaseDetailPanel
 caseData={{
 capaId:'CAPA-2604-006', title:'Pack Line QA pre-check — evidence missing',
 badge:'Incomplete', badgeColor:'text-danger', assigned:'QA Tech T. Osei',
 due:'Apr 16 — today', dueColor:'text-danger', source:'Manual — QA audit',
 rootCauseTags:['Documentation','QA process'], regulatory:['GMP 21 CFR 110','FSMA 204'],
 evidenceFiles:[],
 activity:[{ time:'Apr 16 · 09:00', text:'Case created. Pack Line QA pre-check log missing for this shift.' }],
 }}
 onClose={() => setShowBlockingCase(false)}
 />
 )}

 {/* Shared banner */}
 <ActionBanner
 color="#C4920A"
 headline="2 cases overdue — FDA inspection in 18 days"
 body="CAPA Engine · Salina Campus · April 16, 2026 · CAPA-2604-001 and CAPA-2604-002 past due."
 footer={showReassign && !reassignDone ? (
 <div className="flex items-center gap-2">
 <select
 aria-label="Reassign overdue cases to"
 value={reassignTarget}
 onChange={e => setReassignTarget(e.target.value)}
 className="font-body text-ink text-[11px] bg-white/90 border-0 px-2 py-1 flex-1 cursor-pointer"
 >
 <option value="">Reassign overdue cases to…</option>
 <option>M. Santos · Line 4 PM</option>
 <option>A. Novotny · QA Lead</option>
 <option>T. Osei · QA Tech</option>
 </select>
 <button type="button" disabled={!reassignTarget}
 onClick={() => { setReassignDone(true); setShowReassign(false) }}
 className="px-3 py-1 text-xs font-body font-medium bg-white text-[#C4920A] disabled:opacity-50">
 Confirm
 </button>
 </div>
 ) : null}
 >
 <button type="button" onClick={() => setEscalated(true)}
 className="px-3 py-1.5 text-xs font-body font-medium bg-white text-[#C4920A] hover:bg-white/90 transition-colors">
 {escalated ? 'All overdue escalated ✓' : 'Escalate all overdue'}
 </button>
 <button type="button" onClick={() => setShowReassign(p => !p)}
 className="px-3 py-1.5 text-xs font-body font-medium bg-white/20 text-white hover:bg-white/30 transition-colors">
 {reassignDone ? 'Reassigned ✓' : 'Bulk reassign'}
 </button>
 </ActionBanner>

 <StatBar cells={statCells} />

 {/* Evidence blocker banner */}
 {!blockingEvidenceUploaded && (
 <div className="flex items-center gap-3 px-4 py-2.5 bg-danger/10 border-b border-danger/30 flex-shrink-0">
 <AlertTriangle size={16} strokeWidth={2} className="text-danger flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="font-body text-[12px] font-medium text-danger">CAPA-2604-006 missing evidence — FDA audit export blocked</div>
 <div className="font-body text-danger/80 text-[10px] mt-0.5">Pack Line QA pre-check log has no attached file. Upload to unblock the FSMA 204 audit package.</div>
 </div>
 <input ref={blockingFileRef} type="file" className="hidden"
 onChange={() => { setBlockingEvidenceUploaded(true); logActivity({actor:'J. Crocker',action:'Uploaded evidence for CAPA-2604-006',item:'CAPA-2604-006',type:'evidence'}) }} />
 <button type="button" onClick={() => blockingFileRef.current?.click()}
 className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger text-white hover:opacity-90 transition-opacity flex-shrink-0">
 Upload evidence
 </button>
 </div>
 )}
 {blockingEvidenceUploaded && (
 <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body text-ok text-[11px] slide-in flex-shrink-0">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 CAPA-2604-006 evidence uploaded · FDA audit package unblocked · Export now available
 </div>
 )}

 <LayoutQueue {...sharedProps} />
 </div>
 )
}
