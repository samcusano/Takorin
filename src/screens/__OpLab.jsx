import { useState } from 'react'
import { Check, CheckCircle2, ChevronUp, ChevronDown, AlertTriangle,
         Activity, BookOpen, ListChecks } from 'lucide-react'
import { Btn, ExpandableSection } from '../components/UI'
import { FeedbackOverlay } from './__FeedbackOverlay'

// ── Fixture: C. Reyes · post-hold · allergen flush procedure active ────────────
const F = {
  operator: 'C. Reyes',
  station: 'Sauce Dosing (covering)',
  role: 'L1 · Pack Line',
  modeLabel: 'Covering above cert level',
  condition: 'Allergen flush in progress',
  conditionDetail: 'L2 process · supervisor oversight required',
  directive: 'Complete allergen flush verification before restarting Line 4',
  deadline: '07:15',
  ccp: { label: 'CCP-1 Hold Point', req: '≥185°F by 07:30' },
  procedure: [
    { id: 'p1', label: 'Drain sauce tank completely — valve V-12 open' },
    { id: 'p2', label: 'Flush with 20L hot water (≥180°F) — log temperature' },
    { id: 'p3', label: 'Inspect valve seats — no sauce residue visible' },
    { id: 'p4', label: 'Log CCP-1 reading — must be ≥185°F before restart' },
    { id: 'p5', label: 'Request supervisor sign-off before Line 4 restarts' },
  ],
  checklist: [
    { id: 'cl-1', label: 'Allergen changeover log signed',           done: true,  note: 'Signed · 05:45' },
    { id: 'cl-2', label: 'CCP-1 temperature verified',               done: true,  note: '06:18 · 188°F · Kowalski' },
    { id: 'cl-3', label: 'Sauce Dosing valve positions checked',      done: false },
    { id: 'cl-4', label: 'PPE inspection complete',                   done: false },
    { id: 'cl-5', label: 'Log CCP-1 reading before 07:30',           done: false, urgent: true },
    { id: 'cl-6', label: 'Confirm Lot TS-8811 not present',          done: true,  locked: true, note: 'Covered by verification sequence' },
  ],
  briefing: [
    { type: 'danger', label: 'Allergen changeover log', note: 'Unsigned at shift handoff — signed 05:45 before GF-Flatbread run.' },
    { type: 'ok',     label: 'CCP-1 Hold Point',        note: 'Last verified 06:18 at 188°F by Kowalski — within limit.' },
  ],
  tasks: [
    { id: 't1', label: 'Post-hold: log benzaldehyde reading at Vessel F-047', done: true, confirmedAt: '09:22', badge: 'QualityGuard' },
  ],
}

// ── Shared atoms ───────────────────────────────────────────────────────────────

