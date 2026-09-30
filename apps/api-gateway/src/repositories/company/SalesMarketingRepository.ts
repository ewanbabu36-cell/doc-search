import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  salesLeads,
  salesOpportunities,
  marketingCampaigns,
  partnerProfiles,
  partnerOnboardingStagedRegistrations
} from '@docsearch/database';

export class SalesMarketingRepository {
  async getLeads(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(salesLeads);
        return status ? await q.where(eq(salesLeads.status, status)).orderBy(desc(salesLeads.createdAt)) : await q.orderBy(desc(salesLeads.createdAt));
      } catch {}
    }
    return [];
  }

  async getLeadById(leadId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [lead] = await dbClient.select().from(salesLeads).where(eq(salesLeads.id, leadId)).limit(1);
        return lead || null;
      } catch {}
    }
    return null;
  }

  async createLead(
    leadData: {
      organizationName: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      contactRoleTitle?: string;
      source?: string;
      status?: string;
      assignedOwnerId?: string;
      assignedOwnerEmail?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
    dbClient = getDatabase()
  ) {
    if (dbClient) {
      const [inserted] = await dbClient
        .insert(salesLeads)
        .values({
          id: crypto.randomUUID(),
          organizationName: leadData.organizationName,
          contactName: leadData.contactName,
          contactEmail: leadData.contactEmail,
          contactPhone: leadData.contactPhone,
          contactRoleTitle: leadData.contactRoleTitle,
          source: leadData.source || 'INBOUND_WEB',
          status: leadData.status || 'NEW',
          assignedOwnerId: leadData.assignedOwnerId,
          assignedOwnerEmail: leadData.assignedOwnerEmail || 'sales@docsearch.internal',
          notes: leadData.notes,
          metadata: leadData.metadata || {}
        })
        .returning();
      return inserted;
    }
    return null;
  }

  async updateLead(
    leadId: string,
    updates: Partial<{
      status: string;
      notes: string | null;
      nextFollowUpDate: Date | null;
      lastActivityDate: Date | null;
      metadata: Record<string, any>;
    }>,

    dbClient = getDatabase()
  ) {
    if (dbClient) {
      const [updated] = await dbClient
        .update(salesLeads)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(salesLeads.id, leadId))
        .returning();
      return updated;
    }
    return null;
  }

  async getOpportunities(stage?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(salesOpportunities);
        return stage ? await q.where(eq(salesOpportunities.stage, stage)).orderBy(desc(salesOpportunities.createdAt)) : await q.orderBy(desc(salesOpportunities.createdAt));
      } catch {}
    }
    return [];
  }

  async getCampaigns(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(marketingCampaigns);
        return status ? await q.where(eq(marketingCampaigns.status, status)).orderBy(desc(marketingCampaigns.createdAt)) : await q.orderBy(desc(marketingCampaigns.createdAt));
      } catch {}
    }
    return [];
  }

  async checkDuplicates(
    params: { email?: string | undefined; phone?: string | undefined; organizationName?: string | undefined; leadId?: string | undefined },
    dbClient = getDatabase()
  ) {
    const duplicates: Array<{ id: string; source: 'PARTNER' | 'STAGED_REGISTRATION' | 'LEAD'; name: string; email: string; phone?: string | undefined; matchReason: string }> = [];
    if (!dbClient) return { hasDuplicate: false, duplicates: [] };

    const emailNorm = params.email?.trim().toLowerCase();
    const phoneNorm = params.phone?.replace(/[^0-9]/g, '');
    const orgNameNorm = params.organizationName?.trim().toLowerCase();

    // 1. Check partner_profiles
    try {
      const allPartners = await dbClient.select().from(partnerProfiles).limit(100);
      for (const p of allPartners) {
        if (emailNorm && p.primaryContactEmail?.toLowerCase() === emailNorm) {
          duplicates.push({ id: p.id, source: 'PARTNER', name: p.tradeName, email: p.primaryContactEmail, phone: p.primaryContactPhone || undefined, matchReason: 'Matching contact email with existing Partner' });
        } else if (phoneNorm && p.primaryContactPhone && p.primaryContactPhone.replace(/[^0-9]/g, '').slice(-10) === phoneNorm.slice(-10)) {
          duplicates.push({ id: p.id, source: 'PARTNER', name: p.tradeName, email: p.primaryContactEmail, phone: p.primaryContactPhone || undefined, matchReason: 'Matching contact phone with existing Partner' });
        } else if (orgNameNorm && (p.tradeName.toLowerCase() === orgNameNorm || p.legalName.toLowerCase() === orgNameNorm)) {
          duplicates.push({ id: p.id, source: 'PARTNER', name: p.tradeName, email: p.primaryContactEmail, phone: p.primaryContactPhone || undefined, matchReason: 'Matching organization name with existing Partner' });
        }
      }
    } catch {}

    // 2. Check partner_onboarding_staged_registrations
    try {
      const allStaged = await dbClient.select().from(partnerOnboardingStagedRegistrations).limit(100);
      for (const s of allStaged) {
        if (emailNorm && s.contactEmail?.toLowerCase() === emailNorm) {
          duplicates.push({ id: s.id, source: 'STAGED_REGISTRATION', name: s.organizationName, email: s.contactEmail, phone: s.contactPhone || undefined, matchReason: 'Matching contact email in KYC verification queue' });
        } else if (phoneNorm && s.contactPhone && s.contactPhone.replace(/[^0-9]/g, '').slice(-10) === phoneNorm.slice(-10)) {
          duplicates.push({ id: s.id, source: 'STAGED_REGISTRATION', name: s.organizationName, email: s.contactEmail, phone: s.contactPhone || undefined, matchReason: 'Matching contact phone in KYC verification queue' });
        } else if (orgNameNorm && s.organizationName.toLowerCase() === orgNameNorm) {
          duplicates.push({ id: s.id, source: 'STAGED_REGISTRATION', name: s.organizationName, email: s.contactEmail, phone: s.contactPhone || undefined, matchReason: 'Matching organization name in KYC verification queue' });
        }
      }
    } catch {}

    return {
      hasDuplicate: duplicates.length > 0,
      duplicates
    };
  }
}

export const salesMarketingRepository = new SalesMarketingRepository();

