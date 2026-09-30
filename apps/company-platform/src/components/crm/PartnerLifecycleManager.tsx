import React, { useState, useEffect } from 'react';
import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerLifecycleStatus
} from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';
import { PartnerListView } from './PartnerListView.js';
import { PartnerProfileView } from './PartnerProfileView.js';
import { PartnerVerificationConsole } from './PartnerVerificationConsole.js';
import { PartnerContractsVaultView } from './PartnerContractsVaultView.js';
import { PartnerRevenueBillingLedgerView } from './PartnerRevenueBillingLedgerView.js';
import { PartnerAbdmTelemetryView } from './PartnerAbdmTelemetryView.js';
import { PartnerOutreachHubView } from './PartnerOutreachHubView.js';
import { CustomizableSubscriptionPlanManager } from './CustomizableSubscriptionPlanManager.js';
import { PartnerPipelineAnalyticsView } from './PartnerPipelineAnalyticsView.js';

// Advanced CRM & Lifecycle Modules
import { AiWhatsAppEngagementBroadcasterView } from './AiWhatsAppEngagementBroadcasterView.js';
import { DoctorNmcCredentialingBotView } from './DoctorNmcCredentialingBotView.js';
import { PartnerHealthChurnRadarView } from './PartnerHealthChurnRadarView.js';
import { PartnerEscrowRevenueSplitView } from './PartnerEscrowRevenueSplitView.js';
import { LeadToPartnerPipelineView } from './LeadToPartnerPipelineView.js';
import { PathologyPartnerOnboardingWizard } from './PathologyPartnerOnboardingWizard.js';
import { HqLicenseGovernanceView } from './HqLicenseGovernanceView.js';
import { CommercialPipelineCockpitView } from './CommercialPipelineCockpitView.js';

import { Spinner, ErrorState, Badge } from '@docsearch/ui-kit';

export type ActiveCrmTab =
  | 'ONBOARD_PATHOLOGY'
  | 'PIPELINE'
  | 'DIRECTORY'
  | 'LICENSES'
  | 'COMMERCIAL_PIPELINE'
  | 'WHATSAPP'
  | 'NMC_BOT'
  | 'HEALTH_RADAR'
  | 'ESCROW_PAYOUTS'
  | 'VERIFICATION'
  | 'CONTRACTS'
  | 'BILLING'
  | 'TELEMETRY'
  | 'OUTREACH'
  | 'PLANS'
  | 'ANALYTICS';

export type CrmCategory =
  | 'CORE_LIFECYCLE'
  | 'AI_AUTOMATION'
  | 'REVENUE_BILLING'
  | 'TELEMETRY_QBR';

export interface CategoryConfig {
  id: CrmCategory;
  label: string;
  icon: string;
  defaultTab: ActiveCrmTab;
  tabIds: ActiveCrmTab[];
}

const CRM_CATEGORIES: CategoryConfig[] = [
  {
    id: 'CORE_LIFECYCLE',
    label: 'Core Lifecycle',
    icon: '🏢',
    defaultTab: 'DIRECTORY',
    tabIds: ['DIRECTORY', 'LICENSES', 'VERIFICATION', 'PIPELINE', 'ONBOARD_PATHOLOGY']
  },
  {
    id: 'AI_AUTOMATION',
    label: 'AI Automation',
    icon: '🤖',
    defaultTab: 'WHATSAPP',
    tabIds: ['WHATSAPP', 'NMC_BOT', 'HEALTH_RADAR']
  },
  {
    id: 'REVENUE_BILLING',
    label: 'Revenue & Billing',
    icon: '💳',
    defaultTab: 'ESCROW_PAYOUTS',
    tabIds: ['ESCROW_PAYOUTS', 'BILLING', 'CONTRACTS', 'PLANS']
  },
  {
    id: 'TELEMETRY_QBR',
    label: 'Telemetry & QBR',
    icon: '📊',
    defaultTab: 'TELEMETRY',
    tabIds: ['TELEMETRY', 'OUTREACH', 'ANALYTICS']
  }
];

