import React from 'react';
import type { DispatchRecordDto } from '@docsearch/api-contracts';
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

export interface DispatchRecordListViewProps {
  dispatches: DispatchRecordDto[];
}

export const DispatchRecordListView: React.FC<DispatchRecordListViewProps> = ({
  dispatches
}) => {
  return (
    <Card
      title="Notification Dispatch & Delivery Log"
      subtitle="Operational trace of broadcast executions and channel delivery status"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broadcast / Content Item</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Dispatched At</TableHead>
              <TableHead>Delivered At</TableHead>
              <TableHead>Delivery Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dispatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No notification dispatches recorded.
                </TableCell>
              </TableRow>
            ) : (
              dispatches.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{d.contentItemTitle}</strong>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {d.recipientEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{d.channel}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : 'Pending'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.deliveryStatus === 'DELIVERED' ? 'success' : 'neutral'}>
                      {d.deliveryStatus}
                    </Badge>
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
