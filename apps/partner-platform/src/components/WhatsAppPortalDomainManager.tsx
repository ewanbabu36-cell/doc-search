import React, { useState, useEffect, useCallback } from 'react';
import type {
  WhatsAppOverviewMetricsDto,
  WhatsAppConversationThreadDto,
  HealthDocumentDispatchDto,
  AarogyaPatientProfileDto,
  LiveQueueTokenDto,
  WhatsAppAuditTraceDto,
  SendWhatsAppMessageRequest,
  DispatchHealthDocumentRequest,
  SendMedicationReminderRequest
} from '@docsearch/api-contracts';

import { whatsappPortalService } from '../services/whatsapp-portal-service.js';

// Views
import { WhatsAppOverviewView } from './views/WhatsAppOverviewView.js';
import { WhatsAppLiveChatDeskView } from './views/WhatsAppLiveChatDeskView.js';
import { Aarogya360PatientPortalView } from './views/Aarogya360PatientPortalView.js';
import { AutomatedDocumentDeliveryView } from './views/AutomatedDocumentDeliveryView.js';
import { LiveQueueTokenTrackerView } from './views/LiveQueueTokenTrackerView.js';
import { WhatsAppAuditVaultView } from './views/WhatsAppAuditVaultView.js';
import { WaitingRoomTvDisplayView } from './views/WaitingRoomTvDisplayView.js';
import { PatientGrowthLoyaltyHubView } from './views/PatientGrowthLoyaltyHubView.js';
import { AutonomousPostCareAgentView } from './views/AutonomousPostCareAgentView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { SendWhatsAppTemplateDialog } from './dialogs/SendWhatsAppTemplateDialog.js';
import { DispatchHealthDocumentDialog } from './dialogs/DispatchHealthDocumentDialog.js';
import { SendMedicationReminderDialog } from './dialogs/SendMedicationReminderDialog.js';

type WhatsAppTab =
  | 'OVERVIEW'
  | 'LIVE_CHAT_DESK'
  | 'POST_CARE_AGENT'
  | 'PATIENT_GROWTH_LOYALTY'
  | 'SMART_TV_DISPLAY'
  | 'AAROGYA_PORTAL'
  | 'DOCUMENT_DELIVERY'
  | 'QUEUE_TOKENS'
  | 'AUDIT_VAULT';

interface Props {
  tenantId: string;
}

