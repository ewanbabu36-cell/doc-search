import React, { useState } from 'react';
import type { SubscriptionDto, SubscriptionStatus } from '@docsearch/api-contracts';
import { SubscriptionCustomizerModal } from './SubscriptionCustomizerModal.js';
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

export interface SubscriptionListViewProps {
  subscriptions: SubscriptionDto[];
  onSelectSubscription: (subscriptionId: string) => void;
}

export const SubscriptionListView: React.FC<SubscriptionListViewProps> = ({
  subscriptions,
  onSelectSubscription
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [localSubscriptions, setLocalSubscriptions] = useState<SubscriptionDto[]>(subscriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionDto | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = (localSubscriptions.length > 0 ? localSubscriptions : subscriptions).filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !s.partnerTradeName.toLowerCase().includes(q) &&
        !s.partnerTenantSlug.toLowerCase().includes(q) &&
        !s.productName.toLowerCase().includes(q) &&
        !s.planName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Healthcare Subscription Contracts & RCM</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filtered.length} active partner recurring billing contracts</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingSub(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
        >
          ➕ Create New Healthcare Subscription
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      <SubscriptionCustomizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSubscription={editingSub}
        onSuccess={(saved) => {
          setLocalSubscriptions((prev) => {
            const list = prev.length > 0 ? prev : subscriptions;
            const exists = list.some((s) => s.id === saved.id);
            return exists ? list.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...list];
          });
          setSuccessMsg(`Subscription for "${saved.partnerTradeName}" (${saved.planName}) saved successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Search Subscriptions</label>
            <Input placeholder="Search partner, product, or plan tier..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>Status</label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Paused', value: 'PAUSED' },
                { label: 'Suspended', value: 'SUSPENDED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Organization</TableHead>
                <TableHead>Product Line</TableHead>
                <TableHead>Assigned Plan Tier</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No subscriptions found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.partnerTradeName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{s.partnerTenantSlug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{s.productName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{s.planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{s.billingCycle}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
                        {s.renewalDate ? new Date(s.renewalDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSub(s);
                            setIsModalOpen(true);
                          }}
                          style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 700 }}
                        >
                          ✏️ Customize
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onSelectSubscription(s.id)}>
                          View Details
                        </Button>
                      </div>
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
