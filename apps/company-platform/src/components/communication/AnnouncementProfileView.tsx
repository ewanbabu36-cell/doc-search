import React, { useState } from 'react';
import type { ContentItemDto, ContentStatus } from '@docsearch/api-contracts';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import { ContentTransitionDialog } from './ContentTransitionDialog.js';

export interface AnnouncementProfileViewProps {
  item: ContentItemDto;
  onBack: () => void;
  onTransitionStatus: (toStatus: ContentStatus, reason: string) => Promise<void>;
}

export const AnnouncementProfileView: React.FC<AnnouncementProfileViewProps> = ({
  item,
  onBack,
  onTransitionStatus
}) => {
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Directory
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.pinned && <Badge variant="warning">Pinned</Badge>}
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {item.title}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {item.type} | Target Audience: {item.targetAudience} | Author: {item.authorEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge
            variant={
              item.status === 'PUBLISHED'
                ? 'success'
                : item.status === 'SCHEDULED'
                ? 'primary'
                : 'neutral'
            }
          >
            Status: {item.status}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsTransitionOpen(true)}>
            Change Status
          </Button>
        </div>
      </div>

      {/* Two Column Grid: Content Metadata & Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Publication Metadata" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Content Slug:</span>
              <span style={{ fontFamily: 'var(--ds-font-mono)' }}>{item.slug}</span>
            </div>
            {item.versionTag && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Version Tag:</span>
                <Badge variant="neutral">{item.versionTag}</Badge>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Created At:</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Published Date:</span>
              <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Not published'}</span>
            </div>
            {item.scheduledFor && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-primary)' }}>Scheduled Release:</span>
                <span style={{ fontWeight: '500' }}>{new Date(item.scheduledFor).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Executive Abstract / Summary" padding="md">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--ds-color-text-primary)' }}>
            {item.summary}
          </p>
        </Card>
      </div>

      {/* Full Body Markdown Content View */}
      <Card title="Full Bulletin Body / Documentation" padding="lg">
        <div
          style={{
            fontSize: '0.9375rem',
            lineHeight: '1.7',
            color: 'var(--ds-color-text-primary)',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap'
          }}
        >
          {item.bodyMarkdown}
        </div>
      </Card>

      {/* State Transition Dialog */}
      {isTransitionOpen && (
        <ContentTransitionDialog
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          item={item}
          onTransition={onTransitionStatus}
        />
      )}
    </div>
  );
};
