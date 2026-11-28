import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import {
  riskManagementService,
  type RiskLeakageAlertDto,
  type MitigationAction
} from '../../services/risk-management-service.js';

interface Props {
  alerts: RiskLeakageAlertDto[];
  onRefresh: () => Promise<void>;
  onRunScan: () => Promise<void>;
  scanning: boolean;
}

export const LeakageRadarContainmentView: React.FC<Props> = ({
  alerts,
  onRefresh,
  onRunScan,
  scanning
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<RiskLeakageAlertDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = alerts.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchStatus && matchSeverity;
  });

  const handleMitigate = async (alertId: string, action: MitigationAction) => {
    setBusyId(alertId);
    setNotice(null);
    try {
      await riskManagementService.mitigateAlert(alertId, {
        action,
        notes: `Executed ${action} from Company Risk & Leakage Radar HQ`
      });
      setNotice(`Mitigation "${action}" executed & recorded in immutable audit ledger.`);
      await onRefresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to execute containment.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['OPEN', 'CONTAINED', 'RESOLVED', 'DISMISSED', 'ALL'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'primary' : 'secondary'}
              onClick={() => setStatusFilter(s)}
            >
              {s} ({s === 'ALL' ? alerts.length : alerts.filter((a) => a.status === s).length})
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--ds-color-border)', background: 'var(--ds-color-surface)', color: 'var(--ds-color-text-primary)' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <Button size="sm" variant="danger" onClick={onRunScan} disabled={scanning}>
            {scanning ? 'Scanning SQL Tables...' : 'Run Live SQL Leakage Scan'}
          </Button>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #38BDF8', backgroundColor: 'rgba(56,189,248,0.12)', fontSize: '0.82rem', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card title="Zero Matching Risk Alerts">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
            No persisted risk or revenue leakage alerts match filter <strong>{statusFilter}</strong>. Click{' '}
            <strong>Run Live SQL Leakage Scan</strong> to scan subscriptions, invoices, clinical encounters, discounts, and pharmacy expiry tables.
          </div>
        </Card>
      ) : (
        <Card title={`Risk & Leakage Alerts (${filtered.length})`} padding="none">
          <TableContainer style={{ border: 'none', borderRadius: 0 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity / Type</TableHead>
                  <TableHead>Finding & Evidence</TableHead>
                  <TableHead>Est. Loss</TableHead>
                  <TableHead>Monthly Burn</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Containment Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge
                        variant={
                          a.severity === 'CRITICAL'
                            ? 'danger'
                            : a.severity === 'HIGH'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {a.severity}
                      </Badge>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
                        {a.riskType}
                      </div>
                    </TableCell>
                    <TableCell style={{ maxWidth: '360px' }}>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                        {a.summary}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEvidence(selectedEvidence?.id === a.id ? null : a)}
                        style={{ background: 'none', border: 'none', color: '#38BDF8', padding: 0, marginTop: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        {selectedEvidence?.id === a.id ? 'Hide SQL Evidence' : 'Inspect SQL Evidence JSON'}
                      </button>
                      {selectedEvidence?.id === a.id && (
                        <pre style={{ marginTop: '6px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(15,23,42,0.8)', color: '#CBD5E1', fontSize: '0.7rem', overflowX: 'auto' }}>
                          {JSON.stringify(a.evidenceJson, null, 2)}
                        </pre>
                      )}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#EF4444' }}>
                      ₹{Number(a.estimatedLossInr || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#F59E0B' }}>
                      ₹{Number(a.monthlyBurnInr || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'OPEN' ? 'danger' : a.status === 'CONTAINED' ? 'warning' : 'success'}>
                        {a.status}
                      </Badge>
                      {a.mitigationAction && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--ds-color-text-muted)', marginTop: '3px' }}>
                          {a.mitigationAction}
                        </div>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {a.partnerId && a.status === 'OPEN' && (
                          <>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={busyId === a.id}
                              onClick={() => handleMitigate(a.id, 'CONTAIN_BILLING_FREEZE')}
                            >
                              Billing Freeze
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === a.id}
                              onClick={() => handleMitigate(a.id, 'CONTAIN_THROTTLE_QUOTA')}
                            >
                              Throttle Quotas
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === a.id}
                              onClick={() => handleMitigate(a.id, 'REVOKE_OVERDUE_GRACE')}
                            >
                              Revoke Grace
                            </Button>
                          </>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <Button
                            size="sm"
                            variant="success"
                            disabled={busyId === a.id}
                            onClick={() => handleMitigate(a.id, 'MARK_RESOLVED')}
                          >
                            Resolve
                          </Button>
                        )}
                        {a.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === a.id}
                            onClick={() => handleMitigate(a.id, 'DISMISS')}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
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
