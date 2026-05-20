import { useState } from 'react'
import { compliancePolicies, multiRegulatoryCoverage } from '../data/compliance'
import { AlertTriangle } from 'lucide-react'
import { SceneHeader } from '../components/UI'

const STATUS_LABEL  = { active: 'Active', inactive: 'Inactive', monitoring: 'Monitoring' }
const STATUS_COLOR  = { active: 'text-ok', inactive: 'text-muted', monitoring: 'text-ochre' }
const STATUS_DOT    = { active: 'bg-ok',   inactive: 'bg-rule2',   monitoring: 'bg-ochre'  }
const STATUS_BORDER = { active: 'border-l-ok', inactive: 'border-l-rule2', monitoring: 'border-l-ochre' }

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, accent = 'bg-rule2' }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2">
      <div className={`w-0.5 h-3.5 flex-shrink-0 rounded-sm ${accent}`} />
      <span className="font-body text-micro text-muted tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-rule2" />
      {count != null && <span className="font-body text-muted text-label">{count}</span>}
    </div>
  )
}

// ─── Framework row ────────────────────────────────────────────────────────────

function FrameworkRow({ f }) {
  const border = STATUS_BORDER[f.status] ?? 'border-l-rule2'
  const color  = STATUS_COLOR[f.status]  ?? 'text-muted'
  return (
    <div className={`flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0 border-l-2 ${border} ${f.status === 'inactive' ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className="font-body font-medium text-ink text-body">{f.name}</span>
          <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5 leading-none tracking-wide">{f.code}</span>
        </div>
        <div className="font-body text-muted text-label leading-snug">{f.description}</div>
      </div>
      <span className={`font-body text-label flex-shrink-0 ${color}`}>{STATUS_LABEL[f.status] ?? f.status}</span>
    </div>
  )
}

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceRow({ e }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0 ${e.required ? 'border-l-2 border-l-ok' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="font-body font-medium text-ink text-body leading-snug">{e.domain}</div>
        <div className="font-body text-muted text-label mt-0.5 leading-snug">{e.requirement}</div>
      </div>
      {e.required
        ? <span className="font-body text-micro text-ok bg-ok/[0.08] px-1.5 py-0.5 flex-shrink-0 tracking-widest whitespace-nowrap mt-0.5">REQUIRED</span>
        : <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5 flex-shrink-0 mt-0.5">Optional</span>
      }
    </div>
  )
}

// ─── Escalation flow ──────────────────────────────────────────────────────────
// Steps escalate visually: first = mild, last = legal danger

function escalationTone(i, total) {
  if (i === total - 1) return { dot: 'bg-danger', num: 'text-stone', border: 'border-l-danger', bg: 'bg-danger/[0.04]', threshold: 'text-danger' }
  if (i > 0 || total === 2) return { dot: 'bg-warn', num: 'text-stone', border: 'border-l-warn', bg: '', threshold: 'text-warn' }
  return { dot: 'bg-stone3', num: 'text-muted', border: 'border-l-rule2', bg: '', threshold: 'text-muted' }
}

function EscalationFlow({ steps }) {
  return (
    <div className="divide-y divide-rule2">
      {steps.map((s, i) => {
        const t = escalationTone(i, steps.length)
        return (
          <div key={i} className={`flex items-start gap-3 px-5 py-3 border-l-2 ${t.border} ${t.bg}`}>
            <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${t.dot}`}>
                <span className={`font-body text-micro font-bold ${t.num}`}>{i + 1}</span>
              </div>
              {i < steps.length - 1 && <div className="w-px bg-rule2 mt-1" style={{ height: 16 }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-body font-medium text-label ${t.threshold}`}>{s.threshold}</div>
              <div className="font-body text-muted text-label mt-0.5 leading-snug">{s.action}</div>
              <div className="font-body text-micro text-muted tracking-wide mt-0.5">{s.channel}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function CompliancePolicy() {
  const [selectedId, setSelectedId] = useState('fda-us')
  const policy = compliancePolicies.find(p => p.id === selectedId)

  // Hero metric: inspection countdown > CAPA count > framework count
  const heroMetric = policy?.nextInspection?.daysRemaining
    ?? policy?.openItems?.capaCount
    ?? policy?.frameworks?.length
    ?? 0

  const heroLabel = policy?.nextInspection
    ? 'days to inspection'
    : policy?.openItems?.capaCount > 0
      ? `open CAPA${policy.openItems.capaCount !== 1 ? 's' : ''}`
      : 'frameworks'

  const heroTone = policy?.status !== 'active' ? 'muted'
    : policy?.nextInspection
      ? (policy.nextInspection.daysRemaining < 14 ? 'danger' : 'warn')
      : policy?.openItems?.capaCount > 0 ? 'warn' : 'ok'

  const activeCount = policy?.frameworks?.filter(f => f.status === 'active').length ?? 0

  const statement = policy?.status === 'inactive'
    ? `Not enforced · ${policy.frameworks.length} frameworks awaiting activation`
    : policy?.status === 'monitoring'
      ? `Monitoring only · ${policy.frameworks.length} frameworks tracked · not yet enforced`
      : `${activeCount} of ${policy?.frameworks?.length} frameworks active`

  const metaItems = [
    policy?.nextInspection && { label: 'authority', value: policy.nextInspection.authority },
    policy?.openItems?.capaCount > 0 && { label: 'open CAPAs', value: policy.openItems.capaCount },
    policy?.openItems?.overdueCount > 0 && { label: 'overdue', value: policy.openItems.overdueCount, color: 'var(--color-danger)' },
    policy?.activeSince && { label: 'active since', value: policy.activeSince },
  ].filter(Boolean)

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* ── Left: policy selector ─────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

        {/* Coverage gap — elevated prominence */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-rule2 border-l-4 border-l-warn bg-warn/[0.06]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={11} className="text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="font-body font-bold text-warn text-body mb-0.5">Coverage gap</div>
              <div className="font-body text-muted text-label leading-snug">{multiRegulatoryCoverage.coverageGap}</div>
            </div>
          </div>
        </div>

        {/* Policy list */}
        <div className="flex-1 overflow-y-auto">
          {compliancePolicies.map(p => {
            const isSelected = selectedId === p.id
            const borderColor = STATUS_BORDER[p.status] ?? 'border-l-rule2'
            const dotColor    = STATUS_DOT[p.status]    ?? 'bg-rule2'
            const statusColor = STATUS_COLOR[p.status]  ?? 'text-muted'
            return (
              <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-4 py-4 border-b border-rule2 transition-colors border-l-[3px] ${
                  isSelected
                    ? `${borderColor} bg-stone2`
                    : `border-l-transparent hover:bg-stone2/50 ${p.status === 'inactive' ? 'opacity-60' : ''}`
                }`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className={`font-body text-micro tracking-widest ${statusColor}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="font-display font-bold text-ink text-base leading-snug mb-0.5">{p.name}</div>
                <div className="font-body text-muted text-label mb-2">{p.jurisdiction}</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-body text-muted text-label">{p.frameworks.length} frameworks</span>
                  {p.openItems.capaCount > 0 && (
                    <span className="font-body text-warn text-label">· {p.openItems.capaCount} CAPAs</span>
                  )}
                  {p.nextInspection && (
                    <span className="font-body text-warn text-label">· {p.nextInspection.daysRemaining}d</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Export markets */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="font-body text-micro text-muted tracking-widest mb-1.5">EXPORT MARKETS</div>
          <div className="flex flex-wrap gap-1">
            {multiRegulatoryCoverage.currentExportMarkets.map(m => (
              <span key={m} className="font-body text-muted text-label bg-stone3 px-1.5 py-0.5">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: policy workspace ──────────────────────────────── */}
      {policy && (
        <div className="flex-1 flex flex-col overflow-hidden">

          <SceneHeader
            module="COMPLIANCE"
            context={`${policy.name} · ${policy.jurisdiction}`}
            metric={heroMetric}
            metricLabel={heroLabel}
            statement={statement}
            tone={heroTone}
            meta={metaItems}
          />

          <div className="flex-1 overflow-y-auto">

            {/* Regulatory frameworks */}
            <div className="border-b border-rule2">
              <SectionHeader label="FRAMEWORKS" count={`${policy.frameworks.length} configured`} accent="bg-ochre" />
              {policy.frameworks.map(f => <FrameworkRow key={f.id} f={f} />)}
            </div>

            {/* Evidence + Escalation */}
            <div className="flex border-b border-rule2">
              <div className="flex-1 border-r border-rule2">
                <SectionHeader label="EVIDENCE" count={`${policy.evidenceRequirements.length} requirements`} accent="bg-ok" />
                {policy.evidenceRequirements.map((e, i) => <EvidenceRow key={i} e={e} />)}
              </div>
              <div className="w-[320px] flex-shrink-0">
                <SectionHeader label="ESCALATION" count={`${policy.escalationLogic.length} thresholds`} accent="bg-danger" />
                <EscalationFlow steps={policy.escalationLogic} />
              </div>
            </div>

            {/* Reporting templates */}
            <div>
              <SectionHeader label="REPORTING" count={`${policy.reportingTemplates.length} templates`} accent="bg-muted" />
              {policy.reportingTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-rule2 last:border-0 hover:bg-stone2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-body mb-1">{t.name}</div>
                    <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5 tracking-wide">{t.format}</span>
                  </div>
                  <span className="font-body text-muted text-label flex-shrink-0">
                    {t.lastGenerated ? `Last: ${t.lastGenerated}` : 'Never generated'}
                  </span>
                  <button type="button"
                    className="font-body text-label px-2.5 py-1.5 bg-stone3 text-muted hover:text-ink hover:bg-stone4 transition-colors flex-shrink-0">
                    Generate
                  </button>
                </div>
              ))}
            </div>

            {/* Inactive policy CTA */}
            {policy.status === 'inactive' && (
              <div className="mx-6 my-6 px-5 py-4 border-l-4 border-l-ochre bg-ochre/[0.06]">
                <div className="font-body font-semibold text-ink text-base mb-1">Activate this policy</div>
                <div className="font-body text-muted text-label leading-relaxed mb-3">
                  All {policy.frameworks.length} frameworks will be added to your compliance dashboard. Evidence requirements and escalation rules will be enforced immediately.
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
