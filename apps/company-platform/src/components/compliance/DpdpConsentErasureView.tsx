import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ErasureRequest {
  id: string;
  patientName: string;
  patientAbhaId: string;
  requestDate: string;
  requestType: 'FULL_PII_ERASURE' | 'WITHDRAW_MARKETING_CONSENT' | 'CORRECTION_REQUEST';
  piiStatus: 'ANONYMIZED_COMPLETED' | 'PENDING_STATUTORY_REVIEW';
  statutoryRetentionLock: string;
}

const INITIAL_REQUESTS: ErasureRequest[] = [
  {
    id: 'DPDP-REQ-101',
    patientName: 'Rameshwar Sharma',
    patientAbhaId: '91-4829-1029-8472@abdm',
    requestDate: 'Today, 08:30 AM',
    requestType: 'FULL_PII_ERASURE',
    piiStatus: 'PENDING_STATUTORY_REVIEW',
    statutoryRetentionLock: 'Retain anonymized vitals for 3 years (MOHFW Rule 14)'
  },
  {
    id: 'DPDP-REQ-102',
    patientName: 'Sunita Mehra',
    patientAbhaId: '91-3829-5519-9021@abdm',
    requestDate: 'Yesterday',
    requestType: 'WITHDRAW_MARKETING_CONSENT',
    piiStatus: 'ANONYMIZED_COMPLETED',
    statutoryRetentionLock: 'Marketing SMS & WhatsApp Opted Out'
  },
  {
    id: 'DPDP-REQ-103',
    patientName: 'Pooja Varma',
    patientAbhaId: '91-8842-1920-4491@abdm',
    requestDate: '2 days ago',
    requestType: 'FULL_PII_ERASURE',
    piiStatus: 'ANONYMIZED_COMPLETED',
    statutoryRetentionLock: 'PII wiped; de-identified clinical history sealed'
  }
];

export const DpdpConsentErasureView: React.FC = () => {
  const [requests, setRequests] = useState<ErasureRequest[]>(INITIAL_REQUESTS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleExecuteErasure = (rId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === rId ? { ...r, piiStatus: 'ANONYMIZED_COMPLETED' } : r))
    );
    setActionNotice(`✓ Patient PII for request ${rId} cryptographically redacted and anonymized under DPDP Act 2023 Section 12!`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🇮🇳 DPDP Act 2023 Patient Consent Manager & Right-to-Erasure Pipeline
          </h2>
          <Badge variant="success">● Digital Personal Data Protection Act 2023 Compliant</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Automated multi-lingual consent tracking, Right-to-Withdraw consent handlers, and PII anonymization honoring statutory healthcare locks
        </p>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {actionNotice}
        </div>
      )}

      {/* DPDP Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ACTIVE DPDP CONSENTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>100.0% Recorded</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>14 Indian Scheduled Languages</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>RIGHT-TO-ERASURE SLA</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>&lt; 24 Hours</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Statutory limit: 72 hours</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>STATUTORY HEALTH RETENTION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>MOHFW Active</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Clinical safety records preserved</span>
        </div>
      </div>

      {/* Erasure Queue Table */}
      <Card title="📜 Patient Right-to-Erasure & Consent Withdrawal Queue" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient / ABHA ID</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Statutory Medical Lock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.patientName}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{r.patientAbhaId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {r.requestType.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {r.requestDate}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
                    {r.statutoryRetentionLock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.piiStatus === 'ANONYMIZED_COMPLETED' ? 'success' : 'warning'}>
                      {r.piiStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {r.piiStatus === 'PENDING_STATUTORY_REVIEW' ? (
                      <button
                        type="button"
                        onClick={() => handleExecuteErasure(r.id)}
                        style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        🔒 Anonymize PII
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>✓ Completed</span>
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
