import React from 'react';
import type { PlanDto, PlanEntitlementDto } from '@docsearch/api-contracts';
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

export interface PlanProfileViewProps {
  plan: PlanDto;
  entitlements: PlanEntitlementDto[];
  onBack: () => void;
}

export const PlanProfileView: React.FC<PlanProfileViewProps> = ({
  plan,
  entitlements,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Plans Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {plan.name}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Plan Code: {plan.code} | Product: {plan.productName ?? plan.productId}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="neutral">Version: v{plan.version}</Badge>
          <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'neutral'}>
            Status: {plan.status}
          </Badge>
        </div>
      </div>

      {/* Plan Details & Overview */}
      <Card title="Plan Definition & Metadata" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '2px' }}>Description:</span>
            <p style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>{plan.description}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Effective Date:</span>
              <div style={{ fontWeight: '500' }}>{plan.effectiveDate ? new Date(plan.effectiveDate).toLocaleDateString() : 'Immediate'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Configured Entitlements:</span>
              <div style={{ fontWeight: '500' }}>{entitlements.length} Feature Grants</div>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Commercial Billing:</span>
              <div><Badge variant="neutral">Zero Billing Logic (Standard Baseline)</Badge></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Plan Entitlement Mapping */}
      <Card
        title="Mapped Plan Entitlements"
        subtitle="Capabilities, numerical limits, and functional quotas granted by this plan"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Code</TableHead>
                <TableHead>Feature Capability</TableHead>
                <TableHead>Entitlement Type</TableHead>
                <TableHead>Granted Value / Limit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entitlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No entitlements currently mapped to this plan.
                  </TableCell>
                </TableRow>
              ) : (
                entitlements.map((pe) => (
                  <TableRow key={pe.id}>
                    <TableCell>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                        {pe.featureCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{pe.featureName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          Category: {pe.featureCategory}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{pe.entitlementType}</Badge>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-primary)' }}>{pe.displayValue}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pe.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {pe.status}
                      </Badge>
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
