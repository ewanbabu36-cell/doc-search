import { TpaClaimPredictorStudio } from './views/TpaClaimPredictorStudio.js';
import React, { useState, useEffect, useCallback } from 'react';
import type {
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  InsurancePayerDto,
  InsurancePlanDto,
  InsurancePatientPolicyDto,
  InsuranceEligibilityCheckDto,
  InsuranceAuthorizationDto,
  InsuranceClaimDto,
  InsuranceClaimSubmissionDto,
  InsuranceClaimAdjudicationDto,
  InsuranceClaimDenialDto,
  InsuranceClaimAppealDto,
  InsuranceSettlementDto,
  InsuranceReconciliationDto,
  InsuranceAuditTraceDto,
  InsuranceOverviewMetricsDto,
  PatientInsuranceHistoryDto,
  InsuranceReportsDto,
  CreatePayerRequest,
  CreateInsurancePlanRequest,
  RegisterPatientPolicyRequest,
  VerifyInsuranceEligibilityRequest,
  CreateAuthorizationRequest,
  SubmitAuthorizationRequest,
  ApproveAuthorizationRequest,
  DenyAuthorizationRequest,
  CreateClaimRequest,
  ValidateClaimRequest,
  SubmitClaimRequest,
  AdjudicateClaimRequest,
  RecordClaimDenialRequest,
  CreateClaimAppealRequest,
  ResolveClaimAppealRequest,
  RecordSettlementRequest,
  ReconcileSettlementRequest,
  AmendClaimRequest,
  CancelClaimRequest
} from '@docsearch/api-contracts';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { insuranceClaimsManagementService } from '../services/insurance-claims-management-service.js';
import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';

// Operational Views
import { InsuranceOverviewView } from './views/InsuranceOverviewView.js';
import { PayerDirectoryView } from './views/PayerDirectoryView.js';
import { InsurancePlanCatalogView } from './views/InsurancePlanCatalogView.js';
import { PatientInsuranceView } from './views/PatientInsuranceView.js';
import { EligibilityWorkbenchView } from './views/EligibilityWorkbenchView.js';
import { AuthorizationWorkbenchView } from './views/AuthorizationWorkbenchView.js';
import { ClaimDirectoryView } from './views/ClaimDirectoryView.js';
import { ClaimDetailView } from './views/ClaimDetailView.js';
import { ClaimSubmissionWorkbenchView } from './views/ClaimSubmissionWorkbenchView.js';
import { ClaimAdjudicationView } from './views/ClaimAdjudicationView.js';
import { ClaimDenialManagementView } from './views/ClaimDenialManagementView.js';
import { AiInsuranceDenialPredictorView } from './views/AiInsuranceDenialPredictorView.js';
import { ClaimAppealsView } from './views/ClaimAppealsView.js';
import { SettlementManagementView } from './views/SettlementManagementView.js';
import { InsuranceReconciliationView } from './views/InsuranceReconciliationView.js';
import { InsuranceReportsView } from './views/InsuranceReportsView.js';
import { InsuranceAuditVaultView } from './views/InsuranceAuditVaultView.js';
import { PatientInsuranceHistoryView } from './views/PatientInsuranceHistoryView.js';
import { RevenueCycleInsuranceView } from './views/RevenueCycleInsuranceView.js';

