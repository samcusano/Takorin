import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertTriangle, AlertCircle, Eye, CheckCircle2, Clock } from 'lucide-react'
import { facility, shiftData } from '../data'
import { fsmaPosture } from '../data/traceability'
import { StatusPill } from '../components/UI'

// ─── Static priority items for demo scenario ─────────────────────────────────

const PRIORITY = [
  {
    id: 'p1',
    level: 'critical',
    category: 'Agent decision',
    title: 'Tier 3 decision awaiting ratification — Line 4 lot hold',
    detail: 'Supplier Intelligence Agent recommends holding Lot TS-8811. Production starts in 1h 46m. Director sign-off required.',
    time: '06:22',
    lot: 'TS-8811',
    route: '/agents',
    routeLabel: 'Agents',
  },
  {
    id: 'p2',
    level: 'critical',
    category: 'FSMA 204',
    title: 'COA not received — ConAgra Lot TS-8811',
    detail: 'Certificate of Analysis required before Line 4 production can start. COA request sent 05:47 — no response from ConAgra.',
    time: '05:47',
    lot: 'TS-8811',
    route: '/supplier',
    routeLabel: 'Suppliers',
  },
  {
    id: 'p3',
    level: 'high',
    category: 'Delivery',
    title: 'Lot L-0891 delivery delayed 6h — Pepperoni',
    detail: 'Expected Apr 18 · Delayed 6h. COA requested and pending. Pre-production compliance hold active.',
    time: '05:33',
    lot: 'L-0891',
    route: '/supplier',
    routeLabel: 'Suppliers',
  },
  {
    id: 'p4',
    level: 'high',
    category: 'Network',
    title: 'TX-11 holding same lot — holds not coordinated',
    detail: 'TX-11 also holds Lot TS-8811. Uncoordinated holds create partial recall exposure if one plant releases without the other.',
    time: '06:02',
    lot: 'TS-8811',
    route: '/agents',
    routeLabel: 'Agents',
  },
  {
    id: 'p5',
    level: 'watch',
    category: 'Supplier reliability',
    title: 'ConAgra: 3rd COA delay in 18 months — review threshold reached',
    detail: 'Supplier standing: 71. Contract review criteria met. Pattern-based escalation logged by Supplier Intelligence Agent.',
    time: '06:00',
    route: '/supplier',
    routeLabel: 'Suppliers',
  },
  {
    id: 'p6',
    level: 'watch',
    category: 'Traceability',
    title: 'CO-5502 shelf life — 18 days remaining',
    detail: 'Canola Oil approaching rotation threshold. ADM price +8% — possible sourcing pressure. Submittable to FDA.',
    time: '06:45',
    lot: 'CO-5502',
    route: '/records',
    routeLabel: 'Record Vault',
  },
  {
    id: 'p7',
    level: 'watch',
    category: 'FDA prep',
    title: 'FSMA 204 network posture at 62% — 2 lots not submittable',
    detail: `${fsmaPosture.highRisk} high-risk lots. ${fsmaPosture.submittable} of ${fsmaPosture.total} submittable. FDA inspection window: 18 days.`,
    time: '06:45',
    route: '/records',
    routeLabel: 'Record Vault',
  },
]

const LINES = [
  { name: 'Line 4', status: 'at-risk', supervisor: 'D. Kowalski', note: 'TS-8811 hold · Production at risk' },
  { name: 'Line 6', status: 'running', supervisor: 'A. Martinez', note: 'Running · OEE 87%' },
  { name: 'Line 3', status: 'watch',   supervisor: 'PM crew',     note: 'WF-2203 transformation in progress' },
  { name: 'Line 2', status: 'clear',   supervisor: 'AM crew',     note: 'Clear · Pre-shift checks complete' },
]

