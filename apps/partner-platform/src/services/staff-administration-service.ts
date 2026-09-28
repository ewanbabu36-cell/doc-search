import type {
  OperationalDepartmentDto,
  OperationalStaffDto,
  StaffRoleAssignmentDto,
  StaffCredentialDto,
  StaffTransferDto,
  OperationalStaffAuditTraceDto,
  StaffAdministrationOverviewDto,
  CreateOperationalDepartmentRequest,
  UpdateOperationalDepartmentRequest,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  VerifyStaffCredentialRequest,
  CreateStaffTransferRequest,
  QueryStaffAuditRequest
} from '@docsearch/api-contracts';
import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import { uniqueIdentifierService } from './unique-identifier-service.js';
import {
  type PartnerCategory,
  type StaffPermissions,
  getDefaultPermissionsForRole
} from '../types/partner-staff-rbac.js';
import {
  MOCK_OPERATIONAL_DEPARTMENTS,
  MOCK_OPERATIONAL_STAFF,
  MOCK_STAFF_ROLE_ASSIGNMENTS,
  MOCK_STAFF_CREDENTIALS,
  MOCK_STAFF_TRANSFERS,
  MOCK_OPERATIONAL_STAFF_AUDIT_TRACES,
  MOCK_STAFF_ADMIN_OVERVIEW
} from './mock-staff-administration-data.js';

function loadStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch {
      // Fallback
    }
  }
  return [...fallback];
}

function saveStored<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }
}

export interface IStaffAdministrationService {
  getOverview(tenantId: string, partnerId?: string, organizationId?: string): Promise<StaffAdministrationOverviewDto>;
  getDepartments(tenantId: string, partnerId?: string, organizationId?: string): Promise<OperationalDepartmentDto[]>;
  createDepartment(req: CreateOperationalDepartmentRequest): Promise<OperationalDepartmentDto>;
  updateDepartment(req: UpdateOperationalDepartmentRequest): Promise<OperationalDepartmentDto>;
  getStaff(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string, departmentId?: string): Promise<OperationalStaffDto[]>;
  getStaffById(tenantId: string, staffId: string): Promise<OperationalStaffDto | null>;
  createStaff(req: CreateOperationalStaffRequest): Promise<OperationalStaffDto>;
  updateStaff(req: UpdateOperationalStaffRequest): Promise<OperationalStaffDto>;
  changeStaffStatus(req: ChangeStaffStatusRequest): Promise<OperationalStaffDto>;
  deleteStaff(tenantId: string, staffId: string, reason?: string): Promise<boolean>;
  revokeStaffAccess(tenantId: string, staffId: string, reason: string): Promise<OperationalStaffDto>;
  restoreStaffAccess(tenantId: string, staffId: string): Promise<OperationalStaffDto>;
  updateStaffPermissions(tenantId: string, staffId: string, permissions: Partial<StaffPermissions>): Promise<OperationalStaffDto>;
  getRoleAssignments(tenantId: string, staffId?: string): Promise<StaffRoleAssignmentDto[]>;
  assignStaffRole(req: AssignStaffRoleRequest): Promise<StaffRoleAssignmentDto>;
  getCredentials(tenantId: string, staffId?: string): Promise<StaffCredentialDto[]>;
  addStaffCredential(req: AddStaffCredentialRequest): Promise<StaffCredentialDto>;
  verifyStaffCredential(req: VerifyStaffCredentialRequest): Promise<StaffCredentialDto>;
  getTransfers(tenantId: string, staffId?: string): Promise<StaffTransferDto[]>;
  createStaffTransfer(req: CreateStaffTransferRequest): Promise<StaffTransferDto>;
  getAuditTraces(req: QueryStaffAuditRequest): Promise<OperationalStaffAuditTraceDto[]>;
}

export class StaffAdministrationService implements IStaffAdministrationService {
  private departments: OperationalDepartmentDto[];
  private staffList: OperationalStaffDto[];
  private roleAssignments: StaffRoleAssignmentDto[];
  private credentials: StaffCredentialDto[];
  private transfers: StaffTransferDto[];
  private auditTraces: OperationalStaffAuditTraceDto[];

