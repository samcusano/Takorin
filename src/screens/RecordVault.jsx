import { useState } from 'react'
import { batchRecords, deviations } from '../data/records'
import { Lock, CheckCircle2, XCircle, Clock, FileCheck2, AlertTriangle, Shield } from 'lucide-react'

const STATUS_CFG = {
  'in-progress': { label: 'In progress', dot: 'bg-ochre', badge: 'bg-ochre/10 text-ochre border border-ochre/30' },
  'pending-qp':  { label: 'Pending QP',  dot: 'bg-warn',  badge: 'bg-warn/10 text-warn border border-warn/30' },
  'released':    { label: 'Released',    dot: 'bg-ok',    badge: 'bg-ok/10 text-ok border border-ok/30' },
  'rejected':    { label: 'Rejected',    dot: 'bg-danger',badge: 'bg-danger/10 text-danger border border-danger/30' },
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
        selected ? 'border-l-ochre bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-body font-medium text-ink text-[11px] leading-snug">{rec.batchId}</div>
          <div className="font-body text-ghost text-[9px] mt-0.5">{rec.product}</div>
        </div>
        <span className={`font-body text-[9px] px-1.5 py-0.5 flex-shrink-0 border ${cfg.badge}`}>{cfg.label}</span>
      </div>
      {/* Completeness bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="h-0.5 bg-rule2 flex-1">
          <div className={`h-full ${rec.completeness >= 1 ? 'bg-ok' : rec.completeness >= 0.5 ? 'bg-ochre' : 'bg-warn'}`}
            style={{ width: `${rec.completeness * 100}%` }} />
        </div>
        <span className="font-body text-ghost text-[9px] tabular-nums">{Math.round(rec.completeness * 100)}%</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="font-body text-ghost text-[9px]">Hold points: {clearedHPs}/{rec.holdPoints.length}</span>
        {devs.length > 0 && (
          <span className="flex items-center gap-0.5 font-body text-warn text-[9px]">
            <AlertTriangle size={8} strokeWidth={2} />{devs.length} dev.
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
        <div className="font-body text-ink text-[10px] mb-0.5">{hp.step}</div>
        {hp.status === 'cleared' && (
          <div className="font-body text-ghost text-[9px]">Cleared by {hp.clearedBy} · {hp.clearedAt}</div>
        )}
        {hp.status === 'active' && (
          <div className="font-body text-warn text-[9px]">Awaiting {hp.requiredRole} signature · Cannot proceed</div>
        )}
        {hp.status === 'locked' && (
          <div className="font-body text-muted text-[9px]">Requires {hp.requiredRole} · Prior hold points must clear first</div>
        )}
      </div>
      <span className={`font-body text-[8px] uppercase tracking-widest flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
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
        <div className={`font-body text-[10px] mb-0.5 ${isComplete ? 'text-ink' : 'text-muted'}`}>{step.label}</div>
        {isComplete && (
          <div className="flex items-center gap-2">
            <span className="font-body text-ghost text-[9px]">{step.actor} · {step.role}</span>
            <span className="font-body text-ghost text-[9px] opacity-50">·</span>
            <span className="font-body text-ghost text-[9px]">{step.completedAt}</span>
            {step.sigHash && (
              <span className="font-body text-ok text-[9px] font-mono">e-sig {step.sigHash}</span>
            )}
          </div>
        )}
        {isBlocked && (
          <div className="font-body text-warn text-[9px]">Blocked — awaiting hold point clearance</div>
        )}
      </div>
    </div>
  )
}

function RecordDetail({ rec }) {
  const [tab, setTab] = useState('bmr')
  if (!rec) return (
    <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
      Select a batch record
    </div>
  )

  const cfg = STATUS_CFG[rec.status] ?? STATUS_CFG['in-progress']
  const devs = deviations.filter(d => d.batchId === rec.batchId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2">
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-body text-[9px] px-1.5 py-0.5 border ${cfg.badge}`}>{cfg.label}</span>
          {rec.regulations.map(r => (
            <span key={r} className="font-body text-[9px] px-1.5 py-0.5 bg-stone3 text-ghost border border-rule2">{r}</span>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Shield size={9} strokeWidth={2} className="text-ok" />
            <span className="font-body text-ok text-[9px]">Tamper-evident audit trail active</span>
          </div>
        </div>
        <div className="font-display font-bold text-ink text-[20px] leading-none mb-0.5">{rec.batchId}</div>
        <div className="font-body text-ghost text-[12px]">{rec.product} · {rec.vessel}</div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-rule2 bg-stone2">
        {[
          { id: 'bmr', label: 'BMR Steps' },
          { id: 'holds', label: 'Hold Points' },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'qp', label: 'QP Disposition' },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 font-body text-[10px] border-b-2 transition-colors ${
              tab === t.id ? 'border-ochre text-ink' : 'border-transparent text-ghost hover:text-muted'
            }`}>
            {t.label}
            {t.id === 'holds' && rec.holdPoints.some(h => h.status === 'active') && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-warn inline-block" />
            )}
            {t.id === 'qp' && rec.qpDisposition?.status === 'under-review' && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-ochre inline-block" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* BMR Steps tab */}
        {tab === 'bmr' && (
          <div>
            {devs.length > 0 && (
              <div className="px-4 py-3 border-b border-rule2 bg-warn/[0.04] flex items-start gap-2">
                <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="font-body text-warn text-[10px] font-medium mb-0.5">{devs.length} open deviation{devs.length > 1 ? 's' : ''}</p>
                  {devs.map(d => (
                    <p key={d.id} className="font-body text-warn text-[9px]">{d.id} — {d.parameter}: {d.observed} (expected {d.expected})</p>
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
            <div className="px-4 py-3 border-b border-rule2 bg-stone2">
              <p className="font-body text-ghost text-[9px] leading-snug">Hold points are regulatory gates. Production cannot proceed to the next stage until the hold is cleared by an authorized signatory. Hold points cannot be bypassed without a formal deviation and QP disposition.</p>
            </div>
            {rec.holdPoints.map(hp => <HoldPointRow key={hp.id} hp={hp} />)}
          </div>
        )}

        {/* Audit Trail tab */}
        {tab === 'audit' && (
          <div>
            <div className="px-4 py-3 border-b border-rule2 bg-stone2">
              <p className="font-body text-ghost text-[9px] leading-snug">All entries are attributable, contemporaneous, and tamper-evident per 21 CFR Part 11. Records cannot be deleted or modified.</p>
            </div>
            {rec.auditTrail.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rule2 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-body font-medium text-ink text-[10px]">{entry.event}</span>
                    <span className="font-body text-ghost text-[9px]">· {entry.actor}</span>
                  </div>
                  <div className="font-body text-ghost text-[9px]">{entry.detail}</div>
                </div>
                <span className="font-body text-ghost text-[9px] flex-shrink-0">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* QP Disposition tab */}
        {tab === 'qp' && (
          <div className="px-6 py-5 space-y-4">
            {rec.qpDisposition ? (
              <>
                <div className="grid grid-cols-3 gap-px bg-rule2 border border-rule2">
                  {[
                    { label: 'QP', val: rec.qpDisposition.qp },
                    { label: 'Status', val: rec.qpDisposition.status === 'released' ? 'Released' : rec.qpDisposition.status === 'under-review' ? 'Under review' : rec.qpDisposition.status },
                    { label: 'Submitted', val: rec.qpDisposition.submittedAt },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-stone px-3 py-2.5">
                      <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
                      <div className="font-body font-medium text-ink text-[12px]">{val}</div>
                    </div>
                  ))}
                </div>
                {rec.qpDisposition.notes && (
                  <div className="px-4 py-3 border border-rule2 bg-stone2">
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1">QP notes</div>
                    <p className="font-body text-ink text-[11px] leading-relaxed">{rec.qpDisposition.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center border border-rule2 bg-stone2">
                <Lock size={16} className="text-muted mx-auto mb-2" strokeWidth={1.5} />
                <div className="font-body font-medium text-ink text-[11px] mb-1">QP disposition not yet initiated</div>
                <p className="font-body text-ghost text-[10px]">Hold points must be cleared before batch is submitted for QP release.</p>
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
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Frontier Layer</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Record Vault</div>
          <div className="font-body text-ghost text-[10px] mt-1">21 CFR Part 11 · EU Annex 11</div>
          <div className="flex items-center gap-3 mt-2">
            {pendingQP > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={9} strokeWidth={2} className="text-warn" />
                <span className="font-body text-warn text-[10px]">{pendingQP} pending QP</span>
              </div>
            )}
            {openHolds > 0 && (
              <div className="flex items-center gap-1">
                <Lock size={9} strokeWidth={2} className="text-ochre" />
                <span className="font-body text-ochre text-[10px]">{openHolds} open hold{openHolds > 1 ? 's' : ''}</span>
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
            <span className="font-body text-ok text-[10px] font-medium">Records are legally binding</span>
          </div>
          <p className="font-body text-ghost text-[9px] leading-snug">All entries carry e-signature, timestamp, and actor attribution. Cannot be deleted or modified.</p>
        </div>
      </div>

      {/* Right: record detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Batch Manufacturing Record</span>
        </div>
        <RecordDetail rec={selectedRecord} />
      </div>
    </div>
  )
}
