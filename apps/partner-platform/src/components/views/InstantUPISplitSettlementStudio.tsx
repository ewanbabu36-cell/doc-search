import React, { useState } from 'react';
import { Card, Button, Badge, Input, Select } from '@docsearch/ui-kit';

export interface SplitTransaction {
  id: string;
  patientName: string;
  encounterType: string;
  totalPaidInr: number;
  doctorShareInr: number;
  doctorName: string;
  doctorVpa: string;
  doctorUtr: string;
  hospitalShareInr: number;
  hospitalVpa: string;
  hospitalUtr: string;
  platformFeeInr: number;
  platformUtr: string;
  timestamp: string;
  status: 'SETTLED_INSTANT_IMPS' | 'PROCESSING';
}

export const InstantUPISplitSettlementStudio: React.FC = () => {
  const [billAmount, setBillAmount] = useState<number>(1000);
  const [patientName, setPatientName] = useState('Rahul Verma (MRN-84920)');
  const [doctorName, setDoctorName] = useState('Dr. Vikram Malhotra (Cardiology)');
  const [doctorSplitPct, setDoctorSplitPct] = useState<number>(70);
  const [hospitalSplitPct, setHospitalSplitPct] = useState<number>(25);
  const [platformFeePct, setPlatformFeePct] = useState<number>(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestSuccess, setLatestSuccess] = useState<SplitTransaction | null>(null);

  const [settledHistory, setSettledHistory] = useState<SplitTransaction[]>([
    {
      id: 'TXN-UPI-' + Date.now(),
      patientName: 'Sunita Sharma (MRN-10293)',
      encounterType: 'OPD Special Consultation',
      totalPaidInr: 1200,
      doctorShareInr: 840,
      doctorName: 'Dr. Vikram Malhotra',
      doctorVpa: 'dr.vikram@hdfcbank',
      doctorUtr: 'NPCI-2026-948201',
      hospitalShareInr: 300,
      hospitalVpa: 'metrohealth.pos@icici',
      hospitalUtr: 'NPCI-2026-948202',
      platformFeeInr: 60,
      platformUtr: 'NPCI-2026-948203',
      timestamp: 'Just now (10:24 AM)',
      status: 'SETTLED_INSTANT_IMPS'
    },
    {
      id: 'TXN-UPI-002',
      patientName: 'Amit Kapoor (MRN-49201)',
      encounterType: 'Pediatric General Checkup',
      totalPaidInr: 800,
      doctorShareInr: 560,
      doctorName: 'Dr. Ananya Roy',
      doctorVpa: 'dr.ananya@axisbank',
      doctorUtr: 'NPCI-2026-819234',
      hospitalShareInr: 200,
      hospitalVpa: 'metrohealth.pos@icici',
      hospitalUtr: 'NPCI-2026-819235',
      platformFeeInr: 40,
      platformUtr: 'NPCI-2026-819236',
      timestamp: '25 mins ago',
      status: 'SETTLED_INSTANT_IMPS'
    }
  ]);

  // Dynamic calculations
  const doctorAmount = (billAmount * doctorSplitPct) / 100;
  const hospitalAmount = (billAmount * hospitalSplitPct) / 100;
  const platformAmount = (billAmount * platformFeePct) / 100;

  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newTxn: SplitTransaction = {
        id: 'TXN-UPI-' + Date.now(),
        patientName: patientName,
        encounterType: 'OPD Clinical Consultation',
        totalPaidInr: billAmount,
        doctorShareInr: doctorAmount,
        doctorName: doctorName,
        doctorVpa: 'dr.malhotra@hdfcbank',
        doctorUtr: 'NPCI-2026-' + Math.floor(100000 + Math.random() * 900000),
        hospitalShareInr: hospitalAmount,
        hospitalVpa: 'metrohealth.settle@icici',
        hospitalUtr: 'NPCI-2026-' + Math.floor(100000 + Math.random() * 900000),
        platformFeeInr: platformAmount,
        platformUtr: 'NPCI-2026-' + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'SETTLED_INSTANT_IMPS'
      };

      setSettledHistory([newTxn, ...settledHistory]);
      setLatestSuccess(newTxn);
      setIsSimulating(false);
    }, 700);
  };

  return (
    <Card padding="md" style={{ border: '2px solid #10B981', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>⚡</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Instant Multi-Party UPI Split Settlement Engine
              </h3>
              <Badge variant="success">NPCI UPI 2.0 Real-Time Payout</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Single patient QR scan automatically splits fee to Doctor Bank A/c, Hospital A/c, and Platform with Zero Reconciliation
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="primary">⚡ Zero End-of-Month Disputes</Badge>
          <Badge variant="neutral">🔒 RBI Escrow Compliant</Badge>
        </div>
      </div>

      {/* Main Grid: QR Simulator & Split Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        
        {/* Left: Dynamic QR Generator & POS */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase' }}>
            📱 Dynamic Counter UPI QR & Bill Input
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>PATIENT NAME / MRN</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CONSULTATION FEE (₹) *</label>
              <Input type="number" min="100" value={billAmount} onChange={(e) => setBillAmount(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>CONSULTING DOCTOR</label>
            <Select
              options={[
                { label: 'Dr. Vikram Malhotra (Cardiology - 70% Share)', value: 'Dr. Vikram Malhotra (Cardiology)' },
                { label: 'Dr. Ananya Roy (Pediatrics - 75% Share)', value: 'Dr. Ananya Roy (Pediatrics)' },
                { label: 'Dr. Rajesh Sharma (Orthopedics - 65% Share)', value: 'Dr. Rajesh Sharma (Orthopedics)' }
              ]}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          {/* Simulated QR Code Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0F172A', padding: '14px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div style={{ width: '90px', height: '90px', backgroundColor: '#FFF', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* QR Pattern visual */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', width: '100%', height: '100%' }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ backgroundColor: (i % 2 === 0 || i % 3 === 0) ? '#070C16' : '#FFF', borderRadius: '1px' }} />
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>UPI 2.0 Dynamic QR Active</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
                ₹{billAmount.toLocaleString('en-IN')}.00
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                Scan with Google Pay, PhonePe, Paytm, or Cred
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isSimulating}
            onClick={handleSimulatePayment}
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#070C16', fontWeight: 900 }}
          >
            {isSimulating ? '⚡ Executing Multi-Party IMPS Settlement...' : '⚡ Simulate Patient Scan & Instant UPI Split'}
          </Button>
        </div>

        {/* Right: Live Real-Time Multi-Party Split Calculator */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              💰 Live Multi-Party Split Breakdown & Rule Config
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.6875rem', color: '#94A3B8' }}>
              <span>Dr %:</span>
              <input type="number" min="1" max="95" value={doctorSplitPct} onChange={(e) => setDoctorSplitPct(Number(e.target.value))} style={{ width: '45px', padding: '2px 4px', background: '#0F172A', border: '1px solid #10B981', color: '#FFF', borderRadius: '4px', textAlign: 'center' }} />
              <span>Hosp %:</span>
              <input type="number" min="1" max="95" value={hospitalSplitPct} onChange={(e) => setHospitalSplitPct(Number(e.target.value))} style={{ width: '45px', padding: '2px 4px', background: '#0F172A', border: '1px solid #38BDF8', color: '#FFF', borderRadius: '4px', textAlign: 'center' }} />
              <span>Plat %:</span>
              <input type="number" min="1" max="20" value={platformFeePct} onChange={(e) => setPlatformFeePct(Number(e.target.value))} style={{ width: '40px', padding: '2px 4px', background: '#0F172A', border: '1px solid #8B5CF6', color: '#FFF', borderRadius: '4px', textAlign: 'center' }} />
            </div>
          </div>

          {/* 1. Doctor Share */}
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>🩺</span>
                <strong style={{ fontSize: '0.8125rem', color: '#A7F3D0' }}>Visiting Doctor Direct Payout ({doctorSplitPct}%)</strong>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                Direct to VPA: <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>dr.vikram@hdfcbank</span> (Instant Bank Route)
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10B981' }}>
                ₹{doctorAmount.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#10B981', color: '#070C16', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, display: 'block', marginTop: '2px' }}>
                INSTANT IMPS
              </span>
            </div>
          </div>

          {/* 2. Hospital Share */}
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>🏥</span>
                <strong style={{ fontSize: '0.8125rem', color: '#BAE6FD' }}>Hospital Facility & Admin Fee ({hospitalSplitPct}%)</strong>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                Current A/c: <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>metrohealth.settle@icici</span>
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                ₹{hospitalAmount.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#38BDF8', color: '#070C16', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, display: 'block', marginTop: '2px' }}>
                SETTLED
              </span>
            </div>
          </div>

          {/* 3. Platform Fee */}
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>👑</span>
                <strong style={{ fontSize: '0.8125rem', color: '#DDD6FE' }}>DocSearch Platform Fee & Care Pass ({platformFeePct}%)</strong>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                Escrow Gateway: <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>docsearch.fintech@yesbank</span>
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#A78BFA' }}>
                ₹{platformAmount.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#8B5CF6', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, display: 'block', marginTop: '2px' }}>
                ESCROW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {latestSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10B981', borderRadius: '12px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.8125rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>✓ Instant Multi-Party Settlement Successful!</strong> ₹{latestSuccess.totalPaidInr} paid by {latestSuccess.patientName}.
            <div style={{ fontSize: '0.75rem', color: '#FFF', marginTop: '2px' }}>
              Doctor Credited: <strong>₹{latestSuccess.doctorShareInr}</strong> (UTR: {latestSuccess.doctorUtr}) • Hospital Credited: <strong>₹{latestSuccess.hospitalShareInr}</strong> (UTR: {latestSuccess.hospitalUtr})
            </div>
          </div>
          <Badge variant="success">0-SEC RECONCILIATION</Badge>
        </div>
      )}

      {/* Recent Multi-Party Settlement Passbook Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
            📜 Real-Time Multi-Party Settlement Audit Passbook
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            {settledHistory.length} transactions settled with bank UTR proof
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px 10px' }}>Patient / Encounter</th>
                <th style={{ padding: '8px 10px' }}>Total (₹)</th>
                <th style={{ padding: '8px 10px' }}>Doctor Direct Payout (₹)</th>
                <th style={{ padding: '8px 10px' }}>Hospital Share (₹)</th>
                <th style={{ padding: '8px 10px' }}>Platform (₹)</th>
                <th style={{ padding: '8px 10px' }}>Bank UTR Route</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {settledHistory.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <strong style={{ color: '#F8FAFC', display: 'block' }}>{row.patientName}</strong>
                    <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>{row.encounterType}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#FFF' }}>
                    ₹{row.totalPaidInr}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: '#10B981', fontWeight: 800 }}>₹{row.doctorShareInr}</span>
                    <span style={{ display: 'block', fontSize: '0.625rem', color: '#64748B' }}>{row.doctorVpa}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 800 }}>₹{row.hospitalShareInr}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: '#A78BFA', fontWeight: 800 }}>₹{row.platformFeeInr}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#CBD5E1' }}>
                    {row.doctorUtr}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <Badge variant="success">INSTANT PAID</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};
