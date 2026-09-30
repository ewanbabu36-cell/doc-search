import crypto from 'node:crypto';
import {
  getDatabase,
  partnerProfiles,
  licenses,
  partnerCapabilities,
  operationalDepartments,
  operationalStaff,
  staffCredentials,
  breakGlassAccess,
  users,
  eq,
  and,
  desc
} from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { licenseService } from '../company/LicenseService.js';

export type StaffLifecycleStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING';

export type CredentialLifecycleStatus =
  | 'VALID'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'MISSING'
  | 'PENDING_VERIFICATION';

export type CanonicalAccessDecisionType =
  | 'ALLOW'
  | 'DENY'
  | 'ESCALATE'
  | 'BREAK_GLASS_REQUIRED'
  | 'MAKER_CHECKER_REQUIRED';

export interface CanonicalIdentityContext {
  userId: string;
  partnerId: string;
  tenantId: string;
  organizationId: string;
  staffId: string | null;
  actorEmail: string;
  roleIds: string[];
  roleCodes: string[];
  permissionIds: string[];
  effectivePermissions: string[];
  departmentIds: string[];
  departmentCodes: string[];
  locationIds: string[];
  staffStatus: StaffLifecycleStatus;
  credentialStatus: CredentialLifecycleStatus;
  credentials: Array<{
    id: string;
    credentialType: string;
    registrationNumber: string;
    status: CredentialLifecycleStatus;
    expiryDate: string;
  }>;
  industry: string;
  operatingModel: string;
  entitlementContext: {
    planCode: string;
    licenseStatus: string;
    subscriptionStatus: string;
    entitledCapabilities: string[];
    disabledFeatures: string[];
    isCommercialValid: boolean;
  };
  dataScope: 'global' | 'tenant' | 'branch' | 'department' | 'own';
  sessionId: string;
  isSuperAdmin: boolean;
  authenticated: boolean;
}

export interface AuthorizationResourceTarget {
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  partnerId?: string | undefined;
  tenantId?: string | undefined;
  departmentId?: string | undefined;
  departmentCode?: string | undefined;
  locationId?: string | undefined;
  branchId?: string | undefined;
  patientId?: string | undefined;
  encounterId?: string | undefined;
  confidentialPatient?: boolean | undefined;
  assignedDoctorId?: string | undefined;
  assignedStaffId?: string | undefined;
}

export interface AuthorizationEvaluationContext {
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  clientSuppliedPartnerId?: string | undefined;
  clientSuppliedTenantId?: string | undefined;
  clientSuppliedUserId?: string | undefined;
  clientSuppliedStaffId?: string | undefined;
  clientSuppliedRole?: string | undefined;
  clientSuppliedPermissions?: string[] | undefined;
  clientSuppliedDepartmentId?: string | undefined;
  clientSuppliedLocationId?: string | undefined;
  requireValidCredential?: boolean | undefined;
  requiredCredentialTypes?: string[] | undefined;
  requireMakerChecker?: boolean | undefined;
  makerCheckerRequestId?: string | undefined;
  allowBreakGlassEscalation?: boolean | undefined;
  featureDisabledOverride?: boolean | undefined;
  licenseStatusOverride?: string | undefined;
  entitlementMissingOverride?: boolean | undefined;
  beforeState?: Record<string, unknown> | undefined;
  afterState?: Record<string, unknown> | undefined;
}

export interface CanonicalAccessDecision {
  decision: CanonicalAccessDecisionType;
  allowed: boolean;
  reasonCode: string;
  reason: string;
  policyVersion: string;
  subject: {
    userId: string;
    staffId: string | null;
    partnerId: string;
    roles: string[];
    departmentIds: string[];
    locationIds: string[];
    staffStatus: StaffLifecycleStatus;
    credentialStatus: CredentialLifecycleStatus;
  };
  action: string;
  normalizedAction: string;
  resource: AuthorizationResourceTarget;
  breakGlass: {
    required: boolean;
    active: boolean;
    breakGlassId?: string | undefined;
    reason?: string | undefined;
    expiresAt?: string | undefined;
  };
  makerChecker: {
    required: boolean;
    satisfied: boolean;
    requestId?: string | undefined;
    makerUserId?: string | undefined;
    checkerUserId?: string | undefined;
  };
  diagnostics: {
    permissionPresent: boolean;
    roleContainsPermission: boolean;
    partnerScopeValid: boolean;
    departmentScopeValid: boolean;
    locationScopeValid: boolean;
    patientScopeValid: boolean;
    encounterScopeValid: boolean;
    staffStatus: StaffLifecycleStatus;
    credentialStatus: CredentialLifecycleStatus;
    entitlementValid: boolean;
    licenseStatus: string;
    featureEnabled: boolean;
    makerCheckerRequired: boolean;
    breakGlassRequired: boolean;
    reasons: string[];
  };
  auditEventId: string;
  timestamp: string;
}

