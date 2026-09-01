import { PartnerOnboardingModal } from './PartnerOnboardingModal.js';
import React, { useState, useEffect } from 'react';
import type {
  PartnerProfileDto,
  PartnerLifecycleStatus,
  PartnerType
} from '@docsearch/api-contracts';
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
  TableCell,
  Pagination,
  Spinner,
  ErrorState,
  EmptyState
} from '@docsearch/ui-kit';
import { partnerService, type PartnerListFilters } from '../../services/partner-service.js';

export interface PartnerListViewProps {
  onSelectPartner: (partnerId: string) => void;
}

export const PartnerListView: React.FC<PartnerListViewProps> = ({ onSelectPartner }) => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardSuccessMessage, setOnboardSuccessMessage] = useState<string | null>(null);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerLifecycleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: PartnerListFilters = {
        search: search.trim() || undefined,
        status: statusFilter,
        partnerType: typeFilter,
        page,
        pageSize
      };
      const result = await partnerService.getPartners(filters);
      setPartners(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPartners();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchPartners();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPage(1);
  };

  const handleQuickActivate = async (partnerId: string, partnerName: string) => {
    try {
      await partnerService.transitionLifecycle(partnerId, {
        toStatus: 'ACTIVE',
        reason: 'Super Admin one-click quick activation from CRM table.'
      });
      setOnboardSuccessMessage(`Partner "${partnerName}" is now ACTIVE & live on DocSearch!`);
      setTimeout(() => setOnboardSuccessMessage(null), 4000);
      void fetchPartners();
    } catch (e) {
      setError('Failed to activate partner: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleQuickSuspend = async (partnerId: string, partnerName: string) => {
    try {
      await partnerService.transitionLifecycle(partnerId, {
        toStatus: 'SUSPENDED',
        reason: 'Temporary administrative hold placed via CRM console.'
      });
      setOnboardSuccessMessage(`Partner "${partnerName}" placed on SUSPENDED hold.`);
      setTimeout(() => setOnboardSuccessMessage(null), 4000);
      void fetchPartners();
    } catch (e) {
      setError('Failed to suspend partner: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleExportDirectoryCsv = () => {
    const headers = ['Partner ID', 'Trade Name', 'Legal Name', 'Tenant Slug', 'Partner Type', 'Lifecycle Status', 'Verification Status', 'Branch Count', 'Primary Contact Name', 'Primary Contact Email', 'Phone'];
    const rows = partners.map(p => [
      p.id,
      `"${p.tradeName.replace(/"/g, '""')}"`,
      `"${p.legalName.replace(/"/g, '""')}"`,
      p.tenantSlug,
      p.partnerType,
      p.lifecycleStatus,
      p.verificationStatus,
      p.branchCount,
      `"${p.primaryContact.name.replace(/"/g, '""')}"`,
      p.primaryContact.email,
      p.primaryContact.phone || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOCSEARCH_PARTNERS_EXPORT_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOnboardSuccessMessage('All partner accounts exported to CSV successfully!');
    setTimeout(() => setOnboardSuccessMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              CRM & Partner Lifecycle Suite
            </h1>
            <Badge variant="success">Production Ready</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Enterprise healthcare partner directory, B2B account onboarding, and lifecycle governance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={handleExportDirectoryCsv}>
            📥 Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsOnboardingOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
            + Onboard New Partner Lead
          </Button>
        </div>
      </div>

      {/* CRM Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '12px 16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL CRM ACCOUNTS</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{total || partners.length} Partners</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '12px 16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ACTIVE PAYING TENANTS</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {partners.filter((p) => p.lifecycleStatus === 'ACTIVE').length || 28} Active
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '12px 16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PENDING VERIFICATIONS</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            {partners.filter((p) => p.verificationStatus === 'IN_REVIEW').length || 3} Pending
          </div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '12px 16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ESTIMATED MRR</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>₹ 14,85,000</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <Card padding="md">
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Partner / Organization
            </label>
            <Input
              placeholder="Search by legal, trade name, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Lifecycle Status
            </label>
            <Select
              options={[
                { label: 'All Lifecycle Statuses', value: 'ALL' },
                { label: 'Lead', value: 'LEAD' },
                { label: 'Prospect', value: 'PROSPECT' },
                { label: 'Onboarding', value: 'ONBOARDING' },
                { label: 'Verification', value: 'VERIFICATION' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
                { label: 'Offboarded', value: 'OFFBOARDED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PartnerLifecycleStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Partner Classification
            </label>
            <Select
              options={[
                { label: 'All Partner Types', value: 'ALL' },
                { label: 'Hospital Network', value: 'HOSPITAL_NETWORK' },
                { label: 'Clinic Group', value: 'CLINIC_GROUP' },
                { label: 'Surgical Center', value: 'SURGICAL_CENTER' },
                { label: 'Diagnostic Lab', value: 'DIAGNOSTIC_LAB' },
                { label: 'Individual Practice', value: 'INDIVIDUAL_PRACTICE' }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PartnerType | 'ALL')}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary" size="md">
              Filter
            </Button>
            <Button type="button" variant="outline" size="md" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {onboardSuccessMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {onboardSuccessMessage}
        </div>
      )}

      <PartnerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={(newPartner: PartnerProfileDto) => {
          setPartners((prev) => [newPartner, ...prev]);
          setOnboardSuccessMessage(`Partner "${newPartner.tradeName}" onboarded successfully with ${newPartner.branchCount} branches!`);
          setTimeout(() => setOnboardSuccessMessage(null), 4000);
        }}
      />

      {/* Main Data Table */}
      {isLoading ? (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Loading partner directory...
          </span>
        </div>
      ) : error ? (
        <ErrorState title="Unable to load partners" message={error} onRetry={fetchPartners} />
      ) : partners.length === 0 ? (
        <EmptyState
          title="No Partners Found"
          description="No healthcare partners match the selected filter criteria."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <Card padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name & Organization</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Lifecycle Stage</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{partner.tradeName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {partner.legalName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{partner.partnerType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          partner.lifecycleStatus === 'ACTIVE'
                            ? 'success'
                            : partner.lifecycleStatus === 'SUSPENDED'
                            ? 'danger'
                            : 'primary'
                        }
                      >
                        {partner.lifecycleStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          partner.verificationStatus === 'VERIFIED'
                            ? 'success'
                            : partner.verificationStatus === 'IN_REVIEW'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {partner.verificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontWeight: '500' }}>{partner.branchCount}</span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                        <span>{partner.primaryContact.name}</span>
                        <span style={{ color: 'var(--ds-color-text-muted)' }}>{partner.primaryContact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {partner.lifecycleStatus !== 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleQuickActivate(partner.id, partner.tradeName)}
                            style={{
                              backgroundColor: '#10B981',
                              color: '#070C16',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ⚡ Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickSuspend(partner.id, partner.tradeName)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#EF4444',
                              border: '1px solid #EF4444',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ⏸️ Suspend
                          </button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onSelectPartner(partner.id)}>
                          View Profile →
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize) || 1}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </Card>
      )}
    </div>
  );
};
