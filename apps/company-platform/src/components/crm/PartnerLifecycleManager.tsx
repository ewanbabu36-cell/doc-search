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

// 2 New Advanced CRM Modules
import { AiWhatsAppEngagementBroadcasterView } from './AiWhatsAppEngagementBroadcasterView.js';
import { DoctorNmcCredentialingBotView } from './DoctorNmcCredentialingBotView.js';

import { Spinner, ErrorState, Tabs, Badge } from '@docsearch/ui-kit';

export type ActiveCrmTab =
  | 'DIRECTORY'
  | 'WHATSAPP'
  | 'NMC_BOT'
  | 'VERIFICATION'
  | 'CONTRACTS'
  | 'BILLING'
  | 'TELEMETRY'
  | 'OUTREACH'
  | 'PLANS'
  | 'ANALYTICS';

export const PartnerLifecycleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveCrmTab>('DIRECTORY');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfileDto | null>(null);
  const [history, setHistory] = useState<PartnerTransitionHistoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Tabs
        tabs={[
          { id: 'DIRECTORY', label: '📋 Directory & CRM' },
          { id: 'WHATSAPP', label: '💬 AI WhatsApp Broadcaster', badge: <Badge variant="success">98.2% Open</Badge> },
          { id: 'NMC_BOT', label: '🤖 Doctor Credentialing Bot', badge: <Badge variant="primary">NMC API</Badge> },
          { id: 'VERIFICATION', label: '🛡️ Document Verification (3)' },
          { id: 'CONTRACTS', label: '📑 Contracts & SLAs' },
          { id: 'BILLING', label: '💵 Invoicing & GST Ledger' },
          { id: 'TELEMETRY', label: '⚡ ABDM 2.0 Telemetry' },
          { id: 'OUTREACH', label: '📞 Communications & QBR' },
          { id: 'PLANS', label: '💳 Subscription Tiers' },
          { id: 'ANALYTICS', label: '📊 Pipeline Funnel' }
        ]}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id as ActiveCrmTab)}
      />

      {activeTab === 'DIRECTORY' && (
        <PartnerListView onSelectPartner={(id) => setSelectedPartnerId(id)} />
      )}

      {activeTab === 'WHATSAPP' && (
        <AiWhatsAppEngagementBroadcasterView />
      )}

      {activeTab === 'NMC_BOT' && (
        <DoctorNmcCredentialingBotView />
      )}

      {activeTab === 'VERIFICATION' && (
        <PartnerVerificationConsole />
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
    </div>
  );
};
