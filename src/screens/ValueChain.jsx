import { useState } from 'react'
import { deliverySummary, orders, demandForecast, carbonBreakdown, skuVolatility } from '../data/delivery'
import { TrendingUp, TrendingDown, Leaf, Package, AlertTriangle, CheckCircle2 } from 'lucide-react'

const STATUS_CFG = {
  'scheduled':     { label: 'Scheduled',     dot: 'bg-ghost',  badge: 'bg-stone3 text-ghost border border-rule2' },
  'in-production': { label: 'In production', dot: 'bg-ochre',  badge: 'bg-ochre/10 text-ochre border border-ochre/30' },
  'finishing':     { label: 'Finishing',     dot: 'bg-warn',   badge: 'bg-warn/10 text-warn border border-warn/30' },
  'shipped':       { label: 'Shipped',       dot: 'bg-ok',     badge: 'bg-ok/10 text-ok border border-ok/30' },
}

function MiniDemandChart() {
  const W = 200, H = 64
  const hist = demandForecast.filter(d => d.actual !== null)
  const future = demandForecast.filter(d => d.actual === null)
  const all = demandForecast
  const maxVal = Math.max(...all.map(d => Math.max(d.forecast, d.actual ?? 0))) * 1.1
  const minVal = Math.min(...all.map(d => Math.min(d.forecast, d.actual ?? Infinity))) * 0.9
  const range = maxVal - minVal
  const n = all.length

  const x = (i) => (i / (n - 1)) * W
  const y = (v) => H - ((v - minVal) / range) * H

  const forecastPath = all.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.forecast).toFixed(1)}`).join(' ')
  const actualPath = hist.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.actual).toFixed(1)}`).join(' ')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* Forecast line (dashed) */}
      <path d={forecastPath} fill="none" stroke="#7B6E64" strokeWidth="1" strokeDasharray="3,2" />
      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="#C17D2A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Actual dots */}
      {hist.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.actual)} r="2" fill="#C17D2A" />
      ))}
    </svg>
  )
}

function OrderRow({ order, selected, onClick }) {
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.shipped
  const carbonOver = order.carbonPerUnit != null && order.carbonPerUnit > order.carbonTarget
  const leadOver = order.leadTimeDays != null && order.leadTimeDays > order.leadTimeTarget

  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-rule2 transition-colors ${
        selected ? 'bg-stone2 border-l-4 border-l-ochre' : 'hover:bg-stone2/50 border-l-4 border-l-transparent'
      }`}>
      <div className="flex items-start gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-body font-medium text-ink text-[10px]">{order.id}</span>
            {!order.onTrack && (
              <AlertTriangle size={8} className="text-warn flex-shrink-0" strokeWidth={2} />
            )}
          </div>
          <div className="font-body text-ghost text-[9px]">{order.customer} · {order.skuLabel}</div>
        </div>
        <span className={`font-body text-[8px] px-1.5 py-0.5 border flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="font-body text-ghost text-[9px]">Ship:</span>
          <span className={`font-body text-[9px] font-medium ${!order.onTrack && order.status !== 'shipped' ? 'text-warn' : 'text-ink'}`}>{order.targetShip}</span>
          {order.delayDays && <span className="font-body text-warn text-[9px]">+{order.delayDays}d late</span>}
        </div>
        {order.leadTimeDays != null && (
          <>
            <span className="text-rule2">·</span>
            <span className={`font-body text-[9px] tabular-nums ${leadOver ? 'text-warn' : 'text-ghost'}`}>{order.leadTimeDays}d lead</span>
          </>
        )}
        {order.carbonPerUnit != null && (
          <>
            <span className="text-rule2">·</span>
            <Leaf size={8} strokeWidth={2} className={carbonOver ? 'text-warn' : 'text-ok'} />
            <span className={`font-body text-[9px] tabular-nums ${carbonOver ? 'text-warn' : 'text-ok'}`}>{order.carbonPerUnit} kg</span>
          </>
        )}
      </div>
    </button>
  )
}

