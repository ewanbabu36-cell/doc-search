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
import { PatientProfileView } from './views/PatientProfileView.js';
import { PatientIdentifierCenterView } from './views/PatientIdentifierCenterView.js';
import { EmergencyContactCenterView } from './views/EmergencyContactCenterView.js';
import { ConsentCenterView } from './views/ConsentCenterView.js';
import { InsuranceCenterView } from './views/InsuranceCenterView.js';
import { DuplicateReviewCenterView } from './views/DuplicateReviewCenterView.js';
import { PatientMergeHistoryView } from './views/PatientMergeHistoryView.js';
import { PatientAuditVaultView } from './views/PatientAuditVaultView.js';
import { DpdpPrivacyConsentHubView } from './views/DpdpPrivacyConsentHubView.js';
import { FrontDeskMobileWorkstationView } from './views/FrontDeskMobileWorkstationView.js';
import { Tabs, Badge, Button, ErrorState, DocSearchSpatialCore3D, SkeletonPage } from '@docsearch/ui-kit';

export type ActivePatientTab =
  | 'counter-workstation'
  | 'overview'
  | 'directory'
  | 'search'
  | 'profile'
  | 'identifiers'
  | 'emergency'
  | 'consents'
  | 'privacy-dpdp'
  | 'insurance'
  | 'duplicate-review'
  | 'merge-history'
  | 'audit';

export interface PatientRegistrationDomainManagerProps {
  initialTab?: ActivePatientTab;
}

export const PatientRegistrationDomainManager: React.FC<PatientRegistrationDomainManagerProps> = ({
  initialTab = 'directory'
}) => {
  const [activeTab, setActiveTab] = useState<ActivePatientTab>(initialTab);
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
      try {
        const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('docsearch_partner_staff_auth') : null;
        if (storedAuth) {
          const u = JSON.parse(storedAuth);
          if (u?.email) {
            ctx.userEmail = u.email;
            ctx.userRole = u.role || 'HOSPITAL_DIRECTOR';
            if (u.tenantName) ctx.activeTenantName = u.tenantName;
          }
        }
      } catch {}
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

  const [isMobileDesk, setIsMobileDesk] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const storedAuth = localStorage.getItem('docsearch_partner_staff_auth');
      if (storedAuth) {
        const u = JSON.parse(storedAuth);
        const r = String(u.role || '').toUpperCase();
        if (r.includes('RECEPTIONIST') || r.includes('FRONT') || r.includes('TOKEN')) {
          return true;
        }
      }
    } catch {}
    return window.innerWidth < 800;
  });

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return (
      <ErrorState title="Patient Registration Module Unavailable" message={error} onRetry={loadData} />
    );
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? patients[0] ?? null;
  const activeOrgId = context?.activeOrganizationId ?? organizations[0]?.id ?? '';
  const activeBranchId = context?.activeFacilityId ?? facilities[0]?.id ?? '';

  if (isMobileDesk) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FrontDeskMobileWorkstationView
          tenantId={context?.activeTenantId || 'default'}
          partnerId={context?.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          staffName={context?.userRole || 'Front Desk Lead'}
          onSwitchToFullDesktop={() => setIsMobileDesk(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3D Spatial Feature Core: Patient 360 & Registry */}
      <DocSearchSpatialCore3D
        preset="patient-registration"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'abha-kyc' || id === 'consent-biometrics') {
            setActiveTab('privacy-dpdp');
          } else if (id === 'demographics') {
            setActiveTab('directory');
          } else if (id === 'emergency-contacts') {
            setActiveTab('emergency');
          } else if (id === 'triage-vitals') {
            setActiveTab('overview');
          } else if (id === 'insurance-tpa') {
            setActiveTab('insurance');
          } else if (id === 'token-queue') {
            setActiveTab('directory');
          }
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Patient Registration & Master Patient Index (MPI)
            </h1>
            <Badge variant="success">● LIVE PRODUCTION</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Canonical patient identities, deterministic MRN issuance, demographic registries, duplicate match adjudication, and consent directives
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsMobileDesk(true)}
          style={{ backgroundColor: '#0d9488', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>📱</span>
          <span>Switch to Front Desk Mobile Desk</span>
        </Button>
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
          { id: 'counter-workstation', label: '⚡ Fast Counter Workstation' },
          { id: 'directory', label: '👥 Patient Index & Search', badge: <Badge variant="neutral">{patients.length}</Badge> },
          { id: 'profile', label: '📋 Patient Profile' },
          { id: 'identifiers', label: '🪪 Identifiers' },
          { id: 'insurance', label: '🛡️ Insurance / TPA' },
          { id: 'emergency', label: '🚨 Emergency Contacts' },
          { id: 'consents', label: '📝 Consents' },
          { id: 'privacy-dpdp', label: '🛡️ DPDP Privacy & Consent Hub' },
          {
            id: 'duplicate-review',
            label: '⚠️ Duplicate Review',
            badge: duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length > 0 ? (
              <Badge variant="warning">{duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length}</Badge>
            ) : undefined
          },
          { id: 'overview', label: '📊 Overview' },
          { id: 'merge-history', label: '🔀 Merge Ledger', badge: <Badge variant="neutral">{mergeEvents.length}</Badge> },
          { id: 'audit', label: '🔒 Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActivePatientTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'counter-workstation' && context && (
        <FrontDeskMobileWorkstationView
          tenantId={context.activeTenantId || 'default'}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          staffName={context.userRole || 'Front Desk Lead'}
          onSwitchToFullDesktop={() => setActiveTab('directory')}
        />
      )}

      {activeTab === 'overview' && overview && (
        <PatientOverviewView
          overview={overview}
          patients={patients}
          onSelectPatient={handleSelectPatient}
        />
      )}

      {(activeTab === 'directory' || activeTab === 'search') && context && (
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
          onSearchPatients={(req) => patientRegistrationService.searchPatients(req)}
        />
      )}

      {activeTab === 'profile' && (
        <PatientProfileView
          patient={selectedPatient}
          auditTraces={auditTraces}
          onBack={() => setActiveTab('directory')}
        />
      )}

      {activeTab === 'identifiers' && (
        <PatientIdentifierCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'emergency' && (
        <EmergencyContactCenterView patients={patients} onSelectPatient={handleSelectPatient} />
      )}

      {activeTab === 'consents' && (
        <ConsentCenterView
          patients={patients}
          onSelectPatient={handleSelectPatient}
          onOpenDpdpHub={() => setActiveTab('privacy-dpdp')}
        />
      )}

      {activeTab === 'privacy-dpdp' && <DpdpPrivacyConsentHubView />}

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
