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
import { GeospatialDiseaseHeatmapView } from './GeospatialDiseaseHeatmapView.js';
import { PredictivePatientBedForecastView } from './PredictivePatientBedForecastView.js';
import { LivePlatformEventStreamerView } from './LivePlatformEventStreamerView.js';
import { NaturalLanguageBiQueryModal } from './NaturalLanguageBiQueryModal.js';
import { ExecutiveBiReportExportModal } from './ExecutiveBiReportExportModal.js';
import { Tabs, Badge, Button, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'heatmap'
  | 'predictive'
  | 'live-stream'
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

  // Modals
  const [isAiQueryOpen, setIsAiQueryOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              🧠 Analytics / BI / Intelligence Data Lakehouse
            </h1>
            <Badge variant="success">● AI Models & GIS Online</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            Epidemiological disease heatmaps, AI predictive bed saturation forecasting, live platform event ticker, and executive board dossiers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiQueryOpen(true)}
            style={{
              borderColor: '#06B6D4',
              color: '#38BDF8',
              fontWeight: 800
            }}
          >
            🤖 Ask AI BI Co-Pilot
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            style={{
              backgroundColor: '#10B981',
              color: '#070C16',
              fontWeight: 900
            }}
          >
            📥 Export Board Dossier
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 BI Overview'
          },
          {
            id: 'heatmap',
            label: '🗺️ Disease Heatmap',
            badge: <Badge variant="danger">Live GIS</Badge>
          },
          {
            id: 'predictive',
            label: '🔮 Predictive AI',
            badge: <Badge variant="primary">Forecast</Badge>
          },
          {
            id: 'live-stream',
            label: '⚡ Live Event Stream'
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

      {activeTab === 'heatmap' && (
        <GeospatialDiseaseHeatmapView />
      )}

      {activeTab === 'predictive' && (
        <PredictivePatientBedForecastView />
      )}

      {activeTab === 'live-stream' && (
        <LivePlatformEventStreamerView />
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

      {/* Modals */}
      <NaturalLanguageBiQueryModal
        isOpen={isAiQueryOpen}
        onClose={() => setIsAiQueryOpen(false)}
      />

      <ExecutiveBiReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportSuccess={(title) => {
          setSuccessBanner(`Dossier "${title}" compiled and downloaded with cryptographic SHA-256 seal!`);
          setTimeout(() => setSuccessBanner(null), 5000);
        }}
      />
    </div>
  );
};
