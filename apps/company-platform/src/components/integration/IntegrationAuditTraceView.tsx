import React from 'react';
import type { IntegrationAuditTraceDto } from '@docsearch/api-contracts';
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

export interface IntegrationAuditTraceViewProps {
  auditTraces: IntegrationAuditTraceDto[];
}

export const IntegrationAuditTraceView: React.FC<IntegrationAuditTraceViewProps> = ({
  auditTraces
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Immutable Integration Audit Trail">
        All control-plane mutations, route registrations, FHIR resource adjustments, webhook retries, and secret rotations write tamper-evident records to `core.audit_events`.
      </Alert>

      <Card
        title="Integration Control-Plane Audit Traces"
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
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero integration audit traces recorded.
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
