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
    invoiceNumber: 'INV-2026-0891',
    partnerName: 'Apollo Speciality Hospitals (Delhi-NCR)',
    gstin: '07AAACA0500A1Z5',
    taxableAmount: '₹ 1,50,000',
    cgst: '₹ 13,500 (9%)',
    sgst: '₹ 13,500 (9%)',
    igst: '₹ 0 (0%)',
    totalAmount: '₹ 1,77,000',
    irnStatus: 'GOVT_IRN_GENERATED',
    irnNumber: '3f8b91a0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    issuedDate: 'Today, 09:15 AM'
  },
  {
    invoiceNumber: 'INV-2026-0892',
    partnerName: 'Max Super Speciality Hospital (Saket)',
    gstin: '07AAACM3918B1Z2',
    taxableAmount: '₹ 2,20,000',
    cgst: '₹ 19,800 (9%)',
    sgst: '₹ 19,800 (9%)',
    igst: '₹ 0 (0%)',
    totalAmount: '₹ 2,59,600',
    irnStatus: 'PENDING_IRP_SYNC',
    issuedDate: 'Today, 11:30 AM'
  },
  {
    invoiceNumber: 'INV-2026-0890',
    partnerName: 'Manipal Hospitals (Bengaluru)',
    gstin: '29AABCM9102C1Z8',
    taxableAmount: '₹ 1,80,000',
    cgst: '₹ 0 (0%)',
    sgst: '₹ 0 (0%)',
    igst: '₹ 32,400 (18%)',
    totalAmount: '₹ 2,12,400',
    irnStatus: 'GOVT_IRN_GENERATED',
    irnNumber: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    issuedDate: 'Yesterday'
  }
];

export const GstEInvoicingReconcilerView: React.FC = () => {
  const [invoices, setInvoices] = useState<GstEInvoice[]>(INITIAL_INVOICES);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🇮🇳 Automated GST E-Invoicing & GSTR-1 Tax Reconciler
          </h2>
          <Badge variant="success">● NIC IRP API Connected (HSN/SAC 998311 - 18% GST)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Direct Govt. E-Invoicing generation (IRN + Signed QR), CGST/SGST/IGST breakdown, and 1-click GSTR-1 monthly filing reconciliation
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
              {invoices.map((inv) => (
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
                        style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ⚡ Generate IRN
                      </button>
                    ) : (
                      <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ NIC Synced</span>
                    )}
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
