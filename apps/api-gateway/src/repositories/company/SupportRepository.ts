import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  supportTickets,
  partnerHealthProfiles
} from '@docsearch/database';

export class SupportRepository {
  async getTickets(_status?: string, _priority?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
      } catch {}
    }
    return [];
  }

  async getTicketById(ticketId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [tkt] = await dbClient.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
        if (tkt) return tkt;
      } catch {}
    }
    return null;
  }

  async getPartnerHealth(_partnerId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(partnerHealthProfiles);
      } catch {}
    }
    return [];
  }
}

export const supportRepository = new SupportRepository();

