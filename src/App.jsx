import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import CommandSurface from './screens/CommandSurface'
import ShiftIQ from './screens/ShiftIQ'
import HandoffIQ from './screens/HandoffIQ'
import SupplierIQ from './screens/SupplierIQ'
import CAPAEngine from './screens/CAPAEngine'
import DataReadiness from './screens/DataReadiness'
import NetworkView from './screens/NetworkView'
import NotificationCenter from './screens/NotificationCenter'
import OperatorView from './screens/OperatorView'
import { useAppState } from './context/AppState'

const ROLE_LABELS = {
 director: null,
 supervisor: { name: 'D. Kowalski', role: 'Supervisor' },
 'operator-reyes': { name: 'C. Reyes', role: 'Operator L1' },
 'operator-okonkwo': { name: 'P. Okonkwo', role: 'Operator L2' },
}

export default function App() {
 const { notifPanelOpen, setNotifPanelOpen, viewingRole, setViewingRole } = useAppState()
 const roleInfo = viewingRole ? ROLE_LABELS[viewingRole] : null

 return (
 <div className="flex h-screen bg-stone overflow-hidden">
 <Sidebar />
 <main className="flex-1 flex flex-col overflow-hidden ml-[240px]">
 {roleInfo && (
 <div className="flex items-center justify-between px-4 py-2 bg-[#1e1a14] border-b border-[#3A342E] flex-shrink-0">
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
 <Routes>
 <Route path="/" element={<Navigate to="/command" replace />} />
 <Route path="/command" element={<ErrorBoundary><CommandSurface /></ErrorBoundary>} />
 <Route path="/shift" element={<ErrorBoundary><ShiftIQ /></ErrorBoundary>} />
 <Route path="/handoff" element={<ErrorBoundary><HandoffIQ /></ErrorBoundary>} />
 <Route path="/supplier" element={<ErrorBoundary><SupplierIQ /></ErrorBoundary>} />
 <Route path="/capa" element={<ErrorBoundary><CAPAEngine /></ErrorBoundary>} />
 <Route path="/readiness" element={<ErrorBoundary><DataReadiness /></ErrorBoundary>} />
 <Route path="/network" element={<ErrorBoundary><NetworkView /></ErrorBoundary>} />
 <Route path="/operator" element={<ErrorBoundary><OperatorView role={viewingRole} /></ErrorBoundary>} />
 </Routes>
 </main>
 {notifPanelOpen && (
 <NotificationCenter onClose={() => setNotifPanelOpen(false)} />
 )}
 </div>
 )
}
