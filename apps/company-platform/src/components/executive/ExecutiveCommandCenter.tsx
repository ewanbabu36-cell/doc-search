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

// 4 New Executive Advancements
import { NationalHealthcareWarRoomView } from './NationalHealthcareWarRoomView.js';
import { RealtimeEbitdaUnitEconomicsView } from './RealtimeEbitdaUnitEconomicsView.js';
import { PlatformEmergencyPanicLockModal } from './PlatformEmergencyPanicLockModal.js';
import { CustomizableExecutiveWidgetGridView } from './CustomizableExecutiveWidgetGridView.js';
import { AiOutbreakBillingAnomalyCenterView } from './AiOutbreakBillingAnomalyCenterView.js';
import { generateAndDownloadExecutiveBoardPdf } from '../../utils/clientExecutiveBoardPdf.js';

import { Spinner, ErrorState, Tabs, Badge, Button } from '@docsearch/ui-kit';

export const ExecutiveCommandCenter: React.FC = () => {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ANOMALIES' | 'CUSTOM_GRID' | 'WAR_ROOM' | 'EBITDA'>('OVERVIEW');
  const [isPanicOpen, setIsPanicOpen] = useState(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Command Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              ⚡ Executive & Command Center HQ
            </h1>
            <Badge variant="success">● Pan-India Live Health Grid Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            National healthcare consultation heatmaps, real-time EBITDA & unit economics, and 1-click platform emergency broadcast
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              generateAndDownloadExecutiveBoardPdf({
                arrAmount: '₹ 2.70 Crore',
                grossMargin: '84.5% Margin',
                cacLtvRatio: '1 : 6.4 Ratio',
                freeCashflow: '+ ₹ 12.40 L/mo',
                activeHospitals: 486,
                liveConsultsRate: '15,160 / hr',
                erDispatches: 89,
                avgOpdWait: '11.8 Mins',
                uptimePercent: '99.98%',
                complianceStatus: 'ABDM M1-M3 & HIPAA Validated'
              });
            }}
            style={{
              backgroundColor: '#06B6D4',
              color: '#070C16',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
            }}
          >
            📥 Export Executive Board PDF
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsPanicOpen(true)}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            🚨 National Panic Siren
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'OVERVIEW', label: '📊 Executive Overview' },
          { id: 'ANOMALIES', label: '🤖 AI Outbreak & Billing Anomaly Alert Center', badge: <Badge variant="danger">2 Critical</Badge> },
          { id: 'CUSTOM_GRID', label: '🧩 Customizable Widget Studio', badge: <Badge variant="warning">Drag & Drop</Badge> },
          { id: 'WAR_ROOM', label: '⚡ National Healthcare War-Room', badge: <Badge variant="success">15.1k / hr</Badge> },
          { id: 'EBITDA', label: '💰 Real-Time EBITDA & Burn Rate', badge: <Badge variant="primary">Cash Positive</Badge> }
        ]}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      {/* Tab: AI Outbreak & Billing Anomaly Alert Center */}
      {activeTab === 'ANOMALIES' && (
        <AiOutbreakBillingAnomalyCenterView />
      )}

      {/* Tab: Customizable Widget Grid */}
      {activeTab === 'CUSTOM_GRID' && (
        <CustomizableExecutiveWidgetGridView />
      )}

      {/* Tab: War Room */}
      {activeTab === 'WAR_ROOM' && (
        <NationalHealthcareWarRoomView />
      )}

      {/* Tab: EBITDA */}
      {activeTab === 'EBITDA' && (
        <RealtimeEbitdaUnitEconomicsView />
      )}

      {/* Tab: Overview */}
      {activeTab === 'OVERVIEW' && (
        <>
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
        </>
      )}

      {/* Panic Lock Modal */}
      <PlatformEmergencyPanicLockModal
        isOpen={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
      />
    </div>
  );
};
