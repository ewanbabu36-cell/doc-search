import React from 'react';
import type { CrossTenantAggregatedMetricDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface TenantSegmentationViewProps {
  aggregates: CrossTenantAggregatedMetricDto[];
}

export const TenantSegmentationView: React.FC<TenantSegmentationViewProps> = ({
  aggregates
}) => {
  return (
    <Card
      title="Anonymized Cross-Tenant Segmentation"
      subtitle="Aggregated architectural benchmarks grouped by healthcare partner size cohorts"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anonymized Facility Scale Cohort</TableHead>
              <TableHead>Dimension</TableHead>
              <TableHead>Sample Count</TableHead>
              <TableHead>Platform Resource Share</TableHead>
              <TableHead>Sampling Date</TableHead>
              <TableHead>Data Boundary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aggregates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No segmentation snapshots aggregated.
                </TableCell>
              </TableRow>
            ) : (
              aggregates.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{a.anonymizedCohort}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{a.dimension}</TableCell>
                  <TableCell style={{ fontWeight: '500' }}>{a.sampleCount} Facilities</TableCell>
                  <TableCell>
                    <Badge variant="primary">
                      {a.aggregatedValue} ({a.unit})
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(a.recordedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Anonymized / PHI-Free</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
