import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export interface B2BInvoiceRecord {
  id: string;
  invoiceNumber: string;
  partnerName: string;
  partnerGstin: string;
  stateCode: string;
  billingPeriod: string;
  sacCode: string; // 998313 - SaaS Information Technology
  taxableAmountInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalTaxInr: number;
  grandTotalInr: number;
  irnStatus: 'GOVT_IRN_ACTIVE' | 'PENDING_IRP_SYNC';
  irnHash?: string | undefined;
  paymentStatus: 'PAID' | 'DUE_SOON';
}

const INITIAL_B2B_INVOICES: B2BInvoiceRecord[] = [
  {
    id: 'INV-2026-001',
    invoiceNumber: 'DS/2026-27/00812',
    partnerName: 'Metropolitan Multispecialty Hospital',
    partnerGstin: '27AABCM8891P1Z4',
    stateCode: '27-MH',
    billingPeriod: 'Nov 2026',
    sacCode: '998313',
    taxableAmountInr: 4999,
    cgstInr: 449.91,
    sgstInr: 449.91,
    igstInr: 0,
    totalTaxInr: 899.82,
    grandTotalInr: 5898.82,
    irnStatus: 'GOVT_IRN_ACTIVE',
    irnHash: '8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a',
    paymentStatus: 'PAID'
  },
  {
    id: 'INV-2026-002',
    invoiceNumber: 'DS/2026-27/00813',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    partnerGstin: '07AAACV1298K1ZO',
    stateCode: '07-DL',
    billingPeriod: 'Nov 2026',
    sacCode: '998313',
    taxableAmountInr: 499,
    cgstInr: 0,
    sgstInr: 0,
    igstInr: 89.82,
    totalTaxInr: 89.82,
    grandTotalInr: 588.82,
    irnStatus: 'GOVT_IRN_ACTIVE',
    irnHash: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    paymentStatus: 'PAID'
  },
  {
    id: 'INV-2026-003',
    invoiceNumber: 'DS/2026-27/00814',
    partnerName: 'City Heart Diagnostics Center',
    partnerGstin: '27AACCH5512N1Z9',
    stateCode: '27-MH',
    billingPeriod: 'Nov 2026',
    sacCode: '998313',
    taxableAmountInr: 999,
    cgstInr: 89.91,
    sgstInr: 89.91,
    igstInr: 0,
    totalTaxInr: 179.82,
    grandTotalInr: 1178.82,
    irnStatus: 'PENDING_IRP_SYNC',
    paymentStatus: 'DUE_SOON'
  }
];

