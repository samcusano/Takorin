import { useEffect, useRef } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AgentControl from '../screens/AgentControl'
import { useFocusTrap } from '../lib/utils'

export default function AgentControlPanel({ open, onClose }) {
  const panelRef = useRef(null)
  const navigate = useNavigate()

  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from the right, full height, sits over the main content */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 bottom-0 z-50 w-[680px] flex flex-col bg-stone border-l border-rule2 shadow-raise slide-in"
        role="dialog"
        aria-label="Agent Control — pending decisions"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-rule2 bg-stone2">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-ink text-[15px]">Agent Control</span>
            <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Pending decisions</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { navigate('/agents'); onClose() }}
              className="flex items-center gap-1.5 font-body text-ghost text-[10px] hover:text-ink transition-colors px-2 py-1"
            >
              <ExternalLink size={11} strokeWidth={2} />
              Full view
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 text-ghost hover:text-ink transition-colors"
              aria-label="Close panel"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* AgentControl content — fills the rest of the panel */}
        <div className="flex-1 overflow-hidden">
          <AgentControl />
        </div>
      </div>
    </>
  )
}
