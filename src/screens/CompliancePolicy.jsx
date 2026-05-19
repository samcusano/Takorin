// Shift 2: Policy-based compliance engine
// Compliance is a configurable policy layer, not hardcoded US screens.

import { useState } from 'react'
import { compliancePolicies, multiRegulatoryCoverage } from '../data/compliance'
import { CheckCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { StatusPill } from '../components/UI'

const STATUS_TONE = { active: 'ok', inactive: 'muted', monitoring: 'int' }
const STATUS_LABEL = { active: 'Active', inactive: 'Inactive', monitoring: 'Monitoring' }

function FrameworkRow({ f }) {
  const statusColor = f.status === 'active' ? 'text-ok' : f.status === 'monitoring' ? 'text-ochre' : 'text-muted'
  const dot = f.status === 'active' ? 'bg-ok' : f.status === 'monitoring' ? 'bg-ochre' : 'bg-rule2'
  return (
    <div className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-body">{f.name}</span>
          <span className="font-body text-muted text-label">{f.code}</span>
        </div>
        <div className="font-body text-muted text-label mt-0.5 leading-snug">{f.description}</div>
      </div>
      <span className={`font-body text-label flex-shrink-0 ${statusColor}`}>{f.status}</span>
    </div>
  )
}

function EvidenceRow({ e }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className="flex-1">
        <span className="font-body text-ink text-body">{e.domain}</span>
      </div>
      <span className="font-body text-muted text-label flex-1">{e.requirement}</span>
      {e.required
        ? <CheckCircle size={11} className="text-ok flex-shrink-0" strokeWidth={2} />
        : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
      }
    </div>
  )
}

