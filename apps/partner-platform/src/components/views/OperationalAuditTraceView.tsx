import React from 'react';
import type { OperationalAuditTraceDto } from '@docsearch/api-contracts';
import { Card, Badge, Alert, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface OperationalAuditTraceViewProps {
  auditTraces: OperationalAuditTraceDto[];
}

export const OperationalAuditTraceView: React.FC<OperationalAuditTraceViewProps> = ({
  auditTraces
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Authoritative Operational Audit Vault">
        Every partner onboarding event, clinic/hospital registration, facility branch creation, entitlement update, and status mutation generates an immutable cryptographic audit event.
      </Alert>

      <Card
        title="Partner & Operational Audit Log"
        subtitle="Cryptographic trace logs capturing actor roles, target entities, and business justifications"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Operational Action</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Audit Justification</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero operational audit traces found for this scope.
                  </TableCell>
                </TableRow>
              ) : (
                auditTraces.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {t.traceId}
                    </TableCell>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {t.action}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{t.actorId}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {t.actorRole}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {t.targetEntityId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {t.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {t.correlationId}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                      {t.justification}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.occurredAt).toLocaleString()}
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
