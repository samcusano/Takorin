// QualityIQ — Visual inspection and defect detection data
// Integration surface: outputs from connected vision systems, surfaced in director context.
// Primary story: Line 4 seal failure rate rising due to R-03 bearing wear — equipment signal
// visible in EquipmentIntelligence connects to a live quality outcome here.

// ── Defect type taxonomy ──────────────────────────────────────────────────────
export const defectTypes = {
  seal:         { label: 'Seal failure',      color: 'text-danger', dot: 'bg-danger', icon: '⬡' },
  label:        { label: 'Label error',       color: 'text-warn',   dot: 'bg-warn',   icon: '◈' },
  weight:       { label: 'Weight deviation',  color: 'text-warn',   dot: 'bg-warn',   icon: '◇' },
  contamination:{ label: 'Contamination',     color: 'text-danger', dot: 'bg-danger', icon: '◉' },
  foreign:      { label: 'Foreign material',  color: 'text-danger', dot: 'bg-danger', icon: '◎' },
  cosmetic:     { label: 'Cosmetic defect',   color: 'text-muted',  dot: 'bg-muted',  icon: '○' },
}

// ── Per-line quality: current shift ──────────────────────────────────────────
export const lineQuality = [
  {
    id: 'l4',
    name: 'Line 4',
    sku: 'Pepperoni Classic',
    lot: 'Lot PP-7714',
    supervisor: 'D. Kowalski',
    status: 'alert',      // ok | watch | alert
    unitsInspected: 14820,
    unitsPass: 14702,
    unitsFail: 118,
    defectRate: 0.80,      // %
    baselineRate: 0.31,    // historical 30-day baseline %
    threshold: 1.0,        // auto-CAPA trigger threshold %
    autoCAPAArmed: true,
    autoCAPATriggered: false,
    trend: 'rising',       // rising | stable | falling
    trendDelta: '+0.49%',  // vs. baseline
    // Defect type breakdown for this shift
    defectBreakdown: [
      { type: 'seal',    count: 81, pct: 68.6 },
      { type: 'weight',  count: 22, pct: 18.6 },
      { type: 'cosmetic',count: 15, pct: 12.7 },
    ],
    // Cross-module connection: equipment signal explaining the quality event
    equipmentSignal: {
      unit: 'R-03 Seal Press A',
      signal: 'Vibration trending up — bearing 62% above baseline since shift start',
      route: '/equipment',
      detectedAgo: '4h ago',
      note: 'Seal failure rate began rising at 06:30 — same time vibration on R-03 crossed the watch threshold. Model confidence: 84%.',
    },
    ccpStatus: { ccp: 'CCP-4', label: 'Seal integrity 100%', status: 'watch', note: 'Seal pass rate at 99.2% — above CCP minimum but declining' },
  },
  {
    id: 'l6',
    name: 'Line 6',
    sku: 'GF-Flatbread',
    lot: 'Lot GF-1102',
    supervisor: 'B. Petrov',
    status: 'ok',
    unitsInspected: 9240,
    unitsPass: 9221,
    unitsFail: 19,
    defectRate: 0.21,
    baselineRate: 0.28,
    threshold: 1.0,
    autoCAPAArmed: true,
    autoCAPATriggered: false,
    trend: 'stable',
    trendDelta: '−0.07%',
    defectBreakdown: [
      { type: 'cosmetic', count: 11, pct: 57.9 },
      { type: 'label',    count: 8,  pct: 42.1 },
    ],
    equipmentSignal: null,
    ccpStatus: { ccp: 'CCP-3', label: 'Bake temp 185°F minimum', status: 'ok', note: 'All readings within compliance window' },
  },
  {
    id: 'l3',
    name: 'Line 3',
    sku: 'Tomato Basil',
    lot: 'Lot TB-0441',
    supervisor: 'M. Chen',
    status: 'watch',
    unitsInspected: 6180,
    unitsPass: 6148,
    unitsFail: 32,
    defectRate: 0.52,
    baselineRate: 0.38,
    threshold: 1.0,
    autoCAPAArmed: true,
    autoCAPATriggered: false,
    trend: 'rising',
    trendDelta: '+0.14%',
    defectBreakdown: [
      { type: 'weight',   count: 19, pct: 59.4 },
      { type: 'cosmetic', count: 8,  pct: 25.0 },
      { type: 'label',    count: 5,  pct: 15.6 },
    ],
    equipmentSignal: null,
    ccpStatus: { ccp: 'CCP-1', label: 'Sauce temp 60°C minimum', status: 'ok', note: 'Sauce dosing within spec' },
  },
  {
    id: 'l2',
    name: 'Line 2',
    sku: 'Margherita Classic',
    lot: 'Lot MG-2290',
    supervisor: 'J. Park',
    status: 'ok',
    unitsInspected: 8440,
    unitsPass: 8427,
    unitsFail: 13,
    defectRate: 0.15,
    baselineRate: 0.19,
    threshold: 1.0,
    autoCAPAArmed: true,
    autoCAPATriggered: false,
    trend: 'stable',
    trendDelta: '−0.04%',
    defectBreakdown: [
      { type: 'cosmetic', count: 10, pct: 76.9 },
      { type: 'weight',   count: 3,  pct: 23.1 },
    ],
    equipmentSignal: null,
    ccpStatus: null,
  },
]

