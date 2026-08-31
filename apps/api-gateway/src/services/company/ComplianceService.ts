import { complianceRepository } from '../../repositories/company/ComplianceRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class ComplianceService {
  async getFrameworks(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return complianceRepository.getFrameworks(tx);
    });
  }

  async getControls(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return complianceRepository.getControls(tx);
    });
  }
}

export const complianceService = new ComplianceService();
