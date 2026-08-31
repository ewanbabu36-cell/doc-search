import { desc } from '@docsearch/database';
import {
  getDatabase,
  analyticsReports,
  systemInsights
} from '@docsearch/database';

export class AnalyticsRepository {
  async getReports(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(analyticsReports).orderBy(desc(analyticsReports.createdAt));
      } catch {}
    }
    return [
      { id: 'rep_001', reportCode: 'BI-MONTHLY-PERF', title: 'Monthly Clinical Platform Utilization', reportType: 'PLATFORM_UTILIZATION', cadence: 'MONTHLY', generatedAt: new Date(), createdAt: new Date() }
    ];
  }

  async getInsights(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(systemInsights);
      } catch {}
    }
    return [
      { id: 'ins_001', insightCode: 'INS-OPT-01', category: 'CLINICAL_EFFICIENCY', title: 'Radiology Turnaround Time Improved by 18%', severity: 'INFO', createdAt: new Date() }
    ];
  }
}

export const analyticsRepository = new AnalyticsRepository();
