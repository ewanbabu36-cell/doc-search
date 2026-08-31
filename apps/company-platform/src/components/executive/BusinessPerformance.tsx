import React from 'react';
import type { BusinessPerformanceItem } from '../../types/executive.js';
import {
  Card,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge
} from '@docsearch/ui-kit';

export interface BusinessPerformanceProps {
  performance: BusinessPerformanceItem[];
}

export const BusinessPerformance: React.FC<BusinessPerformanceProps> = ({ performance }) => {
  return (
    <Card
      title="Partner & Tenant Operational Distribution"
      subtitle="Healthcare enterprise adoption breakdown (Production View / No Live Partners Connected)"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table isDense>
          <TableHeader>
            <TableRow>
              <TableHead>Healthcare Segment</TableHead>
              <TableHead>Active Partners</TableHead>
              <TableHead>Capacity Utilization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.map((item) => (
              <TableRow key={item.id}>
                <TableCell style={{ fontWeight: '500' }}>{item.tenantCategory}</TableCell>
                <TableCell style={{ color: 'var(--ds-color-text-muted)' }}>
                  {item.partnerCount > 0 ? `${item.partnerCount} networks` : '0 (Connected)'}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: '1 1 80px',
                        maxWidth: '120px',
                        height: '6px',
                        backgroundColor: 'var(--ds-color-surface-subtle)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${item.utilizationRate}%`,
                          height: '100%',
                          backgroundColor: 'var(--ds-color-primary)'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {item.utilizationRate > 0 ? `${item.utilizationRate}%` : 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">
                    {item.partnerCount > 0 ? item.growthStatus : 'Pending Partner Setup'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
