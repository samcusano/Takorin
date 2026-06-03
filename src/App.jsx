import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'

// Track which routes have been visited in this JS session so entrance
// animations only play on first mount — not every time you navigate back.
const _visited = new Set()
function Guard({ k, children }) {
  const first = !_visited.has(k)
  useEffect(() => { _visited.add(k) }, [k])
  return <div className={first ? '' : 'skip-animations'} style={{ display: 'contents' }}>{children}</div>
}
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import TrustStrip from './components/TrustStrip'
import { useAppState } from './context/AppState'

// Ambient health bar removed — the dark surface makes 3px signal strips invisible at a glance.
// Risk state is communicated through the score badge and signal health panel per screen.

const PlantOverview         = lazy(() => import('./screens/PlantOverview'))
const ShiftIQ               = lazy(() => import('./screens/ShiftIQ'))
const SupplierIQ            = lazy(() => import('./screens/SupplierIQ'))
const CAPAEngine            = lazy(() => import('./screens/CapaEngine'))
const DataReadiness         = lazy(() => import('./screens/DataReadiness'))
const OperatorView          = lazy(() => import('./screens/OperatorView'))
const Analytics             = lazy(() => import('./screens/Analytics'))
const NotificationCenter    = lazy(() => import('./screens/NotificationCenter'))
const AgentControl          = lazy(() => import('./screens/AgentControl'))

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
const DesignLab             = lazy(() => import('./screens/__DesignLab'))
function ScreenLoader() {
 return <div className="flex-1 flex items-center justify-center font-body text-muted text-label">Loading…</div>
}

const ROLE_LABELS = {
 director: null,
 supervisor: { name: 'D. Kowalski', role: 'Supervisor' },
 'operator-reyes': { name: 'C. Reyes', role: 'Operator L1' },
 'operator-okonkwo': { name: 'P. Okonkwo', role: 'Operator L2' },
}

export default function App() {
 const { viewingRole, setViewingRole, sidebarCollapsed, mobileNavOpen, setMobileNavOpen, notifOpen, setNotifOpen } = useAppState()
 const roleInfo = viewingRole ? ROLE_LABELS[viewingRole] : null

 return (
 <div className="flex h-screen bg-stone overflow-hidden">
 {/* Notifications overlay — rendered at root to escape sidebar's transform/overflow stacking context */}
 {notifOpen && (
  <Suspense fallback={null}>
   <NotificationCenter onClose={() => setNotifOpen(false)} />
  </Suspense>
 )}
 {/* Mobile backdrop — closes sidebar when tapped */}
 {mobileNavOpen && (
  <div
   className="fixed inset-0 z-20 bg-black/60 sm:hidden"
   onClick={() => setMobileNavOpen(false)}
   aria-hidden="true"
  />
 )}
 <Sidebar />
 <main
  className="sidebar-offset flex-1 flex flex-col overflow-hidden"
  style={{ '--sidebar-width': sidebarCollapsed ? '48px' : '240px' }}>
 {/* Mobile topbar — hamburger + brand, hidden on sm+ */}
 <div className="sm:hidden flex-shrink-0 flex items-center h-12 px-4 bg-stone2 border-b border-rule2">
  <button
   type="button"
   onClick={() => setMobileNavOpen(true)}
   className="text-muted hover:text-ink transition-colors p-1.5 -ml-1.5"
   aria-label="Open navigation">
   <Menu size={18} strokeWidth={2} />
  </button>
  <div className="flex-1 flex justify-center">
   <span className="font-body font-bold text-ink text-label">Takorin</span>
  </div>
  <div className="w-9" />
 </div>
 <TrustStrip />
 <Suspense fallback={<ScreenLoader />}>
 <Routes>
 <Route path="/" element={<Navigate to="/overview" replace />} />
 <Route path="/overview" element={<Guard k="overview"><ErrorBoundary><PlantOverview /></ErrorBoundary></Guard>} />
 <Route path="/plant" element={<Navigate to="/overview" replace />} />
 <Route path="/shift" element={<Guard k="shift"><ErrorBoundary><ShiftIQ /></ErrorBoundary></Guard>} />
 <Route path="/handoff" element={<Navigate to="/shift" replace />} />
 <Route path="/supplier" element={<Guard k="supplier"><ErrorBoundary><SupplierIQ /></ErrorBoundary></Guard>} />
 <Route path="/capa" element={<Guard k="capa"><ErrorBoundary><CAPAEngine /></ErrorBoundary></Guard>} />
 <Route path="/readiness" element={<Guard k="readiness"><ErrorBoundary><DataReadiness /></ErrorBoundary></Guard>} />
 <Route path="/network" element={<Navigate to="/overview" replace />} />
 <Route path="/operator" element={<Guard k="operator"><ErrorBoundary><OperatorView role={viewingRole} /></ErrorBoundary></Guard>} />
 <Route path="/analytics" element={<Guard k="analytics"><ErrorBoundary><Analytics /></ErrorBoundary></Guard>} />
 <Route path="/digest" element={<Navigate to="/analytics" replace />} />
 <Route path="/notifications" element={<Guard k="notifications"><ErrorBoundary><NotificationCenter /></ErrorBoundary></Guard>} />
 <Route path="/robots" element={<Navigate to="/shift" replace />} />
 <Route path="/allocation" element={<Navigate to="/shift" replace />} />
 <Route path="/agents" element={<Guard k="agents"><ErrorBoundary><AgentControl /></ErrorBoundary></Guard>} />

 <Route path="/batch"       element={<Guard k="batch"><ErrorBoundary><BatchIntelligence /></ErrorBoundary></Guard>} />
 <Route path="/compliance"  element={<Guard k="compliance"><ErrorBoundary><CompliancePolicy /></ErrorBoundary></Guard>} />
 <Route path="/hierarchy"   element={<Guard k="hierarchy"><ErrorBoundary><ProcessHierarchy /></ErrorBoundary></Guard>} />
 <Route path="/integration" element={<Guard k="integration"><ErrorBoundary><IntegrationHub /></ErrorBoundary></Guard>} />
 <Route path="/knowledge"   element={<Guard k="knowledge"><ErrorBoundary><KnowledgeVault /></ErrorBoundary></Guard>} />
 <Route path="/execution"   element={<Guard k="execution"><ErrorBoundary><ExecutionAuthority /></ErrorBoundary></Guard>} />
 <Route path="/records"     element={<Guard k="records"><ErrorBoundary><RecordVault /></ErrorBoundary></Guard>} />
 <Route path="/delivery"    element={<Guard k="delivery"><ErrorBoundary><ValueChain /></ErrorBoundary></Guard>} />
 <Route path="/equipment"   element={<Guard k="equipment"><ErrorBoundary><EquipmentIntelligence /></ErrorBoundary></Guard>} />
 <Route path="/outcomes"    element={<Guard k="outcomes"><ErrorBoundary><ImpactLoop /></ErrorBoundary></Guard>} />
 <Route path="/impact"      element={<Navigate to="/outcomes" replace />} />
 <Route path="/__design_lab" element={<DesignLab />} />
 </Routes>
 </Suspense>
 </main>
 </div>
 )
}
