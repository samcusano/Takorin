import { useState } from 'react'
import { batchRecords, deviations } from '../data/records'
import { Lock, CheckCircle2, XCircle, Clock, FileCheck2, AlertTriangle, Shield } from 'lucide-react'
import { StatusPill, SectionHeader, Tabs, Btn, StatGrid, EmptyState } from '../components/UI'

const STATUS_CFG = {
  'in-progress': { label: 'In progress', dot: 'bg-signal', tone: 'signal' },
  'pending-qp':  { label: 'Pending QP',  dot: 'bg-warn',  tone: 'warn' },
  'released':    { label: 'Released',    dot: 'bg-ok',    tone: 'ok' },
  'rejected':    { label: 'Rejected',    dot: 'bg-danger', tone: 'danger' },
}

const HP_CFG = {
  cleared: { icon: CheckCircle2, cls: 'text-ok', bg: 'bg-ok/[0.04] border-ok/20', label: 'Cleared' },
  active:  { icon: Clock,        cls: 'text-warn', bg: 'bg-warn/[0.04] border-warn/20', label: 'Active gate' },
  locked:  { icon: Lock,         cls: 'text-muted', bg: 'bg-stone2 border-rule2', label: 'Locked' },
}

function RecordCard({ rec, selected, onClick }) {
  const cfg = STATUS_CFG[rec.status] ?? STATUS_CFG['in-progress']
  const clearedHPs = rec.holdPoints.filter(hp => hp.status === 'cleared').length
  const devs = deviations.filter(d => d.batchId === rec.batchId)
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3.5 border-b border-rule2 border-l-4 transition-colors ${
        selected ? 'border-l-signal bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-body font-medium text-ink text-label leading-snug">{rec.batchId}</div>
          <div className="font-body text-muted text-label mt-0.5">{rec.product}</div>
        </div>
        <StatusPill tone={cfg.tone} className="flex-shrink-0">{cfg.label}</StatusPill>
      </div>
      {/* Completeness bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="h-0.5 bg-rule2 flex-1">
          <div className={`h-full ${rec.completeness >= 1 ? 'bg-ok' : rec.completeness >= 0.5 ? 'bg-signal' : 'bg-warn'}`}
            style={{ width: `${rec.completeness * 100}%` }} />
        </div>
        <span className="font-body text-muted text-label tabular-nums">{Math.round(rec.completeness * 100)}%</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="font-body text-muted text-label">Hold points: {clearedHPs}/{rec.holdPoints.length}</span>
        {devs.length > 0 && (
          <span className="flex items-center gap-0.5 font-body text-warn text-label">
            <AlertTriangle size={10} strokeWidth={2} />{devs.length} dev.
          </span>
        )}
      </div>
    </button>
  )
}

function HoldPointRow({ hp }) {
  const cfg = HP_CFG[hp.status] ?? HP_CFG.locked
  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-rule2 ${hp.status === 'active' ? 'bg-warn/[0.02]' : ''}`}>
      <Icon size={12} strokeWidth={2} className={`${cfg.cls} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="font-body text-ink text-label mb-0.5">{hp.step}</div>
        {hp.status === 'cleared' && (
          <div className="font-body text-muted text-label">Cleared by {hp.clearedBy} · {hp.clearedAt}</div>
        )}
        {hp.status === 'active' && (
          <div className="font-body text-warn text-label">Awaiting {hp.requiredRole} signature · Cannot proceed</div>
        )}
        {hp.status === 'locked' && (
          <div className="font-body text-muted text-label">Requires {hp.requiredRole} · Prior hold points must clear first</div>
        )}
      </div>
      <span className={`font-body text-micro flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
    </div>
  )
}

function StepRow({ step }) {
  const isComplete = !!step.completedAt
  const isBlocked = step.status === 'blocked'
  const isLocked = step.status === 'locked'

  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-rule2 ${isBlocked ? 'bg-warn/[0.02]' : isLocked ? 'opacity-40' : ''}`}>
      <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5
        ${isComplete ? 'border-ok bg-ok/10' : isBlocked ? 'border-warn bg-warn/10' : 'border-rule2 bg-stone2'}">
        {isComplete
          ? <CheckCircle2 size={10} strokeWidth={2} className="text-ok" />
          : isBlocked
            ? <Clock size={10} strokeWidth={2} className="text-warn" />
            : <Lock size={10} strokeWidth={2} className="text-muted" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-body text-label mb-0.5 ${isComplete ? 'text-ink' : 'text-muted'}`}>{step.label}</div>
        {isComplete && (
          <div className="flex items-center gap-2">
            <span className="font-body text-muted text-label">{step.actor} · {step.role}</span>
            <span className="font-body text-muted text-label opacity-50">·</span>
            <span className="font-body text-muted text-label">{step.completedAt}</span>
            {step.sigHash && (
              <span className="font-body text-ok text-label font-body">e-sig {step.sigHash}</span>
            )}
          </div>
        )}
        {isBlocked && (
          <div className="font-body text-warn text-label">Blocked — awaiting hold point clearance</div>
        )}
      </div>
    </div>
  )
}

function RecordDetail({ rec }) {
  const [tab, setTab] = useState('bmr')
  if (!rec) return <EmptyState message="Select a batch record" sub="Choose from the list to view details" />

  const cfg = STATUS_CFG[rec.status] ?? STATUS_CFG['in-progress']
  const devs = deviations.filter(d => d.batchId === rec.batchId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2">
        <div className="flex items-center gap-2 mb-2">
          <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
          {rec.regulations.map(r => (
            <span key={r} className="font-body text-label px-1.5 py-0.5 bg-stone3 text-muted">{r}</span>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Shield size={9} strokeWidth={2} className="text-ok" />
            <span className="font-body text-ok text-label">Tamper-evident audit trail active</span>
          </div>
        </div>
        <div className="font-display font-bold text-ink text-subhead leading-none mb-0.5">{rec.batchId}</div>
        <div className="font-body text-muted text-body">{rec.product} · {rec.vessel}</div>
      </div>

      {/* Tabs */}
      <Tabs
        className="flex-shrink-0 bg-stone2"
        tabs={[
          { id: 'bmr',   label: 'BMR Steps' },
          { id: 'holds', label: 'Hold Points', dot: rec.holdPoints.some(h => h.status === 'active') },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'qp',    label: 'QP Disposition', dot: rec.qpDisposition?.status === 'under-review' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="flex-1 overflow-y-auto">

        {/* BMR Steps tab */}
        {tab === 'bmr' && (
          <div>
            {devs.length > 0 && (
              <div className="px-4 py-3 border-b border-rule2 bg-warn/[0.04] flex items-start gap-2">
                <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="font-body text-warn text-label font-medium mb-0.5">{devs.length} open deviation{devs.length > 1 ? 's' : ''}</p>
                  {devs.map(d => (
                    <p key={d.id} className="font-body text-warn text-label">{d.id} — {d.parameter}: {d.observed} (expected {d.expected})</p>
                  ))}
                </div>
              </div>
            )}
            {rec.steps.map(s => <StepRow key={s.id} step={s} />)}
          </div>
        )}

        {/* Hold Points tab */}
        {tab === 'holds' && (
          <div>
            <SectionHeader sub="Hold points are regulatory gates. Production cannot proceed to the next stage until the hold is cleared by an authorized signatory. Hold points cannot be bypassed without a formal deviation and QP disposition." />
            {rec.holdPoints.map(hp => <HoldPointRow key={hp.id} hp={hp} />)}
          </div>
        )}

        {/* Audit Trail tab */}
        {tab === 'audit' && (
          <div>
            <SectionHeader sub="All entries are attributable, contemporaneous, and tamper-evident per 21 CFR Part 11. Records cannot be deleted or modified." />
            {rec.auditTrail.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rule2 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-body font-medium text-ink text-label">{entry.event}</span>
                    <span className="font-body text-muted text-label">· {entry.actor}</span>
                  </div>
                  <div className="font-body text-muted text-label">{entry.detail}</div>
                </div>
                <span className="font-body text-muted text-label flex-shrink-0">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* QP Disposition tab */}
        {tab === 'qp' && (
          <div className="px-6 py-5 space-y-4">
            {rec.qpDisposition ? (
              <>
                <StatGrid cols={3} noBorder>
                  {[
                    { label: 'QP', val: rec.qpDisposition.qp },
                    { label: 'Status', val: rec.qpDisposition.status === 'released' ? 'Released' : rec.qpDisposition.status === 'under-review' ? 'Under review' : rec.qpDisposition.status },
                    { label: 'Submitted', val: rec.qpDisposition.submittedAt },
                  ].map(({ label, val }) => (
                    <StatGrid.Cell key={label} label={label} value={val} size="sm" />
                  ))}
                </StatGrid>
                {rec.qpDisposition.notes && (
                  <div className="px-4 py-3 bg-stone2">
                    <div className="font-body text-muted text-label mb-1">QP notes</div>
                    <p className="font-display text-ink text-body leading-relaxed">{rec.qpDisposition.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center bg-stone2">
                <Lock size={16} className="text-muted mx-auto mb-2" strokeWidth={1.5} />
                <div className="font-body font-medium text-ink text-label mb-1">QP disposition not yet initiated</div>
                <p className="font-body text-muted text-label">Hold points must be cleared before batch is submitted for QP release.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecordVault() {
  const [selectedId, setSelectedId] = useState(null)
  const selectedRecord = batchRecords.find(r => r.id === selectedId)

  const pendingQP = batchRecords.filter(r => r.status === 'pending-qp').length
  const openHolds = batchRecords.reduce((n, r) => n + r.holdPoints.filter(h => h.status === 'active').length, 0)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: record list */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label mb-0.5">Frontier Layer</div>
          <div className="font-display font-bold text-ink text-head leading-none">Record Vault</div>
          <div className="font-body text-muted text-label mt-1">21 CFR Part 11 · EU Annex 11</div>
          <div className="flex items-center gap-3 mt-2">
            {pendingQP > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={9} strokeWidth={2} className="text-warn" />
                <span className="font-body text-warn text-label">{pendingQP} pending QP</span>
              </div>
            )}
            {openHolds > 0 && (
              <div className="flex items-center gap-1">
                <Lock size={9} strokeWidth={2} className="text-signal" />
                <span className="font-body text-signal text-label">{openHolds} open hold{openHolds > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {batchRecords.map(r => (
            <RecordCard key={r.id} rec={r}
              selected={selectedId === r.id}
              onClick={() => setSelectedId(r.id)} />
          ))}
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-rule2 bg-stone2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <FileCheck2 size={10} strokeWidth={2} className="text-ok" />
            <span className="font-body text-ok text-label font-medium">Records are legally binding</span>
          </div>
          <p className="font-body text-muted text-label leading-snug">All entries carry e-signature, timestamp, and actor attribution. Cannot be deleted or modified.</p>
        </div>
      </div>

      {/* Right: record detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <SectionHeader sub="Batch Manufacturing Record" />
        <RecordDetail rec={selectedRecord} />
      </div>
    </div>
  )
}
