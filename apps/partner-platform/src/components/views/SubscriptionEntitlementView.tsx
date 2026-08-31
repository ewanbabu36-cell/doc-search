import React from 'react';
import type { OperationalSubscriptionDto } from '@docsearch/api-contracts';
import { Card, Badge, Alert, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface SubscriptionEntitlementViewProps {
  subscriptions: OperationalSubscriptionDto[];
}

export const SubscriptionEntitlementView: React.FC<SubscriptionEntitlementViewProps> = ({
  subscriptions
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Entitlement Bridge">
        Operational subscriptions connect healthcare organizations to subscribed platform plans and govern module permissions (OPD, EMR, e-Rx, LIS, Pharmacy, Billing).
      </Alert>

      <Card
        title="Organization Subscription & Module Entitlements"
        subtitle="Active plans, enabled clinical modules, and contract coverage dates"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan Reference</TableHead>
                <TableHead>Enabled Operational Modules</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Entitlement Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {sub.organizationName ?? 'Organization'}
                    </strong>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                    <Badge variant="primary">{sub.planReference}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {sub.enabledModules.map((m) => (
                        <Badge key={m} variant="neutral">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {new Date(sub.effectiveDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Auto-Renew'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.entitlementStatus === 'ACTIVE' ? 'success' : 'danger'}>
                      {sub.entitlementStatus}
                    </Badge>
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
