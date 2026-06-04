// SecurityIQ — AI governance, OT access posture, and model provenance data

export const securityPosture = {
  score: 68,
  status: 'partial', // ok | partial | degraded
  lastAssessed: 'May 15, 2026',
  openFindings: 6,
  findingsBySeverity: { critical: 1, high: 2, medium: 3, low: 0 },
  categoryScores: [
    { id: 'network',    label: 'Network & Identity',    pass: 4, warn: 1, fail: 1, total: 6 },
    { id: 'assets',     label: 'Assets & Hardening',    pass: 4, warn: 1, fail: 0, total: 5 },
    { id: 'monitoring', label: 'Monitoring & Response', pass: 4, warn: 0, fail: 1, total: 5 },
    { id: 'people',     label: 'People & Process',      pass: 2, warn: 1, fail: 1, total: 4 },
  ],
  // Director-level narrative
  narrative: 'AI governance policy missing — the most common vector for AI-related data breaches. OT egress gap on Oven B SCADA and one active shadow AI investigation require attention before the FDA audit window.',
}

// 20-point OT cyber hygiene checklist from ISA/IEC 62443 + IBM/Yokogawa guidance
export const hygieneChecks = [
  // Network & Identity
  {
    id: 'h1', category: 'Network & Identity', status: 'pass',
    label: 'Zones/Conduits per ISA/IEC 62443',
    detail: 'OT network segmented into 4 zones with defined conduits — reviewed February 2026.',
  },
  {
    id: 'h2', category: 'Network & Identity', status: 'pass',
    label: 'MFA for remote access; JIT/JEA for admins',
    detail: 'MFA enabled for all remote sessions. Just-in-time access applied to admin accounts.',
  },
  {
    id: 'h3', category: 'Network & Identity', status: 'fail', severity: 'high',
    label: 'No direct internet from OT; egress filtering',
    detail: 'Oven B SCADA controller (Node OT-B-07) has unfiltered egress to external DNS. Packet filtering not applied after the March network reconfiguration.',
    finding: 'Ticket OT-2604-012 open — patch scheduled June 3. Until resolved, Oven B node can reach external hosts without logging.',
    remediation: 'Apply egress filter rule to OT-B-07 before June 3. Confirm with IT/OT security team.',
  },
  {
    id: 'h4', category: 'Network & Identity', status: 'pass',
    label: 'App whitelisting on HMIs/servers',
    detail: 'Whitelist applied to all 6 HMI stations — last verified May 14, 2026.',
  },
  {
    id: 'h5', category: 'Network & Identity', status: 'warn', severity: 'medium',
    label: 'Rotate and vault credentials; no shared accounts',
    detail: '2 shared service accounts still active — one for MES batch reporting, one for SCADA historian sync.',
    finding: 'Shared accounts were flagged in the January 2026 risk assessment. Remediation pushed twice due to schedule conflicts.',
    remediation: 'Convert to individual service accounts by May 22. IT has the migration plan ready.',
  },
  {
    id: 'h6', category: 'Network & Identity', status: 'pass',
    label: 'No internet DNS translation from OT network',
    detail: 'OT DNS resolver points to internal server only. External resolution blocked at the firewall.',
  },
  // Assets & Hardening
  {
    id: 'h7', category: 'Assets & Hardening', status: 'pass',
    label: 'Authoritative asset inventory (hardware, firmware, software)',
    detail: '52 assets registered — last verified May 14, 2026. Includes all HMI stations, PLCs, and sensors.',
  },
  {
    id: 'h8', category: 'Assets & Hardening', status: 'pass',
    label: 'Baseline configs; disable unused services/ports',
    detail: 'Config baseline applied May 8, 2026. Unused ports disabled on all HMI stations.',
  },
  {
    id: 'h9', category: 'Assets & Hardening', status: 'warn', severity: 'medium',
    label: 'Vendor-approved patch windows; rollback plan',
    detail: 'R-08 (Bosch SVE 2520) firmware update v5.0.2 pending. Approved by vendor — not yet applied due to maintenance scheduling.',
    finding: 'Patch has been pending since May 1. Firmware gap is 1 version behind recommended. Rollback plan documented.',
    remediation: 'Apply during next R-08 maintenance window — scheduled May 22. Rollback image confirmed.',
  },
  {
    id: 'h10', category: 'Assets & Hardening', status: 'pass',
    label: 'Secure logging on switches, firewalls, servers',
    detail: 'Centralized syslog active — 30-day retention on all network equipment and OT servers.',
  },
  {
    id: 'h11', category: 'Assets & Hardening', status: 'pass',
    label: 'Time sync and signed configs',
    detail: 'NTP sync verified across all OT assets. Config signing enabled — last rotation April 2026.',
  },
  // Monitoring & Response
  {
    id: 'h12', category: 'Monitoring & Response', status: 'pass',
    label: 'Passive OT network monitoring/DPI',
    detail: 'Passive monitoring active on all OT segments. Deep packet inspection enabled for Modbus and EtherNet/IP.',
  },
  {
    id: 'h13', category: 'Monitoring & Response', status: 'fail', severity: 'high',
    label: 'Alerting on unusual egress/large transfers',
    detail: 'No alert rule configured for data transfers > 50MB from OT segment. The May 10 shadow AI incident (ChatGPT session) was detected manually — not by automated alerting.',
    finding: 'Gap identified during post-incident review of SEC-2605-002. Alerting rule was removed during the March firewall update.',
    remediation: 'Re-add egress volume alert rule. Threshold: > 10MB to non-approved destinations triggers SOC notification.',
  },
  {
    id: 'h14', category: 'Monitoring & Response', status: 'pass',
    label: 'Incident playbooks aligned to plant roles',
    detail: 'Playbooks reviewed February 2026. Director, supervisor, and QA roles all have defined response paths.',
  },
  {
    id: 'h15', category: 'Monitoring & Response', status: 'pass',
    label: 'Gold image recovery for HMIs/servers',
    detail: 'Recovery images verified March 2026. Test restore completed on HMI-02.',
  },
  {
    id: 'h16', category: 'Monitoring & Response', status: 'pass',
    label: 'Offline, tested backups (projects, recipes, historian)',
    detail: 'Backups verified weekly — last test May 10. Includes MES projects, recipe library, and historian archive.',
  },
  // People & Process
  {
    id: 'h17', category: 'People & Process', status: 'pass',
    label: 'Quarterly awareness and phishing drills',
    detail: 'Last drill: April 2026 — 94% pass rate. Next scheduled: July 2026.',
  },
  {
    id: 'h18', category: 'People & Process', status: 'warn', severity: 'medium',
    label: 'Contractor/vendor access policies; session recording',
    detail: 'Session recording not enabled for contractor VPN sessions. Identified after SEC-2605-003 (J. Barker MES access from personal device).',
    finding: 'Contractor access policy was updated May 3 but session recording requires a VPN gateway config change — pending IT approval.',
    remediation: 'Enable session recording for all contractor VPN sessions by May 30. IT request submitted.',
  },
  {
    id: 'h19', category: 'People & Process', status: 'fail', severity: 'critical',
    label: 'AI governance for plant data and models',
    detail: 'No formal AI governance policy in place. Employees can submit plant data (SCADA readings, batch parameters, production schedules) to external AI tools without authorization controls.',
    finding: 'IBM 2025 data breach report: 97% of AI-related breaches involved lack of AI access controls. 63% of companies lack AI governance policies. Takorin is an AI platform ratifying compliance decisions — this gap is load-bearing.',
    remediation: 'Draft AI governance policy covering: approved tools, prohibited data categories, model access controls, and shadow AI reporting. Owner: plant director + IT/OT security.',
  },
  {
    id: 'h20', category: 'People & Process', status: 'pass',
    label: 'Annual risk assessment and penetration testing',
    detail: 'Last assessment: January 2026. Report filed in RecordVault. 3 findings — 2 closed, 1 in progress (h18).',
  },
]

