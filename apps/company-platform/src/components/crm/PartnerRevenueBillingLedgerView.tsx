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

const INITIAL_INVOICES: B2BInvoiceRecord[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-0891',
    partnerName: 'Apex Multi-Specialty Hospital',
    planName: 'Enterprise Multi-Hospital Tier (25 Seats)',
    billingPeriod: 'August 2026',
    subtotal: 49990,
    gst18: 8998.2,
    totalAmount: 58988.2,
    dueDate: '2026-09-10',
    status: 'PAID',
    referralCommission: 4999
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-0892',
    partnerName: 'Metropolis Bio-Pathology Diagnostics',
    planName: 'Professional Diagnostic Tier (10 Seats)',
    billingPeriod: 'August 2026',
    subtotal: 14999,
    gst18: 2699.82,
    totalAmount: 17698.82,
    dueDate: '2026-09-10',
    status: 'PAID',
    referralCommission: 1499.9
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-0893',
    partnerName: 'CarePlus Daycare & Surgery Center',
    planName: 'Professional Surgical Tier (15 Seats)',
    billingPeriod: 'August 2026',
    subtotal: 20000,
    gst18: 3600,
    totalAmount: 23600,
    dueDate: '2026-09-05',
    status: 'PENDING',
    referralCommission: 2000
  },
  {
    id: '4',
    invoiceNumber: 'INV-2026-0894',
    partnerName: 'Apollo Cradle Maternal Health',
    planName: 'Enterprise Regional Hub (20 Seats)',
    billingPeriod: 'July 2026',
    subtotal: 29990,
    gst18: 5398.2,
    totalAmount: 35388.2,
    dueDate: '2026-08-10',
    status: 'OVERDUE',
    referralCommission: 2999
  }
];

export const PartnerRevenueBillingLedgerView: React.FC = () => {
  const [invoices, setInvoices] = useState<B2BInvoiceRecord[]>(INITIAL_INVOICES);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleMarkPaid = (id: string, invNum: string) => {
    setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' } : inv)));
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

        <Button variant="primary" size="sm" onClick={() => handleSendReminder('All Pending Partners', 'Batch August Invoices')} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
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
              {invoices.map((inv) => (
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
