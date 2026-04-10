import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices, calcInvoiceTotals, calcLineItemTotal, calcStyleTotal, calcStyleQty } from '../utils/storage'

function fmt(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtFull(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)
}
function pct(n) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MetricCard({ label, value, sub, subColor, accent, icon, trend }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '22' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" className="w-5 h-5">{icon}</svg>
        </div>
        {trend != null && (
          <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{
            background: trend >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)',
            color: trend >= 0 ? '#22c55e' : '#f43f5e'
          }}>
            {pct(trend)}
          </span>
        )}
      </div>
      <div className="text-xs font-medium mb-1" style={{ color: '#6b9e7a' }}>{label}</div>
      <div className="text-2xl font-bold leading-tight mb-1" style={{ color: '#fff' }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: subColor || '#4d7a5e' }}>{sub}</div>}
    </div>
  )
}

function BarChart({ months }) {
  const [hovered, setHovered] = useState(null)
  const maxVal = Math.max(...months.map(m => m.value), 1)
  const chartH = 150
  const barW = 38
  const gap = 10
  const padLeft = 55
  const padBottom = 28
  const totalW = padLeft + months.length * (barW + gap) + 10

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + padBottom + 20}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Y axis grid lines & labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = 10 + chartH * (1 - f)
        const val = maxVal * f
        return (
          <g key={f}>
            <line x1={padLeft - 5} x2={totalW - 10} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray={f === 0 ? '0' : '3,3'} />
            <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
              {val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val.toFixed(0)}`}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {months.map((m, i) => {
        const barH = Math.max((m.value / maxVal) * chartH, m.value > 0 ? 4 : 0)
        const x = padLeft + i * (barW + gap)
        const y = 10 + chartH - barH
        const isHov = hovered === i
        const fill = m.current ? '#22c55e' : isHov ? '#4ade80' : '#86efac'
        return (
          <g key={m.label} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <rect x={x} y={y} width={barW} height={barH} rx="5" fill={fill} style={{ transition: 'fill 0.1s' }} />
            {isHov && m.value > 0 && (
              <g>
                <rect x={x - 10} y={y - 28} width={barW + 20} height={20} rx="4" fill="#1f2937" />
                <text x={x + barW/2} y={y - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">
                  {fmt(m.value)}
                </text>
              </g>
            )}
            <text x={x + barW/2} y={chartH + padBottom + 8} textAnchor="middle" fontSize="9"
              fill={m.current ? '#374151' : '#9ca3af'}
              fontWeight={m.current ? '700' : '400'}>
              {m.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ProgressBar({ label, value, max, total, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium truncate max-w-[55%]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">{total != null ? `${total} inv.` : ''}</span>
          <span className="font-semibold text-gray-900">{fmtFull(value)}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color || '#22c55e' }} />
      </div>
    </div>
  )
}

export default function Reports() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])

  useEffect(() => { getInvoices().then(setInvoices) }, [])

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const analytics = useMemo(() => {
    if (!invoices.length) return null

    // Monthly revenue (last 12 months rolling)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth(), value: 0, label: MONTH_LABELS[d.getMonth()], current: i === 11 }
    })
    for (const inv of invoices) {
      if (!inv.invoiceDate) continue
      const d = new Date(inv.invoiceDate + 'T00:00:00')
      const idx = monthlyRevenue.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth())
      if (idx !== -1) monthlyRevenue[idx].value += calcInvoiceTotals(inv).total
    }

    // This month vs last month
    const thisMoRevenue = monthlyRevenue[11].value
    const lastMoRevenue = monthlyRevenue[10].value
    const moTrend = lastMoRevenue > 0 ? ((thisMoRevenue - lastMoRevenue) / lastMoRevenue * 100) : null

    // This year totals
    const thisYearInvs = invoices.filter(inv => inv.invoiceDate?.startsWith(String(thisYear)))
    const thisYearRevenue = thisYearInvs.reduce((s, inv) => s + calcInvoiceTotals(inv).total, 0)
    const lastYearInvs = invoices.filter(inv => inv.invoiceDate?.startsWith(String(thisYear - 1)))
    const lastYearRevenue = lastYearInvs.reduce((s, inv) => s + calcInvoiceTotals(inv).total, 0)
    const yearTrend = lastYearRevenue > 0 ? ((thisYearRevenue - lastYearRevenue) / lastYearRevenue * 100) : null

    // Overall totals
    const totalRevenue = invoices.reduce((s, inv) => s + calcInvoiceTotals(inv).total, 0)
    const totalOutstanding = invoices.reduce((s, inv) => {
      const { balance } = calcInvoiceTotals(inv)
      return s + (balance > 0 ? balance : 0)
    }, 0)
    const totalPaid = invoices.reduce((s, inv) => s + calcInvoiceTotals(inv).paid, 0)
    const avgInvoice = invoices.length > 0 ? totalRevenue / invoices.length : 0
    const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue * 100) : 0

    // Top customers by revenue
    const byCustomer = {}
    for (const inv of invoices) {
      const key = inv.customer?.company || 'Unknown'
      if (!byCustomer[key]) byCustomer[key] = { name: key, revenue: 0, count: 0 }
      byCustomer[key].revenue += calcInvoiceTotals(inv).total
      byCustomer[key].count++
    }
    const topCustomers = Object.values(byCustomer).sort((a, b) => b.revenue - a.revenue).slice(0, 7)

    // Product type breakdown
    const byType = {}
    for (const inv of invoices) {
      for (const item of inv.lineItems) {
        const type = item.productType || 'Other'
        if (!byType[type]) byType[type] = { type, revenue: 0, count: 0 }
        byType[type].revenue += calcLineItemTotal(item)
        byType[type].count++
      }
    }
    const productTypes = Object.values(byType).sort((a, b) => b.revenue - a.revenue)

    // Status breakdown
    const statusCounts = { paid: 0, partial: 0, unpaid: 0 }
    invoices.forEach(inv => { statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1 })

    // Invoice profit (only for invoices with cost data)
    let totalCost = 0, costInvoices = 0
    for (const inv of invoices) {
      let invCost = 0
      for (const item of inv.lineItems) {
        const itemQty = item.styles.reduce((s, st) => s + calcStyleQty(st), 0)
        invCost += item.styles.reduce((s, st) => s + Object.values(st.sizes).reduce((a, sz) => a + (sz.qty||0)*(sz.cost||0), 0), 0)
        invCost += (item.locations||[]).filter(l=>l.type).reduce((s,l) => s + (parseFloat(l.cost)||0), 0) * itemQty
      }
      if (invCost > 0) { totalCost += invCost; costInvoices++ }
    }
    const costRevenue = costInvoices > 0 ? invoices
      .filter(inv => {
        for (const item of inv.lineItems) {
          const hasCost = item.styles.some(st => Object.values(st.sizes).some(sz => sz.cost > 0))
          if (hasCost) return true
        }
        return false
      })
      .reduce((s, inv) => s + calcInvoiceTotals(inv).total, 0) : 0
    const totalProfit = costRevenue - totalCost
    const avgMargin = costRevenue > 0 ? (totalProfit / costRevenue * 100) : null

    return {
      monthlyRevenue, thisMoRevenue, lastMoRevenue, moTrend,
      thisYearRevenue, yearTrend, totalRevenue, totalOutstanding,
      totalPaid, avgInvoice, collectionRate,
      topCustomers, productTypes, statusCounts,
      totalCost, totalProfit, avgMargin, costInvoices,
    }
  }, [invoices])

  const topRevenueForBar = analytics ? Math.max(...analytics.topCustomers.map(c => c.revenue), 1) : 1
  const topProductForBar = analytics ? Math.max(...analytics.productTypes.map(p => p.revenue), 1) : 1

  const TYPE_COLORS = ['#22c55e','#3b82f6','#f97316','#a855f7','#06b6d4','#f43f5e','#84cc16']

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f4' }}>
      {/* Header */}
      <header style={{ background: '#0f1f1a' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/logo.svg" alt="Custom Promotions" style={{ height: '28px', width: 'auto' }} />
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#6b9e7a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b9e7a'}
              >Invoices</button>
              <button
                onClick={() => navigate('/customers')}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#6b9e7a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b9e7a'}
              >Customers</button>
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >Reports</button>
            </div>
          </div>
        </div>

        {/* Hero cards */}
        {analytics && (
          <div className="max-w-7xl mx-auto px-6 pb-6 pt-2 grid grid-cols-4 gap-4">
            <MetricCard
              label="Total Revenue (incl. GST)"
              value={fmt(analytics.totalRevenue)}
              sub={`${invoices.length} invoices all-time`}
              accent="#22c55e"
              trend={analytics.yearTrend}
              icon={<path strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>}
            />
            <MetricCard
              label="This Month"
              value={fmt(analytics.thisMoRevenue)}
              sub={analytics.lastMoRevenue > 0 ? `vs ${fmt(analytics.lastMoRevenue)} last month` : 'No prior month data'}
              accent="#3b82f6"
              trend={analytics.moTrend}
              icon={<path strokeLinecap="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>}
            />
            <MetricCard
              label="Collection Rate"
              value={`${analytics.collectionRate.toFixed(1)}%`}
              sub={`${fmt(analytics.totalOutstanding)} outstanding`}
              subColor={analytics.totalOutstanding > 0 ? '#f97316' : '#4d7a5e'}
              accent="#f97316"
              icon={<path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
            />
            <MetricCard
              label="Avg Invoice Value"
              value={fmtFull(analytics.avgInvoice)}
              sub={`Across ${invoices.length} invoices`}
              accent="#a855f7"
              icon={<path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>}
            />
          </div>
        )}
      </header>

      {!analytics ? (
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-400">No invoice data yet. Create some invoices to see analytics.</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Monthly Revenue</h2>
                <p className="text-sm text-gray-400 mt-0.5">Rolling 12 months (incl. GST)</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">This year</div>
                <div className="font-bold text-lg text-gray-900">{fmt(analytics.thisYearRevenue)}</div>
              </div>
            </div>
            <div className="px-6 py-4">
              <BarChart months={analytics.monthlyRevenue} />
            </div>
          </div>

          {/* Customers + Product Types */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Customers */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Top Customers</h2>
                <p className="text-sm text-gray-400 mt-0.5">By total invoiced (incl. GST)</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {analytics.topCustomers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No customer data yet</p>
                ) : analytics.topCustomers.map((c, i) => (
                  <ProgressBar
                    key={c.name}
                    label={c.name}
                    value={c.revenue}
                    max={analytics.topCustomers[0].revenue}
                    total={c.count}
                    color={i === 0 ? '#22c55e' : i === 1 ? '#4ade80' : '#86efac'}
                  />
                ))}
              </div>
            </div>

            {/* Product Type Breakdown */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Revenue by Product Type</h2>
                <p className="text-sm text-gray-400 mt-0.5">Across all line items</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {analytics.productTypes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No line item data yet</p>
                ) : analytics.productTypes.map((p, i) => (
                  <ProgressBar
                    key={p.type}
                    label={p.type}
                    value={p.revenue}
                    max={analytics.productTypes[0].revenue}
                    total={p.count}
                    color={TYPE_COLORS[i % TYPE_COLORS.length]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Invoice Status + Margin (if available) */}
          <div className={`grid gap-6 ${analytics.avgMargin != null ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Invoice Status Breakdown */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Invoice Status</h2>
                <p className="text-sm text-gray-400 mt-0.5">{invoices.length} total invoices</p>
              </div>
              <div className="px-6 py-5 grid grid-cols-3 gap-4">
                {[
                  { label: 'Paid', key: 'paid', color: '#22c55e', bg: '#dcfce7', text: '#16a34a' },
                  { label: 'Partial', key: 'partial', color: '#f97316', bg: '#ffedd5', text: '#ea580c' },
                  { label: 'Unpaid', key: 'unpaid', color: '#f43f5e', bg: '#ffe4e6', text: '#e11d48' },
                ].map(s => {
                  const count = analytics.statusCounts[s.key] || 0
                  const pctVal = invoices.length > 0 ? (count / invoices.length * 100) : 0
                  return (
                    <div key={s.key} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{count}</div>
                      <div className="text-sm font-semibold mb-1" style={{ color: s.text }}>{s.label}</div>
                      <div className="text-xs font-medium" style={{ color: s.text, opacity: 0.7 }}>{pctVal.toFixed(0)}% of total</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Profit Margin (if cost data available) */}
            {analytics.avgMargin != null && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Profit Analysis</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Based on {analytics.costInvoices} invoices with cost data</p>
                </div>
                <div className="px-6 py-5 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Revenue', value: fmtFull(analytics.totalRevenue), color: '#22c55e', bg: '#dcfce7', text: '#16a34a' },
                    { label: 'Total Cost', value: fmtFull(analytics.totalCost), color: '#f97316', bg: '#ffedd5', text: '#ea580c' },
                    {
                      label: 'Total Profit', value: fmtFull(analytics.totalProfit),
                      color: analytics.totalProfit >= 0 ? '#22c55e' : '#f43f5e',
                      bg: analytics.totalProfit >= 0 ? '#dcfce7' : '#ffe4e6',
                      text: analytics.totalProfit >= 0 ? '#16a34a' : '#e11d48'
                    },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                      <div className="text-xl font-bold mb-1 leading-tight" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-5">
                  <div className="rounded-xl p-4 text-center" style={{ background: analytics.avgMargin >= 40 ? '#dcfce7' : analytics.avgMargin >= 20 ? '#ffedd5' : '#ffe4e6' }}>
                    <div className="text-4xl font-bold mb-1" style={{ color: analytics.avgMargin >= 40 ? '#16a34a' : analytics.avgMargin >= 20 ? '#ea580c' : '#e11d48' }}>
                      {analytics.avgMargin.toFixed(1)}%
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Average Gross Margin</div>
                    <div className="text-xs text-gray-400 mt-1">{analytics.avgMargin >= 40 ? 'Healthy margin' : analytics.avgMargin >= 20 ? 'Moderate — review costs' : 'Low margin — review pricing'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </main>
      )}
    </div>
  )
}
