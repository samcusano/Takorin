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
  rawConfidence: 84,
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
    { label:'Certified staffing', value:'72%', sub:'13 of 18 certified', fill:72, tone:'warn' },
    { label:'Machine readiness', value:'94%', sub:'All stations checked', fill:94, tone:'ok' },
    { label:'Current OEE', value:'—', sub:'Shift in progress', fill:0, tone:'muted' },
  ],
  findings: [
    {
      id:'sf1', num:'I.', urgency:'danger',
      source:'Checklists · Live',
      title:'Complete startup checklists — Oven Station B + Topping Line',
      desc:'4 of 11 startup checklists remain open at T+42 min. Incomplete checklists at 60 minutes correlate with 18% elevated scrap rate on Pepperoni Classic runs across 340 comparable shifts.',
      evidence:'Precedent: Line 4 · Apr 2 — same 3-signal pattern → 61% OEE final outcome',
      actions:['Assign to Kowalski','Log only'],
      consequence:'Assigned to Kowalski · Checklist signal flagged for re-evaluation · Risk score will update in 4 min',
    },
    {
      id:'sf2', num:'II.', urgency:'warn',
      source:'HR · Roster',
      title:'Reassign Martinez (L3) to Sauce Dosing — Reyes (L1) is a mismatch',
      desc:'Sauce Dosing requires Level 3 at today\'s production volume. Martinez is available. Swap raises qualified staffing 72% → 83%.',
      evidence:'Precedent: Skill mismatch at Sauce Dosing in 3 of last 8 substandard shifts on Line 4',
      actions:['Confirm reassignment'],
      consequence:'Martinez reassigned to Sauce Dosing · Qualified staffing updating: 72% → 83% · Risk score updates in 4 min',
    },
    {
      id:'sf3', num:'III.', urgency:'warn',
      source:'Sensor A-7 · Live',
      capaId:'CAPA-2604-001',
      title:'Sensor A-7 — projected threshold breach',
      desc:'4 of 5 variance readings · Projected breach ∼2 shifts at current trend. Bearing inspection required before next shift.',
      evidence:'Pattern matches Apr 2 bearing failure — same micro-variance signature 3 shifts prior',
      actions:['Create inspection task','Alert at count 5'],
      consequence:'Inspection task created · Ticket MT-001 open · Alert fires at count 5',
    },
    {
      id:'sf4', num:'IV.', urgency:'warn',
      source:'HR · Roster + Schedule',
      title:'Tomorrow AM staffing gap — act before tonight',
      desc:'Line 4 AM (Kowalski) will have 12 of 18 qualified operators. Lindqvist L3 cert expires tonight — drops below 72% staffing threshold.',
      evidence:'Lindqvist cert expires 22:00 tonight. No backup cross-trained. Tomorrow AM risk score: 54.',
      actions:['Schedule backup cert','Flag for HR'],
      consequence:'HR flagged · Backup cert scheduled · Tomorrow AM risk score will update',
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

export const line6Data = {
  line: 'Line 6',
  score: 42,
  supervisor: 'B. Petrov',
  stats: [
    { label:'Checklist completion', value:'100%', sub:'11 of 11 cleared', fill:100, tone:'ok' },
    { label:'Certified staffing', value:'89%', sub:'16 of 18 certified', fill:89, tone:'ok' },
    { label:'Machine readiness', value:'97%', sub:'All stations checked', fill:97, tone:'ok' },
    { label:'Current OEE', value:'—', sub:'Shift in progress', fill:0, tone:'muted' },
  ],
  findings: [
    {
      id:'l6f1', num:'I.', urgency:'warn',
      source:'HR · Schedule',
      title:'Novak L2 cert expiry in 8 days — no backup cross-trained',
      desc:'K. Novak L2 Topping cert expires April 24. No operator on Line 6 is cross-trained at this station. Affects PM crew coverage next week.',
      evidence:'No scheduling conflict today. Renewal window: 7 days.',
      actions:['Schedule renewal','Flag for HR'],
      consequence:'HR flagged · Renewal scheduled · Line 6 PM crew updated',
    },
    {
      id:'l6f2', num:'II.', urgency:'watch',
      source:'Sensor C-2 · Live',
      title:'Conveyor C-2 belt tension — monitor this shift',
      desc:'Belt tension reading 2.4% below baseline for the last 30 min. Within spec, but trending. Flag if it crosses 5%.',
      evidence:'Same pattern observed 3 weeks prior — resolved with re-tensioning at end of shift.',
      actions:['Log and monitor','Create maintenance note'],
      consequence:'Maintenance note created · Flagged for end-of-shift inspection',
    },
  ],
  crew: [
    { name:'B. Petrov', role:'Supervisor · L4', dots:[1,1,1,1,0] },
    { name:'K. Novak', role:'Operator · L2', dots:[1,1,0,0,0] },
    { name:'J. Patel', role:'Operator · L2', dots:[1,1,0,0,0] },
    { name:'T. Osei', role:'Operator · L1', dots:[1,0,0,0,0] },
  ],
  sparkline: [38, 40, 41, 40, 43, 42],
  signals: [
    { name:'Oven A · SCADA', sub:'1 min ago', score:97, status:'Healthy', tone:'ok' },
    { name:'MES · Schedule', sub:'8 min ago', score:94, status:'Healthy', tone:'ok' },
    { name:'HR · Roster', sub:'06:00 today', score:89, status:'Healthy', tone:'ok' },
    { name:'Checklists', sub:'Live', score:100, status:'Complete', tone:'ok' },
  ],
  agentTimeline: [
    { time:'06:42', level:'now', event:'Score 42 · shift running clean. All checklists cleared at T+30. No active risk signals.', delta:'0', deltaColor:'text-ok' },
    { time:'06:30', level:'ok', event:'Score 42. Checklists 11 of 11 cleared. Staffing 89%. Machine readiness 97%.', delta:'0', deltaColor:'text-ok' },
    { time:'06:12', level:'normal', event:'Score 42. Shift started normally. All pre-conditions met.' },
  ],
}

// ── Wichita Plant · KS-09 ─────────────────────────────────────────────────────

export const wichitaData = {
  line: 'Line 1',
  score: 71,
  confidence: 74,
  rawConfidence: 87,
  time: '06:42 AM',
  countdown: 27 * 60 + 48,
  supervisor: 'R. Vasquez',
  lines: [
    { id:'w1', name:'Line 1', score:71, status:'Watch',   supervisor:'AM' },
    { id:'w2', name:'Line 2', score:88, status:'Clear',   supervisor:'AM' },
    { id:'w3', name:'Line 3', score:62, status:'Watch',   supervisor:'PM' },
  ],
  stats: [
    { label:'Checklist completion', value:'82%', sub:'9 of 11 cleared',   fill:82, tone:'warn' },
    { label:'Certified staffing',   value:'84%', sub:'15 of 18 certified', fill:84, tone:'ok'   },
    { label:'Machine readiness',    value:'96%', sub:'All stations checked', fill:96, tone:'ok' },
    { label:'Current OEE',          value:'—',   sub:'Shift in progress',  fill:0,  tone:'muted' },
  ],
  findings: [
    {
      id:'wf1', num:'I.', urgency:'warn',
      source:'Checklists · Compliance',
      title:'Allergen changeover log unsigned — GF-Flatbread transition',
      desc:'Line 1 transitioning from Pepperoni Classic to GF-Flatbread at 07:15. 3 of 7 allergen changeover steps completed. Supervisor sign-off required before restart.',
      evidence:'Pattern: 3 of last 8 allergen changeover delays on Wichita Line 1 led to scrap rate above 4%',
      actions:['Sign off changeover', 'Delay transition'],
      consequence:'Allergen changeover logged · Line 1 cleared for GF-Flatbread restart · Risk score updates in 4 min',
    },
    {
      id:'wf2', num:'II.', urgency:'watch',
      source:'Sensor D-3 · Live',
      title:'Conveyor D-3 belt speed — 1.8% below baseline, trending',
      desc:'Belt speed variance on Line 1 main conveyor. Currently within operational spec but trending lower. Escalate if variance exceeds 3%.',
      evidence:'Same reading pattern observed Apr 11 — self-corrected after 20 min warm-up. Monitor before escalating.',
      actions:['Log and monitor', 'Create maintenance note'],
      consequence:'Maintenance note created · D-3 belt flagged for end-of-shift inspection',
    },
  ],
  crew: [
    { name:'R. Vasquez', role:'Supervisor · L4', dots:[1,1,1,1,0] },
    { name:'S. Adeyemi',  role:'Operator · L2',  dots:[1,1,0,0,0] },
    { name:'L. Park',     role:'Operator · L2',  dots:[1,1,0,0,0] },
    { name:'F. Osei',     role:'Operator · L1',  dots:[1,0,0,0,0] },
  ],
  agentTimeline: [
    { time:'06:42', level:'now',    event:'Score 71 · allergen changeover incomplete at T+42 min. 3 of 7 steps signed. Sign-off required before 07:15 restart.', delta:'+8', deltaColor:'text-warn' },
    { time:'06:36', level:'warn',   event:'Score 68. Allergen changeover log opened. Transition window approaching. Belt variance flagged on D-3.',              delta:'+5', deltaColor:'text-warn' },
    { time:'06:30', level:'normal', event:'Score 63. Shift start normal. Checklists 9 of 11. Certified staffing 84%. Belt variance within spec.' },
    { time:'06:12', level:'normal', event:'Score 58. Line start-up complete. All pre-conditions met.' },
  ],
  sparkline: [38, 44, 55, 63, 68, 71],
  signals: [
    { name:'Oven C · SCADA',  sub:'2 min ago',    score:91,  status:'Healthy',    tone:'ok'   },
    { name:'MES · Schedule',  sub:'15 min ago',   score:88,  status:'Healthy',    tone:'ok'   },
    { name:'HR · Roster',     sub:'06:00 today',  score:84,  status:'Healthy',    tone:'ok'   },
    { name:'Checklists',      sub:'Live',         score:71,  status:'Incomplete', tone:'warn' },
  ],
  pilotAccuracy: 79,
  pilotStats: [
    { label:'Shifts called correctly',    val:'18 of 23', color:'text-ok'      },
    { label:'High-risk correctly flagged', val:'5 of 6',  color:'text-ok'      },
    { label:'Missed predictions',         val:'5',        color:'text-danger'  },
    { label:'Root of misses',             val:'Allergen changeovers', color:'text-warn' },
  ],
  pilotLog: ['ok','ok','ok','miss','ok','ok','ok','ok','part','ok','ok','miss','ok','ok','ok','ok','ok','miss','ok','ok','ok','ok','miss'],
}

// ── Denver Plant · CO-07 ──────────────────────────────────────────────────────

export const denverData = {
  line: 'Line 1',
  score: 84,
  confidence: 86,
  rawConfidence: 91,
  time: '06:42 AM',
  countdown: 27 * 60 + 48,
  supervisor: 'K. Nakamura',
  lines: [
    { id:'d1', name:'Line 1', score:84, status:'Clear', supervisor:'AM' },
    { id:'d2', name:'Line 2', score:91, status:'Clear', supervisor:'AM' },
  ],
  stats: [
    { label:'Checklist completion', value:'100%', sub:'11 of 11 cleared',  fill:100, tone:'ok'   },
    { label:'Certified staffing',   value:'91%',  sub:'16 of 18 certified', fill:91,  tone:'ok'   },
    { label:'Machine readiness',    value:'98%',  sub:'All stations checked', fill:98, tone:'ok'  },
    { label:'Current OEE',          value:'—',    sub:'Shift in progress',  fill:0,   tone:'muted' },
  ],
  findings: [
    {
      id:'df1', num:'I.', urgency:'watch',
      source:'HR · Roster',
      title:'Nakamura L3 allergen cert — renewal due in 22 days',
      desc:'K. Nakamura Line 3 allergen certification expires May 8. No impact on today\'s production. Renewal window opens May 1.',
      evidence:'Current production volume does not require L3 allergen cert today. Advisory only.',
      actions:['Schedule renewal', 'Flag for HR'],
      consequence:'HR flagged · Renewal window opens May 1 · Calendar reminder set',
    },
  ],
  crew: [
    { name:'K. Nakamura', role:'Supervisor · L4', dots:[1,1,1,1,0] },
    { name:'T. Reeves',   role:'Operator · L2',   dots:[1,1,0,0,0] },
    { name:'M. Ortega',   role:'Operator · L2',   dots:[1,1,0,0,0] },
    { name:'J. Williams', role:'Operator · L1',   dots:[1,0,0,0,0] },
  ],
  agentTimeline: [
    { time:'06:42', level:'now',    event:'Score 84 · shift running clean. All checklists cleared. One watch item: Nakamura allergen cert renewal due May 8.', delta:'0', deltaColor:'text-ok' },
    { time:'06:30', level:'ok',     event:'Score 84. Checklists 11 of 11 cleared. Staffing 91%. Machine readiness 98%.', delta:'0', deltaColor:'text-ok' },
    { time:'06:12', level:'normal', event:'Score 84. Shift started normally. All pre-conditions met. Denver pilot — week 3.' },
  ],
  sparkline: [82, 83, 84, 84, 83, 84],
  signals: [
    { name:'Oven E · SCADA', sub:'1 min ago',   score:98,  status:'Healthy',  tone:'ok' },
    { name:'MES · Schedule', sub:'10 min ago',  score:95,  status:'Healthy',  tone:'ok' },
    { name:'HR · Roster',    sub:'06:00 today', score:91,  status:'Healthy',  tone:'ok' },
    { name:'Checklists',     sub:'Live',        score:100, status:'Complete', tone:'ok' },
  ],
  pilotAccuracy: 91,
  pilotStats: [
    { label:'Shifts called correctly',    val:'10 of 11', color:'text-ok'     },
    { label:'High-risk correctly flagged', val:'2 of 2',  color:'text-ok'     },
    { label:'Missed predictions',         val:'1',        color:'text-danger' },
    { label:'Root of misses',             val:'Supplier late delivery', color:'text-warn' },
  ],
  pilotLog: ['ok','ok','ok','ok','ok','ok','ok','ok','ok','miss','ok'],
}

// ── Operator operational context — drives adaptive UI in OperatorView ─────────

export const operatorContextData = {
  'C. Reyes': {
    mode: 'ELEVATED_RISK_COVERAGE',
    modeLabel: 'Elevated Risk Operation',
    station: 'Sauce Dosing',
    condition: 'Allergen Changeover',
    conditionDetail: 'Covering above certification level · Supervisor oversight active',
    mismatch: true,
    mismatchNote: 'QA recommended nearby during allergen restart',
    directive: 'Complete allergen flush verification before restart',
    directiveDeadline: '07:15',
    guidanceLevel: 'high',
    dominantSurface: 'procedural',
    ccp: { label: 'CCP-1 Hold Temp', requirement: '60°C minimum', status: 'pending' },
    procedure: [
      { id: 'af1', label: 'Visual inspection of dosing head — no visible residue' },
      { id: 'af2', label: 'Allergen flush complete — volume logged' },
      { id: 'af3', label: 'Test strip result: negative' },
      { id: 'af4', label: 'Restart temperature verified at 60°C' },
      { id: 'af5', label: 'Supervisor sign-off on line restart' },
    ],
  },
  'P. Okonkwo': {
    mode: 'CCP_MONITORING',
    modeLabel: 'CCP Monitoring Active',
    station: 'Oven Station B',
    condition: 'GF-Flatbread · Bake Compliance',
    conditionDetail: '185°F compliance window stable · Next reading due 06:57',
    mismatch: false,
    directive: 'Log CCP-3 temperature reading',
    directiveDeadline: '06:57',
    guidanceLevel: 'low',
    dominantSurface: 'monitoring',
    ccp: { label: 'CCP-3 Bake Temp', requirement: '185°F minimum', status: 'stable' },
    tempLog: [
      { time: '06:12', value: 187, status: 'ok' },
      { time: '06:27', value: 188, status: 'ok' },
      { time: '06:42', value: 189, status: 'ok' },
    ],
    nextReadingMinutes: 15,
  },
  'F. Adeyemi': {
    mode: 'STANDARD_OPERATION',
    modeLabel: 'Standard Operation',
    station: 'QA Check Station',
    condition: 'Environmental Monitoring',
    conditionDetail: 'Zone 1 swab due today · All readings within spec',
    mismatch: false,
    directive: 'Complete Zone 1 environmental swab before end of shift',
    directiveDeadline: '14:00',
    guidanceLevel: 'high',
    dominantSurface: 'tasks',
    ccp: null,
  },
}

export const handoffData = {
  forecast: [
    { time:'Today\n14:00 PM', score:88, name:'Line 4 · PM — M. Santos', signals:['Staffing 95%:ok','COA 80%:warn','Certs clear:ok'], action:'TS-8811 COA gap carries into PM — resolve before 14:00' },
    { time:'Tomorrow\n06:00 AM', score:54, name:'Line 4 · AM — Kowalski', signals:['Staffing 67%:danger','COA 80%:warn','Certs clear:ok'], action:'Lindqvist cert expires tonight — Line 4 AM will have 12 of 18 qualified.', urgent:true },
    { time:'Tomorrow\n06:00 AM', score:91, name:'Line 6 · AM — Petrov', signals:['Staffing 94%:ok','COA 100%:ok','Certs clear:ok'] },
    { time:'Tomorrow\n14:00 PM', score:68, name:'Line 3 · PM — Chen', signals:['Staffing 78%:warn','COA 100%:ok','1 cert expiring:warn'], action:'Adeyemi cert expires in 35 days' },
  ],
  id:'HO-2604161', line:'Line 4', date:'April 16, 2026', time:'14:02',
  shiftNotes: {
    author: 'D. Kowalski',
    time: '14:00 · April 16',
    body: [
      'Risk score recovered well after the morning interventions — Santos set up for a clean shift if sensor and oven issues stay stable.',
      'Biggest watch items: Sensor A-7 variance count (currently 4) and filling machine pressure. Neither should block production but both need eyes at shift start.',
      'Allergen batch hold is the only hard blocker — QA knows about it and Santos has the contact.',
      'Reyes had a strong shift. Worth nominating for L2 pathway if tonight goes well.',
    ],
  },
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
    { num:'II.', urgency:'warn', title:'Sensor A-7 — watch at variance count 4',
      desc:'Micro-variance count reached 4. Maintenance verbally notified at 13:40 — bearings to be inspected overnight.',
      evidence:'PM supervisor: watch early in your shift. If count reaches 5, escalate immediately.',
      recommendedAction:'Monitor variance count at shift start. If count reaches 5, stop line and escalate to maintenance immediately.' },
    { num:'III.', urgency:'ok', title:'Reyes — nominate for L2 Sauce Dosing certification',
      desc:'Reyes showed strong initiative after the reassignment. Recommend for L2 Sauce Dosing certification pathway.' },
    { num:'IV.', urgency:'warn', title:'Oven B temperature oscillation — inspect before next shift',
      desc:'Temperature swings ±2°C detected during last 30 min of shift. Trending stable but monitor closely. May need calibration check.',
      evidence:'QA verified logs at 13:52. Post-production testing passed. Recommend pre-shift Oven B inspection.',
      recommendedAction:'Run pre-shift Oven B inspection before production start. If oscillation resumes, log and contact QA.' },
    { num:'V.', urgency:'danger', title:'Filling machine pressure relief seal — run at 95% until part arrives',
      desc:'Seal degradation observed. Maintenance recommends running at 95% capacity until part arrives. Schedule replacement during next planned downtime.',
      evidence:'Maintenance report filed at 12:30. Pressure remains stable. Operator: do not exceed 95% capacity on Pack Line without supervisor sign-off.',
      recommendedAction:'Do not exceed 95% capacity on Pack Line without supervisor sign-off. Maintenance has the part on order.' },
    { num:'VI.', urgency:'warn', title:'Receiving dock door latch — repair pending, use backup lock',
      desc:'Dock door latch intermittently fails to lock. Facilities work order 4782 submitted. Door remains functional but monitor closely during deliveries.',
      evidence:'Reported by delivery crew at 11:15. No impact on receiving procedures. Use backup manual lock if needed.',
      recommendedAction:'Use backup manual lock on dock door for all deliveries until facilities completes work order 4782.' },
    { num:'VII.', urgency:'ok', title:'Martinez — ready for L2 after 3 more supervised shifts',
      desc:'Martinez completed L1 Sauce Dosing. Recommend advancement to L2 after 3 more supervised shifts.' },
    { num:'VIII.', urgency:'danger', title:'Allergen check required — units 38,412–38,420 hold for QA sign-off',
      desc:'Unit 38,412–38,420 produced with peanut oil ingredient. Allergen label on external packaging is correct but requires internal QA verification before shipment.',
      evidence:'Discovered during final QA at 13:58. Batch flagged. Recommendation: hold batch pending allergen test confirmation.',
      recommendedAction:'Hold units 38,412–38,420 pending allergen test confirmation from QA. Do not release to shipment.' },
    { num:'IX.', urgency:'warn', title:'Water usage 12% above baseline — facilities walkthrough at shift start',
      desc:'Cooling system overcycling observed. Building utilities flagged for inspection. No production impact detected but monitor for efficiency degradation.',
      evidence:'Utilities alert auto-triggered at 14:00. Maintenance advised. Recommend facilities walkthrough at start of next shift.',
      recommendedAction:'Complete facilities walkthrough of cooling system at shift start. Log any further overcycling to maintenance.' },
    { num:'X.', urgency:'ok', title:'Adeyemi — schedule L2 recertification within 35 days',
      desc:'F. Adeyemi cert expires in 35 days. Enroll in L2 recertification program to maintain continuity on Line 4 AM crew.' },
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
    { label:'Expiring within 14 days', value:'2', sub:'Tomato · Canola lots', fill:40, tone:'danger' },
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
    { label:'Overall readiness', value:'64', badge:'Degraded', sub:'of 100', fill:64, tone:'warn' },
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
      moduleAccent: '#C43820',
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
      moduleAccent: '#C43820',
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
      moduleAccent: '#C43820',
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
      moduleAccent: '#C43820',
      timeWindow: 'watch',
      timeLabel: 'Resolve today',
    },
  ],
}

