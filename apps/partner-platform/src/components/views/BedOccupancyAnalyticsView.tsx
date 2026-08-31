import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { InpatientOverviewMetricsDto } from '@docsearch/api-contracts';

export interface BedOccupancyAnalyticsViewProps {
  metrics: InpatientOverviewMetricsDto;
}

export const BedOccupancyAnalyticsView: React.FC<BedOccupancyAnalyticsViewProps> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Bed Occupancy & Turnover Analytics</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Detailed bed occupancy rate KPIs and operational turnarounds.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Hospital Occupancy</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>{metrics.occupancyRatePercentage}%</div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>ICU Occupancy</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{metrics.icuOccupancyRatePercentage}%</div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Average Length of Stay</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>{metrics.averageLengthOfStayDays} Days</div>
        </Card>
      </div>
    </div>
  );
};