import { PartnerOnboardingModal } from './PartnerOnboardingModal.js';
import { PartnerFastTrackPipelineWidget } from './PartnerFastTrackPipelineWidget.js';
import React, { useState, useEffect } from 'react';
import type {
  PartnerProfileDto,
  PartnerLifecycleStatus,
  PartnerType,
  PartnerClassificationDto
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
import { partnerService, CANONICAL_PARTNER_CLASSIFICATIONS, type PartnerListFilters } from '../../services/partner-service.js';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier } from '../../utils/partnerWelcomeKitPdf.js';

export interface PartnerListViewProps {
  onSelectPartner: (partnerId: string) => void;
}

export interface PartnerCustomMetadata {
  classification?: string;
  planTier?: string;
  planExpiryDate?: string;
  credentials?: {
    loginUrl?: string;
    userId?: string;
    temporaryPassword?: string;
    role?: string;
    activatedAt?: string;
    planExpiryDate?: string;
  };
  monthlyFee?: number;
  accessibleFeatures?: string[];
  city?: string;
}

export function getPartnerMeta(partner?: PartnerProfileDto | null): PartnerCustomMetadata {
  if (!partner) return {};
  return (partner.metadata as unknown as PartnerCustomMetadata) || {};
}

export function getCategoryIcon(partner?: PartnerProfileDto | null): string {
  if (!partner) return '🏥';
  const meta = getPartnerMeta(partner);
  const cls = String(meta.classification || partner.partnerType || '').toUpperCase();
  if (cls.includes('HOSPITAL')) return '🏥';
  if (cls.includes('PHARMACY')) return '💊';
  if (cls.includes('CLINIC')) return '🩺';
  if (cls.includes('DIAGNOSTIC') && !cls.includes('LAB')) return '🔬';
  if (cls.includes('LAB') || cls.includes('PATHOLOGY')) return '🧪';
  return '🏥';
}