function EscalationFlow({ steps }) {
  return (
    <div className="space-y-0 divide-y divide-rule2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-2.5">
          <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 rounded-full bg-stone3 flex items-center justify-center">
              <span className="font-body text-muted text-label">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <div className="w-px h-4 bg-rule2 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="font-body font-medium text-ink text-label">{s.threshold}</div>
            <div className="font-body text-muted text-label mt-0.5">{s.action}</div>
            <div className="font-body text-muted text-label mt-0.5">{s.channel}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CompliancePolicy() {
  const [selectedId, setSelectedId] = useState('fda-us')
  const policy = compliancePolicies.find(p => p.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* ── Left: policy list ───────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-muted text-label tracking-normal mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-head leading-none">Compliance Engine</div>
          <div className="font-body text-muted text-label mt-1.5 leading-relaxed">
            Policy is configurable. Swap regulatory frameworks without rebuilding the product.
          </div>
        </div>

        {/* Multi-regulatory coverage */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-warn/[0.04]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="font-body font-medium text-warn text-label">Coverage gap detected</div>
              <div className="font-body text-muted text-label mt-0.5 leading-snug">{multiRegulatoryCoverage.coverageGap}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {compliancePolicies.map(p => (
            <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-4 py-3.5 transition-colors ${
                selectedId === p.id ? 'bg-stone2' : 'hover:bg-stone2/50'
              }`}>
              <div className="mb-1.5">
                <StatusPill tone={STATUS_TONE[p.status] ?? 'muted'}>{STATUS_LABEL[p.status] ?? p.status}</StatusPill>
              </div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-display font-medium text-ink text-section leading-snug">{p.name}</span>
              </div>
              <div className="font-body text-muted text-label mb-2">{p.jurisdiction}</div>
              <div className="flex items-center gap-2">
                <span className="font-body text-muted text-label">{p.frameworks.length} frameworks</span>
                {p.openItems.capaCount > 0 && (
                  <span className="font-body text-warn text-label">· {p.openItems.capaCount} open CAPAs</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Export markets */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="font-body text-muted text-label tracking-normal mb-1.5">Export markets</div>
          <div className="flex flex-wrap gap-1">
            {multiRegulatoryCoverage.currentExportMarkets.map(m => (
              <span key={m} className="font-body text-muted text-label bg-stone3 px-1.5 py-0.5">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: policy workspace ─────────────────────────────── */}
      {policy && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Policy header */}
          <div className={`flex-shrink-0 px-6 py-5 border-b border-rule2 ${policy.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusPill tone={STATUS_TONE[policy.status] ?? 'muted'}>{STATUS_LABEL[policy.status] ?? policy.status}</StatusPill>
                  {policy.activeSince && <span className="font-body text-muted text-label">Active since {policy.activeSince}</span>}
                </div>
                <div className="font-display font-bold text-ink text-2xl leading-none mb-1">{policy.name}</div>
                <div className="font-body text-muted text-body">{policy.jurisdiction}</div>
              </div>
              <div className="flex gap-6 flex-shrink-0">
                {policy.nextInspection && (
                  <div className="text-right">
                    <div className="font-display font-bold display-num text-page leading-none text-warn tabular-nums">
                      {policy.nextInspection.daysRemaining}
                    </div>
                    <div className="font-body text-muted text-label tracking-normal mt-0.5">days to inspection</div>
                    <div className="font-body text-muted text-label mt-0.5">{policy.nextInspection.authority}</div>
                  </div>
                )}
                <div className="text-right">
                  <div className={`font-display font-bold display-num text-page leading-none tabular-nums ${policy.openItems.capaCount > 0 ? 'text-warn' : 'text-ok'}`}>
                    {policy.openItems.capaCount}
                  </div>
                  <div className="font-body text-muted text-label tracking-normal mt-0.5">open CAPAs</div>
                  {policy.openItems.overdueCount > 0 && (
                    <div className="font-body text-danger text-label mt-0.5">{policy.openItems.overdueCount} overdue</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* Regulatory frameworks */}
            <div className="border-b border-rule2">
              <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                <span className="font-body font-bold text-ink text-label">Regulatory frameworks</span>
                <span className="ml-2 font-body text-muted text-label">{policy.frameworks.length} configured</span>
              </div>
              {policy.frameworks.map(f => <FrameworkRow key={f.id} f={f} />)}
            </div>

            {/* Two columns below */}
            <div className="flex border-b border-rule2">

              {/* Evidence requirements */}
              <div className="flex-1 border-r border-rule2">
                <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                  <span className="font-body font-bold text-ink text-label">Evidence requirements</span>
                </div>
                <div className="divide-y divide-rule2">
                  <div className="flex items-center gap-3 px-5 py-2 bg-stone2/50">
                    <span className="font-body text-muted text-label tracking-normal flex-1">Domain</span>
                    <span className="font-body text-muted text-label tracking-normal flex-1">Requirement</span>
                    <span className="font-body text-muted text-label tracking-normal w-5">Req.</span>
                  </div>
                  {policy.evidenceRequirements.map((e, i) => <EvidenceRow key={i} e={e} />)}
                </div>
              </div>

              {/* Escalation logic */}
              <div className="w-[320px] flex-shrink-0">
                <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                  <span className="font-body font-bold text-ink text-label">Escalation logic</span>
                </div>
                <EscalationFlow steps={policy.escalationLogic} />
              </div>
            </div>

            {/* Reporting templates */}
            <div>
              <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                <span className="font-body font-bold text-ink text-label">Reporting templates</span>
              </div>
              {policy.reportingTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-rule2 last:border-0 hover:bg-stone2 transition-colors group">
                  <div className="flex-1">
                    <div className="font-body font-medium text-ink text-body">{t.name}</div>
                    <div className="font-body text-muted text-label mt-0.5">{t.format}</div>
                  </div>
                  {t.lastGenerated
                    ? <span className="font-body text-muted text-label">Last: {t.lastGenerated}</span>
                    : <span className="font-body text-muted text-label">Never generated</span>
                  }
                  <button type="button"
                    className="font-body text-label px-2.5 py-1.5 text-muted hover:text-ink hover:border-muted transition-colors opacity-0 group-hover:opacity-100">
                    Generate
                  </button>
                </div>
              ))}
            </div>

            {/* Inactive policy CTA */}
            {policy.status === 'inactive' && (
              <div className="mx-6 my-6 px-5 py-4 border-l-4 border-l-rule2 bg-stone2">
                <div className="font-body font-semibold text-ink text-base mb-1">This policy is inactive</div>
                <div className="font-body text-muted text-label leading-relaxed mb-3">
                  Activating this policy will add all {policy.frameworks.length} frameworks to your compliance monitoring surface. Evidence requirements and escalation logic will be enforced immediately.
                </div>
                <button type="button"
                  className="font-body font-medium text-label px-3.5 py-2 bg-ink text-stone hover:bg-ink/90 transition-colors">
                  Activate policy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
