import React, { useState } from 'react';
import type {
  WebhookEndpointDto,
  WebhookDeliveryDto
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert
} from '@docsearch/ui-kit';
import { WebhookRetryDialog } from './WebhookRetryDialog.js';

export interface WebhookCenterViewProps {
  endpoints: WebhookEndpointDto[];
  deliveries: WebhookDeliveryDto[];
  onRetryDelivery: (deliveryId: string, reason: string) => Promise<void>;
}

export const WebhookCenterView: React.FC<WebhookCenterViewProps> = ({
  endpoints,
  deliveries,
  onRetryDelivery
}) => {
  const [retryingDelivery, setRetryingDelivery] = useState<WebhookDeliveryDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Zero-PHI Event Dispatch & Webhooks">
        Webhook payloads contain de-identified system event notifications and HMAC SHA-256 signatures. Secret keys are referenced via secure vault tokens only.
      </Alert>

      {/* Webhook Endpoints */}
      <Card
        title="Registered Webhook Endpoints"
        subtitle="Inbound and outbound event subscribers with HMAC signature verification"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Webhook Code</TableHead>
                <TableHead>Provider Reference</TableHead>
                <TableHead>Target Endpoint Reference</TableHead>
                <TableHead>Subscribed Event Types</TableHead>
                <TableHead>Auth Method</TableHead>
                <TableHead>Retry Policy</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {wh.webhookCode}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {wh.providerName ?? 'Internal Gateway'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {wh.endpointReference}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {wh.eventTypes.map((et, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.6875rem',
                            fontFamily: 'var(--ds-font-mono)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--ds-color-surface-subtle)',
                            border: '1px solid var(--ds-color-border-subtle)'
                          }}
                        >
                          {et}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    <Badge variant="neutral">{wh.authenticationMethod}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {wh.retryPolicy} (Max {wh.maxRetryAttempts}x)
                  </TableCell>
                  <TableCell>
                    <Badge variant={wh.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {wh.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Webhook Deliveries */}
      <Card
        title="Recent Webhook Delivery Trace Log"
        subtitle="Event dispatch status, latency measurements, and HTTP response codes"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery ID</TableHead>
                <TableHead>Webhook Code</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HTTP Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Delivered At</TableHead>
                <TableHead>Trace Reference</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((del) => (
                <TableRow key={del.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {del.deliveryId}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {del.webhookCode ?? 'WH-DISPATCH'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <code>{del.eventType}</code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        del.deliveryStatus === 'DELIVERED'
                          ? 'success'
                          : del.deliveryStatus === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {del.deliveryStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {del.responseStatus ?? 'Pending'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {del.latencyMs ? `${del.latencyMs}ms` : '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {del.deliveredAt ? new Date(del.deliveredAt).toLocaleTimeString() : 'N/A'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {del.traceReference}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRetryingDelivery(del)}
                    >
                      Retry Dispatch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {retryingDelivery && (
        <WebhookRetryDialog
          isOpen={Boolean(retryingDelivery)}
          onClose={() => setRetryingDelivery(null)}
          delivery={retryingDelivery}
          onRetry={onRetryDelivery}
        />
      )}
    </div>
  );
};
