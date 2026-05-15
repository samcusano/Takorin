import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { FileText, BarChart2, ShieldCheck, Clock, Brain, Search } from 'lucide-react'
import StatBar from '../components/StatBar.jsx'
import { Check, X, AlertTriangle, ArrowRight, TrendingUp, ChevronRight } from 'lucide-react'
import { Urg, SecHd, SP, ActionBanner, Btn, Chip, HoldButton } from '../components/UI'
import { openCases, patternRows, benchmarks } from '../data/capa.js'
import { haccpData, goalsData } from '../data'
import { useAppState } from '../context/AppState'

const SHIFT_END = '22:00'
function shiftRelativeDue(due) {
 if (!due) return due
 if (due.includes('today') || due.includes('Apr 16')) return `Before shift end · ${SHIFT_END} · 7h 58m`
 return due
}

const CASE_BORDERS = { cu: 'border-l-danger', cw: 'border-l-warn', co: 'border-l-ok', ca: 'border-l-warn' }
const BADGE_BG = { 'text-danger': 'bg-danger/10', 'text-warn': 'bg-warn/10', 'text-ok': 'bg-ok/10' }

// ── Case detail slide-over panel ─────────────────────────────────────────────

function CaseDetailPanel({ caseData, onClose }) {
 const [localFiles, setLocalFiles] = useState([])
 const [actionTaken, setActionTaken] = useState(null)
 const { setClosedCases, logActivity } = useAppState()
 const fileInputRef = useRef(null)
 const panelRef = useRef(null)
 const { exiting, exit } = useExitAnimation(200)
 useFocusTrap(panelRef, !!caseData)

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
 <div className="fixed inset-0 bg-ink/30 z-40" onClick={() => exit(onClose)} />
 <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={`CAPA case — ${caseData.capaId}`} className={`fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-stone border-l border-rule2 z-50 flex flex-col ${exiting ? 'slide-right-out' : 'slide-right'}`}>
 <div className="flex items-start justify-between px-4 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
 <div>
 <div className="font-body text-[10px] text-muted mb-1">{caseData.capaId}</div>
 <div className="font-display text-base font-black text-ink">{caseData.title}</div>
 </div>
 <button type="button" onClick={() => exit(onClose)} aria-label="Close case detail" className="p-1 text-ghost hover:text-ink transition-colors duration-100 ease-standard flex-shrink-0">
 <X size={14} strokeWidth={2} aria-hidden="true" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto">
 <div className="grid grid-cols-2 gap-px bg-rule border-b border-rule2">
 {[{l:'Status',v:caseData.badge,vc:caseData.badgeColor},{l:'Assigned',v:caseData.assigned},{l:'Due date',v:caseData.due,vc:caseData.dueColor},{l:'Source',v:caseData.source}].map(m=>(
 <div key={m.l} className="bg-stone2 px-4 py-3">
 <div className="font-body text-[10px] text-muted mb-1">{m.l}</div>
 <div className={`font-body text-xs font-medium ${m.vc||'text-ink'}`}>{m.v}</div>
 </div>
 ))}
 </div>
 <div className="px-4 py-3 border-b border-rule2">
 <div className="font-body text-[10px] text-muted mb-2">Root cause</div>
 <div className="flex gap-1.5 flex-wrap">
 {caseData.rootCauseTags.map(t=><Chip key={t} tone="warn">{t}</Chip>)}
 </div>
 </div>
 <div className="px-4 py-3 border-b border-rule2">
 <div className="font-body text-[10px] text-muted mb-2">Regulatory mapping</div>
 <div className="flex gap-1.5 flex-wrap">
 {caseData.regulatory.map(r=><Chip key={r} tone="int">{r}</Chip>)}
 </div>
 </div>
 <div className="px-4 py-3 border-b border-rule2">
 <div className="flex items-center justify-between mb-2">
 <div className="font-body text-[10px] text-muted">Evidence files</div>
 <Urg level={allFiles.length > 0 ? 'ok' : 'critical'}>{allFiles.length > 0 ? `${allFiles.length} attached` : '0 of 1 required'}</Urg>
 </div>
 <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f=e.target.files[0]; if(f) setLocalFiles(p=>[...p,f.name]); e.target.value='' }} />
 {allFiles.length > 0 ? (
 <div className="space-y-1">
 {allFiles.map(f=>(
 <div key={f} className="flex items-center gap-2 py-1.5 border-b border-rule2 last:border-0">
 <FileText size={12} className="text-muted flex-shrink-0" />
 <span className="font-body text-[11px] text-muted">{f}</span>
 </div>
 ))}
 <Btn variant="secondary" className="mt-2" onClick={()=>fileInputRef.current?.click()}>Add another file</Btn>
 </div>
 ) : (
 <div className="flex flex-col items-center py-4 text-center gap-3">
 <FileText size={20} className="text-ghost" />
 <p className="font-body text-[11px] text-ghost">No evidence attached. Upload at least one file to close this case.</p>
 <Btn variant="primary" onClick={()=>fileInputRef.current?.click()}>Upload evidence</Btn>
 </div>
 )}
 </div>
 <div className="px-4 py-3">
 <div className="font-body text-[10px] text-muted mb-3">Activity log</div>
 {caseData.activity.map((a,i)=>(
 <div key={i} className="py-2 border-b border-rule2 last:border-0">
 <div className="font-body text-[10px] text-muted mb-0.5">{a.time}</div>
 <div className="font-body text-xs text-muted leading-relaxed">{a.text}</div>
 </div>
 ))}
 </div>
 </div>
 {actionTaken ? (
 <div className="px-4 py-3 border-t border-rule2 bg-ok/10 font-body text-ok text-xs slide-in flex-shrink-0">
 {actionTaken==='escalate' ? 'Escalated to director.' : 'Reassignment request sent.'}
 </div>
 ) : (
 <div className="flex gap-2 px-4 py-3 border-t border-rule2 bg-stone2 flex-shrink-0">
 <Btn variant="primary" onClick={()=>setActionTaken('escalate')}>Escalate to director</Btn>
 <Btn variant="secondary" onClick={()=>setActionTaken('reassign')}>Reassign</Btn>
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
 className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone2 transition-colors">
 <span className="font-body text-ghost text-[10px] uppercase tracking-widest">{label}</span>
 <span className={`text-ghost text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
 </button>
 {isOpen && <div className="border-t border-rule2 bg-stone">{children}</div>}
 </div>
 )
}

function PriorityQueueRow({ c, isSelected, onSelect, isEscalated, isResolved }) {
 const score = c.priorityScore || 0
 const borderColor = isSelected ? 'border-l-ochre'
 : score >= 80 ? 'border-l-danger' : score >= 55 ? 'border-l-warn' : 'border-l-rule2'
 const rowBg = isSelected ? 'bg-ochre/[0.04]'
 : score >= 80 && !isResolved && !isEscalated ? 'bg-danger/[0.015]' : ''

 return (
 <button type="button" onClick={onSelect}
 className={`w-full text-left border-b border-rule2 border-l-2 transition-colors ${borderColor} ${rowBg} ${isResolved || isEscalated ? 'opacity-50' : 'hover:bg-stone3'}`}>
 <div className="flex items-start gap-3 px-4 py-3">
 <div className="flex-1 min-w-0">
  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
  <Chip tone={isEscalated ? 'muted' : isResolved ? 'ok' : c.badgeColor === 'text-danger' ? 'danger' : c.badgeColor === 'text-ok' ? 'ok' : 'warn'}>
   {isEscalated ? 'Delegated' : isResolved ? 'Resolved' : c.badge}
  </Chip>
  <span className="font-body text-ghost text-[10px]">{c.capaId}</span>
  </div>
  <div className={`font-body font-medium text-[11px] leading-snug truncate ${isResolved || isEscalated ? 'text-muted' : 'text-ink'}`}>
  {c.title}
  </div>
  {c.due && !isResolved && !isEscalated && (
  <div className={`font-body text-[10px] mt-0.5 leading-snug ${c.dueColor || 'text-muted'}`}>
   {shiftRelativeDue(c.due)}
  </div>
  )}
  {c.priorityReason && !isResolved && !isEscalated && (
  <div className="font-body text-[10px] mt-0.5 leading-snug text-ghost">
   {c.priorityReason}
  </div>
  )}
  {isEscalated && (
  <div className="font-body text-[10px] mt-0.5 text-ghost">Delegated — moved to bottom</div>
  )}
 </div>
 {score > 0 && !isResolved && !isEscalated && (
  <div className={`display-num text-[13px] font-bold flex-shrink-0 tabular-nums ${
   score >= 80 ? 'text-danger/50' : score >= 55 ? 'text-warn/50' : 'text-ghost/40'
  }`}>
   {score}
  </div>
 )}
 </div>
 </button>
 )
}

function ClosureRecord({ record }) {
 return (
 <div className="px-4 py-5 border-b border-rule2 bg-ok/[0.04] slide-in">
  <div className="flex items-center gap-2 mb-4">
   <ShieldCheck size={14} strokeWidth={2} className="text-ok flex-shrink-0" />
   <span className="font-body font-medium text-ok text-[13px]">Case closed · Closure record generated</span>
  </div>
  <div className="space-y-2.5 bg-stone border border-ok/20 p-4">
   <div className="flex items-center justify-between border-b border-rule2 pb-2 mb-2">
    <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Closure record</span>
    <span className="font-body text-ghost text-[10px]">FDA 21 CFR 110</span>
   </div>
   {[
    ['Case ID', record.capaId],
    ['Closed by', record.closedBy],
    ['Closed at', record.closedAt],
    ['Root cause', record.rootCause],
   ].map(([k, v]) => (
    <div key={k} className="flex gap-3">
     <span className="font-body text-ghost text-[10px] w-24 flex-shrink-0 pt-px">{k}</span>
     <span className="font-body text-ink text-[11px] leading-snug">{v}</span>
    </div>
   ))}
   <div className="flex gap-3 pt-1 border-t border-rule2">
    <span className="font-body text-ghost text-[10px] w-24 flex-shrink-0 pt-px">Corrective measure</span>
    <span className="font-body text-ink text-[11px] leading-snug">{record.correctiveMeasure}</span>
   </div>
   <div className="flex gap-1.5 flex-wrap pt-1 border-t border-rule2">
    <span className="font-body text-ghost text-[10px] w-24 flex-shrink-0 pt-0.5">Regulatory</span>
    <div className="flex gap-1 flex-wrap">{record.regulatory.map(r => <Chip key={r} tone="int">{r}</Chip>)}</div>
   </div>
  </div>
 </div>
 )
}

function PriorityInlinePanel({ c, blockingEvidenceUploaded, setBlockingEvidenceUploaded, closedCases, setClosedCases, closureRecords, setClosureRecords, logActivity, onAdvance }) {
 const [openSection, setOpenSection] = useState(null)
 const [closureStep, setClosureStep] = useState(null)
 const [correctiveMeasure, setCorrectiveMeasure] = useState('')
 const [actionTaken, setActionTaken] = useState(null)
 const [localFiles, setLocalFiles] = useState([])
 const [detailTab, setDetailTab] = useState('details')
 const fileInputRef = useRef(null)

 const isBlocking = c.id === 'c-blocking'
 const isClosed = closedCases.includes(c.id)
 const closureRecord = closureRecords?.[c.id]
 const allFiles = [...(c.evidenceFiles || []), ...localFiles]
 const hasEvidence = allFiles.length > 0

 const toggleSection = (key) => setOpenSection(s => s === key ? null : key)

 const handleApprove = () => {
 const record = {
  capaId: c.capaId,
  closedBy: 'J. Crocker · Plant Director',
  closedAt: new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }),
  rootCause: c.rootCause,
  correctiveMeasure,
  regulatory: c.regulatory || [],
 }
 setClosedCases(p => [...p, c.id])
 setClosureRecords(p => ({ ...p, [c.id]: record }))
 logActivity({ actor:'J. Crocker', action:`Closed ${c.capaId} — corrective measure logged`, item:c.capaId, type:'capa' })
 setActionTaken('closed')
 setTimeout(onAdvance, 1200)
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
 <div className="flex flex-col h-full overflow-hidden content-reveal">
 {/* Case header */}
 <div className="px-4 py-4 border-b border-rule2 bg-stone2 flex-shrink-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-body text-muted text-[10px]">{c.capaId}</span>
 <Chip tone={c.badgeColor === 'text-danger' ? 'danger' : c.badgeColor === 'text-ok' ? 'ok' : 'warn'}>{c.badge}</Chip>
 </div>
 <div className="font-display text-lg font-black text-ink leading-tight">{c.title}</div>
 <div className="font-body text-muted text-[11px] mt-0.5">
 {c.assigned} · {c.due}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 {/* ── Recommended action (the operative section) ── */}
 {!isClosed && !actionTaken && (
 <div className={`px-4 py-5 border-b border-rule2 border-l-2 ${isBlocking ? 'border-l-danger bg-danger/[0.02]' : c.type === 'ca' ? 'border-l-ok bg-ok/[0.015]' : 'border-l-warn bg-stone2'}`}>
 <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-3">
 Recommended action
 </div>

 {/* Two-column impact context */}
 {(c.expectedImpact || c.riskIfIgnored) && (
 <div className="grid grid-cols-2 gap-4 mb-4">
 {c.expectedImpact && (
 <div className="flex items-start gap-2">
  <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
  <div>
   <div className="font-body text-ghost text-[10px] mb-1">If you act</div>
   <div className="font-body text-ink text-[12px] leading-snug">{c.expectedImpact}</div>
  </div>
 </div>
 )}
 {c.riskIfIgnored && (
 <div className="flex items-start gap-2">
  <X size={12} strokeWidth={2} className="text-danger flex-shrink-0 mt-0.5" />
  <div>
   <div className="font-body text-ghost text-[10px] mb-1">If you delay</div>
   <div className="font-body text-ink text-[12px] leading-snug">{c.riskIfIgnored}</div>
  </div>
 </div>
 )}
 </div>
 )}

 {/* Recommended action button — below impact context */}
 {isBlocking ? (
 <>
 <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
 <button type="button" onClick={() => fileInputRef.current?.click()}
 className="w-full font-body font-medium text-[12px] px-4 py-3 bg-ink text-stone hover:bg-ink2 transition-colors text-left flex items-center justify-between">
 <span>{c.recommendedAction}</span>
 <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
 </button>
 </>
 ) : c.type === 'ca' ? (
 closureStep === 'measure' ? (
 <div className="space-y-3">
  <div>
   <div className="font-body text-ghost text-[10px] mb-1">Root cause confirmed</div>
   <div className="font-body text-ink2 text-[11px] px-3 py-2 bg-stone border border-rule2">{c.rootCause}</div>
  </div>
  <div>
   <div className="font-body text-ghost text-[10px] mb-1">Corrective measure <span className="text-danger">*</span></div>
   <textarea
    value={correctiveMeasure}
    onChange={e => setCorrectiveMeasure(e.target.value)}
    placeholder="Describe what was done to resolve this case and prevent recurrence…"
    rows={3}
    className="w-full font-body text-ink text-[11px] bg-stone border border-rule2 px-3 py-2 resize-none focus:border-ink outline-none"
   />
  </div>
  <HoldButton
   label="Hold to close case — logged as regulatory action"
   holdLabel="Keep holding to confirm closure…"
   doneLabel="Closed"
   duration={2000}
   tone="ok"
   disabled={!correctiveMeasure.trim()}
   onConfirm={handleApprove}
  />
  <button type="button" onClick={() => setClosureStep(null)} className="font-body text-ghost text-[10px] hover:text-muted transition-colors">← Back</button>
 </div>
 ) : (
 <button type="button" onClick={() => setClosureStep('measure')}
 className="w-full font-body font-medium text-[12px] px-4 py-3 bg-ink text-stone hover:bg-ink2 transition-colors text-left flex items-center justify-between">
 <span>{c.recommendedAction || 'Approve & close case'}</span>
 <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
 </button>
 )
 ) : (
 <button type="button" onClick={handleEscalate}
 className="w-full font-body font-medium text-[12px] px-4 py-3 bg-ink text-stone hover:bg-ink2 transition-colors text-left flex items-center justify-between">
 <span>{c.recommendedAction || c.primaryLabel}</span>
 <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
 </button>
 )}
 </div>
 )}

 {/* Success confirmation */}
 {actionTaken === 'closed' && closureRecord && (
 <ClosureRecord record={closureRecord} />
 )}
 {actionTaken && actionTaken !== 'closed' && (
 <div className="px-4 py-5 bg-ok/10 border-b border-ok/20 slide-in">
 <div className="flex items-center gap-2 mb-1">
 <Check size={12} strokeWidth={2} className="text-ok flex-shrink-0" />
 <span className="font-body font-medium text-ok text-[13px]">
 {actionTaken === 'uploaded' ? 'Evidence uploaded.' : 'Action delegated.'}
 </span>
 </div>
 <div className="font-body text-ok/70 text-[11px]">
 {actionTaken === 'uploaded' ? 'FDA audit package unblocked. Queue updated.'
 : `${c.capaId} delegated. Moving to next item.`}
 </div>
 </div>
 )}

 {/* Tab bar */}
 <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0">
 {[
  { id: 'details', label: 'Details' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'activity', label: `Activity` },
 ].map(tab => (
  <button key={tab.id} type="button"
  onClick={() => setDetailTab(tab.id)}
  className={`px-4 py-2 font-body text-[10px] uppercase tracking-widest font-medium border-b-2 transition-colors cursor-pointer ${
   detailTab === tab.id ? 'border-b-ochre text-ink' : 'border-b-transparent text-ghost hover:text-muted'
  }`}>
  {tab.label}
  </button>
 ))}
 </div>

 {/* Details tab */}
 {detailTab === 'details' && (
 <div className="px-4 py-4 space-y-4 border-b border-rule2">
  {c.description && (
  <div>
   <div className="font-body text-ghost text-[10px] mb-0.5">Description</div>
   <p className="font-body text-muted text-[11px] leading-relaxed">{c.description}</p>
  </div>
  )}
  <div>
  <div className="font-body text-ghost text-[10px] mb-1.5">Regulatory</div>
  <div className="flex gap-1.5 flex-wrap">
   {(c.regulatory||[]).map(r => <Chip key={r} tone="int">{r}</Chip>)}
  </div>
  </div>
  <div>
  <div className="font-body text-ghost text-[10px] mb-1.5">Root cause tags</div>
  <div className="flex gap-1.5 flex-wrap">
   {(c.rootCauseTags||[]).map(t => <Chip key={t} tone="warn">{t}</Chip>)}
  </div>
  </div>
 </div>
 )}

 {/* Evidence tab */}
 {detailTab === 'evidence' && (
 <div className="px-4 py-4 border-b border-rule2">
  <div className="flex items-center justify-between mb-2">
   <div className="font-body text-ghost text-[10px]">Evidence files</div>
   <Urg level={allFiles.length > 0 ? 'ok' : c.type === 'ca' ? 'warn' : 'info'}>
   {allFiles.length > 0 ? `${allFiles.length} filed` : 'None attached'}
   </Urg>
  </div>
  {allFiles.length > 0 ? allFiles.map(f => (
   <div key={f} className="flex items-center gap-2 py-1.5 border-b border-rule2 last:border-0">
   <FileText size={11} className="text-muted flex-shrink-0" />
   <span className="font-body text-[11px] text-muted">{f}</span>
   </div>
  )) : (
   <div className="font-body text-ghost text-[11px] mb-2">No files attached.</div>
  )}
  <Btn variant="secondary" className="mt-2" onClick={() => fileInputRef.current?.click()}>
   {allFiles.length > 0 ? 'Add file' : 'Upload evidence'}
  </Btn>
 </div>
 )}

 {/* Activity tab */}
 {detailTab === 'activity' && (
 <div className="px-4 py-2">
  {(c.activity||[]).map((a, i) => (
  <div key={i} className="py-2.5 border-b border-rule2 last:border-0">
   <div className="font-body text-[10px] text-muted mb-0.5">{a.time}</div>
   <div className="font-body text-[11px] text-ink2 leading-relaxed">{a.text}</div>
  </div>
  ))}
 </div>
 )}

 </div>
 </div>
 )
}

function LayoutQueue({ visibleCases, blockingEvidenceUploaded, setBlockingEvidenceUploaded }) {
 const { closedCases, setClosedCases, closureRecords, setClosureRecords, logActivity } = useAppState()
 const [escalatedIds, setEscalatedIds] = useState(new Set())
 const [searchQuery, setSearchQuery] = useState('')

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

 const filteredQueue = searchQuery
  ? sortedQueue.filter(c =>
     c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (c.capaId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (c.assigned || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  : sortedQueue

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

 {/* Search */}
 <div className="px-3 py-2 border-b border-rule2 flex-shrink-0">
  <div className="flex items-center gap-2 bg-stone2 px-2 py-1.5 border border-rule2">
   <Search size={11} strokeWidth={2} className="text-ghost flex-shrink-0" />
   <input
    type="text"
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
    placeholder="Search cases…"
    aria-label="Search CAPA cases"
    className="flex-1 font-body text-[11px] text-ink bg-transparent outline-none placeholder:text-ghost"
   />
   {searchQuery && (
    <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-ghost hover:text-muted transition-colors">
     <X size={10} strokeWidth={2} />
    </button>
   )}
  </div>
 </div>

 {/* Model ranking signal */}
 <div className="px-4 py-2.5 border-b border-rule2 bg-stone2 flex items-center gap-2 flex-shrink-0">
  <Brain size={10} strokeWidth={1.75} className="text-ghost flex-shrink-0" />
  <span className="font-body text-ghost text-[10px]">
   Ranked by priority score · <span className="text-muted font-medium">88%</span> model confidence · FDA deadline + evidence gaps weighted highest
  </span>
 </div>

 {/* Ranked items */}
 {(searchQuery ? filteredQueue : sortedQueue).map((c) => (
 <PriorityQueueRow
 key={c.id}
 c={c}
 isSelected={selectedId === c.id}
 onSelect={() => setSelectedId(c.id)}
 isEscalated={escalatedIds.has(c.id)}
 isResolved={closedCases.includes(c.id) || (c.id === 'c-blocking' && blockingEvidenceUploaded)}
 />
 ))}

 {sortedQueue.length === 0 && (
 <div className="flex-1 flex items-center justify-center px-4 text-center">
 <div>
 <div className="font-display font-bold text-ok text-2xl mb-1">All clear</div>
 <div className="font-body text-ghost text-[11px]">No open cases.</div>
 </div>
 </div>
 )}
 {sortedQueue.length > 0 && searchQuery && filteredQueue.length === 0 && (
 <div className="px-4 py-8 text-center font-body text-ghost text-[11px]">No cases match "{searchQuery}"</div>
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
 closureRecords={closureRecords}
 setClosureRecords={setClosureRecords}
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

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CapaEngine() {
 const { closedCases, setClosedCases, blockingEvidenceUploaded, setBlockingEvidenceUploaded, logActivity } = useAppState()
 const [escalated, setEscalated] = useState(false)
 const [showReassign, setShowReassign] = useState(false)
 const [reassignTarget, setReassignTarget] = useState('')
 const [reassignDone, setReassignDone] = useState(false)
 const visibleCases = openCases.filter(c => !closedCases.includes(c.id))
 const openCount = visibleCases.length
 const awaitingCount = visibleCases.filter(c => c.type === 'ca').length
 const closedCount = 14 + closedCases.length
 const overdueCount = visibleCases.filter(c => c.badge === 'Overdue').length

 const statCells = [
 { type: overdueCount > 0 ? 'sa' : 'so', label:'Overdue',
 value: String(overdueCount), sub: 'Past due date', pct: Math.round(overdueCount / 4 * 100) },
 { type: openCount > 0 ? 'sw' : 'so', label:'Open cases',
 value: String(openCount), sub: 'Active queue', pct: Math.round(openCount / 7 * 100) },
 { type: awaitingCount > 0 ? 'sw' : 'so', label:'Awaiting closure',
 value: String(awaitingCount), sub: awaitingCount > 0 ? 'Evidence submitted' : 'None pending', pct: awaitingCount > 0 ? 20 : 0 },
 { type:'so', label:'Closed this quarter', value: String(closedCount), sub:'All evidence-gated', pct:100 },
 ]

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">

 {/* Shared banner */}
 <ActionBanner
 tone="warn"
 headline="2 cases overdue — FDA inspection in 18 days"
 body="CAPA Engine · Salina Campus · April 16, 2026 · CAPA-2604-001 and CAPA-2604-002 past due."
 footer={showReassign && !reassignDone ? (
 <div className="flex items-center gap-2">
 <select
 aria-label="Reassign overdue cases to"
 value={reassignTarget}
 onChange={e => setReassignTarget(e.target.value)}
 className="font-body text-ink text-[11px] bg-stone border border-rule2 px-2 py-1 flex-1 cursor-pointer"
 >
 <option value="">Reassign overdue cases to…</option>
 <option>M. Santos · Line 4 PM</option>
 <option>A. Novotny · QA Lead</option>
 <option>T. Osei · QA Tech</option>
 </select>
 <Btn variant="primary" disabled={!reassignTarget} onClick={() => { setReassignDone(true); setShowReassign(false) }}>Confirm</Btn>
 </div>
 ) : null}
 >
 <Btn variant="primary" onClick={() => setEscalated(true)}>{escalated ? 'All overdue escalated ✓' : 'Escalate all overdue'}</Btn>
 <Btn variant="secondary" onClick={() => setShowReassign(p => !p)}>{reassignDone ? 'Reassigned ✓' : 'Bulk reassign'}</Btn>
 </ActionBanner>

 <StatBar cells={statCells} />

 <LayoutQueue
  visibleCases={visibleCases}
  blockingEvidenceUploaded={blockingEvidenceUploaded}
  setBlockingEvidenceUploaded={setBlockingEvidenceUploaded}
 />
 </div>
 )
}
