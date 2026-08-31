import React from 'react';
import type { DataRetentionPolicyDto } from '@docsearch/api-contracts';
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
  TableCell,
  Alert
} from '@docsearch/ui-kit';

export interface RetentionPolicyListViewProps {
  policies: DataRetentionPolicyDto[];
  onSelectPolicy: (policyId: string) => void;
}

export const RetentionPolicyListView: React.FC<RetentionPolicyListViewProps> = ({
  policies,
  onSelectPolicy
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Alert type="warning" title="Retention Pipeline Enforcement Notice">
        Retention configuration does not itself execute deletion or archival. Enforcement requires a connected lifecycle pipeline.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Code & Name</TableHead>
                <TableHead>Default Retention Period</TableHead>
                <TableHead>Legal Hold</TableHead>
                <TableHead>Deletion Method</TableHead>
                <TableHead>Archive Before Delete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <code style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                        {p.policyCode}
                      </code>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {p.defaultRetentionDays} Days ({(p.defaultRetentionDays / 365).toFixed(1)} Years)
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.legalHoldSupported ? 'success' : 'neutral'}>
                      {p.legalHoldSupported ? 'Supported' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {p.deletionMethod}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.archiveBeforeDelete ? 'primary' : 'neutral'}>
                      {p.archiveBeforeDelete ? 'Mandatory' : 'Direct Purge'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectPolicy(p.id)}>
                      Inspect Rules
                    </Button>
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
