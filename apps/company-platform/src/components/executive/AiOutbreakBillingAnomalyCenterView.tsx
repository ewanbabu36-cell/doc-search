import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface AnomalyAlertItem {
  id: string;
  type: 'CLINICAL_OUTBREAK' | 'BILLING_FRAUD_RISK';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  entityOrLocation: string;
  detectedMetric: string;
  baselineMetric: string;
  anomalyDelta: string;
  confidenceScore: string;
  detectedTime: string;
  riskDescription: string;
  recommendedAction: string;
  status: 'ACTIVE_INVESTIGATION' | 'ACKNOWLEDGED' | 'RESOLVED_LOCKED';
}

const INITIAL_ALERTS: AnomalyAlertItem[] = [];

export const AiOutbreakBillingAnomalyCenterView: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlertItem[]>(INITIAL_ALERTS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CLINICAL' | 'BILLING'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleRunSentinelAudit = () => {
    setActionNotice('Running Sentinel AI deep anomaly analysis across active transactions...');
    setTimeout(() => {
      setActionNotice('Sentinel Audit complete: 0 critical clinical or billing anomalies found. All claims verified.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 800);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedFilter === 'CLINICAL') return alert.type === 'CLINICAL_OUTBREAK';
    if (selectedFilter === 'BILLING') return alert.type === 'BILLING_FRAUD_RISK';
    return true;
  });

  const handleResolveAlert = (alertId: string, actionName: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED_LOCKED' } : a))
    );
    setActionNotice(`✓ Successfully executed: "${actionName}" for Alert ${alertId}`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const activeCriticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE_INVESTIGATION').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🤖 AI Hospital Outbreak & Billing Anomaly Alert Center
            </h2>
            <Badge variant="danger">● {activeCriticalCount} Critical Anomalies Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Real-time machine learning surveillance for Dengue/Typhoid &gt;30% infection spikes and unapproved billing discount leakages
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            style={{
              backgroundColor: selectedFilter === 'ALL' ? '#06B6D4' : 'transparent',
              color: selectedFilter === 'ALL' ? '#070C16' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Anomalies ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('CLINICAL')}
            style={{
              backgroundColor: selectedFilter === 'CLINICAL' ? '#EF4444' : 'transparent',
              color: selectedFilter === 'CLINICAL' ? '#FFF' : '#FCA5A5',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🦟 Outbreak Spikes (2)
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('BILLING')}
            style={{
              backgroundColor: selectedFilter === 'BILLING' ? '#F59E0B' : 'transparent',
              color: selectedFilter === 'BILLING' ? '#070C16' : '#FCD34D',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            💸 Billing & Discount Overrides (2)
          </button>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {actionNotice}
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>
            EPIDEMIC SURGE THRESHOLD
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
            + 30.2% Spike
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Kolkata Dengue NS1 positivity alert</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #F59E0B', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
            UNAPPROVED DISCOUNT OVERRIDE
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            45.0% Override
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>₹ 1,12,500 write-off unapproved at Desk #4</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>
            AI REVENUE LEAKAGE PROTECTED
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            ₹ 2,45,000 Saved
          </div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero leakage across 486 hospital nodes</span>
        </div>
      </div>

      {/* Anomaly Alerts Cards Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
            <strong style={{ color: '#F8FAFC', fontSize: '0.9375rem', display: 'block', marginBottom: '6px' }}>
              Zero Clinical or Financial Anomalies Detected
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '440px', margin: '0 auto 16px' }}>
              DocSearch Autonomous Sentinel AI has audited all recent prescriptions and billing claims. No anomalies or fraud flagged.
            </p>
            <button
              type="button"
              onClick={handleRunSentinelAudit}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ↻ Run Sentinel Audit
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isClinical = alert.type === 'CLINICAL_OUTBREAK';
          const isResolved = alert.status === 'RESOLVED_LOCKED';

          return (
            <div
              key={alert.id}
              style={{
                backgroundColor: '#0F172A',
                border: isResolved
                  ? '1px solid #334155'
                  : isCritical
                  ? '1.5px solid #EF4444'
                  : '1.5px solid #F59E0B',
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isCritical && !isResolved ? '0 8px 30px rgba(239, 68, 68, 0.25)' : 'none',
                opacity: isResolved ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {alert.title}
                    </h3>
                    <Badge variant={isResolved ? 'neutral' : isCritical ? 'danger' : 'warning'}>
                      {isResolved ? 'LOCKED / RESOLVED' : alert.severity}
                    </Badge>
                    <Badge variant="primary">{alert.confidenceScore}</Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                    📍 {alert.entityOrLocation} • Detected {alert.detectedTime}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>Anomaly Delta</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 900, color: isCritical ? '#EF4444' : '#F59E0B' }}>
                    {alert.anomalyDelta}
                  </div>
                </div>
              </div>

              {/* Anomaly Metrics Compare Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>DETECTED VALUE</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                    {alert.detectedMetric}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>BENCHMARK / NORMAL</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#94A3B8', marginTop: '2px' }}>
                    {alert.baselineMetric}
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                {alert.riskDescription}
              </p>

              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem', color: '#A5F3FC' }}>
                <strong>💡 AI Recommended Protocol:</strong> {alert.recommendedAction}
              </div>

              {/* Action Buttons */}
              {!isResolved && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {isClinical ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        style={{ backgroundColor: '#EF4444', color: '#FFF', fontWeight: 800 }}
                        onClick={() => handleResolveAlert(alert.id, 'Dispatch 5,000 Rapid NS1 Kits & Trigger Epidemic Protocol')}
                      >
                        🚨 Dispatch Rapid NS1 Kits & Trigger Epidemic Protocol
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id, 'Acknowledge Surveillance Alert')}
                      >
                        Acknowledge & Monitor
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        style={{ backgroundColor: '#F59E0B', color: '#070C16', fontWeight: 800 }}
                        onClick={() => handleResolveAlert(alert.id, 'Freeze Invoice & Require CFO 2FA Approval')}
                      >
                        🔒 Freeze Invoice & Require CFO 2FA Approval
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id, 'Audit Cashier Discount Token')}
                      >
                        Audit Counter Desk
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
