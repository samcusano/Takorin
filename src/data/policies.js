// ── Policy drafts — director-authored escalation rules, backtested before going live ──
// Mirrors the existing agentConfigData confidenceMethodology pattern but makes the
// threshold editable and shows precedent before a rule is trusted with autonomy.

// Jobs to be done — what a policy is FOR, not which agent happens to run it.
// Lets the builder scale by outcome instead of becoming a flat list of agent internals.
export const JTBD_CATEGORIES = [
  { id: 'prevent-failure', label: 'Prevent equipment failure' },
  { id: 'verify-supply',   label: 'Verify supplier documentation' },
  { id: 'staff-coverage',  label: 'Maintain staffing coverage' },
]

// Who owns this policy day to day. Mirrors the tier split already established in the
// Decisions queue: compliance-category agents carry FDA/FSMA consequence and stay with
// the Director; everything else is tuned by the shift Supervisor.
export const PERSONAS = [
  { id: 'director',   label: 'Director',   desc: 'Compliance-locked — FDA/FSMA consequence, ratification required before going live' },
  { id: 'supervisor',  label: 'Supervisor', desc: 'Operational threshold — tuned within shift authority' },
]

export const policyDrafts = [
  {
    id: 'pol-vib-r03',
    agentId: 'compliance',
    jtbd: 'prevent-failure',
    persona: 'director',
    name: 'Vibration escalation — bearing failure pattern',
    metricLabel: 'Sustained vibration',
    unit: 'mm/s',
    comparator: '>=',
    threshold: 3.4,
    minThreshold: 2.5,
    maxThreshold: 4.5,
    durationMin: 30,
    corroborationLabel: 'temperature co-trending +5°C or more',
    action: 'open a CAPA automatically and notify the maintenance supervisor',
    status: 'shadow',
    backtest: {
      windowDays: 90,
      baseFireCount: 11,
      basePrecedentMatches: 3,
      precedentList: [
        { date: '2026-04-01', plant: 'Line 6 · R-08', outcome: 'Bearing failure within 72h — this rule would have opened the CAPA 71h early' },
        { date: '2026-02-14', plant: 'Line 4 · R-03', outcome: 'False positive — sensor recalibration, no failure followed' },
        { date: '2025-11-22', plant: 'Line 3 · R-05', outcome: 'Bearing replaced proactively after threshold breach' },
      ],
    },
    shadowStats: { daysRunning: 14, matchesLogged: 4, falseActions: 0 },
  },
  {
    id: 'pol-coa-hold',
    agentId: 'supplier',
    jtbd: 'verify-supply',
    persona: 'director',
    name: 'COA absence hold — production-start window',
    metricLabel: 'Time to scheduled production with no COA on file',
    unit: 'hrs',
    comparator: '<=',
    threshold: 4,
    minThreshold: 1,
    maxThreshold: 8,
    durationMin: 0,
    corroborationLabel: 'lot is the only supply for the scheduled SKU (no eligible substitute)',
    action: 'recommend a production hold and request an expedited COA',
    status: 'live',
    backtest: {
      windowDays: 90,
      baseFireCount: 9,
      basePrecedentMatches: 8,
      precedentList: [
        { date: '2026-04-16', plant: 'Salina · ConAgra Lot L-0891', outcome: 'Hold recommended, COA received 09:50 — production delayed 1h20m, no loss' },
        { date: '2025-09-03', plant: 'Wichita · Pacific Rim Lot PR-2209', outcome: 'Held — COA never arrived, substitute lot used, zero downtime' },
        { date: '2024-01-19', plant: 'Salina · ConAgra Lot L-0410', outcome: 'Not held under old threshold — production ran without COA, cited at next audit' },
      ],
    },
    shadowStats: { daysRunning: 180, matchesLogged: 9, falseActions: 1 },
    // What's happened since this policy was promoted to live and started acting on
    // its own — distinct from shadowStats, which only covers the pre-promotion trial.
    liveStats: {
      daysLive: 34,
      firedCount: 3,
      matchedIncidents: 3,
      falseActions: 0,
      impactNote: 'Every hold since going live caught a genuine COA gap — no lot ran without documentation, and no clean lot was delayed by a false hold.',
    },
  },
  {
    id: 'pol-cert-gap',
    agentId: 'resource',
    jtbd: 'staff-coverage',
    persona: 'supervisor',
    name: 'Cert-gap reallocation — staffing threshold',
    metricLabel: 'Qualified staffing coverage',
    unit: '%',
    comparator: '<',
    threshold: 72,
    minThreshold: 60,
    maxThreshold: 85,
    durationMin: 0,
    corroborationLabel: 'a qualified cross-trained operator or robot is available within the shift',
    action: 'propose a schedule reallocation before the shift gap occurs',
    status: 'draft',
    backtest: {
      windowDays: 90,
      baseFireCount: 6,
      basePrecedentMatches: 2,
      precedentList: [
        { date: '2026-03-22', plant: 'Salina · Line 4 AM', outcome: 'Reallocation proposed — accepted, no coverage gap materialized' },
        { date: '2025-12-08', plant: 'Denver · Line 1 PM', outcome: 'Would have fired — gap went unaddressed, overtime used instead' },
      ],
    },
    shadowStats: { daysRunning: 0, matchesLogged: 0, falseActions: 0 },
  },
]

// Simple, explainable backtest re-estimate as a director drags the threshold slider.
// Looser threshold (more sensitive) -> more fires, same true-precedent count -> higher false-positive rate.
export function estimateBacktest(draft, threshold) {
  const range = draft.maxThreshold - draft.minThreshold || 1
  const baseline = draft.threshold
  // Direction: for >= and > comparators, lower threshold = more sensitive = more fires.
  // For <= and < comparators, higher threshold = more sensitive = more fires.
  const moreSensitive = draft.comparator.startsWith('>')
    ? (baseline - threshold) / range
    : (threshold - baseline) / range
  const fireCount = Math.max(
    draft.backtest.basePrecedentMatches,
    Math.round(draft.backtest.baseFireCount * (1 + moreSensitive * 1.6))
  )
  const falsePositives = Math.max(0, fireCount - draft.backtest.basePrecedentMatches)
  const falsePositiveRate = fireCount > 0 ? Math.round((falsePositives / fireCount) * 100) : 0
  return { fireCount, falsePositives, falsePositiveRate }
}