// ── Robot Fleet Data ──────────────────────────────────────────────────────────

export const robotFleetData = {
  summary: {
    total: 12,
    online: 9,
    maintenance: 2,
    fault: 1,
    avgUptime: 94.2,
    energyToday: 187, // kWh
  },
  units: [
    {
      id:'R-01', name:'Topping Unit A', model:'Fanuc M-710iC', line:'Line 4',
      status:'online', assignedTask:'Pepperoni topping — 18 g ±0.3 g',
      capabilities:['topping','weighing','allergen-handling'],
      telemetry:{ vibration:[1.1,1.2,1.0,1.1,1.3,1.2], temperature:[42,43,42,44,43,43], currentDraw:[12.1,12.3,12.0,12.2,12.4,12.2], cycleCount:1847 },
      maintenanceSchedule:{ nextService:'2026-05-22', lastService:'2026-04-10', remainingHours:78 },
      programVersion:'v4.2.1', calibrationStatus:'valid', calibrationExpiry:'2026-06-01',
      uptime:98.1, mtbf:342, mttr:1.8,
    },
    {
      id:'R-02', name:'Topping Unit B', model:'Fanuc M-710iC', line:'Line 4',
      status:'online', assignedTask:'Cheese topping — 22 g ±0.5 g',
      capabilities:['topping','weighing'],
      telemetry:{ vibration:[0.9,1.0,0.9,1.1,1.0,0.9], temperature:[41,41,42,41,42,41], currentDraw:[11.8,11.9,11.7,12.0,11.8,11.9], cycleCount:2104 },
      maintenanceSchedule:{ nextService:'2026-05-28', lastService:'2026-04-22', remainingHours:134 },
      programVersion:'v4.2.1', calibrationStatus:'valid', calibrationExpiry:'2026-06-01',
      uptime:99.2, mtbf:410, mttr:1.2,
    },
    {
      id:'R-03', name:'Seal Press A', model:'ABB IRB 6700', line:'Line 4',
      status:'online', assignedTask:'Tray sealing — Pepperoni Classic',
      capabilities:['sealing','packaging','vision-QA'],
      telemetry:{ vibration:[2.1,2.3,2.4,2.8,3.1,3.4], temperature:[55,56,57,58,60,62], currentDraw:[18.2,18.5,18.7,19.1,19.6,20.1], cycleCount:3291 },
      maintenanceSchedule:{ nextService:'2026-05-16', lastService:'2026-04-01', remainingHours:14 },
      programVersion:'v3.9.0', calibrationStatus:'valid', calibrationExpiry:'2026-05-20',
      uptime:91.4, mtbf:210, mttr:3.2,
      alert: { type:'warn', msg:'Vibration trending up — bearing inspection recommended within 14 hours' },
    },
    {
      id:'R-04', name:'Seal Press B', model:'ABB IRB 6700', line:'Line 6',
      status:'maintenance', assignedTask:null,
      capabilities:['sealing','packaging'],
      telemetry:{ vibration:[4.2,4.5,5.1,5.8,6.2,null], temperature:[65,68,72,null,null,null], currentDraw:[21.0,22.1,null,null,null,null], cycleCount:4102 },
      maintenanceSchedule:{ nextService:'2026-05-15', lastService:'2026-03-20', remainingHours:0 },
      programVersion:'v3.8.2', calibrationStatus:'expired', calibrationExpiry:'2026-05-10',
      uptime:78.3, mtbf:180, mttr:4.1,
      alert: { type:'danger', msg:'Scheduled maintenance in progress — estimated return 14:30' },
    },
    {
      id:'R-05', name:'QA Vision A', model:'Cognex IS-9005', line:'Line 4',
      status:'online', assignedTask:'Seal integrity + label inspection',
      capabilities:['vision-QA','seal-check','label-verify'],
      telemetry:{ vibration:[0.2,0.2,0.2,0.2,0.2,0.2], temperature:[38,38,39,38,38,39], currentDraw:[4.1,4.1,4.2,4.1,4.1,4.2], cycleCount:18204 },
      maintenanceSchedule:{ nextService:'2026-07-01', lastService:'2026-02-01', remainingHours:480 },
      programVersion:'v7.1.3', calibrationStatus:'valid', calibrationExpiry:'2026-08-01',
      uptime:99.9, mtbf:720, mttr:0.5,
    },
    {
      id:'R-06', name:'Dosing Unit A', model:'Nordson ProBlue', line:'Line 3',
      status:'online', assignedTask:'Sauce dosing — 28 g ±1 g',
      capabilities:['dosing','allergen-handling','CCP-monitoring'],
      telemetry:{ vibration:[0.8,0.8,0.9,0.8,0.9,0.8], temperature:[45,45,46,45,45,46], currentDraw:[8.4,8.5,8.4,8.6,8.5,8.4], cycleCount:5610 },
      maintenanceSchedule:{ nextService:'2026-06-10', lastService:'2026-04-20', remainingHours:220 },
      programVersion:'v2.4.0', calibrationStatus:'valid', calibrationExpiry:'2026-07-01',
      uptime:97.8, mtbf:380, mttr:1.4,
    },
    {
      id:'R-07', name:'Packaging Unit A', model:'Bosch SVE 2520', line:'Line 4',
      status:'online', assignedTask:'Flow wrapping — Pepperoni Classic',
      capabilities:['packaging','flow-wrap','date-coding'],
      telemetry:{ vibration:[1.5,1.6,1.5,1.6,1.5,1.5], temperature:[48,48,49,48,49,48], currentDraw:[14.2,14.3,14.1,14.4,14.2,14.3], cycleCount:9087 },
      maintenanceSchedule:{ nextService:'2026-06-01', lastService:'2026-04-15', remainingHours:192 },
      programVersion:'v5.0.2', calibrationStatus:'valid', calibrationExpiry:'2026-07-15',
      uptime:96.5, mtbf:290, mttr:2.1,
    },
    {
      id:'R-08', name:'Packaging Unit B', model:'Bosch SVE 2520', line:'Line 6',
      status:'fault', assignedTask:null,
      capabilities:['packaging','flow-wrap','date-coding'],
      telemetry:{ vibration:[3.2,4.1,5.8,null,null,null], temperature:[61,68,null,null,null,null], currentDraw:[null,null,null,null,null,null], cycleCount:7203 },
      maintenanceSchedule:{ nextService:'2026-05-15', lastService:'2026-04-01', remainingHours:0 },
      programVersion:'v5.0.1', calibrationStatus:'valid', calibrationExpiry:'2026-06-01',
      uptime:82.1, mtbf:145, mttr:5.4,
      alert: { type:'danger', msg:'Drive fault F-22 — motor overload. Awaiting technician T. Osei (ETA 45 min)' },
    },
    {
      id:'R-09', name:'Allergen Changeover Bot', model:'Universal Robots UR10e', line:'Line 4',
      status:'online', assignedTask:'Post-allergen surface wipe — Zone 1 & 2',
      capabilities:['cleaning','allergen-handling','zone-clearance'],
      telemetry:{ vibration:[0.4,0.4,0.5,0.4,0.4,0.5], temperature:[34,34,35,34,34,35], currentDraw:[3.2,3.3,3.2,3.3,3.2,3.3], cycleCount:882 },
      maintenanceSchedule:{ nextService:'2026-07-15', lastService:'2026-03-15', remainingHours:610 },
      programVersion:'v1.3.2', calibrationStatus:'valid', calibrationExpiry:'2026-09-01',
      uptime:99.1, mtbf:500, mttr:0.8,
    },
    {
      id:'R-10', name:'Case Erector A', model:'Wexxar WF30', line:'Line 2',
      status:'online', assignedTask:'Case forming — 12-pack master carton',
      capabilities:['case-erect','packaging'],
      telemetry:{ vibration:[1.0,1.0,1.1,1.0,1.0,1.1], temperature:[40,40,41,40,40,41], currentDraw:[9.8,9.9,9.8,10.0,9.9,9.8], cycleCount:6441 },
      maintenanceSchedule:{ nextService:'2026-06-20', lastService:'2026-04-25', remainingHours:308 },
      programVersion:'v2.1.0', calibrationStatus:'valid', calibrationExpiry:'2026-08-01',
      uptime:98.4, mtbf:420, mttr:1.1,
    },
    {
      id:'R-11', name:'Palletizer A', model:'Fanuc M-410iB', line:'Line 4',
      status:'online', assignedTask:'End-of-line palletizing — Pepperoni Classic',
      capabilities:['palletizing','heavy-payload'],
      telemetry:{ vibration:[1.8,1.9,1.8,1.9,1.8,1.9], temperature:[52,52,53,52,52,53], currentDraw:[22.1,22.3,22.1,22.4,22.2,22.1], cycleCount:3814 },
      maintenanceSchedule:{ nextService:'2026-06-05', lastService:'2026-04-10', remainingHours:204 },
      programVersion:'v6.0.0', calibrationStatus:'valid', calibrationExpiry:'2026-07-01',
      uptime:97.2, mtbf:310, mttr:2.3,
    },
    {
      id:'R-12', name:'AGV Unit 1', model:'Omron LD-60', line:'All lines',
      status:'online', assignedTask:'Ingredient transport — Salina Cold Storage → Line 4',
      capabilities:['transport','navigation','load-handling'],
      telemetry:{ vibration:[0.3,0.3,0.3,0.4,0.3,0.3], temperature:[30,30,31,30,30,31], currentDraw:[2.8,2.9,2.8,3.0,2.9,2.8], cycleCount:12048 },
      maintenanceSchedule:{ nextService:'2026-06-15', lastService:'2026-04-30', remainingHours:412 },
      programVersion:'v3.5.1', calibrationStatus:'valid', calibrationExpiry:'2026-09-01',
      uptime:99.5, mtbf:600, mttr:0.6,
    },
  ],
  faultLog: [
    { timestamp:'13:42', unit:'R-08', fault:'F-22 Motor overload', severity:'danger', resolved:false, techAssigned:'T. Osei', eta:'14:30' },
    { timestamp:'09:15', unit:'R-04', fault:'Scheduled PM window began', severity:'info', resolved:false, techAssigned:'J. Barker', eta:'14:30' },
    { timestamp:'05:30', unit:'R-03', fault:'Vibration anomaly detected — logged, monitoring', severity:'warn', resolved:false, techAssigned:null, eta:null },
    { timestamp:'11:20', unit:'R-07', fault:'Program update applied — v5.0.1 → v5.0.2', severity:'info', resolved:true, techAssigned:'Remote ops', eta:null },
  ],
  taskQueue: [
    { robotId:'R-01', priority:1, task:'Pepperoni topping run — Lot L-0891', startTime:'06:00', endTime:'14:00', status:'active' },
    { robotId:'R-02', priority:1, task:'Cheese topping run — Lot L-0892', startTime:'06:00', endTime:'14:00', status:'active' },
    { robotId:'R-03', priority:1, task:'Seal press — Pepperoni Classic trays', startTime:'06:30', endTime:'14:00', status:'active' },
    { robotId:'R-08', priority:2, task:'Flow wrapping Line 6 — queued', startTime:'14:30', endTime:'22:00', status:'queued' },
    { robotId:'R-04', priority:3, task:'Return to service post-PM', startTime:'14:30', endTime:null, status:'pending' },
  ],
}

