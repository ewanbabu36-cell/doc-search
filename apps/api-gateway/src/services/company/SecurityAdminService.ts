import { securityAdminRepository } from '../../repositories/company/SecurityAdminRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class SecurityAdminService {
  async getRoles(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getRoles(tx);
    });
  }

  async getPermissions(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getPermissions(tx);
    });
  }

  async getPolicies(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return securityAdminRepository.getPolicies(tx);
    });
  }
}

export const securityAdminService = new SecurityAdminService();
