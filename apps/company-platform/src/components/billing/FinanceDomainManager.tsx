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

// 4 New Financial & Billing Advancements
import { GstEInvoicingReconcilerView } from './GstEInvoicingReconcilerView.js';
import { TpaInsuranceClaimsSettlementView } from './TpaInsuranceClaimsSettlementView.js';
import { DoctorRevenueSplitEscrowView } from './DoctorRevenueSplitEscrowView.js';
import { SmartDunningRecurringRecoveryModal } from './SmartDunningRecurringRecoveryModal.js';
import { GlobalTaxMultiRegionLedgerView } from './GlobalTaxMultiRegionLedgerView.js';
import { DynamicContractPricingBuilderView } from './DynamicContractPricingBuilderView.js';
import { AiRevenueLeakageRadarView } from './AiRevenueLeakageRadarView.js';
import { MultiGatewaySmartRouterView } from './MultiGatewaySmartRouterView.js';
import { MultiBranchInterCompanyBillingView } from './MultiBranchInterCompanyBillingView.js';

import { Tabs, Badge, Spinner, ErrorState, Button } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'contract-builder'
  | 'leakage-radar'
  | 'gateway-router'
  | 'multi-branch'
  | 'global-tax'
  | 'gst'
  | 'tpa'
  | 'split'
  | 'subscriptions'
  | 'billing-accounts'
  | 'invoices'
  | 'payments';

export const FinanceDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<BillingAccountDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [payments, setPayments] = useState<PaymentRecordDto[]>([]);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);

  // Modals state
  const [isDunningModalOpen, setIsDunningModalOpen] = useState(false);

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
      const linkedPayments = payments.filter((p) => p.invoiceId === inv.id);
      return (
        <InvoiceProfileView
          invoice={inv}
          payments={linkedPayments}
          onBack={() => setSelectedInvId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              💳 Billing, Invoicing, Tax & Financial Ledger HQ
            </h1>
            <Badge variant="success">● 18% GST & Section 194J Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Automated GST E-Invoicing (IRN), Cashless TPA insurance claim settlement, doctor revenue split escrow, and smart dunning recovery
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDunningModalOpen(true)}
            style={{
              backgroundColor: '#06B6D4',
              color: '#070C16',
              fontWeight: 900
            }}
          >
            ⚡ Smart Dunning Recovery
          </Button>
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
            id: 'contract-builder',
            label: '🎛️ No-Code Contract & Pricing Builder',
            badge: <Badge variant="primary">NEW</Badge>
          },
          {
            id: 'leakage-radar',
            label: '⚡ AI Revenue Leakage Radar',
            badge: <Badge variant="danger">5 Active</Badge>
          },
          {
            id: 'gateway-router',
            label: '💳 Multi-Gateway Smart Router',
            badge: <Badge variant="success">0% MDR</Badge>
          },
          {
            id: 'multi-branch',
            label: '🏢 Multi-Branch & Inter-Company',
            badge: <Badge variant="primary">5 Hubs</Badge>
          },
          {
            id: 'global-tax',
            label: '🌐 Global Multi-Region Tax & FX',
            badge: <Badge variant="success">6 Zones</Badge>
          },
          {
            id: 'gst',
            label: '🇮🇳 GST E-Invoicing',
            badge: <Badge variant="success">NIC IRP</Badge>
          },
          {
            id: 'tpa',
            label: '🏥 TPA Insurance Claims',
            badge: <Badge variant="primary">PMJAY</Badge>
          },
          {
            id: 'split',
            label: '🩺 Doctor Revenue Escrow',
            badge: <Badge variant="neutral">80:20 Split</Badge>
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

      {activeTab === 'contract-builder' && (
        <DynamicContractPricingBuilderView />
      )}

      {activeTab === 'leakage-radar' && (
        <AiRevenueLeakageRadarView />
      )}

      {activeTab === 'gateway-router' && (
        <MultiGatewaySmartRouterView />
      )}

      {activeTab === 'multi-branch' && (
        <MultiBranchInterCompanyBillingView />
      )}

      {activeTab === 'global-tax' && (
        <GlobalTaxMultiRegionLedgerView />
      )}

      {activeTab === 'gst' && (
        <GstEInvoicingReconcilerView />
      )}

      {activeTab === 'tpa' && (
        <TpaInsuranceClaimsSettlementView />
      )}

      {activeTab === 'split' && (
        <DoctorRevenueSplitEscrowView />
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

      {/* Modals */}
      <SmartDunningRecurringRecoveryModal
        isOpen={isDunningModalOpen}
        onClose={() => setIsDunningModalOpen(false)}
      />
    </div>
  );
};
