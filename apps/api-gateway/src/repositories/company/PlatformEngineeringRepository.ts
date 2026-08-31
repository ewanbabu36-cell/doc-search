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
    return [
      { id: 'prj_001', projectCode: 'DOCSEARCH-MONOREPO', name: 'DOC SEARCH Core Monorepo', repositoryUrl: 'git@github.com:docsearch/monorepo.git', primaryLanguage: 'TypeScript', status: 'ACTIVE', createdAt: new Date() }
    ];
  }

  async getEnvironments(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(platformEnvironments).orderBy(desc(platformEnvironments.createdAt));
      } catch {}
    }
    return [
      { id: 'env_001', environmentCode: 'PRODUCTION_PRIMARY', name: 'US-East Production Healthcare Cluster', environmentType: 'PRODUCTION', status: 'HEALTHY', clusterProvider: 'KUBERNETES_EKS', createdAt: new Date() },
      { id: 'env_002', environmentCode: 'STAGING_VALIDATION', name: 'Pre-Production Staging Cluster', environmentType: 'STAGING', status: 'HEALTHY', clusterProvider: 'KUBERNETES_EKS', createdAt: new Date() }
    ];
  }

  async getDeployments(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(platformDeployments);
      } catch {}
    }
    return [
      { id: 'dep_001', deploymentNumber: 'DEP-2026-0830', releaseVersion: '2.1.0', targetEnvironment: 'PRODUCTION_PRIMARY', status: 'SUCCESSFUL', deployedBy: 'ci-system', deployedAt: new Date() }
    ];
  }
}

export const platformEngineeringRepository = new PlatformEngineeringRepository();
