import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@docsearch/ui-kit';
import {
  riskManagementService,
  type RiskLeakageAlertDto
} from '../../services/risk-management-service.js';
import { LeakageRadarContainmentView } from '../risk-management/LeakageRadarContainmentView.js';

export const AiRevenueLeakageRadarView: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskLeakageAlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const rows = await riskManagementService.listAlerts();
      setAlerts(rows);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch leakage alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleRunScan = async () => {
    setScanning(true);
    setErrorMsg(null);
    try {
      const result = await riskManagementService.runLeakageScan();
      setAlerts(result.alerts || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Live risk scan failed.');
    } finally {
      setScanning(false);
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Card title="Live Revenue Leakage & Risk Radar">
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
          Loading persisted leakage alerts from PostgreSQL...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #EF4444', color: '#EF4444', fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}
      <LeakageRadarContainmentView
        alerts={alerts}
        onRefresh={loadAlerts}
        onRunScan={handleRunScan}
        scanning={scanning}
      />
    </div>
  );
};
