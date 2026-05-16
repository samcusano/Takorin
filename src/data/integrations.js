// ── Integration catalog — Shift 5: Integration architecture expansion ──────────
// Manufacturing OS surface: 50+ source types, event streaming, semantic
// normalization, confidence arbitration, temporal reconciliation.

export const integrationCategories = [
  'Production',
  'Quality & Sensory',
  'Supply Chain',
  'HR & Workforce',
  'Environment & Energy',
  'Laboratory',
  'ERP & Finance',
  'AI & Vision',
  'Compliance',
  'Maintenance',
]

export const connectors = [
  // ── Production ────────────────────────────────────────────────────────────
  { id: 'mes-core',       category: 'Production',          name: 'MES — Production Core',          vendor: 'Siemens Opcenter',   status: 'active',    quality: 94, lastSync: '2 min ago', signals: 847,  latency: '1.2s',  streaming: true,  conflicts: 0, note: null },
  { id: 'scada-ferm',     category: 'Production',          name: 'SCADA — Fermentation Tanks',      vendor: 'Rockwell FactoryTalk', status: 'active',  quality: 91, lastSync: '30s ago',  signals: 2840, latency: '0.8s',  streaming: true,  conflicts: 0 },
  { id: 'scada-bottle',   category: 'Production',          name: 'SCADA — Bottling Lines',          vendor: 'Rockwell FactoryTalk', status: 'active',  quality: 97, lastSync: '30s ago',  signals: 420,  latency: '0.8s',  streaming: true,  conflicts: 0 },
  { id: 'plc-koji',       category: 'Production',          name: 'PLC — Koji Chambers',             vendor: 'Mitsubishi MELSEC',  status: 'active',    quality: 88, lastSync: '1 min ago', signals: 124,  latency: '2.1s',  streaming: false, conflicts: 2, note: 'Naming conflict: "Chamber Temp" vs. "KojiT"' },
  { id: 'batch-tracker',  category: 'Production',          name: 'Batch Management System',         vendor: 'Custom (in-house)',  status: 'active',    quality: 96, lastSync: '5 min ago', signals: 340,  latency: '4s',    streaming: false, conflicts: 0 },
  { id: 'env-control',    category: 'Production',          name: 'Environmental Control — HVAC',    vendor: 'Honeywell Building', status: 'active',    quality: 92, lastSync: '2 min ago', signals: 680,  latency: '1.5s',  streaming: true,  conflicts: 0 },
  { id: 'oee-system',     category: 'Production',          name: 'OEE Tracking System',             vendor: 'Vorne Industries',   status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'vision-line',    category: 'Production',          name: 'Line Vision System — Bottling',   vendor: 'Cognex In-Sight',    status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── Quality & Sensory ─────────────────────────────────────────────────────
  { id: 'e-nose',         category: 'Quality & Sensory',   name: 'AI Electronic Nose — Arrays 1–6',  vendor: 'Haitian Internal',  status: 'active',    quality: 91, lastSync: '8 min ago', signals: 48,   latency: '8s',    streaming: false, conflicts: 0 },
  { id: 'ai-vision-bean', category: 'Quality & Sensory',   name: 'AI Bean Selection — Vision',       vendor: 'Haitian Internal',  status: 'active',    quality: 99, lastSync: '1 min ago', signals: 12,   latency: '0.2s',  streaming: true,  conflicts: 0 },
  { id: 'lims',           category: 'Quality & Sensory',   name: 'LIMS — Laboratory Info System',    vendor: 'LabVantage',        status: 'active',    quality: 94, lastSync: '15 min ago', signals: 280,  latency: '12s',   streaming: false, conflicts: 1, note: 'Unit mismatch: LIMS "mg/L" vs. SCADA "ppm"' },
  { id: 'taste-panel',    category: 'Quality & Sensory',   name: 'Expert Taste Panel — Digital',     vendor: 'Haitian Internal',  status: 'active',    quality: 87, lastSync: '2h ago',    signals: 8,    latency: 'manual', streaming: false, conflicts: 0 },
  { id: 'color-spectro',  category: 'Quality & Sensory',   name: 'Color Spectrophotometry',          vendor: 'HunterLab UltraScan', status: 'active',  quality: 98, lastSync: '1h ago',    signals: 24,   latency: '30s',   streaming: false, conflicts: 0 },
  { id: 'microbio-lab',   category: 'Quality & Sensory',   name: 'Microbiology Lab Results',         vendor: 'Manual entry',      status: 'active',    quality: 82, lastSync: '4h ago',    signals: 16,   latency: 'manual', streaming: false, conflicts: 0 },
  { id: 'texture-ai',     category: 'Quality & Sensory',   name: 'AI Texture Analysis',              vendor: 'Stable Micro Systems', status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'rheometer',      category: 'Quality & Sensory',   name: 'Viscosity & Rheology',             vendor: 'Anton Paar',        status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── Supply Chain ──────────────────────────────────────────────────────────
  { id: 'erp-sc',         category: 'Supply Chain',        name: 'ERP — Supply Chain Module',        vendor: 'SAP S/4HANA',       status: 'active',    quality: 89, lastSync: '10 min ago', signals: 420,  latency: '6s',    streaming: false, conflicts: 3, note: 'Ingredient naming: 3 active conflicts with MES' },
  { id: 'wms',            category: 'Supply Chain',        name: 'Warehouse Management System',      vendor: 'Manhattan WM',      status: 'active',    quality: 93, lastSync: '5 min ago',  signals: 180,  latency: '3s',    streaming: true,  conflicts: 0 },
  { id: 'supplier-portal', category: 'Supply Chain',       name: 'Supplier Portal — COA & Docs',     vendor: 'Haitian Supplier Hub', status: 'active', quality: 86, lastSync: '30 min ago', signals: 64,   latency: '60s',   streaming: false, conflicts: 0 },
  { id: 'cold-chain',     category: 'Supply Chain',        name: 'Cold Chain Temperature Logging',   vendor: 'Sensitech ColdChain', status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'logistics-api',  category: 'Supply Chain',        name: 'Logistics & Freight API',          vendor: '3PL connector',     status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── HR & Workforce ────────────────────────────────────────────────────────
  { id: 'hris',           category: 'HR & Workforce',      name: 'HRIS — Workforce Records',         vendor: 'Workday',           status: 'active',    quality: 91, lastSync: '06:00 today', signals: 48,   latency: '60s',   streaming: false, conflicts: 0 },
  { id: 'training-sys',   category: 'HR & Workforce',      name: 'Training & Certification System',  vendor: 'SAP SuccessFactors', status: 'active',   quality: 88, lastSync: '06:00 today', signals: 24,   latency: '60s',   streaming: false, conflicts: 0 },
  { id: 'shift-sched',    category: 'HR & Workforce',      name: 'Shift Scheduling System',          vendor: 'Kronos Workforce',  status: 'active',    quality: 94, lastSync: '1 min ago',   signals: 18,   latency: '30s',   streaming: false, conflicts: 0 },
  { id: 'biometric',      category: 'HR & Workforce',      name: 'Biometric Access Control',         vendor: 'ZKTeco',            status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'fatigue-mon',    category: 'HR & Workforce',      name: 'Fatigue Monitoring — Wearables',   vendor: 'Pillar Technologies', status: 'soon',    quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── Environment & Energy ──────────────────────────────────────────────────
  { id: 'energy-mgmt',    category: 'Environment & Energy', name: 'Energy Management System',        vendor: 'Schneider EcoStruxure', status: 'active', quality: 96, lastSync: '2 min ago', signals: 240,  latency: '2s',    streaming: true,  conflicts: 0 },
  { id: 'water-monitor',  category: 'Environment & Energy', name: 'Water Consumption Monitoring',   vendor: 'Endress+Hauser',    status: 'active',    quality: 93, lastSync: '5 min ago',  signals: 48,   latency: '3s',    streaming: true,  conflicts: 0 },
  { id: 'co2-sensor',     category: 'Environment & Energy', name: 'CO₂ Emissions Monitoring',       vendor: 'Siemens PAC',       status: 'active',    quality: 91, lastSync: '2 min ago',  signals: 32,   latency: '2s',    streaming: true,  conflicts: 0 },
  { id: 'waste-track',    category: 'Environment & Energy', name: 'Waste Tracking System',           vendor: 'Haitian Internal',  status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'solar',          category: 'Environment & Energy', name: 'Solar Generation Monitoring',     vendor: 'Huawei FusionSolar', status: 'soon',    quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── Laboratory ────────────────────────────────────────────────────────────
  { id: 'gc-ms',          category: 'Laboratory',           name: 'GC-MS — Aroma Compound Analysis', vendor: 'Agilent 8890',      status: 'active',    quality: 97, lastSync: '2h ago',     signals: 120,  latency: 'batch', streaming: false, conflicts: 0 },
  { id: 'hplc',           category: 'Laboratory',           name: 'HPLC — Amino Acid Profiling',     vendor: 'Waters Alliance',   status: 'active',    quality: 98, lastSync: '4h ago',     signals: 48,   latency: 'batch', streaming: false, conflicts: 0 },
  { id: 'titration',      category: 'Laboratory',           name: 'Automated Titration — Acidity',   vendor: 'Mettler Toledo',    status: 'active',    quality: 99, lastSync: '2h ago',     signals: 24,   latency: 'batch', streaming: false, conflicts: 0 },
  { id: 'nir',            category: 'Laboratory',           name: 'NIR — Near Infrared Analysis',    vendor: 'Bruker MPA',        status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── ERP & Finance ─────────────────────────────────────────────────────────
  { id: 'erp-finance',    category: 'ERP & Finance',        name: 'ERP — Finance & Costing',         vendor: 'SAP S/4HANA',       status: 'active',    quality: 92, lastSync: '15 min ago', signals: 84,   latency: '10s',   streaming: false, conflicts: 0 },
  { id: 'erp-maint',      category: 'ERP & Finance',        name: 'ERP — Maintenance Orders (PM)',   vendor: 'SAP PM Module',     status: 'active',    quality: 89, lastSync: '10 min ago', signals: 48,   latency: '8s',    streaming: false, conflicts: 0 },
  { id: 'demand-plan',    category: 'ERP & Finance',        name: 'Demand Planning System',          vendor: 'SAP IBP',           status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── AI & Vision ───────────────────────────────────────────────────────────
  { id: 'vision-bean',    category: 'AI & Vision',          name: 'AI Vision — Bean Selection v3',   vendor: 'Haitian Internal',  status: 'active',    quality: 99, lastSync: '30s ago',    signals: 12,   latency: '0.2s',  streaming: true,  conflicts: 0 },
  { id: 'vision-fill',    category: 'AI & Vision',          name: 'AI Vision — Fill Level Check',    vendor: 'Cognex VisionPro',  status: 'active',    quality: 97, lastSync: '1 min ago',  signals: 8,    latency: '0.3s',  streaming: true,  conflicts: 0 },
  { id: 'vision-label',   category: 'AI & Vision',          name: 'AI Vision — Label Inspection',    vendor: 'Cognex VisionPro',  status: 'active',    quality: 96, lastSync: '1 min ago',  signals: 8,    latency: '0.3s',  streaming: true,  conflicts: 0 },
  { id: 'enose-v2',       category: 'AI & Vision',          name: 'AI Electronic Nose v2 (upgrade)', vendor: 'Haitian R&D',       status: 'soon',      quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'ai-scheduler',   category: 'AI & Vision',          name: 'AI Production Scheduler (RL)',    vendor: 'Haitian Internal',  status: 'active',    quality: 93, lastSync: '1h ago',     signals: 24,   latency: '60s',   streaming: false, conflicts: 0 },

  // ── Compliance ────────────────────────────────────────────────────────────
  { id: 'capa-system',    category: 'Compliance',           name: 'CAPA Management System',          vendor: 'Takorin',           status: 'active',    quality: 95, lastSync: 'live',       signals: 180,  latency: 'live',  streaming: true,  conflicts: 0 },
  { id: 'doc-mgmt',       category: 'Compliance',           name: 'Document Control System',         vendor: 'Veeva Vault',       status: 'active',    quality: 91, lastSync: '30 min ago', signals: 64,   latency: '60s',   streaming: false, conflicts: 0 },
  { id: 'audit-trail',    category: 'Compliance',           name: 'Audit Trail & e-Signature',       vendor: 'MasterControl',     status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
  { id: 'traceability',   category: 'Compliance',           name: 'Lot Traceability Chain',          vendor: 'Takorin',           status: 'active',    quality: 96, lastSync: 'live',       signals: 48,   latency: 'live',  streaming: true,  conflicts: 0 },
  { id: 'samr-portal',    category: 'Compliance',           name: 'SAMR Reporting Portal',           vendor: 'SAMR (gov)',        status: 'soon',      quality: null, lastSync: null, signals: null, conflicts: 0 },

  // ── Maintenance ───────────────────────────────────────────────────────────
  { id: 'cmms',           category: 'Maintenance',          name: 'CMMS — Maintenance Management',   vendor: 'Infor EAM',         status: 'active',    quality: 88, lastSync: '20 min ago', signals: 120,  latency: '15s',   streaming: false, conflicts: 0 },
  { id: 'vibration-mon',  category: 'Maintenance',          name: 'Vibration Monitoring — Equipment', vendor: 'SKF Enlight',      status: 'active',    quality: 94, lastSync: '5 min ago',  signals: 280,  latency: '5s',    streaming: true,  conflicts: 0 },
  { id: 'thermo-camera',  category: 'Maintenance',          name: 'Thermal Imaging — Predictive PM', vendor: 'FLIR AX8',         status: 'active',    quality: 91, lastSync: '2 min ago',  signals: 48,   latency: '2s',    streaming: true,  conflicts: 0 },
  { id: 'oil-analysis',   category: 'Maintenance',          name: 'Oil Analysis — Lubrication',      vendor: 'Spectro Scientific', status: 'available', quality: null, lastSync: null, signals: null, conflicts: 0 },
]

export const integrationSummary = {
  total: 51,
  active: 32,
  available: 13,
  soon: 6,
  totalSignals: 7428,
  activeConflicts: 6,
  streamingSources: 18,
  batchSources: 14,
}

export const semanticConflicts = [
  {
    id: 'sc-001',
    severity: 'warn',
    sources: ['ERP — Supply Chain', 'MES — Production Core', 'Supplier Portal'],
    field: 'Soy protein content',
    values: [
      { source: 'ERP',             value: 'Protein %',               format: 'percentage' },
      { source: 'MES',             value: 'Protein content (g/100g)', format: 'g/100g' },
      { source: 'Supplier Portal', value: 'CP% (crude protein)',      format: 'percentage (crude)' },
    ],
    impact: 'Batch yield calculations using mismatched protein values. Potential 2–4% error in predicted amino acid nitrogen.',
    resolution: 'Normalize to g/100g across all sources. ERP mapping update required.',
    autoEligible: true,
  },
  {
    id: 'sc-002',
    severity: 'warn',
    sources: ['LIMS', 'SCADA — Fermentation Tanks'],
    field: 'Aroma compound concentration',
    values: [
      { source: 'LIMS',   value: 'Benzaldehyde mg/L', format: 'mg/L' },
      { source: 'SCADA',  value: 'Benzaldehyde ppm',  format: 'ppm (mass/mass)' },
    ],
    impact: 'For aqueous solutions at ~1g/mL density, these are approximately equal — but deviation accumulates in trend analysis.',
    resolution: 'Standardize to ppm across platform. LIMS unit conversion rule to apply.',
    autoEligible: true,
  },
  {
    id: 'sc-003',
    severity: 'warn',
    sources: ['PLC — Koji Chambers', 'Environmental Control'],
    field: 'Temperature sensor IDs',
    values: [
      { source: 'PLC',            value: '"Chamber Temp A1"', format: 'string label' },
      { source: 'Env. Control',   value: '"KojiT_01_Zone_A"', format: 'device code' },
    ],
    impact: 'Two sources describing the same physical sensor — double-counting in temperature analytics.',
    resolution: 'Alias mapping required. Map PLC label to Env. Control device code.',
    autoEligible: false,
  },
]