// AI model registry — what's deployed, where it came from, when it was last validated
export const modelRegistry = [
  {
    id: 'model-shift',
    name: 'Shift Risk Model',
    agent: 'Pre-Shift Verification',
    version: '3.2.1',
    provider: 'Takorin ML',
    deployedDate: 'Apr 1, 2026',
    lastValidated: 'Apr 28, 2026',
    validationStatus: 'current',
    dataScope: ['SCADA sensor streams', 'MES schedule', 'HR certification registry', 'Startup checklists'],
    accessScope: 'Read-only across all sources — no write access',
    writeAccess: false,
    trainingCutoff: 'Mar 15, 2026',
    promptVersion: '1.0.0',
    confidenceMethod: 'Condition pass/fail scoring across startup conditions',
  },
  {
    id: 'model-supplier',
    name: 'Supplier Intelligence Model',
    agent: 'Supplier Intelligence',
    version: '2.1.0',
    provider: 'Takorin ML',
    deployedDate: 'Mar 15, 2026',
    lastValidated: 'Apr 10, 2026',
    validationStatus: 'current',
    dataScope: ['COA/Lot database', 'ERP ingredient master', 'FSMA traceability module'],
    accessScope: 'Read + recommend — no autonomous write access',
    writeAccess: false,
    trainingCutoff: 'Feb 28, 2026',
    promptVersion: '1.1.2',
    confidenceMethod: 'Binary COA presence check weighted by time-to-production urgency',
  },
  {
    id: 'model-maintenance',
    name: 'Predictive Maintenance Model',
    agent: 'Predictive Maintenance',
    version: '1.8.3',
    provider: 'Takorin ML',
    deployedDate: 'Feb 10, 2026',
    lastValidated: 'Mar 1, 2026',
    validationStatus: 'stale',
    staleDays: 76,
    staleNote: 'Model trained on data through January 2026. R-03 failure pattern matched against a 3-case precedent pool — 2 of those cases are from Line 6, not Line 4. Cross-line inference adds uncertainty.',
    dataScope: ['Robot telemetry', 'SCADA sensor streams', 'MES downtime records'],
    accessScope: 'Read + recommend + maintenance scheduling write',
    writeAccess: true,
    writeDetail: 'Can create maintenance tickets and book inspection windows',
    trainingCutoff: 'Jan 20, 2026',
    promptVersion: '1.0.2',
    confidenceMethod: 'Pattern similarity score vs. historical failure signatures, weighted by recency and line match',
    finding: 'Validation overdue by 76 days. Model is issuing bearing inspection recommendations based on a precedent pool that is growing stale. Recommend revalidation before the FDA audit window.',
  },
  {
    id: 'model-compliance',
    name: 'Compliance Monitor Model',
    agent: 'Compliance Monitor',
    version: '2.4.0',
    provider: 'Takorin ML',
    deployedDate: 'Apr 15, 2026',
    lastValidated: 'May 1, 2026',
    validationStatus: 'current',
    dataScope: ['SCADA sensor streams', 'Startup checklists', 'CAPA database', 'FSMA traceability module'],
    accessScope: 'Read + create-only (CAPA creation) — cannot close, modify, or delete cases',
    writeAccess: true,
    writeDetail: 'Can create CAPA records. Cannot close or modify existing cases.',
    trainingCutoff: 'Mar 31, 2026',
    promptVersion: '2.0.1',
    confidenceMethod: 'Signal strength × duration × corroboration — requires sustained reading above threshold',
  },
  {
    id: 'model-handoff',
    name: 'Handoff Synthesis Model',
    agent: 'Handoff Synthesis',
    version: '1.5.1',
    provider: 'Takorin ML',
    deployedDate: 'Mar 20, 2026',
    lastValidated: 'Apr 25, 2026',
    validationStatus: 'current',
    dataScope: ['All shift data', 'CAPA database', 'HR certification registry', 'Startup checklists'],
    accessScope: 'Read + draft-only — cannot sign or submit documents',
    writeAccess: false,
    trainingCutoff: 'Mar 10, 2026',
    promptVersion: '1.0.0',
    confidenceMethod: 'Data freshness score per item — staleness reduces per-item confidence',
  },
]

