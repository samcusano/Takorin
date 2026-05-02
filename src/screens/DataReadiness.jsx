import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { readinessData } from '../data'
import { useAppState } from '../context/AppState'
import { Urg, StatCell, SP, SecHd, Btn, Layout, ActionBanner } from '../components/UI'

function SourceRow({ s }) {
  const c = s.tone === 'ok' ? '#3A8A5A' : s.tone === 'danger' ? '#D94F2A' : '#C4920A'
  const circ = 2 * Math.PI * 14
  return (
    <div className={`grid border-b border-rule2 last:border-b-0 hover:bg-stone2 transition-colors ${
      s.tone === 'danger' ? 'bg-danger/[0.03]' : s.tone === 'warn' ? 'bg-warn/[0.02]' : ''
    }`} style={{ gridTemplateColumns:'1fr 80px 80px 80px 120px' }}>
      <div className="px-4 py-3">
        <div className="font-body font-medium text-ink text-[13px]">{s.name}</div>
        <div className="font-body italic text-ghost text-[11px]">{s.sub}</div>
      </div>
      {/* Score with mini ring */}
      <div className="flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#D8D2C8" strokeWidth="3.5" />
          <circle cx="16" cy="16" r="12" fill="none" stroke={c} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={circ - (s.score / 100) * circ}
            transform="rotate(-90 16 16)" strokeLinecap="butt" />
          <text x="16" y="20" textAnchor="middle"
            style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fontSize:9, fill:c }}>
            {s.score}
          </text>
        </svg>
      </div>
      {/* Freshness */}
      <div className="flex items-center px-2">
        <span className={`font-body italic text-[11px] ${s.tone === 'danger' ? 'text-danger' : 'text-ghost'}`}>{s.freshness}</span>
      </div>
      {/* Consistency */}
      <div className="flex flex-col justify-center px-2 gap-1">
        <div className="h-px bg-rule2"><div className="h-full" style={{ width:s.consistency+'%', background:c }} /></div>
        <span className={`font-body italic text-[10px] ${s.tone==='ok'?'text-ghost':s.tone==='danger'?'text-danger':'text-warn'}`}>{s.consistency}%</span>
      </div>
      {/* Status */}
      <div className="flex items-center justify-center">
        <span className={`font-body italic font-medium text-[10px] px-2 py-0.5 ${
          s.tone === 'ok' ? 'bg-ok/10 text-ok' : s.tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'
        }`}>{s.status}</span>
      </div>
    </div>
  )
}

