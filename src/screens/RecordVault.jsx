import { useState } from 'react'
import { Link } from 'react-router-dom'
import { traceLots } from '../data/traceability'
import {
  CheckCircle2, AlertTriangle, Clock, XCircle,
  Lock, Shield, AlertCircle, ChevronDown, Zap, ExternalLink,
} from 'lucide-react'
import { StatusPill, Btn, EmptyState } from '../components/UI'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOT_STATUS = {
  hold:  { tone: 'danger', label: 'Hold'  },
  watch: { tone: 'warn',   label: 'Watch' },
  clear: { tone: 'ok',     label: 'Clear' },
}

const CTE_STATUS = {
  complete: { icon: CheckCircle2,  cls: 'text-ok',     border: 'border-ok bg-ok/10',         tone: 'ok',     label: 'Complete' },
  active:   { icon: Clock,         cls: 'text-signal',  border: 'border-signal bg-signal/10', tone: 'signal', label: 'Active'   },
  pending:  { icon: Clock,         cls: 'text-warn',    border: 'border-warn bg-warn/10',     tone: 'warn',   label: 'Pending'  },
  blocked:  { icon: XCircle,       cls: 'text-danger',  border: 'border-danger bg-danger/10', tone: 'danger', label: 'Blocked'  },
  gap:      { icon: AlertTriangle, cls: 'text-danger',  border: 'border-danger bg-danger/10', tone: 'danger', label: 'Gap'      },
}

const KDE_ICON = {
  ok:       { icon: CheckCircle2,  cls: 'text-ok'     },
  missing:  { icon: AlertCircle,   cls: 'text-danger' },
  conflict: { icon: AlertTriangle, cls: 'text-danger' },
  gap:      { icon: AlertTriangle, cls: 'text-warn'   },
  warn:     { icon: AlertTriangle, cls: 'text-warn'   },
}

const KDE_ACTION = {
  missing:  { label: 'Supplier IQ',  to: '/suppliers'  },
  conflict: { label: 'Data Quality', to: '/data' },
  gap:      { label: 'Data Quality', to: '/data' },
}

function postureColor(p) { return p >= 80 ? 'text-ok' : p >= 50 ? 'text-warn' : 'text-danger' }
function postureBg(p)    { return p >= 80 ? 'bg-ok'   : p >= 50 ? 'bg-warn'   : 'bg-danger'   }

// ─── Lot list card ────────────────────────────────────────────────────────────

