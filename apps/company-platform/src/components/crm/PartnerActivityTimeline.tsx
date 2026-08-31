import React from 'react';
import type { PartnerTransitionHistoryDto } from '@docsearch/api-contracts';
import {
  Card,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge
} from '@docsearch/ui-kit';

export interface PartnerActivityTimelineProps {
  history: PartnerTransitionHistoryDto[];
}

export const PartnerActivityTimeline: React.FC<PartnerActivityTimelineProps> = ({ history }) => {
  return (
    <Card
      title="Partner Lifecycle & Audit History"
      subtitle="Immutable transition logs and administrative changes"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table isDense>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>State Transition</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Reason / Justification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No historical state transitions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell style={{ color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="neutral">{h.fromStatus}</Badge>
                      <span style={{ color: 'var(--ds-color-text-muted)' }}>→</span>
                      <Badge variant="primary">{h.toStatus}</Badge>
                    </div>
                  </TableCell>
                  <TableCell style={{ color: 'var(--ds-color-text-secondary)', fontSize: '0.8125rem' }}>
                    {h.actorEmail}
                  </TableCell>
                  <TableCell style={{ color: 'var(--ds-color-text-primary)' }}>
                    {h.reason}
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
