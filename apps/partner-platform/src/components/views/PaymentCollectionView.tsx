import { InstantUPISplitSettlementStudio } from './InstantUPISplitSettlementStudio.js';
import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  BillingPaymentDto,
  BillingReceiptDto,
  BillingPaymentMethod,
  BillingPaymentStatus
} from '@docsearch/api-contracts';

export interface PaymentCollectionViewProps {
  payments: BillingPaymentDto[];
  receipts: BillingReceiptDto[];
  onOpenRecordPayment: () => void;
  onOpenIssueReceipt: (payment: BillingPaymentDto) => void;
  onOpenRefundRequest: (payment: BillingPaymentDto) => void;
}

export const PaymentCollectionView: React.FC<PaymentCollectionViewProps> = ({
  payments,
  receipts,
  onOpenRecordPayment,
  onOpenIssueReceipt,
  onOpenRefundRequest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchNumber = p.paymentNumber.toLowerCase().includes(lower);
      const matchPatient = p.patientName.toLowerCase().includes(lower) || p.patientMrn.toLowerCase().includes(lower);
      const matchRef = p.referenceNumber && p.referenceNumber.toLowerCase().includes(lower);
      if (!matchNumber && !matchPatient && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (status: BillingPaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="success">SUCCESS</Badge>;
      case 'PARTIALLY_REFUNDED':
        return <Badge variant="warning">PARTIAL REFUND</Badge>;
      case 'REFUNDED':
        return <Badge variant="danger">REFUNDED</Badge>;
      case 'FAILED':
      case 'REVERSED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: BillingPaymentMethod) => {
    return <Badge variant="neutral">{method}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Cashier POS & Collection Workbench
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Real-time cashier settlement, multi-channel payment capture, receipt dispatch ({receipts.length} issued), and refund requests
          </p>
        </div>
        <Button variant="primary" onClick={onOpenRecordPayment}>
          + Direct Payment Collection
        </Button>
      </div>

      <InstantUPISplitSettlementStudio />

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Payments
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by payment #, patient name, MRN, or gateway reference..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Payment Method
            </label>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Payment Methods' },
                { value: 'CASH', label: 'Cash Currency' },
                { value: 'CARD', label: 'Credit / Debit Card POS' },
                { value: 'UPI', label: 'UPI / QR Code Scan' },
                { value: 'BANK_TRANSFER', label: 'Bank Wire / Transfer' },
                { value: 'WALLET', label: 'Digital Wallet' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Payment Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
                { value: 'REFUNDED', label: 'Fully Refunded' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Payment Ledger Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Invoice Ref</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No payment records match the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((pmt) => (
                  <TableRow key={pmt.id}>
                    <TableCell style={{ fontWeight: 600 }}>{pmt.paymentNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{pmt.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pmt.patientMrn}</div>
                    </TableCell>
                    <TableCell>{pmt.invoiceNumber || 'Advance Deposit'}</TableCell>
                    <TableCell>{getMethodBadge(pmt.paymentMethod)}</TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#16a34a' }}>
                      ${pmt.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(pmt.status)}</TableCell>
                    <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <div>{pmt.receivedBy}</div>
                      <div>{new Date(pmt.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button variant="outline" onClick={() => onOpenIssueReceipt(pmt)}>
                          Receipt
                        </Button>
                        {pmt.status === 'SUCCESS' && (
                          <Button variant="outline" onClick={() => onOpenRefundRequest(pmt)}>
                            Refund
                          </Button>
                        )}
                      </div>
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
