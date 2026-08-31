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

// Dialogs
import { SendWhatsAppTemplateDialog } from './dialogs/SendWhatsAppTemplateDialog.js';
import { DispatchHealthDocumentDialog } from './dialogs/DispatchHealthDocumentDialog.js';
import { SendMedicationReminderDialog } from './dialogs/SendMedicationReminderDialog.js';

type WhatsAppTab =
  | 'OVERVIEW'
  | 'LIVE_CHAT_DESK'
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
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          💬 WhatsApp Overview
        </button>
        <button
          onClick={() => setActiveTab('LIVE_CHAT_DESK')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'LIVE_CHAT_DESK' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🧑‍💼 Live Chat Desk ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('SMART_TV_DISPLAY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'SMART_TV_DISPLAY' ? 'bg-cyan-700 text-white font-bold' : 'text-cyan-400 hover:bg-cyan-950/40'}`}
        >
          📺 Smart TV Waiting Room HUD (Voice Call)
        </button>
        <button
          onClick={() => setActiveTab('PATIENT_GROWTH_LOYALTY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'PATIENT_GROWTH_LOYALTY' ? 'bg-amber-600 text-white font-bold' : 'text-amber-500 hover:bg-amber-500/10'}`}
        >
          👑 Patient Care Pass & Growth Hub
        </button>
        <button
          onClick={() => setActiveTab('AAROGYA_PORTAL')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AAROGYA_PORTAL' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📱 Aarogya 360 Portal
        </button>
        <button
          onClick={() => setActiveTab('DOCUMENT_DELIVERY')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'DOCUMENT_DELIVERY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📄 PDF Health Dispatch ({dispatches.length})
        </button>
        <button
          onClick={() => setActiveTab('QUEUE_TOKENS')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'QUEUE_TOKENS' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🎫 Live OPD Tokens ({queueTokens.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'AUDIT_VAULT' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🔐 Audit Vault
        </button>
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
