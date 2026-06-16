import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Check, Send } from 'lucide-react'

function getElementLabel(el) {
 if (!el) return 'Element'
 const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60)
 const tag = el.tagName.toLowerCase()
 if (text) return `${tag}: "${text}"`
 const cls = el.className?.split(' ').find(c => c && !c.includes(':')) || ''
 return cls ? `${tag}.${cls}` : tag
}

function getVariantId(el) {
 let node = el
 while (node && node !== document.body) {
  if (node.dataset?.variant) return node.dataset.variant
  node = node.parentElement
 }
 return null
}

export function FeedbackOverlay({ targetName }) {
 const [mode, setMode] = useState('idle')
 const [comments, setComments] = useState([])
 const [pending, setPending] = useState(null)
 const [commentText, setCommentText] = useState('')
 const [overallDir, setOverallDir] = useState('')
 const [submitted, setSubmitted] = useState(false)
 const textareaRef = useRef(null)

 useEffect(() => {
  if (mode !== 'selecting') return
  const handleClick = (e) => {
   const variantId = getVariantId(e.target)
   if (!variantId) return
   e.preventDefault()
   e.stopPropagation()
   setPending({ variantId, label: getElementLabel(e.target) })
   setMode('commenting')
   setTimeout(() => textareaRef.current?.focus(), 60)
  }
  document.addEventListener('click', handleClick, true)
  return () => document.removeEventListener('click', handleClick, true)
 }, [mode])

 const saveComment = () => {
  if (!commentText.trim() || !pending) return
  setComments(p => [...p, { ...pending, text: commentText.trim() }])
  setCommentText('')
  setPending(null)
  setMode('selecting')
 }

 const formatFeedback = () => {
  const byVariant = {}
  comments.forEach(c => {
   if (!byVariant[c.variantId]) byVariant[c.variantId] = []
   byVariant[c.variantId].push(c)
  })
  let md = `## Design Lab Feedback\n\n**Target:** ${targetName}\n**Comments:** ${comments.length}\n\n`
  Object.entries(byVariant).sort().forEach(([v, cs]) => {
   md += `### Variant ${v}\n`
   cs.forEach((c, i) => { md += `${i + 1}. **${c.label}**\n   "${c.text}"\n\n` })
  })
  if (overallDir) md += `### Overall Direction\n${overallDir}\n`
  return md
 }

 const handleSubmit = () => {
  const md = formatFeedback()
  navigator.clipboard.writeText(md).then(() => setSubmitted(true))
 }

 if (mode === 'idle') {
  return (
   <button type="button" onClick={() => setMode('selecting')}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-signal text-stone font-body text-body font-medium shadow-raise hover:opacity-90 transition-opacity">
    <MessageSquare size={14} />
    Add Feedback{comments.length > 0 ? ` (${comments.length})` : ''}
   </button>
  )
 }

 return (
  <>
   {/* Crosshair cursor overlay when selecting */}
   {mode === 'selecting' && (
    <div className="fixed inset-0 z-40 pointer-events-none">
     <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-signal text-stone font-body text-label shadow-raise">
      Click any element in a variant to comment on it
     </div>
    </div>
   )}

   {/* Comment input popup */}
   {mode === 'commenting' && pending && (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 bg-stone/20 backdrop-blur-sm">
     <div className="w-full max-w-sm bg-stone border border-rule2 shadow-raise">
      <div className="flex items-start justify-between px-4 py-3 border-b border-rule2 bg-stone2">
       <div className="min-w-0 flex-1">
        <div className="font-body text-label text-muted">Variant {pending.variantId}</div>
        <div className="font-body text-body text-ink font-medium truncate">{pending.label}</div>
       </div>
       <button type="button" onClick={() => { setMode('selecting'); setPending(null); setCommentText('') }}
        className="text-muted hover:text-ink p-1 transition-colors flex-shrink-0 ml-2">
        <X size={14} />
       </button>
      </div>
      <div className="p-4">
       <textarea ref={textareaRef} value={commentText} onChange={e => setCommentText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveComment() }}
        rows={3} placeholder="What do you think about this element?"
        className="w-full font-body text-ink text-body bg-stone2 border border-rule2 px-3 py-2 resize-none focus:border-signal focus:outline-none placeholder:text-muted/60" />
       <div className="flex items-center justify-between mt-2">
        <span className="font-body text-muted text-label">⌘↵ to save</span>
        <button type="button" onClick={saveComment} disabled={!commentText.trim()}
         className="flex items-center gap-1.5 px-3 py-1.5 bg-signal text-stone font-body text-label disabled:opacity-40 hover:opacity-90 transition-opacity">
         <Check size={12} />Save
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* Feedback panel — shows during selecting */}
   {mode === 'selecting' && (
    <div className="fixed bottom-6 right-6 z-50 w-72 bg-stone border border-rule2 shadow-raise">
     <div className="flex items-center justify-between px-4 py-3 border-b border-rule2 bg-stone2">
      <span className="font-body font-medium text-ink text-label">
       {comments.length} comment{comments.length !== 1 ? 's' : ''}
      </span>
      <button type="button" onClick={() => setMode('idle')} className="text-muted hover:text-ink p-1 transition-colors">
       <X size={14} />
      </button>
     </div>

     <div className="max-h-48 overflow-y-auto">
      {comments.length === 0 ? (
       <div className="px-4 py-4 font-body text-muted text-label text-center">Click elements in any variant to add a comment</div>
      ) : (
       comments.map((c, i) => (
        <div key={i} className="px-4 py-2.5 border-b border-rule2 last:border-b-0">
         <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-body text-label px-1.5 py-0.5 bg-stone3 text-ink2">V{c.variantId}</span>
          <span className="font-body text-muted text-label truncate">{c.label}</span>
         </div>
         <p className="font-body text-ink text-label">{c.text}</p>
        </div>
       ))
      )}
     </div>

     <div className="p-4 border-t border-rule2">
      <textarea value={overallDir} onChange={e => { setOverallDir(e.target.value); setSubmitted(false) }}
       rows={2} placeholder="Overall direction (required to submit)"
       className="w-full font-body text-ink text-label bg-stone2 border border-rule2 px-3 py-2 resize-none focus:border-signal focus:outline-none placeholder:text-muted/60 mb-2" />
      {submitted ? (
       <div className="flex items-center gap-2 text-ok font-body text-label">
        <Check size={12} />Copied! Paste in the terminal.
       </div>
      ) : (
       <button type="button" onClick={handleSubmit} disabled={!overallDir.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 bg-signal text-stone font-body text-label font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
        <Send size={12} />Submit All Feedback
       </button>
      )}
     </div>
    </div>
   )}
  </>
 )
}
