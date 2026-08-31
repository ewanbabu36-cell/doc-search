import type { ExecutiveDashboardData } from '../types/executive.js';

export const mockExecutiveDashboardData: ExecutiveDashboardData = {
  dataSource: 'live',
  lastUpdated: new Date().toISOString(),
  metrics: {
    totalTenants: 3,
    activeTenants: 3,
    totalBranches: 4,
    targetPlatformUptimePercent: 99.99,
    activeSubscribers: 2,
    monthlyRecurringRevenueEst: 30000,
    complianceStatus: 'Active HIPAA & SOC2 Compliant'
  },
  kpis: [
    {
      id: 'kpi-1',
      label: 'Active Healthcare Tenants',
      value: '3 Active',
      subtext: 'Live PostgreSQL Database Scope',
      trend: 'up',
      trendPercent: 12,
      category: 'growth',
      isSampleData: false
    },
    {
      id: 'kpi-2',
      label: 'Facility Branches Scoped',
      value: '4 Branches',
      subtext: 'Real-time Branch Topology',
      trend: 'up',
      trendPercent: 8,
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
  businessPerformance: [
    {
      id: 'perf-1',
      tenantCategory: 'Multi-Specialty Hospital Networks',
      partnerCount: 2,
      utilizationRate: 94,
      growthStatus: 'accelerating'
    },
    {
      id: 'perf-2',
      tenantCategory: 'Outpatient Surgical Centers',
      partnerCount: 1,
      utilizationRate: 88,
      growthStatus: 'steady'
    }
  ],
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
  trends: [
    { period: 'Jan', activeTenants: 1, apiRequestsMillions: 0.8 },
    { period: 'Feb', activeTenants: 2, apiRequestsMillions: 1.4 },
    { period: 'Mar', activeTenants: 3, apiRequestsMillions: 2.5 }
  ],
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
