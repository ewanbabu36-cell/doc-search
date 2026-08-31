import React from 'react';
import type { InvoiceDto, PaymentRecordDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
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

export interface InvoiceProfileViewProps {
  invoice: InvoiceDto;
  payments: PaymentRecordDto[];
  onBack: () => void;
}

export const InvoiceProfileView: React.FC<InvoiceProfileViewProps> = ({
  invoice,
  payments,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Invoices Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Invoice {invoice.invoiceNumber}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Partner: {invoice.partnerTradeName}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="neutral">Currency: {invoice.currency}</Badge>
          <Badge variant={invoice.status === 'PAID' ? 'success' : 'neutral'}>
            Status: {invoice.status}
          </Badge>
        </div>
      </div>

      <Alert type="info" title="Live Telemetry Notice">
        <strong>Live financial figures not connected.</strong> Amounts and tax totals reflect neutral baseline records and do not represent real financial collection transactions.
      </Alert>

      {/* Invoice Overview Card */}
      <Card title="Invoice Metadata & Billing Schedule" padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Issue Date:</span>
            <div style={{ fontWeight: '500' }}>{new Date(invoice.issueDate).toLocaleDateString()}</div>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Due Date:</span>
            <div style={{ fontWeight: '500' }}>{new Date(invoice.dueDate).toLocaleDateString()}</div>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Subtotal:</span>
            <div style={{ fontWeight: '600' }}>${invoice.subtotal} {invoice.currency}</div>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Total Amount:</span>
            <div style={{ fontWeight: '700', color: 'var(--ds-color-primary)' }}>${invoice.totalAmount} {invoice.currency}</div>
          </div>
        </div>
      </Card>

      {/* Associated Payment Records */}
      <Card
        title="Associated Payment Records"
        subtitle="Cryptographically logged payment confirmations and provider audit references"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Record ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Provider Reference</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No payment records associated with this invoice.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {p.id}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{p.provider}</TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {p.providerReference ?? 'N/A'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Pending'}
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
    </div>
  );
};
