import { useLocation } from 'react-router-dom'
import { integrationSummary, connectors } from '../data/integrations'
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import { useAppState } from '../context/AppState'

// Data imports for per-page cells
import { shiftData, supplierData, readinessData, goalsData, agentConfigData, operatorContextData } from '../data'
import { openCases, benchmarks } from '../data/capa.js'
import { batchSummary } from '../data/batches.js'
import { compliancePolicies } from '../data/compliance.js'
import { equipment } from '../data/equipment.js'
import { executionSummary } from '../data/execution.js'
import { interventionSummary } from '../data/interventions.js'
import { processHierarchy } from '../data/hierarchy.js'
import { batchRecords, deviations } from '../data/records.js'
import { deliverySummary } from '../data/delivery.js'
import { knowledgeEntries, processMemory } from '../data/knowledge.js'

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

function scoreTone(v, lo = 60, hi = 80) {
  return v >= hi ? 'ok' : v >= lo ? 'warn' : 'danger'
}
function countTone(v, warnAt = 1, dangerAt = 3) {
  return v === 0 ? 'ok' : v < dangerAt ? 'warn' : 'danger'
}
function daysTone(d) {
  return d >= 30 ? 'muted' : d >= 14 ? 'warn' : 'danger'
}

function buildPageCells(pathname, { closedCases, nearMisses, activityLog }) {
  const { stale } = stalePct()
  const activeConnectors = integrationSummary.active
  const totalConnectors = integrationSummary.total

  switch (pathname) {
    case '/overview': {
      const lines = shiftData.lines || []
      const atRisk = lines.filter(l => l.score < 60).length
      const findings = shiftData.stats?.find(s => s.label?.toLowerCase().includes('finding'))?.value ?? '—'
      return [
        { label: 'Lines at risk', value: String(atRisk), tone: countTone(atRisk) },
        { label: 'Line 4', value: String(shiftData.score), tone: scoreTone(shiftData.score) },
        { label: 'Line 6', value: String(shiftData.lines?.find(l => l.id === 'l6')?.score ?? 42), tone: scoreTone(shiftData.lines?.find(l => l.id === 'l6')?.score ?? 42) },
        { label: 'Confidence', value: `${shiftData.confidence}%`, tone: scoreTone(shiftData.confidence) },
      ]
    }
    case '/shift': {
      const checklist = shiftData.stats?.find(s => s.label?.toLowerCase().includes('checklist'))
      const oee = shiftData.stats?.find(s => s.label?.toLowerCase().includes('oee'))
      return [
        { label: 'Score', value: String(shiftData.score), tone: scoreTone(shiftData.score) },
        { label: 'Confidence', value: `${shiftData.confidence}%`, tone: scoreTone(shiftData.confidence) },
        { label: 'Checklist', value: checklist?.sub?.split(' ').slice(0, 3).join(' ') ?? '—', tone: checklist?.tone ?? 'muted' },
        { label: 'OEE', value: oee?.value ?? '82%', tone: scoreTone(82) },
      ]
    }
    case '/supplier': {
      const blocking = supplierData.lots?.filter(l => l.coaTone === 'danger').length ?? 0
      const delivered = supplierData.lots?.filter(l => l.deliveryTone === 'ok').length ?? 0
      const total = supplierData.lots?.length ?? 5
      return [
        { label: 'COA missing', value: String(blocking), tone: countTone(blocking) },
        { label: 'Deliveries', value: `${delivered}/${total}`, tone: delivered === total ? 'ok' : delivered >= total * 0.8 ? 'warn' : 'danger' },
        { label: 'FDA', value: '18d', tone: daysTone(18) },
        { label: 'Suppliers', value: `${supplierData.suppliers?.length ?? 5}`, tone: 'muted' },
      ]
    }
    case '/capa': {
      const allCases = openCases.filter(c => !closedCases.includes(c.id))
      const overdue = allCases.filter(c => c.badge === 'Overdue').length
      return [
        { label: 'Open', value: String(allCases.length), tone: countTone(allCases.length, 1, 4) },
        { label: 'Overdue', value: String(overdue), tone: countTone(overdue) },
        { label: 'FDA', value: '18d', tone: daysTone(18) },
        { label: 'Closed', value: String(14 + closedCases.length), tone: 'ok' },
      ]
    }
    case '/readiness': {
      const score = readinessData.score
      const conflicts = readinessData.stats?.find(s => s.label?.toLowerCase().includes('conflict'))
      const gaps = readinessData.stats?.find(s => s.label?.toLowerCase().includes('gap'))
      return [
        { label: 'Readiness', value: `${score}%`, tone: scoreTone(score) },
        { label: 'Conflicts', value: conflicts?.value ?? '2', tone: countTone(parseInt(conflicts?.value ?? '2')) },
        { label: 'Context gaps', value: gaps?.value ?? '1', tone: countTone(parseInt(gaps?.value ?? '1')) },
        { label: 'Sources', value: readinessData.stats?.find(s => s.label?.toLowerCase().includes('source'))?.value ?? '5/5', tone: 'ok' },
      ]
    }
    case '/analytics': {
      const oeeGoal = goalsData.find(g => g.label?.includes('OEE'))
      const capaGoal = goalsData.find(g => g.label?.includes('closure'))
      const capaRank = benchmarks.find(b => b.metric?.includes('CAPA'))
      return [
        { label: 'OEE', value: oeeGoal ? `${oeeGoal.current}%` : '82%', tone: scoreTone(oeeGoal?.current ?? 82) },
        { label: 'CAPA closure', value: capaGoal ? `${capaGoal.current}%` : '78%', tone: scoreTone(capaGoal?.current ?? 78) },
        { label: 'Network rank', value: capaRank ? `${capaRank.rank}th pct.` : '44th pct.', tone: scoreTone(capaRank?.rank ?? 44) },
        { label: 'Goals', value: `${goalsData.filter(g => (g.direction === 'increase' ? g.current >= g.target : g.current <= g.target)).length}/${goalsData.length}`, tone: 'warn' },
      ]
    }
    case '/batch': {
      const holds = batchSummary.atRisk ?? 0
      return [
        { label: 'Active', value: String(batchSummary.active), tone: 'ok' },
        { label: 'Holds', value: String(holds), tone: countTone(holds) },
        { label: 'Confidence', value: `${batchSummary.avgConfidence}%`, tone: scoreTone(batchSummary.avgConfidence) },
        { label: 'Complete', value: String(batchSummary.complete), tone: 'muted' },
      ]
    }
    case '/compliance': {
      const active = compliancePolicies.filter(p => p.status === 'active').length
      const gaps = compliancePolicies.flatMap(p => p.evidenceRequirements ?? []).filter(r => r.required && !r.status).length
      return [
        { label: 'Active frameworks', value: String(active), tone: 'ok' },
        { label: 'Evidence gaps', value: String(gaps), tone: countTone(gaps) },
        { label: 'Jurisdictions', value: String(compliancePolicies.length), tone: 'muted' },
      ]
    }
    case '/equipment': {
      const active = equipment.filter(e => e.status === 'active').length
      const alerts = equipment.filter(e => e.spcStatus === 'warning' || e.spcStatus === 'out-of-control').length
      const avgHealth = Math.round(equipment.reduce((s, e) => s + (e.healthScore ?? 0), 0) / equipment.length)
      return [
        { label: 'Active', value: String(active), tone: 'ok' },
        { label: 'SPC alerts', value: String(alerts), tone: countTone(alerts) },
        { label: 'Avg health', value: `${avgHealth}%`, tone: scoreTone(avgHealth) },
      ]
    }
    case '/execution': {
      const overrides = Math.round(executionSummary.rollbackRate * executionSummary.totalActions)
      return [
        { label: 'Actions today', value: String(executionSummary.actionsToday), tone: 'muted' },
        { label: 'Success rate', value: `${Math.round(executionSummary.successRate * 100)}%`, tone: scoreTone(Math.round(executionSummary.successRate * 100)) },
        { label: 'Overrides', value: String(overrides), tone: countTone(overrides) },
        { label: 'Execute tier', value: String(executionSummary.agentsInExecuteTier), tone: 'muted' },
      ]
    }
    case '/outcomes': {
      return [
        { label: 'Interventions', value: String(interventionSummary.total), tone: 'muted' },
        { label: 'Positive', value: String(interventionSummary.positive), tone: interventionSummary.positive > 0 ? 'ok' : 'muted' },
        { label: 'Reversed', value: String(interventionSummary.reversed), tone: countTone(interventionSummary.reversed) },
        { label: 'Confidence', value: `${Math.round(interventionSummary.avgAttributionConfidence * 100)}%`, tone: scoreTone(Math.round(interventionSummary.avgAttributionConfidence * 100)) },
      ]
    }
    case '/hierarchy': {
      const site = processHierarchy.site
      return [
        { label: 'Score', value: String(site.score), tone: scoreTone(site.score) },
        { label: 'Active batches', value: String(site.activeBatches), tone: 'ok' },
        { label: 'Vessels', value: String(site.vessels), tone: 'muted' },
        { label: 'Workers', value: String(site.workers), tone: 'muted' },
      ]
    }
    case '/integration': {
      return [
        { label: 'Connectors', value: `${activeConnectors}/${totalConnectors}`, tone: activeConnectors >= totalConnectors * 0.8 ? 'ok' : 'warn' },
        { label: 'Stale', value: String(stale), tone: countTone(stale) },
        { label: 'Conflicts', value: String(integrationSummary.activeConflicts), tone: countTone(integrationSummary.activeConflicts) },
      ]
    }
    case '/records': {
      const open = batchRecords.filter(r => r.status === 'in-progress').length
      const devCount = deviations.length
      return [
        { label: 'Records', value: String(batchRecords.length), tone: 'muted' },
        { label: 'In progress', value: String(open), tone: open > 0 ? 'warn' : 'ok' },
        { label: 'Deviations', value: String(devCount), tone: countTone(devCount, 1, 3) },
      ]
    }
    case '/delivery': {
      return [
        { label: 'On-time', value: `${deliverySummary.otd}%`, tone: scoreTone(deliverySummary.otd, 80, 90) },
        { label: 'Open orders', value: String(deliverySummary.openOrders), tone: 'muted' },
        { label: 'Late', value: String(deliverySummary.lateOrders), tone: countTone(deliverySummary.lateOrders, 5, 20) },
        { label: 'Carbon/unit', value: `${deliverySummary.carbonPerUnit}`, tone: deliverySummary.carbonPerUnit <= deliverySummary.carbonTarget ? 'ok' : 'warn' },
      ]
    }
    case '/knowledge': {
      return [
        { label: 'Entries', value: String(knowledgeEntries.length), tone: 'muted' },
        { label: 'Process memory', value: String(processMemory.length), tone: 'muted' },
      ]
    }
    case '/agents': {
      const enabledCount = agentConfigData.agents?.filter(a => a.enabled).length ?? 0
      const totalAgents = agentConfigData.agents?.length ?? 0
      return [
        { label: 'Agents active', value: `${enabledCount}/${totalAgents}`, tone: enabledCount === totalAgents ? 'ok' : 'warn' },
        { label: 'Execute tier', value: String(executionSummary.agentsInExecuteTier), tone: 'muted' },
        { label: 'Success rate', value: `${Math.round(executionSummary.successRate * 100)}%`, tone: scoreTone(Math.round(executionSummary.successRate * 100)) },
      ]
    }
    case '/notifications': {
      const alertCount = activityLog?.length ?? 0
      const missCount = nearMisses?.length ?? 0
      return [
        { label: 'Activity', value: String(alertCount), tone: alertCount > 0 ? 'warn' : 'ok' },
        { label: 'Near misses', value: String(missCount), tone: countTone(missCount) },
      ]
    }
    case '/operator': {
      const ctx = Object.values(operatorContextData)[0]
      return [
        { label: 'Mode', value: ctx?.modeLabel?.split(' ')[0] ?? '—', tone: ctx?.guidanceLevel === 'high' ? 'danger' : 'warn' },
        { label: 'Station', value: ctx?.station ?? '—', tone: 'muted' },
        { label: 'Directive by', value: ctx?.directiveDeadline ?? '—', tone: 'warn' },
      ]
    }
    default: {
      // Fallback: connector health
      return [
        { label: 'Connectors', value: `${activeConnectors}/${totalConnectors}`, tone: activeConnectors >= totalConnectors * 0.8 ? 'ok' : 'warn' },
        ...(stale > 0 ? [{ label: 'Stale', value: String(stale), tone: 'warn' }] : []),
        ...(integrationSummary.activeConflicts > 0 ? [{ label: 'Conflicts', value: String(integrationSummary.activeConflicts), tone: 'warn' }] : []),
      ]
    }
  }
}

