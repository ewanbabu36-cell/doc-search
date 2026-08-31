import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type {
  WhatsAppOverviewMetricsDto,
  WhatsAppConversationThreadDto,
  HealthDocumentDispatchDto,
  LiveQueueTokenDto
} from '@docsearch/api-contracts';

interface Props {
  metrics: WhatsAppOverviewMetricsDto;
  conversations: WhatsAppConversationThreadDto[];
  dispatches: HealthDocumentDispatchDto[];
  tokens: LiveQueueTokenDto[];
  onSendMessage: () => void;
  onDispatchDoc: () => void;
  onSendReminder: () => void;
}

export const WhatsAppOverviewView: React.FC<Props> = ({
  metrics,
  conversations,
  dispatches,
  tokens,
  onSendMessage,
  onDispatchDoc,
  onSendReminder
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">WhatsApp Conversational Bot & Aarogya 360 Patient Self-Service Portal</h2>
              <Badge variant="success">Meta Cloud API Connected</Badge>
            </div>
            <p className="text-xs text-emerald-200">2-Way Multilingual Conversational AI, Instant PDF e-Rx/Lab Delivery & Live OPD Queue Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onSendMessage}>💬 Send Message</Button>
          <Button variant="outline" onClick={onDispatchDoc}>📄 Dispatch PDF</Button>
          <Button variant="outline" onClick={onSendReminder}>⏰ Medication Reminder</Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <span className="text-xs font-semibold text-emerald-700">WhatsApp Interactions Today</span>
          <p className="text-2xl font-bold text-emerald-900">{metrics.totalConversationsToday}</p>
          <p className="text-xs text-emerald-600 mt-1">Bot Handled: {metrics.botHandledInteractionsPct}% (Avg: {metrics.averageBotResponseTimeSec}s)</p>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <span className="text-xs font-semibold text-blue-700">Health PDFs Dispatched</span>
          <p className="text-2xl font-bold text-blue-900">{metrics.documentsDispatchedMonth}</p>
          <p className="text-xs text-blue-600 mt-1">e-Rx, Lab & Discharge PDFs</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <span className="text-xs font-semibold text-purple-700">Active Aarogya 360 Users</span>
          <p className="text-2xl font-bold text-purple-900">{metrics.activePortalUsersCount}</p>
          <p className="text-xs text-purple-600 mt-1">Web & Mobile Self-Service</p>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <span className="text-xs font-semibold text-amber-700">Appointments via WhatsApp</span>
          <p className="text-2xl font-bold text-amber-900">{metrics.appointmentsBookedViaWhatsApp}</p>
          <p className="text-xs text-amber-600 mt-1">Patient NPS Score: {metrics.patientNpsScore}/100</p>
        </Card>
      </div>

      {/* Live WhatsApp Conversations & Queue Tokens */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Conversations */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live WhatsApp Inbound Chats ({conversations.length})
            </h3>
            <span className="text-xs text-gray-500">2-Way Webhook Stream</span>
          </div>
          <div className="space-y-2">
            {conversations.map((c) => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{c.patientName} ({c.phoneNumber})</span>
                  <Badge variant={c.botActive ? 'success' : 'warning'}>{c.botActive ? '🤖 AI Bot Active' : '🧑‍💼 Agent Desk'}</Badge>
                </div>
                <p className="text-gray-700 font-medium">"{c.lastMessageSnippet}"</p>
                <p className="text-gray-400 text-[10px]">MRN: {c.patientMrn} | {c.lastActivityTimestamp.replace('T', ' ').substring(11, 16)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Live OPD Queue Tokens */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Live OPD Queue Token Radar ({tokens.length} Active in Lobby)
            </h3>
            <span className="text-xs text-gray-500">Real-time ETA</span>
          </div>
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-950 text-sm">Token #{t.tokenNumber} — {t.patientName}</span>
                  <Badge variant={t.queueStatus === 'CALLED_TO_ROOM' ? 'success' : 'primary'}>{t.queueStatus}</Badge>
                </div>
                <p className="text-blue-900 font-medium">{t.doctorName} ({t.departmentName} — {t.roomNumber})</p>
                <div className="flex justify-between text-blue-800 text-[11px] pt-1">
                  <span>Currently Serving: <strong>{t.currentTokenServing}</strong></span>
                  <span>Est. Wait: <strong>~{t.estimatedWaitMinutes} mins</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dispatched Documents Feed */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900">Recent Automated Health Document Dispatches ({dispatches.length})</h3>
          <span className="text-xs text-gray-500">Meta Verified Cloud Document Delivery</span>
        </div>
        <div className="divide-y text-xs">
          {dispatches.map((d) => (
            <div key={d.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{d.fileName}</span>
                  <Badge variant="success">{d.documentType}</Badge>
                </div>
                <p className="text-gray-600 mt-0.5">Dispatched to: <strong>{d.patientName}</strong> ({d.phoneNumber}) via {d.dispatchChannel}</p>
              </div>
              <div className="text-right">
                <Badge variant="neutral">{d.deliveryStatus}</Badge>
                <span className="text-gray-400 text-[11px] block mt-0.5">{d.dispatchedAt.replace('T', ' ').substring(11, 16)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
