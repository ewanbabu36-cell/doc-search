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

const INITIAL_ALERTS: AnomalyAlertItem[] = [
  {
    id: 'ALT-OUTBREAK-01',
    type: 'CLINICAL_OUTBREAK',
    severity: 'CRITICAL',
    title: '🦟 Regional Dengue & Typhoid NS1 Positivity Surge',
    entityOrLocation: 'Kolkata Metro & Eastern Hub (62 Hospitals)',
    detectedMetric: '38.6% Test Positivity Rate (1,120 positive / 2,900 tests)',
    baselineMetric: '8.4% 30-Day Historical Average',
    anomalyDelta: '+ 30.2% Spike (>30% Threshold Exceeded)',
    confidenceScore: '99.2% Outbreak Probability',
    detectedTime: '12 mins ago',
    riskDescription: 'Severe cluster of acute thrombocytopenia and NS1 antigen positivity detected across 14 connected pathology labs in Kolkata.',
    recommendedAction: 'Dispatch 5,000 rapid NS1 test kits, notify State Health Mission, and route critical platelet transfusions.',
    status: 'ACTIVE_INVESTIGATION'
  },
  {
    id: 'ALT-BILLING-02',
    type: 'BILLING_FRAUD_RISK',
    severity: 'CRITICAL',
    title: '💸 Unusual 45% Manual Discount Override on Inpatient Invoice',
    entityOrLocation: 'Apollo Indraprastha — Cashier Desk #4 (New Delhi)',
    detectedMetric: '45.0% Discount (₹ 1,12,500 written off on ₹ 2,50,000 bill)',
    baselineMetric: 'Max Allowed: 15.0% without CFO 2FA Approval',
    anomalyDelta: '+ 30.0% Unapproved Revenue Write-down',
    confidenceScore: '97.8% Compliance Violation Flag',
    detectedTime: '24 mins ago',
    riskDescription: 'Cashier manual override applied on Inpatient Surgical Invoice #INV-2026-89410 without dual-signature authorization.',
    recommendedAction: 'Freeze invoice settlement, lock cashier discount override token, and require CFO 2FA digital signature.',
    status: 'ACTIVE_INVESTIGATION'
  },
  {
    id: 'ALT-OUTBREAK-03',
    type: 'CLINICAL_OUTBREAK',
    severity: 'HIGH',
    title: '🦠 H1N1 & Upper Respiratory Triage Load Surge',
    entityOrLocation: 'Guwahati & North-East Cluster (28 Hospitals)',
    detectedMetric: '27.4% Respiratory Triage Positivity (480 cases / day)',
    baselineMetric: '6.1% 30-Day Historical Average',
    anomalyDelta: '+ 21.3% Cluster Elevation',
    confidenceScore: '94.5% Cluster Elevation',
    detectedTime: '1 hour ago',
    riskDescription: 'Rapid increase in fever and dry cough admissions coinciding with monsoon waterlogging triage.',
    recommendedAction: 'Stockpile nebulizers and activate isolation ward triage protocol.',
    status: 'ACTIVE_INVESTIGATION'
  },
  {
    id: 'ALT-BILLING-04',
    type: 'BILLING_FRAUD_RISK',
    severity: 'HIGH',
    title: '💳 Rapid Duplicate POS Swipe Attempt Blocked by Idempotency',
    entityOrLocation: 'Lilavati Hospital & Research Centre — Counter #2 (Mumbai)',
    detectedMetric: '2 Duplicate Charges of ₹ 24,500 within 1.1 seconds',
    baselineMetric: 'Idempotency Key Protected',
    anomalyDelta: 'Zero Leakage (Second request rejected with 409 Conflict)',
    confidenceScore: '100% Deterministic Engine Proof',
    detectedTime: '2 hours ago',
    riskDescription: 'Double-click POS swipe attempt was successfully blocked by backend idempotency lock, saving patient from double debit.',
    recommendedAction: 'Terminal verified secure. Zero financial dispute registered.',
    status: 'RESOLVED_LOCKED'
  }
];

export const AiOutbreakBillingAnomalyCenterView: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlertItem[]>(INITIAL_ALERTS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CLINICAL' | 'BILLING'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
        {filteredAlerts.map((alert) => {
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
        })}
      </div>
    </div>
  );
};
