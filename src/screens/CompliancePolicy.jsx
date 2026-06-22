import { useState } from 'react'
import { Link } from 'react-router-dom'
import { compliancePolicies, multiRegulatoryCoverage } from '../data/compliance'
import { CheckCircle2, XCircle, AlertCircle, User, Calendar, Scale, Eye, FileClock, AlarmClock, ShieldAlert } from 'lucide-react'
import { SceneHeader, StatusPill, Btn, SlidePanel, AnimatedScore, Tabs } from '../components/UI'
import RecordVault from './RecordVault'

// ─── FDA Inspection Simulation data ──────────────────────────────────────────

const AUDIT_CHECKS = [
  { category: 'CAPA Register',           result: 'fail',    detail: '1 case overdue 7 days (CAPA-2604-001) · 1 awaiting closure (CAPA-2604-003) · 1 in progress', remediation: 'Close CAPA-2604-001 before inspection — 7-day gap is visible in audit package', link: '/capa' },
  { category: 'FSMA 204 Traceability',   result: 'fail',    detail: 'TS-8811 naming conflict across MES, ERP, and supplier portal — lot chain incomplete', remediation: 'Resolve 3-name conflict in DataReadiness before FDA walkthrough', link: '/data' },
  { category: 'Sanitation Records',       result: 'pass',    detail: 'All active lines current · Last Line 6 PM gap resolved (CAPA-2604-003 evidence submitted)' },
  { category: 'HACCP CCP Documentation', result: 'pass',    detail: 'CCP-1, CCP-3, CCP-4 all within limits · Logs current for active SKU' },
  { category: 'COA Documentation',        result: 'at-risk', detail: 'ConAgra TS-8811 pending · Production scheduled tomorrow · 24h to resolve', remediation: 'Follow up with ConAgra QA — COA required before production use', link: '/suppliers' },
  { category: 'Personnel Certifications', result: 'at-risk', detail: 'Kowalski L4 cert expires Jun 1 (10 days) · Okonkwo L2 expires Jun 15', remediation: 'Schedule renewal sessions before FDA window closes' },
  { category: 'Escalation Procedures',   result: 'pass',    detail: 'All escalation logic documented and tested · R-03 incident demonstrates working chain' },
  { category: 'SQF Certification',        result: 'pass',    detail: 'Valid through 2027 · Last audit Jan 2026 · 0 findings' },
]

const RESULT_CFG = {
  pass:      { label: 'Pass',    icon: CheckCircle2, color: 'text-ok',    bg: 'bg-ok/[0.03]',     border: 'border-l-ok'     },
  fail:      { label: 'Fail',    icon: XCircle,      color: 'text-danger', bg: 'bg-danger/[0.03]', border: 'border-l-danger' },
  'at-risk': { label: 'At risk', icon: AlertCircle,  color: 'text-warn',  bg: 'bg-warn/[0.02]',   border: 'border-l-warn'   },
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
      <div className="flex items-center gap-4 px-4 py-4 bg-stone2 border border-rule2 mb-4">
        <div className={`display-num text-score leading-none ${scoreColor}`}><AnimatedScore value={score} suffix="%" effect="glow" hero /></div>
        <div className="flex-1 min-w-0">
          <div className={`font-body font-semibold text-body ${scoreColor}`}>
            {score >= 80 ? 'Likely ready for inspection' : score >= 60 ? 'Not ready — blocking gaps must close first' : 'At risk — multiple critical gaps'}
          </div>
          <div className="font-body text-muted text-label mt-0.5">{passes} of {total} checks pass · {total - passes} require action before inspection</div>
        </div>
      </div>
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
                    <p className={`font-body text-body mt-1 leading-snug ${cfg.color}`}>→ {check.remediation}</p>
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

// ─── Policy selector helpers ──────────────────────────────────────────────────

const STATUS_LABEL  = { active: 'Active', inactive: 'Inactive', monitoring: 'Monitoring' }
const STATUS_COLOR  = { active: 'text-ok', inactive: 'text-muted', monitoring: 'text-signal' }
const STATUS_DOT    = { active: 'bg-ok',   inactive: 'bg-rule2',   monitoring: 'bg-signal'  }
const STATUS_BORDER = { active: 'border-l-ok', inactive: 'border-l-rule2', monitoring: 'border-l-signal' }

function PolicySectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-rule2">
      <span className="font-body text-label font-semibold text-muted">{label}</span>
      <div className="flex-1 h-px bg-rule2" />
      {count != null && <span className="font-body text-muted text-label">{count}</span>}
    </div>
  )
}

