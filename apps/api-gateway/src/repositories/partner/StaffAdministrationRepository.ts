import crypto from 'node:crypto';
import {
  getDatabase,
  tenants,
  partnerProfiles,
  operationalStaff,
  operationalDepartments,
  staffRoleAssignments,
  staffCredentials,
  staffTransfers,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  doctorProfiles,
  eq,
  and,
  desc
} from '@docsearch/database';
import type {
  OperationalDepartmentDto,
  OperationalStaffDto,
  StaffRoleAssignmentDto,
  StaffCredentialDto,
  StaffTransferDto,
  StaffAdministrationOverviewDto,
  CreateOperationalDepartmentRequest,
  UpdateOperationalDepartmentRequest,
  CreateOperationalStaffRequest,
  UpdateOperationalStaffRequest,
  ChangeStaffStatusRequest,
  AssignStaffRoleRequest,
  AddStaffCredentialRequest,
  CreateStaffTransferRequest
} from '@docsearch/api-contracts';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { entitlementService } from '../../services/company/EntitlementService.js';
import { realAuthService } from '../../services/core/RealAuthService.js';
import { sessionRevocationService } from '../../services/core/SessionRevocationService.js';
import { identitySecurityFoundationService } from '../../services/security/IdentitySecurityFoundationService.js';

const logger = createLogger('staff-admin-repository');

export interface StaffQueryFilters {
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  departmentId?: string | undefined;
  staffType?: string | undefined;
  status?: string | undefined;
}

export class StaffAdministrationRepository {
  public async ensureDefaults(dbClient: any, tenantId: string): Promise<{
    partnerId: string;
    organizationId: string;
    branchId: string;
  }> {
    const detHash = (seed: string): string => {
      const hex = crypto.createHash('sha256').update(seed).digest('hex');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    };

    let partnerId = detHash(`op-partner:${tenantId}`);
    let organizationId = detHash(`op-org:${tenantId}`);
    let branchId = detHash(`op-facility:${tenantId}:main`);

    try {
      // Load real partner profile metadata if available
      let profileRow: any = null;
      try {
        const [foundProfile] = await dbClient
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, tenantId))
          .limit(1);
        profileRow = foundProfile || null;
      } catch {}

      const rawType = String(profileRow?.partnerType || 'CLINIC').toUpperCase();
      const legalName = String(profileRow?.legalName || profileRow?.companyName || 'Partner Healthcare Facility');
      const contactEmail = String(profileRow?.primaryContactEmail || `admin@${tenantId.substring(0, 8).toLowerCase()}.partner.local`);
      const contactPhone = String(profileRow?.primaryContactPhone || '+91-9800000000');
      const addr = (profileRow?.address && typeof profileRow.address === 'object') ? profileRow.address : {};

      const resolvedPartnerType =
        rawType.includes('PATHOLOGY') || rawType.includes('DIAGNOSTIC')
          ? 'DIAGNOSTIC_NETWORK'
          : rawType.includes('PHARM')
          ? 'PHARMACY_ENTERPRISE'
          : rawType.includes('HOSPITAL')
          ? 'HOSPITAL_SYSTEM'
          : 'CLINIC_NETWORK';

      const resolvedOrgType =
        rawType.includes('PATHOLOGY') || rawType.includes('DIAGNOSTIC')
          ? 'DIAGNOSTIC_CENTER'
          : rawType.includes('PHARM')
          ? 'PHARMACY'
          : rawType.includes('HOSPITAL')
          ? 'HOSPITAL'
          : 'CLINIC';

      const resolvedFacilityType =
        rawType.includes('PATHOLOGY') || rawType.includes('DIAGNOSTIC')
          ? 'DIAGNOSTIC_CENTER'
          : rawType.includes('PHARM')
          ? 'PHARMACY_OUTLET'
          : rawType.includes('HOSPITAL')
          ? 'INPATIENT_HOSPITAL'
          : 'OUTPATIENT_CLINIC';

