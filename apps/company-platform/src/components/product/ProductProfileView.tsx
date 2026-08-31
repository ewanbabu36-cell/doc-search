import React from 'react';
import type { ProductDto, PlanDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface ProductProfileViewProps {
  product: ProductDto;
  plans: PlanDto[];
  onBack: () => void;
  onSelectPlan: (planId: string) => void;
}

export const ProductProfileView: React.FC<ProductProfileViewProps> = ({
  product,
  plans,
  onBack,
  onSelectPlan
}) => {
  const associatedPlans = plans.filter((p) => p.productId === product.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Product Catalog
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {product.name}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Product Code: {product.code}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="neutral">Category: {product.category}</Badge>
          <Badge variant="neutral">v{product.version}</Badge>
          <Badge variant={product.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {product.status}
          </Badge>
        </div>
      </div>

      {/* Product Information Card */}
      <Card title="Product Architecture & Overview" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '2px' }}>Description:</span>
            <p style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>{product.description}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Associated Plans:</span>
              <div style={{ fontWeight: '500' }}>{associatedPlans.length} Active Tiers</div>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Created:</span>
              <div style={{ fontWeight: '500' }}>{new Date(product.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Last Revision:</span>
              <div style={{ fontWeight: '500' }}>{new Date(product.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Plans Belonging to this Product */}
      <Card
        title="Associated Product Plans & Entitlement Tiers"
        subtitle="Tier configurations and entitlement packages available under this product line"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Tier Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associatedPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No plans currently configured for this product.
                  </TableCell>
                </TableRow>
              ) : (
                associatedPlans.map((pl) => (
                  <TableRow key={pl.id}>
                    <TableCell style={{ fontWeight: '600' }}>{pl.name}</TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>{pl.code}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">v{pl.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pl.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {pl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectPlan(pl.id)}>
                        View Plan Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
