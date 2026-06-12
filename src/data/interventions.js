// Intervention event store — the operational feedback loop.
// Each record is a complete event chain: AI observation → human decision → operational consequence.

export const interventions = [
  {
    id: 'INT-2026-047-01',
    // Recommendation
    agent: 'QualityGuard',
    agentTier: 'execute',
    action: 'Micro-hold on Batch BTH-2026-047 — benzaldehyde deviation',
    rationaleText: 'Benzaldehyde 14% below baseline for 3 consecutive hours. Trend: continuing decline. Risk: grade degradation if fermentation continues uncorrected at current trajectory.',
    recommendedAt: '2026-05-14T09:15:00Z',
    recommendedLabel: 'May 14, 09:15',
    kpiTarget: 'batch-hold-duration',

    // Source signals
    sourceSignals: [
      { name: 'Benzaldehyde (LIMS)', value: '0.43 mg/L', baseline: '0.50–0.65 mg/L', freshnessMin: 3, stale: false },
      { name: 'Fermentation temp (historian)', value: '29.4°C', baseline: '26–30°C', freshnessMin: 1, stale: false },
      { name: 'pH (sensor array)', value: '4.7', baseline: '4.4–5.2', freshnessMin: 2, stale: false },
    ],
    signalCompleteness: 1.0,
    freshnessState: 'fresh',

    // Human review
    reviewedBy: 'D. Kowalski',
    reviewRole: 'Supervisor',
    dwellTimeMs: 34200,
    decision: 'approved',
    overrideReason: null,
    decisionLabel: 'May 14, 09:17',

    // Before state
    metricsBefore: { batchConfidence: 82, holdDurationH: 0, benzaldehyde: 0.43 },

    // Action
    actionTaken: 'Micro-hold applied — fermentation paused pending expert review',
    actionLabel: 'May 14, 09:17',

    // After state (from telemetry)
    metricsAfter: { batchConfidence: 86, holdDurationH: 2.3, benzaldehyde: 0.51 },
    metricsUpdatedLabel: 'May 14, 11:33',

    // Outcome
    outcomeClassification: 'positive',
    outcomeNotes: 'Benzaldehyde recovered to 0.51 mg/L within 2.3h. Expert review confirmed minor temp adjustment needed. Batch resumed. Hold duration 2.3h vs. 18h historical average for corrective interventions.',
    kpiDelta: { metric: 'Hold duration', before: '18h avg (corrective)', after: '2.3h', direction: 'improvement', pct: 87 },
    wasReversed: false,
    attributionConfidence: 0.81,
    operatorConfirmation: {
      confirmedBy: 'C. Reyes',
      confirmedAt: 'May 14, 09:22',
      station: 'Vessel F-047 monitoring',
      note: 'Post-hold benzaldehyde reading taken and logged · 0.51 mg/L · Within spec',
    },
  },
  {
    id: 'INT-2026-038-01',
    agent: 'QualityGuard',
    agentTier: 'recommend',
    action: 'Grade revision — Batch BTH-2026-038, Premium → Standard',
    rationaleText: 'Amino nitrogen trending 4% below spec for 6 consecutive days. Historical comparable batches with this pattern (n=4) resolved as Standard-grade 3 of 4 times.',
    recommendedAt: '2026-05-15T16:30:00Z',
    recommendedLabel: 'May 15, 16:30',
    kpiTarget: 'deviation-recurrence',

    sourceSignals: [
      { name: 'Amino nitrogen (LIMS)', value: '0.76 g/100mL', baseline: '0.80–0.95 g/100mL', freshnessMin: 18, stale: false },
      { name: 'Fermentation temp (historian)', value: '26.8°C', baseline: '24–28°C', freshnessMin: 2, stale: false },
    ],
    signalCompleteness: 0.67,
    freshnessState: 'fresh',

    reviewedBy: 'D. Kowalski',
    reviewRole: 'Supervisor',
    dwellTimeMs: 4800,
    decision: 'rejected',
    overrideReason: 'I believe the batch will recover — temp correction applied this morning.',
    decisionLabel: 'May 15, 16:35',

    metricsBefore: { batchConfidence: 76, holdDurationH: 0, aminoNitrogen: 0.76 },

    actionTaken: 'No action — recommendation rejected',
    actionLabel: 'May 15, 16:35',

    metricsAfter: { batchConfidence: 71, holdDurationH: 0, aminoNitrogen: 0.74 },
    metricsUpdatedLabel: 'May 16, 09:00',

    outcomeClassification: 'unclear',
    outcomeNotes: 'Amino nitrogen continued to decline after rejection. Batch now pending QP disposition. Final grade unknown. Supervisor\'s predicted recovery has not materialized as of Day 91.',
    kpiDelta: { metric: 'Batch confidence', before: '76%', after: '71%', direction: 'degradation', pct: -7 },
    wasReversed: false,
    attributionConfidence: 0.52,
    cautionNote: 'Low dwell time (4.8s) on this rejection. Rationale may not have been fully reviewed.',
  },
  {
    id: 'INT-2026-013-01',
    agent: 'ScheduleOptimizer',
    agentTier: 'execute',
    action: 'Rescheduled Line 3 changeover — 14:20 → 13:50',
    rationaleText: 'Downstream buffer at 94% capacity. 30-min early changeover prevents overflow event. No quality impact — current run is in cooling phase.',
    recommendedAt: '2026-05-16T13:48:00Z',
    recommendedLabel: 'May 16, 13:48',
    kpiTarget: 'throughput',

    sourceSignals: [
      { name: 'Buffer level (OPC-UA)', value: '94%', baseline: '<85% optimal', freshnessMin: 1, stale: false },
      { name: 'Line 3 cycle state (MES)', value: 'Cooling phase', baseline: 'N/A', freshnessMin: 1, stale: false },
    ],
    signalCompleteness: 1.0,
    freshnessState: 'fresh',

    reviewedBy: 'System (auto-executed)',
    reviewRole: 'Execute tier',
    dwellTimeMs: 0,
    decision: 'auto-executed',
    overrideReason: null,
    decisionLabel: 'May 16, 13:48',

    metricsBefore: { throughputPct: 91, bufferLevel: 94, overflowRisk: 'high' },

    actionTaken: 'Changeover rescheduled — Line 3 stop moved to 13:50',
    actionLabel: 'May 16, 13:48',

    metricsAfter: { throughputPct: 94, bufferLevel: 78, overflowRisk: 'low' },
    metricsUpdatedLabel: 'May 16, 15:00',

    outcomeClassification: 'positive',
    outcomeNotes: 'Buffer level normalized to 78% post-changeover. No overflow event. Throughput recovered to 94%. Action was subsequently rolled back at 14:05 when upstream feed rate recovered — schedule reverted to 14:20 without disruption.',
    kpiDelta: { metric: 'Throughput', before: '91%', after: '94%', direction: 'improvement', pct: 3 },
    wasReversed: true,
    reversedAt: 'May 16, 14:05',
    reversalReason: 'Upstream feed rate recovered — early changeover no longer needed. System auto-reverted.',
    attributionConfidence: 0.74,
  },
  {
    id: 'INT-2026-022-01',
    agent: 'SupplierBroker',
    agentTier: 'execute',
    action: 'Auto-issued PO — soy concentrate, Pacific Rim Exports, 22 MT',
    rationaleText: 'Inventory below 7-day threshold. Pacific Rim Exports is a pre-approved supplier within standing $85k volume authority. Lead time 14 days — order now prevents a stockout.',
    recommendedAt: '2026-05-16T11:22:00Z',
    recommendedLabel: 'May 16, 11:22',
    kpiTarget: 'supply-continuity',

    sourceSignals: [
      { name: 'Soy concentrate inventory (ERP)', value: '6.8 days', baseline: '>10 days target', freshnessMin: 240, stale: true },
      { name: 'Supplier lead time (procurement DB)', value: '14 days', baseline: 'N/A', freshnessMin: 2880, stale: true },
    ],
    signalCompleteness: 0.80,
    freshnessState: 'degraded',

    reviewedBy: 'System (auto-executed)',
    reviewRole: 'Execute tier',
    dwellTimeMs: 0,
    decision: 'auto-executed',
    overrideReason: null,
    decisionLabel: 'May 16, 11:22',

    metricsBefore: { inventoryDays: 6.8, supplyRisk: 'high' },

    actionTaken: 'PO issued — 22 MT soy concentrate, ETA Jun 1',
    actionLabel: 'May 16, 11:22',

    metricsAfter: { inventoryDays: 24.8, supplyRisk: 'low' },
    metricsUpdatedLabel: 'Jun 01 (projected)',

    outcomeClassification: 'positive',
    outcomeNotes: 'PO confirmed. Delivery scheduled Jun 1. No supply disruption expected. Note: ERP inventory signal was 4h stale at time of decision — actual inventory may have differed. Attribution confidence reduced.',
    kpiDelta: { metric: 'Inventory days', before: '6.8d', after: '24.8d projected', direction: 'improvement', pct: 265 },
    wasReversed: false,
    attributionConfidence: 0.61,
    cautionNote: 'ERP signal was 4h stale at decision time. Actual inventory unconfirmed.',
  },
  {
    id: 'INT-2026-capa-01',
    agent: 'CAPAEngine',
    agentTier: 'recommend',
    action: 'Escalate CAPA-2604-006 — evidence overdue 72h',
    rationaleText: 'CAPA-2604-006 evidence submission is 72 hours overdue. FDA inspection window is 18 days. Non-submission creates a regulatory gap that will appear on the inspection record.',
    recommendedAt: '2026-05-13T08:00:00Z',
    recommendedLabel: 'May 13, 08:00',
    kpiTarget: 'capa-resolution-time',

    sourceSignals: [
      { name: 'CAPA status (compliance DB)', value: 'Evidence overdue 72h', baseline: '48h max', freshnessMin: 5, stale: false },
      { name: 'FDA inspection countdown', value: '18 days', baseline: '>30 days optimal', freshnessMin: 60, stale: false },
    ],
    signalCompleteness: 1.0,
    freshnessState: 'fresh',

    reviewedBy: 'D. Kowalski',
    reviewRole: 'Supervisor',
    dwellTimeMs: 28400,
    decision: 'approved',
    overrideReason: null,
    decisionLabel: 'May 13, 08:04',

    metricsBefore: { capaResolutionDays: 14, evidenceSubmitted: false, inspectionDaysOut: 21 },

    actionTaken: 'Escalation sent to responsible party — 24h deadline issued',
    actionLabel: 'May 13, 08:04',

    metricsAfter: { capaResolutionDays: 6, evidenceSubmitted: true, inspectionDaysOut: 18 },
    metricsUpdatedLabel: 'May 14, 16:00',

    outcomeClassification: 'positive',
    outcomeNotes: 'Evidence submitted within 24h of escalation. CAPA resolved in 6 days vs. 14-day baseline. Compliance gap closed 18 days before inspection.',
    kpiDelta: { metric: 'CAPA resolution time', before: '14d avg', after: '6d', direction: 'improvement', pct: 57 },
    wasReversed: false,
    attributionConfidence: 0.88,
    operatorConfirmation: {
      confirmedBy: 'P. Okonkwo',
      confirmedAt: 'May 13, 14:30',
      station: 'QA Check Station',
      note: 'CAPA evidence package assembled and submitted via QA portal',
    },
  },
  // ── R-03 Bearing — complete loop: flagged → approved → inspected → line clear ──
  {
    id: 'INT-2026-R03-01',
    agent: 'Predictive Maintenance',
    agentTier: 'recommend',
    action: 'Bearing inspection scheduled — R-03 Seal Press A, tonight 22:00–23:30',
    rationaleText: 'Vibration increased 62% during shift (2.1 → 3.4 mm/s). Signature matches R-08 failure precursor (72h to fault). MTBF model: 14h to probable failure. Pre-emptive window avoids unplanned downtime.',
    recommendedAt: '2026-05-16T13:12:00Z',
    recommendedLabel: 'May 16, 13:12',
    kpiTarget: 'production-loss',

    sourceSignals: [
      { name: 'R-03 vibration sensor', value: '3.4 mm/s',    baseline: '< 2.5 mm/s',       freshnessMin: 4, stale: false },
      { name: 'R-03 temperature',      value: '+7°C rise',   baseline: 'stable ±2°C',        freshnessMin: 4, stale: false },
      { name: 'MTBF forecast',          value: '14h to fault', baseline: '> 100h normal',     freshnessMin: 0, stale: false },
    ],
    signalCompleteness: 1.0,
    freshnessState: 'fresh',

    reviewedBy: 'J. Crocker',
    reviewRole: 'Director',
    dwellTimeMs: 41000,
    decision: 'approved',
    overrideReason: null,
    decisionLabel: 'May 16, 13:23',

    metricsBefore: { vibrationMmS: 3.4, healthScore: 71, productionLossRisk: 8200 },
    actionTaken: 'Maintenance window confirmed tonight 22:00–23:30 · Bearing replaced · R-03 returned to service 23:48',
    actionLabel: 'May 16, 22:00',

    metricsAfter: { vibrationMmS: 0.9, healthScore: 94, productionLossRisk: 0 },
    metricsUpdatedLabel: 'May 16, 23:50',

    outcomeClassification: 'positive',
    outcomeNotes: 'Bearing inspection at 22:45 confirmed wear — replaced. R-03 returned to service at 23:48 running at 0.9 mm/s (well within normal range). Line 4 AM shift started clean. Production loss avoided: $8,200 (R-08 precedent). Actual downtime: 108 min vs. 120 min estimated.',
    kpiDelta: { metric: 'Production loss avoided', before: '$8,200 at risk', after: '$0', direction: 'improvement', pct: 100 },
    wasReversed: false,
    attributionConfidence: 0.84,
    operatorConfirmation: {
      confirmedBy: 'C. Reyes',
      confirmedAt: 'May 17, 06:18',
      station: 'Line 4 · Pack Line',
      note: 'R-03 running clean at shift start · Vibration 0.9 mm/s · Within normal range confirmed',
    },
  },
]

