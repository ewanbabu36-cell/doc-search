import React, { useState, useEffect } from 'react';
import type {
  DoctorProfileDto,
  DoctorSpecializationDto,
  DoctorScheduleDto,
  DoctorLeaveDto,
  OpdSlotDto,
  ConsultationFeeMatrixDto,
  DoctorOpdAuditTraceDto,
  DoctorRosterOverviewDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  OperationalDepartmentDto,
  OperationalStaffDto,
  CreateDoctorProfileRequest,
  UpdateDoctorProfileRequest,
  CreateDoctorScheduleRequest,
  AddDoctorLeaveRequest,
  ApproveDoctorLeaveRequest,
  BlockOpdSlotRequest,
  UnblockOpdSlotRequest,
  CreateConsultationFeeRequest,
  AssignDoctorLocationRequest
} from '@docsearch/api-contracts';
import { doctorRosterService } from '../services/doctor-roster-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { staffAdministrationService } from '../services/staff-administration-service.js';
import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { DoctorOverviewView } from './views/DoctorOverviewView.js';
import { DoctorDirectoryView } from './views/DoctorDirectoryView.js';
import { DoctorProfileView } from './views/DoctorProfileView.js';
import { OpdRosterView } from './views/OpdRosterView.js';
import { ScheduleManagerView } from './views/ScheduleManagerView.js';
import { LeaveCalendarView } from './views/LeaveCalendarView.js';
import { OpdSlotManagerView } from './views/OpdSlotManagerView.js';
import { ConsultationFeeMatrixView } from './views/ConsultationFeeMatrixView.js';
import { DoctorAuditVaultView } from './views/DoctorAuditVaultView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveDoctorTab =
  | 'overview'
  | 'directory'
  | 'profile'
  | 'roster'
  | 'schedules'
  | 'leaves'
  | 'slots'
  | 'fees'
  | 'audit';

