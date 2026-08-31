import { platformEngineeringRepository } from '../../repositories/company/PlatformEngineeringRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class PlatformEngineeringService {
  async getProjects(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return platformEngineeringRepository.getProjects(tx);
    });
  }

  async getEnvironments(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return platformEngineeringRepository.getEnvironments(tx);
    });
  }

  async getDeployments(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return platformEngineeringRepository.getDeployments(tx);
    });
  }
}

export const platformEngineeringService = new PlatformEngineeringService();
