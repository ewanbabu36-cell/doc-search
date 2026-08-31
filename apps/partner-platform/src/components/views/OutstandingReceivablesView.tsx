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
  BillingInvoiceDto,
  RevenueAnalyticsDto
} from '@docsearch/api-contracts';

export interface OutstandingReceivablesViewProps {
  invoices: BillingInvoiceDto[];
  analytics: RevenueAnalyticsDto;
  onOpenRecordPayment: (invoice: BillingInvoiceDto) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const OutstandingReceivablesView: React.FC<OutstandingReceivablesViewProps> = ({
  invoices,
  analytics,
  onOpenRecordPayment,
  onSelectInvoice
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState<string>('ALL');

  const openInvoices = invoices.filter((inv) => inv.dueAmount > 0 && inv.status !== 'CANCELLED' && inv.status !== 'VOIDED');

  const filteredInvoices = openInvoices.filter((inv) => {
    if (agingFilter === 'OVERDUE' && inv.status !== 'OVERDUE') return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchNumber = inv.invoiceNumber.toLowerCase().includes(lower);
      const matchPatient = inv.patientName.toLowerCase().includes(lower) || inv.patientMrn.toLowerCase().includes(lower);
      if (!matchNumber && !matchPatient) return false;
    }
    return true;
  });

  const totalOutstanding = openInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Outstanding Receivables & Aging Ledger
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Real-time patient debt monitoring, aging distribution buckets (0-30, 31-60, 61-90, 90+ days), and collection management
        </p>
      </div>

      {/* Aging Summary Buckets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Current (0–30 Days)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            ${analytics.agingBuckets.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Active standard term
          </div>
        </Card>

        <Card style={{ borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            31–60 Days Past Due
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
            ${analytics.agingBuckets.bucket30To60.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Mild collection alert
          </div>
        </Card>

        <Card style={{ borderTop: '4px solid #ea580c' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            61–90 Days Past Due
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ea580c', marginTop: '0.25rem' }}>
            ${analytics.agingBuckets.bucket60To90.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Escalated follow-up
          </div>
        </Card>

        <Card style={{ borderTop: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            90+ Days Overdue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
            ${analytics.agingBuckets.over90.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Critical delinquency risk
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Receivables
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, patient name, or MRN..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Aging Filter
            </label>
            <Select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Unpaid Invoices' },
                { value: 'OVERDUE', label: 'Overdue Invoices Only' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Receivables Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Unsettled Invoice Receivables ({filteredInvoices.length})
          </h3>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Total Filtered Dues: <strong style={{ color: '#dc2626' }}>${totalOutstanding.toFixed(2)}</strong>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Total Billed</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No outstanding receivables match the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{inv.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.patientMrn}</div>
                    </TableCell>
                    <TableCell>${inv.totalAmount.toFixed(2)}</TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>
                      ${inv.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell style={{ color: '#dc2626', fontWeight: 700 }}>
                      ${inv.dueAmount.toFixed(2)}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem' }}>
                      {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : 'Immediate'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'OVERDUE' ? 'danger' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button variant="outline" onClick={() => onSelectInvoice(inv.id)}>
                          Details
                        </Button>
                        <Button variant="primary" onClick={() => onOpenRecordPayment(inv)}>
                          Collect
                        </Button>
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
