import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices, deleteInvoice, calcInvoiceTotals, getNextInvoiceNumber, createEmptyInvoice, saveInvoice, getCompanyInfo, saveCompanyInfo, getSalesReps, saveSalesRep, deleteSalesRep, createEmptySalesRep } from '../utils/storage'

function fmt(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtFull(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  unpaid:  { label: 'Unpaid',  cls: 'bg-rose-100 text-rose-600 ring-1 ring-rose-200' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [companyForm, setCompanyForm] = useState(null)
  const [settingsTab, setSettingsTab] = useState('company')
  const [salesReps, setSalesReps] = useState([])
  const [repForm, setRepForm] = useState(null)

  useEffect(() => {
    getInvoices().then(setInvoices)
  }, [])

  async function handleNewInvoice() {
    const num = await getNextInvoiceNumber()
    const invoice = await createEmptyInvoice(num)
    await saveInvoice(invoice)
    navigate(`/invoice/${invoice.id}`)
  }

  function handleDelete(e, id) {
    e.stopPropagation()
    setDeleteConfirm(id)
  }

  async function confirmDelete() {
    await deleteInvoice(deleteConfirm)
    const updated = await getInvoices()
    setInvoices(updated)
    setDeleteConfirm(null)
  }

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'all' || inv.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      String(inv.invoiceNumber).includes(q) ||
      inv.customer?.company?.toLowerCase().includes(q) ||
      inv.customer?.contactName?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const counts = { all: invoices.length, paid: 0, partial: 0, unpaid: 0 }
  invoices.forEach(inv => { counts[inv.status] = (counts[inv.status] || 0) + 1 })

  const totalRevenue = invoices.reduce((sum, inv) => sum + calcInvoiceTotals(inv).total, 0)
  const totalOutstanding = invoices.reduce((sum, inv) => {
    const { balance } = calcInvoiceTotals(inv)
    return sum + (balance > 0 ? balance : 0)
  }, 0)

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f4' }}>

      {/* Header */}
      <header style={{ background: '#0f1f1a' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/logo.svg" alt="Citywide Uniforms" style={{ height: '28px', width: 'auto' }} />
            {/* Nav tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                Invoices
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#6b9e7a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b9e7a'}
              >
                Customers
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const [info, reps] = await Promise.all([getCompanyInfo(), getSalesReps()])
                setCompanyForm(info)
                setSalesReps(reps)
                setSettingsTab('company')
                setRepForm(null)
                setShowSettings(true)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#94a3a0', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Settings
            </button>
            <button
              onClick={handleNewInvoice}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg"
              style={{ background: '#22c55e', color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
              onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path strokeLinecap="round" d="M12 4v16m8-8H4"/>
              </svg>
              New Invoice
            </button>
          </div>
        </div>

        {/* Stat cards row inside header */}
        <div className="max-w-7xl mx-auto px-6 pb-6 pt-2 grid grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue', value: fmt(totalRevenue), sub: `${counts.all} invoice${counts.all !== 1 ? 's' : ''}`,
              icon: <path strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
              accent: '#22c55e', accentBg: 'rgba(34,197,94,0.15)'
            },
            {
              label: 'Outstanding', value: fmt(totalOutstanding), sub: `${counts.unpaid + counts.partial} unpaid`,
              icon: <path strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
              accent: '#f97316', accentBg: 'rgba(249,115,22,0.15)'
            },
            {
              label: 'Paid', value: String(counts.paid), sub: 'invoices cleared',
              icon: <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
              accent: '#22c55e', accentBg: 'rgba(34,197,94,0.15)'
            },
            {
              label: 'Unpaid', value: String(counts.unpaid), sub: `${counts.partial} partial`,
              icon: <path strokeLinecap="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
              accent: '#f43f5e', accentBg: 'rgba(244,63,94,0.15)'
            },
          ].map(({ label, value, sub, icon, accent, accentBg }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" className="w-5 h-5">{icon}</svg>
              </div>
              <div>
                <div className="text-xs font-medium mb-0.5" style={{ color: '#6b9e7a' }}>{label}</div>
                <div className="text-xl font-bold leading-tight" style={{ color: '#fff' }}>{value}</div>
                <div className="text-xs" style={{ color: '#4d7a5e' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters & Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/80">
            {['all', 'unpaid', 'partial', 'paid'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2.5 text-sm font-medium capitalize transition-all"
                style={filter === f
                  ? { background: '#0f1f1a', color: '#22c55e' }
                  : { color: '#64748b', background: 'transparent' }}
              >
                {f} {f !== 'all' && <span className="ml-1 text-xs opacity-60">({counts[f]})</span>}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search customer or invoice #…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200/80 shadow-sm outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div className="text-sm text-gray-400 ml-auto">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f4' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="w-8 h-8">
                  <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-600 mb-1">No invoices found</p>
              <p className="text-sm text-gray-400 mb-5">Create your first invoice to get started</p>
              <button onClick={handleNewInvoice} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors" style={{ background: '#22c55e' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                Create Invoice
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f4', background: '#fafafa' }}>
                  {['Invoice #', 'Customer', 'Date', 'Total', 'Paid', 'Balance', 'Status', ''].map((h, i) => (
                    <th key={i} className={`py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                      i === 0 ? 'pl-6 pr-4 text-left' :
                      i === 7 ? 'px-4' :
                      i >= 3 && i <= 5 ? 'px-4 text-right' :
                      'px-4 text-left'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, rowIdx) => {
                  const { total, paid, balance } = calcInvoiceTotals(inv)
                  const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.unpaid
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoice/${inv.id}`)}
                      className="cursor-pointer group transition-colors"
                      style={{ borderTop: rowIdx > 0 ? '1px solid #f1f5f4' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fffe'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td className="pl-6 pr-4 py-4">
                        <span className="font-mono font-bold text-gray-900 text-sm">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">{inv.customer?.company || <span className="text-gray-300">—</span>}</div>
                        {inv.customer?.contactName && <div className="text-xs text-gray-400 mt-0.5">{inv.customer.contactName}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold text-gray-900">{fmtFull(total)}</td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-medium" style={{ color: paid > 0 ? '#16a34a' : '#94a3b8' }}>{fmtFull(paid)}</td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-bold" style={{ color: balance > 0 ? '#0f1f1a' : '#16a34a' }}>{fmtFull(balance)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => handleDelete(e, inv.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" className="w-6 h-6">
                <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete invoice?</h3>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && companyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ background: '#0f1f1a' }}>
              <h3 className="font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0 px-6 pt-3">
              {[{ id: 'company', label: 'Company' }, { id: 'sales_reps', label: 'Sales Reps' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setSettingsTab(tab.id); setRepForm(null) }}
                  className="mr-4 pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px"
                  style={settingsTab === tab.id
                    ? { color: '#22c55e', borderColor: '#22c55e' }
                    : { color: '#94a3b8', borderColor: 'transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">

              {/* Company tab */}
              {settingsTab === 'company' && (
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Display Name (printed large on invoice)', key: 'displayName', placeholder: 'CITYWIDE UNIFORMS' },
                    { label: 'Legal Company Name', key: 'name', placeholder: 'CityWide Uniforms PTY LTD' },
                    { label: 'ACN', key: 'acn', placeholder: '91 692 026 547' },
                    { label: 'ABN', key: 'abn', placeholder: '' },
                    { label: 'Email', key: 'email', placeholder: 'hello@citywideuniforms.com.au' },
                    { label: 'Phone', key: 'phone', placeholder: '' },
                    { label: 'Address', key: 'address', placeholder: '' },
                    { label: 'Website', key: 'website', placeholder: '' },
                    { label: 'Bank Account Name', key: 'bankName', placeholder: 'Citywide Uniforms PTY LTD' },
                    { label: 'BSB', key: 'bsb', placeholder: '063-169' },
                    { label: 'Account Number', key: 'bankAccount', placeholder: '1089 7938' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={companyForm[key] || ''}
                        onChange={e => setCompanyForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Sales Reps tab */}
              {settingsTab === 'sales_reps' && (
                <div className="p-6 space-y-4">
                  {/* Rep list */}
                  {salesReps.length === 0 && !repForm && (
                    <p className="text-sm text-gray-400 text-center py-4">No sales reps yet. Add one below.</p>
                  )}
                  {salesReps.length > 0 && (
                    <div className="space-y-2">
                      {salesReps.map(rep => (
                        <div key={rep.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 group">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{rep.name || <span className="text-gray-400">Unnamed</span>}</div>
                            {(rep.email || rep.phone) && (
                              <div className="text-xs text-gray-400 truncate mt-0.5">
                                {[rep.email, rep.phone].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setRepForm({ ...rep })}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-all"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              await deleteSalesRep(rep.id)
                              setSalesReps(await getSalesReps())
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add / Edit form */}
                  {repForm ? (
                    <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22c55e' }}>
                        {repForm.createdAt === repForm.updatedAt ? 'New Sales Rep' : 'Edit Sales Rep'}
                      </p>
                      {[
                        { key: 'name', placeholder: 'Name', type: 'text' },
                        { key: 'email', placeholder: 'Email', type: 'email' },
                        { key: 'phone', placeholder: 'Phone', type: 'text' },
                      ].map(({ key, placeholder, type }) => (
                        <input
                          key={key}
                          type={type}
                          placeholder={placeholder}
                          value={repForm[key] || ''}
                          onChange={e => setRepForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-green-500 transition-colors"
                        />
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setRepForm(null)}
                          className="flex-1 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!repForm.name.trim()) return
                            const rep = { ...repForm, updatedAt: new Date().toISOString() }
                            await saveSalesRep(rep)
                            setSalesReps(await getSalesReps())
                            setRepForm(null)
                          }}
                          className="flex-1 px-3 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                          style={{ background: '#22c55e' }}
                        >
                          Save Rep
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRepForm(createEmptySalesRep())}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors"
                      style={{ borderColor: '#d1fae5', color: '#16a34a' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1fae5'; e.currentTarget.style.background = '' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                      Add Sales Rep
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50 flex-shrink-0">
              {settingsTab === 'company' ? (
                <>
                  <button onClick={() => setShowSettings(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                  <button
                    onClick={async () => { await saveCompanyInfo(companyForm); setShowSettings(false) }}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
                    style={{ background: '#22c55e' }}
                  >
                    Save Settings
                  </button>
                </>
              ) : (
                <button onClick={() => setShowSettings(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
