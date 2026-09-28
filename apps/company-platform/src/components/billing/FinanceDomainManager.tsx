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
import { PredictiveCashFlowRevenueSimulatorView } from './PredictiveCashFlowRevenueSimulatorView.js';

import { Badge, Spinner, ErrorState, Button, DocSearchSpatialCore3D } from '@docsearch/ui-kit';

export type ActiveTab =
  | 'overview'
  | 'revenue-simulator'
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

export type FinanceCategory =
  | 'EXECUTIVE_SIMULATOR'
  | 'CORE_BILLING'
  | 'CONTRACTS_SETTLEMENTS'
  | 'TAX_INFRASTRUCTURE';

interface FinanceCategoryConfig {
  id: FinanceCategory;
  label: string;
  icon: string;
  subtitle: string;
  defaultTab: ActiveTab;
  tabIds: ActiveTab[];
}

const FINANCE_CATEGORIES: FinanceCategoryConfig[] = [
  {
    id: 'EXECUTIVE_SIMULATOR',
    label: 'Forecasting & Intelligence',
    icon: '📈',
    subtitle: 'Overview, Monte Carlo & AI Leakage',
    defaultTab: 'overview',
    tabIds: ['overview', 'revenue-simulator', 'leakage-radar']
  },
  {
    id: 'CORE_BILLING',
    label: 'Core Ledger & Accounts',
    icon: '💳',
    subtitle: 'Invoices, Payments & Subscriptions',
    defaultTab: 'invoices',
    tabIds: ['invoices', 'payments', 'subscriptions', 'billing-accounts']
  },
  {
    id: 'CONTRACTS_SETTLEMENTS',
    label: 'Contracts & Settlements',
    icon: '🎛️',
    subtitle: 'Pricing Builder, Escrow & Claims',
    defaultTab: 'contract-builder',
    tabIds: ['contract-builder', 'split', 'tpa']
  },
  {
    id: 'TAX_INFRASTRUCTURE',
    label: 'Tax, Banking & Multi-Hub',
    icon: '🌐',
    subtitle: 'GST E-Invoice, FX & Gateway Router',
    defaultTab: 'gst',
    tabIds: ['gst', 'global-tax', 'multi-branch', 'gateway-router']
  }
];

function getCategoryForTab(tabId: ActiveTab): FinanceCategory {
  if (['overview', 'revenue-simulator', 'leakage-radar'].includes(tabId)) {
    return 'EXECUTIVE_SIMULATOR';
  }
  if (['invoices', 'payments', 'subscriptions', 'billing-accounts'].includes(tabId)) {
    return 'CORE_BILLING';
  }
  if (['contract-builder', 'split', 'tpa'].includes(tabId)) {
    return 'CONTRACTS_SETTLEMENTS';
  }
  return 'TAX_INFRASTRUCTURE';
}

