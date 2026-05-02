// Takorin static fake data — all prototype content in one place
// Replace individual exports with API calls when going live

export const facility = {
  name: 'Salina Campus',
  id: 'SL-04',
  user: { name: 'J. Crocker', role: 'Plant Director', initials: 'JC' },
}

export const shiftData = {
  line: 'Line 4',
  score: 78,
  confidence: 61,
  time: '06:42 AM',
  countdown: 27 * 60 + 48,
  lines: [
    { id:'l4', name:'Line 4', score:78, status:'At risk', supervisor:'AM' },
    { id:'l6', name:'Line 6', score:42, status:'Running', supervisor:'AM' },
    { id:'l3', name:'Line 3', score:61, status:'Watch', supervisor:'PM' },
    { id:'l2', name:'Line 2', score:38, status:'Clear', supervisor:'AM' },
  ],
  stats: [
    { label:'Checklist completion', value:'61%', sub:'7 of 11 cleared', fill:61, tone:'danger' },
    { label:'Qualified staffing', value:'72%', sub:'13 of 18 certified', fill:72, tone:'warn' },
    { label:'Machine readiness', value:'94%', sub:'All stations checked', fill:94, tone:'ok' },
    { label:'Current OEE', value:'—', sub:'Shift in progress', fill:0, tone:'muted' },
  ],
  findings: [
    {
      id:'sf1', num:'I.', urgency:'danger',
      title:'Complete startup checklists — Oven Station B + Topping Line',
      desc:'4 of 11 startup checklists remain open at T+42 min. Incomplete checklists at 60 minutes correlate with 18% elevated scrap rate on Pepperoni Classic runs across 340 comparable shifts.',
      evidence:'Precedent: Line 4 · Apr 2 — same 3-signal pattern → 61% OEE final outcome',
      actions:['Assign to Kowalski','Log only'],
      consequence:'Assigned to Kowalski · Checklist signal flagged for re-evaluation · Risk score will update in 4 min',
    },
    {
      id:'sf2', num:'II.', urgency:'warn',
      title:'Reassign Martinez (L3) to Sauce Dosing — Reyes (L1) is a mismatch',
      desc:'Sauce Dosing requires Level 3 at today\'s production volume. Martinez is available. Swap raises qualified staffing 72% → 83%.',
      evidence:'Precedent: Skill mismatch at Sauce Dosing in 3 of last 8 substandard shifts on Line 4',
      actions:['Confirm reassignment','Dismiss'],
      consequence:'Martinez reassigned to Sauce Dosing · Qualified staffing updating: 72% → 83% · Risk score updates in 4 min',
    },
    {
      id:'sf3', num:'III.', urgency:'muted',
      title:'Watch order — Sensor A-7 micro-variance',
      desc:'3 readings outside normal range in 20 min. Below threshold (5 required). Pattern matches pre-jam signature from 2–3 shifts before the April 2nd incident.',
      evidence:'Watch: 3-shift leading indicator only — escalate if count reaches 5',
      actions:['Log inspection task','Alert at 5'],
    },
  ],
  crew: [
    { name:'D. Kowalski', role:'Supervisor · L4', dots:[1,1,1,1,0] },
    { name:'A. Martinez', role:'Operator · L3', dots:[1,1,1,0,0] },
    { name:'C. Reyes', role:'Operator · L1 — Mismatch ⚠', dots:[1,0,0,0,0], flag:true },
    { name:'P. Okonkwo', role:'Operator · L2', dots:[1,1,0,0,0] },
  ],
  agentTimeline: [
    { time:'06:42', level:'now', event:'Score 78 · threshold crossed. 3 signals compounding. Checklist + skill mismatch = 71% of risk. Act within 28-minute window.', delta:'+4', deltaColor:'text-danger' },
    { time:'06:36', level:'warn', event:'Score 75. Checklist completion fell to 61%. Sauce Dosing certification mismatch confirmed. Sensor A-7 variance: 2.', delta:'+4', deltaColor:'text-warn' },
    { time:'06:30', level:'warn', event:'Score 71. Checklists at T+30 — 4 overdue. Staffing 72%. Machine readiness 94%.', delta:'+5', deltaColor:'text-warn' },
    { time:'06:12', level:'normal', event:'Score 54. Shift started. Checklists 4 of 11 cleared. Normal early-shift state.' },
  ],
  sparkline: [22,30,34,42,50,56],
  signals: [
    { name:'Oven B · SCADA', sub:'3 days stale', score:31, status:'Stale', tone:'danger' },
    { name:'MES · Schedule', sub:'12 min ago', score:94, status:'Healthy', tone:'ok' },
    { name:'HR · Roster', sub:'06:00 today', score:91, status:'Healthy', tone:'ok' },
    { name:'Checklists', sub:'Live', score:87, status:'Healthy', tone:'ok' },
  ],
  forecast: [
    { time:'Today\n14:00 PM', score:88, name:'Line 4 · PM — M. Santos', signals:['Staffing 95%:ok','COA 80%:warn','Certs clear:ok'], action:'TS-8811 COA gap carries into PM — resolve before 14:00' },
    { time:'Tomorrow\n06:00 AM', score:54, name:'Line 4 · AM — Kowalski', signals:['Staffing 67%:danger','COA 80%:warn','Certs clear:ok'], action:'Lindqvist cert expires tonight — Line 4 AM will have 12 of 18 qualified.', urgent:true },
    { time:'Tomorrow\n06:00 AM', score:91, name:'Line 6 · AM — Petrov', signals:['Staffing 94%:ok','COA 100%:ok','Certs clear:ok'] },
    { time:'Tomorrow\n14:00 PM', score:68, name:'Line 3 · PM — Chen', signals:['Staffing 78%:warn','COA 100%:ok','1 cert expiring:warn'], action:'Adeyemi cert expires in 35 days' },
  ],
  pilotAccuracy: 82,
  pilotStats: [
    { label:'Shifts called correctly', val:'23 of 28', color:'text-ok' },
    { label:'High-risk correctly flagged', val:'8 of 9', color:'text-ok' },
    { label:'Missed predictions', val:'5', color:'text-danger' },
    { label:'Root of misses', val:'Late deliveries', color:'text-warn' },
  ],
  pilotLog: ['ok','ok','miss','ok','ok','ok','part','ok','ok','ok','miss','ok','ok','ok','part','ok','ok','miss','ok','ok','ok','ok','ok','miss','ok','ok','ok','part'],
}

