import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface InsuranceClaim {
  claimId: string;
  patientName: string;
  policyNumber: string;
  tpaProvider: string;
  hospitalName: string;
  claimedAmount: string;
  approvedAmount: string;
  copayDeductible: string;
  claimStatus: 'SETTLED_DISBURSED' | 'PRE_AUTH_APPROVED' | 'IN_ADJUDICATION';
  claimDate: string;
}

const INITIAL_CLAIMS: InsuranceClaim[] = [
  {
    claimId: 'CLM-TPA-901',
    patientName: 'Gurpreet Singh',
    policyNumber: 'STAR-HEALTH-FLOATER-99120',
    tpaProvider: 'Star Health & Allied Insurance',
    hospitalName: 'Apollo Hospitals (New Delhi)',
    claimedAmount: '₹ 85,000',
    approvedAmount: '₹ 80,000',
    copayDeductible: '₹ 5,000',
    claimStatus: 'PRE_AUTH_APPROVED',
    claimDate: 'Today, 10:00 AM'
  },
  {
    claimId: 'CLM-TPA-902',
    patientName: 'Kavita Joshi',
    policyNumber: 'PMJAY-ABHA-882910',
    tpaProvider: 'Ayushman Bharat (PMJAY)',
    hospitalName: 'Max Super Speciality (Saket)',
    claimedAmount: '₹ 45,000',
    approvedAmount: '₹ 45,000',
    copayDeductible: '₹ 0 (100% Cashless)',
    claimStatus: 'SETTLED_DISBURSED',
    claimDate: 'Yesterday'
  },
  {
    claimId: 'CLM-TPA-903',
    patientName: 'Arun Kumar Nambiar',
    policyNumber: 'HDFC-ERGO-MEDICLAIM-4192',
    tpaProvider: 'Medi Assist TPA / HDFC ERGO',
    hospitalName: 'Manipal Hospital (Bengaluru)',
    claimedAmount: '₹ 1,20,000',
    approvedAmount: '₹ 1,12,000',
    copayDeductible: '₹ 8,000',
    claimStatus: 'SETTLED_DISBURSED',
    claimDate: '2 days ago'
  }
];

export const TpaInsuranceClaimsSettlementView: React.FC = () => {
  const [claims, setClaims] = useState<InsuranceClaim[]>(INITIAL_CLAIMS);
  const [settleNotice, setSettleNotice] = useState<string | null>(null);

  const handleSettleClaim = (cId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.claimId === cId ? { ...c, claimStatus: 'SETTLED_DISBURSED' } : c
      )
    );
    setSettleNotice(`✓ Cashless Insurance Claim "${cId}" successfully settled: ₹ 80,000 disbursed directly to Hospital Escrow via NEFT/RTGS!`);
    setTimeout(() => setSettleNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🏥 TPA & Cashless Hospital Insurance Claims Settlement Reconciler
          </h2>
          <Badge variant="success">● Ayushman Bharat PMJAY & Private TPA Gateway Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time cashless pre-authorization, hospital bill adjudication, patient co-pay deduction, and automated TPA settlement ledger
        </p>
      </div>

      {settleNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {settleNotice}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL CASHLESS SETTLED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>₹ 42,80,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% On-time TPA payout</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AVERAGE CLAIM APPROVAL</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>14 Minutes</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Direct NHA & TPA API sync</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PMJAY BENEFICIARY CLAIMS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>1,240 Claims</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero out-of-pocket for patients</span>
        </div>
      </div>

      {/* Claims Table */}
      <Card title="📜 Cashless Hospital Insurance Claims Ledger" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID & Patient</TableHead>
                <TableHead>TPA / Insurer</TableHead>
                <TableHead>Hospital Facility</TableHead>
                <TableHead>Claimed Amount</TableHead>
                <TableHead>Approved Cashless</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((c) => (
                <TableRow key={c.claimId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.patientName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{c.claimId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <strong>{c.tpaProvider}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8' }}>{c.policyNumber}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {c.hospitalName}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>
                    {c.claimedAmount}
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#10B981' }}>
                    {c.approvedAmount}
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8' }}>Co-Pay: {c.copayDeductible}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.claimStatus === 'SETTLED_DISBURSED' ? 'success' : 'primary'}>
                      {c.claimStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {c.claimStatus === 'PRE_AUTH_APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handleSettleClaim(c.claimId)}
                        style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ⚡ Settle Payout
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
