import { aiGovernanceRepository } from '../../repositories/company/AIGovernanceRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class AIGovernanceService {
  async getModels(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getModels(tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getPolicies(tx);
    });
  }

  async getAuditTraces(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return aiGovernanceRepository.getAuditTraces(tx);
    });
  }
}

export const aiGovernanceService = new AIGovernanceService();
