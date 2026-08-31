import React from 'react';
import type { RestoreVerificationDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface RestoreVerificationViewProps {
  verifications: RestoreVerificationDto[];
}

export const RestoreVerificationView: React.FC<RestoreVerificationViewProps> = ({ verifications }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Automated Integrity Verification">
        Backups are automatically restored nightly into an isolated sandbox container to execute table checksum verifications and validate zero-data-loss restoration pipelines.
      </Alert>

      <Card
        title="Restore Verification & Integrity Test Results"
        subtitle="Automated restore drills, cryptographic table verification, and compliance evidence records"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verification Code</TableHead>
                <TableHead>Source Backup</TableHead>
                <TableHead>Target Env</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead>Evidence Pointer</TableHead>
                <TableHead>Notes & Findings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((v) => (
                <TableRow key={v.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {v.verificationCode}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {v.backupCode ?? v.backupId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{v.targetEnvironment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{v.verificationType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {v.verifiedByEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {v.evidenceReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                    {v.notes ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'PASSED' ? 'success' : 'danger'}>
                      {v.status}
                    </Badge>
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
