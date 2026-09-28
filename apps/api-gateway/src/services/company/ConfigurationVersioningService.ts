import {
  getDatabase,
  partnerConfigurationVersions,
  partnerCapabilities,
  partnerGovernanceOverrides,
  operationalDepartments,
  roles,
  eq,
  and,
  desc
} from '@docsearch/database';
import { createLogger, AppError } from '@docsearch/shared-core';
import { toDeterministicUuid } from '../../repositories/company/PartnerOnboardingRepository.js';
import { ensureTenantExists } from './PartnerTemplateService.js';

const logger = createLogger('configuration-versioning-service');

export interface ConfigurationDiff {
  capabilities: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  quotas: {
    before: any;
    after: any;
    changed: boolean;
  };
  departments: {
    added: string[];
    removed: string[];
  };
  roles: {
    added: string[];
    removed: string[];
  };
}

export class ConfigurationVersioningService {
  /**
   * Captures a new configuration snapshot and increments version
   */
  async createSnapshot(
    partnerId: string,
    reason: string,
    actor = 'founder@docsearch.health',
    appliedTemplateId?: string,
    appliedTemplateVersion?: number,
    options?: {
      lifecycleStatus?: 'DRAFT' | 'PUBLISHED';
      effectiveFrom?: string;
      effectiveTo?: string | null;
      industry?: string | null;
      operatingModel?: string | null;
    }
  ): Promise<any> {
    const db = getDatabase();
    const pUuid = toDeterministicUuid(partnerId);
    const lifecycleStatus = options?.lifecycleStatus || 'PUBLISHED';
    const effectiveFrom = options?.effectiveFrom || new Date().toISOString();
    const effectiveTo = options?.effectiveTo ?? null;

    let currentVersion = 1;
    let caps: string[] = [];
    let depts: string[] = [];
    let rList: string[] = [];
    let quotaSnapshot: any = {};

    if (db) {
      try {
        await ensureTenantExists(pUuid, partnerId);
        const history = await db
          .select()
          .from(partnerConfigurationVersions)
          .where(eq(partnerConfigurationVersions.tenantId, pUuid))
          .orderBy(desc(partnerConfigurationVersions.versionNumber));

        if (history.length > 0 && history[0]) {
          currentVersion = history[0].versionNumber + 1;
          if (lifecycleStatus === 'PUBLISHED') {
            for (const prev of history) {
              const prevSnap = (prev.snapshot as Record<string, any>) || {};
              if (prevSnap['lifecycleStatus'] === 'PUBLISHED' || !prevSnap['lifecycleStatus']) {
                await db
                  .update(partnerConfigurationVersions)
                  .set({
                    snapshot: {
                      ...prevSnap,
                      lifecycleStatus: 'SUPERSEDED',
                      effectiveTo: effectiveFrom
                    }
                  })
                  .where(eq(partnerConfigurationVersions.id, prev.id));
              }
            }
          }
        }

        const capRows = await db
          .select()
          .from(partnerCapabilities)
          .where(and(eq(partnerCapabilities.tenantId, pUuid), eq(partnerCapabilities.status, 'ACTIVE')));
        caps = capRows.map((c) => c.capabilityCode);

        const deptRows = await db
          .select()
          .from(operationalDepartments)
          .where(and(eq(operationalDepartments.tenantId, pUuid), eq(operationalDepartments.status, 'ACTIVE')));
        depts = deptRows.map((d) => d.departmentName);

        const roleRows = await db.select().from(roles).where(eq(roles.tenantId, pUuid));
        rList = roleRows.map((r) => r.name);

        const [gov] = await db
          .select()
          .from(partnerGovernanceOverrides)
          .where(eq(partnerGovernanceOverrides.tenantId, pUuid));
        if (gov) {
          quotaSnapshot = {
            maxBeds: gov.maxBeds,
            maxDoctorSeats: gov.maxDoctorSeats,
            storageQuotaGb: gov.storageQuotaGb,
            monthlyWhatsAppCredits: gov.monthlyWhatsAppCredits,
            globalFreeze: gov.globalFreeze,
            billingFreeze: gov.billingFreeze
          };
        }

        const snapshotData = {
          lifecycleStatus,
          effectiveFrom,
          effectiveTo,
          industry: options?.industry || null,
          operatingModel: options?.operatingModel || null,
          capabilities: caps,
          departments: depts,
          roles: rList,
          quotas: quotaSnapshot
        };

        const [created] = await db
          .insert(partnerConfigurationVersions)
          .values({
            id: crypto.randomUUID(),
            tenantId: pUuid,
            partnerId,
            versionNumber: currentVersion,
            appliedTemplateId: appliedTemplateId || null,
            appliedTemplateVersion: appliedTemplateVersion || null,
            snapshot: snapshotData,
            diffSummary: `Version ${currentVersion} [${lifecycleStatus}]: ${reason}`,
            changeReason: reason,
            changedBy: actor
          })
          .returning();

        return created;
      } catch (err) {
        logger.warn('Failed to capture configuration snapshot: ' + String(err));
      }
    }

    return {
      versionNumber: currentVersion,
      partnerId,
      lifecycleStatus,
      effectiveFrom,
      effectiveTo,
      changeReason: reason,
      changedBy: actor,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Publishes a DRAFT configuration version and marks prior PUBLISHED versions as SUPERSEDED
   */
  async publishDraftVersion(
    partnerId: string,
    versionNumber: number,
    actor = 'founder@docsearch.health'
  ): Promise<any> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    if (!db) {
      throw new AppError({ message: 'Database unavailable', statusCode: 500 });
    }

    const history = await this.getVersionHistory(partnerId);
    const target = history.find((h) => h.versionNumber === versionNumber);
    if (!target) {
      throw new AppError({
        message: `Configuration version ${versionNumber} not found for partner ${partnerId}`,
        statusCode: 404
      });
    }

    // Mark prior PUBLISHED versions as SUPERSEDED
    for (const prev of history) {
      if (prev.id === target.id) continue;
      const prevSnap = (prev.snapshot as Record<string, any>) || {};
      if (prevSnap['lifecycleStatus'] === 'PUBLISHED' || !prevSnap['lifecycleStatus']) {
        await db
          .update(partnerConfigurationVersions)
          .set({
            snapshot: {
              ...prevSnap,
              lifecycleStatus: 'SUPERSEDED',
              effectiveTo: nowIso
            }
          })
          .where(eq(partnerConfigurationVersions.id, prev.id));
      }
    }

    const updatedSnap = {
      ...((target.snapshot as Record<string, any>) || {}),
      lifecycleStatus: 'PUBLISHED',
      effectiveFrom: nowIso,
      effectiveTo: null,
      publishedBy: actor,
      publishedAt: nowIso
    };

    const [updated] = await db
      .update(partnerConfigurationVersions)
      .set({
        snapshot: updatedSnap,
        diffSummary: `Version ${versionNumber} [PUBLISHED]: ${target.changeReason || 'Published configuration'}`
      })
      .where(eq(partnerConfigurationVersions.id, target.id))
      .returning();

    return updated;
  }

  /**
   * Retrieves version history for a partner
   */
  async getVersionHistory(partnerId: string): Promise<any[]> {
    const db = getDatabase();
    const pUuid = toDeterministicUuid(partnerId);
    if (!db) return [];

    try {
      return await db
        .select()
        .from(partnerConfigurationVersions)
        .where(eq(partnerConfigurationVersions.tenantId, pUuid))
        .orderBy(desc(partnerConfigurationVersions.versionNumber));
    } catch {
      return [];
    }
  }

  /**
   * Computes diff between two configuration versions
   */
  async compareVersions(partnerId: string, v1: number, v2: number): Promise<ConfigurationDiff> {
    const history = await this.getVersionHistory(partnerId);
    const ver1 = history.find((h) => h.versionNumber === v1);
    const ver2 = history.find((h) => h.versionNumber === v2);

    if (!ver1 || !ver2) {
      throw new AppError({ message: 'One or both configuration versions not found', statusCode: 404 });
    }

    const s1 = ver1.snapshot || {};
    const s2 = ver2.snapshot || {};

    const caps1: string[] = s1.capabilities || [];
    const caps2: string[] = s2.capabilities || [];

    const addedCaps = caps2.filter((c) => !caps1.includes(c));
    const removedCaps = caps1.filter((c) => !caps2.includes(c));
    const unchangedCaps = caps1.filter((c) => caps2.includes(c));

    const depts1: string[] = s1.departments || [];
    const depts2: string[] = s2.departments || [];

    return {
      capabilities: {
        added: addedCaps,
        removed: removedCaps,
        unchanged: unchangedCaps
      },
      quotas: {
        before: s1.quotas || {},
        after: s2.quotas || {},
        changed: JSON.stringify(s1.quotas) !== JSON.stringify(s2.quotas)
      },
      departments: {
        added: depts2.filter((d) => !depts1.includes(d)),
        removed: depts1.filter((d) => !depts2.includes(d))
      },
      roles: {
        added: (s2.roles || []).filter((r: string) => !(s1.roles || []).includes(r)),
        removed: (s1.roles || []).filter((r: string) => !(s2.roles || []).includes(r))
      }
    };
  }

  /**
   * Rolls back partner configuration to a previous version snapshot
   */
  async rollbackToVersion(
    partnerId: string,
    targetVersion: number,
    actor = 'founder@docsearch.health'
  ): Promise<{ success: boolean; newVersion: number; message: string }> {
    const history = await this.getVersionHistory(partnerId);
    const target = history.find((h) => h.versionNumber === targetVersion);

    if (!target) {
      throw new AppError({ message: `Target version ${targetVersion} not found for rollback`, statusCode: 404 });
    }

    const db = getDatabase();
    const pUuid = toDeterministicUuid(partnerId);
    const s = target.snapshot || {};

    if (db) {
      // 1. Restore capabilities
      if (Array.isArray(s.capabilities)) {
        // Disable all current
        await db
          .update(partnerCapabilities)
          .set({ status: 'DISABLED', updatedBy: actor, updatedAt: new Date() })
          .where(eq(partnerCapabilities.tenantId, pUuid));

        // Enable snapshot capabilities
        for (const cap of s.capabilities) {
          await db
            .insert(partnerCapabilities)
            .values({
              id: crypto.randomUUID(),
              partnerId,
              tenantId: pUuid,
              capabilityCode: cap,
              status: 'ACTIVE',
              updatedBy: actor
            })
            .onConflictDoUpdate({
              target: [partnerCapabilities.tenantId, partnerCapabilities.capabilityCode],
              set: { status: 'ACTIVE', updatedBy: actor, updatedAt: new Date() }
            });
        }
      }

      // 2. Restore quotas
      if (s.quotas) {
        await db
          .update(partnerGovernanceOverrides)
          .set({
            maxBeds: s.quotas.maxBeds,
            maxDoctorSeats: s.quotas.maxDoctorSeats,
            storageQuotaGb: s.quotas.storageQuotaGb,
            monthlyWhatsAppCredits: s.quotas.monthlyWhatsAppCredits,
            globalFreeze: s.quotas.globalFreeze || false,
            billingFreeze: s.quotas.billingFreeze || false,
            updatedBy: actor,
            updatedAt: new Date()
          })
          .where(eq(partnerGovernanceOverrides.tenantId, pUuid));
      }
    }

    // 3. Create a new version recording the rollback
    const nextVer = (history[0]?.versionNumber || targetVersion) + 1;
    if (db) {
      await db.insert(partnerConfigurationVersions).values({
        id: crypto.randomUUID(),
        tenantId: pUuid,
        partnerId,
        versionNumber: nextVer,
        appliedTemplateId: target.appliedTemplateId,
        appliedTemplateVersion: target.appliedTemplateVersion,
        snapshot: s,
        diffSummary: `Rollback to v${targetVersion}`,
        changeReason: `Reverted to snapshot of version ${targetVersion}`,
        changedBy: actor
      });
    }

    return {
      success: true,
      newVersion: nextVer,
      message: `Successfully rolled back partner configuration to version ${targetVersion}. Created new active version ${nextVer}.`
    };
  }
}

export const configurationVersioningService = new ConfigurationVersioningService();
