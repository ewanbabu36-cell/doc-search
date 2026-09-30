import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';
import { realAuthService } from '../core/RealAuthService.js';
import type { RoleType } from '@docsearch/api-contracts';
import {
  getDatabase,
  getTestDatabase,
  partnerGovernanceOverrides
} from '@docsearch/database';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';

const logger = createLogger('partner-governance-service');

export type ModuleStatus = 'ACTIVE' | 'DISABLED' | 'TRIAL';
export type ModuleCategory = 'CLINICAL' | 'OPERATIONS' | 'DIAGNOSTICS' | 'INTEGRATION' | 'BILLING_ADMIN';

export interface GovernanceModule {
  code: string;
  name: string;
  category: ModuleCategory;
  status: ModuleStatus;
  trialEndsAt?: string | null | undefined;
  lastModifiedBy?: string | undefined;
  lastModifiedAt?: string | undefined;
  reason?: string | undefined;
}

export interface GovernanceStaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  permissions: string[];
  phone?: string | undefined;
  lastActiveAt?: string | undefined;
}

export interface GovernanceQuotas {
  maxBeds: number;
  maxDoctorSeats: number;
  storageQuotaGb: number;
  monthlyWhatsAppCredits: number;
}

export interface GovernanceKillSwitches {
  globalFreeze: boolean;
  billingFreeze: boolean;
  communicationFreeze: boolean;
  frozenAt?: string | null | undefined;
  frozenBy?: string | null | undefined;
  freezeReason?: string | null | undefined;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  targetType: 'MODULE' | 'STAFF' | 'KILL_SWITCH' | 'QUOTA';
  targetId: string;
  changedBy: string;
  reason: string;
  previousState?: any;
  newState?: any;
}

export interface PartnerGovernanceData {
  partnerId: string;
  tenantId: string;
  facilityName: string;
  partnerType: string;
  modules: GovernanceModule[];
  quotas: GovernanceQuotas;
  killSwitches: GovernanceKillSwitches;
  staffUsers: GovernanceStaffUser[];
  auditLog: GovernanceAuditEntry[];
  updatedAt: string;
}

const DEFAULT_CORE_MODULES: Omit<GovernanceModule, 'status'>[] = [
  { code: 'CLINICAL_EMR', name: 'Clinical Suite & Digital EMR', category: 'CLINICAL' },
  { code: 'OPD_QUEUE', name: 'OPD Queue & Appointments', category: 'OPERATIONS' },
  { code: 'INPATIENT_IPD', name: 'Inpatient IPD & Bed Management', category: 'OPERATIONS' },
  { code: 'OT_SURGERY', name: 'Operation Theatre (OT) Desk', category: 'OPERATIONS' },
  { code: 'EMERGENCY_ICU', name: 'Emergency & ICU Critical Care', category: 'CLINICAL' },
  { code: 'PHARMACY_POS', name: 'Pharmacy POS & Inventory', category: 'OPERATIONS' },
  { code: 'PATHOLOGY_LIMS', name: 'Pathology & Lab Diagnostics', category: 'DIAGNOSTICS' },
  { code: 'RADIOLOGY_PACS', name: 'Radiology & PACS Imaging', category: 'DIAGNOSTICS' },
  { code: 'ABDM_GATEWAY', name: 'ABHA / ABDM National Gateway', category: 'INTEGRATION' },
  { code: 'WHATSAPP_AUTOMATION', name: 'WhatsApp Automation & SMS', category: 'INTEGRATION' },
  { code: 'TPA_INSURANCE', name: 'TPA Insurance & Cashless Claims', category: 'BILLING_ADMIN' },
  { code: 'EXECUTIVE_COMMAND', name: 'Executive Command & Audit', category: 'BILLING_ADMIN' }
];

export class PartnerGovernanceService {
  private overridesStore = new Map<string, PartnerGovernanceData>();
  private partnerToTenantMap = new Map<string, string>();
  private tenantToPartnerMap = new Map<string, string>();

