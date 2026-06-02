import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../lib/utils'
import { NavLink, useNavigate } from 'react-router-dom'
import {
 Activity, Truck, ClipboardCheck,
 Gauge,
 Building2, ChevronDown,
 MapPin, ShieldCheck, AlertTriangle,
 LayoutGrid, BarChart2, Bell, User, Cpu,
 FlaskConical, Scale, Network, BookOpen, LayoutDashboard,
 Workflow, FileLock2, TrendingUp, ScanLine, CircleDot,
 Sun, Moon, Monitor, X, PanelLeft,
} from 'lucide-react'
import { useAppState, PLANTS } from '../context/AppState'
import { commandData, agentConfigData } from '../data'
import { PersonAvatar, StatusPill } from './UI'

const modules = [
 { id:'shift',    label:'Shift',     path:'/shift',    icon:Activity,      badge:'3', badgeType:'alert' },
 { id:'supplier', label:'Suppliers', path:'/supplier', icon:Truck,         badge:'1', badgeType:'alert' },
 { id:'capa',     label:'CAPA',      path:'/capa',     icon:ClipboardCheck,badge:'2', badgeType:'alert' },
]

function NavBadge({ badge, badgeType }) {
 if (!badge) return null
 if (badgeType === 'live') return (
 <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok beat" />
 )
 return <StatusPill tone="alert" dot={false} className="ml-auto">{badge}</StatusPill>
}

// Tooltip shown to the right of an icon when the sidebar is collapsed.
// Uses position:fixed so it escapes the sidebar's overflow:hidden.
function NavTooltip({ label, children }) {
 const ref = useRef(null)
 const [pos, setPos] = useState(null)
 return (
  <div ref={ref}
   onMouseEnter={() => {
    if (ref.current) {
     const r = ref.current.getBoundingClientRect()
     setPos({ top: r.top + r.height / 2, left: r.right })
    }
   }}
   onMouseLeave={() => setPos(null)}
  >
   {children}
   {pos && (
    <div className="fixed pointer-events-none z-[200]"
     style={{ top: pos.top, left: pos.left + 10, transform: 'translateY(-50%)' }}>
     <span className="block bg-sidebar border border-sidebar-border shadow-raise px-2.5 py-1.5 font-body text-label text-white/80 whitespace-nowrap">
      {label}
     </span>
    </div>
   )}
  </div>
 )
}

function SideItem({ to, icon: Icon, label, badge, badgeType, disabled, id, onDisabledClick, collapsed }) {
 if (disabled) {
  if (collapsed) return (
   <NavTooltip label={`${label} — not available`}>
    <button type="button" onClick={() => onDisabledClick?.(label)}
     className="flex items-center justify-center h-10 w-full opacity-40 cursor-not-allowed">
     <Icon size={15} strokeWidth={2} />
    </button>
   </NavTooltip>
  )
  return (
   <button type="button" onClick={() => onDisabledClick?.(label)}
    className="flex items-center gap-3 px-4 py-2.5 text-label opacity-40 cursor-not-allowed select-none w-full text-left">
    <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
    <span className="font-body text-base">{label}</span>
   </button>
  )
 }
 if (collapsed) return (
  <NavTooltip label={label}>
   <NavLink to={to}
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full transition-colors duration-100 border-l-2 ` +
     (isActive ? `border-signal bg-signal/10 text-white` : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
    }>
    {() => <Icon size={15} strokeWidth={2} />}
   </NavLink>
  </NavTooltip>
 )
 return (
 <NavLink
 to={to}
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2 ` +
 (isActive
 ? `border-signal bg-signal/10 text-white font-medium`
 : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
 }
 >
 {({ isActive }) => (<>
 <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
 <span className="font-body text-base">{label}</span>
 <NavBadge badge={badge} badgeType={badgeType} />
 </>)}
 </NavLink>
 )
}

