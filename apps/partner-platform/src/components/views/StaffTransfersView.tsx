import React from 'react';
import type { StaffTransferDto } from '@docsearch/api-contracts';
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

export interface StaffTransfersViewProps {
  transfers: StaffTransferDto[];
}

export const StaffTransfersView: React.FC<StaffTransfersViewProps> = ({ transfers }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Audited Operational Staff Relocations">
        Staff transfers between clinical departments, physical branches, or parent healthcare organizations require explicit authorization and clinical justifications.
      </Alert>

      <Card
        title="Staff Transfer & Secondment History"
        subtitle="Audited inter-department and inter-facility staff movement logs"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Transfer Type</TableHead>
                <TableHead>Origin (From)</TableHead>
                <TableHead>Destination (To)</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Authorized By & Justification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero staff transfers recorded.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {t.staffName ?? 'Staff Member'}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{t.transferType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{t.fromBranchName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {t.fromDepartmentName}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      <strong>{t.toBranchName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {t.toDepartmentName}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(t.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.transferStatus === 'COMPLETED' ? 'success' : 'warning'}>
                        {t.transferStatus}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <strong>{t.authorizedBy}</strong>: {t.justification}
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
