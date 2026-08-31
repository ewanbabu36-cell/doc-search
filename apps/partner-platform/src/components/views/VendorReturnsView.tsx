import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Badge
} from '@docsearch/ui-kit';
import type {
  VendorReturnDto
} from '@docsearch/api-contracts';

export interface VendorReturnsViewProps {
  vendorReturns: VendorReturnDto[];
  onOpenCreateReturn: () => void;
  onOpenApproveReturn: (ret: VendorReturnDto) => void;
}

export const VendorReturnsView: React.FC<VendorReturnsViewProps> = ({
  vendorReturns,
  onOpenCreateReturn,
  onOpenApproveReturn
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = vendorReturns.filter((r) =>
    r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Return-to-Vendor (RTV) & Defect Claims
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Quarantine consignments, defect returns, credit note tracking, and vendor replacements.
          </p>
        </div>
        <Button variant="danger" onClick={onOpenCreateReturn}>
          + Initiate Vendor Return
        </Button>
      </div>

      <Card style={{ padding: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search RTV records..."
        />
      </Card>

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>RTV #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Return Reason</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Claim Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ret) => (
                <tr key={ret.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#dc2626' }}>
                    {ret.returnNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{ret.vendorName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                    {ret.reason}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                    ${ret.totalReturnAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <Badge variant={ret.status === 'APPROVED' || ret.status === 'CLOSED' ? 'success' : 'warning'}>
                      {ret.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {ret.status === 'REQUESTED' && (
                      <Button variant="primary" size="sm" onClick={() => onOpenApproveReturn(ret)}>
                        Authorize Credit
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
