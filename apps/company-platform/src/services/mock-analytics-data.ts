import type {
  PlatformUsageMetricDto,
  CrossTenantAggregatedMetricDto,
  ApiTelemetryTimeSeriesDto,
  SavedReportDto,
  SystemInsightDto
} from '@docsearch/api-contracts';

export const mockPlatformUsageMetrics: PlatformUsageMetricDto[] = [
  {
    id: 'met-001',
    metricCode: 'ACTIVE_TENANTS_COUNT',
    metricName: 'Registered Healthcare Tenant Organizations',
    category: 'PLATFORM_USAGE',
    currentValue: '0',
    unit: 'Tenants',
    granularity: 'DAILY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: new Date().toISOString(),
    trendDirection: 'NEUTRAL',
    description: 'Total onboarded healthcare partner organizations with active subscriptions.'
  },
  {
    id: 'met-002',
    metricCode: 'FACILITY_BRANCHES_COUNT',
    metricName: 'Provisioned Facility & Hospital Branches',
    category: 'PLATFORM_USAGE',
    currentValue: '0',
    unit: 'Branches',
    granularity: 'DAILY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: new Date().toISOString(),
    trendDirection: 'NEUTRAL',
    description: 'Active hospital campuses, surgical pavilions, and regional ambulatory centers.'
  }
];

export const mockCrossTenantAggregates: CrossTenantAggregatedMetricDto[] = [];
export const mockApiTelemetrySeries: ApiTelemetryTimeSeriesDto[] = [];
export const mockSystemInsights: SystemInsightDto[] = [];
export const mockSavedReports: SavedReportDto[] = [];
