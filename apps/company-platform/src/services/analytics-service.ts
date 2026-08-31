import type {
  PlatformUsageMetricDto,
  ReportCategory,
  CrossTenantAggregatedMetricDto,
  ApiTelemetryTimeSeriesDto,
  SavedReportDto,
  SystemInsightDto,
  AcknowledgeInsightRequest,
  GenerateReportRequest
} from '@docsearch/api-contracts';
import {
  mockPlatformUsageMetrics,
  mockCrossTenantAggregates,
  mockApiTelemetrySeries,
  mockSystemInsights,
  mockSavedReports
} from './mock-analytics-data.js';

export interface IAnalyticsService {
  getPlatformUsageMetrics(category?: ReportCategory | 'ALL'): Promise<PlatformUsageMetricDto[]>;
  getCrossTenantAggregates(): Promise<CrossTenantAggregatedMetricDto[]>;
  getApiTelemetry(): Promise<ApiTelemetryTimeSeriesDto[]>;
  getSystemInsights(): Promise<SystemInsightDto[]>;
  acknowledgeInsight(req: AcknowledgeInsightRequest, actorEmail?: string): Promise<SystemInsightDto>;
  getSavedReports(): Promise<SavedReportDto[]>;
  generateReportSnapshot(
    req: GenerateReportRequest,
    actorEmail?: string
  ): Promise<{ success: boolean; generatedAt: string; message: string }>;
}

export class AnalyticsService implements IAnalyticsService {
  private readonly apiUrl?: string | undefined;
  private usageMetrics: PlatformUsageMetricDto[] = [...mockPlatformUsageMetrics];
  private crossTenantAggs: CrossTenantAggregatedMetricDto[] = [...mockCrossTenantAggregates];
  private apiTelemetry: ApiTelemetryTimeSeriesDto[] = [...mockApiTelemetrySeries];
  private insights: SystemInsightDto[] = [...mockSystemInsights];
  private reports: SavedReportDto[] = [...mockSavedReports];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getPlatformUsageMetrics(
    category?: ReportCategory | 'ALL'
  ): Promise<PlatformUsageMetricDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.set('category', category);
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/usage-metrics?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch analytics usage metrics: ${res.statusText}`);
      return (await res.json()) as PlatformUsageMetricDto[];
    }

    let result = [...this.usageMetrics];
    if (category && category !== 'ALL') {
      result = result.filter((m) => m.category === category);
    }
    return result;
  }

  async getCrossTenantAggregates(): Promise<CrossTenantAggregatedMetricDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/cross-tenant-aggregates`);
      if (!res.ok) throw new Error(`Failed to fetch cross-tenant aggregates: ${res.statusText}`);
      return (await res.json()) as CrossTenantAggregatedMetricDto[];
    }
    return [...this.crossTenantAggs];
  }

  async getApiTelemetry(): Promise<ApiTelemetryTimeSeriesDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/api-telemetry`);
      if (!res.ok) throw new Error(`Failed to fetch API telemetry: ${res.statusText}`);
      return (await res.json()) as ApiTelemetryTimeSeriesDto[];
    }
    return [...this.apiTelemetry];
  }

  async getSystemInsights(): Promise<SystemInsightDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/insights`);
      if (!res.ok) throw new Error(`Failed to fetch system insights: ${res.statusText}`);
      return (await res.json()) as SystemInsightDto[];
    }
    return [...this.insights];
  }

  async acknowledgeInsight(
    req: AcknowledgeInsightRequest,
    _actorEmail = 'lead.architect@docsearch.internal'
  ): Promise<SystemInsightDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/insights/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to acknowledge insight: ${res.statusText}`);
      return (await res.json()) as SystemInsightDto;
    }

    const idx = this.insights.findIndex((i) => i.id === req.insightId);
    const item = this.insights[idx];
    if (idx === -1 || !item) throw new Error(`System insight ${req.insightId} not found`);

    const updated: SystemInsightDto = {
      ...item,
      isAcknowledged: true
    };
    this.insights[idx] = updated;
    return { ...updated };
  }

  async getSavedReports(): Promise<SavedReportDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/saved-reports`);
      if (!res.ok) throw new Error(`Failed to fetch saved reports: ${res.statusText}`);
      return (await res.json()) as SavedReportDto[];
    }
    return [...this.reports];
  }

  async generateReportSnapshot(
    req: GenerateReportRequest,
    _actorEmail = 'bi.analyst@docsearch.internal'
  ): Promise<{ success: boolean; generatedAt: string; message: string }> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/analytics/saved-reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to generate report snapshot: ${res.statusText}`);
      return (await res.json()) as { success: boolean; generatedAt: string; message: string };
    }

    const now = new Date().toISOString();
    const idx = this.reports.findIndex((r) => r.id === req.reportId);
    if (idx !== -1 && this.reports[idx]) {
      this.reports[idx] = {
        ...this.reports[idx],
        lastGeneratedAt: now,
        updatedAt: now
      };
    }

    return {
      success: true,
      generatedAt: now,
      message: `Report snapshot compiled successfully for range: ${req.dateRange}.`
    };
  }
}

export const analyticsService = new AnalyticsService();
