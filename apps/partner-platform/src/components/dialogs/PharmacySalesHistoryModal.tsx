import React, { useState, useMemo } from 'react';
import { Dialog, Button, Input } from '@docsearch/ui-kit';
import type { PharmacyInvoiceData } from './PharmacyInvoiceSlipModal.js';

export interface PharmacySalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: PharmacyInvoiceData[];
  onSelectInvoice: (invoice: PharmacyInvoiceData) => void;
  onDeleteInvoice?: (invoiceNumber: string) => void;
  onClearHistory?: () => void;
}

export const PharmacySalesHistoryModal: React.FC<PharmacySalesHistoryModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onClearHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');

  // Filter invoices dynamically based on search query and date period
  const filteredInvoices = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    const nowTime = Date.now();
    const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;

    return invoices.filter((inv) => {
      // Period filter
      if (filterPeriod === 'TODAY') {
        const isToday =
          inv.invoiceDate.includes(todayStr) ||
          new Date(inv.invoiceDate).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      } else if (filterPeriod === 'WEEK') {
        const invTime = new Date(inv.invoiceDate).getTime();
        if (!isNaN(invTime) && invTime < sevenDaysAgo) return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase().trim();
      const matchNum = (inv.invoiceNumber || '').toLowerCase().includes(term);
      const matchPatient = (inv.patientName || '').toLowerCase().includes(term);
      const matchPhone = (inv.patientPhone || '').includes(term);
      const matchDoctor = (inv.doctorName || '').toLowerCase().includes(term);
      const matchItems = inv.items.some(
        (it) =>
          it.medicationName.toLowerCase().includes(term) ||
          (it.genericName && it.genericName.toLowerCase().includes(term)) ||
          it.batchNumber.toLowerCase().includes(term)
      );

      return matchNum || matchPatient || matchPhone || matchDoctor || matchItems;
    });
  }, [invoices, searchQuery, filterPeriod]);

  // Aggregate Dynamic KPIs
  const stats = useMemo(() => {
    let totalRev = 0;
    let totalDiscount = 0;
    for (const inv of filteredInvoices) {
      totalRev += inv.grandTotal;
      totalDiscount += inv.discountAmount || 0;
    }
    const count = filteredInvoices.length;
    const avg = count > 0 ? totalRev / count : 0;
    return {
      count,
      totalRev: Math.round(totalRev * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      avg: Math.round(avg * 100) / 100
    };
  }, [filteredInvoices]);

  const handleWhatsAppQuickShare = (inv: PharmacyInvoiceData) => {
    const discountLine =
      inv.discountAmount > 0
        ? `🎉 Discount (${inv.discountPercent || 0}%): -₹${inv.discountAmount.toFixed(2)}\n`
        : '';
    const text = encodeURIComponent(
      `🧾 *DocSearch Pharmacy Tax Invoice*\n` +
      `Invoice #: ${inv.invoiceNumber}\n` +
      `Date: ${inv.invoiceDate}\n` +
      `Patient: ${inv.patientName} (📞 +91 ${inv.patientPhone})\n` +
      `Items: ${inv.items.length} medicines\n` +
      `Subtotal: ₹${inv.subtotal.toFixed(2)}\n` +
      discountLine +
      `*Total Paid: ₹${inv.grandTotal.toFixed(2)} (${inv.paymentMode})*\n` +
      `Thank you for choosing ${inv.tenantName}.`
    );
    window.open(`https://wa.me/91${inv.patientPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="📜 Live Pharmacy Sales & Invoices History"
      isFullPage={true}
      maxWidth="full"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Total <strong>{filteredInvoices.length}</strong> invoices displayed
            </span>
            {onClearHistory && invoices.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear the entire sales history?')) {
                    onClearHistory();
                  }
                }}
                style={{ fontSize: '0.72rem', padding: '4px 8px', color: '#EF4444', borderColor: '#FCA5A5' }}
              >
                🗑️ Clear History
              </Button>
            )}
          </div>
          <Button variant="primary" onClick={onClose} style={{ fontWeight: 800 }}>
            ✕ Close Window / Back to POS [Esc]
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', width: '100%' }}>
        {/* KPI Metrics Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              🧾 Total Invoices
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
              {stats.count}
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              💰 Total Revenue
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
              ₹{stats.totalRev.toFixed(2)}
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              🎁 Total Discount
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F43F5E', marginTop: '2px' }}>
              ₹{stats.totalDiscount.toFixed(2)}
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              📊 Avg. Bill Value
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A78BFA', marginTop: '2px' }}>
              ₹{stats.avg.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search: Invoice No (INV-...), Patient Name, Mobile Number, or Medicine..."
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant={filterPeriod === 'ALL' ? 'primary' : 'outline'}
              onClick={() => setFilterPeriod('ALL')}
              style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700 }}
            >
              All Invoices ({invoices.length})
            </Button>
            <Button
              variant={filterPeriod === 'TODAY' ? 'primary' : 'outline'}
              onClick={() => setFilterPeriod('TODAY')}
              style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700 }}
            >
              Today's Invoices
            </Button>
            <Button
              variant={filterPeriod === 'WEEK' ? 'primary' : 'outline'}
              onClick={() => setFilterPeriod('WEEK')}
              style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700 }}
            >
              Last 7 Days
            </Button>
          </div>
        </div>

        {/* Invoices List / Table */}
        {invoices.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '2px dashed #CBD5E1',
              color: '#64748B'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧾</div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1E293B' }}>
              No Bills Generated Yet
            </div>
            <p style={{ margin: '8px auto 0', maxWidth: '460px', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Add medicines at the counter and click <strong>'⚡ Generate & Print Bill [F9]'</strong>. Every completed invoice will automatically be logged here in real-time.
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1.5px dashed #CBD5E1',
              color: '#64748B'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>
              No bills found matching "{searchQuery}"
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              Please check invoice number, customer name, or phone number.
            </p>
          </div>
        ) : (
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 290px)', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#1E293B', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <th style={{ padding: '10px 12px' }}>Invoice No & Date</th>
                  <th style={{ padding: '10px 12px' }}>Customer / Patient</th>
                  <th style={{ padding: '10px 12px' }}>Medicines (Items & Qty)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Discount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Payment Mode</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr
                    key={inv.invoiceNumber || idx}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                    }}
                  >
                    <td style={{ padding: '10px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                        🕒 {inv.invoiceDate}
                      </div>
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                        {inv.patientName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                        📞 +91 {inv.patientPhone}
                      </div>
                      {inv.doctorName && (
                        <div style={{ fontSize: '0.70rem', color: '#16A34A', marginTop: '2px' }}>
                          Dr. {inv.doctorName}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {inv.items.length} Items
                      </div>
                      <div style={{ fontSize: '0.70rem', color: '#64748B', marginTop: '2px', lineHeight: '1.3' }}>
                        {inv.items.slice(0, 3).map((it, i) => (
                          <div key={i} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            • {it.medicationName} ({it.quantity} {it.unit})
                          </div>
                        ))}
                        {inv.items.length > 3 && (
                          <div style={{ color: '#0284C7', fontWeight: 600 }}>
                            +{inv.items.length - 3} more items...
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right' }}>
                      {inv.discountAmount > 0 ? (
                        <div>
                          <div style={{ fontWeight: 800, color: '#16A34A' }}>
                            - ₹{inv.discountAmount.toFixed(2)}
                          </div>
                          {inv.discountPercent !== undefined && inv.discountPercent > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                              ({inv.discountPercent}%)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Nil</span>
                      )}
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>
                        ₹{inv.grandTotal.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        Base: ₹{inv.taxableAmount.toFixed(2)}
                      </div>
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor:
                            inv.paymentMode === 'UPI_QR'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : inv.paymentMode === 'CASH'
                              ? 'rgba(2, 132, 199, 0.15)'
                              : 'rgba(168, 85, 247, 0.15)',
                          color:
                            inv.paymentMode === 'UPI_QR'
                              ? '#047857'
                              : inv.paymentMode === 'CASH'
                              ? '#0369A1'
                              : '#7E22CE',
                          border: '1px solid currentColor'
                        }}
                      >
                        {inv.paymentMode}
                      </span>
                    </td>

                    <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button
                          variant="primary"
                          onClick={() => onSelectInvoice(inv)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            fontWeight: 800,
                            backgroundColor: '#0284C7',
                            borderColor: '#0284C7'
                          }}
                          title="View or reprint this invoice"
                        >
                          🖨️ Reprint
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleWhatsAppQuickShare(inv)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderColor: '#22C55E',
                            color: '#16A34A',
                            fontWeight: 800
                          }}
                          title="Resend invoice to patient on WhatsApp"
                        >
                          📲
                        </Button>
                        {onDeleteInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete invoice #${inv.invoiceNumber}?`)) {
                                onDeleteInvoice(inv.invoiceNumber);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '0.85rem'
                            }}
                            title="Remove this invoice from history"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Dialog>
  );
};
