import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface DoctorPayout {
  payoutId: string;
  doctorName: string;
  doctorSpecialty: string;
  specialityTier: 'SUPER_SPECIALITY' | 'GENERAL_OPD' | 'NIGHT_SURGE' | 'INSTITUTIONAL';
  panNumber: string;
  panStatus: 'VERIFIED_INDIVIDUAL' | 'CORPORATE_VENDOR' | 'PAN_MISSING';
  consultCount: number;
  grossConsultationFees: number;
  doctorSharePercent: number;
  platformSharePercent: number;
  tdsSection: 'SEC_194J' | 'SEC_194C' | 'SEC_206AA';
  tdsPercent: number;
  tdsAmount: number;
  netDoctorPayable: number;
  disbursementStatus: 'DISBURSED_IMPS' | 'READY_FOR_PAYOUT' | 'ESCROW_HELD';
  payoutPeriod: string;
  bankAccountMasked: string;
  form16aGenerated: boolean;
}

export const DoctorRevenueSplitEscrowView: React.FC = () => {
  // Configurable Split Rules
  const [superSpecialitySplit, setSuperSpecialitySplit] = useState(85); // 85% Doctor
  const [generalOpdSplit, setGeneralOpdSplit] = useState(70);          // 70% Doctor
  const [nightSurgeSplit, setNightSurgeSplit] = useState(90);          // 90% Doctor
  const [institutionalSplit, setInstitutionalSplit] = useState(80);    // 80% Doctor

  const [payouts, setPayouts] = useState<DoctorPayout[]>([
    {
      payoutId: 'PAY-DOC-881',
      doctorName: 'Dr. Vivek Sengupta, M.Ch (Neurosurgery)',
      doctorSpecialty: 'Neurosurgery & Spine',
      specialityTier: 'SUPER_SPECIALITY',
      panNumber: 'ABCPS1290K',
      panStatus: 'VERIFIED_INDIVIDUAL',
      consultCount: 140,
      grossConsultationFees: 350000,
      doctorSharePercent: 85,
      platformSharePercent: 15,
      tdsSection: 'SEC_194J',
      tdsPercent: 10,
      tdsAmount: 29750, // 10% of 297,500 (85% of 350k)
      netDoctorPayable: 267750,
      disbursementStatus: 'READY_FOR_PAYOUT',
      payoutPeriod: 'Aug 16 - Aug 31, 2026',
      bankAccountMasked: 'HDFC Bank •••• 9182',
      form16aGenerated: true
    },
    {
      payoutId: 'PAY-DOC-882',
      doctorName: 'Dr. Alok Verma, DM (Cardiology)',
      doctorSpecialty: 'Interventional Cardiology',
      specialityTier: 'SUPER_SPECIALITY',
      panNumber: 'BNMPN4821M',
      panStatus: 'VERIFIED_INDIVIDUAL',
      consultCount: 120,
      grossConsultationFees: 240000,
      doctorSharePercent: 85,
      platformSharePercent: 15,
      tdsSection: 'SEC_194J',
      tdsPercent: 10,
      tdsAmount: 20400,
      netDoctorPayable: 183600,
      disbursementStatus: 'READY_FOR_PAYOUT',
      payoutPeriod: 'Aug 16 - Aug 31, 2026',
      bankAccountMasked: 'ICICI Bank •••• 4421',
      form16aGenerated: true
    },
    {
      payoutId: 'PAY-DOC-883',
      doctorName: 'Dr. Priya Nair, MD (Night Surge Tele-Triage)',
      doctorSpecialty: 'Emergency Medicine',
      specialityTier: 'NIGHT_SURGE',
      panNumber: 'CKPAS8912P',
      panStatus: 'VERIFIED_INDIVIDUAL',
      consultCount: 95,
      grossConsultationFees: 190000,
      doctorSharePercent: 90,
      platformSharePercent: 10,
      tdsSection: 'SEC_194J',
      tdsPercent: 10,
      tdsAmount: 17100,
      netDoctorPayable: 153900,
      disbursementStatus: 'DISBURSED_IMPS',
      payoutPeriod: 'Aug 16 - Aug 31, 2026',
      bankAccountMasked: 'Axis Bank •••• 8812',
      form16aGenerated: true
    },
    {
      payoutId: 'PAY-DOC-884',
      doctorName: 'Dr. Ananya Sen, MD (Pediatrics)',
      doctorSpecialty: 'General Pediatrics & OPD',
      specialityTier: 'GENERAL_OPD',
      panNumber: 'DXPAS3311L',
      panStatus: 'VERIFIED_INDIVIDUAL',
      consultCount: 160,
      grossConsultationFees: 128000,
      doctorSharePercent: 70,
      platformSharePercent: 30,
      tdsSection: 'SEC_194J',
      tdsPercent: 10,
      tdsAmount: 8960,
      netDoctorPayable: 80640,
      disbursementStatus: 'DISBURSED_IMPS',
      payoutPeriod: 'Aug 16 - Aug 31, 2026',
      bankAccountMasked: 'SBI Bank •••• 1092',
      form16aGenerated: true
    },
    {
      payoutId: 'PAY-DOC-885',
      doctorName: 'Apollo Tele-Health Physicians LLP',
      doctorSpecialty: 'Multi-Speciality Institutional Roster',
      specialityTier: 'INSTITUTIONAL',
      panNumber: 'AAACA1234F',
      panStatus: 'CORPORATE_VENDOR',
      consultCount: 420,
      grossConsultationFees: 840000,
      doctorSharePercent: 80,
      platformSharePercent: 20,
      tdsSection: 'SEC_194C',
      tdsPercent: 2,
      tdsAmount: 13440, // 2% of 672,000 (80% of 840k)
      netDoctorPayable: 658560,
      disbursementStatus: 'READY_FOR_PAYOUT',
      payoutPeriod: 'Aug 16 - Aug 31, 2026',
      bankAccountMasked: 'Standard Chartered •••• 5590',
      form16aGenerated: true
    }
  ]);

  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [selectedSpecialityFilter, setSelectedSpecialityFilter] = useState<string>('ALL');

  const handleDisburse = (pId: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.payoutId === pId ? { ...p, disbursementStatus: 'DISBURSED_IMPS' } : p
      )
    );
    const item = payouts.find((p) => p.payoutId === pId);
    setPayoutNotice(`⚡ Instant Payout of ₹${item?.netDoctorPayable.toLocaleString('en-IN')} disbursed to ${item?.doctorName} (${item?.bankAccountMasked}) via RazorpayX IMPS. TDS ₹${item?.tdsAmount.toLocaleString('en-IN')} (${item?.tdsSection}) credited to ITNS 281 Challan.`);
  };

  const handleDownloadForm16A = (pId: string) => {
    const item = payouts.find((p) => p.payoutId === pId);
    setPayoutNotice(`📄 Form 16A TDS Certificate generated for ${item?.doctorName} [PAN: ${item?.panNumber}]. TDS Deduction Amount: ₹${item?.tdsAmount.toLocaleString('en-IN')}.`);
  };

  // Filter calculations
  const filteredPayouts = payouts.filter((p) => {
    if (selectedSpecialityFilter === 'ALL') return true;
    return p.specialityTier === selectedSpecialityFilter;
  });

  const totalGrossFees = payouts.reduce((acc, curr) => acc + curr.grossConsultationFees, 0);
  const totalNetDisbursed = payouts.filter((p) => p.disbursementStatus === 'DISBURSED_IMPS').reduce((acc, curr) => acc + curr.netDoctorPayable, 0);
  const totalPendingPayout = payouts.filter((p) => p.disbursementStatus === 'READY_FOR_PAYOUT').reduce((acc, curr) => acc + curr.netDoctorPayable, 0);
  const totalTdsRemitted = payouts.reduce((acc, curr) => acc + curr.tdsAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(16, 185, 129, 0.15) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>⚖️</span>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Granular Doctor Payout & Speciality Split Matrix
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Rule-based revenue splits (85/15 Super-Speciality, 70/30 OPD, 90/10 Night Surge) with automated TDS Sec 194J vs 194C classification and Form 16A generation.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Badge variant="success">● Sec 194J (10%) & Sec 194C (2%) Active</Badge>
        </div>
      </div>

      {payoutNotice && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#6EE7B7',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <span>{payoutNotice}</span>
          <button
            type="button"
            onClick={() => setPayoutNotice(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Configurable Revenue Split Matrix Rules Card */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8', marginBottom: '14px', textTransform: 'uppercase' }}>
          🎛️ Configurable Speciality Split Policies
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Super-Speciality Tier */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#C084FC' }}>🧠 Super-Speciality</span>
              <Badge variant="neutral">Neurosurgery / Cardio</Badge>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
              {superSpecialitySplit}% Doctor / {100 - superSpecialitySplit}% Platform
            </div>
            <input
              type="range"
              min="60"
              max="95"
              value={superSpecialitySplit}
              onChange={(e) => setSuperSpecialitySplit(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8B5CF6' }}
            />
          </div>

          {/* General OPD Tier */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38BDF8' }}>🩺 General OPD & Clinic</span>
              <Badge variant="neutral">Primary Care</Badge>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
              {generalOpdSplit}% Doctor / {100 - generalOpdSplit}% Platform
            </div>
            <input
              type="range"
              min="50"
              max="90"
              value={generalOpdSplit}
              onChange={(e) => setGeneralOpdSplit(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#06B6D4' }}
            />
          </div>

          {/* Night Surge Tier */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FBBF24' }}>🌙 Night Surge (11PM-6AM)</span>
              <Badge variant="warning">Emergency Incentive</Badge>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
              {nightSurgeSplit}% Doctor / {100 - nightSurgeSplit}% Platform
            </div>
            <input
              type="range"
              min="75"
              max="95"
              value={nightSurgeSplit}
              onChange={(e) => setNightSurgeSplit(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F59E0B' }}
            />
          </div>

          {/* Institutional Tier */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34D399' }}>🏥 Institutional / Hospital Group</span>
              <Badge variant="success">Sec 194C (2% TDS)</Badge>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
              {institutionalSplit}% Group / {100 - institutionalSplit}% Platform
            </div>
            <input
              type="range"
              min="60"
              max="90"
              value={institutionalSplit}
              onChange={(e) => setInstitutionalSplit(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Metrics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>GROSS CONSULT FEES POOL</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
            ₹{totalGrossFees.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px', display: 'block' }}>Across 935 Total Consults</span>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>DISBURSED TO DOCTORS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{totalNetDisbursed.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', display: 'block' }}>Instant IMPS / UPI Settled</span>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1.5px solid #F59E0B', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>READY FOR DISBURSEMENT</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            ₹{totalPendingPayout.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px', display: 'block' }}>Pending CFO Escrow Approval</span>
        </div>

        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>TDS TAX REMITTED (SEC 194J/C)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }}>
            ₹{totalTdsRemitted.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>Govt Challan ITNS 281 Synced</span>
        </div>
      </div>

      {/* 4. Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Specialities' },
          { id: 'SUPER_SPECIALITY', label: '🧠 Super-Speciality (85%)' },
          { id: 'GENERAL_OPD', label: '🩺 General OPD (70%)' },
          { id: 'NIGHT_SURGE', label: '🌙 Night Surge (90%)' },
          { id: 'INSTITUTIONAL', label: '🏥 Institutional (80%)' }
        ].map((btn) => {
          const isSelected = selectedSpecialityFilter === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedSpecialityFilter(btn.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                border: isSelected ? '1.5px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isSelected ? '#FFFFFF' : '#94A3B8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* 5. Doctor Payout Ledger List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredPayouts.map((p) => {
          const isDisbursed = p.disbursementStatus === 'DISBURSED_IMPS';
          return (
            <div
              key={p.payoutId}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: isDisbursed ? '1px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Doctor Row Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF' }}>{p.doctorName}</span>
                    <Badge variant={p.specialityTier === 'SUPER_SPECIALITY' ? 'primary' : p.specialityTier === 'NIGHT_SURGE' ? 'warning' : 'neutral'}>
                      {p.specialityTier}
                    </Badge>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• {p.doctorSpecialty}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                    Payout ID: <strong style={{ color: '#E2E8F0' }}>{p.payoutId}</strong> • Period: {p.payoutPeriod} • Bank: <strong style={{ color: '#38BDF8' }}>{p.bankAccountMasked}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDisbursed ? '#10B981' : '#F59E0B' }}>
                    ₹{p.netDoctorPayable.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: isDisbursed ? '#34D399' : '#FBBF24', fontWeight: 700 }}>
                    {isDisbursed ? '✅ DISBURSED VIA IMPS' : '⏳ READY FOR DISBURSEMENT'}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '0.8125rem'
              }}>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Gross Consultations:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>₹{p.grossConsultationFees.toLocaleString('en-IN')} ({p.consultCount} consults)</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Doctor Revenue Share ({p.doctorSharePercent}%):</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>₹{((p.grossConsultationFees * p.doctorSharePercent) / 100).toLocaleString('en-IN')}</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>Platform Share ({p.platformSharePercent}%):</span>
                  <span style={{ color: '#C084FC', fontWeight: 700 }}>₹{((p.grossConsultationFees * p.platformSharePercent) / 100).toLocaleString('en-IN')}</span>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem' }}>TDS Withheld ({p.tdsPercent}% {p.tdsSection}):</span>
                  <span style={{ color: '#F87171', fontWeight: 700 }}>-₹{p.tdsAmount.toLocaleString('en-IN')} [PAN: {p.panNumber}]</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => handleDownloadForm16A(p.payoutId)}>
                    📄 Form 16A Certificate
                  </Button>
                </div>

                <div>
                  {isDisbursed ? (
                    <Badge variant="success">PAYOUT COMPLETED</Badge>
                  ) : (
                    <Button variant="primary" onClick={() => handleDisburse(p.payoutId)}>
                      ⚡ Release Instant IMPS/UPI Payout
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