export interface MakerCheckerRequestRecord {
  id: string;
  partnerId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown>;
  makerUserId: string;
  makerStaffId: string | null;
  makerRole: string;
  checkerUserId: string | null;
  checkerStaffId: string | null;
  checkerRole: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  decisionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface CustomRoleRecord {
  id: string;
  partnerId: string;
  code: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'DISABLED';
  isSystem: boolean;
  version: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Deterministic Canonical Permission Registry (DOMAIN:RESOURCE:ACTION)
 */
export const CANONICAL_PERMISSION_REGISTRY: Record<
  string,
  {
    code: string;
    domain: string;
    resource: string;
    action: string;
    description: string;
    requiredCapability: string;
    requiresValidCredential: boolean;
    requiresMakerChecker: boolean;
    aliases: string[];
  }
> = {
  'PATIENT:READ': {
    code: 'PATIENT:READ',
    domain: 'PATIENT',
    resource: 'PATIENT',
    action: 'READ',
    description: 'View patient demographic and clinical chart within scope',
    requiredCapability: 'PATIENT_REGISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['clinical:patients:read', 'patients:read', 'patient.view', 'patient:record:view', 'patient:read']
  },
  'PATIENT:CREATE': {
    code: 'PATIENT:CREATE',
    domain: 'PATIENT',
    resource: 'PATIENT',
    action: 'CREATE',
    description: 'Register new patient record in facility MPI',
    requiredCapability: 'PATIENT_REGISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['clinical:patients:create', 'patients:create', 'patient.create', 'patient:record:create', 'patient:register']
  },
  'PATIENT:UPDATE': {
    code: 'PATIENT:UPDATE',
    domain: 'PATIENT',
    resource: 'PATIENT',
    action: 'UPDATE',
    description: 'Update patient demographic or clinical profile',
    requiredCapability: 'PATIENT_REGISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['clinical:patients:update', 'patients:update', 'patient.update', 'patient:update']
  },
  'ENCOUNTER:READ': {
    code: 'ENCOUNTER:READ',
    domain: 'ENCOUNTER',
    resource: 'ENCOUNTER',
    action: 'READ',
    description: 'Read clinical encounter and consultation records within scope',
    requiredCapability: 'OPD',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['clinical:encounters:read', 'encounters:read', 'clinical.consultation.view', 'appointment.view', 'encounter:read']
  },
  'ENCOUNTER:CREATE': {
    code: 'ENCOUNTER:CREATE',
    domain: 'ENCOUNTER',
    resource: 'ENCOUNTER',
    action: 'CREATE',
    description: 'Create new OPD/IPD/ER patient encounter',
    requiredCapability: 'OPD',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['clinical:encounters:create', 'encounters:create', 'appointment.create', 'encounter:create']
  },
  'ENCOUNTER:UPDATE': {
    code: 'ENCOUNTER:UPDATE',
    domain: 'ENCOUNTER',
    resource: 'ENCOUNTER',
    action: 'UPDATE',
    description: 'Author or update clinical encounter consultation notes',
    requiredCapability: 'OPD',
    requiresValidCredential: true,
    requiresMakerChecker: false,
    aliases: ['clinical:encounters:update', 'encounters:update', 'clinical.consultation.author', 'clinical:consultation:author', 'encounter:update']
  },
  'PRESCRIPTION:SIGN': {
    code: 'PRESCRIPTION:SIGN',
    domain: 'PRESCRIPTION',
    resource: 'PRESCRIPTION',
    action: 'SIGN',
    description: 'Author and digitally sign clinical medication prescriptions',
    requiredCapability: 'PRESCRIPTION',
    requiresValidCredential: true,
    requiresMakerChecker: false,
    aliases: ['clinical:prescriptions:create', 'clinical.prescription.sign', 'clinical:prescription:sign', 'clinical.prescription.create', 'prescription:sign']
  },
  'LAB:ORDER': {
    code: 'LAB:ORDER',
    domain: 'LAB',
    resource: 'ORDER',
    action: 'ORDER',
    description: 'Order laboratory diagnostic investigations',
    requiredCapability: 'LABORATORY',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['lab:orders:create', 'lab:order', 'investigation.order', 'lab.order.create']
  },
  'LAB:READ': {
    code: 'LAB:READ',
    domain: 'LAB',
    resource: 'ORDER',
    action: 'READ',
    description: 'Read laboratory diagnostic orders and results',
    requiredCapability: 'LABORATORY',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['lab:orders:read', 'lab.order.view', 'lab:order:view', 'investigation.view', 'lab:read']
  },
  'LAB:RESULT': {
    code: 'LAB:RESULT',
    domain: 'LAB',
    resource: 'RESULT',
    action: 'RESULT',
    description: 'Enter laboratory diagnostic test results',
    requiredCapability: 'LABORATORY',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['lab:results:create', 'lab.result.enter', 'lab:result:enter', 'lab:result']
  },
  'LAB:VALIDATE': {
    code: 'LAB:VALIDATE',
    domain: 'LAB',
    resource: 'RESULT',
    action: 'VALIDATE',
    description: 'Validate and sign pathology/laboratory diagnostic reports',
    requiredCapability: 'LABORATORY',
    requiresValidCredential: true,
    requiresMakerChecker: false,
    aliases: ['lab:results:validate', 'lab.result.validate', 'lab:result:validate', 'lab:validate']
  },
  'RADIOLOGY:VALIDATE': {
    code: 'RADIOLOGY:VALIDATE',
    domain: 'RADIOLOGY',
    resource: 'REPORT',
    action: 'VALIDATE',
    description: 'Validate and finalize radiology imaging reports',
    requiredCapability: 'RADIOLOGY',
    requiresValidCredential: true,
    requiresMakerChecker: false,
    aliases: ['radiology:reports:validate', 'radiology.report.sign', 'radiology:report:sign', 'radiology:validate']
  },
  'PHARMACY:DISPENSE': {
    code: 'PHARMACY:DISPENSE',
    domain: 'PHARMACY',
    resource: 'DISPENSE',
    action: 'DISPENSE',
    description: 'Dispense medications against verified prescriptions',
    requiredCapability: 'PHARMACY',
    requiresValidCredential: true,
    requiresMakerChecker: false,
    aliases: ['pharmacy:dispense:create', 'pharmacy.dispense', 'pharmacy.dispense.create', 'pharmacy:dispense']
  },
  'BILLING:CREATE': {
    code: 'BILLING:CREATE',
    domain: 'BILLING',
    resource: 'INVOICE',
    action: 'CREATE',
    description: 'Create patient billing invoice and collect payment',
    requiredCapability: 'BILLING',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['billing:invoices:create', 'invoice.create', 'billing:invoice:create', 'billing:create']
  },
  'BILLING:REFUND': {
    code: 'BILLING:REFUND',
    domain: 'BILLING',
    resource: 'REFUND',
    action: 'REFUND',
    description: 'Execute governed financial refund (requires Maker-Checker approval)',
    requiredCapability: 'BILLING',
    requiresValidCredential: false,
    requiresMakerChecker: true,
    aliases: ['billing:refunds:create', 'invoice.refund', 'billing:refund']
  },
  'SECURITY:DIAGNOSTICS:READ': {
    code: 'SECURITY:DIAGNOSTICS:READ',
    domain: 'SECURITY',
    resource: 'DIAGNOSTICS',
    action: 'READ',
    description: 'Inspect structured authorization denial diagnostics',
    requiredCapability: 'RBAC_ADMINISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['security:diagnostics:read', 'executive.audit.view']
  },
  'SECURITY:RBAC:MANAGE': {
    code: 'SECURITY:RBAC:MANAGE',
    domain: 'SECURITY',
    resource: 'RBAC',
    action: 'MANAGE',
    description: 'Create, update, disable roles and manage role permissions within partner scope',
    requiredCapability: 'RBAC_ADMINISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['security:rbac:manage', 'partners:create', 'partners:update']
  },
  'SECURITY:MAKER_CHECKER:APPROVE': {
    code: 'SECURITY:MAKER_CHECKER:APPROVE',
    domain: 'SECURITY',
    resource: 'MAKER_CHECKER',
    action: 'APPROVE',
    description: 'Approve or reject dual-control Maker-Checker requests',
    requiredCapability: 'RBAC_ADMINISTRATION',
    requiresValidCredential: false,
    requiresMakerChecker: false,
    aliases: ['security:maker_checker:approve', 'approvals:approve']
  }
};

/**
 * Default Canonical Role -> Deterministic Permission Mapping
 */
export const CANONICAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  COMPANY_ADMIN: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  PARTNER_ADMIN: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  HOSPITAL_ADMIN: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  CLINIC_ADMIN: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  HOSPITAL_DIRECTOR: Object.keys(CANONICAL_PERMISSION_REGISTRY),
  DOCTOR: [
    'PATIENT:READ',
    'PATIENT:CREATE',
    'PATIENT:UPDATE',
    'ENCOUNTER:READ',
    'ENCOUNTER:CREATE',
    'ENCOUNTER:UPDATE',
    'PRESCRIPTION:SIGN',
    'LAB:ORDER',
    'LAB:READ'
  ],
  CLINIC_DOCTOR: [
    'PATIENT:READ',
    'PATIENT:CREATE',
    'PATIENT:UPDATE',
    'ENCOUNTER:READ',
    'ENCOUNTER:CREATE',
    'ENCOUNTER:UPDATE',
    'PRESCRIPTION:SIGN',
    'LAB:ORDER',
    'LAB:READ'
  ],
  ATTENDING_DOCTOR: [
    'PATIENT:READ',
    'PATIENT:CREATE',
    'PATIENT:UPDATE',
    'ENCOUNTER:READ',
    'ENCOUNTER:CREATE',
    'ENCOUNTER:UPDATE',
    'PRESCRIPTION:SIGN',
    'LAB:ORDER',
    'LAB:READ'
  ],
  NURSE: ['PATIENT:READ', 'ENCOUNTER:READ'],
  STAFF_NURSE: ['PATIENT:READ', 'ENCOUNTER:READ'],
  HEAD_NURSE: ['PATIENT:READ', 'PATIENT:UPDATE', 'ENCOUNTER:READ', 'ENCOUNTER:UPDATE'],
  LAB_TECHNICIAN: ['PATIENT:READ', 'LAB:READ', 'LAB:RESULT'],
  PATHOLOGIST: ['PATIENT:READ', 'LAB:READ', 'LAB:RESULT', 'LAB:VALIDATE'],
  RADIOLOGIST: ['PATIENT:READ', 'ENCOUNTER:READ', 'RADIOLOGY:VALIDATE'],
  PHARMACIST: ['PATIENT:READ', 'PHARMACY:DISPENSE', 'BILLING:CREATE'],
  DISPENSING_PHARMACIST: ['PATIENT:READ', 'PHARMACY:DISPENSE', 'BILLING:CREATE'],
  BILLING_EXECUTIVE: ['PATIENT:READ', 'BILLING:CREATE', 'BILLING:REFUND'],
  RECEPTIONIST: ['PATIENT:READ', 'PATIENT:CREATE', 'ENCOUNTER:READ', 'ENCOUNTER:CREATE', 'BILLING:CREATE']
};

export class IdentitySecurityFoundationService {
  private readonly policyVersion = 'PHASE-3-RBAC-ABAC-v1.0';
  private customRolesByTenant = new Map<string, Map<string, CustomRoleRecord>>();
  private disabledRoleCodesByTenant = new Map<string, Set<string>>();
  private staffStatusOverrides = new Map<string, StaffLifecycleStatus>();
  private staffDepartmentOverrides = new Map<string, string[]>();
  private staffLocationOverrides = new Map<string, string[]>();
  private credentialStatusOverrides = new Map<string, CredentialLifecycleStatus>();
  private patientScopeRegistry = new Map<
    string,
    {
      patientId: string;
      partnerId: string;
      locationId: string;
      departmentId: string;
      assignedDoctorId?: string | undefined;
      confidential?: boolean | undefined;
    }
  >();
  private encounterScopeRegistry = new Map<
    string,
    {
      encounterId: string;
      patientId: string;
      partnerId: string;
      locationId: string;
      departmentId: string;
      encounterType: string;
      status: string;
      assignedDoctorId?: string | undefined;
    }
  >();
  private makerCheckerStore = new Map<string, MakerCheckerRequestRecord>();
  private breakGlassStore = new Map<
    string,
    {
      id: string;
      partnerId: string;
      userId: string;
      patientId: string;
      reason: string;
      triggeredAt: string;
      expiresAt: number;
      revokedAt: string | null;
    }
  >();
  private securityAuditLog: Array<Record<string, any>> = [];
  private identityCache = new Map<string, { expiresAt: number; context: CanonicalIdentityContext }>();

  /**
   * Normalizes any action/permission string to canonical DOMAIN:RESOURCE:ACTION format
   */
  public normalizeAction(rawAction: string): string {
    const trimmed = String(rawAction || '').trim();
    const upper = trimmed.toUpperCase();
    if (CANONICAL_PERMISSION_REGISTRY[upper]) {
      return upper;
    }
    const lower = trimmed.toLowerCase();
    for (const [canonicalCode, def] of Object.entries(CANONICAL_PERMISSION_REGISTRY)) {
      if (def.aliases.some((a) => a.toLowerCase() === lower)) {
        return canonicalCode;
      }
    }
    return upper.replace(/\./g, ':');
  }

  /**
   * Invalidates cached identity / permission resolution immediately on any security change
   */
  public invalidateSecurityCache(partnerId?: string, userId?: string, staffId?: string): void {
    if (!partnerId && !userId && !staffId) {
      this.identityCache.clear();
      return;
    }
    for (const key of this.identityCache.keys()) {
      if (
        (partnerId && key.includes(partnerId)) ||
        (userId && key.includes(userId)) ||
        (staffId && key.includes(staffId))
      ) {
        this.identityCache.delete(key);
      }
    }
  }

  /**
   * Registers or updates staff status / location / department / credential state and invalidates cache
   */
  public setStaffRuntimeState(params: {
    partnerId: string;
    userId?: string | undefined;
    staffId: string;
    staffStatus?: StaffLifecycleStatus | undefined;
    departmentIds?: string[] | undefined;
    locationIds?: string[] | undefined;
    credentialStatus?: CredentialLifecycleStatus | undefined;
  }): void {
    const key = `${params.partnerId}:${params.staffId}`;
    const userKey = params.userId ? `${params.partnerId}:${params.userId}` : null;
    if (params.staffStatus) {
      this.staffStatusOverrides.set(key, params.staffStatus);
      if (userKey) this.staffStatusOverrides.set(userKey, params.staffStatus);
    }
    if (params.departmentIds) {
      this.staffDepartmentOverrides.set(key, params.departmentIds);
      if (userKey) this.staffDepartmentOverrides.set(userKey, params.departmentIds);
    }
    if (params.locationIds) {
      this.staffLocationOverrides.set(key, params.locationIds);
      if (userKey) this.staffLocationOverrides.set(userKey, params.locationIds);
    }
    if (params.credentialStatus) {
      this.credentialStatusOverrides.set(key, params.credentialStatus);
      if (userKey) this.credentialStatusOverrides.set(userKey, params.credentialStatus);
    }
    this.invalidateSecurityCache(params.partnerId, params.userId, params.staffId);
  }

  /**
   * Registers patient scope metadata for deterministic ABAC evaluation
   */
  public registerPatientScope(record: {
    patientId: string;
    partnerId: string;
    locationId: string;
    departmentId: string;
    assignedDoctorId?: string | undefined;
    confidential?: boolean | undefined;
  }): void {
    this.patientScopeRegistry.set(record.patientId, record);
  }

  /**
   * Registers encounter scope metadata for deterministic ABAC evaluation
   */
  public registerEncounterScope(record: {
    encounterId: string;
    patientId: string;
    partnerId: string;
    locationId: string;
    departmentId: string;
    encounterType: string;
    status: string;
    assignedDoctorId?: string | undefined;
  }): void {
    this.encounterScopeRegistry.set(record.encounterId, record);
  }

  // =========================================================================
  // STEP 2 — MASTER IDENTITY MODEL RESOLUTION
  // =========================================================================

