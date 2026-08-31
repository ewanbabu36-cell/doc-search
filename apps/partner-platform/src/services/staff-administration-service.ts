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
import { MOCK_TENANT_ID } from './mock-partner-foundation-data.js';
import {
  MOCK_OPERATIONAL_DEPARTMENTS,
  MOCK_OPERATIONAL_STAFF,
  MOCK_STAFF_ROLE_ASSIGNMENTS,
  MOCK_STAFF_CREDENTIALS,
  MOCK_STAFF_TRANSFERS,
  MOCK_OPERATIONAL_STAFF_AUDIT_TRACES,
  MOCK_STAFF_ADMIN_OVERVIEW
} from './mock-staff-administration-data.js';

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
  private departments: OperationalDepartmentDto[] = [...MOCK_OPERATIONAL_DEPARTMENTS];
  private staffList: OperationalStaffDto[] = [...MOCK_OPERATIONAL_STAFF];
  private roleAssignments: StaffRoleAssignmentDto[] = [...MOCK_STAFF_ROLE_ASSIGNMENTS];
  private credentials: StaffCredentialDto[] = [...MOCK_STAFF_CREDENTIALS];
  private transfers: StaffTransferDto[] = [...MOCK_STAFF_TRANSFERS];
  private auditTraces: OperationalStaffAuditTraceDto[] = [...MOCK_OPERATIONAL_STAFF_AUDIT_TRACES];

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
  }

  async getOverview(
    tenantId: string,
    partnerId?: string,
    organizationId?: string
  ): Promise<StaffAdministrationOverviewDto> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }

    const filteredStaff = this.staffList.filter((s) => {
      if (partnerId && s.partnerId !== partnerId) return false;
      if (organizationId && s.organizationId !== organizationId) return false;
      return true;
    });

    const filteredDepts = this.departments.filter((d) => {
      if (partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId !== organizationId) return false;
      return true;
    });

    const filteredCreds = this.credentials.filter((c) => {
      if (partnerId && c.partnerId !== partnerId) return false;
      if (organizationId && c.organizationId !== organizationId) return false;
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
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.departments.filter((d) => {
      if (partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId !== organizationId) return false;
      return true;
    });
  }

  async createDepartment(req: CreateOperationalDepartmentRequest): Promise<OperationalDepartmentDto> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Cannot create department in foreign tenant ${req.tenantId}`);
    }

    let parentName: string | undefined;
    if (req.parentDepartmentId) {
      const parent = this.departments.find((d) => d.id === req.parentDepartmentId && d.organizationId === req.organizationId);
      if (!parent) {
        throw new Error(`[Hierarchy Violation] Parent department ${req.parentDepartmentId} does not exist in organization.`);
      }
      parentName = parent.departmentName;
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
    const dept = this.departments.find(
      (d) => d.id === req.departmentId && d.organizationId === req.organizationId && d.tenantId === req.tenantId
    );
    if (!dept) {
      throw new Error(`Department ${req.departmentId} not found under organization.`);
    }

    if (req.departmentName) dept.departmentName = req.departmentName;
    if (req.departmentHeadId) dept.departmentHeadId = req.departmentHeadId;
    if (req.departmentHeadName) dept.departmentHeadName = req.departmentHeadName;
    if (req.costCenterCode) dept.costCenterCode = req.costCenterCode;
    if (req.status) dept.status = req.status;
    dept.updatedAt = new Date().toISOString();

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
    return { ...dept };
  }

  async getStaff(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string,
    departmentId?: string
  ): Promise<OperationalStaffDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.staffList.filter((s) => {
      if (partnerId && s.partnerId !== partnerId) return false;
      if (organizationId && s.organizationId !== organizationId) return false;
      if (branchId && s.branchId !== branchId) return false;
      if (departmentId && s.departmentId !== departmentId) return false;
      return true;
    });
  }

  async getStaffById(tenantId: string, staffId: string): Promise<OperationalStaffDto | null> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.staffList.find((s) => s.id === staffId) ?? null;
  }

  async createStaff(req: CreateOperationalStaffRequest): Promise<OperationalStaffDto> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Cannot create staff in foreign tenant ${req.tenantId}`);
    }

    const dept = this.departments.find((d) => d.id === req.departmentId && d.organizationId === req.organizationId);
    if (!dept) {
      throw new Error(`[Hierarchy Violation] Department ${req.departmentId} not found under organization.`);
    }

    const staff: OperationalStaffDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      departmentName: dept.departmentName,
      staffCode: req.staffCode,
      fullName: req.fullName,
      workEmail: req.workEmail,
      workPhone: req.workPhone,
      staffType: req.staffType,
      primaryRole: req.primaryRole,
      employmentType: req.employmentType,
      employmentStatus: 'ACTIVE',
      joiningDate: req.joiningDate,
      professionalProfileRef: req.professionalProfileRef,
      credentialStatus: req.staffType === 'DOCTOR' || req.staffType === 'NURSE' ? 'PENDING' : 'VERIFIED',
      activeRoleScope: 'DEPARTMENT',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.staffList.push(staff);
    dept.staffCount += 1;

    // Automatically create initial role assignment
    const initialRole: StaffRoleAssignmentDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      staffId: staff.id,
      staffName: staff.fullName,
      roleCode: req.staffType === 'DOCTOR' ? 'ATTENDING_DOCTOR' : req.staffType === 'NURSE' ? 'STAFF_NURSE' : 'RECEPTIONIST',
      dataScope: 'DEPARTMENT',
      isPrimary: true,
      effectiveFrom: req.joiningDate,
      assignedBy: req.actorId,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.roleAssignments.push(initialRole);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      req.departmentId,
      staff.id,
      req.actorId,
      req.actorRole,
      'STAFF_ONBOARDED',
      'operational_staff',
      staff.staffCode,
      req.reason
    );
    return staff;
  }

  async updateStaff(req: UpdateOperationalStaffRequest): Promise<OperationalStaffDto> {
    const s = this.staffList.find((item) => item.id === req.staffId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Staff ${req.staffId} not found.`);
    }

    if (req.fullName) s.fullName = req.fullName;
    if (req.workEmail) s.workEmail = req.workEmail;
    if (req.workPhone) s.workPhone = req.workPhone;
    if (req.primaryRole) s.primaryRole = req.primaryRole;
    if (req.employmentType) s.employmentType = req.employmentType;
    if (req.professionalProfileRef) s.professionalProfileRef = req.professionalProfileRef;
    s.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      s.partnerId,
      s.organizationId,
      s.branchId,
      s.departmentId,
      s.id,
      req.actorId,
      req.actorRole,
      'STAFF_UPDATED',
      'operational_staff',
      s.staffCode,
      req.reason
    );
    return { ...s };
  }

  async changeStaffStatus(req: ChangeStaffStatusRequest): Promise<OperationalStaffDto> {
    const s = this.staffList.find((item) => item.id === req.staffId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Staff ${req.staffId} not found.`);
    }

    const previousStatus = s.employmentStatus;
    if (previousStatus === 'TERMINATED' && req.newStatus !== 'INVITED') {
      throw new Error(`[Lifecycle Violation] Terminated staff member cannot be transitioned to ${req.newStatus} without re-invitation.`);
    }

    s.employmentStatus = req.newStatus;
    s.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      s.partnerId,
      s.organizationId,
      s.branchId,
      s.departmentId,
      s.id,
      req.actorId,
      req.actorRole,
      `STAFF_STATUS_CHANGED_${previousStatus}_TO_${req.newStatus}`,
      'operational_staff',
      s.staffCode,
      req.reason
    );
    return { ...s };
  }

  async getRoleAssignments(tenantId: string, staffId?: string): Promise<StaffRoleAssignmentDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    if (staffId) {
      return this.roleAssignments.filter((r) => r.staffId === staffId);
    }
    return [...this.roleAssignments];
  }

  async assignStaffRole(req: AssignStaffRoleRequest): Promise<StaffRoleAssignmentDto> {
    const s = this.staffList.find((item) => item.id === req.staffId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Staff ${req.staffId} not found.`);
    }

    const assignment: StaffRoleAssignmentDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      staffId: req.staffId,
      staffName: s.fullName,
      roleCode: req.roleCode,
      dataScope: req.dataScope,
      isPrimary: req.isPrimary,
      effectiveFrom: req.effectiveFrom,
      effectiveTo: req.effectiveTo,
      assignedBy: req.actorId,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.roleAssignments.push(assignment);
    s.activeRoleScope = req.dataScope;

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      req.departmentId,
      s.id,
      req.actorId,
      req.actorRole,
      'ROLE_SCOPE_ASSIGNED',
      'staff_role_assignments',
      req.roleCode,
      req.reason
    );
    return assignment;
  }

  async getCredentials(tenantId: string, staffId?: string): Promise<StaffCredentialDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    if (staffId) {
      return this.credentials.filter((c) => c.staffId === staffId);
    }
    return [...this.credentials];
  }

  async addStaffCredential(req: AddStaffCredentialRequest): Promise<StaffCredentialDto> {
    const s = this.staffList.find((item) => item.id === req.staffId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Staff ${req.staffId} not found.`);
    }

    const cred: StaffCredentialDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      staffId: req.staffId,
      staffName: s.fullName,
      credentialType: req.credentialType,
      registrationNumber: req.registrationNumber,
      issuingAuthority: req.issuingAuthority,
      issueDate: req.issueDate,
      expiryDate: req.expiryDate,
      verificationStatus: 'PENDING',
      documentReference: req.documentReference,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.credentials.push(cred);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      s.branchId,
      s.departmentId,
      s.id,
      req.actorId,
      req.actorRole,
      'CREDENTIAL_SUBMITTED',
      'staff_credentials',
      cred.registrationNumber,
      req.reason
    );
    return cred;
  }

  async verifyStaffCredential(req: VerifyStaffCredentialRequest): Promise<StaffCredentialDto> {
    const cred = this.credentials.find((c) => c.id === req.credentialId && c.tenantId === req.tenantId);
    if (!cred) {
      throw new Error(`Credential ${req.credentialId} not found.`);
    }

    cred.verificationStatus = req.verificationStatus;
    cred.verificationReference = req.verificationReference ?? `ver-${Math.floor(1000 + Math.random() * 9000)}`;
    cred.verifiedBy = req.actorId;
    cred.verifiedAt = new Date().toISOString();
    cred.updatedAt = new Date().toISOString();

    const staffMember = this.staffList.find((s) => s.id === cred.staffId);
    if (staffMember) {
      staffMember.credentialStatus = req.verificationStatus;
    }

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      undefined,
      undefined,
      cred.staffId,
      req.actorId,
      req.actorRole,
      `CREDENTIAL_VERIFIED_${req.verificationStatus}`,
      'staff_credentials',
      cred.registrationNumber,
      req.reason
    );
    return { ...cred };
  }

  async getTransfers(tenantId: string, staffId?: string): Promise<StaffTransferDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    if (staffId) {
      return this.transfers.filter((t) => t.staffId === staffId);
    }
    return [...this.transfers];
  }

  async createStaffTransfer(req: CreateStaffTransferRequest): Promise<StaffTransferDto> {
    const s = this.staffList.find((item) => item.id === req.staffId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Staff ${req.staffId} not found.`);
    }

    const targetDept = this.departments.find(
      (d) => d.id === req.toDepartmentId && d.organizationId === req.toOrganizationId
    );
    if (!targetDept) {
      throw new Error(`[Hierarchy Violation] Target department ${req.toDepartmentId} does not belong to destination organization.`);
    }

    const transfer: StaffTransferDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      staffId: req.staffId,
      staffName: s.fullName,
      fromOrganizationId: s.organizationId,
      fromOrganizationName: s.organizationName,
      toOrganizationId: req.toOrganizationId,
      toOrganizationName: s.organizationName,
      fromBranchId: s.branchId,
      fromBranchName: s.branchName,
      toBranchId: req.toBranchId,
      toBranchName: 'Target Branch Facility',
      fromDepartmentId: s.departmentId,
      fromDepartmentName: s.departmentName,
      toDepartmentId: req.toDepartmentId,
      toDepartmentName: targetDept.departmentName,
      transferType: req.transferType,
      transferStatus: 'COMPLETED',
      effectiveDate: req.effectiveDate,
      authorizedBy: req.actorId,
      justification: req.reason,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.transfers.push(transfer);

    // Update staff location
    s.organizationId = req.toOrganizationId;
    s.branchId = req.toBranchId;
    s.departmentId = req.toDepartmentId;
    s.departmentName = targetDept.departmentName;
    s.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.toOrganizationId,
      req.toBranchId,
      req.toDepartmentId,
      s.id,
      req.actorId,
      req.actorRole,
      `STAFF_TRANSFERRED_${req.transferType}`,
      'staff_transfers',
      s.staffCode,
      req.reason
    );
    return transfer;
  }

  async getAuditTraces(req: QueryStaffAuditRequest): Promise<OperationalStaffAuditTraceDto[]> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }
    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.branchId && t.branchId !== req.branchId) return false;
      if (req.staffId && t.staffId !== req.staffId) return false;
      return true;
    });
  }
}

export const staffAdministrationService = new StaffAdministrationService();
