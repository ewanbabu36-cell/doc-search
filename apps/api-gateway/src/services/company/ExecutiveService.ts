import { executiveRepository, type CompanyExecutiveSummary } from '../../repositories/company/ExecutiveRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class ExecutiveService {
  async getOverview(session: SessionContext): Promise<CompanyExecutiveSummary> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return executiveRepository.getExecutiveSummary(tx);
    });
  }
}

export const executiveService = new ExecutiveService();
