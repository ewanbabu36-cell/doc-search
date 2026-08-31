import React, { useState, useEffect } from 'react';
import type {
  PatientDto,
  PatientDuplicateCandidateDto,
  PatientMergeEventDto,
  PatientRegistrationAuditTraceDto,
  PatientRegistrationOverviewDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreatePatientRequest,
  UpdatePatientRequest,
  AddPatientIdentifierRequest,
  AddEmergencyContactRequest,
  AddPatientConsentRequest,
  AddPatientInsuranceRequest,
  ReviewDuplicatePatientRequest,
  MergePatientRequest
} from '@docsearch/api-contracts';
import { patientRegistrationService } from '../services/patient-registration-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { PatientOverviewView } from './views/PatientOverviewView.js';
import { PatientDirectoryView } from './views/PatientDirectoryView.js';
import { PatientSearchView } from './views/PatientSearchView.js';
import { PatientProfileView } from './views/PatientProfileView.js';
import { PatientIdentifierCenterView } from './views/PatientIdentifierCenterView.js';
import { EmergencyContactCenterView } from './views/EmergencyContactCenterView.js';
import { ConsentCenterView } from './views/ConsentCenterView.js';
import { InsuranceCenterView } from './views/InsuranceCenterView.js';
import { DuplicateReviewCenterView } from './views/DuplicateReviewCenterView.js';
import { PatientMergeHistoryView } from './views/PatientMergeHistoryView.js';
import { PatientAuditVaultView } from './views/PatientAuditVaultView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActivePatientTab =
  | 'overview'
  | 'directory'
  | 'search'
  | 'profile'
  | 'identifiers'
  | 'emergency'
  | 'consents'
  | 'insurance'
  | 'duplicate-review'
  | 'merge-history'
  | 'audit';

