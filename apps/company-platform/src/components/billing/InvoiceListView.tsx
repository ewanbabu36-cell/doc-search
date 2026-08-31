import React, { useState } from 'react';
import type { InvoiceDto, InvoiceStatus } from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface InvoiceListViewProps {
  invoices: InvoiceDto[];
  onSelectInvoice: (invoiceId: string) => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  onSelectInvoice
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');

  const filtered = invoices.filter((i) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!i.invoiceNumber.toLowerCase().includes(q) && !i.partnerTradeName.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Invoices
            </label>
            <Input
              placeholder="Search invoice number or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Invoice Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Issued', value: 'ISSUED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Paid', value: 'PAID' },
                { label: 'Overdue', value: 'OVERDUE' },
                { label: 'Void', value: 'VOID' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No invoice records found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell style={{ fontWeight: '500' }}>
                      {inv.partnerTradeName}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'neutral'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectInvoice(inv.id)}>
                        Inspect Record
                      </Button>
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
