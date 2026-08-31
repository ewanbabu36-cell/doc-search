import { z } from 'zod';

/**
 * Phase 2.2 Enums: Staff Administration & Department Hierarchy
 */

export const OperationalStaffTypeEnum = z.enum([
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'LAB_TECHNICIAN',
  'PHARMACIST',
  'BILLING_OFFICER',
  'ADMINISTRATIVE',
  'OPERATIONAL_SUPPORT'
]);
export type OperationalStaffType = z.infer<typeof OperationalStaffTypeEnum>;

export const OperationalEmploymentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'VISITING_CONSULTANT',
  'INTERN'
]);
export type OperationalEmploymentType = z.infer<typeof OperationalEmploymentTypeEnum>;

export const OperationalStaffStatusEnum = z.enum([
  'INVITED',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TRANSFERRED',
  'TERMINATED'
]);
export type OperationalStaffStatus = z.infer<typeof OperationalStaffStatusEnum>;

export const OperationalDepartmentStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'RESTRUCTURED']);
export type OperationalDepartmentStatus = z.infer<typeof OperationalDepartmentStatusEnum>;

export const StaffRoleCodeEnum = z.enum([
  'CLINICAL_DIRECTOR',
  'CHIEF_MEDICAL_OFFICER',
  'HEAD_OF_DEPARTMENT',
  'ATTENDING_DOCTOR',
  'CONSULTANT_PHYSICIAN',
  'CHARGE_NURSE',
  'STAFF_NURSE',
  'FRONT_DESK_LEAD',
  'RECEPTIONIST',
  'LAB_DIRECTOR',
  'SENIOR_LAB_TECH',
  'CHIEF_PHARMACIST',
  'DISPENSING_PHARMACIST',
  'BILLING_MANAGER',
  'CASHIER_BILLING_OFFICER'
]);
export type StaffRoleCode = z.infer<typeof StaffRoleCodeEnum>;

export const StaffDataScopeEnum = z.enum([
  'COMPANY',
  'PARTNER',
  'ORGANIZATION',
  'BRANCH',
  'DEPARTMENT',
  'ASSIGNED',
  'SELF'
]);
export type StaffDataScope = z.infer<typeof StaffDataScopeEnum>;

export const StaffCredentialTypeEnum = z.enum([
  'MEDICAL_LICENSE',
  'SPECIALTY_BOARD_CERTIFICATION',
  'NURSING_LICENSE',
  'PHARMACY_LICENSE',
  'LAB_TECH_CERTIFICATE',
  'BLS_ACLS_CERTIFICATE',
  'DEA_REGISTRATION'
]);
export type StaffCredentialType = z.infer<typeof StaffCredentialTypeEnum>;

export const StaffCredentialVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'EXPIRED',
  'REVOKED'
]);
export type StaffCredentialVerificationStatus = z.infer<
  typeof StaffCredentialVerificationStatusEnum
>;

export const StaffTransferTypeEnum = z.enum([
  'DEPARTMENT_TRANSFER',
  'BRANCH_TRANSFER',
  'ORGANIZATION_TRANSFER',
  'TEMPORARY_SECONDMENT'
]);
export type StaffTransferType = z.infer<typeof StaffTransferTypeEnum>;

export const StaffTransferStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'COMPLETED',
  'CANCELLED'
]);
export type StaffTransferStatus = z.infer<typeof StaffTransferStatusEnum>;

/**
 * Phase 2.2 DTOs
 */

export const OperationalDepartmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentCode: z.string().min(1),
  departmentName: z.string().min(1),
  parentDepartmentId: z.string().uuid().optional(),
  parentDepartmentName: z.string().optional(),
  departmentHeadId: z.string().optional(),
  departmentHeadName: z.string().optional(),
  costCenterCode: z.string().optional(),
  status: OperationalDepartmentStatusEnum,
  staffCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalDepartmentDto = z.infer<typeof OperationalDepartmentDtoSchema>;

export const OperationalStaffDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  staffCode: z.string().min(1),
  fullName: z.string().min(1),
  workEmail: z.string().email(),
  workPhone: z.string().optional(),
  staffType: OperationalStaffTypeEnum,
  primaryRole: z.string().min(1),
  employmentType: OperationalEmploymentTypeEnum,
  employmentStatus: OperationalStaffStatusEnum,
  joiningDate: z.string().datetime(),
  professionalProfileRef: z.string().optional(),
  credentialStatus: StaffCredentialVerificationStatusEnum.default('PENDING'),
  activeRoleScope: StaffDataScopeEnum.default('BRANCH'),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type OperationalStaffDto = z.infer<typeof OperationalStaffDtoSchema>;

export const StaffRoleAssignmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  staffId: z.string().uuid(),
  staffName: z.string().optional(),
  roleCode: StaffRoleCodeEnum,
  dataScope: StaffDataScopeEnum,
  isPrimary: z.boolean().default(true),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  assignedBy: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type StaffRoleAssignmentDto = z.infer<typeof StaffRoleAssignmentDtoSchema>;

export const StaffCredentialDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  staffId: z.string().uuid(),
  staffName: z.string().optional(),
  credentialType: StaffCredentialTypeEnum,
  registrationNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  verificationStatus: StaffCredentialVerificationStatusEnum,
  verificationReference: z.string().optional(),
  documentReference: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type StaffCredentialDto = z.infer<typeof StaffCredentialDtoSchema>;