// ── Human-Only Extensions ─────────────────────────────────────────────────────

export const absenceData = {
  today: [
    { operator:'B. Lindqvist', role:'L3 Oven Operator', line:'Line 4', shift:'AM', type:'unplanned', calloutTime:'05:22', backfill:null, impact:'danger', note:'No L3 backup available — oven cert gap' },
  ],
  upcoming: [
    { operator:'D. Kowalski', role:'Supervisor L4', line:'Line 4', shift:'PM', date:'2026-05-17', type:'planned', backfill:'M. Santos', impact:'ok' },
    { operator:'P. Okonkwo', role:'L2 Topping', line:'Line 4', shift:'AM', date:'2026-05-19', type:'planned', backfill:null, impact:'warn', note:'No backfill assigned yet' },
    { operator:'C. Reyes', role:'L1 Pack Line', line:'Line 4', shift:'AM', date:'2026-05-21', type:'planned', backfill:'F. Adeyemi', impact:'ok' },
  ],
  coverageGaps: [
    { date:'2026-05-15', line:'Line 4', shift:'AM', cert:'L3 Oven', required:1, available:0, status:'danger' },
    { date:'2026-05-19', line:'Line 4', shift:'AM', cert:'L2 Topping', required:2, available:1, status:'warn' },
  ],
}

