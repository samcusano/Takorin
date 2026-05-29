import { useState } from 'react'
import { compliancePolicies, multiRegulatoryCoverage } from '../data/compliance'
import { AlertTriangle, ArrowRight, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react'
import { SceneHeader, StatusPill, Btn, SlidePanel, AnimatedScore, Tabs } from '../components/UI'

// ─── FDA Inspection Simulation data ──────────────────────────────────────────

const AUDIT_CHECKS = [
  { category: 'CAPA Register',           result: 'fail',    detail: '1 case overdue 7 days (CAPA-2604-001) · 1 awaiting closure (CAPA-2604-003) · 1 in progress', remediation: 'Close CAPA-2604-001 before inspection — 7-day gap is visible in audit package', link: '/capa' },
  { category: 'FSMA 204 Traceability',   result: 'fail',    detail: 'TS-8811 naming conflict across MES, ERP, and supplier portal — lot chain incomplete', remediation: 'Resolve 3-name conflict in DataReadiness before FDA walkthrough', link: '/readiness' },
  { category: 'Sanitation Records',       result: 'pass',    detail: 'All active lines current · Last Line 6 PM gap resolved (CAPA-2604-003 evidence submitted)' },
  { category: 'HACCP CCP Documentation', result: 'pass',    detail: 'CCP-1, CCP-3, CCP-4 all within limits · Logs current for active SKU' },
  { category: 'COA Documentation',        result: 'at-risk', detail: 'ConAgra TS-8811 pending · Production scheduled tomorrow · 24h to resolve', remediation: 'Follow up with ConAgra QA — COA required before production use', link: '/supplier' },
  { category: 'Personnel Certifications', result: 'at-risk', detail: 'Kowalski L4 cert expires Jun 1 (10 days) · Okonkwo L2 expires Jun 15', remediation: 'Schedule renewal sessions before FDA window closes' },
  { category: 'Escalation Procedures',   result: 'pass',    detail: 'All escalation logic documented and tested · R-03 incident demonstrates working chain' },
  { category: 'SQF Certification',        result: 'pass',    detail: 'Valid through 2027 · Last audit Jan 2026 · 0 findings' },
]

const RESULT_CFG = {
  pass:    { label: 'Pass',    icon: CheckCircle2, color: 'text-ok',     bg: 'bg-ok/[0.03]',     border: 'border-l-ok',     dot: 'bg-ok' },
  fail:    { label: 'Fail',    icon: XCircle,      color: 'text-danger',  bg: 'bg-danger/[0.03]', border: 'border-l-danger', dot: 'bg-danger' },
  'at-risk': { label: 'At risk', icon: AlertCircle, color: 'text-warn',  bg: 'bg-warn/[0.02]',   border: 'border-l-warn',   dot: 'bg-warn' },
}

function AuditSimPanel({ onClose }) {
  const passes = AUDIT_CHECKS.filter(c => c.result === 'pass').length
  const total  = AUDIT_CHECKS.length
  const score  = Math.round((passes / total) * 100)
  const scoreColor = score >= 80 ? 'text-ok' : score >= 60 ? 'text-warn' : 'text-danger'

  return (
    <SlidePanel
      title="FDA Inspection Simulation"
      subtitle={`US FDA Region 7 · 18 days to scheduled inspection · Run ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
      accentColor="var(--color-warn)"
      onClose={onClose}
      footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}
    >
      {/* Score header */}
      <div className="flex items-center gap-4 px-4 py-4 bg-stone2 border border-rule2 mb-4">
        <div className={`display-num text-score leading-none ${scoreColor}`}><AnimatedScore value={score} suffix="%" effect="glow" hero /></div>
        <div className="flex-1 min-w-0">
          <div className={`font-body font-semibold text-body ${scoreColor}`}>
            {score >= 80 ? 'Likely ready for inspection' : score >= 60 ? 'Not ready — blocking gaps must close first' : 'At risk — multiple critical gaps'}
          </div>
          <div className="font-body text-muted text-label mt-0.5">{passes} of {total} checks pass · {total - passes} require action before inspection</div>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {AUDIT_CHECKS.map((check, i) => {
          const cfg = RESULT_CFG[check.result]
          const Icon = cfg.icon
          return (
            <div key={i} className={`border-l-[3px] ${cfg.border} ${cfg.bg} border border-rule2/60`}>
              <div className="flex items-start gap-3 px-4 py-3">
                <Icon size={13} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${cfg.color}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-body font-medium text-ink text-body">{check.category}</span>
                    <span className={`font-body text-label font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="font-body text-muted text-label leading-relaxed">{check.detail}</p>
                  {check.remediation && (
                    <p className={`font-body text-label mt-1 leading-snug ${cfg.color}`}>→ {check.remediation}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SlidePanel>
  )
}

const STATUS_LABEL  = { active: 'Active', inactive: 'Inactive', monitoring: 'Monitoring' }
const STATUS_COLOR  = { active: 'text-ok', inactive: 'text-muted', monitoring: 'text-signal' }
const STATUS_DOT    = { active: 'bg-ok',   inactive: 'bg-rule2',   monitoring: 'bg-signal'  }
const STATUS_BORDER = { active: 'border-l-ok', inactive: 'border-l-rule2', monitoring: 'border-l-signal' }

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2">
      <span className="font-body text-label font-semibold text-muted">{label}</span>
      <div className="flex-1 h-px bg-rule2" />
      {count != null && <span className="font-body text-muted text-label">{count}</span>}
    </div>
  )
}

// ─── Framework row ────────────────────────────────────────────────────────────

function FrameworkRow({ f, index = 0 }) {
  const border = STATUS_BORDER[f.status] ?? 'border-l-rule2'
  const color  = STATUS_COLOR[f.status]  ?? 'text-muted'
  return (
    <div className={`flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0 border-l-2 row-in ${border} ${f.status === 'inactive' ? 'opacity-40' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className="font-body font-medium text-ink text-body">{f.name}</span>
          <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5 leading-none">{f.code}</span>
        </div>
        <div className="font-body text-muted text-label leading-snug">{f.description}</div>
      </div>
      <StatusPill tone={f.status === 'active' ? 'ok' : f.status === 'inactive' ? 'muted' : 'signal'} className="flex-shrink-0">{STATUS_LABEL[f.status] ?? f.status}</StatusPill>
    </div>
  )
}

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceRow({ e, index = 0 }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0 row-in ${e.required ? 'border-l-2 border-l-ok' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex-1 min-w-0">
        <div className="font-body font-medium text-ink text-body leading-snug">{e.domain}</div>
        <div className="font-body text-muted text-label mt-0.5 leading-snug">{e.requirement}</div>
      </div>
      {e.required
        ? <StatusPill tone="ok" className="flex-shrink-0 whitespace-nowrap mt-0.5">Required</StatusPill>
        : <StatusPill tone="muted" className="flex-shrink-0 mt-0.5">Optional</StatusPill>
      }
    </div>
  )
}

// ─── Escalation strip ─────────────────────────────────────────────────────────
// Horizontal, sits below the SceneHeader. Tone escalates left → right.

function escalationTone(i, total) {
  if (i === total - 1) return { dot: 'bg-danger', num: 'text-stone', bg: 'bg-danger/[0.04]', threshold: 'text-danger' }
  if (i > 0 || total === 2) return { dot: 'bg-warn',   num: 'text-stone', bg: '',                threshold: 'text-warn'   }
  return                          { dot: 'bg-stone3',  num: 'text-muted', bg: '',                threshold: 'text-muted'  }
}

function EscalationStrip({ steps }) {
  return (
    <div className="flex-shrink-0 flex items-stretch border-b border-rule2">
      <div className="px-4 items-center border-r border-rule2 flex-shrink-0">
        <span className="font-body text-micro text-muted mb-1.5">Escalation</span>
      </div>
      <div className="flex flex-1 items-stretch gap-0">
        {steps.flatMap((s, i) => {
          const t = escalationTone(i, steps.length)
          const isLast = i === steps.length - 1
          const cell = (
            <div key={`step-${i}`} className={`flex-1 min-w-0 px-3 py-2.5 ${isLast ? t.bg : 'bg-stone2'}`}>
              <div className={`font-body text-micro mb-0.5 ${t.threshold}`}>{s.threshold}</div>
              <div className="font-body text-ink text-label leading-snug">{s.action}</div>
              <div className="font-body text-muted text-micro mt-0.5">{s.channel}</div>
            </div>
          )
          if (isLast) return [cell]
          return [
            cell,
            <div key={`arrow-${i}`} className="flex items-center px-1 text-rule2 flex-shrink-0">
              <ArrowRight size={10} />
            </div>,
          ]
        })}
      </div>
    </div>
  )
}

// ─── Risk Exposure data + component ──────────────────────────────────────────

const fmtRisk = n => n >= 1000 ? `$${Math.round(n / 1000)}K` : n > 0 ? `$${n}` : '—'

const RISK_FINDINGS = [
  {
    id: 'rf-capa',
    title: 'CAPA Register — overdue case',
    rule: 'FDA 21 CFR 820.100',
    requirement: 'Corrective and preventive actions must be completed within established timeframes',
    severity: 'critical',
    auditFinding: 'CAPA-2604-001 overdue 7 days — auditor will flag as systemic CAPA failure requiring a written response within 15 days of inspection close',
    recallRisk: 0,
    marketAccessRisk: 15000,
    closurePath: 'Close CAPA-2604-001 within 48h · submit evidence package to CAPA Engine',
    daysToClose: 2,
  },
  {
    id: 'rf-fsma',
    title: 'FSMA 204 — lot traceability chain incomplete',
    rule: 'FSMA 204 (FDA Food Traceability Rule)',
    requirement: 'Complete traceability chain required from supplier through finished product lot',
    severity: 'critical',
    auditFinding: 'TS-8811 naming conflict across MES, ERP, and supplier portal breaks lot chain at 2 handoffs. Auditor will require remediation plan and may place a hold on affected production runs.',
    recallRisk: 85000,
    marketAccessRisk: 40000,
    closurePath: 'Resolve TS-8811 conflict in Data Readiness · rebuild affected lot chain before inspection',
    daysToClose: 5,
  },
  {
    id: 'rf-coa',
    title: 'COA Documentation — ingredient pending',
    rule: 'FDA 21 CFR 111.75',
    requirement: 'Certificate of Analysis required before ingredient use in production',
    severity: 'moderate',
    auditFinding: 'ConAgra TS-8811 COA pending with production scheduled tomorrow. If production ran without COA, auditor will classify as a corrective action item with 30-day response window.',
    recallRisk: 32000,
    marketAccessRisk: 0,
    closurePath: 'Delay production until COA received · document hold decision in supplier log',
    daysToClose: 1,
  },
  {
    id: 'rf-cert',
    title: 'Personnel Certifications — 2 expiring within inspection window',
    rule: 'SQF Code 2.8.3',
    requirement: 'Operators must maintain current certifications for assigned production roles',
    severity: 'moderate',
    auditFinding: 'Kowalski L4 expires Jun 1 · Okonkwo L2 expires Jun 15 — both within the 18-day inspection window. Auditor will request full certification roster for all active lines.',
    recallRisk: 0,
    marketAccessRisk: 8000,
    closurePath: 'Schedule both renewal sessions this week · confirm enrollment before Jun 1',
    daysToClose: 7,
  },
]

function RiskExposure() {
  const critical    = RISK_FINDINGS.filter(f => f.severity === 'critical')
  const moderate    = RISK_FINDINGS.filter(f => f.severity === 'moderate')
  const totalRecall = RISK_FINDINGS.reduce((s, f) => s + f.recallRisk, 0)
  const totalMarket = RISK_FINDINGS.reduce((s, f) => s + f.marketAccessRisk, 0)

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Summary strip */}
      <div className="flex border-b border-rule2 flex-shrink-0">
        {[
          { label: 'Critical findings',  value: String(critical.length),   tone: critical.length > 0 ? 'text-danger' : 'text-ok', sub: 'if audited today'         },
          { label: 'Moderate findings',  value: String(moderate.length),   tone: moderate.length > 0 ? 'text-warn'   : 'text-ok', sub: 'flagged for follow-up'    },
          { label: 'Recall exposure',    value: fmtRisk(totalRecall),      tone: totalRecall > 0   ? 'text-danger' : 'text-ok', sub: 'estimated recall cost'     },
          { label: 'Market access risk', value: fmtRisk(totalMarket),      tone: totalMarket > 0   ? 'text-warn'   : 'text-ok', sub: 'buyer / retailer impact'   },
        ].map((cell, i) => (
          <div key={i} className={`flex-1 px-5 py-4 border-r border-rule2 last:border-r-0 ${i === 0 && critical.length > 0 ? 'bg-danger/[0.025]' : ''}`}>
            <div className="font-body text-muted text-label mb-1">{cell.label}</div>
            <div className={`display-num text-metric font-bold leading-none tabular-nums ${cell.tone}`}>{cell.value}</div>
            <div className="font-body text-muted text-label mt-1">{cell.sub}</div>
          </div>
        ))}
      </div>

      {/* Scenario framing */}
      <div className="px-5 py-3 border-b border-rule2 bg-stone2">
        <span className="font-body text-warn text-label font-medium">If audited today — </span>
        <span className="font-body text-muted text-label">2 findings require immediate written response · 2 would be flagged with a 15-day remediation window</span>
      </div>

      {/* Finding cards */}
      <div className="divide-y divide-rule2">
        {RISK_FINDINGS.map(f => {
          const sev = f.severity === 'critical'
            ? { border: 'border-l-danger', bg: 'bg-danger/[0.02]', dot: 'bg-danger', label: 'Critical finding', tone: 'text-danger' }
            : { border: 'border-l-warn',   bg: '',                  dot: 'bg-warn',   label: 'Moderate finding', tone: 'text-warn'   }
          return (
            <div key={f.id} className={`border-l-[3px] ${sev.border} ${sev.bg} px-5 py-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-body font-medium text-ink text-body">{f.title}</span>
                    <span className={`font-body text-label font-medium ${sev.tone}`}>{sev.label}</span>
                    <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5 leading-none">{f.rule}</span>
                  </div>
                  <div className="font-body text-muted text-label mb-2 leading-snug">{f.requirement}</div>
                  <div className={`font-body text-label leading-snug mb-3 ${sev.tone}`}>→ {f.auditFinding}</div>
                  <div className="flex items-center gap-6 mb-2">
                    {f.recallRisk > 0 && (
                      <span className="font-body text-label">
                        <span className="text-muted">Recall: </span>
                        <span className="font-medium text-danger tabular-nums">{fmtRisk(f.recallRisk)}</span>
                      </span>
                    )}
                    {f.marketAccessRisk > 0 && (
                      <span className="font-body text-label">
                        <span className="text-muted">Market access: </span>
                        <span className="font-medium text-warn tabular-nums">{fmtRisk(f.marketAccessRisk)}</span>
                      </span>
                    )}
                  </div>
                  <div className="font-body text-label text-muted">
                    Close in <span className="font-medium text-ink">{f.daysToClose}d:</span> {f.closurePath}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function CompliancePolicy() {
  const [selectedId, setSelectedId] = useState('fda-us')
  const [auditOpen, setAuditOpen] = useState(false)
  const [policyView, setPolicyView] = useState('detail')
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
              <div className="font-body text-warn text-body mb-1.5">Coverage gap</div>
              <div className="font-body text-muted text-label leading-snug">{multiRegulatoryCoverage.coverageGap}</div>
            </div>
          </div>
        </div>

        {/* Policy list */}
        <div className="flex-1 overflow-y-auto page-wipe">
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
                  <span className={`font-body text-micro ${statusColor}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="font-body font-medium text-ink text-body leading-snug mb-0.5">{p.name}</div>
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
          <div className="font-body text-micro text-muted mb-1.5">Export markets</div>
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
          {auditOpen && <AuditSimPanel onClose={() => setAuditOpen(false)} />}

          <SceneHeader
            module="Compliance"
            context={`${policy.name} · ${policy.jurisdiction}`}
            metric={heroMetric}
            metricLabel={heroLabel}
            statement={statement}
            tone={heroTone}
            meta={metaItems}
          />

          {/* Inspection simulation trigger — only for FDA-US with an active inspection window */}
          {policy.nextInspection && (
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-rule2 bg-stone2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
                <span className="font-body text-warn text-label font-medium">
                  {policy.nextInspection.authority} inspection in {policy.nextInspection.daysRemaining} days
                </span>
                <span className="font-body text-muted text-label">— 2 blocking gaps require resolution before arrival</span>
              </div>
              <Btn variant="secondary" onClick={() => setAuditOpen(true)}>
              Simulate audit
              </Btn>
            </div>
          )}

          <EscalationStrip steps={policy.escalationLogic} />

          <div className="flex-shrink-0 border-b border-rule2 px-5">
            <Tabs
              tabs={[{ id: 'detail', label: 'Policy detail' }, { id: 'exposure', label: 'Risk exposure' }]}
              active={policyView}
              onChange={setPolicyView}
            />
          </div>

          {policyView === 'exposure' ? <RiskExposure /> : (
          <div className="flex-1 overflow-y-auto">

            {/* Frameworks + Evidence — two columns */}
            <div className="flex border-b border-rule2">
              <div className="flex-1 border-r border-rule2">
                <SectionHeader label="Frameworks" count={`${policy.frameworks.length} configured`} />
                {policy.frameworks.map((f, i) => <FrameworkRow key={f.id} f={f} index={i} />)}
              </div>
              <div className="flex-1">
                <SectionHeader label="Evidence" count={`${policy.evidenceRequirements.length} requirements`} />
                {policy.evidenceRequirements.map((e, i) => <EvidenceRow key={i} e={e} index={i} />)}
              </div>
            </div>

            {/* Reporting templates */}
            <div>
              <SectionHeader label="Reporting" count={`${policy.reportingTemplates.length} templates`} />
              {policy.reportingTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-rule2 last:border-0 hover:bg-stone2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-medium text-ink text-body mb-1">{t.name}</div>
                    <span className="font-body text-micro text-muted bg-stone3 px-1.5 py-0.5">{t.format}</span>
                  </div>
                  <span className="font-body text-muted text-label flex-shrink-0">
                    {t.lastGenerated ? `Last: ${t.lastGenerated}` : 'Never generated'}
                  </span>
                  <Btn variant="secondary" className="flex-shrink-0">Generate</Btn>
                </div>
              ))}
            </div>

            {/* Inactive policy CTA */}
            {policy.status === 'inactive' && (
              <div className="mx-6 my-6 px-5 py-4 border-l-4 border-l-signal bg-signal/[0.06]">
                <div className="font-body font-semibold text-ink text-base mb-1">Activate this policy</div>
                <div className="font-body text-muted text-label leading-relaxed mb-3">
                  All {policy.frameworks.length} frameworks will be added to your compliance dashboard. Evidence requirements and escalation rules will be enforced immediately.
                </div>
                <Btn variant="primary">Activate policy</Btn>
              </div>
            )}

          </div>
          )}
        </div>
      )}
    </div>
  )
}