// ── AI vs Human inspection accuracy ──────────────────────────────────────────
export const inspectionAccuracy = {
  // Headline numbers
  aiAccuracy: 98.4,         // % detection rate on known defect types
  humanBaseline: 79.0,      // industry baseline, per Northeastern University 2023 study
  humanBaselineNote: 'Industry average from Northeastern University 2023 peer-reviewed study (n=340 manufacturing facilities). Human accuracy declines with task complexity, fatigue, and shift length.',
  aiSampleSize: 847240,     // units inspected by AI in last 30 days at this plant
  humanSampleSize: 12800,   // units inspected by human QA checks in same period (sampling basis)
  aiConfidenceAvg: 94.1,    // average confidence score across all AI classifications
  falsePositiveRate: 1.2,   // % of AI-flagged defects confirmed as non-defects on manual review
  falseNegativeRate: 1.6,   // % of defects that passed AI inspection and were caught by downstream QC

  // Per-SKU breakdown
  skuAccuracy: [
    { sku: 'Pepperoni Classic', accuracy: 99.1, confidence: 96.2, trainingUnits: 284000, note: 'Best-trained SKU — 3 years of labeled inspection data' },
    { sku: 'GF-Flatbread',      accuracy: 97.8, confidence: 92.4, trainingUnits: 61000,  note: 'Added 18 months ago — model still improving with each run' },
    { sku: 'Tomato Basil',      accuracy: 98.2, confidence: 93.8, trainingUnits: 118000, note: 'Good coverage — weight deviation detection is strongest' },
    { sku: 'Margherita Classic',accuracy: 98.9, confidence: 95.1, trainingUnits: 196000, note: 'High accuracy — cosmetic defect detection occasionally over-flags' },
  ],

  // Defect type accuracy (how well the model classifies each type)
  defectTypeAccuracy: [
    { type: 'seal',          accuracy: 99.6, confidence: 97.1, note: 'Seal failure is the clearest visual signal — easiest for the model' },
    { type: 'contamination', accuracy: 98.1, confidence: 93.2, note: 'High accuracy on known contaminant types. Novel contaminants trigger OOD escalation.' },
    { type: 'foreign',       accuracy: 97.4, confidence: 91.8, note: 'Foreign material detection strong on metal and plastic. Organic material harder to distinguish from ingredients.' },
    { type: 'weight',        accuracy: 98.8, confidence: 96.4, note: 'Weight deviation uses mass sensor integration — high precision' },
    { type: 'label',         accuracy: 97.2, confidence: 94.0, note: 'Label errors: rotation and alignment detected reliably. Ink fade edge cases require manual review.' },
    { type: 'cosmetic',      accuracy: 95.1, confidence: 88.3, note: 'Most subjective defect type — highest disagreement rate between AI and human QA reviewers' },
  ],

  // Where humans still lead
  humanAdvantages: [
    { area: 'Novel defect types',        detail: 'AI cannot classify defects outside its training set. Any contamination type not seen before requires human review before a disposition decision.' },
    { area: 'Regulatory hold decisions', detail: 'A borderline batch — one that passed inspection but has adjacent risk factors — requires a food safety professional. AI flags; humans decide on holds.' },
    { area: 'Contextual interpretation', detail: 'An unusual surface marking may be harmless spice variation or the start of mold growth. That judgment requires context the model does not have.' },
    { area: 'Customer complaint linkage', detail: 'Connecting a consumer complaint to a specific production run and deciding whether to issue a recall still requires human chain-of-custody judgment.' },
  ],
}

