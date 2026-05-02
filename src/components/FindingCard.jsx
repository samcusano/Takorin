import React, { useState } from 'react'
import { UserCheck, XCircle } from 'lucide-react'
import ConsequenceNotice from './ConsequenceNotice.jsx'

const BORDER = {
  cu: 'border-l-danger',
  cw: 'border-l-warn',
  co: 'border-l-ok',
  ca: 'border-l-warn',
}

const DISMISS_REASONS = [
  'Already handled by outgoing supervisor',
  'Not applicable — SKU change in progress',
  'Assessment is incorrect — signal is a false positive',
  'Will address at next natural break point',
]

export default function FindingCard({
  id, type = 'cu', ordinal, title, description, evidence,
  primaryLabel, primaryAction, secondaryLabel,
  consequenceMessage,
}) {
  const [ackState, setAckState] = useState('idle') // idle | actioning | dismissing | dismissed
  const [showDismissForm, setShowDismissForm] = useState(false)
  const [dismissReason, setDismissReason] = useState('')
  const [actioned, setActioned] = useState(false)
  const [showConsequence, setShowConsequence] = useState(false)

  function handlePrimary() {
    setActioned(true)
    setShowConsequence(true)
    setAckState('actioning')
    if (primaryAction) primaryAction()
  }

  function handleActioning() {
    setAckState('actioning')
  }

  function handleDismiss() {
    setShowDismissForm(true)
  }

  function confirmDismiss() {
    setAckState('dismissed')
    setShowDismissForm(false)
  }

  return (
    <div
      id={id}
      className={`
        relative border-l-2 ${BORDER[type]}
        ${ackState === 'dismissed' ? 'opacity-55' : ''}
        ${type === 'cu' ? 'bg-danger/[0.02]' : ''}
        ${type === 'cw' ? 'bg-warn/[0.02]' : ''}
        transition-opacity
      `}
    >
      <div className="grid grid-cols-[28px_1fr] gap-3 p-4">
        {/* Ordinal */}
        <div className="font-display text-base font-black italic text-takorin-ghost pt-0.5 select-none">
          {ordinal}
        </div>
        {/* Body */}
        <div className="min-w-0">
          <h3 className="font-body text-sm font-medium text-takorin-ink mb-1.5 leading-snug">
            {title}
          </h3>
          <p className="font-body text-xs text-takorin-muted italic leading-relaxed mb-2">
            {description}
          </p>
          {evidence && (
            <p className="font-body text-xs text-takorin-ghost italic mb-3">
              {evidence}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {!actioned ? (
              <>
                <button onClick={handlePrimary} className="font-body font-medium text-[11px] px-3 py-1.5 bg-ink text-stone hover:opacity-90 transition-opacity">
                  {primaryLabel}
                </button>
                {secondaryLabel && (
                  <button className="font-body font-medium text-[11px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors">{secondaryLabel}</button>
                )}
              </>
            ) : (
              <span className="font-body text-xs italic text-ok">
                ✓ {primaryLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Consequence notice */}
      <ConsequenceNotice show={showConsequence}>
        {consequenceMessage || `${primaryLabel} logged — agent rescans in 4 min`}
      </ConsequenceNotice>

      {/* Acknowledgment row */}
      {ackState !== 'dismissed' && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-takorin-stone-2 border-t border-takorin-rule">
          <span className="font-body text-[10px] italic text-takorin-ghost flex-shrink-0">
            Your response:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={handleActioning}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-body font-medium transition-colors ${
                ackState === 'actioning'
                  ? 'bg-ok/10 text-ok'
                  : 'bg-takorin-stone-3 text-takorin-muted hover:bg-takorin-stone-4'
              }`}
            >
              <UserCheck className="w-2.5 h-2.5" />
              Actioning
            </button>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-body font-medium bg-takorin-stone-3 text-takorin-muted hover:bg-takorin-stone-4 transition-colors"
            >
              <XCircle className="w-2.5 h-2.5" />
              Dismiss
            </button>
          </div>
          {showDismissForm && (
            <div className="flex gap-2 items-center w-full mt-2 pt-2 border-t border-takorin-rule">
              <select
                value={dismissReason}
                onChange={e => setDismissReason(e.target.value)}
                className="flex-1 text-[11px] font-body italic bg-takorin-stone text-takorin-muted px-2 py-1.5 border border-takorin-rule focus:outline-none focus:border-takorin-ochre"
              >
                <option value="">Reason for dismissing…</option>
                {DISMISS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={confirmDismiss} className="font-body font-medium text-[10px] px-3 py-1.5 bg-stone3 text-muted hover:bg-stone2 transition-colors">
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
      {ackState === 'dismissed' && (
        <div className="px-4 py-2 bg-danger/5 border-t border-takorin-rule">
          <span className="font-body text-[10px] italic text-danger">
            Dismissed{dismissReason ? `: ${dismissReason}` : ' — no reason logged'} · recorded
          </span>
        </div>
      )}
    </div>
  )
}
