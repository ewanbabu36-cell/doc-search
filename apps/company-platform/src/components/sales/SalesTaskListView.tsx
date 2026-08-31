import React from 'react';
import type { SalesTaskDto } from '@docsearch/api-contracts';
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

export interface SalesTaskListViewProps {
  tasks: SalesTaskDto[];
  onCompleteTask: (taskId: string) => Promise<void>;
}

export const SalesTaskListView: React.FC<SalesTaskListViewProps> = ({
  tasks,
  onCompleteTask
}) => {
  return (
    <Card
      title="Sales Tasks & Follow-up Actions"
      subtitle="Operational commitments, document deliveries, and legal review actions"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Title</TableHead>
              <TableHead>Target Entity / Account</TableHead>
              <TableHead>Assigned Owner</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No active sales tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: '600' }}>{t.title}</TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {t.relatedEntityName ?? 'Enterprise Account'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {t.assignedUserEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'neutral'}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(t.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.status !== 'COMPLETED' ? (
                      <Button variant="outline" size="sm" onClick={() => onCompleteTask(t.id)}>
                        Mark Completed
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-success)' }}>✓ Done</span>
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
