import React from 'react';
import type { PatientRegistrationAuditTraceDto } from '@docsearch/api-contracts';
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

export interface PatientAuditVaultViewProps {
  auditTraces: PatientRegistrationAuditTraceDto[];
}

export const PatientAuditVaultView: React.FC<PatientAuditVaultViewProps> = ({ auditTraces }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Patient Registration & MPI Audit Vault
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Immutable cryptographic ledger of patient creations, demographic edits, identifier attachments, consent grants, and merge events
        </span>
      </div>

      <Alert type="info" title="Privacy-Conscious Audit Vault">
        In accordance with HIPAA and regional data privacy standards, audit records contain entity references and operational justifications without exposing raw patient PII.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor & Role</TableHead>
                <TableHead>Target Entity & ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audit Justification</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero audit traces recorded.
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
                      {a.targetEntity}: <strong>{a.targetEntityId}</strong>
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
