// Cross-domain situation threads — named incidents that span multiple screens.
// Each situation aggregates related actions, findings, and agent decisions into
// a single context the director can work from without navigating between screens.
//
// resolvedWhen(state): predicate receiving AppState — returns true when the
// situation no longer requires director attention.

export const SITUATIONS = [
  {
    id: 'sit-lot-l0891',
    name: 'Lot L-0891 Hold',
    urgency: 'danger',
    timeLabel: '1h 46m',
    summary: 'Supplier Agent recommends holding Lot L-0891 — COA not received. Production start blocked until director decision is made.',
    threads: [
      {
        id: 'th-agent',
        domain: 'Agent Decision',
        label: 'Tier 3 ratification — lot hold',
        note: 'Supplier Intelligence recommends hold or release before 10:00 AM. Director sign-off required.',
        route: '/agents',
        resolvedKey: 'supplier-0',
      },
      {
        id: 'th-coa',
        domain: 'Supplier / COA',
        label: 'COA not received — ConAgra Pepperoni',
        note: 'Certificate of Analysis required before Line 4 production can start. Request sent 05:47 — no response.',
        route: '/suppliers',
        resolvedKey: null,
      },
      {
        id: 'th-shift',
        domain: 'Shift',
        label: 'Line 4 start blocked',
        note: 'Production cannot begin without COA clearance. Current shift risk score: 78.',
        route: '/shift',
        resolvedKey: null,
      },
    ],
    resolvedWhen: (state) => state.agentDecidedKeys?.has('supplier-0'),
  },
  {
    id: 'sit-r03',
    name: 'R-03 Vibration Anomaly',
    urgency: 'warn',
    timeLabel: '14h window',
    summary: 'Bearing vibration on R-03 matches R-08 pre-failure signature from 72h before that fault. Two linked decisions — resolve together for full closure.',
    threads: [
      {
        id: 'th-capa',
        domain: 'Compliance / CAPA',
        label: 'Open CAPA — R-03 vibration',
        note: 'Vibration 3.4 mm/s sustained 38 min. Pattern-match to R-08. CAPA required for FDA record.',
        route: '/capa',
        resolvedKey: 'compliance-0',
      },
      {
        id: 'th-maint',
        domain: 'Equipment',
        label: 'Schedule bearing inspection — tonight',
        note: 'Proposed window: 22:00–23:30. 90 min planned vs. unplanned Line 4 downtime tomorrow AM.',
        route: '/equipment',
        resolvedKey: 'maintenance-0',
      },
    ],
    resolvedWhen: (state) =>
      state.agentDecidedKeys?.has('compliance-0') && state.agentDecidedKeys?.has('maintenance-0'),
  },
  {
    id: 'sit-conagra',
    name: 'ConAgra · 3rd COA Delay',
    urgency: 'ok',
    timeLabel: 'Today',
    summary: 'Pattern-based escalation: 3rd consecutive COA delay. Supplier standing 71 — contract review threshold reached.',
    threads: [
      {
        id: 'th-supplier',
        domain: 'Supplier Standing',
        label: 'ConAgra standing: 71 — review threshold',
        note: 'Contract review criteria met. Pattern logged by Supplier Intelligence Agent.',
        route: '/suppliers',
        resolvedKey: null,
      },
      {
        id: 'th-delivery',
        domain: 'Delivery',
        label: 'Lot L-0891 delayed 6h — Pepperoni',
        note: 'Expected today. COA requested and pending. Pre-production compliance hold active.',
        route: '/delivery',
        resolvedKey: null,
      },
    ],
    resolvedWhen: () => false,
  },
]
