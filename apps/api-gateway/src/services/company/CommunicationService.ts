import { communicationRepository } from '../../repositories/company/CommunicationRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class CommunicationService {
  async getContentItems(status: string | undefined, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getContentItems(status, tx);
    });
  }

  async getContentItemById(id: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getContentItemById(id, tx);
    });
  }

  async transitionContentStatus(id: string, toStatus: string, _reason: string, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.updateContentItemStatus(id, toStatus, tx);
    });
  }

  async getTemplates(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getTemplates(tx);
    });
  }

  async getDispatchRecords(
    filters: { contentItemId?: string; partnerId?: string; status?: string } | undefined,
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.getDispatchRecords(filters, tx);
    });
  }

  async triggerDispatch(data: any, session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return communicationRepository.createDispatchRecord(data, tx);
    });
  }
}

export const communicationService = new CommunicationService();