  constructor() {
    this.departments = loadStored('docsearch_partner_departments', [...MOCK_OPERATIONAL_DEPARTMENTS]);

    // Auto-sanitization: Scrub obsolete static mock staff and deduplicate by staffCode / email
    const defaultStaff = isMockFallbackAllowed() ? [...MOCK_OPERATIONAL_STAFF] : [];
    const rawStaff = loadStored('docsearch_partner_staff', defaultStaff);
    const customStaff = loadStored('docsearch_custom_staff', []);
    const sourceStaff = [
      ...(Array.isArray(customStaff) ? customStaff : []),
      ...(Array.isArray(rawStaff) && rawStaff.length > 0 ? rawStaff : defaultStaff)
    ];
    const filteredStaff: any[] = sourceStaff.filter((s: any) => {
      const id = String(s?.id || '');
      const name = String(s?.fullName || '').toUpperCase();
      const email = String(s?.workEmail || '').toLowerCase();
      const isMockId = id.startsWith('88888888-');
      const isMockName =
        name.includes('JENKINS') ||
        name.includes('ROSTOVA') ||
        name.includes('DAVID K. MILLER') ||
        name.includes('JAMES REYNOLDS') ||
        name.includes('AMANDA LIU') ||
        name.includes('ROBERT CHEN') ||
        email.includes('docsearch.docsearch.health');
      return !isMockId && !isMockName;
    });

    // Deduplicate by staffCode and workEmail
    const seenStaffCodes = new Set<string>();
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();
    const cleanStaff: any[] = [];

    const staffToProcess = filteredStaff.length > 0 ? filteredStaff : defaultStaff;
    for (const s of staffToProcess) {
      const code = String(s?.staffCode || '').trim().toUpperCase();
      const email = String(s?.workEmail || '').trim().toLowerCase();
      const id = String(s?.id || '').trim();

      if (code && seenStaffCodes.has(code)) continue;
      if (email && seenEmails.has(email)) continue;
      if (id && seenIds.has(id)) continue;

      if (code) seenStaffCodes.add(code);
      if (email) seenEmails.add(email);
      if (id) seenIds.add(id);

      cleanStaff.push(s);
    }

    this.staffList = cleanStaff.map((s: any) => {
      const isNonClinical = ['RECEPTIONIST', 'BILLING_OFFICER', 'ADMINISTRATIVE', 'ACCOUNTANT'].includes(s.staffType);
      const credentialStatus = isNonClinical && s.credentialStatus === 'PENDING' ? ('VERIFIED' as const) : s.credentialStatus;
      const password = s.password || s.metadata?.password || '123456';
      const mustChangePassword =
        s.mustChangePassword !== undefined
          ? s.mustChangePassword
          : s.metadata?.mustChangePassword !== undefined
          ? s.metadata.mustChangePassword
          : true;

      // Deduce or load partnerCategory
      let category: PartnerCategory = s.partnerCategory || s.metadata?.partnerCategory;
      if (!category) {
        if (s.staffType === 'PHARMACIST' || (s.primaryRole && s.primaryRole.includes('PHARMAC'))) {
          category = 'PHARMACY';
        } else if (s.staffType === 'LAB_TECHNICIAN' || (s.primaryRole && (s.primaryRole.includes('LAB') || s.primaryRole.includes('PATHOLOG')))) {
          category = 'PATHOLOGY';
        } else if (s.staffType === 'NURSE' || (s.primaryRole && (s.primaryRole.includes('RMO') || s.primaryRole.includes('SURGEON')))) {
          category = 'MULTI_SPECIALITY_HOSPITAL';
        } else {
          category = 'INDEPENDENT_CLINIC';
        }
      }

      const isAccessRevoked: boolean = Boolean(s.isAccessRevoked ?? s.metadata?.isAccessRevoked ?? (s.employmentStatus === 'SUSPENDED'));
      const revokedAt: string | undefined = s.revokedAt || s.metadata?.revokedAt || undefined;
      const revokedReason: string | undefined = s.revokedReason || s.metadata?.revokedReason || undefined;
      const permissions: StaffPermissions =
        s.permissions ||
        s.metadata?.permissions ||
        getDefaultPermissionsForRole(category, s.primaryRole || 'CLINIC_FRONT_DESK');

      return {
        ...s,
        credentialStatus,
        password,
        mustChangePassword,
        partnerCategory: category,
        isAccessRevoked,
        revokedAt,
        revokedReason,
        permissions,
        metadata: {
          ...s.metadata,
          password,
          mustChangePassword,
          partnerCategory: category,
          isAccessRevoked,
          revokedAt,
          revokedReason,
          permissions
        }
      };
    });
    saveStored('docsearch_partner_staff', this.staffList);

    const rawRoles = loadStored('docsearch_partner_staff_roles', [...MOCK_STAFF_ROLE_ASSIGNMENTS]);
    const filteredRoles = Array.isArray(rawRoles)
      ? rawRoles.filter((r: any) => !String(r?.id || '').startsWith('99999999-') && !String(r?.staffId || '').startsWith('88888888-'))
      : [];
    this.roleAssignments = filteredRoles.length > 0 ? filteredRoles : [...MOCK_STAFF_ROLE_ASSIGNMENTS];
    saveStored('docsearch_partner_staff_roles', this.roleAssignments);

    const rawCreds = loadStored('docsearch_partner_staff_credentials', [...MOCK_STAFF_CREDENTIALS]);
    const filteredCreds = Array.isArray(rawCreds)
      ? rawCreds.filter((c: any) => !String(c?.id || '').startsWith('aaaaaaaa-') && !String(c?.staffId || '').startsWith('88888888-'))
      : [];
    this.credentials = filteredCreds.length > 0 ? filteredCreds : [...MOCK_STAFF_CREDENTIALS];
    saveStored('docsearch_partner_staff_credentials', this.credentials);

    const rawTransfers = loadStored('docsearch_partner_staff_transfers', [...MOCK_STAFF_TRANSFERS]);
    this.transfers = Array.isArray(rawTransfers)
      ? rawTransfers.filter((t: any) => !String(t?.id || '').startsWith('bbbbbbbb-') && !String(t?.staffId || '').startsWith('88888888-'))
      : [];
    saveStored('docsearch_partner_staff_transfers', this.transfers);

    const rawAudits = loadStored('docsearch_partner_staff_audit', [...MOCK_OPERATIONAL_STAFF_AUDIT_TRACES]);
    this.auditTraces = Array.isArray(rawAudits)
      ? rawAudits.filter((a: any) => !String(a?.id || '').startsWith('cccccccc-'))
      : [];
    saveStored('docsearch_partner_staff_audit', this.auditTraces);
  }

