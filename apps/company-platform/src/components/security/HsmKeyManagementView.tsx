import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface HsmKey {
  keyId: string;
  keyAlias: string;
  algorithm: string;
  hsmModule: string;
  creationDate: string;
  rotationSchedule: string;
  status: 'ACTIVE_PRIMARY' | 'IN_ROTATION' | 'ARCHIVED';
}

const INITIAL_KEYS: HsmKey[] = [
  {
    keyId: 'kms-key-aes-emr-master',
    keyAlias: 'DocSearch Patient EMR Column-Level Master Key',
    algorithm: 'AES-256 GCM (Authenticated Encryption)',
    hsmModule: 'AWS CloudHSM FIPS 140-3 Level 3 Cluster',
    creationDate: '2026-01-01',
    rotationSchedule: 'Every 90 Days (Auto-Rotate)',
    status: 'ACTIVE_PRIMARY'
  },
  {
    keyId: 'kms-key-merkle-sign',
    keyAlias: 'Audit Trail SHA-256 Merkle Root Signing Key',
    algorithm: 'ECDSA SECP256K1 Digital Signatures',
    hsmModule: 'Dedicated Hardware Security Module (Mumbai)',
    creationDate: '2026-01-01',
    rotationSchedule: 'Every 180 Days',
    status: 'ACTIVE_PRIMARY'
  },
  {
    keyId: 'kms-key-dicom-s3',
    keyAlias: 'PACS / DICOM Radiological Imaging Storage Key',
    algorithm: 'AES-256 SSE-KMS',
    hsmModule: 'AWS Key Management Service (ap-south-1)',
    creationDate: '2026-03-15',
    rotationSchedule: 'Annual (365 Days)',
    status: 'ACTIVE_PRIMARY'
  }
];

export const HsmKeyManagementView: React.FC = () => {
  const [keys, setKeys] = useState<HsmKey[]>(INITIAL_KEYS);
  const [rotationMsg, setRotationMsg] = useState<string | null>(null);

  const handleRotateKey = (kId: string) => {
    setRotationMsg(`⚡ Key rotation initiated for "${kId}": New cryptographic material generated in Hardware Security Module with zero downtime!`);
    setKeys((prev) =>
      prev.map((k) => (k.keyId === kId ? { ...k, creationDate: 'Today (Rotated)' } : k))
    );
    setTimeout(() => setRotationMsg(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🔑 HSM & Cloud KMS Hardware Encryption Key Manager
          </h2>
          <Badge variant="success">● FIPS 140-3 Level 3 Certified Hardware</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Envelope encryption key management ensuring all patient records, EMR notes, and Merkle audit trees are encrypted with tamper-proof keys
        </p>
      </div>

      {rotationMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {rotationMsg}
        </div>
      )}

      {/* Keys Table */}
      <Card title="📜 Cryptographic Key Inventory & Hardware Modules" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Alias & Identifier</TableHead>
                <TableHead>Cryptographic Cipher</TableHead>
                <TableHead>Hardware Security Module (HSM)</TableHead>
                <TableHead>Rotation Policy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.keyId}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{k.keyAlias}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{k.keyId}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {k.algorithm}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {k.hsmModule}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {k.rotationSchedule}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">● {k.status.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleRotateKey(k.keyId)}
                      style={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#38BDF8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔄 Rotate Key
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
