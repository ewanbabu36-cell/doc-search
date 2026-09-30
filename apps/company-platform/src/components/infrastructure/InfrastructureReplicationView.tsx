import React from 'react';
import type { InfrastructureReplicationLinkDto } from '@docsearch/api-contracts';
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

export interface InfrastructureReplicationViewProps {
  replicationLinks: InfrastructureReplicationLinkDto[];
}

export const InfrastructureReplicationView: React.FC<InfrastructureReplicationViewProps> = ({
  replicationLinks
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Cross-Region Streaming Replication">
        Live replication telemetry active — Cross-region PostgreSQL streaming replication healthy with TLS encryption.
      </Alert>

      <Card
        title="Cross-Region Database Replication Streams"
        subtitle="Source to target replication slots, synchronization mode, and link health heartbeats"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Replication Code</TableHead>
                <TableHead>Source Database & Region</TableHead>
                <TableHead>Target Database & Region</TableHead>
                <TableHead>Replication Mode</TableHead>
                <TableHead>Replication Lag</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replicationLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {link.replicationCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                      {link.sourceDatabaseName}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                      {link.sourceRegionCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                      {link.targetDatabaseName}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                      {link.targetRegionCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{link.replicationMode}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                    {link.lagReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: link.failureCount > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-text-muted)' }}>
                    {link.failureCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={link.status === 'HEALTHY' ? 'success' : 'warning'}>
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(link.lastVerifiedAt).toLocaleTimeString()}
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
