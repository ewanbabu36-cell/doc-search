import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export const CanaryTrafficControllerView: React.FC = () => {
  const [canaryPercentage, setCanaryPercentage] = useState(10);
  const [isPromoting, setIsPromoting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePromoteTo100 = () => {
    setIsPromoting(true);
    setTimeout(() => {
      setCanaryPercentage(100);
      setIsPromoting(false);
      setStatusMessage('✓ Canary v2.5.0-rc2 successfully promoted to 100% Production Traffic (Blue retired)!');
      setTimeout(() => setStatusMessage(null), 5000);
    }, 450);
  };

  const handleEmergencyRollback = () => {
    setCanaryPercentage(0);
    setStatusMessage('🚨 Emergency Rollback executed: 100% traffic immediately reverted to Stable Blue v2.4.1!');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🚀 Blue-Green & Canary Traffic Split Controller
          </h2>
          <Badge variant="success">● Istio Envoy Service Mesh Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Real-time dynamic weighted ingress routing between Stable Production (Blue) and Release Candidate (Canary Green) with zero dropped requests
        </p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: statusMessage.includes('Emergency') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', border: `1px solid ${statusMessage.includes('Emergency') ? '#EF4444' : '#10B981'}`, borderRadius: '10px', padding: '12px 16px', color: statusMessage.includes('Emergency') ? '#FCA5A5' : '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {statusMessage}
        </div>
      )}

      {/* Traffic Slider Controller */}
      <Card title="🎛️ Live Ingress Traffic Weight Distribution" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#38BDF8' }}>
              🔵 Blue (Stable v2.4.1): {100 - canaryPercentage}%
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#10B981' }}>
              🟢 Canary Green (v2.5.0-rc2): {canaryPercentage}%
            </span>
          </div>

          {/* Range Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={canaryPercentage}
            onChange={(e) => setCanaryPercentage(Number(e.target.value))}
            style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: '#10B981' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCanaryPercentage(5)}
                style={{ borderColor: '#334155', color: '#CBD5E1' }}
              >
                5% Soak
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCanaryPercentage(25)}
                style={{ borderColor: '#334155', color: '#CBD5E1' }}
              >
                25% Ramp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCanaryPercentage(50)}
                style={{ borderColor: '#334155', color: '#CBD5E1' }}
              >
                50% Split
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleEmergencyRollback}
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '6px 14px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                🚨 Emergency 1-Click Rollback (0%)
              </button>

              <button
                type="button"
                onClick={handlePromoteTo100}
                disabled={isPromoting}
                style={{ backgroundColor: '#10B981', border: 'none', color: '#070C16', padding: '6px 18px', borderRadius: '6px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              >
                {isPromoting ? 'Promoting...' : '🚀 Promote to 100% Production'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Side-by-side Fleet Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Blue Fleet */}
        <Card title="🔵 Stable Fleet (Release v2.4.1)" padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>Active Pod Replicas:</span>
              <strong style={{ color: '#F8FAFC' }}>24 Pods (Kubernetes EKS)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>Average Ingress Latency:</span>
              <strong style={{ color: '#38BDF8' }}>24.2 ms</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>HTTP 5xx Error Rate:</span>
              <strong style={{ color: '#10B981' }}>0.001% (Normal)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Git Commit Ref:</span>
              <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>sha-9f821a4 (main)</span>
            </div>
          </div>
        </Card>

        {/* Canary Green Fleet */}
        <Card title="🟢 Canary Fleet (Release v2.5.0-rc2)" padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>Active Pod Replicas:</span>
              <strong style={{ color: '#F8FAFC' }}>6 Pods (Isolated Node Pool)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>Average Ingress Latency:</span>
              <strong style={{ color: '#10B981' }}>21.4 ms (-11% faster)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#94A3B8' }}>HTTP 5xx Error Rate:</span>
              <strong style={{ color: '#10B981' }}>0.000% (Clean)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Git Commit Ref:</span>
              <span style={{ fontFamily: 'monospace', color: '#10B981' }}>sha-69d8b3c (release/2.5)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
