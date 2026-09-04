import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  salesLeads,
  salesOpportunities,
  marketingCampaigns
} from '@docsearch/database';

export class SalesMarketingRepository {
  async getLeads(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(salesLeads);
        return status ? await q.where(eq(salesLeads.status, status)).orderBy(desc(salesLeads.createdAt)) : await q.orderBy(desc(salesLeads.createdAt));
      } catch {}
    }
    return [
      { id: 'lead_001', leadNumber: 'LD-1001', leadName: 'Metro Health Alliance', contactEmail: 'mha@metrohealth.org', status: status || 'NEW', score: 85, createdAt: new Date() }
    ];
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
    return [
      { id: 'opp_001', opportunityNumber: 'OP-2001', opportunityName: 'Northwest Regional Expansion', estimatedValueCents: 15000000, stage: stage || 'PROPOSAL', probabilityPercent: 70, createdAt: new Date() }
    ];
  }

  async getCampaigns(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(marketingCampaigns);
        return status ? await q.where(eq(marketingCampaigns.status, status)).orderBy(desc(marketingCampaigns.createdAt)) : await q.orderBy(desc(marketingCampaigns.createdAt));
      } catch {}
    }
    return [
      { id: 'cmp_001', campaignCode: 'CMP-2026-Q1', name: 'AI Radiology Launch', status: status || 'ACTIVE', budgetCents: 5000000, createdAt: new Date() }
    ];
  }
}

export const salesMarketingRepository = new SalesMarketingRepository();