export const handoffData = {
  id:'HO-2604161', line:'Line 4', date:'April 16, 2026', time:'14:02',
  outgoing:'D. Kowalski · L4', incoming:'M. Santos · L4',
  oee:'81%', units:'38,420 of 42,000',
  stats: [
    { label:'OEE final', value:'81%', sub:'1pt below 82% target', fill:81, tone:'ok' },
    { label:'Units produced', value:'38.4K', sub:'91.5% of 42,000 target', fill:92, tone:'ok' },
    { label:'Scrap rate', value:'2.1%', sub:'Below 3% target', fill:71, tone:'ok' },
    { label:'Carry-forward items', value:'1', sub:'Sensor A-7 watch', fill:20, tone:'warn' },
  ],
  cases: [
    { num:'I.', urgency:'ok', title:'Interventions acted — risk score recovered 78 → 34',
      desc:'Risk score recovered to 52 by 07:15 and settled at 34 by mid-shift. OEE trajectory recovered from 71% at T+42 to an 81% final close.',
      events:[{time:'06:42 — Acted',val:'Completed 4 overdue startup checklists on Oven B + Topping Line'},{time:'06:48 — Acted',val:'Martinez reassigned to Sauce Dosing — qualified staffing 72% → 83%'}] },
    { num:'II.', urgency:'warn', title:'Carry-forward: Sensor A-7 — watch at variance count 4',
      desc:'Micro-variance count reached 4. Maintenance verbally notified at 13:40 — bearings to be inspected overnight.',
      evidence:'PM supervisor: watch early in your shift. If count reaches 5, escalate immediately.' },
    { num:'III.', urgency:'ok', title:'Supervisor note — Reyes for L2 Sauce Dosing certification',
      desc:'Reyes showed strong initiative after the reassignment. Recommend for L2 Sauce Dosing certification pathway.' },
  ],
  operators: [
    { initials:'CR', name:'C. Reyes', role:'L1 · Pack Line · 14 months', pct:72, color:'bg-warn', label:'72% to L2 Sauce Dosing', badge:'Nominate', badgeTone:'warn', fromCapa:'Nominated by Kowalski · Apr 16 handoff' },
    { initials:'PO', name:'P. Okonkwo', role:'L2 · Topping · 22 months', pct:91, color:'bg-ok', label:'91% to L3 Sauce Dosing', badge:'Ready', badgeTone:'ok' },
    { initials:'FA', name:'F. Adeyemi', role:'L1 · QA · 8 months', pct:40, color:'bg-ghost', label:'40% to L2 — watch', badge:'Watch', badgeTone:'muted' },
  ],
  lastHandoffs: [
    { shift:'Apr 15 PM · Santos', oee:'88%', tone:'text-ok' },
    { shift:'Apr 15 AM · Kowalski', oee:'79%', tone:'text-warn' },
    { shift:'Apr 14 PM · Santos', oee:'84%', tone:'text-ok' },
    { shift:'Apr 14 AM · Kowalski', oee:'71%', tone:'text-danger' },
    { shift:'Apr 13 PM · Petrov', oee:'86%', tone:'text-ok' },
  ],
}

