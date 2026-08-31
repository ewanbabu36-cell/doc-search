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
  BillingInvoiceStatus
} from '@docsearch/api-contracts';

export interface InvoiceDirectoryViewProps {
  invoices: BillingInvoiceDto[];
  onOpenCreateInvoice: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  onOpenRecordPayment: (invoice: BillingInvoiceDto) => void;
}

export const InvoiceDirectoryView: React.FC<InvoiceDirectoryViewProps> = ({
  invoices,
  onOpenCreateInvoice,
  onSelectInvoice,
  onOpenRecordPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && inv.invoiceType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const matchNumber = inv.invoiceNumber.toLowerCase().includes(lower);
      const matchPatient = inv.patientName.toLowerCase().includes(lower) || inv.patientMrn.toLowerCase().includes(lower);
      if (!matchNumber && !matchPatient) return false;
    }
    return true;
  });

  const getStatusBadge = (status: BillingInvoiceStatus) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Commercial Invoice Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Enterprise healthcare commercial invoices across OPD, IPD, Diagnostics, and Pharmacy billing streams
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateInvoice}>
          + Create New Invoice
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Search Invoices
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, patient name, or MRN..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Filter by Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ISSUED', label: 'Issued (Unpaid)' },
                { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
                { value: 'PAID', label: 'Paid in Full' },
                { value: 'OVERDUE', label: 'Overdue Receivables' },
                { value: 'CANCELLED', label: 'Cancelled / Voided' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
              Invoice Type
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'OPD', label: 'Outpatient (OPD)' },
                { value: 'IPD', label: 'Inpatient (IPD)' },
                { value: 'DIAGNOSTICS', label: 'Diagnostics' },
                { value: 'PHARMACY', label: 'Pharmacy' },
                { value: 'EMERGENCY', label: 'Emergency' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Billed</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Outstanding Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No invoices match the selected filter criteria.
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
                    <TableCell>
                      <Badge variant="neutral">{inv.invoiceType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${inv.totalAmount.toFixed(2)}</TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>
                      ${inv.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell style={{ color: inv.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                      ${inv.dueAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button variant="outline" onClick={() => onSelectInvoice(inv.id)}>
                          Details
                        </Button>
                        {inv.dueAmount > 0 && inv.status !== 'CANCELLED' && inv.status !== 'VOIDED' && (
                          <Button variant="primary" onClick={() => onOpenRecordPayment(inv)}>
                            Pay
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