function StepBtn({ step, index, done, enabled, onComplete }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-4 border-b border-rule2 transition-opacity ${
      done ? 'opacity-40' : !enabled ? 'opacity-25 pointer-events-none' : ''
    }`}>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => enabled && onComplete(step.id)}
        aria-label={`${done ? 'Completed' : 'Mark complete'}: step ${index + 1}`}
        className={`relative w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors touch-manipulation
          after:absolute after:content-[''] after:-inset-[12px]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 ${
          done    ? 'bg-muted' :
          enabled ? 'border-2 border-stone4 bg-stone hover:bg-stone3 cursor-pointer' :
                    'border-2 border-rule2'
        }`}>
        {done && <Check size={11} strokeWidth={2.5} className="text-stone" />}
      </button>
      <div className={`flex-1 font-body text-body leading-snug ${done ? 'line-through text-muted' : 'text-ink font-medium'}`}>
        {index + 1}. {step.label}
      </div>
    </div>
  )
}

function CcpStrip() {
  return (
    <div className="flex-shrink-0 px-5 py-3 bg-warn/[0.04] border-b border-warn/20 flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full bg-warn flex-shrink-0" />
      <span className="font-body font-medium text-warn text-body">{F.ccp.label}</span>
      <span className="font-body text-warn/80 text-label">· {F.ccp.req}</span>
    </div>
  )
}

function ProcedureHeader({ count, total }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 bg-stone2 border-b border-rule2">
      <span className="font-body text-muted text-label">Verification sequence</span>
      <span className="font-body text-muted text-label tabular-nums">{count} of {total}</span>
    </div>
  )
}

function ProcedureComplete() {
  return (
    <div className="px-5 py-4 bg-ok/[0.04] border-b border-ok/20">
      <div className="flex items-center gap-2 mb-1.5">
        <CheckCircle2 size={13} strokeWidth={2} className="text-ok flex-shrink-0" />
        <span className="font-body font-medium text-ok text-body">Verification complete</span>
      </div>
      <div className="font-body text-ok/80 text-label mb-3">All steps verified · Await supervisor sign-off</div>
      <Btn variant="secondary">Request supervisor sign-off</Btn>
    </div>
  )
}

function ElevatedHeader() {
  return (
    <div className="flex-shrink-0 px-5 py-4 border-b-2 border-b-danger/30 bg-danger/[0.03]">
      <div className="flex items-center gap-2 mb-0.5">
        <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0" />
        <span className="font-body text-label font-medium text-danger">{F.modeLabel}</span>
      </div>
      <div className="font-display font-bold text-ink text-sub leading-snug mb-0.5">{F.station} · {F.condition}</div>
      <div className="font-body text-muted text-label">{F.conditionDetail}</div>
    </div>
  )
}

function DirectiveBar({ compact = false }) {
  return (
    <div className={`flex-shrink-0 border-b border-rule2 border-l-[3px] border-l-danger ${compact ? 'px-4 py-2.5' : 'px-5 py-3.5'}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-danger beat flex-shrink-0 mt-1.5" />
        <div className="flex-1 min-w-0">
          <div className={`font-display font-bold text-ink leading-snug ${compact ? 'text-body' : 'text-sub'}`}>{F.directive}</div>
          <div className={`font-body font-medium text-danger mt-1 ${compact ? 'text-label' : 'text-body'}`}>Before {F.deadline}</div>
        </div>
      </div>
    </div>
  )
}

