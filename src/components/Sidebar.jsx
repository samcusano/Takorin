import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
 Activity, Handshake, Truck, ClipboardCheck,
 Gauge, BarChart2, FileText, Users, Settings,
 Building2, ChevronRight, Globe2, Bell,
 LayoutDashboard
} from 'lucide-react'
import { useAppState } from '../context/AppState'
import { commandData } from '../data'
import { PersonAvatar } from './UI'

const modules = [
 { id:'shift', label:'ShiftIQ', path:'/shift', icon:Activity, badge:'3', badgeType:'alert' },
 { id:'handoff', label:'HandoffIQ', path:'/handoff', icon:Handshake, badge:'live'},
 { id:'supplier', label:'SupplierIQ', path:'/supplier', icon:Truck, badge:'1', badgeType:'alert' },
 { id:'capa', label:'CAPA Engine', path:'/capa', icon:ClipboardCheck, badge:'2', badgeType:'alert' },
]
const foundation = [
 { id:'readiness', label:'Data Readiness', path:'/readiness', icon:Gauge, badge:'64', badgeType:'score' },
 { id:'network', label:'Network View', path:'/network', icon:Globe2, badge:null },
 { id:'notifications', label:'Notifications', path:'/notifications', icon:Bell, badge:null, dynamic:true },
]
const plant = [
 { label:'Analytics', icon:BarChart2, disabled:true },
 { label:'Documents', icon:FileText, disabled:true },
 { label:'Workforce', icon:Users, disabled:true },
 { label:'Settings', icon:Settings, disabled:true },
]

const accentMap = {
 command:'#C17D2A',
 shift:'#D94F2A', handoff:'#3A8A5A',
 supplier:'#8A6A3A', capa:'#C4920A', readiness:'#C17D2A', network:'#C17D2A', notifications:'#C17D2A',
}

function Badge({ badge, badgeType }) {
 if (!badge) return null
 if (badgeType === 'live') return (
 <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok beat" />
 )
 if (badgeType === 'score') return (
 <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-ochre text-stone font-body ">
 {badge}
 </span>
 )
 return (
 <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-danger text-white">
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
 : `border-transparent text-[#A8A098] hover:bg-sidebar2 hover:text-stone`)
 }
 >
 {({ isActive }) => (<>
 <Icon
 size={15}
 strokeWidth={1.75}
 className="flex-shrink-0"
 style={isActive && id ? { color: accentMap[id] } : {}}
 />
 <span className="font-body">{label}</span>
 <Badge badge={badge} badgeType={badgeType} />
 </>)}
 </NavLink>
 )
}

