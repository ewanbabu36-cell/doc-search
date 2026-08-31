import React from 'react';
import type { SupportTicketDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface SlaMonitoringViewProps {
  tickets: SupportTicketDto[];
  onSelectTicket: (ticketId: string) => void;
}

export const SlaMonitoringView: React.FC<SlaMonitoringViewProps> = ({
  tickets,
  onSelectTicket
}) => {
  const activeSlaTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SLA Tiers Description Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card title="Tier 1: Enterprise Critical SLA" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Response Target:</span>
              <strong>30 Minutes (24/7/365)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Resolution Target:</span>
              <strong>4 Hours Max</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
              Applies to production clinical outages & FHIR gateway down events.
            </span>
          </div>
        </Card>

        <Card title="Tier 2: High Priority SLA" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Response Target:</span>
              <strong>2 Hours (Business Hours)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Resolution Target:</span>
              <strong>24 Hours Max</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
              Applies to branch configuration & user provisioning impediments.
            </span>
          </div>
        </Card>
      </div>

      {/* Real-time SLA Tracking Table */}
      <Card
        title="Active SLA Tracking & Response Deadlines"
        subtitle="Live monitors of outstanding support cases vs contracted resolution benchmarks"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Due</TableHead>
                <TableHead>Resolution Due</TableHead>
                <TableHead>SLA State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSlaTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No active support tickets pending SLA resolution.
                  </TableCell>
                </TableRow>
              ) : (
                activeSlaTickets.map((t) => (
                  <TableRow key={t.id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t.id)}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.8125rem' }}>
                      {t.ticketNumber}
                    </TableCell>
                    <TableCell style={{ fontWeight: '500' }}>
                      {t.partnerTradeName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.priority === 'CRITICAL_SLA' || t.priority === 'HIGH' ? 'danger' : 'neutral'}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{t.status}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {t.slaResponseDue ? new Date(t.slaResponseDue).toLocaleTimeString() : 'Met'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                      {t.slaResolutionDue ? new Date(t.slaResolutionDue).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.slaStatus === 'WITHIN_SLA' ? 'success' : 'danger'}>
                        {t.slaStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