const LINE_CFG = {
  'at-risk': { tone: 'danger', dot: 'bg-danger', label: 'At risk' },
  'running': { tone: 'ok',     dot: 'bg-ok',     label: 'Running' },
  'watch':   { tone: 'warn',   dot: 'bg-warn',   label: 'Watch'   },
  'clear':   { tone: 'ok',     dot: 'bg-ok/50',  label: 'Clear'   },
}

const LEVEL_CFG = {
  critical: {
    accent:  'border-l-danger',
    bg:      'bg-danger/[0.02]',
    icon:    AlertCircle,
    cls:     'text-danger',
    label:   'Critical',
    tone:    'danger',
  },
  high: {
    accent:  'border-l-warn',
    bg:      '',
    icon:    AlertTriangle,
    cls:     'text-warn',
    label:   'High',
    tone:    'warn',
  },
  watch: {
    accent:  'border-l-rule2',
    bg:      '',
    icon:    Eye,
    cls:     'text-muted',
    label:   'Watch',
    tone:    'muted',
  },
}

// ─── Components ───────────────────────────────────────────────────────────────

function PriorityItem({ item, navigate }) {
  const cfg = LEVEL_CFG[item.level]
  const Icon = cfg.icon
  return (
    <div className={`border-b border-rule2 border-l-2 ${cfg.accent} ${cfg.bg} px-4 py-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Icon size={11} strokeWidth={2} className={`${cfg.cls} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`font-body text-micro uppercase tracking-wider font-medium ${cfg.cls}`}>
                {item.category}
              </span>
              {item.lot && (
                <span className="font-body text-label px-1.5 py-0 bg-stone3 text-muted">{item.lot}</span>
              )}
            </div>
            <div className="font-body font-medium text-ink text-label leading-snug mb-0.5">{item.title}</div>
            <div className="font-body text-muted text-label leading-snug">{item.detail}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          <span className="font-body text-muted text-label">{item.time}</span>
        </div>
      </div>
      <div className="mt-2 ml-[22px]">
        <button type="button"
          onClick={() => navigate(item.route)}
          className="flex items-center gap-1 font-body text-signal text-label hover:text-ink transition-colors">
          <ArrowRight size={9} strokeWidth={2} />
          Open in {item.routeLabel}
        </button>
      </div>
    </div>
  )
}

