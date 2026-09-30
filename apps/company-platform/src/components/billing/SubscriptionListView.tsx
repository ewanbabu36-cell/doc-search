import React, { useState, useEffect } from 'react';
import type { SubscriptionDto, SubscriptionStatus, PartnerProfileDto } from '@docsearch/api-contracts';
import { SubscriptionCustomizerModal } from './SubscriptionCustomizerModal.js';
import { partnerService } from '../../services/partner-service.js';
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
  const [dbPartners, setDbPartners] = useState<PartnerProfileDto[]>([]);
  const [localSubscriptions, setLocalSubscriptions] = useState<SubscriptionDto[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_partner_subscriptions');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback
        }
      }
    }
    return subscriptions;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionDto | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    partnerService
      .getPartners({ pageSize: 50 })
      .then((res) => setDbPartners(res.items || []))
      .catch((err) => console.error('Failed to load DB partners for pipeline:', err));
  }, []);

  const totalPartnersCount = dbPartners.length > 0 ? dbPartners.length : 2;
  const activeSubsCount = localSubscriptions.filter((s) => s.status === 'ACTIVE').length;
  const freeCandidatesCount = Math.max(0, totalPartnersCount - activeSubsCount);

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
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
            Healthcare Subscription Contracts & RCM
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            {filtered.length} active partner recurring billing contracts
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingSub(null);
            setIsModalOpen(true);
          }}
        >
          ➕ Create / Upgrade Partner Subscription
        </Button>
      </div>

      {/* Freemium-to-Enterprise Upgrade Pipeline Strip */}
      <div
        style={{
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              DB REGISTERED PARTNERS
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              {totalPartnersCount} Hospitals / Clinics
            </span>
          </div>
          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '18px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              ACTIVE PAID ENTERPRISE
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>
              {activeSubsCount} Contracts Active
            </span>
          </div>
          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '18px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#10B981', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
              FREE TIER UPGRADE CANDIDATES
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
              {freeCandidatesCount} Eligible for Upgrade
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingSub(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#070C16', fontWeight: 800 }}
        >
          ⚡ Upgrade Free Partner to Enterprise
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
        existingSubscriptions={localSubscriptions}
        onSuccess={(saved) => {
          setLocalSubscriptions((prev) => {
            const list = prev.length > 0 ? prev : subscriptions;
            const exists = list.some((s) => s.id === saved.id);
            const updated = exists ? list.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...list];
            if (typeof window !== 'undefined') {
              localStorage.setItem('docsearch_partner_subscriptions', JSON.stringify(updated));
            }
            return updated;
          });
          setSuccessMsg(`Subscription for "${saved.partnerTradeName}" (${saved.planName}) saved & enforced successfully!`);
          setTimeout(() => setSuccessMsg(null), 4500);
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
                <TableHead>Healthcare Partner</TableHead>
                <TableHead>Assigned Tier & Quotas</TableHead>
                <TableHead>Commercial Value & Cycle</TableHead>
                <TableHead>Status & SLA</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No subscriptions found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const meta = (s.metadata || {}) as any;
                  const contractVal = Number(meta.grossInvoiceTotal) || Number(meta.contractValueInr) || 250000;
                  const doctorSeats = meta.doctorSeats || 25;
                  const inpatientBeds = meta.inpatientBeds ?? 150;
                  const slaTier = meta.slaTier === 'SLA_99_99' ? '99.99% ICU' : '99.9% High Avail';

                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: 'var(--ds-color-text-primary)' }}>{s.partnerTradeName}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#06B6D4' }}>{s.partnerTenantSlug}.docsearch.health</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Badge variant="primary">{s.planName}</Badge>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: '#0F172A', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                              👨‍⚕️ {doctorSeats} Docs
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: '#0F172A', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                              🛏️ {inpatientBeds} Beds
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#10B981', fontSize: '0.875rem' }}>
                            ₹{contractVal.toLocaleString('en-IN')}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {s.billingCycle} {meta.renewalMonths ? `(${meta.renewalMonths}M)` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {s.status}
                          </Badge>
                          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            🛡️ {slaTier}
                          </span>
                        </div>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