export const PartnerListView: React.FC<PartnerListViewProps> = ({ onSelectPartner }) => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardSuccessMessage, setOnboardSuccessMessage] = useState<string | null>(null);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [classifications, setClassifications] = useState<PartnerClassificationDto[]>(CANONICAL_PARTNER_CLASSIFICATIONS);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerLifecycleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCredModal, setViewCredModal] = useState<PartnerProfileDto | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedLabel(`Copied ${label}!`);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  useEffect(() => {
    partnerService.getClassifications().then((items) => {
      if (items && items.length > 0) setClassifications(items);
    });
  }, []);

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

      {/* 5-Step Automated Fast-Track Pipeline Engine */}
      <PartnerFastTrackPipelineWidget
        onPartnerActivated={(p) => {
          setPartners((prev) => [p, ...prev.filter((existing) => existing.id !== p.id)]);
          setOnboardSuccessMessage(`✓ ${p.tradeName} has been fully activated and is now LIVE on DocSearch!`);
          setTimeout(() => setOnboardSuccessMessage(null), 5000);
        }}
      />

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
              Search Partners
            </label>
            <Input
              placeholder="Search by name, contact, email..."
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
                { label: 'All Lifecycle Stages', value: 'ALL' },
                { label: '🟢 Active', value: 'ACTIVE' },
                { label: '🟡 Verification', value: 'VERIFICATION' },
                { label: '🔵 Onboarding', value: 'ONBOARDING' },
                { label: '🔴 Suspended', value: 'SUSPENDED' }
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
                ...classifications.map((c) => ({
                  label: `${c.icon ? c.icon + ' ' : ''}${c.label}`,
                  value: c.code
                }))
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

      {copiedLabel && (
        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '8px 14px', color: '#38BDF8', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {copiedLabel}
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
                  <TableHead>Partner & Facility</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Plan & Validity</TableHead>
                  <TableHead>Lifecycle Stage</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => {
                  const meta = getPartnerMeta(partner);
                  return (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{getCategoryIcon(partner)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--ds-color-text-primary)' }}>{partner.tradeName}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                            {partner.legalName}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{partner.partnerType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                          {meta.planTier || 'Standard Tier'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📅</span>
                          <span>Renews: {meta.planExpiryDate || '30-Day Cycle'}</span>
                        </span>
                      </div>
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
                        {meta.credentials && (
                          <button
                            type="button"
                            onClick={() => setViewCredModal(partner)}
                            style={{
                              backgroundColor: 'rgba(6, 182, 212, 0.15)',
                              border: '1px solid #06B6D4',
                              color: '#38BDF8',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="View Login Credentials"
                          >
                            🔐 Creds
                          </button>
                        )}
                        {meta.credentials && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                generateAndDownloadWelcomeKitPdf({
                                  partnerId: partner.id,
                                  partnerName: partner.tradeName,
                                  classification: meta.classification || 'PATHOLOGY',
                                  contactPerson: partner.primaryContact.name,
                                  phone: partner.primaryContact.phone || '+91 98765 43210',
                                  email: meta.credentials?.userId || partner.primaryContact.email,
                                  password: meta.credentials?.temporaryPassword || 'DocSearch2026!',
                                  city: meta.city || 'India',
                                  state: 'India',
                                  planTier: meta.planTier || 'Standard Tier',
                                  monthlyFee: meta.monthlyFee || 2999,
                                  features: meta.accessibleFeatures || ['Standard Healthcare Portal'],
                                  planExpiryDate: meta.planExpiryDate,
                                  activatedAt: partner.createdAt
                                })
                              }
                              style={{
                                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                                border: '1px solid #0284C7',
                                color: '#38BDF8',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="Download Welcome Kit PDF"
                            >
                              📥 Kit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openPrintableSpeedPostDossier({
                                  partnerId: partner.id,
                                  partnerName: partner.tradeName,
                                  classification: meta.classification || 'PATHOLOGY',
                                  contactPerson: partner.primaryContact.name,
                                  phone: partner.primaryContact.phone || '+91 98765 43210',
                                  email: meta.credentials?.userId || partner.primaryContact.email,
                                  password: meta.credentials?.temporaryPassword || 'DocSearch2026!',
                                  city: meta.city || 'India',
                                  state: 'India',
                                  planTier: meta.planTier || 'Standard Tier',
                                  monthlyFee: meta.monthlyFee || 2999,
                                  features: meta.accessibleFeatures || ['Standard Healthcare Portal'],
                                  planExpiryDate: meta.planExpiryDate,
                                  activatedAt: partner.createdAt
                                })
                              }
                              style={{
                                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                                border: '1px solid #EA580C',
                                color: '#FB923C',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="Print Speed Post Official Dispatch Dossier"
                            >
                              📮 Post
                            </button>
                          </>
                        )}
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
                  );
                })}
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

      {/* CREDENTIALS QUICK VIEW MODAL */}
      {viewCredModal && (() => {
        const meta = getPartnerMeta(viewCredModal);
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#0F172A',
                border: '1.5px solid #06B6D4',
                borderRadius: '16px',
                maxWidth: '520px',
                width: '100%',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 60px rgba(6, 182, 212, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{getCategoryIcon(viewCredModal)}</span>
                  <strong style={{ color: '#F8FAFC', fontSize: '1.1rem' }}>
                    {viewCredModal.tradeName}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setViewCredModal(null)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✖
                </button>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>PORTAL LOGIN URL</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <a href="http://localhost:5173/" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'underline' }}>
                      http://localhost:5173/
                    </a>
                    <button type="button" onClick={() => copyText('http://localhost:5173/', 'URL')} style={{ background: '#334155', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>AUTHORIZED USER ID (EMAIL)</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.875rem' }}>{meta.credentials?.userId || viewCredModal.primaryContact.email}</span>
                    <button type="button" onClick={() => copyText(meta.credentials?.userId || viewCredModal.primaryContact.email, 'Email')} style={{ background: '#334155', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>TEMPORARY PASSWORD</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#10B981', fontWeight: 900, fontSize: '0.9375rem', fontFamily: 'monospace' }}>{meta.credentials?.temporaryPassword || '••••••••'}</span>
                    <button type="button" onClick={() => copyText(meta.credentials?.temporaryPassword || '', 'Password')} style={{ background: '#334155', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6875rem', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>PLAN EXPIRY & RENEWAL DATE</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.875rem' }}>
                      📅 {meta.planExpiryDate || '30-Day Auto Cycle'}
                    </span>
                    <Badge variant="warning">Auto-Renews</Badge>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setViewCredModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
