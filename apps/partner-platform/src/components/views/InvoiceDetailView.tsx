import React from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  BillingInvoiceDto,
  BillingInvoiceStatus
} from '@docsearch/api-contracts';

export interface InvoiceDetailViewProps {
  invoice: BillingInvoiceDto;
  onBack: () => void;
  onFinalize: (invoice: BillingInvoiceDto) => void;
  onApplyDiscount: (invoice: BillingInvoiceDto) => void;
  onRecordPayment: (invoice: BillingInvoiceDto) => void;
  onCreateCreditNote: (invoice: BillingInvoiceDto) => void;
  onCreateDebitAdjustment: (invoice: BillingInvoiceDto) => void;
  onCancelInvoice: (invoice: BillingInvoiceDto) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onFinalize,
  onApplyDiscount,
  onRecordPayment,
  onCreateCreditNote,
  onCreateDebitAdjustment,
  onCancelInvoice
}) => {
  const getStatusBadge = (status: BillingInvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">PAID IN FULL</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      case 'ISSUED':
        return <Badge variant="primary">ISSUED</Badge>;
      case 'CANCELLED':
      case 'VOIDED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">DRAFT</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" onClick={onBack}>
            ← Back to Invoices
          </Button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Invoice {invoice.invoiceNumber}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              {getStatusBadge(invoice.status)}
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Type: {invoice.invoiceType} | Currency: {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {invoice.status === 'DRAFT' && (
            <>
              <Button variant="primary" onClick={() => onFinalize(invoice)}>
                Finalize & Issue
              </Button>
              <Button variant="danger" onClick={() => onCancelInvoice(invoice)}>
                Cancel Draft
              </Button>
            </>
          )}

          {invoice.dueAmount > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && invoice.status !== 'VOIDED' && (
            <>
              <Button variant="outline" onClick={() => onApplyDiscount(invoice)}>
                + Discount
              </Button>
              <Button variant="outline" onClick={() => onCreateCreditNote(invoice)}>
                + Credit Note
              </Button>
              <Button variant="outline" onClick={() => onCreateDebitAdjustment(invoice)}>
                + Debit Adj.
              </Button>
              <Button variant="primary" onClick={() => onRecordPayment(invoice)}>
                Collect Payment
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Patient & Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Patient Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Patient Name:</span>
              <div style={{ fontWeight: 600 }}>{invoice.patientName}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Medical Record Number (MRN):</span>
              <div style={{ fontWeight: 600 }}>{invoice.patientMrn}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Created Date:</span>
              <div>{new Date(invoice.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Due Date:</span>
              <div>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : 'Immediate'}</div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Financial Settlement Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Gross Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Authorized Discounts:</span>
                <span>-${invoice.discountTotal.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Taxes:</span>
                <span>+${invoice.taxTotal.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span>Total Payable:</span>
              <span>${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
              <span>Amount Paid:</span>
              <span>${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: invoice.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
              <span>Balance Due:</span>
              <span>${invoice.dueAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Line Items */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Billed Service Items ({invoice.items.length})
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Service / Item Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Net Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell style={{ fontWeight: 600 }}>{it.serviceCode}</TableCell>
                  <TableCell>{it.description}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>${it.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${it.grossAmount.toFixed(2)}</TableCell>
                  <TableCell style={{ color: it.discountAmount > 0 ? '#16a34a' : 'inherit' }}>
                    {it.discountAmount > 0 ? `-$${it.discountAmount.toFixed(2)}` : '$0.00'}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>${it.netAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Discounts Applied */}
      {invoice.discounts.length > 0 && (
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Authorized Discounts Applied
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Amount Credited</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><Badge variant="neutral">{d.discountType}</Badge></TableCell>
                    <TableCell>{d.discountType === 'PERCENTAGE' ? `${d.discountValue}%` : `$${d.discountValue.toFixed(2)}`}</TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>-${d.discountAmount.toFixed(2)}</TableCell>
                    <TableCell>{d.reason}</TableCell>
                    <TableCell>{d.approvedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
