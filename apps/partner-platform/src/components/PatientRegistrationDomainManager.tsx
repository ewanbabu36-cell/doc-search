import React, { useState, useEffect, useMemo } from 'react';
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
import { resolveIndustryPreset, type IndustryVertical } from '@docsearch/shared-core';
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
import { Tabs, Badge, Button, ErrorState, SkeletonPage } from '@docsearch/ui-kit';

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
  initialTab = 'counter-workstation'
}) => {
  const [activeTab, setActiveTab] = useState<ActivePatientTab>(initialTab);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
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

      const [partnersData, orgsData, facilitiesData] = await Promise.all([
        ctx.activeTenantId ? partnerFoundationService.getPartners(ctx.activeTenantId) : Promise.resolve([]),
        ctx.activeTenantId ? partnerFoundationService.getOrganizations(ctx.activeTenantId, ctx.activePartnerId) : Promise.resolve([]),
        ctx.activeTenantId ? partnerFoundationService.getFacilities(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId) : Promise.resolve([])
      ]);
      setPartners(partnersData);
      setOrganizations(orgsData);
      setFacilities(facilitiesData);

      if (ctx.activeTenantId) {
        const [overviewData, patientsData, candidatesData, mergeEventsData, auditData] =
          await Promise.all([
            patientRegistrationService.getOverview(ctx.activeTenantId),
            patientRegistrationService.searchPatients({
              tenantId: ctx.activeTenantId,
              pageIndex: 0,
              pageSize: 50
            }),
            patientRegistrationService.getDuplicateCandidates(ctx.activeTenantId),
            patientRegistrationService.getMergeHistory(ctx.activeTenantId, ctx.activeOrganizationId),
            patientRegistrationService.getAuditTraces({ tenantId: ctx.activeTenantId, pageIndex: 0, pageSize: 50 })
          ]);
        setOverview(overviewData);
        setPatients(patientsData);
        setDuplicateCandidates(candidatesData);
        setMergeEvents(mergeEventsData);
        setAuditTraces(auditData);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load registration domain data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Adaptive Industry Preset
  const activeVertical: IndustryVertical = useMemo(() => {
    const pType = String((context as any)?.partnerType || (context as any)?.activePartnerType || '').toUpperCase();
    if (pType.includes('SALON') || pType.includes('SPA')) return 'SALON_SPA';
    if (pType.includes('AUTO') || pType.includes('GARAGE')) return 'AUTO_SERVICE';
    if (pType.includes('LEGAL') || pType.includes('LAW')) return 'LEGAL_CONSULTING';
    if (pType.includes('FITNESS') || pType.includes('GYM')) return 'FITNESS_SPORTS';
    if (pType.includes('EDU') || pType.includes('COACH')) return 'EDUCATION_COACHING';
    return 'HEALTHCARE';
  }, [context]);

  const preset = useMemo(() => resolveIndustryPreset(activeVertical), [activeVertical]);

  const handleContextChange = async (updated: Partial<PanelContextDto>) => {
    const merged = context ? { ...context, ...updated } : (updated as PanelContextDto);
    setContext(merged);
    if (merged.activeTenantId) {
      setIsLoading(true);
      try {
        const [overviewData, patientsData, candidatesData] = await Promise.all([
          patientRegistrationService.getOverview(merged.activeTenantId),
          patientRegistrationService.searchPatients({
            tenantId: merged.activeTenantId,
            pageIndex: 0,
            pageSize: 50
          }),
          patientRegistrationService.getDuplicateCandidates(merged.activeTenantId)
        ]);
        setOverview(overviewData);
        setPatients(patientsData);
        setDuplicateCandidates(candidatesData);
      } catch (err: any) {
        setError(err?.message || 'Failed to refresh data for new context');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreatePatient = async (req: CreatePatientRequest) => {
    const created = await patientRegistrationService.createPatient(req);
    setPatients((prev) => [created, ...prev]);
    if (context) {
      const refreshedOverview = await patientRegistrationService.getOverview(context.activeTenantId);
      setOverview(refreshedOverview);
    }
    setSelectedPatientId(created.id);
    setActiveTab('profile');
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
      const [refreshedPatients, refreshedCandidates, refreshedOverview, refreshedHistory] = await Promise.all([
        patientRegistrationService.searchPatients({
          tenantId: context.activeTenantId,
          pageIndex: 0,
          pageSize: 50
        }),
        patientRegistrationService.getDuplicateCandidates(context.activeTenantId),
        patientRegistrationService.getOverview(context.activeTenantId),
        patientRegistrationService.getMergeHistory(context.activeTenantId, context.activeOrganizationId)
      ]);
      setPatients(refreshedPatients);
      setDuplicateCandidates(refreshedCandidates);
      setOverview(refreshedOverview);
      setMergeEvents(refreshedHistory);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('profile');
  };

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return (
      <ErrorState title="Registration Module Unavailable" message={error} onRetry={loadData} />
    );
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? patients[0] ?? null;
  const activeOrgId = context?.activeOrganizationId ?? organizations[0]?.id ?? '';
  const activeBranchId = context?.activeFacilityId ?? facilities[0]?.id ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="patient-registration-domain-manager">
      {/* Streamlined Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '1.25rem' }}>{preset.badgeIcon}</span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {preset.vocabulary.customer.singular} Registration & Intake Workstation
            </h1>
            <Badge variant="success">● LIVE</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Instant check-in, dynamic intake fields, token generation, and canonical {preset.vocabulary.customer.plural.toLowerCase()} directory
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            style={{ fontSize: '12px' }}
          >
            {showAdvancedSettings ? 'Hide Advanced ⚙️' : '⚙️ Advanced Controls'}
          </Button>
        </div>
      </div>

      {/* Context Switcher */}
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Advanced Governance Drawer / Accordion */}
      {showAdvancedSettings && (
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(71, 85, 105, 0.4)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginRight: '6px' }}>Advanced Views:</span>
          <button
            type="button"
            onClick={() => setActiveTab('privacy-dpdp')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: activeTab === 'privacy-dpdp' ? '#0284c7' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🛡️ DPDP Privacy & Consent Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('duplicate-review')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: activeTab === 'duplicate-review' ? '#0284c7' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ⚠️ Duplicate Review {duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length > 0 && `(${duplicateCandidates.filter((c) => c.reviewStatus === 'PENDING_REVIEW').length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insurance')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: activeTab === 'insurance' ? '#0284c7' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            💳 Insurance & Billing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('merge-history')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: activeTab === 'merge-history' ? '#0284c7' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔀 Merge Ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: activeTab === 'audit' ? '#0284c7' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔒 Audit Vault
          </button>
        </div>
      )}

      {/* Streamlined Primary Tabs */}
      <Tabs
        tabs={[
          { id: 'counter-workstation', label: '⚡ Fast Counter Workstation' },
          { id: 'directory', label: `👥 ${preset.vocabulary.customer.plural} Directory`, badge: <Badge variant="neutral">{patients.length}</Badge> },
          { id: 'profile', label: `📋 ${preset.vocabulary.customer.singular} Profile` },
          { id: 'overview', label: '📊 Metrics & Overview' }
        ]}
        activeTabId={['counter-workstation', 'directory', 'profile', 'overview'].includes(activeTab) ? activeTab : 'directory'}
        onTabChange={(tabId) => setActiveTab(tabId as ActivePatientTab)}
      />

      {/* Active Workstation View (Default) */}
      {activeTab === 'counter-workstation' && (
        <FrontDeskMobileWorkstationView
          tenantId={context?.activeTenantId || 'default'}
          partnerId={context?.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          staffName={context?.userRole || 'Front Desk Lead'}
          onSwitchToFullDesktop={() => setActiveTab('directory')}
        />
      )}

      {/* Overview Analytics View */}
      {activeTab === 'overview' && overview && (
        <PatientOverviewView
          overview={overview}
          patients={patients}
          onSelectPatient={handleSelectPatient}
        />
      )}

      {/* Directory & Search View */}
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

      {/* Detailed Profile View */}
      {activeTab === 'profile' && (
        <PatientProfileView
          patient={selectedPatient}
          auditTraces={auditTraces}
          onBack={() => setActiveTab('directory')}
        />
      )}

      {/* Advanced Views */}
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
