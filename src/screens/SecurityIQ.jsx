import { useState } from 'react'
import { securityPosture } from '../data/security'
import {
  AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, ChevronDown, Clock, User, Zap,
} from 'lucide-react'
import { SceneHeader, StatusPill, AnimatedScore, FilterDropdown } from '../components/UI'

// ─── Finding data — exposure-first structure ──────────────────────────────────

const FINDINGS = [
  {
    id: 'f-governance',
    label: 'AI governance policy missing',
    severity: 'critical',
    category: 'AI Governance',
    auditExposure: 'High',
    daysToClose: 3,
    whyItExists: 'Takorin operates 7 autonomous agents across compliance, maintenance, supplier, and shift functions. No approved AI usage policy exists at this facility. One shadow AI investigation is unresolved. The platform is making compliance-level recommendations without documented governance controls.',
    evidence: [
      'No approved AI governance document found in facility records',
      '7 AI agents operating autonomously — including Compliance Monitor, which auto-opens CAPAs',
      '1 active shadow AI investigation (HMI-03) with unknown data exposure scope',
      'No model approval registry in place — models deployed without formal authorization',
      'No prohibited data categories defined — any plant data can currently be submitted to external AI tools',
      'IBM 2025: 63% of companies lack AI governance policies. 97% of AI-related breaches involved missing access controls.',
    ],
    consequences: {
      audit: 'If an FDA auditor requests evidence of AI controls today, this facility cannot demonstrate approved AI usage, access governance, or model oversight. This is a direct finding under 21 CFR Part 11 electronic records requirements.',
      compliance: 'Agent-generated CAPAs and compliance records may be challenged if no governance framework backs the AI decisions that created them.',
      operational: 'The active shadow AI incident (HMI-03) cannot be fully assessed without a baseline policy defining what constitutes an unauthorized action.',
      cyber: 'Without a governance policy, employees have no guidance on which AI tools are permitted, what data may be submitted, or how to report a shadow AI incident — making recurrence likely.',
      accountability: 'Director ratification of agent decisions creates personal accountability. Without a governance policy, there is no documented standard against which those decisions were made.',
    },
    remediation: [
      { step: 'Assign policy owner', detail: 'Designate Plant Director and IT/OT Security as co-owners. Add to org chart.', effort: '30 min', owner: 'Plant Director' },
      { step: 'List all authorized AI tools', detail: 'Document Takorin and any approved third-party AI tools. All others are prohibited by default.', effort: '1 hour', owner: 'IT/OT Security' },
      { step: 'Define prohibited data categories', detail: 'Recipes, batch parameters, P&IDs, production schedules, sensor readings — prohibit submission to external AI tools.', effort: '2 hours', owner: 'Plant Director + QA' },
      { step: 'Define model access and approval process', detail: 'Document who can deploy or approve AI models. Reference the model registry in Security.', effort: '1 hour', owner: 'IT/OT Security' },
      { step: 'Publish and distribute policy', detail: 'Distribute to all supervisors and operators. Include in onboarding. Log distribution for audit trail.', effort: '1 hour', owner: 'HR + Plant Director' },
    ],
    totalEffort: '5–6 hours',
    owner: 'Plant Director + IT/OT Security',
    targetDate: '3 days — before FDA audit window',
  },
  {
    id: 'f-shadow-hmi3',
    label: 'Shadow AI investigation — HMI Station 3',
    severity: 'high',
    category: 'Shadow AI',
    auditExposure: 'High',
    daysToClose: 1,
    whyItExists: 'HMI Station 3 (Line 4 packaging) made an outbound HTTPS connection to api.openai.com on May 14 at 11:32. No payload was captured — the content of what was sent is unknown. The station user denies initiating the connection.',
    evidence: [
      'Network log: 2026-05-14 11:32:07 — OT-HMI-03 to api.openai.com:443',
      'No payload captured — TLS encryption prevented content inspection',
      'Station user (Line 4 packaging operator) denies initiating the request',
      'Investigation active: checking browser extensions and scheduled scripts on HMI-03',
      'Station has not been isolated — production continues on that station',
    ],
    consequences: {
      audit: 'If this represents unauthorized data submission to an external AI model, it is a data governance incident. Without a policy, the facility has no documented standard that was violated — which complicates any disciplinary or regulatory response.',
      compliance: 'Data submitted to external AI models may be retained and used for model training. If production schedules, sensor data, or batch parameters were submitted, that data is now outside the facility control.',
      operational: 'Production continues on HMI-03. If the connection was initiated by a script or extension, it may recur on every shift.',
      cyber: 'An outbound connection from an OT node to an external API is the exact attack vector described in the OT cybersecurity framework. Whether initiated by a user or a compromised script, the risk profile is identical.',
      accountability: 'Until the source is identified, the plant director cannot confirm whether this is a user behavior issue or a security compromise.',
    },
    remediation: [
      { step: 'Isolate HMI-03 from internet pending investigation', detail: 'Block outbound access from OT-HMI-03 until investigation concludes. Coordinate with Line 4 supervisor.', effort: '15 min', owner: 'IT/OT Security' },
      { step: 'Audit browser extensions and scheduled tasks on HMI-03', detail: 'Check for browser extensions, cron jobs, or scripts that could have triggered the connection. Review installation log.', effort: '2 hours', owner: 'IT Security' },
      { step: 'Interview station user formally', detail: 'Conduct a documented interview. Review what tasks were being performed at 11:32 on May 14.', effort: '1 hour', owner: 'Plant Director + HR' },
      { step: 'Determine data exposure scope', detail: 'If a script or extension initiated the connection, assess what data was accessible to it. Prepare a data exposure report.', effort: '2 hours', owner: 'IT Security' },
    ],
    totalEffort: '5 hours',
    owner: 'IT/OT Security + Plant Director',
    targetDate: '1 day — active investigation',
  },
  {
    id: 'f-egress',
    label: 'OT egress gap — Oven B SCADA unfiltered',
    severity: 'high',
    category: 'OT Hygiene',
    auditExposure: 'High',
    daysToClose: 7,
    whyItExists: 'Oven B SCADA controller (OT-B-07) has unfiltered outbound internet access. The filtering rule was not re-applied after a network reconfiguration in March 2026. The gap has been open for 6 weeks.',
    evidence: [
      'OT-B-07 (Oven B SCADA) can reach external hosts without logging — confirmed in passive network scan',
      'Egress filter rule was present before March 2026 network reconfiguration',
      'Rule not re-applied after the change — oversight in the change management process',
      'Maintenance ticket OT-2604-012 open since May 2, 2026 — patch not yet scheduled',
      'No data transfer has been detected to date — but the gap is unmonitored by design',
    ],
    consequences: {
      audit: 'ISA/IEC 62443 requires egress filtering on all OT nodes. This node is non-compliant. An audit would flag this as a control gap requiring written remediation.',
      compliance: 'If an OT data breach occurs through this node, the lack of filtering eliminates the defense that outbound traffic was controlled.',
      operational: 'Unmonitored egress means any malware or unauthorized script on OT-B-07 could exfiltrate production data without triggering an alert.',
      cyber: 'This is the same vector that shadow AI incidents exploit — outbound connections from OT nodes to external services.',
      accountability: null,
    },
    remediation: [
      { step: 'Apply egress filter rule to OT-B-07', detail: 'Add the same egress filter rule removed in March. Configuration is documented in the March change log.', effort: '30 min', owner: 'IT/OT Security' },
      { step: 'Confirm no data was exfiltrated', detail: 'Review outbound traffic logs from OT-B-07 for the 6-week gap period. Flag any anomalies.', effort: '1 hour', owner: 'IT Security' },
      { step: 'Update change management checklist', detail: 'Add egress filter verification to the network reconfiguration checklist to prevent recurrence.', effort: '30 min', owner: 'IT/OT Security' },
    ],
    totalEffort: '2 hours',
    owner: 'IT/OT Security',
    targetDate: '7 days',
  },
  {
    id: 'f-alerting',
    label: 'No alerting on large OT data transfers',
    severity: 'high',
    category: 'OT Hygiene',
    auditExposure: 'High',
    daysToClose: 7,
    whyItExists: 'The alert rule for outbound data transfers exceeding 50MB from the OT network was removed during the March 2026 firewall update. The May 10 shadow AI incident was detected manually during a routine review — not by automated alerting.',
    evidence: [
      'Alert rule confirmed removed in post-incident review of SEC-2605-002 (May 10 ChatGPT incident)',
      'May 10 incident: operator submitted batch parameters to ChatGPT — detected by manual review, not alerting',
      'No automated detection for data transfers above 10MB to non-approved destinations',
      'Rule was standard practice before March 2026 firewall update',
    ],
    consequences: {
      audit: 'Without transfer volume alerting, the facility cannot demonstrate active monitoring of OT data leaving the network — a gap under ISA/IEC 62443 monitoring requirements.',
      compliance: null,
      operational: 'The next shadow AI incident will not be detected until a manual review catches it — which may be days or weeks later.',
      cyber: 'Automated detection is the only scalable defense against shadow AI at operator scale. Without it, policy alone is insufficient.',
      accountability: null,
    },
    remediation: [
      { step: 'Re-add egress volume alert rule', detail: 'Alert threshold: above 10MB to any non-approved destination triggers SOC notification. Reference the pre-March configuration.', effort: '1 hour', owner: 'IT Security' },
      { step: 'Test the alert fires correctly', detail: 'Simulate a 15MB transfer to a non-approved endpoint and confirm the alert triggers.', effort: '30 min', owner: 'IT Security' },
    ],
    totalEffort: '1.5 hours',
    owner: 'IT Security',
    targetDate: '7 days',
  },
  {
    id: 'f-model-stale',
    label: 'Predictive maintenance model — 76 days past validation',
    severity: 'high',
    category: 'Models',
    auditExposure: 'Medium',
    daysToClose: 5,
    whyItExists: 'The Predictive Maintenance model (v1.8.3) was last validated on March 1, 2026. It is now 76 days past its validation window. You recently ratified its recommendation to schedule an R-03 bearing inspection — a decision based on a 3-case precedent pool, 2 of which are from a different production line.',
    evidence: [
      'Model v1.8.3 — training cutoff January 20, 2026 — last validated March 1, 2026',
      '76 days past the scheduled validation window with no revalidation scheduled',
      'R-03 bearing recommendation issued based on a 3-case precedent pool',
      '2 of 3 precedents are from Line 6, not Line 4 — cross-line inference carries uncertainty',
      'Director ratified this recommendation at 13:23 today — it is now part of the compliance record',
    ],
    consequences: {
      audit: 'If questioned, the ratified R-03 decision cannot be supported by a current validation record. A 76-day gap with no revalidation scheduled is a defensible weakness.',
      compliance: 'Model-generated maintenance recommendations that lead to production decisions must be traceable to validated, current model versions.',
      operational: 'If the recommendation is incorrect — because it was trained on stale or cross-line data — the bearing inspection tonight may miss a real fault or generate unnecessary downtime.',
      cyber: null,
      accountability: 'Director ratification of a Tier 3 recommendation creates personal accountability. Stale model validation weakens the defensibility of that decision.',
    },
    remediation: [
      { step: 'Schedule model revalidation with Takorin ML', detail: 'Request a Line 4-specific validation run. Requires 24 hours of fresh telemetry data.', effort: '30 min to schedule', owner: 'Operations + Takorin ML' },
      { step: 'Flag the R-03 decision in the audit record', detail: 'Add a note documenting that validation was pending at time of approval. This is the responsible disclosure.', effort: '15 min', owner: 'Plant Director' },
      { step: 'Pause new high-stakes decisions until revalidated', detail: 'Routine monitoring continues. Escalate any new equipment recommendations to manual review until validation is complete.', effort: 'Ongoing', owner: 'Operations' },
    ],
    totalEffort: '1 hour + 24-hour validation window',
    owner: 'Operations + Takorin ML',
    targetDate: '5 days',
  },
  {
    id: 'f-shared-accounts',
    label: 'Shared service accounts still active',
    severity: 'medium',
    category: 'OT Hygiene',
    auditExposure: 'Medium',
    daysToClose: 14,
    whyItExists: 'Two shared service accounts are in use: one for MES batch reporting, one for SCADA historian sync. These were flagged in the January 2026 risk assessment. Remediation has been deferred twice due to schedule conflicts. IT has a migration plan ready but it has not been scheduled.',
    evidence: [
      'Account audit: 2 shared service accounts active — svc_mes_batch and svc_scada_hist',
      'Both accounts used for automated scheduled data sync with no individual attribution',
      'Flagged in January 2026 risk assessment with a 30-day remediation target',
      'Remediation deferred: February (resource conflict), April (production freeze)',
      'IT has a migration plan ready and has confirmed no production impact',
    ],
    consequences: {
      audit: 'Shared credentials are a standard finding in any OT or IT security audit. ISA/IEC 62443 requires individual accountability. If an incident occurs on a system accessed by shared accounts, attribution is impossible.',
      compliance: null,
      operational: 'No current operational impact. Risk is in accountability traceability and audit defensibility.',
      cyber: 'Shared accounts reduce the effective security of credential rotation — if one system using the account is compromised, the credential is valid across all systems where it is used.',
      accountability: 'If an incident involves MES or SCADA historian data, the shared account prevents identifying who or what performed the action.',
    },
    remediation: [
      { step: 'Schedule migration with IT', detail: 'IT has the migration plan ready. Book a 4-hour maintenance window. No production impact expected.', effort: '4 hours (IT-led)', owner: 'IT Security' },
      { step: 'Test automated sync after migration', detail: 'Verify MES batch reporting and SCADA historian sync function correctly with new individual service accounts.', effort: '1 hour', owner: 'IT + Operations' },
    ],
    totalEffort: '5 hours (IT-led)',
    owner: 'IT Security',
    targetDate: '14 days',
  },
  {
    id: 'f-session-recording',
    label: 'Contractor VPN — session recording not enabled',
    severity: 'medium',
    category: 'OT Hygiene',
    auditExposure: 'Medium',
    daysToClose: 14,
    whyItExists: 'Session recording was not enabled for contractor VPN sessions. This was identified after SEC-2605-003, where contractor J. Barker accessed the MES maintenance schedule from a personal device over VPN. The session content was unrecorded, so the scope of access could not be confirmed.',
    evidence: [
      'SEC-2605-003 (May 3): contractor accessed MES maintenance schedule via personal device over VPN',
      'Session recording was not active at the time of the incident',
      'Contractor access policy updated May 3 — session recording requires a separate VPN gateway config change',
      'IT approval for the config change is pending',
    ],
    consequences: {
      audit: 'Contractor access without session recording cannot be audited. If a contractor misuses access, the incident cannot be reconstructed.',
      compliance: null,
      operational: null,
      cyber: 'Contractor VPN is a common attack vector. Without session recording, a compromised contractor credential cannot be detected through behavioral analysis.',
      accountability: 'If a future contractor incident occurs, the facility will again be unable to determine scope of access.',
    },
    remediation: [
      { step: 'Approve VPN gateway session recording config change', detail: 'Config change is drafted and pending IT approval. Approve and deploy.', effort: '2 hours (IT-led)', owner: 'IT Security' },
      { step: 'Verify session recording active for all contractor sessions', detail: 'Test with a contractor login and confirm session is captured.', effort: '30 min', owner: 'IT Security' },
    ],
    totalEffort: '2.5 hours (IT-led)',
    owner: 'IT Security',
    targetDate: '14 days',
  },
]