function LotTraceCard({ lot, selected, onClick }) {
  const cfg = LOT_STATUS[lot.status] ?? LOT_STATUS.watch
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-3.5 py-3 border-b border-rule2 border-l-4 transition-colors ${
        selected ? 'border-l-signal bg-stone2' : 'border-l-transparent hover:bg-stone2/50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-body font-medium text-ink text-body leading-snug">{lot.tlc}</div>
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

// ─── Lot document — the R1 format ────────────────────────────────────────────

function LotDocument({ lot }) {
  const [chainOpen, setChainOpen] = useState(true)
  const [okExpanded, setOkExpanded] = useState({})
  const toggleOk = (id) => setOkExpanded(p => ({ ...p, [id]: !p[id] }))

  const cfg = LOT_STATUS[lot.status] ?? LOT_STATUS.watch

  // Derive all KDE issues across the chain
  const allIssues = lot.ctEvents.flatMap(cte =>
    cte.kdes.filter(k => k.status !== 'ok').map(k => ({ ...k, cteName: cte.label, cteId: cte.id }))
  )
  // Blocking (critical) first, then watch
  const sortedIssues = [
    ...allIssues.filter(k => k.status === 'missing' || k.status === 'conflict'),
    ...allIssues.filter(k => k.status !== 'missing' && k.status !== 'conflict'),
  ]

  const submittable = lot.fdaPosture?.submittable ?? false

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Document title block ──────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b-2 border-b-danger/[0.15] bg-stone2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-body text-label text-muted mb-1.5">FSMA 204 traceability record</div>
            <div className="font-display font-bold text-ink text-head leading-none mb-0.5">{lot.tlc}</div>
            <div className="font-body text-muted text-body">{lot.ingredient} · {lot.supplier}</div>

            {/* Lot metadata */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
              {lot.namingConflict && <StatusPill tone="danger">Naming conflict</StatusPill>}
              {lot.coaStatus === 'missing'    && <StatusPill tone="danger">COA missing</StatusPill>}
              {lot.coaStatus === 'requested'  && <StatusPill tone="warn">COA requested</StatusPill>}
              {lot.coaStatus === 'present'    && <StatusPill tone="ok">COA verified</StatusPill>}
              {lot.crossPlant.length > 1 && (
                <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-deep">
                  {lot.crossPlant.join(' · ')}
                </span>
              )}
            </div>
          </div>

          {/* Posture + submittability */}
          <div className="text-right flex-shrink-0">
            <div className="font-body text-label text-muted mb-1.5">As of Jun 2, 2026</div>
            <StatusPill tone={submittable ? 'ok' : 'danger'}>
              {submittable ? 'Submittable' : 'Not submittable'}
            </StatusPill>
            <div className={`display-num text-score font-bold tabular-nums leading-none mt-2 ${postureColor(lot.posture)}`}>
              {lot.posture}%
            </div>
            <div className="font-body text-label text-muted">FSMA 204 posture</div>
          </div>
        </div>

        {/* Hold notice */}
        {lot.holdReason && (
          <div className="flex items-start gap-2.5 mt-3 px-4 py-3 bg-danger/[0.04] border border-danger/20">
            <Lock size={10} strokeWidth={2} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-body font-semibold text-danger text-body">Production hold active</div>
              <div className="font-body text-muted text-label mt-0.5">
                {lot.holdReason}
                {lot.lines.length > 0 && ` · ${lot.lines.join(', ')}`}
                {lot.receivedDate && ` · Received ${lot.receivedDate}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Findings requiring resolution ────────────────────── */}
        {sortedIssues.length > 0 ? (
          <div className="px-6 pt-5 pb-5 border-b border-rule2">
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-body text-label text-muted">
                Findings requiring resolution · {sortedIssues.length}
              </span>
              {sortedIssues.filter(k => k.status === 'missing' || k.status === 'conflict').length > 0 && (
                <span className="font-body text-label text-danger">
                  {sortedIssues.filter(k => k.status === 'missing' || k.status === 'conflict').length} blocking production
                </span>
              )}
            </div>

            <div className="space-y-3">
              {sortedIssues.map((kde, i) => {
                const isCrit = kde.status === 'missing' || kde.status === 'conflict'
                const k = KDE_ICON[kde.status] ?? KDE_ICON.warn
                const KIcon = k.icon
                const act = KDE_ACTION[kde.status]
                const statusLabel =
                  kde.status === 'missing'  ? 'Missing'  :
                  kde.status === 'conflict' ? 'Conflict' :
                  kde.status === 'gap'      ? 'Gap'      : 'Watch'

                return (
                  <div key={i} className="border border-rule2 overflow-hidden">
                    {/* 3px accent bar from R3 */}
                    <div className={`h-[3px] w-full ${isCrit ? 'bg-danger' : 'bg-warn'}`} />

                    <div className={`flex items-start gap-3 px-4 py-3 ${isCrit ? 'bg-danger/[0.025]' : 'bg-warn/[0.015]'}`}>
                      {/* Number */}
                      <span className="font-body text-label text-muted font-semibold tabular-nums w-5 flex-shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <KIcon size={10} strokeWidth={2} className={`${k.cls} flex-shrink-0 mt-0.5`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-body font-semibold text-body text-ink">{kde.field}</span>
                          <StatusPill tone={isCrit ? 'danger' : 'warn'}>{statusLabel}</StatusPill>
                          <span className="font-body text-label text-muted">{kde.cteName}</span>
                        </div>
                        <div className={`font-body text-body mb-1 ${kde.value ? 'text-ink' : 'text-danger'}`}>
                          {kde.value ?? 'Not received — required field'}
                        </div>
                        {kde.note && (
                          <div className={`font-body text-label leading-snug ${isCrit ? 'text-danger' : 'text-warn'}`}>
                            {kde.note}
                          </div>
                        )}
                      </div>

                      {act?.to && (
                        <Link to={act.to} className="flex-shrink-0">
                          <Btn variant={isCrit ? 'primary' : 'secondary'}>{act.label} →</Btn>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 pt-5 pb-5 border-b border-rule2">
            <div className="font-body text-label text-muted mb-3">Findings requiring resolution</div>
            <div className="flex items-center gap-2 px-4 py-3 bg-ok/[0.04] border border-ok/20">
              <CheckCircle2 size={11} strokeWidth={2} className="text-ok flex-shrink-0" />
              <span className="font-body text-ok text-body font-medium">No open findings — lot chain complete</span>
            </div>
          </div>
        )}

        {/* ── Logged actions (AI decisions) ────────────────────── */}
        {lot.agentDecisions?.length > 0 && (
          <div className="px-6 py-5 border-b border-rule2">
            <div className="font-body text-label text-muted mb-3">Logged actions</div>
            <div className="space-y-2">
              {lot.agentDecisions.map(ad => (
                <div key={ad.id} className="border border-rule2 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Zap size={9} strokeWidth={2} className="text-signal flex-shrink-0" />
                    <span className="font-body font-medium text-body text-ink flex-1">{ad.action}</span>
                    <StatusPill tone={ad.decision === 'approved' ? 'ok' : 'warn'}>
                      {ad.decision === 'approved' ? 'Approved' : 'Overridden'}
                    </StatusPill>
                    <span className="font-body text-label text-muted">T{ad.tier}</span>
                    <span className="font-body text-label text-muted">{ad.timestamp}</span>
                  </div>
                  <p className="font-body text-label text-muted leading-snug mb-1.5">{ad.rationale}</p>
                  <div className="font-body text-label text-muted">
                    {ad.reviewedBy} · {Math.round(ad.dwellMs / 1000)}s review time
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Full lot chain ────────────────────────────────────── */}
        <div>
          <button type="button" onClick={() => setChainOpen(o => !o)}
            className="w-full flex items-center gap-2 px-6 py-3 bg-stone2 border-b border-rule2 hover:bg-stone3 transition-colors text-left">
            <span className="font-body text-label text-muted flex-1">Full lot chain</span>
            <ChevronDown size={11} strokeWidth={2} className={`text-muted transition-transform duration-150 ${chainOpen ? 'rotate-180' : ''}`} />
          </button>

          {chainOpen && (
            <div className="px-6 pt-6 pb-6">
              {lot.ctEvents.map((cte, i) => {
                const c = CTE_STATUS[cte.status] ?? CTE_STATUS.pending
                const Icon = c.icon
                const isLast = i === lot.ctEvents.length - 1

                const blocking = cte.kdes.filter(k => k.status === 'missing' || k.status === 'conflict')
                const watching  = cte.kdes.filter(k => k.status !== 'ok' && k.status !== 'missing' && k.status !== 'conflict')
                const verified  = cte.kdes.filter(k => k.status === 'ok')
                const issueCount = blocking.length + watching.length
                const isOkOpen  = okExpanded[cte.id]

                // Solid-fill dot color per status
                const dotBg =
                  cte.status === 'complete' ? 'bg-ok'     :
                  cte.status === 'active'   ? 'bg-signal' :
                  cte.status === 'gap'      ? 'bg-danger' :
                  cte.status === 'blocked'  ? 'bg-danger' :
                  'bg-warn'

                return (
                  <div key={cte.id} className="flex gap-4">

                    {/* ── Timeline spine ──────────────────────────── */}
                    <div className="flex flex-col items-center flex-shrink-0 w-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${dotBg}`} />
                      {!isLast && (
                        <div className="w-0.5 bg-rule flex-1 mt-1.5" style={{ minHeight: 28 }} />
                      )}
                    </div>

                    {/* ── Stage content ────────────────────────────── */}
                    <div className="flex-1 min-w-0 pb-7">

                      {/* Stage header */}
                      <div className="flex items-baseline gap-2 pt-1 mb-1 flex-wrap">
                        <span className="font-body text-label text-muted">§{i + 1}</span>
                        <span className="font-display font-bold text-ink text-body">{cte.label}</span>
                        <StatusPill tone={c.tone}>{c.label}</StatusPill>
                        {issueCount > 0 && (
                          <span className="font-body text-label text-danger">
                            {issueCount} issue{issueCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {cte.date && (
                          <span className="font-body text-label text-muted ml-auto">{cte.date}</span>
                        )}
                      </div>

                      {/* Location · actor */}
                      {(cte.location || cte.actor) && (
                        <div className="font-body text-label text-muted mb-3">
                          {[cte.location, cte.actor].filter(Boolean).join(' · ')}
                        </div>
                      )}

                      {/* Issue KDEs — each as a mini-card with 3px accent bar */}
                      {(blocking.length > 0 || watching.length > 0) && (
                        <div className="space-y-2 mb-2">
                          {[...blocking, ...watching].map((kde, j) => {
                            const k = KDE_ICON[kde.status] ?? KDE_ICON.warn
                            const KIcon = k.icon
                            const isCrit = kde.status === 'missing' || kde.status === 'conflict'
                            const act = KDE_ACTION[kde.status]
                            const statusLabel =
                              kde.status === 'missing'  ? 'Missing'  :
                              kde.status === 'conflict' ? 'Conflict' :
                              kde.status === 'gap'      ? 'Gap'      : 'Watch'

                            return (
                              <div key={j} className="border border-rule2 overflow-hidden">
                                <div className={`h-[3px] w-full ${isCrit ? 'bg-danger' : 'bg-warn'}`} />
                                <div className={`flex items-start gap-3 px-4 py-3 ${isCrit ? 'bg-danger/[0.02]' : 'bg-warn/[0.01]'}`}>
                                  <KIcon size={10} strokeWidth={2} className={`${k.cls} flex-shrink-0 mt-0.5`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                      <span className="font-body font-medium text-body text-ink">{kde.field}</span>
                                      <StatusPill tone={isCrit ? 'danger' : 'warn'}>{statusLabel}</StatusPill>
                                    </div>
                                    <div className={`font-body text-label mb-0.5 ${kde.value ? 'text-ink' : 'text-danger'}`}>
                                      {kde.value ?? 'Not received'}
                                    </div>
                                    {kde.note && (
                                      <div className={`font-body text-label leading-snug ${isCrit ? 'text-danger' : 'text-warn'}`}>
                                        {kde.note}
                                      </div>
                                    )}
                                  </div>
                                  {act?.to && (
                                    <Link to={act.to} className="flex-shrink-0">
                                      <Btn variant="secondary">{act.label} →</Btn>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Verified KDEs — collapsed to count, expandable */}
                      {verified.length > 0 && (
                        <div className="border border-rule2 overflow-hidden">
                          <button type="button" onClick={() => toggleOk(cte.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-stone2/50 transition-colors text-left">
                            <CheckCircle2 size={10} strokeWidth={2} className="text-ok flex-shrink-0" />
                            <span className="font-body text-label text-muted flex-1">
                              {verified.length} KDE{verified.length !== 1 ? 's' : ''} verified
                            </span>
                            <ChevronDown size={10} strokeWidth={2} className={`text-muted transition-transform duration-150 ${isOkOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOkOpen && verified.map((kde, j) => (
                            <div key={j} className="flex items-start gap-3 px-4 py-2 border-t border-rule2/60">
                              <CheckCircle2 size={9} strokeWidth={2} className="text-ok flex-shrink-0 mt-0.5" />
                              <span className="font-body text-label text-muted w-40 flex-shrink-0">{kde.field}</span>
                              <span className="font-body text-label text-ink">{kde.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTE note */}
                      {cte.cteNote && (
                        <div className="font-body text-label text-muted leading-snug mt-2.5">
                          {cte.cteNote}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── FDA posture note ──────────────────────────────────── */}
        {lot.fdaPosture?.auditNote && (
          <div className="flex items-start gap-2 px-6 py-4 border-t border-rule2">
            <Shield size={10} strokeWidth={2} className="text-muted flex-shrink-0 mt-0.5" />
            <p className="font-body text-muted text-label leading-snug">{lot.fdaPosture.auditNote}</p>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecordVault() {
  const [selectedId, setSelectedId] = useState(traceLots[0].id)
  const selectedLot = traceLots.find(l => l.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: lot list */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-1 overflow-y-auto">
          {traceLots.map(lot => (
            <LotTraceCard key={lot.id} lot={lot}
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

      {/* Right: lot document */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        {selectedLot
          ? <LotDocument lot={selectedLot} />
          : <EmptyState message="Select a lot" sub="Choose a traceability lot code from the list" />
        }
      </div>
    </div>
  )
}
