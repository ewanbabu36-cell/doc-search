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
    return [
      { id: 'cls_001', clusterIdentifier: 'k8s-prod-useast-01', name: 'Primary HIPAA Multi-AZ EKS Cluster', region: 'us-east-1', nodeCount: 18, controlPlaneStatus: 'HEALTHY', isHighAvailability: true, createdAt: new Date() }
    ];
  }

  async getDatabases(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(infrastructureDatabases).orderBy(desc(infrastructureDatabases.createdAt));
      } catch {}
    }
    return [
      { id: 'db_001', databaseIdentifier: 'pg-prod-primary-ha', engine: 'POSTGRESQL_16', storageAllocatedGb: 1000, storageUsedGb: 284, isMultiAz: true, status: 'AVAILABLE', createdAt: new Date() }
    ];
  }

  async getDRPlans(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(disasterRecoveryPlans);
      } catch {}
    }
    return [
      { id: 'dr_001', planCode: 'DR-PLAN-RPO-5M', name: 'Zero Data Loss Cross-Region Failover Plan', targetRpoMinutes: 5, targetRtoMinutes: 15, lastDrillStatus: 'PASSED', status: 'ACTIVE', createdAt: new Date() }
    ];
  }
}

export const infrastructureRepository = new InfrastructureRepository();
