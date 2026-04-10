import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers, saveCustomer, deleteCustomer, createEmptyCustomer } from '../utils/storage'

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [editForm, setEditForm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers().then(setCustomers)
  }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q ||
      c.company?.toLowerCase().includes(q) ||
      c.contactName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
  })

  function openNew() {
    setEditForm(createEmptyCustomer())
  }

  function openEdit(customer) {
    setEditForm({ ...customer })
  }

  async function handleSave() {
    if (!editForm.company.trim()) return
    setSaving(true)
    const updated = { ...editForm, updatedAt: new Date().toISOString() }
    await saveCustomer(updated)
    const fresh = await getCustomers()
    setCustomers(fresh)
    setEditForm(null)
    setSaving(false)
  }

  async function confirmDelete() {
    await deleteCustomer(deleteConfirm)
    setCustomers(cs => cs.filter(c => c.id !== deleteConfirm))
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f4' }}>

      {/* Header */}
      <header style={{ background: '#0f1f1a' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src="/logo.svg" alt="Custom Promotions" style={{ height: '28px', width: 'auto' }} />
            </button>
            {/* Nav tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#6b9e7a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b9e7a'}
              >
                Invoices
              </button>
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                Customers
              </button>
            </div>
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg"
            style={{ background: '#22c55e', color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
            onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add Customer
          </button>
        </div>

        {/* Sub-header stat */}
        <div className="max-w-7xl mx-auto px-6 pb-5 pt-1">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4d7a5e" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="text-sm" style={{ color: '#4d7a5e' }}>
              {customers.length} saved customer{customers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by company or contact…"
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
                  <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-600 mb-1">
                {search ? 'No customers match your search' : 'No customers yet'}
              </p>
              <p className="text-sm text-gray-400 mb-5">
                {search ? 'Try a different search term' : 'Add your first customer to get started'}
              </p>
              {!search && (
                <button
                  onClick={openNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: '#22c55e' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                  Add Customer
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f4', background: '#fafafa' }}>
                  {['Company', 'Contact', 'Email', 'Phone', 'Address', ''].map((h, i) => (
                    <th key={i} className={`py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                      i === 0 ? 'pl-6 pr-4 text-left' :
                      i === 5 ? 'px-4' :
                      'px-4 text-left'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, rowIdx) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer group transition-colors"
                    style={{ borderTop: rowIdx > 0 ? '1px solid #f1f5f4' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fffe'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => openEdit(c)}
                  >
                    <td className="pl-6 pr-4 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{c.company || <span className="text-gray-300">—</span>}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{c.contactName || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{c.email || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{c.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {[c.suburb, c.state].filter(Boolean).join(', ') || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Edit / Add modal */}
      {editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#0f1f1a' }}>
              <h3 className="font-bold text-white">
                {customers.find(c => c.id === editForm.id) ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button onClick={() => setEditForm(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.company || ''}
                  onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={editForm.contactName || ''}
                  onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))}
                  placeholder="Contact person"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street address"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Suburb</label>
                  <input
                    type="text"
                    value={editForm.suburb || ''}
                    onChange={e => setEditForm(f => ({ ...f, suburb: e.target.value }))}
                    placeholder="Suburb"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">State</label>
                  <select
                    value={editForm.state || ''}
                    onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">State</option>
                    {AU_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Postcode</label>
                  <input
                    type="text"
                    value={editForm.postcode || ''}
                    onChange={e => setEditForm(f => ({ ...f, postcode: e.target.value }))}
                    placeholder="0000"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={() => setEditForm(null)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editForm.company?.trim() || saving}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                style={{ background: '#22c55e' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#16a34a' }}
                onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
              >
                {saving ? 'Saving…' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" className="w-6 h-6">
                <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete customer?</h3>
            <p className="text-sm text-gray-500 mb-6">This will remove them from your address book. Existing invoices won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
