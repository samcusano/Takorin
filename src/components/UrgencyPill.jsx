import React from 'react'

const VARIANTS = {
  critical: 'bg-danger/10 text-danger',
  warn:     'bg-warn/10 text-warn',
  ok:       'bg-ok/10 text-ok',
  info:     'bg-takorin-stone-3 text-takorin-muted',
}

export default function UrgencyPill({ variant = 'info', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-body font-medium ${VARIANTS[variant]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {children}
    </span>
  )
}
