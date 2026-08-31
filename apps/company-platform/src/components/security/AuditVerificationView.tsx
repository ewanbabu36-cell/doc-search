import React from 'react';
import type { SecurityAuditVerificationDto } from '@docsearch/api-contracts';
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

export interface AuditVerificationViewProps {
  verifications: SecurityAuditVerificationDto[];
}

export const AuditVerificationView: React.FC<AuditVerificationViewProps> = ({
  verifications
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Cryptographic Audit Integrity Layer">
        Audit verification records validate the cryptographic hash chain and write-ahead log integrity of <code>core.audit_events</code> to ensure compliance with SOC 2 CC6.1 and HIPAA audit controls.
      </Alert>

      <Card
        title="Audit Chain Verifications & Evidence Log"
        subtitle="Independent verification records, validation timestamps, and formal auditor signatures"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verification Code</TableHead>
                <TableHead>Audit Event Ref</TableHead>
                <TableHead>Verification Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead>Evidence Artifact</TableHead>
                <TableHead>Notes & Rationale</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No audit verifications recorded.
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {v.verificationCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {v.auditEventReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <Badge variant="neutral">{v.verificationType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.verificationStatus === 'VERIFIED_VALID' ? 'success' : 'danger'}>
                        {v.verificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {v.verifiedByEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {v.evidenceReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      {v.notes}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(v.verifiedAt).toLocaleString()}
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