function SectionDivider({ label, count }) {
  return (
    <div className="px-4 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between sticky top-0 z-10">
      <span className="font-body text-muted text-label font-medium">{label}</span>
      <span className="font-body text-muted text-label">{count}</span>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Briefing() {
  const navigate = useNavigate()

  const critical = PRIORITY.filter(p => p.level === 'critical')
  const high     = PRIORITY.filter(p => p.level === 'high')
  const watch    = PRIORITY.filter(p => p.level === 'watch')

  const decisionCount = critical.filter(p => p.category === 'Agent decision').length

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: priority list */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-rule2">

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-muted text-label mb-0.5">
                {facility.user.name} · {facility.user.role} · {facility.id}
              </div>
              <div className="font-display font-bold text-ink text-head leading-none">Morning briefing</div>
              <div className="font-body text-muted text-label mt-1">Apr 16, 2026 · 06:14 AM · AM shift</div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {decisionCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-danger/[0.06] border border-danger/20">
                  <Clock size={10} strokeWidth={2} className="text-danger" />
                  <span className="font-body text-danger text-label font-medium">
                    {decisionCount} decision{decisionCount > 1 ? 's' : ''} need your sign-off
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority feed */}
        <div className="flex-1 overflow-y-auto">
          {critical.length > 0 && (
            <>
              <SectionDivider label="Critical" count={critical.length} />
              {critical.map(p => <PriorityItem key={p.id} item={p} navigate={navigate} />)}
            </>
          )}
          {high.length > 0 && (
            <>
              <SectionDivider label="High" count={high.length} />
              {high.map(p => <PriorityItem key={p.id} item={p} navigate={navigate} />)}
            </>
          )}
          {watch.length > 0 && (
            <>
              <SectionDivider label="Watch" count={watch.length} />
              {watch.map(p => <PriorityItem key={p.id} item={p} navigate={navigate} />)}
            </>
          )}
        </div>
      </div>

      {/* Right: situational context */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-stone overflow-y-auto">

        {/* Lines today */}
        <div className="flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-muted text-label font-medium">Lines today</span>
          </div>
          {LINES.map(line => {
            const cfg = LINE_CFG[line.status]
            return (
              <div key={line.name} className="flex items-start gap-3 px-4 py-3 border-b border-rule2">
                <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0 mt-1`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-body font-medium text-ink text-label">{line.name}</span>
                    <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
                  </div>
                  <div className="font-body text-muted text-label">{line.supervisor}</div>
                  <div className="font-body text-muted text-label opacity-70">{line.note}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Shift readiness */}
        <div className="flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-muted text-label font-medium">Shift readiness</span>
          </div>
          {[
            { label: 'Checklist completion', value: '61%', tone: 'danger' },
            { label: 'Certified staffing',   value: '72%', tone: 'warn'   },
            { label: 'Machine readiness',    value: '94%', tone: 'ok'     },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2">
              <span className="font-body text-muted text-label">{s.label}</span>
              <span className={`font-body font-medium text-label tabular-nums ${
                s.tone === 'ok' ? 'text-ok' : s.tone === 'warn' ? 'text-warn' : 'text-danger'
              }`}>{s.value}</span>
            </div>
          ))}
          <button type="button" onClick={() => navigate('/shift')}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-rule2 hover:bg-stone2 transition-colors group">
            <span className="font-body text-muted text-label">View full shift status</span>
            <ArrowRight size={10} strokeWidth={2} className="text-muted group-hover:text-signal transition-colors" />
          </button>
        </div>

        {/* Supplier network */}
        <div className="flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-muted text-label font-medium">Supplier network</span>
          </div>
          {[
            { name: 'ConAgra Foods', standing: 71, status: 'hold', note: '2 lots on hold' },
            { name: 'ADM Foods',     standing: 89, status: 'ok',   note: '2 lots active' },
            { name: 'Red Gold',      standing: 84, status: 'watch', note: '1 KDE gap' },
          ].map(s => (
            <div key={s.name} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2">
              <div>
                <div className="font-body text-ink text-label">{s.name}</div>
                <div className="font-body text-muted text-label opacity-70">{s.note}</div>
              </div>
              <span className={`font-body font-medium text-label tabular-nums ${
                s.status === 'hold' ? 'text-danger' : s.status === 'watch' ? 'text-warn' : 'text-ok'
              }`}>{s.standing}</span>
            </div>
          ))}
          <button type="button" onClick={() => navigate('/supplier')}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-rule2 hover:bg-stone2 transition-colors group">
            <span className="font-body text-muted text-label">View Suppliers</span>
            <ArrowRight size={10} strokeWidth={2} className="text-muted group-hover:text-signal transition-colors" />
          </button>
        </div>

        {/* FSMA posture */}
        <div className="flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-rule2 bg-stone2">
            <span className="font-body text-muted text-label font-medium">FSMA 204 posture</span>
          </div>
          <div className="px-4 py-3 border-b border-rule2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-body text-muted text-label">{fsmaPosture.subpart}</span>
              <span className="font-body font-medium text-warn text-label tabular-nums">{fsmaPosture.score}%</span>
            </div>
            <div className="h-0.5 bg-rule2">
              <div className="h-full bg-warn" style={{ width: `${fsmaPosture.score}%` }} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-body text-danger text-label">{fsmaPosture.highRisk} high-risk</span>
              <span className="font-body text-ok text-label">{fsmaPosture.submittable} submittable</span>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/records')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone2 transition-colors group">
            <span className="font-body text-muted text-label">View Record Vault</span>
            <ArrowRight size={10} strokeWidth={2} className="text-muted group-hover:text-signal transition-colors" />
          </button>
        </div>

      </div>
    </div>
  )
}
