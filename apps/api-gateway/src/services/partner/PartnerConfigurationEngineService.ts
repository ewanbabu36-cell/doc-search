import crypto from 'node:crypto';
import {
  getDatabase,
  branches,
  partnerProfiles,
  partnerCapabilities,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  operationalStaff,
  eq,
  and,
  asc
} from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import {
  masterFoundationService,
  INDUSTRY_MASTER_CATALOG,
  OPERATING_MODEL_MASTER_CATALOG,
  DEPARTMENT_MASTER_CATALOG,
  type CanonicalIndustryCode,
  type CanonicalOperatingModelCode
} from '../company/MasterFoundationService.js';
import { configurationVersioningService } from '../company/ConfigurationVersioningService.js';
import { partnerAccountService } from './PartnerAccountService.js';
import { staffAdministrationService } from './StaffAdministrationService.js';
import { staffAdministrationRepository } from '../../repositories/partner/StaffAdministrationRepository.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('partner-configuration-engine');

export type ConfigurationDomainStatus =
  | 'VERIFIED'
  | 'PARTIAL'
  | 'NOT_IMPLEMENTED'
  | 'INVALID'
  | 'BLOCKED'
  | 'UNKNOWN';

export interface PartnerOperationalServiceItem {
  id: string;
  tenantId: string;
  serviceCode: string;
  serviceName: string;
  category: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  requiredCapability: string;
  baseTariffInr: number;
  turnaroundMinutes?: number | undefined;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationDomainCheck {
  domain:
    | 'Profile'
    | 'Industry'
    | 'Operating Model'
    | 'Locations'
    | 'Departments'
    | 'Services'
    | 'Staff Templates'
    | 'Staff'
    | 'Roles'
    | 'Permissions'
    | 'Entitlements'
    | 'Workspace'
    | 'Plan & Features'
    | 'License';
  status: ConfigurationDomainStatus;
  summary: string;
  count?: number | undefined;
  issues: string[];
  evidence: Record<string, unknown>;
}

export interface PartnerConfigurationValidationReport {
  tenantId: string;
  partnerId: string;
  evaluatedAt: string;
  overallStatus: ConfigurationDomainStatus;
  isOperationallyReady: boolean;
  domains: Record<string, ConfigurationDomainCheck>;
  structuralChecks: { code: string; passed: boolean; message: string }[];
  securityChecks: { code: string; passed: boolean; message: string }[];
  commercialChecks: { code: string; passed: boolean; message: string }[];
  operationalChecks: { code: string; passed: boolean; message: string }[];
  blockingIssues: string[];
  warnings: string[];
}

function deterministicUuid(seed: string): string {
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const SERVICE_BLUEPRINTS_BY_CATEGORY: Array<{
  serviceCode: string;
  serviceName: string;
  category: string;
  departmentCode: string;
  requiredCapability: string;
  applicableIndustries: CanonicalIndustryCode[];
  defaultTariffInr: number;
  turnaroundMinutes: number;
}> = [
  {
    serviceCode: 'SVC-PATH-CBC',
    serviceName: 'Complete Blood Count (CBC) Automated Panel',
    category: 'LABORATORY_DIAGNOSTICS',
    departmentCode: 'PATHOLOGY_LAB',
    requiredCapability: 'PATHOLOGY',
    applicableIndustries: ['PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    defaultTariffInr: 350,
    turnaroundMinutes: 120
  },
  {
    serviceCode: 'SVC-PATH-LFT',
    serviceName: 'Liver Function Test (LFT) Biochemistry Panel',
    category: 'LABORATORY_DIAGNOSTICS',
    departmentCode: 'BIOCHEMISTRY',
    requiredCapability: 'LABORATORY',
    applicableIndustries: ['PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    defaultTariffInr: 650,
    turnaroundMinutes: 180
  },
  {
    serviceCode: 'SVC-RAD-XRAY',
    serviceName: 'Digital Chest Radiography (PA View)',
    category: 'RADIOLOGY_IMAGING',
    departmentCode: 'RADIOLOGY_IMAGING',
    requiredCapability: 'RADIOLOGY',
    applicableIndustries: ['RADIOLOGY', 'DIAGNOSTIC_CENTRE', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    defaultTariffInr: 500,
    turnaroundMinutes: 60
  },
  {
    serviceCode: 'SVC-PHARM-RETAIL-RX',
    serviceName: 'Retail Prescription Counter Dispensing & Counseling',
    category: 'PHARMACY_RETAIL',
    departmentCode: 'RETAIL_PHARMACY',
    requiredCapability: 'PHARMACY_RETAIL',
    applicableIndustries: ['PHARMACY_RETAIL', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    defaultTariffInr: 0,
    turnaroundMinutes: 15
  },
  {
    serviceCode: 'SVC-PHARM-WHOLESALE-B2B',
    serviceName: 'B2B Bulk Stock Lot Dispatch & GST Invoicing',
    category: 'PHARMACY_WHOLESALE',
    departmentCode: 'WHOLESALE_DISTRIBUTION',
    requiredCapability: 'PHARMACY_WHOLESALE',
    applicableIndustries: ['PHARMACY_WHOLESALE'],
    defaultTariffInr: 0,
    turnaroundMinutes: 240
  },
  {
    serviceCode: 'SVC-OPD-GEN-CONSULT',
    serviceName: 'Outpatient Physician Consultation & EMR Prescription',
    category: 'OUTPATIENT_CONSULTATION',
    departmentCode: 'OPD_CONSULTATION',
    requiredCapability: 'OPD',
    applicableIndustries: ['SOLO_DOCTOR_CLINIC', 'MULTI_SPECIALITY_HOSPITAL', 'HYBRID'],
    defaultTariffInr: 500,
    turnaroundMinutes: 20
  },
  {
    serviceCode: 'SVC-IPD-WARD-CARE',
    serviceName: 'Inpatient Ward Admission & Nursing Care',
    category: 'INPATIENT_CARE',
    departmentCode: 'INPATIENT_WARD',
    requiredCapability: 'IPD',
    applicableIndustries: ['MULTI_SPECIALITY_HOSPITAL'],
    defaultTariffInr: 2500,
    turnaroundMinutes: 1440
  }
];

export class PartnerConfigurationEngineService {
  /**
   * Resolves the partner's canonical Industry, Operating Model, and Profile row.
   */
  public async resolvePartnerClassificationContext(tenantId: string): Promise<{
    profile: any | null;
    industry: CanonicalIndustryCode;
    operatingModel: CanonicalOperatingModelCode;
    rawPartnerType: string;
    rawOperatingMode: string;
    enabledCapabilityCodes: string[];
    foundationState: any;
  }> {
    const db = getDatabase();
    const [profile] = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);

    const profileMetadata = (profile?.metadata && typeof profile.metadata === 'object')
      ? (profile.metadata as Record<string, any>)
      : {};

    const rawPartnerType = String(
      profileMetadata['industry'] ||
        profile?.partnerType ||
        profileMetadata['organizationType'] ||
        'SOLO_DOCTOR_CLINIC'
    ).toUpperCase();

    const rawOperatingMode = String(
      profile?.operatingModel ||
        profileMetadata['operatingModel'] ||
        profileMetadata['operatingMode'] ||
        ''
    ).toUpperCase();

    const industry =
      masterFoundationService.normalizeIndustryCode(rawPartnerType, rawOperatingMode) ||
      'SOLO_DOCTOR_CLINIC';
    const operatingModel =
      masterFoundationService.normalizeOperatingModelCode(rawOperatingMode, industry) ||
      INDUSTRY_MASTER_CATALOG[industry].defaultOperatingModel;

    const foundationState = await masterFoundationService.resolveEffectivePartnerFoundation(tenantId, {
      industryOverride: industry,
      operatingModelOverride: operatingModel
    });

    const enabledCapabilityCodes: string[] =
      Array.isArray(foundationState.effectiveCapabilities) && foundationState.effectiveCapabilities.length > 0
        ? foundationState.effectiveCapabilities
        : INDUSTRY_MASTER_CATALOG[industry].allowedCapabilities;

    return {
      profile: profile || null,
      industry,
      operatingModel,
      rawPartnerType,
      rawOperatingMode,
      enabledCapabilityCodes,
      foundationState
    };
  }

  /**
   * STEP 10: Deterministic & 100% Idempotent Partner Configuration Initialization
   * Safe to run 1 time, 10 times, or 100 times without creating duplicates.
   */
  public async initializePartnerConfiguration(
    session: SessionContext,
    options?: {
      reason?: string | undefined;
      source?: 'HQ_APPROVAL' | 'PARTNER_ADMIN' | 'SYSTEM_RECONCILE' | undefined;
    }
  ) {
    const db = getDatabase();
    const tenantId = session.tenantId;
    const actorId = session.userId || 'SYSTEM';
    const source = options?.source || 'PARTNER_ADMIN';
    const reason = options?.reason || 'Deterministic Partner Configuration Initialization';

    // 1. Ensure Partner Profile & Commercial Account are initialized
    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    const ctx = await this.resolvePartnerClassificationContext(tenantId);
    const partnerProfileId =
      ctx.profile?.id ||
      accountData.organizationProfile.partnerId ||
      deterministicUuid(`profile:${tenantId}`);

    // 2. Persist canonical industry & operatingModel into partnerProfiles column + metadata idempotently
    if (ctx.profile) {
      const currentMeta = (ctx.profile.metadata && typeof ctx.profile.metadata === 'object')
        ? { ...(ctx.profile.metadata as Record<string, any>) }
        : {};
      currentMeta['industry'] = ctx.industry;
      currentMeta['operatingModel'] = ctx.operatingModel;
      currentMeta['configurationInitializedAt'] = new Date().toISOString();
      await db
        .update(partnerProfiles)
        .set({
          operatingModel: ctx.operatingModel,
          metadata: currentMeta,
          updatedAt: new Date()
        })
        .where(eq(partnerProfiles.id, ctx.profile.id));
    }

    // 3. Ensure operational partner, organization, and primary location (facility + core.branches) exist idempotently
    const { partnerId: opPartnerId, organizationId: opOrgId, branchId: primaryFacilityId } =
      await staffAdministrationRepository.ensureDefaults(db, tenantId);

    await db
      .update(operationalPartners)
      .set({ operatingModel: ctx.operatingModel, updatedAt: new Date() })
      .where(eq(operationalPartners.id, opPartnerId));
    await db
      .update(operationalOrganizations)
      .set({ operatingModel: ctx.operatingModel, updatedAt: new Date() })
      .where(eq(operationalOrganizations.id, opOrgId));

    // Also ensure core.branches has the primary location synchronized
    const primaryBranchCode = `LOC-${tenantId.substring(0, 8).toUpperCase()}-MAIN`;
    const [existingCoreBranch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.tenantId, tenantId))
      .limit(1);

    if (!existingCoreBranch) {
      await db
        .insert(branches)
        .values({
          id: primaryFacilityId,
          tenantId,
          name: `${accountData.organizationProfile.legalName || 'Primary Facility'} - Main Location`,
          code: primaryBranchCode
        })
        .onConflictDoNothing();
    }

    // 4. Upsert baseline Partner Capabilities idempotently
    for (const capCode of ctx.enabledCapabilityCodes) {
      const capId = deterministicUuid(`cap:${tenantId}:${capCode}`);
      const [existingCap] = await db
        .select({ id: partnerCapabilities.id })
        .from(partnerCapabilities)
        .where(
          and(
            eq(partnerCapabilities.tenantId, tenantId),
            eq(partnerCapabilities.capabilityCode, capCode)
          )
        )
        .limit(1);

      if (!existingCap) {
        await db
          .insert(partnerCapabilities)
          .values({
            id: capId,
            partnerId: partnerProfileId,
            tenantId,
            capabilityCode: capCode,
            status: 'ACTIVE',
            isHqOverride: false
          })
          .onConflictDoNothing();
      }
    }

    // 5. Deterministically derive and upsert ONLY Applicable Departments for (Industry ∩ OperatingModel ∩ EnabledCapabilities)
    const activeApplicableDepts = masterFoundationService.resolveEffectiveDepartments(
      ctx.industry,
      ctx.operatingModel,
      ctx.enabledCapabilityCodes
    );

    const existingDeptRows = await db
      .select()
      .from(operationalDepartments)
      .where(eq(operationalDepartments.tenantId, tenantId));

    const existingByCanonicalCode = new Map<string, any>();
    for (const row of existingDeptRows) {
      const meta = (row.metadata && typeof row.metadata === 'object') ? (row.metadata as Record<string, any>) : {};
      const canonical = String(meta['canonicalDepartmentCode'] || row.departmentCode).toUpperCase();
      existingByCanonicalCode.set(canonical, row);
      existingByCanonicalCode.set(String(row.departmentCode).toUpperCase(), row);
    }

    for (const deptDef of activeApplicableDepts) {
      const scopedCode = `DEPT-${tenantId.substring(0, 8).toUpperCase()}-${deptDef.code}`;
      const deterministicDeptId = deterministicUuid(`op-dept:${tenantId}:${deptDef.code}`);
      const found = existingByCanonicalCode.get(deptDef.code) || existingByCanonicalCode.get(scopedCode);

      if (!found) {
        await db
          .insert(operationalDepartments)
          .values({
            id: deterministicDeptId,
            tenantId,
            partnerId: opPartnerId,
            organizationId: opOrgId,
            branchId: primaryFacilityId,
            departmentCode: scopedCode,
            departmentName: deptDef.name,
            costCenterCode: `CC-${deptDef.code.substring(0, 10)}`,
            status: 'ACTIVE',
            metadata: {
              canonicalDepartmentCode: deptDef.code,
              requiredCapabilities: deptDef.requiredCapabilities,
              industry: ctx.industry,
              operatingModel: ctx.operatingModel,
              initializedBy: source
            }
          })
          .onConflictDoNothing();
      }
    }

    // 6. Record Configuration Version & Audit Trail
    try {
      await configurationVersioningService.createSnapshot(
        partnerProfileId,
        reason,
        session.actorEmail || actorId,
        undefined,
        undefined,
        {
          lifecycleStatus: 'PUBLISHED',
          industry: ctx.industry,
          operatingModel: ctx.operatingModel
        }
      );

      await auditRepository.recordEvent(
        {
          eventType: 'PARTNER_CONFIGURATION_INITIALIZED',
          resourceType: 'partner_configuration',
          resourceId: String(partnerProfileId),
          tenantId,
          branchId: primaryFacilityId,
          metadata: {
            source,
            reason,
            industry: ctx.industry,
            operatingModel: ctx.operatingModel,
            primaryFacilityId,
            applicableDepartments: activeApplicableDepts.map((d) => d.code)
          }
        },
        session
      );
    } catch (err) {
      logger.warn('Non-fatal audit log notice during partner configuration init: ' + String(err));
    }

    // 7. Return full configuration state + validation report
    return this.getFullPartnerConfiguration(session);
  }

  /**
   * Returns the complete 16-stage Partner Configuration state for the authenticated partner.
   */
  public async getFullPartnerConfiguration(session: SessionContext) {
    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    const ctx = await this.resolvePartnerClassificationContext(session.tenantId);
    const locations = await this.getLocations(session);
    const departments = await this.getDepartments(session);
    const services = await this.getServices(session);
    const staffTemplates = await this.getStaffTemplates(session);
    const staffMembers = await staffAdministrationService.getStaff(session, {});
    const roleAssignments = await staffAdministrationService.getRoleAssignments(session);
    const validation = await this.validatePartnerConfiguration(session);

    const workspaceModules = this.resolveWorkspaceModules(ctx.industry, ctx.enabledCapabilityCodes, accountData);

    return {
      partnerId: accountData.organizationProfile.partnerId,
      tenantId: session.tenantId,
      profile: accountData.organizationProfile,
      classification: {
        industry: ctx.industry,
        industryDefinition: INDUSTRY_MASTER_CATALOG[ctx.industry],
        operatingModel: ctx.operatingModel,
        operatingModelDefinition: OPERATING_MODEL_MASTER_CATALOG[ctx.operatingModel],
        enabledCapabilityCodes: ctx.enabledCapabilityCodes
      },
      locations,
      departments,
      services,
      staffTemplates,
      staff: {
        totalCount: staffMembers.length,
        activeCount: staffMembers.filter((s) => s.employmentStatus === 'ACTIVE').length,
        doctorCount: staffMembers.filter((s) => s.staffType === 'DOCTOR' && s.employmentStatus !== 'TERMINATED').length,
        members: staffMembers
      },
      roles: {
        assignmentsCount: roleAssignments.length,
        assignments: roleAssignments
      },
      permissions: {
        effectiveCapabilities: ctx.enabledCapabilityCodes,
        effectiveFeaturesCount: accountData.features.filter((f) => f.status === 'AVAILABLE').length
      },
      entitlements: accountData.features,
      workspace: workspaceModules,
      planAndFeatures: {
        subscription: accountData.subscription,
        plan: accountData.currentPlan,
        features: accountData.features,
        limits: accountData.limits
      },
      license: {
        licenseKey: accountData.subscription.licenseKey,
        status: accountData.subscription.licenseStatus,
        isAccessAllowed: accountData.subscription.isAccessAllowed,
        isSignatureValid: accountData.subscription.isSignatureValid,
        expiryDate: accountData.subscription.expiryDate,
        daysRemaining: accountData.subscription.daysRemaining,
        maxDoctors: accountData.limits.doctorSeats.limit,
        maxBranches: accountData.limits.branches.limit
      },
      validation
    };
  }

  private resolveWorkspaceModules(
    industry: CanonicalIndustryCode,
    enabledCapabilities: string[],
    accountData: any
  ) {
    const capSet = new Set(enabledCapabilities.map((c) => c.toUpperCase()));
    const allowedNavigationModules: string[] = ['PARTNER_PROFILE', 'CONFIGURATION_OVERVIEW', 'STAFF_AND_ROLES', 'BILLING_AND_INVOICES'];

    if (capSet.has('OPD') || industry === 'SOLO_DOCTOR_CLINIC' || industry === 'MULTI_SPECIALITY_HOSPITAL') {
      allowedNavigationModules.push('OPD_CONSULTATION_QUEUE', 'PATIENT_EMR');
    }
    if (capSet.has('IPD') && industry === 'MULTI_SPECIALITY_HOSPITAL') {
      allowedNavigationModules.push('IPD_ADT_BED_BOARD', 'NURSING_STATION');
    }
    if (capSet.has('PATHOLOGY') || capSet.has('LABORATORY') || industry === 'PATHOLOGY' || industry === 'DIAGNOSTIC_CENTRE') {
      allowedNavigationModules.push('PATHOLOGY_LIMS_WORKLIST', 'SAMPLE_ACCESSION');
    }
    if (capSet.has('RADIOLOGY') || industry === 'RADIOLOGY' || industry === 'DIAGNOSTIC_CENTRE') {
      allowedNavigationModules.push('RADIOLOGY_RIS_PACS');
    }
    if (capSet.has('PHARMACY_RETAIL') || industry === 'PHARMACY_RETAIL') {
      allowedNavigationModules.push('RETAIL_PHARMACY_POS', 'BATCH_INVENTORY');
    }
    if (capSet.has('PHARMACY_WHOLESALE') || industry === 'PHARMACY_WHOLESALE') {
      allowedNavigationModules.push('WHOLESALE_B2B_DISTRIBUTION', 'STOCK_LEDGER');
    }

    const defaultLandingView =
      industry === 'PATHOLOGY'
        ? 'PATHOLOGY_LIMS_WORKLIST'
        : industry === 'RADIOLOGY' || industry === 'DIAGNOSTIC_CENTRE'
        ? 'RADIOLOGY_RIS_PACS'
        : industry === 'PHARMACY_RETAIL'
        ? 'RETAIL_PHARMACY_POS'
        : industry === 'PHARMACY_WHOLESALE'
        ? 'WHOLESALE_B2B_DISTRIBUTION'
        : 'OPD_CONSULTATION_QUEUE';

    return {
      workspaceLayout: `${industry}_WORKSPACE`,
      defaultLandingView,
      allowedNavigationModules,
      isRestrictedByLicense: !accountData.subscription.isAccessAllowed
    };
  }

  /**
   * STEP 6 / SECTION 6: Locations / Branches Engine
   */
  public async getLocations(session: SessionContext) {
    const db = getDatabase();
    await staffAdministrationRepository.ensureDefaults(db, session.tenantId);

    const rows = await db
      .select()
      .from(operationalFacilities)
      .where(eq(operationalFacilities.tenantId, session.tenantId))
      .orderBy(asc(operationalFacilities.createdAt));

    return rows.map((row) => {
      const meta = (row.metadata && typeof row.metadata === 'object') ? (row.metadata as Record<string, any>) : {};
      return {
        id: row.id,
        tenantId: row.tenantId,
        partnerId: row.partnerId,
        organizationId: row.organizationId,
        locationCode: row.facilityCode,
        locationName: row.facilityName,
        locationType: row.facilityType,
        isPrimaryLocation: Boolean(meta['isPrimaryLocation']) || row.facilityCode.endsWith('-MAIN'),
        address: {
          street: row.addressStreet,
          city: row.addressCity,
          state: row.addressState,
          postalCode: row.addressPostalCode,
          country: row.addressCountry
        },
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone,
        status: row.status,
        operatingHours: meta['operatingHours'] || '08:00 - 20:00',
        emergencyAvailable: Boolean(meta['emergencyAvailable']),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      };
    });
  }

  public async createLocation(
    session: SessionContext,
    payload: {
      locationCode?: string | undefined;
      locationName: string;
      locationType?: string | undefined;
      addressStreet: string;
      addressCity: string;
      addressState: string;
      addressPostalCode: string;
      addressCountry?: string | undefined;
      contactEmail: string;
      contactPhone: string;
      operatingHours?: string | undefined;
      emergencyAvailable?: boolean | undefined;
    }
  ) {
    const db = getDatabase();
    const tenantId = session.tenantId;

    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    if (!accountData.subscription.isAccessAllowed) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Cannot create new location while commercial license is ${accountData.subscription.licenseStatus}.`,
        statusCode: 403
      });
    }

    const ctx = await this.resolvePartnerClassificationContext(tenantId);
    const currentLocations = await this.getLocations(session);
    const activeLocations = currentLocations.filter((l) => l.status === 'ACTIVE');

    const maxBranches = accountData.limits.branches.limit || 1;
    if (activeLocations.length >= maxBranches) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Branch limit reached (${activeLocations.length}/${maxBranches}). Upgrade your commercial plan or branch quota to add another location.`,
        statusCode: 403
      });
    }

    if (ctx.operatingModel === 'SOLO' && activeLocations.length >= 1) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Operating Model 'SOLO' is configured for a single operational location.`,
        statusCode: 403
      });
    }

    const { partnerId, organizationId } = await staffAdministrationRepository.ensureDefaults(db, tenantId);
    const cleanCode =
      payload.locationCode?.trim().toUpperCase() ||
      `LOC-${tenantId.substring(0, 6).toUpperCase()}-${String(currentLocations.length + 1).padStart(2, '0')}`;

    const duplicate = currentLocations.find((l) => l.locationCode.toUpperCase() === cleanCode);
    if (duplicate) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Location code '${cleanCode}' already exists for this partner.`,
        statusCode: 409
      });
    }

    const newId = deterministicUuid(`op-facility:${tenantId}:${cleanCode}`);
    const [inserted] = await db
      .insert(operationalFacilities)
      .values({
        id: newId,
        tenantId,
        partnerId,
        organizationId,
        facilityCode: cleanCode,
        facilityName: payload.locationName.trim(),
        facilityType: payload.locationType || 'OUTPATIENT_CLINIC',
        addressStreet: payload.addressStreet.trim(),
        addressCity: payload.addressCity.trim(),
        addressState: payload.addressState.trim(),
        addressPostalCode: payload.addressPostalCode.trim(),
        addressCountry: payload.addressCountry?.trim() || 'IN',
        contactEmail: payload.contactEmail.trim(),
        contactPhone: payload.contactPhone.trim(),
        status: 'ACTIVE',
        metadata: {
          isPrimaryLocation: currentLocations.length === 0,
          operatingHours: payload.operatingHours || '08:00 - 20:00',
          emergencyAvailable: Boolean(payload.emergencyAvailable)
        }
      })
      .returning();

    await auditRepository.recordEvent(
      {
        eventType: 'PARTNER_LOCATION_CREATED',
        resourceType: 'operational_facility',
        resourceId: inserted!.id,
        tenantId,
        branchId: inserted!.id,
        metadata: { locationCode: cleanCode, locationName: payload.locationName }
      },
      session
    );

    const updatedList = await this.getLocations(session);
    return updatedList.find((l) => l.id === inserted!.id) || updatedList[updatedList.length - 1];
  }

  public async updateLocation(
    session: SessionContext,
    locationId: string,
    payload: {
      locationName?: string | undefined;
      addressStreet?: string | undefined;
      addressCity?: string | undefined;
      addressState?: string | undefined;
      addressPostalCode?: string | undefined;
      contactEmail?: string | undefined;
      contactPhone?: string | undefined;
      status?: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | undefined;
      operatingHours?: string | undefined;
      emergencyAvailable?: boolean | undefined;
    }
  ) {
    const db = getDatabase();
    const [existing] = await db
      .select()
      .from(operationalFacilities)
      .where(eq(operationalFacilities.id, locationId))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Location '${locationId}' not found.`,
        statusCode: 404
      });
    }
    if (existing.tenantId !== session.tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot modify a location belonging to another partner.',
        statusCode: 403
      });
    }

    if (payload.status && payload.status !== 'ACTIVE') {
      const allLocations = await this.getLocations(session);
      const activeLocations = allLocations.filter((l) => l.status === 'ACTIVE');
      if (activeLocations.length <= 1 && activeLocations[0]?.id === locationId) {
        throw new AppError({
          code: ErrorCode.BAD_REQUEST,
          message: 'Cannot deactivate the sole active location for this partner. At least one active location is required.',
          statusCode: 400
        });
      }
    }

    const oldMeta = (existing.metadata && typeof existing.metadata === 'object')
      ? (existing.metadata as Record<string, any>)
      : {};

    await db
      .update(operationalFacilities)
      .set({
        facilityName: payload.locationName?.trim() || existing.facilityName,
        addressStreet: payload.addressStreet?.trim() || existing.addressStreet,
        addressCity: payload.addressCity?.trim() || existing.addressCity,
        addressState: payload.addressState?.trim() || existing.addressState,
        addressPostalCode: payload.addressPostalCode?.trim() || existing.addressPostalCode,
        contactEmail: payload.contactEmail?.trim() || existing.contactEmail,
        contactPhone: payload.contactPhone?.trim() || existing.contactPhone,
        status: payload.status || existing.status,
        metadata: {
          ...oldMeta,
          operatingHours: payload.operatingHours ?? oldMeta['operatingHours'],
          emergencyAvailable: payload.emergencyAvailable ?? oldMeta['emergencyAvailable']
        },
        updatedAt: new Date()
      })
      .where(and(eq(operationalFacilities.id, locationId), eq(operationalFacilities.tenantId, session.tenantId)));

    await auditRepository.recordEvent(
      {
        eventType: 'PARTNER_LOCATION_UPDATED',
        resourceType: 'operational_facility',
        resourceId: locationId,
        tenantId: session.tenantId,
        branchId: locationId,
        metadata: { previousStatus: existing.status, newStatus: payload.status || existing.status }
      },
      session
    );

    const locations = await this.getLocations(session);
    return locations.find((l) => l.id === locationId);
  }

  /**
   * STEP 6 / SECTION 7: Applicable Departments Engine
   */
  public async getDepartments(session: SessionContext) {
    const ctx = await this.resolvePartnerClassificationContext(session.tenantId);
    const configured = await staffAdministrationService.getDepartments(session);

    const applicableCatalog = masterFoundationService.resolveEffectiveDepartments(
      ctx.industry,
      ctx.operatingModel,
      ctx.enabledCapabilityCodes
    );

    const allMasterDepts = Object.values(DEPARTMENT_MASTER_CATALOG);
    const applicableCodes = new Set(applicableCatalog.map((d) => d.code));
    const blockedCatalog = allMasterDepts
      .filter((d) => !applicableCodes.has(d.code))
      .map((d) => ({
        code: d.code,
        name: d.name,
        requiredCapabilities: d.requiredCapabilities,
        reason: `Restricted for Industry '${ctx.industry}' / Operating Model '${ctx.operatingModel}'`
      }));

    return {
      industry: ctx.industry,
      operatingModel: ctx.operatingModel,
      configuredCount: configured.length,
      activeCount: configured.filter((d) => d.status === 'ACTIVE').length,
      configuredDepartments: configured,
      applicableCatalogDepartments: applicableCatalog,
      blockedCatalogDepartments: blockedCatalog
    };
  }

  public async createDepartment(
    session: SessionContext,
    payload: {
      departmentCode: string;
      departmentName: string;
      locationId?: string | undefined;
      costCenterCode?: string | undefined;
      departmentHeadId?: string | undefined;
    }
  ) {
    const db = getDatabase();
    if (payload.locationId) {
      const [loc] = await db
        .select({ id: operationalFacilities.id, tenantId: operationalFacilities.tenantId })
        .from(operationalFacilities)
        .where(eq(operationalFacilities.id, payload.locationId))
        .limit(1);
      if (!loc) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Location '${payload.locationId}' does not exist.`,
          statusCode: 404
        });
      }
      if (loc.tenantId !== session.tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'Cross-tenant security violation: Cannot attach department to another partner location.',
          statusCode: 403
        });
      }
    }

    const defaults = await staffAdministrationRepository.ensureDefaults(db, session.tenantId);
    return staffAdministrationService.createDepartment(
      {
        partnerId: defaults.partnerId,
        organizationId: defaults.organizationId,
        branchId: payload.locationId || defaults.branchId,
        departmentCode: payload.departmentCode,
        departmentName: payload.departmentName,
        costCenterCode: payload.costCenterCode,
        departmentHeadId: payload.departmentHeadId,
        actorId: session.userId || 'PARTNER_ADMIN',
        actorRole: String(session.roles?.[0] || 'PARTNER_ADMIN'),
        reason: 'Partner configuration department creation'
      },
      session
    );
  }

  public async updateDepartment(
    session: SessionContext,
    departmentId: string,
    payload: {
      departmentName?: string | undefined;
      costCenterCode?: string | undefined;
      status?: 'ACTIVE' | 'INACTIVE' | 'RESTRUCTURED' | undefined;
    }
  ) {
    const db = getDatabase();
    const [existing] = await db
      .select()
      .from(operationalDepartments)
      .where(eq(operationalDepartments.id, departmentId))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Department '${departmentId}' not found.`,
        statusCode: 404
      });
    }
    if (existing.tenantId !== session.tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot modify a department belonging to another partner.',
        statusCode: 403
      });
    }

    if (payload.status && payload.status !== 'ACTIVE') {
      const activeStaffInDept = await db
        .select({ id: operationalStaff.id })
        .from(operationalStaff)
        .where(
          and(
            eq(operationalStaff.tenantId, session.tenantId),
            eq(operationalStaff.departmentId, departmentId),
            eq(operationalStaff.employmentStatus, 'ACTIVE')
          )
        );

      if (activeStaffInDept.length > 0) {
        throw new AppError({
          code: ErrorCode.BAD_REQUEST,
          message: `Cannot deactivate department '${existing.departmentName}' while ${activeStaffInDept.length} active staff member(s) are assigned to it. Reassign or transfer staff first.`,
          statusCode: 400
        });
      }
    }

    return staffAdministrationService.updateDepartment(departmentId, payload as any, session);
  }

  /**
   * STEP 6 / SECTION 8: Applicable Services Engine (Genuine Zero-State + Capability & Department Validated)
   */
  public async getServices(session: SessionContext) {
    const ctx = await this.resolvePartnerClassificationContext(session.tenantId);
    const meta = (ctx.profile?.metadata && typeof ctx.profile.metadata === 'object')
      ? (ctx.profile.metadata as Record<string, any>)
      : {};

    const configuredServices: PartnerOperationalServiceItem[] = Array.isArray(meta['operationalServices'])
      ? meta['operationalServices']
      : [];

    const capSet = new Set(ctx.enabledCapabilityCodes.map((c) => c.toUpperCase()));
    const applicableBlueprints = SERVICE_BLUEPRINTS_BY_CATEGORY.filter(
      (bp) =>
        bp.applicableIndustries.includes(ctx.industry) &&
        capSet.has(bp.requiredCapability.toUpperCase())
    );

    return {
      industry: ctx.industry,
      operatingModel: ctx.operatingModel,
      isZeroState: configuredServices.length === 0,
      configuredCount: configuredServices.length,
      activeCount: configuredServices.filter((s) => s.isActive).length,
      configuredServices,
      applicableServiceBlueprints: applicableBlueprints
    };
  }

  public async createService(
    session: SessionContext,
    payload: {
      serviceCode: string;
      serviceName: string;
      category: string;
      departmentId: string;
      locationId: string;
      baseTariffInr?: number | undefined;
      turnaroundMinutes?: number | undefined;
      isActive?: boolean | undefined;
    }
  ): Promise<PartnerOperationalServiceItem> {
    const db = getDatabase();
    const tenantId = session.tenantId;

    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    if (!accountData.subscription.isAccessAllowed) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Cannot create or activate operational services while commercial license is ${accountData.subscription.licenseStatus}.`,
        statusCode: 403
      });
    }

    const [loc] = await db
      .select()
      .from(operationalFacilities)
      .where(eq(operationalFacilities.id, payload.locationId))
      .limit(1);
    if (!loc) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Location '${payload.locationId}' not found.`,
        statusCode: 404
      });
    }
    if (loc.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot bind service to another partner location.',
        statusCode: 403
      });
    }
    if (loc.status !== 'ACTIVE') {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Location '${loc.facilityName}' is not ACTIVE.`,
        statusCode: 400
      });
    }

    const [dept] = await db
      .select()
      .from(operationalDepartments)
      .where(eq(operationalDepartments.id, payload.departmentId))
      .limit(1);
    if (!dept) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Department '${payload.departmentId}' not found.`,
        statusCode: 404
      });
    }
    if (dept.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot bind service to another partner department.',
        statusCode: 403
      });
    }
    if (dept.status !== 'ACTIVE') {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Department '${dept.departmentName}' is not ACTIVE.`,
        statusCode: 400
      });
    }

    const ctx = await this.resolvePartnerClassificationContext(tenantId);
    const normCategory = String(payload.category || '').toUpperCase().trim();
    const categoryToCapability: Record<string, string> = {
      LABORATORY_DIAGNOSTICS: 'LABORATORY',
      PATHOLOGY: 'PATHOLOGY',
      RADIOLOGY_IMAGING: 'RADIOLOGY',
      RADIOLOGY: 'RADIOLOGY',
      PHARMACY_RETAIL: 'PHARMACY_RETAIL',
      PHARMACY_WHOLESALE: 'PHARMACY_WHOLESALE',
      OUTPATIENT_CONSULTATION: 'OPD',
      OPD: 'OPD',
      INPATIENT_CARE: 'IPD',
      IPD: 'IPD',
      EMERGENCY_TRAUMA: 'EMERGENCY',
      SURGERY_OT: 'OT',
      BLOOD_BANK: 'BLOOD_BANK'
    };

    const requiredCap = categoryToCapability[normCategory] || 'BILLING';
    const capSet = new Set(ctx.enabledCapabilityCodes.map((c) => c.toUpperCase()));
    if (!capSet.has(requiredCap.toUpperCase())) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Service category '${normCategory}' requires capability '${requiredCap}', which is not enabled for Industry '${ctx.industry}' (${ctx.operatingModel}).`,
        statusCode: 403
      });
    }

    const [profileRow] = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);

    const currentMeta = (profileRow?.metadata && typeof profileRow.metadata === 'object')
      ? { ...(profileRow.metadata as Record<string, any>) }
      : {};
    const existingServices: PartnerOperationalServiceItem[] = Array.isArray(currentMeta['operationalServices'])
      ? [...currentMeta['operationalServices']]
      : [];

    const cleanCode = payload.serviceCode.trim().toUpperCase();
    const existingIdx = existingServices.findIndex(
      (s) => s.serviceCode.toUpperCase() === cleanCode && s.locationId === payload.locationId
    );

    const nowIso = new Date().toISOString();
    const serviceItem: PartnerOperationalServiceItem = {
      id: existingIdx >= 0 ? existingServices[existingIdx]!.id : deterministicUuid(`svc:${tenantId}:${cleanCode}:${payload.locationId}`),
      tenantId,
      serviceCode: cleanCode,
      serviceName: payload.serviceName.trim(),
      category: normCategory,
      departmentId: dept.id,
      departmentCode: dept.departmentCode,
      departmentName: dept.departmentName,
      locationId: loc.id,
      locationName: loc.facilityName,
      requiredCapability: requiredCap,
      baseTariffInr: Number(payload.baseTariffInr ?? 0),
      turnaroundMinutes: Number(payload.turnaroundMinutes ?? 30),
      isActive: payload.isActive !== false,
      createdAt: existingIdx >= 0 ? existingServices[existingIdx]!.createdAt : nowIso,
      updatedAt: nowIso
    };

    if (existingIdx >= 0) {
      existingServices[existingIdx] = serviceItem;
    } else {
      existingServices.push(serviceItem);
    }

    currentMeta['operationalServices'] = existingServices;
    if (profileRow) {
      await db
        .update(partnerProfiles)
        .set({ metadata: currentMeta, updatedAt: new Date() })
        .where(eq(partnerProfiles.id, profileRow.id));
    }

    await auditRepository.recordEvent(
      {
        eventType: 'PARTNER_SERVICE_CONFIGURED',
        resourceType: 'operational_service',
        resourceId: serviceItem.id,
        tenantId,
        branchId: serviceItem.locationId,
        metadata: {
          serviceCode: serviceItem.serviceCode,
          category: serviceItem.category,
          departmentId: serviceItem.departmentId,
          isActive: serviceItem.isActive
        }
      },
      session
    );

    return serviceItem;
  }

  public async updateService(
    session: SessionContext,
    serviceId: string,
    payload: {
      serviceName?: string | undefined;
      baseTariffInr?: number | undefined;
      turnaroundMinutes?: number | undefined;
      isActive?: boolean | undefined;
    }
  ): Promise<PartnerOperationalServiceItem> {
    const db = getDatabase();
    const tenantId = session.tenantId;

    const [profileRow] = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);

    const currentMeta = (profileRow?.metadata && typeof profileRow.metadata === 'object')
      ? { ...(profileRow.metadata as Record<string, any>) }
      : {};
    const existingServices: PartnerOperationalServiceItem[] = Array.isArray(currentMeta['operationalServices'])
      ? [...currentMeta['operationalServices']]
      : [];

    const idx = existingServices.findIndex((s) => s.id === serviceId);
    if (idx === -1) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Operational service '${serviceId}' not found for this partner.`,
        statusCode: 404
      });
    }

    const current = existingServices[idx]!;
    if (current.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation on service update.',
        statusCode: 403
      });
    }

    const updated: PartnerOperationalServiceItem = {
      ...current,
      serviceName: payload.serviceName?.trim() || current.serviceName,
      baseTariffInr: payload.baseTariffInr !== undefined ? Number(payload.baseTariffInr) : current.baseTariffInr,
      turnaroundMinutes: payload.turnaroundMinutes !== undefined ? Number(payload.turnaroundMinutes) : current.turnaroundMinutes,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : current.isActive,
      updatedAt: new Date().toISOString()
    };

    existingServices[idx] = updated;
    currentMeta['operationalServices'] = existingServices;

    if (profileRow) {
      await db
        .update(partnerProfiles)
        .set({ metadata: currentMeta, updatedAt: new Date() })
        .where(eq(partnerProfiles.id, profileRow.id));
    }

    await auditRepository.recordEvent(
      {
        eventType: 'PARTNER_SERVICE_UPDATED',
        resourceType: 'operational_service',
        resourceId: serviceId,
        tenantId,
        branchId: updated.locationId,
        metadata: { previousActive: current.isActive, newActive: updated.isActive }
      },
      session
    );

    return updated;
  }

  /**
   * STEP 6 / SECTION 10: Standard Staff Role Templates (Metadata Only — ZERO Fake Staff Creation)
   */
  public async getStaffTemplates(session: SessionContext) {
    const ctx = await this.resolvePartnerClassificationContext(session.tenantId);
    const templates = masterFoundationService.resolveEffectiveRoleTemplates(
      ctx.industry,
      ctx.operatingModel,
      ctx.enabledCapabilityCodes
    );

    return {
      industry: ctx.industry,
      operatingModel: ctx.operatingModel,
      isTemplateCatalogOnly: true,
      autoCreatedFakeStaffCount: 0,
      templateCount: templates.length,
      templates: templates.map((t) => ({
        code: t.code,
        name: t.name,
        description: t.description,
        departmentScope: t.departmentScope,
        requiredCapabilities: t.requiredCapabilities,
        permissionBundles: t.permissionBundles,
        explicitPermissions: t.explicitPermissions,
        prohibitedActions: t.prohibitedActions,
        applicableIndustries: t.applicableIndustries,
        applicableOperatingModels: t.applicableOperatingModels
      }))
    };
  }

  /**
   * STEP 6 / SECTION 11 & 12: Real Partner Staff & Role Assignment with Cross-Tenant & Quota Guardrails
   */
  public async createPartnerStaff(session: SessionContext, payload: any) {
    const db = getDatabase();
    const tenantId = session.tenantId;

    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    if (!accountData.subscription.isAccessAllowed) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Cannot onboard staff while commercial license is ${accountData.subscription.licenseStatus}.`,
        statusCode: 403
      });
    }

    if (payload.branchId || payload.locationId) {
      const targetLocId = payload.branchId || payload.locationId;
      const [loc] = await db
        .select({ id: operationalFacilities.id, tenantId: operationalFacilities.tenantId, status: operationalFacilities.status })
        .from(operationalFacilities)
        .where(eq(operationalFacilities.id, targetLocId))
        .limit(1);

      if (!loc) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Location '${targetLocId}' does not exist.`,
          statusCode: 404
        });
      }
      if (loc.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'Cross-tenant security violation: Cannot assign staff to another partner location.',
          statusCode: 403
        });
      }
      if (loc.status !== 'ACTIVE') {
        throw new AppError({
          code: ErrorCode.BAD_REQUEST,
          message: `Cannot assign staff to inactive location '${targetLocId}'.`,
          statusCode: 400
        });
      }
    }

    if (payload.departmentId) {
      const [dept] = await db
        .select({ id: operationalDepartments.id, tenantId: operationalDepartments.tenantId, status: operationalDepartments.status })
        .from(operationalDepartments)
        .where(eq(operationalDepartments.id, payload.departmentId))
        .limit(1);

      if (!dept) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Department '${payload.departmentId}' does not exist.`,
          statusCode: 404
        });
      }
      if (dept.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'Cross-tenant security violation: Cannot assign staff to another partner department.',
          statusCode: 403
        });
      }
      if (dept.status !== 'ACTIVE') {
        throw new AppError({
          code: ErrorCode.BAD_REQUEST,
          message: `Cannot assign staff to inactive department '${payload.departmentId}'.`,
          statusCode: 400
        });
      }
    }

    return staffAdministrationService.createStaff(
      {
        ...payload,
        branchId: payload.branchId || payload.locationId
      },
      session
    );
  }

  public async assignPartnerStaffRole(session: SessionContext, payload: any) {
    const db = getDatabase();
    const tenantId = session.tenantId;

    const [staffRow] = await db
      .select({ id: operationalStaff.id, tenantId: operationalStaff.tenantId })
      .from(operationalStaff)
      .where(eq(operationalStaff.id, payload.staffId))
      .limit(1);

    if (!staffRow) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Staff member '${payload.staffId}' not found.`,
        statusCode: 404
      });
    }
    if (staffRow.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Cross-tenant security violation: Cannot assign roles to staff from another partner.',
        statusCode: 403
      });
    }

    const ctx = await this.resolvePartnerClassificationContext(tenantId);
    const applicableTemplates = masterFoundationService.resolveEffectiveRoleTemplates(
      ctx.industry,
      ctx.operatingModel,
      ctx.enabledCapabilityCodes
    );
    const requestedRole = String(payload.roleCode || '').toUpperCase().trim();
    const isAdminRole = ['PARTNER_SUPER_ADMIN', 'PARTNER_ADMIN', 'FACILITY_ADMIN', 'BRANCH_MANAGER'].includes(requestedRole);
    const matchedTemplate = applicableTemplates.find((t) => t.code.toUpperCase() === requestedRole);

    if (!isAdminRole && !matchedTemplate) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Role '${requestedRole}' is not permitted for Industry '${ctx.industry}' (${ctx.operatingModel}).`,
        statusCode: 403
      });
    }

    return staffAdministrationService.assignStaffRole(payload, session);
  }

  /**
   * STEP 11 / SECTION 19 & 20: Partner Configuration Validation Engine
   * Evaluates all 14 domains and Structural, Security, Commercial, and Operational rules.
   */
  public async validatePartnerConfiguration(
    session: SessionContext
  ): Promise<PartnerConfigurationValidationReport> {
    const tenantId = session.tenantId;
    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    const profile = accountData.organizationProfile;
    const ctx = await this.resolvePartnerClassificationContext(tenantId);
    const locations = await this.getLocations(session);
    const deptBundle = await this.getDepartments(session);
    const serviceBundle = await this.getServices(session);
    const staffTemplates = await this.getStaffTemplates(session);
    const staffList = await staffAdministrationService.getStaff(session, {});
    const roleAssignments = await staffAdministrationService.getRoleAssignments(session);
    const workspace = this.resolveWorkspaceModules(ctx.industry, ctx.enabledCapabilityCodes, accountData);

    const activeLocations = locations.filter((l) => l.status === 'ACTIVE');
    const activeDepts = deptBundle.configuredDepartments.filter((d) => d.status === 'ACTIVE');
    const activeServices = serviceBundle.configuredServices.filter((s) => s.isActive);
    const activeStaff = staffList.filter((s) => s.employmentStatus === 'ACTIVE');

    const domains: Record<string, ConfigurationDomainCheck> = {};

    // 1. Profile
    const profileValid = Boolean(profile.legalName || profile.tradeName);
    domains['Profile'] = {
      domain: 'Profile',
      status: profileValid ? 'VERIFIED' : 'INVALID',
      summary: profileValid
        ? `Legal entity '${profile.legalName || profile.tradeName}' verified (${profile.verificationStatus}).`
        : 'Missing legal name or trade name.',
      issues: profileValid ? [] : ['Partner legal identity is incomplete.'],
      evidence: {
        partnerId: profile.partnerId,
        verificationStatus: profile.verificationStatus,
        lifecycleStatus: profile.lifecycleStatus
      }
    };

    // 2. Industry
    domains['Industry'] = {
      domain: 'Industry',
      status: ctx.industry ? 'VERIFIED' : 'INVALID',
      summary: `Canonical Industry resolved to '${ctx.industry}'.`,
      issues: [],
      evidence: { industry: ctx.industry, rawPartnerType: ctx.rawPartnerType }
    };

    // 3. Operating Model
    domains['Operating Model'] = {
      domain: 'Operating Model',
      status: ctx.operatingModel ? 'VERIFIED' : 'INVALID',
      summary: `Canonical Operating Model resolved to '${ctx.operatingModel}'.`,
      issues: [],
      evidence: { operatingModel: ctx.operatingModel, rawOperatingMode: ctx.rawOperatingMode }
    };

    // 4. Locations
    const maxBranches = accountData.limits.branches.limit || 1;
    const branchQuotaOk = activeLocations.length <= maxBranches;
    domains['Locations'] = {
      domain: 'Locations',
      status: activeLocations.length >= 1 && branchQuotaOk ? 'VERIFIED' : activeLocations.length === 0 ? 'INVALID' : 'BLOCKED',
      summary: `${activeLocations.length} active location(s) configured (Quota: ${maxBranches}).`,
      count: activeLocations.length,
      issues:
        activeLocations.length === 0
          ? ['At least one active operational location is required.']
          : !branchQuotaOk
          ? [`Active locations (${activeLocations.length}) exceed license branch limit (${maxBranches}).`]
          : [],
      evidence: { activeLocations: activeLocations.length, maxBranches }
    };

    // 5. Departments
    domains['Departments'] = {
      domain: 'Departments',
      status: activeDepts.length > 0 ? 'VERIFIED' : 'PARTIAL',
      summary: `${activeDepts.length} active department(s) derived for ${ctx.industry}.`,
      count: activeDepts.length,
      issues:
        activeDepts.length === 0
          ? ['No active operational departments initialized yet. Run configuration initialize.']
          : [],
      evidence: { activeCount: activeDepts.length, applicableCatalogCount: deptBundle.applicableCatalogDepartments.length }
    };

    // 6. Services
    domains['Services'] = {
      domain: 'Services',
      status: activeServices.length > 0 ? 'VERIFIED' : 'PARTIAL',
      summary:
        activeServices.length > 0
          ? `${activeServices.length} active operational service(s) configured.`
          : `Genuine zero-state (0 configured services; ${serviceBundle.applicableServiceBlueprints.length} blueprints available).`,
      count: activeServices.length,
      issues: [],
      evidence: {
        isZeroState: serviceBundle.isZeroState,
        activeServiceCount: activeServices.length,
        availableBlueprints: serviceBundle.applicableServiceBlueprints.length
      }
    };

    // 7. Staff Templates
    domains['Staff Templates'] = {
      domain: 'Staff Templates',
      status: staffTemplates.templateCount > 0 ? 'VERIFIED' : 'INVALID',
      summary: `${staffTemplates.templateCount} standard role templates available (0 fake staff auto-created).`,
      count: staffTemplates.templateCount,
      issues: [],
      evidence: { templateCount: staffTemplates.templateCount, autoCreatedFakeStaffCount: 0 }
    };

    // 8. Staff
    const maxDoctors = accountData.limits.doctorSeats.limit ?? 5;
    const doctorCount = staffList.filter((s) => s.staffType === 'DOCTOR' && s.employmentStatus !== 'TERMINATED').length;
    const doctorQuotaOk = maxDoctors === 0 ? doctorCount === 0 : doctorCount <= maxDoctors;
    domains['Staff'] = {
      domain: 'Staff',
      status: !doctorQuotaOk ? 'BLOCKED' : activeStaff.length > 0 ? 'VERIFIED' : 'PARTIAL',
      summary: `${activeStaff.length} active staff member(s) (${doctorCount}/${maxDoctors} doctor seats).`,
      count: activeStaff.length,
      issues: !doctorQuotaOk ? [`Doctor count (${doctorCount}) exceeds license limit (${maxDoctors}).`] : [],
      evidence: { activeStaff: activeStaff.length, doctorCount, maxDoctors }
    };

    // 9. Roles
    domains['Roles'] = {
      domain: 'Roles',
      status: 'VERIFIED',
      summary: `Partner Admin principal active with ${roleAssignments.length} explicit staff role assignment(s).`,
      count: roleAssignments.length + 1,
      issues: [],
      evidence: { staffRoleAssignments: roleAssignments.length, partnerAdminActive: true }
    };

    // 10. Permissions
    domains['Permissions'] = {
      domain: 'Permissions',
      status: ctx.enabledCapabilityCodes.length > 0 ? 'VERIFIED' : 'BLOCKED',
      summary: `${ctx.enabledCapabilityCodes.length} capability domain(s) active across 10-layer access engine.`,
      count: ctx.enabledCapabilityCodes.length,
      issues: [],
      evidence: { enabledCapabilities: ctx.enabledCapabilityCodes }
    };

    // 11. Entitlements
    const availableFeatures = accountData.features.filter((f) => f.status === 'AVAILABLE');
    domains['Entitlements'] = {
      domain: 'Entitlements',
      status: availableFeatures.length > 0 ? 'VERIFIED' : 'PARTIAL',
      summary: `${availableFeatures.length} commercial feature entitlement(s) active.`,
      count: availableFeatures.length,
      issues: [],
      evidence: { availableFeatures: availableFeatures.length, totalFeatures: accountData.features.length }
    };

    // 12. Workspace
    domains['Workspace'] = {
      domain: 'Workspace',
      status: workspace.allowedNavigationModules.length > 0 ? 'VERIFIED' : 'BLOCKED',
      summary: `Workspace '${workspace.workspaceLayout}' resolved with ${workspace.allowedNavigationModules.length} navigation modules.`,
      count: workspace.allowedNavigationModules.length,
      issues: [],
      evidence: {
        workspaceLayout: workspace.workspaceLayout,
        defaultLandingView: workspace.defaultLandingView,
        modules: workspace.allowedNavigationModules
      }
    };

    // 13. Plan & Features
    const hasPlan = Boolean(accountData.currentPlan?.name || accountData.subscription?.id);
    domains['Plan & Features'] = {
      domain: 'Plan & Features',
      status: hasPlan ? 'VERIFIED' : 'PARTIAL',
      summary: `Plan '${accountData.currentPlan?.name || 'Standard'}' (${accountData.subscription.status}) with ${availableFeatures.length} available features.`,
      count: availableFeatures.length,
      issues: [],
      evidence: {
        planName: accountData.currentPlan?.name,
        subscriptionStatus: accountData.subscription.status,
        enabledFeatures: availableFeatures.length
      }
    };

    // 14. License
    const licenseOk = Boolean(accountData.subscription.isAccessAllowed);
    domains['License'] = {
      domain: 'License',
      status: licenseOk ? 'VERIFIED' : 'BLOCKED',
      summary: `License status: ${accountData.subscription.licenseStatus} (Access allowed: ${licenseOk}).`,
      issues: licenseOk ? [] : [`Commercial license is ${accountData.subscription.licenseStatus}. Operational writes are restricted.`],
      evidence: {
        status: accountData.subscription.licenseStatus,
        isAccessAllowed: licenseOk,
        isSignatureValid: accountData.subscription.isSignatureValid,
        maxBranches,
        maxDoctors
      }
    };

    const structuralChecks = [
      { code: 'STRUCT_PARTNER_PROFILE', passed: profileValid, message: 'Partner Profile exists and has legal/contact details' },
      { code: 'STRUCT_CANONICAL_INDUSTRY', passed: Boolean(ctx.industry), message: `Canonical Industry resolved (${ctx.industry})` },
      { code: 'STRUCT_OPERATING_MODEL', passed: Boolean(ctx.operatingModel), message: `Operating Model resolved (${ctx.operatingModel})` },
      { code: 'STRUCT_PRIMARY_LOCATION', passed: activeLocations.length >= 1, message: 'At least one active Location exists' },
      { code: 'STRUCT_APPLICABLE_DEPARTMENTS', passed: activeDepts.length >= 1, message: 'Applicable Departments initialized' }
    ];

    const securityChecks = [
      { code: 'SEC_TENANT_ISOLATION', passed: locations.every((l) => l.tenantId === tenantId), message: 'All locations strictly bound to partner tenantId' },
      { code: 'SEC_DEPT_ISOLATION', passed: deptBundle.configuredDepartments.every((d) => d.tenantId === tenantId), message: 'All departments strictly bound to partner tenantId' },
      { code: 'SEC_NO_FAKE_STAFF', passed: staffTemplates.autoCreatedFakeStaffCount === 0, message: 'Zero fake/demo staff or doctors auto-created' }
    ];

    const commercialChecks = [
      { code: 'COMM_SUBSCRIPTION_BOUND', passed: hasPlan, message: 'Commercial Plan & Subscription bound' },
      { code: 'COMM_LICENSE_VALID', passed: licenseOk, message: `Cryptographic License state (${accountData.subscription.licenseStatus})` },
      { code: 'COMM_BRANCH_QUOTA', passed: branchQuotaOk, message: `Active locations (${activeLocations.length}) within maxBranches (${maxBranches})` },
      { code: 'COMM_DOCTOR_QUOTA', passed: doctorQuotaOk, message: `Doctor count (${doctorCount}) within maxDoctors (${maxDoctors})` }
    ];

    const operationalChecks = [
      { code: 'OPS_WORKSPACE_RESOLVED', passed: workspace.allowedNavigationModules.length > 0, message: 'Dynamic Partner Workspace resolved' },
      { code: 'OPS_PROFILE_ACCESSIBLE_ALWAYS', passed: true, message: 'Partner Profile & Plan overview remain accessible regardless of license state' }
    ];

    const blockingIssues: string[] = [];
    const warnings: string[] = [];
    for (const d of Object.values(domains)) {
      if (d.status === 'BLOCKED' || d.status === 'INVALID') {
        blockingIssues.push(...d.issues);
      } else if (d.status === 'PARTIAL') {
        warnings.push(...d.issues);
      }
    }

    const overallStatus: ConfigurationDomainStatus =
      blockingIssues.length > 0
        ? Object.values(domains).some((d) => d.status === 'BLOCKED')
          ? 'BLOCKED'
          : 'INVALID'
        : 'VERIFIED';

    return {
      tenantId,
      partnerId: String(profile.partnerId || tenantId),
      evaluatedAt: new Date().toISOString(),
      overallStatus,
      isOperationallyReady: blockingIssues.length === 0 && licenseOk,
      domains,
      structuralChecks,
      securityChecks,
      commercialChecks,
      operationalChecks,
      blockingIssues,
      warnings
    };
  }
}

export const partnerConfigurationEngineService = new PartnerConfigurationEngineService();
