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
import OperatorView from './screens/OperatorView'
import NotificationCenter from './screens/NotificationCenter'
import { useAppState } from './context/AppState'

export default function App() {
  const { notifPanelOpen, setNotifPanelOpen } = useAppState()
  return (
    <div className="flex h-screen bg-stone overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden ml-[240px]">
        <Routes>
          <Route path="/" element={<Navigate to="/command" replace />} />
          <Route path="/command" element={<ErrorBoundary><CommandSurface /></ErrorBoundary>} />
          <Route path="/shift"     element={<ErrorBoundary><ShiftIQ /></ErrorBoundary>} />
          <Route path="/handoff"   element={<ErrorBoundary><HandoffIQ /></ErrorBoundary>} />
          <Route path="/supplier"  element={<ErrorBoundary><SupplierIQ /></ErrorBoundary>} />
          <Route path="/capa"      element={<ErrorBoundary><CAPAEngine /></ErrorBoundary>} />
          <Route path="/readiness" element={<ErrorBoundary><DataReadiness /></ErrorBoundary>} />
          <Route path="/network"   element={<ErrorBoundary><NetworkView /></ErrorBoundary>} />
          <Route path="/operator"  element={<ErrorBoundary><OperatorView /></ErrorBoundary>} />
        </Routes>
      </main>
      {notifPanelOpen && (
        <NotificationCenter onClose={() => setNotifPanelOpen(false)} />
      )}
    </div>
  )
}
