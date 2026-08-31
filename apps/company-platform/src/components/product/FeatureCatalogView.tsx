import React from 'react';
import type { FeatureDto } from '@docsearch/api-contracts';
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

export interface FeatureCatalogViewProps {
  features: FeatureDto[];
}

export const FeatureCatalogView: React.FC<FeatureCatalogViewProps> = ({ features }) => {
  return (
    <Card
      title="Platform Feature Registry"
      subtitle="Reusable granular capabilities, quotas, and data scope boundaries mapped to plans"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature Code</TableHead>
              <TableHead>Feature Name & Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feat) => (
              <TableRow key={feat.id}>
                <TableCell>
                  <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '600', fontSize: '0.8125rem' }}>
                    {feat.code}
                  </span>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{feat.name}</strong>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {feat.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{feat.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={feat.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {feat.status}
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
