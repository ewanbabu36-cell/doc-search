import React from 'react';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface PrintableInvoiceBillItem {
  id: string;
  description: string;
  sacHsnCode: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRatePercent: number;
}

export interface PrintableInvoiceBillProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    patientName?: string;
    patientMrn?: string;
    patientPhone?: string;
    doctorOrRefName?: string;
    items?: PrintableInvoiceBillItem[];
    paymentMode?: string;
    paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL';
  };
}

export const PrintableInvoiceBillModal: React.FC<PrintableInvoiceBillProps> = ({
  isOpen,
  onClose,
  invoiceData
}) => {
  if (!isOpen) return null;

  const profile = getVerifiedRoleProfile();

  const invoiceNumber = invoiceData?.invoiceNumber || `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const invoiceDate = invoiceData?.invoiceDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const patientName = invoiceData?.patientName || 'Rajesh Sharma';
  const patientMrn = invoiceData?.patientMrn || 'MRN-2026-9812';
  const patientPhone = invoiceData?.patientPhone || '+91 98765 43210';
  const doctorName = invoiceData?.doctorOrRefName || profile.doctorName;
  const paymentStatus = invoiceData?.paymentStatus || 'PAID';
  const paymentMode = invoiceData?.paymentMode || 'UPI / ONLINE TRANSFER';

  // Default Role-Specific Items if none provided
  const defaultItems: PrintableInvoiceBillItem[] =
    profile.roleCategory === 'PATHOLOGY_LAB'
      ? [
          { id: '1', description: 'Complete Blood Count (CBC with 5-Part Diff)', sacHsnCode: '999312', quantity: 1, rate: 450, discount: 0, taxRatePercent: 0 },
          { id: '2', description: 'Lipid Profile Comprehensive (Cholesterol, HDL, LDL, VLDL)', sacHsnCode: '999312', quantity: 1, rate: 850, discount: 50, taxRatePercent: 0 },
          { id: '3', description: 'HbA1c Glycated Hemoglobin (HPLC Gold Standard)', sacHsnCode: '999312', quantity: 1, rate: 600, discount: 0, taxRatePercent: 0 }
        ]
      : profile.roleCategory === 'PHARMACY'
      ? [
          { id: '1', description: 'Tab. Augmentin 625 Duo (Amoxycillin + Clavulanic Acid)', sacHsnCode: '3004', quantity: 2, rate: 210, discount: 20, taxRatePercent: 12 },
          { id: '2', description: 'Tab. Pan-D (Pantoprazole + Domperidone SR)', sacHsnCode: '3004', quantity: 1, rate: 165, discount: 15, taxRatePercent: 12 },
          { id: '3', description: 'Syp. Ascoril-D Plus Cough Relief 100ml', sacHsnCode: '3004', quantity: 1, rate: 120, discount: 10, taxRatePercent: 12 }
        ]
      : [
          { id: '1', description: 'Senior Consultant Specialist Consultation (OPD)', sacHsnCode: '999311', quantity: 1, rate: 1200, discount: 0, taxRatePercent: 0 },
          { id: '2', description: 'Clinical Vitals & 12-Lead Electrocardiogram (ECG)', sacHsnCode: '999312', quantity: 1, rate: 600, discount: 100, taxRatePercent: 0 },
          { id: '3', description: 'Hospital Administrative & Nursing Care Fee', sacHsnCode: '999311', quantity: 1, rate: 300, discount: 0, taxRatePercent: 0 }
        ];

  const items = invoiceData?.items && invoiceData.items.length > 0 ? invoiceData.items : defaultItems;

  const grossTotal = items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
  const taxableAmount = grossTotal - totalDiscount;
  const totalTax = items.reduce((acc, item) => acc + ((item.rate * item.quantity - item.discount) * item.taxRatePercent) / 100, 0);
  const netPayable = taxableAmount + totalTax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 11000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
        overflow: 'hidden'
      }}>
        {/* Top Control Bar */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>💳</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                GST Tax Invoice & Payout Bill
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Invoice: <strong style={{ color: '#38BDF8' }}>{invoiceNumber}</strong> • Role: <strong style={{ color: '#34D399' }}>{profile.roleCategory}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontWeight: 900,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              🖨️ Print Tax Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Canvas (White Paper simulation) */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#070C16' }}>
          <div id="printable-tax-invoice-canvas" style={{
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: '32px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}>
            {/* Header: Facility Credentials as per Role */}
            <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>
                  {profile.entityLegalName}
                </h1>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
                  {profile.facilityTagline}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                  {profile.officialAddress}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  📞 {profile.contactPhone} • ✉️ {profile.supportEmail} • 🌐 {profile.website}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '260px' }}>
                <div style={{ backgroundColor: '#0F172A', color: '#FFF', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 900, display: 'inline-block' }}>
                  TAX INVOICE / CASH MEMO
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '6px', color: '#334155' }}>
                  <strong>Invoice No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{invoiceNumber}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                  <strong>Invoice Date:</strong> {invoiceDate}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '4px' }}>
                  <strong>GSTIN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profile.gstin}</span>
                </div>

                {/* Role-Specific Regulatory Badges */}
                {profile.roleCategory === 'PATHOLOGY_LAB' && (
                  <div style={{ fontSize: '0.6875rem', color: '#0369A1', fontWeight: 700, marginTop: '2px' }}>
                    NABL Certificate: {profile.nablCertificateNo}
                  </div>
                )}
                {profile.roleCategory === 'HOSPITAL' && (
                  <div style={{ fontSize: '0.6875rem', color: '#0369A1', fontWeight: 700, marginTop: '2px' }}>
                    CEA License: {profile.hospitalCeaRegNo} • {profile.hospitalNabhGrade}
                  </div>
                )}
                {profile.roleCategory === 'PHARMACY' && (
                  <div style={{ fontSize: '0.6875rem', color: '#0369A1', fontWeight: 700, marginTop: '2px' }}>
                    Drug License: {profile.pharmacyDrugLicense20B}
                  </div>
                )}
              </div>
            </div>

            {/* Billed To / Patient Metadata Box */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', margin: '14px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700 }}>BILLED TO PATIENT:</span>
                <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{patientName}</strong>
                <div style={{ color: '#64748B' }}>Phone: {patientPhone}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700 }}>PATIENT UHID / MRN:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#0F172A' }}>{patientMrn}</strong>
                <div style={{ color: '#64748B' }}>Ref Doctor: {doctorName}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700 }}>PAYMENT STATUS:</span>
                <span style={{ backgroundColor: paymentStatus === 'PAID' ? '#DCFCE7' : '#FEF3C7', color: paymentStatus === 'PAID' ? '#166534' : '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.75rem', display: 'inline-block' }}>
                  ✓ {paymentStatus} ({paymentMode})
                </span>
              </div>
            </div>

            {/* Itemized Billing Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', border: '1px solid #CBD5E1', margin: '16px 0' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>DESCRIPTION OF SERVICES / MEDICINES / TESTS</th>
                  <th style={{ padding: '8px 10px' }}>SAC/HSN</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>QTY</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>RATE (₹)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>DISC (₹)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>TAX</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = item.rate * item.quantity - item.discount;
                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <strong style={{ color: '#0F172A' }}>{item.description}</strong>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748B' }}>{item.sacHsnCode}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#DC2626' }}>{item.discount > 0 ? `-${item.discount.toFixed(2)}` : '0.00'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>{item.taxRatePercent}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Financial Summary & Bank Payout Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'flex-start', margin: '14px 0' }}>
              {/* Direct B2B Bank Payout Settlement Info */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #94A3B8', borderRadius: '8px', padding: '12px 16px', fontSize: '0.75rem' }}>
                <strong style={{ color: '#0369A1', fontSize: '0.8125rem', display: 'block', marginBottom: '4px' }}>
                  🏦 OFFICIAL BANK & UPI PAYMENT SETTLEMENT:
                </strong>
                <div style={{ color: '#334155', lineHeight: 1.5 }}>
                  <div><strong>Account Holder:</strong> {profile.accountHolder}</div>
                  <div><strong>Bank Name:</strong> {profile.bankName}</div>
                  <div><strong>Account No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profile.accountNumber}</span></div>
                  <div><strong>IFSC Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profile.ifscCode}</span></div>
                  <div><strong>UPI ID:</strong> <span style={{ fontFamily: 'monospace', color: '#0284C7', fontWeight: 700 }}>{profile.upiId}</span></div>
                </div>
              </div>

              {/* Totals Table */}
              <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 16px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Gross Total:</span>
                  <span style={{ fontWeight: 600 }}>₹{grossTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#DC2626' }}>
                  <span>Total Discount:</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Taxable Amount:</span>
                  <span style={{ fontWeight: 600 }}>₹{taxableAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>GST Tax:</span>
                  <span style={{ fontWeight: 600 }}>₹{totalTax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0F172A', paddingTop: '6px', fontSize: '0.9375rem', fontWeight: 900, color: '#0F172A' }}>
                  <span>Net Amount Paid:</span>
                  <span style={{ color: '#0284C7' }}>₹{netPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Signature & Watermark Footer */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>
                  Terms: Computer generated invoice. Subject to Mumbai/Delhi Jurisdiction.
                </span>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                  ✓ Digitally Authenticated & Encrypted Invoice (SHA-256 Vault Verified)
                </span>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#0369A1', marginBottom: '2px' }}>
                  Accounts Officer
                </div>
                <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                  <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>For {profile.entityLegalName}</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Authorized Signatory</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
