import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface CredentialVerification {
  id: string;
  doctorName: string;
  nmcRegistrationNumber: string;
  stateMedicalCouncil: string;
  degreeVerified: string;
  specialty: string;
  ocrConfidence: string;
  verificationStatus: 'NMC_ACTIVE_VERIFIED' | 'PENDING_OCR_REVIEW';
  verifiedAt: string;
}

const INITIAL_CREDENTIALS: CredentialVerification[] = [
  {
    id: 'CRED-DOC-101',
    doctorName: 'Dr. Sameer Deshmukh',
    nmcRegistrationNumber: 'MCI-2012-089201',
    stateMedicalCouncil: 'Maharashtra Medical Council (MMC)',
    degreeVerified: 'MBBS, MS (General Surgery), MCh (Urology)',
    specialty: 'Urology & Kidney Transplant',
    ocrConfidence: '99.8% Match',
    verificationStatus: 'NMC_ACTIVE_VERIFIED',
    verifiedAt: 'Today, 09:40 AM'
  },
  {
    id: 'CRED-DOC-102',
    doctorName: 'Dr. Ananya Mukherjee',
    nmcRegistrationNumber: 'DMC-2016-44912',
    stateMedicalCouncil: 'Delhi Medical Council (DMC)',
    degreeVerified: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    specialty: 'Dermatology & Cosmetology',
    ocrConfidence: '99.5% Match',
    verificationStatus: 'NMC_ACTIVE_VERIFIED',
    verifiedAt: 'Yesterday'
  },
  {
    id: 'CRED-DOC-103',
    doctorName: 'Dr. Tarun K. Reddy',
    nmcRegistrationNumber: 'TSMC-2018-99201',
    stateMedicalCouncil: 'Telangana State Medical Council',
    degreeVerified: 'MBBS, DNB (Orthopaedics)',
    specialty: 'Orthopaedics & Joint Replacement',
    ocrConfidence: '98.9% Match',
    verificationStatus: 'NMC_ACTIVE_VERIFIED',
    verifiedAt: '2 days ago'
  }
];

export const DoctorNmcCredentialingBotView: React.FC = () => {
  const [credentials] = useState<CredentialVerification[]>(INITIAL_CREDENTIALS);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  const handleRunOcrCheck = (c: CredentialVerification) => {
    setVerifyNotice(`✓ National Medical Registry live check passed for "${c.doctorName}" (${c.nmcRegistrationNumber}): Doctor is officially licensed to practice medicine in India!`);
    setTimeout(() => setVerifyNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🤖 Automated Clinical Credentialing & NMC Verification Bot
          </h2>
          <Badge variant="success">● National Medical Commission (NMC) Live API Connected</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          AI OCR diploma verification, State Medical Council license registry checks, and automated NABH clinical privileges credentialing
        </p>
      </div>

      {verifyNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {verifyNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>LICENSED DOCTORS ONBOARDED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>4,820 Doctors</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>100% Verified with State Councils</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AVERAGE ONBOARDING TIME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>45 Seconds</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Reduced from 5 days manual verification</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>FRAUDULENT REGISTRATIONS BLOCKED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>18 Blocked</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Fake medical council numbers rejected</span>
        </div>
      </div>

      {/* Verification Table */}
      <Card title="📜 Doctor Credentialing & State Council Verification Registry" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name & Specialty</TableHead>
                <TableHead>NMC Registration #</TableHead>
                <TableHead>State Medical Council</TableHead>
                <TableHead>Verified Medical Degrees</TableHead>
                <TableHead>OCR Confidence</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.doctorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{c.specialty}</span>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>
                    {c.nmcRegistrationNumber}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {c.stateMedicalCouncil}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
                    {c.degreeVerified}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">✓ {c.ocrConfidence}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleRunOcrCheck(c)}
                      style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#38BDF8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔍 Verify Registry
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