// Dialogs
import { CreatePayerDialog } from './dialogs/CreatePayerDialog.js';
import { CreateInsurancePlanDialog } from './dialogs/CreateInsurancePlanDialog.js';
import { RegisterPatientPolicyDialog } from './dialogs/RegisterPatientPolicyDialog.js';
import { VerifyEligibilityDialog } from './dialogs/VerifyEligibilityDialog.js';
import { CreateAuthorizationDialog } from './dialogs/CreateAuthorizationDialog.js';
import { SubmitAuthorizationDialog } from './dialogs/SubmitAuthorizationDialog.js';
import { ApproveAuthorizationDialog } from './dialogs/ApproveAuthorizationDialog.js';
import { DenyAuthorizationDialog } from './dialogs/DenyAuthorizationDialog.js';
import { CreateClaimDialog } from './dialogs/CreateClaimDialog.js';
import { ValidateClaimDialog } from './dialogs/ValidateClaimDialog.js';
import { SubmitClaimDialog } from './dialogs/SubmitClaimDialog.js';
import { AdjudicateClaimDialog } from './dialogs/AdjudicateClaimDialog.js';
import { RecordClaimDenialDialog } from './dialogs/RecordClaimDenialDialog.js';
import { CreateClaimAppealDialog } from './dialogs/CreateClaimAppealDialog.js';
import { ResolveClaimAppealDialog } from './dialogs/ResolveClaimAppealDialog.js';
import { RecordSettlementDialog } from './dialogs/RecordSettlementDialog.js';
import { ReconcileSettlementDialog } from './dialogs/ReconcileSettlementDialog.js';
import { AmendClaimDialog } from './dialogs/AmendClaimDialog.js';
import { CancelClaimDialog } from './dialogs/CancelClaimDialog.js';

export interface InsuranceClaimsDomainManagerProps {
  tenantId: string;
  initialContext?: PanelContextDto;
}

