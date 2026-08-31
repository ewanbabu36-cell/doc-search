import React from 'react';
import type { ExecutiveAlert } from '../../types/executive.js';
import { Card, Alert, Button } from '@docsearch/ui-kit';

export interface AlertsSectionProps {
  alerts: ExecutiveAlert[];
  onDismissAlert?: ((alertId: string) => void) | undefined;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts, onDismissAlert }) => {
  return (
    <Card
      title="Attention Required"
      subtitle="Pending governance, security, and infrastructure notifications"
      padding="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--ds-color-text-muted)',
              fontSize: '0.875rem'
            }}
          >
            No active executive alerts. All compliance and infrastructure systems nominal.
          </div>
        ) : (
          alerts.map((alert) => (
            <Alert
              key={alert.id}
              type={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>{alert.title}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--ds-color-text-muted)' }}>
                    {alert.timestamp}
                  </span>
                </div>
              }
              onClose={onDismissAlert ? () => onDismissAlert(alert.id) : undefined}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0 }}>{alert.description}</p>
                {alert.actionRequired && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Button variant="subtle" size="sm">
                      {alert.actionRequired}
                    </Button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      Domain: {alert.domain}
                    </span>
                  </div>
                )}
              </div>
            </Alert>
          ))
        )}
      </div>
    </Card>
  );
};
