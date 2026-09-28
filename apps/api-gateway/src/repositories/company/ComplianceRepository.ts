import { desc } from '@docsearch/database';
import {
  getDatabase,
  complianceFrameworks,
  complianceControls
} from '@docsearch/database';

export class ComplianceRepository {
  async getFrameworks(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(complianceFrameworks).orderBy(desc(complianceFrameworks.createdAt));
      } catch {}
    }
    return [];
  }

  async getControls(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(complianceControls).orderBy(desc(complianceControls.createdAt));
      } catch {}
    }
    return [];
  }
}

export const complianceRepository = new ComplianceRepository();