export const certProjections = {
  horizon: '90 days',
  projectedAt: '2026-08-13',
  expirations: [
    { operator:'B. Lindqvist', cert:'L3 Oven Operator', expiresOn:'2026-05-15', daysRemaining:0, tone:'danger', line:'Line 4', replacementReady:false },
    { operator:'D. Kowalski', cert:'L4 Supervisor', expiresOn:'2026-06-01', daysRemaining:17, tone:'warn', line:'Line 4', replacementReady:false },
    { operator:'P. Okonkwo', cert:'L2 Topping Advanced', expiresOn:'2026-06-15', daysRemaining:31, tone:'warn', line:'Line 4', replacementReady:true },
    { operator:'A. Martinez', cert:'L3 Sauce Dosing', expiresOn:'2026-07-10', daysRemaining:56, tone:'ok', line:'Line 4', replacementReady:true },
    { operator:'F. Adeyemi', cert:'L1 QA Basic', expiresOn:'2026-07-22', daysRemaining:68, tone:'ok', line:'Line 4', replacementReady:true },
  ],
  riskSummary: { dangerCount:1, warnCount:2, okCount:2, noReplacementCount:2 },
}

export const fatigueData = {
  operators: [
    { name:'D. Kowalski', hoursThisWeek:44, consecutiveShifts:5, lastRestPeriod:10, fatigueTone:'warn', note:'5 consecutive shifts — approaching 48h limit' },
    { name:'A. Martinez', hoursThisWeek:36, consecutiveShifts:3, lastRestPeriod:14, fatigueTone:'ok', note:null },
    { name:'C. Reyes', hoursThisWeek:32, consecutiveShifts:2, lastRestPeriod:16, fatigueTone:'ok', note:null },
    { name:'P. Okonkwo', hoursThisWeek:40, consecutiveShifts:4, lastRestPeriod:12, fatigueTone:'ok', note:null },
    { name:'B. Lindqvist', hoursThisWeek:0, consecutiveShifts:0, lastRestPeriod:null, fatigueTone:'muted', note:'Absent today' },
    { name:'F. Adeyemi', hoursThisWeek:28, consecutiveShifts:2, lastRestPeriod:18, fatigueTone:'ok', note:null },
  ],
}

