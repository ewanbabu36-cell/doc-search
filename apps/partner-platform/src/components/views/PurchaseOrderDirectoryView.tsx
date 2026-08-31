import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto
} from '@docsearch/api-contracts';

export interface PurchaseOrderDirectoryViewProps {
  purchaseOrders: PurchaseOrderDto[];
  onOpenCreatePO: () => void;
  onSelectPO: (poId: string) => void;
}

export const PurchaseOrderDirectoryView: React.FC<PurchaseOrderDirectoryViewProps> = ({
  purchaseOrders,
  onOpenCreatePO,
  onSelectPO
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Purchase Orders (PO) Management
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Commercial procurement commitments, delivery schedules, transmission statuses, and receiving tracking.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreatePO}>
          + Issue Purchase Order
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PO by number or vendor..."
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'SENT_TO_VENDOR', label: 'Sent to Vendor' },
              { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
              { value: 'FULLY_RECEIVED', label: 'Fully Received' },
              { value: 'CLOSED', label: 'Closed' }
            ]}
          />
        </div>
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>PO #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Delivery Target</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Value</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {po.poNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{po.vendorName}</div>
                    {po.contractNumber && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CTR: {po.contractNumber}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ${po.totalNetAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge
                      variant={
                        po.status === 'FULLY_RECEIVED' || po.status === 'CLOSED'
                          ? 'success'
                          : po.status === 'SENT_TO_VENDOR'
                          ? 'primary'
                          : po.status === 'CANCELLED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {po.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Button variant="outline" size="sm" onClick={() => onSelectPO(po.id)}>
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
