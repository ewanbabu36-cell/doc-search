import React, { useState, useEffect, useCallback } from 'react';
import type {
  EncounterDto,
  EncounterQueueDto,
  EncounterReferralDto,
  EncounterAuditTraceDto,
  EncounterOverviewDto,
  PatientDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateEncounterRequest,
  CheckInEncounterRequest,
  AssignDoctorRequest,
  ChangeEncounterStatusRequest,
  CancelEncounterRequest,
  ReferEncounterRequest,
  ReassignEncounterRequest
} from '@docsearch/api-contracts';
import { encounterService } from '../services/encounter-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { patientRegistrationService } from '../services/patient-registration-service.js';
import { doctorRosterService } from '../services/doctor-roster-service.js';
import { staffAdministrationService } from '../services/staff-administration-service.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { EncounterOverviewView } from './views/EncounterOverviewView.js';
import { EncounterDirectoryView } from './views/EncounterDirectoryView.js';
import { ReceptionCheckInView } from './views/ReceptionCheckInView.js';
import { OpdQueueView } from './views/OpdQueueView.js';
import { EncounterProfileView } from './views/EncounterProfileView.js';
import { DoctorWorklistView } from './views/DoctorWorklistView.js';
import { EncounterHistoryView } from './views/EncounterHistoryView.js';
import { ReferralCenterView } from './views/ReferralCenterView.js';
import { EncounterAuditVaultView } from './views/EncounterAuditVaultView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

export type ActiveEncounterTab =
  | 'overview'
  | 'directory'
  | 'reception'
  | 'queue'
  | 'profile'
  | 'doctor_worklist'
  | 'history'
  | 'referrals'
  | 'audit';