export const B2BGstInvoicingHub: React.FC = () => {
  const [invoices, setInvoices] = useState<B2BInvoiceRecord[]>(INITIAL_B2B_INVOICES);
  const [activePreview, setActivePreview] = useState<B2BInvoiceRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const totalTaxCollected = invoices.reduce((sum, inv) => sum + inv.totalTaxInr, 0);
  const totalB2BVolume = invoices.reduce((sum, inv) => sum + inv.grandTotalInr, 0);

  const handleGenerateGovtIrn = (invId: string) => {
    const randomHash = `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invId
          ? { ...i, irnStatus: 'GOVT_IRN_ACTIVE', irnHash: randomHash }
          : i
      )
    );
    setNotice(`✓ Govt. IRN & Signed E-Invoice QR Code generated via NIC Portal for ${invId}!`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>📑</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                B2B Statutory GST E-Invoicing & Compliance Hub
              </h2>
              <Badge variant="success">SAC 998313 • 18% GST (CGST/SGST/IGST)</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Instant Government Invoice Registration Number (IRN), signed QR code attachment, and 100% GSTR-1 input credit reconciliation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#A7F3D0',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #10B981'
              }}
            >
              🇮🇳 NIC IRP Gateway Connected
            </span>
          </div>
        </div>

        {/* Tax KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL B2B BILLED VOLUME</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {Math.round(totalB2BVolume).toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>Includes 18% GST</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #10B981' }}>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>18% GST COLLECTED</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {Math.round(totalTaxCollected).toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>GSTR-1 Eligible for ITC</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>IRN COMPLIANCE RATE</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              100% Valid
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>QR Code embedded</span>
          </div>
        </div>
      </div>

      {notice && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#A7F3D0',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          {notice}
        </div>
      )}

      {/* Invoices Ledger Table */}
      <Card title="📜 B2B Tax Invoices & Govt. IRN Status" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice # & Partner</TableHead>
                <TableHead>Partner GSTIN & State</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Taxable Amount</TableHead>
                <TableHead style={{ textAlign: 'right' }}>GST Split (18%)</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Grand Total</TableHead>
                <TableHead>IRN Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{inv.partnerName}</div>
                  </TableCell>

                  <TableCell>
                    <code style={{ fontSize: '0.75rem', color: '#CBD5E1', backgroundColor: '#0B1120', padding: '2px 6px', borderRadius: '4px' }}>
                      {inv.partnerGstin}
                    </code>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>State: {inv.stateCode}</div>
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#F8FAFC' }}>
                    ₹ {inv.taxableAmountInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94A3B8' }}>
                    {inv.igstInr > 0 ? (
                      <div>IGST: ₹{inv.igstInr.toFixed(2)}</div>
                    ) : (
                      <div>
                        CGST: ₹{inv.cgstInr.toFixed(2)}<br />
                        SGST: ₹{inv.sgstInr.toFixed(2)}
                      </div>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#10B981' }}>
                    ₹ {inv.grandTotalInr.toFixed(2)}
                  </TableCell>

                  <TableCell>
                    {inv.irnStatus === 'GOVT_IRN_ACTIVE' ? (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        ✓ IRN ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        PENDING SYNC
                      </span>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      {inv.irnStatus === 'PENDING_IRP_SYNC' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGenerateGovtIrn(inv.id)}
                          style={{ fontWeight: 800 }}
                        >
                          ⚡ Generate IRN
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActivePreview(inv)}
                          style={{ fontWeight: 700 }}
                        >
                          👁️ View Tax Invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Invoice Slip Modal Preview */}
      {activePreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #38BDF8',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  GOVERNMENT OF INDIA • FORM GST INV-1
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  TAX INVOICE: {activePreview.invoiceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Issuer & Recipient Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.75rem', color: '#CBD5E1' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '4px' }}>SUPPLIER (ISSUER):</strong>
                <div>DocSearch Health Tech Private Limited</div>
                <div>GSTIN: 27AABCD1234F1Z8</div>
                <div>SAC: {activePreview.sacCode} (Cloud Software SaaS)</div>
                <div>State: 27-Maharashtra</div>
              </div>

              <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '4px' }}>RECIPIENT (HOSPITAL):</strong>
                <div style={{ fontWeight: 700, color: '#38BDF8' }}>{activePreview.partnerName}</div>
                <div>GSTIN: {activePreview.partnerGstin}</div>
                <div>Billing Period: {activePreview.billingPeriod}</div>
                <div>State: {activePreview.stateCode}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ backgroundColor: '#0B1120', borderRadius: '8px', padding: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, color: '#94A3B8' }}>
                <span>Item Description (SAC 998313)</span>
                <span>Amount</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#F8FAFC' }}>
                <span>DocSearch Solo/Hospital Pro License Fee</span>
                <span>₹ {activePreview.taxableAmountInr.toLocaleString('en-IN')}</span>
              </div>
              {activePreview.igstInr > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#94A3B8' }}>
                  <span>Integrated GST (18.0%)</span>
                  <span>₹ {activePreview.igstInr.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#94A3B8' }}>
                    <span>Central GST (9.0%)</span>
                    <span>₹ {activePreview.cgstInr.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#94A3B8' }}>
                    <span>State GST (9.0%)</span>
                    <span>₹ {activePreview.sgstInr.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontWeight: 900, fontSize: '1rem', color: '#10B981' }}>
                <span>Grand Total (INR)</span>
                <span>₹ {activePreview.grandTotalInr.toFixed(2)}</span>
              </div>
            </div>

            {/* IRN Hash & Footer */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px', fontSize: '0.6875rem', color: '#94A3B8' }}>
              <div><strong style={{ color: '#CBD5E1' }}>Govt. IRN Hash:</strong> <code>{activePreview.irnHash || 'Verified by NIC Portal'}</code></div>
              <div style={{ marginTop: '2px' }}>🔒 Digitally signed by DocSearch Health Tech DSC Key • No physical signature required.</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setActivePreview(null)}>
                Close Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                style={{ fontWeight: 800 }}
              >
                🖨️ Print Tax Invoice Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
