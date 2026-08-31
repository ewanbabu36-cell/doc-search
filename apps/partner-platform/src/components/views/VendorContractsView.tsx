import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  ProcurementVendorContractDto
} from '@docsearch/api-contracts';

export interface VendorContractsViewProps {
  contracts: ProcurementVendorContractDto[];
  onOpenCreateContract: () => void;
}

export const VendorContractsView: React.FC<VendorContractsViewProps> = ({
  contracts,
  onOpenCreateContract
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = contracts.filter((c) =>
    c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Master Vendor Contracts & Price Agreements
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Contract lifecycle, price schedules, SLA guarantees, and annual renewal alerts.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenCreateContract}>
          + New Vendor Contract
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contracts by number, vendor, title..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Contract #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Title & Scope</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Effective Window</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Agreed Value</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {c.contractNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SLA: {c.slaDays} days delivery</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{c.vendorName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {new Date(c.effectiveDate).toLocaleDateString()} — {new Date(c.expiryDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ${c.totalAgreedValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'warning'}>{c.status}</Badge>
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