function FrameworkRow({ f, index = 0 }) {
  const border = STATUS_BORDER[f.status] ?? 'border-l-rule2'
  return (
    <div className={`flex items-start gap-3 px-5 py-3 border-b border-rule2 last:border-0 border-l-[3px] row-in ${border} ${f.status === 'inactive' ? 'opacity-40' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className="font-body font-medium text-ink text-body">{f.name}</span>
          <span className="font-body text-label text-muted bg-stone3 px-1.5 py-0.5 leading-none">{f.code}</span>
        </div>
        <div className="font-body text-muted text-label leading-snug">{f.description}</div>
      </div>
      <StatusPill tone={f.status === 'active' ? 'ok' : f.status === 'inactive' ? 'muted' : 'signal'} className="flex-shrink-0">
        {STATUS_LABEL[f.status] ?? f.status}
      </StatusPill>
    </div>
  )
}

function EvidenceRow({ e, index = 0 }) {
  return (
    <div className={`flex items-start gap-3 px-5 py-2.5 border-b border-rule2 last:border-0 row-in ${e.required ? 'border-l-[3px] border-l-ok' : ''}`}
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

// ─── Accountability register data ─────────────────────────────────────────────

const fmtRisk = n => n >= 1000 ? `$${Math.round(n / 1000)}K` : n > 0 ? `$${n}` : null

const RISK_FINDINGS = [
  {
    id: 'rf-capa',
    title: 'CAPA Register — overdue case',
    rule: 'FDA 21 CFR 820.100',
    requirement: 'Corrective and preventive actions must be completed within established timeframes',
    severity: 'critical',
    auditFinding: 'CAPA-2604-001 overdue 7 days — auditor will flag as systemic CAPA failure requiring a written response within 15 days of inspection close',
    closurePath: 'Close CAPA-2604-001 within 48h · submit evidence package to CAPA',
    recallRisk: 0, contractRisk: 15000, daysToClose: 2,
    assignee: 'QA Director', link: '/capa', documented: 'May 26',
  },
  {
    id: 'rf-fsma',
    title: 'FSMA 204 — lot traceability chain incomplete',
    rule: 'FSMA 204 (FDA Food Traceability Rule)',
    requirement: 'Complete traceability chain required from supplier through finished product lot — retrievable within 24 hours',
    severity: 'critical',
    auditFinding: 'TS-8811 naming conflict across MES, ERP, and supplier portal breaks lot chain at 2 handoffs. Auditor will require remediation plan and may place a hold on affected production runs.',
    closurePath: 'Resolve TS-8811 conflict in Data Readiness · rebuild affected lot chain before inspection',
    recallRisk: 85000, contractRisk: 40000, daysToClose: 5,
    assignee: 'Plant Director', link: '/data', documented: 'Jun 2',
  },
  {
    id: 'rf-coa',
    title: 'COA Documentation — ingredient pending',
    rule: 'FDA 21 CFR 111.75',
    requirement: 'Certificate of Analysis required before ingredient use in production',
    severity: 'moderate',
    auditFinding: 'ConAgra TS-8811 COA pending with production scheduled tomorrow. If production ran without COA, auditor will classify as a corrective action item with 30-day response window.',
    closurePath: 'Delay production until COA received · document hold decision in supplier log',
    recallRisk: 32000, contractRisk: 0, daysToClose: 1,
    assignee: 'Procurement Lead', link: '/suppliers', documented: 'Jun 2',
  },
  {
    id: 'rf-cert',
    title: 'Personnel Certifications — 2 expiring within inspection window',
    rule: 'SQF Code 2.8.3',
    requirement: 'Operators must maintain current certifications for all assigned production roles',
    severity: 'moderate',
    auditFinding: 'Kowalski L4 expires Jun 1 · Okonkwo L2 expires Jun 15 — both within the 18-day inspection window. Auditor will request full certification roster for all active lines.',
    closurePath: 'Schedule both renewal sessions this week · confirm enrollment before Jun 1',
    recallRisk: 0, contractRisk: 8000, daysToClose: 7,
    assignee: 'HR / Line Supervisor', link: '/operator', documented: 'May 28',
  },
]

// ─── Accountability Register — 2-column cards ─────────────────────────────────

function AccountabilityRegister() {
  const totalRecall   = RISK_FINDINGS.reduce((s, f) => s + f.recallRisk, 0)
  const totalContract = RISK_FINDINGS.reduce((s, f) => s + f.contractRisk, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Record header */}
      <div className="flex-shrink-0 border-b border-rule2 bg-stone2 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-body text-label text-muted">Accountability record as of Jun 2, 2026</div>
          <div className="font-body font-bold text-body text-ink mt-0.5">
            FDA / FSMA 204 · {RISK_FINDINGS.length} open items · Jun 3 inspection
          </div>
        </div>
        <div className="flex items-center gap-6">
          {totalRecall > 0 && (
            <div className="text-right">
              <div className="display-num text-metric font-bold text-danger tabular-nums leading-none">{fmtRisk(totalRecall)}</div>
              <div className="font-body text-label text-danger">recall exposure</div>
            </div>
          )}
          {totalContract > 0 && (
            <div className="text-right">
              <div className="display-num text-metric font-bold text-warn tabular-nums leading-none">{fmtRisk(totalContract)}</div>
              <div className="font-body text-label text-warn">contract risk</div>
            </div>
          )}
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4">
          {RISK_FINDINGS.map(f => {
            const isCrit      = f.severity === 'critical'
            const recallStr   = fmtRisk(f.recallRisk)
            const contractStr = fmtRisk(f.contractRisk)
            const closeColor  = f.daysToClose <= 2 ? 'text-danger' : f.daysToClose <= 7 ? 'text-warn' : 'text-muted'
            return (
              <Link key={f.id} to={f.link}
                className="block bg-stone border border-rule2 overflow-hidden hover:bg-stone2 transition-colors">
                <div className={`h-[3px] w-full ${isCrit ? 'bg-danger' : 'bg-warn'}`} />

                {/* Zone 1: Severity + urgency clock */}
                <div className="flex items-start justify-between px-4 pt-3 pb-2">
                  <StatusPill tone={isCrit ? 'danger' : 'warn'}>
                    {isCrit ? 'Warning Letter Risk' : 'Observation Risk'}
                  </StatusPill>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className={`display-num text-head font-bold tabular-nums leading-none ${closeColor}`}>{f.daysToClose}d</div>
                    <div className="font-body text-label text-muted">to close</div>
                  </div>
                </div>

                {/* Zone 2: Title + exposure */}
                <div className="px-4 pb-3">
                  <p className="font-body font-medium text-ink text-sub leading-snug mb-1.5">{f.title}</p>
                  {(recallStr || contractStr) && (
                    <div className="flex items-center gap-4">
                      {recallStr   && <span className="font-body text-body tabular-nums text-danger font-medium">{recallStr} recall exposure</span>}
                      {contractStr && <span className="font-body text-body tabular-nums text-warn font-medium">{contractStr} contract risk</span>}
                    </div>
                  )}
                </div>

                {/* Zone 3: Regulation + auditor finding — side by side */}
                <div className="mx-4 mb-0 grid grid-cols-2 gap-2">
                  <div className="border border-rule2 bg-stone2 px-3 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Scale size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                      <span className="font-body font-semibold text-ink text-label truncate">{f.rule}</span>
                    </div>
                    <p className="font-body text-muted text-label leading-relaxed">{f.requirement}</p>
                  </div>
                  <div className="border border-rule2 bg-stone px-3 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Eye size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                      <span className="font-body font-semibold text-ink text-label">What the auditor will flag</span>
                    </div>
                    <p className="font-body text-muted text-label leading-relaxed">{f.auditFinding}</p>
                  </div>
                </div>

                {/* Zone 4: Closure band — action + accountability trail */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 mt-2 bg-stone2 border-t border-rule2">
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-label text-ink leading-snug">{f.closurePath}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <User size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                      <span className="font-body text-label text-muted">{f.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} strokeWidth={2} className="text-muted flex-shrink-0" />
                      <span className="font-body text-label text-muted">{f.documented}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Defensibility score band ─────────────────────────────────────────────────

function AuditBand({ onSimulate }) {
  const passes = AUDIT_CHECKS.filter(c => c.result === 'pass').length
  const fails  = AUDIT_CHECKS.filter(c => c.result === 'fail').length
  const atRisk = AUDIT_CHECKS.filter(c => c.result === 'at-risk').length
  const score  = Math.round((passes / AUDIT_CHECKS.length) * 100)
  const scoreC = score >= 80 ? 'text-ok' : score >= 60 ? 'text-warn' : 'text-danger'
  const barC   = score >= 80 ? 'bg-ok'   : score >= 60 ? 'bg-warn'   : 'bg-danger'
  return (
    <div className="flex-shrink-0 flex items-center border-b border-rule2 bg-stone2">
      <div className="flex items-baseline gap-2 px-5 py-2.5 border-r border-rule2">
        <span className={`display-num text-head tabular-nums leading-none ${scoreC}`}>{score}%</span>
        <span className="font-body text-muted text-label">defensibility score</span>
      </div>
      <div className="flex items-center gap-4 px-5 py-2.5 flex-1">
        <span className="font-body text-danger text-label font-medium">{fails} fail</span>
        <span className="font-body text-warn text-label">{atRisk} at risk</span>
        <span className="font-body text-ok text-label">{passes} pass</span>
        <div className="flex-1 h-1 bg-rule2 ml-2 overflow-hidden">
          <div className={`h-full ${barC}`} style={{ width: `${score}%` }} />
        </div>
      </div>
      <div className="px-4 py-2.5 flex-shrink-0">
        <button type="button" onClick={onSimulate}
          className="font-body text-label text-muted px-3 py-1.5 border border-rule2 hover:border-muted hover:text-ink transition-colors">
          Simulate audit →
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function CompliancePolicy() {
  const [selectedId, setSelectedId] = useState('fda-us')
  const [auditOpen, setAuditOpen]   = useState(false)
  const policy = compliancePolicies.find(p => p.id === selectedId)

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
  const failCount   = AUDIT_CHECKS.filter(c => c.result === 'fail').length
  const atRiskCount = AUDIT_CHECKS.filter(c => c.result === 'at-risk').length

  const statement = policy?.nextInspection
    ? `${failCount} gap${failCount !== 1 ? 's' : ''} must close before ${policy.nextInspection.authority} arrives — ${atRiskCount} more at risk`
    : policy?.status === 'inactive'
    ? `Not enforced · ${policy.frameworks.length} frameworks awaiting activation`
    : policy?.status === 'monitoring'
    ? `Monitoring only · ${policy.frameworks.length} frameworks tracked · not yet enforced`
    : `${activeCount} of ${policy?.frameworks?.length} frameworks active`

  const metaItems = [
    policy?.nextInspection && { icon: Scale,       value: policy.nextInspection.authority },
    policy?.openItems?.capaCount > 0    && { icon: ShieldAlert, value: `${policy.openItems.capaCount} open` },
    policy?.openItems?.overdueCount > 0 && { icon: AlarmClock,  value: policy.openItems.overdueCount, color: 'var(--color-danger)' },
    policy?.activeSince && { icon: FileClock, value: policy.activeSince },
  ].filter(Boolean)

  const [compTab, setCompTab] = useState('register')

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <Tabs tabs={[{id:'register',label:'Register'},{id:'traceability',label:'Traceability'}]} active={compTab} onChange={setCompTab} />
      {compTab === 'traceability' && <div className="flex flex-1 min-h-0 overflow-hidden"><RecordVault /></div>}
      {compTab === 'register' && <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left: policy selector ─────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">

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
                  <span className={`font-body text-label ${statusColor}`}>{STATUS_LABEL[p.status]}</span>
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

        <div className="flex-shrink-0 px-5 py-3 border-t border-rule2 bg-stone2">
          <div className="font-body text-label text-muted mb-1.5">Export markets</div>
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
            module="Accountability"
            context={`${policy.name} · ${policy.jurisdiction}`}
            metric={heroMetric}
            metricLabel={heroLabel}
            statement={statement}
            tone={heroTone}
            meta={metaItems}
          />

          {policy.nextInspection && (
            <AuditBand onSimulate={() => setAuditOpen(true)} />
          )}

          {/* Full-width content */}
          {policy.nextInspection ? (
            <AccountabilityRegister />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <PolicySectionHeader label="Frameworks" count={`${policy.frameworks.length} configured`} />
              {policy.frameworks.map((f, i) => <FrameworkRow key={f.id} f={f} index={i} />)}
              <PolicySectionHeader label="Evidence" count={`${policy.evidenceRequirements.length} requirements`} />
              {policy.evidenceRequirements.map((e, i) => <EvidenceRow key={i} e={e} index={i} />)}
            </div>
          )}
        </div>
      )}
      </div>} {/* end register tab */}
    </div>
  )
}