export const laborData = {
  week: [
    { day:'Mon', straight:312, overtime:18, line:'Line 4' },
    { day:'Tue', straight:312, overtime:24, line:'Line 4' },
    { day:'Wed', straight:312, overtime:0, line:'Line 4' },
    { day:'Thu', straight:312, overtime:36, line:'Line 4' },
    { day:'Fri', straight:312, overtime:12, line:'Line 4' },
    { day:'Sat', straight:156, overtime:48, line:'Line 4' },
  ],
  summary: {
    totalStraight: 1716,
    totalOvertime: 138,
    overtimePct: 7.4,
    topOvertimeDriver: 'Lindqvist absence coverage',
    projectedWeekCost: 62400,
    overtimeCostPremium: 4140,
  },
}

// ── Hybrid: Task Allocation ───────────────────────────────────────────────────

export const taskAllocationData = {
  tasks: [
    {
      id:'t1', label:'Topping — Pepperoni', line:'Line 4',
      assignedTo:{ type:'robot', id:'R-01', name:'Topping Unit A' },
      fallback:{ type:'human', id:'okonkwo', name:'P. Okonkwo', cert:'L2' },
      status:'active', capability:'topping',
    },
    {
      id:'t2', label:'Topping — Cheese', line:'Line 4',
      assignedTo:{ type:'robot', id:'R-02', name:'Topping Unit B' },
      fallback:{ type:'human', id:'reyes', name:'C. Reyes', cert:'L1', certGap:true },
      status:'active', capability:'topping',
    },
    {
      id:'t3', label:'Sauce Dosing', line:'Line 4',
      assignedTo:{ type:'human', id:'martinez', name:'A. Martinez', cert:'L3' },
      fallback:{ type:'robot', id:'R-06', name:'Dosing Unit A' },
      status:'active', capability:'dosing',
    },
    {
      id:'t4', label:'Allergen Changeover', line:'Line 4',
      assignedTo:{ type:'human', id:'okonkwo', name:'P. Okonkwo', cert:'L2' },
      fallback:{ type:'robot', id:'R-09', name:'Allergen Bot' },
      status:'active', capability:'allergen-handling',
    },
    {
      id:'t5', label:'Seal Inspection', line:'Line 4',
      assignedTo:{ type:'robot', id:'R-05', name:'QA Vision A' },
      fallback:{ type:'human', id:'patel', name:'J. Patel', cert:'L2' },
      status:'active', capability:'vision-QA',
    },
    {
      id:'t6', label:'Packaging — Flow Wrap', line:'Line 4',
      assignedTo:{ type:'robot', id:'R-07', name:'Packaging Unit A' },
      fallback:{ type:'human', id:'adeyemi', name:'F. Adeyemi', cert:'L1', certGap:true },
      status:'active', capability:'packaging',
    },
    {
      id:'t7', label:'End-of-Line Palletizing', line:'Line 4',
      assignedTo:{ type:'robot', id:'R-11', name:'Palletizer A' },
      fallback:{ type:'human', id:null, name:'No qualified backup', certGap:true },
      status:'gap', capability:'palletizing',
    },
    {
      id:'t8', label:'Zone 1 EMP Swab', line:'Line 4',
      assignedTo:{ type:'human', id:'okonkwo', name:'P. Okonkwo', cert:'L2' },
      fallback:{ type:'human', id:'reyes', name:'C. Reyes', cert:'L1' },
      status:'active', capability:'emp',
    },
  ],
  safetyZones: [
    { id:'sz1', label:'Topping Station', line:'Line 4', type:'collaborative', humanCertRequired:'L2+', speedReduction:'50% when human present', emergencyStop:'E-stop A14', status:'clear' },
    { id:'sz2', label:'Seal Press Zone', line:'Line 4', type:'restricted', humanCertRequired:'L3+ with escort', speedReduction:'Full stop when human enters', emergencyStop:'E-stop A15', status:'warn', note:'R-03 vibration anomaly — heightened caution' },
    { id:'sz3', label:'Allergen Changeover Zone', line:'Line 4', type:'collaborative', humanCertRequired:'L2+', speedReduction:'30% when human present', emergencyStop:'E-stop A16', status:'clear' },
    { id:'sz4', label:'Palletizer Zone', line:'Line 4', type:'restricted', humanCertRequired:'L4 only', speedReduction:'Full stop when human enters', emergencyStop:'E-stop B01', status:'clear' },
  ],
  overrideLog: [
    { timestamp:'06:48', operator:'D. Kowalski', robotId:'R-01', robotName:'Topping Unit A', action:'Weight tolerance override', reason:'SKU changeover mid-run — manual calibration needed', outcome:'Resolved in 4 min, robot resumed' },
    { timestamp:'Yesterday 14:20', operator:'M. Santos', robotId:'R-09', robotName:'Allergen Bot', action:'Zone clearance override — extended dwell time', reason:'Incomplete surface contact on Zone 2 — required manual wipe', outcome:'CAPA filed, robot protocol updated' },
  ],
  redundancyMap: [
    { task:'Sauce Dosing', humanCover:true, robotCover:true, status:'ok' },
    { task:'Allergen Changeover', humanCover:true, robotCover:true, status:'ok' },
    { task:'Topping', humanCover:true, robotCover:true, status:'ok' },
    { task:'Seal Inspection', humanCover:true, robotCover:true, status:'ok' },
    { task:'Palletizing', humanCover:false, robotCover:true, status:'danger', note:'No human certified for palletizing backup' },
    { task:'Flow Wrapping', humanCover:true, robotCover:true, status:'ok' },
  ],
}

// ── Agent Configuration Data ──────────────────────────────────────────────────