export const FinanceDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_finance_tab') as ActiveTab | null;
      if (stored) return stored;
    }
    return 'overview';
  });
  const [activeCategory, setActiveCategory] = useState<FinanceCategory>(() => getCategoryForTab(activeTab));
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [billingAccounts, setBillingAccounts] = useState<BillingAccountDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [payments, setPayments] = useState<PaymentRecordDto[]>([]);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_finance_tab', tabId);
    }
  };

  const handleCategoryChange = (catId: FinanceCategory) => {
    setActiveCategory(catId);
    const cat = FINANCE_CATEGORIES.find((c) => c.id === catId);
    if (cat && !cat.tabIds.includes(activeTab)) {
      handleTabChange(cat.defaultTab);
    }
  };

  useEffect(() => {
    const matchedCategory = getCategoryForTab(activeTab);
    if (matchedCategory !== activeCategory) {
      setActiveCategory(matchedCategory);
    }
  }, [activeTab]);

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
      {/* 3D Spatial Feature Core: Subscription & Finance */}
      <DocSearchSpatialCore3D
        preset="finance"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'recurring-saas') {
            handleCategoryChange('CORE_BILLING');
            setActiveTab('subscriptions');
          } else if (id === 'gst-ledger') {
            handleCategoryChange('TAX_INFRASTRUCTURE');
            setActiveTab('gst');
          } else if (id === 'gateway-webhooks') {
            handleCategoryChange('TAX_INFRASTRUCTURE');
            setActiveTab('gateway-router');
          } else if (id === 'tds-reconciliation') {
            handleCategoryChange('TAX_INFRASTRUCTURE');
            setActiveTab('global-tax');
          } else if (id === 'dunning-recovery') {
            setIsDunningModalOpen(true);
          } else if (id === 'deferred-revenue') {
            handleCategoryChange('EXECUTIVE_SIMULATOR');
            setActiveTab('revenue-simulator');
          } else if (id === 'financial-audit') {
            handleCategoryChange('CORE_BILLING');
            setActiveTab('invoices');
          }
        }}
      />

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
          >
            ⚡ Smart Dunning Recovery
          </Button>
        </div>
      </div>

      {/* Smart Categorized Hub Navigation (2-Tier Architecture) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '14px',
          padding: '12px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Tier 1: 4 Primary Functional Clusters Grid */}
        <div
          role="tablist"
          aria-label="Finance Functional Domains"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '10px'
          }}
        >
          {FINANCE_CATEGORIES.map((cat) => {
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isCatActive}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isCatActive ? '1.5px solid #06B6D4' : '1px solid #1E293B',
                  backgroundColor: isCatActive ? 'rgba(6, 182, 212, 0.14)' : '#0F172A',
                  color: isCatActive ? '#38BDF8' : '#94A3B8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isCatActive ? '0 0 14px rgba(6, 182, 212, 0.22)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem' }}>{cat.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: isCatActive ? '#F8FAFC' : '#CBD5E1' }}>
                      {cat.label}
                    </span>
                  </div>
                  {isCatActive ? (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: '#06B6D4',
                        fontWeight: 900,
                        backgroundColor: 'rgba(6, 182, 212, 0.18)',
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(6, 182, 212, 0.35)'
                      }}
                    >
                      ● Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                      {cat.tabIds.length} Tools
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: isCatActive ? '#94A3B8' : '#64748B', marginLeft: '28px' }}>
                  {cat.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Features of Active Category (Single Clean Line) */}
        <div
          role="tablist"
          aria-label="Category Sub Tools"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            paddingTop: '2px'
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginRight: '2px'
            }}
          >
            ACTIVE TOOLS:
          </span>
          {(() => {
            let subTabs: { id: ActiveTab; label: string; badge?: React.ReactNode }[] = [];
            if (activeCategory === 'EXECUTIVE_SIMULATOR') {
              subTabs = [
                {
                  id: 'overview',
                  label: '📊 Commercial Overview'
                },
                {
                  id: 'revenue-simulator',
                  label: '📈 Predictive Cash Flow & Simulator',
                  badge: <Badge variant="success">Monte Carlo</Badge>
                },
                {
                  id: 'leakage-radar',
                  label: '⚡ AI Revenue Leakage Radar',
                  badge: <Badge variant="danger">5 Active</Badge>
                }
              ];
            } else if (activeCategory === 'CORE_BILLING') {
              subTabs = [
                {
                  id: 'invoices',
                  label: '📄 Invoices',
                  badge: <Badge variant="neutral">{invoices.length}</Badge>
                },
                {
                  id: 'payments',
                  label: '💸 Payment Records',
                  badge: <Badge variant="neutral">{payments.length}</Badge>
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
                }
              ];
            } else if (activeCategory === 'CONTRACTS_SETTLEMENTS') {
              subTabs = [
                {
                  id: 'contract-builder',
                  label: '🎛️ No-Code Contract & Pricing Builder',
                  badge: <Badge variant="primary">NEW</Badge>
                },
                {
                  id: 'split',
                  label: '🩺 Doctor Revenue Escrow',
                  badge: <Badge variant="neutral">80:20 Split</Badge>
                },
                {
                  id: 'tpa',
                  label: '🏥 TPA Insurance Claims',
                  badge: <Badge variant="primary">PMJAY</Badge>
                }
              ];
            } else {
              subTabs = [
                {
                  id: 'gst',
                  label: '🇮🇳 GST E-Invoicing',
                  badge: <Badge variant="success">NIC IRP</Badge>
                },
                {
                  id: 'global-tax',
                  label: '🌐 Global Multi-Region Tax & FX',
                  badge: <Badge variant="success">6 Zones</Badge>
                },
                {
                  id: 'multi-branch',
                  label: '🏢 Multi-Branch & Inter-Company',
                  badge: <Badge variant="primary">5 Hubs</Badge>
                },
                {
                  id: 'gateway-router',
                  label: '💳 Multi-Gateway Smart Router',
                  badge: <Badge variant="success">0% MDR</Badge>
                }
              ];
            }

            return subTabs.map((sub) => {
              const isSubActive = activeTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  role="tab"
                  aria-selected={isSubActive}
                  onClick={() => handleTabChange(sub.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: isSubActive ? '1.5px solid #06B6D4' : '1px solid #1E293B',
                    backgroundColor: isSubActive ? '#0284C7' : '#0F172A',
                    color: isSubActive ? '#FFFFFF' : '#94A3B8',
                    fontWeight: isSubActive ? 800 : 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSubActive ? '0 0 12px rgba(6, 182, 212, 0.35)' : 'none'
                  }}
                >
                  <span>{sub.label}</span>
                  {sub.badge}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <FinanceOverviewView
          subscriptions={subscriptions}
          billingAccounts={billingAccounts}
          invoices={invoices}
          payments={payments}
        />
      )}

      {activeTab === 'revenue-simulator' && (
        <PredictiveCashFlowRevenueSimulatorView />
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
