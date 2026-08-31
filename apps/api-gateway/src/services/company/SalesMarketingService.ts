import { salesMarketingRepository } from '../../repositories/company/SalesMarketingRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class SalesMarketingService {
  async getLeads(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getLeads(status, tx);
    });
  }

  async getOpportunities(stage: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getOpportunities(stage, tx);
    });
  }

  async getCampaigns(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return salesMarketingRepository.getCampaigns(status, tx);
    });
  }
}

export const salesMarketingService = new SalesMarketingService();
