import { forwardRef } from 'react'
import { SIZES, getSizesForPreset, calcStyleTotal, calcStyleQty, calcLineItemTotal, calcInvoiceTotals } from '../utils/storage'

function fmt(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)
}

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

const InvoicePrint = forwardRef(function InvoicePrint({ invoice, companyInfo }, ref) {
  if (!invoice) return null
  const { subtotal, gst, total, paid, balance } = calcInvoiceTotals(invoice)
  const isPaid = balance <= 0

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#111', padding: '20px 24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <table style={{ width: '100%', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '45%' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-0.5px', color: '#111' }}>
                {(companyInfo.displayName || companyInfo.name).split(' ').slice(0, Math.ceil((companyInfo.displayName || companyInfo.name).split(' ').length / 2)).join(' ')}<br />
                {(companyInfo.displayName || companyInfo.name).split(' ').slice(Math.ceil((companyInfo.displayName || companyInfo.name).split(' ').length / 2)).join(' ')}
              </div>
            </td>
            <td style={{ verticalAlign: 'top', paddingLeft: '24px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{companyInfo.name}</div>
              {companyInfo.acn && (
                <div style={{ marginBottom: '4px' }}>ACN: <span style={{ color: '#1a56db' }}>{companyInfo.acn}</span></div>
              )}
              {companyInfo.abn && !companyInfo.acn && (
                <div style={{ marginBottom: '4px' }}>ABN: {companyInfo.abn}</div>
              )}
              {companyInfo.email && <div>Email: {companyInfo.email}</div>}
              {companyInfo.phone && <div>Phone: {companyInfo.phone}</div>}
              {companyInfo.website && <div>{companyInfo.website}</div>}
            </td>
          </tr>
        </tbody>
      </table>
      <hr style={{ borderTop: '2px solid #111', borderBottom: '1px solid #111', marginBottom: '20px', height: '3px' }} />

      {/* Invoice title */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 2px' }}>Tax Invoice {invoice.invoiceNumber}</h1>
        {invoice.customer?.company && (
          <h2 style={{ fontSize: '14px', fontWeight: 'normal', color: '#555', margin: 0 }}>
            {invoice.customer.company} {invoice.lineItems[0]?.name ? `— ${invoice.lineItems[0].name}` : ''}
          </h2>
        )}
      </div>

      {/* Invoice meta */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '10px' }}>
        <tbody>
          <tr style={{ background: '#f9f9f9' }}>
            <td style={{ border: '1px solid #e0e0e0', padding: '6px 10px', width: '40%' }}>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Sales Rep Info</div>
              <div style={{ fontWeight: 'bold' }}>{invoice.salesRep?.name || '—'}</div>
              <div>{invoice.salesRep?.email}</div>
              <div>{invoice.salesRep?.phone}</div>
            </td>
            <td style={{ border: '1px solid #e0e0e0', padding: '6px 10px', width: '30%' }}>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Invoice Date</div>
              <div style={{ fontWeight: 'bold' }}>{fmtDate(invoice.invoiceDate)}</div>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginTop: '4px', marginBottom: '2px' }}>Inv. Due Date</div>
              <div>{fmtDate(invoice.dueDate)}</div>
            </td>
            <td style={{ border: '1px solid #e0e0e0', padding: '6px 10px', width: '15%' }}>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Terms</div>
              <div style={{ fontWeight: 'bold' }}>{invoice.terms}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e0e0e0', padding: '6px 10px' }}>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Ordered By</div>
              <div style={{ fontWeight: 'bold' }}>{invoice.customer?.company || '—'}</div>
              <div>{invoice.customer?.address}</div>
              {(invoice.customer?.suburb || invoice.customer?.state) && (
                <div>{[invoice.customer?.suburb, invoice.customer?.state, invoice.customer?.postcode].filter(Boolean).join(', ')}</div>
              )}
            </td>
            <td colSpan="2" style={{ border: '1px solid #e0e0e0', padding: '6px 10px' }}>
              <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Contact Info</div>
              <div style={{ fontWeight: 'bold' }}>{invoice.customer?.contactName || '—'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Line items */}
      {invoice.lineItems.map((item, itemIdx) => {
        const itemTotal = calcLineItemTotal(item)
        const itemQty = item.styles.reduce((sum, s) => sum + calcStyleQty(s), 0)
        const itemGst = itemTotal * 0.1

        // Collect active sizes (any size with qty > 0), respecting per-style presets
        const allSizes = [...new Set(item.styles.flatMap(s => getSizesForPreset(s.sizePreset || 'adult')))]
        const activeSizes = allSizes.filter(sz => item.styles.some(s => (s.sizes[sz]?.qty || 0) > 0))
        const displaySizes = activeSizes.length > 0 ? activeSizes : allSizes.slice(0, 5)

        return (
          <div key={item.id} style={{ marginBottom: '16px' }}>
            {/* Item header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderTop: '2px solid #ccc' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', width: '24px' }}>#</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555' }}>ITEM</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'center', width: '50px' }}>QTY</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'center', width: '50px' }}>UOM</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'center', width: '60px' }}>U.PRICE</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'right', width: '90px' }}>TOTAL (EXCL. GST)</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'right', width: '60px' }}>TAX</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', color: '#555', textAlign: 'center', width: '60px' }}>TAXABLE</td>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{itemIdx + 1}</td>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name || '(unnamed item)'}</div>
                    {item.description && (
                      <div style={{ color: '#666', fontStyle: 'italic', marginTop: '2px' }}>*{item.description}*</div>
                    )}

                    {/* Size grids per style */}
                    {item.styles.map(style => {
                      const styleQty = calcStyleQty(style)
                      if (styleQty === 0 && !style.color && !style.product) return null
                      return (
                        <div key={style.id} style={{ marginTop: '8px' }}>
                          {style.color && <div style={{ marginBottom: '4px', color: '#555' }}>Color: {style.color}{style.product ? ` — ${style.product}` : ''}</div>}
                          <table style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                              <tr style={{ background: '#f5f5f5' }}>
                                {displaySizes.map(sz => (
                                  <td key={sz} style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'center', fontWeight: 'bold', minWidth: '45px' }}>{sz}</td>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {displaySizes.map(sz => (
                                  <td key={sz} style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'center' }}>{style.sizes[sz]?.qty || 0}</td>
                                ))}
                              </tr>
                              <tr style={{ background: '#fafafa' }}>
                                {displaySizes.map(sz => (
                                  <td key={sz} style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'center', color: '#555' }}>
                                    {style.sizes[sz]?.price ? `$${style.sizes[sz].price.toFixed(2)}` : '$0.00'}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    })}

                    {/* Decoration Locations */}
                    {item.locations.filter(l => l.type).length > 0 && (
                      <table style={{ borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px', width: '100%' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5' }}>
                            <td style={{ border: '1px solid #ddd', padding: '3px 8px', fontWeight: 'bold', color: '#555' }}>DECORATION</td>
                            <td style={{ border: '1px solid #ddd', padding: '3px 8px', fontWeight: 'bold', color: '#555' }}>PLACEMENT</td>
                            <td style={{ border: '1px solid #ddd', padding: '3px 8px', fontWeight: 'bold', color: '#555', textAlign: 'center' }}>QTY</td>
                            <td style={{ border: '1px solid #ddd', padding: '3px 8px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>PRICE/UNIT</td>
                            <td style={{ border: '1px solid #ddd', padding: '3px 8px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>TOTAL</td>
                          </tr>
                        </thead>
                        <tbody>
                          {item.locations.filter(l => l.type).map(loc => (
                            <tr key={loc.id}>
                              <td style={{ border: '1px solid #ddd', padding: '3px 8px' }}>{loc.type}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 8px', color: '#666' }}>{loc.placement || '—'}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'center' }}>{itemQty}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'right' }}>
                                {(parseFloat(loc.price) || 0) > 0 ? `$${parseFloat(loc.price).toFixed(2)}` : '—'}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                {(parseFloat(loc.price) || 0) > 0 ? fmt((parseFloat(loc.price) || 0) * itemQty) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold' }}>{itemQty}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>Each</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>-</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>{fmt(itemTotal)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'top' }}>{fmt(itemGst)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>{item.taxable ? 'Y' : 'N'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#555', width: '24px' }}>#</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#555' }}>PAID ON</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#555' }}>METHOD</td>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#555', textAlign: 'right' }}>AMOUNT</td>
            </tr>
          </thead>
          <tbody>
            {invoice.payments.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>{i + 1}</td>
                <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{fmtDate(p.date)}</td>
                <td style={{ padding: '4px 8px' }}>{p.method}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Customer note */}
      {invoice.customerNote && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '10px', color: '#555', textTransform: 'uppercase' }}>Customer Note:</div>
          <div style={{ color: '#555', fontStyle: 'italic' }}>*{invoice.customerNote}*</div>
        </div>
      )}

      {/* Footer / Totals */}
      <table style={{ width: '100%', marginTop: '24px' }}>
        <tbody>
          <tr style={{ verticalAlign: 'top' }}>
            {/* Terms / Bank details */}
            <td style={{ width: '55%', fontSize: '10px', color: '#333', lineHeight: '1.8', paddingRight: '16px', verticalAlign: 'bottom' }}>
              <div>Account Name: {companyInfo.bankName}</div>
              <div>BSB: {companyInfo.bsb}</div>
              <div>Account Number: {companyInfo.bankAccount}</div>
              <div style={{ marginTop: '10px' }}>Please include the invoice number in the payment reference.</div>
            </td>
            {/* Totals */}
            <td style={{ width: '45%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Subtotal:</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Total GST:</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(gst)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Final price (AUD):</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(total)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', color: '#555' }}>Total Paid (AUD):</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>{fmt(paid)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #111' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '13px' }}>Balance Due (AUD):</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{fmt(balance)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tax totals */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Tax Totals</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px', background: '#f5f5f5', fontWeight: 'bold' }}>GST(10.0%)</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px', fontWeight: 'bold' }}>{fmt(gst)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

export default InvoicePrint
