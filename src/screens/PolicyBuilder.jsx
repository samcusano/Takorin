// ─── Policy Builder — plain-language escalation rules, backtested before going live ───
// Director-editable thresholds that previously lived only inside agentConfigData's
// hardcoded confidenceMethodology. Every draft is backtested against precedent before
// it can run in shadow mode (logs what it would have done) or go live.
//
// Master-detail: a single scrollable list on the left (grouped by job-to-be-done, sticky
// mini-headers, each row showing its own fire-count/false-positive rate so a noisy policy
// is visible before you click in), full detail + backtest + promotion controls on the
// right. Replaces the earlier flat stack of full cards, which couldn't show more than a
// handful of policies without scrolling past everything else.

import { useState } from 'react'
import { FlaskConical, Lock, Plus, ShieldCheck, Zap } from 'lucide-react'
import { Btn, StatusPill, SegmentedControl, HoldButton, SectionLabel, FilterDropdown } from '../components/UI'
import { agentConfigData } from '../data'
import { policyDrafts as SEED_DRAFTS, estimateBacktest, JTBD_CATEGORIES, PERSONAS } from '../data/policies'
import { useAppState } from '../context/AppState'

const STATUS_CFG = {
  draft:  { label: 'Draft',  tone: 'muted' },
  shadow: { label: 'Shadow', tone: 'warn'  },
  live:   { label: 'Live',   tone: 'ok'    },
}

const PERSONA_TONE = { director: 'signal', supervisor: 'ok' }

function fpColor(rate) {
  return rate > 40 ? 'text-danger' : rate > 15 ? 'text-warn' : 'text-ok'
}

// Only a Director can touch a Director-owned (compliance-locked) policy. A Supervisor
// can still view it for awareness — just not edit the threshold or promote it.
function canEditPersona(viewingRole, persona) {
  return viewingRole === 'director' || persona !== 'director'
}

function statement(draft, threshold) {
  const duration = draft.durationMin > 0 ? ` for ${draft.durationMin} min` : ''
  return `When ${draft.metricLabel.toLowerCase()} is ${draft.comparator} ${threshold}${draft.unit}${duration}, with ${draft.corroborationLabel}, then ${draft.action}.`
}

// ─── List row — name, status, and inline backtest stats so a noisy policy is
// visible without selecting into it ──────────────────────────────────────────
function PolicyRow({ draft, agent, threshold, status, isActive, locked, onSelect }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft
  const bt = estimateBacktest(draft, threshold)

  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 border-b border-rule2 transition-colors ${isActive ? 'bg-signal/[0.06]' : 'hover:bg-stone2'}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`font-body text-body leading-snug flex-1 truncate ${isActive ? 'text-ink font-medium' : 'text-ink'}`}>{draft.name}</span>
        {locked && <Lock size={10} strokeWidth={2} className="text-muted flex-shrink-0" />}
        <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
      </div>
      <div className="flex items-center gap-2 font-body text-label text-muted">
        <span className="truncate">{agent?.name ?? draft.agentId}</span>
        <span className="opacity-40">·</span>
        <span className="tabular-nums flex-shrink-0" title="Estimated times this rule would have fired in the last 90 days">{bt.fireCount}× / 90d</span>
        <span className="opacity-40">·</span>
        <span className={`tabular-nums flex-shrink-0 ${fpColor(bt.falsePositiveRate)}`} title="False-positive rate — fires that didn't match a real incident">{bt.falsePositiveRate}% false-positive</span>
      </div>
    </button>
  )
}

