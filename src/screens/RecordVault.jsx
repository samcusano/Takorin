import { useState } from 'react'
import { traceLots, fsmaPosture } from '../data/traceability'
import {
  CheckCircle2, AlertTriangle, Clock, XCircle,
  Lock, Shield, AlertCircle,
} from 'lucide-react'
import { StatusPill, Tabs, EmptyState } from '../components/UI'

const LOT_STATUS = {
  hold:  { tone: 'danger', label: 'Hold'  },
  watch: { tone: 'warn',   label: 'Watch' },
  clear: { tone: 'ok',     label: 'Clear' },
}

const CTE_STATUS = {
  complete: { icon: CheckCircle2,  cls: 'text-ok',    label: 'Complete' },
  active:   { icon: Clock,         cls: 'text-signal', label: 'Active'   },
  pending:  { icon: Clock,         cls: 'text-warn',   label: 'Pending'  },
  blocked:  { icon: XCircle,       cls: 'text-danger', label: 'Blocked'  },
  gap:      { icon: AlertTriangle, cls: 'text-danger', label: 'Gap'      },
}

const KDE_ICON = {
  ok:       { icon: CheckCircle2,  cls: 'text-ok'     },
  missing:  { icon: AlertCircle,   cls: 'text-danger' },
  conflict: { icon: AlertTriangle, cls: 'text-danger' },
  gap:      { icon: AlertTriangle, cls: 'text-warn'   },
  warn:     { icon: AlertTriangle, cls: 'text-warn'   },
}

const SEVERITY = {
  critical: { cls: 'text-danger', accent: 'border-l-danger', label: 'Critical' },
  high:     { cls: 'text-warn',   accent: 'border-l-warn',   label: 'High'     },
  medium:   { cls: 'text-signal', accent: 'border-l-signal', label: 'Medium'   },
  low:      { cls: 'text-muted',  accent: 'border-l-rule2',  label: 'Low'      },
}

function postureColor(p) {
  return p >= 80 ? 'text-ok' : p >= 50 ? 'text-warn' : 'text-danger'
}

function postureBg(p) {
  return p >= 80 ? 'bg-ok' : p >= 50 ? 'bg-warn' : 'bg-danger'
}

// ─── Lot list card ──────────────────────────────────────────────────────────

function LotCard({ lot, selected, onClick }) {
  const cfg = LOT_STATUS[lot.status] ?? LOT_STATUS.watch
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-3.5 py-3 border-b border-rule2 border-l-4 transition-colors ${
        selected ? 'border-l-signal bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-body font-medium text-ink text-label leading-snug">{lot.tlc}</div>
          <div className="font-body text-muted text-label mt-0.5">{lot.ingredient}</div>
        </div>
        <StatusPill tone={cfg.tone} className="flex-shrink-0">{cfg.label}</StatusPill>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-0.5 bg-rule2 flex-1">
          <div className={`h-full ${postureBg(lot.posture)}`} style={{ width: `${lot.posture}%` }} />
        </div>
        <span className={`font-body text-label tabular-nums ${postureColor(lot.posture)}`}>{lot.posture}%</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="font-body text-muted text-label">{lot.supplier}</span>
        {lot.cteGaps > 0 && (
          <span className="flex items-center gap-0.5 font-body text-danger text-label">
            <AlertTriangle size={9} strokeWidth={2} />
            {lot.cteGaps} gap{lot.cteGaps > 1 ? 's' : ''}
          </span>
        )}
        {lot.crossPlant.length > 1 && (
          <span className="font-body text-deep text-label">{lot.crossPlant.length} plants</span>
        )}
      </div>
    </button>
  )
}

// ─── Lot chain tab ──────────────────────────────────────────────────────────

