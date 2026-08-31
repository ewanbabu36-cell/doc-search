import { supportRepository } from '../../repositories/company/SupportRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class SupportService {
  async getTickets(status: string | undefined, priority: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return supportRepository.getTickets(status, priority, tx);
    });
  }

  async getTicketById(ticketId: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return supportRepository.getTicketById(ticketId, tx);
    });
  }

  async getPartnerHealth(partnerId: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return supportRepository.getPartnerHealth(partnerId, tx);
    });
  }
}

export const supportService = new SupportService();