  constructor() {
    if (getTestDatabase?.() || process.env['DATABASE_URL']) {
      this.syncFromDatabase().catch(() => {});
    }
  }

  public associatePartnerTenant(partnerId: string, tenantId: string): void {
    this.partnerToTenantMap.set(partnerId, tenantId);
    this.tenantToPartnerMap.set(tenantId, partnerId);
    const existing = this.overridesStore.get(partnerId) || this.overridesStore.get(tenantId);
    if (existing) {
      existing.partnerId = partnerId;
      existing.tenantId = tenantId;
      this.overridesStore.set(partnerId, existing);
      this.overridesStore.set(tenantId, existing);
    }
  }

  /**
   * Syncs existing partner governance records from PostgreSQL database
   */
  async syncFromDatabase(): Promise<void> {
    const db = getDatabase();
    if (!db) return;

    try {
      const rows = await db.select().from(partnerGovernanceOverrides);
      for (const row of rows) {
        let record = this.overridesStore.get(row.partnerId) || this.overridesStore.get(row.tenantId);
        if (!record) {
          record = this.getGovernanceSnapshot(row.partnerId, { tenantId: row.tenantId });
        }

        const mod = record.modules.find((m) => m.code.toUpperCase() === row.moduleCode.toUpperCase());
        if (mod) {
          mod.status = row.status as ModuleStatus;
          if (row.trialEndsAt) mod.trialEndsAt = new Date(row.trialEndsAt).toISOString();
        }

        if (row.maxBeds !== null && row.maxBeds !== undefined) record.quotas.maxBeds = row.maxBeds;
        if (row.maxDoctorSeats !== null && row.maxDoctorSeats !== undefined) record.quotas.maxDoctorSeats = row.maxDoctorSeats;
        if (row.storageQuotaGb !== null && row.storageQuotaGb !== undefined) record.quotas.storageQuotaGb = row.storageQuotaGb;
        if (row.monthlyWhatsAppCredits !== null && row.monthlyWhatsAppCredits !== undefined) record.quotas.monthlyWhatsAppCredits = row.monthlyWhatsAppCredits;

        if (row.globalFreeze) record.killSwitches.globalFreeze = true;
        if (row.billingFreeze) record.killSwitches.billingFreeze = true;
        if (row.communicationFreeze) record.killSwitches.communicationFreeze = true;

        this.overridesStore.set(row.partnerId, record);
        this.overridesStore.set(row.tenantId, record);
      }
      logger.info('Synchronized partner governance from PostgreSQL database.', { count: rows.length });
    } catch (err) {
      logger.warn('Could not sync partner governance from DB table:', { error: String(err) });
    }
  }

