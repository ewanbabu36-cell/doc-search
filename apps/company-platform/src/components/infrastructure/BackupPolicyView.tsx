import React from 'react';
import type { BackupPolicyDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface BackupPolicyViewProps {
  policies: BackupPolicyDto[];
}

export const BackupPolicyView: React.FC<BackupPolicyViewProps> = ({ policies }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Backup & Retention Policies"
        subtitle="Automated snapshot schedules, cross-region replication, encryption keys, and immutable WORM settings"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Code</TableHead>
                <TableHead>Policy Name</TableHead>
                <TableHead>Target Resource</TableHead>
                <TableHead>Schedule Reference</TableHead>
                <TableHead>Retention Days</TableHead>
                <TableHead>Encryption</TableHead>
                <TableHead>Cross-Region</TableHead>
                <TableHead>Immutable (WORM)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.policyCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.policyName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    <Badge variant="neutral">{p.resourceType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.scheduleReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {p.retentionDays} days
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.encryptionReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.crossRegionEnabled ? 'success' : 'neutral'}>
                      {p.crossRegionEnabled ? 'ENABLED (us-west-2)' : 'DISABLED'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.immutableBackupEnabled ? 'success' : 'neutral'}>
                      {p.immutableBackupEnabled ? 'LOCKED (WORM)' : 'STANDARD'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status}
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
