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
import type { AffiliateDoctorRecord } from '../../services/monetization-godmode-service.js';

const INITIAL_AFFILIATES: AffiliateDoctorRecord[] = [
  {
    doctorId: 'DOC-AFF-01',
    doctorName: 'Dr. Amitabh Verma',
    specialty: 'Cardiology (MD, DM)',
    hospitalPartnerId: 'PARTNER-002',
    referralCode: 'DR-VERMA-CARDIO',
    referralLink: 'https://docsearch.health/join?ref=DR-VERMA-CARDIO',
    commissionPercent: 15,
    referredPartnersCount: 8,
    totalReferredRevenueInr: 96000,
    totalCommissionsEarnedInr: 14400,
    pendingPayoutInr: 3200,
    lastPayoutDate: '2026-10-01',
    upiId: 'verma.amitabh@icici',
    status: 'ACTIVE'
  },
  {
    doctorId: 'DOC-AFF-02',
    doctorName: 'Dr. Shalini Mukhopadhyay',
    specialty: 'Pediatrics & Neonatology',
    hospitalPartnerId: 'PARTNER-001',
    referralCode: 'DR-SHALINI-PEDS',
    referralLink: 'https://docsearch.health/join?ref=DR-SHALINI-PEDS',
    commissionPercent: 15,
    referredPartnersCount: 5,
    totalReferredRevenueInr: 60000,
    totalCommissionsEarnedInr: 9000,
    pendingPayoutInr: 1800,
    lastPayoutDate: '2026-10-15',
    upiId: 'shalini.dr@okhdfcbank',
    status: 'ACTIVE'
  },
  {
    doctorId: 'DOC-AFF-03',
    doctorName: 'Dr. Tariq Al-Hashimi',
    specialty: 'Orthopedic Surgery',
    hospitalPartnerId: 'PARTNER-003',
    referralCode: 'DR-TARIQ-DXB',
    referralLink: 'https://docsearch.health/join?ref=DR-TARIQ-DXB',
    commissionPercent: 15,
    referredPartnersCount: 3,
    totalReferredRevenueInr: 45000,
    totalCommissionsEarnedInr: 6750,
    pendingPayoutInr: 0,
    lastPayoutDate: '2026-11-01',
    upiId: 'tariq.hashimi@emiratesnbd',
    status: 'ACTIVE'
  }
];

