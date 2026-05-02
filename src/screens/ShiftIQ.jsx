import { useState, useEffect } from 'react'
import { Activity, Clock, FlaskConical } from 'lucide-react'
import { shiftData, haccpData, productionRate, crewHoursData } from '../data'
import {
  Urg, StatCell, SecHd, CaseCard, Layout,
  Btn, ConsequenceNotice, PageHead, ActionBanner, MetricCard
} from '../components/UI'
import { useAppState } from '../context/AppState'

const CHECKLIST_ITEMS = [
  { key: 'topping',     label: 'Topping weight verification',                 operator: 'Reyes',    isAllergen: false },
  { key: 'qa1',         label: 'Packaging QA pre-check',                      operator: 'Patel',    isAllergen: false },
  { key: 'seal',        label: 'Seal inspection',                             operator: 'Patel',    isAllergen: false },
  { key: 'allergen',    label: 'Allergen changeover log',                     operator: 'Okonkwo',  isAllergen: true  },
  { key: 'emp',         label: 'Zone 1 environmental swab — Sauce Dosing',   operator: 'Okonkwo',  isAllergen: false },
  { key: 'calibration', label: 'Oven B thermocouple calibration check',       operator: 'Kowalski', isAllergen: false },
]

const CHECKLIST_TOTAL = 13

const HACCP_BY_STATION = {
  'Supervisor': null,
  'Operator · L3': { station: 'Sauce Dosing', ccp: 'CCP-1', limit: '60°C hold temp' },
  'Operator · L1 — Mismatch ⚠': { station: 'Sauce Dosing', ccp: 'CCP-1', limit: '60°C hold temp — L2 cert required' },
  'Operator · L2': { station: 'Oven Station B', ccp: 'CCP-3', limit: '185°F for GF-Flatbread' },
}

function EmptyLine({ name }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="font-body italic text-ghost text-[12px] text-center leading-relaxed">
        No live data for {name}<br />Pilot limited to Line 4
      </div>
    </div>
  )
}

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'text-danger' : score >= 60 ? 'text-warn' : 'text-ok'
  return <span className={`display-num text-3xl ${color}`}>{score}</span>
}

