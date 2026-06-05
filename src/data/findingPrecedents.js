// Finding precedent data — historical outcomes by finding type.
// Powers the "last 5 times" card in ShiftIQ finding cards and
// the Adoption tab in Performance.
//
// Structure per type:
//   acceptanceRate — fraction of times supervisors acted (0–1)
//   medianMins     — median minutes from surface to action
//   instances      — last 5 occurrences, newest first
//   insight        — single-sentence pattern summary

// Maps finding IDs → precedent type key
export const FINDING_TYPE_MAP = {
  sf1:  'checklist',
  sf2:  'staffing',
  sf3:  'sensor',
  sf4:  'scheduling',
  l6f1: 'certification',
  l6f2: 'equipment',
  wf1:  'allergen',
  wf2:  'equipment',
  df1:  'certification',
}

export const FINDING_PRECEDENTS = {

  checklist: {
    label: 'Startup checklist overdue',
    acceptanceRate: 0.91,
    medianMins: 3.8,
    instances: [
      { date: 'May 9',  acted: true,  mins: 4,    scoreDelta: -16, note: 'Risk dropped 16pts in 30 min. Shift cleared cleanly.' },
      { date: 'May 2',  acted: true,  mins: 3,    scoreDelta: -19, note: 'Fastest response this period. OEE target met.' },
      { date: 'Apr 25', acted: true,  mins: 6,    scoreDelta: -12, note: 'Resolved before T+60 threshold. No scrap impact.' },
      { date: 'Apr 18', acted: false, mins: null, scoreDelta: +7,  note: 'Not acted on. Risk continued rising. Scrap rate +1.8%.' },
      { date: 'Apr 11', acted: true,  mins: 5,    scoreDelta: -14, note: 'Resolved. Allergen changeover completed cleanly.' },
    ],
    insight: 'Acting on checklist findings within 6 min consistently prevents risk escalation. One ignored instance led to elevated scrap.',
  },

  staffing: {
    label: 'Operator assignment mismatch',
    acceptanceRate: 0.83,
    medianMins: 5.2,
    instances: [
      { date: 'May 9',  acted: true,  mins: 4,    scoreDelta: -18, note: 'Martinez reassigned. Qualified staffing 72% → 83%. Risk resolved.' },
      { date: 'Apr 30', acted: true,  mins: 8,    scoreDelta: -11, note: 'Reyes covered briefly. Risk resolved before 60-min window.' },
      { date: 'Apr 23', acted: false, mins: null, scoreDelta: +12, note: 'Not reassigned. CCP-1 violation logged. CAPA opened.' },
      { date: 'Apr 16', acted: true,  mins: 3,    scoreDelta: -22, note: 'Fastest response this shift. Sauce Dosing covered cleanly.' },
      { date: 'Apr 9',  acted: true,  mins: 7,    scoreDelta: -9,  note: 'Resolved. Slight delay — cert gap carried into handoff.' },
    ],
    insight: 'Staffing reassignment recommendations are acted on 83% of the time. The one ignored instance resulted in a CCP violation and CAPA.',
  },

  sensor: {
    label: 'Sensor variance — predictive maintenance',
    acceptanceRate: 0.24,
    medianMins: 34.1,
    instances: [
      { date: 'May 9',  acted: true,  mins: 41,   scoreDelta: -6,  note: 'Inspection scheduled. Bearing replaced tonight. $8,200 avoided.' },
      { date: 'Apr 28', acted: false, mins: null, scoreDelta: +4,  note: 'Not escalated. Sensor self-corrected. No consequence observed.' },
      { date: 'Apr 14', acted: false, mins: null, scoreDelta: +3,  note: 'Not escalated. Variance subsided within shift.' },
      { date: 'Apr 1',  acted: false, mins: null, scoreDelta: +18, note: 'Not escalated. R-08 bearing failed. 4h unplanned downtime. $14,200 loss.' },
      { date: 'Mar 18', acted: true,  mins: 28,   scoreDelta: -4,  note: 'Inspection scheduled. No fault found at inspection.' },
    ],
    insight: 'Supervisors act on maintenance recommendations 24% of the time. Two false positives and one costly miss shape this pattern. Calibration of the threshold is the highest-leverage improvement.',
  },

  certification: {
    label: 'Operator certification expiring',
    acceptanceRate: 0.95,
    medianMins: 6.1,
    instances: [
      { date: 'May 10', acted: true,  mins: 5,    scoreDelta: -8,  note: 'Renewal scheduled. No production gap.' },
      { date: 'Apr 24', acted: true,  mins: 4,    scoreDelta: -7,  note: 'Scheduled within shift. Coverage maintained.' },
      { date: 'Apr 10', acted: false, mins: null, scoreDelta: +11, note: 'Not acted. Cert lapsed. Coverage gap next AM.' },
      { date: 'Mar 28', acted: true,  mins: 8,    scoreDelta: -9,  note: 'Renewal enrolled. Backup scheduled for gap period.' },
      { date: 'Mar 14', acted: true,  mins: 3,    scoreDelta: -6,  note: 'Fastest response. Proactive renewal before impact.' },
    ],
    insight: 'Certification findings are acted on 95% of the time — the highest-trust recommendation category. Clear consequence and binary compliance make this the most reliable signal.',
  },

  allergen: {
    label: 'Allergen changeover requirement',
    acceptanceRate: 0.88,
    medianMins: 8.4,
    instances: [
      { date: 'May 7',  acted: true,  mins: 6,    scoreDelta: -14, note: 'Changeover completed on time. Production unblocked.' },
      { date: 'Apr 30', acted: true,  mins: 12,   scoreDelta: -10, note: 'Slight delay but resolved before restart.' },
      { date: 'Apr 22', acted: false, mins: null, scoreDelta: +9,  note: 'Unsigned at restart. Production hold triggered. 45-min delay.' },
      { date: 'Apr 15', acted: true,  mins: 7,    scoreDelta: -13, note: 'Resolved. Allergen log completed and filed.' },
      { date: 'Apr 8',  acted: true,  mins: 5,    scoreDelta: -16, note: 'Fastest resolution this period. OEE impact avoided.' },
    ],
    insight: 'Allergen changeover findings are acted on 88% of the time. The one ignored instance caused a 45-minute production hold.',
  },

  equipment: {
    label: 'Equipment — monitor and watch',
    acceptanceRate: 0.62,
    medianMins: 14.8,
    instances: [
      { date: 'May 8',  acted: true,  mins: 11,   scoreDelta: -5,  note: 'Maintenance note created. Inspected at end of shift. No fault.' },
      { date: 'Apr 29', acted: false, mins: null, scoreDelta: +2,  note: 'Not logged. Belt self-corrected. No consequence.' },
      { date: 'Apr 21', acted: true,  mins: 18,   scoreDelta: -3,  note: 'Logged and monitored. Variance stable through shift.' },
      { date: 'Apr 12', acted: false, mins: null, scoreDelta: +8,  note: 'Not escalated. Belt tension reached threshold. Maintenance reactive repair.' },
      { date: 'Apr 3',  acted: true,  mins: 9,    scoreDelta: -4,  note: 'Re-tensioned at end of shift. No further variance.' },
    ],
    insight: 'Equipment watch findings are acted on 62% of the time — moderate trust. False positives lower trust; one missed escalation led to reactive maintenance.',
  },

  scheduling: {
    label: 'Tomorrow shift gap — act today',
    acceptanceRate: 0.60,
    medianMins: 22.3,
    instances: [
      { date: 'May 8',  acted: true,  mins: 18,   scoreDelta: -9,  note: 'Backup scheduled tonight. Tomorrow AM risk score reduced.' },
      { date: 'Apr 25', acted: false, mins: null, scoreDelta: +14, note: 'Not acted. Tomorrow AM started with cert gap. Risk score 67.' },
      { date: 'Apr 17', acted: true,  mins: 31,   scoreDelta: -7,  note: 'Cross-training enrolled. Gap partially covered.' },
      { date: 'Apr 9',  acted: false, mins: null, scoreDelta: +6,  note: 'Not acted. Cert lapsed overnight. Production delay.' },
      { date: 'Apr 1',  acted: true,  mins: 14,   scoreDelta: -11, note: 'Backup confirmed. Tomorrow started clean.' },
    ],
    insight: 'Scheduling findings are acted on 60% of the time — the longest delay category. Supervisors often defer tomorrow\'s problems to end-of-shift. Two ignored instances led to next-day risk.',
  },
}

// Acceptance rate ranking — used by Adoption tab in Performance
export const ACCEPTANCE_RANKING = Object.entries(FINDING_PRECEDENTS)
  .map(([key, p]) => ({
    key,
    label:          p.label,
    acceptanceRate: p.acceptanceRate,
    medianMins:     p.medianMins,
    insight:        p.insight,
    // Outcome delta: average score change when acted on vs. when ignored
    actedDelta:   Math.round(
      p.instances.filter(i => i.acted).reduce((s, i) => s + i.scoreDelta, 0) /
      Math.max(1, p.instances.filter(i => i.acted).length)
    ),
    ignoredDelta: Math.round(
      p.instances.filter(i => !i.acted).reduce((s, i) => s + i.scoreDelta, 0) /
      Math.max(1, p.instances.filter(i => !i.acted).length)
    ),
  }))
  .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