// ── Recent defect events (last 12 hours) ─────────────────────────────────────
export const defectEvents = [
  {
    id: 'de-001', timestamp: '06:44', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14820', defectType: 'seal', confidence: 98.2,
    disposition: 'rejected', capaId: null,
    detail: 'Seal integrity failure — right edge. Tray sealing pressure 0.4 bar below spec at time of detection.',
    equipmentRef: 'R-03 Seal Press A · vibration 3.4 mm/s at time of event',
  },
  {
    id: 'de-002', timestamp: '06:41', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14817', defectType: 'seal', confidence: 97.8,
    disposition: 'rejected', capaId: null,
    detail: 'Seal integrity failure — front edge incomplete. Pattern consistent with R-03 bearing wear signature.',
    equipmentRef: 'R-03 Seal Press A · vibration 3.4 mm/s at time of event',
  },
  {
    id: 'de-003', timestamp: '06:38', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14801', defectType: 'weight', confidence: 99.1,
    disposition: 'rejected', capaId: null,
    detail: 'Weight 183g — 9g below 192g target. Topping dosing variance at Sauce Dosing Station.',
    equipmentRef: null,
  },
  {
    id: 'de-004', timestamp: '06:31', lineId: 'l3', sku: 'Tomato Basil',
    lot: 'TB-0441', unit: 'U-6148', defectType: 'weight', confidence: 98.7,
    disposition: 'rejected', capaId: null,
    detail: 'Weight 164g — below 170g target. Sauce dosing running slightly low this shift.',
    equipmentRef: null,
  },
  {
    id: 'de-005', timestamp: '06:22', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14780', defectType: 'seal', confidence: 96.4,
    disposition: 'rejected', capaId: null,
    detail: 'Seal integrity failure — back edge. Third seal failure in last 22 minutes on Line 4.',
    equipmentRef: 'R-03 Seal Press A · vibration trend rising since 06:12',
  },
  {
    id: 'de-006', timestamp: '06:18', lineId: 'l6', sku: 'GF-Flatbread',
    lot: 'GF-1102', unit: 'U-9220', defectType: 'cosmetic', confidence: 89.1,
    disposition: 'rejected', capaId: null,
    detail: 'Surface browning uneven — left quadrant 12% darker than target. Bake temp gradient at Oven B zone 3.',
    equipmentRef: null,
  },
  {
    id: 'de-007', timestamp: '06:04', lineId: 'l2', sku: 'Margherita Classic',
    lot: 'MG-2290', unit: 'U-8427', defectType: 'cosmetic', confidence: 88.3,
    disposition: 'rejected', capaId: null,
    detail: 'Topping coverage low on center-right quadrant. Cosmetic standard miss — product safe.',
    equipmentRef: null,
  },
  {
    id: 'de-008', timestamp: '05:58', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14720', defectType: 'seal', confidence: 97.2,
    disposition: 'rejected', capaId: null,
    detail: 'Seal integrity failure. First R-03-correlated event of this shift.',
    equipmentRef: 'R-03 Seal Press A · vibration 2.8 mm/s — early warning',
  },
  {
    id: 'de-009', timestamp: '05:44', lineId: 'l3', sku: 'Tomato Basil',
    lot: 'TB-0441', unit: 'U-6120', defectType: 'label', confidence: 94.8,
    disposition: 'rejected', capaId: null,
    detail: 'Label rotation 4° off-axis — outside 2° tolerance. Label applicator arm calibration required.',
    equipmentRef: null,
  },
  {
    id: 'de-010', timestamp: '05:39', lineId: 'l4', sku: 'Pepperoni Classic',
    lot: 'PP-7714', unit: 'U-14690', defectType: 'weight', confidence: 99.4,
    disposition: 'rejected', capaId: null,
    detail: 'Weight 180g — below target. Batch start variance — dosing system warming up.',
    equipmentRef: null,
  },
]

