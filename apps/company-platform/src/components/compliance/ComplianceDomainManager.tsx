import React, { useState, useEffect } from 'react';
import type {
  ComplianceOverviewDto,
  ComplianceFrameworkDto,
  ComplianceControlDto,
  ComplianceEvidenceDto,
  ComplianceControlMappingDto,
  DataClassificationDto,
  DataRetentionPolicyDto,
  DataRetentionRuleDto,
  BAARecordDto,
  GovernanceExceptionDto,
  ComplianceVerificationDto,
  VerificationStatus
} from '@docsearch/api-contracts';
import { complianceService } from '../../services/compliance-service.js';
import { ComplianceOverviewView } from './ComplianceOverviewView.js';
import { ComplianceFrameworkListView } from './ComplianceFrameworkListView.js';
import { ComplianceFrameworkProfileView } from './ComplianceFrameworkProfileView.js';
import { ComplianceControlListView } from './ComplianceControlListView.js';
import { ComplianceEvidenceListView } from './ComplianceEvidenceListView.js';
import { ComplianceEvidenceProfileView } from './ComplianceEvidenceProfileView.js';
import { ComplianceControlMappingView } from './ComplianceControlMappingView.js';
import { DataGovernanceView } from './DataGovernanceView.js';
import { RetentionPolicyListView } from './RetentionPolicyListView.js';
import { RetentionPolicyProfileView } from './RetentionPolicyProfileView.js';
import { BAAComplianceView } from './BAAComplianceView.js';
import { GovernanceExceptionView } from './GovernanceExceptionView.js';
import { ComplianceVerificationView } from './ComplianceVerificationView.js';
import { VerifyControlDialog } from './VerifyControlDialog.js';

// 6 New Compliance Advancements
import { DpdpConsentErasureView } from './DpdpConsentErasureView.js';
import { NabhNmcComplianceMatrixView } from './NabhNmcComplianceMatrixView.js';
import { SyntheticDataSanitizerModal } from './SyntheticDataSanitizerModal.js';
import { DataPortabilityPassportView } from './DataPortabilityPassportView.js';
import { RegulatoryRadarWhistleblowerModal } from './RegulatoryRadarWhistleblowerModal.js';
import { MultiRegionDataSovereigntyRouterView } from './MultiRegionDataSovereigntyRouterView.js';

import { Tabs, Badge, Spinner, ErrorState, Button } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'sovereignty-router'
  | 'dpdp'
  | 'nabh-nmc'
  | 'passports'
  | 'frameworks'
  | 'controls'
  | 'evidence'
  | 'mappings'
  | 'data-gov'
  | 'retention'
  | 'baa'
  | 'exceptions'
  | 'verifications';

