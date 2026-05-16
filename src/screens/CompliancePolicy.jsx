// Shift 2: Policy-based compliance engine
// Compliance is a configurable policy layer, not hardcoded US screens.

import { useState } from 'react'
import { compliancePolicies, multiRegulatoryCoverage } from '../data/compliance'
import { CheckCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react'

function StatusBadge({ status }) {
  const cfg = {
    active:     { label: 'Active',      cls: 'bg-ok/10 text-ok border border-ok/30' },
    inactive:   { label: 'Inactive',    cls: 'bg-stone3 text-ghost border border-rule2' },
    monitoring: { label: 'Monitoring',  cls: 'bg-ochre/10 text-ochre border border-ochre/30' },
  }[status] ?? { label: status, cls: 'bg-stone3 text-ghost' }
  return <span className={`font-body text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${cfg.cls}`}>{cfg.label}</span>
}

function FrameworkRow({ f }) {
  const statusColor = f.status === 'active' ? 'text-ok' : f.status === 'monitoring' ? 'text-ochre' : 'text-ghost'
  const dot = f.status === 'active' ? 'bg-ok' : f.status === 'monitoring' ? 'bg-ochre' : 'bg-rule2'
  return (
    <div className="flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-body font-medium text-ink text-[12px]">{f.name}</span>
          <span className="font-body text-ghost text-[10px]">{f.code}</span>
        </div>
        <div className="font-body text-ghost text-[10px] mt-0.5 leading-snug">{f.description}</div>
      </div>
      <span className={`font-body text-[10px] flex-shrink-0 ${statusColor}`}>{f.status}</span>
    </div>
  )
}

function EvidenceRow({ e }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2 last:border-0">
      <div className="flex-1">
        <span className="font-body text-ink text-[12px]">{e.domain}</span>
      </div>
      <span className="font-body text-muted text-[11px] flex-1">{e.requirement}</span>
      {e.required
        ? <CheckCircle size={11} className="text-ok flex-shrink-0" strokeWidth={2} />
        : <div className="w-2.5 h-2.5 rounded-full border border-rule2 flex-shrink-0" />
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
            <div className="w-5 h-5 rounded-full bg-stone3 border border-rule2 flex items-center justify-center">
              <span className="font-body text-ghost text-[9px]">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <div className="w-px h-4 bg-rule2 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="font-body font-medium text-ink text-[11px]">{s.threshold}</div>
            <div className="font-body text-muted text-[10px] mt-0.5">{s.action}</div>
            <div className="font-body text-ghost text-[9px] mt-0.5">{s.channel}</div>
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
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Platform Architecture</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Compliance Engine</div>
          <div className="font-body text-muted text-[10px] mt-1.5 leading-relaxed">
            Policy is configurable. Swap regulatory frameworks without rebuilding the product.
          </div>
        </div>

        {/* Multi-regulatory coverage */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-rule2 bg-warn/[0.04]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={10} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="font-body font-medium text-warn text-[10px]">Coverage gap detected</div>
              <div className="font-body text-ghost text-[10px] mt-0.5 leading-snug">{multiRegulatoryCoverage.coverageGap}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-rule2">
          {compliancePolicies.map(p => (
            <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-4 py-3.5 transition-colors border-l-4 ${
                selectedId === p.id ? `bg-stone2 ${p.border}` : 'border-l-transparent hover:bg-stone2/50'
              }`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`font-display font-bold text-[13px] leading-none ${selectedId === p.id ? 'text-ink' : 'text-ink2'}`}>{p.name}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="font-body text-ghost text-[10px] mb-2">{p.jurisdiction}</div>
              <div className="flex items-center gap-2">
                <span className="font-body text-ghost text-[10px]">{p.frameworks.length} frameworks</span>
                {p.openItems.capaCount > 0 && (
                  <span className="font-body text-warn text-[10px]">· {p.openItems.capaCount} open CAPAs</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Export markets */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-1.5">Export markets</div>
          <div className="flex flex-wrap gap-1">
            {multiRegulatoryCoverage.currentExportMarkets.map(m => (
              <span key={m} className="font-body text-ghost text-[9px] bg-stone3 px-1.5 py-0.5 border border-rule2">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: policy workspace ─────────────────────────────── */}
      {policy && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Policy header */}
          <div className={`flex-shrink-0 px-6 py-5 border-b border-rule2 border-l-4 ${policy.border} ${policy.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={policy.status} />
                  {policy.activeSince && <span className="font-body text-ghost text-[10px]">Active since {policy.activeSince}</span>}
                </div>
                <div className="font-display font-bold text-ink text-[24px] leading-none mb-1">{policy.name}</div>
                <div className="font-body text-muted text-[12px]">{policy.jurisdiction}</div>
              </div>
              <div className="flex gap-6 flex-shrink-0">
                {policy.nextInspection && (
                  <div className="text-right">
                    <div className="font-display font-bold display-num text-[32px] leading-none text-warn tabular-nums">
                      {policy.nextInspection.daysRemaining}
                    </div>
                    <div className="font-body text-ghost text-[9px] uppercase tracking-widest mt-0.5">days to inspection</div>
                    <div className="font-body text-ghost text-[10px] mt-0.5">{policy.nextInspection.authority}</div>
                  </div>
                )}
                <div className="text-right">
                  <div className={`font-display font-bold display-num text-[32px] leading-none tabular-nums ${policy.openItems.capaCount > 0 ? 'text-warn' : 'text-ok'}`}>
                    {policy.openItems.capaCount}
                  </div>
                  <div className="font-body text-ghost text-[9px] uppercase tracking-widest mt-0.5">open CAPAs</div>
                  {policy.openItems.overdueCount > 0 && (
                    <div className="font-body text-danger text-[10px] mt-0.5">{policy.openItems.overdueCount} overdue</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* Regulatory frameworks */}
            <div className="border-b border-rule2">
              <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                <span className="font-body font-bold text-ink text-[11px]">Regulatory frameworks</span>
                <span className="ml-2 font-body text-ghost text-[10px]">{policy.frameworks.length} configured</span>
              </div>
              {policy.frameworks.map(f => <FrameworkRow key={f.id} f={f} />)}
            </div>

            {/* Two columns below */}
            <div className="flex border-b border-rule2">

              {/* Evidence requirements */}
              <div className="flex-1 border-r border-rule2">
                <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                  <span className="font-body font-bold text-ink text-[11px]">Evidence requirements</span>
                </div>
                <div className="divide-y divide-rule2">
                  <div className="flex items-center gap-3 px-5 py-2 bg-stone2/50">
                    <span className="font-body text-ghost text-[9px] uppercase tracking-widest flex-1">Domain</span>
                    <span className="font-body text-ghost text-[9px] uppercase tracking-widest flex-1">Requirement</span>
                    <span className="font-body text-ghost text-[9px] uppercase tracking-widest w-5">Req.</span>
                  </div>
                  {policy.evidenceRequirements.map((e, i) => <EvidenceRow key={i} e={e} />)}
                </div>
              </div>

              {/* Escalation logic */}
              <div className="w-[320px] flex-shrink-0">
                <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                  <span className="font-body font-bold text-ink text-[11px]">Escalation logic</span>
                </div>
                <EscalationFlow steps={policy.escalationLogic} />
              </div>
            </div>

            {/* Reporting templates */}
            <div>
              <div className="px-5 py-2.5 bg-stone2 border-b border-rule2">
                <span className="font-body font-bold text-ink text-[11px]">Reporting templates</span>
              </div>
              {policy.reportingTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-rule2 last:border-0 hover:bg-stone2 transition-colors group">
                  <div className="flex-1">
                    <div className="font-body font-medium text-ink text-[12px]">{t.name}</div>
                    <div className="font-body text-ghost text-[10px] mt-0.5">{t.format}</div>
                  </div>
                  {t.lastGenerated
                    ? <span className="font-body text-ghost text-[10px]">Last: {t.lastGenerated}</span>
                    : <span className="font-body text-ghost text-[10px] italic">Never generated</span>
                  }
                  <button type="button"
                    className="font-body text-[10px] px-2.5 py-1.5 border border-rule2 text-muted hover:text-ink hover:border-ghost transition-colors opacity-0 group-hover:opacity-100">
                    Generate
                  </button>
                </div>
              ))}
            </div>

            {/* Inactive policy CTA */}
            {policy.status === 'inactive' && (
              <div className="mx-6 my-6 px-5 py-4 border border-rule2 border-l-4 border-l-rule2 bg-stone2">
                <div className="font-body font-semibold text-ink text-[13px] mb-1">This policy is inactive</div>
                <div className="font-body text-muted text-[11px] leading-relaxed mb-3">
                  Activating this policy will add all {policy.frameworks.length} frameworks to your compliance monitoring surface. Evidence requirements and escalation logic will be enforced immediately.
                </div>
                <button type="button"
                  className="font-body font-medium text-[11px] px-3.5 py-2 bg-ink text-stone hover:bg-ink/90 transition-colors">
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