export const supplierData = {
  stats: [
    { label:'COA verified', value:'4/5', sub:'1 missing', fill:80, tone:'warn' },
    { label:'Delivery on track', value:'4/5', sub:'1 delayed 6 h', fill:80, tone:'warn' },
    { label:'Expiring < 14 days', value:'2', sub:'Tomato · Canola lots', fill:40, tone:'danger' },
    { label:'Price alerts', value:'2', sub:'Tomato +14% · Oil +8%', fill:40, tone:'warn' },
    { label:'Audit readiness', value:'91%', sub:'FSMA 204', fill:91, tone:'ok' },
    { label:'FDA inspection', value:'18d', sub:'Apr 16 → May 4', fill:40, tone:'warn' },
  ],
  lots: [
    { ing:'Wheat flour', supplier:'Sysco · WF-2204', po:'Apr 14', shelf:42, shelfTone:'ok', delivery:'Delivered', deliveryTime:'Apr 14 · 09:30', deliveryTone:'ok', coa:'Verified', coaTone:'ok' },
    { ing:'Tomato sauce', supplier:'ConAgra · TS-8811', po:'Apr 14', shelf:9, shelfTone:'danger', useFirst:true, delivery:'Delayed 6 h', deliveryTime:'Expected 18:00 today', deliveryTone:'warn', coa:'COA Missing', coaTone:'danger', urgent:true },
    { ing:'Mozzarella', supplier:'Dairy Fresh · MC-3390', po:'Apr 15', shelf:38, shelfTone:'ok', delivery:'Delivered', deliveryTime:'Apr 15 · 11:15', deliveryTone:'ok', coa:'Verified', coaTone:'ok' },
    { ing:'Pepperoni', supplier:'Smithfield · PP-7714', po:'Apr 15', shelf:21, shelfTone:'ok', delivery:'Delivered', deliveryTime:'Apr 15 · 14:00', deliveryTone:'ok', coa:'Verified', coaTone:'ok' },
    { ing:'Canola oil', supplier:'ADM · CO-5502', po:'Apr 16', shelf:12, shelfTone:'warn', useFirst:true, delivery:'In transit', deliveryTime:'ETA 16:30 today', deliveryTone:'int', coa:'Pending', coaTone:'warn' },
  ],
  suppliers: [
    { rank:1, name:'Sysco', tier:'Preferred', tierTone:'ok', score:98, scoreColor:'text-ok' },
    { rank:2, name:'Dairy Fresh', tier:'Preferred', tierTone:'ok', score:96, scoreColor:'text-ok' },
    { rank:3, name:'Smithfield', tier:'Qualified', tierTone:'int', score:94, scoreColor:'text-int' },
    { rank:4, name:'ADM', tier:'Qualified', tierTone:'int', score:82, scoreColor:'text-warn' },
    { rank:5, name:'ConAgra', tier:'Provisional', tierTone:'danger', score:71, scoreColor:'text-danger' },
  ],
  fdaSteps: [
    { label:'CAPA register complete', sub:'14 cases · all evidence-gated', status:'Done', statusColor:'text-ok', tone:'ok' },
    { label:'Sanitation records', sub:'All lines · current', status:'Done', statusColor:'text-ok', tone:'ok' },
    { label:'FSMA 204 traceability', sub:'TS-8811 chain gap · naming conflict', status:'Blocking', statusColor:'text-danger', tone:'gap' },
    { label:'ConAgra SQF renewal', sub:'Expires May 12', status:'26d', statusColor:'text-warn', tone:'pend' },
    { label:'Audit package export', sub:'1 item blocks export', status:'Pending', statusColor:'text-warn', tone:'pend' },
  ],
  gaps: [
    { title:'COA missing — TS-8811', sub:'ConAgra · Required Apr 18 · blocks FSMA chain', badge:'Blocking', badgeColor:'text-danger', tone:'block' },
    { title:'ConAgra SQF renewal', sub:'Expires May 12 · auto-request sent', badge:'26d', badgeColor:'text-warn', tone:'warn' },
    { title:'Sanitation log · Line 4', sub:'Due today · QA tech assigned', badge:'Today', badgeColor:'text-ok', tone:'ok' },
  ],
}

