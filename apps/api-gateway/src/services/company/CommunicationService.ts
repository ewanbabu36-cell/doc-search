import { communicationRepository } from '../../repositories/company/CommunicationRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class CommunicationService {
  async getContentItems(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getContentItems(status, tx);
    });
  }

  async getTemplates(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getTemplates(tx);
    });
  }
}

export const communicationService = new CommunicationService();
