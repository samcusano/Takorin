import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import TrustStrip from './components/TrustStrip'
import { useAppState } from './context/AppState'

const PlantOverview         = lazy(() => import('./screens/PlantOverview'))
const ShiftIQ               = lazy(() => import('./screens/ShiftIQ'))
const SupplierIQ            = lazy(() => import('./screens/SupplierIQ'))
const CAPAEngine            = lazy(() => import('./screens/CapaEngine'))
const DataReadiness         = lazy(() => import('./screens/DataReadiness'))
const OperatorView          = lazy(() => import('./screens/OperatorView'))
const Analytics             = lazy(() => import('./screens/Analytics'))
const NotificationCenter    = lazy(() => import('./screens/NotificationCenter'))
const AgentControl          = lazy(() => import('./screens/AgentControl'))
const DesignLab             = lazy(() => import('./screens/DesignLab'))
const BatchIntelligence     = lazy(() => import('./screens/BatchIntelligence'))
const CompliancePolicy      = lazy(() => import('./screens/CompliancePolicy'))
const ProcessHierarchy      = lazy(() => import('./screens/ProcessHierarchy'))
const IntegrationHub        = lazy(() => import('./screens/IntegrationHub'))
const KnowledgeVault        = lazy(() => import('./screens/KnowledgeVault'))
const ExecutionAuthority    = lazy(() => import('./screens/ExecutionAuthority'))
const RecordVault           = lazy(() => import('./screens/RecordVault'))
const ValueChain            = lazy(() => import('./screens/ValueChain'))
const EquipmentIntelligence = lazy(() => import('./screens/EquipmentIntelligence'))
const ImpactLoop            = lazy(() => import('./screens/ImpactLoop'))
function ScreenLoader() {
 return <div className="flex-1 flex items-center justify-center font-body text-ghost text-[11px]">Loading…</div>
}

const ROLE_LABELS = {
 director: null,
 supervisor: { name: 'D. Kowalski', role: 'Supervisor' },
 'operator-reyes': { name: 'C. Reyes', role: 'Operator L1' },
 'operator-okonkwo': { name: 'P. Okonkwo', role: 'Operator L2' },
}

export default function App() {
 const { viewingRole, setViewingRole } = useAppState()
 const roleInfo = viewingRole ? ROLE_LABELS[viewingRole] : null

 return (
 <div className="flex h-screen bg-stone overflow-hidden">
 <Sidebar />
 <main className="flex-1 flex flex-col overflow-hidden ml-[240px]">
 <TrustStrip />
 {roleInfo && (
 <div className="flex items-center justify-between px-4 py-2 bg-sidebar border-b border-sidebar-border flex-shrink-0">
  <span className="font-body text-ghost text-[11px]">
   Viewing as <span className="text-ochre font-medium">{roleInfo.name}</span>
   <span className="text-ghost/60"> · {roleInfo.role}</span>
  </span>
  <button
   type="button"
   onClick={() => { setViewingRole('director') }}
   className="font-body text-[10px] text-ghost hover:text-stone transition-colors px-2 py-1 border border-[#3A342E] hover:border-[#5A4A3E]"
  >
   Return to director view
  </button>
 </div>
 )}
 <Suspense fallback={<ScreenLoader />}>
 <Routes>
 <Route path="/" element={<Navigate to="/plant" replace />} />
 <Route path="/plant" element={<ErrorBoundary><PlantOverview /></ErrorBoundary>} />
 <Route path="/command" element={<Navigate to="/plant" replace />} />
 <Route path="/shift" element={<ErrorBoundary><ShiftIQ /></ErrorBoundary>} />
 <Route path="/handoff" element={<Navigate to="/shift" replace />} />
 <Route path="/supplier" element={<ErrorBoundary><SupplierIQ /></ErrorBoundary>} />
 <Route path="/capa" element={<ErrorBoundary><CAPAEngine /></ErrorBoundary>} />
 <Route path="/readiness" element={<ErrorBoundary><DataReadiness /></ErrorBoundary>} />
 <Route path="/network" element={<Navigate to="/supplier" replace />} />
 <Route path="/operator" element={<ErrorBoundary><OperatorView role={viewingRole} /></ErrorBoundary>} />
 <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
 <Route path="/digest" element={<Navigate to="/analytics" replace />} />
 <Route path="/notifications" element={<ErrorBoundary><NotificationCenter /></ErrorBoundary>} />
 <Route path="/robots" element={<Navigate to="/shift" replace />} />
 <Route path="/allocation" element={<Navigate to="/shift" replace />} />
 <Route path="/agents" element={<ErrorBoundary><AgentControl /></ErrorBoundary>} />
 <Route path="/design-lab"  element={<ErrorBoundary><DesignLab /></ErrorBoundary>} />
 <Route path="/batch"       element={<ErrorBoundary><BatchIntelligence /></ErrorBoundary>} />
 <Route path="/compliance"  element={<ErrorBoundary><CompliancePolicy /></ErrorBoundary>} />
 <Route path="/quality"     element={<Navigate to="/batch" replace />} />
 <Route path="/hierarchy"   element={<ErrorBoundary><ProcessHierarchy /></ErrorBoundary>} />
 <Route path="/integration" element={<ErrorBoundary><IntegrationHub /></ErrorBoundary>} />
 <Route path="/knowledge"   element={<ErrorBoundary><KnowledgeVault /></ErrorBoundary>} />
 <Route path="/execution"   element={<ErrorBoundary><ExecutionAuthority /></ErrorBoundary>} />
 <Route path="/records"     element={<ErrorBoundary><RecordVault /></ErrorBoundary>} />
 <Route path="/delivery"    element={<ErrorBoundary><ValueChain /></ErrorBoundary>} />
 <Route path="/equipment"   element={<ErrorBoundary><EquipmentIntelligence /></ErrorBoundary>} />
 <Route path="/impact"      element={<ErrorBoundary><ImpactLoop /></ErrorBoundary>} />
 </Routes>
 </Suspense>
 </main>
 </div>
 )
}