// Access audit log — recent agent and human actions with data scope
export const accessAuditLog = [
  {
    id: 'al1', timestamp: 'Today · 06:42', actor: 'Compliance Monitor v2.4.0', actorType: 'agent',
    action: 'Opened CAPA-2604-006 — CCP-3 temperature deviation',
    dataAccessed: ['SCADA sensor streams', 'Startup checklists'],
    authorized: true, tier: 3, outcome: 'approved',
  },
  {
    id: 'al2', timestamp: 'Today · 06:38', actor: 'J. Crocker (Director)', actorType: 'human',
    action: 'Ratified lot hold — Lot L-0891, ConAgra COA missing',
    dataAccessed: ['COA/Lot database', 'ERP ingredient master'],
    authorized: true, tier: 3, outcome: 'approved',
  },
  {
    id: 'al3', timestamp: 'Today · 05:45', actor: 'Supplier Intelligence v2.1.0', actorType: 'agent',
    action: 'Flagged COA missing — Lot L-0891, 4h 12m to production',
    dataAccessed: ['COA/Lot database', 'ERP ingredient master', 'FSMA traceability module'],
    authorized: true, tier: 2, outcome: 'recommended',
  },
  {
    id: 'al4', timestamp: 'Yesterday · 14:02', actor: 'D. Kowalski (Supervisor)', actorType: 'human',
    action: 'Signed shift handoff HO-2604161',
    dataAccessed: ['Shift data', 'CAPA database', 'HR certification registry'],
    authorized: true, tier: null, outcome: 'completed',
  },
  {
    id: 'al5', timestamp: 'Yesterday · 13:12', actor: 'Predictive Maintenance v1.8.3', actorType: 'agent',
    action: 'Recommended bearing inspection — R-03 Seal Press A',
    dataAccessed: ['Robot telemetry', 'SCADA sensor streams'],
    authorized: true, tier: 2, outcome: 'recommended',
  },
  {
    id: 'al6', timestamp: 'Yesterday · 09:15', actor: 'Risk Escalation v1.2.0', actorType: 'agent',
    action: 'Auto-escalated CAPA-2604-001 — 7 days overdue, 2nd notice',
    dataAccessed: ['CAPA database'],
    authorized: true, tier: 1, outcome: 'notified',
  },
  {
    id: 'al7', timestamp: 'May 15 · 06:12', actor: 'Pre-Shift Verification v3.2.1', actorType: 'agent',
    action: 'Verified startup conditions — Line 4 AM, all checks passed',
    dataAccessed: ['SCADA sensor streams', 'HR certification registry', 'Startup checklists'],
    authorized: true, tier: 0, outcome: 'autonomous',
  },
]