export const capaData = {
  cases: [
    { id:'CAPA-2604-001', urgency:'danger', num:'!', title:'Line 4 Conveyor Bearing Failure — Sensor A-7 threshold breach',
      sub:'Overdue · 7 days · auto-created from ShiftIQ', status:'Overdue', statusTone:'danger',
      assigned:'D. Kowalski', rootCause:'Equipment — Preventive maintenance gap', due:'Apr 9 — 7 days overdue',
      desc:'Sensor A-7 variance count reached 8. Conveyor jam at 09:22. 47 min downtime. ~$14,200 production loss. Corrective measure not yet submitted.',
      actions:['Escalate to director','Reassign'],
    },
    { id:'CAPA-2604-003', urgency:'warn', num:'§', title:'Sanitation log gap — Line 6 PM shift, April 9',
      sub:'Pending review · auto-created from Compliance', status:'Awaiting closure', statusTone:'warn',
      assigned:'QA Tech T. Osei', rootCause:'Process — Documentation gap', due:'Apr 14 · submitted',
      evidence:'4 files submitted Apr 14',
      desc:'Updated SOP v2.1 uploaded. Line 6 PM QA coverage revised. Training session completed Apr 13. 5 subsequent PM logs filed on time.',
      actions:['Approve & close case','Return — insufficient evidence'],
      canClose:true,
    },
    { id:'CAPA-2604-007', urgency:'warn', num:'III.', title:'Supplier COA rejection — Tomato Sauce Lot TS-8811, ConAgra',
      sub:'Open · auto-created from SupplierIQ', status:'In progress', statusTone:'warn',
      assigned:'A. Novotny', rootCause:'Supplier — Documentation error', due:'Apr 23',
      desc:'COA submitted with incorrect test date. Rejected. Corrected version requested. Production start currently blocked.',
      actions:['Follow up — ConAgra','Log update'],
    },
  ],
  patternDots: [
    { label:'Skill / Cert mismatch', sub:'7 of 9 at Sauce Dosing · Lines 4 & 6', count:9, dots:['d4','d4','d4','d4','d4','d4','d4','d3','d2'] },
    { label:'PM gap · Equipment', sub:'Oven B recurring · Lines 4 & 3', count:7, dots:['d4','d4','d4','d3','d3','d2','d1','empty','empty'] },
    { label:'Documentation lag', sub:'CAPA closed without evidence', count:5, dots:['w4','w3','w3','w2','w1','empty','empty','empty','empty'] },
    { label:'Supplier non-conformance', sub:'ConAgra · 3 of 4 cases', count:4, dots:['w4','w3','w2','w1','empty','empty','empty','empty','empty'] },
    { label:'Sanitation gap', sub:'Line 6', count:3, dots:['w3','w2','w1','empty','empty','empty','empty','empty','empty'] },
    { label:'Checklist omission', sub:'Startup · various lines', count:2, dots:['w2','w1','empty','empty','empty','empty','empty','empty','empty'] },
    { label:'Foreign material · Allergen', sub:'1 case each · resolved', count:2, dots:['ok','ok','empty','empty','empty','empty','empty','empty','empty'] },
  ],
  benchmarks: [
    { metric:'OEE — Line 4, 30-day trailing', rank:'68 / 100', score:'82%', delta:'+2.1%', deltaUp:true, index:68,
      peers:[{medal:'🥇',name:'Plant KS-02',val:'94%'},{medal:'🥈',name:'Plant MN-07',val:'91%'},{medal:'🥉',name:'Plant TX-11',val:'89%'}],
      zones:[{label:'Below\n0–70%',color:'text-danger'},{label:'Watch\n70–80%',color:'text-warn'},{label:'Target\n80–95%',color:'text-ok'}] },
    { metric:'CAPA on-time closure', rank:'44 / 100', score:'78%', delta:'below median', deltaUp:false, index:44,
      note:'Resolving 2 overdue cases would move you to the 71st percentile.',
      peers:[{medal:'🥇',name:'Plant KS-02',val:'100%'},{medal:'🥈',name:'Plant OH-03',val:'98%'},{medal:'🥉',name:'Plant TX-11',val:'96%'}],
      zones:[{label:'Risk\n0–60%',color:'text-danger'},{label:'Watch\n60–80%',color:'text-warn'},{label:'Target\n80–100%',color:'text-ok'}] },
    { metric:'Shifts above risk threshold', rank:'72 / 100', score:'12%', delta:'↑ top quartile nearby', deltaUp:true, index:72,
      peers:[],
      zones:[{label:'High risk\n>25%',color:'text-danger'},{label:'Watch\n10–25%',color:'text-warn'},{label:'Target\n<10%',color:'text-ok'}] },
  ],
}

