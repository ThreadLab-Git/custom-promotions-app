import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import {
  getInvoice, saveInvoice, deleteInvoice, getCompanyInfo,
  createEmptyLineItem, createEmptyStyle,
  getCustomers, saveCustomer, createEmptyCustomer,
  getSalesReps,
  SIZES, PRODUCT_TYPES, DECORATION_TYPES, PLACEMENTS, PAYMENT_METHODS, TERMS_OPTIONS, CATALOG_OPTIONS,
  calcStyleTotal, calcStyleQty, calcLineItemTotal, calcInvoiceTotals,
} from '../utils/storage'
import InvoicePrint from './InvoicePrint'
import CelebrationModal from './CelebrationModal'

function fmt(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)
}

function Input({ label, value, onChange, type = 'text', className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none transition-colors"
        {...props}
      />
    </div>
  )
}

function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  )
}

function StyleGrid({ style, onChange, onCopy, onDelete, canDelete }) {
  const totalQty = calcStyleQty(style)
  const totalPrice = calcStyleTotal(style)

  function updateSize(sz, field, val) {
    const n = parseFloat(val) || 0
    const updated = {
      ...style,
      sizes: {
        ...style.sizes,
        [sz]: { ...style.sizes[sz], [field]: n }
      }
    }
    onChange(updated)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Style header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <Select
          value={style.catalog}
          onChange={v => onChange({ ...style, catalog: v })}
          options={CATALOG_OPTIONS}
          className="flex-shrink-0"
        />
        <input
          type="text"
          placeholder="Product name"
          value={style.product || ''}
          onChange={e => onChange({ ...style, product: e.target.value })}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none min-w-0"
        />
        <input
          type="text"
          placeholder="Part #"
          value={style.partNumber || ''}
          onChange={e => onChange({ ...style, partNumber: e.target.value })}
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none"
        />
        <input
          type="text"
          placeholder="Color"
          value={style.color || ''}
          onChange={e => onChange({ ...style, color: e.target.value })}
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none"
        />
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <button onClick={onCopy} className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
          {canDelete && (
            <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Size grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-500 w-24">Size</td>
              {SIZES.map(sz => (
                <td key={sz} className="px-2 py-2 text-center font-semibold text-gray-700 w-20">{sz}</td>
              ))}
              <td className="px-3 py-2 text-center font-semibold text-gray-700 w-20">Total</td>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Quantity */}
            <tr>
              <td className="px-3 py-1.5 font-medium text-gray-500">Qty</td>
              {SIZES.map(sz => (
                <td key={sz} className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    value={style.sizes[sz].qty || ''}
                    onChange={e => updateSize(sz, 'qty', e.target.value)}
                    placeholder="0"
                    className="size-input w-full text-center border border-gray-200 rounded px-1 py-1 bg-white focus:border-green-500 outline-none"
                  />
                </td>
              ))}
              <td className="px-3 py-1.5 text-center font-mono font-semibold text-gray-900">{totalQty}</td>
            </tr>
            {/* Item Cost */}
            <tr className="bg-gray-50/50">
              <td className="px-3 py-1.5 font-medium text-gray-500">Cost ($)</td>
              {SIZES.map(sz => (
                <td key={sz} className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={style.sizes[sz].cost || ''}
                    onChange={e => updateSize(sz, 'cost', e.target.value)}
                    placeholder="0"
                    className="size-input w-full text-center border border-gray-200 rounded px-1 py-1 bg-white focus:border-green-500 outline-none"
                  />
                </td>
              ))}
              <td className="px-3 py-1.5"></td>
            </tr>
            {/* Markup */}
            <tr>
              <td className="px-3 py-1.5 font-medium text-gray-500">Markup (%)</td>
              {SIZES.map(sz => (
                <td key={sz} className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    value={style.sizes[sz].markup || ''}
                    onChange={e => updateSize(sz, 'markup', e.target.value)}
                    placeholder="0"
                    className="size-input w-full text-center border border-gray-200 rounded px-1 py-1 bg-white focus:border-green-500 outline-none"
                  />
                </td>
              ))}
              <td className="px-3 py-1.5"></td>
            </tr>
            {/* Item Price */}
            <tr className="bg-gray-50/50">
              <td className="px-3 py-1.5 font-medium text-gray-500">Price ($)</td>
              {SIZES.map(sz => (
                <td key={sz} className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={style.sizes[sz].price || ''}
                    onChange={e => updateSize(sz, 'price', e.target.value)}
                    placeholder="0"
                    className="size-input w-full text-center border border-gray-200 rounded px-1 py-1 bg-white focus:border-green-500 outline-none"
                  />
                </td>
              ))}
              <td className="px-3 py-1.5"></td>
            </tr>
            {/* Line total */}
            <tr className="bg-green-50/30">
              <td className="px-3 py-1.5 font-semibold text-gray-700">Total ($)</td>
              {SIZES.map(sz => {
                const { qty, price } = style.sizes[sz]
                const lineTotal = (qty || 0) * (price || 0)
                return (
                  <td key={sz} className="px-2 py-1.5 text-center font-mono text-xs text-gray-700">
                    {lineTotal > 0 ? lineTotal.toFixed(2) : '—'}
                  </td>
                )
              })}
              <td className="px-3 py-1.5 text-center font-mono font-bold text-green-600">{totalPrice.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LineItem({ item, index, onChange, onDelete, canDelete }) {
  const [collapsed, setCollapsed] = useState(false)
  const total = calcLineItemTotal(item)
  const totalQty = item.styles.reduce((sum, s) => sum + calcStyleQty(s), 0)

  function updateStyle(idx, updated) {
    const styles = [...item.styles]
    styles[idx] = updated
    onChange({ ...item, styles })
  }

  function addStyle() {
    onChange({ ...item, styles: [...item.styles, createEmptyStyle()] })
  }

  function copyStyle(idx) {
    const copy = { ...JSON.parse(JSON.stringify(item.styles[idx])), id: crypto.randomUUID() }
    const styles = [...item.styles]
    styles.splice(idx + 1, 0, copy)
    onChange({ ...item, styles })
  }

  function deleteStyle(idx) {
    onChange({ ...item, styles: item.styles.filter((_, i) => i !== idx) })
  }

  function updateLocation(idx, field, val) {
    const locations = [...item.locations]
    locations[idx] = { ...locations[idx], [field]: val }
    onChange({ ...item, locations })
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Line item header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-400 bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{index + 1}</span>

        <Select
          value={item.productType}
          onChange={v => onChange({ ...item, productType: v })}
          options={PRODUCT_TYPES}
          className="w-52 flex-shrink-0"
        />

        <input
          type="text"
          placeholder="Item name"
          value={item.name || ''}
          onChange={e => onChange({ ...item, name: e.target.value })}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none font-medium min-w-0"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Discount</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={item.unitDiscount || ''}
              onChange={e => onChange({ ...item, unitDiscount: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center bg-white focus:border-green-500 outline-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs text-gray-400">{totalQty} items</div>
            <div className="font-semibold text-gray-900 text-sm">{fmt(total)}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}>
                <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {canDelete && (
              <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Description */}
          <input
            type="text"
            placeholder="Item description / notes"
            value={item.description || ''}
            onChange={e => onChange({ ...item, description: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 outline-none text-gray-500 italic"
          />

          {/* Styles */}
          <div className="space-y-3">
            {item.styles.map((style, idx) => (
              <StyleGrid
                key={style.id}
                style={style}
                onChange={updated => updateStyle(idx, updated)}
                onCopy={() => copyStyle(idx)}
                onDelete={() => deleteStyle(idx)}
                canDelete={item.styles.length > 1}
              />
            ))}
          </div>

          <button
            onClick={addStyle}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Style
          </button>

          {/* Decoration Locations */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Decoration Locations</h4>
            </div>
            <div className="divide-y divide-gray-100">
              {item.locations.map((loc, idx) => (
                <div key={loc.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-400 w-20 flex-shrink-0">Location {idx + 1}{idx === 0 && <span className="text-red-400">*</span>}</span>
                  <Select
                    value={loc.type}
                    onChange={v => updateLocation(idx, 'type', v)}
                    options={[{ value: '', label: 'No Item' }, ...DECORATION_TYPES]}
                    className="w-44"
                  />
                  <Select
                    value={loc.placement}
                    onChange={v => updateLocation(idx, 'placement', v)}
                    options={[{ value: '', label: 'N/A' }, ...PLACEMENTS]}
                    className="w-40"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InvoiceBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [companyInfo, setCompanyInfo] = useState(null)
  const [customers, setCustomers] = useState([])
  const [salesReps, setSalesReps] = useState([])
  const [saved, setSaved] = useState(false)
  const [newPayment, setNewPayment] = useState({ date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', amount: '' })
  const [showPrint, setShowPrint] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const isNewInvoice = useRef(true)
  const printRef = useRef(null)

  useEffect(() => {
    getCompanyInfo().then(setCompanyInfo)
    getCustomers().then(setCustomers)
    getSalesReps().then(setSalesReps)
    if (id) {
      getInvoice(id).then(inv => {
        if (inv) {
          setInvoice(inv)
          if (inv.customer?.company || inv.updatedAt !== inv.createdAt) {
            isNewInvoice.current = false
          }
        }
      })
    }
  }, [id])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice?.invoiceNumber}`,
  })

  if (!invoice || !companyInfo) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1f1a' }}>
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.svg" alt="Citywide Uniforms" style={{ height: '28px', opacity: 0.6 }} />
        <div className="text-sm" style={{ color: '#6b9e7a' }}>Loading invoice…</div>
      </div>
    </div>
  )

  const { subtotal, gst, total, paid, balance } = calcInvoiceTotals(invoice)

  function updateInvoice(updates) {
    setInvoice(prev => ({ ...prev, ...updates }))
    setSaved(false)
  }

  function updateCustomer(updates) {
    updateInvoice({ customer: { ...invoice.customer, ...updates } })
  }

  function applyCustomer(customerId) {
    const c = customers.find(c => c.id === customerId)
    if (!c) return
    updateInvoice({
      customer: {
        company: c.company || '',
        address: c.address || '',
        suburb: c.suburb || '',
        state: c.state || '',
        postcode: c.postcode || '',
        contactName: c.contactName || '',
      }
    })
  }

  async function saveCurrentAsCustomer() {
    const c = invoice.customer
    if (!c.company) return
    const existing = customers.find(x => x.company.toLowerCase() === c.company.toLowerCase())
    const record = existing
      ? { ...existing, ...c, id: existing.id, updatedAt: new Date().toISOString() }
      : { ...createEmptyCustomer(), ...c }
    await saveCustomer(record)
    const fresh = await getCustomers()
    setCustomers(fresh)
  }

  function updateSalesRep(updates) {
    updateInvoice({ salesRep: { ...invoice.salesRep, ...updates } })
  }

  function applySalesRep(repId) {
    const rep = salesReps.find(r => r.id === repId)
    if (!rep) return
    updateInvoice({ salesRep: { name: rep.name || '', email: rep.email || '', phone: rep.phone || '' } })
  }

  function updateLineItem(idx, updated) {
    const lineItems = [...invoice.lineItems]
    lineItems[idx] = updated
    updateInvoice({ lineItems })
  }

  function deleteLineItem(idx) {
    updateInvoice({ lineItems: invoice.lineItems.filter((_, i) => i !== idx) })
  }

  function addLineItem() {
    updateInvoice({ lineItems: [...invoice.lineItems, createEmptyLineItem()] })
  }

  function addPayment() {
    if (!newPayment.amount) return
    const payments = [...invoice.payments, { ...newPayment, id: crypto.randomUUID() }]
    const paid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const newTotal = subtotal + subtotal * 0.1
    let status = 'unpaid'
    if (paid >= newTotal) status = 'paid'
    else if (paid > 0) status = 'partial'
    updateInvoice({ payments, status })
    setNewPayment({ date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', amount: '' })
  }

  function removePayment(payId) {
    const payments = invoice.payments.filter(p => p.id !== payId)
    const paidAmt = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const newTotal = subtotal + subtotal * 0.1
    let status = 'unpaid'
    if (paidAmt >= newTotal) status = 'paid'
    else if (paidAmt > 0) status = 'partial'
    updateInvoice({ payments, status })
  }

  async function handleSave() {
    const updated = { ...invoice, updatedAt: new Date().toISOString() }
    await saveInvoice(updated)
    setInvoice(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (isNewInvoice.current) {
      isNewInvoice.current = false
      setShowCelebration(true)
    }
  }

  async function handleDelete() {
    await deleteInvoice(invoice.id)
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f4' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-20 no-print" style={{ background: '#0f1f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <img src="/logo.svg" alt="Citywide Uniforms" style={{ height: '22px', width: 'auto' }} />
          </button>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Invoice #{invoice.invoiceNumber}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowPrint(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: '#94a3a0', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={saved
                ? { background: 'rgba(34,197,94,0.15)', color: '#86efac' }
                : { background: '#22c55e', color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }
              }
            >
              {saved ? (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>Saved</>
              ) : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save Invoice</>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        {/* Invoice header */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="px-6 py-3.5 flex items-center gap-2" style={{ background: '#0f1f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b9e7a" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Invoice Details</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            {/* Left: Invoice meta */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-5 h-5">
                    <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Tax Invoice</div>
                  <div className="flex items-center gap-0.5">
                    <span className="font-bold text-2xl text-gray-900">#</span>
                    <input
                      type="text"
                      value={invoice.invoiceNumber || ''}
                      onChange={e => updateInvoice({ invoiceNumber: e.target.value })}
                      className="font-bold text-2xl text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 outline-none w-28 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Invoice Date" type="date" value={invoice.invoiceDate} onChange={v => updateInvoice({ invoiceDate: v })} />
                <Input label="Due Date" type="date" value={invoice.dueDate} onChange={v => updateInvoice({ dueDate: v })} />
              </div>
              <Select label="Terms" value={invoice.terms} onChange={v => updateInvoice({ terms: v })} options={TERMS_OPTIONS} />
            </div>

            {/* Middle: Sales rep */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22c55e' }}>Sales Rep</h3>
              {salesReps.length > 0 && (
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
                    <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) applySalesRep(e.target.value); e.target.value = '' }}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:border-green-500 outline-none transition-colors appearance-none cursor-pointer"
                    style={{ color: '#64748b' }}
                  >
                    <option value="" disabled>Select sales rep…</option>
                    {[...salesReps].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <Input placeholder="Name" value={invoice.salesRep?.name} onChange={v => updateSalesRep({ name: v })} />
              <Input placeholder="Email" type="email" value={invoice.salesRep?.email} onChange={v => updateSalesRep({ email: v })} />
              <Input placeholder="Phone" value={invoice.salesRep?.phone} onChange={v => updateSalesRep({ phone: v })} />
            </div>

            {/* Right: Customer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22c55e' }}>Ordered By</h3>
                {invoice.customer?.company && (
                  <button
                    onClick={saveCurrentAsCustomer}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#16a34a', background: 'rgba(34,197,94,0.1)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                    title="Save to customer address book"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Save customer
                  </button>
                )}
              </div>
              {customers.length > 0 && (
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
                    <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) applyCustomer(e.target.value); e.target.value = '' }}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:border-green-500 outline-none transition-colors appearance-none cursor-pointer"
                    style={{ color: '#64748b' }}
                  >
                    <option value="" disabled>Select saved customer…</option>
                    {[...customers].sort((a, b) => (a.company || '').localeCompare(b.company || '')).map(c => (
                      <option key={c.id} value={c.id}>{c.company}{c.contactName ? ` — ${c.contactName}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <Input placeholder="Company name" value={invoice.customer?.company} onChange={v => updateCustomer({ company: v })} />
              <Input placeholder="Street address" value={invoice.customer?.address} onChange={v => updateCustomer({ address: v })} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Suburb" value={invoice.customer?.suburb} onChange={v => updateCustomer({ suburb: v })} className="col-span-2" />
                <Input placeholder="State" value={invoice.customer?.state} onChange={v => updateCustomer({ state: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Postcode" value={invoice.customer?.postcode} onChange={v => updateCustomer({ postcode: v })} />
                <Input placeholder="Contact name" value={invoice.customer?.contactName} onChange={v => updateCustomer({ contactName: v })} />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h2 className="font-bold text-gray-900">Items</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
              {invoice.lineItems.length} line {invoice.lineItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {invoice.lineItems.map((item, idx) => (
            <LineItem
              key={item.id}
              item={item}
              index={idx}
              onChange={updated => updateLineItem(idx, updated)}
              onDelete={() => deleteLineItem(idx)}
              canDelete={invoice.lineItems.length > 1}
            />
          ))}

          <button
            onClick={addLineItem}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-4 text-sm font-semibold transition-all"
            style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a', background: 'rgba(34,197,94,0.03)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.background = 'rgba(34,197,94,0.03)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Line Item
          </button>
        </div>

        {/* Bottom row: Payments + Notes + Totals */}
        <div className="grid grid-cols-3 gap-5">
          {/* Payments */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: '#0f1f1a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#6b9e7a" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Payments</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {invoice.payments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-3">No payments recorded yet</p>
                )}
                {invoice.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#f8fffe', border: '1px solid #e6f4ee' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{new Date(p.date + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs text-gray-400">{p.method}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold" style={{ color: '#16a34a' }}>{fmt(p.amount)}</span>
                      <button onClick={() => removePayment(p.id)} className="text-gray-300 hover:text-rose-400 transition-colors p-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add payment */}
                <div className="flex gap-2 pt-1">
                  <input type="date" value={newPayment.date} onChange={e => setNewPayment(p => ({ ...p, date: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-shrink-0 focus:border-green-500 outline-none bg-white" />
                  <select value={newPayment.method} onChange={e => setNewPayment(p => ({ ...p, method: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:border-green-500 outline-none appearance-none bg-white">
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" placeholder="Amount" value={newPayment.amount}
                    onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-28 focus:border-green-500 outline-none" />
                  <button onClick={addPayment} className="text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0" style={{ background: '#22c55e' }}>
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: '#0f1f1a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#6b9e7a" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Customer Note</h3>
              </div>
              <div className="p-4">
                <textarea
                  value={invoice.customerNote || ''}
                  onChange={e => updateInvoice({ customerNote: e.target.value })}
                  placeholder="Add any special instructions or notes for the customer…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:border-green-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-2xl overflow-hidden h-fit" style={{ background: '#0f1f1a', boxShadow: '0 4px 24px rgba(15,31,26,0.25)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b9e7a' }}>Subtotal (excl. GST)</span>
                <span className="font-mono font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b9e7a' }}>GST (10%)</span>
                <span className="font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{fmt(gst)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Total (AUD)</span>
                <span className="font-mono font-bold" style={{ color: '#fff' }}>{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6b9e7a' }}>Total Paid</span>
                <span className="font-mono font-semibold" style={{ color: '#22c55e' }}>{fmt(paid)}</span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Balance Due</span>
                <span className="font-mono font-bold text-xl" style={{ color: balance <= 0 ? '#22c55e' : '#fff' }}>{fmt(balance)}</span>
              </div>
              {balance <= 0 && (
                <div className="flex items-center justify-center gap-2 rounded-xl py-2.5 mt-1" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span className="font-bold text-sm" style={{ color: '#22c55e' }}>PAID IN FULL</span>
                </div>
              )}
            </div>

            {/* Tax totals */}
            <div className="px-5 pb-5">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b9e7a' }}>Tax Totals</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span style={{ color: '#6b9e7a' }}>GST (10%)</span>
                  <span className="font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{fmt(gst)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Preview Modal */}
      {showPrint && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">Print Preview</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save PDF
                  </button>
                  <button onClick={() => setShowPrint(false)} className="text-white/70 hover:text-white px-4 py-2 rounded-lg font-medium text-sm border border-white/20">
                    Close
                  </button>
                </div>
              </div>
              <div className="bg-white shadow-2xl">
                <InvoicePrint ref={printRef} invoice={invoice} companyInfo={companyInfo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration modal */}
      {showCelebration && (
        <CelebrationModal onClose={() => setShowCelebration(false)} />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" className="w-6 h-6">
                <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this invoice?</h3>
            <p className="text-sm text-gray-500 mb-6">Invoice #{invoice.invoiceNumber} will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