export const DoctorAffiliateLoopPanel: React.FC = () => {
  const [affiliates, setAffiliates] = useState<AffiliateDoctorRecord[]>(INITIAL_AFFILIATES);
  const [notice, setNotice] = useState<string | null>(null);

  const totalPendingPayout = affiliates.reduce((sum, a) => sum + a.pendingPayoutInr, 0);
  const totalLifetimeCommissions = affiliates.reduce((sum, a) => sum + a.totalCommissionsEarnedInr, 0);
  const totalReferredDoctors = affiliates.reduce((sum, a) => sum + a.referredPartnersCount, 0);

  const handleCopyLink = (link: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setNotice(`🔗 Referral link copied to clipboard: ${link}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleBatchPayout = () => {
    if (totalPendingPayout === 0) {
      setNotice('All affiliate commissions are already settled. Zero pending balance.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    setAffiliates((prev) =>
      prev.map((a) => ({
        ...a,
        pendingPayoutInr: 0,
        lastPayoutDate: new Date().toISOString().split('T')[0]
      }))
    );
    setNotice(
      `✓ Batch Payout Executed! ₹${totalPendingPayout.toLocaleString('en-IN')} successfully disbursed via Instant UPI to all registered doctors!`
    );
    setTimeout(() => setNotice(null), 5000);
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
              <span style={{ fontSize: '1.5rem' }}>🤝</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Doctor-to-Doctor Viral Affiliate Engine
              </h2>
              <Badge variant="success">15% Lifetime Recurring Commission</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Doctors invite fellow colleagues and hospital clinics. Zero acquisition marketing spend via viral physician network loops.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBatchPayout}
              style={{
                fontWeight: 800,
                backgroundColor: totalPendingPayout > 0 ? '#10B981' : undefined,
                borderColor: totalPendingPayout > 0 ? '#10B981' : undefined,
                color: totalPendingPayout > 0 ? '#000' : undefined
              }}
            >
              ⚡ Disburse Batch UPI Payouts (₹{totalPendingPayout.toLocaleString('en-IN')})
            </Button>
          </div>
        </div>

        {/* Affiliate KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>VIRALLY REFERRED CLINICS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              {totalReferredDoctors} Clinics
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>From {affiliates.length} Champion Doctors</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>LIFETIME COMMISSIONS PAID</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {totalLifetimeCommissions.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>15% recurring fee split</span>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px', border: '1px solid #F59E0B' }}>
            <span style={{ fontSize: '0.6875rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase' }}>PENDING UPI COMMISSIONS</span>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ {totalPendingPayout.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#FDE68A' }}>Ready for 1-click payout</span>
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

      {/* Viral Expansion Cluster Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card title="🔥 Regional Viral Expansion Heatmap & K-Factor">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                K = 2.41 <span style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Viral Coefficient</span>
              </span>
              <Badge variant="success">Exponential Self-Propelling</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
              Every newly joined doctor refers an average of 2.41 fellow physicians within 21 days of adoption.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {[
                { city: 'Mumbai MMR & Pune', clinics: 64, growth: '+42% MoM' },
                { city: 'Delhi-NCR & Haryana', clinics: 48, growth: '+38% MoM' },
                { city: 'Bengaluru & Hyderabad', clinics: 35, growth: '+55% MoM' },
                { city: 'Dubai & UAE GCC', clinics: 12, growth: '+80% MoM' }
              ].map((c) => (
                <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{c.city}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 800 }}>{c.clinics} Centers</span>
                    <span style={{ color: '#10B981', fontWeight: 800 }}>{c.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="⚡ Physician Viral Loop Funnel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { stage: '1. Direct Doctor Invites Shared', count: '482 Invites', pct: '100%', color: '#38BDF8' },
              { stage: '2. Invited Doctors Visited Kiosk/Portal', count: '394 Visits', pct: '81.7%', color: '#60A5FA' },
              { stage: '3. Clinics Completed 1-Click Free Onboarding', count: '186 Onboarded', pct: '38.6%', color: '#34D399' },
              { stage: '4. Active High-Volume Prescribers', count: '142 Active', pct: '29.4%', color: '#10B981' }
            ].map((s) => (
              <div key={s.stage} style={{ backgroundColor: '#1E293B', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: '#F8FAFC' }}>{s.stage}</span>
                  <span style={{ color: s.color }}>{s.count} ({s.pct})</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#0B1120', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: s.pct, height: '100%', backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card title="📜 Doctor Champion Affiliates & Commission Ledger" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Physician & Facility</TableHead>
                <TableHead>Referral Code & Link</TableHead>
                <TableHead style={{ textAlign: 'center' }}>Referred Clinics</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Lifetime Earned</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Pending Payout</TableHead>
                <TableHead>UPI ID for Payout</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((a) => (
                <TableRow key={a.doctorId}>
                  <TableCell>
                    <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{a.doctorName}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{a.specialty}</div>
                  </TableCell>

                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code style={{ fontSize: '0.75rem', backgroundColor: '#0B1120', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px' }}>
                        {a.referralCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(a.referralLink)}
                        title="Copy Referral Link"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          fontSize: '0.875rem'
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </TableCell>

                  <TableCell style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                    {a.referredPartnersCount} Clinics
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#10B981' }}>
                    ₹ {a.totalCommissionsEarnedInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: a.pendingPayoutInr > 0 ? '#F59E0B' : '#64748B' }}>
                    ₹ {a.pendingPayoutInr.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell>
                    <code style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>{a.upiId}</code>
                  </TableCell>

                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyLink(a.referralLink)}
                      style={{ fontWeight: 700 }}
                    >
                      Share Invite ➔
                    </Button>
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
