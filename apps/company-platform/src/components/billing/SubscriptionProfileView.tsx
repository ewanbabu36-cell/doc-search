import React, { useState } from 'react';
import type {
  SubscriptionDto,
  BillingAccountDto,
  InvoiceDto,
  SubscriptionStatus
} from '@docsearch/api-contracts';
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
import { SubscriptionTransitionDialog } from './SubscriptionTransitionDialog.js';

export interface SubscriptionProfileViewProps {
  subscription: SubscriptionDto;
  billingAccount?: BillingAccountDto | undefined;
  invoices: InvoiceDto[];
  onBack: () => void;
  onTransitionStatus: (toStatus: SubscriptionStatus, reason: string) => Promise<void>;
  onSelectInvoice: (invoiceId: string) => void;
}

export const SubscriptionProfileView: React.FC<SubscriptionProfileViewProps> = ({
  subscription,
  billingAccount,
  invoices,
  onBack,
  onTransitionStatus,
  onSelectInvoice
}) => {
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Subscriptions Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {subscription.partnerTradeName}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Product: {subscription.productName} | Tier: {subscription.planName} (v{subscription.planVersion})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="neutral">{subscription.billingCycle} Cycle</Badge>
          <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
            {subscription.status}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsTransitionOpen(true)}>
            Change Status
          </Button>
        </div>
      </div>

      {/* Two Column Grid: Contract Terms & Billing Account */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Subscription Contract Terms */}
        <Card title="Contract & Schedule Terms" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Partner Organization:</span>
              <strong>{subscription.partnerTradeName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Tenant Domain:</span>
              <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{subscription.partnerTenantSlug}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Start Date:</span>
              <span>{new Date(subscription.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Renewal Horizon:</span>
              <span>{subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            {subscription.cancellationDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-danger)' }}>Cancelled Date:</span>
                <span style={{ color: 'var(--ds-color-danger)' }}>
                  {new Date(subscription.cancellationDate).toLocaleDateString()} ({subscription.cancellationReason})
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Billing Account Summary */}
        <Card title="Linked Partner Billing Account" padding="md">
          {billingAccount ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Billing Representative:</span>
                <strong>{billingAccount.billingContactName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Billing Email:</span>
                <a href={`mailto:${billingAccount.billingEmail}`} style={{ color: 'var(--ds-color-primary)', textDecoration: 'none' }}>
                  {billingAccount.billingEmail}
                </a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Tax Reference:</span>
                <span>{billingAccount.taxIdReference ?? 'Not Provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Invoice Currency:</span>
                <Badge variant="neutral">{billingAccount.currency}</Badge>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
              No billing account profile explicitly registered for this partner.
            </div>
          )}
        </Card>
      </div>

      {/* Associated Invoices */}
      <Card
        title="Associated Subscription Invoices"
        subtitle="Historical invoice records linked to this subscription contract"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No invoice records generated for this subscription.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'neutral'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectInvoice(inv.id)}>
                        View Invoice Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Transition Dialog */}
      {isTransitionOpen && (
        <SubscriptionTransitionDialog
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          subscription={subscription}
          onTransition={onTransitionStatus}
        />
      )}
    </div>
  );
};
