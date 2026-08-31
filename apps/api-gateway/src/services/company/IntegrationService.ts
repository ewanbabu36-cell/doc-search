import { integrationRepository } from '../../repositories/company/IntegrationRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class IntegrationService {
  async getProviders(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return integrationRepository.getProviders(tx);
    });
  }

  async getEndpoints(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return integrationRepository.getEndpoints(tx);
    });
  }

  async getWebhooks(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return integrationRepository.getWebhooks(tx);
    });
  }
}

export const integrationService = new IntegrationService();
