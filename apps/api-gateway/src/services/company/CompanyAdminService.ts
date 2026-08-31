import { companyAdminRepository } from '../../repositories/company/CompanyAdminRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class CompanyAdminService {
  async getLegalEntities(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getLegalEntities(tx);
    });
  }

  async getDepartments(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getDepartments(tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return companyAdminRepository.getPolicies(tx);
    });
  }
}

export const companyAdminService = new CompanyAdminService();
