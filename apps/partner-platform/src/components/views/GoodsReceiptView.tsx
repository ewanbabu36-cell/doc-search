import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  GoodsReceiptDto
} from '@docsearch/api-contracts';

export interface GoodsReceiptViewProps {
  goodsReceipts: GoodsReceiptDto[];
  onOpenInspectGRN: (grn: GoodsReceiptDto) => void;
}

export const GoodsReceiptView: React.FC<GoodsReceiptViewProps> = ({
  goodsReceipts,
  onOpenInspectGRN
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = goodsReceipts.filter((g) =>
    g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Goods Receipt Notes (GRN) & Inward Receiving
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Dock receiving notes, lot batching, expiry schedules, temperature monitoring logs, and QC routing.
        </p>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search GRNs by GRN #, PO #, or vendor..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>GRN #</th>
                <th style={{ padding: '0.75rem 1rem' }}>PO Reference</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Received Date & Bay</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Lines</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {g.grnNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{g.poNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{g.vendorName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {new Date(g.receivedDate).toLocaleDateString()} • {g.receivingDepartment}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                    {g.totalReceivedItems}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={g.status === 'INSPECTED_PASSED' ? 'success' : g.status === 'QUARANTINED' ? 'danger' : 'warning'}>
                      {g.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {g.status === 'PENDING_INSPECTION' && (
                      <Button variant="primary" size="sm" onClick={() => onOpenInspectGRN(g)}>
                        Conduct QC
                      </Button>
                    )}
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
