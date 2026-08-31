import React, { useEffect, useState } from 'react';
import type { ExecutiveDashboardData } from '../../types/executive.js';
import { executiveService } from '../../services/executive-service.js';
import { ExecutiveOverview } from './ExecutiveOverview.js';
import { KpiSummary } from './KpiSummary.js';
import { BusinessPerformance } from './BusinessPerformance.js';
import { AlertsSection } from './AlertsSection.js';
import { RecentActivities } from './RecentActivities.js';
import { QuickActions } from './QuickActions.js';
import { TrendAnalytics } from './TrendAnalytics.js';
import { SystemHealthSummary } from './SystemHealthSummary.js';
import { Spinner, ErrorState } from '@docsearch/ui-kit';

export const ExecutiveCommandCenter: React.FC = () => {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executiveService.getExecutiveDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executive telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}
      >
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Executive & Command Center telemetry...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Command Center Unavailable"
        message={error || 'Could not establish connection to the executive service layer.'}
        onRetry={loadData}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Executive Overview & Status Header */}
      <ExecutiveOverview
        metrics={data.metrics}
        lastUpdated={data.lastUpdated}
        isDevelopmentPreview={data.dataSource === 'development_preview'}
      />

      {/* 2. Key Operational KPI Summary */}
      <KpiSummary kpis={data.kpis} />

      {/* 3 & 4. Two Column Operational Grid: Alerts & Business Performance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        <AlertsSection alerts={data.alerts} />
        <BusinessPerformance performance={data.businessPerformance} />
      </div>

      {/* 5 & 6. Quick Actions & Trends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        <QuickActions actions={data.quickActions} />
        <TrendAnalytics trends={data.trends} />
      </div>

      {/* 7 & 8. Recent Activities & System Health Telemetry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        <RecentActivities activities={data.recentActivities} />
        <SystemHealthSummary health={data.systemHealth} />
      </div>
    </div>
  );
};
