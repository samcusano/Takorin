export const lines = [
  { id: 'l4', name: 'Line 4', score: 78, status: 'At risk',  scoreColor: '#D94F2A', shift: 'AM' },
  { id: 'l6', name: 'Line 6', score: 42, status: 'Running', scoreColor: '#3A8A5A', shift: 'AM' },
  { id: 'l3', name: 'Line 3', score: 61, status: 'Watch',   scoreColor: '#C4920A', shift: 'PM' },
  { id: 'l2', name: 'Line 2', score: 38, status: 'Clear',   scoreColor: '#3A8A5A', shift: 'AM' },
]

export const findings = [
  {
    id: 'sf1', type: 'cu', ordinal: 'I.',
    title: 'Complete startup checklists — Oven Station B + Topping Line',
    description: '4 of 11 startup checklists remain open at T+42 min. Incomplete checklists at 60 minutes correlate with 18% elevated scrap rate on Pepperoni Classic runs across 340 comparable shifts on this line.',
    evidence: '▸ Precedent: Line 4 · Apr 2 — same 3-signal pattern → 61% OEE final outcome',
    primaryLabel: 'Assign to Kowalski',
    secondaryLabel: 'Watch only',
    consequenceMessage: 'Assigned to Kowalski · Checklist flagged for re-evaluation · Risk score updates in 4 min',
  },
  {
    id: 'sf2', type: 'cw', ordinal: 'II.',
    title: 'Reassign Martinez (L3) to Sauce Dosing — Reyes (L1) is a mismatch',
    description: 'Sauce Dosing requires Level 3 at today\'s production volume. Martinez is available and certified. Swap raises qualified staffing 72% → 83%.',
    evidence: '▸ Precedent: Skill mismatch at Sauce Dosing in 3 of last 8 substandard shifts on Line 4',
    primaryLabel: 'Confirm reassignment',
    secondaryLabel: 'Dismiss',
    consequenceMessage: 'Martinez reassigned to Sauce Dosing · Qualified staffing: 72% → 83% · Risk score updates in 4 min',
  },
  {
    id: 'sf3', type: 'cu', ordinal: 'III.',
    title: 'Watch order — Sensor A-7 micro-variance',
    description: '3 readings outside normal range in 20 min. Below threshold (5 required). Pattern matches pre-jam signature from 2–3 shifts before the April 2nd Line 4 incident.',
    evidence: '▸ Watch: 3-shift leading indicator only — escalate if count reaches 5',
    primaryLabel: 'Log inspection task',
    secondaryLabel: 'Alert at 5',
    consequenceMessage: 'Inspection task logged · Maintenance notified · Alert will fire at count 5',
  },
]

export const crew = [
  { name: 'D. Kowalski', role: 'Supervisor · L4', dots: [true,true,true,true,false] },
  { name: 'A. Martinez', role: 'Operator · L3', dots: [true,true,true,false,false] },
  { name: 'C. Reyes',    role: 'Operator · L1', dots: [true,false,false,false,false], flag: true },
  { name: 'P. Okonkwo',  role: 'Operator · L2', dots: [true,true,false,false,false] },
]

export const startupChecks = {
  total: 11, cleared: 7,
  overdue: ['Topping weight verification · Reyes', 'Packaging QA pre-check · Patel', 'Seal inspection · Patel', 'Allergen changeover log · Okonkwo'],
}

export const sparkData = [
  { height: '22px', label: '06:12 · 54' },
  { height: '30px', label: '06:18 · 61' },
  { height: '34px', label: '06:24 · 66' },
  { height: '42px', label: '06:30 · 71' },
  { height: '50px', label: '06:36 · 75' },
  { height: '56px', label: '06:42 · 78 (now)' },
]

export const agentEvents = [
  { time: '06:42', dotType: 'now',  text: '<strong>Score 78 · threshold crossed.</strong> 3 signals compounding. Checklist + skill mismatch = 71% of risk. Act within 28-minute window.', delta: '↑ +4 since last scan', deltaColor: 'text-danger' },
  { time: '06:36', dotType: 'warn', text: 'Score 75. Checklist completion fell to 61%. Sauce Dosing mismatch confirmed. Sensor A-7 count: 2.', delta: '↑ +4 since 06:30', deltaColor: 'text-warn' },
  { time: '06:30', dotType: 'warn', text: 'Score 71. Checklists at T+30 — 4 overdue. Qualified staffing 72%. Machine readiness 94%.', delta: '↑ +5 since 06:24', deltaColor: 'text-warn' },
  { time: '06:12', dotType: 'idle', text: 'Score 54. Shift started. Checklists 4 of 11. Normal early-shift state.' },
]

