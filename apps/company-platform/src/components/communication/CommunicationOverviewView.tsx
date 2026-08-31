import React from 'react';
import type {
  ContentItemDto,
  NotificationTemplateDto,
  DispatchRecordDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface CommunicationOverviewViewProps {
  contentItems: ContentItemDto[];
  templates: NotificationTemplateDto[];
  dispatches: DispatchRecordDto[];
}

export const CommunicationOverviewView: React.FC<CommunicationOverviewViewProps> = ({
  contentItems,
  templates,
  dispatches
}) => {
  const publishedAnnouncements = contentItems.filter(
    (c) => c.type === 'PLATFORM_ANNOUNCEMENT' && c.status === 'PUBLISHED'
  );
  const releaseBroadcasts = contentItems.filter((c) => c.type === 'RELEASE_BROADCAST');
  const operationalBulletins = contentItems.filter((c) => c.type === 'OPERATIONAL_BULLETIN');
  const pinnedNotices = contentItems.filter((c) => c.pinned);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Platform Communication & Notification Governance">
        <strong>Live notification gateway disconnected (Live Telemetry).</strong> Doc Search platform manages announcement channels, release broadcasts, security advisories, and notification templates without synthetic delivery statistics.
      </Alert>

      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Announcements
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {publishedAnnouncements.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">In-App Banner Active</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Product Release Broadcasts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {releaseBroadcasts.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="success">Versioned Changelogs</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Operational Bulletins
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {operationalBulletins.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Maintenance & Security</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Notification Templates
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {templates.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Multi-Channel Blueprints</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Pinned Advisories & Dispatch History Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Pinned Platform Bulletins */}
        <Card title="Pinned Platform Advisories" subtitle="High-visibility bulletins broadcasted across partner shells" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pinnedNotices.length === 0 ? (
              <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
                No pinned advisories currently active.
              </div>
            ) : (
              pinnedNotices.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>📌 {p.title}</strong>
                    <Badge variant="warning">{p.type}</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', lineHeight: '1.5' }}>
                    {p.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Dispatch Records */}
        <Card title="Recent Dispatch Broadcasts" subtitle="Delivery confirmations across email, webhooks, and in-app shells" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dispatches.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                    {d.contentItemTitle}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    Recipient: {d.recipientEmail} | Channel: {d.channel}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={d.deliveryStatus === 'DELIVERED' ? 'success' : 'neutral'}>
                    {d.deliveryStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
