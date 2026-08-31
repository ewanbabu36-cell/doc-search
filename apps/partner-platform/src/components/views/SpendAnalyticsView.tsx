import React from 'react';
import {
  Card
} from '@docsearch/ui-kit';
import type {
  ProcurementAnalyticsDto
} from '@docsearch/api-contracts';

export interface SpendAnalyticsViewProps {
  analytics: ProcurementAnalyticsDto;
}

export const SpendAnalyticsView: React.FC<SpendAnalyticsViewProps> = ({
  analytics
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Procurement Spend Intelligence & Trends
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Monthly spending trajectories against established operating budgets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {analytics.monthlySpendTrend.map((m) => (
          <Card key={m.month} style={{ padding: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{m.month}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>
              ${m.spend.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: m.spend <= m.budget ? '#16a34a' : '#dc2626' }}>
              Budget: ${m.budget.toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
