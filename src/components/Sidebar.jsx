import { useState, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { useAppState, PLANTS } from '../context/AppState'
import { commandData, agentConfigData } from '../data'
import { PersonAvatar } from './UI'
import NotificationCenter from '../screens/NotificationCenter'

const modules = [
 { id:'shift',    label:'ShiftIQ',     path:'/shift',    icon:Activity,      badge:'3', badgeType:'alert' },
 { id:'supplier', label:'SupplierIQ',  path:'/supplier', icon:Truck,         badge:'1', badgeType:'alert' },
 { id:'capa',     label:'CAPA Engine', path:'/capa',     icon:ClipboardCheck,badge:'2', badgeType:'alert' },
 { id:'analytics',label:'Analytics',   path:'/analytics',icon:BarChart2,     badge:null },
]

function Badge({ badge, badgeType }) {
 if (!badge) return null
 if (badgeType === 'live') return (
 <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok beat" />
 )
 if (badgeType === 'score') return (
 <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-ochre text-stone font-body rounded-btn">
 {badge}
 </span>
 )
 return (
 <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-danger text-white rounded-btn">
 {badge}
 </span>
 )
}

function SideItem({ to, icon: Icon, label, badge, badgeType, disabled, id, onDisabledClick }) {
 if (disabled) return (
 <button type="button"
 onClick={() => onDisabledClick?.(label)}
 className="flex items-center gap-3 px-4 py-2.5 text-sm opacity-40 cursor-not-allowed select-none w-full text-left"
 >
 <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
 <span className="font-body">{label}</span>
 </button>
 )
 return (
 <NavLink
 to={to}
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2 ` +
 (isActive
 ? `border-ochre bg-ochre/10 text-stone font-medium`
 : `border-transparent text-stone/70 hover:bg-sidebar-2 hover:text-stone`)
 }
 >
 {({ isActive }) => (<>
 <Icon
 size={15}
 strokeWidth={1.75}
 className="flex-shrink-0"
 />
 <span className="font-body">{label}</span>
 <Badge badge={badge} badgeType={badgeType} />
 </>)}
 </NavLink>
 )
}

function PlantItem() {
 const { commandAcknowledged } = useAppState() || {}
 const acknowledged = commandAcknowledged || new Set()
 const activeCount = commandData.items.filter(
  i => !acknowledged.has(i.id) && i.urgency !== 'watch'
 ).length
 const criticalCount = commandData.items.filter(
  i => !acknowledged.has(i.id) && i.urgency === 'danger'
 ).length
 return (
  <NavLink
   to="/plant"
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2 ` +
    (isActive
     ? `border-ochre bg-ochre/10 text-stone font-medium`
     : `border-transparent text-stone/70 hover:bg-sidebar-2 hover:text-stone`)
   }
  >
   {() => (<>
    <LayoutGrid size={15} strokeWidth={1.75} className="flex-shrink-0" />
    <span className="font-body flex-1">Plant Overview</span>
    {activeCount > 0 && (
     <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 ${
      criticalCount > 0 ? 'bg-danger text-white' : 'bg-warn/20 text-warn'
     }`}>
      {activeCount}
     </span>
    )}
   </>)}
  </NavLink>
 )
}


const AVAILABLE_PLANTS = [PLANTS.sl, PLANTS.ks, PLANTS.co]
const DEMO_PLANTS = [PLANTS.se, PLANTS.de]
const DISABLED_PLANTS = [
 { name: 'Topeka Plant', code: 'KS-02' },
]

const SECTOR_LABELS = { food: 'Food', pharma: 'Pharma', electronics: 'Electronics', semiconductor: 'Semiconductor' }
const SECTOR_COLORS = { food: 'text-ok', pharma: 'text-ochre', electronics: 'text-warn', semiconductor: 'text-ghost' }

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
  complianceState === 'blocked' ? { cls: 'text-danger bg-danger/10', icon: AlertTriangle, label: 'Compliance blocked' }
  : complianceState === 'attention' ? { cls: 'text-warn bg-warn/10', icon: AlertTriangle, label: 'Needs attention' }
  : { cls: 'text-ok bg-ok/10', icon: ShieldCheck, label: 'Compliance clear' }

 return (
  <div
   ref={dropRef}
   className="fixed z-50 plant-drop-in"
   style={{ left: 0, top: Math.max(8, pos.top) }}
  >
   {/* Card */}
   <div className="w-[240px] bg-sidebar border border-sidebar-border rounded-2xl shadow-raise overflow-hidden">
    <div className="plant-drop-in-content">

     {/* Header */}
     <div className="flex flex-col items-center text-center px-5 pt-5 pb-4">
      <div className="w-14 h-14 rounded-2xl bg-sidebar-3 border border-sidebar-border flex items-center justify-center mb-3 flex-shrink-0">
       <Building2 size={24} strokeWidth={1.5} className="text-ochre" />
      </div>
      <h2 className="font-display font-bold text-stone text-[15px] leading-snug">{currentPlant.name}</h2>
      <p className="font-body text-stone/70 text-[11px] mt-0.5">{currentPlant.code}</p>
      <div className="flex items-center gap-1 mt-1.5 font-body text-stone/70/60 text-[10px]">
       <MapPin size={9} strokeWidth={2} />
       <span>{currentPlant.region} · AM shift</span>
      </div>
      <div className={`flex items-center gap-1 mt-2 px-2 py-0.5 rounded font-body text-[10px] font-medium ${complianceTone.cls}`}>
       <complianceTone.icon size={9} strokeWidth={2.5} />
       {complianceTone.label}
      </div>
     </div>

     {/* Divider */}
     <div className="mx-5 h-px bg-sidebar-border" />

     {/* Network plants */}
     <div className="px-5 pt-3 pb-4">
      <p className="font-body text-stone/70/40 text-[10px] uppercase tracking-widest mb-2">Network plants</p>
      {AVAILABLE_PLANTS.map(p => {
       const isActive = currentPlant.id === p.id
       const modeColor = p.workerMode === 'robot' ? 'text-ochre' : p.workerMode === 'hybrid' ? 'text-warn' : 'text-ok'
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
           <Building2 size={10} strokeWidth={1.75} className={isActive ? 'text-ochre' : 'text-stone/70'} />
          </div>
          <div className="text-left">
           <span className={`font-body text-[11px] block leading-tight ${isActive ? 'text-stone font-medium' : 'text-stone/70'}`}>{p.name}</span>
           <span className={`font-body text-[9px] ${modeColor}`}>{modeLabel}</span>
          </div>
         </div>
         {isActive
          ? <span className="font-body text-ochre text-[10px]">Active</span>
          : <span className="font-body text-stone/70/60 text-[10px]">Switch →</span>
         }
        </button>
       )
      })}
      {DISABLED_PLANTS.map(p => (
       <div key={p.name} className="flex items-center justify-between py-1.5 opacity-40">
        <div className="flex items-center gap-2">
         <div className="w-5 h-5 rounded bg-sidebar-3 flex items-center justify-center flex-shrink-0">
          <Building2 size={10} strokeWidth={1.75} className="text-stone/70" />
         </div>
         <span className="font-body text-stone/70 text-[11px]">{p.name}</span>
        </div>
        <span className="font-body text-stone/70/60 text-[10px]">Not in pilot</span>
       </div>
      ))}
     </div>

     {/* Demo sector plants */}
     <div className="mx-5 h-px bg-sidebar-border" />
     <div className="px-5 pt-3 pb-4">
      <p className="font-body text-stone/70/40 text-[10px] uppercase tracking-widest mb-2">Sector demos</p>
      {DEMO_PLANTS.map(p => {
       const isActive = currentPlant.id === p.id
       const sectorColor = SECTOR_COLORS[p.sector] ?? 'text-ghost'
       const sectorLabel = SECTOR_LABELS[p.sector] ?? p.sector
       return (
        <button key={p.id} type="button"
         onClick={() => { if (!isActive) { setCurrentPlant(p); onClose() } }}
         className={`flex items-center justify-between w-full py-1.5 ${isActive ? 'cursor-default' : 'hover:opacity-80 transition-opacity'}`}>
         <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-sidebar-3 flex items-center justify-center flex-shrink-0">
           <Building2 size={10} strokeWidth={1.75} className={isActive ? 'text-ochre' : 'text-stone/70'} />
          </div>
          <div className="text-left">
           <span className={`font-body text-[11px] block leading-tight ${isActive ? 'text-stone font-medium' : 'text-stone/70'}`}>{p.name}</span>
           <span className={`font-body text-[9px] ${sectorColor}`}>{sectorLabel}</span>
          </div>
         </div>
         {isActive
          ? <span className="font-body text-ochre text-[10px]">Active</span>
          : <span className="font-body text-stone/70/60 text-[10px]">Switch →</span>
         }
        </button>
       )
      })}
     </div>

    </div>
   </div>
  </div>
 )
}


// ── UserDropdown ──────────────────────────────────────────────────────────────

function UserDropdown({ triggerRef, onClose, viewingRole, setViewingRole }) {
 const dropRef = useRef(null)
 const [pos, setPos] = useState({ top: 60 })
 useFocusTrap(dropRef)
 const navigate = useNavigate()

 useEffect(() => {
  if (triggerRef.current) {
   const r = triggerRef.current.getBoundingClientRect()
   const estimatedH = 350
   setPos({ top: Math.max(8, r.top - estimatedH) })
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
  { id: 'director',         name: 'J. Crocker',  role: 'Plant Director',  route: '/plant' },
  { id: 'supervisor',       name: 'D. Kowalski', role: 'Supervisor · L4', route: '/shift' },
  { id: 'operator-reyes',   name: 'C. Reyes',    role: 'Operator · L1',   route: '/operator' },
  { id: 'operator-okonkwo', name: 'P. Okonkwo',  role: 'Operator · L2',   route: '/operator' },
 ]

 return (
  <div
   ref={dropRef}
   className="fixed z-50 plant-drop-in"
   style={{ left: 0, top: Math.max(8, pos.top) }}
  >
   <div className="w-[240px] bg-sidebar border border-sidebar-border rounded-2xl shadow-raise overflow-hidden" style={{ maxHeight: 'calc(100vh - 24px)' }}>
    <div className="plant-drop-in-content">

     {/* Header */}
     <div className="flex flex-col items-center text-center px-5 pt-5 pb-4">
      <PersonAvatar name="J. Crocker" size={48} />
      <h2 className="font-display font-bold text-stone text-[15px] leading-snug mt-3">J. Crocker</h2>
      <p className="font-body text-stone/70 text-[11px] mt-0.5">Plant Director</p>
      <p className="font-body text-stone/70/50 text-[10px] mt-0.5">Salina Campus · SL-04</p>
     </div>

     {/* Divider */}
     <div className="mx-5 h-px bg-sidebar-border" />

     {/* Viewing as */}
     <div className="px-5 pt-3 pb-4">
      <p className="font-body text-stone/70/40 text-[10px] uppercase tracking-widest mb-2">Viewing as</p>
      {roles.map(r => (
       <button key={r.id} type="button"
        aria-pressed={viewingRole === r.id}
        onClick={() => { setViewingRole(r.id); navigate(r.route); onClose() }}
        className="flex items-center gap-2.5 w-full py-1.5 group"
       >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${viewingRole === r.id ? 'bg-ochre' : 'bg-sidebar-border group-hover:bg-sidebar-3'}`} />
        <PersonAvatar name={r.name} size={20} />
        <div className="flex-1 text-left min-w-0">
         <div className={`font-body text-[11px] font-medium truncate transition-colors ${viewingRole === r.id ? 'text-stone' : 'text-stone/70 group-hover:text-stone/80'}`}>{r.name}</div>
         <div className="font-body text-stone/70/40 text-[10px]">{r.role}</div>
        </div>
        {viewingRole === r.id && <span className="font-body text-ochre text-[10px] flex-shrink-0">Active</span>}
       </button>
      ))}
     </div>

    </div>
   </div>
  </div>
 )
}