export const signals = [
  { name: 'Oven B · SCADA', sub: '3 days stale · maintenance ticket open', score: 31, status: 'Stale',   statusColor: 'text-danger', statusBg: 'bg-danger/10' },
  { name: 'MES · Schedule', sub: null,                                       score: 94, status: 'Healthy', statusColor: 'text-ok',     statusBg: 'bg-ok/10' },
  { name: 'HR · Roster',    sub: null,                                       score: 91, status: 'Healthy', statusColor: 'text-ok',     statusBg: 'bg-ok/10' },
  { name: 'Checklists',     sub: null,                                       score: 87, status: 'Healthy', statusColor: 'text-ok',     statusBg: 'bg-ok/10' },
]

export const forecast = [
  { time: 'Today\n14:00 PM', score: 88, scoreColor: '#3A8A5A', name: 'Line 4 · PM — M. Santos', signals: [{l:'Staffing 95%',t:'ok'},{l:'COA 80%',t:'warn'},{l:'Certs clear',t:'ok'}], action: 'TS-8811 COA gap carries into PM — resolve before 14:00', critical: false },
  { time: 'Tomorrow\n06:00 AM', score: 54, scoreColor: '#D94F2A', name: 'Line 4 · AM — Kowalski', signals: [{l:'Staffing 67%',t:'bad'},{l:'COA 80%',t:'warn'},{l:'Certs clear',t:'ok'}], action: 'Lindqvist cert expires tonight — assign backup now.', critical: true },
  { time: 'Tomorrow\n06:00 AM', score: 91, scoreColor: '#3A8A5A', name: 'Line 6 · AM — Petrov', signals: [{l:'Staffing 94%',t:'ok'},{l:'COA 100%',t:'ok'},{l:'Certs clear',t:'ok'}], action: null, critical: false },
  { time: 'Tomorrow\n14:00 PM', score: 68, scoreColor: '#C4920A', name: 'Line 3 · PM — Chen', signals: [{l:'Staffing 78%',t:'warn'},{l:'COA 100%',t:'ok'},{l:'1 cert expiring',t:'warn'}], action: 'Adeyemi cert expires in 35 days — flag for renewal now', critical: false },
]

export const pilotLog = [
  { type: 'ok', title: 'Apr 15 PM · Correct · Score 42 → OEE 87%' },
  { type: 'ok', title: 'Apr 15 AM · Correct · Score 38 → OEE 89%' },
  { type: 'miss', title: 'Apr 14 PM · Miss · Score 38 → OEE 74%' },
  { type: 'ok', title: 'Apr 14 AM · Correct · Score 81 → OEE 64%' },
  { type: 'ok', title: 'Apr 13 PM · Correct · Score 44 → OEE 85%' },
  { type: 'ok', title: 'Apr 13 AM · Correct · Score 67 → OEE 78%' },
  { type: 'part', title: 'Apr 12 PM · Partial · Score 61 → OEE 74%' },
  { type: 'ok', title: 'Apr 12 AM · Correct' },
  { type: 'ok', title: 'Apr 11 PM · Correct' },
  { type: 'ok', title: 'Apr 11 AM · Correct' },
  { type: 'miss', title: 'Apr 10 PM · Miss' },
  { type: 'ok', title: 'Apr 10 AM · Correct' },
  { type: 'ok', title: 'Apr 9 PM · Correct' },
  { type: 'ok', title: 'Apr 9 AM · Correct' },
  { type: 'part', title: 'Apr 8 PM · Partial' },
  { type: 'ok', title: 'Apr 8 AM · Correct' },
  { type: 'ok', title: 'Apr 7 PM · Correct' },
  { type: 'miss', title: 'Apr 7 AM · Miss' },
  { type: 'ok', title: 'Apr 6 PM · Correct' },
  { type: 'ok', title: 'Apr 6 AM · Correct' },
  { type: 'ok', title: 'Apr 5 PM · Correct' },
  { type: 'ok', title: 'Apr 5 AM · Correct' },
  { type: 'ok', title: 'Apr 4 PM · Correct' },
  { type: 'miss', title: 'Apr 4 AM · Miss' },
  { type: 'ok', title: 'Apr 3 PM · Correct' },
  { type: 'ok', title: 'Apr 3 AM · Correct' },
  { type: 'ok', title: 'Apr 2 PM · Correct' },
  { type: 'part', title: 'Apr 2 AM · Partial' },
]
