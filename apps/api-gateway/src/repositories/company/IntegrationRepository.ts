import { desc } from '@docsearch/database';
import {
  getDatabase,
  integrationProviders,
  integrationEndpoints,
  webhookEndpoints
} from '@docsearch/database';

export class IntegrationRepository {
  async getProviders(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(integrationProviders).orderBy(desc(integrationProviders.createdAt));
      } catch {}
    }
    return [];
  }

  async getEndpoints(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(integrationEndpoints).orderBy(desc(integrationEndpoints.createdAt));
      } catch {}
    }
    return [];
  }

  async getWebhooks(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt));
      } catch {}
    }
    return [];
  }
}

export const integrationRepository = new IntegrationRepository();

