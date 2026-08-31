import React from 'react';
import type { BAARecordDto } from '@docsearch/api-contracts';
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

export interface BAAComplianceViewProps {
  baaRecords: BAARecordDto[];
}

export const BAAComplianceView: React.FC<BAAComplianceViewProps> = ({
  baaRecords
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Business Associate Agreement (BAA) Governance">
        Under HIPAA §164.502(e) and §164.504(e), Doc Search maintains executed Business Associate Agreements with all healthcare provider partners prior to operational data exchange. <strong>Signed BAA document references are recorded; raw document contents are stored securely in external document vaults.</strong>
      </Alert>

      <Card
        title="Active Partner Business Associate Agreements (BAAs)"
        subtitle="Executed legal covenants, renewal schedules, and attestation references"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BAA Reference Code</TableHead>
                <TableHead>Partner Legal Entity</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Review Schedule</TableHead>
                <TableHead>Signed Document Reference</TableHead>
                <TableHead>Legal Lead</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baaRecords.map((b) => (
                <TableRow key={b.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {b.baaCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{b.partnerName}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {b.effectiveDate ? new Date(b.effectiveDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {b.expirationDate ? new Date(b.expirationDate).toLocaleDateString() : 'Indefinite'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {b.reviewDueDate ? new Date(b.reviewDueDate).toLocaleDateString() : 'Annual'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {b.signedReference}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {b.ownerEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        b.status === 'ACTIVE'
                          ? 'success'
                          : b.status === 'EXPIRING'
                          ? 'warning'
                          : b.status === 'EXPIRED'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {b.status}
                    </Badge>
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
