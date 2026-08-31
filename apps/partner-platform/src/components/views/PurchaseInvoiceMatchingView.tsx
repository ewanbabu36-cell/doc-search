import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  PurchaseInvoiceDto,
  PurchaseInvoiceMatchDto
} from '@docsearch/api-contracts';

export interface PurchaseInvoiceMatchingViewProps {
  invoices: PurchaseInvoiceDto[];
  matches: PurchaseInvoiceMatchDto[];
  onOpenCreateInvoice: () => void;
  onOpenMatchInvoice: (inv: PurchaseInvoiceDto) => void;
}

export const PurchaseInvoiceMatchingView: React.FC<PurchaseInvoiceMatchingViewProps> = ({
  invoices,
  matches,
  onOpenCreateInvoice,
  onOpenMatchInvoice
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = invoices.filter((i) =>
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.vendorInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Accounts Payable 2-Way & 3-Way Invoice Matching
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Automated tolerance verification matching Purchase Order rates, Goods Receipts (GRN), and Supplier Invoices.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateInvoice}>
          + Record Supplier Invoice
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search supplier invoices..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
          Supplier Invoices Pending / Matched ({invoices.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Internal #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor & Bill #</th>
                <th style={{ padding: '0.75rem 1rem' }}>PO & GRN Ref</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Invoice Total</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Matching Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Payment Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{inv.vendorName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bill: {inv.vendorInvoiceNumber}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {inv.poNumber || 'No PO'} {inv.grnNumber ? ' • ' + inv.grnNumber : ''}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ${inv.totalAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={inv.matchingStatus === 'MATCHED_3WAY' ? 'success' : inv.matchingStatus === 'VARIANCE_FLAGGED' ? 'danger' : 'warning'}>
                      {inv.matchingStatus}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={inv.paymentStatus === 'PAID' ? 'success' : 'neutral'}>
                      {inv.paymentStatus}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {inv.matchingStatus === 'PENDING_MATCH' && (
                      <Button variant="primary" size="sm" onClick={() => onOpenMatchInvoice(inv)}>
                        Run Match
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {matches.length > 0 && (
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Recent Automated Matching Runs ({matches.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {matches.map((m) => (
              <div key={m.id} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div>
                  <strong>{m.matchingType}</strong>: {m.discrepancyDetails}
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>By {m.matchedBy} at {new Date(m.matchedAt).toLocaleTimeString()}</div>
                </div>
                <Badge variant={m.status === 'EXACT_MATCH' ? 'success' : 'danger'}>{m.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};