// ─── Shared config ────────────────────────────────────────────────────────────

const SEV_ORDER  = { critical: 0, high: 1, medium: 2, low: 3 }
const SORTED     = [...FINDINGS].sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3))
const SEV_TONE   = { critical: 'danger', high: 'danger', medium: 'warn', low: 'muted' }

const CAT_OPTIONS = [
  { value: 'all',           label: 'All categories' },
  { value: 'AI Governance', label: 'AI Governance'  },
  { value: 'OT Hygiene',    label: 'OT Hygiene'     },
  { value: 'Models',        label: 'Models'          },
  { value: 'Shadow AI',     label: 'Shadow AI'       },
]

const CONSEQUENCE_LABELS = {
  audit:          'Audit exposure',
  compliance:     'Compliance exposure',
  operational:    'Operational exposure',
  cyber:          'Cybersecurity exposure',
  accountability: 'Accountability exposure',
}

// ─── Finding row ──────────────────────────────────────────────────────────────

function FindingRow({ finding, selected, onClick }) {
  const isSelected = selected?.id === finding.id
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left flex items-start gap-4 px-5 py-4 border-b border-rule2 transition-colors ${
        isSelected ? 'bg-stone3' : 'hover:bg-stone2/50'
      }`}>
      <div className="flex-1 min-w-0">
        <div className="font-body font-medium text-ink text-body leading-snug mb-1.5">{finding.label}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone={SEV_TONE[finding.severity]} className="capitalize">{finding.severity}</StatusPill>
          <span className="font-body text-label text-muted">{finding.category}</span>
          <span className="font-body text-label text-muted opacity-40">·</span>
          <span className="font-body text-label text-muted">Audit: {finding.auditExposure}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className={`font-body font-bold text-sub tabular-nums leading-none ${finding.daysToClose <= 3 ? 'text-danger' : finding.daysToClose <= 7 ? 'text-warn' : 'text-muted'}`}>
          {finding.daysToClose}d
        </div>
        <div className="font-body text-label text-muted">to close</div>
      </div>
      <ChevronRight size={12} strokeWidth={2} className={`flex-shrink-0 mt-1 transition-transform ${isSelected ? 'rotate-90 text-signal' : 'text-muted'}`} />
    </button>
  )
}

// ─── Drill-down panel ─────────────────────────────────────────────────────────

function DrillDown({ finding }) {
  const [remOpen, setRemOpen] = useState(false)

  if (!finding) return (
    <div className="flex items-center justify-center h-full font-body text-muted text-label">
      Select a finding
    </div>
  )

  const consequences = Object.entries(finding.consequences).filter(([, v]) => v)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-rule2 bg-stone2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusPill tone={SEV_TONE[finding.severity]} className="capitalize">{finding.severity}</StatusPill>
          <span className="font-body text-label text-muted">Audit exposure: {finding.auditExposure}</span>
          <span className="font-body text-label text-muted opacity-40">·</span>
          <span className={`font-body text-label font-semibold ${finding.daysToClose <= 3 ? 'text-danger' : finding.daysToClose <= 7 ? 'text-warn' : 'text-muted'}`}>
            {finding.daysToClose}d to close
          </span>
        </div>
        <div className="font-display font-bold text-ink text-head leading-tight">{finding.label}</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[660px] px-6 py-6 space-y-8">

          {/* Why this exists */}
          <section>
            <div className="font-body text-label font-semibold text-muted mb-3">Why this exists</div>
            <p className="font-body text-body text-ink leading-relaxed">{finding.whyItExists}</p>
          </section>

          {/* Evidence */}
          <section>
            <div className="font-body text-label font-semibold text-muted mb-3">Evidence</div>
            <div className="border border-rule2 divide-y divide-rule2">
              {finding.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-signal flex-shrink-0 mt-1.5" />
                  <span className="font-body text-body text-muted leading-snug">{e}</span>
                </div>
              ))}
            </div>
          </section>

          {/* What happens if ignored */}
          <section>
            <div className="font-body text-label font-semibold text-muted mb-3">What happens if ignored</div>
            <div className="space-y-2">
              {consequences.map(([key, val]) => (
                <div key={key} className={`px-4 py-3 border-l-[3px] ${key === 'audit' ? 'border-l-danger bg-danger/[0.03]' : 'border-l-warn bg-warn/[0.02]'}`}>
                  <div className={`font-body text-label font-semibold mb-1 ${key === 'audit' ? 'text-danger' : 'text-warn'}`}>
                    {CONSEQUENCE_LABELS[key]}
                  </div>
                  <p className="font-body text-label text-muted leading-snug">{val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended remediation — collapsed by default */}
          <section>
            <button type="button" onClick={() => setRemOpen(o => !o)}
              className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity">
              <div className="font-body text-label font-semibold text-muted">Recommended remediation</div>
              <div className="flex items-center gap-2">
                <span className="font-body text-label text-muted">Est. {finding.totalEffort}</span>
                <ChevronDown size={11} strokeWidth={2} className={`text-muted transition-transform ${remOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {!remOpen && (
              <button type="button" onClick={() => setRemOpen(true)}
                className="mt-3 flex items-center gap-1.5 font-body text-label text-signal hover:text-ink transition-colors">
                <Zap size={10} strokeWidth={2} />
                Show {finding.remediation.length} sequential steps
              </button>
            )}

            {remOpen && (
              <div className="mt-3 space-y-2">
                {finding.remediation.map((r, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3 bg-stone2 border border-rule2">
                    <span className="font-body text-label font-bold text-signal w-5 flex-shrink-0 tabular-nums mt-px">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-medium text-ink text-body mb-0.5">{r.step}</div>
                      <div className="font-body text-label text-muted leading-snug mb-2">{r.detail}</div>
                      <div className="flex items-center gap-4">
                        <span className="font-body text-label text-muted flex items-center gap-1">
                          <Clock size={9} strokeWidth={2} className="flex-shrink-0" />{r.effort}
                        </span>
                        <span className="font-body text-label text-muted flex items-center gap-1">
                          <User size={9} strokeWidth={2} className="flex-shrink-0" />{r.owner}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Owner + target date */}
          <section className="grid grid-cols-2 gap-4 border-t border-rule2 pt-6">
            <div>
              <div className="font-body text-label font-semibold text-muted mb-2">Owner</div>
              <div className="font-body text-body text-ink">{finding.owner}</div>
            </div>
            <div>
              <div className="font-body text-label font-semibold text-muted mb-2">Target date</div>
              <div className={`font-body text-body font-medium ${finding.daysToClose <= 3 ? 'text-danger' : finding.daysToClose <= 7 ? 'text-warn' : 'text-ink'}`}>
                {finding.targetDate}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SecurityIQ() {
  const [selected, setSelected] = useState(FINDINGS[0])
  const [category, setCategory] = useState('all')

  const filtered     = category === 'all' ? SORTED : SORTED.filter(f => f.category === category)
  const criticalCount = FINDINGS.filter(f => f.severity === 'critical').length
  const activeIncident = FINDINGS.find(f => f.id === 'f-shadow-hmi3')
  const score        = securityPosture.score
  const scoreColor   = score >= 80 ? 'var(--color-ok)' : score >= 60 ? 'var(--color-warn)' : 'var(--color-danger)'

  const narrative = [
    criticalCount > 0 ? `${criticalCount} critical finding — AI governance policy missing` : null,
    activeIncident ? 'Shadow AI investigation active on HMI Station 3' : null,
  ].filter(Boolean).join(' · ') || 'No critical findings'

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">
      <SceneHeader
        metric={score}
        metricLabel="security posture"
        metricColor={scoreColor}
        statement={narrative}
        tone={score >= 60 ? 'warn' : 'danger'}
        meta={[
          { label: 'Open findings', value: String(FINDINGS.length) },
          { label: 'Critical',      value: String(criticalCount), color: criticalCount > 0 ? 'var(--color-danger)' : undefined },
          { label: 'Last assessed', value: securityPosture.lastAssessed },
        ]}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: command surface */}
        <div className="w-[360px] flex-shrink-0 border-r border-rule2 flex flex-col">
          <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-rule2 bg-stone">
            <FilterDropdown
              label="Category"
              options={CAT_OPTIONS}
              value={category}
              onChange={setCategory}
            />
            <span className="ml-auto font-body text-label text-muted">
              {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(f => (
              <FindingRow key={f.id} finding={f}
                selected={selected}
                onClick={() => setSelected(f)} />
            ))}
          </div>
        </div>

        {/* Right: drill-down */}
        <div className="flex-1 overflow-hidden bg-stone">
          <DrillDown finding={selected} />
        </div>
      </div>
    </div>
  )
}
