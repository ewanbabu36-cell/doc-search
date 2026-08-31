import React from 'react';
import {
  Card,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import type {
  RevenueAnalyticsDto
} from '@docsearch/api-contracts';

export interface RevenueAnalyticsViewProps {
  analytics: RevenueAnalyticsDto;
}

export const RevenueAnalyticsView: React.FC<RevenueAnalyticsViewProps> = ({
  analytics
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Revenue Cycle Analytics & Intelligence
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Executive financial insights, departmental contribution breakdown, and payment channel distribution
        </p>
      </div>

      {/* Two-Column Grid: Department & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Department Revenue Card */}
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Revenue Contribution by Department
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinical Department</TableHead>
                  <TableHead>Gross Revenue</TableHead>
                  <TableHead>Share (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.revenueByDepartment.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell style={{ fontWeight: 500 }}>{dept.department}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${dept.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${dept.percentage}%`, backgroundColor: '#2563eb', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '45px' }}>{dept.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Category Revenue Card */}
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Revenue by Service Classification
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Category</TableHead>
                  <TableHead>Gross Revenue</TableHead>
                  <TableHead>Share (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.revenueByCategory.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell style={{ fontWeight: 500 }}>{cat.category}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${cat.percentage}%`, backgroundColor: '#16a34a', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '45px' }}>{cat.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>

      {/* Payment Channel Breakdown */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Payment Channel Performance & Transaction Volume
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead>Transaction Count</TableHead>
                <TableHead>Total Collected</TableHead>
                <TableHead>Average Ticket Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.collectionsByMethod.map((m) => (
                <TableRow key={m.method}>
                  <TableCell style={{ fontWeight: 600 }}>{m.method}</TableCell>
                  <TableCell>{m.count} transactions</TableCell>
                  <TableCell style={{ fontWeight: 700, color: '#16a34a' }}>
                    ${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ${(m.amount / Math.max(1, m.count)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
