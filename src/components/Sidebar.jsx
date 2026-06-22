import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap, worstTone } from '../lib/utils'
import { NavLink, useNavigate } from 'react-router-dom'
import {
 Activity, Truck, ClipboardCheck,
 Gauge, Eye,
 Building2, ChevronDown,
 MapPin, ShieldCheck, AlertTriangle,
 LayoutGrid, BarChart2, Bell, User, Cpu,
 FlaskConical, Scale, Network, BookOpen, LayoutDashboard,
 Workflow, FileLock2, TrendingUp, ScanLine, CircleDot,
 Sun, Moon, Monitor, X, PanelLeft,
} from 'lucide-react'
import { useAppState, PLANTS } from '../context/AppState'
import { commandData, agentConfigData } from '../data'
import { openCases } from '../data/capa'
import { securityPosture } from '../data/security'
import { notificationSummary } from '../data/notifications'
import { lineQuality } from '../data/qualityiq'
import { shiftData } from '../data'
import { PersonAvatar, StatusPill } from './UI'

// ── Computed badge values — derived from data + AppState ──────────────────────
// CAPA badge: cases where the director must act (type 'cu' = critical/urgent)
const CAPA_DIRECTOR_COUNT = openCases.filter(c => c.type === 'cu').length
// Security badge: critical + high findings requiring remediation
const SECURITY_BADGE = securityPosture.findingsBySeverity.critical + securityPosture.findingsBySeverity.high

