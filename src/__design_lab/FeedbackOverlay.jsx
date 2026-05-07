import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Check } from 'lucide-react'

export default function FeedbackOverlay({ targetName }) {
  const [active, setActive] = useState(false)
  const [comments, setComments] = useState([])
  const [pending, setPending] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [overallDir, setOverallDir] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const handleClick = (e) => {
      if (e.target.closest('[data-feedback-ui]')) return
      const variantEl = e.target.closest('[data-variant]')
      const variant = variantEl?.dataset?.variant || '?'
      const el = e.target
      const desc = (el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 50)) || el.tagName.toLowerCase()
      const rect = el.getBoundingClientRect()
      setPending({
        x: Math.min(rect.left, window.innerWidth - 320),
        y: Math.min(rect.bottom + 8, window.innerHeight - 180),
        variant,
        elementDesc: desc,
      })
      setInputVal('')
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [active])

  useEffect(() => {
    if (pending && inputRef.current) inputRef.current.focus()
  }, [pending])

  const saveComment = () => {
    if (!inputVal.trim() || !pending) return
    setComments(prev => [...prev, { ...pending, text: inputVal.trim(), id: Date.now() }])
    setPending(null)
    setInputVal('')
  }

  const handleSubmit = () => {
    const byVariant = {}
    comments.forEach(c => {
      if (!byVariant[c.variant]) byVariant[c.variant] = []
      byVariant[c.variant].push(c)
    })
    const md = [
      `## Design Lab Feedback\n\n**Target:** ${targetName}\n**Comments:** ${comments.length}\n`,
      ...Object.entries(byVariant).map(([v, cs]) =>
        [`### Variant ${v}`, ...cs.map((c, i) => `${i + 1}. **"${c.elementDesc}"**\n   "${c.text}"`)].join('\n')
      ),
      overallDir ? `\n### Overall Direction\n${overallDir}` : '',
    ].join('\n\n')

    navigator.clipboard?.writeText(md).catch(() => {})
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <>
      {/* Crosshair cursor hint when active */}
      {active && (
        <style>{`* { cursor: crosshair !important; } [data-feedback-ui] * { cursor: auto !important; }`}</style>
      )}

      {/* Pending comment box */}
      {pending && (
        <div data-feedback-ui
          className="fixed z-[9999] bg-ink border border-sidebar-border shadow-xl w-72 flex flex-col"
          style={{ left: pending.x, top: pending.y }}>
          <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-sidebar-border">
            <span className="font-body text-ghost text-[10px] leading-tight flex-1">
              Variant {pending.variant} · <span className="text-ochre/80">"{pending.elementDesc}"</span>
            </span>
            <button type="button" onClick={() => setPending(null)} className="text-ghost hover:text-stone flex-shrink-0 mt-0.5">
              <X size={12} />
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveComment() }
              if (e.key === 'Escape') setPending(null)
            }}
            className="bg-sidebar border-0 text-stone font-body text-[11px] p-3 resize-none w-full outline-none placeholder-ghost/50"
            rows={3}
            placeholder="Your feedback… (Enter to save, Esc to cancel)"
          />
          <div className="flex gap-2 justify-end px-3 py-2 border-t border-sidebar-border">
            <button type="button" onClick={() => setPending(null)}
              className="font-body text-ghost text-[10px] px-2 py-1 hover:text-stone transition-colors">
              Cancel
            </button>
            <button type="button" onClick={saveComment}
              className="font-body font-medium text-[10px] px-3 py-1 bg-ochre text-ink hover:bg-ochre-light transition-colors">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Summary panel */}
      {showSummary && (
        <div data-feedback-ui className="fixed bottom-16 right-4 z-[9997] bg-ink border border-sidebar-border w-80 flex flex-col max-h-96 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border flex-shrink-0">
            <span className="font-body font-medium text-stone text-[11px]">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => setShowSummary(false)} className="text-ghost hover:text-stone transition-colors">
              <X size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-sidebar-border">
            {comments.length === 0 && (
              <div className="px-3 py-4 font-body text-ghost text-[11px] text-center">No comments yet</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="px-3 py-2.5">
                <div className="font-body text-ghost text-[10px] mb-0.5">Variant {c.variant} · {c.elementDesc}</div>
                <div className="font-body text-stone text-[11px] leading-snug">{c.text}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-sidebar-border px-3 py-3 flex flex-col gap-2 flex-shrink-0">
            <textarea
              value={overallDir}
              onChange={e => setOverallDir(e.target.value)}
              className="bg-sidebar2 border border-sidebar-border text-stone font-body text-[10px] p-2 resize-none w-full outline-none placeholder-ghost/50"
              rows={2}
              placeholder="Overall direction — which variant wins and why…"
            />
            <button type="button" onClick={handleSubmit}
              className="font-body font-medium text-[10px] px-3 py-2 bg-ochre text-ink hover:bg-ochre-light transition-colors flex items-center gap-1.5 justify-center">
              {submitted ? <><Check size={11} /> Copied — paste in terminal</> : <><Send size={11} /> Submit &amp; copy feedback</>}
            </button>
          </div>
        </div>
      )}

      {/* Bottom-right controls */}
      <div data-feedback-ui className="fixed bottom-4 right-4 z-[9997] flex items-center gap-2">
        {comments.length > 0 && (
          <button type="button" onClick={() => setShowSummary(v => !v)}
            className="font-body text-[10px] bg-ink border border-sidebar-border text-stone px-3 py-2 flex items-center gap-1.5 hover:border-ochre transition-colors">
            <MessageSquare size={12} className="text-ochre" />
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
        )}
        <button type="button"
          onClick={() => { setActive(v => !v); setPending(null) }}
          className={`font-body font-medium text-[10px] px-3 py-2 flex items-center gap-1.5 border transition-colors ${
            active
              ? 'bg-ochre text-ink border-ochre'
              : 'bg-ink text-stone border-sidebar-border hover:border-ochre'
          }`}>
          <MessageSquare size={12} />
          {active ? 'Click anything to comment' : 'Add feedback'}
        </button>
      </div>
    </>
  )
}