  public async resolveCanonicalIdentity(
    session: SessionContext | null | undefined
  ): Promise<CanonicalIdentityContext | null> {
    if (!session || !session.userId || !session.tenantId) {
      return null;
    }

    const partnerId = String(session.tenantId).trim();
    const userId = String(session.userId).trim();
    const cacheKey = `${partnerId}:${userId}:${session.sessionId || ''}`;
    const cached = this.identityCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    const db = getDatabase();
    const tenantUuid = partnerId.includes('-') && partnerId.length === 36 ? partnerId : toDeterministicUuid(partnerId);

    let staffId: string | null = (session as any).staffId ? String((session as any).staffId) : null;
    let staffStatus: StaffLifecycleStatus = 'ACTIVE';
    let credentialStatus: CredentialLifecycleStatus = 'VALID';
    const credentialsList: CanonicalIdentityContext['credentials'] = [];
    const departmentIds = new Set<string>();
    const departmentCodes = new Set<string>();
    const locationIds = new Set<string>();

    if (session.departmentId) {
      departmentIds.add(String(session.departmentId));
      departmentCodes.add(String(session.departmentId).toUpperCase());
    }
    if (session.branchId) {
      locationIds.add(String(session.branchId));
    }

    // Check DB operationalStaff & staffCredentials
    if (db) {
      try {
        const staffRows = await db
          .select()
          .from(operationalStaff)
          .where(eq(operationalStaff.tenantId, tenantUuid));

        const matchedStaff = staffRows.find(
          (s: any) =>
            s.id === staffId ||
            s.id === userId ||
            (session.actorEmail && String(s.workEmail || '').toLowerCase() === session.actorEmail.toLowerCase())
        );

        if (matchedStaff) {
          staffId = matchedStaff.id;
          const rawStatus = String(matchedStaff.employmentStatus || 'ACTIVE').toUpperCase();
          if (rawStatus === 'SUSPENDED') staffStatus = 'SUSPENDED';
          else if (rawStatus === 'INACTIVE' || rawStatus === 'TERMINATED' || rawStatus === 'ON_LEAVE') staffStatus = 'INACTIVE';
          else if (rawStatus === 'DISABLED') staffStatus = 'DISABLED';
          else if (rawStatus === 'PENDING' || rawStatus === 'INVITED') staffStatus = 'PENDING';
          else staffStatus = 'ACTIVE';

          if (matchedStaff.departmentId) {
            departmentIds.add(String(matchedStaff.departmentId));
            departmentCodes.add(String(matchedStaff.departmentId).toUpperCase());
          }
          if (matchedStaff.branchId) {
            locationIds.add(String(matchedStaff.branchId));
          }

          // Resolve department code from operationalDepartments
          if (matchedStaff.departmentId) {
            try {
              const [deptRow] = await db
                .select()
                .from(operationalDepartments)
                .where(eq(operationalDepartments.id, matchedStaff.departmentId))
                .limit(1);
              if (deptRow?.departmentCode) {
                departmentCodes.add(String(deptRow.departmentCode).toUpperCase());
              }
            } catch {}
          }

          // Resolve credentials from staffCredentials
          const credRows = await db
            .select()
            .from(staffCredentials)
            .where(and(eq(staffCredentials.tenantId, tenantUuid), eq(staffCredentials.staffId, matchedStaff.id)));

          if (credRows.length > 0) {
            const nowMs = Date.now();
            for (const c of credRows) {
              const expMs = c.expiryDate ? new Date(c.expiryDate).getTime() : nowMs + 86400000;
              const vStat = String(c.verificationStatus || 'VERIFIED').toUpperCase();
              let cStatus: CredentialLifecycleStatus = 'VALID';
              if (vStat === 'REVOKED') cStatus = 'REVOKED';
              else if (vStat === 'SUSPENDED') cStatus = 'SUSPENDED';
              else if (vStat === 'EXPIRED' || expMs <= nowMs) cStatus = 'EXPIRED';
              else if (vStat === 'PENDING' || vStat === 'PENDING_VERIFICATION') cStatus = 'PENDING_VERIFICATION';

              credentialsList.push({
                id: c.id,
                credentialType: c.credentialType,
                registrationNumber: c.registrationNumber,
                status: cStatus,
                expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString() : String(c.expiryDate)
              });
            }
            // Determine effective credentialStatus
            if (credentialsList.some((c) => c.status === 'VALID')) {
              credentialStatus = 'VALID';
            } else if (credentialsList.some((c) => c.status === 'REVOKED')) {
              credentialStatus = 'REVOKED';
            } else if (credentialsList.some((c) => c.status === 'SUSPENDED')) {
              credentialStatus = 'SUSPENDED';
            } else if (credentialsList.some((c) => c.status === 'EXPIRED')) {
              credentialStatus = 'EXPIRED';
            } else {
              credentialStatus = 'PENDING_VERIFICATION';
            }
          }
        }
      } catch {}
    }

    // Apply immediate runtime state overrides (staff suspension, reassignment, credential revocation)
    const staffOverrideKey = staffId ? `${partnerId}:${staffId}` : null;
    const userOverrideKey = `${partnerId}:${userId}`;
    const overrideStatus =
      (staffOverrideKey && this.staffStatusOverrides.get(staffOverrideKey)) ||
      this.staffStatusOverrides.get(userOverrideKey) ||
      ((session as any).staffStatus as StaffLifecycleStatus | undefined);
    if (overrideStatus) {
      staffStatus = overrideStatus;
    }

    const overrideDepts =
      (staffOverrideKey && this.staffDepartmentOverrides.get(staffOverrideKey)) ||
      this.staffDepartmentOverrides.get(userOverrideKey);
    if (overrideDepts) {
      departmentIds.clear();
      departmentCodes.clear();
      for (const d of overrideDepts) {
        departmentIds.add(d);
        departmentCodes.add(d.toUpperCase());
      }
    }

    const overrideLocs =
      (staffOverrideKey && this.staffLocationOverrides.get(staffOverrideKey)) ||
      this.staffLocationOverrides.get(userOverrideKey);
    if (overrideLocs) {
      locationIds.clear();
      for (const l of overrideLocs) {
        locationIds.add(l);
      }
    }

    const overrideCred =
      (staffOverrideKey && this.credentialStatusOverrides.get(staffOverrideKey)) ||
      this.credentialStatusOverrides.get(userOverrideKey) ||
      ((session as any).credentialStatus as CredentialLifecycleStatus | undefined);
    if (overrideCred) {
      credentialStatus = overrideCred;
    }

    // Filter out disabled roles in this tenant
    const disabledSet = this.disabledRoleCodesByTenant.get(partnerId) || new Set<string>();
    const activeRoleCodes = (session.roles || [])
      .map((r) => String(r).toUpperCase().trim())
      .filter((r) => r.length > 0 && !disabledSet.has(r));

    // Compute deterministic effective permissions from active roles + custom tenant roles
    const effectivePerms = new Set<string>();
    const tenantCustomRoles = this.customRolesByTenant.get(partnerId);

    for (const roleCode of activeRoleCodes) {
      const stdPerms = CANONICAL_ROLE_PERMISSIONS[roleCode] || [];
      for (const p of stdPerms) {
        effectivePerms.add(p);
      }
      const customRole = tenantCustomRoles?.get(roleCode);
      if (customRole && customRole.status === 'ACTIVE') {
        for (const p of customRole.permissions) {
          effectivePerms.add(this.normalizeAction(p));
        }
      }
    }

    // Also normalize any explicit session permissions if caller has active roles
    if (activeRoleCodes.length > 0) {
      for (const rawP of session.permissions || []) {
        if (rawP === '*') {
          if (
            activeRoleCodes.some((r) =>
              ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'OWNER'].includes(r)
            )
          ) {
            for (const k of Object.keys(CANONICAL_PERMISSION_REGISTRY)) {
              effectivePerms.add(k);
            }
          }
        } else {
          effectivePerms.add(this.normalizeAction(rawP));
        }
      }
    }

    // Resolve Partner Industry, Operating Model & Commercial Entitlements
    let industry = 'MULTISPECIALTY_HOSPITAL';
    let operatingModel = 'IPD_PLUS_OPD';
    let planCode = 'HOSPITAL_GROWTH';
    let licenseStatus = 'ACTIVE';
    let subscriptionStatus = 'ACTIVE';
    let entitledCapabilities = Object.values(CANONICAL_PERMISSION_REGISTRY).map((v) => v.requiredCapability);
    const disabledFeatures: string[] = [];

    if (db) {
      try {
        const [profile] = await db
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.tenantId, tenantUuid))
          .limit(1);
        if (profile) {
          const meta = (profile.metadata || {}) as Record<string, any>;
          industry = String(meta['industry'] || profile.partnerType || industry).toUpperCase();
          operatingModel = String(meta['operatingModel'] || meta['operatingMode'] || operatingModel).toUpperCase();
        }

        const licRows = await db
          .select()
          .from(licenses)
          .where(eq(licenses.partnerId, tenantUuid))
          .orderBy(desc(licenses.createdAt));
        let lic = licRows[0];
        if (!lic) {
          const [licByTenant] = await db
            .select()
            .from(licenses)
            .where(eq(licenses.tenantId, tenantUuid))
            .orderBy(desc(licenses.createdAt))
            .limit(1);
          lic = licByTenant;
        }
        if (lic) {
          const evalResult = licenseService.evaluateLicenseStatus(lic, new Date());
          licenseStatus = evalResult.status;
          planCode = String(lic.planId || planCode);
        }

