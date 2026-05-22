// Field observations — structured notes logged by operators during floor walks.
// These are what eyes catch that sensors miss.

export const OBSERVATION_CATEGORIES = [
  { id: 'equipment', label: 'Equipment', textCls: 'text-signal',  bgCls: 'bg-signal/[0.12]'   },
  { id: 'material',  label: 'Material',  textCls: 'text-warn',   bgCls: 'bg-warn/[0.10]'    },
  { id: 'workflow',  label: 'Workflow',  textCls: 'text-muted',  bgCls: 'bg-stone3'          },
  { id: 'quality',   label: 'Quality',   textCls: 'text-ok',     bgCls: 'bg-ok/[0.10]'      },
  { id: 'safety',    label: 'Safety',    textCls: 'text-danger',  bgCls: 'bg-danger/[0.10]'  },
]

export const OBSERVATION_STATIONS = [
  'Line 4 · Lamination',
  'Line 4 · Pack Line',
  'Line 4 · Deposition',
  'Line 6 · Fermentation',
  'Line 6 · Filling',
  'Line 3 · Changeover',
  'Receiving · Dock A',
  'QC Lab',
  'Mezzanine',
  'Other',
]

export const seedObservations = [
  {
    id: 'obs-001',
    timeLabel: '14:32',
    operator: 'C. Reyes',
    station: 'Line 4 · Lamination',
    category: 'workflow',
    note: 'AMRs moving noticeably faster than this morning near the lamination station. Could be compensating for an earlier dock delay — flagged for engineering and logistics.',
    shiftId: 'am-0522',
  },
  {
    id: 'obs-002',
    timeLabel: '11:15',
    operator: 'C. Reyes',
    station: 'Line 4 · Deposition',
    category: 'equipment',
    note: 'Chamber 3A fan audibly louder than normal. Not enough to stop the line but worth checking at next scheduled PM window.',
    shiftId: 'am-0522',
  },
]
