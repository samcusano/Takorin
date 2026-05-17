import { createContext, useContext, useState } from 'react'
import { readinessData, systemConfidenceScore } from '../data'

const Ctx = createContext(null)

export const PLANTS = {
 sl: { id:'sl', name:'Salina Campus',      code:'SL-04', region:'Salina, KS',    director:'J. Crocker',   readinessScore:64, complianceState:'blocked', workerMode:'human',  sector:'food'        },
 ks: { id:'ks', name:'Wichita Plant',      code:'KS-09', region:'Wichita, KS',   director:'T. Okonkwo',   readinessScore:88, complianceState:'clear',   workerMode:'robot',  sector:'food'        },
 co: { id:'co', name:'Denver Plant',       code:'CO-07', region:'Denver, CO',    director:'M. Rodriguez', readinessScore:92, complianceState:'clear',   workerMode:'hybrid', sector:'food'        },
 se: { id:'se', name:'Södertälje Demo',    code:'SE-01', region:'Sweden',        director:'A. Bergström', readinessScore:94, complianceState:'clear',   workerMode:'human',  sector:'pharma'      },
 de: { id:'de', name:'Amberg Demo',        code:'DE-01', region:'Germany',       director:'K. Müller',    readinessScore:97, complianceState:'clear',   workerMode:'robot',  sector:'electronics' },
}

