import { staffAdministrationRepository } from '../../repositories/partner/StaffAdministrationRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { partnerOnboardingRepository, toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { entitlementService } from '../company/EntitlementService.js';
import { AppError } from '@docsearch/shared-core';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  operationalStaff,
  staffRoleAssignments,
  partnerProfiles,
  eq,
  and
} from '@docsearch/database';
import { realAuthService } from '../core/RealAuthService.js';
import type {
  CreateOperationalDepartmentRequest,
  UpdateOperationalDepartmentRequest,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';

export const ROLE_REQUIRED_MODULE_MAP: Record<string, string> = {
  INSURANCE_CLAIMS_MANAGER: 'TPA_INSURANCE',
  BILLING_MANAGER: 'TPA_INSURANCE',
  CASHIER_BILLING_OFFICER: 'TPA_INSURANCE',
  CHIEF_PHARMACIST: 'PHARMACY_POS',
  DISPENSING_PHARMACIST: 'PHARMACY_POS',
  PHARMACY_INVENTORY_CONTROLLER: 'PHARMACY_POS',
  PHARMACY_BILLING_CLERK: 'PHARMACY_POS',
  WHOLESALE_PHARMACIST: 'PHARMACY_WHOLESALE',
  WHOLESALE_OPERATIONS_MANAGER: 'PHARMACY_WHOLESALE',
  WAREHOUSE_INVENTORY_CONTROLLER: 'PHARMACY_WHOLESALE',
  DISTRIBUTION_BILLING_OFFICER: 'PHARMACY_WHOLESALE',
  DRUG_COMPLIANCE_OFFICER: 'PHARMACY_WHOLESALE',
  LAB_DIRECTOR: 'PATHOLOGY_LIMS',
  PATHOLOGIST: 'PATHOLOGY_LIMS',
  SENIOR_LAB_TECH: 'PATHOLOGY_LIMS',
  LAB_TECHNICIAN: 'PATHOLOGY_LIMS',
  PHLEBOTOMIST: 'PATHOLOGY_LIMS',
  SAMPLE_ACCESSION_OFFICER: 'PATHOLOGY_LIMS',
  RADIOLOGIST: 'RADIOLOGY_PACS',
  CHIEF_RADIOLOGIST: 'RADIOLOGY_PACS',
  RADIOLOGY_TECH: 'RADIOLOGY_PACS',
  PACS_ADMINISTRATOR: 'RADIOLOGY_PACS',
  MODALITY_TECHNICIAN: 'RADIOLOGY_PACS',
  CLINICAL_DIRECTOR: 'CLINICAL_EMR',
  CHIEF_MEDICAL_OFFICER: 'CLINICAL_EMR',
  HEAD_OF_DEPARTMENT: 'CLINICAL_EMR',
  ATTENDING_DOCTOR: 'CLINICAL_EMR',
  CONSULTANT_PHYSICIAN: 'CLINICAL_EMR',
  RESIDENT_DOCTOR: 'CLINICAL_EMR',
  MEDICAL_OFFICER: 'CLINICAL_EMR',
  CHARGE_NURSE: 'CLINICAL_EMR',
  STAFF_NURSE: 'CLINICAL_EMR'
};

export const VALID_PARTNER_STAFF_ROLES = new Set<string>([
  ...Object.keys(ROLE_REQUIRED_MODULE_MAP),
  'PARTNER_ADMIN',
  'HOSPITAL_ADMIN',
  'CLINIC_ADMIN',
  'OWNER',
  'FACILITY_ADMIN',
  'OPERATIONS_MANAGER',
  'RECEPTIONIST',
  'FRONT_DESK_EXECUTIVE',
  'COMPLIANCE_COORDINATOR',
  'HR_COORDINATOR',
  'DOCTOR',
  'NURSE',
  'PHARMACIST',
  'ADMIN'
]);

const HQ_FORBIDDEN_ROLES = new Set<string>([
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'COMPLIANCE_OFFICER',
  'HQ_ADMIN',
  'PLATFORM_ADMIN',
  'SECURITY_AUDITOR'
]);

const DOCTOR_SEAT_ROLES = new Set<string>([
  'CLINICAL_DIRECTOR',
  'CHIEF_MEDICAL_OFFICER',
  'HEAD_OF_DEPARTMENT',
  'ATTENDING_DOCTOR',
  'CONSULTANT_PHYSICIAN',
  'RESIDENT_DOCTOR',
  'MEDICAL_OFFICER',
  'RADIOLOGIST',
  'CHIEF_RADIOLOGIST',
  'PATHOLOGIST',
  'LAB_DIRECTOR',
  'DOCTOR'
]);

export const PROFILE_ALLOWED_ROLES_MAP: Record<string, Set<string>> = {
  PATHOLOGY: new Set([
    'LAB_DIRECTOR',
    'PATHOLOGIST',
    'SENIOR_LAB_TECH',
    'LAB_TECHNICIAN',
    'PHLEBOTOMIST',
    'SAMPLE_ACCESSION_OFFICER',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'RECEPTIONIST',
    'FRONT_DESK_EXECUTIVE',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'INSURANCE_CLAIMS_MANAGER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  PHARMACY: new Set([
    'CHIEF_PHARMACIST',
    'DISPENSING_PHARMACIST',
    'PHARMACY_INVENTORY_CONTROLLER',
    'PHARMACY_BILLING_CLERK',
    'PHARMACIST',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  PHARMACY_WHOLESALE: new Set([
    'CHIEF_PHARMACIST',
    'PHARMACY_INVENTORY_CONTROLLER',
    'PHARMACY_BILLING_CLERK',
    'PHARMACIST',
    'WHOLESALE_PHARMACIST',
    'WHOLESALE_OPERATIONS_MANAGER',
    'WAREHOUSE_INVENTORY_CONTROLLER',
    'DISTRIBUTION_BILLING_OFFICER',
    'DRUG_COMPLIANCE_OFFICER',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  PHARMACY_HYBRID: new Set([
    'CHIEF_PHARMACIST',
    'DISPENSING_PHARMACIST',
    'PHARMACY_INVENTORY_CONTROLLER',
    'PHARMACY_BILLING_CLERK',
    'PHARMACIST',
    'WHOLESALE_PHARMACIST',
    'WHOLESALE_OPERATIONS_MANAGER',
    'WAREHOUSE_INVENTORY_CONTROLLER',
    'DISTRIBUTION_BILLING_OFFICER',
    'DRUG_COMPLIANCE_OFFICER',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  RESTRICTED: new Set([]),
  DIAGNOSTIC_CENTRE: new Set([
    'RADIOLOGIST',
    'CHIEF_RADIOLOGIST',
    'RADIOLOGY_TECH',
    'PACS_ADMINISTRATOR',
    'MODALITY_TECHNICIAN',
    'LAB_DIRECTOR',
    'PATHOLOGIST',
    'SENIOR_LAB_TECH',
    'LAB_TECHNICIAN',
    'PHLEBOTOMIST',
    'SAMPLE_ACCESSION_OFFICER',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'RECEPTIONIST',
    'FRONT_DESK_EXECUTIVE',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'INSURANCE_CLAIMS_MANAGER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  CLINIC: new Set([
    'CLINICAL_DIRECTOR',
    'CHIEF_MEDICAL_OFFICER',
    'HEAD_OF_DEPARTMENT',
    'ATTENDING_DOCTOR',
    'CONSULTANT_PHYSICIAN',
    'RESIDENT_DOCTOR',
    'MEDICAL_OFFICER',
    'CHARGE_NURSE',
    'STAFF_NURSE',
    'DOCTOR',
    'NURSE',
    'PARTNER_ADMIN',
    'FACILITY_ADMIN',
    'OPERATIONS_MANAGER',
    'RECEPTIONIST',
    'FRONT_DESK_EXECUTIVE',
    'BILLING_MANAGER',
    'CASHIER_BILLING_OFFICER',
    'INSURANCE_CLAIMS_MANAGER',
    'COMPLIANCE_COORDINATOR',
    'HR_COORDINATOR',
    'ADMIN'
  ]),
  HOSPITAL: VALID_PARTNER_STAFF_ROLES
};

// Per-tenant mutex lock to serialize staff creation and prevent concurrent doctor seat quota bypass
const tenantStaffCreationLocks = new Map<string, Promise<unknown>>();

async function withTenantStaffLock<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const previous = tenantStaffCreationLocks.get(tenantId) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current, () => current);
  tenantStaffCreationLocks.set(tenantId, chained);

  await previous.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (tenantStaffCreationLocks.get(tenantId) === chained) {
      tenantStaffCreationLocks.delete(tenantId);
    }
  }
}

function isDoctorRoleOrType(primaryRole?: string, staffType?: string): boolean {
  const normRole = String(primaryRole || '').toUpperCase().trim();
  const normType = String(staffType || '').toUpperCase().trim();
  return normType === 'DOCTOR' || DOCTOR_SEAT_ROLES.has(normRole);
}

function isActiveStaffStatus(status?: string): boolean {
  const norm = String(status || 'ACTIVE').toUpperCase().trim();
  return norm === 'ACTIVE';
}

export class StaffAdministrationService {
  private async resolvePartnerProfile(session: SessionContext): Promise<string | null> {
    const rawOperatingModel = String((session as any).operatingModel || '').toUpperCase().trim();
    if (rawOperatingModel === 'WHOLESALE_ONLY') {
      return 'PHARMACY_WHOLESALE';
    }
    if (rawOperatingModel === 'HYBRID') {
      return 'PHARMACY_HYBRID';
    }

    const rawSessionProfile =
      (session as any).facilityType ||
      (session as any).organizationType ||
      (session as any).partnerCategory ||
      (session as any).profileType;
    if (rawSessionProfile) {
      return this.normalizeProfile(String(rawSessionProfile), rawOperatingModel);
    }

    const tenantId = session.tenantId;
    const actorEmail = (session.actorEmail || (session as any).email || '').toLowerCase().trim();

    if (tenantId) {
      const db = getDatabase();
      if (db) {
        try {
          const [prof] = await db
            .select()
            .from(partnerProfiles)
            .where(eq(partnerProfiles.tenantId, tenantId))
            .limit(1);
          if (prof) {
            const pMeta = (prof.metadata as Record<string, any>) || {};
            const opModel = String(prof.operatingModel || pMeta['operatingModel'] || rawOperatingModel || '').toUpperCase().trim();
            if (opModel === 'WHOLESALE_ONLY') return 'PHARMACY_WHOLESALE';
            if (opModel === 'HYBRID') return 'PHARMACY_HYBRID';
            const profType = pMeta['partnerType'] || pMeta['facilityType'] || pMeta['organizationType'];
            if (profType) {
              return this.normalizeProfile(String(profType), opModel);
            }
          }
        } catch {}
      }

      const queue = await partnerOnboardingRepository.getVerificationQueue();
      const staged = queue.find((q: any) => {
        const qEmail = (q.details?.['Registered Email'] || q.details?.['Applicant Email'] || q.contactEmail || '').toLowerCase().trim();
        const qDetId = qEmail ? toDeterministicUuid(`tenant-${qEmail}`) : null;
        return q.tenantDraftId === tenantId || qDetId === tenantId || (actorEmail && qEmail === actorEmail);
      });
      if (staged) {
        const sAny = staged as any;
        const stagedOpModel = String(sAny.operatingModel || sAny.details?.['Operating Model'] || rawOperatingModel || '').toUpperCase().trim();
        if (stagedOpModel === 'WHOLESALE_ONLY') return 'PHARMACY_WHOLESALE';
        if (stagedOpModel === 'HYBRID') return 'PHARMACY_HYBRID';
        const rawType = sAny.type || sAny.partnerType || sAny.category || sAny.organizationType || sAny.details?.['Partner Category'] || sAny.details?.['Organization Type'];
        if (rawType) {
          return this.normalizeProfile(String(rawType), stagedOpModel);
        }
      }

      const lics = await licenseRepository.findByTenantId(tenantId);
      const lic = lics && lics.length > 0 ? lics[0] : null;
      if (lic) {
        const licOpModel = String((lic.metadata as any)?.operatingModel || rawOperatingModel || '').toUpperCase().trim();
        if (licOpModel === 'WHOLESALE_ONLY') return 'PHARMACY_WHOLESALE';
        if (licOpModel === 'HYBRID') return 'PHARMACY_HYBRID';
        const hint = `${lic.planId || ''} ${(lic as any).productId || ''} ${(lic.metadata as any)?.partnerType || ''} ${(lic.metadata as any)?.facilityType || ''} ${(lic.metadata as any)?.organizationType || ''}`.toUpperCase();
        if (
          hint.includes(toDeterministicUuid('plan-pharma-wholesale-free-yr1').toUpperCase()) ||
          hint.includes(toDeterministicUuid('plan-pharma-wholesale-annual-yr2').toUpperCase()) ||
          hint.includes(toDeterministicUuid('prod-pharma-wholesale').toUpperCase()) ||
          hint.includes('WHOLESALE')
        ) {
          return 'PHARMACY_WHOLESALE';
        }
        if (hint.includes(toDeterministicUuid('plan-radio-free-yr1').toUpperCase()) || hint.includes(toDeterministicUuid('plan-radio-annual-yr2').toUpperCase()) || hint.includes('DIAGNOSTIC_CENTRE') || hint.includes('RADIO')) {
          return 'DIAGNOSTIC_CENTRE';
        }
        if (hint.includes(toDeterministicUuid('prod-pathology').toUpperCase()) || (hint.includes('PATH') && !hint.includes('COMBO'))) {
          return 'PATHOLOGY';
        }
        if (hint.includes(toDeterministicUuid('prod-pharmacy').toUpperCase()) || (hint.includes('PHARM') && !hint.includes('COMBO'))) {
          return 'PHARMACY';
        }
        if (hint.includes(toDeterministicUuid('prod-clinic').toUpperCase()) || hint.includes('CLINIC')) {
          return 'CLINIC';
        }
        if (hint.includes(toDeterministicUuid('prod-hospital').toUpperCase()) || hint.includes('HOSPITAL')) {
          return 'HOSPITAL';
        }
      }
    }

    return null;
  }

  private normalizeProfile(raw: string, operatingModel?: string): string {
    const norm = raw.toUpperCase().trim();
    const op = String(operatingModel || '').toUpperCase().trim();
    if (op === 'WHOLESALE_ONLY') return 'PHARMACY_WHOLESALE';
    if (op === 'HYBRID' && (norm.includes('PHARM') || norm.includes('CHEMIST') || norm.includes('DRUG') || norm.includes('WHOLESALE') || norm.includes('STOCKIST'))) {
      return 'PHARMACY_HYBRID';
    }
    if (norm.includes('WHOLESALE') || norm.includes('STOCKIST') || norm.includes('DISTRIBUTOR')) return 'PHARMACY_WHOLESALE';
    if (norm.includes('HYBRID') && (norm.includes('PHARM') || norm.includes('DRUG'))) return 'PHARMACY_HYBRID';
    if (norm.includes('DIAGNOSTIC') || norm.includes('RADIOLOGY') || norm.includes('IMAGING')) return 'DIAGNOSTIC_CENTRE';
    if (norm.includes('PATHOLOGY') || norm.includes('LAB')) return 'PATHOLOGY';
    if (norm.includes('PHARMACY') || norm.includes('CHEMIST') || norm.includes('DRUG')) return 'PHARMACY';
    if (norm.includes('CLINIC') || norm.includes('POLYCLINIC') || norm.includes('DAY_CARE')) return 'CLINIC';
    if (norm.includes('HOSPITAL')) return 'HOSPITAL';
    return norm;
  }

  private async validateRoleAndEntitlementAndProfile(
    roleCode: string,
    session: SessionContext
  ): Promise<void> {
    const normRole = String(roleCode || '').toUpperCase().trim();
    if (!normRole) {
      throw AppError.badRequest('Staff primaryRole / roleCode is required.');
    }

    if (HQ_FORBIDDEN_ROLES.has(normRole)) {
      throw AppError.forbidden(`Role '${normRole}' is a restricted HQ platform role and cannot be assigned to partner staff.`);
    }

    if (!VALID_PARTNER_STAFF_ROLES.has(normRole)) {
      throw AppError.badRequest(`Invalid staff role '${normRole}'. Role is not recognized in the partner governance catalog.`);
    }

    if (!session.isSuperAdmin && session.tenantId) {
      // 1. Validate partner profile compatibility
      const profile = await this.resolvePartnerProfile(session);
      let requiredModule = ROLE_REQUIRED_MODULE_MAP[normRole];
      if (
        profile === 'PHARMACY_WHOLESALE' &&
        requiredModule === 'PHARMACY_POS' &&
        normRole !== 'DISPENSING_PHARMACIST'
      ) {
        requiredModule = 'PHARMACY_WHOLESALE';
      }

      if (profile && PROFILE_ALLOWED_ROLES_MAP[profile]) {
        const allowedForProfile = PROFILE_ALLOWED_ROLES_MAP[profile];
        if (!allowedForProfile.has(normRole)) {
          // Allow only if the partner has an active combo plan that explicitly grants the required module
          const entitledViaCombo = requiredModule ? await entitlementService.canAccess(session, requiredModule) : false;
          if (
            !entitledViaCombo ||
            profile === 'PATHOLOGY' ||
            profile === 'PHARMACY' ||
            profile === 'PHARMACY_WHOLESALE' ||
            profile === 'PHARMACY_HYBRID' ||
            profile === 'DIAGNOSTIC_CENTRE'
          ) {
            throw AppError.forbidden(
              `Role '${normRole}' is incompatible with partner facility profile '${profile}'.`
            );
          }
        }
      }

      // 2. Validate ROLE_REQUIRED_MODULE_MAP commercial plan entitlement
      if (requiredModule) {
        let entitled = await entitlementService.canAccess(session, requiredModule);
        if (
          !entitled &&
          profile === 'PHARMACY_HYBRID' &&
          requiredModule === 'PHARMACY_POS' &&
          normRole !== 'DISPENSING_PHARMACIST'
        ) {
          entitled = await entitlementService.canAccess(session, 'PHARMACY_WHOLESALE');
        }
        if (!entitled) {
          throw AppError.forbidden(
            `Cannot assign role '${normRole}': Required module '${requiredModule}' is not included in your organization's active subscription plan.`
          );
        }
      } else {
        // Even for general roles, ensure the partner has active commercial access (not PENDING/REJECTED/LOCKED/SUSPENDED)
        const baselineEntitled = await entitlementService.canAccess(session, 'STAFF');
        if (!baselineEntitled) {
          throw AppError.forbidden(
            `Cannot create or assign staff role '${normRole}': Organization does not have an active commercial subscription or license.`
          );
        }
      }
    }
  }

  private async enforceDoctorSeatQuotaIfApplicable(
    primaryRole: string | undefined,
    staffType: string | undefined,
    employmentStatus: string | undefined,
    session: SessionContext,
    tx?: any,
    excludeStaffId?: string
  ): Promise<void> {
    if (session.isSuperAdmin || !session.tenantId) return;
    if (!isDoctorRoleOrType(primaryRole, staffType)) return;
    if (!isActiveStaffStatus(employmentStatus)) return;

    const existingStaff = await staffAdministrationRepository.getStaff(session.tenantId, {}, tx);
    const roleAssignments = await staffAdministrationRepository.getRoleAssignments(session.tenantId, undefined, tx);
    const staffIdsWithAssignedDoctorRole = new Set<string>(
      roleAssignments
        .filter((ra: any) => isDoctorRoleOrType(ra.roleCode, undefined))
        .map((ra: any) => String(ra.staffId))
    );

    const activeDoctors = existingStaff.filter((s: any) => {
      if (excludeStaffId && s.id === excludeStaffId) return false;
      const status = s.employmentStatus || s.status || 'ACTIVE';
      if (!isActiveStaffStatus(status)) return false;
      return isDoctorRoleOrType(s.primaryRole, s.staffType) || staffIdsWithAssignedDoctorRole.has(String(s.id));
    });

    const limitCheck = await entitlementService.checkDoctorLimit(session.tenantId, activeDoctors.length);
    if (!limitCheck.allowed || activeDoctors.length >= limitCheck.maxAllowed) {
      throw AppError.forbidden(
        `Doctor seat quota exceeded (${activeDoctors.length}/${limitCheck.maxAllowed} active doctor seats used). Please upgrade your subscription plan or deactivate an existing doctor seat.`
      );
    }
  }

  async getOverview(session: SessionContext, partnerId?: string, organizationId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getOverview(session.tenantId, partnerId, organizationId, tx);
    });
  }

  async getDepartments(session: SessionContext, partnerId?: string, organizationId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getDepartments(session.tenantId, partnerId, organizationId, tx);
    });
  }

  async createDepartment(input: Omit<CreateOperationalDepartmentRequest, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dept = await staffAdministrationRepository.createDepartment(
        {
          ...input,
          tenantId: session.tenantId,
          partnerId: input.partnerId,
          organizationId: input.organizationId,
          branchId: input.branchId || session.branchId
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'DEPARTMENT_CREATED',
          resourceType: 'operational_department',
          resourceId: dept.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { departmentCode: dept.departmentCode, departmentName: dept.departmentName }
        },
        session,
        tx
      );

      return dept;
    });
  }

  async updateDepartment(departmentId: string, patch: Partial<UpdateOperationalDepartmentRequest>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const dept = await staffAdministrationRepository.updateDepartment(session.tenantId, departmentId, patch, tx);
      if (dept) {
        await auditRepository.recordEvent(
          {
            eventType: 'DEPARTMENT_UPDATED',
            resourceType: 'operational_department',
            resourceId: dept.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { departmentCode: dept.departmentCode, departmentName: dept.departmentName }
          },
          session,
          tx
        );
      }
      return dept;
    });
  }

  async getStaff(
    session: SessionContext,
    filters: {
      partnerId?: string;
      organizationId?: string;
      branchId?: string;
      departmentId?: string;
      staffType?: string;
      status?: string;
    } = {}
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getStaff(session.tenantId, filters, tx);
    });
  }

  async getStaffById(session: SessionContext, staffId: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getStaffById(session.tenantId, staffId, tx);
    });
  }

  async createStaff(input: Omit<CreateOperationalStaffRequest, 'tenantId'> & { tenantId?: string }, session: SessionContext) {
    if (!session.isSuperAdmin && input.tenantId && input.tenantId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant staff creation is strictly prohibited.');
    }

    const lockKey = session.tenantId || 'global';
    return withTenantStaffLock(lockKey, async () => {
      await this.validateRoleAndEntitlementAndProfile(input.primaryRole, session);

      return withSecurityContext(getDatabase(), session, async (tx) => {
        await this.enforceDoctorSeatQuotaIfApplicable(
          input.primaryRole,
          input.staffType,
          (input as any).employmentStatus || (input as any).status || 'ACTIVE',
          session,
          tx
        );

        const staff = await staffAdministrationRepository.createStaff(
          {
            ...input,
            tenantId: session.tenantId,
            actorId: session.userId,
            actorRole: session.roles?.[0] || 'ADMIN'
          },
          tx
        );

        await auditRepository.recordEvent(
          {
            eventType: 'STAFF_CREATED',
            resourceType: 'operational_staff',
            resourceId: staff.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { staffCode: staff.staffCode, fullName: staff.fullName, primaryRole: staff.primaryRole }
          },
          session,
          tx
        );

        return staff;
      });
    });
  }

  async updateStaff(staffId: string, input: Omit<UpdateOperationalStaffRequest, 'tenantId'> & { tenantId?: string }, session: SessionContext) {
    if (!session.isSuperAdmin && input.tenantId && input.tenantId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant staff update is strictly prohibited.');
    }

    const lockKey = session.tenantId || 'global';
    return withTenantStaffLock(lockKey, async () => {
      if (input.primaryRole) {
        await this.validateRoleAndEntitlementAndProfile(input.primaryRole, session);
      }

      return withSecurityContext(getDatabase(), session, async (tx) => {
        const existing = await staffAdministrationRepository.getStaffById(session.tenantId, staffId, tx);
        if (!existing) {
          throw AppError.forbidden('Access denied: Target staff member does not exist in authenticated tenant.');
        }

        // Section 18 Invariant: Prevent Self-Role Escalation
        const isSelf =
          existing.id === session.userId ||
          (Boolean(session.actorEmail && existing.workEmail) && session.actorEmail.toLowerCase() === existing.workEmail.toLowerCase()) ||
          Boolean((existing.metadata as any)?.userId && (existing.metadata as any)?.userId === session.userId);

        if (
          !session.isSuperAdmin &&
          !session.roles.includes('COMPANY_ADMIN') &&
          input.primaryRole &&
          input.primaryRole !== existing.primaryRole &&
          isSelf
        ) {
          throw AppError.forbidden('Self-role escalation is strictly prohibited: users cannot modify their own role.');
        }

        if (input.primaryRole || (input as any).staffType) {
          await this.enforceDoctorSeatQuotaIfApplicable(
            input.primaryRole || existing.primaryRole,
            (input as any).staffType || existing.staffType,
            (input as any).employmentStatus || existing.employmentStatus || 'ACTIVE',
            session,
            tx,
            staffId
          );
        }

        const staff = await staffAdministrationRepository.updateStaff(
          staffId,
          {
            ...input,
            tenantId: session.tenantId
          },
          tx
        );

        await auditRepository.recordEvent(
          {
            eventType: 'STAFF_UPDATED',
            resourceType: 'operational_staff',
            resourceId: staff.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { staffCode: staff.staffCode, fullName: staff.fullName }
          },
          session,
          tx
        );

        return staff;
      });
    });
  }

  async changeStaffStatus(input: Omit<ChangeStaffStatusRequest, 'tenantId'>, session: SessionContext) {
    const lockKey = session.tenantId || 'global';
    return withTenantStaffLock(lockKey, async () => {
      return withSecurityContext(getDatabase(), session, async (tx) => {
        const existing = await staffAdministrationRepository.getStaffById(session.tenantId, input.staffId, tx);
        if (!existing) {
          throw AppError.forbidden('Access denied: Target staff member does not exist in authenticated tenant.');
        }

        if (isActiveStaffStatus(input.newStatus)) {
          await this.enforceDoctorSeatQuotaIfApplicable(
            existing.primaryRole,
            existing.staffType,
            input.newStatus,
            session,
            tx,
            input.staffId
          );
        }

        const staff = await staffAdministrationRepository.changeStaffStatus(
          {
            ...input,
            tenantId: session.tenantId
          },
          tx
        );

        await auditRepository.recordEvent(
          {
            eventType: 'STAFF_STATUS_CHANGED',
            resourceType: 'operational_staff',
            resourceId: staff.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { newStatus: input.newStatus, reason: input.reason }
          },
          session,
          tx
        );

        return staff;
      });
    });
  }

  async getRoleAssignments(session: SessionContext, staffId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getRoleAssignments(session.tenantId, staffId, tx);
    });
  }

  async assignStaffRole(input: Omit<AssignStaffRoleRequest, 'tenantId'> & { tenantId?: string }, session: SessionContext) {
    if (!session.isSuperAdmin && input.tenantId && input.tenantId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant staff role assignment is strictly prohibited.');
    }

    const lockKey = session.tenantId || 'global';
    return withTenantStaffLock(lockKey, async () => {
      await this.validateRoleAndEntitlementAndProfile(input.roleCode, session);

      return withSecurityContext(getDatabase(), session, async (tx) => {
        const targetStaff = await staffAdministrationRepository.getStaffById(session.tenantId, input.staffId, tx);
        if (!targetStaff) {
          throw AppError.forbidden('Access denied: Cannot assign role to a staff member outside your authenticated tenant.');
        }

        // Section 18 Invariant: Prevent Self-Role Escalation
        const isSelf =
          targetStaff.id === session.userId ||
          (Boolean(session.actorEmail && targetStaff.workEmail) && session.actorEmail.toLowerCase() === targetStaff.workEmail.toLowerCase()) ||
          Boolean((targetStaff.metadata as any)?.userId && (targetStaff.metadata as any)?.userId === session.userId);

        if (
          !session.isSuperAdmin &&
          !session.roles.includes('COMPANY_ADMIN') &&
          isSelf
        ) {
          throw AppError.forbidden('Self-role escalation is strictly prohibited: users cannot assign roles to themselves.');
        }

        // Administrative role assignment restriction
        const adminRoles = ['OWNER', 'HOSPITAL_ADMIN', 'PARTNER_ADMIN', 'CLINIC_ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'];
        if (
          adminRoles.includes(input.roleCode) &&
          !session.isSuperAdmin &&
          !session.roles.some((r) => adminRoles.includes(String(r)))
        ) {
          throw AppError.forbidden('Privilege escalation denied: Only administrative staff can assign administrative roles.');
        }

        await this.enforceDoctorSeatQuotaIfApplicable(
          input.roleCode,
          undefined,
          targetStaff.employmentStatus || 'ACTIVE',
          session,
          tx,
          input.staffId
        );

        const role = await staffAdministrationRepository.assignStaffRole(
          {
            ...input,
            tenantId: session.tenantId,
            actorId: session.userId,
            actorRole: session.roles?.[0] || 'ADMIN'
          },
          tx
        );

        await auditRepository.recordEvent(
          {
            eventType: 'STAFF_ROLE_ASSIGNED',
            resourceType: 'staff_role_assignment',
            resourceId: role.id,
            tenantId: session.tenantId,
            branchId: session.branchId,
            metadata: { staffId: role.staffId, roleCode: role.roleCode, dataScope: role.dataScope }
          },
          session,
          tx
        );

        return role;
      });
    });
  }

  async getCredentials(session: SessionContext, staffId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getCredentials(session.tenantId, staffId, tx);
    });
  }

  async addCredential(input: Omit<AddStaffCredentialRequest, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const targetStaff = await staffAdministrationRepository.getStaffById(session.tenantId, input.staffId, tx);
      if (!targetStaff) {
        throw AppError.forbidden('Access denied: Cannot add credential to a staff member outside your authenticated tenant.');
      }

      const cred = await staffAdministrationRepository.addCredential(
        {
          ...input,
          tenantId: session.tenantId,
          actorId: session.userId,
          actorRole: session.roles?.[0] || 'ADMIN'
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'STAFF_CREDENTIAL_ADDED',
          resourceType: 'staff_credential',
          resourceId: cred.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { staffId: cred.staffId, credentialType: cred.credentialType }
        },
        session,
        tx
      );

      return cred;
    });
  }

  async verifyCredential(credentialId: string, session: SessionContext, verificationRef?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const existingCreds = await staffAdministrationRepository.getCredentials(session.tenantId, undefined, tx);
      const targetCred = existingCreds.find((c: any) => c.id === credentialId);
      if (!targetCred) {
        throw AppError.notFound(`Credential ${credentialId} not found in authenticated tenant`);
      }
      if (targetCred.staffId === session.userId) {
        throw AppError.forbidden('Maker-Checker violation: Staff member cannot verify their own credential.');
      }

      const cred = await staffAdministrationRepository.verifyCredential(
        session.tenantId,
        credentialId,
        session.userId || 'VERIFIER',
        verificationRef,
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'STAFF_CREDENTIAL_VERIFIED',
          resourceType: 'staff_credential',
          resourceId: cred.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: { staffId: cred.staffId, credentialType: cred.credentialType, verificationStatus: cred.verificationStatus }
        },
        session,
        tx
      );

      return cred;
    });
  }

  async getTransfers(session: SessionContext, staffId?: string) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return staffAdministrationRepository.getTransfers(session.tenantId, staffId, tx);
    });
  }

  async createTransfer(input: Omit<CreateStaffTransferRequest, 'tenantId'>, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const targetStaff = await staffAdministrationRepository.getStaffById(session.tenantId, input.staffId, tx);
      if (!targetStaff) {
        throw AppError.forbidden('Access denied: Cannot transfer a staff member outside your authenticated tenant.');
      }

      const transfer = await staffAdministrationRepository.createTransfer(
        {
          ...input,
          tenantId: session.tenantId,
          actorId: session.userId,
          actorRole: session.roles?.[0] || 'ADMIN'
        },
        tx
      );

      await auditRepository.recordEvent(
        {
          eventType: 'STAFF_TRANSFERRED',
          resourceType: 'staff_transfer',
          resourceId: transfer.id,
          tenantId: session.tenantId,
          branchId: session.branchId,
          metadata: {
            staffId: transfer.staffId,
            toDepartmentId: transfer.toDepartmentId
          }
        },
        session,
        tx
      );

      return transfer;
    });
  }

  /**
   * CAP-06: Atomic Partner Profile Change -> Staff Role & Compliance Revalidation.
   * When a partner transitions facility profile (e.g., HOSPITAL -> PATHOLOGY, PHARMACY, CLINIC, DIAGNOSTIC_CENTRE),
   * re-evaluates all existing staff and role assignments against PROFILE_ALLOWED_ROLES_MAP[newProfile].
   * Any incompatible role assignment is revoked/restricted and stripped of effective access.
   */
  async revalidateStaffOnProfileChange(
    tenantId: string,
    newProfileRaw: string,
    session: SessionContext
  ): Promise<{
    previousProfile: string | null;
    newProfile: string;
    totalEvaluated: number;
    compatibleStaffIds: string[];
    restrictedStaffIds: string[];
    revokedRoleAssignmentIds: string[];
    complianceRevalidationRequired: boolean;
    requiredComplianceDocuments: string[];
  }> {
    const newProfile = this.normalizeProfile(String(newProfileRaw || ''));
    const allowedSet = PROFILE_ALLOWED_ROLES_MAP[newProfile];
    if (!allowedSet) {
      throw AppError.badRequest(
        `Invalid target partner facility profile '${newProfileRaw}'. Must be one of: ${Object.keys(PROFILE_ALLOWED_ROLES_MAP).join(', ')}.`
      );
    }

    return withTenantStaffLock(tenantId || 'global', async () => {
      const previousProfile = await this.resolvePartnerProfile(session);

      return withSecurityContext(getDatabase(), session, async (tx) => {
        const allStaff = await staffAdministrationRepository.getStaff(tenantId, {}, tx);
        const allAssignments = await staffAdministrationRepository.getRoleAssignments(tenantId, undefined, tx);

        const compatibleStaffIds: string[] = [];
        const restrictedStaffIds: string[] = [];
        const revokedRoleAssignmentIds: string[] = [];

        for (const s of allStaff) {
          const primaryRoleNorm = String(s.primaryRole || '').toUpperCase().trim();
          const staffAssigns = allAssignments.filter((ra: any) => String(ra.staffId) === String(s.id));
          const incompatibleAssigns = staffAssigns.filter(
            (ra: any) => !allowedSet.has(String(ra.roleCode || '').toUpperCase().trim())
          );
          const isPrimaryCompatible = primaryRoleNorm ? allowedSet.has(primaryRoleNorm) : true;

          if (!isPrimaryCompatible || incompatibleAssigns.length > 0) {
            restrictedStaffIds.push(String(s.id));

            // 1. Revoke incompatible role assignments
            for (const badRa of incompatibleAssigns) {
              revokedRoleAssignmentIds.push(String(badRa.id));
              try {
                if (tx && typeof tx.update === 'function') {
                  await tx
                    .update(staffRoleAssignments)
                    .set({
                      assignmentStatus: 'REVOKED' as any,
                      effectiveTo: new Date()
                    } as any)
                    .where(
                      and(
                        eq(staffRoleAssignments.tenantId, tenantId),
                        eq(staffRoleAssignments.id, badRa.id)
                      )
                    );
                }
              } catch {}
            }

            // 2. Restrict the operational_staff record so it cannot retain effective access
            try {
              await staffAdministrationRepository.changeStaffStatus(
                {
                  tenantId,
                  partnerId: String(s.partnerId || tenantId),
                  organizationId: String(s.organizationId || tenantId),
                  staffId: s.id,
                  newStatus: 'RESTRICTED' as any,
                  reason: `Role '${primaryRoleNorm}' is incompatible with new partner profile '${newProfile}' (CAP-06 Revalidation).`,
                  actorId: session.userId || 'SYSTEM',
                  actorRole: (session.roles?.[0] || 'ADMIN') as any
                },
                tx
              );
            } catch {}

            try {
              if (tx && typeof tx.update === 'function') {
                await tx
                  .update(operationalStaff)
                  .set({
                    employmentStatus: 'RESTRICTED',
                    metadata: {
                      ...(((s as any).metadata as Record<string, any>) || {}),
                      isAccessRevoked: true,
                      revalidationStatus: 'REQUIRES_REASSIGNMENT',
                      restrictedReason: `Incompatible role '${primaryRoleNorm}' for profile '${newProfile}'`
                    },
                    updatedAt: new Date()
                  })
                  .where(and(eq(operationalStaff.tenantId, tenantId), eq(operationalStaff.id, s.id)));
              }
            } catch {}

            // 3. Immediately strip effective authentication/session status in RealAuthService
            if (s.workEmail) {
              realAuthService.setPartnerUserStatus(s.workEmail, 'RESTRICTED');
            }
          } else {
            compatibleStaffIds.push(String(s.id));
          }
        }

        const profileComplianceDocsMap: Record<string, string[]> = {
          PATHOLOGY: ['CEA_LAB_LICENSE', 'BMW_AUTHORIZATION'],
          PHARMACY: ['DRUG_LICENSE_FORM_20_21', 'REGISTERED_PHARMACIST_CERT'],
          DIAGNOSTIC_CENTRE: ['AERB_RADIATION_LICENSE', 'PCPNDT_CERTIFICATE', 'CEA_LICENSE'],
          CLINIC: ['CLINICAL_ESTABLISHMENT_REG', 'STATE_MEDICAL_COUNCIL_REG'],
          HOSPITAL: ['CEA_HOSPITAL_LICENSE', 'FIRE_NOC', 'BMW_AUTHORIZATION', 'DRUG_LICENSE_FORM_20_21']
        };

        const requiredComplianceDocuments = profileComplianceDocsMap[newProfile] || ['CLINICAL_ESTABLISHMENT_REG'];

        await auditRepository.recordEvent(
          {
            eventType: 'PARTNER_PROFILE_STAFF_REVALIDATED',
            resourceType: 'partner_profile',
            resourceId: tenantId,
            tenantId,
            branchId: session.branchId,
            metadata: {
              previousProfile,
              newProfile,
              totalEvaluated: allStaff.length,
              compatibleCount: compatibleStaffIds.length,
              restrictedCount: restrictedStaffIds.length,
              restrictedStaffIds,
              revokedRoleAssignmentIds,
              requiredComplianceDocuments
            }
          },
          session,
          tx
        );

        return {
          previousProfile,
          newProfile,
          totalEvaluated: allStaff.length,
          compatibleStaffIds,
          restrictedStaffIds,
          revokedRoleAssignmentIds,
          complianceRevalidationRequired: true,
          requiredComplianceDocuments
        };
      });
    });
  }
}

export const staffAdministrationService = new StaffAdministrationService();
