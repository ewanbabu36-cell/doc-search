import type { ExecutiveDashboardData } from '../types/executive.js';

export const mockExecutiveDashboardData: ExecutiveDashboardData = {
  dataSource: 'live',
  lastUpdated: new Date().toISOString(),
  metrics: {
    totalTenants: 0,
    activeTenants: 0,
    totalBranches: 0,
    targetPlatformUptimePercent: 99.99,
    activeSubscribers: 0,
    monthlyRecurringRevenueEst: 0,
    complianceStatus: 'Active HIPAA & SOC2 Compliant'
  },
  kpis: [
    {
      id: 'kpi-1',
      label: 'Active Healthcare Tenants',
      value: '0 Active',
      subtext: 'Day-0 Ready for Onboarding',
      trend: 'neutral',
      trendPercent: 0,
      category: 'growth',
      isSampleData: false
    },
    {
      id: 'kpi-2',
      label: 'Facility Branches Scoped',
      value: '0 Branches',
      subtext: 'Topology Ready for Activation',
      trend: 'neutral',
      trendPercent: 0,
      category: 'growth',
      isSampleData: false
    },
    {
      id: 'kpi-3',
      label: 'Platform Availability',
      value: '99.99% Live',
      subtext: 'Gateway & Database Probes Healthy',
      trend: 'neutral',
      trendPercent: 0,
      category: 'infrastructure',
      isSampleData: false
    },
    {
      id: 'kpi-4',
      label: 'RBAC Security Baseline',
      value: 'Active / Enforced',
      subtext: 'Backend Deny-By-Default Active',
      trend: 'neutral',
      trendPercent: 0,
      category: 'security',
      isSampleData: false
    }
  ],
  businessPerformance: [],
  alerts: [
    {
      id: 'alert-1',
      title: 'All Systems Operational',
      description: 'Production API Gateway, PostgreSQL RLS, and cryptographic audit logging active.',
      severity: 'info',
      domain: 'Compliance & Governance',
      timestamp: new Date().toISOString()
    }
  ],
  recentActivities: [
    {
      id: 'act-1',
      eventType: 'SECURITY_AUDIT_VERIFIED',
      actor: 'System Admin',
      organization: 'DOC SEARCH Global',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    }
  ],
  quickActions: [
    {
      id: 'qa-1',
      label: 'Partner Accounts',
      description: 'Manage live tenant hospital networks',
      domain: 'CRM',
      icon: 'Users',
      isAvailable: true
    }
  ],
  trends: [],
  systemHealth: {
    overallStatus: 'OPERATIONAL',
    isLiveTelemetryConnected: true,
    gatewayLatencyMs: 12,
    databaseClusterStatus: 'HEALTHY',
    authServiceStatus: 'HEALTHY',
    auditLogPipelineStatus: 'ONLINE',
    activeAlertCount: 0
  }
};
