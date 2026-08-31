import React, { useState, useEffect } from 'react';
import type {
  SubscriptionDto,
  BillingAccountDto,
  InvoiceDto,
  PaymentRecordDto,
  SubscriptionStatus
} from '@docsearch/api-contracts';
import { subscriptionService } from '../../services/subscription-service.js';
import { FinanceOverviewView } from './FinanceOverviewView.js';
import { SubscriptionListView } from './SubscriptionListView.js';
import { SubscriptionProfileView } from './SubscriptionProfileView.js';
import { BillingAccountListView } from './BillingAccountListView.js';
import { InvoiceListView } from './InvoiceListView.js';
import { InvoiceProfileView } from './InvoiceProfileView.js';
import { PaymentRecordListView } from './PaymentRecordListView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab = 'overview' | 'subscriptions' | 'billing-accounts' | 'invoices' | 'payments';

export const FinanceDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<BillingAccountDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [payments, setPayments] = useState<PaymentRecordDto[]>([]);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subRes, baRes, invRes, payRes] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getBillingAccounts(),
        subscriptionService.getInvoices(),
        subscriptionService.getPayments()
      ]);
      setSubscriptions(subRes);
      setBillingAccounts(baRes);
      setInvoices(invRes);
      setPayments(payRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance domain data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTransitionSubscription = async (toStatus: SubscriptionStatus, reason: string) => {
    if (!selectedSubId) return;
    const updated = await subscriptionService.transitionSubscription(selectedSubId, {
      toStatus,
      reason
    });
    setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  if (isLoading && subscriptions.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Subscription & Commercial data...
        </span>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <ErrorState title="Finance Subsystem Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown to Subscription Profile
  if (selectedSubId) {
    const sub = subscriptions.find((s) => s.id === selectedSubId);
    if (sub) {
      const linkedAccount = billingAccounts.find((ba) => ba.partnerId === sub.partnerId);
      const subInvoices = invoices.filter((i) => i.subscriptionId === sub.id);
      return (
        <SubscriptionProfileView
          subscription={sub}
          billingAccount={linkedAccount}
          invoices={subInvoices}
          onBack={() => setSelectedSubId(null)}
          onTransitionStatus={handleTransitionSubscription}
          onSelectInvoice={(invId) => {
            setSelectedSubId(null);
            setSelectedInvId(invId);
          }}
        />
      );
    }
  }

  // Drilldown to Invoice Profile
  if (selectedInvId) {
    const inv = invoices.find((i) => i.id === selectedInvId);
    if (inv) {
      const invPayments = payments.filter((p) => p.invoiceId === inv.id);
      return (
        <InvoiceProfileView
          invoice={inv}
          payments={invPayments}
          onBack={() => setSelectedInvId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Subscription / Billing / Finance
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Commercial contract management, subscription states, billing account registry, and invoice records
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Commercial Overview'
          },
          {
            id: 'subscriptions',
            label: '💳 Subscriptions',
            badge: <Badge variant="neutral">{subscriptions.length}</Badge>
          },
          {
            id: 'billing-accounts',
            label: '🏢 Billing Accounts',
            badge: <Badge variant="neutral">{billingAccounts.length}</Badge>
          },
          {
            id: 'invoices',
            label: '📄 Invoices',
            badge: <Badge variant="neutral">{invoices.length}</Badge>
          },
          {
            id: 'payments',
            label: '💸 Payment Records',
            badge: <Badge variant="neutral">{payments.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <FinanceOverviewView
          subscriptions={subscriptions}
          billingAccounts={billingAccounts}
          invoices={invoices}
          payments={payments}
        />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionListView
          subscriptions={subscriptions}
          onSelectSubscription={(id) => setSelectedSubId(id)}
        />
      )}

      {activeTab === 'billing-accounts' && (
        <BillingAccountListView billingAccounts={billingAccounts} />
      )}

      {activeTab === 'invoices' && (
        <InvoiceListView
          invoices={invoices}
          onSelectInvoice={(id) => setSelectedInvId(id)}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentRecordListView payments={payments} />
      )}
    </div>
  );
};
