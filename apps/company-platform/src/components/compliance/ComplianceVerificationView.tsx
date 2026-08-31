import React from 'react';
import type { ComplianceVerificationDto } from '@docsearch/api-contracts';
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

export interface ComplianceVerificationViewProps {
  verifications: ComplianceVerificationDto[];
}

export const ComplianceVerificationView: React.FC<ComplianceVerificationViewProps> = ({
  verifications
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Independent Verification & Evidence Audit Log">
        Authoritative log of formal auditor reviews, automated technical evaluations, and signed compliance attestation records.
      </Alert>

      <Card
        title="Compliance Verification & Attestation Log"
        subtitle="Cryptographic verification records, validation dates, and auditor findings"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verification Code</TableHead>
                <TableHead>Control Code</TableHead>
                <TableHead>Verification Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verifier Account</TableHead>
                <TableHead>Evidence Artifact</TableHead>
                <TableHead>Findings Narrative</TableHead>
                <TableHead>Verification Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero compliance verifications recorded.
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                      {v.verificationCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {v.controlCode}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <Badge variant="neutral">{v.verificationType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.status === 'VERIFIED'
                            ? 'success'
                            : v.status === 'REQUIRES_REVIEW'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {v.verifierEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {v.evidenceReference}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      {v.findings}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(v.verificationDate).toLocaleDateString()}
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
