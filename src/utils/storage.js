import { supabase, isConfigured } from './supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
export const KIDS_SIZES = ['4', '6', '8', '10', '12', '14', '16', '18']
export const SIZES = ADULT_SIZES // kept for backward compatibility

export function getSizesForPreset(preset) {
  return preset === 'kids' ? KIDS_SIZES : ADULT_SIZES
}

export const PRODUCT_TYPES = [
  'Heat Transfer - Apparel',
  'Embroidery - Apparel',
  'Screen Print - Apparel',
  'DTG - Apparel',
  'Sublimation - Apparel',
  'Vinyl - Apparel',
  'Other',
]

export const DECORATION_TYPES = [
  'Transfer - 1 Color',
  'Transfer - 2 Color',
  'Transfer - Full Color',
  'Embroidery',
  'Screen Print',
  'DTG',
  'Sublimation',
  'Vinyl',
]

export const PLACEMENTS = [
  'Full Front', 'Full Back', 'Left Chest', 'Right Chest',
  'Left Sleeve', 'Right Sleeve', 'Hood', 'Pocket', 'Collar', 'Custom',
]

export const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Card', 'Cheque', 'Other']
export const TERMS_OPTIONS = ['Cash', 'Net 7', 'Net 14', 'Net 30', 'Net 60', 'Due on Receipt', 'COD']
export const CATALOG_OPTIONS = ['Custom', 'AS Colour', 'Gildan', 'Next Level', 'Bella+Canvas', 'Port & Company', 'Hanes', 'Other']

// ─── Default company info ─────────────────────────────────────────────────────

const DEFAULT_COMPANY = {
  name: 'CityWide Uniforms PTY LTD',
  displayName: 'CITYWIDE UNIFORMS',
  address: '',
  email: 'hello@citywideuniforms.com.au',
  phone: '',
  acn: '91 692 026 547',
  taxId: 'GST',
  bankAccount: '1089 7938',
  bsb: '063-169',
  website: '',
  bankName: 'Citywide Uniforms PTY LTD',
}

// ─── localStorage helpers (fallback) ─────────────────────────────────────────

const LS_KEY = 'invoice_app_data'

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : { invoices: [], nextInvoiceNumber: 1001, companyInfo: DEFAULT_COMPANY }
  } catch { return { invoices: [], nextInvoiceNumber: 1001, companyInfo: DEFAULT_COMPANY } }
}

function lsSave(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────

export async function getInvoices() {
  if (isConfigured) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) return data.map(row => row.data)
  }
  return lsLoad().invoices
}

export async function getInvoice(id) {
  if (isConfigured) {
    const { data, error } = await supabase
      .from('invoices')
      .select('data')
      .eq('id', id)
      .single()
    if (!error && data) return data.data
  }
  return lsLoad().invoices.find(inv => inv.id === id)
}

export async function saveInvoice(invoice) {
  if (isConfigured) {
    const row = {
      id: invoice.id,
      invoice_number: String(invoice.invoiceNumber),
      status: invoice.status || 'unpaid',
      customer_company: invoice.customer?.company || '',
      invoice_date: invoice.invoiceDate || null,
      data: invoice,
      created_at: invoice.createdAt,
      updated_at: invoice.updatedAt,
    }
    const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'id' })
    if (error) console.error('Supabase saveInvoice error:', error)
    return
  }
  const state = lsLoad()
  const idx = state.invoices.findIndex(inv => inv.id === invoice.id)
  if (idx >= 0) state.invoices[idx] = invoice
  else state.invoices.unshift(invoice)
  lsSave(state)
}

export async function deleteInvoice(id) {
  if (isConfigured) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) console.error('Supabase deleteInvoice error:', error)
    return
  }
  const state = lsLoad()
  state.invoices = state.invoices.filter(inv => inv.id !== id)
  lsSave(state)
}

// ─── Invoice number ───────────────────────────────────────────────────────────

export async function getNextInvoiceNumber() {
  if (isConfigured) {
    // Read-then-increment using a settings row
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'next_invoice_number')
      .single()

    const current = data?.value?.number ?? 1001
    await supabase.from('app_settings').upsert(
      { key: 'next_invoice_number', value: { number: current + 1 } },
      { onConflict: 'key' }
    )
    return current
  }
  const state = lsLoad()
  const num = state.nextInvoiceNumber || 1001
  state.nextInvoiceNumber = num + 1
  lsSave(state)
  return num
}

// ─── Company info ─────────────────────────────────────────────────────────────

export async function getCompanyInfo() {
  if (isConfigured) {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'company_info')
      .single()
    return data?.value ?? DEFAULT_COMPANY
  }
  return lsLoad().companyInfo ?? DEFAULT_COMPANY
}

export async function saveCompanyInfo(info) {
  if (isConfigured) {
    const { error } = await supabase.from('app_settings').upsert(
      { key: 'company_info', value: info },
      { onConflict: 'key' }
    )
    if (error) console.error('Supabase saveCompanyInfo error:', error)
    return
  }
  const state = lsLoad()
  state.companyInfo = info
  lsSave(state)
}

