import { desc } from '@docsearch/database';
import {
  getDatabase,
  infrastructureClusters,
  infrastructureDatabases,
  disasterRecoveryPlans
} from '@docsearch/database';

export class InfrastructureRepository {
  async getClusters(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(infrastructureClusters).orderBy(desc(infrastructureClusters.createdAt));
      } catch {}
    }
    return [];
  }

  async getDatabases(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(infrastructureDatabases).orderBy(desc(infrastructureDatabases.createdAt));
      } catch {}
    }
    return [];
  }

  async getDRPlans(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(disasterRecoveryPlans);
      } catch {}
    }
    return [];
  }
}

export const infrastructureRepository = new InfrastructureRepository();

