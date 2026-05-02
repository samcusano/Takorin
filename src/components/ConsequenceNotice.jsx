import React from 'react'
import { Check } from 'lucide-react'

export default function ConsequenceNotice({ message, visible }) {
  if (!visible) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-ok/10 border-t border-ok/20 text-ok text-xs italic font-body consequence-enter">
      <Check className="w-3 h-3 flex-shrink-0" />
      {message}
    </div>
  )
}
