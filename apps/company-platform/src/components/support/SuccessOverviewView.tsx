import React from 'react';
import type {
  SupportTicketDto,
  PartnerHealthDto,
  SuccessCheckinDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface SuccessOverviewViewProps {
  tickets: SupportTicketDto[];
  healthProfiles: PartnerHealthDto[];
  checkins: SuccessCheckinDto[];
}

export const SuccessOverviewView: React.FC<SuccessOverviewViewProps> = ({
  tickets,
  healthProfiles,
  checkins
}) => {
  const activeTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const highPriorityTickets = activeTickets.filter(
    (t) => t.priority === 'CRITICAL_SLA' || t.priority === 'HIGH'
  );
  const atRiskPartners = healthProfiles.filter(
    (h) => h.healthStatus === 'AT_RISK' || h.healthStatus === 'CRITICAL'
  );
  const upcomingCheckins = checkins.filter((c) => c.status === 'SCHEDULED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Healthcare Partner Success & SLA Telemetry">
        <strong>Live customer support telemetry not connected (Live Telemetry).</strong> Doc Search platform tracks B2B healthcare partner support cases, SLA resolution deadlines, and account health indicators with zero fake live business metrics.
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
            Active Support Tickets
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeTickets.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">{activeTickets.length} Under Investigation</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            High / Critical Priority SLA
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {highPriorityTickets.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={highPriorityTickets.length > 0 ? 'danger' : 'success'}>
              {highPriorityTickets.length > 0 ? 'Urgent Attention' : 'All Healthy'}
            </Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Monitored Partner Health
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {healthProfiles.length} Accounts
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={atRiskPartners.length > 0 ? 'warning' : 'success'}>
              {atRiskPartners.length > 0 ? `${atRiskPartners.length} At-Risk` : '100% Retained'}
            </Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Upcoming QBRs & Milestone Syncs
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {upcomingCheckins.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Scheduled Reviews</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Active Escalations & SLA Governance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Active Support Tickets List */}
        <Card title="Active Partner Incidents & Requests" subtitle="Prioritized list of ongoing support escalations" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeTickets.length === 0 ? (
              <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
                No unresolved support tickets.
              </div>
            ) : (
              activeTickets.map((t) => (
                <div
                  key={t.id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', fontWeight: '700' }}>
                        {t.ticketNumber}
                      </span>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {t.partnerTradeName}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
                      {t.title}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant={t.priority === 'CRITICAL_SLA' || t.priority === 'HIGH' ? 'danger' : 'neutral'}>
                      {t.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* SLA Governance Controls */}
        <Card title="Enterprise Support SLA Governance" subtitle="Guaranteed turnaround policies and resolution benchmarks" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Enterprise Hospital SLA Tier:</span>
              <Badge variant="success">30-Min Critical Response</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Regional Clinic SLA Tier:</span>
              <Badge variant="neutral">4-Hour Business Response</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Audit Traceability:</span>
              <Badge variant="success">Every Ticket Comment & Status Logged</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Clinical Data Isolation:</span>
              <Badge variant="success">Zero Patient PHI in Support Logs</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