export const ComplianceDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [overview, setOverview] = useState<ComplianceOverviewDto | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFrameworkDto[]>([]);
  const [controls, setControls] = useState<ComplianceControlDto[]>([]);
  const [evidence, setEvidence] = useState<ComplianceEvidenceDto[]>([]);
  const [mappings, setMappings] = useState<ComplianceControlMappingDto[]>([]);
  const [classifications, setClassifications] = useState<DataClassificationDto[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicyDto[]>([]);
  const [retentionRules, setRetentionRules] = useState<DataRetentionRuleDto[]>([]);
  const [baaRecords, setBAARecords] = useState<BAARecordDto[]>([]);
  const [exceptions, setExceptions] = useState<GovernanceExceptionDto[]>([]);
  const [verifications, setVerifications] = useState<ComplianceVerificationDto[]>([]);

  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [verifyingControl, setVerifyingControl] = useState<ComplianceControlDto | null>(null);

  // Modals state
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        frameworksRes,
        controlsRes,
        evidenceRes,
        mappingsRes,
        classificationsRes,
        retentionPoliciesRes,
        retentionRulesRes,
        baaRes,
        exceptionsRes,
        verificationsRes
      ] = await Promise.all([
        complianceService.getComplianceOverview(),
        complianceService.getFrameworks(),
        complianceService.getControls(),
        complianceService.getEvidence(),
        complianceService.getControlMappings(),
        complianceService.getDataClassifications(),
        complianceService.getRetentionPolicies(),
        complianceService.getRetentionRules(),
        complianceService.getBAARecords(),
        complianceService.getGovernanceExceptions(),
        complianceService.getComplianceVerifications()
      ]);
      setOverview(overviewRes);
      setFrameworks(frameworksRes);
      setControls(controlsRes);
      setEvidence(evidenceRes);
      setMappings(mappingsRes);
      setClassifications(classificationsRes);
      setRetentionPolicies(retentionPoliciesRes);
      setRetentionRules(retentionRulesRes);
      setBAARecords(baaRes);
      setExceptions(exceptionsRes);
      setVerifications(verificationsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleVerifyControl = async (
    controlId: string,
    verificationType: string,
    status: VerificationStatus,
    evidenceReference: string,
    findings: string,
    reason: string
  ) => {
    const newVerif = await complianceService.verifyControl({
      controlId,
      verificationType,
      status,
      evidenceReference,
      findings,
      reason,
      remediationRequired: status === 'FAILED' || status === 'REQUIRES_REVIEW',
      verifierEmail: 'compliance.officer@docsearch.internal',
      actorEmail: 'compliance.officer@docsearch.internal'
    });
    setVerifications((prev) => [newVerif, ...prev]);
    const freshControls = await complianceService.getControls();
    setControls(freshControls);
    setVerifyingControl(null);
  };

  const handleReviewException = async (
    exceptionId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CLOSED',
    closureNotes: string,
    reason: string
  ) => {
    const updated = await complianceService.reviewGovernanceException({
      exceptionId,
      decision,
      closureNotes,
      reason,
      actorEmail: 'compliance.officer@docsearch.internal'
    });
    setExceptions((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Compliance & Data Governance workspace...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Compliance Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown: Framework Profile
  if (selectedFrameworkId) {
    const framework = frameworks.find((f) => f.id === selectedFrameworkId);
    if (framework) {
      const frameworkControls = controls.filter((c) => c.frameworkId === selectedFrameworkId);
      return (
        <ComplianceFrameworkProfileView
          framework={framework}
          controls={frameworkControls}
          onBack={() => setSelectedFrameworkId(null)}
          onSelectControl={() => {}}
        />
      );
    }
  }

  // Drilldown: Evidence Profile
  if (selectedEvidenceId) {
    const ev = evidence.find((e) => e.id === selectedEvidenceId);
    if (ev) {
      return (
        <ComplianceEvidenceProfileView
          evidence={ev}
          onBack={() => setSelectedEvidenceId(null)}
        />
      );
    }
  }

  // Drilldown: Policy Profile
  if (selectedPolicyId) {
    const policy = retentionPolicies.find((p) => p.id === selectedPolicyId);
    if (policy) {
      const rules = retentionRules.filter((r) => r.retentionPolicyId === selectedPolicyId);
      return (
        <RetentionPolicyProfileView
          policy={policy}
          rules={rules}
          onBack={() => setSelectedPolicyId(null)}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              📜 Compliance, Regulatory (NMC / NABH) & Data Governance HQ
            </h1>
            <Badge variant="success">● DPDP Act 2023 & NABH 5th Ed. Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            DPDP Act 2023 patient consent manager, NABH/NMC clinical guidelines matrix, synthetic patient data sandbox, and ABDM portability passports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRadarModalOpen(true)}
            style={{
              borderColor: '#06B6D4',
              color: '#38BDF8',
              fontWeight: 800
            }}
          >
            ⚖️ MOHFW Regulatory Radar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSyntheticModalOpen(true)}
            style={{
              backgroundColor: '#A855F7',
              color: '#FFF',
              fontWeight: 900
            }}
          >
            🧬 Generate Synthetic Data
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'sovereignty-router',
            label: '🌐 Data Sovereignty Router',
            badge: <Badge variant="success">4 Sovereign Hubs</Badge>
          },
          {
            id: 'dpdp',
            label: '🇮🇳 DPDP Consent & Erasure',
            badge: <Badge variant="success">DPDP 2023</Badge>
          },
          {
            id: 'nabh-nmc',
            label: '🏥 NABH & NMC Standards',
            badge: <Badge variant="primary">99.8% Pass</Badge>
          },
          {
            id: 'passports',
            label: '📜 Data Passports',
            badge: <Badge variant="neutral">FHIR R4</Badge>
          },
          {
            id: 'frameworks',
            label: '🏛️ Frameworks',
            badge: <Badge variant="neutral">{frameworks.length}</Badge>
          },
          {
            id: 'controls',
            label: '📋 Controls',
            badge: <Badge variant="neutral">{controls.length}</Badge>
          },
          {
            id: 'evidence',
            label: '📁 Evidence',
            badge: <Badge variant="neutral">{evidence.length}</Badge>
          },
          {
            id: 'mappings',
            label: '🔗 Mappings',
            badge: <Badge variant="neutral">{mappings.length}</Badge>
          },
          {
            id: 'data-gov',
            label: '🗂️ Data Governance',
            badge: <Badge variant="neutral">{classifications.length}</Badge>
          },
          {
            id: 'retention',
            label: '⏳ Retention Policies',
            badge: <Badge variant="neutral">{retentionPolicies.length}</Badge>
          },
          {
            id: 'baa',
            label: '🤝 BAA Records',
            badge: <Badge variant="neutral">{baaRecords.length}</Badge>
          },
          {
            id: 'exceptions',
            label: '⚠️ Exceptions',
            badge: (
              <Badge variant={exceptions.filter((e) => e.status === 'REQUESTED' || e.status === 'UNDER_REVIEW').length > 0 ? 'warning' : 'neutral'}>
                {exceptions.length}
              </Badge>
            )
          },
          {
            id: 'verifications',
            label: '🔍 Verifications',
            badge: <Badge variant="neutral">{verifications.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <ComplianceOverviewView
          overview={overview}
          frameworks={frameworks}
        />
      )}

      {activeTab === 'sovereignty-router' && (
        <MultiRegionDataSovereigntyRouterView />
      )}

      {activeTab === 'dpdp' && (
        <DpdpConsentErasureView />
      )}

      {activeTab === 'nabh-nmc' && (
        <NabhNmcComplianceMatrixView />
      )}

      {activeTab === 'passports' && (
        <DataPortabilityPassportView />
      )}

      {activeTab === 'frameworks' && (
        <ComplianceFrameworkListView
          frameworks={frameworks}
          onSelectFramework={(id) => setSelectedFrameworkId(id)}
        />
      )}

      {activeTab === 'controls' && (
        <ComplianceControlListView
          controls={controls}
          onVerifyControl={(ctrl) => setVerifyingControl(ctrl)}
        />
      )}

      {activeTab === 'evidence' && (
        <ComplianceEvidenceListView
          evidence={evidence}
          onSelectEvidence={(id) => setSelectedEvidenceId(id)}
        />
      )}

      {activeTab === 'mappings' && (
        <ComplianceControlMappingView
          mappings={mappings}
          controls={controls}
          evidence={evidence}
          onMapEvidence={async () => {}}
        />
      )}

      {activeTab === 'data-gov' && (
        <DataGovernanceView classifications={classifications} />
      )}

      {activeTab === 'retention' && (
        <RetentionPolicyListView
          policies={retentionPolicies}
          onSelectPolicy={(id) => setSelectedPolicyId(id)}
        />
      )}

      {activeTab === 'baa' && (
        <BAAComplianceView baaRecords={baaRecords} />
      )}

      {activeTab === 'exceptions' && (
        <GovernanceExceptionView
          exceptions={exceptions}
          onReviewException={handleReviewException}
        />
      )}

      {activeTab === 'verifications' && (
        <ComplianceVerificationView verifications={verifications} />
      )}

      {/* Dialogs & Modals */}
      {verifyingControl && (
        <VerifyControlDialog
          isOpen={true}
          control={verifyingControl}
          onClose={() => setVerifyingControl(null)}
          onVerify={handleVerifyControl}
        />
      )}

      <SyntheticDataSanitizerModal
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
        onGenerateSuccess={(datasetName) => {
          setSuccessBanner(`✓ Generated 100% Zero-PHI dataset: "${datasetName}" for AI training sandbox!`);
          setTimeout(() => setSuccessBanner(null), 6000);
        }}
      />

      <RegulatoryRadarWhistleblowerModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
      />
    </div>
  );
};
