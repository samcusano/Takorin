import { useState } from 'react'
import { AlertTriangle, CheckCircle, ShieldAlert, RotateCcw, Bot, User, ArrowRight } from 'lucide-react'
import { PageHead, SecHd, Chip, Urg, ActionBanner, Btn } from '../components/UI'
import { taskAllocationData } from '../data'
import { useAppState } from '../context/AppState'

// ── Assignee display ────────────────────────────────────────────────────────

function AssigneeTag({ assignee }) {
  const isRobot = assignee.type === 'robot'
  const noBackup = !assignee.id
  const certGap = assignee.certGap

  const tone = noBackup ? 'danger' : certGap ? 'warn' : 'muted'
  const Icon = noBackup ? AlertTriangle : isRobot ? Bot : User

  return (
    <div className={`inline-flex items-center gap-1.5 font-body text-[11px] px-2 py-0.5 border ${
      noBackup   ? 'bg-danger/10 border-danger/30 text-danger'
      : certGap  ? 'bg-warn/10 border-warn/30 text-warn'
      : isRobot  ? 'bg-ochre/10 border-ochre/30 text-ochre'
      : 'bg-stone3 border-rule2 text-muted'
    }`}>
      <Icon size={10} strokeWidth={1.75} className="flex-shrink-0" />
      <span>{assignee.name}</span>
      {certGap && !noBackup && <span className="text-[9px] opacity-70">· cert gap</span>}
      {!isRobot && !noBackup && assignee.cert && (
        <span className="text-[9px] opacity-60">{assignee.cert}</span>
      )}
    </div>
  )
}

// ── Impact preview modal (before any reallocation) ──────────────────────────