function PlantItem({ collapsed }) {
 // Decision badge: 2 critical (T3 agent ratification + COA hold)
 const criticalCount = 2
 if (collapsed) return (
  <NavTooltip label={`Overview · ${criticalCount} critical`}>
   <NavLink to="/overview"
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full border-l-2 transition-colors duration-100 ` +
     (isActive ? `border-signal bg-signal/10 text-white` : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
    }>
    {() => <LayoutGrid size={15} strokeWidth={2} />}
   </NavLink>
  </NavTooltip>
 )
 return (
  <NavLink
   to="/overview"
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 border-l-2 ` +
    (isActive
     ? `border-signal bg-signal/10 text-white font-medium`
     : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
   }
  >
   {() => (<>
    <LayoutGrid size={15} strokeWidth={2} className="flex-shrink-0" />
    <span className="font-body text-base">Overview</span>
    <span className="ml-auto text-label font-semibold px-1.5 py-0.5 bg-danger text-white">
     {criticalCount}
    </span>
   </>)}
  </NavLink>
 )
}


const AVAILABLE_PLANTS = [PLANTS.sl, PLANTS.ks, PLANTS.co]
const DISABLED_PLANTS = [
 { name: 'Topeka Plant', code: 'KS-02' },
]

function PlantDropdown({ triggerRef, onClose, complianceState, currentPlant, setCurrentPlant }) {
 const dropRef = useRef(null)
 const [pos, setPos] = useState({ top: 60 })
 useFocusTrap(dropRef)
 const navigate = useNavigate()

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   setPos({ top: r.bottom })
  }
 }, [triggerRef])

 useEffect(() => {
  function handleClick(e) {
   if (
    dropRef.current && !dropRef.current.contains(e.target) &&
    triggerRef.current && !triggerRef.current.contains(e.target)
   ) onClose()
  }
  function handleKey(e) { if (e.key === 'Escape') onClose() }
  document.addEventListener('mousedown', handleClick)
  document.addEventListener('keydown', handleKey)
  return () => {
   document.removeEventListener('mousedown', handleClick)
   document.removeEventListener('keydown', handleKey)
  }
 }, [onClose, triggerRef])

 const complianceTone =
  complianceState === 'blocked' ? { cls: 'text-danger bg-danger/[0.04]', icon: AlertTriangle, label: 'Compliance blocked' }
  : complianceState === 'attention' ? { cls: 'text-warn bg-warn/10', icon: AlertTriangle, label: 'Needs attention' }
  : { cls: 'text-ok bg-ok/10', icon: ShieldCheck, label: 'Compliance clear' }

 return (
  <div
   ref={dropRef}
   className="fixed z-50 plant-drop-in"
   style={{ left: 0, top: Math.max(8, pos.top) }}
  >
   {/* Card */}
   <div className="w-[240px] bg-sidebar border border-sidebar-border shadow-raise overflow-hidden">
    <div className="plant-drop-in-content">

     {/* Network plants */}
     <div className="px-5 pt-3 pb-4">
      {AVAILABLE_PLANTS.map(p => {
       const isActive = currentPlant.id === p.id
       const modeColor = p.workerMode === 'robot' ? 'text-signal' : p.workerMode === 'hybrid' ? 'text-warn' : 'text-ok'
       const modeLabel = p.workerMode === 'robot' ? 'Robotic' : p.workerMode === 'hybrid' ? 'Hybrid' : 'Human'
       return (
        <button
         key={p.id}
         type="button"
         onClick={() => { if (!isActive) { setCurrentPlant(p); onClose() } }}
         className={`flex items-center justify-between w-full py-1.5 ${isActive ? 'cursor-default' : 'hover:opacity-80 transition-opacity'}`}
        >
         <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-sidebar-3 flex items-center justify-center flex-shrink-0">
           <Building2 size={10} strokeWidth={2} className={isActive ? 'text-signal' : 'text-white/50'} />
          </div>
          <div className="text-left">
           <span className={`font-body text-label block leading-tight ${isActive ? 'text-white font-medium' : 'text-white/50'}`}>{p.name}</span>
           <span className={`font-body text-white/50 text-label`}>{modeLabel}</span>
          </div>
         </div>
        </button>
       )
      })}
      {DISABLED_PLANTS.map(p => (
       <div key={p.name} className="flex items-center justify-between py-1.5 opacity-40">
        <div className="flex items-center gap-2">
         <div className="w-5 h-5 rounded bg-sidebar-3 flex items-center justify-center flex-shrink-0">
          <Building2 size={10} strokeWidth={2} className="text-white/50" />
         </div>
         <span className="font-body text-white/50 text-label">{p.name}</span>
        </div>
        <span className="font-body text-white/50 text-label">Not in pilot</span>
       </div>
      ))}
     </div>

    </div>
   </div>
  </div>
 )
}


