import React from 'react';
import type {
  SubscriptionDto,
  BillingAccountDto,
  InvoiceDto,
  PaymentRecordDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface FinanceOverviewViewProps {
  subscriptions: SubscriptionDto[];
  billingAccounts: BillingAccountDto[];
  invoices: InvoiceDto[];
  payments: PaymentRecordDto[];
}

export const FinanceOverviewView: React.FC<FinanceOverviewViewProps> = ({
  subscriptions,
  billingAccounts,
  invoices,
  payments
}) => {
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const pausedSubs = subscriptions.filter((s) => s.status === 'PAUSED').length;
  const activeAccounts = billingAccounts.filter((b) => b.status === 'ACTIVE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Commercial & Billing Subsystem Baseline">
        <strong>Live billing engine not connected (Live Telemetry).</strong> Doc Search platform maintains commercial contract records, subscription lifecycle states, and invoice references without moving real money or calculating fabricated revenue.
      </Alert>

      {/* 4 Summary Cards (Counts & Neutral Indicators) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Subscriptions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeSubs}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="success">{activeSubs} Active</Badge>
            {pausedSubs > 0 && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>({pausedSubs} Paused)</span>}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Partner Billing Accounts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeAccounts}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Verified Profiles</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Recorded Invoices
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {invoices.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Draft & Issued Records</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Payment Record Registry
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {payments.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Audit Trail Only</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Upcoming Billing Events & Financial Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Subscription Renewal Horizon */}
        <Card title="Subscription Renewal Schedule" subtitle="Upcoming contract renewal dates for healthcare partners" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                    {sub.partnerTradeName}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {sub.planName} ({sub.billingCycle})
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                    Renewal:
                  </span>
                  <span style={{ fontWeight: '600' }}>
                    {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Commercial Pipeline Architecture */}
        <Card title="Commercial Subsystem Integrity" subtitle="Billing and financial pipeline governance" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Payment Gateway:</span>
              <Badge variant="neutral">Not Connected (Zero Money Movement)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>PCI-DSS Surface:</span>
              <Badge variant="success">Zero Cardholder Data Stored</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Invoice Generation:</span>
              <Badge variant="neutral">Contract Foundation v1.0</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Subscription State Machine:</span>
              <Badge variant="success">Enforced / Audited</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
