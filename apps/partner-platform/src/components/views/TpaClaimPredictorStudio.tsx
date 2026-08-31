import React, { useState } from 'react';
import { Card, Button, Badge, Select } from '@docsearch/ui-kit';

export interface ClaimAuditItem {
  id: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  policyNumber: string;
  requestedAmountInr: number;
  predictedApprovedInr: number;
  approvalScore: number;
  riskCategory: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_REJECTION_RISK';
  missingDocuments: string[];
  aiRecommendations: string[];
  status: 'AUDITED' | 'READY_FOR_NHCX' | 'DISPATCHED';
}

export const TpaClaimPredictorStudio: React.FC = () => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>('CLM-2026-901');
  const [isAuditing, setIsAuditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [claimsList, setClaimsList] = useState<ClaimAuditItem[]>([
    {
      id: 'CLM-2026-901',
      claimNumber: 'CLM-2026-901',
      patientName: 'Eleanor Vance (MRN-10293)',
      payerName: 'Star Health & Allied Insurance (TPA)',
      policyNumber: 'SH-POL-8492019',
      requestedAmountInr: 145000,
      predictedApprovedInr: 142500,
      approvalScore: 97,
      riskCategory: 'LOW_RISK',
      missingDocuments: [],
      aiRecommendations: [
        '✓ All 3 OT surgical notes & implant barcode stickers verified.',
        '✓ Room rent within GIPSA Tier-1 standard (₹4,500/day).',
        '✓ Pre-auth initial sanction letter ₹1,20,000 matched.'
      ],
      status: 'READY_FOR_NHCX'
    },
    {
      id: 'CLM-2026-902',
      claimNumber: 'CLM-2026-902',
      patientName: 'Marcus Thorne (MRN-49201)',
      payerName: 'Niva Bupa Health Insurance',
      policyNumber: 'NB-IND-902849',
      requestedAmountInr: 85000,
      predictedApprovedInr: 52000,
      approvalScore: 61,
      riskCategory: 'HIGH_REJECTION_RISK',
      missingDocuments: ['Day-2 Post-Operative Vitals Chart', 'Diagnostic Histopathology Biopsy Report'],
      aiRecommendations: [
        '⚠️ Histopathology biopsy report missing: TPA will query within 48 hrs.',
        '⚠️ Deluxe suite room tariff (₹8,000/day) exceeds policy 1% sum insured cap.'
      ],
      status: 'AUDITED'
    },
    {
      id: 'CLM-2026-903',
      claimNumber: 'CLM-2026-903',
      patientName: 'Rajesh Malhotra (MRN-77492)',
      payerName: 'Ayushman Bharat (PM-JAY)',
      policyNumber: 'AB-PMJAY-DEL-99201',
      requestedAmountInr: 65000,
      predictedApprovedInr: 65000,
      approvalScore: 99,
      riskCategory: 'LOW_RISK',
      missingDocuments: [],
      aiRecommendations: [
        '✓ TMS 2.0 biometric Aadhaar verification attached.',
        '✓ National Health Benefit Package (HBP 2.2) code verified.'
      ],
      status: 'READY_FOR_NHCX'
    }
  ]);

  const activeClaim = claimsList.find((c) => c.id === selectedClaimId) || claimsList[0]!;

  const handleFixAndScrub = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setClaimsList((prev) =>
        prev.map((c) =>
          c.id === selectedClaimId
            ? {
                ...c,
                approvalScore: 98,
                predictedApprovedInr: c.requestedAmountInr,
                riskCategory: 'LOW_RISK',
                missingDocuments: [],
                aiRecommendations: [
                  '✓ Auto-attached missing post-op nursing flowsheet from Ward 3.',
                  '✓ Proportionate room-rent discount adjusted to avoid deduction.',
                  '✓ NHCX FHIR bundle encrypted and validated.'
                ],
                status: 'READY_FOR_NHCX'
              }
            : c
        )
      );
      setIsAuditing(false);
      setSuccessMsg(`Claim ${activeClaim.claimNumber} auto-scrubbed! Approval probability boosted to 98%.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 600);
  };

  const handleDispatchNHCX = () => {
    setClaimsList((prev) =>
      prev.map((c) => (c.id === selectedClaimId ? { ...c, status: 'DISPATCHED' } : c))
    );
    setSuccessMsg(`Claim ${activeClaim.claimNumber} electronically submitted to ${activeClaim.payerName} via NHCX Gateway!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <Card padding="md" style={{ border: '2px solid #06B6D4', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>🩻</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                TPA Cashless Insurance AI Claim Approval Predictor
              </h3>
              <Badge variant="primary">NHCX FHIR Pre-Scrubber</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Deep clinical pre-audit prevents claim rejection queries and guarantees 48-hour cashless settlement
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success">🛡️ Zero Deduction Shield</Badge>
          <Badge variant="neutral">PM-JAY & Star Health Ready</Badge>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10B981', borderRadius: '10px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Selector and Score Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        
        {/* Left: Claim Selector & Profile */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Select Inpatient Claim to Audit:</label>
          <Select
            options={claimsList.map((c) => ({
              label: `${c.claimNumber} - ${c.patientName} (₹${c.requestedAmountInr.toLocaleString('en-IN')})`,
              value: c.id
            }))}
            value={selectedClaimId}
            onChange={(e) => setSelectedClaimId(e.target.value)}
          />

          <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Patient:</strong> {activeClaim.patientName}</div>
            <div><strong>TPA / Payer:</strong> {activeClaim.payerName}</div>
            <div><strong>Policy ID:</strong> <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{activeClaim.policyNumber}</span></div>
            <div><strong>Requested Total:</strong> <span style={{ fontWeight: 800, color: '#FFF' }}>₹{activeClaim.requestedAmountInr.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        {/* Right: AI Prediction Gauge & Expected Payout */}
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              📊 AI Approval Probability Score
            </span>
            <Badge variant={activeClaim.approvalScore >= 85 ? 'success' : activeClaim.approvalScore >= 70 ? 'warning' : 'danger'}>
              {activeClaim.riskCategory}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, color: activeClaim.approvalScore >= 85 ? '#10B981' : activeClaim.approvalScore >= 70 ? '#F59E0B' : '#EF4444' }}>
              {activeClaim.approvalScore}%
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Estimated Approved Payout:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                ₹{activeClaim.predictedApprovedInr.toLocaleString('en-IN')}.00
              </span>
              <span style={{ fontSize: '0.6875rem', color: activeClaim.requestedAmountInr === activeClaim.predictedApprovedInr ? '#10B981' : '#EF4444', display: 'block' }}>
                {activeClaim.requestedAmountInr === activeClaim.predictedApprovedInr ? '✓ 100% Full Sanction Predicted' : `⚠️ Estimated Deduction: ₹${(activeClaim.requestedAmountInr - activeClaim.predictedApprovedInr).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeClaim.missingDocuments.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isAuditing}
                onClick={handleFixAndScrub}
                style={{ backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
              >
                {isAuditing ? '⚡ Auto-Scrubbing Claim...' : '🛠️ Auto-Fix & Attach Missing Records'}
              </Button>
            )}
            <Button
              type="button"
              variant={activeClaim.status === 'DISPATCHED' ? 'secondary' : 'primary'}
              size="sm"
              disabled={activeClaim.status === 'DISPATCHED'}
              onClick={handleDispatchNHCX}
              style={{
                backgroundColor: activeClaim.status === 'DISPATCHED' ? '#10B981' : '#10B981',
                borderColor: '#10B981',
                color: '#070C16',
                fontWeight: 900
              }}
            >
              {activeClaim.status === 'DISPATCHED' ? '✓ Dispatched via NHCX' : '🚀 1-Click Electronic Dispatch to TPA'}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Pre-Audit Recommendations & Clinical Checklist */}
      <div style={{ backgroundColor: '#0F172A', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          🧠 AI Clinical Audit & IRDAI Tariff Verification:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeClaim.aiRecommendations.map((rec, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: rec.startsWith('✓') ? '#A7F3D0' : '#FDE68A', lineHeight: 1.4 }}>
              {rec}
            </div>
          ))}
          {activeClaim.missingDocuments.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 700 }}>
              🔴 Missing TPA Checklist: {activeClaim.missingDocuments.join(' • ')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
