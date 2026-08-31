import { z } from 'zod';

export const MetricGranularitySchema = z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']);
export type MetricGranularity = z.infer<typeof MetricGranularitySchema>;

export const ReportCategorySchema = z.enum([
  'PLATFORM_USAGE',
  'API_TELEMETRY',
  'SLA_COMPLIANCE',
  'TENANT_SEGMENTATION',
  'OPERATIONAL_AUDIT'
]);
export type ReportCategory = z.infer<typeof ReportCategorySchema>;

export const TelemetrySourceStatusSchema = z.enum([
  'CONNECTED',
  'DISCONNECTED',
  'PENDING_TELEMETRY_PIPELINE'
]);
export type TelemetrySourceStatus = z.infer<typeof TelemetrySourceStatusSchema>;

export const InsightSeveritySchema = z.enum([
  'INFO',
  'NOTICE',
  'ANOMALY_WARNING',
  'RECOMMENDATION'
]);
export type InsightSeverity = z.infer<typeof InsightSeveritySchema>;

export const TrendDirectionSchema = z.enum(['UP', 'DOWN', 'STABLE', 'NEUTRAL']);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

// DTOs
export const PlatformUsageMetricDtoSchema = z.object({
  id: z.string().uuid(),
  metricCode: z.string().min(2),
  metricName: z.string().min(2),
  category: ReportCategorySchema,
  currentValue: z.string(),
  unit: z.string(),
  granularity: MetricGranularitySchema,
  telemetryStatus: TelemetrySourceStatusSchema,
  dataFreshnessDate: z.string().datetime(),
  trendDirection: TrendDirectionSchema,
  description: z.string()
});
export type PlatformUsageMetricDto = z.infer<typeof PlatformUsageMetricDtoSchema>;

export const CrossTenantAggregatedMetricDtoSchema = z.object({
  id: z.string().uuid(),
  metricCategory: ReportCategorySchema,
  dimension: z.string(),
  anonymizedCohort: z.string(),
  sampleCount: z.number().int().min(0),
  aggregatedValue: z.string(),
  unit: z.string(),
  telemetryStatus: TelemetrySourceStatusSchema,
  recordedDate: z.string().datetime()
});
export type CrossTenantAggregatedMetricDto = z.infer<typeof CrossTenantAggregatedMetricDtoSchema>;

export const ApiTelemetryTimeSeriesDtoSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  endpointCategory: z.string(),
  requestCountEstimate: z.number().int().min(0),
  p95LatencyMs: z.number().min(0),
  errorRatePercent: z.number().min(0).max(100),
  telemetryStatus: TelemetrySourceStatusSchema
});
export type ApiTelemetryTimeSeriesDto = z.infer<typeof ApiTelemetryTimeSeriesDtoSchema>;

export const SavedReportDtoSchema = z.object({
  id: z.string().uuid(),
  reportName: z.string().min(3),
  code: z.string().min(3),
  category: ReportCategorySchema,
  description: z.string(),
  scheduleFrequency: z.string(),
  lastGeneratedAt: z.string().datetime().optional(),
  outputFormat: z.enum(['JSON', 'CSV', 'PDF_SUMMARY']).default('JSON'),
  createdByEmail: z.string(),
  isArchived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SavedReportDto = z.infer<typeof SavedReportDtoSchema>;

export const SystemInsightDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  category: ReportCategorySchema,
  severity: InsightSeveritySchema,
  description: z.string().min(5),
  recommendedAction: z.string().min(5),
  sourceDomain: z.string(),
  detectedAt: z.string().datetime(),
  isAcknowledged: z.boolean().default(false)
});
export type SystemInsightDto = z.infer<typeof SystemInsightDtoSchema>;

// Requests
export const GenerateReportRequestSchema = z.object({
  reportId: z.string().uuid(),
  dateRange: z.string().min(3)
});
export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;

export const AcknowledgeInsightRequestSchema = z.object({
  insightId: z.string().uuid(),
  reason: z.string().min(3)
});
export type AcknowledgeInsightRequest = z.infer<typeof AcknowledgeInsightRequestSchema>;