export const StaffTransferDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  staffId: z.string().uuid(),
  staffName: z.string().optional(),
  fromOrganizationId: z.string().uuid(),
  fromOrganizationName: z.string().optional(),
  toOrganizationId: z.string().uuid(),
  toOrganizationName: z.string().optional(),
  fromBranchId: z.string().uuid(),
  fromBranchName: z.string().optional(),
  toBranchId: z.string().uuid(),
  toBranchName: z.string().optional(),
  fromDepartmentId: z.string().uuid(),
  fromDepartmentName: z.string().optional(),
  toDepartmentId: z.string().uuid(),
  toDepartmentName: z.string().optional(),
  transferType: StaffTransferTypeEnum,
  transferStatus: StaffTransferStatusEnum,
  effectiveDate: z.string().datetime(),
  authorizedBy: z.string().min(1),
  justification: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type StaffTransferDto = z.infer<typeof StaffTransferDtoSchema>;

export const OperationalStaffAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  action: z.string().min(1),
  targetEntity: z.string().min(1),
  targetEntityId: z.string().min(1),
  justification: z.string().min(1),
  operationStatus: z.enum(['SUCCESS', 'FAILURE', 'DENIED']),
  correlationId: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime()
});
export type OperationalStaffAuditTraceDto = z.infer<
  typeof OperationalStaffAuditTraceDtoSchema
>;

export const StaffAdministrationOverviewDtoSchema = z.object({
  totalStaffCount: z.number().int().nonnegative(),
  activeStaffCount: z.number().int().nonnegative(),
  onLeaveStaffCount: z.number().int().nonnegative(),
  suspendedStaffCount: z.number().int().nonnegative(),
  totalDepartmentsCount: z.number().int().nonnegative(),
  credentialExpiryAlertsCount: z.number().int().nonnegative(),
  pendingVerificationsCount: z.number().int().nonnegative(),
  totalTransfersCount: z.number().int().nonnegative()
});
export type StaffAdministrationOverviewDto = z.infer<
  typeof StaffAdministrationOverviewDtoSchema
>;

/**
 * Phase 2.2 Mutation & Query Requests
 */

export const CreateOperationalDepartmentRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentCode: z.string().min(2),
  departmentName: z.string().min(2),
  parentDepartmentId: z.string().uuid().optional(),
  departmentHeadId: z.string().optional(),
  departmentHeadName: z.string().optional(),
  costCenterCode: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateOperationalDepartmentRequest = z.infer<
  typeof CreateOperationalDepartmentRequestSchema
>;

export const UpdateOperationalDepartmentRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  departmentHeadId: z.string().optional(),
  departmentHeadName: z.string().optional(),
  costCenterCode: z.string().optional(),
  status: OperationalDepartmentStatusEnum.optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalDepartmentRequest = z.infer<
  typeof UpdateOperationalDepartmentRequestSchema
>;

export const CreateOperationalStaffRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  staffCode: z.string().min(2),
  fullName: z.string().min(2),
  workEmail: z.string().email(),
  workPhone: z.string().optional(),
  staffType: OperationalStaffTypeEnum,
  primaryRole: z.string().min(2),
  employmentType: OperationalEmploymentTypeEnum,
  joiningDate: z.string().datetime(),
  professionalProfileRef: z.string().optional(),
  reason: z.string().min(3)
});
export type CreateOperationalStaffRequest = z.infer<
  typeof CreateOperationalStaffRequestSchema
>;

export const UpdateOperationalStaffRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  staffId: z.string().uuid(),
  fullName: z.string().optional(),
  workEmail: z.string().email().optional(),
  workPhone: z.string().optional(),
  primaryRole: z.string().optional(),
  employmentType: OperationalEmploymentTypeEnum.optional(),
  professionalProfileRef: z.string().optional(),
  reason: z.string().min(3)
});
export type UpdateOperationalStaffRequest = z.infer<
  typeof UpdateOperationalStaffRequestSchema
>;

export const ChangeStaffStatusRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  staffId: z.string().uuid(),
  newStatus: OperationalStaffStatusEnum,
  reason: z.string().min(3)
});
export type ChangeStaffStatusRequest = z.infer<
  typeof ChangeStaffStatusRequestSchema
>;

export const AssignStaffRoleRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  staffId: z.string().uuid(),
  roleCode: StaffRoleCodeEnum,
  dataScope: StaffDataScopeEnum,
  isPrimary: z.boolean().default(true),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  reason: z.string().min(3)
});
export type AssignStaffRoleRequest = z.infer<
  typeof AssignStaffRoleRequestSchema
>;

export const AddStaffCredentialRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  staffId: z.string().uuid(),
  credentialType: StaffCredentialTypeEnum,
  registrationNumber: z.string().min(2),
  issuingAuthority: z.string().min(2),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  documentReference: z.string().optional(),
  reason: z.string().min(3)
});
export type AddStaffCredentialRequest = z.infer<
  typeof AddStaffCredentialRequestSchema
>;

export const VerifyStaffCredentialRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  credentialId: z.string().uuid(),
  verificationStatus: StaffCredentialVerificationStatusEnum,
  verificationReference: z.string().optional(),
  reason: z.string().min(3)
});
export type VerifyStaffCredentialRequest = z.infer<
  typeof VerifyStaffCredentialRequestSchema
>;

export const CreateStaffTransferRequestSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  staffId: z.string().uuid(),
  toOrganizationId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  toDepartmentId: z.string().uuid(),
  transferType: StaffTransferTypeEnum,
  effectiveDate: z.string().datetime(),
  reason: z.string().min(3)
});
export type CreateStaffTransferRequest = z.infer<
  typeof CreateStaffTransferRequestSchema
>;

export const QueryStaffAuditRequestSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  pageIndex: z.number().int().nonnegative().default(0),
  pageSize: z.number().int().positive().default(50)
});
export type QueryStaffAuditRequest = z.infer<
  typeof QueryStaffAuditRequestSchema
>;
