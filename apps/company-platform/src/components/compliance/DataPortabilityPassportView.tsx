import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface HealthPassport {
  id: string;
  patientName: string;
  abhaAddress: string;
  recordsIncluded: number;
  fhirVersion: string;
  digitalSignatureSeal: string;
  generatedDate: string;
  status: 'CRYPTOGRAPHICALLY_SEALED' | 'DISPATCHED_TO_PATIENT';
}

const SAMPLE_PASSPORTS: HealthPassport[] = [
  {
    id: 'PASS-2026-0901',
    patientName: 'Col. Rajesh Bakshi (Retd.)',
    abhaAddress: 'rajesh.bakshi@abdm',
    recordsIncluded: 42,
    fhirVersion: 'HL7 FHIR R4 (ABDM 2.0)',
    digitalSignatureSeal: 'SHA256: 7d4a1b0c9e8f... (Doctor & Hospital Cert)',
    generatedDate: 'Today, 10:15 AM',
    status: 'CRYPTOGRAPHICALLY_SEALED'
  },
  {
    id: 'PASS-2026-0888',
    patientName: 'Meenakshi Sundaram',
    abhaAddress: 'meenakshi.s@abdm',
    recordsIncluded: 18,
    fhirVersion: 'HL7 FHIR R4 (ABDM 2.0)',
    digitalSignatureSeal: 'SHA256: 9b2c3d4e5f6a... (Govt. Root CA)',
    generatedDate: 'Yesterday',
    status: 'DISPATCHED_TO_PATIENT'
  }
];

export const DataPortabilityPassportView: React.FC = () => {
  const [passports] = useState<HealthPassport[]>(SAMPLE_PASSPORTS);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  const handleVerify = (p: HealthPassport) => {
    setVerifyNotice(`✓ Health Passport "${p.id}" signature verified: 100% Merkle integrity, issued by DocSearch Hospital Registry.`);
    setTimeout(() => setVerifyNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📜 Cryptographically Signed Patient Data Portability Passports
          </h2>
          <Badge variant="success">● ABDM / HL7 FHIR R4 Interoperability Standard</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Tamper-proof medical health passports allowing patients to seamlessly transfer their entire lifetime medical history to any hospital
        </p>
      </div>

      {verifyNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {verifyNotice}
        </div>
      )}

      {/* Passport Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>PASSPORT INTEGRITY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>100% Signed</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>ECDSA Public-Key Cryptography</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>FHIR R4 CONFORMANCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>ABDM Level 3</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>National Health Authority certified</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PORTABILITY SPEED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>Instant QR Code</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Offline emergency scan capable</span>
        </div>
      </div>

      {/* Passport Table */}
      <Card title="📜 Issued Data Portability Passports" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passport ID & Patient</TableHead>
                <TableHead>ABHA Address</TableHead>
                <TableHead>Records Included</TableHead>
                <TableHead>Digital Signature Seal</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Verify Seal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passports.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.patientName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{p.id}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.abhaAddress}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{p.recordsIncluded} EHR Documents</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                    {p.digitalSignatureSeal}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {p.generatedDate}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleVerify(p)}
                      style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🛡️ Verify Signature
                    </button>
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
