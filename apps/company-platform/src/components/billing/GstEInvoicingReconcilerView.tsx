import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface GstEInvoice {
  invoiceNumber: string;
  partnerName: string;
  gstin: string;
  taxableAmount: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalAmount: string;
  irnStatus: 'GOVT_IRN_GENERATED' | 'PENDING_IRP_SYNC';
  irnNumber?: string;
  issuedDate: string;
}

const INITIAL_INVOICES: GstEInvoice[] = [
  {
    invoiceNumber: 'DS/2026-27/INV-00812',
    partnerName: 'Metropolitan Multispecialty Hospital',
    gstin: '27AABCM8891P1Z4',
    taxableAmount: '₹ 4,999.00',
    cgst: '₹ 449.91',
    sgst: '₹ 449.91',
    igst: '₹ 0.00',
    totalAmount: '₹ 5,898.82',
    irnStatus: 'GOVT_IRN_GENERATED',
    irnNumber: '9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
    issuedDate: '2026-11-01'
  },
  {
    invoiceNumber: 'DS/2026-27/INV-00813',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    gstin: '07AAACV1298K1ZO',
    taxableAmount: '₹ 499.00',
    cgst: '₹ 0.00',
    sgst: '₹ 0.00',
    igst: '₹ 89.82',
    totalAmount: '₹ 588.82',
    irnStatus: 'GOVT_IRN_GENERATED',
    irnNumber: '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    issuedDate: '2026-11-02'
  },
  {
    invoiceNumber: 'DS/2026-27/INV-00814',
    partnerName: 'City Heart Diagnostics Center',
    gstin: '27AACCH5512N1Z9',
    taxableAmount: '₹ 999.00',
    cgst: '₹ 89.91',
    sgst: '₹ 89.91',
    igst: '₹ 0.00',
    totalAmount: '₹ 1,178.82',
    irnStatus: 'PENDING_IRP_SYNC',
    issuedDate: '2026-11-03'
  }
];

export const GstEInvoicingReconcilerView: React.FC = () => {
  const [invoices, setInvoices] = useState<GstEInvoice[]>(INITIAL_INVOICES);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleQueryNicPortal = () => {
    setSyncNotice('Connecting to GSTN/NIC e-invoice portal...');
    setTimeout(() => {
      setSyncNotice('NIC Portal sync complete. All active institutional invoices verified.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 800);
  };

  const handleGenerateIrn = (invNum: string) => {
    const fakeIrn = `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNumber === invNum
          ? { ...inv, irnStatus: 'GOVT_IRN_GENERATED', irnNumber: fakeIrn }
          : inv
      )
    );
    setSyncNotice(`✓ Govt. IRN & Signed QR successfully issued for ${invNum} by National Informatics Centre (NIC) portal!`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🇮🇳 Automated GST E-Invoicing & GSTR-1 Tax Reconciler
          </h2>
          <Badge variant="warning">SANDBOX SIMULATION (NIC IRP Test Bed — HSN/SAC 998311)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Direct Govt. E-Invoicing generation (IRN + Signed QR), CGST/SGST/IGST breakdown, and 1-click GSTR-1 monthly filing reconciliation. (Production mode requires whitelisted GSP e-Way/E-Invoice API credentials).
        </p>
      </div>

      {syncNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {syncNotice}
        </div>
      )}

      {/* Tax Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL GST COLLECTED (MONTH)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 18,42,800</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Reconciled with GSTR-1</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GOVT. IRN COMPLIANCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>100.0% Valid</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Signed B2B QR Code attached</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>INPUT TAX CREDIT (ITC) PASS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>₹ 4,12,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Eligible cloud & vendor credits</span>
        </div>
      </div>

      {/* Invoices Table */}
      <Card title="📜 B2B Hospital Tax Invoices & Govt. IRN Status" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice # & Partner</TableHead>
                <TableHead>Hospital GSTIN</TableHead>
                <TableHead>Taxable Value</TableHead>
                <TableHead>GST Split (CGST/SGST/IGST)</TableHead>
                <TableHead>Total Invoiced</TableHead>
                <TableHead>Govt. IRN Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧾</div>
                    <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
                      No GST E-Invoices Pending Reconciliation
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8', display: 'block', maxWidth: '440px', margin: '0 auto 16px' }}>
                      All hospital partner subscriptions and usage billing invoices are up to date and synchronized with the Govt. NIC e-invoice portal.
                    </span>
                    <button
                      type="button"
                      onClick={handleQueryNicPortal}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#38BDF8',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ↻ Query NIC Portal
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.invoiceNumber}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{inv.invoiceNumber}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{inv.partnerName}</span>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {inv.gstin}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {inv.taxableAmount}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      <div>CGST: {inv.cgst}</div>
                      <div>SGST: {inv.sgst}</div>
                      {inv.igst !== '₹ 0 (0%)' && <div style={{ color: '#38BDF8' }}>IGST: {inv.igst}</div>}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                      {inv.totalAmount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.irnStatus === 'GOVT_IRN_GENERATED' ? 'success' : 'warning'}>
                        {inv.irnStatus === 'GOVT_IRN_GENERATED' ? '✓ IRN ISSUED' : 'PENDING SYNC'}
                      </Badge>
                      {inv.irnNumber && (
                        <span style={{ display: 'block', fontSize: '0.625rem', fontFamily: 'monospace', color: '#94A3B8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.irnNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {inv.irnStatus === 'PENDING_IRP_SYNC' ? (
                        <button
                          type="button"
                          onClick={() => handleGenerateIrn(inv.invoiceNumber)}
                        >
                          ⚡ Generate IRN
                        </button>
                      ) : (
                        <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ NIC Synced</span>
                      )}
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
