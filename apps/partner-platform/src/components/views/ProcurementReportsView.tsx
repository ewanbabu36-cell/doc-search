import React from 'react';
import {
  Card
} from '@docsearch/ui-kit';
import type {
  ProcurementAnalyticsDto
} from '@docsearch/api-contracts';

export interface ProcurementReportsViewProps {
  analytics: ProcurementAnalyticsDto;
}

export const ProcurementReportsView: React.FC<ProcurementReportsViewProps> = ({
  analytics
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Procurement Financial Reports & Spend Distribution
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Departmental allocation, category distribution, and quarterly budget utilization.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Spend by Supply Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics.spendByCategory.map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>{cat.category}</span>
                  <strong>${cat.amount.toLocaleString()} ({cat.percentage}%)</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: '#2563eb' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Spend by Clinical Department
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analytics.spendByDepartment.map((dept) => (
              <div key={dept.department}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>{dept.department}</span>
                  <strong>${dept.amount.toLocaleString()} ({dept.percentage}%)</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${dept.percentage}%`, height: '100%', backgroundColor: '#16a34a' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