// ── UserDropdown ──────────────────────────────────────────────────────────────

function UserDropdown({ triggerRef, onClose, viewingRole, setViewingRole }) {
 const dropRef = useRef(null)
 const [pos, setPos] = useState({ bottom: 60, left: 0 })
 useFocusTrap(dropRef)
 const navigate = useNavigate()

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   // Anchor dropdown bottom to 4px above the trigger top, flush with the sidebar left edge
   setPos({
    bottom: window.innerHeight - r.top + 4,
    left: r.left,
   })
  }
 }, [triggerRef])

 useEffect(() => {
  function handleClick(e) {
   if (
    dropRef.current && !dropRef.current.contains(e.target) &&
    triggerRef.current && !triggerRef.current.contains(e.target)
   ) onClose()
  }
  function handleKey(e) { if (e.key === 'Escape') onClose() }
  document.addEventListener('mousedown', handleClick)
  document.addEventListener('keydown', handleKey)
  return () => {
   document.removeEventListener('mousedown', handleClick)
   document.removeEventListener('keydown', handleKey)
  }
 }, [onClose, triggerRef])

 const roles = [
  { id: 'director',         name: 'J. Crocker',  role: 'Plant Director',  route: '/overview' },
  { id: 'supervisor',       name: 'D. Kowalski', role: 'Supervisor · L4', route: '/shift' },
  { id: 'operator-reyes',   name: 'C. Reyes',    role: 'Operator · L1',   route: '/operator' },
  { id: 'operator-okonkwo', name: 'P. Okonkwo',  role: 'Operator · L2',   route: '/operator' },
 ]

 return (
  <div
   ref={dropRef}
   className="fixed z-50 plant-drop-in"
   style={{ left: pos.left, bottom: pos.bottom }}
  >
   <div className="w-[240px] bg-sidebar border border-sidebar-border shadow-raise overflow-hidden" style={{ maxHeight: 'calc(100vh - 24px)' }}>
    <div className="plant-drop-in-content">
     {/* Viewing as */}
     <div className="px-5 pt-3 pb-4">
      {roles.map(r => (
       <button key={r.id} type="button"
        aria-pressed={viewingRole === r.id}
        onClick={() => { setViewingRole(r.id); navigate(r.route); onClose() }}
        className="flex items-center gap-2.5 w-full py-1.5 group"
       >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${viewingRole === r.id ? 'bg-signal' : 'bg-sidebar-border group-hover:bg-sidebar-3'}`} />
        <PersonAvatar name={r.name} size={20} />
        <div className="flex-1 text-left min-w-0">
         <div className={`font-body text-label font-medium truncate transition-colors ${viewingRole === r.id ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>{r.name}</div>
         <div className="font-body text-white/50 text-label">{r.role}</div>
        </div>
       </button>
      ))}
     </div>

    </div>
   </div>
  </div>
 )
}

const STATIC_AGENT_TOTAL = agentConfigData.agents.reduce((n, a) => n + (a.pendingActions?.length ?? 0), 0)

