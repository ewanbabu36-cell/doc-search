import React from 'react';
import {
  Card
} from '@docsearch/ui-kit';
import type {
  InsuranceReportsDto
} from '@docsearch/api-contracts';

export interface InsuranceReportsViewProps {
  reports: InsuranceReportsDto;
}

export const InsuranceReportsView: React.FC<InsuranceReportsViewProps> = ({
  reports
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Payer Analytics & Revenue Recovery Intelligence
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Payer scorecards, denial category distributions, and monthly claim settlement velocity.
        </p>
      </div>

      {/* Payer Performance Scorecards */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
          Payer Performance & Turnaround Scorecards
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Payer Entity</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Claims</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Billed Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Approved Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Denial Rate</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Avg Settlement Days</th>
              </tr>
            </thead>
            <tbody>
              {reports.payerPerformance.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                    {p.payerName}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{p.claimsCount}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    ${p.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                    ${p.approvedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: p.denialRate > 10 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    {p.denialRate}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>
                    {p.avgDaysToPay} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two-Column: Denial Breakdown & Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Root Cause Denial Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.denialCategoryBreakdown.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{cat.category.replace(/_/g, ' ')}</span>
                  <span>${cat.totalDeniedAmount.toFixed(2)} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.percentage}%`,
                      height: '100%',
                      backgroundColor: '#ef4444',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Monthly Claims & Settlement Trajectory
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            {reports.monthlyClaimTrends.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{t.month}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Submitted: ${t.submittedAmount.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#16a34a', fontWeight: 600 }}>
                    Settled: ${t.settledAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    Denied: ${t.deniedAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
