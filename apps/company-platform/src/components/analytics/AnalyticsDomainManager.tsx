import React, { useState, useEffect } from 'react';
import type {
  PlatformUsageMetricDto,
  CrossTenantAggregatedMetricDto,
  ApiTelemetryTimeSeriesDto,
  SystemInsightDto,
  SavedReportDto
} from '@docsearch/api-contracts';
import { analyticsService } from '../../services/analytics-service.js';
import { AnalyticsOverviewView } from './AnalyticsOverviewView.js';
import { PlatformUsageView } from './PlatformUsageView.js';
import { ApiTelemetryView } from './ApiTelemetryView.js';
import { TenantSegmentationView } from './TenantSegmentationView.js';
import { SystemInsightCenterView } from './SystemInsightCenterView.js';
import { SavedReportListView } from './SavedReportListView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'usage'
  | 'telemetry'
  | 'segmentation'
  | 'insights'
  | 'reports';

export const AnalyticsDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [usageMetrics, setUsageMetrics] = useState<PlatformUsageMetricDto[]>([]);
  const [crossTenantAggs, setCrossTenantAggs] = useState<CrossTenantAggregatedMetricDto[]>([]);
  const [apiTelemetry, setApiTelemetry] = useState<ApiTelemetryTimeSeriesDto[]>([]);
  const [insights, setInsights] = useState<SystemInsightDto[]>([]);
  const [reports, setReports] = useState<SavedReportDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usageRes, crossRes, telRes, insRes, repRes] = await Promise.all([
        analyticsService.getPlatformUsageMetrics(),
        analyticsService.getCrossTenantAggregates(),
        analyticsService.getApiTelemetry(),
        analyticsService.getSystemInsights(),
        analyticsService.getSavedReports()
      ]);
      setUsageMetrics(usageRes);
      setCrossTenantAggs(crossRes);
      setApiTelemetry(telRes);
      setInsights(insRes);
      setReports(repRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Analytics & BI data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAcknowledgeInsight = async (insightId: string, reason: string) => {
    const updated = await analyticsService.acknowledgeInsight({ insightId, reason });
    setInsights((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleGenerateReport = async (reportId: string, dateRange: string) => {
    await analyticsService.generateReportSnapshot({ reportId, dateRange });
    const freshReports = await analyticsService.getSavedReports();
    setReports(freshReports);
  };

  if (isLoading && usageMetrics.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Platform Analytics & Intelligence data...
        </span>
      </div>
    );
  }

  if (error && usageMetrics.length === 0) {
    return (
      <ErrorState title="Analytics Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Analytics / BI / Intelligence
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Cross-tenant platform usage telemetry, API gateway latency benchmarks, anonymized facility segmentation, and system intelligence
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 BI Overview'
          },
          {
            id: 'usage',
            label: '📈 Platform Usage',
            badge: <Badge variant="neutral">{usageMetrics.length}</Badge>
          },
          {
            id: 'telemetry',
            label: '⚡ API Telemetry'
          },
          {
            id: 'segmentation',
            label: '🏢 Tenant Segmentation',
            badge: <Badge variant="neutral">{crossTenantAggs.length}</Badge>
          },
          {
            id: 'insights',
            label: '🧠 System Intelligence',
            badge: <Badge variant="neutral">{insights.length}</Badge>
          },
          {
            id: 'reports',
            label: '📑 Saved Reports',
            badge: <Badge variant="neutral">{reports.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <AnalyticsOverviewView
          usageMetrics={usageMetrics}
          crossTenantAggs={crossTenantAggs}
          insights={insights}
        />
      )}

      {activeTab === 'usage' && (
        <PlatformUsageView metrics={usageMetrics} />
      )}

      {activeTab === 'telemetry' && (
        <ApiTelemetryView telemetrySeries={apiTelemetry} />
      )}

      {activeTab === 'segmentation' && (
        <TenantSegmentationView aggregates={crossTenantAggs} />
      )}

      {activeTab === 'insights' && (
        <SystemInsightCenterView
          insights={insights}
          onAcknowledge={handleAcknowledgeInsight}
        />
      )}

      {activeTab === 'reports' && (
        <SavedReportListView
          reports={reports}
          onGenerateReport={handleGenerateReport}
        />
      )}
    </div>
  );
};
