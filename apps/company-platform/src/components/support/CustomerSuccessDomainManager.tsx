import React, { useState, useEffect } from 'react';
import type {
  SupportTicketDto,
  TicketStatus,
  TicketCommentDto,
  PartnerHealthDto,
  SuccessCheckinDto
} from '@docsearch/api-contracts';
import { supportService } from '../../services/support-service.js';
import { SuccessOverviewView } from './SuccessOverviewView.js';
import { TicketListView } from './TicketListView.js';
import { TicketProfileView } from './TicketProfileView.js';
import { PartnerHealthListView } from './PartnerHealthListView.js';
import { SlaMonitoringView } from './SlaMonitoringView.js';
import { SuccessCheckinListView } from './SuccessCheckinListView.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab = 'overview' | 'tickets' | 'health' | 'sla' | 'checkins';

export const CustomerSuccessDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [comments, setComments] = useState<TicketCommentDto[]>([]);
  const [healthProfiles, setHealthProfiles] = useState<PartnerHealthDto[]>([]);
  const [checkins, setCheckins] = useState<SuccessCheckinDto[]>([]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketsRes, healthRes, checkinsRes] = await Promise.all([
        supportService.getTickets(),
        supportService.getPartnerHealth(),
        supportService.getSuccessCheckins()
      ]);
      setTickets(ticketsRes);
      setHealthProfiles(healthRes);
      setCheckins(checkinsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Customer Success telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // When selectedTicketId changes, load ticket comments
  useEffect(() => {
    if (!selectedTicketId) return;
    void supportService.getTicketComments(selectedTicketId).then((c) => setComments(c));
  }, [selectedTicketId]);

  const handleTransitionTicket = async (
    toStatus: TicketStatus,
    reason: string,
    resolutionNotes?: string
  ) => {
    if (!selectedTicketId) return;
    const updated = await supportService.transitionTicket(selectedTicketId, {
      toStatus,
      reason,
      ...(resolutionNotes ? { resolutionNotes } : {})
    });
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAddComment = async (content: string, isInternalOnly: boolean) => {
    if (!selectedTicketId) return;
    const newComment = await supportService.addTicketComment({
      ticketId: selectedTicketId,
      content,
      isInternalOnly
    });
    setComments((prev) => [...prev, newComment]);
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Partner Support & Health telemetry...
        </span>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <ErrorState title="Support Workspace Unavailable" message={error} onRetry={loadData} />
    );
  }

  // Drilldown to Ticket Profile
  if (selectedTicketId) {
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    if (ticket) {
      return (
        <TicketProfileView
          ticket={ticket}
          comments={comments}
          onBack={() => setSelectedTicketId(null)}
          onTransitionTicket={handleTransitionTicket}
          onAddComment={handleAddComment}
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
              Customer Success & Support
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Healthcare partner support cases, SLA resolution deadlines, account health scores, and QBR milestones
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Support & Success Overview'
          },
          {
            id: 'tickets',
            label: '🎫 Support Tickets',
            badge: <Badge variant="neutral">{tickets.length}</Badge>
          },
          {
            id: 'health',
            label: '🩺 Partner Health Matrix',
            badge: <Badge variant="neutral">{healthProfiles.length}</Badge>
          },
          {
            id: 'sla',
            label: '⏱️ SLA Monitor'
          },
          {
            id: 'checkins',
            label: '📅 QBRs & Check-ins',
            badge: <Badge variant="neutral">{checkins.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <SuccessOverviewView
          tickets={tickets}
          healthProfiles={healthProfiles}
          checkins={checkins}
        />
      )}

      {activeTab === 'tickets' && (
        <TicketListView
          tickets={tickets}
          onSelectTicket={(id) => setSelectedTicketId(id)}
        />
      )}

      {activeTab === 'health' && (
        <PartnerHealthListView healthProfiles={healthProfiles} />
      )}

      {activeTab === 'sla' && (
        <SlaMonitoringView
          tickets={tickets}
          onSelectTicket={(id) => setSelectedTicketId(id)}
        />
      )}

      {activeTab === 'checkins' && (
        <SuccessCheckinListView checkins={checkins} />
      )}
    </div>
  );
};
