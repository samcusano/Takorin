import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { readinessData } from '../data'
import { useAppState } from '../context/AppState'
import { Urg, StatCell, SP, SecHd, Btn, ActionBanner, Spinner, AnimatedCheck, ActionCard, StatusIndicator, MetadataRow, ExpandableMetadata, Chip, RightRail } from '../components/UI'
import { AlertTriangle, Check, Clock, TrendingUp, Brain, Target, Zap, Shield, Activity, X } from 'lucide-react'
import { useFocusTrap, useExitAnimation } from '../lib/utils'

const toneColor = t => t === 'ok' ? '#3A8A5A' : t === 'danger' ? '#D94F2A' : '#C4920A'
const statusCls = t => t === 'ok' ? 'bg-ok/10 text-ok' : t === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'

// Design A — compact table grid
function SourceRowTable({ s }) {
 const c = toneColor(s.tone)
 return (
 <div className={`grid border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors ${
 s.tone === 'danger' ? 'bg-danger/[0.03]' : s.tone === 'warn' ? 'bg-warn/[0.02]' : ''
 }`} style={{ gridTemplateColumns:'1fr 88px 80px 88px 110px' }}>
 <div className="px-4 py-3">
 <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
 <div className="font-body text-ghost text-[11px]">{s.sub}</div>
 </div>
 <div className="flex flex-col justify-center px-3 gap-1">
 <span className="font-display font-extrabold leading-none text-[11px]" style={{ color: c }}>{s.score}</span>
 <div style={{ height:3, background:'#D8D2C8' }}>
 <div style={{ height:'100%', width:`${s.score}%`, background:c, transition:'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }} />
 </div>
 </div>
 <div className="flex items-center px-3">
 <span className={`font-body text-[11px] ${s.tone === 'danger' ? 'text-danger' : 'text-ghost'}`}>{s.freshness}</span>
 </div>
 <div className="flex flex-col justify-center px-3 gap-1">
 <div style={{ height:3, background:'#D8D2C8' }}>
 <div style={{ height:'100%', width:`${s.consistency}%`, background:c, transition:'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }} />
 </div>
 <span className={`font-body text-[10px] ${s.tone==='ok'?'text-ghost':s.tone==='danger'?'text-danger':'text-warn'}`}>{s.consistency}%</span>
 </div>
 <div className="flex items-center justify-center px-2">
 <span className={`font-body font-medium text-[10px] px-2 py-0.5 ${statusCls(s.tone)}`}>{s.status}</span>
 </div>
 </div>
 )
}

function DiagnosticsPanel({ open, selectedGap, score, onClose }) {
 const panelRef = useRef(null)
 const { exiting, exit } = useExitAnimation(200)
 useFocusTrap(panelRef, open)
 if (!open) return null
 const handleClose = () => exit(onClose)
 return (
  <>
   <div className="fixed inset-0 bg-ink/20 z-40" onClick={handleClose} />
   <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={selectedGap ? 'Review gap' : 'Readiness diagnostics'} className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-stone border-l border-rule2 z-50 flex flex-col ${exiting ? 'slide-right-out' : 'slide-right'}`}>
    <div className="flex items-start justify-between px-5 py-4 border-b border-rule2 bg-stone2">
     <div>
      <div className="font-body text-ghost text-[10px] mb-1">{selectedGap ? 'Review gap' : 'Readiness diagnostics'}</div>
      <div className="font-display font-bold text-ink text-base">{selectedGap ? selectedGap.title : 'Degraded readiness overview'}</div>
     </div>
     <button type="button" onClick={handleClose} aria-label="Close diagnostics panel" className="p-1 text-ghost hover:text-ink transition-colors duration-100 ease-standard">
      <X size={14} strokeWidth={2} aria-hidden="true" />
     </button>
    </div>
    <div className="flex-1 overflow-y-auto p-5">
     {selectedGap ? (
      <>
       <div className="font-body font-medium text-ink text-[13px] mb-2">{selectedGap.title}</div>
       <div className="font-body text-ghost text-[11px] leading-relaxed mb-4">{selectedGap.details}</div>
       <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <div className="border border-rule2 p-3">
         <div className="font-body text-[10px] text-muted mb-2">Recommended fix</div>
         <div className="font-body text-[11px] text-ink">Standardize the gap mapping across MES, ERP and checklist sources. Assign a plant data owner to validate the mapping and close the loop.</div>
        </div>
        <div className="border border-rule2 p-3">
         <div className="font-body text-[10px] text-muted mb-2">Affected systems</div>
         <div className="space-y-1 font-body text-[11px] text-ink">
          <div>• MES schedule</div>
          <div>• ERP ingredient master</div>
          <div>• Checklist system</div>
         </div>
        </div>
       </div>
       <div className="border border-rule2 p-3">
        <div className="font-body text-[10px] text-muted mb-2">Next steps</div>
        <ol className="list-decimal list-inside font-body text-[11px] text-ink space-y-1">
         <li>Review the gap details and source mappings.</li>
         <li>Assign corrective action to operations or QA.</li>
         <li>Confirm update in the source systems and rerun readiness evaluation.</li>
        </ol>
       </div>
      </>
     ) : (
      <>
       <div className="font-body font-medium text-ink text-[13px] mb-2">How the readiness picture breaks down</div>
       <div className="font-body text-ghost text-[11px] leading-relaxed mb-4">Diagnostic detail for the current degraded readiness state, including the largest gaps and next actions that restore cross-plant trust.</div>
       <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <div className="border border-rule2 p-3">
         <div className="font-body text-[10px] text-muted mb-2">Current readiness</div>
         <div className="font-body text-2xl font-medium text-ink">{score}/100</div>
         <div className="font-body text-[10px] text-warn mt-1">Degraded</div>
        </div>
        <div className="border border-rule2 p-3">
         <div className="font-body text-[10px] text-muted mb-2">Connected sources</div>
         <div className="font-body text-[11px] text-ink">5 of 5</div>
         <div className="font-body text-[10px] text-ghost mt-1">All feeds live, but naming and context gaps remain.</div>
        </div>
       </div>
       <div className="border border-rule2 p-3 mb-4">
        <div className="font-body text-[10px] text-muted mb-2">Key gaps</div>
        <ul className="space-y-2 font-body text-[11px] text-ink">
         <li>• 2 active naming conflicts across MES / ERP / supplier fields.</li>
         <li>• 1 critical context gap on Oven B sensor mapping.</li>
         <li>• SCADA output is stale for 3 days on a critical process feed.</li>
        </ul>
       </div>
       <div className="border border-rule2 p-3">
        <div className="font-body text-[10px] text-muted mb-2">Recommended actions</div>
        <div className="space-y-2 font-body text-[11px] text-ink">
         <div>• Set canonical ingredient names for all MES/ERP/supplier references.</div>
         <div>• Map SKU-to-temperature profiles for Oven B.</div>
         <div>• Restore and validate the Oven B SCADA feed.</div>
        </div>
       </div>
      </>
     )}
    </div>
    <div className="px-5 py-3 border-t border-rule2 bg-stone2 flex-shrink-0">
     <Btn variant="secondary" onClick={handleClose}>Close</Btn>
    </div>
   </aside>
  </>
 )
}

export default function DataReadiness() {
 const { readinessScore: score, setReadinessScore: setScore,
 readinessResolved: resolved, setReadinessResolved: setResolved } = useAppState()
 const [showConsequence, setShowConsequence] = useState(false)
 const [exportState, setExportState] = useState('idle')
 const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
 const [selectedGap, setSelectedGap] = useState(null)
 const location = useLocation()
 const highlightKey = location.state?.highlight

 const handleExport = () => {
 setExportState('loading')
 setTimeout(() => setExportState('done'), 1500)
 }

 useEffect(() => {
 if (highlightKey) {
 const el = document.getElementById(highlightKey)
 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
 }
 }, [highlightKey])

 const resolveItem = (key, points) => {
 if (resolved[key]) return
 setResolved(p => ({ ...p, [key]: true }))
 setScore(s => Math.min(100, s + points))
 setShowConsequence(true)
 }

 const supplierIQConf =
 resolved['conflict-0'] && resolved['conflict-1'] ? 84 :
 resolved['conflict-0'] ? 71 : 58
 const shiftIQConf = resolved['ctx-0'] ? 75 : 61

 const moduleRows = [
 { n:'ShiftIQ', s:'Risk score · Interventions', v: shiftIQConf, c: shiftIQConf >= 75 ? 'text-ok' : 'text-warn' },
 { n:'HandoffIQ', s:'Workforce · Certs', v: 91, c: 'text-ok' },
 { n:'SupplierIQ', s:'COA · Lot traceability', v: supplierIQConf, c: supplierIQConf >= 75 ? 'text-ok' : 'text-warn' },
 { n:'CAPA Engine', s:'Root cause · Evidence', v: 88, c: 'text-ok' },
 ]

 const dataGaps = [
  { title: 'ERP ingredient map incomplete', details: 'Ingredient names missing supplier linkage', tone: 'warn', badge: 'Context gap' },
  { title: 'Checklist items unsynced', details: '3 startup checks are not mapped to the MES workflow', tone: 'warn', badge: 'Data gap' },
  { title: 'Supplier lot traceability weak', details: 'Incoming lots lack full chain-of-custody metadata', tone: 'warn', badge: 'Traceability gap' },
 ]
 const activeRiskCount = readinessData.conflicts.length + 1 + dataGaps.length

 return (
 <div className="flex flex-col h-full overflow-hidden content-reveal">
  {score < 75 && (
   <ActionBanner
    tone="warn"
    headline="Action Required — system in degraded mode"
    body={`Readiness score: ${score}/100. Resolve naming conflicts and context gaps to restore full operational trust.`}
   >
    <Btn variant="primary" onClick={handleExport}>
     {exportState === 'loading' ? <><Spinner label="Preparing" /> Preparing…</> :
      exportState === 'done' ? <><AnimatedCheck size={11} color="currentColor" /> Exported</> :
      'Export readiness report'}
    </Btn>
    <Btn variant="secondary" onClick={() => setDiagnosticsOpen(true)}>View diagnostics</Btn>
   </ActionBanner>
  )}

  {/* Top stats row — Readiness overview */}
  <div className="border-b border-rule2 bg-stone3/60 px-4 py-4">
   <div className="grid grid-cols-5 gap-3">
    {readinessData.stats.map((stat, idx) => (
     <StatCell key={idx} label={stat.label} value={stat.value} sub={stat.sub} tone={stat.tone} fill={stat.fill} />
    ))}
   </div>
  </div>

  {/* Main Content Area */}
  <div className="flex flex-1 overflow-hidden">
   {/* Center Panel — Operational Reality Feed */}
   <div className="flex-1 overflow-y-auto">
    <div className="p-4 space-y-6">
     {/* Active Risk Cards */}
     <div>
      <div className="font-body font-medium text-ink text-[13px] mb-4">Active Risk Cards</div>
      <div className="space-y-3">
       {readinessData.conflicts.map((c, i) => (
        <ActionCard
         key={i}
         tone="danger"
         title={c.title}
         subtitle="Cross-plant correlation blocked"
         metadata={[
          `${c.variants.length} conflicting names`,
          'Affects 3 modules',
          'Impact: False correlations'
         ]}
         status={resolved[`conflict-${i}`] ? <StatusIndicator status="complete" tone="ok" /> : null}
         actions={
          resolved[`conflict-${i}`] ? (
           <span className="font-body text-ok text-[10px] flex items-center gap-1">
            <Check size={10} /> Canonical name set
           </span>
          ) : (
           <Btn variant="primary" onClick={() => resolveItem(`conflict-${i}`, c.points)}>
            Set canonical name
           </Btn>
          )
         }
        >
         <div className="flex flex-col gap-3 mt-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink">
           <span className="font-body text-ghost">MES:</span>
           <span className="font-mono px-2 py-1 bg-stone2 rounded">{c.variants[0]}</span>
           <span className="text-ghost">→</span>
           <span className="font-mono px-2 py-1 bg-stone2 rounded">{c.variants[1] || c.variants[0]}</span>
           <Chip tone="warn">Mismatch</Chip>
          </div>
          <div className="flex gap-1 flex-wrap">
           {c.variants.map((v, j) => (
            <span key={j} className={`font-body font-medium text-[10px] px-2 py-1 ${j === 0 ? 'bg-stone3 text-ink2' : 'bg-danger/10 text-danger'}`}>
             {v}
            </span>
           ))}
          </div>
         </div>
        </ActionCard>
       ))}

       {/* Context Gap */}
       <ActionCard
        tone="danger"
        title="Oven Station B — no SKU-to-temperature profile mapping"
        subtitle="Sensor readings without product context"
        metadata={[
         'Oven B reports continuously',
         'Affects risk evaluation',
         'Impact: False positives/negatives'
        ]}
        status={resolved['ctx-0'] ? <StatusIndicator status="complete" tone="ok" /> : null}
        actions={
         resolved['ctx-0'] ? (
          <span className="font-body text-ok text-[10px] flex items-center gap-1">
           <Check size={10} /> Profile added
          </span>
         ) : (
          <Btn variant="primary" onClick={() => resolveItem('ctx-0', 12)}>
           Add SKU profiles
          </Btn>
         )
        }
       />
       {dataGaps.map((gap, idx) => (
        <ActionCard
         key={idx}
         tone={gap.tone}
         title={gap.title}
         subtitle={gap.details}
         metadata={[<Chip key="badge" tone={gap.tone}>{gap.badge}</Chip>]}
         actions={<Btn variant="secondary" onClick={() => setSelectedGap(gap)}>Review gap</Btn>}
        />
       ))}
      </div>
     </div>

    </div>
   </div>

   {/* Right Panel — Agent Brain + module summary */}
   <RightRail>
    <div className="p-4">
     <SP title="Readiness by module" sub="How each product is affected">
      {moduleRows.map((r,i) => (
       <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2 last:border-b-0">
        <div>
         <div className="font-body font-medium text-ink text-[12px]">{r.n}</div>
         <div className="font-body text-ghost text-[10px]">{r.s}</div>
        </div>
        <div className="text-right">
         <div className={`display-num text-base ${r.c}`}>{r.v}%</div>
         <div className="font-body text-ghost text-[10px]">confidence</div>
        </div>
       </div>
      ))}
      <div className="px-4 py-2 font-body text-ghost text-[10px]">
       {supplierIQConf < 84
        ? `SupplierIQ at ${supplierIQConf}% — resolving naming conflicts raises it to ~84%.`
        : 'SupplierIQ restored to 84% — naming conflicts resolved.'}
      </div>
     </SP>

     <SP title="What happens at 90+" sub="Readiness unlocks" className="mt-4">
      {readinessData.unlocks.map((u, i) => (
       <div key={i} className="flex gap-2 px-4 py-3 border-b border-rule2 last:border-b-0">
        <svg className="w-3.5 h-3.5 stroke-ok flex-shrink-0 mt-0.5" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
         <div className="font-body font-medium text-ink text-[12px]">{u.title}</div>
         <div className="font-body text-ghost text-[10px] mt-0.5">{u.sub}</div>
        </div>
       </div>
      ))}
     </SP>

     <div className="border border-rule2 p-4 my-4">
      <div className="flex items-start gap-3">
       <Brain size={20} className="text-muted mt-0.5" />
       <div className="flex-1">
        <div className="font-body font-medium text-ink text-[13px] mb-2">Agent Recommendation</div>
        <div className="font-body text-ink2 text-[12px] leading-relaxed mb-3">
         Based on naming conflicts and missing context mappings, recommendation confidence is degraded to 60%.
         Resolving these gaps will restore cross-plant correlation and improve AI reliability.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
         <div className="flex items-center gap-1">
          <Target size={12} className="text-muted" />
          <span className="font-body text-ghost">Confidence:</span>
          <span className="font-body font-medium text-ink">60%</span>
         </div>
         <div className="flex items-center gap-1">
          <TrendingUp size={12} className="text-muted" />
          <span className="font-body text-ghost">Potential gain:</span>
          <span className="font-body font-medium text-ok">+24 pts</span>
         </div>
        </div>
       </div>
      </div>
     </div>

     <div className="border border-rule2 p-4 mb-4">
      <div className="font-body font-medium text-ink text-[13px] mb-3">What you should do next</div>
      <div className="space-y-2">
       <div className="p-2 border border-ok/20">
        <div className="font-body font-medium text-ink text-[11px]">Resolve naming conflicts</div>
        <div className="font-body text-ghost text-[10px]">Impact: +14 pts readiness</div>
       </div>
       <div className="p-2 border border-ok/20">
        <div className="font-body font-medium text-ink text-[11px]">Add SKU temperature profiles</div>
        <div className="font-body text-ghost text-[10px]">Impact: +12 pts readiness</div>
       </div>
      </div>
     </div>

     <ExpandableMetadata title="Simulation: What if?" tone="muted">
      <div className="space-y-3">
       <div className="p-3 border border-rule2">
        <div className="font-body font-medium text-ink text-[11px] mb-2">If all gaps resolved:</div>
        <div className="space-y-1 text-[10px]">
         <div className="flex justify-between">
          <span className="font-body text-ghost">Readiness score:</span>
          <span className="font-body font-medium text-ok">84/100</span>
         </div>
         <div className="flex justify-between">
          <span className="font-body text-ghost">Recommendation confidence:</span>
          <span className="font-body font-medium text-ok">78%</span>
         </div>
         <div className="flex justify-between">
          <span className="font-body text-ghost">False positive rate:</span>
          <span className="font-body font-medium text-ok">-35%</span>
         </div>
        </div>
       </div>
      </div>
     </ExpandableMetadata>
    </div>
   </RightRail>
  </div>

  <DiagnosticsPanel
   open={diagnosticsOpen || !!selectedGap}
   selectedGap={selectedGap}
   score={score}
   onClose={() => { setDiagnosticsOpen(false); setSelectedGap(null) }}
  />

 </div>
 )
}
