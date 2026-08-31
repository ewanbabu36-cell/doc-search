import React from 'react';
import type { PlatformAuditTraceDto } from '@docsearch/api-contracts';
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

export interface PlatformAuditTraceViewProps {
  auditTraces: PlatformAuditTraceDto[];
}

export const PlatformAuditTraceView: React.FC<PlatformAuditTraceViewProps> = ({
  auditTraces
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Authoritative Audit Integration">
        Every platform mutation — including pipeline execution, deployment promotions, emergency rollbacks, artifact registrations, and secret reference rotations — writes an immutable cryptographic record to <code>core.audit_events</code>.
      </Alert>

      <Card
        title="Platform Engineering Audit Stream"
        subtitle="Cryptographic verification records, actor identities, and correlation keys"
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
                <TableHead>Status</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Correlation Reference</TableHead>
                <TableHead>Evidence Pointer</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero platform engineering audit traces recorded.
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
                      <Badge variant={tr.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {tr.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{tr.environment}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {tr.correlationReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {tr.evidenceReference}
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
