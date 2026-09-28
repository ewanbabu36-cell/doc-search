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

import { apiCall, isMockFallbackAllowed } from './api-client.js';

export class AnalyticsService implements IAnalyticsService {
  private usageMetrics: PlatformUsageMetricDto[] = [...mockPlatformUsageMetrics];
  private crossTenantAggs: CrossTenantAggregatedMetricDto[] = [...mockCrossTenantAggregates];
  private apiTelemetry: ApiTelemetryTimeSeriesDto[] = [...mockApiTelemetrySeries];
  private insights: SystemInsightDto[] = [...mockSystemInsights];
  private reports: SavedReportDto[] = [...mockSavedReports];

  constructor(_apiUrl?: string | undefined) {}

  async getPlatformUsageMetrics(
    category?: ReportCategory | 'ALL'
  ): Promise<PlatformUsageMetricDto[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.set('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await apiCall<PlatformUsageMetricDto[]>(`/api/v1/company/analytics/usage-metrics${query}`);
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      let result = [...this.usageMetrics];
      if (category && category !== 'ALL') {
        result = result.filter((m) => m.category === category);
      }
      return result;
    }
  }

  async getCrossTenantAggregates(): Promise<CrossTenantAggregatedMetricDto[]> {
    try {
      return await apiCall<CrossTenantAggregatedMetricDto[]>('/api/v1/company/analytics/cross-tenant-aggregates');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.crossTenantAggs];
    }
  }

  async getApiTelemetry(): Promise<ApiTelemetryTimeSeriesDto[]> {
    try {
      return await apiCall<ApiTelemetryTimeSeriesDto[]>('/api/v1/company/analytics/api-telemetry');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.apiTelemetry];
    }
  }

  async getSystemInsights(): Promise<SystemInsightDto[]> {
    try {
      return await apiCall<SystemInsightDto[]>('/api/v1/company/analytics/insights');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.insights];
    }
  }

  async acknowledgeInsight(
    req: AcknowledgeInsightRequest,
    _actorEmail = 'lead.architect@docsearch.internal'
  ): Promise<SystemInsightDto> {
    try {
      return await apiCall<SystemInsightDto>('/api/v1/company/analytics/insights/acknowledge', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
  }

  async getSavedReports(): Promise<SavedReportDto[]> {
    try {
      return await apiCall<SavedReportDto[]>('/api/v1/company/analytics/reports');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.reports];
    }
  }

  async generateReportSnapshot(
    req: GenerateReportRequest,
    _actorEmail = 'bi.analyst@docsearch.internal'
  ): Promise<{ success: boolean; generatedAt: string; message: string }> {
    try {
      return await apiCall<{ success: boolean; generatedAt: string; message: string }>('/api/v1/company/analytics/reports/generate', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
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
}

export const analyticsService = new AnalyticsService();
