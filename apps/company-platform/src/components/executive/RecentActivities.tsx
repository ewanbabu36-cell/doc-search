import React from 'react';
import type { RecentActivity } from '../../types/executive.js';
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

export interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <Card
      title="Recent System & Audit Activities"
      subtitle="Immutable event telemetry from core platform services"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table isDense>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Target Context</TableHead>
              <TableHead>Actor Identity</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((act) => (
              <TableRow key={act.id}>
                <TableCell style={{ fontWeight: '500', fontFamily: 'var(--ds-font-mono, monospace)' }}>
                  {act.eventType}
                </TableCell>
                <TableCell>{act.organization}</TableCell>
                <TableCell style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>
                  {act.actor}
                </TableCell>
                <TableCell style={{ color: 'var(--ds-color-text-muted)', whiteSpace: 'nowrap' }}>
                  {act.timestamp}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      act.status === 'SUCCESS'
                        ? 'success'
                        : act.status === 'WARNING'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {act.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