        const partnerCaps = await db
          .select()
          .from(partnerCapabilities)
          .where(eq(partnerCapabilities.tenantId, tenantUuid));
        if (partnerCaps.length > 0) {
          entitledCapabilities = partnerCaps
            .filter((c) => c.status === 'ACTIVE')
            .map((c) => c.capabilityCode.toUpperCase());
          for (const c of partnerCaps) {
            if (c.status !== 'ACTIVE') {
              disabledFeatures.push(c.capabilityCode.toUpperCase());
            }
          }
        }
      } catch {}
    }

    const identityCtx: CanonicalIdentityContext = {
      userId,
      partnerId,
      tenantId: partnerId,
      organizationId: session.organizationId || partnerId,
      staffId,
      actorEmail: session.actorEmail || `${userId}@partner.local`,
      roleIds: activeRoleCodes.map((r) => `role_${r.toLowerCase()}`),
      roleCodes: activeRoleCodes,
      permissionIds: Array.from(effectivePerms).map((p) => `perm_${p.toLowerCase().replace(/:/g, '_')}`),
      effectivePermissions: Array.from(effectivePerms),
      departmentIds: Array.from(departmentIds),
      departmentCodes: Array.from(departmentCodes),
      locationIds: Array.from(locationIds),
      staffStatus,
      credentialStatus,
      credentials: credentialsList,
      industry,
      operatingModel,
      entitlementContext: {
        planCode,
        licenseStatus,
        subscriptionStatus,
        entitledCapabilities: Array.from(new Set(entitledCapabilities)),
        disabledFeatures,
        isCommercialValid: licenseStatus === 'ACTIVE' || licenseStatus === 'GRACE_PERIOD'
      },
      dataScope: session.dataScope || 'branch',
      sessionId: session.sessionId,
      isSuperAdmin: Boolean(session.isSuperAdmin),
      authenticated: true
    };

    this.identityCache.set(cacheKey, {
      expiresAt: Date.now() + 5000,
      context: identityCtx
    });

    return identityCtx;
  }

  // =========================================================================
  // STEP 3 — CENTRALIZED RBAC ENGINE (ROLE & PERMISSION LIFECYCLE)
  // =========================================================================

  public getPermissionRegistry() {
    return Object.values(CANONICAL_PERMISSION_REGISTRY);
  }

  public async createCustomRole(
    session: SessionContext,
    input: {
      code: string;
      name: string;
      description?: string;
      permissions: string[];
    }
  ): Promise<CustomRoleRecord> {
    const callerIdentity = await this.resolveCanonicalIdentity(session);
    if (!callerIdentity) {
      throw AppError.unauthorized('Authentication required');
    }

    // Enforce anti-escalation: caller must hold SECURITY:RBAC:MANAGE and cannot grant wildcard '*' or permissions they do not possess
    if (
      !callerIdentity.isSuperAdmin &&
      !callerIdentity.effectivePermissions.includes('SECURITY:RBAC:MANAGE')
    ) {
      throw new AppError({
        message: 'Access denied: Insufficient permissions to create roles (requires SECURITY:RBAC:MANAGE)',
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        statusCode: 403
      });
    }

    const normalizedPerms: string[] = [];
    for (const rawPerm of input.permissions || []) {
      if (rawPerm === '*' || rawPerm.toLowerCase() === 'all') {
        throw new AppError({
          message: 'Privilege escalation blocked: Wildcard (*) permission assignment is strictly forbidden.',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      const norm = this.normalizeAction(rawPerm);
      if (!CANONICAL_PERMISSION_REGISTRY[norm]) {
        throw new AppError({
          message: `Fail-closed: Unknown permission "${rawPerm}" is not in the canonical permission registry.`,
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400
        });
      }
      if (!callerIdentity.isSuperAdmin && !callerIdentity.effectivePermissions.includes(norm)) {
        throw new AppError({
          message: `Privilege escalation blocked: Caller cannot grant permission "${norm}" that caller does not hold.`,
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }
      normalizedPerms.push(norm);
    }

    const roleCode = String(input.code || '').toUpperCase().trim();
    if (!roleCode) {
      throw AppError.badRequest('Role code is required');
    }

    const partnerId = callerIdentity.partnerId;
    if (!this.customRolesByTenant.has(partnerId)) {
      this.customRolesByTenant.set(partnerId, new Map());
    }
    const tenantMap = this.customRolesByTenant.get(partnerId)!;
    const nowIso = new Date().toISOString();

    const record: CustomRoleRecord = {
      id: crypto.randomUUID(),
      partnerId,
      code: roleCode,
      name: input.name || roleCode,
      description: input.description || '',
      status: 'ACTIVE',
      isSystem: false,
      version: 1,
      permissions: Array.from(new Set(normalizedPerms)),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    tenantMap.set(roleCode, record);
    this.invalidateSecurityCache(partnerId);

    await this.recordSecurityAudit({
      actorUserId: callerIdentity.userId,
      actorStaffId: callerIdentity.staffId,
      partnerId,
      role: callerIdentity.roleCodes[0] || 'UNKNOWN',
      action: 'SECURITY:RBAC:ROLE_CREATE',
      resourceType: 'ROLE',
      resourceId: record.id,
      decision: 'ALLOW',
      reasonCode: 'ROLE_CREATED',
      after: record as any
    });

    return record;
  }

  public async updateCustomRolePermissions(
    session: SessionContext,
    roleCode: string,
    input: {
      addPermissions?: string[];
      revokePermissions?: string[];
      disable?: boolean;
    }
  ): Promise<CustomRoleRecord> {
    const callerIdentity = await this.resolveCanonicalIdentity(session);
    if (!callerIdentity) {
      throw AppError.unauthorized('Authentication required');
    }
    if (
      !callerIdentity.isSuperAdmin &&
      !callerIdentity.effectivePermissions.includes('SECURITY:RBAC:MANAGE')
    ) {
      throw AppError.forbidden('Access denied: requires SECURITY:RBAC:MANAGE');
    }

    const partnerId = callerIdentity.partnerId;
    const code = roleCode.toUpperCase().trim();
    if (!this.customRolesByTenant.has(partnerId)) {
      this.customRolesByTenant.set(partnerId, new Map());
    }
    const tenantMap = this.customRolesByTenant.get(partnerId)!;
    let existing = tenantMap.get(code);

    if (!existing) {
      existing = {
        id: crypto.randomUUID(),
        partnerId,
        code,
        name: code,
        description: 'Tenant role configuration',
        status: 'ACTIVE',
        isSystem: Boolean(CANONICAL_ROLE_PERMISSIONS[code]),
        version: 1,
        permissions: [...(CANONICAL_ROLE_PERMISSIONS[code] || [])],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const beforeSnapshot = { ...existing, permissions: [...existing.permissions] };
    const permSet = new Set(existing.permissions);

    for (const p of input.addPermissions || []) {
      if (p === '*') {
        throw AppError.forbidden('Wildcard permission escalation is forbidden');
      }
      const norm = this.normalizeAction(p);
      if (!CANONICAL_PERMISSION_REGISTRY[norm]) {
        throw AppError.badRequest(`Unknown permission: ${p}`);
      }
      if (!callerIdentity.isSuperAdmin && !callerIdentity.effectivePermissions.includes(norm)) {
        throw AppError.forbidden(`Privilege escalation blocked: cannot grant unassigned permission ${norm}`);
      }
      permSet.add(norm);
    }

    for (const p of input.revokePermissions || []) {
      const norm = this.normalizeAction(p);
      permSet.delete(norm);
    }

    if (input.disable === true) {
      existing.status = 'DISABLED';
      if (!this.disabledRoleCodesByTenant.has(partnerId)) {
        this.disabledRoleCodesByTenant.set(partnerId, new Set());
      }
      this.disabledRoleCodesByTenant.get(partnerId)!.add(code);
    } else if (input.disable === false) {
      existing.status = 'ACTIVE';
      this.disabledRoleCodesByTenant.get(partnerId)?.delete(code);
    }

    existing.permissions = Array.from(permSet);
    existing.version += 1;
    existing.updatedAt = new Date().toISOString();
    tenantMap.set(code, existing);

    // Override standard role permissions for this tenant if custom modified
    CANONICAL_ROLE_PERMISSIONS[`${partnerId}:${code}`] = existing.permissions;
    this.invalidateSecurityCache(partnerId);

    await this.recordSecurityAudit({
      actorUserId: callerIdentity.userId,
      actorStaffId: callerIdentity.staffId,
      partnerId,
      role: callerIdentity.roleCodes[0] || 'ADMIN',
      action: 'SECURITY:RBAC:ROLE_UPDATE',
      resourceType: 'ROLE',
      resourceId: existing.id,
      decision: 'ALLOW',
      reasonCode: input.disable ? 'ROLE_DISABLED' : 'ROLE_PERMISSIONS_UPDATED',
      before: beforeSnapshot,
      after: existing as any
    });

    return existing;
  }

  // =========================================================================
  // STEP 13 — MAKER-CHECKER ENGINE (SEPARATION OF DUTIES)
  // =========================================================================

  public async submitMakerCheckerRequest(
    session: SessionContext,
    input: {
      action: string;
      resourceType: string;
      resourceId: string;
      oldValue?: Record<string, unknown> | null;
      newValue: Record<string, unknown>;
      reason: string;
    }
  ): Promise<MakerCheckerRequestRecord> {
    const identity = await this.resolveCanonicalIdentity(session);
    if (!identity) {
      throw AppError.unauthorized('Authentication required');
    }
    if (!input.reason || input.reason.trim().length < 5) {
      throw AppError.badRequest('Reason (minimum 5 characters) is mandatory for Maker-Checker request');
    }

    const record: MakerCheckerRequestRecord = {
      id: crypto.randomUUID(),
      partnerId: identity.partnerId,
      action: this.normalizeAction(input.action),
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      oldValue: input.oldValue || null,
      newValue: input.newValue,
      makerUserId: identity.userId,
      makerStaffId: identity.staffId,
      makerRole: identity.roleCodes[0] || 'STAFF',
      checkerUserId: null,
      checkerStaffId: null,
      checkerRole: null,
      status: 'PENDING',
      reason: input.reason.trim(),
      decisionReason: null,
      createdAt: new Date().toISOString(),
      decidedAt: null
    };

    this.makerCheckerStore.set(record.id, record);

    await this.recordSecurityAudit({
      actorUserId: identity.userId,
      actorStaffId: identity.staffId,
      partnerId: identity.partnerId,
      role: record.makerRole,
      action: record.action,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      decision: 'MAKER_CHECKER_REQUIRED',
      reasonCode: 'MAKER_REQUEST_SUBMITTED',
      makerChecker: {
        requestId: record.id,
        makerUserId: record.makerUserId,
        status: 'PENDING',
        reason: record.reason
      },
      before: record.oldValue || undefined,
      after: record.newValue
    });

    return record;
  }

  public async decideMakerCheckerRequest(
    session: SessionContext,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    decisionReason: string
  ): Promise<MakerCheckerRequestRecord> {
    const checkerIdentity = await this.resolveCanonicalIdentity(session);
    if (!checkerIdentity) {
      throw AppError.unauthorized('Authentication required');
    }

    const reqRecord = this.makerCheckerStore.get(requestId);
    if (!reqRecord) {
      throw AppError.notFound(`Maker-Checker request ${requestId} not found`);
    }

    // Tenant Isolation check
    if (!checkerIdentity.isSuperAdmin && reqRecord.partnerId !== checkerIdentity.partnerId) {
      throw new AppError({
        message: 'Access denied: Cross-tenant Maker-Checker approval is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    // INVARIANT 12: Maker CANNOT self-approve where separation of duties applies
    const isSameUser = reqRecord.makerUserId === checkerIdentity.userId;
    const isSameStaff =
      Boolean(reqRecord.makerStaffId && checkerIdentity.staffId) &&
      reqRecord.makerStaffId === checkerIdentity.staffId;

    if (isSameUser || isSameStaff) {
      await this.recordSecurityAudit({
        actorUserId: checkerIdentity.userId,
        actorStaffId: checkerIdentity.staffId,
        partnerId: checkerIdentity.partnerId,
        role: checkerIdentity.roleCodes[0] || 'STAFF',
        action: reqRecord.action,
        resourceType: reqRecord.resourceType,
        resourceId: reqRecord.resourceId,
        decision: 'DENY',
        reasonCode: 'MAKER_SELF_APPROVAL_FORBIDDEN',
        makerChecker: {
          requestId: reqRecord.id,
          makerUserId: reqRecord.makerUserId,
          checkerUserId: checkerIdentity.userId,
          violation: 'SELF_APPROVAL_ATTEMPT'
        }
      });

      throw new AppError({
        message: 'Separation of duties violation (INVARIANT 12): Maker cannot approve or reject their own request.',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }

    reqRecord.checkerUserId = checkerIdentity.userId;
    reqRecord.checkerStaffId = checkerIdentity.staffId;
    reqRecord.checkerRole = checkerIdentity.roleCodes[0] || 'CHECKER';
    reqRecord.status = decision;
    reqRecord.decisionReason = decisionReason || (decision === 'APPROVED' ? 'Approved by Checker' : 'Rejected by Checker');
    reqRecord.decidedAt = new Date().toISOString();

    this.makerCheckerStore.set(requestId, reqRecord);

    await this.recordSecurityAudit({
      actorUserId: checkerIdentity.userId,
      actorStaffId: checkerIdentity.staffId,
      partnerId: checkerIdentity.partnerId,
      role: reqRecord.checkerRole,
      action: reqRecord.action,
      resourceType: reqRecord.resourceType,
      resourceId: reqRecord.resourceId,
      decision: decision === 'APPROVED' ? 'ALLOW' : 'DENY',
      reasonCode: `MAKER_CHECKER_${decision}`,
      makerChecker: {
        requestId: reqRecord.id,
        makerUserId: reqRecord.makerUserId,
        checkerUserId: reqRecord.checkerUserId,
        decision,
        reason: reqRecord.decisionReason
      },
      before: reqRecord.oldValue || undefined,
      after: reqRecord.newValue
    });

    return reqRecord;
  }

  // =========================================================================
  // STEP 14 — CANONICAL ACCESS DECISION ENGINE: authorize(subject, action, resource, context)
  // =========================================================================

  public async authorize(
    subjectSession: SessionContext | null | undefined,
    rawAction: string,
    resource: AuthorizationResourceTarget = {},
    context: AuthorizationEvaluationContext = {}
  ): Promise<CanonicalAccessDecision> {
    const nowIso = new Date().toISOString();
    const normalizedAction = this.normalizeAction(rawAction);
    const reasons: string[] = [];

    const buildResponse = async (
      decision: CanonicalAccessDecisionType,
      reasonCode: string,
      reason: string,
      identity: CanonicalIdentityContext | null,
      diagOverrides: Partial<CanonicalAccessDecision['diagnostics']> = {},
      breakGlassInfo: CanonicalAccessDecision['breakGlass'] = { required: false, active: false },
      makerCheckerInfo: CanonicalAccessDecision['makerChecker'] = { required: false, satisfied: true }
    ): Promise<CanonicalAccessDecision> => {
      const diagnostics: CanonicalAccessDecision['diagnostics'] = {
        permissionPresent: diagOverrides.permissionPresent ?? false,
        roleContainsPermission: diagOverrides.roleContainsPermission ?? false,
        partnerScopeValid: diagOverrides.partnerScopeValid ?? true,
        departmentScopeValid: diagOverrides.departmentScopeValid ?? true,
        locationScopeValid: diagOverrides.locationScopeValid ?? true,
        patientScopeValid: diagOverrides.patientScopeValid ?? true,
        encounterScopeValid: diagOverrides.encounterScopeValid ?? true,
        staffStatus: identity?.staffStatus ?? 'INACTIVE',
        credentialStatus: identity?.credentialStatus ?? 'MISSING',
        entitlementValid: diagOverrides.entitlementValid ?? true,
        licenseStatus: context.licenseStatusOverride || identity?.entitlementContext.licenseStatus || 'UNKNOWN',
        featureEnabled: diagOverrides.featureEnabled ?? true,
        makerCheckerRequired: makerCheckerInfo.required,
        breakGlassRequired: breakGlassInfo.required,
        reasons: reasons.length > 0 ? reasons : [reason]
      };

      const auditEvent = await this.recordSecurityAudit({
        actorUserId: identity?.userId || subjectSession?.userId || 'UNAUTHENTICATED',
        actorStaffId: identity?.staffId || null,
        partnerId: identity?.partnerId || subjectSession?.tenantId || 'UNKNOWN',
        role: identity?.roleCodes[0] || subjectSession?.roles?.[0] || 'NONE',
        action: normalizedAction,
        resourceType: resource.resourceType || normalizedAction.split(':')[0] || 'RESOURCE',
        resourceId:
          resource.resourceId ||
          resource.encounterId ||
          resource.patientId ||
          resource.departmentId ||
          resource.locationId ||
          'GLOBAL',
        patientId: resource.patientId,
        encounterId: resource.encounterId,
        departmentId: resource.departmentId || identity?.departmentIds[0],
        locationId: resource.locationId || resource.branchId || identity?.locationIds[0],
        decision,
        reasonCode,
        breakGlass: breakGlassInfo.active || breakGlassInfo.required ? breakGlassInfo : undefined,
        makerChecker: makerCheckerInfo.required ? makerCheckerInfo : undefined,
        before: context.beforeState,
        after: context.afterState,
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });

      return {
        decision,
        allowed: decision === 'ALLOW',
        reasonCode,
        reason,
        policyVersion: this.policyVersion,
        subject: {
          userId: identity?.userId || '',
          staffId: identity?.staffId || null,
          partnerId: identity?.partnerId || '',
          roles: identity?.roleCodes || [],
          departmentIds: identity?.departmentIds || [],
          locationIds: identity?.locationIds || [],
          staffStatus: identity?.staffStatus || 'INACTIVE',
          credentialStatus: identity?.credentialStatus || 'MISSING'
        },
        action: rawAction,
        normalizedAction,
        resource,
        breakGlass: breakGlassInfo,
        makerChecker: makerCheckerInfo,
        diagnostics,
        auditEventId: auditEvent.eventId,
        timestamp: nowIso
      };
    };

    // 1. FAIL-CLOSED: Verify Subject & Required Context (STEP 17 & INVARIANT 14)
    if (!subjectSession || !subjectSession.userId || !subjectSession.tenantId || !rawAction) {
      reasons.push('Fail-closed: Missing authenticated session, tenantId, userId, or action context.');
      return buildResponse('DENY', 'FAIL_CLOSED_MISSING_CONTEXT', 'DENY — Missing required authorization context', null, {
        partnerScopeValid: false
      });
    }

    // Check Session Revocation Service (STEP 19 #40 - Session Invalidation)
    const revocationCheck = await sessionRevocationService.isRevoked({
      sub: subjectSession.userId,
      email: subjectSession.actorEmail || 'user@partner.local',
      tenantId: subjectSession.tenantId,
      branchId: subjectSession.branchId,
      roles: subjectSession.roles || [],
      permissions: subjectSession.permissions || [],
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 3600,
      sessionId: subjectSession.sessionId
    } as any);

    if (revocationCheck.revoked) {
      reasons.push(revocationCheck.reason || 'Session or account has been revoked.');
      return buildResponse('DENY', 'SESSION_INVALIDATED', `DENY — ${revocationCheck.reason}`, null);
    }

    const identity = await this.resolveCanonicalIdentity(subjectSession);
    if (!identity) {
      reasons.push('Fail-closed: Unable to resolve canonical identity context.');
      return buildResponse('DENY', 'FAIL_CLOSED_IDENTITY_UNRESOLVED', 'DENY — Identity resolution failed closed', null);
    }

    // 2. ANTI-SPOOFING: Never trust client-supplied partnerId, userId, staffId, role, or permissions (INVARIANT 2)
    if (
      context.clientSuppliedPartnerId &&
      !identity.isSuperAdmin &&
      context.clientSuppliedPartnerId !== identity.partnerId &&
      toDeterministicUuid(context.clientSuppliedPartnerId) !== toDeterministicUuid(identity.partnerId)
    ) {
      reasons.push(`Client-supplied partnerId (${context.clientSuppliedPartnerId}) conflicts with authenticated partner (${identity.partnerId}).`);
      return buildResponse('DENY', 'CLIENT_PARTNER_ID_SPOOFING', 'DENY — Client-supplied partnerId manipulation blocked', identity, {
        partnerScopeValid: false
      });
    }

    if (
      context.clientSuppliedUserId &&
      !identity.isSuperAdmin &&
      context.clientSuppliedUserId !== identity.userId
    ) {
      reasons.push(`Client-supplied userId (${context.clientSuppliedUserId}) conflicts with authenticated userId (${identity.userId}).`);
      return buildResponse('DENY', 'CLIENT_USER_ID_SPOOFING', 'DENY — Client-supplied userId manipulation blocked', identity);
    }

    if (
      context.clientSuppliedStaffId &&
      !identity.isSuperAdmin &&
      context.clientSuppliedStaffId !== identity.staffId &&
      context.clientSuppliedStaffId !== identity.userId
    ) {
      reasons.push(`Client-supplied staffId (${context.clientSuppliedStaffId}) conflicts with authenticated staffId (${identity.staffId || identity.userId}).`);
      return buildResponse('DENY', 'CLIENT_STAFF_ID_SPOOFING', 'DENY — Client-supplied staffId manipulation blocked', identity);
    }

    if (
      context.clientSuppliedRole &&
      !identity.isSuperAdmin &&
      !identity.roleCodes.includes(context.clientSuppliedRole.toUpperCase())
    ) {
      reasons.push(`Client attempted role escalation to unassigned role "${context.clientSuppliedRole}".`);
      return buildResponse('DENY', 'ROLE_ESCALATION_ATTEMPT', 'DENY — Role escalation attempt blocked', identity);
    }

    if (
      Array.isArray(context.clientSuppliedPermissions) &&
      context.clientSuppliedPermissions.length > 0 &&
      !identity.isSuperAdmin
    ) {
      const hasInjected = context.clientSuppliedPermissions.some(
        (p) => !identity.effectivePermissions.includes(this.normalizeAction(p))
      );
      if (hasInjected) {
        reasons.push('Client attempted permission escalation by injecting unauthorized permissions.');
        return buildResponse('DENY', 'PERMISSION_ESCALATION_ATTEMPT', 'DENY — Permission escalation attempt blocked', identity);
      }
    }

    // 3. CROSS-TENANT / PARTNER ISOLATION (INVARIANT 3)
    const targetPartnerId = resource.partnerId || resource.tenantId;
    if (
      targetPartnerId &&
      !identity.isSuperAdmin &&
      targetPartnerId !== identity.partnerId &&
      toDeterministicUuid(targetPartnerId) !== toDeterministicUuid(identity.partnerId)
    ) {
      reasons.push(`Partner scope mismatch: subject belongs to ${identity.partnerId}, resource belongs to ${targetPartnerId}.`);
      return buildResponse('DENY', 'PARTNER_SCOPE_MISMATCH', 'DENY — Cross-tenant access strictly forbidden', identity, {
        partnerScopeValid: false
      });
    }

    // 4. STAFF LIFECYCLE STATUS GATE (STEP 9 & INVARIANT 8)
    if (identity.staffStatus !== 'ACTIVE') {
      reasons.push(`Staff status is ${identity.staffStatus}; only ACTIVE staff can perform operational actions.`);
      return buildResponse(
        'DENY',
        `STAFF_${identity.staffStatus}`,
        `DENY — Staff account is ${identity.staffStatus}`,
        identity
      );
    }

    // 5. ENTITLEMENT, LICENSE & FEATURE GATE (STEP 11 & INVARIANT 10)
    const permMeta = CANONICAL_PERMISSION_REGISTRY[normalizedAction];
    const effectiveLicenseStatus = (context.licenseStatusOverride || identity.entitlementContext.licenseStatus).toUpperCase();

    if (['EXPIRED', 'SUSPENDED', 'LOCKED', 'REVOKED'].includes(effectiveLicenseStatus)) {
      reasons.push(`Partner commercial license status is ${effectiveLicenseStatus}.`);
      return buildResponse('DENY', 'LICENSE_EXPIRED', `DENY — Partner license is ${effectiveLicenseStatus}`, identity, {
        entitlementValid: false,
        licenseStatus: effectiveLicenseStatus
      });
    }

    if (context.featureDisabledOverride === true || (permMeta && identity.entitlementContext.disabledFeatures.includes(permMeta.requiredCapability))) {
      reasons.push(`Feature/capability ${permMeta?.requiredCapability || normalizedAction} is disabled for this partner.`);
      return buildResponse('DENY', 'FEATURE_DISABLED', 'DENY — Feature is disabled for this partner', identity, {
        entitlementValid: false,
        featureEnabled: false
      });
    }

    if (
      context.entitlementMissingOverride === true ||
      (permMeta && !identity.entitlementContext.entitledCapabilities.includes(permMeta.requiredCapability))
    ) {
      reasons.push(
        `Partner entitlement missing for capability "${permMeta?.requiredCapability || normalizedAction}" even though user holds role permission.`
      );
      return buildResponse('DENY', 'ENTITLEMENT_MISSING', 'DENY — Partner plan entitlement does not include required capability', identity, {
        entitlementValid: false
      });
    }

    // 6. RBAC ROLE & PERMISSION RESOLUTION (STEP 3 & INVARIANT 1)
    if (identity.roleCodes.length === 0) {
      reasons.push('User has no active roles assigned.');
      return buildResponse('DENY', 'ROLE_MISSING', 'DENY — User holds no active authorized role', identity, {
        permissionPresent: false,
        roleContainsPermission: false
      });
    }

    // Check tenant-specific custom role permissions if modified
    let hasRolePerm = identity.effectivePermissions.includes(normalizedAction);
    for (const rCode of identity.roleCodes) {
      const tenantCustomKey = `${identity.partnerId}:${rCode}`;
      if (CANONICAL_ROLE_PERMISSIONS[tenantCustomKey]) {
        hasRolePerm = CANONICAL_ROLE_PERMISSIONS[tenantCustomKey]!.includes(normalizedAction);
      }
    }

    // Check Break-Glass override if accessing a specific patient chart
    let breakGlassState: CanonicalAccessDecision['breakGlass'] = { required: false, active: false };
    if (resource.patientId) {
      const bgCheck = await this.evaluateBreakGlassStatus(identity, resource.patientId);
      if (bgCheck.expired) {
        reasons.push('Break-Glass emergency access grant has expired.');
        return buildResponse(
          'DENY',
          'BREAK_GLASS_EXPIRED',
          'DENY — Break-Glass emergency access has expired',
          identity,
          { permissionPresent: hasRolePerm, roleContainsPermission: hasRolePerm },
          { required: true, active: false }
        );
      }
      if (bgCheck.active) {
        breakGlassState = {
          required: false,
          active: true,
          breakGlassId: bgCheck.breakGlassId,
          reason: bgCheck.reason,
          expiresAt: bgCheck.expiresAt
        };
      }
    }

    if (!hasRolePerm && !breakGlassState.active) {
      // Distinguish unknown permission vs missing permission on role
      if (!CANONICAL_PERMISSION_REGISTRY[normalizedAction]) {
        reasons.push(`Fail-closed: Unknown permission "${normalizedAction}".`);
        return buildResponse('DENY', 'UNKNOWN_PERMISSION', `DENY — Unknown permission "${normalizedAction}"`, identity, {
          permissionPresent: false,
          roleContainsPermission: false
        });
      }
      reasons.push(`Role(s) [${identity.roleCodes.join(', ')}] do not contain permission "${normalizedAction}".`);
      return buildResponse(
        'DENY',
        'PERMISSION_MISSING',
        `DENY — Role does not grant permission "${normalizedAction}"`,
        identity,
        {
          permissionPresent: false,
          roleContainsPermission: false
        }
      );
    }

    // 7. CREDENTIAL STATUS GATE (STEP 10 & INVARIANT 9)
    const requiresCred = Boolean(context.requireValidCredential || permMeta?.requiresValidCredential);
    if (requiresCred && identity.credentialStatus !== 'VALID') {
      reasons.push(
        `Credential status is ${identity.credentialStatus}; valid professional credential is required for ${normalizedAction}.`
      );
      return buildResponse(
        'DENY',
        `CREDENTIAL_${identity.credentialStatus}`,
        `DENY — Professional credential is ${identity.credentialStatus}`,
        identity,
        {
          permissionPresent: true,
          roleContainsPermission: true
        }
      );
    }

    // 8. LOCATION SCOPE GATE (STEP 6 & INVARIANT 5)
    const isPartnerWideAdmin = identity.roleCodes.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'HOSPITAL_DIRECTOR'].includes(r)
    );
    const targetLocationId = resource.locationId || resource.branchId || context.clientSuppliedLocationId;
    if (
      targetLocationId &&
      !isPartnerWideAdmin &&
      identity.locationIds.length > 0 &&
      !identity.locationIds.includes(targetLocationId) &&
      !breakGlassState.active
    ) {
      reasons.push(
        `Location scope mismatch: staff assigned to [${identity.locationIds.join(', ')}], requested location ${targetLocationId}.`
      );
      return buildResponse(
        'DENY',
        'LOCATION_SCOPE_MISMATCH',
        `DENY — Cross-location access to ${targetLocationId} is forbidden`,
        identity,
        {
          permissionPresent: true,
          roleContainsPermission: true,
          locationScopeValid: false
        }
      );
    }

    // 9. DEPARTMENT SCOPE GATE (STEP 5 & INVARIANT 4)
    const targetDept = resource.departmentId || resource.departmentCode || context.clientSuppliedDepartmentId;
    if (targetDept && !isPartnerWideAdmin && !breakGlassState.active) {
      const targetDeptUpper = targetDept.toUpperCase().trim();
      const assignedMatches =
        identity.departmentIds.some((d) => d.toUpperCase().trim() === targetDeptUpper) ||
        identity.departmentCodes.some((d) => d.toUpperCase().trim() === targetDeptUpper);

      if ((identity.departmentIds.length > 0 || identity.departmentCodes.length > 0) && !assignedMatches) {
        if (context.allowBreakGlassEscalation && resource.patientId) {
          reasons.push(`Department scope mismatch (${targetDept}); Break-Glass emergency activation is required.`);
          return buildResponse(
            'BREAK_GLASS_REQUIRED',
            'BREAK_GLASS_REQUIRED',
            'BREAK_GLASS_REQUIRED — Patient belongs to another department; explicit Break-Glass required',
            identity,
            {
              permissionPresent: true,
              roleContainsPermission: true,
              departmentScopeValid: false
            },
            { required: true, active: false }
          );
        }

        reasons.push(
          `Department scope mismatch: user assigned to [${identity.departmentCodes.join(', ')}], requested department ${targetDept}.`
        );
        return buildResponse(
          'DENY',
          'DEPARTMENT_SCOPE_MISMATCH',
          `DENY — Cross-department access to ${targetDept} is forbidden`,
          identity,
          {
            permissionPresent: true,
            roleContainsPermission: true,
            departmentScopeValid: false
          }
        );
      }
    }

    // 10. PATIENT SCOPE GATE (STEP 7 & INVARIANT 6)
    if (resource.patientId) {
      const pScope = this.patientScopeRegistry.get(resource.patientId);
      if (pScope) {
        if (
          !identity.isSuperAdmin &&
          pScope.partnerId !== identity.partnerId &&
          toDeterministicUuid(pScope.partnerId) !== toDeterministicUuid(identity.partnerId)
        ) {
          reasons.push(`Patient ${resource.patientId} belongs to another partner (${pScope.partnerId}).`);
          return buildResponse('DENY', 'PATIENT_SCOPE_MISMATCH', 'DENY — Cross-tenant patient access forbidden', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            partnerScopeValid: false,
            patientScopeValid: false
          });
        }

        if (
          !isPartnerWideAdmin &&
          identity.locationIds.length > 0 &&
          pScope.locationId &&
          !identity.locationIds.includes(pScope.locationId) &&
          !breakGlassState.active
        ) {
          reasons.push(`Patient ${resource.patientId} is registered at location ${pScope.locationId} outside caller's location scope.`);
          return buildResponse('DENY', 'PATIENT_SCOPE_MISMATCH', 'DENY — Patient belongs to an unauthorized facility location', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            locationScopeValid: false,
            patientScopeValid: false
          });
        }

        const isOutOfDept =
          !isPartnerWideAdmin &&
          pScope.departmentId &&
          identity.departmentCodes.length > 0 &&
          !identity.departmentCodes.includes(pScope.departmentId.toUpperCase()) &&
          !identity.departmentIds.includes(pScope.departmentId);

        if ((pScope.confidential || resource.confidentialPatient || isOutOfDept) && !breakGlassState.active) {
          if (context.allowBreakGlassEscalation !== false) {
            reasons.push(`Patient chart ${resource.patientId} requires Break-Glass emergency authorization.`);
            return buildResponse(
              'BREAK_GLASS_REQUIRED',
              'BREAK_GLASS_REQUIRED',
              'BREAK_GLASS_REQUIRED — Confidential or out-of-scope patient chart requires explicit Break-Glass activation',
              identity,
              {
                permissionPresent: true,
                roleContainsPermission: true,
                patientScopeValid: false
              },
              { required: true, active: false }
            );
          }
          return buildResponse('DENY', 'PATIENT_SCOPE_MISMATCH', 'DENY — Unauthorized patient scope', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            patientScopeValid: false
          });
        }
      } else if (resource.confidentialPatient && !breakGlassState.active) {
        reasons.push(`Patient chart ${resource.patientId} is confidential; explicit Break-Glass activation is required.`);
        return buildResponse(
          'BREAK_GLASS_REQUIRED',
          'BREAK_GLASS_REQUIRED',
          'BREAK_GLASS_REQUIRED — Explicit Break-Glass emergency authorization is required',
          identity,
          {
            permissionPresent: true,
            roleContainsPermission: true,
            patientScopeValid: false
          },
          { required: true, active: false }
        );
      }
    }

    // 11. ENCOUNTER SCOPE GATE (STEP 8 & INVARIANT 7)
    if (resource.encounterId) {
      const eScope = this.encounterScopeRegistry.get(resource.encounterId);
      if (eScope) {
        if (
          !identity.isSuperAdmin &&
          eScope.partnerId !== identity.partnerId &&
          toDeterministicUuid(eScope.partnerId) !== toDeterministicUuid(identity.partnerId)
        ) {
          reasons.push(`Encounter ${resource.encounterId} belongs to another partner.`);
          return buildResponse('DENY', 'ENCOUNTER_SCOPE_MISMATCH', 'DENY — Cross-tenant encounter access forbidden', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            partnerScopeValid: false,
            encounterScopeValid: false
          });
        }

        if (resource.patientId && eScope.patientId !== resource.patientId) {
          reasons.push(
            `Encounter-ID manipulation detected: encounter ${resource.encounterId} belongs to patient ${eScope.patientId}, not ${resource.patientId}.`
          );
          return buildResponse('DENY', 'ENCOUNTER_SCOPE_MISMATCH', 'DENY — Encounter does not belong to target patient', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            encounterScopeValid: false
          });
        }

        if (
          !isPartnerWideAdmin &&
          identity.locationIds.length > 0 &&
          eScope.locationId &&
          !identity.locationIds.includes(eScope.locationId) &&
          !breakGlassState.active
        ) {
          reasons.push(`Encounter ${resource.encounterId} belongs to location ${eScope.locationId} outside caller's scope.`);
          return buildResponse('DENY', 'ENCOUNTER_SCOPE_MISMATCH', 'DENY — Encounter location mismatch', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            locationScopeValid: false,
            encounterScopeValid: false
          });
        }

        const isEncOutOfDept =
          !isPartnerWideAdmin &&
          eScope.departmentId &&
          identity.departmentCodes.length > 0 &&
          !identity.departmentCodes.includes(eScope.departmentId.toUpperCase()) &&
          !identity.departmentIds.includes(eScope.departmentId);

        if (isEncOutOfDept && !breakGlassState.active) {
          reasons.push(`Encounter ${resource.encounterId} belongs to department ${eScope.departmentId} outside caller's scope.`);
          return buildResponse('DENY', 'ENCOUNTER_SCOPE_MISMATCH', 'DENY — Encounter department scope mismatch', identity, {
            permissionPresent: true,
            roleContainsPermission: true,
            departmentScopeValid: false,
            encounterScopeValid: false
          });
        }
      }
    }

    // 12. MAKER-CHECKER SEPARATION OF DUTIES GATE (STEP 13 & INVARIANT 12)
    const requiresMakerChecker = Boolean(context.requireMakerChecker || permMeta?.requiresMakerChecker);
    let makerCheckerState: CanonicalAccessDecision['makerChecker'] = { required: requiresMakerChecker, satisfied: !requiresMakerChecker };

    if (requiresMakerChecker) {
      if (!context.makerCheckerRequestId) {
        reasons.push(`Action ${normalizedAction} requires dual-control Maker-Checker approval prior to execution.`);
        return buildResponse(
          'MAKER_CHECKER_REQUIRED',
          'MAKER_CHECKER_REQUIRED',
          `MAKER_CHECKER_REQUIRED — Dual-control approval is required for ${normalizedAction}`,
          identity,
          {
            permissionPresent: true,
            roleContainsPermission: true
          },
          breakGlassState,
          { required: true, satisfied: false }
        );
      }

      const mcReq = this.makerCheckerStore.get(context.makerCheckerRequestId);
      if (!mcReq) {
        reasons.push(`Maker-Checker request ${context.makerCheckerRequestId} does not exist.`);
        return buildResponse(
          'DENY',
          'MAKER_CHECKER_INVALID',
          'DENY — Referenced Maker-Checker approval request does not exist',
          identity,
          { permissionPresent: true, roleContainsPermission: true },
          breakGlassState,
          { required: true, satisfied: false, requestId: context.makerCheckerRequestId }
        );
      }

      if (mcReq.makerUserId === identity.userId && mcReq.checkerUserId === identity.userId) {
        reasons.push('Separation of duties violation: Maker cannot self-approve.');
        return buildResponse(
          'DENY',
          'MAKER_SELF_APPROVAL_FORBIDDEN',
          'DENY — Maker self-approval is strictly forbidden',
          identity,
          { permissionPresent: true, roleContainsPermission: true },
          breakGlassState,
          { required: true, satisfied: false, requestId: mcReq.id, makerUserId: mcReq.makerUserId }
        );
      }

      if (mcReq.status !== 'APPROVED') {
        reasons.push(`Maker-Checker request ${mcReq.id} is currently ${mcReq.status}.`);
        return buildResponse(
          'MAKER_CHECKER_REQUIRED',
          'MAKER_CHECKER_PENDING',
          `MAKER_CHECKER_REQUIRED — Approval status is ${mcReq.status}`,
          identity,
          { permissionPresent: true, roleContainsPermission: true },
          breakGlassState,
          { required: true, satisfied: false, requestId: mcReq.id, makerUserId: mcReq.makerUserId }
        );
      }

      makerCheckerState = {
        required: true,
        satisfied: true,
        requestId: mcReq.id,
        makerUserId: mcReq.makerUserId,
        checkerUserId: mcReq.checkerUserId || undefined
      };
    }

    // ALL 12 GATES PASSED -> ALLOW
    reasons.push('All identity, RBAC, ABAC, scope, staff status, credential, and entitlement checks passed.');
    return buildResponse(
      'ALLOW',
      breakGlassState.active ? 'ALLOW_VIA_BREAK_GLASS' : 'ALLOW_AUTHORIZED',
      breakGlassState.active
        ? 'ALLOW — Authorized via audited Break-Glass emergency access'
        : 'ALLOW — Authorized by canonical RBAC + ABAC engine',
      identity,
      {
        permissionPresent: true,
        roleContainsPermission: true
      },
      breakGlassState,
      makerCheckerState
    );
  }

  // =========================================================================
  // STEP 12 — BREAK-GLASS STATUS HELPER
  // =========================================================================

  public async grantBreakGlassAccess(
    session: SessionContext,
    input: {
      patientId: string;
      reason: string;
      expiresInSeconds?: number;
      durationMinutes?: number;
    }
  ) {
    if (!session || !session.userId || !session.tenantId) {
      throw AppError.unauthorized('Authentication required');
    }
    const reasonText = String(input.reason || '').trim();
    if (!reasonText || reasonText.length < 5) {
      throw new AppError({
        message: 'Explicit emergency clinical reason (minimum 5 characters) is mandatory for break-glass access.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    const patientId = String(input.patientId || '').trim();
    if (!patientId || patientId === '*' || patientId.toLowerCase() === 'all') {
      throw new AppError({
        message: 'Specific patientId is mandatory for break-glass access (wildcard forbidden).',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }
    const durationSec = input.expiresInSeconds
      ? Number(input.expiresInSeconds)
      : (Number(input.durationMinutes || 60) * 60);
    const nowMs = Date.now();
    const id = crypto.randomUUID();
    const record = {
      id,
      partnerId: session.tenantId,
      userId: session.userId,
      patientId,
      reason: reasonText,
      triggeredAt: new Date(nowMs).toISOString(),
      expiresAt: nowMs + durationSec * 1000,
      revokedAt: null
    };
    this.breakGlassStore.set(record.id, record);

    const db = getDatabase();
    if (db) {
      try {
        const tenantUuid = toDeterministicUuid(session.tenantId);
        const userUuid = toDeterministicUuid(session.userId);
        const userEmail = (session.actorEmail || `${session.userId}@partner.local`).toLowerCase().trim();

        // Ensure user exists in core.users so foreign key constraint break_glass_access_user_id_fkey is satisfied
        let resolvedUserId = userUuid;
        const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.id, userUuid)).limit(1);
        if (existingUser.length > 0 && existingUser[0]?.id) {
          resolvedUserId = existingUser[0].id;
        } else {
          const existingByEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, userEmail)).limit(1);
          if (existingByEmail.length > 0 && existingByEmail[0]?.id) {
            resolvedUserId = existingByEmail[0].id;
          } else {
            try {
              await db.insert(users).values({
                id: userUuid,
                email: userEmail,
                firstName: 'Authorized',
                lastName: 'Staff',
                status: 'ACTIVE',
                isEmailVerified: true
              }).onConflictDoNothing();
            } catch {
              const fallbackUser = await db.select({ id: users.id }).from(users).where(eq(users.email, userEmail)).limit(1);
              if (fallbackUser.length > 0 && fallbackUser[0]?.id) {
                resolvedUserId = fallbackUser[0].id;
              }
            }
          }
        }

        await db.insert(breakGlassAccess).values({
          id,
          tenantId: tenantUuid,
          partnerId: session.tenantId,
          userId: resolvedUserId,
          userEmail: session.actorEmail || `${session.userId}@partner.local`,
          patientId,
          reason: reasonText,
          scope: 'PATIENT_EMERGENCY',
          triggeredAt: new Date(nowMs),
          expiresAt: new Date(nowMs + durationSec * 1000),
          revokedAt: null,
          revokedBy: null,
          ipAddress: session.sessionId || '127.0.0.1'
        });
      } catch (err) {
        console.error('[IdentitySecurityFoundation] Failed to persist break-glass access to PostgreSQL:', err);
        throw new AppError({
          message: 'Failed to persist break-glass emergency access to authoritative database.',
          code: ErrorCode.DATABASE_ERROR,
          statusCode: 500
        });
      }
    }

    return {
      ...record,
      expiresAt: new Date(record.expiresAt).toISOString()
    };
  }

  public async expireBreakGlassAccess(breakGlassId: string): Promise<void> {
    const existing = this.breakGlassStore.get(breakGlassId);
    if (existing) {
      existing.expiresAt = Date.now() - 60000;
      existing.revokedAt = new Date().toISOString();
      this.breakGlassStore.set(breakGlassId, existing);
    }
    const db = getDatabase();
    if (db) {
      try {
        await db
          .update(breakGlassAccess)
          .set({
            expiresAt: new Date(Date.now() - 60000),
            revokedAt: new Date(),
            revokedBy: 'SYSTEM_EXPIRY'
          })
          .where(eq(breakGlassAccess.id, breakGlassId));
      } catch (err) {
        console.error('[IdentitySecurityFoundation] Failed to expire break-glass in PostgreSQL:', err);
        throw new AppError({
          message: 'Failed to update break-glass expiry in authoritative database.',
          code: ErrorCode.DATABASE_ERROR,
          statusCode: 500
        });
      }
    }
  }

  private async evaluateBreakGlassStatus(
    identity: CanonicalIdentityContext,
    patientId: string
  ): Promise<{
    active: boolean;
    expired: boolean;
    breakGlassId?: string;
    reason?: string;
    expiresAt?: string;
  }> {
    const nowMs = Date.now();
    const memGrants = Array.from(this.breakGlassStore.values()).filter(
      (g) =>
        g.partnerId === identity.partnerId &&
        g.userId === identity.userId &&
        g.patientId === patientId.trim() &&
        !g.revokedAt
    );

    if (memGrants.length > 0) {
      const activeMem = memGrants.find((g) => g.expiresAt > nowMs);
      if (activeMem) {
        return {
          active: true,
          expired: false,
          breakGlassId: activeMem.id,
          reason: activeMem.reason,
          expiresAt: new Date(activeMem.expiresAt).toISOString()
        };
      }
      return { active: false, expired: true };
    }

    const db = getDatabase();
    if (!db) {
      return { active: false, expired: false };
    }
    try {
      const tenantUuid = toDeterministicUuid(identity.partnerId);
      const userUuid = toDeterministicUuid(identity.userId);
      const rows = await db
        .select()
        .from(breakGlassAccess)
        .where(and(eq(breakGlassAccess.tenantId, tenantUuid), eq(breakGlassAccess.patientId, patientId.trim())));

      const userRows = rows.filter(
        (r: any) =>
          r.userId === identity.userId ||
          r.userId === userUuid ||
          (identity.actorEmail && String(r.userEmail || '').toLowerCase() === identity.actorEmail.toLowerCase())
      );

      if (userRows.length === 0) {
        return { active: false, expired: false };
      }

      for (const r of userRows) {
        if (r.revokedAt) continue;
        const expMs = r.expiresAt ? new Date(r.expiresAt).getTime() : 0;
        if (expMs > nowMs) {
          return {
            active: true,
            expired: false,
            breakGlassId: r.id,
            reason: r.reason,
            expiresAt: r.expiresAt instanceof Date ? r.expiresAt.toISOString() : String(r.expiresAt)
          };
        }
      }

      const hadExpired = userRows.some((r: any) => !r.revokedAt && r.expiresAt && new Date(r.expiresAt).getTime() <= nowMs);
      return { active: false, expired: hadExpired };
    } catch {
      return { active: false, expired: false };
    }
  }

  // =========================================================================
  // STEP 15 — "WHY CAN'T I ACCESS THIS?" DIAGNOSTIC ENGINE
  // =========================================================================

  public async diagnoseAccess(
    viewerSession: SessionContext | null | undefined,
    params: {
      subjectSession?: SessionContext | undefined;
      action: string;
      resource?: AuthorizationResourceTarget | undefined;
      context?: AuthorizationEvaluationContext | undefined;
    }
  ) {
    if (!viewerSession || !viewerSession.userId || !viewerSession.tenantId) {
      throw AppError.unauthorized('Authentication required to access security diagnostics');
    }

    const viewerIdentity = await this.resolveCanonicalIdentity(viewerSession);
    if (!viewerIdentity) {
      throw AppError.unauthorized('Unable to resolve diagnostic viewer identity');
    }

    // Diagnostic detail is permission-controlled (STEP 15):
    // Only authorized diagnostic viewers (SECURITY:DIAGNOSTICS:READ or Admin roles) may inspect arbitrary subjects;
    // non-diagnostic users cannot probe other users or cross-tenant diagnostics.
    const hasDiagnosticPermission =
      viewerIdentity.isSuperAdmin ||
      viewerIdentity.effectivePermissions.includes('SECURITY:DIAGNOSTICS:READ') ||
      viewerIdentity.roleCodes.some((r) =>
        ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PARTNER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN'].includes(r)
      );

    if (!hasDiagnosticPermission) {
      throw new AppError({
        message: 'Access denied: Diagnostic detail is permission-controlled (requires SECURITY:DIAGNOSTICS:READ).',
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        statusCode: 403
      });
    }

    const targetSubject = params.subjectSession || viewerSession;
    if (
      !viewerIdentity.isSuperAdmin &&
      targetSubject.tenantId !== viewerIdentity.partnerId &&
      toDeterministicUuid(targetSubject.tenantId) !== toDeterministicUuid(viewerIdentity.partnerId)
    ) {
      throw new AppError({
        message: 'Access denied: Cross-tenant security diagnostics inspection is strictly forbidden.',
        code: ErrorCode.TENANT_ACCESS_DENIED,
        statusCode: 403
      });
    }

    const evaluation = await this.authorize(targetSubject, params.action, params.resource || {}, params.context || {});
    return {
      action: evaluation.normalizedAction,
      result: evaluation.decision,
      reasonCode: evaluation.reasonCode,
      reason: evaluation.reason,
      diagnostics: evaluation.diagnostics,
      evaluatedAt: evaluation.timestamp
    };
  }

  // =========================================================================
  // STEP 16 — APPEND-ONLY TAMPER-RESISTANT SECURITY AUDIT TRAIL
  // =========================================================================

  public async recordSecurityAudit(input: {
    actorUserId: string;
    actorStaffId?: string | null | undefined;
    partnerId: string;
    role: string;
    action: string;
    resourceType: string;
    resourceId: string;
    patientId?: string | undefined;
    encounterId?: string | undefined;
    departmentId?: string | undefined;
    locationId?: string | undefined;
    decision: string;
    reasonCode: string;
    breakGlass?: Record<string, unknown> | undefined;
    makerChecker?: Record<string, unknown> | undefined;
    before?: Record<string, unknown> | undefined;
    after?: Record<string, unknown> | undefined;
    requestId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
  }) {
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const fullAuditEntry = {
      eventId,
      timestamp,
      actorUserId: input.actorUserId,
      actorStaffId: input.actorStaffId || null,
      partnerId: input.partnerId,
      role: input.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      patientId: input.patientId || null,
      encounterId: input.encounterId || null,
      departmentId: input.departmentId || null,
      locationId: input.locationId || null,
      decision: input.decision,
      reasonCode: input.reasonCode,
      policyVersion: this.policyVersion,
      breakGlass: input.breakGlass || null,
      makerChecker: input.makerChecker || null,
      before: input.before || null,
      after: input.after || null,
      requestId: input.requestId || `req_${eventId.slice(0, 8)}`,
      ipAddress: input.ipAddress || '127.0.0.1',
      userAgent: input.userAgent || 'DOC-SEARCH-API-GATEWAY'
    };

    this.securityAuditLog.push(Object.freeze(fullAuditEntry));

    try {
      await auditRepository.recordEvent(
        {
          eventType: `AUTHZ_${input.decision}_${input.reasonCode}`,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          tenantId: input.partnerId,
          branchId: input.locationId,
          correlationId: fullAuditEntry.requestId,
          ipAddress: fullAuditEntry.ipAddress,
          userAgent: fullAuditEntry.userAgent,
          metadata: fullAuditEntry
        },
        {
          userId: input.actorUserId,
          tenantId: input.partnerId,
          branchId: input.locationId,
          roles: [input.role as any],
          permissions: [],
          dataScope: 'branch',
          sessionId: fullAuditEntry.requestId,
          actorEmail: `${input.actorUserId}@partner.local`,
          isSuperAdmin: false
        }
      );
    } catch {}

    return fullAuditEntry;
  }

  public async getSecurityAuditTrail(session: SessionContext, filters?: { partnerId?: string; action?: string; decision?: string; limit?: number }) {
    const isGlobal = Boolean(
      session.isSuperAdmin || (session.roles || []).some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(String(r)))
    );
    const targetPartner = isGlobal && filters?.partnerId ? filters.partnerId : session.tenantId;
    const limit = Math.min(Number(filters?.limit || 100), 500);

    try {
      const dbEvents = await auditRepository.getEventsByTenant(targetPartner, limit);
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents.map((e: any) => ({
          eventId: e.id,
          timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : String(e.timestamp),
          actorUserId: e.actorId,
          partnerId: e.tenantId,
          role: (e.actorRoles && e.actorRoles[0]) || 'STAFF',
          action: e.eventType,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          decision: e.metadata?.decision || 'ALLOW',
          reasonCode: e.metadata?.reasonCode || 'AUTHORIZED',
          policyVersion: e.metadata?.policyVersion || 'v1.0'
        }));
      }
    } catch {}

    return this.securityAuditLog
      .filter((e) => {
        if (!isGlobal && e['partnerId'] !== targetPartner && toDeterministicUuid(e['partnerId']) !== toDeterministicUuid(targetPartner)) {
          return false;
        }
        if (filters?.partnerId && e['partnerId'] !== filters.partnerId) return false;
        if (filters?.action && e['action'] !== this.normalizeAction(filters.action)) return false;
        if (filters?.decision && e['decision'] !== filters.decision.toUpperCase()) return false;
        return true;
      })
      .slice(-limit)
      .reverse();
  }
}

export const identitySecurityFoundationService = new IdentitySecurityFoundationService();
