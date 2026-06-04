import { Link } from 'react-router-dom'
import { integrationSummary, connectors } from '../data/integrations'
import { agentConfigData } from '../data'
import { useAppState } from '../context/AppState'

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

const DEMO_APPROVAL_IDS = new Set(['pa3-emergency', 'pa2'])

export default function TrustStrip() {
  const { agentActions, agentDecidedKeys, isDemoMode } = useAppState()

  const activeConnectors = integrationSummary.active
  const totalConnectors  = integrationSummary.total
  const { stale }        = stalePct()
  const conflictCount    = integrationSummary.activeConflicts

  const trustLevel = stale > 3 || activeConnectors < totalConnectors * 0.5
    ? 'degraded'
    : stale > 0 || conflictCount > 0
      ? 'partial'
      : 'full'

  const trustCfg = {
    full:     { label: 'Trust: Full',     strip: 'bg-ok/[0.06] border-ok/20',         text: 'text-ok',     dot: 'bg-ok'     },
    partial:  { label: 'Trust: Partial',  strip: 'bg-warn/[0.06] border-warn/20',     text: 'text-warn',   dot: 'bg-warn'   },
    degraded: { label: 'Trust: Degraded', strip: 'bg-danger/[0.04] border-danger/20', text: 'text-danger', dot: 'bg-danger' },
  }
  const cfg = trustCfg[trustLevel]

  const pendingApprovals = (agentConfigData.agents ?? []).reduce((n, agent) => {
    if (!agent.isComplianceCategory && !agent.isEmergencyCategory) return n
    const actions = (agent.pendingActions ?? []).filter((pa, idx) => {
      if (isDemoMode && !DEMO_APPROVAL_IDS.has(pa.id)) return false
      return !agentDecidedKeys?.has(`${agent.id}:${idx}`)
    })
    return n + actions.length
  }, 0)

  const activeAgents = (agentActions ?? []).filter(a => a.status !== 'overridden')
  const lastAgent    = activeAgents[0]

  return (
    <div className={`flex-shrink-0 flex items-center gap-4 px-5 py-1.5 border-b ${cfg.strip}`} role="status" aria-label="Platform trust state">

      {/* Trust level */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="relative flex h-1.5 w-1.5">
          {trustLevel === 'full' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
        </div>
        <span className={`font-body font-medium text-label ${cfg.text}`}>{cfg.label}</span>
      </div>

      <div className="h-3 w-px bg-rule flex-shrink-0" />

      {/* Agent activity */}
      {activeAgents.length > 0 && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 live-dot" style={{ background: 'var(--color-deep)' }} />
          <span className="font-body text-label" style={{ color: 'var(--color-deep)' }}>
            {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} active
          </span>
          {lastAgent && (
            <span className="font-body text-label text-muted hidden xl:inline truncate max-w-[280px]">
              · {lastAgent.agentName}: {lastAgent.action}
            </span>
          )}
        </div>
      )}

      {/* Pending approvals */}
      {pendingApprovals > 0 && (
        <Link to="/agents" className="flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 border border-danger/30 bg-danger/[0.06] hover:bg-danger/10 transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
          <span className="font-body font-medium text-danger text-label">{pendingApprovals} awaiting approval</span>
        </Link>
      )}

      {/* Signal count — far right */}
      <div className="ml-auto font-body text-muted text-label flex-shrink-0">
        {integrationSummary.totalSignals.toLocaleString()} signals · {integrationSummary.streamingSources} streaming
      </div>
    </div>
  )
}
