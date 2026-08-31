import React from 'react';
import type { PaymentRecordDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PaymentRecordListViewProps {
  payments: PaymentRecordDto[];
}

export const PaymentRecordListView: React.FC<PaymentRecordListViewProps> = ({ payments }) => {
  return (
    <Card
      title="Payment Registry & Audit Logs"
      subtitle="Audit entries for external settlement confirmations (Audit-verified settlement records)"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Record ID</TableHead>
              <TableHead>Invoice Reference</TableHead>
              <TableHead>Provider Method</TableHead>
              <TableHead>Provider Reference</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No payment audit records found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                    {p.id}
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                    {p.invoiceNumber}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{p.provider}</TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                    {p.providerReference ?? 'N/A'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.paymentStatus === 'SUCCEEDED' ? 'success' : 'neutral'}>
                      {p.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