export const DoctorRosterDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveDoctorTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);
  const [departments, setDepartments] = useState<OperationalDepartmentDto[]>([]);
  const [staffList, setStaffList] = useState<OperationalStaffDto[]>([]);

  const [overview, setOverview] = useState<DoctorRosterOverviewDto | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfileDto[]>([]);
  const [specializations, setSpecializations] = useState<DoctorSpecializationDto[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeaveDto[]>([]);
  const [slots, setSlots] = useState<OpdSlotDto[]>([]);
  const [fees, setFees] = useState<ConsultationFeeMatrixDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<DoctorOpdAuditTraceDto[]>([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes, deptsRes, staffRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId),
        staffAdministrationService.getDepartments(ctx.activeTenantId),
        staffAdministrationService.getStaff(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);
      setDepartments(deptsRes);
      setStaffList(staffRes);

      const [overviewRes, docsRes, specsRes, schedsRes, leavesRes, slotsRes, feesRes, auditsRes] =
        await Promise.all([
          doctorRosterService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
          doctorRosterService.getDoctors(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId, ctx.activeFacilityId),
          doctorRosterService.getSpecializations(ctx.activeTenantId, ctx.activeOrganizationId),
          doctorRosterService.getSchedules(ctx.activeTenantId),
          doctorRosterService.getLeaves(ctx.activeTenantId),
          doctorRosterService.getOpdSlots(ctx.activeTenantId),
          doctorRosterService.getConsultationFees(ctx.activeTenantId, ctx.activeOrganizationId, ctx.activeFacilityId),
          doctorRosterService.getAuditTraces({
            tenantId: ctx.activeTenantId,
            partnerId: ctx.activePartnerId,
            organizationId: ctx.activeOrganizationId,
            branchId: ctx.activeFacilityId,
            pageIndex: 0,
            pageSize: 50
          })
        ]);

      setOverview(overviewRes);
      setDoctors(docsRes);
      setSpecializations(specsRes);
      setSchedules(schedsRes);
      setLeaves(leavesRes);
      setSlots(slotsRes);
      setFees(feesRes);
      setAuditTraces(auditsRes);

      if (docsRes[0] && !selectedDoctorId) {
        setSelectedDoctorId(docsRes[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Doctor & OPD Roster module');
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

  const handleCreateDoctor = async (req: CreateDoctorProfileRequest) => {
    const d = await doctorRosterService.createDoctorProfile(req);
    setDoctors((prev) => [...prev, d]);
    setSelectedDoctorId(d.id);
  };

  const handleUpdateDoctor = async (req: UpdateDoctorProfileRequest) => {
    const updated = await doctorRosterService.updateDoctorProfile(req);
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleCreateSchedule = async (req: CreateDoctorScheduleRequest) => {
    const s = await doctorRosterService.createSchedule(req);
    setSchedules((prev) => [...prev, s]);
    if (context) {
      const refreshedSlots = await doctorRosterService.getOpdSlots(context.activeTenantId);
      setSlots(refreshedSlots);
    }
  };

  const handleAddLeave = async (req: AddDoctorLeaveRequest) => {
    const l = await doctorRosterService.addLeave(req);
    setLeaves((prev) => [l, ...prev]);
    if (context) {
      const [refreshedDocs, refreshedSlots] = await Promise.all([
        doctorRosterService.getDoctors(context.activeTenantId),
        doctorRosterService.getOpdSlots(context.activeTenantId)
      ]);
      setDoctors(refreshedDocs);
      setSlots(refreshedSlots);
    }
  };

  const handleApproveLeave = async (req: ApproveDoctorLeaveRequest) => {
    const updated = await doctorRosterService.approveLeave(req);
    setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleBlockSlot = async (req: BlockOpdSlotRequest) => {
    const updated = await doctorRosterService.blockOpdSlot(req);
    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleUnblockSlot = async (req: UnblockOpdSlotRequest) => {
    const updated = await doctorRosterService.unblockOpdSlot(req);
    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleCreateFee = async (req: CreateConsultationFeeRequest) => {
    const f = await doctorRosterService.createConsultationFee(req);
    setFees((prev) => [...prev, f]);
  };

  const handleAssignLocation = async (req: AssignDoctorLocationRequest) => {
    const updated = await doctorRosterService.assignDoctorLocation(req);
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setActiveTab('profile');
  };

  if (isLoading && !context) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Doctor & OPD Roster Management...
        </span>
      </div>
    );
  }

  if (error && !context) {
    return (
      <ErrorState title="Doctor Roster Module Unavailable" message={error} onRetry={loadData} />
    );
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0] ?? null;
  const activeOrgId = context?.activeOrganizationId ?? organizations[0]?.id ?? '';
  const activeBranchId = context?.activeFacilityId ?? facilities[0]?.id ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Doctor & OPD Roster Management
          </h1>
          
          <Badge variant="warning">Development Preview (Sample Data)</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Attending doctor clinical profiles, weekly recurring OPD schedules, leave conflict protection, slot blocks, and consultation fee matrices
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

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: '📊 Overview' },
          { id: 'directory', label: '🩺 Doctors', badge: <Badge variant="neutral">{doctors.length}</Badge> },
          { id: 'profile', label: '📋 Doctor Profile' },
          { id: 'roster', label: '📅 OPD Roster' },
          { id: 'schedules', label: '⏰ Schedules', badge: <Badge variant="neutral">{schedules.length}</Badge> },
          { id: 'leaves', label: '🌴 Leaves', badge: <Badge variant="neutral">{leaves.length}</Badge> },
          { id: 'slots', label: '🎫 Slots', badge: <Badge variant="neutral">{slots.length}</Badge> },
          { id: 'fees', label: '💵 Fee Matrix', badge: <Badge variant="neutral">{fees.length}</Badge> },
          { id: 'audit', label: '🔍 Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveDoctorTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <DoctorOverviewView
          overview={overview}
          doctors={doctors}
          schedules={schedules}
          onSelectDoctor={handleSelectDoctor}
        />
      )}

      {activeTab === 'directory' && context && (
        <DoctorDirectoryView
          doctors={doctors}
          specializations={specializations}
          staffMembers={staffList.filter((s) => s.staffType === 'DOCTOR')}
          departments={departments}
          organizations={organizations}
          facilities={facilities}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onSelectDoctor={handleSelectDoctor}
          onCreateDoctor={handleCreateDoctor}
          onUpdateDoctor={handleUpdateDoctor}
          onAddLeave={handleAddLeave}
          onCreateSchedule={handleCreateSchedule}
          onAssignLocation={handleAssignLocation}
        />
      )}

      {activeTab === 'profile' && (
        <DoctorProfileView
          doctor={selectedDoctor}
          schedules={schedules}
          leaves={leaves}
          fees={fees}
          auditTraces={auditTraces}
        />
      )}

      {activeTab === 'roster' && (
        <OpdRosterView
          schedules={schedules}
          doctors={doctors}
          onSelectDoctor={handleSelectDoctor}
        />
      )}

      {activeTab === 'schedules' && context && (
        <ScheduleManagerView
          schedules={schedules}
          doctors={doctors}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreateSchedule={handleCreateSchedule}
        />
      )}

      {activeTab === 'leaves' && context && (
        <LeaveCalendarView
          leaves={leaves}
          doctors={doctors}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={context.activeFacilityId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onAddLeave={handleAddLeave}
          onApproveLeave={handleApproveLeave}
        />
      )}

      {activeTab === 'slots' && context && (
        <OpdSlotManagerView
          slots={slots}
          doctors={doctors}
          actorId={context.userRole}
          actorRole={context.userRole}
          onBlockSlot={handleBlockSlot}
          onUnblockSlot={handleUnblockSlot}
        />
      )}

      {activeTab === 'fees' && context && (
        <ConsultationFeeMatrixView
          fees={fees}
          specializations={specializations}
          doctors={doctors}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={context.activeFacilityId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreateFee={handleCreateFee}
        />
      )}

      {activeTab === 'audit' && (
        <DoctorAuditVaultView auditTraces={auditTraces} />
      )}
    </div>
  );
};
