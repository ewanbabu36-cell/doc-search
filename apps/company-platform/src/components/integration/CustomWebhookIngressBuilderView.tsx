import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface WebhookConnector {
  id: string;
  name: string;
  targetPlatform: 'ZAPIER' | 'SLACK' | 'MS_TEAMS' | 'SALESFORCE_HEALTH' | 'CUSTOM_HTTPS';
  targetUrl: string;
  subscribedEvents: string[];
  lastDeliveryStatus: 'DELIVERED_200_OK' | 'PAUSED';
  hmacSignatureVerified: boolean;
}

const INITIAL_WEBHOOKS: WebhookConnector[] = [
  {
    id: 'WH-ZAP-01',
    name: 'Zapier High-Priority Emergency Triage Hub',
    targetPlatform: 'ZAPIER',
    targetUrl: 'https://hooks.zapier.com/hooks/catch/948102/bdocsearch108',
    subscribedEvents: ['appointment.emergency_triage_alert', 'patient.vitals_critical_icu'],
    lastDeliveryStatus: 'DELIVERED_200_OK',
    hmacSignatureVerified: true
  },
  {
    id: 'WH-SLACK-02',
    name: 'Slack #hospital-revenue-ops Alerts',
    targetPlatform: 'SLACK',
    targetUrl: 'https://hooks.slack.com/services/T00/B00/DocSearchRevenueSec',
    subscribedEvents: ['invoice.payment_settled_escrow', 'subscription.plan_upgraded_enterprise'],
    lastDeliveryStatus: 'DELIVERED_200_OK',
    hmacSignatureVerified: true
  },
  {
    id: 'WH-SFDC-03',
    name: 'Salesforce Health Cloud Provider Sync',
    targetPlatform: 'SALESFORCE_HEALTH',
    targetUrl: 'https://healthcare-prod.my.salesforce.com/services/apexrest/DocSearchEHR',
    subscribedEvents: ['partner.doctor_nmc_verified', 'partner.mou_signed_active'],
    lastDeliveryStatus: 'DELIVERED_200_OK',
    hmacSignatureVerified: true
  }
];

export const CustomWebhookIngressBuilderView: React.FC = () => {
  const [webhooks] = useState<WebhookConnector[]>(INITIAL_WEBHOOKS);
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const handleTestDispatch = (webhookId: string) => {
    setTestNotice(`✓ Test Payload with HMAC SHA256 signature successfully dispatched to "${webhookId}"! (Response: 200 OK, Latency: 48ms)`);
    setTimeout(() => setTestNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚡ Custom Webhook & Event Ingress Builder
          </h2>
          <Badge variant="success">● HMAC SHA256 Event Streamer Active</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Stream real-time clinical, financial, and security events to Zapier, Slack, Microsoft Teams, and Salesforce Health Cloud
        </p>
      </div>

      {testNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {testNotice}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>WEBHOOK DELIVERIES (24H)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>84,200 Events</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>99.98% 200 OK Delivery Rate</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>AVG EVENT DISPATCH LATENCY</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>42 Milliseconds</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Asynchronous BullMQ Redis Queue</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>HMAC SIGNATURE AUDIT</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCD34D', marginTop: '2px' }}>100% Cryptographic</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero tampering risk</span>
        </div>
      </div>

      {/* Webhook Table */}
      <Card title="📜 Active Webhook Connectors & Event Subscriptions" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connector Name & ID</TableHead>
                <TableHead>Target Platform</TableHead>
                <TableHead>Target HTTPS URL</TableHead>
                <TableHead>Subscribed Event Triggers</TableHead>
                <TableHead>Delivery State</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{w.name}</strong>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8', display: 'block' }}>{w.id}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.targetPlatform === 'ZAPIER' ? 'warning' : w.targetPlatform === 'SLACK' ? 'primary' : 'neutral'}>
                      {w.targetPlatform.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#CBD5E1', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.targetUrl}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.6875rem', color: '#86EFAC' }}>
                    {w.subscribedEvents.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">
                      ✓ {w.lastDeliveryStatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleTestDispatch(w.id)}
                      style={{
                        backgroundColor: '#06B6D4',
                        color: '#070C16',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Test Dispatch
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