export const haccpData = {
  allergenChangeover: {
    required: true,
    from: 'Pepperoni Classic',
    to: 'Gluten-Free Flatbread',
    line: 'Line 4',
    note: 'Full allergen flush required — wheat and dairy must be cleared before GF run.',
  },
  ccps: [
    { station: 'Oven Station B', ccp: 'CCP-3', limit: '185°F minimum', skuNote: 'GF-Flatbread only — Pepperoni limit is 170°F', regulation: 'HACCP 21 CFR 120.7' },
    { station: 'Sauce Dosing',   ccp: 'CCP-1', limit: '60°C minimum hold temp', skuNote: 'All SKUs', regulation: 'HACCP 21 CFR 120.7' },
    { station: 'Pack Line',      ccp: 'CCP-4', limit: 'Seal integrity 100%', skuNote: 'All SKUs — allergen cross-contact risk at seal failure', regulation: 'GMP 21 CFR 110' },
  ],
  regulatoryDigest: [
    { framework: 'FSMA 204', openCAPAs: 2, highestRisk: 'danger', topAction: 'Resolve TS-8811 naming conflict to complete lot traceability chain' },
    { framework: 'HACCP',    openCAPAs: 2, highestRisk: 'danger', topAction: 'Close CAPA-2604-001 — Sensor A-7 breach maps to CCP-3' },
    { framework: 'GMP — Personnel', openCAPAs: 0, highestRisk: 'ok', topAction: null },
    { framework: 'Sanitation 21 CFR 110.35', openCAPAs: 1, highestRisk: 'warn', topAction: 'Close CAPA-2604-003 — Line 6 PM sanitation log gap' },
  ],
}

export const sanitationLogs = [
  { line: 'Line 4', shift: 'AM', status: 'complete', time: '05:50', tech: 'T. Osei',  checks: 7, total: 7, capaId: null },
  { line: 'Line 6', shift: 'PM', status: 'gap',      time: 'Apr 9', tech: 'Not logged', checks: 5, total: 7, capaId: 'CAPA-2604-003' },
  { line: 'Line 3', shift: 'AM', status: 'complete', time: '05:45', tech: 'M. Chen',  checks: 7, total: 7, capaId: null },
  { line: 'Line 2', shift: 'AM', status: 'complete', time: '06:00', tech: 'J. Patel', checks: 7, total: 7, capaId: null },
]

export const certExpiry = [
  { name: 'B. Lindqvist', role: 'Operator · Line 4', cert: 'L3 Oven Operator', expiresIn: 0,  line: 'Line 4', tone: 'danger', note: 'Expires tonight — Line 4 AM will be short 1 L3' },
  { name: 'F. Adeyemi',   role: 'Operator · QA',     cert: 'L2 QA Inspector',  expiresIn: 35, line: 'Line 4', tone: 'warn',   note: 'Renew before end of May' },
  { name: 'M. Chen',      role: 'Supervisor · L3',   cert: 'L3 Pack Lead',     expiresIn: 84, line: 'Line 3', tone: 'ok',     note: null },
]

export const productionRate = {
  unitsProduced: 23480,
  unitsTarget: 42000,
  hoursElapsed: 4.5,
  hoursTotal: 8,
  currentRate: 5218,
  projectedUnits: 38840,
  projectedOEE: 79,
  tone: 'warn',
}

export const crewHoursData = {
  'D. Kowalski': { hoursThisWeek: 44, consecutive: 5 },
  'A. Martinez':  { hoursThisWeek: 52, consecutive: 6 },
  'C. Reyes':     { hoursThisWeek: 36, consecutive: 4 },
  'P. Okonkwo':   { hoursThisWeek: 40, consecutive: 5 },
  'F. Adeyemi':   { hoursThisWeek: 32, consecutive: 4 },
  'B. Lindqvist': { hoursThisWeek: 58, consecutive: 7 },
  'M. Santos':    { hoursThisWeek: 42, consecutive: 5 },
  'J. Patel':     { hoursThisWeek: 38, consecutive: 4 },
  'K. Novak':     { hoursThisWeek: 34, consecutive: 4 },
}

