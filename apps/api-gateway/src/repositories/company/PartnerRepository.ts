import { eq, desc, and } from '@docsearch/database';
import {
  getDatabase,
  partnerProfiles,
  partnerLifecycleTransitions,
  type PartnerProfile,
  type NewPartnerProfile
} from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export interface FindPartnersParams {
  lifecycleStatus?: string | undefined;
  partnerType?: string | undefined;
  limit?: number;
  offset?: number;
}

const memoryPartners: PartnerProfile[] = [];

export class PartnerRepository {
  async findMany(
    params: FindPartnersParams = {},
    dbClient = getDatabase()
  ): Promise<{ items: PartnerProfile[]; total: number }> {
    if (dbClient) {
      try {
        const conditions = [];
        if (params.lifecycleStatus) {
          conditions.push(eq(partnerProfiles.lifecycleStatus, params.lifecycleStatus));
        }
        if (params.partnerType) {
          conditions.push(eq(partnerProfiles.partnerType, params.partnerType));
        }

        const query = dbClient.select().from(partnerProfiles);
        const items =
          conditions.length > 0
            ? await query.where(and(...conditions)).limit(params.limit ?? 20).offset(params.offset ?? 0).orderBy(desc(partnerProfiles.createdAt))
            : await query.limit(params.limit ?? 20).offset(params.offset ?? 0).orderBy(desc(partnerProfiles.createdAt));

        return { items, total: items.length };
      } catch {
        // Fallback to memory
      }
    }

    let filtered = [...memoryPartners];
    if (params.lifecycleStatus) {
      filtered = filtered.filter((p) => p.lifecycleStatus === params.lifecycleStatus);
    }
    if (params.partnerType) {
      filtered = filtered.filter((p) => p.partnerType === params.partnerType);
    }
    return { items: filtered, total: filtered.length };
  }

  async findById(partnerId: string, dbClient = getDatabase()): Promise<PartnerProfile | null> {
    if (dbClient) {
      try {
        const [found] = await dbClient
          .select()
          .from(partnerProfiles)
          .where(eq(partnerProfiles.id, partnerId))
          .limit(1);
        if (found) return found;
      } catch {
        // Fallback
      }
    }
    return memoryPartners.find((p) => p.id === partnerId) || null;
  }

  async create(data: NewPartnerProfile, dbClient = getDatabase()): Promise<PartnerProfile> {
    if (dbClient) {
      try {
        const [created] = await dbClient.insert(partnerProfiles).values(data).returning();
        if (created) return created;
      } catch {
        // Fallback
      }
    }

    const created: PartnerProfile = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId || crypto.randomUUID(),
      legalName: data.legalName,
      tradeName: data.tradeName,
      partnerType: data.partnerType ?? 'HOSPITAL_NETWORK',
      lifecycleStatus: data.lifecycleStatus ?? 'LEAD',
      verificationStatus: data.verificationStatus ?? 'PENDING',
      onboardingStep: data.onboardingStep ?? 'ORGANIZATION_PROFILE',
      onboardingProgressPercent: data.onboardingProgressPercent ?? 0,
      primaryContactName: data.primaryContactName,
      primaryContactEmail: data.primaryContactEmail,
      primaryContactPhone: data.primaryContactPhone ?? null,
      primaryContactRole: data.primaryContactRole ?? null,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryPartners.push(created);
    return created;
  }

  async updateStatus(
    partnerId: string,
    fromStatus: string,
    toStatus: string,
    transitionedBy: string,
    reason: string,
    dbClient = getDatabase()
  ): Promise<PartnerProfile> {
    if (dbClient) {
      try {
        const [updated] = await dbClient
          .update(partnerProfiles)
          .set({ lifecycleStatus: toStatus, updatedAt: new Date() })
          .where(and(eq(partnerProfiles.id, partnerId), eq(partnerProfiles.lifecycleStatus, fromStatus)))
          .returning();

        if (updated) {
          await dbClient.insert(partnerLifecycleTransitions).values({
            partnerId,
            fromStatus,
            toStatus,
            actorId: transitionedBy,
            actorEmail: 'admin@docsearch.health',
            reason
          });
          return updated;
        }
      } catch {
        // Fallback
      }
    }

    const idx = memoryPartners.findIndex((p) => p.id === partnerId && p.lifecycleStatus === fromStatus);
    const existing = memoryPartners[idx];
    if (idx === -1 || !existing) {
      throw AppError.badRequest(`Partner ${partnerId} not found with status ${fromStatus}`);
    }

    const updated: PartnerProfile = {
      ...existing,
      lifecycleStatus: toStatus,
      updatedAt: new Date()
    };
    memoryPartners[idx] = updated;
    return updated;
  }
}

export const partnerRepository = new PartnerRepository();