export const agentConfigData = {
  agents: [
    {
      id:'pre-shift', name:'Pre-Shift Verification', icon:'Shield', promptVersion:'1.0.0',
      description:'Verifies all startup conditions T-30 min before shift: certs, checklists, sensors, robot calibration.',
      isComplianceCategory: false,
      confidenceMethodology: 'Percentage of startup conditions passing (cert status, checklist completion, sensor health, calibration validity). 100% = all conditions verified. A missing cert drops it proportionally.',
      enabled:true, confidenceThreshold:80,
      actCount:{ week:14, month:58 },
      lastFired:'06:12 today',
      pendingActions:[],
    },
    {
      id:'compliance', name:'Compliance Monitor', icon:'AlertTriangle',
      description:'Real-time signal monitoring. Opens CAPAs automatically on threshold breach with regulatory mapping and evidence.',
      isComplianceCategory: true,
      writeScope: 'create-only',
      corroborationRequired: true,
      confidenceMethodology: 'Signal strength × duration × corroboration. Requires sustained reading above threshold (not a single spike) plus at least one corroborating signal (a second sensor OR a failed checklist item on the same CCP). Single-spike readings cap confidence at 70% regardless of magnitude.',
      regulatoryObligations: ['FSMA 204 traceability', 'HACCP CCP deviation logging', 'GMP 21 CFR 110 corrective action'],
      enabled:true, confidenceThreshold:90,
      actCount:{ week:3, month:11 },
      lastFired:'06:36 today',
      pendingActions:[
        {
          id:'pa1',
          action:'Open CAPA for R-03 vibration anomaly',
          target:'Sensor A-7 equivalent — R-03 bearing',
          rationale:'Vibration trending 3.4 (threshold 4.0) — pattern match to prior bearing failure',
          confidence:71,
          cotSteps:[
            { step:1, label:'Quiet period check', result:'pass', detail:'No quiet period active for Line 4' },
            { step:2, label:'Spike vs. sustained', result:'pass', detail:'38 min sustained — 2 consecutive readings above threshold' },
            { step:3, label:'Corroboration scan', result:'pass', detail:'Temperature also rising +7°C (corroborating signal #1)' },
            { step:4, label:'Regulatory mapping', result:'pass', detail:'HACCP CCP-3 applicable. FSMA 204 traceability chain.' },
            { step:5, label:'Confidence calculation', result:'warn', detail:'sustainedScore(0.7) × corroborationScore(0.7) = 71%. Below 90% threshold — requires director approval rather than autonomous action.' },
          ],
          triggerData:{
            reading: 3.4,
            threshold: 4.0,
            unit: 'mm/s',
            sensor: 'R-03 vibration sensor',
            duration: '38 min sustained',
            trend: 'Rising — was 2.1 at shift start',
            corroboration: 'Temperature also rising (+7°C in 38 min) — two signals',
            precedentMatch: 'R-08 bearing failure on 2026-04-01 showed same signature 72h before fault',
            precedentPool: 3,
            precedentLine: 'Line 6',
          },
          impactPreview:[
            'Creates CAPA-2026-R03 in regulatory record — becomes part of FDA audit package',
            'Assigned administrative owner: plant maintenance supervisor',
            'R-03 continues running — CAPA does not trigger shutdown',
            'Evidence clock starts — case will auto-escalate if unresolved within 14 days',
          ],
          evidence:{
            summary: "R-03's vibration sensor has sustained 3.4 mm/s for 38 minutes — above the 2.5 threshold. Temperature is co-trending (+7°C in 38 min), corroborating mechanical stress. Pattern matches R-08's pre-failure signature from 72 hours ago.",
            causalSignals:[
              { signal:'Vibration',    reading:'3.4 mm/s', threshold:'2.5 mm/s', status:'breach', note:'Rising since shift start (was 2.1 mm/s at 06:00)' },
              { signal:'Temperature',  reading:'+7°C rise', threshold:'Sustained ≥ +5°C', status:'breach', note:'Corroborating signal — not a standalone threshold' },
              { signal:'Duration',     reading:'38 min',   threshold:'30 min sustained', status:'breach', note:'Both signals held above threshold simultaneously' },
            ],
            dependencies:[
              { label:'HACCP CCP-3', status:'required', note:'CAPA must reference this control point in the regulatory record' },
              { label:'FSMA 204 traceability', status:'required', note:'Case becomes part of the FDA audit package once opened' },
              { label:'R-03 shutdown', status:'not-required', note:'Opening this CAPA does not trigger an automatic shutdown' },
            ],
            riskForecast: 'If unresolved within 14 hours: R-03 bearing failure probable (per R-08 precedent). Line 4 sealing offline — downstream packaging and palletizing affected.',
          },
        },
      ],
    },
    {
      id:'supplier', name:'Supplier Intelligence', icon:'Truck',
      description:'Monitors COA status, requests missing docs, recommends hold/release decisions.',
      isComplianceCategory: true,
      confidenceMethodology: 'Binary COA presence check (100% if received and valid, 0% if absent) weighted by time-to-production urgency. At ≥4h before production start with no COA: 95%+. Between 1-4h: 85-94%. Under 1h: always escalates regardless of confidence.',
      regulatoryObligations: ['FSMA 204 supplier verification', 'HACCP CCP-1 ingredient control'],
      enabled:true, confidenceThreshold:85,
      actCount:{ week:2, month:9 },
      lastFired:'05:45 today',
      pendingActions:[
        {
          id:'pa2',
          action:'Recommend hold on Lot L-0891',
          target:'ConAgra · Pepperoni · Lot L-0891',
          rationale:'COA not received — 4h before scheduled production use',
          confidence:95,
          triggerData:{
            lotId: 'L-0891',
            supplier: 'ConAgra',
            ingredient: 'Pepperoni topping',
            coaStatus: 'Not received',
            productionScheduled: '10:00 AM today',
            timeToProduction: '4h 12min at time of flag',
            supplierHistory: '2 COA delays in last 18 months (Jan 2025, Aug 2024)',
            historyRecencyNote: 'Most recent delay: 9 months ago — applying 50% recency weight',
          },
          impactPreview:[
            'Lot L-0891 flagged as pending release — production hold until COA received',
            'Line 4 AM may start 1-2h late if COA arrives after 08:30',
            'If COA not received by 09:30: recommend substituting Lot L-0889 (COA valid)',
            'Hold is reversible — COA receipt triggers automatic release recommendation',
          ],
          evidence:{
            summary: 'Lot L-0891 from ConAgra has no COA on file with 4 hours 12 minutes to scheduled production. FSMA 204 requires a verified COA before use. Supplier has two prior COA delays in 18 months.',
            causalSignals:[
              { signal:'COA status',        reading:'Not received', threshold:'Required before production', status:'breach', note:'Production scheduled for 10:00 AM — window is closing' },
              { signal:'Time to production', reading:'4h 12min',     threshold:'COA required ≥ 4h prior',   status:'breach', note:'At or below minimum buffer for review' },
              { signal:'Supplier history',  reading:'2 prior delays', threshold:'0 delays preferred',       status:'warn',  note:'Most recent delay: 9 months ago (50% recency weight)' },
            ],
            dependencies:[
              { label:'Line 4 AM production', status:'pending',  note:'Will hold if COA not received — start delayed or substitution required' },
              { label:'Lot L-0889 (fallback)', status:'eligible', note:'COA valid — available as substitution if confirmed by 09:30' },
              { label:'FSMA 204 record',       status:'required', note:'Hold decision must be logged regardless of outcome' },
            ],
            riskForecast: "If COA not received by 09:30: Line 4 AM production hold or lot substitution required. Using Lot L-0891 without COA is a FSMA 204 violation.",
          },
        },
      ],
    },
    {
      id:'resource', name:'Resource Allocation', icon:'Users',
      description:'Proposes schedule adjustments on absence or cert gap. In hybrid mode, rebalances human/robot task coverage. In emergency conditions (human absent + robot qualified + T-60 min), can act autonomously unless overridden.',
      isComplianceCategory: false,
      confidenceMethodology: 'Probability that the proposed allocation meets all certification requirements AND maintains ≥72% qualified staffing threshold. Based on cert database at time of proposal. Does not account for same-day changes.',
      enabled:true, confidenceThreshold:75,
      actCount:{ week:5, month:22 },
      lastFired:'06:10 today',
      pendingActions:[
        {
          id:'pa3-emergency',
          action:'Emergency auto-assign: R-09 covers Oven Station B — Lindqvist absent, T-28 min',
          target:'Line 4 AM · Oven Station B · Today',
          rationale:'Lindqvist (L3 Oven) called out at 05:22 with no backup. R-09 (Allergen Bot) is certified for oven-adjacent operations. Critical safety coverage gap. Shift starts in 28 min.',
          confidence:91,
          isEmergencyAutoAct: true,
          overrideWindowMin: 15,
          emergencyConditions: {
            humanAbsent: 'B. Lindqvist · L3 Oven Operator',
            robotAvailable: 'R-09 · Allergen Changeover Bot · Certified for oven zone',
            timeToShift: '28 min',
            coverageGap: 'Oven Station B — zero qualified operators',
          },
          impactPreview:[
            'R-09 auto-assigned to Oven Station B — will execute without director approval unless overridden within 15 min',
            'R-09 moves from allergen changeover queue — allergen changeover must be covered by P. Okonkwo',
            'Oven Station B coverage gap resolved — shift can start with qualified coverage',
            'Director notified immediately; action logged with timestamp',
            'Override window: 15 min — after that, assignment is confirmed and cannot be auto-reversed',
          ],
          evidence:{
            summary: 'B. Lindqvist called out at 05:22 with no L3 Oven backup on-shift. Oven Station B has zero qualified human coverage. R-09 meets zone certification requirements. All 4 emergency auto-act conditions are met. Shift starts in 28 minutes.',
            causalSignals:[
              { signal:'Human coverage',   reading:'0 qualified operators', threshold:'≥ 1 required', status:'breach',   note:'B. Lindqvist — only L3 Oven operator on roster today' },
              { signal:'Time to shift',    reading:'28 min',                threshold:'T-30 critical', status:'breach',   note:'No time for manual reallocation' },
              { signal:'Robot capability', reading:'R-09 — zone certified', threshold:'Required',      status:'eligible', note:'Allergen-handling + oven-zone clearance confirmed' },
            ],
            dependencies:[
              { label:'P. Okonkwo',        status:'required',  note:'Must cover allergen changeover — R-09 vacates that task' },
              { label:'Director override',  status:'eligible',  note:'15-min window — override cancels auto-assignment' },
              { label:'Shift start 06:00',  status:'required',  note:'Oven Station B must be covered at shift start' },
            ],
            riskForecast: 'If override initiated without a human backup: Oven Station B remains uncovered — shift cannot safely start. If override window passes: R-09 assignment confirmed and logged.',
          },
        },
        {
          id:'pa3',
          action:'Pre-allocate R-06 (Dosing Unit A) as Sauce Dosing fallback for tomorrow AM',
          target:'Line 4 AM — 2026-05-16',
          rationale:'Martinez flagged for overtime risk — pre-allocating robot fallback if absent',
          confidence:68,
          impactPreview:[
            'R-06 remains on Line 3 tonight — only takes effect if Martinez absent tomorrow',
            'If Martinez is present: no change, R-06 stays on Line 3',
            'If Martinez absent: R-06 moves to Line 4 — Line 3 Sauce Dosing unassigned (no human backup)',
            'Creating this pre-allocation does not guarantee Line 3 coverage — assign a human backup separately',
          ],
          evidence:{
            summary: 'A. Martinez is at overtime risk for tomorrow AM. Pre-allocating R-06 ensures Line 4 Sauce Dosing coverage if Martinez is absent — without disrupting tonight\'s Line 3 operation. The allocation is conditional and creates no immediate change.',
            causalSignals:[
              { signal:'Martinez overtime',    reading:'At threshold',   threshold:'40h/week limit', status:'warn', note:'Pre-emptive only — no confirmed absence yet' },
              { signal:'Line 4 coverage risk', reading:'Contingent gap', threshold:'Must be covered', status:'warn', note:'Risk is tomorrow — not today' },
            ],
            dependencies:[
              { label:'Line 3 Sauce Dosing', status:'pending',  note:'Will be unassigned if R-06 moves — assign human backup separately' },
              { label:'Martinez attendance',  status:'pending',  note:'Pre-allocation only activates if Martinez is absent' },
            ],
            riskForecast: 'If Martinez absent tomorrow with no Line 3 backup assigned: Line 3 Sauce Dosing uncovered. This action mitigates Line 4 risk but does not solve the Line 3 gap.',
          },
        },
      ],
    },
    {
      id:'maintenance', name:'Predictive Maintenance', icon:'Wrench',
      description:'Analyzes telemetry trends and schedules maintenance windows before failures occur.',
      isComplianceCategory: false,
      confidenceMethodology: 'Pattern similarity score against historical failure signatures in the precedent library, weighted by recency and line match. 100% = identical signature on same equipment. Penalised if precedent pool < 5 cases or if precedents are from a different line.',
      enabled:true, confidenceThreshold:82,
      actCount:{ week:4, month:17 },
      lastFired:'06:05 today',
      pendingActions:[
        {
          id:'pa4',
          action:'Schedule bearing inspection for R-03 before next shift',
          target:'R-03 Seal Press A — next maintenance window: tonight 22:00-23:30',
          rationale:'Vibration at 3.4 — pattern matches R-08 failure sequence 72h before fault',
          confidence:84,
          triggerData:{
            reading: 3.4,
            unit: 'mm/s',
            trend: '+1.3 mm/s since shift start (62% increase)',
            precedentMatch: 'R-08 bearing failure 2026-04-01',
            precedentPool: 3,
            precedentLine: 'Line 6',
            crossLineWarning: true,
            proposedWindow: 'Tonight 22:00–23:30 (low-production gap)',
            estimatedDuration: '90 min',
          },
          impactPreview:[
            'Maintenance window booked: tonight 22:00–23:30 — R-03 offline during this window',
            'Line 4 PM packaging throughput may drop ~15% for 90 min',
            'If inspection finds bearing wear: full replacement adds ~4h — Line 4 down until 02:30',
            'If inspection finds no fault: R-03 resumes, no further action',
            'Not acting: R-08 precedent suggests 40-60h to fault — possible Line 4 unplanned downtime tomorrow AM',
          ],
          evidence:{
            summary: "R-03 vibration has increased 62% since shift start (2.1 → 3.4 mm/s). The signature matches R-08's bearing failure precursor from 72 hours ago — a 3-case precedent pool with cross-line caveat. MTBF model forecasts failure within 14 hours.",
            causalSignals:[
              { signal:'Vibration trend',   reading:'+1.3 mm/s shift',   threshold:'Sustained rise',        status:'breach', note:'62% increase from shift start — not a spike' },
              { signal:'Precedent match',   reading:'R-08 failure (72h)', threshold:'Same signature class',  status:'warn',  note:'3-case pool, cross-line (Line 6 → Line 4) — treat with caution' },
              { signal:'MTBF forecast',     reading:'14h to failure',     threshold:'< 24h triggers action', status:'breach', note:'±3h uncertainty band' },
            ],
            dependencies:[
              { label:'Maintenance tech',    status:'eligible',  note:'Tonight 22:00–23:30 window is available' },
              { label:'Line 4 throughput',   status:'pending',   note:'~15% reduction for 90 min during inspection window' },
              { label:'Bearing replacement', status:'contingent',note:'If wear found: +4h additional downtime — Line 4 until 02:30' },
            ],
            riskForecast: 'If no inspection tonight: R-08 precedent suggests 40–60h to fault. Probable unplanned Line 4 downtime tomorrow AM — higher cost than a planned 90-min inspection window.',
          },
        },
      ],
    },
    {
      id:'handoff', name:'Handoff Synthesis', icon:'Handshake',
      description:'Pre-populates handoff documents from live shift data T-45 min before shift end. Supervisor reviews and signs — they do not author.',
      isComplianceCategory: true,
      confidenceMethodology: 'Data freshness score per item: 100% = source updated within 15 min. Each hour of staleness reduces per-item confidence by 10%. Items from sources with gaps (SCADA offline, MES sync failure) are flagged as unverified regardless of score.',
      regulatoryObligations: ['Shift handoff documentation (FSMA 204)', 'CCP status continuity record'],
      enabled:true, confidenceThreshold:70,
      actCount:{ week:10, month:44 },
      lastFired:'13:15 today',
      pendingActions:[
        {
          id:'pa5',
          action:'Draft PM handoff — 4 carry-forward items synthesized',
          target:'Line 4 PM handoff · Supervisor M. Santos',
          rationale:'Synthesized open CAPA-2604-001, Sensor A-7, Lindqvist cert gap, and R-03 bearing alert from live shift data',
          confidence:92,
          impactPreview:[
            'Document is a draft — M. Santos must review each item before signing',
            'Sensor A-7 data freshness: 8 min — high confidence',
            'CAPA-2604-001 status freshness: 22 min — high confidence',
            'Lindqvist cert status freshness: 4h 12min — flagged as potentially stale',
            'R-03 telemetry freshness: 4 min — high confidence',
            'Supervisor signature creates a legal record — signing without review creates liability',
          ],
          evidence:{
            summary: 'Four carry-forward items synthesized from live shift data: CAPA-2604-001 (22 min old, fresh), Sensor A-7 anomaly (8 min old, fresh), R-03 bearing alert (4 min old, fresh), and Lindqvist cert gap (252 min old, stale — flagged). Document confidence is 92%.',
            causalSignals:[
              { signal:'CAPA-2604-001',      reading:'Open — 22 min data',   threshold:'< 30 min = fresh',  status:'ok',    note:'Carry-forward confirmed' },
              { signal:'Sensor A-7',          reading:'Anomaly — 8 min data', threshold:'< 30 min = fresh',  status:'ok',    note:'Carry-forward confirmed' },
              { signal:'R-03 bearing alert',  reading:'Active — 4 min data',  threshold:'< 30 min = fresh',  status:'ok',    note:'Carry-forward confirmed' },
              { signal:'Lindqvist cert',      reading:'252 min stale',        threshold:'< 30 min = fresh',  status:'stale', note:'Unverified — flagged in document' },
            ],
            dependencies:[
              { label:'M. Santos review',   status:'required',  note:'Must review each item — cannot auto-sign' },
              { label:'HR data refresh',    status:'pending',   note:'Lindqvist cert field unverified until HR syncs' },
              { label:'Signing liability',  status:'required',  note:'Supervisor signature creates a legal record — review before signing' },
            ],
            riskForecast: 'Signing the Lindqvist cert entry without verification creates audit liability. HR data is 4h stale — verify cert status manually or flag as unverified in the signed document.',
          },
        },
      ],
    },
    {
      id:'escalation', name:'Risk Escalation', icon:'Bell',
      description:'Routes critical findings to owners before time windows close. Escalates if unacknowledged. "I\'m on the floor" status pauses re-fires and routes to named backup.',
      isComplianceCategory: false,
      confidenceMethodology: 'Not applicable — escalation fires based on time elapsed and finding urgency level, not a confidence model. A critical finding unacknowledged for 10 min always escalates regardless of any confidence score.',
      hasHotStandby: true,
      hotStandbyConfig: {
        channel: 'Out-of-band SMS/pager',
        trigger: 'Any finding aged > 20 min without acknowledged owner AND Risk Escalation cannot route',
        backup: 'J. Crocker mobile · +1 (785) 555-0142',
        note: 'Fires independently of the Risk Escalation Agent — does not require it to be running',
      },
      enabled:true, confidenceThreshold:95,
      actCount:{ week:2, month:8 },
      lastFired:'09:15 today',
      pendingActions:[],
    },
    {
      id:'capa-closure', name:'CAPA Closure', icon:'ClipboardCheck',
      description:'Tracks evidence vs. requirements, sends targeted reminders, validates closure readiness. Enabled in advisory mode — cannot close cases autonomously. In robot mode: manages task queue rebalancing.',
      isComplianceCategory: true,
      writeScope: 'track-only',
      confidenceMethodology: 'Evidence completeness score: checks file count, regulatory mapping coverage, and whether the corrective measure field is populated. Does not validate file content — human declaration required at closure.',
      regulatoryObligations: ['CAPA closure documentation (FSMA 204)', 'GMP corrective action records'],
      enabled:true, confidenceThreshold:88,
      actCount:{ week:0, month:3 },
      lastFired:'Never — newly enabled',
      pendingActions:[
        {
          id:'pa-capa-1',
          action:'Send evidence reminder to D. Kowalski — CAPA-2604-001 overdue 7 days',
          target:'CAPA-2604-001 · Sensor A-7 breach',
          rationale:'Case is 7 days overdue. Two prior escalation notices sent. Evidence not submitted. This reminder will be the third notice — next step is director-level forced resolution.',
          confidence:100,
          impactPreview:[
            'Reminder sent to D. Kowalski with 24-hour final deadline',
            'If no response in 24h: case auto-escalated to "director resolution required"',
            'No case modifications — advisory only',
          ],
          evidence:{
            summary: 'CAPA-2604-001 is 7 days overdue. Two escalation notices were sent with no evidence submitted or acknowledgement received. A third notice triggers the final deadline — non-response in 24 hours forces director-level resolution.',
            causalSignals:[
              { signal:'Days overdue',    reading:'7 days',   threshold:'0 days overdue', status:'breach', note:'Evidence deadline passed on May 8' },
              { signal:'Evidence files',  reading:'0 of required', threshold:'≥ 1 required', status:'breach', note:'No files attached to the case record' },
              { signal:'Prior notices',   reading:'2 sent',   threshold:'N/A',           status:'warn',  note:'No acknowledgement on either — escalation pattern confirmed' },
            ],
            dependencies:[
              { label:'D. Kowalski response', status:'required',  note:'24h final deadline — next step is forced resolution' },
              { label:'Director escalation',  status:'eligible',  note:'Triggers automatically if no response in 24h' },
              { label:'FDA audit record',     status:'required',  note:'7-day gap is visible in the audit package — documented delay' },
            ],
            riskForecast: 'If no response in 24 hours: case auto-escalated to director resolution. Continued delay risks an FDA audit finding — the 7-day evidence gap is already logged.',
          },
        },
      ],
    },
    {
      id:'data-guardian', name:'Data Quality Guardian', icon:'Shield',
      description:'Monitors all data source freshness every 5 minutes. When any source critical to a compliance or safety agent is stale > 30 min, surfaces a finding to the director and flags dependent agents.',
      isComplianceCategory: false,
      confidenceMethodology: 'Binary: each source is either fresh (< 30 min) or stale (≥ 30 min). No probability model — purely recency-based.',
      dataSourceHealth: [
        { source:'SCADA / Sensor streams', ageMin:8,   status:'fresh', dependents:['Compliance Monitor','Pre-Shift Verification','Predictive Maintenance','Handoff Synthesis'] },
        { source:'HR / Cert database',     ageMin:252, status:'stale', dependents:['Pre-Shift Verification','Resource Allocation','Handoff Synthesis'], staleSince:'10:10 AM' },
        { source:'CAPA database',          ageMin:22,  status:'fresh', dependents:['CAPA Closure','Handoff Synthesis','Risk Escalation'] },
        { source:'COA / Lot database',     ageMin:15,  status:'fresh', dependents:['Supplier Intelligence'] },
        { source:'MES / Production',       ageMin:45,  status:'warn',  dependents:['Handoff Synthesis','Pre-Shift Verification'], note:'Approaching 30-min threshold' },
        { source:'Robot telemetry',        ageMin:4,   status:'fresh', dependents:['Predictive Maintenance','Resource Allocation','Handoff Synthesis'] },
      ],
      enabled:true, confidenceThreshold:100,
      actCount:{ week:0, month:0 },
      lastFired:'Continuous — 5-min cycle',
      pendingActions:[
        {
          id:'pa-dg-1',
          action:'Flag HR/cert data stale — Pre-Shift Verification and Handoff Synthesis operating on unverified cert status',
          target:'HR / Cert database · Last updated 10:10 AM (4h 12min ago)',
          rationale:'HR data is 252 min stale. Pre-Shift Verification cannot confirm staffing cert status. Handoff Synthesis\'s Lindqvist cert entry is unverified. Three agents degraded.',
          confidence:100,
          impactPreview:[
            'Pre-Shift Verification will refuse to give clean cert pass until HR data is refreshed',
            'Handoff Synthesis Lindqvist cert field remains flagged "Unverified"',
            'Resource Allocation proposals may be based on stale cert status',
            'Resolution: trigger HR integration sync or verify cert status manually',
          ],
          evidence:{
            summary: 'HR / Cert database has not synced in 4 hours 12 minutes — 252 minutes above the 30-minute freshness threshold. Three agents are operating on unverified cert data: Pre-Shift Verification, Resource Allocation, and Handoff Synthesis.',
            causalSignals:[
              { signal:'HR data age',     reading:'252 min', threshold:'< 30 min required', status:'stale', note:'Last sync: 10:10 AM — no integration event since' },
              { signal:'Affected agents', reading:'3 degraded', threshold:'0 degraded',     status:'breach', note:'Pre-Shift, Resource Allocation, Handoff Synthesis' },
            ],
            dependencies:[
              { label:'HR integration sync',    status:'eligible', note:'Manual trigger available — resolves staleness immediately' },
              { label:'Pre-Shift Verification',  status:'blocked',  note:'Refusing clean cert pass until HR refreshed' },
              { label:'Manual cert check',       status:'eligible', note:'Can verify cert status directly as a fallback' },
            ],
            riskForecast: 'Continued staleness: Handoff Synthesis flags cert fields as unverified — supervisor must manually confirm before signing. Resource allocation proposals may reference outdated cert status.',
          },
        },
      ],
    },
  ],
}

