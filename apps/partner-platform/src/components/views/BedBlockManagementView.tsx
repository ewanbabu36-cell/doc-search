import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { InpatientBedBlockDto } from '@docsearch/api-contracts';

export interface BedBlockManagementViewProps {
  blocks: InpatientBedBlockDto[];
}

export const BedBlockManagementView: React.FC<BedBlockManagementViewProps> = ({ blocks }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Bed Maintenance & Quarantine Blocks</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Authorized bed closures for biomedical calibration and infection control.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Block #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Bed</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem' }}>Authorized By</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{b.blockNumber}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#dc2626' }}>{b.bedCode}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{b.blockReason}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{b.authorizedBy}</td>
                <td style={{ padding: '0.75rem 1rem' }}><Badge variant="danger">{b.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};