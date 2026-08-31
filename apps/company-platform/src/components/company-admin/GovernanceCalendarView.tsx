import React, { useState } from 'react';
import type { GovernanceEventDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { GovernanceEventActionDialog } from './GovernanceEventActionDialog.js';

export interface GovernanceCalendarViewProps {
  events: GovernanceEventDto[];
  onCompleteEvent: (eventId: string, minutesReference: string, resolutionReference: string | undefined, reason: string) => Promise<void>;
}

export const GovernanceCalendarView: React.FC<GovernanceCalendarViewProps> = ({
  events,
  onCompleteEvent
}) => {
  const [selectedEvent, setSelectedEvent] = useState<GovernanceEventDto | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Corporate Governance Calendar & Statutory Filings"
        subtitle="Annual shareholder meetings, quarterly board meetings, state franchise filings, and adopted resolutions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Code</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Minutes / Filing Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {evt.eventCode}
                  </TableCell>
                  <TableCell style={{ maxWidth: '240px' }}>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block', marginBottom: '2px' }}>
                      {evt.title}
                    </strong>
                    {evt.resolutionReference && (
                      <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                        {evt.resolutionReference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{evt.eventType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {new Date(evt.scheduledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {evt.organizerEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {evt.minutesReference ?? 'Pending Meeting'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={evt.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {evt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {evt.status === 'SCHEDULED' || evt.status === 'IN_PROGRESS' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedEvent(evt)}
                      >
                        Sign Off
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        Archived
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedEvent && (
        <GovernanceEventActionDialog
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          onCompleteEvent={onCompleteEvent}
        />
      )}
    </div>
  );
};
