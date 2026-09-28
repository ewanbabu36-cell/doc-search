import React, { useState, useEffect, useCallback } from 'react';
import type {
  AbhaAccountDto,
  AbdmCareContextDto,
  AbdmConsentArtefactDto,
  FhirBundleRecordDto,
  AbdmScanAndShareTokenDto,
  AbdmGatewayOverviewMetricsDto,
  AbdmAuditTraceDto,
  CreateAbhaNumberRequest,
  LinkCareContextRequest,
  CreateConsentRequest,
  GenerateFhirBundleRequest,
  ProcessScanAndShareRequest
} from '@docsearch/api-contracts';

import { abdmFhirService } from '../services/abdm-fhir-service.js';

// Views
import { AbdmOverviewView } from './views/AbdmOverviewView.js';
import { AbhaManagementView } from './views/AbhaManagementView.js';
import { CareContextLinkageView } from './views/CareContextLinkageView.js';
import { ConsentManagerView } from './views/ConsentManagerView.js';
import { FhirR4BundleViewer } from './views/FhirR4BundleViewer.js';
import { ScanAndShareCounterView } from './views/ScanAndShareCounterView.js';
import { HfrHprRegistryView } from './views/HfrHprRegistryView.js';
import { AbdmGatewayAuditVaultView } from './views/AbdmGatewayAuditVaultView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { CreateAbhaNumberDialog } from './dialogs/CreateAbhaNumberDialog.js';
import { LinkCareContextDialog } from './dialogs/LinkCareContextDialog.js';
import { CreateConsentRequestDialog } from './dialogs/CreateConsentRequestDialog.js';
import { GenerateFhirBundleDialog } from './dialogs/GenerateFhirBundleDialog.js';
import { ProcessScanAndShareDialog } from './dialogs/ProcessScanAndShareDialog.js';

type AbdmTab =
  | 'OVERVIEW'
  | 'ABHA_REGISTRY'
  | 'CARE_CONTEXTS'
  | 'CONSENT_MANAGER'
  | 'FHIR_BUNDLES'
  | 'SCAN_AND_SHARE'
  | 'HFR_HPR'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
}