export const WhatsAppPortalDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<WhatsAppTab>('OVERVIEW');

  // Data states
  const [metrics, setMetrics] = useState<WhatsAppOverviewMetricsDto | null>(null);
  const [conversations, setConversations] = useState<WhatsAppConversationThreadDto[]>([]);
  const [dispatches, setDispatches] = useState<HealthDocumentDispatchDto[]>([]);
  const [patientProfile, setPatientProfile] = useState<AarogyaPatientProfileDto | null>(null);
  const [queueTokens, setQueueTokens] = useState<LiveQueueTokenDto[]>([]);
  const [traces, setTraces] = useState<WhatsAppAuditTraceDto[]>([]);

  // Dialog toggles
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showDispatchDoc, setShowDispatchDoc] = useState(false);
  const [showSendReminder, setShowSendReminder] = useState(false);

  const loadData = useCallback(async () => {
    const [
      m,
      convs,
      docs,
      prof,
      tokens,
      tr
    ] = await Promise.all([
      whatsappPortalService.getOverviewMetrics(tenantId),
      whatsappPortalService.getConversations(tenantId),
      whatsappPortalService.getDocumentDispatches(tenantId),
      whatsappPortalService.getPatientPortalProfile(tenantId, 'MRN-2026-9021'),
      whatsappPortalService.getLiveQueueTokens(tenantId),
      whatsappPortalService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setConversations(convs);
    setDispatches(docs);
    setPatientProfile(prof);
    setQueueTokens(tokens);
    setTraces(tr);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!metrics || !patientProfile) {
    return <div className="p-8 text-center text-xs text-gray-500">Initializing WhatsApp & Patient Portal Gateway...</div>;
  }

  // Handlers
  const handleSendMessage = async (data: SendWhatsAppMessageRequest) => {
    await whatsappPortalService.sendMessage(tenantId, data);
    await loadData();
  };

  const handleToggleBot = async (conversationId: string, botActive: boolean) => {
    await whatsappPortalService.toggleBotActive(tenantId, conversationId, botActive);
    await loadData();
  };

  const handleDispatchDoc = async (data: DispatchHealthDocumentRequest) => {
    await whatsappPortalService.dispatchDocument(tenantId, data);
    await loadData();
    setActiveTab('DOCUMENT_DELIVERY');
  };

  const handleSendReminder = async (data: SendMedicationReminderRequest) => {
    await whatsappPortalService.sendMedicationReminder(tenantId, data);
    await loadData();
  };

  const activeConv = conversations[0];

  return (
    <div className="space-y-4">
      {/* Domain Navigation Tabs */}
      <div
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '6px 8px'
        }}
      >
        {[
          { key: 'OVERVIEW', label: '💬 WhatsApp Overview' },
          { key: 'LIVE_CHAT_DESK', label: `🧑‍💼 Live Chat (${conversations.length})` },
          { key: 'POST_CARE_AGENT', label: '🤖 Post-Care AI & SOS' },
          { key: 'SMART_TV_DISPLAY', label: '📺 Smart TV HUD' },
          { key: 'PATIENT_GROWTH_LOYALTY', label: '👑 Patient Care Pass' }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as WhatsAppTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
                backgroundColor: isActive ? '#0284C7' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                  e.currentTarget.style.color = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary Modules Dropdown */}
        <TabOverflowMenu
          label="More WhatsApp Tools"
          options={[
            { id: 'AAROGYA_PORTAL', label: '📱 Aarogya 360 Portal' },
            { id: 'DOCUMENT_DELIVERY', label: '📄 PDF Health Dispatch', count: dispatches.length },
            { id: 'QUEUE_TOKENS', label: '🎫 Live OPD Tokens', count: queueTokens.length },
            { id: 'AUDIT_VAULT', label: '🔐 Audit Vault' }
          ]}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as WhatsAppTab)}
          onReset={() => setActiveTab('OVERVIEW')}
          accentColor="#0284C7"
          activeBorderColor="#38BDF8"
        />
      </div>

      {/* Tab Renderers */}
      {activeTab === 'OVERVIEW' && (
        <WhatsAppOverviewView
          metrics={metrics}
          conversations={conversations}
          dispatches={dispatches}
          tokens={queueTokens}
          onSendMessage={() => setShowSendMessage(true)}
          onDispatchDoc={() => setShowDispatchDoc(true)}
          onSendReminder={() => setShowSendReminder(true)}
        />
      )}

      {activeTab === 'LIVE_CHAT_DESK' && (
        <WhatsAppLiveChatDeskView
          conversations={conversations}
          onSendMessage={handleSendMessage}
          onToggleBot={handleToggleBot}
        />
      )}

      {activeTab === 'POST_CARE_AGENT' && (
        <AutonomousPostCareAgentView />
      )}

      {activeTab === 'SMART_TV_DISPLAY' && (
        <WaitingRoomTvDisplayView />
      )}

      {activeTab === 'PATIENT_GROWTH_LOYALTY' && (
        <PatientGrowthLoyaltyHubView />
      )}

      {activeTab === 'AAROGYA_PORTAL' && <Aarogya360PatientPortalView profile={patientProfile} />}
      {activeTab === 'DOCUMENT_DELIVERY' && (
        <AutomatedDocumentDeliveryView
          dispatches={dispatches}
          onDispatchNew={() => setShowDispatchDoc(true)}
        />
      )}

      {activeTab === 'QUEUE_TOKENS' && <LiveQueueTokenTrackerView tokens={queueTokens} />}
      {activeTab === 'AUDIT_VAULT' && <WhatsAppAuditVaultView traces={traces} />}

      {/* Dialog Modals */}
      {showSendMessage && activeConv && (
        <SendWhatsAppTemplateDialog
          isOpen={showSendMessage}
          conversationId={activeConv.id}
          patientName={activeConv.patientName}
          onClose={() => setShowSendMessage(false)}
          onSubmit={handleSendMessage}
        />
      )}

      <DispatchHealthDocumentDialog
        isOpen={showDispatchDoc}
        onClose={() => setShowDispatchDoc(false)}
        onSubmit={handleDispatchDoc}
      />

      <SendMedicationReminderDialog
        isOpen={showSendReminder}
        onClose={() => setShowSendReminder(false)}
        onSubmit={handleSendReminder}
      />
    </div>
  );
};
