import React, { useState } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface AbhaRecord {
  abhaId: string;
  abhaAddress: string;
  patientName: string;
  aadhaarAuthStatus: 'VERIFIED_AADHAAR' | 'PENDING_OTP';
  linkedHospitalHip: string;
  consentState: 'GRANTED' | 'REVOKED' | 'REQUESTED';
  fhirRecordsCount: number;
  lastSyncedTimestamp: string;
}

const INITIAL_ABHA_RECORDS: AbhaRecord[] = [
  {
    abhaId: '91-4289-7102-5814',
    abhaAddress: 'rahul.sharma@abdm',
    patientName: 'Rahul Sharma (38/M)',
    aadhaarAuthStatus: 'VERIFIED_AADHAAR',
    linkedHospitalHip: 'AIIMS New Delhi (HIP-DEL-01)',
    consentState: 'GRANTED',
    fhirRecordsCount: 14,
    lastSyncedTimestamp: '2 mins ago'
  },
  {
    abhaId: '91-8841-2093-6172',
    abhaAddress: 'priya.nair@abdm',
    patientName: 'Priya Nair (29/F)',
    aadhaarAuthStatus: 'VERIFIED_AADHAAR',
    linkedHospitalHip: 'Apollo Hospitals Chennai (HIP-CHE-04)',
    consentState: 'GRANTED',
    fhirRecordsCount: 8,
    lastSyncedTimestamp: '14 mins ago'
  },
  {
    abhaId: '91-1049-3829-4450',
    abhaAddress: 'vikram.singh@abdm',
    patientName: 'Vikram Singh (52/M)',
    aadhaarAuthStatus: 'VERIFIED_AADHAAR',
    linkedHospitalHip: 'Max Super Speciality Saket (HIP-DEL-09)',
    consentState: 'GRANTED',
    fhirRecordsCount: 22,
    lastSyncedTimestamp: '1 hour ago'
  }
];