  /**
   * Retrieves or initializes the governance record for a partner/tenant
   */
  public getGovernanceSnapshot(
    partnerId: string,
    metadata?: {
      partnerType?: string | undefined;
      facilityName?: string | undefined;
      tenantId?: string | undefined;
      accessibleFeatures?: string[] | undefined;
    }
  ): PartnerGovernanceData {
    let existing = this.overridesStore.get(partnerId);
    if (!existing) {
      const alt = this.partnerToTenantMap.get(partnerId) || this.tenantToPartnerMap.get(partnerId);
      if (alt) existing = this.overridesStore.get(alt);
    }
    if (!existing) {
      for (const rec of this.overridesStore.values()) {
        if (rec.partnerId === partnerId || rec.tenantId === partnerId) {
          existing = rec;
          break;
        }
      }
    }
    if (existing) {
      existing.staffUsers = this.syncStaffUsers(existing.tenantId || partnerId, existing.facilityName);
      this.overridesStore.set(partnerId, existing);
      if (existing.tenantId) this.overridesStore.set(existing.tenantId, existing);
      return existing;
    }

    const partnerType = metadata?.partnerType || 'HOSPITAL';
    const facilityName = metadata?.facilityName || 'Healthcare Facility';
    const tenantId = metadata?.tenantId || this.partnerToTenantMap.get(partnerId) || partnerId;
    const accessible = metadata?.accessibleFeatures || [];

    const modules: GovernanceModule[] = DEFAULT_CORE_MODULES.map((m) => {
      let status: ModuleStatus = 'DISABLED';

      const normType = (partnerType || '').toUpperCase();
      if (normType.includes('HOSPITAL')) {
        if (['CLINICAL_EMR', 'OPD_QUEUE', 'INPATIENT_IPD', 'EMERGENCY_ICU', 'PHARMACY_POS', 'PATHOLOGY_LIMS', 'RADIOLOGY_PACS', 'OT_SURGERY', 'ABDM_GATEWAY', 'WHATSAPP_AUTOMATION', 'TPA_INSURANCE', 'EXECUTIVE_COMMAND'].includes(m.code)) {
          status = 'ACTIVE';
        }
      } else if (normType.includes('CLINIC')) {
        if (['CLINICAL_EMR', 'OPD_QUEUE', 'WHATSAPP_AUTOMATION', 'ABDM_GATEWAY', 'TPA_INSURANCE'].includes(m.code)) {
          status = 'ACTIVE';
        }
      } else if (normType.includes('PATHOLOGY') || normType.includes('LAB')) {
        if (['PATHOLOGY_LIMS', 'WHATSAPP_AUTOMATION', 'ABDM_GATEWAY', 'EXECUTIVE_COMMAND'].includes(m.code)) {
          status = 'ACTIVE';
        }
      } else if (normType.includes('PHARMACY')) {
        if (['PHARMACY_POS', 'WHATSAPP_AUTOMATION', 'EXECUTIVE_COMMAND'].includes(m.code)) {
          status = 'ACTIVE';
        }
      } else if (normType.includes('DIAGNOSTIC')) {
        if (['RADIOLOGY_PACS', 'PATHOLOGY_LIMS', 'WHATSAPP_AUTOMATION', 'ABDM_GATEWAY'].includes(m.code)) {
          status = 'ACTIVE';
        }
      }

      if (accessible.some((af) => af.toLowerCase().includes(m.code.toLowerCase().replace(/_/g, '')) || m.name.toLowerCase().includes(af.toLowerCase()))) {
        status = 'ACTIVE';
      }

      return {
        ...m,
        status,
        trialEndsAt: null,
        lastModifiedBy: 'System Default Provisioning',
        lastModifiedAt: new Date().toISOString(),
        reason: 'Initial onboarding profile default'
      };
    });

    const liveStaff = this.syncStaffUsers(tenantId, facilityName);

    const newRecord: PartnerGovernanceData = {
      partnerId,
      tenantId,
      facilityName,
      partnerType,
      modules,
      quotas: {
        maxBeds: partnerType === 'HOSPITAL' ? 100 : partnerType === 'CLINIC' ? 10 : 0,
        maxDoctorSeats: 15,
        storageQuotaGb: 250,
        monthlyWhatsAppCredits: 5000
      },
      killSwitches: {
        globalFreeze: false,
        billingFreeze: false,
        communicationFreeze: false
      },
      staffUsers: liveStaff,
      auditLog: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'INITIALIZE_GOVERNANCE',
          targetType: 'MODULE',
          targetId: 'ALL',
          changedBy: 'DocSearch Governance System',
          reason: 'Initial partner registration provisioning'
        }
      ],
      updatedAt: new Date().toISOString()
    };

    this.overridesStore.set(partnerId, newRecord);
    if (tenantId && tenantId !== partnerId) {
      this.overridesStore.set(tenantId, newRecord);
    }
    return newRecord;
  }

  private syncStaffUsers(tenantId: string, facilityName: string): GovernanceStaffUser[] {
    const liveUsers = realAuthService.getAllLivePartnerUsers();
    const matched = liveUsers.filter(
      (u) => (u.tenantId && u.tenantId === tenantId) ||
             (u.tenantName && u.tenantName.toLowerCase().trim() === facilityName.toLowerCase().trim())
    );

    if (matched.length > 0) {
      return matched.map((u) => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
        role: (u.roles && u.roles[0]) || 'DOCTOR',
        department: u.organizationType || 'General Medical',
        status: (u.status === 'ACTIVE' ? 'ACTIVE' : u.status === 'SUSPENDED' ? 'SUSPENDED' : 'LOCKED') as any,
        permissions: u.permissions || ['clinical:patients:read'],
        phone: u.phone,
        lastActiveAt: new Date().toISOString()
      }));
    }

    return [
      {
        id: `usr-lead-${tenantId.slice(-6)}`,
        email: `admin@${facilityName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner'}.in`,
        name: 'Chief Medical Director',
        role: 'HOSPITAL_ADMIN',
        department: 'Executive Administration',
        status: 'ACTIVE',
        permissions: [
          'clinical:patients:read',
          'clinical:patients:write',
          'clinical:rx:write',
          'billing:invoices:create',
          'billing:invoices:read',
          'admin:staff:manage'
        ],
        lastActiveAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Updates module status (alias for toggleModule)
   */
  public async updateModuleStatus(
    partnerId: string,
    moduleCode: string,
    targetStatus: ModuleStatus,
    trialDays?: number,
    reason = 'Module status update'
  ): Promise<GovernanceModule> {
    return await this.toggleModule(partnerId, moduleCode, targetStatus, reason, 'DocSearch Founder Command', trialDays || 14);
  }

  /**
   * Toggles a specific module ACTIVE, DISABLED, or TRIAL
   * Persists to PostgreSQL database table company.partner_governance_overrides.
   */
  public async toggleModule(
    partnerId: string,
    moduleCode: string,
    targetStatus: ModuleStatus,
    reason: string,
    actor = 'DocSearch Founder Command',
    trialDays = 14
  ): Promise<GovernanceModule> {
    const snapshot = this.getGovernanceSnapshot(partnerId);
    const mod = snapshot.modules.find((m) => m.code.toUpperCase() === moduleCode.toUpperCase());
    if (!mod) {
      throw new AppError({
        message: `Module with code '${moduleCode}' not recognized in core suite.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const previous = mod.status;
    mod.status = targetStatus;
    mod.lastModifiedBy = actor;
    mod.lastModifiedAt = new Date().toISOString();
    mod.reason = reason || `Changed to ${targetStatus} by ${actor}`;

    let trialEndsDate: Date | null = null;
    if (targetStatus === 'TRIAL') {
      const ends = new Date();
      ends.setDate(ends.getDate() + (trialDays || 14));
      mod.trialEndsAt = ends.toISOString();
      trialEndsDate = ends;
    } else {
      mod.trialEndsAt = null;
    }

    snapshot.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'TOGGLE_MODULE',
      targetType: 'MODULE',
      targetId: moduleCode,
      changedBy: actor,
      reason: reason || `Updated module state to ${targetStatus}`,
      previousState: previous,
      newState: targetStatus
    });

    snapshot.updatedAt = new Date().toISOString();

    // Persist to PostgreSQL database
    const db = getDatabase();
    if (db) {
      try {
        const effectiveTenantId = (snapshot.tenantId && snapshot.tenantId.length === 36)
          ? snapshot.tenantId
          : toDeterministicUuid(snapshot.tenantId || partnerId);

        await db.insert(partnerGovernanceOverrides)
          .values({
            partnerId,
            tenantId: effectiveTenantId,
            moduleCode,
            status: targetStatus,
            trialEndsAt: trialEndsDate,
            reason,
            updatedBy: actor,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [partnerGovernanceOverrides.tenantId, partnerGovernanceOverrides.moduleCode],
            set: {
              status: targetStatus,
              trialEndsAt: trialEndsDate,
              reason,
              updatedBy: actor,
              updatedAt: new Date()
            }
          });
      } catch (err) {
        logger.warn('Failed to persist module toggle to PostgreSQL:', { error: String(err) });
      }
    }

    logger.info(`Partner ${partnerId} module ${moduleCode} changed to ${targetStatus} by ${actor}`);
    return mod;
  }

  /**
   * Updates or suspends a specific staff user
   * If status is SUSPENDED, immediately revokes server-side session.
   */
  public updateStaffUser(
    partnerId: string,
    userIdOrEmail: string,
    updates: {
      role?: string | undefined;
      permissions?: string[] | undefined;
      status?: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | undefined;
      temporaryPassword?: string | undefined;
    },
    reason: string,
    actor = 'DocSearch Founder Command'
  ): GovernanceStaffUser {
    const snapshot = this.getGovernanceSnapshot(partnerId);
    let user = snapshot.staffUsers.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
    );

    if (!user) {
      user = {
        id: userIdOrEmail.includes('@') ? `usr-${Date.now()}` : userIdOrEmail,
        email: userIdOrEmail.includes('@') ? userIdOrEmail : `${userIdOrEmail}@docsearch.health`,
        name: 'Staff Member',
        role: updates.role || 'DOCTOR',
        department: 'General',
        status: updates.status || 'ACTIVE',
        permissions: updates.permissions || ['clinical:patients:read'],
        lastActiveAt: new Date().toISOString()
      };
      snapshot.staffUsers.push(user);
    }

    const previousState = { role: user.role, status: user.status, permissions: [...user.permissions] };

    if (updates.role) user.role = updates.role;
    if (updates.permissions) user.permissions = updates.permissions;
    if (updates.status) user.status = updates.status;

    // Propagate into RealAuthService and SessionRevocationService
    if (updates.status) {
      realAuthService.setPartnerUserStatus(user.email, updates.status);
      if (updates.status === 'SUSPENDED') {
        sessionRevocationService.revokeUser(user.id, reason, actor).catch(() => {});
        sessionRevocationService.revokeUser(user.email, reason, actor).catch(() => {});
      }
    }
    if (updates.role && updates.permissions) {
      const live = realAuthService.getUserByEmail(user.email);
      if (live) {
        live.roles = [updates.role as RoleType];
        live.permissions = updates.permissions;
      }
    }

    snapshot.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_STAFF',
      targetType: 'STAFF',
      targetId: user.email,
      changedBy: actor,
      reason: reason || 'Staff governance adjustment',
      previousState,
      newState: { role: user.role, status: user.status, permissions: user.permissions }
    });

    snapshot.updatedAt = new Date().toISOString();
    return user;
  }

  /**
   * Activates or deactivates emergency kill-switch
   * Immediately terminates sessions if GLOBAL_FREEZE is engaged.
   */
  public async triggerKillSwitch(
    partnerId: string,
    switchType: 'GLOBAL_FREEZE' | 'BILLING_FREEZE' | 'COMMUNICATION_FREEZE',
    enabled: boolean,
    reason: string,
    actor = 'DocSearch Founder Command'
  ): Promise<GovernanceKillSwitches> {
    const snapshot = this.getGovernanceSnapshot(partnerId);

    if (switchType === 'GLOBAL_FREEZE') {
      snapshot.killSwitches.globalFreeze = enabled;
      if (partnerId === 'ALL' || partnerId === 'PLATFORM_GLOBAL') {
        sessionRevocationService.setGlobalFreeze(enabled, reason);
      }
      if (enabled) {
        sessionRevocationService.revokeTenant(snapshot.tenantId || partnerId, reason, actor).catch(() => {});
      } else {
        sessionRevocationService.unrevokeTenant(snapshot.tenantId || partnerId).catch(() => {});
      }
    } else if (switchType === 'BILLING_FREEZE') {
      snapshot.killSwitches.billingFreeze = enabled;
    } else if (switchType === 'COMMUNICATION_FREEZE') {
      snapshot.killSwitches.communicationFreeze = enabled;
    }

    if (enabled) {
      snapshot.killSwitches.frozenAt = new Date().toISOString();
      snapshot.killSwitches.frozenBy = actor;
      snapshot.killSwitches.freezeReason = reason;
    } else {
      if (!snapshot.killSwitches.globalFreeze && !snapshot.killSwitches.billingFreeze && !snapshot.killSwitches.communicationFreeze) {
        snapshot.killSwitches.frozenAt = null;
        snapshot.killSwitches.frozenBy = null;
        snapshot.killSwitches.freezeReason = null;
      }
    }

    snapshot.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'KILL_SWITCH',
      targetType: 'KILL_SWITCH',
      targetId: switchType,
      changedBy: actor,
      reason: reason || `Emergency kill-switch ${switchType} set to ${enabled}`,
      newState: { switchType, enabled }
    });

    snapshot.updatedAt = new Date().toISOString();

    // Persist to PostgreSQL database
    const db = getDatabase();
    if (db) {
      try {
        const effectiveTenantId = (snapshot.tenantId && snapshot.tenantId.length === 36)
          ? snapshot.tenantId
          : toDeterministicUuid(snapshot.tenantId || partnerId);

        await db.insert(partnerGovernanceOverrides)
          .values({
            partnerId,
            tenantId: effectiveTenantId,
            moduleCode: 'KILL_SWITCH',
            globalFreeze: snapshot.killSwitches.globalFreeze,
            billingFreeze: snapshot.killSwitches.billingFreeze,
            communicationFreeze: snapshot.killSwitches.communicationFreeze,
            reason,
            updatedBy: actor,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [partnerGovernanceOverrides.tenantId, partnerGovernanceOverrides.moduleCode],
            set: {
              globalFreeze: snapshot.killSwitches.globalFreeze,
              billingFreeze: snapshot.killSwitches.billingFreeze,
              communicationFreeze: snapshot.killSwitches.communicationFreeze,
              reason,
              updatedBy: actor,
              updatedAt: new Date()
            }
          });
      } catch (err) {
        logger.warn('Failed to persist kill switch to PostgreSQL:', { error: String(err) });
      }
    }

    logger.warn(`KILL SWITCH ${switchType} for partner ${partnerId} set to ${enabled} by ${actor}. Reason: ${reason}`);
    return snapshot.killSwitches;
  }

  /**
   * Adjusts resource and capacity quotas
   * Persists to PostgreSQL database table company.partner_governance_overrides.
   */
  public async updateQuotas(
    partnerId: string,
    quotas: Partial<GovernanceQuotas>,
    reason: string,
    actor = 'DocSearch Founder Command'
  ): Promise<GovernanceQuotas> {
    const snapshot = this.getGovernanceSnapshot(partnerId);
    snapshot.quotas = {
      ...snapshot.quotas,
      ...quotas
    };

    snapshot.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_QUOTAS',
      targetType: 'QUOTA',
      targetId: partnerId,
      changedBy: actor,
      reason: reason || 'Resource quota adjustment',
      newState: snapshot.quotas
    });

    snapshot.updatedAt = new Date().toISOString();

    // Persist to PostgreSQL database
    const db = getDatabase();
    if (db) {
      try {
        const effectiveTenantId = (snapshot.tenantId && snapshot.tenantId.length === 36)
          ? snapshot.tenantId
          : toDeterministicUuid(snapshot.tenantId || partnerId);

        await db.insert(partnerGovernanceOverrides)
          .values({
            partnerId,
            tenantId: effectiveTenantId,
            moduleCode: 'RESOURCE_QUOTAS',
            maxBeds: snapshot.quotas.maxBeds,
            maxDoctorSeats: snapshot.quotas.maxDoctorSeats,
            storageQuotaGb: snapshot.quotas.storageQuotaGb,
            monthlyWhatsAppCredits: snapshot.quotas.monthlyWhatsAppCredits,
            reason,
            updatedBy: actor,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [partnerGovernanceOverrides.tenantId, partnerGovernanceOverrides.moduleCode],
            set: {
              maxBeds: snapshot.quotas.maxBeds,
              maxDoctorSeats: snapshot.quotas.maxDoctorSeats,
              storageQuotaGb: snapshot.quotas.storageQuotaGb,
              monthlyWhatsAppCredits: snapshot.quotas.monthlyWhatsAppCredits,
              reason,
              updatedBy: actor,
              updatedAt: new Date()
            }
          });
      } catch (err) {
        logger.warn('Failed to persist quotas to PostgreSQL:', { error: String(err) });
      }
    }

    return snapshot.quotas;
  }

  public isTenantFrozen(tenantIdOrPartnerId: string): boolean {
    if (sessionRevocationService.isGlobalFrozen()) return true;
    let record = this.overridesStore.get(tenantIdOrPartnerId);
    if (!record) {
      const alt = this.partnerToTenantMap.get(tenantIdOrPartnerId) || this.tenantToPartnerMap.get(tenantIdOrPartnerId);
      if (alt) record = this.overridesStore.get(alt);
    }
    return Boolean(record?.killSwitches?.globalFreeze);
  }

  public isBillingFrozen(tenantIdOrPartnerId: string): boolean {
    if (sessionRevocationService.isGlobalFrozen()) return true;
    let record = this.overridesStore.get(tenantIdOrPartnerId);
    if (!record) {
      const alt = this.partnerToTenantMap.get(tenantIdOrPartnerId) || this.tenantToPartnerMap.get(tenantIdOrPartnerId);
      if (alt) record = this.overridesStore.get(alt);
    }
    return Boolean(record?.killSwitches?.billingFreeze || record?.killSwitches?.globalFreeze);
  }

  public getModuleOverride(tenantIdOrPartnerId: string, featureCode: string): boolean | undefined {
    let record = this.overridesStore.get(tenantIdOrPartnerId);
    if (!record) {
      const alt = this.partnerToTenantMap.get(tenantIdOrPartnerId) || this.tenantToPartnerMap.get(tenantIdOrPartnerId);
      if (alt) record = this.overridesStore.get(alt);
    }
    if (!record) {
      for (const rec of this.overridesStore.values()) {
        if (rec.partnerId === tenantIdOrPartnerId || rec.tenantId === tenantIdOrPartnerId) {
          record = rec;
          this.overridesStore.set(tenantIdOrPartnerId, rec);
          break;
        }
      }
    }
    if (!record) return undefined;

    const target = featureCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mod = record.modules.find((m) => {
      const codeNorm = m.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return codeNorm === target ||
             (target.includes('PHARMACY') && codeNorm.includes('PHARMACY')) ||
             (target.includes('LAB') && codeNorm.includes('PATHOLOGY')) ||
             (target.includes('RADIOLOGY') && codeNorm.includes('RADIOLOGY')) ||
             (target.includes('OT') && codeNorm.includes('OT')) ||
             (target.includes('EMERGENCY') && codeNorm.includes('EMERGENCY')) ||
             (target.includes('IPD') && codeNorm.includes('INPATIENT')) ||
             (target.includes('OPD') && codeNorm.includes('OPD')) ||
             (target.includes('ABDM') && codeNorm.includes('ABDM')) ||
             (target.includes('WHATSAPP') && codeNorm.includes('WHATSAPP'));
    });

    if (!mod) return undefined;

    if (mod.status === 'DISABLED') return false;
    if (mod.status === 'ACTIVE') return true;
    if (mod.status === 'TRIAL') {
      if (mod.trialEndsAt && new Date(mod.trialEndsAt).getTime() < Date.now()) {
        return false;
      }
      return true;
    }
    return undefined;
  }
}

export const partnerGovernanceService = new PartnerGovernanceService();
