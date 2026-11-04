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
import type { FactoredClaimRecord } from '../../services/monetization-godmode-service.js';

const INITIAL_FACTORED_CLAIMS: FactoredClaimRecord[] = [
  {
    id: 'FCT-2026-001',
    claimNumber: 'CLM-STAR-88192',
    hospitalPartnerId: 'PARTNER-001',
    hospitalName: 'Metropolitan Multispecialty Hospital',
    patientName: 'Kishore Kumar',
    patientUhid: 'UHID-2026-102',
    insurancePayer: 'STAR_HEALTH',
    totalClaimAmountInr: 125000,
    advancedPercent: 80,
    advancedAmountInr: 100000,
    factoringFeePercent: 2.0,
    factoringFeeInr: 2500,
    escrowReserveInr: 22500,
    status: 'ADVANCED_DAY_0',
    disbursedAt: '2026-11-01T10:30:00.000Z',
    reconciliationAuditSignature: 'sig_fct_88192_verified'
  },
  {
    id: 'FCT-2026-002',
    claimNumber: 'CLM-HDFC-99301',
    hospitalPartnerId: 'PARTNER-001',
    hospitalName: 'Metropolitan Multispecialty Hospital',
    patientName: 'Sunita Deshmukh',
    patientUhid: 'UHID-2026-108',
    insurancePayer: 'HDFC_ERGO',
    totalClaimAmountInr: 85000,
    advancedPercent: 80,
    advancedAmountInr: 68000,
    factoringFeePercent: 2.0,
    factoringFeeInr: 1700,
    escrowReserveInr: 15300,
    status: 'PENDING_ADVANCE',
    reconciliationAuditSignature: 'sig_fct_99301_pending'
  },
  {
    id: 'FCT-2026-003',
    claimNumber: 'CLM-CARE-77211',
    hospitalPartnerId: 'PARTNER-004',
    hospitalName: 'City Heart Diagnostics Center',
    patientName: 'Rameshwar Lal',
    patientUhid: 'UHID-2026-319',
    insurancePayer: 'CARE_HEALTH',
    totalClaimAmountInr: 64000,
    advancedPercent: 80,
    advancedAmountInr: 51200,
    factoringFeePercent: 2.5,
    factoringFeeInr: 1600,
    escrowReserveInr: 11200,
    status: 'PENDING_ADVANCE',
    reconciliationAuditSignature: 'sig_fct_77211_pending'
  }
];

export const TpaClaimFactoringPanel: React.FC = () => {
  const [claims, setClaims] = useState<FactoredClaimRecord[]>(INITIAL_FACTORED_CLAIMS);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDisburseDay0 = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'ADVANCED_DAY_0',
              disbursedAt: new Date().toISOString(),
              reconciliationAuditSignature: `sig_fct_${Date.now()}_disbursed`
            }
          : c
      )
    );
    const target = claims.find((c) => c.id === claimId);
    setNotice(
      `⚡ ₹${target?.advancedAmountInr.toLocaleString('en-IN')} (80% Day-0 Advance) disbursed to ${target?.hospitalName} via Instant IMPS/RTGS! DocSearch Factoring Fee Earned: ₹${target?.factoringFeeInr.toLocaleString('en-IN')}`
    );
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSettleByInsurer = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'SETTLED_BY_INSURER',
              settledAt: new Date().toISOString(),
              finalSettledAmountInr: c.totalClaimAmountInr
            }
          : c
      )
    );
    setNotice(`✓ Claim ${claimId} 100% settled by TPA Insurer! Escrow reserve released to hospital.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const totalVolume = claims.reduce((sum, c) => sum + c.totalClaimAmountInr, 0);
  const totalAdvanced = claims
    .filter((c) => c.status === 'ADVANCED_DAY_0' || c.status === 'SETTLED_BY_INSURER')
    .reduce((sum, c) => sum + c.advancedAmountInr, 0);
  const totalFeeRevenue = claims
    .filter((c) => c.status === 'ADVANCED_DAY_0' || c.status === 'SETTLED_BY_INSURER')
    .reduce((sum, c) => sum + c.factoringFeeInr, 0);
  const pendingCount = claims.filter((c) => c.status === 'PENDING_ADVANCE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
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
              <span style={{ fontSize: '1.5rem' }}>🏦</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                T-0 Cashless Insurance Claim Factoring Desk
              </h2>
              <Badge variant="success">Fintech Revenue Engine (1.5%–2.5% Net Margin)</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Eliminate the 45-day hospital cash crunch. DocSearch advances 80% Day-0 liquidity to hospital partners upon patient discharge and recovers 100% from insurers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#34D399',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              🔒 100% Default Protection via TPA Escrow Lien
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL CLAIM VOLUME</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {totalVolume.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>{claims.length} Total Claims Processed</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>DAY-0 LIQUIDITY ADVANCED</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {totalAdvanced.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>80% disbursed instant</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #10B981' }}>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>DOCSEARCH FACTORING FEES</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {totalFeeRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>Avg 2.0% Take Rate</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>PENDING DISBURSEMENTS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px', fontFamily: 'monospace' }}>
              {pendingCount} Pending
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Awaiting 1-click trigger</span>
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

      {/* Claims Ledger Table */}
      <Card title="📜 Hospital Cashless Insurance Claims & Day-0 Liquidity Queue" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim # & Patient</TableHead>
                <TableHead>Hospital Facility</TableHead>
                <TableHead>TPA Insurer</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Total Claim</TableHead>
                <TableHead style={{ textAlign: 'right' }}>80% Advance</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Fee (2%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>1-Click Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{c.claimNumber}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{c.patientName} • {c.patientUhid}</div>
                  </TableCell>

                  <TableCell>
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 600 }}>{c.hospitalName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{c.hospitalPartnerId}</div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="neutral">{c.insurancePayer.replace('_', ' ')}</Badge>
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#F8FAFC' }}>
                    ₹ {c.totalClaimAmountInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                    ₹ {c.advancedAmountInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#10B981' }}>
                    +₹ {c.factoringFeeInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell>
                    {c.status === 'PENDING_ADVANCE' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        PENDING ADVANCE
                      </span>
                    )}
                    {c.status === 'ADVANCED_DAY_0' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        ✓ ADVANCED DAY-0
                      </span>
                    )}
                    {c.status === 'SETTLED_BY_INSURER' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        SETTLED BY INSURER
                      </span>
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    {c.status === 'PENDING_ADVANCE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDisburseDay0(c.id)}
                        style={{ fontWeight: 800, backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16' }}
                      >
                        ⚡ Disburse 80% Advance
                      </Button>
                    )}
                    {c.status === 'ADVANCED_DAY_0' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSettleByInsurer(c.id)}
                        style={{ fontWeight: 700 }}
                      >
                        Reconcile TPA Settlement
                      </Button>
                    )}
                    {c.status === 'SETTLED_BY_INSURER' && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Archived & Audited
                      </span>
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