export function AppStateProvider({ children }) {
 const [workerMode, setWorkerModeState] = useState('human')

 // Escalation state machine — tracks who has each finding
 // States: open → assigned → acknowledged → escalated → resolved
 const [escalationStates, setEscalationStates] = useState({
  sf1: { state: 'assigned', owner: 'D. Kowalski', chain: [{ owner: 'D. Kowalski', at: '06:42', via: 'ShiftIQ auto-assign' }] },
  sf2: { state: 'acknowledged', owner: 'D. Kowalski', chain: [{ owner: 'D. Kowalski', at: '06:48', via: 'Director action' }] },
  sf3: { state: 'escalated', owner: 'J. Crocker', chain: [
   { owner: 'D. Kowalski', at: '06:42', via: 'ShiftIQ auto-assign' },
   { owner: 'J. Crocker', at: '09:15', via: 'No response — 2nd escalation' },
  ]},
  sf4: { state: 'open', owner: null, chain: [] },
 })
 const updateEscalationState = (findingId, state, owner) => {
  setEscalationStates(prev => ({
   ...prev,
   [findingId]: {
    state,
    owner,
    chain: [...(prev[findingId]?.chain || []), { owner, at: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }), via: 'Director action' }],
   },
  }))
 }
 const [agentActions, setAgentActions] = useState([
  { id:'a1', agentId:'pre-shift', agentName:'Pre-Shift Agent', timestamp:'06:12', action:'Verified startup conditions', target:'Line 4 AM', rationale:'All cert, checklist, and sensor checks passed at T-30', status:'completed', overriddenBy:null },
  { id:'a2', agentId:'compliance', agentName:'Compliance Agent', timestamp:'06:36', action:'Opened CAPA-2604-001', target:'Sensor A-7', rationale:'Breach threshold crossed — auto-filed with HACCP mapping and sensor log attached', status:'completed', overriddenBy:null },
  { id:'a3', agentId:'supplier', agentName:'Supplier Agent', timestamp:'05:45', action:'Flagged Lot L-0891 pending release', target:'ConAgra · Pepperoni', rationale:'COA not received 4h before scheduled production start', status:'pending-review', overriddenBy:null },
  { id:'a4', agentId:'handoff', agentName:'Handoff Agent', timestamp:'13:15', action:'Pre-populated handoff document', target:'Line 4 PM handoff', rationale:'Synthesized open findings, CAPA status, and sensor anomalies from shift data', status:'pending-review', overriddenBy:null },
 ])
 const logAgentAction = (entry) => setAgentActions(p => [{ ...entry, id:`a${Date.now()}`, timestamp: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) }, ...p])
 const overrideAgentAction = (id, by) => setAgentActions(p => p.map(a => a.id === id ? {...a, status:'overridden', overriddenBy:by} : a))

 const [shiftActed, setShiftActed] = useState({})
 const [handoffSigned, setHandoffSigned] = useState(false)
 const [handoffNominated, setHandoffNominated] = useState({})
 const [coaRequested, setCoaRequested] = useState(false)
 const [closedCases, setClosedCases] = useState([])
 const [closureRecords, setClosureRecords] = useState({})
 const [readinessScore, setReadinessScore] = useState(readinessData.score)
 const [readinessResolved, setReadinessResolved] = useState({})
 const [resolvedConflicts, setResolvedConflicts] = useState(new Set())
 const [trainingPlans, setTrainingPlans] = useState({})
 const [blockingEvidenceUploaded, setBlockingEvidenceUploaded] = useState(false)
 const [rfqSent, setRfqSent] = useState(false)
 const [briefingAcknowledged, setBriefingAcknowledged] = useState(false)
 const [checklistSigned, setChecklistSigned] = useState({})
 const [allergenOverride, setAllergenOverride] = useState(null)
 const [nearMisses, setNearMisses] = useState([])
 const [taskAssignments, setTaskAssignments] = useState({})
 const [trainingCompletions, setTrainingCompletions] = useState({})
 const [maintenanceTickets, setMaintenanceTickets] = useState([])
 const [empSessionResults, setEmpSessionResults] = useState({})
 const [flaggedItems, setFlaggedItems] = useState({})
 const [plantActions, setPlantActions] = useState({})
 const [sanitationEntries, setSanitationEntries] = useState([])
 const [operatorAcknowledgments, setOperatorAcknowledgments] = useState({})
 const [carryForwardAcknowledged, setCarryForwardAcknowledged] = useState(new Set())
 const [commandAcknowledged, setCommandAcknowledged] = useState(new Set())
 const [pilotExpanded, setPilotExpanded] = useState(false)
 const [handoffAccepted, setHandoffAccepted] = useState(false)
 // Quiet period protocol — Compliance Monitor enters logging-only mode for specified line/window
 const [quietPeriods, setQuietPeriods] = useState([])
 const addQuietPeriod = ({ line, startTime, endTime, reason, setBy }) =>
  setQuietPeriods(p => [...p, { id: Date.now(), line, startTime, endTime, reason, setBy, active: true }])
 const clearQuietPeriod = (id) =>
  setQuietPeriods(p => p.map(qp => qp.id === id ? { ...qp, active: false } : qp))
 const activeQuietPeriod = (line) => quietPeriods.find(qp => qp.active && qp.line === line) || null

 // System confidence — aggregate of data source freshness scores
 const [systemConfidence] = useState(systemConfidenceScore) // 79 from data

 // On-floor status — pauses escalation re-fires, routes to named backup
 const [directorOnFloor, setDirectorOnFloor] = useState(false)
 const [floorBackup, setFloorBackup] = useState('D. Kowalski')
 const goToFloor = (backup) => { setDirectorOnFloor(true); if (backup) setFloorBackup(backup) }
 const returnFromFloor = () => setDirectorOnFloor(false)

 // CAPA assignment acknowledgment — clock starts when assignee accepts
 const [capaAcknowledgments, setCapaAcknowledgments] = useState({
  'c2': { at: '11:30', by: 'T. Osei' }, // CAPA-2604-003 already acknowledged
 })
 const acknowledgeCapaAssignment = (capaId) => setCapaAcknowledgments(p => ({
  ...p,
  [capaId]: { at: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }), by: 'assignee' },
 }))

 // Override rationale log — required for all compliance-category action overrides
 const [overrideRationales, setOverrideRationales] = useState({})
 const logOverrideRationale = (actionId, rationale, actor) => {
  setOverrideRationales(p => ({ ...p, [actionId]: { rationale, actor, at: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) } }))
  logActivity({ actor, action: `Override rationale: "${rationale}"`, item: actionId, type: 'compliance' })
 }

 const [currentPlant, _setCurrentPlant] = useState(PLANTS.sl)
 const setCurrentPlant = (p) => { _setCurrentPlant(p); setWorkerModeState(p.workerMode) }
 const setWorkerMode = (m) => setWorkerModeState(m)
 const [viewingRole, setViewingRole] = useState('director')
 const [agentDecidedKeys, setAgentDecidedKeys] = useState(new Set())
 const markAgentDecided = (key) => setAgentDecidedKeys(prev => new Set([...prev, key]))
 const acknowledgeCommand = (id) => setCommandAcknowledged(prev => new Set([...prev, id]))
 const [activityLog, setActivityLog] = useState([
 { time:'14:02', actor:'M. Santos', action:'Signed shift handoff', item:'HO-2604161', type:'handoff' },
 { time:'13:45', actor:'A. Novotny', action:'Contacted ConAgra QA re: CAPA-2604-007', item:'CAPA-2604-007', type:'capa' },
 { time:'11:30', actor:'T. Osei', action:'Uploaded 4 evidence files', item:'CAPA-2604-003', type:'evidence' },
 { time:'09:15', actor:'System', action:'Auto-escalation: CAPA-2604-001 overdue (2nd notice)', item:'CAPA-2604-001', type:'escalation' },
 { time:'06:48', actor:'D. Kowalski', action:'Martinez reassigned to Sauce Dosing', item:'Finding II', type:'intervention' },
 { time:'06:42', actor:'D. Kowalski', action:'Completed 4 overdue startup checklists', item:'Finding I', type:'intervention' },
 { time:'06:12', actor:'ShiftIQ', action:'Shift started — risk score 54, normal', item:'Line 4 AM', type:'system' },
 ])
 const logActivity = (entry) => setActivityLog(p => [{ ...entry, time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }, ...p])

 return (
 <Ctx.Provider value={{
 workerMode, setWorkerMode,
 agentActions, logAgentAction, overrideAgentAction,
 escalationStates, updateEscalationState,
 directorOnFloor, floorBackup, goToFloor, returnFromFloor,
 capaAcknowledgments, acknowledgeCapaAssignment,
 overrideRationales, logOverrideRationale,
 quietPeriods, addQuietPeriod, clearQuietPeriod, activeQuietPeriod,
 systemConfidence,
 shiftActed, setShiftActed,
 handoffSigned, setHandoffSigned,
 handoffNominated, setHandoffNominated,
 coaRequested, setCoaRequested,
 closedCases, setClosedCases,
 closureRecords, setClosureRecords,
 readinessScore, setReadinessScore,
 readinessResolved, setReadinessResolved,
 resolvedConflicts, setResolvedConflicts,
 trainingPlans, setTrainingPlans,
 blockingEvidenceUploaded, setBlockingEvidenceUploaded,
 rfqSent, setRfqSent,
 briefingAcknowledged, setBriefingAcknowledged,
 checklistSigned, setChecklistSigned,
 allergenOverride, setAllergenOverride,
 nearMisses, setNearMisses,
 taskAssignments, setTaskAssignments,
 trainingCompletions, setTrainingCompletions,
 maintenanceTickets, setMaintenanceTickets,
 empSessionResults, setEmpSessionResults,
 flaggedItems, setFlaggedItems,
 plantActions, setPlantActions,
 sanitationEntries, setSanitationEntries,
 operatorAcknowledgments, setOperatorAcknowledgments,
 carryForwardAcknowledged, setCarryForwardAcknowledged,
 commandAcknowledged, acknowledgeCommand,
 activityLog, logActivity,
 currentPlant, setCurrentPlant,
 viewingRole, setViewingRole,
 pilotExpanded, setPilotExpanded,
 handoffAccepted, setHandoffAccepted,
 agentDecidedKeys, markAgentDecided,
 }}>
 {children}
 </Ctx.Provider>
 )
}

export const useAppState = () => useContext(Ctx)
