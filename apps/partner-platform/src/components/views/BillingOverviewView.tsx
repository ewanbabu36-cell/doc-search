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
  BillingOverviewDto,
  BillingInvoiceDto,
  BillingChargeDto,
  BillingPaymentDto,
  BillingCashierSessionDto
} from '@docsearch/api-contracts';

export interface BillingOverviewViewProps {
  overview: BillingOverviewDto;
  invoices: BillingInvoiceDto[];
  charges: BillingChargeDto[];
  payments: BillingPaymentDto[];
  cashierSessions: BillingCashierSessionDto[];
  onOpenCreateInvoice: () => void;
  onOpenCaptureCharge: () => void;
  onOpenRecordPayment: () => void;
  onOpenCashierSession: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  onOpenTab: (tabKey: string) => void;
}

export const BillingOverviewView: React.FC<BillingOverviewViewProps> = ({
  overview,
  invoices,
  payments,
  cashierSessions,
  onOpenCreateInvoice,
  onOpenCaptureCharge,
  onOpenRecordPayment,
  onOpenCashierSession,
  onSelectInvoice,
  onOpenTab
}) => {
  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = payments.slice(0, 5);
  const openSessions = cashierSessions.filter((s) => s.status === 'OPEN');

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">PAID</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">PARTIAL</Badge>;
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
      {/* Header Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Revenue Cycle & Billing Operations
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Multi-tenant healthcare financial management, point-of-care charge capture, commercial invoicing & cashier reconciliation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={onOpenCaptureCharge}>
            + Capture Charge
          </Button>
          <Button variant="outline" onClick={onOpenRecordPayment}>
            + Collect Payment
          </Button>
          <Button variant="outline" onClick={onOpenCashierSession}>
            Open Shift
          </Button>
          <Button variant="primary" onClick={onOpenCreateInvoice}>
            + New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Today's Collections
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
            ${overview.todayCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {overview.invoicesPaidToday} invoices settled today
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Revenue Billed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>
            ${overview.totalRevenueToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {overview.invoicesIssuedToday} issued today
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Outstanding Receivables
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
            ${overview.totalOutstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Active open balances
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Overdue Invoices
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
            {overview.overdueInvoicesCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Past standard payment terms
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Cashier Shifts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6', marginTop: '0.25rem' }}>
            {overview.activeCashierSessionsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            POS workstation floats open
          </div>
        </Card>
      </div>

      {/* Active Cashier Sessions Alert / Banner */}
      {openSessions.length > 0 && (
        <Card style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Badge variant="primary">ACTIVE DRAWER</Badge>
              <span style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 600 }}>
                {openSessions.map((s) => `${s.sessionNumber} (${s.cashierName}) — Float: $${s.openingBalance.toFixed(2)}`).join(' | ')}
              </span>
            </div>
            <Button variant="outline" onClick={() => onOpenTab('cashier-sessions')}>
              Manage Workstation Shifts
            </Button>
          </div>
        </Card>
      )}

      {/* Two Column Layout: Recent Invoices & Recent Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Invoices Card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Recent Commercial Invoices
            </h3>
            <Button variant="subtle" onClick={() => onOpenTab('invoices')}>
              View Directory →
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>{inv.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.patientMrn}</div>
                    </TableCell>
                    <TableCell>${inv.totalAmount.toFixed(2)}</TableCell>
                    <TableCell style={{ color: inv.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      ${inv.dueAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button variant="outline" onClick={() => onSelectInvoice(inv.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Recent Payments Card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Recent Collections & Receipts
            </h3>
            <Button variant="subtle" onClick={() => onOpenTab('payment-collection')}>
              Cashier Terminal →
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((pmt) => (
                  <TableRow key={pmt.id}>
                    <TableCell style={{ fontWeight: 600 }}>{pmt.paymentNumber}</TableCell>
                    <TableCell>
                      <div>{pmt.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pmt.patientMrn}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{pmt.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#16a34a' }}>
                      ${pmt.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pmt.status === 'SUCCESS' ? 'success' : 'warning'}>
                        {pmt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};
