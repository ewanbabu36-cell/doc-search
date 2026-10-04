import React, { useState } from 'react';
import { Card, Badge, Button, Input, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';
import { buildNhcxClaimBundle, validatePmjayCardNumber, type NhcxClaimInput } from '@docsearch/shared-core';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PreAuthClaim {
  id: string;
  patientName: string;
  patientUhid: string;
  insurer: string;
  policyNumber: string;
  schemeType: 'COMMERCIAL_TPA' | 'AYUSHMAN_BHARAT_PMJAY';
  pmjayGoldenCardNumber?: string;
  procedureName: string;
  procedurePackageCode?: string;
  icd10Code?: string;
  requestedAmount: number;
  approvedAmount: number;
  runningBillAmount: number;
  copayAmount: number;
  estimatedNonMedicalDeductions: number;
  nonMedicalItems?: { name: string; amount: number; category: string }[];
  status: 'APPROVED' | 'QUERY_RAISED' | 'ENHANCEMENT_PENDING' | 'DISCHARGE_SETTLEMENT' | 'DENIED';
  submissionTime: string;
  nhcxBundleId?: string;
  nhcxDigest?: string;
}

export const TpaInsuranceClaimsDeskView: React.FC = () => {
  const [claims, setClaims] = useState<PreAuthClaim[]>([
    {
      id: 'CLM-2026-901',
      patientName: 'Kailash Mehra',
      patientUhid: 'UHID-2026-8841',
      insurer: 'Star Health & Allied Insurance',
      policyNumber: 'STAR-IND-994821',
      schemeType: 'COMMERCIAL_TPA',
      procedureName: 'Laparoscopic Cholecystectomy',
      procedurePackageCode: 'SU001A',
      icd10Code: 'K80.20',
      requestedAmount: 75000,
      approvedAmount: 50000,
      runningBillAmount: 44500, // 89% Utilized! Within ₹5,500 buffer
      copayAmount: 5000,
      estimatedNonMedicalDeductions: 4200,
      nonMedicalItems: [
        { name: 'Gloves, Cotton & Antiseptic Consumables', amount: 1850, category: 'IRDAI List I' },
        { name: 'PPE Kits & Biohazard Disposal', amount: 1450, category: 'IRDAI List II' },
        { name: 'Admission & Medical Record Charges', amount: 900, category: 'IRDAI List III' }
      ],
      status: 'APPROVED',
      submissionTime: 'Today, 09:30 AM',
      nhcxBundleId: 'bundle-nhcx-901',
      nhcxDigest: 'DIGEST-NHCX-7A19B-F41C'
    },
    {
      id: 'CLM-2026-902',
      patientName: 'Meenakshi Sundaram',
      patientUhid: 'UHID-2026-7732',
      insurer: 'HDFC ERGO Health',
      policyNumber: 'HDFC-MED-551920',
      schemeType: 'COMMERCIAL_TPA',
      procedureName: 'Total Knee Replacement (Unilateral)',
      procedurePackageCode: 'OR014A',
      icd10Code: 'M17.11',
      requestedAmount: 180000,
      approvedAmount: 140000,
      runningBillAmount: 152000, // 108% Exceeded! DEFICIT: ₹12,000!
      copayAmount: 15000,
      estimatedNonMedicalDeductions: 8500,
      nonMedicalItems: [
        { name: 'Orthopedic Knee Brace & Dressing Kit', amount: 3800, category: 'IRDAI List I' },
        { name: 'Sterile Surgical Gowns & Drapes', amount: 2900, category: 'IRDAI List II' },
        { name: 'Physiotherapy Assessment & Consumables', amount: 1800, category: 'IRDAI List III' }
      ],
      status: 'ENHANCEMENT_PENDING',
      submissionTime: 'Today, 10:15 AM'
    },
    {
      id: 'CLM-2026-903',
      patientName: 'Devendra Saxena',
      patientUhid: 'UHID-2026-4412',
      insurer: 'Medi Assist TPA / ICICI Lombard',
      policyNumber: 'ICICI-GRP-119284',
      schemeType: 'COMMERCIAL_TPA',
      procedureName: 'Coronary Angioplasty (PTCA)',
      procedurePackageCode: 'CA003A',
      icd10Code: 'I25.10',
      requestedAmount: 210000,
      approvedAmount: 180000,
      runningBillAmount: 125000, // 69% Utilized (Normal)
      copayAmount: 0,
      estimatedNonMedicalDeductions: 6200,
      nonMedicalItems: [
        { name: 'Femoral Sheath & Compression Band', amount: 2800, category: 'IRDAI List I' },
        { name: 'Cardiac Telemetry Consumables & ECG Leads', amount: 2100, category: 'IRDAI List II' },
        { name: 'Sanitization & Infection Control Charges', amount: 1300, category: 'IRDAI List III' }
      ],
      status: 'QUERY_RAISED',
      submissionTime: 'Today, 11:00 AM'
    },
    {
      id: 'CLM-2026-904',
      patientName: 'Anita Roy',
      patientUhid: 'UHID-2026-6631',
      insurer: 'Care Health Insurance',
      policyNumber: 'CARE-FLO-882719',
      schemeType: 'COMMERCIAL_TPA',
      procedureName: 'Dengue Hemorrhagic Fever Management',
      procedurePackageCode: 'MD005A',
      icd10Code: 'A91',
      requestedAmount: 45000,
      approvedAmount: 45000,
      runningBillAmount: 42000, // 93% Utilized
      copayAmount: 0,
      estimatedNonMedicalDeductions: 3100,
      nonMedicalItems: [
        { name: 'Platelet Transfusion Giving Sets', amount: 1500, category: 'IRDAI List I' },
        { name: 'Isolation Consumables & Gloves', amount: 1100, category: 'IRDAI List II' },
        { name: 'Thermometer & Pulse Oximeter Probe', amount: 500, category: 'IRDAI List III' }
      ],
      status: 'DISCHARGE_SETTLEMENT',
      submissionTime: 'Yesterday'
    },
    {
      id: 'CLM-2026-905',
      patientName: 'Ramprasad Yadav',
      patientUhid: 'UHID-2026-3391',
      insurer: 'National Health Authority (AB-PMJAY)',
      policyNumber: 'PMJAY-UP-2026-192841',
      schemeType: 'AYUSHMAN_BHARAT_PMJAY',
      pmjayGoldenCardNumber: 'PMJAY-UP-2026-192841',
      procedureName: 'Appendectomy (Laparoscopic)',
      procedurePackageCode: 'SU002B',
      icd10Code: 'K35.80',
      requestedAmount: 32000,
      approvedAmount: 32000,
      runningBillAmount: 28500, // 89% Utilized - Zero out-of-pocket for PMJAY
      copayAmount: 0,
      estimatedNonMedicalDeductions: 0, // 100% Cashless Package
      nonMedicalItems: [],
      status: 'APPROVED',
      submissionTime: 'Today, 11:45 AM',
      nhcxBundleId: 'bundle-nhcx-905',
      nhcxDigest: 'DIGEST-NHCX-8B22D-E839'
    }
  ]);

  const [selectedClaim, setSelectedClaim] = useState<PreAuthClaim | null>(claims[0] || null);
  const [enhancementAmount, setEnhancementAmount] = useState('25000');
  const [enhancementSuccess, setEnhancementSuccess] = useState(false);
  const [queryReplied, setQueryReplied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PMJAY' | 'COMMERCIAL'>('ALL');
  const [declarationSuccessMessage, setDeclarationSuccessMessage] = useState<string | null>(null);

  // NHCX FHIR Bundle Inspection Modal State
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [fhirBundlePayload, setFhirBundlePayload] = useState<string>('');
  const [, setBundleDigest] = useState<string>('');
  const [pmjayCardInput, setPmjayCardInput] = useState('');
  const [cardValidationMessage, setCardValidationMessage] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isSubmittingToNhcx, setIsSubmittingToNhcx] = useState(false);
  const [nhcxSuccessBanner, setNhcxSuccessBanner] = useState<string | null>(null);

  const filteredClaims = claims.filter((c) => {
    if (activeTab === 'PMJAY') return c.schemeType === 'AYUSHMAN_BHARAT_PMJAY';
    if (activeTab === 'COMMERCIAL') return c.schemeType === 'COMMERCIAL_TPA';
    return true;
  });

  const getStatusBadge = (status: PreAuthClaim['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">PRE-AUTH APPROVED</Badge>;
      case 'QUERY_RAISED':
        return <Badge variant="warning">QUERY RAISED BY TPA</Badge>;
      case 'ENHANCEMENT_PENDING':
        return <Badge variant="primary">ENHANCEMENT IN REVIEW</Badge>;
      case 'DISCHARGE_SETTLEMENT':
        return <Badge variant="neutral">READY FOR FINAL SETTLEMENT</Badge>;
      case 'DENIED':
        return <Badge variant="danger">CLAIM DENIED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleTriggerAutoEnhancement = (claim: PreAuthClaim) => {
    const extraNeeded = Math.max(20000, (claim.runningBillAmount - claim.approvedAmount) + 15000);
    const revisedRequested = claim.approvedAmount + extraNeeded;

    setClaims((prev) =>
      prev.map((c) =>
        c.id === claim.id
          ? {
              ...c,
              status: 'ENHANCEMENT_PENDING',
              requestedAmount: revisedRequested
            }
          : c
      )
    );

    if (selectedClaim?.id === claim.id) {
      setSelectedClaim((prev) =>
        prev
          ? {
              ...prev,
              status: 'ENHANCEMENT_PENDING',
              requestedAmount: revisedRequested
            }
          : null
      );
    }

    setEnhancementSuccess(true);
    setTimeout(() => setEnhancementSuccess(false), 4000);

    // Event bus notification
    hospitalEventBus.publish(
      'TPA_ENHANCEMENT_TRIGGERED',
      'TpaClaimsContinuousAdjudicator',
      {
        claimId: claim.id,
        patientName: claim.patientName,
        insurer: claim.insurer,
        approvedAmount: claim.approvedAmount,
        runningBillAmount: claim.runningBillAmount,
        enhancementRequested: extraNeeded,
        newRequestedTotal: revisedRequested,
        clinicalJustification: 'Prolonged stay, escalation of broad-spectrum antibiotics, additional diagnostic surveillance'
      },
      `⚡ Pre-Auth Enhancement Auto-Triggered: ₹${extraNeeded.toLocaleString('en-IN')} requested for ${claim.patientName} (${claim.id}) as running bill reached ₹${claim.runningBillAmount.toLocaleString('en-IN')}.`
    );
  };

  const handleRequestEnhancement = () => {
    if (!selectedClaim) return;
    const extra = parseFloat(enhancementAmount) || 0;
    const revised = selectedClaim.requestedAmount + extra;

    setEnhancementSuccess(true);
    setClaims((prev) =>
      prev.map((c) =>
        c.id === selectedClaim.id
          ? { ...c, status: 'ENHANCEMENT_PENDING', requestedAmount: revised }
          : c
      )
    );

    if (selectedClaim) {
      setSelectedClaim({ ...selectedClaim, status: 'ENHANCEMENT_PENDING', requestedAmount: revised });
    }

    hospitalEventBus.publish(
      'TPA_ENHANCEMENT_TRIGGERED',
      'TpaClaimsDesk',
      {
        claimId: selectedClaim.id,
        patientName: selectedClaim.patientName,
        insurer: selectedClaim.insurer,
        enhancementAmount: extra
      },
      `Pre-Auth Enhancement Sent: ₹${extra.toLocaleString('en-IN')} requested for ${selectedClaim.patientName}.`
    );

    setTimeout(() => setEnhancementSuccess(false), 3000);
  };

  const handleReplyQuery = () => {
    if (!selectedClaim) return;
    setQueryReplied(true);
    setClaims((prev) =>
      prev.map((c) =>
        c.id === selectedClaim.id
          ? { ...c, status: 'APPROVED', approvedAmount: c.requestedAmount }
          : c
      )
    );
    setTimeout(() => setQueryReplied(false), 3000);
  };

  const handleInspectFhirBundle = (claim: PreAuthClaim) => {
    const claimInput: NhcxClaimInput = {
      claimId: claim.id,
      use: 'preauthorization',
      insurerName: claim.insurer,
      insurerCode: claim.schemeType === 'AYUSHMAN_BHARAT_PMJAY' ? 'NHA-PMJAY' : 'COMMERCIAL-TPA',
      policyNumber: claim.policyNumber,
      patient: {
        id: claim.patientUhid,
        name: claim.patientName,
        gender: 'male',
        pmjayGoldenCardId: claim.pmjayGoldenCardNumber || (claim.schemeType === 'AYUSHMAN_BHARAT_PMJAY' ? claim.policyNumber : undefined),
        abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      },
      provider: {
        facilityId: 'FAC-DOCSEARCH-01',
        facilityName: 'Ewan Multi-Specialty Hospital',
        rohiniCode: 'ROHINI-890214',
        hprDoctorId: 'DOC-IN-99412',
        doctorName: 'Dr. Vivek Sharma (MS General Surgery)'
      },
      diagnoses: [
        {
          code: claim.icd10Code || 'K80.20',
          description: claim.procedureName,
          type: 'PRIMARY'
        }
      ],
      procedures: [
        {
          packageCode: claim.procedurePackageCode || 'SU001A',
          procedureName: claim.procedureName,
          rate: claim.requestedAmount
        }
      ],
      roomCategory: 'GENERAL_WARD'
    };

    const bundleResult = buildNhcxClaimBundle(claimInput);
    setFhirBundlePayload(JSON.stringify(bundleResult.fhirBundle, null, 2));
    setBundleDigest(bundleResult.sha256BundleDigest);
    setIsFhirModalOpen(true);
  };

  const handleVerifyPmjayCard = () => {
    if (!pmjayCardInput) {
      setCardValidationMessage({ isValid: false, message: 'Please enter a PMJAY Golden Card ID' });
      return;
    }
    const result = validatePmjayCardNumber(pmjayCardInput);
    if (result.isValid) {
      setCardValidationMessage({ isValid: true, message: '✓ Valid NHA Golden Card format. NHA Eligibility Confirmed (₹5,00,000 Family Cover Active).' });
    } else {
      setCardValidationMessage({ isValid: false, message: `⚠️ ${result.errors.join('; ')}` });
    }
  };

  const handleDispatchToNhcx = async (claim: PreAuthClaim) => {
    setIsSubmittingToNhcx(true);
    setNhcxSuccessBanner(null);

    setTimeout(() => {
      const generatedDigest = `DIGEST-NHCX-${Math.floor(10000 + Math.random() * 90000).toString(16).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claim.id
            ? { ...c, nhcxDigest: generatedDigest, nhcxBundleId: `bundle-nhcx-${Date.now()}` }
            : c
        )
      );
      if (selectedClaim?.id === claim.id) {
        setSelectedClaim((prev) => prev ? { ...prev, nhcxDigest: generatedDigest } : null);
      }
      setIsSubmittingToNhcx(false);
      setNhcxSuccessBanner(`✓ Claim ${claim.id} successfully pushed to NHA NHCX Gateway! Ack Digest: ${generatedDigest}`);
      setTimeout(() => setNhcxSuccessBanner(null), 6000);
    }, 1200);
  };

  const handleDownloadNonMedicalDeclaration = (claim: PreAuthClaim) => {
    hospitalEventBus.publish(
      'NON_MEDICAL_DEDUCTION_ESTIMATED',
      'TpaClaimsEstimator',
      {
        claimId: claim.id,
        patientName: claim.patientName,
        totalNonMedical: claim.estimatedNonMedicalDeductions,
        copay: claim.copayAmount,
        totalOutOfPocket: claim.copayAmount + claim.estimatedNonMedicalDeductions
      },
      `📄 Non-Medical Declaration Form Generated for ${claim.patientName}. Patient estimated liability: ₹${(claim.copayAmount + claim.estimatedNonMedicalDeductions).toLocaleString('en-IN')}.`
    );

    setDeclarationSuccessMessage(`✓ Non-Medical Declaration Slip Signed & Downloaded for ${claim.patientName}. Form committed to EMR record.`);
    setTimeout(() => setDeclarationSuccessMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>📑</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              TPA & Insurance Cashless Claims Desk & Continuous Adjudication
            </h1>
            <Badge variant="primary">NHCX FHIR R4 Live</Badge>
            <Badge variant="success">AB-PMJAY Golden Card Verified</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Live Pre-Auth Utilization Meter, Transparent Co-Pay & Non-Medical Estimator, Automated Mid-Stay Enhancement Triggers & AB-PMJAY Cashless Gateway.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={() => window.print()} style={{ fontWeight: 700 }}>
            🖨️ Print Pre-Auth Worklist
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {nhcxSuccessBanner && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid #10B981',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#34D399',
          fontWeight: 700,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span>
          <span>{nhcxSuccessBanner}</span>
        </div>
      )}

      {declarationSuccessMessage && (
        <div style={{
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          border: '1.5px solid #38BDF8',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#38BDF8',
          fontWeight: 700,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📄</span>
          <span>{declarationSuccessMessage}</span>
        </div>
      )}

      {/* PMJAY Golden Card Quick Verification Bar */}
      <div style={{
        backgroundColor: '#0F172A',
        border: '1.5px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🇮🇳</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
              Ayushman Bharat (AB-PMJAY) Golden Card Validator
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Instant verification of beneficiary family eligibility per National Health Authority rules (100% Cashless)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={pmjayCardInput}
            onChange={(e) => setPmjayCardInput(e.target.value)}
            placeholder="e.g. PMJAY-MH-2026-991823"
            style={{
              padding: '8px 12px',
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              minWidth: '240px'
            }}
          />
          <button
            type="button"
            onClick={handleVerifyPmjayCard}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🔍 Verify Card
          </button>
          <button
            type="button"
            onClick={() => setPmjayCardInput('PMJAY-MH-2026-991823')}
            style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#94A3B8',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Demo PMJAY ID
          </button>
        </div>

        {cardValidationMessage && (
          <div style={{
            width: '100%',
            marginTop: '4px',
            fontSize: '0.75rem',
            color: cardValidationMessage.isValid ? '#34D399' : '#F87171',
            fontWeight: 700
          }}>
            {cardValidationMessage.message}
          </div>
        )}
      </div>

      {/* Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            📑 Active Pre-Auth Claims
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            {claims.length} Cases
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '2px' }}>
            {claims.filter(c => c.schemeType === 'AYUSHMAN_BHARAT_PMJAY').length} Ayushman + {claims.filter(c => c.schemeType === 'COMMERCIAL_TPA').length} Commercial
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚠️ Pre-Auth &gt;80% Buffer Alerts
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            {claims.filter((c) => c.approvedAmount > 0 && (c.runningBillAmount / c.approvedAmount) >= 0.8).length} Cases
          </div>
          <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: '2px' }}>Auto-enhancement recommended</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            ✓ Pre-Auth Approved Total
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            ₹{claims.reduce((s, c) => s + c.approvedAmount, 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '2px' }}>Sanctioned by Insurers / NHA</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            🤝 Patient Out-of-Pocket Liability
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FCD34D', marginTop: '4px' }}>
            ₹{claims.reduce((s, c) => s + c.copayAmount + c.estimatedNonMedicalDeductions, 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>Co-Pay (₹{claims.reduce((s, c) => s + c.copayAmount, 0).toLocaleString('en-IN')}) + Non-Medical (₹{claims.reduce((s, c) => s + c.estimatedNonMedicalDeductions, 0).toLocaleString('en-IN')})</div>
        </Card>
      </div>

      {/* Scheme Tab Selector */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        {[
          { id: 'ALL', label: `All Claims (${claims.length})` },
          { id: 'PMJAY', label: `🇮🇳 Ayushman Bharat PMJAY (${claims.filter(c => c.schemeType === 'AYUSHMAN_BHARAT_PMJAY').length})` },
          { id: 'COMMERCIAL', label: `🏢 Commercial TPAs (${claims.filter(c => c.schemeType === 'COMMERCIAL_TPA').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#0284C7' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2-Column: Worklist & Selected Case Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left: Pre-Auth Claims Table with Utilization Meters */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📋 Cashless Pre-Auth Worklist & Utilization Meter ({filteredClaims.length})
            </span>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient / UHID</TableHead>
                  <TableHead>Insurer & Scheme</TableHead>
                  <TableHead>Pre-Auth Utilization</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Sanctioned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((c) => {
                  const isSelected = selectedClaim?.id === c.id;
                  const utilizationPct = c.approvedAmount > 0 ? Math.round((c.runningBillAmount / c.approvedAmount) * 100) : 0;
                  const isDeficit = c.runningBillAmount > c.approvedAmount;
                  const isWarning = utilizationPct >= 80 && !isDeficit;

                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => setSelectedClaim(c)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <TableCell>
                        <div style={{ fontWeight: 700, color: isSelected ? '#38BDF8' : '#F8FAFC', fontSize: '0.85rem' }}>
                          {c.patientName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{c.patientUhid} • {c.procedureName}</div>
                        <div style={{ marginTop: '3px' }}>{getStatusBadge(c.status)}</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.8rem' }}>{c.insurer}</div>
                        <div style={{ fontSize: '0.7rem', color: c.schemeType === 'AYUSHMAN_BHARAT_PMJAY' ? '#34D399' : '#64748B', fontFamily: 'monospace' }}>
                          {c.pmjayGoldenCardNumber || c.policyNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ minWidth: '130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px' }}>
                            <span style={{ color: '#CBD5E1' }}>Running: ₹{c.runningBillAmount.toLocaleString('en-IN')}</span>
                            <span style={{ fontWeight: 800, color: isDeficit ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981' }}>
                              {utilizationPct}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, utilizationPct)}%`,
                                height: '100%',
                                backgroundColor: isDeficit ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981',
                                transition: 'all 0.3s ease'
                              }}
                            />
                          </div>
                          {isDeficit && (
                            <span style={{ fontSize: '0.65rem', color: '#F87171', fontWeight: 800 }}>
                              🚨 DEFICIT: +₹{(c.runningBillAmount - c.approvedAmount).toLocaleString('en-IN')}
                            </span>
                          )}
                          {isWarning && (
                            <span style={{ fontSize: '0.65rem', color: '#FBBF24', fontWeight: 700 }}>
                              ⚠️ Rem: ₹{(c.approvedAmount - c.runningBillAmount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10B981', fontSize: '0.88rem' }}>
                          ₹{c.approvedAmount.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                          Req: ₹{c.requestedAmount.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Right: Selected Claim Detail, Pre-Auth Utilization Meter & Non-Medical Estimator */}
        {selectedClaim ? (
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Claim ID: {selectedClaim.id}</span>
                  {selectedClaim.schemeType === 'AYUSHMAN_BHARAT_PMJAY' && (
                    <Badge variant="success">PMJAY Golden Card</Badge>
                  )}
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {selectedClaim.patientName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#38BDF8', marginTop: '2px' }}>
                  {selectedClaim.procedureName} {selectedClaim.procedurePackageCode ? `(${selectedClaim.procedurePackageCode})` : ''}
                </div>
              </div>
              <div>{getStatusBadge(selectedClaim.status)}</div>
            </div>

            {/* Continuous Real-Time Pre-Auth Utilization Meter */}
            {(() => {
              const utilPct = selectedClaim.approvedAmount > 0
                ? Math.round((selectedClaim.runningBillAmount / selectedClaim.approvedAmount) * 100)
                : 0;
              const deficitAmount = selectedClaim.runningBillAmount - selectedClaim.approvedAmount;
              const bufferRemaining = selectedClaim.approvedAmount - selectedClaim.runningBillAmount;
              const isDeficit = deficitAmount > 0;
              const isBufferWarning = utilPct >= 80 && !isDeficit;

              return (
                <div style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '10px',
                  padding: '14px',
                  border: isDeficit ? '1.5px solid #EF4444' : isBufferWarning ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                      ⏱️ Pre-Auth Utilization Meter (Live IPD Running Bill)
                    </span>
                    <Badge variant={isDeficit ? 'danger' : isBufferWarning ? 'warning' : 'success'}>
                      {isDeficit ? `🚨 DEFICIT (${utilPct}%)` : isBufferWarning ? `⚠️ 80% BUFFER REACHED (${utilPct}%)` : `NORMAL (${utilPct}%)`}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                    <span>Running Bill: <strong style={{ color: '#F8FAFC' }}>₹{selectedClaim.runningBillAmount.toLocaleString('en-IN')}</strong></span>
                    <span>Approved Limit: <strong style={{ color: '#10B981' }}>₹{selectedClaim.approvedAmount.toLocaleString('en-IN')}</strong></span>
                  </div>

                  <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      width: `${Math.min(100, utilPct)}%`,
                      height: '100%',
                      backgroundColor: isDeficit ? '#EF4444' : isBufferWarning ? '#F59E0B' : '#10B981',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {isDeficit && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#FCA5A5',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>🚨 Running bill exceeds approved pre-auth by ₹{deficitAmount.toLocaleString('en-IN')}!</span>
                      <button
                        type="button"
                        onClick={() => handleTriggerAutoEnhancement(selectedClaim)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#EF4444',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ 1-Tap Enhancement Request
                      </button>
                    </div>
                  )}

                  {isBufferWarning && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#FCD34D',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>⚠️ 80% Threshold Reached. Remaining buffer: ₹{bufferRemaining.toLocaleString('en-IN')}.</span>
                      <button
                        type="button"
                        onClick={() => handleTriggerAutoEnhancement(selectedClaim)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#F59E0B',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#0F172A',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Prepare Auto-Enhancement
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Transparent Co-Pay & Non-Medical Deductions Estimator */}
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  📑 Transparent Co-Pay & Non-Medical Estimator (IRDAI List I-IV)
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Upfront Admission Estimation</span>
              </div>

              {selectedClaim.schemeType === 'AYUSHMAN_BHARAT_PMJAY' ? (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                  ✓ AB-PMJAY Golden Card Package: 100% Cashless. Zero Non-Medical Deductions or Co-Pay chargeable per NHA guidelines.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem', textAlign: 'center' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#94A3B8', display: 'block' }}>TPA Covered</span>
                      <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>₹{selectedClaim.approvedAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#94A3B8', display: 'block' }}>Co-Pay Share</span>
                      <strong style={{ color: '#F59E0B', fontSize: '0.95rem' }}>₹{selectedClaim.copayAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#94A3B8', display: 'block' }}>Non-Medical (IRDAI)</span>
                      <strong style={{ color: '#F87171', fontSize: '0.95rem' }}>₹{selectedClaim.estimatedNonMedicalDeductions.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {selectedClaim.nonMedicalItems && selectedClaim.nonMedicalItems.length > 0 && (
                    <div style={{ fontSize: '0.72rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#94A3B8' }}>Itemized Non-Medical Consumables:</span>
                      {selectedClaim.nonMedicalItems.map((item) => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', marginTop: '2px' }}>
                          <span>• {item.name} ({item.category})</span>
                          <span style={{ fontWeight: 600 }}>₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      Net Estimated Patient Liability: <strong style={{ color: '#FCD34D', fontSize: '0.9rem' }}>₹{(selectedClaim.copayAmount + selectedClaim.estimatedNonMedicalDeductions).toLocaleString('en-IN')}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadNonMedicalDeclaration(selectedClaim)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#38BDF8',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ Patient Declaration Slip
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* NHCX Electronic Digest Badge if already pushed */}
            {selectedClaim.nhcxDigest && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800 }}>NHCX GATEWAY ACKNOWLEDGMENT</div>
                  <div style={{ fontSize: '0.72rem', color: '#F1F5F9', fontFamily: 'monospace' }}>{selectedClaim.nhcxDigest}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInspectFhirBundle(selectedClaim)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#0F172A',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Inspect FHIR R4
                </button>
              </div>
            )}

            {/* Action 1: Query Reply (if query raised) */}
            {selectedClaim.status === 'QUERY_RAISED' && (
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1.5px solid #F59E0B',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.85rem', marginBottom: '6px' }}>
                  ⚠️ TPA Query: Clinical Justification & Pre-Op ECG / Echo Required
                </div>
                <p style={{ fontSize: '0.75rem', color: '#CBD5E1', margin: '0 0 10px 0' }}>
                  Insurer has requested pre-operative diagnostic records and surgeon clinical notes before approving initial sanction.
                </p>
                <button
                  type="button"
                  onClick={handleReplyQuery}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#F59E0B',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {queryReplied ? '✓ Query Documents Dispatched to TPA' : '📤 Upload Documents & Resolve Query'}
                </button>
              </div>
            )}

            {/* Action 2: Manual Request Enhancement */}
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>
                ⚡ Custom Pre-Auth Enhancement Request
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Input
                  type="number"
                  placeholder="Enhancement Amount (₹)"
                  value={enhancementAmount}
                  onChange={(e) => setEnhancementAmount(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRequestEnhancement}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0284C7',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {enhancementSuccess ? '✓ Enhancement Sent' : 'Send to TPA'}
                </button>
              </div>
            </div>

            {/* Quick Action Links & NHCX FHIR Dispatch */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInspectFhirBundle(selectedClaim)}
                style={{ fontWeight: 700 }}
              >
                🔬 Inspect NHCX FHIR R4 Bundle
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDispatchToNhcx(selectedClaim)}
                disabled={isSubmittingToNhcx}
                style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}
              >
                {isSubmittingToNhcx ? '⏳ Pushing to NHCX...' : '⚡ Push to NHCX Gateway'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
            Select a pre-auth case to view actions, utilization meter, and non-medical deductions estimator.
          </Card>
        )}
      </div>

      {/* NHCX FHIR R4 Inspection Modal */}
      {isFhirModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0B132B',
            border: '1.5px solid #10B981',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧬</span>
                <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.95rem' }}>
                  FHIR R4 Electronic Claim Bundle — NHA NHCX Specification
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFhirModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <pre style={{
                margin: 0,
                fontSize: '0.72rem',
                color: '#34D399',
                fontFamily: 'Consolas, Monaco, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                backgroundColor: '#070D1E',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                {fhirBundlePayload}
              </pre>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <Button variant="outline" size="sm" onClick={() => setIsFhirModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(fhirBundlePayload);
                  alert('FHIR JSON copied to clipboard!');
                }}
              >
                📋 Copy JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
