import React from 'react';
import type { InfrastructureAuditTraceDto } from '@docsearch/api-contracts';
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

export interface InfrastructureAuditTraceViewProps {
  auditTraces: InfrastructureAuditTraceDto[];
}

export const InfrastructureAuditTraceView: React.FC<InfrastructureAuditTraceViewProps> = ({
  auditTraces
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Authoritative Infrastructure Audit Stream">
        Every infrastructure modification, manual health probe, backup initiation, verification check, DR simulation drill, and regional failover trigger writes an immutable cryptographic record to <code>core.audit_events</code>.
      </Alert>

      <Card
        title="Infrastructure & Disaster Recovery Audit Trail"
        subtitle="Cryptographic trace logs, actor email signatures, and compliance correlation keys"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor Account</TableHead>
                <TableHead>Resource Reference</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence / Correlation</TableHead>
                <TableHead>Reason / Justification</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero infrastructure audit traces recorded.
                  </TableCell>
                </TableRow>
              ) : (
                auditTraces.map((tr) => (
                  <TableRow key={tr.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {tr.traceId}
                    </TableCell>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {tr.action}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {tr.actorEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {tr.resourceReference}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{tr.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tr.operationStatus === 'SUCCESS' ? 'success' : tr.operationStatus === 'SIMULATED' ? 'warning' : 'danger'}>
                        {tr.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {tr.evidenceReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                      {tr.reason}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(tr.occurredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
