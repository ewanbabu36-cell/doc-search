import React from 'react';
import type { CompanyAuditTraceDto } from '@docsearch/api-contracts';
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

export interface CompanyAuditTraceViewProps {
  auditTraces: CompanyAuditTraceDto[];
}

export const CompanyAuditTraceView: React.FC<CompanyAuditTraceViewProps> = ({ auditTraces }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Authoritative Corporate Audit Trail">
        Every corporate structure modification, department reorganization, employee onboarding, board member appointment, policy ratification, and regulatory officer designation writes an immutable record to <code>core.audit_events</code>.
      </Alert>

      <Card
        title="Corporate Administration & Board Audit Trail"
        subtitle="Cryptographic audit logs, signatory emails, and legal resolution references"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trace ID</TableHead>
                <TableHead>Corporate Action</TableHead>
                <TableHead>Signatory Account</TableHead>
                <TableHead>Entity / Policy Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence Pointer</TableHead>
                <TableHead>Business Justification</TableHead>
                <TableHead>Occurred At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero corporate audit traces recorded.
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
                      {tr.entityReference}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tr.operationStatus === 'SUCCESS' ? 'success' : 'danger'}>
                        {tr.operationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {tr.evidenceReference ?? '—'}
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
