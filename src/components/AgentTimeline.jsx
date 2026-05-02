import React from 'react'

const DOT_COLORS = {
  now:  'bg-danger',
  warn: 'bg-warn',
  ok:   'bg-ok',
  idle: 'bg-takorin-ghost',
}

function SparkBar({ height, active, title }) {
  return (
    <div
      title={title}
      className={`spark-bar ${active ? 'bg-takorin-ochre' : 'bg-takorin-rule'}`}
      style={{ height }}
    />
  )
}

export default function AgentTimeline({ events, sparkData }) {
  return (
    <div className="border-t border-takorin-rule">
      {/* Score sparkline */}
      {sparkData && (
        <div className="flex items-end gap-0.5 px-3 py-2.5 border-b border-takorin-rule">
          {sparkData.map((d, i) => (
            <SparkBar
              key={i}
              height={d.height}
              active={i === sparkData.length - 1}
              title={d.label}
            />
          ))}
          <span className="font-body text-[9px] italic text-takorin-ghost ml-2 self-center whitespace-nowrap">
            Risk score trajectory
          </span>
        </div>
      )}
      {/* Timeline events */}
      {events.map((ev, i) => (
        <div key={i} className="flex gap-2.5 px-3 py-2 border-b border-takorin-rule last:border-0">
          <div className="font-body text-[10px] italic text-takorin-ghost w-11 flex-shrink-0 mt-1">
            {ev.time}
          </div>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${DOT_COLORS[ev.dotType] || DOT_COLORS.idle}`} />
          <div className="flex-1 min-w-0">
            <p
              className="font-body text-[11px] text-takorin-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: ev.text }}
            />
            {ev.delta && (
              <span className={`font-display text-xs font-bold italic ${ev.deltaColor || 'text-takorin-ghost'}`}>
                {ev.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