function AgentTimeline({ timeline, sparkline, score }) {
  const scoreColor = score >= 75 ? '#D94F2A' : score >= 60 ? '#C4920A' : '#3A8A5A'
  const scoreTextColor = score >= 75 ? 'text-danger' : score >= 60 ? 'text-warn' : 'text-ok'
  const zone = score >= 75 ? 'AT RISK' : score >= 60 ? 'WATCH' : 'CLEAR'
  return (
    <div className="border-b border-rule2">
      <MetricCard
        title={`${zone} — Line 4`}
        value={score}
        valueColor={scoreTextColor}
        waveformData={sparkline}
        waveformColor={scoreColor}
        waveformHeight={40}
        meta={{ label: 'Trend', value: 'Rising · 06:12–06:42' }}
      />
      {/* Timeline rows */}
      {timeline.map((row, i) => (
        <div key={i} className="flex gap-2.5 px-4 py-3 border-b border-rule last:border-b-0">
          <div className="font-body italic text-ghost text-[10px] w-11 flex-shrink-0 mt-0.5">{row.time}</div>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
            row.level === 'now' ? 'bg-ochre' : row.level === 'warn' ? 'bg-warn' : row.level === 'ok' ? 'bg-ok' : 'bg-rule'
          }`} />
          <div className="flex-1">
            <p className="font-body text-ink2 text-[11px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: row.event.replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink font-medium">$1</strong>') }}
            />
            {row.delta && <div className={`display-num text-[11px] mt-0.5 ${row.deltaColor}`}>{row.delta}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function SignalCard({ sig }) {
  const ringPct = sig.score
  const c = sig.tone === 'danger' ? '#D94F2A' : sig.tone === 'warn' ? '#C4920A' : '#3A8A5A'
  const circ = 2 * Math.PI * 14
  const offset = circ - (ringPct / 100) * circ
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rule2 last:border-b-0">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="flex-shrink-0">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#D8D2C8" strokeWidth="4" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={c} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 18 18)" strokeLinecap="butt" />
        <text x="18" y="22" textAnchor="middle"
          style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fontSize:10, fill:c }}>
          {sig.score}
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <div className={`font-body text-[12px] font-medium truncate ${sig.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{sig.name}</div>
        <div className="font-body italic text-ghost text-[10px]">{sig.sub}</div>
      </div>
      <span className={`font-body italic font-medium text-[10px] px-2 py-0.5 flex-shrink-0 ${
        sig.tone === 'ok' ? 'bg-ok/10 text-ok' : sig.tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
      }`}>{sig.status}</span>
    </div>
  )
}

function CrewRow({ m }) {
  const hrs = crewHoursData[m.name]
  const fatigue = hrs ? (hrs.hoursThisWeek >= 60 ? 'danger' : hrs.hoursThisWeek >= 48 ? 'warn' : null) : null
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-rule last:border-b-0 ${fatigue === 'danger' ? 'bg-danger/[0.02]' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className={`font-body text-[12px] font-medium ${m.flag ? 'text-danger' : 'text-ink'}`}>{m.name}</div>
        <div className={`font-body italic text-[10px] ${m.flag ? 'text-danger' : 'text-ghost'}`}>{m.role}</div>
      </div>
      <div className="flex items-center gap-2">
        {hrs && fatigue && (
          <span className={`font-body italic text-[9px] px-1 py-px ${fatigue === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>{hrs.hoursThisWeek}h</span>
        )}
        <div className="flex gap-1">
          {m.dots.map((d, i) => (
            <div key={i} className={`w-2 h-2${d ? 'bg-ochre' : 'bg-rule2'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Finding({ f, onAct }) {
  const [acked, setAcked] = useState(null)
  const [showDismiss, setShowDismiss] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showed, setShowed] = useState(false)

  const handleAct = (action) => {
    onAct(f.id)
    setAcked('actioning')
    setShowed(true)
  }

  const borderColor = f.urgency === 'danger' ? 'border-l-danger' : f.urgency === 'warn' ? 'border-l-warn' : 'border-l-rule'

  return (
    <div className={`border-l-2 ${borderColor} border-b border-rule2 ${dismissed ? 'opacity-50' : ''}`}>
      <div className="grid grid-cols-[28px_1fr]">
        <div className={`pt-4 pl-3 display-num text-[13px] ${
          f.urgency === 'danger' ? 'text-danger' : f.urgency === 'warn' ? 'text-warn' : 'text-muted'
        }`}>{f.num}</div>
        <div className="p-4 pl-2 space-y-2">
          <p className="font-body text-ink font-medium text-[13px] leading-snug">{f.title}</p>
          <p className="font-body italic text-ink2 text-[12px] leading-relaxed">{f.desc}</p>
          <p className="font-body italic text-ghost text-[11px]">▸ {f.evidence}</p>
          <div className="flex gap-2 pt-1">
            {f.actions.map((a, i) => (
              <Btn key={i} variant={i === 0 ? 'primary' : 'ghost'} onClick={() => handleAct(a)}
                style={i === 0 ? { background:'#C17D2A', color:'#F5F0E8' } : {}}>
                {a}
              </Btn>
            ))}
            <Btn variant="muted" onClick={() => setShowDismiss(!showDismiss)}>Dismiss</Btn>
          </div>
          {showDismiss && !dismissed && (
            <div className="flex gap-2 pt-1 slide-in">
              <select className="font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1 flex-1 cursor-pointer">
                <option>Reason for dismissing…</option>
                <option>Already handled by outgoing supervisor</option>
                <option>Not applicable — SKU change in progress</option>
                <option>Assessment is incorrect — false positive</option>
              </select>
              <Btn variant="muted" onClick={() => { setDismissed(true); setShowDismiss(false) }}>Confirm</Btn>
            </div>
          )}
          {acked && (
            <div className="flex items-center gap-1.5 font-body italic text-ink2 text-[10px]">
              <div className={`w-1.5 h-1.5 rounded-full ${acked === 'actioning' ? 'bg-ok' : 'bg-danger'}`} />
              {acked === 'actioning' ? 'Actioning' : 'Dismissed'}
            </div>
          )}
        </div>
      </div>
      <ConsequenceNotice show={showed && f.consequence}>
        {f.consequence}
      </ConsequenceNotice>
    </div>
  )
}

function ForecastRow({ row, onStaffingAction, staffingActioned }) {
  const scoreColor = row.score >= 75 ? 'text-danger' : row.score >= 60 ? 'text-warn' : 'text-ok'
  const hasConflict = row.signals?.some(s => s.t === 'bad' || s.t === 'danger')
  return (
    <div className={`flex border-b border-rule2 last:border-b-0 min-h-[46px] ${row.critical ? 'bg-danger/[0.03]' : ''}`}>
      <div className="w-[72px] flex-shrink-0 px-3 py-2.5 border-r border-rule2 font-body italic text-ghost text-[10px] leading-relaxed whitespace-pre-line">{row.time}</div>
      <div className={`w-10 flex-shrink-0 px-2 pt-2.5 display-num text-lg ${scoreColor}`}>{row.score}</div>
      <div className="flex-1 px-3 py-2.5">
        <div className="font-body font-medium text-ink text-[12px] mb-1">{row.name}</div>
        <div className="flex gap-1.5 flex-wrap mb-1">
          {(row.signals || []).map((s, i) => {
            const cls = s.t === 'ok' ? 'text-ok bg-ok/10' : (s.t === 'bad' || s.t === 'danger') ? 'text-danger bg-danger/10' : 'text-warn bg-warn/10'
            return <span key={i} className={`font-body italic text-[9px] px-1.5 py-px ${cls}`}>{s.l}</span>
          })}
        </div>
        {row.action && <p className={`font-body italic text-[10px] ${row.critical ? 'text-warn' : 'text-ghost'}`}>{row.action}</p>}
        {hasConflict && !staffingActioned && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <button onClick={() => onStaffingAction('reassign')} className="font-body font-medium text-[10px] px-2 py-0.5 bg-danger/10 text-danger hover:bg-danger/20 transition-colors">Reassign backup</button>
            <button onClick={() => onStaffingAction('sku')} className="font-body italic text-[10px] px-2 py-0.5 bg-stone2 text-muted hover:bg-stone3 transition-colors">Adjust SKU mix</button>
          </div>
        )}
        {staffingActioned && <div className="font-body italic text-ok text-[10px] mt-1 slide-in">Conflict resolved · Shift forecast updated</div>}
      </div>
    </div>
  )
}

export default function ShiftIQ() {
  const d = shiftData
  const [activeLine, setActiveLine] = useState('l4')
  const {
    shiftActed: acted, setShiftActed: setActed,
    readinessResolved, readinessScore,
    briefingAcknowledged, setBriefingAcknowledged,
    checklistSigned, setChecklistSigned,
    allergenOverride, setAllergenOverride,
    nearMisses, setNearMisses,
    taskAssignments, setTaskAssignments,
    maintenanceTickets, setMaintenanceTickets,
    empSessionResults, setEmpSessionResults,
    flaggedItems, setFlaggedItems,
    logActivity,
  } = useAppState()
  const [predActioned, setPredActioned] = useState(false)
  const [staffingActioned, setStaffingActioned] = useState({})
  const [overrideMode, setOverrideMode] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [showNearMiss, setShowNearMiss] = useState(false)
  const [nearMissForm, setNearMissForm] = useState({ station:'', what:'', action:'', atRisk: false })
  const [nearMissSubmitted, setNearMissSubmitted] = useState(false)
  const [empForm, setEmpForm] = useState({})
  const [flagForm, setFlagForm] = useState({})
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ assignee:'', label:'', dueTime:'' })

  const skuContextReady = readinessResolved?.['ctx-0'] && (readinessScore ?? 64) >= 75
  const allergenSigned = !!checklistSigned['allergen'] || !!allergenOverride
  const signedCount = 7 + Object.keys(checklistSigned).length
  const startupPct = Math.round((signedCount / CHECKLIST_TOTAL) * 100)
  const [countdown, setCountdown] = useState(d.countdown)
  const [escalatedShift, setEscalatedShift] = useState(false)
  const [pilotExpanded, setPilotExpanded] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setCountdown(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const countdownFmt = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`
  const activeLined = d.lines.find(l => l.id === activeLine)
  const hasLiveData = activeLine === 'l4'
  const scoreColor = d.score >= 75 ? 'text-danger' : d.score >= 60 ? 'text-warn' : 'text-ok'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ActionBanner
        color="#D94F2A"
        headline={`3 interventions pending · Line 4 · ${countdownFmt} remaining`}
        body={escalatedShift
          ? 'Director notified — escalation logged. Act on findings before the window closes.'
          : 'Risk score 78 — above intervention threshold. Two actionable findings. Act before the window closes.'}
      >
        <Btn variant="ghost" onClick={() => setEscalatedShift(true)}>
          {escalatedShift ? 'Escalated ✓' : 'Escalate to director'}
        </Btn>
      </ActionBanner>

      {/* Line switcher */}
      <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0 overflow-x-auto">
        {d.lines.map(line => {
          const sc = line.score >= 75 ? 'text-danger' : line.score >= 60 ? 'text-warn' : 'text-ok'
          const active = activeLine === line.id
          return (
            <button key={line.id}
              onClick={() => setActiveLine(line.id)}
              className={`flex flex-col items-start px-4 py-2.5 border-b-2 border-r border-rule2 flex-shrink-0 transition-colors ${
                active ? 'border-b-ochre bg-stone' : 'border-b-transparent hover:bg-stone3'
              }`}>
              <div className="font-body text-ink2 font-medium text-[11px]">{line.name}</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`font-body font-medium uppercase tracking-widest text-[8px] ${sc}`}>
                  {line.score >= 75 ? 'AT RISK' : line.score >= 60 ? 'WATCH' : 'CLEAR'}
                </span>
                <span className={`display-num text-xl leading-none ${sc}`}>{line.score}</span>
              </div>
              <div className="font-body italic text-ghost text-[9px] mt-0.5">{line.supervisor}</div>
            </button>
          )
        })}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 border-b border-rule2 bg-stone flex-shrink-0">
        {d.stats.map((s, i) => <StatCell key={i} {...s} />)}
      </div>

      {/* Mid-shift production strip */}
      <div className="flex items-center gap-5 px-5 py-2.5 border-b border-rule2 bg-stone2 flex-shrink-0 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="display-num text-xl text-ink">{productionRate.unitsProduced.toLocaleString()}</span>
          <span className="font-body italic text-ghost text-[11px]">of {productionRate.unitsTarget.toLocaleString()} units · T+{Math.round(productionRate.hoursElapsed * 60)}m</span>
        </div>
        <div className="flex-1 min-w-[120px] max-w-xs">
          <div className="h-1.5 bg-rule2">
            <div className="h-full bg-warn transition-all" style={{ width: Math.round(productionRate.unitsProduced / productionRate.unitsTarget * 100) + '%' }} />
          </div>
          <div className="flex justify-between font-body italic text-ghost text-[9px] mt-0.5">
            <span>{Math.round(productionRate.unitsProduced / productionRate.unitsTarget * 100)}% of target</span>
            <span>Expected at T+{Math.round(productionRate.hoursElapsed * 60)}m: {Math.round(productionRate.unitsTarget * (productionRate.hoursElapsed / productionRate.hoursTotal)).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-body italic text-ghost text-[10px]">Rate:</span>
          <span className="display-num text-base text-ink">{productionRate.currentRate.toLocaleString()}</span>
          <span className="font-body italic text-ghost text-[10px]">u/hr</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-body italic text-ghost text-[10px]">Proj. OEE:</span>
          <span className={`display-num text-base ${productionRate.projectedOEE >= 82 ? 'text-ok' : productionRate.projectedOEE >= 75 ? 'text-warn' : 'text-danger'}`}>{productionRate.projectedOEE}%</span>
          <span className="font-body italic text-warn text-[9px]">↓ below 82% target</span>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* COL 1: Findings */}
        <div className="flex-1 overflow-y-auto border-r border-rule2">
          <div className="px-4 py-2 border-b border-rule2 bg-stone2 sticky top-0 z-10 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">
            Corrective orders
          </div>
          {hasLiveData ? (
            <>
              {/* Pre-shift safety briefing */}
              {!briefingAcknowledged && (
                <div className="border-b-2 border-b-brass bg-brass/[0.04]">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="font-body font-medium text-ink text-[12px]">Pre-shift safety briefing</div>
                    <span className="font-body italic text-ghost text-[9px]">Acknowledge before proceeding</span>
                  </div>
                  {[
                    { icon: haccpData.allergenChangeover.required ? '⚠' : '✓', color: haccpData.allergenChangeover.required ? 'text-danger' : 'text-ok',
                      text: `Allergen changeover required: ${haccpData.allergenChangeover.from} → ${haccpData.allergenChangeover.to}. Full flush before start.` },
                    { icon: '⚑', color: 'text-warn',
                      text: 'HACCP CCP-3 active — Oven B minimum 185°F for GF-Flatbread. Log any deviation immediately.' },
                    { icon: '↷', color: 'text-warn',
                      text: 'Carry-forward: Sensor A-7 variance at count 4. Escalate at 5.' },
                    { icon: '⚠', color: 'text-warn',
                      text: 'Cert gap: Reyes (L1) assigned to Sauce Dosing (L2 required). Reassign before production.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2.5 px-4 py-2 border-t border-rule2">
                      <span className={`font-body ${item.color} text-[12px] flex-shrink-0 mt-px`}>{item.icon}</span>
                      <span className="font-body italic text-ink2 text-[11px] leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 border-t border-rule2">
                    <button
                      onClick={() => setBriefingAcknowledged(true)}
                      className="w-full font-body font-medium text-[11px] px-3 py-2 bg-brass text-stone hover:opacity-90 transition-opacity"
                    >
                      I've reviewed this shift's safety context — D. Kowalski · {new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                    </button>
                  </div>
                </div>
              )}

              {/* Allergen changeover hard block */}
              {!allergenSigned && (
                <div className="border-b-2 border-b-danger bg-danger/[0.04] px-4 py-3">
                  <div className="flex items-start gap-2 mb-3">
                    <svg className="w-4 h-4 stroke-danger flex-shrink-0 mt-px" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <div className="font-body font-medium text-danger text-[12px]">Allergen changeover log unsigned — production start blocked</div>
                      <div className="font-body italic text-danger/80 text-[10px] mt-0.5">
                        {haccpData.allergenChangeover.from} → {haccpData.allergenChangeover.to} requires a signed allergen changeover log before Line 4 can start. Sign via checklist or log an override reason.
                      </div>
                    </div>
                  </div>
                  {!overrideMode ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChecklistSigned(p => ({ ...p, allergen: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }))}
                        className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger text-white hover:opacity-90 transition-opacity"
                      >
                        Sign log now — Okonkwo
                      </button>
                      <button
                        onClick={() => setOverrideMode(true)}
                        className="font-body italic text-[11px] px-3 py-1.5 bg-stone2 text-muted hover:bg-stone3 transition-colors"
                      >
                        Override — log reason
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 slide-in">
                      <input
                        type="text" placeholder="Override reason (required)…"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        className="w-full font-body italic text-ink text-[11px] bg-stone border border-danger/30 px-2 py-1.5"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={!overrideReason.trim()}
                          onClick={() => { setAllergenOverride(overrideReason); setOverrideMode(false); logActivity({ actor:'D. Kowalski', action:`Allergen override: "${overrideReason}"`, item:'Allergen changeover log', type:'override' }) }}
                          className="font-body font-medium text-[11px] px-3 py-1.5 bg-danger/80 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                          Confirm override — auto-CAPA created
                        </button>
                        <button onClick={() => setOverrideMode(false)} className="font-body italic text-[11px] px-2 py-1.5 text-ghost">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {allergenOverride && (
                <div className="flex items-center gap-2 px-4 py-2 bg-warn/10 border-b border-warn/20 font-body italic text-warn text-[10px] slide-in">
                  <svg className="w-3 h-3 stroke-warn flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Override logged · CAPA auto-created · Director notified · Reason: "{allergenOverride}"
                </div>
              )}
              {checklistSigned['allergen'] && (
                <div className="flex items-center gap-2 px-4 py-2 bg-ok/10 border-b border-ok/20 font-body italic text-ok text-[10px] slide-in">
                  <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Allergen changeover log signed — Okonkwo · {checklistSigned['allergen']} · Production start unblocked
                </div>
              )}

              <div className="flex items-baseline gap-3 px-4 py-2 border-b border-rule2">
                <Urg level="critical">3 pending · 27 min</Urg>
              </div>
              {d.findings.map(f => (
                <Finding key={f.id} f={f} onAct={(id) => setActed(p => ({ ...p, [id]: true }))} />
              ))}

              {/* Task assignment */}
              <div className="border-t border-rule2 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body italic text-ghost text-[9px] uppercase tracking-widest">Assigned tasks</span>
                  <button onClick={() => setShowTaskForm(p => !p)} className="font-body italic text-ghost text-[10px] hover:text-muted transition-colors">+ Assign</button>
                </div>
                {Object.entries(taskAssignments).flatMap(([op, tasks]) => tasks.map((t,i) => (
                  <div key={op+i} className={`flex items-center gap-2 py-1.5 border-b border-rule last:border-b-0 ${t.done ? 'opacity-50' : ''}`}>
                    <button onClick={() => setTaskAssignments(p => ({...p, [op]: p[op].map((x,j) => j===i ? {...x, done:true} : x)}))}
                      className={`w-3.5 h-3.5 flex-shrink-0 border ${t.done ? 'bg-ok border-ok' : 'border-rule2 hover:border-ok'} transition-colors`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-body text-[10px] ${t.done ? 'line-through text-ghost' : 'text-ink'}`}>{t.label}</div>
                      <div className="font-body italic text-ghost text-[9px]">{op} · {t.dueTime}</div>
                    </div>
                  </div>
                )))}
                {showTaskForm && (
                  <div className="mt-2 space-y-1.5 slide-in">
                    <select value={taskForm.assignee} onChange={e => setTaskForm(p => ({...p, assignee: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer">
                      <option value="">Assign to…</option>
                      {['A. Martinez','C. Reyes','P. Okonkwo','F. Adeyemi','T. Osei'].map(n => <option key={n}>{n}</option>)}
                    </select>
                    <input placeholder="Task description" value={taskForm.label} onChange={e => setTaskForm(p => ({...p, label: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
                    <input placeholder="Due time (e.g. 09:00)" value={taskForm.dueTime} onChange={e => setTaskForm(p => ({...p, dueTime: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
                    <div className="flex gap-1.5">
                      <button disabled={!taskForm.assignee || !taskForm.label}
                        onClick={() => {
                          const { assignee, label, dueTime } = taskForm
                          setTaskAssignments(p => ({...p, [assignee]: [...(p[assignee]||[]), { label, dueTime, done: false, id: Date.now() }]}))
                          setTaskForm({ assignee:'', label:'', dueTime:'' }); setShowTaskForm(false)
                        }}
                        className="font-body font-medium text-[10px] px-2.5 py-1 bg-ochre text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                        Assign task
                      </button>
                      <button onClick={() => setShowTaskForm(false)} className="font-body italic text-[10px] text-ghost px-2">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Near-miss reporting */}
              <div className="border-t border-rule2 px-4 py-3">
                {!showNearMiss && !nearMissSubmitted && (
                  <button onClick={() => setShowNearMiss(true)} className="font-body italic text-ghost text-[11px] hover:text-muted transition-colors">
                    + Log a near-miss
                  </button>
                )}
                {showNearMiss && !nearMissSubmitted && (
                  <div className="slide-in space-y-2">
                    <div className="font-body italic text-ghost text-[9px] uppercase tracking-widest">Near-miss report</div>
                    <select value={nearMissForm.station} onChange={e => setNearMissForm(p => ({...p, station: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1 cursor-pointer">
                      <option value="">Station…</option>
                      <option>Sauce Dosing</option>
                      <option>Oven Station B</option>
                      <option>Pack Line</option>
                      <option>Topping Line</option>
                    </select>
                    <textarea placeholder="What happened?" value={nearMissForm.what} onChange={e => setNearMissForm(p => ({...p, what: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1 h-16 resize-none" />
                    <input placeholder="Corrective step taken" value={nearMissForm.action} onChange={e => setNearMissForm(p => ({...p, action: e.target.value}))}
                      className="w-full font-body italic text-ink text-[11px] bg-stone border border-rule px-2 py-1" />
                    <label className="flex items-center gap-2 font-body italic text-muted text-[11px] cursor-pointer">
                      <input type="checkbox" checked={nearMissForm.atRisk} onChange={e => setNearMissForm(p => ({...p, atRisk: e.target.checked}))} />
                      Anyone at risk of injury?
                    </label>
                    <div className="flex gap-2">
                      <button
                        disabled={!nearMissForm.station || !nearMissForm.what}
                        onClick={() => {
                          setNearMisses(p => [...p, { ...nearMissForm, time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
                          setNearMissSubmitted(true); setShowNearMiss(false)
                        }}
                        className="font-body font-medium text-[11px] px-3 py-1.5 bg-warn/10 text-warn disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warn/20 transition-colors"
                      >
                        Submit — auto-CAPA created
                      </button>
                      <button onClick={() => setShowNearMiss(false)} className="font-body italic text-[11px] px-2 py-1 text-ghost">Cancel</button>
                    </div>
                  </div>
                )}
                {nearMissSubmitted && (
                  <div className="font-body italic text-ok text-[11px] slide-in">Near-miss logged · CAPA created · Assigned to Kowalski for review</div>
                )}
              </div>
            </>
          ) : (
            <EmptyLine name={activeLined.name} />
          )}
        </div>

        {/* COL 2: Crew + Startup */}
        <div className="w-[220px] flex-shrink-0 overflow-y-auto border-r border-rule2 bg-stone2">
          <div className="px-4 py-2 border-b border-rule2 bg-stone2 sticky top-0 z-10 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">
            {activeLined.name} context
          </div>
          {hasLiveData ? (
            <>
              {/* Crew */}
              <div className="border-b border-rule2">
                <div className="px-4 py-2 flex justify-between items-baseline">
                  <span className="font-body font-medium text-ink text-[12px]">Crew</span>
                  <span className="font-body italic text-ghost text-[10px]">18 workers</span>
                </div>
                {d.crew.map((m, i) => {
                  const haccp = HACCP_BY_STATION[m.role]
                  return (
                    <div key={i}>
                      <CrewRow m={m} />
                      {haccp && (
                        <div className="px-4 pb-2 font-body italic text-ghost text-[9px] leading-relaxed border-b border-rule last:border-b-0">
                          {haccp.station} · {haccp.ccp}: {haccp.limit}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Startup dial */}
              <div className="px-4 py-3">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-body font-medium text-ink text-[12px]">Startup sequence</span>
                  <span className="font-body italic text-ghost text-[10px]">{signedCount} of {CHECKLIST_TOTAL} · T+42</span>
                </div>
                <div className="flex justify-center mb-3">
                  <svg width="96" height="96" viewBox="0 0 96 96" aria-label={`${startupPct}% startup complete`}>
                    <circle cx="48" cy="48" r="38" fill="none" stroke="#D8D2C8" strokeWidth="8" />
                    <circle cx="48" cy="48" r="38" fill="none"
                      stroke={allergenSigned ? '#C4920A' : '#D94F2A'} strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - startupPct / 100)}
                      transform="rotate(-90 48 48)" strokeLinecap="butt"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                    <text x="48" y="44" textAnchor="middle"
                      style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fontSize:20, fill: allergenSigned ? '#100F0D' : '#D94F2A', letterSpacing:'-0.02em' }}>
                      {startupPct}%
                    </text>
                    <text x="48" y="58" textAnchor="middle"
                      style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:9, fill:'#78706A' }}>
                      {signedCount} of 11
                    </text>
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-2 h-2${allergenSigned ? 'bg-warn' : 'bg-danger'}`} />
                  <span className={`font-body italic text-[10px] font-medium ${allergenSigned ? 'text-warn' : 'text-danger'}`}>
                    {CHECKLIST_ITEMS.filter(it => !checklistSigned[it.key]).length} remaining
                  </span>
                </div>
                {CHECKLIST_ITEMS.map(item => {
                  const signed = checklistSigned[item.key]
                  const flag = flaggedItems[item.key]
                  const empResult = empSessionResults[item.key]
                  const showEmpForm = item.key === 'emp' && signed && !empResult
                  const showFlagForm = flagForm[item.key]
                  return (
                    <div key={item.key} className={`border-b border-rule last:border-b-0 ${item.isAllergen && !allergenSigned ? 'bg-danger/[0.04]' : flag ? 'bg-warn/[0.03]' : ''}`}>
                      <div className="flex items-center justify-between py-1.5">
                        <span className={`font-body italic text-[10px] flex-1 ${signed ? 'line-through text-ghost' : flag ? 'text-warn' : item.isAllergen && !allergenSigned ? 'text-danger font-medium' : 'text-ink2'}`}>
                          {item.label} · {item.operator}
                          {item.isAllergen && !allergenSigned && <span className="ml-1 text-[9px]">⚠ BLOCKING</span>}
                          {flag && <span className="ml-1 text-[9px] not-italic">⚑ flagged</span>}
                        </span>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          {!signed && !flag && (
                            <>
                              <button
                                onClick={() => setChecklistSigned(p => ({...p, [item.key]: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}))}
                                className={`font-body text-[9px] px-1.5 py-0.5 ${item.isAllergen ? 'bg-danger text-white hover:opacity-90' : 'bg-stone2 text-muted hover:bg-stone3'} transition-colors`}
                              >Sign</button>
                              <button
                                onClick={() => setFlagForm(p => ({...p, [item.key]: { reason:'', note:'' }}))}
                                className="font-body text-[9px] px-1.5 py-0.5 bg-warn/10 text-warn hover:bg-warn/20 transition-colors"
                              >Flag</button>
                            </>
                          )}
                          {signed && !empResult && item.key !== 'emp' && <span className="font-body italic text-ok text-[9px]">✓ {signed}</span>}
                          {signed && item.key === 'emp' && empResult && <span className="font-body italic text-ok text-[9px]">✓ {empResult.result === 'negative' ? 'Neg' : 'Pos'} · {signed}</span>}
                          {flag && <span className="font-body italic text-warn text-[9px]">⚑ {flag.reason}</span>}
                        </div>
                      </div>
                      {showEmpForm && (
                        <div className="pb-2 px-1 space-y-1.5 slide-in">
                          <div className="font-body italic text-ghost text-[9px] uppercase tracking-widest">Swab result required</div>
                          <div className="flex gap-2">
                            {['negative','positive'].map(r => (
                              <button key={r} onClick={() => setEmpForm(p => ({...p, [item.key]: {...p[item.key], result: r}}))}
                                className={`font-body font-medium text-[10px] px-2 py-1 transition-colors ${empForm[item.key]?.result === r ? (r === 'negative' ? 'bg-ok text-white' : 'bg-danger text-white') : 'bg-stone3 text-muted'}`}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </button>
                            ))}
                            {empForm[item.key]?.result === 'positive' && (
                              <input placeholder="CFU count" type="number"
                                value={empForm[item.key]?.cfu || ''}
                                onChange={e => setEmpForm(p => ({...p, [item.key]: {...p[item.key], cfu: e.target.value}}))}
                                className="w-20 font-body italic text-ink text-[10px] bg-stone border border-rule px-2 py-0.5" />
                            )}
                          </div>
                          {empForm[item.key]?.result && (
                            <button
                              onClick={() => {
                                const r = empForm[item.key]
                                setEmpSessionResults(p => ({...p, [item.key]: { result: r.result, cfu: r.cfu, time: checklistSigned[item.key] }}))
                                if (r.result === 'positive') setMaintenanceTickets(p => [...p, { id:`MT-EMP-${Date.now()}`, equipment:'Zone 1 — Sauce Dosing', issue:`Positive EMP swab${r.cfu ? ` · ${r.cfu} CFU` : ''} — deep clean required before next production run`, urgency:'danger', status:'open', requestedBy:'T. Osei', createdAt: checklistSigned[item.key] }])
                              }}
                              className="font-body font-medium text-[10px] px-2.5 py-1 bg-ok text-white hover:opacity-90 transition-opacity"
                            >Log result {empForm[item.key]?.result === 'positive' ? '— auto-CAPA created' : ''}</button>
                          )}
                        </div>
                      )}
                      {showFlagForm && !flag && (
                        <div className="pb-2 px-1 space-y-1.5 slide-in">
                          <select value={flagForm[item.key]?.reason || ''} onChange={e => setFlagForm(p => ({...p, [item.key]: {...p[item.key], reason: e.target.value}}))}
                            className="w-full font-body italic text-ink text-[10px] bg-stone border border-rule px-2 py-1 cursor-pointer">
                            <option value="">Reason for flag…</option>
                            <option>Equipment malfunction</option>
                            <option>Kit or supplies missing</option>
                            <option>Unsafe condition</option>
                            <option>Other</option>
                          </select>
                          <div className="flex gap-1.5">
                            <button disabled={!flagForm[item.key]?.reason}
                              onClick={() => {
                                const f = flagForm[item.key]
                                setFlaggedItems(p => ({...p, [item.key]: f}))
                                if (f.reason === 'Equipment malfunction') setMaintenanceTickets(p => [...p, { id:`MT-${Date.now()}`, equipment: item.label, issue: f.reason, urgency:'warn', status:'open', requestedBy: item.operator, createdAt: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) }])
                                setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })
                              }}
                              className="font-body font-medium text-[10px] px-2.5 py-1 bg-warn text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                              Flag item
                            </button>
                            <button onClick={() => setFlagForm(p => { const n = {...p}; delete n[item.key]; return n })} className="font-body italic text-[10px] text-ghost px-2">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyLine name={activeLined.name} />
          )}
        </div>

        {/* COL 3: Agent reasoning */}
        <div className="w-[220px] flex-shrink-0 overflow-y-auto bg-stone2">
          <div className="px-4 py-2 border-b border-rule2 bg-stone2 sticky top-0 z-10 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">
            Agent reasoning
          </div>
          {hasLiveData ? (
            <>
              <AgentTimeline timeline={d.agentTimeline} sparkline={d.sparkline} score={d.score} />
              {/* Confidence callout */}
              <div className="flex items-start gap-2 px-4 py-3 bg-warn/10 border-b border-rule2">
                <svg className="w-3.5 h-3.5 stroke-warn flex-shrink-0 mt-0.5" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="font-body italic text-ink2 text-[11px] leading-relaxed flex-1">
                  Score adjusted <strong className="text-warn font-semibold not-italic">84% → 61%</strong> — Oven B SCADA stale 3 days.
                </p>
                <span className="display-num text-lg text-warn flex-shrink-0">61%</span>
              </div>
              {/* Signal health */}
              <div className="px-4 py-2 border-b border-rule2 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">Signal sources</div>
              {d.signals.map((s, i) => (
                <div key={i}>
                  <SignalCard sig={s} />
                  {s.name === 'Oven B · SCADA' && (
                    <div className={`px-4 py-2 border-b border-rule2 ${skuContextReady ? 'bg-ok/5' : 'bg-stone3/50'}`}>
                      {skuContextReady
                        ? <div className="font-body italic text-ok text-[10px]">SKU context active — 182°F is normal for Pepperoni Classic (currently running). Alert fires if GF-Flatbread scheduled.</div>
                        : <div className="font-body italic text-ghost text-[10px]">SKU-specific thresholds <span className="text-brass">locked</span> — resolve Oven B context gap in Data Readiness to enable product-aware alerts.</div>
                      }
                    </div>
                  )}
                </div>
              ))}

              {/* Maintenance tickets */}
              {maintenanceTickets.length > 0 && (
                <>
                  <div className="px-4 py-2 border-b border-rule2 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">Maintenance tickets</div>
                  {maintenanceTickets.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 px-4 py-2.5 border-b border-rule2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.urgency === 'danger' ? 'bg-danger' : 'bg-warn'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-medium text-ink text-[11px] truncate">{t.equipment}</div>
                        <div className="font-body italic text-ghost text-[9px]">{t.issue}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-body italic font-medium text-[9px] px-1.5 py-px ${t.status === 'open' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>{t.status}</span>
                          <span className="font-body italic text-ghost text-[9px]">{t.createdAt} · {t.requestedBy}</span>
                        </div>
                      </div>
                      {t.status === 'open' && (
                        <button onClick={() => setMaintenanceTickets(p => p.map((x,j) => j===i ? {...x, status:'closed'} : x))}
                          className="font-body text-[9px] px-1.5 py-0.5 bg-stone3 text-muted hover:bg-ok/10 hover:text-ok transition-colors flex-shrink-0">Close</button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Predictive maintenance */}
              <div className="px-4 py-2 border-b border-rule2 font-body uppercase tracking-widest text-ghost text-[9px] font-medium">Predictive alert</div>
              <div className="px-4 py-3 border-b border-rule2 bg-warn/[0.04]">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 stroke-warn flex-shrink-0 mt-0.5" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <div className="font-body font-medium text-ink text-[12px]">Sensor A-7 — projected breach</div>
                    <div className="font-body italic text-warn text-[10px] mt-0.5">4 of 5 variance readings · Projected threshold breach: ~2 shifts at current trend</div>
                    <div className="font-body italic text-ghost text-[10px] mt-0.5">Pattern matches Apr 2 bearing failure 3 shifts before jam</div>
                  </div>
                </div>
                {predActioned
                  ? <div className="font-body italic text-ok text-[10px] slide-in">Inspection task created · Ticket MT-001 open · Alert fires at count 5</div>
                  : <div className="flex gap-1.5">
                      <button onClick={() => {
                        setPredActioned(true)
                        setMaintenanceTickets(p => [...p.filter(t => t.id !== 'MT-001'), { id:'MT-001', equipment:'Sensor A-7 · Conveyor Line 4', issue:'Micro-variance count 4/5 — bearing inspection before next shift', urgency:'warn', status:'open', requestedBy:'D. Kowalski', createdAt:'13:40' }])
                      }} className="font-body font-medium text-[10px] px-2.5 py-1 bg-warn/10 text-warn hover:bg-warn/20 transition-colors">Create inspection task</button>
                      <button onClick={() => setPredActioned(true)} className="font-body italic text-[10px] px-2 py-1 bg-stone3 text-muted">Alert at 5</button>
                    </div>
                }
              </div>
            </>
          ) : (
            <EmptyLine name={activeLined.name} />
          )}
        </div>

      </div>

      {/* Full-width secondary — 48hr forecast + pilot */}
      <div className="flex-shrink-0 border-t border-rule2 overflow-y-auto" style={{ maxHeight: '360px' }}>
        <div className="grid grid-cols-2 divide-x divide-rule2">

          {/* 48hr forecast */}
          <div>
            <SecHd tag="48-hour forecast" title="Upcoming shifts — readiness by line"
              icon={Clock} badge={<Urg level="warn">1 intervention required</Urg>} />
            {d.forecast.map((row, i) => (
              <ForecastRow key={i} row={row}
                onStaffingAction={(type) => setStaffingActioned(p => ({ ...p, [i]: type }))}
                staffingActioned={!!staffingActioned[i]} />
            ))}
          </div>

          {/* Pilot validation */}
          <div>
            <SecHd tag="Pilot validation" title="Prediction accuracy — Line 4"
              icon={FlaskConical} badge={<Urg level="ok">82% — expand recommended</Urg>} />
            {/* Gauge + stats */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-rule2">
              <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#D8D2C8" strokeWidth="8" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="#3A8A5A" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * 0.18}
                  transform="rotate(-90 40 40)" strokeLinecap="butt" />
                <text x="40" y="36" textAnchor="middle"
                  style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fontSize:16, fill:'#3A8A5A', letterSpacing:'-0.02em' }}>82%</text>
                <text x="40" y="50" textAnchor="middle"
                  style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:8, fill:'#78706A' }}>accuracy</text>
              </svg>
              <div className="flex-1">
                {d.pilotStats.map((s, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-rule last:border-b-0 font-body text-[11px]">
                    <span className="italic text-muted">{s.label}</span>
                    <span className={`display-num text-[13px] ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
              <Btn
                onClick={() => setPilotExpanded(true)}
                style={{ background:'#C17D2A', color:'#F5F0E8', alignSelf:'center', whiteSpace:'nowrap' }}
              >
                {pilotExpanded ? 'Expansion requested ✓' : 'Expand to all lines'}
              </Btn>
            </div>
            {pilotExpanded && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-rule2 font-body italic text-ok text-[11px] slide-in">
                <div className="w-1.5 h-1.5 rounded-full bg-ok flex-shrink-0" />
                Expansion request submitted — Lines 6, 3, and 2 will enter monitoring mode next shift cycle.
              </div>
            )}
            {/* Commit log */}
            <div className="flex flex-wrap gap-1 px-4 py-3">
              {d.pilotLog.map((status, i) => (
                <div key={i} className={`w-2.5 h-2.5${
                  status === 'ok' ? 'bg-ok' : status === 'miss' ? 'bg-danger' : status === 'part' ? 'bg-warn' : 'bg-rule2'
                }`} title={`Shift ${i + 1}: ${status}`} />
              ))}
              <div className="flex gap-3 ml-2 items-center">
                {[['ok','Correct'],['part','Partial'],['miss','Miss']].map(([s, l]) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2${s === 'ok' ? 'bg-ok' : s === 'part' ? 'bg-warn' : 'bg-danger'}`} />
                    <span className="font-body italic text-ghost text-[9px]">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
