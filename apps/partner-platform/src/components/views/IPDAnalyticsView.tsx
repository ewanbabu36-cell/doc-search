import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientAnalyticsDto } from '@docsearch/api-contracts';

export interface IPDAnalyticsViewProps {
  analytics: InpatientAnalyticsDto;
}

export const IPDAnalyticsView: React.FC<IPDAnalyticsViewProps> = ({ analytics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Inpatient Hospital Analytics</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Admission volumes, length of stay distributions, and ward occupancy trends.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>Ward Occupancy Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analytics.wardOccupancy.map((w, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                <span>{w.wardName}</span>
                <strong>{w.occupiedBeds} / {w.totalBeds} ({w.rate}%)</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>Length of Stay Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analytics.lengthOfStayDistribution.map((l, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                <span>{l.bracket}</span>
                <strong>{l.patientCount} Patients</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};