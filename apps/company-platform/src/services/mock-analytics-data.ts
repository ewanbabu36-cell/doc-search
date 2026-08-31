import type {
  PlatformUsageMetricDto,
  CrossTenantAggregatedMetricDto,
  ApiTelemetryTimeSeriesDto,
  SavedReportDto,
  SystemInsightDto
} from '@docsearch/api-contracts';

/**
 * Isolated development preview fixtures for Analytics / BI / Intelligence.
 * CRITICAL RULES:
 * - Zero fake revenue / ARR / MRR / financial ROI.
 * - Zero patient statistics or clinical records.
 * - All telemetry sources clearly labeled with telemetryStatus ("PENDING_TELEMETRY_PIPELINE" or "DISCONNECTED").
 * - Cross-tenant data strictly aggregated & anonymized into macro cohorts.
 */

export const mockPlatformUsageMetrics: PlatformUsageMetricDto[] = [
  {
    id: 'met-001',
    metricCode: 'ACTIVE_TENANTS_COUNT',
    metricName: 'Registered Healthcare Tenant Organizations',
    category: 'PLATFORM_USAGE',
    currentValue: '3',
    unit: 'Tenants',
    granularity: 'DAILY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: '2026-08-29T12:00:00.000Z',
    trendDirection: 'UP',
    description: 'Total onboarded healthcare partner organizations with active subscriptions.'
  },
  {
    id: 'met-002',
    metricCode: 'FACILITY_BRANCHES_COUNT',
    metricName: 'Provisioned Facility & Hospital Branches',
    category: 'PLATFORM_USAGE',
    currentValue: '18',
    unit: 'Branches',
    granularity: 'DAILY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: '2026-08-29T12:00:00.000Z',
    trendDirection: 'UP',
    description: 'Active hospital campuses, surgical pavilions, and regional ambulatory centers.'
  },
  {
    id: 'met-003',
    metricCode: 'AUDIT_CHAIN_EVENTS_DAILY',
    metricName: 'Immutable Audit Stream Records (24h)',
    category: 'OPERATIONAL_AUDIT',
    currentValue: '1,420',
    unit: 'Events / Day',
    granularity: 'DAILY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: '2026-08-29T12:00:00.000Z',
    trendDirection: 'STABLE',
    description: 'Cryptographically hashed security, RBAC, and lifecycle transition audit logs.'
  },
  {
    id: 'met-004',
    metricCode: 'GATEWAY_AVG_LATENCY_P95',
    metricName: 'Fastify Gateway P95 Latency Benchmark',
    category: 'API_TELEMETRY',
    currentValue: '28.4',
    unit: 'ms',
    granularity: 'HOURLY',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    dataFreshnessDate: '2026-08-29T12:00:00.000Z',
    trendDirection: 'NEUTRAL',
    description: 'Aggregate 95th percentile response latency across all authenticated gateway routes.'
  }
];

export const mockCrossTenantAggregates: CrossTenantAggregatedMetricDto[] = [
  {
    id: 'agg-001',
    metricCategory: 'TENANT_SEGMENTATION',
    dimension: 'Facility Size Cohort',
    anonymizedCohort: 'Enterprise Hospital Systems (Avg 24 Branches)',
    sampleCount: 4,
    aggregatedValue: '68%',
    unit: 'Share of Platform Load',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedDate: '2026-08-28T00:00:00.000Z'
  },
  {
    id: 'agg-002',
    metricCategory: 'TENANT_SEGMENTATION',
    dimension: 'Facility Size Cohort',
    anonymizedCohort: 'Regional Medical Centers (Avg 6 Branches)',
    sampleCount: 12,
    aggregatedValue: '24%',
    unit: 'Share of Platform Load',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedDate: '2026-08-28T00:00:00.000Z'
  },
  {
    id: 'agg-003',
    metricCategory: 'TENANT_SEGMENTATION',
    dimension: 'Facility Size Cohort',
    anonymizedCohort: 'Specialty Ambulatory Clinics (Avg 1 Branch)',
    sampleCount: 28,
    aggregatedValue: '8%',
    unit: 'Share of Platform Load',
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE',
    recordedDate: '2026-08-28T00:00:00.000Z'
  }
];

export const mockApiTelemetrySeries: ApiTelemetryTimeSeriesDto[] = [
  {
    id: 'tel-001',
    timestamp: '2026-08-29T08:00:00.000Z',
    endpointCategory: 'FHIR R4 Ingress Gateway',
    requestCountEstimate: 3400,
    p95LatencyMs: 31.2,
    errorRatePercent: 0.02,
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE'
  },
  {
    id: 'tel-002',
    timestamp: '2026-08-29T09:00:00.000Z',
    endpointCategory: 'RBAC Session Verification',
    requestCountEstimate: 8900,
    p95LatencyMs: 8.5,
    errorRatePercent: 0.0,
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE'
  },
  {
    id: 'tel-003',
    timestamp: '2026-08-29T10:00:00.000Z',
    endpointCategory: 'Audit Event Hash Ingestion',
    requestCountEstimate: 1250,
    p95LatencyMs: 14.1,
    errorRatePercent: 0.0,
    telemetryStatus: 'PENDING_TELEMETRY_PIPELINE'
  }
];

export const mockSystemInsights: SystemInsightDto[] = [
  {
    id: 'ins-001',
    title: 'PostgreSQL Audit Event Index Compaction Recommended',
    category: 'OPERATIONAL_AUDIT',
    severity: 'RECOMMENDATION',
    description: 'The core.audit_events table has accumulated over 100,000 immutable rows. Routine B-Tree index reindexing is recommended during next scheduled maintenance window.',
    recommendedAction: 'Schedule 15-minute maintenance window via Communication & Content module.',
    sourceDomain: 'Platform Database Engine',
    detectedAt: '2026-08-29T06:00:00.000Z',
    isAcknowledged: false
  },
  {
    id: 'ins-002',
    title: 'Enterprise FHIR Gateway Rate-Limit Quota Headroom',
    category: 'API_TELEMETRY',
    severity: 'INFO',
    description: 'Average peak throughput across enterprise partner connectors is operating at 22% of configured Fastify rate limits.',
    recommendedAction: 'No immediate action required; headroom is optimal for scheduled Q4 partner expansions.',
    sourceDomain: 'Fastify Interoperability Gateway',
    detectedAt: '2026-08-28T14:30:00.000Z',
    isAcknowledged: true
  }
];

export const mockSavedReports: SavedReportDto[] = [
  {
    id: 'rep-001',
    reportName: 'Weekly Platform Audit & RBAC Governance Summary',
    code: 'WEEKLY_AUDIT_GOVERNANCE',
    category: 'OPERATIONAL_AUDIT',
    description: 'Automated executive compilation of role permission mutations, lifecycle transitions, and session anomalies.',
    scheduleFrequency: 'WEEKLY',
    lastGeneratedAt: '2026-08-28T04:00:00.000Z',
    outputFormat: 'JSON',
    createdByEmail: 'ciso.lead@docsearch.internal',
    isArchived: false,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 'rep-002',
    reportName: 'Cross-Tenant Facility Scale & Distribution Matrix',
    code: 'TENANT_FACILITY_DISTRIBUTION',
    category: 'TENANT_SEGMENTATION',
    description: 'Anonymized distribution matrix of provisioned hospital campuses and ambulatory nodes.',
    scheduleFrequency: 'MONTHLY',
    lastGeneratedAt: '2026-08-01T00:00:00.000Z',
    outputFormat: 'CSV',
    createdByEmail: 'ops.lead@docsearch.internal',
    isArchived: false,
    createdAt: '2026-07-15T12:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }
];