function OrderDetail({ order }) {
  if (!order) return (
    <div className="flex items-center justify-center h-full font-body text-ghost text-[11px]">
      Select an order
    </div>
  )
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.shipped
  const leadOver = order.leadTimeDays != null && order.leadTimeDays > order.leadTimeTarget
  const carbonOver = order.carbonPerUnit != null && order.carbonPerUnit > order.carbonTarget

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-body text-[9px] px-1.5 py-0.5 border ${cfg.badge}`}>{cfg.label}</span>
          {!order.onTrack && (
            <span className="flex items-center gap-1 font-body text-warn text-[9px]">
              <AlertTriangle size={9} strokeWidth={2} />
              {order.delayDays ? `${order.delayDays}d late` : 'At risk'}
            </span>
          )}
        </div>
        <div className="font-display font-bold text-ink text-[20px] leading-none mb-1">{order.id}</div>
        <div className="font-body text-ghost text-[12px]">{order.customer}</div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-px bg-rule2 border border-rule2">
        {[
          { label: 'SKU', val: order.skuLabel, tone: 'text-ink' },
          { label: 'Quantity', val: `${order.qty.toLocaleString()} units`, tone: 'text-ink' },
          { label: 'Target ship', val: order.targetShip, tone: !order.onTrack && order.status !== 'shipped' ? 'text-warn' : 'text-ink' },
          { label: 'Region', val: order.region, tone: 'text-muted' },
          {
            label: 'Lead time',
            val: order.leadTimeDays != null ? `${order.leadTimeDays}d vs ${order.leadTimeTarget}d target` : 'Not started',
            tone: leadOver ? 'text-warn' : 'text-ok',
          },
          {
            label: 'Carbon / unit',
            val: order.carbonPerUnit != null ? `${order.carbonPerUnit} kg CO₂e` : '—',
            tone: carbonOver ? 'text-warn' : order.carbonPerUnit != null ? 'text-ok' : 'text-ghost',
          },
        ].map(({ label, val, tone }) => (
          <div key={label} className="bg-stone px-3 py-2.5">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
            <div className={`font-body font-medium text-[11px] ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Carbon breakdown */}
      {order.carbonPerUnit != null && (
        <div>
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Carbon breakdown (site avg)</div>
          <div className="space-y-2">
            {carbonBreakdown.components.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="font-body text-ghost text-[10px] w-[140px] flex-shrink-0">{c.label}</div>
                <div className="flex-1 h-1 bg-rule2">
                  <div className={`h-full ${c.value > c.target ? 'bg-warn' : 'bg-ok'}`}
                    style={{ width: `${(c.value / carbonBreakdown.total) * 100}%` }} />
                </div>
                <span className={`font-body text-[10px] tabular-nums w-16 text-right ${c.value > c.target ? 'text-warn' : 'text-ok'}`}>
                  {c.value} kg
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-rule2">
            <span className="font-body text-ghost text-[10px]">Total vs target</span>
            <span className={`font-body font-medium text-[11px] ${carbonOver ? 'text-warn' : 'text-ok'}`}>
              {order.carbonPerUnit} vs {order.carbonTarget} kg CO₂e
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ValueChain() {
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders
  const selectedOrder = orders.find(o => o.id === selectedId)

  const otdOver = deliverySummary.otd < deliverySummary.otdTarget
  const leadOver = deliverySummary.avgLeadTime > deliverySummary.leadTimeTarget
  const carbonOver = deliverySummary.carbonPerUnit > deliverySummary.carbonTarget

  return (
    <div className="flex h-full overflow-hidden content-reveal">

      {/* Left: summary + demand */}
      <div className="w-[260px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
        <div className="flex-shrink-0 px-5 py-4 border-b border-rule2 bg-stone2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-0.5">Frontier Layer</div>
          <div className="font-display font-bold text-ink text-[18px] leading-none">Value Chain</div>
          <div className="font-body text-ghost text-[10px] mt-1">Supplier → Production → Customer</div>
        </div>

        {/* KPI strip */}
        <div className="flex-shrink-0 grid grid-cols-1 gap-px bg-rule2 border-b border-rule2">
          {[
            {
              label: 'On-time delivery',
              val: `${deliverySummary.otd}%`,
              sub: `Target ${deliverySummary.otdTarget}%`,
              tone: otdOver ? 'text-warn' : 'text-ok',
              icon: otdOver ? AlertTriangle : CheckCircle2,
            },
            {
              label: 'Avg lead time',
              val: `${deliverySummary.avgLeadTime} d`,
              sub: `Target ${deliverySummary.leadTimeTarget} d`,
              tone: leadOver ? 'text-warn' : 'text-ok',
              icon: Package,
            },
            {
              label: 'Carbon / unit',
              val: `${deliverySummary.carbonPerUnit} kg CO₂e`,
              sub: `Target ${deliverySummary.carbonTarget} kg`,
              tone: carbonOver ? 'text-warn' : 'text-ok',
              icon: Leaf,
            },
          ].map(({ label, val, sub, tone, icon: Icon }) => (
            <div key={label} className="bg-stone px-4 py-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={9} strokeWidth={2} className={tone} />
                <span className="font-body text-ghost text-[9px] uppercase tracking-widest">{label}</span>
              </div>
              <div className={`font-display font-bold display-num text-[20px] ${tone}`}>{val}</div>
              <div className="font-body text-ghost text-[9px]">{sub}</div>
            </div>
          ))}
        </div>

        {/* Demand chart */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-rule2">
          <div className="font-body text-ghost text-[9px] uppercase tracking-widest mb-2">Demand forecast vs actual</div>
          <MiniDemandChart />
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-px bg-ochre" />
              <span className="font-body text-ghost text-[8px]">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 border-t border-dashed border-ghost" />
              <span className="font-body text-ghost text-[8px]">Forecast</span>
            </div>
          </div>
        </div>

        {/* SKU volatility */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 border-b border-rule2 bg-stone2">
            <div className="font-body text-ghost text-[9px] uppercase tracking-widest">SKU demand trend</div>
          </div>
          {skuVolatility.map(s => (
            <div key={s.sku} className="flex items-center justify-between px-4 py-2.5 border-b border-rule2">
              <div>
                <div className="font-body text-ink text-[10px]">{s.label}</div>
                <div className="font-body text-ghost text-[9px]">{s.openOrders} open orders</div>
              </div>
              <div className={`flex items-center gap-1 ${s.trend === 'up' ? 'text-ok' : s.trend === 'down' ? 'text-warn' : 'text-ghost'}`}>
                {s.trend === 'up' ? <TrendingUp size={10} strokeWidth={2} /> : s.trend === 'down' ? <TrendingDown size={10} strokeWidth={2} /> : null}
                <span className="font-body font-medium text-[10px]">
                  {s.growthPct > 0 ? '+' : ''}{s.growthPct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: order pipeline */}
      <div className="w-[360px] flex-shrink-0 border-r border-rule2 flex flex-col">
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule2 bg-stone2 flex items-center justify-between">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">
            Orders · {filtered.length}
            {deliverySummary.lateOrders > 0 && (
              <span className="ml-2 text-warn">{deliverySummary.lateOrders} late</span>
            )}
          </span>
        </div>

        {/* Status filter */}
        <div className="flex-shrink-0 flex border-b border-rule2 bg-stone overflow-x-auto">
          <button type="button" onClick={() => setFilterStatus(null)}
            className={`px-3 py-2 font-body text-[9px] border-b-2 whitespace-nowrap transition-colors ${
              !filterStatus ? 'border-ochre text-ink' : 'border-transparent text-ghost hover:text-muted'
            }`}>All</button>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setFilterStatus(k)}
              className={`px-3 py-2 font-body text-[9px] border-b-2 whitespace-nowrap transition-colors ${
                filterStatus === k ? 'border-ochre text-ink' : 'border-transparent text-ghost hover:text-muted'
              }`}>{v.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(o => (
            <OrderRow key={o.id} order={o}
              selected={selectedId === o.id}
              onClick={() => setSelectedId(o.id)} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-rule2 bg-stone2">
          <div className="flex items-center justify-between">
            <span className="font-body text-ghost text-[9px]">{deliverySummary.openOrders} open orders</span>
            <span className="font-body text-ghost text-[9px]">{deliverySummary.fulfillmentRate}% fulfillment rate</span>
          </div>
        </div>
      </div>

      {/* Right: order detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone">
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-rule2 bg-stone2">
          <span className="font-body text-ghost text-[9px] uppercase tracking-widest">Order detail</span>
        </div>
        <OrderDetail order={selectedOrder} />
      </div>
    </div>
  )
}