// Nav badge — severity-toned to match the in-screen StatusPill vocabulary
// (danger = red, warn = gold), so the sidebar reflects warning vs danger the
// same way screens do. Defaults to warn ("needs attention").
function NavBadge({ badge, badgeType, tone = 'warn' }) {
 if (!badge) return null
 if (badgeType === 'live') return (
 <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok beat" />
 )
 return <StatusPill tone={tone} dot={false} className="ml-auto">{badge}</StatusPill>
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

function SideItem({ to, icon: Icon, label, badge, badgeType, tone, disabled, id, onDisabledClick, collapsed }) {
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
    <span className="font-body text-sub">{label}</span>
   </button>
  )
 }
 if (collapsed) return (
  <NavTooltip label={label}>
   <NavLink to={to}
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full transition-colors duration-100 border-l-[3px] ` +
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
 `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-[3px] ` +
 (isActive
 ? `border-signal bg-signal/10 text-white font-medium`
 : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
 }
 >
 {({ isActive }) => (<>
 <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
 <span className="font-body text-sub">{label}</span>
 <NavBadge badge={badge} badgeType={badgeType} tone={tone} />
 </>)}
 </NavLink>
 )
}

function PlantItem({ collapsed, activeSituationCount, tone = 'danger' }) {
 const criticalCount = activeSituationCount ?? 0
 if (collapsed) return (
  <NavTooltip label={criticalCount > 0 ? `Overview · ${criticalCount} active` : 'Overview'}>
   <NavLink to="/overview"
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full border-l-[3px] transition-colors duration-100 ` +
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
    `flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 border-l-[3px] ` +
    (isActive
     ? `border-signal bg-signal/10 text-white font-medium`
     : `border-transparent text-white/50 hover:bg-sidebar-2 hover:text-white`)
   }
  >
   {() => (<>
    <LayoutGrid size={15} strokeWidth={2} className="flex-shrink-0" />
    <span className="font-body text-sub">Overview</span>
    <NavBadge badge={criticalCount > 0 ? String(criticalCount) : null} tone={tone} />
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
const DEMO_AGENT_KEYS = ['resource-0', 'supplier-0'] // pa3-emergency and pa2 in demo mode

function AgentItem({ count, collapsed, tone = 'warn' }) {
 if (collapsed) return (
  <NavTooltip label={`Agents${count > 0 ? ` (${count})` : ''}`}>
   <NavLink to="/agents"
    className={({ isActive }) =>
     `flex items-center justify-center h-10 w-full border-l-[3px] transition-colors ` +
     (isActive ? `border-l-danger bg-sidebar2 text-white` : `border-l-transparent text-white/50 hover:bg-sidebar2 hover:text-white`)
    }>
    {() => <Cpu size={15} strokeWidth={2} />}
   </NavLink>
  </NavTooltip>
 )
 return (
  <NavLink to="/agents"
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 border-l-[3px] ${isActive ? 'bg-sidebar2 border-l-danger text-white' : 'border-l-transparent text-white/50 hover:text-white'}`
   }>
   <Cpu size={15} strokeWidth={2} className="flex-shrink-0" />
   <span className="font-body text-sub">Agents</span>
   {count > 0 && <StatusPill tone={tone} dot={false} className="ml-auto">{count}</StatusPill>}
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
 const {
  blockingEvidenceUploaded, allergenOverride, checklistSigned, nearMisses, maintenanceTickets,
  viewingRole, setViewingRole, currentPlant, setCurrentPlant, workerMode,
  agentDecidedKeys, findingActions, closedCases,
  sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen, notifOpen, setNotifOpen,
  theme, setTheme, isDemoMode,
  activeSituations,
 } = useAppState() || {}
 const collapsed = !!sidebarCollapsed
 const agentPendingCount = isDemoMode
  ? DEMO_AGENT_KEYS.filter(k => !agentDecidedKeys?.has(k)).length
  : Math.max(0, STATIC_AGENT_TOTAL - (agentDecidedKeys?.size ?? 0))

 // ── Computed badge values + severity ─────────────────────────────────────────
 // UNIFIED RULE: a badge's tone = the worst open item in that module.
 // danger = at least one critical/blocking item · warn = needs attention, none
 // critical. Wherever the data carries a severity field we compute it; where it
 // doesn't, the comment says why the fixed tone is the honest level.
 //
 // Shift: from each unacted finding's `urgency` (matches in-screen Act Now/Watch).
 const unactedFindings = shiftData.findings.filter(f => !findingActions?.[f.id])
 const shiftBadge = unactedFindings.length || null
 const shiftTone = worstTone(unactedFindings.map(f => f.urgency)) ?? 'warn'
 // Undecided pending actions for an agent → their severities (decided key = `${agentId}-${index}`).
 const undecidedSeverities = (agent) =>
  (agent?.pendingActions ?? [])
   .filter((_, i) => !agentDecidedKeys?.has(`${agent.id}-${i}`))
   .map(a => a.severity)
 // Suppliers: tone = worst severity among the supplier agent's undecided actions.
 const supplierAgent = agentConfigData.agents.find(a => a.id === 'supplier')
 const supplierAgentPending = agentDecidedKeys
  ? Math.max(0, (supplierAgent?.pendingActions?.length ?? 0) -
      [...agentDecidedKeys].filter(k => k.startsWith('supplier-')).length)
  : 1
 const supplierBadge = supplierAgentPending > 0 ? String(supplierAgentPending) : null
 const supplierTone = worstTone(undecidedSeverities(supplierAgent)) ?? 'warn'
 // Agents: tone = worst severity across all agents' undecided actions.
 const agentTone = worstTone(agentConfigData.agents.flatMap(undecidedSeverities)) ?? 'warn'
 // Quality: open line-quality items (status alert→danger, watch→warn). Count + tone from data.
 const qualityStatusTone = { alert: 'danger', watch: 'warn' }
 const qualityOpen = lineQuality.filter(l => qualityStatusTone[l.status])
 const qualityBadge = qualityOpen.length ? String(qualityOpen.length) : null
 const qualityTone = worstTone(qualityOpen.map(l => qualityStatusTone[l.status])) ?? 'warn'
 // CAPA: the count IS critical/urgent (type 'cu') director-turn cases minus
 // closed — so whenever it shows, it is danger by definition.
 const capaBadge = Math.max(0, CAPA_DIRECTOR_COUNT - (closedCases?.filter(id => openCases.find(c => c.id === id && c.type === 'cu')).length ?? 0)) || null
 // Security: danger if any *critical* finding, else warn (high only).
 const securityBadge = SECURITY_BADGE > 0 ? String(SECURITY_BADGE) : null
 const securityTone = securityPosture.findingsBySeverity.critical > 0 ? 'danger' : 'warn'
 // Overview: worst urgency among the active (unresolved) situations.
 const overviewTone = worstTone(activeSituations?.map(s => s.urgency) ?? []) ?? 'danger'

 const modules = [
  { id:'shift',    label:'Shift',     path:'/shift',     icon:Activity,      badge: shiftBadge    ? String(shiftBadge)    : null, tone: shiftTone },
  { id:'suppliers',label:'Suppliers', path:'/suppliers', icon:Truck,         badge: supplierBadge, tone: supplierTone },
  { id:'quality',  label:'Quality',   path:'/quality',   icon:Eye,           badge: qualityBadge,  tone: qualityTone },
  { id:'capa',     label:'CAPA',      path:'/capa',      icon:ClipboardCheck,badge: capaBadge      ? String(capaBadge)     : null, tone:'danger' },
 ]

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
 <>
 <aside
  className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden transition-[transform,width] sm:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}
  style={{ width: collapsed ? 48 : 240, transitionDuration: 'var(--dur-quick)', transitionTimingFunction: 'var(--ease-spring)' }}
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
    <div className="flex-1 text-left min-w-0">
     <div className="font-body font-semibold text-ink text-label">Takorin</div>
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
  <div className="w-8 h-8 rounded-full bg-sidebar-2 flex items-center flex-shrink-0">
  <Building2 size={15} className="text-white/50" strokeWidth={2} />
  </div>
  <div className="flex-1 min-w-0">
  <div className="font-body text-white text-sub font-medium truncate">{currentPlant?.name || 'Salina Campus'}</div>
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
   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-label text-sidebar-ghost">Operational</div>}
   <SideItem to="/shift"   id="shift"   icon={Activity}      label="Shift"    badge="3" tone={shiftTone} collapsed={collapsed} />
   <SideItem to="/quality" id="quality" icon={Eye}           label="Quality"  badge={qualityBadge} tone={qualityTone} collapsed={collapsed} />
   <AgentItem count={agentPendingCount} collapsed={collapsed} tone={agentTone} />
   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-label text-sidebar-ghost">Causality</div>}
   <SideItem to="/performance" id="outcomes" icon={CircleDot} label="Performance" badge={null} collapsed={collapsed} />
  </>
 )}

 {/* ── Director: full intelligence graph ───────────────────────── */}
 {(viewingRole === 'director' || !viewingRole) && (
  <>
   <PlantItem collapsed={collapsed} activeSituationCount={activeSituations?.length ?? 0} tone={overviewTone} />

   {!collapsed && <div className="px-4 pt-4 pb-1 font-body text-label text-sidebar-ghost">Operations</div>}
   {modules.map(m => <SideItem key={m.id} to={m.path} id={m.id} {...m} collapsed={collapsed} />)}
   <AgentItem count={agentPendingCount} collapsed={collapsed} tone={agentTone} />
   <SideItem to="/performance" id="outcomes" icon={CircleDot} label="Performance" badge={null} collapsed={collapsed} />

   {!collapsed && (
    <button type="button" onClick={() => setPlatformExpanded(p => !p)}
     className="flex items-center justify-between w-full px-4 pt-4 pb-1 font-body text-label text-sidebar-ghost hover:text-white/50 transition-colors">
     <span>Platform</span>
     <ChevronDown size={10} className={`transition-transform duration-200 ${platformExpanded ? 'rotate-180' : ''}`} />
    </button>
   )}
   {(collapsed || platformExpanded) && (
    <>
     <SideItem to="/batch"      id="batch"      icon={FlaskConical}    label="Batches"    badge={null} collapsed={collapsed} />
     <SideItem to="/equipment"  id="equipment"  icon={ScanLine}        label="Equipment"  badge={null} collapsed={collapsed} />
     <SideItem to="/accountability" id="compliance" icon={Scale}           label="Accountability" badge={null} collapsed={collapsed} />
     <SideItem to="/knowledge"  id="knowledge"  icon={BookOpen}        label="Knowledge"  badge={null} collapsed={collapsed} />
     <SideItem to="/data"  id="readiness"  icon={Gauge}           label="Data"       badge={null} collapsed={collapsed} />
     <SideItem to="/security"   id="security"   icon={ShieldCheck}     label="Security"   badge={securityBadge} tone={securityTone} collapsed={collapsed} />
    </>
   )}

  </>
 )}

 </nav>


 {/* Compliance + Platform — hidden when collapsed */}
 {!collapsed && <div className="px-4 py-2.5 border-t border-sidebar-border">
 <div className="flex items-center justify-between">
 <span className="font-body text-white/50 text-label">Accountability</span>
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
   <ChevronDown size={13} className={`text-white/50 transition-transform duration-200 ease-spring ${userOpen ? 'rotate-180' : ''}`} />
   <button
    type="button"
    onClick={e => { e.stopPropagation(); setNotifOpen(true) }}
    className="relative w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
    aria-label="Notifications">
    <Bell size={18} strokeWidth={2} />
    {notificationSummary.count > 0 && (
     <span className="absolute -top-1 -right-1">
      <StatusPill tone={notificationSummary.tone} dot={false}>{notificationSummary.count}</StatusPill>
     </span>
    )}
   </button>
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

 </>
 )
}