// ─── Customer CRUD ───────────────────────────────────────────────────────────

export async function getCustomers() {
  if (isConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('company', { ascending: true })
    if (!error) return data.map(row => row.data)
  }
  return lsLoad().customers || []
}

export async function saveCustomer(customer) {
  if (isConfigured) {
    const row = {
      id: customer.id,
      company: customer.company || '',
      data: customer,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    }
    const { error } = await supabase.from('customers').upsert(row, { onConflict: 'id' })
    if (error) console.error('Supabase saveCustomer error:', error)
    return
  }
  const state = lsLoad()
  if (!state.customers) state.customers = []
  const idx = state.customers.findIndex(c => c.id === customer.id)
  if (idx >= 0) state.customers[idx] = customer
  else state.customers.unshift(customer)
  lsSave(state)
}

export async function deleteCustomer(id) {
  if (isConfigured) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) console.error('Supabase deleteCustomer error:', error)
    return
  }
  const state = lsLoad()
  state.customers = (state.customers || []).filter(c => c.id !== id)
  lsSave(state)
}

export function createEmptyCustomer() {
  return {
    id: crypto.randomUUID(),
    company: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Sales Rep CRUD ──────────────────────────────────────────────────────────

export async function getSalesReps() {
  if (isConfigured) {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .order('name', { ascending: true })
    if (!error) return data.map(row => row.data)
  }
  return lsLoad().salesReps || []
}

export async function saveSalesRep(rep) {
  if (isConfigured) {
    const row = {
      id: rep.id,
      name: rep.name || '',
      data: rep,
      created_at: rep.createdAt,
      updated_at: rep.updatedAt,
    }
    const { error } = await supabase.from('sales_reps').upsert(row, { onConflict: 'id' })
    if (error) console.error('Supabase saveSalesRep error:', error)
    return
  }
  const state = lsLoad()
  if (!state.salesReps) state.salesReps = []
  const idx = state.salesReps.findIndex(r => r.id === rep.id)
  if (idx >= 0) state.salesReps[idx] = rep
  else state.salesReps.unshift(rep)
  lsSave(state)
}

export async function deleteSalesRep(id) {
  if (isConfigured) {
    const { error } = await supabase.from('sales_reps').delete().eq('id', id)
    if (error) console.error('Supabase deleteSalesRep error:', error)
    return
  }
  const state = lsLoad()
  state.salesReps = (state.salesReps || []).filter(r => r.id !== id)
  lsSave(state)
}

export function createEmptySalesRep() {
  return {
    id: crypto.randomUUID(),
    name: '',
    email: '',
    phone: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function createEmptyStyle(sizePreset = 'adult') {
  const sizes = getSizesForPreset(sizePreset)
  return {
    id: crypto.randomUUID(),
    catalog: 'Custom',
    product: '',
    partNumber: '',
    color: '',
    sizePreset,
    sizes: Object.fromEntries(sizes.map(sz => [sz, { qty: 0, cost: 0, markup: 0, price: 0 }])),
  }
}

export function createEmptyLineItem() {
  return {
    id: crypto.randomUUID(),
    productType: 'Heat Transfer - Apparel',
    name: '',
    description: '',
    unitDiscount: 0,
    taxable: true,
    styles: [createEmptyStyle()],
    locations: [
      { id: crypto.randomUUID(), type: 'Transfer - 1 Color', placement: 'Full Front', cost: 0, price: 0 },
      { id: crypto.randomUUID(), type: '', placement: '', cost: 0, price: 0 },
      { id: crypto.randomUUID(), type: '', placement: '', cost: 0, price: 0 },
      { id: crypto.randomUUID(), type: '', placement: '', cost: 0, price: 0 },
      { id: crypto.randomUUID(), type: '', placement: '', cost: 0, price: 0 },
    ],
  }
}

export async function createEmptyInvoice(invoiceNumber) {
  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + 1)
  return {
    id: crypto.randomUUID(),
    invoiceNumber,
    status: 'unpaid',
    invoiceDate: today.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    terms: 'Cash',
    salesRep: { name: '', email: '', phone: '' },
    customer: { company: '', address: '', suburb: '', state: '', postcode: '', contactName: '' },
    lineItems: [createEmptyLineItem()],
    payments: [],
    customerNote: '',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  }
}

// ─── Calculators ──────────────────────────────────────────────────────────────

export function calcStyleTotal(style) {
  return Object.values(style.sizes).reduce((sum, s) => sum + ((s.qty || 0) * (s.price || 0)), 0)
}

export function calcStyleQty(style) {
  return Object.values(style.sizes).reduce((sum, s) => sum + (s.qty || 0), 0)
}

export function calcLineItemTotal(item) {
  const gross = item.styles.reduce((sum, style) => sum + calcStyleTotal(style), 0)
  return gross * (1 - (item.unitDiscount || 0) / 100)
}

export function calcInvoiceTotals(invoice) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + calcLineItemTotal(item), 0)
  const gst = subtotal * 0.1
  const total = subtotal + gst
  const paid = invoice.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const balance = total - paid
  return { subtotal, gst, total, paid, balance }
}