// ─── Detail pane — full statement, threshold control, backtest grid,
// precedent list, and promotion controls for the selected policy ─────────────
function PolicyDetail({ draft, agent, threshold, onThresholdChange, status, onStatusChange, canEdit }) {
  const bt = estimateBacktest(draft, threshold)
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft
  const persona = PERSONAS.find(p => p.id === draft.persona)

  return (
    <>
      <div className="px-4 py-3 border-b border-rule2 bg-stone3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-display font-semibold text-ink text-sub">{draft.name}</span>
          <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
          {persona && <StatusPill tone={PERSONA_TONE[persona.id] ?? 'muted'}>{persona.label}</StatusPill>}
        </div>
        <div className="font-body text-muted text-label">{agent?.name ?? draft.agentId}</div>
        {!canEdit && (
          <div className="flex items-center gap-1.5 mt-2 font-body text-muted text-label">
            <Lock size={11} strokeWidth={2} className="flex-shrink-0" />
            <span>Director-owned — view only in your role</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-b border-rule2">
        <p className="font-display text-ink text-body leading-relaxed">{statement(draft, threshold)}</p>
      </div>

      <div className={`px-4 py-3 border-b border-rule2 space-y-2 ${!canEdit ? 'opacity-50' : ''}`}>
        <div className="flex items-baseline justify-between">
          <span className="font-body text-muted text-label">Threshold</span>
          <span className="display-num text-label tabular-nums text-ink">{threshold}{draft.unit}</span>
        </div>
        <input type="range" min={draft.minThreshold} max={draft.maxThreshold} step={0.1}
          value={threshold} onChange={e => onThresholdChange(Number(e.target.value))}
          disabled={!canEdit}
          className="w-full accent-signal disabled:cursor-not-allowed" />
        <div className="flex items-center justify-between font-body text-muted text-label">
          <span>{draft.minThreshold}{draft.unit} · more sensitive</span>
          <span>{draft.maxThreshold}{draft.unit} · stricter</span>
        </div>
      </div>

      {/* Backtest */}
      <div className="px-4 py-3 border-b border-rule2 bg-stone2">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
          <span className="font-body text-muted text-label">Backtested against {draft.backtest.windowDays} days</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-rule2">
          <div className="bg-stone px-3 py-2">
            <div className="font-body text-muted text-label mb-0.5">Would have fired</div>
            <div className="display-num text-sub font-bold tabular-nums text-ink">{bt.fireCount}×</div>
          </div>
          <div className="bg-stone px-3 py-2">
            <div className="font-body text-muted text-label mb-0.5">Matched precedent</div>
            <div className="display-num text-sub font-bold tabular-nums text-ok">{draft.backtest.basePrecedentMatches}</div>
          </div>
          <div className="bg-stone px-3 py-2">
            <div className="font-body text-muted text-label mb-0.5">Est. false-positive rate</div>
            <div className={`display-num text-sub font-bold tabular-nums ${fpColor(bt.falsePositiveRate)}`}>
              {bt.falsePositiveRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Precedent list — timeline, matching the decision-replay pattern in AgentControl */}
      <div className="px-4 py-3 border-b border-rule2">
        <div className="font-body text-muted text-label mb-3">Precedent matches · {draft.backtest.precedentList.length}</div>
        <div className="relative">
          <div className="absolute left-[2px] top-1.5 bottom-1.5 w-px bg-rule2" />
          <div className="space-y-3">
            {draft.backtest.precedentList.map((p, i) => (
              <div key={i} className="relative pl-4">
                <div className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full bg-ink" />
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-body text-muted text-label">{p.date}</span>
                  <span className="font-body text-muted text-label opacity-40">·</span>
                  <span className="font-body text-ink text-label font-medium">{p.plant}</span>
                </div>
                <div className="font-body text-muted text-label leading-snug">{p.outcome}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shadow trial summary */}
      {status !== 'draft' && (
        <div className="px-4 py-2.5 border-b border-rule2 flex items-center gap-2">
          <ShieldCheck size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
          <span className="font-body text-muted text-label">
            {status === 'shadow'
              ? `Shadow mode · ${draft.shadowStats.daysRunning}d running · ${draft.shadowStats.matchesLogged} matches logged · ${draft.shadowStats.falseActions} false actions`
              : `Promoted to live after ${draft.shadowStats.daysRunning}d shadow run with ${draft.shadowStats.falseActions} false actions`}
          </span>
        </div>
      )}

      {/* Live impact — what's happened since this policy started acting on its own,
          separate from the shadow-trial summary above which only covers the pre-promotion period */}
      {status === 'live' && (
        <div className="px-4 py-3 border-b border-rule2 bg-stone2">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
            <span className="font-body text-muted text-label">
              {draft.liveStats ? `Live impact · ${draft.liveStats.daysLive}d` : 'Live impact'}
            </span>
          </div>
          {draft.liveStats ? (
            <>
              <div className="grid grid-cols-3 gap-px bg-rule2 mb-2">
                <div className="bg-stone px-3 py-2">
                  <div className="font-body text-muted text-label mb-0.5">Fired</div>
                  <div className="display-num text-sub font-bold tabular-nums text-ink">{draft.liveStats.firedCount}×</div>
                </div>
                <div className="bg-stone px-3 py-2">
                  <div className="font-body text-muted text-label mb-0.5">Matched real incident</div>
                  <div className="display-num text-sub font-bold tabular-nums text-ok">{draft.liveStats.matchedIncidents}</div>
                </div>
                <div className="bg-stone px-3 py-2">
                  <div className="font-body text-muted text-label mb-0.5">False actions</div>
                  <div className={`display-num text-sub font-bold tabular-nums ${draft.liveStats.falseActions > 0 ? 'text-warn' : 'text-ok'}`}>{draft.liveStats.falseActions}</div>
                </div>
              </div>
              <p className="font-body text-muted text-label leading-relaxed">{draft.liveStats.impactNote}</p>
            </>
          ) : (
            <p className="font-body text-muted text-label leading-relaxed">Just went live — no activity recorded yet. Impact will appear here the first time this policy fires.</p>
          )}
        </div>
      )}

      {/* Promotion controls — one explicit button per transition, no duplicate paths */}
      {canEdit ? (
        <div className="px-4 py-3 flex gap-2">
          {status === 'draft' && (
            <Btn variant="secondary" onClick={() => onStatusChange('shadow')}>
              Activate shadow mode
            </Btn>
          )}
          {status === 'shadow' && (
            <>
              <div className="flex-1">
                <HoldButton
                  label="Hold to go live"
                  holdLabel="Keep holding to confirm…"
                  doneLabel="Live"
                  duration={1500}
                  tone="ok"
                  onConfirm={() => onStatusChange('live')}
                />
              </div>
              <Btn variant="secondary" onClick={() => onStatusChange('draft')}>
                Revert to draft
              </Btn>
            </>
          )}
          {status === 'live' && (
            <Btn variant="secondary" onClick={() => onStatusChange('shadow')}>
              Revert to shadow mode
            </Btn>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-1.5 font-body text-muted text-label">
          <Lock size={11} strokeWidth={2} className="flex-shrink-0" />
          <span>Only a Director can change this policy's status or threshold</span>
        </div>
      )}
    </>
  )
}

const COMPARATORS = ['>=', '>', '<=', '<']
const DURATION_OPTIONS = [0, 15, 30, 60]

function NewPolicyComposer({ agents, allowedPersonas, onCreate, onCancel }) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? '')
  const [jtbd, setJtbd] = useState(JTBD_CATEGORIES[0]?.id ?? '')
  const [persona, setPersona] = useState(allowedPersonas[0]?.id ?? '')
  const [metricLabel, setMetricLabel] = useState('')
  const [comparator, setComparator] = useState('>=')
  const [threshold, setThreshold] = useState(50)
  const [durationMin, setDurationMin] = useState(0)
  const [corroborationLabel, setCorroborationLabel] = useState('')
  const [action, setAction] = useState('')

  const canSubmit = metricLabel.trim() && action.trim() && agentId

  const fieldCls = 'w-full font-body text-body text-ink bg-stone2 border border-rule2 px-3 py-2 placeholder:text-muted/60 focus:border-signal focus:outline-none'

  const handleSubmit = () => {
    const draft = {
      id: `pol-custom-${Date.now()}`,
      agentId,
      jtbd,
      persona,
      name: metricLabel.trim(),
      metricLabel: metricLabel.trim(),
      unit: '',
      comparator,
      threshold,
      minThreshold: Math.max(0, threshold - 20),
      maxThreshold: threshold + 20,
      durationMin,
      corroborationLabel: corroborationLabel.trim() || 'no corroboration required',
      action: action.trim(),
      status: 'draft',
      backtest: {
        windowDays: 90,
        baseFireCount: 5,
        basePrecedentMatches: 1,
        precedentList: [
          { date: 'No history yet', plant: 'New policy', outcome: 'First 90 days of live data will establish a precedent baseline.' },
        ],
      },
      shadowStats: { daysRunning: 0, matchesLogged: 0, falseActions: 0 },
    }
    onCreate(draft)
  }

  return (
    <>
      <SectionLabel label="New policy" />
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-body text-muted text-label block mb-1">Job to be done</label>
            <select value={jtbd} onChange={e => setJtbd(e.target.value)} className={fieldCls}>
              {JTBD_CATEGORIES.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
            </select>
          </div>
          <div>
            <label className="font-body text-muted text-label block mb-1">Owner</label>
            <select value={persona} onChange={e => setPersona(e.target.value)} disabled={allowedPersonas.length < 2} className={fieldCls}>
              {allowedPersonas.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="font-body text-muted text-label block mb-1">Assign to agent</label>
          <select value={agentId} onChange={e => setAgentId(e.target.value)} className={fieldCls}>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-muted text-label block mb-1">When this metric…</label>
          <input value={metricLabel} onChange={e => setMetricLabel(e.target.value)}
            placeholder="e.g. Allergen changeover dwell time" className={fieldCls} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="font-body text-muted text-label block mb-1">Is</label>
            <SegmentedControl
              options={COMPARATORS.map(c => ({ value: c, label: c }))}
              value={comparator}
              onChange={setComparator}
            />
          </div>
          <div>
            <label className="font-body text-muted text-label block mb-1">Threshold</label>
            <div className="flex items-center gap-2 h-[38px]">
              <input type="range" min={0} max={200} step={1}
                value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                className="w-full accent-signal" />
              <span className="display-num text-label tabular-nums text-ink flex-shrink-0">{threshold}</span>
            </div>
          </div>
          <div>
            <label className="font-body text-muted text-label block mb-1">Sustained for (min)</label>
            <SegmentedControl
              options={DURATION_OPTIONS.map(d => ({ value: d, label: String(d) }))}
              value={durationMin}
              onChange={setDurationMin}
            />
          </div>
        </div>
        <div>
          <label className="font-body text-muted text-label block mb-1">With corroboration <span className="opacity-50">(optional)</span></label>
          <input value={corroborationLabel} onChange={e => setCorroborationLabel(e.target.value)}
            placeholder="e.g. a second sensor confirms the same trend" className={fieldCls} />
        </div>
        <div>
          <label className="font-body text-muted text-label block mb-1">Then</label>
          <input value={action} onChange={e => setAction(e.target.value)}
            placeholder="e.g. escalate to the shift supervisor" className={fieldCls} />
        </div>
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-rule2 bg-stone2">
        <Btn variant="primary" disabled={!canSubmit} onClick={handleSubmit}>Save draft</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>
    </>
  )
}

export default function PolicyBuilderTab() {
  const { viewingRole } = useAppState()
  const agents = agentConfigData?.agents ?? []
  const allowedPersonas = PERSONAS.filter(p => canEditPersona(viewingRole, p.id))
  const [drafts, setDrafts] = useState(SEED_DRAFTS)
  const [thresholds, setThresholds] = useState(() =>
    Object.fromEntries(SEED_DRAFTS.map(d => [d.id, d.threshold]))
  )
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(SEED_DRAFTS.map(d => [d.id, d.status]))
  )
  const [selectedId, setSelectedId] = useState(SEED_DRAFTS[0]?.id ?? null)
  const [composing, setComposing] = useState(false)
  const [jtbdFilter, setJtbdFilter] = useState('all')
  const [personaFilter, setPersonaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleCreate = (draft) => {
    setDrafts(p => [draft, ...p])
    setThresholds(p => ({ ...p, [draft.id]: draft.threshold }))
    setStatuses(p => ({ ...p, [draft.id]: draft.status }))
    setComposing(false)
    setSelectedId(draft.id)
  }

  const filtered = drafts.filter(d => {
    if (personaFilter !== 'all' && d.persona !== personaFilter) return false
    if (statusFilter !== 'all' && (statuses[d.id] ?? d.status) !== statusFilter) return false
    if (jtbdFilter !== 'all' && d.jtbd !== jtbdFilter) return false
    return true
  })

  const sections = JTBD_CATEGORIES
    .map(cat => ({ category: cat, drafts: filtered.filter(d => d.jtbd === cat.id) }))
    .filter(s => s.drafts.length > 0)

  const statusCounts = filtered.reduce((acc, d) => {
    const s = statuses[d.id] ?? d.status
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  const selected = !composing ? drafts.find(d => d.id === selectedId) : null
  const selectedAgent = selected ? agents.find(a => a.id === selected.agentId) : null
  const selectedThreshold = selected ? (thresholds[selected.id] ?? selected.threshold) : null
  const selectedStatus = selected ? (statuses[selected.id] ?? selected.status) : null

  const selectDraft = (id) => { setComposing(false); setSelectedId(id) }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Filter bar — scales as policy count grows */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap px-6 py-3 border-b border-rule2">
        <FilterDropdown
          label="Job"
          options={[{ value: 'all', label: 'All jobs' }, ...JTBD_CATEGORIES.map(j => ({ value: j.id, label: j.label }))]}
          value={jtbdFilter}
          onChange={setJtbdFilter}
        />
        <FilterDropdown
          label="Owner"
          options={[{ value: 'all', label: 'All owners' }, ...PERSONAS.map(p => ({ value: p.id, label: p.label }))]}
          value={personaFilter}
          onChange={setPersonaFilter}
        />
        <FilterDropdown
          label="Status"
          options={[
            { value: 'all',    label: 'All statuses' },
            { value: 'draft',  label: 'Draft'  },
            { value: 'shadow', label: 'Shadow' },
            { value: 'live',   label: 'Live'   },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <span className="font-body text-muted text-label">
          {filtered.length} polic{filtered.length === 1 ? 'y' : 'ies'}
          {statusCounts.live ? ` · ${statusCounts.live} live` : ''}
        </span>
        <Btn variant="secondary" icon={Plus} onClick={() => setComposing(true)} className="ml-auto">
          New policy
        </Btn>
      </div>

      {/* Master-detail body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List pane — scrolls independently */}
        <div className="w-[320px] flex-shrink-0 border-r border-rule2 overflow-y-auto bg-stone">
          {sections.length === 0 ? (
            <div className="px-4 py-8 text-center font-body text-muted text-body">No policies match these filters</div>
          ) : (
            sections.map(({ category, drafts: items }) => (
              <div key={category.id}>
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-stone2 border-b border-t border-rule2 font-body text-muted text-label">
                  {category.label}
                </div>
                {items.map(draft => (
                  <PolicyRow
                    key={draft.id}
                    draft={draft}
                    agent={agents.find(a => a.id === draft.agentId)}
                    threshold={thresholds[draft.id] ?? draft.threshold}
                    status={statuses[draft.id] ?? draft.status}
                    isActive={!composing && draft.id === selectedId}
                    locked={!canEditPersona(viewingRole, draft.persona)}
                    onSelect={() => selectDraft(draft.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Detail pane — scrolls independently */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-stone2">
          {composing ? (
            <NewPolicyComposer agents={agents} allowedPersonas={allowedPersonas} onCreate={handleCreate} onCancel={() => setComposing(false)} />
          ) : selected ? (
            <PolicyDetail
              draft={selected}
              agent={selectedAgent}
              threshold={selectedThreshold}
              onThresholdChange={(v) => setThresholds(p => ({ ...p, [selected.id]: v }))}
              status={selectedStatus}
              onStatusChange={(v) => setStatuses(p => ({ ...p, [selected.id]: v }))}
              canEdit={canEditPersona(viewingRole, selected.persona)}
            />
          ) : (
            <div className="px-4 py-8 text-center font-body text-muted text-body">Select a policy to see its detail and backtest</div>
          )}
        </div>
      </div>
    </div>
  )
}