export const interventionSummary = {
  total: 6,
  positive: 4,
  negative: 0,
  unclear: 1,
  reversed: 1,
  autoExecuted: 2,
  humanApproved: 3,
  humanRejected: 1,
  avgDwellTimeMs: 26800,
  avgAttributionConfidence: 0.74,
  lowDwellDecisions: 1,
  operatorConfirmed: 3,
}

// ── Platform P&L baseline — what Takorin has returned vs. the pre-deployment state ──
// The article: "document current defect rates, scrap costs, and manual inspection labor
// before you deploy anything. That baseline becomes your ROI benchmark."
export const platformBaseline = {
  deployedDate: 'Feb 10, 2026',
  evaluationPeriod: '90 days · Feb 10 – May 10, 2026',
  attributionNote: 'Savings estimates are partially attributed to Takorin based on intervention records and before/after telemetry. Multiple factors affect plant performance — attribution confidence is shown per metric and reflects genuine uncertainty, not false precision.',

  metrics: [
    {
      id: 'defect-escape',
      label: 'Defect escape rate',
      unit: '%',
      unitLabel: 'of units produced',
      before: 20.0,
      after: 1.6,
      delta: -18.4,
      direction: 'improvement',
      attribution: 0.82,
      annualValue: 142000,
      how: 'AI vision inspection catches 98.4% of defects vs. ~80% historical human accuracy. Each escaped defect reaching a consumer costs ~$140 in recall, warranty, and brand exposure. 18.4pp improvement × annual production volume.',
      caveat: 'Human inspection accuracy baseline is an industry estimate (Northeastern University 2023), not a Salina-specific measured rate. Actual pre-deployment escape rate may differ.',
      sourceModule: 'Quality',
      sourceRoute: '/quality',
    },
    {
      id: 'unplanned-downtime',
      label: 'Unplanned equipment downtime',
      unit: 'hrs/week',
      unitLabel: 'Line 4',
      before: 4.2,
      after: 1.8,
      delta: -2.4,
      direction: 'improvement',
      attribution: 0.71,
      annualValue: 511680,
      how: 'Predictive maintenance moved Line 4 equipment failures from reactive repairs to planned windows. R-03 bearing ($8,200 avoided) is a documented, confirmed example. 2.4h/week × $4,100/hr production value × 52 weeks.',
      caveat: 'Only Line 4 is fully instrumented. Lines 2, 3, and 6 impact not yet captured — this estimate understates full-plant potential.',
      sourceModule: 'Equipment',
      sourceRoute: '/equipment',
    },
    {
      id: 'capa-cycle',
      label: 'CAPA resolution time',
      unit: 'days avg',
      unitLabel: 'open to closure',
      before: 14.2,
      after: 8.6,
      delta: -5.6,
      direction: 'improvement',
      attribution: 0.68,
      annualValue: 38000,
      how: 'Auto-created CAPAs with pre-populated evidence requirements and automated escalation reduced average resolution from 14.2 to 8.6 days. Compliance fine avoidance estimated at $38K/yr based on FDA observation cost exposure.',
      caveat: 'CAPA count is low (6 in 90 days). Estimate is based on regulatory risk exposure, not actual fines received.',
      sourceModule: 'CAPA',
      sourceRoute: '/capa',
    },
    {
      id: 'inspection-labor',
      label: 'Manual inspection labor',
      unit: 'FTE equivalent',
      unitLabel: 'quality inspection',
      before: 3.2,
      after: 1.1,
      delta: -2.1,
      direction: 'improvement',
      attribution: 0.74,
      annualValue: 109200,
      how: 'AI handles primary line inspection. Human QA now covers exceptions, novel events, and regulatory holds only. 2.1 FTE redirected to higher-value quality assurance work at $52,000 fully-loaded annual cost.',
      caveat: 'Redeployed FTE, not eliminated headcount. Labor credit assumes equivalent value in redeployed work — may overstate if redeployment is incomplete.',
      sourceModule: 'Quality',
      sourceRoute: '/quality',
    },
    {
      id: 'shift-risk',
      label: 'Shifts above risk threshold',
      unit: '%',
      unitLabel: 'of shifts scoring ≥80',
      before: 28.0,
      after: 12.0,
      delta: -16.0,
      direction: 'improvement',
      attribution: 0.79,
      annualValue: 62400,
      how: 'Shift interventions (checklist escalation, staffing rebalancing, supplier holds) moved 16% of shifts below the risk threshold. Each prevented high-risk shift estimated at $1,200 in scrap and rework reduction × 52 shifts/year.',
      caveat: 'Risk score is a model output — improvements may partly reflect model calibration, not purely operational changes.',
      sourceModule: 'Shift',
      sourceRoute: '/shift',
    },
    {
      id: 'detection-resolution',
      label: 'Disruption detection-to-decision time',
      unit: 'hrs avg',
      unitLabel: 'flag to director decision',
      before: 8.7,
      after: 0.6,
      delta: -8.1,
      direction: 'improvement',
      attribution: 0.65,
      annualValue: 63000,
      how: 'Agent-flagged disruptions (lot holds, sourcing delays, equipment anomalies) now reach a ratified director decision in ~38 minutes — the TS-8811 hold and R-03 bearing alert are documented examples. 8.1 hrs saved × ~12 multi-system disruptions/yr × $650/hr exposure (expedite and chargeback avoidance, not full production value).',
      caveat: 'The 8.7-hour baseline is from a 2026 industry survey of 200 manufacturing COOs/CFOs, not a Salina-specific pre-deployment measurement — prior detection times here were not formally tracked.',
      sourceModule: 'Agents',
      sourceRoute: '/agents',
    },
  ],

  costs: {
    annualLicense: 180000,
    implementationYear1: 45000,
    integrationMaintenance: 24000,
    totalYear1: 249000,
    totalOngoing: 204000,
  },

  summary: {
    totalAnnualValue: 926280,
    year1Cost: 249000,
    year1Net: 677280,
    year1ROI: 272,
    ongoingNet: 722280,
    ongoingROI: 354,
    avgAttribution: 0.73,
    note: 'Based on 90-day pilot data. Attribution confidence averages 73% — improvements reflect a mix of Takorin interventions and broader operational changes. Full-year data will tighten these ranges.',
  },

  notYetCounted: [
    { area: 'Lines 2, 3, 6 — predictive maintenance', potential: 'Est. $280K additional if Lines 2, 3, 6 reach Line 4 instrumentation level' },
    { area: 'Cross-plant supplier coordination', potential: 'TS-8811 cross-plant lot hold avoided a partial recall — unquantified asymmetric upside' },
    { area: 'Knowledge retention value', potential: 'Veteran operator judgment captured in Knowledge — no current financial model' },
    { area: 'Novel event escalation', potential: 'Quality prevented one potential contaminant misclassification — $0 quantified, significant recall avoidance value' },
  ],
}

export const kpiTargets = [
  { id: 'capa-resolution-time', label: 'CAPA resolution time', unit: 'days', baseline: 14, target: '<10', direction: 'down' },
  { id: 'batch-hold-duration', label: 'Batch hold duration', unit: 'hours', baseline: 18, target: '<4', direction: 'down' },
  { id: 'deviation-recurrence', label: 'Deviation recurrence rate', unit: '%', baseline: 34, target: '<20', direction: 'down' },
  { id: 'throughput', label: 'Line throughput', unit: '%', baseline: 91, target: '>95', direction: 'up' },
  { id: 'supply-continuity', label: 'Inventory buffer days', unit: 'days', baseline: 7, target: '>14', direction: 'up' },
  { id: 'detection-resolution-time', label: 'Disruption detection-to-decision time', unit: 'hrs', baseline: 8.7, target: '<1', direction: 'down' },
]
