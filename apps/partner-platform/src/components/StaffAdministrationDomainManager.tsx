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
import { Tabs, Badge, Button, ErrorState, SkeletonPage } from '@docsearch/ui-kit';

type ActiveStaffTab =
  | 'overview'
  | 'directory'
  | 'profile'
  | 'departments'
  | 'roles'
  | 'credentials'
  | 'transfers'
  | 'audit'
  | 'governance';

export interface StaffAdministrationDomainManagerProps {
  workspace?: string | undefined;
  partnerType?: string | undefined;
  tenantId?: string | undefined;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  facilityId?: string | undefined;
}

export const StaffAdministrationDomainManager: React.FC<StaffAdministrationDomainManagerProps> = ({
  workspace,
  partnerType,
  tenantId: propTenantId,
  partnerId: propPartnerId,
  organizationId: propOrgId,
  facilityId: propFacilityId
}) => {
  const normType = (partnerType || workspace || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
  const isEnterpriseMode = normType.includes('HOSPITAL') || normType.includes('ENTERPRISE');
  const isClinicMode = (workspace || '').toUpperCase() === 'CLINIC' || normType.includes('CLINIC');
  const [partnerView, setPartnerView] = useState<'roster' | 'governance' | 'profile'>('roster');
  const [activeTab, setActiveTab] = useState<ActiveStaffTab>(isEnterpriseMode ? 'overview' : 'directory');
  const [governanceSubTab, setGovernanceSubTab] = useState<'roles' | 'departments' | 'credentials' | 'audit'>('roles');
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

      if (staffCat === dedicatedCategory) return true;

      if (dedicatedCategory === 'INDEPENDENT_CLINIC') {
        const role = (s.primaryRole || s.staffType || '').toUpperCase();
        if (role.includes('CLINIC') || role.includes('FRONT_DESK') || role.includes('RECEPTION') || role.includes('DOCTOR') || role.includes('NURSE')) {
          return true;
        }
      }

      return false;
    });
  }, [staffList, dedicatedCategory, workspace]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (propTenantId) {
        await partnerFoundationService.setPanelContext({
          activeTenantId: propTenantId,
          activePartnerId: propPartnerId || propTenantId,
          activeOrganizationId: propOrgId || '',
          activeFacilityId: propFacilityId || ''
        });
      }
      let ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);

      const activePartnerId =
        (partnersRes.some((p) => p.id === ctx.activePartnerId) ? ctx.activePartnerId : partnersRes[0]?.id) ||
        ctx.activePartnerId;
      const activeOrgId =
        (orgsRes.some((o) => o.id === ctx.activeOrganizationId) ? ctx.activeOrganizationId : orgsRes[0]?.id) ||
        ctx.activeOrganizationId;
      const activeFacId =
        (facsRes.some((f) => f.id === ctx.activeFacilityId) ? ctx.activeFacilityId : facsRes[0]?.id) ||
        ctx.activeFacilityId;

      if (
        (activePartnerId && activePartnerId !== ctx.activePartnerId) ||
        (activeOrgId && activeOrgId !== ctx.activeOrganizationId) ||
        (activeFacId && activeFacId !== ctx.activeFacilityId)
      ) {
        ctx = await partnerFoundationService.setPanelContext({
          activePartnerId: activePartnerId || ctx.activePartnerId,
          activeOrganizationId: activeOrgId || ctx.activeOrganizationId,
          activeFacilityId: activeFacId || ctx.activeFacilityId
        });
        setContext(ctx);
      }

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
  const effectiveTenantId = propTenantId || context?.activeTenantId || '';
  const effectivePartnerId = propPartnerId || context?.activePartnerId || effectiveTenantId;
  const activeOrgId = propOrgId || context?.activeOrganizationId || organizations[0]?.id || '';
  const activeBranchId = propFacilityId || context?.activeFacilityId || facilities[0]?.id || '';

  const effectiveDepartments: OperationalDepartmentDto[] =
    departments.length > 0
      ? departments
      : [
          {
            id: '',
            tenantId: effectiveTenantId || 'default-tenant',
            partnerId: effectivePartnerId || 'default-partner',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: isClinicMode ? '1.35rem' : '1.5rem', fontWeight: '800', color: 'var(--ds-color-text-primary)' }}>
              {isClinicMode ? '👥 Clinic Staff & Quick PINs' : 'Staff Administration & Department Hierarchy'}
            </h1>
            <Badge variant="success">{isClinicMode ? '● ACTIVE CHAMBER' : '● LIVE PRODUCTION'}</Badge>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ds-color-text-muted)' }}>
          {isClinicMode
            ? 'Manage receptionists, compounders, clinic assistants, and quick 4-digit tablet login PINs.'
            : 'Operational clinical staff directory, department hierarchy, role & scope bindings, and audited credential verification'}
        </p>
      </div>

      {/* Panel Context Switcher - Hidden on single-facility CLINIC */}
      {context && !isClinicMode && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* 2-View Layout for Standalone Partners (Clinic, Lab, Pharmacy, Diagnostic) vs Enterprise Hospital Suite */}
      {!isEnterpriseMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {partnerView === 'roster' && context && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isClinicMode && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartnerView('governance')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>⚙️</span>
                    <span>Role Templates & Governance Settings</span>
                  </Button>
                </div>
              )}

              <StaffDirectoryView
                staffList={effectiveStaffList}
                departments={effectiveDepartments}
                workspace={workspace}
                partnerType={partnerType}
                tenantId={effectiveTenantId}
                partnerId={effectivePartnerId}
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
            </div>
          )}

          {partnerView === 'governance' && context && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))'
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                    ⚙️ Role Templates & Governance Settings
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Manage profile role templates, operational departments, and audited compliance logs
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPartnerView('roster')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>←</span>
                  <span>Back to Active Staff Roster</span>
                </Button>
              </div>

              {/* Sub-nav Pills */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))', paddingBottom: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'roles' as const, label: `🔑 Role Templates & Scopes (${roleAssignments.length})` },
                  { id: 'departments' as const, label: `🏛️ Operational Departments (${departments.length})` },
                  { id: 'credentials' as const, label: `📜 Credential Verification (${credentials.length})` },
                  { id: 'audit' as const, label: `🔍 Audit Trail (${auditTraces.length})` }
                ].map((sub) => {
                  const isSelected = governanceSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setGovernanceSubTab(sub.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '1px solid var(--ds-color-primary, #0284c7)' : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.1))',
                        background: isSelected ? 'var(--ds-color-surface-selected, rgba(2, 132, 199, 0.15))' : 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
                        color: isSelected ? 'var(--ds-color-primary, #38bdf8)' : 'var(--ds-color-text-secondary, #94a3b8)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>

              {governanceSubTab === 'roles' && (
                <RoleScopeView
                  roleAssignments={roleAssignments}
                  workspace={workspace}
                  partnerType={partnerType}
                />
              )}

              {governanceSubTab === 'departments' && (
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

              {governanceSubTab === 'credentials' && (
                <CredentialCenterView
                  credentials={credentials}
                  actorId={context.userRole}
                  actorRole={context.userRole}
                  onVerifyCredential={handleVerifyCredential}
                />
              )}

              {governanceSubTab === 'audit' && (
                <StaffAuditVaultView auditTraces={auditTraces} />
              )}
            </div>
          )}

          {partnerView === 'profile' && (
            <StaffProfileView
              staff={selectedStaff}
              roleAssignments={roleAssignments}
              credentials={credentials}
              transfers={transfers}
              auditTraces={auditTraces}
              onBack={() => setPartnerView('roster')}
            />
          )}
        </div>
      ) : (
        /* Full 8-Tab Enterprise Suite for Hospital Command */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Tabs
            tabs={[
              { id: 'overview', label: '📊 Workforce Overview' },
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
              tenantId={effectiveTenantId}
              partnerId={effectivePartnerId}
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
            <RoleScopeView
              roleAssignments={roleAssignments}
              workspace={workspace}
              partnerType={partnerType}
            />
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
      )}
    </div>
  );
};