function CTENode({ cte, isLast }) {
  const cfg = CTE_STATUS[cte.status] ?? CTE_STATUS.pending
  const Icon = cfg.icon
  const nodeBorder =
    cte.status === 'complete' ? 'border-ok bg-ok/10' :
    cte.status === 'active'   ? 'border-signal bg-signal/10' :
    cte.status === 'pending'  ? 'border-warn bg-warn/10' :
    'border-danger bg-danger/10'
  const statusTone =
    cte.status === 'complete' ? 'ok' :
    cte.status === 'active'   ? 'signal' :
    cte.status === 'pending'  ? 'warn' : 'danger'

  return (
    <div className="flex gap-3 px-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-5">
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${nodeBorder}`}>
          <Icon size={10} strokeWidth={2} className={cfg.cls} />
        </div>
        {!isLast && <div className="w-px bg-rule2 flex-1 my-1" style={{ minHeight: 20 }} />}
      </div>

      {/* CTE content */}
      <div className="flex-1 min-w-0 pb-5">
        <div className="flex items-center gap-2 mb-1 pt-0.5">
          <span className="font-body font-medium text-ink text-label">{cte.label}</span>
          <StatusPill tone={statusTone}>{cfg.label}</StatusPill>
        </div>
        {cte.date && (
          <div className="font-body text-muted text-label">{cte.date}</div>
        )}
        {cte.location && (
          <div className="font-body text-muted text-label">{cte.location}</div>
        )}
        {cte.actor && (
          <div className="font-body text-muted text-label mb-1">{cte.actor}</div>
        )}

        {/* KDE rows */}
        <div className="border border-rule2 mt-2">
          {cte.kdes.map((kde, i) => {
            const k = KDE_ICON[kde.status] ?? KDE_ICON.ok
            const KIcon = k.icon
            return (
              <div key={i}
                className={`flex items-start gap-2.5 px-3 py-2 border-b border-rule2 last:border-b-0 ${
                  kde.status !== 'ok' ? 'bg-stone2' : ''
                }`}>
                <KIcon size={10} strokeWidth={2} className={`${k.cls} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-body text-muted text-label">{kde.field}</span>
                    <span className={`font-body text-label font-medium ${kde.value ? 'text-ink' : 'text-danger'}`}>
                      {kde.value ?? '—'}
                    </span>
                  </div>
                  {kde.note && (
                    <div className={`font-body text-label mt-0.5 ${
                      kde.status === 'missing' || kde.status === 'conflict' ? 'text-danger' : 'text-warn'
                    }`}>{kde.note}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {cte.cteNote && (
          <p className="font-body text-muted text-label italic leading-snug mt-1.5">{cte.cteNote}</p>
        )}
      </div>
    </div>
  )
}

function ChainTab({ lot }) {
  return (
    <div className="py-4">
      {lot.ctEvents.map((cte, i) => (
        <CTENode key={cte.id} cte={cte} isLast={i === lot.ctEvents.length - 1} />
      ))}
    </div>
  )
}

// ─── KDE flat table tab ─────────────────────────────────────────────────────

function KDETab({ lot }) {
  const allKdes = lot.ctEvents.flatMap(cte =>
    cte.kdes.map(kde => ({ ...kde, cteName: cte.label }))
  )
  const gapRows = allKdes.filter(k => k.status !== 'ok')
  const okRows  = allKdes.filter(k => k.status === 'ok')

  return (
    <div>
      {gapRows.length > 0 && (
        <>
          <div className="px-4 py-2 bg-stone2 border-b border-rule2 sticky top-0">
            <span className="font-body text-muted text-label font-medium">Issues — {gapRows.length}</span>
          </div>
          {gapRows.map((kde, i) => {
            const k = KDE_ICON[kde.status] ?? KDE_ICON.ok
            const KIcon = k.icon
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2">
                <KIcon size={10} strokeWidth={2} className={`${k.cls} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap mb-0.5">
                    <span className="font-body text-muted text-label">{kde.cteName}</span>
                    <span className="font-body text-muted text-label">·</span>
                    <span className="font-body text-ink text-label">{kde.field}</span>
                  </div>
                  <div className={`font-body text-label ${kde.value ? 'text-ink' : 'text-danger italic'}`}>
                    {kde.value ?? 'Missing'}
                  </div>
                  {kde.note && (
                    <div className={`font-body text-label mt-0.5 ${
                      kde.status === 'missing' || kde.status === 'conflict' ? 'text-danger' : 'text-warn'
                    }`}>{kde.note}</div>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
      <div className="px-4 py-2 bg-stone2 border-b border-rule2 sticky top-0">
        <span className="font-body text-muted text-label font-medium">Verified — {okRows.length}</span>
      </div>
      {okRows.map((kde, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule2">
          <CheckCircle2 size={10} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap mb-0.5">
              <span className="font-body text-muted text-label">{kde.cteName}</span>
              <span className="font-body text-muted text-label">·</span>
              <span className="font-body text-ink text-label">{kde.field}</span>
            </div>
            <div className="font-body text-muted text-label">{kde.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── AI record tab ──────────────────────────────────────────────────────────

function AIRecordTab({ lot }) {
  if (!lot.agentDecisions || lot.agentDecisions.length === 0) {
    return <EmptyState message="No agent decisions" sub="No agent actions have been logged for this lot." />
  }
  return (
    <div>
      {lot.agentDecisions.map(ad => (
        <div key={ad.id} className="px-4 py-4 border-b border-rule2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="font-body font-medium text-ink text-label">{ad.action}</div>
              <div className="font-body text-muted text-label mt-0.5">{ad.agent}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusPill tone={ad.decision === 'approved' ? 'ok' : 'warn'}>
                {ad.decision === 'approved' ? 'Approved' : 'Overridden'}
              </StatusPill>
              <span className="font-body text-muted text-label">T{ad.tier}</span>
            </div>
          </div>
          <div className="px-3 py-2.5 bg-stone2 border border-rule2 mb-2">
            <div className="font-body text-muted text-label mb-1">Rationale</div>
            <p className="font-body text-ink text-label leading-relaxed">{ad.rationale}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-muted text-label">{ad.reviewedBy}</span>
            <span className="font-body text-muted text-label opacity-40">·</span>
            <span className="font-body text-muted text-label">{ad.timestamp}</span>
            <span className="font-body text-muted text-label opacity-40">·</span>
            <span className="font-body text-muted text-label">{Math.round(ad.dwellMs / 1000)}s dwell</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FDA posture tab ─────────────────────────────────────────────────────────

function FDAPostureTab({ lot }) {
  const { fdaPosture } = lot
  return (
    <div>
      {/* Score band */}
      <div className={`px-6 py-4 border-b border-rule2 flex items-center gap-5 ${
        fdaPosture.submittable ? 'bg-ok/[0.02]' : 'bg-stone2'
      }`}>
        <div className="flex-shrink-0">
          <div className={`font-display font-bold text-metric leading-none ${postureColor(fdaPosture.score)}`}>
            {fdaPosture.score}%
          </div>
          <div className="font-body text-muted text-label mt-0.5">FSMA 204 posture</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-1 bg-rule2 mb-2 rounded-full overflow-hidden">
            <div className={`h-full ${postureBg(fdaPosture.score)}`} style={{ width: `${fdaPosture.score}%` }} />
          </div>
          <div className={`flex items-center gap-1.5 ${fdaPosture.submittable ? 'text-ok' : 'text-danger'}`}>
            {fdaPosture.submittable
              ? <><CheckCircle2 size={10} strokeWidth={2} /><span className="font-body text-label font-medium">Submittable to FDA</span></>
              : <><XCircle size={10} strokeWidth={2} /><span className="font-body text-label font-medium">Not submittable</span></>
            }
          </div>
        </div>
      </div>

      {/* Gaps */}
      {fdaPosture.gaps.length > 0 && (
        <>
          <div className="px-4 py-2 bg-stone2 border-b border-rule2">
            <span className="font-body text-muted text-label font-medium">Gaps — {fdaPosture.gaps.length}</span>
          </div>
          {fdaPosture.gaps.map((gap, i) => {
            const cfg = SEVERITY[gap.severity] ?? SEVERITY.medium
            return (
              <div key={i} className={`px-4 py-3 border-b border-rule2 border-l-2 ${cfg.accent}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-body text-micro font-medium ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <span className="font-body text-ink text-label">{gap.field}</span>
                </div>
                <p className="font-body text-muted text-label leading-snug">{gap.issue}</p>
              </div>
            )
          })}
        </>
      )}

      {/* Compliant */}
      {fdaPosture.compliant.length > 0 && (
        <>
          <div className="px-4 py-2 bg-stone2 border-b border-rule2">
            <span className="font-body text-muted text-label font-medium">Compliant — {fdaPosture.compliant.length}</span>
          </div>
          {fdaPosture.compliant.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-rule2">
              <CheckCircle2 size={10} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
              <span className="font-body text-muted text-label">{item}</span>
            </div>
          ))}
        </>
      )}

      {/* Audit note */}
      {fdaPosture.auditNote && (
        <div className="px-4 py-3 bg-stone2 border-t border-rule2 flex items-start gap-2">
          <Shield size={10} strokeWidth={2} className="text-muted flex-shrink-0 mt-0.5" />
          <p className="font-body text-muted text-label italic leading-snug">{fdaPosture.auditNote}</p>
        </div>
      )}
    </div>
  )
}

