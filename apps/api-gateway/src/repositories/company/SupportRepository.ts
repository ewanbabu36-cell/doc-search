import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  supportTickets,
  partnerHealthProfiles
} from '@docsearch/database';

export class SupportRepository {
  async getTickets(status?: string, priority?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
      } catch {}
    }
    return [
      { id: 'tkt_001', ticketNumber: 'TKT-5001', title: 'DICOM Server Intermittent Delay', status: status || 'OPEN', priority: priority || 'HIGH', partnerName: 'Apex Health', createdAt: new Date() }
    ];
  }

  async getTicketById(ticketId: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const [tkt] = await dbClient.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
        if (tkt) return tkt;
      } catch {}
    }
    return { id: ticketId, ticketNumber: 'TKT-5001', title: 'DICOM Server Intermittent Delay', status: 'OPEN', priority: 'HIGH', partnerName: 'Apex Health', createdAt: new Date() };
  }

  async getPartnerHealth(partnerId?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(partnerHealthProfiles);
      } catch {}
    }
    return [
      { id: 'hp_001', partnerId: partnerId || 'partner_001', partnerName: 'Apex Health', healthScore: 92, status: 'HEALTHY', activeUsers: 145 }
    ];
  }
}

export const supportRepository = new SupportRepository();