export const AbdmFhirDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<AbdmTab>('OVERVIEW');

  // Data states
  const [metrics, setMetrics] = useState<AbdmGatewayOverviewMetricsDto | null>(null);
  const [accounts, setAccounts] = useState<AbhaAccountDto[]>([]);
  const [contexts, setContexts] = useState<AbdmCareContextDto[]>([]);
  const [consents, setConsents] = useState<AbdmConsentArtefactDto[]>([]);
  const [bundles, setBundles] = useState<FhirBundleRecordDto[]>([]);
  const [tokens, setTokens] = useState<AbdmScanAndShareTokenDto[]>([]);
  const [traces, setTraces] = useState<AbdmAuditTraceDto[]>([]);

  // Dialog toggles
  const [showCreateAbha, setShowCreateAbha] = useState(false);
  const [showLinkContext, setShowLinkContext] = useState(false);
  const [showCreateConsent, setShowCreateConsent] = useState(false);
  const [showGenerateFhir, setShowGenerateFhir] = useState(false);
  const [showScanAndShare, setShowScanAndShare] = useState(false);

  const loadData = useCallback(async () => {
    const [
      m,
      accs,
      ctxs,
      cs,
      bnds,
      tkns,
      tr
    ] = await Promise.all([
      abdmFhirService.getOverviewMetrics(tenantId),
      abdmFhirService.getAbhaAccounts(tenantId),
      abdmFhirService.getCareContexts(tenantId),
      abdmFhirService.getConsentArtefacts(tenantId),
      abdmFhirService.getFhirBundles(tenantId),
      abdmFhirService.getScanAndShareTokens(tenantId),
      abdmFhirService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setAccounts(accs);
    setContexts(ctxs);
    setConsents(cs);
    setBundles(bnds);
    setTokens(tkns);
    setTraces(tr);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-gray-500">Connecting to ABDM Gateway Bridge...</div>;
  }

  // Handlers
  const handleCreateAbha = async (data: CreateAbhaNumberRequest) => {
    await abdmFhirService.createAbhaNumber(tenantId, data);
    await loadData();
  };

  const handleLinkContext = async (data: LinkCareContextRequest) => {
    await abdmFhirService.linkCareContext(tenantId, data);
    await loadData();
  };

  const handleCreateConsent = async (data: CreateConsentRequest) => {
    await abdmFhirService.createConsentRequest(tenantId, data);
    await loadData();
  };

  const handleGenerateFhir = async (data: GenerateFhirBundleRequest) => {
    await abdmFhirService.generateFhirBundle(tenantId, data);
    await loadData();
  };

  const handleScanAndShare = async (data: ProcessScanAndShareRequest) => {
    await abdmFhirService.processScanAndShare(tenantId, data);
    await loadData();
  };

  return (
    <div className="space-y-4">
      {/* Domain Navigation Tabs */}
      <div
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '10px',
          padding: '6px 8px'
        }}
      >
        {[
          { id: 'OVERVIEW' as AbdmTab, label: '🏛️ Gateway Overview' },
          { id: 'ABHA_REGISTRY' as AbdmTab, label: '🪪 ABHA (M1)' },
          { id: 'CARE_CONTEXTS' as AbdmTab, label: '🔗 Care Contexts (M2)' },
          { id: 'CONSENT_MANAGER' as AbdmTab, label: '🛡️ Consents (HIU)' },
          { id: 'FHIR_BUNDLES' as AbdmTab, label: '📦 FHIR R4 (M3)' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--ds-color-text-muted)',
                backgroundColor: isActive ? 'var(--ds-color-primary, #0284C7)' : 'transparent',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-accent, #38BDF8)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover)';
                  e.currentTarget.style.color = 'var(--ds-color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                }
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary ABDM Modules Selector */}
        <TabOverflowMenu
          label="More ABDM Features"
          options={[
            { id: 'SCAN_AND_SHARE', label: '📲 Scan & Share Counter' },
            { id: 'HFR_HPR', label: '🏥 HFR / HPR Registries' },
            { id: 'AUDIT_VAULT', label: '🔐 Gateway Audit Vault' }
          ]}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as AbdmTab)}
          onReset={() => setActiveTab('OVERVIEW')}
          accentColor="#0284C7"
          activeBorderColor="#38BDF8"
        />
      </div>

      {/* Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <AbdmOverviewView
          metrics={metrics}
          onCreateAbha={() => setShowCreateAbha(true)}
          onLinkCareContext={() => setShowLinkContext(true)}
          onGenerateFhir={() => setShowGenerateFhir(true)}
          onScanAndShare={() => setShowScanAndShare(true)}
        />
      )}

      {activeTab === 'ABHA_REGISTRY' && (
        <AbhaManagementView
          accounts={accounts}
          onCreateAbha={() => setShowCreateAbha(true)}
        />
      )}

      {activeTab === 'CARE_CONTEXTS' && (
        <CareContextLinkageView
          contexts={contexts}
          onLinkContext={() => setShowLinkContext(true)}
        />
      )}

      {activeTab === 'CONSENT_MANAGER' && (
        <ConsentManagerView
          consents={consents}
          onCreateConsent={() => setShowCreateConsent(true)}
        />
      )}

      {activeTab === 'FHIR_BUNDLES' && (
        <FhirR4BundleViewer
          bundles={bundles}
          onGenerateBundle={() => setShowGenerateFhir(true)}
        />
      )}

      {activeTab === 'SCAN_AND_SHARE' && (
        <ScanAndShareCounterView
          tokens={tokens}
          onProcessScan={() => setShowScanAndShare(true)}
        />
      )}

      {activeTab === 'HFR_HPR' && <HfrHprRegistryView />}

      {activeTab === 'AUDIT_VAULT' && <AbdmGatewayAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      <CreateAbhaNumberDialog
        isOpen={showCreateAbha}
        onClose={() => setShowCreateAbha(false)}
        onSubmit={handleCreateAbha}
      />

      <LinkCareContextDialog
        isOpen={showLinkContext}
        onClose={() => setShowLinkContext(false)}
        onSubmit={handleLinkContext}
      />

      <CreateConsentRequestDialog
        isOpen={showCreateConsent}
        onClose={() => setShowCreateConsent(false)}
        onSubmit={handleCreateConsent}
      />

      <GenerateFhirBundleDialog
        isOpen={showGenerateFhir}
        onClose={() => setShowGenerateFhir(false)}
        onSubmit={handleGenerateFhir}
      />

      <ProcessScanAndShareDialog
        isOpen={showScanAndShare}
        onClose={() => setShowScanAndShare(false)}
        onSubmit={handleScanAndShare}
      />
    </div>
  );
};
