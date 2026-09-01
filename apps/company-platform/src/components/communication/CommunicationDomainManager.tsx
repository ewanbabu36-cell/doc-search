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
import { WhatsAppCampaignBroadcaster } from './WhatsAppCampaignBroadcaster.js';
import { TestMessageSandboxView } from './TestMessageSandboxView.js';
import { CampaignAbTestingAnalyticsView } from './CampaignAbTestingAnalyticsView.js';
import { AiMultilingualCopywriterModal } from './AiMultilingualCopywriterModal.js';
import { EmergencyBroadcastTriggerModal } from './EmergencyBroadcastTriggerModal.js';
import { Tabs, Badge, Button, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'whatsapp'
  | 'announcements'
  | 'releases'
  | 'bulletins'
  | 'templates'
  | 'sandbox'
  | 'ab-testing'
  | 'dispatches';

export const CommunicationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [contentItems, setContentItems] = useState<ContentItemDto[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateDto[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecordDto[]>([]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

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
      {/* Header with Enterprise Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              📢 Omnichannel Communication, Content & Broadcast Engine
            </h1>
            <Badge variant="success">● Meta & Telecom Gateways Live</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            WhatsApp campaigns, multilingual AI copywriting, hospital emergency flash alerts, and live carrier test sandbox
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            style={{
              borderColor: '#A855F7',
              color: '#C084FC',
              fontWeight: 800
            }}
          >
            🤖 AI Copywriter Co-Pilot
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEmergencyModalOpen(true)}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            🚨 Emergency Flash Alert
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('whatsapp')}
            style={{
              backgroundColor: '#25D366',
              color: '#070C16',
              fontWeight: 900
            }}
          >
            📲 WhatsApp Broadcaster
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'whatsapp',
            label: '📲 WhatsApp Campaigns',
            badge: <Badge variant="primary">New</Badge>
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
            id: 'sandbox',
            label: '📱 Test Sandbox Simulator'
          },
          {
            id: 'ab-testing',
            label: '📈 A/B Analytics'
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

      {activeTab === 'whatsapp' && (
        <WhatsAppCampaignBroadcaster />
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

      {activeTab === 'sandbox' && (
        <TestMessageSandboxView />
      )}

      {activeTab === 'ab-testing' && (
        <CampaignAbTestingAnalyticsView />
      )}

      {activeTab === 'dispatches' && (
        <DispatchRecordListView dispatches={dispatches} />
      )}

      {/* Modals */}
      <AiMultilingualCopywriterModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyContent={(text) => {
          setSuccessBanner(`AI multilingual copy generated and copied to clipboard! (${text.slice(0, 45)}...)`);
          setTimeout(() => setSuccessBanner(null), 5000);
        }}
      />

      <EmergencyBroadcastTriggerModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onBroadcastSuccess={(title) => {
          setSuccessBanner(`🚨 Emergency Mass-Broadcast "${title}" dispatched across all facilities and SMS/WhatsApp channels!`);
          setTimeout(() => setSuccessBanner(null), 6000);
        }}
      />
    </div>
  );
};