// ─── Right panel ─────────────────────────────────────────────────────────────

function LotDetail({ lot }) {
  const [tab, setTab] = useState('chain')
  const cfg = LOT_STATUS[lot.status] ?? LOT_STATUS.watch
  const issueCount = lot.ctEvents.reduce(
    (n, cte) => n + cte.kdes.filter(k => k.status !== 'ok').length, 0
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
          {lot.namingConflict && <StatusPill tone="danger">Naming conflict</StatusPill>}
          {lot.crossPlant.length > 1 && (
            <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-deep">
              {lot.crossPlant.join(' · ')}
            </span>
          )}
          {lot.coaStatus === 'missing' && (
            <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-danger">COA missing</span>
          )}
          {lot.coaStatus === 'requested' && (
            <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-warn">COA requested</span>
          )}
          {lot.coaStatus === 'present' && (
            <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-ok">COA verified</span>
          )}
        </div>
        <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{lot.tlc}</div>
        <div className="font-body text-muted text-body">{lot.ingredient} · {lot.supplier}</div>
        {lot.holdReason && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Lock size={9} strokeWidth={2} className="text-danger flex-shrink-0" />
            <span className="font-body text-danger text-label">{lot.holdReason}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="font-body text-muted text-label">PO {lot.poNumber}</span>
          <span className="font-body text-muted text-label opacity-40">·</span>
          <span className="font-body text-muted text-label">{lot.quantity} {lot.unit}</span>
          <span className="font-body text-muted text-label opacity-40">·</span>
          <span className="font-body text-muted text-label">{lot.receivedDate}</span>
          {lot.lines.length > 0 && (
            <>
              <span className="font-body text-muted text-label opacity-40">·</span>
              <span className="font-body text-muted text-label">{lot.lines.join(', ')}</span>
            </>
          )}
        </div>
      </div>

      <Tabs
        className="flex-shrink-0 bg-stone2"
        tabs={[
          { id: 'chain',     label: 'Lot chain' },
          { id: 'kdes',      label: issueCount > 0 ? `KDEs · ${issueCount}` : 'KDEs', dot: issueCount > 0 },
          { id: 'ai-record', label: 'AI record', dot: lot.agentDecisions.length > 0 },
          { id: 'fda',       label: 'FDA posture', dot: !lot.fdaPosture.submittable },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="flex-1 overflow-y-auto">
        {tab === 'chain'     && <ChainTab lot={lot} />}
        {tab === 'kdes'      && <KDETab lot={lot} />}
        {tab === 'ai-record' && <AIRecordTab lot={lot} />}
        {tab === 'fda'       && <FDAPostureTab lot={lot} />}
      </div>
    </div>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function RecordVault() {
  const [selectedId, setSelectedId] = useState(traceLots[0].id)
  const selectedLot = traceLots.find(l => l.id === selectedId)

  const holdCount = traceLots.filter(l => l.status === 'hold').length

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: lot list */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

        <div className="flex-1 overflow-y-auto">
          {traceLots.map(lot => (
            <LotCard key={lot.id} lot={lot}
              selected={selectedId === lot.id}
              onClick={() => setSelectedId(lot.id)} />
          ))}
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-rule2 bg-stone2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Shield size={10} strokeWidth={2} className="text-ok" />
            <span className="font-body text-ok text-label font-medium">FSMA 204 traceability active</span>
          </div>
          <p className="font-body text-muted text-label leading-snug">
            CTEs and KDEs logged per §204. Tamper-evident audit trail.
          </p>
        </div>
      </div>

      {/* Right: lot detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        {selectedLot
          ? <LotDetail lot={selectedLot} />
          : <EmptyState message="Select a lot" sub="Choose a traceability lot code from the list" />
        }
      </div>
    </div>
  )
}