export const PatientRegistrationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActivePatientTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<PatientRegistrationOverviewDto | null>(null);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [duplicateCandidates, setDuplicateCandidates] = useState<PatientDuplicateCandidateDto[]>([]);
  const [mergeEvents, setMergeEvents] = useState<PatientMergeEventDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<PatientRegistrationAuditTraceDto[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);

      const [overviewRes, patientsRes, candidatesRes, mergesRes, auditsRes] = await Promise.all([
        patientRegistrationService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        patientRegistrationService.searchPatients({
          tenantId: ctx.activeTenantId,
          partnerId: ctx.activePartnerId,
          organizationId: ctx.activeOrganizationId,
          branchId: ctx.activeFacilityId
        }),
        patientRegistrationService.getDuplicateCandidates(ctx.activeTenantId, ctx.activeOrganizationId),
        patientRegistrationService.getMergeHistory(ctx.activeTenantId, ctx.activeOrganizationId),
        patientRegistrationService.getAuditTraces({
          tenantId: ctx.activeTenantId,
          partnerId: ctx.activePartnerId,
          organizationId: ctx.activeOrganizationId,
          pageIndex: 0,
          pageSize: 50
        })
      ]);

      setOverview(overviewRes);
      setPatients(patientsRes);
      setDuplicateCandidates(candidatesRes);
      setMergeEvents(mergesRes);
      setAuditTraces(auditsRes);

      if (patientsRes[0] && !selectedPatientId) {
        setSelectedPatientId(patientsRes[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Patient Registration module');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    const updated = await partnerFoundationService.setPanelContext(newContext);
    setContext(updated);
    if (updated.activeTenantId) {
      void loadData();
    }
  };

  const handleCreatePatient = async (req: CreatePatientRequest) => {
    const p = await patientRegistrationService.createPatient(req);
    setPatients((prev) => [p, ...prev]);
    setSelectedPatientId(p.id);
    if (context) {
      const [refreshedOverview, refreshedCandidates] = await Promise.all([
        patientRegistrationService.getOverview(context.activeTenantId),
        patientRegistrationService.getDuplicateCandidates(context.activeTenantId)
      ]);
      setOverview(refreshedOverview);
      setDuplicateCandidates(refreshedCandidates);
    }
  };

  const handleUpdatePatient = async (req: UpdatePatientRequest) => {
    const updated = await patientRegistrationService.updatePatient(req);
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddIdentifier = async (req: AddPatientIdentifierRequest) => {
    await patientRegistrationService.addIdentifier(req);
    if (context) {
      const refreshed = await patientRegistrationService.searchPatients({
        tenantId: context.activeTenantId,
        pageIndex: 0,
        pageSize: 50
      });
      setPatients(refreshed);
    }
  };

  const handleAddEmergencyContact = async (req: AddEmergencyContactRequest) => {
    await patientRegistrationService.addEmergencyContact(req);
    if (context) {
      const refreshed = await patientRegistrationService.searchPatients({
        tenantId: context.activeTenantId,
        pageIndex: 0,
        pageSize: 50
      });
      setPatients(refreshed);
    }
  };

  const handleAddConsent = async (req: AddPatientConsentRequest) => {
    await patientRegistrationService.addConsent(req);
    if (context) {
      const refreshed = await patientRegistrationService.searchPatients({
        tenantId: context.activeTenantId,
        pageIndex: 0,
        pageSize: 50
      });
      setPatients(refreshed);
    }
  };

  const handleAddInsurance = async (req: AddPatientInsuranceRequest) => {
    await patientRegistrationService.addInsurance(req);
    if (context) {
      const refreshed = await patientRegistrationService.searchPatients({
        tenantId: context.activeTenantId,
        pageIndex: 0,
        pageSize: 50
      });
      setPatients(refreshed);
    }
  };

  const handleReviewCandidate = async (req: ReviewDuplicatePatientRequest) => {
    const updated = await patientRegistrationService.reviewDuplicateCandidate(req);
    setDuplicateCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleMergePatients = async (req: MergePatientRequest) => {
    const event = await patientRegistrationService.mergePatients(req);
    setMergeEvents((prev) => [event, ...prev]);
    if (context) {
      const [refreshedPatients, refreshedCandidates, refreshedOverview] = await Promise.all([
        patientRegistrationService.searchPatients({
          tenantId: context.activeTenantId,
          pageIndex: 0,
          pageSize: 50
        }),
        patientRegistrationService.getDuplicateCandidates(context.activeTenantId),
        patientRegistrationService.getOverview(context.activeTenantId)
      ]);
      setPatients(refreshedPatients);
      setDuplicateCandidates(refreshedCandidates);
      setOverview(refreshedOverview);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('profile');
  };

  if (isLoading && !context) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Patient Registration & Master Patient Index...
        </span>
      </div>
    );
  }

  if (error && !context) {
    return (
      <ErrorState title="Patient Registration Module Unavailable" message={error} onRetry={loadData} />
    );
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? patients[0] ?? null;
  const activeOrgId = context?.activeOrganizationId ?? organizations[0]?.id ?? '';
  const activeBranchId = context?.activeFacilityId ?? facilities[0]?.id ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Patient Registration & Master Patient Index (MPI)
          </h1>
          
          <Badge variant="warning">Development Preview (Sample Data)</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Canonical patient identities, deterministic MRN issuance, demographic registries, duplicate match adjudication, and consent directives
        </p>
      </div>

      {/* Panel Context Switcher */}
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: '📊 Overview' },
          { id: 'directory', label: '👥 Patient Index', badge: <Badge variant="neutral">{patients.length}</Badge> },
          { id: 'search', label: '🔍 Fast Search' },
          { id: 'profile', label: '📋 Patient Profile' },
          { id: 'identifiers', label: '🪪 Identifiers' },
          { id: 'emergency', label: '🚨 Emergency Contacts' },
          { id: 'consents', label: '📝 Consents' },
          { id: 'insurance', label: '🛡️ Insurance / TPA' },
          {
            id: 'duplicate-review',
            label: '⚠️ Duplicate Review',
            badge: duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length > 0 ? (
              <Badge variant="warning">{duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length}</Badge>
            ) : undefined
          },
          { id: 'merge-history', label: '🔀 Merge Ledger', badge: <Badge variant="neutral">{mergeEvents.length}</Badge> },
          { id: 'audit', label: '🔒 Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActivePatientTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <PatientOverviewView
          overview={overview}
          patients={patients}
          onSelectPatient={handleSelectPatient}
        />
      )}

      {activeTab === 'directory' && context && (
        <PatientDirectoryView
          patients={patients}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onSelectPatient={handleSelectPatient}
          onCreatePatient={handleCreatePatient}
          onUpdatePatient={handleUpdatePatient}
          onAddIdentifier={handleAddIdentifier}
          onAddEmergencyContact={handleAddEmergencyContact}
          onAddConsent={handleAddConsent}
          onAddInsurance={handleAddInsurance}
        />
      )}

      {activeTab === 'search' && context && (
        <PatientSearchView
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          onSearchPatients={(req) => patientRegistrationService.searchPatients(req)}
          onSelectPatient={handleSelectPatient}
        />
      )}

      {activeTab === 'profile' && (
        <PatientProfileView patient={selectedPatient} auditTraces={auditTraces} />
      )}

      {activeTab === 'identifiers' && (
        <PatientIdentifierCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'emergency' && (
        <EmergencyContactCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'consents' && (
        <ConsentCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'insurance' && (
        <InsuranceCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'duplicate-review' && context && (
        <DuplicateReviewCenterView
          candidates={duplicateCandidates}
          patients={patients}
          actorId={context.userRole}
          actorRole={context.userRole}
          onReviewCandidate={handleReviewCandidate}
          onMergePatients={handleMergePatients}
        />
      )}

      {activeTab === 'merge-history' && (
        <PatientMergeHistoryView mergeEvents={mergeEvents} />
      )}

      {activeTab === 'audit' && (
        <PatientAuditVaultView auditTraces={auditTraces} />
      )}
    </div>
  );
};
