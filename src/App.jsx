import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
const NotificationCenter    = lazy(() => import('./screens/NotificationCenter'))
// Dev-only: the ternary puts the dynamic import in a dead branch in production
// builds, so the DesignLabBrand chunk is dropped entirely (not just unrouted).
const DesignLabBrand        = import.meta.env.DEV ? lazy(() => import('./screens/DesignLabBrand')) : null
const AgentControl          = lazy(() => import('./screens/AgentControl'))

const BatchIntelligence     = lazy(() => import('./screens/BatchIntelligence'))
const CompliancePolicy      = lazy(() => import('./screens/CompliancePolicy'))
const ProcessHierarchy      = lazy(() => import('./screens/ProcessHierarchy'))
const KnowledgeVault        = lazy(() => import('./screens/KnowledgeVault'))
const ValueChain            = lazy(() => import('./screens/ValueChain'))
const EquipmentIntelligence = lazy(() => import('./screens/EquipmentIntelligence'))
const ImpactLoop            = lazy(() => import('./screens/ImpactLoop'))
const SecurityIQ            = lazy(() => import('./screens/SecurityIQ'))
const QualityIQ             = lazy(() => import('./screens/QualityIQ'))
const OpLab                 = lazy(() => import('./screens/__OpLab'))
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
 const location = useLocation()
 const roleInfo = viewingRole ? ROLE_LABELS[viewingRole] : null
 // The design lab is a dev-only, focused design-tool surface — hide the main app
 // nav there. Gated to import.meta.env.DEV so it's stripped from production builds.
 const isDesignLab = import.meta.env.DEV && location.pathname.startsWith('/__design_lab')

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
 {!isDesignLab && <Sidebar />}
 <main
  className={`${isDesignLab ? '' : 'sidebar-offset'} flex-1 flex flex-col overflow-hidden`}
  style={{ '--sidebar-width': sidebarCollapsed ? '48px' : '240px' }}>
 {/* Mobile topbar — hamburger + brand, hidden on sm+ and in the design lab */}
 {!isDesignLab && (
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
 )}
 {!isDesignLab && <TrustStrip />}
 <Suspense fallback={<ScreenLoader />}>
 <Routes>
  {/* ── Canonical routes ─────────────────────────────────────────── */}
  <Route path="/"               element={<Navigate to={`/overview${location.search}`} replace />} />
  <Route path="/overview"       element={<Guard k="overview"><ErrorBoundary><PlantOverview /></ErrorBoundary></Guard>} />
  <Route path="/shift"          element={<Guard k="shift"><ErrorBoundary><ShiftIQ /></ErrorBoundary></Guard>} />
  <Route path="/suppliers"      element={<Guard k="supplier"><ErrorBoundary><SupplierIQ /></ErrorBoundary></Guard>} />
  <Route path="/quality"        element={<Guard k="quality"><ErrorBoundary><QualityIQ /></ErrorBoundary></Guard>} />
  <Route path="/capa"           element={<Guard k="capa"><ErrorBoundary><CAPAEngine /></ErrorBoundary></Guard>} />
  <Route path="/agents"         element={<Guard k="agents"><ErrorBoundary><AgentControl /></ErrorBoundary></Guard>} />
  <Route path="/performance"    element={<Guard k="outcomes"><ErrorBoundary><ImpactLoop /></ErrorBoundary></Guard>} />
  <Route path="/operator"       element={<Guard k="operator"><ErrorBoundary><OperatorView role={viewingRole} /></ErrorBoundary></Guard>} />
  <Route path="/notifications"  element={<Guard k="notifications"><ErrorBoundary><NotificationCenter /></ErrorBoundary></Guard>} />
  <Route path="/batches"        element={<Guard k="batch"><ErrorBoundary><BatchIntelligence /></ErrorBoundary></Guard>} />
  <Route path="/equipment"      element={<Guard k="equipment"><ErrorBoundary><EquipmentIntelligence /></ErrorBoundary></Guard>} />
  <Route path="/accountability" element={<Guard k="compliance"><ErrorBoundary><CompliancePolicy /></ErrorBoundary></Guard>} />
  <Route path="/knowledge"      element={<Guard k="knowledge"><ErrorBoundary><KnowledgeVault /></ErrorBoundary></Guard>} />
  <Route path="/plant-map"      element={<Guard k="hierarchy"><ErrorBoundary><ProcessHierarchy /></ErrorBoundary></Guard>} />
  {import.meta.env.DEV && <Route path="/__design_lab"   element={<Suspense fallback={<ScreenLoader />}><DesignLabBrand /></Suspense>} />}
  <Route path="/__op_lab"       element={<Suspense fallback={<ScreenLoader />}><OpLab /></Suspense>} />
  <Route path="/data"           element={<Guard k="readiness"><ErrorBoundary><DataReadiness /></ErrorBoundary></Guard>} />
  <Route path="/security"       element={<Guard k="security"><ErrorBoundary><SecurityIQ /></ErrorBoundary></Guard>} />
  <Route path="/delivery"       element={<Guard k="delivery"><ErrorBoundary><ValueChain /></ErrorBoundary></Guard>} />
  {/* ── Backward-compat redirects ─────────────────────────────────── */}
  <Route path="/outcomes"    element={<Navigate to="/performance"    replace />} />
  <Route path="/compliance"  element={<Navigate to="/accountability" replace />} />
  <Route path="/readiness"   element={<Navigate to="/data"           replace />} />
  <Route path="/hierarchy"   element={<Navigate to="/plant-map"      replace />} />
  <Route path="/supplier"    element={<Navigate to="/suppliers"      replace />} />
  <Route path="/batch"       element={<Navigate to="/batches"        replace />} />
  <Route path="/impact"      element={<Navigate to="/performance"    replace />} />
  <Route path="/analytics"   element={<Navigate to="/performance"    replace />} />
  <Route path="/digest"      element={<Navigate to="/performance"    replace />} />
  <Route path="/records"     element={<Navigate to="/accountability" replace />} />
  <Route path="/integration" element={<Navigate to="/data"           replace />} />
  <Route path="/execution"   element={<Navigate to="/agents"         replace />} />
  <Route path="/plant"       element={<Navigate to="/overview"       replace />} />
  <Route path="/handoff"     element={<Navigate to="/shift"          replace />} />
  <Route path="/network"     element={<Navigate to="/overview"       replace />} />
  <Route path="/robots"      element={<Navigate to="/shift"          replace />} />
  <Route path="/allocation"  element={<Navigate to="/shift"          replace />} />
 </Routes>
 </Suspense>
 </main>
 </div>
 )
}
