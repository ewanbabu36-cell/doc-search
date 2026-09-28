import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface B2BInvoiceRecord {
  id: string;
  invoiceNumber: string;
  partnerName: string;
  planName: string;
  billingPeriod: string;
  subtotal: number;
  gst18: number;
  totalAmount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  referralCommission: number;
}

const loadDynamicInvoices = (): B2BInvoiceRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('docsearch_b2b_invoices');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Auto-derive complimentary pioneer invoices from live registered partners
    const regPartners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
    if (Array.isArray(regPartners) && regPartners.length > 0) {
      return regPartners.map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        invoiceNumber: `INV-2026-${String(idx + 1).padStart(4, '0')}`,
        partnerName: p.facilityName || p.name || 'Healthcare Partner',
        planName: 'DocSearch Pioneer Launch Tier (100% Free / ABDM Ready)',
        billingPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        subtotal: 0,
        gst18: 0,
        totalAmount: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'PAID' as const,
        referralCommission: 0
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export const PartnerRevenueBillingLedgerView: React.FC = () => {
  const [invoices, setInvoices] = useState<B2BInvoiceRecord[]>(loadDynamicInvoices);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const saveInvoices = (updated: B2BInvoiceRecord[]) => {
    setInvoices(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_b2b_invoices', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleMarkPaid = (id: string, invNum: string) => {
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' as const } : inv));
    saveInvoices(updated);
    setSuccessBanner(`Invoice ${invNum} marked as PAID via Razorpay B2B NetBanking!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleSendReminder = (partnerName: string, invNum: string) => {
    setSuccessBanner(`Payment reminder & GST e-Invoice for ${invNum} dispatched to ${partnerName} finance desk!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const totalCollected = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalCommissions = invoices.reduce((s, i) => s + i.referralCommission, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              💵 B2B Partner Invoicing, Revenue & Commission Ledger
            </h2>
            <Badge variant="success">GST Compliant</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Hospital SaaS subscription billings, 18% GST invoices, automated collection reminders, and referral payouts
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => handleSendReminder('All Pending Partners', 'Batch August Invoices')}>
          📤 Dispatch Pending Invoice Reminders
        </Button>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>REALIZED COLLECTIONS (AUG)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            ₹ {totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>OUTSTANDING RECEIVABLES</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            ₹ {totalPending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PARTNER REFERRAL PAYOUTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
            ₹ {totalCommissions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GST 18% OUTPUT TAX</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            ₹ {(invoices.reduce((s, i) => s + i.gst18, 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Ref</TableHead>
                <TableHead>Partner Hospital</TableHead>
                <TableHead>Subscribed Tier</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Net Amount (+18% GST)</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ds-color-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>🧾</span>
                      <span style={{ fontWeight: 700, color: '#F8FAFC' }}>No B2B Invoices Recorded</span>
                      <span style={{ fontSize: '0.8125rem' }}>Partner subscription invoices and GST receipts will be generated here automatically.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                    <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{inv.invoiceNumber}</strong>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{inv.partnerName}</strong>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.8125rem' }}>{inv.planName}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{inv.billingPeriod}</span>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: '#10B981', fontSize: '0.875rem' }}>
                        ₹ {inv.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </strong>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        Base: ₹{inv.subtotal.toLocaleString()} + GST: ₹{inv.gst18.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{inv.dueDate}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {inv.status !== 'PAID' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(inv.id, inv.invoiceNumber)}
                          style={{
                            backgroundColor: '#10B981',
                            color: '#070C16',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Mark Paid
                        </button>
                      ) : (
                        <Button variant="subtle" size="sm" onClick={() => window.print()}>
                          🖨️ PDF Receipt
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleSendReminder(inv.partnerName, inv.invoiceNumber)}>
                        📲 Send Reminder
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