function AgentItem({ count, collapsed }) {
 if (collapsed) return (
  <NavTooltip label={`Agents${count > 0 ? ` (${count})` : ''}`}>
   <NavLink to="/agents"
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full border-l-2 transition-colors ` +
     (isActive ? `border-l-danger bg-sidebar2 text-white` : `border-l-transparent text-white/50 hover:bg-sidebar2 hover:text-white`)
    }>
    {() => <Cpu size={15} strokeWidth={2} />}
   </NavLink>
  </NavTooltip>
 )
 return (
  <NavLink to="/agents"
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 border-l-2 ${isActive ? 'bg-sidebar2 border-l-danger text-white' : 'border-l-transparent text-white/50 hover:text-white'}`
   }>
   <Cpu size={15} strokeWidth={2} className="flex-shrink-0" />
   <span className="font-body text-base">Agents</span>
   {count > 0 && <StatusPill tone="alert" dot={false} className="ml-auto">{count}</StatusPill>}
  </NavLink>
 )
}

export default function Sidebar() {
 const [plantOpen, setPlantOpen] = useState(false)
 const plantTriggerRef = useRef(null)
 const [userOpen, setUserOpen] = useState(false)
 const userTriggerRef = useRef(null)
 const [platformExpanded, setPlatformExpanded] = useState(true)
 const [toast, setToast] = useState(null)
 const { blockingEvidenceUploaded, allergenOverride, checklistSigned, nearMisses, maintenanceTickets, viewingRole, setViewingRole, currentPlant, setCurrentPlant, workerMode, agentDecidedKeys, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen, notifOpen, setNotifOpen, theme, setTheme } = useAppState() || {}
 const collapsed = !!sidebarCollapsed
 const agentPendingCount = Math.max(0, STATIC_AGENT_TOTAL - (agentDecidedKeys?.size ?? 0))

 const allergenSigned = checklistSigned?.['allergen'] || !!allergenOverride
 const complianceState = currentPlant?.id === 'ks' ? 'clear' : (!blockingEvidenceUploaded ? 'blocked' : !allergenSigned ? 'attention' : 'clear')
 const complianceLabel = complianceState === 'blocked' ? 'Blocked' : complianceState === 'attention' ? 'Attention' : 'Clear'
 const complianceColor = complianceState === 'blocked' ? 'text-danger bg-danger/[0.04]' : complianceState === 'attention' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'
 const platformConf = complianceState === 'blocked' ? 'degraded' : agentPendingCount > 0 ? 'warn' : 'ok'
 const platformConfLabel = platformConf === 'degraded' ? 'Degraded' : platformConf === 'warn' ? 'Partial' : 'Ready'
 const platformConfColor = platformConf === 'degraded' ? 'text-danger bg-danger/[0.04]' : platformConf === 'warn' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'
 const platformConfNote = platformConf === 'degraded' ? 'SCADA stale · 2 critical decisions pending' : platformConf === 'warn' ? `${agentPendingCount} decision${agentPendingCount !== 1 ? 's' : ''} pending · data nominal` : 'All agents nominal · data fresh'
 // Standing compliance items (2 always present + 1 evidence gap if not yet uploaded)
 // plus dynamic safety events the director hasn't seen
 const standingCount = blockingEvidenceUploaded ? 2 : 3

 const showToast = (label) => {
 setToast(label)
 setTimeout(() => setToast(null), 2000)
 }

 return (
 <aside
  className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden transition-[transform,width] sm:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}
  style={{ width: collapsed ? 48 : 240, transitionDuration: '200ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
 >
 {/* Brand — click to toggle collapse */}
 <button
  type="button"
  onClick={toggleSidebar}
  className={`flex items-center border-b border-sidebar-border bg-sidebar2 hover:bg-sidebar-3 transition-colors flex-shrink-0 ${collapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3.5'}`}
  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
 >
  {collapsed ? (
   <PanelLeft size={18} strokeWidth={1.8} className="flex-shrink-0 text-sidebar-ghost" aria-hidden="true" />
  ) : (
   <>
    <svg width="18" height="18" viewBox="0 0 22 22" aria-hidden="true" className="flex-shrink-0">
     <path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke="var(--color-signal)" strokeWidth="1.3"/>
     <path d="M8 13 L14 13 L14 7 Z" fill="var(--color-signal)"/>
    </svg>
    <div className="flex-1 min-w-0">
     <div className="font-body font-bold text-ink text-label leading-none">Takorin</div>
    </div>
   </>
  )}
  {/* Close button — mobile only */}
  {!collapsed && mobileNavOpen && (
   <button
    type="button"
    onClick={() => setMobileNavOpen(false)}
    className="sm:hidden ml-auto text-white/40 hover:text-white/70 transition-colors p-0.5"
    aria-label="Close navigation">
    <X size={14} strokeWidth={2} />
   </button>
  )}
 </button>

 {/* Facility — hidden when collapsed */}
 {!collapsed && <button
  ref={plantTriggerRef}
  type="button"
  onClick={() => setPlantOpen(p => !p)}
  className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border w-full text-left hover:bg-sidebar2 transition-colors"
 >
  <div className="w-8 h-8 rounded-full bg-sidebar-2 flex items-center justify-center flex-shrink-0">
  <Building2 size={15} className="text-white/50" strokeWidth={2} />
  </div>
  <div className="flex-1 min-w-0">
  <div className="font-body text-white text-base font-medium truncate">{currentPlant?.name || 'Salina Campus'}</div>
  <div className="font-body text-white/50 text-label">Plant ID {currentPlant?.code || 'SL-04'}</div>
  </div>
  <ChevronDown
  size={13}
  className={`text-white/50 flex-shrink-0 transition-transform duration-200 ease-spring ${plantOpen ? 'rotate-180' : ''}`}
  />
 </button>}

 {/* Plant dropdown — floats right of the sidebar */}
 {plantOpen && createPortal(
  <PlantDropdown
   triggerRef={plantTriggerRef}
   onClose={() => setPlantOpen(false)}
   complianceState={complianceState}
   currentPlant={currentPlant || PLANTS.sl}
   setCurrentPlant={setCurrentPlant || (() => {})}
  />,
  document.body
 )}

 {/* Nav */}
 <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-2">

 {/* ── Operator: 1 screen ─────────────────────────────────────── */}
 {(viewingRole === 'operator-reyes' || viewingRole === 'operator-okonkwo') && (
  <SideItem to="/operator" id="operator" icon={User} label="My Station" badge={null} collapsed={collapsed} />
 )}

 {/* ── Supervisor: 3 screens (ShiftIQ contains Handoff/Fleet/Allocation as tabs) */}
 {viewingRole === 'supervisor' && (
  <>
   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost">Operational</div>}
   <SideItem to="/shift"  id="shift"  icon={Activity} label="Shift"        badge="3" badgeType="alert" collapsed={collapsed} />
   <AgentItem count={agentPendingCount} collapsed={collapsed} />
   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost">Causality</div>}
   <SideItem to="/outcomes" id="outcomes" icon={CircleDot} label="Outcomes" badge={null} collapsed={collapsed} />
   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost">Activity</div>}
   {collapsed ? (
    <NavTooltip label="Notifications">
     <button type="button" onClick={() => setNotifOpen(true)}
      className="flex items-center justify-center h-10 w-full text-white/50 hover:bg-sidebar2 hover:text-white transition-colors">
      <Bell size={15} strokeWidth={2} />
     </button>
    </NavTooltip>
   ) : (
    <button type="button" onClick={() => setNotifOpen(true)}
     className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 text-white/70">
     <Bell size={15} strokeWidth={2} className="flex-shrink-0" />
     <span className="font-body text-base">Notifications</span>
     <StatusPill tone="alert" dot={false} className="ml-auto">4</StatusPill>
    </button>
   )}
  </>
 )}

 {/* ── Director: full intelligence graph ───────────────────────── */}
 {(viewingRole === 'director' || !viewingRole) && (
  <>
   <PlantItem collapsed={collapsed} />

   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost">Operations</div>}
   {modules.map(m => <SideItem key={m.id} to={m.path} id={m.id} {...m} collapsed={collapsed} />)}
   <AgentItem count={agentPendingCount} collapsed={collapsed} />
   <SideItem to="/analytics" id="analytics" icon={BarChart2} label="Analytics" badge={null} collapsed={collapsed} />
   <SideItem to="/outcomes" id="outcomes" icon={CircleDot} label="Outcomes" badge={null} collapsed={collapsed} />

   {!collapsed && (
    <button type="button" onClick={() => setPlatformExpanded(p => !p)}
     className="flex items-center justify-between w-full px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost hover:text-white/50 transition-colors">
     <span>Platform</span>
     <ChevronDown size={10} className={`transition-transform duration-200 ${platformExpanded ? 'rotate-180' : ''}`} />
    </button>
   )}
   {(collapsed || platformExpanded) && (
    <>
     <SideItem to="/batch"       id="batch"       icon={FlaskConical}    label="Batches"      badge={null} collapsed={collapsed} />
     <SideItem to="/equipment" id="equipment"  icon={ScanLine}        label="Equipment"    badge={null} collapsed={collapsed} />
     <SideItem to="/compliance"  id="compliance"  icon={Scale}           label="Compliance"   badge={null} collapsed={collapsed} />
     <SideItem to="/knowledge"   id="knowledge"   icon={BookOpen}        label="Knowledge"    badge={null} collapsed={collapsed} />
     <SideItem to="/execution"   id="execution"   icon={Workflow}        label="Autonomy"     badge={null} collapsed={collapsed} />
     <SideItem to="/hierarchy"   id="hierarchy"   icon={LayoutDashboard} label="Site"         badge={null} collapsed={collapsed} />
     <SideItem to="/records"   id="records"    icon={FileLock2}  label="Records"     badge={null} collapsed={collapsed} />
     <SideItem to="/integration" id="integration" icon={Network} label="Integrations" badge={null} collapsed={collapsed} />
     <SideItem to="/readiness"   id="readiness"   icon={Gauge}   label="Data Quality"  badge={null} collapsed={collapsed} />
    </>
   )}

   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-micro text-sidebar-ghost">Activity</div>}
   {collapsed ? (
    <NavTooltip label="Notifications">
     <button type="button" onClick={() => setNotifOpen(true)}
      className="flex items-center justify-center h-10 w-full text-white/50 hover:bg-sidebar2 hover:text-white transition-colors">
      <Bell size={15} strokeWidth={2} />
     </button>
    </NavTooltip>
   ) : (
    <button type="button" onClick={() => setNotifOpen(true)}
     className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 text-white/70">
     <Bell size={15} strokeWidth={2} className="flex-shrink-0" />
     <span className="font-body text-base">Notifications</span>
     <StatusPill tone="alert" dot={false} className="ml-auto">4</StatusPill>
    </button>
   )}
  </>
 )}

 </nav>

 {/* Theme toggle */}
 {!collapsed && (
  <div className="px-3 py-2 border-t border-sidebar-border flex items-center gap-px">
   {[
    { id: 'light', Icon: Sun,     label: 'Light' },
    { id: 'auto',  Icon: Monitor, label: 'Auto'  },
    { id: 'dark',  Icon: Moon,    label: 'Dark'  },
   ].map(({ id, Icon, label }) => (
    <button key={id} type="button" onClick={() => setTheme?.(id)}
     className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors rounded-sm ${
      theme === id ? 'text-white bg-sidebar2' : 'text-white/30 hover:text-white/50'
     }`}
     aria-label={`${label} mode`}>
     <Icon size={11} strokeWidth={2} />
     <span className="font-body" style={{ fontSize: 9, lineHeight: 1 }}>{label}</span>
    </button>
   ))}
  </div>
 )}
 {collapsed && (
  <button type="button"
   onClick={() => setTheme?.(theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark')}
   className="flex items-center justify-center h-9 w-full text-white/30 hover:text-white/50 transition-colors border-t border-sidebar-border"
   aria-label="Cycle theme">
   {theme === 'light' ? <Sun size={13} strokeWidth={2} /> : theme === 'dark' ? <Moon size={13} strokeWidth={2} /> : <Monitor size={13} strokeWidth={2} />}
  </button>
 )}

 {/* Compliance + Platform — hidden when collapsed */}
 {!collapsed && <div className="px-4 py-2.5 border-t border-sidebar-border">
 <div className="flex items-center justify-between">
 <span className="font-body text-white/50 text-label">Compliance</span>
 <span className={`font-body font-medium text-label px-2 py-0.5 ${complianceColor}`}>
 {complianceLabel}
 </span>
 </div>
 <div className="font-body text-white/50 text-label mt-0.5 leading-relaxed">
 {complianceState === 'blocked' && 'CAPA-2604-006 evidence missing · FDA export blocked'}
 {complianceState === 'attention' && 'Allergen changeover log unsigned · Line 4'}
 {complianceState === 'clear' && 'No blocking compliance items · 18d to FDA inspection'}
 </div>
 <div className="flex items-center justify-between mt-2">
  <span className="font-body text-white/50 text-label">Platform</span>
  <span className={`font-body font-medium text-label px-2 py-0.5 ${platformConfColor}`}>
   {platformConfLabel}
  </span>
 </div>
 <div className="font-body text-white/50 text-label mt-0.5 leading-relaxed">
  {platformConfNote}
 </div>
 </div>}

 {/* User — hidden when collapsed */}
 {!collapsed && <button
  ref={userTriggerRef}
  type="button"
  onClick={() => setUserOpen(p => !p)}
  className="flex items-center gap-2.5 px-4 py-3 border-t border-sidebar-border w-full text-left hover:bg-sidebar2 transition-colors"
 >
  <PersonAvatar name="J. Crocker" size={16} />
  <div className="flex-1 min-w-0">
  <div className="font-body text-white text-body font-medium">J. Crocker</div>
  <div className="font-body text-white/50 text-label">
   {viewingRole === 'supervisor' ? <span className="text-signal">Viewing as Kowalski</span> : viewingRole === 'operator-reyes' ? <span className="text-signal">Viewing as C. Reyes</span> : viewingRole === 'operator-okonkwo' ? <span className="text-signal">Viewing as P. Okonkwo</span> : 'Plant Director'}
  </div>
  </div>
  <div className="flex items-center gap-1.5 flex-shrink-0">
   <button
    type="button"
    onClick={e => { e.stopPropagation(); setNotifOpen(true) }}
    className="relative w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
    aria-label="Notifications">
    <Bell size={18} strokeWidth={2} />
    <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-danger flex items-center justify-center">
     <span className="font-body text-[8px] font-bold text-white leading-none">4</span>
    </span>
   </button>
   <ChevronDown size={13} className={`text-white/50 transition-transform duration-200 ease-spring ${userOpen ? 'rotate-180' : ''}`} />
  </div>
 </button>}
 {!collapsed && userOpen && createPortal(
  <UserDropdown
   triggerRef={userTriggerRef}
   onClose={() => setUserOpen(false)}
   viewingRole={viewingRole || 'director'}
   setViewingRole={setViewingRole || (() => {})}
  />,
  document.body

 )}

 {/* Toast */}
 {toast && (
 <div className="fixed bottom-4 left-4 z-50 bg-sidebar border border-sidebar-border px-3 py-2 slide-in">
 <span className="font-body text-white/50 text-label">{toast} — not available in pilot</span>
 </div>
 )}
 </aside>
 )
}