function ImpactPreview({ task, onConfirm, onCancel }) {
  const isRobot = task.assignedTo.type === 'robot'
  const newPrimary = isRobot ? task.fallback : task.assignedTo

  // Generate downstream effects based on the task
  const effects = [
    isRobot
      ? `${task.assignedTo.name} (robot) freed — reassigned to ${task.line} backup queue`
      : `${task.assignedTo.name} released from ${task.label} — available for reallocation`,
    newPrimary.certGap
      ? `⚠ ${newPrimary.name} has a cert gap for this task — risk score will increase`
      : `${newPrimary.name} takes primary — coverage maintained`,
    task.fallback.id === null
      ? `No fallback available after swap — single point of failure on ${task.label}`
      : `Fallback slot becomes open — recommend assigning backup`,
  ]

  return (
    <div className="fixed inset-0 bg-ink/30 z-40 flex items-center justify-center p-6">
      <div className="bg-stone border border-rule2 w-full max-w-md shadow-raise slide-in">
        <div className="px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">Reallocation preview</div>
          <div className="font-display font-bold text-ink text-[15px]">{task.label} — {task.line}</div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current → New */}
          <div className="flex items-center gap-3">
            <AssigneeTag assignee={task.assignedTo} />
            <ArrowRight size={14} className="text-ghost flex-shrink-0" />
            <AssigneeTag assignee={newPrimary} />
          </div>

          {/* Downstream effects */}
          <div className="space-y-2">
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest">If you confirm — downstream effects</div>
            {effects.map((e, i) => (
              <div key={i} className={`flex items-start gap-2 font-body text-[11px] ${
                e.startsWith('⚠') ? 'text-warn' : e.includes('single point') ? 'text-danger' : 'text-muted'
              }`}>
                <span className="mt-0.5 flex-shrink-0">{e.startsWith('⚠') ? '⚠' : '·'}</span>
                <span>{e.replace('⚠ ', '')}</span>
              </div>
            ))}
          </div>

          {newPrimary.certGap && (
            <div className="px-3 py-2 bg-warn/[0.08] border-l-2 border-l-warn">
              <p className="font-body text-[11px] text-warn font-medium">Cert gap will raise shift risk score</p>
              <p className="font-body text-[11px] text-muted mt-0.5">
                Consider assigning a certified backup before confirming.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-rule2 bg-stone2">
          <Btn variant="primary" onClick={onConfirm}>Confirm reallocation</Btn>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Task matrix row ─────────────────────────────────────────────────────────

function TaskRow({ task, reallocated, onPreviewReallocate }) {
  const isGap = task.status === 'gap' && !reallocated

  return (
    <div className={`flex items-center gap-5 px-5 py-3 border-b border-rule2 last:border-0 ${isGap ? 'bg-danger/[0.015]' : 'hover:bg-stone2'} transition-colors`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isGap && <AlertTriangle size={11} className="text-danger flex-shrink-0" />}
          <span className="font-body font-medium text-ink text-[12px]">{task.label}</span>
          <span className="font-body text-ghost text-[10px]">{task.line}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-48">
        <AssigneeTag assignee={task.assignedTo} />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-52">
        <span className="font-body text-ghost text-[10px]">→</span>
        <AssigneeTag assignee={task.fallback} />
      </div>
      <div className="flex-shrink-0">
        {reallocated ? (
          <Urg level="ok">Reallocated</Urg>
        ) : (
          <button
            type="button"
            onClick={() => onPreviewReallocate(task)}
            className="font-body text-[11px] text-muted hover:text-ink border border-rule2 hover:border-rule px-2.5 py-1 transition-colors"
          >
            Reallocate
          </button>
        )}
      </div>
    </div>
  )
}

// ── Safety zone row ─────────────────────────────────────────────────────────

function SafetyZoneRow({ zone }) {
  const toneMap = {
    clear: { chip: 'ok',   label: 'Clear'   },
    warn:  { chip: 'warn', label: 'Caution' },
    danger:{ chip: 'danger', label: 'Alert' },
  }
  const t = toneMap[zone.status]

  return (
    <div className="flex items-start gap-4 px-5 py-3 border-b border-rule2 last:border-0">
      <Chip tone={t.chip}>{t.label}</Chip>
      <div className="flex-1">
        <div className="font-body font-medium text-ink text-[12px]">{zone.label}</div>
        <div className="font-body text-ghost text-[10px] mt-0.5 leading-relaxed">
          {zone.type === 'restricted' ? 'Restricted' : 'Collaborative'} · {zone.humanCertRequired} required
          · {zone.speedReduction} · {zone.emergencyStop}
        </div>
        {zone.note && (
          <div className="font-body text-warn text-[10px] mt-0.5">{zone.note}</div>
        )}
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function ResourceAllocation() {
  const { tasks, safetyZones, overrideLog, redundancyMap } = taskAllocationData
  const { workerMode } = useAppState()
  const [tab, setTab] = useState('matrix')
  const [reallocated, setReallocated] = useState(new Set())
  const [preview, setPreview] = useState(null) // task being previewed

  const robotTasks = tasks.filter(t => t.assignedTo.type === 'robot').length
  const humanTasks = tasks.filter(t => t.assignedTo.type === 'human').length
  const gapCount = tasks.filter(t => t.status === 'gap').length
  const certGapCount = tasks.filter(t => (t.fallback.certGap || t.assignedTo.certGap) && t.status !== 'gap').length
  const coverageGapCount = gapCount + certGapCount

  const handleConfirmReallocate = () => {
    if (preview) {
      setReallocated(p => new Set([...p, preview.id]))
      setPreview(null)
    }
  }

  const tabs = [
    { id: 'matrix',      label: 'Task matrix'      },
    { id: 'safety',      label: 'Safety zones'      },
    { id: 'redundancy',  label: 'Redundancy map'    },
    { id: 'overrides',   label: `Override log (${overrideLog.length})` },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {preview && (
        <ImpactPreview
          task={preview}
          onConfirm={handleConfirmReallocate}
          onCancel={() => setPreview(null)}
        />
      )}

      <PageHead
        over="Task Allocation · Salina Campus · Human · Robot hybrid"
        title="Line 4 AM"
        accent="var(--color-ochre)"
        meta={[
          { role: 'Human tasks',   val: String(humanTasks)  },
          { role: 'Robot tasks',   val: String(robotTasks)  },
          { role: 'Total tasks',   val: String(tasks.length)},
          { role: 'Coverage gaps', val: String(coverageGapCount) },
        ]}
      />

      {/* Stat bar */}
      <div className="flex border-b border-rule2 bg-stone flex-shrink-0">
        {[
          { label: 'Robot tasks',   value: String(robotTasks),   sub: 'of total this shift',        fill: (robotTasks/tasks.length)*100,  tone: 'ok'     },
          { label: 'Human tasks',   value: String(humanTasks),   sub: 'of total this shift',        fill: (humanTasks/tasks.length)*100,  tone: 'ok'     },
          { label: 'Hard gaps',     value: String(gapCount),     sub: 'no qualified backup',        fill: null, tone: 'danger' },
          { label: 'Cert gaps',     value: String(certGapCount), sub: 'fallback has cert mismatch', fill: null, tone: 'warn'   },
        ].map(s => (
          <div key={s.label} className="flex-1 px-5 py-4 border-r border-rule2 last:border-0">
            <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`display-num text-[28px] leading-none ${
              s.tone === 'danger' ? 'text-danger' : s.tone === 'warn' ? 'text-warn' : 'text-ink'
            }`}>{s.value}</div>
            <div className="font-body text-ghost text-[10px] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-rule2 bg-stone2 flex-shrink-0 px-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`font-body text-[11px] px-4 py-2.5 border-b-2 transition-colors ${
              tab === t.id
                ? 'border-b-ochre text-ink font-medium'
                : 'border-b-transparent text-ghost hover:text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-stone">

        {/* Task Matrix */}
        {tab === 'matrix' && (
          <div>
            <div className="flex items-center gap-5 px-5 py-2 bg-stone2 border-b border-rule2">
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest flex-1">Task</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest w-48">Primary</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest w-52">Fallback</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest w-20">Action</span>
            </div>
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                reallocated={reallocated.has(task.id)}
                onPreviewReallocate={setPreview}
              />
            ))}
            <div className="flex items-center gap-5 px-5 py-2.5 bg-stone2 border-t border-rule2">
              <div className="flex items-center gap-4 text-[10px] font-body text-ghost">
                <div className="flex items-center gap-1.5"><Bot size={10} className="text-ochre" /><span className="text-ochre">Robot primary</span></div>
                <div className="flex items-center gap-1.5"><User size={10} /><span>Human primary</span></div>
                <div className="flex items-center gap-1.5"><AlertTriangle size={10} className="text-danger" /><span className="text-danger">No qualified backup</span></div>
                <div className="flex items-center gap-1.5"><span className="text-warn">Amber border</span><span>= cert gap</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Safety Zones */}
        {tab === 'safety' && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2">
              <p className="font-body text-muted text-[12px]">
                Collaborative zones reduce robot speed when humans are present. Restricted zones require full robot stop before human entry.
              </p>
            </div>
            {safetyZones.map(zone => <SafetyZoneRow key={zone.id} zone={zone} />)}
            <ActionBanner
              tone="warn"
              headline="R-03 Seal Press Zone — heightened caution in effect"
              body="Vibration anomaly on R-03. Apply extra caution in Zone sz2. Human entry requires L3 escort and E-stop verification before entry."
            />
          </div>
        )}

        {/* Redundancy Map */}
        {tab === 'redundancy' && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2">
              <p className="font-body text-muted text-[12px]">
                For each critical task, both a human and a robot backup must be available. Red = single point of failure.
              </p>
            </div>
            <div className="grid grid-cols-[1fr_80px_80px_88px] px-5 py-2 bg-stone2 border-b border-rule2 gap-4">
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest">Task</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-center">Human</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-center">Robot</span>
              <span className="font-body text-ghost text-[10px] uppercase tracking-widest text-center">Status</span>
            </div>
            {redundancyMap.map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_80px_80px_88px] px-5 py-3 border-b border-rule2 last:border-0 gap-4 ${row.status === 'danger' ? 'bg-danger/[0.015]' : ''}`}>
                <div>
                  <div className="font-body font-medium text-ink text-[12px]">{row.task}</div>
                  {row.note && <div className="font-body text-danger text-[10px] mt-0.5">{row.note}</div>}
                </div>
                <div className="flex justify-center items-center">
                  {row.humanCover
                    ? <CheckCircle size={14} className="text-ok" />
                    : <AlertTriangle size={14} className="text-danger" />}
                </div>
                <div className="flex justify-center items-center">
                  {row.robotCover
                    ? <CheckCircle size={14} className="text-ok" />
                    : <AlertTriangle size={14} className="text-danger" />}
                </div>
                <div className="flex justify-center items-center">
                  <Chip tone={row.status === 'ok' ? 'ok' : 'danger'}>
                    {row.status === 'ok' ? 'Covered' : 'Gap'}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Override Log */}
        {tab === 'overrides' && (
          <div>
            <div className="px-5 py-3 border-b border-rule2 bg-stone2">
              <p className="font-body text-muted text-[12px]">
                Human-robot overrides are logged here. Patterns (same operator + robot repeatedly) surface as ShiftIQ findings.
              </p>
            </div>
            {overrideLog.map((entry, i) => (
              <div key={i} className="px-5 py-4 border-b border-rule2 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={12} className="text-warn flex-shrink-0" strokeWidth={1.75} />
                    <span className="font-body font-medium text-ink text-[12px]">{entry.action}</span>
                  </div>
                  <span className="font-body text-ghost text-[10px]">{entry.timestamp}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-0.5">Operator</div>
                    <div className="font-body text-ink text-[11px]">{entry.operator}</div>
                  </div>
                  <div>
                    <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-0.5">Robot</div>
                    <div className="font-body text-ochre text-[11px]">{entry.robotName} ({entry.robotId})</div>
                  </div>
                  <div>
                    <div className="font-body text-ghost text-[10px] uppercase tracking-widest mb-0.5">Outcome</div>
                    <div className="font-body text-ok text-[11px]">{entry.outcome}</div>
                  </div>
                </div>
                <div className="font-body text-muted text-[11px] italic">{entry.reason}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
