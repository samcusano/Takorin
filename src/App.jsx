import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import { useAppState } from './context/AppState'

const CommandSurface   = lazy(() => import('./screens/CommandSurface'))
const PlantOverview    = lazy(() => import('./screens/PlantOverview'))
const ShiftIQ          = lazy(() => import('./screens/ShiftIQ'))
const HandoffIQ        = lazy(() => import('./screens/HandoffIQ'))
const SupplierIQ       = lazy(() => import('./screens/SupplierIQ'))
const CAPAEngine       = lazy(() => import('./screens/CapaEngine'))
const DataReadiness    = lazy(() => import('./screens/DataReadiness'))
const NetworkView      = lazy(() => import('./screens/NetworkView'))
const OperatorView     = lazy(() => import('./screens/OperatorView'))
const Analytics        = lazy(() => import('./screens/Analytics'))
const NotificationCenter = lazy(() => import('./screens/NotificationCenter'))
const DesignLabPage    = lazy(() => import('./__design_lab/DesignLabPage'))
const AnalyticsLabPage = lazy(() => import('./__design_lab/AnalyticsLabPage'))

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
 <Route path="/command" element={<ErrorBoundary><CommandSurface /></ErrorBoundary>} />
 <Route path="/shift" element={<ErrorBoundary><ShiftIQ /></ErrorBoundary>} />
 <Route path="/handoff" element={<ErrorBoundary><HandoffIQ /></ErrorBoundary>} />
 <Route path="/supplier" element={<ErrorBoundary><SupplierIQ /></ErrorBoundary>} />
 <Route path="/capa" element={<ErrorBoundary><CAPAEngine /></ErrorBoundary>} />
 <Route path="/readiness" element={<ErrorBoundary><DataReadiness /></ErrorBoundary>} />
 <Route path="/network" element={<ErrorBoundary><NetworkView /></ErrorBoundary>} />
 <Route path="/operator" element={<ErrorBoundary><OperatorView role={viewingRole} /></ErrorBoundary>} />
 <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
 <Route path="/digest" element={<Navigate to="/analytics" replace />} />
 <Route path="/notifications" element={<ErrorBoundary><NotificationCenter /></ErrorBoundary>} />
 <Route path="/__design_lab" element={<DesignLabPage />} />
 <Route path="/__analytics_lab" element={<AnalyticsLabPage />} />
 </Routes>
 </Suspense>
 </main>
 </div>
 )
}