      // 0. Ensure tenant exists in core.tenants if dynamic
      try {
        const [existingT] = await dbClient
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.id, tenantId))
          .limit(1);
        if (!existingT) {
          await dbClient
            .insert(tenants)
            .values({
              id: tenantId,
              name: legalName,
              slug: `tenant-${tenantId.substring(0, 8).toLowerCase()}`,
              status: 'ACTIVE'
            })
            .onConflictDoNothing();
        }
      } catch {}

      const resolvedOperatingModel = String(
        profileRow?.operatingModel ||
          profileRow?.metadata?.operatingModel ||
          profileRow?.metadata?.operatingMode ||
          (rawType.includes('WHOLESALE')
            ? 'WHOLESALE_PHARMACY'
            : rawType.includes('PHARM')
            ? 'RETAIL_PHARMACY'
            : rawType.includes('PATHOLOGY') || rawType.includes('DIAGNOSTIC')
            ? 'DIAGNOSTIC_CENTER'
            : rawType.includes('HOSPITAL')
            ? 'HOSPITAL'
            : 'CLINIC')
      );

      const [p] = await dbClient
        .select({ id: operationalPartners.id })
        .from(operationalPartners)
        .where(eq(operationalPartners.tenantId, tenantId))
        .limit(1);
      if (p?.id) {
        partnerId = p.id;
      } else {
        try {
          await dbClient
            .insert(operationalPartners)
            .values({
              id: partnerId,
              tenantId,
              partnerCode: `PRT-${tenantId.substring(0, 8).toUpperCase()}`,
              legalBusinessName: legalName,
              partnerType: resolvedPartnerType,
              operatingModel: resolvedOperatingModel,
              contactEmail,
              contactPhone,
              status: 'ACTIVE',
              metadata: { sourcePartnerProfileId: profileRow?.id || null, rawPartnerType: rawType, operatingModel: resolvedOperatingModel }
            })
            .onConflictDoNothing();
        } catch {}
      }

      const [o] = await dbClient
        .select({ id: operationalOrganizations.id })
        .from(operationalOrganizations)
        .where(eq(operationalOrganizations.tenantId, tenantId))
        .limit(1);
      if (o?.id) {
        organizationId = o.id;
      } else {
        try {
          await dbClient
            .insert(operationalOrganizations)
            .values({
              id: organizationId,
              tenantId,
              partnerId,
              organizationCode: `ORG-${tenantId.substring(0, 8).toUpperCase()}`,
              organizationName: `${legalName} Operations`,
              organizationType: resolvedOrgType,
              operatingModel: resolvedOperatingModel,
              contactEmail,
              contactPhone,
              status: 'ACTIVE',
              metadata: { rawPartnerType: rawType, operatingModel: resolvedOperatingModel }
            })
            .onConflictDoNothing();
        } catch {}
      }

      const [b] = await dbClient
        .select({ id: operationalFacilities.id })
        .from(operationalFacilities)
        .where(eq(operationalFacilities.tenantId, tenantId))
        .limit(1);
      if (b?.id) {
        branchId = b.id;
      } else {
        try {
          await dbClient
            .insert(operationalFacilities)
            .values({
              id: branchId,
              tenantId,
              partnerId,
              organizationId,
              facilityCode: `LOC-${tenantId.substring(0, 8).toUpperCase()}-MAIN`,
              facilityName: `${legalName} - Primary Location`,
              facilityType: resolvedFacilityType,
              addressStreet: String(addr.street || addr.line1 || 'Primary Healthcare Campus'),
              addressCity: String(addr.city || 'Patna'),
              addressState: String(addr.state || 'Bihar'),
              addressPostalCode: String(addr.postalCode || addr.pincode || '800001'),
              addressCountry: String(addr.country || 'IN'),
              contactEmail,
              contactPhone,
              status: 'ACTIVE',
              metadata: { isPrimaryLocation: true, rawPartnerType: rawType }
            })
            .onConflictDoNothing();
        } catch {}
      }
    } catch {
      // Keep deterministic tenant-isolated IDs
    }

    return { partnerId, organizationId, branchId };
  }

  // --- OVERVIEW ---
  async getOverview(
    tenantId: string,
    partnerId?: string | undefined,
    organizationId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StaffAdministrationOverviewDto> {
    if (!dbClient) {
      return {
        totalStaffCount: 0,
        activeStaffCount: 0,
        onLeaveStaffCount: 0,
        suspendedStaffCount: 0,
        totalDepartmentsCount: 0,
        credentialExpiryAlertsCount: 0,
        pendingVerificationsCount: 0,
        totalTransfersCount: 0
      };
    }

    try {
      const staffList = await this.getStaff(tenantId, { partnerId, organizationId }, dbClient);
      const depts = await this.getDepartments(tenantId, partnerId, organizationId, dbClient);
      const creds = await this.getCredentials(tenantId, undefined, dbClient);
      const transfers = await this.getTransfers(tenantId, undefined, dbClient);

      return {
        totalStaffCount: staffList.length,
        activeStaffCount: staffList.filter((s) => s.employmentStatus === 'ACTIVE').length,
        onLeaveStaffCount: staffList.filter((s) => s.employmentStatus === 'ON_LEAVE').length,
        suspendedStaffCount: staffList.filter((s) => s.employmentStatus === 'SUSPENDED').length,
        totalDepartmentsCount: depts.length,
        credentialExpiryAlertsCount: 0,
        pendingVerificationsCount: creds.filter((c) => c.verificationStatus === 'PENDING').length,
        totalTransfersCount: transfers.length
      };
    } catch (err) {
      logger.error('Failed to query staff administration overview', err);
      return {
        totalStaffCount: 0,
        activeStaffCount: 0,
        onLeaveStaffCount: 0,
        suspendedStaffCount: 0,
        totalDepartmentsCount: 0,
        credentialExpiryAlertsCount: 0,
        pendingVerificationsCount: 0,
        totalTransfersCount: 0
      };
    }
  }

  // --- DEPARTMENTS ---
  async getDepartments(
    tenantId: string,
    partnerId?: string | undefined,
    organizationId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<OperationalDepartmentDto[]> {
    if (!dbClient) return [];

    try {
      const conditions = [eq(operationalDepartments.tenantId, tenantId)];
      if (partnerId) conditions.push(eq(operationalDepartments.partnerId, partnerId));
      if (organizationId) conditions.push(eq(operationalDepartments.organizationId, organizationId));

      const rows = await dbClient
        .select()
        .from(operationalDepartments)
        .where(and(...conditions))
        .orderBy(desc(operationalDepartments.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        branchId: r.branchId || undefined,
        departmentCode: r.departmentCode,
        departmentName: r.departmentName,
        parentDepartmentId: r.parentDepartmentId || undefined,
        parentDepartmentName: undefined,
        departmentHeadId: r.departmentHeadId || undefined,
        departmentHeadName: r.departmentHeadName || undefined,
        costCenterCode: r.costCenterCode || undefined,
        status: (r.status as any) || 'ACTIVE',
        staffCount: 0,
        metadata: (r.metadata as Record<string, unknown>) || {},
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
      }));
    } catch (err) {
      logger.error('Failed to get operational departments', err);
      return [];
    }
  }

  async createDepartment(
    req: CreateOperationalDepartmentRequest,
    dbClient = getDatabase()
  ): Promise<OperationalDepartmentDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for department creation',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const defaults = await this.ensureDefaults(dbClient, req.tenantId);
    let partnerId = req.partnerId || defaults.partnerId;
    if (partnerId) {
      try {
        const [p] = await dbClient
          .select({ id: operationalPartners.id })
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, req.tenantId), eq(operationalPartners.id, partnerId)))
          .limit(1);
        if (!p) {
          partnerId = defaults.partnerId;
        }
      } catch {
        partnerId = defaults.partnerId;
      }
    }

    let organizationId = req.organizationId || defaults.organizationId;
    if (organizationId) {
      try {
        const [o] = await dbClient
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(and(eq(operationalOrganizations.tenantId, req.tenantId), eq(operationalOrganizations.id, organizationId)))
          .limit(1);
        if (!o) {
          organizationId = defaults.organizationId;
        }
      } catch {
        organizationId = defaults.organizationId;
      }
    }

    let branchId = req.branchId || defaults.branchId;
    if (branchId) {
      try {
        const [fac] = await dbClient
          .select({ id: operationalFacilities.id })
          .from(operationalFacilities)
          .where(and(eq(operationalFacilities.tenantId, req.tenantId), eq(operationalFacilities.id, branchId)))
          .limit(1);
        if (!fac) {
          branchId = defaults.branchId;
        }
      } catch {
        branchId = defaults.branchId;
      }
    }

    const [created] = await dbClient
      .insert(operationalDepartments)
      .values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentCode: req.departmentCode,
        departmentName: req.departmentName,
        parentDepartmentId: req.parentDepartmentId || null,
        departmentHeadId: req.departmentHeadId || null,
        departmentHeadName: req.departmentHeadName || null,
        costCenterCode: req.costCenterCode || null,
        status: 'ACTIVE',
        metadata: {}
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to insert department record',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    return {
      id: created.id,
      tenantId: created.tenantId,
      partnerId: created.partnerId,
      organizationId: created.organizationId,
      branchId: created.branchId || undefined,
      departmentCode: created.departmentCode,
      departmentName: created.departmentName,
      parentDepartmentId: created.parentDepartmentId || undefined,
      departmentHeadId: created.departmentHeadId || undefined,
      departmentHeadName: created.departmentHeadName || undefined,
      costCenterCode: created.costCenterCode || undefined,
      status: (created.status as any) || 'ACTIVE',
      staffCount: 0,
      metadata: (created.metadata as Record<string, unknown>) || {},
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
    };
  }

  async updateDepartment(
    tenantId: string,
    departmentId: string,
    patch: Partial<UpdateOperationalDepartmentRequest>,
    dbClient = getDatabase()
  ): Promise<OperationalDepartmentDto | null> {
    if (!dbClient) return null;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.departmentName !== undefined) updateData['departmentName'] = patch.departmentName;
    if (patch.departmentHeadId !== undefined) updateData['departmentHeadId'] = patch.departmentHeadId;
    if (patch.departmentHeadName !== undefined) updateData['departmentHeadName'] = patch.departmentHeadName;
    if (patch.costCenterCode !== undefined) updateData['costCenterCode'] = patch.costCenterCode;
    if (patch.status !== undefined) updateData['status'] = patch.status;

    try {
      const [updated] = await dbClient
        .update(operationalDepartments)
        .set(updateData)
        .where(and(eq(operationalDepartments.tenantId, tenantId), eq(operationalDepartments.id, departmentId)))
        .returning();

      if (!updated) return null;

      return {
        id: updated.id,
        tenantId: updated.tenantId,
        partnerId: updated.partnerId,
        organizationId: updated.organizationId,
        branchId: updated.branchId || undefined,
        departmentCode: updated.departmentCode,
        departmentName: updated.departmentName,
        parentDepartmentId: updated.parentDepartmentId || undefined,
        departmentHeadId: updated.departmentHeadId || undefined,
        departmentHeadName: updated.departmentHeadName || undefined,
        costCenterCode: updated.costCenterCode || undefined,
        status: (updated.status as any) || 'ACTIVE',
        staffCount: 0,
        metadata: (updated.metadata as Record<string, unknown>) || {},
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt)
      };
    } catch {
      return null;
    }
  }

  // --- STAFF MEMBERS ---
  async getStaff(
    tenantId: string,
    filters: StaffQueryFilters = {},
    dbClient = getDatabase()
  ): Promise<OperationalStaffDto[]> {
    if (!dbClient) return [];

    try {
      const conditions = [eq(operationalStaff.tenantId, tenantId)];
      if (filters.partnerId) conditions.push(eq(operationalStaff.partnerId, filters.partnerId));
      if (filters.organizationId) conditions.push(eq(operationalStaff.organizationId, filters.organizationId));
      if (filters.branchId) conditions.push(eq(operationalStaff.branchId, filters.branchId));
      if (filters.departmentId) conditions.push(eq(operationalStaff.departmentId, filters.departmentId));
      if (filters.staffType) conditions.push(eq(operationalStaff.staffType, filters.staffType));
      if (filters.status) conditions.push(eq(operationalStaff.employmentStatus, filters.status));

      const rows = await dbClient
        .select({
          staff: operationalStaff,
          deptName: operationalDepartments.departmentName
        })
        .from(operationalStaff)
        .leftJoin(operationalDepartments, eq(operationalStaff.departmentId, operationalDepartments.id))
        .where(and(...conditions))
        .orderBy(desc(operationalStaff.createdAt));

      const nonMockRows = rows.filter((r: any) => {
        const email = (r.staff?.workEmail || '').toLowerCase();
        const name = (r.staff?.fullName || '').toUpperCase();
        return !(
          email.includes('dr.alok') ||
          email.includes('dr.rajesh') ||
          email.includes('elena.rostova') ||
          email.includes('priya.patel') ||
          name.includes('ALOK SHARMA') ||
          name.includes('RAJESH SHARMA') ||
          name.includes('ELENA ROSTOVA') ||
          name.includes('PRIYA PATEL')
        );
      });

      if (nonMockRows.length > 0) {
        return nonMockRows.map((r: any) => ({
          id: r.staff.id,
          tenantId: r.staff.tenantId,
          partnerId: r.staff.partnerId,
          organizationId: r.staff.organizationId,
          branchId: r.staff.branchId,
          departmentId: r.staff.departmentId,
          departmentName: r.deptName || undefined,
          staffCode: r.staff.staffCode,
          fullName: r.staff.fullName,
          workEmail: r.staff.workEmail,
          workPhone: r.staff.workPhone || undefined,
          staffType: (r.staff.staffType as any) || 'DOCTOR',
          primaryRole: r.staff.primaryRole,
          employmentType: (r.staff.employmentType as any) || 'FULL_TIME',
          employmentStatus: (r.staff.employmentStatus as any) || 'ACTIVE',
          joiningDate: r.staff.joiningDate instanceof Date ? r.staff.joiningDate.toISOString() : String(r.staff.joiningDate),
          professionalProfileRef: r.staff.professionalProfileRef || undefined,
          credentialStatus: 'VERIFIED',
          activeRoleScope: 'BRANCH',
          metadata: (r.staff.metadata as Record<string, unknown>) || {},
          createdAt: r.staff.createdAt instanceof Date ? r.staff.createdAt.toISOString() : String(r.staff.createdAt),
          updatedAt: r.staff.updatedAt instanceof Date ? r.staff.updatedAt.toISOString() : String(r.staff.updatedAt)
        }));
      }

      return [];
    } catch (err) {
      logger.error('Failed to get operational staff', err);
      return [];
    }
  }

  async getStaffById(tenantId: string, staffId: string, dbClient = getDatabase()): Promise<OperationalStaffDto | null> {
    if (!dbClient) return null;

    try {
      const [row] = await dbClient
        .select({
          staff: operationalStaff,
          deptName: operationalDepartments.departmentName
        })
        .from(operationalStaff)
        .leftJoin(operationalDepartments, eq(operationalStaff.departmentId, operationalDepartments.id))
        .where(and(eq(operationalStaff.tenantId, tenantId), eq(operationalStaff.id, staffId)))
        .limit(1);

      if (!row) return null;

      return {
        id: row.staff.id,
        tenantId: row.staff.tenantId,
        partnerId: row.staff.partnerId,
        organizationId: row.staff.organizationId,
        branchId: row.staff.branchId,
        departmentId: row.staff.departmentId,
        departmentName: row.deptName || undefined,
        staffCode: row.staff.staffCode,
        fullName: row.staff.fullName,
        workEmail: row.staff.workEmail,
        workPhone: row.staff.workPhone || undefined,
        staffType: (row.staff.staffType as any) || 'DOCTOR',
        primaryRole: row.staff.primaryRole,
        employmentType: (row.staff.employmentType as any) || 'FULL_TIME',
        employmentStatus: (row.staff.employmentStatus as any) || 'ACTIVE',
        joiningDate: row.staff.joiningDate instanceof Date ? row.staff.joiningDate.toISOString() : String(row.staff.joiningDate),
        professionalProfileRef: row.staff.professionalProfileRef || undefined,
        credentialStatus: 'VERIFIED',
        activeRoleScope: 'BRANCH',
        metadata: (row.staff.metadata as Record<string, unknown>) || {},
        createdAt: row.staff.createdAt instanceof Date ? row.staff.createdAt.toISOString() : String(row.staff.createdAt),
        updatedAt: row.staff.updatedAt instanceof Date ? row.staff.updatedAt.toISOString() : String(row.staff.updatedAt)
      };
    } catch (err) {
      logger.error('Failed to get staff by id', err);
      return null;
    }
  }

  async createStaff(req: CreateOperationalStaffRequest, dbClient = getDatabase()): Promise<OperationalStaffDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for staff creation',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const defaults = await this.ensureDefaults(dbClient, req.tenantId);
    let partnerId = req.partnerId || defaults.partnerId;
    if (partnerId) {
      try {
        const [p] = await dbClient
          .select({ id: operationalPartners.id })
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, req.tenantId), eq(operationalPartners.id, partnerId)))
          .limit(1);
        if (!p) {
          partnerId = defaults.partnerId;
        }
      } catch {
        partnerId = defaults.partnerId;
      }
    }

    let organizationId = req.organizationId || defaults.organizationId;
    if (organizationId) {
      try {
        const [o] = await dbClient
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(and(eq(operationalOrganizations.tenantId, req.tenantId), eq(operationalOrganizations.id, organizationId)))
          .limit(1);
        if (!o) {
          organizationId = defaults.organizationId;
        }
      } catch {
        organizationId = defaults.organizationId;
      }
    }

    let branchId = req.branchId || defaults.branchId;
    if (branchId) {
      try {
        const [fac] = await dbClient
          .select({ id: operationalFacilities.id })
          .from(operationalFacilities)
          .where(and(eq(operationalFacilities.tenantId, req.tenantId), eq(operationalFacilities.id, branchId)))
          .limit(1);
        if (!fac) {
          branchId = defaults.branchId;
        }
      } catch {
        branchId = defaults.branchId;
      }
    }

    let departmentId = req.departmentId;
    if (!departmentId) {
      const depts = await this.getDepartments(req.tenantId, partnerId, organizationId, dbClient);
      if (depts.length > 0 && depts[0]?.id) {
        departmentId = depts[0].id;
      } else {
        const defaultDept = await this.createDepartment(
          {
            actorId: req.actorId || 'SYSTEM_ADMIN',
            actorRole: req.actorRole || 'HOSPITAL_ADMIN',
            tenantId: req.tenantId,
            partnerId,
            organizationId,
            branchId,
            departmentCode: `DEP-GEN-${req.tenantId.substring(0, 4).toUpperCase()}`,
            departmentName: 'General Clinical Services',
            reason: 'Auto-provisioned base operational department'
          },
          dbClient
        );
        departmentId = defaultDept.id;
      }
    }

    // Quota Enforcement: If creating a DOCTOR, enforce contracted doctor seat limit server-side
    if (req.staffType === 'DOCTOR') {
      const limitCheck = await entitlementService.checkDoctorLimit(req.tenantId);
      if (!limitCheck.allowed) {
        throw new AppError({
          message: `Doctor seat quota exceeded. Your contracted plan allows a maximum of ${limitCheck.maxAllowed} doctor seats (currently using ${limitCheck.currentCount}). Please upgrade your plan in HQ.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403,
          details: [
            {
              field: 'doctorSeats',
              message: `Current doctors: ${limitCheck.currentCount}, Maximum allowed: ${limitCheck.maxAllowed}`
            }
          ]
        });
      }
    }

    const staffMetadata = (req as any).metadata || {};
    const effectiveStaffCode = req.staffCode || `STF-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const effectiveWorkEmail = req.workEmail || (req as any).email || `${effectiveStaffCode.toLowerCase()}@facility.local`;
    const effectiveWorkPhone = req.workPhone || (req as any).phone || null;
    const effectiveJoiningDate = req.joiningDate ? new Date(req.joiningDate) : new Date();

    const [created] = await dbClient
      .insert(operationalStaff)
      .values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        staffCode: effectiveStaffCode,
        fullName: req.fullName,
        workEmail: effectiveWorkEmail,
        workPhone: effectiveWorkPhone,
        staffType: req.staffType || 'CLINICAL',
        primaryRole: req.primaryRole,
        employmentType: req.employmentType || 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        joiningDate: effectiveJoiningDate,
        professionalProfileRef: req.professionalProfileRef || null,
        metadata: staffMetadata
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to insert operational staff record',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    // Link doctorProfiles record if staff is a DOCTOR
    if (req.staffType === 'DOCTOR') {
      try {
        await dbClient.insert(doctorProfiles).values({
          id: created.id,
          tenantId: req.tenantId,
          partnerId,
          organizationId,
          branchId,
          departmentId,
          staffId: created.id,
          doctorCode: effectiveStaffCode,
          medicalLicenseNumber: staffMetadata.licenseNumber || req.professionalProfileRef || `REG-${effectiveStaffCode}`,
          qualification: staffMetadata.qualifications || req.professionalProfileRef || 'MBBS',
          primarySpecialty: staffMetadata.specialization || req.primaryRole || 'General Medicine',
          availabilityStatus: 'AVAILABLE',
          status: 'ACTIVE',
          metadata: staffMetadata
        });
      } catch (docErr) {
        logger.warn('Failed to link doctor profile during staff creation', { error: String(docErr) });
      }
    }

    // Also auto-create primary role assignment
    try {
      await dbClient.insert(staffRoleAssignments).values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId,
        staffId: created.id,
        roleCode: (req.primaryRole as any) || 'ATTENDING_DOCTOR',
        dataScope: 'BRANCH',
        isPrimary: 'TRUE',
        effectiveFrom: new Date(),
        assignedBy: req.actorId || 'SYSTEM_ADMIN',
        metadata: {}
      });
    } catch {
      // Best effort
    }

    // Automatically provision live login credential in realAuthService & users table
    try {
      const plainPassword = staffMetadata.password || '123456';
      const nameParts = req.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || req.fullName;
      const lastName = nameParts.slice(1).join(' ') || (staffMetadata.partnerCategory || 'Staff');
      const partnerCategory = staffMetadata.partnerCategory || (
        req.staffType === 'PHARMACIST' ? 'PHARMACY' :
        req.staffType === 'LAB_TECHNICIAN' ? 'PATHOLOGY' :
        req.staffType === 'DOCTOR' ? 'CLINIC' :
        'HOSPITAL'
      );

      let mappedRole: any = 'RECEPTIONIST';
      if (req.staffType === 'DOCTOR') mappedRole = 'DOCTOR';
      else if (req.staffType === 'PHARMACIST') mappedRole = 'PHARMACIST';
      else if (req.staffType === 'LAB_TECHNICIAN') mappedRole = 'LAB_DIRECTOR';
      else if (req.staffType === 'NURSE') mappedRole = 'STAFF_NURSE';
      else if (req.staffType === 'BILLING_OFFICER') mappedRole = 'CASHIER_BILLING_OFFICER';
      else if (req.staffType === 'ADMINISTRATIVE') mappedRole = 'HOSPITAL_ADMIN';

      realAuthService.registerPartnerUserCredential({
        email: req.workEmail,
        plainPassword,
        firstName,
        lastName,
        tenantName: (staffMetadata as any)?.facilityName || (staffMetadata as any)?.tenantName || 'Healthcare Facility',
        organizationType: partnerCategory,
        planTier: 'Staff Operations Suite',
        tenantId: req.tenantId,
        organizationId,
        branchId,
        roles: [mappedRole, 'HOSPITAL_ADMIN'],
        status: 'ACTIVE'
      });
    } catch (authErr) {
      logger.warn('Non-fatal staff credential provisioning note:', { error: String(authErr) });
    }

    return {
      id: created.id,
      tenantId: created.tenantId,
      partnerId: created.partnerId,
      organizationId: created.organizationId,
      branchId: created.branchId,
      departmentId: created.departmentId,
      staffCode: created.staffCode,
      fullName: created.fullName,
      workEmail: created.workEmail,
      workPhone: created.workPhone || undefined,
      staffType: (created.staffType as any) || 'DOCTOR',
      primaryRole: created.primaryRole,
      employmentType: (created.employmentType as any) || 'FULL_TIME',
      employmentStatus: (created.employmentStatus as any) || 'ACTIVE',
      joiningDate: created.joiningDate instanceof Date ? created.joiningDate.toISOString() : String(created.joiningDate),
      professionalProfileRef: created.professionalProfileRef || undefined,
      credentialStatus: 'PENDING',
      activeRoleScope: 'BRANCH',
      metadata: (created.metadata as Record<string, unknown>) || {},
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
    };
  }

  async updateStaff(
    staffId: string,
    req: UpdateOperationalStaffRequest,
    dbClient = getDatabase()
  ): Promise<OperationalStaffDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for staff update',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date()
    };
    if (req.fullName) updates['fullName'] = req.fullName;
    if (req.workEmail) updates['workEmail'] = req.workEmail;
    if (req.workPhone !== undefined) updates['workPhone'] = req.workPhone;
    if (req.primaryRole) updates['primaryRole'] = req.primaryRole;
    if (req.employmentType) updates['employmentType'] = req.employmentType;

    const [updated] = await dbClient
      .update(operationalStaff)
      .set(updates)
      .where(and(eq(operationalStaff.tenantId, req.tenantId), eq(operationalStaff.id, staffId)))
      .returning();

    if (!updated) {
      throw new AppError({
        message: `Staff member ${staffId} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      partnerId: updated.partnerId,
      organizationId: updated.organizationId,
      branchId: updated.branchId,
      departmentId: updated.departmentId,
      staffCode: updated.staffCode,
      fullName: updated.fullName,
      workEmail: updated.workEmail,
      workPhone: updated.workPhone || undefined,
      staffType: (updated.staffType as any) || 'DOCTOR',
      primaryRole: updated.primaryRole,
      employmentType: (updated.employmentType as any) || 'FULL_TIME',
      employmentStatus: (updated.employmentStatus as any) || 'ACTIVE',
      joiningDate: updated.joiningDate instanceof Date ? updated.joiningDate.toISOString() : String(updated.joiningDate),
      credentialStatus: 'VERIFIED',
      activeRoleScope: 'BRANCH',
      metadata: (updated.metadata as Record<string, unknown>) || {},
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt)
    };
  }

  async changeStaffStatus(
    req: ChangeStaffStatusRequest,
    dbClient = getDatabase()
  ): Promise<OperationalStaffDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for status change',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const [updated] = await dbClient
      .update(operationalStaff)
      .set({
        employmentStatus: req.newStatus,
        updatedAt: new Date()
      })
      .where(and(eq(operationalStaff.tenantId, req.tenantId), eq(operationalStaff.id, req.staffId)))
      .returning();

    if (!updated) {
      throw new AppError({
        message: `Staff member ${req.staffId} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    try {
      if (req.newStatus === 'SUSPENDED' || req.newStatus === 'TERMINATED') {
        realAuthService.setPartnerUserStatus(updated.workEmail, 'SUSPENDED');
        await sessionRevocationService.revokeUser(updated.id, `Staff member status changed to ${req.newStatus}`, req.actorId || 'SYSTEM');
        if (updated.workEmail) {
          await sessionRevocationService.revokeUser(updated.workEmail, `Staff member status changed to ${req.newStatus}`, req.actorId || 'SYSTEM');
        }
        identitySecurityFoundationService.setStaffRuntimeState({
          partnerId: req.tenantId,
          staffId: updated.id,
          staffStatus: req.newStatus === 'SUSPENDED' ? 'SUSPENDED' : 'INACTIVE'
        });
      } else if (req.newStatus === 'ACTIVE') {
        realAuthService.activatePartnerUserCredential(updated.workEmail);
        identitySecurityFoundationService.setStaffRuntimeState({
          partnerId: req.tenantId,
          staffId: updated.id,
          staffStatus: 'ACTIVE'
        });
      }
      identitySecurityFoundationService.invalidateSecurityCache(req.tenantId, undefined, updated.id);
    } catch {
      // Non-fatal status sync
    }

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      partnerId: updated.partnerId,
      organizationId: updated.organizationId,
      branchId: updated.branchId,
      departmentId: updated.departmentId,
      staffCode: updated.staffCode,
      fullName: updated.fullName,
      workEmail: updated.workEmail,
      workPhone: updated.workPhone || undefined,
      staffType: (updated.staffType as any) || 'DOCTOR',
      primaryRole: updated.primaryRole,
      employmentType: (updated.employmentType as any) || 'FULL_TIME',
      employmentStatus: (updated.employmentStatus as any) || 'ACTIVE',
      joiningDate: updated.joiningDate instanceof Date ? updated.joiningDate.toISOString() : String(updated.joiningDate),
      credentialStatus: 'VERIFIED',
      activeRoleScope: 'BRANCH',
      metadata: (updated.metadata as Record<string, unknown>) || {},
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt)
    };
  }

  // --- ROLES & ASSIGNMENTS ---
  async getRoleAssignments(
    tenantId: string,
    staffId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StaffRoleAssignmentDto[]> {
    if (!dbClient) return [];

    try {
      const conditions = [eq(staffRoleAssignments.tenantId, tenantId)];
      if (staffId) conditions.push(eq(staffRoleAssignments.staffId, staffId));

      const rows = await dbClient
        .select()
        .from(staffRoleAssignments)
        .where(and(...conditions))
        .orderBy(desc(staffRoleAssignments.createdAt));

      const nowMs = Date.now();

      return rows.map((r: any) => {
        const fromMs = r.effectiveFrom ? new Date(r.effectiveFrom).getTime() : 0;
        const toMs = r.effectiveTo ? new Date(r.effectiveTo).getTime() : null;
        const isFuture = fromMs > nowMs;
        const isExpired = toMs !== null && toMs <= nowMs;
        const isEffectiveNow = !isFuture && !isExpired;
        const temporalStatus = isFuture ? 'FUTURE' : isExpired ? 'EXPIRED' : 'ACTIVE';

        return {
          id: r.id,
          tenantId: r.tenantId,
          partnerId: r.partnerId,
          organizationId: r.organizationId,
          branchId: r.branchId || undefined,
          departmentId: r.departmentId || undefined,
          staffId: r.staffId,
          roleCode: (r.roleCode as any) || 'ATTENDING_DOCTOR',
          dataScope: (r.dataScope as any) || 'BRANCH',
          isPrimary: r.isPrimary === 'TRUE' || r.isPrimary === true,
          effectiveFrom: r.effectiveFrom instanceof Date ? r.effectiveFrom.toISOString() : String(r.effectiveFrom),
          effectiveTo: r.effectiveTo ? (r.effectiveTo instanceof Date ? r.effectiveTo.toISOString() : String(r.effectiveTo)) : undefined,
          assignedBy: r.assignedBy,
          isEffectiveNow,
          temporalStatus,
          metadata: {
            ...((r.metadata as Record<string, unknown>) || {}),
            isEffectiveNow,
            temporalStatus
          },
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
        } as any;
      });
    } catch (err) {
      logger.error('Failed to get role assignments', err);
      return [];
    }
  }

  /**
   * Evaluates temporal RBAC invariants for a staff member/user:
   * effective_from <= NOW AND (effective_to IS NULL OR effective_to > NOW)
   */
  async evaluateStaffTemporalAccess(
    tenantId: string,
    staffIdOrEmail: string,
    now = new Date(),
    dbClient = getDatabase()
  ): Promise<{
    hasAssignments: boolean;
    activeRoles: string[];
    expiredRoles: string[];
    futureRoles: string[];
    isAccessAllowed: boolean;
    denialReason?: string;
  }> {
    if (!dbClient || !tenantId || !staffIdOrEmail) {
      return {
        hasAssignments: false,
        activeRoles: [],
        expiredRoles: [],
        futureRoles: [],
        isAccessAllowed: true
      };
    }

    try {
      let targetStaffId = staffIdOrEmail;
      if (staffIdOrEmail.includes('@')) {
        const [staffRow] = await dbClient
          .select({ id: operationalStaff.id })
          .from(operationalStaff)
          .where(
            and(
              eq(operationalStaff.tenantId, tenantId),
              eq(operationalStaff.workEmail, staffIdOrEmail.toLowerCase().trim())
            )
          )
          .limit(1);
        if (staffRow?.id) {
          targetStaffId = staffRow.id;
        } else {
          return {
            hasAssignments: false,
            activeRoles: [],
            expiredRoles: [],
            futureRoles: [],
            isAccessAllowed: true
          };
        }
      }

      const rows = await dbClient
        .select()
        .from(staffRoleAssignments)
        .where(
          and(
            eq(staffRoleAssignments.tenantId, tenantId),
            eq(staffRoleAssignments.staffId, targetStaffId)
          )
        );

      if (!rows || rows.length === 0) {
        return {
          hasAssignments: false,
          activeRoles: [],
          expiredRoles: [],
          futureRoles: [],
          isAccessAllowed: true
        };
      }

      const nowMs = now.getTime();
      const activeRoles: string[] = [];
      const expiredRoles: string[] = [];
      const futureRoles: string[] = [];

      for (const r of rows) {
        const roleCode = String(r.roleCode || '').toUpperCase().trim();
        const fromMs = r.effectiveFrom ? new Date(r.effectiveFrom).getTime() : 0;
        const toMs = r.effectiveTo ? new Date(r.effectiveTo).getTime() : null;

        if (fromMs > nowMs) {
          futureRoles.push(roleCode);
        } else if (toMs !== null && toMs <= nowMs) {
          expiredRoles.push(roleCode);
        } else {
          activeRoles.push(roleCode);
        }
      }

      if (activeRoles.length === 0) {
        const denialReason =
          expiredRoles.length > 0
            ? `Access denied: Assigned role (${expiredRoles.join(', ')}) has expired (effective_to <= NOW).`
            : `Access denied: Assigned role (${futureRoles.join(', ')}) is not yet effective (effective_from > NOW).`;
        return {
          hasAssignments: true,
          activeRoles,
          expiredRoles,
          futureRoles,
          isAccessAllowed: false,
          denialReason
        };
      }

      return {
        hasAssignments: true,
        activeRoles,
        expiredRoles,
        futureRoles,
        isAccessAllowed: true
      };
    } catch {
      return {
        hasAssignments: false,
        activeRoles: [],
        expiredRoles: [],
        futureRoles: [],
        isAccessAllowed: true
      };
    }
  }

  async assignStaffRole(
    req: AssignStaffRoleRequest,
    dbClient = getDatabase()
  ): Promise<StaffRoleAssignmentDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for role assignment',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const defaults = await this.ensureDefaults(dbClient, req.tenantId);
    let partnerId = req.partnerId || defaults.partnerId;
    if (partnerId) {
      try {
        const [p] = await dbClient
          .select({ id: operationalPartners.id })
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, req.tenantId), eq(operationalPartners.id, partnerId)))
          .limit(1);
        if (!p) {
          partnerId = defaults.partnerId;
        }
      } catch {
        partnerId = defaults.partnerId;
      }
    }

    let organizationId = req.organizationId || defaults.organizationId;
    if (organizationId) {
      try {
        const [o] = await dbClient
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(and(eq(operationalOrganizations.tenantId, req.tenantId), eq(operationalOrganizations.id, organizationId)))
          .limit(1);
        if (!o) {
          organizationId = defaults.organizationId;
        }
      } catch {
        organizationId = defaults.organizationId;
      }
    }

    let branchId = req.branchId || defaults.branchId;
    if (branchId) {
      try {
        const [fac] = await dbClient
          .select({ id: operationalFacilities.id })
          .from(operationalFacilities)
          .where(and(eq(operationalFacilities.tenantId, req.tenantId), eq(operationalFacilities.id, branchId)))
          .limit(1);
        if (!fac) {
          branchId = defaults.branchId;
        }
      } catch {
        branchId = defaults.branchId;
      }
    }

    const [created] = await dbClient
      .insert(staffRoleAssignments)
      .values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        organizationId,
        branchId,
        departmentId: req.departmentId || null,
        staffId: req.staffId,
        roleCode: req.roleCode,
        dataScope: req.dataScope,
        isPrimary: req.isPrimary ? 'TRUE' : 'FALSE',
        effectiveFrom: new Date(req.effectiveFrom),
        effectiveTo: req.effectiveTo ? new Date(req.effectiveTo) : null,
        assignedBy: req.actorId || 'ADMIN',
        metadata: {}
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to insert role assignment',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    try {
      identitySecurityFoundationService.invalidateSecurityCache(req.tenantId, undefined, req.staffId);
    } catch {}

    return {
      id: created.id,
      tenantId: created.tenantId,
      partnerId: created.partnerId,
      organizationId: created.organizationId,
      branchId: created.branchId || undefined,
      departmentId: created.departmentId || undefined,
      staffId: created.staffId,
      roleCode: (created.roleCode as any) || 'ATTENDING_DOCTOR',
      dataScope: (created.dataScope as any) || 'BRANCH',
      isPrimary: created.isPrimary === 'TRUE',
      effectiveFrom: created.effectiveFrom instanceof Date ? created.effectiveFrom.toISOString() : String(created.effectiveFrom),
      effectiveTo: created.effectiveTo ? (created.effectiveTo instanceof Date ? created.effectiveTo.toISOString() : String(created.effectiveTo)) : undefined,
      assignedBy: created.assignedBy,
      metadata: (created.metadata as Record<string, unknown>) || {},
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
    };
  }

  // --- CREDENTIALS ---
  async getCredentials(
    tenantId: string,
    staffId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StaffCredentialDto[]> {
    if (!dbClient) return [];

    try {
      const conditions = [eq(staffCredentials.tenantId, tenantId)];
      if (staffId) conditions.push(eq(staffCredentials.staffId, staffId));

      const rows = await dbClient
        .select()
        .from(staffCredentials)
        .where(and(...conditions))
        .orderBy(desc(staffCredentials.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        organizationId: r.organizationId,
        staffId: r.staffId,
        credentialType: (r.credentialType as any) || 'MEDICAL_LICENSE',
        registrationNumber: r.registrationNumber,
        issuingAuthority: r.issuingAuthority,
        issueDate: r.issueDate instanceof Date ? r.issueDate.toISOString() : String(r.issueDate),
        expiryDate: r.expiryDate instanceof Date ? r.expiryDate.toISOString() : String(r.expiryDate),
        verificationStatus: (r.verificationStatus as any) || 'PENDING',
        verificationReference: r.verificationReference || undefined,
        verifiedBy: r.verifiedBy || undefined,
        verifiedAt: r.verifiedAt ? (r.verifiedAt instanceof Date ? r.verifiedAt.toISOString() : String(r.verifiedAt)) : undefined,
        metadata: (r.metadata as Record<string, unknown>) || {},
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
      }));
    } catch (err) {
      logger.error('Failed to get credentials', err);
      return [];
    }
  }

  async addCredential(
    req: AddStaffCredentialRequest,
    dbClient = getDatabase()
  ): Promise<StaffCredentialDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for credential creation',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const defaults = await this.ensureDefaults(dbClient, req.tenantId);
    let partnerId = req.partnerId || defaults.partnerId;
    if (partnerId) {
      try {
        const [p] = await dbClient
          .select({ id: operationalPartners.id })
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, req.tenantId), eq(operationalPartners.id, partnerId)))
          .limit(1);
        if (!p) {
          partnerId = defaults.partnerId;
        }
      } catch {
        partnerId = defaults.partnerId;
      }
    }

    let organizationId = req.organizationId || defaults.organizationId;
    if (organizationId) {
      try {
        const [o] = await dbClient
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(and(eq(operationalOrganizations.tenantId, req.tenantId), eq(operationalOrganizations.id, organizationId)))
          .limit(1);
        if (!o) {
          organizationId = defaults.organizationId;
        }
      } catch {
        organizationId = defaults.organizationId;
      }
    }

    const [created] = await dbClient
      .insert(staffCredentials)
      .values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        organizationId,
        staffId: req.staffId,
        credentialType: req.credentialType,
        registrationNumber: req.registrationNumber,
        issuingAuthority: req.issuingAuthority,
        issueDate: new Date(req.issueDate),
        expiryDate: new Date(req.expiryDate),
        verificationStatus: 'PENDING',
        documentReference: req.documentReference || null,
        metadata: {}
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to insert credential record',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    return {
      id: created.id,
      tenantId: created.tenantId,
      partnerId: created.partnerId,
      organizationId: created.organizationId,
      staffId: created.staffId,
      credentialType: (created.credentialType as any) || 'MEDICAL_LICENSE',
      registrationNumber: created.registrationNumber,
      issuingAuthority: created.issuingAuthority,
      issueDate: created.issueDate instanceof Date ? created.issueDate.toISOString() : String(created.issueDate),
      expiryDate: created.expiryDate instanceof Date ? created.expiryDate.toISOString() : String(created.expiryDate),
      verificationStatus: (created.verificationStatus as any) || 'PENDING',
      metadata: (created.metadata as Record<string, unknown>) || {},
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
    };
  }

  async verifyCredential(
    tenantId: string,
    credentialId: string,
    verifierId: string,
    verificationRef?: string,
    dbClient = getDatabase()
  ): Promise<StaffCredentialDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for credential verification',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const [updated] = await dbClient
      .update(staffCredentials)
      .set({
        verificationStatus: 'VERIFIED',
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        verificationReference: verificationRef || `VER-REF-${Date.now()}`,
        updatedAt: new Date()
      })
      .where(and(eq(staffCredentials.tenantId, tenantId), eq(staffCredentials.id, credentialId)))
      .returning();

    if (!updated) {
      throw new AppError({
        message: `Credential ${credentialId} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      partnerId: updated.partnerId,
      organizationId: updated.organizationId,
      staffId: updated.staffId,
      credentialType: (updated.credentialType as any) || 'MEDICAL_LICENSE',
      registrationNumber: updated.registrationNumber,
      issuingAuthority: updated.issuingAuthority,
      issueDate: updated.issueDate instanceof Date ? updated.issueDate.toISOString() : String(updated.issueDate),
      expiryDate: updated.expiryDate instanceof Date ? updated.expiryDate.toISOString() : String(updated.expiryDate),
      verificationStatus: (updated.verificationStatus as any) || 'VERIFIED',
      verificationReference: updated.verificationReference || undefined,
      verifiedBy: updated.verifiedBy || undefined,
      verifiedAt: updated.verifiedAt ? (updated.verifiedAt instanceof Date ? updated.verifiedAt.toISOString() : String(updated.verifiedAt)) : undefined,
      metadata: (updated.metadata as Record<string, unknown>) || {},
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt)
    };
  }

  // --- TRANSFERS ---
  async getTransfers(
    tenantId: string,
    staffId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StaffTransferDto[]> {
    if (!dbClient) return [];

    try {
      const conditions = [eq(staffTransfers.tenantId, tenantId)];
      if (staffId) conditions.push(eq(staffTransfers.staffId, staffId));

      const rows = await dbClient
        .select()
        .from(staffTransfers)
        .where(and(...conditions))
        .orderBy(desc(staffTransfers.createdAt));

      return rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenantId,
        partnerId: r.partnerId,
        staffId: r.staffId,
        fromOrganizationId: r.fromOrganizationId,
        toOrganizationId: r.toOrganizationId,
        fromBranchId: r.fromBranchId,
        toBranchId: r.toBranchId,
        fromDepartmentId: r.fromDepartmentId,
        toDepartmentId: r.toDepartmentId,
        transferType: (r.transferType as any) || 'DEPARTMENT_TRANSFER',
        transferStatus: (r.transferStatus as any) || 'COMPLETED',
        effectiveDate: r.effectiveDate instanceof Date ? r.effectiveDate.toISOString() : String(r.effectiveDate),
        authorizedBy: r.authorizedBy,
        justification: r.justification,
        metadata: (r.metadata as Record<string, unknown>) || {},
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
      }));
    } catch (err) {
      logger.error('Failed to get transfers', err);
      return [];
    }
  }

  async createTransfer(
    req: CreateStaffTransferRequest,
    dbClient = getDatabase()
  ): Promise<StaffTransferDto> {
    if (!dbClient) {
      throw new AppError({
        message: 'Database unavailable for staff transfer',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    const defaults = await this.ensureDefaults(dbClient, req.tenantId);
    let partnerId = req.partnerId || defaults.partnerId;
    if (partnerId) {
      try {
        const [p] = await dbClient
          .select({ id: operationalPartners.id })
          .from(operationalPartners)
          .where(and(eq(operationalPartners.tenantId, req.tenantId), eq(operationalPartners.id, partnerId)))
          .limit(1);
        if (!p) {
          partnerId = defaults.partnerId;
        }
      } catch {
        partnerId = defaults.partnerId;
      }
    }

    let toOrgId = req.toOrganizationId || defaults.organizationId;
    if (toOrgId) {
      try {
        const [o] = await dbClient
          .select({ id: operationalOrganizations.id })
          .from(operationalOrganizations)
          .where(and(eq(operationalOrganizations.tenantId, req.tenantId), eq(operationalOrganizations.id, toOrgId)))
          .limit(1);
        if (!o) {
          toOrgId = defaults.organizationId;
        }
      } catch {
        toOrgId = defaults.organizationId;
      }
    }

    // Get staff's current organization, branch, and department
    const [currentStaff] = await dbClient
      .select()
      .from(operationalStaff)
      .where(and(eq(operationalStaff.tenantId, req.tenantId), eq(operationalStaff.id, req.staffId)))
      .limit(1);

    const fromOrg = currentStaff?.organizationId || toOrgId;
    const fromBranch = currentStaff?.branchId || req.toBranchId;
    const fromDept = currentStaff?.departmentId || req.toDepartmentId;

    const [created] = await dbClient
      .insert(staffTransfers)
      .values({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId,
        staffId: req.staffId,
        fromOrganizationId: fromOrg,
        toOrganizationId: toOrgId,
        fromBranchId: fromBranch,
        toBranchId: req.toBranchId,
        fromDepartmentId: fromDept,
        toDepartmentId: req.toDepartmentId,
        transferType: req.transferType,
        transferStatus: 'COMPLETED',
        effectiveDate: new Date(req.effectiveDate),
        authorizedBy: req.actorId || 'ADMIN',
        justification: req.reason || 'Staff departmental transfer',
        metadata: {}
      })
      .returning();

    if (!created) {
      throw new AppError({
        message: 'Failed to insert staff transfer record',
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    // Mutate staff's active department and branch in database
    try {
      await dbClient
        .update(operationalStaff)
        .set({
          organizationId: toOrgId,
          branchId: req.toBranchId,
          departmentId: req.toDepartmentId,
          updatedAt: new Date()
        })
        .where(and(eq(operationalStaff.tenantId, req.tenantId), eq(operationalStaff.id, req.staffId)));

      // Invariant: Synchronize active role assignments to transferred branch and department
      await dbClient
        .update(staffRoleAssignments)
        .set({
          organizationId: toOrgId,
          branchId: req.toBranchId,
          departmentId: req.toDepartmentId,
          updatedAt: new Date()
        })
        .where(and(eq(staffRoleAssignments.tenantId, req.tenantId), eq(staffRoleAssignments.staffId, req.staffId)));

      identitySecurityFoundationService.setStaffRuntimeState({
        partnerId: req.tenantId,
        staffId: req.staffId,
        departmentIds: req.toDepartmentId ? [req.toDepartmentId] : undefined,
        locationIds: req.toBranchId ? [req.toBranchId] : undefined
      });
      identitySecurityFoundationService.invalidateSecurityCache(req.tenantId, undefined, req.staffId);
    } catch {
      // Best effort
    }

    return {
      id: created.id,
      tenantId: created.tenantId,
      partnerId: created.partnerId,
      staffId: created.staffId,
      fromOrganizationId: created.fromOrganizationId,
      toOrganizationId: created.toOrganizationId,
      fromBranchId: created.fromBranchId,
      toBranchId: created.toBranchId,
      fromDepartmentId: created.fromDepartmentId,
      toDepartmentId: created.toDepartmentId,
      transferType: (created.transferType as any) || 'DEPARTMENT_TRANSFER',
      transferStatus: (created.transferStatus as any) || 'COMPLETED',
      effectiveDate: created.effectiveDate instanceof Date ? created.effectiveDate.toISOString() : String(created.effectiveDate),
      authorizedBy: created.authorizedBy,
      justification: created.justification,
      metadata: (created.metadata as Record<string, unknown>) || {},
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)
    };
  }
}

export const staffAdministrationRepository = new StaffAdministrationRepository();
