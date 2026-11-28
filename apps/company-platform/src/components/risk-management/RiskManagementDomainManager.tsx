import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import {
  riskManagementService,
  type CompanyRiskOverviewDto,
  type RiskLeakageAlertDto
} from '../../services/risk-management-service.js';
import { CompanyPnLEconomicsView } from './CompanyPnLEconomicsView.js';
import { LeakageRadarContainmentView } from './LeakageRadarContainmentView.js';
import { UnitMarginLeaderboardView } from './UnitMarginLeaderboardView.js';
import { CostLedgerAndGuardrailsView } from './CostLedgerAndGuardrailsView.js';
import { GrossToNetRevenueWaterfallView } from '../billing/GrossToNetRevenueWaterfallView.js';

type RiskTab = 'pnl' | 'radar' | 'unit_margins' | 'guardrails' | 'waterfall';

export const RiskManagementDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RiskTab>('pnl');
  const [overview, setOverview] = useState<CompanyRiskOverviewDto | null>(null);
  const [alerts, setAlerts] = useState<RiskLeakageAlertDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [ov, al] = await Promise.all([
        riskManagementService.getOverview(),
        riskManagementService.listAlerts()
      ]);
      setOverview(ov);
      setAlerts(al);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load Company Risk & Economics telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunScan = async () => {
    setScanning(true);
    setErrorMsg(null);
    try {
      await riskManagementService.runLeakageScan();
      await loadData();
      setActiveTab('radar');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Live risk scan failed.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid var(--ds-color-border)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(16,185,129,0.08) 100%)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              Risk Management, P&amp;L &amp; Revenue Leakage Prevention Engine
            </h1>
            <Badge variant={overview && overview.openAlertsSummary.critical > 0 ? 'danger' : 'success'}>
              {overview
                ? `${overview.openAlertsSummary.totalOpen} Open Risks (${overview.openAlertsSummary.critical} Critical)`
                : 'PostgreSQL Telemetry'}
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time company profit/loss, monthly burn rate, per-tenant unit margins, SQL leakage detection &amp; automated circuit-breaker containment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size="sm" variant="secondary" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </Button>
          <Button size="sm" variant="danger" onClick={handleRunScan} disabled={scanning}>
            {scanning ? 'Scanning PostgreSQL...' : 'Run Live Leakage Scan'}
          </Button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button size="sm" variant={activeTab === 'pnl' ? 'primary' : 'secondary'} onClick={() => setActiveTab('pnl')}>
          Company P&amp;L &amp; Expenses
        </Button>
        <Button size="sm" variant={activeTab === 'radar' ? 'primary' : 'secondary'} onClick={() => setActiveTab('radar')}>
          Leakage Radar &amp; Containment ({alerts.filter((a) => a.status === 'OPEN').length})
        </Button>
        <Button size="sm" variant={activeTab === 'unit_margins' ? 'primary' : 'secondary'} onClick={() => setActiveTab('unit_margins')}>
          Unit Margin Leaderboard ({overview?.unitMarginLeaderboard.length || 0})
        </Button>
        <Button size="sm" variant={activeTab === 'guardrails' ? 'primary' : 'secondary'} onClick={() => setActiveTab('guardrails')}>
          Prevention Guardrails &amp; Cost Audit
        </Button>
        <Button size="sm" variant={activeTab === 'waterfall' ? 'primary' : 'secondary'} onClick={() => setActiveTab('waterfall')}>
          GMV &amp; Sec 194-O Waterfall
        </Button>
      </div>

      {errorMsg && (
        <Card title="Telemetry Error">
          <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.875rem' }}>{errorMsg}</div>
        </Card>
      )}

      {loading && !overview ? (
        <Card title="Loading Live Economics Telemetry...">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            Querying authoritative PostgreSQL ledgers via <code>/api/v1/company/risk-management/overview</code>...
          </div>
        </Card>
      ) : overview ? (
        <>
          {overview.isEmptyDatabase && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #F59E0B', backgroundColor: 'rgba(245,158,11,0.1)', fontSize: '0.82rem' }}>
              Database is currently in clean zero-state (no partners, invoices, or cost ledger entries recorded yet). Record an expense or onboard a partner to see live unit margins.
            </div>
          )}

          {activeTab === 'pnl' && <CompanyPnLEconomicsView overview={overview} onRefresh={loadData} />}
          {activeTab === 'radar' && (
            <LeakageRadarContainmentView
              alerts={alerts}
              onRefresh={loadData}
              onRunScan={handleRunScan}
              scanning={scanning}
            />
          )}
          {activeTab === 'unit_margins' && <UnitMarginLeaderboardView partners={overview.unitMarginLeaderboard} />}
          {activeTab === 'guardrails' && (
            <CostLedgerAndGuardrailsView policy={overview.activePolicy} onRefresh={loadData} />
          )}
          {activeTab === 'waterfall' && <GrossToNetRevenueWaterfallView />}
        </>
      ) : null}
    </div>
  );
};