function BriefingList() {
  return (
    <div className="px-5 py-4">
      <div className="font-body text-muted text-label mb-3">Since your last shift</div>
      {F.briefing.map((item, i) => (
        <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${item.type === 'danger' ? 'bg-danger' : 'bg-ok'}`} />
          <div>
            <div className="font-body font-medium text-ink text-body leading-snug">{item.label}</div>
            <p className="font-display text-muted text-body leading-relaxed mt-0.5">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TaskList() {
  return (
    <div className="px-5 py-4">
      <div className="font-body text-muted text-label mb-3">Tasks · 0 pending</div>
      {F.tasks.map(t => (
        <div key={t.id} className="flex items-start gap-2.5 opacity-60">
          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={9} strokeWidth={2.5} className="text-stone" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-body text-label text-muted line-through leading-snug">{t.label}</div>
            <div className="font-body text-ok text-label mt-0.5">Confirmed {t.confirmedAt} · {t.badge}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Variant A: Direction C — Adaptive Surface + Persistent Tray Handle ─────────
//
// Focus mode when procedure is active: verification steps fill the screen.
// Secondary content (briefing, tasks) lives in a labeled tray at the bottom.
// The tray handle is always visible — operator always knows it exists.

function VariantA() {
  const [steps, setSteps] = useState([])
  const [trayOpen, setTrayOpen] = useState(false)
  const done = new Set(steps)

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ElevatedHeader />
      <DirectiveBar />
      <CcpStrip />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProcedureHeader count={steps.length} total={F.procedure.length} />
        {F.procedure.map((step, i) => (
          <StepBtn key={step.id} step={step} index={i}
            done={done.has(step.id)}
            enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
            onComplete={id => setSteps(s => [...s, id])} />
        ))}
        {steps.length === F.procedure.length && <ProcedureComplete />}
        <div className="h-4" />
      </div>

      {/* Tray panel — absolute, slides up from the handle */}
      {trayOpen && (
        <div className="absolute left-0 right-0 bottom-[44px] bg-stone border-t-2 border-rule2 max-h-72 overflow-y-auto z-10 slide-in shadow-raise">
          <BriefingList />
          <div className="border-t border-rule2">
            <TaskList />
          </div>
        </div>
      )}

      {/* Persistent labeled tray handle */}
      <div className="flex-shrink-0 border-t border-rule2 bg-stone2 z-20 relative">
        <button type="button" onClick={() => setTrayOpen(t => !t)}
          className="w-full h-11 px-5 flex items-center justify-between hover:bg-stone3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-signal/50">
          <span className="font-body text-muted text-label">Briefing · Tasks · Notes</span>
          <ChevronUp size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${trayOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  )
}

// ── Variant B: Tab Navigation ──────────────────────────────────────────────────
//
// Competing direction. Domain tabs at the bottom — Work / Briefing / Tasks / Me.
// Work tab = active surface only. No vertical scroll between domains; navigate
// by tapping tabs. Familiar mobile pattern; the model furthest from
// instrumentation thinking — the operator must mentally jump between zones
// to reconstruct the full picture.

const TABS_B = [
  { id: 'work',     label: 'Work',     Icon: Activity },
  { id: 'briefing', label: 'Briefing', Icon: BookOpen },
  { id: 'tasks',    label: 'Tasks',    Icon: ListChecks },
  { id: 'me',       label: 'Me',       Icon: CheckCircle2 },
]

function VariantB() {
  const [tab, setTab]       = useState('work')
  const [steps, setSteps]   = useState([])
  const [clDone, setClDone] = useState([])
  const done = new Set(steps)
  const pendingSteps = F.procedure.length - steps.length
  const pendingCl = F.checklist.filter(i => !i.done && !i.locked && !clDone.includes(i.id)).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Fixed header — persists across all tabs */}
      <div className="flex-shrink-0 px-5 py-3 border-b-2 border-b-danger/30 bg-danger/[0.03]">
        <div className="flex items-center gap-2 mb-0.5">
          <AlertTriangle size={11} strokeWidth={2} className="text-danger flex-shrink-0" />
          <span className="font-body text-label font-medium text-danger">{F.modeLabel}</span>
        </div>
        <div className="font-display font-bold text-ink text-sub leading-snug">{F.station} · {F.condition}</div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'work' && (
          <>
            <DirectiveBar />
            <CcpStrip />
            <ProcedureHeader count={steps.length} total={F.procedure.length} />
            {F.procedure.map((step, i) => (
              <StepBtn key={step.id} step={step} index={i}
                done={done.has(step.id)}
                enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
                onComplete={id => setSteps(s => [...s, id])} />
            ))}
            {steps.length === F.procedure.length && <ProcedureComplete />}
          </>
        )}

        {tab === 'briefing' && (
          <>
            <BriefingList />
            <div className="border-t border-rule2 px-5 py-4 border-l-[3px] border-l-signal bg-signal/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={10} strokeWidth={2} className="text-signal flex-shrink-0" />
                <span className="font-body font-medium text-ink text-body">Covering above cert level</span>
              </div>
              <p className="font-display text-ink text-body leading-relaxed">
                For any process parameter you are unsure of, ask your supervisor before adjusting. Do not modify CCP settings without L2 sign-off.
              </p>
            </div>
          </>
        )}

        {tab === 'tasks' && (
          <>
            <div className="px-5 py-2 bg-stone2 border-b border-rule2 flex items-center justify-between">
              <span className="font-body text-muted text-label">Startup checklist</span>
              <span className={`font-body text-label tabular-nums ${pendingCl === 0 ? 'text-ok' : 'text-warn'}`}>
                {F.checklist.length - pendingCl}/{F.checklist.length}
              </span>
            </div>
            {F.checklist.map(item => {
              const isDone = item.done || clDone.includes(item.id)
              return (
                <div key={item.id} className={`flex items-start gap-3 px-5 py-3 border-b border-rule2 ${isDone ? 'opacity-50' : item.urgent ? 'bg-danger/[0.02]' : ''}`}>
                  <button type="button" disabled={isDone || item.locked}
                    onClick={() => !isDone && !item.locked && setClDone(p => [...p, item.id])}
                    aria-label={`${isDone ? 'Completed' : 'Complete'}: ${item.label}`}
                    className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors touch-manipulation
                      after:absolute after:content-[''] after:-inset-[12px]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 ${
                      isDone ? 'bg-muted border-muted cursor-default' :
                      item.urgent ? 'border-danger hover:bg-danger/10' : 'border-rule2 hover:border-stone4'}`}>
                    {isDone && <Check size={11} strokeWidth={2.5} className="text-stone" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-body text-body leading-snug ${isDone ? 'line-through text-muted' : 'text-ink'}`}>{item.label}</div>
                    {isDone && item.note && <div className="font-body text-muted text-label mt-0.5">{item.note}</div>}
                    {item.locked && <div className="font-body text-muted text-label mt-0.5">Covered by verification sequence</div>}
                    {!isDone && item.urgent && <div className="font-body text-danger text-label mt-0.5">Required before production start</div>}
                  </div>
                </div>
              )
            })}
            <div className="border-t border-rule2">
              <TaskList />
            </div>
          </>
        )}

        {tab === 'me' && (
          <div className="px-5 py-5">
            <div className="font-body text-muted text-label mb-2">Certification progress</div>
            <div className="flex items-end justify-between mb-2">
              <div className="font-body text-muted text-label">72% to L2 Sauce Dosing</div>
              <span className="display-num text-title leading-none text-warn">72<span className="text-head">%</span></span>
            </div>
            <div className="h-1.5 bg-rule2 mb-5">
              <div className="h-full bg-warn" style={{ width: '72%' }} />
            </div>
            <div className="font-body text-muted text-label mb-3">What's next</div>
            {['Complete 3 more supervised shifts at Sauce Dosing', 'Pass L2 Sauce Dosing practical assessment'].map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-rule2 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <span className="font-body text-muted text-label leading-none">{i + 1}</span>
                </div>
                <span className="font-body text-ink text-label leading-snug">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 flex border-t-2 border-rule2 bg-stone">
        {TABS_B.map(({ id, label, Icon }) => {
          const badge = id === 'work' ? pendingSteps : id === 'tasks' ? pendingCl : 0
          return (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors ${
                tab === id ? 'text-signal' : 'text-muted hover:text-ink'}`}>
              <div className="relative">
                <Icon size={18} strokeWidth={tab === id ? 2 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 font-body text-stone bg-warn px-1 leading-none py-0.5"
                    style={{ fontSize: '9px' }}>{badge}</span>
                )}
              </div>
              <span className="font-body text-label leading-none">{label}</span>
              {tab === id && <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-signal" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Variant C: Split-Panel — Action-First ──────────────────────────────────────
//
// Competing direction. Two fixed zones:
//   Top 37%: Context strip — state, CCP status, briefing summary (tap to expand)
//   Bottom 63%: Action surface — procedure steps at thumb height, always visible
// Both zones always present. Never scroll past a zone to reach another.
// The insight: the thumb is at the bottom of a 390px device. Critical action
// belongs at the bottom, not buried in a scroll.

function VariantC() {
  const [steps, setSteps]       = useState([])
  const [briefingOpen, setBriefingOpen] = useState(false)
  const done = new Set(steps)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Context zone — fixed height */}
      <div className="flex-shrink-0 border-b-2 border-danger/20 bg-danger/[0.03] flex flex-col"
        style={{ height: 290 }}>
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-danger/15">
          <AlertTriangle size={12} strokeWidth={2} className="text-danger flex-shrink-0" />
          <span className="font-body text-label font-medium text-danger">{F.modeLabel}</span>
          <span className="font-body text-muted text-label ml-auto">{F.operator}</span>
        </div>

        <div className="px-5 py-4 border-b border-rule2">
          <div className="font-display font-bold text-ink text-sub leading-snug mb-1">{F.station}</div>
          <div className="font-display text-ink text-body leading-snug mb-2 pl-3 border-l-[3px] border-l-danger">{F.directive}</div>
          <div className="font-body text-danger text-label font-medium">Before {F.deadline}</div>
        </div>

        <div className="px-5 py-3 flex items-center gap-2 border-b border-rule2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-warn/[0.06] border border-warn/20">
            <div className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
            <span className="font-body text-warn text-label">{F.ccp.label} · by 07:30</span>
          </div>
          <button type="button" onClick={() => setBriefingOpen(b => !b)}
            className="flex items-center gap-1.5 px-2 py-1 border border-rule2 text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal/50">
            <BookOpen size={10} strokeWidth={2} />
            <span className="font-body text-label">2 briefing items</span>
            <ChevronDown size={9} strokeWidth={2} className={`transition-transform ${briefingOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {briefingOpen && (
          <div className="flex-1 overflow-y-auto">
            {F.briefing.map((item, i) => (
              <div key={i} className="flex items-start gap-2 px-5 py-2.5 border-b border-rule2 last:border-b-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${item.type === 'danger' ? 'bg-danger' : 'bg-ok'}`} />
                <div>
                  <div className="font-body text-label text-ink font-medium leading-snug">{item.label}</div>
                  <p className="font-display text-muted text-label leading-snug mt-0.5 line-clamp-2">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action zone — procedure always at thumb */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-muted text-label">Verification sequence</span>
          <span className="font-body text-muted text-label tabular-nums">{steps.length} of {F.procedure.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {F.procedure.map((step, i) => (
            <StepBtn key={step.id} step={step} index={i}
              done={done.has(step.id)}
              enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
              onComplete={id => setSteps(s => [...s, id])} />
          ))}
          {steps.length === F.procedure.length && <ProcedureComplete />}
        </div>
      </div>
    </div>
  )
}

// ── Variant D: Adaptive Card Stack + Persistent Tray ──────────────────────────
//
// Hybrid. The adaptive logic of Direction C expressed as domain cards
// organized into NOW / LATER zones. When procedure is active, the procedure
// card is expanded and visually dominant. Other cards collapse to headers.
// One scrollable surface — no navigation, no tabs, no hidden zones.
// The tray reveals "Me" content (progress, schedule) without cluttering the stack.

function VariantD() {
  const [steps, setSteps]       = useState([])
  const [clDone, setClDone]     = useState([])
  const [trayOpen, setTrayOpen] = useState(false)
  const [expanded, setExpanded] = useState('procedure')
  const done = new Set(steps)
  const pendingCl = F.checklist.filter(i => !i.done && !i.locked && !clDone.includes(i.id)).length
  const toggle = id => setExpanded(e => e === id ? null : id)

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Compact header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-stone2 flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-ink text-body leading-none">{F.operator} · {F.station}</div>
          <div className="font-body text-muted text-label mt-0.5">AM shift · {F.condition}</div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-danger/[0.06]">
          <AlertTriangle size={10} strokeWidth={2} className="text-danger" />
          <span className="font-body text-danger text-label font-medium">Elevated risk</span>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">

        <div className="font-body text-muted text-label px-1 pb-1">NOW</div>

        {/* Procedure card — dominant */}
        <div className="border border-danger/25 border-l-[3px] border-l-danger bg-stone">
          <button type="button" onClick={() => toggle('procedure')}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-rule2 focus-visible:outline-none">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-danger beat flex-shrink-0" />
              <span className="font-body font-medium text-ink text-body">Allergen flush verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-label text-danger tabular-nums">{steps.length}/{F.procedure.length}</span>
              <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${expanded === 'procedure' ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === 'procedure' && (
            <div className="slide-in">
              <CcpStrip />
              {F.procedure.map((step, i) => (
                <StepBtn key={step.id} step={step} index={i}
                  done={done.has(step.id)}
                  enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
                  onComplete={id => setSteps(s => [...s, id])} />
              ))}
              {steps.length === F.procedure.length && <ProcedureComplete />}
            </div>
          )}
        </div>

        {/* Checklist card */}
        <div className="border border-rule2 bg-stone">
          <button type="button" onClick={() => toggle('checklist')}
            className="w-full flex items-center justify-between px-4 py-3 focus-visible:outline-none">
            <div className="flex items-center gap-2">
              <ListChecks size={12} strokeWidth={2} className="text-muted flex-shrink-0" />
              <span className="font-body font-medium text-ink text-body">Startup checklist</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-body text-label tabular-nums ${pendingCl === 0 ? 'text-ok' : 'text-warn'}`}>
                {F.checklist.length - pendingCl}/{F.checklist.length}
              </span>
              <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${expanded === 'checklist' ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === 'checklist' && (
            <div className="border-t border-rule2 slide-in">
              {F.checklist.map(item => {
                const isDone = item.done || clDone.includes(item.id)
                return (
                  <div key={item.id} className={`flex items-start gap-3 px-4 py-3 border-b border-rule2 last:border-b-0 ${isDone ? 'opacity-50' : ''}`}>
                    <button type="button" disabled={isDone || item.locked}
                      onClick={() => !isDone && !item.locked && setClDone(p => [...p, item.id])}
                      aria-label={`${isDone ? 'Done' : 'Complete'}: ${item.label}`}
                      className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors touch-manipulation
                        after:absolute after:content-[''] after:-inset-[12px]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 ${
                        isDone ? 'bg-muted border-muted cursor-default' :
                        item.urgent ? 'border-danger hover:bg-danger/10' : 'border-rule2 hover:border-stone4'}`}>
                      {isDone && <Check size={11} strokeWidth={2.5} className="text-stone" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-body text-label leading-snug ${isDone ? 'line-through text-muted' : 'text-ink'}`}>{item.label}</div>
                      {isDone && item.note && <div className="font-body text-muted" style={{ fontSize: '10px' }}>{item.note}</div>}
                      {item.locked && !item.done && <div className="font-body text-muted" style={{ fontSize: '10px' }}>Covered by verification sequence</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="font-body text-muted text-label px-1 pt-2 pb-1">LATER</div>

        {/* Briefing card */}
        <div className="border border-rule2 bg-stone">
          <button type="button" onClick={() => toggle('briefing')}
            className="w-full flex items-center justify-between px-4 py-3 focus-visible:outline-none">
            <div className="flex items-center gap-2">
              <BookOpen size={12} strokeWidth={2} className="text-muted" />
              <span className="font-body font-medium text-ink text-body">Since last shift</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-label text-warn">1 needs action</span>
              <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${expanded === 'briefing' ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === 'briefing' && (
            <div className="border-t border-rule2 slide-in">
              <BriefingList />
            </div>
          )}
        </div>

        {/* Tasks card */}
        <div className="border border-rule2 bg-stone mb-2">
          <button type="button" onClick={() => toggle('tasks')}
            className="w-full flex items-center justify-between px-4 py-3 focus-visible:outline-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} strokeWidth={2} className="text-ok" />
              <span className="font-body font-medium text-ink text-body">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-label text-ok">All complete</span>
              <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${expanded === 'tasks' ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === 'tasks' && (
            <div className="border-t border-rule2 slide-in">
              <TaskList />
            </div>
          )}
        </div>

      </div>

      {/* Tray panel — Me content (progress, schedule) */}
      {trayOpen && (
        <div className="absolute left-0 right-0 bottom-[44px] bg-stone border-t-2 border-rule2 max-h-64 overflow-y-auto z-10 slide-in shadow-raise">
          <div className="px-5 py-3 border-b border-rule2">
            <div className="font-body text-muted text-label mb-1">Cert progress</div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-body text-muted text-label">72% to L2 Sauce Dosing</span>
              <span className="display-num text-head text-warn">72%</span>
            </div>
            <div className="h-1.5 bg-rule2">
              <div className="h-full bg-warn" style={{ width: '72%' }} />
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="font-body text-muted text-label mb-2">AM shift</div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Hours this week', value: '28h' }, { label: 'Consecutive days', value: '3' }, { label: 'Last rest', value: '9h ago' }].map(cell => (
                <div key={cell.label} className="bg-stone2 px-2 py-2">
                  <div className="display-num text-sub text-ink">{cell.value}</div>
                  <div className="font-body text-muted" style={{ fontSize: '10px' }}>{cell.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tray handle — progress & schedule */}
      <div className="flex-shrink-0 border-t border-rule2 bg-stone2 z-20 relative">
        <button type="button" onClick={() => setTrayOpen(t => !t)}
          className="w-full h-11 px-5 flex items-center justify-between hover:bg-stone3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-signal/50">
          <span className="font-body text-muted text-label">My progress · Schedule · Transition</span>
          <ChevronUp size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${trayOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  )
}

// ── Variant E: Direction C — Adaptive Surface + Swipe Gesture Tray ─────────────
//
// Hybrid. Same adaptive logic as Variant A. The difference: secondary content
// is hidden behind a minimal drag pill — no labeled handle. The focus surface
// has maximum screen real estate. The trade-off is discoverability: the operator
// must discover or already know that the gesture exists. Reveals on hover
// to give a hint without adding visual clutter in the active state.

function VariantE() {
  const [steps, setSteps]   = useState([])
  const [trayOpen, setTrayOpen] = useState(false)
  const done = new Set(steps)

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ElevatedHeader />
      <DirectiveBar />
      <CcpStrip />

      {/* Procedure — full remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProcedureHeader count={steps.length} total={F.procedure.length} />
        {F.procedure.map((step, i) => (
          <StepBtn key={step.id} step={step} index={i}
            done={done.has(step.id)}
            enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
            onComplete={id => setSteps(s => [...s, id])} />
        ))}
        {steps.length === F.procedure.length && <ProcedureComplete />}
        <div className="h-6" />
      </div>

      {/* Tray panel — no handle label in closed state */}
      {trayOpen && (
        <div className="absolute left-0 right-0 bottom-[32px] bg-stone border-t-2 border-rule2 max-h-80 overflow-y-auto z-10 slide-in shadow-raise">
          <div className="flex justify-center py-2.5">
            <div className="w-10 h-1 rounded-full bg-rule2" />
          </div>
          <BriefingList />
          <div className="border-t border-rule2">
            <TaskList />
          </div>
        </div>
      )}

      {/* Minimal gesture pill */}
      <div className="flex-shrink-0 z-20 relative flex items-center justify-center pb-2 pt-1.5 bg-stone">
        <button type="button"
          onClick={() => setTrayOpen(t => !t)}
          aria-label={trayOpen ? 'Close secondary content' : 'Open briefing and tasks'}
          className="group flex flex-col items-center gap-1 px-8 py-1 focus-visible:outline-none">
          <div className={`w-9 h-1 rounded-full transition-all duration-200 ${
            trayOpen ? 'bg-signal w-6' : 'bg-rule2 group-hover:bg-muted/40'
          }`} />
          <span className={`font-body text-label transition-all duration-200 ${
            trayOpen ? 'text-signal opacity-100' : 'text-muted opacity-0 group-hover:opacity-100'
          }`}>{trayOpen ? 'Close' : 'Briefing & Tasks'}</span>
        </button>
      </div>
    </div>
  )
}

// ── Variant F: Direction C — Unified Header + Smart Tray Label ────────────────
//
// Refinement of Variant A. Two changes:
//
// 1. Unified header: collapses ElevatedHeader + DirectiveBar into one surface.
//    Mode badge and station become a small muted row. The directive is the
//    dominant text. Left danger accent runs the full unit height — one object,
//    not two stacked cards.
//
// 2. Smart tray label: shows live status indicators so the operator can decide
//    whether to open the tray without tapping it. Danger dot = something needs
//    review in briefing. Ok dot = tasks clear.

function VariantF() {
  const [steps, setSteps]   = useState([])
  const [trayOpen, setTrayOpen] = useState(false)
  const done = new Set(steps)

  const hasDangerBriefing = F.briefing.some(i => i.type === 'danger')
  const pendingTasks = F.tasks.filter(t => !t.done).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Unified header — mode + station + directive as one surface */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 border-l-[3px] border-l-danger bg-danger/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={11} strokeWidth={2} className="text-danger flex-shrink-0" />
          <span className="font-body text-label font-medium text-danger">{F.modeLabel}</span>
          <span className="font-body text-muted text-label">· {F.station}</span>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-danger beat flex-shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-ink text-sub leading-snug">{F.directive}</div>
            <div className="font-body font-medium text-danger text-body mt-1">Before {F.deadline}</div>
          </div>
        </div>
      </div>

      <CcpStrip />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProcedureHeader count={steps.length} total={F.procedure.length} />
        {F.procedure.map((step, i) => (
          <StepBtn key={step.id} step={step} index={i}
            done={done.has(step.id)}
            enabled={!done.has(step.id) && (i === 0 || done.has(F.procedure[i - 1].id))}
            onComplete={id => setSteps(s => [...s, id])} />
        ))}
        {steps.length === F.procedure.length && <ProcedureComplete />}
        <div className="h-4" />
      </div>

      {trayOpen && (
        <div className="absolute left-0 right-0 bottom-[44px] bg-stone border-t-2 border-rule2 max-h-72 overflow-y-auto z-10 slide-in shadow-raise">
          <BriefingList />
          <div className="border-t border-rule2">
            <TaskList />
          </div>
        </div>
      )}

      {/* Smart tray handle — status indicators without opening */}
      <div className="flex-shrink-0 border-t border-rule2 bg-stone2 z-20 relative">
        <button type="button" onClick={() => setTrayOpen(t => !t)}
          className="w-full h-11 px-5 flex items-center justify-between hover:bg-stone3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-signal/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasDangerBriefing ? 'bg-danger' : 'bg-ok'}`} />
              <span className="font-body text-muted text-label">{F.briefing.length} briefing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pendingTasks > 0 ? 'bg-warn' : 'bg-ok'}`} />
              <span className="font-body text-muted text-label">{pendingTasks === 0 ? 'tasks done' : `${pendingTasks} tasks`}</span>
            </div>
          </div>
          <ChevronUp size={12} strokeWidth={2} className={`text-muted transition-transform duration-200 ${trayOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  )
}

// ── Lab shell ─────────────────────────────────────────────────────────────────

const VARIANTS = { A: VariantA, B: VariantB, C: VariantC, D: VariantD, E: VariantE, F: VariantF }

const META = {
  A: { label: 'Direction C',    sub: 'Adaptive · persistent tray',  tag: 'Recommended', tagColor: 'text-signal bg-signal/[0.08]' },
  B: { label: 'Tab Nav',        sub: 'Competing · domain tabs',     tag: 'Competing',   tagColor: 'text-muted bg-stone3' },
  C: { label: 'Split Panel',    sub: 'Competing · fixed zones',     tag: 'Competing',   tagColor: 'text-muted bg-stone3' },
  D: { label: 'Card Stack',     sub: 'Hybrid · NOW / LATER',        tag: 'Hybrid',      tagColor: 'text-warn bg-warn/[0.08]' },
  E: { label: 'Gesture Tray',   sub: 'Hybrid · swipe reveal',       tag: 'Hybrid',      tagColor: 'text-warn bg-warn/[0.08]' },
  F: { label: 'A — Refined',    sub: 'Unified header · smart tray', tag: 'Refinement',  tagColor: 'text-ok bg-ok/[0.08]' },
}

const RATIONALE = {
  A: 'Focus mode when procedure is active — verification fills the screen. Secondary content always reachable via a labeled tray handle. Labeled = discoverable. The anchor for this debate.',
  B: 'Domain tabs: Work / Briefing / Tasks / Me. Clean separation between zones, familiar mobile pattern. But the operator must navigate between tabs to reconstruct the full picture of their shift.',
  C: 'Two fixed zones. Context (top, ~35%) and action (bottom, ~65%). Both simultaneously visible. The procedure is always at thumb height — no scroll required to reach the critical step.',
  D: 'Cards organized into NOW and LATER zones. Each domain is a collapsible card. Procedure card auto-expanded as the dominant object. One scrollable surface — no navigation, nothing hidden.',
  E: 'Same adaptive logic as A. No visible tray handle in the resting state — only a minimal drag pill. Maximum focus surface area. Trade-off: gesture must be learned or discovered.',
  F: 'Refinement of A. Two changes: (1) ElevatedHeader + DirectiveBar collapsed into one surface — single left accent, mode badge as a small muted row, directive as the dominant text. (2) Tray handle shows live dot indicators: danger dot if briefing has an item needing review, ok dot when tasks are clear.',
}

export default function OpLab() {
  const [active, setActive] = useState('A')
  const V = VARIANTS[active]
  const m = META[active]

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-stone2 font-body">
      {/* Lab header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone">
        <div className="font-display font-bold text-ink text-sub leading-none mb-1">OperatorView Layout Debate</div>
        <div className="font-body text-muted text-label">C. Reyes · Sauce Dosing (covering) · Post-hold · Allergen flush procedure active · 6 variants</div>
      </div>

      {/* Variant selector */}
      <div className="flex-shrink-0 flex border-b border-rule2 bg-stone overflow-x-auto">
        {Object.entries(META).map(([key, { label, sub, tag, tagColor }]) => (
          <button key={key} type="button" onClick={() => setActive(key)}
            className={`flex-shrink-0 flex flex-col items-start gap-0.5 px-4 py-3 border-r border-rule2 border-b-2 transition-colors ${
              active === key ? 'border-b-signal bg-stone2' : 'border-b-transparent hover:bg-stone2/60'}`}>
            <div className="flex items-center gap-1.5">
              <span className={`font-body font-bold text-label ${active === key ? 'text-signal' : 'text-ink'}`}>{key}</span>
              <span className={`font-body text-label px-1.5 py-px leading-tight ${tagColor}`}>{tag}</span>
            </div>
            <div className={`font-body text-label ${active === key ? 'text-ink' : 'text-muted'}`}>{label}</div>
            <div className="font-body text-muted" style={{ fontSize: '10px' }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Rationale strip */}
      <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone">
        <p className="font-body text-muted text-label leading-snug">{RATIONALE[active]}</p>
      </div>

      {/* Phone mockup */}
      <div className="flex-1 min-h-0 overflow-y-auto flex items-start justify-center py-8 px-4">
        <div className="flex-shrink-0 w-[390px] h-[844px] border border-rule2 shadow-raise overflow-hidden flex flex-col bg-stone relative"
          data-variant={active}>
          <V key={active} />
        </div>
      </div>

      <FeedbackOverlay targetName="OperatorView Layout" />
    </div>
  )
}
