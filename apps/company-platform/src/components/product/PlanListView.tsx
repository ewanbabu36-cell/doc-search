import React, { useState } from 'react';
import type { PlanDto, ProductDto, PlanStatus } from '@docsearch/api-contracts';
import { PlanCustomizerModal } from './PlanCustomizerModal.js';
import {
  Card,
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

export interface PlanListViewProps {
  plans: PlanDto[];
  products: ProductDto[];
  onSelectPlan: (planId: string) => void;
}

export const PlanListView: React.FC<PlanListViewProps> = ({
  plans,
  products,
  onSelectPlan
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<PlanStatus | 'ALL'>('ALL');
  const [localPlans, setLocalPlans] = useState<PlanDto[]>(plans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredPlans = (localPlans.length > 0 ? localPlans : plans).filter((p) => {
    if (selectedProductId !== 'ALL' && p.productId !== selectedProductId) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>Healthcare Subscription Plans & Tiers</h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{filteredPlans.length} active subscription tiers published across platforms</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPlan(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}
        >
          ➕ Create New Custom Plan / Tier
        </Button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {successMsg}
        </div>
      )}

      <PlanCustomizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlan={editingPlan}
        products={products}
        onSuccess={(saved) => {
          setLocalPlans((prev) => {
            const list = prev.length > 0 ? prev : plans;
            const exists = list.some((p) => p.id === saved.id);
            return exists ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list];
          });
          setSuccessMsg(`Plan "${saved.name}" (${saved.code}) saved & published successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Filter by Product
            </label>
            <Select
              options={[
                { label: 'All Products', value: 'ALL' },
                ...products.map((pr) => ({ label: pr.name, value: pr.id }))
              ]}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Plan Status
            </label>
            <Select
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Deprecated', value: 'DEPRECATED' },
                { label: 'Archived', value: 'ARCHIVED' }
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PlanStatus | 'ALL')}
            />
          </div>
        </div>
      </Card>

      {/* Plan Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name & Code</TableHead>
                <TableHead>Product Line</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entitlements</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No plans found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((pl) => (
                  <TableRow key={pl.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{pl.name}</strong>
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {pl.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem' }}>{pl.productName ?? 'Core Platform'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">v{pl.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pl.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {pl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span>{pl.entitlementCount} grants</span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(pl);
                            setIsModalOpen(true);
                          }}
                          style={{ borderColor: '#06B6D4', color: '#06B6D4', fontWeight: 700 }}
                        >
                          ✏️ Edit Plan
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onSelectPlan(pl.id)}>
                          View Profile
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
