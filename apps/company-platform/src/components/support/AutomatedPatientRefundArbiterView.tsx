import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface RefundDispute {
  disputeId: string;
  patientName: string;
  doctorHospitalName: string;
  consultationFee: string;
  disputeReason: string;
  aiEligibilityVerdict: string;
  refundStatus: 'REFUND_SETTLED_UPI' | 'ELIGIBLE_FOR_INSTANT_REFUND';
  disputedDate: string;
}

const INITIAL_DISPUTES: RefundDispute[] = [
  {
    disputeId: 'DISP-REF-801',
    patientName: 'Vikas Malhotra',
    doctorHospitalName: 'Dr. R. K. Singhal (Apollo OPD)',
    consultationFee: '₹ 1,200',
    disputeReason: 'Doctor emergency surgery delay (>60 mins); patient could not attend',
    aiEligibilityVerdict: '100% Eligible (Verified via Doctor OPD Schedule Log)',
    refundStatus: 'ELIGIBLE_FOR_INSTANT_REFUND',
    disputedDate: 'Today, 11:10 AM'
  },
  {
    disputeId: 'DISP-REF-802',
    patientName: 'Priyanka Ghosh',
    doctorHospitalName: 'Care Diagnostics (Thyroid Profile)',
    consultationFee: '₹ 850',
    disputeReason: 'Phlebotomist arrived 3 hours late for home sample collection',
    aiEligibilityVerdict: '100% Eligible (Phlebotomist GPS Delay Verified)',
    refundStatus: 'REFUND_SETTLED_UPI',
    disputedDate: 'Yesterday'
  },
  {
    disputeId: 'DISP-REF-803',
    patientName: 'Devendra Patil',
    doctorHospitalName: 'Dr. Meera Nambiar (Teleconsultation)',
    consultationFee: '₹ 600',
    disputeReason: 'Audio/Video call dropped due to clinic internet severance',
    aiEligibilityVerdict: '100% Eligible (WebRTC Severance Telemetry Logged)',
    refundStatus: 'REFUND_SETTLED_UPI',
    disputedDate: '2 days ago'
  }
];

export const AutomatedPatientRefundArbiterView: React.FC = () => {
  const [disputes, setDisputes] = useState<RefundDispute[]>(INITIAL_DISPUTES);
  const [refundNotice, setRefundNotice] = useState<string | null>(null);

  const handleApproveRefund = (dId: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.disputeId === dId ? { ...d, refundStatus: 'REFUND_SETTLED_UPI' } : d
      )
    );
    setRefundNotice(`✓ Refund of ₹ 1,200 for dispute "${dId}" reversed to Patient UPI (VPA: vikas@okhdfcbank) via Razorpay Instant Payouts in 1.4 seconds!`);
    setTimeout(() => setRefundNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚡ Automated 1-Click Patient Refund & Dispute Resolution Arbiter
          </h2>
          <Badge variant="success">● Instant UPI Reverse Clearing (&lt; 3 Minutes SLA)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Autonomous dispute adjudication: verifies clinic delays and WebRTC telemetry to issue instant 100% patient refunds with zero friction
        </p>
      </div>

      {refundNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {refundNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>AVERAGE REFUND SPEED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>1.8 Minutes</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Direct to Patient UPI / Bank</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DISPUTE RESOLUTION RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>99.2% Resolved</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero consumer court grievances</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL PATIENT TRUST SAVINGS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>₹ 14,80,000</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Protection guarantee satisfied</span>
        </div>
      </div>

      {/* Disputes Table */}
      <Card title="📜 Active Patient Disputes & Auto-Arbitration Queue" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID & Patient</TableHead>
                <TableHead>Doctor / Facility</TableHead>
                <TableHead>Fee Amount</TableHead>
                <TableHead>Dispute Cause & Evidence</TableHead>
                <TableHead>AI Verdict</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.disputeId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.patientName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{d.disputeId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.doctorHospitalName}
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#F8FAFC' }}>
                    {d.consultationFee}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '280px', lineHeight: '1.4' }}>
                    {d.disputeReason}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                    {d.aiEligibilityVerdict}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {d.refundStatus === 'ELIGIBLE_FOR_INSTANT_REFUND' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveRefund(d.disputeId)}
                        style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ⚡ 1-Click Refund
                      </button>
                    ) : (
                      <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>✓ UPI Reversed</span>
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
