import React, { useState } from 'react';
import type { SupportTicketDto, TicketStatus, TicketPriority } from '@docsearch/api-contracts';
import { CreateTicketModal } from './CreateTicketModal.js';
import {
  Card,
  Input,
  Select,
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

export interface TicketListViewProps {
  tickets: SupportTicketDto[];
  onSelectTicket: (ticketId: string) => void;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  tickets,
  onSelectTicket
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [localTickets, setLocalTickets] = useState<SupportTicketDto[]>(tickets);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = (localTickets.length > 0 ? localTickets : tickets).filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Partner Support Tickets & SLA Desk</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filtered.length} active hospital tickets logged</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} style={{ backgroundColor: '#38BDF8', color: '#070C16', fontWeight: 800 }}>
          ➕ Open New Support Ticket
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newTicket) => {
          setLocalTickets((prev) => [newTicket, ...(prev.length > 0 ? prev : tickets)]);
          setSuccessMsg(`Ticket "${newTicket.title}" logged successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Search Tickets</label>
            <Input placeholder="Search by title or keyword..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Status</label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Open', value: 'OPEN' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Pending Partner', value: 'PENDING_PARTNER' },
                { label: 'Resolved', value: 'RESOLVED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Priority</label>
            <Select
              options={[
                { label: 'All Priorities', value: 'ALL' },
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical SLA', value: 'CRITICAL_SLA' }
              ]}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No tickets found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{t.title}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{t.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.priority === 'CRITICAL_SLA' || t.priority === 'HIGH' ? 'danger' : 'neutral'}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'OPEN' ? 'primary' : t.status === 'RESOLVED' ? 'success' : 'warning'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span>{t.assignedAgentEmail ?? 'Unassigned'}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectTicket(t.id)}>
                        View Ticket
                      </Button>
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
