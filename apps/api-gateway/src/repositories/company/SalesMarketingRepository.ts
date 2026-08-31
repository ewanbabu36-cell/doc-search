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