export const InsuranceClaimsDomainManager: React.FC<InsuranceClaimsDomainManagerProps> = ({
  tenantId,
  initialContext
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Hierarchy Context
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [branches, setBranches] = useState<OperationalFacilityDto[]>([]);
  const [context, setContext] = useState<PanelContextDto>(
    initialContext || {
      userEmail: 'insurance.admin@docsearch.docsearch.health',
      userRole: 'INSURANCE_DIRECTOR',
      activeTenantId: tenantId,
      activeTenantName: 'Apex Healthcare System',
      activePartnerId: '22222222-2222-4222-8222-222222222201',
      activePartnerName: 'Doc Search Healthcare Network',
      activeOrganizationId: '44444444-4444-4444-8444-444444444401',
      activeOrganizationName: 'Apex Metropolitan Hospital',
      activeFacilityId: '88888888-1111-4888-8888-111111111101',
      activeFacilityName: 'Apex Central Hospital'
    }
  );

  // Core Data State
  const [metrics, setMetrics] = useState<InsuranceOverviewMetricsDto | null>(null);
  const [payers, setPayers] = useState<InsurancePayerDto[]>([]);
  const [plans, setPlans] = useState<InsurancePlanDto[]>([]);
  const [policies, setPolicies] = useState<InsurancePatientPolicyDto[]>([]);
  const [eligibilityChecks, setEligibilityChecks] = useState<InsuranceEligibilityCheckDto[]>([]);
  const [authorizations, setAuthorizations] = useState<InsuranceAuthorizationDto[]>([]);
  const [claims, setClaims] = useState<InsuranceClaimDto[]>([]);
  const [submissions, setSubmissions] = useState<InsuranceClaimSubmissionDto[]>([]);
  const [adjudications, setAdjudications] = useState<InsuranceClaimAdjudicationDto[]>([]);
  const [denials, setDenials] = useState<InsuranceClaimDenialDto[]>([]);
  const [appeals, setAppeals] = useState<InsuranceClaimAppealDto[]>([]);
  const [settlements, setSettlements] = useState<InsuranceSettlementDto[]>([]);
  const [reconciliations, setReconciliations] = useState<InsuranceReconciliationDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<InsuranceAuditTraceDto[]>([]);
  const [reports, setReports] = useState<InsuranceReportsDto | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientInsuranceHistoryDto | null>(null);

  // Selected Entities
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaimDto | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePatientPolicyDto | null>(null);
  const [selectedAuth, setSelectedAuth] = useState<InsuranceAuthorizationDto | null>(null);
  const [selectedDenial, setSelectedDenial] = useState<InsuranceClaimDenialDto | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<InsuranceClaimAppealDto | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<InsuranceSettlementDto | null>(null);

  // Dialog State
  const [isCreatePayerOpen, setIsCreatePayerOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isRegisterPolicyOpen, setIsRegisterPolicyOpen] = useState(false);
  const [isVerifyEligibilityOpen, setIsVerifyEligibilityOpen] = useState(false);
  const [isCreateAuthOpen, setIsCreateAuthOpen] = useState(false);
  const [isSubmitAuthOpen, setIsSubmitAuthOpen] = useState(false);
  const [isApproveAuthOpen, setIsApproveAuthOpen] = useState(false);
  const [isDenyAuthOpen, setIsDenyAuthOpen] = useState(false);
  const [isCreateClaimOpen, setIsCreateClaimOpen] = useState(false);
  const [isValidateClaimOpen, setIsValidateClaimOpen] = useState(false);
  const [isSubmitClaimOpen, setIsSubmitClaimOpen] = useState(false);
  const [isAdjudicateClaimOpen, setIsAdjudicateClaimOpen] = useState(false);
  const [isRecordDenialOpen, setIsRecordDenialOpen] = useState(false);
  const [isCreateAppealOpen, setIsCreateAppealOpen] = useState(false);
  const [isResolveAppealOpen, setIsResolveAppealOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isReconcileSettlementOpen, setIsReconcileSettlementOpen] = useState(false);
  const [isAmendClaimOpen, setIsAmendClaimOpen] = useState(false);
  const [isCancelClaimOpen, setIsCancelClaimOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    const [
      partnersData,
      orgsData,
      branchesData,
      metricsData,
      payersData,
      plansData,
      policiesData,
      eligData,
      authsData,
      claimsData,
      subsData,
      adjsData,
      denialsData,
      appealsData,
      settlesData,
      recsData,
      tracesData,
      reportsData,
      historyData
    ] = await Promise.all([
      partnerFoundationService.getPartners(tenantId),
      partnerFoundationService.getOrganizations(tenantId, context.activePartnerId),
      partnerFoundationService.getFacilities(tenantId, context.activeOrganizationId),
      insuranceClaimsManagementService.getOverviewMetrics(tenantId),
      insuranceClaimsManagementService.getPayers(tenantId),
      insuranceClaimsManagementService.getPlans(tenantId),
      insuranceClaimsManagementService.getPatientPolicies(tenantId),
      insuranceClaimsManagementService.getEligibilityChecks(tenantId),
      insuranceClaimsManagementService.getAuthorizations(tenantId),
      insuranceClaimsManagementService.getClaims(tenantId),
      insuranceClaimsManagementService.getSubmissions(tenantId),
      insuranceClaimsManagementService.getAdjudications(tenantId),
      insuranceClaimsManagementService.getDenials(tenantId),
      insuranceClaimsManagementService.getAppeals(tenantId),
      insuranceClaimsManagementService.getSettlements(tenantId),
      insuranceClaimsManagementService.getReconciliations(tenantId),
      insuranceClaimsManagementService.getAuditTraces(tenantId),
      insuranceClaimsManagementService.getReports(tenantId),
      insuranceClaimsManagementService.getPatientInsuranceHistory(tenantId, '55555555-5555-4555-8555-555555555501')
    ]);

    setPartners(partnersData);
    setOrganizations(orgsData);
    setBranches(branchesData);
    setMetrics(metricsData);
    setPayers(payersData);
    setPlans(plansData);
    setPolicies(policiesData);
    setEligibilityChecks(eligData);
    setAuthorizations(authsData);
    setClaims(claimsData);
    setSubmissions(subsData);
    setAdjudications(adjsData);
    setDenials(denialsData);
    setAppeals(appealsData);
    setSettlements(settlesData);
    setReconciliations(recsData);
    setAuditTraces(tracesData);
    setReports(reportsData);
    setPatientHistory(historyData);

    if (selectedClaimId) {
      const found = claimsData.find((c) => c.id === selectedClaimId);
      if (found) setSelectedClaim(found);
    }
  }, [tenantId, context.activePartnerId, context.activeOrganizationId, selectedClaimId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Nav Handlers
  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    const found = claims.find((c) => c.id === claimId);
    setSelectedClaim(found || null);
    setActiveTab('claim-detail');
  };

  // Mutation Handlers
  const handleCreatePayer = async (req: CreatePayerRequest) => {
    await insuranceClaimsManagementService.createPayer(req);
    await loadData();
  };

  const handleCreatePlan = async (req: CreateInsurancePlanRequest) => {
    await insuranceClaimsManagementService.createPlan(req);
    await loadData();
  };

  const handleRegisterPolicy = async (req: RegisterPatientPolicyRequest) => {
    await insuranceClaimsManagementService.registerPatientPolicy(req);
    await loadData();
  };

  const handleVerifyEligibility = async (req: VerifyInsuranceEligibilityRequest) => {
    await insuranceClaimsManagementService.verifyEligibility(req);
    await loadData();
  };

  const handleCreateAuth = async (req: CreateAuthorizationRequest) => {
    await insuranceClaimsManagementService.createAuthorization(req);
    await loadData();
  };

  const handleSubmitAuth = async (req: SubmitAuthorizationRequest) => {
    await insuranceClaimsManagementService.submitAuthorization(req);
    await loadData();
  };

  const handleApproveAuth = async (req: ApproveAuthorizationRequest) => {
    await insuranceClaimsManagementService.approveAuthorization(req);
    await loadData();
  };

  const handleDenyAuth = async (req: DenyAuthorizationRequest) => {
    await insuranceClaimsManagementService.denyAuthorization(req);
    await loadData();
  };

  const handleCreateClaim = async (req: CreateClaimRequest) => {
    const newClaim = await insuranceClaimsManagementService.createClaim(req);
    await loadData();
    handleSelectClaim(newClaim.id);
  };

  const handleValidateClaim = async (req: ValidateClaimRequest) => {
    return insuranceClaimsManagementService.validateClaim(req);
  };

  const handleSubmitClaim = async (req: SubmitClaimRequest) => {
    const sub = await insuranceClaimsManagementService.submitClaim(req);
    await loadData();
    return sub;
  };

  const handleAdjudicateClaim = async (req: AdjudicateClaimRequest) => {
    const adj = await insuranceClaimsManagementService.adjudicateClaim(req);
    await loadData();
    return adj;
  };

  const handleRecordDenial = async (req: RecordClaimDenialRequest) => {
    const den = await insuranceClaimsManagementService.recordDenial(req);
    await loadData();
    return den;
  };

  const handleCreateAppeal = async (req: CreateClaimAppealRequest) => {
    const apl = await insuranceClaimsManagementService.createAppeal(req);
    await loadData();
    return apl;
  };

  const handleResolveAppeal = async (req: ResolveClaimAppealRequest) => {
    const res = await insuranceClaimsManagementService.resolveAppeal(req);
    await loadData();
    return res;
  };

  const handleRecordSettlement = async (req: RecordSettlementRequest) => {
    const stl = await insuranceClaimsManagementService.recordSettlement(req);
    await loadData();
    return stl;
  };

  const handleReconcileSettlement = async (req: ReconcileSettlementRequest) => {
    const rec = await insuranceClaimsManagementService.reconcileSettlement(req);
    await loadData();
    return rec;
  };

  const handleAmendClaim = async (req: AmendClaimRequest) => {
    const am = await insuranceClaimsManagementService.amendClaim(req);
    await loadData();
    return am;
  };

  const handleCancelClaim = async (req: CancelClaimRequest) => {
    const cl = await insuranceClaimsManagementService.cancelClaim(req);
    await loadData();
    return cl;
  };

  const tabs = [
    { id: 'overview', label: '📊 Command Center' },
    { id: 'payers', label: '🏢 Payers & TPAs' },
    { id: 'plans', label: '📑 Benefit Plans' },
    { id: 'policies', label: '👤 Patient Policies' },
    { id: 'eligibility', label: '💳 270/271 Eligibility' },
    { id: 'authorizations', label: '🔬 Pre-Authorizations' },
    { id: 'claims', label: '📋 Claims Directory' },
    { id: 'tpa-ai-predictor', label: '🩻 TPA AI Claim Predictor' },
    { id: 'submissions', label: '🚀 EDI Submissions' },
    { id: 'adjudications', label: '⚖️ ERA Adjudications' },
    { id: 'denials', label: '⛔ Denial Registry' },
    { id: 'appeals', label: '🛡️ Appeals Pipeline' },
    { id: 'settlements', label: '🏦 Payer Settlements' },
    { id: 'reconciliations', label: '🎯 Reconciliations' },
    { id: 'analytics', label: '📈 Payer Analytics' },
    { id: 'history', label: '👤 Patient Ledger' },
    { id: 'rcm-bridge', label: '🔗 RCM Bridge' },
    { id: 'audit', label: '🔒 Audit Vault' }
  ];

  if (selectedClaim && activeTab === 'claim-detail') {
    tabs.splice(7, 0, { id: 'claim-detail', label: `Claim ${selectedClaim.claimNumber}` });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* Hierarchy Switcher */}
      <PanelContextSwitcher
        context={context}
        partners={partners}
        organizations={organizations}
        facilities={branches}
        onContextChange={(newCtx) => setContext((prev) => ({ ...prev, ...newCtx }))}
      />

      {/* Domain Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Views */}
      {activeTab === 'overview' && metrics && (
        <InsuranceOverviewView
          metrics={metrics}
          claims={claims}
          authorizations={authorizations}
          eligibilityChecks={eligibilityChecks}
          onOpenCreateClaim={() => setIsCreateClaimOpen(true)}
          onOpenCreatePayer={() => setIsCreatePayerOpen(true)}
          onOpenRegisterPolicy={() => setIsRegisterPolicyOpen(true)}
          onOpenCreateAuth={() => setIsCreateAuthOpen(true)}
          onSelectClaim={handleSelectClaim}
          onOpenTab={(tabKey) => setActiveTab(tabKey)}
        />
      )}

      {activeTab === 'payers' && (
        <PayerDirectoryView
          payers={payers}
          onOpenCreatePayer={() => setIsCreatePayerOpen(true)}
        />
      )}

      {activeTab === 'plans' && (
        <InsurancePlanCatalogView
          plans={plans}
          payers={payers}
          onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
        />
      )}

      {activeTab === 'policies' && (
        <PatientInsuranceView
          policies={policies}
          onOpenRegisterPolicy={() => setIsRegisterPolicyOpen(true)}
          onOpenVerifyEligibility={(pol) => {
            setSelectedPolicy(pol);
            setIsVerifyEligibilityOpen(true);
          }}
          onOpenCreateAuth={(pol) => {
            setSelectedPolicy(pol);
            setIsCreateAuthOpen(true);
          }}
          onOpenCreateClaim={(pol) => {
            setSelectedPolicy(pol);
            setIsCreateClaimOpen(true);
          }}
        />
      )}

      {activeTab === 'eligibility' && (
        <EligibilityWorkbenchView
          eligibilityChecks={eligibilityChecks}
          policies={policies}
          onOpenVerifyEligibility={(pol) => {
            setSelectedPolicy(pol);
            setIsVerifyEligibilityOpen(true);
          }}
        />
      )}

      {activeTab === 'authorizations' && (
        <AuthorizationWorkbenchView
          authorizations={authorizations}
          onOpenCreateAuth={() => setIsCreateAuthOpen(true)}
          onSubmitAuth={(a) => {
            setSelectedAuth(a);
            setIsSubmitAuthOpen(true);
          }}
          onApproveAuth={(a) => {
            setSelectedAuth(a);
            setIsApproveAuthOpen(true);
          }}
          onDenyAuth={(a) => {
            setSelectedAuth(a);
            setIsDenyAuthOpen(true);
          }}
        />
      )}

      {activeTab === 'tpa-ai-predictor' && (
        <TpaClaimPredictorStudio />
      )}

      {activeTab === 'claims' && (
        <ClaimDirectoryView
          claims={claims}
          onOpenCreateClaim={() => setIsCreateClaimOpen(true)}
          onSelectClaim={handleSelectClaim}
          onOpenSubmitClaim={(c) => {
            setSelectedClaim(c);
            setIsSubmitClaimOpen(true);
          }}
        />
      )}

      {activeTab === 'claim-detail' && selectedClaim && (
        <ClaimDetailView
          claim={selectedClaim}
          submissions={submissions}
          adjudications={adjudications}
          denials={denials}
          appeals={appeals}
          settlements={settlements}
          onBackToDirectory={() => setActiveTab('claims')}
          onOpenValidateClaim={() => setIsValidateClaimOpen(true)}
          onOpenSubmitClaim={() => setIsSubmitClaimOpen(true)}
          onOpenAdjudicateClaim={() => setIsAdjudicateClaimOpen(true)}
          onOpenRecordDenial={() => setIsRecordDenialOpen(true)}
          onOpenCreateAppeal={() => {
            const foundDenial = denials.find((d) => d.claimId === selectedClaim.id);
            if (foundDenial) setSelectedDenial(foundDenial);
            setIsCreateAppealOpen(true);
          }}
          onOpenRecordSettlement={() => setIsRecordSettlementOpen(true)}
          onOpenAmendClaim={() => setIsAmendClaimOpen(true)}
          onOpenCancelClaim={() => setIsCancelClaimOpen(true)}
        />
      )}

      {activeTab === 'submissions' && (
        <ClaimSubmissionWorkbenchView
          claims={claims}
          submissions={submissions}
          onOpenSubmitClaim={(c) => {
            setSelectedClaim(c);
            setIsSubmitClaimOpen(true);
          }}
          onOpenValidateClaim={(c) => {
            setSelectedClaim(c);
            setIsValidateClaimOpen(true);
          }}
        />
      )}

      {activeTab === 'adjudications' && (
        <ClaimAdjudicationView
          claims={claims}
          adjudications={adjudications}
          onOpenAdjudicateClaim={(c) => {
            setSelectedClaim(c);
            setIsAdjudicateClaimOpen(true);
          }}
          onSelectClaim={handleSelectClaim}
        />
      )}

      {activeTab === 'ai-predictor' && (
        <AiInsuranceDenialPredictorView />
      )}

      {activeTab === 'denials' && (
        <ClaimDenialManagementView
          denials={denials}
          onOpenCreateAppeal={(d) => {
            setSelectedDenial(d);
            setIsCreateAppealOpen(true);
          }}
        />
      )}

      {activeTab === 'appeals' && (
        <ClaimAppealsView
          appeals={appeals}
          onOpenResolveAppeal={(apl) => {
            setSelectedAppeal(apl);
            setIsResolveAppealOpen(true);
          }}
        />
      )}

      {activeTab === 'settlements' && (
        <SettlementManagementView
          settlements={settlements}
          onOpenRecordSettlement={() => setIsRecordSettlementOpen(true)}
          onOpenReconcileSettlement={(stl) => {
            setSelectedSettlement(stl);
            setIsReconcileSettlementOpen(true);
          }}
        />
      )}

      {activeTab === 'reconciliations' && (
        <InsuranceReconciliationView reconciliations={reconciliations} />
      )}

      {activeTab === 'analytics' && reports && (
        <InsuranceReportsView reports={reports} />
      )}

      {activeTab === 'history' && (
        <PatientInsuranceHistoryView
          history={patientHistory}
          onSelectClaim={handleSelectClaim}
        />
      )}

      {activeTab === 'rcm-bridge' && metrics && (
        <RevenueCycleInsuranceView
          metrics={metrics}
          claims={claims}
          settlements={settlements}
        />
      )}

      {activeTab === 'audit' && (
        <InsuranceAuditVaultView auditTraces={auditTraces} />
      )}

      {/* Audited Dialog Components */}
      <CreatePayerDialog
        isOpen={isCreatePayerOpen}
        onClose={() => setIsCreatePayerOpen(false)}
        onSubmit={handleCreatePayer}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <CreateInsurancePlanDialog
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onSubmit={handleCreatePlan}
        payers={payers}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
      />

      <RegisterPatientPolicyDialog
        isOpen={isRegisterPolicyOpen}
        onClose={() => setIsRegisterPolicyOpen(false)}
        onSubmit={handleRegisterPolicy}
        payers={payers}
        plans={plans}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <VerifyEligibilityDialog
        isOpen={isVerifyEligibilityOpen}
        onClose={() => setIsVerifyEligibilityOpen(false)}
        onSubmit={handleVerifyEligibility}
        policy={selectedPolicy}
        tenantId={tenantId}
      />

      <CreateAuthorizationDialog
        isOpen={isCreateAuthOpen}
        onClose={() => setIsCreateAuthOpen(false)}
        onSubmit={handleCreateAuth}
        policies={policies}
        defaultPolicy={selectedPolicy}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <SubmitAuthorizationDialog
        isOpen={isSubmitAuthOpen}
        onClose={() => setIsSubmitAuthOpen(false)}
        onSubmit={handleSubmitAuth}
        authorization={selectedAuth}
        tenantId={tenantId}
      />

      <ApproveAuthorizationDialog
        isOpen={isApproveAuthOpen}
        onClose={() => setIsApproveAuthOpen(false)}
        onSubmit={handleApproveAuth}
        authorization={selectedAuth}
        tenantId={tenantId}
      />

      <DenyAuthorizationDialog
        isOpen={isDenyAuthOpen}
        onClose={() => setIsDenyAuthOpen(false)}
        onSubmit={handleDenyAuth}
        authorization={selectedAuth}
        tenantId={tenantId}
      />

      <CreateClaimDialog
        isOpen={isCreateClaimOpen}
        onClose={() => setIsCreateClaimOpen(false)}
        onSubmit={handleCreateClaim}
        policies={policies}
        authorizations={authorizations}
        defaultPolicy={selectedPolicy}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <ValidateClaimDialog
        isOpen={isValidateClaimOpen}
        onClose={() => setIsValidateClaimOpen(false)}
        onSubmit={handleValidateClaim}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <SubmitClaimDialog
        isOpen={isSubmitClaimOpen}
        onClose={() => setIsSubmitClaimOpen(false)}
        onSubmit={handleSubmitClaim}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <AdjudicateClaimDialog
        isOpen={isAdjudicateClaimOpen}
        onClose={() => setIsAdjudicateClaimOpen(false)}
        onSubmit={handleAdjudicateClaim}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <RecordClaimDenialDialog
        isOpen={isRecordDenialOpen}
        onClose={() => setIsRecordDenialOpen(false)}
        onSubmit={handleRecordDenial}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <CreateClaimAppealDialog
        isOpen={isCreateAppealOpen}
        onClose={() => setIsCreateAppealOpen(false)}
        onSubmit={handleCreateAppeal}
        denial={selectedDenial}
        tenantId={tenantId}
      />

      <ResolveClaimAppealDialog
        isOpen={isResolveAppealOpen}
        onClose={() => setIsResolveAppealOpen(false)}
        onSubmit={handleResolveAppeal}
        appeal={selectedAppeal}
        tenantId={tenantId}
      />

      <RecordSettlementDialog
        isOpen={isRecordSettlementOpen}
        onClose={() => setIsRecordSettlementOpen(false)}
        onSubmit={handleRecordSettlement}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <ReconcileSettlementDialog
        isOpen={isReconcileSettlementOpen}
        onClose={() => setIsReconcileSettlementOpen(false)}
        onSubmit={handleReconcileSettlement}
        settlement={selectedSettlement}
        tenantId={tenantId}
      />

      <AmendClaimDialog
        isOpen={isAmendClaimOpen}
        onClose={() => setIsAmendClaimOpen(false)}
        onSubmit={handleAmendClaim}
        claim={selectedClaim}
        tenantId={tenantId}
      />

      <CancelClaimDialog
        isOpen={isCancelClaimOpen}
        onClose={() => setIsCancelClaimOpen(false)}
        onSubmit={handleCancelClaim}
        claim={selectedClaim}
        tenantId={tenantId}
      />
    </div>
  );
};
