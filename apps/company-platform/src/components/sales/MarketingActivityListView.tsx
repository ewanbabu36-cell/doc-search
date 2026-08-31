import React from 'react';
import type { MarketingActivityDto } from '@docsearch/api-contracts';
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

export interface MarketingActivityListViewProps {
  activities: MarketingActivityDto[];
}

export const MarketingActivityListView: React.FC<MarketingActivityListViewProps> = ({
  activities
}) => {
  return (
    <Card
      title="Marketing & Outreach Activity Log"
      subtitle="Operational record of partner briefings, webinars, discovery sessions, and product demonstrations"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Title</TableHead>
              <TableHead>Activity Type</TableHead>
              <TableHead>Associated Account / Campaign</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No marketing activity records logged.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell style={{ fontWeight: '600' }}>{a.title}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{a.activityType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {a.partnerTradeName ?? a.campaignName ?? 'Enterprise Outreach'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{a.description}</TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {a.recordedByEmail}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(a.activityDate).toLocaleDateString()}
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
