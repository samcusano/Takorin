import { createContext, useContext, useState } from 'react'
import { readinessData } from '../data'

const Ctx = createContext(null)

export function AppStateProvider({ children }) {
  const [shiftActed, setShiftActed] = useState({})
  const [handoffSigned, setHandoffSigned] = useState(false)
  const [handoffNominated, setHandoffNominated] = useState({})
  const [coaRequested, setCoaRequested] = useState(false)
  const [closedCases, setClosedCases] = useState([])
  const [readinessScore, setReadinessScore] = useState(readinessData.score)
  const [readinessResolved, setReadinessResolved] = useState({})
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
  const [notifPanelOpen, setNotifPanelOpen] = useState(false)
  const [commandAcknowledged, setCommandAcknowledged] = useState(new Set())
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
      shiftActed, setShiftActed,
      handoffSigned, setHandoffSigned,
      handoffNominated, setHandoffNominated,
      coaRequested, setCoaRequested,
      closedCases, setClosedCases,
      readinessScore, setReadinessScore,
      readinessResolved, setReadinessResolved,
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
      notifPanelOpen, setNotifPanelOpen,
      commandAcknowledged, acknowledgeCommand,
      activityLog, logActivity,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAppState = () => useContext(Ctx)
