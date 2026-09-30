import { desc } from '@docsearch/database';
import {
  getDatabase,
  securityRoles,
  securityPermissions,
  securityPolicies
} from '@docsearch/database';

export class SecurityAdminRepository {
  async getRoles(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityRoles).orderBy(desc(securityRoles.createdAt));
      } catch {}
    }
    return [];
  }

  async getPermissions(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityPermissions).orderBy(desc(securityPermissions.createdAt));
      } catch {}
    }
    return [];
  }

  async getPolicies(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(securityPolicies).orderBy(desc(securityPolicies.createdAt));
      } catch {}
    }
    return [];
  }
}

export const securityAdminRepository = new SecurityAdminRepository();

