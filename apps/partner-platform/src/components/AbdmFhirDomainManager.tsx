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
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🇮🇳 ABDM Overview
        </button>
        <button
          onClick={() => setActiveTab('ABHA_REGISTRY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'ABHA_REGISTRY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🪪 ABHA Accounts (M1)
        </button>
        <button
          onClick={() => setActiveTab('CARE_CONTEXTS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CARE_CONTEXTS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔗 Care Contexts (HIP M2)
        </button>
        <button
          onClick={() => setActiveTab('CONSENT_MANAGER')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'CONSENT_MANAGER' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🛡️ Consent Manager (HIU)
        </button>
        <button
          onClick={() => setActiveTab('FHIR_BUNDLES')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'FHIR_BUNDLES' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📦 FHIR R4 Bundles (M3)
        </button>
        <button
          onClick={() => setActiveTab('SCAN_AND_SHARE')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'SCAN_AND_SHARE' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📲 Scan & Share Counter
        </button>
        <button
          onClick={() => setActiveTab('HFR_HPR')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'HFR_HPR' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🏥 HFR / HPR Registries
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 Gateway Audit Vault
        </button>
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
