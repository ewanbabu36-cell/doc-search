import React from 'react';
import type { OperationalStaffAuditTraceDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface StaffAuditVaultViewProps {
  auditTraces: OperationalStaffAuditTraceDto[];
}

export const StaffAuditVaultView: React.FC<StaffAuditVaultViewProps> = ({ auditTraces }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Cryptographic Staff Administration Audit Vault">
        Every staff onboarding, role assignment, status transition, credential verification, and inter-department relocation is permanently committed to this immutable audit trace.
      </Alert>

      <Card
        title="Staff Administration Audit Stream"
        subtitle="Cryptographic audit trail capturing actor roles, operational actions, and required business justifications"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Operation Status</TableHead>
                <TableHead>Audit Justification</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero staff audit traces recorded.
                  </TableCell>
                </TableRow>
              ) : (
                auditTraces.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {a.traceId}
                    </TableCell>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {a.action}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{a.actorId}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {a.actorRole}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {a.targetEntityId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {a.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                      {a.justification}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {a.correlationId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(a.occurredAt).toLocaleString()}
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