export const dataSourceHealth = [
  { source:'SCADA / Sensor streams', ageMin:8,   status:'fresh', score:100, dependents:['Compliance Monitor','Pre-Shift Verification','Predictive Maintenance','Handoff Synthesis'] },
  { source:'HR / Cert database',     ageMin:252, status:'stale', score:0,   dependents:['Pre-Shift Verification','Resource Allocation','Handoff Synthesis'], staleSince:'10:10 AM' },
  { source:'CAPA database',          ageMin:22,  status:'fresh', score:100, dependents:['CAPA Closure','Handoff Synthesis','Risk Escalation'] },
  { source:'COA / Lot database',     ageMin:15,  status:'fresh', score:100, dependents:['Supplier Intelligence'] },
  { source:'MES / Production',       ageMin:45,  status:'warn',  score:50,  dependents:['Handoff Synthesis','Pre-Shift Verification'], note:'Approaching 30-min threshold' },
  { source:'Robot telemetry',        ageMin:4,   status:'fresh', score:100, dependents:['Predictive Maintenance','Resource Allocation','Handoff Synthesis'] },
]

// System confidence: weighted average of critical source scores
// HR weighted 1x (affects 3 agents), SCADA 2x (safety-critical), others 1x
export const systemConfidenceScore = Math.round(
  (100*2 + 0*1 + 100*1 + 100*1 + 50*1 + 100*1) / 7
) // → 79