// ── Novel / out-of-distribution events ───────────────────────────────────────
// These are detections where the model flags something it cannot classify with
// confidence. Require human review before disposition — the article's "novel defect"
// scenario where AI fails and humans are essential.
export const novelEvents = [
  {
    id: 'nov-001',
    timestamp: '06:39',
    lineId: 'l4',
    sku: 'Pepperoni Classic',
    lot: 'PP-7714',
    unit: 'U-14812',
    status: 'pending',      // pending | reviewed
    modelConfidence: 31,
    classificationAttempt: 'Possible contamination — type unknown',
    why: 'Dark circular spot (approx 4mm diameter) on topping surface. Matches neither known mold signature nor known spice artifact in training set. Color profile (RGB 28, 18, 12) falls outside all labeled contaminant and ingredient clusters.',
    visualDescription: 'Small dark spot, near-circular, on topping surface left of center. Not present in surrounding area. Adjacent pepperoni pieces normal.',
    riskAssessment: 'Cannot determine — requires trained QA reviewer. Could be: (a) normal black pepper spice cluster, (b) carbonized topping artifact, or (c) organic contamination not in training set.',
    reviewedBy: null,
    disposition: null,
    cpaId: null,
    escalatedTo: 'QA Manager — T. Osei',
    escalatedAt: '06:39',
  },
  {
    id: 'nov-002',
    timestamp: '2026-05-14 · 13:22',
    lineId: 'l6',
    sku: 'GF-Flatbread',
    lot: 'GF-1098',
    unit: 'U-8841',
    status: 'reviewed',
    modelConfidence: 44,
    classificationAttempt: 'Possible foreign material — type unknown',
    why: 'Thin linear mark approximately 18mm along crust edge. Pattern does not match any known defect class in training data. Shape inconsistent with known foreign material profiles (metal, plastic, organic fiber).',
    visualDescription: 'Fine linear indentation in crust, parallel to edge. Appears structural rather than surface contamination.',
    riskAssessment: 'Reviewed by QA — confirmed as die press artifact from the new flatbread forming plate (installed May 12). Not a contamination event. Unit safe to release.',
    reviewedBy: 'T. Osei · QA Manager',
    reviewedAt: '2026-05-14 · 13:51',
    disposition: 'Released — confirmed die press artifact, not contamination',
    groundTruth: 'cosmetic',
    groundTruthNote: 'Die press forming mark — added to training set as new cosmetic subcategory. Model will learn this pattern from next training cycle.',
    capaId: null,
  },
]

// ── Auto-CAPA trigger config ──────────────────────────────────────────────────
export const autoCAPAConfig = {
  enabled: true,
  threshold: 1.0,   // % defect rate — trigger at or above this value
  sustainedMinutes: 15, // must be above threshold for this long before CAPA fires
  defectTypesIncluded: ['seal', 'contamination', 'foreign'],
  defectTypesExcluded: ['cosmetic'],  // cosmetic defects don't trigger CAPA alone
  lastTriggered: '2026-05-09 · Line 3 · 1.2% contamination rate · CAPA-2604-EMP-01',
  note: 'Auto-CAPA opens the case, assigns it to the line supervisor, and routes to the director for Tier 3 ratification if it involves a CCP-linked defect type.',
}

// ── 30-day defect rate trend (per line, for sparklines) ──────────────────────
export const defectRateTrend = {
  l4: [0.28, 0.31, 0.29, 0.34, 0.30, 0.28, 0.32, 0.33, 0.31, 0.29, 0.30, 0.28, 0.31, 0.35, 0.33, 0.30, 0.29, 0.31, 0.28, 0.32, 0.30, 0.31, 0.33, 0.29, 0.28, 0.30, 0.32, 0.31, 0.29, 0.80],
  l6: [0.30, 0.28, 0.26, 0.29, 0.27, 0.28, 0.30, 0.26, 0.29, 0.27, 0.28, 0.26, 0.27, 0.29, 0.28, 0.26, 0.27, 0.28, 0.26, 0.27, 0.28, 0.26, 0.27, 0.28, 0.26, 0.27, 0.28, 0.26, 0.27, 0.21],
  l3: [0.36, 0.38, 0.40, 0.37, 0.39, 0.38, 0.37, 0.39, 0.40, 0.38, 0.37, 0.39, 0.38, 0.40, 0.37, 0.39, 0.38, 0.40, 0.37, 0.38, 0.39, 0.38, 0.40, 0.37, 0.39, 0.38, 0.40, 0.41, 0.44, 0.52],
  l2: [0.20, 0.19, 0.21, 0.18, 0.20, 0.19, 0.21, 0.18, 0.20, 0.19, 0.21, 0.20, 0.19, 0.18, 0.20, 0.21, 0.20, 0.19, 0.18, 0.20, 0.19, 0.21, 0.20, 0.19, 0.18, 0.20, 0.19, 0.18, 0.17, 0.15],
}
