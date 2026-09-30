import { desc } from '@docsearch/database';
import {
  getDatabase,
  platformProjects,
  platformEnvironments,
  platformDeployments
} from '@docsearch/database';

export class PlatformEngineeringRepository {
  async getProjects(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(platformProjects).orderBy(desc(platformProjects.createdAt));
      } catch {}
    }
    return [];
  }

  async getEnvironments(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(platformEnvironments).orderBy(desc(platformEnvironments.createdAt));
      } catch {}
    }
    return [];
  }

  async getDeployments(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(platformDeployments);
      } catch {}
    }
    return [];
  }
}

export const platformEngineeringRepository = new PlatformEngineeringRepository();