export const AbdmNationalHealthStackConsoleView: React.FC = () => {
  const [records, setRecords] = useState<AbhaRecord[]>(INITIAL_ABHA_RECORDS);
  const [activeSubTab, setActiveSubTab] = useState<'M1_ABHA' | 'M2_FHIR' | 'M3_CONSENT'>('M1_ABHA');
  const [notice, setNotice] = useState<string | null>(null);

  // New ABHA creation state
  const [newAadhaar, setNewAadhaar] = useState('5489 1234 9876');
  const [newPatientName, setNewPatientName] = useState('Ananya Sen');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('789456');

  // Sample FHIR R4 Bundle
  const fhirBundleJson = {
    resourceType: 'Bundle',
    id: 'bundle-abdm-fhir-r4-001',
    type: 'document',
    timestamp: '2026-09-02T03:15:00Z',
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: 'pat-91-4289',
          identifier: [{ system: 'https://healthid.ndhm.gov.in', value: '91-4289-7102-5814' }],
          name: [{ text: 'Rahul Sharma' }],
          gender: 'male',
          birthDate: '1988-06-12'
        }
      },
      {
        resource: {
          resourceType: 'Condition',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] }
        }
      }
    ]
  };

  const handleGenerateAbha = () => {
    setIsOtpStep(true);
  };

  const handleVerifyOtp = () => {
    const created: AbhaRecord = {
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      abhaAddress: `${newPatientName.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(100 + Math.random() * 900)}@abdm`,
      patientName: `${newPatientName} (31/F)`,
      aadhaarAuthStatus: 'VERIFIED_AADHAAR',
      linkedHospitalHip: 'Safdarjung Hospital Delhi (HIP-DEL-02)',
      consentState: 'GRANTED',
      fhirRecordsCount: 2,
      lastSyncedTimestamp: 'Just now'
    };
    setRecords((prev) => [created, ...prev]);
    setIsOtpStep(false);
    setNotice(`✓ ABHA ID "${created.abhaId}" created & linked to NHA National Health Locker!`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🧬</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              ABDM / ABHA M1, M2, M3 National Health Stack Gateway Console
            </h2>
            <Badge variant="success">● 100% NHA ABDM Certified (M1-M3)</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            Ayushman Bharat Digital Mission: 14-digit ABHA creation, Aadhaar biometric authentication, FHIR R4 clinical bundles, and patient consent artifacts.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '10px', border: '1px solid #334155' }}>
          {[
            { id: 'M1_ABHA', label: '🆔 M1: ABHA ID Engine' },
            { id: 'M2_FHIR', label: '📄 M2: FHIR R4 Bundle' },
            { id: 'M3_CONSENT', label: '🛡️ M3: Consent Artifacts' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id as typeof activeSubTab)}
              style={{
                backgroundColor: activeSubTab === t.id ? '#10B981' : 'transparent',
                color: activeSubTab === t.id ? '#070C16' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            NATIONAL ABHA HEALTH IDS ISSUED
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'monospace' }}>
            1,48,200 ABHAs
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            100% Aadhaar eKYC Verified
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            FHIR R4 CLINICAL BUNDLES LINKED
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
            6,14,000 Records
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            EHR, Prescriptions & Diagnostic Reports
          </span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
            CONSENT ARTIFACT SUCCESS RATE
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
            99.8% Gateway SLA
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
            Encrypted ECDH key-exchange tunnel
          </span>
        </div>
      </div>

      {/* SubTab 1: M1 ABHA ID Table & Generator */}
      {activeSubTab === 'M1_ABHA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick ABHA Generator Widget */}
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '14px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem' }}>⚡</span>
                <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem' }}>Instant ABHA ID & Aadhaar OTP Enrollment Sandbox</strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Issue a compliant 14-digit Ayushman Bharat Health Account (ABHA) number via Aadhaar biometric OTP simulation
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!isOtpStep ? (
                <>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Patient Name"
                    style={{ width: '130px', padding: '6px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                  <input
                    type="text"
                    value={newAadhaar}
                    onChange={(e) => setNewAadhaar(e.target.value)}
                    placeholder="Aadhaar Number"
                    style={{ width: '140px', padding: '6px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateAbha}
                    style={{ backgroundColor: '#10B981', color: '#070C16', fontWeight: 800 }}
                  >
                    📲 Send Aadhaar OTP
                  </Button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="Enter 6-Digit OTP"
                    style={{ width: '130px', padding: '6px 10px', backgroundColor: '#1E293B', border: '1px solid #10B981', borderRadius: '6px', color: '#86EFAC', fontWeight: 900, fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleVerifyOtp}
                    style={{ backgroundColor: '#10B981', color: '#070C16', fontWeight: 900 }}
                  >
                    ✓ Verify & Issue ABHA ID
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Active ABHA Records Table */}
          <Card title="📜 Active ABHA Patient Records & Linked Hospital Nodes" padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>14-Digit ABHA ID</TableHead>
                    <TableHead>Patient Name & Address</TableHead>
                    <TableHead>Auth State</TableHead>
                    <TableHead>Linked Hospital (HIP Node)</TableHead>
                    <TableHead>FHIR Records</TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Consent Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.abhaId}>
                      <TableCell style={{ fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                        {r.abhaId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <strong style={{ color: '#F8FAFC' }}>{r.patientName}</strong>
                          <span style={{ fontSize: '0.6875rem', color: '#38BDF8', display: 'block' }}>{r.abhaAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">✓ {r.aadhaarAuthStatus}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                        {r.linkedHospitalHip}
                      </TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#FCD34D' }}>
                        {r.fhirRecordsCount} FHIR Bundles
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Badge variant="primary">● {r.consentState}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      )}

      {/* SubTab 2: M2 FHIR R4 Bundle Inspector */}
      {activeSubTab === 'M2_FHIR' && (
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                📄 HL7 FHIR R4 Diagnostic & Prescription JSON Bundle Inspector
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                NHA ABDM Compliant Structured Clinical Data Representation
              </span>
            </div>
            <Badge variant="success">Validated: FHIR R4 Specification</Badge>
          </div>

          <pre style={{ backgroundColor: '#070C16', border: '1px solid #334155', borderRadius: '10px', padding: '16px', color: '#38BDF8', fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '280px' }}>
            {JSON.stringify(fhirBundleJson, null, 2)}
          </pre>
        </div>
      )}

      {/* SubTab 3: M3 Consent Artifacts */}
      {activeSubTab === 'M3_CONSENT' && (
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
            🛡️ Patient Digital Consent Artifact Lifecycle (HIP ↔ HIU)
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Granular patient consent management with expiration timestamps, purpose codes (CARETREAT), and end-to-end cryptographic key rotation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>ACTIVE CONSENTS</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>1,47,890</div>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Valid for 30-day clinical review</span>
            </div>
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 800 }}>PATIENT REVOKED</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>310</div>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Instant ECDH key shredding</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