export const scheduleData = {
  days: [
    { date: 'Apr 16', label: 'Today', conflicts: [], shifts: [
      { time: 'AM 06:00–14:00', line: 'Line 4', supervisor: 'D. Kowalski', crew: ['A. Martinez · L3','C. Reyes · L1','P. Okonkwo · L2','F. Adeyemi · L1'] },
      { time: 'PM 14:00–22:00', line: 'Line 4', supervisor: 'M. Santos',   crew: ['B. Lindqvist · L3','J. Patel · L2','K. Novak · L2'] },
    ]},
    { date: 'Apr 17', label: 'Tomorrow', conflicts: ['Lindqvist L3 cert expires tonight — Line 4 AM undersupplied'], shifts: [
      { time: 'AM 06:00–14:00', line: 'Line 4', supervisor: 'D. Kowalski', crew: ['A. Martinez · L3','C. Reyes · L1','P. Okonkwo · L2'] },
      { time: 'PM 14:00–22:00', line: 'Line 4', supervisor: 'M. Santos',   crew: ['J. Patel · L2','K. Novak · L2'] },
    ]},
    { date: 'Apr 18', label: 'Apr 18', conflicts: [], shifts: [
      { time: 'AM 06:00–14:00', line: 'Line 4', supervisor: 'D. Kowalski', crew: ['A. Martinez · L3','C. Reyes · L1','P. Okonkwo · L2','F. Adeyemi · L1'] },
    ]},
  ],
}

export const empResultsHistory = [
  { date: 'Apr 15', zone: 'Zone 1', location: 'Sauce Dosing',  result: 'negative', cfu: null, operator: 'T. Osei', capaId: null },
  { date: 'Apr 9',  zone: 'Zone 1', location: 'Sauce Dosing',  result: 'negative', cfu: null, operator: 'T. Osei', capaId: null },
  { date: 'Apr 2',  zone: 'Zone 2', location: 'Oven B area',   result: 'positive', cfu: 12,   operator: 'T. Osei', capaId: 'CAPA-2604-EMP-01' },
  { date: 'Mar 26', zone: 'Zone 1', location: 'Pack Line',     result: 'negative', cfu: null, operator: 'T. Osei', capaId: null },
  { date: 'Mar 19', zone: 'Zone 1', location: 'Sauce Dosing',  result: 'negative', cfu: null, operator: 'T. Osei', capaId: null },
]

export const supplierAudits = {
  'ConAgra':     { lastAudit: 'Nov 2025', findings: 3, result: 'Conditional', nextAudit: 'May 2026', reason: '3 documentation findings · 2 COA errors on last 4 deliveries', needsAction: true },
  'Sysco':       { lastAudit: 'Jan 2026', findings: 0, result: 'Approved',    nextAudit: 'Jan 2027', reason: null, needsAction: false },
  'Dairy Fresh': { lastAudit: 'Mar 2026', findings: 0, result: 'Approved',    nextAudit: 'Mar 2027', reason: null, needsAction: false },
  'Smithfield':  { lastAudit: 'Dec 2025', findings: 1, result: 'Approved',    nextAudit: 'Dec 2026', reason: '1 minor finding — resolved', needsAction: false },
  'ADM':         { lastAudit: 'Feb 2026', findings: 1, result: 'Approved',    nextAudit: 'Feb 2027', reason: '1 minor — price disclosure delay', needsAction: false },
}

export const goalsData = [
  { id: 'g1', label: 'Skill / Cert mismatch CAPAs', current: 9, target: 6, unit: 'cases', deadline: 'Jun 30', direction: 'reduce' },
  { id: 'g2', label: 'CAPA on-time closure rate',   current: 78, target: 90, unit: '%',    deadline: 'Jun 30', direction: 'increase' },
  { id: 'g3', label: 'OEE — Line 4 trailing 30d',   current: 82, target: 88, unit: '%',    deadline: 'Jun 30', direction: 'increase' },
]