const WORKER_MODE_LABELS = { human: 'Human workforce', robot: 'Robotic workforce', hybrid: 'Human · Robot hybrid' }
const WORKER_MODE_COLORS = { human: 'text-ok', robot: 'text-ochre', hybrid: 'text-warn' }

const STATIC_AGENT_TOTAL = agentConfigData.agents.reduce((n, a) => n + (a.pendingActions?.length ?? 0), 0)

function AgentItem({ count }) {
 return (
  <NavLink to="/agents"
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 border-l-2 ${isActive ? 'bg-sidebar2 border-l-stone text-stone' : 'border-l-transparent text-stone/70 hover:text-stone'}`
   }>
   <Cpu size={15} strokeWidth={1.75} className="flex-shrink-0" />
   <span className="font-body text-[13px]">Agent Control</span>
   {count > 0 && (
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-ochre text-stone rounded-btn">
     {count}
    </span>
   )}
  </NavLink>
 )
}

export default function Sidebar() {
 const [plantOpen, setPlantOpen] = useState(false)
 const plantTriggerRef = useRef(null)
 const [userOpen, setUserOpen] = useState(false)
 const userTriggerRef = useRef(null)
 const [notifOpen, setNotifOpen] = useState(false)
 const [toast, setToast] = useState(null)
 const { blockingEvidenceUploaded, allergenOverride, checklistSigned, nearMisses, maintenanceTickets, viewingRole, setViewingRole, currentPlant, setCurrentPlant, workerMode, agentDecidedKeys } = useAppState() || {}
 const agentPendingCount = Math.max(0, STATIC_AGENT_TOTAL - (agentDecidedKeys?.size ?? 0))

 const allergenSigned = checklistSigned?.['allergen'] || !!allergenOverride
 const complianceState = currentPlant?.id === 'ks' ? 'clear' : (!blockingEvidenceUploaded ? 'blocked' : !allergenSigned ? 'attention' : 'clear')
 const complianceLabel = complianceState === 'blocked' ? 'Blocked' : complianceState === 'attention' ? 'Attention' : 'Clear'
 const complianceColor = complianceState === 'blocked' ? 'text-danger bg-danger/10' : complianceState === 'attention' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'
 // Standing compliance items (2 always present + 1 evidence gap if not yet uploaded)
 // plus dynamic safety events the director hasn't seen
 const standingCount = blockingEvidenceUploaded ? 2 : 3

 const showToast = (label) => {
 setToast(label)
 setTimeout(() => setToast(null), 2000)
 }

 return (
 <aside className="
 fixed inset-y-0 left-0 z-30
 w-[240px] flex flex-col
 bg-sidebar border-r border-sidebar-border
 transition-transform duration-200 ease-spring
 ">
 {/* Brand */}
 <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sidebar-border bg-sidebar2">
 <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
 <path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke="#C17D2A" strokeWidth="1.3"/>
 <path d="M8 13 L14 13 L14 7 Z" fill="#C17D2A"/>
 </svg>
 <div>
 <div className="font-display font-bold text-stone text-base tracking-tight leading-none">
 takorin
 </div>
 <div className="font-body text-stone/70 text-[10px] mt-0.5">
 Total intelligence
 </div>
 </div>
 </div>

 {/* Facility */}
 <button
  ref={plantTriggerRef}
  type="button"
  onClick={() => setPlantOpen(p => !p)}
  className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border w-full text-left hover:bg-sidebar2 transition-colors"
 >
  <div className="w-8 h-8 rounded-full bg-sidebar-2 flex items-center justify-center flex-shrink-0">
  <Building2 size={15} className="text-stone/70" strokeWidth={1.75} />
  </div>
  <div className="flex-1 min-w-0">
  <div className="font-body text-stone text-[13px] font-medium truncate">{currentPlant?.name || 'Salina Campus'}</div>
  <div className="font-body text-stone/70 text-[10px]">Plant ID {currentPlant?.code || 'SL-04'}</div>
  </div>
  <ChevronDown
  size={13}
  className={`text-stone/70 flex-shrink-0 transition-transform duration-200 ease-spring ${plantOpen ? 'rotate-180' : ''}`}
  />
 </button>

 {/* Plant dropdown — floats right of the sidebar */}
 {plantOpen && (
  <PlantDropdown
   triggerRef={plantTriggerRef}
   onClose={() => setPlantOpen(false)}
   complianceState={complianceState}
   currentPlant={currentPlant || PLANTS.sl}
   setCurrentPlant={setCurrentPlant || (() => {})}
  />
 )}

 {/* Nav */}
 <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-2">

 {/* ── Operator: 1 screen ─────────────────────────────────────── */}
 {(viewingRole === 'operator-reyes' || viewingRole === 'operator-okonkwo') && (
  <SideItem to="/operator" id="operator" icon={User} label="My Station" badge={null} />
 )}

 {/* ── Supervisor: 3 screens (ShiftIQ contains Handoff/Fleet/Allocation as tabs) */}
 {viewingRole === 'supervisor' && (
  <>
   <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Operational</div>
   <SideItem to="/shift"  id="shift"  icon={Activity} label="ShiftIQ"      badge="3" badgeType="alert" />
   <AgentItem count={agentPendingCount} />
   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Causality</div>
   <SideItem to="/impact" id="impact" icon={CircleDot} label="Impact Loop" badge={null} />
   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Activity</div>
   <button type="button" onClick={() => setNotifOpen(true)}
    className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 text-stone/80">
    <Bell size={15} strokeWidth={1.75} className="flex-shrink-0" />
    <span className="font-body text-[13px]">Notifications</span>
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-danger text-white rounded-btn">4</span>
   </button>
   {notifOpen && <NotificationCenter onClose={() => setNotifOpen(false)} />}
  </>
 )}

 {/* ── Director: full intelligence graph ───────────────────────── */}
 {(viewingRole === 'director' || !viewingRole) && (
  <>
   <PlantItem />

   <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Intelligence</div>
   {modules.map(m => <SideItem key={m.id} to={m.path} id={m.id} {...m} />)}
   <AgentItem count={agentPendingCount} />
   <SideItem to="/impact" id="impact" icon={CircleDot} label="Impact Loop"   badge={null} />

   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Architecture</div>
   <SideItem to="/batch"      id="batch"      icon={FlaskConical}    label="Process Intelligence" badge={null} />
   <SideItem to="/compliance" id="compliance" icon={Scale}           label="Compliance Policy"    badge={null} />
   <SideItem to="/hierarchy"  id="hierarchy"  icon={LayoutDashboard} label="Process Hierarchy"    badge={null} />
   <SideItem to="/knowledge"  id="knowledge"  icon={BookOpen}        label="Knowledge Vault"      badge={null} />

   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Frontier</div>
   <SideItem to="/execution" id="execution" icon={Workflow} label="Execution Authority" badge={null} />
   {currentPlant?.sector === 'pharma' && (
    <SideItem to="/records"  id="records"  icon={FileLock2}  label="Record Vault"   badge={null} />
   )}
   {(currentPlant?.sector === 'electronics' || currentPlant?.sector === 'semiconductor') && (
    <SideItem to="/delivery" id="delivery" icon={TrendingUp} label="Value Chain"    badge={null} />
   )}
   {currentPlant?.sector !== 'pharma' && (
    <SideItem to="/equipment" id="equipment" icon={ScanLine} label="Equipment Intel." badge={null} />
   )}

   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Admin</div>
   <SideItem to="/integration" id="integration" icon={Network} label="Integration Hub" badge={null} />
   <SideItem to="/readiness"   id="readiness"   icon={Gauge}   label="Data Readiness"  badge={null} />

   <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-stone/40 font-body font-medium">Activity</div>
   <button type="button" onClick={() => setNotifOpen(true)}
    className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors hover:bg-sidebar2 text-stone/80">
    <Bell size={15} strokeWidth={1.75} className="flex-shrink-0" />
    <span className="font-body text-[13px]">Notifications</span>
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-danger text-white rounded-btn">4</span>
   </button>
   {notifOpen && <NotificationCenter onClose={() => setNotifOpen(false)} />}
  </>
 )}

 </nav>

 {/* Worker mode + Compliance */}
 <div className="px-4 py-2.5 border-t border-sidebar-border">
 <div className="flex items-center justify-between mb-1.5">
  <span className="font-body text-stone/70/60 text-[10px]">Workforce</span>
  <span className={`font-body font-medium text-[10px] ${WORKER_MODE_COLORS[workerMode || 'human']}`}>
   {workerMode === 'robot' ? 'Robotic' : workerMode === 'hybrid' ? 'Hybrid' : 'Human'}
  </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="font-body text-stone/70 text-[10px]">Compliance</span>
 <span className={`font-body font-medium text-[10px] px-2 py-0.5 ${complianceColor}`}>
 {complianceLabel}
 </span>
 </div>
 <div className="font-body text-stone/70 text-[10px] mt-0.5 leading-relaxed">
 {complianceState === 'blocked' && 'CAPA-2604-006 evidence missing · FDA export blocked'}
 {complianceState === 'attention' && 'Allergen changeover log unsigned · Line 4'}
 {complianceState === 'clear' && 'No blocking compliance items · 18d to FDA inspection'}
 </div>
 </div>

 {/* User */}
 <button
  ref={userTriggerRef}
  type="button"
  onClick={() => setUserOpen(p => !p)}
  className="flex items-center gap-2.5 px-4 py-3 border-t border-sidebar-border w-full text-left hover:bg-sidebar2 transition-colors"
 >
  <PersonAvatar name="J. Crocker" size={28} />
  <div className="flex-1 min-w-0">
  <div className="font-body text-stone text-[12px] font-medium">J. Crocker</div>
  <div className="font-body text-stone/70 text-[10px]">
   {viewingRole === 'supervisor' ? <span className="text-ochre">Viewing as Kowalski</span> : viewingRole === 'operator-reyes' ? <span className="text-ochre">Viewing as C. Reyes</span> : viewingRole === 'operator-okonkwo' ? <span className="text-ochre">Viewing as P. Okonkwo</span> : 'Plant Director'}
  </div>
  </div>
  <ChevronDown size={13} className={`text-stone/70 flex-shrink-0 transition-transform duration-200 ease-spring ${userOpen ? 'rotate-180' : ''}`} />
 </button>
 {userOpen && (
  <UserDropdown
   triggerRef={userTriggerRef}
   onClose={() => setUserOpen(false)}
   viewingRole={viewingRole || 'director'}
   setViewingRole={setViewingRole || (() => {})}
  />
 )}

 {/* Toast */}
 {toast && (
 <div className="fixed bottom-4 left-4 z-50 bg-sidebar border border-sidebar-border px-3 py-2 slide-in">
 <span className="font-body text-stone/70 text-[11px]">{toast} — not available in pilot</span>
 </div>
 )}
 </aside>
 )
}