function CommandSurfaceItem() {
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
 to="/command"
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-100 border-l-2 border-b border-sidebar-border ` +
 (isActive
 ? `border-l-ochre bg-ochre/10 text-stone font-medium`
 : `border-l-transparent text-[#A8A098] hover:bg-sidebar2 hover:text-stone`)
 }
 >
 {({ isActive }) => (<>
 <LayoutDashboard
 size={15}
 strokeWidth={1.75}
 className="flex-shrink-0"
 style={isActive ? { color: '#C17D2A' } : {}}
 />
 <span className="font-body flex-1">Command</span>
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

export default function Sidebar() {
 const [plantOpen, setPlantOpen] = useState(false)
 const [toast, setToast] = useState(null)
 const { blockingEvidenceUploaded, allergenOverride, checklistSigned, nearMisses, maintenanceTickets, notifPanelOpen, setNotifPanelOpen } = useAppState() || {}

 const allergenSigned = checklistSigned?.['allergen'] || !!allergenOverride
 const complianceState = !blockingEvidenceUploaded ? 'blocked' : !allergenSigned ? 'attention' : 'clear'
 const complianceLabel = complianceState === 'blocked' ? 'Blocked' : complianceState === 'attention' ? 'Attention' : 'Clear'
 const complianceColor = complianceState === 'blocked' ? 'text-danger bg-danger/10' : complianceState === 'attention' ? 'text-warn bg-warn/10' : 'text-ok bg-ok/10'
 const notifCount = 3 + (allergenOverride ? 1 : 0) + (nearMisses?.length || 0) + (maintenanceTickets?.filter(t => t.status === 'open').length || 0)

 const showToast = (label) => {
 setToast(label)
 setTimeout(() => setToast(null), 2000)
 }

 return (
 <aside className="
 fixed inset-y-0 left-0 z-30
 w-[240px] flex flex-col
 bg-sidebar border-r border-sidebar-border
 transition-transform duration-200
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
 <div className="font-body text-ghost text-[10px] mt-0.5">
 Total intelligence
 </div>
 </div>
 </div>

 {/* Facility */}
 <button type="button"
 onClick={() => setPlantOpen(p => !p)}
 className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border w-full text-left hover:bg-sidebar2 transition-colors"
 >
 <div className="w-8 h-8 rounded-full bg-sidebar2 border border-sidebar-border flex items-center justify-center flex-shrink-0">
 <Building2 size={15} className="text-ghost" strokeWidth={1.75} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-body text-stone text-[13px] font-medium truncate">Salina Campus</div>
 <div className="font-body text-ghost text-[10px]">Plant ID SL-04</div>
 </div>
 <ChevronRight
 size={13}
 className={`text-ghost flex-shrink-0 transition-transform duration-150 ${plantOpen ? 'rotate-90' : ''}`}
 />
 </button>

 {/* Plant switcher dropdown */}
 {plantOpen && (
 <div className="mx-3 mb-1 border border-sidebar-border bg-sidebar slide-in">
 <div className="flex items-center justify-between px-3 py-2 bg-sidebar2">
 <span className="font-body font-medium text-stone text-[11px]">Salina Campus</span>
 <span className="font-body text-[9px] text-ok bg-ok/10 px-1.5 py-0.5">Active</span>
 </div>
 {['Topeka Plant', 'Denver Plant', 'Wichita Plant'].map(p => (
 <div key={p} className="flex items-center justify-between px-3 py-2 border-t border-sidebar-border opacity-50">
 <span className="font-body text-[#A8A098] text-[11px]">{p}</span>
 <span className="font-body text-ghost text-[9px]">Not in pilot</span>
 </div>
 ))}
 </div>
 )}

 {/* Nav */}
 <nav className="flex-1 overflow-y-auto py-2">
 {/* Command Surface — always first */}
 <CommandSurfaceItem />

 <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest uppercase text-ghost font-body font-medium">
 Intelligence
 </div>
 {modules.map(m => <SideItem key={m.id} to={m.path} id={m.id} {...m} />)}

 <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-ghost font-body font-medium">
 Foundation
 </div>
 {foundation.map(m => m.dynamic ? (
 <button type="button"
 key={m.id}
 onClick={() => setNotifPanelOpen?.(o => !o)}
 className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2 w-full text-left ${
 notifPanelOpen ? 'border-ochre bg-ochre/10 text-stone font-medium' : 'border-transparent text-[#A8A098] hover:bg-sidebar2 hover:text-stone'
 }`}
 >
 <m.icon size={15} strokeWidth={1.75} className="flex-shrink-0" style={notifPanelOpen ? { color: accentMap[m.id] } : {}} />
 <span className="font-body flex-1">{m.label}</span>
 {notifCount > 0 && <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-danger text-white">{notifCount}</span>}
 </button>
 ) : (
 <SideItem key={m.id} to={m.path} id={m.id} {...m} badge={m.badge} badgeType={m.badgeType} />
 ))}

 <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-ghost font-body font-medium">
 Plant
 </div>
 {plant.map((m, i) => <SideItem key={i} disabled onDisabledClick={showToast} {...m} />)}
 </nav>

 {/* Compliance status */}
 <div className="px-4 py-2.5 border-t border-sidebar-border">
 <div className="flex items-center justify-between">
 <span className="font-body text-ghost text-[10px]">Compliance</span>
 <span className={`font-body font-medium text-[9px] px-2 py-0.5 ${complianceColor}`}>
 {complianceLabel}
 </span>
 </div>
 <div className="font-body text-ghost text-[9px] mt-0.5 leading-relaxed">
 {complianceState === 'blocked' && 'CAPA-2604-006 evidence missing · FDA export blocked'}
 {complianceState === 'attention' && 'Allergen changeover log unsigned · Line 4'}
 {complianceState === 'clear' && 'No blocking compliance items · 18d to FDA inspection'}
 </div>
 </div>

 {/* User */}
 <div className="flex items-center gap-2.5 px-4 py-3 border-t border-sidebar-border">
 <PersonAvatar name="J. Crocker" size={28} />
 <div>
 <div className="font-body text-stone text-[12px] font-medium">J. Crocker</div>
 <div className="font-body text-ghost text-[10px]">Plant Director</div>
 </div>
 </div>

 {/* Toast */}
 {toast && (
 <div className="fixed bottom-4 left-4 z-50 bg-sidebar border border-sidebar-border px-3 py-2 slide-in">
 <span className="font-body text-ghost text-[11px]">{toast} — not available in pilot</span>
 </div>
 )}
 </aside>
 )
}