export const networkData = {
  plants: [
    { id: 'sl', name: 'Salina Campus',  code: 'SL-04', score: 71, status: 'at-risk', active: true,  lots: ['TS-8811', 'CO-5502'] },
    { id: 'tx', name: 'Plant TX-11',    code: 'TX-11', score: 89, status: 'clear',   active: false, lots: ['TS-8812', 'CO-5501', 'TS-8811'] },
    { id: 'ks', name: 'Plant KS-02',    code: 'KS-02', score: 94, status: 'clear',   active: false, lots: ['WF-2203', 'TS-8810'] },
  ],
  sharedExposure: [
    { lotId: 'TS-8811', ingredient: 'Tomato Sauce', supplier: 'ConAgra', affectedPlants: ['sl', 'tx'], totalUnits: 5840, risk: 'danger', note: 'COA missing · recall blast radius: 2 plants · 5,840 units' },
    { lotId: 'CO-5502', ingredient: 'Canola Oil',   supplier: 'ADM',     affectedPlants: ['sl'],       totalUnits: 1920, risk: 'warn',   note: 'Price spike +8% · Salina only' },
  ],
}

export const readinessData = {
  score: 64,
  stats: [
    { label:'Overall readiness', value:'64', sub:'of 100', fill:64, tone:'warn' },
    { label:'Sources connected', value:'5/5', sub:'All live', fill:100, tone:'ok' },
    { label:'Naming conflicts', value:'2', sub:'Cross-plant', fill:40, tone:'warn' },
    { label:'Context gaps', value:'1', sub:'Critical — Oven B', fill:20, tone:'danger' },
    { label:'Recommendations trusted', value:'60%', sub:'High-confidence signals', fill:60, tone:'warn' },
  ],
  sources: [
    { name:'MES — Line 4 schedule', sub:'Production schedule, downtime events', score:94, freshness:'12 min ago', consistency:94, status:'Healthy', tone:'ok' },
    { name:'SCADA — Oven Station B', sub:'Temperature, pressure, cycle time', score:31, freshness:'3 days ago', consistency:88, status:'Stale', tone:'danger' },
    { name:'ERP — Ingredient master', sub:'Ingredient names, supplier codes', score:58, freshness:'2h ago', consistency:58, status:'Conflicts', tone:'warn' },
    { name:'HR — Certification registry', sub:'Operator certifications', score:91, freshness:'06:00 today', consistency:91, status:'Healthy', tone:'ok' },
    { name:'Checklist system', sub:'Startup, sanitation, QA checklists', score:87, freshness:'Live', consistency:87, status:'Healthy', tone:'ok' },
  ],
  conflicts: [
    { title:'Tomato sauce — 3 names across 2 plants and the ERP',
      desc:'Salina Plant (MES) uses "Tomato Sauce." The ERP uses "Tomato Paste, Concentrate." The supplier portal references "Tomato Puree, Processed." Takorin treats these as three separate ingredients.',
      variants:['MES: "Tomato Sauce"','ERP: "Tomato Paste, Concentrate"','Supplier portal: "Tomato Puree, Processed"'],
      points:8 },
    { title:'Canola oil — 2 names between MES and checklist system',
      desc:'The MES tracks "Canola Oil." The startup checklist refers to "Vegetable Oil (Canola)." Shelf life alerts fire on the MES record but cannot confirm the checklist completion signal.',
      variants:['MES: "Canola Oil"','Checklists: "Vegetable Oil (Canola)"'],
      points:6 },
  ],
  steps: [
    { num:'1.', title:'Set canonical ingredient names — resolve the Tower of Babel', desc:'Map every variant name to a single canonical identifier. The MES, ERP, checklist, and supplier portal continue using their own naming conventions — Takorin translates all of them.', effort:'Estimated: 2–4 hours with a plant manager. No technical work required.' },
    { num:'2.', title:'Map SKU-to-sensor profiles for all active lines', desc:'For each sensor, define the expected operating range per active SKU. Replaces generic rolling-average anomaly detection with product-specific threshold evaluation.', effort:'Estimated: 1 day with QA and operations. 8 SKUs × 3 sensors = 24 threshold pairs.' },
    { num:'3.', title:'Restore Oven B SCADA feed and validate signal continuity', desc:'Once hardware is restored, run a 24-hour validation period before re-enabling as a risk score input.', effort:'Maintenance ticket is open. 24-hour validation window after fix.' },
  ],
  unlocks: [
    { title:'Cross-plant risk correlation', sub:'A supplier alert flags all plants using that ingredient — not just Salina.' },
    { title:'SKU-specific safety thresholds', sub:'Oven B alerts fire against the right product limit, not a generic average.' },
    { title:'Spend optimisation', sub:'Consolidated ingredient view reveals volume to negotiate.' },
    { title:'FSMA 204 full traceability', sub:'Lot-level chain connects without gaps when names are canonical.' },
  ],
}

