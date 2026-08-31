import React, { useState, useEffect } from 'react';
import type {
  ContentItemDto,
  ContentStatus,
  NotificationTemplateDto,
  DispatchRecordDto
} from '@docsearch/api-contracts';
import { communicationService } from '../../services/communication-service.js';
import { CommunicationOverviewView } from './CommunicationOverviewView.js';
import { AnnouncementListView } from './AnnouncementListView.js';
import { AnnouncementProfileView } from './AnnouncementProfileView.js';
import { ReleaseBroadcastView } from './ReleaseBroadcastView.js';
import { OperationalBulletinView } from './OperationalBulletinView.js';
import { NotificationTemplateListView } from './NotificationTemplateListView.js';
import { DispatchRecordListView } from './DispatchRecordListView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'announcements'
  | 'releases'
  | 'bulletins'
  | 'templates'
  | 'dispatches';

export const CommunicationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [contentItems, setContentItems] = useState<ContentItemDto[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateDto[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecordDto[]>([]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemsRes, templatesRes, dispatchesRes] = await Promise.all([
        communicationService.getContentItems(),
        communicationService.getNotificationTemplates(),
        communicationService.getDispatchRecords()
      ]);
      setContentItems(itemsRes);
      setTemplates(templatesRes);
      setDispatches(dispatchesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Communication & Content data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTransitionStatus = async (toStatus: ContentStatus, reason: string) => {
    if (!selectedItemId) return;
    const updated = await communicationService.transitionContentStatus(selectedItemId, {
      toStatus,
      reason
    });
    setContentItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  if (isLoading && contentItems.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Communication & Content data...
        </span>
      </div>
    );
  }

  if (error && contentItems.length === 0) {
    return (
      <ErrorState title="Communication Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown to Content Item Profile
  if (selectedItemId) {
    const item = contentItems.find((i) => i.id === selectedItemId);
    if (item) {
      return (
        <AnnouncementProfileView
          item={item}
          onBack={() => setSelectedItemId(null)}
          onTransitionStatus={handleTransitionStatus}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Communication & Content
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Platform announcements, release broadcasts, operational bulletins, and multi-channel notification templates
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'announcements',
            label: '📢 Announcements',
            badge: <Badge variant="neutral">{contentItems.length}</Badge>
          },
          {
            id: 'releases',
            label: '🚀 Release Broadcasts'
          },
          {
            id: 'bulletins',
            label: '🛠️ Operational Bulletins'
          },
          {
            id: 'templates',
            label: '📝 Notification Templates',
            badge: <Badge variant="neutral">{templates.length}</Badge>
          },
          {
            id: 'dispatches',
            label: '📨 Dispatch Logs',
            badge: <Badge variant="neutral">{dispatches.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <CommunicationOverviewView
          contentItems={contentItems}
          templates={templates}
          dispatches={dispatches}
        />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementListView
          items={contentItems}
          onSelectItem={(id) => setSelectedItemId(id)}
        />
      )}

      {activeTab === 'releases' && (
        <ReleaseBroadcastView
          items={contentItems}
          onSelectItem={(id) => setSelectedItemId(id)}
        />
      )}

      {activeTab === 'bulletins' && (
        <OperationalBulletinView
          items={contentItems}
          onSelectItem={(id) => setSelectedItemId(id)}
        />
      )}

      {activeTab === 'templates' && (
        <NotificationTemplateListView templates={templates} />
      )}

      {activeTab === 'dispatches' && (
        <DispatchRecordListView dispatches={dispatches} />
      )}
    </div>
  );
};
