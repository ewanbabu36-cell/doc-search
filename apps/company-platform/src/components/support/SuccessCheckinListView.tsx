import React from 'react';
import type { SuccessCheckinDto } from '@docsearch/api-contracts';
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

export interface SuccessCheckinListViewProps {
  checkins: SuccessCheckinDto[];
}

export const SuccessCheckinListView: React.FC<SuccessCheckinListViewProps> = ({
  checkins
}) => {
  return (
    <Card
      title="QBR & Success Check-in Schedule"
      subtitle="Strategic quarterly business reviews, executive alignments, and onboarding checkpoint milestones"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Account</TableHead>
              <TableHead>Review Type</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CSM Lead</TableHead>
              <TableHead>Key Attendees</TableHead>
              <TableHead>Summary / Action Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No customer success check-ins scheduled.
                </TableCell>
              </TableRow>
            ) : (
              checkins.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.partnerTradeName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{c.checkinType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {new Date(c.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {c.hostLeadEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {c.attendeeNames.join(', ')}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                    {c.summaryNotes && <div style={{ color: 'var(--ds-color-text-primary)', marginBottom: '4px' }}>{c.summaryNotes}</div>}
                    {c.actionItems.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        <strong>Action items:</strong> {c.actionItems.join('; ')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