function getCategoryForTab(tabId: ActiveCrmTab): CrmCategory {
  if (['DIRECTORY', 'LICENSES', 'VERIFICATION', 'PIPELINE', 'ONBOARD_PATHOLOGY'].includes(tabId)) {
    return 'CORE_LIFECYCLE';
  }
  if (['WHATSAPP', 'NMC_BOT', 'HEALTH_RADAR'].includes(tabId)) {
    return 'AI_AUTOMATION';
  }
  if (['ESCROW_PAYOUTS', 'BILLING', 'CONTRACTS', 'PLANS'].includes(tabId)) {
    return 'REVENUE_BILLING';
  }
  return 'TELEMETRY_QBR';
}

export const PartnerLifecycleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveCrmTab>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_crm_tab') as ActiveCrmTab | null;
      if (stored) {
        localStorage.removeItem('docsearch_crm_tab');
        return stored;
      }
    }
    return 'DIRECTORY';
  });
  const [activeCategory, setActiveCategory] = useState<CrmCategory>(() => getCategoryForTab(activeTab));
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfileDto | null>(null);
  const [history, setHistory] = useState<PartnerTransitionHistoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);

  // Sync activeCategory whenever activeTab changes
  useEffect(() => {
    const matchedCategory = getCategoryForTab(activeTab);
    if (matchedCategory !== activeCategory) {
      setActiveCategory(matchedCategory);
    }
  }, [activeTab]);

  // Listen for external tab switch events (e.g. from CompanyShell header KYC button)
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail as ActiveCrmTab);
      }
    };
    const handleNavDirectory = () => {
      setActiveTab('DIRECTORY');
    };
    window.addEventListener('docsearch_switch_crm_tab', handleSwitchTab);
    window.addEventListener('docsearch:navigate_directory', handleNavDirectory);
    return () => {
      window.removeEventListener('docsearch_switch_crm_tab', handleSwitchTab);
      window.removeEventListener('docsearch:navigate_directory', handleNavDirectory);
    };
  }, []);

  // Poll central verification queue for live badge updates
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
        const res = await fetch('/api/v1/auth/verification-queue', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const pending = json.data.filter((x: any) => x.status === 'PENDING_APPROVAL' || x.status === 'PENDING' || x.status === 'UNDER_REVIEW').length;
            setPendingVerificationCount(pending);
          }
        }
      } catch {}
    };
    fetchPendingCount();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPendingCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPartnerDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [partnerData, historyData] = await Promise.all([
        partnerService.getPartnerById(id),
        partnerService.getPartnerHistory(id)
      ]);
      if (!partnerData) {
        throw new Error(`Healthcare partner with ID ${id} was not found.`);
      }
      setPartner(partnerData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartnerId) {
      void loadPartnerDetails(selectedPartnerId);
    } else {
      setPartner(null);
      setHistory([]);
    }
  }, [selectedPartnerId]);

  const handleTransitionStatus = async (toStatus: PartnerLifecycleStatus, reason: string) => {
    if (!selectedPartnerId) return;
    const updated = await partnerService.transitionLifecycle(selectedPartnerId, {
      toStatus,
      reason
    });
    setPartner(updated);
    // Reload history after transition
    const updatedHistory = await partnerService.getPartnerHistory(selectedPartnerId);
    setHistory(updatedHistory);
  };

  if (selectedPartnerId) {
    if (isLoading) {
      return (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Loading partner profile...
          </span>
        </div>
      );
    }

    if (error || !partner) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <ErrorState
            title="Partner Profile Error"
            message={error || 'Partner data unavailable'}
            onRetry={() => loadPartnerDetails(selectedPartnerId)}
          />
          <button
            type="button"
            onClick={() => setSelectedPartnerId(null)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#06B6D4',
              color: '#070C16',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Back to Partner Directory
          </button>
        </div>
      );
    }

    return (
      <PartnerProfileView
        partner={partner}
        history={history}
        onBack={() => setSelectedPartnerId(null)}
        onTransitionStatus={handleTransitionStatus}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Smart Categorized Hub Navigation (Solution 1: 4 Functional Domains) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '10px 12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Tier 1: 4 Primary Functional Clusters */}
        <div
          role="tablist"
          aria-label="CRM Functional Domains"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '8px',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '8px'
          }}
        >
          {CRM_CATEGORIES.map((cat) => {
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isCatActive}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (!cat.tabIds.includes(activeTab)) {
                    setActiveTab(cat.defaultTab);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isCatActive ? '1px solid #06B6D4' : '1px solid #1E293B',
                  backgroundColor: isCatActive ? 'rgba(6, 182, 212, 0.16)' : '#0F172A',
                  color: isCatActive ? '#38BDF8' : '#94A3B8',
                  fontWeight: isCatActive ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isCatActive ? '0 0 14px rgba(6, 182, 212, 0.22)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                  <span style={{ letterSpacing: '0.01em' }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cat.id === 'CORE_LIFECYCLE' && pendingVerificationCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '9999px',
                        padding: '1px 6px',
                        fontSize: '0.6875rem',
                        fontWeight: 800
                      }}
                    >
                      {pendingVerificationCount} Pending
                    </span>
                  )}
                  {isCatActive && (
                    <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 900 }}>
                      ● Active
                    </span>
                  )}
                </div>
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
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '2px' }}>
            TOOLS:
          </span>
          {(() => {
            const subTabs: { id: ActiveCrmTab; label: string; badge?: React.ReactNode }[] =
              activeCategory === 'CORE_LIFECYCLE'
                ? [
                    {
                      id: 'DIRECTORY',
                      label: '🏢 Partner Master Directory & KYC Matrix',
                      badge: <Badge variant="primary">Master DB</Badge>
                    },
                    {
                      id: 'LICENSES',
                      label: '🔐 License & Node-Lock HQ',
                      badge: <Badge variant="success">HMAC / Token</Badge>
                    },
                    {
                      id: 'VERIFICATION',
                      label: '🛡️ Document Verification Queue',
                      badge: (
                        <Badge variant={pendingVerificationCount > 0 ? 'warning' : 'success'}>
                          {pendingVerificationCount > 0 ? `${pendingVerificationCount} Pending` : 'All Verified'}
                        </Badge>
                      )
                    },
                    {
                      id: 'PIPELINE',
                      label: '🔄 Lead-to-Live Pipeline',
                      badge: <Badge variant="primary">5 Stages</Badge>
                    },
                    {
                      id: 'ONBOARD_PATHOLOGY',
                      label: '✨ Universal Partner Onboarding',
                      badge: <Badge variant="success">5 Categories</Badge>
                    }
                  ]
                : activeCategory === 'AI_AUTOMATION'
                ? [
                    {
                      id: 'WHATSAPP',
                      label: '💬 AI WhatsApp Broadcaster',
                      badge: <Badge variant="success">98.2% Open</Badge>
                    },
                    {
                      id: 'NMC_BOT',
                      label: '🤖 Doctor Credentialing Bot',
                      badge: <Badge variant="primary">NMC API</Badge>
                    },
                    {
                      id: 'HEALTH_RADAR',
                      label: '📈 AI Partner Health & Churn Radar',
                      badge: <Badge variant="warning">Early Warning</Badge>
                    }
                  ]
                : activeCategory === 'REVENUE_BILLING'
                ? [
                    {
                      id: 'COMMERCIAL_PIPELINE',
                      label: '💳 Renewal & Payment Pipeline',
                      badge: <Badge variant="primary">Paid / Unpaid</Badge>
                    },
                    {
                      id: 'ESCROW_PAYOUTS',
                      label: '💸 Escrow Revenue Split & UPI Payouts',
                      badge: <Badge variant="success">Instant UPI</Badge>
                    },
                    { id: 'BILLING', label: '💵 Invoicing & GST Ledger' },
                    { id: 'CONTRACTS', label: '📑 Contracts & SLAs' },
                    { id: 'PLANS', label: '💳 Subscription Tiers' }
                  ]
                : [
                    { id: 'TELEMETRY', label: '⚡ ABDM 2.0 Telemetry' },
                    { id: 'OUTREACH', label: '📞 Communications & QBR' },
                    { id: 'ANALYTICS', label: '📊 Pipeline Funnel' }
                  ];

            return subTabs.map((sub) => {
              const isSubActive = activeTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  role="tab"
                  aria-selected={isSubActive}
                  onClick={() => setActiveTab(sub.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: isSubActive ? 700 : 500,
                    color: isSubActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isSubActive ? '#0284C7' : '#1E293B',
                    borderRadius: '7px',
                    border: isSubActive ? '1px solid #38BDF8' : '1px solid #334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isSubActive ? '0 2px 10px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubActive) {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubActive) {
                      e.currentTarget.style.backgroundColor = '#1E293B';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <span>{sub.label}</span>
                  {sub.badge && <span>{sub.badge}</span>}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {activeTab === 'ONBOARD_PATHOLOGY' && (
        <PathologyPartnerOnboardingWizard
          onClose={() => setActiveTab('DIRECTORY')}
          onComplete={(res) => {
            if (res) {
              const partnerDto: PartnerProfileDto = {
                id: res.partnerId,
                tenantId: res.partnerId,
                tenantSlug: res.partnerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                legalName: res.partnerName,
                tradeName: res.partnerName,
                partnerType: (
                  res.classification === 'PHARMACY'
                    ? 'PHARMACY'
                    : res.classification === 'COMBO_CLINIC_PATHOLOGY' || res.classification === 'COMBO_CLINIC_PHARMACY'
                    ? 'CLINIC_GROUP'
                    : res.classification === 'PATHOLOGY' || res.classification === 'DIAGNOSTIC_CENTRE'
                    ? 'DIAGNOSTIC_LAB'
                    : res.classification === 'CLINIC'
                    ? 'CLINIC_GROUP'
                    : 'HOSPITAL_NETWORK'
                ) as any,
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                primaryContact: {
                  name: res.contactPerson,
                  email: res.credentials?.userId || 'admin@docsearch.health',
                  phone: res.phone,
                  roleTitle: res.credentials?.role || 'Administrator'
                },
                branchCount: 1,
                userCount: 5,
                metadata: {
                  classification: res.classification,
                  city: res.city,
                  planTier: res.subscriptionPlan?.tier,
                  monthlyFee: res.subscriptionPlan?.monthlyFee,
                  activeFeatures: res.subscriptionPlan?.activeFeatures,
                  temporaryPassword: res.credentials?.temporaryPassword,
                  loginUrl: res.credentials?.loginUrl,
                  activationVoucher: res.partnerId
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              partnerService.addPartner(partnerDto);
            }
            setActiveTab('DIRECTORY');
          }}
        />
      )}

      {activeTab === 'PIPELINE' && (
        <LeadToPartnerPipelineView />
      )}

      {activeTab === 'DIRECTORY' && (
        <PartnerListView
          onSelectPartner={(id) => setSelectedPartnerId(id)}
          onOpenKycConsole={(id) => {
            if (id && typeof window !== 'undefined') {
              localStorage.setItem('docsearch_selected_verif_id', id);
            }
            setActiveTab('VERIFICATION');
          }}
        />
      )}

      {activeTab === 'LICENSES' && (
        <HqLicenseGovernanceView />
      )}

      {activeTab === 'VERIFICATION' && (
        <PartnerVerificationConsole />
      )}

      {activeTab === 'WHATSAPP' && (
        <AiWhatsAppEngagementBroadcasterView />
      )}

      {activeTab === 'NMC_BOT' && (
        <DoctorNmcCredentialingBotView />
      )}

      {activeTab === 'HEALTH_RADAR' && (
        <PartnerHealthChurnRadarView />
      )}

      {activeTab === 'ESCROW_PAYOUTS' && (
        <PartnerEscrowRevenueSplitView />
      )}

      {activeTab === 'CONTRACTS' && (
        <PartnerContractsVaultView />
      )}

      {activeTab === 'BILLING' && (
        <PartnerRevenueBillingLedgerView />
      )}

      {activeTab === 'TELEMETRY' && (
        <PartnerAbdmTelemetryView />
      )}

      {activeTab === 'OUTREACH' && (
        <PartnerOutreachHubView />
      )}

      {activeTab === 'PLANS' && (
        <CustomizableSubscriptionPlanManager />
      )}

      {activeTab === 'ANALYTICS' && (
        <PartnerPipelineAnalyticsView />
      )}

      {activeTab === 'COMMERCIAL_PIPELINE' && (
        <CommercialPipelineCockpitView />
      )}
    </div>
  );
};
