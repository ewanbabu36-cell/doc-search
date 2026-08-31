import React, { useState } from 'react';
import type { BackupRecordDto, BackupPolicyDto, BackupType } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { BackupTriggerDialog } from './BackupTriggerDialog.js';

export interface BackupRecordViewProps {
  records: BackupRecordDto[];
  policies: BackupPolicyDto[];
  onTriggerBackup: (policyId: string, resourceReference: string, backupType: BackupType, environment: string, reason: string) => Promise<void>;
}

export const BackupRecordView: React.FC<BackupRecordViewProps> = ({
  records,
  policies,
  onTriggerBackup
}) => {
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Database Backup History & Cryptographic Digests
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Audited immutable snapshots and continuous WAL archives
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsTriggerModalOpen(true)}>
          💾 Trigger On-Demand Backup
        </Button>
      </div>

      {/* Backups Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Code</TableHead>
                <TableHead>Target Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Storage Pointer</TableHead>
                <TableHead>Retention Until</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {r.backupCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{r.resourceReference}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{r.backupType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{r.environment}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                    {r.sizeReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {r.storageReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(r.retentionUntil).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                      {r.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'SUCCEEDED' ? 'success' : 'danger'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {isTriggerModalOpen && (
        <BackupTriggerDialog
          isOpen={isTriggerModalOpen}
          onClose={() => setIsTriggerModalOpen(false)}
          policies={policies}
          onTriggerBackup={onTriggerBackup}
        />
      )}
    </div>
  );
};