// ── Command Surface — synthesized action queue across all modules
export const commandData = {
  items: [
    {
      id: 'cmd-1',
      priority: 1,
      urgency: 'danger',
      title: 'CCP-1 hold temp below minimum — Sauce Dosing',
      detail: 'Line 4 running at 57°C vs 60°C required minimum. HACCP violation active. Station operator (Reyes, L1) lacks CCP-1 certification — L2 required.',
      action: 'Halt dosing, assign Martinez (L3) to station, log HACCP deviation immediately',
      owner: { name: 'Kowalski', role: 'Supervisor' },
      module: 'shift',
      moduleLabel: 'ShiftIQ',
      moduleAccent: '#D94F2A',
      timeWindow: 'now',
      timeLabel: 'Act immediately',
    },
    {
      id: 'cmd-2',
      priority: 2,
      urgency: 'danger',
      title: 'Startup checklist 4 of 13 items overdue — Line 4',
      detail: 'Allergen changeover log, oven thermocouple calibration, and 2 others not cleared at T+42 min. Incomplete checklists at 60 min correlate with 18% elevated scrap rate.',
      action: 'Assign Kowalski to complete remaining items before T+60 or halt shift start',
      owner: { name: 'Kowalski', role: 'Supervisor' },
      module: 'shift',
      moduleLabel: 'ShiftIQ',
      moduleAccent: '#D94F2A',
      timeWindow: '15min',
      timeLabel: 'Act in 18 min',
    },
    {
      id: 'cmd-3',
      priority: 3,
      urgency: 'warn',
      title: 'CAPA-2604-001 overdue — Oven Station B root cause',
      detail: 'Root cause verification for recurring thermocouple drift. Auto-escalation sent at 09:15 (2nd notice). Regulatory deadline: end of current shift.',
      action: 'QA manager to upload verification evidence before 14:00 handoff',
      owner: { name: 'Quality Mgr', role: 'QA Manager' },
      module: 'capa',
      moduleLabel: 'CAPA Engine',
      moduleAccent: '#C4920A',
      timeWindow: 'today',
      timeLabel: 'Before 14:00',
    },
    {
      id: 'cmd-4',
      priority: 4,
      urgency: 'warn',
      title: 'COA gap — ConAgra mozzarella batch TS-8811',
      detail: 'Certificate of Analysis missing for incoming mozzarella shipment. Batch on hold. PM shift (14:00) cannot start Pizza Flatbread production without resolution.',
      action: 'Request COA from ConAgra QA — or authorise hold extension and PM shift adjustment',
      owner: { name: 'Purchasing', role: 'Purchasing Mgr' },
      module: 'supplier',
      moduleLabel: 'SupplierIQ',
      moduleAccent: '#8A6A3A',
      timeWindow: '1h',
      timeLabel: 'Resolve before PM shift',
    },
    {
      id: 'cmd-5',
      priority: 5,
      urgency: 'watch',
      title: 'Kowalski fatigue flag — 62h this week',
      detail: 'Above the 60h watch threshold. Below danger level (68h). No immediate action needed, but any overtime extension today would push into the danger zone.',
      action: 'Do not extend overtime today. Flag for scheduling review by 14:00.',
      owner: { name: 'Kowalski', role: 'Supervisor' },
      module: 'shift',
      moduleLabel: 'ShiftIQ',
      moduleAccent: '#D94F2A',
      timeWindow: 'watch',
      timeLabel: 'Monitor — 2h',
    },
    {
      id: 'cmd-6',
      priority: 6,
      urgency: 'watch',
      title: 'Tomorrow AM staffing — Lindqvist cert expires tonight',
      detail: 'Line 4 AM shift will drop to 12 of 18 qualified operators. Below 72% threshold. No action needed tonight but resolution must happen before 22:00.',
      action: 'Schedule replacement cert or cross-train cover before end of current shift',
      owner: { name: 'HR', role: 'Workforce Mgr' },
      module: 'shift',
      moduleLabel: 'ShiftIQ',
      moduleAccent: '#D94F2A',
      timeWindow: 'watch',
      timeLabel: 'Resolve today',
    },
  ],
}
