import React from 'react';
import type { BillingAccountDto } from '@docsearch/api-contracts';
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

export interface BillingAccountListViewProps {
  billingAccounts: BillingAccountDto[];
}

export const BillingAccountListView: React.FC<BillingAccountListViewProps> = ({
  billingAccounts
}) => {
  return (
    <Card
      title="Partner Billing Accounts"
      subtitle="Commercial invoice recipients, tax identifiers, and billing cycle configurations"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Organization</TableHead>
              <TableHead>Billing Contact</TableHead>
              <TableHead>Billing Email</TableHead>
              <TableHead>Tax Reference</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No billing accounts configured.
                </TableCell>
              </TableRow>
            ) : (
              billingAccounts.map((ba) => (
                <TableRow key={ba.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ba.partnerTradeName}</strong>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {ba.partnerTenantSlug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                    {ba.billingContactName}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <a href={`mailto:${ba.billingEmail}`} style={{ color: 'var(--ds-color-primary)', textDecoration: 'none' }}>
                      {ba.billingEmail}
                    </a>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                    {ba.taxIdReference ?? 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{ba.currency}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{ba.billingCycle}</TableCell>
                  <TableCell>
                    <Badge variant={ba.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {ba.status}
                    </Badge>
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
