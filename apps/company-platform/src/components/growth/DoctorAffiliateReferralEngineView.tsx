import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface AffiliateRecord {
  id: string;
  referrerName: string;
  referrerType: 'DOCTOR' | 'HOSPITAL_NETWORK' | 'PHARMACY_PARTNER';
  referralCode: string;
  totalReferredPatients: number;
  totalCommissionEarned: string;
  pendingPayout: string;
  payoutStatus: 'PAID_OUT' | 'PENDING_DISBURSEMENT';
}

const INITIAL_AFFILIATES: AffiliateRecord[] = [
  {
    id: 'AFF-DOC-01',
    referrerName: 'Dr. Alok Verma (Cardiologist)',
    referrerType: 'DOCTOR',
    referralCode: 'DR_ALOK_CARDIO',
    totalReferredPatients: 142,
    totalCommissionEarned: '₹ 42,600',
    pendingPayout: '₹ 8,400',
    payoutStatus: 'PENDING_DISBURSEMENT'
  },
  {
    id: 'AFF-HOSP-02',
    referrerName: 'Care Diagnostic Labs Network (NCR)',
    referrerType: 'PHARMACY_PARTNER',
    referralCode: 'CARE_LABS_2026',
    totalReferredPatients: 380,
    totalCommissionEarned: '₹ 1,14,000',
    pendingPayout: '₹ 0',
    payoutStatus: 'PAID_OUT'
  },
  {
    id: 'AFF-DOC-03',
    referrerName: 'Dr. Shalini Iyer (Pediatrician)',
    referrerType: 'DOCTOR',
    referralCode: 'DR_SHALINI_KIDS',
    totalReferredPatients: 96,
    totalCommissionEarned: '₹ 28,800',
    pendingPayout: '₹ 5,200',
    payoutStatus: 'PENDING_DISBURSEMENT'
  }
];

export const DoctorAffiliateReferralEngineView: React.FC = () => {
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>(INITIAL_AFFILIATES);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const handleDisburseCommission = (aId: string) => {
    setAffiliates((prev) =>
      prev.map((a) =>
        a.id === aId ? { ...a, payoutStatus: 'PAID_OUT', pendingPayout: '₹ 0' } : a
      )
    );
    setPayoutNotice(`✓ Affiliate commission for "${aId}" successfully transferred to Doctor bank account via UPI Payout!`);
    setTimeout(() => setPayoutNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🔗 Doctor & Hospital Affiliate Referral Commission Engine
          </h2>
          <Badge variant="success">● Multi-Tier Referral Tracking & Instant UPI Payout Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Transparent referral commission management rewarding doctors and diagnostic partners for bringing patients into the DocSearch network
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
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL AFFILIATE COMMISSIONS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 18,50,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% On-time payout ledger</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PATIENTS REFERRED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>6,240 Patients</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>High LTV healthcare cohort</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ACTIVE REFERRAL DOCTORS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>410 Doctors</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Organic community flywheel</span>
        </div>
      </div>

      {/* Affiliate Table */}
      <Card title="📜 Doctor & Clinic Affiliate Partner Commission Ledger" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer Name</TableHead>
                <TableHead>Partner Type</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Referred Patients</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Pending Payout</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{a.referrerName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{a.id}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.referrerType === 'DOCTOR' ? 'primary' : 'neutral'}>
                      {a.referrerType}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {a.referralCode}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {a.totalReferredPatients}
                  </TableCell>
                  <TableCell style={{ color: '#10B981', fontWeight: 800 }}>
                    {a.totalCommissionEarned}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: a.pendingPayout !== '₹ 0' ? '#F59E0B' : '#94A3B8' }}>
                    {a.pendingPayout}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {a.payoutStatus === 'PENDING_DISBURSEMENT' ? (
                      <button
                        type="button"
                        onClick={() => handleDisburseCommission(a.id)}
                        style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ⚡ Disburse UPI
                      </button>
                    ) : (
                      <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ Disbursed</span>
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
