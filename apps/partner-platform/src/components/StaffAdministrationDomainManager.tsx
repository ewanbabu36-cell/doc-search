import React, { useState, useEffect } from 'react';
import type {
  OperationalDepartmentDto,
  OperationalStaffDto,
  StaffRoleAssignmentDto,
  StaffCredentialDto,
  StaffTransferDto,
  OperationalStaffAuditTraceDto,
  StaffAdministrationOverviewDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateOperationalDepartmentRequest,
  UpdateOperationalDepartmentRequest,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  VerifyStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';
import { getPartnerCategoryForWorkspace, type StaffPermissions, type PartnerCategory } from '../types/partner-staff-rbac.js';
import { staffAdministrationService } from '../services/staff-administration-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { StaffOverviewView } from './views/StaffOverviewView.js';
import { StaffDirectoryView } from './views/StaffDirectoryView.js';
import { StaffProfileView } from './views/StaffProfileView.js';
import { DepartmentHierarchyView } from './views/DepartmentHierarchyView.js';
import { RoleScopeView } from './views/RoleScopeView.js';
import { CredentialCenterView } from './views/CredentialCenterView.js';
import { StaffTransfersView } from './views/StaffTransfersView.js';
import { StaffAuditVaultView } from './views/StaffAuditVaultView.js';
import { Tabs, Badge, ErrorState, SkeletonPage } from '@docsearch/ui-kit';

type ActiveStaffTab =
  | 'overview'
  | 'directory'
  | 'profile'
  | 'departments'
  | 'roles'
  | 'credentials'
  | 'transfers'
  | 'audit';

export interface StaffAdministrationDomainManagerProps {
  workspace?: string | undefined;
  partnerType?: string | undefined;
}

export const StaffAdministrationDomainManager: React.FC<StaffAdministrationDomainManagerProps> = ({
  workspace,
  partnerType
}) => {
  const isSimpleProfile = workspace === 'PHARMACY' || workspace === 'CLINIC' || workspace === 'PATHOLOGY';
  const [activeTab, setActiveTab] = useState<ActiveStaffTab>(isSimpleProfile ? 'directory' : 'overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<StaffAdministrationOverviewDto | null>(null);
  const [departments, setDepartments] = useState<OperationalDepartmentDto[]>([]);
  const [staffList, setStaffList] = useState<OperationalStaffDto[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<StaffRoleAssignmentDto[]>([]);
  const [credentials, setCredentials] = useState<StaffCredentialDto[]>([]);
  const [transfers, setTransfers] = useState<StaffTransferDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<OperationalStaffAuditTraceDto[]>([]);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dedicatedCategory: PartnerCategory | null = getPartnerCategoryForWorkspace(workspace, partnerType);

  const effectiveStaffList = React.useMemo(() => {
    if (!dedicatedCategory) return staffList;
    return staffList.filter((s) => {
      const staffCat: PartnerCategory =
        (s as any).partnerCategory || s.metadata?.['partnerCategory'] || (
          s.staffType === 'PHARMACIST' ? 'PHARMACY' :
          s.staffType === 'LAB_TECHNICIAN' ? 'PATHOLOGY' :
          s.staffType === 'DOCTOR' ? (workspace === 'PATHOLOGY' ? 'PATHOLOGY' : workspace === 'CLINIC' ? 'INDEPENDENT_CLINIC' : 'MULTI_SPECIALITY_HOSPITAL') :
          workspace === 'PHARMACY' ? 'PHARMACY' :
          workspace === 'PATHOLOGY' ? 'PATHOLOGY' :
          workspace === 'CLINIC' ? 'INDEPENDENT_CLINIC' :
          'MULTI_SPECIALITY_HOSPITAL'
        );
      return staffCat === dedicatedCategory;
    });
  }, [staffList, dedicatedCategory, workspace]);

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

      const [overviewRes, deptsRes, staffRes, rolesRes, credsRes, transRes, auditsRes] =
        await Promise.all([
          staffAdministrationService.getOverview(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId),
          staffAdministrationService.getDepartments(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId),
          staffAdministrationService.getStaff(ctx.activeTenantId, ctx.activePartnerId, ctx.activeOrganizationId),
          staffAdministrationService.getRoleAssignments(ctx.activeTenantId),
          staffAdministrationService.getCredentials(ctx.activeTenantId),
          staffAdministrationService.getTransfers(ctx.activeTenantId),
          staffAdministrationService.getAuditTraces({
            tenantId: ctx.activeTenantId,
            partnerId: ctx.activePartnerId,
            organizationId: ctx.activeOrganizationId,
            branchId: ctx.activeFacilityId,
            pageIndex: 0,
            pageSize: 50
          })
        ]);

      setOverview(overviewRes);
      setDepartments(deptsRes);
      const uniqueStaff = staffRes.filter(
        (s, idx, arr) =>
          arr.findIndex(
            (x) =>
              x.id === s.id ||
              (x.staffCode && s.staffCode && x.staffCode.toUpperCase() === s.staffCode.toUpperCase())
          ) === idx
      );
      setStaffList(uniqueStaff);
      setRoleAssignments(rolesRes);
      setCredentials(credsRes);
      setTransfers(transRes);
      setAuditTraces(auditsRes);

      if (uniqueStaff[0] && !selectedStaffId) {
        setSelectedStaffId(uniqueStaff[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Staff Administration module');
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

  const handleCreateDepartment = async (req: CreateOperationalDepartmentRequest) => {
    const d = await staffAdministrationService.createDepartment(req);
    setDepartments((prev) => [...prev, d]);
  };

  const handleUpdateDepartment = async (req: UpdateOperationalDepartmentRequest) => {
    const updated = await staffAdministrationService.updateDepartment(req);
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleCreateStaff = async (req: CreateOperationalStaffRequest) => {
    const s = await staffAdministrationService.createStaff(req);
    setStaffList((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === s.id ||
          (item.staffCode && s.staffCode && item.staffCode.toUpperCase() === s.staffCode.toUpperCase())
      );
      if (exists) {
        return prev.map((item) =>
          item.id === s.id ||
          (item.staffCode && s.staffCode && item.staffCode.toUpperCase() === s.staffCode.toUpperCase())
            ? s
            : item
        );
      }
      return [s, ...prev];
    });
    setSelectedStaffId(s.id);
  };

  const handleUpdateStaff = async (req: UpdateOperationalStaffRequest) => {
    const updated = await staffAdministrationService.updateStaff(req);
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleChangeStaffStatus = async (req: ChangeStaffStatusRequest) => {
    const updated = await staffAdministrationService.changeStaffStatus(req);
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAssignRole = async (req: AssignStaffRoleRequest) => {
    const r = await staffAdministrationService.assignStaffRole(req);
    setRoleAssignments((prev) => [r, ...prev]);
    if (context) {
      const refreshedStaff = await staffAdministrationService.getStaff(context.activeTenantId);
      setStaffList(refreshedStaff);
    }
  };

  const handleAddCredential = async (req: AddStaffCredentialRequest) => {
    const c = await staffAdministrationService.addStaffCredential(req);
    setCredentials((prev) => [c, ...prev]);
  };

  const handleVerifyCredential = async (req: VerifyStaffCredentialRequest) => {
    const updated = await staffAdministrationService.verifyStaffCredential(req);
    setCredentials((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (context) {
      const refreshedStaff = await staffAdministrationService.getStaff(context.activeTenantId);
      setStaffList(refreshedStaff);
    }
  };

  const handleTransferStaff = async (req: CreateStaffTransferRequest) => {
    const t = await staffAdministrationService.createStaffTransfer(req);
    setTransfers((prev) => [t, ...prev]);
    if (context) {
      const refreshedStaff = await staffAdministrationService.getStaff(context.activeTenantId);
      setStaffList(refreshedStaff);
    }
  };

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setActiveTab('profile');
  };

  const handleDeleteStaff = async (staffId: string, reason: string) => {
    if (!context) return;
    await staffAdministrationService.deleteStaff(context.activeTenantId, staffId, reason);
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
  };

  const handleRevokeStaff = async (staffId: string, reason: string) => {
    if (!context) return;
    const updated = await staffAdministrationService.revokeStaffAccess(context.activeTenantId, staffId, reason);
    setStaffList((prev) => prev.map((s) => (s.id === staffId ? updated : s)));
  };

  const handleRestoreStaff = async (staffId: string) => {
    if (!context) return;
    const updated = await staffAdministrationService.restoreStaffAccess(context.activeTenantId, staffId);
    setStaffList((prev) => prev.map((s) => (s.id === staffId ? updated : s)));
  };

  const handleUpdatePermissions = async (staffId: string, perms: Partial<StaffPermissions>) => {
    if (!context) return;
    const updated = await staffAdministrationService.updateStaffPermissions(context.activeTenantId, staffId, perms);
    setStaffList((prev) => prev.map((s) => (s.id === staffId ? updated : s)));
  };

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return (
      <ErrorState title="Staff Administration Unavailable" message={error} onRetry={loadData} />
    );
  }

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) ?? staffList[0] ?? null;
  const activeOrgId = context?.activeOrganizationId ?? organizations[0]?.id ?? '';
  const activeBranchId = context?.activeFacilityId ?? facilities[0]?.id ?? '';

  const effectiveDepartments: OperationalDepartmentDto[] =
    departments.length > 0
      ? departments
      : [
          {
            id: 'dept-default-ops',
            tenantId: context?.activeTenantId || 'default-tenant',
            partnerId: context?.activePartnerId || 'default-partner',
            organizationId: activeOrgId || 'default-org',
            departmentCode: workspace ? `${workspace}_OPS` : 'GENERAL_OPS',
            departmentName:
              workspace === 'PHARMACY'
                ? 'Dispensary & Pharmacy Operations'
                : workspace === 'CLINIC'
                ? 'Outpatient & Consultation'
                : workspace === 'PATHOLOGY'
                ? 'Clinical Pathology & Diagnostics'
                : workspace === 'DIAGNOSTIC_CENTRE'
                ? 'Radiology & Imaging'
                : 'General Operations',
            status: 'ACTIVE',
            staffCount: effectiveStaffList.length,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Staff Administration & Department Hierarchy
          </h1>
          
          <Badge variant="success">● LIVE PRODUCTION</Badge>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Operational clinical staff directory, department hierarchy, role & scope bindings, and audited credential verification
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
          { id: 'directory', label: '👥 Staff Directory', badge: <Badge variant="neutral">{effectiveStaffList.length}</Badge> },
          { id: 'profile', label: '📋 Staff Profile' },
          { id: 'departments', label: '🏛️ Departments', badge: <Badge variant="neutral">{departments.length}</Badge> },
          { id: 'roles', label: '🔑 Role & Scope', badge: <Badge variant="neutral">{roleAssignments.length}</Badge> },
          { id: 'credentials', label: '📜 Credentials', badge: <Badge variant="neutral">{credentials.length}</Badge> },
          { id: 'transfers', label: '🔄 Transfers', badge: <Badge variant="neutral">{transfers.length}</Badge> },
          { id: 'audit', label: '🔍 Audit Vault', badge: <Badge variant="neutral">{auditTraces.length}</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveStaffTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <StaffOverviewView
          overview={{
            ...overview,
            totalStaffCount: dedicatedCategory ? effectiveStaffList.length : overview.totalStaffCount,
            activeStaffCount: dedicatedCategory ? effectiveStaffList.filter(s => s.employmentStatus === 'ACTIVE').length : overview.activeStaffCount
          }}
          staffList={effectiveStaffList}
          departments={departments}
          onSelectStaff={handleSelectStaff}
        />
      )}

      {activeTab === 'directory' && context && (
        <StaffDirectoryView
          staffList={effectiveStaffList}
          departments={effectiveDepartments}
          workspace={workspace}
          partnerType={partnerType}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={activeBranchId}
          actorId={context.userRole}
          actorRole={context.userRole}
          organizations={organizations}
          facilities={facilities}
          onSelectStaff={handleSelectStaff}
          onCreateStaff={handleCreateStaff}
          onUpdateStaff={handleUpdateStaff}
          onChangeStatus={handleChangeStaffStatus}
          onAssignRole={handleAssignRole}
          onAddCredential={handleAddCredential}
          onTransferStaff={handleTransferStaff}
          onDeleteStaff={handleDeleteStaff}
          onRevokeStaff={handleRevokeStaff}
          onRestoreStaff={handleRestoreStaff}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}

      {activeTab === 'profile' && (
        <StaffProfileView
          staff={selectedStaff}
          roleAssignments={roleAssignments}
          credentials={credentials}
          transfers={transfers}
          auditTraces={auditTraces}
          onBack={() => setActiveTab('directory')}
        />
      )}

      {activeTab === 'departments' && context && (
        <DepartmentHierarchyView
          departments={departments}
          tenantId={context.activeTenantId}
          partnerId={context.activePartnerId}
          organizationId={activeOrgId}
          branchId={context.activeFacilityId}
          actorId={context.userRole}
          actorRole={context.userRole}
          onCreateDepartment={handleCreateDepartment}
          onUpdateDepartment={handleUpdateDepartment}
        />
      )}

      {activeTab === 'roles' && (
        <RoleScopeView roleAssignments={roleAssignments} />
      )}

      {activeTab === 'credentials' && context && (
        <CredentialCenterView
          credentials={credentials}
          actorId={context.userRole}
          actorRole={context.userRole}
          onVerifyCredential={handleVerifyCredential}
        />
      )}

      {activeTab === 'transfers' && (
        <StaffTransfersView transfers={transfers} />
      )}

      {activeTab === 'audit' && (
        <StaffAuditVaultView auditTraces={auditTraces} />
      )}
    </div>
  );
};