export default function DataReadiness() {
  const { readinessScore: score, setReadinessScore: setScore,
          readinessResolved: resolved, setReadinessResolved: setResolved } = useAppState()
  const [showConsequence, setShowConsequence] = useState(false)
  const [exportState, setExportState] = useState('idle')
  const location = useLocation()
  const highlightKey = location.state?.highlight

  const handleExport = () => {
    setExportState('loading')
    setTimeout(() => setExportState('done'), 1500)
  }

  useEffect(() => {
    if (highlightKey) {
      const el = document.getElementById(highlightKey)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightKey])

  const resolveItem = (key, points) => {
    if (resolved[key]) return
    setResolved(p => ({ ...p, [key]: true }))
    setScore(s => Math.min(100, s + points))
    setShowConsequence(true)
  }

  const supplierIQConf =
    resolved['conflict-0'] && resolved['conflict-1'] ? 84 :
    resolved['conflict-0'] ? 71 : 58
  const shiftIQConf = resolved['ctx-0'] ? 75 : 61

  const moduleRows = [
    { n:'ShiftIQ',     s:'Risk score · Interventions', v: shiftIQConf,   c: shiftIQConf >= 75 ? 'text-ok' : 'text-warn' },
    { n:'HandoffIQ',   s:'Workforce · Certs',          v: 91,            c: 'text-ok' },
    { n:'SupplierIQ',  s:'COA · Lot traceability',     v: supplierIQConf, c: supplierIQConf >= 75 ? 'text-ok' : 'text-warn' },
    { n:'CAPA Engine', s:'Root cause · Evidence',      v: 88,            c: 'text-ok' },
  ]

  const side = (
    <>
      {/* Readiness by module */}
      <SP title="Readiness by module" sub="How each product is affected">
        {moduleRows.map((r,i)=>(
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-rule last:border-b-0">
            <div>
              <div className="font-body font-medium text-ink text-[12px]">{r.n}</div>
              <div className="font-body italic text-ghost text-[10px]">{r.s}</div>
            </div>
            <div className="text-right">
              <div className={`display-num text-base ${r.c}`}>{r.v}%</div>
              <div className="font-body italic text-ghost text-[9px]">confidence</div>
            </div>
          </div>
        ))}
        <div className="px-4 py-2 font-body italic text-ghost text-[10px]">
          {supplierIQConf < 84
            ? `SupplierIQ at ${supplierIQConf}% — resolving naming conflicts raises it to ~84%.`
            : 'SupplierIQ restored to 84% — naming conflicts resolved.'}
        </div>
      </SP>

      {/* Unlocks at 90+ */}
      <SP title="What happens at 90+" sub="Readiness unlocks">
        {readinessData.unlocks.map((u, i) => (
          <div key={i} className="flex gap-2 px-4 py-3 border-b border-rule last:border-b-0">
            <svg className="w-3.5 h-3.5 stroke-ok flex-shrink-0 mt-0.5" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <div className="font-body font-medium text-ink text-[12px]">{u.title}</div>
              <div className="font-body italic text-ghost text-[10px] mt-0.5">{u.sub}</div>
            </div>
          </div>
        ))}
      </SP>

      {/* Industry context */}
      <SP title="Industry context" sub="Why this matters">
        <div className="px-4 py-3 space-y-3">
          <blockquote className="font-body italic text-ink2 text-[12px] leading-relaxed border-l-2 border-ochre pl-3">
            "AI fails not because the algorithms are wrong but because the data is incoherent. The prerequisite is data that speaks the same language."
          </blockquote>
          <div className="font-body italic text-ghost text-[10px]">— Chao Yi, Food Engineering · April 2026</div>
          <div className="h-px bg-rule2" />
          <div className="font-body italic text-muted text-[11px] leading-relaxed">
            36% of CPG manufacturers cite lack of contextualized operational data as their primary AI barrier.
          </div>
          <div className="font-body italic text-ghost text-[10px]">— Schneider Electric CPG AI Survey, 2026</div>
        </div>
      </SP>
    </>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ActionBanner
        color="#C17D2A"
        headline="Data readiness: 3 issues lowering recommendation confidence"
        body="2 naming conflicts and 1 missing context mapping are preventing cross-plant risk correlation"
      >
        <Btn variant="ghost" onClick={handleExport} disabled={exportState === 'loading'}>
          {exportState === 'loading' ? 'Preparing…' : exportState === 'done' ? 'Exported ✓' : 'Export readiness report'}
        </Btn>
      </ActionBanner>

      {/* Hero + stat bar */}
      <div className="flex border-b border-rule2 bg-stone2 flex-shrink-0">
        {/* Score gauge — state label primary */}
        <div className="flex flex-col justify-center px-6 py-4 border-r border-rule2 flex-shrink-0 w-[220px]">
          <div className="font-body font-medium uppercase tracking-widest text-[10px] mb-1"
            style={{ color: score >= 75 ? '#3A8A5A' : score >= 50 ? '#C4920A' : '#D94F2A' }}>
            {score >= 75 ? 'Ready' : score >= 50 ? 'Degraded' : 'Not ready'}
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="display-num text-[28px]" style={{ color: score >= 75 ? '#3A8A5A' : score >= 50 ? '#C4920A' : '#D94F2A' }}>{score}</span>
            <span style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:13, color:'#A8A098' }}>/100</span>
          </div>
          {/* Gauge bar */}
          <div className="relative mb-2" style={{ height: 8 }}>
            {/* Background: segmented zones */}
            <div className="absolute inset-0 flex">
              <div style={{ width:'50%', background:'#D94F2A', opacity:0.2 }} />
              <div style={{ width:'25%', background:'#C4920A', opacity:0.2 }} />
              <div style={{ width:'25%', background:'#3A8A5A', opacity:0.2 }} />
            </div>
            {/* Filled bar */}
            <div className="absolute inset-y-0 left-0 transition-all duration-1000"
              style={{ width: score + '%', background: score >= 75 ? '#3A8A5A' : score >= 50 ? '#C4920A' : '#D94F2A' }} />
            {/* Thumb marker */}
            <div className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[14px] transition-all duration-1000"
              style={{ left: score + '%', background: score >= 75 ? '#3A8A5A' : score >= 50 ? '#C4920A' : '#D94F2A' }} />
          </div>
          {/* Zone labels */}
          <div className="flex font-body italic text-ghost text-[9px]">
            <span style={{ width:'50%' }}>0 – 49</span>
            <span style={{ width:'25%' }}>50 – 74</span>
            <span style={{ width:'25%', textAlign:'right' }}>75+</span>
          </div>
          <div className="font-body italic text-ghost text-[10px] mt-2">Overall readiness</div>
        </div>
        {/* Quick stats */}
        <div className="flex flex-1">
          {readinessData.stats.slice(1).map((s, i) => <StatCell key={i} {...s} />)}
        </div>
      </div>

      {showConsequence && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-ok/10 border-b border-ok/20 font-body italic text-ok text-[11px] slide-in flex-shrink-0">
          <svg className="w-3 h-3 stroke-ok flex-shrink-0" fill="none" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Score updated to {score}/100. Recommendation confidence rising across all modules.
        </div>
      )}

      <Layout side={side}>
        {/* Source health table */}
        <SecHd tag="Source health" title="All connected data sources — completeness, freshness, naming consistency"
          badge={<Urg level="warn">2 sources degraded</Urg>} />
        {/* Header row */}
        <div className="grid border-b border-rule2 bg-stone2" style={{ gridTemplateColumns:'1fr 80px 80px 80px 120px' }}>
          {['Source','Readiness','Freshness','Consistency','Status'].map(h => (
            <div key={h} className="px-4 py-2 font-body italic text-ghost text-[10px]">{h}</div>
          ))}
        </div>
        {readinessData.sources.map((s, i) => <SourceRow key={i} s={s} />)}

        {/* Naming conflicts */}
        <div className="border-t border-rule2">
          <SecHd tag="Naming conflicts" title="Same ingredient, different names — Takorin cannot correlate risk across plants"
            badge={<Urg level="warn">2 active conflicts</Urg>} />
          <div className="px-4 py-3 space-y-3">
            {readinessData.conflicts.map((c, i) => (
              <div key={i} id={`conflict-${i}`} className={`border-l-2 border-l-warn pl-3 pr-3 py-3 bg-stone2 ${resolved[`conflict-${i}`] ? 'opacity-60' : ''} ${highlightKey === `conflict-${i}` ? 'ring-2 ring-ochre ring-offset-1' : ''}`}>
                <div className="font-display font-bold italic text-warn text-[14px] mb-2">{c.title}</div>
                <div className="font-body italic text-ink2 text-[12px] leading-relaxed mb-3">{c.desc}</div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {c.variants.map((v, j) => (
                    <span key={j} className={`font-body font-medium text-[11px] px-2 py-1 ${j === 0 ? 'bg-stone3 text-ink2' : 'bg-warn/10 text-warn'}`}>{v}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Btn
                    style={{ background:'#C17D2A', color:'#F5F0E8' }}
                    disabled={resolved[`conflict-${i}`]}
                    onClick={() => resolveItem(`conflict-${i}`, c.points)}>
                    {resolved[`conflict-${i}`] ? 'Canonical name set ✓' : 'Set canonical name'}
                  </Btn>
                  <Btn variant="muted">View affected records</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Context gaps */}
        <div className="border-t border-rule2">
          <SecHd tag="Context gaps" title="Sensor readings without product context — a number without meaning"
            badge={<Urg level="critical">1 critical gap</Urg>} />
          <div className="px-4 py-3 space-y-3">
            <div className="flex gap-3 py-3 border-b border-rule">
              <div className="w-7 h-7 rounded-full bg-warn/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 stroke-warn" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-body font-medium text-ink text-[12px] mb-1">Oven Station B — no SKU-to-temperature profile mapping</div>
                <div className="font-body italic text-ink2 text-[12px] leading-relaxed mb-2">
                  Oven B reports temperature continuously. A reading of 182°F is normal for Pepperoni Classic but a HACCP critical limit breach for the gluten-free flatbread line — both run on Oven B. Without this context, the risk model cannot evaluate whether a reading is safe or dangerous.
                </div>
                <div className="font-body italic text-danger text-[11px] mb-3">
                  Impact: Both false positives and false negatives are possible.
                </div>
                <Btn
                  style={{ background:'#C17D2A', color:'#F5F0E8' }}
                  disabled={resolved['ctx-0']}
                  onClick={() => resolveItem('ctx-0', 12)}>
                  {resolved['ctx-0'] ? 'Profile added ✓' : 'Add SKU profiles'}
                </Btn>
              </div>
            </div>
            {/* Resolved items */}
            {[{t:'Sauce Dosing Station — product context mapped',s:'Flow rate targets mapped to 4 active SKUs.'},{t:'Freeze tunnel — temperature thresholds mapped per SKU',s:'All active SKUs covered.'}].map((item,i)=>(
              <div key={i} className="flex gap-3 py-3 border-b border-rule last:border-b-0">
                <div className="w-7 h-7 rounded-full bg-ok/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 stroke-ok" fill="none" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div className="font-body font-medium text-ok text-[12px]">{item.t}</div>
                  <div className="font-body italic text-ghost text-[11px] mt-0.5">{item.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution roadmap */}
        <div className="border-t border-rule2">
          <SecHd tag="Resolution roadmap" title="Three steps to full data readiness" />
          <div className="px-4 py-3 space-y-4">
            {readinessData.steps.map((step, i) => (
              <div key={i} className="flex gap-3 pb-4 border-b border-rule last:border-b-0">
                <div className="font-display font-light italic text-3xl text-ghost flex-shrink-0 leading-none">{step.num}</div>
                <div>
                  <div className="font-display font-bold italic text-ink text-[14px] mb-1 leading-snug">{step.title}</div>
                  <div className="font-body italic text-ink2 text-[12px] leading-relaxed mb-2">{step.desc}</div>
                  <div className="flex items-center gap-1.5 font-body italic text-brass text-[10px]">
                    <svg className="w-3 h-3 stroke-brass" fill="none" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {step.effort}
                  </div>
                </div>
              </div>
            ))}
            <div className="font-body italic text-muted text-[11px] pt-1">
              After completing steps 1–3, estimated readiness score:{' '}
              <strong className="text-ok not-italic font-semibold">91/100</strong>.
              Recommendation confidence rises from 61% to ~88%.
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}
