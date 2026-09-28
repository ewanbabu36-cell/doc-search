import { analyticsRepository } from '../../repositories/company/AnalyticsRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase } from '@docsearch/database';

export class AnalyticsService {
  async getReports(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return analyticsRepository.getReports(tx);
    });
  }

  async getInsights(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return analyticsRepository.getInsights(tx);
    });
  }

  async getUsageMetrics(session: SessionContext, category?: string) {
    return withSecurityContext(getDatabase(), session, async () => {
      return analyticsRepository.getUsageMetrics(category);
    });
  }

  async getCrossTenantAggregates(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return analyticsRepository.getCrossTenantAggregates();
    });
  }

  async getApiTelemetry(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async () => {
      return analyticsRepository.getApiTelemetry();
    });
  }
}

export const analyticsService = new AnalyticsService();
