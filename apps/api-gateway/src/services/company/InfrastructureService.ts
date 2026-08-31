import { infrastructureRepository } from '../../repositories/company/InfrastructureRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class InfrastructureService {
  async getClusters(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return infrastructureRepository.getClusters(tx);
    });
  }

  async getDatabases(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return infrastructureRepository.getDatabases(tx);
    });
  }

  async getDRPlans(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return infrastructureRepository.getDRPlans(tx);
    });
  }
}

export const infrastructureService = new InfrastructureService();
