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
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
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
      setError(err instanceof Error ? err.message : 'Failed to load compliance governance data');
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
      remediationRequired: false,
      verifierEmail: 'compliance.lead@docsearch.internal',
      actorEmail: 'compliance.lead@docsearch.internal',
      reason
    });
    setVerifications((prev) => [newVerif, ...prev]);
    setControls((prev) =>
      prev.map((c) =>
        c.id === controlId
          ? {
              ...c,
              controlStatus: status === 'VERIFIED' ? 'VERIFIED' : c.controlStatus,
              lastVerifiedAt: status === 'VERIFIED' ? new Date().toISOString() : c.lastVerifiedAt
            }
          : c
      )
    );
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
      actorEmail: 'compliance.lead@docsearch.internal',
      reason
    });
    setExceptions((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleMapEvidence = async (
    controlId: string,
    evidenceId: string,
    notes: string,
    reason: string
  ) => {
    const newMap = await complianceService.mapEvidenceToControl({
      controlId,
      evidenceId,
      mappingNotes: notes,
      actorEmail: 'compliance.lead@docsearch.internal',
      reason
    });
    setMappings((prev) => [newMap, ...prev]);
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
    const fw = frameworks.find((f) => f.id === selectedFrameworkId);
    if (fw) {
      return (
        <ComplianceFrameworkProfileView
          framework={fw}
          controls={controls.filter((c) => c.frameworkId === fw.id)}
          onBack={() => setSelectedFrameworkId(null)}
          onSelectControl={(ctrlId) => {
            const ctrl = controls.find((c) => c.id === ctrlId);
            if (ctrl) setVerifyingControl(ctrl);
          }}
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

  // Drilldown: Retention Policy Profile
  if (selectedPolicyId) {
    const pol = retentionPolicies.find((p) => p.id === selectedPolicyId);
    if (pol) {
      return (
        <RetentionPolicyProfileView
          policy={pol}
          rules={retentionRules.filter((r) => r.retentionPolicyId === pol.id)}
          onBack={() => setSelectedPolicyId(null)}
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
              Compliance & Data Governance
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Compliance evidence registry, HIPAA/SOC 2 control mapping, data retention lifecycle, partner BAAs, and governance risk register
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'frameworks',
            label: '🛡️ Frameworks',
            badge: <Badge variant="neutral">{frameworks.length}</Badge>
          },
          {
            id: 'controls',
            label: '📋 Controls',
            badge: <Badge variant="neutral">{controls.length}</Badge>
          },
          {
            id: 'evidence',
            label: '📁 Evidence Registry',
            badge: <Badge variant="neutral">{evidence.length}</Badge>
          },
          {
            id: 'mappings',
            label: '🔗 Control Mapping',
            badge: <Badge variant="neutral">{mappings.length}</Badge>
          },
          {
            id: 'data-gov',
            label: '🗂️ Data Classifications',
            badge: <Badge variant="neutral">{classifications.length}</Badge>
          },
          {
            id: 'retention',
            label: '⏳ Retention Policies',
            badge: <Badge variant="neutral">{retentionPolicies.length}</Badge>
          },
          {
            id: 'baa',
            label: '📄 BAA Compliance',
            badge: <Badge variant={baaRecords.filter((b) => b.status === 'EXPIRING').length > 0 ? 'warning' : 'neutral'}>{baaRecords.length}</Badge>
          },
          {
            id: 'exceptions',
            label: '⚠️ Governance Exceptions',
            badge: <Badge variant={exceptions.filter((e) => e.status === 'REQUESTED').length > 0 ? 'danger' : 'neutral'}>{exceptions.length}</Badge>
          },
          {
            id: 'verifications',
            label: '🔒 Verifications Log',
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
          onMapEvidence={handleMapEvidence}
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

      {/* Verify Control Modal */}
      {verifyingControl && (
        <VerifyControlDialog
          isOpen={Boolean(verifyingControl)}
          onClose={() => setVerifyingControl(null)}
          control={verifyingControl}
          onVerify={handleVerifyControl}
        />
      )}
    </div>
  );
};
