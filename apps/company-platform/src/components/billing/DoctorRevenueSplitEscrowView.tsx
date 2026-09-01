import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface DoctorPayout {
  payoutId: string;
  doctorName: string;
  doctorSpecialty: string;
  panNumber: string;
  grossConsultationFees: string;
  hospitalPlatformShare: string;
  tdsDeduction: string;
  netDoctorPayable: string;
  disbursementStatus: 'DISBURSED_IMPS' | 'READY_FOR_PAYOUT';
  payoutPeriod: string;
}

const INITIAL_PAYOUTS: DoctorPayout[] = [
  {
    payoutId: 'PAY-DOC-881',
    doctorName: 'Dr. Vivek Sharma, MD',
    doctorSpecialty: 'Interventional Cardiology',
    panNumber: 'ABCPS1290K',
    grossConsultationFees: '₹ 2,40,000 (120 Consults)',
    hospitalPlatformShare: '₹ 48,000 (20%)',
    tdsDeduction: '₹ 19,200 (10% Sec 194J)',
    netDoctorPayable: '₹ 1,72,800',
    disbursementStatus: 'READY_FOR_PAYOUT',
    payoutPeriod: 'Aug 16 - Aug 31, 2026'
  },
  {
    payoutId: 'PAY-DOC-882',
    doctorName: 'Dr. Priya Nambiar, MS',
    doctorSpecialty: 'Obstetrics & Gynaecology',
    panNumber: 'BNMPN4821M',
    grossConsultationFees: '₹ 1,80,000 (90 Consults)',
    hospitalPlatformShare: '₹ 36,000 (20%)',
    tdsDeduction: '₹ 14,400 (10% Sec 194J)',
    netDoctorPayable: '₹ 1,29,600',
    disbursementStatus: 'DISBURSED_IMPS',
    payoutPeriod: 'Aug 16 - Aug 31, 2026'
  },
  {
    payoutId: 'PAY-DOC-883',
    doctorName: 'Dr. Amitav Sen, MD',
    doctorSpecialty: 'Paediatrics & Neonatology',
    panNumber: 'CKPAS8912P',
    grossConsultationFees: '₹ 1,50,000 (100 Consults)',
    hospitalPlatformShare: '₹ 30,000 (20%)',
    tdsDeduction: '₹ 12,000 (10% Sec 194J)',
    netDoctorPayable: '₹ 1,08,000',
    disbursementStatus: 'DISBURSED_IMPS',
    payoutPeriod: 'Aug 16 - Aug 31, 2026'
  }
];

export const DoctorRevenueSplitEscrowView: React.FC = () => {
  const [payouts, setPayouts] = useState<DoctorPayout[]>(INITIAL_PAYOUTS);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const handleDisburse = (pId: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.payoutId === pId ? { ...p, disbursementStatus: 'DISBURSED_IMPS' } : p
      )
    );
    setPayoutNotice(`✓ Net Payout for "${pId}" successfully transferred to Doctor Bank Account via RazorpayX IMPS with 10% TDS withholding!`);
    setTimeout(() => setPayoutNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🩺 Doctor Revenue Share & TDS Section 194J Escrow Ledger
          </h2>
          <Badge variant="success">● Automated 80:20 Revenue Split & Form 16A TDS Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time split of doctor consultation fees, automated 10% Section 194J professional tax deduction, and instant IMPS/UPI bank transfers
        </p>
      </div>

      {payoutNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {payoutNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>DOCTOR PAYOUT DISBURSED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 54,20,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Direct bank IMPS transfer</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TDS SEC 194J REMITTED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>₹ 6,02,200</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>10% Income Tax Department challan</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>HOSPITAL PLATFORM SHARE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>₹ 13,55,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>20% Platform margin retained</span>
        </div>
      </div>

      {/* Payouts Table */}
      <Card title="📜 Doctor Bi-Weekly Consultation Revenue Payouts" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor & Specialty</TableHead>
                <TableHead>Doctor PAN</TableHead>
                <TableHead>Gross Consults (100%)</TableHead>
                <TableHead>Platform Fee (20%)</TableHead>
                <TableHead>TDS 194J (10%)</TableHead>
                <TableHead>Net Payable (70%)</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Disbursement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.payoutId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.doctorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{p.doctorSpecialty}</span>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    {p.panNumber}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {p.grossConsultationFees}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {p.hospitalPlatformShare}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700 }}>
                    {p.tdsDeduction}
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981', fontSize: '0.9375rem' }}>
                    {p.netDoctorPayable}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {p.disbursementStatus === 'READY_FOR_PAYOUT' ? (
                      <button
                        type="button"
                        onClick={() => handleDisburse(p.payoutId)}
                        style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ⚡ Disburse IMPS
                      </button>
                    ) : (
                      <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ Transferred</span>
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
