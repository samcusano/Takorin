import { useState, useRef } from 'react'
import { deliverySummary, orders, demandForecast, carbonBreakdown, skuVolatility } from '../data/delivery'
import { TrendingUp, TrendingDown, Leaf, Package, AlertTriangle, CheckCircle2, Truck, Clock, X } from 'lucide-react'
import { StatusPill, FilterDropdown } from '../components/UI'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  'scheduled':     { label: 'Scheduled',     dot: 'bg-muted',  tone: 'muted'   },
  'in-production': { label: 'In production', dot: 'bg-signal',  tone: 'signal'  },
  'finishing':     { label: 'Finishing',     dot: 'bg-warn',   tone: 'warn'    },
  'shipped':       { label: 'Shipped',       dot: 'bg-ok',     tone: 'ok'      },
}

const STATUS_OPTIONS = [
  { value: 'all',           label: 'All statuses'  },
  { value: 'scheduled',     label: 'Scheduled'     },
  { value: 'in-production', label: 'In production' },
  { value: 'finishing',     label: 'Finishing'     },
  { value: 'shipped',       label: 'Shipped'       },
]

// ─── Demand chart ─────────────────────────────────────────────────────────────

function DemandChart({ height = 76 }) {
  const all  = demandForecast
  const maxV = Math.max(...all.map(d => Math.max(d.forecast, d.actual ?? 0))) * 1.1
  const minV = Math.min(...all.map(d => Math.min(d.forecast, d.actual ?? Infinity))) * 0.9
  const range = maxV - minV || 1
  const n = all.length
  const W = 300, H = height, pad = 8
  const x = (i) => pad + (i / (n - 1)) * (W - pad * 2)
  const y = (v) => H - pad - ((v - minV) / range) * (H - pad * 2)
  const forecastPath = all.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.forecast).toFixed(1)}`).join(' ')
  const hist = all.filter(d => d.actual !== null)
  const actualPath = hist.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.actual).toFixed(1)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={forecastPath} fill="none" stroke="var(--color-muted)" strokeWidth="1" strokeDasharray="3,2" />
      <path d={actualPath}   fill="none" stroke="var(--color-signal)" strokeWidth="2" strokeLinecap="round" />
      {hist.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.actual)} r="2.5" fill="var(--color-signal)" />
      ))}
    </svg>
  )
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, selected, onClick }) {
  const cfg      = STATUS_CFG[order.status]
  const isLate   = !order.onTrack && order.status !== 'shipped'
  const leadOver = order.leadTimeDays != null && order.leadTimeDays > order.leadTimeTarget
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left border transition-colors border-l-[3px] ${
        selected
          ? 'bg-stone3 border-rule border-l-signal'
          : isLate
          ? 'bg-stone border-rule2 border-l-warn hover:bg-stone2'
          : 'bg-stone border-rule2 border-l-transparent hover:bg-stone2'
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <div className="font-body font-medium text-ink text-body leading-snug">{order.id}</div>
          <div className="font-body text-muted text-label truncate">{order.customer}</div>
          <div className="font-body text-muted text-label truncate">{order.skuLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
          {isLate && (
            <span className="flex items-center gap-1 font-body text-warn text-label">
              <AlertTriangle size={15} strokeWidth={2} />
              {order.delayDays ? `+${order.delayDays}d` : 'At risk'}
            </span>
          )}
        </div>
      </div>
      {/* Metadata */}
      <div className="flex items-center gap-4 px-4 pb-3 pt-2">
        <div className="flex items-center gap-1.5">
          <Truck size={15} strokeWidth={2} className={isLate ? 'text-warn flex-shrink-0' : 'text-muted flex-shrink-0'} />
          <span className={`font-body text-label tabular-nums ${isLate ? 'text-warn font-medium' : 'text-muted'}`}>
            {order.targetShip}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={15} strokeWidth={2} className={leadOver ? 'text-warn flex-shrink-0' : 'text-muted flex-shrink-0'} />
          <span className={`font-body text-label tabular-nums ${leadOver ? 'text-warn' : 'text-muted'}`}>
            {order.leadTimeDays != null
              ? <>{order.leadTimeDays}d<span className="opacity-50"> / {order.leadTimeTarget}d</span></>
              : '—'}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Overlay detail ───────────────────────────────────────────────────────────

function OrderOverlayDetail({ order, onClose }) {
  if (!order) return null
  const isLate   = !order.onTrack && order.status !== 'shipped'
  const leadOver = order.leadTimeDays != null && order.leadTimeDays > order.leadTimeTarget
  return (
    <div className="bg-stone2 border-l-[3px] border-l-signal border-b border-r border-rule2 slide-in">
      <div className="flex items-center justify-between px-5 py-3 border-b border-rule2">
        <div className="flex items-center gap-3">
          <span className="font-body font-medium text-ink text-body">{order.id}</span>
          <StatusPill tone={STATUS_CFG[order.status].tone}>{STATUS_CFG[order.status].label}</StatusPill>
          {isLate && (
            <span className="flex items-center gap-1 font-body text-warn text-label">
              <AlertTriangle size={15} strokeWidth={2} />
              +{order.delayDays}d late
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-muted hover:text-ink transition-colors">
          <X size={15} strokeWidth={2} />
        </button>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3">
        <div className="font-body text-muted text-label col-span-2">{order.customer} · {order.skuLabel}</div>
        {[
          ['Quantity',    `${order.qty.toLocaleString()} units`],
          ['Region',      order.region],
          ['Target ship', order.targetShip],
          ['Lead time',   order.leadTimeDays != null ? `${order.leadTimeDays}d vs ${order.leadTimeTarget}d target` : '—'],
          ['Carbon / unit', order.carbonPerUnit != null ? `${order.carbonPerUnit} kg CO₂e` : '—'],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="font-body text-label text-muted mb-0.5">{l}</div>
            <div className={`font-body text-label font-medium ${l === 'Lead time' && leadOver ? 'text-warn' : 'text-ink'}`}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ValueChain() {
  const [selectedId, setSelectedId]     = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [overlayTop, setOverlayTop]     = useState(null)
  const [overlayCol, setOverlayCol]     = useState(null)
  const rowRefs = useRef({})

  const lateOrders = orders.filter(o => !o.onTrack && o.status !== 'shipped')
  const filtered   = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)
  const selected   = orders.find(o => o.id === selectedId)
  const otdOver    = deliverySummary.otd < deliverySummary.otdTarget
  const leadOver   = deliverySummary.avgLeadTime > deliverySummary.leadTimeTarget
  const carbonOver = deliverySummary.carbonPerUnit > deliverySummary.carbonTarget

  // Rows of 2 for the overlay anchor pattern
  const rows = []
  for (let i = 0; i < filtered.length; i += 2) rows.push(filtered.slice(i, i + 2))

  const handleCardClick = (orderId, rowIdx, colIdx) => {
    if (orderId === selectedId) {
      setSelectedId(null); setOverlayTop(null); setOverlayCol(null)
      return
    }
    const rowEl = rowRefs.current[rowIdx]
    if (rowEl) setOverlayTop(rowEl.offsetTop + rowEl.offsetHeight)
    setOverlayCol(colIdx)
    setSelectedId(orderId)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden content-reveal">

      {/* ── Alert band — only renders when orders are off track ── */}
      {lateOrders.length > 0 && (
        <div className="flex-shrink-0 bg-warn/[0.04] border-b border-warn/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={15} strokeWidth={2} className="text-warn flex-shrink-0" />
              <span className="font-body font-medium text-warn text-label">
                {lateOrders.length} order{lateOrders.length !== 1 ? 's' : ''} off track
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lateOrders.map(o => {
                const idx    = filtered.findIndex(f => f.id === o.id)
                const rowIdx = Math.floor(idx / 2)
                const colIdx = idx % 2
                return (
                  <button key={o.id} type="button"
                    onClick={() => handleCardClick(o.id, rowIdx, colIdx)}
                    className={`flex items-center gap-2 px-3 py-1 border transition-colors font-body text-label ${
                      selectedId === o.id
                        ? 'border-warn bg-warn/10 text-warn'
                        : 'border-warn/30 text-warn hover:bg-warn/[0.06]'
                    }`}>
                    <span className="font-medium">{o.id}</span>
                    <span className="text-muted">{o.customer.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="font-medium">+{o.delayDays}d</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI dashboard + demand chart ── */}
      <div className="flex-shrink-0 flex items-stretch border-b border-rule2 bg-stone2">
        <div className="flex-1 grid grid-cols-3 divide-x divide-rule2">
          {[
            { label: 'On-time delivery', val: `${deliverySummary.otd}%`,             sub: `vs ${deliverySummary.otdTarget}% target`,       over: otdOver  },
            { label: 'Avg lead time',    val: `${deliverySummary.avgLeadTime}d`,      sub: `vs ${deliverySummary.leadTimeTarget}d target`,   over: leadOver },
            { label: 'Carbon / unit',    val: `${deliverySummary.carbonPerUnit} kg`,  sub: `vs ${deliverySummary.carbonTarget} kg target`,   over: carbonOver },
          ].map(({ label, val, sub, over }) => (
            <div key={label} className="px-5 py-3.5">
              <div className="font-body text-label text-muted mb-1">{label}</div>
              <div className={`display-num text-head font-bold tabular-nums leading-none ${over ? 'text-warn' : 'text-ok'}`}>{val}</div>
              <div className={`font-body text-label mt-1 ${over ? 'text-warn' : 'text-muted'}`}>{sub}</div>
            </div>
          ))}
        </div>
        <div className="w-[340px] flex-shrink-0 border-l border-rule2 px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-body text-label text-muted">Demand forecast vs actual</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-[1.5px] bg-signal" />
                <span className="font-body text-label text-muted">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 border-t border-dashed border-muted" />
                <span className="font-body text-label text-muted">Forecast</span>
              </div>
            </div>
          </div>
          <DemandChart height={76} />
        </div>
      </div>

      {/* ── Filter bar + card grid ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* FilterDropdown — same pill style as Agent/Tier/Priority in Agents */}
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-rule2 bg-stone">
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={v => { setFilterStatus(v); setSelectedId(null); setOverlayTop(null) }}
          />
          <span className="ml-auto font-body text-label text-muted">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''} · {deliverySummary.fulfillmentRate}% fulfillment
          </span>
        </div>

        {/* Card grid with card-width overlay on click */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative p-4">
            {rows.map((rowCards, rowIdx) => (
              <div key={rowIdx} ref={el => { rowRefs.current[rowIdx] = el }} className="mb-3">
                <div className="grid grid-cols-2 gap-3">
                  {rowCards.map((o, colIdx) => (
                    <OrderCard key={o.id} order={o}
                      selected={selectedId === o.id}
                      onClick={() => handleCardClick(o.id, rowIdx, colIdx)} />
                  ))}
                  {rowCards.length === 1 && <div />}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-24 font-body text-muted text-label">
                No orders in this status
              </div>
            )}

            {/* Card-width overlay — anchored below the clicked card's column */}
            {selected && overlayTop !== null && overlayCol !== null && (
              <div
                className="absolute z-10 slide-in"
                style={{
                  top:   overlayTop,
                  left:  overlayCol === 0 ? 0 : 'calc(50% + 6px)',
                  right: overlayCol === 1 ? 0 : 'calc(50% + 6px)',
                }}>
                <OrderOverlayDetail
                  order={selected}
                  onClose={() => { setSelectedId(null); setOverlayTop(null); setOverlayCol(null) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
