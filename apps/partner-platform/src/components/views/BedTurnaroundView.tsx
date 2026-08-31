import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { InpatientBedTurnaroundDto } from '@docsearch/api-contracts';

export interface BedTurnaroundViewProps {
  turnarounds: InpatientBedTurnaroundDto[];
  onOpenCompleteCleaning: (trn: InpatientBedTurnaroundDto) => void;
}

export const BedTurnaroundView: React.FC<BedTurnaroundViewProps> = ({ turnarounds, onOpenCompleteCleaning }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Bed Turnaround & Housekeeping Pipeline</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Disinfection queue, environmental certification, and turnaround time tracking.</p>
      </div>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Ticket #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Bed Identifier</th>
              <th style={{ padding: '0.75rem 1rem' }}>Sanitization Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Assigned Housekeeper</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {turnarounds.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{t.turnaroundNumber}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t.bedCode}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.cleaningType}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{t.assignedHousekeeper || 'Unassigned'}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <Badge variant={t.status === 'AVAILABLE' ? 'success' : 'warning'}>{t.status}</Badge>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {t.status !== 'AVAILABLE' && (
                    <Button variant="primary" size="sm" onClick={() => onOpenCompleteCleaning(t)}>Certify Clean</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};