const TONE_CLS = {
  ok:     'text-ok',
  warn:   'text-warn',
  danger: 'text-danger',
  muted:  'text-muted',
}

export default function TrustStrip() {
  const { pathname } = useLocation()
  const { closedCases, nearMisses, activityLog } = useAppState()

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
    full:     { label: 'Trust: Full',     strip: 'bg-ok/[0.06] border-ok/20',          text: 'text-ok',     dot: 'bg-ok' },
    partial:  { label: 'Trust: Partial',  strip: 'bg-warn/[0.06] border-warn/20',      text: 'text-warn',   dot: 'bg-warn' },
    degraded: { label: 'Trust: Degraded', strip: 'bg-danger/[0.04] border-danger/20',  text: 'text-danger', dot: 'bg-danger' },
  }

  const cfg = trustCfg[trustLevel]
  const cells = buildPageCells(pathname, { closedCases: closedCases ?? [], nearMisses: nearMisses ?? [], activityLog: activityLog ?? [] })

  return (
    <div className={`flex-shrink-0 flex items-center gap-5 px-5 py-1.5 border-b ${cfg.strip}`} role="status" aria-label="Platform trust state">
      {/* Trust level — always visible */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="relative flex h-1.5 w-1.5">
          {trustLevel === 'full' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-40" />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
        </div>
        <span className={`font-body font-medium text-label ${cfg.text}`}>{cfg.label}</span>
      </div>

      {/* Divider */}
      <div className="h-3 w-px bg-rule flex-shrink-0" />

      {/* Page-specific cells */}
      {cells.map((cell, i) => (
        <div key={cell.label} className="flex items-center gap-1.5 flex-shrink-0">
          {i > 0 && <span className="text-muted text-label">·</span>}
          <span className="font-body text-label text-muted">{cell.label}</span>
          <span className={`font-body font-medium text-label ${TONE_CLS[cell.tone] ?? 'text-muted'}`}>{cell.value}</span>
        </div>
      ))}

      {/* Right side — total signals */}
      <div className="ml-auto font-body text-muted text-label flex-shrink-0">
        {integrationSummary.totalSignals.toLocaleString()} signals · {integrationSummary.streamingSources} streaming
      </div>
    </div>
  )
}