  private addAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string | undefined,
    branchId: string | undefined,
    departmentId: string | undefined,
    staffId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: OperationalStaffAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `stf-tr-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      departmentId,
      staffId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      justification,
      operationStatus,
      correlationId: `corr-stf-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
    saveStored('docsearch_partner_staff_audit', this.auditTraces);
  }

  async getOverview(
    tenantId: string,
    partnerId?: string,
    organizationId?: string
  ): Promise<StaffAdministrationOverviewDto> {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (organizationId) params.append('organizationId', organizationId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<StaffAdministrationOverviewDto>(`/api/v1/partner/staff/overview${queryStr}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const isMatchingTenant = (tId?: string) =>
      !tenantId ||
      !tId ||
      tId === tenantId;

    const filteredStaff = this.staffList.filter((s) => {
      if (!isMatchingTenant(s.tenantId)) return false;
      if (partnerId && s.partnerId && s.partnerId !== partnerId) return false;
      if (organizationId && s.organizationId && s.organizationId !== organizationId) return false;
      return true;
    });

    const filteredDepts = this.departments.filter((d) => {
      if (!isMatchingTenant(d.tenantId)) return false;
      if (partnerId && d.partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId && d.organizationId !== organizationId) return false;
      return true;
    });

    const filteredCreds = this.credentials.filter((c) => {
      if (!isMatchingTenant(c.tenantId)) return false;
      if (partnerId && c.partnerId && c.partnerId !== partnerId) return false;
      if (organizationId && c.organizationId && c.organizationId !== organizationId) return false;
      return true;
    });

    return {
      ...MOCK_STAFF_ADMIN_OVERVIEW,
      totalStaffCount: filteredStaff.length,
      activeStaffCount: filteredStaff.filter((s) => s.employmentStatus === 'ACTIVE').length,
      onLeaveStaffCount: filteredStaff.filter((s) => s.employmentStatus === 'ON_LEAVE').length,
      suspendedStaffCount: filteredStaff.filter((s) => s.employmentStatus === 'SUSPENDED').length,
      totalDepartmentsCount: filteredDepts.length,
      pendingVerificationsCount: filteredCreds.filter((c) => c.verificationStatus === 'PENDING').length,
      totalTransfersCount: this.transfers.length
    };
  }

  async getDepartments(
    tenantId: string,
    partnerId?: string,
    organizationId?: string
  ): Promise<OperationalDepartmentDto[]> {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (organizationId) params.append('organizationId', organizationId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<OperationalDepartmentDto[]>(`/api/v1/partner/staff/departments${queryStr}`);
      if (res.success && Array.isArray(res.data)) {
        this.departments = res.data;
        saveStored('docsearch_partner_departments', this.departments);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const isMatchingTenant = (tId?: string) =>
      !tenantId ||
      !tId ||
      tId === tenantId;

    return this.departments.filter((d) => {
      if (!isMatchingTenant(d.tenantId)) return false;
      if (partnerId && d.partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId && d.organizationId !== organizationId) return false;
      return true;
    });
  }

  async createDepartment(req: CreateOperationalDepartmentRequest): Promise<OperationalDepartmentDto> {
    try {
      const res = await apiRequest<OperationalDepartmentDto>('/api/v1/partner/staff/departments', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.departments.push(res.data);
        saveStored('docsearch_partner_departments', this.departments);
        this.addAudit(
          req.tenantId,
          req.partnerId,
          req.organizationId,
          req.branchId,
          res.data.id,
          undefined,
          req.actorId,
          req.actorRole,
          'DEPARTMENT_CREATED',
          'operational_departments',
          res.data.departmentCode,
          req.reason
        );
        return res.data;
      }
    } catch {
      // Fallback
    }

    let parentName: string | undefined;
    if (req.parentDepartmentId) {
      const parent = this.departments.find((d) => d.id === req.parentDepartmentId && d.organizationId === req.organizationId);
      parentName = parent?.departmentName;
    }

    const dept: OperationalDepartmentDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentCode: req.departmentCode,
      departmentName: req.departmentName,
      parentDepartmentId: req.parentDepartmentId,
      parentDepartmentName: parentName,
      departmentHeadId: req.departmentHeadId,
      departmentHeadName: req.departmentHeadName,
      costCenterCode: req.costCenterCode,
      status: 'ACTIVE',
      staffCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.departments.push(dept);
    saveStored('docsearch_partner_departments', this.departments);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      dept.id,
      undefined,
      req.actorId,
      req.actorRole,
      'DEPARTMENT_CREATED',
      'operational_departments',
      dept.departmentCode,
      req.reason
    );
    return dept;
  }

  async updateDepartment(req: UpdateOperationalDepartmentRequest): Promise<OperationalDepartmentDto> {
    try {
      const res = await apiRequest<OperationalDepartmentDto>(`/api/v1/partner/staff/departments/${encodeURIComponent(req.departmentId)}`, {
        method: 'PUT',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.departments.findIndex((d) => d.id === req.departmentId);
        if (idx >= 0) this.departments[idx] = res.data;
        saveStored('docsearch_partner_departments', this.departments);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const dept = this.departments.find((d) => d.id === req.departmentId && d.organizationId === req.organizationId);
    if (!dept) {
      throw new Error(`Department ${req.departmentId} not found`);
    }

    if (req.departmentName) dept.departmentName = req.departmentName;
    if (req.departmentHeadId !== undefined) dept.departmentHeadId = req.departmentHeadId;
    if (req.departmentHeadName !== undefined) dept.departmentHeadName = req.departmentHeadName;
    if (req.costCenterCode !== undefined) dept.costCenterCode = req.costCenterCode;
    if (req.status) dept.status = req.status;
    dept.updatedAt = new Date().toISOString();

    saveStored('docsearch_partner_departments', this.departments);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      dept.branchId,
      dept.id,
      undefined,
      req.actorId,
      req.actorRole,
      'DEPARTMENT_UPDATED',
      'operational_departments',
      dept.departmentCode,
      req.reason
    );
    return dept;
  }

  async getStaff(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string,
    departmentId?: string
  ): Promise<OperationalStaffDto[]> {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (organizationId) params.append('organizationId', organizationId);
      if (branchId) params.append('branchId', branchId);
      if (departmentId) params.append('departmentId', departmentId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<OperationalStaffDto[]>(`/api/v1/partner/staff/members${queryStr}`);
      if (res.success && Array.isArray(res.data)) {
        if (res.data.length === 0 && !isMockFallbackAllowed()) {
          this.staffList = [];
          saveStored('docsearch_partner_staff', []);
          return [];
        }
        if (res.data.length > 0) {
          const customStaff = loadStored<OperationalStaffDto>('docsearch_custom_staff', []);
          const map = new Map<string, OperationalStaffDto>();

          for (const s of this.staffList) {
            const k = (s.workEmail || s.staffCode || s.id).toLowerCase();
            map.set(k, s);
          }
          for (const s of customStaff) {
            const k = (s.workEmail || s.staffCode || s.id).toLowerCase();
            map.set(k, s);
          }
          for (const s of res.data) {
            const k = (s.workEmail || s.staffCode || s.id).toLowerCase();
            const existing = map.get(k);
            map.set(k, { ...(existing || {}), ...s });
          }

          this.staffList = Array.from(map.values());
          saveStored('docsearch_partner_staff', this.staffList);
          return this.staffList;
        }
      }
    } catch {
      // Fallback
    }

    const isMatchingTenant = (tId?: string) =>
      !tenantId ||
      !tId ||
      tId === tenantId;

    return this.staffList.filter((s) => {
      if (!isMatchingTenant(s.tenantId)) return false;
      if (partnerId && partnerId.trim() && s.partnerId && s.partnerId !== partnerId) return false;
      if (organizationId && organizationId.trim() && s.organizationId && s.organizationId !== organizationId) return false;
      if (branchId && branchId.trim() && s.branchId && s.branchId !== branchId) return false;
      if (departmentId && departmentId.trim() && s.departmentId && s.departmentId !== departmentId) return false;
      return true;
    });
  }

  async getStaffById(tenantId: string, staffId: string): Promise<OperationalStaffDto | null> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${staffId}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const found = this.staffList.find((s) => s.tenantId === tenantId && s.id === staffId);
    return found ? { ...found } : null;
  }

  async createStaff(req: CreateOperationalStaffRequest): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>('/api/v1/partner/staff/members', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const staffData = res.data;
        const existingIdx = this.staffList.findIndex(
          (s) => s.id === staffData.id || (s.staffCode && s.staffCode.toUpperCase() === staffData.staffCode.toUpperCase())
        );
        if (existingIdx >= 0) {
          this.staffList[existingIdx] = staffData;
        } else {
          this.staffList.unshift(staffData);
        }
        saveStored('docsearch_partner_staff', this.staffList);
        // Also persist to custom staff storage
        const customStaff = loadStored<OperationalStaffDto>('docsearch_custom_staff', []);
        const filteredCustom = customStaff.filter(
          (s) => s.id !== staffData.id && s.workEmail !== staffData.workEmail && s.staffCode !== staffData.staffCode
        );
        saveStored('docsearch_custom_staff', [staffData, ...filteredCustom]);

        this.addAudit(
          req.tenantId,
          req.partnerId,
          req.organizationId,
          req.branchId,
          req.departmentId,
          staffData.id,
          req.actorId,
          req.actorRole,
          'STAFF_CREATED',
          'operational_staff',
          staffData.staffCode,
          req.reason
        );
        return staffData;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Staff creation failed on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Staff creation network error');
      }
    }

    // Check if staff member already exists in local list
    const existingIdx = this.staffList.findIndex(
      (s) =>
        (s.staffCode && s.staffCode.toUpperCase() === req.staffCode.trim().toUpperCase()) ||
        (s.workEmail && s.workEmail.toLowerCase() === req.workEmail.trim().toLowerCase())
    );
    if (existingIdx >= 0 && this.staffList[existingIdx]) {
      return this.staffList[existingIdx]!;
    }

    const partnerCategory: PartnerCategory = req.metadata?.['partnerCategory'] || 'INDEPENDENT_CLINIC';
    const initialPassword = req.metadata?.['password'] || (req as any).password || '123456';
    const permissions: StaffPermissions =
      req.metadata?.['permissions'] ||
      getDefaultPermissionsForRole(partnerCategory, req.primaryRole || 'CLINIC_FRONT_DESK');

    const dept = this.departments.find((d) => d.id === req.departmentId);
    const finalStaffCode =
      req.staffCode?.trim() ||
      uniqueIdentifierService.generateStaffCode(req.staffType, dept?.departmentCode);
    const staff: OperationalStaffDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      departmentName: dept?.departmentName || 'Clinical Services',
      staffCode: finalStaffCode,
      fullName: req.fullName,
      workEmail: req.workEmail,
      workPhone: req.workPhone,
      staffType: req.staffType,
      primaryRole: req.primaryRole,
      employmentType: req.employmentType,
      employmentStatus: 'ACTIVE',
      joiningDate: req.joiningDate,
      professionalProfileRef: req.professionalProfileRef,
      credentialStatus: ['RECEPTIONIST', 'BILLING_OFFICER', 'ADMINISTRATIVE', 'ACCOUNTANT'].includes(req.staffType) ? 'VERIFIED' : 'PENDING',
      activeRoleScope: 'BRANCH',
      metadata: {
        ...(req.metadata || {}),
        password: initialPassword,
        mustChangePassword: true,
        partnerCategory,
        isAccessRevoked: false,
        permissions
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    (staff as any).password = initialPassword;
    (staff as any).mustChangePassword = true;
    (staff as any).partnerCategory = partnerCategory;
    (staff as any).isAccessRevoked = false;
    (staff as any).permissions = permissions;
    this.staffList.unshift(staff);
    saveStored('docsearch_partner_staff', this.staffList);

    // Persist to custom staff storage so page refresh NEVER removes them
    const customStaff = loadStored<OperationalStaffDto>('docsearch_custom_staff', []);
    const filteredCustom = customStaff.filter(
      (s) => s.id !== staff.id && s.workEmail !== staff.workEmail && s.staffCode !== staff.staffCode
    );
    saveStored('docsearch_custom_staff', [staff, ...filteredCustom]);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      req.departmentId,
      staff.id,
      req.actorId,
      req.actorRole,
      'STAFF_CREATED',
      'operational_staff',
      staff.staffCode,
      req.reason
    );
    return staff;
  }

  async updateStaff(req: UpdateOperationalStaffRequest): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${req.staffId}`, {
        method: 'PUT',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.staffList.findIndex((s) => s.id === req.staffId);
        if (idx >= 0) this.staffList[idx] = res.data;
        saveStored('docsearch_partner_staff', this.staffList);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const staff = this.staffList.find((s) => s.id === req.staffId);
    if (!staff) throw new Error(`Staff member ${req.staffId} not found`);

    if (req.fullName) staff.fullName = req.fullName;
    if (req.workEmail) staff.workEmail = req.workEmail;
    if (req.workPhone !== undefined) staff.workPhone = req.workPhone;
    if (req.primaryRole) staff.primaryRole = req.primaryRole;
    if (req.employmentType) staff.employmentType = req.employmentType;
    staff.updatedAt = new Date().toISOString();

    saveStored('docsearch_partner_staff', this.staffList);
    return staff;
  }

  async changeStaffStatus(req: ChangeStaffStatusRequest): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${req.staffId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.staffList.findIndex((s) => s.id === req.staffId);
        if (idx >= 0) this.staffList[idx] = res.data;
        saveStored('docsearch_partner_staff', this.staffList);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const staff = this.staffList.find((s) => s.id === req.staffId);
    if (!staff) throw new Error(`Staff member ${req.staffId} not found`);

    staff.employmentStatus = req.newStatus;
    staff.updatedAt = new Date().toISOString();
    saveStored('docsearch_partner_staff', this.staffList);
    return staff;
  }

  async deleteStaff(tenantId: string, staffId: string, reason: string = 'Staff record deleted by administrator'): Promise<boolean> {
    try {
      await apiRequest(`/api/v1/partner/staff/members/${staffId}`, {
        method: 'DELETE',
        body: JSON.stringify({ tenantId, reason })
      });
    } catch {
      // Fallback
    }

    const idx = this.staffList.findIndex((s) => s.id === staffId);
    if (idx >= 0) {
      const removed = this.staffList[idx];
      this.staffList.splice(idx, 1);
      saveStored('docsearch_partner_staff', this.staffList);
      if (removed) {
        this.addAudit(
          tenantId,
          removed.partnerId || 'default-partner',
          removed.organizationId,
          removed.branchId,
          removed.departmentId,
          removed.id,
          'ADMIN',
          'ADMINISTRATOR',
          'STAFF_DELETED' as any,
          'operational_staff',
          removed.staffCode,
          reason
        );
      }
      return true;
    }
    return false;
  }

  async revokeStaffAccess(tenantId: string, staffId: string, reason: string): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${staffId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ tenantId, reason })
      });
      if (res.success && res.data) {
        const staff = res.data;
        const idx = this.staffList.findIndex((s) => s.id === staffId);
        if (idx !== -1) {
          this.staffList[idx] = staff;
        } else {
          this.staffList.unshift(staff);
        }
        saveStored('docsearch_partner_staff', this.staffList);
        return staff;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
    }

    const staff = this.staffList.find((s) => s.id === staffId);
    if (!staff) throw new Error(`Staff member ${staffId} not found`);

    const now = new Date().toISOString();
    staff.employmentStatus = 'SUSPENDED';
    (staff as any).isAccessRevoked = true;
    (staff as any).revokedAt = now;
    (staff as any).revokedReason = reason;

    if (!staff.metadata) staff.metadata = {};
    staff.metadata['isAccessRevoked'] = true;
    staff.metadata['revokedAt'] = now;
    staff.metadata['revokedReason'] = reason;
    staff.updatedAt = now;

    saveStored('docsearch_partner_staff', this.staffList);

    this.addAudit(
      tenantId,
      staff.partnerId || 'default-partner',
      staff.organizationId,
      staff.branchId,
      staff.departmentId,
      staff.id,
      'ADMIN',
      'ADMINISTRATOR',
      'STAFF_STATUS_CHANGED',
      'operational_staff',
      staff.staffCode,
      `ACCESS_REVOKED: ${reason}`
    );

    return staff;
  }

  async restoreStaffAccess(tenantId: string, staffId: string): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${staffId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ tenantId })
      });
      if (res.success && res.data) {
        const staff = res.data;
        const idx = this.staffList.findIndex((s) => s.id === staffId);
        if (idx !== -1) {
          this.staffList[idx] = staff;
        } else {
          this.staffList.unshift(staff);
        }
        saveStored('docsearch_partner_staff', this.staffList);
        return staff;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
    }

    const staff = this.staffList.find((s) => s.id === staffId);
    if (!staff) throw new Error(`Staff member ${staffId} not found`);

    const now = new Date().toISOString();
    staff.employmentStatus = 'ACTIVE';
    (staff as any).isAccessRevoked = false;
    delete (staff as any).revokedAt;
    delete (staff as any).revokedReason;

    if (staff.metadata) {
      staff.metadata['isAccessRevoked'] = false;
      delete staff.metadata['revokedAt'];
      delete staff.metadata['revokedReason'];
    }
    staff.updatedAt = now;

    saveStored('docsearch_partner_staff', this.staffList);

    this.addAudit(
      tenantId,
      staff.partnerId || 'default-partner',
      staff.organizationId,
      staff.branchId,
      staff.departmentId,
      staff.id,
      'ADMIN',
      'ADMINISTRATOR',
      'STAFF_STATUS_CHANGED',
      'operational_staff',
      staff.staffCode,
      'ACCESS_RESTORED: Re-activated credentials'
    );

    return staff;
  }

  async updateStaffPermissions(tenantId: string, staffId: string, permissions: Partial<StaffPermissions>): Promise<OperationalStaffDto> {
    try {
      const res = await apiRequest<OperationalStaffDto>(`/api/v1/partner/staff/members/${staffId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ tenantId, permissions })
      });
      if (res.success && res.data) {
        const staff = res.data;
        const idx = this.staffList.findIndex((s) => s.id === staffId);
        if (idx !== -1) {
          this.staffList[idx] = staff;
        } else {
          this.staffList.unshift(staff);
        }
        saveStored('docsearch_partner_staff', this.staffList);
        return staff;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
    }

    const staff = this.staffList.find((s) => s.id === staffId);
    if (!staff) throw new Error(`Staff member ${staffId} not found`);

    const currentPerms = (staff as any).permissions || staff.metadata?.['permissions'] || {};
    const updatedPerms: StaffPermissions = {
      ...currentPerms,
      ...permissions
    };

    (staff as any).permissions = updatedPerms;
    if (!staff.metadata) staff.metadata = {};
    staff.metadata['permissions'] = updatedPerms;
    staff.updatedAt = new Date().toISOString();

    saveStored('docsearch_partner_staff', this.staffList);

    this.addAudit(
      tenantId,
      staff.partnerId || 'default-partner',
      staff.organizationId,
      staff.branchId,
      staff.departmentId,
      staff.id,
      'ADMIN',
      'ADMINISTRATOR',
      'STAFF_ROLE_ASSIGNED',
      'operational_staff',
      staff.staffCode,
      `RBAC permissions updated (${updatedPerms.accessibleModules?.length || 0} modules, export: ${updatedPerms.canExportPatientData ? 'allowed' : 'blocked'})`
    );

    return staff;
  }

  async getRoleAssignments(tenantId: string, staffId?: string): Promise<StaffRoleAssignmentDto[]> {
    try {
      const queryStr = staffId ? `?staffId=${staffId}` : '';
      const res = await apiRequest<StaffRoleAssignmentDto[]>(`/api/v1/partner/staff/roles${queryStr}`);
      if (res.success && Array.isArray(res.data)) {
        this.roleAssignments = res.data;
        saveStored('docsearch_partner_staff_roles', this.roleAssignments);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.roleAssignments.filter((r) => {
      if (r.tenantId !== tenantId) return false;
      if (staffId && r.staffId !== staffId) return false;
      return true;
    });
  }

  async assignStaffRole(req: AssignStaffRoleRequest): Promise<StaffRoleAssignmentDto> {
    try {
      const res = await apiRequest<StaffRoleAssignmentDto>('/api/v1/partner/staff/roles/assign', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.roleAssignments.unshift(res.data);
        saveStored('docsearch_partner_staff_roles', this.roleAssignments);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const assignment: StaffRoleAssignmentDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      staffId: req.staffId,
      roleCode: req.roleCode,
      dataScope: req.dataScope,
      isPrimary: req.isPrimary ?? true,
      effectiveFrom: req.effectiveFrom,
      effectiveTo: req.effectiveTo,
      assignedBy: req.actorId,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.roleAssignments.unshift(assignment);
    saveStored('docsearch_partner_staff_roles', this.roleAssignments);

    const staff = this.staffList.find((s) => s.id === req.staffId);
    if (staff && (req.isPrimary ?? true)) {
      staff.primaryRole = req.roleCode;
      staff.activeRoleScope = req.dataScope;
      if (['RECEPTIONIST', 'BILLING_OFFICER', 'ADMINISTRATIVE', 'ACCOUNTANT'].includes(staff.staffType) || ['RECEPTIONIST', 'FRONT_DESK_LEAD', 'CASHIER_BILLING_OFFICER', 'BILLING_MANAGER'].includes(req.roleCode)) {
        staff.credentialStatus = 'VERIFIED';
      }
      staff.updatedAt = new Date().toISOString();
      saveStored('docsearch_partner_staff', this.staffList);
    }

    return assignment;
  }

  async getCredentials(tenantId: string, staffId?: string): Promise<StaffCredentialDto[]> {
    try {
      const queryStr = staffId ? `?staffId=${staffId}` : '';
      const res = await apiRequest<StaffCredentialDto[]>(`/api/v1/partner/staff/credentials${queryStr}`);
      if (res.success && Array.isArray(res.data)) {
        this.credentials = res.data;
        saveStored('docsearch_partner_staff_credentials', this.credentials);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.credentials.filter((c) => {
      if (c.tenantId !== tenantId) return false;
      if (staffId && c.staffId !== staffId) return false;
      return true;
    });
  }

  async addStaffCredential(req: AddStaffCredentialRequest): Promise<StaffCredentialDto> {
    try {
      const res = await apiRequest<StaffCredentialDto>('/api/v1/partner/staff/credentials', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.credentials.unshift(res.data);
        saveStored('docsearch_partner_staff_credentials', this.credentials);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const cred: StaffCredentialDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      staffId: req.staffId,
      credentialType: req.credentialType,
      registrationNumber: req.registrationNumber,
      issuingAuthority: req.issuingAuthority,
      issueDate: req.issueDate,
      expiryDate: req.expiryDate,
      verificationStatus: 'VERIFIED',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.credentials.unshift(cred);
    saveStored('docsearch_partner_staff_credentials', this.credentials);

    const staffMember = this.staffList.find((s) => s.id === req.staffId);
    if (staffMember) {
      staffMember.credentialStatus = 'VERIFIED';
      staffMember.updatedAt = new Date().toISOString();
      saveStored('docsearch_partner_staff', this.staffList);
    }

    return cred;
  }

  async verifyStaffCredential(req: VerifyStaffCredentialRequest): Promise<StaffCredentialDto> {
    try {
      const res = await apiRequest<StaffCredentialDto>(`/api/v1/partner/staff/credentials/${req.credentialId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.credentials.findIndex((c) => c.id === req.credentialId);
        if (idx >= 0) this.credentials[idx] = res.data;
        saveStored('docsearch_partner_staff_credentials', this.credentials);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const cred = this.credentials.find((c) => c.id === req.credentialId);
    if (!cred) throw new Error(`Credential ${req.credentialId} not found`);

    cred.verificationStatus = 'VERIFIED';
    cred.verifiedBy = req.actorId;
    cred.verifiedAt = new Date().toISOString();
    cred.verificationReference = req.verificationReference;
    cred.updatedAt = new Date().toISOString();

    saveStored('docsearch_partner_staff_credentials', this.credentials);
    return cred;
  }

  async getTransfers(tenantId: string, staffId?: string): Promise<StaffTransferDto[]> {
    try {
      const queryStr = staffId ? `?staffId=${staffId}` : '';
      const res = await apiRequest<StaffTransferDto[]>(`/api/v1/partner/staff/transfers${queryStr}`);
      if (res.success && Array.isArray(res.data)) {
        this.transfers = res.data;
        saveStored('docsearch_partner_staff_transfers', this.transfers);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.transfers.filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (staffId && t.staffId !== staffId) return false;
      return true;
    });
  }

  async createStaffTransfer(req: CreateStaffTransferRequest): Promise<StaffTransferDto> {
    try {
      const res = await apiRequest<StaffTransferDto>('/api/v1/partner/staff/transfers', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.transfers.unshift(res.data);
        saveStored('docsearch_partner_staff_transfers', this.transfers);

        // Update staff member
        const staff = this.staffList.find((s) => s.id === req.staffId);
        if (staff) {
          staff.organizationId = req.toOrganizationId;
          staff.branchId = req.toBranchId;
          staff.departmentId = req.toDepartmentId;
          saveStored('docsearch_partner_staff', this.staffList);
        }

        return res.data;
      }
    } catch {
      // Fallback
    }

    const staff = this.staffList.find((s) => s.id === req.staffId);
    if (!staff) throw new Error(`Staff member ${req.staffId} not found`);

    const transfer: StaffTransferDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      staffId: req.staffId,
      fromOrganizationId: staff.organizationId,
      toOrganizationId: req.toOrganizationId,
      fromBranchId: staff.branchId,
      toBranchId: req.toBranchId,
      fromDepartmentId: staff.departmentId,
      toDepartmentId: req.toDepartmentId,
      transferType: req.transferType,
      transferStatus: 'COMPLETED',
      effectiveDate: req.effectiveDate,
      authorizedBy: req.actorId,
      justification: req.reason,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.transfers.unshift(transfer);
    saveStored('docsearch_partner_staff_transfers', this.transfers);

    staff.organizationId = req.toOrganizationId;
    staff.branchId = req.toBranchId;
    staff.departmentId = req.toDepartmentId;
    staff.updatedAt = new Date().toISOString();
    saveStored('docsearch_partner_staff', this.staffList);

    return transfer;
  }

  async getAuditTraces(req: QueryStaffAuditRequest): Promise<OperationalStaffAuditTraceDto[]> {
    return this.auditTraces.filter((a) => {
      if (req.partnerId && a.partnerId !== req.partnerId) return false;
      if (req.staffId && a.staffId !== req.staffId) return false;
      return true;
    });
  }
}

export const staffAdministrationService = new StaffAdministrationService();
