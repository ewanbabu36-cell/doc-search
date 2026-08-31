/**
 * Phase 1: Executive & Command Center Data Contracts
 * Architected for strict separation: UI -> Service Layer -> Backend API.
 */

export interface ExecutiveMetrics {
  totalTenants: number;
  activeTenants: number;
  totalBranches: number;
  targetPlatformUptimePercent: number;
  activeSubscribers: number;
  monthlyRecurringRevenueEst: number;
  complianceStatus: string;
}

export interface OperationalKpi {
  id: string;
  label: string;
  value: string;
  subtext?: string | undefined;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
  category: 'growth' | 'infrastructure' | 'security' | 'financial';
  isSampleData: boolean;
}

export interface BusinessPerformanceItem {
  id: string;
  tenantCategory: string;
  partnerCount: number;
  utilizationRate: number;
  growthStatus: 'accelerating' | 'steady' | 'attention';
}

export interface ExecutiveAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  domain: string;
  timestamp: string;
  actionRequired?: string | undefined;
}

export interface RecentActivity {
  id: string;
  eventType: string;
  actor: string;
  organization: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  domain: string;
  icon: string;
  isAvailable: boolean;
}

export interface TrendDataPoint {
  period: string;
  activeTenants: number;
  apiRequestsMillions: number;
}

export interface SystemHealthStatus {
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  isLiveTelemetryConnected: boolean;
  gatewayLatencyMs?: number | undefined;
  databaseClusterStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  authServiceStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  auditLogPipelineStatus: 'ONLINE' | 'BACKLOG' | 'UNAVAILABLE';
  activeAlertCount: number;
}

export interface ExecutiveDashboardData {
  dataSource: 'live' | 'development_preview';
  metrics: ExecutiveMetrics;
  kpis: OperationalKpi[];
  businessPerformance: BusinessPerformanceItem[];
  alerts: ExecutiveAlert[];
  recentActivities: RecentActivity[];
  quickActions: QuickAction[];
  trends: TrendDataPoint[];
  systemHealth: SystemHealthStatus;
  lastUpdated: string;
}
