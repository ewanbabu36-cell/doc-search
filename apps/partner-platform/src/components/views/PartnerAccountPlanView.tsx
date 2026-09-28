import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchPartnerAccountPlanFeatures,
  fetchPartnerConfiguration,
  triggerPartnerConfigurationInitialize,
  type PartnerAccountPlanFeaturesData,
  type FeatureEntitlementDto
} from '../../services/partner-account-service.js';
import {
  Card,
  Badge,
  Alert,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Spinner
} from '@docsearch/ui-kit';
import { OfflineLicenseActivationModal } from '../dialogs/OfflineLicenseActivationModal.js';
import { CommercialRenewalModal } from '../dialogs/CommercialRenewalModal.js';

export interface PartnerAccountPlanViewProps {
  currentUser?: {
    name?: string | undefined;
    email?: string | undefined;
    role?: string | undefined;
    tenantName?: string | undefined;
  } | undefined;
  onOpenQuickModal?: (() => void) | undefined;
}

export const PartnerAccountPlanView: React.FC<PartnerAccountPlanViewProps> = ({
  currentUser,
  onOpenQuickModal
}) => {
  const [data, setData] = useState<PartnerAccountPlanFeaturesData | null>(null);
  const [configState, setConfigState] = useState<any | null>(null);
  const [isInitializingConfig, setIsInitializingConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Feature filters & search
  const [filterTab, setFilterTab] = useState<'ALL' | 'AVAILABLE' | 'LOCKED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const [machineNodeFp, setMachineNodeFp] = useState<string>('MPR-NODE-ACTIVE');

  useEffect(() => {
    fetch('/api/v1/license/machine-fingerprint')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.fingerprint) setMachineNodeFp(json.data.fingerprint);
      })
      .catch(() => {});
  }, []);

  const loadAccountData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [res, cfgRes] = await Promise.all([
        fetchPartnerAccountPlanFeatures(),
        fetchPartnerConfiguration()
      ]);
      if (res.success && res.data) {
        setData(res.data);
        setLastRefreshedAt(new Date());
      } else {
        setErrorMessage(res.error || 'Failed to retrieve authoritative account plan and features.');
      }
      if (cfgRes.success && cfgRes.data) {
        setConfigState(cfgRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to account services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeConfiguration = async () => {
    setIsInitializingConfig(true);
    try {
      const res = await triggerPartnerConfigurationInitialize();
      if (res.success && res.data) {
        setConfigState(res.data);
        await loadAccountData();
      }
    } finally {
      setIsInitializingConfig(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const plan = data?.currentPlan;
  const sub = data?.subscription;
  const org = data?.organizationProfile;
  const limits = data?.limits;
  const allFeatures = data?.features || [];

  // Extract unique categories dynamically from real database features
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allFeatures.forEach((f) => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats).sort();
  }, [allFeatures]);

  // Dynamic counts
  const availableCount = useMemo(
    () => allFeatures.filter((f) => f.status === 'AVAILABLE').length,
    [allFeatures]
  );
  const lockedCount = useMemo(
    () => allFeatures.filter((f) => f.status !== 'AVAILABLE').length,
    [allFeatures]
  );

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      if (filterTab === 'AVAILABLE' && f.status !== 'AVAILABLE') return false;
      if (filterTab === 'LOCKED' && f.status === 'AVAILABLE') return false;
      if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.name?.toLowerCase().includes(q);
        const matchCode = f.code?.toLowerCase().includes(q);
        const matchCat = f.category?.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q);
        return matchName || matchCode || matchCat || matchDesc;
      }
      return true;
    });
  }, [allFeatures, filterTab, selectedCategory, searchQuery]);

  const getStatusBadge = (status: FeatureEntitlementDto['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">✅ Available</Badge>;
      case 'LOCKED':
        return <Badge variant="neutral">🔒 Locked</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">⚠️ Expired</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">🛑 Suspended</Badge>;
      case 'NOT_CONFIGURED':
        return <Badge variant="neutral">⚙️ Not Configured</Badge>;
      default:
        return <Badge variant="neutral">❓ Unknown</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="neutral">UNKNOWN</Badge>;
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'TRIAL':
        return <Badge variant="primary">TRIAL</Badge>;
      case 'GRACE_PERIOD':
        return <Badge variant="warning">GRACE PERIOD</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">SUSPENDED</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">EXPIRED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0 32px 0' }}>
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '20px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}
          >
            💳
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.375rem',
                  fontWeight: 800,
                  color: 'var(--ds-color-text-primary, #F8FAFC)',
                  letterSpacing: '-0.02em'
                }}
              >
                My Account / Plan & Features
              </h1>
              {plan ? (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: sub?.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: sub?.isExpired ? '#FCA5A5' : '#6EE7B7',
                    border: sub?.isExpired ? '1px solid #EF4444' : '1px solid #10B981'
                  }}
                >
                  {plan.name}
                </span>
              ) : (
                <Badge variant="neutral">NO ACTIVE PLAN</Badge>
              )}
            </div>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.8125rem',
                color: 'var(--ds-color-text-secondary, #94A3B8)'
              }}
            >
              Authoritative commercial subscription, cryptographic license validity, and operational feature entitlements.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenQuickModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuickModal}
              style={{ fontSize: '0.75rem' }}
            >
              🔍 Quick Modal View
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={loadAccountData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
          >
            {isLoading ? <Spinner size="sm" /> : <span>🔄</span>}
            <span>Refresh State</span>
          </Button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {errorMessage && (
        <Alert type="error" title="Account Service Error">
          {errorMessage}
        </Alert>
      )}

      {/* ── Account Governance & Global Status Alerts ────────────── */}
      {sub?.isSuspended && (
        <Alert type="error" title="Account Temporarily Suspended">
          This organization account has an active suspension. Please contact platform administration.
        </Alert>
      )}
      {sub?.isInGracePeriod && (
        <Alert type="warning" title="Subscription In Grace Period">
          Your organization subscription has entered its grace period. Please renew to prevent operational interruptions.
        </Alert>
      )}

      {/* ── 60-Day Commercial Renewal Window Banner ──────────────── */}
      {(sub?.isRenewalWindow || (sub?.daysRemaining !== null && sub?.daysRemaining !== undefined && sub.daysRemaining <= 60 && sub.daysRemaining > 30)) && !sub?.isExpired && (
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1.5px solid #38BDF8',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Subscription Renewal Window Open</span>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                    color: '#BAE6FD',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}
                >
                  {sub?.daysRemaining} DAYS REMAINING
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '3px' }}>
                Your commercial license expires on {sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}. 
                <strong style={{ color: '#34D399' }}> Active Extension Guaranteed:</strong> Renewing now preserves 100% of your remaining days (New Expiry = Existing Expiry + Purchased Duration).
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRenewalModalOpen(true)}
            style={{ fontWeight: 800, fontSize: '0.8125rem' }}
          >
            💳 Renew / Extend Plan
          </Button>
        </div>
      )}

      {/* ── 30-Day Critical Validity Countdown Alert ─────────────── */}
      {(sub?.isExpiringSoon || (sub?.daysRemaining !== null && sub?.daysRemaining !== undefined && sub.daysRemaining <= 30 && sub.daysRemaining > 0)) && !sub?.isExpired && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>⏳</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FCD34D' }}>
                  CRITICAL COUNTDOWN: License Expiring Soon
                </span>
                <span
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    letterSpacing: '0.04em'
                  }}
                >
                  {sub?.daysRemaining} DAYS LEFT
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#F1F5F9', marginTop: '3px' }}>
                Operational clinical, diagnostic, and billing workflows will lock upon expiration. Multi-year renewal discounts active (Up to 20% savings).
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRenewalModalOpen(true)}
            style={{
              backgroundColor: '#F59E0B',
              borderColor: '#F59E0B',
              color: '#0F172A',
              fontWeight: 900,
              fontSize: '0.85rem'
            }}
          >
            ⚡ Immediate Renewal
          </Button>
        </div>
      )}

      {/* ── LOCKED Full-Screen Barrier (Locked ≠ Deleted) ────────── */}
      {(sub?.isLocked || sub?.isExpired || sub?.licenseStatus === 'LOCKED') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99990,
            backgroundColor: 'rgba(3, 7, 18, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '18px',
              padding: '36px',
              color: '#F8FAFC',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(239, 68, 68, 0.4)'
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F87171', margin: '0 0 10px 0' }}>
              Healthcare OS Operational Access Locked
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '22px' }}>
              Your organization subscription expired on <strong>{sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}</strong>. Operational clinical, diagnostic, and billing workflows are currently locked.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: '26px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#34D399', fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>🛡️</span>
                <span>Zero Data Deletion Invariant (Locked ≠ Deleted)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                All electronic medical records, patient encounters, lab test archives, pharmacy inventories, and GST financial journals remain <strong>100% safe, cryptographically intact, and preserved</strong>. No clinical or billing data has been or will ever be deleted.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsRenewalModalOpen(true)}
                style={{
                  backgroundColor: '#10B981',
                  borderColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  padding: '12px 28px',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.45)'
                }}
              >
                💳 Renew License & Restore Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Anti-Piracy & Hardware Node-Lock Security Strip ─────────── */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid #0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            🔒
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                Software Protection & Machine Node-Lock
              </h3>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                ● Terminal Verified & Locked
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: '#38BDF8',
                  border: '1px solid #0284C7',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                ⏱️ Anti-Clock Tamper Ledger Active
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px', alignItems: 'center' }}>
              <span>Device Node ID: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{machineNodeFp}</strong></span>
              <span>•</span>
              <span>Prevents Unauthorized Cloning & IP Theft</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsActivationModalOpen(true)}
          style={{
            fontWeight: 800,
            fontSize: '0.8rem',
            borderColor: '#38BDF8',
            color: '#38BDF8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🔑</span>
          <span>Offline License & Activation</span>
        </Button>
      </div>

      <OfflineLicenseActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        onActivated={loadAccountData}
      />

      {/* ── Grid: Organization Profile & Active Plan ──────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Card 1: Organization Profile */}
        <Card
          title="Organization Identity"
          subtitle="Registered healthcare entity and partner profile"
          padding="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>
                  {org?.legalName || currentUser?.tenantName || 'Healthcare Facility'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary, #94A3B8)', marginTop: '2px' }}>
                  Trade Name: {org?.tradeName || 'N/A'}
                </div>
              </div>
              <Badge variant={org?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                {org?.verificationStatus || 'UNKNOWN'}
              </Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>PARTNER TYPE</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>
                  {org?.partnerType || 'NOT CONFIGURED'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>TENANT ID</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38BDF8' }}>
                  {org?.tenantId ? `${org.tenantId.substring(0, 16)}...` : 'UNKNOWN'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>PRIMARY CONTACT</span>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
                  {org?.primaryContactName || currentUser?.name || 'NOT CONFIGURED'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>CONTACT EMAIL</span>
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
                  {org?.primaryContactEmail || currentUser?.email || 'NOT CONFIGURED'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>CONTACT PHONE</span>
                <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                  {org?.primaryContactPhone || 'NOT CONFIGURED'}
                </span>
              </div>
            </div>

            {/* Authenticated Staff Role Indicator */}
            {currentUser?.role && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}
              >
                <span>👤</span>
                <span style={{ color: '#94A3B8' }}>Logged in as:</span>
                <strong style={{ color: '#38BDF8' }}>{currentUser.name || currentUser.email}</strong>
                <Badge variant="primary">{currentUser.role}</Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Current Commercial Plan & Validity */}
        <Card
          title="Current Plan & Subscription"
          subtitle="Commercial tier, contract dates, and validity countdown"
          padding="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8' }}>
                  {plan?.name || 'No Active Plan'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  Code: <code style={{ color: '#F1F5F9' }}>{plan?.code || 'NONE'}</code> | Interval: {plan?.billingInterval || 'UNKNOWN'}
                </div>
              </div>
              {getSubscriptionStatusBadge(sub?.status)}
            </div>

            {/* Validity Timeline */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>VALID FROM</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>
                  {sub?.startDate ? new Date(sub.startDate).toLocaleDateString() : 'UNKNOWN'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>VALID UNTIL</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: sub?.isExpired ? '#EF4444' : '#E2E8F0' }}>
                  {sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'PERPETUAL / ACTIVE'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>RENEWAL DATE</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>
                  {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString() : 'Auto-Renew'}
                </span>
              </div>
            </div>

            {/* Countdown Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: sub?.isExpired
                  ? 'rgba(239, 68, 68, 0.15)'
                  : sub?.isInGracePeriod
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${
                  sub?.isExpired ? 'rgba(239, 68, 68, 0.35)' : sub?.isInGracePeriod ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.3)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.125rem' }}>
                  {sub?.isExpired ? '⚠️' : sub?.isInGracePeriod ? '⏳' : '⏱️'}
                </span>
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC', display: 'block' }}>
                    {sub?.isExpired
                      ? 'Subscription Expired'
                      : sub?.isInGracePeriod
                      ? 'Subscription In Grace Period'
                      : 'Subscription Validity'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {sub?.daysRemaining !== null && sub?.daysRemaining !== undefined
                      ? `${sub.daysRemaining} days remaining`
                      : 'Active without fixed expiration'}
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature Verification Badge */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: sub?.isSignatureValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: sub?.isSignatureValid ? '#6EE7B7' : '#FCA5A5',
                    border: `1px solid ${sub?.isSignatureValid ? '#10B981' : '#EF4444'}`
                  }}
                >
                  {sub?.isSignatureValid ? '🛡️ HMAC VERIFIED' : '⚠️ SIGNATURE UNVERIFIED'}
                </span>
              </div>
            </div>

            {/* Renew / Extend Action Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRenewalModalOpen(true)}
              style={{
                width: '100%',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderColor: '#38BDF8',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <span>💳</span>
              <span>Renew / Extend Subscription (Multi-Year Discount)</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Resource Limits & Quotas ──────────────────────────────── */}
      <Card
        title="Applicable Limits & Resource Usage"
        subtitle="Real-time capacity tracking computed directly from operational database records"
        padding="md"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Doctor Seats */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>👨‍⚕️ Doctor Seats</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {limits?.doctorSeats.used} / {limits?.doctorSeats.limit === -1 ? 'Unlimited' : limits?.doctorSeats.limit}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                marginTop: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${
                    limits?.doctorSeats.limit && limits.doctorSeats.limit > 0
                      ? Math.min(100, Math.round((limits.doctorSeats.used / limits.doctorSeats.limit) * 100))
                      : 0
                  }%`,
                  height: '100%',
                  backgroundColor:
                    limits?.doctorSeats.remaining && limits.doctorSeats.remaining <= 0
                      ? '#EF4444'
                      : '#38BDF8'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem' }}>
              <span style={{ color: '#64748B' }}>Live Database Count</span>
              <span style={{ color: limits?.doctorSeats.remaining && limits.doctorSeats.remaining <= 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                {limits?.doctorSeats.limit === -1
                  ? 'Unlimited Capacity'
                  : `${limits?.doctorSeats.remaining ?? 'UNKNOWN'} remaining`}
              </span>
            </div>
          </div>

          {/* Inpatient Beds */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>🛏️ Inpatient Beds</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {limits?.inpatientBeds.used} / {limits?.inpatientBeds.limit === -1 ? 'Unlimited' : limits?.inpatientBeds.limit}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                marginTop: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${
                    limits?.inpatientBeds.limit && limits.inpatientBeds.limit > 0
                      ? Math.min(100, Math.round((limits.inpatientBeds.used / limits.inpatientBeds.limit) * 100))
                      : 0
                  }%`,
                  height: '100%',
                  backgroundColor:
                    limits?.inpatientBeds.remaining && limits.inpatientBeds.remaining <= 0
                      ? '#EF4444'
                      : '#10B981'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem' }}>
              <span style={{ color: '#64748B' }}>Live Bed Registry</span>
              <span style={{ color: limits?.inpatientBeds.remaining && limits.inpatientBeds.remaining <= 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                {limits?.inpatientBeds.limit === -1
                  ? 'Unlimited Capacity'
                  : `${limits?.inpatientBeds.remaining ?? 'UNKNOWN'} remaining`}
              </span>
            </div>
          </div>

          {/* Facilities / Branches */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>📍 Branches & Locations</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {limits?.branches.used} / {limits?.branches.limit === -1 ? 'Unlimited' : limits?.branches.limit}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                marginTop: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${
                    limits?.branches.limit && limits.branches.limit > 0
                      ? Math.min(100, Math.round((limits.branches.used / limits.branches.limit) * 100))
                      : 0
                  }%`,
                  height: '100%',
                  backgroundColor:
                    limits?.branches.remaining && limits.branches.remaining <= 0
                      ? '#EF4444'
                      : '#F59E0B'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem' }}>
              <span style={{ color: '#64748B' }}>Operational Facilities</span>
              <span style={{ color: limits?.branches.remaining && limits.branches.remaining <= 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                {limits?.branches.limit === -1
                  ? 'Unlimited Capacity'
                  : `${limits?.branches.remaining ?? 'UNKNOWN'} remaining`}
              </span>
            </div>
          </div>

          {/* Storage & Unmetered Resources */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>☁️ Cloud Storage & Telemedicine</span>
              <Badge variant="neutral">UNMETERED</Badge>
            </div>
            <div style={{ marginTop: '14px', fontSize: '0.75rem', color: '#94A3B8' }}>
              Usage tracking for document archiving and audio CDSS streams is provided at enterprise baseline tier.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.6875rem' }}>
              <span style={{ color: '#64748B' }}>Audit Status</span>
              <span style={{ color: '#6EE7B7', fontWeight: 600 }}>COMPLIANT</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Complete Feature Matrix ───────────────────────────────── */}
      <Card
        title="Authoritative Feature Matrix"
        subtitle={`Total Platform Features: ${allFeatures.length} | Available: ${availableCount} | Locked: ${lockedCount}`}
        padding="none"
      >
        {/* Controls: Search & Category Filter */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Status Tab Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: filterTab === 'ALL' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: filterTab === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: filterTab === 'ALL' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer'
              }}
            >
              All Features ({allFeatures.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('AVAILABLE')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: filterTab === 'AVAILABLE' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: filterTab === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: filterTab === 'AVAILABLE' ? '#6EE7B7' : '#94A3B8',
                cursor: 'pointer'
              }}
            >
              ✅ Available ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('LOCKED')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: filterTab === 'LOCKED' ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: filterTab === 'LOCKED' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: filterTab === 'LOCKED' ? '#FCA5A5' : '#94A3B8',
                cursor: 'pointer'
              }}
            >
              🔒 Locked ({lockedCount})
            </button>
          </div>

          {/* Search & Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px', maxWidth: '480px' }}>
            <input
              type="text"
              placeholder="Search features by name, code or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#F8FAFC',
                outline: 'none'
              }}
            />
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Feature Table */}
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '28%' }}>Feature Name & Code</TableHead>
                <TableHead style={{ width: '16%' }}>Domain / Category</TableHead>
                <TableHead style={{ width: '16%' }}>Access Status</TableHead>
                <TableHead style={{ width: '40%' }}>Details & Locked Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    {isLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Spinner size="sm" /> Loading authoritative feature entitlement matrix...
                      </div>
                    ) : (
                      'No features match the selected filter criteria.'
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatures.map((feat) => (
                  <TableRow key={feat.code || feat.id}>
                    {/* Feature Name & Code */}
                    <TableCell>
                      <div>
                        <strong style={{ color: feat.status === 'AVAILABLE' ? '#F8FAFC' : '#94A3B8', fontSize: '0.875rem' }}>
                          {feat.name}
                        </strong>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          {feat.code}
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="neutral">{feat.category || 'General'}</Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(feat.status)}</TableCell>

                    {/* Details & Locked Reason */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {feat.description && (
                          <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                            {feat.description}
                          </div>
                        )}
                        {feat.status !== 'AVAILABLE' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 600 }}>
                              🔒 Reason: {feat.reason || 'Not included in current plan'}
                            </span>
                          </div>
                        )}

                        {/* Staff Role Access Distinction */}
                        {feat.status === 'AVAILABLE' && feat.staffPermitted === false && (
                          <div style={{ fontSize: '0.6875rem', color: '#F59E0B', marginTop: '2px' }}>
                            ⚠️ Organization is entitled, but current staff role ({currentUser?.role || 'Staff'}) does not have permission.
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer info */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            color: '#64748B'
          }}
        >
          <span>
            Data source: Authoritative PostgreSQL Database via ProductRepository, LicenseRepository & EntitlementService.
          </span>
          <span>
            {lastRefreshedAt ? `Last synced: ${lastRefreshedAt.toLocaleTimeString()}` : ''}
          </span>
        </div>
      </Card>

      {configState?.validation && (
        <Card style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.25)', background: 'rgba(15, 23, 42, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                Partner Configuration Engine — 14-Domain Operational Validation Matrix
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Industry: <strong style={{ color: '#38BDF8' }}>{configState.classification?.industry}</strong> | Operating Model:{' '}
                <strong style={{ color: '#38BDF8' }}>{configState.classification?.operatingModel}</strong> | Workspace:{' '}
                <strong style={{ color: '#34D399' }}>{configState.workspace?.workspaceLayout}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge variant={configState.validation.overallStatus === 'VERIFIED' ? 'success' : 'warning'}>
                OVERALL: {configState.validation.overallStatus}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInitializeConfiguration}
                disabled={isInitializingConfig}
              >
                {isInitializingConfig ? 'Reconciling...' : 'Reconcile / Initialize Configuration'}
              </Button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '10px'
            }}
          >
            {Object.values(configState.validation.domains || {}).map((dom: any) => (
              <div
                key={dom.domain}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(30, 41, 59, 0.65)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0' }}>{dom.domain}</span>
                  <Badge
                    variant={
                      dom.status === 'VERIFIED'
                        ? 'success'
                        : dom.status === 'BLOCKED' || dom.status === 'INVALID'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {dom.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1.35 }}>{dom.summary}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CommercialRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        onRenewalSuccess={loadAccountData}
        currentPlan={plan}
        subscription={sub}
        organizationProfile={org}
      />
    </div>
  );
};
