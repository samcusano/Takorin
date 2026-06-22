import { useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { useFocusTrap, useExitAnimation } from '../lib/utils'
import { SITUATIONS } from '../data/situations'

const URGENCY_DOT = {
  danger: 'bg-danger',
  warn:   'bg-warn',
  ok:     'bg-ok',
}

const URGENCY_ACCENT = {
  danger: 'var(--color-danger)',
  warn:   'var(--color-warn)',
  ok:     'var(--color-ok)',
}

const URGENCY_LABEL = {
  danger: 'Critical',
  warn:   'Watch',
  ok:     'Info',
}

function ThreadRow({ thread, resolved, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(thread.route)}
      className="w-full text-left border border-rule2 hover:border-ink/20 transition-colors bg-stone2 hover:bg-stone3 group"
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {resolved
              ? <CheckCircle2 size={14} strokeWidth={2} className="text-ok" />
              : <Circle size={14} strokeWidth={1.5} className="text-muted/40" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-label text-muted">{thread.domain}</span>
              <ArrowRight size={11} strokeWidth={2} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
            </div>
            <div className={`font-body font-medium text-body mt-0.5 ${resolved ? 'text-muted line-through' : 'text-ink'}`}>
              {thread.label}
            </div>
            <div className="font-body text-label text-muted mt-1 leading-relaxed">
              {thread.note}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function SituationPanelInner({ situation, onClose }) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const { exiting, exit } = useExitAnimation(200)
  const appState = useAppState()
  useFocusTrap(panelRef, true)

  const handleClose = useCallback(() => exit(onClose), [exit, onClose])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleClose])

  const handleNavigate = useCallback((route) => {
    handleClose()
    setTimeout(() => navigate(route), 220)
  }, [handleClose, navigate])

  const isResolved = situation.resolvedWhen(appState)
  const accentColor = URGENCY_ACCENT[situation.urgency]

  const resolvedCount = situation.threads.filter(t =>
    t.resolvedKey && appState.agentDecidedKeys?.has(t.resolvedKey)
  ).length

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={situation.name}
        className={`fixed top-0 right-0 bottom-0 w-full border-l border-rule z-50 flex flex-col shadow-raise ${exiting ? 'slide-right-out' : 'slide-right'}`}
        style={{ maxWidth: 420, background: 'var(--color-stone-2)' }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 border-b border-rule"
          style={{ background: 'var(--color-stone-3)', borderTop: `2px solid ${accentColor}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${URGENCY_DOT[situation.urgency]}`} />
              <div className="min-w-0">
                <div className="font-body text-label text-muted mb-0.5">
                  {URGENCY_LABEL[situation.urgency]} · {situation.timeLabel}
                </div>
                <div className="font-display font-bold text-ink text-sub leading-snug">
                  {situation.name}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close situation panel"
              className="p-1 text-muted hover:text-ink transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary */}
          <div className="px-5 py-4 border-b border-rule2">
            <p className="font-body text-muted text-body leading-relaxed">{situation.summary}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="font-body text-label text-muted">
                {resolvedCount} of {situation.threads.length} threads addressed
              </span>
              {isResolved && (
                <span className="font-body text-label text-ok font-medium">· Situation resolved</span>
              )}
            </div>
          </div>

          {/* Threads */}
          <div className="px-5 py-4">
            <div className="font-body text-label text-muted mb-3">Open threads</div>
            <div className="space-y-2">
              {situation.threads.map(thread => {
                const resolved = thread.resolvedKey
                  ? !!appState.agentDecidedKeys?.has(thread.resolvedKey)
                  : false
                return (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    resolved={resolved}
                    onNavigate={handleNavigate}
                  />
                )
              })}
            </div>
          </div>

          {/* Resolved state */}
          {isResolved && (
            <div className="mx-5 mb-4 px-4 py-3 border border-ok/30 bg-ok/[0.04] border-l-[3px] border-l-ok">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} strokeWidth={2} className="text-ok flex-shrink-0" />
                <span className="font-body text-ok text-label font-medium">
                  All tracked decisions resolved — situation closed.
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default function SituationPanel({ situationId, onClose }) {
  const situation = SITUATIONS.find(s => s.id === situationId)
  if (!situation) return null
  return createPortal(
    <SituationPanelInner situation={situation} onClose={onClose} />,
    document.body
  )
}