// Shadow AI — detected unauthorized AI activity
export const shadowAIEvents = [
  {
    id: 'sa1',
    timestamp: 'May 14 · 11:32',
    status: 'investigating',
    severity: 'high',
    actor: 'HMI Station 3 (Line 4 — Packaging)',
    description: 'Outbound HTTPS request to api.openai.com detected from HMI-03. No payload captured — content unknown. Station is used for packaging line monitoring.',
    dataAtRisk: 'Unknown — no session content captured. Potential exposure: production schedule, sensor readings, or quality log data.',
    ticket: 'SEC-2605-001',
    remediation: 'Egress rule applied to HMI-03. Station user interviewed — claims no knowledge of the request. Investigating whether a browser extension or scheduled script triggered the connection.',
    remediationStatus: 'open',
  },
  {
    id: 'sa2',
    timestamp: 'May 10 · 09:14',
    status: 'resolved',
    severity: 'medium',
    actor: 'F. Adeyemi — QA Workstation',
    description: 'ChatGPT session on QA workstation included a paste event containing batch parameters for Lot MC-3390 (Mozzarella). Employee was attempting to interpret a quality threshold discrepancy.',
    dataAtRisk: 'Batch parameters — Lot MC-3390 quality thresholds (temperature limits, moisture targets). No PII or financial data.',
    ticket: 'SEC-2605-002',
    remediation: 'Employee briefed on AI use policy. DLP rule added for batch parameter keyword patterns. AI governance policy gap documented in hygiene checklist (h19).',
    remediationStatus: 'closed',
  },
  {
    id: 'sa3',
    timestamp: 'May 3 · 15:47',
    status: 'resolved',
    severity: 'low',
    actor: 'J. Barker — Contractor (Maintenance)',
    description: 'Contractor accessed MES maintenance schedule via personal device over VPN. No AI tool involvement confirmed, but session was unrecorded — scope of access unknown.',
    dataAtRisk: 'MES maintenance schedule — equipment downtime windows, inspection dates.',
    ticket: 'SEC-2605-003',
    remediation: 'Session recording now required for all contractor VPN connections. Contractor access policy updated and re-distributed. J. Barker access reviewed.',
    remediationStatus: 'closed',
  },
]
