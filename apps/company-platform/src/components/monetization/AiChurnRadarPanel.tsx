import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import {
  riskManagementService,
  type RiskLeakageAlertDto,
  type PartnerUnitEconomicsDto
} from '../../services/risk-management-service.js';

export const AiChurnRadarPanel: React.FC = () => {
  const [churnAlerts, setChurnAlerts] = useState<RiskLeakageAlertDto[]>([]);
  const [partners, setPartners] = useState<PartnerUnitEconomicsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadChurnData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, al] = await Promise.all([
        riskManagementService.getOverview(),
        riskManagementService.listAlerts({ riskType: 'CHURN_RISK' })
      ]);
      setPartners(ov.unitMarginLeaderboard);
      setChurnAlerts(al);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to fetch churn telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChurnData();
  }, [loadChurnData]);

  const handleIssueNotice = async (alertId: string) => {
    setBusyId(alertId);
    setNotice(null);
    try {
      await riskManagementService.mitigateAlert(alertId, {
        action: 'ISSUE_RECOVERY_NOTICE',
        notes: 'Retention outreach logged from Churn Radar HQ'
      });
      setNotice('Retention & renewal outreach notice logged to PostgreSQL audit ledger.');
      await loadChurnData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to log retention outreach.');
    } finally {
      setBusyId(null);
    }
  };

  const atRiskPartners = partners.filter(
    (p) => p.licenseStatus === 'EXPIRING_SOON' || p.licenseStatus === 'GRACE_PERIOD' || p.overdueReceivableInr > 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              Live Partner Retention &amp; Churn Risk Radar
            </h2>
            <Badge variant={atRiskPartners.length + churnAlerts.filter((a) => a.status === 'OPEN').length > 0 ? 'warning' : 'success'}>
              {atRiskPartners.length + churnAlerts.filter((a) => a.status === 'OPEN').length} At-Risk Signals
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
            PostgreSQL license expiry windows, grace periods, and overdue receivables monitored in real time.
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={loadChurnData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Churn Signals'}
        </Button>
      </div>

      {notice && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #06B6D4', backgroundColor: 'rgba(6,182,212,0.12)', fontWeight: 700, fontSize: '0.82rem' }}>
          {notice}
        </div>
      )}

      {churnAlerts.length === 0 && atRiskPartners.length === 0 ? (
        <Card title="Churn Watch">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)' }}>
            Zero expiring licenses or active churn alerts in PostgreSQL ({partners.length} active partner(s) monitored).
          </div>
        </Card>
      ) : (
        <Card title={`Active Churn & Renewal Risk Signals (${churnAlerts.length} alerts / ${atRiskPartners.length} partners)`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal / Partner</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churnAlerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontWeight: 700 }}>{a.title}</TableCell>
                    <TableCell><Badge variant={a.severity === 'CRITICAL' ? 'danger' : 'warning'}>{a.severity}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.8rem' }}>{a.summary}</TableCell>
                    <TableCell><Badge variant={a.status === 'OPEN' ? 'danger' : 'success'}>{a.status}</Badge></TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {a.status === 'OPEN' && (
                        <Button size="sm" variant="primary" disabled={busyId === a.id} onClick={() => handleIssueNotice(a.id)}>
                          Log Retention Outreach
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
