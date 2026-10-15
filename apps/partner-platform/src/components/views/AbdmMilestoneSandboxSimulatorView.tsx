import React, { useState } from 'react';
import { Badge, Button, Alert } from '@docsearch/ui-kit';

export const AbdmMilestoneSandboxSimulatorView: React.FC = () => {
  const [activeMilestone, setActiveMilestone] = useState<'M1' | 'M2' | 'M3'>('M1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // M1 State
  const [aadhaarInput, setAadhaarInput] = useState('9999-5432-1098');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [abhaGenerated, setAbhaGenerated] = useState(false);
  const [scanShareCounter, setScanShareCounter] = useState<Array<{ token: string; name: string; time: string; abhaAddress: string }>>([
    { token: '#M1-101', name: 'Ramesh Kumar', time: 'Just now', abhaAddress: 'ramesh.kumar@abdm' },
    { token: '#M1-102', name: 'Anjali Verma', time: '2 mins ago', abhaAddress: 'anjali.verma@abdm' }
  ]);

  // M2 State
  const [selectedCareContext, setSelectedCareContext] = useState('OPD-2026-9042');
  const [contextLinked, setContextLinked] = useState(false);
  const [fhirBundleGenerated, setFhirBundleGenerated] = useState(false);
  const [fhirPayload, setFhirPayload] = useState<any>(null);

  // M3 State
  const [externalHospital, setExternalHospital] = useState('AIIMS New Delhi');
  const [consentStatus, setConsentStatus] = useState<'IDLE' | 'REQUESTED' | 'GRANTED'>('IDLE');
  const [fetchedRecords, setFetchedRecords] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // M1: Generate Aadhaar OTP
  const handleSendAadhaarOtp = () => {
    setOtpSent(true);
    setOtpInput('123456');
    showToast('Aadhaar OTP sent successfully! Demo OTP 123456 auto-filled.');
  };

  // M1: Verify OTP and Mint ABHA
  const handleVerifyAadhaarOtp = () => {
    setAbhaGenerated(true);
    showToast('ABHA ID 91-8765-4321-0987 successfully minted with NHA ABDM Registry!');
  };

  // M1: Simulate Scan and Share QR
  const handleSimulateScanShare = () => {
    const nextToken = `#M1-${103 + scanShareCounter.length}`;
    setScanShareCounter((prev) => [
      { token: nextToken, name: 'Sunil Mehta', time: 'Just now', abhaAddress: 'sunil.mehta@abdm' },
      ...prev
    ]);
    showToast(`⚡ Scan-and-Share Token ${nextToken} issued via NHA ABDM Counter!`);
  };

  // M2: Link Care Context
  const handleLinkCareContext = () => {
    setContextLinked(true);
    showToast(`Care Context ${selectedCareContext} linked to NHA ABDM HIP Registry!`);
  };

  // M2: Generate FHIR R4 Bundle
  const handleGenerateFhirBundle = () => {
    const bundle = {
      resourceType: 'Bundle',
      id: `bundle-abdm-${Date.now()}`,
      type: 'document',
      timestamp: new Date().toISOString(),
      identifier: {
        system: 'https://ndhm.in/fhir/bundles',
        value: `NHA-FHIR-${selectedCareContext}`
      },
      entry: [
        {
          resource: {
            resourceType: 'Composition',
            id: 'comp-01',
            status: 'final',
            type: {
              coding: [{ system: 'https://projecteka.in/snomed', code: 'OPConsultation', display: 'Outpatient Consultation' }]
            },
            subject: { reference: 'Patient/ABHA-91-8765-4321-0987', display: 'Ramesh Kumar' },
            author: [{ reference: 'Practitioner/DOC-102', display: 'Dr. Vivek Sharma' }],
            title: 'DocSearch National Health Authority Digital Prescription'
          }
        },
        {
          resource: {
            resourceType: 'MedicationRequest',
            id: 'med-01',
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
              coding: [
                { system: 'http://snomed.info/sct', code: '312', display: 'Telmisartan 40mg (Jan Aushadhi #JA-312)' }
              ]
            },
            dosageInstruction: [{ text: '1 Tab OD morning after breakfast for 30 Days' }]
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-vitals-01',
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood Pressure' }] },
            component: [
              { code: { text: 'Systolic' }, valueQuantity: { value: 128, unit: 'mmHg' } },
              { code: { text: 'Diastolic' }, valueQuantity: { value: 82, unit: 'mmHg' } }
            ]
          }
        }
      ]
    };
    setFhirPayload(bundle);
    setFhirBundleGenerated(true);
    showToast('Valid HL7 FHIR R4 Encrypted Bundle generated matching NHA specification!');
  };

  // M3: Request Consent
  const handleRequestConsent = () => {
    setConsentStatus('REQUESTED');
    showToast(`Consent request dispatched to patient ABHA app for records from ${externalHospital}!`);
  };

  // M3: Patient Approves Consent
  const handleApproveConsent = () => {
    setConsentStatus('GRANTED');
    showToast('Patient approved consent on ABHA Aarogya Setu app! Cryptographic token verified.');
  };

  // M3: Fetch Decrypted Records
  const handleFetchRecords = () => {
    setFetchedRecords([
      {
        hospital: 'AIIMS New Delhi',
        date: '14 Jan 2025',
        type: 'Discharge Summary',
        doctor: 'Dr. S. K. Mukherjee',
        diagnosis: 'Mild Unstable Angina (Managed Conservatively with Dual Antiplatelets)',
        investigation: 'Coronary Angiography (LAD 40% stenosis, non-flow limiting)'
      },
      {
        hospital: 'Max Super Speciality Saket',
        date: '02 Aug 2024',
        type: 'Diagnostic Report',
        doctor: 'Dr. Neha Saxena',
        diagnosis: 'Routine Health Checkup',
        investigation: 'Lipid Profile (Total Cholesterol: 218 mg/dL, LDL: 136 mg/dL)'
      }
    ]);
    showToast('Successfully decrypted 2 past health records from National ABDM Health Information Exchange!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <Alert type="success" title="🇮🇳 NHA ABDM Gateway Notification" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1.5px solid #0284C7',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(2, 132, 199, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.2)',
              border: '2px solid #38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}
          >
            🇮🇳
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                NHA ABDM Milestone 1, 2, 3 National Sandbox Simulator
              </h2>
              <Badge variant="success">Sandbox Gateway v0.5</Badge>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Ayushman Bharat Digital Mission (ABDM) National Health Authority compliance & certification testing console.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
            ● ABDM Gateway: Connected (api.abdm.gov.in)
          </span>
        </div>
      </div>

      {/* 3-Milestone Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveMilestone('M1')}
          style={{
            backgroundColor: activeMilestone === 'M1' ? 'rgba(2, 132, 199, 0.25)' : '#0F172A',
            border: `2px solid ${activeMilestone === 'M1' ? '#0284C7' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
            Milestone 1 (M1)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            ABHA Minting & Scan-and-Share
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Aadhaar OTP • 14-digit ABHA • Counter Token QR
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMilestone('M2')}
          style={{
            backgroundColor: activeMilestone === 'M2' ? 'rgba(16, 185, 129, 0.25)' : '#0F172A',
            border: `2px solid ${activeMilestone === 'M2' ? '#10B981' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 800, textTransform: 'uppercase' }}>
            Milestone 2 (M2)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            HIP Care Context & FHIR Bundle
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            HL7 FHIR R4 • ECDH Encrypted Push to NHA
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMilestone('M3')}
          style={{
            backgroundColor: activeMilestone === 'M3' ? 'rgba(168, 85, 247, 0.25)' : '#0F172A',
            border: `2px solid ${activeMilestone === 'M3' ? '#A855F7' : '#1E293B'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>
            Milestone 3 (M3)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            HIU Inter-Hospital Consent & Records
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Consent Manager • Cross-Hospital Data Pull
          </div>
        </button>
      </div>

      {/* MILESTONE 1 PANEL */}
      {activeMilestone === 'M1' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          {/* Left: ABHA Creation Flow */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8', margin: 0 }}>
              Step 1: Aadhaar OTP ABHA Card Generator
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
              Simulates government UIDAI Aadhaar OTP verification to create a verifiable 14-digit Ayushman Bharat Health Account.
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                PATIENT AADHAAR / MOBILE NUMBER:
              </label>
              <input
                type="text"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              />
            </div>

            {!otpSent ? (
              <Button variant="primary" size="md" onClick={handleSendAadhaarOtp} style={{ fontWeight: 800 }}>
                📲 Send Aadhaar OTP (Simulated)
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', display: 'block', marginBottom: '4px' }}>
                    ENTER 6-DIGIT OTP RECEIVED ON PHONE:
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #10B981', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 800, letterSpacing: '4px' }}
                  />
                </div>
                <Button variant="primary" size="md" onClick={handleVerifyAadhaarOtp} style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}>
                  ✓ Verify OTP & Mint ABHA ID
                </Button>
              </div>
            )}

            {/* Official ABHA Card Preview */}
            {abhaGenerated && (
              <div
                style={{
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>NATIONAL HEALTH AUTHORITY</span>
                  <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>Ramesh Kumar</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Gender: Male • Year of Birth: 1974</div>
                <div style={{ marginTop: '12px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>ABHA Number:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '2px' }}>91-8765-4321-0987</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '2px' }}>ABHA Address: ramesh.kumar@abdm</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Scan and Share OPD Reception Counter */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34D399', margin: 0 }}>
                Step 2: NHA Scan-and-Share QR Token Counter
              </h3>
              <Badge variant="success">Active Reception QR</Badge>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
              Patients scan this QR code using Aarogya Setu / ABHA app. Demographics are shared instantly, eliminating OPD registration queues.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '12px', width: '160px', margin: '0 auto' }}>
              {/* Simulated QR Pattern */}
              <div style={{ width: '128px', height: '128px', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.65rem', textAlign: 'center', fontWeight: 800, padding: '4px' }}>
                [NHA SCAN & SHARE QR CODE]
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleSimulateScanShare} style={{ fontWeight: 800, alignSelf: 'center' }}>
              📱 Simulate Patient QR Scan (Issue Token)
            </Button>

            <div style={{ marginTop: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                Recent Scan-and-Share Queue Tokens:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {scanShareCounter.map((tok, idx) => (
                  <div key={idx} style={{ backgroundColor: '#1E293B', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#38BDF8', fontSize: '0.85rem' }}>{tok.token}</strong>
                      <span style={{ color: '#F8FAFC', fontSize: '0.8rem', marginLeft: '8px' }}>{tok.name}</span>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{tok.abhaAddress}</div>
                    </div>
                    <Badge variant="neutral">{tok.time}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE 2 PANEL */}
      {activeMilestone === 'M2' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          {/* Left: Link Care Context & Encrypt */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34D399', margin: 0 }}>
              HIP Care Context Linkage & Push Engine
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
              Links patient hospital encounters (OPD prescriptions, IPD discharge summaries) to their ABHA account on the national gateway.
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                SELECT HOSPITAL ENCOUNTER CARE CONTEXT:
              </label>
              <select
                value={selectedCareContext}
                onChange={(e) => setSelectedCareContext(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="OPD-2026-9042">OPD-2026-9042 (Cardiology Consultation - Ramesh Kumar)</option>
                <option value="IPD-2026-8812">IPD-2026-8812 (Laparoscopic Appendectomy - Rahul Verma)</option>
                <option value="LAB-2026-4401">LAB-2026-4401 (NABL Lipid & Troponin Profile - Ramesh Kumar)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="primary" size="md" onClick={handleLinkCareContext} style={{ flex: 1, fontWeight: 800, backgroundColor: contextLinked ? '#10B981' : '#0284C7' }}>
                {contextLinked ? '✓ Care Context Linked to ABDM' : '🔗 Link Context to NHA Gateway'}
              </Button>
            </div>

            <Button variant="outline" size="md" onClick={handleGenerateFhirBundle} style={{ fontWeight: 800, borderColor: '#34D399', color: '#34D399' }}>
              ⚡ 1-Click Generate Valid HL7 FHIR R4 Bundle
            </Button>

            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#94A3B8' }}>
              <div>🔒 Encryption Spec: ECDH (Curve25519) + AES-256-GCM</div>
              <div>📜 Standard: HL7 FHIR R4 (NHA NRCES India Core Profile v1.0)</div>
              <div>📡 Gateway Endpoint: /v0.5/health-information/hip/on-request</div>
            </div>
          </div>

          {/* Right: FHIR Payload Inspector */}
          <div style={{ backgroundColor: '#05070B', border: '1px solid #1E293B', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                HL7 FHIR R4 JSON Bundle Preview:
              </span>
              {fhirBundleGenerated && <Badge variant="success">Valid FHIR R4</Badge>}
            </div>

            <pre
              style={{
                flex: 1,
                minHeight: '280px',
                backgroundColor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '12px',
                color: '#A5B4FC',
                fontSize: '0.72rem',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}
            >
              {fhirPayload
                ? JSON.stringify(fhirPayload, null, 2)
                : '// Click "1-Click Generate Valid HL7 FHIR R4 Bundle" to produce certified NHA payload.'}
            </pre>
          </div>
        </div>
      )}

      {/* MILESTONE 3 PANEL */}
      {activeMilestone === 'M3' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          {/* Left: HIU Consent Request */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#C084FC', margin: 0 }}>
              HIU Inter-Hospital Consent Request
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
              Request cryptographic consent to pull past medical records from external hospitals across India via the ABDM network.
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                TARGET HEALTHCARE FACILITY:
              </label>
              <select
                value={externalHospital}
                onChange={(e) => setExternalHospital(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="AIIMS New Delhi">AIIMS New Delhi (HFR ID: IN-DL-AIIMS-01)</option>
                <option value="Max Super Speciality Saket">Max Super Speciality Saket (HFR ID: IN-DL-MAX-04)</option>
                <option value="Apollo Hospitals Chennai">Apollo Hospitals Greams Road (HFR ID: IN-TN-APL-02)</option>
              </select>
            </div>

            {consentStatus === 'IDLE' && (
              <Button variant="primary" size="md" onClick={handleRequestConsent} style={{ fontWeight: 800, backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
                📡 Request Patient Consent via ABDM
              </Button>
            )}

            {consentStatus === 'REQUESTED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', padding: '10px 14px', borderRadius: '8px', color: '#FCD34D', fontSize: '0.8rem' }}>
                  ⏳ Awaiting Patient Consent Approval on their ABHA App...
                </div>
                <Button variant="primary" size="md" onClick={handleApproveConsent} style={{ fontWeight: 800, backgroundColor: '#10B981', borderColor: '#10B981' }}>
                  ✓ Simulate Patient Tap "Approve Consent" on Phone
                </Button>
              </div>
            )}

            {consentStatus === 'GRANTED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '10px 14px', borderRadius: '8px', color: '#6EE7B7', fontSize: '0.8rem' }}>
                  ✅ Consent Granted! Cryptographic signature verified by NHA Gateway.
                </div>
                <Button variant="primary" size="md" onClick={handleFetchRecords} style={{ fontWeight: 800, backgroundColor: '#0284C7', borderColor: '#0284C7' }}>
                  📥 Fetch & Decrypt External Hospital Records
                </Button>
              </div>
            )}
          </div>

          {/* Right: Decrypted External Records Timeline */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase' }}>
              Decrypted Inter-Hospital Medical Records:
            </span>

            {fetchedRecords.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.82rem', textAlign: 'center', padding: '30px' }}>
                No external records fetched yet. Request and approve consent to retrieve historical data.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fetchedRecords.map((rec, idx) => (
                  <div key={idx} style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{rec.hospital}</strong>
                      <Badge variant="primary">{rec.date}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>{rec.type} • Attending: {rec.doctor}</div>
                    <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '4px' }}><strong>Diagnosis:</strong> {rec.diagnosis}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}><strong>Findings:</strong> {rec.investigation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
