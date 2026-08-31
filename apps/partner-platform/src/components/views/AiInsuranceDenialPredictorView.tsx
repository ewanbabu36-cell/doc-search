import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const AiInsuranceDenialPredictorView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<'APPENDICITIS' | 'TKR_RISK' | 'DENGUE'>('TKR_RISK');
  const [autoFixed, setAutoFixed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const casesData = {
    APPENDICITIS: {
      claimNo: 'CLM-2026-9041',
      patientName: 'Rahul Verma (38y/M)',
      policyNo: 'STAR-CORP-884129',
      payerName: 'Star Health & Allied Insurance',
      procedureName: 'Laparoscopic Appendectomy under GA',
      icd10: 'K35.80 (Acute Appendicitis)',
      cptCode: '47.01 (Lap Appendectomy)',
      claimedAmount: 79000,
      approvalProbability: 98.4,
      riskLevel: 'LOW',
      findings: [
        { status: 'PASS', title: 'Clinical & Surgical Coding Concordance', desc: 'ICD-10 K35.80 matches CPT 47.01 with 99.8% semantic alignment.' },
        { status: 'PASS', title: 'Hospitalization Duration Justification', desc: '5-day stay justified due to localized peritonitis risk and parenteral antibiotics.' },
        { status: 'PASS', title: 'Room Rent Capping Compliance', desc: 'Single AC Room (₹3,000/day) is within policy 1% limit (₹5,000/day).' },
        { status: 'PASS', title: 'Mandatory Histopathology Report Attached', desc: 'Specimen Biopsy #HP-2026-441 attached with pathologist signature.' }
      ]
    },
    TKR_RISK: {
      claimNo: 'CLM-2026-9042',
      patientName: 'Sunil Mehta (64y/M)',
      policyNo: 'CARE-PREM-991204',
      payerName: 'Care Health Insurance',
      procedureName: 'Unilateral Total Knee Replacement (TKR Right)',
      icd10: 'M17.11 (Primary Osteoarthritis, Right Knee)',
      cptCode: '81.54 (Total Knee Arthroplasty)',
      claimedAmount: 165000,
      approvalProbability: autoFixed ? 98.8 : 42.1,
      riskLevel: autoFixed ? 'LOW' : 'HIGH_RISK',
      findings: [
        {
          status: autoFixed ? 'PASS' : 'FAIL',
          title: 'Prosthetic Joint Implant Barcode & Vendor Tax Invoice',
          desc: autoFixed ? '✓ Auto-attached: FDA Titanium Knee Implant Barcode #TI-90418 + Manufacturer Invoice.' : '⚠️ CRITICAL: Missing original implant sticker and vendor purchase invoice (Likely 100% claim rejection!).'
        },
        {
          status: autoFixed ? 'PASS' : 'FAIL',
          title: 'Weight-Bearing Pre-Operative Radiograph (X-Ray Bilateral Knees)',
          desc: autoFixed ? '✓ Auto-linked: DICOM X-Ray study showing Grade IV Kellgren-Lawrence joint space loss.' : '⚠️ Missing pre-op standing X-Ray evidence of Kellgren-Lawrence Grade IV OA.'
        },
        {
          status: 'PASS',
          title: 'Pre-Existing Disease (PED) Waiting Period Audit',
          desc: 'Policy age 52 months. 36-month joint replacement waiting period satisfied.'
        },
        {
          status: autoFixed ? 'PASS' : 'WARN',
          title: 'Intra-Operative Antibiotic Prophylaxis & Physiotherapy Chart',
          desc: autoFixed ? '✓ Auto-attached: Post-op Day 1-4 CPM physiotherapy chart.' : '⚠️ Warning: Missing daily physiotherapist range-of-motion assessment.'
        }
      ]
    },
    DENGUE: {
      claimNo: 'CLM-2026-9043',
      patientName: 'Anjali Sharma (29y/F)',
      policyNo: 'HDFC-ERGO-44109',
      payerName: 'HDFC ERGO Health Insurance',
      procedureName: 'Medical Inpatient Management of Dengue with Thrombocytopenia',
      icd10: 'A97.1 (Dengue with warning signs)',
      cptCode: '99.21 (Inpatient Medical Stabilization)',
      claimedAmount: 45000,
      approvalProbability: 84.0,
      riskLevel: 'MODERATE_QUERY_RISK',
      findings: [
        { status: 'PASS', title: 'NS1 Antigen & IgM Serology Lab Verification', desc: 'Positive NS1 ELISA report attached from NABL accredited lab.' },
        { status: 'WARN', title: 'Daily Platelet Trajectory Justification', desc: 'Platelet nadir 24,000/cu mm meets hospitalization criteria. Need daily serial CBC trends.' },
        { status: 'PASS', title: 'Consumables & PPE Kit Cap Compliance', desc: 'Total non-medical consumables ₹1,800 is within IRDAI 5% cap.' }
      ]
    }
  };

  const current = casesData[selectedCase];

  const handleCaseChange = (c: typeof selectedCase) => {
    setSelectedCase(c);
    setAutoFixed(false);
    setSubmitted(false);
  };

  const handleAutoFix = () => {
    setAutoFixed(true);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              AI Insurance Pre-Auth & Claim Denial Risk Predictor
            </h2>
            <Badge variant="primary">IRDAI & TPA Rules AI</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Audits medical necessity, coding concordance & missing document clauses before submission to guarantee 99%+ claim approval.
          </p>
        </div>

        {/* Global Action */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            style={{ fontWeight: 700 }}
          >
            🖨️ Print Pre-Auth Audit Checklist
          </Button>
        </div>
      </div>

      {/* Case Selector Bar */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Select TPA Claim To Audit:
          </span>
          <button
            onClick={() => handleCaseChange('TKR_RISK')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'TKR_RISK' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'TKR_RISK' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'TKR_RISK' ? '#FCA5A5' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            ⚠️ 1. Knee Replacement (High Denial Risk: 42%)
          </button>
          <button
            onClick={() => handleCaseChange('APPENDICITIS')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'APPENDICITIS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'APPENDICITIS' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'APPENDICITIS' ? '#A7F3D0' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🟢 2. Lap Appendectomy (Star Health: 98.4%)
          </button>
          <button
            onClick={() => handleCaseChange('DENGUE')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'DENGUE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'DENGUE' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'DENGUE' ? '#FCD34D' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🟡 3. Dengue Inpatient (Query Risk: 84%)
          </button>
        </div>
      </div>

      {/* 2-Column AI Audit Station */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Left: Claim Approval Health Radar & Financials */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          {/* Claim Metadata Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>{current.patientName}</span>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>Payer: <strong>{current.payerName}</strong> • {current.claimNo}</div>
            </div>
            <Badge variant={current.riskLevel === 'HIGH_RISK' ? 'danger' : current.riskLevel === 'MODERATE_QUERY_RISK' ? 'warning' : 'success'}>
              {current.riskLevel}
            </Badge>
          </div>

          {/* Large AI Approval Probability Meter */}
          <div style={{
            backgroundColor: current.approvalProbability >= 90 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: current.approvalProbability >= 90 ? '2px solid #10B981' : '2px solid #EF4444',
            borderRadius: '14px',
            padding: '18px',
            textAlign: 'center',
            boxShadow: current.approvalProbability >= 90 ? '0 0 25px rgba(16, 185, 129, 0.2)' : '0 0 25px rgba(239, 68, 68, 0.2)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: current.approvalProbability >= 90 ? '#A7F3D0' : '#FCA5A5', textTransform: 'uppercase' }}>
              AI Claim Approval Probability Score:
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: current.approvalProbability >= 90 ? '#10B981' : '#EF4444', fontFamily: 'monospace', margin: '4px 0' }}>
              {current.approvalProbability}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              {current.approvalProbability >= 90 ? '✓ Ready for instant settlement without TPA query.' : '⚠️ High probability of rejection or query hold! Action required.'}
            </div>
          </div>

          {/* Procedure & Coding Details */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><span style={{ color: '#94A3B8' }}>Procedure:</span> <strong style={{ color: '#F8FAFC' }}>{current.procedureName}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>ICD-10 Primary:</span> <strong style={{ color: '#38BDF8' }}>{current.icd10}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>CPT / PCS Code:</span> <strong style={{ color: '#C084FC' }}>{current.cptCode}</strong></div>
            <div><span style={{ color: '#94A3B8' }}>Total Claim Amount:</span> <strong style={{ color: '#10B981', fontSize: '1rem' }}>₹{current.claimedAmount.toLocaleString('en-IN')}</strong></div>
          </div>

          {/* 1-Click Auto-Fix Action */}
          {selectedCase === 'TKR_RISK' && !autoFixed && (
            <Button
              variant="primary"
              size="md"
              onClick={handleAutoFix}
              style={{ width: '100%', fontWeight: 800, backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}
            >
              ⚡ 1-Click AI Auto-Attach Missing Documents & Fix Clauses
            </Button>
          )}
        </div>

        {/* Right: Detailed Rule-by-Rule Audit Breakdown */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📑 IRDAI & TPA Policy Clause Audit Matrix
            </span>
            <Badge variant="neutral">{current.findings.length} Checkpoints</Badge>
          </div>

          {/* Findings List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {current.findings.map((f, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: f.status === 'PASS' ? 'rgba(16, 185, 129, 0.08)' : f.status === 'WARN' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: f.status === 'PASS' ? '1px solid rgba(16, 185, 129, 0.3)' : f.status === 'WARN' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.8125rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: f.status === 'PASS' ? '#10B981' : f.status === 'WARN' ? '#F59E0B' : '#EF4444' }}>
                    {f.status === 'PASS' ? '✓' : '⚠️'} {f.title}
                  </strong>
                  <Badge variant={f.status === 'PASS' ? 'success' : f.status === 'WARN' ? 'warning' : 'danger'}>
                    {f.status}
                  </Badge>
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Submission Action */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              style={{
                width: '100%',
                fontWeight: 800,
                backgroundColor: current.approvalProbability >= 90 ? '#10B981' : '#3B82F6',
                borderColor: current.approvalProbability >= 90 ? '#10B981' : '#3B82F6'
              }}
            >
              {submitted ? '✓ Clean Claim Transmitted to TPA Portal!' : '🚀 Transmit Claim Package to TPA Gateway'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
