import React, { useState, useRef, useEffect } from 'react'
import { FileText } from 'lucide-react'
import StatBar from '../components/StatBar.jsx'
import PatternMatrix from '../components/PatternMatrix.jsx'
import BenchmarkBlock from '../components/BenchmarkBlock.jsx'
import { Urg, SecHd } from '../components/UI'
import { openCases, patternRows, benchmarks } from '../data/capa.js'
import { supplierData, haccpData, goalsData } from '../data'
import { useAppState } from '../context/AppState'

const CASE_BORDERS = { cu: 'border-l-danger', cw: 'border-l-warn', co: 'border-l-ok', ca: 'border-l-warn' }

function CaseDetailPanel({ caseData, onClose }) {
  const [localFiles, setLocalFiles] = useState([])
  const [actionTaken, setActionTaken] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (actionTaken) {
      const id = setTimeout(onClose, 1500)
      return () => clearTimeout(id)
    }
  }, [actionTaken])

  if (!caseData) return null

  const allFiles = [...caseData.evidenceFiles, ...localFiles]

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setLocalFiles(prev => [...prev, file.name])
    e.target.value = ''
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/30 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-stone border-l border-rule z-50 flex flex-col slide-right">
        <div className="flex items-start justify-between px-5 py-4 border-b border-rule bg-stone2 flex-shrink-0">
          <div>
            <div className="font-body text-[10px] italic text-ghost mb-1">{caseData.capaId}</div>
            <div className="font-display text-base font-black italic text-ink">{caseData.title}</div>
          </div>
          <button onClick={onClose} className="p-1 text-ghost hover:text-ink transition-colors flex-shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-px bg-rule border-b border-rule">
            {[{l:'Status',v:caseData.badge,vc:caseData.badgeColor},{l:'Assigned',v:caseData.assigned},{l:'Due date',v:caseData.due,vc:caseData.dueColor},{l:'Source',v:caseData.source}].map(m=>(
              <div key={m.l} className="bg-stone2 px-4 py-3">
                <div className="font-body text-[10px] italic text-ghost mb-1">{m.l}</div>
                <div className={`font-body text-xs font-medium ${m.vc || 'text-ink'}`}>{m.v}</div>
              </div>
            ))}
          </div>
          {/* Root cause */}
          <div className="px-5 py-3 border-b border-rule">
            <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-2">Root cause taxonomy</div>
            <div className="flex gap-1.5 flex-wrap">
              {caseData.rootCauseTags.map(t=><span key={t} className="font-body text-[10px] px-2 py-0.5 bg-warn/10 text-warn">{t}</span>)}
            </div>
          </div>
          {/* Regulatory */}
          <div className="px-5 py-3 border-b border-rule">
            <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-2">Regulatory mapping</div>
            <div className="flex gap-1.5 flex-wrap">
              {caseData.regulatory.map(r=><span key={r} className="font-body text-[10px] px-2 py-0.5 bg-int/10 text-int">{r}</span>)}
            </div>
          </div>
          {/* Evidence */}
          <div className="px-5 py-3 border-b border-rule">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost">Evidence files</div>
              <Urg level={allFiles.length > 0 ? 'ok' : 'critical'}>
                {allFiles.length > 0 ? `${allFiles.length} attached` : '0 of 1 required'}
              </Urg>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            {allFiles.length > 0 ? (
              <div className="space-y-1">
                {allFiles.map(f => (
                  <div key={f} className="flex items-center gap-2 py-1.5 border-b border-rule last:border-0">
                    <FileText size={12} className="text-muted flex-shrink-0" />
                    <span className="font-body text-[11px] text-muted">{f}</span>
                  </div>
                ))}
                <button className="font-body font-medium text-[11px] px-3 py-1.5 mt-2 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  Add another file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center gap-3">
                <FileText size={20} className="text-ghost" />
                <p className="font-body italic text-[11px] text-ghost">No evidence attached. This case cannot be closed until at least one file is uploaded.</p>
                <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                  Upload evidence
                </button>
              </div>
            )}
          </div>
          {/* Activity log */}
          <div className="px-5 py-3">
            <div className="text-[9px] font-body font-medium uppercase tracking-widest text-ghost mb-3">Activity log</div>
            {caseData.activity.map((a,i)=>(
              <div key={i} className="py-2 border-b border-rule last:border-0">
                <div className="font-body text-[10px] italic text-ghost mb-0.5">{a.time}</div>
                <div className="font-body text-xs text-muted leading-relaxed">{a.text}</div>
              </div>
            ))}
          </div>
        </div>
        {actionTaken ? (
          <div className="px-5 py-3 border-t border-rule bg-ok/10 font-body italic text-ok text-xs slide-in flex-shrink-0">
            {actionTaken === 'escalate' ? 'Escalated to director — notification sent.' : 'Reassignment request sent.'}
          </div>
        ) : (
          <div className="flex gap-2 px-5 py-3 border-t border-rule bg-stone2 flex-shrink-0">
            <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity" onClick={() => setActionTaken('escalate')}>Escalate to director</button>
            <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={() => setActionTaken('reassign')}>Reassign</button>
          </div>
        )}
      </aside>
    </>
  )
}

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
  const [confirmingClose, setConfirmingClose] = useState(null)

  const openCount = 7 - closedCases.length
  const awaitingCount = openCases.filter(c => c.type === 'ca' && !closedCases.includes(c.id)).length
  const closedCount = 14 + closedCases.length

  const statCells = [
    { type: closedCases.length > 0 ? 'so' : 'sa', label: 'Open cases',
      value: String(openCount), sub: `${Math.min(2, openCount)} overdue`, pct: Math.round(openCount / 7 * 100) },
    { type: awaitingCount > 0 ? 'sw' : 'so', label: 'Awaiting closure',
      value: String(awaitingCount), sub: awaitingCount > 0 ? 'Evidence submitted' : 'None pending', pct: awaitingCount > 0 ? 20 : 0 },
    { type: 'so', label: 'Closed this quarter',
      value: String(closedCount), sub: 'All evidence-gated', pct: 100 },
    { type: 'sw', label: 'CAPA closure rate', value: '78%', sub: '44th percentile', pct: 44 },
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Case detail panels */}
      <CaseDetailPanel caseData={selectedCase} onClose={() => setSelectedCase(null)} />
      {showBlockingCase && (
        <CaseDetailPanel
          caseData={{
            capaId: 'CAPA-2604-006', title: 'Pack Line QA pre-check — evidence missing',
            badge: 'Incomplete', badgeColor: 'text-danger', assigned: 'QA Tech T. Osei',
            due: 'Apr 16 — today', dueColor: 'text-danger', source: 'Manual — QA audit',
            rootCauseTags: ['Documentation', 'QA process'], regulatory: ['GMP 21 CFR 110', 'FSMA 204'],
            evidenceFiles: [],
            activity: [
              { time: 'Apr 16 · 09:00', text: 'Case created. Pack Line QA pre-check log missing for this shift.' },
            ],
          }}
          onClose={() => setShowBlockingCase(false)}
        />
      )}

      {/* Action banner */}
      <div className="flex flex-wrap items-start gap-4 px-5 py-3.5 flex-shrink-0" style={{ background: '#C4920A' }}>
        <div className="flex-1 min-w-0">
          <div className="font-display text-base font-bold italic text-stone mb-0.5">2 cases overdue — FDA inspection in 18 days</div>
          <div className="font-body italic text-stone/80 text-[12px]">CAPA Engine · Salina Campus · April 16, 2026 · CAPA-2604-001 and CAPA-2604-002 past due.</div>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={() => setEscalated(true)}
            className="px-3 py-1.5 text-xs font-body font-medium bg-white text-[#C4920A] hover:bg-white/90 transition-colors"
          >
            {escalated ? 'All overdue escalated ✓' : 'Escalate all overdue'}
          </button>
          <button
            onClick={() => setShowReassign(p => !p)}
            className="px-3 py-1.5 text-xs font-body font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            {reassignDone ? 'Reassigned ✓' : 'Bulk reassign'}
          </button>
        </div>
        {showReassign && !reassignDone && (
          <div className="flex items-center gap-2 w-full mt-2">
            <select
              value={reassignTarget}
              onChange={e => setReassignTarget(e.target.value)}
              className="font-body italic text-ink text-[11px] bg-white/90 border-0 px-2 py-1 flex-1 cursor-pointer"
            >
              <option value="">Reassign overdue cases to…</option>
              <option>M. Santos · Line 4 PM</option>
              <option>A. Novotny · QA Lead</option>
              <option>T. Osei · QA Tech</option>
            </select>
            <button
              disabled={!reassignTarget}
              onClick={() => { setReassignDone(true); setShowReassign(false) }}
              className="px-3 py-1 text-xs font-body font-medium bg-white text-[#C4920A] disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        )}
      </div>

      <StatBar cells={statCells} />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto divide-y divide-rule">

          {/* Evidence blocker banner */}
          {!blockingEvidenceUploaded && (
            <div className="flex items-center gap-3 px-4 py-3 bg-danger/10 border-b border-danger/30">
              <svg className="w-4 h-4 stroke-danger flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-body text-[12px] font-medium text-danger">CAPA-2604-006 missing evidence — FDA audit export blocked</div>
                <div className="font-body italic text-danger/80 text-[10px] mt-0.5">Pack Line QA pre-check log has no attached file. Upload to unblock the FSMA 204 audit package.</div>
              </div>
              <input ref={blockingFileRef} type="file" className="hidden" onChange={() => { setBlockingEvidenceUploaded(true); logActivity({ actor:'J. Crocker', action:'Uploaded evidence for CAPA-2604-006', item:'CAPA-2604-006', type:'evidence' }) }} />
              <button
                onClick={() => blockingFileRef.current?.click()}
                className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger text-white hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Upload evidence
              </button>
            </div>
          )}
          {blockingEvidenceUploaded && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body italic text-ok text-[11px] slide-in">
              <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              CAPA-2604-006 evidence uploaded · FDA audit package unblocked · Export now available
            </div>
          )}

          {/* Open docket — grouped by status */}
          <div>
            <SecHd tag="Open docket" title="Active corrective actions — grouped by status" badge={<Urg level="warn">7 active</Urg>} />
            {[
              { label:'Overdue', sub:'Director action required — past due date', level:'critical', filter: c => c.badge === 'Overdue' },
              { label:'Awaiting your approval', sub:'Evidence submitted — pending closure sign-off', level:'warn', filter: c => c.type === 'ca' && c.badge !== 'Overdue' },
              { label:'In progress', sub:'Assigned and active — no director action yet', level:'info', filter: c => c.badge !== 'Overdue' && c.type !== 'ca' },
            ].map(group => {
              const groupCases = openCases.filter(c => !closedCases.includes(c.id) && group.filter(c))
              if (groupCases.length === 0) return null
              return (
                <div key={group.label}>
                  <div className="flex items-baseline gap-3 px-4 py-2 bg-stone2 border-b border-rule2">
                    <span className="font-body italic text-muted text-[11px]">{group.label}</span>
                    <span className="font-body italic text-ghost text-[10px] flex-1">{group.sub}</span>
                    <Urg level={group.level}>{groupCases.length}</Urg>
                  </div>
                  {groupCases.map(c => (
              <div key={c.id} className={`border-l-2 ${CASE_BORDERS[c.type]} border-b border-rule ${c.type==='cu'?'bg-danger/[0.02]':''} ${c.type==='ca'?'bg-warn/[0.02]':''}`}>
                <div className="grid grid-cols-[28px_1fr] gap-3 p-4">
                  <div className={`font-display text-base font-black italic pt-0.5 ${c.type==='cu'?'text-danger':'text-ghost'}`}>{c.ordinal}</div>
                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <span className="font-body text-[10px] italic text-ghost">{c.capaId} · {c.source}</span>
                      <span className={`font-body text-[9px] font-medium px-1.5 py-0.5 inline-flex items-center gap-1 ${c.badgeColor} ${c.badgeColor.includes('danger') ? 'bg-danger/10' : 'bg-warn/10'}`}>
                        <span className="w-1 h-1 rounded-full bg-current"/>
                        {c.badge}
                      </span>
                    </div>
                    <h3
                      className="font-body text-sm font-medium text-ink mb-1.5 cursor-pointer hover:text-ochre transition-colors"
                      onClick={() => setSelectedCase(c)}
                    >
                      {c.title}
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      {[{l:'Assigned',v:c.assigned},{l:'Root cause',v:c.rootCause},{l:'Due',v:c.due,vc:c.dueColor}].map(m=>(
                        <div key={m.l}>
                          <div className="text-[9px] font-body italic text-ghost">{m.l}</div>
                          <div className={`font-body text-[11px] ${m.vc||'text-ink'}`}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    <p className="font-body text-xs italic text-muted leading-relaxed mb-3">{c.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {c.type === 'ca' ? (
                        <>
                          {confirmingClose === c.id ? (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-ok/5 border border-ok/20 w-full slide-in">
                              <p className="font-body italic text-ink2 text-[11px] flex-1">Close {c.capaId}? This is logged as a regulatory action.</p>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => setConfirmingClose(null)} className="font-body italic text-[11px] px-3 py-1.5 border border-rule2 text-ink2 hover:border-ghost transition-colors">Cancel</button>
                                <button onClick={() => { setClosedCases(prev => [...prev, c.id]); logActivity({ actor:'J. Crocker', action:`Approved and closed ${c.capaId}`, item:c.capaId, type:'capa' }); setConfirmingClose(null) }} className="font-body font-medium text-[11px] px-3 py-1.5 bg-ok text-white hover:opacity-90 transition-opacity">Confirm close</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => setConfirmingClose(c.id)} className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">Approve &amp; close case</button>
                              <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors">Return — insufficient evidence</button>
                              <button className="font-body italic text-[11px] px-3 py-1.5 text-muted hover:text-ink transition-colors">View {c.evidenceFiles.length} evidence files</button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">{c.primaryLabel}</button>
                          <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors">{c.secondaryLabel}</button>
                          <button onClick={() => setSelectedCase(c)} className="font-body italic text-[11px] px-3 py-1.5 text-muted hover:text-ink transition-colors">Open case file →</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Pattern matrix */}
          <div>
            <SecHd tag="Patterns" title="Root cause frequency — trailing 90 days, all lines" badge={<Urg level="warn">3 patterns exceed threshold</Urg>} />
            <PatternMatrix rows={patternRows} />
            <div className="px-4 py-2.5 border-t border-rule font-body text-[11px] italic text-ghost">
              Skill/Certification Mismatch: 29% of all CAPAs. 7 of 9 cases at Sauce Dosing, Lines 4 and 6.
            </div>
          </div>

          {/* Regulatory risk digest */}
          <div>
            <SecHd tag="Regulatory exposure" title="Active regulatory risk by framework — open CAPAs mapped" />
            <div className="divide-y divide-rule">
              {haccpData.regulatoryDigest.map((r, i) => (
                <div key={i} className={`grid items-center px-4 py-2.5 ${r.highestRisk === 'danger' ? 'bg-danger/[0.02]' : ''}`}
                  style={{ gridTemplateColumns: '180px 40px 1fr' }}>
                  <div className="font-body text-[12px] font-medium text-ink">{r.framework}</div>
                  <div className={`display-num text-base text-right ${r.highestRisk === 'danger' ? 'text-danger' : r.highestRisk === 'warn' ? 'text-warn' : 'text-ok'}`}>
                    {r.openCAPAs}
                  </div>
                  <div className="font-body italic text-ghost text-[10px] pl-4 leading-relaxed">
                    {r.topAction || 'No open items'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit package */}
          <div>
            <SecHd tag="Audit package" title="FSMA 204 audit export — auto-assembled from CAPA register" />
            <div className="p-4">
              <div className="border border-rule border-l-2 border-l-ok p-4">
                <div className="font-display text-sm font-black italic text-ok mb-1.5">FDA Compliance Package · Salina Plant · Q2 2026</div>
                <p className="font-body text-xs italic text-muted mb-3 leading-relaxed">
                  Takorin has assembled all open and closed CAPA records, evidence files, root cause tags, and closure timestamps. One blocking item prevents export: CAPA-2604-006 has no evidence file attached.
                </p>
                <div className="space-y-1.5 mb-3">
                  {[
                    {ok:true,  text:'14 closed CAPAs — all evidence-gated'},
                    {ok:true,  text:'Root cause frequency report — 90-day trailing'},
                    {ok:true,  text:'Regulatory mapping — FSMA 204, HACCP, GMP, Sanitation'},
                    {ok:true,  text:'Supplier non-conformance log — all documented incidents'},
                    {ok:false, text:'CAPA-2604-006 — missing evidence file (blocks export)'},
                    {ok:true,  text:'Industry benchmark percentile report'},
                  ].map((item,i) => (
                    <div key={i} className={`flex items-center gap-2 font-body text-xs ${item.ok ? 'text-muted' : 'text-danger'}`}>
                      <span>{item.ok ? '✓' : '!'}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
                {/* Pre-flight checklist */}
                <div className="mb-3 border border-rule">
                  <div className="px-3 py-2 bg-stone2 border-b border-rule font-body italic text-ghost text-[9px] uppercase tracking-widest">Audit pre-flight</div>
                  {[
                    { ok: true,                        text: 'Sanitation records — all AM shifts current' },
                    { ok: blockingEvidenceUploaded,    text: 'CAPA-2604-006 — evidence file attached', action: !blockingEvidenceUploaded ? () => setShowBlockingCase(true) : null, actionLabel: 'Resolve →' },
                    { ok: false,                       text: 'Overdue CAPAs — 2 cases past due date' },
                    { ok: true,                        text: 'HACCP regulatory mapping — complete' },
                    { ok: true,                        text: 'Supplier non-conformance log — documented' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 border-b border-rule last:border-b-0 font-body text-[11px] ${item.ok ? 'text-muted' : 'text-danger'}`}>
                      <span className="flex-shrink-0">{item.ok ? '✓' : '✗'}</span>
                      <span className="flex-1">{item.text}</span>
                      {item.action && <button onClick={item.action} className="font-body italic text-int text-[10px] hover:underline flex-shrink-0">{item.actionLabel}</button>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => blockingEvidenceUploaded && setExportClicked(true)}
                    disabled={!blockingEvidenceUploaded}
                    className={`text-xs font-body font-medium px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      exportClicked ? 'bg-danger/10 text-danger' : blockingEvidenceUploaded ? 'bg-ok text-white hover:opacity-90' : 'bg-stone3 text-ghost'
                    }`}
                  >
                    {exportClicked ? 'Blocked — 2 overdue CAPAs' : blockingEvidenceUploaded ? 'Export audit package' : 'Resolve pre-flight items first'}
                  </button>
                  {!blockingEvidenceUploaded && <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors" onClick={() => setShowBlockingCase(true)}>Resolve CAPA-2604-006</button>}
                </div>
                <div className="font-body text-[10px] italic text-ghost mt-3 pt-3 border-t border-rule">
                  Package covers Jan 1 – Apr 16, 2026 · 28 pages · FDA Region 7 format · Auto-generated from CAPA register.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side rail */}
        <div className="w-64 flex-shrink-0 border-l border-rule bg-stone2 overflow-y-auto hidden lg:block divide-y divide-rule">
          {/* Pending review */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Pending my review</span></div>
            {[{name:'Sanitation log — Line 6',sub:'CAPA-2604-003 · 4 files · action required',st:'Review',stC:'text-warn'},{name:'Oven temp deviation — Line 3',sub:'CAPA-2604-005 · 2 files',st:'Review',stC:'text-warn'},{name:'Pack Line QA pre-check',sub:'CAPA-2604-006 · evidence file missing',st:'Incomplete',stC:'text-danger'}].map(r=>(
              <div key={r.name} className="flex items-start gap-2 px-4 py-2.5 border-b border-rule last:border-0 hover:bg-stone3 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-body text-xs font-medium text-ink">{r.name}</div>
                  <div className="font-body text-[9px] italic text-ghost">{r.sub}</div>
                </div>
                <span className={`font-body text-[9px] font-semibold flex-shrink-0 ${r.stC}`}>{r.st}</span>
              </div>
            ))}
          </div>

          {/* Supplier compliance */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule">
              <span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Supplier compliance</span>
            </div>
            {supplierData.suppliers.map(s => (
              <div key={s.rank} className="flex items-center gap-2 px-4 py-2.5 border-b border-rule last:border-0">
                <span className="display-num text-[11px] text-ghost w-4">{s.rank}</span>
                <span className="font-body font-medium text-ink text-[12px] flex-1">{s.name}</span>
                <span className={`font-body italic font-medium text-[9px] px-1.5 py-0.5 ${
                  s.tierTone === 'ok' ? 'bg-ok/10 text-ok' : s.tierTone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-int/10 text-int'
                }`}>{s.tier}</span>
                <span className={`display-num text-sm w-6 text-right ${s.scoreColor}`}>{s.score}</span>
              </div>
            ))}
          </div>

          {/* Regulatory mapping */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Regulatory mapping</span></div>
            {[{name:'FSMA 204',sub:'21 CFR Part 1 Subpart S',v:'5',c:'text-warn'},{name:'HACCP',sub:'21 CFR 120.7',v:'4',c:'text-warn'},{name:'GMP — Personnel',sub:'21 CFR 110.10',v:'4',c:'text-warn'},{name:'Sanitation',sub:'21 CFR 110.35',v:'3',c:'text-danger'}].map(r=>(
              <div key={r.name} className="flex items-center gap-2 px-4 py-2.5 border-b border-rule last:border-0">
                <div className="flex-1 min-w-0"><div className="font-body text-xs font-medium text-ink">{r.name}</div><div className="font-body text-[9px] italic text-ghost">{r.sub}</div></div>
                <span className={`font-display text-base font-black italic ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>

          {/* Evidence coverage */}
          <div className="p-4">
            <div className="font-body text-[10px] font-medium uppercase tracking-widest text-ghost mb-3">Evidence coverage</div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="font-body text-xs italic text-ghost">14 closed · all evidence-gated</span>
              <span className="font-display text-xl font-black italic text-ok">100%</span>
            </div>
            <div className="h-0.5 bg-rule"><div className="h-full bg-ok w-full"/></div>
            <div className="font-body text-[10px] italic text-ghost mt-2">No CAPA closed without evidence since deployment.</div>
          </div>

          {/* QA tech queue */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">T. Osei — my assignments</span></div>
            {openCases.filter(c => c.assigned?.includes('Osei')).map(c => (
              <div key={c.id} className="flex items-start gap-2 px-4 py-2.5 border-b border-rule last:border-b-0">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${c.type === 'cu' ? 'bg-danger' : c.type === 'ca' ? 'bg-ok' : 'bg-warn'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-ink text-[11px] truncate">{c.capaId}</div>
                  <div className="font-body italic text-ghost text-[9px] truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`font-body italic font-medium text-[9px] ${c.badgeColor}`}>{c.badge}</span>
                    <span className="font-body italic text-ghost text-[9px]">Due {c.due}</span>
                  </div>
                </div>
              </div>
            ))}
            {openCases.filter(c => c.assigned?.includes('Osei')).length === 0 && (
              <div className="px-4 py-3 font-body italic text-ghost text-[11px]">No open assignments</div>
            )}
          </div>

          {/* Quarterly goals */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Quarterly goals · Q2 2026</span></div>
            {goalsData.map(g => {
              const pct = g.direction === 'reduce'
                ? Math.round(Math.max(0, (g.current - g.target) / (g.current) * 100))
                : Math.round(Math.max(0, (g.current - (g.target * 0.5)) / (g.target * 0.5) * 100))
              const progress = g.direction === 'reduce'
                ? Math.round((1 - (g.current - g.target) / Math.max(1, g.current)) * 100)
                : Math.round((g.current / g.target) * 100)
              const color = progress >= 80 ? 'bg-ok' : progress >= 50 ? 'bg-warn' : 'bg-danger'
              const textColor = progress >= 80 ? 'text-ok' : progress >= 50 ? 'text-warn' : 'text-danger'
              return (
                <div key={g.id} className="px-4 py-2.5 border-b border-rule last:border-b-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-body italic text-muted text-[10px] flex-1 mr-2 leading-tight">{g.label}</span>
                    <span className={`display-num text-sm ${textColor}`}>{g.current}{g.unit !== 'cases' ? g.unit : ''}</span>
                  </div>
                  <div className="h-1 bg-rule2 mb-1">
                    <div className={`h-full ${color} transition-all`} style={{ width: Math.min(100, progress) + '%' }} />
                  </div>
                  <div className="flex justify-between font-body italic text-ghost text-[9px]">
                    <span>{g.direction === 'reduce' ? 'Target: ≤' : 'Target:'} {g.target}{g.unit !== 'cases' ? g.unit : ''}</span>
                    <span>{g.deadline}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Activity log */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Activity log · today</span></div>
            {activityLog.map((e, i) => (
              <div key={i} className="flex gap-2 px-4 py-2 border-b border-rule last:border-b-0">
                <span className="font-body italic text-ghost text-[9px] w-9 flex-shrink-0 mt-0.5">{e.time}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-body italic text-ghost text-[9px]">{e.actor}</div>
                  <div className="font-body text-ink text-[10px] leading-snug">{e.action}</div>
                  {e.item && <div className="font-body italic text-ghost text-[9px]">{e.item}</div>}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                  e.type === 'escalation' || e.type === 'override' ? 'bg-danger' :
                  e.type === 'evidence' || e.type === 'capa' ? 'bg-ok' :
                  e.type === 'sanitation' || e.type === 'acknowledgment' ? 'bg-ok' : 'bg-ghost'
                }`} />
              </div>
            ))}
          </div>

          {/* Benchmark */}
          <div>
            <div className="px-4 py-2.5 border-b border-rule"><span className="text-[10px] font-body font-medium uppercase tracking-widest text-ghost">Industry benchmark · 68 plants</span></div>
            {benchmarks.map((b, i) => <BenchmarkBlock key={i} {...b} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