export const EncounterDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveEncounterTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<EncounterOverviewDto | null>(null);
  const [encounters, setEncounters] = useState<EncounterDto[]>([]);
  const [queues, setQueues] = useState<EncounterQueueDto[]>([]);
  const [referrals, setReferrals] = useState<EncounterReferralDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<EncounterAuditTraceDto[]>([]);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [departments, setDepartments] = useState<OperationalDepartmentDto[]>([]);

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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

      const [
        ov,
        encs,
        qs,
        refs,
        audits,
        pats,
        docs,
        depts
      ] = await Promise.all([
        encounterService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        encounterService.searchEncounters({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        encounterService.getQueue(ctx.activeTenantId, ctx.activeOrganizationId),
        encounterService.getReferrals(ctx.activeTenantId, ctx.activeOrganizationId),
        encounterService.getAuditTraces({ tenantId: ctx.activeTenantId }),
        patientRegistrationService.searchPatients({ tenantId: ctx.activeTenantId, organizationId: ctx.activeOrganizationId }),
        doctorRosterService.getDoctors(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
        staffAdministrationService.getDepartments(ctx.activeTenantId, ctx.activeOrganizationId)
      ]);

      setOverview(ov);
      setEncounters(encs);
      setQueues(qs);
      setReferrals(refs);
      setAuditTraces(audits);
      setPatients(pats);
      setDoctors(docs);
      setDepartments(depts);

      if (!selectedEncounterId && encs.length > 0 && encs[0]) {
        setSelectedEncounterId(encs[0].id);
      }
    } catch (err) {
      console.error('Failed to load encounter management domain data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load encounter data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEncounterId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    try {
      const updated = await partnerFoundationService.setPanelContext(newContext);
      setContext(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to update panel context:', err);
    }
  };

  const handleSelectEncounter = (id: string) => {
    setSelectedEncounterId(id);
    setActiveTab('profile');
  };

  const handleCreateEncounter = async (req: CreateEncounterRequest) => {
    const created = await encounterService.createEncounter(req);
    setSelectedEncounterId(created.id);
    await loadData();
  };

  const handleCheckInEncounter = async (req: CheckInEncounterRequest) => {
    await encounterService.checkInEncounter(req);
    await loadData();
  };

  const handleAssignDoctor = async (req: AssignDoctorRequest) => {
    await encounterService.assignDoctor(req);
    await loadData();
  };

  const handleChangeStatus = async (req: ChangeEncounterStatusRequest) => {
    await encounterService.changeEncounterStatus(req);
    await loadData();
  };

  const handleCancelEncounter = async (req: CancelEncounterRequest) => {
    await encounterService.cancelEncounter(req);
    await loadData();
  };

  const handleReferEncounter = async (req: ReferEncounterRequest) => {
    await encounterService.referEncounter(req);
    await loadData();
  };

  const handleReassignEncounter = async (req: ReassignEncounterRequest) => {
    await encounterService.reassignEncounter(req);
    await loadData();
  };

  const handleCallNextPatient = async (encounterId: string) => {
    if (!context) return;
    await encounterService.callNextPatient(
      context.activeTenantId,
      encounterId,
      context.userEmail,
      context.userRole,
      'Called patient into consultation room from OPD queue'
    );
    await loadData();
  };

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId) ?? encounters[0] ?? null;

  if (isLoading && !context) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !context) {
    return <ErrorState title="Failed to load Encounter Domain" message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinical Encounter & Visit Management
          </h1>
          
          <Badge variant="warning">Development Preview (Sample Data)</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          OPD queues, triage intake, sequential token issuance, attending physician assignments, and audited referral pathways
        </p>
      </div>

      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      <Tabs
        tabs={[
          { id: 'overview', label: '📊 Overview' },
          { id: 'directory', label: '📋 Encounters', badge: <Badge variant="neutral">{encounters.length}</Badge> },
          { id: 'reception', label: '🎟️ Reception & Check-In' },
          { id: 'queue', label: '⏳ OPD Queue', badge: <Badge variant="warning">{queues.filter((q) => q.queueStatus === 'WAITING').length}</Badge> },
          { id: 'profile', label: '🩺 Encounter Dossier' },
          { id: 'doctor_worklist', label: '👨‍⚕️ Doctor Worklist' },
          { id: 'history', label: '📜 Visit History' },
          { id: 'referrals', label: '🔄 Referral Center', badge: <Badge variant="neutral">{referrals.length}</Badge> },
          { id: 'audit', label: '🛡️ Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveEncounterTab)}
      />

      {activeTab === 'overview' && overview && (
        <EncounterOverviewView
          overview={overview}
          encounters={encounters}
          onSelectEncounter={handleSelectEncounter}
        />
      )}

      {activeTab === 'directory' && context && (
        <EncounterDirectoryView
          encounters={encounters}
          patients={patients}
          doctors={doctors}
          departments={departments}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={context.activeOrganizationId ?? '33333333-3333-4333-8333-333333333301'}
          branchId={context.activeFacilityId ?? '44444444-4444-4444-8444-444444444401'}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onSelectEncounter={handleSelectEncounter}
          onCreateEncounter={handleCreateEncounter}
          onCheckInEncounter={handleCheckInEncounter}
          onAssignDoctor={handleAssignDoctor}
          onChangeStatus={handleChangeStatus}
          onCancelEncounter={handleCancelEncounter}
          onReferEncounter={handleReferEncounter}
          onReassignEncounter={handleReassignEncounter}
        />
      )}

      {activeTab === 'reception' && context && (
        <ReceptionCheckInView
          patients={patients}
          doctors={doctors}
          departments={departments}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={context.activeOrganizationId ?? '33333333-3333-4333-8333-333333333301'}
          branchId={context.activeFacilityId ?? '44444444-4444-4444-8444-444444444401'}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onRegisterAndCheckIn={handleCreateEncounter}
          onNavigateToQueue={() => setActiveTab('queue')}
        />
      )}

      {activeTab === 'queue' && context && (
        <OpdQueueView
          queues={queues}
          encounters={encounters}
          departments={departments}
          doctors={doctors}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onCallNextPatient={handleCallNextPatient}
          onSelectEncounter={handleSelectEncounter}
        />
      )}

      {activeTab === 'profile' && (
        <EncounterProfileView
          encounter={selectedEncounter}
          auditTraces={auditTraces}
        />
      )}

      {activeTab === 'doctor_worklist' && context && (
        <DoctorWorklistView
          doctors={doctors}
          encounters={encounters}
          departments={departments}
          actorId={context.userEmail}
          actorRole={context.userRole}
          onCallPatient={handleCallNextPatient}
          onChangeStatus={handleChangeStatus}
          onReferEncounter={handleReferEncounter}
          onSelectEncounter={handleSelectEncounter}
        />
      )}

      {activeTab === 'history' && (
        <EncounterHistoryView
          encounters={encounters}
          onSelectEncounter={handleSelectEncounter}
        />
      )}

      {activeTab === 'referrals' && (
        <ReferralCenterView
          referrals={referrals}
          onSelectEncounter={handleSelectEncounter}
        />
      )}

      {activeTab === 'audit' && (
        <EncounterAuditVaultView
          auditTraces={auditTraces}
        />
      )}
    </div>
  );
};
