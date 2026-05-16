import { integrationSummary, connectors } from '../data/integrations'
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react'

const STALE_THRESHOLD_MIN = 60

function stalePct() {
  const active = connectors.filter(c => c.status === 'active')
  const stale = active.filter(c => {
    if (!c.lastSync) return false
    const parts = c.lastSync.match(/(\d+)s|(\d+)m|(\d+)h/)
    if (!parts) return false
    const mins = parts[3] ? parseInt(parts[3]) * 60 : parts[2] ? parseInt(parts[2]) : (parts[1] ? parseInt(parts[1]) / 60 : 0)
    return mins > STALE_THRESHOLD_MIN
  })
  return { stale: stale.length, total: active.length }
}

export default function TrustStrip() {
  const activeConnectors = integrationSummary.active
  const totalConnectors = integrationSummary.total
  const { stale, total: activeCount } = stalePct()
  const conflictCount = integrationSummary.activeConflicts

  const trustLevel = stale > 3 || activeConnectors < totalConnectors * 0.5
    ? 'degraded'
    : stale > 0 || conflictCount > 0
      ? 'partial'
      : 'full'

  const trustCfg = {
    full:     { label: 'Trust: Full',     strip: 'bg-ok/[0.06] border-ok/20',     text: 'text-ok',   dot: 'bg-ok' },
    partial:  { label: 'Trust: Partial',  strip: 'bg-warn/[0.06] border-warn/20', text: 'text-warn', dot: 'bg-warn' },
    degraded: { label: 'Trust: Degraded', strip: 'bg-danger/[0.06] border-danger/20', text: 'text-danger', dot: 'bg-danger' },
  }

  const cfg = trustCfg[trustLevel]

  return (
    <div className={`flex-shrink-0 flex items-center gap-4 px-5 py-1.5 border-b ${cfg.strip}`} role="status" aria-label="Platform trust state">
      {/* Trust level */}
      <div className="flex items-center gap-1.5">
        <div className={`relative flex h-1.5 w-1.5`}>
          {trustLevel === 'full' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
        </div>
        <span className={`font-body font-medium text-[9px] uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
      </div>

      <div className="w-px h-3 bg-rule2 flex-shrink-0" />

      {/* Connector health */}
      <div className="flex items-center gap-1.5">
        {activeConnectors >= totalConnectors * 0.8 ? (
          <Wifi size={9} className="text-ok" strokeWidth={2} />
        ) : (
          <WifiOff size={9} className="text-warn" strokeWidth={2} />
        )}
        <span className="font-body text-ghost text-[9px]">
          <span className={activeConnectors >= totalConnectors * 0.8 ? 'text-ok' : 'text-warn'}>{activeConnectors}</span>
          <span className="text-ghost">/{totalConnectors} connectors</span>
        </span>
      </div>

      {/* Stale integrations */}
      {stale > 0 && (
        <>
          <div className="w-px h-3 bg-rule2 flex-shrink-0" />
          <div className="flex items-center gap-1">
            <AlertTriangle size={9} className="text-warn" strokeWidth={2} />
            <span className="font-body text-warn text-[9px]">{stale} stale signal{stale > 1 ? 's' : ''}</span>
          </div>
        </>
      )}

      {/* Semantic conflicts */}
      {conflictCount > 0 && (
        <>
          <div className="w-px h-3 bg-rule2 flex-shrink-0" />
          <span className="font-body text-warn text-[9px]">{conflictCount} semantic conflict{conflictCount > 1 ? 's' : ''}</span>
        </>
      )}

      {/* Degraded mode notice */}
      {trustLevel === 'degraded' && (
        <>
          <div className="w-px h-3 bg-rule2 flex-shrink-0" />
          <span className="font-body text-danger text-[9px] font-medium">AI recommendations may reflect incomplete data</span>
        </>
      )}

      <div className="ml-auto font-body text-ghost text-[9px]">
        {integrationSummary.totalSignals.toLocaleString()} signals · {integrationSummary.streamingSources} streaming
      </div>
    </div>
  )
}
