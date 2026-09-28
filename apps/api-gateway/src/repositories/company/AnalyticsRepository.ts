import { desc, count } from '@docsearch/database';
import {
  getDatabase,
  analyticsReports,
  systemInsights,
  partnerProfiles,
  consultations,
  fhirBundlesRepository
} from '@docsearch/database';

export class AnalyticsRepository {
  async getReports(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(analyticsReports).orderBy(desc(analyticsReports.createdAt));
      } catch {}
    }
    return [];
  }

  async getInsights(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(systemInsights);
      } catch {}
    }
    return [];
  }

  async getUsageMetrics(_category?: string, dbClient = getDatabase()) {
    let partnersCount = 0;
    let consultCount = 0;
    let fhirCount = 0;

    if (dbClient) {
      try {
        const [p] = await dbClient.select({ val: count() }).from(partnerProfiles);
        if (p && typeof p.val === 'number') partnersCount = p.val;
        const [c] = await dbClient.select({ val: count() }).from(consultations);
        if (c && typeof c.val === 'number') consultCount = c.val;
        const [f] = await dbClient.select({ val: count() }).from(fhirBundlesRepository);
        if (f && typeof f.val === 'number') fhirCount = f.val;
      } catch {}
    }

    return [
      { id: 'pum-01', metricName: 'Total Active Healthcare Partners', category: 'PARTNERS', currentValue: partnersCount, previousPeriodValue: 0, changePercent: null, unit: 'COUNT', status: partnersCount > 0 ? 'HEALTHY' : 'NO_DATA', recordedAt: new Date().toISOString() },
      { id: 'pum-02', metricName: 'Daily Outpatient Consultations', category: 'CLINICAL', currentValue: consultCount, previousPeriodValue: 0, changePercent: null, unit: 'CONSULTATIONS', status: consultCount > 0 ? 'HEALTHY' : 'NO_DATA', recordedAt: new Date().toISOString() },
      { id: 'pum-03', metricName: 'FHIR R4 Bundles Generated (ABDM)', category: 'PLATFORM', currentValue: fhirCount, previousPeriodValue: 0, changePercent: null, unit: 'RECORDS', status: fhirCount > 0 ? 'HEALTHY' : 'NO_DATA', recordedAt: new Date().toISOString() }
    ];
  }

  async getCrossTenantAggregates(dbClient = getDatabase()) {
    let consultCount = 0;
    if (dbClient) {
      try {
        const [c] = await dbClient.select({ val: count() }).from(consultations);
        if (c && typeof c.val === 'number') consultCount = c.val;
      } catch {}
    }
    return [
      { id: 'cta-01', metricKey: 'TOTAL_CONSULTATIONS', displayName: 'Total Platform Consultations', aggregatedValue: consultCount, unit: 'COUNT', sampleWindowMinutes: 1440, computedAt: new Date().toISOString() }
    ];
  }

  async getApiTelemetry() {
    return [
      { timestamp: new Date().toISOString(), requestCount: 0, errorCount: 0, p95LatencyMs: 0, p99LatencyMs: 0, activeConnections: 1 }
    ];
  }
}

export const analyticsRepository = new AnalyticsRepository();
